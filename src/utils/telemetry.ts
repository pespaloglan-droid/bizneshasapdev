import type { PostHog } from 'posthog-js';
export interface TelemetryConsent { analytics: boolean; crashes: boolean }
export const TELEMETRY_EVENT = 'bh:telemetry-consent';
const KEY = 'bh_telemetry_device_consent_v1';
const FEATURES = new Set(['checkout', 'money', 'customer', 'user', 'product', 'calculation', 'currency', 'ledger', 'warehouse', 'courier', 'settings']);
let client: PostHog | null = null;
let generation = 0;
export function readTelemetryConsent(): TelemetryConsent {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? '{}'); return { analytics: value.analytics === true, crashes: value.crashes === true }; }
  catch { return { analytics: false, crashes: false }; }
}
export function saveTelemetryConsent(consent: TelemetryConsent): void {
  localStorage.setItem(KEY, JSON.stringify({ analytics: consent.analytics === true, crashes: consent.crashes === true }));
  window.dispatchEvent(new CustomEvent(TELEMETRY_EVENT));
}
export function analyticsConfigured(): boolean {
  try { const host = new URL(import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com');
    return Boolean(import.meta.env.VITE_POSTHOG_KEY) && host.protocol === 'https:' && !host.username && !host.password; }
  catch { return false; }
}
export async function configureTelemetry(): Promise<void> {
  const current = ++generation; const consent = readTelemetryConsent();
  await window.electronAPI?.setCrashReportingConsent?.(consent.crashes).catch(() => {});
  if (current !== generation) return;
  if (!consent.analytics || !analyticsConfigured()) {
    client?.opt_out_capturing(); client = null; return;
  }
  if (client) return;
  const { PostHog } = await import('posthog-js');
  if (current !== generation || !readTelemetryConsent().analytics) return;
  const instance = new PostHog();
  client = instance;
  instance.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com',
    autocapture: false, capture_pageview: false, capture_pageleave: false,
    capture_exceptions: false, disable_session_recording: true,
    disable_surveys: true, advanced_disable_flags: true,
    advanced_disable_feature_flags: true, person_profiles: 'never', persistence: 'memory',
    disable_external_dependency_loading: true, request_batching: false,
    before_send(event) {
      if (!readTelemetryConsent().analytics || event.event !== 'bh.feature_selected' || !FEATURES.has(event.properties.feature)) return null;
      // SDK'nin URL/referrer/device/session ve diğer otomatik alanları atılır.
      return { ...event, properties: { distinct_id: event.properties.distinct_id, feature: event.properties.feature } };
    },
  });
}
export function trackFeature(feature: string): void {
  if (client && readTelemetryConsent().analytics && FEATURES.has(feature)) client.capture('bh.feature_selected', { feature });
}
