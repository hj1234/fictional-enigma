"use client";
import { useState, useEffect, useRef } from 'react';
import GameHeader from './GameHeader';
import TradingDesk from './TradingDesk';
import NewsWire from './NewsWire';
import PodsTable from './PodsTable';
import EmailInbox from './EmailInbox';
import MarketChart from './MarketChart';
import GameOverModal from './GameOverModal';
import TutorialOverlay from './TutorialOverlay';
import { tutorialSteps } from '../lib/tutorialSteps';
import { GameState } from '../lib/game/GameState.js';

// --- HELPERS ---
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

export default function GameDashboard({ firmName }) {
  const [gameState, setGameState] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  // --- UI STATE ---
  const [viewedEmailCount, setViewedEmailCount] = useState(0);
  const [viewedLedgerCount, setViewedLedgerCount] = useState(0);
  
  // --- TUTORIAL STATE ---
  const [showTutorial, setShowTutorial] = useState(false);

  // --- SLIDER STATE ---
  const [localLeverage, setLocalLeverage] = useState(1.0);
  const lastInteraction = useRef(0);
  const debounceTimer = useRef(null); 
  const gameStateRef = useRef(null);
  const gameIntervalRef = useRef(null);
  
  // Track previous date to detect changes and force updates
  const previousDateRef = useRef(null);
  const [dateKey, setDateKey] = useState(0);

  // Initialize game state
  useEffect(() => {
    // Try to load from localStorage
    const savedState = localStorage.getItem('pod_shop_game_state');
    let game;
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Reconstruct game state from saved data
        game = new GameState();
        game.firm_name = parsed.firm_name || firmName;
        game.current_date = new Date(parsed.current_date);
        game.is_running = parsed.is_running || false;
        // Note: Full state reconstruction would require more work
        // For now, just create a new game if saved state exists but is incomplete
        if (!parsed.pods || !parsed.fund) {
          game = new GameState();
          game.firm_name = firmName;
        }
      } catch (e) {
        console.error("Failed to load saved state:", e);
        game = new GameState();
        game.firm_name = firmName;
      }
    } else {
      game = new GameState();
      game.firm_name = firmName;
    }
    
    gameStateRef.current = game;
    setGameState(game.getState());
    
    // Save state periodically
    const saveInterval = setInterval(() => {
      if (gameStateRef.current) {
        const state = gameStateRef.current.getState();
        localStorage.setItem('pod_shop_game_state', JSON.stringify({
          firm_name: state.firm_name,
          current_date: gameStateRef.current.current_date.toISOString(),
          is_running: state.is_running,
          // Could save more state here for full persistence
        }));
      }
    }, 5000);
    
    return () => {
      clearInterval(saveInterval);
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    };
  }, [firmName]);

  // Game loop
  useEffect(() => {
    if (!gameStateRef.current) return;
    
    if (gameStateRef.current.is_running) {
      gameIntervalRef.current = setInterval(() => {
        if (gameStateRef.current && gameStateRef.current.is_running) {
          const newState = gameStateRef.current.step();
          
          // Check if date changed
          const newDate = newState.date;
          const dateChanged = previousDateRef.current !== null && previousDateRef.current !== newDate;
          
          if (dateChanged) {
            previousDateRef.current = newDate;
            setDateKey(prev => prev + 1);
          } else if (previousDateRef.current === null) {
            previousDateRef.current = newDate;
          }
          
          setGameState(newState);
        }
      }, 1000); // 1 second per day
    } else {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
        gameIntervalRef.current = null;
      }
    }
    
    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
        gameIntervalRef.current = null;
      }
    };
  }, [gameState?.is_running]);

  // Track viewed counts - only mark items as viewed when user actually views them
  // Don't automatically mark new items as viewed
  useEffect(() => {
    if (!gameState) return;
    // Only initialize on first load - don't auto-update when new items arrive
    // The viewed counts will be updated when user actually views items via callbacks
  }, [gameState]);
  
  // Check if user has seen tutorial on first load
  useEffect(() => {
    if (gameState) {
      const hasSeenTutorial = localStorage.getItem('pod_shop_tutorial_completed');
      if (!hasSeenTutorial) {
        // Small delay to let UI render
        setTimeout(() => setShowTutorial(true), 500);
      }
    }
  }, [gameState]);
  
  const handleTutorialComplete = () => {
    localStorage.setItem('pod_shop_tutorial_completed', 'true');
    setShowTutorial(false);
  };
  
  const handleTutorialSkip = () => {
    localStorage.setItem('pod_shop_tutorial_completed', 'true');
    setShowTutorial(false);
  };
  
  const handleToggleTutorial = () => {
    setShowTutorial(!showTutorial);
  };

  useEffect(() => {
    if (gameState) {
       const now = Date.now();
       const timeSinceInteraction = now - lastInteraction.current;
       
       // If user hasn't interacted recently, track effective leverage (if <= 10x)
       if (timeSinceInteraction > 2000) {
         const effectiveLev = gameState.investor_equity > 0 ? (gameState.gross_exposure / gameState.investor_equity) : 0;
         
         // Only auto-update slider if effective leverage is 10x or lower
         if (effectiveLev <= 10.0) {
           // Clamp to slider range (1-10)
           const clampedEffective = Math.max(1.0, Math.min(10.0, effectiveLev));
           setLocalLeverage(clampedEffective);
         } else {
           // If effective leverage > 10x, keep slider at target leverage
           setLocalLeverage(gameState.leverage);
         }
       }
    }
  }, [gameState]);

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setLocalLeverage(val);
    lastInteraction.current = Date.now(); // Mark as actively interacting
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (gameStateRef.current) {
        gameStateRef.current.setLeverage(val);
        setGameState(gameStateRef.current.getState());
        // Reset interaction timer after debounce completes so slider can start tracking effective leverage again
        setTimeout(() => {
          lastInteraction.current = Date.now() - 2001; // Allow auto-tracking to resume
        }, 100);
      }
    }, 400);
  };

  const handleToggle = () => {
    if (gameStateRef.current) {
      gameStateRef.current.is_running = !gameStateRef.current.is_running;
      setGameState(gameStateRef.current.getState());
    }
  };
  
  const handleHire = (id) => {
    if (gameStateRef.current) {
      gameStateRef.current.hirePod(id);
      setGameState(gameStateRef.current.getState());
      setSelectedEmail(null);
    }
  };
  
  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
    // Mark email as read when selected
    if (gameStateRef.current && email?.id) {
      gameStateRef.current.markEmailAsRead(email.id);
      setGameState(gameStateRef.current.getState());
    }
  };
  
  const handleReject = (id) => {
    if (gameStateRef.current) {
      gameStateRef.current.rejectEmail(id);
      setGameState(gameStateRef.current.getState());
      setSelectedEmail(null);
    }
  };
  
  const handleFire = (id) => {
    if (gameStateRef.current) {
      gameStateRef.current.firePod(id);
      setGameState(gameStateRef.current.getState());
      setSelectedEmail(null);
    }
  };
  
  const handleWeight = (id, increment) => {
    if (gameStateRef.current) {
      gameStateRef.current.updatePodWeight(id, increment);
      setGameState(gameStateRef.current.getState());
    }
  };

  if (!gameState) return <div className="min-h-screen bg-black text-amber-500 font-mono p-10 flex items-center justify-center animate-pulse">LOADING...</div>;

  const borrowed = Math.max(0, gameState.gross_exposure - gameState.investor_equity);
  const dailyInterest = (borrowed * 0.04) / 252;
  const unreadEmails = (gameState.emails?.length || 0) - viewedEmailCount;
  const unreadLedger = (gameState.ledger?.length || 0) - viewedLedgerCount;
  const effectiveLev = gameState.investor_equity > 0 ? (gameState.gross_exposure / gameState.investor_equity) : 0;

  return (
    <div className="h-screen bg-black text-amber-500 font-mono p-4 flex flex-col gap-4 overflow-hidden selection:bg-amber-900 selection:text-white">
      
      {/* TUTORIAL OVERLAY */}
      {showTutorial && (
        <TutorialOverlay
          steps={tutorialSteps}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}
      
      {/* GAME OVER MODAL */}
      {gameState.game_over && (
        <GameOverModal 
          reason={gameState.game_over_reason}
          onClose={() => {}}
        />
      )}
      
      {/* HEADER */}
      <GameHeader 
        date={gameState.date}
        firmName={firmName}
        investorEquity={gameState.investor_equity}
        grossExposure={gameState.gross_exposure}
        firmCash={gameState.firm_cash}
        leverage={gameState.leverage}
        effectiveLeverage={effectiveLev}
        dateKey={dateKey}
        onToggleTutorial={handleToggleTutorial}
      />

      {/* MAIN GRID */}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-4 h-full overflow-hidden">
        
        {/* LEFT COL: CONTROLS & NEWS */}
        <div className="md:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
          <div className="flex-[1.3] min-h-0">
            <TradingDesk 
              localLeverage={localLeverage}
              effectiveLeverage={effectiveLev}
              leverage={gameState.leverage}
              dailyInterest={dailyInterest}
              isRunning={gameState.is_running}
              onLeverageChange={handleSliderChange}
              onToggle={handleToggle}
            />
            </div>
          <div className="flex-1 min-h-0">
            <MarketChart marketHistory={gameState.market_history || []} />
          </div>
          <div className="flex-1 min-h-0">
            <NewsWire logs={gameState.logs} dateKey={dateKey} />
          </div>
        </div>

        {/* MIDDLE COL: TABBED INBOX & LEDGER */}
        <EmailInbox
          emails={gameState.emails}
          ledger={gameState.ledger}
          selectedEmail={selectedEmail}
          onSelectEmail={handleSelectEmail}
          onCloseEmail={() => setSelectedEmail(null)}
          onHire={handleHire}
          onReject={handleReject}
          onFire={handleFire}
          unreadEmails={unreadEmails}
          unreadLedger={unreadLedger}
          onMarkEmailsViewed={(count) => setViewedEmailCount(Math.max(viewedEmailCount, count))}
          onMarkLedgerViewed={(count) => setViewedLedgerCount(Math.max(viewedLedgerCount, count))}
        />

        {/* RIGHT COL: ACTIVE PODS (WITH DRAWDOWN COLUMN) */}
        <div className="md:col-span-5">
          <PodsTable 
            pods={gameState.pods}
            dateKey={dateKey}
            localLeverage={localLeverage}
            onWeightChange={handleWeight}
          />
        </div>
        
      </div>
    </div>
  );
}
