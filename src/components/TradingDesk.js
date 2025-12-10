"use client";
import { memo } from 'react';
import AnimatedNumber from './AnimatedNumber';

const fmtMoney = (n) => {
  if (typeof n !== 'number') return "$0"; 
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
};

const fmtLeverage = (n) => {
  if (typeof n !== 'number') return "0.00x";
  return `${n.toFixed(2)}x`;
};

const TradingDesk = memo(({ localLeverage, effectiveLeverage, leverage, dailyInterest, isRunning, onLeverageChange, onToggle }) => {
  return (
    <div className="border border-gray-800 bg-gray-900/40 p-4 rounded h-full flex flex-col" data-tutorial="trading-desk">
      <h2 className="text-xs text-gray-400 mb-4 border-b border-gray-700 pb-1">TRADING DESK</h2>
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-2"><span className="text-gray-500">TARGET LEVERAGE</span><span className="text-white font-bold">{localLeverage.toFixed(1)}x</span></div>
        <input type="range" min="1" max="10" step="0.5" value={localLeverage} onChange={onLeverageChange} className="w-full accent-amber-500 h-2 bg-gray-700 rounded cursor-pointer appearance-none"/>
        <div className="flex justify-between text-xs mt-2 pt-2 border-t border-gray-800">
          <span className="text-gray-500">REAL-TIME RISK</span>
          <AnimatedNumber 
            value={effectiveLeverage} 
            formatter={fmtLeverage}
            className={`font-mono font-bold ${effectiveLeverage > leverage + 0.5 ? 'text-red-500' : 'text-blue-400'}`}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>Interest Cost:</span>
          <span className="text-red-400">
            -<AnimatedNumber value={dailyInterest} formatter={fmtMoney} /> / day
          </span>
        </div>
      </div>
      <button onClick={onToggle} className={`w-full py-3 text-sm font-bold border ${isRunning ? 'border-red-900 text-red-500' : 'border-green-900 text-green-500'}`}>{isRunning ? "HALT TRADING" : "START TRADING SESSION"}</button>
    </div>
  );
});

TradingDesk.displayName = 'TradingDesk';

export default TradingDesk;

