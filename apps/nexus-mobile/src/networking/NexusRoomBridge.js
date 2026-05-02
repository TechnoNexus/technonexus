import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { PEERJS_SOURCE } from './peerjs';

const createBridgeHtml = () => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script>${PEERJS_SOURCE}</script>
    <script>
      let peer = null;
      let hostConnection = null;
      let hostSnapshot = {
        roomStatus: 'idle',
        customGame: null,
        gameMode: 'individual',
        hostName: ''
      };

      const registeredConnections = [];
      const playerNames = {};

      function sendMessageToNative(action, data) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ action, data }));
      }

      function safeParse(raw) {
        try {
          return JSON.parse(raw);
        } catch (error) {
          return null;
        }
      }

      function resetBridgeState() {
        registeredConnections.splice(0, registeredConnections.length);
        Object.keys(playerNames).forEach((key) => delete playerNames[key]);
        hostConnection = null;
        hostSnapshot = {
          roomStatus: 'idle',
          customGame: null,
          gameMode: 'individual',
          hostName: ''
        };
      }

      function getGuestPlayers() {
        return Object.keys(playerNames)
          .filter((peerId) => !peer || peerId !== peer.id)
          .map((peerId) => ({
            peerId,
            name: playerNames[peerId]
          }));
      }

      function updateHostSnapshot(snapshotString) {
        const nextSnapshot = safeParse(snapshotString);
        if (!nextSnapshot) return;

        hostSnapshot = {
          ...hostSnapshot,
          ...nextSnapshot
        };

        if (peer && peer.id && hostSnapshot.hostName) {
          playerNames[peer.id] = hostSnapshot.hostName;
        }
      }

      function broadcastToGuests(payload, excludePeer) {
        registeredConnections
          .filter((conn) => conn.open && conn.peer !== excludePeer)
          .forEach((conn) => {
            try {
              conn.send(payload);
            } catch (error) {}
          });
      }

      function broadcastPlayerList(excludePeer) {
        broadcastToGuests(
          {
            type: 'player-list-update',
            players: getGuestPlayers(),
            hostName: hostSnapshot.hostName || ''
          },
          excludePeer
        );
      }

      function removeRegisteredConnection(conn) {
        const index = registeredConnections.findIndex((item) => item.peer === conn.peer);
        if (index > -1) {
          registeredConnections.splice(index, 1);
        }
      }

      function unregisterConnection(conn, reason) {
        const name = playerNames[conn.peer];
        removeRegisteredConnection(conn);

        if (conn.peer && playerNames[conn.peer]) {
          delete playerNames[conn.peer];
        }

        broadcastPlayerList();

        sendMessageToNative('player-left', {
          peer: conn.peer,
          name,
          reason: reason || 'close',
          players: getGuestPlayers()
        });
      }

      function registerConnection(conn, joinPayload) {
        playerNames[conn.peer] = joinPayload.name || conn.peer;

        if (!registeredConnections.find((item) => item.peer === conn.peer)) {
          registeredConnections.push(conn);
        }

        try {
          conn.send({
            type: 'welcome',
            roomId: peer && peer.id ? peer.id.replace(/^Nexus-/, '') : '',
            roomStatus: hostSnapshot.roomStatus || 'idle',
            customGame: hostSnapshot.customGame || null,
            gameMode: hostSnapshot.gameMode || 'individual',
            hostName: hostSnapshot.hostName || '',
            players: getGuestPlayers(),
            timestamp: Date.now()
          });
        } catch (error) {}

        broadcastPlayerList(conn.peer);

        sendMessageToNative('player-joined', {
          peer: conn.peer,
          name: playerNames[conn.peer],
          players: getGuestPlayers()
        });
      }

      function wireConnection(conn, isIncoming) {
        conn.on('open', () => {
          sendMessageToNative(
            isIncoming ? 'connection-open' : 'connectedToHost',
            { peer: conn.peer }
          );
        });

        conn.on('data', (data) => {
          if (isIncoming && data && data.type === 'join') {
            registerConnection(conn, data);
            return;
          }

          sendMessageToNative('data', { peer: conn.peer, payload: data });
        });

        conn.on('close', () => {
          if (hostConnection && hostConnection === conn) {
            hostConnection = null;
            sendMessageToNative('disconnectedFromHost', { peer: conn.peer });
          }

          unregisterConnection(conn, 'close');
          sendMessageToNative('close', { peer: conn.peer });
        });

        conn.on('error', (err) => {
          if (hostConnection && hostConnection === conn) {
            hostConnection = null;
          }

          unregisterConnection(conn, 'error');
          sendMessageToNative('error', {
            peer: conn.peer,
            type: err && err.type ? err.type : 'connection_error',
            message: err && err.message ? err.message : String(err || 'Unknown error')
          });
        });
      }

      function initPeer(id, playerName) {
        if (peer) {
          try {
            peer.destroy();
          } catch (error) {}
        }

        resetBridgeState();
        peer = new Peer(id);

        peer.on('open', (openedId) => {
          if (playerName) {
            playerNames[openedId] = playerName;
          }

          if (hostSnapshot.hostName && peer && peer.id) {
            playerNames[peer.id] = hostSnapshot.hostName;
          }

          if (window.__pendingConnectId) {
            connectToPeer(window.__pendingConnectId, playerName);
            window.__pendingConnectId = null;
          }

          sendMessageToNative('open', { id: openedId });
        });

        peer.on('connection', (conn) => {
          wireConnection(conn, true);
          sendMessageToNative('connection', { peer: conn.peer, open: conn.open });
        });

        peer.on('error', (err) => {
          sendMessageToNative('error', {
            type: err && err.type ? err.type : 'peer_error',
            message: err && err.message ? err.message : String(err || 'Unknown error')
          });
        });

        peer.on('close', () => {
          sendMessageToNative('peer-closed', {});
        });

        peer.on('disconnected', () => {
          sendMessageToNative('peer-disconnected', {});
        });
      }

      function connectToPeer(idToJoin, playerName) {
        if (!peer) return;

        const conn = peer.connect(idToJoin);
        hostConnection = conn;
        wireConnection(conn, false);

        conn.on('open', () => {
          if (peer && peer.id && playerName) {
            playerNames[peer.id] = playerName;
          }

          try {
            conn.send({
              type: 'join',
              name: playerName,
              peerId: peer && peer.id ? peer.id : ''
            });
          } catch (error) {}

          sendMessageToNative('connectedToHost', { id: idToJoin, peer: conn.peer });
        });
      }

      function broadcastData(dataString) {
        const data = safeParse(dataString);
        if (!data) return;
        broadcastToGuests(data);
      }

      function sendDataToHost(dataString) {
        const data = safeParse(dataString);
        if (!data) return;

        if (hostConnection && hostConnection.open) {
          try {
            hostConnection.send(data);
          } catch (error) {}
        }
      }

      function destroyRoom() {
        registeredConnections.forEach((conn) => {
          try {
            conn.close();
          } catch (error) {}
        });

        if (hostConnection) {
          try {
            hostConnection.close();
          } catch (error) {}
        }

        if (peer) {
          try {
            peer.destroy();
          } catch (error) {}
        }

        peer = null;
        resetBridgeState();
        sendMessageToNative('destroyed', {});
      }
    </script>
  </head>
  <body></body>
  </html>
`;

const NexusRoomBridge = forwardRef((props, ref) => {
  const webViewRef = useRef(null);
  const pendingScriptsRef = useRef([]);
  const [htmlUri, setHtmlUri] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setHtmlUri(createBridgeHtml());
  }, []);

  const inject = (script) => {
    if (!webViewRef.current || !isReady) {
      pendingScriptsRef.current.push(script);
      return false;
    }
    webViewRef.current.injectJavaScript(`${script}\ntrue;`);
    return true;
  };

  const pushHostSnapshot = (snapshot) => {
    if (!snapshot) return false;
    return inject(`updateHostSnapshot(${JSON.stringify(JSON.stringify(snapshot))});`);
  };

  useEffect(() => {
    if (props.hostSnapshot) {
      pushHostSnapshot(props.hostSnapshot);
    }
  }, [props.hostSnapshot, isReady]);

  useImperativeHandle(ref, () => ({
    createRoom: (playerName, initialSnapshot = {}) => {
      const id = Math.random().toString(16).substring(2, 6).toUpperCase();
      props.onRoomIdCreated && props.onRoomIdCreated(id);

      inject(`
        updateHostSnapshot(${JSON.stringify(JSON.stringify({
          roomStatus: 'idle',
          gameMode: 'individual',
          hostName: playerName,
          ...initialSnapshot
        }))});
        initPeer(${JSON.stringify(`Nexus-${id}`)}, ${JSON.stringify(playerName)});
      `);
    },
    joinRoom: (roomId, playerName) => {
      inject(`
        window.__pendingConnectId = ${JSON.stringify(`Nexus-${roomId}`)};
        initPeer(undefined, ${JSON.stringify(playerName)});
      `);
    },
    broadcastAction: (actionData, nextStatus) => {
      const payload = JSON.stringify({
        type: 'game-action',
        actionData,
        roomStatus: nextStatus,
        timestamp: Date.now()
      });

      inject(`broadcastData(${JSON.stringify(payload)});`);
    },
    broadcastMessage: (message) => {
      inject(`broadcastData(${JSON.stringify(JSON.stringify(message))});`);
    },
    sendToHost: (message) => {
      inject(`sendDataToHost(${JSON.stringify(JSON.stringify(message))});`);
    },
    updateHostSnapshot: (snapshot) => {
      pushHostSnapshot(snapshot);
    },
    leaveRoom: () => {
      inject('destroyRoom();');
    }
  }));

  const handleMessage = (event) => {
    try {
      const { action, data } = JSON.parse(event.nativeEvent.data);
      if (props.onMessage) {
        props.onMessage(action, data);
      }
    } catch (error) {}
  };

  if (!htmlUri) return null;

  return (
    <View style={{ height: 0, width: 0, opacity: 0 }}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlUri }}
        originWhitelist={['*']}
        onMessage={handleMessage}
        onLoadEnd={() => {
          setIsReady(true);
          pendingScriptsRef.current.forEach((script) => {
            webViewRef.current?.injectJavaScript(`${script}\ntrue;`);
          });
          pendingScriptsRef.current = [];
        }}
        javaScriptEnabled={true}
      />
    </View>
  );
});

export default NexusRoomBridge;
