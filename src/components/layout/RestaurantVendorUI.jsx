// FULLY UPDATED RestaurantVendorUI.jsx - With Professional Confirmation Modal
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
  Wifi,
  Box,
  BookOpen,
  CheckCircle,
  X,
  AlertTriangle
} from "lucide-react";import { getTheme, COMMON_STYLES, FONTS } from "../shared/theme";
import POSView from "../cashier/POSView";
import CheckoutModal from "../cashier/CheckoutModal";
import StaffManagement from "../admin/StaffManagement";
import SalesReport from "../admin/SalesReport";
import AdminSettingsModal from "../admin/AdminSettingsModal";
import ActiveOrdersDrawer from "../kitchen/ActiveOrdersDrawer";
import { getUPIQR } from "../../utils/utils";
import InventoryManager from "../admin/InventoryManager";
import ManagerDashboard from "../manager/ManagerDashboard";
import ProductManagement from "../admin/ProductManagement";
import RecipeManager from "../admin/RecipeManager";
import LowStockAlert from "../shared/LowStockAlert";
import { printReceipt } from "../../services/printerService";

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

// Professional Confirmation Modal Component
function ConfirmCompleteModal({ isOpen, onClose, onConfirm, orderToken, isDarkMode }) {
  if (!isOpen) return null;
  const theme = getTheme(isDarkMode);
  
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className={`p-5 border-b flex items-center gap-3`} style={{
          backgroundColor: isDarkMode ? "#111111" : "#fafafa",
          borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)"
        }}>
          <div className="p-2 rounded-full bg-green-500/10">
            <CheckCircle size={24} className="text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
              Complete Order
            </h3>
            <p className="text-sm mt-0.5" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
              Mark order #{orderToken} as completed?
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
          <button onClick={onClose} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${theme.button.secondary}`}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20">
            <CheckCircle size={16} />
            Complete Order
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [reportDate, setReportDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [showActiveOrders, setShowActiveOrders] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeTab, setActiveTab] = useState(
    ["admin", "manager"].includes(userRole) ? "dashboard" : "pos"
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Unified Hardware Connection (Dock + Printer)
  const [hardwareConnected, setHardwareConnected] = useState(false);
  const portRef = useRef(null);
  
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState("1");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [discount, setDiscount] = useState(0);
  const [taxRate] = useState(5);
  const [settings, setSettings] = useState({ upiId: "", payeeName: "", kitchenCapacity: 20, phone: "", shopName: "" });
  const [activeUpiData, setActiveUpiData] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  // Dialog States
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const [missingMessage, setMissingMessage] = useState("");
  const [generalErrorDialog, setGeneralErrorDialog] = useState(false);
  const [generalErrorMessage, setGeneralErrorMessage] = useState("");
  
  // Order Completion Confirmation Modal State
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [pendingOrderToken, setPendingOrderToken] = useState(null);

  const hasFetched = useRef(false);

  // Refs for sliding underline
  const navRefs = useRef({});
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  // --- NAV ITEMS (Role-based) ---
  const getNavItems = () => {
    const items = [];
    
    if (["admin", "manager"].includes(userRole)) {
      items.push({ id: "dashboard", icon: LayoutDashboard, label: "Dashboard" });
    }
    
    if (userRole === "cashier") {
      items.push({ id: "pos", icon: Coffee, label: "MENU" });
    }
    
    if (["admin", "manager"].includes(userRole)) {
      items.push({ id: "products", icon: Box, label: "Products" });
    }
    
    // Kitchen - CASHIER ONLY
    if (userRole === "cashier") {
      items.push({
        id: "kitchen",
        icon: Bell,
        label: "Kitchen",
        action: () => setShowActiveOrders(true),
        badge: orders.length,
        isCritical: orders.length >= settings.kitchenCapacity,
      });
    }
    
    if (["admin", "manager"].includes(userRole)) {
      items.push({ id: "users", icon: User, label: "Staff" });
      items.push({ id: "inventory", icon: Box, label: "Inventory" });
      items.push({ id: "recipes", icon: BookOpen, label: "Recipes" });
    }
    
    return items;
  };

  // --- SLIDING UNDERLINE LOGIC ---
  const updateUnderline = useCallback((tabId) => {
    const el = navRefs.current[tabId];
    if (el) {
      setUnderlineStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, []);

  useEffect(() => {
    updateUnderline(activeTab);
  }, [activeTab, updateUnderline]);

  useEffect(() => {
    const handleResize = () => updateUnderline(activeTab);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, updateUnderline]);

  // --- HELPERS ---
  const buildMenuFromList = (productList) => {
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
        image_url: p.image_url || null,
        has_recipe: p.has_recipe || false,
      });
    });
    return { grouped, cats: Array.from(cats) };
  };

  // --- API CALLS ---
  const refreshProducts = async () => {
    try {
      const res = await apiRequest(`${API_URL}/products/`);
      if (res.ok) {
        const list = await res.json();
        const productList = Array.isArray(list) ? list : list.products || [];
        setRawProducts(productList);
        const { grouped, cats } = buildMenuFromList(productList);
        setMenu(grouped);
        setCategories(cats);
      }
    } catch (e) {
      console.error("refreshProducts error:", e);
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
      console.error("fetchLowStock error:", err);
    }
  };

  const refreshUsers = async () => {
    try {
      const res = await apiRequest(`${API_URL}/staff/`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error("refreshUsers error:", e);
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
              items: (o.items || []).map((it) => {
                const product = rawProducts.find((p) => p.id === it.product_id);
                return { name: product ? product.name : "Item", quantity: it.quantity };
              }),
            }))
          );
        }
      }
    } catch (e) {
      console.error("fetchActiveOrders error:", e);
    }
  };

  const fetchSalesHistory = useCallback(
    async (date) => {
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
    },
    [activeTab]
  );

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    const load = async () => {
      await refreshProducts();
      await fetchActiveOrders();
      await fetchLowStock();
      try {
        const sRes = await apiRequest(`${API_URL}/settings/`);
        if (sRes.ok) {
          const s = await sRes.json();
          setSettings({
            upiId: s.upi_id,
            payeeName: s.payee_name,
            kitchenCapacity: s.kitchen_capacity || 20,
            phone: s.phone || "",
            shopName: s.shop_name || s.payee_name || "YOUR RESTAURANT",
          });
        }
        if (["admin", "manager"].includes(userRole)) {
          await refreshUsers();
        }
      } catch (e) {
        console.error("Settings/staff load error:", e);
      }
    };
    load();

    const ordersInterval = setInterval(fetchActiveOrders, 3000);
    const lowStockInterval = setInterval(fetchLowStock, 10000);
    
    return () => {
      clearInterval(ordersInterval);
      clearInterval(lowStockInterval);
    };
  }, [token, API_URL, userRole]);

  useEffect(() => {
    if (!["admin", "manager"].includes(userRole) && activeTab === "dashboard") {
      setActiveTab("pos");
    }
  }, [userRole, activeTab]);

  useEffect(() => {
    if (activeTab === "dashboard" && ["admin", "manager"].includes(userRole)) {
      fetchSalesHistory(reportDate);
    }
  }, [activeTab, reportDate, userRole, fetchSalesHistory]);

  // ============================================================
  // PRODUCT HANDLERS - Direct state updates (NO double entries)
  // ============================================================

  const handleAdminAddProduct = (savedProduct) => {
    setRawProducts((prev) => {
      if (prev.some((p) => p.id === savedProduct.id)) return prev;
      return [savedProduct, ...prev];
    });

    const cat = savedProduct.category || "General";
    setMenu((prev) => {
      if (prev[cat]?.some((p) => p.id === savedProduct.id)) return prev;
      return {
        ...prev,
        [cat]: [
          ...(prev[cat] || []),
          {
            id: Number(savedProduct.id),
            name: savedProduct.name,
            price: Number(savedProduct.price),
            stock: Number(savedProduct.stock),
            category: cat,
            image_url: savedProduct.image_url || null,
            has_recipe: savedProduct.has_recipe || false,
          },
        ],
      };
    });

    setCategories((prev) => (prev.includes(cat) ? prev : [...prev, cat]));
  };

  const handleAdminUpdateProduct = (savedProduct) => {
    setRawProducts((prev) =>
      prev.map((p) => (p.id === savedProduct.id ? savedProduct : p))
    );

    const newCat = savedProduct.category || "General";
    setMenu((prev) => {
      const next = { ...prev };
      for (const cat in next) {
        next[cat] = next[cat].filter((p) => p.id !== savedProduct.id);
      }
      if (!next[newCat]) next[newCat] = [];
      next[newCat] = [
        ...next[newCat],
        {
          id: Number(savedProduct.id),
          name: savedProduct.name,
          price: Number(savedProduct.price),
          stock: Number(savedProduct.stock),
          category: newCat,
          image_url: savedProduct.image_url || null,
          has_recipe: savedProduct.has_recipe || false,
        },
      ];
      return next;
    });

    setCategories((prev) => (prev.includes(newCat) ? prev : [...prev, newCat]));
  };

  const handleAdminDeleteProduct = async (id) => {
    try {
      const res = await apiRequest(`${API_URL}/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        console.error("Delete failed");
        return;
      }
      setRawProducts((prev) => prev.filter((p) => p.id !== id));
      setMenu((prev) => {
        const next = { ...prev };
        for (const cat in next) {
          next[cat] = next[cat].filter((p) => p.id !== id);
        }
        return next;
      });
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ============================================================
  // STAFF HANDLERS
  // ============================================================

  const handleAdminAddUser = async (userData) => {
    if (!userData.username || !userData.email || !userData.password) return;
    const res = await apiRequest(`${API_URL}/staff/`, {
      method: "POST",
      body: JSON.stringify(userData),
    });
    if (res.ok) refreshUsers();
  };

  const handleAdminUpdateUser = async (updatedUser) => {
    try {
      const res = await apiRequest(`${API_URL}/staff/${updatedUser.id}`, {
        method: "PUT",
        body: JSON.stringify(updatedUser),
      });
      if (res.ok) await refreshUsers();
    } catch (err) {
      console.error("Update user error:", err);
    }
  };

  const handleAdminDeleteUser = async (id) => {
    try {
      const res = await apiRequest(`${API_URL}/staff/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (err) {
      console.error("Delete user error:", err);
    }
  };

  // ============================================================
  // UNIFIED HARDWARE (DOCK + PRINTER) LOGIC
  // ============================================================

  const connectHardware = async () => {
    try {
      if ("serial" in navigator) {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        portRef.current = port;
        setHardwareConnected(true);
        console.log("✅ Hardware (Dock & Printer) Connected Successfully!");
      } else {
        setGeneralErrorMessage("⚠️ Web Serial API not supported in this browser.");
        setGeneralErrorDialog(true);
      }
    } catch (err) {
      console.error("Hardware Connection Failed:", err);
      setHardwareConnected(false);
      setGeneralErrorMessage("Failed to connect hardware. Please try again.");
      setGeneralErrorDialog(true);
    }
  };

  const sendToDock = async (tokenNum) => {
    if (!hardwareConnected || !portRef.current?.writable) {
      console.warn("Hardware not connected or not writable");
      return;
    }
    
    let writer;
    try {
      writer = portRef.current.writable.getWriter();
      console.log(`Sending Token ${tokenNum} to Dock...`);
      const data = new TextEncoder().encode(`${tokenNum}\n`);
      await writer.write(data);
    } catch (error) {
      console.error("Error writing to serial port:", error);
    } finally {
      if (writer) {
        writer.releaseLock();
      }
    }
  };

  // ============================================================
  // CART LOGIC
  // ============================================================

  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = Math.max(0, cartSubtotal - discount) * (taxRate / 100);
  const grandTotal = Math.round(Math.max(0, cartSubtotal - discount) + taxAmount);

  const availableTokens = useMemo(() => {
    const used = orders.map((o) => String(o.token));
    return Array.from({ length: 8 }, (_, i) => String(i + 1)).filter((t) => !used.includes(t));
  }, [orders]);

  useEffect(() => {
    if (availableTokens.length > 0 && !availableTokens.includes(selectedToken)) {
      setSelectedToken(availableTokens[0]);
    }
  }, [availableTokens, selectedToken]);

  const addToCart = (item) =>
    setCart((p) => {
      const f = p.find((i) => i.id === item.id);
      return f
        ? p.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...p, { ...item, quantity: 1 }];
    });

  const removeFromCart = (item) =>
    setCart((p) => {
      const f = p.find((i) => i.id === item.id);
      if (!f) return p;
      if (f.quantity === 1) return p.filter((i) => i.id !== item.id);
      return p.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i));
    });

  // ============================================================
  // ORDER FLOW
  // ============================================================

  const openCheckoutModal = () => {
    setActiveUpiData(null);
    if (hardwareConnected && selectedToken) {
      sendToDock(selectedToken);
    }
    setShowCheckout(true);
  };

  const handleCheckoutClick = async (orderData = null) => {
    if (cart.length === 0) return;

    if (orders.length >= settings.kitchenCapacity) {
      const proceed = window.confirm(
        `⚠️ Kitchen is at capacity (${orders.length}/${settings.kitchenCapacity}). Continue?`
      );
      if (!proceed) return;
    }

    // If called with override data, go directly to finalize
    if (orderData && typeof orderData === "object" && orderData.override_missing_ingredients !== undefined) {
      finalizeOrder(orderData);
      return;
    }

    const validationPayload = {
      total_amount: grandTotal,
      payment_method: "cash",
      token: Number(selectedToken) || 1,
      override_missing_ingredients: false,
      items: cart.map((i) => ({
        product_id: i.id,
        quantity: i.quantity,
        subtotal: i.price * i.quantity,
      })),
    };

    try {
      const res = await apiRequest(`${API_URL}/orders/check-inventory`, {
        method: "POST",
        body: JSON.stringify(validationPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        setGeneralErrorMessage(data?.detail || "Validation request failed.");
        setGeneralErrorDialog(true);
        return;
      }

      if (data?.can_fulfill === false) {
        const missingNames = data.missing_items?.map((i) => i.product_name)?.join(", ") || "Some ingredients are missing";
        setMissingMessage(missingNames);
        setShowMissingDialog(true);
        return;
      }

      openCheckoutModal();
    } catch (err) {
      console.error("Inventory check failed:", err);
      setGeneralErrorMessage("Failed to check inventory. Please try again.");
      setGeneralErrorDialog(true);
    }
  };

  const finalizeOrder = async (payData) => {
    let paymentMethod = "cash";
    let isOverride = false;
    let isConfirmed = false;

    if (payData) {
      if (typeof payData === "string") {
        paymentMethod = payData;
      } else if (typeof payData === "object") {
        paymentMethod = payData.paymentMethod || payData.payment_method || "cash";
        isOverride = payData.override_missing_ingredients || false;
        isConfirmed = payData.confirmed || false;
      }
    }

    if (paymentMethod === "upi" && !isConfirmed) {
      const qrUrl = getUPIQR(
        { pa: settings.upiId, pn: settings.payeeName, cu: "INR" },
        grandTotal,
        selectedToken
      );
      setActiveUpiData({ qr: qrUrl, payee: settings.payeeName });
      return;
    }

    if (cart.length === 0) {
      setGeneralErrorMessage("Cart is empty");
      setGeneralErrorDialog(true);
      return;
    }

    // Save cart data before clearing for printing
    const localItems = cart.map((i) => ({ 
      id: i.id, 
      name: i.name, 
      quantity: i.quantity,
      price: i.price 
    }));
    const snapshotTotal = grandTotal;
    const snapshotTax = taxAmount;
    const snapshotDiscount = discount;

    const payload = {
      total_amount: Number(grandTotal),
      payment_method: paymentMethod,
      token: Number(selectedToken),
      items: cart.map((i) => ({
        product_id: Number(i.id),
        quantity: Number(i.quantity),
        subtotal: Number(i.price * i.quantity),
      })),
      override_missing_ingredients: Boolean(isOverride),
    };

    try {
      const res = await apiRequest(`${API_URL}/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();
      
      if (!res.ok) {
        if (res.status === 422) {
          const errors = responseData.detail || [];
          setGeneralErrorMessage(
            Array.isArray(errors)
              ? errors.map((e) => e.msg || JSON.stringify(e)).join("\n")
              : JSON.stringify(responseData)
          );
        } else {
          throw new Error(responseData.detail || "Order failed");
        }
        setGeneralErrorDialog(true);
        return;
      }

      if (paymentMethod === "upi" && !isConfirmed) {
        const qrUrl = getUPIQR(
          { pa: settings.upiId, pn: settings.payeeName, cu: "INR" },
          grandTotal,
          Number(selectedToken),
          responseData.id
        );
        setActiveUpiData({ qr: qrUrl, orderId: responseData.id });
        return;
      }

      const newOrder = {
        id: responseData.id,
        token: Number(selectedToken),
        items: localItems,
        startedAt: new Date().toISOString(),
        total: snapshotTotal,
        status: "active",
        paymentMethod: paymentMethod
      };

      setOrders((prev) => [newOrder, ...prev]);
      await refreshProducts();
      await fetchLowStock();

      // 🖨️ PRINT IMMEDIATELY ON PAYMENT CONFIRMATION
      if (hardwareConnected && portRef.current) {
        printReceipt(newOrder, localItems, snapshotDiscount, snapshotTax, settings, portRef.current)
          .catch(err => console.error("Auto-print error:", err));
      }

      setCart([]);
      setDiscount(0);
      setShowCheckout(false);
      setActiveUpiData(null);
    } catch (error) {
      console.error("Order creation failed:", error);
      setGeneralErrorMessage(error.message || "Failed to place order. Please try again.");
      setGeneralErrorDialog(true);
      setShowCheckout(false);
    }
  };

  // ✅ FIXED: Handle order completion with professional modal
  const handleCompleteClick = (orderId, token) => {
    setPendingOrderId(orderId);
    setPendingOrderToken(token);
    setShowCompleteConfirm(true);
  };

  const handleConfirmComplete = async () => {
    if (!pendingOrderId) return;
    
    try {
      const res = await apiRequest(`${API_URL}/orders/${pendingOrderId}/complete`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to complete order");
      setOrders((p) => p.filter((o) => String(o.id) !== String(pendingOrderId)));
      setShowCompleteConfirm(false);
      setPendingOrderId(null);
      setPendingOrderToken(null);
    } catch (e) {
      console.error("Complete order error:", e);
      setGeneralErrorMessage(e.message);
      setGeneralErrorDialog(true);
      setShowCompleteConfirm(false);
    }
  };

  const handlePaymentSuccess = async (method) => {
    setCart([]);
    setDiscount(0);
    setActiveUpiData(null);
    await finalizeOrder({ paymentMethod: method, confirmed: true });
    setShowCheckout(false);
    setTimeout(fetchActiveOrders, 500);
  };

  // Missing Ingredients Dialog handlers
  const handleRemoveProblematicProduct = () => {
    const lowerError = missingMessage.toLowerCase();
    const problematicItems = cart.filter((item) =>
      lowerError.includes(item.name.toLowerCase())
    );
    if (problematicItems.length > 0) {
      setCart((prev) =>
        prev.filter((i) => !problematicItems.some((p) => p.id === i.id))
      );
    }
    setShowMissingDialog(false);
  };

  const handleContinueAnyway = () => {
    setShowMissingDialog(false);
    finalizeOrder({ override_missing_ingredients: true });
  };

  const navItems = getNavItems();
  const isCashier = userRole === "cashier";

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden ${theme.bg.main} ${theme.text.main}`}
      style={{ fontFamily: FONTS.sans }}
    >
      {/* Header */}
      <header className={`h-16 flex items-center justify-between px-6 border-b ${theme.border.default} ${theme.bg.card}`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme.bg.subtle}`}>
              <Settings size={20} />
            </div>
            <h1 className="text-lg font-semibold">POS</h1>
          </div>

          {/* Navigation with Sliding Underline */}
          <nav
            className="flex items-center gap-1 relative"
            onMouseLeave={() => updateUnderline(activeTab)}
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                ref={(el) => {
                  if (el) navRefs.current[item.id] = el;
                }}
                onClick={() => (item.action ? item.action() : setActiveTab(item.id))}
                onMouseEnter={() => updateUnderline(item.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 z-10
                  ${activeTab === item.id && !item.action ? theme.text.main : theme.button.ghost}
                  ${item.isCritical ? "text-red-500 animate-pulse" : ""}
                  hover:bg-transparent`}
              >
                <item.icon size={16} className={item.isCritical ? "text-red-500" : ""} />
                <span className={isDarkMode ? "text-white" : "text-black"}>{item.label}</span>
                {item.badge > 0 && (
                  <span
                    className={`${item.isCritical ? "bg-red-600" : "bg-blue-600"} text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            {/* Sliding Underline Beam */}
            <div
              className="absolute bottom-0 h-0.5 bg-[#3B82F6] transition-all duration-300 ease-out rounded-full pointer-events-none"
              style={{
                left: underlineStyle.left,
                width: underlineStyle.width,
                boxShadow: isDarkMode ? "0 0 8px rgba(59,130,246,0.8)" : "0 0 8px rgba(59,130,246,0.4)",
              }}
            />
          </nav>
        </div>

        {/* Right Side Navigation */}
        <div className="flex items-center gap-3">
          <LowStockAlert lowStock={lowStock} isDarkMode={isDarkMode} />

          {/* Unified Hardware Button - Only for Cashier */}
          {isCashier && (
            <button
              onClick={connectHardware}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                hardwareConnected
                  ? "bg-green-500/20 text-green-500 border-green-500/30"
                  : `${theme.border.default} ${theme.button.ghost}`
              }`}
            >
              <Wifi size={16} className={hardwareConnected ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">
                {hardwareConnected ? "Hardware Ready" : "Connect Hardware"}
              </span>
            </button>
          )}

          <button onClick={onToggleTheme} className={`p-2 rounded-lg ${theme.button.ghost}`}>
            {isDarkMode ? <Sun size={18} className="text-white" /> : <Moon size={18} className="text-black" />}
          </button>

          {userRole === "admin" && (
            <button onClick={() => setSettingsOpen(true)} className={`p-2 rounded-lg ${theme.button.ghost}`}>
              <Settings size={18} />
            </button>
          )}

          <div className="flex items-center gap-3 pl-2 border-l" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)" }}>
            <div className="text-right hidden sm:block">
              <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-black"}`}>{displayName}</p>
              <p className={`text-xs uppercase font-medium tracking-wider ${theme.text.tertiary}`}>{userRole}</p>
            </div>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border.default} ${theme.bg.subtle}`}>
              <User size={16} className={theme.text.secondary} />
            </div>
          </div>

          <button onClick={onLogout} className={`p-2 rounded-lg ${theme.button.ghost}`}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden ${theme.bg.main}`}>
        <div className="flex-1 overflow-y-auto p-0 relative">
          <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Dashboard - Admin & Manager */}
            {activeTab === "dashboard" && ["admin", "manager"].includes(userRole) && (
              <div className="p-8">
                <SalesReport
                  history={salesHistory}
                  reportDate={reportDate}
                  setReportDate={setReportDate}
                  fetchSalesHistory={fetchSalesHistory}
                  isHistoryLoading={isHistoryLoading}
                  isDarkMode={isDarkMode}
                  activeOrders={orders}
                  kitchenCapacity={settings?.kitchenCapacity || 20}
                />
              </div>
            )}

            {/* Manager Dashboard */}
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

            {/* POS View - Cashier Only */}
            {activeTab === "pos" && isCashier && (
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
                userRole={userRole}
                onCompleteOrder={handleCompleteClick}
              />
            )}

            {/* Products Management - Admin & Manager */}
            {activeTab === "products" && ["admin", "manager"].includes(userRole) && (
              <ProductManagement
                rawProducts={rawProducts}
                categories={categories}
                isDarkMode={isDarkMode}
                onAdd={handleAdminAddProduct}
                onUpdate={handleAdminUpdateProduct}
                onDelete={handleAdminDeleteProduct}
              />
            )}

            {/* Inventory Management - Admin & Manager */}
            {activeTab === "inventory" && ["admin", "manager"].includes(userRole) && (
              <InventoryManager
                apiRequest={apiRequest}
                isDarkMode={isDarkMode}
              />
            )}

            {/* Recipe Management - Admin & Manager */}
            {activeTab === "recipes" && ["admin", "manager"].includes(userRole) && (
              <RecipeManager
                apiRequest={apiRequest}
                isDarkMode={isDarkMode}
                products={rawProducts}
              />
            )}

            {/* Staff Management - Admin & Manager */}
            {activeTab === "users" && ["admin", "manager"].includes(userRole) && (
              <StaffManagement
                isDarkMode={isDarkMode}
                currentUserRole={userRole}
                usersList={usersList}
                onAddUser={handleAdminAddUser}
                onEditUser={handleAdminUpdateUser}
                onDeleteUser={handleAdminDeleteUser}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
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
        onCompleteOrder={handleCompleteClick}
        onCallCustomer={(t) => sendToDock(t)}
        isDarkMode={isDarkMode}
      />

      {userRole === "admin" && (
        <AdminSettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          restaurantId={getRestaurantId()}
          isDarkMode={isDarkMode}
        />
      )}

      {/* ORDER COMPLETION CONFIRMATION MODAL */}
      <ConfirmCompleteModal
        isOpen={showCompleteConfirm}
        onClose={() => {
          setShowCompleteConfirm(false);
          setPendingOrderId(null);
          setPendingOrderToken(null);
        }}
        onConfirm={handleConfirmComplete}
        orderToken={pendingOrderToken}
        isDarkMode={isDarkMode}
      />

      {/* MISSING INGREDIENTS DIALOG */}
      {showMissingDialog && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${theme.bg.overlay} backdrop-blur-sm`}>
          <div className={`w-[95vw] sm:max-w-md flex flex-col p-6 ${COMMON_STYLES.modal(isDarkMode)}`}>
            <h2 className="text-xl font-bold text-red-500 mb-2">Inventory Alert</h2>
            <p className={`text-sm mb-4 ${theme.text.secondary}`}>
              Some ingredients are missing for selected items. Do you want to continue?
            </p>
            <div className={`p-3 rounded bg-red-500/10 border border-red-500/20 mb-6 max-h-40 overflow-y-auto ${theme.text.main} text-sm font-medium`}>
              {missingMessage}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleRemoveProblematicProduct} className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-[0.05em] rounded-md ${theme.button.secondary}`}>
                Remove Product
              </button>
              <button onClick={handleContinueAnyway} className="flex-1 py-3 text-[11px] font-bold uppercase tracking-[0.05em] rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors">
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GENERAL ERROR DIALOG */}
      {generalErrorDialog && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${theme.bg.overlay} backdrop-blur-sm`}>
          <div className={`w-[95vw] sm:max-w-sm flex flex-col p-6 ${COMMON_STYLES.modal(isDarkMode)}`}>
            <h2 className="text-lg font-bold text-red-500 mb-2">Error</h2>
            <p className={`text-sm mb-6 ${theme.text.main}`}>{generalErrorMessage}</p>
            <button onClick={() => setGeneralErrorDialog(false)} className={`w-full py-3 text-[11px] font-bold uppercase tracking-[0.05em] rounded-md ${theme.button.primary}`}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}