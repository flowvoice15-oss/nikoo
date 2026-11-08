import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { db, verifyPassword, hashPassword, Order, CafeTable, MenuItem, Customer, Reservation } from './server/db.ts';
import { askCafeAI } from './server/ai.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory sessions token map: token -> user
const activeSessions = new Map<string, any>();

function authenticate(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'احراز هویت انجام نشده است' });
  }
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const user = activeSessions.get(token);
  if (!user) {
    return res.status(401).json({ error: 'نشست کاربری نامعتبر یا منقضی شده است' });
  }
  (req as any).user = user;
  next();
}

// ================= AUTH ROUTES =================

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const loginIdentifier = (username || email || '').trim().toLowerCase();

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: 'لطفاً نام کاربری/ایمیل و رمز عبور را وارد کنید' });
  }

  const data = db.get();
  const user = data.users.find((u) => {
    const matchEmail = u.email && u.email.toLowerCase() === loginIdentifier;
    const matchUsername = u.username && u.username.toLowerCase() === loginIdentifier;
    const matchPhone = u.phone && u.phone.trim() === loginIdentifier;
    return matchEmail || matchUsername || matchPhone;
  });

  if (!user) {
    return res.status(401).json({ error: 'کاربری با این نام کاربری یا ایمیل یافت نشد' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'حساب کاربری شما غیرفعال است' });
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'رمز عبور وارد شده نادرست است' });
  }

  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username || 'admin',
    role: user.role,
    roleTitle: user.roleTitle,
    phone: user.phone,
    mustChangePassword: user.mustChangePassword,
    avatarUrl: user.avatarUrl,
  };

  activeSessions.set(token, safeUser);
  db.logAudit(user.id, user.name, 'ورود به سیستم', `کاربر ${user.name} (${user.username || user.email}) وارد سیستم مدیریت نیکو کافه شد.`);

  return res.json({
    token,
    user: safeUser,
    mustChangePassword: user.mustChangePassword,
  });
});

app.post('/api/auth/change-password', authenticate, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'رمز عبور جدید باید حداقل ۶ نویسه باشد' });
  }

  const data = db.get();
  const user = data.users.find((u) => u.id === currentUser.id);
  if (!user) {
    return res.status(404).json({ error: 'کاربر یافت نشد' });
  }

  // If user must change password (initial login), verify current if provided
  if (!user.mustChangePassword && currentPassword) {
    const isOldValid = verifyPassword(currentPassword, user.passwordHash, user.salt);
    if (!isOldValid) {
      return res.status(400).json({ error: 'رمز عبور فعلی نادرست است' });
    }
  }

  const newHashed = hashPassword(newPassword);
  user.passwordHash = newHashed.hash;
  user.salt = newHashed.salt;
  user.mustChangePassword = false;

  db.save();
  db.logAudit(user.id, user.name, 'تغییر رمز عبور', `رمز عبور کاربر ${user.name} با موفقیت به‌روزرسانی شد.`);

  return res.json({ success: true, message: 'رمز عبور شما با موفقیت تغییر یافت' });
});

app.post('/api/auth/reset-password-request', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'ایمیل را وارد کنید' });
  }
  const data = db.get();
  const user = data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'کاربری با این ایمیل یافت نشد' });
  }

  // Securely generate a temporary reset token and new temporary password
  const tempPass = Math.random().toString(36).slice(-8);
  const newHash = hashPassword(tempPass);
  user.passwordHash = newHash.hash;
  user.salt = newHash.salt;
  user.mustChangePassword = true;
  db.save();

  db.logAudit(user.id, user.name, 'بازیابی رمز عبور', `رمز عبور موقت برای کاربر ${user.email} صادر گردید.`);

  return res.json({
    success: true,
    message: `کد بازیابی و رمز موقت جدید برای ${email} صادر شد: ${tempPass}`,
    tempPassword: tempPass,
  });
});

app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const data = db.get();
  const user = data.users.find((u) => u.id === currentUser.id);
  if (!user) {
    return res.status(404).json({ error: 'کاربر یافت نشد' });
  }
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username || 'admin',
    role: user.role,
    roleTitle: user.roleTitle,
    phone: user.phone,
    mustChangePassword: user.mustChangePassword,
  });
});

app.post('/api/auth/profile', authenticate, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { name, email, username, phone } = req.body;
  const data = db.get();
  const user = data.users.find((u) => u.id === currentUser.id);

  if (!user) {
    return res.status(404).json({ error: 'کاربر یافت نشد' });
  }

  if (username && username.trim()) {
    const cleanUsername = username.trim().toLowerCase();
    const existing = data.users.find((u) => u.id !== user.id && u.username && u.username.toLowerCase() === cleanUsername);
    if (existing) {
      return res.status(400).json({ error: 'این نام کاربری قبلاً توسط کاربر دیگری ثبت شده است' });
    }
    user.username = cleanUsername;
  }

  if (name && name.trim()) user.name = name.trim();
  if (email && email.trim()) user.email = email.trim().toLowerCase();
  if (phone && phone.trim()) user.phone = phone.trim();

  db.save();
  db.logAudit(user.id, user.name, 'ویرایش حساب کاربری', `اطلاعات کاربر ${user.name} به‌روزرسانی شد. نام کاربری فعال: ${user.username}`);

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username || 'admin',
    role: user.role,
    roleTitle: user.roleTitle,
    phone: user.phone,
    mustChangePassword: user.mustChangePassword,
    avatarUrl: user.avatarUrl,
  };

  return res.json({ success: true, user: safeUser, message: 'اطلاعات حساب کاربری با موفقیت به‌روزرسانی گردید' });
});

// ================= TABLES ROUTES =================

app.get('/api/tables', (_req: Request, res: Response) => {
  const data = db.get();
  return res.json({
    tables: data.tables,
    sections: data.sections,
  });
});

app.post('/api/tables', authenticate, (req: Request, res: Response) => {
  const { number, label, sectionId, seats, shape, posX, posY, width, height } = req.body;
  const data = db.get();

  const existing = data.tables.find((t) => t.number === Number(number));
  if (existing) {
    return res.status(400).json({ error: `میز شماره ${number} قبلاً تعریف شده است` });
  }

  const newTable: CafeTable = {
    id: `tbl_${Date.now()}`,
    number: Number(number),
    label: label || `میز ${number}`,
    sectionId: sectionId || 'sec_main',
    seats: Number(seats) || 4,
    shape: shape || 'square',
    posX: Number(posX) || 20,
    posY: Number(posY) || 20,
    width: Number(width) || 90,
    height: Number(height) || 90,
    status: 'empty',
    activeOrderId: null,
  };

  data.tables.push(newTable);
  db.save();
  return res.json(newTable);
});

app.put('/api/tables/:id/layout', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const { posX, posY, width, height, seats, shape, label, sectionId } = req.body;
  const data = db.get();
  const table = data.tables.find((t) => t.id === id);
  if (!table) return res.status(404).json({ error: 'میز یافت نشد' });

  if (posX !== undefined) table.posX = Number(posX);
  if (posY !== undefined) table.posY = Number(posY);
  if (width !== undefined) table.width = Number(width);
  if (height !== undefined) table.height = Number(height);
  if (seats !== undefined) table.seats = Number(seats);
  if (shape !== undefined) table.shape = shape;
  if (label !== undefined) table.label = label;
  if (sectionId !== undefined) table.sectionId = sectionId;

  db.save();
  return res.json(table);
});

app.put('/api/tables/:id/status', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, currentWaiter, customerCount } = req.body;
  const data = db.get();
  const table = data.tables.find((t) => t.id === id);
  if (!table) return res.status(404).json({ error: 'میز یافت نشد' });

  table.status = status;
  if (currentWaiter !== undefined) table.currentWaiter = currentWaiter;
  if (customerCount !== undefined) table.customerCount = Number(customerCount);

  if (status === 'empty') {
    table.activeOrderId = null;
    table.customerCount = 0;
    table.occupiedSince = null;
    table.currentWaiter = null;
  } else if (!table.occupiedSince) {
    table.occupiedSince = new Date().toISOString();
  }

  db.save();
  return res.json(table);
});

app.post('/api/tables/transfer', authenticate, (req: Request, res: Response) => {
  const { fromTableId, toTableId } = req.body;
  const data = db.get();
  const fromTable = data.tables.find((t) => t.id === fromTableId);
  const toTable = data.tables.find((t) => t.id === toTableId);

  if (!fromTable || !toTable) {
    return res.status(404).json({ error: 'یکی از میزها یافت نشد' });
  }

  if (toTable.status !== 'empty') {
    return res.status(400).json({ error: `میز مقصد (${toTable.label}) خالی نیست` });
  }

  const activeOrderId = fromTable.activeOrderId;
  if (!activeOrderId) {
    return res.status(400).json({ error: 'میز مبدأ سفارش فعالی ندارد' });
  }

  const order = data.orders.find((o) => o.id === activeOrderId);
  if (order) {
    order.tableId = toTable.id;
    order.tableNumber = toTable.number;
  }

  toTable.status = fromTable.status;
  toTable.activeOrderId = activeOrderId;
  toTable.currentWaiter = fromTable.currentWaiter;
  toTable.customerCount = fromTable.customerCount;
  toTable.occupiedSince = fromTable.occupiedSince;

  fromTable.status = 'empty';
  fromTable.activeOrderId = null;
  fromTable.customerCount = 0;
  fromTable.occupiedSince = null;
  fromTable.currentWaiter = null;

  db.save();
  db.logAudit((req as any).user.id, (req as any).user.name, 'انتقال میز', `سفارش #${order?.orderNumber} از میز ${fromTable.number} به میز ${toTable.number} منتقل شد.`);

  return res.json({ success: true, message: `سفارش با موفقیت به میز شماره ${toTable.number} منتقل گردید` });
});

// ================= ORDERS & POS ROUTES =================

app.get('/api/orders', (_req: Request, res: Response) => {
  const data = db.get();
  return res.json(data.orders);
});

app.post('/api/orders', authenticate, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { tableId, type, customerId, customerName, waiterName, items, discountAmount } = req.body;
  const data = db.get();

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'سفارش باید حداقل شامل یک محصول باشد' });
  }

  const table = tableId ? data.tables.find((t) => t.id === tableId) : null;
  const orderNumber = data.orders.length > 0 ? Math.max(...data.orders.map((o) => o.orderNumber || 100)) + 1 : 101;

  let subtotal = 0;
  const processedItems = items.map((it: any, index: number) => {
    const itemSub = Number(it.unitPrice) * Number(it.quantity);
    subtotal += itemSub;
    return {
      id: `ord_item_${Date.now()}_${index}`,
      menuItemId: it.menuItemId,
      nameFa: it.nameFa,
      unitPrice: Number(it.unitPrice),
      quantity: Number(it.quantity),
      selectedOptions: it.selectedOptions || [],
      notes: it.notes || '',
      status: 'new',
    };
  });

  const discount = Number(discountAmount) || 0;
  const taxRate = data.settings.taxRatePercent / 100;
  const serviceRate = data.settings.serviceFeePercent / 100;
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxAmount = Math.round(taxableAmount * taxRate);
  const serviceAmount = Math.round(taxableAmount * serviceRate);
  const totalAmount = taxableAmount + taxAmount + serviceAmount;

  const newOrder: Order = {
    id: `ord_${Date.now()}`,
    orderNumber,
    tableId: table ? table.id : null,
    tableNumber: table ? table.number : null,
    type: type || (table ? 'dine_in' : 'takeaway'),
    customerId: customerId || null,
    customerName: customerName || (customerId ? data.customers.find((c) => c.id === customerId)?.name : table ? `میز ${table.number}` : 'مشتری آزاد'),
    waiterName: waiterName || currentUser.name,
    cashierName: currentUser.name,
    createdAt: new Date().toISOString(),
    status: 'submitted',
    items: processedItems,
    subtotal,
    discountAmount: discount,
    taxAmount,
    serviceAmount,
    totalAmount,
    paidAmount: 0,
    paymentStatus: 'unpaid',
    payments: [],
  };

  data.orders.unshift(newOrder);

  // If table exists, update table status to occupied / kitchen pending
  if (table) {
    table.status = 'kitchen_pending';
    table.activeOrderId = newOrder.id;
    table.currentWaiter = newOrder.waiterName;
    if (!table.occupiedSince) table.occupiedSince = new Date().toISOString();
  }

  // Deduct inventory ingredients according to recipes
  db.deductOrderIngredients(newOrder, currentUser.name);

  // If customer is selected, record loyalty points
  if (customerId) {
    const cust = data.customers.find((c) => c.id === customerId);
    if (cust) {
      cust.visitCount += 1;
      cust.totalSpent += totalAmount;
      const pointsEarned = Math.floor(totalAmount / data.settings.loyaltyPointPerToman);
      cust.loyaltyPoints += pointsEarned;
    }
  }

  db.save();
  db.logAudit(currentUser.id, currentUser.name, 'ثبت سفارش جدید', `سفارش #${orderNumber} برای ${newOrder.customerName} به مبلغ ${totalAmount.toLocaleString('fa-IR')} تومان ثبت شد.`);

  return res.json(newOrder);
});

app.post('/api/orders/:id/add-items', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const { items } = req.body;
  const currentUser = (req as any).user;
  const data = db.get();
  const order = data.orders.find((o) => o.id === id);
  if (!order) return res.status(404).json({ error: 'سفارش یافت نشد' });

  for (const it of items) {
    const existing = order.items.find((ex) => ex.menuItemId === it.menuItemId && (ex.status === 'new' || ex.status === 'preparing'));
    if (existing) {
      existing.quantity += Number(it.quantity);
    } else {
      order.items.push({
        id: `ord_item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        menuItemId: it.menuItemId,
        nameFa: it.nameFa,
        unitPrice: Number(it.unitPrice),
        quantity: Number(it.quantity),
        selectedOptions: it.selectedOptions || [],
        notes: it.notes || '',
        status: 'new',
      });
    }
  }

  // Recalculate totals
  let subtotal = 0;
  for (const it of order.items) {
    subtotal += it.unitPrice * it.quantity;
  }
  order.subtotal = subtotal;
  const taxable = Math.max(0, subtotal - order.discountAmount);
  order.taxAmount = Math.round(taxable * (data.settings.taxRatePercent / 100));
  order.serviceAmount = Math.round(taxable * (data.settings.serviceFeePercent / 100));
  order.totalAmount = taxable + order.taxAmount + order.serviceAmount;

  // Deduct recipes for newly added items
  db.deductOrderIngredients({ ...order, items }, currentUser.name);

  // If table, update status to kitchen_pending
  if (order.tableId) {
    const tbl = data.tables.find((t) => t.id === order.tableId);
    if (tbl) tbl.status = 'kitchen_pending';
  }

  db.save();
  return res.json(order);
});

app.post('/api/orders/:id/pay', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, method, referenceCode } = req.body;
  const currentUser = (req as any).user;
  const data = db.get();
  const order = data.orders.find((o) => o.id === id);
  if (!order) return res.status(404).json({ error: 'سفارش یافت نشد' });

  const paymentAmount = Number(amount) || (order.totalAmount - order.paidAmount);
  if (paymentAmount <= 0) {
    return res.status(400).json({ error: 'مبلغ پرداختی نامعتبر است' });
  }

  order.payments.push({
    id: `pay_${Date.now()}`,
    amount: paymentAmount,
    method: method || 'pos_card',
    timestamp: new Date().toISOString(),
    registeredBy: currentUser.name,
    referenceCode: referenceCode || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
  });

  order.paidAmount += paymentAmount;
  if (order.paidAmount >= order.totalAmount) {
    order.paymentStatus = 'paid';
    order.status = 'settled';

    // Free the table if customer has finished
    if (order.tableId) {
      const table = data.tables.find((t) => t.id === order.tableId);
      if (table) {
        table.status = 'empty';
        table.activeOrderId = null;
        table.customerCount = 0;
        table.occupiedSince = null;
        table.currentWaiter = null;
      }
    }
  } else {
    order.paymentStatus = 'partial';
  }

  db.save();
  db.logAudit(currentUser.id, currentUser.name, 'ثبت پرداخت', `مبلغ ${paymentAmount.toLocaleString('fa-IR')} تومان برای سفارش #${order.orderNumber} ثبت شد (${order.paymentStatus === 'paid' ? 'تسویه کامل' : 'پرداخت جزئی'}).`);

  return res.json({ success: true, order });
});

app.post('/api/orders/:id/cancel', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const currentUser = (req as any).user;
  const data = db.get();
  const order = data.orders.find((o) => o.id === id);
  if (!order) return res.status(404).json({ error: 'سفارش یافت نشد' });

  order.status = 'cancelled';
  order.cancelReason = reason || 'لغو توسط پرسنل';
  order.cancelledBy = currentUser.name;

  if (order.tableId) {
    const table = data.tables.find((t) => t.id === order.tableId);
    if (table && table.activeOrderId === order.id) {
      table.status = 'empty';
      table.activeOrderId = null;
      table.occupiedSince = null;
      table.customerCount = 0;
    }
  }

  db.save();
  db.logAudit(currentUser.id, currentUser.name, 'لغو سفارش', `سفارش #${order.orderNumber} لغو شد. دلیل: ${order.cancelReason}`);

  return res.json({ success: true, order });
});

// ================= KITCHEN ROUTES =================

app.get('/api/kitchen/orders', (_req: Request, res: Response) => {
  const data = db.get();
  const activeOrders = data.orders.filter(
    (o) => o.status === 'submitted' || o.status === 'preparing' || o.status === 'ready'
  );
  return res.json(activeOrders);
});

app.put('/api/kitchen/items/:orderId/:itemId/status', authenticate, (req: Request, res: Response) => {
  const { orderId, itemId } = req.params;
  const { status } = req.body;
  const data = db.get();
  const order = data.orders.find((o) => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'سفارش یافت نشد' });

  const item = order.items.find((it) => it.id === itemId);
  if (!item) return res.status(404).json({ error: 'آیتم یافت نشد' });

  item.status = status;
  if (status === 'preparing' && !item.prepStartedAt) {
    item.prepStartedAt = new Date().toISOString();
  }
  if (status === 'ready') {
    item.prepCompletedAt = new Date().toISOString();
  }

  // Update order general status
  const allReady = order.items.every((it) => it.status === 'ready' || it.status === 'served');
  const anyPreparing = order.items.some((it) => it.status === 'preparing');

  if (allReady) {
    order.status = 'ready';
    if (order.tableId) {
      const table = data.tables.find((t) => t.id === order.tableId);
      if (table) table.status = 'ready_to_serve';
    }
  } else if (anyPreparing) {
    order.status = 'preparing';
    if (order.tableId) {
      const table = data.tables.find((t) => t.id === order.tableId);
      if (table) table.status = 'kitchen_pending';
    }
  }

  db.save();
  return res.json({ success: true, order });
});

app.put('/api/kitchen/orders/:id/serve-all', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.get();
  const order = data.orders.find((o) => o.id === id);
  if (!order) return res.status(404).json({ error: 'سفارش یافت نشد' });

  order.items.forEach((it) => {
    it.status = 'served';
  });
  order.status = 'served';

  if (order.tableId) {
    const table = data.tables.find((t) => t.id === order.tableId);
    if (table) table.status = 'occupied';
  }

  db.save();
  return res.json({ success: true, order });
});

// ================= MENU ROUTES =================

app.get('/api/menu', (_req: Request, res: Response) => {
  const data = db.get();
  return res.json({
    categories: data.categories,
    menuItems: data.menuItems,
  });
});

app.post('/api/menu/products', authenticate, (req: Request, res: Response) => {
  const { nameFa, nameEn, categoryId, price, costPrice, prepTimeMinutes, description, imageUrl, recipe, optionGroups } = req.body;
  const data = db.get();

  const newProduct: MenuItem = {
    id: `item_${Date.now()}`,
    nameFa,
    nameEn: nameEn || '',
    categoryId,
    price: Number(price),
    costPrice: Number(costPrice) || 0,
    prepTimeMinutes: Number(prepTimeMinutes) || 5,
    description: description || '',
    imageUrl: imageUrl || '/src/assets/images/artisan_coffee_latte_1794123841585.jpg',
    isAvailable: true,
    recipe: recipe || [],
    optionGroups: optionGroups || [],
  };

  data.menuItems.push(newProduct);
  db.save();
  return res.json(newProduct);
});

app.put('/api/menu/products/:id', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.get();
  const product = data.menuItems.find((p) => p.id === id);
  if (!product) return res.status(404).json({ error: 'محصول یافت نشد' });

  Object.assign(product, req.body);
  db.save();
  return res.json(product);
});

// ================= INVENTORY & RECIPES ROUTES =================

app.get('/api/inventory', (_req: Request, res: Response) => {
  const data = db.get();
  return res.json({
    ingredients: data.ingredients,
    suppliers: data.suppliers,
    movements: data.stockMovements,
  });
});

app.post('/api/inventory/ingredients', authenticate, (req: Request, res: Response) => {
  const { nameFa, category, unit, currentStock, minThreshold, costPerUnit, supplierId } = req.body;
  const data = db.get();

  const newIngredient = {
    id: `ing_${Date.now()}`,
    nameFa,
    category: category || 'سایر',
    unit: unit || 'g',
    currentStock: Number(currentStock) || 0,
    minThreshold: Number(minThreshold) || 10,
    costPerUnit: Number(costPerUnit) || 0,
    supplierId: supplierId || '',
    lastRestockedAt: new Date().toISOString(),
  };

  data.ingredients.push(newIngredient);
  db.save();
  return res.json(newIngredient);
});

app.post('/api/inventory/movements', authenticate, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { ingredientId, type, amount, reason } = req.body;
  const data = db.get();
  const ingredient = data.ingredients.find((i) => i.id === ingredientId);
  if (!ingredient) return res.status(404).json({ error: 'ماده اولیه یافت نشد' });

  const numAmount = Number(amount);
  if (type === 'in') {
    ingredient.currentStock += numAmount;
    ingredient.lastRestockedAt = new Date().toISOString();
  } else if (type === 'waste' || type === 'out_order') {
    ingredient.currentStock = Math.max(0, ingredient.currentStock - numAmount);
  } else if (type === 'adjustment') {
    ingredient.currentStock = numAmount;
  }

  const movement = {
    id: `mov_${Date.now()}`,
    ingredientId: ingredient.id,
    ingredientName: ingredient.nameFa,
    type,
    amount: numAmount,
    unit: ingredient.unit,
    reason: reason || 'ثبت گردش انبار',
    performedBy: currentUser.name,
    timestamp: new Date().toISOString(),
  };

  data.stockMovements.unshift(movement);
  db.save();
  return res.json({ success: true, ingredient, movement });
});

// ================= CUSTOMERS & CRM ROUTES =================

app.get('/api/customers', (_req: Request, res: Response) => {
  const data = db.get();
  return res.json(data.customers);
});

app.post('/api/customers', authenticate, (req: Request, res: Response) => {
  const { name, phone, secondPhone, birthDate, address, notes, status } = req.body;
  const data = db.get();

  const newCustomer: Customer = {
    id: `cust_${Date.now()}`,
    name,
    phone,
    secondPhone,
    birthDate,
    address,
    notes,
    status: status || 'normal',
    registeredAt: new Date().toISOString(),
    visitCount: 0,
    totalSpent: 0,
    loyaltyPoints: 0,
    favoriteItems: [],
  };

  data.customers.push(newCustomer);
  db.save();
  return res.json(newCustomer);
});

// ================= RESERVATIONS ROUTES =================

app.get('/api/reservations', (_req: Request, res: Response) => {
  const data = db.get();
  return res.json(data.reservations);
});

app.post('/api/reservations', authenticate, (req: Request, res: Response) => {
  const { tableId, customerName, customerPhone, guestCount, date, time, notes } = req.body;
  const data = db.get();
  const table = data.tables.find((t) => t.id === tableId);
  if (!table) return res.status(404).json({ error: 'میز انتخابی یافت نشد' });

  // Conflict check: Check if same table is already reserved for same date & within 1 hour
  const hasConflict = data.reservations.some(
    (r) => r.tableId === tableId && r.date === date && r.time === time && r.status === 'confirmed'
  );
  if (hasConflict) {
    return res.status(400).json({ error: `میز ${table.number} در تاریخ ${date} و ساعت ${time} قبلاً رزرو شده است` });
  }

  const reservation: Reservation = {
    id: `res_${Date.now()}`,
    tableId: table.id,
    tableNumber: table.number,
    customerName,
    customerPhone,
    guestCount: Number(guestCount) || table.seats,
    date,
    time,
    notes: notes || '',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  data.reservations.unshift(reservation);

  // If today reservation, update table status to reserved
  const today = new Date().toISOString().split('T')[0];
  if (date === today && table.status === 'empty') {
    table.status = 'reserved';
  }

  db.save();
  return res.json(reservation);
});

// ================= FINANCE & CASH SHIFTS ROUTES =================

app.get('/api/finance', (_req: Request, res: Response) => {
  const data = db.get();
  return res.json({
    cashShifts: data.cashShifts,
    expenses: data.expenses,
    settings: data.settings,
  });
});

app.post('/api/finance/cash-shifts/open', authenticate, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { initialFloat, notes } = req.body;
  const data = db.get();

  const newShift = {
    id: `shift_${Date.now()}`,
    cashierName: currentUser.name,
    openedAt: new Date().toISOString(),
    initialFloat: Number(initialFloat) || 0,
    expectedCash: Number(initialFloat) || 0,
    status: 'open' as const,
    notes: notes || '',
  };

  data.cashShifts.unshift(newShift);
  db.save();
  return res.json(newShift);
});

app.post('/api/finance/cash-shifts/:id/close', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const { actualCash, notes } = req.body;
  const data = db.get();
  const shift = data.cashShifts.find((s) => s.id === id);
  if (!shift) return res.status(404).json({ error: 'شیفت صندوق یافت نشد' });

  shift.status = 'closed';
  shift.closedAt = new Date().toISOString();
  shift.actualCash = Number(actualCash);
  shift.difference = (shift.actualCash || 0) - shift.expectedCash;
  if (notes) shift.notes = (shift.notes ? `${shift.notes} | ` : '') + notes;

  db.save();
  return res.json(shift);
});

app.post('/api/finance/expenses', authenticate, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { title, category, amount, description } = req.body;
  const data = db.get();

  const newExpense = {
    id: `exp_${Date.now()}`,
    title,
    category: category || 'other',
    amount: Number(amount),
    date: new Date().toISOString().split('T')[0],
    paidBy: currentUser.name,
    description: description || '',
  };

  data.expenses.unshift(newExpense);
  db.save();
  return res.json(newExpense);
});

// ================= HR & STAFF ROUTES =================

app.get('/api/staff', (_req: Request, res: Response) => {
  const data = db.get();
  const staff = data.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    roleTitle: u.roleTitle,
    phone: u.phone,
    status: u.status,
    createdAt: u.createdAt,
  }));
  return res.json(staff);
});

app.post('/api/staff', authenticate, (req: Request, res: Response) => {
  const { name, email, password, role, roleTitle, phone } = req.body;
  const data = db.get();

  const exists = data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'کاربری با این ایمیل از قبل وجود دارد' });
  }

  const auth = hashPassword(password || '123456');
  const newUser = {
    id: `usr_${Date.now()}`,
    name,
    email: email.trim().toLowerCase(),
    passwordHash: auth.hash,
    salt: auth.salt,
    role: role || 'waiter',
    roleTitle: roleTitle || 'پرسنل کافه',
    phone: phone || '',
    mustChangePassword: true,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  };

  data.users.push(newUser);
  db.save();
  return res.json({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    roleTitle: newUser.roleTitle,
    phone: newUser.phone,
  });
});

// ================= SETTINGS & AUDIT LOGS ROUTES =================

app.get('/api/settings', (_req: Request, res: Response) => {
  const data = db.get();
  return res.json(data.settings);
});

app.put('/api/settings', authenticate, (req: Request, res: Response) => {
  const data = db.get();
  Object.assign(data.settings, req.body);
  db.save();
  return res.json(data.settings);
});

app.get('/api/audit-logs', authenticate, (_req: Request, res: Response) => {
  const data = db.get();
  return res.json(data.auditLogs);
});

// ================= AI AGENT ROUTE =================

app.post('/api/ai/chat', authenticate, async (req: Request, res: Response) => {
  const { message } = req.body;
  const currentUser = (req as any).user;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'پیام ارسالی نامعتبر است' });
  }

  try {
    const aiAnswer = await askCafeAI(message, currentUser.name, currentUser.roleTitle);
    db.logAudit(currentUser.id, currentUser.name, 'استفاده از هوش مصنوعی', `پرسش: "${message.substring(0, 60)}"`);
    return res.json({ reply: aiAnswer });
  } catch (error) {
    console.error('AI chat endpoint error:', error);
    return res.status(500).json({ error: 'خطا در ارتباط با دستیار هوشمند' });
  }
});

// ================= DOWNLOAD PROJECT ZIP =================

app.get('/api/download-zip', (_req: Request, res: Response) => {
  const zipPath = path.resolve(process.cwd(), 'niko-cafe-management-system.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="niko-cafe-management-system.zip"');
    res.setHeader('Content-Type', 'application/zip');
    return res.sendFile(zipPath);
  }
  return res.status(404).json({ error: 'فایل فشرده پروژه یافت نشد' });
});

// Serve static public assets directly
app.use('/images', express.static(path.resolve(process.cwd(), 'public/images')));
app.use('/src/assets/images', express.static(path.resolve(process.cwd(), 'src/assets/images')));

// ================= VITE DEV / PRODUCTION STATIC SERVER =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`☕ NIKO CAFE Management Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
