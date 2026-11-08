import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Plus,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  Layers,
  History,
  X,
  Truck,
} from 'lucide-react';
import { api } from '../services/api';
import { Ingredient, Supplier, StockMovement } from '../types/cafe';

export const InventoryView: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'movements' | 'suppliers'>('ingredients');

  // Modals
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');

  // Movement form
  const [movementType, setMovementType] = useState<'in' | 'waste' | 'adjustment'>('in');
  const [movementAmount, setMovementAmount] = useState(10);
  const [movementReason, setMovementReason] = useState('');

  // New Ingredient form
  const [nameFa, setNameFa] = useState('');
  const [category, setCategory] = useState('قهوه');
  const [unit, setUnit] = useState<'g' | 'kg' | 'liter' | 'ml' | 'count'>('g');
  const [currentStock, setCurrentStock] = useState(1000);
  const [minThreshold, setMinThreshold] = useState(300);
  const [costPerUnit, setCostPerUnit] = useState(1000);
  const [supplierId, setSupplierId] = useState('');

  const loadData = async () => {
    try {
      const data = await api.getInventory();
      setIngredients(data.ingredients);
      setSuppliers(data.suppliers);
      setMovements(data.movements);
      if (data.ingredients.length > 0 && !selectedIngredientId) {
        setSelectedIngredientId(data.ingredients[0].id);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredientId) return;
    try {
      await api.recordStockMovement({
        ingredientId: selectedIngredientId,
        type: movementType,
        amount: Number(movementAmount),
        reason: movementReason || (movementType === 'in' ? 'ورود بار جدید' : 'ثبت ضایعات بار'),
      });
      await loadData();
      setShowMovementModal(false);
      setMovementReason('');
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت گردش انبار');
    }
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createIngredient({
        nameFa,
        category,
        unit,
        currentStock: Number(currentStock),
        minThreshold: Number(minThreshold),
        costPerUnit: Number(costPerUnit),
        supplierId,
      });
      await loadData();
      setShowAddIngredientModal(false);
      setNameFa('');
    } catch (err: any) {
      alert(err.message || 'خطا در تعریف ماده اولیه');
    }
  };

  const lowStock = ingredients.filter((i) => i.currentStock <= i.minThreshold);
  const totalValuation = ingredients.reduce(
    (sum, i) => sum + i.currentStock * i.costPerUnit,
    0
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#2C1810]">مدیریت انبار و مواد اولیه کافه</h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            کنترل دقیق موجودی دان قهوه، لبنیات، شربت‌ها و پیگیری کسر خودکار رسپی‌ها
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMovementModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#4A2E1B] text-xs font-semibold rounded-xl border border-[#E8DFD5] transition-colors"
          >
            <History className="w-4 h-4" />
            <span>ثبت ورود / ضایعات</span>
          </button>
          <button
            onClick={() => setShowAddIngredientModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#4A2E1B] hover:bg-[#382315] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>ماده اولیه جدید</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-4 shadow-xs">
          <span className="text-xs text-[#7A6A5C]">ارزش ریالی موجودی انبار</span>
          <div className="text-lg font-black text-[#2C1810] font-mono tabular-nums mt-1">
            {totalValuation.toLocaleString('fa-IR')} <span className="text-xs font-normal text-[#7A6A5C]">تومان</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-4 shadow-xs">
          <span className="text-xs text-[#7A6A5C]">تعداد اقلام تعریف‌شده</span>
          <div className="text-lg font-black text-[#2C1810] font-mono tabular-nums mt-1">
            {ingredients.length} قلم کالا
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-4 shadow-xs">
          <span className="text-xs text-[#7A6A5C]">هشدارهای حداقل موجودی</span>
          <div
            className={`text-lg font-black font-mono tabular-nums mt-1 ${
              lowStock.length > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {lowStock.length > 0 ? `${lowStock.length} قلم نیازمند سفارش خرید` : 'تمامی اقلام کافی است'}
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#E8DFD5] w-fit">
        <button
          onClick={() => setActiveTab('ingredients')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'ingredients' ? 'bg-[#4A2E1B] text-white shadow-xs' : 'text-[#614D3E]'
          }`}
        >
          موجودی مواد اولیه ({ingredients.length})
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'movements' ? 'bg-[#4A2E1B] text-white shadow-xs' : 'text-[#614D3E]'
          }`}
        >
          تاریخچه گردش انبار ({movements.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'suppliers' ? 'bg-[#4A2E1B] text-white shadow-xs' : 'text-[#614D3E]'
          }`}
        >
          تأمین‌کنندگان معتبر ({suppliers.length})
        </button>
      </div>

      {/* Ingredients View */}
      {activeTab === 'ingredients' && (
        <div className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E8DFD5] text-[#7A6A5C]">
                  <th className="py-3 px-4 font-semibold">عنوان ماده اولیه</th>
                  <th className="py-3 px-4 font-semibold">دسته‌بندی</th>
                  <th className="py-3 px-4 font-semibold">موجودی فعلی</th>
                  <th className="py-3 px-4 font-semibold">حداقل آستانه</th>
                  <th className="py-3 px-4 font-semibold">بهای هر واحد</th>
                  <th className="py-3 px-4 font-semibold">وضعیت انبار</th>
                  <th className="py-3 px-4 font-semibold">تأمین‌کننده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F2EB]">
                {ingredients.map((ing) => {
                  const isLow = ing.currentStock <= ing.minThreshold;
                  const supplier = suppliers.find((s) => s.id === ing.supplierId);

                  return (
                    <tr key={ing.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#2C1810]">{ing.nameFa}</td>
                      <td className="py-3 px-4 text-[#7A6A5C]">{ing.category}</td>
                      <td className="py-3 px-4 font-mono tabular-nums font-bold text-sm text-[#4A2E1B]">
                        {ing.currentStock.toLocaleString('fa-IR')} {ing.unit}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-[#7A6A5C]">
                        {ing.minThreshold.toLocaleString('fa-IR')} {ing.unit}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-[#2C1810]">
                        {ing.costPerUnit.toLocaleString('fa-IR')} ت
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isLow ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {isLow ? '⚠️ رو به اتمام' : 'مطلوب'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#7A6A5C]">{supplier?.name || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movements View */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E8DFD5] text-[#7A6A5C]">
                  <th className="py-3 px-4 font-semibold">تاریخ و ساعت</th>
                  <th className="py-3 px-4 font-semibold">نوع عملیات</th>
                  <th className="py-3 px-4 font-semibold">ماده اولیه</th>
                  <th className="py-3 px-4 font-semibold">مقدار گردش</th>
                  <th className="py-3 px-4 font-semibold">علت / شرح گردش</th>
                  <th className="py-3 px-4 font-semibold">ثبت‌کننده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F2EB]">
                {movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-[#7A6A5C]">
                      {new Date(mov.timestamp).toLocaleDateString('fa-IR')} ·{' '}
                      {new Date(mov.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          mov.type === 'in'
                            ? 'bg-emerald-50 text-emerald-800'
                            : mov.type === 'waste'
                            ? 'bg-red-50 text-red-800'
                            : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {mov.type === 'in'
                          ? 'ورود کالا'
                          : mov.type === 'waste'
                          ? 'ضایعات و دورریز'
                          : mov.type === 'out_order'
                          ? 'مصرف خودکار سفارش'
                          : 'انبارگردانی'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2C1810]">{mov.ingredientName}</td>
                    <td className="py-3 px-4 font-mono tabular-nums font-bold">
                      {mov.amount.toLocaleString('fa-IR')} {mov.unit}
                    </td>
                    <td className="py-3 px-4 text-[#7A6A5C]">{mov.reason}</td>
                    <td className="py-3 px-4 text-[#2C1810]">{mov.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers View */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((sup) => (
            <div key={sup.id} className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-[#2C1810] text-sm">{sup.name}</h4>
                  <p className="text-xs text-[#7A6A5C] mt-0.5">مسئول فروش: {sup.contactPerson}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#4A2E1B]">
                  {sup.category}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-[#F5EFEB] space-y-1 text-xs text-[#7A6A5C]">
                <p>تلفن: <span className="font-mono tabular-nums text-[#2C1810] font-semibold">{sup.phone}</span></p>
                <p>آدرس: {sup.address}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#2C1810] text-sm mb-4">ثبت گردش دستی انبار (ورود / ضایعات)</h3>
            <form onSubmit={handleRecordMovement} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#543825] mb-1">ماده اولیه</label>
                <select
                  value={selectedIngredientId}
                  onChange={(e) => setSelectedIngredientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white"
                >
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nameFa} (موجودی فعلی: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">نوع گردش</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white"
                >
                  <option value="in">ورود کالا (خرید و شارژ انبار)</option>
                  <option value="waste">ثبت ضایعات و دورریز</option>
                  <option value="adjustment">انبارگردانی (تنظیم موجودی نهایی)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">مقدار</label>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] font-mono text-center"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">شرح یا شماره فاکتور</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="مثلاً خرید ۵ بطری شیر از لبنیاتی پاک‌دشت..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-3 py-2 text-[#7A6A5C] hover:text-[#2C1810]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] text-white font-bold rounded-xl"
                >
                  ثبت در کاردکس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Ingredient Modal */}
      {showAddIngredientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#2C1810] text-sm mb-4">تعریف ماده اولیه جدید</h3>
            <form onSubmit={handleCreateIngredient} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#543825] mb-1">نام ماده اولیه</label>
                <input
                  type="text"
                  required
                  value={nameFa}
                  onChange={(e) => setNameFa(e.target.value)}
                  placeholder="مثلاً سیروپ پسته، پودر ماچا..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">دسته‌بندی</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">واحد اندازه‌گیری</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white"
                  >
                    <option value="g">گرم (g)</option>
                    <option value="kg">کیلوگرم (kg)</option>
                    <option value="liter">لیتر (liter)</option>
                    <option value="ml">میلی‌لیتر (ml)</option>
                    <option value="count">عدد (count)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">موجودی اولیه</label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">حداقل آستانه هشدار</label>
                  <input
                    type="number"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] font-mono text-center"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddIngredientModal(false)}
                  className="px-3 py-2 text-[#7A6A5C] hover:text-[#2C1810]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] text-white font-bold rounded-xl"
                >
                  ثبت در انبار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
