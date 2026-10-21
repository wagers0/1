import * as pdf from 'pdfjs-dist/build/pdf.mjs';
import mammoth from 'mammoth/mammoth.browser.js';
export async function extract(file){
 if(file.size>10*1024*1024)throw Error('Use a file smaller than 10 MB.');
 const ext=file.name.split('.').at(-1).toLowerCase();let text='';
 if(ext==='txt')text=await file.text();
 else if(ext==='docx'){
  const buffer=await file.arrayBuffer(),view=new DataView(buffer);let expanded=0;
  for(let i=0;i<view.byteLength-46;i++)if(view.getUint32(i,true)===0x02014b50){expanded+=view.getUint32(i+24,true);if(expanded>30*1024*1024)throw Error('This Word file is too complex. Export it as text first.');}
  text=(await mammoth.extractRawText({arrayBuffer:buffer})).value;
 }else if(ext==='pdf'){
  const url=URL.createObjectURL(new Blob([__WORKER_SOURCE__],{type:'text/javascript'}));
  const worker=new Worker(url,{type:'module'}),pw=new pdf.PDFWorker({port:worker});let task,timeout;
  try{
   text=await Promise.race([(async()=>{
    task=pdf.getDocument({data:new Uint8Array(await file.arrayBuffer()),worker:pw,isEvalSupported:false,useSystemFonts:true});
    const doc=await task.promise;if(doc.numPages>60)throw Error('Use a profile with 60 pages or fewer.');let result='';
    for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i),content=await page.getTextContent();for(const item of content.items)result+=(item.str||'')+(item.hasEOL?'\n':' ');result+='\n';page.cleanup();}
    return result;
   })(),new Promise((_,reject)=>timeout=setTimeout(()=>reject(Error('PDF extraction timed out. Try a text or Word copy.')),30000))]);
  }finally{clearTimeout(timeout);task?.destroy();pw.destroy();worker.terminate();URL.revokeObjectURL(url);}
 }else throw Error('Drop a PDF, DOCX, or TXT file. Older .doc files need to be saved as .docx first.');
 text=text.trim();if(text.length<20)throw Error('No readable profile text found. Scanned PDFs need OCR; use a text-based PDF, DOCX, or paste the text.');
 if(text.length>200000)throw Error('Too much text for one profile. Use a shorter document.');
 return text;
}
export function suggest(text){
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),first=lines.find(s=>s.length<70&&!/@|https?:|resume|curriculum|phone|email/i.test(s));
 const known=['Python','PySpark','SQL','Tableau','Power BI','JavaScript','TypeScript','React','Figma','AWS','Azure','Databricks','Snowflake','Splunk','Excel','Java','C#','Airflow','Terraform'];
 return {name:first||'',email:text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]||'',phone:text.match(/(?:\+1[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}/)?.[0]||'',linkedinUrl:text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s)>,]+/i)?.[0]||'',skills:known.filter(s=>new RegExp('(?:^|[^a-z])'+s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:$|[^a-z])','i').test(text)),sourceText:text};
}
