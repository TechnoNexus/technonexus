# Multiplayer Synchronization Guide

## Overview

This guide documents PeerJS connection patterns, state synchronization strategies, and the critical lifecycle patterns discovered during TechnoNexus development.

**CRITICAL CONTEXT**: These patterns were derived through production debugging on April 5-6, 2026. Follow them religiously to avoid regressions.

---

## PeerJS Room Lifecycle

```
HOST                          GUEST
├─ createPeer()              
├─ await peer.open()         
│  
├─ host-click: START          
│                             ├─ getPeer(roomId)
│                             ├─ genConnection = peer.connect()
│                             ├─ send 'join' message
│                             │
├─ receive 'join' message     
├─ register connection        ├─ connectionOpen = true
│  (ONLY after JOIN!)         
│                             ├─ receive 'welcome'
├─ game-start-click           ├─ roomStatus = 'playing'
│                             ├─ customGame = game data
├─ broadcast 'start-game'     ├─ show game screen ✅
│  to all connections         
│  
├─ game submission received   ├─ send submission
│  from each guest → score    ├─ await score
│                             
├─ broadcast final scores     ├─ display leaderboard
```

---

## Connection Pool Pattern

**File**: `components/NexusRoomManager.js` (lines 230-280)

### ✅ Correct Pattern: Register After JOIN

```javascript
// Create the peer connection
peer.on('connection', (conn) => {
  // ❌ WRONG: Don't add to pool here! Connection not ready yet
  // connections.current.push(conn);

  // Set up message handler
  conn.on('data', (data) => {
    if (data.type === 'join') {
      // ✅ RIGHT: Only after JOIN message proves bidirectional communication
      connections.current.push(conn);
      console.log('✅ Connection registered after JOIN');
      
      // Send welcome with current game state
      conn.send({
        type: 'welcome',
        roomStatus: roomStatus,
        customGame: customGame,
        players: getPlayerList()
      });
    }
  });
});
```

### Why This Matters

The PeerJS `'connection'` event fires **BEFORE** the data channel is fully open. If you try to send immediately, the connection may have `open: false`.

**Before Fix (April 5)**:
```javascript
// BUG: connections.current had conn but conn.open === false
// Send attempt: conn.send() → no error, but message never arrives
connections.current = [
  { peerId: 'guest-1', open: 0, send: (...) }  // ❌ open: 0
]
```

**After Fix (April 5)**:
```javascript
// GOOD: connections.current only contains fully open connections
connections.current = [
  { peerId: 'guest-1', open: 1, send: (...) }  // ✅ open: 1
]
```

---

## State Broadcasting Pattern

### Rule 1: Host is Single Source of Truth

Only the HOST broadcasts state. Guests NEVER broadcast.

### Rule 2: Host Relay for Guest Actions

In games where guests initiate real-time state changes (like Pictionary drawing), the host must relay the guest's action to all other participants.

```javascript
// In NexusRoomManager, host's data handler
if (data.type === 'game-action') {
  // 1. Update local state
  applyRoomAction(data.actionData, data.roomStatus);

  // 2. RELAY to all OTHER guests
  // Use excludePeer to avoid echoing back to the sender
  broadcastRoomAction(data.actionData, data.roomStatus, conn.peer);
}
```

### Rule 3: Atomic Updates

Never send state in multiple messages. Combine into one:

```javascript
// ❌ WRONG: Multiple messages
conn.send({ type: 'status-update', status: 'playing' });
conn.send({ type: 'game-update', customGame: game });
conn.send({ type: 'mode-update', gameMode: 'team' });
// Problem: Messages can arrive out of order, causing inconsistent state

// ✅ RIGHT: Single atomic message
conn.send({
  type: 'start-game',
  status: 'playing',
  customGame: game,
  gameMode: 'team'
});
```

### Rule 3: Filter by Connection State

Always verify connection is open before sending:

```javascript
// ❌ WRONG
connections.current.forEach(conn => {
  conn.send(message);  // conn might be closed!
});

// ✅ RIGHT
connections.current
  .filter(c => c.open)  // Only open connections
  .forEach(conn => {
    try {
      conn.send(message);
    } catch (e) {
      console.error('Send failed:', e);
    }
  });
```

---

## Message Type Catalog

All message types sent between host and guests:

| Type | Direction | Payload | Purpose |
|------|-----------|---------|---------|
| `join` | Guest→Host | `{ name, peerId }` | Guest asks to join |
| `welcome` | Host→Guest | `{ roomStatus, customGame, players }` | Host confirms join |
| `start-game` | Host→Guest | `{ status, customGame, gameMode, timestamp }` | Game starts |
| `player-joined` | Host→Guest | `{ player: { peerId, name } }` | New player joined |
| `submission` | Guest→Host | `{ content, timestamp }` | Guest submits answer |
| `scores` | Host→Guest | `{ scores: [...] }` | Final round scores |
| `leaderboard-update` | Host→Guest | `{ leaderboard: [...] }` | Global wins tracking |
| `error` | Host→Guest | `{ code, message }` | Something failed |

---

## Component Lifecycle Pattern

### ✅ Correct: Always Mounted

**File**: `app/games/ai-forge/page.js` (line 555)

```javascript
export default function AIForgePage() {
  // ... component logic ...

  return (
    <div className="game-container">
      {/* Conditional UI rendering - OK */}
      {roomStatus === 'idle' && <MainMenu />}
      {roomStatus === 'playing' && <GameScreen />}
      {roomStatus === 'finished' && <ScoreScreen />}

      {/* ✅ CRITICAL: NexusRoomManager ALWAYS mounted */}
      {/* NEVER inside conditionals! */}
      <NexusRoomManager showForge={true} />
    </div>
  );
}
```

### ❌ Wrong: Conditional Mount (Causes Bug)

```javascript
export default function AIForgePage() {
  return (
    <div>
      {/* ❌ WRONG: Component unmounts/remounts when state changes */}
      {roomStatus === 'idle' && (
        <>
          <MainMenu />
          <NexusRoomManager />  {/* Remounts when roomStatus changes! */}
        </>
      )}
      
      {roomStatus === 'playing' && (
        <GameScreen />
      )}
    </div>
  );
}
```

**Why This Happens**:
1. Component renders when roomStatus = 'idle' + NexusRoomManager mounts
2. In NexusRoomManager, effects subscribe: `useEffect(() => {...}, [roomStatus])`
3. Host clicks START → setState(roomStatus = 'playing')
4. Component re-renders, conditional changes to false
5. NexusRoomManager UNMOUNTS
6. All effects unsubscribe
7. No messages broadcast to guests ❌
8. Guest sees frozen "Waiting for host..." screen 🐛

**Solution**: Keep NexusRoomManager ALWAYS rendered, outside all conditionals. Let it sit idle when roomStatus !== 'playing'.

---

## Connection Cleanup Pattern

### Handle Disconnections Gracefully

```javascript
// In NexusRoomManager
conn.on('close', () => {
  connections.current = connections.current.filter(
    c => c !== conn
  );
  console.log('Guest disconnected, pool size:', connections.current.length);
});

conn.on('error', (err) => {
  console.error('Connection error:', err);
  // Optionally remove from pool
});
```

### Handle Browser Close

```javascript
// Fallback for when peer is destroyed
const cleanup = () => {
  connections.current.forEach(c => {
    try {
      c.close();
    } catch (e) {
      // Already closed
    }
  });
  connections.current = [];
};

useEffect(() => {
  window.addEventListener('beforeunload', cleanup);
  return () => window.removeEventListener('beforeunload', cleanup);
}, []);
```

---

## State Reconciliation Pattern

What if a guest lag-joins after game starts?

```javascript
// Guest sends JOIN late
if (data.type === 'join') {
  connections.current.push(conn);
  
  // ✅ Send CURRENT state, not initial state
  conn.send({
    type: 'welcome',
    roomStatus: roomStatus,       // 'playing', not 'idle'
    customGame: customGame,       // Current game, not null
    players: getPlayerList(),
    isLateJoin: true             // Flag it so guest UI adapts
  });
}
```

Guest receives and updates:
```javascript
conn.on('data', (data) => {
  if (data.type === 'welcome') {
    setRoomStatus(data.roomStatus);    // Sets to 'playing'
    setCustomGame(data.customGame);    // Sets game data
    
    if (data.isLateJoin) {
      // Skip intro, go straight to game screen
      console.log('Late join - skipping intro');
    }
  }
});
```

---

## Error Handling Patterns

### Pattern 1: Silent Failures

PeerJS can fail silently (message never arrives, no error thrown).

```javascript
// Send with timeout check
let received = false;

conn.send(message);
setTimeout(() => {
  if (!received) {
    console.warn('Message likely failed to send');
    // Optionally retry or notify user
  }
}, 3000);

// Mark received when guest confirms
conn.on('data', (data) => {
  if (data.type === 'acknowledgement') {
    received = true;
  }
});
```

### Pattern 2: Retry Strategy (Use Sparingly)

```javascript
// ❌ DON'T use 2-second retry loop (causes textarea clearing)
// Instead, rely on multiple effect layers:

// Layer 1: MONITOR effect (detects state change)
useEffect(() => {
  if (roomStatus === 'playing') {
    setTriggerBroadcast(prev => prev + 1);  // Force Layer 2 to run
  }
}, [roomStatus]);

// Layer 2: USE effect (fires when triggered)
useEffect(() => {
  if (triggerBroadcast > 0 && roomStatus === 'playing') {
    broadcastToAllGuests({
      type: 'start-game',
      status: roomStatus,
      customGame: customGame
    });
  }
}, [triggerBroadcast]);
```

---

## Debugging Checklist

When multiplayer sync fails:

- [ ] Check if `connections.current.length > 0` (any guests connected?)
- [ ] Check if connections have `open: 1` (actually open?)
- [ ] Check if NexusRoomManager mounted (examine DOM, not just render logic)
- [ ] Check if effect dependencies include `roomStatus`, `customGame` (will it fire on change?)
- [ ] Check message type (did host send `start-game` vs just `status-update`?)
- [ ] Check console for errors (`conn.send() failed`, etc.)
- [ ] Verify guest received message (check guest's `conn.on('data')`)
- [ ] Check if guest updated state with received data (did `setRoomStatus('playing')` run?)
- [ ] Verify guest re-rendered with new state (does UI show game screen?)

---

## Performance Considerations

### Don't Broadcast Every Keystroke

```javascript
// ❌ WRONG: Updates connection pool on every keystroke
const handleInputChange = (text) => {
  setCustomText(text);
  broadcastToGuests({ type: 'text-update', text });  // Every keystroke!
};

// ✅ RIGHT: Batch updates, send on submit
const handleInputChange = (text) => {
  setCustomText(text);  // Local state only
};

const handleSubmit = () => {
  broadcastToGuests({ type: 'submission', text: customText });
};
```

### Batch Evaluations

```javascript
// ❌ WRONG: 10 separate API calls (slow, rate-limited)
guests.forEach(guest => {
  evaluateSubmissionAPI(guest.submission);
});

// ✅ RIGHT: One batch API call
const allSubmissions = guests.map(g => g.submission);
evaluateBatchAPI(allSubmissions);  // Single request
```

---

## Testing Checklist

Before pushing multiplayer changes:

- [ ] Test host create room → guest join (basic connection)
- [ ] Test host start game → guest sees game screen (state sync)
- [ ] Test guest submit → host receives (reverse channel)
- [ ] Test 2+ guests → all see updates (multi-guest broadcast)
- [ ] Test guest disconnect mid-game → host continues
- [ ] Test host disconnect → guests see error
- [ ] Test late join after game started → guest sees current state
- [ ] Test rapid state changes (click START multiple times) → no duplicates
- [ ] Test on different networks (WiFi + cellular) → works both

---

## Future Improvements

- [ ] **Reconnection**: Auto-reconnect guests if connection drops
- [ ] **Compression**: Compress large game JSON before sending
- [ ] **Encryption**: End-to-end encryption for hosted rooms
- [ ] **Analytics**: Track connection quality, message delivery rate
- [ ] **Fallback**: Signal server for relay if direct P2P fails

