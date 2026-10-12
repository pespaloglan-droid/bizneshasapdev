import { useEffect, type DependencyList } from 'react';
/** Kaynağı kullanan effect'ten ayrı, bağımlılık değişimi/unmount temizliği. */
export function useCleanup(dispose: () => void, dependencies: DependencyList): void {
  useEffect(() => {
    let disposed = false;
    return () => { if (!disposed) { disposed = true; dispose(); } };
    // Çağıran kaynak kapsamını dependencies ile belirtir (useEffect sözleşmesi).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
