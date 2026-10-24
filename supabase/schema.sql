-- ERA shared Twitter-style feed, profiles, reactions, and comments.
-- Run once in Supabase Dashboard > SQL Editor. Requires Anonymous Sign-Ins enabled.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null,
  account_type text not null default 'personal' check (account_type in ('personal', 'business')),
  business_category text not null default '',
  bio text not null default '',
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 40),
  constraint profiles_bio_length check (char_length(bio) <= 160)
);
create unique index if not exists profiles_username_lower_unique on public.profiles (lower(username));

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null constraint posts_author_id_fkey references public.profiles(id) on delete cascade,
  body text not null default '',
  image_path text,
  comments_count integer not null default 0 check (comments_count >= 0),
  likes_count integer not null default 0 check (likes_count >= 0),
  reposts_count integer not null default 0 check (reposts_count >= 0),
  created_at timestamptz not null default now(),
  constraint posts_body_length check (char_length(body) <= 500),
  constraint posts_has_content check (char_length(trim(body)) > 0 or image_path is not null)
);
create index if not exists posts_created_at_desc on public.posts (created_at desc);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null constraint comments_post_id_fkey references public.posts(id) on delete cascade,
  author_id uuid not null constraint comments_author_id_fkey references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 280),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_created_at on public.comments (post_id, created_at);

create table if not exists public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('like', 'repost')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, reaction)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null constraint conversations_user_a_fkey references public.profiles(id) on delete cascade,
  user_b uuid not null constraint conversations_user_b_fkey references public.profiles(id) on delete cascade,
  last_message text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint conversations_two_distinct_users check (user_a < user_b),
  constraint conversations_unique_pair unique (user_a, user_b)
);
create index if not exists conversations_user_a_updated on public.conversations (user_a, updated_at desc);
create index if not exists conversations_user_b_updated on public.conversations (user_b, updated_at desc);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null constraint direct_messages_conversation_id_fkey references public.conversations(id) on delete cascade,
  sender_id uuid not null constraint direct_messages_sender_id_fkey references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists direct_messages_conversation_created on public.direct_messages (conversation_id, created_at);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.conversations enable row level security;
alter table public.direct_messages enable row level security;

grant usage on schema public to authenticated;
grant select on public.profiles, public.posts, public.comments, public.post_reactions to authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.direct_messages to authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, delete on public.posts to authenticated;
grant insert, delete on public.comments, public.post_reactions to authenticated;

drop policy if exists "Profiles are visible to community users" on public.profiles;
create policy "Profiles are visible to community users" on public.profiles for select to authenticated using (true);
drop policy if exists "Users create their own profile" on public.profiles;
create policy "Users create their own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Community users can read posts" on public.posts;
create policy "Community users can read posts" on public.posts for select to authenticated using (true);
drop policy if exists "Users create their own posts" on public.posts;
create policy "Users create their own posts" on public.posts for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "Users update their own posts" on public.posts;
create policy "Users update their own posts" on public.posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists "Users delete their own posts" on public.posts;
create policy "Users delete their own posts" on public.posts for delete to authenticated using (author_id = auth.uid());

drop policy if exists "Community users can read comments" on public.comments;
create policy "Community users can read comments" on public.comments for select to authenticated using (true);
drop policy if exists "Users create their own comments" on public.comments;
create policy "Users create their own comments" on public.comments for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "Users delete their own comments" on public.comments;
create policy "Users delete their own comments" on public.comments for delete to authenticated using (author_id = auth.uid());

drop policy if exists "Community users can read reactions" on public.post_reactions;
create policy "Community users can read reactions" on public.post_reactions for select to authenticated using (true);
drop policy if exists "Users create their own reactions" on public.post_reactions;
create policy "Users create their own reactions" on public.post_reactions for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Users delete their own reactions" on public.post_reactions;
create policy "Users delete their own reactions" on public.post_reactions for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Conversation participants can read conversations" on public.conversations;
create policy "Conversation participants can read conversations" on public.conversations for select to authenticated using (auth.uid() in (user_a, user_b));
drop policy if exists "Users can start their own conversations" on public.conversations;
create policy "Users can start their own conversations" on public.conversations for insert to authenticated with check (auth.uid() in (user_a, user_b));
drop policy if exists "Conversation participants can read messages" on public.direct_messages;
create policy "Conversation participants can read messages" on public.direct_messages for select to authenticated
using (exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));
drop policy if exists "Participants can send their own messages" on public.direct_messages;
create policy "Participants can send their own messages" on public.direct_messages for insert to authenticated
with check (sender_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));

create or replace function public.era_update_conversation_last_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message = left(NEW.body, 160), updated_at = NEW.created_at where id = NEW.conversation_id;
  return NEW;
end;
$$;
drop trigger if exists era_direct_message_last_message on public.direct_messages;
create trigger era_direct_message_last_message after insert on public.direct_messages for each row execute function public.era_update_conversation_last_message();

create or replace function public.era_update_post_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_TABLE_NAME = 'comments' then
    if TG_OP = 'INSERT' then update public.posts set comments_count = comments_count + 1 where id = NEW.post_id;
    elsif TG_OP = 'DELETE' then update public.posts set comments_count = greatest(0, comments_count - 1) where id = OLD.post_id;
    end if;
  elsif TG_TABLE_NAME = 'post_reactions' then
    if TG_OP = 'INSERT' and NEW.reaction = 'like' then update public.posts set likes_count = likes_count + 1 where id = NEW.post_id;
    elsif TG_OP = 'DELETE' and OLD.reaction = 'like' then update public.posts set likes_count = greatest(0, likes_count - 1) where id = OLD.post_id;
    elsif TG_OP = 'INSERT' and NEW.reaction = 'repost' then update public.posts set reposts_count = reposts_count + 1 where id = NEW.post_id;
    elsif TG_OP = 'DELETE' and OLD.reaction = 'repost' then update public.posts set reposts_count = greatest(0, reposts_count - 1) where id = OLD.post_id;
    end if;
  end if;
  if TG_OP = 'DELETE' then return OLD; end if;
  return NEW;
end;
$$;
drop trigger if exists era_comments_count on public.comments;
create trigger era_comments_count after insert or delete on public.comments for each row execute function public.era_update_post_counts();
drop trigger if exists era_reactions_count on public.post_reactions;
create trigger era_reactions_count after insert or delete on public.post_reactions for each row execute function public.era_update_post_counts();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('era-social-media', 'era-social-media', true, 524288, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 524288, allowed_mime_types = array['image/jpeg'];
drop policy if exists "ERA users upload images to their own folder" on storage.objects;
create policy "ERA users upload images to their own folder" on storage.objects for insert to authenticated
with check (bucket_id = 'era-social-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "ERA users delete their own images" on storage.objects;
create policy "ERA users delete their own images" on storage.objects for delete to authenticated
using (bucket_id = 'era-social-media' and (storage.foldername(name))[1] = auth.uid()::text);

do $$ begin
  alter publication supabase_realtime add table public.posts;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.comments;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.post_reactions;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.direct_messages;
exception when duplicate_object then null;
end $$;
