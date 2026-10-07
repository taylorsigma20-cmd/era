const test = require('node:test');
const assert = require('node:assert/strict');
const { createPlayerSnapshot, parsePlayerId } = require('../src/player-data');

const target = { Player: 'VisibleUser:123456' };
const base = {
  Name: 'Test ERLC Server',
  CurrentPlayers: 2,
  MaxPlayers: 40,
  Players: [
    { Player: target.Player, Team: 'Police', Callsign: '1A-12', Permission: 'Server Moderator', WantedStars: 0,
      Location: { PostalCode: '218', StreetName: 'Park Street' } },
    { Player: 'SecondPlayer:98765', Team: 'Civilian', Permission: 'Normal', WantedStars: 2 }
  ],
  JoinLogs: [
    { Join: true, Timestamp: 1_000, Player: target.Player },
    { Join: true, Timestamp: 1_200, Player: 'SecondPlayer:98765' }
  ],
  CommandLogs: [
    { Player: 'AdminOne:12', Timestamp: 1_300, Command: ':kick VisibleUser Fail Roleplay' },
    { Player: 'AdminTwo:13', Timestamp: 1_400, Command: ':ban 123456' },
    { Player: target.Player, Timestamp: 1_500, Command: ':warn VisibleUser note' },
    { Player: target.Player, Timestamp: 1_600, Command: ':h hi everyone' },
    { Player: 'AdminTwo:13', Timestamp: 1_700, Command: ':ban 98765' }
  ]
};

test('uses live API fields and converts a documented current join event to session time', () => {
  const snapshot = createPlayerSnapshot('server-1', base, 2_000);
  assert.equal(snapshot.serverName, 'Test ERLC Server');
  assert.equal(snapshot.currentPlayers, 2);
  const player = snapshot.players.find(item => item.id === '123456');
  assert.deepEqual({ username: player.username, team: player.team, callsign: player.callsign, permission: player.permission },
    { username: 'VisibleUser', team: 'Police', callsign: '1A-12', permission: 'Server Moderator' });
  assert.equal(player.sessionSeconds, 1_000);
  assert.equal(player.postalCode, '218');
});

test('counts only matching kick/ban commands visible in returned logs; warns and other commands are not counted', () => {
  const player = createPlayerSnapshot('server-1', base, 2_000).players.find(item => item.id === '123456');
  assert.equal(player.kicks, 1);
  assert.equal(player.bans, 1);
  assert.equal(player.history.length, 2);
  assert.equal(player.history[0].action, 'Ban');
});

test('does not invent counts or elapsed duration if optional log collections are missing', () => {
  const partial = { Name: 'Server', Players: [{ Player: 'User:77', Team: 'Civilian' }] };
  const player = createPlayerSnapshot('server-1', partial, 2_000).players[0];
  assert.equal(player.kicks, null);
  assert.equal(player.bans, null);
  assert.equal(player.sessionSeconds, null);
  assert.equal(player.wantedStars, null);
});

test('does not present a previous session as current when the newest join-log event is a leave', () => {
  const data = { ...base, JoinLogs: [
    { Join: true, Timestamp: 500, Player: target.Player },
    { Join: false, Timestamp: 1_900, Player: target.Player }
  ] };
  const player = createPlayerSnapshot('server-1', data, 2_000).players.find(item => item.id === '123456');
  assert.equal(player.sessionSeconds, null);
});

test('filters malformed player identity rather than inventing a Roblox ID', () => {
  assert.equal(parsePlayerId('NotAnId'), null);
  const snapshot = createPlayerSnapshot('server-1', { Name: 'Server', Players: [{ Player: 'InvisibleOrInvalidName' }] }, 2_000);
  assert.deepEqual(snapshot.players, []);
});

test('does not associate actions logged for another player ID', () => {
  const player = createPlayerSnapshot('server-1', { Name: 'Server', Players: [target], JoinLogs: [], CommandLogs: [
    { Player: 'Staff:1', Timestamp: 1, Command: ':kick AnotherUser' },
    { Player: 'Staff:1', Timestamp: 2, Command: ':ban 98765' }
  ] }, 2_000).players[0];
  assert.equal(player.kicks, 0);
  assert.equal(player.bans, 0);
});
