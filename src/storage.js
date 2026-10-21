import {blank,validate} from './model.js';
const KEY='kdesk.workspace.v2',LEGACY='recruiter-desk.state.v1';
export class Store{
 constructor(){this.db=null;this.revision=0;this.serial=Promise.resolve();this.mode='memory';this.saved=null;}
 async open(){
  this.db=await new Promise(resolve=>{let done=false;const finish=v=>{if(done){v?.close();return;}done=true;resolve(v);};try{const q=indexedDB.open('kdesk-local',1);q.onupgradeneeded=()=>q.result.createObjectStore('records');q.onsuccess=()=>finish(q.result);q.onerror=()=>finish(null);q.onblocked=()=>finish(null);setTimeout(()=>finish(null),2500);}catch{finish(null);}});
  let disk=null,local=null,legacy=null;try{if(this.db)disk=await this.read('workspace');}catch{}
  try{local=JSON.parse(localStorage.getItem(KEY)||'null');legacy=localStorage.getItem(LEGACY);}catch{}
  const newest=[disk,local].filter(Boolean).sort((a,b)=>b.revision-a.revision)[0];
  if(newest){this.revision=newest.revision;this.saved=validate(newest.data);this.mode=disk===newest?'database':'fallback';return {state:this.saved};}
  if(legacy){try{return {state:blank(),legacy:validate(JSON.parse(legacy))};}catch{return {state:blank(),warning:'An older saved workspace could not be read. Keep the original file and import an exported backup.'};}}
  return {state:blank()};
 }
 read(key){return new Promise((resolve,reject)=>{const tx=this.db.transaction('records','readonly'),q=tx.objectStore('records').get(key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
 async save(data){
  const snapshot=structuredClone(data);const job=()=>this.write(snapshot);this.serial=this.serial.then(job,job);return this.serial;
 }
 async write(data){
  const currentLocal=(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch{return null;}})();
  if(currentLocal?.revision>this.revision)throw Error('Another tab saved changes. Export this tab before reloading.');
  const envelope={revision:Math.max(Date.now(),this.revision+1),data};
  let failed;
  if(this.db)try{
   await new Promise((resolve,reject)=>{const tx=this.db.transaction('records','readwrite'),store=tx.objectStore('records'),q=store.get('workspace');let conflict=false;
    q.onsuccess=()=>{if(q.result?.revision>this.revision){conflict=true;tx.abort();}else store.put(envelope,'workspace');};
    tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(Error(conflict?'Another tab saved changes. Export this tab before reloading.':'Browser database could not save.'));
   });this.mode='database';
  }catch(e){failed=e;if(e.message.includes('Another tab'))throw e;}
  if(!this.db||failed){try{localStorage.setItem(KEY,JSON.stringify(envelope));this.mode='fallback';}catch{throw Error('Changes are only in memory. Browser storage is unavailable or full. Export a backup before closing.');}}
  this.revision=envelope.revision;this.saved=data;return this.mode;
 }
 async draft(value){
  if(value)value={...value,updatedAt:Date.now()};
  if(this.db){try{await new Promise((resolve,reject)=>{const tx=this.db.transaction('records','readwrite'),s=tx.objectStore('records');value?s.put(value,'draft'):s.delete('draft');tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);});try{localStorage.removeItem(KEY+'.draft');}catch{}return;}catch{}}
  try{value?localStorage.setItem(KEY+'.draft',JSON.stringify(value)):localStorage.removeItem(KEY+'.draft');}catch{throw Error('Draft could not be saved. Keep this window open or copy the unfinished text.');}
 }
 async getDraft(){let disk=null,local=null;try{if(this.db)disk=await this.read('draft');}catch{}try{local=JSON.parse(localStorage.getItem(KEY+'.draft')||'null');}catch{}return [disk,local].filter(Boolean).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0]||null;}
}
