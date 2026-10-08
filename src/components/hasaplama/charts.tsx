import React from 'react';
import { Loader2, Printer, Sheet } from 'lucide-react';
import { writeExcelFile } from '../../utils/excelIO';
import { saveFileAs } from '../../utils/electron';

interface FlowTrendChartProps {
  points: readonly { label: string; income: number; expense: number }[];
}

export const FlowTrendChart: React.FC<FlowTrendChartProps> = ({ points }) => {
  const peak = Math.max(1, ...points.flatMap((point) => [point.income, point.expense]));

  if (points.length === 0) {
    return <EmptyState text="Döwür üçin maglumat ýok" />;
  }

  return (
    <div>
      <div className="flex items-end gap-1">
        {points.map((point) => (
          <div key={point.label} className="flex-1 min-w-0 flex flex-col items-center gap-1">
            <div className="w-full h-36 flex items-end justify-center gap-0.5">
              <div
                className="flex-1 bg-emerald-500 rounded-t transition-all"
                style={{ height: `${Math.max(2, (point.income / peak) * 100)}%` }}
                title={`Girdeji: ${point.income.toFixed(2)}`}
              />
              <div
                className="flex-1 bg-rose-500 rounded-t transition-all"
                style={{ height: `${Math.max(2, (point.expense / peak) * 100)}%` }}
                title={`Çykdajy: ${point.expense.toFixed(2)}`}
              />
            </div>
            <span className="text-[8px] text-gray-400 font-semibold truncate w-full text-center">
              {point.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Girdeji
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Çykdajy
        </span>
      </div>
    </div>
  );
};

interface DonutChartProps {
  slices: readonly { label: string; total: number; color: string }[];
}

export const DonutChart: React.FC<DonutChartProps> = ({ slices }) => {
  const total = slices.reduce((sum, slice) => sum + slice.total, 0);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;

  const arcs = slices.map((slice) => {
    const fraction = total > 0 ? slice.total / total : 0;
    const arc = { ...slice, dash: fraction * circumference, offset: cursor };
    cursor += fraction * circumference;
    return arc;
  });

  if (total === 0) {
    return <EmptyState text="Döwür üçin maglumat ýok" />;
  }

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" className="w-32 h-32 flex-shrink-0">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="14" />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth="14"
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
            transform="rotate(-90 60 60)"
          />
        ))}
      </svg>
      <div className="space-y-1.5 min-w-0">
        {arcs.map((arc) => (
          <div key={arc.label} className="flex items-center gap-2 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: arc.color }} />
            <span className="font-bold text-gray-700 truncate">{arc.label}</span>
            <span className="font-mono font-bold text-gray-800 ml-auto">
              {arc.total.toFixed(2)}
            </span>
            <span className="font-mono text-gray-400 w-10 text-right">
              {total > 0 ? Math.round((arc.total / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="py-10 text-center text-xs font-semibold text-gray-400">{text}</div>
);

interface ReportActionsProps {
  isPrinting: boolean;
  onPrint: () => void;
  csvName: string;
  headers: readonly string[];
  rows: readonly (readonly (string | number)[])[];
  disabled?: boolean;
}

export const ReportActions: React.FC<ReportActionsProps> = ({
  isPrinting,
  onPrint,
  csvName,
  headers,
  rows,
  disabled,
}) => {
  const [busy, setBusy] = React.useState(false);

  // Hasabatlar hakyky .xlsx faýly hökmünde çykarylýar (CSV däl).
  const handleExportExcel = async () => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const data: (string | number)[][] = [
        [...headers],
        ...rows.map((row) => [...row]),
      ];
      const blob = await writeExcelFile(data).toBlob();
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = '';
      for (const b of bytes) binary += String.fromCharCode(b);
      await saveFileAs({
        title: 'Excel-e eksport et',
        defaultName: `${csvName}.xlsx`,
        data: btoa(binary),
        filters: [{ name: 'Excel (.xlsx)', extensions: ['xlsx'] }],
      });
    } catch (err) {
      console.error('[Excel eksport]', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrint}
        disabled={isPrinting || disabled}
        className="h-9 px-3 rounded-xl bg-[#0B1F3A] hover:bg-[#163864] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[11px] flex items-center gap-1.5"
      >
        {isPrinting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Printer className="w-3.5 h-3.5" />
        )}
        Çap et
      </button>
      <button
        type="button"
        onClick={() => void handleExportExcel()}
        disabled={disabled || busy}
        className="h-9 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-bold text-[11px] flex items-center gap-1.5"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sheet className="w-3.5 h-3.5" />}
        Excel-e eksport et
      </button>
    </div>
  );
};