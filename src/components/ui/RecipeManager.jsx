// Updated RecipeManager.jsx - Close button moved below Add to Recipe button
import React, { useEffect, useState } from "react";
import { 
  Plus, Trash2, Pencil, Check, X, Package, 
  AlertCircle, Loader, Search, BookOpen, 
  ChefHat, Scale, Zap, ArrowLeft
} from "lucide-react";
import { getTheme, COMMON_STYLES } from "./theme";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Delete Confirmation Modal
function DeleteConfirmModal({ isOpen, onClose, onConfirm, ingredientName, productName, isDarkMode }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className={`p-5 border-b flex items-center gap-3`} style={{
          backgroundColor: isDarkMode ? "#111111" : "#fafafa",
          borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)"
        }}>
          <div className="p-2 rounded-full bg-red-500/10">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
              Remove Ingredient
            </h3>
            <p className="text-sm mt-0.5" style={{ color: isDarkMode ? "rgba(255,255,240,0.7)" : "rgba(0,0,0,0.7)" }}>
              Remove "{ingredientName}" from "{productName}" recipe?
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
            Remove
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

export default function RecipeManager({ apiRequest, isDarkMode, products }) {
  const theme = getTheme(isDarkMode);
  const [ingredients, setIngredients] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recipe, setRecipe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingQty, setEditingQty] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchProduct, setSearchProduct] = useState("");
  const [showSuccess, setShowSuccess] = useState({ open: false, message: "" });
  const [newEntry, setNewEntry] = useState({ ingredient_id: "", quantity_required: "" });
  const [error, setError] = useState(null);

  const fetchIngredients = async () => {
    try {
      const res = await apiRequest(`${API_URL}/ingredients/`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load ingredients");
      setIngredients(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchRecipe = async (productId) => {
    if (!productId) return;
    try {
      setLoading(true);
      const res = await apiRequest(`${API_URL}/recipes/product/${productId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch recipe");
      setRecipe(data);
    } catch (err) {
      setError(err.message);
      setRecipe([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIngredients(); }, []);
  useEffect(() => { if (selectedProduct) fetchRecipe(selectedProduct); }, [selectedProduct]);

  const handleAddRecipe = async () => {
    if (!selectedProduct) { 
      setShowSuccess({ open: true, message: "Please select a product first!" });
      return; 
    }
    const qty = parseFloat(newEntry.quantity_required);
    if (!newEntry.ingredient_id || isNaN(qty) || qty <= 0) {
      setShowSuccess({ open: true, message: "Please enter a valid quantity greater than 0" });
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiRequest(`${API_URL}/recipes/`, {
        method: "POST",
        body: JSON.stringify({
          product_id: Number(selectedProduct),
          ingredient_id: Number(newEntry.ingredient_id),
          quantity_required: qty
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to add recipe");
      setNewEntry({ ingredient_id: "", quantity_required: "" });
      fetchRecipe(selectedProduct);
      setShowSuccess({ open: true, message: "Ingredient added to recipe!" });
    } catch (err) { 
      setShowSuccess({ open: true, message: err.message });
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiRequest(`${API_URL}/recipes/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete recipe");
      setRecipe((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      setShowSuccess({ open: true, message: "Ingredient removed from recipe!" });
    } catch (err) { 
      setShowSuccess({ open: true, message: err.message });
    }
  };

  const saveEdit = async (recipeId) => {
    const qty = parseFloat(editingQty);
    if (isNaN(qty) || qty <= 0) { 
      setShowSuccess({ open: true, message: "Quantity must be greater than 0" });
      return; 
    }
    try {
      const res = await apiRequest(`${API_URL}/recipes/${recipeId}`, {
        method: "PUT",
        body: JSON.stringify({
          product_id: Number(selectedProduct),
          ingredient_id: recipe.find((r) => r.id === recipeId).ingredient_id,
          quantity_required: qty
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Update failed");
      setRecipe((prev) => prev.map((r) => r.id === recipeId ? { ...r, quantity_required: editingQty } : r));
      setEditingId(null);
      setShowSuccess({ open: true, message: "Quantity updated!" });
    } catch (err) { 
      setShowSuccess({ open: true, message: err.message });
    }
  };

  const handleClearSelectedProduct = () => {
    setSelectedProduct(null);
    setRecipe([]);
    setSearchProduct("");
  };

  const getIngredientName = (id) => {
    const ing = ingredients.find((i) => i.id === id);
    return ing ? ing.name : "Unknown";
  };

  const getIngredientUnit = (id) => {
    const ing = ingredients.find((i) => i.id === id);
    return ing ? ing.unit : "";
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <div className="min-h-full w-full px-6 py-6">
      {/* Hero Section - Header color now based on theme */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
              Recipe Management
            </h1>
            <p className="text-sm mt-1" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
              Define ingredients and quantities for each menu item
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#002366]/10 transition-all duration-300 hover:scale-110">
              <ChefHat size={20} className="text-[#002366]" />
            </div>
            <span className="text-sm font-medium" style={{ color: isDarkMode ? "#FFFFF0" : "#333" }}>Recipe Builder</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-6 text-sm border border-red-500/20">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="group relative p-5 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#002366]/50" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#002366]/10 to-transparent rounded-full -mr-10 -mt-10 transition-all duration-500 group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Total Products</p>
              <p className="text-3xl font-bold mt-1" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>{products.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#002366]/10 group-hover:bg-[#002366]/20 transition-all duration-300 group-hover:scale-110">
              <Package size={24} className="text-[#002366]" />
            </div>
          </div>
        </div>

        <div className="group relative p-5 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-green-500/50" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-10 -mt-10 transition-all duration-500 group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Available Ingredients</p>
              <p className="text-3xl font-bold mt-1 text-green-500">{ingredients.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-all duration-300 group-hover:scale-110">
              <Scale size={24} className="text-green-500" />
            </div>
          </div>
        </div>

        <div className="group relative p-5 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-orange-500/50" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-10 -mt-10 transition-all duration-500 group-hover:scale-150" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Current Recipe Items</p>
              <p className="text-3xl font-bold mt-1 text-orange-500">{recipe.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-all duration-300 group-hover:scale-110">
              <Zap size={24} className="text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection Section */}
      <div className={`rounded-2xl border p-6 mb-8 transition-all duration-300 hover:shadow-xl hover:border-[#002366]/30`} style={{
        backgroundColor: isDarkMode ? "#111111" : "#ffffff",
        borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
      }}>
        <div className="flex items-center gap-2 mb-5 pb-3 border-b transition-all duration-300" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}>
          <div className="p-2 rounded-lg bg-[#002366]/10 transition-all duration-300 hover:scale-110">
            <Search size={18} className="text-[#002366]" />
          </div>
          <h2 className="text-lg font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>Select Product</h2>
        </div>
        
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: isDarkMode ? "rgba(255,255,240,0.4)" : "rgba(0,0,0,0.4)" }} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:border-[#002366] ${COMMON_STYLES.input(isDarkMode)}`}
            style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}
          />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredProducts.slice(0, 12).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProduct(p.id)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 text-left transform hover:scale-105 ${
                selectedProduct === p.id
                  ? "bg-[#002366] text-white shadow-lg shadow-[#002366]/20"
                  : isDarkMode 
                    ? "bg-[#1a1a1a] text-gray-300 hover:bg-[#002366]/20 border border-transparent hover:border-[#002366]/30" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2">
                <Package size={14} />
                <span className="truncate">{p.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedProduct && (
        <>
          {/* Product Info Bar */}
          <div className={`rounded-2xl border p-5 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 hover:shadow-xl hover:border-[#002366]/30`} style={{
            backgroundColor: isDarkMode ? "#0a0a0a" : "#fafafa",
            borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)"
          }}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#002366]/10 transition-all duration-300 hover:scale-110">
                <ChefHat size={28} className="text-[#002366]" />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
                  {selectedProductData?.name}
                </h3>
                <p className="text-sm mt-0.5" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>Recipe Configuration</p>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add Ingredient Form */}
            <div className={`rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl hover:border-[#002366]/30`} style={{
              backgroundColor: isDarkMode ? "#111111" : "#ffffff",
              borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
            }}>
              <div className="flex items-center gap-2 mb-5 pb-3 border-b transition-all duration-300" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}>
                <div className="p-2 rounded-lg bg-green-500/10 transition-all duration-300 hover:scale-110">
                  <Plus size={18} className="text-green-500" />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>Add Ingredient</h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium uppercase mb-1.5 block" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Select Ingredient</label>
                  <select
                    className={COMMON_STYLES.select(isDarkMode)}
                    style={{ padding: "1rem 1.2rem", fontSize: "0.95rem", color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}
                    value={newEntry.ingredient_id}
                    onChange={(e) => setNewEntry({ ...newEntry, ingredient_id: e.target.value })}
                  >
                    <option value="">Choose an ingredient</option>
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase mb-1.5 block" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Quantity Required</label>
                  <input
                    type="number"
                    placeholder="e.g., 0.5"
                    step="any"
                    min="0.01"
                    className={COMMON_STYLES.input(isDarkMode)}
                    style={{ padding: "1rem 1.2rem", fontSize: "0.95rem", color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}
                    value={newEntry.quantity_required}
                    onChange={(e) => setNewEntry({ ...newEntry, quantity_required: e.target.value })}
                  />
                </div>

                <button
                  onClick={handleAddRecipe}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2 text-white"
                  style={{ backgroundColor: "#002366" }}
                >
                  {submitting ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />}
                  Add to Recipe
                </button>

                {/* Close Recipe Button - Now below Add to Recipe button */}
                <button
                  onClick={handleClearSelectedProduct}
                  className="w-full py-3.5 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2 mt-2"
                  style={{
                    backgroundColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,0,0,0.08)",
                    color: isDarkMode ? "#FFFFF0" : "#1a1a1a",
                    border: `1px solid ${isDarkMode ? "rgba(255,255,240,0.2)" : "rgba(0,0,0,0.1)"}`
                  }}
                >
                  <ArrowLeft size={16} />
                  Close Recipe
                </button>
              </div>
            </div>

            {/* Recipe List */}
            <div className="lg:col-span-2 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#002366]/30" style={{
              backgroundColor: isDarkMode ? "#111111" : "#ffffff",
              borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
            }}>
              <div className="grid grid-cols-12 gap-4 p-4 border-b transition-all duration-300" style={{
                backgroundColor: isDarkMode ? "#0a0a0a" : "#fafafa",
                borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)"
              }}>
                <div className="col-span-6 text-xs font-bold uppercase tracking-wider" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Ingredient</div>
                <div className="col-span-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Quantity</div>
                <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-right" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Actions</div>
              </div>

              <div className="divide-y transition-all duration-300" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}>
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader className="animate-spin" size={32} style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }} />
                  </div>
                ) : recipe.length === 0 ? (
                  <div className="text-center py-20">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-30" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }} />
                    <p className="text-sm opacity-60" style={{ color: isDarkMode ? "#aaa" : "#666" }}>No ingredients added to this recipe yet</p>
                    <p className="text-xs opacity-40 mt-2" style={{ color: isDarkMode ? "#aaa" : "#666" }}>Select ingredients from the left panel</p>
                  </div>
                ) : (
                  recipe.map((r) => (
                    <div key={r.id} className="group relative grid grid-cols-12 gap-4 p-4 items-center transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5">
                      <div className="col-span-6">
                        <p className="font-semibold text-base" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>{getIngredientName(r.ingredient_id)}</p>
                        <p className="text-xs mt-0.5" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>Unit: {getIngredientUnit(r.ingredient_id)}</p>
                      </div>
                      <div className="col-span-4 text-right">
                        {editingId === r.id ? (
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            className={`w-32 text-right ${COMMON_STYLES.input(isDarkMode)}`}
                            value={editingQty}
                            onChange={(e) => setEditingQty(e.target.value)}
                            style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}
                          />
                        ) : (
                          <span className="font-mono font-bold text-lg" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
                            {r.quantity_required} <span className="text-sm" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>{getIngredientUnit(r.ingredient_id)}</span>
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 flex justify-end gap-2">
                        {editingId === r.id ? (
                          <>
                            <button 
                              onClick={() => saveEdit(r.id)} 
                              className="p-2 rounded-lg transition-all duration-300 hover:bg-green-500/10 text-green-500 hover:scale-110"
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)} 
                              className="p-2 rounded-lg transition-all duration-300 hover:bg-gray-500/10 text-gray-500 hover:scale-110"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => { setEditingId(r.id); setEditingQty(r.quantity_required); }} 
                              className="p-2 rounded-lg transition-all duration-300 hover:bg-blue-500/10 text-blue-500 hover:scale-110"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={() => setDeleteTarget(r)} 
                              className="p-2 rounded-lg transition-all duration-300 hover:bg-red-500/10 text-red-500 hover:scale-110"
                              title="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* No Product Selected State */}
      {!selectedProduct && products.length > 0 && (
        <div className="text-center py-20 rounded-2xl border-2 border-dashed transition-all duration-300 hover:border-[#002366]/50" style={{
          backgroundColor: isDarkMode ? "#0a0a0a" : "#fafafa",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.15)"
        }}>
          <ChefHat size={64} className="mx-auto mb-4 opacity-30" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }} />
          <p className="text-lg font-medium mb-2" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
            Select a Product to Configure Recipe
          </p>
          <p className="text-sm" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>Choose a product from the list above to define its ingredients</p>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          ingredientName={getIngredientName(deleteTarget.ingredient_id)}
          productName={selectedProductData?.name}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess.open}
        onClose={() => setShowSuccess({ open: false, message: "" })}
        message={showSuccess.message}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}