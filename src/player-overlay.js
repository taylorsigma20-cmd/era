const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let snapshot = null;
let serverId = null;
let chosenPlayerId = null;
let loading = false;
let lastRefresh = 0;
let hasAttempted = false;

function status(message = '', error = false) {
  $('overlayStatus').textContent = message;
  $('overlayStatus').className = `overlay-status${error ? ' error' : ''}`;
}
function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return 'Session duration unavailable';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  return `On server ${hours ? `${hours} h ` : ''}${minutes} min ${remainder} sec`;
}
function playerMatches(player, query) {
  return `${player.username} ${player.id} ${player.team} ${player.callsign || ''}`.toLocaleLowerCase('en-US').includes(query);
}
function renderRoster() {
  const query = $('playerSearch').value.trim().toLocaleLowerCase('en-US');
  const allPlayers = snapshot?.players || [];
  const players = allPlayers.filter(player => playerMatches(player, query));
  $('playerCount').textContent = String(allPlayers.length);
  $('playerList').innerHTML = '';
  if (!snapshot) {
    $('playerList').innerHTML = '<div class="roster-empty">Loading player roster…</div>';
    renderProfile();
    return;
  }
  if (!players.length) {
    $('playerList').innerHTML = `<div class="roster-empty">${allPlayers.length ? 'No players match that search.' : 'No players are currently in the server.'}</div>`;
  } else {
    for (const player of players) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `player-row${player.id === chosenPlayerId ? ' selected' : ''}`;
      row.innerHTML = `<span class="player-avatar-small">${escapeHtml(player.username.slice(0,2).toUpperCase())}</span><span class="player-copy"><strong>${escapeHtml(player.username)}</strong><small>ID ${escapeHtml(player.id)} · ${escapeHtml(player.team)}</small></span><i class="online-dot"></i>`;
      row.addEventListener('click', () => {
        chosenPlayerId = player.id;
        renderRoster();
      });
      $('playerList').appendChild(row);
    }
  }
  renderProfile();
}
function renderProfile() {
  const player = snapshot?.players.find(item => item.id === chosenPlayerId);
  $('profilePanel').hidden = !player;
  $('emptyProfile').hidden = Boolean(player);
  if (!player) return;
  $('playerAvatar').textContent = player.username.slice(0,2).toUpperCase();
  $('playerUsername').textContent = player.username;
  $('playerId').textContent = `ID ${player.id}`;
  $('playerTeam').textContent = player.team || 'Unknown team';
  $('playerPermission').textContent = player.permission || 'Unknown';
  $('playerCallsign').hidden = !player.callsign;
  $('playerCallsign').textContent = player.callsign || '';
  $('sessionTime').textContent = formatDuration(player.sessionSeconds);
  $('kickCount').textContent = player.kicks == null ? '—' : String(player.kicks);
  $('banCount').textContent = player.bans == null ? '—' : String(player.bans);
  $('wantedStatus').textContent = player.wantedStars == null ? '—' : player.wantedStars > 0 ? `${player.wantedStars} ★` : 'No';
  $('wantedStatus').parentElement.classList.toggle('wanted', player.wantedStars > 0);
  const location = [player.postalCode ? `Postal ${player.postalCode}` : '', player.streetName || ''].filter(Boolean).join(' · ');
  $('playerLocation').hidden = !location;
  $('playerLocation').textContent = location;
}

async function refreshPlayers({force = false} = {}) {
  if (loading) return;
  const selected = await window.primecad.servers.selected();
  const servers = await window.primecad.servers.list();
  if (!selected || !servers.some(server => server.id === selected)) {
    serverId = null;
    snapshot = null;
    chosenPlayerId = null;
    $('serverName').textContent = 'Select a server in ERA';
    $('updateTime').textContent = 'No server selected';
    status('Add and select an ER:LC server in the ERA staff dashboard.', true);
    renderRoster();
    return;
  }
  if (!force && snapshot && selected === serverId) return;
  loading = true;
  serverId = selected;
  hasAttempted = true;
  $('refreshPlayers').disabled = true;
  $('serverName').textContent = servers.find(server => server.id === selected)?.name || 'Selected ER:LC server';
  $('playerList').innerHTML = '<div class="roster-empty">Refreshing from the PRC API…</div>';
  status('Requesting the live player list…');
  try {
    snapshot = await window.primecad.players.refresh(selected);
    lastRefresh = Date.now();
    if (!snapshot.players.some(player => player.id === chosenPlayerId)) chosenPlayerId = snapshot.players[0]?.id || null;
    $('serverName').textContent = snapshot.serverName;
    $('updateTime').textContent = `Updated ${new Date(lastRefresh).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})}`;
    status('');
    renderRoster();
  } catch (error) {
    if (selected !== serverId) return;
    snapshot = null;
    chosenPlayerId = null;
    $('playerList').innerHTML = '<div class="roster-empty">Player list unavailable. Check the ERA staff dashboard for the API error.</div>';
    $('updateTime').textContent = 'Refresh failed';
    status(error.message || 'Could not fetch the player list.', true);
    renderProfile();
  } finally {
    loading = false;
    $('refreshPlayers').disabled = false;
  }
}

$('refreshPlayers').addEventListener('click', () => refreshPlayers({force:true}));
$('hideOverlay').addEventListener('click', () => window.primecad.hidePlayerOverlay());
$('openStaffTools').addEventListener('click', () => window.primecad.openStaffTools());
$('playerSearch').addEventListener('input', () => {
  $('clearSearch').hidden = !$('playerSearch').value;
  renderRoster();
});
$('clearSearch').addEventListener('click', () => {
  $('playerSearch').value = '';
  $('clearSearch').hidden = true;
  renderRoster();
});
window.primecad.on('player-overlay:show', async () => {
  if (!hasAttempted) await refreshPlayers();
  else renderRoster();
});
window.primecad.on('player-overlay:access-denied', message => {
  snapshot = null;
  chosenPlayerId = null;
  serverId = null;
  hasAttempted = false;
  $('playerSearch').value = '';
  $('playerCount').textContent = '—';
  $('serverName').textContent = 'Access restricted';
  $('updateTime').textContent = '';
  $('playerList').innerHTML = '<div class="roster-empty">Player records are not displayed.</div>';
  renderProfile();
  status(message || 'You are not authorized to view this server.', true);
});
window.primecad.on('server-profile-updated', async () => {
  snapshot = null;
  chosenPlayerId = null;
  hasAttempted = false;
  await refreshPlayers();
});
window.primecad.on('player-overlay:show', () => {
  if (snapshot && chosenPlayerId && lastRefresh) {
    const player = snapshot.players.find(item => item.id === chosenPlayerId);
    if (player?.sessionSeconds != null) {
      const elapsed = Math.max(0, Math.floor((Date.now() - lastRefresh) / 1000));
      $('sessionTime').textContent = formatDuration(player.sessionSeconds + elapsed);
    }
  }
});
renderRoster();
setInterval(() => {
  if (document.visibilityState !== 'visible' || !snapshot || !chosenPlayerId || !lastRefresh) return;
  const player = snapshot.players.find(item => item.id === chosenPlayerId);
  if (player?.sessionSeconds == null) return;
  const elapsed = Math.max(0, Math.floor((Date.now() - lastRefresh) / 1000));
  $('sessionTime').textContent = formatDuration(player.sessionSeconds + elapsed);
}, 1000);
