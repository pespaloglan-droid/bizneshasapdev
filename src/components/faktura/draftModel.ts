import type {
  CartItem,
  Customer,
  InvoiceRecord,
  PaymentMethod,
  Targow,
} from '../../types';
import { BASE_CURRENCY_CODE, convertToTmt } from '../../db/currencyService';
import { generateInvoiceNo } from '../../db/salesService';

export interface DraftInvoiceInput {
  readonly targow: Targow;
  readonly customer: Customer;
  readonly regionId: string;
  readonly lines: readonly CartItem[];
  readonly paymentMethod: PaymentMethod;
  readonly currency: string;
  readonly rate: number;
  readonly note: string;
  readonly createdBy: string;
  readonly createdByRole: string;
}

/** Electron-da merkez, beýlekilerde (APK/web) mobil hasaplanýar. */
export function detectDevice(): string {
  const api = (window as unknown as { electronAPI?: unknown }).electronAPI;
  return api ? 'Merkaz' : 'Mobil';
}

export function orderSubtotal(lines: readonly CartItem[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.qty, 0);
}

/**
 * Targowçynyň ýazýan GARALAMA fakturasyny döredýär.
 * Merkez tarapyndan kabul edilýänçä hiç bir modula täsir etmeýär.
 */
export function buildDraftInvoice(
  input: DraftInvoiceInput,
  device: string
): InvoiceRecord {
  const subtotal = orderSubtotal(input.lines);

  const invoice: InvoiceRecord = {
    id: `inv-${Date.now()}`,
    invoiceNo: generateInvoiceNo(),
    invoiceType: 'sales',
    customerId: input.customer.id,
    customerName: input.customer.name,
    items: [...input.lines],
    itemCount: input.lines.reduce((sum, line) => sum + line.qty, 0),
    subtotal,
    discountTotal: 0,
    taxTotal: 0,
    amountDue: subtotal,
    paymentMethod: input.paymentMethod,
    cashReceived: 0,
    changeDue: 0,
    status: 'completed',
    createdAt: new Date().toISOString(),
    cashierName: input.createdBy,
    internalNote: input.note.trim() ? input.note.trim() : undefined,
    targowId: input.targow.id,
    regionId: input.regionId,
    draftStatus: 'pending',
    createdBy: input.createdBy,
    createdByRole: input.createdByRole,
    device,
  };

  if (input.currency !== BASE_CURRENCY_CODE) {
    invoice.currency = input.currency;
    invoice.exchangeRateAtTime = input.rate;
    invoice.amountTmt = convertToTmt(subtotal, input.rate);
  } else {
    invoice.amountTmt = subtotal;
  }

  return invoice;
}
