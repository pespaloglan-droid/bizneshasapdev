import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.electronAPI for tests
global.window = global.window || ({} as any);
(global.window as any).electronAPI = {
  deriveLicenseKey: vi.fn().mockResolvedValue(null),
  getLicenseInfo: vi.fn().mockResolvedValue({ status: -5, accountId: 'test-account' }),
  getLicenseRequestCode: vi.fn().mockResolvedValue('TEST1234567890123456'),
  activateLicense: vi.fn().mockResolvedValue(1),
  setLicenseRoot: vi.fn().mockResolvedValue(1),
  copyToClipboard: vi.fn().mockResolvedValue(true),
};
