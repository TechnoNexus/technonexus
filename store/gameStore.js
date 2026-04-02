import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGameStore = create(
  persist(
    (set, get) => ({
      // Room State
      roomId: null,
      isHost: false,
      players: [], // { peerId, name, role }
      roomStatus: 'idle', // 'idle', 'waiting', 'playing'
      
      // Game State (Synced)
      currentWord: '',
      timer: 60,
      scores: { teamA: 0, teamB: 0 },
      customGame: null, // { gameTitle, instructions, timeLimitSeconds, inputType }
      savedGames: [], // List of previously created games from Supabase
      roomStatus: 'idle', // 'idle', 'waiting', 'playing'

      setRoomId: (id) => set({ roomId: id }),
      setHost: (isHost) => set({ isHost }),
      setPlayers: (fn) => set((state) => ({ 
        players: typeof fn === 'function' ? fn(state.players) : fn 
      })),
      updateScores: (newScores) => set({ scores: newScores }),
      setCustomGame: (game) => set({ customGame: game }),
      setSavedGames: (games) => set({ savedGames: games }),
      setRoomStatus: (status) => set({ roomStatus: status }),
      updateLeaderboard: (winnerName) => {
        const currentLeaderboard = get().leaderboard;
        const playerIndex = currentLeaderboard.findIndex(p => p.name === winnerName);
        
        if (playerIndex > -1) {
          const updated = [...currentLeaderboard];
          updated[playerIndex].wins += 1;
          updated[playerIndex].totalGames += 1;
          set({ leaderboard: updated.sort((a, b) => b.wins - a.wins) });
        } else {
          set({ 
            leaderboard: [...currentLeaderboard, { name: winnerName, wins: 1, totalGames: 1 }]
              .sort((a, b) => b.wins - a.wins) 
          });
        }
      },

      resetRoom: () => set({ 
        roomId: null, 
        isHost: false, 
        players: [], 
        roomStatus: 'idle',
        currentWord: '',
        timer: 60,
        scores: { teamA: 0, teamB: 0 }
      })
    }),
    {
      name: 'nexus-game-storage',
      partialize: (state) => ({ leaderboard: state.leaderboard }), // Only persist leaderboard
    }
  )
);
