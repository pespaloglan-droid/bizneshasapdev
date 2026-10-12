import React, { useEffect, useState } from 'react';
import { MapPin, Trophy, Users } from 'lucide-react';
import type {
  AppUser,
  InvoiceRecord,
  LanguageCode,
  Targow,
  TargowRegion,
} from '../../types';
import { countOrdersForTargow } from '../../db/targowService';
import { TargowDashboard } from './TargowDashboard';
import { TargowList, type TargowStatusFilter } from './TargowList';
import { TargowDetail } from './TargowDetail';
import { TargowFormModal } from './TargowFormModal';
import { TargowDeleteDialog } from './TargowDeleteDialog';
import { RegionManager } from './RegionManager';
import { Leaderboard } from './Leaderboard';
import { onMobileAdd } from '../../utils/mobileEvents';
import { PageScroll } from '../common/PageScroll';
import { useT } from '../../locales/LanguageContext';

type TargowTab = 'targows' | 'regions' | 'rating';

interface TargowWorkspaceProps {
  targows: readonly Targow[];
  regions: readonly TargowRegion[];
  invoices: readonly InvoiceRecord[];
  appUsers: readonly AppUser[];
  language: LanguageCode;
  onSaveTargow: (targow: Targow) => void;
  onDeleteTargow: (targow: Targow) => void;
  onSaveRegion: (region: TargowRegion) => void;
  onDeleteRegion: (region: TargowRegion) => void;
}

export const TargowWorkspace: React.FC<TargowWorkspaceProps> = ({
  targows,
  regions,
  invoices,
  appUsers,
  language,
  onSaveTargow,
  onDeleteTargow,
  onSaveRegion,
  onDeleteRegion,
}) => {
  const [tab, setTab] = useState<TargowTab>('targows');
  const t = useT();
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<TargowStatusFilter>('all');
  const [selectedTargowId, setSelectedTargowId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTargow, setEditingTargow] = useState<Targow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Targow | null>(null);

  const selectedTargow = targows.find((item) => item.id === selectedTargowId) ?? null;

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTargow(null);
  };

  // Mobil yüzen + butonu — täze targowçy formuny açýar.
  useEffect(() => onMobileAdd(() => {
    setTab('targows');
    setEditingTargow(null);
    setIsFormOpen(true);
  }), []);

  const handleDeleteRegion = (region: TargowRegion) => {
    onDeleteRegion(region);
    for (const targow of targows) {
      if (targow.regionIds.includes(region.id)) {
        onSaveTargow({
          ...targow,
          regionIds: targow.regionIds.filter((id) => id !== region.id),
        });
      }
    }
  };

  if (selectedTargow) {
    return (
      <TargowDetail
        targow={selectedTargow}
        regions={regions}
        invoices={invoices}
        language={language}
        onBack={() => setSelectedTargowId(null)}
      />
    );
  }

  const tabs: { id: TargowTab; label: string; icon: React.ReactNode }[] = [
    { id: 'targows', label: t('targowy.targows'), icon: <Users className="w-4 h-4" /> },
    { id: 'regions', label: t('targowy.tabRegions'), icon: <MapPin className="w-4 h-4" /> },
    { id: 'rating', label: t('targowy.tabRating'), icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden min-h-0">
      <PageScroll>
      <div className="px-3 md:px-6 pt-3 md:pt-5 pb-3 space-y-3">
        <TargowDashboard targows={targows} invoices={invoices} language={language} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex items-center gap-1 overflow-x-auto">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                tab === item.id
                  ? 'bg-[#10b981] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'targows' && (
        <TargowList
          targows={targows}
          regions={regions}
          invoices={invoices}
          language={language}
          regionFilter={regionFilter}
          statusFilter={statusFilter}
          onRegionFilterChange={setRegionFilter}
          onStatusFilterChange={setStatusFilter}
          onAdd={() => {
            setEditingTargow(null);
            setIsFormOpen(true);
          }}
          onView={(targow) => setSelectedTargowId(targow.id)}
          onEdit={(targow) => {
            setEditingTargow(targow);
            setIsFormOpen(true);
          }}
          onDelete={(targow) => setDeleteTarget(targow)}
        />
      )}

      {tab === 'regions' && (
        <RegionManager
          regions={regions}
          targows={targows}
          invoices={invoices}
          language={language}
          onSaveRegion={onSaveRegion}
          onDeleteRegion={handleDeleteRegion}
        />
      )}

      {tab === 'rating' && (
        <Leaderboard targows={targows} invoices={invoices} language={language} />
      )}
      </PageScroll>

      {isFormOpen && (
        <TargowFormModal
          language={language}
          targows={targows}
          regions={regions}
          appUsers={appUsers}
          editingTargow={editingTargow}
          onSave={(targow) => {
            onSaveTargow(targow);
            closeForm();
          }}
          onClose={closeForm}
        />
      )}

      {deleteTarget && (
        <TargowDeleteDialog
          targow={deleteTarget}
          language={language}
          orderCount={countOrdersForTargow(invoices, deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          onConfirmDelete={() => {
            onDeleteTargow(deleteTarget);
            setDeleteTarget(null);
          }}
          onDeactivate={() => {
            onSaveTargow({ ...deleteTarget, isActive: false });
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
};
