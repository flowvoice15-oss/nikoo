import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function askCafeAI(userMessage: string, userName: string, userRole: string): Promise<string> {
  const data = db.get();

  // Generate live cafe context snapshot
  const occupiedTables = data.tables.filter((t) => t.status === 'occupied' || t.status === 'kitchen_pending' || t.status === 'ready_to_serve');
  const emptyTables = data.tables.filter((t) => t.status === 'empty');
  const reservedTables = data.tables.filter((t) => t.status === 'reserved');

  const pendingOrders = data.orders.filter((o) => o.status === 'preparing' || o.status === 'submitted');
  const readyOrders = data.orders.filter((o) => o.status === 'ready');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = data.orders.filter((o) => o.createdAt.startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const todayPaid = todayOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);

  const lowStockIngredients = data.ingredients.filter((i) => i.currentStock <= i.minThreshold);

  // Top items
  const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const o of data.orders) {
    for (const it of o.items) {
      if (!itemCounts[it.menuItemId]) {
        itemCounts[it.menuItemId] = { name: it.nameFa, count: 0, revenue: 0 };
      }
      itemCounts[it.menuItemId].count += it.quantity;
      itemCounts[it.menuItemId].revenue += it.quantity * it.unitPrice;
    }
  }
  const topSellers = Object.values(itemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const contextPrompt = `
داده‌های زنده و لحظه‌ای نیکو کافه (NIKO CAFE):
- کاربر سؤال‌کننده: ${userName} (نقش: ${userRole})
- وضعیت میزها:
  * کل میزها: ${data.tables.length} میز
  * میزهای اشغال: ${occupiedTables.length} (${occupiedTables.map((t) => `میز ${t.number} (${t.label})`).join('، ') || 'هیچ'})
  * میزهای خالی: ${emptyTables.length} (${emptyTables.map((t) => `میز ${t.number}`).join('، ')})
  * میزهای رزرو: ${reservedTables.length} (${reservedTables.map((t) => `میز ${t.number}`).join('، ') || 'هیچ'})
- وضعیت آشپزخانه و سفارش‌ها:
  * در حال آماده‌سازی: ${pendingOrders.length} سفارش (${pendingOrders.map((o) => `#${o.orderNumber} میز ${o.tableNumber || 'بیرون‌بر'}`).join('، ') || 'هیچ'})
  * آماده سرو/تحویل: ${readyOrders.length} سفارش (${readyOrders.map((o) => `#${o.orderNumber} میز ${o.tableNumber || 'بیرون‌بر'}`).join('، ') || 'هیچ'})
- وضعیت فروش و مالی امروز:
  * تعداد کل سفارش‌های امروز: ${todayOrders.length}
  * مجموع فروش امروز: ${todaySales.toLocaleString('fa-IR')} تومان
  * مجموع دریافتی امروز: ${todayPaid.toLocaleString('fa-IR')} تومان
- موجودی بحرانی و اقلام رو به اتمام:
  ${lowStockIngredients.length > 0 ? lowStockIngredients.map((i) => `* ${i.nameFa}: موجودی ${i.currentStock} ${i.unit} (حداقل مجاز: ${i.minThreshold} ${i.unit})`).join('\n  ') : '* تمامی اقلام دارای موجودی کافی هستند.'}
- ۵ محصول پرفروش کافه:
  ${topSellers.map((s, idx) => `${idx + 1}. ${s.name}: ${s.count} سفارش (${s.revenue.toLocaleString('fa-IR')} تومان)`).join('\n  ')}
- مواد اولیه شاخص:
  * دان قهوه تخصصی: ${data.ingredients.find((i) => i.id === 'ing_beans_specialty')?.currentStock || 0} گرم
  * شیر تازه پرچرب: ${data.ingredients.find((i) => i.id === 'ing_fresh_milk')?.currentStock || 0} لیتر
  * کرواسان کره ای: ${data.ingredients.find((i) => i.id === 'ing_fresh_croissant')?.currentStock || 0} عدد
`;

  const systemInstruction = `تو "دستیار هوشمند نیکو کافه (NIKO CAFE AI Agent)" هستی؛ یک مشاور و دستیار هوشمند، فوق‌العاده باهوش، دقیق، مؤدب و مسلط به تمام فرآیندهای مدیریت کافه، صندوق (POS)، مدیریت میزها، آشپزخانه، انبار و مواد اولیه و امور مالی.
وظایف تو:
۱. پاسخ دقیق، صریح و مبتنی بر داده‌های واقعی کافه به سؤالات پرسنل و مدیر.
۲. تحلیل وضعیت میزها، فروش، آشپزخانه، هشدار کمبود موجودی و ارائه پیشنهادات بهینه‌سازی.
۳. در صورت پرسش درباره وضعیت میزها یا سفارش‌ها، دقیقاً با ذکر شماره میز و اقلام پاسخ بده.
۴. زبان پاسخ‌ها کاملاً فارسی روان، شیک و حرفه‌ای، با اعداد فارسی یا خوانا و احترام‌آمیز باشد.
۵. از بیان تخمین‌های نامربوط خودداری کن و همیشه بر اساس داده‌های زنده بالا پاسخ بده.
۶. عملیات حساس نظیر پرداخت یا تسویه نیازمند تأیید در صندوق است و تو فقط راهنمایی و گزارش ارائه می‌دهی.`;

  const client = getAIClient();
  if (!client) {
    // High quality programmatic fallback if API key is not configured yet
    return generateDeterministicCafeResponse(userMessage, contextPrompt, data);
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${contextPrompt}\n\nسؤال کاربر:\n${userMessage}`,
      config: {
        systemInstruction,
      },
    });

    return response.text || 'پاسخی از مدل دریافت نشد.';
  } catch (error) {
    console.error('Gemini AI call error:', error);
    return generateDeterministicCafeResponse(userMessage, contextPrompt, data);
  }
}

function generateDeterministicCafeResponse(query: string, _context: string, data: ReturnType<typeof db.get>): string {
  const q = query.toLowerCase();

  if (q.includes('میز') && (q.includes('اشغال') || q.includes('وضعیت') || q.includes('کدام'))) {
    const occupied = data.tables.filter((t) => t.status === 'occupied' || t.status === 'kitchen_pending' || t.status === 'ready_to_serve');
    if (occupied.length === 0) return 'در حال حاضر هیچ میزی در کافه اشغال نیست و تمامی میزها خالی و آماده پذیرایی هستند.';
    return `در حال حاضر ${occupied.length} میز اشغال است:\n` +
      occupied.map((t) => `• میز شماره ${t.number} (${t.label}) - وضعیت: ${getTableStatusFa(t.status)} - گارسون: ${t.currentWaiter || 'نامشخص'}`).join('\n');
  }

  if (q.includes('فروش') || q.includes('درآمد') || q.includes('چقدر')) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = data.orders.filter((o) => o.createdAt.startsWith(todayStr));
    const total = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
    return `فروش ثبت‌شده امروز در نیکو کافه مبلغ ${total.toLocaleString('fa-IR')} تومان برای تعداد ${todayOrders.length} سفارش می‌باشد.`;
  }

  if (q.includes('شیر') || q.includes('موجودی') || q.includes('انبار') || q.includes('قهوه')) {
    const milk = data.ingredients.find((i) => i.id === 'ing_fresh_milk');
    const coffee = data.ingredients.find((i) => i.id === 'ing_beans_specialty');
    const low = data.ingredients.filter((i) => i.currentStock <= i.minThreshold);
    return `گزارش انبار و موجودی مواد اولیه:\n` +
      `• موجودی شیر تازه: ${milk ? `${milk.currentStock} لیتر` : 'ناموجود'}\n` +
      `• موجودی دان قهوه اسپشالتی: ${coffee ? `${(coffee.currentStock / 1000).toFixed(1)} کیلوگرم` : 'ناموجود'}\n` +
      (low.length > 0 ? `⚠️ اقلام زیر به حداقل آستانه رسیده‌اند و نیاز به سفارش خرید دارند:\n` + low.map((i) => `  - ${i.nameFa}: ${i.currentStock} ${i.unit}`).join('\n') : '✅ وضعیت موجودی تمامی اقلام در حد استاندارد است.');
  }

  if (q.includes('پرفروش') || q.includes('محبوب')) {
    return 'محبوب‌ترین و پرفروش‌ترین آیتم‌های منو در حال حاضر: کافه لاته آرت، اسپرسو دبل ریسترتو، کلد برو مرکباتی و کرواسان کره‌ای فرانسوی می‌باشند.';
  }

  return `سلام! من دستیار هوشمند نیکو کافه هستم. سیستم به دیتابیس زنده کافه شامل ${data.tables.length} میز، ${data.menuItems.length} قلم محصول و ${data.ingredients.length} ماده اولیه متصل است. می‌توانید درباره فروش امروز، وضعیت میزها، سفارش‌های در انتظار آشپزخانه یا موجودی انبار از من بپرسید!`;
}

function getTableStatusFa(status: string): string {
  switch (status) {
    case 'empty': return 'خالی';
    case 'occupied': return 'اشغال شده';
    case 'kitchen_pending': return 'سفارش در حال آماده‌سازی';
    case 'ready_to_serve': return 'آماده سرو';
    case 'reserved': return 'رزرو شده';
    case 'disabled': return 'غیرفعال';
    default: return status;
  }
}
