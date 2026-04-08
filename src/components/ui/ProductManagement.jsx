import React, { useState, useEffect } from "react";

const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000";
const PEXELS_KEY = "4KhEPzhCIsWZkFGJRUzECgdCw7UZOwQ8fNUrHf1430S2AiM2A8yAHyIS";

const ls = { getToken: () => localStorage.getItem("auth_token") };

const stockStatus = (qty) =>
  qty === 0
    ? { color: "#ff6b6b", bg: "rgba(255,107,107,0.12)", label: "Sold Out" }
    : qty <= 10
    ? { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Low Stock" }
    : { color: "#4ade80", bg: "rgba(74,222,128,0.12)", label: "In Stock" };

// ── Icons ────────────────────────────────────────────────────────────────────
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const PackageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

// ── Product Row ───────────────────────────────────────────────────────────────
function ProductRow({ product, onDelete, onEdit, isLast }) {
  const status = stockStatus(product.stock ?? 0);
  const [hovering, setHovering] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "1rem 1.5rem",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
        background: hovering ? "rgba(177,197,255,0.03)" : "transparent",
        transition: "background 0.15s ease",
        gap: "1rem",
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: "3rem", height: "3rem", borderRadius: "0.6rem",
        overflow: "hidden", flexShrink: 0,
        background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)",
      }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#333" }}>
            <PackageIcon />
          </div>
        )}
      </div>

      {/* Name + category */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "#f0f0f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {product.name}
        </p>
        <p style={{ margin: "0.15rem 0 0", fontSize: "0.72rem", color: "#555", fontWeight: 500 }}>
          {product.category}
        </p>
      </div>

      {/* Price */}
      <div style={{ width: "6rem", textAlign: "right" }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#b1c5ff", fontVariantNumeric: "tabular-nums" }}>
          ₹{Number(product.price).toLocaleString("en-IN")}
        </span>
      </div>

      {/* Stock badge */}
      <div style={{ width: "8rem", display: "flex", justifyContent: "center" }}>
        <span style={{
          background: status.bg, color: status.color,
          padding: "0.25rem 0.75rem", borderRadius: "9999px",
          fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}>
          {status.label} · {product.stock}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
        <button
          onClick={() => onEdit(product)}
          title="Edit"
          style={{
            width: "2.1rem", height: "2.1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(177,197,255,0.07)", border: "1px solid rgba(177,197,255,0.12)",
            borderRadius: "0.5rem", cursor: "pointer", color: "#b1c5ff",
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(177,197,255,0.15)"; e.currentTarget.style.borderColor = "rgba(177,197,255,0.25)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(177,197,255,0.07)"; e.currentTarget.style.borderColor = "rgba(177,197,255,0.12)"; }}
        >
          <EditIcon />
        </button>
        <button
          onClick={() => onDelete(product.id)}
          title="Delete"
          style={{
            width: "2.1rem", height: "2.1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.12)",
            borderRadius: "0.5rem", cursor: "pointer", color: "#ff6b6b",
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,107,107,0.15)"; e.currentTarget.style.borderColor = "rgba(255,107,107,0.25)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,107,107,0.07)"; e.currentTarget.style.borderColor = "rgba(255,107,107,0.12)"; }}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

// ── Product Modal ─────────────────────────────────────────────────────────────
// ── Product Modal (Updated with Auto-Selection) ─────────────────────────────────────────────
function ProductModal({ onClose, onSave, editingProduct = null }) {
  const [form, setForm] = useState(
    editingProduct
      ? { name: editingProduct.name, price: editingProduct.price, category: editingProduct.category, stock: editingProduct.stock }
      : { name: "", price: "", category: "Main Course", stock: 100 }
  );
  const [query, setQuery] = useState("");
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(
    editingProduct
      ? { src: { large: editingProduct.image_url, medium: editingProduct.image_url }, id: "preset" }
      : null
  );
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Logic: Auto-select the first image for new products
  const searchImages = async (autoSelect = false) => {
    const searchQuery = autoSelect ? form.name : query;
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=6&orientation=landscape`, {
        headers: { Authorization: PEXELS_KEY },
      });
      const data = await res.json();
      const photos = data.photos || [];
      setImages(photos);

      // Automatically pick the top choice if creating a new product
      if (!editingProduct && photos.length > 0) {
        setSelected(photos[0]);
      }
    } catch (err) {
      console.error("Pexels Search Error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!selected || !form.name || !form.price) return;
    setSaving(true);
    try {
      const token = ls.getToken();
      const method = editingProduct ? "PUT" : "POST";
      const endpoint = editingProduct ? `${API_URL}/products/${editingProduct.id}` : `${API_URL}/products/`;
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
            ...form, 
            price: parseFloat(form.price), 
            stock: parseInt(form.stock), 
            image_url: selected.src.large 
        }),
      });
      if (!res.ok) throw new Error();
      onSave(await res.json(), !!editingProduct);
      onClose();
    } catch { 
      alert("Failed to save. Please try again."); 
    } finally { 
      setSaving(false); 
    }
  };

  const inp = {
    width: "100%", background: "#0d0d0d",
    border: "1px solid rgba(255,255,255,0.07)", color: "#e8e8e8",
    padding: "0.75rem 1rem", borderRadius: "0.6rem", outline: "none",
    fontSize: "0.85rem", boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color 0.15s",
  };
  const lbl = { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", display: "block", marginBottom: "0.4rem" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", padding: "1rem" }}>
      <div style={{
        background: "#0f0f0f", width: "100%", maxWidth: "52rem",
        display: "flex", borderRadius: "1rem", overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
        maxHeight: "90vh",
      }}>
        {/* Left — form */}
        <div style={{ flex: 1, padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.1rem", overflowY: "auto" }}>
          <div style={{ paddingBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "0.25rem" }}>
            <h2 style={{ color: "#f0f0f0", margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
              {editingProduct ? "Edit Product" : "Add Product"}
            </h2>
            <p style={{ color: "#444", margin: "0.25rem 0 0", fontSize: "0.75rem" }}>
              {editingProduct ? "Manual override enabled for image" : "Image will be auto-selected based on name"}
            </p>
          </div>

          <div>
            <label style={lbl}>Product Name</label>
            <input 
              type="text" 
              placeholder="e.g. Truffle Pasta" 
              value={form.name}
              onChange={e => {
                setForm({ ...form, name: e.target.value });
                // Update search query as they type so they can see alternatives
                if (!editingProduct) setQuery(e.target.value);
              }} 
              style={inp}
              onFocus={e => (e.target.style.borderColor = "rgba(177,197,255,0.35)")}
              // Trigger auto-select when they finish typing the name
              onBlur={e => {
                e.target.style.borderColor = "rgba(255,255,255,0.07)";
                if (!editingProduct && form.name) searchImages(true);
              }} 
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={lbl}>Price (₹)</label>
              <input type="number" placeholder="0.00" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })} style={inp} />
            </div>
            <div>
              <label style={lbl}>Initial Stock</label>
              <input type="number" placeholder="100" value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })} style={inp} />
            </div>
          </div>

          <div>
            <label style={lbl}>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ ...inp, cursor: "pointer" }}>
              {["Starters", "Main Course", "Desserts", "Beverages", "Wine & Spirits", "Chef's Specials"].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ ...lbl, color: "#5a7fd4" }}>
                {editingProduct ? "Current Photo (Click right to change)" : "Auto-Selected Photo"}
            </label>
            <div style={{
              height: "8rem", borderRadius: "0.6rem", overflow: "hidden",
              background: "#0a0a0a", border: `1px solid ${selected ? "rgba(177,197,255,0.2)" : "rgba(255,255,255,0.06)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative"
            }}>
              {selected ? (
                <>
                    <img src={selected.src.medium} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {searching && (
                        <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem'}}>Searching...</div>
                    )}
                </>
              ) : (
                <span style={{ color: "#2a2a2a", fontSize: "0.75rem", fontWeight: 600 }}>
                    {searching ? "Finding best match..." : "Waiting for product name..."}
                </span>
              )}
            </div>
          </div>

          <div style={{ marginTop: "auto", display: "flex", gap: "0.75rem" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "0.8rem", borderRadius: "0.6rem", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#555", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>Cancel</button>
            <button
              onClick={handleSave}
              disabled={!form.name || !form.price || !selected || saving}
              style={{
                flex: 2, padding: "0.8rem", borderRadius: "0.6rem", border: "none",
                background: form.name && form.price && selected ? "#3b5bdb" : "#1a1a1a",
                color: form.name && form.price && selected ? "#fff" : "#333",
                cursor: form.name && form.price && selected ? "pointer" : "not-allowed",
                fontSize: "0.85rem", fontWeight: 700, transition: "background 0.2s",
              }}
            >
              {saving ? "Saving…" : editingProduct ? "Update Product" : "Create Product"}
            </button>
          </div>
        </div>

        {/* Right — Manual Search (For Editing or Overriding) */}
        <div style={{ flex: 1, background: "#080808", padding: "2.5rem", borderLeft: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto" }}>
          <div>
            <label style={lbl}>Search Alternatives</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#444" }}>
                  <SearchIcon />
                </span>
                <input
                  type="text" placeholder="pasta, steak, wine..."
                  value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchImages(false)}
                  style={{ ...inp, paddingLeft: "2.25rem" }}
                />
              </div>
              <button onClick={() => searchImages(false)} style={{ padding: "0 1rem", background: "#1a2a5e", border: "1px solid rgba(177,197,255,0.15)", borderRadius: "0.6rem", color: "#b1c5ff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}>
                Search
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            {images.map(img => (
              <div
                key={img.id}
                onClick={() => setSelected(img)}
                style={{
                  aspectRatio: "4/3", borderRadius: "0.5rem", overflow: "hidden",
                  cursor: "pointer", border: selected?.id === img.id ? "2px solid #3b5bdb" : "2px solid transparent",
                  transition: "all 0.15s", opacity: selected && selected.id !== img.id ? 0.45 : 1,
                }}
              >
                <img src={img.src.medium} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
            {!searching && !images.length && (
              <p style={{ gridColumn: "span 2", color: "#2a2a2a", fontSize: "0.72rem", textAlign: "center", padding: "2rem 0", lineHeight: 1.8 }}>
                Use the search bar above to<br />find a different image.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Products Page ─────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState({ open: false, product: null });
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = ls.getToken();
        const res = await fetch(`${API_URL}/products/`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetch_();
  }, []);

  const handleSave = (updated, isEdit) => {
    setProducts(prev => isEdit ? prev.map(p => p.id === updated.id ? updated : p) : [updated, ...prev]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this product from the menu?")) return;
    const token = ls.getToken();
    await fetch(`${API_URL}/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "All" || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ padding: "2.5rem 2.5rem", maxWidth: "72rem", margin: "0 auto", minHeight: "100vh", fontFamily: "inherit" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ color: "#f0f0f0", margin: 0, fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Product Management
          </h1>
          <p style={{ color: "#444", marginTop: "0.3rem", fontSize: "0.8rem", fontWeight: 500 }}>
            Total Products: <span style={{ color: "#6b7fc4" }}>{products.length}</span>
          </p>
        </div>
        <button
          onClick={() => setModalMode({ open: true, product: null })}
          style={{
            background: "#3b5bdb", color: "#fff", padding: "0.65rem 1.25rem",
            borderRadius: "0.6rem", border: "none", fontWeight: 700, cursor: "pointer",
            fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.4rem",
            letterSpacing: "0.01em",
          }}
        >
          + Add Product
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "200px", maxWidth: "280px" }}>
          <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#333" }}>
            <SearchIcon />
          </span>
          <input
            type="text" placeholder="Search products…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)",
              color: "#e0e0e0", padding: "0.6rem 0.875rem 0.6rem 2.25rem",
              borderRadius: "0.6rem", outline: "none", fontSize: "0.82rem", boxSizing: "border-box",
              transition: "border-color 0.15s", fontFamily: "inherit",
            }}
            onFocus={e => (e.target.style.borderColor = "rgba(177,197,255,0.3)")}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.07)")}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              style={{
                padding: "0.4rem 0.9rem", borderRadius: "9999px",
                border: "1px solid",
                borderColor: filterCategory === c ? "#3b5bdb" : "rgba(255,255,255,0.08)",
                background: filterCategory === c ? "rgba(59,91,219,0.15)" : "transparent",
                color: filterCategory === c ? "#b1c5ff" : "#555",
                fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: "flex", alignItems: "center", padding: "0.6rem 1.5rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        marginBottom: "0.25rem",
      }}>
        <div style={{ flex: 1, fontSize: "0.65rem", fontWeight: 700, color: "#3a3a3a", textTransform: "uppercase", letterSpacing: "0.1em", paddingLeft: "4rem" }}>
          Product
        </div>
        <div style={{ width: "6rem", textAlign: "right", fontSize: "0.65rem", fontWeight: 700, color: "#3a3a3a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Price
        </div>
        <div style={{ width: "8rem", textAlign: "center", fontSize: "0.65rem", fontWeight: 700, color: "#3a3a3a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Stock
        </div>
        <div style={{ width: "5.5rem" }} />
      </div>

      {/* Product list */}
      <div style={{ background: "#0d0d0d", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#2a2a2a", fontSize: "0.82rem", fontWeight: 600 }}>
            Loading products…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#2a2a2a", fontSize: "0.82rem", fontWeight: 600 }}>
            No products found
          </div>
        ) : (
          filtered.map((p, i) => (
            <ProductRow
              key={p.id}
              product={p}
              onDelete={handleDelete}
              onEdit={(prod) => setModalMode({ open: true, product: prod })}
              isLast={i === filtered.length - 1}
            />
          ))
        )}
      </div>

      {modalMode.open && (
        <ProductModal
          editingProduct={modalMode.product}
          onClose={() => setModalMode({ open: false, product: null })}
          onSave={handleSave}
        />
      )}
    </div>
  );
}