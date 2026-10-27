/* Noon · projects: a project is a stack of versions. Every HTML file you upload becomes the next version (v1, v2, …),
   comments pin to the page of one version, and Compare puts the previous version beside the new one so you can see
   how each comment was answered. The project list and the comments ride on the team like tasks do; the files (pages
   and their images, styles, scripts) live in IndexedDB under `noon-files`. Signed-in teams mirror the rows through
   sync.js and keep the files in the private `project-files` bucket, so teammates open the same versions. */

/* ---------- icons ---------- */
const PI={
  up:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V5M7 10l5-5 5 5M5 20h14"/></svg>',
  dl:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  folder:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2.5h6a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 19.5H6A2.5 2.5 0 0 1 3.5 17z"/></svg>',
  desktop:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
  tablet:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M11 17.5h2"/></svg>',
  phone:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/></svg>',
  bubble:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12.5a7.5 7.5 0 0 1-11.2 6.5L4 20l1.1-4.3A7.5 7.5 0 1 1 20 12.5z"/></svg>',
  cursor:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 8-6.5 1.5L10 19z"/></svg>',
  cmp:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="7.5" height="16" rx="2"/><rect x="13.5" y="4" width="7.5" height="16" rx="2"/></svg>',
  page:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="17" height="16" rx="3.5"/><path d="M3.5 9h17M7.5 6.5h.01M10.5 6.5h.01"/></svg>',
  back:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  share:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4"/></svg>',
  arrow:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};

/* ---------- state ---------- */
const PJ={urls:{},html:{}};
const PV={proj:null,ver:null,dev:'desktop',mode:'comment',layer:'team',filter:'open',sel:null,draft:null,built:null,ro:[],hov:null,reply:null,scale:1,cmp:null,syncUntil:0,loaded:{A:false,B:false},pick:false};
const DEVS={desktop:[1280,'Desktop'],tablet:[820,'Tablet'],phone:[390,'Phone']};
const MAXF=25*1048576,BUCKET='project-files';
const projectsOf=T=>(T.projects=T.projects||[]);
const projById=id=>projectsOf(team()).find(p=>p.id===id);
const versOf=p=>(p.versions=p.versions||[]);
const verById=(p,id)=>versOf(p).find(v=>v.id===id);
const curVer=p=>versOf(p)[versOf(p).length-1]||null;
const prevVer=(p,v)=>{const L=versOf(p),i=L.indexOf(v);return i>0?L[i-1]:null};
const openCm=v=>v.cm.filter(c=>c.status!=='resolved');
// two layers of comments: the team's, in the app, and the client link's, which is all anyone on the link sees
const layerOf=c=>c.layer==='client'?'client':'team';
const inLayer=c=>layerOf(c)===PV.layer;
const openIn=(v,l=PV.layer)=>openCm(v).filter(c=>layerOf(c)===l);
const allIn=(v,l=PV.layer)=>v.cm.filter(c=>layerOf(c)===l);
const hasClient=p=>!!(p.share&&p.share.token)||versOf(p).some(v=>v.cm.some(c=>layerOf(c)==='client'));
const projOpen=p=>versOf(p).reduce((n,v)=>n+openCm(v).length,0);
const agoLabel=t=>{const d=Date.now()-t;return d<MIN?'just now':d<HR?Math.round(d/MIN)+' min ago':d<DAY?Math.round(d/HR)+' h ago':whenLabel(t)};
const curDev=()=>narrowCal()?'phone':PV.dev;
const isHtmlFile=x=>/\.html?$/i.test(x.path)||x.file.type==='text/html';
const vLabel=v=>'v'+v.n;
const plural=(n,s)=>`${n} ${s}${n===1?'':'s'}`;
const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'project';
const touch=p=>{p.at=Date.now();p.who=me().id}; // every change notes who made it and when
function dueInfo(day){if(!day) return null;const d=dayDiff(day);return {label:dayLabel(day),rel:d<0?`${plural(-d,'day')} late`:d===0?'today':d===1?'tomorrow':`in ${d} days`,state:d<0?'late':d<=3?'soon':''}}
// projects saved before versions existed had pages; each page becomes a version in order
function upgradeProjects(){for(const T of S.teams) for(const p of projectsOf(T)){if(p.pages&&!p.versions){p.versions=p.pages.map((pg,i)=>({...pg,n:i+1,assets:p.assets||[]}));delete p.pages;delete p.assets}p.to=p.to||[];for(const v of versOf(p)){v.cm=v.cm||[];v.assets=v.assets||[]}}}

/* ---------- the file store: IndexedDB here, the team bucket for signed-in teams ---------- */
const FDB={p:null};
function fdb(){if(FDB.p) return FDB.p;return FDB.p=new Promise((res,rej)=>{const r=indexedDB.open('noon-files',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function fdbPut(id,blob){const db=await fdb();return new Promise((res,rej)=>{const t=db.transaction('files','readwrite');t.objectStore('files').put(blob,id);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
async function fdbGet(id){const db=await fdb();return new Promise((res,rej)=>{const r=db.transaction('files').objectStore('files').get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
async function fdbDel(ids){if(!ids.length) return;const db=await fdb();return new Promise((res,rej)=>{const t=db.transaction('files','readwrite'),s=t.objectStore('files');for(const id of ids) s.delete(id);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
const cloudOn=()=>!!(typeof sb!=='undefined'&&sb&&typeof CLOUD!=='undefined'&&CLOUD.user&&CLOUD.pjOn);
const cloudFiles=T=>!!(T.cloud&&cloudOn());
// a file by id: from this device, else from the bucket (and kept here after)
async function fileBlob(id,path){let b=await fdbGet(id);if(!b&&path&&(cloudOn()||(SHARE&&sb))){try{const {data}=await sb.storage.from(BUCKET).download(path);if(data){b=data;await fdbPut(id,b)}}catch(e){}}return b}
async function putFile(T,pid,vid,rel,blob,type){if(!cloudFiles(T)) return null;const path=`${T.id}/${pid}/${vid}/${rel}`;const {error}=await sb.storage.from(BUCKET).upload(path,blob,{upsert:true,contentType:type||'application/octet-stream'});if(error){console.warn('upload',error);return null}return path}
function removeFiles(paths){if(paths.length&&cloudOn()) sb.storage.from(BUCKET).remove(paths).catch(()=>{})}
// after a local team moves to the account: every file that is not in the bucket yet goes up
async function syncProjectFiles(T){
  if(!cloudOn()) return;
  for(const p of projectsOf(T)) for(const v of versOf(p)){if(v.demo) continue;
    if(!v.file){const b=await fdbGet(v.id);if(b) v.file=await putFile({...T,cloud:true},p.id,v.id,v.path,b,'text/html')}
    for(const a of v.assets) if(!a.file){const b=await fdbGet(a.id);if(b) a.file=await putFile({...T,cloud:true},p.id,v.id,a.path,b,a.type)}}
}
// blobs a version owns that no other version still points at
function orphanFiles(p,v){const keep=new Set();for(const o of versOf(p)) if(o!==v) for(const a of o.assets) keep.add(a.id);const own=v.assets.filter(a=>!keep.has(a.id));return {ids:[...(v.demo?[]:[v.id]),...own.map(a=>a.id)],paths:[...(v.file?[v.file]:[]),...own.map(a=>a.file).filter(Boolean)]}}

/* ---------- paths and rewriting: relative images, styles and scripts resolve to the uploaded files ---------- */
const dirOf=p=>p.includes('/')?p.slice(0,p.lastIndexOf('/')+1):'';
function normPath(dir,rel){const out=[];for(const s of (dir+rel).split('/')){if(s==='..') out.pop();else if(s&&s!=='.') out.push(s)}return out.join('/')}
const EXT={css:'text/css',js:'text/javascript',mjs:'text/javascript',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',avif:'image/avif',ico:'image/x-icon',mp4:'video/mp4',webm:'video/webm',mp3:'audio/mpeg',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',json:'application/json',html:'text/html',htm:'text/html',txt:'text/plain'};
const typeOfName=n=>EXT[(n.split('.').pop()||'').toLowerCase()]||'application/octet-stream';
const SKIP_URL=/^(https?:|data:|blob:|mailto:|tel:|javascript:|#|\/\/)/i;
const mkUrlOf=map=>rel=>{const o=map[rel]||map[Object.keys(map).find(k=>k.endsWith('/'+rel))];return o&&o.url||null};
const resolver=(dir,urlOf)=>u=>{u=String(u||'').trim();if(!u||SKIP_URL.test(u)) return null;const c=u.split(/[?#]/)[0];return urlOf(c.startsWith('/')?normPath('',c.slice(1)):normPath(dir,c))};
function rewriteCss(css,dir,urlOf){const res=resolver(dir,urlOf);return String(css).replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g,(m,q,u)=>{const n=res(u);return n?`url("${n}")`:m})}
function rewriteHtml(html,dir,urlOf){
  const doc=new DOMParser().parseFromString(html,'text/html'),res=resolver(dir,urlOf);
  for(const el of doc.querySelectorAll('[src],[href],[poster],[srcset],[data-src],[style]')){
    for(const a of ['src','href','poster','data-src']){const v=el.getAttribute(a);if(v==null||(a==='href'&&el.tagName==='A')) continue;const n=res(v);if(n) el.setAttribute(a,n)}
    const ss=el.getAttribute('srcset');if(ss) el.setAttribute('srcset',ss.split(',').map(x=>{const [u,d]=x.trim().split(/\s+/);const n=res(u);return (n||u)+(d?' '+d:'')}).join(', '));
    const st=el.getAttribute('style');if(st&&/url\(/i.test(st)) el.setAttribute('style',rewriteCss(st,dir,urlOf));
  }
  for(const s of doc.querySelectorAll('style')) s.textContent=rewriteCss(s.textContent,dir,urlOf);
  for(const b of doc.querySelectorAll('base')) b.remove();
  return '<!doctype html>'+doc.documentElement.outerHTML;
}
function dropUrls(v){for(const o of Object.values(PJ.urls[v.id]||{})) if(o.url) URL.revokeObjectURL(o.url);delete PJ.urls[v.id];delete PJ.html[v.id]}
async function assetUrls(v){
  if(PJ.urls[v.id]) return PJ.urls[v.id];
  const map={};
  for(const a of v.assets||[]){const b=await fileBlob(a.id,a.file);if(b) map[a.path]={blob:b,type:a.type||typeOfName(a.path)}}
  for(const o of Object.values(map)) if(o.type!=='text/css') o.url=URL.createObjectURL(o.blob.type===o.type?o.blob:new Blob([o.blob],{type:o.type}));
  const urlOf=mkUrlOf(map);
  for(const [path,o] of Object.entries(map)) if(o.type==='text/css') o.url=URL.createObjectURL(new Blob([rewriteCss(await o.blob.text(),dirOf(path),urlOf)],{type:'text/css'}));
  return PJ.urls[v.id]=map;
}
async function pageHtml(v){
  if(PJ.html[v.id]) return PJ.html[v.id];
  let raw=v.demo?demoPageHtml(v.demo):null;
  if(raw==null){const b=await fileBlob(v.id,v.file);raw=b?await b.text():null}
  if(raw==null) return null;
  return PJ.html[v.id]=rewriteHtml(raw,dirOf(v.path),mkUrlOf(await assetUrls(v)));
}

/* ---------- taking files in: every HTML file is the next version, anything else rides along as its files ---------- */
function readEntries(items){
  const out=[],walk=(entry,base)=>new Promise(res=>{
    if(entry.isFile) entry.file(f=>{out.push({file:f,path:base+entry.name});res()},()=>res());
    else if(entry.isDirectory){const r=entry.createReader(),all=[];const next=()=>r.readEntries(async es=>{if(!es.length){for(const e of all) await walk(e,base+entry.name+'/');res()}else{all.push(...es);next()}},()=>res());next()}
    else res()});
  const entries=[...items].map(i=>i.webkitGetAsEntry&&i.webkitGetAsEntry()).filter(Boolean);
  if(!entries.length) return null;
  return (async()=>{for(const e of entries) await walk(e,'');return out})();
}
function projNameFor(list){
  const roots=new Set(list.map(x=>x.path.includes('/')?x.path.split('/')[0]:null));
  if(roots.size===1&&!roots.has(null)) return cap([...roots][0].replace(/[-_]+/g,' '));
  const h=list.find(isHtmlFile);return h?cap(h.path.split('/').pop().replace(/\.html?$/i,'').replace(/[-_]+/g,' ')):'New project';
}
const cleanPath=p=>p.replace(/^\/+/,'');
const junk=n=>!n||n.startsWith('.')||/^(thumbs\.db|desktop\.ini)$/i.test(n);
const mergeAssets=(base,add)=>[...base.filter(a=>!add.some(b=>b.path===a.path)),...add];
async function ingest(T,p,list){
  const r={vers:[],assets:0,big:[]},files=[],htmls=[];
  for(const x of list){const q=cleanPath(x.path),name=q.split('/').pop();if(junk(name)) continue;if(x.file.size>MAXF){r.big.push(name);continue}(isHtmlFile(x)?htmls:files).push({file:x.file,path:q,name})}
  htmls.sort((a,b)=>a.path.localeCompare(b.path));
  const base=curVer(p),inherited=base?base.assets:[],vid0=htmls.length?uid():(base?base.id:null),added=[];
  for(const {file,path,name} of files){const a={id:uid(),path,size:file.size,type:file.type||typeOfName(name)};await fdbPut(a.id,file);a.file=vid0?await putFile(T,p.id,vid0,path,file,a.type):null;added.push(a);r.assets++}
  if(!htmls.length){if(base&&added.length){base.assets=mergeAssets(base.assets,added);dropUrls(base)}touch(p);return r}
  let n=versOf(p).reduce((m,v)=>Math.max(m,v.n),0);
  for(const [i,{file,path,name}] of htmls.entries()){
    const v={id:i?uid():vid0,n:++n,name,path,size:file.size,at:Date.now(),by:me().id,cm:[],assets:mergeAssets(inherited,added),file:null};
    await fdbPut(v.id,file);v.file=await putFile(T,p.id,v.id,path,file,'text/html');versOf(p).push(v);r.vers.push(v);
  }
  touch(p);return r;
}
async function handleFiles(list){
  list=(list||[]).filter(x=>x&&x.file);if(!list.length) return;
  const T=team();let p=PV.proj&&projById(PV.proj);
  if(!p){
    if(!list.some(isHtmlFile)){toast('No HTML files in that selection');return}
    p={id:uid(),name:projNameFor(list),at:Date.now(),by:me().id,who:me().id,to:[],versions:[]};projectsOf(T).push(p);PV.proj=p.id;PV.ver=null;
  }
  if(!list.some(isHtmlFile)&&!curVer(p)){toast('Start with an HTML file: it becomes version 1');return}
  toast(cloudFiles(T)?'Uploading…':'Reading files…');
  const r=await ingest(T,p,list);
  if(r.vers.length){PV.ver=r.vers[r.vers.length-1].id;PV.sel=null;PV.draft=null;PV.reply=null;PV.cmp=null;if(PV.mode==='compare'&&!prevVer(p,verById(p,PV.ver))) PV.mode='comment'}
  PV.built=null;save();render();
  const names=r.vers.map(vLabel).join(', ');
  toast(r.vers.length?`${r.vers.length===1?'Version '+names:'Versions '+names} added${r.vers.length===1?', with no comments yet':''}${r.assets?` · ${plural(r.assets,'file')} alongside`:''}`:r.assets?`${plural(r.assets,'file')} added to ${vLabel(curVer(p))}`:'Nothing new in that selection');
  if(r.big.length) setTimeout(()=>toast(`Skipped ${r.big.join(', ')}: over 25 MB`),3300);
  if(cloudFiles(T)&&r.vers.some(v=>!v.file)) setTimeout(()=>toast('The file could not reach your account, so teammates cannot open this version yet. Upload it again later.'),3300);
}
$('#pjFiles').addEventListener('change',e=>{const l=[...e.target.files].map(f=>({file:f,path:f.webkitRelativePath||f.name}));e.target.value='';handleFiles(l)});
$('#pjFolder').addEventListener('change',e=>{const l=[...e.target.files].map(f=>({file:f,path:f.webkitRelativePath||f.name}));e.target.value='';handleFiles(l)});
async function dropFiles(dt){
  let list=dt.items&&dt.items.length?await readEntries(dt.items):null;
  if(!list) list=[...dt.files].map(f=>({file:f,path:f.name}));
  handleFiles(list);
}

/* ---------- getting files out: the page as uploaded, or a zip with everything that came with it ---------- */
const CRC_T=(()=>{const t=new Uint32Array(256);for(let i=0;i<256;i++){let c=i;for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1;t[i]=c>>>0}return t})();
function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++) c=CRC_T[(c^u8[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
// a plain zip (stored, no compression): every browser and OS opens it
async function makeZip(entries){
  const enc=new TextEncoder(),parts=[],cd=[],now=new Date();let off=0;
  const dt=((now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1))&0xFFFF,dd=(((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate())&0xFFFF;
  const u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255],u16=v=>[v&255,(v>>>8)&255];
  for(const e of entries){
    const data=new Uint8Array(await e.blob.arrayBuffer()),name=enc.encode(e.path),crc=crc32(data);
    const lh=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(dt),...u16(dd),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0)]);
    parts.push(lh,name,data);
    cd.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(dt),...u16(dd),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),name);
    off+=lh.length+name.length+data.length;
  }
  const cdLen=cd.reduce((n,x)=>n+x.length,0);
  return new Blob([...parts,...cd,new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(entries.length),...u16(entries.length),...u32(cdLen),...u32(off),...u16(0)])],{type:'application/zip'});
}
function dlBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
async function downloadVersion(p,v){
  const html=v.demo?new Blob([demoPageHtml(v.demo)],{type:'text/html'}):await fileBlob(v.id,v.file);
  if(!html){toast('The file for this version is not on this device');return}
  if(!v.assets.length){dlBlob(html,v.name);toast(`Downloading ${vLabel(v)} · ${v.name}`);return}
  toast('Packing the files…');
  const entries=[{path:v.path,blob:html}];
  for(const a of v.assets){const b=await fileBlob(a.id,a.file);if(b) entries.push({path:a.path,blob:b})}
  dlBlob(await makeZip(entries),`${slug(p.name)}-${vLabel(v)}.zip`);
  toast(`Downloading ${vLabel(v)} as a zip with ${plural(entries.length-1,'file')}`);
}

/* ---------- rendering: the list, a project's versions, or a version with its comments ---------- */
function renderProjects(){
  upgradeProjects();
  if(PJ.want){const w=PJ.want,T0=S.teams.find(t=>projectsOf(t).some(x=>x.id===w.id));
    if(T0){PJ.want=null;if(S.active!==T0.id){S.active=T0.id;setTimeout(render,0)}PV.proj=w.id;const L=versOf(projectsOf(T0).find(x=>x.id===w.id));const vv=w.n?L.find(x=>x.n===w.n):null;PV.ver=vv?vv.id:null}}
  let p=PV.proj&&projById(PV.proj),v=p&&PV.ver&&verById(p,PV.ver);
  if(PV.proj&&!p){PV.proj=null;PV.ver=null;p=null}
  if(PV.ver&&!v){PV.ver=null;PV.built=null}
  if(v){const cmp=PV.mode==='compare'?(verById(p,PV.cmp)||prevVer(p,v)):null;if(PV.mode==='compare'&&!cmp) PV.mode='comment';const key=v.id+'|'+(cmp?cmp.id:'');
    if(PV.built===key&&$('#pvIf')){pvUpdate();return}pvBuild(p,v,cmp);return}
  pvTeardown();
  if(p) renderProject(p);else renderProjList();
}
function thumbHtml(v,cls=''){return `<div class="thumb ${cls}" data-thumb="${v.id}"><div class="thumb-in"><iframe sandbox="allow-same-origin" loading="lazy" tabindex="-1" title=""></iframe></div><span class="thumb-ph">${PI.page}</span></div>`}
async function fillThumbs(vers){
  for(const t of $$('#vProj .thumb[data-thumb]')){
    const v=vers.find(x=>x.id===t.dataset.thumb);if(!v||t.dataset.done) continue;t.dataset.done='1';
    const html=await pageHtml(v);const f=t.querySelector('iframe');if(f&&html!=null){f.srcdoc=html;t.classList.add('has')}
  }
}
function fitThumbs(){for(const t of $$('#vProj .thumb')){const inn=t.querySelector('.thumb-in');if(inn) inn.style.transform=`scale(${t.clientWidth/1280})`}}
const whoName=(T,id,you='you')=>{const z=id&&findM(id,T);return z?(z.isMe?you:first(z.name)):'someone'};
const changedBy=(T,p)=>!p.who&&p.whoGuest?`${first(p.whoGuest)} (client)`:whoName(T,p.who||p.by);
const shareOn=p=>!!(p.share&&p.share.on);
function renderProjList(){
  const T=team(),P=projectsOf(T).slice().sort((a,b)=>(b.at||0)-(a.at||0)),open=P.reduce((n,p)=>n+projOpen(p),0);
  const row=p=>{const vs=versOf(p),cv=curVer(p),o=vs.reduce((n,v)=>n+openIn(v,'team').length,0),oc=vs.reduce((n,v)=>n+openIn(v,'client').length,0),du=dueInfo(p.due),ppl=(p.to||[]).map(id=>findM(id,T)).filter(Boolean);
    return `<div class="pj-row" role="button" tabindex="0" data-proj-open="${p.id}">
      <div class="pj-main">${cv?thumbHtml(cv,'mini'):'<div class="thumb mini empty"></div>'}<div class="pj-name"><b>${esc(p.name)}${shareOn(p)?'<span class="pj-shared" title="A client link is on">Shared</span>':''}</b><small>${o?`${o} open ${o===1?'comment':'comments'}`:'nothing open'}${oc?` · ${oc} from the client`:''}${cv?` · ${vLabel(cv)} is current`:' · no version yet'}</small></div></div>
      <div class="pj-cell" data-l="Changed"><b>${esc(agoLabel(p.at||Date.now()))}</b><small>by ${esc(changedBy(T,p))}</small></div>
      <div class="pj-cell due ${du?du.state:''}" data-l="Deadline">${du?`<b>${esc(du.label)}</b><small>${esc(du.rel)}</small>`:'<span class="pj-none">No deadline</span>'}</div>
      <div class="pj-cell who" data-l="Assigned">${ppl.length?`${avStack(ppl.map(z=>z.id),3,'sm')}<small>${esc(ppl.map(z=>z.isMe?'You':first(z.name)).join(', '))}</small>`:'<span class="pj-none">Nobody yet</span>'}</div>
      <div class="pj-cell" data-l="Versions"><b>${vs.length}</b><small>${vs.length===1?'version':'versions'}</small></div>
      <button type="button" class="tk-x" data-proj-del="${p.id}" aria-label="Delete project">${I.trash}</button></div>`};
  $('#vProj').innerHTML=`<header class="top"><div class="ttl-wrap"><h1>Projects</h1><span class="sub">${P.length?`${plural(P.length,'project')} · ${open?`${open} open ${open===1?'comment':'comments'}`:'no open comments'}`:'Pages to review together, one version at a time'}</span></div>
      <div class="topnav"><button type="button" class="lbtn dark" id="pjNew" title="New project">${I.plus}<span>New project</span></button></div></header>
    <div class="pj-body pj-drop" id="pjDrop">${P.length?`<div class="pj-rows"><div class="pj-row head"><span>Project</span><span>Last change</span><span>Deadline</span><span>Assigned to</span><span>Versions</span><span></span></div>${P.map(row).join('')}</div>`:`<div class="pj-dz big"><span class="ic">${PI.page}</span><b>Start your first project</b><small>Give it a name, then drop the first HTML file in. That is version 1. Leave comments, upload the next file, and it becomes version 2 with a side-by-side view of what changed.</small><span class="pj-dz-acts"><button type="button" class="btn dark" id="pjNew2">${I.plus}New project</button></span></div>`}
      <div class="pj-over">${PI.up}<b>Drop to start a project from these files</b></div></div>`;
  fitThumbs();fillThumbs(P.map(curVer).filter(Boolean));
}
function renderProject(p){
  const T=team(),vs=versOf(p).slice().reverse(),cv=curVer(p),open=projOpen(p),du=dueInfo(p.due),ppl=(p.to||[]).map(id=>findM(id,T)).filter(Boolean),cand=T.members.filter(z=>!(p.to||[]).includes(z.id));
  const card=v=>{const o=openIn(v,'team').length,co=openIn(v,'client').length,r=v.cm.filter(c=>c.status==='resolved').length,pv=prevVer(p,v),cur=v===cv;
    return `<div class="ver-card${cur?' cur':''}" role="button" tabindex="0" data-ver-open="${v.id}">${thumbHtml(v)}
      <div class="ver-body"><div class="ver-head"><span class="ver-n">${vLabel(v)}</span>${cur?'<span class="ver-cur">Current</span>':''}<b>${esc(v.name)}</b></div>
        <small>${fmtSize(v.size||0)} · ${esc(agoLabel(v.at||Date.now()))} by ${esc(whoName(T,v.by))}${v.assets.length?` · ${plural(v.assets.length,'file')} alongside`:''}${cloudFiles(T)&&!v.file&&!v.demo?' · not in your account yet':''}</small>
        <span class="pg-cnt">${o?`<i class="o">${o} open</i>`:''}${co?`<i class="cl">${co} on the client link</i>`:''}${r?`<i>${r} resolved</i>`:''}${!o&&!r&&!co?'<i>No comments yet</i>':''}</span></div>
      <div class="ver-acts"><button type="button" class="btn sm dark" data-ver-open="${v.id}">Open</button>${pv?`<button type="button" class="btn sm" data-ver-cmp="${v.id}">${PI.cmp}Compare with ${vLabel(pv)}</button>`:''}<button type="button" class="btn sm" data-ver-dl="${v.id}" title="${v.assets.length?'Download as a zip with its files':'Download the HTML file'}">${PI.dl}Download</button><button type="button" class="tk-x" data-ver-del="${v.id}" aria-label="Delete version">${I.trash}</button></div></div>`};
  $('#vProj').innerHTML=`<header class="top"><button type="button" class="chev" id="pjBack" aria-label="All projects">${PI.back}</button><div class="ttl-wrap"><h1 class="editable" id="pjName" contenteditable="true" spellcheck="false" title="Click to rename">${esc(p.name)}</h1><span class="sub">${vs.length?`${plural(vs.length,'version')} · ${vLabel(cv)} is current`:'no versions yet'} · ${open?`${open} open ${open===1?'comment':'comments'}`:'nothing open'}</span></div>
      <div class="topnav"><button type="button" class="lbtn quiet icon" id="pjLink" title="Copy a link to this project, for a teammate or for Claude" aria-label="Copy a link to this project">${I.link||PI.page}</button><button type="button" class="lbtn quiet${shareOn(p)?' on':''}" id="pjShare" title="Share with a client">${PI.share}<span>${shareOn(p)?'Shared':'Share'}</span></button><button type="button" class="lbtn quiet" id="pjUploadDir" title="Upload a folder">${PI.folder}<span>Folder</span></button><button type="button" class="lbtn dark" id="pjUpload" title="Upload ${cv?'version '+(cv.n+1):'version 1'}">${PI.up}<span>Upload ${cv?'v'+(cv.n+1):'version 1'}</span></button></div></header>
    <div class="pj-meta">
      <div class="pj-meta-i"><label for="pjDue">Deadline</label><div class="pj-due"><input type="date" id="pjDue" class="pj-date" value="${p.due||''}" aria-label="Deadline">${du?`<small class="${du.state}">${esc(du.rel)}</small>`:''}</div></div>
      <div class="pj-meta-i"><label>Assigned to</label><div class="whochips">${ppl.map(z=>`<button type="button" class="who1" data-pjrm="${z.id}" title="Remove">${avatar(z)}${esc(z.isMe?'Me':first(z.name))}<i>×</i></button>`).join('')}${cand.length?`<button type="button" class="addc" id="pjAddBtn" aria-label="Add someone" aria-expanded="${PV.pick}">${I.plus}</button>`:''}${PV.pick&&cand.length?`<div class="dd" id="pjDd"><div class="dd-list">${cand.map(z=>`<button type="button" class="opt" data-pjav="${z.id}">${avatar(z,'sm')}<span class="n">${esc(z.isMe?'Me':z.name)}<small>${esc(tzLabel(z.tz))}</small></span></button>`).join('')}</div></div>`:''}${!ppl.length&&!PV.pick?'<span class="pj-none">Nobody yet</span>':''}</div></div>
      <div class="pj-meta-i"><label>Last change</label><div class="pj-last"><b>${esc(agoLabel(p.at||Date.now()))}</b><small>by ${esc(changedBy(T,p))}</small></div></div>
    </div>
    <div class="pj-body pj-drop" id="pjDrop">${vs.length?`<div class="ver-list">${vs.map(card).join('')}</div>`:''}
      <div class="pj-dz${vs.length?'':' big'}"><span class="ic">${PI.up}</span><b>${vs.length?`Drop the next version here, it becomes v${cv.n+1}`:'Drop the first HTML file here, it becomes version 1'}</b><small>${vs.length?'A new version starts with no comments. Compare puts it next to the one before, comment by comment. A lone HTML file reuses the previous version\'s images and styles; drop a folder to bring new ones.':'Drop the folder it lives in and the images, styles and scripts come along. A single HTML file works too; its absolute links still load.'}</small><span class="pj-dz-acts"><button type="button" class="btn dark" data-pick="files">Choose files</button><button type="button" class="btn" data-pick="folder">Choose a folder</button></span></div>
      <div class="pj-over">${PI.up}<b>Drop to add ${cv?'version '+(cv.n+1):'version 1'} to ${esc(p.name)}</b></div></div>`;
  fitThumbs();fillThumbs(vs);
}

/* ---------- the viewer ---------- */
const SB='allow-same-origin allow-scripts allow-forms allow-popups allow-modals';
// a frame counts only once its page has loaded: the blank document it starts with has a body too
function frameOf(side){const f=$(side==='A'?'#pvIfA':'#pvIf'),ok=f&&PV.loaded[side];return {f,doc:ok?f.contentDocument:null,win:ok?f.contentWindow:null}}
function pvTeardown(){for(const ro of PV.ro){try{ro.disconnect()}catch(e){}}PV.ro=[];PV.built=null;PV.draft=null;PV.sel=null;PV.reply=null;PV.hov=null;PV.loaded={A:false,B:false}}
async function pvBuild(p,v,cmp){
  pvTeardown();const key=v.id+'|'+(cmp?cmp.id:'');PV.built=key;
  const vers=versOf(p);
  $('#vProj').innerHTML=`<div class="pv"><div class="pv-bar"><button type="button" class="chev" id="pvBack" aria-label="Back to ${esc(p.name)}">${PI.back}</button><div class="pv-ttl" id="pvTtl"></div>
      <select class="vsel" id="pvVer" aria-label="Version">${vers.map(x=>`<option value="${x.id}" ${x===v?'selected':''}>${vLabel(x)} · ${esc(x.name)}${x===curVer(p)?' · current':''}</option>`).join('')}</select>
      <div class="seg sm" id="pvDev" aria-label="Width">${Object.entries(DEVS).map(([k,[w,l]])=>`<button type="button" data-dev="${k}" title="${w}px">${PI[k]}<span>${l}</span></button>`).join('')}</div>
      <div class="seg sm" id="pvMode" aria-label="Mode"><button type="button" data-mode="comment">${PI.bubble}<span>Comment</span></button><button type="button" data-mode="browse">${PI.cursor}<span>Browse</span></button><button type="button" data-mode="compare" ${prevVer(p,v)?'':'disabled title="Nothing before this version yet"'}>${PI.cmp}<span>Compare</span></button></div>
      <div class="topnav"><button type="button" class="lbtn quiet" id="pvUpload" title="Upload version ${curVer(p).n+1}">${PI.up}<span>Upload v${curVer(p).n+1}</span></button><button type="button" class="lbtn quiet icon" id="pvDownload" aria-label="Download this version" title="Download this version">${PI.dl}</button><button type="button" class="lbtn quiet icon" id="pvDel" aria-label="Delete this version" title="Delete this version">${I.trash}</button></div></div>
    <div class="pv-main"><div class="pv-stage${cmp?' cmp':''}" id="pvStage">${cmp?`<div class="pv-cap" id="pvCapA"></div><div class="pv-frame" id="pvFrameA"><iframe id="pvIfA" sandbox="${SB}" title="${esc(vLabel(cmp))}"></iframe></div><div class="pv-pins" id="pvPinsA"></div><div class="pv-cap" id="pvCapB"></div>`:''}<div class="pv-frame" id="pvFrame"><iframe id="pvIf" sandbox="${SB}" title="${esc(vLabel(v))}"></iframe></div><div class="pv-pins" id="pvPins"></div><div class="pv-hint" id="pvHint" hidden>${PI.bubble}Click anywhere on the page to leave a comment</div><div class="pv-load" id="pvLoad">Loading ${esc(v.name)}…</div></div><aside class="pv-side" id="pvSide"></aside></div></div>`;
  pvLayout();pvUpdate();
  const [hb,ha]=await Promise.all([pageHtml(v),cmp?pageHtml(cmp):null]);
  if(PV.built!==key||!$('#pvIf')) return;
  if(hb==null){$('#pvLoad').textContent=v.file?'The file for this version could not be fetched. Check your connection and open it again.':'The file for this version is missing on this device. Upload it again as a new version.';return}
  const f=$('#pvIf');f.addEventListener('load',()=>pvHook('B'),{once:true});f.srcdoc=hb;
  if(cmp){const fa=$('#pvIfA');if(ha==null){fa.srcdoc='<p style="font:14px sans-serif;color:#888;padding:20px">The file for this version is missing on this device.</p>'}else{fa.addEventListener('load',()=>pvHook('A'),{once:true});fa.srcdoc=ha}}
}
function pvLayout(){
  const st=$('#pvStage'),fr=$('#pvFrame'),box=$('#pvPins');if(!st||!fr||!box) return;
  const cmp=$('#pvFrameA'),W=DEVS[curDev()][0],sw=st.clientWidth,sh=st.clientHeight,pad=narrowCal()?8:18,capH=cmp?26:0;
  const place=(frame,pins,cap,left,top,w,h,sc)=>{frame.style.cssText=`width:${W}px;height:${Math.max(100,h/sc)}px;transform:scale(${sc});left:${left}px;top:${top}px`;pins.style.cssText=`left:${left}px;top:${top}px;width:${Math.round(w)}px;height:${Math.max(0,h)}px`;if(cap) cap.style.cssText=`left:${left}px;top:${top-capH}px;width:${Math.round(w)}px`};
  if(!cmp){const sc=Math.min(1,(sw-2*pad)/W);PV.scale=sc;place(fr,box,null,Math.max(0,Math.round((sw-W*sc)/2)),pad,W*sc,sh-2*pad,sc)}
  else if(!narrowCal()){const cw=(sw-3*pad)/2,sc=Math.min(1,cw/W),w=W*sc,h=sh-2*pad-capH,l1=Math.max(0,Math.round(pad+(cw-w)/2)),l2=Math.round(2*pad+cw+(cw-w)/2);PV.scale=sc;
    place(cmp,$('#pvPinsA'),$('#pvCapA'),l1,pad+capH,w,h,sc);place(fr,box,$('#pvCapB'),l2,pad+capH,w,h,sc)}
  else{const sc=Math.min(1,(sw-2*pad)/W),w=W*sc,h=(sh-3*pad-2*capH)/2,l=Math.max(0,Math.round((sw-w)/2));PV.scale=sc;
    place(cmp,$('#pvPinsA'),$('#pvCapA'),l,pad+capH,w,h,sc);place(fr,box,$('#pvCapB'),l,2*pad+2*capH+h,w,h,sc)}
  pvPins();
}
const INJECT='html{scrollbar-width:none}html::-webkit-scrollbar{width:0;height:0}[data-noon-hov]{outline:2px solid #b79cf0!important;outline-offset:-2px!important;box-shadow:0 0 0 4px rgba(183,156,240,.25)!important}[data-noon-focus]{outline:3px solid #b79cf0!important;outline-offset:2px!important;box-shadow:0 0 0 6px rgba(183,156,240,.28)!important}html[data-noon-mode=comment],html[data-noon-mode=comment] *{cursor:crosshair!important;user-select:none!important;-webkit-user-select:none!important}';
function pvHook(side){
  PV.loaded[side]=true;const {f,doc,win}=frameOf(side);if(!f||!doc||!doc.documentElement) return;
  if(side==='B'){const ld=$('#pvLoad');if(ld) ld.remove()}
  const st=doc.createElement('style');st.textContent=INJECT;(doc.head||doc.documentElement).appendChild(st);
  const cmp=PV.mode==='compare';
  doc.documentElement.dataset.noonMode=cmp?'compare':PV.mode;
  if(cmp){
    doc.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href]');if(a&&!/^#/.test(a.getAttribute('href')||'')) e.preventDefault()},true);
    win.addEventListener('scroll',()=>{pvPins();if(performance.now()<PV.syncUntil) return;const o=frameOf(side==='A'?'B':'A');if(o.win){PV.syncUntil=performance.now()+150;o.win.scrollTo(win.scrollX,win.scrollY)}},{passive:true});
  }else{
    doc.addEventListener('click',pvClick,true);
    doc.addEventListener('mousemove',e=>{if(PV.mode!=='comment') return;const t=e.target;if(t===PV.hov||!t||!t.dataset) return;pvUnhov();if(t!==doc.documentElement&&t!==doc.body){t.dataset.noonHov='1';PV.hov=t}},true);
    doc.addEventListener('mouseleave',pvUnhov,true);
    doc.addEventListener('submit',e=>{if(PV.mode==='comment') e.preventDefault()},true);
    win.addEventListener('scroll',pvPins,{passive:true});
  }
  doc.addEventListener('keydown',e=>{if(e.key==='Escape') pvEscape()},true);
  doc.addEventListener('load',pvPins,true);
  try{const ro=new ResizeObserver(()=>pvPins());ro.observe(doc.documentElement);if(doc.body) ro.observe(doc.body);PV.ro.push(ro)}catch(e){}
  pvUpdate();
}
function pvUnhov(){if(PV.hov){try{delete PV.hov.dataset.noonHov}catch(e){}PV.hov=null}}
function selOf(el){
  const parts=[];
  while(el&&el.nodeType===1&&el.tagName!=='HTML'){
    let s=el.tagName.toLowerCase();
    if(el.id&&/^[A-Za-z][\w-]*$/.test(el.id)){parts.unshift('#'+CSS.escape(el.id));break}
    const p=el.parentElement;if(p){const sib=[...p.children].filter(x=>x.tagName===el.tagName);if(sib.length>1) s+=`:nth-of-type(${sib.indexOf(el)+1})`}
    parts.unshift(s);el=p;
  }
  return parts.join('>');
}
function pvClick(e){
  const {doc,win}=frameOf('B');if(!doc) return;const p=projById(PV.proj),v=p&&verById(p,PV.ver);if(!v) return;
  const t=e.target&&e.target.nodeType===1?e.target:doc.body,a=t.closest&&t.closest('a[href]');
  if(PV.mode==='browse'){
    if(!a) return;const h=a.getAttribute('href')||'';if(/^#/.test(h)||/^javascript:/i.test(h)) return;
    e.preventDefault();if(/^(https?:)?\/\//i.test(h)||/^(mailto|tel):/i.test(h)) window.open(h,'_blank','noopener');else toast('That link points to a file that is not in this version');
    return;
  }
  e.preventDefault();e.stopPropagation();
  const r=t.getBoundingClientRect();
  PV.draft={sel:selOf(t),snip:snipOf(t),rx:r.width?clamp((e.clientX-r.left)/r.width,0,1):.5,ry:r.height?clamp((e.clientY-r.top)/r.height,0,1):.5,px:e.clientX+win.scrollX,py:e.clientY+win.scrollY,dev:curDev(),text:''};
  PV.sel=null;PV.reply=null;pvUpdate();
  const ta=$('#pvText');if(ta) setTimeout(()=>ta.focus(),30);
}
function snipOf(el){try{const c=el.cloneNode(true);for(const x of [c,...c.querySelectorAll('[data-noon-hov],[data-noon-focus]')]){delete x.dataset.noonHov;delete x.dataset.noonFocus}let h=c.outerHTML.replace(/blob:[^"')\s]+/g,'blob:').replace(/\s+/g,' ');if(h.length>600){const t=(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,300);h=h.slice(0,400)+' … '+(t?`[text: ${t}]`:'')}return h.slice(0,2000)}catch(e){return null}}
function elOf(c,side){const {doc}=frameOf(side);if(!doc) return null;try{return c.sel?doc.querySelector(c.sel):null}catch(e){return null}}
function pvPos(c,side='B'){
  const {doc,win}=frameOf(side),sc=PV.scale||1;if(!doc||!win) return null;
  const el=elOf(c,side);
  if(el){const r=el.getBoundingClientRect();return [(r.left+c.rx*r.width)*sc,(r.top+c.ry*r.height)*sc,el]}
  if(side==='A'||!PV.cmpOn) return [(c.px-win.scrollX)*sc,(c.py-win.scrollY)*sc,null];
  return null;
}
function pvVisible(v){return v.cm.filter(c=>inLayer(c)&&(PV.filter==='all'||(PV.filter==='resolved')===(c.status==='resolved')))}
function layerSeg(p,v){if(SHARE||!hasClient(p)) return '';const t=openIn(v,'team').length,c=openIn(v,'client').length;
  return `<div class="seg sm pv-layer" id="pvLayer" aria-label="Which comments"><button type="button" data-layer="team" class="${PV.layer==='team'?'on':''}">Team<i>${t||''}</i></button><button type="button" data-layer="client" class="${PV.layer==='client'?'on':''}">Client link<i>${c||''}</i></button></div>${PV.layer==='client'?'<p class="pv-layer-note">What your client sees on the link. Anything you post or reply here, they see too.</p>':''}`}
function pinHtml(c,x,y,cls,attr){return `<button type="button" class="pin${cls}" ${attr} style="left:${x}px;top:${y}px" title="${esc(c.text)}">${c.status==='resolved'?I.check:c.n}</button>`}
function pvPins(){
  const box=$('#pvPins');if(!box) return;
  const p=projById(PV.proj),v=p&&verById(p,PV.ver);if(!v) return;
  const cmp=PV.mode==='compare'?(verById(p,PV.cmp)||prevVer(p,v)):null,inside=(x,y,b)=>!(y<-30||y>b.clientHeight+30||x<-30||x>b.clientWidth+30);
  let h='';
  if(!cmp){
    if(frameOf('B').doc) for(const c of pvVisible(v)){const q=pvPos(c);if(!q||!inside(q[0],q[1],box)) continue;h+=pinHtml(c,q[0],q[1],(c.id===PV.sel?' sel':'')+(c.status==='resolved'?' res':''),`data-pin="${c.id}"`)}
    if(PV.draft){const q=pvPos(PV.draft);if(q){h+=`<span class="pin new" style="left:${q[0]}px;top:${q[1]}px">+</span>`;PV.draftXY=q}}
    box.innerHTML=h;
    const nw=$('#pvNew');
    if(nw&&PV.draft&&PV.draftXY){const st=$('#pvStage'),sw=st.clientWidth,sh=st.clientHeight,[x,y]=PV.draftXY,ox=box.offsetLeft,oy=box.offsetTop,w=nw.offsetWidth||300;
      let L=ox+x+22,T=oy+y-30;
      if(L+w>sw-10){if(ox+x-w-16>=10) L=ox+x-w-16;else{L=clamp(ox+x-w/2,10,Math.max(10,sw-w-10));T=oy+y+14}} // right of the pin, else left of it, else under it: never on top of it
      T=clamp(T,10,Math.max(10,sh-nw.offsetHeight-10));nw.style.left=L+'px';nw.style.top=T+'px'}
    return;
  }
  // compare: the earlier version's pins on the left, a ghost of each on the right where that element is now
  const boxA=$('#pvPinsA');let ha='';
  PV.cmpOn=true;
  if(frameOf('A').doc) for(const c of pvVisible(cmp)){const q=pvPos(c,'A');if(q&&inside(q[0],q[1],boxA)) ha+=pinHtml(c,q[0],q[1],(c.id===PV.sel?' sel':'')+(c.status==='resolved'?' res':''),`data-cpin="${c.id}"`)}
  if(frameOf('B').doc) for(const c of pvVisible(cmp)){const q=pvPos(c,'B');if(q&&inside(q[0],q[1],box)) h+=pinHtml(c,q[0],q[1],' ghost'+(c.id===PV.sel?' sel':''),`data-cpin="${c.id}"`)}
  PV.cmpOn=false;
  if(boxA) boxA.innerHTML=ha;box.innerHTML=h;
}
function pvScrollTo(c){const q=pvPos(c);if(!q) return;const {win}=frameOf('B'),[x,y,el]=q,H=$('#pvPins').clientHeight;if(y>=20&&y<=H-20) return;if(el) el.scrollIntoView({block:'center',behavior:'smooth'});else win.scrollTo({top:Math.max(0,c.py-200),behavior:'smooth'})}
// how the new version answers a comment left on the old one: same element, compared by text, then by how it looks, then by markup
const STYLE_PROPS=[['color','colour'],['background-color','background'],['background-image','background'],['font-size','text size'],['font-weight','weight'],['font-family','font'],['line-height','line height'],['letter-spacing','spacing'],['padding','padding'],['margin','margin'],['border-radius','corners'],['border-top-width','border'],['border-top-style','border'],['box-shadow','shadow'],['text-align','alignment'],['text-transform','case'],['opacity','opacity'],['display','layout']];
const normTxt=el=>(el.textContent||'').replace(/\s+/g,' ').trim();
const normVal=s=>String(s||'').replace(/blob:[^"')\s]+/g,'blob:');
const normHtml=el=>{const c=el.cloneNode(true);for(const x of [c,...c.querySelectorAll('[data-noon-hov],[data-noon-focus]')]){delete x.dataset.noonHov;delete x.dataset.noonFocus}return normVal(c.outerHTML).replace(/\s+/g,' ')};
function cmpStatus(c){
  const A=frameOf('A'),B=frameOf('B');if(!A.doc||!B.doc||!A.doc.body||!B.doc.body) return null;
  const ea=elOf(c,'A'),eb=elOf(c,'B');
  if(!ea) return {k:'gone',label:'Element not found',note:'The element this was left on is not on the old version either, so there is nothing to compare.'};
  if(!eb) return {k:'gone',label:'Not on the new version',ta:normTxt(ea),note:'That element is gone or moved. The pin on the left shows where it was.'};
  const ta=normTxt(ea),tb=normTxt(eb);
  if(ta!==tb) return {k:'text',label:'Text changed',ta,tb};
  const sa=A.win.getComputedStyle(ea),sb2=B.win.getComputedStyle(eb),diff=[...new Set(STYLE_PROPS.filter(([k])=>normVal(sa.getPropertyValue(k))!==normVal(sb2.getPropertyValue(k))).map(x=>x[1]))];
  if(diff.length) return {k:'style',label:'Looks different',props:diff};
  if(normHtml(ea)!==normHtml(eb)) return {k:'markup',label:'Markup changed',note:'Same text and look, but the HTML inside it changed.'};
  return {k:'same',label:'Unchanged'};
}
function cmpFocus(c){
  PV.sel=c.id;PV.reply=null;
  for(const side of ['A','B']){const {doc,win}=frameOf(side);if(!doc) continue;for(const x of doc.querySelectorAll('[data-noon-focus]')) delete x.dataset.noonFocus;
    const el=elOf(c,side);if(el){el.dataset.noonFocus='1';PV.syncUntil=performance.now()+400;el.scrollIntoView({block:'center'})}
    else if(side==='B'){const a=frameOf('A');PV.syncUntil=performance.now()+400;setTimeout(()=>{if(a.win&&win) win.scrollTo(a.win.scrollX,a.win.scrollY)},30)}}
  pvUpdate();const card=$(`#pvSide .pc[data-cc="${c.id}"]`);if(card) card.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function pvUpdate(){
  const p=projById(PV.proj),v=p&&verById(p,PV.ver);if(!v||!$('#pvTtl')) return;
  const cmp=PV.mode==='compare'?(verById(p,PV.cmp)||prevVer(p,v)):null,open=openIn(v).length,res=allIn(v).length-open;
  $('#pvTtl').innerHTML=`<b>${esc(vLabel(v))} · ${esc(v.name)}</b><small>${esc(p.name)} · ${v===curVer(p)?'current':'older version'} · ${open?`${open} open`:'nothing open'}${res?` · ${res} resolved`:''}</small>`;
  $$('#pvDev button').forEach(b=>b.classList.toggle('on',b.dataset.dev===PV.dev));
  $$('#pvMode button').forEach(b=>b.classList.toggle('on',b.dataset.mode===PV.mode));
  const B=frameOf('B');if(B.doc&&B.doc.documentElement){B.doc.documentElement.dataset.noonMode=cmp?'compare':PV.mode;if(PV.mode!=='comment') pvUnhov()}
  if(cmp){const earlier=versOf(p).filter(x=>x.n<v.n);
    $('#pvCapA').innerHTML=`<select class="vsel sm" id="pvCmp" aria-label="Compare with">${earlier.map(x=>`<option value="${x.id}" ${x===cmp?'selected':''}>${vLabel(x)} · ${esc(x.name)}</option>`).join('')}</select><span>${plural(openIn(cmp).length,'open comment')}</span>`;
    $('#pvCapB').innerHTML=`<b>${vLabel(v)} · ${esc(v.name)}</b><span>${v===curVer(p)?'current':''}</span>`}
  let nw=$('#pvNew');
  if(PV.draft&&!nw){nw=document.createElement('div');nw.className='pv-new';nw.id='pvNew';
    nw.innerHTML=`<div class="pv-new-top">${avatar(me(),'xs')}<b>You</b>${PV.layer==='client'&&!SHARE?'<span class="pc-client">Client can see this</span>':''}<small>${PI[PV.draft.dev]}${DEVS[PV.draft.dev][1]}</small></div><textarea class="cbox pbox" id="pvText" rows="1" maxlength="1000" placeholder="Leave a comment, @ to mention someone"></textarea><div class="pv-new-acts"><button type="button" class="btn sm ghost" id="pvCancel">Cancel</button><button type="button" class="btn sm dark" id="pvPost">Post</button></div>`;
    $('#pvStage').appendChild(nw)}
  else if(!PV.draft&&nw) nw.remove();
  const hint=$('#pvHint');if(hint) hint.hidden=!(PV.mode==='comment'&&!allIn(v).length&&!PV.draft);
  pvPins();if(cmp) pvCmpSide(p,v,cmp);else pvSideRender(p,v);
}
const whoOf=(T,id,g)=>(id&&findM(id,T))||(g?{id:'g:'+g,name:g}:me());
const ownIt=(x,my)=>SHARE?x.byId===my:(!x.byId||x.byId===my);
const clientTag=x=>SHARE?(x.byId&&x.byId!=='guest-me'?'<span class="pc-client team" title="From the team">Team</span>':''):x.guest?'<span class="pc-client" title="Left on the client link">Client</span>':'';
const nameOf=(T,id,by)=>id===me().id?'You':id?first(whoOf(T,id).name):(by||'Someone');
function pvSideRender(p,v){
  const side=$('#pvSide');if(!side) return;const T=team(),my=me().id,open=openIn(v).length,res=allIn(v).length-open,pv=prevVer(p,v);
  const list=pvVisible(v).slice().sort((a,b)=>a.n-b.n);
  const card=c=>{const own=ownIt(c,my),sel=c.id===PV.sel,z=whoOf(T,c.byId,c.guest&&c.by);
    return `<div class="pc${sel?' sel':''}${c.status==='resolved'?' res':''}" data-pc="${c.id}" role="button" tabindex="0">
      <div class="pc-top"><span class="pin-n">${c.status==='resolved'?I.check:c.n}</span>${avatar(z,'xs')}<b>${esc(nameOf(T,c.byId,c.by))}</b>${clientTag(c)}<time>${esc(agoLabel(c.at))}</time>${c.from?`<span class="pc-from" title="Carried over from ${esc(c.from.v)}">${esc(c.from.v)}</span>`:''}<span class="pc-dev" title="Left at ${DEVS[c.dev]?DEVS[c.dev][1].toLowerCase():'desktop'} width">${PI[c.dev]||PI.desktop}</span></div>
      <p>${mentionHtml(c.text)}</p>
      ${(c.re||[]).length?`<div class="pc-res">${c.re.map(r=>`<div class="pc-re">${avatar(whoOf(T,r.byId,r.guest&&r.by),'xs')}<div><b>${esc(nameOf(T,r.byId,r.by))}</b>${clientTag(r)}<time>${esc(agoLabel(r.at))}</time><p>${mentionHtml(r.text)}</p></div>${ownIt(r,my)?`<button type="button" class="th-x" data-pc-delre="${r.id}" aria-label="Remove reply">×</button>`:'<span></span>'}</div>`).join('')}</div>`:''}
      ${sel&&PV.reply?`<div class="th-box"><textarea class="cbox pbox" id="pvReply" rows="1" maxlength="1000" placeholder="Reply, @ to mention someone"></textarea><button type="button" class="th-send" data-pc-send="${c.id}" aria-label="Send">${I.send}</button></div>`:''}
      <div class="pc-acts"><button type="button" data-pc-reply="${c.id}">Reply</button><button type="button" data-pc-resolve="${c.id}">${c.status==='resolved'?'Reopen':'Resolve'}</button><button type="button" data-pc-task="${c.id}">Make a task</button>${own?`<button type="button" class="danger" data-pc-del="${c.id}">Delete</button>`:''}</div></div>`};
  const keep=side.querySelector('.pv-list'),top=keep?keep.scrollTop:0;
  const banner=pv?`<button type="button" class="pv-banner" data-mode-cmp="1">${PI.cmp}<span><b>${openIn(pv).length?`${plural(openIn(pv).length,'open comment')} on ${vLabel(pv)}`:`Compare with ${vLabel(pv)}`}</b><small>${openIn(pv).length?`See how ${vLabel(v)} answers each one, side by side.`:'The two versions side by side, comment by comment.'}</small></span>${PI.arrow}</button>`:'';
  side.innerHTML=`<div class="pv-sh"><h3>Comments on ${vLabel(v)}</h3>${layerSeg(p,v)}<div class="seg sm" id="pvFilter"><button type="button" data-pfilter="open" class="${PV.filter==='open'?'on':''}">Open<i>${open||''}</i></button><button type="button" data-pfilter="resolved" class="${PV.filter==='resolved'?'on':''}">Resolved<i>${res||''}</i></button><button type="button" data-pfilter="all" class="${PV.filter==='all'?'on':''}">All</button></div></div>
    <div class="pv-list">${banner}${list.length?list.map(card).join(''):`<p class="pv-empty">${allIn(v).length?PV.filter==='open'?'Everything here is resolved.':'Nothing resolved yet.':PV.layer==='client'&&!SHARE?`Nothing on the client link for ${vLabel(v)} yet. What your client leaves there shows up here.`:`No comments on ${vLabel(v)} yet. Click anywhere on the page to leave the first one. Each comment pins to the exact element you clicked, so it stays put at every width.`}</p>`}</div>`;
  side.querySelector('.pv-list').scrollTop=top;
  if(PV.reply&&PV.sel){const ta=$('#pvReply');if(ta){ta.focus();if(PV.replyText) ta.value=PV.replyText}}
}
function pvCmpSide(p,v,cmp){
  const side=$('#pvSide');if(!side) return;const T=team(),open=openIn(cmp).length,res=allIn(cmp).length-open;
  const list=pvVisible(cmp).slice().sort((a,b)=>a.n-b.n),ready=frameOf('A').doc&&frameOf('B').doc;
  const card=c=>{const sel=c.id===PV.sel,z=whoOf(T,c.byId,c.guest&&c.by),s=ready?cmpStatus(c):null,carried=v.cm.some(x=>x.from&&x.from.c===c.id);
    const diff=!s?'<div class="pc-diff wait">Comparing…</div>':s.k==='text'?`<div class="pc-diff"><span class="old">${esc(s.ta)}</span>${PI.arrow}<span class="new">${esc(s.tb)}</span></div>`:s.k==='style'?`<div class="pc-diff">Changed: ${esc(s.props.join(', '))}.</div>`:s.note?`<div class="pc-diff">${esc(s.note)}</div>`:'';
    return `<div class="pc cmp${sel?' sel':''}${c.status==='resolved'?' res':''}" data-cc="${c.id}" role="button" tabindex="0">
      <div class="pc-top"><span class="pin-n">${c.status==='resolved'?I.check:c.n}</span>${avatar(z,'xs')}<b>${esc(nameOf(T,c.byId,c.by))}</b>${clientTag(c)}<time>${esc(agoLabel(c.at))}</time>${s?`<span class="pc-st ${s.k}">${s.label}</span>`:''}</div>
      <p>${mentionHtml(c.text)}</p>${diff}
      <div class="pc-acts"><button type="button" data-cmp-resolve="${c.id}">${c.status==='resolved'?`Reopen on ${vLabel(cmp)}`:`Resolve on ${vLabel(cmp)}`}</button>${carried?`<span class="pc-note">On ${vLabel(v)} too</span>`:`<button type="button" data-cmp-carry="${c.id}">Carry to ${vLabel(v)}</button>`}</div></div>`};
  const keep=side.querySelector('.pv-list'),top=keep?keep.scrollTop:0;
  side.innerHTML=`<div class="pv-sh"><h3>${vLabel(cmp)} comments, answered by ${vLabel(v)}</h3><p class="pv-sub">Click one to see that part of both versions. Resolve what was done, carry over what is still open.</p>${layerSeg(p,cmp)}<div class="seg sm" id="pvFilter"><button type="button" data-pfilter="open" class="${PV.filter==='open'?'on':''}">Open<i>${open||''}</i></button><button type="button" data-pfilter="resolved" class="${PV.filter==='resolved'?'on':''}">Resolved<i>${res||''}</i></button><button type="button" data-pfilter="all" class="${PV.filter==='all'?'on':''}">All</button></div></div>
    <div class="pv-list">${list.length?list.map(card).join(''):`<p class="pv-empty">${allIn(cmp).length?PV.filter==='open'?`Everything on ${vLabel(cmp)} is resolved.`:'Nothing resolved yet.':`No comments on ${vLabel(cmp)}. Scroll either side and the other follows.`}</p>`}</div>`;
  side.querySelector('.pv-list').scrollTop=top;
}
function openVer(id,mode){const p=projById(PV.proj),v=p&&verById(p,id);if(!v) return;PV.ver=id;PV.sel=null;PV.draft=null;PV.reply=null;PV.filter='open';PV.cmp=null;if(mode) PV.mode=mode;if(PV.mode==='compare'&&!prevVer(p,v)) PV.mode='comment';renderProjects()}
function pvEscape(){
  if(PV.draft){PV.draft=null;pvUpdate();return true}
  if(PV.reply){PV.reply=null;pvUpdate();return true}
  if(PV.sel){PV.sel=null;for(const s of ['A','B']){const {doc}=frameOf(s);if(doc) for(const x of doc.querySelectorAll('[data-noon-focus]')) delete x.dataset.noonFocus}pvUpdate();return true}
  if(PV.mode==='compare'){PV.mode='comment';renderProjects();return true}
  if(PV.ver){PV.ver=null;renderProjects();return true}
  if(PV.pick){PV.pick=false;renderProjects();return true}
  if(PV.proj){PV.proj=null;renderProjects();return true}
  return false;
}
function pvPost(){
  const p=projById(PV.proj),v=p&&verById(p,PV.ver),ta=$('#pvText');if(!v||!PV.draft||!ta) return;
  const text=ta.value.trim();if(!text){ta.focus();return}
  const d=PV.draft,c={id:uid(),n:allIn(v).reduce((m,x)=>Math.max(m,x.n||0),0)+1,...(PV.layer==='client'?{layer:'client'}:{}),sel:d.sel,rx:d.rx,ry:d.ry,px:d.px,py:d.py,dev:d.dev,text,by:'You',byId:me().id,at:Date.now(),status:'open',re:[],...(d.snip?{snip:d.snip}:{})};
  v.cm.push(c);PV.draft=null;PV.sel=c.id;PV.reply=null;if(PV.filter==='resolved') PV.filter='open';
  touch(p);save();render();
  const el=$('#pvSide .pc.sel');if(el) el.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function cmById(v,id){return v.cm.find(c=>c.id===id)}

/* ---------- clicks in the projects view ---------- */
$('#vProj').addEventListener('click',async e=>{
  const c=s=>e.target.closest(s);let b;const T=team(),p=PV.proj&&projById(PV.proj),v=p&&PV.ver&&verById(p,PV.ver);
  if(c('#pjNew')||c('#pjNew2')){$('#fProject').reset();$('#dProject').showModal();return}
  if(c('#pjUpload')||c('#pvUpload')||c('[data-pick="files"]')){$('#pjFiles').click();return}
  if(c('#pjUploadDir')||c('[data-pick="folder"]')){$('#pjFolder').click();return}
  if(c('#pjBack')){PV.proj=null;PV.ver=null;PV.pick=false;renderProjects();return}
  if(c('#pjShare')){if(typeof openShare==='function') openShare(p);return}
  if(c('#pjLink')){const u=`${location.origin}${location.pathname}?view=projects&proj=${p.id}`;navigator.clipboard.writeText(u).then(()=>toast(T.cloud?'Link copied. Teammates open it straight here, and Claude can find the project from it.':'Link copied. It opens here on this device; sign in so teammates and Claude can use it.'),()=>toast('Could not copy'));return}
  if(c('#pvBack')){PV.ver=null;renderProjects();return}
  if(b=c('[data-proj-del]')){const q=projById(b.dataset.projDel);if(!q) return;const n=versOf(q).length;
    if(!await confirmDlg(`Delete ${q.name}?`,`${n?`Its ${plural(n,'version')} and every comment on them go too.`:'It has no versions yet.'} This cannot be undone.`,'Delete project')) return;
    const ids=[],paths=[];for(const x of versOf(q)){dropUrls(x);if(!x.demo) ids.push(x.id);if(x.file) paths.push(x.file);for(const a of x.assets){ids.push(a.id);if(a.file) paths.push(a.file)}}
    T.projects=projectsOf(T).filter(x=>x!==q);if(PV.proj===q.id){PV.proj=null;PV.ver=null}save();render();fdbDel([...new Set(ids)]);removeFiles([...new Set(paths)]);toast('Project deleted');return}
  if((b=c('[data-ver-del]'))||c('#pvDel')){const id=b?b.dataset.verDel:null,q=id?verById(p,id):v;if(!q||!p) return;
    if(!await confirmDlg(`Delete ${vLabel(q)}?`,`${q.cm.length?`Its ${plural(q.cm.length,'comment')} go too. `:''}${q===curVer(p)&&prevVer(p,q)?`${vLabel(prevVer(p,q))} becomes the current version. `:''}This cannot be undone.`,'Delete version')) return;
    const orphan=orphanFiles(p,q);dropUrls(q);p.versions=versOf(p).filter(x=>x!==q);if(PV.ver===q.id){PV.ver=null;PV.built=null}if(PV.cmp===q.id) PV.cmp=null;touch(p);save();render();fdbDel(orphan.ids);removeFiles(orphan.paths);toast(`${vLabel(q)} deleted`);return}
  if(b=c('[data-ver-dl]')){const q=verById(p,b.dataset.verDl);if(q) downloadVersion(p,q);return}
  if(c('#pvDownload')){if(v) downloadVersion(p,v);return}
  if(b=c('[data-proj-open]')){if(c('.tk-x')) return;PV.proj=b.dataset.projOpen;PV.ver=null;PV.pick=false;renderProjects();return}
  if(b=c('[data-ver-cmp]')){openVer(b.dataset.verCmp,'compare');return}
  if(b=c('[data-ver-open]')){if(c('.tk-x')||c('[data-ver-cmp]')||c('[data-ver-dl]')) return;openVer(b.dataset.verOpen,PV.mode==='compare'?'comment':null);return}
  if(c('#pjAddBtn')){PV.pick=!PV.pick;renderProject(p);return}
  if(b=c('[data-pjav]')){if(!p.to.includes(b.dataset.pjav)) p.to.push(b.dataset.pjav);PV.pick=false;touch(p);save();render();return}
  if(b=c('[data-pjrm]')){p.to=p.to.filter(id=>id!==b.dataset.pjrm);touch(p);save();render();return}
  if(b=c('#pvDev [data-dev]')){PV.dev=b.dataset.dev;PV.draft=null;pvUpdate();pvLayout();return}
  if(b=c('#pvMode [data-mode]')){if(b.disabled) return;const was=PV.mode;PV.mode=b.dataset.mode;PV.draft=null;PV.sel=null;if(was==='compare'||PV.mode==='compare') renderProjects();else pvUpdate();return}
  if(c('[data-mode-cmp]')){PV.mode='compare';PV.sel=null;PV.draft=null;renderProjects();return}
  if(b=c('[data-pfilter]')){PV.filter=b.dataset.pfilter;PV.sel=null;pvUpdate();return}
  if(b=c('#pvLayer [data-layer]')){PV.layer=b.dataset.layer;PV.sel=null;PV.draft=null;PV.reply=null;pvUpdate();return}
  if(c('#pvCancel')){PV.draft=null;pvUpdate();return}
  if(c('#pvPost')){pvPost();return}
  if(!v) return;
  const cmp=PV.mode==='compare'?(verById(p,PV.cmp)||prevVer(p,v)):null;
  if(cmp){
    if(b=c('[data-cmp-resolve]')){const x=cmById(cmp,b.dataset.cmpResolve);if(!x) return;x.status=x.status==='resolved'?'open':'resolved';touch(p);save();render();toast(x.status==='resolved'?`Resolved on ${vLabel(cmp)}`:'Reopened');return}
    if(b=c('[data-cmp-carry]')){const x=cmById(cmp,b.dataset.cmpCarry);if(!x||v.cm.some(q=>q.from&&q.from.c===x.id)) return;
      v.cm.push({id:uid(),n:allIn(v,layerOf(x)).reduce((m,q)=>Math.max(m,q.n||0),0)+1,...(layerOf(x)==='client'?{layer:'client'}:{}),sel:x.sel,rx:x.rx,ry:x.ry,px:x.px,py:x.py,dev:x.dev,text:x.text,by:x.by,byId:x.byId,...(x.guest?{guest:true}:{}),...(x.snip?{snip:x.snip}:{}),at:Date.now(),status:'open',re:[],from:{v:vLabel(cmp),c:x.id}});
      touch(p);save();render();toast(`Carried to ${vLabel(v)} as an open comment`);return}
    if(b=c('[data-cpin]')||c('[data-cc]')){if(c('button:not(.pin)')) return;const x=cmById(cmp,b.dataset.cpin||b.dataset.cc);if(x) cmpFocus(x);return}
    return;
  }
  if(b=c('[data-pin]')){const x=cmById(v,b.dataset.pin);if(!x) return;PV.sel=PV.sel===x.id?null:x.id;PV.reply=null;PV.draft=null;pvUpdate();const el=$(`#pvSide .pc[data-pc="${x.id}"]`);if(el) el.scrollIntoView({block:'nearest',behavior:'smooth'});return}
  if(b=c('[data-pc-reply]')){PV.sel=b.dataset.pcReply;PV.reply=true;PV.replyText='';PV.draft=null;pvUpdate();return}
  if(b=c('[data-pc-send]')){const x=cmById(v,b.dataset.pcSend),ta=$('#pvReply');if(!x||!ta) return;const text=ta.value.trim();if(!text){ta.focus();return}(x.re=x.re||[]).push({id:uid(),by:'You',byId:me().id,text,at:Date.now()});PV.reply=null;PV.replyText='';touch(p);save();render();return}
  if(b=c('[data-pc-delre]')){const id=b.dataset.pcDelre,undo=snapshot();for(const x of v.cm) x.re=(x.re||[]).filter(r=>r.id!==id);touch(p);save();render();toast('Reply removed',undo);return}
  if(b=c('[data-pc-resolve]')){const x=cmById(v,b.dataset.pcResolve);if(!x) return;x.status=x.status==='resolved'?'open':'resolved';if(x.status==='resolved') PV.sel=null;touch(p);save();render();toast(x.status==='resolved'?'Resolved':'Reopened');return}
  if(b=c('[data-pc-task]')){const x=cmById(v,b.dataset.pcTask);if(!x) return;addTask(x.text.slice(0,120),[me().id],null,null,`From comment #${x.n} on ${vLabel(v)} of ${p.name} (${v.name}).`);render();toast('Task added. It is under Tasks.');return}
  if(b=c('[data-pc-del]')){const x=cmById(v,b.dataset.pcDel);if(!x) return;const undo=snapshot();v.cm=v.cm.filter(q=>q!==x);if(PV.sel===x.id) PV.sel=null;touch(p);save();render();toast('Comment deleted',undo);return}
  if(b=c('[data-pc]')){if(c('textarea')||c('button')) return;const x=cmById(v,b.dataset.pc);if(!x) return;PV.sel=PV.sel===x.id?null:x.id;PV.reply=null;PV.draft=null;pvUpdate();if(PV.sel) pvScrollTo(x);return}
});
$('#vProj').addEventListener('change',e=>{
  const p=PV.proj&&projById(PV.proj);
  if(e.target.id==='pvVer'){openVer(e.target.value);return}
  if(e.target.id==='pvCmp'){PV.cmp=e.target.value;PV.sel=null;renderProjects();return}
  if(e.target.id==='pjDue'&&p){const d=e.target.value||null;if(d===p.due) return;p.due=d;touch(p);save();render();toast(d?`Deadline ${dayLabel(d).replace(/^(Today|Tomorrow|Yesterday)$/,m=>m.toLowerCase())}`:'Deadline removed')}
});
$('#vProj').addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button]')&&!e.target.isContentEditable){e.preventDefault();e.target.click();return}
  if(e.key==='Enter'&&e.target.id==='pjName'){e.preventDefault();e.target.blur();return}
  if(e.key==='Enter'&&!e.shiftKey&&e.target.matches('.pbox')){e.preventDefault();if(e.target.id==='pvText') pvPost();else{const b=e.target.parentElement.querySelector('[data-pc-send]');if(b) b.click()}}
});
$('#vProj').addEventListener('input',e=>{if(e.target.id==='pvText'&&PV.draft) PV.draft.text=e.target.value;if(e.target.id==='pvReply') PV.replyText=e.target.value});
$('#vProj').addEventListener('focusout',e=>{if(e.target.id==='pjName'){const p=PV.proj&&projById(PV.proj);if(!p) return;const n=e.target.textContent.trim().slice(0,60);if(n&&n!==p.name){p.name=n;touch(p);save();renderSide();toast('Renamed')}else e.target.textContent=p.name}});
$('#vProj').addEventListener('mouseover',e=>{const b=e.target.closest('[data-pc],[data-cc]');const id=b&&(b.dataset.pc||b.dataset.cc);$$('#vProj .pin.hov').forEach(x=>x.classList.remove('hov'));if(id) $$(`#vProj .pin[data-pin="${id}"],#vProj .pin[data-cpin="${id}"]`).forEach(x=>x.classList.add('hov'))});
document.addEventListener('pointerdown',e=>{if(PV.pick&&!(e.target.closest&&e.target.closest('#pjAddBtn,#pjDd'))){PV.pick=false;const d=$('#pjDd');if(d) d.remove();const b=$('#pjAddBtn');if(b) b.setAttribute('aria-expanded','false')}});
// drag and drop onto the project or the list
{let depth=0;const el=$('#vProj'),hasFiles=e=>e.dataTransfer&&[...e.dataTransfer.types].includes('Files');
  el.addEventListener('dragenter',e=>{if(!hasFiles(e)) return;e.preventDefault();depth++;const d=$('#pjDrop');if(d) d.classList.add('over')});
  el.addEventListener('dragover',e=>{if(!hasFiles(e)) return;e.preventDefault();e.dataTransfer.dropEffect='copy'});
  el.addEventListener('dragleave',e=>{if(!e.dataTransfer) return;depth=Math.max(0,depth-1);if(!depth){const d=$('#pjDrop');if(d) d.classList.remove('over')}});
  el.addEventListener('drop',e=>{if(!hasFiles(e)) return;e.preventDefault();depth=0;const d=$('#pjDrop');if(d) d.classList.remove('over');dropFiles(e.dataTransfer)});
}
$('#fProject').addEventListener('submit',e=>{const name=e.target.name.value.trim();if(!name){e.preventDefault();return}const p={id:uid(),name,at:Date.now(),by:me().id,who:me().id,to:[],versions:[]};projectsOf(team()).push(p);PV.proj=p.id;PV.ver=null;save();if(UI.view!=='projects') setView('projects',true);render();toast('Project created. Drop the first HTML file in for version 1.')});
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||UI.view!=='projects'||document.querySelector('dialog[open]')) return;if(e.target.matches&&e.target.matches('textarea,input,select,[contenteditable]')){e.target.blur();return}pvEscape()});
addEventListener('resize',()=>{if(UI.view!=='projects') return;if(PV.ver) pvLayout();else fitThumbs()});

/* ---------- the demo project: a landing page, a round of feedback on v1, and the v2 that answers most of it ---------- */
function demoPageHtml(which){
  const v2=which==='v2';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lumen</title>
<style>*{box-sizing:border-box}body{margin:0;font:16px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#1d1d1f;background:#fff}
.nav{display:flex;align-items:center;justify-content:space-between;padding:18px 6vw;max-width:1200px;margin:0 auto}.logo{font-weight:800;letter-spacing:-.02em;font-size:20px}.nav a{color:#1d1d1f;text-decoration:none;margin-left:22px;font-size:14px;font-weight:500}
.hero{background:linear-gradient(135deg,#14131a,#2a2340 60%,#4a3b7a);color:#fff;padding:80px 6vw 90px;text-align:center}.hero h1{font-size:clamp(34px,6vw,62px);line-height:1.05;letter-spacing:-.03em;margin:0 auto 18px;max-width:840px}.hero p{font-size:19px;opacity:.8;max-width:560px;margin:0 auto 32px}
.btn{display:inline-block;background:#111;color:#fff;padding:16px 30px;border-radius:14px;font-weight:700;text-decoration:none;font-size:16px}${v2?'.hero .btn{background:#b79cf0;color:#1c1230}':''}
.lamp{width:150px;height:150px;margin:0 auto 30px;border-radius:50%;background:radial-gradient(circle at 50% 42%,#ffe9a8,#f7b64a 52%,rgba(247,182,74,0) 72%)}
.feat{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:70px 6vw;max-width:1200px;margin:0 auto}.feat div{background:#f5f4fa;border-radius:20px;padding:28px}.feat h3{margin:0 0 8px;font-size:18px}.feat p{margin:0;color:#5a5a66;font-size:15px}.ico{width:40px;height:40px;border-radius:12px;background:#b79cf0;margin-bottom:18px}
.plans{background:#f8f7fc;padding:70px 6vw}.plans h2{text-align:center;margin:0 0 36px;font-size:34px;letter-spacing:-.02em}.row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;max-width:820px;margin:0 auto}
.plan{background:#fff;border-radius:22px;padding:30px;box-shadow:0 10px 40px rgba(20,19,26,.08)}.plan.pro{box-shadow:0 0 0 2px #b79cf0,0 10px 40px rgba(20,19,26,.08)}.plan h3{margin:0;font-size:16px;color:#6b6b78;font-weight:600}.price{font-size:44px;font-weight:800;letter-spacing:-.03em;margin:8px 0 16px}.price small{font-size:15px;font-weight:500;color:#6b6b78}
.plan ul{padding-left:18px;margin:0 0 22px;color:#5a5a66;font-size:15px;line-height:1.9}.plan .btn{display:block;text-align:center}.plan.pro .btn{background:#b79cf0;color:#1c1230}
footer{padding:40px 6vw;display:flex;justify-content:space-between;align-items:center;max-width:1200px;margin:0 auto;color:#6b6b78;font-size:14px;flex-wrap:wrap;gap:12px}footer a{color:#6b6b78;text-decoration:none;margin-left:18px}
@media (max-width:760px){.feat,.row{grid-template-columns:1fr}.hero{padding:56px 6vw 64px}.nav a{margin-left:14px}}</style></head>
<body><nav class="nav"><span class="logo">Lumen</span><span><a href="#features">Features</a><a href="#plans">Plans</a><a href="#plans">Pre-order</a></span></nav>
<section class="hero"><div class="lamp"></div>${v2?'<h1 id="hero-title">The desk lamp that follows the sun</h1><p>For the people who work late: Lumen shifts from cool daylight to warm amber as your evening goes on, so your eyes never notice the hours.</p>':'<h1 id="hero-title">The desk lamp that follows the sun, for the people who work late</h1><p>Lumen shifts from cool daylight to warm amber as your evening goes on, so your eyes never notice the hours.</p>'}<a class="btn" id="cta" href="#plans">Pre-order for $89</a></section>
<section class="feat" id="features"><div><div class="ico"></div><h3>Follows the sun</h3><p>Colour temperature tracks sunrise and sunset where you are. No app needed, it just knows.</p></div><div><div class="ico"></div><h3>One touch</h3><p>Tap the base for three brightness levels. Hold it to pause the sun for an hour.</p></div><div><div class="ico"></div><h3>Built to stay</h3><p>Machined aluminium, a braided cord and a ten year warranty on the light itself.</p></div></section>
<section class="plans" id="plans"><h2>Pick a plan</h2><div class="row"><div class="plan" id="plan-solo"><h3>Solo</h3><div class="price">$89</div><ul><li>One Lumen lamp</li><li>Free shipping</li><li>Ten year warranty</li></ul><a class="btn" href="#">Pre-order</a></div><div class="plan pro" id="plan-pro"><h3>Team</h3><div class="price">$79 <small>${v2?'per lamp, from three lamps':'per lamp'}</small></div><ul><li>Three lamps or more</li><li>Shared sunrise schedule</li><li>Priority support</li></ul><a class="btn" href="#">Talk to us</a></div></div></section>
<footer><span>© 2026 Lumen Labs</span><span id="footer-links"><a href="#">Shipping</a><a href="#">Returns</a><a href="#">Privacy</a></span></footer></body></html>`}
function demoProject(T){
  if(projectsOf(T).some(p=>p.demo)) return;
  const by=n=>T.members.find(m=>first(m.name)===n)||me(),A=by('Amara'),J=by('Jonas'),So=by('Sofia'),Me=me(),now=Date.now();
  const cm=(n,sel,rx,ry,dev,z,text,ago,o={})=>({id:uid(),n,sel,rx,ry,px:0,py:0,dev,text,by:z.isMe?'You':first(z.name),byId:z.id,at:now-ago*MIN,status:o.status||'open',re:(o.re||[]).map(([q,t,g])=>({id:uid(),by:q.isMe?'You':first(q.name),byId:q.id,text:t,at:now-g*MIN}))});
  const v1={id:uid(),n:1,name:'index.html',path:'lumen/index.html',demo:'v1',size:6140,at:now-26*HR,by:Me.id,assets:[],cm:[
    cm(1,'#hero-title',.5,.5,'phone',A,'The headline wraps to four lines on phones. Can "for the people who work late" become the subline?',24*60,{re:[[Me,'Good call, trying a two-line version.',23*60]]}),
    cm(2,'#cta',.5,.5,'desktop',J,'Make this lavender like the plan buttons. Black on the dark hero disappears.',22*60),
    cm(3,'#plan-pro>.price',.6,.5,'tablet',So,'Is $79 only from three lamps? Say so next to the price, people will ask.',20*60,{re:[[Me,'@Sofia yes, minimum three. Adding it.',19*60],[So,'Thanks!',18*60]]}),
    cm(4,'#footer-links',.2,.5,'desktop',A,'Privacy link is missing.',25*60,{status:'resolved',re:[[Me,'Added.',24*60+30]]}),
    cm(5,'.feat>div:nth-of-type(2)>p',.5,.5,'desktop',J,'"Hold it to pause the sun" needs a tiny icon next to it.',21*60)]};
  const v2={id:uid(),n:2,name:'index.html',path:'lumen/index.html',demo:'v2',size:6210,at:now-50*MIN,by:Me.id,assets:[],cm:[]};
  projectsOf(T).push({id:uid(),name:'Lumen launch',demo:true,at:now-16*MIN,by:Me.id,who:So.id,due:shiftDay(today(),4),to:[Me.id,A.id],versions:[v1,v2]});
}
{const _bd=buildDemo;buildDemo=function(){_bd();demoProject(team());save()}}
upgradeProjects();
if(team().demo){demoProject(team());save()}
if(UI.view==='projects') renderProjects();
// address hooks for screenshots: ?proj=first opens the first project, &ver=first|last a version in the viewer, &mode=compare the side-by-side
{const q=new URLSearchParams(location.search),id=q.get('proj');if(!SHARE&&id&&/^[0-9a-f-]{36}$/i.test(id)){PJ.want={id:id.toLowerCase(),n:+(q.get('ver')||'').replace(/^v/i,'')||null};setView('projects',true);render()}}
addEventListener('load',()=>{const q=window.__hook;if(!q||q.get('proj')!=='first') return;const p=projectsOf(team())[0];if(!p) return;setView('projects',true);PV.proj=p.id;
  const L=versOf(p);if(q.get('ver')&&L.length){PV.ver=(q.get('ver')==='first'?L[0]:L[L.length-1]).id;if(q.get('mode')==='compare'&&prevVer(p,verById(p,PV.ver))) PV.mode='compare'}render()});
