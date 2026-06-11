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
