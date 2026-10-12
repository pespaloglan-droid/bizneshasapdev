import React, { useState, useEffect, useCallback } from 'react';
import { Minus, Plus, Trash2, ShoppingCart, FileEdit, GripVertical, CheckCircle2 } from 'lucide-react';
import { CartItem, LanguageCode, UnitType } from '../../types';
import { translations, translate } from '../../locales/i18n';
import { ProductImage } from './ProductImage';
import { CurrencyLabel } from './CurrencyLabel';
import { unitLabel, type MeasurementUnit } from '../../db/unitService';

export type ColumnKey = 'index' | 'name' | 'unit' | 'qty' | 'price' | 'percent' | 'total' | 'actions';

interface ColumnDef {
  key: ColumnKey;
  labelKey?: string;
  align?: 'left' | 'center' | 'right';
  draggable?: boolean;
  resizable?: boolean;
}

interface CartTableProps {
  items: CartItem[];
  subtotal: number;
  internalNote: string;
  globalPercent: number;
  language: LanguageCode;
  units: readonly MeasurementUnit[];
  onUpdateQty: (productId: string, delta: number) => void;
  onSetQty: (productId: string, qty: number) => void;
  onUpdatePrice: (productId: string, newPrice: number) => void;
  onUpdatePercent: (productId: string, percent: number) => void;
  onUpdateUnit: (productId: string, unit: UnitType) => void;
  onApplyGlobalPercent: (percent: number) => void;
  onRemoveItem: (productId: string) => void;
  onInternalNoteChange: (note: string) => void;
  onCompleteSale?: () => void;
  canCompleteSale?: boolean;
  /** Inçe rugsat: "Bahany üýtget" (kapalysa fiyat sütuny gizlenýär). */
  canEditPrice?: boolean;
  /** Inçe rugsat: "Arzanladyş ber" (kapalysa +/- % alanlary gizlenýär). */
  canAllowDiscount?: boolean;
}

const getUnitOptions = (
  units: readonly MeasurementUnit[],
  language: LanguageCode
): { value: string; label: string }[] =>
  units.map((unit) => ({ value: unit.code, label: unitLabel(units, unit.code, language) }));

export const CartTable: React.FC<CartTableProps> = ({
  items,
  subtotal,
  internalNote,
  globalPercent,
  language,
  units,
  onUpdateQty,
  onSetQty,
  onUpdatePrice,
  onUpdatePercent,
  onUpdateUnit,
  onApplyGlobalPercent,
  onRemoveItem,
  onInternalNoteChange,
  onCompleteSale,
  canCompleteSale = false,
  canEditPrice = true,
  canAllowDiscount = true
}) => {
  const t = translations[language] || translations.en;
  const totalItemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const isGlobalNegative = globalPercent < 0;

  // Sütun tanımları
  const defaultColumns: ColumnDef[] = [
    { key: 'index',   align: 'center', draggable: true,  resizable: true  },
    { key: 'name',    labelKey: 'productNameCol', align: 'left',   draggable: true,  resizable: true  },
    { key: 'unit',    labelKey: 'unitCol',         align: 'center', draggable: true,  resizable: true  },
    { key: 'qty',     labelKey: 'qtyCol',          align: 'center', draggable: true,  resizable: true  },
    { key: 'price',   labelKey: 'priceCol',        align: 'center', draggable: true,  resizable: true  },
    { key: 'percent', labelKey: 'discountCol',     align: 'center', draggable: true,  resizable: true  },
    { key: 'total',   labelKey: 'totalCol',        align: 'right',  draggable: true,  resizable: true  },
    { key: 'actions', align: 'center', draggable: false, resizable: false }
  ];

  // FIX: Her sütun kendi sabit genişliğine sahip — resize sadece o sütunu etkiler
  const defaultWidths: Record<ColumnKey, number> = {
    index:   36,   // daraltıldı
    name:    230,
    unit:    68,
    qty:     104,
    price:   85,
    percent: 110,
    total:   82,
    actions: 38    // daraltıldı
  };

  // Inçe rugsatlar: "Bahany üýtget"/"Arzanladyş ber" kapalysa fiyat/% sütunlary gizle.
  const [columns, setColumns] = useState<ColumnDef[]>(() =>
    canEditPrice && canAllowDiscount
      ? defaultColumns
      : defaultColumns.filter((col) =>
          !(col.key === 'price' && !canEditPrice) &&
          !(col.key === 'percent' && !canAllowDiscount)
        )
  );
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(defaultWidths);

  // Drag & Drop sıralaması
  const [draggedColIdx, setDraggedColIdx] = useState<number | null>(null);
  const [dragOverColIdx, setDragOverColIdx] = useState<number | null>(null);

  // Resize state
  const [resizingCol, setResizingCol] = useState<{
    key: ColumnKey;
    nextKey?: ColumnKey;
    startX: number;
    startWidth: number;
    startNextWidth?: number;
  } | null>(null);

  // Her sütun için ideal minimum genişlik sınırı (içeriklerin bozulmaması için)
  const getMinColumnWidth = (key: ColumnKey): number => {
    switch (key) {
      case 'index':   return 30;
      case 'actions': return 38;
      case 'unit':    return 48;
      case 'qty':     return 72; // - [sayı] + butonlarının ezilmemesi için
      case 'price':   return 52;
      case 'percent': return 72;
      case 'total':   return 55;
      case 'name':    return 100;
      default:        return 50;
    }
  };

  // FIX: Resize — sadece sürüklenen çizgi hareket etsin (adjacent column resizing)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingCol) return;
    const delta = e.clientX - resizingCol.startX;
    
    const minW = getMinColumnWidth(resizingCol.key);
    
    if (resizingCol.nextKey && resizingCol.startNextWidth !== undefined) {
      const nextMinW = getMinColumnWidth(resizingCol.nextKey);
      
      let actualDelta = delta;
      
      // Geçerli sütun için minimum genişlik sınırı
      if (resizingCol.startWidth + actualDelta < minW) {
        actualDelta = minW - resizingCol.startWidth;
      }
      
      // Sonraki sütun için minimum genişlik sınırı
      if (resizingCol.startNextWidth - actualDelta < nextMinW) {
        actualDelta = resizingCol.startNextWidth - nextMinW;
      }

      setColumnWidths(prev => ({ 
        ...prev, 
        [resizingCol.key]: resizingCol.startWidth + actualDelta,
        [resizingCol.nextKey!]: resizingCol.startNextWidth! - actualDelta
      }));
    } else {
      const newWidth = Math.max(minW, resizingCol.startWidth + delta);
      setColumnWidths(prev => ({ ...prev, [resizingCol.key]: newWidth }));
    }
  }, [resizingCol]);

  const handleMouseUp = useCallback(() => {
    setResizingCol(null);
  }, []);

  useEffect(() => {
    if (!resizingCol) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, handleMouseMove, handleMouseUp]);

  const handleResizeStart = (e: React.MouseEvent, key: ColumnKey, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const nextCol = columns[idx + 1];
    
    if (nextCol) {
      setResizingCol({ 
        key, 
        nextKey: nextCol.key,
        startX: e.clientX, 
        startWidth: columnWidths[key] || 80,
        startNextWidth: columnWidths[nextCol.key] || 80
      });
    } else {
      setResizingCol({ 
        key, 
        startX: e.clientX, 
        startWidth: columnWidths[key] || 80 
      });
    }
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    if (resizingCol) { e.preventDefault(); return; }
    setDraggedColIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedColIdx !== null && draggedColIdx !== idx) setDragOverColIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (draggedColIdx === null || draggedColIdx === idx) { setDraggedColIdx(null); setDragOverColIdx(null); return; }
    const newCols = [...columns];
    const [dragged] = newCols.splice(draggedColIdx, 1);
    newCols.splice(idx, 0, dragged);
    setColumns(newCols);
    setDraggedColIdx(null);
    setDragOverColIdx(null);
  };
  const handleDragEnd = () => { setDraggedColIdx(null); setDragOverColIdx(null); };

  const getHeaderLabel = (col: ColumnDef) => {
    if (col.key === 'index') return '#';
    if (col.key === 'unit') return translate(language, 'pos.unitCol');
    if (col.labelKey && (t as any)[col.labelKey]) return (t as any)[col.labelKey];
    return '';
  };

  // Hücre renderer
  const renderCell = (colKey: ColumnKey, item: CartItem, rowIdx: number) => {
    const pct = item.percent || 0;
    const factor = 1 + pct / 100;
    const rowTotal = Math.max(0, item.qty * item.price * factor);
    const isNeg = pct < 0;
    const unit = item.unit || 'adet';
    const isDecimalUnit = unit === 'kg' || unit === 'litre' || unit === 'metre';
    const w = columnWidths[colKey];
    const ws = { width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` };

    switch (colKey) {

      // ─── # (sıra no) — daraltılmış ───────────────────────────────────────
      case 'index':
        return (
          <td key="index" style={ws}
            className="py-2 px-1 text-center text-gray-400 font-mono text-[10px] font-medium border-r border-gray-300 overflow-hidden whitespace-nowrap">
            {rowIdx + 1}
          </td>
        );

      // ─── Haryt Ady ────────────────────────────────────────────────────────
      case 'name':
        return (
          <td key="name" style={ws} className="py-2 px-2 border-r border-gray-300 overflow-hidden">
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 p-0.5 flex items-center justify-center flex-shrink-0">
                <ProductImage type={item.imageType} imageUrl={item.imageUrl} className="w-7 h-7" />
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <div className="font-semibold text-gray-900 truncate text-[11px]">{item.name}</div>
                <div className="text-[10px] text-gray-400 font-mono truncate">SKU: {item.sku}</div>
              </div>
            </div>
          </td>
        );

      // ─── Ölçü Birimi ──────────────────────────────────────────────────────
      case 'unit':
        return (
          <td key="unit" style={ws} className="py-2 px-1 text-center border-r border-gray-300 overflow-hidden">
            <select
              value={unit}
              onChange={(e) => onUpdateUnit(item.productId, e.target.value as UnitType)}
              className="w-full h-6 text-center text-[10px] font-bold font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-emerald-500 cursor-pointer hover:bg-gray-100 transition-colors appearance-none px-0.5"
            >
              {getUnitOptions(units, language).map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </td>
        );

      // ─── Sany (Adet / Miktar) ──────────────────────────────────────────
      case 'qty':
        return (
          <td key="qty" style={ws} className="py-2 px-1 text-center border-r border-gray-300 overflow-hidden">
            <div className="flex w-full h-6 items-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md overflow-hidden transition-colors focus-within:bg-white focus-within:border-emerald-500">
              <button
                type="button"
                onClick={() => onUpdateQty(item.productId, -1)}
                className="w-5 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 active:bg-gray-300 transition-colors flex-shrink-0 select-none cursor-pointer"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <input
                type="number"
                min={isDecimalUnit ? '0' : '1'}
                step={isDecimalUnit ? '0.1' : '1'}
                value={item.qty}
                onChange={(e) => {
                  const v = isDecimalUnit ? parseFloat(e.target.value) : parseInt(e.target.value);
                  onSetQty(item.productId, Math.max(isDecimalUnit ? 0.1 : 1, v || 1));
                }}
                className="flex-1 w-full min-w-0 text-center font-bold text-[10px] text-gray-700 font-mono bg-transparent outline-none px-0.5"
              />
              <button
                type="button"
                onClick={() => onUpdateQty(item.productId, isDecimalUnit ? 0.1 : 1)}
                className="w-5 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 active:bg-gray-300 transition-colors flex-shrink-0 select-none cursor-pointer"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
          </td>
        );

      // ─── Baha (Fiyat) ────────────────────────────────────────────────────
      case 'price':
        return (
          <td key="price" style={ws} className="py-2 px-1 text-center border-r border-gray-300 overflow-hidden">
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                min="0"
                value={item.price === 0 ? '' : item.price}
                onChange={(e) => onUpdatePrice(item.productId, parseFloat(e.target.value) || 0)}
                className="flex-1 min-w-0 h-6 px-1 text-center font-mono font-bold text-[10px] text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md outline-none focus:bg-white focus:border-emerald-500 transition-colors"
              />
              <CurrencyLabel className="text-[9px] font-bold text-gray-400 flex-shrink-0" />
            </div>
          </td>
        );

      // ─── +/- % ───────────────────────────────────────────────────────────
      case 'percent':
        return (
          <td key="percent" style={ws} className="py-2 px-1 text-center border-r border-gray-300 overflow-hidden">
            <div className={`flex w-full h-6 items-center border rounded-md overflow-hidden transition-all ${
              isNeg
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : pct > 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            } focus-within:bg-white focus-within:border-emerald-500`}>
              <button
                type="button"
                onClick={() => {
                  const abs = Math.abs(pct);
                  onUpdatePercent(item.productId, isNeg ? (abs === 0 ? 0 : abs) : (abs === 0 ? 0 : -abs));
                }}
                className={`w-5 h-full font-black text-[10px] flex items-center justify-center transition-colors border-r select-none cursor-pointer flex-shrink-0 ${
                  isNeg
                    ? 'bg-rose-200/80 text-rose-800 border-rose-300 hover:bg-rose-300'
                    : pct > 0
                    ? 'bg-emerald-200/80 text-emerald-800 border-emerald-300 hover:bg-emerald-300'
                    : 'bg-gray-200/70 text-gray-600 border-gray-200 hover:bg-gray-300'
                }`}
              >
                {isNeg ? '−' : '+'}
              </button>
              <input
                type="number"
                min="0"
                step="any"
                value={Math.abs(pct) === 0 ? '' : Math.abs(pct)}
                placeholder="0"
                onChange={(e) => {
                  const v = Math.abs(parseFloat(e.target.value) || 0);
                  onUpdatePercent(item.productId, isNeg ? -v : v);
                }}
                className="flex-1 w-full min-w-0 text-center font-mono font-bold text-[10px] bg-transparent outline-none placeholder-gray-400 px-0.5"
              />
              <span className="text-[9px] font-bold opacity-70 pr-1 flex-shrink-0 select-none">%</span>
            </div>
          </td>
        );

      // ─── Jemi (Toplam) ────────────────────────────────────────────────────
      case 'total':
        return (
          <td key="total" style={ws}
            className="py-2 px-2 text-right font-mono font-bold text-[#10b981] text-[11px] border-r border-gray-300 overflow-hidden text-ellipsis whitespace-nowrap">
            {rowTotal.toFixed(2)} <CurrencyLabel className="text-[9px] text-emerald-600/70" />
          </td>
        );

      // ─── Sil (Trash) — küçültülmüş ───────────────────────────────────────
      case 'actions':
        return (
          <td key="actions" style={ws} className="py-2 px-1 text-center overflow-hidden">
            {/* FIX: ikon küçültüldü */}
            <button type="button"
              onClick={() => onRemoveItem(item.productId)}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </td>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex-1 bg-white border border-gray-300 rounded-xl flex flex-col justify-between overflow-hidden shadow-sm min-h-0 ${
      resizingCol ? 'select-none cursor-col-resize' : ''
    }`}>
      {/* Tablo */}
      <div className="overflow-auto flex-1">
        {/* FIX: table-layout fixed + her sütun kendi genişliğini tutar */}
        <table className="text-left border-collapse table-fixed" style={{ width: 'max-content', minWidth: '100%' }}>
          <thead className="sticky top-0 z-10 select-none">
            <tr className="border-b-2 border-gray-300 text-[11px] font-bold text-gray-700 bg-gray-100">
              {columns.map((col, idx) => {
                const isDragging = draggedColIdx === idx;
                const isOver    = dragOverColIdx === idx;
                const canDrag   = col.draggable !== false;
                const canResize = col.resizable !== false;
                const w = columnWidths[col.key];

                return (
                  <th key={col.key}
                    style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }}
                    draggable={canDrag && !resizingCol}
                    onDragStart={(e) => canDrag && handleDragStart(e, idx)}
                    onDragOver={(e)  => canDrag && handleDragOver(e, idx)}
                    onDrop={()       => canDrag && handleDrop(idx)}
                    onDragEnd={handleDragEnd}
                    className={`py-2 px-2 relative border-r border-gray-300 last:border-r-0 transition-colors ${
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                    } ${canDrag ? 'cursor-grab active:cursor-grabbing hover:bg-gray-200/90' : ''} ${
                      isDragging ? 'opacity-40 bg-gray-300' : ''
                    } ${isOver ? 'bg-emerald-100 border-emerald-500' : ''}`}
                  >
                    <div className={`flex items-center space-x-0.5 overflow-hidden ${
                      col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'
                    }`}>
                      {canDrag && <GripVertical className="w-2.5 h-2.5 text-gray-400 opacity-60 -ml-0.5 flex-shrink-0" />}
                      <span className="truncate text-[10px]">{getHeaderLabel(col)}</span>
                    </div>

                    {/* FIX: Resize handle — sadece bu sütunu boyutlandırır */}
                    {canResize && (
                      <div
                        onMouseDown={(e) => handleResizeStart(e, col.key, idx)}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize group flex items-center justify-center z-20 select-none hover:bg-emerald-400/40 transition-colors"
                      >
                        <div className="w-px h-3 bg-gray-400 group-hover:bg-emerald-600 rounded-full" />
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-300 text-xs">
            {items.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-14 text-center text-gray-400">
                  <ShoppingCart className="w-9 h-9 mx-auto mb-1.5 text-gray-300 stroke-[1.5]" />
                  <span>{t.emptyCartMsg}</span>
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-emerald-50/25 border-b border-gray-300 transition-colors">
                  {columns.map((col) => renderCell(col.key, item, idx))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Alt Özet Barı */}
      <div className="h-12 border-t-2 border-gray-300 bg-white px-4 flex items-center space-x-2.5 select-none flex-shrink-0">
        {/* 1. Kalem sayısı */}
        <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 flex-shrink-0">
          <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200">
            <ShoppingCart className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-gray-800 whitespace-nowrap">{totalItemCount} {t.itemsCount}</span>
        </div>

        {/* 2. Bellik notu (Kompakt h-8) */}
        <div className="w-72 max-w-sm relative flex-shrink-0">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
            <FileEdit className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={internalNote}
            onChange={(e) => onInternalNoteChange(e.target.value)}
            placeholder={t.internalNotePlaceholder}
            className="w-full h-8 pl-8 pr-2 bg-gray-50 hover:bg-gray-100/80 border border-gray-200 focus:bg-white focus:border-emerald-500 rounded-md text-[11px] font-medium text-gray-900 placeholder-gray-400 transition-all outline-none"
          />
        </div>

        {/* 3. Sadece % Butonu (Kompakt h-8) — "Arzanladyş ber" rugsady bilen */}
        {canAllowDiscount && (
        <div className={`inline-flex items-center border rounded-md overflow-hidden h-8 transition-all flex-shrink-0 ${
          isGlobalNegative ? 'bg-rose-50 border-rose-300 text-rose-700'
          : globalPercent > 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
        } focus-within:bg-white focus-within:border-emerald-500`}>
          <button
            type="button"
            onClick={() => {
              const abs = Math.abs(globalPercent);
              onApplyGlobalPercent(isGlobalNegative ? (abs === 0 ? 0 : abs) : (abs === 0 ? 0 : -abs));
            }}
            className={`h-full px-2 font-black text-[10px] flex items-center justify-center transition-colors border-r select-none cursor-pointer ${
              isGlobalNegative ? 'bg-rose-200/80 text-rose-800 border-rose-300 hover:bg-rose-300'
              : globalPercent > 0 ? 'bg-emerald-200/80 text-emerald-800 border-emerald-300 hover:bg-emerald-300'
              : 'bg-gray-200/70 text-gray-600 border-gray-200 hover:bg-gray-300'
            }`}
          >
            {isGlobalNegative ? '−' : '+'}
          </button>
          <input
            type="number"
            min="0"
            step="any"
            value={Math.abs(globalPercent) === 0 ? '' : Math.abs(globalPercent)}
            placeholder="0"
            onChange={(e) => {
              const v = Math.abs(parseFloat(e.target.value) || 0);
              onApplyGlobalPercent(isGlobalNegative ? -v : v);
            }}
            className="w-8 text-center font-mono font-bold text-[10px] bg-transparent outline-none placeholder-gray-400"
          />
          <span className="text-[9px] font-bold opacity-70 pr-1.5 select-none">%</span>
        </div>
        )}

        {/* 4. Sağ taraf: Tamamlama Butonu (diňe ikon) */}
        <div className="flex-1 flex justify-end">
          {onCompleteSale && (
            <button
              type="button"
              onClick={onCompleteSale}
              disabled={!canCompleteSale}
              title={t.completeSaleBtn}
              aria-label={t.completeSaleBtn}
              className="h-10 w-10 flex items-center justify-center bg-[#10b981] hover:bg-[#059669] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none rounded-xl text-white transition-all shadow-sm"
            >
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
