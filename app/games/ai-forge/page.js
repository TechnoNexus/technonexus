'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NexusRoomManager from '../../../components/NexusRoomManager';
import NexusAuth from '../../../components/NexusAuth';
import { useGameStore } from '../../../store/gameStore';
import { supabase } from '../../../lib/supabase';

export default function AIForgeGame() {
  const { customGame, setCustomGame, roomStatus, setRoomStatus, isHost, savedGames, setSavedGames } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const [submission, setSubmission] = useState('');
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchVault(user.id);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) fetchVault(newUser.id);
      else setSavedGames([]);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchVault = async (userId) => {
    setIsLoadingVault(true);
    const { data, error } = await supabase
      .from('user_games')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setSavedGames(data);
    }
    setIsLoadingVault(false);
  };

  const saveGame = async () => {
    if (!user || !customGame) return;
    setIsSaving(true);
    const { error } = await supabase.from('user_games').insert({
      user_id: user.id,
      game_title: customGame.gameTitle,
      config_json: customGame
    });
    
    if (error) alert(error.message);
    else {
      alert('Mission saved to your Nexus Vault!');
      fetchVault(user.id); // Refresh vault
    }
    setIsSaving(false);
  };

  const loadFromVault = (gameConfig) => {
    setCustomGame(gameConfig);
    // If hosting, this will be broadcasted by the standard PeerJS logic in RoomManager if implemented, 
    // but here we manually set it.
    alert(`Loaded: ${gameConfig.gameTitle}`);
  };

  // Handle Timer
  useEffect(() => {
    let interval;
    if (roomStatus === 'playing' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && roomStatus === 'playing') {
      setRoomStatus('finished');
      evaluateSubmission();
    }
    return () => clearInterval(interval);
  }, [roomStatus, timeLeft, setRoomStatus]);

  const evaluateSubmission = async () => {
    if (!submission || !customGame) return;
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/evaluate-submission', {
        method: 'POST',
        body: JSON.stringify({
          instructions: customGame.instructions,
          submission,
          inputType: customGame.inputType
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setEvaluation(data);
    } catch (e) {
      console.error('Evaluation failed:', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Sync initial timer when game starts
  useEffect(() => {
    if (roomStatus === 'playing' && customGame) {
      setTimeLeft(customGame.timeLimitSeconds || 60);
    }
  }, [roomStatus, customGame]);

  const startMission = () => {
    if (isHost) {
      setRoomStatus('playing');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-20">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <Link href="/games" className="text-neon-cyan hover:underline font-mono text-sm uppercase tracking-widest font-black">← Exit Arcade</Link>
          <div className="px-4 py-1 rounded-full border border-neon-cyan bg-neon-cyan/10">
            <span className="text-[10px] block font-black text-neon-cyan uppercase tracking-widest text-center">AI MODE</span>
          </div>
        </header>

        {roomStatus === 'idle' && (
          <>
            <NexusAuth />
            
            <div className="text-center mb-12 mt-8">
              <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
                <span className="gradient-text-cyan">NEXUS</span> AI FORGE
              </h1>
              <p className="text-slate-500 text-xs uppercase tracking-[0.2em]">Generate custom missions via LLM</p>
            </div>

            <NexusRoomManager showForge={true} />

            {/* Nexus Vault Section */}
            {user && savedGames.length > 0 && (
              <div className="glass-panel p-6 rounded-[2rem] border-white/5 mb-8">
                <h3 className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-4 text-center">Your Nexus Vault</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {savedGames.map((game) => (
                    <div 
                      key={game.id}
                      className="group flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-neon-cyan/30 transition-all"
                    >
                      <span className="text-xs font-bold text-slate-300 truncate mr-4">{game.game_title}</span>
                      <button 
                        onClick={() => loadFromVault(game.config_json)}
                        className="text-[8px] font-black text-neon-cyan uppercase tracking-widest border border-neon-cyan/20 px-3 py-1 rounded-lg hover:bg-neon-cyan hover:text-black transition-all"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {customGame && (
              <div className="glass-panel rounded-[2rem] p-8 border-neon-cyan/20 text-center animate-in fade-in zoom-in duration-500 mb-8">
                 <div className="inline-block px-3 py-1 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                   MISSION PREPARED
                 </div>
                 <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase leading-none">
                   {customGame.gameTitle}
                 </h2>
                 <p className="text-slate-400 text-sm leading-relaxed mb-8 italic">
                   "{customGame.instructions}"
                 </p>
                 
                 <div className="flex justify-center gap-8 mb-8">
                   <div className="text-center">
                     <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Duration</p>
                     <p className="text-xl font-black text-white">{customGame.timeLimitSeconds}s</p>
                   </div>
                   <div className="text-center">
                     <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Input</p>
                     <p className="text-xl font-black text-white uppercase">{customGame.inputType}</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                   {isHost ? (
                     <button 
                      onClick={startMission}
                      className="w-full py-6 rounded-2xl bg-neon-cyan text-black font-black text-xl shadow-neon-glow hover:scale-[0.98] transition-all"
                     >
                      START MISSION FOR ALL
                     </button>
                   ) : (
                     <div className="py-6 rounded-2xl bg-white/5 border border-white/10 text-slate-500 font-black text-sm uppercase tracking-widest">
                       Waiting for Host to start...
                     </div>
                   )}

                   {user && (
                     <button 
                      onClick={saveGame}
                      disabled={isSaving}
                      className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                     >
                      {isSaving ? 'Saving...' : '💾 Save to My Forge'}
                     </button>
                   )}
                 </div>
              </div>
            )}

            {!customGame && (
              <div className="glass-panel rounded-[2rem] p-12 border-dashed border-white/5 text-center flex-1 flex flex-col justify-center items-center">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mb-6">
                  <span className="text-slate-700 font-black">?</span>
                </div>
                <p className="text-slate-600 text-sm italic max-w-[200px]">
                  Host a room and describe a mission to begin the forge.
                </p>
              </div>
            )}
          </>
        )}

        {roomStatus === 'playing' && customGame && (
          <div className="flex-1 flex flex-col pt-12 animate-in slide-in-from-bottom duration-700">
            <div className="text-center mb-12">
              <div className="text-6xl font-black mb-2 tabular-nums">
                {timeLeft}<span className="text-2xl text-neon-cyan">s</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-neon-cyan h-full transition-all duration-1000" 
                  style={{ width: `${(timeLeft / customGame.timeLimitSeconds) * 100}%` }}
                />
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 mb-8">
              <h2 className="text-2xl font-black uppercase mb-4 tracking-tight">{customGame.gameTitle}</h2>
              <p className="text-slate-400 leading-relaxed mb-8">{customGame.instructions}</p>
              
              <textarea 
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                placeholder="Type your response here..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-lg text-white focus:border-neon-cyan transition-all outline-none h-48 resize-none shadow-inner"
              />
            </div>

            <button 
              onClick={() => {
                setRoomStatus('finished');
                evaluateSubmission();
              }}
              className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-neon-cyan transition-colors"
            >
              Submit Early
            </button>
          </div>
        )}

        {roomStatus === 'finished' && (
          <div className="flex-1 flex flex-col justify-center items-center text-center animate-in zoom-in duration-500 pb-20">
            <div className="text-6xl mb-6">🏁</div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Mission Over</h2>
            
            {isEvaluating ? (
              <div className="text-neon-cyan text-xs font-black animate-pulse tracking-[0.3em] mb-12">
                AI JUDGE IS ANALYZING YOUR ATTEMPT...
              </div>
            ) : evaluation ? (
              <div className="w-full space-y-6 mb-12">
                <div className="glass-panel p-8 rounded-[2.5rem] border-neon-cyan/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="text-4xl font-black text-neon-cyan/20">#{evaluation.score}</span>
                  </div>
                  <p className="text-neon-cyan font-black text-5xl mb-4 tracking-tighter">{evaluation.score}</p>
                  <p className="text-white font-medium italic text-lg leading-relaxed mb-6">
                    "{evaluation.judgeComment}"
                  </p>
                  <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Sentences</p>
                      <p className="text-white font-black">{evaluation.breakdown.sentences}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Objective</p>
                      <p className={evaluation.breakdown.objective_met ? "text-green-400 font-black" : "text-red-400 font-black"}>
                        {evaluation.breakdown.objective_met ? 'MET' : 'FAILED'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Creativity</p>
                      <p className="text-white font-black">{evaluation.breakdown.creativity_score}/10</p>
                    </div>
                  </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border-white/5 text-left">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">AI Feedback</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{evaluation.feedback}</p>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-2xl border-white/5 w-full mb-8">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-left">Your Submission</p>
                <p className="text-white italic text-left">{submission || "No submission recorded."}</p>
              </div>
            )}

            <button 
              onClick={() => {
                setRoomStatus('idle');
                setEvaluation(null);
                setSubmission('');
              }}
              className="px-12 py-4 rounded-full bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all uppercase text-xs tracking-widest"
            >
              Return to Nexus
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
