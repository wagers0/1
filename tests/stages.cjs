const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),assert=require('node:assert/strict');
(async()=>{
 const server=http.createServer((q,r)=>r.end(fs.readFileSync('dist/kdesk.html')));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const ctx=await browser.newContext({viewport:{width:1920,height:1100}}),p=await ctx.newPage();p.setDefaultTimeout(6000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const fixture={schemaVersion:1,candidates:[{id:'c',name:'Stage Test',onBench:true}],roles:[{id:'r',title:'First role',status:'Open'},{id:'r2',title:'Other role',status:'Open'}],submissions:[{id:'s',candidateId:'c',roleId:'r',stage:'Interviewing',nextAction:'Ask for feedback',followUpDate:'2026-01-01',history:[]},{id:'s2',candidateId:'c',roleId:'r2',stage:'Rejected',history:[]}]};
  await ctx.addInitScript(d=>{if(!localStorage.getItem('seeded')){localStorage.setItem('recruiter-desk.state.v1',JSON.stringify(d));localStorage.setItem('seeded','1');}},fixture);
  const url='http://127.0.0.1:'+server.address().port;await p.goto(url);await p.locator('[data-action="migrate"]').click();
  const expected=['Screening','Ready to Submit','Submitted','Interviewing','Waiting On Feedback','Offer','Onboarding','Placed','Not Proceeding'];
  assert.deepEqual(await p.locator('.board [data-drop]').evaluateAll(es=>es.map(e=>e.dataset.drop)),expected);
  const save=async()=>{await p.waitForTimeout(500);await p.getByText('✓ Saved on this device',{exact:true}).waitFor();};
  const snapshot=async()=>{await save();const download=p.waitForEvent('download');await p.locator('[data-action="backup"]').first().click();const f=await download;return JSON.parse(fs.readFileSync(await f.path(),'utf8')).state;};
  for(const stage of ['Waiting On Feedback','Onboarding','Not Proceeding']){
   const dt=await p.evaluateHandle(()=>new DataTransfer()),src=p.locator('[data-drag="s"]'),dest=p.locator('[data-drop="'+stage+'"]');await src.dispatchEvent('dragstart',{dataTransfer:dt});await dest.dispatchEvent('dragover',{dataTransfer:dt,clientY:500});await dest.dispatchEvent('drop',{dataTransfer:dt,clientY:500});await dt.dispose();await save();assert.equal(await dest.locator('.card').count(),1);
   await p.reload();await p.getByText('✓ Saved on this device',{exact:true}).waitFor();assert.equal(await p.locator('[data-drop="'+stage+'"] .card').count(),1);
   const d=await snapshot();assert.equal(d.submissions.find(s=>s.id==='s').stage,stage);assert.equal(d.submissions.find(s=>s.id==='s2').stage,'Rejected');assert.equal(d.candidates[0].onBench,true);assert.equal(d.submissions.find(s=>s.id==='s').history.at(-1).to,stage);
  }
  assert.equal(await p.locator('.metric').first().locator('strong').innerText(),'0');
  await p.locator('[data-action="nav"][data-id="followups"]').click();assert.equal(await p.locator('.task-row').count(),0);
  await p.locator('[data-action="nav"][data-id="pipeline"]').click();await p.locator('[data-filter="stage"]').selectOption('Not Proceeding');assert.equal(await p.locator('.board .card').count(),1);assert.equal(await p.locator('.inactive .card').count(),0);await p.locator('[data-action="clearFilters"]').click();assert.equal(await p.locator('.inactive .card').count(),1);
  await p.locator('[data-stage="s"]').selectOption('Onboarding');await p.locator('[data-action="undo"]').click();assert.equal(await p.locator('[data-drop="Not Proceeding"] .card').count(),1);
  await p.locator('[data-stage="s"]').selectOption('Waiting On Feedback');await p.locator('[data-action="nav"][data-id="followups"]').click();assert.equal(await p.locator('.task-row').count(),1);
  const exported=await snapshot();await p.locator('#backupFile').setInputFiles({name:'stages.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'kdesk-backup',schemaVersion:2,state:exported}))});p.once('dialog',d=>d.accept());await p.locator('[data-action="confirmRestore"]').click();await save();assert.deepEqual(await snapshot(),exported);
  await p.locator('[data-action="nav"][data-id="pipeline"]').click();await p.locator('[data-action="addPipeline"]').first().click();assert.deepEqual((await p.locator('#pipelineForm [name="stage"] option').allTextContents()).slice(0,9),expected);await p.locator('[data-action="close"]').click();
  await p.locator('[data-drag="s"] .name').click();assert.deepEqual((await p.locator('#editForm [name="stage"] option').allTextContents()).slice(0,9),expected);
  assert.deepEqual(errors,[]);console.log('PASS ordered new columns, drag/reload, independent roles/history, Not Proceeding metrics/follow-ups, filter, undo, new-stage backup round-trip and form/dropdown options');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
