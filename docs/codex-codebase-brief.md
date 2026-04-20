# Codex Codebase Brief — TechnoNexus

Last reviewed by Codex: April 20, 2026

This document captures Codex's working understanding of the TechnoNexus codebase after reading the repo instructions, production docs, roadmap, and core source files. It is not meant to replace `AGENTS.md`; it is a practical handoff note for future Codex sessions and other agents.

## Project Identity

TechnoNexus is a Next.js 16.2.1 and React 19 platform that combines:

- AI-generated party games.
- PeerJS room-based multiplayer.
- Supabase authentication and saved-game vaults.
- Enterprise IT consulting and open-source showcase content.
- A separate native mobile direction under SwiftUI and Jetpack Compose.

The web app uses JavaScript only, Tailwind CSS only, Zustand for game state, Gemini 2.5 Flash for AI generation/evaluation, and Cloudflare Pages with Edge Runtime for deployment.

## Authoritative Docs

Read these before code changes:

- `.github/docs/technonexus-architecture.md`
- `.github/docs/multiplayer-sync-guide.md`
- `.github/docs/game-generation-patterns.md`
- `docs/roadmap.md`
- `AGENTS.md`

Older docs such as `docs/architecture.md`, `docs/repo-structure.md`, and `TECHNICAL_ANALYSIS.md` are useful history, but may be stale. Always verify against current source.

## Core Files

- `package.json` — confirms current dependencies and scripts.
- `next.config.mjs` — Cloudflare image config, optional mobile export flag.
- `app/layout.js` — global layout, Geist fonts, Navbar, BottomTabNav, Footer.
- `app/globals.css` — dark/neon visual system and legacy native override classes.
- `store/gameStore.js` — Zustand room, game, scoring, leaderboard, and session state.
- `components/NexusRoomManager.js` — PeerJS orchestration, room creation/joining, AI Forge controls, score collection, batch evaluation.
- `lib/api.js` — web-first API/share URL helpers.
- `lib/supabase.js` — Supabase client.

## Current Web Routes

Main platform:

- `/` — homepage.
- `/forge` — Nexus Forge open-source showcase.
- `/apps` — apps hub.
- `/blog` and `/blog/[slug]` — markdown blog.
- `/leaderboard` — local leaderboard/Hall of Fame.

Apps:

- `/apps/random-generator`
- `/apps/dev-utility`

Games:

- `/games/ai-forge`
- `/games/npatm`
- `/games/nexus-blitz`
- `/games/dumb-charades`
- `/games/team-picker`

`Neon Runner` is listed as in development from the games hub.

Current multiplayer status:

- AI Forge uses `NexusRoomManager` for room orchestration, AI generation, batch scoring, and result broadcast.
- NPATM uses the shared room manager, `customGame` payloads, host-collected submissions, batch scoring, and session leaderboard updates.
- Dumb Charades now syncs host-controlled word, timer, category, turn, and team score through `customGame` using `nexus-game-action`; guests see live state but not the secret title.
- Nexus Blitz now supports room-aware shared quiz generation and shared room results; each player still answers locally, then reports their objective score back into the shared room payload.
- Team Picker remains local-only.

## Visual Identity Rules

Preserve the established Nexus aesthetic:

- Background: `#0A0A0A`
- Primary accent: neon cyan `#00FFFF`
- Secondary accent: electric violet `#8B5CF6`
- Use Tailwind classes, not CSS-in-JS or inline style workarounds.
- Keep `glass-panel`, neon borders/glows, uppercase heavy headings, and Geist Sans.
- Hub names should keep the established gradient `NEXUS` pattern.
- Do not introduce new theme variables unless explicitly requested.

## AI Rules

Gemini model usage is production-sensitive:

- Always use `gemini-2.5-flash`.
- Do not upgrade, rename, or abstract the model without explicit permission.
- API responses should be valid JSON.
- Prompts that expect structured output should end with clear JSON-only instructions.
- Multiplayer scoring should use `/api/evaluate-batch`; do not add per-player Gemini calls in multiplayer flows.

Important AI routes:

- `app/api/generate-game/route.js`
- `app/api/evaluate-batch/route.js`
- `app/api/evaluate-submission/route.js`
- `app/api/evaluate-leaderboard/route.js`
- `app/api/generate-trivia/route.js`
- `app/api/nexus-search/route.js`

## Multiplayer Rules

`components/NexusRoomManager.js` is the most fragile web file. Treat it carefully.

Must preserve:

- `NexusRoomManager` must stay mounted at the bottom of `app/games/ai-forge/page.js`, outside conditionals.
- PeerJS guest connections should be added to `connections.current` only after the host receives the guest's `join` message.
- Game start sync must be atomic: one `start-game` message should contain `status`, `customGame`, and `gameMode`.
- Always filter open connections before sending:

```javascript
connections.current.filter(c => c.open).forEach(conn => {
  try { conn.send(data); } catch (e) {}
});
```

- Avoid retry loops that call Zustand setters repeatedly; those caused guest input clearing in production.
- Host is the source of truth. Guests receive state; they should not broadcast global room state.

Current note: the `playing` path uses atomic `start-game` messages. The non-playing path still sends some separate messages (`room-status-update`, `new-custom-game`, `mode-update`). Do not refactor this casually; follow the sync guide if changing it.

## Zustand State

`store/gameStore.js` owns:

- Room identity: `roomId`, `isHost`, `players`, `hostName`, `playerName`.
- Room status: `idle`, `waiting`, `playing`, `finished`.
- Game payload: `customGame`, `gameMode`.
- Evaluation state: `localEvaluation`, `roomScores`, `roundVerdict`.
- Persistent local leaderboard: `leaderboard`.
- Per-room cumulative scoring: `sessionLeaderboard`.

Only `leaderboard` is currently persisted to localStorage via `zustand/persist`.

## Supabase Status

Supabase client configuration lives in `lib/supabase.js`.

Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`

The docs say only `user_games` is confirmed active. Planned or schema-defined tables include:

- `user_profiles`
- `leaderboard`
- `game_sessions`

Security note: `docs/SECURITY.md` says RLS for `user_games` may not yet be applied in Supabase. That cannot be confirmed from source code alone.

Leaderboard status:

- `store/gameStore.js` still keeps a local fallback leaderboard in Zustand/localStorage.
- `lib/leaderboard.js` attempts to read and write the Supabase `leaderboard` table and `record_win` RPC when available.
- `app/leaderboard/page.js` prefers Supabase global leaderboard rows and falls back to local Zustand rows.
- `sessionLeaderboard` remains the per-room score table for active game sessions.

## Mobile Status

There is an important documentation mismatch:

- `AGENTS.md` still describes a Capacitor mobile architecture.
- Current `package.json` has no Capacitor dependencies or mobile scripts.
- `lib/haptics.js`, `lib/capacitor-storage.js`, and `lib/native-hardware.js` are web-compatible mocks.
- `docs/roadmap.md` says Phase 9 deprecated Capacitor and started true native clients.
- Native projects exist under:
  - `apps/native-ios`
  - `apps/native-android`

Working assumption: the web app is now web-first with compatibility mocks, while true native work lives in the native app folders. Confirm with the user before making mobile architecture changes.

## Development Rules For Codex

- Read the relevant docs and target file before editing.
- Use surgical edits.
- Do not add TypeScript files.
- Do not change the Gemini model.
- Do not casually touch multiplayer code.
- Update `docs/roadmap.md` after code changes.
- Test the golden path when feasible.
- Preserve user or other-agent changes in the working tree.
- Prefer current source over stale docs when they conflict, but call out the conflict.

## Known Stale Or Conflicting Notes

- `TECHNICAL_ANALYSIS.md` says `leaderboard` was uninitialized, but `store/gameStore.js` currently includes `leaderboard: []`.
- `TECHNICAL_ANALYSIS.md` says apps and Team Picker were incomplete, but current route files exist.
- Capacitor documentation conflicts with the current dependency graph and Phase 9 roadmap.
- `docs/architecture.md` and `docs/repo-structure.md` are older lightweight docs and do not reflect the full current app.

## Good First Checks Before Future Work

1. Inspect `git status`.
2. Read the exact file being changed.
3. If touching AI Forge or PeerJS, re-read `.github/docs/multiplayer-sync-guide.md`.
4. If touching Gemini prompts or schemas, re-read `.github/docs/game-generation-patterns.md`.
5. If touching roadmap-level features, update `docs/roadmap.md`.
6. Run `npm run lint` or the smallest practical verification command.
