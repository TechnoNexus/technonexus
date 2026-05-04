import { useEffect } from 'react';
import { RoomMessageType } from '../lib/roomProtocol';
import { Haptics, ImpactStyle } from '../lib/haptics';

export function useNexusEvents({
  isHost,
  playerName,
  hostConnection,
  setSubmissions,
  broadcastNPATMStop,
  broadcastRoomAction
}) {
  const hapticFeedback = async (style = ImpactStyle.Medium) => {
    try { await Haptics.impact({ style }); } catch (e) {}
  };

  useEffect(() => {
    const handleLocalSubmit = (e) => {
      const { submission } = e.detail;
      if (isHost) {
        setSubmissions(prev => {
          const existing = prev.find(s => s.name === playerName);
          if (existing) {
            return prev.map(s => s.name === playerName ? { name: playerName, submission } : s);
          }
          return [...prev, { name: playerName, submission }];
        });
      }
      else if (hostConnection.current) {
        hostConnection.current.send({ type: RoomMessageType.SUBMIT_RAW, name: playerName, submission });
      }
    };

    const handleNPATMSubmit = (e) => {
      const { action, name, playerId, data } = e.detail;
      if (isHost && action === 'STOP') {
        broadcastNPATMStop(name || playerName);
        hapticFeedback(ImpactStyle.Heavy);
        return;
      }

      if (hostConnection.current) {
        hostConnection.current.send({ 
          type: RoomMessageType.NPATM_SUBMIT, 
          action,
          name,
          playerId, 
          data
        });
      }
    };

    const handleClearSubmissions = () => {
      setSubmissions([]);
    };

    const handleGameAction = (e) => {
      const { actionData, roomStatus: nextStatus } = e.detail;
      if (isHost) {
        broadcastRoomAction(actionData, nextStatus);
      } else if (hostConnection.current) {
        hostConnection.current.send({
          type: RoomMessageType.GAME_ACTION,
          actionData,
          roomStatus: nextStatus,
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('nexus-submit-to-host', handleLocalSubmit);
    window.addEventListener('npatm-submit-to-host', handleNPATMSubmit);
    window.addEventListener('nexus-clear-submissions', handleClearSubmissions);
    window.addEventListener('nexus-game-action', handleGameAction);
    return () => {
      window.removeEventListener('nexus-submit-to-host', handleLocalSubmit);
      window.removeEventListener('npatm-submit-to-host', handleNPATMSubmit);
      window.removeEventListener('nexus-clear-submissions', handleClearSubmissions);
      window.removeEventListener('nexus-game-action', handleGameAction);
    };
  }, [isHost, playerName, hostConnection, setSubmissions, broadcastNPATMStop, broadcastRoomAction]);
}
