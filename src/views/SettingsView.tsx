import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Coffee,
  ShieldAlert,
  Percent,
  Gift,
  History,
  CheckCircle2,
  User as UserIcon,
  KeyRound,
  Lock,
} from 'lucide-react';
import { api, getStoredUser, setStoredAuth, getStoredToken } from '../services/api';
import { CafeSettings, AuditLog, User } from '../types/cafe';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<CafeSettings>({
    cafeName: 'نیکو کافه (NIKO CAFE)',
    cafeAddress: 'تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۱۴',
    cafePhone: '021-88776655',
    workingHours: 'همه روزه از ساعت ۰۸:۰۰ صبح تا ۲۳:۳۰ شب',
    taxRatePercent: 0,
    serviceFeePercent: 0,
    loyaltyPointPerToman: 10000,
    loyaltyPointValueToman: 500,
    receiptFooterMessage: 'از حضور شما در نیکو کافه سپاسگزاریم. لحظاتتان پر از عطر خوش قهوه!',
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'account' | 'audit'>('general');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Current User Account Profile State
  const currentUser = getStoredUser();
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileUsername, setProfileUsername] = useState(currentUser?.username || 'admin');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileNewPass, setProfileNewPass] = useState('');
  const [profileCurrentPass, setProfileCurrentPass] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const loadSettingsAndLogs = async () => {
    try {
      const [sRes, aRes] = await Promise.all([api.getSettings(), api.getAuditLogs()]);
      setSettings(sRes);
      setAuditLogs(aRes);
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  useEffect(() => {
    loadSettingsAndLogs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadSettingsAndLogs();
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#2C1810]">تنظیمات عمومی کافه و ممیزی سیستم</h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            پیکربندی هویت کافه، نرخ مالیات و خدمات، قوانین باشگاه وفاداری و لاگ‌های امنیتی
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'general' ? 'bg-[#4A2E1B] text-white shadow-xs' : 'text-[#614D3E]'
            }`}
          >
            تنظیمات کافه
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'account' ? 'bg-[#4A2E1B] text-white shadow-xs' : 'text-[#614D3E]'
            }`}
          >
            حساب کاربری و نام کاربری
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'audit' ? 'bg-[#4A2E1B] text-white shadow-xs' : 'text-[#614D3E]'
            }`}
          >
            لاگ‌های امنیتی (Audit Logs)
          </button>
        </div>
      </div>

      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Cafe Profile */}
          <div className="bg-white rounded-2xl border border-[#E8DFD5] p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-[#2C1810] text-sm flex items-center gap-2">
              <Coffee className="w-4 h-4 text-[#4A2E1B]" />
              <span>مشخصات و هویت کافه</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#543825] mb-1.5">نام رسمی کافه</label>
                <input
                  type="text"
                  required
                  value={settings.cafeName}
                  onChange={(e) => setSettings({ ...settings, cafeName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1.5">شماره تماس و خط اختصاصی</label>
                <input
                  type="text"
                  required
                  value={settings.cafePhone}
                  onChange={(e) => setSettings({ ...settings, cafePhone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B] font-mono text-left"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#543825] mb-1.5">نشانی و آدرس دقیق</label>
                <input
                  type="text"
                  required
                  value={settings.cafeAddress}
                  onChange={(e) => setSettings({ ...settings, cafeAddress: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#543825] mb-1.5">ساعات کاری روزانه</label>
                <input
                  type="text"
                  value={settings.workingHours}
                  onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                />
              </div>
            </div>
          </div>

          {/* Tax & Financial Parameters */}
          <div className="bg-white rounded-2xl border border-[#E8DFD5] p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-[#2C1810] text-sm flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#4A2E1B]" />
              <span>ضرایب مالیاتی و تخفیفات باشگاه</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#543825] mb-1.5">درصد مالیات بر ارزش افزوده (٪)</label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={settings.taxRatePercent}
                  onChange={(e) => setSettings({ ...settings, taxRatePercent: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] font-mono text-center"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1.5">درصد حق سرویس سالن (٪)</label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={settings.serviceFeePercent}
                  onChange={(e) => setSettings({ ...settings, serviceFeePercent: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] font-mono text-center"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1.5">مبلغ خرید برای هر ۱ امتیاز وفاداری (تومان)</label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={settings.loyaltyPointPerToman}
                  onChange={(e) => setSettings({ ...settings, loyaltyPointPerToman: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] font-mono text-left"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1.5">ارزش ریالی تخفیف به ازای هر امتیاز (تومان)</label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={settings.loyaltyPointValueToman}
                  onChange={(e) => setSettings({ ...settings, loyaltyPointValueToman: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] font-mono text-left"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#543825] mb-1.5">متن انتهای فیش چاپی (پیام تشکر)</label>
                <textarea
                  rows={2}
                  value={settings.receiptFooterMessage}
                  onChange={(e) => setSettings({ ...settings, receiptFooterMessage: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5]"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>تنظیمات با موفقیت ذخیره گردید</span>
              </span>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#4A2E1B] hover:bg-[#382315] text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات تنظیمات'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Account & Username Tab */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-[#2C1810] text-sm flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[#4A2E1B]" />
              <span>مدیریت حساب کاربری و نام کاربری</span>
            </h3>
            <p className="text-xs text-[#7A6A5C] mt-1">
              می‌توانید نام کاربری دلخواه خود را تعیین کنید تا بدون نیاز به تایپ ایمیل، با همین نام کاربری وارد سیستم شوید.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setProfileSaving(true);
              setProfileMsg(null);
              try {
                const res = await api.updateProfile({
                  name: profileName,
                  username: profileUsername,
                  email: profileEmail,
                  phone: profilePhone,
                });
                const token = getStoredToken() || '';
                setStoredAuth(token, res.user);

                if (profileNewPass) {
                  await api.changePassword(profileNewPass, profileCurrentPass || undefined);
                  setProfileNewPass('');
                  setProfileCurrentPass('');
                }

                setProfileMsg({ text: 'اطلاعات کاربری و نام کاربری با موفقیت به‌روزرسانی شد.' });
              } catch (err: any) {
                setProfileMsg({ text: err.message || 'خطا در ذخیره پروفایل', isError: true });
              } finally {
                setProfileSaving(false);
              }
            }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Username Field */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl sm:col-span-2">
                <label className="block font-bold text-amber-950 mb-1">
                  نام کاربری اختصاصی برای ورود (Username)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value)}
                    placeholder="admin"
                    dir="ltr"
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold text-left rounded-lg border border-amber-300 bg-white focus:outline-none focus:border-[#4A2E1B]"
                  />
                  <span className="text-[11px] text-amber-800">
                    (با وارد کردن این نام کاربری و رمز عبور می‌توانید وارد شوید)
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1.5">نام و نام خانوادگی</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1.5">ایمیل مدیر</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] font-mono text-left focus:outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1.5">شماره همراه</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] font-mono text-left focus:outline-none focus:border-[#4A2E1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#543825] mb-1.5">نقش در سیستم</label>
                <div className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] text-[#7A6A5C] font-semibold">
                  {currentUser?.roleTitle || 'مدیر ارشد و مالک سیستم'}
                </div>
              </div>
            </div>

            {/* Password Change Sub-section */}
            <div className="pt-4 border-t border-[#F5EFEB] space-y-3">
              <h4 className="font-bold text-[#2C1810] text-xs flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#4A2E1B]" />
                <span>تغییر رمز عبور (اختیاری)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[#7A6A5C] mb-1">رمز عبور فعلی</label>
                  <input
                    type="password"
                    value={profileCurrentPass}
                    onChange={(e) => setProfileCurrentPass(e.target.value)}
                    placeholder="در صورت تمایل به تغییر رمز وارد کنید"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5]"
                  />
                </div>
                <div>
                  <label className="block text-[#7A6A5C] mb-1">رمز عبور جدید</label>
                  <input
                    type="password"
                    value={profileNewPass}
                    onChange={(e) => setProfileNewPass(e.target.value)}
                    placeholder="حداقل ۶ نویسه"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5]"
                  />
                </div>
              </div>
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  profileMsg.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {profileMsg.isError ? <ShieldAlert className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#4A2E1B] hover:bg-[#382315] text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{profileSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره مشخصات و نام کاربری'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs">
          <div className="p-4 bg-[#FAF7F2] border-b border-[#E8DFD5] flex items-center justify-between">
            <span className="font-bold text-[#2C1810] text-xs">ثبت تمام عملیات‌های حساس (Audit Trail)</span>
            <span className="text-xs text-[#7A6A5C]">{auditLogs.length} رویداد ثبت‌شده</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E8DFD5] text-[#7A6A5C]">
                  <th className="py-3 px-4 font-semibold">تاریخ و زمان</th>
                  <th className="py-3 px-4 font-semibold">کاربر</th>
                  <th className="py-3 px-4 font-semibold">عنوان عملیات</th>
                  <th className="py-3 px-4 font-semibold">جزئیات رویداد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F2EB]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-[#7A6A5C] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString('fa-IR')} ·{' '}
                      {new Date(log.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2C1810] whitespace-nowrap">{log.userName}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF7F2] text-[#4A2E1B] border border-[#E8DFD5]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#7A6A5C] leading-relaxed">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
