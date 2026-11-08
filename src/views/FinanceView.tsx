import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Lock,
  Unlock,
  Receipt,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { CashShift, Expense, CafeSettings, Order } from '../types/cafe';

export const FinanceView: React.FC = () => {
  const [cashShifts, setCashShifts] = useState<CashShift[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<CafeSettings | null>(null);

  // Modals
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Open Shift Form
  const [initialFloat, setInitialFloat] = useState(2000000);
  const [shiftNotes, setShiftNotes] = useState('');

  // Close Shift Form
  const [closingShiftId, setClosingShiftId] = useState('');
  const [actualCash, setActualCash] = useState(2000000);
  const [closeNotes, setCloseNotes] = useState('');

  // Expense Form
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'supplies' | 'salaries' | 'utilities' | 'maintenance' | 'other'>('supplies');
  const [expenseAmount, setExpenseAmount] = useState(500000);
  const [expenseDesc, setExpenseDesc] = useState('');

  const loadFinanceData = async () => {
    try {
      const [fRes, oRes] = await Promise.all([api.getFinance(), api.getOrders()]);
      setCashShifts(fRes.cashShifts);
      setExpenses(fRes.expenses);
      setSettings(fRes.settings);
      setOrders(oRes);
    } catch (err) {
      console.error('Error fetching finance data:', err);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.openCashShift(Number(initialFloat), shiftNotes);
      await loadFinanceData();
      setShowOpenShiftModal(false);
      setShiftNotes('');
    } catch (err: any) {
      alert(err.message || 'خطا در باز کردن شیفت');
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.closeCashShift(closingShiftId, Number(actualCash), closeNotes);
      await loadFinanceData();
      setShowCloseShiftModal(false);
      setCloseNotes('');
    } catch (err: any) {
      alert(err.message || 'خطا در بستن شیفت');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createExpense({
        title: expenseTitle,
        category: expenseCategory,
        amount: Number(expenseAmount),
        description: expenseDesc,
      });
      await loadFinanceData();
      setShowAddExpenseModal(false);
      setExpenseTitle('');
      setExpenseDesc('');
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت سند هزینه');
    }
  };

  const activeShift = cashShifts.find((s) => s.status === 'open');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRevenue = orders
    .filter((o) => o.createdAt.startsWith(todayStr) && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.paidAmount, 0);

  const todayExpenses = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const todayNetProfit = todayRevenue - todayExpenses;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#2C1810]">امور مالی، صندوق و تراز شیفت‌های کاری</h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            ثبت موجودی اولیه صندوق، بررسی کسری یا مازاد، ثبت هزینه‌ها و محاسبه سود روزانه
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeShift ? (
            <button
              onClick={() => {
                setClosingShiftId(activeShift.id);
                setActualCash(activeShift.expectedCash || 2000000);
                setShowCloseShiftModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>بستن و تراز شیفت فعلی</span>
            </button>
          ) : (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Unlock className="w-4 h-4" />
              <span>باز کردن شیفت جدید صندوق</span>
            </button>
          )}

          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#4A2E1B] hover:bg-[#382315] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت هزینه جدید</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#7A6A5C]">درآمد وصول‌شده امروز</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-[#2C1810] font-mono tabular-nums">
            {todayRevenue.toLocaleString('fa-IR')} <span className="text-xs font-normal text-[#7A6A5C]">تومان</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#7A6A5C]">هزینه‌های ثبت‌شده امروز</span>
            <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-[#2C1810] font-mono tabular-nums">
            {todayExpenses.toLocaleString('fa-IR')} <span className="text-xs font-normal text-[#7A6A5C]">تومان</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#7A6A5C]">سود خالص عملیاتی امروز</span>
            <span className="w-8 h-8 rounded-lg bg-[#4A2E1B]/10 text-[#4A2E1B] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-xl font-black font-mono tabular-nums ${todayNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {todayNetProfit.toLocaleString('fa-IR')} <span className="text-xs font-normal text-[#7A6A5C]">تومان</span>
          </div>
        </div>
      </div>

      {/* Cash Shifts & Expenses 2-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Register Shifts */}
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
          <h3 className="font-bold text-[#2C1810] text-sm mb-4">تاریخچه شیفت‌های صندوق</h3>
          <div className="space-y-3">
            {cashShifts.map((shift) => (
              <div
                key={shift.id}
                className="p-3.5 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2]/50 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#2C1810]">صندوقدار: {shift.cashierName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        shift.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {shift.status === 'open' ? 'شیفت باز' : 'بسته و تراز شده'}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#7A6A5C]">
                    {new Date(shift.openedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-[#8C7A6B] block">تنخواه اولیه:</span>
                    <span className="font-mono tabular-nums font-bold text-[#2C1810]">
                      {shift.initialFloat.toLocaleString('fa-IR')} ت
                    </span>
                  </div>
                  {shift.actualCash !== undefined && (
                    <div>
                      <span className="text-[#8C7A6B] block">موجودی شمارش‌شده:</span>
                      <span className="font-mono tabular-nums font-bold text-[#2C1810]">
                        {shift.actualCash.toLocaleString('fa-IR')} ت
                      </span>
                    </div>
                  )}
                  {shift.difference !== undefined && (
                    <div>
                      <span className="text-[#8C7A6B] block">کسری / مازاد:</span>
                      <span
                        className={`font-mono tabular-nums font-bold ${
                          shift.difference === 0
                            ? 'text-emerald-700'
                            : shift.difference > 0
                            ? 'text-blue-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {shift.difference === 0 ? 'تراز دقیق' : `${shift.difference.toLocaleString('fa-IR')} ت`}
                      </span>
                    </div>
                  )}
                </div>

                {shift.notes && (
                  <p className="text-[11px] text-[#7A6A5C] bg-white p-2 rounded-lg border border-[#F0E8DE]">
                    {shift.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
          <h3 className="font-bold text-[#2C1810] text-sm mb-4">هزینه‌ها و فاکتورهای پرداختی</h3>
          <div className="space-y-3">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2]/50 text-xs flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-[#2C1810] text-sm">{exp.title}</h4>
                  <p className="text-[11px] text-[#7A6A5C] mt-0.5">
                    پرداخت‌کننده: {exp.paidBy} · تاریخ: {exp.date}
                  </p>
                  {exp.description && (
                    <p className="text-[11px] text-[#8C7A6B] italic mt-1">{exp.description}</p>
                  )}
                </div>

                <div className="text-left font-mono tabular-nums shrink-0">
                  <span className="font-black text-rose-700 text-sm">
                    -{exp.amount.toLocaleString('fa-IR')} ت
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Shift Modal */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#2C1810] text-sm mb-4">آغاز شیفت کاری و ثبت تنخواه اولیه صندوق</h3>
            <form onSubmit={handleOpenShift} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#543825] mb-1">موجودی اولیه صندوق (تومان)</label>
                <input
                  type="number"
                  required
                  step={50000}
                  value={initialFloat}
                  onChange={(e) => setInitialFloat(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] font-mono text-left"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">یادداشت شروع شیفت</label>
                <input
                  type="text"
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  placeholder="مثلاً صندوق بررسی و پول خرد آماده شد..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOpenShiftModal(false)}
                  className="px-3 py-2 text-[#7A6A5C] hover:text-[#2C1810]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white font-bold rounded-xl"
                >
                  آغاز شیفت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#2C1810] text-sm mb-4">بستن شیفت و تراز صندوق</h3>
            <form onSubmit={handleCloseShift} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#543825] mb-1">موجودی نقد شمرده‌شده در صندوق (تومان)</label>
                <input
                  type="number"
                  required
                  step={10000}
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] font-mono text-left"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">توضیحات بستن شیفت</label>
                <textarea
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="کسری یا مازاد و گزارش تحویل به شیفت بعد..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloseShiftModal(false)}
                  className="px-3 py-2 text-[#7A6A5C] hover:text-[#2C1810]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] text-white font-bold rounded-xl"
                >
                  بستن و ثبت نهایی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#2C1810] text-sm mb-4">ثبت هزینه جاری کافه</h3>
            <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#543825] mb-1">عنوان هزینه</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="مثلاً خرید مایع شوینده و دستمال..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">دسته‌بندی</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white"
                >
                  <option value="supplies">ملزومات مصرفی و مواد اولیه</option>
                  <option value="salaries">حقوق و دستمزد پرسنل</option>
                  <option value="utilities">قبوض و انرژی</option>
                  <option value="maintenance">سرویس و تعمیرات دستگاه‌ها</option>
                  <option value="other">سایر هزینه‌های متفرقه</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">مبلغ هزینه (تومان)</label>
                <input
                  type="number"
                  required
                  step={10000}
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] font-mono text-left"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">توضیحات تکمیلی</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="شماره فاکتور یا توضیحات..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-3 py-2 text-[#7A6A5C] hover:text-[#2C1810]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] text-white font-bold rounded-xl"
                >
                  ثبت سند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
