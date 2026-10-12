import { useState } from 'react';
import type { SheetData } from '../utils/excelIO';
import {
  detectExcelColumns, selectExcelHeader, validExcelSelection,
  type ExcelColumnSelection, type ImportColumn,
} from '../utils/excelColumnMapping';

export function useExcelColumnMapping<Key extends string>(columns: readonly ImportColumn<Key>[]) {
  const [data, setData] = useState<SheetData | null>(null);
  const [selection, setSelection] = useState<ExcelColumnSelection<Key> | null>(null);
  const [isMapping, setIsMapping] = useState(false);
  const isValid = data !== null && selection !== null && validExcelSelection(data, columns, selection);

  return {
    data, selection, isMapping, isValid,
    clear() { setData(null); setSelection(null); setIsMapping(false); },
    load(sheet: SheetData) {
      const detected = detectExcelColumns(sheet, columns);
      setData(sheet);
      setSelection(detected);
      setIsMapping(!validExcelSelection(sheet, columns, detected));
    },
    edit() { setIsMapping(true); },
    chooseHeader(headerIndex: number) {
      if (!data || !Number.isInteger(headerIndex) || headerIndex < 0 || headerIndex >= data.length - 1) return;
      setSelection(selectExcelHeader(data, headerIndex, columns));
    },
    chooseColumn(key: Key, index: number | undefined) {
      setSelection((current) => {
        if (!current) return current;
        const mapping = { ...current.mapping };
        if (index === undefined) delete mapping[key];
        else mapping[key] = index;
        return { ...current, mapping, ambiguousKeys: current.ambiguousKeys?.filter((item) => item !== key) };
      });
    },
    confirm() {
      if (!isValid) return;
      setIsMapping(false);
    },
  };
}
