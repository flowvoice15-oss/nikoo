import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Send,
  Coffee,
  CheckCircle2,
  Clock,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { MenuItem, MenuCategory, CafeTable, Customer, Order } from '../types/cafe';

interface POSViewProps {
  initialTable?: CafeTable | null;
  onOpenReceipt: (order: Order) => void;
  onClearInitialTable?: () => void;
}

interface CartItem {
  menuItemId: string;
  nameFa: string;
  unitPrice: number;
  quantity: number;
  selectedOptions?: string[];
  notes?: string;
  imageUrl?: string;
}

export const POSView: React.FC<POSViewProps> = ({
  initialTable,
  onOpenReceipt,
  onClearInitialTable,
}) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Selection states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [selectedTableId, setSelectedTableId] = useState<string>(initialTable ? initialTable.id : '');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Customization Modal for Product
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [chosenOptions, setChosenOptions] = useState<string[]>([]);
  const [extraPrice, setExtraPrice] = useState(0);
  const [itemNote, setItemNote] = useState('');

  useEffect(() => {
    const loadPOSData = async () => {
      try {
        const [mRes, tRes, cRes] = await Promise.all([
          api.getMenu(),
          api.getTables(),
          api.getCustomers(),
        ]);
        setCategories(mRes.categories);
        setMenuItems(mRes.menuItems);
        setTables(tRes.tables);
        setCustomers(cRes);
      } catch (err) {
        console.error('Error loading POS catalog:', err);
      }
    };
    loadPOSData();
  }, []);

  useEffect(() => {
    if (initialTable) {
      setSelectedTableId(initialTable.id);
      setOrderType('dine_in');
    }
  }, [initialTable]);

  // Filter products
  const filteredProducts = menuItems.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.nameFa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch && p.isAvailable;
  });

  // Add item to cart
  const handleAddToCart = (product: MenuItem) => {
    if (product.optionGroups && product.optionGroups.length > 0) {
      setCustomizingItem(product);
      setChosenOptions([]);
      setExtraPrice(0);
      setItemNote('');
      return;
    }

    addItemDirectly(product, [], 0, '');
  };

  const addItemDirectly = (product: MenuItem, options: string[], priceDiff: number, notes: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (it) => it.menuItemId === product.id && JSON.stringify(it.selectedOptions) === JSON.stringify(options)
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          menuItemId: product.id,
          nameFa: product.nameFa,
          unitPrice: product.price + priceDiff,
          quantity: 1,
          selectedOptions: options,
          notes,
          imageUrl: product.imageUrl,
        },
      ];
    });
  };

  const handleConfirmCustomization = () => {
    if (!customizingItem) return;
    addItemDirectly(customizingItem, chosenOptions, extraPrice, itemNote);
    setCustomizingItem(null);
  };

  // Steppers
  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index].quantity += delta;
      if (updated[index].quantity <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);

  // Submit Order
  const handleSubmitOrder = async (payImmediately = false, payMethod = 'pos_card') => {
    if (cart.length === 0) {
      alert('سبد خرید خالی است!');
      return;
    }
    if (orderType === 'dine_in' && !selectedTableId) {
      alert('لطفاً شماره میز را انتخاب فرمایید');
      return;
    }

    setSubmitting(true);
    try {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      const newOrder = await api.createOrder({
        tableId: orderType === 'dine_in' ? selectedTableId : null,
        type: orderType,
        customerId: customer ? customer.id : null,
        customerName: customer ? customer.name : undefined,
        items: cart,
        discountAmount,
      });

      if (payImmediately) {
        const paidRes = await api.payOrder(newOrder.id, totalAmount, payMethod);
        onOpenReceipt(paidRes.order);
      } else {
        alert(`سفارش شماره #${newOrder.orderNumber} با موفقیت ثبت و به آشپزخانه ارسال گردید.`);
      }

      // Reset cart
      setCart([]);
      setDiscountAmount(0);
      setOrderNotes('');
      if (onClearInitialTable) onClearInitialTable();
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت سفارش');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCustomerObj = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-5rem)]">
      {/* Product Catalog Side */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Order Mode & Table Selector Bar */}
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          {/* Order Type Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5]/80">
            <button
              onClick={() => setOrderType('dine_in')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                orderType === 'dine_in'
                  ? 'bg-[#4A2E1B] text-white shadow-xs'
                  : 'text-[#614D3E] hover:text-[#2C1810]'
              }`}
            >
              داخل کافه (سالن)
            </button>
            <button
              onClick={() => {
                setOrderType('takeaway');
                setSelectedTableId('');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                orderType === 'takeaway'
                  ? 'bg-[#4A2E1B] text-white shadow-xs'
                  : 'text-[#614D3E] hover:text-[#2C1810]'
              }`}
            >
              سفارش بیرون‌بر
            </button>
            <button
              onClick={() => {
                setOrderType('delivery');
                setSelectedTableId('');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                orderType === 'delivery'
                  ? 'bg-[#4A2E1B] text-white shadow-xs'
                  : 'text-[#614D3E] hover:text-[#2C1810]'
              }`}
            >
              تلفنی / پیک
            </button>
          </div>

          {/* Table Selector if dine_in */}
          {orderType === 'dine_in' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#543825]">انتخاب میز:</span>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] text-[#2C1810] focus:outline-none focus:border-[#4A2E1B]"
              >
                <option value="">انتخاب شماره میز...</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    میز {t.number} ({t.label}) - {t.status === 'empty' ? 'خالی' : 'دارای سفارش فعال'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search & Category Chips */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جست‌وجوی سریع نوشیدنی، کیک یا قهوه..."
              className="w-full pl-4 pr-10 py-2.5 bg-white text-xs rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B]"
            />
            <Search className="w-4 h-4 text-[#8C7A6B] absolute right-3.5 top-3" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#4A2E1B] text-white shadow-xs'
                  : 'bg-white text-[#614D3E] border border-[#E8DFD5] hover:bg-[#FAF7F2]'
              }`}
            >
              همه ({menuItems.length})
            </button>
            {categories.map((cat) => {
              const count = menuItems.filter((m) => m.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-[#4A2E1B] text-white shadow-xs'
                      : 'bg-white text-[#614D3E] border border-[#E8DFD5] hover:bg-[#FAF7F2]'
                  }`}
                >
                  {cat.nameFa} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 overflow-y-auto max-h-[620px] p-0.5">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleAddToCart(product)}
              className="group bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden hover:border-[#4A2E1B] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 bg-[#FAF7F2] overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.nameFa}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/latte_art.jpg';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-md text-[10px] text-white flex items-center gap-1 font-mono tabular-nums">
                  <Clock className="w-3 h-3" />
                  <span>{product.prepTimeMinutes}د</span>
                </div>
              </div>

              <div className="p-3 flex flex-col justify-between flex-1">
                <div>
                  <h4 className="font-bold text-[#2C1810] text-xs leading-snug group-hover:text-[#4A2E1B]">
                    {product.nameFa}
                  </h4>
                  <p className="text-[10px] text-[#8C7A6B] truncate mt-0.5">{product.nameEn}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#F5EFEB] flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#4A2E1B] tabular-nums">
                    {product.price.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-[#8C7A6B]">ت</span>
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-[#FAF7F2] group-hover:bg-[#4A2E1B] group-hover:text-white text-[#4A2E1B] flex items-center justify-center transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart / Order Checkout Sidebar */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-[#E8DFD5] flex flex-col justify-between shadow-xs overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 bg-[#FAF7F2] border-b border-[#E8DFD5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2C1810] text-sm">صورتحساب سفارش</span>
            <span className="text-xs text-[#7A6A5C]">· {cart.length} ردیف</span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-red-700 hover:text-red-900 text-xs flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاک‌کردن</span>
            </button>
          )}
        </div>

        {/* Customer Selector (CRM Integration) */}
        <div className="p-3 border-b border-[#F5EFEB] bg-[#FFFDFB]">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-[#543825] flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>انتخاب مشتری (باشگاه وفاداری)</span>
            </label>
            {selectedCustomerObj && (
              <span className="text-[10px] font-mono tabular-nums text-emerald-700 font-bold">
                {selectedCustomerObj.loyaltyPoints} امتیاز
              </span>
            )}
          </div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-[#E8DFD5] bg-white text-[#2C1810]"
          >
            <option value="">مشتری آزاد (بدون ثبت در باشگاه)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone}) - {c.status === 'vip' ? 'VIP' : 'عادی'}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="p-3 flex-1 overflow-y-auto divide-y divide-[#F5EFEB] space-y-2 max-h-[380px]">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-[#9C8975] flex flex-col items-center">
              <Coffee className="w-10 h-10 opacity-30 mb-2" />
              <p className="text-xs">محصولی به سفارش اضافه نشده است</p>
              <p className="text-[11px] text-[#A89888] mt-1">از منوی روبرو آیتم‌ها را انتخاب نمایید</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={index} className="pt-2 flex items-start justify-between gap-2.5 text-xs">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.nameFa}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    className="w-10 h-10 rounded-xl object-cover border border-[#E8DFD5] shrink-0 shadow-2xs"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-[#2C1810] leading-snug">{item.nameFa}</h5>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <p className="text-[10px] text-[#8C7A6B] mt-0.5 truncate">
                      {item.selectedOptions.join(' · ')}
                    </p>
                  )}
                  {item.notes && <p className="text-[10px] text-[#A89888] italic">{item.notes}</p>}
                  <span className="font-mono tabular-nums text-[#4A2E1B] font-bold mt-1 block">
                    {(item.unitPrice * item.quantity).toLocaleString('fa-IR')} ت
                  </span>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-1.5 shrink-0 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8DFD5]">
                  <button
                    onClick={() => updateQuantity(index, -1)}
                    className="w-5 h-5 rounded-lg bg-white flex items-center justify-center text-[#2C1810] hover:bg-[#E8DFD5]"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono tabular-nums font-bold text-xs w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(index, 1)}
                    className="w-5 h-5 rounded-lg bg-white flex items-center justify-center text-[#2C1810] hover:bg-[#E8DFD5]"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Summary & Action Buttons */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#E8DFD5] space-y-3">
          {/* Discount input */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[#7A6A5C] whitespace-nowrap">تخفیف (تومان):</span>
            <input
              type="number"
              min={0}
              step={5000}
              value={discountAmount || ''}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              placeholder="0"
              className="w-28 px-2 py-1 text-xs text-left font-mono rounded-lg border border-[#E8DFD5] bg-white"
            />
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[#7A6A5C]">
              <span>جمع اقلام:</span>
              <span className="font-mono tabular-nums">{subtotal.toLocaleString('fa-IR')} ت</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>تخفیف ویژه:</span>
                <span className="font-mono tabular-nums">-{discountAmount.toLocaleString('fa-IR')} ت</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm text-[#4A2E1B] pt-2 border-t border-[#E8DFD5]">
              <span>مبلغ نهایی:</span>
              <span className="font-mono tabular-nums">{totalAmount.toLocaleString('fa-IR')} تومان</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              disabled={submitting || cart.length === 0}
              onClick={() => handleSubmitOrder(true, 'pos_card')}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>کارت‌خوان و چاپ</span>
            </button>

            <button
              disabled={submitting || cart.length === 0}
              onClick={() => handleSubmitOrder(true, 'cash')}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-[#4A2E1B] hover:bg-[#382315] text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Banknote className="w-4 h-4" />
              <span>نقدی و چاپ</span>
            </button>
          </div>

          <button
            disabled={submitting || cart.length === 0}
            onClick={() => handleSubmitOrder(false)}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-[#F2ECE4] text-[#4A2E1B] border border-[#E8DFD5] rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>ثبت سفارش (ارسال به میز و آشپزخانه)</span>
          </button>
        </div>
      </div>

      {/* Product Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-5 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#2C1810] text-sm mb-1">{customizingItem.nameFa}</h3>
            <p className="text-xs text-[#7A6A5C] mb-4">شخصی‌سازی سفارش بر اساس سلیقه مشتری</p>

            <div className="space-y-4 text-xs">
              {customizingItem.optionGroups?.map((group) => (
                <div key={group.id}>
                  <label className="block font-semibold text-[#543825] mb-2">{group.title}</label>
                  <div className="space-y-1.5">
                    {group.options.map((opt, i) => {
                      const isChosen = chosenOptions.includes(opt.name);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            if (isChosen) {
                              setChosenOptions((prev) => prev.filter((o) => o !== opt.name));
                              setExtraPrice((prev) => prev - opt.priceModifier);
                            } else {
                              setChosenOptions((prev) => [...prev, opt.name]);
                              setExtraPrice((prev) => prev + opt.priceModifier);
                            }
                          }}
                          className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-right transition-colors ${
                            isChosen
                              ? 'border-[#4A2E1B] bg-[#4A2E1B]/5 text-[#4A2E1B] font-bold'
                              : 'border-[#E8DFD5] text-[#2C1810]'
                          }`}
                        >
                          <span>{opt.name}</span>
                          {opt.priceModifier !== 0 && (
                            <span className="font-mono tabular-nums text-[11px] text-[#8C7A6B]">
                              {opt.priceModifier > 0 ? `+${opt.priceModifier.toLocaleString('fa-IR')}` : opt.priceModifier.toLocaleString('fa-IR')} ت
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div>
                <label className="block font-semibold text-[#543825] mb-1.5">یادداشت باریستا / آشپز</label>
                <input
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder="مثلاً کم‌شکر، داغ‌تر، لاته آرت قلبی..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCustomizingItem(null)}
                  className="px-3 py-2 text-[#7A6A5C] hover:text-[#2C1810]"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCustomization}
                  className="px-4 py-2 bg-[#4A2E1B] text-white font-bold rounded-xl"
                >
                  افزودن به سبد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
