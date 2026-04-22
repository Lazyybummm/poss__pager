// components/ui/ManagerDashboard.jsx
// Professional dashboard with clean design

import React, { useEffect, useState } from "react";
import { getTheme, COMMON_STYLES, FONTS } from "../shared/theme";
import { TrendingUp, ShoppingCart, Package, Users, Coffee, Clock, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ManagerDashboard({ apiRequest, isDarkMode, settings }) {
  const theme = getTheme(isDarkMode);
  
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const KITCHEN_CAPACITY = settings?.kitchenCapacity || 20;
  
  const fetchDashboard = async () => {
    try {
      const [s, l, t, a] = await Promise.all([
        apiRequest(`${API_URL}/dashboard/summary`),
        apiRequest(`${API_URL}/dashboard/low-stock`),
        apiRequest(`${API_URL}/dashboard/top-products`),
        apiRequest(`${API_URL}/dashboard/active-orders`),
      ]);
      
      if (s.ok) setSummary(await s.json());
      if (l.ok) setLowStock(await l.json());
      if (t.ok) setTopProducts(await t.json());
      if (a.ok) setActiveOrders(await a.json());
      
      setLoading(false);
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    }
  };
  
  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const trueActiveOrders = activeOrders.filter(o => (o.status || "").toLowerCase() === "active");
  const kitchenLoad = Math.min(trueActiveOrders.length / KITCHEN_CAPACITY, 1);
  
  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm opacity-60">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
          Real-time operational overview
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue Card */}
        <div className="p-5 rounded-xl border transition-all hover:shadow-lg" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-[#002366]/10">
              <TrendingUp size={20} className="text-[#002366]" />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
              Today
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
            ₹{summary?.today_revenue?.toLocaleString() || 0}
          </p>
          <p className="text-xs mt-2" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
            Total Revenue
          </p>
        </div>
        
        {/* Orders Card */}
        <div className="p-5 rounded-xl border transition-all hover:shadow-lg" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-[#002366]/10">
              <ShoppingCart size={20} className="text-[#002366]" />
            </div>
          </div>
          <p className="text-2xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
            {summary?.today_orders || 0}
          </p>
          <p className="text-xs mt-2" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
            Orders Today
          </p>
        </div>
        
        {/* Active Orders Card */}
        <div className="p-5 rounded-xl border transition-all hover:shadow-lg" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-[#002366]/10">
              <Package size={20} className="text-[#002366]" />
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              kitchenLoad > 0.8 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
            }`}>
              {Math.round(kitchenLoad * 100)}% Load
            </div>
          </div>
          <p className="text-2xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
            {trueActiveOrders.length}
          </p>
          <p className="text-xs mt-2" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
            Active in Kitchen
          </p>
          {/* Progress Bar */}
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)" }}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${kitchenLoad * 100}%`,
                backgroundColor: kitchenLoad < 0.5 ? "#10b981" : kitchenLoad < 0.8 ? "#f59e0b" : "#ef4444"
              }}
            />
          </div>
        </div>
        
        {/* Capacity Card */}
        <div className="p-5 rounded-xl border transition-all hover:shadow-lg" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-[#002366]/10">
              <Users size={20} className="text-[#002366]" />
            </div>
          </div>
          <p className="text-2xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
            {trueActiveOrders.length}/{KITCHEN_CAPACITY}
          </p>
          <p className="text-xs mt-2" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
            Kitchen Capacity
          </p>
        </div>
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Orders Table */}
        <div className="rounded-xl border overflow-hidden" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#002366]" />
              <h3 className="text-sm font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>Active Orders</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>Live</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}>
                  <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>Token</th>
                  <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>Time</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}>
                {trueActiveOrders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-sm" style={{ color: isDarkMode ? "rgba(255,255,240,0.4)" : "rgba(0,0,0,0.4)" }}>
                      No active orders
                    </td>
                  </tr>
                ) : (
                  trueActiveOrders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="px-5 py-3">
                        <span className="font-mono font-bold text-[#002366] dark:text-[#FFFFF0]">#{order.token}</span>
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>₹{order.total_amount}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400">
                          <div className="w-1 h-1 rounded-full bg-orange-500" />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Top Products */}
        <div className="rounded-xl border overflow-hidden" style={{
          backgroundColor: isDarkMode ? "#111111" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}>
            <div className="flex items-center gap-2">
              <Coffee size={18} className="text-[#002366]" />
              <h3 className="text-sm font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>Top Selling Products</h3>
            </div>
          </div>
          
          <div className="p-5 space-y-3">
            {topProducts.slice(0, 5).map((product, index) => (
              <div key={product.product_id} className="flex items-center justify-between p-3 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#002366]/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#002366]">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>{product.name}</p>
                    <p className="text-xs" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
                      {product.total_sold} units sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">₹{product.revenue || product.total_sold * 100}</p>
                </div>
              </div>
            ))}
            
            {topProducts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: isDarkMode ? "rgba(255,255,240,0.4)" : "rgba(0,0,0,0.4)" }}>
                  No sales data available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}