import { Warehouse } from '../types';
import { listDocsByPrefix, removeDoc, upsertDoc } from './pouch';
import { sanitizeWarehouse } from './sanitize';

function warehouseDocId(warehouseId: string): string {
  return `warehouse_${warehouseId}`;
}

export async function saveWarehouseToDb(
  warehouse: Warehouse,
  dbName: string = 'default_store'
): Promise<Warehouse> {
  try {
    await upsertDoc(dbName, warehouseDocId(warehouse.id), {
      docType: 'warehouse',
      warehouse
    });

    if (warehouse.isDefault) {
      const others = (await getWarehousesForAccount(dbName)).filter(
        (w) => w.id !== warehouse.id && w.isDefault
      );
      for (const other of others) {
        const cleared = { ...other, isDefault: false };
        await upsertDoc(dbName, warehouseDocId(other.id), {
          docType: 'warehouse',
          warehouse: cleared
        });
      }
    }
  } catch (error) {
    console.error('Failed to save warehouse to PouchDB', error);
  }
  return warehouse;
}

export async function deleteWarehouseFromDb(
  warehouseId: string,
  dbName: string = 'default_store'
): Promise<boolean> {
  return removeDoc(dbName, warehouseDocId(warehouseId));
}

export async function getWarehousesForAccount(dbName: string = 'default_store'): Promise<Warehouse[]> {
  try {
    const docs = await listDocsByPrefix(dbName, 'warehouse_');
    return docs
      .filter((doc) => doc.docType === 'warehouse' && doc.warehouse)
      .map((doc) => sanitizeWarehouse(doc.warehouse))
      .filter((w): w is Warehouse => w !== null)
      .sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.name.localeCompare(b.name, 'tr');
      });
  } catch (error) {
    console.warn('Failed to load warehouses from PouchDB:', error);
    return [];
  }
}
