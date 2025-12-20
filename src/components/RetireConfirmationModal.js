"use client";

export default function RetireConfirmationModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border-2 border-red-600 rounded-lg p-6 md:p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl md:text-2xl font-bold text-red-500 mb-4">CONFIRM RETIREMENT</h2>
        
        <p className="text-gray-300 mb-6 text-sm md:text-base">
          Are you sure you want to retire? This will end your current game and generate a shareable results page.
        </p>
        
        <div className="flex gap-3 md:gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 md:py-3 bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white font-bold transition-all text-sm md:text-base"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 md:py-3 bg-red-900/20 border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white font-bold transition-all text-sm md:text-base"
          >
            YES, RETIRE
          </button>
        </div>
      </div>
    </div>
  );
}

