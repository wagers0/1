export const STAGES=['Screening','Ready to Submit','Submitted','Interviewing','Offer','Placed','On Hold','Rejected','Withdrawn'];
export const ACTIVE=STAGES.slice(0,6);
export const uid=()=>crypto.randomUUID();
export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export const blank=()=>({schemaVersion:2,candidates:[],roles:[],submissions:[],tasks:[]});
export const clone=x=>structuredClone(x);
export const event=(type,text,from='',to='')=>({id:uid(),at:new Date().toISOString(),type,text,from,to});
export const fields={
 candidates:[['name','Full name','required'],['specialty','Specialty'],['location','Location'],['skills','Skills (comma separated)','skills'],['email','Email','email'],['phone','Phone'],['availability','Availability',['','Available Now','Contract Ending','Passive','Unavailable']],['workPreference','Work preference',['','Remote','Hybrid','Onsite']],['desiredPayRate','Desired candidate pay / hour','rate'],['lastContact','Last contact','date'],['contractEndDate','Contract ends','date'],['notes','Profile notes','long'],['candidateId','External candidate ID'],['dynamicsUrl','Dynamics link','url'],['linkedinUrl','LinkedIn link','url'],['employmentType','Employment type'],['visaType','Visa type'],['visaStatus','Visa status'],['employmentStatus','Employment status'],['reasonForLeaving','Reason for leaving','long'],['priorities','Top three priorities','long'],['searchTiming','Job-search timing'],['onBench','On talent bench','check'],['favorite','Favorite','check']],
 roles:[['title','Job title','required'],['reqId','Requisition ID'],['client','Client'],['hiringManager','Hiring manager'],['location','Location'],['onsiteExpectations','Onsite expectations'],['skills','Key skills (comma separated)','skills'],['maxBillRate','Maximum client bill / hour','rate'],['targetStartDate','Target start','date'],['contractEndDate','Contract ends','date'],['status','Role status',['Open','On Hold','Closed']],['notes','Role notes','long']],
 submissions:[['stage','Stage',STAGES],['submissionDate','Actual submission date','date'],['agreedPayRate','Agreed candidate pay / hour','rate'],['interviewDates','Interview dates / time zones'],['prepStatus','Interview preparation'],['nextAction','Next action'],['followUpDate','Follow-up date','date'],['fitNotes','Role-specific notes','long'],['outcome','Outcome / reason','long'],['rtr','Right to represent received','check'],['referencesReceived','Reference received','check'],['furloughAccepted','Furlough accepted','check']],
 tasks:[['title','Follow-up action','required'],['dueDate','Due date','date'],['notes','Notes','long']]
};
export function defaults(kind){const r={id:uid()};for(const [k,,t]of fields[kind])r[k]=t==='check'?false:t==='skills'?[]:Array.isArray(t)?t[0]:'';if(kind==='submissions')r.history=[];return r;}
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
const str=(x,label,max=200000)=>{if(x===undefined)return '';if(typeof x!=='string'||x.length>max)throw Error(`Invalid ${label}.`);return x;};
export function validate(input){
 if(!obj(input))throw Error('This is not a kdesk backup.');
 if(input.format){if(!['recruiter-desk-backup','kdesk-backup'].includes(input.format))throw Error('Unknown backup format.');input=input.state;}
 if(!obj(input)||![1,2].includes(input.schemaVersion))throw Error('Unsupported backup version.');
 const out=blank(),ids=new Set();
 for(const kind of Object.keys(fields)){
  const list=input[kind]??(kind==='tasks'?[]:null);if(!Array.isArray(list)||list.length>100000)throw Error(`Invalid ${kind} list.`);
  out[kind]=list.map(raw=>{
   if(!obj(raw)||typeof raw.id!=='string'||!raw.id||ids.has(raw.id))throw Error('Missing or duplicate record ID.');ids.add(raw.id);
   const r={...raw,id:raw.id};
   for(const [k,label,t]of fields[kind]){
    let v=raw[k];if(t==='check'){v=v??false;if(typeof v!=='boolean')throw Error(`Invalid ${label}.`);}
    else if(t==='skills'){v=v??[];if(!Array.isArray(v)||v.some(x=>typeof x!=='string'))throw Error(`Invalid ${label}.`);v=[...new Set(v.map(x=>x.trim()).filter(Boolean))];}
    else{v=str(v,label);if(t==='required'&&!v.trim())throw Error(`${label} is required.`);if(t==='date'&&v&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))throw Error(`Invalid ${label}.`);if(t==='rate'&&v&&(!/^\d+(\.\d+)?$/.test(v)||!Number.isFinite(+v)))throw Error(`${label} must be a positive amount or zero.`);if(Array.isArray(t)&&v&&!t.includes(v))throw Error(`Invalid ${label}.`);if(t==='url'&&v){let u;try{u=new URL(v);}catch{throw Error(`${label} needs a full https:// URL.`);}if(!['https:','http:'].includes(u.protocol))throw Error(`Invalid ${label}.`);}}
    r[k]=v;
   }
   if(raw.archived!==undefined&&typeof raw.archived!=='boolean')throw Error('Invalid archive flag.');r.archived=!!raw.archived;
   if(kind==='submissions'){
    if(!STAGES.includes(r.stage))throw Error('Invalid pipeline stage.');
    r.candidateId=str(raw.candidateId,'candidate link');r.roleId=str(raw.roleId,'role link');
    if(!Array.isArray(raw.history??[]))throw Error('Invalid history.');
    r.history=(raw.history??[]).map(h=>{if(!obj(h)||!h.id||!Number.isFinite(Date.parse(h.at))||typeof h.text!=='string'||typeof h.type!=='string')throw Error('Invalid history entry.');return {...h};});
   }
   if(kind==='tasks'){r.candidateId=str(raw.candidateId,'candidate link');r.roleId=str(raw.roleId,'role link');r.done=!!raw.done;}
   if(raw.sourceText!==undefined)r.sourceText=str(raw.sourceText,'source text');
   return r;
  });
 }
 const cs=new Set(out.candidates.map(x=>x.id)),rs=new Set(out.roles.map(x=>x.id)),pairs=new Set();
 for(const s of out.submissions){if(!cs.has(s.candidateId)||!rs.has(s.roleId))throw Error('Pipeline record has a missing candidate or job.');const pair=JSON.stringify([s.candidateId,s.roleId]);if(pairs.has(pair))throw Error('Duplicate candidate / job pair.');pairs.add(pair);}
 for(const t of out.tasks)if((t.candidateId&&!cs.has(t.candidateId))||(t.roleId&&!rs.has(t.roleId)))throw Error('Follow-up has a missing candidate or job.');
 return out;
}
export function moveRecord(state,id,stage,anchor='',after=false){
 const next={...state,submissions:[...state.submissions]},i=next.submissions.findIndex(x=>x.id===id);if(i<0||!STAGES.includes(stage))throw Error('Cannot move this pipeline record.');
 const old=next.submissions[i],s={...old,history:[...old.history]};if(old.stage!==stage){s.history.push(event('stage',`Moved from ${old.stage} to ${stage}.`,old.stage,stage));s.stage=stage;}
 next.submissions.splice(i,1);const ai=next.submissions.findIndex(x=>x.id===anchor);next.submissions.splice(ai<0?next.submissions.length:ai+(after?1:0),0,s);return next;
}
export function duplicateCandidates(state,c){const norm=x=>(x||'').trim().toLowerCase(),digits=x=>(x||'').replace(/\D/g,'');return state.candidates.filter(r=>(c.email&&norm(r.email)===norm(c.email))||(c.phone&&digits(r.phone)===digits(c.phone))||(c.linkedinUrl&&norm(r.linkedinUrl).replace(/\/$/,'')===norm(c.linkedinUrl).replace(/\/$/,''))||(c.name&&norm(r.name)===norm(c.name)));}
