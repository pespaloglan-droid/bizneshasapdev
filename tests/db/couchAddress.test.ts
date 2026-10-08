import { describe, it, expect } from 'vitest';
import {
  parseCouchDbAddress,
  isParsableAddress,
  basicAuth,
  redactSecrets,
  addressErrorMessage,
  describeStatus,
  describeFetchError,
} from '../../src/db/couchAddress';

describe('parseCouchDbAddress', () => {
  it('tam adres ayrıştırılır', () => {
    const a = parseCouchDbAddress('http://user:pass@192.168.1.8:5984/bim_market');
    expect(a).toMatchObject({
      protocol: 'http', username: 'user', password: 'pass',
      host: '192.168.1.8', port: 5984, database: 'bim_market',
      remoteUrl: 'http://192.168.1.8:5984/bim_market',
    });
  });

  it('şema yazılmamışsa http varsayılır', () => {
    const a = parseCouchDbAddress('user:pass@192.168.1.8:5984/db');
    expect(a.protocol).toBe('http');
    expect(a.port).toBe(5984);
  });

  it('port yazılmamışsa şema varsayılanı kullanılır', () => {
    expect(parseCouchDbAddress('http://u:p@sunucu/db').port).toBe(5984);
    expect(parseCouchDbAddress('https://u:p@sunucu/db').port).toBe(443);
  });

  it('URL-kodlü parola çözülür', () => {
    const a = parseCouchDbAddress('http://user:HMX%40123@sunucu:5984/db');
    expect(a.password).toBe('HMX@123');
  });

  it('remoteUrl kimlik bilgisi İÇERMEZ', () => {
    const a = parseCouchDbAddress('http://user:gizli@sunucu:5984/db');
    expect(a.remoteUrl).not.toContain('gizli');
    expect(a.remoteUrl).not.toContain('user@');
  });

  it('sondaki eğik çizgi veritabanı adından temizlenir', () => {
    expect(parseCouchDbAddress('http://u:p@sunucu:5984/db/').database).toBe('db');
  });

  it('boş adres → empty', () => {
    expect(() => parseCouchDbAddress('')).toThrowError('empty');
    expect(() => parseCouchDbAddress('   ')).toThrowError('empty');
  });

  it('veritabanı yoksa → noDatabase', () => {
    expect(() => parseCouchDbAddress('http://u:p@sunucu:5984')).toThrowError('noDatabase');
    expect(() => parseCouchDbAddress('http://u:p@sunucu:5984/')).toThrowError('noDatabase');
  });

  it('kimlik bilgisi yoksa → noCredentials', () => {
    expect(() => parseCouchDbAddress('http://sunucu:5984/db')).toThrowError('noCredentials');
    expect(() => parseCouchDbAddress('http://user:@sunucu:5984/db')).toThrowError('noCredentials');
  });

  it('desteklenmeyen şema → badFormat', () => {
    expect(() => parseCouchDbAddress('ftp://u:p@sunucu/db')).toThrowError('badFormat');
  });

  it('isParsableAddress', () => {
    expect(isParsableAddress('http://u:p@sunucu:5984/db')).toBe(true);
    expect(isParsableAddress('')).toBe(false);
    expect(isParsableAddress('http://sunucu/db')).toBe(false);
  });
});

describe('basicAuth', () => {
  it('Basic base64 üretir', () => {
    expect(basicAuth('user', 'pass')).toBe(`Basic ${btoa('user:pass')}`);
  });

  it('Türkçe karakterli parola UTF-8 ile kodlanır', () => {
    const auth = basicAuth('user', 'şifrë');
    expect(auth.startsWith('Basic ')).toBe(true);
    // bozulmadan base64 üretildiğini doğrula (btoa Latin-1 dışında patlardı)
    expect(auth.length).toBeGreaterThan(6);
  });
});

describe('redactSecrets', () => {
  it('parola metinden silinir', () => {
    const out = redactSecrets('Hata: http://user:HMX2004@sunucu açılamadı', ['HMX2004']);
    expect(out).not.toContain('HMX2004');
  });

  it('URL kullanıcı:parola@ kalıbı temizlenir', () => {
    const out = redactSecrets('GET http://admin:s3cr3t@host/db failed', []);
    expect(out).not.toContain('s3cr3t');
  });

  it('Authorization header değeri temizlenir', () => {
    const out = redactSecrets('Authorization: Basic dXNlcjpwYXNz gönderildi', []);
    expect(out).not.toContain('dXNlcjpwYXNz');
  });

  it('3 karakterden kısa sırlar atlanır (aşırı silme yok)', () => {
    const out = redactSecrets('a b c normal metin', ['a', 'b']);
    expect(out).toBe('a b c normal metin');
  });

  it('undefined sırlar güvenle atlanır', () => {
    expect(redactSecrets('metin', [undefined, undefined])).toBe('metin');
  });
});

describe('addressErrorMessage', () => {
  it('bilinen kodlar Türkçe mesaj döner', () => {
    expect(addressErrorMessage('empty')).toContain('Adres boş');
    expect(addressErrorMessage('badFormat')).toContain('Adres okunamadı');
    expect(addressErrorMessage('noDatabase')).toContain('Veritabanı adı eksik');
    expect(addressErrorMessage('noCredentials')).toContain('Kullanıcı adı veya şifre eksik');
  });

  it('bilinmeyen kod genel mesaj döner', () => {
    expect(addressErrorMessage('ufo')).toBe('Adres geçersiz.');
  });
});

describe('describeStatus', () => {
  const addr = { host: 'h', port: 5984, database: 'db1' };

  it('401/403 → kimlik hatası', () => {
    expect(describeStatus(401, addr)).toContain('Kullanıcı adı veya şifre hatalı');
    expect(describeStatus(403, addr)).toContain('Kullanıcı adı veya şifre hatalı');
  });

  it('404 → veritabanı adıyla birlikte', () => {
    expect(describeStatus(404, addr)).toContain('db1');
  });

  it('405 → CORS ipucu', () => {
    expect(describeStatus(405, addr)).toContain('CORS');
  });

  it('408/504 → zaman aşımı', () => {
    expect(describeStatus(504, addr)).toContain('Zaman aşımı');
  });

  it('5xx → sunucu hatası', () => {
    expect(describeStatus(500, addr)).toContain('HTTP 500');
  });

  it('diğer kodlar ham döner', () => {
    expect(describeStatus(418, addr)).toContain('418');
  });
});

describe('describeFetchError', () => {
  const addr = { protocol: 'http' as const, host: 'h', port: 5984, database: 'db' };

  it('AbortError → zaman aşımı mesajı', () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    expect(describeFetchError(err, addr)).toContain('Zaman aşımı');
  });

  it('Failed to fetch → olası nedenler listelenir', () => {
    const out = describeFetchError(new Error('Failed to fetch'), addr);
    expect(out).toContain('Sunucuya ulaşılamıyor');
    expect(out).toContain('güvenlik duvarı');
  });

  it('hata metnindeki parola sızdırılmaz', () => {
    const out = describeFetchError(
      new Error('Bağlantı hatası: http://u:TopSecret123@h reddetti'),
      addr,
      ['TopSecret123']
    );
    expect(out).not.toContain('TopSecret123');
  });

  it('Error olmayan değerler de işlenir', () => {
    expect(describeFetchError('düz hata', addr)).toContain('Bağlantı hatası');
    expect(describeFetchError(null, addr)).toContain('Bağlantı hatası');
  });
});
