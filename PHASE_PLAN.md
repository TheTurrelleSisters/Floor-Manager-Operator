# Floor Manager — Phase Plan
## Repo: floor_manager
## Source of truth: zip archives. GitHub is behind.

---

## Current Version: v1.1 (cache: floor-v1.1)

---

## Repo Overview
Casino floor management PWA. PIN-protected. Reads game_history table via Supabase Realtime. Shows live activity across all StrayPups games, per-player stats, export, and archive controls.

---

## Phase History

### v1.0 — Initial Build (version string bug — never deployed)
- Splash + PIN + username
- Dashboard: 24h stats grid, per-game quick cards, live feed
- Games tab: per-game history, expandable records, export .txt, archive & clear
- Players tab: nickname search, per-player stats, pattern frequency
- Settings tab: auto-refresh, danger zone (archive all, hard delete)
- Supabase Realtime INSERT subscription on game_history
- Presence subscription for connected player count

### v1.1 — Version String Fix
- Fixed: splash-ver and About section showed v1.0 while cache was floor-v1.1
- All version strings now consistent: v1.1 / floor-v1.1
- Cache bust: floor-v1.1

---

## Dependencies
- game_history table must exist (SETUP_game_history.sql)
- StrayPups games v5.45+ required for game_history writes
- icons/ folder must be copied from progressive_operator repo

---

## Pending
- [ ] First live test with game clients writing to game_history
- [ ] Player tab verified with real nicknames
- [ ] Export .txt download tested on mobile
- [ ] Archive & Clear tested
- [ ] Answer open questions: A) anon key read security B) progressive_hits integration C) 24h cleanup schedule

---

## Rules
- ES5 only
- All logic inline in index.html
- Cache bust on every single build

### v1.2 — Splash Error + Retry + DOM Removal
- killSplash fixed to remove splash from DOM entirely
- splashError() added — red error + RETRY button on any connection failure
- All setTimeout retry loops replaced with splashError()
- SDK cleanup added before each retry
- Cache bust: floor-v1.2

### v1.3 — SDK Cleanup Improvement
- window.supabase cleared before each retry
- window._sbScriptEl tracks script for proper cleanup on retry
- Cache bust: floor-v1.3

---

## Current Version: v1.3 (cache: floor-v1.3)

## Pending
- [ ] First live test with games writing to game_history
- [ ] Player tab verified with real nicknames
- [ ] Export .txt download tested on mobile
- [ ] Neon.tech migration — Realtime replacement needed

### v1.4 — CRITICAL: Legacy JWT Anon Key Fix
- Same fix — sb_publishable_ broken for Realtime WebSocket
- Cache bust: floor-v1.4

### Service Worker + Supabase Client Hardening (this batch)
- service-worker.js fetch handler rewritten with proper guards:
  - Non-GET requests (POST/PATCH/PUT/DELETE) are no longer intercepted at
    all -> eliminates "cache.put: Request method X is unsupported" errors
    on every Supabase RPC/insert/update.
  - ANY supabase.co request is passed straight to network, never cached ->
    eliminates risk of stale cached API responses masking live DB changes,
    and removes these requests from the JS/HTML cache-refresh branch.
  - 206 Partial Content responses (audio/video range requests) are no
    longer passed to cache.put -> eliminates "Partial response (206)
    unsupported" errors.
- createClient() calls now pass { auth: { persistSession:false,
  detectSessionInUrl:false, storage: <in-memory no-op> } } — avoids
  Supabase client touching localStorage at all, which browsers with
  Tracking Prevention (Safari ITP, Samsung Browser) were silently
  blocking ("Tracking Prevention blocked access to storage for
  ...supabase-js...") and which also triggered "Multiple GoTrueClient
  instances" warnings.
These changes target the console error noise seen across every tool in
this session's logs and may also help Realtime stability (all channels
share one client/connection). 0-players root cause still unconfirmed —
retest after this deploy with game + operator tool open simultaneously.

KNOWN OPEN ISSUE (not yet investigated): both StrayPups games appear to be
broadcasting DIFFERENT ball-call sequences again (regression) — possible
WABC/local-vs-wide-area switching issue. To be investigated next session.


### v1.6 — Presence Retry Fix
Same one-shot-subscribe presence bug as games/Progressive Operator — fixed
with exponential backoff retry (2s->30s cap).
Cache bust: floor-v1.6

### v1.7 — Presence Heartbeat (zombie-channel fix)
Same hypothesis as the games: a zombie presence channel
(silent socket reconnect with no CHANNEL_ERROR/CLOSED) could leave this
tool unable to see other presences with no visible error. Added a 60s
heartbeat: fully removeChannel + recreate the presence channel on a fixed
interval.
Cache bust: floor-v1.7

### REVERT — Presence Heartbeat removed (caused console flood + lockup)
v3.18/v1.16/v1.7's 60s heartbeat caused console flooding and a system
lockup, most likely from racing with the existing error-retry logic and/or
hitting free-tier Realtime rate limits via frequent channel churn.
REVERTED ENTIRELY — back to one-shot subscribe + error-triggered retry.
"0 players with active games" remains OPEN.
Cache bust: see service-worker.js

### v1.9 — Connected Players now from player_registry
Connected/Inactive counts and player lists now read from
player_registry (durable DB table) instead of presence-lobby (ephemeral
Realtime state, unreliable all session). "Connected" = last_seen within
3 minutes; "Inactive" (no spin in 60s+) = last_seen 60s-3min ago. Polled
every 5s. Requires the NEW touch_player_last_seen SQL RPC (see games
PHASE_PLAN v5.84) and game build v5.84+ to keep last_seen fresh for
nickname-less players too.
Cache bust: floor-v1.9


### v1.10 — Friendly game-name update + TSBIGMUNNY now visible
- GAMES map: 'StrayPups Big Munny $1'/'$5' -> 'Stray Pups Big Munny
  $1'/'$5'; NEW entry 'turrelle': 'The Turrelle Sisters Big Munny'
  (color #aa66ff). Companion rename in both bingo games (v5.87),
  progressive_operator (v3.21), and tsbigmunny (v8.2.2).
- tsbigmunny (game_id 'turrelle') previously called register_player but
  NEVER updated player_registry.last_seen (no touch_player_last_seen) and
  registerPlayer was never even called from its game.js -- so it never
  appeared in player_registry at all. Fixed in tsbigmunny v8.2.2 (see
  tsbigmunny/PHASE_PLAN.md); fetchPlayerRegistry()/_connectedPlayers()
  here are unfiltered by game_id, so tsbigmunny players are now correctly
  included in Connected/Inactive counts with no changes needed on this
  side beyond the GAMES map entry above (for per-game name display).
- Fixed stale "About" section: version string was hardcoded at v1.4
  (several releases behind), and the games list was missing $5 naming
  update + TSBIGMUNNY entirely. Now reads v1.10 and lists all 3 games.
- Cache bust: floor-v1.10.


### v1.11 — EMERGENCY: Cache Version Mismatch Fix

**ROOT CAUSE:** CACHE_VER was `floor-v1.9` while splash displayed `v1.10`.
Browser served stale cache — v1.10 content was never installed.

**Fix:** CACHE_VER bumped to `floor-v1.11`, splash updated to `v1.11`.

- Cache bust: floor-v1.11


### v1.12 — Icons Missing + PIN Hash Wrong

**ROOT CAUSE 1 — Icons:** `icons/` folder was never included in the Floor Manager
repo. The manifest referenced `icons/icon-*.png` but the folder didn't exist,
causing 404 errors in the browser console and PWA install failures.
**Fix:** Copied `icons/` folder from Progressive Operator (all 8 sizes).

**ROOT CAUSE 2 — PIN:** `FLOOR_PIN_HASH` stored value (`...3891`) did not match
the output of `_hashPin('7777')` (`...2605`). The hash was set incorrectly at
some point — `7777` was never a valid PIN for this tool.
**Fix:** Replaced with the correct computed hash for `7777`.
PIN `7777` now works.

- Cache bust: floor-v1.12
