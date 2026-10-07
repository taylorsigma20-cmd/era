const views = [...document.querySelectorAll('.view')];
const openView = name => views.forEach(view => view.classList.toggle('active', view.dataset.view === name));
const toast = message => {
  let node = document.getElementById('nativeToast');
  if (!node) { node = document.createElement('div'); node.id = 'nativeToast'; node.className = 'native-toast'; node.setAttribute('role', 'status'); document.querySelector('.device-screen').append(node); }
  node.textContent = message;
  node.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('visible'), 2400);
};

document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openView(button.dataset.open)));
document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => openView('home')));
document.querySelectorAll('[data-open-dashboard]').forEach(button => button.addEventListener('click', () => window.primecad.openDashboard()));

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
const fmtNoteDate = value => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  document.getElementById('noteDate').textContent = note ? fmtNoteDate(note.updatedAt) : new Date().toLocaleDateString('en-US', { dateStyle: 'long' });
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

// Keep messages as local drafts only. There is deliberately no pretend send action.
let drafts = readLocal('primecad-message-drafts-v1', []);
const localDraftSection = document.getElementById('localDraftSection');
const localDraftList = document.getElementById('localDraftList');
const messagesListPage = document.getElementById('messagesListPage');
const messageComposer = document.getElementById('messageComposer');
const messageRecipient = document.getElementById('messageRecipient');
const messageBody = document.getElementById('messageBody');
const messageStatus = document.getElementById('messageStatus');
function openComposer() { messagesListPage.hidden = true; messageComposer.hidden = false; messageRecipient.focus(); }
function closeComposer() { messageComposer.hidden = true; messagesListPage.hidden = false; }
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
document.getElementById('composeMessage').addEventListener('click', openComposer);
document.getElementById('cancelMessage').addEventListener('click', closeComposer);
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
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  document.getElementById('statusTime').textContent = time;
  document.getElementById('bigClock').textContent = time;
  document.getElementById('fullDate').textContent = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const minute = now.getMinutes(), hour = (now.getHours() % 12) * 30 + minute / 2, second = now.getSeconds() * 6;
  document.querySelectorAll('.clock-hand.hour').forEach(hand => hand.style.transform = `translateX(-50%) rotate(${hour}deg)`);
  document.querySelectorAll('.clock-hand.minute').forEach(hand => hand.style.transform = `translateX(-50%) rotate(${minute * 6}deg)`);
  document.querySelectorAll('.clock-hand.second').forEach(hand => hand.style.transform = `translateX(-50%) rotate(${second}deg)`);
}
updateClock();
setInterval(updateClock, 1000);

async function refreshPhoneServer() {
  try {
    const servers = await window.primecad.servers.list();
    const chosenId = await window.primecad.servers.selected();
    const chosen = servers.find(server => server.id === chosenId) || servers[0];
    const title = document.getElementById('phoneServerName');
    const info = document.getElementById('phoneServerInfo');
    if (!chosen) {
      title.textContent = 'No server selected';
      info.textContent = 'Add your private server API key in the server manager to view its live status.';
      return;
    }
    title.textContent = chosen.name;
    info.textContent = chosen.currentPlayers == null
      ? 'ER:LC server added. Open Manage Servers to refresh its status.'
      : `${chosen.currentPlayers}/${chosen.maxPlayers} players · ER:LC status connected`;
  } catch { /* The phone remains usable if local profiles cannot be read. */ }
}
refreshPhoneServer();
window.primecad.on('server-profile-updated', refreshPhoneServer);
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
