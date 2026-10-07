function parsePlayerId(value) {
  const parts = String(value || '').split(':');
  const id = parts.pop()?.trim() || '';
  const username = parts.join(':').trim();
  if (!/^\d+$/.test(id) || !/^[A-Za-z0-9_]{1,20}$/.test(username)) return null;
  return { id, username, player: `${username}:${id}` };
}

function samePlayer(entry, target) {
  const parsed = parsePlayerId(entry?.Player);
  return Boolean(parsed && parsed.id === target.id);
}

function commandTarget(command, kind) {
  const match = new RegExp(`^\\s*:?(?:${kind})\\s+([^\\s]+)`, 'i').exec(String(command || ''));
  return match?.[1]?.replace(/[,:]$/, '') || null;
}

function playerHistory(target, logs) {
  if (!Array.isArray(logs)) return { kicks: null, bans: null, entries: [] };
  const entries = [];
  let kicks = 0;
  let bans = 0;
  for (const item of logs) {
    const command = String(item?.Command || '').trim();
    const kickTarget = commandTarget(command, 'kick');
    const banTarget = commandTarget(command, 'ban');
    const matches = token => token && [target.id, target.username.toLowerCase(), target.player.toLowerCase()]
      .includes(String(token).toLowerCase());
    if (kickTarget && matches(kickTarget)) { kicks += 1; entries.push({ action: 'Kick', timestamp: Number(item.Timestamp) || null }); }
    else if (banTarget && matches(banTarget)) { bans += 1; entries.push({ action: 'Ban', timestamp: Number(item.Timestamp) || null }); }
  }
  return { kicks, bans, entries: entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 12) };
}

function createPlayerSnapshot(serverId, data, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!data || typeof data.Name !== 'string' || !Array.isArray(data.Players)) {
    throw new Error('The PRC response did not contain a player list. Confirm that this server key can read players.');
  }
  const joinLogs = Array.isArray(data.JoinLogs) ? data.JoinLogs : null;
  const commandLogs = Array.isArray(data.CommandLogs) ? data.CommandLogs : null;
  const players = data.Players.map(row => {
    const identity = parsePlayerId(row?.Player);
    if (!identity) return null;
    const relevantJoins = joinLogs?.filter(item => samePlayer(item, identity)).sort((a, b) => Number(b.Timestamp || 0) - Number(a.Timestamp || 0)) || [];
    const latestEvent = relevantJoins[0];
    const sessionSeconds = latestEvent?.Join === true && Number.isFinite(Number(latestEvent.Timestamp))
      ? Math.max(0, Math.floor(nowSeconds - Number(latestEvent.Timestamp))) : null;
    const history = playerHistory(identity, commandLogs);
    const loc = row.Location && typeof row.Location === 'object' ? row.Location : {};
    return {
      id: identity.id,
      username: identity.username,
      team: typeof row.Team === 'string' ? row.Team : 'Unknown',
      callsign: typeof row.Callsign === 'string' ? row.Callsign : null,
      permission: typeof row.Permission === 'string' ? row.Permission : 'Unknown',
      wantedStars: Number.isFinite(Number(row.WantedStars)) ? Number(row.WantedStars) : null,
      postalCode: typeof loc.PostalCode === 'string' ? loc.PostalCode : null,
      streetName: typeof loc.StreetName === 'string' ? loc.StreetName : null,
      sessionSeconds,
      kicks: history.kicks,
      bans: history.bans,
      history: history.entries
    };
  }).filter(Boolean).sort((a, b) => a.username.localeCompare(b.username));
  return {
    serverId,
    serverName: data.Name,
    currentPlayers: Number.isFinite(Number(data.CurrentPlayers)) ? Number(data.CurrentPlayers) : players.length,
    maxPlayers: Number.isFinite(Number(data.MaxPlayers)) ? Number(data.MaxPlayers) : 0,
    players
  };
}

module.exports = { parsePlayerId, playerHistory, createPlayerSnapshot };
