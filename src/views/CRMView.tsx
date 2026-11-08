import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Award,
  Phone,
  Calendar,
  Gift,
  Heart,
  Edit2,
  X,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types/cafe';

export const CRMView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'normal'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Customer Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondPhone, setSecondPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'normal' | 'vip'>('normal');

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer({
        name,
        phone,
        secondPhone,
        birthDate,
        address,
        notes,
        status,
      });
      await loadCustomers();
      setShowAddModal(false);
      setName('');
      setPhone('');
      setSecondPhone('');
      setNotes('');
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت مشتری');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#2C1810]">مدیریت ارتباط با مشتریان (CRM) و باشگاه وفاداری</h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            ثبت پرونده مشتریان، سوابق مراجعات، امتیازات خرید و تخفیف‌های وفاداری
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#4A2E1B] hover:bg-[#382315] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت مشتری جدید</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جست‌وجوی نام یا شماره تماس مشتری..."
            className="w-full pl-4 pr-10 py-2.5 bg-white text-xs rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
          />
          <Search className="w-4 h-4 text-[#8C7A6B] absolute right-3.5 top-3" />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto p-1 bg-white rounded-xl border border-[#E8DFD5]">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'all' ? 'bg-[#4A2E1B] text-white' : 'text-[#614D3E] hover:bg-[#FAF7F2]'
            }`}
          >
            همه مشتریان ({customers.length})
          </button>
          <button
            onClick={() => setFilter('vip')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'vip' ? 'bg-[#4A2E1B] text-white' : 'text-[#614D3E] hover:bg-[#FAF7F2]'
            }`}
          >
            اعضای VIP ({customers.filter((c) => c.status === 'vip').length})
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            onClick={() => setSelectedCustomer(customer)}
            className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs hover:border-[#4A2E1B] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5C6B47]/15 text-[#5C6B47] flex items-center justify-center font-bold text-sm">
                    {customer.name.slice(0, 1)}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2C1810] text-sm">{customer.name}</h4>
                    <p className="font-mono text-xs text-[#7A6A5C] dir-ltr text-right mt-0.5">
                      {customer.phone}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    customer.status === 'vip'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-[#FAF7F2] text-[#7A6A5C]'
                  }`}
                >
                  {customer.status === 'vip' ? 'عضو طلایی VIP' : 'مشتری عادی'}
                </span>
              </div>

              {customer.notes && (
                <p className="text-xs text-[#7A6A5C] bg-[#FAF7F2] p-2.5 rounded-xl mt-3 line-clamp-2 leading-relaxed">
                  {customer.notes}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#F5EFEB] grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <span className="text-[#8C7A6B] block text-[10px]">تعداد مراجعات</span>
                <span className="font-mono tabular-nums font-bold text-[#2C1810]">
                  {customer.visitCount} بار
                </span>
              </div>
              <div>
                <span className="text-[#8C7A6B] block text-[10px]">مجموع خریدها</span>
                <span className="font-mono tabular-nums font-bold text-[#4A2E1B]">
                  {(customer.totalSpent / 1000).toFixed(0)}ک ت
                </span>
              </div>
              <div>
                <span className="text-[#8C7A6B] block text-[10px]">امتیاز وفاداری</span>
                <span className="font-mono tabular-nums font-bold text-emerald-700">
                  {customer.loyaltyPoints} pt
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-[#E8DFD5] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-[#FAF7F2] border-b border-[#E8DFD5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#4A2E1B] text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {selectedCustomer.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-bold text-[#2C1810] text-base">{selectedCustomer.name}</h3>
                  <p className="font-mono text-xs text-[#7A6A5C]">{selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-[#9C8975] hover:text-[#2C1810] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Financial & Loyalty Box */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-emerald-800 block text-[11px] font-semibold">
                    اعتبار و امتیاز باشگاه وفاداری
                  </span>
                  <span className="font-mono tabular-nums text-xl font-black text-emerald-900">
                    {selectedCustomer.loyaltyPoints} امتیاز
                  </span>
                </div>
                <div className="text-left font-mono text-[11px] text-emerald-800">
                  ارزش ریالی تخفیف:
                  <div className="font-bold text-sm">
                    {(selectedCustomer.loyaltyPoints * 500).toLocaleString('fa-IR')} تومان
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5]">
                <div>
                  <span className="text-[#8C7A6B] block text-[11px]">مجموع خریدهای ثبت‌شده:</span>
                  <span className="font-mono tabular-nums font-bold text-[#2C1810]">
                    {selectedCustomer.totalSpent.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                <div>
                  <span className="text-[#8C7A6B] block text-[11px]">میانگین هر سفارش:</span>
                  <span className="font-mono tabular-nums font-bold text-[#2C1810]">
                    {selectedCustomer.visitCount > 0
                      ? Math.round(selectedCustomer.totalSpent / selectedCustomer.visitCount).toLocaleString('fa-IR')
                      : 0}{' '}
                    تومان
                  </span>
                </div>
              </div>

              {selectedCustomer.favoriteItems && selectedCustomer.favoriteItems.length > 0 && (
                <div>
                  <span className="font-semibold text-[#543825] block mb-1">علاقه‌مندی‌های قهوه و بار:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCustomer.favoriteItems.map((fav, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD5] text-[#2C1810]">
                        {fav}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCustomer.notes && (
                <div>
                  <span className="font-semibold text-[#543825] block mb-1">یادداشت پرسنل:</span>
                  <p className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] text-[#7A6A5C] leading-relaxed">
                    {selectedCustomer.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#2C1810] text-sm mb-4">ثبت مشتری جدید در باشگاه نیکو کافه</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#543825] mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً نگین صادقی"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">شماره همراه</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09121234567"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] text-left font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">سطح عضویت</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white"
                >
                  <option value="normal">مشتری عادی</option>
                  <option value="vip">مشتری ویژه VIP</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">یادداشت و ترجیحات غذایی</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثلاً همیشه قهوه بدون کافئین سفارش می‌دهند..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-[#7A6A5C] hover:text-[#2C1810]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] text-white font-bold rounded-xl"
                >
                  ثبت پرونده مشتری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
