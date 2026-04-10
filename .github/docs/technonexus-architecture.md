# TechnoNexus Architecture & Codebase Guide

## Overview

TechnoNexus is a **Next.js 16 + React 19** gaming ecosystem combining enterprise IT consulting with a multiplayer indie game hub. It features AI-powered game generation, real-time peer-to-peer multiplayer, user persistence, and a dark neon design system.

**Live**: https://technonexus.ca | **Dev**: https://dev.technonexus.ca

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js (App Router) | 16 | SSR, API routes, Edge runtime |
| **UI Framework** | React | 19 | Component-based UI |
| **Styling** | Tailwind CSS | Latest | Responsive, dark-theme design |
| **State Management** | Zustand | 5.0.12 | Game state, user session |
| **Multiplayer** | PeerJS | Latest | Decentralized P2P rooms |
| **AI Engine** | Gemini 2.5 Flash | Fixed | Game generation, judging |
| **Database** | Supabase | Latest | Auth, game vault, user data |
| **Deployment** | Cloudflare Pages | Latest | Edge runtime, global CDN |
| **Mobile** | Capacitor | Latest | iOS/Android native wrapper |

---

## Project Structure

```
technonexus/
├── .github/
│   ├── docs/                      # This documentation
│   ├── agents/                    # Custom Copilot agents
│   └── (workflows, etc.)
├── app/
│   ├── layout.js                  # Root layout + Navbar/Footer
│   ├── page.js                    # Homepage
│   ├── globals.css                # Global styles (dark theme)
│   ├── api/
│   │   ├── generate-game/         # Gemini: create custom game JSON
│   │   ├── evaluate-submission/   # Gemini: score single player
│   │   ├── evaluate-batch/        # Gemini: batch score all players
│   │   ├── evaluate-leaderboard/  # Gemini: round summary + verdicts
│   │   └── nexus-search/          # Semantic search across blog/forge
│   ├── games/
│   │   ├── dumb-charades/         # Party game (PeerJS multiplayer)
│   │   └── ai-forge/              # Custom game engine (Gemini powered)
│   ├── blog/
│   │   ├── page.js                # Blog list
│   │   ├── [slug]/                # Dynamic blog article routing
│   │   └── posts/                 # Markdown files (gray-matter)
│   ├── apps/                      # App hub (Random Generator, etc.)
│   └── forge/                     # GitHub project showcase
├── components/
│   ├── NexusRoomManager.js        # Multiplayer engine (PeerJS orchestration)
│   ├── NexusAuth.js               # Supabase auth flow
│   ├── NexusSearch.js             # Semantic search modal
│   ├── navbar/                    # Navigation component
│   ├── Footer.js
│   └── (Hero, Vision, Consulting, Ecosystem components)
├── store/
│   └── gameStore.js               # Zustand: room state, player data, scores
├── lib/
│   └── supabase.js                # Supabase client initialization
├── public/
│   └── (assets, icons, logos)
├── docs/
│   ├── architecture.md            # Technical docs
│   ├── roadmap.md                 # Feature roadmap
│   ├── prompts.md                 # Gemini prompt engineering guide
│   └── SECURITY.md
├── copilot-instructions.md        # Workspace-level AI instructions
├── package.json
├── next.config.mjs
├── tailwind.config.mjs
├── jsconfig.json
└── (config files)
```

---

## Core Concepts

### 1. Game Architecture

**Two Game Modes:**

#### A. Dumb Charades (`/games/dumb-charades`)
- **Type**: Team-based party game
- **Multiplayer**: PeerJS rooms (Host + Guests)
- **Flow**: Host sees word, Guests don't → Guests guess → 60s timer
- **Scoring**: Points per correct guess
- **Local Storage**: Word database in Supabase

#### B. AI Forge (`/games/ai-forge`)
- **Type**: Custom AI-generated missions
- **Generation**: Host enters prompt → Gemini creates game JSON
- **Game Types**: Performance, Text, Quiz
- **Multiplayer**: Host + Guests compete
- **Scoring**: AI Judge evaluates submissions
- **Persistence**: Save to "Nexus Vault" (Supabase)

**Game JSON Schema:**
```javascript
{
  gameTitle: "Mission Name",
  instructions: "What to do?",
  timeLimitSeconds: 60,
  gameType: "performance|text|quiz",
  gameContent: [
    { content: "Item 1", type: "prompt|question" },
    // ...
  ],
  language: "English|Hindi|Hinglish",
  inputType: "text|voice|timer"
}
```

### 2. Multiplayer Architecture (PeerJS)

**Room Lifecycle:**

1. **Host Creates Room**
   ```javascript
   setHost(true);
   initPeer(roomId);  // Creates Nexus-{roomId} peer
   ```

2. **Guest Joins Room**
   ```javascript
   handleJoin(roomId, peer);
   // Guest sends: { type: 'join', name: 'PlayerName' }
   ```

3. **Host Broadcasts Welcome**
   ```javascript
   conn.send({
     type: 'welcome',
     roomStatus: 'idle',
     customGame: null,
     players: [{ peerId, name }]
   });
   ```

4. **Game State Sync**
   ```javascript
   // Host broadcasts playing state
   conn.send({
     type: 'start-game',
     status: 'playing',
     customGame: { ...game },
     gameMode: 'individual|team'
   });
   ```

**Key Pattern**: Host is the single source of truth. Guests receive state via PeerJS messages.

### 3. State Management (Zustand)

**Location**: `store/gameStore.js`

**Key State**:
```javascript
{
  // Room
  roomId: null,
  isHost: false,
  players: [],  // { peerId, name }
  roomStatus: 'idle|waiting|playing|finished',
  
  // Game
  customGame: null,  // AI-generated game JSON
  gameMode: 'individual|team',
  
  // Scoring
  localEvaluation: null,  // Current player's score
  roomScores: [],  // All players' scores
  roundVerdict: null,  // Sarcastic AI summary
  
  // User
  playerName: '',
  hostName: '',
  
  // Other
  savedGames: [],  // Vault games
  leaderboard: []  // Global wins tracking
}
```

**Access Pattern**:
```javascript
const { roomStatus, customGame, setRoomStatus } = useGameStore();
```

### 4. AI Integration (Gemini 2.5 Flash)

**HARDCODED**: Always use `gemini-2.5-flash` (never change)

**API Routes**:

| Route | Input | Output | Purpose |
|-------|-------|--------|---------|
| `/api/generate-game` | Host prompt, language | Game JSON | Create custom mission |
| `/api/evaluate-submission` | Single submission | Score + feedback | Score one player |
| `/api/evaluate-batch` | Multiple submissions | Scores array | Batch score (rate-limit safe) |
| `/api/evaluate-leaderboard` | Scores, game title | Round summary + verdicts | Generate sarcastic summary |

**Key Pattern**: Always batch submissions to prevent rate-limiting.

### 5. Design System

**Color Palette**:
- **Background**: `#0A0A0A` (dark-bg)
- **Accent**: `#00FFFF` (neon-cyan)
- **Secondary**: `#8B5CF6` (electric-violet)
- **Text**: White / `#64748B` (slate-500 for secondary)

**Component Patterns**:
```jsx
// Glassmorphism card
<div className="glass-panel p-6 rounded-[2rem] border-neon-cyan/20 bg-white/5">

// Neon button
<button className="px-4 py-2 rounded-lg bg-neon-cyan text-black font-black hover:scale-[0.98]">

// Gradient text
<span className="gradient-text-cyan">NEXUS</span>

// Section heading
<h1 className="text-4xl font-black tracking-tighter uppercase">
```

---

## Common Workflows

### Creating a New Game Mode

1. Create `app/games/{game-name}/page.js`
2. Export game component that uses `useGameStore()`
3. Integrate with `NexusRoomManager` for multiplayer
4. Test locally: `npm run dev`
5. Deploy: `git push origin main`

### Adding a Gemini Prompt

**File**: `app/api/{endpoint}/route.js`

```javascript
export async function POST(req) {
  const { prompt, ... } = await req.json();
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemPrompt: "Your instructions..."
  });
  
  const result = await model.generateContent(prompt);
  return Response.json(result.response.text());
}
```

### Broadcasting State to All Guests

```javascript
// In NexusRoomManager
connections.current.forEach(conn => {
  if (conn.open) {
    conn.send({
      type: 'start-game',
      status: roomStatus,
      customGame: customGame,
      gameMode: gameMode
    });
  }
});
```

---

## Critical Rules & Patterns

### ✅ DO's
- Use `replace_string_in_file` for surgical edits (prevents regressions)
- Batch state updates: Emit one PeerJS message instead of many
- Always filter connections: `.filter(c => c.open)`
- Test after state changes: Component should re-render
- Use Tailwind classes (no inline styles)
- Keep NexusRoomManager always mounted (outside conditionals)

### ❌ DON'Ts
- **Never** change Gemini model (always `gemini-2.5-flash`)
- **Never** create TypeScript files (use .js)
- **Never** send repeated state updates (causes textarea clearing, etc.)
- **Never** assume connections are open without checking
- **Never** unmount NexusRoomManager during game transitions
- **Never** make individual evaluation calls (always batch via host)

---

## Debugging & Common Issues

### Issue: Guests don't see game start
**Root Cause**: NexusRoomManager unmounted during state transition  
**Fix**: Keep component always mounted outside conditionals

### Issue: Textarea clears while typing
**Root Cause**: Component re-renders from repeated `setCustomGame()` calls  
**Fix**: Only send state once, disable retry broadcasts

### Issue: Player names show as IDs
**Root Cause**: Host not syncing player names in welcome message  
**Fix**: Always send `playerName` and `hostName` in state

### Issue: PeerJS connection fails
**Root Cause**: Room ID collision or poor network  
**Fix**: Use `Nexus-{roomId}` prefix, test locally first

---

## Performance Optimization Tips

1. **Memoize callbacks**: `useCallback()` for expensive event handlers
2. **Lazy load games**: Dynamic imports for game components
3. **Batch API calls**: Never make 10 individual evaluation calls
4. **Debounce rapid updates**: Don't send PeerJS messages every keystroke
5. **Use React.memo** for static components (Hero, Footer, etc.)

---

## Next Steps for Development

Refer to `docs/roadmap.md` for feature prioritization and `docs/prompts.md` for Gemini engineering patterns.

