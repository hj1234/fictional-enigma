"use client";
import { useState } from 'react';
import WorldMap from './WorldMap';
import Leaderboard from './Leaderboard';
import filter from 'leo-profanity';

export default function GameHome({ onStartGame }) {
  const [step, setStep] = useState('LANDING'); // 'LANDING' or 'SETUP'
  const [firmName, setFirmName] = useState('');
  const [error, setError] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // SQL injection detection
  const detectSQLInjection = (input) => {
    if (!input) return false;
    
    // Common SQL injection patterns
    const sqlPatterns = [
      /['";]/g,                    // Single quotes, double quotes, semicolons
      /--/g,                        // SQL comments
      /\/\*/g,                      // Multi-line comment start
      /\*\//g,                      // Multi-line comment end
      /(union|select|insert|update|delete|drop|create|alter|exec|execute|script)/gi,  // SQL keywords
      /xp_/gi,                      // Extended stored procedures
      /sp_/gi,                      // Stored procedures
      /0x[0-9a-f]+/gi,              // Hex encoded strings
      /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/gi,  // OR/AND injection patterns
      /(\bor\b|\band\b)\s+['"]/gi,  // OR/AND with quotes
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        return true;
      }
    }
    
    return false;
  };

  const validateAndStart = () => {
    const trimmedName = firmName.trim();
    
    if (!trimmedName) {
      setError("FIRM NAME REQUIRED.");
      return;
    }
    
    // Check for SQL injection
    if (detectSQLInjection(trimmedName)) {
      setError("INVALID CHARACTERS DETECTED. FUND NAME REJECTED.");
      return;
    }
    
    // Check length first
    if (trimmedName.length > 35) {
      setError("NAME TOO LONG (MAX 35 CHARS).");
      return;
    }
    
    // Profanity check using leo-profanity
    if (filter.check(trimmedName)) {
      setError("INAPROPRIATE NAME. FUND NAME REJECTED.");
      return;
    }

    onStartGame(trimmedName);
  };

  if (step === 'LANDING') {
    return (
      <div className="h-screen bg-black text-amber-500 font-mono flex flex-col items-center justify-center p-2 md:p-4 selection:bg-amber-900 selection:text-white relative overflow-hidden">
        <WorldMap />
        <div className="max-w-2xl text-center flex flex-col gap-4 md:gap-8 animate-in fade-in zoom-in duration-1000 relative z-10">
          
          {/* LOGO */}
          <div>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-tighter glow mb-2">POD SHOP</h1>
          </div>

          {/* OBJECTIVE */}
          <div className="border-y border-amber-900/50 py-4 md:py-8 my-2 md:my-4 space-y-2 md:space-y-4">
            <p className="text-sm md:text-lg text-gray-400">
              OBJECTIVE: <span className="text-white">You have five years to build the world's greatest hedge fund.</span>
            </p>
            <p className="text-xs md:text-sm text-gray-600 max-w-md mx-auto px-2">
              Hire psychopaths. Leverage other people's money. Ignore the SEC. 
              Become Too Big To Fail.
            </p>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col gap-2 md:gap-4">
            <button 
              onClick={() => setStep('SETUP')}
              className="group relative px-4 md:px-8 py-2.5 md:py-4 bg-amber-900/20 border border-amber-500 hover:bg-amber-500 hover:text-black transition-all duration-300 font-bold tracking-wider text-sm md:text-xl"
            >
              <span className="animate-pulse">INITIALIZE SYSTEM</span>
              <div className="absolute inset-0 border border-amber-500 blur-sm opacity-50 group-hover:opacity-100 transition-opacity"></div>
            </button>
            
            <button 
              onClick={() => setShowLeaderboard(true)}
              className="group relative px-4 md:px-8 py-2 md:py-3 bg-gray-900/20 border border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-all duration-300 font-bold tracking-wider text-xs md:text-sm"
            >
              VIEW LEADERBOARD
            </button>
          </div>

          <p className="text-[10px] md:text-xs text-gray-700 mt-4 md:mt-10">
            v1.0.0 // <a href="mailto:podfather@podshop.io" className="hover:text-amber-500 transition-colors">Contact</a> // <button onClick={() => setShowDisclaimer(true)} className="hover:text-amber-500 transition-colors">Disclaimer</button> // COPYRIGHT (C) 2025
          </p>
        </div>
        
        {/* Leaderboard Modal */}
        <Leaderboard 
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
        />
        
        {/* Disclaimer Modal */}
        {showDisclaimer && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDisclaimer(false)}
          >
            <div 
              className="bg-gray-900 border border-amber-800 rounded-lg p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-amber-500">DISCLAIMER</h2>
                <button
                  onClick={() => setShowDisclaimer(false)}
                  className="text-gray-500 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              
              <div className="text-xs md:text-sm text-gray-300 leading-relaxed space-y-4">
                <p>
                  This game is a work of fiction. Any resemblance to actual persons, living or dead, or actual events, is purely coincidental.
                </p>
                <p>
                  All characters, organizations, institutions, and events portrayed in this game are fictional. Any similarity to real-world hedge funds, financial institutions, trading firms, regulatory bodies, or individuals is entirely unintentional and coincidental.
                </p>
                <p>
                  This game is for entertainment purposes only and does not constitute financial advice, investment guidance, or any form of professional recommendation. The game mechanics, market behaviors, and financial outcomes are simulated and should not be used as a basis for real-world financial decisions.
                </p>
                <p>
                  The creators and publishers of this game assume no responsibility for any actions taken based on the content or mechanics of this game.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- SETUP SCREEN ---
  return (
    <div className="h-screen bg-black text-amber-500 font-mono flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden">
      <WorldMap />
      <div className="w-full max-w-md border border-gray-800 bg-gray-900/40 p-4 md:p-8 rounded-lg shadow-2xl shadow-amber-900/20 animate-in slide-in-from-bottom-10 relative z-10">
        
        <h2 className="text-lg md:text-2xl font-bold text-white mb-4 md:mb-6 border-b border-gray-700 pb-2">FIRM REGISTRATION</h2>
        
        <div className="space-y-4 md:space-y-6">
          
          {/* ASSETS */}
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div className="bg-black border border-gray-800 p-2 md:p-4 rounded text-center">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase mb-1">Seed Capital</div>
              <div className="text-base md:text-xl font-bold text-blue-400">$30M</div>
            </div>
            <div className="bg-black border border-gray-800 p-2 md:p-4 rounded text-center">
              <div className="text-[10px] md:text-xs text-gray-500 uppercase mb-1">Investor AUM</div>
              <div className="text-base md:text-xl font-bold text-white">$100M</div>
            </div>
          </div>

          {/* NAME INPUT */}
          <div>
            <label className="block text-[10px] md:text-xs text-gray-400 mb-1 md:mb-2">ENTER FIRM NAME</label>
            <input 
              autoFocus
              type="text" 
              value={firmName}
              onChange={(e) => {
                setFirmName(e.target.value.toUpperCase()); 
                setError('');
              }}
              placeholder="E.G. QUANTUM CAPITAL"
              className="w-full bg-black border border-amber-900 text-amber-500 p-2 md:p-3 text-sm md:text-lg focus:outline-none focus:border-amber-500 placeholder-gray-800"
            />
            {error && <div className="text-red-500 text-[10px] md:text-xs mt-1 md:mt-2 font-bold animate-pulse">ERROR: {error}</div>}
          </div>

          <button 
            onClick={validateAndStart}
            className="w-full py-2.5 md:py-4 bg-green-900/20 border border-green-800 text-green-500 hover:bg-green-500 hover:text-black font-bold transition-all text-sm md:text-base"
          >
            LAUNCH FUND
          </button>

        </div>
      </div>
    </div>
  );
}