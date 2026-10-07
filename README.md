# ERA for Windows

ERA is an English-language ER:LC server staff tool, a fixed iPhone-style overlay and a non-invasive **game-over-player overlay**. The Windows NSIS installer is `ERA-Setup-0.8.0.exe`.

## Open the player overlay over Roblox

1. Run ERA and add your ER:LC private-server API key under **Add Server**.
2. Select the server you are playing on.
3. Focus Roblox and press **F3**. ERA opens an always-on-top, translucent window over the game without taking away game focus.
4. Choose a player from the live roster. Their API-provided profile appears in the card beside the roster.
5. Press **F3** again or click **×** to hide the overlay. Use **↻** to refresh the current roster. **Open Staff Tools** switches to the full ERA dashboard.

The phone **starts hidden** when ERA opens. Press **F1** to show or hide it. The phone shell includes an iPhone-style Dynamic Island and bottom home indicator. **F2** opens the full server dashboard. The F1 behavior is independent of the F3 game-player overlay. If F3 does not appear in your particular full-screen configuration, switch Roblox to windowed/borderless mode and try again.

**Important limitation:** This is a companion desktop window placed above the game. It cannot detect that you clicked an avatar inside Roblox and does not alter or inject code into Roblox/ER:LC. To view a profile, select the player from ERA's live roster. Only ER:LC's developers can add a genuine click-the-character profile to the game itself. The overlay intentionally uses no process injection, game-memory reading, packet interception, or anti-cheat bypass.

## Live data, notes and commands

Add the server API key for your own private server. The key is encrypted for the current Windows user, used locally and never sent to an ERA-hosted service. Keep it private—PRC warns that a server key grants access to server data and commands. PRC's Remote Server Management permissions and server configuration decide whether a command can run.

Select **View Players** to retrieve the current live roster from PRC. The profile displays API-provided username/ID, team, permission, callsign, wanted stars and location when present. No automatic polling is done. The API does not provide lifetime playtime, a reliable warning count or complete moderation history. Logged kicks/bans are only matching commands in the logs returned for that request, not lifetime totals. Session time is shown only when the newest matching join-log event indicates a join. Staff notes are stored only on this computer.

PM, kick, ban, wanted and unwanted are real server actions. ERA verifies that the selected player still appears in a current server snapshot, limits command frequency, presents an in-app message/reason entry where needed, and then requests native confirmation. Verify the action before confirming; a confirmed action may take effect immediately. PRC permits occasional PMs but prohibits using PM to replace Roblox chat, the in-game phone or radio.

This is a personal/local client, not a registered public PRC application. Do not distribute a server key you are not authorized to share. Public distribution across multiple servers would require PRC public-app review/registration and its additional requirements.

## Windows identity, updates and antivirus

ERA keeps the historic Electron app ID and user-data location so updates preserve existing encrypted server profiles and notes. Starting with **0.8.0**, ERA checks public GitHub Releases when it opens. When an update is available, choose **Update now** to download it inside the app, then restart ERA to install it; choose **Skip this version** to hide that version's prompt, or **Not now** to defer it until the next launch. The updater uses GitHub Releases and does not require a separate paid host or an account/token on users' computers.

Users already on **0.7.0 or earlier must install 0.8.0 once manually**. Older versions do not contain the updater. After that first upgrade, later releases can be downloaded and installed from ERA. Close the old app before running the first installer; do not uninstall it, so existing user data is preserved.

To publish a later release, update the version in `package.json` and `package-lock.json`, commit the change, then push a version tag such as `v0.8.1`. GitHub Actions builds the unsigned Windows NSIS installer and publishes its update metadata and installer to the public Releases page. The automated build needs no paid hosting. Keep the repository under the same owner/name because installed apps read update information from `taylorsigma20-cmd/era`.

The Windows app is unsigned because no publisher signing certificate was provided. Avast may warn about the new installer. Code cannot safely hide that warning or guarantee that an antivirus engine removes it. Do not disable protection to run a file. If Avast flags this build incorrectly, submit the file to [Avast for false-positive review](https://www.avast.com/en-us/submit-a-sample). Signing with a trusted publisher certificate can help establish publisher reputation, but cannot guarantee that warnings disappear.

## Development

Node.js 22+ is recommended.

```powershell
npm.cmd install
npm.cmd start
npm.cmd test
npm.cmd run build:win
```

Installer filename: `ERA-Setup-<version>.exe`.
