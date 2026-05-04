'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Haptics, ImpactStyle } from '../../../lib/haptics';
import UnifiedGameLobby from '../../../components/UnifiedGameLobby';
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

  const handleStartMission = (unifiedPlayers) => {
    Haptics.impact({ style: ImpactStyle.Heavy });
    const playerNames = unifiedPlayers.map(p => p.name);
    
    // Pick a random drawer
    const nextDrawer = playerNames[Math.floor(Math.random() * playerNames.length)] || playerName;
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
    if (playerName !== gameState.drawer) return;
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
    const nextPaths = [...(gameState.paths || []), { color: currentColor, points: currentPath.current }];
    syncState({ paths: nextPaths });
    currentPath.current = [];
  };

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-32 md:pb-8">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <Link href="/games" className="text-neon-cyan hover:underline font-mono text-sm p-2 min-w-[44px] min-h-[44px] flex items-center">← EXIT</Link>
          <button 
            onClick={resetGame}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border border-red-500/40 text-red-500 hover:bg-red-500/20 transition-all min-h-[44px]"
          >
            × RESET
          </button>
        </header>

        {gameState.isActive ? (
          <div className="flex-1 flex flex-col space-y-6">
            <div className="glass-panel p-6 rounded-[2rem] border-white/10 text-center">
              <h2 className="text-xs font-black tracking-widest text-slate-500 uppercase mb-4">
                {playerName === gameState.drawer ? 'YOU ARE DRAWING' : `${gameState.drawer.toUpperCase()} IS DRAWING`}
              </h2>
              {playerName === gameState.drawer && (
                <div className="bg-neon-cyan/10 border border-neon-cyan/20 p-6 rounded-2xl mb-4">
                   <p className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest mb-1">Secret Word</p>
                   <h1 className="text-4xl font-black tracking-tighter text-white uppercase">{gameState.word}</h1>
                </div>
              )}
              {playerName !== gameState.drawer && (
                 <p className="text-xl font-bold text-white tracking-tight italic">Guess what they are drawing!</p>
              )}
            </div>

            <div className="relative flex-1 bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-full touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              
              {playerName === gameState.drawer && (
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                   <div className="flex gap-3">
                      {['#00FFFF', '#8B5CF6', '#FACC15', '#F43F5E', '#FFFFFF'].map(color => (
                        <button 
                          key={color}
                          onClick={() => setCurrentColor(color)}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${currentColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                   </div>
                   <button 
                    onClick={clearCanvas}
                    className="px-6 py-3 bg-red-500 text-white font-black text-[10px] rounded-xl uppercase tracking-widest hover:bg-red-600 transition-colors"
                   >
                     Clear
                   </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <UnifiedGameLobby
            gameTitle="Nexus Pictionary"
            onStart={handleStartMission}
          />
        )}
      </div>
    </div>
  );
}
