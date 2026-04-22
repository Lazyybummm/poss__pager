import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Plus, Minus, ShoppingCart, ArrowRight, X, Loader, AlertCircle, Info, Trash2 } from "lucide-react";
import { getTheme, COMMON_STYLES, FONTS } from "../shared/theme";
// Internal lightweight placeholder aligned with Level 2 Surface
const PlaceholderImg = () => (
  <div className="w-full h-full bg-[#121a23] flex items-center justify-center">
    <div className="w-4 h-4 border border-[#3d4958]/20 rotate-45" />
  </div>
);

// Product Card Component with Minimalist Indicators
const ProductCard = ({ product, qty, onAddToCart, onRemoveFromCart, isDarkMode, userRole, theme }) => {
  const isCashier = userRole === "cashier";
  const hasNoRecipe = !product.has_recipe;
  const hasLowIngredients = product.ingredients_below_threshold === true;
  
  return (
    <div 
      className={`flex flex-col sm:flex-row p-2 gap-2 cursor-pointer group active:scale-[0.98] ${COMMON_STYLES.card(isDarkMode)} ${theme.bg.card} ${theme.bg.hover} relative`}
      onClick={() => onAddToCart(product)}
    >
      {/* Image & Qty */}
      <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start gap-2 w-full sm:w-10 md:w-12 shrink-0 relative">
        <div className={`w-10 h-10 md:w-12 md:h-12 shrink-0 overflow-hidden relative rounded-sm ${theme.bg.subtle}`}>
          {(product.image_url || product.image) ? (
            <img 
              alt={product.name} 
              loading="lazy" 
              className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0" 
              src={product.image_url || product.image} 
            />
          ) : <PlaceholderImg />}
          {qty > 0 && <div className="absolute inset-0 border-2 border-[#c0c1ff]/50 pointer-events-none" />}
        </div>
        
        {/* Quantity Controls */}
        <div className="flex items-center justify-between w-[70px] sm:w-full px-0.5">
          <button onClick={(e) => { e.stopPropagation(); onRemoveFromCart(product); }} className={`flex items-center justify-center p-1 sm:p-0 ${theme.text.muted} hover:${theme.text.main}`}>
            <Minus size={12} />
          </button>
          <span className={`text-[10px] font-bold ${qty > 0 ? theme.text.primary : theme.text.main}`}>{qty}</span>
          <button onClick={(e) => { e.stopPropagation(); onAddToCart(product); }} className={`flex items-center justify-center p-1 sm:p-0 ${theme.text.muted} hover:${theme.text.main}`}>
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col justify-start overflow-hidden text-left w-full py-0.5">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[8px] font-bold uppercase tracking-[0.05em] mb-0.5 ${theme.text.muted}`}>{product.category}</span>
          
          {/* Minimalist Status Indicators Row */}
          <div className="flex items-center gap-1.5">
            {/* 🔴 RED DOT - No Recipe (Only for Cashier) */}
            {isCashier && hasNoRecipe && (
              <div className="relative group/dot">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></div>
                <div className="absolute right-0 top-4 opacity-0 invisible group-hover/dot:opacity-100 group-hover/dot:visible transition-all duration-200 z-50 pointer-events-none">
                  <div className="bg-gray-900 text-white text-[9px] font-medium rounded-md px-2 py-1 whitespace-nowrap shadow-lg border border-gray-700">
                    <div className="absolute -top-1 right-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                    ⚠️ Recipe not defined
                  </div>
                </div>
              </div>
            )}
            
            {/* 🟡 YELLOW DOT - Ingredients Below Threshold */}
            {hasLowIngredients && (
              <div className="relative group/dot">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50 animate-pulse"></div>
                <div className="absolute right-0 top-4 opacity-0 invisible group-hover/dot:opacity-100 group-hover/dot:visible transition-all duration-200 z-50 pointer-events-none">
                  <div className="bg-gray-900 text-white text-[9px] font-medium rounded-md px-2 py-1 whitespace-nowrap shadow-lg border border-gray-700">
                    <div className="absolute -top-1 right-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                    ⚠️ Some ingredients below threshold
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <h3 className={`font-bold text-[10px] md:text-[11px] leading-tight line-clamp-2 ${theme.text.main}`}>{product.name}</h3>
        <p className={`text-[10px] md:text-[11px] font-mono font-bold mt-auto pt-1 ${theme.text.main}`}>₹{product.price}</p>
      </div>
    </div>
  );
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
  discount = 0,
  setDiscount,
  taxRate = 5,
  userRole,
}) {
  const theme = getTheme(isDarkMode);
  const [search, setSearch] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPOSScreen, setIsPOSScreen] = useState(false);

  // Inventory Check State
  const [isCheckingInventory, setIsCheckingInventory] = useState(false);
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const [missingItems, setMissingItems] = useState([]);

  // ✅ Store override flag so we can pass it to onCheckout after dialog resolves
  const [pendingOverride, setPendingOverride] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsPOSScreen(window.innerWidth <= 1024 && window.innerHeight <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(timer);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    let list = [];
    const catKeys = (selectedCategory === "All" || !selectedCategory) 
      ? Object.keys(menu) 
      : [selectedCategory];
    
    catKeys.forEach(key => {
      if (menu[key]) list = list.concat(menu[key]);
    });

    if (search) {
      const s = search.toLowerCase();
      return list.filter(p => p.name.toLowerCase().includes(s));
    }
    return list;
  }, [menu, selectedCategory, search]);

  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = Math.max(0, cartSubtotal - discount) * (taxRate / 100);
  const grandTotal = Math.round(Math.max(0, cartSubtotal - discount) + taxAmount);
  const totalItemsInCart = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getCartQty = useCallback((id) => {
    const item = cart.find(i => i.id === id);
    return item ? item.quantity : 0;
  }, [cart]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    try {
      setIsCheckingInventory(true);
      
      const payload = {
        total_amount: grandTotal,
        payment_method: "cash",
        token: parseInt(selectedToken) || 1,
        override_missing_ingredients: false,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        }))
      };

      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_URL}/orders/check-inventory`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        // ✅ Inventory check API itself failed — still show payment portal normally
        console.error("Inventory check failed:", data);
        onCheckout();
        setIsCartOpen(false);
        return;
      }
      
      if (data.can_fulfill === false && data.missing_items && data.missing_items.length > 0) {
        // ✅ Missing ingredients found — show dialog, do NOT proceed yet
        setMissingItems(data.missing_items);
        setPendingOverride(false);
        setShowMissingDialog(true);
        setIsCheckingInventory(false);
        return;
      }
      
      // ✅ Inventory is fine — proceed to payment portal normally
      onCheckout();
      setIsCartOpen(false);
    } catch (err) {
      // ✅ Network error — still show payment portal
      console.error("Inventory check failed, proceeding normally:", err);
      onCheckout();
      setIsCartOpen(false);
    } finally {
      setIsCheckingInventory(false);
    }
  };

  const handleRemoveAffected = () => {
    // Remove all affected products from cart
    const affectedProductNames = [...new Set(missingItems.map(item => item.product_name))];
    const affectedIds = cart.filter(item => 
      affectedProductNames.some(name => item.name.toLowerCase().includes(name.toLowerCase()))
    ).map(item => item.id);
    
    affectedIds.forEach(id => {
      const itemInCart = cart.find(c => c.id === id);
      if (itemInCart) {
        for (let i = 0; i < itemInCart.quantity; i++) {
          onRemoveFromCart(itemInCart);
        }
      }
    });

    setShowMissingDialog(false);

    // ✅ After removing affected items, proceed to payment portal for remaining items
    // Small timeout to let cart state update before proceeding
    setTimeout(() => {
      onCheckout();
      setIsCartOpen(false);
    }, 100);
  };

  const handleContinueAnyway = () => {
    setShowMissingDialog(false);

    // ✅ Proceed to payment portal with override flag — NOT directly to kitchen
    onCheckout({ override_missing_ingredients: true });
    setIsCartOpen(false);
  };

  const isCashier = userRole === "cashier";

  // Cart Item Component
  const CartItem = ({ item, onAdd, onRemove }) => (
    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 hover:shadow-md ${theme.border.default} ${theme.bg.card}`}>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${theme.text.main}`}>{item.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-mono ${theme.text.muted}`}>₹{item.price}</span>
          <span className={`text-[10px] font-mono ${theme.text.muted}`}>×</span>
          <span className={`text-[10px] font-mono ${theme.text.muted}`}>{item.quantity}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onRemove(item)}
          className="p-1.5 rounded-lg transition-all duration-200 hover:bg-red-500/10 text-red-500 hover:scale-110"
          aria-label="Decrease quantity"
        >
          <Minus size={16} />
        </button>
        <span className={`w-6 text-center font-bold text-sm ${theme.text.main}`}>{item.quantity}</span>
        <button
          onClick={() => onAdd(item)}
          className="p-1.5 rounded-lg transition-all duration-200 hover:bg-green-500/10 text-green-500 hover:scale-110"
          aria-label="Increase quantity"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => {
            for (let i = 0; i < item.quantity; i++) {
              onRemove(item);
            }
          }}
          className="p-1.5 rounded-lg transition-all duration-200 hover:bg-red-500/10 text-red-500 hover:scale-110 ml-1"
          aria-label="Remove item completely"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`relative flex h-full w-full overflow-hidden ${isPOSScreen ? 'md:pb-6' : ''} ${theme.bg.main} ${theme.text.main}`} style={{ fontFamily: FONTS.sans }}>
      
      {/* LEFT: PRODUCTS AREA */}
      <div className={`flex-1 flex flex-col border-r ${theme.border.light} ${theme.bg.main} w-full`}>
        
        {/* TOP NAV: SEARCH & FILTERS */}
        <div className={`p-3 sm:p-4 md:p-4 space-y-3 sm:space-y-4 border-b ${theme.border.light} ${theme.bg.main}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-2.5 sm:top-3 ${theme.text.muted}`} size={16} />
            <input
              className={`${COMMON_STYLES.input(isDarkMode)} pl-9 sm:pl-10 py-2 sm:py-2.5 min-h-[44px] text-xs sm:text-sm md:text-base`}
              placeholder="SEARCH TERMINAL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {["All", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 sm:px-5 py-2 min-h-[44px] flex items-center justify-center text-[10px] sm:text-xs font-bold uppercase tracking-[0.05em] transition-none whitespace-nowrap ${
                  (selectedCategory === cat || (!selectedCategory && cat === "All"))
                    ? theme.button.primary
                    : theme.button.ghost
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* RESPONSIVE PRODUCT GRID */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 content-start no-scrollbar">
          {filteredProducts.map((p) => {
            const qty = getCartQty(p.id);
            return (
              <ProductCard
                key={p.id}
                product={p}
                qty={qty}
                onAddToCart={onAddToCart}
                onRemoveFromCart={onRemoveFromCart}
                isDarkMode={isDarkMode}
                userRole={userRole}
                theme={theme}
              />
            );
          })}
        </div>
      </div>

      {/* MOBILE CART TOGGLE FAB */}
      <button
        onClick={() => setIsCartOpen(true)}
        className={`md:hidden fixed bottom-6 right-6 z-30 p-4 min-h-[56px] min-w-[56px] rounded-full shadow-xl flex items-center justify-center ${theme.button.primary}`}
      >
        <ShoppingCart size={24} />
        {totalItemsInCart > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white dark:border-[#0b0f14]">
            {totalItemsInCart}
          </span>
        )}
      </button>

      {/* MOBILE SIDEBAR BACKDROP */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* RIGHT: CART SIDEBAR */}
      <aside 
        className={`
          fixed inset-y-0 right-0 z-50 w-[85vw] sm:w-[380px] shrink-0
          transform transition-transform duration-300 ease-in-out
          md:relative md:z-0 md:w-[380px] lg:w-[420px] md:translate-x-0
          flex flex-col border-l shadow-2xl md:shadow-none
          ${isCartOpen ? "translate-x-0" : "translate-x-full"}
          ${theme.border.light} ${theme.bg.subtle}
        `}
      >
        {/* Cart Header */}
        <div className={`p-4 border-b ${theme.border.light} flex items-center justify-between gap-2`}>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${theme.bg.card}`}>
              <ShoppingCart size={18} className="text-blue-500" />
            </div>
            <h2 className={`text-lg font-bold tracking-tight ${theme.text.main}`}>Current Cart</h2>
            {totalItemsInCart > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${theme.bg.active} ${theme.text.secondary}`}>
                {totalItemsInCart} items
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedToken} 
              onChange={(e) => onSetToken(e.target.value)}
              className={`${COMMON_STYLES.input(isDarkMode)} w-auto min-w-[90px] text-sm px-3 py-1.5 font-mono font-bold cursor-pointer rounded-lg`}
            >
              {availableTokens.map(t => <option key={t} value={t}>Token #{t}</option>)}
            </select>
            <button 
              className={`md:hidden p-2 rounded-lg ${theme.button.ghost}`}
              onClick={() => setIsCartOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
              <ShoppingCart size={56} strokeWidth={1} className="mb-3" />
              <p className="text-xs font-bold uppercase tracking-wide">Cart is Empty</p>
              <p className="text-[10px] mt-1">Add items from the menu</p>
            </div>
          ) : (
            cart.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onAdd={onAddToCart}
                onRemove={onRemoveFromCart}
              />
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        <div className={`p-4 border-t ${theme.border.light} ${theme.bg.subtle}`}>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wide ${theme.text.muted}`}>Discount</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount && setDiscount(Number(e.target.value))}
                  className={`w-24 px-2 py-1 text-right text-sm rounded-lg border ${COMMON_STYLES.input(isDarkMode)}`}
                  placeholder="0"
                  min="0"
                />
                <span className={`text-xs ${theme.text.muted}`}>₹</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className={`flex justify-between items-center text-xs ${theme.text.secondary}`}>
              <span>Subtotal</span>
              <span className="font-mono">₹{cartSubtotal}</span>
            </div>
            {discount > 0 && (
              <div className={`flex justify-between items-center text-xs text-green-500`}>
                <span>Discount</span>
                <span className="font-mono">-₹{discount}</span>
              </div>
            )}
            <div className={`flex justify-between items-center text-xs ${theme.text.secondary}`}>
              <span>Tax ({taxRate}%)</span>
              <span className="font-mono">₹{taxAmount.toFixed(0)}</span>
            </div>
          </div>

          <div className={`pt-3 border-t ${theme.border.light} flex justify-between items-baseline mb-4`}>
            <span className={`text-xs font-bold uppercase tracking-wide ${theme.text.muted}`}>Total</span>
            <span className={`text-3xl font-mono font-bold tracking-tighter text-blue-500`}>₹{grandTotal}</span>
          </div>

          <button
            disabled={cart.length === 0 || isCheckingInventory}
            onClick={handleCheckout}
            className={`w-full py-3.5 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50 ${theme.button.primary}`}
          >
            {isCheckingInventory ? (
              <Loader className="animate-spin" size={18} />
            ) : (
              <>
                <span>Confirm Order</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </aside>

      {/* POS SYSTEM FOOTER */}
      {isPOSScreen && (
        <div className={`hidden md:flex fixed bottom-0 left-0 w-full h-6 px-4 items-center justify-between text-[10px] font-mono font-bold uppercase tracking-[0.05em] z-50 border-t ${theme.border.light} ${theme.bg.subtle} ${theme.text.muted}`}>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><span className="text-green-500 text-[10px] leading-none">●</span> System Online</span>
            <span>Terminal: T-01</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Local Time: {currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* MISSING INGREDIENTS DIALOG */}
      {showMissingDialog && (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${theme.bg.overlay} backdrop-blur-sm`} style={{ fontFamily: FONTS.sans }}>
          <div className={`w-[95vw] sm:w-full sm:max-w-md flex flex-col p-4 sm:p-6 md:p-6 ${COMMON_STYLES.modal(isDarkMode)}`}>
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-red-500">Inventory Alert</h2>
              <button 
                onClick={() => setShowMissingDialog(false)} 
                className={`p-1.5 rounded-md transition-none ${theme.button.ghost}`}
              >
                <X size={18} />
              </button>
            </div>
            
            <p className={`text-xs sm:text-sm mb-4 ${theme.text.secondary}`}>
              Some ingredients are missing for selected items. How would you like to proceed?
            </p>
            
            <div className={`mb-6 p-3 rounded bg-red-500/10 border border-red-500/20 max-h-40 overflow-y-auto`}>
              <ul className={`list-disc pl-4 text-xs sm:text-sm font-bold ${theme.text.main}`}>
                {[...new Set(missingItems.map(i => i.product_name))].map((name, idx) => (
                  <li key={idx}>{name}</li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* ✅ Remove affected items then go to payment portal for remaining */}
              <button 
                onClick={handleRemoveAffected}
                className={`flex-1 py-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.05em] rounded-md transition-colors ${theme.button.secondary}`}
              >
                Remove Affected
              </button>
              {/* ✅ Go to payment portal with override flag */}
              <button 
                onClick={handleContinueAnyway}
                className={`flex-1 py-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.05em] rounded-md transition-colors bg-red-500 hover:bg-red-600 text-white`}
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}