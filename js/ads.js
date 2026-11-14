/* Noon redesign mockup · Ads tab: batches of static ads, Approve / Reject always visible, a viewer with pinned comments. */
const AD={filter:'all',active:null,pend:null,draft:'',showRes:false};
const adsOf=p=>ADS[p.id]||[];
function syncAds(p){const L=ADS[p.id];if(!L)return;p.ads={n:L.length,ok:L.filter(a=>a.status==='approved').length,open:L.reduce((s,a)=>s+a.cm.filter(c=>c.open).length,0)}}
Object.keys(ADS).forEach(id=>{const p=page(id);if(p)syncAds(p)});

/* the creative itself: client artwork, so it uses the client's colours, not Noon's */
const AD_THEMES=[['#f6e7e1','#3b1f2b','#c85a7c'],['#1f2a44','#f4efe6','#e8b86d'],['#e7efe4','#22382a','#6f9a74'],['#f3e3ef','#3e2141','#a6589a'],['#fff3dd','#3d2a12','#d98b2b'],['#dde8f2','#16324a','#4f86b5']];
function adArt(a,pid,big){const[bg,fg,ac]=AD_THEMES[a.theme],wand=pid==='p01';
  return `<div class="ad-art ${big?'big':''}" style="background:${bg};color:${fg}">
    <span class="ad-brand">REVOMADIC</span>
    <span class="ad-head" style="font-family:Georgia,'Times New Roman',serif">${esc(a.head)}</span>
    ${wand?`<span class="ad-wand"><i style="background:${fg}"></i><b style="background:${ac}"></b></span>`:`<span class="ad-jar"><i style="background:${ac}"></i><b style="background:${fg}"></b></span>`}
    <span class="ad-cta" style="background:${fg};color:${bg}">Shop now</span></div>`}

function adsMain(p,R,el){
  if(R.sub){const a=adsOf(p).find(x=>x.n===+R.sub);if(a){el.innerHTML=adViewerHtml(p,a);mountAdViewer(p,a);return}}
  if(!ADS[p.id]){el.innerHTML=emptyHtml('No <span class="ul">ads'+ulSvg+'</span> on this page yet','Upload a batch of static ads to approve, reject and comment on them here.','Upload a batch');return}
  const L=adsOf(p),cnt=k=>k==='all'?L.length:L.filter(a=>a.status===k).length;
  const show=L.filter(a=>AD.filter==='all'||a.status===AD.filter);
  const batches=[...new Set(L.map(a=>a.batch))].sort((a,b)=>b-a);
  el.innerHTML=`<div class="sect">
   <div class="sect-h"><h2>Ads</h2><span class="num">${L.length}</span><span class="sp"></span>
    <div class="seg" role="group" aria-label="Show">${[['all','All'],['open','Open'],['approved','Approved'],['rejected','Rejected']].map(([k,l])=>`<button class="${AD.filter===k?'on':''}" data-act="adFilter" data-f="${k}" aria-pressed="${AD.filter===k}">${l} <span class="num">${cnt(k)}</span></button>`).join('')}</div>
    <button class="btn btn-line btn-sm" data-act="adZip" ${cnt('approved')?'':'disabled'}>${ic('download',14)}Download approved</button>
    <button class="ib sm" data-act="adMore" aria-label="More" aria-haspopup="menu">${ic('more',16)}</button></div>
   ${batches.map(b=>{const items=show.filter(a=>a.batch===b);if(!items.length)return'';const all=L.filter(a=>a.batch===b);
     return `<div class="batch"><div class="batch-h"><b>Batch ${b}</b><span class="num">${all.length}</span><span class="dash">${b===2?'Yesterday':'Nov 9'} · ${P[all[0].by].short}</span><span class="sp"></span><span class="dash">${all.filter(a=>a.status==='approved').length} approved · ${all.filter(a=>a.status==='open').length} to decide</span></div>
     <div class="agrid">${items.map(a=>adCard(p,a)).join('')}</div></div>`}).join('')||`<div class="empty"><p>No ads in this filter.</p></div>`}
  </div>`;
}
function adCard(p,a){const open=a.cm.filter(c=>c.open).length;
  return `<div class="adc ${a.status}" data-act="adOpen" data-n="${a.n}" tabindex="0" role="link" aria-label="Open ad ${a.n}">
   <div class="adc-art">${adArt(a,p.id)}${a.gone?'<span class="gone">Full size removed</span>':''}</div>
   <div class="adc-b"><span class="v">Ad ${a.n}</span>${a.status==='approved'?`<span class="tag ink">${ic('check',12)}Approved</span>`:a.status==='rejected'?'<span class="tag">Rejected</span>':''}${open?`<span class="tag ${needsMe(p)?'hi':''}">${ic('comment',12)}${open}</span>`:''}<span class="sp"></span>
    <button class="dec ${a.status==='rejected'?'on':''}" data-act="adDecide" data-n="${a.n}" data-s="rejected" aria-pressed="${a.status==='rejected'}" title="Reject" aria-label="Reject ad ${a.n}">${ic('x',15)}</button>
    <button class="dec ok ${a.status==='approved'?'on':''}" data-act="adDecide" data-n="${a.n}" data-s="approved" aria-pressed="${a.status==='approved'}" title="Approve" aria-label="Approve ad ${a.n}">${ic('check',15)}</button></div></div>`}

/* ---------- viewer ---------- */
function adViewerHtml(p,a){return `<div class="vbar2" id="adBar">${adBarInner(p,a)}</div>
   <div class="stage adstage" id="adStage"><div class="adbig" id="adBig">${adArt(a,p.id,true)}<div class="adpins" id="adPins"></div></div></div>`}
function adBarInner(p,a){const L=adsOf(p),i=L.indexOf(a);
  return `<a class="ib" href="#page/${p.id}/ads" aria-label="All ads" title="All ads">${ic('back',18)}</a>
   <span class="verb" style="cursor:default">Ad <span class="v" style="color:var(--ink)">${a.n}</span><span class="dash">of ${L.length}</span></span>
   <button class="ib" data-act="adStep" data-d="-1" aria-label="Previous ad" ${i<=0?'disabled style="opacity:.35"':''}>${ic('back',16)}</button><button class="ib" data-act="adStep" data-d="1" aria-label="Next ad" ${i>=L.length-1?'disabled style="opacity:.35"':''}>${ic('open',16)}</button>
   <span class="pend kb-hint" style="font-size:12px;color:var(--slate);display:flex;gap:4px;align-items:center"><kbd>←</kbd><kbd>→</kbd> move <kbd>A</kbd> approve <kbd>R</kbd> reject</span>
   <span class="sp"></span>
   ${a.status==='approved'?`<span class="tag ink">${ic('check',12)}Approved</span>`:a.status==='rejected'?'<span class="tag">Rejected</span>':'<span class="tag">To decide</span>'}
   <button class="btn btn-line btn-sm" data-act="adDecide" data-n="${a.n}" data-s="rejected" data-adv="1">${ic('x',14)}Reject</button>
   <button class="btn btn-ink btn-sm" data-act="adDecide" data-n="${a.n}" data-s="approved" data-adv="1">${ic('check',14)}Approve</button>
   <button class="ib" data-act="adOne" data-n="${a.n}" aria-label="More" aria-haspopup="menu">${ic('more',18)}</button>`}
function mountAdViewer(p,a){adLayout();adPins(p,a);$('#adBig').addEventListener('click',e=>{if(e.target.closest('.adpin')){AD.active=+e.target.closest('.adpin').dataset.n;adPins(p,a);renderRail(p,route());return}
  const r=$('#adBig').getBoundingClientRect();AD.pend={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};AD.active=null;adPins(p,a);renderRail(p,route());$('#adText')?.focus()})}
function adLayout(){const st=$('#adStage'),b=$('#adBig');if(!st||!b)return;const s=Math.min(st.clientWidth-64,st.clientHeight-64,760);b.style.width=b.style.height=Math.max(240,s)+'px'}
function adPins(p,a){const box=$('#adPins');if(!box)return;
  box.innerHTML=a.cm.filter(c=>c.open||AD.showRes).map(c=>c.x==null?'':`<button class="adpin ${AD.active===c.n?'on':''} ${c.open?'':'res'}" data-n="${c.n}" style="left:${c.x*100}%;top:${c.y*100}%" aria-label="Comment ${c.n}">${c.n}</button>`).join('')+
   (AD.pend?`<span class="adpin new" style="left:${AD.pend.x*100}%;top:${AD.pend.y*100}%">+</span>`:'')}
function adsSoft(p,R){const a=adsOf(p).find(x=>x.n===+R.sub);if(!a)return renderPbMain(p,R);$('#adBar').innerHTML=adBarInner(p,a);adPins(p,a)}
function adsRail(p,R,el){const a=adsOf(p).find(x=>x.n===+R.sub);if(!a){el.innerHTML=`<div class="rail-scroll">${detailsRail(p)}</div>`;return}
  const open=a.cm.filter(c=>c.open),res=a.cm.filter(c=>!c.open);
  const card=c=>`<div class="cm ${AD.active===c.n?'on':''} ${c.open?'':'res'}" data-act="adCm" data-n="${c.n}" tabindex="0"><div class="cm-top"><span class="pn ${c.x==null?'gen':''}">${c.n}</span>${av(c.by)}<b>${P[c.by].short}</b><span class="t">${c.at}</span><span class="sp"></span>${c.open?'':`<span style="color:var(--green)">${ic('check',15)}</span>`}</div><p>${esc(c.text)}</p>
    <div class="cm-act"><span class="sp"></span>${c.open?`<button class="btn btn-line btn-sm" data-act="adResolve" data-n="${c.n}">${ic('check',14)}Resolve</button>`:`<button class="btn btn-ghost btn-sm" data-act="adReopen" data-n="${c.n}">Reopen</button>`}</div></div>`;
  el.innerHTML=`<div class="rail-top"><b style="font-weight:500">Comments on Ad ${a.n}</b><span class="num">${open.length}</span></div>
  <div class="rail-scroll">${open.length?`<div class="cmts">${open.map(card).join('')}</div>`:`<div class="empty" style="padding:36px 8px"><h3 class="disp" style="font-size:22px;line-height:28px">All <span class="mk">clear</span></h3><p>Click the ad to pin a comment on a spot.</p></div>`}
   ${res.length?`<button class="resb" data-act="adShowRes">${AD.showRes?'Hide':'Show'} resolved <span class="num">${res.length}</span></button>${AD.showRes?`<div class="cmts" style="margin-top:8px">${res.map(card).join('')}</div>`:''}`:''}</div>
  <div class="compose">${AD.pend?`<div class="pend"><span class="pn">+</span>Pin placed on the ad<span class="sp"></span><button class="ib sm" data-act="adUnpin" aria-label="Remove pin">${ic('x',14)}</button></div>`:'<div class="pend">Click the ad to pin a comment, or write about the whole ad.</div>'}
   <textarea id="adText" placeholder="Write a comment…" aria-label="Comment">${esc(AD.draft)}</textarea><div class="row"><span class="sp"></span><button class="btn btn-ink btn-sm" data-act="adPost">Post</button></div></div>`;
  const t=$('#adText',el);t.oninput=()=>AD.draft=t.value;t.onkeydown=e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();ACT.adPost()}}}

function adsUpload(p){const L=ADS[p.id]||(ADS[p.id]=[]);const b=(L.at(-1)?.batch||0)+1,start=L.length;
  const heads=['New angle: the 60-second routine','Gift-ready, under $60','Dermatologist-tested','Night jelly, morning glow','The routine she keeps'];
  heads.forEach((h,i)=>L.push({id:p.id+'-'+(start+i+1),n:start+i+1,batch:b,head:h,theme:(start+i)%6,status:'open',by:'me',cm:[]}));
  syncAds(p);p.at=0;p.by='me';AD.filter='all';if(route().sub)go(`#page/${p.id}/ads`);else render(true);
  toast(`Batch ${b} added: 5 ads`,()=>{L.splice(start);if(!L.length)delete ADS[p.id];syncAds(p);if(!ADS[p.id])p.ads=null})}
function adDecide(p,a,s){const before=a.status;a.status=a.status===s?'open':s;syncAds(p);return()=>{a.status=before;syncAds(p)}}
Object.assign(ACT,{
  adFilter:a=>{AD.filter=a.dataset.f;render(true)},
  adOpen:(a,e)=>{if(e.target.closest('.dec'))return;go(`#page/${route().id}/ads/${a.dataset.n}`)},
  adDecide:(a,e)=>{e.stopPropagation();const R=route(),p=page(R.id),ad=adsOf(p).find(x=>x.n===+a.dataset.n),s=a.dataset.s;const undo=adDecide(p,ad,s);
    toast(`Ad ${ad.n} ${ad.status==='open'?'back to undecided':ad.status}`,undo);
    if(a.dataset.adv&&ad.status!=='open'){const L=adsOf(p),nx=L.slice(L.indexOf(ad)+1).find(x=>x.status==='open')||L.find(x=>x.status==='open');if(nx){go(`#page/${p.id}/ads/${nx.n}`);return}}
    render(true)},
  adStep:a=>{const R=route(),p=page(R.id),L=adsOf(p),i=L.findIndex(x=>x.n===+R.sub),n=L[i+(+a.dataset.d)];if(n)go(`#page/${p.id}/ads/${n.n}`)},
  adZip:()=>{const p=page(route().id),n=adsOf(p).filter(a=>a.status==='approved').length;toast(`Zipping ${n} approved originals`)},
  adMore:a=>{const p=page(route().id);openMenu(a,()=>[{label:'Upload a batch',pre:ic('upload',15),pick:()=>adsUpload(p)},{label:'Remove full-size files of rejected ads',pre:ic('trash',15),pick:()=>{const L=adsOf(p).filter(x=>x.status==='rejected'&&!x.gone);L.forEach(x=>x.gone=true);toast(`Removed ${L.length} full-size files. Review copies, decisions and comments stay.`,()=>L.forEach(x=>x.gone=false))}}])},
  adOne:a=>{const p=page(route().id),ad=adsOf(p).find(x=>x.n===+a.dataset.n);openMenu(a,()=>[{label:'Download original',pre:ic('download',15),pick:()=>toast(`Downloading ad-${ad.n}.png`)},{label:'Copy link to this ad',pre:ic('link',15),pick:()=>toast('Link copied')}])},
  adCm:(a,e)=>{if(e.target.closest('button'))return;const R=route(),p=page(R.id),ad=adsOf(p).find(x=>x.n===+R.sub);AD.active=AD.active===+a.dataset.n?null:+a.dataset.n;adPins(p,ad);renderRail(p,R)},
  adResolve:(a,e)=>{e.stopPropagation();const R=route(),p=page(R.id),ad=adsOf(p).find(x=>x.n===+R.sub),c=ad.cm.find(x=>x.n===+a.dataset.n);c.open=false;syncAds(p);adPins(p,ad);renderRail(p,R);toast(`Resolved #${c.n}`,()=>{c.open=true;syncAds(p)})},
  adReopen:(a,e)=>{e.stopPropagation();const R=route(),p=page(R.id),ad=adsOf(p).find(x=>x.n===+R.sub),c=ad.cm.find(x=>x.n===+a.dataset.n);c.open=true;syncAds(p);adPins(p,ad);renderRail(p,R)},
  adShowRes:()=>{AD.showRes=!AD.showRes;const R=route(),p=page(R.id);adPins(p,adsOf(p).find(x=>x.n===+R.sub));renderRail(p,R)},
  adUnpin:()=>{AD.pend=null;const R=route(),p=page(R.id);adPins(p,adsOf(p).find(x=>x.n===+R.sub));renderRail(p,R)},
  adPost:()=>{const R=route(),p=page(R.id),ad=adsOf(p).find(x=>x.n===+R.sub),t=($('#adText')?.value||'').trim();if(!t){$('#adText')?.focus();return}
    const n=Math.max(0,...ad.cm.map(c=>c.n))+1,c={n,by:'me',at:'Just now',x:AD.pend?.x??null,y:AD.pend?.y??null,open:true,text:t,rep:[]};ad.cm.push(c);AD.pend=null;AD.draft='';AD.active=n;syncAds(p);adPins(p,ad);renderRail(p,R);
    toast(`Comment #${n} posted`,()=>{ad.cm.splice(ad.cm.indexOf(c),1);syncAds(p)})},
});
KEYS.push((e,typing)=>{const R=route();if(typing||MENU||PAL||$('#dlg')||R.name!=='page'||R.tab!=='ads'||!R.sub)return;const k=e.key.toLowerCase();
  if(k==='arrowright'||k==='arrowleft'){ACT.adStep({dataset:{d:k==='arrowright'?1:-1}});return true}
  if(k==='a'||k==='r'){const b=$(`#adBar [data-act=adDecide][data-s=${k==='a'?'approved':'rejected'}]`);b&&b.click();return true}
  if(k==='escape'&&(AD.pend||AD.active!=null)){AD.pend=null;AD.active=null;render(true);return true}});
ONHASH.push(R=>{AD.pend=null;AD.active=null});
RESIZE.push(adLayout);
