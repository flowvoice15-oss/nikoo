import React from 'react';
import { X, Printer, CheckCircle2, Coffee } from 'lucide-react';
import { Order, CafeSettings } from '../types/cafe';

interface ReceiptModalProps {
  order: Order | null;
  settings: CafeSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  settings,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = new Date(order.createdAt).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#E8DFD5] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Toolbar */}
        <div className="p-4 bg-[#FAF7F2] border-b border-[#E8DFD5] flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2C1810] text-sm">رسید پرداخت رسمی</span>
            <span className="text-xs text-[#7A6A5C]">· سفارش #{order.orderNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A2E1B] text-white hover:bg-[#382315] text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ فیش</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#9C8975] hover:text-[#2C1810] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 overflow-y-auto bg-white flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[340px] border border-dashed border-[#D6C7B7] p-5 rounded-xl bg-[#FFFDFB] text-[#2C1810] text-xs"
          >
            {/* Header / Brand */}
            <div className="text-center pb-4 border-b border-dashed border-[#E0D5C7]">
              <div className="w-10 h-10 rounded-full bg-[#4A2E1B] text-white flex items-center justify-center mx-auto mb-2">
                <Coffee className="w-5 h-5" />
              </div>
              <h1 className="text-base font-black tracking-tight text-[#2C1810]">نیکو کافه</h1>
              <p className="font-mono text-[10px] tracking-widest text-[#7A6A5C] uppercase mt-0.5">NIKO CAFE</p>
              <p className="text-[11px] text-[#7A6A5C] mt-2 leading-relaxed">{settings.cafeAddress}</p>
              <p className="text-[11px] text-[#7A6A5C] mt-0.5 font-mono tabular-nums">تلفن: {settings.cafePhone}</p>
            </div>

            {/* Meta Information */}
            <div className="py-3 border-b border-dashed border-[#E0D5C7] space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#7A6A5C]">شماره فاکتور:</span>
                <span className="font-bold font-mono">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6A5C]">نوع سفارش:</span>
                <span className="font-medium">
                  {order.tableNumber ? `میز شماره ${order.tableNumber} (داخل سالن)` : 'سفارش بیرون‌بر'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6A5C]">مشتری:</span>
                <span className="font-medium">{order.customerName || 'مشتری آزاد'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6A5C]">صندوقدار / میزبان:</span>
                <span className="font-medium">{order.cashierName || order.waiterName || 'نیکو کافه'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6A5C]">تاریخ و ساعت:</span>
                <span className="font-mono tabular-nums">{formattedDate} · {formattedTime}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-3 border-b border-dashed border-[#E0D5C7]">
              <div className="grid grid-cols-12 text-[10px] font-bold text-[#7A6A5C] pb-2 border-b border-[#F0E8DE]">
                <span className="col-span-6 text-right">عنوان سفارش</span>
                <span className="col-span-2 text-center">تعداد</span>
                <span className="col-span-4 text-left">مبلغ (تومان)</span>
              </div>

              <div className="divide-y divide-[#F7F2EB] py-1">
                {order.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-2 text-[11px] items-start">
                    <div className="col-span-6 text-right pr-0.5">
                      <p className="font-semibold text-[#2C1810]">{item.nameFa}</p>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <p className="text-[9px] text-[#8C7A6B] mt-0.5">
                          {item.selectedOptions.join(' · ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[9px] text-[#A39283] italic mt-0.5">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 text-center font-mono tabular-nums text-[#4A2E1B] font-bold">
                      {item.quantity}
                    </div>
                    <div className="col-span-4 text-left font-mono tabular-nums font-semibold">
                      {(item.unitPrice * item.quantity).toLocaleString('fa-IR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Calculations */}
            <div className="py-3 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-[#7A6A5C]">
                <span>جمع کل اقلام:</span>
                <span className="font-mono tabular-nums">{order.subtotal.toLocaleString('fa-IR')} تومان</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>تخفیف ویژه:</span>
                  <span className="font-mono tabular-nums">-{order.discountAmount.toLocaleString('fa-IR')} تومان</span>
                </div>
              )}

              {order.taxAmount > 0 && (
                <div className="flex justify-between text-[#7A6A5C]">
                  <span>مالیات بر ارزش افزوده:</span>
                  <span className="font-mono tabular-nums">{order.taxAmount.toLocaleString('fa-IR')} تومان</span>
                </div>
              )}

              {order.serviceAmount > 0 && (
                <div className="flex justify-between text-[#7A6A5C]">
                  <span>حق سرویس:</span>
                  <span className="font-mono tabular-nums">{order.serviceAmount.toLocaleString('fa-IR')} تومان</span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-[#E0D5C7] font-bold text-sm text-[#4A2E1B]">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="font-mono tabular-nums">{order.totalAmount.toLocaleString('fa-IR')} تومان</span>
              </div>

              <div className="flex justify-between pt-1 text-[11px]">
                <span className="text-[#7A6A5C]">وضعیت تسویه:</span>
                <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {order.paymentStatus === 'paid' ? 'تسویه کامل شده' : 'پرداخت جزئی / مانده'}
                </span>
              </div>

              {order.payments && order.payments.length > 0 && (
                <div className="pt-2 border-t border-dashed border-[#E0D5C7] space-y-1 text-[10px] text-[#7A6A5C]">
                  {order.payments.map((p, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        روش: {p.method === 'pos_card' ? 'کارت‌خوان (POS)' : p.method === 'cash' ? 'وجه نقد' : 'آنلاین'}
                        {p.referenceCode ? ` (${p.referenceCode})` : ''}
                      </span>
                      <span className="font-mono tabular-nums">{p.amount.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Message */}
            <div className="mt-4 pt-4 border-t border-dashed border-[#E0D5C7] text-center">
              <p className="text-[11px] font-medium text-[#4A2E1B] leading-relaxed">
                {settings.receiptFooterMessage}
              </p>
              <div className="flex items-center justify-center gap-1 mt-2 text-[#9C8975] text-[10px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>رسید الکترونیکی سیستم جامع نیکو کافه</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
