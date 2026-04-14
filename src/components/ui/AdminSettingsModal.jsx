// AdminSettingsModal.jsx - Complete Production Ready
import React, { useState, useEffect } from 'react';
import { X, Save, CreditCard, User, Box, AlertCircle, CheckCircle } from 'lucide-react';
import { getTheme, COMMON_STYLES, FONTS } from './theme';

// Success Modal Component
function SuccessModal({ isOpen, onClose, message, isDarkMode }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center animate-pulse">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
            Success!
          </h3>
          <p className="text-sm" style={{ color: isDarkMode ? "rgba(255,255,240,0.7)" : "rgba(0,0,0,0.7)" }}>
            {message}
          </p>
          <button 
            onClick={onClose}
            className="mt-6 w-full px-5 py-3 rounded-xl text-sm font-medium transition-all hover:shadow-lg"
            style={{ backgroundColor: "#002366", color: "#FFFFF0" }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// Error Modal Component
function ErrorModal({ isOpen, onClose, message, isDarkMode }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
            Error
          </h3>
          <p className="text-sm" style={{ color: isDarkMode ? "rgba(255,255,240,0.7)" : "rgba(0,0,0,0.7)" }}>
            {message}
          </p>
          <button 
            onClick={onClose}
            className="mt-6 w-full px-5 py-3 rounded-xl text-sm font-medium transition-all hover:shadow-lg"
            style={{ backgroundColor: "#002366", color: "#FFFFF0" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsModal({ open, onClose, restaurantId, isDarkMode }) {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [kitchenCapacity, setKitchenCapacity] = useState(20);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const theme = getTheme(isDarkMode);

  // Fetch settings when modal opens
  useEffect(() => {
    if (open) {
      const fetchSettings = async () => {
        try { 
          const token = localStorage.getItem("auth_token"); 
          if (!token) return;

          const res = await fetch(`${API_URL}/settings`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }); 

          if (res.ok) { 
            const data = await res.json(); 
            setUpiId(data.upi_id || ""); 
            setPayeeName(data.payee_name || ""); 
            setKitchenCapacity(data.kitchen_capacity || 20);
          } else {
            const errorData = await res.json();
            console.error("Failed to fetch settings:", errorData);
          }
        } catch (e) { 
          console.error("Fetch settings failed:", e); 
        }
      };
      fetchSettings();
    }
  }, [open, API_URL]);

  // Save settings - Uses the bulk update endpoint
  const handleSave = async () => {
    setLoading(true);
    setErrorMessage("");
    
    try { 
      const token = localStorage.getItem("auth_token"); 
      
      const payload = {
        upiId: upiId,
        payeeName: payeeName,
        kitchenCapacity: Number(kitchenCapacity),
        restaurantId: Number(restaurantId)
      };
      
      const res = await fetch(`${API_URL}/settings/`, { 
        method: "PUT", 
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        }, 
        body: JSON.stringify(payload) 
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || errData.detail || "Failed to save settings");
      }
      
      setShowSuccess(true);
    } catch (e) { 
      setErrorMessage(e.message);
      setShowError(true);
    } finally { 
      setLoading(false); 
    }
  };

  const handleCloseModal = () => {
    onClose();
    // Reset states after modal closes
    setTimeout(() => {
      setShowSuccess(false);
      setShowError(false);
      setErrorMessage("");
    }, 300);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-in fade-in">
        <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${COMMON_STYLES.modal(isDarkMode)}`}>
          {/* Header */}
          <div className={`p-5 border-b flex justify-between items-center ${theme.border.default}`}>
            <div>
              <h2 className={`text-xl font-semibold ${theme.text.main}`}>System Settings</h2>
              <p className={`text-xs mt-1 ${theme.text.muted}`}>Configure your POS system preferences</p>
            </div>
            <button 
              onClick={handleCloseModal} 
              className={`p-2 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5 ${theme.button.ghost}`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* UPI ID Field */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme.text.secondary}`}>
                UPI ID (VPA)
              </label>
              <div className="relative group">
                <CreditCard className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.text.secondary} transition-colors group-hover:text-[#002366]`} size={18}/>
                <input 
                  value={upiId} 
                  onChange={(e) => setUpiId(e.target.value)} 
                  placeholder="merchant@upi" 
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 focus:border-[#002366] focus:ring-1 focus:ring-[#002366] ${COMMON_STYLES.input(isDarkMode)}`} 
                />
              </div>
              <p className={`text-[10px] mt-1.5 ${theme.text.muted}`}>Your UPI ID for generating QR codes on receipts</p>
            </div>
            
            {/* Payee Name Field */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme.text.secondary}`}>
                Payee Name
              </label>
              <div className="relative group">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.text.secondary} transition-colors group-hover:text-[#002366]`} size={18}/>
                <input 
                  value={payeeName} 
                  onChange={(e) => setPayeeName(e.target.value)} 
                  placeholder="Business Name" 
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 focus:border-[#002366] focus:ring-1 focus:ring-[#002366] ${COMMON_STYLES.input(isDarkMode)}`} 
                />
              </div>
              <p className={`text-[10px] mt-1.5 ${theme.text.muted}`}>The name customers see when scanning UPI QR code</p>
            </div>
            
            {/* Kitchen Capacity Field */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme.text.secondary}`}>
                Kitchen Capacity
              </label>
              <div className="relative group">
                <Box className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.text.secondary} transition-colors group-hover:text-[#002366]`} size={18}/>
                <input 
                  type="number"
                  min="1"
                  max="100"
                  value={kitchenCapacity} 
                  onChange={(e) => setKitchenCapacity(e.target.value)} 
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 focus:border-[#002366] focus:ring-1 focus:ring-[#002366] ${COMMON_STYLES.input(isDarkMode)}`} 
                />
              </div>
              <p className={`text-[10px] mt-1.5 ${theme.text.muted}`}>Maximum active orders before warning the cashier</p>
            </div>
          </div>

          {/* Footer */}
          <div className={`p-5 border-t flex justify-end gap-3 ${theme.border.default} ${theme.bg.subtle}`}>
            <button 
              onClick={handleCloseModal} 
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${theme.button.secondary}`}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={loading} 
              className={`px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all hover:shadow-lg disabled:opacity-50 ${theme.button.primary}`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          handleCloseModal();
        }}
        message="Settings saved successfully!"
        isDarkMode={isDarkMode}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        message={errorMessage}
        isDarkMode={isDarkMode}
      />
    </>
  );
}