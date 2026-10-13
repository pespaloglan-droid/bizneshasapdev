'use strict';
function redactSecrets(message, production = true) {
  let cleaned = String(message ?? '');
  // Dev logları da parolayı veya Authorization header'ı gösteremez.
  cleaned = cleaned.replace(/(:\/\/)[^:@/\s]+:[^@/\s]+@/g, '$1***:***@')
    .replace(/(Basic\s+)[\w+/=]+/gi, '$1***');
  if (!production) return cleaned;
  return cleaned.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '***.***.***.***')
    .replace(/:\d{4,5}\b/g, ':****').replace(/\/[a-z0-9_-]{3,}/gi, '/***')
    .replace(/[A-Z]:\\[^\s]*/gi, 'C:\\***').replace(/\/home\/[^\s]*/gi, '/home/***');
}
module.exports = { redactSecrets };
