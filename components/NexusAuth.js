'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function NexusAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    let result;
    if (mode === 'login') {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }

    if (result.error) {
      alert(result.error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="text-slate-500 text-xs animate-pulse font-black tracking-widest">INITIALIZING AUTH...</div>;

  if (user) {
    return (
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-white/5 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/30">
            <span className="text-neon-cyan text-xs font-black">N</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logged in as</p>
            <p className="text-xs font-black text-white">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel p-8 rounded-[2rem] border-white/5 mb-8">
      <h3 className="text-xs font-black tracking-widest text-neon-cyan uppercase mb-6 text-center">Nexus Access</h3>
      <form onSubmit={handleAuth} className="space-y-4">
        <input 
          type="email" 
          placeholder="EMAIL"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-neon-cyan transition-colors outline-none"
          required
        />
        <input 
          type="password" 
          placeholder="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-neon-cyan transition-colors outline-none"
          required
        />
        <button 
          type="submit"
          className="w-full py-4 rounded-xl bg-neon-cyan text-black font-black text-xs uppercase tracking-widest hover:scale-[0.98] transition-all shadow-neon-glow"
        >
          {mode === 'login' ? 'ACCESS NEXUS' : 'INITIALIZE PROTOCOL'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <button 
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-[10px] font-bold text-slate-500 hover:text-neon-cyan transition-colors uppercase tracking-widest"
        >
          {mode === 'login' ? "Don't have an ID? Create one" : "Already registered? Login"}
        </button>
      </div>
    </div>
  );
}
