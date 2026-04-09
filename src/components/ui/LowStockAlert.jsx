// components/ui/LowStockAlert.jsx
// Professional notification center with #002366 theme

import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  X, 
  FileDown, 
  Package, 
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  CheckCircle2
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const downloadLowStockPDF = (lowStockItems) => {
  const doc = new jsPDF();
  
  // Header with #002366
  doc.setFillColor(0, 35, 102);
  doc.rect(0, 0, 210, 50, "F");
  doc.setTextColor(255, 255, 240);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("STOCK REORDER REPORT", 15, 25);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 38);
  doc.text("Priority: Immediate Action Required", 15, 45);
  
  const tableColumn = ["Item", "Current", "Min", "Required", "Unit"];
  const sorted = [...lowStockItems].sort((a, b) => 
    (b.min_stock - b.current_stock) - (a.min_stock - a.current_stock)
  );
  const tableRows = sorted.map(item => [
    item.name,
    item.current_stock.toLocaleString(),
    item.min_stock.toLocaleString(),
    Math.max(0, item.min_stock - item.current_stock).toFixed(2),
    item.unit
  ]);
  
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 60,
    theme: "striped",
    headStyles: { fillColor: [0, 35, 102], textColor: [255, 255, 240], fontStyle: "bold", fontSize: 10 },
    bodyStyles: { fontSize: 9, cellPadding: 6 },
    alternateRowStyles: { fillColor: [248, 248, 252] },
    columnStyles: { 0: { cellWidth: 55 }, 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center", textColor: [200, 0, 0] }, 4: { halign: "center" } }
  });
  
  doc.save(`Stock_Report_${Date.now()}.pdf`);
};

export default function LowStockAlert({ lowStock = [], isDarkMode = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewAlerts, setHasNewAlerts] = useState(false);
  const modalRef = useRef(null);
  const previousCountRef = useRef(0);
  
  const critical = lowStock.filter(i => i.current_stock <= i.min_stock);
  const low = lowStock.filter(i => i.current_stock > i.min_stock && i.current_stock <= i.min_stock * 1.5);
  const alertItems = [...critical, ...low].sort((a, b) => 
    (b.min_stock - b.current_stock) - (a.min_stock - a.current_stock)
  );
  const totalAlerts = alertItems.length;
  
  // Animate new alerts
  useEffect(() => {
    if (totalAlerts > previousCountRef.current) {
      setHasNewAlerts(true);
      const timer = setTimeout(() => setHasNewAlerts(false), 3000);
      return () => clearTimeout(timer);
    }
    previousCountRef.current = totalAlerts;
  }, [totalAlerts]);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);
  
  if (totalAlerts === 0) return null;
  
  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
          isOpen 
            ? "bg-[#002366] text-[#FFFFF0] shadow-lg" 
            : "hover:bg-[#002366]/10 text-[#002366] dark:text-[#FFFFF0]"
        }`}
      >
        <Bell size={20} />
        
        {/* Animated Badge */}
        {totalAlerts > 0 && (
          <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-red-500 rounded-full shadow-lg transition-all ${
            hasNewAlerts ? "animate-bounce scale-110" : ""
          }`}>
            {totalAlerts > 9 ? "9+" : totalAlerts}
          </span>
        )}
        
        {/* Pulse ring for new alerts */}
        {hasNewAlerts && (
          <span className="absolute inset-0 rounded-lg animate-ping bg-red-500/20" />
        )}
      </button>
      
      {/* Professional Dropdown Modal */}
      {isOpen && (
        <div 
          ref={modalRef}
          className="absolute right-0 mt-3 w-[420px] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50"
          style={{
            backgroundColor: isDarkMode ? "#0a0a0a" : "#ffffff",
            border: `1px solid ${isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"}`,
            boxShadow: isDarkMode 
              ? "0 25px 50px -12px rgba(0,0,0,0.5)"
              : "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b" style={{ 
            borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)",
            backgroundColor: isDarkMode ? "#111111" : "#fafafa"
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#002366]/10">
                  <TrendingDown size={18} className="text-[#002366]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
                    Stock Alerts
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
                    {critical.length > 0 
                      ? `${critical.length} critical · ${low.length} low`
                      : `${low.length} item${low.length > 1 ? "s" : ""} below threshold`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: isDarkMode ? "rgba(255,255,240,0.4)" : "rgba(0,0,0,0.4)" }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 p-4 border-b" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}>
            <div className="p-3 rounded-xl" style={{ backgroundColor: isDarkMode ? "#111111" : "#fafafa" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
                  Critical
                </span>
                <AlertTriangle size={14} className="text-red-500" />
              </div>
              <p className="text-2xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>{critical.length}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: isDarkMode ? "#111111" : "#fafafa" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
                  Low Stock
                </span>
                <Package size={14} className="text-orange-500" />
              </div>
              <p className="text-2xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>{low.length}</p>
            </div>
          </div>
          
          {/* Items List */}
          <div className="max-h-[360px] overflow-y-auto divide-y" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}>
            {alertItems.slice(0, 8).map((item, idx) => {
              const isCritical = item.current_stock <= item.min_stock;
              const shortfall = Math.max(0, item.min_stock - item.current_stock);
              const percentage = (item.current_stock / item.min_stock) * 100;
              
              return (
                <div 
                  key={item.id}
                  className="px-5 py-3 transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isCritical ? "bg-red-500" : "bg-orange-500"}`} />
                        <p className="text-sm font-medium" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
                          {item.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
                          Current: {item.current_stock} {item.unit}
                        </span>
                        <span className="text-xs" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
                          Min: {item.min_stock} {item.unit}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: isCritical ? "#ef4444" : "#f59e0b" }}>
                        -{shortfall.toFixed(1)} {item.unit}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: isDarkMode ? "rgba(255,255,240,0.4)" : "rgba(0,0,0,0.4)" }}>
                        needed
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)" }}>
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: isCritical ? "#ef4444" : "#f59e0b"
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t" style={{ 
            borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)",
            backgroundColor: isDarkMode ? "#111111" : "#fafafa"
          }}>
            <button
              onClick={() => downloadLowStockPDF(alertItems)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-lg"
              style={{
                backgroundColor: "#002366",
                color: "#FFFFF0",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <FileDown size={16} />
              Generate Reorder Report
              <ChevronRight size={14} />
            </button>
            
            {alertItems.length > 8 && (
              <p className="text-xs text-center mt-3" style={{ color: isDarkMode ? "rgba(255,255,240,0.4)" : "rgba(0,0,0,0.4)" }}>
                +{alertItems.length - 8} more items
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}