---
name: Debugging Multiplayer Sync in TechnoNexus
description: "Systematic approach to diagnosing and fixing PeerJS synchronization issues, component lifecycle problems, and connection handling."
version: 1.0.0
keywords:
  - multiplayer
  - PeerJS
  - debugging
  - synchronization
  - connection
  - component-lifecycle
---

# Debugging Multiplayer Sync Issues Skill

When multiplayer features fail in TechnoNexus, use this systematic approach to identify and fix the problem.

## Phase 1: Symptom Identification

Ask yourself which symptom you're seeing:

### Symptom A: "Host starts game, but guests don't see game screen"
- **Likely cause**: Component lifecycle issue
- **Go to**: Phase 2A

### Symptom B: "Guest can't type input, or input clears every few seconds"
- **Likely cause**: Repeated state broadcasts triggering re-renders
- **Go to**: Phase 2B

### Symptom C: "Guests join but never receive first welcome message"
- **Likely cause**: Connection not added to pool, or added before open
- **Go to**: Phase 2C

### Symptom D: "Some guests see updates, others don't"
- **Likely cause**: Connection filtering or error handling issue
- **Go to**: Phase 2D

### Symptom E: "Guest sees stale game data (wrong game or old players list)"
- **Likely cause**: Atomic update violation or message ordering
- **Go to**: Phase 2E

---

## Phase 2: Root Cause Diagnosis

### Phase 2A: Component Lifecycle Issue

**Step 1**: Verify NexusRoomManager always mounted
```javascript
// File: app/games/ai-forge/page.js
// Check FINAL return statement - NexusRoomManager should be here:

return (
  <div>
    {/* Conditional UI rendering - OK */}
    {roomStatus === 'idle' && <MainMenu />}
    {roomStatus === 'playing' && <GameScreen />}
    
    {/* CRITICAL: NexusRoomManager ALWAYS rendered */}
    <NexusRoomManager showForge={true} />
  </div>
);
```

If NexusRoomManager is inside a conditional (like `{roomStatus === 'idle' && <NexusRoomManager />}`), MOVE IT OUT. See fix pattern below.

**Step 2**: Verify effect dependencies
```javascript
// File: components/NexusRoomManager.js
// The broadcast effect should depend on roomStatus and customGame:

useEffect(() => {
  if (!isHost) return;
  
  if (roomStatus === 'playing') {
    // Send start-game to all guests
    connections.current
      .filter(c => c.open)
      .forEach(conn => {
        conn.send({
          type: 'start-game',
          status: roomStatus,
          customGame: customGame,
          gameMode: gameMode
        });
      });
  }
}, [roomStatus, customGame, gameMode, isHost]);  // ← Must include these
```

If effect dependencies are missing `roomStatus` or `customGame`, add them.

**Step 3**: Verify effect is firing
Add debug logging:
```javascript
useEffect(() => {
  console.log('🔍 Broadcast effect fired, roomStatus:', roomStatus, 'isHost:', isHost);
  // ... rest of effect
}, [roomStatus, customGame, gameMode, isHost]);
```

Open dev console on HOST side. Click START. Do you see the log? 
- YES → Go to Phase 2A Step 4
- NO → NexusRoomManager may be unmounted. Check DOM: DevTools → Elements → search for "NexusRoomManager"

**Step 4**: Verify broadcast actually sends
Enhance logging:
```javascript
const activeConnections = connections.current.filter(c => c.open);
console.log('📡 Sending to', activeConnections.length, 'connections');

activeConnections.forEach((conn, i) => {
  try {
    conn.send({...message});
    console.log(`✅ Sent to connection ${i}`);
  } catch (e) {
    console.error(`❌ Send failed for connection ${i}:`, e);
  }
});
```

**Step 5**: Verify guest receives (on GUEST console)
```javascript
// File: app/games/ai-forge/page.js (on guest side)
conn.on('data', (data) => {
  console.log('📥 Guest received:', data.type, data);
  if (data.type === 'start-game') {
    // Handle it
  }
});
```

Open dev console on GUEST side. Do you see "📥 Guest received: start-game"?
- YES → Go to Step 6 (guest state update)
- NO → Connection might not be registered. Go to Phase 2C

**Step 6**: Verify guest updates state
```javascript
if (data.type === 'start-game') {
  console.log('🎮 Setting roomStatus to:', data.status);
  setRoomStatus(data.status);
  console.log('🎮 Setting customGame to:', data.customGame.gameTitle);
  setCustomGame(data.customGame);
}
```

Check GUEST console: Do you see "🎮 Setting roomStatus to: playing"?
- YES → Guest state was updated. If screen not showing, it's a render bug (check render condition)
- NO → Message arrived but not processed. Check if `if (data.type === 'start-game')` condition is correct

---

### Phase 2B: Repeated State Broadcasts (Textarea Clearing)

**Step 1**: Check for retry loop
```javascript
// File: components/NexusRoomManager.js
// Search for setInterval, setTimeout with broadcast

// ❌ BAD: This causes the problem
useEffect(() => {
  const interval = setInterval(() => {
    connections.current.forEach(conn => {
      conn.send({type: 'start-game', ...state});  // Sends every 2 seconds!
    });
  }, 2000);
  
  return () => clearInterval(interval);
}, []);
```

If you find a retry loop, mark it for removal (Phase 3 fix below).

**Step 2**: Check broadcast effect strategy
```javascript
// ✅ GOOD: Two-layer effect system

// Layer 1: MONITOR - fires when state changes
useEffect(() => {
  if (roomStatus === 'playing') {
    setTriggerBroadcast(prev => prev + 1);
  }
}, [roomStatus]);

// Layer 2: USE - fires when triggered
useEffect(() => {
  if (triggerBroadcast > 0 && roomStatus === 'playing') {
    connections.current.filter(c => c.open).forEach(conn => {
      conn.send({type: 'start-game', ...});
    });
  }
}, [triggerBroadcast]);
```

If you have `setInterval` or a 2-second retry, proceed to Phase 3 (fix).

---

### Phase 2C: Guest Never Receives Welcome

**Step 1**: Check if guest JOIN message is sent
```javascript
// On GUEST side, when joining room:
peer.connect(hostPeerId);  // Start connection

// Should trigger this:
peer.on('connection', (conn) => {
  console.log('✅ Host received connection');
  conn.send({type: 'join', name: playerName});
  console.log('📤 Guest sent JOIN');
});
```

Check guest console for "📤 Guest sent JOIN". If not sending:
- Peer not initialized? Check `new Peer(...)` call
- Room ID wrong? Should be `Nexus-{roomId}`

**Step 2**: Check if host receives JOIN on correct event
```javascript
// File: components/NexusRoomManager.js
// Host side:

peer.on('connection', (conn) => {
  conn.on('data', (data) => {
    console.log('📥 Host received:', data.type);
    
    if (data.type === 'join') {
      console.log('✅ Registration triggered');
      connections.current.push(conn);  // ← Must be INSIDE this if block
      
      conn.send({
        type: 'welcome',
        roomStatus: roomStatus,
        customGame: customGame
      });
      console.log('📤 Host sent welcome');
    }
  });
});
```

Check host console: Do you see "✅ Registration triggered"?
- YES → Go to Step 3
- NO → Either JOIN not received or 'data' event not set up. Verify connection setup.

**Step 3**: Verify registered connection is OPEN
```javascript
console.log('Connections:', connections.current.map(c => ({
  peerId: c.peer,
  open: c.open,
  dataChannel: c._pc?.connectionState
})));
```

Look for `open: 1` (true) for all connections.
- All 1? → Connection is ready. Go to Step 4
- Some 0? → Connection not fully open yet. Might be timing issue.

**Step 4**: Verify host welcome is actually sent
```javascript
try {
  conn.send({type: 'welcome', roomStatus, customGame});
  console.log('✅ Welcome sent successfully');
} catch (e) {
  console.error('❌ Welcome send failed:', e);
}
```

Check host console. Did welcome send succeed?
- YES → Go to guest side checking
- NO → Connection.send() failed. Might be closed between registration and send.

**Step 5**: Check guest receives welcome
```javascript
// Guest side:
peer.on('connection', (conn) => {
  conn.on('data', (data) => {
    if (data.type === 'welcome') {
      console.log('🎉 Guest received welcome');
      setRoomStatus(data.roomStatus);
      setCustomGame(data.customGame);
    }
  });
});
```

Check guest console: "🎉 Guest received welcome"?
- YES → State should be updated, check render condition
- NO → Message never arrived despite host sending. Network issue or delivery failure.

---

### Phase 2D: Some Guests Receive Updates, Others Don't

**Step 1**: Check connection pool size vs actual guests
```javascript
console.log(`Connected: ${connections.current.length}, Open: ${connections.current.filter(c => c.open).length}`);
```

If connected count < number of guests, not all guests registered in pool.

**Step 2**: Check filtering for open connections
```javascript
// ❌ WRONG: Sends to all connections regardless of state
connections.current.forEach(conn => conn.send(msg));

// ✅ RIGHT: Only open connections
connections.current.filter(c => c.open).forEach(conn => {
  try {
    conn.send(msg);
  } catch (e) {
    console.error('Send failed');
  }
});
```

Ensure code uses filter + try/catch.

**Step 3**: Check individual send errors
```javascript
connections.current.filter(c => c.open).forEach((conn, i) => {
  try {
    conn.send(msg);
    console.log(`✅ Sent to guest ${i}`);
  } catch (e) {
    console.error(`❌ Send to guest ${i} failed:`, e);
  }
});
```

Do all sends succeed, or do some fail?
- Some fail → Connections might be in process of closing
- All succeed but some guests don't receive → Network delivery issue (rare)

---

### Phase 2E: Guest Sees Stale Data

**Step 1**: Check message contains all required fields
```javascript
conn.send({
  type: 'start-game',
  status: 'playing',        // ← Required
  customGame: customGame,   // ← Required (full game object)
  gameMode: gameMode,       // ← Required
  timestamp: Date.now()     // ← For ordering
});
```

Missing fields? Add them.

**Step 2**: Check if multiple messages sent in sequence
```javascript
// ❌ WRONG and out-of-order prone:
conn.send({type: 'status-update', status: 'playing'});
conn.send({type: 'game-update', customGame: game});
conn.send({type: 'mode-update', mode: gameMode});

// ✅ RIGHT and atomic:
conn.send({
  type: 'start-game',
  status: 'playing',
  customGame: game,
  gameMode: gameMode
});
```

If sending in sequence, combine into single message.

**Step 3**: Verify guest processes ALL fields from message
```javascript
if (data.type === 'start-game') {
  console.log('Before update - roomStatus:', roomStatus, 'game:', customGame?.gameTitle);
  
  setRoomStatus(data.status);
  setCustomGame(data.customGame);
  setGameMode(data.gameMode);
  
  console.log('After update - roomStatus:', data.status, 'game:', data.customGame?.gameTitle);
}
```

Does guest log show both roomStatus AND customGame updating?
- YES → State correct. Check if it re-renders (UI showing updated data?)
- NO → One of the updates not happening. Check if setState calls are actually executed.

---

## Phase 3: Common Fixes

### Fix 1: Move NexusRoomManager Out of Conditionals
```javascript
// BEFORE (wrong):
{roomStatus === 'idle' && (
  <>
    <MainMenu />
    <NexusRoomManager showForge={true} />
  </>
)}

// AFTER (correct):
<div>
  {roomStatus === 'idle' && <MainMenu />}
  {roomStatus === 'playing' && <GameScreen />}
  
  {/* Always rendered */}
  <NexusRoomManager showForge={true} />
</div>
```

**Why**: NexusRoomManager unmounting breaks effect subscriptions.

---

### Fix 2: Register Connection After JOIN Message
```javascript
// BEFORE (wrong):
peer.on('connection', (conn) => {
  connections.current.push(conn);  // ❌ conn.open still false!
  
  conn.on('data', (data) => {...});
});

// AFTER (correct):
peer.on('connection', (conn) => {
  conn.on('data', (data) => {
    if (data.type === 'join') {
      connections.current.push(conn);  // ✅ Now open: true
      conn.send({type: 'welcome', ...});
    }
  });
});
```

**Why**: PeerJS 'connection' event fires before data channel opens.

---

### Fix 3: Replace Retry Loop with Two-Layer Effects
```javascript
// BEFORE (wrong):
useEffect(() => {
  const interval = setInterval(() => {
    connections.current.forEach(conn => {
      conn.send({type: 'start-game', ...state});  // Every 2 seconds → clears textarea!
    });
  }, 2000);
  
  return () => clearInterval(interval);
}, []);

// AFTER (correct):
// Layer 1: Monitor state changes
useEffect(() => {
  if (roomStatus === 'playing') {
    setTriggerBroadcast(prev => prev + 1);
  }
}, [roomStatus]);

// Layer 2: Execute broadcast when triggered
useEffect(() => {
  if (triggerBroadcast > 0 && roomStatus === 'playing') {
    connections.current.filter(c => c.open).forEach(conn => {
      try {
        conn.send({
          type: 'start-game',
          status: roomStatus,
          customGame: customGame
        });
      } catch(e) {
        console.error('Broadcast failed:', e);
      }
    });
  }
}, [triggerBroadcast, roomStatus, customGame]);
```

**Why**: Redundant effect layers ensure broadcast fires exactly once when state changes.

---

## Phase 4: Validation

After applying fix, run checklist:

- [ ] NexusRoomManager always rendered (check page render code)
- [ ] Connection registered after JOIN (check NexusRoomManager line ~260)
- [ ] Broadcast effect includes all dependencies (check useEffect dependencies)
- [ ] Broadcasting filters for open connections (check .filter(c => c.open))
- [ ] No retry loops (search for setInterval, setTimeout in NexusRoomManager)
- [ ] State sent atomically (one message, all fields)
- [ ] Guest receives and processes all fields
- [ ] Guest state updates reflected in UI

---

## Testing

1. **Start dev server**: `npm run dev`
2. **Host**: Visit `http://localhost:3000/games/ai-forge?mode=host&roomId=TEST`
3. **Guest**: Open another window/tab `http://localhost:3000/games/ai-forge?roomId=TEST`
4. **Host**: Click "START MISSION FOR ALL"
5. **Guest**: Should see game screen immediately (not frozen on "Waiting...")
6. **Guest**: Type in textarea → should NOT clear every 2 seconds

---

## References

- [Multiplayer Sync Guide](.github/docs/multiplayer-sync-guide.md) — Full PeerJS patterns
- [NexusRoomManager.js](components/NexusRoomManager.js) — Orchestration code
- [ai-forge/page.js](app/games/ai-forge/page.js) — Integration point
