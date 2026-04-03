'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NexusRoomManager from '../../../components/NexusRoomManager';
import NexusAuth from '../../../components/NexusAuth';
import { useGameStore } from '../../../store/gameStore';
import { supabase } from '../../../lib/supabase';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function AIForgeGame() {
  const { 
    customGame, setCustomGame, roomStatus, setRoomStatus, isHost, 
    savedGames, setSavedGames, setLocalEvaluation, roundVerdict,
    setRoundVerdict, roomScores, localEvaluation
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(null);
  const [submission, setSubmission] = useState('');
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);

  const hapticFeedback = async (style = ImpactStyle.Medium) => {
    try { await Haptics.impact({ style }); } catch (e) {}
  };

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
    const { data, error } = await supabase
      .from('user_games')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setSavedGames(data);
    }
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
      fetchVault(user.id);
    }
    setIsSaving(false);
  };

  const loadFromVault = (gameConfig) => {
    setCustomGame(gameConfig);
    hapticFeedback(ImpactStyle.Heavy);
  };

  // Handle Timer
  useEffect(() => {
    let interval;
    if (roomStatus === 'playing' && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        if (timeLeft <= 5) hapticFeedback(ImpactStyle.Light);
      }, 1000);
    } else if (roomStatus === 'playing' && timeLeft === 0) {
      finishGame();
    }
    return () => clearInterval(interval);
  }, [roomStatus, timeLeft]);

  const finishGame = () => {
    hapticFeedback(ImpactStyle.Heavy);
    setRoomStatus('finished');
    if (customGame?.gameType !== 'performance') {
      evaluateSubmission();
    }
  };

  const evaluateSubmission = async (manualSubmission) => {
    const textToEvaluate = manualSubmission || submission;
    if (!textToEvaluate && customGame?.gameType !== 'performance') return;
    
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/evaluate-submission', {
        method: 'POST',
        body: JSON.stringify({
          instructions: customGame.instructions,
          submission: textToEvaluate || "The performance was completed.",
          inputType: customGame.inputType
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setLocalEvaluation(data);
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
      setSubmission('');
      setCurrentContentIndex(0);
      setShowContent(false);
    }
  }, [roomStatus, customGame]);

  const startMission = () => {
    if (isHost) {
      setRoomStatus('playing');
      hapticFeedback(ImpactStyle.Medium);
    }
  };

  const nextItem = () => {
    if (customGame?.gameContent && currentContentIndex < customGame.gameContent.length - 1) {
      setCurrentContentIndex(prev => prev + 1);
      setShowContent(false);
      hapticFeedback();
    } else {
      finishGame();
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-20">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <Link href="/games" className="text-neon-cyan hover:underline font-mono text-sm uppercase tracking-widest font-black">← Exit Arcade</Link>
          <div className="px-4 py-1 rounded-full border border-neon-cyan bg-neon-cyan/10">
            <span className="text-[10px] block font-black text-neon-cyan uppercase tracking-widest text-center">AI FORGE</span>
          </div>
        </header>

        {roomStatus === 'idle' && (
          <>
            <NexusAuth />
            
            <div className="text-center mb-12 mt-8">
              <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
                <span className="gradient-text-cyan">NEXUS</span> AI FORGE
              </h1>
              <p className="text-slate-500 text-xs uppercase tracking-[0.2em]">Generate custom missions via Gemini 2.5</p>
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
                 <p className="text-slate-400 text-sm leading-relaxed mb-8 italic px-4">
                   "{customGame.instructions}"
                 </p>
                 
                 <div className="flex justify-center gap-8 mb-8">
                   <div className="text-center">
                     <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Duration</p>
                     <p className="text-xl font-black text-white">{customGame.timeLimitSeconds}s</p>
                   </div>
                   <div className="text-center">
                     <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Mode</p>
                     <p className="text-xl font-black text-white uppercase">{customGame.gameType}</p>
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
                  className={`h-full transition-all duration-1000 ${timeLeft < 10 ? 'bg-red-500' : 'bg-neon-cyan'}`}
                  style={{ width: `${(timeLeft / customGame.timeLimitSeconds) * 100}%` }}
                />
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 mb-8 flex-1 flex flex-col">
              <h2 className="text-xl font-black uppercase mb-4 tracking-tight text-slate-500">{customGame.gameTitle}</h2>
              
              {customGame.gameType === 'performance' ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                   <p className="text-[10px] font-bold text-neon-violet uppercase tracking-widest mb-6">Act this out:</p>
                   {showContent ? (
                     <h2 className="text-5xl font-black text-white mb-12 animate-in zoom-in duration-300">
                       {customGame.gameContent[currentContentIndex]}
                     </h2>
                   ) : (
                     <div 
                        onClick={() => { hapticFeedback(ImpactStyle.Heavy); setShowContent(true); }}
                        className="w-full h-48 bg-white/5 border-2 border-dashed border-white/20 rounded-3xl flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all mb-12"
                     >
                        <span className="text-neon-cyan font-black tracking-[0.2em] uppercase">Tap to Reveal</span>
                     </div>
                   )}
                   
                   <button 
                     onClick={nextItem}
                     className="w-full py-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                   >
                     {currentContentIndex < customGame.gameContent.length - 1 ? 'Next Word →' : 'Finish Round'}
                   </button>
                </div>
              ) : (
                <>
                  <p className="text-slate-400 leading-relaxed mb-8 italic">"{customGame.instructions}"</p>
                  <textarea 
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    placeholder="Type your response here..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-lg text-white focus:border-neon-cyan transition-all outline-none h-48 resize-none shadow-inner"
                  />
                  <button 
                    onClick={finishGame}
                    className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-neon-cyan transition-colors mt-auto"
                  >
                    Submit Early
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {roomStatus === 'finished' && (
          <div className="flex-1 flex flex-col justify-center items-center text-center animate-in zoom-in duration-500 pb-20 w-full">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8">Mission Analysis</h2>
            
            {roundVerdict && (
               <div className="w-full mb-12 space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                  <div className="glass-panel p-8 rounded-[2.5rem] border-neon-violet/30 bg-neon-violet/5">
                     <p className="text-[10px] font-black text-neon-violet uppercase tracking-[0.3em] mb-4">Round Summary</p>
                     <p className="text-white italic text-lg leading-relaxed mb-6">"{roundVerdict.roundSummary}"</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                           <p className="text-[8px] font-black text-neon-cyan uppercase mb-1">Nexus MVP</p>
                           <p className="text-xs text-slate-300">{roundVerdict.mvpVerdict}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                           <p className="text-[8px] font-black text-red-500 uppercase mb-1">Legacy Bottleneck</p>
                           <p className="text-xs text-slate-300">{roundVerdict.bottleneckVerdict}</p>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {isEvaluating ? (
              <div className="text-neon-cyan text-xs font-black animate-pulse tracking-[0.3em] mb-12">
                AI JUDGE IS ANALYZING YOUR ATTEMPT...
              </div>
            ) : localEvaluation ? (
              <div className="w-full space-y-6 mb-12">
                <div className="glass-panel p-8 rounded-[2.5rem] border-neon-cyan/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="text-4xl font-black text-neon-cyan/20">#{localEvaluation.score}</span>
                  </div>
                  <p className="text-neon-cyan font-black text-5xl mb-4 tracking-tighter">{localEvaluation.score}</p>
                  <p className="text-white font-medium italic text-lg leading-relaxed">
                    "{localEvaluation.judgeComment}"
                  </p>
                </div>
              </div>
            ) : customGame?.gameType === 'performance' ? (
              <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 w-full mb-8">
                <p className="text-slate-500 text-sm italic mb-6">Round complete. How was the performance?</p>
                <div className="grid grid-cols-2 gap-4">
                   <button 
                     onClick={() => evaluateSubmission("It was perfect and creative.")}
                     className="py-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-bold"
                   >
                     CRUSHED IT
                   </button>
                   <button 
                     onClick={() => evaluateSubmission("It was a total failure.")}
                     className="py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold"
                   >
                     LAGGED OUT
                   </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-2xl border-white/5 w-full mb-8">
                <p className="text-white italic">Awaiting AI analysis...</p>
              </div>
            )}

            <NexusRoomManager showForge={true} />

            <button 
              onClick={() => {
                setRoomStatus('idle');
                setLocalEvaluation(null);
                setSubmission('');
                setRoundVerdict(null);
              }}
              className="px-12 py-4 rounded-full bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all uppercase text-xs tracking-widest mt-8"
            >
              Return to Nexus
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
