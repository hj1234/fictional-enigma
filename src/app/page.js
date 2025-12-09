"use client";
import { useState, useEffect, useRef } from 'react';

export default function PodShop() {
  const [gameState, setGameState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [leverage, setLeverage] = useState(1.0);
  const socketRef = useRef(null);

  // --- WEBSOCKET CONNECTION ---
  useEffect(() => {
    // Connect to Python Backend
    const ws = new WebSocket("ws://localhost:8000/ws");
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to Market Server");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setGameState(data);
    };

    ws.onclose = () => setIsConnected(false);

    return () => ws.close();
  }, []);

  // --- CONTROLS ---
  const handleToggle = () => {
    if (socketRef.current) {
      // Toggle logic usually handled by state, but for MVP we assume 
      // if we have state, we are running, or we track a separate running state.
      // Ideally, the backend tells us if it's running.
      // Sending 'true' to start, 'false' to stop.
      // For this MVP, let's just send 'true' to start loop.
      socketRef.current.send(JSON.stringify({ action: 'toggle_run', value: true }));
    }
  };

  const handleLeverageChange = (e) => {
    const newVal = e.target.value;
    setLeverage(newVal);
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ action: 'update_leverage', value: newVal }));
    }
  };

  // --- RENDERING HELPERS ---
  const fmtMoney = (n) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  
  const fmtPct = (n) => (n * 100).toFixed(2) + "%";

  if (!gameState) return <div className="p-10 bg-black text-green-500 font-mono">CONNECTING TO BLOOMBERG...</div>;

  return (
    <div className="min-h-screen bg-black text-amber-500 font-mono p-6 flex flex-col gap-6">
      
      {/* HEADER */}
      <div className="border-b border-amber-700 pb-4 flex justify-between items-end">
        <h1 className="text-4xl font-bold tracking-tighter text-amber-500">POD SHOP <span className="text-sm align-top text-gray-500">v0.1</span></h1>
        <div className="text-right">
          <div className="text-xs text-gray-500">AUM</div>
          <div className="text-4xl font-bold text-white">{fmtMoney(gameState.aum)}</div>
          <div className={gameState.daily_return >= 0 ? "text-green-500" : "text-red-500"}>
            {fmtPct(gameState.daily_return)} (Day {gameState.day})
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CONTROLS */}
        <div className="border border-gray-800 p-4 bg-gray-900/40">
          <h2 className="text-white border-b border-gray-700 mb-4 pb-1">TRADING DESK</h2>
          
          <div className="mb-6">
            <label className="block text-gray-400 text-sm mb-2">
              GROSS LEVERAGE: <span className="text-white text-xl">{leverage}x</span>
            </label>
            <input 
              type="range" min="0" max="10" step="0.5" 
              value={leverage}
              onChange={handleLeverageChange}
              className="w-full accent-amber-500 h-2 bg-gray-700 rounded-lg cursor-pointer"
            />
          </div>

          <button 
            onClick={handleToggle}
            className="w-full py-3 bg-amber-900/20 border border-amber-500 text-amber-500 font-bold hover:bg-amber-900/40"
          >
            START TRADING SESSION
          </button>
        </div>

        {/* LOGS */}
        <div className="border border-gray-800 p-4 bg-gray-900/40 h-64 overflow-y-auto font-mono text-sm">
           <h2 className="text-white border-b border-gray-700 mb-2 pb-1">MARKET NEWS</h2>
           {gameState.logs.map((log, i) => (
             <div key={i} className={`mb-1 ${log.type === 'danger' ? 'text-red-500' : 'text-gray-400'}`}>
               <span className="opacity-50 mr-2">[DAY {log.day}]</span>
               {log.text}
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}