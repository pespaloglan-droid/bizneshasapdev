import type { Customer, InvoiceRecord, MoneyTransaction } from '../types';
import { createAndSaveStyledWorkbook } from './excelWriter';
import type { ExcelColumn } from './excelStyle';
export type HistoryExportKind = 'sales' | 'stock' | 'debt' | 'cash';
export type HistoryRow = readonly (string | number | null)[];
export interface HistoryFilter { from: string; to: string; customerId?: string }
export function validHistoryFilter(filter: HistoryFilter): boolean {
  const validDay = (day: string) => !day || (/^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0,10) === day);
  return validDay(filter.from) && validDay(filter.to) && (!filter.from || !filter.to || filter.from <= filter.to);
}
export function inHistoryRange(date: string, filter: HistoryFilter): boolean {
  const day = date.slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && (!filter.from || day >= filter.from) && (!filter.to || day <= filter.to);
}
/** These are recorded invoice-line movements, NOT a reconstructed stock ledger.
 * No current unit multipliers/compositions are applied to historical records. */
export function historyRows(kind: HistoryExportKind, invoices: readonly InvoiceRecord[], transactions: readonly MoneyTransaction[], customers: readonly Customer[], filter: HistoryFilter): HistoryRow[] {
  if (!validHistoryFilter(filter)) throw new Error('INVALID_DATE_RANGE');
  const customer = new Map(customers.map(c => [c.id,c.name]));
  const selected = invoices.filter(i => inHistoryRange(i.createdAt,filter) && (!filter.customerId || i.customerId === filter.customerId));
  const cash = transactions.filter(m => inHistoryRange(m.date,filter) && (!filter.customerId || m.customerId === filter.customerId));
  if (kind === 'sales') return selected.map(i => [i.invoiceNo,i.createdAt,i.customerName,i.invoiceType,i.status,i.draftStatus ?? '',i.paymentMethod,i.currency ?? 'TMT',i.amountDue,i.paidAmount ?? null,i.remainingDebt ?? null]);
  if (kind === 'cash') return cash.map(m => [m.id,m.date,m.type,m.category,m.customerId ? customer.get(m.customerId) ?? m.customerId : '',m.currency ?? 'TMT',m.amount,m.amountTmt ?? (!m.currency || m.currency === 'TMT' ? m.amount : null),m.paymentMethod,m.invoiceId ?? '',m.description ?? '']);
  if (kind === 'stock') {
    const signs: Record<string, number> = { sales:-1,other_out:-1,purchase:1,other_in:1,sales_return:1,purchase_return:-1 };
    const rows: HistoryRow[]=[];
    for (const i of selected) {
      if ((i.draftStatus && i.draftStatus !== 'accepted') || !signs[i.invoiceType]) continue;
      for (const item of i.items) {
        rows.push([i.invoiceNo,i.createdAt,i.invoiceType,item.productId,item.sku,item.name,item.unit ?? '',signs[i.invoiceType]*item.qty,i.status]);
        if (i.status === 'voided' && i.voidedAt && inHistoryRange(i.voidedAt,filter)) rows.push([i.invoiceNo,i.voidedAt,'void',item.productId,item.sku,item.name,item.unit ?? '',-signs[i.invoiceType]*item.qty,'voided']);
      }
    }
    // A cancellation inside the range can refer to an invoice outside the range.
    for (const i of invoices) {
      if (inHistoryRange(i.createdAt,filter) || i.status !== 'voided' || !i.voidedAt || !inHistoryRange(i.voidedAt,filter) || !signs[i.invoiceType] || (i.draftStatus && i.draftStatus !== 'accepted') || (filter.customerId && i.customerId !== filter.customerId)) continue;
      for (const item of i.items) rows.push([i.invoiceNo,i.voidedAt,'void',item.productId,item.sku,item.name,item.unit ?? '',-signs[i.invoiceType]*item.qty,'voided']);
    }
    return rows.sort((a,b)=>String(a[1]).localeCompare(String(b[1])));
  }
  const rows: HistoryRow[] = selected.filter(i => i.paymentMethod === 'credit' && (!i.draftStatus || i.draftStatus === 'accepted')).map(i => ['Faktura',i.invoiceNo,i.createdAt,i.customerName,i.currency ?? 'TMT',i.amountDue,i.paidAmount ?? null,i.remainingDebt ?? i.amountDue,i.status]);
  for (const m of cash.filter(m => m.category === 'weresiye_yygnamak')) rows.push(['Töleg',m.id,m.date,m.customerId ? customer.get(m.customerId) ?? m.customerId : '',m.currency ?? 'TMT',null,m.amount,null,m.type]);
  return rows.sort((a,b)=>String(a[2]).localeCompare(String(b[2])));
}
const specs: Record<HistoryExportKind,{ title:string; headers:readonly string[]; numeric:readonly number[] }> = {
  sales: { title:'Faktura taryhy', headers:['Faktura №','Sene','Müşderi','Görnüş','Ýagdaý','Garalama','Töleg usuly','Walýuta','Jemi','Tölenen','Galan bergi'], numeric:[8,9,10] },
  cash: { title:'Kassa hereketleri', headers:['ID','Sene','Görnüş','Kategoriýa','Müşderi','Walýuta','Mukdar','TMT','Töleg usuly','Faktura ID','Bellik'], numeric:[6,7] },
  stock: { title:'Faktura boýunça haryt hereketleri', headers:['Faktura №','Sene','Görnüş','Haryt ID','SKU','Haryt','Ölçeg','Mukdar','Ýagdaý'], numeric:[7] },
  debt: { title:'Müşderiniň bergi we töleg ýazgylary', headers:['Çeşme','Resminama №','Sene','Müşderi','Walýuta','Faktura jemi','Tölenen','Häzirki galan bergi','Ýagdaý'], numeric:[5,6,7] },
};
export function historyColumns(kind: HistoryExportKind): readonly ExcelColumn<HistoryRow>[] {
  return specs[kind].headers.map((header,index)=>({ header, get:row=>row[index] ?? null, kind: specs[kind].numeric.includes(index) ? kind === 'stock' ? 'qty' : 'money' : 'text', numFmt: kind === 'stock' && index===7 ? '#,##0.###' : undefined }));
}
export async function exportHistoryWorkbook(kind: HistoryExportKind, rows: readonly HistoryRow[], accountName: string, filter: HistoryFilter): Promise<boolean> {
  return createAndSaveStyledWorkbook({ accountName, sheetName:'Hasabat', title:specs[kind].title, columns:historyColumns(kind), rows, showTotals:false,
    meta:{ kind:'genel', accountName, template:`history_${kind}`, templateVersion:1, options:{ from:filter.from,to:filter.to,customerId:filter.customerId ?? '' } } }, `biznes-hasap-${kind}-${new Date().toISOString().slice(0,10)}.xlsx`);
}
