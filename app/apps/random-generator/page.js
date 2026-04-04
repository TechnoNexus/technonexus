'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function RandomGenerator() {
  const [mode, setMode] = useState('number'); // number, string, uuid
  const [result, setResult] = useState('');
  const [minValue, setMinValue] = useState(1);
  const [maxValue, setMaxValue] = useState(100);
  const [stringLength, setStringLength] = useState(16);
  const [results, setResults] = useState([]);

  const hapticFeedback = async (style = ImpactStyle.Medium) => {
    try { await Haptics.impact({ style }); } catch (e) {}
  };

  const generateNumber = () => {
    hapticFeedback(ImpactStyle.Heavy);
    const min = Math.ceil(parseInt(minValue));
    const max = Math.floor(parseInt(maxValue));
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    const generated = { id: Date.now(), value: num.toString(), type: 'number' };
    setResult(num.toString());
    setResults([generated, ...results.slice(0, 9)]);
  };

  const generateString = () => {
    hapticFeedback(ImpactStyle.Heavy);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';
    for (let i = 0; i < parseInt(stringLength); i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = { id: Date.now(), value: str, type: 'string' };
    setResult(str);
    setResults([generated, ...results.slice(0, 9)]);
  };

  const generateUUID = () => {
    hapticFeedback(ImpactStyle.Heavy);
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    const generated = { id: Date.now(), value: uuid, type: 'uuid' };
    setResult(uuid);
    setResults([generated, ...results.slice(0, 9)]);
  };

  const generateRandom = () => {
    if (mode === 'number') generateNumber();
    else if (mode === 'string') generateString();
    else if (mode === 'uuid') generateUUID();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    hapticFeedback(ImpactStyle.Light);
  };

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-20">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <Link href="/apps" className="text-neon-cyan hover:underline font-mono text-sm uppercase tracking-widest font-black">← Back</Link>
          <div className="px-4 py-1 rounded-full border border-neon-cyan bg-neon-cyan/10">
            <span className="text-[10px] block font-black text-neon-cyan uppercase tracking-widest text-center">Random Generator</span>
          </div>
        </header>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
            RANDOM <span className="gradient-text-cyan">GENERATOR</span>
          </h1>
          <p className="text-slate-500 text-xs uppercase tracking-[0.2em]">Generate random values instantly</p>
        </div>

        {/* Mode Selection */}
        <div className="glass-panel p-6 rounded-[2rem] border-white/5 mb-8">
          <p className="text-[10px] font-bold text-slate-600 uppercase mb-4 ml-1">Generator Type</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'number', label: 'Number' },
              { id: 'string', label: 'String' },
              { id: 'uuid', label: 'UUID' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setResult(''); hapticFeedback(ImpactStyle.Light); }}
                className={`py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  mode === m.id
                    ? 'bg-neon-cyan text-black border border-neon-cyan'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode-specific Options */}
        <div className="glass-panel p-6 rounded-[2rem] border-white/5 mb-8">
          {mode === 'number' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase mb-2 block ml-1">Min Value</label>
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-neon-cyan outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase mb-2 block ml-1">Max Value</label>
                <input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-neon-cyan outline-none transition-all"
                />
              </div>
            </div>
          )}

          {mode === 'string' && (
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase mb-2 block ml-1">String Length</label>
              <input
                type="number"
                value={stringLength}
                onChange={(e) => setStringLength(e.target.value)}
                min="1"
                max="128"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-neon-cyan outline-none transition-all"
              />
            </div>
          )}

          {mode === 'uuid' && (
            <p className="text-slate-400 text-sm text-center italic">UUID v4 will be generated</p>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="glass-panel p-6 rounded-[2rem] border-neon-cyan/20 mb-8 animate-in fade-in zoom-in duration-300">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-3 text-center">Generated Value</p>
            <div className="bg-black/40 border border-neon-cyan/30 rounded-lg p-4 mb-4 break-all font-mono text-neon-cyan text-center">
              {result}
            </div>
            <button
              onClick={() => copyToClipboard(result)}
              className="w-full py-3 rounded-lg bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan font-black text-xs uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all"
            >
              Copy to Clipboard
            </button>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generateRandom}
          className="w-full py-6 rounded-2xl bg-neon-cyan text-black font-black text-lg uppercase tracking-widest shadow-neon-glow hover:scale-[0.98] transition-all mb-8"
        >
          Generate
        </button>

        {/* History */}
        {results.length > 0 && (
          <div className="glass-panel p-6 rounded-[2rem] border-white/5">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-4">History</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => copyToClipboard(r.value)}
                  className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-slate-300 truncate transition-all"
                >
                  {r.value}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
