# ERA for Windows

ERA is an English-language ER:LC staff companion with an iPhone-inspired phone, a staff dashboard and a transparent live player overlay. The phone has an iPhone-style home screen, app dock, first-use profile setup and grouped Settings pages. The current local development version is **0.10.8**; its Windows NSIS installer is built as `ERA-Setup-0.10.8.exe`.

## Phone and Roblox-only overlay

The phone starts hidden and **F1** toggles it while Roblox is the active foreground app. The phone and the F3 player overlay hide when focus leaves Roblox/ERA. The foreground check uses the Windows active-window process path; the app does not inject into the game, read game memory, or bypass anti-cheat.

On first use, choose English or Estonian and create a local phone profile. ERA then opens Twitter so you can create your community username before using ERA-to-ERA messages. Your display name, theme choice, notes, contacts and local drafts stay on this computer. The Roblox ID is used to compare your live account with the PRC `Permission` field. F2 opens the staff dashboard. **Server Administrators and the Server Owner** can open F3 and view the live CAD roster and player cards. Other roles are denied by the main process.

## Working local apps

- **Notes** and contacts are stored locally.
- **Clock** shows local time and includes alarms, a stopwatch with split laps and a countdown timer. Alarms run while ERA is open.
- **Postimees** loads live headlines from its public RSS feed; selecting a headline opens the article on the Postimees website.
- **Photos** and **Camera** capture Roblox windows only after the user chooses the window and presses the shutter. Images and favorites are stored locally.
- **Twitter** has a shared Supabase-backed feed with profiles, posts, photos, comments, likes, reposts and live updates.
- **Messages** supports private one-to-one conversations between ERA community users. Each conversation is visible only to its two participants.
- **Gmail** opens Gmail in the default browser. ERA can prepare a recipient, subject and body, then opens the draft for the user to review and send; ERA never reads or stores inbox messages.
- **Marketplace** and **Dark Web** provide fictional roleplay listing screens. Listings are local drafts only and are not published to a community service.
- **Threads** saves local drafts only. No posts are sent to other players or published.
- **Wallpapers** include built-in themes and an optional local image (under 3 MB).
- **Settings** use grouped iPhone-style pages for General, Display & Brightness, ERA Overlay, Privacy & Security and Keyboard Shortcuts. Language, theme, wallpaper, opacity and the F1 start screen are configurable.

The phone no longer includes an ERA server-management app or FOX News. F2 remains a separate staff dashboard. The phone frame and app navigation follow the custom phone shown in the video reference; community features require the shared service below.

## ERA community setup

Enable **Anonymous Sign-Ins** in Supabase, then run `supabase/schema.sql` in the project's SQL Editor. This enables shared Twitter posts and private ERA messages with row-level security. See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for setup details. Anonymous community profiles are tied to one ERA installation and cannot be recovered on another computer. Gmail is handled by the user's browser and Google account; ERA does not need Gmail credentials.

## Features requiring a shared service

The official [PRC API](https://apidocs.erlc.gg/) provides ER:LC player/server data and moderation commands. Its documented player endpoint does **not** assign personal phone numbers or expose a phone-call/SMS carrier service or bank balance. Calls, carrier SMS, globally unique numbers and real ERABank balances therefore stay disconnected instead of showing fabricated accounts/data. ERA Messages is an internet chat between ERA profiles, not carrier SMS. ERABank explicitly reports that no balance is available until a legitimate economy source is connected.

PRC documents **Emergency Calls** as an event-webhook type. Delivering those alerts to the right in-game team requires a reachable HTTPS receiver that verifies PRC Ed25519 signatures plus team-routing rules. A desktop-only app cannot receive those webhooks while it is closed, and no receiver/hosting account is configured. There is no paid hosting enabled.

## Server roles and data

Add your own private-server API key in the F2 dashboard. It is encrypted for the current Windows user, used locally and never sent to an ERA-hosted service. Do not share keys you are not authorized to use.

Player permission checks compare the Roblox ID entered in the phone profile with live PRC player data. PRC returns permissions such as `Server Administrator` and `Server Owner`; **Server Administrator and Server Owner** are allowed. A user must be present in the selected live server for the check to succeed. This is a local convenience gate, not independently verified Roblox identity or strong authentication; it does not protect a distributed API key from a computer owner. PRC rate limits are respected and the app does not poll aggressively.

The API provides username/ID, team, permission, callsign, wanted stars and location when present. No lifetime playtime, complete warning count, complete moderation history, phone service or bank balance is fabricated. Logged kicks/bans are only matching commands visible in the returned logs. Staff notes and profile data stay on this computer.

## Windows updates and antivirus

ERA 0.8.0 was the first in-app-updater release. Users on 0.7.0 or earlier must install 0.8.0 once manually. After the updater is in place, ERA checks for stable Windows releases at startup and offers **Update now** or **Later**. Downloads start only after choosing **Update now**; a downloaded update installs the next time ERA closes, or users can choose **Restart and update** in the dashboard.

To publish a future release, update the version in `package.json` and `package-lock.json`, commit the change, and push a version tag such as `v0.9.0`. GitHub Actions builds the unsigned Windows NSIS installer and publishes its update metadata. The updater feed is on the public [ERA GitHub repository](https://github.com/taylorsigma20-cmd/era); no paid hosting is required.

The installer is unsigned because no publisher signing certificate was provided. Avast may warn about it; do not disable antivirus protection to run a file. A false-positive report can be sent to [Avast sample submission](https://www.avast.com/en-us/submit-a-sample). Signing with a trusted publisher certificate may help publisher reputation but cannot guarantee that warnings disappear.

## Development

Node.js 22+ is recommended.

```powershell
npm.cmd install
npm.cmd start
npm.cmd test
npm.cmd run build:win
```
