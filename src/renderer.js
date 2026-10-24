const openView = name => {
  document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.dataset.view === name));
  window.dispatchEvent(new CustomEvent('era:phone-view-changed', { detail: name }));
};
const toast = message => {
  let node = document.getElementById('nativeToast');
  if (!node) { node = document.createElement('div'); node.id = 'nativeToast'; node.className = 'native-toast'; node.setAttribute('role', 'status'); document.querySelector('.device-screen').append(node); }
  node.textContent = message;
  node.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('visible'), 2400);
};

document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openView(button.dataset.open)));
document.addEventListener('click', event => { if (event.target.closest('[data-back]')) openView('home'); });
document.querySelectorAll('[data-open-dashboard]').forEach(button => button.addEventListener('click', () => window.primecad.openDashboard()));
document.getElementById('homeIndicator').addEventListener('click', () => {
  if (document.querySelector('.view.active')?.dataset.view === 'notes' && noteEditor && !noteEditor.hidden) closeNoteEditor(true);
  openView('home');
});

const readLocal = (key, fallback) => { try { const data = JSON.parse(localStorage.getItem(key) || 'null'); return data ?? fallback; } catch { return fallback; } };
const writeLocal = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Notes are private to this Windows installation; no sample notes are inserted.
let notes = readLocal('primecad-notes-v1', []);
let editingNoteId = null;
const notesList = document.getElementById('notesList');
const notesEmpty = document.getElementById('notesEmpty');
const notesCount = document.getElementById('notesCount');
const notesListPage = document.getElementById('notesListPage');
const noteEditor = document.getElementById('noteEditor');
const noteTitle = document.getElementById('noteTitle');
const noteBody = document.getElementById('notesText');
const noteSaved = document.getElementById('noteSaved');
const fmtNoteDate = value => new Date(value).toLocaleDateString(window.eraI18n?.getLanguage() === 'et' ? 'et-EE' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
function renderNotes() {
  notesList.innerHTML = '';
  const sorted = [...notes].sort((a,b) => b.updatedAt - a.updatedAt);
  notesCount.textContent = String(sorted.length);
  notesEmpty.hidden = sorted.length !== 0;
  for (const note of sorted) {
    const button = document.createElement('button');
    button.className = 'note-row';
    button.innerHTML = `<strong>${safe(note.title || 'New Note')}</strong><small>${safe(fmtNoteDate(note.updatedAt))}</small><span>${safe(note.body || 'No additional text')}</span>`;
    button.addEventListener('click', () => editNote(note.id));
    notesList.append(button);
  }
}
function editNote(id = null) {
  editingNoteId = id;
  const note = notes.find(item => item.id === id);
  noteTitle.value = note?.title || '';
  noteBody.value = note?.body || '';
  document.getElementById('noteDate').textContent = note ? fmtNoteDate(note.updatedAt) : new Date().toLocaleDateString(window.eraI18n?.getLanguage() === 'et' ? 'et-EE' : 'en-US', { dateStyle: 'long' });
  noteSaved.textContent = 'Saved on this device';
  notesListPage.hidden = true;
  noteEditor.hidden = false;
  noteTitle.focus();
}
function closeNoteEditor(save = true) {
  if (save && (noteTitle.value.trim() || noteBody.value.trim())) {
    const now = Date.now();
    const entry = { id: editingNoteId || crypto.randomUUID(), title: noteTitle.value.trim(), body: noteBody.value, updatedAt: now };
    const ix = notes.findIndex(item => item.id === entry.id);
    if (ix < 0) notes.push(entry); else notes[ix] = entry;
    if (!writeLocal('primecad-notes-v1', notes)) { toast('Could not save this note on this device.'); return; }
  } else if (editingNoteId) {
    notes = notes.filter(item => item.id !== editingNoteId);
    writeLocal('primecad-notes-v1', notes);
  }
  noteEditor.hidden = true;
  notesListPage.hidden = false;
  renderNotes();
}
document.getElementById('newNote').addEventListener('click', () => editNote());
document.getElementById('newNoteBottom').addEventListener('click', () => editNote());
document.getElementById('backToNotes').addEventListener('click', () => closeNoteEditor(true));
document.getElementById('saveNote').addEventListener('click', () => closeNoteEditor(true));
renderNotes();

// Contacts are saved locally. Phone numbers are not automatically fabricated or assigned.
let contacts = readLocal('primecad-contacts-v1', []);
const contactList = document.getElementById('contactList');
const contactsEmpty = document.getElementById('contactsEmpty');
function renderContacts() {
  contactList.innerHTML = '';
  document.getElementById('contactCount').textContent = String(contacts.length);
  contactsEmpty.hidden = contacts.length !== 0;
  for (const [index, contact] of contacts.entries()) {
    const row = document.createElement('div');
    row.className = 'contact-row';
    row.innerHTML = `<span class="contact-avatar">${safe((contact.name || '?').slice(0,1).toUpperCase())}</span><span class="contact-info"><strong>${safe(contact.name)}</strong><small>${safe(contact.number)}</small></span><button class="contact-action" aria-label="Call ${safe(contact.name)}">☎</button>`;
    row.querySelector('.contact-action').addEventListener('click', () => toast('Calling needs a connected community phone server.'));
    row.addEventListener('contextmenu', event => { event.preventDefault(); if (confirm(`Delete ${contact.name} from this device?`)) { contacts.splice(index,1); writeLocal('primecad-contacts-v1', contacts); renderContacts(); } });
    contactList.append(row);
  }
}
const contactModal = document.getElementById('contactModal');
const contactForm = document.getElementById('contactForm');
document.getElementById('addContact').addEventListener('click', () => {
  contactForm.reset();
  contactModal.hidden = false;
  document.getElementById('contactName').focus();
});
document.getElementById('cancelContact').addEventListener('click', () => { contactModal.hidden = true; });
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  contacts.push({ name: document.getElementById('contactName').value.trim().slice(0,64), number: document.getElementById('contactNumber').value.trim().slice(0,32) });
  if (!writeLocal('primecad-contacts-v1', contacts)) { contacts.pop(); toast('Could not save contact on this device.'); return; }
  contactModal.hidden = true;
  renderContacts();
  selectPhoneTab('contacts');
});
renderContacts();

function selectPhoneTab(name) {
  document.querySelectorAll('[data-phone-tab]').forEach(button => {
    const active = button.dataset.phoneTab === name;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('[data-phone-panel]').forEach(panel => panel.hidden = panel.dataset.phonePanel !== name);
  document.querySelectorAll('[data-phone-tab-switch]').forEach(button => button.classList.toggle('active', button.dataset.phoneTabSwitch === name));
  document.querySelector('.phone-bottom-tabs button:first-child').classList.toggle('active', name === 'recents');
}
document.querySelectorAll('[data-phone-tab]').forEach(button => button.addEventListener('click', () => selectPhoneTab(button.dataset.phoneTab)));
document.querySelectorAll('[data-phone-tab-switch]').forEach(button => button.addEventListener('click', () => selectPhoneTab(button.dataset.phoneTabSwitch)));
document.querySelector('.phone-bottom-tabs button:first-child').addEventListener('click', () => selectPhoneTab('recents'));

document.querySelectorAll('[data-dial]').forEach(button => button.addEventListener('click', () => {
  const display = document.getElementById('dialNumber');
  display.textContent = display.textContent === 'Enter Number' ? button.dataset.dial : display.textContent + button.dataset.dial;
}));
document.getElementById('placeCall').addEventListener('click', () => toast('Calls are unavailable: no community phone server is connected.'));

// ERA Messages uses the community profile and a private, two-person Supabase conversation.
let drafts = readLocal('primecad-message-drafts-v1', []);
const localDraftSection = document.getElementById('localDraftSection');
const localDraftList = document.getElementById('localDraftList');
const messagesListPage = document.getElementById('messagesListPage');
const messageComposer = document.getElementById('messageComposer');
const messageRecipient = document.getElementById('messageRecipient');
const messageBody = document.getElementById('messageBody');
const messageStatus = document.getElementById('messageStatus');
const messageUserResults = document.getElementById('messageUserResults');
const messageThreadPage = document.getElementById('messageThreadPage');
const messageThreadList = document.getElementById('messageThreadList');
const messageReplyBody = document.getElementById('messageReplyBody');
const messageReplySend = document.getElementById('messageReplySend');
let messageSession = null, messageConversations = [], activeConversation = null, activeRecipient = null, dmSearchRevision = 0;
let dmConversationBusy = false, dmSendBusy = false;
async function ensureMessageProfile() {
  const session = await window.primecad.community.ensure();
  messageSession = session;
  if (!session.profile) {
    document.getElementById('messagesAccountNotice').hidden = false;
    document.getElementById('messageConnectionBadge').textContent = 'ACCOUNT NEEDED';
    document.getElementById('messagesEmpty').hidden = false;
    document.getElementById('messagesEmpty').querySelector('strong').textContent = 'Create your ERA account first';
    document.getElementById('messagesEmpty').querySelector('span').textContent = 'Open Twitter and create your community profile to message other ERA users.';
    return false;
  }
  document.getElementById('messagesAccountNotice').hidden = true;
  document.getElementById('messageConnectionBadge').textContent = 'ONLINE';
  await window.primecad.community.startRealtime();
  return true;
}
function openComposer() {
  messagesListPage.hidden = true; messageThreadPage.hidden = true; messageComposer.hidden = false;
  document.getElementById('messageRecipientSelected').hidden = true;
  document.getElementById('messageRecipientSelected').textContent = '';
  messageUserResults.hidden = true; messageRecipient.value = ''; messageBody.value = '';
  activeRecipient = null; messageStatus.textContent = 'Search for an ERA username to start a private conversation.';
  document.getElementById('sendMessage').disabled = true;
  void ensureMessageProfile().catch(error => { messageStatus.textContent = error.message || 'ERA community is offline.'; document.getElementById('messageConnectionBadge').textContent = 'OFFLINE'; });
  messageRecipient.focus();
}
function closeComposer() { messageComposer.hidden = true; messagesListPage.hidden = false; messageUserResults.hidden = true; }
function formatMessageTime(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(window.eraI18n?.getLanguage() === 'et' ? 'et-EE' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function renderConversations() {
  const list = document.getElementById('messagesList'); list.replaceChildren();
  for (const conversation of messageConversations) {
    const profile = conversation.other_profile || {}, name = profile.display_name || 'ERA user', username = `@${profile.username || 'user'}`;
    const row = document.createElement('button'); row.type = 'button'; row.className = 'dm-conversation-row';
    const avatar = document.createElement('span'); avatar.className = 'dm-avatar'; avatar.textContent = name.slice(0, 1).toUpperCase();
    const content = document.createElement('span'); content.className = 'dm-conversation-copy';
    const title = document.createElement('strong'); title.textContent = name;
    const handle = document.createElement('small'); handle.textContent = username;
    const preview = document.createElement('span'); preview.textContent = conversation.last_message || 'Start your conversation';
    content.append(title, handle, preview);
    const date = document.createElement('time'); date.textContent = formatMessageTime(conversation.updated_at);
    row.append(avatar, content, date); row.addEventListener('click', () => { void openDirectConversation(conversation); }); list.append(row);
  }
  document.getElementById('messagesEmpty').hidden = messageConversations.length > 0 || !messageSession?.profile;
}
async function refreshConversations() {
  if (!window.primecad?.community) return;
  try {
    const ready = await ensureMessageProfile();
    if (!ready) { messageConversations = []; renderConversations(); return; }
    messageConversations = await window.primecad.community.listConversations();
    renderConversations();
  } catch (error) {
    document.getElementById('messageConnectionBadge').textContent = 'OFFLINE';
    document.getElementById('messagesAccountNotice').hidden = false;
    document.getElementById('messagesAccountNotice').querySelector('strong').textContent = 'Community service unavailable';
    document.getElementById('messagesAccountNotice').querySelector('span').textContent = error.message || 'Enable the ERA community service to sync conversations.';
    document.getElementById('messagesEmpty').hidden = false;
  }
}
function renderDirectMessages(rows) {
  messageThreadList.replaceChildren();
  if (!rows.length) { const empty = document.createElement('p'); empty.className = 'dm-thread-empty'; empty.textContent = 'This is the start of your conversation.'; messageThreadList.append(empty); return; }
  for (const item of rows) {
    const own = item.sender_id === messageSession?.id, bubble = document.createElement('article');
    bubble.className = `dm-message ${own ? 'is-own' : 'is-other'}`;
    const text = document.createElement('p'); text.textContent = item.body;
    const meta = document.createElement('time'); meta.textContent = formatMessageTime(item.created_at);
    bubble.append(text, meta); messageThreadList.append(bubble);
  }
  messageThreadList.scrollTop = messageThreadList.scrollHeight;
}
async function openDirectConversation(conversation) {
  if (dmConversationBusy) return;
  dmConversationBusy = true;
  activeConversation = conversation; messagesListPage.hidden = true; messageComposer.hidden = true; messageThreadPage.hidden = false;
  const profile = conversation.other_profile || {};
  document.getElementById('messageThreadName').textContent = profile.display_name || 'ERA user';
  document.getElementById('messageThreadHandle').textContent = `@${profile.username || 'user'}`;
  messageThreadList.replaceChildren(); const loading = document.createElement('p'); loading.className = 'dm-thread-empty'; loading.textContent = 'Loading messages…'; messageThreadList.append(loading);
  try { await ensureMessageProfile(); const rows = await window.primecad.community.listDirectMessages(conversation.id); renderDirectMessages(rows); }
  catch (error) { messageThreadList.replaceChildren(); const issue = document.createElement('p'); issue.className = 'dm-thread-empty'; issue.textContent = error.message || 'Messages could not be loaded.'; messageThreadList.append(issue); }
  finally { dmConversationBusy = false; messageReplyBody.focus(); }
}
async function searchMessageUsers() {
  const revision = ++dmSearchRevision, query = messageRecipient.value.trim().replace(/^@/, '');
  activeRecipient = null; document.getElementById('messageRecipientSelected').hidden = true; document.getElementById('sendMessage').disabled = true;
  messageUserResults.replaceChildren();
  if (query.length < 2) { messageUserResults.hidden = true; return; }
  try {
    const ready = await ensureMessageProfile(); if (!ready) return;
    const profiles = await window.primecad.community.searchProfiles(query);
    if (revision !== dmSearchRevision) return;
    const matches = profiles.filter(profile => profile.id !== messageSession.id);
    if (!matches.length) { const empty = document.createElement('p'); empty.className = 'dm-search-empty'; empty.textContent = 'No ERA account matches this search.'; messageUserResults.append(empty); }
    for (const profile of matches) {
      const option = document.createElement('button'); option.type = 'button'; option.className = 'dm-user-option';
      const avatar = document.createElement('span'); avatar.className = 'dm-avatar'; avatar.textContent = profile.display_name.slice(0, 1).toUpperCase();
      const name = document.createElement('span'); name.innerHTML = `<strong>${safe(profile.display_name)}</strong><small>@${safe(profile.username)}</small>`;
      option.append(avatar, name); option.addEventListener('click', () => {
        activeRecipient = profile; messageRecipient.value = `@${profile.username}`; messageUserResults.hidden = true;
        const selected = document.getElementById('messageRecipientSelected'); selected.textContent = `To ${profile.display_name} · @${profile.username}`; selected.hidden = false;
        document.getElementById('sendMessage').disabled = !messageBody.value.trim(); messageStatus.textContent = 'Private ERA message · only you and this user can read it.'; messageBody.focus();
      }); messageUserResults.append(option);
    }
    messageUserResults.hidden = false;
  } catch (error) { messageStatus.textContent = error.message || 'Could not search ERA users.'; }
}
async function sendDirectMessage(toProfile, body, existingConversation = null) {
  const conversation = existingConversation || await window.primecad.community.getOrCreateConversation(toProfile.id);
  await window.primecad.community.sendDirectMessage({ conversationId: conversation.id, body });
  return conversation;
}
document.getElementById('messagesCreateAccount').addEventListener('click', () => openView('chirper'));
document.getElementById('composeMessage').addEventListener('click', openComposer);
document.getElementById('cancelMessage').addEventListener('click', closeComposer);
document.getElementById('messageThreadBack').addEventListener('click', () => { messageThreadPage.hidden = true; messagesListPage.hidden = false; void refreshConversations(); });
messageRecipient.addEventListener('input', () => { messageStatus.textContent = 'Search ERA users by display name or username.'; void searchMessageUsers(); });
messageBody.addEventListener('input', () => { document.getElementById('sendMessage').disabled = !activeRecipient || !messageBody.value.trim(); });
document.getElementById('sendMessage').addEventListener('click', async () => {
  const body = messageBody.value.trim(); if (!activeRecipient || !body) return;
  document.getElementById('sendMessage').disabled = true; messageStatus.textContent = 'Sending…';
  try { const conversation = await sendDirectMessage(activeRecipient, body); messageBody.value = ''; closeComposer(); await refreshConversations(); await openDirectConversation({ ...conversation, other_profile: activeRecipient }); }
  catch (error) { messageStatus.textContent = error.message || 'Message could not be sent.'; document.getElementById('sendMessage').disabled = false; }
});
document.getElementById('messageReplyForm').addEventListener('submit', async event => {
  event.preventDefault(); const body = messageReplyBody.value.trim(); if (!activeConversation || !body || dmSendBusy) return;
  dmSendBusy = true; messageReplySend.disabled = true;
  try { await sendDirectMessage(null, body, activeConversation); messageReplyBody.value = ''; const rows = await window.primecad.community.listDirectMessages(activeConversation.id); renderDirectMessages(rows); await refreshConversations(); }
  catch (error) { toast(error.message || 'Message could not be sent.'); }
  finally { dmSendBusy = false; messageReplySend.disabled = !messageReplyBody.value.trim(); messageReplyBody.focus(); }
});
messageReplyBody.addEventListener('input', () => { messageReplySend.disabled = !messageReplyBody.value.trim(); });
window.addEventListener('era:phone-view-changed', event => { if (event.detail === 'messages') void refreshConversations(); });
window.addEventListener('era:community-profile-ready', () => { void refreshConversations(); });
window.primecad.on('community:changed', payload => {
  if (payload?.table !== 'direct_messages') return;
  if (activeConversation && payload.conversationId === activeConversation.id) void window.primecad.community.listDirectMessages(activeConversation.id).then(renderDirectMessages).catch(() => {});
  void refreshConversations();
});
function renderDrafts() {
  localDraftSection.hidden = drafts.length === 0;
  localDraftList.innerHTML = '';
  for (const draft of drafts) {
    const row = document.createElement('div');
    row.className = 'draft-row';
    row.innerHTML = `<button class="draft-open"><strong>${safe(draft.recipient || 'Unaddressed draft')}</strong><span>${safe(draft.body || 'Empty draft')}</span><small>Saved on this device · not delivered</small></button><button class="draft-delete" aria-label="Delete draft">×</button>`;
    row.querySelector('.draft-open').addEventListener('click', () => {
      messageRecipient.value = draft.recipient;
      messageBody.value = draft.body;
      openComposer();
    });
    row.querySelector('.draft-delete').addEventListener('click', () => {
      drafts = drafts.filter(item => item.id !== draft.id);
      writeLocal('primecad-message-drafts-v1', drafts);
      renderDrafts();
    });
    localDraftList.append(row);
  }
}
document.getElementById('sendMessage').disabled = true;
document.getElementById('saveDraft').addEventListener('click', () => {
  const recipient = messageRecipient.value.trim(), body = messageBody.value.trim();
  if (!recipient && !body) { closeComposer(); return; }
  drafts.unshift({ id: crypto.randomUUID(), recipient, body, updatedAt: Date.now() });
  if (!writeLocal('primecad-message-drafts-v1', drafts)) { drafts.shift(); toast('Could not save this draft on this device.'); return; }
  renderDrafts();
  toast('Draft saved on this device · not delivered');
  messageRecipient.value = '';
  messageBody.value = '';
  closeComposer();
});
renderDrafts();

function updateClock() {
  const now = new Date();
  const locale = window.eraI18n?.getLanguage() === 'et' ? 'et-EE' : 'en-US';
  const time = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  document.getElementById('statusTime').textContent = time;
  document.getElementById('bigClock').textContent = time;
  document.getElementById('fullDate').textContent = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const minute = now.getMinutes(), hour = (now.getHours() % 12) * 30 + minute / 2, second = now.getSeconds() * 6;
  document.querySelectorAll('.clock-hand.hour').forEach(hand => hand.style.transform = `translateX(-50%) rotate(${hour}deg)`);
  document.querySelectorAll('.clock-hand.minute').forEach(hand => hand.style.transform = `translateX(-50%) rotate(${minute * 6}deg)`);
  document.querySelectorAll('.clock-hand.second').forEach(hand => hand.style.transform = `translateX(-50%) rotate(${second}deg)`);
}
updateClock();
setInterval(updateClock, 1000);
window.primecad.on('toggle-phone', () => window.primecad.toggle());
window.primecad.on('hide-phone', () => window.primecad.hide());
window.primecad.on('open-overlays', () => openView('home'));
window.primecad.on('open-mdt', () => window.primecad.openDashboard());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (!messageComposer.hidden) closeComposer();
    else if (!noteEditor.hidden) closeNoteEditor(true);
    else window.primecad.hide();
  }
});


// The profile belongs to this Windows installation and is stored by the main process.
let phoneProfile = { name: '', robloxUserId: '', wallpaper: 'midnight' };
const profileModal = document.getElementById('profileSetupModal');
const profileForm = document.getElementById('profileSetupForm');
const wallpaperPresets = new Set(['midnight', 'aurora', 'ocean', 'sunset', 'custom']);
function renderPhoneProfile() {
  const initial = (phoneProfile.name || '?').trim().slice(0, 1).toUpperCase();
  document.getElementById('profileInitial').textContent = initial;
  document.getElementById('threadsAvatar').textContent = initial;
  document.getElementById('profileNameSummary').textContent = phoneProfile.name || 'Set up your phone';
  document.getElementById('threadsProfileName').textContent = phoneProfile.name || 'Set up your phone';
  document.getElementById('profileRobloxSummary').textContent = phoneProfile.robloxUserId
    ? `Roblox ID ${phoneProfile.robloxUserId} · saved on this computer`
    : 'Roblox ID not set · staff access unavailable';
  document.getElementById('myPhoneNumber').textContent = 'Unavailable offline';
  document.getElementById('phoneNumberDisplay').textContent = 'Unavailable offline';
  const theme = wallpaperPresets.has(phoneProfile.wallpaper) ? phoneProfile.wallpaper : 'midnight';
  const language = phoneProfile.language === 'et' ? 'et' : 'en';
  window.eraI18n?.setLanguage(language);
  const onboardingLanguage = document.getElementById('phoneLanguageSelect');
  if (onboardingLanguage) onboardingLanguage.value = language;
  const settingsLanguage = document.getElementById('pa-language');
  if (settingsLanguage) settingsLanguage.value = language;
  document.querySelector('.home-view').dataset.wallpaper = theme;
  document.getElementById('wallpaperSelect').value = theme;
  if (theme === 'custom' && phoneProfile.customWallpaperDataUrl) {
    document.querySelector('.home-view').style.backgroundImage = `linear-gradient(rgba(3,3,4,.42),rgba(3,3,4,.72)),url("${phoneProfile.customWallpaperDataUrl}")`;
  } else {
    document.querySelector('.home-view').style.backgroundImage = '';
  }
}
async function loadPhoneProfile() {
  try {
    phoneProfile = await window.primecad.phoneProfile.get();
    window.__eraPhoneProfileReady = true;
    renderPhoneProfile();
    window.dispatchEvent(new CustomEvent('era:phone-profile-loaded', { detail: phoneProfile }));
    if (!phoneProfile.name) openPhoneProfile(true);
  } catch { toast('Phone profile could not be loaded.'); }
}
function openPhoneProfile(firstRun = false) {
  profileForm.dataset.firstRun = String(firstRun);
  document.getElementById('profileNameInput').value = phoneProfile.name || '';
  document.getElementById('profileRobloxIdInput').value = phoneProfile.robloxUserId || '';
  document.getElementById('profileFormError').textContent = '';
  profileModal.hidden = false;
  setTimeout(() => document.getElementById('profileNameInput').focus(), 0);
}
document.getElementById('editPhoneProfile').addEventListener('click', () => openPhoneProfile(false));
document.getElementById('phoneLanguageSelect').addEventListener('change', async event => {
  const language = event.currentTarget.value === 'et' ? 'et' : 'en';
  window.eraI18n?.setLanguage(language);
  if (!window.primecad?.phoneProfile) return;
  try {
    phoneProfile = await window.primecad.phoneProfile.save({ name: phoneProfile.name, robloxUserId: phoneProfile.robloxUserId, wallpaper: phoneProfile.wallpaper, language });
    renderPhoneProfile();
  } catch (error) { toast(error.message || 'Language preference could not be saved.'); }
});
document.getElementById('skipProfileSetup')?.addEventListener('click', () => {
  if (profileForm.dataset.firstRun === 'true') localStorage.setItem('era-profile-setup-later', '1');
  profileModal.hidden = true;
});
profileForm.addEventListener('submit', async event => {
  event.preventDefault();
  const name = document.getElementById('profileNameInput').value.trim();
  const robloxUserId = document.getElementById('profileRobloxIdInput').value.trim();
  if (!name) return;
  if (robloxUserId && !/^\d{1,20}$/.test(robloxUserId)) {
    document.getElementById('profileFormError').textContent = 'Roblox user ID must contain digits only.';
    return;
  }
  try {
    const language = document.getElementById('phoneLanguageSelect').value === 'et' ? 'et' : 'en';
    const firstRun = profileForm.dataset.firstRun === 'true';
    phoneProfile = await window.primecad.phoneProfile.save({ name, robloxUserId, wallpaper: phoneProfile.wallpaper, language });
    localStorage.removeItem('era-profile-setup-later');
    renderPhoneProfile();
    profileModal.hidden = true;
    window.dispatchEvent(new CustomEvent('era:phone-profile-loaded', { detail: phoneProfile }));
    if (firstRun) { toast('Now create your ERA community username.'); openView('chirper'); }
    else toast('Profile saved on this computer.');
  } catch (error) { document.getElementById('profileFormError').textContent = error.message || 'Profile could not be saved.'; }
});
window.primecad.on('phone-profile:updated', profile => { phoneProfile = profile; renderPhoneProfile(); window.dispatchEvent(new CustomEvent('era:phone-profile-loaded', { detail: phoneProfile })); });
document.getElementById('wallpaperSelect').addEventListener('change', async event => {
  const wallpaper = event.currentTarget.value;
  if (wallpaper === 'custom') {
    try {
      const selected = await window.primecad.phoneProfile.chooseWallpaper();
      if (!selected) { event.currentTarget.value = phoneProfile.wallpaper || 'midnight'; return; }
      phoneProfile = await window.primecad.phoneProfile.get();
      renderPhoneProfile();
    } catch (error) { toast(error.message || 'Wallpaper could not be loaded.'); event.currentTarget.value = phoneProfile.wallpaper || 'midnight'; }
    return;
  }
  try {
    phoneProfile = await window.primecad.phoneProfile.save({ name: phoneProfile.name, robloxUserId: phoneProfile.robloxUserId, wallpaper });
    renderPhoneProfile();
  } catch (error) { toast(error.message || 'Wallpaper setting could not be saved.'); }
});
document.getElementById('chooseWallpaper').addEventListener('click', () => {
  document.getElementById('wallpaperSelect').value = 'custom';
  document.getElementById('wallpaperSelect').dispatchEvent(new Event('change'));
});
loadPhoneProfile();

// Postimees headlines are fetched from its real public RSS feed in the main process.
const newsList = document.getElementById('newsList');
const newsStatus = document.getElementById('newsStatus');
async function loadPostimees() {
  newsStatus.textContent = 'Loading Postimees RSS…';
  newsList.replaceChildren();
  try {
    const feed = await window.primecad.news.headlines();
    if (!feed.items.length) { newsStatus.textContent = 'No headlines are available right now.'; return; }
    newsStatus.textContent = `Updated ${new Date(feed.fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · Postimees`;
    for (const item of feed.items) {
      const button = document.createElement('button');
      button.className = 'news-item';
      button.type = 'button';
      const title = document.createElement('strong');
      title.textContent = item.title;
      const date = document.createElement('small');
      const parsedDate = new Date(item.pubDate);
      date.textContent = Number.isNaN(parsedDate.valueOf()) ? 'Postimees' : parsedDate.toLocaleString(window.eraI18n?.getLanguage() === 'et' ? 'et-EE' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      button.append(title, date);
      button.addEventListener('click', () => window.primecad.news.open(item.link).catch(error => toast(error.message || 'Could not open article.')));
      newsList.append(button);
    }
  } catch (error) { newsStatus.textContent = error.message || 'Postimees headlines could not be loaded.'; }
}
document.getElementById('refreshNews').addEventListener('click', loadPostimees);
document.querySelector('[data-open="postimees"]')?.addEventListener('click', loadPostimees);
document.getElementById('openNewsSource').addEventListener('click', () => window.primecad.news.open('https://www.postimees.ee/'));

// Clock app: live local time, stopwatch with laps, and a countdown timer.
let clockPanelName = 'clock';
function selectClockPanel(name) {
  clockPanelName = name;
  document.querySelectorAll('[data-clock-tab]').forEach(button => button.classList.toggle('selected', button.dataset.clockTab === name));
  document.querySelectorAll('[data-clock-panel]').forEach(panel => {
    const active = panel.dataset.clockPanel === name;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
}
document.querySelectorAll('[data-clock-tab]').forEach(button => button.addEventListener('click', () => selectClockPanel(button.dataset.clockTab)));
let phoneAlarms = readLocal('era-phone-alarms-v1', []);
const alarmForm = document.getElementById('alarmForm');
const alarmList = document.getElementById('alarmList');
function renderPhoneAlarms() {
  alarmList.replaceChildren();
  if (!phoneAlarms.length) {
    const empty = document.createElement('p'); empty.className = 'app-copy alarm-empty'; empty.textContent = 'No alarms'; alarmList.append(empty); return;
  }
  for (const alarm of phoneAlarms) {
    const row = document.createElement('div'); row.className = 'alarm-row';
    const info = document.createElement('span'); info.className = 'alarm-info';
    const time = document.createElement('strong'); time.textContent = alarm.time;
    const label = document.createElement('small'); label.textContent = alarm.label || 'Alarm';
    info.append(time, label);
    const actions = document.createElement('span'); actions.className = 'alarm-actions';
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'alarm-toggle'; toggle.setAttribute('aria-pressed', String(Boolean(alarm.enabled))); toggle.textContent = alarm.enabled ? 'On' : 'Off'; toggle.addEventListener('click', () => { alarm.enabled = !alarm.enabled; alarm.lastFiredDate = ''; writeLocal('era-phone-alarms-v1', phoneAlarms); renderPhoneAlarms(); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'alarm-delete'; remove.setAttribute('aria-label', `Delete ${alarm.label || 'alarm'}`); remove.textContent = '×'; remove.addEventListener('click', () => { phoneAlarms = phoneAlarms.filter(item => item.id !== alarm.id); writeLocal('era-phone-alarms-v1', phoneAlarms); renderPhoneAlarms(); });
    actions.append(toggle, remove); row.append(info, actions); alarmList.append(row);
  }
}
alarmForm.addEventListener('submit', event => {
  event.preventDefault();
  const time = document.getElementById('alarmTime').value;
  if (!/^\d{2}:\d{2}$/.test(time)) return;
  phoneAlarms.push({ id: crypto.randomUUID(), time, label: document.getElementById('alarmLabel').value.trim().slice(0, 32), enabled: true, lastFiredDate: '' });
  if (!writeLocal('era-phone-alarms-v1', phoneAlarms)) { phoneAlarms.pop(); toast('Could not save this alarm on this device.'); return; }
  document.getElementById('alarmLabel').value = '';
  document.getElementById('alarmStatus').textContent = 'Alarm saved on this device · works while ERA is open';
  renderPhoneAlarms();
});
function playAlarmTone() {
  try {
    const context = new AudioContext();
    [0, 0.45, 0.9].forEach(delay => {
      const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.frequency.value = 880; gain.gain.setValueAtTime(0.0001, context.currentTime + delay); gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + delay + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + 0.32);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(context.currentTime + delay); oscillator.stop(context.currentTime + delay + 0.34);
    });
    setTimeout(() => context.close().catch(() => {}), 1800);
  } catch { /* Browser audio may be unavailable; the visible alert still appears. */ }
}
function checkPhoneAlarms() {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const due = phoneAlarms.filter(alarm => alarm.enabled && alarm.time === time && alarm.lastFiredDate !== day);
  if (!due.length) return;
  for (const alarm of due) alarm.lastFiredDate = day;
  writeLocal('era-phone-alarms-v1', phoneAlarms);
  const labels = due.map(alarm => alarm.label || 'Alarm').join(', ');
  document.getElementById('alarmStatus').textContent = `Alarm: ${labels}`;
  toast(`Alarm · ${labels}`); playAlarmTone();
}
renderPhoneAlarms();
setInterval(checkPhoneAlarms, 12000);
let stopwatchStartedAt = 0, stopwatchElapsed = 0, stopwatchRunning = false, stopwatchTimer = null, lapCount = 0, lastLapElapsed = 0;
function currentStopwatchMs() { return stopwatchElapsed + (stopwatchRunning ? performance.now() - stopwatchStartedAt : 0); }
function formatStopwatch(milliseconds) {
  const centiseconds = Math.floor(milliseconds / 10) % 100;
  const totalSeconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}
function renderStopwatch() { document.getElementById('stopwatchDisplay').textContent = formatStopwatch(currentStopwatchMs()); }
document.getElementById('stopwatchStart').addEventListener('click', event => {
  if (stopwatchRunning) { stopwatchElapsed = currentStopwatchMs(); stopwatchRunning = false; clearInterval(stopwatchTimer); event.currentTarget.textContent = 'Resume'; }
  else { stopwatchStartedAt = performance.now(); stopwatchRunning = true; clearInterval(stopwatchTimer); stopwatchTimer = setInterval(renderStopwatch, 30); event.currentTarget.textContent = 'Pause'; }
  document.getElementById('stopwatchLap').disabled = !stopwatchRunning;
  document.getElementById('stopwatchReset').disabled = stopwatchRunning || currentStopwatchMs() === 0;
});
document.getElementById('stopwatchLap').addEventListener('click', () => {
  if (!stopwatchRunning) return;
  lapCount += 1;
  const row = document.createElement('div'); row.className = 'lap-row';
  const elapsed = currentStopwatchMs();
  row.innerHTML = `<span>Lap ${lapCount} <small>${safe(formatStopwatch(elapsed - lastLapElapsed))}</small></span><time>${safe(formatStopwatch(elapsed))}</time>`;
  lastLapElapsed = elapsed;
  document.getElementById('stopwatchLaps').prepend(row);
});
document.getElementById('stopwatchReset').addEventListener('click', () => {
  if (stopwatchRunning) return;
  stopwatchElapsed = 0; lapCount = 0; lastLapElapsed = 0;
  document.getElementById('stopwatchLaps').replaceChildren();
  document.getElementById('stopwatchStart').textContent = 'Start';
  document.getElementById('stopwatchLap').disabled = true;
  document.getElementById('stopwatchReset').disabled = true;
  renderStopwatch();
});
setInterval(() => { document.getElementById('stopwatchReset').disabled = stopwatchRunning || currentStopwatchMs() === 0; }, 100);

let timerDeadline = 0, timerRemainingMs = 0, timerRunning = false, timerInterval = null;
function readTimerInputMs() {
  const minutes = Math.min(999, Math.max(0, Number(document.getElementById('timerMinutes').value) || 0));
  const seconds = Math.min(59, Math.max(0, Number(document.getElementById('timerSeconds').value) || 0));
  return (minutes * 60 + seconds) * 1000;
}
function renderTimer(milliseconds) {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  document.getElementById('timerDisplay').textContent = `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}
function tickTimer() {
  timerRemainingMs = Math.max(0, timerDeadline - Date.now());
  renderTimer(timerRemainingMs);
  if (!timerRemainingMs) {
    timerRunning = false; clearInterval(timerInterval); timerInterval = null;
    document.getElementById('timerStart').textContent = 'Start';
    document.getElementById('timerStatus').textContent = 'Timer finished';
  }
}
document.getElementById('timerStart').addEventListener('click', event => {
  if (timerRunning) {
    timerRemainingMs = Math.max(0, timerDeadline - Date.now()); timerRunning = false; clearInterval(timerInterval); timerInterval = null; event.currentTarget.textContent = 'Resume';
  } else {
    if (!timerRemainingMs) timerRemainingMs = readTimerInputMs();
    if (!timerRemainingMs) { document.getElementById('timerStatus').textContent = 'Set a time greater than zero.'; return; }
    timerDeadline = Date.now() + timerRemainingMs; timerRunning = true; event.currentTarget.textContent = 'Pause';
    document.getElementById('timerStatus').textContent = 'Timer is running';
    clearInterval(timerInterval); timerInterval = setInterval(tickTimer, 200); tickTimer();
  }
});
document.getElementById('timerReset').addEventListener('click', () => {
  timerRunning = false; clearInterval(timerInterval); timerInterval = null; timerRemainingMs = 0;
  document.getElementById('timerStart').textContent = 'Start'; document.getElementById('timerStatus').textContent = '';
  renderTimer(readTimerInputMs());
});
for (const input of [document.getElementById('timerMinutes'), document.getElementById('timerSeconds')]) input.addEventListener('input', () => {
  if (timerRunning) return;
  timerRemainingMs = 0; renderTimer(readTimerInputMs());
});
renderTimer(readTimerInputMs());

// Threads-style local drafts only. No fake posts or cross-player publishing.
const threadDraftInput = document.getElementById('threadDraft');
const threadsList = document.getElementById('threadsList');
let threadDrafts = readLocal('era-threads-drafts-v1', []);
function renderThreadDrafts() {
  threadsList.replaceChildren();
  for (const draft of threadDrafts) {
    const article = document.createElement('article'); article.className = 'thread-draft-card';
    const author = document.createElement('strong'); author.textContent = phoneProfile.name || 'Local profile';
    const status = document.createElement('small'); status.textContent = 'Saved here · not published';
    const body = document.createElement('p'); body.textContent = draft.body;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-button'; remove.textContent = 'Delete draft';
    remove.addEventListener('click', () => { threadDrafts = threadDrafts.filter(item => item.id !== draft.id); writeLocal('era-threads-drafts-v1', threadDrafts); renderThreadDrafts(); });
    article.append(author, status, body, remove); threadsList.append(article);
  }
}
document.getElementById('saveThreadDraft').addEventListener('click', () => {
  const body = threadDraftInput.value.trim();
  if (!body) { toast('Write something first.'); return; }
  threadDrafts.unshift({ id: crypto.randomUUID(), body, createdAt: Date.now() });
  if (!writeLocal('era-threads-drafts-v1', threadDrafts)) { threadDrafts.shift(); toast('Could not save the draft.'); return; }
  threadDraftInput.value = ''; renderThreadDrafts(); toast('Draft saved on this device · not published.');
});
renderThreadDrafts();
