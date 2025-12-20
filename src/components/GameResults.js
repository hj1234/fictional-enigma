"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AWARDS } from '../lib/game/Awards.js';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const fmtMoney = (n) => {
  if (typeof n !== 'number') return "$0"; 
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
};

export default function GameResults({ shareableId }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/games/results/${shareableId}`);
        if (!response.ok) {
          throw new Error('Results not found');
        }
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (shareableId) {
      fetchResults();
    }
  }, [shareableId]);

  const shareableUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/results/${shareableId}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-amber-500 font-mono p-10 flex items-center justify-center">
        <div className="animate-pulse">LOADING RESULTS...</div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-black text-amber-500 font-mono p-10 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">RESULTS NOT FOUND</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-amber-900/20 border border-amber-500 hover:bg-amber-500 hover:text-black transition-all font-bold"
          >
            RETURN TO GAME
          </button>
        </div>
      </div>
    );
  }

  const resultsData = results.results_data || {};
  const earnedAwards = resultsData.earnedAwards || [];
  const firmCash = resultsData.firmCash || 0;

  return (
    <div className="h-screen bg-black text-amber-500 font-mono p-3 md:p-6 flex items-center justify-center overflow-hidden">
      <div className="max-w-5xl w-full h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-3 md:mb-4 shrink-0">
          <h1 className="text-xl md:text-2xl font-bold text-amber-500 mb-1">POD SHOP</h1>
          <h2 className="text-lg md:text-xl font-bold text-white mb-1">{results.fund_name}</h2>
          <p className="text-xs text-gray-500">FINAL RESULTS</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4 shrink-0">
          <div className="bg-gray-900 border border-amber-800 p-2 md:p-3 rounded">
            <div className="text-[10px] md:text-xs text-gray-500 uppercase mb-1">Lifetime PnL</div>
            <div className={`text-lg md:text-2xl font-bold ${results.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {fmtMoney(results.total_pnl)}
            </div>
          </div>
          <div className="bg-gray-900 border border-amber-800 p-2 md:p-3 rounded">
            <div className="text-[10px] md:text-xs text-gray-500 uppercase mb-1">Firm Cash</div>
            <div className={`text-lg md:text-2xl font-bold ${firmCash >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
              {fmtMoney(firmCash)}
            </div>
          </div>
          <div className="bg-gray-900 border border-amber-800 p-2 md:p-3 rounded">
            <div className="text-[10px] md:text-xs text-gray-500 uppercase mb-1">Days since inception</div>
            <div className="text-lg md:text-2xl font-bold text-gray-300">
              {results.game_days_played !== null && results.game_days_played !== undefined ? results.game_days_played : '—'}
            </div>
          </div>
          <div className="bg-gray-900 border border-amber-800 p-2 md:p-3 rounded">
            <div className="text-[10px] md:text-xs text-gray-500 uppercase mb-1">Annualised performance</div>
            <div className={`text-lg md:text-2xl font-bold ${results.annualized_performance !== null && results.annualized_performance !== undefined && results.annualized_performance >= 0 ? 'text-green-500' : results.annualized_performance !== null && results.annualized_performance !== undefined ? 'text-red-500' : 'text-gray-500'}`}>
              {results.annualized_performance !== null && results.annualized_performance !== undefined
                ? `${(results.annualized_performance * 100).toFixed(1)}%`
                : '—'}
            </div>
          </div>
        </div>

        {/* Trophy Cabinet - Scrollable if needed */}
        <div className="bg-gray-900 border border-amber-800 p-2 md:p-3 rounded mb-3 md:mb-4 flex-1 min-h-0 flex flex-col">
          <h3 className="text-sm md:text-base font-bold text-amber-500 mb-2 shrink-0">TROPHY CABINET</h3>
          {earnedAwards.length === 0 ? (
            <div className="text-center py-4 text-gray-600 flex items-center justify-center h-full">
              <div>
                <p className="text-xs md:text-sm mb-1">No awards earned</p>
                <p className="text-[10px] md:text-xs">Keep building your fund to earn recognition!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 overflow-y-auto">
              {earnedAwards.map((awardId) => {
                const award = Object.values(AWARDS).find(a => a.id === awardId);
                if (!award) return null;
                return (
                  <div 
                    key={awardId}
                    className="bg-black border border-amber-800 rounded p-1.5 md:p-2 text-center hover:border-amber-500 transition-colors"
                  >
                    <div 
                      className="w-full aspect-square mb-1 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: award.svg }}
                    />
                    <h4 className="text-[10px] md:text-xs font-bold text-amber-500 mb-0.5 leading-tight">{award.name}</h4>
                    <p className="text-[8px] md:text-[10px] text-gray-500 leading-tight">{award.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Share Section */}
        <div className="bg-gray-900 border border-amber-800 p-2 md:p-3 rounded mb-2 md:mb-3 shrink-0">
          <h3 className="text-xs md:text-sm font-bold text-amber-500 mb-2">SHARE YOUR RESULTS</h3>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={shareableUrl}
              readOnly
              className="flex-1 bg-black border border-amber-900 text-amber-500 p-1.5 md:p-2 text-[10px] md:text-xs focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-amber-900/20 border border-amber-500 hover:bg-amber-500 hover:text-black transition-all font-bold text-xs md:text-sm whitespace-nowrap"
            >
              {copied ? 'COPIED!' : 'COPY LINK'}
            </button>
          </div>
        </div>

        {/* Return Button */}
        <div className="text-center shrink-0">
          <button
            onClick={() => router.push('/')}
            className="px-4 md:px-6 py-2 md:py-3 bg-amber-900/20 border border-amber-500 hover:bg-amber-500 hover:text-black transition-all font-bold text-xs md:text-sm"
          >
            START NEW GAME
          </button>
        </div>
      </div>
    </div>
  );
}

