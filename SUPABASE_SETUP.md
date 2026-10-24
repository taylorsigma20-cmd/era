# ERA community backend setup

1. In the Supabase project, open **Authentication → Sign In / Providers** and enable **Anonymous Sign-Ins**. ERA uses a per-installation anonymous login; it does not ask players for email or a password.
2. Open **SQL Editor**, paste the complete contents of `supabase/schema.sql`, and run it. The script creates the shared profiles, posts, reactions, comments, image bucket, row security policies, count triggers, and Realtime publication entries.
3. Restart ERA and open Twitter. New profiles, posts, likes, reposts, and comments are stored in Supabase and become visible to other ERA users connected to this project. Realtime updates require the `posts`, `comments`, and `post_reactions` tables in `supabase_realtime`.

The supplied URL and publishable key are included in the desktop app. Never put a Supabase secret/service key or database password in ERA or its source. Row Level Security is required for the publishable key to be safe.

Anonymous accounts are tied to that ERA installation. If a user removes the local app data or changes computers, the anonymous account cannot be recovered; the user will need a new cloud profile/username.
