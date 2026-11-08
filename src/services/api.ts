import {
  User,
  CafeTable,
  CafeSection,
  MenuItem,
  MenuCategory,
  Order,
  Ingredient,
  Supplier,
  StockMovement,
  Customer,
  Reservation,
  CashShift,
  Expense,
  AuditLog,
  CafeSettings,
} from '../types/cafe';

const TOKEN_KEY = 'niko_cafe_auth_token';
const USER_KEY = 'niko_cafe_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'خطایی در ارتباط با سرور رخ داد');
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User; mustChangePassword: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  changePassword: (newPassword: string, currentPassword?: string) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword, currentPassword }),
    }),

  resetPasswordRequest: (email: string) =>
    request<{ success: boolean; message: string; tempPassword?: string }>('/api/auth/reset-password-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getMe: () => request<User>('/api/auth/me'),

  updateProfile: (profile: { name?: string; email?: string; username?: string; phone?: string }) =>
    request<{ success: boolean; user: User; message: string }>('/api/auth/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    }),

  // Tables
  getTables: () => request<{ tables: CafeTable[]; sections: CafeSection[] }>('/api/tables'),

  updateTableLayout: (id: string, layout: Partial<CafeTable>) =>
    request<CafeTable>(`/api/tables/${id}/layout`, {
      method: 'PUT',
      body: JSON.stringify(layout),
    }),

  updateTableStatus: (id: string, status: string, currentWaiter?: string, customerCount?: number) =>
    request<CafeTable>(`/api/tables/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, currentWaiter, customerCount }),
    }),

  transferTable: (fromTableId: string, toTableId: string) =>
    request<{ success: boolean; message: string }>('/api/tables/transfer', {
      method: 'POST',
      body: JSON.stringify({ fromTableId, toTableId }),
    }),

  createTable: (table: Partial<CafeTable>) =>
    request<CafeTable>('/api/tables', {
      method: 'POST',
      body: JSON.stringify(table),
    }),

  // Orders & POS
  getOrders: () => request<Order[]>('/api/orders'),

  createOrder: (orderData: {
    tableId?: string | null;
    type: string;
    customerId?: string | null;
    customerName?: string;
    waiterName?: string;
    items: any[];
    discountAmount?: number;
  }) =>
    request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  addItemsToOrder: (orderId: string, items: any[]) =>
    request<Order>(`/api/orders/${orderId}/add-items`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  payOrder: (orderId: string, amount?: number, method?: string, referenceCode?: string) =>
    request<{ success: boolean; order: Order }>(`/api/orders/${orderId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount, method, referenceCode }),
    }),

  cancelOrder: (orderId: string, reason: string) =>
    request<{ success: boolean; order: Order }>(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Kitchen
  getKitchenOrders: () => request<Order[]>('/api/kitchen/orders'),

  updateKitchenItemStatus: (orderId: string, itemId: string, status: string) =>
    request<{ success: boolean; order: Order }>(`/api/kitchen/items/${orderId}/${itemId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  serveAllKitchenItems: (orderId: string) =>
    request<{ success: boolean; order: Order }>(`/api/kitchen/orders/${orderId}/serve-all`, {
      method: 'PUT',
    }),

  // Menu
  getMenu: () => request<{ categories: MenuCategory[]; menuItems: MenuItem[] }>('/api/menu'),

  createProduct: (product: Partial<MenuItem>) =>
    request<MenuItem>('/api/menu/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),

  updateProduct: (id: string, updates: Partial<MenuItem>) =>
    request<MenuItem>(`/api/menu/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Inventory
  getInventory: () =>
    request<{
      ingredients: Ingredient[];
      suppliers: Supplier[];
      movements: StockMovement[];
    }>('/api/inventory'),

  createIngredient: (data: Partial<Ingredient>) =>
    request<Ingredient>('/api/inventory/ingredients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  recordStockMovement: (movement: {
    ingredientId: string;
    type: 'in' | 'waste' | 'adjustment';
    amount: number;
    reason: string;
  }) =>
    request<{ success: boolean; ingredient: Ingredient; movement: StockMovement }>('/api/inventory/movements', {
      method: 'POST',
      body: JSON.stringify(movement),
    }),

  // Customers
  getCustomers: () => request<Customer[]>('/api/customers'),

  createCustomer: (customer: Partial<Customer>) =>
    request<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    }),

  // Reservations
  getReservations: () => request<Reservation[]>('/api/reservations'),

  createReservation: (resData: {
    tableId: string;
    customerName: string;
    customerPhone: string;
    guestCount: number;
    date: string;
    time: string;
    notes?: string;
  }) =>
    request<Reservation>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(resData),
    }),

  // Finance
  getFinance: () =>
    request<{
      cashShifts: CashShift[];
      expenses: Expense[];
      settings: CafeSettings;
    }>('/api/finance'),

  openCashShift: (initialFloat: number, notes?: string) =>
    request<CashShift>('/api/finance/cash-shifts/open', {
      method: 'POST',
      body: JSON.stringify({ initialFloat, notes }),
    }),

  closeCashShift: (id: string, actualCash: number, notes?: string) =>
    request<CashShift>(`/api/finance/cash-shifts/${id}/close`, {
      method: 'POST',
      body: JSON.stringify({ actualCash, notes }),
    }),

  createExpense: (expense: { title: string; category: string; amount: number; description?: string }) =>
    request<Expense>('/api/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    }),

  // Staff
  getStaff: () => request<User[]>('/api/staff'),

  createStaff: (staffData: any) =>
    request<User>('/api/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    }),

  // Settings & Audit Logs
  getSettings: () => request<CafeSettings>('/api/settings'),

  updateSettings: (settings: Partial<CafeSettings>) =>
    request<CafeSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getAuditLogs: () => request<AuditLog[]>('/api/audit-logs'),

  // AI Assistant
  askAI: (message: string) =>
    request<{ reply: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};
