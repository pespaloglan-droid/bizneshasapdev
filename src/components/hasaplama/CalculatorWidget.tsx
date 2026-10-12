import React, { useState } from 'react';
import { Calculator, ChevronDown, ChevronUp, Repeat } from 'lucide-react';
import type { CurrencyRate } from '../../types';
import { BASE_CURRENCY_CODE, rateForCode } from '../../db/currencyService';
import { formatMoney } from '../../utils/money';
import { useT } from '../../locales/LanguageContext';

type Operator = '+' | '-' | '*' | '/';

interface CalculatorWidgetProps {
  currencies: readonly CurrencyRate[];
}

function compute(left: number, right: number, operator: Operator): number {
  switch (operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return right === 0 ? 0 : left / right;
    default:
      return right;
  }
}

const BUTTONS: { label: string; kind: 'digit' | 'op' | 'action' }[] = [
  { label: 'C', kind: 'action' },
  { label: '%', kind: 'action' },
  { label: '÷', kind: 'op' },
  { label: '×', kind: 'op' },
  { label: '7', kind: 'digit' },
  { label: '8', kind: 'digit' },
  { label: '9', kind: 'digit' },
  { label: '−', kind: 'op' },
  { label: '4', kind: 'digit' },
  { label: '5', kind: 'digit' },
  { label: '6', kind: 'digit' },
  { label: '+', kind: 'op' },
  { label: '1', kind: 'digit' },
  { label: '2', kind: 'digit' },
  { label: '3', kind: 'digit' },
  { label: '=', kind: 'action' },
  { label: '0', kind: 'digit' },
  { label: '.', kind: 'digit' },
];

const OP_MAP: Record<string, Operator> = { '+': '+', '−': '-', '×': '*', '÷': '/' };

export const CalculatorWidget: React.FC<CalculatorWidgetProps> = ({ currencies }) => {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'calc' | 'convert'>('calc');
  const [display, setDisplay] = useState('0');
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [fresh, setFresh] = useState(true);

  const [amount, setAmount] = useState('100');
  const [fromCode, setFromCode] = useState<string>(BASE_CURRENCY_CODE);
  const [toCode, setToCode] = useState<string>(currencies[0]?.code ?? BASE_CURRENCY_CODE);

  const fromRate = rateForCode(currencies, fromCode);
  const toRate = rateForCode(currencies, toCode);
  const parsedAmount = Number(amount) || 0;
  const converted = toRate === 0 ? 0 : (parsedAmount * fromRate) / toRate;

  const pushDigit = (digit: string) => {
    if (digit === '.' && !fresh && display.includes('.')) return;
    if (fresh) {
      setDisplay(digit === '.' ? '0.' : digit);
      setFresh(false);
      return;
    }
    setDisplay(display === '0' && digit !== '.' ? digit : display + digit);
  };

  const applyOperator = (nextOperator: Operator) => {
    const value = parseFloat(display) || 0;
    const result = accumulator === null || operator === null ? value : compute(accumulator, value, operator);
    setAccumulator(result);
    setDisplay(String(result));
    setOperator(nextOperator);
    setFresh(true);
  };

  const handleEquals = () => {
    if (accumulator === null || operator === null) return;
    const result = compute(accumulator, parseFloat(display) || 0, operator);
    setDisplay(String(result));
    setAccumulator(null);
    setOperator(null);
    setFresh(true);
  };

  const handleButton = (label: string, kind: 'digit' | 'op' | 'action') => {
    if (kind === 'digit') {
      pushDigit(label);
      return;
    }
    if (kind === 'op') {
      applyOperator(OP_MAP[label] ?? '+');
      return;
    }
    if (label === 'C') {
      setDisplay('0');
      setAccumulator(null);
      setOperator(null);
      setFresh(true);
      return;
    }
    if (label === '%') {
      setDisplay(String((parseFloat(display) || 0) / 100));
      setFresh(true);
      return;
    }
    handleEquals();
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 w-[280px]">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-10 px-3 bg-[#0B1F3A] text-white flex items-center justify-between"
        >
          <span className="flex items-center gap-2 text-xs font-bold">
            <Calculator className="w-4 h-4" />
            {t('hasaplama.calculator')}
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {isOpen && (
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTab('calc')}
                className={`flex-1 h-8 rounded-lg text-[11px] font-bold ${
                  tab === 'calc' ? 'bg-[#10b981] text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {t('hasaplama.calculator')}
              </button>
              <button
                type="button"
                onClick={() => setTab('convert')}
                className={`flex-1 h-8 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 ${
                  tab === 'convert' ? 'bg-[#10b981] text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Repeat className="w-3 h-3" />
                {t('hasaplama.currencyLabel')}
              </button>
            </div>

            {tab === 'calc' ? (
              <>
                <div className="h-12 rounded-xl bg-[#F8FAFC] border border-gray-200 flex items-center justify-end px-3 font-mono font-bold text-lg text-gray-800 truncate">
                  {display}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {BUTTONS.map((button) => (
                    <button
                      key={button.label}
                      type="button"
                      onClick={() => handleButton(button.label, button.kind)}
                      className={`h-9 rounded-lg font-bold text-xs transition-colors ${
                        button.kind === 'op'
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : button.kind === 'action'
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#F8FAFC] border border-gray-200 text-right font-mono font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={fromCode}
                    onChange={(e) => setFromCode(e.target.value)}
                    className="h-9 px-2 rounded-xl bg-[#F8FAFC] border border-gray-200 text-[11px] font-bold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value={BASE_CURRENCY_CODE}>{BASE_CURRENCY_CODE}</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.code}>
                        {currency.code}
                      </option>
                    ))}
                  </select>
                  <select
                    value={toCode}
                    onChange={(e) => setToCode(e.target.value)}
                    className="h-9 px-2 rounded-xl bg-[#F8FAFC] border border-gray-200 text-[11px] font-bold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value={BASE_CURRENCY_CODE}>{BASE_CURRENCY_CODE}</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.code}>
                        {currency.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-center">
                  <div className="font-mono font-bold text-emerald-700">
                    {formatMoney(converted)} {toCode}
                  </div>
                  <div className="text-[10px] font-semibold text-gray-500 mt-0.5">
                    {parsedAmount} {fromCode} → {toCode}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};