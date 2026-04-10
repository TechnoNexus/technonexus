---
name: Creating a New Game Mode in TechnoNexus
description: "Step-by-step workflow for adding a new game to the Nexus Arcade (e.g., Dumb Charades, Team Picker, Neon Runner, etc.)"
version: 1.0.0
keywords:
  - game-mode
  - game-creation
  - Nexus-Arcade
  - multiplayer
  - component-creation
---

# Creating a New Game Mode Skill

Use this workflow when adding a new game to TechnoNexus (e.g., Dumb Charades, Team Picker, Neon Runner, etc.).

---

## Step 1: Plan the Game

Before coding, define:

- **Game Name**: (e.g., "Neon Runner")
- **Multiplayer Type**: Individual, Teams, Competitive, Cooperative
- **Input Type**: Text, Voice, Timer, Gesture
- **Round Duration**: 30-180 seconds
- **Scoring Method**: Points, Speed, Accuracy, Creative
- **Players Min/Max**: 2+ recommended, up to ~10 without lag
- **Gemini Integration**: Generated? Fixed puzzles? Scoring AI?

Example for "Neon Runner":
```
Name: Neon Runner
Type: Individual competitive race game
Input: Click/Tap timer
Duration: 60 seconds
Scoring: Clicks per second
Min Players: 1 (vs leaderboard)
Max Players: 10+
Gemini: Not needed (pure reaction test)
```

---

## Step 2: Create File Structure

```bash
app/games/neon-runner/
├── page.js              # Main component
└── types.js             # (Optional) Game-specific types/constants
```

Don't create a `components/` subfolder yet unless sharing components.

---

## Step 3: Create Base Component

**File**: `app/games/neon-runner/page.js`

```javascript
'use client';

import { useGameStore } from '@/store/gameStore';
import { useEffect, useState } from 'react';
import NexusRoomManager from '@/components/NexusRoomManager';

export default function NeonRunnerPage() {
  const {
    roomStatus,
    customGame,
    isHost,
    players,
    setRoomStatus,
    setCustomGame,
    gameMode
  } = useGameStore();

  const [gameState, setGameState] = useState({
    // Game-specific state
    // e.g., for Neon Runner: score, timeLeft, isRunning
  });

  // ============================================
  // PHASE 1: Host initializes game
  // ============================================
  useEffect(() => {
    if (!isHost) return;
    
    // Generate or load game data (if Gemini-powered)
    if (roomStatus === 'idle' && !customGame) {
      // Load initial game state
      // e.g., generateNeonRunnerGame() or use fixtures
    }
  }, [isHost, roomStatus, customGame]);

  // ============================================
  // PHASE 2: Receive state from host (guest side)
  // ============================================
  useEffect(() => {
    if (isHost) return;
    
    if (roomStatus === 'playing' && customGame) {
      // Guest received game state from host
      // Initialize local game state
      setGameState({...});
    }
  }, [roomStatus, customGame, isHost]);

  // ============================================
  // GAME LOGIC
  // ============================================
  
  const handleStartGame = () => {
    if (!isHost) return;
    
    // Prepare game data (if Gemini-powered, call API first)
    const gameData = customGame || {/* fixture data */};
    
    // Set game state to populate
    setGameState({
      started: true,
      timeLeft: 60,
      score: 0
    });
    
    // Trigger roomStatus change (broadcasts to guests via NexusRoomManager)
    setRoomStatus('playing');
  };

  const handleSubmitScore = async () => {
    // Send submission to host for evaluation
    // Host will call /api/evaluate-submission or /api/evaluate-batch
    
    if (isHost) {
      // Score locally for host
      const score = calculateScore(gameState);
      setGameState(prev => ({...prev, score, submitted: true}));
    } else {
      // Guest sending score to host (via PeerJS in NexusRoomManager)
      // Will be handled by NexusRoomManager's connection.on('data')
    }
  };

  // ============================================
  // UI RENDERING
  // ============================================

  if (roomStatus === 'idle') {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="glass-panel p-12 rounded-2xl text-center max-w-md border-neon-cyan/20">
          <h1 className="text-4xl font-black tracking-tighter uppercase gradient-text-cyan">
            Neon Runner
          </h1>
          <p className="mt-4 text-slate-400">
            Tap as fast as you can! Fastest clicker wins.
          </p>
          
          <button
            onClick={handleStartGame}
            className="mt-8 px-6 py-3 bg-neon-cyan text-black font-black rounded-lg hover:scale-95 transition"
          >
            START GAME
          </button>

          {players.length > 1 && (
            <div className="mt-6 text-sm text-slate-400">
              {players.length} players ready
            </div>
          )}
        </div>
      </div>
    );
  }

  if (roomStatus === 'playing') {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="glass-panel p-12 rounded-2xl text-center border-neon-cyan/20">
          <h2 className="text-6xl font-black tracking-tighter uppercase gradient-text-cyan">
            {gameState.timeLeft}s
          </h2>
          
          <div className="mt-8">
            <p className="text-2xl font-bold text-neon-cyan">
              Clicks: {gameState.score}
            </p>
          </div>

          <button
            onClick={() => setGameState(prev => ({...prev, score: prev.score + 1}))}
            className="mt-8 px-12 py-4 bg-neon-cyan text-black font-black rounded-lg text-2xl hover:scale-95 transition active:scale-90"
          >
            TAP!
          </button>

          <button
            onClick={handleSubmitScore}
            className="mt-4 px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white transition"
          >
            Submit Score
          </button>
        </div>
      </div>
    );
  }

  if (roomStatus === 'finished') {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="glass-panel p-12 rounded-2xl text-center border-neon-cyan/20">
          <h2 className="text-4xl font-black tracking-tighter uppercase gradient-text-cyan">
            Game Over
          </h2>
          
          <p className="mt-6 text-2xl font-bold text-neon-cyan">
            Your Score: {gameState.score}
          </p>
          
          {/* Display leaderboard if available */}
          
          <button
            onClick={() => {
              setGameState({});
              setRoomStatus('idle');
            }}
            className="mt-8 px-6 py-3 bg-neon-cyan text-black font-black rounded-lg hover:scale-95 transition"
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // CRITICAL: NexusRoomManager ALWAYS rendered
  // ============================================
  return (
    <>
      {/* Game UI above */}
      <NexusRoomManager showForge={false} />
    </>
  );
}
```

---

## Step 4: Add Route to Game Hub

**File**: `app/games/page.js`

Find the games list and add your new game:

```javascript
const games = [
  {
    title: 'Dumb Charades',
    description: 'Describe without words. Your team guesses.',
    href: '/games/dumb-charades',
    icon: '🎭'
  },
  {
    title: 'AI Forge',
    description: 'Custom AI-generated games. Create any challenge.',
    href: '/games/ai-forge',
    icon: '⚡'
  },
  {
    title: 'Neon Runner',  // ← NEW
    description: 'Tap as fast as you can. Fastest wins.',
    href: '/games/neon-runner',  // ← NEW
    icon: '🏃'  // ← NEW
  }
];
```

---

## Step 5: Update Navbar Links (Optional)

**File**: `components/navbar/index.js`

If you want the game in the main navbar:

```javascript
<Link href="/games/neon-runner" className="nav-link">
  🏃 Neon Runner
</Link>
```

---

## Step 6: Integrate Gemini (If Needed)

If your game needs AI-generated content:

### A. Create API Endpoint

**File**: `app/api/generate-neon-runner/route.js`

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(req) {
  const { difficulty = 'medium' } = await req.json();

  const systemPrompt = `You are creating a Neon Runner game config.
  Output ONLY valid JSON.
  
  Schema:
  {
    "gameTitle": "Neon Runner - [Difficulty]",
    "difficulty": "${difficulty}",
    "clicksTarget": number,
    "timeLimit": 60,
    "bonusMultiplier": number
  }`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemPrompt: systemPrompt
  });

  try {
    const result = await model.generateContent('Create a Neon Runner game');
    const gameConfig = JSON.parse(result.response.text());
    return Response.json(gameConfig);
  } catch (error) {
    return Response.json({error: 'Generation failed'}, {status: 500});
  }
}
```

### B. Call API in Component

```javascript
useEffect(() => {
  if (isHost && roomStatus === 'idle' && !customGame) {
    const generateGame = async () => {
      const res = await fetch('/api/generate-neon-runner', {
        method: 'POST',
        body: JSON.stringify({difficulty: gameMode})
      });
      const game = await res.json();
      setCustomGame(game);
    };
    
    generateGame();
  }
}, [isHost, roomStatus, customGame, gameMode]);
```

---

## Step 7: Multiplayer Integration

### Host Broadcasting State Changes

After user performs action, update state and broadcast:

```javascript
const handleStartGame = () => {
  // Update local state (host sees immediately)
  setGameState({started: true, timeLeft: 60});
  
  // This triggers NexusRoomManager broadcast effect automatically
  // because roomStatus changed
  setRoomStatus('playing');
  
  // NexusRoomManager will send to all guests:
  // {type: 'start-game', status: 'playing', customGame, gameMode}
};
```

### Guest Receiving Updates

Guest automatically receives via `NexusRoomManager` connection listener:

```javascript
// Guest side receives 'start-game' message
useEffect(() => {
  if (!isHost && roomStatus === 'playing' && customGame) {
    // Initialize game for guest
    setGameState({started: true, timeLeft: 60});
  }
}, [roomStatus, customGame, isHost]);
```

### Submitting Scores

If your game needs evaluation:

```javascript
const submitScore = async () => {
  const submission = {
    playerId: peerId,
    score: gameState.score,
    gameId: customGame.id
  };
  
  // Guest sends to host
  if (!isHost) {
    // NexusRoomManager handles this via conn.send()
    // Host should implement handler
  } else {
    // Host collects all submissions then evaluates
    await fetch('/api/evaluate-batch', {
      method: 'POST',
      body: JSON.stringify({submissions: [submission]})
    });
  }
};
```

---

## Step 8: Test Locally

```bash
# Terminal 1: Run dev server
npm run dev

# Open two browser windows:
# Window 1 (Host): http://localhost:3000/games/neon-runner?mode=host&roomId=TEST
# Window 2 (Guest): http://localhost:3000/games/neon-runner?roomId=TEST

# Test flow:
# 1. Host sees "START GAME" button
# 2. Guest sees "Waiting for host..."
# 3. Host clicks START
# 4. Guest immediately sees game screen
# 5. Both play game
# 6. Submit score
# 7. See results
```

---

## Step 9: Dark Mode Compliance

Ensure your game works in dark mode:

```javascript
// ✅ Good: Uses theme variables
<div className="bg-dark-bg text-white border-neon-cyan">

// ❌ Bad: Hard-coded colors
<div style={{backgroundColor: 'white', color: 'black'}}>

// ✅ Good: Opacity for visibility
<button className="opacity-70 hover:opacity-100">

// ❌ Bad: Opacity-0 (invisible)
<button className="opacity-0 group-hover:opacity-100">
```

Key colors:
- Background: `bg-dark-bg` or `bg-black/90`
- Neon accent: `text-neon-cyan` or `border-neon-cyan`
- Secondary: `text-electric-violet`
- Text: `text-white`, `text-slate-400`, `text-slate-500`

---

## Step 10: Documentation

Update `docs/roadmap.md`:

```markdown
## Games (Nexus Arcade)

- [x] Dumb Charades (MVP)
- [x] AI Forge (Custom game generator)
- [x] Neon Runner (Tap speed game)  ← NEW
- [ ] Team Picker (Random team assignment)
- [ ] Neon Runner Pro (Power-ups version)
```

And add to `docs/architecture.md` if it's a new game type.

---

## Checklist

Before marking game as done:

- [ ] Component renders in `app/games/{name}/page.js`
- [ ] Game accessible from `/games` hub page
- [ ] Host can start game
- [ ] Guest joins and sees game screen when host starts
- [ ] Guest can play (no textarea clearing, state persists)
- [ ] Scores submit correctly
- [ ] Dark mode compliant (nothing invisible)
- [ ] NexusRoomManager always mounted (check render code)
- [ ] Tested on actual devices or multiple browsers
- [ ] No console errors
- [ ] Documented in roadmap

---

## Common Patterns by Game Type

### Pattern 1: Timer-Based (Neon Runner)
```javascript
useEffect(() => {
  if (!gameState.started) return;
  
  const interval = setInterval(() => {
    setGameState(prev => ({
      ...prev,
      timeLeft: Math.max(0, prev.timeLeft - 1)
    }));
  }, 1000);
  
  return () => clearInterval(interval);
}, [gameState.started]);
```

### Pattern 2: Text Input (Dumb Charades)
```javascript
const [answer, setAnswer] = useState('');

const handleSubmit = () => {
  setGameState(prev => ({
    ...prev,
    submissions: [...prev.submissions, answer]
  }));
  setAnswer('');  // Clear for next round
};
```

### Pattern 3: Gemini-Evaluated (AI Forge)
```javascript
const evaluateGame = async (submissions) => {
  const res = await fetch('/api/evaluate-batch', {
    method: 'POST',
    body: JSON.stringify({submissions})
  });
  const {scores} = await res.json();
  setGameState(prev => ({...prev, scores}));
};
```

---

## Troubleshooting

### "Guest doesn't see game start"
→ Check NexusRoomManager always mounted (not inside conditionals)

### "Scores don't submit"
→ Check if host is calling `/api/evaluate-batch` after collecting all submissions

### "Buttons invisible"
→ Check opacity values. Use `opacity-70 hover:opacity-100`, not `opacity-0`

### "Game runs too slow"
→ Debounce state updates. Don't update on every keystroke or click.

### "Players see different games"
→ Check if `customGame` is being broadcast atomically with `roomStatus`

---

## References

- [Architecture Guide](.github/docs/technonexus-architecture.md) — Project structure
- [Multiplayer Sync Guide](.github/docs/multiplayer-sync-guide.md) — PeerJS integration
- [Game Generation Patterns](.github/docs/game-generation-patterns.md) — Gemini prompts
- [NexusRoomManager](components/NexusRoomManager.js) — Multiplayer orchestration

