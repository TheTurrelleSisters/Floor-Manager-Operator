# Floor Manager — Phase Plan
## Repo: floor_manager
## Source of truth: zip archives. GitHub is behind.

---

## Current Version: v1.10 (cache: floor-v1.10)

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

### v1.9 — Bug Fixes (4 bugs)
**Per-game player count in dashboard didn't filter operator sessions:**
- The game-card badge loop (`gPlayers`) checked `p.gameId === gid` with no
  operator exclusion. If the progressive_operator, wabc_operator, or
  floor_manager was on the same Supabase presence channel, they would be
  counted as players on whichever game matched their `gameId`. Added the
  same `operator / wabc_operator / floor_operator` exclusion guard used
  everywhere else in the codebase.

**`archiveAll()` and `hardDeleteArchived()` didn't re-render after success:**
- Both danger-zone functions showed a toast on success but left the current
  tab showing the now-archived/deleted records. Added `_history = []` and
  `renderTab()` to both success paths so the view updates immediately.

**`onPlayerSearch()` re-fetched from the DB on every keystroke:**
- The search input fired `fetchAllHistory()` (a full Supabase round-trip)
  on every character typed. Changed to use the `tab-content` el reference
  consistently, keeping the DB fetch but scoping the DOM query correctly.
  (A true fix would filter from an in-memory cache; flagged for future work.)

**Three stale version strings:**
- JS comment block header still showed `FLOOR MANAGER v1.1`
- Settings → About section showed `Floor Manager v1.4`
- Both updated to `v1.9` to match splash and service worker.

Cache bust: floor-v1.9

### v1.10 — CRITICAL: Presence State Never Populated on Subscribe (same root cause as prog-op v3.21)
Same bug as Progressive Operator: `_presenceState` was never being rebuilt
from the live channel after a cold-start. The `sync` event fires reliably
when players join *after* the floor manager is already watching, but if the
Realtime tenant was cold-starting when the floor manager subscribed, the
event was delayed or silent — leaving `_presenceState = {}` and Active
Players showing 0.

**Fixes:**
- Added a second `setTimeout(_sync, 2000)` pass in the SUBSCRIBED callback
  alongside the existing 500ms pass, covering the free-tier window where
  channel hydration takes up to ~2 seconds.
- `_startAutoRefresh()` now rebuilds `_presenceState` directly from
  `_presenceCh.presenceState()` on every tick before re-rendering, so the
  dashboard player count is never stale between presence events regardless
  of the auto-refresh interval.

Cache bust: floor-v1.10

---

## Current Version: v1.10 (cache: floor-v1.10)

## Pending
- [ ] Active Players count verified with game clients connected
- [ ] First live test with game clients writing to game_history
- [ ] Player tab verified with real nicknames
- [ ] Export .txt download tested on mobile
- [ ] Archive & Clear tested end-to-end
- [ ] `fetchProgressiveHits()` is defined but never called — integrate into dashboard JP hits or remove
- [ ] `onPlayerSearch` DB-per-keystroke pattern — consider caching full history and filtering in memory
