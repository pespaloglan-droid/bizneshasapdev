import React from 'react';
import { LanguageCode, ModuleName, ModulePermission, PermissionsMap } from '../../types';
import { ALL_MODULES, MODULE_LABELS } from '../../db/userService';

const ACTIONS: (keyof ModulePermission)[] = ['view', 'create', 'edit', 'delete', 'report'];

const ACTION_LABEL: Record<keyof ModulePermission, { tm: string; tr: string }> = {
  view: { tm: 'Görkez', tr: 'Görüntüle' },
  create: { tm: 'Goş', tr: 'Ekle' },
  edit: { tm: 'Üýtget', tr: 'Düzenle' },
  delete: { tm: 'Poz', tr: 'Sil' },
  report: { tm: 'Hasabat', tr: 'Rapor' },
};

interface PermissionMatrixProps {
  language: LanguageCode;
  permissions: PermissionsMap;
  onChange: (moduleName: ModuleName, action: keyof ModulePermission, value: boolean) => void;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  language,
  permissions,
  onChange,
}) => {
  const isTm = language === 'tm';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
            <th className="py-2 px-3">{isTm ? 'Modul' : 'Modül'}</th>
            {ACTIONS.map((action) => (
              <th key={action} className="py-2 px-2 text-center">
                {isTm ? ACTION_LABEL[action].tm : ACTION_LABEL[action].tr}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {ALL_MODULES.map((moduleName) => (
            <tr key={moduleName} className="hover:bg-gray-50/60">
              <td className="py-1.5 px-3 font-semibold text-gray-700">{MODULE_LABELS[moduleName]}</td>
              {ACTIONS.map((action) => {
                const canView = permissions[moduleName].view;
                // GÖRKEZ kapalıysa diğer kutular devre dışı (mantıksal tutarlılık).
                const disabled = action !== 'view' && !canView;
                return (
                  <td key={action} className="py-1.5 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={permissions[moduleName][action]}
                      disabled={disabled}
                      onChange={(e) => {
                        // GÖRKEZ kapalıyken yanlışlıkla işaretlenemez.
                        if (disabled && e.target.checked) return;
                        onChange(moduleName, action, e.target.checked);
                        // GÖRKEZ açılırsa o satırın diğerleri kapalı kalır (elle açılır).
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
