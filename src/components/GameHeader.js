"use client";
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

const GameHeader = ({ date, firmName, investorEquity, grossExposure, firmCash, leverage, effectiveLeverage, dateKey, onToggleTutorial }) => {
  return (
    <header className="relative border-b border-amber-800 pb-2 flex justify-between items-end shrink-0" data-tutorial="header">
      <div className="z-10 bg-black pr-4 flex items-center gap-3">
        <div className="flex flex-col justify-end">
          <h1 className="text-xl font-bold tracking-tighter text-amber-900">POD SHOP <span className="text-[10px] align-top text-gray-600">v0.3</span></h1>
          <div key={`date-${dateKey}`} className="text-xs text-amber-700 mt-1 uppercase tracking-widest">{date}</div>
        </div>
        {onToggleTutorial && (
          <div className="relative group">
            <button
              onClick={onToggleTutorial}
              className="text-sm font-bold text-amber-500 hover:text-amber-400 hover:bg-amber-900/20 transition-all px-3 py-1.5 border-2 border-amber-600 hover:border-amber-500 rounded bg-amber-900/10 shadow-sm hover:shadow-amber-500/20"
            >
              ?
            </button>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded border border-amber-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Toggle tutorial
            </div>
          </div>
        )}
      </div>
      <div className="absolute left-1/2 bottom-2 -translate-x-1/2 text-center">
          <div className="text-[10px] text-gray-600 tracking-[0.2em] uppercase mb-1">AUTHORIZED TERMINAL</div>
          <div className="text-3xl font-bold text-white tracking-tight uppercase glow border-b-2 border-amber-500/50 pb-1">{firmName}</div>
      </div>
      <div className="z-10 bg-black pl-4 flex gap-6 text-right">
         <div>
           <div className="text-[10px] text-gray-500 uppercase">Eff. Leverage</div>
           <AnimatedNumber 
             value={effectiveLeverage} 
             formatter={fmtLeverage}
             className={`text-xl font-bold ${effectiveLeverage > leverage + 0.5 ? 'text-red-500' : 'text-gray-300'}`}
           />
         </div>
         <div>
           <div className="text-[10px] text-gray-500 uppercase">NAV</div>
           <AnimatedNumber 
             value={investorEquity} 
             formatter={fmtMoney}
             className={`text-xl font-bold ${investorEquity < 0 ? 'text-red-500' : 'text-white'}`}
           />
         </div>
         <div>
           <div className="text-[10px] text-gray-500 uppercase">Gross</div>
           <AnimatedNumber 
             value={grossExposure} 
             formatter={fmtMoney}
             className="text-xl font-bold text-blue-400"
           />
         </div>
         <div>
           <div className="text-[10px] text-gray-500 uppercase">Firm Cash</div>
           <AnimatedNumber 
             value={firmCash} 
             formatter={fmtMoney}
             className={`text-xl font-bold ${firmCash < 0 ? 'text-red-500' : 'text-amber-500'}`}
           />
         </div>
      </div>
    </header>
  );
};

export default GameHeader;

