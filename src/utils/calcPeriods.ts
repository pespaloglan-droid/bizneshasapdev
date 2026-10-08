export type CalcPeriod =
  | 'today'
  | 'week'
  | 'month'
  | 'lastMonth'
  | 'quarter'
  | 'year'
  | 'custom';

export interface DateWindow {
  readonly from: Date;
  readonly to: Date;
}

export const CALC_PERIODS: { id: CalcPeriod; label: string }[] = [
  { id: 'today', label: 'Şu gün' },
  { id: 'week', label: 'Şu hepde' },
  { id: 'month', label: 'Şu aý' },
  { id: 'lastMonth', label: 'Geçen aý' },
  { id: 'quarter', label: 'Çärýek' },
  { id: 'year', label: 'Ýyl' },
  { id: 'custom', label: 'Ýörite aralyk' },
];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIsoDate(value: string, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function periodWindow(
  period: CalcPeriod,
  customFrom: string,
  customTo: string
): DateWindow {
  const now = new Date();
  const end = new Date(now.getTime() + 1);
  const dayStart = startOfDay(now);

  switch (period) {
    case 'today':
      return { from: dayStart, to: end };
    case 'week': {
      const from = new Date(dayStart);
      from.setDate(from.getDate() - 6);
      return { from, to: end };
    }
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: end };
    case 'lastMonth':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 1),
      };
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return { from: new Date(now.getFullYear(), quarterStartMonth, 1), to: end };
    }
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1), to: end };
    case 'custom': {
      const from = parseIsoDate(customFrom, dayStart);
      const toDate = parseIsoDate(customTo, now);
      const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1);
      return { from, to: to > from ? to : new Date(from.getTime() + 86400000) };
    }
    default:
      return { from: dayStart, to: end };
  }
}

export function inWindow(iso: string, window: DateWindow): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date >= window.from && date < window.to;
}

export type TrendGranularity = 'daily' | 'weekly' | 'monthly';

export function trendGranularity(window: DateWindow): TrendGranularity {
  const days = Math.ceil((window.to.getTime() - window.from.getTime()) / 86400000);
  if (days <= 31) return 'daily';
  if (days <= 120) return 'weekly';
  return 'monthly';
}

export interface TrendBucket {
  readonly label: string;
  readonly from: Date;
  readonly to: Date;
}

export function trendBuckets(window: DateWindow): TrendBucket[] {
  const granularity = trendGranularity(window);
  const buckets: TrendBucket[] = [];

  if (granularity === 'daily') {
    const cursor = startOfDay(window.from);
    while (cursor < window.to && buckets.length < 62) {
      const next = new Date(cursor);
      next.setDate(next.getDate() + 1);
      buckets.push({
        label: `${String(cursor.getDate()).padStart(2, '0')}.${String(cursor.getMonth() + 1).padStart(2, '0')}`,
        from: new Date(cursor),
        to: next,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return buckets;
  }

  if (granularity === 'weekly') {
    const cursor = startOfDay(window.from);
    while (cursor < window.to && buckets.length < 30) {
      const next = new Date(cursor);
      next.setDate(next.getDate() + 7);
      buckets.push({
        label: `${String(cursor.getDate()).padStart(2, '0')}.${String(cursor.getMonth() + 1).padStart(2, '0')}`,
        from: new Date(cursor),
        to: next,
      });
      cursor.setDate(cursor.getDate() + 7);
    }
    return buckets;
  }

  const cursor = new Date(window.from.getFullYear(), window.from.getMonth(), 1);
  while (cursor < window.to && buckets.length < 24) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    buckets.push({
      label: `${String(cursor.getMonth() + 1).padStart(2, '0')}.${cursor.getFullYear()}`,
      from: new Date(cursor),
      to: next,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
}