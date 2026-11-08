import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Coffee,
} from 'lucide-react';
import { api } from '../services/api';
import { CafeTable, Order, Ingredient, MenuItem } from '../types/cafe';
import { TabType } from '../components/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: TabType) => void;
  onOpenReceipt: (order: Order) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenReceipt }) => {
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [tRes, oRes, iRes, mRes] = await Promise.all([
        api.getTables(),
        api.getOrders(),
        api.getInventory(),
        api.getMenu(),
      ]);
      setTables(tRes.tables);
      setOrders(oRes);
      setIngredients(iRes.ingredients);
      setMenuItems(mRes.menuItems);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#4A2E1B] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#7A6A5C]">در حال بارگذاری اطلاعات داشبورد...</span>
        </div>
      </div>
    );
  }

  // Calculated metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const todaySettled = todayOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);

  const occupiedTablesCount = tables.filter(
    (t) => t.status === 'occupied' || t.status === 'kitchen_pending' || t.status === 'ready_to_serve'
  ).length;
  const emptyTablesCount = tables.filter((t) => t.status === 'empty').length;
  const reservedTablesCount = tables.filter((t) => t.status === 'reserved').length;
  const occupancyRate = tables.length > 0 ? Math.round((occupiedTablesCount / tables.length) * 100) : 0;

  const kitchenPendingCount = orders.filter((o) => o.status === 'preparing' || o.status === 'submitted').length;
  const readyToServeCount = orders.filter((o) => o.status === 'ready').length;

  const lowStock = ingredients.filter((i) => i.currentStock <= i.minThreshold);
  const avgOrderValue = todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length) : 0;

  // Top products
  const productSalesMap: Record<string, { count: number; revenue: number; item?: MenuItem }> = {};
  for (const o of orders) {
    for (const it of o.items) {
      if (!productSalesMap[it.menuItemId]) {
        productSalesMap[it.menuItemId] = {
          count: 0,
          revenue: 0,
          item: menuItems.find((m) => m.id === it.menuItemId),
        };
      }
      productSalesMap[it.menuItemId].count += it.quantity;
      productSalesMap[it.menuItemId].revenue += it.quantity * it.unitPrice;
    }
  }
  const topProducts = Object.entries(productSalesMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#4A2E1B] text-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-[#FAF7F2] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C4975A]" />
            <span>عملیات روز جاری نیکو کافه فعال است</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
            داشبورد مدیریت و مانیتورینگ زنده
          </h2>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-light">
            در حال حاضر {occupiedTablesCount} میز پذیرای مشتریان است و {kitchenPendingCount} تیکت در صف آماده‌سازی آشپزخانه و بار قرار دارد.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF7F2] text-[#4A2E1B] hover:bg-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ثبت سفارش جدید (POS)</span>
          </button>
          <button
            onClick={() => onNavigate('tables')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all"
          >
            <span>نقشه میزها</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Today */}
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#7A6A5C]">فروش کل امروز</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-[#2C1810] font-mono tabular-nums">
            {todayRevenue.toLocaleString('fa-IR')} <span className="text-xs font-normal text-[#7A6A5C]">تومان</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F5EFEB] flex items-center justify-between text-[11px] text-[#7A6A5C]">
            <span>دریافت نقدی/کارتی:</span>
            <span className="font-mono tabular-nums font-semibold text-[#2C1810]">
              {todaySettled.toLocaleString('fa-IR')} ت
            </span>
          </div>
        </div>

        {/* Orders Count & Average */}
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#7A6A5C]">سفارش‌های امروز</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-[#2C1810] font-mono tabular-nums">
            {todayOrders.length} <span className="text-xs font-normal text-[#7A6A5C]">سفارش</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F5EFEB] flex items-center justify-between text-[11px] text-[#7A6A5C]">
            <span>میانگین هر سفارش:</span>
            <span className="font-mono tabular-nums font-semibold text-[#2C1810]">
              {avgOrderValue.toLocaleString('fa-IR')} ت
            </span>
          </div>
        </div>

        {/* Table Occupancy */}
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#7A6A5C]">ضریب اشغال میزها</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-[#2C1810] font-mono tabular-nums">{occupancyRate}٪</span>
            <span className="text-xs text-[#7A6A5C]">({occupiedTablesCount} از {tables.length} میز)</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F5EFEB] flex items-center justify-between text-[11px] text-[#7A6A5C]">
            <span>میزهای خالی:</span>
            <span className="font-mono tabular-nums font-semibold text-emerald-700">{emptyTablesCount} میز</span>
          </div>
        </div>

        {/* Kitchen Status & Low Stock */}
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#7A6A5C]">صف آشپزخانه و انبار</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-[#2C1810] font-mono tabular-nums">{kitchenPendingCount}</span>
            <span className="text-xs text-[#7A6A5C]">تیکت در حال آماده‌سازی</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F5EFEB] flex items-center justify-between text-[11px]">
            <span className="text-[#7A6A5C]">هشدار موجودی انبار:</span>
            <span className={`font-mono tabular-nums font-bold ${lowStock.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {lowStock.length > 0 ? `${lowStock.length} قلم کمبود` : 'نرمال'}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Graphical Table Map Quick View & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Map Snapshot */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8DFD5] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#2C1810] text-sm">وضعیت لحظه‌ای سالن‌ها و میزها</h3>
              <p className="text-xs text-[#7A6A5C] mt-0.5">کلیک روی هر میز جهت مشاهده سفارش و صورتحساب</p>
            </div>
            <button
              onClick={() => onNavigate('tables')}
              className="text-xs text-[#4A2E1B] font-semibold flex items-center gap-1 hover:underline"
            >
              <span>مشاهده نقشه کامل</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {tables.slice(0, 10).map((tbl) => {
              const isOccupied = tbl.status === 'occupied';
              const isKitchen = tbl.status === 'kitchen_pending';
              const isReady = tbl.status === 'ready_to_serve';
              const isReserved = tbl.status === 'reserved';

              let woodGradient = 'from-[#B88654] via-[#9E6E3D] to-[#7D532B]';
              let badgeBg = 'bg-emerald-600 text-white';
              let badgeText = 'خالی';
              let glowColor = 'rgba(16, 185, 129, 0.2)';

              if (isOccupied) {
                woodGradient = 'from-[#A87442] via-[#8C5D30] to-[#6E4620]';
                badgeBg = 'bg-[#C84B31] text-white';
                badgeText = 'اشغال';
                glowColor = 'rgba(200, 75, 49, 0.3)';
              } else if (isKitchen) {
                badgeBg = 'bg-amber-600 text-white animate-pulse';
                badgeText = 'آشپزخانه';
                glowColor = 'rgba(245, 158, 11, 0.3)';
              } else if (isReady) {
                badgeBg = 'bg-sky-600 text-white animate-bounce';
                badgeText = 'آماده سرو';
                glowColor = 'rgba(14, 165, 233, 0.35)';
              } else if (isReserved) {
                woodGradient = 'from-[#8E5B32] via-[#754722] to-[#5C3415]';
                badgeBg = 'bg-purple-700 text-white';
                badgeText = 'رزرو';
                glowColor = 'rgba(147, 51, 234, 0.25)';
              }

              return (
                <button
                  key={tbl.id}
                  onClick={() => onNavigate('tables')}
                  style={{
                    filter: `drop-shadow(0 4px 6px ${glowColor})`,
                  }}
                  className="relative p-2.5 rounded-2xl border border-[#8C6239]/40 bg-[#FAF7F2] flex flex-col items-center justify-between text-center transition-all hover:scale-104 shadow-xs"
                >
                  {/* Miniature Table Top */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${woodGradient} border border-[#5A3825] flex flex-col items-center justify-center text-white shadow-inner relative`}
                  >
                    <span className="font-mono text-xs font-black drop-shadow-xs">#{tbl.number}</span>
                    <span className="text-[8px] text-amber-200">{tbl.seats} صندلی</span>
                  </div>

                  <span className={`mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${badgeBg}`}>
                    {badgeText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 pt-4 border-t border-[#F5EFEB] flex flex-wrap items-center gap-4 text-xs text-[#7A6A5C]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>خالی ({emptyTablesCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>اشغال ({tables.filter((t) => t.status === 'occupied').length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>در آشپزخانه ({tables.filter((t) => t.status === 'kitchen_pending').length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>آماده سرو ({readyToServeCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>رزرو ({reservedTablesCount})</span>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8DFD5] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#2C1810] text-sm">پرفروش‌ترین آیتم‌های کافه</h3>
              <button
                onClick={() => onNavigate('menu')}
                className="text-xs text-[#4A2E1B] font-semibold hover:underline"
              >
                مشاهده منو
              </button>
            </div>

            <div className="space-y-3.5">
              {topProducts.map((p, index) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#8C7A6B] w-4">{index + 1}</span>
                  <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] overflow-hidden shrink-0">
                    <img
                      src={p.item?.imageUrl || '/images/latte_art.jpg'}
                      alt={p.item?.nameFa || 'محصول'}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/latte_art.jpg';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#2C1810] truncate">{p.item?.nameFa || p.id}</p>
                    <p className="text-[10px] text-[#7A6A5C] truncate">{p.item?.nameEn}</p>
                  </div>
                  <div className="text-left font-mono tabular-nums shrink-0">
                    <span className="text-xs font-bold text-[#4A2E1B] block">{p.count} سفارش</span>
                    <span className="text-[10px] text-[#8C7A6B]">{(p.revenue).toLocaleString('fa-IR')} ت</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {lowStock.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">هشدار کمبود مواد اولیه: </span>
                {lowStock.map((i) => i.nameFa).join('، ')} به حداقل آستانه مصرف رسیده‌اند.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[#2C1810] text-sm">آخرین سفارش‌های ثبت‌شده</h3>
            <p className="text-xs text-[#7A6A5C] mt-0.5">وضعیت تسویه، صورتحساب و چاپ فیش رسمی</p>
          </div>
          <button
            onClick={() => onNavigate('sales')}
            className="text-xs text-[#4A2E1B] font-semibold hover:underline"
          >
            مشاهده همه سفارش‌ها
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[#F0E8DE] text-[#7A6A5C]">
                <th className="py-2.5 font-semibold">شماره</th>
                <th className="py-2.5 font-semibold">میز / نوع</th>
                <th className="py-2.5 font-semibold">مشتری</th>
                <th className="py-2.5 font-semibold">اقلام سفارش</th>
                <th className="py-2.5 font-semibold">مبلغ کل (تومان)</th>
                <th className="py-2.5 font-semibold">وضعیت تسویه</th>
                <th className="py-2.5 font-semibold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F2EB]">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                  <td className="py-3 font-mono font-bold text-[#4A2E1B]">#{order.orderNumber}</td>
                  <td className="py-3">
                    {order.tableNumber ? (
                      <span className="font-semibold text-[#2C1810]">میز {order.tableNumber}</span>
                    ) : (
                      <span className="text-[#7A6A5C]">بیرون‌بر</span>
                    )}
                  </td>
                  <td className="py-3 text-[#2C1810]">{order.customerName}</td>
                  <td className="py-3 text-[#7A6A5C] max-w-[200px] truncate">
                    {order.items.map((it) => `${it.nameFa} (${it.quantity})`).join('، ')}
                  </td>
                  <td className="py-3 font-mono tabular-nums font-bold text-[#2C1810]">
                    {order.totalAmount.toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {order.paymentStatus === 'paid' ? 'تسویه شده' : 'در انتظار تسویه'}
                    </span>
                  </td>
                  <td className="py-3 text-left">
                    <button
                      onClick={() => onOpenReceipt(order)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#4A2E1B] hover:bg-[#FAF7F2] rounded-lg border border-[#E8DFD5] transition-colors"
                    >
                      رسید
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
