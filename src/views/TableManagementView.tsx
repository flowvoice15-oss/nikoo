import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  ArrowRightLeft,
  ShoppingBag,
  CreditCard,
  CheckCircle,
  Move,
  Save,
  Clock,
  Coffee,
  X,
  AlertCircle,
  Sparkles,
  Layers,
  Download,
} from 'lucide-react';
import { api } from '../services/api';
import { CafeTable, CafeSection, Order } from '../types/cafe';
import { RealisticCafeTable } from '../components/RealisticCafeTable';

interface TableManagementViewProps {
  onOpenPOSForTable: (table: CafeTable) => void;
  onOpenReceipt: (order: Order) => void;
}

export const TableManagementView: React.FC<TableManagementViewProps> = ({
  onOpenPOSForTable,
  onOpenReceipt,
}) => {
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [sections, setSections] = useState<CafeSection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<CafeTable | null>(null);
  const [loading, setLoading] = useState(true);

  // Layout Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);

  // Modals
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetTransferTableId, setTargetTransferTableId] = useState('');
  const [showQuickPayModal, setShowQuickPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'pos_card' | 'cash' | 'online'>('pos_card');
  const [payError, setPayError] = useState<string | null>(null);

  // New Table Form
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableLabel, setNewTableLabel] = useState('');
  const [newTableSection, setNewTableSection] = useState('sec_main');
  const [newTableSeats, setNewTableSeats] = useState(4);
  const [newTableShape, setNewTableShape] = useState<'square' | 'circle' | 'rectangle'>('square');

  const loadData = async () => {
    try {
      const [tRes, oRes] = await Promise.all([api.getTables(), api.getOrders()]);
      setTables(tRes.tables);
      setSections(tRes.sections);
      setOrders(oRes);

      if (selectedTable) {
        const updated = tRes.tables.find((t) => t.id === selectedTable.id);
        if (updated) setSelectedTable(updated);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredTables =
    selectedSection === 'all' ? tables : tables.filter((t) => t.sectionId === selectedSection);

  const activeOrderForSelected = selectedTable?.activeOrderId
    ? orders.find((o) => o.id === selectedTable.activeOrderId)
    : null;

  // Handle Free Table
  const handleFreeTable = async (tableId: string) => {
    if (!window.confirm('آیا از خالی کردن و خروج مشتریان این میز اطمینان دارید؟')) return;
    try {
      await api.updateTableStatus(tableId, 'empty');
      await loadData();
      setSelectedTable(null);
    } catch (err: any) {
      alert(err.message || 'خطا در آزادسازی میز');
    }
  };

  // Handle Transfer Table
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !targetTransferTableId) return;
    try {
      await api.transferTable(selectedTable.id, targetTransferTableId);
      await loadData();
      setShowTransferModal(false);
      setSelectedTable(null);
    } catch (err: any) {
      alert(err.message || 'خطا در انتقال میز');
    }
  };

  // Handle Quick Pay
  const handleQuickPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrderForSelected) return;
    setPayError(null);
    try {
      const res = await api.payOrder(activeOrderForSelected.id, undefined, payMethod);
      await loadData();
      setShowQuickPayModal(false);
      setSelectedTable(null);
      onOpenReceipt(res.order);
    } catch (err: any) {
      setPayError(err.message || 'خطا در ثبت پرداخت');
    }
  };

  // Handle Add Table
  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTable({
        number: Number(newTableNumber),
        label: newTableLabel || `میز ${newTableNumber}`,
        sectionId: newTableSection,
        seats: Number(newTableSeats),
        shape: newTableShape,
        posX: 35,
        posY: 45,
        width: newTableShape === 'rectangle' ? 140 : 90,
        height: 90,
      });
      await loadData();
      setShowAddTableModal(false);
      setNewTableNumber('');
      setNewTableLabel('');
    } catch (err: any) {
      alert(err.message || 'خطا در تعریف میز');
    }
  };

  // Floor Map Drag & Reposition
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode || !draggedTableId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    setTables((prev) =>
      prev.map((t) =>
        t.id === draggedTableId
          ? { ...t, posX: Math.max(10, Math.min(90, x)), posY: Math.max(12, Math.min(88, y)) }
          : t
      )
    );
  };

  const handleSaveLayout = async () => {
    try {
      await Promise.all(
        tables.map((t) =>
          api.updateTableLayout(t.id, {
            posX: t.posX,
            posY: t.posY,
            seats: t.seats,
            shape: t.shape,
            label: t.label,
          })
        )
      );
      setIsEditMode(false);
      setDraggedTableId(null);
      alert('چیدمان واقع‌گرایانه میزها با موفقیت ذخیره گردید.');
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره چیدمان');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls: Sections, Status Legend, Edit Mode */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E8DFD5] shadow-xs">
        {/* Sections Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedSection('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
              selectedSection === 'all'
                ? 'bg-[#4A2E1B] text-white shadow-xs'
                : 'text-[#614D3E] hover:bg-[#FAF7F2]'
            }`}
          >
            همه بخش‌ها ({tables.length})
          </button>
          {sections.map((sec) => {
            const count = tables.filter((t) => t.sectionId === sec.id).length;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSection(sec.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  selectedSection === sec.id
                    ? 'bg-[#4A2E1B] text-white shadow-xs'
                    : 'text-[#614D3E] hover:bg-[#FAF7F2]'
                }`}
              >
                {sec.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {isEditMode ? (
            <button
              onClick={handleSaveLayout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره چیدمان میزها</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#4A2E1B] text-xs font-semibold rounded-xl border border-[#E8DFD5] transition-colors"
            >
              <Move className="w-3.5 h-3.5" />
              <span>تغییر محل و چیدمان</span>
            </button>
          )}

          <button
            onClick={() => setShowAddTableModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4A2E1B] hover:bg-[#382315] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف میز جدید</span>
          </button>
        </div>
      </div>

      {/* Realistic Floor Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5]/80 text-xs text-[#7A6A5C]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-[#2C1810]">وضعیت میزهای کافه:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 shadow-2xs" />
            <span>سبز: میز خالی (آماده پذیرایی)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#C84B31] border border-[#A6361F] shadow-2xs" />
            <span>قرمز/آجری: میز اشغال شده</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600 shadow-2xs" />
            <span>نارنجی: سفارش در بار / آشپزخانه</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500 border border-sky-600 shadow-2xs" />
            <span>آبی: آماده سرو</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-600 border border-purple-700 shadow-2xs" />
            <span>بنفش: رزرو شده</span>
          </div>
        </div>

        <div className="text-[11px] text-[#8C7A6B] flex items-center gap-2">
          <span>نمای معماری واقعی چیدمان مبلمان کافه</span>
          <span className="sm:hidden text-[10px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
            برای مشاهده کامل سالن نقشه را به چپ و راست بکشید
          </span>
        </div>
      </div>

      {/* Architectural Realistic Cafe Floor Canvas with Mobile Horizontal Scroll */}
      <div className="relative overflow-x-auto rounded-2xl border-4 border-[#4A2E1B]/20 shadow-2xl bg-[#E8DDD1]">
        <div className="relative bg-[#F4EDE4] min-w-[540px] sm:min-w-0 p-4 sm:p-6 min-h-[580px] sm:min-h-[740px] shadow-inner overflow-hidden select-none">
          {/* Realistic Parquet Wood Flooring Pattern */}
          <div
            onClick={handleMapClick}
            className={`absolute inset-0 opacity-70 ${isEditMode ? 'cursor-crosshair' : ''}`}
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, #EFE6DC 0, #EFE6DC 20px, #E8DDD1 20px, #E8DDD1 40px), repeating-linear-gradient(-45deg, #F5EDE3 0, #F5EDE3 20px, #ECE0D4 20px, #ECE0D4 40px)`,
              backgroundBlendMode: 'multiply',
            }}
          />

          {/* Ambient Warm Sunlight Shadow through Windows on Left */}
          <div className="absolute top-0 bottom-0 left-0 w-32 sm:w-44 bg-gradient-to-r from-amber-100/40 to-transparent pointer-events-none" />

        {/* Zone Labels on Floor */}
        <div className="absolute top-20 left-8 pointer-events-none text-[11px] font-bold text-[#8C6239]/60 tracking-wider">
          محدوده پنجره‌های نورگیر خیابان
        </div>

        <div className="absolute top-20 left-[45%] -translate-x-1/2 pointer-events-none text-[11px] font-bold text-[#8C6239]/60 tracking-wider">
          سالن مرکزی کافه (Main Dining)
        </div>

        <div className="absolute top-20 right-12 pointer-events-none text-[11px] font-bold text-[#5C6B47]/80 tracking-wider">
          تراس و فضای باز زیتون (Garden Terrace)
        </div>

        <div className="absolute bottom-24 left-[38%] -translate-x-1/2 pointer-events-none text-[10px] font-bold text-[#543825]/70 tracking-wider">
          بخش جلسات و لانژ کنفرانس VIP
        </div>

        {/* Terrace Garden Divider Wall & Foliage */}
        <div className="absolute top-0 bottom-0 right-[28%] w-1.5 bg-[#8C6239]/30 border-r border-dashed border-[#5C6B47]/50 pointer-events-none flex flex-col justify-around py-8">
          <div className="w-7 h-7 -mr-3 rounded-full bg-emerald-800/80 border-2 border-emerald-950 flex items-center justify-center text-xs text-amber-200 shadow-sm" title="درختچه زیتون">🌿</div>
          <div className="w-7 h-7 -mr-3 rounded-full bg-emerald-800/80 border-2 border-emerald-950 flex items-center justify-center text-xs text-amber-200 shadow-sm" title="درختچه زیتون">🌿</div>
          <div className="w-7 h-7 -mr-3 rounded-full bg-emerald-800/80 border-2 border-emerald-950 flex items-center justify-center text-xs text-amber-200 shadow-sm" title="درختچه زیتون">🌿</div>
        </div>

        {/* Cafe Bar Counter (Top Station) */}
        <div className="absolute top-3 left-6 z-10 pointer-events-none hidden sm:flex items-center gap-4 bg-[#3E2314] text-[#FAF7F2] py-2 px-3.5 rounded-2xl border-2 border-[#543825] shadow-lg">
          <div className="w-8 h-8 rounded-xl bg-[#2A150A] border border-[#6F4E37] flex items-center justify-center text-amber-400">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs block text-white">پیشخوان بار اسپرسو نیکو کافه</span>
            <span className="text-[9px] text-stone-300">دستگاه لامارزوکو ۳ گروپ · آسیاب تخصصی</span>
          </div>
          {/* Bar stools top view */}
          <div className="flex gap-1.5 mr-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#8C5D30] border border-[#2A150A]" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#8C5D30] border border-[#2A150A]" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#8C5D30] border border-[#2A150A]" />
          </div>
        </div>

        {/* Entrance Welcome Rug */}
        <div className="absolute bottom-3 left-6 pointer-events-none px-3.5 py-1.5 rounded-xl bg-[#4A2E1B] text-[#FAF7F2] border border-[#6F4E37] text-[10px] font-bold shadow-md tracking-wider flex items-center gap-2">
          <span>ورودی اصلی نیکو کافه</span>
          <span className="text-stone-300 font-mono text-[9px]">· NIKO CAFE</span>
        </div>

        {/* Edit Mode Notice Badge */}
        {isEditMode && (
          <div className="absolute top-4 right-4 z-30 px-4 py-2 bg-[#4A2E1B] text-white text-xs rounded-xl shadow-lg border border-amber-400/50 flex items-center gap-2 animate-pulse">
            <Move className="w-4 h-4 text-amber-400" />
            <span>حالت جابه‌جایی فعال: روی میزی کلیک کرده، سپس روی نقطه جدید نقشه کلیک کنید.</span>
          </div>
        )}

        {/* Render Realistic Tables with Real Chairs and Wooden Tops */}
        {filteredTables.map((table) => (
          <RealisticCafeTable
            key={table.id}
            table={table}
            isSelected={selectedTable?.id === table.id}
            isDragged={draggedTableId === table.id}
            isEditMode={isEditMode}
            onClick={() => {
              if (isEditMode) {
                setDraggedTableId(table.id);
              } else {
                setSelectedTable(table);
              }
            }}
          />
        ))}
        </div>
      </div>

      {/* Table Details Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#E8DFD5] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 bg-[#FAF7F2] border-b border-[#E8DFD5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#4A2E1B] text-white flex flex-col items-center justify-center font-mono shadow-xs">
                  <span className="text-[10px]">میز</span>
                  <span className="text-lg font-bold leading-none">{selectedTable.number}</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#2C1810] text-base">{selectedTable.label}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#7A6A5C] mt-0.5">
                    <span>ظرفیت: {selectedTable.seats} صندلی چوبی</span>
                    <span>·</span>
                    <span className="font-semibold">
                      {selectedTable.status === 'empty'
                        ? 'خالی'
                        : selectedTable.status === 'occupied'
                        ? 'اشغال شده'
                        : selectedTable.status === 'kitchen_pending'
                        ? 'در انتظار آماده‌سازی'
                        : selectedTable.status === 'ready_to_serve'
                        ? 'آماده سرو'
                        : 'رزرو شده'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-[#9C8975] hover:text-[#2C1810] p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Table Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#FAF7F2]/60 rounded-xl border border-[#E8DFD5] text-xs">
                <div>
                  <span className="text-[#8C7A6B] block text-[11px]">گارسون / مهماندار:</span>
                  <span className="font-semibold text-[#2C1810]">
                    {selectedTable.currentWaiter || 'تعیین نشده'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C7A6B] block text-[11px]">تعداد مهمانان:</span>
                  <span className="font-semibold text-[#2C1810]">
                    {selectedTable.customerCount ? `${selectedTable.customerCount} نفر` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C7A6B] block text-[11px]">مدت زمان حضور:</span>
                  <span className="font-semibold text-[#2C1810] font-mono tabular-nums">
                    {selectedTable.occupiedSince
                      ? `${Math.max(1, Math.round((Date.now() - new Date(selectedTable.occupiedSince).getTime()) / 60000))} دقیقه`
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Active Order Details */}
              {activeOrderForSelected ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#2C1810]">
                      اقلام سفارش فعال (#{activeOrderForSelected.orderNumber})
                    </span>
                    <span className="text-xs font-mono tabular-nums text-[#4A2E1B] font-bold">
                      {activeOrderForSelected.totalAmount.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  <div className="border border-[#E8DFD5] rounded-xl overflow-hidden divide-y divide-[#F5EFEB]">
                    {activeOrderForSelected.items.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#4A2E1B]/10 text-[#4A2E1B] font-bold font-mono text-[10px] flex items-center justify-center">
                            {item.quantity}×
                          </span>
                          <div>
                            <p className="font-semibold text-[#2C1810]">{item.nameFa}</p>
                            {item.notes && <p className="text-[10px] text-[#8C7A6B] italic">{item.notes}</p>}
                          </div>
                        </div>
                        <span className="font-mono tabular-nums font-medium text-[#2C1810]">
                          {(item.unitPrice * item.quantity).toLocaleString('fa-IR')} ت
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-between text-xs pt-2 border-t border-[#F5EFEB]">
                    <span className="text-[#7A6A5C]">وضعیت تسویه:</span>
                    <span
                      className={`font-bold ${
                        activeOrderForSelected.paymentStatus === 'paid'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {activeOrderForSelected.paymentStatus === 'paid'
                        ? 'تسویه کامل شده'
                        : 'پرداخت نشده (آماده تسویه)'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center bg-[#FAF7F2]/40 rounded-xl border border-dashed border-[#E8DFD5]">
                  <p className="text-xs text-[#7A6A5C]">هیچ سفارش فعالی روی این میز ثبت نشده است.</p>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-[#FAF7F2] border-t border-[#E8DFD5] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedTable.status !== 'empty' && (
                  <button
                    onClick={() => handleFreeTable(selectedTable.id)}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-[#543825] text-xs font-semibold rounded-xl transition-colors"
                  >
                    آزاد کردن میز
                  </button>
                )}
                {activeOrderForSelected && (
                  <button
                    onClick={() => {
                      setTargetTransferTableId('');
                      setShowTransferModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-xl border border-amber-200 transition-colors"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>انتقال میز</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeOrderForSelected && activeOrderForSelected.paymentStatus !== 'paid' && (
                  <button
                    onClick={() => setShowQuickPayModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>تسویه و چاپ فیش</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenPOSForTable(selectedTable);
                    setSelectedTable(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#4A2E1B] hover:bg-[#382315] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{activeOrderForSelected ? 'افزودن آیتم' : 'ثبت سفارش میز'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Table Modal */}
      {showTransferModal && selectedTable && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#2C1810] text-sm mb-2">
              انتقال سفارش میز {selectedTable.number}
            </h3>
            <p className="text-xs text-[#7A6A5C] mb-4">
              لطفاً میز مقصد که در وضعیت خالی است را انتخاب فرمایید:
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#543825] mb-1.5">میز مقصد</label>
                <select
                  required
                  value={targetTransferTableId}
                  onChange={(e) => setTargetTransferTableId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8DFD5] bg-[#FAF7F2]/50 focus:outline-none focus:border-[#4A2E1B]"
                >
                  <option value="">انتخاب میز خالی...</option>
                  {tables
                    .filter((t) => t.status === 'empty' && t.id !== selectedTable.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label} (شماره {t.number} - {t.seats} نفره)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-2 text-xs text-[#7A6A5C] hover:text-[#2C1810]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!targetTransferTableId}
                  className="px-4 py-2 bg-[#4A2E1B] text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  تأیید انتقال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Pay Modal */}
      {showQuickPayModal && activeOrderForSelected && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#2C1810] text-sm mb-1">تسویه سریع سفارش میز {selectedTable?.number}</h3>
            <p className="text-xs text-[#7A6A5C] mb-4">سفارش #{activeOrderForSelected.orderNumber}</p>

            {payError && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <form onSubmit={handleQuickPay} className="space-y-4">
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] flex justify-between items-center text-xs">
                <span className="text-[#7A6A5C]">مبلغ کل قابل پرداخت:</span>
                <span className="font-bold font-mono text-base text-[#4A2E1B]">
                  {activeOrderForSelected.totalAmount.toLocaleString('fa-IR')} تومان
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#543825] mb-2">روش پرداخت</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPayMethod('pos_card')}
                    className={`py-2 px-1 rounded-xl border text-center font-semibold transition-colors ${
                      payMethod === 'pos_card'
                        ? 'border-[#4A2E1B] bg-[#4A2E1B] text-white'
                        : 'border-[#E8DFD5] text-[#2C1810]'
                    }`}
                  >
                    کارت‌خوان POS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`py-2 px-1 rounded-xl border text-center font-semibold transition-colors ${
                      payMethod === 'cash'
                        ? 'border-[#4A2E1B] bg-[#4A2E1B] text-white'
                        : 'border-[#E8DFD5] text-[#2C1810]'
                    }`}
                  >
                    وجه نقد
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('online')}
                    className={`py-2 px-1 rounded-xl border text-center font-semibold transition-colors ${
                      payMethod === 'online'
                        ? 'border-[#4A2E1B] bg-[#4A2E1B] text-white'
                        : 'border-[#E8DFD5] text-[#2C1810]'
                    }`}
                  >
                    آنلاین
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickPayModal(false)}
                  className="px-3 py-2 text-xs text-[#7A6A5C] hover:text-[#2C1810]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>ثبت تسویه و خروج</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#2C1810] text-sm mb-4">تعریف میز جدید در نیکو کافه</h3>
            <form onSubmit={handleAddTableSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#543825] mb-1">شماره میز</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="مثلاً ۱۱"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">عنوان / برچسب میز</label>
                <input
                  type="text"
                  value={newTableLabel}
                  onChange={(e) => setNewTableLabel(e.target.value)}
                  placeholder="مثلاً میز ۱۱ (سالن اصلی)"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">بخش کافه</label>
                <select
                  value={newTableSection}
                  onChange={(e) => setNewTableSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white focus:outline-none focus:border-[#4A2E1B]"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">تعداد صندلی چوبی</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newTableSeats}
                    onChange={(e) => setNewTableSeats(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">شکل هندسی میز</label>
                  <select
                    value={newTableShape}
                    onChange={(e) => setNewTableShape(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white"
                  >
                    <option value="square">مربع چوبی</option>
                    <option value="circle">گرد بیسترو فرانسوی</option>
                    <option value="rectangle">مستطیل بزرگ گروهی</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="px-3 py-2 text-[#7A6A5C] hover:text-[#2C1810]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] text-white font-bold rounded-xl"
                >
                  ثبت میز در نقشه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
