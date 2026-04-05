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
    setRoundVerdict, roomScores, setRoomScores, localEvaluation, playerName
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(null);
  const [submission, setSubmission] = useState('');
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [isRenaming, setIsRenaming] = useState(null); // game id being renamed
  const [renamingText, setRenamingText] = useState('');
  const [isDeleting, setIsDeleting] = useState(null); // game id being deleted

  const hapticFeedback = async (style = ImpactStyle.Medium) => {
    try { await Haptics.impact({ style }); } catch (e) {}
  };

  // Reset game state on component mount - fresh session every time
  useEffect(() => {
    setRoomStatus('idle');
    setCustomGame(null);
    setLocalEvaluation(null);
    setRoundVerdict(null);
    setSubmission('');
    setTimeLeft(null);
    setCurrentContentIndex(0);
    setShowContent(false);
    setSessionPoints(0);
    setRoomScores([]);
  }, []);

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

  const deleteFromVault = async (gameId) => {
    if (!user) return;
    setIsDeleting(gameId);
    const { error } = await supabase
      .from('user_games')
      .delete()
      .eq('id', gameId)
      .eq('user_id', user.id);
    
    if (error) {
      alert('Failed to delete: ' + error.message);
    } else {
      hapticFeedback(ImpactStyle.Light);
      fetchVault(user.id);
    }
    setIsDeleting(null);
  };

  const renameInVault = async (gameId) => {
    if (!user || !renamingText.trim()) return;
    setIsRenaming(gameId);
    const { error } = await supabase
      .from('user_games')
      .update({ game_title: renamingText.trim() })
      .eq('id', gameId)
      .eq('user_id', user.id);
    
    if (error) {
      alert('Failed to rename: ' + error.message);
    } else {
      hapticFeedback(ImpactStyle.Medium);
      setRenamingText('');
      setIsRenaming(null);
      fetchVault(user.id);
    }
  };

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
    submitToHost();
  };

  const submitToHost = (manualPerf) => {
    let finalSubmission = submission;
    if (customGame?.gameType === 'performance') {
      finalSubmission = `${manualPerf || "Round ended"}. Completed ${sessionPoints} items.`;
    }

    // In batch mode, we don't call the API here.
    // We send the 'submit-raw-submission' event to the host via PeerJS.
    // NexusRoomManager handles this communication.
    window.dispatchEvent(new CustomEvent('nexus-submit-to-host', { 
      detail: { submission: finalSubmission } 
    }));
  };

  useEffect(() => {
    if (roomStatus === 'playing' && customGame) {
      setTimeLeft(customGame.timeLimitSeconds || 60);
      setSubmission('');
      setCurrentContentIndex(0);
      setShowContent(false);
      setSessionPoints(0);
    }
  }, [roomStatus, customGame]);

  const startMission = () => {
    if (isHost) {
      setRoomStatus('playing');
      hapticFeedback(ImpactStyle.Medium);
    }
  };

  const nextItem = () => {
    setSessionPoints(prev => prev + 1);
    if (customGame?.gameContent && currentContentIndex < customGame.gameContent.length - 1) {
      setCurrentContentIndex(prev => prev + 1);
      setShowContent(false);
      hapticFeedback();
    } else {
      finishGame();
    }
  };

  const skipItem = () => {
    if (customGame?.gameContent && currentContentIndex < customGame.gameContent.length - 1) {
      setCurrentContentIndex(prev => prev + 1);
      setShowContent(false);
      hapticFeedback(ImpactStyle.Light);
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

            {user && savedGames.length > 0 && (
              <div className="glass-panel p-6 rounded-[2rem] border-white/5 mb-8">
                <h3 className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-4 text-center">Your Nexus Vault</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {savedGames.map((game) => (
                    <div key={game.id}>
                      {isRenaming === game.id ? (
                        <div className="flex gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                          <input 
                            type="text" 
                            value={renamingText}
                            onChange={(e) => setRenamingText(e.target.value)}
                            placeholder="New name..."
                            className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-neon-cyan outline-none"
                            autoFocus
                          />
                          <button 
                            onClick={() => renameInVault(game.id)}
                            className="text-[8px] font-black text-neon-cyan uppercase tracking-widest border border-neon-cyan/20 px-3 py-2 rounded-lg hover:bg-neon-cyan hover:text-black transition-all"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setIsRenaming(null)}
                            className="text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-500/20 px-3 py-2 rounded-lg hover:bg-slate-500/10 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="group flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-neon-cyan/30 transition-all">
                          <span className="text-xs font-bold text-slate-300 truncate mr-4">{game.game_title}</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => loadFromVault(game.config_json)}
                              className="text-[8px] font-black text-neon-cyan uppercase tracking-widest border border-neon-cyan/20 px-3 py-1 rounded-lg hover:bg-neon-cyan hover:text-black transition-all"
                            >
                              Load
                            </button>
                            <button 
                              onClick={() => { setIsRenaming(game.id); setRenamingText(game.game_title); }}
                              className="text-[8px] font-black text-electric-violet uppercase tracking-widest border border-electric-violet/20 px-3 py-1 rounded-lg hover:bg-electric-violet hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            >
                              Rename
                            </button>
                            <button 
                              onClick={() => deleteFromVault(game.id)}
                              disabled={isDeleting === game.id}
                              className="text-[8px] font-black text-red-400 uppercase tracking-widest border border-red-400/40 px-3 py-1 rounded-lg bg-red-500/5 hover:bg-red-500/20 hover:text-red-300 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                            >
                              {isDeleting === game.id ? 'Deleting...' : '🗑 Delete'}
                            </button>
                          </div>
                        </div>
                      )}
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
            <div className="flex justify-between items-start mb-8">
              <div className="flex-1">
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
              </div>
              <button 
                onClick={() => {
                  hapticFeedback(ImpactStyle.Medium);
                  setRoomStatus('idle');
                  setLocalEvaluation(null);
                  setSubmission('');
                  setRoundVerdict(null);
                  setSessionPoints(0);
                  setRoomScores([]);
                }}
                className="ml-4 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-500/30 transition-all whitespace-nowrap"
              >
                × QUIT
              </button>
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
                   
                   <div className="grid grid-cols-2 gap-4 w-full">
                     <button 
                       onClick={nextItem}
                       className="py-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                     >
                       {currentContentIndex < customGame.gameContent.length - 1 ? 'Next →' : 'Finish'}
                     </button>
                     <button 
                       onClick={skipItem}
                       className="py-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                     >
                       Skip
                     </button>
                   </div>
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
                  <div className="glass-panel p-8 rounded-[2.5rem] border-neon-violet/30 bg-neon-violet/5 text-center">
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

            {/* LIVE SCOREBOARD */}
            {roomScores.length > 0 && (
              <div className="w-full mb-12 animate-in fade-in duration-700">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Live Scoreboard</h3>
                <div className="space-y-3">
                  {[...roomScores].sort((a, b) => b.score - a.score).map((s, i) => (
                    <div key={i} className={`p-4 rounded-2xl border flex justify-between items-center ${s.name === playerName ? 'bg-neon-cyan/10 border-neon-cyan/30' : 'bg-white/5 border-white/10'}`}>
                      <div className="text-left">
                        <p className="text-xs font-black text-white uppercase tracking-wider">{s.name}</p>
                        <p className="text-[10px] text-slate-400 italic">"{s.judgeComment}"</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-neon-cyan">{s.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {localEvaluation ? (
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
            ) : roomScores.length > 0 && roomScores.find(s => s.name === playerName) ? (
              // Fallback: check roomScores directly if localEvaluation not yet synced
              <div className="w-full space-y-6 mb-12">
                {(() => {
                  const score = roomScores.find(s => s.name === playerName);
                  return score ? (
                    <div className="glass-panel p-8 rounded-[2.5rem] border-neon-cyan/30 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4">
                        <span className="text-4xl font-black text-neon-cyan/20">#{score.score}</span>
                      </div>
                      <p className="text-neon-cyan font-black text-5xl mb-4 tracking-tighter">{score.score}</p>
                      <p className="text-white font-medium italic text-lg leading-relaxed">
                        "{score.judgeComment}"
                      </p>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : customGame?.gameType === 'performance' && !roomScores.find(s => s.name === playerName) ? (
              <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 w-full mb-8">
                <p className="text-slate-500 text-sm italic mb-6">Round complete. How was the performance?</p>
                <div className="grid grid-cols-2 gap-4">
                   <button 
                     onClick={() => submitToHost("It was perfect and creative.")}
                     className="py-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-bold"
                   >
                     CRUSHED IT
                   </button>
                   <button 
                     onClick={() => submitToHost("It was a total failure.")}
                     className="py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold"
                   >
                     LAGGED OUT
                   </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-2xl border-white/5 w-full mb-8">
                <p className="text-white italic">Awaiting AI analysis from Host...</p>
              </div>
            )}

            <NexusRoomManager showForge={true} />

            <button 
              onClick={() => {
                setRoomStatus('idle');
                setLocalEvaluation(null);
                setSubmission('');
                setRoundVerdict(null);
                setSessionPoints(0);
                setRoomScores([]);
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
