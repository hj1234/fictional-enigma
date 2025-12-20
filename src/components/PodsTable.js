"use client";
import { useState } from 'react';
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

const PodsTable = ({ pods, dateKey, localLeverage, onWeightChange }) => {
  const [selectedPod, setSelectedPod] = useState(null);
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
              <th className="md:hidden p-1 border-b border-gray-800 text-center w-8"></th>
            </tr>
          </thead>
          <tbody>
            {pods.map((pod) => (
              <tr key={`pod-${dateKey}-${pod.id}`} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-1 md:p-2">
                  <div className="text-white font-bold text-[10px] md:text-xs">{pod.name}</div>
                  <div className="text-gray-500 text-[8px] md:text-[9px] uppercase">
                    {pod.specialism}
                    {pod.asset_class && pod.asset_class !== 'generalist' && (
                      <span className="ml-1 text-amber-600">• {pod.asset_class.toUpperCase()}</span>
                    )}
                  </div>
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
                <td className="md:hidden p-1 text-center">
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
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-1.5 md:p-2 border-t border-gray-800 text-[9px] md:text-xs text-gray-500 text-center shrink-0">
         {pods.length} Active Teams • {localLeverage.toFixed(1)}x Gross
      </div>
      
      {/* Mobile Popup Modal */}
      {selectedPod && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPod(null)}
        >
          <div 
            className="bg-gray-900 border border-amber-800 rounded-lg p-4 max-w-sm w-full relative"
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
                  <h3 className="text-white font-bold text-sm mb-1 pr-6">{pod.name}</h3>
                  <div className="text-gray-500 text-[10px] uppercase mb-4">{pod.specialism}</div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase mb-1">Alpha</div>
                        <div className="text-cyan-400 font-mono text-sm font-bold">
                          <AnimatedNumber 
                            value={pod.alpha || 0} 
                            formatter={(v) => (v * 100).toFixed(2) + "%"}
                            className="text-cyan-400"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase mb-1">Beta</div>
                        <div className="text-purple-400 font-mono text-sm font-bold">
                          <AnimatedNumber 
                            value={pod.beta || 0} 
                            formatter={(v) => v.toFixed(2)}
                            className="text-purple-400"
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[9px] text-gray-500 uppercase mb-1">Drawdown</div>
                        <div className={`font-mono text-sm font-bold ${pod.drawdown < -0.05 ? 'text-red-500' : 'text-gray-500'}`}>
                          <AnimatedNumber 
                            value={pod.drawdown} 
                            formatter={fmtPct}
                            className={pod.drawdown < -0.05 ? 'text-red-500 font-bold' : 'text-gray-500'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
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

