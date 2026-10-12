import React, { useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Warehouse as WarehouseIcon,
  X,
  MapPin,
  Phone,
  Star,
  Package,
} from 'lucide-react';
import { LanguageCode, Warehouse, Product } from '../../types';
import { PageScroll } from '../common/PageScroll';
import { useT } from '../../locales/LanguageContext';

interface WarehouseWorkspaceProps {
  warehouses: Warehouse[];
  products: Product[];
  language: LanguageCode;
  onAddWarehouse: (warehouse: Warehouse) => void;
  onUpdateWarehouse: (warehouse: Warehouse) => void;
  onDeleteWarehouse: (id: string) => void;
}

const emptyForm = () => ({
  name: '',
  code: '',
  address: '',
  phone: '',
  note: '',
  isDefault: false,
  isActive: true,
});

export const WarehouseWorkspace: React.FC<WarehouseWorkspaceProps> = ({
  warehouses,
  products,
  language,
  onAddWarehouse,
  onUpdateWarehouse,
  onDeleteWarehouse,
}) => {
  const t = useT();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedWarehouseForDetail, setSelectedWarehouseForDetail] = useState<Warehouse | null>(null);

  // Ambar başına ürün sayısını hesapla
  const getWarehouseItemCount = (warehouseId: string) => {
    return products.filter(p => p.warehouseId === warehouseId).length;
  };

  // Ambarın içindeki ürünleri getir
  const getWarehouseProducts = (warehouseId: string) => {
    return products.filter(p => p.warehouseId === warehouseId);
  };

  const filtered = warehouses.filter((w) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      w.name.toLowerCase().includes(q) ||
      (w.code || '').toLowerCase().includes(q) ||
      (w.address || '').toLowerCase().includes(q) ||
      (w.phone || '').toLowerCase().includes(q)
    );
  });

  const handleOpenNew = () => {
    setEditingWarehouse(null);
    setForm({ ...emptyForm(), isDefault: warehouses.length === 0 });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setForm({
      name: w.name,
      code: w.code || '',
      address: w.address || '',
      phone: w.phone || '',
      note: w.note || '',
      isDefault: Boolean(w.isDefault),
      isActive: w.isActive !== false,
    });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (w: Warehouse) => {
    setSelectedWarehouseForDetail(w);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingWarehouse(null);
    setForm(emptyForm());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingWarehouse) {
      onUpdateWarehouse({
        ...editingWarehouse,
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        note: form.note.trim() || undefined,
        isDefault: form.isDefault,
        isActive: form.isActive,
      });
    } else {
      onAddWarehouse({
        id: `wh-${Date.now()}`,
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        note: form.note.trim() || undefined,
        isDefault: form.isDefault || warehouses.length === 0,
        isActive: form.isActive,
        createdAt: new Date().toISOString(),
      });
    }
    handleCloseForm();
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden">
      <PageScroll>
      <div className="px-3 md:px-6 pt-3 md:pt-5 pb-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t('warehouses.searchPh')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-10 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          <button
            type="button"
            onClick={handleOpenNew}
            className="h-10 px-5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('warehouses.newWarehouse')}
          </button>
        </div>
      </div>

      <div className="px-3 md:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 select-none">
                <th className="py-3 px-4">{t('warehouses.colWarehouse')}</th>
                <th className="py-3 px-4">{t('warehouses.colCode')}</th>
                <th className="py-3 px-4">{t('warehouses.colAddressTel')}</th>
                <th className="py-3 px-4 text-center">{t('warehouses.colStatus')}</th>
                <th className="py-3 px-4 text-center">{t('warehouses.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <WarehouseIcon className="w-10 h-10 text-gray-200" />
                      <span className="font-semibold text-gray-400 text-xs">
                        {warehouses.length === 0
                          ? t('warehouses.emptyNone')
                          : t('warehouses.emptyNotFound')}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50/60 transition-colors group">
                    <td
                      className="py-3 px-4 cursor-pointer"
                      onClick={() => handleOpenDetail(w)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                          <WarehouseIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm leading-tight group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                            {w.name}
                            {w.isDefault && (
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {w.note && (
                              <div className="text-[11px] text-gray-400 line-clamp-1">{w.note}</div>
                            )}
                            <div className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {getWarehouseItemCount(w.id)} {t('warehouses.itemsUnit')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{w.code || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {w.address && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span>{w.address}</span>
                        </div>
                      )}
                      {w.phone && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span>{w.phone}</span>
                        </div>
                      )}
                      {!w.address && !w.phone && <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            w.isActive === false
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {w.isActive === false
                            ? t('warehouses.inactive')
                            : t('warehouses.active')}
                        </span>
                        {w.isDefault && (
                          <span className="text-[10px] font-bold text-amber-600">
                            {t('warehouses.defaultBadge')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(w)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-[#0B1F3A] hover:text-white text-gray-500 transition-colors"
                          title={t('warehouses.editTitle')}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(w.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500 transition-colors"
                          title={t('delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </PageScroll>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 text-rose-500" />
            </div>
            <p className="font-bold text-gray-800 text-sm">
              {t('warehouses.deleteConfirm')}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
              >
                {t('warehouses.cancelNo')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteWarehouse(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-6 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
              <span className="font-bold text-sm tracking-wide">
                {editingWarehouse
                  ? t('warehouses.formEditTitle')
                  : t('warehouses.newWarehouse')}
              </span>
              <button
                type="button"
                onClick={handleCloseForm}
                className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  {t('warehouses.formName')} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                  className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    {t('warehouses.colCode')}
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="AMB-1"
                    className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    {t('warehouses.formPhone')}
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  {t('warehouses.formAddress')}
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                  {t('warehouses.formNote')}
                </label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isDefault: !f.isDefault }))}
                  className={`flex items-center gap-1.5 h-8 px-3 rounded-xl border text-[11px] font-bold transition-all ${
                    form.isDefault
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-amber-400'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${form.isDefault ? 'fill-white' : ''}`} />
                  {t('warehouses.defaultWarehouse')}
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`flex items-center gap-1.5 h-8 px-3 rounded-xl border text-[11px] font-bold transition-all ${
                    form.isActive
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {form.isActive
                    ? t('warehouses.active')
                    : t('warehouses.inactive')}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ambar Detay Modalı - İçindeki Ürünleri Gösterir */}
      {selectedWarehouseForDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <WarehouseIcon className="w-5 h-5" />
                <span className="font-bold text-sm tracking-wide">
                  {selectedWarehouseForDetail.name} - {t('warehouses.itemsInside')}
                </span>
                <span className="text-xs bg-emerald-500 px-2 py-0.5 rounded-full">
                  {getWarehouseItemCount(selectedWarehouseForDetail.id)} {t('warehouses.itemsUnit')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWarehouseForDetail(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 select-none">
                    <th className="py-3 px-4">{t('warehouses.colProductName')}</th>
                    <th className="py-3 px-4">{t('warehouses.colBarcode')}</th>
                    <th className="py-3 px-4 text-right">{t('warehouses.colQty')}</th>
                    <th className="py-3 px-4 text-right">{t('warehouses.colUnit')}</th>
                    <th className="py-3 px-4 text-right">{t('warehouses.colPrice')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getWarehouseProducts(selectedWarehouseForDetail.id).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="w-10 h-10 text-gray-200" />
                          <span className="font-semibold text-gray-400 text-xs">
                            {t('warehouses.emptyWarehouse')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    getWarehouseProducts(selectedWarehouseForDetail.id).map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-gray-900">{p.name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-600">{p.barcode}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">{p.stock}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{p.unit || 'adet'}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{p.price.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedWarehouseForDetail(null)}
                className="h-9 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#163864] text-white font-bold text-xs"
              >
                {t('warehouses.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
