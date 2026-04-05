'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function DevUtility() {
  const [tool, setTool] = useState('json'); // json, base64
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const hapticFeedback = async (style = ImpactStyle.Medium) => {
    try { await Haptics.impact({ style }); } catch (e) {}
  };

  const formatJSON = () => {
    setError('');
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
      hapticFeedback(ImpactStyle.Heavy);
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
      hapticFeedback(ImpactStyle.Light);
    }
  };

  const minifyJSON = () => {
    setError('');
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      hapticFeedback(ImpactStyle.Heavy);
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
      hapticFeedback(ImpactStyle.Light);
    }
  };

  const encodeBase64 = () => {
    setError('');
    try {
      const encoded = btoa(unescape(encodeURIComponent(input)));
      setOutput(encoded);
      hapticFeedback(ImpactStyle.Heavy);
    } catch (e) {
      setError('Encoding failed: ' + e.message);
      hapticFeedback(ImpactStyle.Light);
    }
  };

  const decodeBase64 = () => {
    setError('');
    try {
      const decoded = decodeURIComponent(escape(atob(input)));
      setOutput(decoded);
      hapticFeedback(ImpactStyle.Heavy);
    } catch (e) {
      setError('Decoding failed: ' + e.message);
      hapticFeedback(ImpactStyle.Light);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    hapticFeedback(ImpactStyle.Light);
  };

  const process = () => {
    if (!input.trim()) {
      setError('Input is empty');
      return;
    }
    
    if (tool === 'json') formatJSON();
    else if (tool === 'base64-encode') encodeBase64();
    else if (tool === 'base64-decode') decodeBase64();
  };

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-20">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <Link href="/apps" className="text-neon-cyan hover:underline font-mono text-sm uppercase tracking-widest font-black">← Back</Link>
          <div className="px-4 py-1 rounded-full border border-electric-violet bg-electric-violet/10">
            <span className="text-[10px] block font-black text-electric-violet uppercase tracking-widest text-center">Dev Utility</span>
          </div>
        </header>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
            DEV <span className="gradient-text-cyan">UTILITY</span>
          </h1>
          <p className="text-slate-500 text-xs uppercase tracking-[0.2em]">Essential developer tools in one place</p>
        </div>

        {/* Tool Selection */}
        <div className="glass-panel p-6 rounded-[2rem] border-white/5 mb-8">
          <p className="text-[10px] font-bold text-slate-600 uppercase mb-4 ml-1">Select Tool</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'json', label: 'JSON' },
              { id: 'base64-encode', label: 'Base64 Enc' },
              { id: 'base64-decode', label: 'Base64 Dec' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setTool(t.id); setInput(''); setOutput(''); setError(''); hapticFeedback(ImpactStyle.Light); }}
                className={`py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  tool === t.id
                    ? 'bg-electric-violet text-white border border-electric-violet'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input/Output Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 flex-1">
          {/* Input */}
          <div className="glass-panel p-6 rounded-[2rem] border-white/5 flex flex-col">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Input</p>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-white font-mono focus:border-neon-cyan outline-none transition-all resize-none"
              placeholder="Paste your content here..."
            />
          </div>

          {/* Output */}
          <div className="glass-panel p-6 rounded-[2rem] border-white/5 flex flex-col">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Output</p>
            <textarea
              value={output}
              readOnly
              className="flex-1 bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-slate-300 font-mono resize-none"
              placeholder="Result will appear here..."
            />
            {output && (
              <button
                onClick={() => copyToClipboard(output)}
                className="mt-3 py-2 rounded-lg bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan font-bold text-xs uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all"
              >
                Copy
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6 animate-in shake duration-300">
            <p className="text-red-400 text-sm font-mono">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={process}
            className="flex-1 py-4 rounded-2xl bg-neon-cyan text-black font-black uppercase text-sm tracking-widest shadow-neon-glow hover:scale-[0.98] transition-all"
          >
            {tool === 'json' ? 'Format JSON' : tool === 'base64-encode' ? 'Encode' : 'Decode'}
          </button>
          {tool === 'json' && (
            <button
              onClick={minifyJSON}
              className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-sm tracking-widest hover:bg-white/10 transition-all"
            >
              Minify
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
