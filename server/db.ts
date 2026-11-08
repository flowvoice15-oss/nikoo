import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  passwordHash: string;
  salt: string;
  role: 'super_admin' | 'manager' | 'barista' | 'waiter' | 'cashier' | 'chef' | 'inventory_manager' | 'accountant';
  roleTitle: string;
  phone: string;
  mustChangePassword: boolean;
  avatarUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CafeTable {
  id: string;
  number: number;
  label: string;
  sectionId: string;
  seats: number;
  shape: 'circle' | 'square' | 'rectangle';
  posX: number; // percentage or px on floor map
  posY: number;
  width: number;
  height: number;
  status: 'empty' | 'occupied' | 'kitchen_pending' | 'ready_to_serve' | 'reserved' | 'disabled';
  activeOrderId?: string | null;
  currentWaiter?: string | null;
  customerCount?: number;
  occupiedSince?: string | null;
}

export interface CafeSection {
  id: string;
  name: string;
  description: string;
}

export interface MenuItemOption {
  name: string;
  priceModifier: number;
}

export interface MenuItemOptionGroup {
  id: string;
  title: string;
  required: boolean;
  options: MenuItemOption[];
}

export interface RecipeItem {
  ingredientId: string;
  amount: number; // in ingredient's unit
}

export interface MenuItem {
  id: string;
  nameFa: string;
  nameEn: string;
  categoryId: string;
  price: number;
  costPrice: number;
  prepTimeMinutes: number;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  optionGroups?: MenuItemOptionGroup[];
  recipe: RecipeItem[];
}

export interface MenuCategory {
  id: string;
  nameFa: string;
  nameEn: string;
  icon: string;
  sortOrder: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  nameFa: string;
  unitPrice: number;
  quantity: number;
  selectedOptions?: string[];
  notes?: string;
  status: 'new' | 'preparing' | 'ready' | 'served' | 'cancelled';
  prepStartedAt?: string;
  prepCompletedAt?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  tableId?: string | null;
  tableNumber?: number | null;
  type: 'dine_in' | 'takeaway' | 'delivery' | 'reservation';
  customerId?: string | null;
  customerName?: string;
  waiterName?: string;
  cashierName?: string;
  createdAt: string;
  status: 'draft' | 'submitted' | 'preparing' | 'ready' | 'served' | 'settled' | 'cancelled';
  cancelReason?: string;
  cancelledBy?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  payments: OrderPayment[];
}

export interface OrderPayment {
  id: string;
  amount: number;
  method: 'cash' | 'pos_card' | 'online' | 'loyalty_points';
  timestamp: string;
  registeredBy: string;
  referenceCode?: string;
}

export interface Ingredient {
  id: string;
  nameFa: string;
  category: string;
  unit: 'kg' | 'g' | 'liter' | 'ml' | 'count';
  currentStock: number;
  minThreshold: number;
  costPerUnit: number;
  supplierId: string;
  lastRestockedAt: string;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: 'in' | 'out_order' | 'waste' | 'adjustment';
  amount: number;
  unit: string;
  reason: string;
  performedBy: string;
  timestamp: string;
  orderId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  category: string;
  address: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  secondPhone?: string;
  birthDate?: string;
  address?: string;
  notes?: string;
  status: 'normal' | 'vip' | 'inactive';
  registeredAt: string;
  visitCount: number;
  totalSpent: number;
  loyaltyPoints: number;
  favoriteItems?: string[];
}

export interface Reservation {
  id: string;
  tableId: string;
  tableNumber: number;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  status: 'confirmed' | 'arrived' | 'cancelled';
  createdAt: string;
}

export interface CashShift {
  id: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  initialFloat: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'supplies' | 'salaries' | 'utilities' | 'maintenance' | 'other';
  amount: number;
  date: string;
  paidBy: string;
  description?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface CafeSettings {
  cafeName: string;
  cafeAddress: string;
  cafePhone: string;
  workingHours: string;
  taxRatePercent: number;
  serviceFeePercent: number;
  loyaltyPointPerToman: number; // e.g., 10000 Toman = 1 pt
  loyaltyPointValueToman: number; // 1 pt = 500 Toman discount
  receiptFooterMessage: string;
}

export interface DatabaseSchema {
  users: User[];
  sections: CafeSection[];
  tables: CafeTable[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  customers: Customer[];
  orders: Order[];
  reservations: Reservation[];
  cashShifts: CashShift[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  settings: CafeSettings;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'cafe_db.json');

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return check === hash;
}

function getInitialDatabase(): DatabaseSchema {
  // Hash the initial master admin password securely
  const adminAuth = hashPassword('138708');

  // Additional staff hashes
  const baristaAuth = hashPassword('barista123');
  const waiterAuth = hashPassword('waiter123');
  const cashierAuth = hashPassword('cashier123');

  const now = new Date().toISOString();

  return {
    users: [
      {
        id: 'usr_super_admin',
        name: 'مدیر کل نیکو کافه',
        email: 'flowvoice15@gmail.com',
        passwordHash: adminAuth.hash,
        salt: adminAuth.salt,
        role: 'super_admin',
        roleTitle: 'مدیر ارشد و مالک سیستم',
        phone: '09120000001',
        mustChangePassword: true, // User must change password upon first login
        status: 'active',
        createdAt: now,
      },
      {
        id: 'usr_manager',
        name: 'سهراب مرادی',
        email: 'manager@nikocafe.com',
        passwordHash: adminAuth.hash,
        salt: adminAuth.salt,
        role: 'manager',
        roleTitle: 'مدیر شیفت و داخلی',
        phone: '09121112233',
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
      },
      {
        id: 'usr_barista_1',
        name: 'آرشام کیانی',
        email: 'barista@nikocafe.com',
        passwordHash: baristaAuth.hash,
        salt: baristaAuth.salt,
        role: 'barista',
        roleTitle: 'سرباریستا و متخصص قهوه',
        phone: '09123334455',
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
      },
      {
        id: 'usr_waiter_1',
        name: 'نیما فراهانی',
        email: 'waiter@nikocafe.com',
        passwordHash: waiterAuth.hash,
        salt: waiterAuth.salt,
        role: 'waiter',
        roleTitle: 'میزبان و گارسون ارشد',
        phone: '09125556677',
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
      },
      {
        id: 'usr_cashier_1',
        name: 'مهسا صادقی',
        email: 'cashier@nikocafe.com',
        passwordHash: cashierAuth.hash,
        salt: cashierAuth.salt,
        role: 'cashier',
        roleTitle: 'صندوقدار و مسئول پذیرش',
        phone: '09127778899',
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
      },
    ],
    sections: [
      { id: 'sec_main', name: 'سالن اصلی (کافه)', description: 'فضای دلنشین مرکزی کافه با بار اختصاصی' },
      { id: 'sec_terrace', name: 'تراس و فضای باز', description: 'هوای آزاد و گلدان‌های زیتون با نور طبیعی' },
      { id: 'sec_vip', name: 'سالن VIP و جلسات', description: 'میزهای بزرگ کنفرانس و دیدارهای کاری' },
    ],
    tables: [
      {
        id: 'tbl_1',
        number: 1,
        label: 'میز ۱ (کنار پنجره)',
        sectionId: 'sec_main',
        seats: 2,
        shape: 'square',
        posX: 14,
        posY: 26,
        width: 80,
        height: 80,
        status: 'occupied',
        activeOrderId: 'ord_101',
        currentWaiter: 'نیما فراهانی',
        customerCount: 2,
        occupiedSince: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
      },
      {
        id: 'tbl_2',
        number: 2,
        label: 'میز ۲ (دونفره دنج)',
        sectionId: 'sec_main',
        seats: 2,
        shape: 'circle',
        posX: 14,
        posY: 60,
        width: 80,
        height: 80,
        status: 'kitchen_pending',
        activeOrderId: 'ord_102',
        currentWaiter: 'نیما فراهانی',
        customerCount: 2,
        occupiedSince: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: 'tbl_3',
        number: 3,
        label: 'میز ۳ (چهارنفره مرکزی)',
        sectionId: 'sec_main',
        seats: 4,
        shape: 'rectangle',
        posX: 38,
        posY: 26,
        width: 110,
        height: 85,
        status: 'empty',
        activeOrderId: null,
      },
      {
        id: 'tbl_4',
        number: 4,
        label: 'میز ۴ (کنار بار قهوه)',
        sectionId: 'sec_main',
        seats: 4,
        shape: 'rectangle',
        posX: 38,
        posY: 60,
        width: 110,
        height: 85,
        status: 'ready_to_serve',
        activeOrderId: 'ord_103',
        currentWaiter: 'نیما فراهانی',
        customerCount: 3,
        occupiedSince: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        id: 'tbl_5',
        number: 5,
        label: 'میز ۵ (گوشه آرام)',
        sectionId: 'sec_main',
        seats: 2,
        shape: 'circle',
        posX: 58,
        posY: 26,
        width: 80,
        height: 80,
        status: 'empty',
        activeOrderId: null,
      },
      {
        id: 'tbl_6',
        number: 6,
        label: 'میز ۶ (شش‌نفره گروهی)',
        sectionId: 'sec_main',
        seats: 6,
        shape: 'rectangle',
        posX: 58,
        posY: 60,
        width: 135,
        height: 85,
        status: 'reserved',
        activeOrderId: null,
      },
      {
        id: 'tbl_7',
        number: 7,
        label: 'میز ۷ (تراس روبه‌آفتاب)',
        sectionId: 'sec_terrace',
        seats: 4,
        shape: 'circle',
        posX: 82,
        posY: 24,
        width: 90,
        height: 90,
        status: 'empty',
        activeOrderId: null,
      },
      {
        id: 'tbl_8',
        number: 8,
        label: 'میز ۸ (تراس گوشه زیتون)',
        sectionId: 'sec_terrace',
        seats: 4,
        shape: 'square',
        posX: 82,
        posY: 52,
        width: 90,
        height: 90,
        status: 'empty',
        activeOrderId: null,
      },
      {
        id: 'tbl_9',
        number: 9,
        label: 'میز ۹ (تراس دونفره آرام)',
        sectionId: 'sec_terrace',
        seats: 2,
        shape: 'circle',
        posX: 82,
        posY: 80,
        width: 80,
        height: 80,
        status: 'empty',
        activeOrderId: null,
      },
      {
        id: 'tbl_10',
        number: 10,
        label: 'میز ۱۰ (سالن کنفرانس VIP)',
        sectionId: 'sec_vip',
        seats: 8,
        shape: 'rectangle',
        posX: 38,
        posY: 85,
        width: 160,
        height: 100,
        status: 'empty',
        activeOrderId: null,
      },
    ],
    categories: [
      { id: 'cat_hot_coffee', nameFa: 'قهوه گرم', nameEn: 'Hot Coffee', icon: 'Coffee', sortOrder: 1 },
      { id: 'cat_cold_coffee', nameFa: 'قهوه سرد و آیس', nameEn: 'Cold Coffee', icon: 'CupSoda', sortOrder: 2 },
      { id: 'cat_tea_herbal', nameFa: 'چای و دمنوش', nameEn: 'Tea & Herbal', icon: 'Flame', sortOrder: 3 },
      { id: 'cat_cold_drinks', nameFa: 'نوشیدنی سرد و ماکتل', nameEn: 'Cold Drinks', icon: 'GlassWater', sortOrder: 4 },
      { id: 'cat_bakery', nameFa: 'کیک و شیرینی دست‌ساز', nameEn: 'Bakery & Pastry', icon: 'Cake', sortOrder: 5 },
      { id: 'cat_breakfast_food', nameFa: 'صبحانه و میان‌وعده', nameEn: 'Breakfast & Snacks', icon: 'Utensils', sortOrder: 6 },
    ],
    suppliers: [
      { id: 'sup_1', name: 'برشته‌کاری تخصصی ریو (Rio Coffee Roasters)', contactPerson: 'مهندس کاویانی', phone: '02188991122', category: 'دان قهوه و ملزومات دم‌آوری', address: 'تهران، خیابان سهروردی شمالی' },
      { id: 'sup_2', name: 'لبنیات سنتی پاک دشت', contactPerson: 'آقای صالحی', phone: '02166554433', category: 'شیر تازه و خامه', address: 'تهران، بزرگراه فتح' },
      { id: 'sup_3', name: 'قنادی و نانوایی فرانسوی لوتوس', contactPerson: 'خانم بهرامی', phone: '02122334455', category: 'کرواسان و شیرینی روزانه', address: 'تهران، زعفرانیه' },
      { id: 'sup_4', name: 'پخش مرکزی سیروپ و طعم‌دهنده‌های مونین', contactPerson: 'آقای تقوی', phone: '02177889900', category: 'سیروپ و پودر کاکائو', address: 'تهران، خیابان شریعتی' },
    ],
    ingredients: [
      { id: 'ing_beans_specialty', nameFa: 'دان قهوه تخصصی ۱۰۰٪ عربیکا (اتیوپی سیدامو)', category: 'قهوه', unit: 'g', currentStock: 8400, minThreshold: 3000, costPerUnit: 1200, supplierId: 'sup_1', lastRestockedAt: now },
      { id: 'ing_beans_house', nameFa: 'دان قهوه هاوس بلند نیکو (۸۰/۲۰ برزیل)', category: 'قهوه', unit: 'g', currentStock: 12500, minThreshold: 4000, costPerUnit: 850, supplierId: 'sup_1', lastRestockedAt: now },
      { id: 'ing_fresh_milk', nameFa: 'شیر تازه پرچرب ۳.۵٪ باریستا', category: 'لبنیات', unit: 'liter', currentStock: 24, minThreshold: 10, costPerUnit: 42000, supplierId: 'sup_2', lastRestockedAt: now },
      { id: 'ing_oat_milk', nameFa: 'شیر گیاهی جو دوسر (Oat Milk)', category: 'لبنیات', unit: 'liter', currentStock: 6, minThreshold: 4, costPerUnit: 110000, supplierId: 'sup_2', lastRestockedAt: now },
      { id: 'ing_belgian_chocolate', nameFa: 'پودر شکلات تلخ بلژیکی ۷۰٪', category: 'سیروپ و شکلات', unit: 'g', currentStock: 3200, minThreshold: 1000, costPerUnit: 900, supplierId: 'sup_4', lastRestockedAt: now },
      { id: 'ing_vanilla_syrup', nameFa: 'سیروپ وانیل ماداگاسکار', category: 'سیروپ و شکلات', unit: 'ml', currentStock: 1400, minThreshold: 500, costPerUnit: 450, supplierId: 'sup_4', lastRestockedAt: now },
      { id: 'ing_caramel_sauce', nameFa: 'سس کارامل نمکی خانگی', category: 'سیروپ و شکلات', unit: 'g', currentStock: 1800, minThreshold: 600, costPerUnit: 520, supplierId: 'sup_4', lastRestockedAt: now },
      { id: 'ing_lahijan_tea', nameFa: 'چای بهاره دست‌چین سرگل لاهیجان', category: 'چای', unit: 'g', currentStock: 4500, minThreshold: 1500, costPerUnit: 600, supplierId: 'sup_1', lastRestockedAt: now },
      { id: 'ing_herbal_mix', nameFa: 'ترکیب گل‌گاوزبان، سنبل‌الطیب و بهارنارنج', category: 'چای', unit: 'g', currentStock: 2100, minThreshold: 800, costPerUnit: 750, supplierId: 'sup_1', lastRestockedAt: now },
      { id: 'ing_fresh_croissant', nameFa: 'کرواسان کره‌ای پخت روز', category: 'شیرینی', unit: 'count', currentStock: 18, minThreshold: 6, costPerUnit: 75000, supplierId: 'sup_3', lastRestockedAt: now },
      { id: 'ing_san_sebastian', nameFa: 'اسلایس چیزکیک سن سباستین', category: 'شیرینی', unit: 'count', currentStock: 12, minThreshold: 4, costPerUnit: 110000, supplierId: 'sup_3', lastRestockedAt: now },
      { id: 'ing_berry_tart', nameFa: 'تارت توت فرنگی و تمشک تازه', category: 'شیرینی', unit: 'count', currentStock: 7, minThreshold: 5, costPerUnit: 95000, supplierId: 'sup_3', lastRestockedAt: now },
      { id: 'ing_panini_bread', nameFa: 'نان چاباتا مخصوص پنینی', category: 'نان و غذا', unit: 'count', currentStock: 15, minThreshold: 5, costPerUnit: 35000, supplierId: 'sup_3', lastRestockedAt: now },
      { id: 'ing_smoked_turkey', nameFa: 'ژامبون بوقلمون دودی ۹۰٪', category: 'نان و غذا', unit: 'g', currentStock: 2200, minThreshold: 1000, costPerUnit: 800, supplierId: 'sup_3', lastRestockedAt: now },
    ],
    menuItems: [
      {
        id: 'item_espresso_double',
        nameFa: 'اسپرسو دبل ریسترتو',
        nameEn: 'Double Espresso Ristretto',
        categoryId: 'cat_hot_coffee',
        price: 85000,
        costPrice: 22000,
        prepTimeMinutes: 3,
        description: 'عصاره‌گیری دقیق از دان تخصصی عربیکا با کرمای غلیظ فندقی و تن‌واری مخملی',
        imageUrl: '/images/espresso_double.jpg',
        isAvailable: true,
        isFeatured: true,
        recipe: [{ ingredientId: 'ing_beans_specialty', amount: 18 }],
        optionGroups: [
          {
            id: 'opt_beans',
            title: 'نوع دان قهوه',
            required: true,
            options: [
              { name: '۱۰۰٪ عربیکا تخصصی اتیوپی', priceModifier: 0 },
              { name: 'هاوس بلند نیکو (۸۰/۲۰)', priceModifier: -10000 },
            ],
          },
        ],
      },
      {
        id: 'item_latte_art',
        nameFa: 'کافه لاته آرت',
        nameEn: 'Artisanal Cafe Latte',
        categoryId: 'cat_hot_coffee',
        price: 125000,
        costPrice: 38000,
        prepTimeMinutes: 5,
        description: 'اسپرسو دبل همراه با فوم حریری شیر تازه پرچرب و لاته آرت طرح رُزتا',
        imageUrl: '/images/latte_art.jpg',
        isAvailable: true,
        isFeatured: true,
        recipe: [
          { ingredientId: 'ing_beans_specialty', amount: 18 },
          { ingredientId: 'ing_fresh_milk', amount: 0.22 },
        ],
        optionGroups: [
          {
            id: 'opt_milk_type',
            title: 'انتخاب نوع شیر',
            required: false,
            options: [
              { name: 'شیر پرچرب باریستا (پیش‌فرض)', priceModifier: 0 },
              { name: 'شیر جو دوسر گیاهی (Oat Milk)', priceModifier: 25000 },
              { name: 'شیر کم‌چرب', priceModifier: 0 },
            ],
          },
          {
            id: 'opt_syrup',
            title: 'افزودن سیروپ طعم‌دار',
            required: false,
            options: [
              { name: 'وانیل ماداگاسکار', priceModifier: 20000 },
              { name: 'کارامل نمکی', priceModifier: 20000 },
            ],
          },
        ],
      },
      {
        id: 'item_cappuccino',
        nameFa: 'کاپوچینو کلاسیک ایتالیایی',
        nameEn: 'Classic Italian Cappuccino',
        categoryId: 'cat_hot_coffee',
        price: 115000,
        costPrice: 35000,
        prepTimeMinutes: 4,
        description: 'ترکیب متوازن یک‌سوم اسپرسو، یک‌سوم شیر گرم و یک‌سوم فوم متراکم کرمی با پودر دارچین اختیاری',
        imageUrl: '/images/cappuccino.jpg',
        isAvailable: true,
        recipe: [
          { ingredientId: 'ing_beans_specialty', amount: 18 },
          { ingredientId: 'ing_fresh_milk', amount: 0.18 },
        ],
      },
      {
        id: 'item_cold_brew',
        nameFa: 'کلد برو مرکباتی نیکو',
        nameEn: 'Citrus Infused Cold Brew',
        categoryId: 'cat_cold_coffee',
        price: 135000,
        costPrice: 32000,
        prepTimeMinutes: 2,
        description: 'دم‌آوری سرد ۱۸ ساعته با نت‌های گلی و شکلاتی، سرو شده با یخ بلوری و اسلایس پرتقال تازه',
        imageUrl: '/images/cold_brew.jpg',
        isAvailable: true,
        isFeatured: true,
        recipe: [{ ingredientId: 'ing_beans_specialty', amount: 25 }],
      },
      {
        id: 'item_iced_latte',
        nameFa: 'آیس لاته کاراملی',
        nameEn: 'Iced Caramel Latte',
        categoryId: 'cat_cold_coffee',
        price: 140000,
        costPrice: 42000,
        prepTimeMinutes: 4,
        description: 'اسپرسو دبل روی قطعات یخ کریستالی، شیر سرد غلیظ و سس کارامل نمکی روان',
        imageUrl: '/images/iced_latte.jpg',
        isAvailable: true,
        recipe: [
          { ingredientId: 'ing_beans_specialty', amount: 18 },
          { ingredientId: 'ing_fresh_milk', amount: 0.2 },
          { ingredientId: 'ing_caramel_sauce', amount: 20 },
        ],
      },
      {
        id: 'item_hot_chocolate',
        nameFa: 'هات چاکلت بلژیکی غلیظ',
        nameEn: 'Belgian Hot Chocolate',
        categoryId: 'cat_hot_coffee',
        price: 130000,
        costPrice: 40000,
        prepTimeMinutes: 6,
        description: 'شکلات تلخ ذوب‌شده بلژیکی با شیر پرچرب داغ و بافت ابریشمی بسیار غنی',
        imageUrl: '/images/hot_chocolate.jpg',
        isAvailable: true,
        recipe: [
          { ingredientId: 'ing_belgian_chocolate', amount: 35 },
          { ingredientId: 'ing_fresh_milk', amount: 0.22 },
        ],
      },
      {
        id: 'item_tea_pot',
        nameFa: 'چای قوری سرگل لاهیجان (دونفره)',
        nameEn: 'Lahijan Spring Tea Pot',
        categoryId: 'cat_tea_herbal',
        price: 95000,
        costPrice: 18000,
        prepTimeMinutes: 8,
        description: 'دم‌کشیده در قوری چینی با هل کوبیده، نبات زعفرانی و باقلوای خانگی',
        imageUrl: '/images/tea_pot.jpg',
        isAvailable: true,
        recipe: [{ ingredientId: 'ing_lahijan_tea', amount: 15 }],
      },
      {
        id: 'item_herbal_relax',
        nameFa: 'دمنوش آرامش نیکو',
        nameEn: 'Niko Serenity Herbal Infusion',
        categoryId: 'cat_tea_herbal',
        price: 105000,
        costPrice: 22000,
        prepTimeMinutes: 7,
        description: 'ترکیب ارگانیک گل‌گاوزبان، به‌لیمو، سنبل‌الطیب و عسل طبیعی کنار چوب دارچین',
        imageUrl: '/images/herbal_relax.jpg',
        isAvailable: true,
        recipe: [{ ingredientId: 'ing_herbal_mix', amount: 20 }],
      },
      {
        id: 'item_croissant',
        nameFa: 'کرواسان کره‌ای اصیل فرانسوی',
        nameEn: 'French Butter Croissant',
        categoryId: 'cat_bakery',
        price: 110000,
        costPrice: 75000,
        prepTimeMinutes: 2,
        description: 'پخت روزانه با کره طبیعی نیوزلندی، لایه‌های ترد و سبک با عطر وسوسه‌انگیز کره',
        imageUrl: '/images/croissant.jpg',
        isAvailable: true,
        isFeatured: true,
        recipe: [{ ingredientId: 'ing_fresh_croissant', amount: 1 }],
      },
      {
        id: 'item_san_sebastian_cake',
        nameFa: 'چیزکیک سن سباستین با سس شکلات',
        nameEn: 'San Sebastian Cheesecake',
        categoryId: 'cat_bakery',
        price: 175000,
        costPrice: 110000,
        prepTimeMinutes: 3,
        description: 'چیزکیک برشته باسکی با مغز لطیف کرمی، سرو همراه سس شکلات تلخ بلژیکی داغ',
        imageUrl: '/images/san_sebastian.jpg',
        isAvailable: true,
        recipe: [{ ingredientId: 'ing_san_sebastian', amount: 1 }],
      },
      {
        id: 'item_berry_tart_slice',
        nameFa: 'تارت میوه‌های جنگلی و تمشک',
        nameEn: 'Wild Berry Custard Tart',
        categoryId: 'cat_bakery',
        price: 160000,
        costPrice: 95000,
        prepTimeMinutes: 2,
        description: 'خمیر تارت ترد سابله با کرم پاتیسیر وانیلی و توت‌فرنگی و تمشک تازه تابستانه',
        imageUrl: '/images/berry_tart.jpg',
        isAvailable: true,
        recipe: [{ ingredientId: 'ing_berry_tart', amount: 1 }],
      },
      {
        id: 'item_panini_turkey',
        nameFa: 'پنینی بوقلمون دودی و پنیر گودا',
        nameEn: 'Smoked Turkey & Gouda Panini',
        categoryId: 'cat_breakfast_food',
        price: 210000,
        costPrice: 98000,
        prepTimeMinutes: 10,
        description: 'نان چاباتا برشته شده با گریل چدنی، بوقلمون دودی، پنیر گودای ذوب‌شده و سس پستوی ریحان',
        imageUrl: '/images/panini_turkey.jpg',
        isAvailable: true,
        recipe: [
          { ingredientId: 'ing_panini_bread', amount: 1 },
          { ingredientId: 'ing_smoked_turkey', amount: 120 },
        ],
      },
    ],
    customers: [
      {
        id: 'cust_1',
        name: 'دکتر مهران علوی',
        phone: '09121234567',
        status: 'vip',
        registeredAt: '2026-01-15T10:00:00.000Z',
        visitCount: 28,
        totalSpent: 4850000,
        loyaltyPoints: 485,
        favoriteItems: ['کافه لاته آرت', 'کرواسان کره‌ای اصیل فرانسوی'],
        notes: 'مشتری قدیمی و روزانه کافه — همیشه لاته با شیر جو دوسر ترجیح می‌دهند.',
      },
      {
        id: 'cust_2',
        name: 'خانم سارا شریفی',
        phone: '09129876543',
        status: 'vip',
        registeredAt: '2026-02-01T14:30:00.000Z',
        visitCount: 14,
        totalSpent: 2650000,
        loyaltyPoints: 265,
        favoriteItems: ['کلد برو مرکباتی نیکو', 'تارت میوه‌های جنگلی و تمشک'],
        notes: 'طراح گرافیک؛ علاقه‌مند به کار با لپ‌تاپ در فضای باز و تراس.',
      },
      {
        id: 'cust_3',
        name: 'مهندس بردیا رحمانی',
        phone: '09355551234',
        status: 'normal',
        registeredAt: '2026-02-18T18:15:00.000Z',
        visitCount: 5,
        totalSpent: 820000,
        loyaltyPoints: 82,
        favoriteItems: ['اسپرسو دبل ریسترتو'],
        notes: 'عاشق قهوه‌های دبل شات بدون شکر.',
      },
    ],
    orders: [
      {
        id: 'ord_101',
        orderNumber: 101,
        tableId: 'tbl_1',
        tableNumber: 1,
        type: 'dine_in',
        customerId: 'cust_1',
        customerName: 'دکتر مهران علوی',
        waiterName: 'نیما فراهانی',
        cashierName: 'مهسا صادقی',
        createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        status: 'served',
        items: [
          {
            id: 'item_ord_1',
            menuItemId: 'item_latte_art',
            nameFa: 'کافه لاته آرت',
            unitPrice: 125000,
            quantity: 2,
            selectedOptions: ['شیر جو دوسر گیاهی (+۲۵,۰۰۰ ت)'],
            notes: 'کم‌حرارت‌تر و آرت رزتا',
            status: 'served',
            prepStartedAt: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
            prepCompletedAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
          },
          {
            id: 'item_ord_2',
            menuItemId: 'item_croissant',
            nameFa: 'کرواسان کره‌ای اصیل فرانسوی',
            unitPrice: 110000,
            quantity: 1,
            notes: 'کمی تست شود',
            status: 'served',
            prepStartedAt: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
            prepCompletedAt: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
          },
        ],
        subtotal: 410000,
        discountAmount: 20000,
        taxAmount: 0,
        serviceAmount: 0,
        totalAmount: 390000,
        paidAmount: 0,
        paymentStatus: 'unpaid',
        payments: [],
      },
      {
        id: 'ord_102',
        orderNumber: 102,
        tableId: 'tbl_2',
        tableNumber: 2,
        type: 'dine_in',
        customerId: 'cust_2',
        customerName: 'خانم سارا شریفی',
        waiterName: 'نیما فراهانی',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        status: 'preparing',
        items: [
          {
            id: 'item_ord_3',
            menuItemId: 'item_cold_brew',
            nameFa: 'کلد برو مرکباتی نیکو',
            unitPrice: 135000,
            quantity: 1,
            status: 'preparing',
            prepStartedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          },
          {
            id: 'item_ord_4',
            menuItemId: 'item_san_sebastian_cake',
            nameFa: 'چیزکیک سن سباستین با سس شکلات',
            unitPrice: 175000,
            quantity: 1,
            status: 'preparing',
            prepStartedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          },
        ],
        subtotal: 310000,
        discountAmount: 0,
        taxAmount: 0,
        serviceAmount: 0,
        totalAmount: 310000,
        paidAmount: 0,
        paymentStatus: 'unpaid',
        payments: [],
      },
      {
        id: 'ord_103',
        orderNumber: 103,
        tableId: 'tbl_4',
        tableNumber: 4,
        type: 'dine_in',
        customerId: null,
        customerName: 'مشتری آزاد (میز ۴)',
        waiterName: 'نیما فراهانی',
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        status: 'ready',
        items: [
          {
            id: 'item_ord_5',
            menuItemId: 'item_cappuccino',
            nameFa: 'کاپوچینو کلاسیک ایتالیایی',
            unitPrice: 115000,
            quantity: 2,
            status: 'ready',
            prepStartedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
            prepCompletedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
          },
          {
            id: 'item_ord_6',
            menuItemId: 'item_berry_tart_slice',
            nameFa: 'تارت میوه‌های جنگلی و تمشک',
            unitPrice: 160000,
            quantity: 1,
            status: 'ready',
            prepStartedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
            prepCompletedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          },
        ],
        subtotal: 390000,
        discountAmount: 0,
        taxAmount: 0,
        serviceAmount: 0,
        totalAmount: 390000,
        paidAmount: 0,
        paymentStatus: 'unpaid',
        payments: [],
      },
      {
        id: 'ord_100',
        orderNumber: 100,
        tableId: null,
        type: 'takeaway',
        customerId: null,
        customerName: 'مشتری حضوری بیرون‌بر',
        cashierName: 'مهسا صادقی',
        createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        status: 'settled',
        items: [
          {
            id: 'item_ord_prev_1',
            menuItemId: 'item_espresso_double',
            nameFa: 'اسپرسو دبل ریسترتو',
            unitPrice: 85000,
            quantity: 2,
            status: 'served',
          },
          {
            id: 'item_ord_prev_2',
            menuItemId: 'item_croissant',
            nameFa: 'کرواسان کره‌ای اصیل فرانسوی',
            unitPrice: 110000,
            quantity: 2,
            status: 'served',
          },
        ],
        subtotal: 390000,
        discountAmount: 0,
        taxAmount: 0,
        serviceAmount: 0,
        totalAmount: 390000,
        paidAmount: 390000,
        paymentStatus: 'paid',
        payments: [
          {
            id: 'pay_100_1',
            amount: 390000,
            method: 'pos_card',
            timestamp: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
            registeredBy: 'مهسا صادقی',
            referenceCode: 'TX-948210',
          },
        ],
      },
    ],
    reservations: [
      {
        id: 'res_1',
        tableId: 'tbl_6',
        tableNumber: 6,
        customerName: 'آقای مهندس رضوی',
        customerPhone: '09124443322',
        guestCount: 6,
        date: new Date().toISOString().split('T')[0],
        time: '19:30',
        notes: 'جلسه کاری تیم مارکتینگ — لطفاً دو قوری چای لاهیجان و بشقاب میوه آماده شود',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      },
    ],
    cashShifts: [
      {
        id: 'shift_today_1',
        cashierName: 'مهسا صادقی',
        openedAt: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
        initialFloat: 2000000,
        expectedCash: 2390000,
        status: 'open',
        notes: 'شیفت صبحگاهی آغاز شد. صندوق تراز است.',
      },
    ],
    expenses: [
      {
        id: 'exp_1',
        title: 'خرید روزانه شیر تازه پاک‌دشت',
        category: 'supplies',
        amount: 840000,
        date: new Date().toISOString().split('T')[0],
        paidBy: 'مهسا صادقی (از تنخواه صندوق)',
        description: '۲۰ بطری شیر پرچرب باریستا ۳.۵٪',
      },
      {
        id: 'exp_2',
        title: 'سرویس دوره‌ای دستگاه اسپرسو لامارزوکو',
        category: 'maintenance',
        amount: 1500000,
        date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
        paidBy: 'سهراب مرادی',
        description: 'تعویض واشر گروپ و بک‌واش با پودر استاندارد',
      },
    ],
    stockMovements: [
      {
        id: 'mov_1',
        ingredientId: 'ing_beans_specialty',
        ingredientName: 'دان قهوه تخصصی ۱۰۰٪ عربیکا (اتیوپی سیدامو)',
        type: 'in',
        amount: 10000,
        unit: 'g',
        reason: 'فاکتور خرید جدید شماره ۴۸۱ از ریو رستر',
        performedBy: 'سهراب مرادی',
        timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
    ],
    auditLogs: [
      {
        id: 'log_init',
        userId: 'usr_super_admin',
        userName: 'مدیر کل نیکو کافه',
        action: 'راه اندازی اولیه سیستم',
        details: 'حساب مدیر کل با نام کاربری flowvoice15@gmail.com فعال شد و دیتابیس نیکو کافه مقداردهی اولیه گردید.',
        timestamp: now,
      },
    ],
    settings: {
      cafeName: 'نیکو کافه (NIKO CAFE)',
      cafeAddress: 'تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۱۴',
      cafePhone: '021-88776655',
      workingHours: 'همه روزه از ساعت ۰۸:۰۰ صبح تا ۲۳:۳۰ شب',
      taxRatePercent: 0, // In Iranian cafes, tax can be 0 or 9 depending on branch
      serviceFeePercent: 0,
      loyaltyPointPerToman: 10000, // 10,000 Toman spend = 1 point
      loyaltyPointValueToman: 500, // 1 point = 500 Toman discount
      receiptFooterMessage: 'از حضور شما در نیکو کافه سپاسگزاریم. لحظاتتان پر از عطر خوش قهوه!',
    },
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Verify critical admin exists
        const admin = parsed.users?.find((u: User) => u.email === 'flowvoice15@gmail.com');
        if (!admin) {
          // Re-insert admin if missing
          const defaultAdmin = getInitialDatabase().users[0];
          parsed.users = [defaultAdmin, ...(parsed.users || [])];
          this.saveDatabaseImmediate(parsed);
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error reading cafe DB, initializing fresh:', err);
    }
    const initial = getInitialDatabase();
    this.saveDatabaseImmediate(initial);
    return initial;
  }

  private saveDatabaseImmediate(data: DatabaseSchema) {
    this.ensureDirectory();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public save() {
    this.saveDatabaseImmediate(this.data);
  }

  public get(): DatabaseSchema {
    return this.data;
  }

  public logAudit(userId: string, userName: string, action: string, details: string) {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    // Keep max 500 audit logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
  }

  // Deduct inventory ingredients when an order is submitted or served
  public deductOrderIngredients(order: Order, performedBy: string) {
    for (const item of order.items) {
      const menuItem = this.data.menuItems.find((m) => m.id === item.menuItemId);
      if (!menuItem || !menuItem.recipe) continue;

      for (const recipeItem of menuItem.recipe) {
        const ingredient = this.data.ingredients.find((ing) => ing.id === recipeItem.ingredientId);
        if (!ingredient) continue;

        const totalUsed = recipeItem.amount * item.quantity;
        ingredient.currentStock = Math.max(0, ingredient.currentStock - totalUsed);

        this.data.stockMovements.unshift({
          id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ingredientId: ingredient.id,
          ingredientName: ingredient.nameFa,
          type: 'out_order',
          amount: totalUsed,
          unit: ingredient.unit,
          reason: `مصرف خودکار برای سفارش شماره #${order.orderNumber} (${item.nameFa} × ${item.quantity})`,
          performedBy,
          timestamp: new Date().toISOString(),
          orderId: order.id,
        });
      }
    }
    this.save();
  }
}

export const db = new DatabaseManager();
