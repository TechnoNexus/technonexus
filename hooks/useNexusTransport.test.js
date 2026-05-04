import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNexusTransport } from './useNexusTransport';
import { useGameStore } from '../store/gameStore';
import { MockPeer, MockDataConnection } from '../lib/test-utils/peerjs-mock';
import { RoomMessageType } from '../lib/roomProtocol';

let lastPeerInstance;
// Mock PeerJS
vi.mock('peerjs', () => {
  return {
    Peer: vi.fn().mockImplementation(function(id) {
      lastPeerInstance = new MockPeer(id);
      return lastPeerInstance;
    })
  };
});

// Mock Haptics
vi.mock('../lib/haptics', () => ({
  Haptics: { impact: vi.fn() },
  ImpactStyle: { Medium: 'medium', Heavy: 'heavy' }
}));

describe('useNexusTransport', () => {
  let mockConnections;
  let mockHostConnection;

  beforeEach(() => {
    vi.clearAllMocks();
    lastPeerInstance = null;
    mockConnections = { current: [] };
    mockHostConnection = { current: null };
    useGameStore.getState().resetRoom();
  });

  it('should initialize with disconnected status', () => {
    const { result } = renderHook(() => useNexusTransport({
      isHost: false,
      playerName: 'TESTER',
      connections: mockConnections,
      hostConnection: mockHostConnection
    }));

    expect(result.current.status).toBe('Disconnected');
  });

  it('should create a room and set host status', async () => {
    const { result } = renderHook(() => useNexusTransport({
      isHost: true,
      playerName: 'HOST_USER',
      connections: mockConnections,
      hostConnection: mockHostConnection
    }));

    await act(async () => {
      useGameStore.getState().setPlayerName('HOST_USER');
      result.current.createRoom();
    });

    const state = useGameStore.getState();
    expect(state.isHost).toBe(true);
    expect(state.roomId).toBeDefined();
    expect(state.hostName).toBe('HOST_USER');
  });

  it('should handle incoming guest connections correctly', async () => {
    const { result } = renderHook(() => useNexusTransport({
      isHost: true,
      playerName: 'HOST_USER',
      connections: mockConnections,
      hostConnection: mockHostConnection
    }));

    await act(async () => {
      useGameStore.getState().setPlayerName('HOST_USER');
      result.current.createRoom();
    });

    // Wait for dynamic import and peer init
    await new Promise(r => setTimeout(r, 10));

    const mockConn = new MockDataConnection('GUEST_PEER_ID');
    mockConn.send = vi.fn();

    await act(async () => {
      // Simulate PeerJS 'connection' event
      lastPeerInstance.trigger('connection', mockConn);
      // Simulate guest sending 'join' message
      mockConn.trigger('data', { type: RoomMessageType.JOIN, name: 'FRIEND' });
    });

    const state = useGameStore.getState();
    expect(state.players).toHaveLength(1);
    expect(state.players[0].name).toBe('FRIEND');
    
    // Verify Host sent 'welcome' message back
    expect(mockConn.send).toHaveBeenCalledWith(expect.objectContaining({
      type: RoomMessageType.WELCOME,
      hostName: 'HOST_USER'
    }));
  });

  it('should broadcast room actions to all open connections', async () => {
    const { result } = renderHook(() => useNexusTransport({
      isHost: true,
      playerName: 'HOST_USER',
      connections: mockConnections,
      hostConnection: mockHostConnection
    }));

    const mockConn = { open: true, send: vi.fn(), peer: 'GUEST_1' };
    mockConnections.current = [mockConn];

    await act(async () => {
      result.current.broadcastRoomAction({ test: 'data' }, 'playing');
    });

    expect(mockConn.send).toHaveBeenCalledWith(expect.objectContaining({
      type: RoomMessageType.GAME_ACTION,
      actionData: expect.objectContaining({ test: 'data' })
    }));
  });
});
