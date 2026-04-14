// OrderDetailsModal.jsx
import React from 'react';
import { getTheme, COMMON_STYLES } from './theme';

export default function OrderDetailsModal({ order, onClose, onComplete, isDarkMode }) {
  if (!order) return null;

  const theme = getTheme(isDarkMode);

  // FIX: Force numeric calculation for the display
  const total = order.items.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.bg.overlay} backdrop-blur-sm`}>
      <div className={`p-3 sm:p-4 md:p-4 w-[95vw] sm:w-full sm:max-w-md md:max-w-lg flex flex-col ${COMMON_STYLES.modal(isDarkMode)}`}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div>
            <h2 className={`text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 sm:gap-3 ${theme.text.main}`}>
              <span className="font-mono">Token {order.token}</span>
              <span className={`text-[9px] sm:text-[10px] md:text-xs px-2 py-0.5 uppercase font-mono rounded ${theme.button.secondary}`}>
                #{order.displayId}
              </span>
            </h2>
            <p className={`text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2 ${theme.text.secondary}`}>🕒 Preparing 3:11</p>
          </div>
          <button 
            onClick={onClose} 
            className={`text-xl sm:text-2xl md:text-3xl p-1 -m-1 min-h-[44px] min-w-[44px] flex items-center justify-center ${theme.text.secondary} hover:${theme.text.main} transition-colors`}
          >
            &times;
          </button>
        </div>

        {/* Item List */}
        <div className={`border-y py-3 sm:py-4 md:py-4 my-3 sm:my-4 md:my-4 space-y-2 sm:space-y-3 md:space-y-3 max-h-[60vh] md:max-h-[65vh] overflow-y-auto ${COMMON_STYLES.scrollbar(isDarkMode)} ${theme.border.default}`}>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-xs sm:text-sm md:text-base">
              <span className={`line-clamp-2 pr-2 ${theme.text.main}`}>
                {item.name} 
                <span className={`text-[10px] sm:text-xs md:text-sm ml-1.5 font-mono font-bold ${theme.text.muted}`}>x{item.quantity}</span>
              </span>
              <span className={`font-semibold font-mono shrink-0 ${theme.text.main}`}>₹{Number(item.price) * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center font-bold text-base sm:text-lg md:text-xl mb-4 sm:mb-5 md:mb-6">
          <span className={theme.text.secondary}>Total Bill</span>
          <span className={`font-mono ${theme.text.main}`}>₹{total.toFixed(0)}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-3 md:gap-4">
          <button 
            onClick={() => onComplete(order.id)}
            className={`w-full sm:flex-1 py-3 sm:py-4 min-h-[44px] text-xs sm:text-sm md:text-base font-bold uppercase tracking-[0.05em] rounded-md flex items-center justify-center ${theme.button.primary}`}
          >
            ✓ Mark Ready
          </button>

          <button 
            onClick={onClose} 
            className={`w-full sm:flex-1 py-3 sm:py-4 min-h-[44px] text-xs sm:text-sm md:text-base font-bold uppercase tracking-[0.05em] rounded-md border flex items-center justify-center transition-colors ${theme.button.secondary}`}
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}