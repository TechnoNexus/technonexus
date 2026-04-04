# Platform Roadmap: TechnoNexus

## Phase 1 — Foundation (✅ Completed)
- [x] Setup GitHub repository
- [x] Create project structure (Next.js 16 App Router)
- [x] Build Homepage, Navigation, and core sections (Blog, Apps, Games)
- [x] Establish "Industrial/Neon" UI (Tailwind CSS, Dark Mode)

## Phase 2 — Deployment & Core Infrastructure (✅ Completed)
- [x] Migrate routes to `.js` and configure Next.js for Cloudflare Pages adapter.
- [x] Deploy to Cloudflare Pages (`main` branch).
- [x] DNS Configuration: Connect `technonexus.ca` and `dev.technonexus.ca`.
- [x] Enable Edge Runtime and `nodejs_compat` for dynamic Markdown Blog routing.
- [x] Implement local versions of Apps (Random Generator) and Games (Dumb Charades).

## Phase 3 — The Mobile & Multiplayer Expansion (✅ Completed)
- [x] **Capacitor Mobile Wrap**: Wrapped the Next.js out/standalone build with Capacitor for native Android/iOS deployment.
- [x] **Real-Time Multiplayer**: Upgraded "Dumb Charades" to a Room-based networked game using PeerJS.
    - [x] Implement PeerJS for decentralized room state.
    - [x] Create "Host/Join" Lobby UI with QR Code sharing.
    - [x] Add dynamic player lists and host controls.
- [x] **Mobile UI/UX Polish**:
    - [x] Add native Haptic Feedback (vibrations) via Capacitor plugins.
    - [x] Add "Download on App Store / Google Play" badges to `/games`.
    - [x] Ensure tap targets are thumb-friendly for mobile players.

## Phase 4 — Content & Open Source (✅ Completed)
- [x] Finalize first 3 blog posts (Nexus Insights).
- [x] Launch "Nexus Forge" — Open source section for automation frameworks, AI agents, and GitHub repositories.
- [x] Redirect "Nexus Cook" to the standalone AI Chef platform (www.thebjp.ca).
- [x] Reorganize Homepage Ecosystem order (Arcade → Forge → Cook).
- [x] Standardize fonts and branding: All modules now use Geist Sans and consistent "Nexus" neon styling.
- [x] Synchronize Navigation Bar with Dashboard modules (Added "Forge").
- [x] Apply "Nexus Insights" font and styling fix for blog consistency.
- [x] Complete "Enterprise Consulting" Neon Makeover.
- [x] Standardize Spacing & Layout: Removed excessive padding from home page sections to align with `space-y-24` parent.
- [x] Refresh "Our Vision" section with full Nexus branding and glassmorphism.
- [x] **Brand Assets:** Created and applied the animated SVG "Nexus" logo as the primary favicon and brand identity asset.
- [x] Apply consistent Neon/Cyan styling across all Dashboard modules and Forge page.

## Phase 5 — The AI Game Forge & Future Scaling (✅ Phase 5.1 Optimization Complete)
- [x] **AI Custom Game Engine**:
    - [x] Create `app/api/generate-game` Edge API route to process Host prompts via Gemini AI.
    - [x] Integrate `@google/generative-ai` SDK and system prompt engineering for strict JSON schemas.
    - [x] Hard-rule migration to **Gemini 2.5 Flash** for high-performance game generation.
    - [x] **Multi-language Support**: Added English, Hindi, and Hinglish generation capabilities.
- [x] **Dynamic Multiplayer UI**:
    - [x] Create standalone "Nexus AI Forge" game page (`app/games/ai-forge`).
    - [x] Update PeerJS Room state to support dynamic custom game payloads.
    - [x] Build Host UI for prompt input and game generation (restricted to AI Forge page). 
    - [x] Build a universal `CustomGameArena` component that renders text inputs, timers, and instructions based on AI JSON.
    - [x] **User Persistence**: Integrated **Supabase Auth & DB** to allow users to save custom missions to their "Nexus Vault".
- [x] **AI Scoring Engine**:
    - [x] Create `app/api/evaluate-submission` endpoint for real-time player input analysis.
    - [x] **Hybrid Scoring**: Combined semantic evaluation with strict objective counting.
    - [x] **Sarcastic AI Judge**: Added funny, slightly sarcastic personality-driven feedback for every submission.

## Phase 6 — Future Scaling (✅ In Progress)
- [x] **Phase 6.1: Game Engine & Judge Optimization**:
    - [x] Humanized the AI Judge personality (conversational, funny, and natural).
    - [x] Enhanced Performance UI with 'Next' and 'Skip' logic.
    - [x] Implemented session-based scoring for performance games (Next = +1, Skip = 0).
    - [x] Integrated real-time score tallying into the AI Judge evaluation prompt.
- [x] **Nexus Forge Optimization**:
    - [x] Integrated GitHub API to pull live statistics (stars, forks) for repositories.
    - [x] Standardized project card UI with neon-cyan stats display.
- [x] **AI-Driven Site Search**: 
    - [x] Implemented "Senior Lead Engineer" semantic search modal in Navbar.
    - [x] Cross-indexes Blog and Forge repositories via Gemini 2.5.
- [x] **Multiplayer Synchronization Fix**:
    - [x] Fixed host-to-guest state synchronization for AI Forge missions loaded from the Nexus Vault.
    - [x] Integrated Room-wide "Sarcastic Verdict" for host-aggregated scoring summaries.
- [ ] **Nexus Member Profiles**: Standalone dashboard for users to view global stats and managed saved Vault content.
- [ ] **GitHub Forge Sync**: Integration of live commit history/activity for Forge projects.

## Phase 6.1 — Game Engine & Multiplayer Optimizations
- [x] **Natural AI Judge:** Refactor the `evaluate-submission` prompt. Keep the sarcastic/funny personality, but drastically simplify the vocabulary so it sounds natural, conversational, and easy for everyone to understand.
- [x] **Charades 'Skip' Feature:** In rapid-fire/charades game modes, add a "Skip" button for the current player. Skipping moves to the next word without awarding points.
- [x] **Player Nicknames:** Update registration and PeerJS lobby joining logic to require a Name/Nickname. The game should display the Nickname (or first name if missing) instead of generic IDs.
- [x] **Live Scoreboard:** Track the exact number of players in the PeerJS session and render a live, dynamic scoreboard after every single round.
- [x] **Game Modes (Team vs. Individual):** Add a toggle in the Host UI allowing the Host to assign players into Teams or set the game as a Free-For-All (Individual) before starting the mission.
- [x] **Batch AI Evaluation (Rate Limit Protection):** To prevent hitting Gemini's RPM limits, individual players must not call the evaluation API. The Host must collect all player submissions via PeerJS at the end of a round and make a single batched API call to `evaluate-submission` to score all players simultaneously.
- [x] **Multiplayer Joining Reliability:** 
    - [x] Implemented 'Nexus-' prefixing for PeerJS IDs to eliminate ID collisions on public servers.
    - [x] Enhanced QR Code to encode full Join URLs for instant mobile access.
    - [x] Added automatic room joining via URL parameters (`?join=ID`).
    - [x] Integrated connection timeouts and robust error handling for the Join flow.
    - [x] **Multi-language AI Commentary:**
    - [x] Updated all evaluation APIs (`submission`, `batch`, `leaderboard`) to detect and respect the game's chosen language (English, Hindi, Hinglish).
    - [x] Sarcastic Judge now roasts and summarizes rounds in the same language as the mission instructions.