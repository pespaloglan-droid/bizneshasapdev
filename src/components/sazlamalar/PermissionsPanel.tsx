import React, { useMemo, useState } from 'react';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import type { LanguageCode, RoleTemplates } from '../../types';
import { emptyPermissions } from '../../db/settingsService';
import { MODULE_LABELS } from '../../db/userService';
import { PermissionMatrix } from '../users/PermissionMatrix';
import { Notice, SaveBar, SettingsCard, Toggle } from './settingsUi';
import { useT } from '../../locales/LanguageContext';

interface PermissionsPanelProps {
  templates: RoleTemplates;
  auditLogEnabled: boolean;
  language: LanguageCode;
  dirty: boolean;
  onChangeTemplates: (next: RoleTemplates) => void;
  onChangeAudit: (value: boolean) => void;
  onSave: () => void;
  onReset: () => void;
}

const PROTECTED_ROLES = ['Administrator', 'Kassir', 'Persenal', 'Ýörite'];

export const PermissionsPanel: React.FC<PermissionsPanelProps> = ({
  templates,
  auditLogEnabled,
  language,
  dirty,
  onChangeTemplates,
  onChangeAudit,
  onSave,
  onReset,
}) => {
  const t = useT();
  const roleNames = useMemo(() => Object.keys(templates).sort((a, b) => a.localeCompare(b, 'tr')), [
    templates,
  ]);
  const [activeRole, setActiveRole] = useState(roleNames[0] ?? '');
  const [newRole, setNewRole] = useState('');
  const [error, setError] = useState('');

  const current = roleNames.includes(activeRole) ? activeRole : roleNames[0] ?? '';

  const handlePermissionChange = (
    moduleName: keyof RoleTemplates[string],
    action: keyof RoleTemplates[string][keyof RoleTemplates[string]],
    value: boolean
  ) => {
    const roleTemplate = templates[current];
    if (!roleTemplate) return;
    onChangeTemplates({
      ...templates,
      [current]: {
        ...roleTemplate,
        [moduleName]: { ...roleTemplate[moduleName], [action]: value },
      },
    });
  };

  const handleAddRole = () => {
    const name = newRole.trim();
    if (!name) return;
    if (templates[name]) {
      setError(t('sazlamalar.permRoleExists'));
      return;
    }
    onChangeTemplates({ ...templates, [name]: emptyPermissions() });
    setActiveRole(name);
    setNewRole('');
    setError('');
  };

  const handleDeleteRole = (role: string) => {
    if (PROTECTED_ROLES.includes(role)) {
      setError(t('sazlamalar.permProtectedDelete'));
      return;
    }
    const next: RoleTemplates = { ...templates };
    delete next[role];
    onChangeTemplates(next);
    setActiveRole(Object.keys(next)[0] ?? '');
    setError('');
  };

  return (
    <div className="space-y-3">
      <SettingsCard
        title={t('sazlamalar.permRolesTitle')}
        description={t('sazlamalar.permRolesDesc')}
      >
        <div className="flex flex-wrap items-center gap-2">
          {roleNames.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setActiveRole(role)}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
                current === role
                  ? 'bg-[#10b981] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddRole();
            }}
            placeholder={t('sazlamalar.permNewRolePh')}
            className="flex-1 h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button
            type="button"
            onClick={handleAddRole}
            disabled={!newRole.trim()}
            className="h-9 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#163864] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('sazlamalar.permAddRole')}
          </button>
          {current && !PROTECTED_ROLES.includes(current) && (
            <button
              type="button"
              onClick={() => handleDeleteRole(current)}
              className="h-9 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('sazlamalar.permDelete')}
            </button>
          )}
        </div>

        {error && <Notice tone="error" text={error} />}

        {current && templates[current] && (
          <div>
            <div className="text-[11px] font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {t('sazlamalar.permRolePerms', { role: current })}
            </div>
            <PermissionMatrix
              language={language}
              permissions={templates[current]}
              onChange={handlePermissionChange}
            />
            <div className="text-[10px] text-gray-400 font-medium mt-1.5">
              {t('sazlamalar.permModulesNote', { count: Object.keys(MODULE_LABELS).length })}
            </div>
          </div>
        )}
      </SettingsCard>

      <SettingsCard title={t('sazlamalar.permAuditTitle')} description={t('sazlamalar.permAuditDesc')}>
        <Toggle
          checked={auditLogEnabled}
          onChange={onChangeAudit}
          label={t('sazlamalar.permAuditLabel')}
          description={t('sazlamalar.permAuditLabelDesc')}
        />
      </SettingsCard>

      <SaveBar dirty={dirty} onSave={onSave} onReset={onReset} />
    </div>
  );
};