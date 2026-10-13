import {afterEach,expect,it,vi} from 'vitest';
vi.mock('../../src/db/pouch',()=>({startCouchDbSync:vi.fn(()=>vi.fn()),getLocalDatabase:vi.fn(),upsertDoc:vi.fn(),upsertDocsBatch:vi.fn(),resetLocalDatabaseForReplacement:vi.fn()}));
import {startCouchDbSync} from '../../src/db/pouch';
import {startConnection,stopCurrent} from '../../src/db/connectionStore';
const response={ok:true,status:200,json:async()=>({doc_count:2})} as Response;
afterEach(()=>{stopCurrent();vi.unstubAllGlobals();vi.clearAllMocks();localStorage.clear();});
it('P2-3 geç tamamlanan eski hesap testi yeni syncini öldürmez',async()=>{
  let release!:(r:Response)=>void;const delayed=new Promise<Response>(r=>release=r);
  vi.stubGlobal('fetch',vi.fn().mockImplementationOnce(()=>delayed).mockResolvedValue(response));
  const common={kind:'local' as const,onStatus:vi.fn(),mergeChoice:'merge' as const};
  const a=startConnection({...common,accountId:'A',storeDb:'store_A',raw:'http://fixture:fixture-pass@a.local:5984/a'});
  await startConnection({...common,accountId:'B',storeDb:'store_B',raw:'http://fixture:fixture-pass@b.local:5984/b'});
  expect(startCouchDbSync).toHaveBeenCalledTimes(1);expect(vi.mocked(startCouchDbSync).mock.calls[0][0]).toBe('store_B');
  const stop=vi.mocked(startCouchDbSync).mock.results[0].value;
  release(response);expect((await a).ok).toBe(false);expect(stop).not.toHaveBeenCalled();
  stopCurrent('A');expect(stop).not.toHaveBeenCalled();stopCurrent('B');expect(stop).toHaveBeenCalledOnce();
});
it('P2-3 unmount pending bağlantı girişimini de iptal eder',async()=>{
  let release!:(r:Response)=>void;const delayed=new Promise<Response>(r=>release=r);
  vi.stubGlobal('fetch',vi.fn().mockImplementationOnce(()=>delayed).mockResolvedValue(response));
  const request=startConnection({accountId:'A',storeDb:'store_A',kind:'local',raw:'http://fixture:fixture-pass@a.local:5984/a',onStatus:vi.fn(),mergeChoice:'merge'});
  stopCurrent('A');release(response);expect((await request).ok).toBe(false);expect(startCouchDbSync).not.toHaveBeenCalled();
});
