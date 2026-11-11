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
};
const AD={page:null,open:null,filter:'all',cf:'open',sel:null,draft:null,reply:false,replyText:'',menu:null,busy:null,urls:{},io:null,scroll:0};
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
const adBusyText=()=>AD.busy?`Adding ads… ${AD.busy.done} of ${AD.busy.total}`:'';
function adBusyShow(){const el=$('#adBusy');if(el) el.textContent=adBusyText()}

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

/* ---------- taking a batch in: every image becomes the next ad, with its two light copies made right here ---------- */
async function adUpload(p,files){
  const T=team();
  if(T.cloud&&cloudOn()&&!CLOUD.adOn){toast('Ads need the latest database update, and it is not there yet. Reload the page; if this stays, the update has not run.');return}
  if(AD.busy){toast('Still adding the last batch');return}
  files=[...files].filter(f=>AD_TYPES.test(f.name)||/^image\/(png|jpeg|webp|avif)$/.test(f.type));
  if(!files.length){toast('Upload PNG, JPG or WebP images');return}
  const big=files.filter(f=>f.size>AD_MAX);files=files.filter(f=>f.size<=AD_MAX).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
  if(!files.length){toast(`Over 50 MB: ${big.map(f=>f.name).join(', ')}`);return}
  const batch=adsOf(p).reduce((m,a)=>Math.max(m,a.batch||0),0)+1,cloud=cloudFiles(T),bad=[];
  let n=adsOf(p).reduce((m,a)=>Math.max(m,a.n),0),made=0;
  AD.busy={done:0,total:files.length};if(AD.filter==='approved'||AD.filter==='rejected') AD.filter='all';render();
  for(const f of files){
    try{
      const bmp=await createImageBitmap(f),w=bmp.width,h=bmp.height,rv=await adCopy(bmp,AD_REVIEW,.86),th=await adCopy(bmp,AD_THUMB,.8);if(bmp.close) bmp.close();
      const a={id:uid(),n:n+1,batch,name:f.name.slice(0,200),w,h,size:f.size,orig:null,review:null,thumb:null,status:'open',by:me().id,at:Date.now(),cm:[]};
      await fdbPut(a.id+':t',th);await fdbPut(a.id+':r',rv);
      if(cloud){const dir='ads/'+a.id;
        a.thumb=await putFile(T,p.id,dir,'thumb'+adExt(th),th,th.type);a.review=await putFile(T,p.id,dir,'review'+adExt(rv),rv,rv.type);
        a.orig=await putFile(T,p.id,dir,'original'+(adExt(f)||'.'+(f.name.split('.').pop()||'png').toLowerCase()),f,f.type||typeOfName(f.name));
        if(!a.thumb||!a.review||!a.orig){bad.push(f.name);removeFiles([a.thumb,a.review,a.orig].filter(Boolean));fdbDel([a.id+':t',a.id+':r']);continue}}
      else await fdbPut(a.id+':o',f); // a team on this device only: the original lives here
      n++;made++;adsOf(p).push(a);
      if(made%5===0){touch(p);save()}
      if(PV.proj===p.id&&PV.tab==='ads'&&!AD.open) render();
    }catch(e){console.warn('ad',e);bad.push(f.name)}
    finally{AD.busy.done++;adBusyShow()}
  }
  AD.busy=null;if(made){touch(p);save()}render();
  toast(made?`${plural(made,'ad')} added as batch ${batch}${bad.length?`, ${bad.length} could not be`:''}`:'None of those images could be added');
  if(bad.length) setTimeout(()=>toast(`Not added: ${bad.slice(0,3).join(', ')}${bad.length>3?` and ${bad.length-3} more`:''}. Upload them again.`),3300);
  if(big.length) setTimeout(()=>toast(`Skipped ${big.map(f=>f.name).join(', ')}: over 50 MB`),bad.length?6600:3300);
}
function adDrop(dt){const p=PV.proj&&projById(PV.proj);if(p) adUpload(p,[...dt.files])}
$('#adFiles').addEventListener('change',e=>{const p=PV.proj&&projById(PV.proj),l=[...e.target.files];e.target.value='';if(p) adUpload(p,l)});

/* ---------- the tab: every batch as a grid, or one ad open with its comments ---------- */
function adsViewHtml(p){
  adReset(p);const L=adsOf(p),next=L.reduce((m,a)=>Math.max(m,a.batch||0),0)+1;
  const over=`<div class="pj-over">${PI.up}<b>Drop the images to add them as batch ${next}</b></div>`;
  if(!L.length) return `<div class="pj-dz big"><span class="ic">${ADI.img}</span><b>No ads for ${esc(p.name)} yet</b><small>Upload a batch of ad images, or drop them here. Noon makes a light copy of each for the team to look at, so even a few hundred ads open fast, and keeps the full-size file for downloading the ones you approve.</small>
    <ul class="pj-need"><li><b>PNG, JPG or WebP</b>, up to 50 MB each.</li><li><b>A batch at a time</b>, 5, 10 or 20 images: each upload is its own batch.</li><li><b>Approve or reject</b> each ad, and comment on any spot of it.</li></ul>
    <span class="pj-dz-acts"><button type="button" class="btn dark" data-ad-up>${PI.up}Upload ads</button></span>${AD.busy?`<small class="ad-busy" id="adBusy">${adBusyText()}</small>`:''}</div>${over}`;
  return (adMode(p)==='view'?adViewHtml(p,adById(p,AD.open)):adListHtml(p))+over;
}
function adListHtml(p){
  const T=team(),k=adCounts(p),free=adsOf(p).filter(a=>a.status==='rejected'&&!a.gone),freed=free.reduce((n,a)=>n+(a.size||0),0);
  const seg=[['all','All'],['open','To decide'],['approved','Approved'],['rejected','Rejected']].map(([f,l])=>`<button type="button" class="${AD.filter===f?'on':''}" data-ad-filter="${f}">${l}<i>${k[f]||''}</i></button>`).join('');
  const batches=[...new Set(adsOf(p).map(a=>a.batch||1))].sort((a,b)=>b-a);
  const secs=batches.map(b=>{const all=adOrder(p).filter(a=>(a.batch||1)===b),vis=all.filter(adIn);if(!vis.length) return '';
    const ap=all.filter(a=>a.status==='approved').length,rj=all.filter(a=>a.status==='rejected').length,f0=all[0];
    return `<section class="ad-batch"><div class="ad-bh"><b>Batch ${b}</b><small>${plural(all.length,'ad')} · ${esc(agoLabel(f0.at||Date.now()))} by ${esc(whoName(T,f0.by))}${ap?` · ${ap} approved`:''}${rj?` · ${rj} rejected`:''}</small><span class="sp"></span><button type="button" class="fd-act" data-ad-delbatch="${b}" title="Delete batch ${b}" aria-label="Delete batch ${b}">${I.trash}</button></div>
      <div class="ad-grid">${vis.map(adCardHtml).join('')}</div></section>`}).join('');
  const menu=AD.menu==='list'?`<div class="dd fd-menu" role="menu"><button type="button" class="opt" role="menuitem" data-ad-do="free" ${free.length?'':'disabled'}>${I.trash}<span class="n">Remove full-size files of rejected ads<small>${free.length?`${plural(free.length,'ad')}, frees ${fmtSize(freed)}. Review copies, decisions and comments stay.`:'No rejected ad has one left'}</small></span></button></div>`:'';
  return `<div class="ad-bar"><div class="seg sm" id="adFilter" aria-label="Which ads">${seg}</div><span class="sp"></span><span class="ad-busy" id="adBusy">${adBusyText()}</span>
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
