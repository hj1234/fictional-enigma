"use client";
import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const fmtMoney = (n) => {
  if (typeof n !== 'number') return "$0"; 
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
};

export default function Leaderboard({ isOpen, onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const LIMIT = 20;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const currentOffset = entries.length;
      const response = await fetch(`${API_BASE}/api/leaderboard?limit=${LIMIT}&offset=${currentOffset}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      
      const data = await response.json();
      setEntries(prev => [...prev, ...data.entries]);
      setHasMore(data.has_more);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [entries.length, loading, hasMore]);

  useEffect(() => {
    if (isOpen) {
      // Reset and load initial entries
      setEntries([]);
      setHasMore(true);
      // Load first batch immediately
      const loadInitial = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API_BASE}/api/leaderboard?limit=${LIMIT}&offset=0`);
          if (!response.ok) throw new Error('Failed to fetch leaderboard');
          
          const data = await response.json();
          setEntries(data.entries);
          setHasMore(data.has_more);
        } catch (err) {
          console.error('Failed to load leaderboard:', err);
        } finally {
          setLoading(false);
        }
      };
      loadInitial();
    }
  }, [isOpen]);

  // Intersection Observer for infinite scroll
  const lastEntryElementRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMore]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-amber-800 rounded-lg p-4 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 md:mb-6 shrink-0">
          <h2 className="text-xl md:text-2xl font-bold text-amber-500">GLOBAL LEADERBOARD</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        {/* Leaderboard Table */}
        <div className="flex-grow overflow-y-auto">
          <table className="w-full text-xs md:text-sm">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="p-2 md:p-3 text-left text-gray-400 font-bold">RANK</th>
                <th className="p-2 md:p-3 text-left text-gray-400 font-bold">FUND NAME</th>
                <th className="p-2 md:p-3 text-right text-gray-400 font-bold">TOTAL PnL</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr 
                  key={`${entry.fund_name}-${index}`}
                  ref={index === entries.length - 1 ? lastEntryElementRef : null}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30"
                >
                  <td className="p-2 md:p-3 text-gray-500">#{index + 1}</td>
                  <td className="p-2 md:p-3 text-white font-bold">{entry.fund_name}</td>
                  <td className={`p-2 md:p-3 text-right font-bold ${entry.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {fmtMoney(entry.total_pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {loading && (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          )}
          
          {!hasMore && entries.length > 0 && (
            <div className="text-center py-4 text-gray-600 text-xs">End of leaderboard</div>
          )}
          
          {entries.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-600">
              <p className="text-lg mb-2">No entries yet</p>
              <p className="text-sm">Be the first to complete a game!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

