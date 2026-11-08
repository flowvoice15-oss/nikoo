export type UserRole =
  | 'super_admin'
  | 'manager'
  | 'barista'
  | 'waiter'
  | 'cashier'
  | 'chef'
  | 'inventory_manager'
  | 'accountant';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  roleTitle: string;
  phone: string;
  mustChangePassword?: boolean;
  avatarUrl?: string;
}

export type TableStatus =
  | 'empty'
  | 'occupied'
  | 'kitchen_pending'
  | 'ready_to_serve'
  | 'reserved'
  | 'disabled';

export interface CafeTable {
  id: string;
  number: number;
  label: string;
  sectionId: string;
  seats: number;
  shape: 'circle' | 'square' | 'rectangle';
  posX: number;
  posY: number;
  width: number;
  height: number;
  status: TableStatus;
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
  amount: number;
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

export interface OrderPayment {
  id: string;
  amount: number;
  method: 'cash' | 'pos_card' | 'online' | 'loyalty_points';
  timestamp: string;
  registeredBy: string;
  referenceCode?: string;
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
  date: string;
  time: string;
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
  loyaltyPointPerToman: number;
  loyaltyPointValueToman: number;
  receiptFooterMessage: string;
}
