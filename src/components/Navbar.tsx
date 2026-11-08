import React, { useState, useEffect } from 'react';
import { Menu, KeyRound, Sparkles, PlusCircle, Download } from 'lucide-react';
import { User } from '../types/cafe';
import { TabType } from './Sidebar';

interface NavbarProps {
  activeTab: TabType;
  onOpenMobileSidebar: () => void;
  currentUser: User | null;
  onOpenPasswordModal: () => void;
  onQuickAction: (tab: TabType) => void;
}

const TAB_TITLES: Record<TabType, { title: string; subtitle: string }> = {
  dashboard: { title: 'داشبورد جامع نیکو کافه', subtitle: 'خلاصه شاخص‌های فروش، وضعیت میزها و سفارش‌های جاری' },
  tables: { title: 'نقشه و چیدمان میزها', subtitle: 'نظارت بلادرنگ بر وضعیت سالن‌ها، تراس و میزهای فعال' },
  pos: { title: 'صندوق و ثبت سفارش (POS)', subtitle: 'ثبت سریع سفارش، افزودن آیتم و تسویه حساب نقدی و کارتی' },
  kitchen: { title: 'آشپزخانه و بار قهوه (KDS)', subtitle: 'صف آماده‌سازی تیکت‌ها و تحویل به موقع سفارش‌های مشتریان' },
  menu: { title: 'مدیریت منوی محصولات', subtitle: 'تعریف قیمت، رسپی مواد اولیه، گزینه‌ها و وضعیت موجودی' },
  customers: { title: 'مدیریت مشتریان و باشگاه وفاداری', subtitle: 'پروفایل مشتری، امتیازات باشگاه، تاریخچه خرید و تخفیف‌ها' },
  reservations: { title: 'مدیریت رزرواسیون میزها', subtitle: 'ثبت و پیگیری رزروهای امروز و روزهای آتی کافه' },
  inventory: { title: 'انبار و کنترل مواد اولیه', subtitle: 'موجودی مواد، هشدار حداقل آستانه و ثبت ورودی/خروجی' },
  sales: { title: 'سفارش‌ها و فاکتورهای فروش', subtitle: 'لیست فاکتورها، وضعیت تسویه و صدور مجدد رسیدها' },
  finance: { title: 'امور مالی و شیفت صندوق', subtitle: 'گردش نقدی، تراز شیفت‌های کاری، هزینه‌ها و سود' },
  staff: { title: 'پرسنل و سطوح دسترسی', subtitle: 'مدیریت کارکنان، نقش‌های کاربری و لاگ عملیات حساس' },
  ai: { title: 'دستیار هوشمند نیکو کافه', subtitle: 'پرسش و پاسخ تحلیلی زنده از وضعیت کافه و موجودی انبار' },
  settings: { title: 'تنظیمات کلی سیستم', subtitle: 'اطلاعات کافه، مالیات، قوانین باشگاه مشتریان و پشتیبان' },
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onOpenMobileSidebar,
  currentUser,
  onOpenPasswordModal,
  onQuickAction,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const meta = TAB_TITLES[activeTab] || { title: 'نیکو کافه', subtitle: 'سیستم یکپارچه مدیریت' };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xs border-b border-[#E8DFD5] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Right / Start: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-[#7A6A5C] hover:text-[#2C1810] hover:bg-[#FAF7F2] rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm lg:text-base font-bold text-[#2C1810]">{meta.title}</h2>
          <p className="hidden sm:block text-[11px] text-[#7A6A5C] truncate">{meta.subtitle}</p>
        </div>
      </div>

      {/* Left / End: Clock, Quick Actions, Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Date & Time */}
        <div className="hidden md:flex flex-col text-left font-mono tabular-nums">
          <span className="text-xs font-bold text-[#2C1810]">{timeStr}</span>
          <span className="text-[10px] text-[#8C7A6B]">{dateStr}</span>
        </div>

        {/* Quick Action: New Order */}
        {activeTab !== 'pos' && (
          <button
            onClick={() => onQuickAction('pos')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A2E1B] text-white hover:bg-[#382315] text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">ثبت سفارش</span>
          </button>
        )}

        {/* AI Concierge shortcut */}
        {activeTab !== 'ai' && (
          <button
            onClick={() => onQuickAction('ai')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5C6B47]/10 text-[#5C6B47] hover:bg-[#5C6B47]/20 text-xs font-semibold rounded-xl transition-colors"
            title="دستیار هوشمند کافه"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">دستیار هوشمند</span>
          </button>
        )}

        {/* Download ZIP Shortcut */}
        <a
          href="/api/download-zip"
          download="niko-cafe-management-system.zip"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5C6B47] text-white hover:bg-[#495537] text-xs font-semibold rounded-xl shadow-xs transition-colors"
          title="دانلود فایل فشرده سورس‌کد (ZIP)"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">دانلود ZIP</span>
        </a>

        {/* User security dropdown / password button */}
        {currentUser && (
          <div className="flex items-center gap-1.5 border-r border-[#E8DFD5] pr-3 mr-1">
            <button
              onClick={onOpenPasswordModal}
              title="تغییر رمز عبور"
              className="p-2 text-[#7A6A5C] hover:text-[#4A2E1B] hover:bg-[#FAF7F2] rounded-xl transition-colors"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
