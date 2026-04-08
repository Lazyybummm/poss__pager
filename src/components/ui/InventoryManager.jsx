import React, { useEffect, useState } from "react";
import { 
  Plus, RefreshCw, Edit2, Search, 
  FileText, CheckCircle2,
  AlertCircle, ChevronDown
} from "lucide-react";
// Import jsPDF for PDF generation
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const THEME = {
  bg: "#000000",
  text: "#FFFFF0",
  blue: "#002366",
  card: "#080808",
  border: "rgba(0, 35, 102, 0.4)", 
  muted: "#444"
};

const UNIT_OPTIONS = ["kg", "grams", "liters", "ml", "pcs", "boxes", "packs", "oz", "lbs"];

const getStockStatus = (current, min) => {
  const ratio = Math.min(current / (min || 1), 2); 
  const percentage = (ratio / 2) * 100;
  
  if (current <= min) 
    return { color: "#ff4d4d", label: "Out of Stock", pct: percentage, icon: <AlertCircle size={14}/> };
  if (current <= min * 1.5) 
    return { color: "#ffa502", label: "Low Stock", pct: percentage, icon: <AlertCircle size={14}/> };
  return { color: "#2ed573", label: "In Stock", pct: percentage, icon: <CheckCircle2 size={14}/> };
};

export default function InventoryManager({ apiRequest }) {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  // PDF Generation Logic
  const downloadShoppingListPDF = () => {
    const lowStockItems = ingredients.filter(i => i.current_stock <= i.min_stock * 1.5);
    
    if (lowStockItems.length === 0) return alert("Everything is fully stocked.");

    const doc = new jsPDF();
    
    // Header Styling
    doc.setFillColor(0, 35, 102); 
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 240);
    doc.setFontSize(22);
    doc.text("PURCHASE REQUISITION", 15, 25);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 33);

    const tableColumn = ["Ingredient", "Current Stock", "Alert Min", "Suggested Buy", "Unit"];
    const tableRows = lowStockItems.map(item => [
      item.name,
      item.current_stock,
      item.min_stock,
      Math.max(0, (item.min_stock * 1.5) - item.current_stock).toFixed(2),
      item.unit
    ]);

    // CHANGE THIS LINE: Call autoTable(doc, options) instead of doc.autoTable()
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [0, 35, 102], textColor: [255, 255, 240], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [250, 250, 245] }
    });

    doc.save(`Procurement_List_${new Date().getTime()}.pdf`);
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
      }
    } catch (err) { alert(err.message); }
  };

  const handleRestock = async (id) => {
    const amount = prompt("Quantity to add:");
    if (!amount || isNaN(amount)) return;
    try {
      const res = await apiRequest(`${API_URL}/ingredients/${id}/restock?amount=${amount}`, { method: "POST" });
      if (res.ok) fetchIngredients();
    } catch (err) { alert(err.message); }
  };

  const filtered = ingredients.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const inputStyle = {
    width: "100%", background: "#050505", border: `1px solid ${THEME.border}`,
    color: THEME.text, padding: "0.9rem 1.1rem", borderRadius: "0.8rem", outline: "none", fontSize: "0.9rem"
  };

  const labelStyle = {
    fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em",
    textTransform: "uppercase", color: THEME.muted, marginBottom: "0.6rem", display: "block"
  };

  return (
    <div style={{ padding: "3rem 4rem", maxWidth: "1400px", margin: "0 auto", color: THEME.text, background: THEME.bg }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em", color: THEME.text }}>Inventory</h1>
          <p style={{ color: THEME.muted, fontSize: "1rem", marginTop: "0.4rem" }}>Real-time stock monitoring & procurement</p>
        </div>
        <div style={{ display: "flex", gap: "1.2rem" }}>
          <button onClick={downloadShoppingListPDF} style={{ background: THEME.blue, color: THEME.text, border: `1px solid ${THEME.border}`, padding: "0.8rem 1.5rem", borderRadius: "0.8rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <FileText size={18} /> Export PDF
          </button>
          <div style={{ position: "relative", width: "280px" }}>
            <Search size={18} style={{ position: "absolute", left: "1.1rem", top: "50%", transform: "translateY(-50%)", color: THEME.muted }} />
            <input 
              placeholder="Filter items..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, paddingLeft: "3.2rem" }} 
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "4rem", alignItems: "start" }}>
        <div style={{ background: THEME.card, padding: "2.8rem", borderRadius: "1.5rem", border: `1px solid ${THEME.border}` }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "2.2rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <Plus size={22} color={THEME.text} /> {editingId ? "Update Details" : "Add New Item"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
            <div>
              <label style={labelStyle}>Ingredient Name</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Flour" />
            </div>
            
            <div style={{ position: "relative" }}>
              <label style={labelStyle}>Unit Measurement</label>
              <select style={{ ...inputStyle, appearance: "none", cursor: "pointer" }} value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                {UNIT_OPTIONS.map(u => <option key={u} value={u} style={{background: "#000"}}>{u}</option>)}
              </select>
              <ChevronDown size={16} style={{ position: "absolute", right: "1.1rem", bottom: "1.1rem", color: THEME.muted, pointerEvents: "none" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
              <div>
                <label style={labelStyle}>Initial Stock</label>
                <input type="number" disabled={editingId !== null} style={{ ...inputStyle, opacity: editingId ? 0.3 : 1 }} value={form.current_stock} onChange={e => setForm({...form, current_stock: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Alert Min</label>
                <input type="number" style={inputStyle} value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})} />
              </div>
            </div>
            
            <button onClick={handleSubmit} style={{ background: THEME.blue, color: THEME.text, border: `1px solid ${THEME.border}`, padding: "1.1rem", borderRadius: "0.9rem", fontWeight: 800, cursor: "pointer", marginTop: "0.5rem" }}>
              {editingId ? "Save Changes" : "Confirm Entry"}
            </button>
          </div>
        </div>

        <div style={{ background: THEME.card, borderRadius: "1.5rem", border: `1px solid ${THEME.border}`, overflow: "hidden" }}>
          <div style={{ display: "flex", padding: "1.5rem 2.5rem", borderBottom: `1px solid ${THEME.border}`, background: "#050505" }}>
            <div style={{ flex: 2, ...labelStyle, marginBottom: 0 }}>Description</div>
            <div style={{ flex: 1.2, ...labelStyle, marginBottom: 0, textAlign: "right" }}>Level</div>
            <div style={{ flex: 1, ...labelStyle, marginBottom: 0, textAlign: "right" }}>Condition</div>
            <div style={{ width: "100px" }}></div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map((item) => {
              const status = getStockStatus(item.current_stock, item.min_stock);
              return (
                <div key={item.id} style={{ position: "relative", borderBottom: `1px solid ${THEME.border}`, padding: "1.8rem 2.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", position: "relative", zIndex: 2 }}>
                    <div style={{ flex: 2 }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{item.name}</div>
                      <div style={{ fontSize: "0.8rem", color: THEME.muted, marginTop: "0.3rem" }}>Measured in {item.unit}</div>
                    </div>

                    <div style={{ flex: 1.2, textAlign: "right" }}>
                      <div style={{ fontSize: "1.3rem", fontWeight: 800, fontFamily: "monospace", letterSpacing: "-0.02em" }}>{Number(item.current_stock).toLocaleString()}</div>
                      <div style={{ fontSize: "0.7rem", color: THEME.muted, fontWeight: 700 }}>MIN: {item.min_stock}</div>
                    </div>

                    <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: status.color, fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {status.icon} {status.label}
                      </div>
                    </div>

                    <div style={{ width: "100px", display: "flex", justifyContent: "flex-end", gap: "1.2rem" }}>
                      <button onClick={() => handleRestock(item.id)} style={{ background: "transparent", border: "none", color: "#2ed573", cursor: "pointer", opacity: 0.3 }}><RefreshCw size={18} /></button>
                      <button onClick={() => { setEditingId(item.id); setForm(item); }} style={{ background: "transparent", border: "none", color: THEME.blue, cursor: "pointer", opacity: 0.8 }}><Edit2 size={18} /></button>
                    </div>
                  </div>

                  <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "2px", background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ 
                      height: "100%", 
                      width: `${status.pct}%`, 
                      background: THEME.blue, 
                      transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)", 
                      opacity: 0.8,
                      boxShadow: `0 0 15px ${THEME.blue}`
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}