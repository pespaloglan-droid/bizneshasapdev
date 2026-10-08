const MONEY_FORMATTER = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Kassa / Walýuta ekranlarynda ulanylýan bitewüleşdirilen pul görnüşi. */
export function formatMoney(value: number): string {
  return MONEY_FORMATTER.format(Number.isFinite(value) ? value : 0);
}

/** Esas walýuta (Manat/TMT) belligi bilen — bahalar birimsiz görünmesin. */
export function formatMoneyTmt(value: number): string {
  return `${formatMoney(value)} TMT`;
}

export function formatMoneySigned(value: number, type: 'income' | 'expense'): string {
  const sign = type === 'income' ? '+' : '−';
  return `${sign}${formatMoney(Math.abs(value))}`;
}

const RATE_FORMATTER = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

/** Walýuta kursy — azyndan 4 ondalık basama çenli goldaýar. */
export function formatRate(value: number): string {
  return RATE_FORMATTER.format(Number.isFinite(value) ? value : 0);
}

export function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const [year, month, day] = iso.slice(0, 10).split('-');
  if (!year || !month || !day) return iso;
  return `${day}.${month}.${year}`;
}
