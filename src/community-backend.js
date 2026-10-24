'use strict';

const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const { safeStorage } = require('electron');
const { createClient } = require('@supabase/supabase-js');
const config = require('./community-config');

let client;
let realtimeChannel;
let userPromise;
let notify = () => {};

function authFile(app) { return path.join(app.getPath('userData'), 'community-session.bin'); }
function secureSessionStorage(app) {
  return {
    async getItem(key) {
      try {
        if (!safeStorage.isEncryptionAvailable()) return null;
        const stored = JSON.parse(await fs.readFile(authFile(app), 'utf8'));
        return stored.key === key ? safeStorage.decryptString(Buffer.from(stored.value, 'base64')) : null;
      } catch { return null; }
    },
    async setItem(key, value) {
      if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows secure storage is unavailable; the community login was not saved.');
      const file = authFile(app); await fs.mkdir(path.dirname(file), { recursive: true });
      const encrypted = safeStorage.encryptString(String(value)).toString('base64');
      const temp = `${file}.${process.pid}.tmp`;
      await fs.writeFile(temp, JSON.stringify({ key, value: encrypted }), { mode: 0o600 });
      await fs.rename(temp, file);
    },
    async removeItem(key) {
      try { const stored = JSON.parse(await fs.readFile(authFile(app), 'utf8')); if (stored.key === key) await fs.unlink(authFile(app)); } catch { /* Already signed out. */ }
    }
  };
}

function getClient(app) {
  if (client) return client;
  client = createClient(config.url, config.publishableKey, {
    auth: { storage: secureSessionStorage(app), persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    realtime: { params: { eventsPerSecond: 5 } }
  });
  return client;
}

function assertUuid(value, name = 'ID') {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error(`Invalid ${name}.`);
  return value;
}
function throwIfError(error) { if (error) throw new Error(error.message || 'The community service request failed.'); }
function signedInUser(app) {
  if (userPromise) return userPromise;
  userPromise = (async () => {
    const supabase = getClient(app);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throwIfError(sessionError);
    if (sessionData.session?.user) return sessionData.session.user;
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error(/anonymous/i.test(error.message) ? 'Enable Anonymous Sign-Ins in Supabase Authentication settings, then restart ERA.' : error.message);
    if (!data.user) throw new Error('Supabase did not create a community user.');
    return data.user;
  })().finally(() => { userPromise = null; });
  return userPromise;
}
async function myProfile(app) {
  const supabase = getClient(app), user = await signedInUser(app);
  const { data, error } = await supabase.from('profiles').select('id,username,display_name,account_type,business_category,bio').eq('id', user.id).maybeSingle();
  throwIfError(error);
  return data;
}

function createCommunityBackend(app) {
  return {
    async ensure() {
      const user = await signedInUser(app);
      const profile = await myProfile(app);
      return { id: user.id, profile, anonymous: Boolean(user.is_anonymous) };
    },
    async saveProfile(input = {}) {
      const supabase = getClient(app), user = await signedInUser(app);
      const displayName = String(input.displayName || '').trim().slice(0, 40);
      const username = String(input.username || '').trim().replace(/^@/, '').toLowerCase();
      const accountType = input.accountType === 'business' ? 'business' : 'personal';
      const category = accountType === 'business' ? String(input.category || '').trim().slice(0, 32) : '';
      const bio = accountType === 'business' ? String(input.bio || '').trim().slice(0, 160) : '';
      if (!displayName || !/^[a-z0-9_]{3,20}$/.test(username)) throw new Error('Enter a display name and a username with 3–20 letters, numbers, or underscores.');
      const { data, error } = await supabase.from('profiles').upsert({ id: user.id, username, display_name: displayName, account_type: accountType, business_category: category, bio }, { onConflict: 'id' }).select('id,username,display_name,account_type,business_category,bio').single();
      if (error?.code === '23505') throw new Error('That username is already used by another ERA user. Choose a different one.');
      throwIfError(error);
      return data;
    },
    async searchProfiles(query) {
      const supabase = getClient(app); await signedInUser(app);
      const term = String(query || '').trim().replace(/^@/, '').slice(0, 32);
      if (!term) return [];
      const columns = 'id,username,display_name,account_type,business_category,bio';
      const [byName, byHandle] = await Promise.all([
        supabase.from('profiles').select(columns).ilike('display_name', `%${term}%`).limit(12),
        supabase.from('profiles').select(columns).ilike('username', `%${term.toLowerCase()}%`).limit(12)
      ]);
      throwIfError(byName.error); throwIfError(byHandle.error);
      return [...new Map([...byName.data, ...byHandle.data].map(row => [row.id, row])).values()].slice(0, 20);
    },
    async listPosts() {
      const supabase = getClient(app), user = await signedInUser(app);
      const relation = 'profiles!posts_author_id_fkey(display_name,username,account_type,business_category)';
      const { data, error } = await supabase.from('posts').select(`id,author_id,body,image_path,created_at,likes_count,reposts_count,comments_count,${relation}`).order('created_at', { ascending: false }).limit(100);
      throwIfError(error);
      const ids = (data || []).map(post => post.id);
      let reactions = [];
      if (ids.length) {
        const result = await supabase.from('post_reactions').select('post_id,reaction').eq('user_id', user.id).in('post_id', ids);
        throwIfError(result.error); reactions = result.data || [];
      }
      const own = new Map(reactions.map(row => [`${row.post_id}:${row.reaction}`, true]));
      return (data || []).map(post => ({
        ...post,
        author: post.profiles,
        liked: own.has(`${post.id}:like`),
        reposted: own.has(`${post.id}:repost`),
        image_url: post.image_path ? supabase.storage.from(config.storageBucket).getPublicUrl(post.image_path).data.publicUrl : ''
      }));
    },
    async createPost(input = {}) {
      const supabase = getClient(app), user = await signedInUser(app);
      const body = String(input.body || '').trim().slice(0, 500);
      let imagePath = null;
      if (input.imageData) {
        const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/i.exec(String(input.imageData));
        if (!match) throw new Error('Only a compressed JPEG from Photos can be shared.');
        const bytes = Buffer.from(match[1], 'base64');
        if (!bytes.length || bytes.length > 500_000) throw new Error('Choose an image smaller than 500 KB.');
        imagePath = `${user.id}/${randomUUID()}.jpg`;
        const upload = await supabase.storage.from(config.storageBucket).upload(imagePath, bytes, { contentType: 'image/jpeg', upsert: false });
        throwIfError(upload.error);
      }
      if (!body && !imagePath) throw new Error('Write a post or attach a photo first.');
      const { data, error } = await supabase.from('posts').insert({ author_id: user.id, body, image_path: imagePath }).select('id').single();
      if (error && imagePath) await supabase.storage.from(config.storageBucket).remove([imagePath]).catch(() => {});
      throwIfError(error);
      return data;
    },
    async deletePost(postId) {
      const supabase = getClient(app), user = await signedInUser(app), id = assertUuid(postId, 'post ID');
      const found = await supabase.from('posts').select('image_path').eq('id', id).eq('author_id', user.id).maybeSingle();
      throwIfError(found.error);
      const { error } = await supabase.from('posts').delete().eq('id', id).eq('author_id', user.id);
      throwIfError(error);
      if (found.data?.image_path) await supabase.storage.from(config.storageBucket).remove([found.data.image_path]);
      return true;
    },
    async toggleReaction(input = {}) {
      const supabase = getClient(app), user = await signedInUser(app);
      const postId = assertUuid(input.postId, 'post ID'), reaction = input.reaction === 'repost' ? 'repost' : 'like';
      const existing = await supabase.from('post_reactions').select('post_id').eq('post_id', postId).eq('user_id', user.id).eq('reaction', reaction).maybeSingle();
      throwIfError(existing.error);
      if (existing.data) {
        const { error } = await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', user.id).eq('reaction', reaction);
        throwIfError(error); return false;
      }
      const { error } = await supabase.from('post_reactions').insert({ post_id: postId, user_id: user.id, reaction });
      if (error?.code === '23505') return true;
      throwIfError(error); return true;
    },
    async listComments(postId) {
      const supabase = getClient(app); await signedInUser(app); const id = assertUuid(postId, 'post ID');
      const { data, error } = await supabase.from('comments').select('id,post_id,author_id,body,created_at,profiles!comments_author_id_fkey(display_name,username)').eq('post_id', id).order('created_at', { ascending: true }).limit(200);
      throwIfError(error); return data || [];
    },
    async createComment(input = {}) {
      const supabase = getClient(app), user = await signedInUser(app);
      const postId = assertUuid(input.postId, 'post ID'), body = String(input.body || '').trim().slice(0, 280);
      if (!body) throw new Error('Write a comment first.');
      const { data, error } = await supabase.from('comments').insert({ post_id: postId, author_id: user.id, body }).select('id').single();
      throwIfError(error); return data;
    },
    startRealtime(onChange) {
      notify = typeof onChange === 'function' ? onChange : () => {};
      if (realtimeChannel) return;
      const supabase = getClient(app);
      realtimeChannel = supabase.channel('era-community-posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => notify({ table: 'posts', event: payload.eventType }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, payload => notify({ table: 'comments', event: payload.eventType, postId: payload.new?.post_id || payload.old?.post_id }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' }, payload => notify({ table: 'post_reactions', event: payload.eventType }))
        .subscribe(status => { if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') notify({ table: 'connection', event: status }); });
    },
    stopRealtime() { if (realtimeChannel && client) client.removeChannel(realtimeChannel); realtimeChannel = null; }
  };
}

module.exports = { createCommunityBackend };
