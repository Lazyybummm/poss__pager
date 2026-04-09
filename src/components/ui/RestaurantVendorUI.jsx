// ✅ Added useCallback to the imports
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  LogOut,
  LayoutDashboard,
  Coffee,
  Settings,
  User,
  Sun,
  Moon,
  Bell,
  Plus,
  Trash2,
  Wifi,
  Box,
  BookOpen
} from "lucide-react";
import { getTheme, COMMON_STYLES, FONTS } from "./theme";
import POSView from "./POSView";
import CheckoutModal from "./CheckoutModal";
import StaffManager from "./StaffManager";
import SalesReport from "./SalesReport";
import AdminSettingsModal from "./AdminSettingsModal";
import ActiveOrdersDrawer from "./ActiveOrdersDrawer";
import { getUPIQR } from "./utils";
import InventoryManager from "./InventoryManager";
import ManagerDashboard from "./ManagerDashboard";
import ProductManagement from "./ProductManagement";
import RecipeManager from "./RecipeManager";
import LowStockAlert from "./LowStockAlert";

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

export default function RestaurantVendorUI({
  user,
  onLogout,
  isDarkMode,
  onToggleTheme,
}) {
 
  const theme = getTheme(isDarkMode);
  const token = localStorage.getItem("auth_token");
  const getUsername = () => 
  user?.username || localStorage.getItem("username") || "User";
  
  const getRestaurantId = () =>
    user?.restaurantId || user?.user?.restaurantId || user?.restaurant_id || 1;
  const getUserRole = () =>
    user?.role ||
    user?.user?.role ||
    localStorage.getItem("user_role") ||
    "cashier";
  const userRole = getUserRole();
  const displayName = getUsername();

  // --- STATE ---
  const [orders, setOrders] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [menu, setMenu] = useState({});
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [reportDate, setReportDate] = useState(
    new Date().toLocaleDateString('en-CA')
  );
  const [showActiveOrders, setShowActiveOrders] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeTab, setActiveTab] = useState(
    ["admin", "manager"].includes(userRole) ? "dashboard" : "pos"
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [dockConnected, setDockConnected] = useState(false);
  const portRef = useRef(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
    id: null,
  });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "cashier",
  });
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState("1");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [discount, setDiscount] = useState(0);
  const [taxRate] = useState(5);
  const [settings, setSettings] = useState({ upiId: "", payeeName: "", kitchenCapacity: 20 });
  const [activeUpiData, setActiveUpiData] = useState(null);
  const [lowStock, setLowStock] = useState([]);

  const hasFetched = useRef(false);
  const [editingUser, setEditingUser] = useState(null);

  // --- API ---
  const refreshProducts = async () => {
    try {
      const res = await apiRequest(`${API_URL}/products/`)
      if (res.ok) {
        const list = await res.json();
        const productList = Array.isArray(list) ? list : list.products || [];
        setRawProducts(productList);
        const grouped = {};
        const cats = new Set();
        productList.forEach((p) => {
          const cat = p.category || "General";
          if (!grouped[cat]) grouped[cat] = [];
          cats.add(cat);
          grouped[cat].push({
            id: Number(p.id),
            name: p.name,
            price: p.price !== null ? Number(p.price) : 0,
            stock: p.stock !== null ? Number(p.stock) : 0,
            category: cat,
          });
        });
        setMenu(grouped);
        setCategories(Array.from(cats));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLowStock = async () => {
    try {
      const res = await apiRequest(`${API_URL}/dashboard/low-stock`);
      if (res.ok) {
        const data = await res.json();
        setLowStock(data);
      }
    } catch (err) {
      console.error("Failed to fetch low stock:", err);
    }
  };

  const refreshUsers = async () => {
    try {
      const userRes = await apiRequest(`${API_URL}/staff/`)
      if (userRes.ok) setUsersList(await userRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const res = await apiRequest(`${API_URL}/orders/`);
      if (res.ok) {
        const serverOrders = await res.json();
        if (Array.isArray(serverOrders)) {
          const activeOnly = serverOrders.filter(
            (o) => (o.status || "").toLowerCase() === "active"
          );

          setOrders(
            activeOnly.map((o) => ({
              ...o,
              startedAt: o.created_at || o.startedAt || Date.now(),
              paymentMethod: (o.payment_method || "cash").toLowerCase(),
              total: Number(o.total_amount || 0),
              items: (o.items || []).map(it => {
                const product = rawProducts.find(p => p.id === it.product_id);
                return {
                  name: product ? product.name : "Item",
                  quantity: it.quantity
                };
              })
            }))
          );
        }
      }
    } catch (e) {
      console.error("Polling error:", e);
    }
  };
  
  const fetchSalesHistory = useCallback(async (date) => {
    if (activeTab !== "dashboard") return;
  
    setIsHistoryLoading(true);
    try {
      const res = await apiRequest(`${API_URL}/orders/history?date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch history");
  
      const data = await res.json();
      setSalesHistory(data.orders || []);
    } catch (err) {
      console.error("Sales history fetch failed:", err);
      setSalesHistory([]);
    } finally {
      setTimeout(() => setIsHistoryLoading(false), 300);
    }
  }, [activeTab]);
  
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    const load = async () => {
      await refreshProducts();
      await fetchActiveOrders();
      await fetchLowStock();
      try {
        const sRes = await apiRequest(`${API_URL}/settings/`)
        if (sRes.ok) {
          const s = await sRes.json();
          setSettings({ upiId: s.upi_id, payeeName: s.payee_name, kitchenCapacity: s.kitchen_capacity || 20});
        }
        if (userRole === "admin") await refreshUsers();
      } catch (e) {}
    };
    load();
    const interval = setInterval(fetchActiveOrders, 3000);
    const lowStockInterval = setInterval(fetchLowStock, 10000);
    return () => {
      clearInterval(interval);
      clearInterval(lowStockInterval);
    };
  }, [token, API_URL, userRole]);

  useEffect(() => {
    if (!["admin", "manager"].includes(userRole) && activeTab === "dashboard") {
      setActiveTab("menu");
    }
  }, [userRole, activeTab]);

  useEffect(() => {
    if (activeTab === "dashboard" && ["admin", "manager"].includes(userRole)) {
      fetchSalesHistory(reportDate);
    }
  }, [activeTab, reportDate, userRole, fetchSalesHistory]);

  // --- HANDLERS ---
  const handleAdminAddProduct = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        stock: Number(formData.stock) || 0,
        category: formData.category,
      };
  
      const res = await apiRequest(`${API_URL}/products/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        console.error("Add failed:", data);
        alert(data.detail || "Failed to add product");
        return;
      }
  
      await refreshProducts();
    } catch (err) {
      console.error("Add error:", err);
    }
  };

  const handleAdminUpdateProduct = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        stock: Number(formData.stock) || 0,
        category: formData.category,
      };
  
      const res = await apiRequest(
        `${API_URL}/products/${formData.id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );
  
      const data = await res.json();
  
      if (!res.ok) {
        console.error("Update failed:", data);
        alert(data.detail || "Failed to update product");
        return;
      }
  
      await refreshProducts();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleAdminAddUser = async (userData) => {
    const res = await apiRequest(`${API_URL}/staff/`, {
      method: "POST",
      body: JSON.stringify(userData),
    });
    if (res.ok) {
      refreshUsers();
    } else {
      const data = await res.json();
      alert(data.detail || "Failed to create staff");
    }
  };

  const handleAdminUpdateUser = async (updatedUser) => {
    try {
      const res = await apiRequest(`${API_URL}/staff/${updatedUser.id}`, {
        method: "PUT",
        body: JSON.stringify(updatedUser),
      });
      if (res.ok) {
        await refreshUsers();
        alert("Staff details updated!");
      }
    } catch (err) {
      alert(err.message);
    }
  };
  
  const handleAdminDeleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
  
    try {
      const res = await apiRequest(`${API_URL}/staff/${id}`, {
        method: "DELETE",
      });
  
      const data = await res.json().catch(() => ({}));
  
      if (!res.ok) {
        alert(data.detail || "Failed to delete staff member");
        return;
      }
  
      setUsersList((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // --- DOCK LOGIC ---
  const connectDock = async () => {
    try {
      if ("serial" in navigator) {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        portRef.current = port;
        setDockConnected(true);
        alert("✅ Dock Connected Successfully!");
      } else {
        alert("⚠️ Web Serial API not supported in this browser.");
      }
    } catch (err) {
      console.error("Dock Connection Failed:", err);
      setDockConnected(false);
    }
  };

  const sendToDock = async (tokenNum) => {
    if (!dockConnected || !portRef.current || !portRef.current.writable) {
      alert("Dock not connected or not writable! Please connect dock.");
      return;
    }

    const writer = portRef.current.writable.getWriter();

    try {
      console.log(`Sending Token ${tokenNum} to Dock...`);
      const data = new TextEncoder().encode(`${tokenNum}\n`);
      await writer.write(data);
    } catch (error) {
      console.error("Error writing to serial port:", error);
      alert("Failed to send to dock");
    } finally {
      writer.releaseLock();
    }
  };

  // Cart Logic
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = Math.max(0, cartSubtotal - discount) * (taxRate / 100);
  const grandTotal = Math.round(
    Math.max(0, cartSubtotal - discount) + taxAmount
  );

  const availableTokens = useMemo(() => {
    const used = orders.map((o) => String(o.token));
    return Array.from({ length: 8 }, (_, i) => String(i + 1)).filter(
      (t) => !used.includes(t)
    );
  }, [orders]);

  useEffect(() => {
    if (availableTokens.length > 0) {
      if (availableTokens.includes(selectedToken)) return;
      setSelectedToken(availableTokens[0]);
    }
  }, [availableTokens, selectedToken]);

  const addToCart = (item) =>
    setCart((p) => {
      const f = p.find((i) => i.id === item.id);
      return f
        ? p.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [...p, { ...item, quantity: 1 }];
    });
    
  const removeFromCart = (item) =>
    setCart((p) => {
      const f = p.find((i) => i.id === item.id);
      if (!f) return p;
      if (f.quantity === 1) return p.filter((i) => i.id !== item.id);
      return p.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
      );
    });

  // ✅ FIXED: Handle checkout with inventory override support
  const handleCheckoutClick = (orderData = null) => {
    console.log("handleCheckoutClick called with:", orderData);
    
    if (orders.length >= settings.kitchenCapacity) {
      const proceed = window.confirm(
        `⚠️ WARNING: Kitchen is at capacity (${orders.length}/${settings.kitchenCapacity}).\n\nPlacing this order may cause significant delays. Continue?`
      );
      if (!proceed) return;
    }
    
    setActiveUpiData(null);
    
    if (dockConnected && selectedToken) {
      sendToDock(selectedToken);
    }
    
    // Check if this is from POSView with inventory override data
    if (orderData && typeof orderData === 'object' && orderData.override_missing_ingredients !== undefined) {
      console.log("Processing inventory override order");
      finalizeOrder(orderData);
    } else {
      console.log("Opening checkout modal");
      setShowCheckout(true);
    }
  };

  // ✅ FIXED: Finalize order with proper override support
  const finalizeOrder = async (payData) => {
    console.log("=== finalizeOrder called ===");
    console.log("payData:", payData);
    console.log("payData type:", typeof payData);
    
    // Default values
    let paymentMethod = "cash";
    let isOverride = false;
    let isConfirmed = false;
    
    // Parse payData correctly
    if (payData) {
      if (typeof payData === 'string') {
        paymentMethod = payData;
        console.log("Case: String payment method");
      } else if (typeof payData === 'object') {
        // Handle different object structures
        if (payData.paymentMethod) {
          paymentMethod = payData.paymentMethod;
          console.log("Case: Object with paymentMethod");
        } else if (payData.payment_method) {
          paymentMethod = payData.payment_method;
          console.log("Case: Object with payment_method");
        }
        
        if (payData.override_missing_ingredients !== undefined) {
          isOverride = payData.override_missing_ingredients;
          console.log("Override flag detected:", isOverride);
        }
        
        if (payData.confirmed !== undefined) {
          isConfirmed = payData.confirmed;
          console.log("Confirmed flag detected:", isConfirmed);
        }
      }
    }
    
    console.log(`Parsed: paymentMethod=${paymentMethod}, isOverride=${isOverride}, isConfirmed=${isConfirmed}`);
    
    // Handle UPI QR code display
    if (paymentMethod === "upi" && !isConfirmed) {
      console.log("Showing UPI QR code...");
      const qrConfig = {
        pa: settings.upiId,
        pn: settings.payeeName,
        cu: "INR",
      };
      const qrUrl = getUPIQR(qrConfig, grandTotal, selectedToken);
      setActiveUpiData({ qr: qrUrl, payee: settings.payeeName });
      return;
    }
    
    // Validate cart is not empty
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    
    // Prepare items array - ensure all numbers are proper types
    const items = cart.map((i) => ({
      product_id: Number(i.id),
      quantity: Number(i.quantity),
      subtotal: Number(i.price * i.quantity)
    }));
    
    // Prepare payload with correct types
    const payload = {
      total_amount: Number(grandTotal),
      payment_method: paymentMethod,
      token: Number(selectedToken),
      items: items,
      override_missing_ingredients: Boolean(isOverride)
    };
    
    console.log("=== FINAL PAYLOAD TO BACKEND ===");
    console.log(JSON.stringify(payload, null, 2));
    
    try {
      const res = await apiRequest(`${API_URL}/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      const responseData = await res.json();
      console.log("Backend response status:", res.status);
      console.log("Backend response data:", responseData);
      
      if (!res.ok) {
        // Show detailed validation errors
        if (res.status === 422) {
          console.error("Validation errors:", responseData);
          const errors = responseData.detail || [];
          if (Array.isArray(errors)) {
            alert(`Validation Error:\n${errors.map(e => e.msg || JSON.stringify(e)).join('\n')}`);
          } else {
            alert(`Error: ${JSON.stringify(responseData)}`);
          }
        } else {
          throw new Error(responseData.detail || "Order failed");
        }
        return;
      }
      
      // Success - continue with order completion
      if (paymentMethod === "upi" && !isConfirmed) {
        const qrConfig = { pa: settings.upiId, pn: settings.payeeName, cu: "INR" };
        const qrUrl = getUPIQR(qrConfig, grandTotal, Number(selectedToken), responseData.id);
        setActiveUpiData({ qr: qrUrl, orderId: responseData.id });
        return;
      }
      
      // Create local order object
      const newOrder = {
        id: responseData.id,
        token: Number(selectedToken),
        items: cart.map(i => ({ name: i.name, quantity: i.quantity })),
        startedAt: new Date().toISOString(),
        total: grandTotal,
        status: "active",
        missing_ingredients: responseData.missing_ingredients || []
      };
      
      setOrders((prev) => [newOrder, ...prev]);
      await refreshProducts();
      await fetchLowStock();
      
      // Reset cart and UI
      setCart([]);
      setDiscount(0);
      setShowCheckout(false);
      setActiveUpiData(null);
      
      // Show warning if ingredients were missing
      if (newOrder.missing_ingredients && newOrder.missing_ingredients.length > 0) {
        alert(`⚠️ Order #${newOrder.token} placed with ${newOrder.missing_ingredients.length} missing ingredient(s). Please check inventory levels.`);
      } else {
        console.log("Order placed successfully!");
      }
      
    } catch (error) {
      console.error("Order creation failed:", error);
      alert(error.message || "Failed to place order. Please try again.");
      setShowCheckout(false);
    }
  };

  const handleMarkReady = async (id) => {
    if (!confirm("Complete Order?")) return;
  
    try {
      const res = await apiRequest(`${API_URL}/orders/${id}/complete`, {
        method: "PUT",
      });
  
      const data = await res.json();
  
      if (!res.ok) throw new Error(data.detail || "Failed to complete order");
  
      setOrders((p) => p.filter((o) => String(o.id) !== String(id)));
    } catch (e) {
      console.error("Complete order error:", e);
      alert(e.message);
    }
  };

  const handlePaymentSuccess = async (method) => {
    console.log("Payment success with method:", method);
    setCart([]);
    setDiscount(0);
    setActiveUpiData(null);
    await finalizeOrder({ paymentMethod: method, confirmed: true });
    setShowCheckout(false);
    setTimeout(fetchActiveOrders, 500);
  };

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden ${theme.bg.main} ${theme.text.main}`}
      style={{ fontFamily: FONTS.sans }}
    >
      {/* Header */}
      <header
        className={`h-16 flex items-center justify-between px-6 border-b ${theme.border.default} ${theme.bg.card}`}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme.bg.subtle}`}>
              <Settings size={20} />
            </div>
            <h1 className="text-lg font-semibold">POS</h1>
          </div>
          <nav className="flex items-center gap-1">
            {[
              { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "manager"] },
              { id: "pos", icon: Coffee, label: "MENU", roles: ["cashier"] },
              { id: "products", icon: Box, label: "Products", roles: ["admin", "manager"] },
              { id: "kitchen", icon: Bell, label: "Kitchen", roles: ["cashier", "manager"], action: () => setShowActiveOrders(true), badge: orders.length, isCritical: orders.length >= settings.kitchenCapacity },
              { id: "users", icon: User, label: "Staff", roles: ["admin","manager"] },
              { id: "inventory", icon: Box, label: "Inventory", roles: ["admin", "manager"] },
              { id: "recipes", icon: BookOpen, label: "Recipes", roles: ["admin","manager"] }
            ].map(
              (item) =>
              (!item.roles || item.roles.includes(userRole)) && (
                <button
                  key={item.id}
                  onClick={() => item.action ? item.action() : setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors relative
                    ${activeTab === item.id && !item.action ? `${theme.bg.active} ${theme.text.main}` : theme.button.ghost}
                    ${item.id === 'kitchen' && orders.length >= settings.kitchenCapacity ? 'text-red-500 animate-pulse bg-red-500/10' : ''}`}
                >
                  <item.icon size={16} className={item.id === 'kitchen' && orders.length >= settings.kitchenCapacity ? 'text-red-500' : ''} />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className={`${orders.length >= settings.kitchenCapacity ? 'bg-red-600' : 'bg-blue-600'} text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            )}
          </nav>
        </div>
        
        {/* Right side navigation */}
        <div className="flex items-center gap-3">
          {/* Low Stock Alert Bell */}
          <LowStockAlert lowStock={lowStock} isDarkMode={isDarkMode} />
          
          {/* Dock Connect Button */}
          {userRole !== "admin" && (
            <button
              onClick={connectDock}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                dockConnected
                  ? `${theme.bg.active} ${theme.border.default} ${theme.text.main}`
                  : `${theme.border.default} ${theme.button.ghost}`
              }`}
            >
              <Wifi size={16} className={dockConnected ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">{dockConnected ? "Dock" : "Connect"}</span>
            </button>
          )}
          
          {/* Theme Toggle */}
          <button onClick={onToggleTheme} className={`p-2 rounded-lg ${theme.button.ghost}`}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {/* Admin Settings */}
          {userRole === "admin" && (
            <button onClick={() => setSettingsOpen(true)} className={`p-2 rounded-lg ${theme.button.ghost}`}>
              <Settings size={18} />
            </button>
          )}
          
          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2 border-l" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)" }}>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{displayName}</p>
              <p className={`text-xs uppercase font-medium tracking-wider ${theme.text.tertiary}`}>{userRole}</p>
            </div>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border.default} ${theme.bg.subtle}`}>
              <User size={16} className={theme.text.secondary} />
            </div>
          </div>
          
          {/* Logout */}
          <button onClick={onLogout} className={`p-2 rounded-lg ${theme.button.ghost}`}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden ${theme.bg.main}`}>
        <div className="flex-1 overflow-y-auto p-0 relative">
          {activeTab === "dashboard" && ["admin","manager"].includes(userRole) && (
            <div className="p-8">
              <SalesReport
                history={salesHistory}
                reportDate={reportDate}
                setReportDate={setReportDate}
                fetchSalesHistory={fetchSalesHistory}
                isHistoryLoading={isHistoryLoading}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {activeTab === "dashboard" && userRole === "manager" && (
            <div className="p-8">
              <ManagerDashboard
                apiRequest={apiRequest}
                isDarkMode={isDarkMode}
                lowStock={lowStock}
                setLowStock={setLowStock}
              />
            </div>
          )}
  
          {activeTab === "pos" && userRole === "cashier" && (
            <POSView
              menu={menu}
              categories={categories}
              cart={cart}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              availableTokens={availableTokens}
              selectedToken={selectedToken}
              onSetToken={setSelectedToken}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
              onCheckout={handleCheckoutClick}
              isDarkMode={isDarkMode}
              discount={discount}
              setDiscount={setDiscount}
              taxRate={taxRate}
            />
          )}
          
          {activeTab === "products" && ["admin","manager"].includes(userRole) && (
            <ProductManagement
              rawProducts={rawProducts}
              categories={categories}
              isDarkMode={isDarkMode}
              onAdd={handleAdminAddProduct}
              onUpdate={handleAdminUpdateProduct}
              onDelete={(id) => {
                if (confirm("Delete?"))
                  apiRequest(`${API_URL}/products/${id}`, {
                    method: "DELETE",
                  }).then(refreshProducts);
              }}
            />
          )}
          
          {activeTab === "inventory" && ["admin","manager"].includes(userRole) && (
            <InventoryManager
              apiRequest={apiRequest}
              isDarkMode={isDarkMode}
            />
          )}
          
          {activeTab === "recipes" && ["admin","manager"].includes(userRole) && (
            <RecipeManager
              apiRequest={apiRequest}
              isDarkMode={isDarkMode}
              products={rawProducts}
            />
          )}
          
          {activeTab === "users" && ["admin","manager"].includes(userRole) && (
            <StaffManager
              isDarkMode={isDarkMode}
              theme={theme}
              currentUserRole={userRole}
              usersList={usersList}
              onAddUser={handleAdminAddUser}
              onUpdateUser={handleAdminUpdateUser}
              onDeleteUser={handleAdminDeleteUser}
            />
          )}
        </div>
      </main>

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onConfirm={finalizeOrder}
        cartSubtotal={cartSubtotal}
        taxAmount={taxAmount}
        discount={discount}
        grandTotal={grandTotal}
        orderId={orders.length + 1}
        isDarkMode={isDarkMode}
        upiId={settings.upiId}
        payeeName={settings.payeeName}
        backendUpiData={activeUpiData}
        onPaymentComplete={handlePaymentSuccess}
      />
      <ActiveOrdersDrawer
        isOpen={showActiveOrders}
        onClose={() => setShowActiveOrders(false)}
        orders={orders}
        onCompleteOrder={handleMarkReady}
        onCallCustomer={(t) => sendToDock(t)}
        isDarkMode={isDarkMode}
      />
      {userRole === "admin" && (
        <AdminSettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          restaurantId={getRestaurantId()}
        />
      )}
    </div>
  );
}