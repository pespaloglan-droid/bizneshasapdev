import React from 'react';
import type { LanguageCode } from '../../types';
import { SHORTCUTS, SHORTCUT_CATEGORY_ORDER } from '../../utils/shortcuts';

/**
 * Klawiatura gysgaltmalarynyň sanawy — kategoriýalar boýunça.
 * Ähli kısayol panelleri (lumpa ikonasy, kömek) şu bir zereg ýeterlik ulanýar,
 * şonuň üçin sanaw hiç haçan iki ýerde ýazylmaýar.
 */
export const ShortcutGroups: React.FC<{ language: LanguageCode }> = ({ language }) => {
  const isTm = language === 'tm';

  const groups = SHORTCUT_CATEGORY_ORDER.map((categoryTm) => ({
    titleTm: categoryTm,
    titleTr: SHORTCUTS.find((s) => s.categoryTm === categoryTm)?.categoryTr ?? categoryTm,
    items: SHORTCUTS.filter((s) => s.categoryTm === categoryTm),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.titleTm}>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-1 mb-1.5">
            {isTm ? group.titleTm : group.titleTr}
          </div>
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {group.items.map((item, index) => (
              <div
                key={item.key}
                className={`flex items-center gap-3 px-3 py-2 ${index > 0 ? 'border-t border-gray-50' : ''} hover:bg-emerald-50/40 transition-colors`}
              >
                <span className="min-w-[44px] h-7 px-2 rounded-lg bg-[#0B1F3A] text-white text-[11px] font-black font-mono flex items-center justify-center flex-shrink-0">
                  {item.key}
                </span>
                <span className="text-xs font-semibold text-gray-700">
                  {isTm ? item.labelTm : item.labelTr}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
