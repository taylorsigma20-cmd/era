const { app, BrowserWindow, globalShortcut, ipcMain, screen, safeStorage, shell, dialog, desktopCapturer, session } = require('electron');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const { pathToFileURL } = require('url');
const { autoUpdater } = require('electron-updater');
const { ActiveWindow } = require('@paymoapp/active-window');
const { createPlayerSnapshot } = require('./player-data');
const { updateRobloxSession } = require('./focus-guard');
const { parsePostimeesFeed } = require('./postimees-feed');
const { createCommunityBackend } = require('./community-backend');

app.setName('ERA');
// Preserve the pre-ERA default user-data folder so existing installs keep their server profiles and phone data.
app.setPath('userData', path.join(app.getPath('appData'), 'PrimeCAD Overlay'));

const PHONE_WIDTH = 292;
const PHONE_HEIGHT = 604;
const PLAYER_OVERLAY_WIDTH = 820;
const PLAYER_OVERLAY_HEIGHT = 430;
const ERLC_SERVER_API = 'https://api.erlc.gg/v2/server';
const ERLC_GAME_URL = 'https://www.roblox.com/games/2534724415/Emergency-Response-Liberty-County';

let phoneWindow;
let dashboardWindow;
let playerOverlayWindow;
let updateState = { status: 'idle' };
let robloxSessionActive = false;
let activeWindowWatch = null;
const staffSnapshotCache = new Map();
let communityBackend;

function communityService() {
  if (!communityBackend) communityBackend = createCommunityBackend(app);
  return communityBackend;
}

function assertPhoneWindowSender(event) {
  assertTrustedSender(event);
  if (event.sender !== phoneWindow?.webContents) throw new Error('The community service is available only in the ERA phone.');
}

function phoneProfileFile() {
  return path.join(app.getPath('userData'), 'phone-profile.json');
}

async function readPhoneProfile() {
  try {
    const profile = JSON.parse(await fs.readFile(phoneProfileFile(), 'utf8'));
    return {
      name: typeof profile.name === 'string' ? profile.name : '',
      robloxUserId: /^\d{1,20}$/.test(String(profile.robloxUserId || '')) ? String(profile.robloxUserId) : '',
      phoneNumber: typeof profile.phoneNumber === 'string' ? profile.phoneNumber : '',
      wallpaper: typeof profile.wallpaper === 'string' ? profile.wallpaper : 'midnight',
      language: profile.language === 'et' ? 'et' : 'en'
    };
  } catch (error) {
    if (error.code === 'ENOENT') return { name: '', robloxUserId: '', phoneNumber: '', wallpaper: 'midnight', language: 'en' };
    throw new Error('Could not read the local phone profile.');
  }
}

async function writePhoneProfile(profile) {
  const file = phoneProfileFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tempFile = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(profile, null, 2), { mode: 0o600 });
  await fs.rename(tempFile, file);
}

async function getPhoneProfileWithWallpaper() {
  const profile = await readPhoneProfile();
  if (profile.wallpaper === 'custom') {
    try {
      const directory = path.join(app.getPath('userData'), 'wallpapers');
      const names = await fs.readdir(directory);
      const file = names.find(name => /^custom\.(png|jpe?g|webp)$/i.test(name));
      if (file) {
        const extension = path.extname(file).toLowerCase();
        const mime = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg';
        const bytes = await fs.readFile(path.join(directory, file));
        profile.customWallpaperDataUrl = `data:${mime};base64,${bytes.toString('base64')}`;
      }
    } catch { /* A missing custom file falls back to the selected preset. */ }
  }
  return profile;
}

function updateSkipFile() {
  return path.join(app.getPath('userData'), 'skipped-update.json');
}

async function skippedUpdateVersion() {
  try {
    const data = JSON.parse(await fs.readFile(updateSkipFile(), 'utf8'));
    return typeof data.version === 'string' ? data.version : null;
  } catch {
    return null;
  }
}

async function saveSkippedUpdate(version) {
  const file = updateSkipFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tempFile = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify({ version }), { mode: 0o600 });
  await fs.rename(tempFile, file);
}

function sendUpdateState() {
  if (!dashboardWindow || dashboardWindow.isDestroyed()) return;
  const send = () => {
    if (dashboardWindow && !dashboardWindow.isDestroyed()) dashboardWindow.webContents.send('update:state', updateState);
  };
  if (dashboardWindow.webContents.isLoading()) dashboardWindow.webContents.once('did-finish-load', send);
  else send();
}

function setUpdateState(state) {
  updateState = state;
  sendUpdateState();
}

function configureAutoUpdates() {
  if (!app.isPackaged || process.platform !== 'win32') return;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.on('update-available', async info => {
    if (await skippedUpdateVersion() === info.version) {
      setUpdateState({ status: 'idle' });
      return;
    }
    setUpdateState({ status: 'available', version: info.version });
  });
  autoUpdater.on('update-not-available', () => setUpdateState({ status: 'idle' }));
  autoUpdater.on('download-progress', progress => setUpdateState({
    status: 'downloading', version: updateState.version,
    percent: Math.max(0, Math.min(100, Number(progress.percent) || 0)),
    bytesPerSecond: Number(progress.bytesPerSecond) || 0
  }));
  autoUpdater.on('update-downloaded', info => setUpdateState({ status: 'downloaded', version: info.version }));
  autoUpdater.on('error', error => setUpdateState({
    status: 'error', version: updateState.version,
    message: String(error?.message || 'Update failed. Try again later.').slice(0, 300)
  }));
  setUpdateState({ status: 'checking' });
  const timer = setTimeout(() => autoUpdater.checkForUpdates().catch(error => {
    setUpdateState({ status: 'error', message: String(error?.message || 'Could not check for updates.').slice(0, 300) });
  }), 2500);
  timer.unref?.();
}

function appDataFile() {
  return path.join(app.getPath('userData'), 'server-profiles.json');
}

function selectionFile() {
  return path.join(app.getPath('userData'), 'selected-server.json');
}

function assertTrustedSender(event) {
  const url = event.senderFrame?.url || '';
  const allowed = [path.join(__dirname, 'index.html'), path.join(__dirname, 'dashboard.html'), path.join(__dirname, 'player-overlay.html')]
    .map(file => pathToFileURL(file).href);
  if (!allowed.includes(url)) throw new Error('Untrusted page requested a privileged operation.');
}

function placePhoneBottomRight() {
  if (!phoneWindow || phoneWindow.isDestroyed()) return;
  const area = screen.getPrimaryDisplay().workArea;
  const x = Math.max(area.x + 4, area.x + area.width - PHONE_WIDTH - 8);
  const y = Math.max(area.y + 4, area.y + area.height - PHONE_HEIGHT - 4);
  phoneWindow.setPosition(x, y, false);
}

function hidePhoneWindow() {
  if (!phoneWindow || phoneWindow.isDestroyed()) return;
  if (!phoneWindow.webContents.isDestroyed()) phoneWindow.webContents.send('phone-hidden');
  phoneWindow.hide();
}

function togglePhoneWindow() {
  if (!phoneWindow || phoneWindow.isDestroyed()) return;
  if (!robloxSessionActive) { hidePhoneWindow(); return; }
  if (phoneWindow.isVisible()) {
    hidePhoneWindow();
  } else {
    placePhoneBottomRight();
    phoneWindow.showInactive();
    notifyPhoneShown();
  }
}

function notifyPhoneShown() {
  if (!phoneWindow || phoneWindow.isDestroyed()) return;
  const send = () => {
    if (phoneWindow && !phoneWindow.isDestroyed() && phoneWindow.isVisible()) phoneWindow.webContents.send('phone-shown');
  };
  if (phoneWindow.webContents.isLoading()) phoneWindow.webContents.once('did-finish-load', send);
  else send();
}

function createPhoneWindow() {
  phoneWindow = new BrowserWindow({
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    title: 'ERA Phone',
    minWidth: PHONE_WIDTH,
    maxWidth: PHONE_WIDTH,
    minHeight: PHONE_HEIGHT,
    maxHeight: PHONE_HEIGHT,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  phoneWindow.setAlwaysOnTop(true, 'screen-saver');
  phoneWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  phoneWindow.loadFile(path.join(__dirname, 'index.html'));
  phoneWindow.once('ready-to-show', () => {
    placePhoneBottomRight();
    // Keep the phone out of the way until the user explicitly presses F1.
  });
  phoneWindow.on('closed', () => { phoneWindow = null; });
}

function configureRobloxScreenCapture() {
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      const trustedPhoneUrl = pathToFileURL(path.join(__dirname, 'index.html')).href;
      if (!request.userGesture || request.frame?.top?.url !== trustedPhoneUrl || request.frame?.url !== trustedPhoneUrl || !phoneWindow || phoneWindow.isDestroyed()) {
        callback(null);
        return;
      }
      const sources = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 0, height: 0 } });
      const robloxSources = sources.filter(source => /roblox/i.test(source.name));
      if (!robloxSources.length) {
        await dialog.showMessageBox(phoneWindow, { type: 'info', buttons: ['OK'], title: 'Roblox window not found', message: 'Open Roblox first, then try the Camera again.' });
        callback(null);
        return;
      }
      const result = await dialog.showMessageBox(phoneWindow, {
        type: 'question',
        buttons: ['Cancel', ...robloxSources.map(source => source.name.slice(0, 70))],
        defaultId: 0,
        cancelId: 0,
        title: 'Choose Roblox window',
        message: 'Select the Roblox window you want ERA Camera to capture.',
        detail: 'ERA captures only after you choose a window and press the shutter. Captures stay on this computer.'
      });
      const selected = result.response > 0 ? robloxSources[result.response - 1] : null;
      callback(selected ? { video: selected } : null);
    } catch {
      callback(null);
    }
  });
}

function createDashboardWindow() {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.show();
    dashboardWindow.focus();
    return;
  }
  dashboardWindow = new BrowserWindow({
    width: 1160,
    height: 770,
    minWidth: 900,
    minHeight: 650,
    show: false,
    frame: false,
    backgroundColor: '#08090c',
    title: 'ERA',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  dashboardWindow.loadFile(path.join(__dirname, 'dashboard.html'));
  dashboardWindow.once('ready-to-show', () => dashboardWindow?.show());
  dashboardWindow.on('closed', () => { dashboardWindow = null; });
}

function placePlayerOverlay() {
  if (!playerOverlayWindow || playerOverlayWindow.isDestroyed()) return;
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const area = display.workArea;
  const x = Math.max(area.x + 8, area.x + Math.round((area.width - PLAYER_OVERLAY_WIDTH) / 2));
  const y = Math.max(area.y + 8, area.y + 34);
  playerOverlayWindow.setPosition(x, y, false);
}

function createPlayerOverlayWindow() {
  if (playerOverlayWindow && !playerOverlayWindow.isDestroyed()) return playerOverlayWindow;
  playerOverlayWindow = new BrowserWindow({
    width: PLAYER_OVERLAY_WIDTH,
    height: PLAYER_OVERLAY_HEIGHT,
    minWidth: PLAYER_OVERLAY_WIDTH,
    maxWidth: PLAYER_OVERLAY_WIDTH,
    minHeight: PLAYER_OVERLAY_HEIGHT,
    maxHeight: PLAYER_OVERLAY_HEIGHT,
    title: 'ERA Live Player Overlay',
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  playerOverlayWindow.setAlwaysOnTop(true, 'screen-saver');
  playerOverlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  playerOverlayWindow.loadFile(path.join(__dirname, 'player-overlay.html'));
  playerOverlayWindow.once('ready-to-show', placePlayerOverlay);
  playerOverlayWindow.on('closed', () => { playerOverlayWindow = null; });
  return playerOverlayWindow;
}

async function showPlayerOverlay() {
  if (!robloxSessionActive) return false;
  try {
    const profileId = await readSelectedServerId();
    if (!profileId) throw new Error('Select a live ER:LC server first.');
    await requireConfiguredServerRole(profileId, 'admin');
  } catch (error) {
    const deniedWindow = createPlayerOverlayWindow();
    placePlayerOverlay();
    deniedWindow.showInactive();
    const message = String(error?.message || 'F3 requires a live Server Administrator account.');
    const notify = () => { if (!deniedWindow.isDestroyed()) deniedWindow.webContents.send('player-overlay:access-denied', message); };
    if (deniedWindow.webContents.isLoading()) deniedWindow.webContents.once('did-finish-load', notify); else notify();
    return false;
  }
  const win = createPlayerOverlayWindow();
  placePlayerOverlay();
  win.showInactive();
  win.setAlwaysOnTop(true, 'screen-saver');
  const notify = () => {
    if (!win.isDestroyed() && win.isVisible()) win.webContents.send('player-overlay:show');
  };
  if (win.webContents.isLoading()) win.webContents.once('did-finish-load', notify);
  else notify();
  return true;
}

async function togglePlayerOverlay() {
  if (!robloxSessionActive) {
    phoneWindow?.hide();
    playerOverlayWindow?.hide();
    return false;
  }
  if (playerOverlayWindow && !playerOverlayWindow.isDestroyed() && playerOverlayWindow.isVisible()) playerOverlayWindow.hide();
  else await showPlayerOverlay();
}

function startRobloxFocusGuard() {
  if (process.platform !== 'win32') {
    robloxSessionActive = true;
    return;
  }
  try {
    ActiveWindow.initialize();
    try { robloxSessionActive = updateRobloxSession(false, ActiveWindow.getActiveWindow(), process.execPath); }
    catch { robloxSessionActive = false; }
    activeWindowWatch = ActiveWindow.subscribe(info => {
      robloxSessionActive = updateRobloxSession(robloxSessionActive, info, process.execPath);
      if (!robloxSessionActive) {
        phoneWindow?.hide();
        playerOverlayWindow?.hide();
      }
    });
  } catch {
    robloxSessionActive = false;
  }
}

async function readProfiles() {
  try {
    const raw = await fs.readFile(appDataFile(), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.servers) ? parsed.servers : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new Error('Could not read the local server profile file.');
  }
}

async function writeProfiles(servers) {
  const file = appDataFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tempFile = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify({ version: 1, servers }, null, 2), { mode: 0o600 });
  await fs.rename(tempFile, file);
}

async function readSelectedServerId() {
  try {
    const data = JSON.parse(await fs.readFile(selectionFile(), 'utf8'));
    return typeof data.id === 'string' ? data.id : null;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new Error('Could not read the selected server setting.');
  }
}

async function writeSelectedServerId(id) {
  const file = selectionFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tempFile = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify({ id: id || null }), { mode: 0o600 });
  await fs.rename(tempFile, file);
}

function publicProfile(profile) {
  return {
    id: profile.id,
    label: profile.label || '',
    name: profile.status?.name || profile.label || 'Private ER:LC Server',
    currentPlayers: profile.status?.currentPlayers ?? null,
    maxPlayers: profile.status?.maxPlayers ?? null,
    refreshedAt: profile.status?.refreshedAt || null
  };
}

function savedStatus(status) {
  // JoinKey is a private join code: keep it in memory only for the Play action.
  return {
    name: status.name,
    currentPlayers: status.currentPlayers,
    maxPlayers: status.maxPlayers,
    refreshedAt: status.refreshedAt
  };
}

function encryptKey(apiKey) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Windows secure storage is unavailable. The key was not saved.');
  }
  return safeStorage.encryptString(apiKey).toString('base64');
}

function decryptKey(profile) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Windows secure storage is unavailable. The API key could not be accessed.');
  }
  return safeStorage.decryptString(Buffer.from(profile.encryptedKey, 'base64'));
}

async function fetchServerStatus(apiKey, profileId = null) {
  if (profileId) assertProfileRequestAllowed(profileId);
  let response;
  try {
    response = await fetch(ERLC_SERVER_API, {
      method: 'GET',
      headers: { 'server-key': apiKey, accept: 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error('The PRC API did not respond within 15 seconds. Try again later.');
    }
    throw new Error('Could not connect to the PRC API. Check your internet connection.');
  }

  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* API/proxy may return non-JSON errors */ }

  if (response.status === 403) {
    if (profileId) recordProfileRateLimit(profileId, response, data);
    throw new Error('The PRC API rejected the key (403). Check that this server API key is valid. Invalid keys are not retried automatically.');
  }
  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after') || data.retry_after || data.retryAfter;
    if (profileId) recordProfileRateLimit(profileId, response, data);
    const suffix = retryAfter ? ` Wait at least ${retryAfter} seconds.` : ' Wait before making another request.';
    throw new Error(`PRC API rate limit reached (429).${suffix}`);
  }
  if (!response.ok) {
    const detail = typeof data.message === 'string' ? data.message : '';
    throw new Error(`The PRC API returned an error (${response.status})${detail ? `: ${detail}` : '.'}`);
  }
  if (!data || typeof data.Name !== 'string' || !Number.isFinite(Number(data.CurrentPlayers)) || !Number.isFinite(Number(data.MaxPlayers))) {
    throw new Error('Unexpected PRC API response. Check that you used an ER:LC server API key.');
  }

  return {
    name: data.Name,
    currentPlayers: Number(data.CurrentPlayers),
    maxPlayers: Number(data.MaxPlayers),
    joinKey: typeof data.JoinKey === 'string' ? data.JoinKey : '',
    refreshedAt: new Date().toISOString()
  };
}

const blockedProfileRequests = new Map();
const invalidProfileKeys = new Set();
function assertProfileRequestAllowed(profileId) {
  if (invalidProfileKeys.has(profileId)) throw new Error('PRC has already rejected this profile key. Requests are stopped; remove the profile and verify the key before adding it again.');
  const until = blockedProfileRequests.get(profileId) || 0;
  if (Date.now() < until) throw new Error(`PRC requested that this server wait ${Math.ceil((until - Date.now()) / 1000)} seconds before any more API requests.`);
  if (until) blockedProfileRequests.delete(profileId);
}
function recordProfileRateLimit(profileId, response, data) {
  const delay = response.headers.get('retry-after') || data.retry_after || data.retryAfter;
  const seconds = Number(delay);
  if (response.status === 429) {
    // Without a usable Retry-After, fail closed for 60 seconds instead of continuing to poll.
    blockedProfileRequests.set(profileId, Date.now() + Math.max(1, Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000);
  }
  if (response.status === 403) invalidProfileKeys.add(profileId);
  return delay;
}

async function fetchPlayerSnapshot(profileId) {
  assertProfileRequestAllowed(profileId);
  const profiles = await readProfiles();
  const profile = profiles.find(item => item.id === profileId);
  if (!profile) throw new Error('Server not found. Add/select its API profile first.');
  const apiKey = decryptKey(profile);
  const url = new URL('https://api.erlc.gg/v2/server');
  url.searchParams.set('Players', 'true');
  url.searchParams.set('JoinLogs', 'true');
  url.searchParams.set('CommandLogs', 'true');
  let response;
  try {
    response = await fetch(url, { headers: { 'server-key': apiKey, accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') throw new Error('The ER:LC player request timed out. Try again later.');
    throw new Error('Could not connect to the ER:LC API. Check your internet connection.');
  }
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* Preserve the safe generic API error below. */ }
  if (response.status === 403) {
    recordProfileRateLimit(profileId, response, data);
    throw new Error('The ER:LC API rejected this server key. Requests are stopped for this profile; update or remove the key before trying again.');
  }
  if (response.status === 429) {
    const delay = recordProfileRateLimit(profileId, response, data);
    throw new Error(`PRC rate limit reached. Stop requests and wait${delay ? ` ${delay} seconds` : ' for the Retry-After period'} before retrying.`);
  }
  if (!response.ok) throw new Error(`The ER:LC API returned an error (${response.status}).`);
  return createPlayerSnapshot(profile.id, data);
}

async function requireConfiguredServerRole(profileId, requiredRole) {
  const profile = await readPhoneProfile();
  if (!profile.robloxUserId) throw new Error('Open Phone Settings and enter your Roblox user ID first.');
  const cached = staffSnapshotCache.get(profileId);
  const snapshot = cached && Date.now() - cached.timestamp < 15000
    ? cached.snapshot
    : await fetchPlayerSnapshot(profileId);
  staffSnapshotCache.set(profileId, { timestamp: Date.now(), snapshot });
  const player = snapshot.players.find(item => item.id === profile.robloxUserId);
  if (!player) throw new Error('Your configured Roblox account is not in the selected server right now.');
  const permission = String(player.permission || '').toLowerCase();
  const isOwner = permission === 'server owner';
  const isAdministrator = isOwner || permission === 'server administrator';
  if (requiredRole === 'owner' && !isOwner) throw new Error('The CAD player roster is restricted to the configured Server Owner.');
  if (requiredRole === 'admin' && !isAdministrator) throw new Error('F3 is available only to a Server Administrator or Server Owner in the selected live server.');
  return { player, snapshot };
}

async function fetchPostimeesHeadlines() {
  const now = Date.now();
  if (postimeesCache.items && now - postimeesCache.fetchedAt < 60_000) return postimeesCache;
  let response;
  try {
    response = await fetch('https://www.postimees.ee/rss', { headers: { accept: 'application/rss+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(12000) });
  } catch { throw new Error('Could not reach the Postimees news feed. Check your internet connection.'); }
  if (!response.ok) throw new Error(`Postimees RSS returned HTTP ${response.status}.`);
  const xml = await response.text();
  postimeesCache = parsePostimeesFeed(xml, now);
  return postimeesCache;
}

let postimeesCache = { items: null, fetchedAt: 0 };

const commandCooldowns = new Map();
async function executePlayerAction(profileId, playerId, action, argument) {
  const allowedActions = new Set(['pm', 'kick', 'ban', 'wanted', 'unwanted']);
  if (!allowedActions.has(action)) throw new Error('Unsupported player action.');
  const now = Date.now();
  const nextAllowed = commandCooldowns.get(profileId) || 0;
  if (now < nextAllowed) throw new Error(`Please wait ${Math.ceil((nextAllowed - now) / 1000)} seconds before sending another server command.`);
  if (await readSelectedServerId() !== profileId) throw new Error('Select this server in ERA before sending a player command.');
  const { snapshot } = await requireConfiguredServerRole(profileId, 'admin');
  const player = snapshot.players.find(item => item.id === String(playerId));
  if (!player) throw new Error('This player is no longer in the live player list. Refresh the list and try again.');
  const clean = String(argument || '').trim();
  if (action === 'pm' && (!clean || clean.length > 180 || /[\r\n]/.test(clean))) throw new Error('Enter one short, single-line private message (maximum 180 characters).');
  if (action === 'kick' && (!clean || clean.length > 120 || /[\r\n]/.test(clean))) throw new Error('A short, single-line kick reason is required (maximum 120 characters).');
  const commands = {
    pm: `:pm ${player.username} ${clean}`,
    kick: `:kick ${player.username} ${clean}`,
    ban: `:ban ${player.id}`,
    wanted: `:wanted ${player.username}`,
    unwanted: `:unwanted ${player.username}`
  };
  const profiles = await readProfiles();
  const profile = profiles.find(item => item.id === profileId);
  if (!profile) throw new Error('Server not found.');
  // Reserve the PRC VSM command slot before awaiting fetch so timeouts cannot trigger a duplicate action.
  commandCooldowns.set(profileId, Date.now() + 5000);
  let response;
  try {
    response = await fetch('https://api.erlc.gg/v2/server/command', {
      method: 'POST',
      headers: { 'server-key': decryptKey(profile), 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ command: commands[action] }),
      signal: AbortSignal.timeout(15000)
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') throw new Error('The command request timed out; check the server logs before retrying to avoid repeating an action.');
    throw new Error('Could not reach the ER:LC API. Check your internet connection.');
  }
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* Use a bounded generic response below. */ }
  if (response.status === 403) throw new Error('PRC refused this command (403). Confirm Remote Server Management is authorized for this server/IP before retrying.');
  if (response.status === 429) {
    const delay = response.headers.get('retry-after') || data.retry_after || data.retryAfter;
    recordProfileRateLimit(profileId, response, data);
    const retrySeconds = Number(delay);
    if (Number.isFinite(retrySeconds) && retrySeconds > 0) commandCooldowns.set(profileId, Date.now() + Math.max(5, retrySeconds) * 1000 + 1000);
    throw new Error(`PRC rate limit reached. Stop commands and wait${delay ? ` ${delay} seconds` : ' for the Retry-After period'} before retrying.`);
  }
  if (!response.ok) throw new Error(typeof data.message === 'string' ? `PRC command failed: ${data.message}` : `PRC command failed (${response.status}).`);
  return { action, player: player.username, message: String(data.message || 'Command accepted by PRC.') };
}

ipcMain.handle('servers:list', async (event) => {
  assertTrustedSender(event);
  return (await readProfiles()).map(publicProfile);
});

ipcMain.handle('servers:selected', async (event) => {
  assertTrustedSender(event);
  return readSelectedServerId();
});

ipcMain.handle('servers:select', async (event, id) => {
  assertTrustedSender(event);
  const servers = await readProfiles();
  if (!servers.some(profile => profile.id === id)) throw new Error('Server not found.');
  await writeSelectedServerId(id);
  return true;
});

ipcMain.handle('servers:add', async (event, input = {}) => {
  assertTrustedSender(event);
  const label = typeof input.label === 'string' ? input.label.trim().slice(0, 48) : '';
  const apiKey = typeof input.apiKey === 'string' ? input.apiKey.trim() : '';
  if (!apiKey) throw new Error('Enter an ER:LC private server API key.');

  // Validate with the server that this key belongs to before storing it.
  const status = await fetchServerStatus(apiKey);
  const servers = await readProfiles();
  const id = randomUUID();
  const profile = { id, label, encryptedKey: encryptKey(apiKey), status: savedStatus(status) };
  servers.push(profile);
  await writeProfiles(servers);
  await writeSelectedServerId(id);
  return publicProfile(profile);
});

ipcMain.handle('servers:refresh', async (event, id) => {
  assertTrustedSender(event);
  const servers = await readProfiles();
  const profile = servers.find(item => item.id === id);
  if (!profile) throw new Error('Server not found.');
  profile.status = savedStatus(await fetchServerStatus(decryptKey(profile), id));
  await writeProfiles(servers);
  return publicProfile(profile);
});

ipcMain.handle('servers:remove', async (event, id) => {
  assertTrustedSender(event);
  const servers = await readProfiles();
  const next = servers.filter(item => item.id !== id);
  if (next.length === servers.length) return false;
  await writeProfiles(next);
  if (await readSelectedServerId() === id) await writeSelectedServerId(next[0]?.id || null);
  return true;
});

ipcMain.handle('servers:play', async (event, id) => {
  assertTrustedSender(event);
  const servers = await readProfiles();
  const profile = servers.find(item => item.id === id);
  if (!profile) throw new Error('Server not found.');
  const status = await fetchServerStatus(decryptKey(profile), id);
  profile.status = savedStatus(status);
  await writeProfiles(servers);
  await writeSelectedServerId(id);
  if (!status.joinKey) throw new Error('The PRC API did not return a JoinKey for this server.');
  const url = new URL(ERLC_GAME_URL);
  url.searchParams.set('privateServerLinkCode', status.joinKey);
  await shell.openExternal(url.toString());
  return publicProfile(profile);
});

ipcMain.handle('players:refresh', async (event, profileId) => {
  assertTrustedSender(event);
  if (await readSelectedServerId() !== profileId) throw new Error('Select this server in ERA before refreshing its players.');
  const { snapshot } = await requireConfiguredServerRole(profileId, 'admin');
  return snapshot;
});

ipcMain.handle('players:action', async (event, input = {}) => {
  assertTrustedSender(event);
  return executePlayerAction(input.serverId, String(input.playerId || ''), String(input.action || ''), input.argument);
});

ipcMain.handle('players:confirm-action', async (event, input = {}) => {
  assertTrustedSender(event);
  const actionLabels = { pm: 'Send private message', kick: 'Kick player', ban: 'Ban player', wanted: 'Set wanted status', unwanted: 'Clear wanted status' };
  const action = String(input.action || '');
  if (!Object.hasOwn(actionLabels, action)) throw new Error('Unsupported player action.');
  const name = String(input.playerName || '').slice(0, 32);
  const playerId = String(input.playerId || '').replace(/\D/g, '').slice(0, 20);
  if (!name || !playerId) throw new Error('The selected player identity is incomplete.');
  const details = action === 'pm' || action === 'kick' ? `\n\n${String(input.argument || '').slice(0, 180)}` : '';
  const result = await dialog.showMessageBox(BrowserWindow.fromWebContents(event.sender), {
    type: action === 'ban' || action === 'kick' ? 'warning' : 'question',
    buttons: ['Cancel', 'Confirm'],
    defaultId: 0,
    cancelId: 0,
    title: `Confirm: ${actionLabels[action]}`,
    message: `${actionLabels[action]} for ${name} (${playerId})?`,
    detail: `This sends a real command to the currently selected ER:LC private server. The action may affect the player immediately.${details}`
  });
  return result.response === 1;
});

ipcMain.on('phone:hide', () => hidePhoneWindow());
ipcMain.on('phone:show', () => {
  if (!robloxSessionActive) return;
  if (!phoneWindow) return;
  placePhoneBottomRight();
  phoneWindow.showInactive();
  notifyPhoneShown();
});
ipcMain.on('phone:toggle', () => {
  if (!phoneWindow) return;
  if (!robloxSessionActive) { hidePhoneWindow(); return; }
  if (phoneWindow.isVisible()) hidePhoneWindow();
  else { placePhoneBottomRight(); phoneWindow.showInactive(); notifyPhoneShown(); }
});
ipcMain.on('dashboard:open', (event) => {
  assertTrustedSender(event);
  createDashboardWindow();
});
ipcMain.on('player-overlay:open', (event) => {
  assertTrustedSender(event);
  showPlayerOverlay();
});
ipcMain.on('player-overlay:open-tools', (event) => {
  assertTrustedSender(event);
  createDashboardWindow();
  const openSelectedPlayerList = () => {
    if (!dashboardWindow || dashboardWindow.isDestroyed()) return;
    dashboardWindow.webContents.send('open-player-list');
  };
  if (dashboardWindow.webContents.isLoading()) dashboardWindow.webContents.once('did-finish-load', openSelectedPlayerList);
  else openSelectedPlayerList();
});
ipcMain.on('player-overlay:hide', (event) => {
  assertTrustedSender(event);
  if (event.sender === playerOverlayWindow?.webContents) playerOverlayWindow.hide();
});
ipcMain.on('player-overlay:toggle', (event) => {
  assertTrustedSender(event);
  togglePlayerOverlay();
});

ipcMain.handle('community:ensure', async (event) => {
  assertPhoneWindowSender(event);
  return communityService().ensure();
});
ipcMain.handle('community:profile:save', async (event, input = {}) => {
  assertPhoneWindowSender(event);
  return communityService().saveProfile(input);
});
ipcMain.handle('community:profiles:search', async (event, query = '') => {
  assertPhoneWindowSender(event);
  return communityService().searchProfiles(query);
});
ipcMain.handle('community:posts:list', async (event) => {
  assertPhoneWindowSender(event);
  return communityService().listPosts();
});
ipcMain.handle('community:posts:create', async (event, input = {}) => {
  assertPhoneWindowSender(event);
  return communityService().createPost(input);
});
ipcMain.handle('community:posts:delete', async (event, postId) => {
  assertPhoneWindowSender(event);
  return communityService().deletePost(postId);
});
ipcMain.handle('community:posts:toggle-reaction', async (event, input = {}) => {
  assertPhoneWindowSender(event);
  return communityService().toggleReaction(input);
});
ipcMain.handle('community:comments:list', async (event, postId) => {
  assertPhoneWindowSender(event);
  return communityService().listComments(postId);
});
ipcMain.handle('community:comments:create', async (event, input = {}) => {
  assertPhoneWindowSender(event);
  return communityService().createComment(input);
});
ipcMain.handle('community:messages:conversations', async (event) => {
  assertPhoneWindowSender(event);
  return communityService().listConversations();
});
ipcMain.handle('community:messages:conversation', async (event, userId) => {
  assertPhoneWindowSender(event);
  return communityService().getOrCreateConversation(userId);
});
ipcMain.handle('community:messages:list', async (event, conversationId) => {
  assertPhoneWindowSender(event);
  return communityService().listDirectMessages(conversationId);
});
ipcMain.handle('community:messages:send', async (event, input = {}) => {
  assertPhoneWindowSender(event);
  return communityService().sendDirectMessage(input);
});
ipcMain.handle('community:realtime:start', async (event) => {
  assertPhoneWindowSender(event);
  await communityService().ensure();
  communityService().startRealtime(payload => {
    if (phoneWindow && !phoneWindow.isDestroyed()) phoneWindow.webContents.send('community:changed', payload);
  });
  return true;
});

ipcMain.handle('gmail:open-inbox', async (event) => {
  assertPhoneWindowSender(event);
  await shell.openExternal('https://mail.google.com/mail/u/0/#inbox');
  return true;
});
ipcMain.handle('gmail:compose', async (event, input = {}) => {
  assertPhoneWindowSender(event);
  const to = String(input.to || '').trim().slice(0, 254);
  if (to && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error('Enter a valid email address.');
  const url = new URL('https://mail.google.com/mail/u/0/');
  url.searchParams.set('view', 'cm'); url.searchParams.set('fs', '1');
  if (to) url.searchParams.set('to', to);
  const subject = String(input.subject || '').slice(0, 180), body = String(input.body || '').slice(0, 5000);
  if (subject) url.searchParams.set('su', subject);
  if (body) url.searchParams.set('body', body);
  await shell.openExternal(url.toString());
  return true;
});

ipcMain.handle('phone-profile:get', async (event) => {
  assertTrustedSender(event);
  if (event.sender !== phoneWindow?.webContents) throw new Error('Phone profile is available only in the phone window.');
  return getPhoneProfileWithWallpaper();
});
ipcMain.handle('phone-profile:save', async (event, input = {}) => {
  assertTrustedSender(event);
  if (event.sender !== phoneWindow?.webContents) throw new Error('Phone profile is available only in the phone window.');
  const current = await readPhoneProfile();
  const name = typeof input.name === 'string' ? input.name.trim().slice(0, 40) : current.name;
  const requestedId = typeof input.robloxUserId === 'string' ? input.robloxUserId.trim() : current.robloxUserId;
  if (requestedId && !/^\d{1,20}$/.test(requestedId)) throw new Error('Roblox user ID must contain digits only.');
  const robloxUserId = requestedId;
  const allowedWallpapers = new Set(['midnight', 'aurora', 'ocean', 'sunset', 'custom']);
  const wallpaper = allowedWallpapers.has(input.wallpaper) ? input.wallpaper : current.wallpaper;
  const language = input.language === 'et' || input.language === 'en' ? input.language : current.language;
  const profile = { name, robloxUserId, phoneNumber: '', wallpaper, language };
  await writePhoneProfile(profile);
  staffSnapshotCache.clear();
  const response = await getPhoneProfileWithWallpaper();
  phoneWindow?.webContents.send('phone-profile:updated', response);
  return response;
});
ipcMain.handle('phone-profile:choose-wallpaper', async (event) => {
  assertTrustedSender(event);
  if (event.sender !== phoneWindow?.webContents) throw new Error('Wallpaper selection is available only in the phone window.');
  const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
    title: 'Choose an ERA phone wallpaper',
    properties: ['openFile'],
    filters: [{ name: 'Wallpaper image', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
  });
  if (result.canceled || !result.filePaths[0]) return false;
  const source = result.filePaths[0];
  const stat = await fs.stat(source);
  if (stat.size > 3 * 1024 * 1024) throw new Error('Choose an image under 3 MB.');
  const extension = path.extname(source).toLowerCase();
  const outputExtension = extension === '.jpeg' ? '.jpg' : extension;
  const directory = path.join(app.getPath('userData'), 'wallpapers');
  await fs.mkdir(directory, { recursive: true });
  for (const name of await fs.readdir(directory)) if (/^custom\.(png|jpe?g|webp)$/i.test(name)) await fs.unlink(path.join(directory, name)).catch(() => {});
  await fs.copyFile(source, path.join(directory, `custom${outputExtension}`));
  const profile = await readPhoneProfile();
  profile.wallpaper = 'custom';
  await writePhoneProfile(profile);
  phoneWindow?.webContents.send('phone-profile:updated', await getPhoneProfileWithWallpaper());
  return true;
});
ipcMain.handle('news:headlines', async (event) => {
  assertTrustedSender(event);
  if (event.sender !== phoneWindow?.webContents) throw new Error('News is available only in the phone window.');
  return fetchPostimeesHeadlines();
});
ipcMain.handle('news:open', async (event, rawUrl) => {
  assertTrustedSender(event);
  if (event.sender !== phoneWindow?.webContents) throw new Error('News is available only in the phone window.');
  let url;
  try { url = new URL(String(rawUrl || '')); } catch { throw new Error('Invalid article link.'); }
  if (!['postimees.ee', 'www.postimees.ee', 'pmo.ee'].includes(url.hostname) || url.protocol !== 'https:') throw new Error('Only HTTPS Postimees article links are allowed.');
  await shell.openExternal(url.toString());
  return true;
});
ipcMain.on('dashboard:close', (event) => {
  assertTrustedSender(event);
  if (event.sender === dashboardWindow?.webContents) dashboardWindow.close();
});
ipcMain.on('dashboard:minimize', (event) => {
  assertTrustedSender(event);
  if (event.sender === dashboardWindow?.webContents) dashboardWindow.minimize();
});
ipcMain.on('dashboard:toggle-maximize', (event) => {
  assertTrustedSender(event);
  if (event.sender !== dashboardWindow?.webContents) return;
  dashboardWindow.isMaximized() ? dashboardWindow.unmaximize() : dashboardWindow.maximize();
});
ipcMain.on('app:quit', (event) => {
  assertTrustedSender(event);
  app.quit();
});
ipcMain.on('server-profile:updated', (event) => {
  assertTrustedSender(event);
  for (const target of [phoneWindow, dashboardWindow, playerOverlayWindow]) {
    if (target === playerOverlayWindow && (!target || target.isDestroyed() || !target.isVisible())) continue;
    if (target && !target.isDestroyed() && target.webContents !== event.sender) {
      target.webContents.send('server-profile-updated');
    }
  }
});
ipcMain.handle('server:confirm-remove', async (event, name) => {
  assertTrustedSender(event);
  const result = await dialog.showMessageBox(BrowserWindow.fromWebContents(event.sender), {
    type: 'warning',
    buttons: ['Cancel', 'Remove'],
    defaultId: 0,
    cancelId: 0,
    title: 'Remove Server',
    message: `Remove server "${String(name).slice(0, 100)}"?`,
    detail: 'The encrypted API key for this server will be deleted from this computer.'
  });
  return result.response === 1;
});

ipcMain.handle('update:get-state', (event) => {
  assertTrustedSender(event);
  if (event.sender !== dashboardWindow?.webContents) return { status: 'idle' };
  return updateState;
});
ipcMain.handle('update:download', async (event) => {
  assertTrustedSender(event);
  if (event.sender !== dashboardWindow?.webContents || !app.isPackaged || process.platform !== 'win32' || !(updateState.status === 'available' || (updateState.status === 'error' && updateState.version))) return false;
  const version = updateState.version;
  setUpdateState({ status: 'downloading', version, percent: 0, bytesPerSecond: 0 });
  try {
    await autoUpdater.downloadUpdate();
    return true;
  } catch (error) {
    setUpdateState({ status: 'error', version, message: String(error?.message || 'The update could not be downloaded.').slice(0, 300) });
    return false;
  }
});
ipcMain.handle('update:skip', async (event, version) => {
  assertTrustedSender(event);
  if (event.sender !== dashboardWindow?.webContents || updateState.status !== 'available' || typeof version !== 'string' || version !== updateState.version) return false;
  await saveSkippedUpdate(version);
  setUpdateState({ status: 'idle' });
  return true;
});
ipcMain.handle('update:install', (event) => {
  assertTrustedSender(event);
  if (event.sender !== dashboardWindow?.webContents || updateState.status !== 'downloaded') return false;
  autoUpdater.quitAndInstall(false, true);
  return true;
});

app.whenReady().then(() => {
  configureRobloxScreenCapture();
  createDashboardWindow();
  createPhoneWindow();
  startRobloxFocusGuard();
  configureAutoUpdates();
  globalShortcut.register('F1', togglePhoneWindow);
  globalShortcut.register('F2', () => createDashboardWindow());
  globalShortcut.register('F3', togglePlayerOverlay);
});

app.on('activate', () => createDashboardWindow());
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (activeWindowWatch !== null) ActiveWindow.unsubscribe(activeWindowWatch);
});
app.on('window-all-closed', () => {
  // The phone overlay remains alive; quit only when it too has been closed by the OS.
  if (process.platform !== 'darwin' && !phoneWindow) app.quit();
});
