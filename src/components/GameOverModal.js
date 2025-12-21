"use client";
import { useEffect } from 'react';

const GameOverModal = ({ reason, onClose }) => {
  const getMessage = () => {
    if (reason === "margin_call") {
      return "MARGIN CALL\n\nYour effective leverage exceeded 15.0x.\n\nPortfolio liquidated.";
    } else if (reason === "insolvency") {
      return "GAME OVER\n\nManagement company insolvent.\n\nFirm cash depleted.";
    } else if (reason === "fund_liquidation") {
      return "GAME OVER\n\nFund liquidation.\n\nInvestor equity depleted.";
    }
    return "GAME OVER";
  };

  const isMarginCall = reason === "margin_call";

  // Auto-close after 2 seconds for margin call
  useEffect(() => {
    if (isMarginCall) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isMarginCall, onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-4 border-red-600 p-12 rounded-lg max-w-lg w-full mx-4 text-center shadow-2xl shadow-red-600/50 animate-pulse">
        <div className="text-7xl font-bold text-red-500 mb-6 animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
          GAME OVER
        </div>
        <div className="text-white font-mono text-base whitespace-pre-line mb-8 leading-relaxed">
          {getMessage()}
        </div>
        {!isMarginCall && (
          <button
            onClick={onClose}
            className="px-8 py-3 bg-red-900 text-red-200 border-2 border-red-700 hover:bg-red-800 font-bold text-lg transition-colors"
          >
            CLOSE
          </button>
        )}
      </div>
    </div>
  );
};

export default GameOverModal;

