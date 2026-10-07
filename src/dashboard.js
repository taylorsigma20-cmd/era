const list = document.getElementById('serverList');
const empty = document.getElementById('emptyState');
const noResults = document.getElementById('noResults');
const count = document.getElementById('serverCount');
const search = document.getElementById('searchServers');
const addPanel = document.getElementById('addPanel');
const form = document.getElementById('serverForm');
const keyField = document.getElementById('serverKey');
const labelField = document.getElementById('serverLabel');
const formStatus = document.getElementById('formStatus');
const saveButton = document.getElementById('saveServer');
const serverSection = document.getElementById('serverSection');
const playersPanel = document.getElementById('playersPanel');
const playersError = document.getElementById('playersError');
const playerList = document.getElementById('playerList');
const detail = document.getElementById('playerDetail');
const detailEmpty = document.getElementById('playerDetailEmpty');
let servers = [];
let selectedId = null;
let snapshot = null;
let selectedPlayerId = null;
let lastRefreshed = null;
let resolveActionComposer = null;
const updateNotice = document.getElementById('updateNotice');
const updateTitle = document.getElementById('updateTitle');
const updateMessage = document.getElementById('updateMessage');
const updateProgress = document.getElementById('updateProgress');
const updateError = document.getElementById('updateError');
const updatePrimary = document.getElementById('updatePrimary');
const updateSkip = document.getElementById('updateSkip');
const updateLater = document.getElementById('updateLater');
let currentUpdate = { status: 'idle' };
let hideDownloadNotice = false;

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const selectedServerId = () => selectedId;
const noteKey = playerId => `era-player-note-v1:${selectedId}:${playerId}`;

function showFormStatus(message = '', kind = '') {
  formStatus.textContent = message;
  formStatus.className = `form-status ${kind}`.trim();
}
function toggleAdd(show) {
  addPanel.hidden = !show;
  if (show) {
    showFormStatus();
    setTimeout(() => keyField.focus(), 0);
  } else {
    form.reset();
    keyField.type = 'password';
    document.getElementById('toggleKey').textContent = 'Show';
    showFormStatus();
  }
}
function showServerView() {
  playersPanel.hidden = true;
  serverSection.hidden = false;
}
function showPlayersView() {
  serverSection.hidden = true;
  playersPanel.hidden = false;
  document.getElementById('searchPlayers').value = '';
  renderPlayers();
}

function renderUpdateState(state) {
  if (!state || typeof state.status !== 'string') return;
  currentUpdate = state;
  updateError.textContent = '';
  updateProgress.hidden = true;
  updateSkip.hidden = true;
  updateLater.hidden = true;
  updatePrimary.disabled = false;

  if (state.status === 'available') {
    updateTitle.textContent = 'A new ERA update is available';
    updateMessage.textContent = `Version ${state.version} is ready. ERA will download it here and ask you to restart to install it.`;
    updateSkip.hidden = false;
    updateLater.hidden = false;
    updatePrimary.textContent = 'Update now';
    updateNotice.hidden = false;
  } else if (state.status === 'downloading') {
    updateTitle.textContent = 'Downloading ERA update';
    updateMessage.textContent = `Downloading version ${state.version || ''}… ${Math.floor(state.percent || 0)}%`;
    updateProgress.hidden = false;
    updateProgress.value = Math.max(0, Math.min(100, Number(state.percent) || 0));
    updateLater.hidden = false;
    updateLater.textContent = 'Hide';
    updatePrimary.textContent = 'Downloading…';
    updatePrimary.disabled = true;
    if (!hideDownloadNotice) updateNotice.hidden = false;
  } else if (state.status === 'downloaded') {
    hideDownloadNotice = false;
    updateTitle.textContent = 'Update ready to install';
    updateMessage.textContent = `Version ${state.version} has downloaded. Restart ERA now to finish installing it.`;
    updateLater.hidden = false;
    updateLater.textContent = 'Later';
    updatePrimary.textContent = 'Restart and update';
    updateNotice.hidden = false;
  } else if (state.status === 'error' && state.version) {
    updateTitle.textContent = 'ERA could not finish the update';
    updateMessage.textContent = `Version ${state.version} is still available. Check your internet connection and try again.`;
    updateError.textContent = 'The update failed. Your current ERA installation is unchanged.';
    updateSkip.hidden = false;
    updateLater.hidden = false;
    updatePrimary.textContent = 'Try again';
    updateNotice.hidden = false;
  } else {
    updateNotice.hidden = true;
  }
}

updatePrimary.addEventListener('click', async () => {
  updatePrimary.disabled = true;
  updateError.textContent = '';
  if (currentUpdate.status === 'available' || (currentUpdate.status === 'error' && currentUpdate.version)) {
    const started = await window.primecad.updates.download();
    if (!started && currentUpdate.status !== 'error') updateError.textContent = 'The update could not be started. Your current installation is unchanged.';
  } else if (currentUpdate.status === 'downloaded') {
    await window.primecad.updates.install();
  }
  if (currentUpdate.status !== 'downloading') updatePrimary.disabled = false;
});
updateSkip.addEventListener('click', async () => {
  if (currentUpdate.version) await window.primecad.updates.skip(currentUpdate.version);
});
updateLater.addEventListener('click', () => {
  if (currentUpdate.status === 'downloading') hideDownloadNotice = true;
  updateNotice.hidden = true;
});
window.primecad.on('update:state', renderUpdateState);
window.primecad.updates.getState().then(renderUpdateState).catch(() => {});

async function loadServers() {
  try {
    [servers, selectedId] = await Promise.all([window.primecad.servers.list(), window.primecad.servers.selected()]);
    renderServers();
    if (!servers.some(server => server.id === selectedId)) showServerView();
  } catch (error) {
    showFormStatus(error.message || 'Could not read local server profiles.', 'error');
  }
}

function renderServers() {
  const query = search.value.trim().toLocaleLowerCase('en-US');
  const filtered = servers.filter(server => `${server.name} ${server.label || ''}`.toLocaleLowerCase('en-US').includes(query));
  count.textContent = String(servers.length);
  list.innerHTML = '';
  list.hidden = filtered.length === 0;
  empty.hidden = servers.length !== 0;
  noResults.hidden = servers.length === 0 || filtered.length !== 0;

  for (const server of filtered) {
    const card = document.createElement('article');
    card.className = `server-card${selectedServerId() === server.id ? ' selected' : ''}`;
    card.dataset.id = server.id;
    const playerLine = server.currentPlayers == null || server.maxPlayers == null
      ? 'Status unavailable'
      : `${server.currentPlayers}/${server.maxPlayers} players`;
    const refreshed = server.refreshedAt ? `· updated ${new Date(server.refreshedAt).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})}` : '';
    card.innerHTML = `
      <div class="card-actions">
        <button type="button" class="card-icon-btn refresh" title="Refresh server status" aria-label="Refresh">↻</button>
        <button type="button" class="card-icon-btn remove" title="Remove server and its API key" aria-label="Remove">×</button>
      </div>
      <img class="server-logo" src="assets/era-logo.png" alt="ERA" />
      <h3 title="${escapeHtml(server.name)}">${escapeHtml(server.name)}</h3>
      <div class="server-meta"><span class="status-dot${server.currentPlayers == null ? ' offline' : ''}"></span><span>${escapeHtml(playerLine)}</span><span>${escapeHtml(refreshed)}</span></div>
      <div class="server-card-buttons"><button type="button" class="play-button view-players"><span>☷</span> View Players</button><button type="button" class="join-button">▶ Join Game</button></div>
      <div class="card-error" role="status" aria-live="polite"></div>`;
    card.querySelector('.refresh').addEventListener('click', () => refreshServer(server.id, card));
    card.querySelector('.remove').addEventListener('click', () => removeServer(server, card));
    card.querySelector('.view-players').addEventListener('click', () => selectServer(server.id, true, card));
    card.querySelector('.join-button').addEventListener('click', () => joinServer(server.id, card));
    card.addEventListener('click', event => {
      if (event.target.closest('button')) return;
      selectServer(server.id, true, card);
    });
    list.appendChild(card);
  }
}

async function selectServer(id, openPlayers, card) {
  try {
    await window.primecad.servers.select(id);
    selectedId = id;
    snapshot = null;
    selectedPlayerId = null;
    renderServers();
    window.primecad.notifyServerProfileUpdated();
    if (openPlayers) {
      showPlayersView();
      await refreshPlayers();
    }
  } catch (error) {
    (card?.querySelector('.card-error') || playersError).textContent = error.message || 'Could not select this server.';
  }
}

async function addServer(event) {
  event.preventDefault();
  const apiKey = keyField.value.trim();
  if (!apiKey) return showFormStatus('Enter an ER:LC server API key.', 'error');
  saveButton.disabled = true;
  saveButton.textContent = 'Checking PRC API…';
  showFormStatus('Verifying the key and retrieving the server name from the PRC API.');
  try {
    const server = await window.primecad.servers.add({ label: labelField.value, apiKey });
    servers.push(server);
    selectedId = server.id;
    toggleAdd(false);
    renderServers();
    window.primecad.notifyServerProfileUpdated();
    showPlayersView();
    await refreshPlayers();
  } catch (error) {
    showFormStatus(error.message || 'Could not add this server.', 'error');
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Verify & Add';
  }
}

async function refreshServer(id, card) {
  const errorBox = card.querySelector('.card-error');
  errorBox.textContent = 'Refreshing…';
  try {
    const updated = await window.primecad.servers.refresh(id);
    servers = servers.map(server => server.id === id ? updated : server);
    renderServers();
    window.primecad.notifyServerProfileUpdated();
  } catch (error) {
    errorBox.textContent = error.message || 'Could not refresh server status.';
  }
}

async function joinServer(id, card) {
  const button = card.querySelector('.join-button');
  const errorBox = card.querySelector('.card-error');
  button.disabled = true;
  errorBox.textContent = '';
  try {
    const updated = await window.primecad.servers.play(id);
    servers = servers.map(server => server.id === id ? updated : server);
    selectedId = id;
    renderServers();
    window.primecad.notifyServerProfileUpdated();
  } catch (error) {
    errorBox.textContent = error.message || 'Could not open the Roblox server link.';
  } finally {
    button.disabled = false;
  }
}

async function removeServer(server, card) {
  const accepted = await window.primecad.confirmRemove(server.name);
  if (!accepted) return;
  try {
    await window.primecad.servers.remove(server.id);
    servers = servers.filter(item => item.id !== server.id);
    selectedId = await window.primecad.servers.selected();
    snapshot = null;
    showServerView();
    renderServers();
    window.primecad.notifyServerProfileUpdated();
  } catch (error) {
    card.querySelector('.card-error').textContent = error.message || 'Could not remove server.';
  }
}

async function refreshPlayers() {
  if (!selectedId) return;
  const refreshButton = document.getElementById('refreshPlayers');
  refreshButton.disabled = true;
  playersError.textContent = 'Loading the current player list from PRC…';
  playersError.className = 'players-error';
  try {
    snapshot = await window.primecad.players.refresh(selectedId);
    lastRefreshed = Date.now();
    if (!snapshot.players.some(player => player.id === selectedPlayerId)) selectedPlayerId = null;
    document.getElementById('playersServerName').textContent = snapshot.serverName;
    document.getElementById('playerRefreshTime').textContent = `Updated ${new Date(lastRefreshed).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;
    playersError.textContent = '';
    renderPlayers();
  } catch (error) {
    playersError.textContent = error.message || 'Could not fetch the live player list.';
    playersError.className = 'players-error error';
    playerList.innerHTML = '';
    renderPlayerDetail();
  } finally {
    refreshButton.disabled = false;
  }
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return 'Session time unavailable';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `On server ${h ? `${h}h ` : ''}${m}m ${sec}s`;
}
function renderPlayers() {
  const q = document.getElementById('searchPlayers').value.trim().toLowerCase();
  const players = snapshot?.players || [];
  const filtered = players.filter(player => `${player.username} ${player.id} ${player.team} ${player.callsign || ''}`.toLowerCase().includes(q));
  document.getElementById('playerCount').textContent = `${filtered.length}${q ? ` of ${players.length}` : ''} ${filtered.length === 1 ? 'player' : 'players'}`;
  playerList.innerHTML = '';
  if (!snapshot) {
    playerList.innerHTML = '<div class="list-empty">Refresh to load players.</div>';
  } else if (filtered.length === 0) {
    playerList.innerHTML = `<div class="list-empty">${players.length ? 'No matching player.' : 'No players are currently in the server.'}</div>`;
  } else {
    for (const player of filtered) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `player-row${player.id === selectedPlayerId ? ' active' : ''}`;
      row.innerHTML = `<span class="player-row-avatar">${escapeHtml(player.username.slice(0,2).toUpperCase())}</span><span class="player-row-copy"><strong>${escapeHtml(player.username)}</strong><small>ID ${escapeHtml(player.id)} · ${escapeHtml(player.team)}</small></span><i class="row-online-dot"></i>`;
      row.addEventListener('click', () => { selectedPlayerId = player.id; renderPlayers(); });
      playerList.appendChild(row);
    }
  }
  renderPlayerDetail();
}

function renderPlayerDetail() {
  const player = snapshot?.players.find(item => item.id === selectedPlayerId);
  detail.hidden = !player;
  detailEmpty.hidden = Boolean(player);
  if (!player) return;
  document.getElementById('playerAvatar').textContent = player.username.slice(0,2).toUpperCase();
  document.getElementById('detailUsername').textContent = player.username;
  document.getElementById('detailId').textContent = `ID ${player.id}`;
  document.getElementById('detailTeam').textContent = player.team;
  const callsign = document.getElementById('detailCallsign');
  callsign.hidden = !player.callsign;
  callsign.textContent = player.callsign || '';
  document.getElementById('detailPermission').textContent = player.permission;
  document.getElementById('detailSession').textContent = formatDuration(player.sessionSeconds);
  document.getElementById('detailKicks').textContent = player.kicks == null ? '—' : String(player.kicks);
  document.getElementById('detailBans').textContent = player.bans == null ? '—' : String(player.bans);
  document.getElementById('detailWanted').textContent = player.wantedStars == null ? '—' : player.wantedStars > 0 ? `${player.wantedStars} ★` : 'No';
  const location = document.getElementById('detailLocation');
  const place = [player.postalCode ? `Postal ${player.postalCode}` : '', player.streetName || ''].filter(Boolean).join(' · ');
  location.hidden = !place;
  location.textContent = place;
  const storedNote = localStorage.getItem(noteKey(player.id)) || '';
  const noteField = document.getElementById('staffNote');
  if (document.activeElement !== noteField) noteField.value = storedNote;
  document.getElementById('noteSavedState').textContent = storedNote ? 'Saved on this computer' : 'Not saved';
  document.getElementById('deleteStaffNote').hidden = !storedNote;
  const history = document.getElementById('playerHistory');
  if (player.history?.length) {
    history.innerHTML = player.history.map(item => `<div class="history-item"><span class="history-badge ${item.action.toLowerCase()}">${escapeHtml(item.action)}</span><time>${item.timestamp ? escapeHtml(new Date(item.timestamp * 1000).toLocaleString('en-US')) : 'Time unavailable'}</time></div>`).join('');
  } else {
    history.innerHTML = '<div class="history-empty">No matching kick or ban commands found in the returned API log entries.</div>';
  }
}

async function performPlayerAction(action) {
  const player = snapshot?.players.find(item => item.id === selectedPlayerId);
  if (!player || !selectedId) return;
  let argument = '';
  if (action === 'pm') {
    argument = await openActionComposer({title:'Private Message', hint:`To ${player.username}. Keep PMs occasional; PRC does not allow them to replace Roblox chat, the in-game phone, or radio.`, label:'Message', placeholder:'Write a short message…', maxLength:180});
    if (argument === null) return;
    if (!argument.trim() || /[\r\n]/.test(argument)) return showActionResult('Enter one short, single-line message (maximum 180 characters).', true);
    argument = argument.trim();
  } else if (action === 'kick') {
    argument = await openActionComposer({title:'Kick Player', hint:`Enter the server-visible reason for kicking ${player.username}.`, label:'Kick reason', placeholder:'Enter a brief, factual reason…', maxLength:120});
    if (argument === null) return;
    if (!argument.trim() || /[\r\n]/.test(argument)) return showActionResult('A short, single-line kick reason is required (maximum 120 characters).', true);
    argument = argument.trim();
  }
  try {
    const approved = await window.primecad.players.confirmAction({action, playerName:player.username, playerId:player.id, argument});
    if (!approved) return;
    showActionResult('Sending the command to the selected ER:LC server…');
    const result = await window.primecad.players.action({serverId:selectedId, playerId:player.id, action, argument});
    showActionResult(`${result.message} Refresh the player list to check the latest server state.`);
  } catch (error) {
    showActionResult(error.message || 'The command could not be sent.', true);
  }
}

function openActionComposer({title, hint, label, placeholder, maxLength}) {
  const modal = document.getElementById('actionComposer');
  const field = document.getElementById('actionArgument');
  document.getElementById('actionComposerTitle').textContent = title;
  document.getElementById('actionComposerHint').textContent = hint;
  document.getElementById('actionArgumentLabel').textContent = label;
  document.getElementById('actionArgumentCount').textContent = `0 / ${maxLength}`;
  field.value = '';
  field.maxLength = maxLength;
  field.placeholder = placeholder;
  modal.hidden = false;
  setTimeout(() => field.focus(), 0);
  return new Promise(resolve => { resolveActionComposer = resolve; });
}
function closeActionComposer(value) {
  document.getElementById('actionComposer').hidden = true;
  if (resolveActionComposer) resolveActionComposer(value);
  resolveActionComposer = null;
}
function showActionResult(message, isError = false) {
  playersError.textContent = message;
  playersError.className = `players-error${isError ? ' error' : ''}`;
}

function saveNote() {
  const player = snapshot?.players.find(item => item.id === selectedPlayerId);
  if (!player) return;
  const value = document.getElementById('staffNote').value.trim();
  if (value) localStorage.setItem(noteKey(player.id), value);
  else localStorage.removeItem(noteKey(player.id));
  renderPlayerDetail();
}

// Selection and server profiles live in the Electron main process. Notes stay local to this install.
document.getElementById('openAdd').addEventListener('click', () => toggleAdd(true));
document.getElementById('emptyAdd').addEventListener('click', () => toggleAdd(true));
document.getElementById('closeAdd').addEventListener('click', () => toggleAdd(false));
document.getElementById('cancelAdd').addEventListener('click', () => toggleAdd(false));
document.getElementById('toggleKey').addEventListener('click', event => {
  const visible = keyField.type === 'password';
  keyField.type = visible ? 'text' : 'password';
  event.currentTarget.textContent = visible ? 'Hide' : 'Show';
});
document.getElementById('settingsInfo').addEventListener('click', () => toggleAdd(true));
document.getElementById('openGameOverlay').addEventListener('click', () => window.primecad.openPlayerOverlay());
form.addEventListener('submit', addServer);
search.addEventListener('input', renderServers);
document.getElementById('searchPlayers').addEventListener('input', renderPlayers);
document.getElementById('refreshPlayers').addEventListener('click', refreshPlayers);
document.getElementById('backToServers').addEventListener('click', showServerView);
document.getElementById('saveStaffNote').addEventListener('click', saveNote);
document.getElementById('deleteStaffNote').addEventListener('click', () => {
  const player = snapshot?.players.find(item => item.id === selectedPlayerId);
  if (!player) return;
  localStorage.removeItem(noteKey(player.id));
  document.getElementById('staffNote').value = '';
  renderPlayerDetail();
});
document.getElementById('cancelActionComposer').addEventListener('click', () => closeActionComposer(null));
document.getElementById('actionComposer').addEventListener('click', event => { if (event.target.id === 'actionComposer') closeActionComposer(null); });
document.getElementById('actionComposerForm').addEventListener('submit', event => {
  event.preventDefault();
  closeActionComposer(document.getElementById('actionArgument').value);
});
document.getElementById('actionArgument').addEventListener('input', event => {
  const max = Number(event.currentTarget.maxLength);
  document.getElementById('actionArgumentCount').textContent = `${event.currentTarget.value.length} / ${max}`;
});
document.querySelectorAll('[data-player-action]').forEach(button => button.addEventListener('click', () => performPlayerAction(button.dataset.playerAction)));
document.getElementById('closeDashboard').addEventListener('click', () => window.primecad.closeDashboard());
document.getElementById('minimizeBtn').addEventListener('click', () => window.primecad.minimizeDashboard());
document.getElementById('maximizeBtn').addEventListener('click', () => window.primecad.toggleMaximizeDashboard());
document.getElementById('quitApp').addEventListener('click', () => window.primecad.quit());

window.primecad.on('open-player-list', async () => {
  try {
    selectedId = await window.primecad.servers.selected();
    if (!selectedId) {
      showServerView();
      toggleAdd(true);
      return;
    }
    snapshot = null;
    selectedPlayerId = null;
    showPlayersView();
    await refreshPlayers();
  } catch (error) {
    showActionResult(error.message || 'Could not open the player list.', true);
  }
});
window.primecad.on('server-profile-updated', loadServers);
setInterval(() => {
  const player = snapshot?.players.find(item => item.id === selectedPlayerId);
  if (player && player.sessionSeconds != null && !playersPanel.hidden) {
    const elapsed = Math.max(0, Math.floor((Date.now() - lastRefreshed) / 1000));
    document.getElementById('detailSession').textContent = formatDuration(player.sessionSeconds + elapsed);
  }
}, 1000);
loadServers();
