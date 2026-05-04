import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Haptics, ImpactStyle } from '../lib/haptics';
import { RoomMessageType } from '../lib/roomProtocol';

export function useNexusTransport({
  isHost,
  playerName,
  targetId,
  setTargetId,
  setSubmissions,
  connections,
  hostConnection
}) {
  const {
    setRoomId,
    setHost,
    setHostName,
    setPlayers,
    setGameMode,
    setRoomStatus,
    setCustomGame,
    setRoundVerdict,
    setLocalEvaluation,
    setRoomScores,
    resetRoom,
    roomStatus,
    customGame,
    gameMode
  } = useGameStore();

  const [peer, setPeer] = useState(null);
  const [status, setStatus] = useState('Disconnected');
  const [triggerBroadcast, setTriggerBroadcast] = useState(0);
  const lastStartGameTime = useRef(0);

  const hapticFeedback = async (style = ImpactStyle.Medium) => {
    try { await Haptics.impact({ style }); } catch (e) {}
  };

  const broadcastRoomAction = (actionData = {}, nextStatus, excludePeer) => {
    const currentGame = useGameStore.getState().customGame || {};
    let mergedActionData = actionData;

    if (actionData.blitzResult) {
      const currentResults = currentGame.blitzResults || [];
      const otherResults = currentResults.filter(result => result.name !== actionData.blitzResult.name);
      mergedActionData = {
        ...actionData,
        blitzResults: [...otherResults, actionData.blitzResult].sort((a, b) => b.score - a.score)
      };
      delete mergedActionData.blitzResult;
    }

    const updatedGame = {
      ...currentGame,
      ...mergedActionData
    };

    setCustomGame(updatedGame);
    if (nextStatus) setRoomStatus(nextStatus);

    connections.current.filter(c => c.open && c.peer !== excludePeer).forEach(conn => {
      try {
        conn.send({
          type: RoomMessageType.GAME_ACTION,
          actionData,
          customGame: updatedGame,
          roomStatus: nextStatus,
          timestamp: Date.now()
        });
      } catch (e) {}
    });
  };

  const handleJoin = (idToJoin, activePeer) => {
    const p = activePeer || peer;
    const id = idToJoin || targetId;
    if (!id || !p || !playerName) return;
    const targetPeerId = id.startsWith('Nexus-') ? id : `Nexus-${id}`;
    setStatus('Connecting...');
    const conn = p.connect(targetPeerId);
    
    const timeout = setTimeout(() => {
      if (!hostConnection.current) {
        setStatus('Ready');
        alert("Connection timed out.");
      }
    }, 10000);

    conn.on('open', () => {
      clearTimeout(timeout);
      conn.send({ type: RoomMessageType.JOIN, name: playerName });
      setRoomId(id.replace('Nexus-', ''));
      setHost(false);
      hostConnection.current = conn; 
      setStatus('Player Connected');
      hapticFeedback();

      conn.on('data', (data) => {
        if (data.type === RoomMessageType.WELCOME) {
          setGameMode(data.gameMode);
          setPlayers(data.players);
          setHostName(data.hostName);
          setRoomStatus(data.roomStatus);
          if (data.customGame) setCustomGame(data.customGame);
        }
        if (data.type === RoomMessageType.PLAYER_LIST_UPDATE) {
          setPlayers(data.players);
          setHostName(data.hostName);
        }
        if (data.type === RoomMessageType.START_GAME) {
          setCustomGame(data.customGame);
          setGameMode(data.gameMode);
          setRoomStatus(data.status);
          setRoundVerdict(null);
          setLocalEvaluation(null);
          hapticFeedback(ImpactStyle.Heavy);
        }
        if (data.type === RoomMessageType.ROOM_STATUS_UPDATE) {
          setRoomStatus(data.status);
        }
        if (data.type === RoomMessageType.MODE_UPDATE) {
          setGameMode(data.mode);
        }
        if (data.type === RoomMessageType.NEW_CUSTOM_GAME) {
          setCustomGame(data.game);
          setRoundVerdict(null);
          setLocalEvaluation(null);
          hapticFeedback(ImpactStyle.Medium);
        }
        if (data.type === RoomMessageType.ROUND_VERDICT) {
          setRoundVerdict(data.verdict);
        }
        if (data.type === RoomMessageType.BATCH_RESULTS) {
          setRoomScores(data.results);
          setRoomStatus('finished');
          const myResult = data.results.find(r => r.name === playerName);
          if (myResult) {
            setLocalEvaluation(myResult);
          }
        }
        if (data.type === RoomMessageType.NPATM_STOP) {
          setCustomGame(data.customGame);
          hapticFeedback(ImpactStyle.Heavy);
        }
        if (data.type === RoomMessageType.GAME_ACTION) {
          setCustomGame(data.customGame || {
            ...useGameStore.getState().customGame,
            ...data.actionData
          });
          if (data.roomStatus) setRoomStatus(data.roomStatus);
          hapticFeedback(ImpactStyle.Light);
        }
      });

      conn.on('close', () => {
        hostConnection.current = null;
        setStatus('Ready');
        alert('Disconnected from host.');
      });
    });

    conn.on('error', (err) => {
      hostConnection.current = null;
      setStatus('Ready');
      alert("Host not found.");
    });
  };

  const initPeer = (idAsHost) => {
    if (peer) return;
    import('peerjs').then(({ Peer }) => {
      const peerId = idAsHost ? `Nexus-${idAsHost}` : undefined;
      const newPeer = new Peer(peerId);
      
      newPeer.on('open', (id) => {
        setPeer(newPeer);
        setStatus('Ready');
        const urlParams = new URLSearchParams(window.location.search);
        const joinId = urlParams.get('join');
        if (!idAsHost && (joinId || targetId)) handleJoin(joinId || targetId, newPeer);
      });

      newPeer.on('connection', (conn) => {
        hapticFeedback(ImpactStyle.Heavy);
        conn.on('data', (data) => {
          if (data.type === RoomMessageType.JOIN) {
            const currentPlayers = useGameStore.getState().players || [];
            const newPlayer = { peerId: conn.peer, name: data.name };
            const updatedPlayers = [...currentPlayers, newPlayer];
            setPlayers(updatedPlayers);
            
            conn.send({ 
              type: RoomMessageType.WELCOME, 
              roomId: idAsHost, 
              gameMode: useGameStore.getState().gameMode,
              players: updatedPlayers,
              hostName: useGameStore.getState().playerName,
              roomStatus: useGameStore.getState().roomStatus,
              customGame: useGameStore.getState().customGame
            });

            connections.current.forEach(c => {
              if (c.peer !== conn.peer) {
                c.send({ type: RoomMessageType.PLAYER_LIST_UPDATE, players: updatedPlayers, hostName: useGameStore.getState().playerName });
              }
            });
            
            if (!connections.current.find(c => c.peer === conn.peer)) {
              connections.current.push(conn);
              setStatus('Player Connected');
            }
          }
          if (data.type === RoomMessageType.SUBMIT_RAW) {
            setSubmissions(prev => {
              const existing = prev.find(s => s.name === data.name);
              if (existing) {
                return prev.map(s => s.name === data.name ? { name: data.name, submission: data.submission } : s);
              }
              return [...prev, { name: data.name, submission: data.submission }];
            });
            hapticFeedback(ImpactStyle.Light);
          }
          if (data.type === RoomMessageType.GAME_ACTION) {
            let newGame = data.customGame;
            if (!newGame) {
                const oldGame = useGameStore.getState().customGame || {};
                newGame = { ...oldGame, ...data.actionData };
                if (data.actionData.newPath) {
                    newGame.paths = [...(oldGame.paths || []), data.actionData.newPath];
                    delete newGame.newPath;
                }
            }

            setCustomGame(newGame);
            if (data.roomStatus) setRoomStatus(data.roomStatus);
            hapticFeedback(ImpactStyle.Light);
            broadcastRoomAction(data.actionData, data.roomStatus, conn.peer);
          }
          if (data.type === RoomMessageType.NPATM_SUBMIT) {
            if (data.action === 'STOP') {
              setCustomGame({
                ...useGameStore.getState().customGame,
                stopPressedBy: data.name
              });
              hapticFeedback(ImpactStyle.Heavy);
            }
          }
        });
        
        conn.on('close', () => {
          connections.current = connections.current.filter(c => c !== conn);
          setStatus('Player Disconnected');
        });
        
        conn.on('error', (err) => {
          connections.current = connections.current.filter(c => c !== conn);
        });
      });

      newPeer.on('error', (err) => {
        console.error("PeerJS Error:", err);
        if (err.type === 'unavailable-id') {
          alert("Room ID already taken.");
          resetRoom();
        } else {
          setStatus('Error');
        }
      });
    });
  };

  const createRoom = () => {
    if (!playerName) return alert("Enter a nickname first!");
    const id = Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomId(id);
    setHost(true);
    setHostName(playerName);
    initPeer(id);
    hapticFeedback();
  };

  const joinRoom = () => {
    if (!playerName) return alert("Enter nickname first!");
    const urlParams = new URLSearchParams(window.location.search);
    const joinId = urlParams.get('join');
    if (!targetId && !joinId && !peer) return alert("Enter Room ID!");
    if (!peer) initPeer(); 
    else handleJoin(joinId || targetId);
  };

  // Main broadcast effect - triggers on state changes
  useEffect(() => {
    if (!isHost) return;

    if (roomStatus === 'playing') {
      const now = Date.now();
      // Only broadcast START_GAME once per round, unless explicitly triggered
      if (lastStartGameTime.current === 0) {
        const activeConnections = connections.current.filter(c => c.open);
        lastStartGameTime.current = now;
        
        if (activeConnections.length > 0) {
          activeConnections.forEach(conn => {
            try {
              conn.send({ 
                type: RoomMessageType.START_GAME, 
                status: 'playing',
                customGame: customGame,
                gameMode: gameMode,
                timestamp: now
              });
            } catch (e) {}
          });
        }
      }
    } else {
      lastStartGameTime.current = 0;
      connections.current.forEach(conn => {
        if (conn.open) {
          try {
            conn.send({ type: RoomMessageType.ROOM_STATUS_UPDATE, status: roomStatus });
            if (customGame) conn.send({ type: RoomMessageType.NEW_CUSTOM_GAME, game: customGame });
            conn.send({ type: RoomMessageType.MODE_UPDATE, mode: gameMode });
          } catch (e) {}
        }
      });
    }
  }, [roomStatus, isHost]); // Only trigger on roomStatus changes

  // ... (keep the explicit triggers below but scoped) ...

  // MONITOR roomStatus changes - trigger broadcast when becomes 'playing'
  useEffect(() => {
    if (isHost && roomStatus === 'playing') {
      setTriggerBroadcast(prev => prev + 1);
    }
  }, [roomStatus, isHost]);

  // USE the trigger to force explicit broadcast
  useEffect(() => {
    if (!isHost || roomStatus !== 'playing') return;
    if (triggerBroadcast === 0) return;
    
    const activeConnections = connections.current.filter(c => c.open);

    if (activeConnections.length > 0) {
      activeConnections.forEach(conn => {
        try {
          conn.send({ 
            type: RoomMessageType.START_GAME, 
            status: 'playing',
            customGame: customGame,
            gameMode: gameMode,
            timestamp: Date.now()
          });
        } catch (e) {}
      });
    }
  }, [isHost, triggerBroadcast, customGame, gameMode]);

  // IMMEDIATE broadcast when roomStatus becomes 'playing'
  useEffect(() => {
    if (!isHost) return;
    
    if (roomStatus === 'playing') {
      const activeConnections = connections.current.filter(c => c.open);

      if (activeConnections.length > 0) {
        activeConnections.forEach(conn => {
          try {
            conn.send({ 
              type: RoomMessageType.START_GAME, 
              status: 'playing',
              customGame: customGame,
              gameMode: gameMode,
              timestamp: Date.now()
            });
          } catch (e) {}
        });
      }
    }
  }, [isHost, roomStatus]);

  const leaveRoom = () => {
    if (isHost) {
      connections.current.forEach(conn => {
        if (conn.open) {
          try {
            conn.send({ type: RoomMessageType.ROOM_STATUS_UPDATE, status: 'idle' });
          } catch (e) {}
        }
      });
    } else if (hostConnection.current) {
      try {
        hostConnection.current.close();
      } catch (e) {}
    }

    if (peer) {
      try {
        peer.destroy();
      } catch (e) {}
    }

    setPeer(null);
    hostConnection.current = null;
    connections.current = [];
    resetRoom();
    setStatus('Disconnected');
  };

  return {
    status,
    createRoom,
    joinRoom,
    leaveRoom,
    broadcastRoomAction
  };
}
