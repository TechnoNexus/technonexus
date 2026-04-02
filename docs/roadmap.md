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

## Phase 5 — The AI Game Forge & Future Scaling (🚧 In Progress)
- [x] **AI Custom Game Engine**:
    - [x] Create `app/api/generate-game` Edge API route to process Host prompts via Gemini AI.
    - [x] Integrate `@google/generative-ai` SDK and system prompt engineering for strict JSON schemas.
    - [x] Hard-rule migration to **Gemini 2.5 Flash** for high-performance game generation.
- [x] **Dynamic Multiplayer UI**:
    - [x] Create standalone "Nexus AI Forge" game page (`app/games/ai-forge`).
    - [x] Update PeerJS Room state to support dynamic custom game payloads.
    - [x] Build Host UI for prompt input and game generation (restricted to AI Forge page). 
    - [x] Build a universal `CustomGameArena` component that renders text inputs, timers, and instructions based on AI JSON.
    - [ ] Add "Host Evaluation/Voting" screen for players to see everyone's submissions.- [ ] Integration of GitHub API to pull live Forge repository statistics.
- [ ] AI-driven search functionality for the Blog and Forge.
- [ ] User profile system for "Nexus Members" to save favorited code snippets.