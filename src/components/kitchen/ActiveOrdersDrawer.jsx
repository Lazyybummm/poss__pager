// ActiveOrdersDrawer.jsx
import React from 'react';
import { X, ChefHat, Check, BellRing, ReceiptText } from 'lucide-react';
import { getTheme, COMMON_STYLES, FONTS } from "../shared/theme";

export default function ActiveOrdersDrawer({ 
  isOpen, onClose, orders = [], onCompleteOrder, onCallCustomer, isDarkMode 
}) {
  if (!isOpen) return null;
  const theme = getTheme(isDarkMode);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ fontFamily: FONTS.sans }}>
      {/* Overlay */}
      <div className={`absolute inset-0 ${theme.bg.overlay} backdrop-blur-sm`} onClick={onClose} />
      
      {/* Drawer Container */}
      <div className={`relative h-full flex flex-col border-l w-[85vw] sm:w-[300px] md:w-[280px] lg:w-[300px] shrink-0 ${theme.border.default} ${theme.bg.subtle} shadow-2xl transform transition-transform duration-300`}>
        
        {/* Header */}
        <div className={`p-3 sm:p-4 md:p-4 flex justify-between items-center border-b ${theme.border.default}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${theme.bg.card} border ${theme.border.default} ${theme.text.main}`}>
              <ChefHat size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className={`font-bold text-base sm:text-lg tracking-tight ${theme.text.main}`}>Kitchen Status</h2>
              <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.05em] ${theme.text.muted}`}>
                {orders.length} PENDING TICKETS
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-none rounded-md ${theme.button.ghost}`}>
            <X size={20} />
          </button>
        </div>
        
        {/* Orders List */}
        <div className={`flex-1 overflow-y-auto p-3 sm:p-4 md:p-4 space-y-2 sm:space-y-3 md:space-y-4 ${COMMON_STYLES.scrollbar(isDarkMode)}`}>
          {orders.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-[60vh] opacity-50 ${theme.text.muted}`}>
              <ReceiptText size={32} className="mb-2 sm:w-10 md:w-10 md:h-10 sm:h-10" />
              <p className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.05em]">No active orders</p>
            </div>
          ) : (
            orders.map((order) => (
              <div 
                key={order.id} 
                className={`flex flex-col ${COMMON_STYLES.card(isDarkMode)}`}
              >
                {/* Header Bar */}
                <div className={`flex flex-col gap-1 px-3 py-2 sm:px-3 sm:py-3 border-b ${theme.border.light}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-base sm:text-lg md:text-xl font-mono font-bold tracking-tight ${theme.text.main}`}>
                      #{order.token}
                    </span>
                    <div className={COMMON_STYLES.badge(isDarkMode)}>
                      NEW
                    </div>
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-bold font-mono uppercase tracking-[0.05em] ${theme.text.muted}`}>
                    {new Date(order.startedAt || order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Items Content */}
                <div className="p-3 sm:p-4">
                  <div className="space-y-2">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className={`text-[11px] sm:text-[12px] md:text-[13px] font-mono font-bold ${theme.text.secondary}`}>
                            {item.quantity}x
                          </span>
                          <span className={`text-[11px] sm:text-[12px] md:text-[13px] font-bold tracking-tight leading-snug ${theme.text.main}`}>
                            {item.name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className={`py-2 flex items-center gap-3 ${theme.text.muted}`}>
                        <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.05em] font-bold">Synchronizing...</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="p-3 pt-0 sm:p-4 sm:pt-0 flex gap-2">
                  <button 
                    onClick={() => onCallCustomer?.(order.token)} 
                    className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-3 min-h-[44px] text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.05em] transition-none ${theme.button.secondary}`}
                  >
                    <BellRing size={14} className="sm:w-4 sm:h-4" /> Call
                  </button>
                  <button 
                    onClick={() => onCompleteOrder(order.id)} 
                    className={`flex-[1.5] flex items-center justify-center gap-1 sm:gap-2 py-3 min-h-[44px] text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.05em] transition-none ${theme.button.primary}`}
                  >
                    <Check size={16} strokeWidth={3} className="sm:w-4 sm:h-4" /> Done
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}