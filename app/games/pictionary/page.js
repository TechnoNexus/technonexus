'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Haptics, ImpactStyle } from '../../../lib/haptics';
import NexusRoomManager from '../../../components/NexusRoomManager';
import { useGameStore } from '../../../store/gameStore';

const WORDS = [
  "Airplane", "Banana", "Cat", "Dog", "Elephant", "Fish", "Guitar", "House", "Igloo", 
  "Jellyfish", "Kite", "Lion", "Monkey", "Ninja", "Octopus", "Penguin", "Queen", "Robot",
  "Snake", "Tree", "Unicorn", "Volcano", "Watermelon", "X-ray", "Yoyo", "Zebra"
];

const INITIAL_STATE = {
  gameType: 'pictionary',
  isActive: false,
  word: '',
  drawer: '',
  paths: [] // Array of { color, points: [{x, y}, ...] }
};

export default function Pictionary() {
  const {
    roomId,
    isHost,
    customGame,
    setCustomGame,
    setRoomStatus,
    playerName,
    players
  } = useGameStore();

  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [currentColor, setCurrentColor] = useState('#00FFFF'); // neon-cyan default
  
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const currentPath = useRef([]);

  const applyState = (state) => {
    setGameState(state);
    redrawCanvas(state.paths || []);
  };

  const syncState = (patch, nextStatus) => {
    const activeGame = useGameStore.getState().customGame;
    const current = activeGame?.gameType === 'pictionary' ? activeGame : INITIAL_STATE;
    const next = { ...current, ...patch, gameType: 'pictionary' };

    applyState(next);

    if (roomId) {
      window.dispatchEvent(new CustomEvent('nexus-game-action', {
        detail: { actionData: next, roomStatus: nextStatus }
      }));
    } else {
      setCustomGame(next);
      if (nextStatus) setRoomStatus(nextStatus);
    }
  };

  useEffect(() => {
    if (!customGame || customGame.gameType !== 'pictionary') {
      applyState(INITIAL_STATE);
    }
  }, []);

  useEffect(() => {
    if (customGame?.gameType === 'pictionary') {
      applyState(customGame);
    }
  }, [customGame]);

  const redrawCanvas = (paths) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;

    paths.forEach(pathObj => {
      if (pathObj.points.length === 0) return;
      ctx.strokeStyle = pathObj.color;
      ctx.beginPath();
      ctx.moveTo(pathObj.points[0].x, pathObj.points[0].y);
      for (let i = 1; i < pathObj.points.length; i++) {
        ctx.lineTo(pathObj.points[i].x, pathObj.points[i].y);
      }
      ctx.stroke();
    });
  };

  const startGame = () => {
    Haptics.impact({ style: ImpactStyle.Heavy });
    const allPlayers = isHost ? [playerName, ...players.map(p => p.name)] : [];
    
    // Pick a random drawer
    const nextDrawer = allPlayers[Math.floor(Math.random() * allPlayers.length)] || playerName;
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];

    syncState({
      isActive: true,
      word,
      drawer: nextDrawer,
      paths: []
    }, 'playing');
  };

  const clearCanvas = () => {
    Haptics.impact({ style: ImpactStyle.Light });
    syncState({ paths: [] });
  };

  const resetGame = () => {
    Haptics.impact({ style: ImpactStyle.Medium });
    syncState(INITIAL_STATE, 'idle');
  };

  // Drawing Handlers
  const startDrawing = (e) => {
    if (playerName !== gameState.drawer && isHost !== (gameState.drawer === '')) return;
    isDrawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
    currentPath.current = [{x, y}];
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
    
    const lastPoint = currentPath.current[currentPath.current.length - 1];
    currentPath.current.push({x, y});

    // Draw locally immediately
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = currentColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (lastPoint) {
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    // Broadcast the new path
    const newPaths = [...gameState.paths, { color: currentColor, points: currentPath.current }];
    syncState({ paths: newPaths });
  };

  const isMyTurn = playerName === gameState.drawer || (!gameState.drawer && isHost);

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-32 md:pb-8">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <Link href="/games" className="text-neon-cyan hover:underline font-mono text-sm p-2 min-w-[44px] min-h-[44px] flex items-center">← EXIT</Link>
          <button 
            onClick={resetGame}
            disabled={!gameState.isActive}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all min-h-[44px] ${
              !gameState.isActive
                ? 'opacity-50 cursor-not-allowed border-slate-700 text-slate-600' 
                : 'border-red-500/40 text-red-500 hover:bg-red-500/20 bg-red-500/10'
            }`}
          >
            × QUIT
          </button>
        </header>

        <NexusRoomManager />

        <div className="glass-panel rounded-[2rem] p-8 border-white/10 text-center flex-1 flex flex-col items-center">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 gradient-text-cyan">Pictionary</h1>

          {!gameState.isActive ? (
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              {isHost ? (
                <button 
                  onClick={startGame}
                  className="w-full max-w-md py-6 rounded-2xl font-black bg-neon-cyan text-black shadow-neon-glow text-xl"
                >
                  START ROUND
                </button>
              ) : (
                <p className="text-slate-400 italic">Waiting for host to start...</p>
              )}
            </div>
          ) : (
            <div className="w-full flex-1 flex flex-col items-center">
              <div className="mb-6">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  DRAWER: <span className="text-white">{gameState.drawer}</span>
                </p>
                {isMyTurn ? (
                  <p className="text-2xl font-black text-neon-cyan mt-2">{gameState.word}</p>
                ) : (
                  <p className="text-2xl font-black text-white mt-2">GUESS THE DRAWING</p>
                )}
              </div>

              {isMyTurn && (
                <div className="flex gap-2 mb-4 flex-wrap justify-center">
                  {['#000000', '#00FFFF', '#8B5CF6', '#FFFFFF', '#FF0055', '#FFFF00', '#00FF00'].map(color => (
                    <button
                      key={color}
                      onClick={() => setCurrentColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${currentColor === color ? 'scale-125 border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <button 
                    onClick={clearCanvas}
                    className="ml-4 px-4 py-1 rounded bg-red-500/20 text-red-500 font-bold text-xs uppercase"
                  >
                    CLEAR
                  </button>
                </div>
              )}

              <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-neon-glow relative touch-none">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full h-full aspect-video cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!isMyTurn && (
                  <div className="absolute inset-0 z-10" /> 
                )}
              </div>

              {isHost && (
                <button 
                  onClick={startGame}
                  className="mt-8 px-8 py-4 rounded-xl font-black bg-white/5 text-slate-400 border border-white/10 hover:text-white transition-colors"
                >
                  NEXT ROUND (RANDOM DRAWER)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
