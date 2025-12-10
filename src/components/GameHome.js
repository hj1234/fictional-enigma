"use client";
import { useState } from 'react';

export default function GameHome({ onStartGame }) {
  const [step, setStep] = useState('LANDING'); // 'LANDING' or 'SETUP'
  const [firmName, setFirmName] = useState('');
  const [error, setError] = useState('');

  const validateAndStart = () => {
    // 1. Basic Profanity Filter (Regex for common offensive patterns)
    // This is a simple MVP filter. In prod, use a library like 'bad-words'.
    const badWords = /fuck|shit|bitch|cunt|nigger|asshole|dick|cock|pussy/i;
    
    if (!firmName.trim()) {
      setError("FIRM NAME REQUIRED.");
      return;
    }
    if (badWords.test(firmName)) {
      setError("FIRM NAME REJECTED BY COMPLIANCE.");
      return;
    }
    if (firmName.length > 20) {
      setError("NAME TOO LONG (MAX 20 CHARS).");
      return;
    }

    onStartGame(firmName);
  };

  if (step === 'LANDING') {
    return (
      <div className="h-screen bg-black text-amber-500 font-mono flex flex-col items-center justify-center p-4 selection:bg-amber-900 selection:text-white">
        <div className="max-w-2xl text-center flex flex-col gap-8 animate-in fade-in zoom-in duration-1000">
          
          {/* LOGO */}
          <div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter glow mb-2">POD SHOP</h1>
          </div>

          {/* OBJECTIVE */}
          <div className="border-y border-amber-900/50 py-8 my-4 space-y-4">
            <p className="text-lg text-gray-400">
              OBJECTIVE: <span className="text-white">Build the most profitable hedge fund in history.</span>
            </p>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Hire psychopaths. Leverage other people's money. Ignore the SEC. 
              Become Too Big To Fail.
            </p>
          </div>

          {/* BUTTON */}
          <button 
            onClick={() => setStep('SETUP')}
            className="group relative px-8 py-4 bg-amber-900/20 border border-amber-500 hover:bg-amber-500 hover:text-black transition-all duration-300 font-bold tracking-wider text-xl"
          >
            <span className="animate-pulse">INITIALIZE SYSTEM</span>
            <div className="absolute inset-0 border border-amber-500 blur-sm opacity-50 group-hover:opacity-100 transition-opacity"></div>
          </button>

          <p className="text-xs text-gray-700 mt-10">v0.1.0 // COPYRIGHT (C) 2024</p>
        </div>
      </div>
    );
  }

  // --- SETUP SCREEN ---
  return (
    <div className="h-screen bg-black text-amber-500 font-mono flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md border border-gray-800 bg-gray-900/40 p-8 rounded-lg shadow-2xl shadow-amber-900/20 animate-in slide-in-from-bottom-10">
        
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-2">FIRM REGISTRATION</h2>
        
        <div className="space-y-6">
          
          {/* ASSETS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black border border-gray-800 p-4 rounded text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Seed Capital</div>
              <div className="text-xl font-bold text-blue-400">$10,000,000</div>
            </div>
            <div className="bg-black border border-gray-800 p-4 rounded text-center">
              <div className="text-xs text-gray-500 uppercase mb-1">Investor AUM</div>
              <div className="text-xl font-bold text-white">$100,000,000</div>
            </div>
          </div>

          {/* NAME INPUT */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">ENTER FIRM NAME</label>
            <input 
              autoFocus
              type="text" 
              value={firmName}
              onChange={(e) => {
                setFirmName(e.target.value.toUpperCase()); 
                setError('');
              }}
              placeholder="E.G. QUANTUM CAPITAL"
              className="w-full bg-black border border-amber-900 text-amber-500 p-3 text-lg focus:outline-none focus:border-amber-500 placeholder-gray-800"
            />
            {error && <div className="text-red-500 text-xs mt-2 font-bold animate-pulse">ERROR: {error}</div>}
          </div>

          <button 
            onClick={validateAndStart}
            className="w-full py-4 bg-green-900/20 border border-green-800 text-green-500 hover:bg-green-500 hover:text-black font-bold transition-all"
          >
            LAUNCH FUND
          </button>

        </div>
      </div>
    </div>
  );
}