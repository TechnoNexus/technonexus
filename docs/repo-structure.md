# Repository Structure

project-root/
├── app/               # Next.js 16 App Router structure (web platform)
│   ├── api/           # Edge API routes (Gemini AI, Supabase evaluations)
│   ├── apps/          # Web utilities (Random Generator, Dev Utility)
│   ├── blog/          # Markdown posts
│   ├── forge/         # Open-source automation showcase
│   ├── games/         # Web-based multiplayer games
│   └── leaderboard/   # Global and local rankings
├── apps/
│   └── nexus-mobile/  # React Native (Expo) mobile application
│       ├── assets/    # Mobile icons, splash screens, SVGs
│       └── src/       # Mobile source code
│           ├── components/ # Reusable native UI components (GlassPanel, GameCard)
│           ├── hooks/      # Extracted native game logic (useForgeLogic, useNpatmLogic)
│           ├── lib/        # Native Supabase client, API helpers
│           ├── networking/ # PeerJS WebRTC WebView bridge (NexusRoomBridge.js)
│           ├── screens/    # Native screens (Dashboard, Auth, Profile, Game Hubs)
│           └── theme/      # Native theme constants (Colors.js)
├── components/        # Shared web UI atoms/molecules (e.g., NexusRoomPanel.js, NexusRoomManager.js)
├── docs/              # Documentation, architecture, and roadmaps
├── hooks/             # Extracted web logic hooks (e.g., useNexusAI.js, useNexusEvents.js, useNexusTransport.js)
├── lib/               # Shared web utilities, Supabase clients
├── public/            # Web public assets (SVGs, images)
├── store/             # Zustand state management (web)
├── tailwind.config.mjs # Shared Tailwind styling
└── GEMINI.md          # AI Agent instructions and system prompt
