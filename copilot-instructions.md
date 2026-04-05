# GitHub Copilot Instructions for TechnoNexus

## Core Mission
Lead the technical development of TechnoNexus ecosystem. Build a high-performance, dark-themed digital platform combining enterprise IT consulting with indie gaming hub capabilities.

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

## Known Issues to Fix (Priority Order)

### 🔴 CRITICAL
1. **Leaderboard Uninitialized** (`store/gameStore.js` line ~1-70)
   - `leaderboard` property never initialized in state
   - Will crash when `updateLeaderboard()` is called
   - Fix: Add `leaderboard: []` to initial state

### 🟠 HIGH
2. **Game Start Sync Issue** (Guest doesn't transition to playing screen)
   - Problem: When host starts game, guests stay on "Waiting..." screen
   - Root cause: Race condition between `room-status-update` and `new-custom-game` PeerJS messages
   - Solution needed: Message ordering guarantee + verification
   
3. **Vault Delete/Rename Missing** (UX issue)
   - Users can save to vault but can't manage saved games
   - Need delete button + rename functionality

### 🟡 MEDIUM
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
