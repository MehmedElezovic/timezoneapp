/* Noon redesign mockup · review link, as a client sees it: #review/<page>/<design|copy>/v<n>.
   No sidebar, only review-link comments, a name instead of an account. */
const GUEST={name:localStorage.getItem('noonr.guest')||''};
ROUTES.review=(R,soft)=>{const p=page(R.id),m=$('#main');if(!p){renderStub('review');return}
  const isCopy=R.tab==='copy';S.layer='client';CP.layer='client';CP.mode='read';CP.chg=false;if(S.mode==='compare')S.mode='comment';
  const vs=isCopy?cvers(p):designVers(p),v=vs.find(x=>x.n===R.ver)||vs.at(-1);
  if(!v){m.innerHTML=`<div class="empty" style="flex:1"><p>This review link is no longer active.</p></div>`;return}
  if(soft&&m.dataset.view==='review'&&m.dataset.key===location.hash){renderRail(p,R);if(isCopy)drawDocs(p,R,'client');else placeAllPins();return}
  m.dataset.view='review';m.dataset.key=location.hash;const c=client(p.client);
  m.innerHTML=`<div class="top gtop"><span class="logo">${sun}</span><span class="gbrand">Noon</span><span class="sl">·</span>
    <span class="gcrumb">${tile(c.id)}${esc(c.name)}<span class="sl">/</span><b>${esc(p.name)}</b></span><span class="tag">${isCopy?'Copy':'Design'} <span class="v" style="color:inherit">v${v.n}</span></span>
    <span class="sp"></span>
    ${!isCopy?`<div class="seg" role="group" aria-label="Width">${Object.entries(DEV).map(([k,w])=>`<button class="${S.dev===k?'on':''}" data-act="gDev" data-d="${k}" aria-pressed="${S.dev===k}" title="${w}px">${ic(k,15)}</button>`).join('')}</div>
    <div class="seg" role="group" aria-label="Mode">${[['comment','Comment','comment'],['browse','Browse','pointer']].map(([k,l,i])=>`<button class="${S.mode===k?'on':''}" data-act="gMode" data-m="${k}" aria-pressed="${S.mode===k}">${ic(i,15)}${l}</button>`).join('')}</div>`:''}
    <span class="gwho">${GUEST.name?`Commenting as <button class="gname" data-act="gName">${esc(GUEST.name)}</button>`:''}</span>
    <a class="btn btn-ghost btn-sm" href="#page/${p.id}/${R.tab}/v${v.n}" title="Mockup only: back to the team's view">${ic('back',14)}Leave preview</a></div>
   <div class="pb"><div class="pb-main" id="pbMain">${isCopy?`<div class="cstage" id="cpStage"><article class="paper doc" id="doc"></article></div>`:`<div class="stage" id="stage">${frameCol(v,'b',false)}</div>`}</div><aside class="rail" id="rail" aria-label="Comments"></aside></div>`;
  if(isCopy)mountReader(p,R);else mountFrames(p,R);
  renderRail(p,R);
  if(!GUEST.name)setTimeout(askName,60);
};
function askName(then){openDlg(`<div class="dlg-h"><b>Before you comment</b></div>
  <div class="dlg-b"><p class="hint" style="margin:0">Add your name so the team knows who left each comment. No account needed.</p><label class="fld"><span>Your name</span><input id="gN" value="${esc(GUEST.name)}" placeholder="e.g. Lena Patel"></label></div>
  <div class="dlg-f"><button class="btn btn-ink" id="gOk">Continue</button></div>`,o=>{const i=o.querySelector('#gN');i.focus();
   const ok=()=>{const n=i.value.trim();if(!n){i.focus();return}GUEST.name=n;localStorage.setItem('noonr.guest',n);closeDlg();render(true);then&&then()};
   o.querySelector('#gOk').onclick=ok;i.onkeydown=e=>{if(e.key==='Enter')ok()}})}
function guestList(p,R){return R.tab==='copy'?ccFor(p,R.ver||cvers(p).at(-1).n):cmFor(p.id,R.ver||designVers(p).at(-1).n)}
function guestRail(p,R,el){const isCopy=R.tab==='copy',L=guestList(p,R).filter(c=>c.layer==='client'),open=L.filter(c=>c.open);
  const active=isCopy?CP.active:S.active,pend=isCopy?CP.pend:S.pending;
  el.innerHTML=`<div class="rail-top"><b style="font-weight:500">Comments</b><span class="num">${open.length}</span></div>
  <div class="rail-scroll"><div class="note">The ${esc(client(p.client).name)} team sees every comment here and replies on this page.</div>
   ${open.length?`<div class="cmts">${open.map(c=>{const who=c.by==='guest'?c.guest:P[c.by].short;return `<div class="cm ${active===c.n?'on':''}" data-act="${isCopy?'cpCm':'cm'}" data-n="${c.n}" tabindex="0">
     <div class="cm-top"><span class="pn ${isCopy||c.sel?'':'gen'}">C${c.n}</span>${c.by==='guest'?`<span class="av guest">${who.split(' ').map(w=>w[0]).slice(-2).join('')}</span>`:av(c.by)}<b>${esc(who)}</b>${c.by!=='guest'?'<span class="tag">Team</span>':''}<span class="t">${c.at}</span></div>
     ${isCopy&&c.quote?`<blockquote class="q">${esc(c.quote)}</blockquote>`:''}<p>${esc(c.text)}</p>
     ${c.rep.map(r=>`<div class="rep">${r.by==='guest'?'<span class="av guest">G</span>':av(r.by)}<div><div class="who">${r.by==='guest'?esc(r.guest||'Guest'):P[r.by].short} · ${r.at}</div>${esc(r.text)}</div></div>`).join('')}</div>`}).join('')}</div>`
   :`<div class="empty" style="padding:40px 8px"><h3 class="disp" style="font-size:22px;line-height:28px">Your <span class="mk">feedback</span></h3><p>${isCopy?'Select text to comment on it.':'Click anywhere on the page to pin a comment.'}</p></div>`}</div>
  <div class="compose">${pend?`<div class="pend"><span class="pn">+</span>${isCopy?'On the selected text':'Pin placed on the page'}<span class="sp"></span><button class="ib sm" data-act="gUnpin" aria-label="Remove">${ic('x',14)}</button></div>${isCopy&&pend.quote?`<blockquote class="q">${esc(pend.quote)}</blockquote>`:''}`:`<div class="pend">${isCopy?'Select text to comment on it, or write a general note.':'Click the page to pin a comment, or write a general note.'}</div>`}
   <textarea id="gText" placeholder="Write a comment…" aria-label="Comment"></textarea><div class="row"><span class="sp"></span><button class="btn btn-ink btn-sm" data-act="gPost">Post</button></div></div>`}
Object.assign(ACT,{
  gName:()=>askName(),
  gDev:a=>{S.dev=a.dataset.d;$$('[data-act=gDev]').forEach(b=>{b.classList.toggle('on',b===a);b.setAttribute('aria-pressed',b===a)});layoutFrames()},
  gMode:a=>{S.mode=a.dataset.m;S.pending=null;$$('[data-act=gMode]').forEach(b=>{b.classList.toggle('on',b===a);b.setAttribute('aria-pressed',b===a)});placeAllPins();const R=route();renderRail(page(R.id),R)},
  gUnpin:()=>{const R=route();if(R.tab==='copy'){CP.pend=null;refreshCopy()}else{S.pending=null;placeAllPins();renderRail(page(R.id),R)}},
  gPost:()=>{const R=route(),p=page(R.id),t=($('#gText')?.value||'').trim();if(!t){$('#gText')?.focus();return}
    if(!GUEST.name){askName(()=>ACT.gPost());return}
    const isCopy=R.tab==='copy',list=guestList(p,R),n=Math.max(0,...list.filter(c=>c.layer==='client').map(c=>c.n))+1;
    const c=isCopy?{n,layer:'client',kind:'comment',by:'guest',guest:GUEST.name,at:'Just now',quote:CP.pend?.quote||'',open:true,text:t,rep:[]}
      :{n,layer:'client',by:'guest',guest:GUEST.name,at:'Just now',open:true,text:t,rep:[],...(S.pending||{sel:null,x:0,y:0})};
    list.push(c);if(isCopy){CP.pend=null;CP.active=n;syncCopy(p);refreshCopy()}else{S.pending=null;S.active=n;syncCounts(p);renderRail(p,R);placeAllPins()}
    toast('Thanks, the team will see this')},
});
ONHASH.push(R=>{if(R.name!=='review'&&(S.layer==='client'||CP.layer==='client')&&GUEST.was){S.layer='team';CP.layer='team'}GUEST.was=R.name==='review'});
GUEST.was=route().name==='review';
