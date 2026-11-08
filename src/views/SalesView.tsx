import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  XCircle,
  Clock,
  DollarSign,
  CreditCard,
  Banknote,
  X,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Order } from '../types/cafe';

interface SalesViewProps {
  onOpenReceipt: (order: Order) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onOpenReceipt }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Cancel order modal
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder) return;
    try {
      await api.cancelOrder(cancelModalOrder.id, cancelReason);
      await loadOrders();
      setCancelModalOrder(null);
      setCancelReason('');
    } catch (err: any) {
      alert(err.message || 'خطا در لغو سفارش');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      !search ||
      String(o.orderNumber).includes(search) ||
      (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (o.tableNumber && String(o.tableNumber).includes(search));
    return matchesStatus && matchesSearch;
  });

  const totalSalesVolume = filteredOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#2C1810]">مدیریت سفارش‌ها و فاکتورهای فروش</h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            سوابق تمام فاکتورهای صادر شده، وضعیت پرداخت، چاپ مجدد رسید و گزارش لغو سفارش‌ها
          </p>
        </div>

        <div className="bg-[#FAF7F2] px-4 py-2 rounded-xl border border-[#E8DFD5] text-xs">
          <span className="text-[#7A6A5C]">مجموع مبالغ فیلترشده: </span>
          <span className="font-mono tabular-nums font-bold text-[#4A2E1B] text-sm">
            {totalSalesVolume.toLocaleString('fa-IR')} تومان
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جست‌وجو با شماره فاکتور، نام مشتری یا شماره میز..."
            className="w-full pl-4 pr-10 py-2.5 bg-white text-xs rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
          />
          <Search className="w-4 h-4 text-[#8C7A6B] absolute right-3.5 top-3" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 p-1 bg-white rounded-xl border border-[#E8DFD5]">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === 'all' ? 'bg-[#4A2E1B] text-white shadow-xs' : 'text-[#614D3E]'
            }`}
          >
            همه ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('settled')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === 'settled' ? 'bg-[#4A2E1B] text-white shadow-xs' : 'text-[#614D3E]'
            }`}
          >
            تسویه شده ({orders.filter((o) => o.status === 'settled').length})
          </button>
          <button
            onClick={() => setStatusFilter('submitted')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === 'submitted' || statusFilter === 'preparing' || statusFilter === 'ready'
                ? 'bg-[#4A2E1B] text-white shadow-xs'
                : 'text-[#614D3E]'
            }`}
          >
            جاری / تسویه‌نشده
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              statusFilter === 'cancelled' ? 'bg-[#4A2E1B] text-white shadow-xs' : 'text-[#614D3E]'
            }`}
          >
            لغو شده ({orders.filter((o) => o.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E8DFD5] text-[#7A6A5C]">
                <th className="py-3 px-4 font-semibold">شماره سفارش</th>
                <th className="py-3 px-4 font-semibold">تاریخ و ساعت</th>
                <th className="py-3 px-4 font-semibold">میز / نوع</th>
                <th className="py-3 px-4 font-semibold">مشتری</th>
                <th className="py-3 px-4 font-semibold">اقلام سفارش</th>
                <th className="py-3 px-4 font-semibold">مبلغ کل</th>
                <th className="py-3 px-4 font-semibold">وضعیت تسویه</th>
                <th className="py-3 px-4 font-semibold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F2EB]">
              {filteredOrders.map((order) => {
                const isPaid = order.paymentStatus === 'paid';
                const isCancelled = order.status === 'cancelled';

                return (
                  <tr key={order.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums font-bold text-[#4A2E1B]">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[#7A6A5C]">
                      {new Date(order.createdAt).toLocaleDateString('fa-IR')} ·{' '}
                      {new Date(order.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#2C1810]">
                      {order.tableNumber ? `میز شماره ${order.tableNumber}` : 'بیرون‌بر'}
                    </td>
                    <td className="py-3 px-4 text-[#2C1810]">{order.customerName}</td>
                    <td className="py-3 px-4 text-[#7A6A5C] max-w-[240px] truncate">
                      {order.items.map((it) => `${it.nameFa} (${it.quantity})`).join('، ')}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums font-black text-[#2C1810]">
                      {order.totalAmount.toLocaleString('fa-IR')} ت
                    </td>
                    <td className="py-3 px-4">
                      {isCancelled ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-600">
                          لغو شده
                        </span>
                      ) : isPaid ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800">
                          تسویه کامل
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800">
                          در انتظار تسویه
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenReceipt(order)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#4A2E1B] hover:bg-[#FAF7F2] rounded-lg border border-[#E8DFD5] transition-colors"
                          title="مشاهده و چاپ رسید"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>رسید</span>
                        </button>

                        {!isPaid && !isCancelled && (
                          <button
                            onClick={() => {
                              setCancelModalOrder(order);
                              setCancelReason('');
                            }}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                            title="لغو سفارش"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#2C1810] text-sm mb-2">
              لغو سفارش #{cancelModalOrder.orderNumber}
            </h3>
            <p className="text-xs text-[#7A6A5C] mb-4">
              بر اساس قوانین نظارتی کافه، ثبت علت لغو فاکتور در لاگ سیستم الزامی است:
            </p>

            <form onSubmit={handleCancelOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#543825] mb-1">دلیل لغو سفارش</label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="مثلاً انصراف مهمان، سفارش اشتباه گارسون..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="px-3 py-2 text-[#7A6A5C] hover:text-[#2C1810]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white font-bold rounded-xl"
                >
                  تأیید لغو سفارش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
