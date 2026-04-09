import React, { useState, useMemo } from "react";
import { Search, Plus, Minus, ShoppingCart, Box, AlertTriangle, X, CheckCircle } from "lucide-react";
import { getTheme, COMMON_STYLES, FONTS } from "./theme";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem("auth_token");
  const cleanUrl = url.replace(/([^:]\/)\/+/g, "$1");
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };
  
  const response = await fetch(cleanUrl, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    window.location.reload();
  }
  return response;
};

export default function POSView({
  menu,
  categories,
  cart,
  selectedCategory,
  setSelectedCategory,
  availableTokens,
  selectedToken,
  onSetToken,
  onAddToCart,
  onRemoveFromCart,
  onCheckout,
  isDarkMode,
  discount,
  setDiscount,
  taxRate,
}) {
  const theme = getTheme(isDarkMode);
  const [search, setSearch] = useState("");
  
  // ✅ NEW: State for inventory check modal
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [missingItems, setMissingItems] = useState([]);
  const [isCheckingInventory, setIsCheckingInventory] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null);

  const filteredProducts = useMemo(() => {
    let list = [];
    if (selectedCategory === "All" || !selectedCategory) {
      Object.values(menu).forEach(arr => (list = list.concat(arr)));
    } else {
      list = menu[selectedCategory] || [];
    }
    if (search) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  }, [menu, selectedCategory, search]);

  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = Math.max(0, cartSubtotal - discount) * (taxRate / 100);
  const grandTotal = Math.round(
    Math.max(0, cartSubtotal - discount) + taxAmount
  );

  const getCartQty = id => {
    const item = cart.find(i => i.id === id);
    return item ? item.quantity : 0;
  };

  // ✅ NEW: Check inventory before placing order
  const handleCheckoutWithInventoryCheck = async () => {
    if (cart.length === 0) return;
    
    setIsCheckingInventory(true);
    
    try {
      // Prepare order data for inventory check
      const orderData = {
        total_amount: grandTotal,
        payment_method: "cash", // Temporary, will be updated in final order
        token: parseInt(selectedToken),
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        override_missing_ingredients: false
      };
      
      const response = await apiRequest(`${API_URL}/orders/check-inventory`, {
        method: "POST",
        body: JSON.stringify(orderData),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.can_fulfill) {
          // All ingredients available - proceed directly
          proceedToCheckout(false);
        } else {
          // Missing ingredients - show modal
          setMissingItems(result.missing_items);
          setShowInventoryModal(true);
          setPendingOrderData(orderData);
        }
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to check inventory");
        // Fallback: proceed without check
        proceedToCheckout(false);
      }
    } catch (error) {
      console.error("Inventory check failed:", error);
      // Fallback: proceed without check
      proceedToCheckout(false);
    } finally {
      setIsCheckingInventory(false);
    }
  };

  // ✅ NEW: Proceed to checkout with or without override
  const proceedToCheckout = (overrideMissing) => {
    if (pendingOrderData) {
      // Use the stored order data with override flag
      const finalOrderData = {
        ...pendingOrderData,
        override_missing_ingredients: overrideMissing
      };
      onCheckout(finalOrderData);
      setPendingOrderData(null);
    } else {
      // Normal checkout without pre-check
      onCheckout(false);
    }
    setShowInventoryModal(false);
    setMissingItems([]);
  };

  return (
    <div
      className={`flex h-full transition-colors duration-300 ${theme.bg.main} ${theme.text.main}`}
      style={{ fontFamily: FONTS.sans }}
    >
      {/* LEFT: PRODUCTS */}
      <div className={`flex-1 flex flex-col border-r ${theme.border.default}`}>
        {/* SEARCH + CATEGORY */}
        <div className={`p-3 space-y-2 border-b ${theme.border.default} ${theme.bg.card}`}>
          <input
            className={COMMON_STYLES.input(isDarkMode)}
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? theme.button.primary
                    : theme.button.secondary
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* PRODUCT GRID */}
        <div className="flex-1 overflow-auto p-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 content-start">
          {filteredProducts.map(p => {
            const qty = getCartQty(p.id);
            return (
              <div
                key={p.id}
                className={`${COMMON_STYLES.card(isDarkMode)} h-[105px] p-3 flex flex-col justify-between hover:border-blue-500 transition-all`}
              >
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-40">{p.category}</p>
                  <h3 className="text-sm font-semibold leading-tight line-clamp-1">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] opacity-50 mt-1">
                    <Box size={10} />
                    <span>{p.stock}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold">₹{p.price}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onRemoveFromCart(p)}
                      className={`p-1 rounded-md transition-colors ${theme.bg.subtle} hover:bg-red-500/20 text-red-500`}
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{qty}</span>
                    <button
                      disabled={p.stock <= 0}
                      onClick={() => onAddToCart(p)}
                      className={`p-1 rounded-md transition-colors ${theme.bg.subtle} hover:bg-green-500/20 text-green-500 disabled:opacity-20`}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: CART PANEL */}
      <div className={`w-84 flex flex-col border-l ${theme.border.default} ${theme.bg.card} transition-colors duration-300`}>
        {/* HEADER */}
        <div className={`p-4 flex justify-between items-center border-b ${theme.border.default}`}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-blue-500" />
            <span className="font-bold">Current Cart</span>
          </div>
          <select
            value={selectedToken}
            onChange={e => onSetToken(e.target.value)}
            className={`text-sm px-2 py-1 rounded border ${theme.bg.main} ${theme.border.default} outline-none`}
          >
            {availableTokens.map(t => (
              <option key={t}>Token {t}</option>
            ))}
          </select>
        </div>

        {/* CART ITEMS */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <ShoppingCart size={48} strokeWidth={1} />
              <p className="text-xs font-bold uppercase mt-2">Empty Cart</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${theme.border.default} ${theme.bg.subtle}`}>
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs opacity-50">₹{item.price} × {item.quantity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onRemoveFromCart(item)} className="p-1.5 rounded-md bg-zinc-500/10 hover:bg-zinc-500/20 transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="font-bold text-xs">{item.quantity}</span>
                  <button onClick={() => onAddToCart(item)} className="p-1.5 rounded-md bg-zinc-500/10 hover:bg-zinc-500/20 transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* TOTALS */}
        <div className={`p-4 border-t ${theme.border.default} space-y-3 bg-zinc-500/5`}>
          <div className="space-y-1">
            <div className="flex justify-between text-xs opacity-60">
              <span>Subtotal</span>
              <span>₹{cartSubtotal}</span>
            </div>
            <div className="flex justify-between text-xs opacity-60">
              <span>GST (5%)</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="font-bold">Payable Amount</span>
            <span className="text-xl font-black text-blue-500">₹{grandTotal}</span>
          </div>
          <button
            disabled={cart.length === 0 || isCheckingInventory}
            onClick={handleCheckoutWithInventoryCheck}
            className={`${theme.button.primary} w-full py-3 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-transform active:scale-95 disabled:opacity-30 disabled:grayscale`}
          >
            {isCheckingInventory ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking Inventory...
              </div>
            ) : (
              "Confirm Order"
            )}
          </button>
        </div>
      </div>

      {/* ✅ NEW: INVENTORY OVERRIDE MODAL */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.card(isDarkMode)}`}>
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-center gap-3`} style={{
              backgroundColor: isDarkMode ? "#111111" : "#fef2f2",
              borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(220,38,38,0.2)"
            }}>
              <div className="p-2 rounded-full bg-red-500/10">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#991b1b" }}>
                  Insufficient Ingredients
                </h3>
                <p className="text-sm mt-0.5" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
                  Some items are low on ingredients. Continuing may affect preparation.
                </p>
              </div>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            {/* Missing Items List */}
            <div className="p-5 max-h-80 overflow-y-auto">
              <p className="text-sm font-medium mb-3" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
                Missing Items:
              </p>
              <div className="space-y-3">
                {missingItems.map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${isDarkMode ? "border-red-500/20 bg-red-500/5" : "border-red-200 bg-red-50"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
                          {item.product_name}
                        </p>
                        <p className="text-xs mt-1" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
                          Ingredient: {item.ingredient_name}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span style={{ color: isDarkMode ? "rgba(255,255,240,0.5)" : "rgba(0,0,0,0.5)" }}>
                            Required: {item.required_quantity.toFixed(2)} {item.unit}
                          </span>
                          <span style={{ color: isDarkMode ? "rgba(255,255,240,0.5)" : "rgba(0,0,0,0.5)" }}>
                            Available: {item.available_stock} {item.unit}
                          </span>
                          <span className="font-bold text-red-500">
                            Shortfall: {item.shortfall.toFixed(2)} {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className={`p-5 border-t flex gap-3`} style={{
              borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,0,0,0.08)",
              backgroundColor: isDarkMode ? "#111111" : "#fafafa"
            }}>
              <button
                onClick={() => setShowInventoryModal(false)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${theme.button.secondary}`}
              >
                Cancel Order
              </button>
              <button
                onClick={() => proceedToCheckout(true)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-lg flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                }}
              >
                <CheckCircle size={16} />
                Continue Anyway (Override)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}