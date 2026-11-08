import React, { useState, useEffect } from 'react';
import {
  Plus,
  Coffee,
  Clock,
  Sparkles,
  Edit2,
  DollarSign,
  Utensils,
  X,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { MenuItem, MenuCategory, Ingredient } from '../types/cafe';

const PRESET_CAFE_IMAGES = [
  { url: '/images/espresso_double.jpg', label: 'اسپرسو' },
  { url: '/images/latte_art.jpg', label: 'لاته آرت' },
  { url: '/images/cappuccino.jpg', label: 'کاپوچینو' },
  { url: '/images/cold_brew.jpg', label: 'کلد برو' },
  { url: '/images/iced_latte.jpg', label: 'آیس لاته' },
  { url: '/images/hot_chocolate.jpg', label: 'هات چاکلت' },
  { url: '/images/tea_pot.jpg', label: 'چای قوری' },
  { url: '/images/herbal_relax.jpg', label: 'دمنوش' },
  { url: '/images/croissant.jpg', label: 'کرواسان' },
  { url: '/images/san_sebastian.jpg', label: 'چیزکیک' },
  { url: '/images/berry_tart.jpg', label: 'تارت میوه' },
  { url: '/images/panini_turkey.jpg', label: 'پنینی' },
];

export const MenuView: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Add/Edit Product Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);

  // Form states
  const [nameFa, setNameFa] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState(100000);
  const [costPrice, setCostPrice] = useState(30000);
  const [prepTime, setPrepTime] = useState(5);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('/images/latte_art.jpg');

  // Recipe selection in modal
  const [recipeItems, setRecipeItems] = useState<{ ingredientId: string; amount: number }[]>([]);

  const loadMenuData = async () => {
    try {
      const [mRes, iRes] = await Promise.all([api.getMenu(), api.getInventory()]);
      setCategories(mRes.categories);
      setMenuItems(mRes.menuItems);
      setIngredients(iRes.ingredients);
      if (mRes.categories.length > 0 && !categoryId) {
        setCategoryId(mRes.categories[0].id);
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setNameFa('');
    setNameEn('');
    setCategoryId(categories[0]?.id || '');
    setPrice(100000);
    setCostPrice(30000);
    setPrepTime(5);
    setDescription('');
    setImageUrl('/images/latte_art.jpg');
    setRecipeItems([]);
    setShowProductModal(true);
  };

  const openEditModal = (product: MenuItem) => {
    setEditingProduct(product);
    setNameFa(product.nameFa);
    setNameEn(product.nameEn);
    setCategoryId(product.categoryId);
    setPrice(product.price);
    setCostPrice(product.costPrice);
    setPrepTime(product.prepTimeMinutes);
    setDescription(product.description);
    setImageUrl(product.imageUrl);
    setRecipeItems(product.recipe || []);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          nameFa,
          nameEn,
          categoryId,
          price: Number(price),
          costPrice: Number(costPrice),
          prepTimeMinutes: Number(prepTime),
          description,
          imageUrl,
          recipe: recipeItems,
        });
      } else {
        await api.createProduct({
          nameFa,
          nameEn,
          categoryId,
          price: Number(price),
          costPrice: Number(costPrice),
          prepTimeMinutes: Number(prepTime),
          description,
          imageUrl,
          recipe: recipeItems,
        });
      }
      await loadMenuData();
      setShowProductModal(false);
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره محصول');
    }
  };

  const handleToggleAvailable = async (product: MenuItem) => {
    try {
      await api.updateProduct(product.id, { isAvailable: !product.isAvailable });
      await loadMenuData();
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت');
    }
  };

  const filteredItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((m) => m.categoryId === selectedCategory);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#2C1810]">منوی محصولات و رسپی کافه</h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            تعیین قیمت فروش، بهای تمام‌شده، سود ناخالص و فرمول کسر خودکار مواد اولیه
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#4A2E1B] hover:bg-[#382315] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن محصول جدید</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#4A2E1B] text-white shadow-xs'
              : 'bg-white text-[#614D3E] border border-[#E8DFD5] hover:bg-[#FAF7F2]'
          }`}
        >
          همه محصولات ({menuItems.length})
        </button>
        {categories.map((cat) => {
          const count = menuItems.filter((m) => m.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
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

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((product) => {
          const profit = product.price - product.costPrice;
          const marginPercent =
            product.price > 0 ? Math.round((profit / product.price) * 100) : 0;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                product.isAvailable ? 'border-[#E8DFD5]' : 'border-stone-300 opacity-60'
              }`}
            >
              <div>
                <div className="relative aspect-16/9 bg-[#FAF7F2] overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.nameFa}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/latte_art.jpg';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[10px] text-white font-mono tabular-nums flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{product.prepTimeMinutes} دقیقه</span>
                  </div>

                  {!product.isAvailable && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white font-bold text-xs">
                      ناموجود در منو
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-[#2C1810] text-sm">{product.nameFa}</h4>
                      <p className="text-[11px] text-[#8C7A6B] mt-0.5">{product.nameEn}</p>
                    </div>
                    <span className="font-mono text-sm font-black text-[#4A2E1B] tabular-nums whitespace-nowrap">
                      {product.price.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-[#8C7A6B]">ت</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#7A6A5C] mt-2.5 line-clamp-2 leading-relaxed">
                    {product.description || 'بدون توضیحات'}
                  </p>

                  {/* Financial Breakdown */}
                  <div className="mt-3.5 pt-3 border-t border-[#F5EFEB] grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="bg-[#FAF7F2] p-1.5 rounded-lg">
                      <span className="text-[#8C7A6B] block text-[10px]">بهای تمام‌شده</span>
                      <span className="font-mono tabular-nums font-bold text-[#2C1810]">
                        {product.costPrice.toLocaleString('fa-IR')} ت
                      </span>
                    </div>
                    <div className="bg-[#FAF7F2] p-1.5 rounded-lg">
                      <span className="text-[#8C7A6B] block text-[10px]">سود ناخالص</span>
                      <span className="font-mono tabular-nums font-bold text-emerald-700">
                        {profit.toLocaleString('fa-IR')} ت
                      </span>
                    </div>
                    <div className="bg-[#FAF7F2] p-1.5 rounded-lg">
                      <span className="text-[#8C7A6B] block text-[10px]">حاشیه سود</span>
                      <span className="font-mono tabular-nums font-bold text-[#4A2E1B]">
                        {marginPercent}٪
                      </span>
                    </div>
                  </div>

                  {/* Recipe Items Tags */}
                  {product.recipe && product.recipe.length > 0 && (
                    <div className="mt-3 pt-2 text-[10px] text-[#8C7A6B] flex flex-wrap gap-1">
                      <span className="font-semibold text-[#543825]">مواد مصرفی:</span>
                      {product.recipe.map((r, i) => {
                        const ing = ingredients.find((ing) => ing.id === r.ingredientId);
                        return (
                          <span key={i} className="bg-[#F2ECE4] px-1.5 py-0.5 rounded">
                            {ing?.nameFa || r.ingredientId} ({r.amount} {ing?.unit})
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-[#FAF7F2] border-t border-[#E8DFD5] flex items-center justify-between">
                <button
                  onClick={() => handleToggleAvailable(product)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    product.isAvailable
                      ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                      : 'text-stone-700 bg-stone-100 hover:bg-stone-200'
                  }`}
                >
                  {product.isAvailable ? 'موجود در منو' : 'علامت به عنوان موجود'}
                </button>

                <button
                  onClick={() => openEditModal(product)}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#4A2E1B] hover:text-[#2C1810] px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>ویرایش</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-[#E8DFD5] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-[#FAF7F2] border-b border-[#E8DFD5] flex items-center justify-between">
              <h3 className="font-bold text-[#2C1810] text-sm">
                {editingProduct ? 'ویرایش مشخصات و فرمول محصول' : 'تعریف محصول جدید در منو'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-[#9C8975] hover:text-[#2C1810] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">نام فارسی محصول</label>
                  <input
                    type="text"
                    required
                    value={nameFa}
                    onChange={(e) => setNameFa(e.target.value)}
                    placeholder="مثلاً کافه لاته زعفرانی"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">نام انگلیسی</label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Saffron Cafe Latte"
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">دسته‌بندی</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white focus:outline-none focus:border-[#4A2E1B]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameFa}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">زمان تقریبی آماده‌سازی (دقیقه)</label>
                  <input
                    type="number"
                    min={1}
                    value={prepTime}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">قیمت فروش (تومان)</label>
                  <input
                    type="number"
                    required
                    step={1000}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] font-mono text-left"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#543825] mb-1">بهای تمام‌شده تخمینی (تومان)</label>
                  <input
                    type="number"
                    step={1000}
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] font-mono text-left"
                  />
                </div>
              </div>

              {/* Dedicated Image Selection */}
              <div>
                <label className="block font-semibold text-[#543825] mb-1.5">
                  تصویر اختصاصی آیتم
                </label>
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-16 h-16 rounded-xl border border-[#E8DFD5] overflow-hidden shrink-0 shadow-xs bg-[#FAF7F2]">
                    <img
                      src={imageUrl}
                      alt="پیش‌نمایش"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/latte_art.jpg';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/images/latte_art.jpg یا آدرس اینترنتی عکس"
                    className="flex-1 px-3 py-2 rounded-xl border border-[#E8DFD5] text-xs font-mono text-left"
                  />
                </div>

                {/* Preset Fast Picker */}
                <div>
                  <span className="text-[11px] text-[#8C7A6B] block mb-1">انتخاب سریع از گالری اختصاصی نیکو کافه:</span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-24 overflow-y-auto p-1 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5]">
                    {PRESET_CAFE_IMAGES.map((img) => (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => setImageUrl(img.url)}
                        className={`flex flex-col items-center p-1 rounded-lg border transition-all ${
                          imageUrl === img.url
                            ? 'border-[#4A2E1B] bg-white ring-1 ring-[#4A2E1B]'
                            : 'border-transparent hover:bg-white/80'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.label}
                          className="w-7 h-7 rounded-md object-cover"
                        />
                        <span className="text-[9px] text-[#543825] truncate mt-0.5 max-w-full">
                          {img.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">توضیحات و ترکیبات</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="عصاره‌گیری تازه با شیر ارگانیک..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                />
              </div>

              {/* Recipe Ingredients Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-[#543825]">
                    دستور تهیه (فرمول کسر خودکار انبار)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (ingredients.length > 0) {
                        setRecipeItems((prev) => [
                          ...prev,
                          { ingredientId: ingredients[0].id, amount: 10 },
                        ]);
                      }
                    }}
                    className="text-[11px] text-[#4A2E1B] font-bold hover:underline"
                  >
                    + افزودن ماده اولیه
                  </button>
                </div>

                <div className="space-y-2">
                  {recipeItems.map((item, index) => {
                    const ing = ingredients.find((i) => i.id === item.ingredientId);
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={item.ingredientId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRecipeItems((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, ingredientId: val } : r))
                            );
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#E8DFD5] bg-white"
                        >
                          {ingredients.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.nameFa} ({i.unit})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step={ing?.unit === 'liter' ? 0.05 : 1}
                          value={item.amount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setRecipeItems((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, amount: val } : r))
                            );
                          }}
                          placeholder="مقدار"
                          className="w-20 px-2 py-1.5 rounded-lg border border-[#E8DFD5] text-center font-mono"
                        />
                        <span className="text-[11px] text-[#8C7A6B] w-8">{ing?.unit}</span>
                        <button
                          type="button"
                          onClick={() => setRecipeItems((prev) => prev.filter((_, i) => i !== index))}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8DFD5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-3 py-2 text-[#7A6A5C] hover:text-[#2C1810]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] text-white font-bold rounded-xl"
                >
                  ذخیره اطلاعات محصول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
