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
import TrophyCabinet from './TrophyCabinet';
import RetireConfirmationModal from './RetireConfirmationModal';
import { useRouter } from 'next/navigation';
import { tutorialSteps } from '../lib/tutorialSteps';
import { GameState } from '../lib/game/GameState.js';
import { ContentLoader } from '../lib/game/ContentLoader.js';
import { MessageManager } from '../lib/game/MessageManager.js';
import filter from 'leo-profanity';

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

// API base URL - defined once at module level
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function GameDashboard({ firmName }) {
  const [gameState, setGameState] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  // --- UI STATE ---
  const [viewedEmailCount, setViewedEmailCount] = useState(0);
  const [viewedLedgerCount, setViewedLedgerCount] = useState(0);
  
  // --- TUTORIAL STATE ---
  const [showTutorial, setShowTutorial] = useState(false);
  
  // --- TROPHY CABINET STATE ---
  const [showTrophyCabinet, setShowTrophyCabinet] = useState(false);
  
  // --- RETIRE STATE ---
  const [showRetireConfirmation, setShowRetireConfirmation] = useState(false);
  const [isRetiring, setIsRetiring] = useState(false);
  
  // --- MOBILE TAB STATE ---
  const [activeMobileTab, setActiveMobileTab] = useState('CONTROLS');
  
  const router = useRouter();

  // --- SLIDER STATE ---
  const [localLeverage, setLocalLeverage] = useState(1.0);
  const lastInteraction = useRef(0);
  const debounceTimer = useRef(null); 
  const gameStateRef = useRef(null);
  const gameIntervalRef = useRef(null);
  const gameIdRef = useRef(null); // Track game ID from backend
  const geolocationRef = useRef(null); // Store geolocation
  
  // Track previous date to detect changes and force updates
  const previousDateRef = useRef(null);
  const [dateKey, setDateKey] = useState(0);

  // Load content and initialize game state
  useEffect(() => {
    const initializeGame = async () => {
      // Load content from API
      let contentData = null;
      try {
        contentData = await ContentLoader.loadAll();
        console.log('Content loaded successfully', contentData);
      } catch (error) {
        console.warn('Failed to load content, using defaults', error);
      }
      
      // Load messages from unified message API
      const messageManager = new MessageManager(new Date(2024, 0, 1));
      try {
        await messageManager.loadMessages(API_BASE);
        console.log('Messages loaded successfully', messageManager.messages.length);
      } catch (error) {
        console.warn('Failed to load messages, using defaults', error);
      }
      
      // Try to load from localStorage
      const savedState = localStorage.getItem('pod_shop_game_state');
      let game;
      
      // Check if this is a new game (different firm name) or resuming existing game
      const isNewGame = !savedState || (savedState && JSON.parse(savedState).firm_name !== firmName);
      
      if (isNewGame) {
        // Clear earned awards when starting a new game
        // Awards should be per-game, not persistent across games
        localStorage.removeItem('pod_shop_earned_awards');
      }
      
      if (savedState && !isNewGame) {
        try {
          const parsed = JSON.parse(savedState);
          // Reconstruct game state from saved data
          game = new GameState(contentData, messageManager);
          game.firm_name = parsed.firm_name || firmName;
          game.current_date = new Date(parsed.current_date);
          game.is_running = parsed.is_running || false;
          // Note: Full state reconstruction would require more work
          // For now, just create a new game if saved state exists but is incomplete
          if (!parsed.pods || !parsed.fund) {
            game = new GameState(contentData, messageManager);
            game.firm_name = firmName;
          }
        } catch (e) {
          console.error("Failed to load saved state:", e);
          game = new GameState(contentData, messageManager);
          game.firm_name = firmName;
        }
      } else {
        game = new GameState(contentData, messageManager);
        game.firm_name = firmName;
      }
      
      gameStateRef.current = game;
      setGameState(game.getState());
      
      // SQL injection detection
      const detectSQLInjection = (input) => {
        if (!input) return false;
        
        // Common SQL injection patterns
        const sqlPatterns = [
          /['";]/g,                    // Single quotes, double quotes, semicolons
          /--/g,                        // SQL comments
          /\/\*/g,                      // Multi-line comment start
          /\*\//g,                      // Multi-line comment end
          /(union|select|insert|update|delete|drop|create|alter|exec|execute|script)/gi,  // SQL keywords
          /xp_/gi,                      // Extended stored procedures
          /sp_/gi,                      // Stored procedures
          /0x[0-9a-f]+/gi,              // Hex encoded strings
          /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/gi,  // OR/AND injection patterns
          /(\bor\b|\band\b)\s+['"]/gi,  // OR/AND with quotes
        ];
        
        for (const pattern of sqlPatterns) {
          if (pattern.test(input)) {
            return true;
          }
        }
        
        return false;
      };

      // Get approximate geolocation and create game in backend
      // Function to create game in backend (only if not already created)
      const createGame = (geo) => {
        // Guard against duplicate creation
        if (gameIdRef.current) {
          console.log('Game already created, skipping duplicate creation');
          return;
        }
        
        // Final SQL injection check before sending to backend
        if (detectSQLInjection(firmName)) {
          console.error('SQL injection detected in fund name. Game creation blocked.');
          alert('SECURITY ERROR: Invalid fund name detected. Game creation blocked.');
          return;
        }
        
        // Final profanity check before sending to backend
        if (filter.check(firmName)) {
          console.error('Profanity detected in fund name. Game creation blocked.');
          alert('INAPROPRIATE NAME. FUND NAME REJECTED.');
          return;
        }
        
        fetch(`${API_BASE}/api/games/in-progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fund_name: firmName,
            geolocation: geo
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            gameIdRef.current = data.id;
            console.log('Game created in backend:', data.id);
          }
        })
        .catch(err => {
          console.warn('Failed to create game in backend:', err);
        });
      };
      
      // Get approximate geolocation using IP-based service (no permission required)
      // Falls back to timezone-based approximation if IP lookup fails
      const getApproximateLocation = async () => {
        try {
          // Try IP-based geolocation (free service, no API key needed)
          const ipResponse = await fetch('https://ipapi.co/json/', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });
          
          if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            if (ipData.latitude && ipData.longitude) {
              // Round to ~10km accuracy (approximately 0.1 degrees)
              const lat = Math.round(ipData.latitude * 10) / 10;
              const lon = Math.round(ipData.longitude * 10) / 10;
              const geo = `${lat},${lon}`;
              geolocationRef.current = geo;
              createGame(geo);
              return;
            }
          }
        } catch (err) {
          console.log('IP geolocation failed, using timezone approximation:', err);
        }
        
        // Fallback: Use timezone to get approximate location
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          // Approximate coordinates for major timezones (rounded to ~100km accuracy)
          const timezoneMap = {
            'America/New_York': '40.7,-74.0',
            'America/Chicago': '41.9,-87.6',
            'America/Denver': '39.7,-104.9',
            'America/Los_Angeles': '34.1,-118.2',
            'Europe/London': '51.5,-0.1',
            'Europe/Paris': '48.9,2.4',
            'Europe/Berlin': '52.5,13.4',
            'Asia/Tokyo': '35.7,139.8',
            'Asia/Shanghai': '31.2,121.5',
            'Asia/Hong_Kong': '22.3,114.2',
            'Australia/Sydney': '-33.9,151.2',
            'America/Sao_Paulo': '-23.6,-46.6',
            'America/Toronto': '43.7,-79.4',
            'Asia/Singapore': '1.3,103.8',
            'Asia/Dubai': '25.3,55.3',
          };
          
          const geo = timezoneMap[timezone] || '51.5,-0.1'; // Default to London
          geolocationRef.current = geo;
          createGame(geo);
        } catch (err) {
          // Final fallback: use default location
          console.log('Timezone approximation failed, using default:', err);
          geolocationRef.current = '51.5,-0.1'; // Default to London
          createGame('51.5,-0.1');
        }
      };
      
      // Get approximate location (no permission required)
      getApproximateLocation();
      
      // Save state periodically and update game in backend
      const saveInterval = setInterval(() => {
        if (gameStateRef.current) {
          const state = gameStateRef.current.getState();
          localStorage.setItem('pod_shop_game_state', JSON.stringify({
            firm_name: state.firm_name,
            current_date: gameStateRef.current.current_date.toISOString(),
            is_running: state.is_running,
            // Could save more state here for full persistence
          }));
          
          // Update game in backend periodically (every 30 seconds)
          if (gameIdRef.current) {
            fetch(`${API_BASE}/api/games/in-progress/${gameIdRef.current}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fund_name: state.firm_name,
                geolocation: geolocationRef.current
              })
            }).catch(err => console.warn('Failed to update game:', err));
          }
        }
      }, 30000); // Update every 30 seconds
      
      // Function to end game when window closes or component unmounts
      const endGameOnClose = () => {
        if (gameIdRef.current) {
          const gameId = gameIdRef.current;
          gameIdRef.current = null; // Clear ref immediately to prevent duplicate calls
          
          // Use sendBeacon for reliable delivery during page unload
          // sendBeacon is specifically designed for this use case
          const url = `${API_BASE}/api/games/in-progress/${gameId}/end?completed=false`;
          const success = navigator.sendBeacon(url);
          
          if (!success) {
            // Fallback to fetch with keepalive if sendBeacon fails
            fetch(url, { 
              method: 'POST',
              keepalive: true // Keep request alive even if page is unloading
            }).catch(() => {
              // Silently fail - we've done our best
            });
          }
        }
      };
      
      // Listen for window close/tab close
      // beforeunload fires when the page is about to unload (close, refresh, navigate away)
      window.addEventListener('beforeunload', endGameOnClose);
      
      return () => {
        clearInterval(saveInterval);
        if (gameIntervalRef.current) {
          clearInterval(gameIntervalRef.current);
        }
        // Clean up event listener
        window.removeEventListener('beforeunload', endGameOnClose);
        // Also end game on component unmount (e.g., user navigates away in the app)
        endGameOnClose();
      };
    };
    
    initializeGame();
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
          
          // Check if game ended
          if (newState.game_over && gameIdRef.current) {
            const totalPnL = newState.investor_equity - 100_000_000; // Current NAV - starting NAV (100M)
            
            // Get game dates for calculation
            const gameStartDate = new Date(2024, 0, 1).toISOString().split('T')[0]; // START_DATE
            const gameEndDate = gameStateRef.current.current_date ? 
              gameStateRef.current.current_date.toISOString().split('T')[0] : 
              null;
            
            // Get earned awards (including LTCM Trophy if margin called)
            const earnedAwards = gameStateRef.current.awards.getEarnedAwards().map(a => a.id);
            
            // Prepare results data for game end (works for both retire and margin call)
            const resultsData = {
              firmCash: newState.firm_cash,
              investorEquity: newState.investor_equity,
              gameStartDate: gameStartDate,
              gameEndDate: gameEndDate,
              earnedAwards: earnedAwards
            };
            
            // End game and get shareable ID (same as retire flow)
            fetch(`${API_BASE}/api/games/in-progress/${gameIdRef.current}/end?completed=${newState.game_over_reason !== 'margin_call'}&total_pnl=${totalPnL}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                results_data: JSON.stringify(resultsData)
              })
            })
            .then(res => {
              if (!res.ok) {
                throw new Error(`Failed to end game: ${res.status}`);
              }
              return res.json();
            })
            .then(result => {
              const shareableId = result.shareable_id;
              if (shareableId) {
                // Clear game state
                localStorage.removeItem('pod_shop_game_state');
                gameIdRef.current = null;
                // Redirect to results page (same as retire)
                router.push(`/results/${shareableId}`);
              }
            })
            .catch(err => {
              console.warn('Failed to end game:', err);
              // Still clear the ref to prevent duplicate calls
              gameIdRef.current = null;
            });
          }
        }
      }, 2000); // 2 seconds per day
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
  
  const handleRetire = async () => {
    if (!gameStateRef.current || isRetiring) {
      console.warn('Cannot retire: gameStateRef is null or already retiring');
      return;
    }
    
    if (!gameIdRef.current) {
      console.warn('Cannot retire: gameIdRef is null');
      alert('Game ID not found. Please refresh the page and try again.');
      return;
    }
    
    setIsRetiring(true);
    setShowRetireConfirmation(false);
    
    try {
      // Stop the game
      gameStateRef.current.is_running = false;
      
      // Get current state
      const currentState = gameStateRef.current.getState();
      const totalPnL = currentState.investor_equity - 100_000_000;
      
      // Get earned awards from localStorage
      let earnedAwards = [];
      try {
        const saved = localStorage.getItem('pod_shop_earned_awards');
        earnedAwards = saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.warn('Failed to load awards:', e);
      }
      
      // Get game dates for calculation
      const gameStartDate = gameStateRef.current.current_date ? 
        new Date(2024, 0, 1).toISOString().split('T')[0] : // START_DATE
        null;
      const gameEndDate = gameStateRef.current.current_date ? 
        gameStateRef.current.current_date.toISOString().split('T')[0] : 
        null;
      
      // Prepare results data
      const resultsData = {
        firmCash: currentState.firm_cash,
        earnedAwards: earnedAwards,
        investorEquity: currentState.investor_equity,
        grossExposure: currentState.gross_exposure,
        leverage: currentState.leverage,
        gameStartDate: gameStartDate,
        gameEndDate: gameEndDate
      };
      
      const gameId = gameIdRef.current;
      const url = `${API_BASE}/api/games/in-progress/${gameId}/end?completed=true&total_pnl=${totalPnL}`;
      
      console.log('Retiring game:', { gameId, totalPnL, url });
      
      // End game and get shareable ID
      // Send results_data in the request body
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results_data: JSON.stringify(resultsData)
        })
      }).catch(err => {
        console.error('Network error:', err);
        throw new Error(`Network error: ${err.message}`);
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to retire game:', response.status, errorText);
        throw new Error(`Failed to retire game: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      const shareableId = result.shareable_id;
      
      console.log('Game retired successfully:', { shareableId });
      
      // Clear game state
      localStorage.removeItem('pod_shop_game_state');
      gameIdRef.current = null;
      
      // Redirect to results page
      if (shareableId) {
        router.push(`/results/${shareableId}`);
      } else {
        throw new Error('No shareable ID returned from server');
      }
    } catch (err) {
      console.error('Failed to retire game:', err);
      alert(`Failed to retire game: ${err.message}. Please try again.`);
      setIsRetiring(false);
    }
  };

  if (!gameState) return <div className="min-h-screen bg-black text-amber-500 font-mono p-10 flex items-center justify-center animate-pulse">LOADING...</div>;

  const borrowed = Math.max(0, gameState.gross_exposure - gameState.investor_equity);
  const dailyInterest = (borrowed * 0.04) / 252;
  const unreadEmails = (gameState.emails?.length || 0) - viewedEmailCount;
  const unreadLedger = (gameState.ledger?.length || 0) - viewedLedgerCount;
  const effectiveLev = gameState.investor_equity > 0 ? (gameState.gross_exposure / gameState.investor_equity) : 0;

  return (
    <div className="h-screen bg-black text-amber-500 font-mono p-2 md:p-4 flex flex-col gap-2 md:gap-4 overflow-hidden selection:bg-amber-900 selection:text-white">
      
      {/* TUTORIAL OVERLAY */}
      {showTutorial && (
        <TutorialOverlay
          steps={tutorialSteps}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}
      
      {/* TROPHY CABINET */}
      <TrophyCabinet 
        isOpen={showTrophyCabinet}
        onClose={() => setShowTrophyCabinet(false)}
      />
      
      {/* RETIRE CONFIRMATION MODAL */}
      <RetireConfirmationModal
        isOpen={showRetireConfirmation}
        onClose={() => setShowRetireConfirmation(false)}
        onConfirm={handleRetire}
      />
      
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
        onToggleTrophyCabinet={() => setShowTrophyCabinet(!showTrophyCabinet)}
        onRetire={() => setShowRetireConfirmation(true)}
      />

      {/* MOBILE TABS - Only visible on mobile */}
      <div className="md:hidden flex border-b border-gray-800 bg-gray-900/40 shrink-0">
        <button 
          onClick={() => setActiveMobileTab('CONTROLS')} 
          className={`flex-1 py-3 text-xs font-bold transition-colors relative ${activeMobileTab === 'CONTROLS' ? 'bg-gray-800 text-amber-500 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          CONTROLS
        </button>
        <button 
          onClick={() => setActiveMobileTab('INBOX')} 
          className={`flex-1 py-3 text-xs font-bold transition-colors relative ${activeMobileTab === 'INBOX' ? 'bg-gray-800 text-amber-500 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          INBOX
          {unreadEmails > 0 && (
            <span className="absolute top-1.5 right-2 bg-red-600 text-white rounded-full min-w-[18px] h-5 px-1.5 text-[10px] font-bold flex items-center justify-center animate-pulse shadow-lg shadow-red-600/50">
              {unreadEmails}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveMobileTab('PODS')} 
          className={`flex-1 py-3 text-xs font-bold transition-colors relative ${activeMobileTab === 'PODS' ? 'bg-gray-800 text-amber-500 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          PODS
        </button>
      </div>

      {/* MAIN GRID */}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-4 h-full overflow-hidden">
        
        {/* LEFT COL: CONTROLS & NEWS */}
        <div className={`${activeMobileTab === 'CONTROLS' ? 'flex' : 'hidden'} md:flex md:col-span-3 flex-col gap-4 h-full overflow-y-auto md:overflow-hidden`}>
          <div className="flex-[1.3] min-h-0 shrink-0">
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
          <div className="flex-1 min-h-0 shrink-0">
            <MarketChart marketHistory={gameState.market_history || []} />
          </div>
          <div className="flex-1 min-h-0 shrink-0">
            <NewsWire logs={gameState.logs} dateKey={dateKey} />
          </div>
        </div>

        {/* MIDDLE COL: TABBED INBOX & LEDGER */}
        <div className={`${activeMobileTab === 'INBOX' ? 'block' : 'hidden'} md:block md:col-span-4 h-full overflow-y-auto md:overflow-hidden`}>
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
        </div>

        {/* RIGHT COL: ACTIVE PODS (WITH DRAWDOWN COLUMN) */}
        <div className={`${activeMobileTab === 'PODS' ? 'block' : 'hidden'} md:block md:col-span-5 h-full overflow-y-auto md:overflow-hidden`}>
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
