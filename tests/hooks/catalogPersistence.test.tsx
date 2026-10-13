import React from 'react';
import { act, renderHook, render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../../src/db/productService',()=>({saveProductToDb:vi.fn(),deleteProductFromDb:vi.fn(),saveProductsBatchDb:vi.fn()}));
vi.mock('../../src/db/customerService',()=>({saveCustomerToDb:vi.fn(),deleteCustomerFromDb:vi.fn(),saveCustomersBatchDb:vi.fn(),adjustCustomerBalance:vi.fn(),GENERAL_CUSTOMER_ID:'c-general'}));
import { saveProductToDb, deleteProductFromDb } from '../../src/db/productService';
import { saveCustomerToDb, deleteCustomerFromDb } from '../../src/db/customerService';
import { useCatalogActions } from '../../src/hooks/useCatalogActions';
import { CustomerForm } from '../../src/components/customers/CustomerForm';
import { LanguageProvider } from '../../src/locales/LanguageContext';
import { translate } from '../../src/locales/i18n';
const wrapper=({children}:{children:React.ReactNode})=><LanguageProvider language="en">{children}</LanguageProvider>;
const product={id:'p',name:'Tea'} as any, customer={id:'c',name:'Person',balance:0} as any;
function setup(){const options={storeDb:'QA',setProducts:vi.fn(),setCustomers:vi.fn(),setSelectedCustomer:vi.fn(),setToastMessage:vi.fn(),selectedCustomer:customer,customers:[customer]};return {...renderHook(()=>useCatalogActions(options),{wrapper}),...options};}
beforeEach(()=>{vi.resetAllMocks();vi.mocked(saveProductToDb).mockResolvedValue(product);vi.mocked(saveCustomerToDb).mockResolvedValue(customer);vi.mocked(deleteProductFromDb).mockResolvedValue(true);vi.mocked(deleteCustomerFromDb).mockResolvedValue(true);});
for(const [method,save,arg] of [['handleAddProduct',saveProductToDb,product],['handleUpdateProduct',saveProductToDb,product],['handleAddCustomer',saveCustomerToDb,customer],['handleUpdateCustomer',saveCustomerToDb,customer]] as const){
 it(`${method}: primary hatası UI ve başarı mesajını değiştirmez`,async()=>{const s=setup();vi.mocked(save).mockRejectedValueOnce(new Error('fixture'));await act(async()=>expect(await (s.result.current[method] as any)(arg)).toBe(false));expect(s.setProducts).not.toHaveBeenCalled();expect(s.setCustomers).not.toHaveBeenCalled();expect(s.setSelectedCustomer).not.toHaveBeenCalled();expect(s.setToastMessage).toHaveBeenCalledWith({type:'info',text:translate('en','pos.catalogWriteFailed')});});
}
for(const [method,remove,id] of [['handleDeleteProduct',deleteProductFromDb,'p'],['handleDeleteCustomer',deleteCustomerFromDb,'c']] as const){
 it(`${method}: false kayıt ve seçimi korur`,async()=>{const s=setup();vi.mocked(remove).mockResolvedValueOnce(false);await act(async()=>expect(await s.result.current[method](id)).toBe(false));expect(s.setProducts).not.toHaveBeenCalled();expect(s.setCustomers).not.toHaveBeenCalled();expect(s.setSelectedCustomer).not.toHaveBeenCalled();});
}
it('başarı ancak DB tamamlandıktan sonra UI günceller; aynı kayıt çift yazılmaz',async()=>{const s=setup();let finish!:(v:any)=>void;vi.mocked(saveProductToDb).mockImplementationOnce(()=>new Promise(resolve=>finish=resolve));let first!:Promise<boolean>;act(()=>{first=s.result.current.handleAddProduct(product);});expect(s.setProducts).not.toHaveBeenCalled();await act(async()=>expect(await s.result.current.handleAddProduct(product)).toBe(false));await act(async()=>{finish(product);expect(await first).toBe(true);});expect(saveProductToDb).toHaveBeenCalledTimes(1);expect(s.setProducts).toHaveBeenCalledTimes(1);});
it('hızlı müşteri ekleme başarısızsa seçilebilir sahte müşteri döndürmez',async()=>{const s=setup();vi.mocked(saveCustomerToDb).mockRejectedValueOnce(new Error('fixture'));await act(async()=>expect(await s.result.current.handleQuickAddCustomer('New')).toBeNull());expect(s.setCustomers).not.toHaveBeenCalled();});
it('genel müşteri silinmez',async()=>{const s=setup();expect(await s.result.current.handleDeleteCustomer('c-general')).toBe(false);expect(deleteCustomerFromDb).not.toHaveBeenCalled();});
it('müşteri formu hata halinde alanları korur ve bekleyen kaydı çift göndermez',async()=>{let finish!:(v:boolean)=>void;const save=vi.fn(()=>new Promise<boolean>(resolve=>finish=resolve));render(<CustomerForm mode="create" language="en" onSave={save} onCancel={()=>{}}/>,{wrapper});const input=screen.getByPlaceholderText(translate('en','customers.namePlaceholder'));fireEvent.change(input,{target:{value:'Kept name'}});const form=input.closest('form')!;fireEvent.submit(form);fireEvent.submit(form);expect(save).toHaveBeenCalledTimes(1);await act(async()=>finish(false));expect(input).toHaveValue('Kept name');expect(screen.getByRole('alert')).toHaveTextContent(translate('en','pos.catalogWriteFailed'));});
it('dört dilde katalog ve retry metinleri mevcuttur',()=>{for(const lang of ['tr','tm','en','ru'] as const)for(const key of ['pos.catalogWriteFailed','pos.pcMirrorRetry','pos.pcMirrorRetrying'])expect(translate(lang as any,key as any)).not.toEqual(key);});
