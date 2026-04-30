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
- [x] **Room Synchronization 2.0:**
    - [x] Fixed player list synchronization so Guests see the actual Host and other participants.
    - [x] Implemented global state broadcasting for `roomStatus` and `customGame` to ensure all players start and finish missions simultaneously.

## Phase 6.2 — Critical Bug Fixes (✅ COMPLETED)
- [x] **Leaderboard State Initialization Fix**: Added missing `leaderboard: []` to Zustand store initial state (was causing `updateLeaderboard()` to crash)
- [x] **Game Start Synchronization Fix**: Implemented unified 'start-game' PeerJS message to atomically sync roomStatus and customGame to all guests (prevents guest screen freeze)

## Phase 6.3 — Feature Completions & Security (✅ COMPLETED)
- [x] **Vault Management System**: Added delete and rename buttons to AI Forge vault UI with Supabase backend operations
- [x] **PeerJS Memory Leak Fix**: Added connection cleanup handlers (`on('close')`, `on('error')`) to prevent connection array bloat
- [x] **Supabase RLS Security Configuration**: Created SECURITY.md with SQL policies for row-level security on `user_games` table
- [x] **Team Picker Modernization**: Updated Team Picker game UI to match Nexus aesthetic with Electric Violet branding
- [x] **Apps Section Implementation**:
    - [x] **Random Generator** (`/apps/random-generator`): Generate random numbers, strings, and UUIDs with full UI
    - [x] **Dev Utility** (`/apps/dev-utility`): JSON formatter/minifier and Base64 encoder/decoder tools
    - [x] **Updated Apps Landing** (`/apps`): Linked to functional tools with status indicators

## Phase 6.4 — Modular Game Development (Strategy Active)
- [x] **Context Optimization**: Shifted to a "Clean Room" development pattern where new games are built in standalone sessions using the Nexus Blueprint.
- [x] **Nexus NPATM**: Launched the classic Name-Place-Animal-Thing-Movie game with "Stop!" mechanic and AI Duplicate Detection.
- [x] **Codex Codebase Brief**: Added `docs/codex-codebase-brief.md` as a consolidated Codex handoff note summarizing architecture, current source truth, multiplayer rules, AI rules, mobile-doc conflicts, and stale documentation warnings.
- [x] **NPATM Guest Stop Sync Fix**: Fixed guest-triggered STOP flow so the first player to complete all five words ends the round for host and guests, and fresh rounds clear stale joiner inputs.
- [x] **NPATM Layout Polish**: Fixed the clipped `NEXUS NPATM` heading and changed the mini leaderboard from a fixed floating HUD to an in-flow element so it no longer sticks to the screen while scrolling.
- [x] **Global Leaderboard Bridge**: Added Supabase-backed leaderboard read/write helpers with local Zustand fallback when the `leaderboard` table or `record_win` RPC is unavailable.
- [x] **Generic Room Action Bridge**: Extended `NexusRoomManager` with a safe `nexus-game-action` event path for host-authoritative game payload sync across reusable games.
- [x] **Dumb Charades Multiplayer Sync**: Moved Charades word, timer, score, turn, and category into synced room state so guests see live host-driven gameplay without seeing the secret word.
- [x] **Nexus Blitz Multiplayer Mode**: Added room-aware shared quiz generation, guest quiz sync, per-player room result reporting, and shared room results display.
- [x] **Review Feedback Hardening**: Removed non-atomic direct leaderboard write fallback, broadened trivia markdown fence cleanup, and changed Charades timer sync to timestamp-based local countdowns instead of per-second room broadcasts.
- [ ] **Integration Protocol**: Standardize `useGameStore` hooks to allow drag-and-drop game integration.
- [ ] **Next Game: [Pending User Request]**: Ready to integrate the first modularly developed game.

## Phase 8 — True Native Mobile Experience (✅ Completed)

- [x] **Bundled Asset Build Pipeline**: Removed `server.url` from `capacitor.config.json`; app now serves UI from bundled `out/` assets instead of loading `technonexus.ca` remotely.
- [x] **Mobile Build Scripts**: Added `build:mobile`, `cap:sync`, `cap:android`, `cap:ios` npm scripts with `cross-env` for cross-platform compatibility.
- [x] **Centralized URL Helpers** (`lib/api.js`): `getApiUrl()` routes API calls to `technonexus.ca` on native (relative on web); `getWebUrl()` generates shareable HTTPS URLs regardless of platform.
- [x] **CORS Headers**: Added `OPTIONS` preflight handler and `Access-Control-Allow-Origin: *` to all 6 API routes so native WebView requests are accepted by Cloudflare.
- [x] **QR Code Join URL Fix**: Multiplayer room QR codes now encode `https://technonexus.ca/...?join=ID` on native instead of the unusable `capacitor://localhost` origin.
- [x] **Android Back Button**: `CapacitorAppCheck.js` now registers a `backButton` listener via `@capacitor/app` — navigates back or exits app cleanly.
- [x] **Native CSS Overrides** (`.is-native-app`): Footer hidden, tap highlight removed, overscroll disabled, `main` padding accounts for bottom tab bar + safe area.
- [x] **BottomTabNav Polish**: Haptic feedback (Light) on every tab tap; active state now shows a neon-cyan indicator line at top edge + icon pill background, replacing the plain color change.
- [x] **NativeGatekeeper Cleanup**: Removed unnecessary `pathname`/`router` dependencies; runs once on mount with eager footer hide to prevent flash.

---

## Phase 7 — Native Mobile Excellence (✅ Completed)

- [x] **Phase 7.1: Mobile UI/UX Polish**: 
    - [x] Implement Safe Area padding for iOS notches in `layout.js`.
    - [x] Add a mobile-only Bottom Tab Navigation bar for easier one-handed use.
    - [x] Ensure all touch targets (like the Charades 'Skip' button) are thumb-friendly (min 44x44px).
    - [x] **Native Gatekeeper and Arcade Mobile Lock**: Implemented a global redirect that locks native mobile users into the `/games` (Arcade) section and hides standard web navigation.
    - [x] **NativeGatekeeper Routing Adjustment**: Removed the forced redirect from root (/) to support Bottom Navigation access to the primary Dashboard.
    - [x] **Phase 7.2: Native Capacitor Features**: 
        - [x] Integrate offline storage (Preferences) for the Nexus Vault so users can view saved games offline. 
        - [x] Prepare native Camera hooks for future QR scanning.
    - [x] **Phase 7.3: App Store Prep**: 
        - [x] Configure Android `strings.xml` and iOS `Info.plist` with final TechnoNexus branding.
        - [x] Set up Splash Screens and generate App Icons for all densities (via `@capacitor/assets`).

    ## Phase 9 — Cross-Platform Mobile Pivot (In Progress)

    - [x] **Deprecate Capacitor**: Removed all Capacitor dependencies, wrappers, and configuration from the web repository.
    - [x] **Mock Native Hardware**: Created web-compatible mocks for Haptics, Camera, and Preferences to keep the web app functional.
    - [x] **Initialize Expo Project**: Created `apps/nexus-mobile` as a React Native (Expo) project to allow cross-platform testing on Windows via Expo Go.
    - [x] **Nexus Vibe UI Port (React Native)**: Ported the dark/neon branding, typography, and glassmorphism components to React Native using `expo-blur` and `react-native-reanimated`.
    - [x] **Native Dashboard Implementation**: Built the primary "Nexus Dashboard" module in Expo with fluid scrolling and interactive cards.
    - [x] **Native Multiplayer Sync (WebView Bridge)**: Implemented PeerJS WebRTC syncing via an invisible `react-native-webview` bridge (`NexusRoomBridge.js`).
    - [x] **Arcade Spatial UI (Expo)**: Built `ArcadeHome.js`, `GlassPanel.js`, and `SpatialBackground.js` using animated linear gradients and blurs.
    - [x] **Core Native Infrastructure**: Integrated Supabase JS SDK for native Authentication (Email, Google, Apple, Meta) and session persistence.
    - [x] **Full Arcade Integration**: Implemented the complete game engines for Dumb Charades (Host/Guest views, Score Sync) and Nexus Blitz (AI Generation, Timing, Shared Results) in the React Native Expo app.
    - [x] **AI Forge Native First Pass**: Upgraded the Expo AI Forge screen from a room-only lobby to a full mission flow with Gemini generation, vault save/load/delete, host-authoritative batch scoring, room verdicts, and shared room start/results.
    - [x] **Expo Bridge Reliability Hardening**: Refactored `NexusRoomBridge.js` so host connections register only after guest `join`, room welcomes carry current snapshot state, and the native navigator now wires the NPATM screen correctly.
    - [x] **Expo Runtime Bug Fixes**: Fixed the Nexus Blitz option reveal crash from an undefined `opacity` variable and normalized native QR code component usage across the Expo game screens.
    - [x] **NPATM Native Analysis Flow**: Replaced the placeholder post-STOP state with real host-collected NPATM submissions, a manual host “Start Analysis Now” button like web, batch AI scoring, and room-wide results sync.
    - [x] **Expo Release Identity Setup**: Renamed the Expo app to Nexus Arcade and added the Android package ID/version code needed for Play Store release builds.
    - [x] **Native Auth Diagnostics Hardening**: Aligned the Expo Supabase client with the official React Native auth setup, added clearer runtime login diagnostics, and blocked the still-unconfigured social auth buttons from failing with misleading network errors in Play tester builds.
    - [x] **Production UI Polish**: Removed internal debug configurations (like the raw Supabase URL) from the AuthScreen to finalize the production user experience.
    - [x] **Security Hardening**: Replaced hardcoded default Supabase URLs and keys with strict environment variable configuration.
    - [x] **Network Reliability**: Bundled PeerJS locally into the networking bridge to eliminate CDN dependency and improve connection stability.
    - [x] **Google OAuth Redirect Fix**: Corrected redirect behavior to return to the mobile app instead of the website after login.
    - [x] **Native WebView Stability**: Fixed Android-specific crashes in the networking bridge by adding origin whitelisting.
    - [x] **AI Forge Logic Fixes**: Resolved `ReferenceError` for missing state setters in the Forge Lobby.

## Phase 10 — Spatial Computing & Ultra HD Overhaul (✅ Completed)
- [x] **Phase 10.1: Foundation & Theming**: 
    - [x] Deprecated "Tailwind-only" constraints and integrated `framer-motion`, `three.js`, and `lucide-react`.
    - [x] Set up `lib/utils.js` with `cn` utility for dynamic class merging.
    - [x] Upgraded `tailwind.config.mjs` and `app/globals.css` with complex glassmorphism, spatial shadows, and ambient radial gradients.
- [x] **Phase 10.2: Layout Dynamics**: Implement Framer Motion page transitions and magnetic navigations.
- [x] **Phase 10.3: Immersive Games Experience**: Overhaul Lobbies and AI Judges with staggered reveals, ghost typing, and fluid score counters.
- [x] **Phase 10.4: 3D WebGL Layer**: Integrate React Three Fiber canvas for dynamic, state-reactive backgrounds.

## Phase 11 — Advanced Mobile Features & Ecosystem Sync (Up Next)
- [x] **Global Native Leaderboards**: Build a global "Nexus Rankings" screen on the Dashboard where players can see the top 100 players worldwide for games like NPATM and Blitz.
- [ ] **Push Notifications**: Integrate Expo Push Notifications for multiplayer invites (e.g., Ping Friends when a host creates a room).
- [ ] **In-App Subscriptions (RevenueCat)**: Implement "Nexus Pro" subscriptions for advanced AI judges or unlimited saved vault slots via Apple Pay/Google Play Billing.
- [ ] **Offline Mode Optimization**: Use `AsyncStorage` to aggressively cache the user's "Nexus Vault" to allow browsing saved games without network access.
- [ ] **Nexus Member Profiles Expansion**: Expand the Profile Screen into a full dashboard for users to view global stats and manage their saved "Nexus Vault" content.
- [ ] **GitHub Forge Sync**: Integration of live commit history/activity for Forge projects.
- [ ] **Integration Protocol**: Standardize `useGameStore` hooks to allow drag-and-drop game integration.
- [ ] **New Modular Game**: Build the next brand-new game mode using the "Clean Room" development pattern.
