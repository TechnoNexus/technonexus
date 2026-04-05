'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function NexusSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [aiComment, setAiComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/nexus-search', {
        method: 'POST',
        body: JSON.stringify({ query }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setResults(data.results || []);
      setAiComment(data.aiComment || '');
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl glass-panel rounded-[2.5rem] border-white/10 shadow-2xl animate-in zoom-in slide-in-from-top-4 duration-300 overflow-hidden">
        <form onSubmit={handleSearch} className="p-8 pb-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-500 group-focus-within:text-neon-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the Nexus... (e.g., How do you build an AI ecosystem?)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-lg text-white outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all placeholder:text-slate-600"
            />
            {isLoading && (
              <div className="absolute inset-y-0 right-6 flex items-center">
                <div className="w-5 h-5 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
              </div>
            )}
          </div>
        </form>

        <div className="px-8 pb-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {aiComment && (
            <div className="mb-8 p-4 rounded-2xl bg-white/5 border-l-4 border-neon-violet italic text-slate-400 text-sm animate-in fade-in slide-in-from-left duration-500">
              "{aiComment}"
            </div>
          )}

          <div className="space-y-4">
            {results.map((result, idx) => (
              <button
                key={idx}
                onClick={() => {
                  router.push(result.url);
                  onClose();
                }}
                className="w-full text-left group p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-neon-cyan/30 hover:bg-white/10 transition-all flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                      result.type === 'blog' ? 'bg-neon-cyan/10 text-neon-cyan' : 'bg-electric-violet/10 text-electric-violet'
                    }`}>
                      {result.type}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">Match Score: {result.relevanceScore}%</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors">
                    {result.title}
                  </h3>
                </div>
                <svg className="w-5 h-5 text-slate-700 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ))}

            {results.length === 0 && query && !isLoading && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4 text-slate-700">∅</div>
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">No matching frequencies found in the Nexus.</p>
              </div>
            )}

            {!query && !isLoading && (
              <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-[2rem]">
                <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.2em]">Awaiting input for AI analysis...</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center px-8">
           <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">TechnoNexus Search OS v1.0</span>
           <div className="flex gap-4">
              <span className="text-[10px] text-slate-600 font-mono uppercase">Esc to Close</span>
              <span className="text-[10px] text-slate-600 font-mono uppercase">Enter to Search</span>
           </div>
        </div>
      </div>
    </div>
  );
}
