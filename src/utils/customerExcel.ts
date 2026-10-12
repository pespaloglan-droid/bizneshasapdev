import { detectExcelColumns, requireExcelSelection, type ImportColumn, type ExcelColumnSelection } from './excelColumnMapping';
import type { Customer, CustomerType } from '../types';
import {
  readSheet,
  cellText,
  cellNumber,
  isTotalRowLabel,
  type SheetData,
} from './excelIO';

/**
 * Müşderi / Işgär Excel sütünleri — forma we model bilen birebir deň.
 *
 * Bakiýe (algy/bergi) iki aýratyn sütünde saklanýar. Modelde bolsa ýeke-täk
 * işaratly `balance` meýdançasy bar: `balance = algy − bergi`.
 * (+) → müşderi bize borçly (Algy) | (−) → biz müşderä borçly (Bergi).
 */
export const CUSTOMER_EXCEL_COLUMNS: readonly ImportColumn<keyof CustomerDraft>[] = [
  { key: 'name', header: 'Ady Familiýasy', required: true, aliases: ["ad soyad", "müşteri adı", "musteri adi", "customer name", "full name", "name", "фио", "имя клиента", "имя"] },
  { key: 'phone', header: 'Telefon belgisi', required: false, aliases: ["telefon", "phone", "phone number", "телефон", "номер телефона"] },
  { key: 'type', header: 'Görnüşi', required: false, aliases: ["tip", "tür", "tur", "type", "customer type", "тип", "тип клиента"] },
  { key: 'addressNote', header: 'Salgy / Bellik', required: false, aliases: ["adres", "address", "address note", "note", "адрес", "примечание"] },
  { key: 'algy', header: 'Algy (TMT)', required: false, aliases: ["alacak", "receivable", "receivables", "дебиторская задолженность", "algy"] },
  { key: 'bergi', header: 'Bergi (TMT)', required: false, aliases: ["borç", "borc", "payable", "payables", "кредиторская задолженность", "bergi"] },
  { key: 'dueDateDays', header: 'Möhlet (gün)', required: false, aliases: ["vade günü", "vade gunu", "due days", "due date days", "payment term days", "срок оплаты", "срок дней"] },
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
  /** Excel-de görnýän hakyky setir belgisi (1-den başlaýar, sözbaşy hem hasaba alnar). */
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
  return detectExcelColumns(data, CUSTOMER_EXCEL_COLUMNS).headerIndex;
}

/** Excel setirlerini barlap, her setir üçin müşderi garalamasyny döredýär. */
export function parseCustomerRows(data: SheetData, selection?: ExcelColumnSelection<keyof CustomerDraft>): ParsedCustomerRow[] {
  if (data.length < 2) return [];
  const { headerIndex, mapping: indexOf } = requireExcelSelection(data, CUSTOMER_EXCEL_COLUMNS, selection);

  // Faýlyň içinde gaýtalanýan at/telefon barlagy
  const seenNames = new Map<string, number>();
  const seenPhones = new Map<string, number>();
  const parsed: ParsedCustomerRow[] = [];

  for (let rowIndex = headerIndex + 1; rowIndex < data.length; rowIndex += 1) {
    const row = data[rowIndex];
    if (row.every((cell) => !cellText(cell))) continue;
    // Stilli eksportyň aşakyndaky «Jemi» setiri importda geçilýär.
    if (isTotalRowLabel(cellText(row[0]))) continue;
    // Excel-de görnýän hakyky setir belgisi (0-based index + 1).
    const excelRowNumber = rowIndex + 1;
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
        seenNames.set(nameKey, excelRowNumber);
      }
    }
    if (draft.phone) {
      const phoneKey = draft.phone.trim().toLowerCase();
      const firstSeen = seenPhones.get(phoneKey);
      if (firstSeen !== undefined) {
        errors.push(`Telefon faýlda gaýtalanýar (${firstSeen}-nji setirde)`);
      } else {
        seenPhones.set(phoneKey, excelRowNumber);
      }
    }

    const isEmpty = ['name', 'phone', 'type', 'addressNote'].every(
      (key) => !value(key as keyof CustomerDraft)
    );
    if (isEmpty && errors.length === 0) continue;

    parsed.push({
      rowNumber: excelRowNumber,
      draft: errors.length === 0 ? draft : null,
      errors,
    });
  }

  return parsed;
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