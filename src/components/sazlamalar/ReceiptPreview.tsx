import React from 'react';
import type { PaperWidth, ReceiptSettings } from '../../types';
import { formatMoney } from '../../utils/money';

interface ReceiptPreviewProps {
  settings: ReceiptSettings;
  paperWidth: PaperWidth;
}

const SAMPLE_ITEMS = [
  { name: 'Biznes Hasap Programma', qty: 1, price: 5000 },
  { name: 'Termal çek kagyz', qty: 2, price: 45.5 },
];

function BarcodePlaceholder() {
  const bars = [2, 1, 3, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1];
  return (
    <div className="flex items-end justify-center gap-[2px] h-8">
      {bars.map((width, index) => (
        <span
          key={index}
          className="bg-black"
          style={{ width: `${width}px`, height: index % 3 === 0 ? '100%' : '80%' }}
        />
      ))}
    </div>
  );
}

function QrPlaceholder() {
  const cells = Array.from({ length: 49 }, (_, index) => (index * 7) % 3 !== 0);
  return (
    <div className="grid grid-cols-7 gap-[1px] w-16 h-16 mx-auto">
      {cells.map((filled, index) => (
        <span key={index} className={filled ? 'bg-black' : 'bg-white'} />
      ))}
    </div>
  );
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ settings, paperWidth }) => {
  const total = SAMPLE_ITEMS.reduce((sum, item) => sum + item.qty * item.price, 0);
  const width = paperWidth === '58mm' ? 210 : 290;
  const zoom = settings.fontScale === 'sm' ? 0.85 : settings.fontScale === 'lg' ? 1.2 : 1;

  return (
    <div className="flex justify-center">
      <div
        className="bg-white shadow-lg border border-gray-200 px-3 py-4 text-black"
        style={{ width: `${width}px`, fontFamily: "'Courier New', monospace", zoom }}
      >
        {settings.fields.logo && settings.logoDataUrl && (
          <div className="flex justify-center mb-2">
            <img
              src={settings.logoDataUrl}
              alt="logo"
              className="max-h-14 max-w-[70%] object-contain"
            />
          </div>
        )}

        <div className="text-center">
          <div className="text-[12px] font-bold leading-tight">
            {settings.companyName || 'BIZNES HASAP'}
          </div>
          {settings.fields.address && settings.address && (
            <div className="text-[9px] leading-snug mt-0.5">{settings.address}</div>
          )}
          {settings.fields.phone && settings.phone && (
            <div className="text-[9px] leading-snug">Tel: {settings.phone}</div>
          )}
          {settings.fields.taxId && settings.taxId && (
            <div className="text-[9px] leading-snug">STIR: {settings.taxId}</div>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="text-[9px] leading-snug space-y-0.5">
          <div className="flex justify-between">
            <span>Çek №:</span>
            <span>SAT.09/26-343</span>
          </div>
          <div className="flex justify-between">
            <span>Sene:</span>
            <span>{new Date().toLocaleString('tr-TR')}</span>
          </div>
          {settings.fields.cashier && (
            <div className="flex justify-between">
              <span>Kassir:</span>
              <span>Administrator</span>
            </div>
          )}
          {settings.fields.customer && (
            <div className="flex justify-between">
              <span>Müşderi:</span>
              <span>Umumy Müşderi</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="space-y-1">
          {SAMPLE_ITEMS.map((item) => (
            <div key={item.name} className="text-[9px]">
              <div className="leading-snug">{item.name}</div>
              <div className="flex justify-between">
                <span>
                  {item.qty} x {formatMoney(item.price)}
                </span>
                <span className="font-bold">{formatMoney(item.qty * item.price)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="flex justify-between text-[11px] font-bold">
          <span>JEMI</span>
          <span>{formatMoney(total)} TMT</span>
        </div>

        <div className="flex justify-between text-[9px] mt-1">
          <span>Töleg:</span>
          <span>Nagt</span>
        </div>

        {(settings.fields.qr || settings.fields.barcode) && (
          <>
            <div className="border-t border-dashed border-black my-2" />
            {settings.fields.qr && <QrPlaceholder />}
            {settings.fields.barcode && (
              <div className="mt-2">
                <BarcodePlaceholder />
                <div className="text-center text-[8px] mt-0.5 tracking-widest">1234567890123</div>
              </div>
            )}
          </>
        )}

        {settings.footerNote && (
          <>
            <div className="border-t border-dashed border-black my-2" />
            <div className="text-center text-[9px] font-bold leading-snug">
              {settings.footerNote}
            </div>
          </>
        )}
      </div>
    </div>
  );
};