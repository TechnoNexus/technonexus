import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNexusAI } from './useNexusAI';
import { useGameStore } from '../store/gameStore';
import { RoomMessageType } from '../lib/roomProtocol';

// Mock Haptics
vi.mock('../lib/haptics', () => ({
  Haptics: { impact: vi.fn() },
  ImpactStyle: { Medium: 'medium', Heavy: 'heavy' }
}));

describe('useNexusAI', () => {
  let mockConnections;
  let setSubmissions;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConnections = { current: [] };
    setSubmissions = vi.fn();
    global.fetch = vi.fn();
    useGameStore.getState().resetRoom();
  });

  it('should generate a game and broadcast to connections', async () => {
    const mockGameData = { gameTitle: 'Test Game', instructions: 'Test instructions' };
    global.fetch.mockResolvedValueOnce({
      json: async () => mockGameData
    });

    const conn1 = { open: true, send: vi.fn() };
    mockConnections.current = [conn1];

    const { result } = renderHook(() => useNexusAI({
      connections: mockConnections,
      aiPrompt: 'Test Prompt',
      language: 'English',
      isHost: true,
      setSubmissions
    }));

    await act(async () => {
      await result.current.generateGame();
    });

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/generate-game'), expect.any(Object));
    expect(useGameStore.getState().customGame).toEqual(mockGameData);
    expect(conn1.send).toHaveBeenCalledWith({
      type: RoomMessageType.NEW_CUSTOM_GAME,
      game: mockGameData
    });
  });

  it('should evaluate batch and update room scores', async () => {
    const mockResults = { results: [{ name: 'Player1', score: 100 }] };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResults
    });

    const { result } = renderHook(() => useNexusAI({
      connections: mockConnections,
      customGame: { instructions: 'Test' },
      submissions: [{ name: 'Player1', submission: 'Answer' }],
      isHost: true,
      playerName: 'Player1',
      setSubmissions
    }));

    await act(async () => {
      await result.current.evaluateBatch();
    });

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/evaluate-batch'), expect.any(Object));
    expect(useGameStore.getState().roomScores).toEqual(mockResults.results);
  });
});
