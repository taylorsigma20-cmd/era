function normalizedExecutable(value) {
  return String(value || '').split(/[\\/]/).pop().toLowerCase();
}

function isRobloxWindow(info) {
  return normalizedExecutable(info?.path) === 'robloxplayerbeta.exe'
    || String(info?.application || '').trim().toLowerCase() === 'roblox';
}

function isOwnProcessWindow(info, executablePath) {
  const active = String(info?.path || '').toLowerCase();
  const expected = String(executablePath || '').toLowerCase();
  return Boolean(active && expected && active === expected);
}

function updateRobloxSession(previousSession, info, executablePath) {
  if (isRobloxWindow(info)) return true;
  if (previousSession && isOwnProcessWindow(info, executablePath)) return true;
  return false;
}

module.exports = { isRobloxWindow, isOwnProcessWindow, updateRobloxSession };
