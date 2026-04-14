import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader, ArrowRight } from 'lucide-react';
import { getTheme, COMMON_STYLES, FONTS } from './theme';

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  cartSubtotal, 
  taxAmount, 
  discount, 
  grandTotal, 
  orderId, 
  isDarkMode, 
  backendUpiData,
  onPaymentComplete 
}) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const theme = getTheme(isDarkMode);

  useEffect(() => { 
    if (isOpen) { 
      setPaymentMethod('cash'); 
      setIsProcessing(false); 
    } 
  }, [isOpen]);
  
  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (paymentMethod === "upi") {
      await onConfirm({ paymentMethod: "upi", initiate: true });
      return;
    }
    setIsProcessing(true);
    await onConfirm({ paymentMethod });
    setIsProcessing(false);
  };

  // ─── UPI QR VIEW ───
  if (backendUpiData?.qr) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.bg.overlay} backdrop-blur-sm`} style={{ fontFamily: FONTS.sans }}>
        <div className={`w-full max-w-sm sm:max-w-md p-4 sm:p-6 md:p-6 flex flex-col items-center justify-center overflow-y-auto max-h-[60vh] md:max-h-[65vh] ${COMMON_STYLES.modal(isDarkMode)} ${COMMON_STYLES.scrollbar(isDarkMode)}`}>
          <div className={`w-12 h-12 rounded-full mb-3 sm:mb-4 flex items-center justify-center shrink-0 ${theme.bg.subtle} ${theme.text.primary}`}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
               <path d="M8 12h8"></path>
               <path d="M12 8v8"></path>
             </svg>
          </div>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight mb-2 ${theme.text.main}`}>Scan to Pay</h2>
          <p className={`text-xs sm:text-sm font-mono mb-4 sm:mb-6 px-4 py-1 rounded-sm border ${theme.border.light} ${theme.text.secondary}`}>
            ₹{grandTotal}
          </p>
          
          <div className={`p-3 sm:p-4 bg-white rounded-lg border shrink-0 ${theme.border.light} mb-4 sm:mb-6`}>
             <img src={backendUpiData.qr} alt="UPI QR" className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 object-contain" />
          </div>

          <button 
            onClick={() => onPaymentComplete(backendUpiData.orderId)}
            className={`w-full py-3 sm:py-4 min-h-[44px] font-bold text-[10px] sm:text-[11px] md:text-xs uppercase tracking-[0.05em] flex items-center justify-center gap-2 rounded-md ${theme.button.primary}`}
          >
             <CheckCircle size={16} /> Payment Verified
          </button>
        </div>
      </div>
    );
  }

  // ─── STANDARD CHECKOUT VIEW ───
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.bg.overlay} backdrop-blur-sm`} style={{ fontFamily: FONTS.sans }}>
      <div className={`w-[95vw] sm:w-full sm:max-w-lg flex flex-col ${COMMON_STYLES.modal(isDarkMode)}`}>
        
        {/* Header */}
        <div className={`flex justify-between items-center p-3 sm:p-4 md:p-4 border-b ${theme.border.light} ${theme.bg.subtle}`}>
          <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${theme.text.main}`}>Checkout</h2>
          <button onClick={onClose} className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md transition-none ${theme.button.ghost}`}>
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Body */}
        <div className={`p-3 sm:p-4 md:p-4 space-y-4 sm:space-y-6 overflow-y-auto max-h-[60vh] md:max-h-[65vh] ${theme.bg.main} ${COMMON_STYLES.scrollbar(isDarkMode)}`}>
          
          {/* Summary */}
          <div className={`p-3 sm:p-4 md:p-4 rounded border ${theme.border.light} ${theme.bg.subtle}`}>
            <div className={`flex justify-between text-xs sm:text-sm mb-3 ${theme.text.secondary}`}>
              <span className="font-bold uppercase tracking-[0.05em] text-[9px] sm:text-[10px] md:text-[11px]">Ticket ID:</span>
              <span className="font-mono font-bold">#{orderId}</span>
            </div>
            <div className={`flex justify-between items-baseline pt-3 sm:pt-4 border-t ${theme.border.light}`}>
              <span className={`font-bold uppercase tracking-[0.05em] text-[10px] sm:text-[11px] md:text-xs ${theme.text.muted}`}>Total</span>
              <span className={`text-2xl sm:text-3xl md:text-4xl font-mono font-bold tracking-tighter ${theme.text.primary}`}>₹{grandTotal}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label className={`block text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-[0.05em] mb-3 ${theme.text.muted}`}>
              Select Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {['cash', 'upi', 'card'].map((m) => (
                <button 
                  key={m} 
                  onClick={() => setPaymentMethod(m)} 
                  className={`py-3 sm:py-4 min-h-[44px] border text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.05em] rounded-md transition-colors ${
                    paymentMethod === m 
                    ? `${theme.border.focus} ${theme.bg.subtle} ${theme.text.primary}` 
                    : `${theme.border.default} ${theme.button.ghost}`
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          
          {/* Action Button */}
          <button 
            onClick={handleConfirm} 
            disabled={isProcessing} 
            className={`w-full py-3 sm:py-4 min-h-[44px] font-bold text-[10px] sm:text-[11px] md:text-xs uppercase tracking-[0.05em] flex justify-center items-center gap-2 sm:gap-3 disabled:opacity-20 rounded-md ${theme.button.primary}`}
          >
            {isProcessing ? (
              <Loader className="animate-spin" size={16} />
            ) : (
              <>
                <span>Complete Transaction</span>
                <ArrowRight size={14} className="sm:w-4 sm:h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}