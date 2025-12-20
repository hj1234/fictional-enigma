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

const GameHeader = ({ date, firmName, investorEquity, grossExposure, firmCash, leverage, effectiveLeverage, dateKey, onToggleTutorial, onToggleTrophyCabinet, onRetire }) => {
  return (
    <header className="relative border-b border-amber-800 pb-1 md:pb-2 flex flex-col md:flex-row md:justify-between md:items-end shrink-0 gap-1 md:gap-0" data-tutorial="header">
      <div className="z-10 bg-black pr-2 md:pr-4 flex items-center gap-1.5 md:gap-3">
        <div className="flex flex-col justify-end">
          <h1 className="text-sm md:text-xl font-bold tracking-tighter text-amber-900 leading-tight">POD SHOP <span className="text-[8px] md:text-[10px] align-top text-gray-600">v0.3</span></h1>
          <div key={`date-${dateKey}`} className="text-[9px] md:text-xs text-amber-700 mt-0.5 md:mt-1 uppercase tracking-widest leading-tight">{date}</div>
        </div>
        {onToggleTutorial && (
          <div className="relative group">
            <button
              onClick={onToggleTutorial}
              className="text-[10px] md:text-sm font-bold text-amber-500 hover:text-amber-400 hover:bg-amber-900/20 transition-all px-1.5 md:px-3 py-0.5 md:py-1.5 border-2 border-amber-600 hover:border-amber-500 rounded bg-amber-900/10 shadow-sm hover:shadow-amber-500/20"
            >
              ?
            </button>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded border border-amber-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Toggle tutorial
            </div>
          </div>
        )}
        {onToggleTrophyCabinet && (
          <div className="relative group">
            <button
              onClick={onToggleTrophyCabinet}
              className="text-[10px] md:text-sm font-bold text-amber-500 hover:text-amber-400 hover:bg-amber-900/20 transition-all px-1.5 md:px-3 py-0.5 md:py-1.5 border-2 border-amber-600 hover:border-amber-500 rounded bg-amber-900/10 shadow-sm hover:shadow-amber-500/20"
            >
              🏆
            </button>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded border border-amber-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Trophy Cabinet
            </div>
          </div>
        )}
        {onRetire && (
          <div className="relative group">
            <button
              onClick={onRetire}
              className="text-red-500 hover:text-red-400 hover:bg-red-900/20 transition-all px-1.5 md:px-2.5 py-0.5 md:py-1.5 border-2 border-red-600 hover:border-red-500 rounded bg-red-900/10 shadow-sm hover:shadow-red-500/20 flex items-center justify-center"
              title="Retire & View Results"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="md:w-5 md:h-5"
              >
                {/* Door frame */}
                <rect x="3" y="3" width="18" height="18" rx="1" fill="none"/>
                {/* Door */}
                <rect x="4" y="4" width="16" height="16" rx="0.5" fill="currentColor" fillOpacity="0.1"/>
                {/* Door handle */}
                <circle cx="17" cy="12" r="1.5" fill="currentColor"/>
                {/* Exit arrow */}
                <path d="M 8 12 L 5 9 M 8 12 L 5 15" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded border border-red-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Retire & View Results
            </div>
          </div>
        )}
      </div>
      <div className="absolute left-1/2 bottom-2 -translate-x-1/2 text-center hidden md:block">
          <div className="text-[10px] text-gray-600 tracking-[0.2em] uppercase mb-1">AUTHORIZED TERMINAL</div>
          <div className="text-3xl font-bold text-white tracking-tight uppercase glow border-b-2 border-amber-500/50 pb-1">{firmName}</div>
      </div>
      <div className="md:absolute md:left-1/2 md:bottom-2 md:-translate-x-1/2 text-center md:hidden">
          <div className="text-[8px] text-gray-600 tracking-[0.15em] uppercase mb-0.5 leading-tight">AUTHORIZED TERMINAL</div>
          <div className="text-base font-bold text-white tracking-tight uppercase glow border-b border-amber-500/50 pb-0.5 leading-tight">{firmName}</div>
      </div>
      <div className="z-10 bg-black pl-2 md:pl-4 flex gap-1.5 md:gap-6 text-right overflow-x-auto">
         <div className="shrink-0">
           <div className="text-[8px] md:text-[10px] text-gray-500 uppercase leading-tight">Eff. Lev</div>
           <AnimatedNumber 
             value={effectiveLeverage} 
             formatter={fmtLeverage}
             className={`text-sm md:text-xl font-bold leading-tight ${effectiveLeverage > leverage + 0.5 ? 'text-red-500' : 'text-gray-300'}`}
           />
         </div>
         <div className="shrink-0">
           <div className="text-[8px] md:text-[10px] text-gray-500 uppercase leading-tight">NAV</div>
           <AnimatedNumber 
             value={investorEquity} 
             formatter={fmtMoney}
             className={`text-sm md:text-xl font-bold leading-tight ${investorEquity < 0 ? 'text-red-500' : 'text-white'}`}
           />
         </div>
         <div className="shrink-0 hidden sm:block">
           <div className="text-[8px] md:text-[10px] text-gray-500 uppercase leading-tight">Gross</div>
           <AnimatedNumber 
             value={grossExposure} 
             formatter={fmtMoney}
             className="text-sm md:text-xl font-bold leading-tight text-blue-400"
           />
         </div>
         <div className="shrink-0">
           <div className="text-[8px] md:text-[10px] text-gray-500 uppercase leading-tight">Cash</div>
           <AnimatedNumber 
             value={firmCash} 
             formatter={fmtMoney}
             className={`text-sm md:text-xl font-bold leading-tight ${firmCash < 0 ? 'text-red-500' : 'text-amber-500'}`}
           />
         </div>
      </div>
    </header>
  );
};

export default GameHeader;

