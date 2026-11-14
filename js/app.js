/* ============ helpers ============ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const I={
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  inbox:'<path d="M3.5 13h4.5l1.5 2.5h5L16 13h4.5"/><path d="M6 5h12l2.5 8v5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-5z"/>',
  pages:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  tasks:'<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="m8.5 12.2 2.4 2.4 4.6-5"/>',
  globe:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.5 5.2 3.5 8.5s-1.1 6.2-3.5 8.5c-2.4-2.3-3.5-5.2-3.5-8.5S9.6 5.8 12 3.5z"/>',
  settings:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  star:'<path d="m12 3.8 2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  down:'<path d="m7 10 5 5 5-5"/>',
  up:'<path d="m7 14 5-5 5 5"/>',
  right:'<path d="m10 7 5 5-5 5"/>',
  x:'<path d="M7 7l10 10M17 7 7 17"/>',
  sort:'<path d="M8 5v14M4.5 15.5 8 19l3.5-3.5M16 19V5M12.5 8.5 16 5l3.5 3.5"/>',
  filter:'<path d="M4 7h16M7 12h10M10 17h4"/>',
  group:'<rect x="4" y="4" width="16" height="6.5" rx="2"/><rect x="4" y="13.5" width="16" height="6.5" rx="2"/>',
  more:'<circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  upload:'<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4.5 15v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  check:'<path d="m5.5 12.5 4 4 9-9.5"/>',
  back:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
  open:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  desktop:'<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/>',
  tablet:'<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M11 17.5h2"/>',
  phone:'<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 17.5h2"/>',
  comment:'<path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4.5 19l1-4.2A7.5 7.5 0 1 1 20 11.5z"/>',
  pointer:'<path d="m6 4 12.5 6.5-5.5 1.8-2 5.7z"/>',
  compare:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M12 4.5v15"/>',
  panel:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M14.5 4.5v15"/>',
  sidebar:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.5 4.5v15"/>',
  calendar:'<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M9 3.5v4M15 3.5v4"/>',
  folder:'<path d="M3.5 7.5a2 2 0 0 1 2-2h3.8l2 2h7.2a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  download:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 16v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2"/>',
  trash:'<path d="M4.5 7h15M10 11v5.5M14 11v5.5M6.5 7l.8 11.2a2 2 0 0 0 2 1.8h5.4a2 2 0 0 0 2-1.8L17.5 7M9.5 7V4.5h5V7"/>',
  reply:'<path d="M9.5 14.5 5 10l4.5-4.5"/><path d="M5 10h9a5 5 0 0 1 5 5v3.5"/>',
  user:'<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  type:'<path d="M5 7V5h14v2M12 5v14M9 19h6"/>',
  copy:'<path d="M5 6h14M5 10h14M5 14h10M5 18h7"/>',
  image:'<rect x="4" y="4.5" width="16" height="15" rx="2.5"/><circle cx="9.5" cy="10" r="1.6"/><path d="m4.5 17.5 5-4.5 4 3.5 2.5-2 3.5 3"/>',
  activity:'<path d="M3.5 12h4l2.5-6 4 12 2.5-6h4"/>',
  bolt:'<path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z"/>',
  cmd:'<path d="M9 6.5A2.5 2.5 0 1 0 6.5 9H9V6.5zM9 9h6M15 9V6.5A2.5 2.5 0 1 1 17.5 9H15zM15 9v6M15 15h2.5a2.5 2.5 0 1 1-2.5 2.5V15zM15 15H9M9 15v2.5A2.5 2.5 0 1 1 6.5 15H9zM9 15V9"/>',
};
const ic=(n,s=16)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
const sun=`<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="10.5" r="5" fill="#c6f23e"/><path d="M4 18.5h16" stroke="#c6f23e" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const ulSvg=`<svg viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true"><path d="M4 11.5C46 5.5 112 3.8 196 8.5"/></svg>`;

/* ============ derived ============ */
const client=id=>CLIENTS.find(c=>c.id===id);
const page=id=>PAGES.find(p=>p.id===id);
const openOf=p=>p.copy.open+p.design.open+(p.ads?p.ads.open:0);
const needsMe=p=>p.to.includes('me')&&openOf(p)>0;
const days=iso=>Math.round((new Date(iso+'T12:00')-TODAY)/864e5);
const fmtDate=iso=>new Date(iso+'T12:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
const isDone=p=>(!p.copy.n||p.copy.final===p.copy.n)&&(!p.design.n||p.design.final===p.design.n)&&(!p.ads||!p.ads.open);
const ST={progress:'In progress',scheduled:'Scheduled',done:'Done'};
const statusOf=p=>(!p.copy.n&&!p.design.n&&!p.ads)?'scheduled':isDone(p)?'done':'progress';
const ST_SVG={scheduled:'<circle cx="8" cy="8" r="5.8" fill="none" stroke="#415762" stroke-width="1.6"/>',
  progress:'<circle cx="8" cy="8" r="5.8" fill="none" stroke="#22242a" stroke-width="1.6"/><path d="M8 4.4a3.6 3.6 0 0 1 0 7.2z" fill="#22242a"/>',
  done:'<circle cx="8" cy="8" r="6.6" fill="#37955b"/><path d="m5.3 8.2 1.8 1.8 3.6-3.9" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'};
const stSvg=(st,s=16)=>`<svg class="st" width="${s}" height="${s}" viewBox="0 0 16 16" aria-hidden="true">${ST_SVG[st]}</svg>`;
const stIcon=p=>`<span class="sti" title="${ST[statusOf(p)]}">${stSvg(statusOf(p))}</span>`;
const dueSoon=p=>p.due&&days(p.due)<=7&&statusOf(p)!=='done';
function ago(m){if(m<1)return'Just now';if(m<60)return m+' min ago';if(m<1440)return Math.round(m/60)+' h ago';if(m<2880)return'Yesterday';
  const d=new Date(TODAY-m*6e4);return d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}
function designVers(p){if(DV[p.id])return DV[p.id];return Array.from({length:p.design.n},(_,i)=>({n:i+1,file:null,at:p.at+(p.design.n-1-i)*2*1440,by:i%2?p.by:p.creator}))}
function copyVers(p){if(CV[p.id])return CV[p.id];return Array.from({length:p.copy.n},(_,i)=>({n:i+1,at:p.at+(p.copy.n-1-i)*2*1440+60,by:i%2?p.by:p.creator}))}
function cmFor(pid,ver){return (CM[pid]&&CM[pid][ver])||[]}
function syncCounts(p){if(!CM[p.id])return;const last=designVers(p).at(-1);p.design.open=cmFor(p.id,last.n).filter(c=>c.open).length}

/* ============ state ============ */
const S={view:'all',f:{client:[],type:[],to:[],style:[],aud:[],st:[],folder:null},mineDone:false,extra:[],q:'',sort:'change',group:true,closed:new Set(),
  sel:new Set(),peek:null,col:localStorage.getItem('noonr.col')==='1',open:new Set(['dandy']),
  dev:'desktop',mode:'comment',layer:'team',rail:'comments',active:null,pending:null,showRes:false,cmp:null,replyTo:null};
const VIEWS={all:'All pages',mine:'My pages',needs:'Needs you',due:'Due soon'};
const DEV={desktop:1280,tablet:820,phone:390};
const route=()=>{const [name,id,tab,sub]=(location.hash.slice(1)||'projects').split('/');return{name,id,tab:tab||'design',sub:sub||null,ver:sub&&/^v\d+$/.test(sub)?+sub.slice(1):null}};
const ROUTES={},KEYS=[],ONHASH=[],RESIZE=[],BARE=new Set(['signin','welcome','review']);
const go=h=>{if(location.hash===h)render();else location.hash=h};
const ctx=()=>{const [n,id,f]=location.hash.slice(1).split('/');return n==='client'&&client(id)?{id,folder:f?decodeURIComponent(f):null}:null};
const clientHash=(id,f)=>'#client/'+id+(f?'/'+encodeURIComponent(f):'');
const isProj=R=>['pages','projects','client'].includes(R.name)||!R.name;

function visible(view=S.view){
  const f=S.f,q=S.q.trim().toLowerCase(),cx=ctx();
  const L=PAGES.filter(p=>{
    if(view==='mine'&&!p.to.includes('me'))return false;
    if(view==='needs'&&!needsMe(p))return false;
    if(view==='due'&&!dueSoon(p))return false;
    if(cx){if(p.client!==cx.id)return false;if(cx.folder&&p.folder!==cx.folder)return false}
    else if(f.client.length&&!f.client.includes(p.client))return false;
    if(f.type.length&&!p.types.some(t=>f.type.includes(t)))return false;
    if(f.to.length&&!p.to.some(t=>f.to.includes(t)))return false;
    if(f.style.length&&!f.style.includes(p.style))return false;
    if(f.aud.length&&!f.aud.includes(client(p.client).cats[0]))return false;
    if(f.st.length&&!f.st.includes(statusOf(p)))return false;
    if(q&&!p.name.toLowerCase().includes(q))return false;
    return true});
  const by={change:(a,b)=>a.at-b.at,due:(a,b)=>(a.due||'9999').localeCompare(b.due||'9999'),name:(a,b)=>a.name.localeCompare(b.name)}[S.sort];
  return L.sort(by);
}
const ordered=()=>{const L=visible();return S.group?CLIENTS.flatMap(c=>S.closed.has(c.id)?[]:L.filter(p=>p.client===c.id)):L};
function hl(text,q=S.q){q=q.trim();if(!q)return esc(text);const i=text.toLowerCase().indexOf(q.toLowerCase());if(i<0)return esc(text);
  return esc(text.slice(0,i))+'<mark class="hl">'+esc(text.slice(i,i+q.length))+'</mark>'+esc(text.slice(i+q.length))}
const av=(id,cls='')=>{const u=P[id];return `<span class="av ${id==='me'?'me':''} ${cls}" title="${esc(u.name)}">${u.ini}</span>`};
const avs=ids=>`<span class="avs">${ids.map(i=>av(i)).join('')}</span>`;
const tile=(cid,cls='')=>`<span class="tile ${cls}" aria-hidden="true">${esc(client(cid).name[0])}</span>`;

/* ============ undo + toast ============ */
let toastT;
function toast(text,undo){
  clearTimeout(toastT);const L=$('#layer');$('.toast',L)?.remove();
  const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');
  t.innerHTML=`<span class="ok">${ic('check',16)}</span><span>${esc(text)}</span>${undo?'<button class="undo">Undo</button>':''}<button aria-label="Dismiss">${ic('x',14)}</button>`;
  L.appendChild(t);
  if(undo)$('.undo',t).onclick=()=>{undo();t.remove();render(true)};
  t.querySelector('button:last-child').onclick=()=>t.remove();
  toastT=setTimeout(()=>t.remove(),6000);
}
function snap(){const s=JSON.stringify({PAGES,CM,DV});return()=>{const o=JSON.parse(s);PAGES=o.PAGES;Object.assign(CM,o.CM);Object.assign(DV,o.DV)}}

/* ============ menus / popovers ============ */
let MENU=null;
const mkey=a=>[a.dataset.act,a.dataset.k,a.dataset.n,a.dataset.c].join('|');
function closeMenu(){if(MENU){MENU.el.remove();MENU.anchor?.setAttribute('aria-expanded','false');MENU=null}}
function openMenu(anchor,build,{multi=false,html=null,cls='',onClose}={}){
  if(MENU&&MENU.key===mkey(anchor)){closeMenu();return}
  closeMenu();
  const el=document.createElement('div');el.className='menu '+cls;el.setAttribute('role',html?'dialog':'menu');
  $('#layer').appendChild(el);MENU={el,anchor,onClose,key:mkey(anchor)};anchor.setAttribute('aria-expanded','true');
  const draw=()=>{
    if(html){el.innerHTML=html();return}
    const items=build(),srch=items.filter(i=>!i.sep&&!i.head).length>10;
    if(srch&&!el.querySelector('.mq')){el.innerHTML=`<div class="mq">${ic('search',14)}<input placeholder="Search" aria-label="Search this list"></div><div class="mlist"></div>`;const inp=el.querySelector('.mq input');
      inp.oninput=()=>{MENU.q=inp.value;draw()};inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();el.querySelector('.mlist .mi')?.click()}};setTimeout(()=>inp.focus())}
    const q=(MENU.q||'').trim().toLowerCase(),strip=x=>String(x).replace(/<[^>]+>/g,'').toLowerCase(),box=srch?el.querySelector('.mlist'):el;
    box.innerHTML=items.map((it,i)=>q&&(it.sep||it.head||!strip(it.label).includes(q))?'':it.sep?'<div class="msep"></div>':it.head?`<div class="mhead">${esc(it.head)}</div>`:
      `<button class="mi ${it.on?'on':''} ${it.danger?'danger':''} ${it.sub?'sub':''}" data-i="${i}" role="menuitem">${it.check!==undefined?`<span class="ck">${ic('check',16)}</span>`:''}${it.pre||''}<span class="ml">${it.label}</span>${it.meta?`<span class="mm">${it.meta}</span>`:''}${it.kbd?`<kbd>${it.kbd}</kbd>`:''}</button>`).join('')||(q?'<div class="mempty">No match</div>':'');
    $$('.mi',box).forEach(b=>b.onclick=e=>{e.stopPropagation();const it=items[+b.dataset.i];it.pick&&it.pick();if(multi&&!it.close){draw();render(true)}else{closeMenu();render(true)}});
  };
  MENU.draw=draw;draw();
  const r=anchor.getBoundingClientRect(),w=el.offsetWidth,h=el.offsetHeight;
  let x=r.left,y=r.bottom+6;if(x+w>innerWidth-8)x=Math.max(8,r.right-w);if(y+h>innerHeight-8)y=Math.max(8,r.top-h-6);
  el.style.left=x+'px';el.style.top=y+'px';
  return el;
}
document.addEventListener('mousedown',e=>{if(!MENU||MENU.el.contains(e.target))return;const t=e.target.closest&&e.target.closest('[data-act]');if(t&&mkey(t)===MENU.key)return;closeMenu()});

/* ============ render ============ */
let sideT;
function render(soft){
  const R=route(),bare=BARE.has(R.name);
  $('#app').classList.toggle('bare',bare);
  if(innerWidth<1100)$('#app').classList.add('col');else $('#app').classList.toggle('col',S.col);
  if(!bare)renderSide(R);
  if(R.name==='page'&&page(R.id)){
    if(soft&&$('#main').dataset.view==='page'&&$('#main').dataset.key===R.id+R.tab+R.sub){renderPageSoft(R);return}
    renderPage(R);
  }else if(isProj(R))renderPages();
  else if(ROUTES[R.name])ROUTES[R.name](R,soft);
  else renderStub(R.name);
  if(MENU&&MENU.draw&&!MENU.el.isConnected)closeMenu();
}

/* ---------- sidebar ---------- */
function renderSide(R){
  const cx=ctx(),onProj=isProj(R)&&R.name!=='client';
  const unread=typeof inboxUnread==='function'?inboxUnread():0,myTasks=typeof tasksMineOpen==='function'?tasksMineOpen():0;
  const t=new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Sarajevo'});
  $('#side').innerHTML=`
  <div class="ws">
    <button class="ws-b" data-act="teamMenu" aria-haspopup="menu" title="My team"><span class="logo">${sun}</span><span class="lbl">My team</span>${ic('down',14)}</button>
    <button class="ib" data-act="collapse" title="Collapse sidebar  [" aria-label="Collapse sidebar">${ic('sidebar',18)}</button>
    <button class="ib expand" data-act="collapse" title="Expand sidebar  [" aria-label="Expand sidebar">${ic('sidebar',18)}</button>
  </div>
  <button class="srch" data-act="palette" title="Search  Ctrl K">${ic('search')}<span class="lbl">Search</span><kbd>⌘K</kbd></button>
  <a class="ni ${R.name==='inbox'?'on':''}" href="#inbox" title="Inbox">${ic('inbox',18)}<span class="lbl">Inbox</span>${unread?`<span class="cnt hi">${unread}</span>`:''}</a>
  <a class="ni ${onProj?'on':''}" href="#projects" data-act="allPages" title="Projects">${ic('folder',18)}<span class="lbl">Projects</span><span class="cnt">${CLIENTS.length}</span></a>
  <a class="ni ${R.name==='tasks'?'on':''}" href="#tasks" title="Tasks">${ic('tasks',18)}<span class="lbl">Tasks</span>${myTasks?`<span class="cnt">${myTasks}</span>`:''}</a>
  <a class="ni ${R.name==='team'?'on':''}" href="#team" title="Team">${ic('globe',18)}<span class="lbl">Team</span></a>
  <div class="sec"><button class="sec-l sec-b" data-act="viewMine" title="Show your pages in the table">Your pages</button></div>
  ${yourPages(R)}
  <div class="sec"><button class="sec-l sec-b" data-act="allPages" title="Open Projects">Projects</button><button class="ib sm" data-act="newClient" title="New project" aria-label="New project">${ic('plus',14)}</button></div>
  ${sideClients(cx)}
  <div class="sp"></div>
  <a class="ni ${R.name==='settings'?'on':''}" href="#settings" title="Settings">${ic('settings',18)}<span class="lbl">Settings</span></a>
  <div class="you">${av('me','lg')}<div><b>Mehmed Elezovic</b><span>Sarajevo · ${t}</span></div></div>`;
}

/* one client row, same behaviour everywhere: arrow expands, name opens the client page, the open list ends with "New page" */
const SIDE_CAP=8;
function sideClients(cx){
  let list=CLIENTS;
  if(CLIENTS.length>SIDE_CAP){const last=c=>Math.min(1e9,...PAGES.filter(p=>p.client===c.id).map(p=>p.at));list=CLIENTS.slice().sort((a,b)=>last(a)-last(b)).slice(0,SIDE_CAP);if(cx&&!list.some(c=>c.id===cx.id))list.push(client(cx.id))}
  const row=c=>{const n=PAGES.filter(p=>p.client===c.id).length,open=S.open.has(c.id),on=cx&&cx.id===c.id;
    return `<div class="cl-row"><button class="cl-chev" data-act="sideOpen" data-c="${c.id}" aria-expanded="${open}" aria-label="${open?'Collapse':'Expand'} ${esc(c.name)}"><span class="chev ${open?'open':''}">${ic('right',14)}</span></button><a class="ni ${on&&!cx.folder?'on':''}" href="${clientHash(c.id)}" title="${esc(c.name)}">${tile(c.id)}<span class="lbl">${esc(c.name)}</span><span class="cnt">${n}</span></a></div>
    ${open?c.folders.map(f=>`<a class="ni sub ${on&&cx.folder===f?'on':''}" href="${clientHash(c.id,f)}">${ic('folder',15)}<span class="lbl">${esc(f)}</span><span class="cnt">${PAGES.filter(p=>p.client===c.id&&p.folder===f).length}</span></a>`).join('')+`<button class="ni sub add" data-act="newPageIn" data-c="${c.id}">${ic('plus',15)}<span class="lbl">New page</span></button>`:''}`};
  return list.map(row).join('')+(CLIENTS.length>SIDE_CAP?`<a class="ni sub2" href="#projects" data-act="allPages">${ic('folder',14)}<span class="lbl">All ${CLIENTS.length} projects</span></a>`:'');
}
function addRow(cid,f,short){return `<button class="tr-add" data-act="newPageIn" data-c="${cid}"${f?` data-f="${esc(f)}"`:''}>${ic('plus',15)}${short?'New page':`New page in ${esc(client(cid).name)}`}</button>`}
function yourPages(R){
  const mine=PAGES.filter(p=>p.to.includes('me')),by=(a,b)=>(a.due||'9999').localeCompare(b.due||'9999');
  const row=p=>`<a class="ni pg ${R.name==='page'&&R.id===p.id?'on':''}" href="#page/${p.id}/${p.copy.n&&!p.design.n?'copy':'design'}" title="${esc(p.name)} · ${ST[statusOf(p)]}${p.due?' · due '+fmtDate(p.due):''}">${stIcon(p)}<span class="lbl">${esc(p.name)}</span>${needsMe(p)?`<span class="cnt hi">${openOf(p)}</span>`:''}</a>`;
  const prog=mine.filter(p=>statusOf(p)==='progress').sort(by),sch=mine.filter(p=>statusOf(p)==='scheduled').sort(by),done=mine.filter(p=>statusOf(p)==='done');
  const open=prog.concat(sch),CAP=8;
  return open.slice(0,CAP).map(row).join('')+(open.length>CAP?`<button class="ni sub2" data-act="viewMine">${ic('pages',14)}<span class="lbl">All ${open.length} of your pages</span></button>`:'')+(done.length?`<button class="ni sub2" data-act="mineDone" aria-expanded="${S.mineDone}">${stSvg('done',14)}<span class="lbl">${S.mineDone?'Hide':'Show'} done</span><span class="cnt">${done.length}</span></button>${S.mineDone?done.map(row).join(''):''}`:'');
}

/* ---------- pages home ---------- */
function greeting(){const h=+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',hour12:false,timeZone:'Europe/Sarajevo'});return h<12?'Good morning':h<18?'Good afternoon':'Good evening'}
function pillHtml(key,label,all,names){
  const v=S.f[key],extra=S.extra.includes(key);
  const val=v.length?esc(names(v[0]))+(v.length>1?` <span class="num">+${v.length-1}</span>`:''):all;
  return `<span class="pill ${v.length||extra?'set':''}"><button data-act="fpill" data-k="${key}" aria-haspopup="menu"><span class="k">${label}</span> ${val} ${ic('down',14)}</button>${v.length||extra?`<button class="x" data-act="fclear" data-k="${key}" aria-label="Clear ${label} filter">${ic('x',12)}</button>`:''}</span>`;
}
const cellPart=(p,k)=>{const x=p[k];if(!x.n)return '<span class="dash">–</span>';
  return `<span class="v">v${x.n}</span>`+(x.final===x.n?'<span class="tag ink">Final</span>':x.open?`<span class="tag ${needsMe(p)?'hi':''}">${x.open} open</span>`:'')};
const cellAds=p=>{if(!p.ads)return '<span class="dash">–</span>';return `<span class="v" title="${p.ads.ok} of ${p.ads.n} approved">${p.ads.ok}/${p.ads.n}</span>`+(p.ads.open?`<span class="tag ${needsMe(p)?'hi':''}">${p.ads.open} open</span>`:'')};
function cellDue(p){if(!p.due)return '<span class="dash">–</span>';const d=days(p.due);
  if(statusOf(p)==='done')return `<span class="due done">${ic('check',14)}${fmtDate(p.due)}</span>`;
  if(d<0)return `<span class="tag red" title="${-d} days late">${fmtDate(p.due)}</span>`;
  if(d===0)return '<span class="due soon">Today</span>';if(d===1)return '<span class="due soon">Tomorrow</span>';
  return `<span class="due ${d<=3?'soon':''}">${fmtDate(p.due)}</span>`}
const PCOLS={chk:36,page:0,client:120,type:132,copy:108,design:108,ads:96,to:84,due:92,chg:132};
const PDROP=['ads','type','client','chg','to'];
let PKEYS=Object.keys(PCOLS);
function pageKeys(){const w=innerWidth-($('#app').classList.contains('col')?64:240)-8-48;let keys=Object.keys(PCOLS).filter(k=>k!=='client'||!S.group);
  const tot=()=>keys.reduce((s,k)=>s+(k==='page'?240:PCOLS[k]),0);for(const d of PDROP){if(tot()<=w)break;keys=keys.filter(k=>k!==d)}return keys}
const pageTpl=keys=>keys.map(k=>k==='page'?'minmax(0,1fr)':PCOLS[k]+'px').join(' ');
function rowHtml(p){const c=client(p.client),sel=S.sel.has(p.id);
  const cell={chk:`<span class="cb ${sel?'on':''}" data-act="sel" data-id="${p.id}" role="checkbox" aria-checked="${sel}" aria-label="Select ${esc(p.name)}" tabindex="0">${ic('check',12)}</span>`,
    page:`${stIcon(p)}<span class="pname">${hl(p.name)}</span>${p.folder?`<span class="pfold">${ic('folder',13)}<span class="pf-t">${esc(p.folder)}</span></span>`:''}`,
    client:`${tile(c.id)}<span>${esc(c.name)}</span>`,type:`<span class="tags">${p.types.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</span>`,
    copy:cellPart(p,'copy'),design:cellPart(p,'design'),ads:cellAds(p),to:avs(p.to),due:cellDue(p),chg:`${ago(p.at)}<span class="by">&nbsp;· ${P[p.by].short}</span>`};
  return `<div class="tr ${sel?'sel':''} ${S.peek===p.id?'pk':''}" data-act="row" data-id="${p.id}">${PKEYS.map(k=>`<div class="td${k==='chg'?' c-chg':''}">${cell[k]}</div>`).join('')}</div>`}
function renderPages(){
  const m=$('#main');m.dataset.view='pages';m.dataset.key='';const cx=ctx(),cc=cx&&client(cx.id);
  if(!S.collInit){S.collInit=true;if(CLIENTS.length>12)CLIENTS.forEach(c=>S.closed.add(c.id))}
  PKEYS=pageKeys();
  const L=visible(),rows=ordered();
  const nNeeds=PAGES.filter(needsMe).length,nDue=PAGES.filter(dueSoon).length,nOpen=PAGES.reduce((a,p)=>a+(p.to.includes('me')?openOf(p):0),0);
  const sorts={change:'Last change',due:'Deadline',name:'Name'};
  const allSel=rows.length&&rows.every(p=>S.sel.has(p.id)),someSel=rows.some(p=>S.sel.has(p.id));
  const th=(label,key)=>key?`<div class="th sortable ${S.sort===key?'on':''}" data-act="sortBy" data-s="${key}">${label}${S.sort===key?ic('down',12):''}</div>`:`<div class="th">${label}</div>`;
  const TH={chk:`<div class="th"><span class="cb ${allSel?'on':someSel?'some':''}" data-act="selAll" role="checkbox" aria-checked="${allSel?'true':someSel?'mixed':'false'}" aria-label="Select all" tabindex="0">${allSel?ic('check',12):someSel?'<svg width="12" height="12" viewBox="0 0 24 24"><path d="M6 12h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>':ic('check',12)}</span></div>`,page:th('Page','name'),client:th('Project'),type:th('Type'),copy:th('Copy'),design:th('Design'),ads:th('Ads'),to:th('Assigned'),due:th('Deadline','due'),chg:th('Last change','change')};
  let body='';
  const filtered=S.q.trim()||S.view!=='all'||Object.values(S.f).some(v=>Array.isArray(v)&&v.length);
  if(!L.length&&cx&&!filtered){body=`<div class="empty"><h2 class="disp">No <span class="ul">pages${ulSvg}</span> yet</h2><p>Add the first page${cx.folder?` to ${esc(cx.folder)}`:` of ${esc(cc.name)}`}.</p><button class="btn btn-ink" data-act="newPageIn" data-c="${cc.id}"${cx.folder?` data-f="${esc(cx.folder)}"`:''}>${ic('plus')}New page</button></div>`}
  else if(!L.length){body=`<div class="empty"><h2 class="disp">Nothing <span class="ul">matches${ulSvg}</span></h2><p>No page fits these filters. Clear them to see every page again.</p><button class="btn btn-line" data-act="clearAll">Clear filters</button></div>`}
  else if(S.group){body=CLIENTS.map(c=>{const g=L.filter(p=>p.client===c.id);if(!g.length)return'';const shut=S.closed.has(c.id);if(cx)return g.map(rowHtml).join('')+addRow(c.id,cx.folder,true);
    return `<div class="gh"><div class="gh-in"><button class="gh-chev" data-act="gtoggle" data-c="${c.id}" aria-expanded="${!shut}" aria-label="${shut?'Expand':'Collapse'} ${esc(c.name)}"><span class="chev ${shut?'':'open'}">${ic('right',14)}</span></button><a class="gh-link" href="${clientHash(c.id)}" title="Open ${esc(c.name)}">${tile(c.id,'lg')}<b>${esc(c.name)}</b><span class="num">${g.length}</span></a><span class="tags">${c.cats.map(t=>`<span class="tag">${t}</span>`).join('')}</span></div></div>${shut?'':g.map(rowHtml).join('')+addRow(c.id)}`}).join('')}
  else body=L.map(rowHtml).join('')+(cx?addRow(cx.id,cx.folder,true):'');
  m.innerHTML=`
  <div class="top">
    <div class="crumbs">${cx?`<a href="#projects" data-act="allPages">${ic('folder',18)}Projects</a><span class="sl">/</span><a href="${clientHash(cc.id)}" class="${cx.folder?'':'cur'}">${tile(cc.id)}${esc(cc.name)}</a>${cx.folder?`<span class="sl">/</span><span class="cur" style="padding:0 6px">${esc(cx.folder)}</span>`:''}`:`${ic('folder',18)}<span class="cur" style="color:var(--ink);padding:0 4px">Projects</span>`}<span class="sl">/</span>
      <button class="vbtn" data-act="views" aria-haspopup="menu">${VIEWS[S.view]} <span class="num">${visible().length}</span>${ic('down',14)}</button></div>
    <div class="sp"></div>
    ${cx?`<button class="btn btn-ink" data-act="newPageIn" data-c="${cc.id}"${cx.folder?` data-f="${esc(cx.folder)}"`:''}>${ic('plus')}New page</button>`:`<button class="btn btn-ink" data-act="newClient">${ic('plus')}New project</button>`}
  </div>
  ${cx?clientHead(cc,cx.folder):`<div class="greet">
    <h1 class="disp">${greeting()}, <span class="mk">Mehmed</span></h1>
    <p class="gsub"><button class="gl" data-act="view" data-v="needs">${nNeeds} pages need you</button><span class="dot">·</span><button class="gl" data-act="view" data-v="due">${nDue} due this week</button><span class="dot">·</span><span>${nOpen} open comments on your pages</span></p>
  </div>`}
  <div class="vbar">
    ${cx?'':pillHtml('client','Project','All',id=>client(id).name)}
    ${pillHtml('type','Page type','All',t=>t)}
    ${pillHtml('to','Assigned','Anyone',id=>P[id].short)}
    ${S.extra.includes('style')?pillHtml('style','Style','All',t=>t):''}
    ${S.extra.includes('aud')?pillHtml('aud','Audience','All',t=>t):''}
    ${S.extra.includes('st')?pillHtml('st','Status','All',k=>ST[k]):''}
    ${S.extra.length<3?`<span class="pill ghost"><button data-act="addFilter" aria-haspopup="menu">${ic('plus',14)}Filter</button></span>`:''}
    <div class="sp"></div>
    <label class="vsearch">${ic('search',15)}<input id="q" placeholder="Search pages" value="${esc(S.q)}" aria-label="Search pages"><kbd>/</kbd></label>
    <span class="pill"><button data-act="sort" aria-haspopup="menu">${ic('sort',14)}<span class="k">Sort</span> ${sorts[S.sort]}</button></span>
    ${cx?'':`<span class="pill"><button data-act="group" aria-haspopup="menu">${ic('group',14)}<span class="k">Group</span> ${S.group?'Project':'None'}</button></span>`}
  </div>
  <div class="tbl-wrap" id="tblWrap">
    <div class="tbl ${S.group?'grouped':''} ${someSel?'selecting':''}" role="table" style="--cols:${pageTpl(PKEYS)}">
      <div class="thr">${PKEYS.map(k=>TH[k]).join('')}</div>
      ${body}
    </div>
    ${L.length?`<div class="tfoot"><span class="num">${L.length}</span> of <span class="num">${cx?PAGES.filter(p=>p.client===cx.id&&(!cx.folder||p.folder===cx.folder)).length:PAGES.length}</span> pages${cx?` in ${esc(cx.folder||cc.name)}`:''}</div>`:''}
  </div>
  ${S.sel.size?bulkHtml():''}
  ${S.peek&&page(S.peek)?peekHtml(page(S.peek)):''}`;
  const q=$('#q');q.oninput=()=>{S.q=q.value;const pos=q.selectionStart;renderPages();const n=$('#q');n.focus();n.setSelectionRange(pos,pos)};
  peekThumbs();
}
function bulkHtml(){return `<div class="bulk" role="toolbar" aria-label="Selected pages"><span class="n"><span class="num">${S.sel.size}</span>selected</span><span class="vd"></span>
  <button data-act="bMove" aria-haspopup="menu">${ic('folder',15)}Move to…</button><button data-act="bAssign" aria-haspopup="menu">${ic('user',15)}Assign</button><button data-act="bFinal">${ic('check',15)}Mark final</button><button data-act="bDelete">${ic('trash',15)}Delete</button><span class="vd"></span><button class="bx" data-act="bClear" aria-label="Clear selection">${ic('x',15)}</button></div>`}

/* ---------- side peek ---------- */
function peekHtml(p){const c=client(p.client),L=ordered(),i=L.findIndex(x=>x.id===p.id);
  const dv=designVers(p),last=dv.at(-1),cms=cmFor(p.id,last?.n).filter(x=>x.open);
  const part=(k,label,icn)=>{const x=p[k];if(!x.n)return `<div class="part"><div class="part-h">${ic(icn,16)}<b>${label}</b><span class="sp"></span><span class="dash">No versions yet</span></div></div>`;
    const vs=k==='copy'?copyVers(p):dv,lv=vs.at(-1);
    return `<div class="part"><div class="part-h">${ic(icn,16)}<b>${label}</b><span class="v">v${x.n}</span>${x.final===x.n?'<span class="tag ink">Final</span>':x.open?`<span class="tag ${needsMe(p)?'hi':''}">${x.open} open</span>`:''}<span class="sp"></span><a class="btn btn-ghost btn-sm" href="#page/${p.id}/${k}">Open${ic('right',14)}</a></div>
      ${k==='design'?`<div class="thumb">${lv.file?`<iframe src="sample-page/${lv.file}" tabindex="-1" title="" loading="lazy" scrolling="no"></iframe>`:'<div class="skel"><i></i><i></i><i></i><i></i></div>'}</div>`:''}
      <div class="meta">Updated ${ago(lv.at).toLowerCase()} by ${P[lv.by].short}</div></div>`};
  return `<aside class="peek" aria-label="Page preview">
   <div class="pk-top"><button class="ib" data-act="pkPrev" aria-label="Previous page" ${i<=0?'disabled style="opacity:.35"':''}>${ic('up',18)}</button><button class="ib" data-act="pkNext" aria-label="Next page" ${i>=L.length-1?'disabled style="opacity:.35"':''}>${ic('down',18)}</button>
     <span class="hint"><kbd>↑</kbd><kbd>↓</kbd> to move</span><span class="sp"></span>
     <a class="btn btn-line btn-sm" href="#page/${p.id}/design">Open page${ic('open',14)}</a>
     <button class="ib" data-act="pkClose" aria-label="Close preview">${ic('x',18)}</button></div>
   <div class="pk-body">
     <div class="pk-crumb">${tile(c.id)}${esc(c.name)}${p.folder?`<span class="dash">/</span>${esc(p.folder)}`:''}</div>
     <h2 class="pk-title">${esc(p.name)}</h2>
     <div class="tags">${p.types.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}<span class="tag">${esc(p.style)}</span></div>
     <dl class="attrs">
       <dt>${ic('activity',15)}Status</dt><dd>${stIcon(p)}${ST[statusOf(p)]}</dd>
       <dt>${ic('user',15)}Assigned</dt><dd>${avs(p.to)}<span>${p.to.map(x=>P[x].short).join(', ')}</span></dd>
       <dt>${ic('calendar',15)}Deadline</dt><dd>${cellDue(p)}${p.due&&statusOf(p)!=='done'&&days(p.due)>1?`<span class="dash">in ${days(p.due)} days</span>`:''}</dd>
       <dt>${ic('link',15)}Review link</dt><dd>${p.share?'<span>On</span>':'<span class="dash">Off</span>'}</dd>
       <dt>${ic('calendar',15)}Last change</dt><dd>${ago(p.at)} · ${P[p.by].short}</dd>
     </dl>
     <div class="slbl">Work</div>
     ${part('copy','Copy','copy')}${part('design','Design','image')}
     ${p.ads?`<div class="part"><div class="part-h">${ic('image',16)}<b>Ads</b><span class="v">${p.ads.ok}/${p.ads.n}</span><span class="dash">approved</span>${p.ads.open?`<span class="tag ${needsMe(p)?'hi':''}">${p.ads.open} open</span>`:''}<span class="sp"></span><a class="btn btn-ghost btn-sm" href="#page/${p.id}/ads">Open${ic('right',14)}</a></div></div>`:''}
     ${cms.length?`<div class="slbl">Open comments<span class="num">${cms.length}</span></div><div>${cms.slice(0,3).map(x=>`<div class="cmini">${x.by==='guest'?`<span class="av guest">${x.guest.split(' ').map(w=>w[0]).slice(-2).join('')}</span>`:av(x.by)}<div><div class="who">${x.by==='guest'?esc(x.guest)+' · Review link':P[x.by].short} · ${x.at}</div><p>${esc(x.text)}</p></div></div>`).join('')}</div>`:''}
   </div></aside>`}
function peekThumbs(){$$('.thumb iframe').forEach(f=>{const w=f.parentElement.clientWidth;f.style.transform=`scale(${w/1280})`})}

/* ---------- a page ---------- */
function pageTop(p){const c=client(p.client);
  return `<div class="top">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${clientHash(c.id)}">${tile(c.id)}${esc(c.name)}</a>${p.folder?`<span class="sl">/</span><a href="${clientHash(c.id,p.folder)}">${esc(p.folder)}</a>`:''}<span class="sl">/</span><span class="cur" style="padding:0 6px">${esc(p.name)}</span></nav>
    <div class="sp"></div>
    <button class="btn btn-line" data-act="share" aria-haspopup="dialog" title="Share for review">${ic('link')}<span class="bl">Share for review</span></button>
    <button class="btn btn-ink" data-act="upload">${ic('upload')}<span class="bl">${route().tab==='ads'?'Upload ads':'Upload version'}</span></button>
    <button class="ib" data-act="pageMore" aria-label="More" aria-haspopup="menu">${ic('more',18)}</button>
  </div>`}
function renderPage(R){
  const p=page(R.id),m=$('#main');m.dataset.view='page';m.dataset.key=R.id+R.tab+R.sub;
  if(!R.ver){S.pending=null}
  m.innerHTML=`${pageTop(p)}${headHtml(p)}${tabsHtml(p,R)}
  <div class="pb"><div class="pb-main" id="pbMain"></div><aside class="rail" id="rail" aria-label="Page side panel"></aside></div>`;
  renderPbMain(p,R);renderRail(p,R);
}
const headHtml=p=>`<div class="ph"><div class="ph-ic">${ic('pages',22)}</div><div><h1>${esc(p.name)}</h1><div class="tags">${p.types.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}<span class="tag">${esc(p.style)}</span></div></div></div>`;
function tabsHtml(p,R){const tabs=[['copy','Copy',p.copy.n],['design','Design',p.design.n],['ads','Ads',p.ads?p.ads.n:0],['activity','Activity',null]];
  return `<div class="tabs" role="tablist">${tabs.map(([k,l,n])=>`<a class="tab ${R.tab===k?'on':''}" role="tab" aria-selected="${R.tab===k}" href="#page/${p.id}/${k}">${l}${n!==null?`<span class="num">${n}</span>`:''}</a>`).join('')}</div>`}
function renderPageSoft(R){const p=page(R.id),m=$('#main');
  $('.top',m).outerHTML=pageTop(p);$('.ph',m).outerHTML=headHtml(p);$('.tabs',m).outerHTML=tabsHtml(p,R);
  if(R.tab==='design'&&R.ver){placeAllPins();refreshViewerBar(p,R)}
  else if(R.tab==='copy'&&R.sub&&typeof copySoft==='function')copySoft(p,R);
  else if(R.tab==='ads'&&R.sub&&typeof adsSoft==='function')adsSoft(p,R);
  else renderPbMain(p,R);
  renderRail(p,R);
}
function renderPbMain(p,R){
  const el=$('#pbMain');
  if(R.tab==='design'&&R.ver){el.innerHTML=viewerHtml(p,R);mountFrames(p,R);return}
  if(R.tab==='design')el.innerHTML=designList(p);
  else if(R.tab==='copy'){copyMain(p,R,el);return}
  else if(R.tab==='ads'){adsMain(p,R,el);return}
  else el.innerHTML=activityTab(p);
  peekThumbs();
}
function designList(p){const vs=designVers(p);
  const card=v=>{const isLast=v.n===vs.at(-1).n,open=CM[p.id]?cmFor(p.id,v.n).filter(c=>c.open).length:(isLast?p.design.open:0),fin=p.design.final===v.n;
    return `<div class="vcard" data-act="openVer" data-n="${v.n}" tabindex="0" role="link" aria-label="Open design v${v.n}">
      <div class="thumb">${v.file?`<iframe src="sample-page/${v.file}" tabindex="-1" title="" loading="lazy" scrolling="no"></iframe>`:'<div class="skel"><i></i><i></i><i></i><i></i></div>'}</div>
      <div class="vc-b"><div class="vc-h"><b>Design</b><span class="v">v${v.n}</span>${fin?'<span class="tag ink">Final</span>':''}${isLast?'<span class="tag">Current</span>':''}<span class="sp"></span>${open?`<span class="tag ${needsMe(p)?'hi':''}">${open} open</span>`:''}</div>
      <div class="vc-m">${ago(v.at)} · ${P[v.by].short}${p.share&&isLast?' · review link on':''}</div>
      <div class="vc-a"><button class="btn btn-line btn-sm" data-act="vFinal" data-n="${v.n}">${fin?'Unmark final':'Mark final'}</button><button class="btn btn-ghost btn-sm" data-act="share" data-n="${v.n}" aria-haspopup="dialog">${ic('link',14)}Share</button><span class="sp"></span><button class="ib sm" data-act="vMore" data-n="${v.n}" aria-label="More for v${v.n}" aria-haspopup="menu">${ic('more',16)}</button></div></div></div>`};
  return `<div class="sect"><div class="sect-h"><h2>Design versions</h2><span class="num">${vs.length}</span><span class="sp"></span>${vs.length>1?`<button class="btn btn-ghost btn-sm" data-act="cmpLatest">${ic('compare',14)}Compare v${vs.at(-2).n} and v${vs.at(-1).n}</button>`:''}</div>
   <div class="vgrid">${vs.slice().reverse().map(card).join('')}
   <button class="vcard up" data-act="upload"><span class="ub">${ic('upload',20)}</span><b>Upload a version</b><span style="font-size:13px">Drop an HTML file or a folder</span></button></div></div>`}
function activityTab(p){
  const ev=p.id==='remake'?[
    ['Today',[['image','<b>Milo</b> uploaded <b>Design v2</b>','16 min ago'],['comment','<b>Milo</b> commented on Design v2 <span class="v">#1</span>','16 min ago'],['comment','<b>Dr. Lena Patel</b> commented on the review link <span class="v">C1</span>','1 h ago'],['comment','<b>Paul</b> commented on Design v2 <span class="v">#3</span>','2 h ago']]],
    ['Yesterday',[['check','<b>Milo</b> marked <b>Copy v3</b> final','Yesterday'],['link','<b>Mehmed</b> turned on the review link for Design v2','Yesterday'],['check','<b>Milo</b> resolved <span class="v">#5</span> on Design v2','Yesterday']]],
    ['Earlier',[['image','<b>Milo</b> uploaded <b>Design v1</b>','Nov 6'],['copy','<b>Milo</b> uploaded <b>Copy v2</b>','Nov 8'],['user','<b>Mehmed</b> assigned <b>Milo</b>','Nov 3'],['plus','<b>Mehmed</b> created the page','Nov 3']]]]
   :[['Recent',[['activity',`<b>${P[p.by].short}</b> changed the page`,ago(p.at)],['plus',`<b>${P[p.creator].short}</b> created the page`,p.created]]]];
  return `<div class="sect"><div class="act">${ev.map(([d,items])=>`<div class="act-day">${d}</div>${items.map(([icn,t,w])=>`<div class="act-i"><span class="ai">${ic(icn,15)}</span><p>${t}</p><span class="t">${w}</span></div>`).join('')}`).join('')}</div></div>`}
function emptyHtml(h,p,b){return `<div class="empty" style="flex:1"><h2 class="disp" style="font-size:28px;line-height:32px">${h}</h2><p>${p}</p><button class="btn btn-ink" data-act="upload">${ic('upload')}${b}</button></div>`}

/* ---------- design viewer ---------- */
function viewerHtml(p,R){const vs=designVers(p),v=vs.find(x=>x.n===R.ver)||vs.at(-1);
  const cv=S.mode==='compare'?(vs.find(x=>x.n===S.cmp&&x.n!==v.n)||vs.filter(x=>x.n!==v.n).at(-1)):null;if(cv)S.cmp=cv.n;const L=vs.at(-1).n;
  return `<div class="vbar2" id="vbar2">${viewerBar(p,v)}</div>
  <div class="stage" id="stage">${v.file?(cv?frameCol(cv,'a',cv.n===L)+frameCol(v,'b',v.n===L):frameCol(v,'b',v.n===L)):
    `<div class="stage-msg"><h2 class="disp" style="font-size:24px;line-height:30px">No sample file for this page</h2><p>Only <b>Remake cost advertorial</b> has real design files in this mockup.</p><a class="btn btn-ink" href="#page/remake/design/v2">Open it</a></div>`}</div>`}
function viewerBar(p,v){const fin=p.design.final===v.n,vs=designVers(p);
  return `<a class="ib" href="#page/${p.id}/design" aria-label="All versions" title="All versions">${ic('back',18)}</a>
  <button class="verb" data-act="verMenu" aria-haspopup="menu">Design <span class="v" style="color:var(--ink)">v${v.n}</span>${ic('down',14)}</button>
  ${fin?'<span class="tag ink">Final</span>':''}${v.n===vs.at(-1).n?'<span class="tag">Current</span>':''}
  <span class="sp"></span>
  <div class="seg" role="group" aria-label="Width">${Object.entries(DEV).map(([k,w])=>`<button class="${S.dev===k?'on':''}" data-act="dev" data-d="${k}" aria-pressed="${S.dev===k}" title="${k[0].toUpperCase()+k.slice(1)} ${w}px">${ic(k,15)}<span class="num">${w}</span></button>`).join('')}</div>
  <div class="seg" role="group" aria-label="Mode">${[['comment','Comment','comment'],['browse','Browse','pointer'],['compare','Compare','compare']].map(([k,l,icn])=>`<button class="${S.mode===k?'on':''}" data-act="mode" data-m="${k}" aria-pressed="${S.mode===k}" title="${l}">${ic(icn,15)}<span class="ml2">${l}</span></button>`).join('')}</div>
  <span class="sp"></span>
  <button class="btn btn-line btn-sm" data-act="vFinal" data-n="${v.n}">${fin?'Unmark final':'Mark final'}</button>`}
function refreshViewerBar(p,R){const b=$('#vbar2');if(!b)return;const vs=designVers(p);b.innerHTML=viewerBar(p,vs.find(x=>x.n===R.ver)||vs.at(-1))}
function frameCol(v,side,cur){return `<div class="fcol">${S.mode==='compare'?`<div class="flabel"><span class="v" style="color:var(--ink)">v${v.n}</span>${cur?'<span class="tag">Current</span>':''}<span>${ago(v.at)} · ${P[v.by].short}</span></div>`:''}<div class="fwrap"><iframe src="sample-page/${v.file}" data-side="${side}" data-ver="${v.n}" title="Design v${v.n} preview"></iframe></div></div>`}
function mountFrames(p,R){layoutFrames();$$('#stage iframe').forEach(f=>f.addEventListener('load',()=>setupFrame(f,p)))}
function layoutFrames(){const st=$('#stage');if(!st)return;const fr=$$('.fwrap',st);if(!fr.length)return;
  const W=DEV[S.dev],gap=24,cmp=S.mode==='compare'&&fr.length>1;
  const aw=(st.clientWidth-48-(fr.length-1)*gap)/fr.length,ah=st.clientHeight-48-(cmp?30:0),s=Math.min(1,aw/W);
  fr.forEach(f=>{const i=$('iframe',f);try{i.contentDocument.documentElement.style.setProperty('--ps',(1/s).toFixed(3))}catch(e){}i.dataset.ps=(1/s).toFixed(3);i.style.width=W+'px';i.style.height=Math.floor(ah/s)+'px';i.style.transform=`scale(${s})`;f.style.width=Math.floor(W*s)+'px';f.style.height=Math.floor(ah)+'px'})}
const PIN_CSS=`.noon-pin{position:absolute;z-index:2147483000;min-width:26px;height:26px;margin:-13px 0 0 -13px;transform:scale(var(--ps,1));padding:0 6px;border-radius:13px;background:#22242a;color:#fff;font:600 12px/26px -apple-system,'Segoe UI',Roboto,sans-serif;text-align:center;box-shadow:0 0 0 3px #fff,0 6px 14px rgba(0,0,0,.25);cursor:pointer;transition:transform .15s;user-select:none}
.noon-pin:hover{transform:scale(calc(var(--ps,1)*1.12))}.noon-pin.on{transform:scale(calc(var(--ps,1)*1.25))}.noon-pin.new{background:#fff;color:#22242a;box-shadow:0 0 0 2px #22242a,0 6px 14px rgba(0,0,0,.25)}
.noon-hl{outline:2px solid #22242a!important;outline-offset:4px;border-radius:4px}
html.noon-cm,html.noon-cm *{cursor:crosshair!important}html.noon-cm .noon-pin{cursor:pointer!important}`;
function cssPath(el){const parts=[];while(el&&el.nodeType===1&&el.tagName!=='BODY'&&el.tagName!=='HTML'){if(el.id){parts.unshift('#'+el.id);return parts.join('>')}
  let i=1,s=el;while((s=s.previousElementSibling))i++;parts.unshift(el.tagName.toLowerCase()+':nth-child('+i+')');el=el.parentElement}return 'body>'+parts.join('>')}
function setupFrame(f,p){const d=f.contentDocument;if(!d)return;
  const st=d.createElement('style');st.textContent=PIN_CSS;d.head.appendChild(st);d.documentElement.style.setProperty('--ps',f.dataset.ps||1);
  d.addEventListener('click',e=>onFrameClick(e,f,p),true);
  f.contentWindow.addEventListener('resize',()=>placePins(f));
  f.contentWindow.addEventListener('scroll',()=>syncScroll(f));
  d.addEventListener('keydown',onKey);
  placePins(f);
}
let syncing=false;
function syncScroll(f){if(S.mode!=='compare'||syncing)return;const o=$$('#stage iframe').find(x=>x!==f);if(!o)return;syncing=true;o.contentWindow.scrollTo(0,f.contentWindow.scrollY);setTimeout(()=>syncing=false,30)}
function placeAllPins(){$$('#stage iframe').forEach(placePins)}
function placePins(f){const d=f.contentDocument;if(!d||!d.body)return;const w=f.contentWindow;
  $$('.noon-pin',d).forEach(x=>x.remove());$$('.noon-hl',d).forEach(x=>x.classList.remove('noon-hl'));
  d.documentElement.classList.toggle('noon-cm',S.mode==='comment');
  const R=route(),ver=+f.dataset.ver,list=cmFor(R.id,ver).filter(c=>c.layer===S.layer&&c.sel&&(c.open||(S.showRes&&ver===R.ver)));
  const put=(c,label,cls)=>{const el=d.querySelector(c.sel);if(!el)return;const r=el.getBoundingClientRect();
    const pin=d.createElement('div');pin.className='noon-pin '+cls;pin.textContent=label;pin.dataset.n=c.n;
    pin.style.left=(r.left+w.scrollX+r.width*c.x)+'px';pin.style.top=(r.top+w.scrollY+r.height*c.y)+'px';d.body.appendChild(pin);return el};
  list.forEach(c=>{const el=put(c,(S.layer==='client'?'C':'')+c.n,S.active===c.n?'on':'');if(S.active===c.n&&el&&f.dataset.side==='b')el.classList.add('noon-hl')});
  if(S.pending&&f.dataset.side==='b')put(S.pending,'+','new');
}
function onFrameClick(e,f,p){const pin=e.target.closest('.noon-pin');
  if(pin){e.preventDefault();e.stopPropagation();if(pin.dataset.n)selectComment(+pin.dataset.n,false);return}
  const a=e.target.closest('a');
  if(S.mode!=='comment'||f.dataset.side!=='b'){if(a&&!(S.mode==='browse'&&a.getAttribute('href')?.startsWith('#')))e.preventDefault();return}
  e.preventDefault();e.stopPropagation();
  const el=e.target,r=el.getBoundingClientRect();
  S.pending={sel:cssPath(el),x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};S.rail='comments';S.active=null;
  const R=route();renderRail(p,R);placeAllPins();$('#cmText')?.focus();
}
function glide(w,y){const s0=w.scrollY,t0=performance.now();const step=()=>{const k=Math.min(1,(performance.now()-t0)/320),e=1-Math.pow(1-k,3);w.scrollTo(0,s0+(y-s0)*e);if(k<1)setTimeout(step,16)};step()}
function selectComment(n,scroll=true){S.active=S.active===n&&scroll?null:n;const R=route(),p=page(R.id);renderRail(p,R);placeAllPins();
  const f=$('#stage iframe[data-side=b]');if(f&&S.active!=null){const pin=$(`.noon-pin[data-n="${n}"]`,f.contentDocument);if(pin)glide(f.contentWindow,Math.max(0,parseFloat(pin.style.top)-160))}
  if(!scroll){$('.cm.on')?.scrollIntoView({block:'nearest',behavior:'smooth'})}}

/* ---------- right rail ---------- */
function renderRail(p,R){const el=$('#rail');if(!el)return;
  if(R.name==='review'&&typeof guestRail==='function'){guestRail(p,R,el);return}
  if(R.tab==='copy'&&R.sub&&typeof copyRail==='function'){copyRail(p,R,el);return}
  if(R.tab==='ads'&&R.sub&&typeof adsRail==='function'){adsRail(p,R,el);return}
  const viewing=R.tab==='design'&&R.ver;const mode=viewing?S.rail:'details';
  el.innerHTML=mode==='comments'?commentsRail(p,R):(viewing?`<div class="rail-top"><button class="btn btn-ghost btn-sm" data-act="rail" data-r="comments" style="margin-left:-6px">${ic('back',14)}Comments <span class="num">${cmFor(p.id,R.ver).filter(c=>c.open).length}</span></button></div>`:'')+`<div class="rail-scroll">${detailsRail(p)}</div>`;
  const t=$('#cmText');if(t){t.oninput=()=>{S.draft=t.value};t.onkeydown=e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();postComment()}}}
  const ri=$('#repIn');if(ri){ri.focus();ri.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();postReply()}}}
}
function detailsRail(p){const c=client(p.client);
  return `<div class="slbl" style="margin-top:4px">Details</div><dl class="attrs">
   <dt>Status</dt><dd>${stIcon(p)}${ST[statusOf(p)]}</dd>
   <dt>Project</dt><dd><button class="ed" data-act="dMove">${tile(c.id)}${esc(c.name)}</button></dd>
   <dt>Folder</dt><dd><button class="ed" data-act="dMove">${p.folder?ic('folder',15)+esc(p.folder):'<span class="muted">None</span>'}</button></dd>
   <dt>Page type</dt><dd><button class="ed" data-act="dType">${p.types.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</button></dd>
   <dt>Style</dt><dd><button class="ed" data-act="dStyle"><span class="tag">${esc(p.style)}</span></button></dd>
   <dt>Deadline</dt><dd><button class="ed" data-act="dDue">${p.due?cellDue(p):'<span class="muted">Add a deadline</span>'}</button></dd>
   <dt>Assigned</dt><dd><button class="ed" data-act="dTo"><span class="who-list">${p.to.map(x=>`<span>${av(x)}${P[x].short}</span>`).join('')||'<span class="muted">Nobody yet</span>'}</span></button></dd>
   <dt>Review link</dt><dd><button class="ed" data-act="share" aria-haspopup="dialog"><span class="sw ${p.share?'on':''}" aria-hidden="true"></span>${p.share?'On':'<span class="muted">Off</span>'}</button></dd>
   <dt>Final copy</dt><dd>${p.copy.final?`<span class="v" style="color:var(--ink)">v${p.copy.final}</span><span style="color:var(--green)">${ic('check',15)}</span>`:'<span class="dash">Not yet</span>'}</dd>
   <dt>Final design</dt><dd>${p.design.final?`<span class="v" style="color:var(--ink)">v${p.design.final}</span><span style="color:var(--green)">${ic('check',15)}</span>`:'<span class="dash">Not yet</span>'}</dd>
  </dl>
  <div class="slbl">Project categories</div><div class="tags">${c.cats.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
  <div class="slbl">History</div><dl class="attrs" style="margin-top:0">
   <dt>Created</dt><dd>${p.created} · ${P[p.creator].short}</dd>
   <dt>Last change</dt><dd>${ago(p.at)} · ${P[p.by].short}</dd></dl>`}
function commentsRail(p,R){
  const all=cmFor(p.id,R.ver),L=all.filter(c=>c.layer===S.layer),open=L.filter(c=>c.open),res=L.filter(c=>!c.open);
  const nT=all.filter(c=>c.layer==='team'&&c.open).length,nC=all.filter(c=>c.layer==='client'&&c.open).length;
  const card=c=>{const who=c.by==='guest'?c.guest:P[c.by].short;const lab=(S.layer==='client'?'C':'')+c.n;
    return `<div class="cm ${S.active===c.n?'on':''} ${c.open?'':'res'}" data-act="cm" data-n="${c.n}" tabindex="0">
      <div class="cm-top"><span class="pn ${c.sel?'':'gen'}">${lab}</span>${c.by==='guest'?`<span class="av guest">${c.guest.split(' ').map(w=>w[0]).slice(-2).join('')}</span>`:av(c.by)}<b>${esc(who)}</b><span class="t">${c.at}</span><span class="sp"></span>${c.toMe&&c.open?'<span class="tag hi">For you</span>':''}${c.open?'':`<span style="color:var(--green)" title="Resolved">${ic('check',15)}</span>`}</div>
      <p>${esc(c.text)}</p>
      ${c.rep.map(r=>`<div class="rep">${av(r.by)}<div><div class="who">${P[r.by].short} · ${r.at}</div>${esc(r.text)}</div></div>`).join('')}
      ${S.replyTo===c.n?`<div class="rinput"><input id="repIn" placeholder="Reply…" aria-label="Reply"><button class="btn btn-ink btn-sm" data-act="sendReply">Send</button></div>`:''}
      <div class="cm-act"><button class="btn btn-ghost btn-sm" data-act="reply" data-n="${c.n}">${ic('reply',14)}Reply</button><span class="sp"></span>${c.open?`<button class="btn btn-line btn-sm" data-act="resolve" data-n="${c.n}">${ic('check',14)}Resolve</button>`:`<button class="btn btn-ghost btn-sm" data-act="reopen" data-n="${c.n}">Reopen</button>`}</div></div>`};
  return `<div class="rail-top"><div class="seg" style="flex:1;display:flex"><button style="flex:1" class="${S.layer==='team'?'on':''}" data-act="layer" data-l="team" aria-pressed="${S.layer==='team'}">Team <span class="num">${nT}</span></button><button style="flex:1" class="${S.layer==='client'?'on':''}" data-act="layer" data-l="client" aria-pressed="${S.layer==='client'}">Review link <span class="num">${nC}</span></button></div><button class="ib" data-act="rail" data-r="details" title="Page details" aria-label="Page details">${ic('panel',18)}</button></div>
  <div class="rail-scroll">
   ${S.layer==='client'?'<div class="note">Only people on the review link see these comments, and they see your replies here.</div>':''}
   ${open.length?`<div class="cmts">${open.map(card).join('')}</div>`:`<div class="empty" style="padding:40px 8px"><h3 class="disp" style="font-size:22px;line-height:28px">All <span class="mk">clear</span></h3><p>No open comments on this version.</p></div>`}
   ${res.length?`<button class="resb" data-act="showRes" aria-expanded="${S.showRes}">${S.showRes?'Hide':'Show'} resolved <span class="num">${res.length}</span></button>${S.showRes?`<div class="cmts" style="margin-top:8px">${res.map(card).join('')}</div>`:''}`:''}
  </div>
  <div class="compose">
    ${S.pending?`<div class="pend"><span class="pn">+</span>Pin placed on the page<span class="sp"></span><button class="ib sm" data-act="unpin" aria-label="Remove pin">${ic('x',14)}</button></div>`:S.mode==='comment'?'<div class="pend">Click the page to pin a comment, or write a general one.</div>':''}
    <textarea id="cmText" placeholder="${S.layer==='client'?'Write on the review link…':'Write a comment…'}" aria-label="New comment">${esc(S.draft||'')}</textarea>
    <div class="row"><span class="pend"><kbd>Ctrl</kbd><kbd>↵</kbd></span><span class="sp"></span><button class="btn btn-ink btn-sm" data-act="post">Post</button></div>
  </div>`}
function postComment(){const R=route(),p=page(R.id),t=($('#cmText')?.value||'').trim();if(!t){$('#cmText')?.focus();return}
  const list=cmFor(p.id,R.ver),n=Math.max(0,...list.filter(c=>c.layer===S.layer).map(c=>c.n))+1;
  const c={n,layer:S.layer,by:'me',at:'Just now',open:true,text:t,rep:[],...(S.pending||{sel:null,x:0,y:0})};
  list.push(c);S.pending=null;S.draft='';S.active=n;syncCounts(p);p.at=0;p.by='me';
  renderRail(p,R);placeAllPins();toast(`Comment ${(S.layer==='client'?'C':'#')+n} posted`,()=>{list.splice(list.indexOf(c),1);syncCounts(p)})}
function postReply(){const R=route(),p=page(R.id),t=($('#repIn')?.value||'').trim();if(!t)return;
  const c=cmFor(p.id,R.ver).find(x=>x.layer===S.layer&&x.n===S.replyTo);c.rep.push({by:'me',at:'Just now',text:t});S.replyTo=null;renderRail(p,R)}

/* ---------- stubs ---------- */
function renderStub(name){const m=$('#main');m.dataset.view=name;
  const T={inbox:'Inbox',tasks:'Tasks',team:'Team',settings:'Settings'}[name]||'This screen';
  m.innerHTML=`<div class="top"><div class="crumbs"><span class="cur">${T}</span></div></div>
  <div class="empty" style="flex:1"><h2 class="disp"><span class="mk">${T}</span> comes in a later round</h2><p>The other screens are in the mockup already. This screen gets the same treatment once those are approved.</p><a class="btn btn-ink" href="#projects">Back to Projects</a></div>`}

/* ============ palette ============ */
let PAL=null;
function openPalette(){closeMenu();if(PAL){closePalette();return}
  const o=document.createElement('div');o.className='ovl';o.innerHTML=`<div class="pal" role="dialog" aria-modal="true" aria-label="Search and actions">
    <div class="pal-in">${ic('search',18)}<input id="palQ" placeholder="Search pages, projects and people, or type a command" autocomplete="off" aria-label="Search"><kbd>esc</kbd></div>
    <div class="pal-l" id="palL" role="listbox"></div>
    <div class="pal-f"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div></div>`;
  $('#layer').appendChild(o);PAL={el:o,i:0,items:[]};
  o.addEventListener('mousedown',e=>{if(e.target===o)closePalette()});
  const q=$('#palQ');q.oninput=()=>{PAL.i=0;drawPal()};q.onkeydown=e=>{
    if(e.key==='ArrowDown'){e.preventDefault();PAL.i=Math.min(PAL.items.length-1,PAL.i+1);drawPal(true)}
    else if(e.key==='ArrowUp'){e.preventDefault();PAL.i=Math.max(0,PAL.i-1);drawPal(true)}
    else if(e.key==='Enter'){e.preventDefault();const it=PAL.items[PAL.i];if(it){closePalette();it.run()}}
    else if(e.key==='Escape'){e.preventDefault();closePalette()}};
  drawPal();q.focus();
}
function closePalette(){PAL?.el.remove();PAL=null}
function drawPal(keepScroll){const q=$('#palQ').value.trim(),lq=q.toLowerCase(),m=s=>!lq||s.toLowerCase().includes(lq);const R=route();
  const items=[];
  PAGES.filter(p=>m(p.name)).slice(0,lq?8:5).forEach(p=>items.push({sec:'Pages',html:`${ic('pages',16)}<span class="ml">${hl(p.name,q)}</span><span class="mm">${esc(client(p.client).name)}</span>${needsMe(p)?'<span class="tag hi">Needs you</span>':''}`,run:()=>go(`#page/${p.id}/design`)}));
  CLIENTS.filter(c=>m(c.name)).forEach(c=>items.push({sec:'Projects',html:`${tile(c.id)}<span class="ml">${hl(c.name,q)}</span><span class="mm">${PAGES.filter(p=>p.client===c.id).length} pages</span>`,run:()=>setClient(c.id)}));
  Object.values(P).filter(u=>m(u.name)).forEach(u=>items.push({sec:'People',html:`${av(u.id)}<span class="ml">${hl(u.name,q)}</span><span class="mm">${u.city}</span>`,run:()=>{S.f.to=[u.id];S.view='all';go('#projects')}}));
  const acts=[{t:'New page',k:'N',run:openNewPage},{t:'New task',run:()=>{go('#tasks');setTimeout(()=>ACT.newTask&&ACT.newTask(),50)}},{t:'Go to Projects',run:()=>go('#projects')},{t:'Go to Inbox',run:()=>go('#inbox')},{t:'Go to Tasks',run:()=>go('#tasks')},{t:'Go to Team',run:()=>go('#team')},{t:'Go to Settings',run:()=>go('#settings')},{t:'Preview the sign-in screen',run:()=>go('#signin')},{t:(S.col?'Expand':'Collapse')+' sidebar',k:'[',run:toggleSide}];
  if(R.name==='page'){acts.unshift({t:'Upload design version',k:'U',run:uploadVersion},{t:'Share for review',k:'S',run:()=>openShare($('.top [data-act=share]'))})}
  acts.filter(a=>m(a.t)).forEach(a=>items.push({sec:'Actions',html:`${ic('bolt',16)}<span class="ml">${hl(a.t,q)}</span>${a.k?`<kbd>${a.k}</kbd>`:''}`,run:a.run}));
  PAL.items=items;let last='';
  $('#palL').innerHTML=items.length?items.map((it,i)=>{const h=it.sec!==last?`<div class="mhead">${it.sec}</div>`:'';last=it.sec;return h+`<button class="mi ${i===PAL.i?'kb':''}" data-i="${i}" role="option" aria-selected="${i===PAL.i}">${it.html}</button>`}).join(''):`<div class="empty" style="padding:28px"><p>Nothing found for “${esc(q)}”.</p></div>`;
  $$('#palL .mi').forEach(b=>{b.onmousemove=()=>{if(PAL.i!==+b.dataset.i){PAL.i=+b.dataset.i;$$('#palL .mi').forEach(x=>x.classList.toggle('kb',x===b))}};b.onclick=()=>{const it=PAL.items[+b.dataset.i];closePalette();it.run()}});
  if(keepScroll)$('#palL .mi.kb')?.scrollIntoView({block:'nearest'});
}

/* ============ generic dialog ============ */
function openDlg(html,mount,{wide=false}={}){closeMenu();closeDlg();const o=document.createElement('div');o.className='ovl';o.id='dlg';
  o.innerHTML=`<div class="dlg ${wide?'wide':''}" role="dialog" aria-modal="true">${html}</div>`;$('#layer').appendChild(o);
  o.addEventListener('mousedown',e=>{if(e.target===o)closeDlg()});mount&&mount(o);return o}
function closeDlg(){$('#dlg')?.remove()}

/* ============ new page dialog ============ */
let NP=null;
function openNewPage(opt={}){closeMenu();closeDlg();const cx=ctx();NP={client:opt.client||cx?.id||S.f.client[0]||CLIENTS[0].id,folder:opt.folder||(!opt.client&&cx?cx.folder:null)||null,type:'Advertorial',to:['me']};
  const o=document.createElement('div');o.className='ovl';o.id='npDlg';$('#layer').appendChild(o);o.addEventListener('mousedown',e=>{if(e.target===o)closeNewPage()});drawNewPage();$('#npName').focus()}
function drawNewPage(){const o=$('#npDlg');if(!o)return;const name=$('#npName')?.value||'';
  o.innerHTML=`<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="npT"><div class="dlg-h"><b id="npT">New page</b><button class="ib" data-act="npClose" aria-label="Close">${ic('x',18)}</button></div>
  <div class="dlg-b"><label class="fld"><span>Name</span><input id="npName" value="${esc(name)}" placeholder="e.g. Spring sale advertorial"></label>
  <div class="fld2"><div class="fld"><span>Project</span><button class="selb" data-act="npClient" aria-haspopup="menu">${tile(NP.client)}<span class="selt">${esc(client(NP.client).name)}</span><span class="sp"></span>${ic('down',14)}</button></div>
  <div class="fld"><span>Folder</span><button class="selb" data-act="npFolder" aria-haspopup="menu">${NP.folder?ic('folder',15)+`<span class="selt">${esc(NP.folder)}</span>`:'<span class="dash">No folder</span>'}<span class="sp"></span>${ic('down',14)}</button></div></div>
  <div class="fld"><span>Page type</span><button class="selb" data-act="npType" aria-haspopup="menu"><span class="tag">${esc(NP.type)}</span><span class="sp"></span>${ic('down',14)}</button></div>
  <div class="fld"><span>Assigned</span><button class="selb" data-act="npTo" aria-haspopup="menu">${avs(NP.to)}<span>${NP.to.map(x=>P[x].short).join(', ')||'Nobody yet'}</span><span class="sp"></span>${ic('down',14)}</button></div></div>
  <div class="dlg-f"><button class="btn btn-line" data-act="npClose">Cancel</button><button class="btn btn-ink" data-act="npCreate">Create page</button></div></div>`;
  $('#npName').onkeydown=e=>{if(e.key==='Enter')createPage()}}
function closeNewPage(){$('#npDlg')?.remove();NP=null}
function createPage(){const name=($('#npName').value||'').trim();if(!name){$('#npName').focus();return}
  const u=snap();const id='n'+Date.now().toString(36);
  const back=location.hash;
  PAGES.push({id,name,client:NP.client,folder:NP.folder,types:[NP.type],style:'Editorial',copy:{n:0,final:0,open:0},design:{n:0,final:0,open:0},ads:null,to:NP.to.slice(),due:null,at:0,by:'me',star:false,share:false,created:'Nov 13',creator:'me',head:name,sub:''});
  closeNewPage();go(`#page/${id}/copy`);toast(`Created “${name}”`,()=>{u();go(back)})}

/* ============ share popover ============ */
function openShare(anchor){if(!anchor)return;const R=route(),p=page(R.id);if(!p)return;const isCopy=R.tab==='copy';const vs=isCopy?copyVers(p):designVers(p);const n=anchor.dataset.n?+anchor.dataset.n:(R.ver||vs.at(-1)?.n);
  if(!n){toast(isCopy?'Write or upload copy first':'Upload a design version first');return}
  const kind=isCopy?'copy':'design';
  openMenu(anchor,null,{html:()=>`<div class="pop"><h3>${ic('link',16)}Review link · ${isCopy?'Copy':'Design'} <span class="v" style="color:var(--ink)">v${n||1}</span></h3>
    <p>Anyone with the link can view this version and comment. They only see review-link comments.</p>
    <div class="linkbox" style="align-items:center"><button class="ed" data-act="shareToggle" style="margin:0"><span class="sw ${p.share?'on':''}"></span>${p.share?'Link is on':'Link is off'}</button></div>
    ${p.share?`<div class="linkbox"><input readonly value="noon.app/r/${p.id}-v${n||1}-7f3k" aria-label="Review link"><button class="btn btn-ink btn-sm" style="height:34px" data-act="copyLink">Copy link</button></div><a class="btn btn-ghost btn-sm" style="margin-top:8px;margin-left:-8px" href="#review/${p.id}/${kind}/v${n}">${ic('open',14)}See what reviewers see</a>`:''}</div>`});
}

/* ============ actions ============ */
function setClient(id,folder=null){S.view='all';S.peek=null;S.open.add(id);go(clientHash(id,folder))}
function toggleSide(){S.col=!S.col;localStorage.setItem('noonr.col',S.col?'1':'0');render(true);setTimeout(()=>{layoutFrames();peekThumbs();RESIZE.forEach(f=>f())},220)}
function uploadVersion(){const R=route(),p=page(R.id);if(!p)return;
  if(R.tab==='copy'){copyUpload(p);return}
  if(R.tab==='ads'){adsUpload(p);return}
  const u=snap();const vs=designVers(p);const n=(vs.at(-1)?.n||0)+1;
  if(DV[p.id])DV[p.id].push({n,file:'v2.html',at:0,by:'me'});
  if(CM[p.id])CM[p.id][n]=[];
  p.design.n=n;p.design.open=0;p.at=0;p.by='me';
  if(R.tab!=='design'||R.ver)go(`#page/${p.id}/design`);else render();
  toast(`Design v${n} uploaded`,u)}
function pickFrom(list,cur,set,{multi=false,fmt}={}){return()=>list.map(x=>({check:true,on:multi?cur().includes(x.id):cur()===x.id,pre:x.pre||'',label:esc(x.label),meta:x.meta,pick:()=>set(x.id)}))}
const peopleList=()=>Object.values(P).map(u=>({id:u.id,label:u.name,pre:av(u.id),meta:u.city}));
const clientList=()=>CLIENTS.map(c=>({id:c.id,label:c.name,pre:tile(c.id),meta:c.cats.join(' · ')}));
function moveMenu(anchor,ids){openMenu(anchor,()=>CLIENTS.flatMap(c=>[{label:esc(c.name),pre:tile(c.id),pick:()=>doMove(ids,c.id,null)},...c.folders.map(f=>({label:esc(f),sub:true,pre:ic('folder',15),pick:()=>doMove(ids,c.id,f)}))]))}
function doMove(ids,cid,f){const u=snap();ids.forEach(id=>{const p=page(id);p.client=cid;p.folder=f;p.at=0;p.by='me'});
  toast(`Moved ${ids.length>1?ids.length+' pages':'“'+page(ids[0]).name+'”'} to ${client(cid).name}${f?' / '+f:''}`,u)}

const ACT={
  collapse:toggleSide,palette:openPalette,
  teamMenu:a=>openMenu(a,()=>[{head:'Teams'},{label:'My team',check:true,on:true,pre:`<span class="logo" style="width:20px;height:20px;border-radius:6px">${sun}</span>`,meta:'3 people'},{sep:1},{label:'Invite people',pre:ic('plus',15),pick:()=>toast('Invites live in Settings › Teams')}]),
  allPages:()=>{S.f.client=[];S.view='all';S.peek=null;go('#projects')},
  newPageIn:a=>openNewPage({client:a.dataset.c,folder:a.dataset.f||null}),
  sideOpen:a=>{const id=a.dataset.c;S.open.has(id)?S.open.delete(id):S.open.add(id);render(true)},
  newClient:()=>toast('New project'),
  views:a=>openMenu(a,()=>Object.entries(VIEWS).map(([k,l])=>{const n=visible(k).length;return{check:true,on:S.view===k,label:l,meta:k==='needs'?`<span class="tag hi"><span class="num">${n}</span></span>`:`<span class="num">${n}</span>`,pick:()=>{S.view=k;S.peek=null}}})),
  view:a=>{S.view=a.dataset.v;S.peek=null;render()},
  fpill:a=>{const k=a.dataset.k;const src={client:clientList(),type:TYPES.map(t=>({id:t,label:t})),to:peopleList(),style:STYLES.map(t=>({id:t,label:t})),aud:['B2B','DTC'].map(t=>({id:t,label:t})),st:Object.keys(ST).map(k=>({id:k,label:ST[k],pre:stSvg(k)}))}[k];
    openMenu(a,pickFrom(src,()=>S.f[k],id=>{const v=S.f[k];v.includes(id)?v.splice(v.indexOf(id),1):v.push(id)},{multi:true}),{multi:true})},
  fclear:a=>{const k=a.dataset.k;S.f[k]=[];S.extra=S.extra.filter(x=>x!==k);render()},
  addFilter:a=>openMenu(a,()=>[['st','Status'],['style','Style'],['aud','Audience']].filter(([k])=>!S.extra.includes(k)).map(([k,l])=>({label:l,pre:ic('filter',15),meta:k==='aud'?'from the project':'',pick:()=>{S.extra.push(k);setTimeout(()=>$(`[data-act=fpill][data-k=${k}]`)?.click(),0)}}))),
  clearAll:()=>{S.f={client:[],type:[],to:[],style:[],aud:[],st:[],folder:null};S.extra=[];S.q='';S.view='all';render()},
  sort:a=>openMenu(a,()=>[['change','Last change'],['due','Deadline'],['name','Name']].map(([k,l])=>({check:true,on:S.sort===k,label:l,pick:()=>S.sort=k}))),
  sortBy:a=>{S.sort=a.dataset.s;render()},
  group:a=>openMenu(a,()=>[{check:true,on:S.group,label:'Project',pick:()=>S.group=true},{check:true,on:!S.group,label:'None',pick:()=>S.group=false},...(S.group&&!ctx()?[{sep:1},{label:'Expand all projects',pre:ic('down',15),pick:()=>S.closed.clear()},{label:'Collapse all projects',pre:ic('right',15),pick:()=>CLIENTS.forEach(c=>S.closed.add(c.id))}]:[])]),
  gtoggle:a=>{const c=a.dataset.c;S.closed.has(c)?S.closed.delete(c):S.closed.add(c);render()},
  row:a=>{const id=a.dataset.id;S.peek=S.peek===id?null:id;render()},
  sel:(a,e)=>{e.stopPropagation();const id=a.dataset.id;S.sel.has(id)?S.sel.delete(id):S.sel.add(id);render()},
  selAll:()=>{const rows=ordered();const all=rows.every(p=>S.sel.has(p.id));rows.forEach(p=>all?S.sel.delete(p.id):S.sel.add(p.id));render()},
  bClear:()=>{S.sel.clear();render()},
  bMove:a=>moveMenu(a,[...S.sel]),
  bAssign:a=>openMenu(a,()=>peopleList().map(u=>({label:esc(u.label),pre:u.pre,meta:u.meta,pick:()=>{const s=snap(),ids=[...S.sel];ids.forEach(id=>{const p=page(id);if(!p.to.includes(u.id))p.to.push(u.id)});toast(`Assigned ${P[u.id].short} to ${ids.length} page${ids.length>1?'s':''}`,s)}}))),
  bFinal:()=>{const u=snap(),ids=[...S.sel];ids.forEach(id=>{const p=page(id);if(p.copy.n){p.copy.final=p.copy.n;p.copy.open=0}if(p.design.n){p.design.final=p.design.n;p.design.open=0}});render();toast(`Marked ${ids.length} page${ids.length>1?'s':''} final`,u)},
  bDelete:()=>{const u=snap(),ids=[...S.sel];PAGES=PAGES.filter(p=>!ids.includes(p.id));S.sel.clear();if(ids.includes(S.peek))S.peek=null;render();toast(`Deleted ${ids.length} page${ids.length>1?'s':''}`,u)},
  pkClose:()=>{S.peek=null;render()},
  pkPrev:()=>stepPeek(-1),pkNext:()=>stepPeek(1),
  star:a=>{const p=page(a.dataset.id);p.star=!p.star;render(true);toast(p.star?'Added to Favorites':'Removed from Favorites',()=>{p.star=!p.star})},
  newPage:()=>openNewPage(),npClose:closeNewPage,npCreate:createPage,
  npFolder:a=>{const c=client(NP.client);openMenu(a,()=>[{check:true,on:!NP.folder,label:'No folder',pick:()=>{NP.folder=null;setTimeout(drawNewPage)}},...(c.folders.length?[{sep:1}]:[]),...c.folders.map(f=>({check:true,on:NP.folder===f,pre:ic('folder',15),label:esc(f),pick:()=>{NP.folder=f;setTimeout(drawNewPage)}}))])},
  npClient:a=>openMenu(a,pickFrom(clientList(),()=>NP.client,id=>{if(NP.client!==id)NP.folder=null;NP.client=id;setTimeout(drawNewPage)})),
  npType:a=>openMenu(a,pickFrom(TYPES.map(t=>({id:t,label:t})),()=>NP.type,id=>{NP.type=id;setTimeout(drawNewPage)})),
  npTo:a=>openMenu(a,pickFrom(peopleList(),()=>NP.to,id=>{NP.to.includes(id)?NP.to.splice(NP.to.indexOf(id),1):NP.to.push(id);setTimeout(drawNewPage)},{multi:true}),{multi:true,onClose:drawNewPage}),
  share:a=>openShare(a),
  shareToggle:()=>{const p=page(route().id);p.share=!p.share;MENU?.draw();render(true)},
  copyLink:()=>{closeMenu();toast('Review link copied')},
  upload:uploadVersion,
  pageMore:a=>{const p=page(route().id);openMenu(a,()=>[{label:'Copy page link',pre:ic('link',15),pick:()=>toast('Page link copied')},{label:'Move to…',pre:ic('folder',15),close:true,pick:()=>setTimeout(()=>moveMenu($('.top [data-act=pageMore]'),[p.id]))},{sep:1},{label:'Delete page',danger:true,pre:ic('trash',15),pick:()=>{const u=snap();PAGES=PAGES.filter(x=>x!==p);go(clientHash(p.client,p.folder));toast(`Deleted “${p.name}”`,()=>{u();go(`#page/${p.id}/design`)})}}])},
  openVer:a=>{const p=page(route().id);go(`#page/${p.id}/design/v${a.dataset.n}`)},
  vFinal:(a,e)=>{e.stopPropagation();const p=page(route().id),n=+a.dataset.n,u=snap();p.design.final=p.design.final===n?0:n;p.at=0;p.by='me';render(true);if(route().ver)refreshViewerBar(p,route());toast(p.design.final?`Design v${n} marked final`:`Design v${n} is no longer final`,u)},
  vMore:(a,e)=>{e.stopPropagation();const p=page(route().id),n=+a.dataset.n,vs=designVers(p);openMenu(a,()=>[{label:'Download',pre:ic('download',15),pick:()=>toast(`Downloading design v${n}`)},...(vs.length>1?[{label:'Compare with…',pre:ic('compare',15),pick:()=>{S.mode='compare';S.cmp=vs.find(v=>v.n!==n).n;go(`#page/${p.id}/design/v${Math.max(n,S.cmp)}`)}}]:[]),{sep:1},{label:'Delete version',danger:true,pre:ic('trash',15),pick:()=>toast('Deleting versions is off in the mockup')}])},
  cmpLatest:()=>{const p=page(route().id),vs=designVers(p);S.mode='compare';S.cmp=vs.at(-2).n;go(`#page/${p.id}/design/v${vs.at(-1).n}`)},
  verMenu:a=>{const R=route(),p=page(R.id),vs=designVers(p);openMenu(a,()=>[...vs.slice().reverse().map(v=>({check:true,on:v.n===R.ver,label:`Design <span class="v" style="color:inherit">v${v.n}</span>`,meta:`${ago(v.at)} · ${P[v.by].short}`,pick:()=>go(`#page/${p.id}/design/v${v.n}`)})),{sep:1},
    ...(vs.length>1?[{label:'Compare with…',pre:ic('compare',15),pick:()=>{S.mode='compare';S.cmp=vs.find(v=>v.n!==R.ver).n;render()}}]:[]),{label:'Upload new version',pre:ic('upload',15),pick:uploadVersion}])},
  dev:a=>{S.dev=a.dataset.d;const R=route();refreshViewerBar(page(R.id),R);layoutFrames()},
  mode:a=>{const R=route(),p=page(R.id),vs=designVers(p);const m=a.dataset.m;
    if(m==='compare'){if(vs.length<2){toast('Compare needs two versions');return}S.cmp=S.cmp&&S.cmp!==R.ver?S.cmp:vs.filter(v=>v.n!==R.ver).at(-1).n;S.pending=null}
    const rebuild=(S.mode==='compare')!==(m==='compare');S.mode=m;
    if(rebuild)renderPage(R);else{refreshViewerBar(p,R);placeAllPins();renderRail(p,R)}},
  rail:a=>{S.rail=a.dataset.r;const R=route();renderRail(page(R.id),R)},
  layer:a=>{S.layer=a.dataset.l;S.active=null;S.pending=null;const R=route();renderRail(page(R.id),R);placeAllPins()},
  cm:(a,e)=>{if(e.target.closest('input,textarea'))return;selectComment(+a.dataset.n)},
  reply:(a,e)=>{e.stopPropagation();S.replyTo=S.replyTo===+a.dataset.n?null:+a.dataset.n;const R=route();renderRail(page(R.id),R)},
  sendReply:(a,e)=>{e.stopPropagation();postReply()},
  resolve:(a,e)=>{e.stopPropagation();const R=route(),p=page(R.id),c=cmFor(p.id,R.ver).find(x=>x.layer===S.layer&&x.n===+a.dataset.n);c.open=false;if(S.active===c.n)S.active=null;syncCounts(p);renderRail(p,R);placeAllPins();
    toast(`Resolved ${(S.layer==='client'?'C':'#')+c.n}`,()=>{c.open=true;syncCounts(p)})},
  reopen:(a,e)=>{e.stopPropagation();const R=route(),p=page(R.id),c=cmFor(p.id,R.ver).find(x=>x.layer===S.layer&&x.n===+a.dataset.n);c.open=true;syncCounts(p);renderRail(p,R);placeAllPins()},
  showRes:()=>{S.showRes=!S.showRes;const R=route();renderRail(page(R.id),R);placeAllPins()},
  post:postComment,
  unpin:()=>{S.pending=null;const R=route();renderRail(page(R.id),R);placeAllPins()},
  dMove:a=>moveMenu(a,[route().id]),
  dType:a=>{const p=page(route().id);openMenu(a,pickFrom(TYPES.map(t=>({id:t,label:t})),()=>p.types,id=>{if(p.types.includes(id)){if(p.types.length>1)p.types.splice(p.types.indexOf(id),1)}else p.types.push(id)},{multi:true}),{multi:true})},
  dStyle:a=>{const p=page(route().id);openMenu(a,pickFrom(STYLES.map(t=>({id:t,label:t})),()=>p.style,id=>p.style=id))},
  dDue:a=>{const p=page(route().id);const d=n=>{const x=new Date(TODAY);x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
    openMenu(a,()=>[['Today',0],['Tomorrow',1],['In 3 days',3],['Next week',7],['In two weeks',14]].map(([l,n])=>({label:l,meta:fmtDate(d(n)),check:true,on:p.due===d(n),pick:()=>{const u=snap();p.due=d(n);toast(`Deadline set to ${fmtDate(p.due)}`,u)}})).concat(p.due?[{sep:1},{label:'Clear deadline',danger:true,pick:()=>{const u=snap();p.due=null;toast('Deadline cleared',u)}}]:[]))},
  dTo:a=>{const p=page(route().id);openMenu(a,pickFrom(peopleList(),()=>p.to,id=>{p.to.includes(id)?p.to.splice(p.to.indexOf(id),1):p.to.push(id)},{multi:true}),{multi:true})},
  noop:()=>{},
  viewMine:()=>{S.view='mine';S.f.client=[];S.peek=null;go('#projects')},
  mineDone:()=>{S.mineDone=!S.mineDone;render(true)},
  dlgClose:closeDlg,
};
function stepPeek(d){const L=ordered(),i=L.findIndex(p=>p.id===S.peek);const n=L[i+d];if(n){S.peek=n.id;render();$(`.tr[data-id="${n.id}"]`)?.scrollIntoView({block:'nearest'})}}

document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(!a||a.disabled)return;
  const f=ACT[a.dataset.act];if(!f)return;if(a.tagName==='A')e.preventDefault();f(a,e)});
function onKey(e){
  const k=e.key,typing=/INPUT|TEXTAREA/.test((e.target.tagName||''));
  if((e.metaKey||e.ctrlKey)&&k.toLowerCase()==='k'){e.preventDefault();openPalette();return}
  for(const h of KEYS){if(h(e,typing)===true)return}
  if(k==='Escape'){if(MENU){closeMenu();return}if(PAL){closePalette();return}if($('#npDlg')){closeNewPage();return}if($('#dlg')){closeDlg();return}
    if(S.pending){ACT.unpin();return}if(S.active!=null&&route().ver){S.active=null;const R=route();renderRail(page(R.id),R);placeAllPins();return}
    if(S.peek){S.peek=null;render();return}if(S.sel.size){S.sel.clear();render();return}if(typing)e.target.blur();return}
  if(typing||PAL||$('#npDlg')||$('#dlg'))return;
  if(k==='/'&&$('#q')){e.preventDefault();$('#q').focus();return}
  if(k==='['){toggleSide();return}
  if(S.peek&&isProj(route())&&(k==='ArrowDown'||k==='ArrowUp')){e.preventDefault();stepPeek(k==='ArrowDown'?1:-1);return}
  if(S.peek&&k==='Enter'){go(`#page/${S.peek}/design`);return}
  if((k===' '||k==='Enter')&&e.target.matches?.('[role=checkbox],[role=button],.vcard,.cm')){e.preventDefault();e.target.click()}
}
document.addEventListener('keydown',onKey);
window.addEventListener('hashchange',()=>{closeMenu();closeDlg();const R=route();ONHASH.forEach(f=>f(R));if(R.name!=='page'){S.active=null;S.pending=null;S.replyTo=null}if(R.name==='page'&&!(R.tab==='design'&&R.ver)){S.mode=S.mode==='compare'?'comment':S.mode;S.cmp=null}if(R.name==='page')S.peek=null;render()});

RESIZE.push(()=>{if(isProj(route())&&JSON.stringify(pageKeys())!==JSON.stringify(PKEYS))renderPages()});
