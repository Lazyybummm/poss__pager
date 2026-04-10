import React, { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Edit2,
  ImageIcon,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { COMMON_STYLES, FONTS, getTheme } from "./theme";

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";

function StatCard({ label, value, sub, isDarkMode, theme }) {
  return (
    <div className={`${COMMON_STYLES.card(isDarkMode)} p-5 flex flex-col gap-3 shadow-sm`}>
      <span className={`text-xs font-semibold uppercase tracking-widest ${theme.text.tertiary}`}>{label}</span>
      <div>
        <p className={`text-3xl font-black tracking-tight ${theme.text.main}`}>{value}</p>
        {sub && <p className={`text-xs mt-0.5 ${theme.text.muted}`}>{sub}</p>}
      </div>
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete, isDarkMode, theme }) {
  const lowStock = product.stock <= 5;

  return (
    <div className={`group rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${COMMON_STYLES.card(isDarkMode)}`}>
      <div className="relative h-44 overflow-hidden">
        <img
          src={product.image || PLACEHOLDER_IMG}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.src = PLACEHOLDER_IMG;
          }}
        />
        <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${theme.bg.subtle} text-[#FFFFF0] ${theme.border.default}`}>
          {product.category}
        </span>
        {lowStock && (
          <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm flex items-center gap-1 ${theme.bg.subtle} ${theme.text.highlight} ${theme.border.default}`}>
            <AlertTriangle size={9} />
            Low stock
          </span>
        )}
        <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          <button
            onClick={() => onEdit(product)}
            className={`w-8 h-8 rounded-lg backdrop-blur-sm border flex items-center justify-center transition-colors ${theme.button.icon}`}
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className={`w-8 h-8 rounded-lg backdrop-blur-sm border flex items-center justify-center transition-colors ${theme.button.icon}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-bold text-base leading-tight ${theme.text.main}`}>{product.name}</p>
          <p className={`font-black text-lg shrink-0 ${theme.text.highlight}`}>₹{product.price}</p>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${theme.text.tertiary}`}>Stock</span>
            <span className={`text-xs font-bold ${lowStock ? theme.text.highlight : theme.text.secondary}`}>
              {product.stock} units
            </span>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-[#1a1a1a]" : "bg-neutral-100"}`}>
            <div
              className={`h-full rounded-full transition-all duration-700 ${theme.bg.subtle}`}
              style={{ width: `${Math.min((product.stock / 50) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductManagement({
  rawProducts,
  categories,
  isDarkMode,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const theme = getTheme(isDarkMode);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [form, setForm] = useState({
    id: null,
    name: "",
    price: "",
    stock: "",
    category: "",
    image: "",
  });

  const resetForm = () => {
    setForm({ id: null, name: "", price: "", stock: "", category: "", image: "" });
    setPanelOpen(false);
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    if (!form.name || form.price === "" || !form.category) {
      alert("Fill required fields");
      return;
    }

    const priceNum = parseFloat(form.price);
    const stockNum = parseInt(form.stock);

    if (isNaN(priceNum) || priceNum < 0) {
      alert("Price cannot be negative");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      alert("Stock cannot be negative");
      return;
    }

    if (isEditing) await onUpdate(form);
    else await onAdd(form);

    resetForm();
  };

  const startEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name || "",
      price: product.price !== undefined && product.price !== null ? product.price.toString() : "",
      stock: product.stock !== undefined && product.stock !== null ? product.stock.toString() : "0",
      category: product.category || "",
      image: product.image || "",
    });
    setIsEditing(true);
    setPanelOpen(true);
  };

  const filtered = useMemo(() => {
    return rawProducts.filter((product) => {
      const matchSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === "all" || product.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [rawProducts, search, filterCat]);

  const uniqueCats = [...new Set(rawProducts.map((product) => product.category))].length;

  const Field = ({ label, children }) => (
    <div>
      <label className={`text-[10px] font-bold uppercase tracking-widest block mb-1.5 ${theme.text.tertiary}`}>
        {label}
      </label>
      {children}
    </div>
  );

  const inputCls = COMMON_STYLES.input(isDarkMode);
  const selectCls = COMMON_STYLES.select(isDarkMode);

  return (
    <div className={`min-h-screen relative ${theme.bg.main} ${theme.text.main}`} style={{ fontFamily: FONTS.sans }}>
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-1 ${theme.text.tertiary}`}>Restaurant POS</p>
            <h1 className={`text-4xl font-black tracking-tight ${theme.text.main}`}>Menu Items</h1>
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              setForm({ id: null, name: "", price: "", stock: "", category: "", image: "" });
              setPanelOpen(true);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold ${theme.button.primary} ${theme.ring(isDarkMode)} transition-all hover:scale-105 active:scale-95`}
          >
            <Plus size={16} />
            New Item
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <StatCard label="Total Items" value={rawProducts.length} sub="in menu" isDarkMode={isDarkMode} theme={theme} />
          <StatCard label="Categories" value={uniqueCats} sub="distinct" isDarkMode={isDarkMode} theme={theme} />
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border flex-1 min-w-45 ${COMMON_STYLES.card(isDarkMode)}`}>
            <Search size={14} className={theme.text.tertiary} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className={`bg-transparent text-sm outline-none flex-1 ${theme.text.main} ${theme.text.placeholder}`}
            />
          </div>

          <div className={`relative flex items-center rounded-xl border px-3 py-2.5 gap-2 ${COMMON_STYLES.card(isDarkMode)}`}>
            <Tag size={14} className={theme.text.highlight} />
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="bg-black text-[#FFFFF0] text-sm outline-none pr-4 appearance-none"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className={`absolute right-3 pointer-events-none ${theme.text.tertiary}`} />
          </div>

          <div className={`px-4 py-2.5 rounded-xl border text-sm font-medium ${COMMON_STYLES.card(isDarkMode)} ${theme.text.secondary}`}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={startEdit}
              onDelete={onDelete}
              isDarkMode={isDarkMode}
              theme={theme}
            />
          ))}

          {filtered.length === 0 && (
            <div className={`col-span-full text-center py-20 rounded-2xl border border-dashed ${theme.border.default} ${theme.text.secondary}`}>
              <ImageIcon size={32} className={`mx-auto mb-3 ${theme.text.muted}`} />
              <p className="font-semibold">No items found</p>
              <p className="text-xs mt-1">Try a different search or category</p>
            </div>
          )}
        </div>
      </div>

      {panelOpen && <div className={`fixed inset-0 ${theme.bg.overlay} z-40`} onClick={resetForm} />}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col ${COMMON_STYLES.modal(isDarkMode)} transition-transform duration-300 ease-out ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className={`flex items-center justify-between p-6 border-b ${theme.border.default}`}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.text.tertiary}`}>{isEditing ? "Edit Item" : "New Item"}</p>
            <h3 className={`text-xl font-black ${theme.text.main}`}>{isEditing ? form.name || "Edit Product" : "Add to Menu"}</h3>
          </div>
          <button onClick={resetForm} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${theme.button.icon}`}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className={`relative h-48 rounded-2xl overflow-hidden border ${theme.border.default}`}>
            <img
              src={form.image || PLACEHOLDER_IMG}
              alt="preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = PLACEHOLDER_IMG;
              }}
            />
            <div className={`absolute inset-0 ${theme.bg.overlay}`} />
            <div className="absolute bottom-3 left-3 right-3">
              <Field label="Image URL (optional)">
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://…"
                  className={`${inputCls} bg-transparent ${theme.text.main}`}
                />
              </Field>
            </div>
          </div>

          <Field label="Item Name *">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Paneer Tikka"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (₹) *">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                className={inputCls}
              />
            </Field>

            <Field label="Stock *">
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="0"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Category *">
            <input
              list="cat-opts"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Starters"
              className={selectCls}
            />
            <datalist id="cat-opts">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className={`p-6 border-t flex gap-3 ${theme.border.default}`}>
          <button onClick={resetForm} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${theme.button.secondary}`}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={parseFloat(form.price) < 0 || parseInt(form.stock) < 0 || !form.name || !form.category}
            className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${theme.button.primary} hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale disabled:hover:scale-100`}
          >
            {isEditing ? <Check size={15} /> : <Plus size={15} />}
            {isEditing ? "Update Item" : "Add to Menu"}
          </button>
        </div>
      </div>
    </div>
  );
}