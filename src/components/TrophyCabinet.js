"use client";
import { useState, useEffect } from 'react';
import { AWARDS } from '../lib/game/Awards.js';

export default function TrophyCabinet({ isOpen, onClose }) {
  const [earnedAwards, setEarnedAwards] = useState([]);
  
  useEffect(() => {
    if (isOpen) {
      // Load earned awards from localStorage
      try {
        const saved = localStorage.getItem('pod_shop_earned_awards');
        const awardIds = saved ? JSON.parse(saved) : [];
        const awards = awardIds.map(id => {
          for (const award of Object.values(AWARDS)) {
            if (award.id === id) return award;
          }
          return null;
        }).filter(a => a !== null);
        setEarnedAwards(awards);
      } catch (e) {
        console.warn('Failed to load awards:', e);
        setEarnedAwards([]);
      }
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-amber-800 rounded-lg p-4 md:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-amber-500">TROPHY CABINET</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        {/* Awards Grid */}
        {earnedAwards.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg mb-2">No awards yet</p>
            <p className="text-sm">Keep building your fund to earn recognition!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {earnedAwards.map((award) => (
              <div 
                key={award.id}
                className="bg-black border border-amber-800 rounded p-3 md:p-4 text-center hover:border-amber-500 transition-colors"
              >
                <div className="w-full aspect-square mb-2 md:mb-3 flex items-center justify-center">
                  <img 
                    src={award.image} 
                    alt={award.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to SVG if PNG doesn't exist
                      e.target.src = award.image.replace('.png', '.svg');
                    }}
                  />
                </div>
                <h3 className="text-xs md:text-sm font-bold text-amber-500 mb-1">{award.name}</h3>
                <p className="text-[10px] md:text-xs text-gray-500">{award.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

