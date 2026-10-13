import { afterEach, expect, it } from 'vitest';
import { loadConnection, saveConnection } from '../../src/db/connectionStore';
import { loadSyncConfig, saveSyncConfig } from '../../src/db/syncService';
import { usesPlainHttp } from '../../src/db/credentialStorage';
afterEach(()=>localStorage.clear());
const raw='https://qa-user:test%3A%C5%9Fifre%40qa@example.invalid/test-db';
it('P1-6 eski hesap URL migrasyonu düz credential bırakmaz, UTF-8 adres aynen okunur',()=>{
  localStorage.setItem('bh_couch_conn_A',JSON.stringify({local:raw,online:raw,active:'online',historyMonths:3}));
  expect(loadConnection('A')).toMatchObject({local:raw,online:raw,historyMonths:3});
  expect(localStorage.getItem('bh_couch_conn_A')).not.toContain('qa-user:');
  expect(localStorage.getItem('bh_couch_conn_A_credentials')).not.toContain('test%3A');
  saveConnection('A',{local:'http://qa:incomplete@',online:raw,active:null});
  expect(loadConnection('A').local).toBe('http://qa:incomplete@');
  expect(localStorage.getItem('bh_couch_conn_A')).not.toContain('qa:incomplete@');
});
it('P1-6 eski sync parola ve endpoint URL migrasyonu uyumludur',()=>{
  const config={endpoints:[{id:'lan',kind:'lan',url:raw},{id:'domain',kind:'domain',url:raw}],username:'qa-user',password:'fake-test-parola',enabled:true} as any;
  localStorage.setItem('bh_sync_config',JSON.stringify(config));
  expect(loadSyncConfig()).toMatchObject({password:config.password,endpoints:config.endpoints});
  expect(localStorage.getItem('bh_sync_config')).not.toContain(config.password);
  expect(localStorage.getItem('bh_sync_config')).not.toContain('qa-user:');
  saveSyncConfig(config);expect(loadSyncConfig().password).toBe(config.password);
});
it('P1-6 online HTTP uyarı koşulu HTTPS bağlantıyı işaretlemez',()=>{
  expect(usesPlainHttp('http://qa:fake@example.invalid/db')).toBe(true);
  expect(usesPlainHttp(raw)).toBe(false);expect(usesPlainHttp('')).toBe(false);
});
