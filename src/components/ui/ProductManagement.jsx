// Updated ProductManagement.jsx - Fixed double entry bug
import React, { useState, useMemo } from "react";
import { getTheme, COMMON_STYLES } from "./theme";
import { Plus, Search, Edit2, Trash2, Package, X, Check, AlertCircle, Loader } from "lucide-react";

const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000";
const PEXELS_KEY = "4KhEPzhCIsWZkFGJRUzECgdCw7UZOwQ8fNUrHf1430S2AiM2A8yAHyIS";

const ls = { getToken: () => localStorage.getItem("auth_token") };

const stockStatus = (qty) =>
  qty === 0
    ? { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Out of Stock" }
    : qty <= 10
    ? { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Low Stock" }
    : { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "In Stock" };

// Delete Confirmation Modal
function DeleteConfirmModal({ isOpen, onClose, onConfirm, productName, isDarkMode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className="p-5 border-b flex items-center gap-3" style={{
          backgroundColor: isDarkMode ? "#111111" : "#fafafa",
          borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)"
        }}>
          <div className="p-2 rounded-full bg-red-500/10">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
              Delete Product
            </h3>
            <p className="text-sm mt-0.5" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
              Are you sure you want to delete "{productName}"?
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 border-t flex gap-3" style={{
          borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)",
          backgroundColor: isDarkMode ? "#0a0a0a" : "#ffffff"
        }}>
          <button onClick={onClose} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${getTheme(isDarkMode).button.secondary}`}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20">
            Delete Product
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
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center animate-pulse">
            <Check size={32} className="text-green-500" />
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

// ─────────────────────────────────────────────────────────────────────────────
// ProductModal — owns the API call entirely.
// onSave receives the server response (with image_url) so the parent
// never needs to hit the backend again.
// ─────────────────────────────────────────────────────────────────────────────
function ProductModal({ onClose, onSave, editingProduct = null, isDarkMode }) {
  const [form, setForm] = useState(
    editingProduct
      ? {
          name: editingProduct.name,
          price: editingProduct.price,
          category: editingProduct.category,
          stock: editingProduct.stock,
        }
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
  const [error, setError] = useState("");

  const searchImages = async (autoSelect = false) => {
    const q = autoSelect ? form.name : query;
    if (!q.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=6&orientation=landscape`,
        { headers: { Authorization: PEXELS_KEY } }
      );
      const data = await res.json();
      const photos = data.photos || [];
      setImages(photos);
      // Auto-select first image only when creating a new product and none chosen yet
      if (!editingProduct && photos.length > 0 && !selected) {
        setSelected(photos[0]);
      }
    } catch (err) {
      console.error("Pexels Search Error:", err);
    } finally {
      setSearching(false);
    }
  };

  // ── THE FIX: This is the ONLY place the API is called for create/update ──
  const handleSave = async () => {
    if (!form.name || !form.price || !selected) return;
    setSaving(true);
    setError("");
    try {
      const token = ls.getToken();
      const method = editingProduct ? "PUT" : "POST";
      const endpoint = editingProduct
        ? `${API_URL}/products/${editingProduct.id}`
        : `${API_URL}/products/`;

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price),
          stock: parseInt(form.stock),
          category: form.category,
          image_url: selected.src.large, // always included
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to save product");
      }

      const savedProduct = await res.json();
      // Hand the complete server response to the parent — parent only updates UI state
      onSave(savedProduct, !!editingProduct);
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      setError(err.message || "Could not save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: isDarkMode ? "#0d0d0d" : "#f5f5f5",
    border: `1px solid ${isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.15)"}`,
    color: isDarkMode ? "#e8e8e8" : "#1a1a1a",
    padding: "0.75rem 1rem",
    borderRadius: "0.75rem",
    outline: "none",
    fontSize: "0.875rem",
    transition: "border-color 0.15s",
  };
  const labelStyle = {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: isDarkMode ? "#aaa" : "#555",
    display: "block",
    marginBottom: "0.5rem",
  };

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className="flex flex-col md:flex-row">

          {/* Left — form */}
          <div className="flex-1 p-6 space-y-5" style={{ background: isDarkMode ? "#0f0f0f" : "#ffffff" }}>
            <div className="pb-3 border-b" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}>
              <h2 className="text-xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
                {editingProduct ? "Edit Product" : "Add Product"}
              </h2>
              <p className="text-sm mt-1" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
                {editingProduct ? "Update product details" : "Create a new menu item"}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </div>
            )}

            <div>
              <label style={labelStyle}>Product Name</label>
              <input
                type="text"
                placeholder="e.g., Truffle Pasta"
                value={form.name}
                onChange={e => {
                  setForm({ ...form, name: e.target.value });
                  if (!editingProduct) setQuery(e.target.value);
                }}
                style={inputStyle}
                onBlur={() => {
                  if (!editingProduct && form.name && !selected) searchImages(true);
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Price (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Initial Stock</label>
                <input
                  type="number"
                  placeholder="100"
                  value={form.stock}
                  onChange={e => setForm({ ...form, stock: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {["Starters", "Main Course", "Desserts", "Beverages", "Wine & Spirits", "Chef's Specials"].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.08)",
                  color: isDarkMode ? "#FFFFF0" : "#1a1a1a",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name || !form.price || !selected || saving}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{
                  background: form.name && form.price && selected && !saving ? "#002366" : "#ccc",
                  color: "#FFFFF0",
                }}
              >
                {saving && <Loader size={15} className="animate-spin" />}
                {saving ? "Saving..." : editingProduct ? "Update" : "Create"}
              </button>
            </div>
          </div>

          {/* Right — image picker */}
          <div
            className="w-full md:w-96 p-6 border-l"
            style={{
              background: isDarkMode ? "#0a0a0a" : "#fafafa",
              borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)",
            }}
          >
            <label style={labelStyle}>Product Image</label>

            <div
              className="mb-4 rounded-xl overflow-hidden border"
              style={{
                borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.15)",
                background: isDarkMode ? "#111" : "#f5f5f5",
              }}
            >
              {selected ? (
                <img src={selected.src.medium} alt="preview" className="w-full h-40 object-cover" />
              ) : (
                <div className="h-40 flex items-center justify-center">
                  <Package size={32} className="opacity-30" />
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Search for images..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchImages(false)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => searchImages(false)}
                className="px-4 rounded-xl text-sm font-medium"
                style={{ background: "#002366", color: "#FFFFF0" }}
              >
                Search
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {searching ? (
                <div className="col-span-3 flex justify-center py-8">
                  <Loader className="animate-spin" size={24} />
                </div>
              ) : (
                images.map(img => (
                  <div
                    key={img.id}
                    onClick={() => setSelected(img)}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer transition-all hover:opacity-80"
                    style={{
                      border: selected?.id === img.id ? "2px solid #002366" : "2px solid transparent",
                    }}
                  >
                    <img src={img.src.medium} alt="" className="w-full h-full object-cover" />
                  </div>
                ))
              )}
              {!searching && !images.length && (
                <p
                  className="col-span-3 text-center text-sm py-8"
                  style={{ color: isDarkMode ? "rgba(255,255,240,0.4)" : "rgba(0,0,0,0.4)" }}
                >
                  Search for product images above
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard({ product, onEdit, onDelete, isDarkMode }) {
  const status = stockStatus(product.stock ?? 0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div
        className="group rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
        style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          border: `1px solid ${isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"}`,
        }}
      >
        <div className="relative h-48 overflow-hidden" style={{ background: isDarkMode ? "#1a1a1a" : "#f0f0f0" }}>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={48} className="opacity-30" />
            </div>
          )}
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            {status.label}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-base truncate" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
                {product.name}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: isDarkMode ? "rgba(255,255,240,0.5)" : "rgba(0,0,0,0.5)" }}>
                {product.category || "General"}
              </p>
            </div>
            <span className="text-lg font-bold ml-2" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
              ₹{Number(product.price).toLocaleString("en-IN")}
            </span>
          </div>

          <div
            className="flex items-center justify-between mt-3 pt-3 border-t"
            style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}
          >
            <div className="flex items-center gap-1 text-xs" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
              <Package size={12} />
              <span>Stock: {product.stock}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(product)}
                className="p-2 rounded-lg transition-all hover:bg-blue-500/10"
                style={{ color: isDarkMode ? "#FFFFF0" : "#002366" }}
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 rounded-lg transition-all hover:bg-red-500/10 text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setShowDeleteModal(false);
          onDelete(product.id);
        }}
        productName={product.name}
        isDarkMode={isDarkMode}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page — receives onSave result from modal and only mutates local state.
// No second API call anywhere in this file.
// ─────────────────────────────────────────────────────────────────────────────
export default function ProductManagement({
  rawProducts = [],
  categories = [],
  isDarkMode = true,
  onAdd,       // (savedProduct) => void  — parent updates its rawProducts
  onUpdate,    // (savedProduct) => void  — parent updates its rawProducts
  onDelete,    // (id)           => void  — parent updates its rawProducts
}) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showSuccess, setShowSuccess] = useState({ open: false, message: "" });

  const filteredProducts = useMemo(() => {
    // Deduplicate by id (safety net in case parent ever passes dupes)
    const seen = new Set();
    const unique = rawProducts.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    return unique.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === "All" || p.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [rawProducts, search, filterCategory]);

  const allCategories = ["All", ...new Set(rawProducts.map(p => p.category).filter(Boolean))];

  // Called by ProductModal after it successfully POSTs/PUTs to the backend.
  // savedProduct is the full server response including image_url.
  // We just tell the parent to update its state — no extra fetch needed.
  const handleModalSave = (savedProduct, isEdit) => {
    if (isEdit) {
      onUpdate(savedProduct);
      setShowSuccess({ open: true, message: `${savedProduct.name} updated successfully!` });
    } else {
      onAdd(savedProduct);
      setShowSuccess({ open: true, message: `${savedProduct.name} added to the menu!` });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    onDelete(id);
    setShowSuccess({ open: true, message: "Product removed from the menu." });
  };

  return (
    <div className="min-h-full w-full px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
            Product Management
          </h1>
          <p className="text-sm mt-1" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
            {rawProducts.length} total · {filteredProducts.length} shown
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-105"
          style={{ backgroundColor: "#002366", color: "#FFFFF0" }}
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: isDarkMode ? "rgba(255,255,240,0.4)" : "rgba(0,0,0,0.4)" }}
          />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border ${COMMON_STYLES.input(isDarkMode)}`}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filterCategory === cat
                  ? "bg-[#002366] text-white shadow-lg"
                  : isDarkMode
                    ? "bg-[#1a1a1a] text-gray-300 hover:bg-[#002366]/20"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <Package size={64} className="mx-auto mb-4 opacity-30" />
          <p className="text-base" style={{ color: isDarkMode ? "rgba(255,255,240,0.5)" : "rgba(0,0,0,0.5)" }}>
            No products found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <ProductModal
          onClose={() => {
            setModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleModalSave}
          editingProduct={editingProduct}
          isDarkMode={isDarkMode}
        />
      )}

      <SuccessModal
        isOpen={showSuccess.open}
        onClose={() => setShowSuccess({ open: false, message: "" })}
        message={showSuccess.message}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}