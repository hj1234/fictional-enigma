"use client";
import { useState, useEffect } from 'react';
import AnimatedNumber from './AnimatedNumber';

const fmtMoney = (n) => {
  if (typeof n !== 'number') return "$0"; 
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
};

const fmtPct = (n) => {
  if (typeof n !== 'number') return "0.0%";
  return (n * 100).toFixed(1) + "%";
};

const PodsTable = ({ pods, dateKey, localLeverage, onWeightChange, poachedPods = [], onFirePod }) => {
  const [selectedPod, setSelectedPod] = useState(null);
  const [animatingPods, setAnimatingPods] = useState(new Set());
  
  // Handle poached pods animation
  useEffect(() => {
    if (poachedPods && poachedPods.length > 0) {
      poachedPods.forEach(podId => {
        setAnimatingPods(prev => new Set(prev).add(podId));
        // Remove animation after 2 seconds
        setTimeout(() => {
          setAnimatingPods(prev => {
            const next = new Set(prev);
            next.delete(podId);
            return next;
          });
        }, 2000);
      });
    }
  }, [poachedPods]);
  
  return (
    <div className="flex-grow border border-gray-800 bg-gray-900/40 rounded flex flex-col overflow-hidden" data-tutorial="pods-table">
      <h2 className="p-2 md:p-3 text-[10px] md:text-xs text-gray-400 border-b border-gray-800 shrink-0">ACTIVE PODS</h2>
      <div className="flex-grow overflow-y-auto">
        <table className="w-full text-[10px] md:text-xs">
          <thead className="sticky top-0 bg-gray-900">
            <tr>
              <th className="p-1 md:p-2 border-b border-gray-800 text-left">Pod</th>
              <th className="p-1 md:p-2 border-b border-gray-800 text-center">Alloc %</th>
              <th className="hidden md:table-cell p-2 border-b border-gray-800 text-right">Alpha</th>
              <th className="hidden md:table-cell p-2 border-b border-gray-800 text-right">Beta</th>
              <th className="hidden md:table-cell p-2 border-b border-gray-800 text-right">DD</th>
              <th className="p-1 md:p-2 border-b border-gray-800 text-right">Monthly PnL</th>
              <th className="p-1 md:p-2 border-b border-gray-800 text-right">Total PnL</th>
              <th className="p-1 border-b border-gray-800 text-center w-8"></th>
            </tr>
          </thead>
          <tbody>
            {pods.map((pod) => {
              const isPoached = animatingPods.has(pod.id);
              return (
              <tr 
                key={`pod-${dateKey}-${pod.id}`} 
                className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-all duration-1000 ${
                  isPoached 
                    ? 'bg-red-900/50 animate-pulse border-red-500/50' 
                    : ''
                }`}
              >
                <td className="p-1 md:p-2">
                  <div className="text-white font-bold text-[10px] md:text-xs">{pod.name}</div>
                  {pod.asset_class && (
                    <div className="text-cyan-400 text-[8px] md:text-[9px] uppercase">
                      {pod.asset_class.replace(/_/g, ' ').toUpperCase()}
                    </div>
                  )}
                </td>
                
                <td className="p-1 md:p-2 text-center">
                  <div className="flex items-center justify-center gap-1 md:gap-2">
                    <button onClick={() => onWeightChange(pod.id, -5)} className="text-gray-500 hover:text-red-500 px-0.5 md:px-1 border border-gray-800 rounded bg-black text-[10px]">-</button>
                    <div className="w-6 md:w-8 text-center">
                      <AnimatedNumber 
                        value={pod.alloc_pct} 
                        formatter={fmtPct}
                        className="text-blue-400 font-bold text-[10px] md:text-xs"
                      />
                    </div>
                    <button onClick={() => onWeightChange(pod.id, 5)} className="text-gray-500 hover:text-green-500 px-0.5 md:px-1 border border-gray-800 rounded bg-black text-[10px]">+</button>
                  </div>
                </td>
                
                <td className="hidden md:table-cell p-2 text-right font-mono">
                  <AnimatedNumber 
                    value={pod.alpha || 0} 
                    formatter={(v) => (v * 100).toFixed(2) + "%"}
                    className="text-cyan-400"
                  />
                </td>
                
                <td className="hidden md:table-cell p-2 text-right font-mono">
                  <AnimatedNumber 
                    value={pod.beta || 0} 
                    formatter={(v) => v.toFixed(2)}
                    className="text-purple-400"
                  />
                </td>
                
                <td className="hidden md:table-cell p-2 text-right font-mono">
                  <AnimatedNumber 
                    value={pod.drawdown} 
                    formatter={fmtPct}
                    className={pod.drawdown < -0.05 ? 'text-red-500 font-bold' : 'text-gray-500'}
                  />
                </td>

                <td className="p-1 md:p-2 text-right font-mono">
                  <AnimatedNumber 
                    value={pod.monthly_pnl || 0} 
                    formatter={fmtMoney}
                    className={`font-bold text-[10px] md:text-xs ${(pod.monthly_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}
                  />
                </td>

                <td className="p-1 md:p-2 text-right font-mono">
                  <AnimatedNumber 
                    value={pod.pnl} 
                    formatter={fmtMoney}
                    className={`font-bold text-[10px] md:text-xs ${pod.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}
                  />
                </td>
                <td className="p-1 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPod(selectedPod === pod.id ? null : pod.id);
                    }}
                    className={`text-amber-500 hover:text-amber-400 text-xs font-bold w-6 h-6 flex items-center justify-center border border-amber-600 rounded transition-colors ${
                      selectedPod === pod.id 
                        ? 'bg-amber-900/30 border-amber-500' 
                        : 'bg-amber-900/10 hover:bg-amber-900/20'
                    }`}
                  >
                    i
                  </button>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-1.5 md:p-2 border-t border-gray-800 text-[9px] md:text-xs text-gray-500 text-center shrink-0">
         {pods.length} Active Teams • {localLeverage.toFixed(1)}x Gross
      </div>
      
      {/* Pod Info Modal */}
      {selectedPod && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPod(null)}
        >
          <div 
            className="bg-gray-900 border border-amber-800 rounded-lg p-4 md:p-6 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPod(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-white text-lg font-bold w-6 h-6 flex items-center justify-center"
              aria-label="Close"
            >
              ×
            </button>
            
            {(() => {
              const pod = pods.find(p => p.id === selectedPod);
              if (!pod) return null;
              
              return (
                <>
                  <h3 className="text-white font-bold text-base md:text-lg mb-1 pr-6">{pod.name}</h3>
                  {pod.asset_class && (
                    <div className="text-cyan-400 text-xs md:text-sm uppercase mb-1">
                      {pod.asset_class.replace(/_/g, ' ').toUpperCase()}
                    </div>
                  )}
                  {pod.specialism && (
                    <div className="text-gray-500 text-xs md:text-sm uppercase mb-2">
                      {pod.specialism}
                    </div>
                  )}
                  
                  {/* Bio/Description */}
                  {pod.bio && (
                    <div className="mb-4 pb-4 border-b border-gray-800">
                      <div className="text-[10px] md:text-xs text-gray-500 uppercase mb-1">Description</div>
                      <div className="text-gray-300 text-xs md:text-sm italic">{pod.bio}</div>
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[9px] md:text-[10px] text-gray-500 uppercase mb-1">Alpha</div>
                        <div className="text-cyan-400 font-mono text-sm md:text-base font-bold">
                          <AnimatedNumber 
                            value={pod.alpha || 0} 
                            formatter={(v) => (v * 100).toFixed(2) + "%"}
                            className="text-cyan-400"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] md:text-[10px] text-gray-500 uppercase mb-1">Beta</div>
                        <div className="text-purple-400 font-mono text-sm md:text-base font-bold">
                          <AnimatedNumber 
                            value={pod.beta || 0} 
                            formatter={(v) => v.toFixed(2)}
                            className="text-purple-400"
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[9px] md:text-[10px] text-gray-500 uppercase mb-1">Drawdown</div>
                        <div className={`font-mono text-sm md:text-base font-bold ${pod.drawdown < -0.05 ? 'text-red-500' : 'text-gray-500'}`}>
                          <AnimatedNumber 
                            value={pod.drawdown} 
                            formatter={fmtPct}
                            className={pod.drawdown < -0.05 ? 'text-red-500 font-bold' : 'text-gray-500'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fire Button */}
                  {pod.id !== "0" && onFirePod && (
                    <button
                      onClick={() => {
                        onFirePod(pod.id);
                        setSelectedPod(null);
                      }}
                      className="w-full bg-red-900/20 text-red-500 border border-red-800 py-2 text-xs md:text-sm font-bold hover:bg-red-900/40 transition-colors"
                    >
                      FIRE POD
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PodsTable;

