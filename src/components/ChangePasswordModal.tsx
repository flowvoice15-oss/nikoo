import React, { useState } from 'react';
import { Lock, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  isMandatory?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  isMandatory = false,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('رمز عبور جدید و تکرار آن مطابقت ندارند');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(newPassword, currentPassword || undefined);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'خطا در تغییر رمز عبور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-[#E8DFD5] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-[#FAF7F2] p-5 border-b border-[#E8DFD5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A2E1B]/10 text-[#4A2E1B] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#2C1810]">
                {isMandatory ? 'تغییر الزامی رمز عبور اولیه' : 'تغییر رمز عبور حساب کاربری'}
              </h3>
              <p className="text-xs text-[#7A6A5C] mt-0.5">
                {isMandatory
                  ? 'جهت امنیت سیستم، در اولین ورود ملزم به تعیین رمز جدید هستید'
                  : 'رمز عبور خود را به‌صورت دوره‌ای به‌روزرسانی فرمایید'}
              </p>
            </div>
          </div>
          {!isMandatory && (
            <button
              onClick={onClose}
              className="text-[#9C8975] hover:text-[#2C1810] p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isMandatory && (
            <div>
              <label className="block text-xs font-semibold text-[#543825] mb-1.5">رمز عبور فعلی</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="رمز عبور کنونی خود را وارد کنید"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] bg-[#FAF7F2]/40"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#543825] mb-1.5">رمز عبور جدید</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="حداقل ۶ نویسه (ترکیب حروف و اعداد)"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] bg-[#FAF7F2]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#543825] mb-1.5">تکرار رمز عبور جدید</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="رمز جدید را مجدداً وارد نمایید"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E8DFD5] focus:outline-none focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] bg-[#FAF7F2]/40"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#7A6A5C] hover:text-[#2C1810] rounded-xl transition-colors"
              >
                انصراف
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#4A2E1B] hover:bg-[#382315] rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'در حال ذخیره‌سازی...' : 'ذخیره رمز عبور جدید'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
