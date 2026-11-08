import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  Phone,
  Mail,
  User as UserIcon,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { api } from '../services/api';
import { User as StaffUser, UserRole } from '../types/cafe';

export const StaffView: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<UserRole>('waiter');
  const [roleTitle, setRoleTitle] = useState('میزبان و گارسون');
  const [phone, setPhone] = useState('');

  const loadStaff = async () => {
    try {
      const data = await api.getStaff();
      setStaffList(data);
    } catch (err) {
      console.error('Error loading staff:', err);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStaff({
        name,
        email,
        password,
        role,
        roleTitle,
        phone,
      });
      await loadStaff();
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPassword('123456');
      setPhone('');
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت پرسنل');
    }
  };

  const roleRoleMap: Record<UserRole, string> = {
    super_admin: 'مدیر کل و مالک سیستم',
    manager: 'مدیر داخلی و شیفت',
    barista: 'باریستا و بار گرم/سرد',
    waiter: 'میزبان و گارسون',
    cashier: 'صندوقدار و پذیرش',
    chef: 'آشپز و قناد',
    inventory_manager: 'انباردار و تدارکات',
    accountant: 'حسابدار',
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#2C1810]">پرسنل کافه و مدیریت سطوح دسترسی</h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            فهرست کارکنان نیکو کافه، سمت‌های شغلی و کنترل دسترسی‌های امنیتی
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#4A2E1B] hover:bg-[#382315] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف کاربر / پرسنل جدید</span>
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-[#4A2E1B] flex items-center justify-center font-bold text-sm">
                    {user.name.slice(0, 1)}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2C1810] text-sm">{user.name}</h4>
                    <span className="text-[11px] text-[#8C7A6B] block mt-0.5">{user.roleTitle}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    user.role === 'super_admin'
                      ? 'bg-[#4A2E1B] text-white'
                      : 'bg-[#FAF7F2] text-[#4A2E1B] border border-[#E8DFD5]'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F5EFEB] space-y-1.5 text-xs text-[#7A6A5C]">
                {user.username && (
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-[#8C7A6B]" />
                    <span className="font-mono text-left dir-ltr font-bold text-[#4A2E1B]">@{user.username}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#8C7A6B]" />
                  <span className="font-mono text-left dir-ltr">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#8C7A6B]" />
                    <span className="font-mono text-left dir-ltr">{user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F5EFEB] flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>حساب فعال</span>
              </span>
              <span className="text-[#8C7A6B]">نیکو کافه</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#2C1810] text-sm mb-4">تعریف عضو جدید پرسنل</h3>
            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#543825] mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً نگین صبوری"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">ایمیل سازمانی / نام کاربری</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="negin@nikocafe.com"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] font-mono text-left"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">نقش کاربری</label>
                <select
                  value={role}
                  onChange={(e) => {
                    const r = e.target.value as UserRole;
                    setRole(r);
                    setRoleTitle(roleRoleMap[r] || 'پرسنل کافه');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-white"
                >
                  <option value="waiter">میزبان و گارسون</option>
                  <option value="barista">باریستا و متصدی بار</option>
                  <option value="cashier">صندوقدار</option>
                  <option value="chef">آشپزخانه و قنادی</option>
                  <option value="inventory_manager">انباردار</option>
                  <option value="manager">مدیر شیفت</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">شماره تماس همراه</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912..."
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] font-mono text-left"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1">رمز عبور اولیه</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] font-mono text-left"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-[#7A6A5C] hover:text-[#2C1810]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4A2E1B] text-white font-bold rounded-xl"
                >
                  ثبت کاربر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
