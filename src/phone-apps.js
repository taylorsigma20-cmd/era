/* ERA phone app views. Loaded after renderer.js; all content is device-local unless explicitly connected. */
(() => {
  'use strict';
  const screen = document.querySelector('.device-screen');
  if (!screen) return;
  const appMarkup = {
    camera: `<section class="view app-view era-extra-view" data-view="camera"><header class="app-top"><button class="back" data-back data-phoneapp-back aria-label="Back">‹</button><strong>Roblox⌄</strong><span class="more muted-mark">◉</span></header><div class="pa-scroll pa-camera-page"><div class="pa-camera-brand">ERA CAMERA <span>ROBLOX SOURCE</span></div><div class="pa-camera-frame" id="camera-frame"><video id="camera-video" data-zoom="1" autoplay muted playsinline></video><canvas id="camera-canvas" hidden></canvas><img id="camera-still" alt="Captured photo preview" hidden><div class="pa-camera-placeholder" id="camera-placeholder"><span>◉</span><strong>Ready when you are</strong><small>Press Start to choose a Roblox window to capture.</small></div><div class="pa-camera-inline" id="camera-message" role="status" aria-live="polite">Camera is off. No capture is happening.</div></div><div class="pa-camera-modes"><button class="selected" data-camera-mode="photo">PHOTO</button><button data-camera-mode="square">SQUARE</button></div><div class="pa-zoom-row" aria-label="Zoom"><button class="selected" data-camera-zoom="1">1x</button><button data-camera-zoom="2">2x</button><button data-camera-zoom="3">3x</button></div><div class="pa-camera-controls"><button id="camera-start" class="pa-cam-start">Start</button><button id="camera-shutter" class="pa-shutter" aria-label="Take photo" disabled><span></span></button><button id="camera-save" class="pa-cam-save" disabled>Save</button></div><button id="camera-discard" class="pa-quiet-action" hidden>Retake</button><div class="pa-camera-caption">Screen capture starts only after you press Start. Captured images are saved on this computer.</div><button id="camera-open-photos" class="pa-gallery-shortcut"><span>▧</span> Open Photos <span class="pa-arrow">›</span></button></div></section>`,
    photos: `<section class="view app-view era-extra-view" data-view="photos"><header class="app-top"><button class="back" data-back data-phoneapp-back aria-label="Back">‹</button><strong>Photos</strong><button id="photos-select" class="more" aria-label="Refresh photos">↻</button></header><div class="pa-photo-page" id="photos-list-page"><div class="pa-photo-heading"><div><p class="eyebrow">ON THIS COMPUTER</p><h1>Library</h1></div><span id="photos-count" class="pa-count">0</span></div><div class="pa-segment"><button class="selected" data-photo-tab="library">Library</button><button data-photo-tab="favorites">Favorites</button></div><div class="pa-photo-grid" id="photos-grid"></div><div class="pa-empty" id="photos-empty"><span>▧</span><strong>No Photos Yet</strong><small>Photos you capture on this device will appear here.</small><button id="photos-open-camera" class="pa-primary">Open Camera</button></div><p class="pa-local-note">Saved locally on this computer · not shared</p></div><div class="pa-photo-detail" id="photos-detail" hidden><div class="pa-detail-toolbar"><button id="photos-detail-back" class="pa-text-button">‹ Library</button><span id="photos-detail-date"></span><button id="photos-detail-delete" class="pa-text-button pa-danger-text">Delete</button></div><div class="pa-detail-image-wrap"><img id="photos-detail-image" data-brightness="100" alt="Selected photo"></div><div class="pa-detail-meta"><input id="photos-title" aria-label="Photo title" maxlength="80" placeholder="Add a title"><button id="photos-favorite" class="pa-favorite" aria-label="Toggle favorite">♡</button></div><div class="pa-detail-actions"><button id="photos-edit-open" class="pa-secondary">Edit</button><button id="photos-save-title" class="pa-primary">Done</button></div><p class="pa-local-note">Saved locally on this computer · not shared</p></div><div class="pa-edit-sheet" id="photos-edit-sheet" hidden><div class="pa-sheet-scrim" data-photo-edit-close></div><div class="pa-sheet-card"><div class="pa-sheet-grabber"></div><div class="pa-sheet-head"><button class="pa-text-button" data-photo-edit-close>Cancel</button><strong>Edit Photo</strong><button id="photos-edit-done" class="pa-text-button">Done</button></div><label for="photos-brightness">Brightness <span id="photos-brightness-value">100%</span></label><input id="photos-brightness" type="range" min="50" max="150" value="100"><div class="pa-edit-actions"><button id="photos-edit-reset" class="pa-secondary">Reset</button><small>Edits are stored on this device.</small></div></div></div></section>`,
    chirper: `<section class="view app-view era-extra-view" data-view="chirper"><header class="app-top pa-chirper-top"><button class="back" data-back data-phoneapp-back aria-label="Back">‹</button><strong>Twitter</strong><span class="pa-local-badge" id="communityStatusBadge">CONNECTING</span></header><div class="pa-chirper-tabs"><button class="selected" data-chirper-feed="foryou">For you</button><button data-chirper-feed="following">Following</button></div><div class="pa-chirper-content"><div class="pa-chirp-list" id="chirper-feed"></div><div class="pa-empty pa-feed-empty" id="chirper-empty"><span>◌</span><strong>No local posts yet</strong><small>Your posts will appear here. Community posts are unavailable offline.</small></div><div class="pa-social-empty" id="chirper-social-empty" hidden><span>⌕</span><strong id="chirper-social-title">Search</strong><small id="chirper-social-copy">Community search is disconnected. No accounts or posts are shown.</small></div><div class="pa-profile-page" id="chirper-profile-page" hidden><div class="pa-profile-hero"><div class="pa-profile-avatar" id="chirper-avatar">L</div><strong id="chirper-profile-name">Local profile</strong><small id="chirper-profile-handle">@local</small><span>Local profile · not verified</span></div><div class="pa-profile-count"><strong id="chirper-profile-count">0</strong><small>Posts saved on this device</small></div><div class="pa-segment pa-profile-tabs"><button class="selected" data-profile-tab="Posts">Posts</button><button data-profile-tab="Replies">Replies</button><button data-profile-tab="Media">Media</button><button data-profile-tab="Likes">Likes</button></div><div id="chirper-profile-posts" class="pa-chirp-list"></div><div class="pa-empty pa-mini-empty" id="chirper-profile-empty"><strong>Nothing here yet</strong><small>Local activity only.</small></div></div></div><button id="chirper-compose-open" class="pa-compose-fab" aria-label="Compose post">＋</button><nav class="pa-bottom-nav" aria-label="Twitter navigation"><button class="selected" data-chirper-nav="Home"><span>⌂</span>Home</button><button data-chirper-nav="Search"><span>⌕</span>Search</button><button data-chirper-nav="Notifications"><span>♡</span>Notifications</button><button data-chirper-nav="Profile"><span>◉</span>Profile</button></nav><div class="pa-compose-sheet" id="chirper-compose-sheet" hidden><div class="pa-sheet-scrim" data-chirp-close></div><form id="chirper-compose-form" class="pa-sheet-card pa-compose-card"><div class="pa-sheet-head"><button type="button" class="pa-text-button" data-chirp-close>Cancel</button><strong>New Post</strong><button type="submit" class="pa-text-button">Save</button></div><textarea id="chirper-compose-text" maxlength="500" placeholder="What's happening?" required></textarea><p>Saved locally on this computer · not shared</p></form></div></section>`,
    marketplace: `<section class="view app-view era-extra-view" data-view="marketplace"><header class="app-top"><button class="back" data-phoneapp-back aria-label="Back">‹</button><strong>Marketplace</strong><button id="market-sell-top" class="more" aria-label="Create local listing">＋</button></header><div class="pa-market-page"><div class="pa-market-heading"><p class="eyebrow">ERA EXCHANGE</p><h1>Today's picks</h1><p>Local roleplay listings on this device.</p></div><div class="pa-market-actions"><button id="market-sell" class="pa-primary">＋ Sell</button><button id="market-community" class="pa-secondary">View Community</button></div><div class="pa-segment"><button class="selected" data-market-tab="local">My local listings</button><button data-market-tab="community">Community</button></div><div id="market-grid" class="pa-market-grid"></div><div id="market-empty" class="pa-empty"><span>▧</span><strong>No local listings</strong><small>Create a fictional in-game item listing to see it here.</small><button id="market-empty-sell" class="pa-primary">Create listing</button></div><div class="pa-social-empty" id="market-community-empty" hidden><span>⌁</span><strong>Community unavailable</strong><small>No marketplace service is connected. No community listings are displayed.</small></div><p class="pa-local-note">Local listings stay on this computer · not shared</p></div><div class="pa-listing-sheet" id="market-listing-sheet" hidden><div class="pa-sheet-scrim" data-market-close></div><form id="market-listing-form" class="pa-sheet-card pa-listing-form"><div class="pa-sheet-head"><button type="button" class="pa-text-button" data-market-close>Cancel</button><strong>New Listing</strong><button type="submit" class="pa-text-button">Save</button></div><p>Fictional in-game items only. This stays on this computer.</p><label for="market-title">Item title</label><input id="market-title" maxlength="60" placeholder="e.g. Custom in-game vehicle" required><label for="market-description">Description</label><textarea id="market-description" maxlength="240" placeholder="Describe a safe fictional game item"></textarea><div class="pa-form-row"><label for="market-price">Price <span>(in-game credits)</span></label><input id="market-price" type="number" min="0" max="999999999" placeholder="0"></div><div class="pa-form-row"><label for="market-seller">Seller name</label><input id="market-seller" maxlength="40" placeholder="Local profile"></div><div class="pa-form-buttons"><button type="button" id="market-save-draft" class="pa-secondary">Save draft</button><button type="submit" class="pa-primary">Save listing locally</button></div><small id="market-form-status" class="pa-form-status" role="status"></small></form></div></section>`,
    darkweb: `<section class="view app-view era-extra-view pa-darkweb" data-view="darkweb"><header class="app-top"><button class="back" data-phoneapp-back aria-label="Back">‹</button><strong>Dark Web</strong><span class="pa-dark-lock">◈</span></header><div class="pa-market-page"><div class="pa-dark-warning"><span>FICTION ONLY</span><strong>Roleplay interface</strong><small>Entirely fictional in-game listings. No real-world goods, transactions, or community connection.</small></div><div class="pa-market-heading"><p class="eyebrow">OFFLINE SIMULATION</p><h1>Today's picks</h1><p>Local, fictional roleplay items only.</p></div><div class="pa-market-actions"><button id="darkweb-sell" class="pa-primary">＋ Sell</button><button id="darkweb-community" class="pa-secondary">View Community</button></div><div class="pa-segment"><button class="selected" data-dark-tab="local">My local listings</button><button data-dark-tab="community">Community</button></div><div id="darkweb-grid" class="pa-market-grid"></div><div id="darkweb-empty" class="pa-empty"><span>◈</span><strong>No local listings</strong><small>Save a safe fictional in-game item listing here.</small><button id="darkweb-empty-sell" class="pa-primary">Create listing</button></div><div class="pa-social-empty" id="darkweb-community-empty" hidden><span>⌁</span><strong>Community unavailable</strong><small>No community service is connected. This fictional view shows no online listings.</small></div><p class="pa-local-note">Fiction only · local to this computer · not shared</p></div><div class="pa-listing-sheet" id="darkweb-listing-sheet" hidden><div class="pa-sheet-scrim" data-dark-close></div><form id="darkweb-listing-form" class="pa-sheet-card pa-listing-form"><div class="pa-sheet-head"><button type="button" class="pa-text-button" data-dark-close>Cancel</button><strong>New Fictional Listing</strong><button type="submit" class="pa-text-button">Save</button></div><p>Roleplay only: safe fictional in-game items. Nothing is sold or shared.</p><label for="darkweb-title">Item title</label><input id="darkweb-title" maxlength="60" placeholder="e.g. Fictional custom vehicle" required><label for="darkweb-description">Description</label><textarea id="darkweb-description" maxlength="240" placeholder="Describe a safe fictional game item"></textarea><div class="pa-form-row"><label for="darkweb-price">Price <span>(in-game credits)</span></label><input id="darkweb-price" type="number" min="0" max="999999999" placeholder="0"></div><div class="pa-form-row"><label for="darkweb-seller">Seller name</label><input id="darkweb-seller" maxlength="40" placeholder="Local profile"></div><div class="pa-form-buttons"><button type="button" id="darkweb-save-draft" class="pa-secondary">Save draft</button><button type="submit" class="pa-primary">Save listing locally</button></div><small id="darkweb-form-status" class="pa-form-status" role="status"></small></form></div></section>`
  };
  const modal = document.getElementById('profileSetupModal');
  for (const [key, html] of Object.entries(appMarkup)) {
    if (key === 'marketplace' || key === 'darkweb') continue;
    const route = key === 'marketplace' ? 'marketplace' : key;
    if (!screen.querySelector(`.view[data-view="${route}"]`)) {
      const temp = document.createElement('template'); temp.innerHTML = html.trim();
      screen.insertBefore(temp.content, modal || document.getElementById('homeIndicator') || null);
    }
  }
  const chirperHeading = screen.querySelector('.view[data-view="chirper"] .pa-chirper-top strong');
  if (chirperHeading) chirperHeading.textContent = 'Twitter';
  const chirperCompose = document.getElementById('chirper-compose-open');
  const chirperNav = screen.querySelector('.view[data-view="chirper"] .pa-bottom-nav');
  if (chirperCompose && chirperNav) {
    chirperCompose.className = 'pa-compose-nav';
    chirperCompose.innerHTML = '<span>＋</span>Create';
    chirperCompose.setAttribute('aria-label', 'Create a Twitter post');
    chirperNav.insertBefore(chirperCompose, chirperNav.children[2] || null);
  }
  const $ = id => document.getElementById(id);
  const safeText = value => String(value ?? '');
  const makeId = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const displayPreferenceDefaults = { opacity: 100, theme: 'dark', f1Default: 'home' };
  function phoneDisplayPreferences() {
    const all = readLocal('primecad-phone-display-v2', {});
    if (all && typeof all === 'object' && all[phoneUserKey()]) return { ...displayPreferenceDefaults, ...all[phoneUserKey()] };
    if (phoneUserKey() === 'this-device' || !Object.keys(all || {}).length) return { ...displayPreferenceDefaults, ...readLocal('primecad-phone-display-v1', {}) };
    return { ...displayPreferenceDefaults };
  }
  function savePhoneDisplayPreferences(patch) {
    const all = readLocal('primecad-phone-display-v2', {});
    const safeAll = all && typeof all === 'object' && !Array.isArray(all) ? all : {};
    safeAll[phoneUserKey()] = { ...phoneDisplayPreferences(), ...patch };
    return writeLocal('primecad-phone-display-v2', safeAll);
  }
  const availablePhoneViews = new Set(['home', 'settings', 'photos', 'camera', 'chirper']);
  function routeTo(name) {
    if (!availablePhoneViews.has(name)) name = 'home';
    document.querySelectorAll('.device-screen .view').forEach(view => view.classList.toggle('active', view.dataset.view === name));
    if (name !== 'camera') stopCamera();
    if (document.querySelector(`.device-screen .view[data-view="${CSS.escape(name)}"]`)) savePhoneDisplayPreferences({ lastView: name });
    window.dispatchEvent(new CustomEvent('era:phone-view-changed', { detail: name }));
  }
  window.addEventListener('era:phone-view-changed', event => {
    const name = String(event.detail || '');
    if (/^[a-z-]+$/.test(name) && screen.querySelector(`.view[data-view="${CSS.escape(name)}"]`)) {
      savePhoneDisplayPreferences({ lastView: name });
    }
  });
  window.primecad?.on('phone-shown', () => {
    const preferences = phoneDisplayPreferences();
    const desired = preferences.f1Default === 'last' ? String(preferences.lastView || 'home') : 'home';
    const view = availablePhoneViews.has(desired) && screen.querySelector(`.view[data-view="${CSS.escape(desired)}"]`) ? desired : 'home';
    routeTo(view);
  });
  document.querySelectorAll('[data-open="photos"],[data-open="camera"],[data-open="chirper"],[data-open="marketplace"],[data-open="darkweb"]').forEach(button => {
    button.addEventListener('click', () => { routeTo(button.dataset.open); if (button.dataset.open === 'photos') renderPhotos(); });
  });
  document.querySelectorAll('[data-phoneapp-back]').forEach(button => button.addEventListener('click', () => routeTo('home')));
  const homeIndicator = $('homeIndicator');
  if (homeIndicator) homeIndicator.addEventListener('click', () => { stopCamera(); routeTo('home'); });
  const activeObserver = new MutationObserver(() => {
    if (!document.querySelector('.view[data-view="camera"].active')) stopCamera();
  });
  document.querySelectorAll('.view').forEach(view => activeObserver.observe(view, { attributes: true, attributeFilter: ['class'] }));
  let cameraStream = null, cameraMode = 'photo', cameraZoom = 1, capturedBlob = null, capturedUrl = null;
  const cameraVideo = $('camera-video');
  const cameraMsg = $('camera-message');
  let cameraGridOn = false, cameraFlashOn = false, cameraFocusTimer = null;
  const cameraFrame = $('camera-frame');
  const cameraGrid = document.createElement('div'); cameraGrid.className = 'pa-camera-grid-lines'; cameraGrid.setAttribute('aria-hidden', 'true');
  const cameraFocus = document.createElement('span'); cameraFocus.className = 'pa-camera-focus'; cameraFocus.setAttribute('aria-hidden', 'true');
  const cameraFlashOverlay = document.createElement('div'); cameraFlashOverlay.className = 'pa-camera-flash'; cameraFlashOverlay.setAttribute('aria-hidden', 'true');
  cameraFrame?.append(cameraGrid, cameraFocus, cameraFlashOverlay);
  if (cameraGrid) cameraGrid.hidden = true;
  const cameraTools = document.createElement('div'); cameraTools.className = 'pa-camera-tools';
  cameraTools.innerHTML = '<button type="button" id="camera-flash-toggle" aria-label="Flash off">ϟ</button><span class="pa-camera-live"><i></i> LIVE</span><button type="button" id="camera-grid-toggle" aria-label="Hide framing grid">▦</button>';
  cameraFrame?.before(cameraTools);
  $('camera-grid-toggle')?.addEventListener('click', () => { cameraGridOn = !cameraGridOn; cameraGrid.hidden = !cameraGridOn; $('camera-grid-toggle').classList.toggle('selected', cameraGridOn); $('camera-grid-toggle').setAttribute('aria-label', cameraGridOn ? 'Hide framing grid' : 'Show framing grid'); });
  $('camera-flash-toggle')?.addEventListener('click', () => { cameraFlashOn = !cameraFlashOn; $('camera-flash-toggle').classList.toggle('selected', cameraFlashOn); $('camera-flash-toggle').setAttribute('aria-label', cameraFlashOn ? 'Flash on' : 'Flash off'); cameraStatus(cameraFlashOn ? 'Screen flash effect is on.' : 'Screen flash effect is off.'); });
  cameraFrame?.addEventListener('click', event => {
    if (event.target.closest('button') || cameraVideo?.hidden) return;
    const bounds = cameraFrame.getBoundingClientRect(); cameraFocus.style.left = `${event.clientX - bounds.left}px`; cameraFocus.style.top = `${event.clientY - bounds.top}px`;
    cameraFocus.classList.remove('is-visible'); clearTimeout(cameraFocusTimer); requestAnimationFrame(() => { cameraFocus.classList.add('is-visible'); cameraFocusTimer = setTimeout(() => cameraFocus.classList.remove('is-visible'), 900); });
  });
  function cameraStatus(text) { if (cameraMsg) cameraMsg.textContent = text; }
  function stopCamera() {
    if (cameraStream) { cameraStream.getTracks().forEach(track => { try { track.stop(); } catch {} }); cameraStream = null; }
    if (cameraVideo) { cameraVideo.pause(); cameraVideo.srcObject = null; }
    if ($('camera-start')) $('camera-start').textContent = 'Start';
    if ($('camera-shutter')) $('camera-shutter').disabled = true;
    if ($('camera-placeholder') && !$('camera-still')?.hidden) $('camera-placeholder').hidden = true;
  }
  window.primecad?.on('phone-hidden', () => {
    const wasCapturing = Boolean(cameraStream);
    stopCamera();
    if (wasCapturing) cameraStatus('Screen capture stopped because the phone was hidden.');
  });
  function revokeCaptured() { if (capturedUrl) URL.revokeObjectURL(capturedUrl); capturedUrl = null; capturedBlob = null; }
  $('camera-start')?.addEventListener('click', async () => {
    if (cameraStream) { stopCamera(); cameraStatus('Capture stopped. No capture is happening.'); if ($('camera-placeholder')) $('camera-placeholder').hidden = false; return; }
    if (!navigator.mediaDevices?.getDisplayMedia) { cameraStatus('Screen capture is not supported in this app environment. No photo was taken.'); return; }
    cameraStatus('Choose a Roblox window…');
    try {
      cameraStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      if (!document.querySelector('.view[data-view="camera"].active')) {
        cameraStream.getTracks().forEach(track => { try { track.stop(); } catch {} });
        cameraStream = null;
        cameraStatus('Camera was closed before capture started. No preview is active.');
        return;
      }
      cameraVideo.srcObject = cameraStream;
      await cameraVideo.play();
      if ($('camera-placeholder')) $('camera-placeholder').hidden = true;
      $('camera-start').textContent = 'Stop';
      $('camera-shutter').disabled = false;
      cameraStatus('Screen preview is live. Press the shutter to capture a still.');
      cameraStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopCamera(); if ($('camera-placeholder')) $('camera-placeholder').hidden = false;
        cameraStatus('Screen capture ended. Start again when you are ready.');
      }, { once: true });
    } catch (error) {
      cameraStream = null;
      cameraStatus(error?.name === 'NotAllowedError' ? 'Screen capture was cancelled or denied. No photo was taken.' : 'Could not start screen capture. Check permissions and try again.');
      if ($('camera-placeholder')) $('camera-placeholder').hidden = false;
    }
  });
  document.querySelectorAll('[data-camera-mode]').forEach(button => button.addEventListener('click', () => {
    cameraMode = button.dataset.cameraMode;
    document.querySelectorAll('[data-camera-mode]').forEach(item => item.classList.toggle('selected', item === button));
    $('camera-frame')?.classList.toggle('is-square', cameraMode === 'square');
  }));
  document.querySelectorAll('[data-camera-zoom]').forEach(button => button.addEventListener('click', () => {
    cameraZoom = Number(button.dataset.cameraZoom) || 1;
    document.querySelectorAll('[data-camera-zoom]').forEach(item => item.classList.toggle('selected', item === button));
      if (cameraVideo) cameraVideo.dataset.zoom = String(cameraZoom);
  }));
  $('camera-shutter')?.addEventListener('click', () => {
    if (!cameraStream || !cameraVideo?.videoWidth) { cameraStatus('Start screen capture and wait for its preview before taking a photo.'); return; }
    const canvas = $('camera-canvas'), ctx = canvas.getContext('2d');
    const vw = cameraVideo.videoWidth, vh = cameraVideo.videoHeight;
    const source = cameraZoom === 1 ? 1 : 1 / cameraZoom;
    let cw = Math.round(vw * source), ch = Math.round(vh * source);
    if (cameraMode === 'square') { const side = Math.min(cw, ch); cw = ch = side; }
    const sx = Math.round((vw - cw) / 2), sy = Math.round((vh - ch) / 2);
    canvas.width = cw; canvas.height = ch;
    ctx.filter = cameraFlashOn ? 'brightness(1.12)' : 'none';
    ctx.drawImage(cameraVideo, sx, sy, cw, ch, 0, 0, cw, ch);
    ctx.filter = 'none';
    canvas.toBlob(blob => {
      if (!blob) { cameraStatus('Could not create a still image. Try capturing again.'); return; }
        if (cameraFlashOn) { cameraFlashOverlay.classList.remove('fire'); requestAnimationFrame(() => cameraFlashOverlay.classList.add('fire')); }
      revokeCaptured(); capturedBlob = blob; capturedUrl = URL.createObjectURL(blob);
      const still = $('camera-still'); still.src = capturedUrl; still.hidden = false;
      $('camera-video').hidden = true; $('camera-discard').hidden = false;
      $('camera-save').disabled = false; cameraStatus('Preview ready. Save to keep this photo on this computer.');
    }, 'image/jpeg', .9);
  });
  $('camera-discard')?.addEventListener('click', () => {
    revokeCaptured(); $('camera-still').hidden = true; $('camera-video').hidden = false; $('camera-discard').hidden = true; $('camera-save').disabled = true;
    cameraStatus(cameraStream ? 'Screen preview is live. Press the shutter to capture a still.' : 'Capture stopped. Start again to take a photo.');
  });
  $('camera-save')?.addEventListener('click', async () => {
    if (!capturedBlob) return;
    const saved = await addPhoto(capturedBlob);
    if (!saved) { cameraStatus('Photo database unavailable or full. The preview was not saved.'); return; }
    cameraStatus('Photo saved locally on this computer.');
    revokeCaptured(); $('camera-still').hidden = true; $('camera-video').hidden = false; $('camera-discard').hidden = true; $('camera-save').disabled = true;
  });
  $('camera-open-photos')?.addEventListener('click', () => { routeTo('photos'); renderPhotos(); });

  let photoDbPromise = null, photos = [], photoTab = 'library', selectedPhotoId = null, selectedPhotoUrl = null;
  function openPhotoDb() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
    if (!photoDbPromise) photoDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('era-phone-media-v1', 1);
      request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' }); };
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error || new Error('Database unavailable'));
    });
    return photoDbPromise;
  }
  async function readPhotos() {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => { const request = db.transaction('photos', 'readonly').objectStore('photos').getAll(); request.onsuccess = () => resolve(request.result || []); request.onerror = () => reject(request.error); });
  }
  async function addPhoto(blob) {
    try {
      const db = await openPhotoDb();
      const entry = { id: makeId(), blob, title: '', date: Date.now(), favorite: false, brightness: 100 };
      await new Promise((resolve, reject) => { const tx = db.transaction('photos', 'readwrite'); tx.objectStore('photos').add(entry); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); });
      photos.unshift(entry); renderPhotos(); return true;
    } catch { return false; }
  }
  async function savePhoto(entry) {
    try { const db = await openPhotoDb(); await new Promise((resolve, reject) => { const tx = db.transaction('photos', 'readwrite'); tx.objectStore('photos').put(entry); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); return true; } catch { return false; }
  }
  function releasePhotoUrl() { if (selectedPhotoUrl) URL.revokeObjectURL(selectedPhotoUrl); selectedPhotoUrl = null; }
  function showPhotoDetail(entry) {
    selectedPhotoId = entry.id; releasePhotoUrl(); selectedPhotoUrl = URL.createObjectURL(entry.blob);
    $('photos-detail-image').src = selectedPhotoUrl; $('photos-detail-image').dataset.brightness = String(entry.brightness || 100);
    $('photos-detail-date').textContent = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    $('photos-title').value = entry.title || ''; $('photos-favorite').textContent = entry.favorite ? '♥' : '♡'; $('photos-favorite').classList.toggle('is-favorite', !!entry.favorite);
    $('photos-list-page').hidden = true; $('photos-detail').hidden = false;
  }
  function renderPhotos() {
    if (!$('photos-grid')) return;
    const grid = $('photos-grid'); grid.replaceChildren();
    try { photos.sort((a,b) => b.date - a.date); } catch {}
    const visible = photos.filter(item => photoTab === 'library' || item.favorite);
    $('photos-count').textContent = String(visible.length);
    $('photos-empty').hidden = visible.length > 0;
    for (const entry of visible) {
      const button = document.createElement('button'); button.className = 'pa-photo-tile'; button.type = 'button'; button.setAttribute('aria-label', entry.title || 'Open photo');
      const image = document.createElement('img'); image.src = URL.createObjectURL(entry.blob); image.alt = entry.title || 'Saved photo'; image.dataset.brightness = String(entry.brightness || 100);
      const badge = document.createElement('span'); badge.textContent = entry.favorite ? '♥' : '';
      const title = document.createElement('small'); title.textContent = entry.title || new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      button.append(image, badge, title); button.addEventListener('click', () => showPhotoDetail(entry)); grid.append(button);
      button.dataset.objectUrl = image.src;
    }
    if (window.__eraPhotoTileUrls) window.__eraPhotoTileUrls.forEach(url => URL.revokeObjectURL(url));
    window.__eraPhotoTileUrls = [...grid.querySelectorAll('img')].map(image => image.src);
  }
  async function refreshPhotos() {
    try { photos = await readPhotos(); renderPhotos(); }
    catch { $('photos-empty').hidden = false; $('photos-empty').querySelector('small').textContent = 'Photo storage is unavailable in this environment.'; }
  }
  document.querySelectorAll('[data-photo-tab]').forEach(button => button.addEventListener('click', () => { photoTab = button.dataset.photoTab; document.querySelectorAll('[data-photo-tab]').forEach(b => b.classList.toggle('selected', b === button)); renderPhotos(); }));
  $('photos-open-camera')?.addEventListener('click', () => routeTo('camera'));
  $('photos-select')?.addEventListener('click', refreshPhotos);
  $('photos-detail-back')?.addEventListener('click', () => { $('photos-detail').hidden = true; $('photos-list-page').hidden = false; releasePhotoUrl(); renderPhotos(); });
  $('photos-favorite')?.addEventListener('click', async () => { const item = photos.find(x => x.id === selectedPhotoId); if (!item) return; item.favorite = !item.favorite; if (!await savePhoto(item)) { item.favorite = !item.favorite; return; } $('photos-favorite').textContent = item.favorite ? '♥' : '♡'; $('photos-favorite').classList.toggle('is-favorite', item.favorite); renderPhotos(); });
  $('photos-save-title')?.addEventListener('click', async () => { const item = photos.find(x => x.id === selectedPhotoId); if (!item) return; item.title = $('photos-title').value.trim().slice(0,80); if (!await savePhoto(item)) { toast('Could not save photo details.'); return; } $('photos-detail').hidden = true; $('photos-list-page').hidden = false; releasePhotoUrl(); renderPhotos(); });
  $('photos-detail-delete')?.addEventListener('click', async () => { const item = photos.find(x => x.id === selectedPhotoId); if (!item) return; try { const db = await openPhotoDb(); await new Promise((resolve, reject) => { const tx = db.transaction('photos', 'readwrite'); tx.objectStore('photos').delete(item.id); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); photos = photos.filter(x => x.id !== item.id); $('photos-detail').hidden = true; $('photos-list-page').hidden = false; releasePhotoUrl(); renderPhotos(); } catch { toast('Could not delete this photo.'); } });
  $('photos-edit-open')?.addEventListener('click', () => { const item = photos.find(x => x.id === selectedPhotoId); if (!item) return; $('photos-brightness').value = item.brightness || 100; $('photos-brightness-value').textContent = `${item.brightness || 100}%`; $('photos-edit-sheet').hidden = false; });
  $('photos-brightness')?.addEventListener('input', event => { const value = Number(event.target.value); $('photos-brightness-value').textContent = `${value}%`; $('photos-detail-image').dataset.brightness = String(value); });
  $('photos-edit-reset')?.addEventListener('click', () => { $('photos-brightness').value = 100; $('photos-brightness-value').textContent = '100%'; $('photos-detail-image').dataset.brightness = '100'; });
  document.querySelectorAll('[data-photo-edit-close]').forEach(button => button.addEventListener('click', () => { const item = photos.find(x => x.id === selectedPhotoId); $('photos-edit-sheet').hidden = true; if (item) $('photos-detail-image').dataset.brightness = String(item.brightness || 100); }));
  $('photos-edit-done')?.addEventListener('click', async () => { const item = photos.find(x => x.id === selectedPhotoId); if (!item) return; const brightness=Number($('photos-brightness').value); try { const edited=await processBrightness(item.blob,brightness); item.blob=edited; item.brightness=100; } catch { item.brightness=brightness; } if (!await savePhoto(item)) { toast('Could not save edits.'); return; } $('photos-detail-image').dataset.brightness = '100'; releasePhotoUrl(); selectedPhotoUrl=URL.createObjectURL(item.blob); $('photos-detail-image').src=selectedPhotoUrl; $('photos-edit-sheet').hidden = true; renderPhotos(); });
  async function processBrightness(blob, brightness) {
    if (brightness === 100) return blob;
    const bitmap = await createImageBitmap(blob), canvas = document.createElement('canvas');
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d'); ctx.filter = `brightness(${brightness}%)`; ctx.drawImage(bitmap,0,0); bitmap.close?.();
    return new Promise((resolve,reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Image edit failed')), 'image/jpeg', .92));
  }
  refreshPhotos();

  let activePhoneUserKey = '';
  function phoneUserKey() { const id = String(phoneProfile?.robloxUserId || '').trim(); return id ? `roblox-${id}` : 'this-device'; }
  let chirperAccounts = readLocal('era-chirper-accounts-v1', {});
  if (!chirperAccounts || typeof chirperAccounts !== 'object' || Array.isArray(chirperAccounts)) chirperAccounts = {};
  let chirpsByPhoneUser = readLocal('primecad-chirper-accounts-posts-v1', {});
  if (!chirpsByPhoneUser || typeof chirpsByPhoneUser !== 'object' || Array.isArray(chirpsByPhoneUser)) chirpsByPhoneUser = {};
  activePhoneUserKey = phoneUserKey();
  let chirps = Array.isArray(chirpsByPhoneUser[activePhoneUserKey]) ? chirpsByPhoneUser[activePhoneUserKey] : readLocal('primecad-chirper-local-v1', []), feedMode = 'foryou', socialPage = 'Home', profileTab = 'Posts';
  let chirperAccount = chirperAccounts[activePhoneUserKey] || (activePhoneUserKey === 'this-device' ? readLocal('era-chirper-account-v1', null) : null);
  if (!Array.isArray(chirps)) chirps = [];
  if (!chirperAccount || typeof chirperAccount !== 'object' || Array.isArray(chirperAccount) || !['personal', 'business'].includes(chirperAccount.type) || typeof chirperAccount.displayName !== 'string' || typeof chirperAccount.handle !== 'string') chirperAccount = null;
  if (chirperAccount && !chirperAccounts[activePhoneUserKey]) { chirperAccounts[activePhoneUserKey] = chirperAccount; writeLocal('era-chirper-accounts-v1', chirperAccounts); }
  if (Array.isArray(chirps) && !Array.isArray(chirpsByPhoneUser[activePhoneUserKey])) { chirpsByPhoneUser[activePhoneUserKey] = chirps; writeLocal('primecad-chirper-accounts-posts-v1', chirpsByPhoneUser); }
  const chirperView = document.querySelector('.view[data-view="chirper"]');
  const chirperSearchPage = document.createElement('section');
  chirperSearchPage.className = 'pa-search-page'; chirperSearchPage.id = 'chirper-search-page'; chirperSearchPage.hidden = true;
  chirperSearchPage.innerHTML = '<label for="chirper-search-input">Search users</label><input id="chirper-search-input" type="search" autocomplete="off" placeholder="Name or @username"><div id="chirper-search-results" class="pa-search-results"></div><p id="chirper-search-empty" class="pa-search-empty">Search accounts saved on this computer.</p><small class="pa-local-note">Local accounts only · not shared between players</small>';
  chirperView?.querySelector('.pa-chirper-content')?.append(chirperSearchPage);
  let viewedProfileKey = null, viewedProfileCloudId = null, viewedProfileCloud = null;
  let communityState = 'connecting', communityError = '', communityUserId = '', communityProfileReady = false, communityPosts = [];
  const accountGate = document.createElement('div');
  accountGate.className = 'pa-account-gate'; accountGate.id = 'chirper-account-gate'; accountGate.hidden = Boolean(chirperAccount);
  accountGate.innerHTML = `<form class="pa-account-card" id="chirper-account-form"><div class="pa-account-mark"><svg viewBox="0 0 24 24" class="twitter-bird"><path d="M23.953 4.57a10 10 0 0 1-2.825.775 4.932 4.932 0 0 0 2.163-2.723 9.99 9.99 0 0 1-3.127 1.195 4.916 4.916 0 0 0-8.384 4.482A13.944 13.944 0 0 1 1.64 3.162a4.916 4.916 0 0 0 1.523 6.557 4.903 4.903 0 0 1-2.229-.616v.062a4.918 4.918 0 0 0 3.946 4.817 4.935 4.935 0 0 1-2.224.084 4.926 4.926 0 0 0 4.6 3.419A9.87 9.87 0 0 1 0 19.54a13.93 13.93 0 0 0 7.548 2.213c9.057 0 14.01-7.503 14.01-14.01 0-.213-.005-.425-.014-.636a10.012 10.012 0 0 0 2.46-2.548z"/></svg></div><p class="pa-account-kicker">TWITTER</p><h1>Create your account</h1><p class="pa-account-copy">Create an ERA community profile. Posts, reactions, and comments are shared with other ERA users.</p><div class="pa-account-type" role="group" aria-label="Account type"><button type="button" class="selected" data-account-type="personal">Personal</button><button type="button" data-account-type="business">Business</button></div><label for="chirper-account-name">Display name</label><input id="chirper-account-name" maxlength="40" autocomplete="nickname" placeholder="Your name" required><label for="chirper-account-handle">Username</label><div class="pa-handle-input"><span>@</span><input id="chirper-account-handle" maxlength="20" autocomplete="off" placeholder="yourname" required></div><small class="pa-field-hint">3–20 letters, numbers, or underscores</small><div class="pa-business-fields" id="chirper-business-fields" hidden><label for="chirper-business-category">Business category</label><select id="chirper-business-category"><option value="Community">Community</option><option value="Public Safety">Public Safety</option><option value="Local Business">Local Business</option><option value="Creator">Creator</option><option value="Other">Other</option></select><label for="chirper-business-bio">Bio</label><textarea id="chirper-business-bio" maxlength="160" placeholder="Tell the community about this organization"></textarea></div><p class="pa-account-error" id="chirper-account-error" role="alert"></p><div class="pa-account-actions"><button id="chirper-account-cancel" type="button" class="pa-account-cancel" hidden>Cancel</button><button class="pa-account-submit" type="submit">Create local account <span>→</span></button></div><p class="pa-account-footnote">ERA COMMUNITY · SHARED WITH OTHER USERS</p></form>`;
  chirperView?.append(accountGate);
  const commentsSheet = document.createElement('div');
  commentsSheet.className = 'pa-comments-sheet'; commentsSheet.id = 'twitter-comments-sheet'; commentsSheet.hidden = true;
  commentsSheet.innerHTML = '<div class="pa-sheet-scrim" data-comments-close></div><section class="pa-sheet-card pa-comments-card" role="dialog" aria-modal="true" aria-labelledby="twitter-comments-title"><div class="pa-sheet-grabber"></div><div class="pa-sheet-head"><button type="button" class="pa-text-button" data-comments-close>Done</button><strong id="twitter-comments-title">Comments</strong><span class="pa-comments-count" id="twitter-comments-count"></span></div><p class="pa-comments-local">Local comments · not shared</p><div class="pa-comments-list" id="twitter-comments-list"></div><form class="pa-comment-form" id="twitter-comment-form"><textarea id="twitter-comment-text" maxlength="280" placeholder="Post your reply" aria-label="Write a comment" required></textarea><button type="submit" class="pa-comment-submit">Reply</button></form></section>';
  chirperView?.append(commentsSheet);
  let accountTypeDraft = 'personal';
  accountGate.querySelectorAll('[data-account-type]').forEach(button => button.addEventListener('click', () => {
    accountTypeDraft = button.dataset.accountType;
    accountGate.querySelectorAll('[data-account-type]').forEach(item => item.classList.toggle('selected', item === button));
    const business = accountTypeDraft === 'business';
    $('chirper-business-fields').hidden = !business;
    $('chirper-account-name').labels[0].textContent = business ? 'Business name' : 'Display name';
    $('chirper-account-handle').placeholder = business ? 'businessname' : 'yourname';
    $('chirper-account-form').classList.toggle('is-business', business);
    $('chirper-account-form').querySelector('.pa-account-submit').innerHTML = business ? 'Create business profile <span>→</span>' : 'Create local account <span>→</span>';
  }));
  $('chirper-account-name')?.addEventListener('input', event => {
    if (!$('chirper-account-handle').dataset.edited) $('chirper-account-handle').value = event.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, '').slice(0, 20);
  });
  $('chirper-account-handle')?.addEventListener('input', event => { event.target.dataset.edited = 'true'; });
  $('chirper-account-form')?.addEventListener('submit', async event => {
    event.preventDefault(); const name = $('chirper-account-name').value.trim(); const handle = $('chirper-account-handle').value.trim().replace(/^@/, '');
    if (!name || !/^[a-zA-Z0-9_]{3,20}$/.test(handle)) { $('chirper-account-error').textContent = 'Add a name and a username with 3–20 letters, numbers, or underscores.'; return; }
    const duplicateHandle = Object.entries(chirperAccounts).some(([key, account]) => key !== activePhoneUserKey && String(account?.handle || '').toLowerCase() === `@${handle}`.toLowerCase());
    if (communityState !== 'online' && duplicateHandle) { $('chirper-account-error').textContent = 'That username is already used by a local account on this computer.'; return; }
    const previousAccount = chirperAccount;
    let updatedAccount = { type: accountTypeDraft, displayName: name, handle: `@${handle}`, category: accountTypeDraft === 'business' ? $('chirper-business-category').value : '', bio: accountTypeDraft === 'business' ? $('chirper-business-bio').value.trim().slice(0, 160) : '', createdAt: previousAccount?.createdAt || Date.now() };
    if (communityState === 'online') {
      try {
        const saved = await window.primecad.community.saveProfile({ displayName: name, username: handle, accountType: updatedAccount.type, category: updatedAccount.category, bio: updatedAccount.bio });
        updatedAccount = { ...updatedAccount, cloudId: saved.id }; communityProfileReady = true; communityError = '';
      } catch (error) { $('chirper-account-error').textContent = error.message || 'Could not save this ERA community profile.'; return; }
    } else communityProfileReady = false;
    chirperAccounts[activePhoneUserKey] = updatedAccount;
    if (!writeLocal('era-chirper-accounts-v1', chirperAccounts)) { if (previousAccount) chirperAccounts[activePhoneUserKey] = previousAccount; else delete chirperAccounts[activePhoneUserKey]; $('chirper-account-error').textContent = 'Could not save this profile on this computer.'; return; }
    chirperAccount = updatedAccount; $('chirper-account-cancel').hidden = true; accountGate.hidden = true; renderChirper();
  });
  $('chirper-account-cancel')?.addEventListener('click', () => { accountGate.hidden = true; $('chirper-account-error').textContent = ''; });
  const accountTools = document.createElement('div'); accountTools.className = 'pa-account-tools'; accountTools.id = 'chirper-account-tools';
  accountTools.innerHTML = `<div><span class="pa-account-type-badge" id="chirper-profile-type">PERSONAL · LOCAL</span><p id="chirper-profile-bio"></p></div><button type="button" id="chirper-business-toggle" class="pa-manage-account">Create business profile</button>`;
  document.getElementById('chirper-profile-page')?.insertBefore(accountTools, document.getElementById('chirper-profile-count')?.parentElement || null);
  $('chirper-business-toggle')?.addEventListener('click', () => {
    accountGate.hidden = false;
    $('chirper-account-cancel').hidden = false;
    $('chirper-account-error').textContent = '';
    accountGate.querySelector('[data-account-type="business"]').click();
    $('chirper-account-name').value = chirperAccount?.displayName || '';
    $('chirper-account-handle').value = chirperAccount?.handle?.replace(/^@/, '') || '';
    $('chirper-account-handle').dataset.edited = 'true';
    $('chirper-business-category').value = chirperAccount?.category || 'Local Business';
    $('chirper-business-bio').value = chirperAccount?.bio || '';
    $('chirper-account-form').querySelector('.pa-account-submit').innerHTML = chirperAccount?.type === 'business' ? 'Save business profile <span>→</span>' : 'Create business profile <span>→</span>';
    $('chirper-account-name').focus();
  });
  function chirperIdentity(account = chirperAccount) {
    if (account) return { name: account.displayName, handle: account.handle, initial: account.displayName.slice(0,1).toUpperCase(), business: account.type === 'business' };
    const name = String(phoneProfile?.name || '').trim() || 'Local profile';
    const handle = `@${(name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0,18) || 'local')}`;
    return { name, handle, initial: name.slice(0,1).toUpperCase() };
  }
  function mapCloudProfile(profile) {
    return profile ? { type: profile.account_type, displayName: profile.display_name, handle: `@${profile.username}`, category: profile.business_category || '', bio: profile.bio || '', cloudId: profile.id } : null;
  }
  function mapCloudPost(row) {
    const profile = row.author || row.profiles || {};
    return { id: row.id, cloudId: row.id, cloud: true, authorId: row.author_id, text: row.body || '', date: Date.parse(row.created_at) || Date.now(), liked: Boolean(row.liked), rechirped: Boolean(row.reposted), likesCount: Number(row.likes_count || 0), repostsCount: Number(row.reposts_count || 0), comments_count: Number(row.comments_count || 0), comments: [], authorName: profile.display_name || 'ERA user', authorHandle: `@${profile.username || 'user'}`, authorType: profile.account_type || 'personal', category: profile.business_category || '', imageData: row.image_url || '' };
  }
  function mapCloudComment(row) {
    const profile = row.profiles || {};
    return { id: row.id, text: row.body || '', date: Date.parse(row.created_at) || Date.now(), authorName: profile.display_name || 'ERA user', authorHandle: `@${profile.username || 'user'}` };
  }
  async function refreshCommunityPosts() {
    const rows = await window.primecad.community.listPosts();
    communityPosts = rows.map(mapCloudPost); communityState = 'online'; communityError = ''; renderChirper();
  }
  let communityConnectStarted = false;
  async function connectCommunity() {
    communityConnectStarted = true;
    try {
      const session = await window.primecad.community.ensure(); communityUserId = session.id;
      let remoteProfile = session.profile;
      if (!remoteProfile && chirperAccount) {
        try { remoteProfile = await window.primecad.community.saveProfile({ displayName: chirperAccount.displayName, username: chirperAccount.handle, accountType: chirperAccount.type, category: chirperAccount.category, bio: chirperAccount.bio }); }
        catch (error) { communityError = error.message || 'Your profile could not be shared.'; communityProfileReady = false; }
      }
      if (remoteProfile) {
        chirperAccount = mapCloudProfile(remoteProfile); communityProfileReady = true;
        chirperAccounts[activePhoneUserKey] = chirperAccount; writeLocal('era-chirper-accounts-v1', chirperAccounts);
        if (activePhoneUserKey === 'this-device') writeLocal('era-chirper-account-v1', chirperAccount);
      }
      communityState = 'online';
      communityPosts = (await window.primecad.community.listPosts()).map(mapCloudPost);
      await window.primecad.community.startRealtime();
      if (!communityProfileReady && chirperAccount) {
        accountGate.hidden = false;
        $('chirper-account-name').value = chirperAccount.displayName;
        $('chirper-account-handle').value = chirperAccount.handle.replace(/^@/, '');
        $('chirper-account-handle').dataset.edited = 'true';
        $('chirper-account-error').textContent = communityError || 'Choose an available community username to continue.';
      }
      renderChirper();
    } catch (error) {
      communityState = 'offline'; communityError = error.message || 'ERA could not connect to the community service.';
      communityProfileReady = false; renderChirper();
    }
  }
  let realtimeRefreshTimer;
  window.primecad?.on('community:changed', event => {
    if (event?.table === 'connection') { communityState = 'offline'; communityError = 'The live community connection was interrupted.'; renderChirper(); return; }
    clearTimeout(realtimeRefreshTimer);
    realtimeRefreshTimer = setTimeout(async () => {
      try {
        await refreshCommunityPosts();
        if (!commentsSheet.hidden && commentsTarget?.cloud) await loadCloudComments(commentsTarget.post);
      } catch { communityState = 'offline'; renderChirper(); }
    }, 180);
  });
  let commentsTarget = null;
  function renderPostComments(post) {
    const list = $('twitter-comments-list'), comments = Array.isArray(post.comments) ? post.comments : [];
    list.replaceChildren(); $('twitter-comments-count').textContent = String(comments.length);
    commentsSheet.querySelector('.pa-comments-local').textContent = post.cloud ? 'Comments are shared with ERA users' : 'Local comments · not shared';
    if (!comments.length) { const empty = document.createElement('p'); empty.className = 'pa-comments-empty'; empty.textContent = post.cloud ? 'No comments yet. Start the conversation.' : 'No comments yet. Start the conversation on this device.'; list.append(empty); return; }
    comments.forEach(comment => {
      const row = document.createElement('article'); row.className = 'pa-comment-row';
      const avatar = document.createElement('span'); avatar.className = 'pa-comment-avatar'; avatar.textContent = String(comment.authorName || '?').slice(0, 1).toUpperCase();
      const body = document.createElement('div'); body.className = 'pa-comment-body';
      const byline = document.createElement('div'); byline.className = 'pa-comment-byline';
      const name = document.createElement('strong'); name.textContent = comment.authorName || 'Local profile';
      const handle = document.createElement('small'); handle.textContent = comment.authorHandle || '@local';
      const date = document.createElement('small'); date.textContent = new Date(comment.date).toLocaleDateString(window.eraI18n?.getLanguage() === 'et' ? 'et-EE' : 'en-US', { month: 'short', day: 'numeric' });
      const text = document.createElement('p'); text.textContent = comment.text;
      byline.append(name, handle, date); body.append(byline, text); row.append(avatar, body); list.append(row);
    });
  }
  async function loadCloudComments(post) {
    const rows = await window.primecad.community.listComments(post.id);
    post.comments = rows.map(mapCloudComment); post.comments_count = post.comments.length;
    renderPostComments(post); renderChirper();
  }
  async function openPostComments(post, ownerKey = activePhoneUserKey) {
    commentsTarget = { postId: post.id, ownerKey, cloud: Boolean(post.cloud), post };
    commentsSheet.hidden = false; $('twitter-comment-text').value = '';
    if (post.cloud) {
      $('twitter-comments-list').replaceChildren(); const loading = document.createElement('p'); loading.className = 'pa-comments-empty'; loading.textContent = 'Loading comments…'; $('twitter-comments-list').append(loading);
      commentsSheet.querySelector('.pa-comments-local').textContent = 'Comments are shared with ERA users';
      try { await loadCloudComments(post); } catch (error) { toast(error.message || 'Comments could not be loaded.'); }
    } else renderPostComments(post);
    $('twitter-comment-text').focus();
  }
  document.querySelectorAll('[data-comments-close]').forEach(button => button.addEventListener('click', () => { commentsSheet.hidden = true; commentsTarget = null; renderChirper(); }));
  $('twitter-comment-form').addEventListener('submit', event => {
    event.preventDefault();
    const text = $('twitter-comment-text').value.trim(); if (!text || !commentsTarget || !chirperAccount) return;
    if (commentsTarget.cloud) {
      if (!communityProfileReady || communityState !== 'online') { toast('Connect and set up your ERA community profile before commenting.'); return; }
      const target = commentsTarget;
      window.primecad.community.createComment({ postId: target.postId, body: text.slice(0, 280) }).then(async () => {
        $('twitter-comment-text').value = ''; await loadCloudComments(target.post); await refreshCommunityPosts();
      }).catch(error => toast(error.message || 'Comment could not be shared.'));
      return;
    }
    const ownerPosts = Array.isArray(chirpsByPhoneUser[commentsTarget.ownerKey]) ? chirpsByPhoneUser[commentsTarget.ownerKey] : [];
    const post = ownerPosts.find(item => item.id === commentsTarget.postId); if (!post) return;
    if (!Array.isArray(post.comments)) post.comments = [];
    post.comments.push({ id: makeId(), text: text.slice(0, 280), date: Date.now(), authorName: chirperAccount.displayName, authorHandle: chirperAccount.handle });
    if (!writeLocal('primecad-chirper-accounts-posts-v1', chirpsByPhoneUser)) { post.comments.pop(); toast('Could not save this comment on this computer.'); return; }
    $('twitter-comment-text').value = ''; renderPostComments(post); renderChirper();
  });
  function makePostCard(post, readOnly = false, ownerKey = activePhoneUserKey) {
    const identity = post.authorName ? { name: post.authorName, handle: post.authorHandle, initial: String(post.authorName).slice(0,1).toUpperCase(), business: post.authorType === 'business' } : chirperIdentity(), article = document.createElement('article'); article.className = 'pa-chirp-card';
    const avatar = document.createElement('div'); avatar.className = 'pa-chirp-avatar'; avatar.textContent = identity.initial;
    const body = document.createElement('div'); body.className = 'pa-chirp-body';
    const top = document.createElement('div'); top.className = 'pa-chirp-byline'; const display = document.createElement('strong'); display.textContent = identity.name; const handle = document.createElement('span'); const locale = window.eraI18n?.getLanguage() === 'et' ? 'et-EE' : 'en-US'; handle.textContent = `${identity.handle} · ${new Date(post.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}`; top.append(display, handle); if (identity.business) { const badge=document.createElement('i'); badge.className='pa-business-verified'; badge.textContent='BUSINESS'; top.append(badge); }
    const text = document.createElement('p'); text.textContent = post.text;
    const local = document.createElement('small'); local.className = 'pa-chirp-local'; local.textContent = post.cloud ? 'Shared with ERA community' : 'Local draft · not shared';
    const actions = document.createElement('div'); actions.className = 'pa-chirp-actions';
    const commentCount = post.cloud ? Number(post.comments_count || 0) : Array.isArray(post.comments) ? post.comments.length : 0;
    const reply = document.createElement('button'); reply.type = 'button'; reply.className = 'pa-reply-action'; reply.textContent = `▢ ${commentCount}`; reply.setAttribute('aria-label',`Open comments, ${commentCount}`); reply.addEventListener('click', () => openPostComments(post, ownerKey));
    const rechirp = document.createElement('button'); rechirp.type='button'; rechirp.classList.toggle('active',!!post.rechirped); rechirp.textContent = `↻ ${post.cloud ? Number(post.repostsCount || 0) : post.rechirped ? 1 : 0}`; rechirp.setAttribute('aria-label',post.cloud ? 'Repost' : 'Toggle local repost'); rechirp.addEventListener('click', async () => { if (post.cloud) { try { post.rechirped = await window.primecad.community.toggleReaction({ postId: post.id, reaction: 'repost' }); await refreshCommunityPosts(); } catch (error) { toast(error.message || 'Repost could not be shared.'); } } else { post.rechirped = !post.rechirped; persistChirps(); renderChirper(); } });
    const like = document.createElement('button'); like.type='button'; like.classList.toggle('liked',!!post.liked); like.textContent = `${post.liked ? '♥' : '♡'} ${post.cloud ? Number(post.likesCount || 0) : post.liked ? 1 : 0}`; like.setAttribute('aria-label',post.cloud ? 'Like post' : 'Toggle local like'); like.addEventListener('click', async () => { if (post.cloud) { try { post.liked = await window.primecad.community.toggleReaction({ postId: post.id, reaction: 'like' }); await refreshCommunityPosts(); } catch (error) { toast(error.message || 'Like could not be shared.'); } } else { post.liked = !post.liked; persistChirps(); renderChirper(); } });
    const del = document.createElement('button'); del.type='button'; del.textContent='×'; del.setAttribute('aria-label',post.cloud ? 'Delete post' : 'Delete local post'); del.addEventListener('click', async () => { if (post.cloud) { try { await window.primecad.community.deletePost(post.id); await refreshCommunityPosts(); } catch (error) { toast(error.message || 'Post could not be deleted.'); } } else { chirps = chirps.filter(item => item.id !== post.id); persistChirps(); renderChirper(); } });
    if (readOnly && !post.cloud) { rechirp.disabled = true; like.disabled = true; }
    if ((post.cloud && post.authorId !== communityUserId) || (!post.cloud && readOnly)) del.hidden = true;
    actions.append(reply, rechirp, like, del); body.append(top,text);
    if (post.imageData) { const image = document.createElement('img'); image.className = 'pa-chirp-image'; image.src = post.imageData; image.alt = 'Image attached to local post'; body.append(image); }
    body.append(local,actions); article.append(avatar,body); return article;
  }
  function persistChirps() { chirpsByPhoneUser[activePhoneUserKey] = chirps; if (!writeLocal('primecad-chirper-accounts-posts-v1', chirpsByPhoneUser)) { toast('Could not save local posts on this computer.'); return false; } return true; }
  function loadPhoneUserAccount() {
    const nextKey = phoneUserKey();
    if (nextKey === activePhoneUserKey) return;
    const previousKey = activePhoneUserKey;
    if (previousKey === 'this-device' && !chirperAccounts[nextKey] && chirperAccount) { chirperAccounts[nextKey] = chirperAccount; writeLocal('era-chirper-accounts-v1', chirperAccounts); }
    if (previousKey === 'this-device' && !Array.isArray(chirpsByPhoneUser[nextKey]) && Array.isArray(chirps)) { chirpsByPhoneUser[nextKey] = chirps; writeLocal('primecad-chirper-accounts-posts-v1', chirpsByPhoneUser); }
    activePhoneUserKey = nextKey;
    chirperAccount = chirperAccounts[activePhoneUserKey] || null;
    chirps = Array.isArray(chirpsByPhoneUser[activePhoneUserKey]) ? chirpsByPhoneUser[activePhoneUserKey] : [];
    accountTypeDraft = chirperAccount?.type || 'personal';
    accountGate.querySelector(`[data-account-type="${accountTypeDraft}"]`)?.click();
    if (!chirperAccount) {
      $('chirper-account-name').value = '';
      $('chirper-account-handle').value = '';
      delete $('chirper-account-handle').dataset.edited;
      $('chirper-business-category').value = 'Community';
      $('chirper-business-bio').value = '';
    }
    accountGate.hidden = Boolean(chirperAccount) || !chirperView?.classList.contains('active');
    $('chirper-account-cancel').hidden = true;
    renderChirper();
  }
  window.addEventListener('era:phone-profile-loaded', () => { loadPhoneUserAccount(); if (communityConnectStarted) connectCommunity(); });
  let profileSearchRevision = 0;
  async function renderLocalUserSearch() {
    const input = $('chirper-search-input'), results = $('chirper-search-results'), empty = $('chirper-search-empty');
    if (!input || !results || !empty) return;
    const revision = ++profileSearchRevision, query = input.value.trim().replace(/^@/, '').toLowerCase();
    let matches = [];
    if (query && communityState === 'online') {
      try { matches = (await window.primecad.community.searchProfiles(query)).map(account => ({ key: account.id, account: mapCloudProfile(account), cloud: true })); }
      catch { matches = []; }
    } else if (query) {
      const accounts = Object.entries(chirperAccounts).filter(([, account]) => account && typeof account.displayName === 'string' && typeof account.handle === 'string');
      matches = accounts.filter(([, account]) => account.displayName.toLowerCase().includes(query) || account.handle.toLowerCase().replace(/^@/, '').includes(query)).map(([key, account]) => ({ key, account, cloud: false }));
    }
    if (revision !== profileSearchRevision) return;
    results.replaceChildren();
    empty.hidden = matches.length > 0;
    empty.textContent = query ? 'No ERA community account matches that search.' : communityState === 'online' ? 'Search ERA community users.' : 'Connect to search community users.';
    for (const { key, account, cloud } of matches) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'pa-search-user';
      const avatar = document.createElement('span'); avatar.className = 'pa-search-avatar'; avatar.textContent = account.displayName.slice(0, 1).toUpperCase();
      const details = document.createElement('span'); details.className = 'pa-search-user-details';
      const name = document.createElement('strong'); name.textContent = account.displayName;
      const handle = document.createElement('small'); handle.textContent = `${account.handle}${account.type === 'business' ? ` · ${account.category || 'Business'}` : ''}`;
      details.append(name, handle); button.append(avatar, details);
      button.addEventListener('click', () => { viewedProfileKey = cloud ? null : key; viewedProfileCloudId = cloud ? key : null; viewedProfileCloud = cloud ? account : null; profileTab = 'Posts'; socialPage = 'Profile'; document.querySelectorAll('[data-chirper-nav]').forEach(nav => nav.classList.toggle('selected', nav.dataset.chirperNav === 'Profile')); renderChirper(); });
      results.append(button);
    }
  }
  async function compressChirperImage(blob) {
    const bitmap = await createImageBitmap(blob); const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close?.();
    const compressed = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not prepare image.')), 'image/jpeg', .78));
    if (compressed.size > 500_000) throw new Error('That photo is too large to save with a local post.');
    return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Could not read image.')); reader.readAsDataURL(compressed); });
  }
  function renderChirper() {
    if (!$('chirper-feed')) return;
    const feed = $('chirper-feed'), isCommunityOnline = communityState === 'online'; feed.replaceChildren();
    const order = [...(isCommunityOnline ? [...communityPosts, ...chirps] : chirps)].sort((a,b) => b.date-a.date);
    const visiblePosts = feedMode === 'foryou' ? order : [];
    feed.dataset.feedLabel = isCommunityOnline ? 'ERA COMMUNITY · SHARED' : 'LOCAL DRAFTS · NOT SHARED';
    $('communityStatusBadge').textContent = communityState === 'online' ? 'ONLINE' : communityState === 'connecting' ? 'CONNECTING' : 'OFFLINE';
    $('communityStatusBadge').title = communityState === 'online' ? 'Posts and comments are shared with ERA users.' : communityError || 'Posts and comments are local until the community service connects.';
    accountGate.querySelector('.pa-account-copy').textContent = isCommunityOnline ? 'Create an ERA community profile. Posts, likes, reposts, and comments are shared with other ERA users.' : 'Community is offline. This profile and any drafts stay on this computer until the connection is ready.';
    accountGate.querySelector('.pa-account-footnote').textContent = isCommunityOnline ? 'ERA COMMUNITY · SHARED WITH OTHER USERS' : 'OFFLINE · LOCAL ONLY';
    $('chirper-empty').hidden = socialPage !== 'Home' || visiblePosts.length > 0;
    $('chirper-empty').querySelector('strong').textContent = feedMode === 'following' ? 'No followed accounts' : isCommunityOnline ? 'No community posts yet' : 'No local posts yet';
    $('chirper-empty').querySelector('small').textContent = feedMode === 'following' ? 'Following needs a connected community service.' : isCommunityOnline ? 'Posts shared by ERA users will appear here.' : 'Your local drafts stay on this computer until the community service connects.';
    $('chirper-social-empty').hidden = socialPage !== 'Notifications';
    $('chirper-social-title').textContent = 'No notifications';
    $('chirper-social-copy').textContent = 'Notifications require a connected community service. Nothing has been received.';
    chirperSearchPage.hidden = socialPage !== 'Search';
    if (socialPage === 'Search') renderLocalUserSearch();
    $('chirper-profile-page').hidden = socialPage !== 'Profile';
    accountGate.hidden = Boolean(chirperAccount) && (!isCommunityOnline || communityProfileReady);
    if (chirperAccount) {
      $('chirper-profile-type').textContent = chirperAccount.type === 'business' ? `${chirperAccount.category || 'BUSINESS'} · ${isCommunityOnline && communityProfileReady ? 'ONLINE' : 'LOCAL'}` : `PERSONAL · ${isCommunityOnline && communityProfileReady ? 'ONLINE' : 'LOCAL'}`;
      $('chirper-profile-bio').textContent = chirperAccount.bio || '';
      $('chirper-business-toggle').textContent = chirperAccount.type === 'business' ? 'Edit business profile' : 'Create business profile';
      $('chirper-business-toggle').disabled = false;
    }
    feed.hidden = socialPage !== 'Home'; $('chirper-compose-open').hidden = false;
    if (socialPage === 'Home') { visiblePosts.forEach(item => feed.append(makePostCard(item, false, activePhoneUserKey))); }
    if (socialPage === 'Profile') {
      const isCloudProfile = isCommunityOnline;
      const profileKey = viewedProfileKey || activePhoneUserKey;
      const profileCloudId = viewedProfileCloudId || communityUserId;
      const profileAccount = isCloudProfile ? (viewedProfileCloud || (profileCloudId === communityUserId ? chirperAccount : null)) : chirperAccounts[profileKey] || chirperAccount;
      const profilePosts = isCloudProfile ? [...communityPosts.filter(item => item.authorId === profileCloudId), ...(profileCloudId === communityUserId ? chirps : [])] : profileKey === activePhoneUserKey ? chirps : (Array.isArray(chirpsByPhoneUser[profileKey]) ? chirpsByPhoneUser[profileKey] : []);
      const profileOrder = [...profilePosts].sort((a,b) => b.date-a.date), identity=chirperIdentity(profileAccount);
      $('chirper-avatar').textContent=identity.initial; $('chirper-profile-name').textContent=identity.name; $('chirper-profile-handle').textContent=identity.handle; $('chirper-profile-count').textContent=String(profilePosts.length);
      accountTools.hidden = isCloudProfile ? profileCloudId !== communityUserId : profileKey !== activePhoneUserKey;
      const out=$('chirper-profile-posts'); out.replaceChildren(); let subset = profileOrder.filter(item => profileTab === 'Likes' ? item.liked : profileTab === 'Replies' ? false : profileTab === 'Media' ? Boolean(item.imageData) : true);
      subset.forEach(item => out.append(makePostCard(item.authorName ? item : { ...item, authorName: profileAccount?.displayName || 'Local profile', authorHandle: profileAccount?.handle || '@local', authorType: profileAccount?.type }, accountTools.hidden, isCloudProfile ? profileCloudId : profileKey))); $('chirper-profile-empty').hidden = subset.length > 0;
      $('chirper-profile-empty').querySelector('strong').textContent = profileTab === 'Likes' ? 'No local likes yet' : `No ${profileTab.toLowerCase()} yet`;
    }
    document.querySelectorAll('[data-chirper-feed]').forEach(b => b.classList.toggle('selected', b.dataset.chirperFeed === feedMode));
    document.querySelector('.pa-chirper-tabs').hidden = socialPage !== 'Home';
  }
  window.addEventListener('era:language-changed', renderChirper);
  $('chirper-search-input')?.addEventListener('input', renderLocalUserSearch);
  document.querySelectorAll('[data-chirper-feed]').forEach(button => button.addEventListener('click', () => { feedMode = button.dataset.chirperFeed; renderChirper(); }));
  document.querySelectorAll('[data-chirper-nav]').forEach(button => button.addEventListener('click', () => { socialPage = button.dataset.chirperNav; viewedProfileKey = null; viewedProfileCloudId = null; viewedProfileCloud = null; document.querySelectorAll('[data-chirper-nav]').forEach(b => b.classList.toggle('selected', b === button)); renderChirper(); }));
  document.querySelectorAll('[data-profile-tab]').forEach(button => button.addEventListener('click', () => { profileTab = button.dataset.profileTab; document.querySelectorAll('[data-profile-tab]').forEach(b => b.classList.toggle('selected', b === button)); renderChirper(); }));
  let selectedChirperImage = '', galleryUrls = [];
  const composerForm = $('chirper-compose-form'), composeText = $('chirper-compose-text');
  if (composeText) composeText.required = false;
  const galleryButton = document.createElement('button'); galleryButton.type = 'button'; galleryButton.className = 'pa-gallery-pick'; galleryButton.textContent = '▧  Choose from Photos';
  const composePreview = document.createElement('img'); composePreview.className = 'pa-compose-preview'; composePreview.alt = 'Selected photo'; composePreview.hidden = true;
  const galleryPicker = document.createElement('div'); galleryPicker.className = 'pa-gallery-picker'; galleryPicker.id = 'chirper-gallery-picker'; galleryPicker.hidden = true;
  const composeFoot = composerForm?.querySelector('p'); composerForm?.insertBefore(galleryButton, composeFoot || null); composerForm?.insertBefore(composePreview, composeFoot || null); composerForm?.insertBefore(galleryPicker, composeFoot || null);
  function clearGalleryUrls() { galleryUrls.forEach(url => URL.revokeObjectURL(url)); galleryUrls = []; }
  async function showChirperGallery() {
    galleryPicker.hidden = false; galleryPicker.replaceChildren(); clearGalleryUrls();
    const savedPhotos = await readPhotos().catch(() => []);
    if (!savedPhotos.length) { const empty = document.createElement('small'); empty.textContent = 'Your Photos library is empty. Capture a photo first.'; galleryPicker.append(empty); return; }
    for (const photo of savedPhotos.sort((a,b) => b.date-a.date)) {
      const url = URL.createObjectURL(photo.blob); galleryUrls.push(url);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'pa-gallery-choice'; button.setAttribute('aria-label', photo.title || 'Choose photo');
      const image = document.createElement('img'); image.src = url; image.alt = photo.title || 'Saved photo'; button.append(image);
      button.addEventListener('click', async () => {
        try { selectedChirperImage = await compressChirperImage(photo.blob); composePreview.src = selectedChirperImage; composePreview.hidden = false; galleryPicker.hidden = true; }
        catch (error) { toast(error.message || 'Could not attach this photo.'); }
      });
      galleryPicker.append(button);
    }
  }
  galleryButton.addEventListener('click', showChirperGallery);
  function resetComposer() { clearGalleryUrls(); selectedChirperImage = ''; composePreview.removeAttribute('src'); composePreview.hidden = true; galleryPicker.hidden = true; galleryPicker.replaceChildren(); composeText.value = ''; }
  $('chirper-compose-open')?.addEventListener('click', () => { $('chirper-compose-sheet').hidden = false; $('chirper-compose-text').focus(); });
  document.querySelectorAll('[data-chirp-close]').forEach(button => button.addEventListener('click', () => { $('chirper-compose-sheet').hidden = true; resetComposer(); }));
  composerForm?.addEventListener('submit', async event => {
    event.preventDefault(); if (!chirperAccount) return;
    const text = composeText.value.trim(); if (!text && !selectedChirperImage) return;
    if (communityState === 'online') {
      if (!communityProfileReady) { toast('Set up your ERA community profile before posting.'); return; }
      try {
        await window.primecad.community.createPost({ body: text.slice(0, 500), imageData: selectedChirperImage });
        $('chirper-compose-sheet').hidden = true; resetComposer(); socialPage='Home'; viewedProfileKey=null; viewedProfileCloudId=null; viewedProfileCloud=null;
        document.querySelectorAll('[data-chirper-nav]').forEach(b=>b.classList.toggle('selected',b.dataset.chirperNav==='Home'));
        await refreshCommunityPosts();
      } catch (error) { toast(error.message || 'Post could not be shared with ERA users.'); }
      return;
    }
    const post = { id: makeId(), text: text.slice(0,500), date: Date.now(), liked: false, rechirped: false, authorName: chirperAccount.displayName, authorHandle: chirperAccount.handle, authorType: chirperAccount.type, imageData: selectedChirperImage };
    chirps.unshift(post);
    if (!persistChirps()) { chirps.shift(); return; }
    $('chirper-compose-sheet').hidden = true; resetComposer(); socialPage='Home'; viewedProfileKey=null; document.querySelectorAll('[data-chirper-nav]').forEach(b=>b.classList.toggle('selected',b.dataset.chirperNav==='Home')); renderChirper();
    toast('Saved as a local draft; community sharing is offline.');
  });
  renderChirper();
  window.addEventListener('era:phone-view-changed', event => { if (event.detail === 'chirper' && !communityConnectStarted) connectCommunity(); });
  document.querySelectorAll('[data-open="chirper"]').forEach(button => button.addEventListener('click', () => { if (!communityConnectStarted) connectCommunity(); }));

  const forbiddenListing = /\b(?:cocaine|heroin|meth(?:amphetamine)?|fentanyl|opioid|narcotic|firearm|gun|rifle|pistol|ammunition|explosive|bomb|weapon|human trafficking|stolen identity)\b/i;
  function listingStoreKey(dark) { return dark ? 'primecad-darkweb-local-v1' : 'primecad-market-local-v1'; }
  function readListings(dark) { const list = readLocal(listingStoreKey(dark), []); return Array.isArray(list) ? list : []; }
  function marketCard(entry, dark, onDelete) {
    const card=document.createElement('article'); card.className=`pa-market-card${dark?' pa-dark-card':''}`;
    const art=document.createElement('div'); art.className='pa-market-art'; art.textContent=dark?'◈':'▧';
    const title=document.createElement('strong'); title.textContent=entry.title;
    const desc=document.createElement('p'); desc.textContent=entry.description || 'Fictional in-game item';
    const price=document.createElement('b'); price.textContent=`${Number(entry.price||0).toLocaleString('en-US')} credits`;
    const seller=document.createElement('small'); seller.textContent=`${entry.seller || 'Local profile'} · ${entry.draft?'Draft':'Local'}`;
    const del=document.createElement('button'); del.className='pa-listing-delete'; del.type='button'; del.textContent='×'; del.setAttribute('aria-label','Delete local listing'); del.addEventListener('click',()=>onDelete(entry.id));
    card.append(art,title,desc,price,seller,del); return card;
  }
  function renderMarket(dark) {
    const prefix=dark?'darkweb':'market', grid=$(dark?'darkweb-grid':'market-grid'), empty=$(dark?'darkweb-empty':'market-empty'), community=$(dark?'darkweb-community-empty':'market-community-empty');
    if (!grid) return;
    const tab=dark?document.querySelector('[data-dark-tab].selected')?.dataset.darkTab:document.querySelector('[data-market-tab].selected')?.dataset.marketTab;
    const local=tab!=='community'; grid.hidden=!local; empty.hidden=!local || readListings(dark).length>0; community.hidden=local;
    grid.replaceChildren();
    if (!local) return;
    const list=readListings(dark).sort((a,b)=>b.date-a.date);
    for (const item of list) grid.append(marketCard(item,dark,id=>{const next=readListings(dark).filter(row=>row.id!==id); if(!writeLocal(listingStoreKey(dark),next)) toast('Could not update local listings.'); renderMarket(dark);}));
    empty.hidden=list.length>0;
  }
  function openListing(dark) {
    const form=$(dark?'darkweb-listing-form':'market-listing-form'); form.reset();
    const name=String(phoneProfile?.name||'').trim(); $(dark?'darkweb-seller':'market-seller').value=name||'Local profile';
    $(dark?'darkweb-listing-sheet':'market-listing-sheet').hidden=false;
  }
  function closeListing(dark) { $(dark?'darkweb-listing-sheet':'market-listing-sheet').hidden=true; }
  function saveListing(dark,draft) {
    const prefix=dark?'darkweb':'market', title=$(prefix+'-title').value.trim(), description=$(prefix+'-description').value.trim(), seller=$(prefix+'-seller').value.trim(), status=$(prefix+'-form-status');
    if (!title) { status.textContent='Enter an item title.'; return false; }
    if (forbiddenListing.test(`${title} ${description}`)) { status.textContent='This roleplay board accepts safe fictional in-game items only.'; return false; }
    const list=readListings(dark); list.unshift({id:makeId(),title:title.slice(0,60),description:description.slice(0,240),price:Math.max(0,Number($(prefix+'-price').value)||0),seller:seller.slice(0,40)||'Local profile',date:Date.now(),draft});
    if (!writeLocal(listingStoreKey(dark),list)) { status.textContent='Could not save on this computer.'; return false; }
    status.textContent=draft?'Draft saved locally.':'Listing saved locally · not shared.';
    setTimeout(()=>closeListing(dark),500); renderMarket(dark); return true;
  }
  $('market-sell')?.addEventListener('click',()=>openListing(false)); $('market-sell-top')?.addEventListener('click',()=>openListing(false)); $('market-empty-sell')?.addEventListener('click',()=>openListing(false));
  $('darkweb-sell')?.addEventListener('click',()=>openListing(true)); $('darkweb-empty-sell')?.addEventListener('click',()=>openListing(true));
  document.querySelectorAll('[data-market-close]').forEach(b=>b.addEventListener('click',()=>closeListing(false))); document.querySelectorAll('[data-dark-close]').forEach(b=>b.addEventListener('click',()=>closeListing(true)));
  $('market-listing-form')?.addEventListener('submit',event=>{event.preventDefault();saveListing(false,false);}); $('darkweb-listing-form')?.addEventListener('submit',event=>{event.preventDefault();saveListing(true,false);});
  $('market-save-draft')?.addEventListener('click',()=>saveListing(false,true)); $('darkweb-save-draft')?.addEventListener('click',()=>saveListing(true,true));
  document.querySelectorAll('[data-market-tab]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-market-tab]').forEach(b=>b.classList.toggle('selected',b===button));renderMarket(false);}));
  document.querySelectorAll('[data-dark-tab]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-dark-tab]').forEach(b=>b.classList.toggle('selected',b===button));renderMarket(true);}));
  $('market-community')?.addEventListener('click',()=>{document.querySelector('[data-market-tab="community"]')?.click();}); $('darkweb-community')?.addEventListener('click',()=>{document.querySelector('[data-dark-tab="community"]')?.click();});
  renderMarket(false); renderMarket(true);

  // Settings additions are injected after the existing wallpaper controls. The app shell
  // does not expose F1 lifecycle preferences to this script, so that choice is informational.
  const settingsPage = document.querySelector('.settings-page');
  if (settingsPage && !$('phoneappsSettingsExtras')) {
    const extras = document.createElement('section'); extras.id = 'phoneappsSettingsExtras'; extras.className = 'pa-settings-extras';
    extras.innerHTML = `<div class="pa-settings-category"><p class="eyebrow">GENERAL</p><label class="pa-settings-select"><span><strong>Language</strong><small>Choose the phone language</small></span><select id="pa-language" aria-label="Phone language"><option value="en">English</option><option value="et">Eesti</option></select></label><div class="pa-settings-control"><div><strong>Overlay opacity</strong><small>Adjust the phone overlay visibility</small></div><label class="pa-opacity-control"><input id="pa-overlay-opacity" type="range" min="55" max="100" step="5" value="100"><span id="pa-overlay-opacity-value">100%</span></label></div></div><div class="pa-settings-category"><p class="eyebrow">OVERLAY</p><div class="pa-settings-info"><strong>Phone visibility</strong><small>The overlay follows Roblox foreground visibility settings shown above.</small></div></div><div class="pa-settings-category"><p class="eyebrow">KEYBOARD SHORTCUT</p><div class="pa-settings-shortcuts"><div><kbd>F1</kbd><span>Show / hide phone</span></div><small>F1 visibility follows the Roblox foreground setting above. ERA cannot change the app's Roblox-only visibility rule here.</small><div><kbd>F2</kbd><span>Open staff dashboard</span></div><div><kbd>F3</kbd><span>Open CAD overlay (authorized access)</span></div></div></div><div class="pa-settings-category"><p class="eyebrow">THEME</p><label class="pa-settings-select"><span><strong>Phone appearance</strong><small>Choose a local interface theme</small></span><select id="pa-phone-theme" aria-label="Phone appearance"><option value="dark">Dark</option><option value="light">Light</option></select></label></div><div class="pa-settings-category"><p class="eyebrow">AUTO-OPEN</p><label class="pa-settings-select"><span><strong>F1 default screen</strong><small>Choose which screen opens when you press F1.</small></span><select id="pa-f1-default" aria-label="F1 default screen"><option value="home">Home</option><option value="last">Last screen</option></select></label><p class="pa-settings-honest">Saved on this computer. ERA still opens only after you press F1.</p></div>`;
    settingsPage.append(extras);
  }
  const phoneShell = document.querySelector('.phone-shell');
  let settingsPrefs = phoneDisplayPreferences();
  if (phoneShell) {
    const opacity = Math.max(55, Math.min(100, Number(settingsPrefs.opacity) || 100));
    phoneShell.dataset.eraOpacity = String(Math.round(opacity / 5) * 5);
    phoneShell.dataset.eraTheme = settingsPrefs.theme === 'light' ? 'light' : 'dark';
  }
  if ($('pa-language')) {
    $('pa-language').value = window.eraI18n?.getLanguage() || 'en';
    $('pa-language').addEventListener('change', async event => {
      const language = event.currentTarget.value === 'et' ? 'et' : 'en';
      window.eraI18n?.setLanguage(language);
      try {
        phoneProfile = await window.primecad.phoneProfile.save({ name: phoneProfile.name, robloxUserId: phoneProfile.robloxUserId, wallpaper: phoneProfile.wallpaper, language });
      } catch (error) { toast(error.message || 'Language preference could not be saved.'); }
    });
  }
  if ($('pa-overlay-opacity')) {
    $('pa-overlay-opacity').value = String(Math.max(55, Math.min(100, Number(settingsPrefs.opacity) || 100)));
    $('pa-overlay-opacity-value').textContent = `${$('pa-overlay-opacity').value}%`;
    $('pa-overlay-opacity').addEventListener('input', event => {
      const opacity = Math.max(55, Math.min(100, Number(event.target.value)));
      $('pa-overlay-opacity-value').textContent = `${opacity}%`;
      if (phoneShell) phoneShell.dataset.eraOpacity = String(Math.round(opacity / 5) * 5);
      savePhoneDisplayPreferences({ opacity });
    });
    $('pa-phone-theme').value = settingsPrefs.theme === 'light' ? 'light' : 'dark';
    $('pa-phone-theme').addEventListener('change', event => {
      const theme = event.target.value === 'light' ? 'light' : 'dark';
      if (phoneShell) phoneShell.dataset.eraTheme = theme;
      savePhoneDisplayPreferences({ theme });
    });
    $('pa-f1-default').value = settingsPrefs.f1Default === 'last' ? 'last' : 'home';
    $('pa-f1-default').addEventListener('change', event => {
      const f1Default = event.target.value === 'last' ? 'last' : 'home';
      savePhoneDisplayPreferences({ f1Default });
      toast(`F1 will open ${f1Default === 'home' ? 'Home' : 'the last screen'} next time.`);
    });
  }
  let migratedInitialPhoneSettings = false;
  window.addEventListener('era:phone-profile-loaded', () => {
    if (!migratedInitialPhoneSettings) {
      const all = readLocal('primecad-phone-display-v2', {});
      if (!all[phoneUserKey()]) {
        const previous = all['this-device'] || readLocal('primecad-phone-display-v1', null);
        if (previous) { all[phoneUserKey()] = previous; delete all['this-device']; writeLocal('primecad-phone-display-v2', all); }
      }
      migratedInitialPhoneSettings = true;
    }
    settingsPrefs = phoneDisplayPreferences();
    const opacity = Math.max(55, Math.min(100, Number(settingsPrefs.opacity) || 100));
    if (phoneShell) { phoneShell.dataset.eraOpacity = String(Math.round(opacity / 5) * 5); phoneShell.dataset.eraTheme = settingsPrefs.theme === 'light' ? 'light' : 'dark'; }
    if ($('pa-overlay-opacity')) { $('pa-overlay-opacity').value = String(opacity); $('pa-overlay-opacity-value').textContent = `${opacity}%`; }
    if ($('pa-phone-theme')) $('pa-phone-theme').value = settingsPrefs.theme === 'light' ? 'light' : 'dark';
    if ($('pa-f1-default')) $('pa-f1-default').value = settingsPrefs.f1Default === 'last' ? 'last' : 'home';
  });
})();
