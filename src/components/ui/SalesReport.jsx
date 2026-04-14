// Updated SalesReport.jsx - With Missing Ingredients Sold Section
import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  Info,
  Inbox,
  Loader2,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Package,
  ChevronDown,
  ChevronUp,
  Flame
} from 'lucide-react';
import { getTheme, COMMON_STYLES, FONTS } from './theme';

export default function SalesReport({
  history = [],
  reportDate,
  setReportDate,
  isDarkMode,
  isHistoryLoading,
  activeOrders = [],
  kitchenCapacity = 20,
}) {
  const theme = getTheme(isDarkMode);
  const [showMissingProducts, setShowMissingProducts] = useState(true);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const safeDatePart = (value) => {
    if (!value) return '';
    const text = String(value);
    return text.includes('T') ? text.split('T')[0] : text.slice(0, 10);
  };

  const parseDate = (value) => {
    if (!value) return null;
    const text = String(value);
    const normalized = text.includes('Z') || text.includes('+') ? text : `${text}Z`;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const ordersForDate = useMemo(() => {
    return Array.isArray(history)
      ? history.filter((order) => safeDatePart(order.created_at) === reportDate)
      : [];
  }, [history, reportDate]);

  // Calculate missing ingredients products sold
  const missingProductsSold = useMemo(() => {
    const productMap = new Map(); // product_name -> { count, total_revenue, product_id, category }
    
    ordersForDate.forEach((order) => {
      // Check if order has missing ingredients
      const missingIngredients = order.missing_ingredients;
      if (missingIngredients && missingIngredients.length > 0 && order.items) {
        // For each item in the order
        order.items.forEach((item) => {
          const productName = item.name;
          const quantity = item.quantity || 1;
          const subtotal = item.subtotal || (item.price * quantity);
          
          if (productMap.has(productName)) {
            const existing = productMap.get(productName);
            existing.count += quantity;
            existing.total_revenue += subtotal;
          } else {
            productMap.set(productName, {
              name: productName,
              count: quantity,
              total_revenue: subtotal,
              product_id: item.product_id,
              category: item.category || 'General'
            });
          }
        });
      }
    });
    
    // Convert to array and sort by count (descending)
    return Array.from(productMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Show top 10
  }, [ordersForDate]);

  const summary = useMemo(() => {
    const revenue = ordersForDate.reduce(
      (total, order) => total + Number(order.total_amount || 0),
      0
    );
    const ordersCount = ordersForDate.length;
    const averageOrder = ordersCount > 0 ? revenue / ordersCount : 0;

    const hourlyRevenue = Array(24).fill(0);
    const hourlyOrders = Array(24).fill(0);

    ordersForDate.forEach((order) => {
      const dateObj = parseDate(order.created_at);
      if (!dateObj) return;
      const hour = dateObj.getHours();
      hourlyRevenue[hour] += Number(order.total_amount || 0);
      hourlyOrders[hour] += 1;
    });

    let peakHour = null;
    let peakHourRevenue = 0;
    hourlyRevenue.forEach((value, hour) => {
      if (value > peakHourRevenue) {
        peakHourRevenue = value;
        peakHour = hour;
      }
    });

    const statusCounts = ordersForDate.reduce((accumulator, order) => {
      const status = String(order.status || 'unknown').toLowerCase();
      accumulator[status] = (accumulator[status] || 0) + 1;
      return accumulator;
    }, {});

    return {
      revenue,
      ordersCount,
      averageOrder,
      peakHour,
      peakHourRevenue,
      hourlyRevenue,
      hourlyOrders,
      statusCounts,
    };
  }, [ordersForDate]);

  const chartData = summary.hourlyRevenue;

  const recentOrders = useMemo(() => {
    return [...ordersForDate]
      .sort((left, right) => {
        const leftTime = parseDate(left.created_at)?.getTime() || 0;
        const rightTime = parseDate(right.created_at)?.getTime() || 0;
        return rightTime - leftTime;
      })
      .slice(0, 6);
  }, [ordersForDate]);

  const activeOrderCount = Array.isArray(activeOrders)
    ? activeOrders.filter((order) => (order.status || '').toLowerCase() === 'active').length
    : 0;
  const kitchenLoad = Math.min(activeOrderCount / Math.max(kitchenCapacity || 20, 1), 1);

  const hasOrders = summary.ordersCount > 0;
  const maxSales = useMemo(() => {
    const high = Math.max(...chartData);
    return high > 0 ? high : 100;
  }, [chartData]);

  const statusPill = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (['completed', 'paid', 'done', 'fulfilled'].includes(normalized)) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (['active', 'preparing', 'pending'].includes(normalized)) {
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    }
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

  const totalMissingSold = missingProductsSold.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="flex flex-col h-full antialiased" style={{ fontFamily: FONTS.sans }}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm opacity-50">Activity Overview</p>
        </div>
        <div className="flex gap-3">
          <div className="relative h-10 w-48 group"> 
            <div className={`absolute inset-0 flex items-center gap-3 px-4 py-2 rounded-lg border ${COMMON_STYLES.card(isDarkMode)} border-zinc-800 group-hover:border-blue-500/50 transition-colors pointer-events-none z-10`}>
              <Calendar size={18} className="text-blue-400" />
              <span className="text-sm font-mono font-bold">{reportDate}</span>
            </div>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              onClick={(e) => e.target.showPicker?.()} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className={`${COMMON_STYLES.card(isDarkMode)} p-5 flex items-center gap-4`}>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Today&apos;s Revenue</p>
            <h3 className="text-2xl font-black">₹{formatCurrency(summary.revenue)}</h3>
          </div>
        </div>

        <div className={`${COMMON_STYLES.card(isDarkMode)} p-5 flex items-center gap-4`}>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <ReceiptText size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Orders Placed</p>
            <h3 className="text-2xl font-black">{summary.ordersCount}</h3>
          </div>
        </div>

        <div className={`${COMMON_STYLES.card(isDarkMode)} p-5 flex items-center gap-4`}>
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Average Ticket</p>
            <h3 className="text-2xl font-black">₹{formatCurrency(summary.averageOrder)}</h3>
          </div>
        </div>

        <div className={`${COMMON_STYLES.card(isDarkMode)} p-5 flex items-center gap-4`}>
          <div className={`p-3 rounded-xl ${kitchenLoad > 0.8 ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Live Kitchen Load</p>
            <h3 className="text-2xl font-black">{activeOrderCount} / {kitchenCapacity}</h3>
          </div>
        </div>
      </div>

      {/* PREMIUM MISSING INGREDIENTS SECTION */}
      {missingProductsSold.length > 0 && (
        <div className={`mb-6 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${COMMON_STYLES.card(isDarkMode)}`}>
          {/* Section Header */}
          <div 
            className="px-6 py-4 border-b flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            onClick={() => setShowMissingProducts(!showMissingProducts)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Flame size={20} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Products Sold with Missing Ingredients</h3>
                <p className="text-xs opacity-60 mt-0.5">
                  {totalMissingSold} units sold across {missingProductsSold.length} products while ingredients were low
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">
                ⚠️ Needs Attention
              </span>
              {showMissingProducts ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>

          {/* Section Content */}
          {showMissingProducts && (
            <div className="p-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-2xl font-bold text-amber-500">{missingProductsSold.length}</p>
                  <p className="text-xs opacity-60 mt-1">Products Affected</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-2xl font-bold text-amber-500">{totalMissingSold}</p>
                  <p className="text-xs opacity-60 mt-1">Total Units Sold</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-2xl font-bold text-amber-500">
                    ₹{formatCurrency(missingProductsSold.reduce((sum, p) => sum + p.total_revenue, 0))}
                  </p>
                  <p className="text-xs opacity-60 mt-1">Revenue Generated</p>
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${theme.border.light}`}>
                      <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider opacity-60">#</th>
                      <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider opacity-60">Product</th>
                      <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider opacity-60">Category</th>
                      <th className="text-right py-3 px-3 text-xs font-bold uppercase tracking-wider opacity-60">Units Sold</th>
                      <th className="text-right py-3 px-3 text-xs font-bold uppercase tracking-wider opacity-60">Revenue</th>
                      <th className="text-center py-3 px-3 text-xs font-bold uppercase tracking-wider opacity-60">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {missingProductsSold.map((product, idx) => (
                      <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3">
                          <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-amber-500">#{idx + 1}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs opacity-50">ID: {product.product_id || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                            {product.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-mono font-bold text-amber-500">{product.count}</span>
                          <span className="text-xs opacity-50 ml-1">units</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono">₹{formatCurrency(product.total_revenue)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500">
                            <AlertTriangle size={10} />
                            Low Stock Sold
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Note */}
              <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs opacity-60">
                  <AlertTriangle size={12} />
                  <span>Products that were sold while some ingredients were below threshold</span>
                </div>
                <div className="text-xs opacity-40">
                  Sorted by units sold (descending)
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRAPH CONTAINER */}
      <div
        className={`rounded-2xl border p-8 ${COMMON_STYLES.card(isDarkMode)} border-zinc-800 shadow-2xl flex flex-col relative overflow-hidden`}
        style={{ minHeight: 400 }}
      >
        
        {/* LOADING OVERLAY */}
        {isHistoryLoading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-sm font-medium text-blue-400">Synchronizing data...</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-10">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock size={18} className="text-blue-500" /> Hourly Sales ({reportDate})
          </h2>
          <div className="flex items-center gap-2 text-[11px] opacity-50">
            <Info size={12} />
            Peak hour {summary.peakHour !== null ? `${String(summary.peakHour).padStart(2, '0')}:00` : 'n/a'}
          </div>
        </div>
        
        {!hasOrders && !isHistoryLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 space-y-4 py-8">
            <Inbox size={64} strokeWidth={1} />
            <p className="text-xl font-semibold">No orders placed</p>
            <p className="text-sm text-center max-w-md">
              There are no orders for {reportDate} yet. 
            </p>
          </div>
        ) : (
          <div className="h-56 flex gap-2 items-end px-2 border-b border-zinc-800/50 pb-2">
            {chartData.map((val, h) => {
              const heightPercentage = (val / maxSales) * 100;
              return (
                <div key={h} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {val > 0 && (
                    <div className="absolute -top-12 bg-zinc-900 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-40 border border-zinc-700 shadow-2xl">
                      <div className="font-bold text-blue-400">₹{val}</div>
                      <div className="text-[8px] opacity-50">{h}:00</div>
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t-sm transition-all duration-700 ease-out ${
                      val > 0 ? 'bg-blue-500 border-t border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-zinc-800/10'
                    }`}
                    style={{ height: val > 0 ? `${Math.max(heightPercentage, 10)}%` : '2px' }}
                  />
                  <span className={`text-[9px] mt-3 font-mono ${val > 0 ? 'text-blue-400 font-bold' : 'opacity-20'}`}>
                    {h.toString().padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-auto pt-6 flex items-center gap-2 text-[11px] opacity-40 italic">
          <Info size={12} /> Data reflects local browser time (IST).
        </div>
      </div>

      <div className={`${COMMON_STYLES.card(isDarkMode)} mt-6 p-6`}>
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <p className="text-sm opacity-50">A quick operational view for the selected day</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] opacity-50">
            <Calendar size={12} />
            {summary.statusCounts.completed || 0} completed
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-center opacity-40">
            <p>No orders placed for the selected date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider opacity-60">
                <tr>
                  <th className="p-3 text-left font-bold">Token #</th>
                  <th className="p-3 text-left font-bold">Amount</th>
                  <th className="p-3 text-left font-bold">Status</th>
                  <th className="p-3 text-right font-bold">Order Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {recentOrders.map((order) => {
                  const parsedDate = parseDate(order.created_at);
                  const hasMissing = order.missing_ingredients && order.missing_ingredients.length > 0;
                  return (
                    <tr key={order.id || `${order.token}-${order.created_at}`} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-400">{order.token || '—'}</td>
                      <td className="p-3 font-mono">₹{formatCurrency(order.total_amount)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase ${statusPill(order.status)}`}>
                            {order.status || 'unknown'}
                          </span>
                          {hasMissing && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-amber-500/10 text-amber-500">
                              <AlertTriangle size={8} />
                              Missing
                            </span>
                          )}
                        </div>
                       </td>
                      <td className="p-3 text-right opacity-60 text-xs">
                        {parsedDate
                          ? parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                       </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}