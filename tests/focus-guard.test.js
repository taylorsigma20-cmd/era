const test = require('node:test');
const assert = require('node:assert/strict');
const { isRobloxWindow, isOwnProcessWindow, updateRobloxSession } = require('../src/focus-guard');

test('detects Roblox by executable path without trusting window title', () => {
  assert.equal(isRobloxWindow({ path: 'C:\\Games\\RobloxPlayerBeta.exe', title: 'Roblox' }), true);
  assert.equal(isRobloxWindow({ path: 'C:\\Apps\\not-roblox.exe', title: 'Roblox' }), false);
});

test('does not let ERA become a Roblox session unless Roblox was foreground first', () => {
  const era = { path: 'C:\\Program Files\\ERA\\ERA.exe', application: 'ERA' };
  assert.equal(updateRobloxSession(false, era, era.path), false);
  assert.equal(updateRobloxSession(true, era, era.path), true);
});

test('ends the overlay session when another app becomes foreground', () => {
  assert.equal(updateRobloxSession(true, { path: 'C:\\Windows\\explorer.exe' }, 'C:\\Program Files\\ERA\\ERA.exe'), false);
});

test('supports Roblox app metadata when executable path is not exposed', () => {
  assert.equal(isRobloxWindow({ application: 'Roblox' }), true);
});
