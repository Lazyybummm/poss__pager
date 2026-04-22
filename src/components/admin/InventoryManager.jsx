// Updated InventoryManager.jsx - Header color based on theme
import React, { useEffect, useState } from "react";
import { 
  Plus, RefreshCw, Edit2, Search, 
  FileText, CheckCircle2, AlertCircle, 
  ChevronDown, X, Package, TrendingDown,
  AlertTriangle, Loader, Zap, Shield,
  BarChart3, ShoppingCart, Truck,
  Trash2
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getTheme, COMMON_STYLES, FONTS } from "../shared/theme";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const UNIT_OPTIONS = ["kg", "grams", "liters", "ml", "pcs", "boxes", "packs", "oz", "lbs"];

const getStockStatus = (current, min) => {
  const ratio = Math.min(current / (min || 1), 2);
  const percentage = (ratio / 2) * 100;
  
  if (current <= min) 
    return { 
      color: "#ef4444", 
      bg: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))",
      label: "Critical", 
      pct: percentage, 
      icon: AlertCircle,
      glow: "0 0 10px rgba(239,68,68,0.3)"
    };
  if (current <= min * 1.5) 
    return { 
      color: "#f59e0b", 
      bg: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
      label: "Low Stock", 
      pct: percentage, 
      icon: AlertCircle,
      glow: "0 0 10px rgba(245,158,11,0.2)"
    };
  return { 
    color: "#10b981", 
    bg: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))",
    label: "In Stock", 
    pct: percentage, 
    icon: CheckCircle2,
    glow: "none"
  };
};

// Delete Confirmation Modal
function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName, isDarkMode }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className={`p-5 border-b flex items-center gap-3`} style={{
          backgroundColor: isDarkMode ? "#111111" : "#fafafa",
          borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)"
        }}>
          <div className="p-2 rounded-full bg-red-500/10">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
              Delete Ingredient
            </h3>
            <p className="text-sm mt-0.5" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
              Are you sure you want to delete "{itemName}"?
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} />
          </button>
        </div>
        <div className={`p-5 border-t flex gap-3`} style={{
          borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)",
          backgroundColor: isDarkMode ? "#0a0a0a" : "#ffffff"
        }}>
          <button onClick={onClose} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${getTheme(isDarkMode).button.secondary}`}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Restock Modal
function RestockModal({ isOpen, onClose, onConfirm, itemName, unit, isDarkMode }) {
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;
  
  const handleSubmit = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid quantity");
      return;
    }
    setLoading(true);
    onConfirm(qty);
    setLoading(false);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className={`p-5 border-b flex items-center gap-3`} style={{
          backgroundColor: isDarkMode ? "#111111" : "#fafafa",
          borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)"
        }}>
          <div className="p-2 rounded-full bg-green-500/10">
            <Truck size={24} className="text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
              Restock {itemName}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
              Enter quantity to add to inventory
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <input
            type="number"
            step="any"
            placeholder={`Quantity in ${unit}`}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={`w-full ${COMMON_STYLES.input(isDarkMode)} text-lg`}
            autoFocus
          />
        </div>
        <div className={`p-5 border-t flex gap-3`} style={{
          borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)",
          backgroundColor: isDarkMode ? "#0a0a0a" : "#ffffff"
        }}>
          <button onClick={onClose} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${getTheme(isDarkMode).button.secondary}`}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20">
            {loading && <Loader size={16} className="animate-spin" />}
            Add Stock
          </button>
        </div>
      </div>
    </div>
  );
}

// Success Modal
function SuccessModal({ isOpen, onClose, message, isDarkMode }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className={`p-6 text-center`}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center animate-pulse">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
            Success!
          </h3>
          <p className="text-sm" style={{ color: isDarkMode ? "rgba(255,255,240,0.7)" : "rgba(0,0,0,0.7)" }}>
            {message}
          </p>
          <button 
            onClick={onClose}
            className="mt-6 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-lg"
            style={{ backgroundColor: "#002366", color: "#FFFFF0" }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryManager({ apiRequest, isDarkMode }) {
  const theme = getTheme(isDarkMode);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState({ open: false, message: "" });
  const [form, setForm] = useState({ name: "", unit: "kg", current_stock: "", min_stock: "" });

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`${API_URL}/ingredients/`);
      const data = await res.json();
      if (res.ok) setIngredients(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchIngredients(); }, []);

  const downloadShoppingListPDF = () => {
    const lowStockItems = ingredients.filter(i => i.current_stock <= i.min_stock * 1.5);
    
    if (lowStockItems.length === 0) {
      setShowSuccessModal({ open: true, message: "🎉 All items are fully stocked! No procurement needed." });
      return;
    }

    const doc = new jsPDF();
    
    doc.setFillColor(0, 35, 102); 
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 240);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("PURCHASE REQUISITION", 15, 28);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 40);
    doc.text(`Total Items Needed: ${lowStockItems.length}`, 15, 47);

    const tableColumn = ["Ingredient", "Current", "Min Stock", "Required", "Unit", "Priority"];
    const tableRows = lowStockItems.map(item => {
      const required = Math.max(0, (item.min_stock * 1.5) - item.current_stock).toFixed(2);
      const priority = item.current_stock <= item.min_stock ? "URGENT" : "Normal";
      return [item.name, item.current_stock, item.min_stock, required, item.unit, priority];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      theme: 'grid',
      headStyles: { fillColor: [0, 35, 102], textColor: [255, 255, 240], fontStyle: 'bold', fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 6 },
      alternateRowStyles: { fillColor: [248, 248, 252] },
      columnStyles: {
        5: { cellWidth: 25, fontStyle: 'bold', textColor: [239, 68, 68] }
      }
    });

    doc.save(`Procurement_List_${Date.now()}.pdf`);
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    const isEditing = editingId !== null;
    try {
      const res = await apiRequest(
        isEditing ? `${API_URL}/ingredients/${editingId}` : `${API_URL}/ingredients/`,
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify({
            name: form.name,
            unit: form.unit,
            current_stock: Number(form.current_stock) || 0,
            min_stock: Number(form.min_stock) || 0
          })
        }
      );
      if (res.ok) {
        setForm({ name: "", unit: "kg", current_stock: "", min_stock: "" });
        setEditingId(null);
        fetchIngredients();
        setShowSuccessModal({ 
          open: true, 
          message: isEditing ? "✨ Ingredient updated successfully!" : "🎯 New ingredient added to inventory!" 
        });
      }
    } catch (err) { 
      setShowSuccessModal({ open: true, message: err.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await apiRequest(`${API_URL}/ingredients/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchIngredients();
        setShowDeleteModal(null);
        setShowSuccessModal({ open: true, message: "🗑️ Ingredient removed from inventory!" });
      }
    } catch (err) { 
      setShowSuccessModal({ open: true, message: err.message });
    }
  };

  const handleRestock = async (id, quantity) => {
    try {
      const res = await apiRequest(`${API_URL}/ingredients/${id}/restock?amount=${quantity}`, { method: "POST" });
      if (res.ok) {
        fetchIngredients();
        setShowSuccessModal({ open: true, message: `📦 Added ${quantity} units to inventory!` });
      }
    } catch (err) { 
      setShowSuccessModal({ open: true, message: err.message });
    }
  };

  const filtered = ingredients.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const criticalCount = ingredients.filter(i => i.current_stock <= i.min_stock).length;
  const lowCount = ingredients.filter(i => i.current_stock > i.min_stock && i.current_stock <= i.min_stock * 1.5).length;
  const totalValue = ingredients.reduce((sum, i) => sum + (i.current_stock * (i.cost_per_unit || 0)), 0);

  const inputStyle = {
    width: "100%",
    background: isDarkMode ? "#0d0d0d" : "#f5f5f5",
    border: `1px solid ${isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.15)"}`,
    color: isDarkMode ? "#e8e8e8" : "#1a1a1a",
    padding: "1rem 1.2rem",
    borderRadius: "0.8rem",
    outline: "none",
    fontSize: "0.95rem",
    transition: "all 0.15s"
  };

  const labelStyle = {
    fontSize: "0.7rem",
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: isDarkMode ? "#aaa" : "#555",
    marginBottom: "0.6rem",
    display: "block"
  };

  return (
    <div className="min-h-full w-full px-6 py-6">
      {/* Hero Section - Header color now based on theme */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
              Inventory Management
            </h1>
            <p className="text-sm mt-1" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
              Real-time stock monitoring & intelligent procurement
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={downloadShoppingListPDF} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all hover:shadow-xl hover:scale-105"
              style={{ backgroundColor: "#002366", color: "#FFFFF0" }}
            >
              <FileText size={18} /> Export Report
            </button>
            <div className="relative w-80">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: isDarkMode ? "rgba(255,255,240,0.4)" : "rgba(0,0,0,0.4)" }} />
              <input 
                placeholder="Search inventory..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all focus:border-[#002366] ${COMMON_STYLES.input(isDarkMode)}`} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
        <div className="group relative p-5 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#002366]/10 to-transparent rounded-full -mr-10 -mt-10 transition-all duration-500 group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Total Items</p>
              <p className="text-3xl font-bold mt-1" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>{ingredients.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#002366]/10 group-hover:bg-[#002366]/20 transition-all duration-300 group-hover:scale-110">
              <Package size={24} className="text-[#002366]" />
            </div>
          </div>
        </div>

        <div className="group relative p-5 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-10 -mt-10 transition-all duration-500 group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Low Stock</p>
              <p className="text-3xl font-bold mt-1 text-orange-500">{lowCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-all duration-300 group-hover:scale-110">
              <AlertCircle size={24} className="text-orange-500" />
            </div>
          </div>
        </div>

        <div className="group relative p-5 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/10 to-transparent rounded-full -mr-10 -mt-10 transition-all duration-500 group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Critical</p>
              <p className="text-3xl font-bold mt-1 text-red-500">{criticalCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-all duration-300 group-hover:scale-110">
              <TrendingDown size={24} className="text-red-500" />
            </div>
          </div>
        </div>

        <div className="group relative p-5 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-10 -mt-10 transition-all duration-500 group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Inventory Value</p>
              <p className="text-3xl font-bold mt-1 text-green-500">₹{totalValue.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-all duration-300 group-hover:scale-110">
              <Shield size={24} className="text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add/Edit Form */}
        <div className="rounded-2xl border p-6 transition-all hover:shadow-xl" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="flex items-center gap-2 mb-5 pb-3 border-b" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}>
            <div className="p-2 rounded-lg bg-[#002366]/10">
              {editingId ? <Edit2 size={18} className="text-[#002366]" /> : <Zap size={18} className="text-[#002366]" />}
            </div>
            <h2 className="text-lg font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
              {editingId ? "Update Ingredient" : "Quick Add"}
            </h2>
          </div>
          <div className="space-y-5">
            <div>
              <label style={labelStyle}>Ingredient Name</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Organic Flour" />
            </div>
            
            <div className="relative">
              <label style={labelStyle}>Unit Measurement</label>
              <select style={{ ...inputStyle, appearance: "none", cursor: "pointer" }} value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <ChevronDown size={16} style={{ position: "absolute", right: "1rem", bottom: "1.2rem", opacity: 0.5, pointerEvents: "none" }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Initial Stock</label>
                <input type="number" disabled={editingId !== null} style={{ ...inputStyle, opacity: editingId ? 0.5 : 1 }} value={form.current_stock} onChange={e => setForm({...form, current_stock: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Alert Threshold</label>
                <input type="number" style={inputStyle} value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})} />
              </div>
            </div>
            
            <button onClick={handleSubmit} className="w-full py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2" style={{ backgroundColor: "#002366", color: "#FFFFF0" }}>
              {editingId ? <Edit2 size={16} /> : <Plus size={16} />}
              {editingId ? "Save Changes" : "Add to Inventory"}
            </button>
            {editingId && (
              <button onClick={() => { setEditingId(null); setForm({ name: "", unit: "kg", current_stock: "", min_stock: "" }); }} className="w-full py-3.5 rounded-xl font-semibold transition-all" style={{ background: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.08)", color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* Inventory List */}
        <div className="lg:col-span-2 rounded-2xl border overflow-hidden transition-all hover:shadow-xl" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="grid grid-cols-12 gap-3 p-4 border-b" style={{
            backgroundColor: isDarkMode ? "#0a0a0a" : "#fafafa",
            borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)"
          }}>
            <div className="col-span-5 text-xs font-bold uppercase tracking-wider" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Item</div>
            <div className="col-span-3 text-xs font-bold uppercase tracking-wider text-right" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Stock Level</div>
            <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-center" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Status</div>
            <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-right" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Actions</div>
          </div>

          <div className="divide-y" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="animate-spin" size={32} style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Package size={48} className="mx-auto mb-4 opacity-30" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }} />
                <p className="text-sm opacity-60" style={{ color: isDarkMode ? "#aaa" : "#666" }}>No ingredients found</p>
              </div>
            ) : (
              filtered.map((item) => {
                const status = getStockStatus(item.current_stock, item.min_stock);
                const StatusIcon = status.icon;
                return (
                  <div key={item.id} className="relative group transition-all hover:bg-black/5 dark:hover:bg-white/5">
                    <div className="grid grid-cols-12 gap-3 p-4 items-center">
                      <div className="col-span-5">
                        <p className="font-semibold text-base" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>{item.name}</p>
                        <p className="text-xs mt-0.5 opacity-60" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Measured in {item.unit}</p>
                      </div>
                      <div className="col-span-3 text-right">
                        <p className="text-xl font-bold font-mono" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>{Number(item.current_stock).toLocaleString()}</p>
                        <p className="text-xs opacity-60" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Min: {item.min_stock}</p>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm" style={{ background: status.bg, color: status.color, boxShadow: status.glow }}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <button 
                          onClick={() => setShowRestockModal(item)} 
                          className="p-2 rounded-lg transition-all hover:bg-green-500/10 text-green-500 hover:scale-110"
                          title="Restock"
                        >
                          <Truck size={16} />
                        </button>
                        <button 
                          onClick={() => { setEditingId(item.id); setForm(item); }} 
                          className="p-2 rounded-lg transition-all hover:bg-blue-500/10 text-blue-500 hover:scale-110"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setShowDeleteModal(item)} 
                          className="p-2 rounded-lg transition-all hover:bg-red-500/10 text-red-500 hover:scale-110"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                      <div 
                        className="h-full transition-all duration-700 ease-out rounded-full"
                        style={{ width: `${status.pct}%`, backgroundColor: status.color, boxShadow: status.glow }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDeleteModal && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setShowDeleteModal(null)}
          onConfirm={() => handleDelete(showDeleteModal.id)}
          itemName={showDeleteModal.name}
          isDarkMode={isDarkMode}
        />
      )}

      {showRestockModal && (
        <RestockModal
          isOpen={true}
          onClose={() => setShowRestockModal(null)}
          onConfirm={(qty) => handleRestock(showRestockModal.id, qty)}
          itemName={showRestockModal.name}
          unit={showRestockModal.unit}
          isDarkMode={isDarkMode}
        />
      )}

      <SuccessModal
        isOpen={showSuccessModal.open}
        onClose={() => setShowSuccessModal({ open: false, message: "" })}
        message={showSuccessModal.message}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}