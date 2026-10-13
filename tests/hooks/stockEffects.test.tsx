import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
vi.mock('../../src/db/productService',()=>({adjustProductStock:vi.fn().mockResolvedValue({id:'p',stock:68,sku:'00001'})}));
vi.mock('../../src/db/customerService',()=>({adjustCustomerBalance:vi.fn()}));
import { adjustProductStock } from '../../src/db/productService';
import { useInvoiceEffects } from '../../src/hooks/useInvoiceEffects';
import { LanguageProvider } from '../../src/locales/LanguageContext';
it('P1-4 aynı ürünün farklı birimleri tüm satırlardan baz stoğa toplanır',async()=>{
  const wrapper=({children}:{children:React.ReactNode})=><LanguageProvider language="en">{children}</LanguageProvider>;
  const opts={storeDb:'QA',products:[{id:'p',stock:100,unit:'Sany',unit2:'Box',unit2Qty:10}],compositionMapRef:{current:new Map()},customers:[],setProducts:vi.fn(),setCustomers:vi.fn(),setSelectedCustomer:vi.fn()} as any;
  const {result}=renderHook(()=>useInvoiceEffects(opts),{wrapper});
  await act(async()=>{expect(await result.current.applyStockChanges([{productId:'p',unit:'Sany',qty:2},{productId:'p',unit:'Box',qty:3}] as any,'sales')).toEqual({failed:[]});});
  expect(adjustProductStock).toHaveBeenCalledWith('p',-32,'QA');expect(adjustProductStock).toHaveBeenCalledTimes(1);
});
