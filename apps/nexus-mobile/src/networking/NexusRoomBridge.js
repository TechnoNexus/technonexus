import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';

const NexusRoomBridge = forwardRef((props, ref) => {
  const webViewRef = useRef(null);
  const [htmlUri, setHtmlUri] = useState(null);

  useEffect(() => {
    // In Expo, local HTML files need to be resolved via require to be packaged
    // For simplicity, we can load a static HTML string with the PeerJS logic
    // instead of dealing with Asset bundler logic cross-platform.
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>
          <script>
              let peer = null;
              let hostConnection = null;
              const connections = [];

              function sendMessageToNative(action, data) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ action, data }));
              }

              function initPeer(id) {
                  if (peer) { peer.destroy(); }
                  peer = new Peer(id);
                  peer.on('open', (id) => sendMessageToNative('open', { id: id }));
                  peer.on('connection', (conn) => {
                      conn.on('data', (data) => sendMessageToNative('data', { peer: conn.peer, payload: data }));
                      connections.push(conn);
                      sendMessageToNative('connection', { peer: conn.peer });
                  });
              }

              function connectToPeer(idToJoin, playerName) {
                  if (!peer) return;
                  const conn = peer.connect(idToJoin);
                  conn.on('open', () => {
                      hostConnection = conn;
                      conn.send({ type: 'join', name: playerName });
                      sendMessageToNative('connectedToHost', { id: idToJoin });
                  });
                  conn.on('data', (data) => sendMessageToNative('data', { peer: conn.peer, payload: data }));
              }
          </script>
      </head>
      <body></body>
      </html>
    `;
    setHtmlUri(htmlContent);
  }, []);

  useImperativeHandle(ref, () => ({
    createRoom: (playerName) => {
      const id = Math.random().toString(16).substring(2, 6).toUpperCase();
      props.onRoomIdCreated && props.onRoomIdCreated(id);
      webViewRef.current.injectJavaScript(`initPeer('Nexus-${id}'); true;`);
    },
    joinRoom: (roomId, playerName) => {
      webViewRef.current.injectJavaScript(`initPeer(); setTimeout(() => connectToPeer('Nexus-${roomId}', '${playerName}'), 1000); true;`);
    }
  }));

  const handleMessage = (event) => {
    try {
      const { action, data } = JSON.parse(event.nativeEvent.data);
      if (props.onMessage) {
        props.onMessage(action, data);
      }
    } catch(e) {}
  };

  if (!htmlUri) return null;

  return (
    <View style={{ height: 0, width: 0, opacity: 0 }}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlUri }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
      />
    </View>
  );
});

export default NexusRoomBridge;
