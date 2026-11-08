import React from 'react';
import {
  LayoutDashboard,
  LayoutGrid,
  ShoppingBag,
  ChefHat,
  Coffee,
  Users,
  CalendarCheck,
  PackageCheck,
  Receipt,
  Wallet,
  UserCheck,
  Sparkles,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { User } from '../types/cafe';

export type TabType =
  | 'dashboard'
  | 'tables'
  | 'pos'
  | 'kitchen'
  | 'menu'
  | 'customers'
  | 'reservations'
  | 'inventory'
  | 'sales'
  | 'finance'
  | 'staff'
  | 'ai'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentUser: User | null;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'داشبورد مدیریتی', icon: LayoutDashboard },
  { id: 'tables', label: 'نقشه و مدیریت میزها', icon: LayoutGrid },
  { id: 'pos', label: 'صندوق و ثبت سفارش (POS)', icon: ShoppingBag },
  { id: 'kitchen', label: 'آشپزخانه و بار (KDS)', icon: ChefHat },
  { id: 'menu', label: 'مدیریت منوی کافه', icon: Coffee },
  { id: 'customers', label: 'مشتریان و باشگاه (CRM)', icon: Users },
  { id: 'reservations', label: 'مدیریت رزرو میزها', icon: CalendarCheck },
  { id: 'inventory', label: 'انبار و مواد اولیه', icon: PackageCheck },
  { id: 'sales', label: 'سفارش‌ها و فاکتورها', icon: Receipt },
  { id: 'finance', label: 'امور مالی و شیفت صندوق', icon: Wallet },
  { id: 'staff', label: 'پرسنل و دسترسی‌ها', icon: UserCheck },
  { id: 'ai', label: 'دستیار هوشمند نیکو کافه', icon: Sparkles },
  { id: 'settings', label: 'تنظیمات سیستم', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 right-0 z-40 w-64 bg-[#FAF7F2] border-l border-[#E8DFD5] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E8DFD5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A2E1B] text-[#FAF7F2] flex items-center justify-center shadow-xs">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-[#2C1810] text-base tracking-tight">نیکو کافه</h1>
              <p className="font-mono text-[10px] tracking-widest text-[#8C7A6B] uppercase">NIKO CAFE SYSTEM</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-[#8C7A6B] hover:text-[#2C1810] rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        {currentUser && (
          <div className="p-3 mx-3 my-2.5 rounded-xl bg-white border border-[#E8DFD5]/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#5C6B47]/15 text-[#5C6B47] flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#2C1810] truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-[#7A6A5C] mt-0.5 truncate">
                <span>{currentUser.roleTitle}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#4A2E1B] text-white shadow-xs font-bold'
                    : 'text-[#614D3E] hover:bg-[#F2ECE4] hover:text-[#2C1810]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FAF7F2]' : 'text-[#8C7A6B]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Bottom Section */}
        <div className="p-3 border-t border-[#E8DFD5]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>خروج از حساب</span>
          </button>
        </div>
      </aside>
    </>
  );
};
