# GitHub Copilot Instructions for TechnoNexus

## Core Mission
Lead the technical development of TechnoNexus ecosystem. Build a high-performance, dark-themed digital platform combining enterprise IT consulting with indie gaming hub capabilities.

## Documentation First

**BEFORE making ANY changes**, consult these comprehensive guides:

1. [Architecture Guide](.github/docs/technonexus-architecture.md) — Project structure, tech stack, core patterns
2. [Game Generation Patterns](.github/docs/game-generation-patterns.md) — Gemini workflows, game schemas, multi-language
3. [Multiplayer Sync Guide](.github/docs/multiplayer-sync-guide.md) — PeerJS lifecycle, connection patterns, debugging

These documents encode 2 weeks of production debugging (April 5-6, 2026) and MUST inform all decisions.

## Critical Working Principles

### Code Quality & Safety
- **ALWAYS use `replace_string_in_file` for surgical edits** to existing files (prevents regressions)
- **ONLY use `create_file` for brand-new files** - NEVER to restructure existing code
- **NO TypeScript yet** - Use JavaScript (.js) across all files
- **Batch similar edits together** using `multi_replace_string_in_file` for efficiency
- **Test after every significant change** by running `npm run dev`

### Documentation Obligation
**HARD RULE**: After completing ANY feature, bug fix, or code change, AUTOMATICALLY UPDATE:
1. `docs/roadmap.md` - Check off completed items
2. Add a summary commit message describing changes
- Do NOT skip this step under any circumstances

### Multiplayer Hardened Rules (Production Debugging Insights)

**Rule 1: NexusRoomManager Component Lifecycle**
- ❌ WRONG: Conditionally render `<NexusRoomManager />` inside state conditionals
- ✅ RIGHT: Always render at component end, outside all conditionals (see [ai-forge/page.js](app/games/ai-forge/page.js#L555))
- WHY: Component unmounting breaks effect subscriptions, preventing state broadcasts to guests
- CONSEQUENCE: Guests see frozen UI when host starts game

**Rule 2: PeerJS Connection Registration**
- ❌ WRONG: Add connection to pool on `'connection'` event
- ✅ RIGHT: Add to pool ONLY after receiving guest's `'join'` message (see [NexusRoomManager.js](components/NexusRoomManager.js#L230-L280))
- WHY: Initial `'connection'` event fires before data channel opens (`connection.open === 0`)
- CONSEQUENCE: Messages sent to unopened connections silently fail (guest never receives)

**Rule 3: Atomic State Broadcasting**
- ❌ WRONG: Send `roomStatus`, `customGame`, `gameMode` in separate PeerJS messages
- ✅ RIGHT: Combine all into single atomic message (type: 'start-game')
- WHY: Messages can arrive out of order, leaving guest state inconsistent
- CONSEQUENCE: Guest sees wrong game data or stale state

**Rule 4: Connection Filtering**
- ❌ WRONG: `connections.current.forEach(conn => conn.send(message))`
- ✅ RIGHT: `connections.current.filter(c => c.open).forEach(conn => { try { conn.send(...) } catch(e) { } })`
- WHY: Closed connections and send failures need explicit handling
- CONSEQUENCE: Unhandled exceptions or silent message loss

**Rule 5: Retry Logic Disabled**
- ❌ WRONG: Implement 2-second retry loop that rebroadcasts state every 2 seconds
- ✅ RIGHT: Use two-layer effect system (MONITOR → USE) for single broadcast
- WHY: Retry loop causes `setCustomGame()` calls → re-renders → textarea clearing, player input lost
- CONSEQUENCE: Unplayable game (guest can't type answers)

### Gemini Integration Rules

- **ALWAYS use `"gemini-2.5-flash"`** (hardcoded, non-negotiable)
- **Batch evaluations**: Never make individual evaluation API calls — always batch via `/api/evaluate-batch`
- **JSON output only**: System prompt must state "Output ONLY valid JSON. No markdown. No explanations."
- **Language support**: Support English, Hindi, Hinglish via language parameter in prompts

### Visual & Branding Standards
**Theme**: Dark Mode (`#0A0A0A`) + Neon Cyan (`#00FFFF`) + Electric Violet (`#8B5CF6`)
- Use Tailwind CSS exclusively
- Favor glassmorphism + subtle neon glows
- All section headings: `font-black`, `tracking-tighter`, `uppercase`
- Use `<span className="gradient-text-cyan">NEXUS</span>` for hub names (NEXUS ARCADE, NEXUS FORGE, etc.)
- Font family: `Geist Sans` via `var(--font-geist-sans)`

### Deployment & Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19 + Tailwind CSS
- **State Management**: Zustand (games) + React hooks (components)
- **AI Engine**: HARDCODED to `gemini-2.5-flash` (NEVER change this)
- **Database**: Supabase (Auth + PostgreSQL)
- **Deployment**: Cloudflare Pages (Edge Runtime enabled)
- **Mobile**: Capacitor wrapper (iOS/Android native builds)

### Current Architecture

**Key Files**:
- `store/gameStore.js` - Zustand state (Zustand v5.0.12)
- `components/NexusRoomManager.js` - Multiplayer orchestration (PeerJS)
- `app/games/ai-forge/page.js` - Custom game engine
- `app/games/dumb-charades/page.js` - Party game
- `docs/roadmap.md` - Single source of truth for progress

**API Routes** (All working with Gemini 2.5 Flash):
- `POST /api/generate-game` - Create custom game from prompt
- `POST /api/evaluate-submission` - Score single player
- `POST /api/evaluate-batch` - Score multiple players (prevents rate-limit)
- `POST /api/evaluate-leaderboard` - Round summary + verdicts
- `POST /api/nexus-search` - Semantic search across blog/forge

**Multiplayer Architecture**:
- PeerJS for decentralized P2P networking
- Nexus-prefixed PeerJS IDs (format: `Nexus-XXXX`)
- QR code sharing for room invites
- Real-time game state broadcasting
- Full patterns documented in [Multiplayer Sync Guide](.github/docs/multiplayer-sync-guide.md)

## Common Multiplayer Workflows

### When Guests Don't See Game After Host Clicks START
1. Verify `<NexusRoomManager />` is always mounted (check end of page.js, outside all conditionals)
2. Verify effect dependencies include `[roomStatus, customGame, gameMode, isHost]`
3. Add console.log inside broadcast effect to verify it fires: `console.log('Broadcasting roomStatus:', roomStatus)`
4. Check connection pool: `console.log('Connections:', connections.current.filter(c => c.open).length)`
5. Verify guest receives message: Add listener on guest side: `conn.on('data', d => console.log('Guest received:', d))`
6. Verify guest updates state: Check if `setRoomStatus()` was called with received status

### When Textarea Clears While Guest Types
1. Check for retry loop (don't have one — remove if present)
2. Verify effect doesn't call `setCustomGame()` repeatedly
3. Look for 2-second intervals or setTimeout calls that might trigger state changes
4. Use two-layer effect pattern: Monitor state change → trigger counter increment → send broadcast once

### When Game Generation Fails
1. Verify endpoint URL is `/api/generate-game`
2. Check Gemini API key in environment variables
3. Verify system prompt contains: "Output ONLY valid JSON"
4. Test locally with curl: `curl -X POST http://localhost:3000/api/generate-game -d '{"prompt":"...","language":"English"}'`
5. Check response is valid JSON (not error HTML)

### When Scoring Doesn't Work
1. Always batch submissions via `/api/evaluate-batch`, never individual calls
2. Verify host is calling batch API, not guest
3. Check Gemini API for rate-limit errors (429 status)
4. Verify game JSON schema matches documented structure

## Debugging Checklist

When multiplayer features fail:
- [ ] NexusRoomManager is always mounted (not in conditional)
- [ ] Connection registered after 'join' message (check NexusRoomManager.js line 260)
- [ ] Connections filtered for `open: 1` before sending
- [ ] No 2-second retry loops
- [ ] State broadcast is atomic (single message with all required fields)
- [ ] Guest received message (check guest console)
- [ ] Guest parsed message correctly (check guest state update)
- [ ] Guest UI re-rendered (check guest screen)

## Known Issues to Fix (Priority Order)

### ✅ RESOLVED (April 5-6, 2026)

1. **Game Start Sync Issue** - FIXED
   - Problem: Guests didn't transition to playing screen after host started game
   - Root causes: (a) NexusRoomManager unmounting, (b) Connections registered before open, (c) Retry loop clearing textarea
   - Solutions applied: 
     - Moved NexusRoomManager outside conditionals (always mounted)
     - Connection registration moved to after 'join' message (guarantees open=true)
     - Disabled retry loop, implemented two-layer effect system
   - Status: ✅ Production validated, guests see game screen immediately after host start

2. **Textarea Clearing** - FIXED
   - Problem: Guest input cleared every 2 seconds during typing
   - Root cause: Retry broadcast effect re-sending state every 2s → setCustomGame() → re-renders → cleared input
   - Solution: Disabled retry loop, rely on redundant effect layers (MONITOR + USE) 
   - Status: ✅ Guest can now type freely without clearing

3. **Delete/Rename Buttons Hidden** - FIXED
   - Problem: Vault game management buttons invisible in dark mode
   - Root cause: `opacity-0 group-hover:opacity-100` hiding buttons until hover
   - Solution: Changed to `opacity-70 hover:opacity-100`
   - Status: ✅ Buttons always visible at muted opacity

### 🔴 CRITICAL

1. **Leaderboard Uninitialized** (`store/gameStore.js` line ~1-70)
   - `leaderboard` property never initialized in state
   - Will crash when `updateLeaderboard()` is called
   - Fix: Add `leaderboard: []` to initial state

### 🟠 HIGH
4. **PeerJS Memory Leak** - `connections.useRef([])` never fully cleaned up
5. **Supabase RLS Not Enforced** - Using default public access (security risk)
6. **Batch Evaluation Rate Limit** - No auth check on `/api/evaluate-batch`

## Workflow for Bug Fixes

When fixing issues:
1. Read the full affected file to understand context
2. Identify exact lines causing issue
3. Plan the fix with detailed explanation
4. Use `replace_string_in_file` (or batch with `multi_replace_string_in_file`)
5. Test with `npm run dev`
6. Update `docs/roadmap.md` with completion
7. Commit and push

## Project Context

- **Nexus AI Forge**: Custom game generator (Gemini 2.5 Flash based)
- **Nexus Arcade**: Interactive games (Dumb Charades, AI Forge, Team Picker, Neon Runner)
- **Nexus Forge**: Open-source GitHub project showcase
- **Nexus Insights**: Blog (3 posts covering AI/Consulting/Gaming)
- **Nexus Cook**: Separate platform (thebjp.ca) for AI Chef

## Success Metrics
- ✅ All critical bugs fixed
- ✅ Game sync working flawlessly  
- ✅ Leaderboard functional (Zustand + Supabase)
- ✅ Mobile responsive (Capacitor haptics working)
- ✅ Zero console errors
- ✅ Roadmap fully updated and accurate
