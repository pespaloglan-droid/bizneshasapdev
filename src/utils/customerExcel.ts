import type { Customer, CustomerType } from '../types';
import {
  readSheet,
  cellText,
  cellNumber,
  writeExcelFile,
  type SheetData,
} from './excelIO';

/**
 * Müşderi / Işgär Excel sütünleri — forma we model bilen birebir deň.
 *
 * Bakiýe (algy/bergi) iki aýratyn sütünde saklanýar. Modelde bolsa ýeke-täk
 * işaratly `balance` meýdançasy bar: `balance = algy − bergi`.
 * (+) → müşderi bize borçly (Algy) | (−) → biz müşderä borçly (Bergi).
 */
export const CUSTOMER_EXCEL_COLUMNS: readonly {
  key: keyof CustomerDraft;
  header: string;
  required: boolean;
}[] = [
  { key: 'name', header: 'Ady Familiýasy', required: true },
  { key: 'phone', header: 'Telefon belgisi', required: false },
  { key: 'type', header: 'Görnüşi', required: false },
  { key: 'addressNote', header: 'Salgy / Bellik', required: false },
  { key: 'algy', header: 'Algy (TMT)', required: false },
  { key: 'bergi', header: 'Bergi (TMT)', required: false },
  { key: 'dueDateDays', header: 'Möhlet (gün)', required: false },
];

/** Import setirinden döredilýän arassa garalama. */
export interface CustomerDraft {
  name: string;
  phone: string;
  type: CustomerType;
  addressNote: string;
  algy: number;
  bergi: number;
  dueDateDays: number;
}

// Re-export for use in other modules
export type { CustomerDraft as CustomerDraftType };

export interface ParsedCustomerRow {
  /** Excel-de 1-den başlaýan setir belgisi (sözbaşy hasaplanmaýar). */
  readonly rowNumber: number;
  readonly draft: CustomerDraft | null;
  readonly errors: string[];
}

const TYPE_ALIASES: readonly { type: CustomerType; labels: readonly string[] }[] = [
  {
    type: 'employee',
    labels: ['işgär', 'isgar', 'işgören', 'isgoren', 'işçi', 'isci', 'personel', 'employee'],
  },
  {
    type: 'supplier',
    labels: ['üpjün ediji', 'upjun ediji', 'üpjün ediji (tedarikçi)', 'tedarikçi', 'tedarikci', 'supplier'],
  },
  {
    type: 'customer',
    labels: ['müşderi', 'musderi', 'müşteri', 'musteri', 'alıjy', 'alyjy', 'alıcı', 'customer'],
  },
];

/** "Görnüşi" tekstini model tipine öwürýär; nämälim bolsa "customer". */
export function resolveCustomerType(text: string): CustomerType {
  const value = text.trim().toLowerCase();
  if (!value) return 'customer';
  const found = TYPE_ALIASES.find((entry) =>
    entry.labels.some((label) => label.toLowerCase() === value)
  );
  return found ? found.type : 'customer';
}

/** Model tipini Excel-de görkezilýän ada öwürýär. */
export function customerTypeText(type: CustomerType | undefined): string {
  if (type === 'employee') return 'Işgär';
  if (type === 'supplier') return 'Üpjün ediji';
  return 'Müşderi';
}

export function defaultCustomerDraft(): CustomerDraft {
  return {
    name: '',
    phone: '',
    type: 'customer',
    addressNote: '',
    algy: 0,
    bergi: 0,
    dueDateDays: 0,
  };
}

/** Garalamadan model sanawyna geçirilýän işaratly galyndy. */
export function draftBalance(draft: CustomerDraft): number {
  return draft.algy - draft.bergi;
}

// ── Excel okamak ────────────────────────────────────────────────────────────

export async function readCustomerFile(file: File): Promise<SheetData> {
  return readSheet(file);
}

/**
 * Başlýan setiriň ýerini tapýar — stilli çyktylarda logo/firma setirleri
 * başdan bolup biler (iň köp meşhur başlyk bar bolan setir saýlanýar).
 */
export function findCustomerHeaderRowIndex(data: SheetData): number {
  const limit = Math.min(data.length, 12);
  let best = 0;
  let bestScore = -1;
  for (let r = 0; r < limit; r += 1) {
    const row = data[r];
    if (!row) continue;
    let score = 0;
    for (const column of CUSTOMER_EXCEL_COLUMNS) {
      if (row.some((cell) => cellText(cell).toLowerCase() === column.header.toLowerCase())) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return bestScore > 0 ? best : 0;
}

/** Excel setirlerini barlap, her setir üçin müşderi garalamasyny döredýär. */
export function parseCustomerRows(data: SheetData): ParsedCustomerRow[] {
  const headerIndex = findCustomerHeaderRowIndex(data);
  if (data.length < headerIndex + 2) return [];

  const headerRow = data[headerIndex];
  const indexOf: Record<string, number> = {};
  for (const column of CUSTOMER_EXCEL_COLUMNS) {
    const index = headerRow.findIndex(
      (cell) => cellText(cell).toLowerCase() === column.header.toLowerCase()
    );
    if (index >= 0) indexOf[column.key] = index;
  }

  // Faýlyň içinde gaýtalanýan at/telefon barlagy
  const seenNames = new Map<string, number>();
  const seenPhones = new Map<string, number>();
  const parsed: ParsedCustomerRow[] = [];

  for (let rowIndex = headerIndex + 1; rowIndex < data.length; rowIndex += 1) {
    const row = data[rowIndex];
    const errors: string[] = [];
    const value = (key: keyof CustomerDraft): string => {
      const index = indexOf[key];
      return index === undefined ? '' : cellText(row[index]);
    };

    const draft = defaultCustomerDraft();
    draft.name = value('name');
    draft.phone = value('phone');
    draft.type = resolveCustomerType(value('type'));
    draft.addressNote = value('addressNote');
    draft.algy = cellNumber(value('algy'));
    draft.bergi = cellNumber(value('bergi'));
    draft.dueDateDays = Math.round(cellNumber(value('dueDateDays')));

    if (!draft.name) errors.push('Ady Familiýasy boş');
    if (draft.algy < 0) errors.push('Algy nädogry');
    if (draft.bergi < 0) errors.push('Bergi nädogry');
    if (draft.algy > 0 && draft.bergi > 0) errors.push('Algy we Bergi bilelikde bolup bilmez');
    if (draft.dueDateDays < 0) errors.push('Möhlet nädogry');

    if (draft.name) {
      const nameKey = draft.name.trim().toLowerCase();
      const firstSeen = seenNames.get(nameKey);
      if (firstSeen !== undefined) {
        errors.push(`At faýlda gaýtalanýar (${firstSeen}-nji setirde)`);
      } else {
        seenNames.set(nameKey, rowIndex);
      }
    }
    if (draft.phone) {
      const phoneKey = draft.phone.trim().toLowerCase();
      const firstSeen = seenPhones.get(phoneKey);
      if (firstSeen !== undefined) {
        errors.push(`Telefon faýlda gaýtalanýar (${firstSeen}-nji setirde)`);
      } else {
        seenPhones.set(phoneKey, rowIndex);
      }
    }

    const isEmpty = ['name', 'phone', 'type', 'addressNote'].every(
      (key) => !value(key as keyof CustomerDraft)
    );
    if (isEmpty && errors.length === 0) continue;

    parsed.push({
      rowNumber: rowIndex,
      draft: errors.length === 0 ? draft : null,
      errors,
    });
  }

  return parsed;
}

// ── Excel ýazmak ────────────────────────────────────────────────────────────

export function buildCustomerExportRows(customers: readonly Customer[]): (string | number)[][] {
  const header = CUSTOMER_EXCEL_COLUMNS.map((column) => column.header);
  const rows = customers.map((customer) => {
    const algy = customer.balance > 0 ? customer.balance : '';
    const bergi = customer.balance < 0 ? Math.abs(customer.balance) : '';
    return [
      customer.name,
      customer.phone ?? '',
      customerTypeText(customer.type),
      customer.addressNote ?? '',
      algy,
      bergi,
      customer.dueDateDays ? customer.dueDateDays : '',
    ];
  });
  return [header, ...rows];
}

export function buildCustomerTemplateRows(): (string | number)[][] {
  const header = CUSTOMER_EXCEL_COLUMNS.map((column) => column.header);
  const sample = ['Nusga müşderi', '+993 65 000000', 'Müşderi', 'Aşgabat', 500, '', 30];
  return [header, sample];
}

export async function writeCustomerExcel(
  rows: (string | number)[][],
  fileName: string
): Promise<void> {
  await writeExcelFile(rows).toFile(fileName);
}

export async function downloadCustomerTemplate(): Promise<void> {
  await writeExcelFile(buildCustomerTemplateRows()).toFile('musderi-sablon.xlsx');
}

// ── Gabat gelme (conflict) barlagy ──────────────────────────────────────────

/** Bar bolan müşderileriň at/telefon açarlary. */
export function customerConflictKeys(customers: readonly Customer[]): Set<string> {
  const keys = new Set<string>();
  for (const customer of customers) {
    keys.add(`n:${customer.name.trim().toLowerCase()}`);
    if (customer.phone) keys.add(`p:${customer.phone.trim().toLowerCase()}`);
  }
  return keys;
}

export function isCustomerConflict(
  draft: CustomerDraft,
  conflictKeys: ReadonlySet<string>
): boolean {
  return (
    conflictKeys.has(`n:${draft.name.trim().toLowerCase()}`) ||
    (!!draft.phone && conflictKeys.has(`p:${draft.phone.trim().toLowerCase()}`))
  );
}