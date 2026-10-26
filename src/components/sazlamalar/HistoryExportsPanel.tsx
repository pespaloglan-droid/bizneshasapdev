import React, { useEffect, useState } from 'react';
import type { Customer, InvoiceRecord, MoneyTransaction } from '../../types';
import { getLocalDatabase } from '../../db/pouch';
import { prepareDocumentForWrite } from '../../db/validation';
import { useT } from '../../locales/LanguageContext';
import { exportHistoryWorkbook, historyRows, validHistoryFilter, type HistoryExportKind } from '../../utils/historyExports';
export const HistoryExportsPanel: React.FC<{storeDb:string;accountName:string}> = ({storeDb,accountName}) => {
  const t=useT(); const [from,setFrom]=useState(''); const [to,setTo]=useState(''); const [customerId,setCustomerId]=useState('');
  const [customers,setCustomers]=useState<Customer[]>([]); const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
  useEffect(()=>{let cancelled=false;void getLocalDatabase(storeDb).allDocs({include_docs:true,startkey:'customer_',endkey:'customer_\uffff'}).then(result=>{if(!cancelled)setCustomers(result.rows.flatMap(r=>(r.doc as any)?.customer ? [(r.doc as any).customer as Customer] : []));}).catch(()=>{if(!cancelled)setMessage(t('backup.failed'));});return()=>{cancelled=true;};},[storeDb]);
  const exportFile=async(kind:HistoryExportKind)=>{
    if(busy || !validHistoryFilter({from,to}))return;setBusy(true);setMessage('');
    try{
      const snapshot=await getLocalDatabase(storeDb).allDocs({include_docs:true});
      const invoices:InvoiceRecord[]=[],money:MoneyTransaction[]=[],allCustomers:Customer[]=[];
      for(const row of snapshot.rows){const doc=row.doc as Record<string,unknown>|undefined;if(!doc)continue;const id=String(doc._id);
        if(!['invoice_','money_','customer_'].some(prefix=>id.startsWith(prefix)))continue;
        prepareDocumentForWrite(id,doc);
        if(id.startsWith('invoice_'))invoices.push(doc.invoice as InvoiceRecord);if(id.startsWith('money_'))money.push(doc.transaction as MoneyTransaction);if(id.startsWith('customer_'))allCustomers.push(doc.customer as Customer);
      }
      const filter={from,to,customerId};const rows=historyRows(kind,invoices,money,allCustomers,filter);
      const saved=await exportHistoryWorkbook(kind,rows,accountName,filter);setMessage(t(saved?'backup.saved':'backup.cancelled'));
    }catch{setMessage(t('backup.failed'));}finally{setBusy(false);}
  };
  return <section className="space-y-3 border-t pt-4" aria-busy={busy}>
    <h3 className="font-bold">{t('backup.excelTitle')}</h3><p className="text-xs text-gray-600">{t('backup.excelHint')}</p>
    <div className="flex flex-wrap gap-3 text-sm"><label>{t('backup.from')}<input className="border rounded-lg p-2 block" type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label><label>{t('backup.to')}<input className="border rounded-lg p-2 block" type="date" value={to} onChange={e=>setTo(e.target.value)} /></label><label>{t('backup.customers')}<select className="border rounded-lg p-2 block" value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">{t('backup.allCustomers')}</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
    {!validHistoryFilter({from,to})&&<p role="alert">{t('backup.invalidDates')}</p>}
    <div className="flex flex-wrap gap-2">{(['sales','stock','debt','cash'] as const).map(kind=><button key={kind} className="border rounded-xl px-3 py-2 text-sm disabled:opacity-50" disabled={busy||!validHistoryFilter({from,to})} onClick={()=>void exportFile(kind)}>{t(`backup.excel${kind[0].toUpperCase()+kind.slice(1)}`)}</button>)}</div>
    {message&&<p role="status" className="text-sm">{message}</p>}
  </section>;
};
