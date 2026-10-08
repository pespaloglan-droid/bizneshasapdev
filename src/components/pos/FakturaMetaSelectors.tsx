import React from 'react';
import { Boxes, Package } from 'lucide-react';
import type { InvoiceType, LanguageCode, Warehouse } from '../../types';

interface FakturaMetaSelectorsProps {
  language: LanguageCode;
  warehouses: readonly Warehouse[];
  invoiceType: InvoiceType;
  warehouseId: string;
  targetWarehouseId: string;
  onWarehouseChange: (id: string) => void;
  onTargetWarehouseChange: (id: string) => void;
  /** Sag tarap: Sene / Wagt saýlaýjy. */
  dateTimeSlot?: React.ReactNode;
}

function selectClass(enabled: boolean): string {
  const base = 'w-full h-8 pl-7 pr-6 rounded-lg text-[11px] font-bold outline-none truncate border';
  return enabled
    ? `${base} bg-[#F8FAFC] border-gray-200 text-gray-700 focus:ring-1 focus:ring-emerald-500 cursor-pointer`
    : `${base} bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed`;
}

/**
 * Ýerleşiş:
 *   [ Ammar    ] [ Sene / Wagt ]   ← Ammar + Ammar 2 alt-üst, ýakyn
 *   [ Ammar 2  ] [             ]
 *   [ Gaytargy (doly ini)      ]
 */
export const FakturaMetaSelectors: React.FC<FakturaMetaSelectorsProps> = ({
  language,
  warehouses,
  invoiceType,
  warehouseId,
  targetWarehouseId,
  onWarehouseChange,
  onTargetWarehouseChange,
  dateTimeSlot,
}) => {
  const isTransfer = invoiceType === 'warehouse_move';

  return (
    <div className="w-full space-y-1.5">
      <div className="grid grid-cols-[1fr_1.15fr] gap-1.5 items-stretch">
        {/* Çep sütun: Ammar + Ammar 2 (alt-üst, ýakyn) */}
        <div className="flex flex-col gap-1 min-w-0">
          {/* Ammar — elmydama işjeň */}
          <div className="relative h-8">
            <Package className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600 pointer-events-none" />
            <select
              value={warehouseId}
              onChange={(e) => onWarehouseChange(e.target.value)}
              title={language === 'tm' ? 'Ammar saýla' : 'Ambar seç'}
              className={selectClass(true)}
            >
              <option value="">Ammar</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ammar 2 — diňe geçirim görnüşinde işjeň */}
          <div className="relative h-8">
            <Boxes
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${
                isTransfer ? 'text-emerald-600' : 'text-gray-400'
              }`}
            />
            <select
              value={isTransfer ? targetWarehouseId : ''}
              onChange={(e) => onTargetWarehouseChange(e.target.value)}
              disabled={!isTransfer}
              title={
                isTransfer
                  ? language === 'tm'
                    ? 'Hedef ammary saýla'
                    : 'Hedef ambarı seç'
                  : language === 'tm'
                  ? 'Diňe "Ammarlar arasyndaky hereket" üçin işjeň'
                  : 'Sadece "Ambarlar arası hareket" için aktif'
              }
              className={selectClass(isTransfer)}
            >
              <option value="">Ammar 2</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sag sütun: Sene / Wagt */}
        <div className="min-w-0 h-full">{dateTimeSlot}</div>
      </div>

      {isTransfer && (
        <div className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-1.5 py-0.5 text-center">
          {language === 'tm'
            ? 'Ammarlar arasyndaky geçirim: 1-nji ammardan 2-nji ammara'
            : 'Ambarlar arası transfer: 1. ambardan 2. ambara'}
        </div>
      )}
    </div>
  );
};