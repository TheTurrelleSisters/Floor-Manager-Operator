# Floor Manager — Phase Plan
## Repo: floor_manager
## Source of truth: zip archives. GitHub is behind.

---

## Current Version: v2.0 (cache: floor-v2.0)

---

## Repo Overview
Casino floor management PWA. PIN-protected. Reads live data from Supabase across
game_history, player_registry, progressive, progressive_hits, progressive_commands,
wallet, vouchers, wallet_config, and messages tables. Full suite of floor operations.

---

## Phase History

### v1.0 — Initial Build
- Splash + PIN + username
- Dashboard: 24h stats grid, per-game quick cards, live feed
- Games tab: per-game history, expandable records, export .txt, archive & clear
- Players tab: nickname search, per-player stats, pattern frequency
- Settings tab: auto-refresh, danger zone (archive all, hard delete)
- Supabase Realtime INSERT subscription on game_history
- Presence subscription for connected player count

### v1.1 — Version String Fix
- Fixed: splash-ver and About section showed v1.0 while cache was floor-v1.1

### v1.2 — Splash Error + Retry + DOM Removal
- killSplash fixed to remove splash from DOM entirely
- splashError() added — red error + RETRY button on any connection failure

### v1.3 — SDK Cleanup Improvement
- window.supabase cleared before each retry
- window._sbScriptEl tracks script for proper cleanup on retry

### v1.4 — Legacy JWT Anon Key Fix
- sb_publishable_ broken for Realtime WebSocket — fixed

### v1.5 — Service Worker + Supabase Client Hardening
- SW fetch handler: non-GET, supabase.co, and 206 all bypass cache
- createClient() passes in-memory no-op storage (avoids Samsung/Safari ITP blocks)

### v1.6 — Presence Retry Fix
- Exponential backoff retry (2s->30s cap) for presence channel errors

### v1.7 — Presence Heartbeat (REVERTED)
- Added 60s heartbeat — caused console flood + lockup — reverted entirely

### v1.9 — Connected Players now from player_registry
- player_registry (durable DB) replaces presence-lobby for player counts
- "Connected" = last_seen within 3 min; polled every 5s

### v1.10 — Friendly game-name update + TSBIGMUNNY
- GAMES map updated: Stray Pups $1/$5, The Turrelle Sisters Big Munny added
- Maxine's Wild Cherries + Poke-Her added to GAMES map

### v1.11 — EMERGENCY: Cache Version Mismatch Fix
- CACHE_VER was floor-v1.9 while splash showed v1.10 — stale cache served

### v1.12 — Icons + PIN Hash Fix
- icons/ folder added (all 8 sizes copied from Progressive Operator)
- FLOOR_PIN_HASH corrected for PIN 7777

---

## v2.0 — Major Feature Release: Wallet, Progressive, Messages (2026-06-23)

### Summary
Full UI redesign. Tab bar rebuilt as 7-tab icon-only single row. Three new
feature tabs added. All existing tabs preserved and updated.

### New Tab Structure (icons only, single row)
| Icon | Tab        | Description                                         |
|------|------------|-----------------------------------------------------|
| 📊   | Dashboard  | 24h stats + per-game cards + live feed (unchanged)  |
| 🎮   | Games      | Per-game history, export, archive (unchanged)       |
| 👤   | Players    | Nickname search + per-player stats (unchanged)      |
| 💰   | Wallet     | Player wallet + voucher viewer (NEW, read-only)     |
| 🎯   | Progressive| Jackpot pot + hits + command history (NEW, read-only)|
| 📨   | Messages   | Operator inbox + compose + delete (NEW)             |
| ⚙️   | Settings   | Auto-refresh + connection + danger zone (updated)   |

### Wallet Tab (NEW — read-only)
- Platform wallet_config max_voucher_default displayed at top
- Nickname search input (400ms debounced) — fetches wallet + vouchers
- Balance display card with custom max_voucher if set
- Wallet detail row: nickname, balance, max voucher, last updated
- Available vouchers list: amount, source_game, created_at
- Redeemed vouchers list: amount, source_game, redeemed_at
- Polls every 15s while on wallet tab with active search
- NO write operations — view only

### Progressive Tab (NEW — read-only)
- Live jackpot pot value with glow display
- Armed/Ready badge (reads progressive.armed column — added in db_cleanup.sql)
- Config panel: seed, ceiling, contrib_rate, trigger_odds, hit_count, updated_at
  NOTE: "Read-only — edit in Prog. Operator" label shown
- Recent jackpot hits (last 30 days, last 20): amount, player, game, pattern, balls, datetime
- Command history (last 50): command, status badge, created_by, armed_at, winner info
- Polled every 10s
- Realtime subscription on:
  - progressive UPDATE → live pot + armed state refresh
  - progressive_hits INSERT → new hit prepended instantly
  - progressive_commands INSERT/UPDATE → command list updated instantly

### Messages Tab (NEW — read + write)
- Reads new public.messages table (subject/type/icon/dismissed_by schema)
- broadcast_messages table is DROPPED per db_cleanup.sql Section 5 — not referenced here
- Compose button → inline compose panel with:
  - Type selector: general / jackpot / event / bonus (with color-coded active states)
  - Subject input (max 120 chars)
  - Body textarea
  - Send → INSERT into messages
- Message board: all messages sorted newest-first
  - Subject, type badge with icon, body, created_by, created_at, dismiss count
  - Delete button per message → hard DELETE (removes for all players)
- Unread badge on tab icon — increments on realtime INSERT from other senders
  cleared when Messages tab is opened
- Realtime subscription on messages INSERT + DELETE

### Dashboard Enhancement
- Progressive pot quick-stat bar added below 24h stats grid
  (shows live pot value + ARMED badge if armed)

### Settings Updates
- Connection panel redesigned as data-card with info rows
- Cache version (floor-v2.0) displayed
- About section redesigned as data-card

### New Realtime Channels
- floor-progressive: progressive UPDATE, progressive_hits INSERT,
  progressive_commands INSERT + UPDATE
- floor-messages: messages INSERT + DELETE
- All channels use same reconnect pattern (3s retry on error/timeout/close)

### New State Variables
```
_walletSearch, _walletData, _walletVouchers, _walletConfig, _walletPollTimer
_progRow, _progHits, _progCmds, _progPollTimer, _progCh
_messages, _msgUnread, _msgComposing, _msgDraftType, _msgDraftSubject, _msgDraftBody, _msgCh
```

### Schema dependencies (must be live before v2.0 deploys)
- progressive.armed boolean column (db_cleanup.sql Section 3)
- broadcast_messages DROPPED (db_cleanup.sql Section 5)
- public.messages new schema (messages_restructure.sql)
- wallet, vouchers, wallet_config tables (Phase 1b SQL — already live)

### Cache bust: floor-v2.0

---

## Pending / Known Open Issues
- [ ] First live test of Wallet tab with real player nicknames
- [ ] Progressive tab: verify armed badge reflects actual progressive.armed state
- [ ] Messages tab: verify realtime INSERT fires on compose from Floor Manager
- [ ] Confirm dismiss_count display renders correctly (jsonb array length)
- [ ] Export .txt still needs live mobile test
- [ ] "0 players with active games" root cause still OPEN (player_registry last_seen lag)

---

## Permanent Rules
- ES5 only — no Object.assign, no optional chaining, no arrow functions in logic
- All logic inline in index.html (single file)
- Cache bust (CACHE_VER in service-worker.js + splash-ver + About section) on EVERY build
- Never modify splash_screen.jpg or any uploaded asset with code
- Follow PHASE_PLAN before any change
- Ask clarifying questions before applying any change or fix
