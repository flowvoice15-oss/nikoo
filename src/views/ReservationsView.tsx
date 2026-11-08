import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Clock,
  Phone,
  Users,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Reservation, CafeTable } from '../types/cafe';

export const ReservationsView: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [tableId, setTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [guestCount, setGuestCount] = useState(4);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('19:00');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      const [rRes, tRes] = await Promise.all([api.getReservations(), api.getTables()]);
      setReservations(rRes);
      setTables(tRes.tables);
      if (tRes.tables.length > 0 && !tableId) {
        setTableId(tRes.tables[0].id);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createReservation({
        tableId,
        customerName,
        customerPhone,
        guestCount: Number(guestCount),
        date,
        time,
        notes,
      });
      await loadData();
      setShowAddModal(false);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت رزرو');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#2C1810]">مدیریت رزرو میزهای کافه</h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            ثبت زمان‌بندی رزرواسیون، ظرفیت میزها و جلوگیری از تداخل همزمان
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#4A2E1B] hover:bg-[#382315] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت رزرو جدید</span>
        </button>
      </div>

      {/* Reservations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reservations.map((res) => {
          const isConfirmed = res.status === 'confirmed';
          return (
            <div
              key={res.id}
              className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm font-mono">
                      #{res.tableNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2C1810] text-sm">{res.customerName}</h4>
                      <p className="font-mono text-xs text-[#7A6A5C] dir-ltr text-right">
                        {res.customerPhone}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                    {isConfirmed ? 'رزرو تأیید شده' : res.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#FAF7F2] rounded-xl text-xs mb-3">
                  <div className="flex items-center gap-1.5 text-[#543825]">
                    <Clock className="w-3.5 h-3.5 text-[#8C7A6B]" />
                    <span className="font-mono tabular-nums font-bold">
                      {res.date} · {res.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#543825]">
                    <Users className="w-3.5 h-3.5 text-[#8C7A6B]" />
                    <span className="font-mono tabular-nums">{res.guestCount} نفر مهمان</span>
                  </div>
                </div>

                {res.notes && (
                  <p className="text-xs text-[#7A6A5C] bg-[#FFFDFB] p-2 rounded-lg border border-[#F5EFEB] italic leading-relaxed">
                    یادداشت: {res.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#F5EFEB] flex items-center justify-between text-xs">
                <span className="text-[#8C7A6B] text-[11px]">میز شماره {res.tableNumber}</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>آماده پذیرایی</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Reservation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#2C1810] text-sm mb-3">ثبت رزرواسیون میز کافه</h3>

            {error && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#543825] mb-1">نام مشتری</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثلاً خانم مهندس یزدانی"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">شماره تماس</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="09120000000"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] font-mono text-left"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">انتخاب میز</label>
                  <select
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[#E8DFD5] bg-white"
                  >
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        میز {t.number} ({t.seats} نفره)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">تعداد نفرات</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] font-mono text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">تاریخ رزرو</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[#E8DFD5] font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">ساعت حضور</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[#E8DFD5] font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">توضیحات و مناسبت</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثلاً سالگرد ازدواج، چیدمان گل روی میز..."
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
                  ثبت قطعی رزرو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
