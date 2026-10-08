import { useEffect, useState } from 'react';
import type {
  AppUser,
  CurrencyRate,
  Ledger,
  Targow,
  TargowRegion,
  User,
  Warehouse,
} from '../types';
import {
  deleteWarehouseFromDb,
  getWarehousesForAccount,
  saveWarehouseToDb,
} from '../db/warehouseService';
import { deleteUserFromDb, ensureAccountUsersSeeded, saveUserToDb } from '../db/userService';
import {
  deleteUnit as deleteUnitFromDb,
  ensureUnitsSeeded,
  saveUnit as saveUnitToDb,
  type MeasurementUnit,
} from '../db/unitService';
import {
deleteCurrencyFromDb,
ensureBaseCurrencySeeded,
getCurrenciesForAccount,
saveCurrencyToDb,
} from '../db/currencyService';
import { deleteLedgerFromDb, getLedgersForAccount, saveLedgerToDb } from '../db/ledgerService';
import {
  deleteRegionFromDb,
  deleteTargowFromDb,
  getRegionsForAccount,
  getTargowsForAccount,
  saveRegionToDb,
  saveTargowToDb,
} from '../db/targowService';

export interface ModuleStores {
  readonly warehouses: Warehouse[];
  readonly appUsers: AppUser[];
  readonly currencies: CurrencyRate[];
  readonly ledgers: Ledger[];
  readonly targows: Targow[];
  readonly regions: TargowRegion[];
  readonly addWarehouse: (warehouse: Warehouse) => void;
  readonly updateWarehouse: (warehouse: Warehouse) => void;
  readonly deleteWarehouse: (id: string) => void;
  readonly addUser: (user: AppUser) => void;
  readonly updateUser: (user: AppUser) => void;
  readonly deleteUser: (id: string) => void;
  readonly saveCurrency: (currency: CurrencyRate) => void;
  readonly deleteCurrency: (currency: CurrencyRate) => void;
  readonly saveLedger: (ledger: Ledger) => void;
  readonly deleteLedger: (ledger: Ledger) => void;
  readonly saveTargow: (targow: Targow) => void;
  readonly deleteTargow: (targow: Targow) => void;
  readonly saveRegion: (region: TargowRegion) => void;
  readonly deleteRegion: (region: TargowRegion) => void;
  readonly units: MeasurementUnit[];
  readonly saveUnit: (unit: MeasurementUnit) => void;
  readonly deleteUnit: (unit: MeasurementUnit) => void;
}

function sortByName<T extends { name: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

function sortWarehouses(list: Warehouse[]): Warehouse[] {
  return [...list].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name, 'tr');
  });
}

export function useModuleStores(
  storeDb: string,
  accountUsers: readonly User[] = []
): ModuleStores {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [targows, setTargows] = useState<Targow[]>([]);
  const [regions, setRegions] = useState<TargowRegion[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [loadedWarehouses, loadedUsers, loadedCurrencies, loadedLedgers, loadedTargows, loadedRegions, loadedUnits] =
        await Promise.all([
          getWarehousesForAccount(storeDb),
          ensureAccountUsersSeeded(accountUsers, storeDb),
          getCurrenciesForAccount(storeDb).then(ensureBaseCurrencySeeded),
          getLedgersForAccount(storeDb),
          getTargowsForAccount(storeDb),
          getRegionsForAccount(storeDb),
          ensureUnitsSeeded(storeDb),
        ]);
      if (cancelled) return;
      setWarehouses(loadedWarehouses);
      setAppUsers(loadedUsers);
      setCurrencies(loadedCurrencies);
      setLedgers(loadedLedgers);
      setTargows(loadedTargows);
      setRegions(loadedRegions);
      setUnits(loadedUnits);
    })();
    return () => {
      cancelled = true;
    };
  }, [storeDb, accountUsers]);

  const addWarehouse = (warehouse: Warehouse) => {
    setWarehouses((prev) =>
      sortWarehouses(
        warehouse.isDefault
          ? [warehouse, ...prev.map((item) => ({ ...item, isDefault: false }))]
          : [warehouse, ...prev]
      )
    );
    saveWarehouseToDb(warehouse, storeDb).catch(() => {});
  };

  const updateWarehouse = (warehouse: Warehouse) => {
    setWarehouses((prev) =>
      sortWarehouses(
        prev.map((item) => {
          if (item.id === warehouse.id) return warehouse;
          if (warehouse.isDefault) return { ...item, isDefault: false };
          return item;
        })
      )
    );
    saveWarehouseToDb(warehouse, storeDb).catch(() => {});
  };

  const deleteWarehouse = (id: string) => {
    setWarehouses((prev) => prev.filter((item) => item.id !== id));
    deleteWarehouseFromDb(id, storeDb).catch(() => {});
  };

  const sortUsers = (list: AppUser[]) =>
    [...list].sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'));

  const addUser = (user: AppUser) => {
    setAppUsers((prev) => sortUsers([...prev, user]));
    saveUserToDb(user, storeDb).catch(() => {});
  };

  const updateUser = (user: AppUser) => {
    setAppUsers((prev) => sortUsers(prev.map((item) => (item.id === user.id ? user : item))));
    saveUserToDb(user, storeDb).catch(() => {});
  };

  const deleteUser = (id: string) => {
    setAppUsers((prev) => prev.filter((item) => item.id !== id));
    deleteUserFromDb(id, storeDb).catch(() => {});
  };

  const saveCurrency = (currency: CurrencyRate) => {
    setCurrencies((prev) => {
      const exists = prev.some((item) => item.id === currency.id);
      return [...(exists ? prev.map((item) => (item.id === currency.id ? currency : item)) : [...prev, currency])].sort(
        (a, b) => a.code.localeCompare(b.code, 'tr')
      );
    });
    saveCurrencyToDb(currency, storeDb).catch(() => {});
  };

  const deleteCurrency = (currency: CurrencyRate) => {
    setCurrencies((prev) => prev.filter((item) => item.id !== currency.id));
    deleteCurrencyFromDb(currency.id, storeDb).catch(() => {});
  };

  const upsertLedger = (ledger: Ledger) => {
    setLedgers((prev) => {
      const exists = prev.some((item) => item.id === ledger.id);
      return sortByName(
        exists ? prev.map((item) => (item.id === ledger.id ? ledger : item)) : [...prev, ledger]
      );
    });
    saveLedgerToDb(ledger, storeDb).catch(() => {});
  };

  const deleteLedger = (ledger: Ledger) => {
    setLedgers((prev) => prev.filter((item) => item.id !== ledger.id));
    deleteLedgerFromDb(ledger.id, storeDb).catch(() => {});
  };

  const saveTargow = (targow: Targow) => {
    setTargows((prev) => {
      const exists = prev.some((item) => item.id === targow.id);
      return [...(exists ? prev.map((item) => (item.id === targow.id ? targow : item)) : [...prev, targow])].sort(
        (a, b) => a.fullName.localeCompare(b.fullName, 'tr')
      );
    });
    saveTargowToDb(targow, storeDb).catch(() => {});
  };

  const deleteTargow = (targow: Targow) => {
    setTargows((prev) => prev.filter((item) => item.id !== targow.id));
    deleteTargowFromDb(targow.id, storeDb).catch(() => {});
  };

  const saveRegion = (region: TargowRegion) => {
    setRegions((prev) => {
      const exists = prev.some((item) => item.id === region.id);
      return sortByName(
        exists ? prev.map((item) => (item.id === region.id ? region : item)) : [...prev, region]
      );
    });
    saveRegionToDb(region, storeDb).catch(() => {});
  };

  const deleteRegion = (region: TargowRegion) => {
    setRegions((prev) => prev.filter((item) => item.id !== region.id));
    deleteRegionFromDb(region.id, storeDb).catch(() => {});
  };

  const saveUnit = (unit: MeasurementUnit) => {
    setUnits((prev) => {
      const exists = prev.some((item) => item.id === unit.id);
      const next = exists
        ? prev.map((item) => (item.id === unit.id ? unit : item))
        : [...prev, unit];
      return [...next].sort((a, b) => a.labelTm.localeCompare(b.labelTm, 'tr'));
    });
    saveUnitToDb(unit, storeDb).catch(() => {});
  };

  const deleteUnit = (unit: MeasurementUnit) => {
    setUnits((prev) => prev.filter((item) => item.id !== unit.id));
    deleteUnitFromDb(unit.id, storeDb).catch(() => {});
  };

  return {
    warehouses,
    appUsers,
    currencies,
    ledgers,
    targows,
    regions,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    addUser,
    updateUser,
    deleteUser,
    saveCurrency,
    deleteCurrency,
    saveLedger: upsertLedger,
    deleteLedger,
    saveTargow,
    deleteTargow,
    saveRegion,
    deleteRegion,
    units,
    saveUnit,
    deleteUnit,
  };
}