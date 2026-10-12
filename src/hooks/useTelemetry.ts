import { useEffect } from 'react';
import { configureTelemetry, TELEMETRY_EVENT, trackFeature } from '../utils/telemetry';
export function useTelemetry(feature: string): void {
  useEffect(() => {
    const update = () => { void configureTelemetry().catch(() => {}); };
    update(); window.addEventListener(TELEMETRY_EVENT, update);
    return () => window.removeEventListener(TELEMETRY_EVENT, update);
  }, []);
  useEffect(() => { trackFeature(feature); }, [feature]);
}
