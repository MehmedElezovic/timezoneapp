/* Noon · static ads. A page's third tab, next to Copy and Design: ad images (usually AI-made) uploaded in batches, that
   the team approves or rejects and comments on. Every ad keeps three files: a small thumbnail for the grid, a review copy
   the team looks at (2000px at most, WebP where the browser can write it) and the full-size original. The grid and the
   viewer only ever load the first two, so a page with a few hundred ads still opens fast; the originals are there to
   download the approved ones, and the originals of rejected ads can be removed to free space while their review copy,
   decision and comments stay. */

/* ---------- icons and state ---------- */
const ADI={
  img:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="17" height="16" rx="3"/><circle cx="9" cy="9.5" r="1.8"/><path d="M20.5 15.5l-5-5-9 9.5"/></svg>',
  next:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  ok:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  no:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  again:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4.2h-4.2"/></svg>',
};
const AD={page:null,open:null,filter:'all',cf:'open',sel:null,draft:null,reply:false,replyText:'',menu:null,up:null,pend:{},urls:{},io:null,scroll:0};
const AD_MAX=50*1048576,AD_REVIEW=2000,AD_THUMB=480,AD_TYPES=/\.(png|jpe?g|webp|avif)$/i;
const adsOf=p=>(p.ads=p.ads||[]);
const adById=(p,id)=>adsOf(p).find(a=>a.id===id)||null;
const adLabel=a=>'Ad '+a.n;
const adCm=a=>(a.cm=a.cm||[]);
const adOpenCm=a=>adCm(a).filter(c=>c.status!=='resolved');
const adOpenCount=p=>adsOf(p).reduce((n,a)=>n+adOpenCm(a).length,0);
const adIn=a=>AD.filter==='all'||a.status===AD.filter;
// the order on screen: the newest batch first, each batch in the order it came in
const adOrder=p=>[...adsOf(p)].sort((a,b)=>((b.batch||1)-(a.batch||1))||(a.n-b.n));
const adList=p=>adOrder(p).filter(adIn);
const adCounts=p=>{const L=adsOf(p);return {all:L.length,open:L.filter(a=>a.status==='open').length,approved:L.filter(a=>a.status==='approved').length,rejected:L.filter(a=>a.status==='rejected').length}};
function adReset(p){if(AD.page===p.id) return;AD.page=p.id;AD.open=null;AD.filter='all';AD.sel=null;AD.draft=null;AD.reply=false;AD.menu=null;AD.scroll=0}
function adMode(p){adReset(p);return AD.open&&adById(p,AD.open)?'view':'list'}

/* ---------- the files: a thumbnail, a review copy and the original, each kept on this device once seen ---------- */
async function adUrl(a,kind){
  const key=a.id+':'+kind;if(AD.urls[key]) return AD.urls[key];
  let b=await fileBlob(key,kind==='t'?a.thumb:kind==='r'?a.review:a.orig);
  if(!b&&kind==='t') b=await fileBlob(a.id+':r',a.review); // no thumbnail: the review copy stands in
  return b?(AD.urls[key]=URL.createObjectURL(b)):null;
}
function adDropUrls(a){for(const k of ['o','r','t']){const u=AD.urls[a.id+':'+k];if(u){URL.revokeObjectURL(u);delete AD.urls[a.id+':'+k]}}}
// a smaller copy of the image: WebP where the browser can write it (Safari cannot), JPEG otherwise
async function adCopy(bmp,max,q){
  const s=Math.min(1,max/Math.max(bmp.width,bmp.height)),w=Math.max(1,Math.round(bmp.width*s)),h=Math.max(1,Math.round(bmp.height*s));
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(bmp,0,0,w,h);
  let b=await new Promise(r=>cv.toBlob(r,'image/webp',q));
  if(!b||b.type!=='image/webp') b=await new Promise(r=>cv.toBlob(r,'image/jpeg',q));
  cv.width=cv.height=0;return b;
}
const adExt=b=>({'image/webp':'.webp','image/jpeg':'.jpg','image/png':'.png','image/avif':'.avif'})[b.type]||'';
const adSafe=s=>String(s||'').replace(/[\\/:*?"<>|]+/g,'-');

/* ---------- taking a batch in ----------
   A batch shows up at once as one card per image, in name order: grey while it waits, then its light copy, faint, filling
   up as its three files go to the account. Three images go at a time. Each ad is saved the moment it is in, in name
   order, so a reload of the team from the account (a teammate's change, or the echo of our own saves) never loses the
   rest; ads saved here that such a reload has not brought back yet are put back in (adPendMerge, called by sync). An
   image that cannot be added stays as a card that says why, with Try again when trying again can help. */
const AD_PAR=3;
const adUpOf=p=>AD.up&&AD.up.pid===p.id?AD.up:null;
const adUpLive=up=>up.items.filter(it=>!it.gone);
const adUpBusy=()=>!!(AD.up&&adUpLive(AD.up).some(it=>it.st==='wait'||it.st==='prep'||it.st==='send'||it.st==='ready'));
const adUpCount=up=>{const L=adUpLive(up);return {all:L.length,todo:L.filter(it=>!it.fixed).length,done:L.filter(it=>it.st==='done').length,fail:L.filter(it=>it.st==='fail').length}};
const adUpPct=up=>{const L=adUpLive(up).filter(it=>!it.fixed);return L.length?L.reduce((s,it)=>s+(it.st==='done'||it.st==='fail'?1:it.pct),0)/L.length:1};
const adUpProj=up=>{const T=S.teams.find(t=>t.id===up.tid);return {T,p:T?projectsOf(T).find(x=>x.id===up.pid)||null:null}};
const adPhLabel=it=>it.st==='wait'?'Waiting':it.st==='prep'?'Preparing':it.st==='ready'?'Saving':Math.round(it.pct*100)+'%';
function adWhy(e){
  const m=String((e&&e.message)||e||'').trim();
  if(/maximum allowed size|too large|payload|\b413\b/i.test(m)) return 'Too big for the account: 50 MB at most';
  if(/row-level security|not authori[sz]ed|unauthori[sz]ed|\b403\b/i.test(m)) return 'Your account could not save it here';
  return m?m.replace(/\.$/,''):'It did not go through';
}
async function adUpload(p,files){
  const T=team();
  if(T.cloud&&cloudOn()&&!CLOUD.adOn){toast('Ads need the latest database update, and it is not there yet. Reload the page; if this stays, the update has not run.');return}
  if(adUpBusy()){toast(AD.up.pid===p.id?'Still adding the last batch':'Still adding ads to another page');return}
  files=[...files].filter(f=>!f.name.startsWith('.')); // hidden files a folder brings along (.DS_Store)
  const ok=f=>AD_TYPES.test(f.name)||/^image\/(png|jpeg|webp|avif)$/.test(f.type);
  if(!files.some(ok)){if(files.length) toast('Upload PNG, JPG or WebP images');return}
  files.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
  const batch=adsOf(p).reduce((m,a)=>Math.max(m,a.batch||0),0)+1;
  AD.up={tid:T.id,pid:p.id,batch,next:0,workers:0,at:Date.now(),by:me().id,items:files.map((f,i)=>{
    const why=!ok(f)?'Not a PNG, JPG or WebP image':f.size>AD_MAX?`Over 50 MB (${fmtSize(f.size)})`:'';
    return {key:uid(),i,f,st:why?'fail':'wait',why,fixed:!!why,pct:0,thumb:null,a:null,id:null,gone:false}})};
  if(AD.filter==='approved'||AD.filter==='rejected') AD.filter='all';
  const b=$('#pjDrop');if(b&&PV.proj===p.id&&!AD.open) b.scrollTop=0;AD.scroll=0;
  render();adUpRun(AD.up);
}
function adUpRun(up){
  while(AD.up===up&&up.workers<AD_PAR&&up.items.some(it=>it.st==='wait'&&!it.gone)){up.workers++;adUpWorker(up)}
}
async function adUpWorker(up){
  try{for(;;){if(AD.up!==up) break;const it=up.items.find(x=>x.st==='wait'&&!x.gone);if(!it) break;await adUpOne(up,it)}}
  finally{up.workers--;if(!up.workers) adUpEnd(up)}
}
async function adUpOne(up,it){
  it.st='prep';it.pct=0;it.why='';adUpPaint(it);
  const f=it.f,{T}=adUpProj(up),cloud=!!(T&&cloudFiles(T)),paths=[];let a=null;
  try{
    if(!T) throw new Error('The team is not here any more');
    const unreadable=()=>Object.assign(new Error('This image could not be read'),{fixed:true}); // trying again would not help
    let bmp;try{bmp=await createImageBitmap(f)}catch(e){throw unreadable()}
    const w=bmp.width,h=bmp.height,rv=await adCopy(bmp,AD_REVIEW,.86),th=await adCopy(bmp,AD_THUMB,.8);if(bmp.close) bmp.close();
    if(!rv||!th) throw unreadable();
    a={id:uid(),n:0,batch:up.batch,name:f.name.slice(0,200),w,h,size:f.size,orig:null,review:null,thumb:null,status:'open',by:up.by,at:Date.now(),cm:[]};
    await fdbPut(a.id+':t',th);await fdbPut(a.id+':r',rv);
    it.thumb=AD.urls[a.id+':t']=URL.createObjectURL(th);it.st='send';adUpPaint(it);
    if(cloud){
      const dir='ads/'+a.id,tot=th.size+rv.size+f.size||1;let sent=0;
      const go=async(name,b,type)=>{const path=await adPut(T,up.pid,dir,name,b,type,x=>{it.pct=Math.min(.99,(sent+x)/tot);adUpPaint(it)});paths.push(path);sent+=b.size;return path};
      a.thumb=await go('thumb'+adExt(th),th,th.type);
      a.review=await go('review'+adExt(rv),rv,rv.type);
      a.orig=await go('original'+(adExt(f)||'.'+(f.name.split('.').pop()||'png').toLowerCase()),f,f.type||typeOfName(f.name));
    }else await fdbPut(a.id+':o',f); // a team on this device only: the original lives here
    it.pct=1;it.a=a;it.st='ready';
  }catch(e){
    console.warn('ad',f.name,e);
    if(paths.length) removeFiles(paths);
    if(a){fdbDel([a.id+':t',a.id+':r',a.id+':o']).catch(()=>{});adDropUrls(a)}
    it.st='fail';it.why=adWhy(e);it.fixed=!!e.fixed;it.thumb=null;it.a=null;
  }
  adUpCommit(up);adUpRender(up);
}
// one file into the account's storage, reporting the bytes sent: the request supabase-js makes, through XHR because
// fetch cannot report upload progress
async function adPut(T,pid,dir,rel,blob,type,onp){
  const path=`${T.id}/${pid}/${dir}/${rel}`,{data}=await sb.auth.getSession(),tok=data&&data.session&&data.session.access_token;
  if(!tok) throw new Error('You are signed out. Sign in, then try again');
  await new Promise((done,fail)=>{const x=new XMLHttpRequest();
    x.open('POST',`${SB_URL}/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`);
    x.setRequestHeader('authorization','Bearer '+tok);x.setRequestHeader('apikey',SB_KEY);x.setRequestHeader('x-upsert','true');
    x.setRequestHeader('content-type',type||'application/octet-stream');x.setRequestHeader('cache-control','max-age=3600');
    x.upload.onprogress=e=>{if(e.lengthComputable) onp(Math.min(e.loaded,blob.size))};
    x.onload=()=>{if(x.status>=200&&x.status<300){onp(blob.size);done();return}
      let m='';try{const j=JSON.parse(x.responseText);m=j.message||j.error||''}catch(e){}fail(new Error(m||`The upload was refused (${x.status})`))};
    x.onerror=()=>fail(new Error('The connection dropped'));x.ontimeout=()=>fail(new Error('The upload timed out'));
    x.send(blob)});
  return path;
}
// ads go into the page in name order: one goes in once every image before it is in or has failed; one tried again
// after the rest went in goes in at the end
function adUpCommit(up){
  if(AD.up!==up) return;let p=null;
  const put=it=>{p=p||adUpProj(up).p;if(!p){it.st='fail';it.why='The page is not here any more';return}
    const a=it.a;a.n=adsOf(p).reduce((m,x)=>Math.max(m,x.n||0),0)+1;adsOf(p).push(a);if(adUpProj(up).T.cloud) AD.pend[a.id]={tid:up.tid,pid:up.pid,a};it.id=a.id;it.a=null;it.st='done'};
  while(up.next<up.items.length){const it=up.items[up.next];if(it.st==='ready') put(it);else if(it.st!=='fail'&&!it.gone) break;up.next++}
  for(const it of up.items) if(it.st==='ready'&&it.i<up.next) put(it);
  if(p){touch(p);save()}
}
function adUpEnd(up){
  if(AD.up!==up) return;adUpCommit(up);
  const c=adUpCount(up);if(!c.fail) AD.up=null;adUpRender(up);
  toast(!c.fail?`${plural(c.done,'ad')} added as batch ${up.batch}`:c.done?`${c.done} of ${plural(c.all,'image')} added. ${c.fail} could not be: each of those cards says why.`:`None of those images could be added: each card says why.`);
}
function adUpRetry(key){
  const up=AD.up,it=up&&up.items.find(x=>x.key===key);if(!it||it.st!=='fail'||it.fixed) return;
  it.st='wait';it.why='';it.pct=0;adUpRender(up);adUpRun(up);
}
function adUpDrop(key){
  const up=AD.up,it=up&&up.items.find(x=>x.key===key);if(!it||it.st!=='fail') return;
  it.gone=true;if(!adUpLive(up).some(x=>x.st!=='done')) AD.up=null;adUpRender(up);
}
// ads saved here that a reload from the account has not brought back yet: they go back in, and the next save sends them
function adPendMerge(){
  let back=false;
  for(const [id,x] of Object.entries(AD.pend)){
    const T=S.teams.find(t=>t.id===x.tid),p=T&&projectsOf(T).find(q=>q.id===x.pid);
    if(!p||adById(p,id)){delete AD.pend[id];continue}
    adsOf(p).push(x.a);back=true;
  }
  return back;
}
addEventListener('beforeunload',e=>{if(adUpBusy()){e.preventDefault();e.returnValue=''}});

/* the cards of a batch on its way in, and the bar above the grid */
function adPhHtml(it){
  const name=esc(it.f.name);
  if(it.st==='fail') return `<div class="ad-card ad-ph fail" data-adup="${it.key}"><div class="ad-th"><span class="ad-ph-why"><b>Not added</b><small>${esc(it.why)}</small></span></div>
    <div class="ad-cf"><span class="ad-ph-name" title="${name}">${name}</span>${it.fixed?'':`<button type="button" class="ad-tick" data-adup-retry="${it.key}" title="Try again" aria-label="Try ${name} again">${ADI.again}</button>`}<button type="button" class="ad-tick" data-adup-x="${it.key}" title="Remove this card" aria-label="Remove the card for ${name}">${ADI.no}</button></div></div>`;
  return `<div class="ad-card ad-ph ${it.st}" data-adup="${it.key}" title="${name}"><div class="ad-th${it.thumb?' has':''}"><img alt=""${it.thumb?` src="${it.thumb}"`:''}><span class="ad-ph-bar"><i style="width:${Math.round(it.pct*100)}%"></i></span></div>
    <div class="ad-cf"><span class="ad-ph-line"></span><span class="sp"></span><small class="ad-ph-pct">${adPhLabel(it)}</small></div></div>`;
}
function adUpSecHtml(p,up,all){
  const T=team(),c=adUpCount(up),busy=adUpBusy(),seen=new Set(),cards=[];
  for(const it of adUpLive(up)){
    if(it.st==='done'){const a=adById(p,it.id);if(a){seen.add(a.id);if(adIn(a)) cards.push(adCardHtml(a))}}
    else cards.push(adPhHtml(it));
  }
  for(const a of all) if(!seen.has(a.id)&&adIn(a)) cards.push(adCardHtml(a));
  const sub=busy?`Adding ${c.done} of ${plural(c.todo,'ad')}`:`${plural(c.done,'ad')} added${c.fail?` · ${c.fail} not added`:''} · ${esc(agoLabel(up.at))} by ${esc(whoName(T,up.by))}`;
  return `<section class="ad-batch"><div class="ad-bh"><b>Batch ${up.batch}</b><small>${sub}</small><span class="sp"></span>${!busy&&all.length?`<button type="button" class="fd-act" data-ad-delbatch="${up.batch}" title="Delete batch ${up.batch}" aria-label="Delete batch ${up.batch}">${I.trash}</button>`:''}</div>
    <div class="ad-grid">${cards.join('')}</div></section>`;
}
function adUpBarHtml(p){
  const up=adUpOf(p);if(!up||!adUpBusy()) return '';const c=adUpCount(up),pc=Math.round(adUpPct(up)*100);
  return `<span class="ad-upt">Adding ${c.done} of ${c.todo}</span><span class="ad-upbar" role="progressbar" aria-label="Adding ads" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pc}"><i style="width:${pc}%"></i></span>`;
}
// while the files go up only the bars move; the grid is drawn again when an ad goes in or an image fails
function adUpPaint(it){
  const el=document.querySelector(`[data-adup="${it.key}"]`);
  if(el){el.className=`ad-card ad-ph ${it.st}`;const th=el.querySelector('.ad-th'),img=th&&th.querySelector('img'),bar=el.querySelector('.ad-ph-bar i'),t=el.querySelector('.ad-ph-pct');
    if(it.thumb&&img&&!img.getAttribute('src')){img.src=it.thumb;th.classList.add('has')}
    if(bar) bar.style.width=Math.round(it.pct*100)+'%';if(t) t.textContent=adPhLabel(it)}
  const up=AD.up,box=$('#adBusy');if(!up||!box||PV.proj!==up.pid) return;
  const i=box.querySelector('.ad-upbar'),t=box.querySelector('.ad-upt'),c=adUpCount(up),pc=Math.round(adUpPct(up)*100);
  if(i){i.firstElementChild.style.width=pc+'%';i.setAttribute('aria-valuenow',pc)}if(t) t.textContent=`Adding ${c.done} of ${c.todo}`;
}
function adUpRender(up){if(UI.view==='projects'&&PV.proj===up.pid&&PV.tab==='ads') render()}
function adDrop(dt){const p=PV.proj&&projById(PV.proj);if(p) adUpload(p,[...dt.files])}
$('#adFiles').addEventListener('change',e=>{const p=PV.proj&&projById(PV.proj),l=[...e.target.files];e.target.value='';if(p) adUpload(p,l)});

/* ---------- the tab: every batch as a grid, or one ad open with its comments ---------- */
function adsViewHtml(p){
  adReset(p);const L=adsOf(p),next=L.reduce((m,a)=>Math.max(m,a.batch||0),0)+1;
  const over=`<div class="pj-over">${PI.up}<b>Drop the images to add them as batch ${next}</b></div>`;
  if(!L.length&&!adUpOf(p)) return `<div class="pj-dz big"><span class="ic">${ADI.img}</span><b>No ads for ${esc(p.name)} yet</b><small>Upload a batch of ad images, or drop them here. Noon makes a light copy of each for the team to look at, so even a few hundred ads open fast, and keeps the full-size file for downloading the ones you approve.</small>
    <ul class="pj-need"><li><b>PNG, JPG or WebP</b>, up to 50 MB each.</li><li><b>A batch at a time</b>, 5, 10 or 20 images: each upload is its own batch.</li><li><b>Approve or reject</b> each ad, and comment on any spot of it.</li></ul>
    <span class="pj-dz-acts"><button type="button" class="btn dark" data-ad-up>${PI.up}Upload ads</button></span></div>${over}`;
  return (adMode(p)==='view'?adViewHtml(p,adById(p,AD.open)):adListHtml(p))+over;
}
function adListHtml(p){
  // drawn again in place (an ad going in, a teammate's change): the grid keeps where it was scrolled to
  {const b=$('#pjDrop');if(b&&!AD.scroll&&AD.listFor===p.id&&b.querySelector('.ad-bar')) AD.scroll=b.scrollTop}AD.listFor=p.id;
  const T=team(),k=adCounts(p),free=adsOf(p).filter(a=>a.status==='rejected'&&!a.gone),freed=free.reduce((n,a)=>n+(a.size||0),0);
  const seg=[['all','All'],['open','To decide'],['approved','Approved'],['rejected','Rejected']].map(([f,l])=>`<button type="button" class="${AD.filter===f?'on':''}" data-ad-filter="${f}">${l}<i>${k[f]||''}</i></button>`).join('');
  const up=adUpOf(p),batches=[...new Set([...adsOf(p).map(a=>a.batch||1),...(up?[up.batch]:[])])].sort((a,b)=>b-a);
  const secs=batches.map(b=>{const all=adOrder(p).filter(a=>(a.batch||1)===b),vis=all.filter(adIn);if(up&&b===up.batch) return adUpSecHtml(p,up,all);if(!vis.length) return '';
    const ap=all.filter(a=>a.status==='approved').length,rj=all.filter(a=>a.status==='rejected').length,f0=all[0];
    return `<section class="ad-batch"><div class="ad-bh"><b>Batch ${b}</b><small>${plural(all.length,'ad')} · ${esc(agoLabel(f0.at||Date.now()))} by ${esc(whoName(T,f0.by))}${ap?` · ${ap} approved`:''}${rj?` · ${rj} rejected`:''}</small><span class="sp"></span><button type="button" class="fd-act" data-ad-delbatch="${b}" title="Delete batch ${b}" aria-label="Delete batch ${b}">${I.trash}</button></div>
      <div class="ad-grid">${vis.map(adCardHtml).join('')}</div></section>`}).join('');
  const menu=AD.menu==='list'?`<div class="dd fd-menu" role="menu"><button type="button" class="opt" role="menuitem" data-ad-do="free" ${free.length?'':'disabled'}>${I.trash}<span class="n">Remove full-size files of rejected ads<small>${free.length?`${plural(free.length,'ad')}, frees ${fmtSize(freed)}. Review copies, decisions and comments stay.`:'No rejected ad has one left'}</small></span></button></div>`:'';
  return `<div class="ad-bar"><div class="seg sm" id="adFilter" aria-label="Which ads">${seg}</div><span class="sp"></span><span class="ad-busy" id="adBusy">${adUpBarHtml(p)}</span>
      ${k.approved?`<button type="button" class="btn sm" data-ad-zip title="A zip of the full-size files of the ${plural(k.approved,'approved ad')}">${PI.dl}<span>Download approved</span></button>`:''}<button type="button" class="btn sm dark" data-ad-up title="Add the next batch">${PI.up}<span>Upload ads</span></button>
      <div class="fd-more"><button type="button" class="btn sm icon" id="adListMore" aria-label="More for the ads" aria-haspopup="menu" aria-expanded="${AD.menu==='list'}">${I.more}</button>${menu}</div></div>
    ${secs||`<p class="pv-empty ad-none">${AD.filter==='open'?'Every ad has a decision.':`No ${AD.filter} ads yet.`}</p>`}`;
}
function adCardHtml(a){
  const st=a.status,o=adOpenCm(a).length;
  return `<div class="ad-card ${st}" role="button" tabindex="0" data-ad-open="${a.id}" aria-label="${adLabel(a)}${st!=='open'?', '+st:''}"><div class="ad-th"><img data-adt="${a.id}" alt="">${st==='approved'?`<span class="ad-badge" title="Approved">${ADI.ok}</span>`:''}</div>
    <div class="ad-cf"><span class="ad-n">${adLabel(a)}</span>${o?`<span class="ad-cc" title="${plural(o,'open comment')}">${PI.bubble}${o}</span>`:''}<span class="sp"></span>
      <button type="button" class="ad-tick ok${st==='approved'?' on':''}" data-ad-quick="approved" data-id="${a.id}" aria-pressed="${st==='approved'}" title="${st==='approved'?'Approved: click to take it back':'Approve'}" aria-label="Approve ${adLabel(a)}">${ADI.ok}</button><button type="button" class="ad-tick no${st==='rejected'?' on':''}" data-ad-quick="rejected" data-id="${a.id}" aria-pressed="${st==='rejected'}" title="${st==='rejected'?'Rejected: click to take it back':'Reject'}" aria-label="Reject ${adLabel(a)}">${ADI.no}</button></div></div>`;
}
function adViewHtml(p,a){
  const T=team(),vis=adList(p),L=vis.includes(a)?vis:adOrder(p),i=L.indexOf(a),st=a.status;
  const meta=[`Batch ${a.batch||1}`,esc(a.name),a.w?`${a.w}×${a.h}`:'',a.size?fmtSize(a.size):'',a.gone?'full size removed':'',`${esc(agoLabel(a.at||Date.now()))} by ${esc(whoName(T,a.by))}`].filter(Boolean).join(' · ');
  const menu=AD.menu==='ad'?`<div class="dd fd-menu" role="menu"><button type="button" class="opt" role="menuitem" data-ad-do="dl">${PI.dl}<span class="n">Download<small>${a.gone?'The review copy: the full-size file was removed':'The full-size file'}</small></span></button><hr class="dd-sep"><button type="button" class="opt danger" role="menuitem" data-ad-do="del">${I.trash}<span class="n">Delete ${adLabel(a).toLowerCase()}</span></button></div>`:'';
  return `<div class="cp ad-view"><div class="cp-main">
      <div class="cp-bar"><button type="button" class="chev" id="adBack" aria-label="All ads" title="All ads">${PI.back}</button><span class="pv-ttl"><b>${adLabel(a)}</b><small>${meta}</small></span>${st==='approved'?`<span class="cp-final">${I.check}Approved</span>`:st==='rejected'?'<span class="ad-rej">Rejected</span>':''}<span class="sp"></span>
        <span class="ad-pos">${i+1} of ${L.length}</span><button type="button" class="btn sm icon" data-ad-step="-1" aria-label="Previous ad" title="Previous ad (←)" ${i<=0?'disabled':''}>${PI.back}</button><button type="button" class="btn sm icon" data-ad-step="1" aria-label="Next ad" title="Next ad (→)" ${i>=L.length-1?'disabled':''}>${ADI.next}</button>
        <button type="button" class="btn sm ad-yes${st==='approved'?' on':''}" data-ad-set="approved" aria-pressed="${st==='approved'}" title="${st==='approved'?'Click to take the approval back':'Approve, then show the next ad'}">${ADI.ok}<span>${st==='approved'?'Approved':'Approve'}</span></button><button type="button" class="btn sm ad-nope${st==='rejected'?' on':''}" data-ad-set="rejected" aria-pressed="${st==='rejected'}" title="${st==='rejected'?'Click to take the rejection back':'Reject, then show the next ad'}">${ADI.no}<span>${st==='rejected'?'Rejected':'Reject'}</span></button>
        <div class="fd-more"><button type="button" class="btn sm icon" id="adMore" aria-label="More for ${adLabel(a).toLowerCase()}" aria-haspopup="menu" aria-expanded="${AD.menu==='ad'}">${I.more}</button>${menu}</div></div>
      <div class="ad-stage" id="adStage"><div class="ad-frame" id="adFrame"><img id="adImg" alt="${esc(adLabel(a))}"><div class="ad-pins" id="adPins"></div></div><p class="ad-load" id="adLoad">Loading ${esc(adLabel(a).toLowerCase())}…</p></div></div>
    <aside class="pv-side cp-side" id="adSide">${adSideHtml(p,a)}</aside></div>`;
}
const adShowCm=c=>AD.cf==='all'||(AD.cf==='open')===(c.status!=='resolved');
function adSideHtml(p,a){
  const all=adCm(a),open=all.filter(c=>c.status!=='resolved').length,res=all.length-open,list=all.filter(adShowCm).sort((x,y)=>x.n-y.n);
  const empty=all.length?AD.cf==='open'?'Nothing open here.':'Nothing resolved yet.':'No comments yet. Click any spot of the ad to leave one there.';
  return `<div class="pv-sh"><h3>Comments on ${esc(adLabel(a).toLowerCase())}</h3><div class="seg sm" id="adCf"><button type="button" data-ad-cf="open" class="${AD.cf==='open'?'on':''}">Open<i>${open||''}</i></button><button type="button" data-ad-cf="resolved" class="${AD.cf==='resolved'?'on':''}">Resolved<i>${res||''}</i></button><button type="button" data-ad-cf="all" class="${AD.cf==='all'?'on':''}">All</button></div></div>
    <div class="pv-list" id="adList">${AD.draft?adComposerHtml():`<button type="button" class="ad-whole" data-ad-whole>${PI.bubble}<span><b>Comment on the whole ad</b><small>Or click any spot of it to pin a comment there.</small></span></button>`}${list.map(c=>adCmHtml(a,c)).join('')}${list.length||AD.draft?'':`<p class="pv-empty">${empty}</p>`}</div>`;
}
const adComposerHtml=()=>`<div class="pc sel cp-new"><div class="pc-top"><span class="pin-n">${I.plus}</span><b>${AD.draft.x==null?'Comment on the whole ad':'New comment'}</b></div><textarea class="cbox pbox" id="adText" rows="2" maxlength="1000" placeholder="Comment, @ to mention someone">${esc(AD.draft.text||'')}</textarea><div class="pv-new-acts"><button type="button" class="btn sm ghost" data-ad-cancel>Cancel</button><button type="button" class="btn sm dark" data-ad-post>Comment</button></div></div>`;
function adCmHtml(a,c){
  const T=team(),my=me().id,sel=c.id===AD.sel,res=c.status==='resolved',z=whoOf(T,c.byId);
  return `<div class="pc${sel?' sel':''}${res?' res':''}" data-adc="${c.id}" role="button" tabindex="0">
    <div class="pc-top"><span class="pin-n">${res?I.check:c.n}</span>${avatar(z,'xs')}<b>${esc(nameOf(T,c.byId,c.by))}</b><time>${esc(agoLabel(c.at))}</time>${c.x==null?'<span class="pc-from" title="On the whole ad">Whole ad</span>':''}</div>
    <p>${mentionHtml(c.text)}</p>
    ${(c.re||[]).length?`<div class="pc-res">${c.re.map(r=>`<div class="pc-re">${avatar(whoOf(T,r.byId),'xs')}<div><b>${esc(nameOf(T,r.byId,r.by))}</b><time>${esc(agoLabel(r.at))}</time><p>${mentionHtml(r.text)}</p></div>${ownIt(r,my)?`<button type="button" class="th-x" data-adc-delre="${r.id}" aria-label="Remove reply">×</button>`:'<span></span>'}</div>`).join('')}</div>`:''}
    ${sel&&AD.reply?`<div class="th-box"><textarea class="cbox pbox" id="adReply" rows="1" maxlength="1000" placeholder="Reply, @ to mention someone"></textarea><button type="button" class="th-send" data-adc-send="${c.id}" aria-label="Send">${I.send}</button></div>`:''}
    <div class="pc-acts"><button type="button" data-adc-reply="${c.id}">Reply</button><button type="button" data-adc-res="${c.id}">${res?'Reopen':'Resolve'}</button>${ownIt(c,my)?`<button type="button" class="danger" data-adc-del="${c.id}">Delete</button>`:''}</div></div>`;
}

/* ---------- after drawing: thumbnails as they scroll into view, or the open ad fitted to the space with its pins ---------- */
function adAfter(p){
  if(adMode(p)==='view'){adViewAfter(p,adById(p,AD.open));return}
  if(AD.io) AD.io.disconnect();
  AD.io=new IntersectionObserver(es=>{for(const e of es) if(e.isIntersecting){AD.io.unobserve(e.target);const a=adById(p,e.target.dataset.adt);if(a) adUrl(a,'t').then(u=>{if(u) e.target.src=u})}},{rootMargin:'600px 0px'});
  for(const img of $$('#vProj img[data-adt]')){const u=AD.urls[img.dataset.adt+':t'];if(u) img.src=u;else AD.io.observe(img)}
  if(AD.scroll){const b=$('#pjDrop');if(b) b.scrollTop=AD.scroll;AD.scroll=0}
}
async function adViewAfter(p,a){
  const img=$('#adImg');if(!img) return;
  const t=$('#adText');if(t){t.focus();t.setSelectionRange(t.value.length,t.value.length)}
  const r=$('#adReply');if(r){r.focus();if(AD.replyText) r.value=AD.replyText}
  const u=await adUrl(a,'r');
  if($('#adImg')!==img||AD.open!==a.id) return;
  if(!u){const l=$('#adLoad');if(l) l.textContent='This ad could not be loaded. Check your connection and open it again.';return}
  img.onload=()=>{const l=$('#adLoad');if(l) l.remove();adFit();adPins()};img.src=u;
  // the ads on either side load in the background, so stepping through them is instant
  const L=adList(p),i=L.indexOf(a);for(const x of [L[i+1],L[i-1]]) if(x) adUrl(x,'r');
}
function adFit(){
  const st=$('#adStage'),img=$('#adImg');if(!st||!img||!img.naturalWidth) return;
  const s=Math.min(1,(st.clientWidth-48)/img.naturalWidth,(st.clientHeight-48)/img.naturalHeight);
  img.style.width=Math.max(40,Math.round(img.naturalWidth*s))+'px';img.style.height=Math.max(40,Math.round(img.naturalHeight*s))+'px';
}
function adPins(){
  const p=projById(PV.proj),a=p&&adById(p,AD.open),box=$('#adPins');if(!a||!box) return;
  box.innerHTML=adCm(a).filter(c=>c.x!=null&&(adShowCm(c)||c.id===AD.sel)).map(c=>`<button type="button" class="pin${c.id===AD.sel?' sel':''}${c.status==='resolved'?' res':''}" style="left:${(c.x*100).toFixed(2)}%;top:${(c.y*100).toFixed(2)}%" data-adpin="${c.id}" aria-label="Comment ${c.n}">${c.status==='resolved'?I.check:c.n}</button>`).join('')
    +(AD.draft&&AD.draft.x!=null?`<span class="pin new" style="left:${(AD.draft.x*100).toFixed(2)}%;top:${(AD.draft.y*100).toFixed(2)}%">+</span>`:'');
}
function adSideRefresh(){
  const p=projById(PV.proj),a=p&&adById(p,AD.open),side=$('#adSide');if(!a||!side) return;
  const keep=$('#adList'),top=keep?keep.scrollTop:0;side.innerHTML=adSideHtml(p,a);const L=$('#adList');if(L) L.scrollTop=top;
  const t=$('#adText');if(t){t.focus();t.setSelectionRange(t.value.length,t.value.length)}
  const r=$('#adReply');if(r){r.focus();if(AD.replyText) r.value=AD.replyText}
}
addEventListener('resize',()=>{if(UI.view==='projects'&&PV.tab==='ads'&&AD.open) adFit()});

/* ---------- deciding, moving through, commenting ---------- */
function adOpen(id){const b=$('#pjDrop');AD.scroll=b?b.scrollTop:0;AD.open=id;AD.sel=null;AD.draft=null;AD.reply=false;AD.menu=null;render()}
function adStep(p,d){
  const a=adById(p,AD.open);if(!a) return;const vis=adList(p),L=vis.includes(a)?vis:adOrder(p),nx=L[L.indexOf(a)+d];
  if(nx){AD.open=nx.id;AD.sel=null;AD.draft=null;AD.reply=false;AD.menu=null;render()}
}
// a decision made in the viewer moves on to the next ad, so a batch gets judged one key press at a time
function adSet(p,a,st,advance){
  const vis=adList(p),L=vis.includes(a)?vis:adOrder(p),nx=L[L.indexOf(a)+1];
  a.status=a.status===st?'open':st;a.dby=a.status==='open'?null:me().id;a.dat=a.status==='open'?null:Date.now();touch(p);save();
  if(advance&&a.status!=='open'&&nx&&!AD.draft){AD.open=nx.id;AD.sel=null;AD.reply=false;AD.menu=null}
  render();toast(a.status==='open'?`${adLabel(a)} has no decision now`:`${adLabel(a)} ${a.status}`);
}
function adPost(p,a){
  const ta=$('#adText');if(!a||!AD.draft||!ta) return;const text=ta.value.trim();if(!text){ta.focus();return}
  const c={id:uid(),n:adCm(a).reduce((m,x)=>Math.max(m,x.n||0),0)+1,x:AD.draft.x,y:AD.draft.y,text,by:'You',byId:me().id,at:Date.now(),status:'open',re:[]};
  adCm(a).push(c);AD.draft=null;AD.sel=c.id;if(AD.cf==='resolved') AD.cf='open';touch(p);save();adSideRefresh();adPins();
}
function adReplyPost(p,a,cid){
  const ta=$('#adReply'),c=a&&adCm(a).find(x=>x.id===cid);if(!c||!ta) return;const text=ta.value.trim();if(!text){ta.focus();return}
  (c.re=c.re||[]).push({id:uid(),by:'You',byId:me().id,text,at:Date.now()});AD.reply=false;AD.replyText='';touch(p);save();adSideRefresh();
}

/* ---------- getting files out, and letting them go ---------- */
async function adFileOut(a){
  let b=a.gone?null:await fileBlob(a.id+':o',a.orig),name=adSafe(a.name)||`ad-${a.n}.png`;
  if(!b){b=await fileBlob(a.id+':r',a.review);if(b) name=name.replace(/\.[^.]+$/,'')+(b.type==='image/jpeg'?'.jpg':'.webp')}
  return b?{blob:b,name}:null;
}
async function adDownload(p,a){const f=await adFileOut(a);if(!f){toast('That file is not on this device and could not be fetched');return}dlBlob(f.blob,f.name);toast(`Downloading ${adLabel(a).toLowerCase()}`)}
async function adZip(p){
  const L=adsOf(p).filter(a=>a.status==='approved').sort((a,b)=>a.n-b.n);if(!L.length) return;
  toast(`Packing ${plural(L.length,'approved ad')}…`);const entries=[];
  for(const a of L){const f=await adFileOut(a);if(f) entries.push({path:`ad-${String(a.n).padStart(3,'0')}-${f.name}`,blob:f.blob})}
  if(!entries.length){toast('Those files are not on this device and could not be fetched');return}
  dlBlob(await makeZip(entries),`${slug(p.name)}-approved-ads.zip`);
  toast(entries.length<L.length?`Downloading ${entries.length} of ${plural(L.length,'approved ad')}: the others could not be fetched`:`Downloading ${plural(entries.length,'approved ad')}`);
}
async function adDelete(p,list,title,text){
  if(!await confirmDlg(title,text,list.length>1?'Delete ads':'Delete ad')) return;
  const keys=[],paths=[];for(const a of list){adDropUrls(a);keys.push(a.id+':o',a.id+':r',a.id+':t');for(const x of [a.orig,a.review,a.thumb]) if(x) paths.push(x)}
  for(const a of list) delete AD.pend[a.id];
  p.ads=adsOf(p).filter(a=>!list.includes(a));if(list.some(a=>a.id===AD.open)){AD.open=null;AD.sel=null;AD.draft=null}
  touch(p);save();render();fdbDel(keys);removeFiles(paths);toast(list.length>1?`${plural(list.length,'ad')} deleted`:`${adLabel(list[0])} deleted`);
}
// the full-size files of rejected ads go; what the team saw and said about them stays
async function adFree(p){
  const L=adsOf(p).filter(a=>a.status==='rejected'&&!a.gone);if(!L.length) return;const freed=L.reduce((n,a)=>n+(a.size||0),0);
  if(!await confirmDlg(`Remove the full-size files of ${plural(L.length,'rejected ad')}?`,`That frees ${fmtSize(freed)}. Their review copies, decisions and comments stay, so the team can still see and discuss them; if one is approved later, its download is the review copy. This cannot be undone.`,'Remove full-size files')) return;
  const paths=L.map(a=>a.orig).filter(Boolean);
  for(const a of L){a.orig=null;a.gone=true;const u=AD.urls[a.id+':o'];if(u){URL.revokeObjectURL(u);delete AD.urls[a.id+':o']}}
  touch(p);save();render();fdbDel(L.map(a=>a.id+':o'));removeFiles(paths);toast(`Freed ${fmtSize(freed)}`);
}
// pressing Escape: the menu, then the comment being written, the reply, the picked comment, then back to the grid
function adEscape(){
  if(AD.menu){AD.menu=null;render();return true}
  if(AD.draft){AD.draft=null;adSideRefresh();adPins();return true}
  if(AD.reply){AD.reply=false;adSideRefresh();return true}
  if(AD.sel){AD.sel=null;adSideRefresh();adPins();return true}
  if(AD.open){AD.open=null;render();return true}
  return false;
}

/* ---------- clicks, keys and typing on the Ads tab ---------- */
$('#vProj').addEventListener('click',async e=>{
  if(!PV.proj||PV.tab!=='ads'||SHARE) return;
  const c=s=>e.target.closest(s),p=projById(PV.proj);if(!p) return;const a=AD.open?adById(p,AD.open):null;let b;
  if(c('[data-ad-up]')){$('#adFiles').click();return}
  if(b=c('[data-adup-retry]')){adUpRetry(b.dataset.adupRetry);return}
  if(b=c('[data-adup-x]')){adUpDrop(b.dataset.adupX);return}
  if(b=c('[data-ad-filter]')){AD.filter=b.dataset.adFilter;render();return}
  if(b=c('[data-ad-quick]')){const x=adById(p,b.dataset.id);if(x) adSet(p,x,b.dataset.adQuick,false);return}
  if(b=c('[data-ad-delbatch]')){const n=+b.dataset.adDelbatch,L=adsOf(p).filter(x=>(x.batch||1)===n),ap=L.filter(x=>x.status==='approved').length;
    adDelete(p,L,`Delete batch ${n}?`,`Its ${plural(L.length,'ad')} go, with their files and comments${ap?`, ${ap} approved ${ap===1?'one':'ones'} included`:''}. This cannot be undone.`);return}
  if(c('#adListMore')){AD.menu=AD.menu==='list'?null:'list';render();return}
  if(c('#adMore')){AD.menu=AD.menu==='ad'?null:'ad';render();return}
  if(b=c('[data-ad-do]')){if(b.disabled) return;const k=b.dataset.adDo;AD.menu=null;render();
    if(k==='free') adFree(p);else if(k==='dl'&&a) adDownload(p,a);else if(k==='del'&&a) adDelete(p,[a],`Delete ${adLabel(a).toLowerCase()}?`,`Its files${adCm(a).length?` and ${plural(adCm(a).length,'comment')}`:''} go too. This cannot be undone.`);return}
  if(c('[data-ad-zip]')){adZip(p);return}
  if(b=c('[data-ad-open]')){adOpen(b.dataset.adOpen);return}
  if(c('#adBack')){AD.open=null;AD.sel=null;AD.draft=null;AD.reply=false;AD.menu=null;render();return}
  if(b=c('[data-ad-step]')){if(!b.disabled) adStep(p,+b.dataset.adStep);return}
  if(b=c('[data-ad-set]')){if(a) adSet(p,a,b.dataset.adSet,true);return}
  if(b=c('[data-ad-cf]')){AD.cf=b.dataset.adCf;adSideRefresh();adPins();return}
  if(c('[data-ad-whole]')){AD.draft={x:null,y:null,text:''};AD.sel=null;AD.reply=false;adSideRefresh();adPins();return}
  if(c('[data-ad-cancel]')){AD.draft=null;adSideRefresh();adPins();return}
  if(c('[data-ad-post]')){adPost(p,a);return}
  if(b=c('[data-adpin]')){AD.sel=AD.sel===b.dataset.adpin?null:b.dataset.adpin;AD.reply=false;AD.draft=null;adSideRefresh();adPins();const el=AD.sel&&$(`#adSide .pc[data-adc="${AD.sel}"]`);if(el) el.scrollIntoView({block:'nearest',behavior:'smooth'});return}
  if(b=c('[data-adc-reply]')){AD.sel=b.dataset.adcReply;AD.reply=true;AD.replyText='';AD.draft=null;adSideRefresh();adPins();return}
  if(b=c('[data-adc-send]')){adReplyPost(p,a,b.dataset.adcSend);return}
  if(b=c('[data-adc-res]')){const x=a&&adCm(a).find(q=>q.id===b.dataset.adcRes);if(x){x.status=x.status==='resolved'?'open':'resolved';touch(p);save();adSideRefresh();adPins()}return}
  if(b=c('[data-adc-del]')){const x=a&&adCm(a).find(q=>q.id===b.dataset.adcDel);if(!x) return;
    if((x.re||[]).length&&!await confirmDlg('Delete this comment?',`Its ${plural(x.re.length,'reply')} go too.`,'Delete')) return;
    a.cm=adCm(a).filter(q=>q!==x);if(AD.sel===x.id) AD.sel=null;touch(p);save();adSideRefresh();adPins();return}
  if(b=c('[data-adc-delre]')){if(!a) return;for(const x of adCm(a)) x.re=(x.re||[]).filter(r=>r.id!==b.dataset.adcDelre);touch(p);save();adSideRefresh();return}
  if(b=c('[data-adc]')){if(c('button,textarea')) return;AD.sel=AD.sel===b.dataset.adc?null:b.dataset.adc;AD.reply=false;adSideRefresh();adPins();return}
  if(e.target.id==='adImg'&&a){const r=e.target.getBoundingClientRect();if(!r.width) return;
    AD.draft={x:clamp((e.clientX-r.left)/r.width,0,1),y:clamp((e.clientY-r.top)/r.height,0,1),text:(AD.draft&&AD.draft.text)||''};AD.sel=null;AD.reply=false;adSideRefresh();adPins();return}
});
$('#vProj').addEventListener('keydown',e=>{
  if(!PV.proj||PV.tab!=='ads'||SHARE) return;const p=projById(PV.proj);if(!p) return;
  if(e.key==='Enter'&&!e.shiftKey&&(e.target.id==='adText'||e.target.id==='adReply')){e.preventDefault();e.stopPropagation();const a=adById(p,AD.open);if(e.target.id==='adText') adPost(p,a);else{const b=$('#adSide [data-adc-send]');if(b) adReplyPost(p,a,b.dataset.adcSend)}return}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.ad-card[data-ad-open]')){e.preventDefault();adOpen(e.target.dataset.adOpen)}
},true);
$('#vProj').addEventListener('input',e=>{if(e.target.id==='adText'&&AD.draft) AD.draft.text=e.target.value;if(e.target.id==='adReply') AD.replyText=e.target.value});
document.addEventListener('keydown',e=>{
  if((e.key!=='ArrowLeft'&&e.key!=='ArrowRight')||UI.view!=='projects'||PV.tab!=='ads'||!AD.open||document.querySelector('dialog[open]')) return;
  if(e.target.matches&&e.target.matches('textarea,input,select,[contenteditable]')) return;
  const p=projById(PV.proj);if(p){e.preventDefault();adStep(p,e.key==='ArrowLeft'?-1:1)}
});
document.addEventListener('pointerdown',e=>{if(!AD.menu||(e.target.closest&&e.target.closest('#vProj .fd-more'))) return;AD.menu=null;for(const id of ['#adListMore','#adMore']){const b=$(id);if(b){b.setAttribute('aria-expanded','false');const m=b.parentElement.querySelector('.fd-menu');if(m) m.remove()}}});
