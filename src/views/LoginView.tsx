import React, { useState } from 'react';
import { Coffee, Lock, Mail, AlertCircle, ArrowLeft, KeyRound, CheckCircle2, User as UserIcon } from 'lucide-react';
import { api, setStoredAuth } from '../services/api';
import { User } from '../types/cafe';

interface LoginViewProps {
  onLoginSuccess: (user: User, mustChangePassword: boolean) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('138708');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Recovery state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState<string | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(identifier, password);
      setStoredAuth(res.token, res.user);
      onLoginSuccess(res.user, res.mustChangePassword);
    } catch (err: any) {
      setError(err.message || 'خطا در ورود به سیستم');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);
    try {
      const res = await api.resetPasswordRequest(recoveryEmail);
      setRecoveryMsg(res.message);
    } catch (err: any) {
      setRecoveryMsg(err.message || 'خطا در بازیابی رمز عبور');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAF7F2]">
      {/* Visual Brand Showcase Column (Desktop) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 overflow-hidden bg-[#2C1810]">
        <img
          src="/src/assets/images/niko_cafe_interior_1794123841656.jpg"
          alt="NIKO CAFE Interior"
          className="absolute inset-0 w-full h-full object-cover opacity-75"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810] via-[#2C1810]/40 to-transparent" />

        <div className="relative z-10 mt-auto p-12 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#FAF7F2] text-xs font-medium mb-4">
            <Coffee className="w-3.5 h-3.5" />
            <span>سیستم یکپارچه مدیریت اختصاصی</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-3">نیکو کافه</h1>
          <p className="text-sm text-stone-200 max-w-md leading-relaxed font-light">
            مدیریت هوشمند میزها، صندوق فروشگاهی POS، رزرواسیون، انبارداری بلادرنگ و پشتیبانی از هوش مصنوعی اختصاصی
          </p>

          <div className="mt-8 pt-6 border-t border-white/15 flex items-center gap-6 text-xs text-stone-300">
            <div>
              <span className="block font-bold text-white text-base">۱۰+</span>
              <span className="text-[11px] text-stone-300">ماژول عملیاتی متصل</span>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div>
              <span className="block font-bold text-white text-base">۱۰۰٪</span>
              <span className="text-[11px] text-stone-300">محاسبات دقیق مالی و انبار</span>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div>
              <span className="block font-bold text-white text-base">AI</span>
              <span className="text-[11px] text-stone-300">دستیار تحلیلی کافه</span>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form Column */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#4A2E1B] text-white flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-[#2C1810]">نیکو کافه</h2>
              <p className="text-xs text-[#7A6A5C]">سیستم جامع مدیریت کافه</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8DFD5] p-8 shadow-xs">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#2C1810]">ورود به پنل مدیریت</h2>
              <p className="text-xs text-[#7A6A5C] mt-1">
                مشخصات حساب کاربری خود را جهت ورود به سیستم وارد نمایید
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#543825] mb-1.5">
                  نام کاربری یا پست الکترونیک
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="نام کاربری (مانند admin) یا ایمیل"
                    dir="ltr"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] bg-[#FAF7F2]/30 text-left font-mono"
                  />
                  <UserIcon className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[#543825]">رمز عبور</label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryEmail(identifier);
                      setRecoveryMsg(null);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] text-[#8C7A6B] hover:text-[#4A2E1B] transition-colors"
                  >
                    فراموشی رمز عبور؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] bg-[#FAF7F2]/30 text-left font-mono"
                  />
                  <Lock className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-[#4A2E1B] hover:bg-[#382315] text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                <span>{loading ? 'در حال ورود...' : 'ورود به نرم‌افزار'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] text-[#8C7A6B] mt-6">
            سیستم مدیریت یکپارچه نیکو کافه (NIKO CAFE) · نسخه اختصاصی ۱۴۰۵
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E8DFD5] p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#4A2E1B]/10 text-[#4A2E1B] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#2C1810] text-sm">بازیابی امن رمز عبور</h3>
                <p className="text-[11px] text-[#7A6A5C]">صدور رمز موقت جدید</p>
              </div>
            </div>

            {recoveryMsg ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{recoveryMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2.5 bg-[#4A2E1B] text-white text-xs font-bold rounded-xl"
                >
                  بازگشت به صفحه ورود
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#543825] mb-1.5">ایمیل مدیر کل یا پرسنل</label>
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="flowvoice15@gmail.com"
                    dir="ltr"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B]"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-2 text-xs text-[#7A6A5C] hover:text-[#2C1810]"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="px-4 py-2 bg-[#4A2E1B] text-white text-xs font-bold rounded-xl disabled:opacity-50"
                  >
                    {recoveryLoading ? 'در حال صدور...' : 'صدور رمز موقت'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
