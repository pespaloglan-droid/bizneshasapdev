import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  ChevronDown,
  X,
  Camera,
  AlertTriangle,
  MinusCircle,
  Upload,
  Download,
  ListChecks,
  GitBranch,
} from 'lucide-react';
import { Product, LanguageCode } from '../../types';
import { useT } from '../../locales/LanguageContext';
import { ProductImage } from '../pos/ProductImage';
import { CurrencyLabel } from '../pos/CurrencyLabel';
import { UnitSelect } from './UnitSelect';
import { unitLabel, type MeasurementUnit } from '../../db/unitService';
import { ProductExcelImportModal } from './ProductExcelImportModal';
import type { ImportSummary, ProductImportEntry } from './ProductExcelImportModal';
import { ProductExcelExportModal } from './ProductExcelExportModal';
import { ProductBulkEditModal } from './ProductBulkEditModal';
import { CompositionModal } from './CompositionModal';
import { getComposedProductIds } from '../../db/compositionService';
import type { BatchWriteResult } from '../../db/pouch';
import type { ImportErrorRow } from '../../utils/importErrorReport';
import { onMobileAdd } from '../../utils/mobileEvents';
import { compressImage } from '../../utils/imageCompress';
import { PageScroll } from '../common/PageScroll';

interface ProductWorkspaceProps {
  products: Product[];
  units: readonly MeasurementUnit[];
  language: LanguageCode;
  onAddProduct: (p: Product) => boolean | void | Promise<boolean | void>;
  onUpdateProduct: (p: Product) => boolean | void | Promise<boolean | void>;
  onDeleteProduct: (id: string) => boolean | void | Promise<boolean | void>;
  onCreateUnit: (unit: MeasurementUnit) => void;
  /**
   * Excel importynyň toplu ýazgy prosesi: çykyşy tassyklanan harytlaryň
   * hemmesini BIR batch-de ýazýar we şowsuzlary aýratynlykda hasaba alýar.
   * Berlen bolsa tekil onAddProduct/onUpdateProduct ýerine şu ulanylýar.
   */
  onImportProducts?: (
    items: ReadonlyArray<{ product: Product; rowNumber: number }>
  ) => Promise<BatchWriteResult>;
  /** Duýduryş panelinden gelýän fokus — degişli harydy açýar. */
  focusProductId?: string | null;
  /** Ýörite rugsatlar: täze haryt formasynda deslapky ölçeg bahalary. */
  defaultUnit?: string;
  defaultUnit2?: string;
  /** Haryt düzümi üçin maglumat bazasy. */
  storeDb?: string;
  /** Firma/hesap ady — Excel çyktysynda header görkezilýär. */
  accountName?: string;
}

const emptyForm = (
  defaultUnit?: string,
  defaultUnit2?: string
): Omit<Product, 'id' | 'imageType'> & { imageType: Product['imageType'] } => ({
  sku: '',
  barcode: '',
  extraBarcodes: [],
  name: '',
  category: '',
  price: 0,
  purchasePrice: 0,
  wholesalePrice: 0,
  stock: 0,
  allowNegativeStock: false,
  isActive: true,
  criticalStock: 5,
  unit: defaultUnit || 'adet',
  unit2: defaultUnit2 || undefined,
  unit2Qty: defaultUnit2 ? 1 : undefined,
  expiryDate: '',
  imageType: 'default',
  imageUrl: '',
});




export const ProductWorkspace: React.FC<ProductWorkspaceProps> = ({
  products,
  units,
  language,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onCreateUnit,
  onImportProducts,
  focusProductId = null,
  defaultUnit,
  defaultUnit2,
  storeDb,
  accountName = 'Biznes Hasap',
}) => {
  const t = useT();

  // List state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [extraBarcodeInput, setExtraBarcodeInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageBusy, setImageBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // Haryt düzümi (kompozisiýa) modal.
  const [compositionProduct, setCompositionProduct] = useState<Product | null>(null);
  // Düzümi bolan harytlar — sanawda rozet görkezmek üçin.
  const [composedIds, setComposedIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!storeDb) return;
    let cancelled = false;
    void getComposedProductIds(storeDb).then((ids) => {
      if (!cancelled) setComposedIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [storeDb, products]);

  // Excel import / export
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  /**
   * Excel import: bar bolanlary täzeläp ýa-da geçip, täzelerini goşýar.
   *
   * Çykyşy tassyklanan harytlar ýeke-ýeke däl-de mümkin bolsa BIR batch-de
   * ýazylýar (onImportProducts); ýazylmadyklar `failed` sanawyna setir belgisi
   * we sebäbi bilen düşýär. onImportProducts berlen bolmasa öňki tekil akym
   * ulanylýar (onAddProduct/onUpdateProduct).
   */
  const handleExcelImport = async (
    entries: readonly ProductImportEntry[],
    mode: 'overwrite' | 'skip'
  ): Promise<ImportSummary> => {
    const byBarcode = new Map(products.map((p) => [p.barcode.trim().toLowerCase(), p]));
    const byName = new Map(products.map((p) => [p.name.trim().toLowerCase(), p]));
    const handled = new Set<string>();
    let added = 0;
    let updated = 0;
    let skipped = 0;
    const planned: Array<{
      product: Product;
      rowNumber: number;
      action: 'add' | 'update';
    }> = [];

    for (const { draft, rowNumber } of entries) {
      const keyBarcode = draft.barcode.trim().toLowerCase();
      const keyName = draft.name.trim().toLowerCase();
      if (handled.has(keyBarcode) || handled.has(keyName)) {
        skipped += 1;
        continue;
      }
      handled.add(keyBarcode);
      handled.add(keyName);

      const existing = byBarcode.get(keyBarcode) ?? byName.get(keyName) ?? null;

      if (existing) {
        if (mode === 'skip') {
          skipped += 1;
          continue;
        }
        planned.push({
          product: {
            ...existing,
            name: draft.name,
            category: draft.category,
            barcode: draft.barcode,
            sku: draft.sku,
            unit: draft.unit,
            unit2: draft.unit2 || undefined,
            unit2Qty: draft.unit2 ? draft.unit2Qty : undefined,
            purchasePrice: draft.purchasePrice,
            price: draft.price,
            stock: draft.stock,
            criticalStock: draft.criticalStock,
            expiryDate: draft.expiryDate || undefined,
          },
          rowNumber,
          action: 'update',
        });
        updated += 1;
      } else {
        planned.push({
          product: {
            id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: draft.name,
            category: draft.category,
            barcode: draft.barcode,
            sku: draft.sku,
            extraBarcodes: [],
            unit: draft.unit,
            unit2: draft.unit2 || undefined,
            unit2Qty: draft.unit2 ? draft.unit2Qty : undefined,
            purchasePrice: draft.purchasePrice,
            price: draft.price,
            stock: draft.stock,
            allowNegativeStock: false,
            criticalStock: draft.criticalStock,
            expiryDate: draft.expiryDate || undefined,
            imageType: 'default',
            imageUrl: '',
          },
          rowNumber,
          action: 'add',
        });
        added += 1;
      }
    }

    const failed: ImportErrorRow[] = [];
    if (onImportProducts) {
      if (planned.length > 0) {
        const result = await onImportProducts(
          planned.map((item) => ({ product: item.product, rowNumber: item.rowNumber }))
        );
        const failureById = new Map(result.failed.map((f) => [f.id, f.error]));
        for (const item of planned) {
          const reason = failureById.get(item.product.id);
          if (reason === undefined) continue;
          failed.push({
            row: item.rowNumber,
            name: item.product.name,
            detail: item.product.barcode,
            reason,
          });
          if (item.action === 'add') added -= 1;
          else updated -= 1;
        }
      }
    } else {
      for (const item of planned) {
        try { const saved = item.action === 'add' ? await onAddProduct(item.product) : await onUpdateProduct(item.product); if (saved === false) throw new Error('CATALOG_WRITE_FAILED'); } catch { failed.push({ row: item.rowNumber, name: item.product.name, detail: item.product.barcode, reason: t('pos.catalogWriteFailed') }); if (item.action === 'add') added--; else updated--; }
      }
    }

    return { added, updated, skipped, failed };
  };

  /** Birbada üýtgedilen harytlaryň hemmesini ýazýar. */
  const handleBulkSave = async (updated: Product[]) => {
    const results = await Promise.allSettled(updated.map(product => onUpdateProduct(product)));
    if (results.some(r => r.status === 'rejected' || r.value === false)) return false;
    setIsBulkOpen(false); return true;
  };

  // All unique categories from products + free input
  const allCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Filtered products
  const filtered = products.filter(p => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.extraBarcodes || []).some(b => b.includes(q));
    const matchCat = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // Open "New Product" form (ulanyjynyň "Başdaky ölçeg" bahalary deslapky gelýär)
  const handleOpenNew = () => {
    setEditingProduct(null);
    setForm(emptyForm(defaultUnit, defaultUnit2));
    setPreviewUrl('');
    setExtraBarcodeInput('');
    setIsFormOpen(true);
  };

  // Open "Edit" form
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      sku: p.sku || '',
      barcode: p.barcode || '',
      extraBarcodes: p.extraBarcodes || [],
      name: p.name,
      category: p.category || '',
      price: p.price,
      purchasePrice: p.purchasePrice ?? 0,
      wholesalePrice: p.wholesalePrice ?? 0,
      stock: p.stock,
      allowNegativeStock: Boolean(p.allowNegativeStock),
      isActive: p.isActive ?? true,
      criticalStock: p.criticalStock ?? 5,
      unit: p.unit || 'adet',
      unit2: p.unit2 ?? undefined,
      unit2Qty: p.unit2Qty ?? undefined,
      expiryDate: p.expiryDate || '',
      imageType: p.imageType,
      imageUrl: p.imageUrl || '',
    });
    setPreviewUrl(p.imageUrl || '');
    setExtraBarcodeInput('');
    setIsFormOpen(true);
  };

  // Duýduryş panelinden gelen fokus — degişli harydy redaktirlemek üçin açýar.
  useEffect(() => {
    if (!focusProductId) return;
    const product = products.find((p) => p.id === focusProductId);
    if (product) handleOpenEdit(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusProductId]);

  // Mobil yüzen + butonu — täze haryt formuny açýar.
  useEffect(() => onMobileAdd(handleOpenNew), []);

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setPreviewUrl('');
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    setImageBusy(true);
    try {
      // 400px / ~150KB'a sıkıştır (PC ile aynı) — telefon fotoğrafları DB'yi şişirmesin.
      const base64String = await compressImage(file);
      setPreviewUrl(base64String);
      setForm(f => ({ ...f, imageUrl: base64String, imageType: 'default' }));
    } catch {
      // Sıkıştırılamadıysa ürünsüz devam et, görseli atma.
    } finally {
      setImageBusy(false);
    }
  };

  const handleAddExtraBarcode = () => {
    const val = extraBarcodeInput.trim();
    if (!val) return;
    setForm(f => ({ ...f, extraBarcodes: [...(f.extraBarcodes || []), val] }));
    setExtraBarcodeInput('');
  };

  const handleRemoveExtraBarcode = (idx: number) => {
    setForm(f => ({ ...f, extraBarcodes: (f.extraBarcodes || []).filter((_, i) => i !== idx) }));
  };

  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current || !form.name.trim()) return;
    if (!form.barcode.trim()) return;

    savingRef.current = true; setSaving(true); setSaveError('');
    try {
      const saved = editingProduct
        ? await onUpdateProduct({ ...editingProduct, ...form })
        : await onAddProduct({ id: `prod_${crypto.randomUUID()}`, ...form });
      if (saved === false) { setSaveError(t('pos.catalogWriteFailed')); return; }
      handleCloseForm();
    } catch { setSaveError(t('pos.catalogWriteFailed')); }
    finally { savingRef.current = false; setSaving(false); }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden">
      <PageScroll>
      {saveError && !isFormOpen && <div role="alert" className="p-3 text-rose-700">{saveError}</div>}
      {/* ── Üst: Arama + Kategori + Yeni Düğmesi ─────────────────────── */}
      <div className="px-3 md:px-6 pt-3 md:pt-5 pb-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-wrap items-center gap-2 md:gap-3">
          {/* Arama */}
          <div className="relative w-full sm:w-[300px] flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              id="bh-product-search"
              placeholder={t('products.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-10 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          {/* Birbada Uýtgetmek */}
          <button
            type="button"
            onClick={() => setIsBulkOpen(true)}
            className="h-10 px-3 bg-white border border-gray-200 hover:border-violet-400 hover:bg-violet-50/60 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors flex-shrink-0"
            title={t('products.bulkEditTitle')}
          >
            <ListChecks className="w-4 h-4 text-violet-600" />
            {t('products.bulkEdit')}
          </button>

          {/* Excel-den getir / Excel-e çykar */}
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="h-10 px-3 bg-white border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/60 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors flex-shrink-0"
            title={t('products.importExcelTitle')}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            {t('products.importExcel')}
          </button>
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="h-10 px-3 bg-white border border-gray-200 hover:border-sky-400 hover:bg-sky-50/60 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors flex-shrink-0"
            title={t('products.exportExcelTitle')}
          >
            <Download className="w-4 h-4 text-sky-600" />
            {t('products.exportExcel')}
          </button>

          {/* Kategori filtresi */}
          <div className="relative flex-shrink-0">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="appearance-none h-10 pl-3 pr-8 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">{t('products.allCategoriesOption')}</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Yeni Ürün */}
          <button
            type="button"
            onClick={handleOpenNew}
            className="h-10 px-5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('products.newProduct')}
          </button>
        </div>
      </div>

      {/* ── Tablo ────────────────────────────────────────────────────── */}
      <div className="px-3 md:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tablo başlık */}
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 select-none">
                <th className="py-3 px-4">{t('products.colNameCategory')}</th>
                <th className="py-3 px-4">{t('products.colBarcode')}</th>
                <th className="py-3 px-4 text-right">{t('products.colPurchaseSale')}</th>
                <th className="py-3 px-4 text-right">{t('products.colStock')}</th>
                <th className="py-3 px-4 text-center">{t('products.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-10 h-10 text-gray-200" />
                      <span className="font-semibold text-gray-400 text-xs">
                        {t('products.notFound')}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors group">
                  {/* Ürün Adı / Kategori — tıklanınca düzenleme modalı açılır */}
                  <td
                    className="py-3 px-4 cursor-pointer"
                    onClick={() => handleOpenEdit(p)}
                    title={t('products.clickToEdit')}
                  >
                    <div className="flex items-center gap-3 group/row">
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                          />
                        ) : (
                          <ProductImage type={p.imageType} className="w-10 h-10" />
                        )}
                      </div>
<div>
                          <div className="font-bold text-gray-900 text-sm leading-tight group-hover/row:text-emerald-700 transition-colors flex items-center gap-1.5">
                            {p.name}
                            {composedIds.has(p.id) && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-bold"
                                title={t('products.composedTooltip')}
                              >
                                <GitBranch className="w-2.5 h-2.5" />
                                {t('products.composedBadge')}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">{p.category || '—'}</div>
                        </div>
                    </div>
                  </td>

                  {/* Barkod */}
                  <td className="py-3 px-4 font-mono text-xs text-gray-600">
                    {p.barcode}
                    {(p.extraBarcodes || []).length > 0 && (
                      <span className="ml-1.5 text-[10px] text-gray-400">+{p.extraBarcodes!.length}</span>
                    )}
                  </td>

                  {/* Alış / Satış */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="text-gray-400 font-mono text-xs mr-1">
                      {(p.purchasePrice ?? 0).toFixed(2)}
                    </span>
                    <span className="text-gray-300 mx-0.5">/</span>
                    <span className="font-mono font-bold text-emerald-600 text-xs">
                      {p.price.toFixed(2)}
                    </span>
                    <CurrencyLabel className="text-[9px] text-emerald-600/70 ml-1" />
                  </td>

                  {/* Stok */}
                  <td className="py-3 px-4 text-right">
                    <span className={`font-mono font-bold text-sm ${
                      p.stock < 0
                        ? 'text-rose-600'
                        : p.criticalStock && p.stock <= p.criticalStock
                        ? 'text-rose-600'
                        : 'text-gray-900'
                    }`}>
                      {p.stock}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-1 font-medium">
                      {unitLabel(units, p.unit || 'adet', language)}
                    </span>
                    {p.allowNegativeStock && (
                      <span title={t('products.negativeStockAllowed')}>
                        <MinusCircle className="inline w-3.5 h-3.5 text-amber-500 ml-1 -mt-0.5" />
                      </span>
                    )}
                    {p.criticalStock && p.stock <= p.criticalStock && (
                      <AlertTriangle className="inline w-3.5 h-3.5 text-rose-500 ml-1 -mt-0.5" />
                    )}
                  </td>

                  {/* İşlemler */}
                  <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
<button
                        type="button"
                        onClick={() => setCompositionProduct(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${
                          composedIds.has(p.id)
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-gray-100 hover:bg-emerald-500 hover:text-white text-gray-500'
                        }`}
                        title={
                          composedIds.has(p.id)
                            ? t('products.compositionEditTooltip')
                            : t('products.compositionAddTooltip')
                        }
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        {composedIds.has(p.id) && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white ring-1 ring-emerald-600" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-[#0B1F3A] hover:text-white text-gray-500 transition-colors"
                        title={t('products.editAction')}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(p.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500 transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </PageScroll>

      {/* ── Silme Onayı ─────────────────────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 text-rose-500" />
            </div>
            <p className="font-bold text-gray-800 text-sm">
              {t('products.deleteConfirm')}
            </p>
            {saveError && <div role="alert" className="text-rose-700">{saveError}</div>}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
              >
                {t('products.noBtn')}
              </button>
              <button
                onClick={async () => { if (savingRef.current) return; savingRef.current=true; setSaving(true); try { if (await onDeleteProduct(deleteConfirmId) !== false) setDeleteConfirmId(null); else setSaveError(t('pos.catalogWriteFailed')); } catch { setSaveError(t('pos.catalogWriteFailed')); } finally { savingRef.current=false; setSaving(false); } }}
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Haryt düzümi (kompozisiýa) ─────────────────────────────── */}
      {compositionProduct && storeDb && (
        <CompositionModal
          language={language}
          storeDb={storeDb}
          mainProduct={compositionProduct}
          products={products}
          units={units}
          onClose={() => setCompositionProduct(null)}
          onUpdatePrice={async (productId, newPrice) => {
            const product = products.find((p) => p.id === productId);
            if (!product || await onUpdateProduct({ ...product, price: newPrice }) === false) return false;
            setCompositionProduct((prev) => (prev ? { ...prev, price: newPrice } : prev));
            return true;
          }}
        />
      )}

      {/* ── Ürün Ekleme / Düzenleme Modal ───────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Modal Başlık */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
              <span className="font-bold text-sm tracking-wide">
                {editingProduct ? t('products.editTitle') : t('products.addTitle')}
              </span>
              <button
                type="button"
                onClick={handleCloseForm}
                disabled={saving}
                className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveError && <div role="alert" className="px-5 py-2 text-rose-700">{saveError}</div>}
            {/* Form */}
            <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-5 space-y-4">

              {/* Üst satır: Görsel + Ad + Kategori */}
              <div className="flex gap-4">
                {/* Görsel Yükleme */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-[88px] h-[88px] rounded-2xl border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50 overflow-hidden transition-all group"
                    title={t('products.imageChangeTitle')}
                  >
                    {/* Mevcut görsel — previewUrl (yeni yüklenen) ya da SVG ikon */}
                    {previewUrl ? (
                      <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-1">
                        <ProductImage type={form.imageType} className="w-16 h-16" />
                      </div>
                    )}

                    {/* Hover overlay: kamera ikonu */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      {imageBusy ? (
                        <span className="text-[9px] text-white font-bold leading-tight text-center drop-shadow">
                          {t('products.compressing')}
                        </span>
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-white drop-shadow" />
                          <span className="text-[9px] text-white font-bold leading-tight text-center drop-shadow">
                            {t('products.changeBtn')}
                          </span>
                        </>
                      )}
                    </div>
                    {imageBusy && (
                      <div className="absolute inset-0 bg-white/60" />
                    )}
                  </button>
                  <span className="text-[10px] text-gray-400">{t('products.imageOptional')}</span>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>

                {/* Ad + Kategori */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                      {t('products.nameLabel')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t('products.namePlaceholder')}
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                      {t('products.categoryLabel')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('products.categoryPlaceholder')}
                      list="category-list"
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                    <datalist id="category-list">
                      {allCategories.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Barkod + Birim + Satış Fiyatı */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    {t('products.barcodeLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="8690000000000"
                    value={form.barcode}
                    onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                    className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm font-mono bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    {t('products.unit1Label')}
                  </label>
                  <UnitSelect
                    language={language}
                    units={units}
                    value={form.unit || 'adet'}
                    className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition font-bold cursor-pointer"
                    onSelect={(code) => setForm((f) => ({ ...f, unit: code }))}
                    onCreate={onCreateUnit}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    {t('products.priceLabel')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full h-9 px-3 border border-emerald-400 rounded-xl text-sm font-bold text-emerald-700 bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              {/* ── Ölçeg Birligi 2 (toggle + conditional block) ── */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    unit2: f.unit2 ? undefined : 'karopka',
                    unit2Qty: f.unit2 ? undefined : 1,
                  }))}
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    form.unit2
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  <span className="text-[13px] leading-none">{form.unit2 ? '✓' : '+'}</span>
                  {t('products.unit2Enable')}
                </button>

                {form.unit2 && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl animate-in fade-in duration-150">
                    {/* Birim 2 seçici */}
                    <div>
                      <label className="block text-[11px] font-bold text-blue-600 mb-1">
                        {t('products.unit2Label')}
                      </label>
                      <UnitSelect
                        language={language}
                        units={units}
                        value={form.unit2 || 'karopka'}
                        className="w-full h-9 px-3 border border-blue-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-bold text-blue-800 cursor-pointer"
                        onSelect={(code) => setForm((f) => ({ ...f, unit2: code }))}
                        onCreate={onCreateUnit}
                      />
                    </div>

                    {/* Kaç adet içeriyor */}
                    <div>
                      <label className="block text-[11px] font-bold text-blue-600 mb-1">
                        {t('products.unit2QtyLabel', {
                          unit2: unitLabel(units, form.unit2, language),
                          unit1: unitLabel(units, form.unit || 'adet', language),
                        })}
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={form.unit2Qty ?? 1}
                        onChange={e => setForm(f => ({ ...f, unit2Qty: parseInt(e.target.value) || 1 }))}
                        className="w-full h-9 px-3 border border-blue-300 rounded-xl text-sm font-bold text-blue-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                      <p className="text-[10px] text-blue-500 mt-1">
                        {(() => {
                          const u1 = unitLabel(units, form.unit || 'adet', language);
                          const u2 = unitLabel(units, form.unit2, language);
                          const qty = form.unit2Qty ?? 1;
                          return t('products.unit2Example', { unit2: u2, qty, unit1: u1 });
                        })()}
                      </p>
                    </div>
                  </div>
                )}
              </div>


              {/* Alış + Toptan + Stok */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    {t('products.purchasePriceLabel')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.purchasePrice ?? 0}
                    onChange={e => setForm(f => ({ ...f, purchasePrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    {t('products.wholesalePriceLabel')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.wholesalePrice ?? 0}
                    onChange={e => setForm(f => ({ ...f, wholesalePrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-500">
                      {t('products.stockLabel')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, allowNegativeStock: !f.allowNegativeStock }))}
                      className={`flex items-center gap-1 h-6 px-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                        form.allowNegativeStock
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white text-gray-400 border-gray-200 hover:border-amber-400 hover:text-amber-600'
                      }`}
                      title={t('products.negativeStockTooltip')}
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span>{t('products.negativeAllowedShort')}</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    min={form.allowNegativeStock ? undefined : 0}
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value, 10) || 0 }))}
                    className={`w-full h-9 px-3 border rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition ${
                      form.allowNegativeStock ? 'border-amber-400 text-amber-800 font-bold' : 'border-gray-200'
                    }`}
                  />
                </div>
              </div>

              {/* Aktiw / Passiw haryt */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isActive: !(f.isActive ?? true) }))}
                  className={`flex items-center gap-1.5 h-7 px-3 rounded-lg border text-[10px] font-bold transition-all ${
                    (form.isActive ?? true)
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                      : 'bg-white text-gray-400 border-gray-200 hover:border-rose-400 hover:text-rose-600'
                  }`}
                  title={t('products.inactiveTooltip')}
                >
                  <span>{(form.isActive ?? true) ? t('products.activeBtn') : t('products.inactiveBtn')}</span>
                </button>
                <span className="text-[10px] text-gray-400">
                  {t('products.inactiveNote')}
                </span>
                {/* Haryt düzümi — diňe ýatda saklanan harytda (täzede ID ýok) */}
                {editingProduct && storeDb && (
                  <button
                    type="button"
                    onClick={() => setCompositionProduct(editingProduct)}
                    className={`ml-auto flex items-center gap-1.5 h-7 px-3 rounded-lg border text-[10px] font-bold transition-all ${
                      composedIds.has(editingProduct.id)
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
                    }`}
                    title={t('products.compositionOpenTooltip')}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    {t('products.compositionBtn')}
                  </button>
                )}
              </div>

              {/* Kritik Stok + SKT */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    {t('products.criticalStockLabel')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.criticalStock ?? 5}
                    onChange={e => setForm(f => ({ ...f, criticalStock: parseInt(e.target.value) || 0 }))}
                    className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    {t('products.expiryLabel')}
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate || ''}
                    onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                    className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              {/* Ek Barkodlar */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  {t('products.extraBarcodesLabel')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('products.extraBarcodePlaceholder')}
                    value={extraBarcodeInput}
                    onChange={e => setExtraBarcodeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddExtraBarcode(); } }}
                    className="flex-1 h-9 px-3 border border-gray-200 rounded-xl text-sm font-mono bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={handleAddExtraBarcode}
                    className="h-9 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors whitespace-nowrap"
                  >
                    + {t('products.addShort')}
                  </button>
                </div>
                {(form.extraBarcodes || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(form.extraBarcodes || []).map((bc, i) => (
                      <span key={i} className="flex items-center gap-1 bg-gray-100 text-gray-700 font-mono text-[11px] px-2 py-0.5 rounded-lg">
                        {bc}
                        <button type="button" onClick={() => handleRemoveExtraBarcode(i)} className="text-gray-400 hover:text-rose-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </form>

            {/* Düğmeler */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleCloseForm}
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors"
              >
                {t('products.cancelBtn')}
              </button>
              <button
                type="submit"
                form=""
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs transition-colors shadow-sm"
              >
                {t('products.saveBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isImportOpen && (
        <ProductExcelImportModal
          language={language}
          products={products}
          units={units}
          accountName={accountName}
          onClose={() => setIsImportOpen(false)}
          onImport={handleExcelImport}
        />
      )}

      {isBulkOpen && (
        <ProductBulkEditModal
          products={products}
          language={language}
          onClose={() => setIsBulkOpen(false)}
          onSave={handleBulkSave}
        />
      )}

      {isExportOpen && (
        <ProductExcelExportModal
          language={language}
          products={products}
          units={units}
          accountName={accountName}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
};
