import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/db/pouch', () => ({ upsertDoc: vi.fn(), upsertDocsBatch: vi.fn(), listDocsByPrefix: vi.fn(), removeDoc: vi.fn() }));
vi.mock('../../src/db/schemaBridge', () => ({ mirrorToPc: vi.fn() }));
import { upsertDoc } from '../../src/db/pouch';
import { mirrorToPc } from '../../src/db/schemaBridge';
import { saveInvoiceToDb } from '../../src/db/salesService';
import { saveProductToDb } from '../../src/db/productService';
import { saveCustomerToDb } from '../../src/db/customerService';
beforeEach(() => { vi.clearAllMocks(); vi.mocked(upsertDoc).mockResolvedValue(undefined); vi.mocked(mirrorToPc).mockResolvedValue(undefined); });
describe('P0-2 birincil yazım başarısı şarttır', () => {
  for (const [name, save] of [['invoice', saveInvoiceToDb], ['product', saveProductToDb], ['customer', saveCustomerToDb]] as const) {
    it(`${name}: her birincil hata iletilir, ayna çağrılmaz`, async () => {
      for (const code of ['LICENSE_REQUIRED', 'QUOTA', 'CONFLICT']) {
        const error = new Error(code); vi.mocked(upsertDoc).mockRejectedValueOnce(error);
        await expect(save({ id: 'test' } as never, 'test-store')).rejects.toBe(error);
      }
      expect(mirrorToPc).not.toHaveBeenCalled();
    });
    it(`${name}: ayna hatası birincil kaydı başarısız göstermez`, async () => {
      const doc = { id: 'test' }; vi.mocked(mirrorToPc).mockRejectedValueOnce(new Error('private-value'));
      await expect(save(doc as never, 'test-store')).resolves.toBe(doc);
    });
  }
});
