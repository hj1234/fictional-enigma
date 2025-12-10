"use client";
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
  return (
    <div className="flex-grow border border-gray-800 bg-gray-900/40 rounded flex flex-col overflow-hidden" data-tutorial="pods-table">
      <h2 className="p-3 text-xs text-gray-400 border-b border-gray-800 shrink-0">ACTIVE PODS</h2>
      <div className="flex-grow overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-900">
            <tr>
              <th className="p-2 border-b border-gray-800 text-left">Pod</th>
              <th className="p-2 border-b border-gray-800 text-center">Alloc %</th>
              <th className="p-2 border-b border-gray-800 text-right">Alpha</th>
              <th className="p-2 border-b border-gray-800 text-right">Beta</th>
              <th className="p-2 border-b border-gray-800 text-right">DD</th>
              <th className="p-2 border-b border-gray-800 text-right">Monthly PnL</th>
              <th className="p-2 border-b border-gray-800 text-right">Total PnL</th>
            </tr>
          </thead>
          <tbody>
            {pods.map((pod) => (
              <tr key={`pod-${dateKey}-${pod.id}`} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-2">
                  <div className="text-white font-bold">{pod.name}</div>
                  <div className="text-gray-500 text-[9px] uppercase">{pod.specialism}</div>
                </td>
                
                <td className="p-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onWeightChange(pod.id, -5)} className="text-gray-500 hover:text-red-500 px-1 border border-gray-800 rounded bg-black">-</button>
                    <div className="w-8 text-center">
                      <AnimatedNumber 
                        value={pod.alloc_pct} 
                        formatter={fmtPct}
                        className="text-blue-400 font-bold"
                      />
                    </div>
                    <button onClick={() => onWeightChange(pod.id, 5)} className="text-gray-500 hover:text-green-500 px-1 border border-gray-800 rounded bg-black">+</button>
                  </div>
                </td>
                
                <td className="p-2 text-right font-mono">
                  <AnimatedNumber 
                    value={pod.alpha || 0} 
                    formatter={(v) => (v * 100).toFixed(2) + "%"}
                    className="text-cyan-400"
                  />
                </td>
                
                <td className="p-2 text-right font-mono">
                  <AnimatedNumber 
                    value={pod.beta || 0} 
                    formatter={(v) => v.toFixed(2)}
                    className="text-purple-400"
                  />
                </td>
                
                <td className="p-2 text-right font-mono">
                  <AnimatedNumber 
                    value={pod.drawdown} 
                    formatter={fmtPct}
                    className={pod.drawdown < -0.05 ? 'text-red-500 font-bold' : 'text-gray-500'}
                  />
                </td>

                <td className="p-2 text-right font-mono">
                  <AnimatedNumber 
                    value={pod.monthly_pnl || 0} 
                    formatter={fmtMoney}
                    className={`font-bold ${(pod.monthly_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}
                  />
                </td>

                <td className="p-2 text-right font-mono">
                  <AnimatedNumber 
                    value={pod.pnl} 
                    formatter={fmtMoney}
                    className={`font-bold ${pod.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-2 border-t border-gray-800 text-xs text-gray-500 text-center shrink-0">
         {pods.length} Active Teams • {localLeverage}x Gross
      </div>
    </div>
  );
};

export default PodsTable;

