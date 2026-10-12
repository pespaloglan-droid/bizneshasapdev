let sequence = 0;
/** İşlem adı sabit teknik etiket olmalıdır; belge/hESAP ID'si veya veri içermez. */
export async function measureOperation<T>(operationName: string, operation: () => T | Promise<T>): Promise<T> {
  const name = /^[a-z][a-z0-9._-]{0,63}$/i.test(operationName) ? operationName : 'operation';
  const id = `bh.${name}.${++sequence}`;
  const perf = globalThis.performance;
  const started = perf?.now?.() ?? Date.now();
  let marked = false;
  try { if (perf?.mark) { perf.mark(`${id}.start`); marked = true; } } catch {}
  try { return await operation(); }
  finally {
    const elapsed = (perf?.now?.() ?? Date.now()) - started;
    try { if (marked) { perf.mark(`${id}.end`); perf.measure(id, `${id}.start`, `${id}.end`); } } catch {}
    if (elapsed > 1000) console.warn('[Performance]', name, Math.round(elapsed));
    try { perf?.clearMarks?.(`${id}.start`); perf?.clearMarks?.(`${id}.end`); perf?.clearMeasures?.(id); } catch {}
  }
}
