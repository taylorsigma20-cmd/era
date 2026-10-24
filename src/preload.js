const { contextBridge, ipcRenderer } = require('electron');

const allowedEvents = new Set(['toggle-phone', 'hide-phone', 'open-overlays', 'open-mdt', 'server-profile-updated', 'phone-profile:updated', 'player-overlay:show', 'player-overlay:access-denied', 'open-player-list', 'update:state', 'phone-shown', 'phone-hidden', 'community:changed']);

contextBridge.exposeInMainWorld('primecad', {
  hide: () => ipcRenderer.send('phone:hide'),
  show: () => ipcRenderer.send('phone:show'),
  toggle: () => ipcRenderer.send('phone:toggle'),
  openDashboard: () => ipcRenderer.send('dashboard:open'),
  quit: () => ipcRenderer.send('app:quit'),
  closeDashboard: () => ipcRenderer.send('dashboard:close'),
  minimizeDashboard: () => ipcRenderer.send('dashboard:minimize'),
  toggleMaximizeDashboard: () => ipcRenderer.send('dashboard:toggle-maximize'),
  openPlayerOverlay: () => ipcRenderer.send('player-overlay:open'),
  hidePlayerOverlay: () => ipcRenderer.send('player-overlay:hide'),
  togglePlayerOverlay: () => ipcRenderer.send('player-overlay:toggle'),
  openStaffTools: () => ipcRenderer.send('player-overlay:open-tools'),
  notifyServerProfileUpdated: () => ipcRenderer.send('server-profile:updated'),
  phoneProfile: {
    get: () => ipcRenderer.invoke('phone-profile:get'),
    save: payload => ipcRenderer.invoke('phone-profile:save', payload),
    chooseWallpaper: () => ipcRenderer.invoke('phone-profile:choose-wallpaper')
  },
  community: {
    ensure: () => ipcRenderer.invoke('community:ensure'),
    saveProfile: payload => ipcRenderer.invoke('community:profile:save', payload),
    searchProfiles: query => ipcRenderer.invoke('community:profiles:search', String(query || '').slice(0, 32)),
    listPosts: () => ipcRenderer.invoke('community:posts:list'),
    createPost: payload => ipcRenderer.invoke('community:posts:create', payload),
    deletePost: postId => ipcRenderer.invoke('community:posts:delete', String(postId || '').slice(0, 40)),
    toggleReaction: payload => ipcRenderer.invoke('community:posts:toggle-reaction', payload),
    listComments: postId => ipcRenderer.invoke('community:comments:list', String(postId || '').slice(0, 40)),
    createComment: payload => ipcRenderer.invoke('community:comments:create', payload),
    listConversations: () => ipcRenderer.invoke('community:messages:conversations'),
    getOrCreateConversation: userId => ipcRenderer.invoke('community:messages:conversation', String(userId || '').slice(0, 40)),
    listDirectMessages: conversationId => ipcRenderer.invoke('community:messages:list', String(conversationId || '').slice(0, 40)),
    sendDirectMessage: payload => ipcRenderer.invoke('community:messages:send', payload),
    startRealtime: () => ipcRenderer.invoke('community:realtime:start')
  },
  gmail: {
    openInbox: () => ipcRenderer.invoke('gmail:open-inbox'),
    compose: payload => ipcRenderer.invoke('gmail:compose', payload)
  },
  news: {
    headlines: () => ipcRenderer.invoke('news:headlines'),
    open: url => ipcRenderer.invoke('news:open', String(url || '').slice(0, 2048))
  },
  confirmRemove: name => ipcRenderer.invoke('server:confirm-remove', String(name || '').slice(0, 100)),
  servers: {
    list: () => ipcRenderer.invoke('servers:list'),
    selected: () => ipcRenderer.invoke('servers:selected'),
    select: id => ipcRenderer.invoke('servers:select', id),
    add: payload => ipcRenderer.invoke('servers:add', payload),
    refresh: id => ipcRenderer.invoke('servers:refresh', id),
    remove: id => ipcRenderer.invoke('servers:remove', id),
    play: id => ipcRenderer.invoke('servers:play', id)
  },
  players: {
    refresh: serverId => ipcRenderer.invoke('players:refresh', serverId),
    confirmAction: payload => ipcRenderer.invoke('players:confirm-action', payload),
    action: payload => ipcRenderer.invoke('players:action', payload)
  },
  updates: {
    getState: () => ipcRenderer.invoke('update:get-state'),
    download: () => ipcRenderer.invoke('update:download'),
    skip: version => ipcRenderer.invoke('update:skip', version),
    install: () => ipcRenderer.invoke('update:install')
  },
  on: (channel, callback) => {
    if (!allowedEvents.has(channel) || typeof callback !== 'function') return;
    const listener = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
});
