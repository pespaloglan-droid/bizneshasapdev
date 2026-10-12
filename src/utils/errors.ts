import { translate } from '../locales/i18n';
import { getActiveLanguage } from './locale';
export class BiznesHasapError extends Error {
  constructor(readonly code: string, message: string, readonly cause?: unknown) {
    super(message); this.name = new.target.name;
  }
}
export class DatabaseError extends BiznesHasapError {
  constructor(message = translate(getActiveLanguage(), 'errors.databaseFailure'), cause?: unknown) { super('DATABASE_ERROR', message, cause); }
}
export class LicenseError extends BiznesHasapError {
  constructor(message = translate(getActiveLanguage(), 'errors.licenseFailure'), cause?: unknown) { super('LICENSE_ERROR', message, cause); }
}
export class SyncError extends BiznesHasapError {
  constructor(message = translate(getActiveLanguage(), 'errors.syncFailure'), cause?: unknown) { super('SYNC_ERROR', message, cause); }
}
export class ValidationError extends BiznesHasapError {
  constructor(message = translate(getActiveLanguage(), 'errors.validationFailure'), cause?: unknown) { super('VALIDATION_ERROR', message, cause); }
}
