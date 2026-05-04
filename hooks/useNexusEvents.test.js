import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNexusEvents } from './useNexusEvents';

describe('useNexusEvents', () => {
  let setSubmissions;
  let broadcastNPATMStop;
  let broadcastRoomAction;
  let hostConnection;

  beforeEach(() => {
    vi.clearAllMocks();
    setSubmissions = vi.fn();
    broadcastNPATMStop = vi.fn();
    broadcastRoomAction = vi.fn();
    hostConnection = { current: { send: vi.fn() } };
  });

  it('should handle nexus-submit-to-host event and deduplicate on host', () => {
    // Mock existing submissions
    let currentSubmissions = [{ name: 'PLAYER1', submission: 'Old Answer' }];
    setSubmissions.mockImplementation(fn => {
      currentSubmissions = fn(currentSubmissions);
    });

    renderHook(() => useNexusEvents({
      isHost: true,
      playerName: 'PLAYER1',
      setSubmissions,
      broadcastNPATMStop,
      broadcastRoomAction
    }));

    // Dispatch custom event
    const event = new CustomEvent('nexus-submit-to-host', {
      detail: { submission: 'New Answer' }
    });
    window.dispatchEvent(event);

    expect(setSubmissions).toHaveBeenCalled();
    expect(currentSubmissions).toHaveLength(1);
    expect(currentSubmissions[0].submission).toBe('New Answer');
  });

  it('should send submission to host if guest', () => {
    renderHook(() => useNexusEvents({
      isHost: false,
      playerName: 'GUEST_USER',
      hostConnection,
      setSubmissions,
      broadcastNPATMStop,
      broadcastRoomAction
    }));

    const event = new CustomEvent('nexus-submit-to-host', {
      detail: { submission: 'Guest Answer' }
    });
    window.dispatchEvent(event);

    expect(hostConnection.current.send).toHaveBeenCalledWith(expect.objectContaining({
      type: 'submit-raw-submission',
      name: 'GUEST_USER',
      submission: 'Guest Answer'
    }));
  });
});
