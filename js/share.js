/* Noon · client links. An owner turns a link on per version (Share, on the version). A client who opens it gets that
   one version and nothing else: the page, the comments left on the link, and their own comments and replies under the
   name they type. No account: their browser keeps a random key so they can remove what they wrote, and every read and
   write goes through the share_* functions in Supabase, which check the link each time. Nothing is saved locally. */
const GUEST_LS='noon.guest',GUEST_ID='guest-me';
function randKey(n){const a=new Uint8Array(n);crypto.getRandomValues(a);return btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function guestMe(){let g=null;try{g=JSON.parse(localStorage.getItem(GUEST_LS))}catch(e){}
  if(!g||typeof g.key!=='string'||g.key.length<16){g={key:randKey(24),name:(g&&g.name)||''};try{localStorage.setItem(GUEST_LS,JSON.stringify(g))}catch(e){}}return g}
function setGuestName(name){const g=guestMe();g.name=name;try{localStorage.setItem(GUEST_LS,JSON.stringify(g))}catch(e){}const m=team().members.find(x=>x.isMe);if(m) m.name=name}
const shareUrl=t=>`${location.origin}${location.pathname}?share=${t}`;

/* ---------- the owner's side: the Share dialog ---------- */
const SHD={p:null,v:null};
function openShare(p,v){if(!p||!v) return;SHD.p=p.id;SHD.v=v.id;renderShare();const d=$('#dShare');if(!d.open) d.showModal()}
function renderShare(){
  const T=team(),p=projById(SHD.p),v=p&&verById(p,SHD.v),box=$('#shareBody');if(!v||!box) return;
  const signed=typeof CLOUD!=='undefined'&&!!CLOUD.user,L=vLabel(v);$('#shareTitle').textContent=`Share ${L} of ${p.name}`;
  if(!signed){box.innerHTML=`<p class="hint">A client link lets anyone who has it see ${L} and comment on it, with no account. Your pages and comments have to be online for that, so sharing needs your account.</p><div class="dlg-acts"><button type="button" class="btn ghost" data-close>Not now</button><button type="button" class="btn dark" data-share-auth>Log in to share</button></div>`;return}
  if(!T.cloud){box.innerHTML=`<p class="hint">This team lives only on this device. Projects in the teams on your account can be shared: switch team under Settings › Team.</p><div class="dlg-acts"><button type="button" class="btn dark" data-close>OK</button></div>`;return}
  if(!CLOUD.vShare){box.innerHTML=`<p class="hint">Client links need the latest database update, and it is not there yet. Reload the page; if this stays, the update has not run.</p>`;return}
  const on=verShared(v),others=versOf(p).filter(x=>x!==v&&verShared(x));
  const warn=(!v.file?`<p class="note">${L} is only on this device, so a client cannot open it. Upload the file again as a new version.</p>`:'')+(others.length?`<p class="hint">${esc(others.map(vLabel).join(', '))} ${others.length===1?'has its':'have their'} own link, still on.</p>`:'');
  const what=`<ul class="sh-list"><li>They see ${L} only: no other versions, and only the comments left on the link. Your team's comments stay in Noon.</li><li>When you upload the next version, it gets its own link. This one keeps showing ${L}.</li><li>They comment and reply under a name they type. No account, no password. A teammate who opens the link comments there the same way.</li><li>In Noon those comments sit in their own Client link layer, next to Team in each version's comments. Post there and the client sees it too.</li><li>They see nothing else in Noon: no calendar, team or tasks.</li></ul>`;
  if(!on){box.innerHTML=`<p class="hint">Make a link to ${L} · ${esc(v.name)} for your client.</p>${what}${warn}<div class="dlg-acts"><button type="button" class="btn ghost" data-close>Not now</button><button type="button" class="btn dark" data-share-on>Turn on the link</button></div>`;return}
  box.innerHTML=`<p class="hint">Anyone with this link can review <b>${L} · ${esc(v.name)}</b>.</p>
    <div class="copyrow"><input id="shareLink" readonly value="${esc(shareUrl(v.share.token))}" aria-label="Client link"><button type="button" class="btn dark" data-share-copy>Copy</button></div>
    ${what}${warn}
    <div class="dlg-acts"><button type="button" class="btn ghost danger" data-share-off>Turn off</button><span class="sp"></span><button type="button" class="btn ghost" data-share-new title="Make a new link: the old one stops working">New link</button><button type="button" class="btn" data-share-open>Open as a client</button></div>`;
}
$('#dShare').addEventListener('click',async e=>{
  const c=s=>e.target.closest(s),p=projById(SHD.p),v=p&&verById(p,SHD.v);if(!v) return;
  if(c('[data-share-auth]')){$('#dShare').close();openAuth('login','share');return}
  if(c('[data-share-on]')){v.share={on:true,token:(v.share&&v.share.token)||randKey(24)};touch(p);save();render();renderShare();toast('Link is on. Copy it and send it to your client.');return}
  if(c('[data-share-off]')){v.share.on=false;touch(p);save();render();renderShare();toast('Link turned off. It no longer opens.');return}
  if(c('[data-share-new]')){if(!await confirmDlg('Make a new link?','The link you sent before stops working. Comments already left stay.','New link')) return;v.share={on:true,token:randKey(24)};touch(p);save();render();renderShare();toast('New link made. The old one no longer opens.');return}
  if(c('[data-share-copy]')){const i=$('#shareLink');i.select();navigator.clipboard.writeText(i.value).then(()=>toast('Client link copied'),()=>toast('Press Ctrl+C to copy'));return}
  if(c('[data-share-open]')){window.open(shareUrl(v.share.token),'_blank','noopener');return}
});

/* ---------- the client's side ---------- */
const SH={known:new Set(),mine:new Set(),busy:null,again:false,vers:0,timer:0};
function shareMsg(title,sub){document.title='Noon';$('#vProj').innerHTML=`<div class="sh-msg">${PI.page}<b>${esc(title)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div>`}
async function shareLoad(isFirst){
  const {data,error}=await sb.rpc('share_open',{p_token:SHARE,p_key:guestMe().key});
  if(error){console.warn('share',error);if(isFirst) shareMsg('This review could not be opened.','Check your connection and reload the page.');return false}
  if(!data){projectsOf(team()).length=0;PV.built=null;shareMsg('This link is turned off.','Ask whoever sent it to you for a new one.');return false}
  shareApply(data,isFirst);return true;
}
function shareApply(d,isFirst){
  const T=team(),g=guestMe(),meM=T.members.find(m=>m.isMe);meM.name=g.name||'Guest';
  const people=d.people||[],nm=id=>{const z=people.find(x=>x.id===id);return z?first(z.name||'Someone'):'Someone'};
  T.name=(d.project&&d.project.team)||'Review';
  T.members=[meM,...people.map(z=>({...mk(z.name||'Someone','UTC',9,17),id:z.id,photo:z.photo||''}))];
  SH.known=new Set([...d.comments.map(c=>c.id),...d.replies.map(r=>r.id)]);
  SH.mine=new Set([...d.comments.filter(c=>c.mine).map(c=>c.id),...d.replies.filter(r=>r.mine).map(r=>r.id)]);
  const who=x=>({by:x.guest_name||nm(x.author_id),byId:x.mine?GUEST_ID:(x.author_id||null),...(x.guest_name?{guest:true}:{})});
  const vers=d.versions.map(v=>({id:v.id,n:v.n,name:v.name,path:v.path,size:v.size||0,file:v.file||null,assets:Array.isArray(v.assets)?v.assets:[],at:msOf(v.created_at),by:null,
    cm:d.comments.filter(c=>c.version_id===v.id).map(c=>({id:c.id,n:c.n,sel:c.sel||'',rx:c.rx??.5,ry:c.ry??.5,px:c.px||0,py:c.py||0,dev:c.dev||'desktop',text:c.body,...who(c),layer:'client',at:msOf(c.created_at),status:c.status||'open',...(c.from_version?{from:{v:c.from_version,c:null}}:{}),
      re:d.replies.filter(r=>r.comment_id===c.id).map(r=>({id:r.id,text:r.body,...who(r),at:msOf(r.created_at)}))}))}));
  T.projects=[{id:d.project.id,name:d.project.name,at:msOf(d.project.changed_at),to:[],versions:vers}];
  if(!vers.length){PV.built=null;shareMsg(`${d.project.name} has nothing to review yet.`,'Come back once the first version is up.');return}
  if(isFirst){PV.proj=d.project.id;PV.ver=vers[0].id;PV.mode='comment';PV.layer='client';document.title=`${d.project.name} ${vLabel(vers[0])} · Review`}
  SH.vers=vers.length;render();
}
// what changed here goes up: new comments and replies of mine, and the ones of mine I deleted
function shareSave(){if(SH.busy){SH.again=true;return}SH.busy=shareFlush().catch(e=>console.warn('share',e)).finally(()=>{SH.busy=null;if(SH.again){SH.again=false;shareSave()}else shareLoad(false)})}
async function shareFlush(){
  const p=projectsOf(team())[0];if(!p) return;const g=guestMe(),seen=new Set(),fail=e=>toast('Not posted: '+((e&&e.message)||'try again'));
  for(const v of versOf(p)) for(const c of [...v.cm]){seen.add(c.id);
    if(c.byId===GUEST_ID&&!SH.known.has(c.id)){
      const {data,error}=await sb.rpc('share_comment',{p_token:SHARE,p_key:g.key,p_name:g.name,p_version:v.id,p_id:c.id,p_body:c.text,p_sel:c.sel||null,p_rx:c.rx,p_ry:c.ry,p_px:c.px,p_py:c.py,p_dev:c.dev,p_snippet:c.snip||null});
      if(error){fail(error);v.cm=v.cm.filter(x=>x!==c);continue}SH.known.add(c.id);SH.mine.add(c.id);if(data&&data.n) c.n=data.n}
    for(const r of [...(c.re||[])]){seen.add(r.id);
      if(r.byId===GUEST_ID&&!SH.known.has(r.id)){const {error}=await sb.rpc('share_reply',{p_token:SHARE,p_key:g.key,p_name:g.name,p_comment:c.id,p_id:r.id,p_body:r.text});
        if(error){fail(error);c.re=c.re.filter(x=>x!==r);continue}SH.known.add(r.id);SH.mine.add(r.id)}}}
  for(const id of [...SH.mine]) if(!seen.has(id)){await sb.rpc('share_delete',{p_token:SHARE,p_key:g.key,p_id:id});SH.mine.delete(id);SH.known.delete(id)}
}
// the name a client's comments show; asked the first time, changeable from the bar
let guestThen=null;
function askName(then){guestThen=then||null;const f=$('#fGuest');f.name.value=guestMe().name||'';$('#dGuest').showModal();setTimeout(()=>f.name.focus(),50)}
$('#fGuest').addEventListener('submit',e=>{const n=e.target.name.value.trim().slice(0,60);if(!n){e.preventDefault();return}setGuestName(n);render();const t=guestThen;guestThen=null;if(t) setTimeout(t,30);else toast(`Commenting as ${n}`)});
$('#dGuest').addEventListener('close',()=>{if(guestThen&&!guestMe().name) toast('Add your name to comment');guestThen=null});
function shareChrome(){
  const nav=$('#vProj .pv-bar .topnav');if(!nav) return;let b=$('#shWho');const g=guestMe();
  if(!b){b=document.createElement('button');b.type='button';b.id='shWho';b.className='lbtn quiet';b.title='The name your comments show. Click to change it.';nav.prepend(b)}
  b.innerHTML=`${avatar(me(),'xs')}<span>${g.name?esc(g.name):'Add your name'}</span>`;
}
if(SHARE){
  document.documentElement.dataset.share='1';
  const _rp=renderProjects;
  renderProjects=function(){const p=projectsOf(team())[0];if(!p||!versOf(p).length) return;PV.proj=p.id;if(!PV.ver||!verById(p,PV.ver)) PV.ver=curVer(p).id;_rp();shareChrome()};
  const _esc=pvEscape;pvEscape=function(){return PV.draft||PV.reply||PV.sel||PV.mode==='compare'?_esc():false};
  const _post=pvPost;pvPost=function(){if(!guestMe().name){askName(()=>_post());return}_post()};
  $('#vProj').addEventListener('click',e=>{
    if(e.target.closest('#shWho')){askName();return}
    const s=e.target.closest('[data-pc-send]');if(s&&!guestMe().name){e.stopImmediatePropagation();askName(()=>s.click())}
  },true);
  (async()=>{
    shareMsg('Opening the review…');
    if(!sb){shareMsg('Noon cannot reach its server right now.','Check your connection and reload the page.');return}
    if(!await shareLoad(true)) return;
    if(!guestMe().name) setTimeout(()=>askName(),500);
    SH.timer=setInterval(()=>{if(document.visibilityState==='visible'&&!SH.busy) shareLoad(false)},20000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!SH.busy) shareLoad(false)});
  })();
}
