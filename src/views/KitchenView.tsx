import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Coffee,
  AlertCircle,
  Play,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { Order } from '../types/cafe';

export const KitchenView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'preparing' | 'ready'>('all');
  const [loading, setLoading] = useState(true);

  const loadKitchenOrders = async () => {
    try {
      const data = await api.getKitchenOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKitchenOrders();
    const interval = setInterval(loadKitchenOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleItemStatusChange = async (orderId: string, itemId: string, nextStatus: string) => {
    try {
      await api.updateKitchenItemStatus(orderId, itemId, nextStatus);
      await loadKitchenOrders();
    } catch (err: any) {
      alert(err.message || 'خطا در به‌روزرسانی وضعیت آیتم');
    }
  };

  const handleServeAll = async (orderId: string) => {
    try {
      await api.serveAllKitchenItems(orderId);
      await loadKitchenOrders();
    } catch (err: any) {
      alert(err.message || 'خطا در تحویل سفارش');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'preparing') return o.status === 'submitted' || o.status === 'preparing';
    if (filter === 'ready') return o.status === 'ready';
    return true;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* KDS Header & Filter */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#2C1810] flex items-center gap-2">
            <span>صف سفارش‌های فعال آشپزخانه و بار قهوه</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            به‌روزرسانی خودکار هر ۵ ثانیه · اولویت با سفارش‌های با زمان انتظار بیشتر
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-[#4A2E1B] text-white shadow-xs'
                  : 'text-[#614D3E] hover:text-[#2C1810]'
              }`}
            >
              همه ({orders.length})
            </button>
            <button
              onClick={() => setFilter('preparing')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === 'preparing'
                  ? 'bg-[#4A2E1B] text-white shadow-xs'
                  : 'text-[#614D3E] hover:text-[#2C1810]'
              }`}
            >
              در حال آماده‌سازی ({orders.filter((o) => o.status !== 'ready').length})
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === 'ready'
                  ? 'bg-[#4A2E1B] text-white shadow-xs'
                  : 'text-[#614D3E] hover:text-[#2C1810]'
              }`}
            >
              آماده تحویل ({orders.filter((o) => o.status === 'ready').length})
            </button>
          </div>

          <button
            onClick={loadKitchenOrders}
            className="p-2 text-[#7A6A5C] hover:text-[#2C1810] hover:bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] transition-colors"
            title="به‌روزرسانی دستی"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#E8DFD5] p-12 text-center text-[#8C7A6B]">
          <Coffee className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#4A2E1B]" />
          <h3 className="text-sm font-bold text-[#2C1810]">صف سفارش‌ها خالی است</h3>
          <p className="text-xs text-[#7A6A5C] mt-1">سفارش جدیدی برای بار قهوه یا آشپزخانه در انتظار نیست.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const elapsedMins = Math.max(
              1,
              Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000)
            );
            const isLate = elapsedMins > 15;
            const isReady = order.status === 'ready';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                  isReady
                    ? 'border-sky-300 ring-2 ring-sky-200'
                    : isLate
                    ? 'border-rose-300 ring-2 ring-rose-200'
                    : 'border-[#E8DFD5]'
                }`}
              >
                {/* Order Ticket Header */}
                <div
                  className={`p-4 border-b flex items-center justify-between ${
                    isReady ? 'bg-sky-50/70 border-sky-200' : 'bg-[#FAF7F2] border-[#E8DFD5]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-base font-black text-[#4A2E1B]">
                      #{order.orderNumber}
                    </span>
                    <span className="font-bold text-xs text-[#2C1810]">
                      {order.tableNumber ? `میز شماره ${order.tableNumber}` : 'سفارش بیرون‌بر'}
                    </span>
                  </div>

                  {/* Elapsed Timer */}
                  <div
                    className={`flex items-center gap-1 text-xs font-mono tabular-nums font-bold px-2 py-0.5 rounded-lg ${
                      isLate
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : 'bg-white text-[#543825] border border-[#E8DFD5]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsedMins} دقیقه پیش</span>
                  </div>
                </div>

                {/* Meta details */}
                <div className="px-4 py-2 bg-[#FFFDFB] border-b border-[#F5EFEB] flex items-center justify-between text-[11px] text-[#7A6A5C]">
                  <span>مهماندار: {order.waiterName || 'نیکو کافه'}</span>
                  <span>{order.customerName}</span>
                </div>

                {/* Ticket Items */}
                <div className="p-4 flex-1 space-y-3 divide-y divide-[#F5EFEB]">
                  {order.items.map((item) => (
                    <div key={item.id} className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-[#4A2E1B]/10 text-[#4A2E1B] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {item.quantity}×
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[#2C1810] text-sm leading-snug">{item.nameFa}</p>
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <p className="text-[10px] text-[#8C7A6B] mt-0.5">
                              {item.selectedOptions.join(' · ')}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-1 font-semibold">
                              یادداشت: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Item state progress button */}
                      <div className="shrink-0">
                        {item.status === 'ready' || item.status === 'served' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>آماده شد</span>
                          </span>
                        ) : item.status === 'preparing' ? (
                          <button
                            onClick={() => handleItemStatusChange(order.id, item.id, 'ready')}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition-colors"
                          >
                            اتمام تهیه
                          </button>
                        ) : (
                          <button
                            onClick={() => handleItemStatusChange(order.id, item.id, 'preparing')}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#4A2E1B] hover:bg-[#382315] text-white text-[11px] font-semibold rounded-xl shadow-xs transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            <span>شروع</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ticket Bottom Actions */}
                <div className="p-3 bg-[#FAF7F2] border-t border-[#E8DFD5] flex items-center justify-between">
                  <span className="text-[11px] text-[#7A6A5C]">
                    وضعیت کلی: <span className="font-bold text-[#2C1810]">{isReady ? 'آماده سرو' : 'در حال آماده‌سازی'}</span>
                  </span>

                  <button
                    onClick={() => handleServeAll(order.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تحویل به مهماندار</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
