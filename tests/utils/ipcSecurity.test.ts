import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { vi } from 'vitest';
import { expect, it } from 'vitest';
const require=createRequire(import.meta.url);
const {isTrustedMainFrame,matchesSelectedAccount}=require('../../electron/ipc-trust.cjs');
const {redactSecrets}=require('../../electron/redact-secrets.cjs');
it('P2-5 sadece uygulama ana frame ve webContents kimliği IPC kullanır',()=>{
  const frame={url:'file:///app/dist/index.html'},wc={id:7,mainFrame:frame},win={webContents:wc,isDestroyed:()=>false};
  expect(isTrustedMainFrame({sender:wc,senderFrame:frame},win,frame.url)).toBe(true);
  expect(isTrustedMainFrame({sender:wc,senderFrame:{...frame}},win,frame.url)).toBe(false);
  expect(isTrustedMainFrame({sender:{...wc},senderFrame:frame},win,frame.url)).toBe(false);
  expect(isTrustedMainFrame({sender:wc,senderFrame:frame},win,'https://evil.invalid/')).toBe(false);
});
it('P2-5 başka hesap veya pencere seçili lisans ile anahtar türetemez',()=>{
  expect(matchesSelectedAccount('A','A',7,7)).toBe(true);
  expect(matchesSelectedAccount('B','A',7,7)).toBe(false);
  expect(matchesSelectedAccount('A','A',8,7)).toBe(false);
  expect(matchesSelectedAccount(null,null,7,7)).toBe(false);
});
it('P2-5 Basic ve URL credential hem production hem dev logundan temizlenir',()=>{
  for (const production of [true,false]) {
    const safe=redactSecrets('https://qa:fake-pass@example.invalid/db Authorization: Basic ZmFrZTpwYXNz',production);
    expect(safe).not.toContain('fake-pass');expect(safe).not.toContain('ZmFrZTpwYXNz');
  }
});
it('P2-5 native IPC bağlama ve lisanssız yan kanallar sıkılaştırılmıştır',()=>{
  const main=fs.readFileSync(path.resolve('electron/main.cjs'),'utf8');
  expect(main).toContain("guardedIPC('clipboard-write', 0,");expect(main).toContain("guardedIPC('scale-status', gate.MOD.STOK,");
  expect(main).toContain('selectedLicenseOwner = accountId ? _e.sender.id : null;');
  expect(main).toContain('matchesSelectedAccount(accountId, requireSelectedLicenseId(_e)');
  expect(main).toContain('sandbox: true');
});

it('P2-5 gerçek main handler hesabı seçer; farklı hesap ve frame anahtar/guard reddedilir',async()=>{
  const handlers=new Map<string,Function>();let window:any;
  class Window {
    webContents={id:7,mainFrame:{url:''}};
    constructor(){window=this;}
    isDestroyed(){return false;}
    loadFile(file:string){this.webContents.mainFrame.url=require('node:url').pathToFileURL(file).href;return Promise.resolve();}
    loadURL(url:string){this.webContents.mainFrame.url=url;return Promise.resolve();}
  }
  const native={setDataDir:vi.fn(),deriveKey:vi.fn(()=>[1,2,3])};
  const gate={MOD:{STOK:4,AYARLAR:256,RAPOR:64,SATIS:1},selectAccount:vi.fn(),guard:vi.fn(()=>({allowed:true}))};
  const app={isPackaged:true,requestSingleInstanceLock:()=>true,on:vi.fn(),whenReady:()=>({then:(fn:Function)=>fn()}),getPath:()=>'/tmp/mock-license'};
  const electron={app,BrowserWindow:Window,dialog:{},ipcMain:{on:vi.fn(),handle:(name:string,fn:Function)=>handlers.set(name,fn)}};
  vm.runInNewContext(fs.readFileSync(path.resolve('electron/main.cjs'),'utf8'),{
    require:(name:string)=>name==='electron'?electron:name.includes('license-native/native')?native:name.includes('license-native/gate')?gate:
      name==='./telemetry.cjs'?{setupCrashReporting:()=>{}}:name==='./auto-update.cjs'?{startAutoUpdates:()=>{}}:name==='../package.json'?{}:
      name.startsWith('./')?require(path.resolve('electron',name)):require(name),
    __dirname:path.resolve('electron'),process:{env:{NODE_ENV:'production'},platform:'linux'},console,Buffer,
  });
  const event={sender:window.webContents,senderFrame:window.webContents.mainFrame};
  const a='0000-0000-0000-00',b='1111-1111-1111-11';
  expect(await handlers.get('license-select-account')!(event,a)).toBe(a);
  expect(await handlers.get('license-derive-key')!(event,b,'db')).toBeNull();
  expect(await handlers.get('license-guard')!(event,'checkout',b)).toMatchObject({allowed:false});
  expect(native.deriveKey).not.toHaveBeenCalled();
  expect(await handlers.get('license-derive-key')!(event,a,'db')).toEqual([1,2,3]);
  await expect(handlers.get('license-select-account')!({...event,senderFrame:{...event.senderFrame}},b)).rejects.toThrow('UNTRUSTED_IPC');
  expect(await handlers.get('license-select-account')!(event,b)).toBe(b); // Meşru hesap değişimi kapanmaz.
  expect(await handlers.get('license-derive-key')!(event,a,'db')).toBeNull();
});
