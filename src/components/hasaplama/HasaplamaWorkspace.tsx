import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarClock, ChevronDown, ChevronUp, Coins, HandCoins, Package, PiggyBank, Trophy } from 'lucide-react';
import type {
  CurrencyRate,
  Customer,
  InvoiceRecord,
  Ledger,
  MoneyTransaction,
  Product,
  Targow,
} from '../../types';
import {
  CALC_PERIODS,
  periodWindow,
  type CalcPeriod,
  type DateWindow,
} from '../../utils/calcPeriods';
import { flowTotals } from '../../utils/calcFlow';
import { getAppSettings } from '../../db/settingsService';
import {
  ledgerRows,
  receivables,
  stockValuation,
  supplierDebts,
  totalLedgerTmt,
  totalReceivables,
} from '../../utils/calcAssets';
import { PeriodBar } from './PeriodBar';
import { SummaryCards } from './SummaryCards';
import { ProfitLossTab } from './ProfitLossTab';
import { DebtTab } from './DebtTab';
import { StockTab } from './StockTab';
import { CashFlowTab } from './CashFlowTab';
import { TargowPerfTab } from './TargowPerfTab';
import { XAccotTab } from './XAccotTab';
import { CalculatorWidget } from './CalculatorWidget';

type ReportTab = 'xaccot' | 'pl' | 'debt' | 'stock' | 'cash' | 'targow';

interface HasaplamaWorkspaceProps {
  invoices: readonly InvoiceRecord[];
  transactions: readonly MoneyTransaction[];
  customers: readonly Customer[];
  products: readonly Product[];
  ledgers: readonly Ledger[];
  currencies: readonly CurrencyRate[];
  targows: readonly Targow[];
  storeDb: string;
  onGoToTargow: () => void;
  /** Stok hasabatyndan faktura döretmek. */
  onAddToCart?: (product: Product) => void;
  onGoToCheckout?: () => void;
}

const TABS: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
  { id: 'xaccot', label: 'X-Accot (günlük)', icon: <CalendarClock className="w-3.5 h-3.5" /> },
  { id: 'pl', label: 'Peýda-zyýan hasabaty', icon: <Coins className="w-3.5 h-3.5" /> },
  { id: 'debt', label: 'Bergi-borç hasabaty', icon: <HandCoins className="w-3.5 h-3.5" /> },
  { id: 'stock', label: 'Ambar hasabaty', icon: <Package className="w-3.5 h-3.5" /> },
  { id: 'cash', label: 'Kassa hasabaty', icon: <PiggyBank className="w-3.5 h-3.5" /> },
  { id: 'targow', label: 'Targowçy netijeleri', icon: <Trophy className="w-3.5 h-3.5" /> },
];

function rangeLabel(period: CalcPeriod, window: DateWindow): string {
  const label = CALC_PERIODS.find((item) => item.id === period)?.label ?? '';
  const from = window.from.toLocaleDateString('tr-TR');
  const to = new Date(window.to.getTime() - 86400000).toLocaleDateString('tr-TR');
  return `${label} · ${from} — ${to}`;
}

export const HasaplamaWorkspace: React.FC<HasaplamaWorkspaceProps> = ({
  invoices,
  transactions,
  customers,
  products,
  ledgers,
  currencies,
  targows,
  storeDb,
  onGoToTargow,
  onAddToCart,
  onGoToCheckout,
}) => {
  const [period, setPeriod] = useState<CalcPeriod>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [tab, setTab] = useState<ReportTab>('xaccot');
  const [showSummary, setShowSummary] = useState(true);
  const [paperWidth, setPaperWidth] = useState('80mm');

  // Çap görnüşi Sazlamalar modulyndaky printer sazlamalaryndan alynýar.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await getAppSettings(storeDb);
      if (!cancelled && settings) setPaperWidth(settings.printer.paperWidth);
    })();
    return () => {
      cancelled = true;
    };
  }, [storeDb]);

  const window = useMemo(() => periodWindow(period, customFrom, customTo), [
    period,
    customFrom,
    customTo,
  ]);

  const label = useMemo(() => rangeLabel(period, window), [period, window]);

  const totals = useMemo(() => flowTotals(transactions, window), [transactions, window]);
  const receivableRows = useMemo(
    () => receivables(customers, transactions),
    [customers, transactions]
  );
  const receivableTotal = useMemo(() => totalReceivables(receivableRows), [receivableRows]);
  const supplierDebtTotal = useMemo(() => supplierDebts(customers), [customers]);
  const stock = useMemo(() => stockValuation(products), [products]);
  const ledgersTotal = useMemo(
    () => totalLedgerTmt(ledgerRows(ledgers, transactions, currencies)),
    [ledgers, transactions, currencies]
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#F1F5F9] min-h-0">
      <div className="px-6 pt-5 pb-28 space-y-3">
        <PeriodBar
          period={period}
          customFrom={customFrom}
          customTo={customTo}
          resolved={window}
          onPeriodChange={setPeriod}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        />
        {showSummary && (
          <SummaryCards
            totals={totals}
            receivableTotal={receivableTotal}
            supplierDebtTotal={supplierDebtTotal}
            stockValue={stock.purchaseValue}
            ledgerTotal={ledgersTotal}
          />
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex items-center gap-1 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" />
            Hasaplama
          </span>
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`h-9 px-3 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                tab === item.id
                  ? 'bg-[#10b981] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowSummary(!showSummary)}
            className="ml-auto h-9 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] flex items-center gap-1.5"
            title={showSummary ? 'Özet kartlary gizle — hasabata has köp ýer' : 'Özet kartlary görkez'}
          >
            {showSummary ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            {showSummary ? 'Özeti gizle' : 'Özeti görkez'}
          </button>
        </div>

        {tab === 'xaccot' && (
          <XAccotTab
            invoices={invoices}
            transactions={transactions}
            products={products}
            rangeLabel={label}
            paperWidth={paperWidth}
          />
        )}
        {tab === 'pl' && (
          <ProfitLossTab
            transactions={transactions}
            window={window}
            rangeLabel={label}
            paperWidth={paperWidth}
          />
        )}
        {tab === 'debt' && (
          <DebtTab
            customers={customers}
            transactions={transactions}
            invoices={invoices}
            window={window}
            rangeLabel={label}
            paperWidth={paperWidth}
          />
        )}
        {tab === 'stock' && (
          <StockTab
            products={products}
            invoices={invoices}
            window={window}
            rangeLabel={label}
            paperWidth={paperWidth}
            onAddToCart={onAddToCart}
            onGoToCheckout={onGoToCheckout}
          />
        )}
        {tab === 'cash' && (
          <CashFlowTab
            ledgers={ledgers}
            transactions={transactions}
            currencies={currencies}
            window={window}
            rangeLabel={label}
            paperWidth={paperWidth}
          />
        )}
        {tab === 'targow' && (
          <TargowPerfTab
            targows={targows}
            invoices={invoices}
            window={window}
            rangeLabel={label}
            paperWidth={paperWidth}
            onGoToTargow={onGoToTargow}
          />
        )}
      </div>

      <CalculatorWidget currencies={currencies} />
    </div>
  );
};