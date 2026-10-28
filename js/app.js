/* Noon · the interface: sidebar, calendar, team availability, tasks, inbox, event panel, settings. */

/* ---------- icons ---------- */
const I={
  pen:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>',
  cal:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="16" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  cal16:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="16" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  team:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.5a5 5 0 0 1 6 4.5"/></svg>',
  task:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8 12.2l2.6 2.6L16.5 9"/></svg>',
  proj:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="17" height="16" rx="3.5"/><path d="M3.5 9h17M7.5 6.5h.01M10.5 6.5h.01"/></svg>',
  gear:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  bell:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
  clock:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  clock14:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  pin:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0c0 5.4 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  pin14:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0c0 5.4 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  date:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="16" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  plus:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  check:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"/></svg>',
  more:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18" cy="12" r="1.8"/></svg>',
  x:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  warn:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.5"/></svg>',
  send:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12L20 4l-4 16-4-7z"/></svg>',
  file:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 3v5h5"/></svg>',
  clip:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.5l-8.2 8.2a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"/></svg>',
  link:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  users14:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.5a5 5 0 0 1 6 4.5"/></svg>',
  mail:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
  dl:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  trash:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 13h9.4l.8-13"/></svg>',
  copy:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
  g:'<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"/></svg>',
  o:'<svg width="16" height="16" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" fill="#0F6CBD"/><ellipse cx="9" cy="12" rx="4" ry="4.6" fill="#fff"/><ellipse cx="9" cy="12" rx="2" ry="2.6" fill="#0F6CBD"/></svg>',
  sun:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5z"/></svg>',
};

/* ---------- small helpers ---------- */
const TINTS=['#6c5ce7','#0984e3','#00b894','#e17055','#d63031','#fdcb6e','#e84393','#00cec9'];
function avatar(m,cls='',status){
  if(!m) return `<span class="av ${cls}">?</span>`;
  const i=team().members.indexOf(m),c=TINTS[(i<0?m.name.length:i)%TINTS.length];
  return `<span class="av ${cls}" style="background:${c}" title="${esc(m.name)}">${esc(initials(m.name))}${m.photo?`<img src="${esc(m.photo)}" alt="" loading="lazy" onerror="this.remove()">`:''}${status?`<i class="dot ${status}"></i>`:''}</span>`;
}
const avStack=(ids,n=3,cls='')=>{const T=team(),ms=ids.map(id=>findM(id,T)).filter(Boolean);return `<span class="avs ${cls}">${ms.slice(0,n).map(m=>avatar(m)).join('')}${ms.length>n?`<span class="av more">+${ms.length-n}</span>`:''}</span>`};
let toastT=0;
function toast(text,undo){
  const e=$('#toast');e.hidden=false;e.innerHTML=esc(text)+(undo?'<button type="button" data-undo>Undo</button>':'');toast.undo=undo||null;
  clearTimeout(toastT);toastT=setTimeout(()=>{e.hidden=true},undo?6000:3200);
}
$('#toast').addEventListener('click',e=>{if(e.target.closest('[data-undo]')&&toast.undo){const u=toast.undo;toast.undo=null;$('#toast').hidden=true;u()}});
function confirmDlg(title,text,ok='Remove'){
  return new Promise(res=>{const d=$('#dConfirm');$('#cfTitle').textContent=title;$('#cfText').textContent=text;const b=$('#cfOk');b.textContent=ok;
    const done=v=>{d.removeEventListener('close',onClose);res(v)};const onClose=()=>done(false);
    b.onclick=()=>{d.removeEventListener('close',onClose);d.close();res(true)};d.addEventListener('close',onClose);d.showModal()});
}
function setTheme(t,quiet){document.documentElement.dataset.theme=t;syncThemeSwitch();try{localStorage.setItem('noon.theme',t)}catch(e){}if(!quiet&&typeof savePrefs==='function') savePrefs();if($('#dSettings').open) renderSettings()}
function syncThemeSwitch(){const b=$('#themeSwitch');if(b) b.setAttribute('aria-checked',document.documentElement.dataset.theme==='dark')}
function setSyncState(s){const el=$('#syncState');if(!el) return;el.textContent=s==='saving'?'Saving…':s==='error'?'Not saved':''}
const dayStart=day=>dayRange(day)[0];
const dayTitle=day=>{const {y,m}=dayParts(day);return MONTHS[m-1]+', '+y};
const offLabel=(tz,ms=Date.now())=>{const d=(tzOffset(tz,ms)-tzOffset(home(),ms))/60;if(!d) return 'same time';const a=Math.abs(d);return (d>0?'+':'−')+(Number.isInteger(a)?a:a.toFixed(1))+'h'};
const dayMark=(ms,tz)=>{const a=parts(tz,ms),b=parts(home(),ms);const d=(Date.UTC(a.y,a.m-1,a.d)-Date.UTC(b.y,b.m-1,b.d))/DAY;return d>0?'+1 day':d<0?'−1 day':''};
const dayMarkShort=(ms,tz)=>{const m=dayMark(ms,tz);return m?` <small>(${m})</small>`:''};
function statusNow(m,ms=Date.now()){return statusAt(m,ms,ctx(dayOf(ms)))}
const linkish=s=>/^(https?:\/\/|www\.)\S+$/i.test(String(s||'').trim());
const hrefOf=s=>/^https?:/i.test(s)?s:'https://'+s;

/* ---------- navigation ---------- */
function setView(v,quiet){
  UI.view=v;closeMenu();
  for(const [id,k] of [['vCal','calendar'],['vTeam','team'],['vTasks','tasks'],['vProj','projects']]) $('#'+id).hidden=k!==v;
  if(v!=='calendar'&&UI.draft&&!UI.draft.id) closePop();
  if(!SHARE) try{localStorage.setItem('noon.view',v)}catch(e){}
  if(!quiet) render();
}
function render(){
  if(!UI.day) UI.day=today();
  renderSide();
  if(UI.view==='calendar') renderCal();else if(UI.view==='team') renderTeam();else if(UI.view==='projects'){if(typeof renderProjects==='function') renderProjects()}else renderTasks();
  if(UI.draft) renderPop();
  if(UI.inbox) renderInbox();
}

/* ---------- sidebar ---------- */
function renderSide(){
  const m=me(),u=typeof user==='function'?user():null,now=Date.now(),ib=inbox();
  $('#profileCard').innerHTML=`<button type="button" class="tbtn pf" data-open-settings="account" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">${avatar(m,'',statusNow(m)[0])}<span class="who"><span class="name">${esc(u?u.name:m.name)}</span><span class="role">${esc(tzLabel(home()))} · ${fmtT(now,home())}</span></span></button>
    <button type="button" class="ibtn" id="bellBtn" aria-label="Inbox${ib.count?`, ${ib.count} waiting`:''}" title="Inbox">${I.bell}<span class="badge">${ib.count||''}</span></button><span class="sync" id="syncState"></span>`;
  const T=team(),open=tasksOf(T).filter(t=>!t.done&&!t.cleared),late=open.filter(t=>taskDue(t).state==='overdue').length,inv=(m.events||[]).filter(x=>x.pend&&x.e>now).length;
  const navItems=[['calendar',I.cal,'Calendar',inv?`<span class="cnt">${inv}</span>`:''],['team',I.team,'Team',`<span class="cnt quiet">${T.members.length}</span>`],['tasks',I.task,'Tasks',late?`<span class="cnt bad">${late}</span>`:open.length?`<span class="cnt quiet">${open.length}</span>`:''],['projects',I.proj,'Projects',(T.projects||[]).length?`<span class="cnt quiet">${T.projects.length}</span>`:''],['settings',I.gear,'Settings','']];
  $('#nav').innerHTML=navItems.map(([k,ic,l,b])=>`<button type="button" data-nav="${k}" ${UI.view===k?'aria-current="page"':''}>${ic}<span>${l}</span>${b}</button>`).join('');
  $('#tabbar').innerHTML=navItems.slice(0,4).map(([k,ic,l,b])=>`<button type="button" data-nav="${k}" ${UI.view===k?'aria-current="page"':''}>${ic}<span>${l}</span>${b}</button>`).join('')+`<button type="button" data-tab-inbox>${I.bell}<span>Inbox</span>${ib.count?`<span class="cnt">${ib.count}</span>`:''}</button><button type="button" data-nav="settings">${I.gear}<span>Settings</span></button>`;
  renderNext();
}
function renderNext(){
  const el=$('#nextCard'),m=me(),H=home(),now=Date.now(),x=upNext();
  if(!x){const solo=team().members.length<2,w=solo?null:windows(today());const best=w&&w.best&&w.best.end>now?w.best:null;
    el.innerHTML=`<div class="nx-top"><span class="time">Up next</span></div><p class="empty">Nothing booked in the next 24 hours.${best?` The team's best window today is <b>${fmtT(Math.max(best.start,r15(now)),H)} to ${fmtT(best.end,H)}</b>, ${w.max===w.total?'everyone free':`${w.max} of ${w.total} free`}.`:solo?' Add the people you work with to see the hours you share.':''}</p>
      <div class="acts" style="margin-top:12px"><button type="button" class="btn-lav" data-nav="team">${solo?'Add teammates':'Find a time'}</button></div>`;return}
  const [s,e,title,id,who=[],pend,req,loc]=x,ms=s-now,inMin=Math.round(ms/MIN);
  const inTxt=ms<=0?(e>now?'now':'ended'):inMin<60?`${inMin} min`:inMin<24*60?`${Math.floor(inMin/60)} h ${inMin%60?inMin%60+' min':''}`.trim():'tomorrow';
  const T=team(),ppl=(who.length?who:[]).map(i=>findM(i,T)).filter(z=>z&&!z.isMe).slice(0,4);
  el.innerHTML=`<div class="nx-top"><span class="time">${fmtT(s,H)} – ${fmtT(e,H)}${dayOf(s)!==today()?' · tomorrow':''}</span><span class="in${ms<=0&&e>now?' now':''}"><i>${I.clock14}</i>${inTxt}</span></div>
    <div class="ttl">${esc(title||'Meeting')}</div>
    <div class="meta">${loc?`<div class="row">${linkish(loc)?I.link:I.pin14}<span>${esc(linkish(loc)?loc.replace(/^https?:\/\//,''):loc)}</span></div>`:''}${!id?`<div class="row">${I.cal16}<span>From your calendar</span></div>`:''}
      ${ppl.length?`<div class="ppl">${ppl.map(z=>`<div class="pp">${avatar(z,'xs')}<b>${esc(first(z.name))}</b><small>${fmtT(s,z.tz)} · ${esc(tzLabel(z.tz))}</small></div>`).join('')}${who.length-1>ppl.length?`<div class="pp"><small>+${who.length-1-ppl.length} more</small></div>`:''}</div>`:''}</div>
    <div class="acts">${loc&&linkish(loc)?`<a class="btn-lav" href="${esc(hrefOf(loc))}" target="_blank" rel="noopener">${I.link}Join</a>`:''}<button type="button" class="btn-ghost" data-open-ev="${id||''}" data-s="${s}">Details</button></div>`;
}

/* ---------- calendar ---------- */
const colorOf=x=>x[5]?'pend':!x[3]?'cal':evColor(x[2],x[8]);
const narrowCal=()=>innerWidth<=860;
const durLabel=ms=>{const m=Math.round(ms/MIN);return m<60?m+' min':m%60?`${Math.floor(m/60)} h ${m%60} min`:`${m/60} h`};
function calDays(){return UI.cal==='day'?[UI.day]:weekDays(UI.day)}
// everything that shows on a day: my items, the teammates I overlay, timed tasks, and the draft being made
function dayItems(d){
  const T=team(),m=me(),out=[],[a,b]=dayRange(d);
  for(const x of itemsOn(m,d)) out.push({s:x[0],e:x[1],x});
  for(const id of UI.filter){const z=findM(id,T);if(!z||z.gone) continue;for(const x of itemsOn(z,d)) if(!(x[4]||[]).includes(m.id)) out.push({s:x[0],e:x[1],x,who:z})}
  for(const t of tasksOf(T)) if(t.day===d&&t.time&&!t.cleared){const st=taskInstant(t);if(st>=a&&st<b) out.push({s:st,e:st+30*MIN,task:t})}
  if(UI.draft&&!UI.draft.id&&!UI.draft.ro&&dayOf(UI.draft.s)===d) out.push({s:UI.draft.s,e:UI.draft.e,draft:true});
  out.sort((p,q)=>p.s-q.s||q.e-p.e);
  return out;
}
// overlapping things share a column side by side; each cluster of overlaps splits its own width
function vgLanes(items){let grp=[],end=-Infinity;const done=()=>{const ends=[];for(const it of grp){let l=ends.findIndex(e=>e<=it.s);if(l<0){l=ends.length;ends.push(0)}ends[l]=it.e;it.lane=l}for(const it of grp) it.lanes=ends.length;grp=[]};
  for(const it of items){if(it.s>=end) done();grp.push(it);end=Math.max(end,it.e)}done()}
const vgHp=()=>clamp(Math.floor(($('#scroller').clientHeight||600)/11),44,64);
function renderCal(){
  const v=$('#vCal');v.className='view cal-'+UI.cal;
  $('#calTitle').textContent=dayTitle(UI.day);
  $$('#calSeg button').forEach(b=>b.classList.toggle('on',b.dataset.cal===UI.cal));
  const T=team(),others=T.members.filter(z=>!z.isMe),tod=today();
  const shown=others.filter(z=>UI.filter.has(z.id)).concat(others.filter(z=>!UI.filter.has(z.id))).slice(0,4);
  $('#calPeople').innerHTML=shown.map(z=>`<button type="button" class="pav${UI.filter.has(z.id)?' on':''}" data-filter="${z.id}" title="${esc(z.name)}: ${UI.filter.has(z.id)?'hide':'show'} their calendar">${avatar(z)}</button>`).join('')+(others.length>4?`<button type="button" class="more" data-nav="team" title="See everyone on the Team page">+${others.length-4}</button>`:'');
  // the Today shortcut only when today is off screen
  $('#calToday').hidden=UI.cal==='month'?UI.day.slice(0,7)===tod.slice(0,7):weekDays(UI.day).includes(tod);
  const unit={week:'week',day:'day',month:'month'}[UI.cal];$('#calPrev').setAttribute('aria-label','Previous '+unit);$('#calNext').setAttribute('aria-label','Next '+unit);
  if(UI.cal==='month'){UI.vgKey=null;renderMonthNav();renderMonth();return}
  const wk=weekDays(UI.day);
  document.documentElement.style.setProperty('--ncol',7);
  $('#days').innerHTML=wk.map(d=>`<button type="button" class="dcard${d===UI.day?' sel':''}${d===tod?' today':''}" data-day="${d}" aria-label="${DAYS[dowOf(d)]} ${+d.slice(8)}${d===tod?', today':''}" ${d===UI.day?'aria-current="date"':''}><span class="wd" data-short="${DAYS[dowOf(d)].slice(0,3)}">${DAYS[dowOf(d)]}</span><span class="n">${+d.slice(8)}</span><span class="cap">${d===tod?'Today':''}</span></button>`).join('');
  // tasks due on a day sit under its card
  const ad=wk.map(d=>{const ts=tasksOf(T).filter(t=>t.day===d&&!t.time&&!t.cleared);return `<div class="cell">${ts.slice(0,3).map(t=>`<button type="button" class="tchip${taskDue(t).state==='overdue'?' late':''}${t.done?' done':''}" data-task="${t.id}" title="${esc(t.title)}"><i>${t.done?I.check:''}</i><span>${esc(t.title)}</span></button>`).join('')}${ts.length>3?`<span class="mmore">+${ts.length-3} more</span>`:''}</div>`});
  $('#allday').innerHTML=ad.some(x=>x.includes('tchip'))?`<div class="lbl">Due</div>${ad.join('')}<div></div>`:'';
  $('#scroller').classList.remove('month-mode');
  const days=calDays();
  if(UI.cal==='week'&&narrowCal()){UI.vgKey=null;v.classList.add('cal-list');$('#wk').innerHTML='';renderAgenda(days)}
  else{renderRows(days);if(UI.cal==='day') renderAgenda(days);else $('#agenda').innerHTML=''}
  if(UI.draft) placePop();
}
function renderMonthNav(){
  const {y,m}=dayParts(UI.day),tod=today(),cy=+tod.slice(0,4),cm=+tod.slice(5,7);
  document.documentElement.style.setProperty('--ncol',12);
  $('#days').innerHTML=Array.from({length:12},(_,i)=>`<button type="button" class="mcard${i+1===m?' sel':''}${y===cy&&i+1===cm?' cur':''}" data-month="${y}-${String(i+1).padStart(2,'0')}" aria-label="${MONTHS[i]} ${y}${y===cy&&i+1===cm?', this month':''}">${MONTHS[i].slice(0,3)}</button>`).join('');
  $('#allday').innerHTML='';
}
// the days stand in columns under their date cards, the hours run down the left; the whole day scrolls and opens at your online hours
function renderRows(days){
  const H=home(),tod=today(),now=Date.now(),m=me(),hp=vgHp();UI.hp=hp;
  let hrs='';for(let h=1;h<24;h++) hrs+=`<span style="top:${h*hp}px">${fmtHr(dayStart(days[0])+h*HR,H)}</span>`;
  const cols=days.map(d=>{
    const [a,b]=dayRange(d),c=ctx(d),y=t=>clamp((t-a)/HR,0,24)*hp,items=dayItems(d).filter(it=>it.e>a&&it.s<b),work=c.work[m.id].filter(([s0,e0])=>e0>a&&s0<b);vgLanes(items);
    let inner='';
    for(const [s0,e0] of work) inner+=`<div class="vg-work" style="top:${y(s0)}px;height:${y(e0)-y(s0)}px"></div>`;
    for(const it of items){
      const top=y(it.s),ht=Math.max(y(it.e)-top-2,20),pos=`top:${top}px;height:${ht}px;left:calc(${it.lane/it.lanes*100}% + 2px);width:calc(${100/it.lanes}% - 4px)`,tall=ht>=40;
      if(it.draft){inner+=`<div class="wk-draft" style="${pos}"><i>${I.plus}</i></div>`;continue}
      if(it.task){const t=it.task;inner+=`<div class="chip vchip task" data-task="${t.id}" style="${pos}" title="${esc(t.title)} · due ${fmtT(it.s,H)}"><span>${esc(t.title)}</span>${tall?`<small>Due ${fmtT(it.s,H)}</small>`:''}</div>`;continue}
      const x=it.x,z=it.who,cls=colorOf(x);
      inner+=`<div class="chip vchip ${cls}${z?' other':''}${UI.sel===(x[3]||x[0]+'')?' sel':''}" data-ev="${x[3]||''}" data-s="${x[0]}" data-who="${z?z.id:''}" style="${pos};--bg:var(--ev-${cls==='pend'||cls==='cal'?'white':cls})" title="${esc(x[2])} · ${fmtT(x[0],H)} – ${fmtT(x[1],H)}${z?' · '+esc(first(z.name))+"'s calendar":''}${x[5]?' · invite, no answer yet':''}"><span>${z?avatar(z,'xs'):''}${esc(x[2]||'Meeting')}</span>${tall?`<small>${fmtT(x[0],H)} – ${fmtT(x[1],H)}</small>`:''}</div>`}
    if(d===tod&&now>=a&&now<b) inner+=`<div class="wk-now" style="top:${y(now)}px"></div>`;
    return `<div class="vg-col${d===tod?' today':''}${work.length?'':' off'}" data-day="${d}">${inner}</div>`});
  $('#wk').innerHTML=`<div class="vg${days.length===1?' one':''}" style="--hp:${hp}px"><div class="vg-hrs" id="wkRuler">${hrs}</div>${cols.join('')}${days.length>1?'<div></div>':''}</div>`;
  const key=UI.cal+days[0]+hp;if(UI.vgKey!==key){UI.vgKey=key;vgScroll(days)}
}
// open the grid an hour before your online hours start on the day in focus
function vgScroll(days){const d=days.includes(UI.day)?UI.day:days[0],[a,b]=dayRange(d),w=ctx(d).work[me().id].find(([s,e])=>e>a&&s<b),st=w?Math.max(0,(w[0]-a)/HR):8;$("#scroller").scrollTop=Math.max(0,(Math.floor(st)-1)*(UI.hp||48)-14)}
// the day as a list: what is booked, in order, with the free stretches in your online hours you can book in one click
function renderAgenda(days){
  const H=home(),m=me(),now=Date.now(),tod=today();
  const html=days.map(d=>{
    const [a,b]=dayRange(d),c=ctx(d),items=dayItems(d).filter(i=>!i.draft),work=c.work[m.id].filter(([s,e])=>e>a&&s<b);
    const ws=work.length?work[0][0]:a+9*HR,we=work.length?work[work.length-1][1]:a+17*HR;
    let out=[],cur=Math.max(ws,d===tod?Math.ceil(now/(15*MIN))*15*MIN:0);
    for(const t of tasksOf(team()).filter(t=>t.day===d&&!t.time&&!t.cleared&&!t.done)) out.push(`<button type="button" class="ag" data-task="${t.id}"><span class="tm">Due<small>any time</small></span><span class="bar" style="--bg:var(--ev-green)"></span><span class="bd"><b>${esc(t.title)}</b><span class="meta"><span>Task · for ${esc(tkNames(team(),t.to))}</span></span></span><span></span></button>`);
    const gap=(s,e)=>{if(e-s>=30*MIN) out.push(`<button type="button" class="ag gap" data-gap="${s}" data-until="${e}"><span class="tm">${fmtT(s,H)}<small>${fmtT(e,H)}</small></span><span class="bar"></span><span class="bd"><b>Free · ${durLabel(e-s)}</b></span><span></span></button>`)};
    for(const it of items){const mine=it.x&&!it.who;if(mine&&it.s>cur) gap(cur,Math.min(it.s,we));out.push(agItem(it));if(mine) cur=Math.max(cur,it.e)}
    if(cur<we) gap(cur,we);
    if(!out.length) out.push(`<p class="wk-note">${work.length?'Nothing booked and nothing free to book: your online hours are over for this day.':'A day off. Nothing booked.'}</p>`);
    return (days.length>1?`<div class="ag-h${d===tod?' today':''}">${DAYS[dowOf(d)]} ${+d.slice(8)}${d===tod?' · Today':''}</div>`:'')+out.join('');
  }).join('');
  $('#agenda').innerHTML=html;
}
function agItem(it){
  const H=home(),now=Date.now();
  if(it.task){const t=it.task;return `<button type="button" class="ag" data-task="${t.id}"><span class="tm">${fmtT(it.s,H)}<small>due</small></span><span class="bar" style="--bg:var(--ev-green)"></span><span class="bd"><b>${esc(t.title)}</b><span class="meta"><span>Task</span></span></span><span></span></button>`}
  const x=it.x,z=it.who,cls=colorOf(x),ppl=(x[4]||[]).map(i=>findM(i)).filter(q=>q&&!q.isMe),live=now>=x[0]&&now<x[1];
  const meta=[z?`${I.cal16}${esc(first(z.name))}'s calendar`:'',!x[3]&&!z?`${I.cal16}From your calendar`:'',x[5]?'Invite, no answer yet':'',ppl.length?`${avStack(ppl.map(q=>q.id),4,'sm')}${ppl.length===1?esc(first(ppl[0].name)):`${ppl.length} people`}`:'',x[7]?`${linkish(x[7])?I.link:I.pin14}${esc(linkish(x[7])?x[7].replace(/^https?:\/\//,'').replace(/\/$/,''):x[7])}`:''].filter(Boolean).map(q=>`<span>${q}</span>`).join('');
  const acts=x[5]?`<span class="acts"><button type="button" class="btn sm dark" data-acc="${x[3]}">Accept</button><button type="button" class="btn sm ghost" data-dec="${x[3]}">Decline</button></span>`:x[7]&&linkish(x[7])&&!z?`<span class="acts"><a class="btn sm" href="${esc(hrefOf(x[7]))}" target="_blank" rel="noopener">${I.link}Join</a></span>`:'<span></span>';
  return `<div class="ag${live?' now':''}${UI.sel===(x[3]||x[0]+'')?' sel':''}" role="button" tabindex="0" data-ev="${x[3]||''}" data-s="${x[0]}" data-who="${z?z.id:''}"><span class="tm">${fmtT(x[0],H)}<small>${fmtT(x[1],H)} · ${durLabel(x[1]-x[0])}</small></span><span class="bar ${cls}" style="--bg:var(--ev-${cls==='pend'||cls==='cal'?'white':cls})"></span><span class="bd"><b>${esc(x[2]||'Meeting')}</b>${meta?`<span class="meta">${meta}</span>`:''}</span>${acts}</div>`;
}
function renderMonth(){
  const {y,m}=dayParts(UI.day),first=mkDay(y,m,1),ws=S.weekStart??1,off=(dowOf(first)-ws+7)%7;let cur=shiftDay(first,-off);
  const T=team(),mine=me(),tod=today(),names=DAYS;
  let dow='';for(let i=0;i<7;i++) dow+=`<span data-short="${names[(i+ws)%7].slice(0,3)}">${names[(i+ws)%7]}</span>`;
  let html='';
  for(let i=0;i<42;i++){
    const inM=cur.slice(0,7)===first.slice(0,7),items=itemsOn(mine,cur),ts=tasksOf(T).filter(t=>t.day===cur&&!t.cleared&&!t.done);
    const chips=[...items.map(x=>({k:'ev',x})),...ts.map(t=>({k:'tk',t}))].slice(0,3);
    html+=`<div class="mcell${inM?'':' out'}${cur===tod?' today':''}${cur===UI.day?' sel':''}" data-day="${cur}"><div class="n"><b>${+cur.slice(8)}</b>${items.length+ts.length>3?`<i>${items.length+ts.length}</i>`:''}</div>
      ${chips.map(c=>c.k==='ev'?`<div class="mchip ${colorOf(c.x)}" data-ev="${c.x[3]||''}" data-s="${c.x[0]}" style="--bg:var(--ev-${colorOf(c.x)==='pend'||colorOf(c.x)==='cal'?'white':colorOf(c.x)})"><span>${fmtT(c.x[0],home())} ${esc(c.x[2])}</span></div>`:`<div class="mchip task" data-task="${c.t.id}"><span>${esc(c.t.title)}</span></div>`).join('')}
      ${items.length+ts.length>3?`<div class="mmore">+${items.length+ts.length-3} more</div>`:''}</div>`;
    cur=shiftDay(cur,1);
  }
  let md=$('#vCal .mdow');if(!md){md=document.createElement('div');md.className='mdow';$('#scroller').before(md)}md.innerHTML=dow;
  $('#month').innerHTML=html;$('#scroller').classList.add('month-mode');
}
// bring the online hours of the day in focus into view
function scrollToDay(){if(UI.view==='calendar'&&UI.cal!=='month'&&$('#wk .vg')) vgScroll(calDays());else $('#scroller').scrollTop=0}
function gotoDay(day,quiet){UI.day=day;if(!quiet) render()}
// hover: a guide line across the column and the time it points at beside the hours
function wkTimeAt(e){const col=e.target.closest('.vg-col');if(!col) return null;const r=col.getBoundingClientRect(),d=col.dataset.day,f=clamp((e.clientY-r.top)/r.height,0,1);return {d,tl:col,t:dayStart(d)+f*24*HR,y:f*r.height}}
function wkHover(r){
  $$('#wk .wk-hov').forEach(x=>{if(!r||x.parentElement!==r.tl) x.remove()});
  const rl=$('#wkRuler');let c=rl&&rl.querySelector('.cur');
  if(!r){if(c) c.remove();return}
  let h=r.tl.querySelector('.wk-hov');if(!h){h=document.createElement('div');h.className='wk-hov';r.tl.append(h)}h.style.top=r.y+'px';
  if(rl){if(!c){c=document.createElement('span');c.className='cur';rl.append(c)}c.style.top=r.y+'px';c.textContent=fmtT(Math.round(r.t/(5*MIN))*5*MIN,home())}
}
$('#wk').addEventListener('mousemove',e=>{const r=wkTimeAt(e);if(r) wkHover(r);else wkHover(null)});
$('#wk').addEventListener('mouseleave',()=>wkHover(null));
$('#agenda').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.ag[role=button]')){e.preventDefault();e.target.click()}});

/* ---------- the event panel ---------- */
const POPW=340;
function evById(id){for(const z of team().members){const e=(z.events||[]).find(x=>x.id===id);if(e) return {z,e}}return null}
// open for a new meeting (draft without id), an existing one (id), or a calendar block that is not mine (ro)
function openDraft(d){
  UI.draft={who:new Set(),tags:[],...d};
  if(!(UI.draft.who instanceof Set)) UI.draft.who=new Set(UI.draft.who);
  UI.sel=d.id||(d.ro?d.s+'':null);UI.pick=null;UI.pickC=null;UI.ppl=false;UI.sugg=false;
  if(UI.view==='calendar'&&UI.cal==='month'){UI.cal='week';gotoDay(dayOf(UI.draft.s),true)}
  render();
  if(!d.id&&!d.ro) requestAnimationFrame(()=>{const t=$('#pTitle');if(t){t.focus();t.setSelectionRange(t.value.length,t.value.length)}});
}
function openEvent(id,s,whoId){
  const r=id?evById(id):null;
  if(r){const {e}=r,mine=(e.who||[]).includes(me().id)||(me().events||[]).some(x=>x.id===id);
    openDraft({id,s:e.s,e:e.e,title:e.title,loc:e.loc||'',kind:kindOfItem(e.title,e.kind),who:new Set(e.who||[r.z.id]),by:e.by||null,pend:!!(myEv(id)||{}).pend,req:e.req,ro:!mine});return}
  // a block from someone's calendar: read only
  const z=whoId?findM(whoId):me(),x=itemsOn(z,dayOf(+s)).find(q=>q[0]===+s&&!q[3]);
  if(!x) return;openDraft({ro:true,calOf:z.id,s:x[0],e:x[1],title:x[2],who:new Set([z.id]),kind:typeOf(x[2])});
}
function closePop(){UI.draft=null;UI.sel=null;closeMenu();$('#pop').hidden=true;render()}
function closeMenu(){const m=$('#pop .menu');if(m) m.remove()}
function timeOpts(day,sel){const a=dayStart(day);let o='';for(let m=0;m<24*60;m+=15){const t=a+m*MIN;o+=`<option value="${t}" ${t===sel?'selected':''}>${fmtT(t,home())}</option>`}return o}
function draftPeople(){const T=team();return [...UI.draft.who].map(id=>findM(id,T)).filter(Boolean)}
function renderPop(){
  const d=UI.draft,pop=$('#pop');if(!d){pop.hidden=true;return}
  const T=team(),m=me(),H=home(),day=dayOf(d.s),c=ctx(day),ppl=draftPeople(),dur=Math.round((d.e-d.s)/MIN);
  const own=!d.id||!d.by||d.by===m.id||!T.cloud,ro=!!d.ro,canEdit=own&&!ro,isNew=!d.id&&!ro;
  const warns=[];if(!ro) for(const z of ppl){for(const w of warningsFor(z,d.s,d.e,c,d.id)) warns.push({...w,z})}
  warns.sort((a,b)=>b.lvl-a.lvl);
  const cand=T.members.filter(z=>!d.who.has(z.id));
  const sug=!ro&&UI.sugg?windowsFor(day,ppl.length?ppl:[m],dur,15):null;
  const meta=d.id?metaOf(d.id):null;
  let bar='';
  if(d.id&&d.pend){const from=d.req&&findM(d.req,T);bar=`<div class="pbar"><span class="st">Invite${from?' from '+esc(first(from.name)):''}</span></div>`}
  else if(ro&&d.calOf){const z=findM(d.calOf,T);bar=`<div class="pbar"><span class="st">${esc(first(z.name))}'s calendar</span></div>`}
  else if(ro){bar=`<div class="pbar"><span class="st">Not invited</span></div>`}
  else if(d.id&&!own){const by=findM(d.by,T);bar=`<div class="pbar"><span class="st ok">Booked by ${esc(by?first(by.name):'a teammate')}</span></div>`}
  const who=`<h4>${ro?'Who':'Attendees'} <span style="font-weight:500;opacity:.7">${ppl.length}</span>${canEdit&&cand.length?`<button type="button" class="tlink" data-pa="all">Add everyone</button>`:''}</h4>
    <div class="ppl">${ppl.map(z=>{const k=ro?null:statusAt(z,d.s,c,d.id)[0],ev=d.id&&(z.events||[]).find(x=>x.id===d.id),pend=ev&&ev.pend,isMe=z.isMe;
      const lt=`${fmtT(d.s,z.tz)}${dayMarkShort(d.s,z.tz)}`;
      return `<div class="pp">${avatar(z,'',k||undefined)}<span class="n"><b>${esc(isMe?'You':z.name)}</b><small>${esc(tzLabel(z.tz))} · ${offLabel(z.tz,d.s)}${pend?' · invited, no answer yet':''}</small></span>
        <span class="lt ${k==='sleep'||k==='meet'?'bad':k==='off'?'dim':''}">${lt}<small>${k?STATUS_LABEL[k]:''}</small></span>
        ${canEdit&&!isMe?`<button type="button" class="rm" data-pa="rm" data-id="${z.id}" aria-label="Remove ${esc(first(z.name))}">${I.x}</button>`:'<span></span>'}</div>`}).join('')}
    ${canEdit?`<div class="addrow"><button type="button" class="addc" data-pa="pick" aria-expanded="${!!UI.ppl}" aria-label="Add people">${I.plus}</button><button type="button" class="tlink" data-pa="pick">${cand.length?'Add people':'Everyone is on it'}</button></div>`:''}
    ${canEdit&&UI.ppl?`<div class="dd"><input class="dd-q" id="pQ" placeholder="Search people" value="${esc(UI.pq||'')}"><div class="dd-list">${cand.filter(z=>!UI.pq||z.name.toLowerCase().includes(UI.pq.toLowerCase())).map(z=>{const k=statusAt(z,d.s,c)[0];return `<button type="button" class="opt" data-pa="add" data-id="${z.id}">${avatar(z,'sm',k)}<span class="n">${esc(z.name)}<small>${esc(tzLabel(z.tz))} · ${STATUS_LABEL[k]}</small></span><span class="lt"><b>${fmtT(d.s,z.tz)}</b>${dayMark(d.s,z.tz)||offLabel(z.tz,d.s)}</span></button>`}).join('')||'<p class="tab-note" style="padding:10px">Nobody by that name.</p>'}</div></div>`:''}</div>`;
  const warnHtml=warns.length?`<h4>Heads up</h4><div class="warns">${warns.slice(0,5).map(w=>`<div class="warn${w.lvl===2?' bad':''}">${I.warn}<span>${esc(w.text)}</span></div>`).join('')}</div>`:(ppl.length>1&&!ro?`<div class="warn" style="background:var(--tag-green-bg);color:var(--tag-green)">${I.check}<span>Everyone is free at this time.</span></div>`:'');
  const sugHtml=sug?`<h4>Suggested times <span style="font-weight:500;opacity:.7">${dur} min, ${dayLabel(day).toLowerCase()}</span></h4><div class="sugg">${sug.list.length?sug.list.slice(0,6).map(w=>{const st=Math.max(w.start,dayStart(day));return `<button type="button" class="bw${sug.max<sug.total?' part':''}" data-pa="use" data-s="${st}">${fmtT(st,H)}${w.end-w.start>dur*MIN?` – ${fmtT(w.end,H)}`:''} <small>${sug.max===sug.total?'all free':`${sug.max} of ${sug.total}`}</small></button>`}).join(''):'<p class="tab-note" style="padding:4px 0">No time today when everyone is free. Try another day or fewer people.</p>'}</div>`:'';
  const thread=d.id&&!ro?`<div class="thread-wrap"><h4>Comments <span style="font-weight:500;opacity:.7">${(meta.cm||[]).length||''}</span></h4>${threadHtml(meta,'ev')}</div>`:'';
  let foot='';
  if(d.id&&d.pend) foot=`<div class="ans-row"><button type="button" class="btn dark" data-pa="accept">Accept</button><button type="button" class="btn ghost" data-pa="decline">Decline</button></div>`;
  else if(ro&&d.id){const asked=(metaOf(d.id).join||[]).includes(m.id);foot=`<div class="ans-row"><button type="button" class="btn ${asked?'ghost':'dark'}" data-pa="join" ${asked?'disabled':''}>${asked?'Asked to join':'Ask to join'}</button></div>`}
  else if(ro) foot='';
  else foot=`<div class="cta"><button type="button" class="go" data-pa="save">${isNew?'Add Event':'Save changes'}</button><button type="button" class="more" data-pa="menu" aria-label="More">${I.more}</button></div>`;
  const dateTxt=fmtDateLong(d.s,H),dateVal=day;
  pop.innerHTML=`<div class="pop-head">${bar}<div class="pop-ttl"><input class="ttl" id="pTitle" placeholder="Meeting title" maxlength="80" value="${esc(d.title||'')}" ${canEdit?'':'readonly'}><button type="button" class="xbtn" data-pa="close" aria-label="Close">×</button></div></div>
    <div class="pop-body"><div class="fld">${I.date}<div class="in"><span>${dateTxt}</span>${canEdit?`<input type="date" class="cover" id="pDate" value="${dateVal}" aria-label="Date">`:''}</div></div>
    <div class="fld">${I.clock}<div class="two"><div class="in sel"><select id="pStart" ${canEdit?'':'disabled'}>${timeOpts(day,d.s)}</select></div><div class="in sel"><select id="pEnd" ${canEdit?'':'disabled'}>${timeOpts(day,d.e)}<option value="${dayRange(day)[1]}" ${d.e===dayRange(day)[1]?'selected':''}>${fmtT(dayRange(day)[1],H)}</option></select></div></div></div>
    <div class="fld">${I.pin}<div class="in">${canEdit?`<input id="pLoc" placeholder="Place or link" value="${esc(d.loc||'')}" maxlength="200">`:`<span>${esc(d.loc||'No place set')}</span>`}${d.loc&&linkish(d.loc)?`<a class="join" href="${esc(hrefOf(d.loc))}" target="_blank" rel="noopener">Open link</a>`:''}</div></div>
    ${ro?'':`<div class="tags">${Object.entries(TYPES).map(([k,[l,col]])=>`<button type="button" class="tag ${col}${d.kind===k?' on':''}" data-pa="kind" data-k="${k}" ${canEdit?'':'disabled'}>${l}</button>`).join('')}</div>`}
    ${who}${warnHtml}
    ${!ro&&canEdit?`<div class="addrow"><button type="button" class="tlink" data-pa="sugg">${UI.sugg?'Hide suggestions':'Suggest a time that works'}</button></div>`:''}${sugHtml}${thread}</div>${foot?`<div class="pop-foot">${foot}</div>`:''}`;
  pop.hidden=false;placePop();
}
function placePop(){
  const pop=$('#pop'),d=UI.draft;if(!d||pop.hidden) return;
  const sc=$('#scroller'),rows=UI.view==='calendar'&&UI.cal!=='month'&&!$('#vCal').classList.contains('cal-list');
  const anchor=rows?(d.id||d.ro?$(`#wk .chip[data-s="${d.s}"][data-ev="${d.id||''}"][data-who="${d.calOf||''}"]`):$('#wk .wk-draft')):null;
  if(!anchor){if(pop.parentElement!==$('#main')) $('#main').append(pop);pop.classList.add('docked');pop.style.left='';pop.style.top='';return}
  pop.classList.remove('docked');if(pop.parentElement!==sc) sc.append(pop);
  // beside the chip: to its right when there is room, else to its left, else below it; always inside what is on screen
  const ar=anchor.getBoundingClientRect(),sr=sc.getBoundingClientRect(),ph=pop.offsetHeight,W=sc.clientWidth,Hh=sc.clientHeight;
  const ax=ar.left-sr.left,ax2=ar.right-sr.left,ay=ar.top-sr.top;
  let left,top;
  if(ax2+10+POPW<=W-12){left=ax2+10;top=ay-10}
  else if(ax-10-POPW>=12){left=ax-10-POPW;top=ay-10}
  else{left=clamp(ax,12,Math.max(12,W-POPW-12));top=ar.bottom-sr.top+8}
  top=clamp(top,10,Math.max(10,Hh-ph-10));
  pop.style.left=Math.round(left+sc.scrollLeft)+'px';pop.style.top=Math.round(top+sc.scrollTop)+'px';
}
function commitDraft(){
  const d=UI.draft;if(!d||d.ro) return;
  const title=($('#pTitle').value||'').trim()||'Meeting',loc=($('#pLoc')?$('#pLoc').value:'').trim(),ids=[...d.who];
  if(!ids.includes(me().id)) ids.unshift(me().id);
  const dur=Math.round((d.e-d.s)/MIN);
  if(d.id){updateEvent(d.id,{title,loc,kind:d.kind,s:d.s,e:d.e});setAttendees(d.id,ids);toast('Saved');closePop();return}
  const r=addEvent(ids,title,d.s,dur,{loc,kind:d.kind});
  closePop();toast(r.pending.length?`Added. Pending for ${r.pending.join(', ')} until they accept.`:ids.length>1?`Added for ${ids.length} people`:'Added');
}
async function popAction(a,b){
  const d=UI.draft;if(!d) return;const m=me();
  if(a==='close'){closePop();return}
  if(a==='save'){commitDraft();return}
  if(a==='kind'){d.kind=b.dataset.k;renderPop();return}
  if(a==='pick'){UI.ppl=!UI.ppl;UI.pq='';renderPop();if(UI.ppl){const q=$('#pQ');if(q) q.focus()}return}
  if(a==='add'){d.who.add(b.dataset.id);UI.pq='';renderPop();const q=$('#pQ');if(q) q.focus();return}
  if(a==='all'){for(const z of team().members) d.who.add(z.id);UI.ppl=false;renderPop();return}
  if(a==='rm'){d.who.delete(b.dataset.id);renderPop();return}
  if(a==='sugg'){UI.sugg=!UI.sugg;renderPop();return}
  if(a==='use'){const s=+b.dataset.s,dur=d.e-d.s;d.s=s;d.e=s+dur;render();return}
  if(a==='accept'){answerInvite(d.id,true);d.pend=false;toast('Accepted');render();return}
  if(a==='decline'){answerInvite(d.id,false);closePop();toast('Declined');return}
  if(a==='join'){const k=metaOf(d.id);k.join=k.join||[];if(!k.join.includes(m.id)) k.join.push(m.id);save();toast('Asked to join');renderPop();return}
  if(a==='menu'){closeMenu();const ppl=draftPeople(),title=($('#pTitle').value||'').trim()||'Meeting',L=calLinks(title,d.s,d.e,ppl,$('#pLoc')?$('#pLoc').value:'');
    const own=!d.id||!d.by||d.by===m.id||!team().cloud;
    const mn=document.createElement('div');mn.className='menu';mn.innerHTML=`<a href="${esc(L.google)}" target="_blank" rel="noopener">${I.g}Add to Google Calendar</a><a href="${esc(L.outlook)}" target="_blank" rel="noopener">${I.o}Add to Outlook</a><button type="button" data-pa="ics">${I.dl}Download .ics</button><hr><a href="${esc(L.mail)}">${I.mail}Email everyone the times</a><button type="button" data-pa="copy">${I.copy}Copy times for each person</button>${d.id&&own?`<hr><button type="button" class="danger" data-pa="del">${I.trash}Delete meeting</button>`:''}`;
    $('#pop .cta').append(mn);return}
  if(a==='ics'){const ppl=draftPeople();downloadIcs(($('#pTitle').value||'').trim()||'Meeting',d.s,d.e,ppl,$('#pLoc')?$('#pLoc').value:'');closeMenu();toast('Invite downloaded');return}
  if(a==='copy'){const ppl=draftPeople(),title=($('#pTitle').value||'').trim()||'Meeting';const txt=`${title}\n`+[...new Set([m,...ppl])].map(z=>`${z.isMe?'Me':z.name}: ${fmtDate(d.s,z.tz)} ${fmtT(d.s,z.tz)} – ${fmtT(d.e,z.tz)} (${tzAbbr(d.s,z.tz)})`).join('\n');
    try{await navigator.clipboard.writeText(txt);toast('Copied')}catch(e){toast('Could not copy')}closeMenu();return}
  if(a==='del'){closeMenu();const undo=snapshot();deleteEvent(d.id);closePop();toast('Meeting deleted',undo);return}
}
$('#pop').addEventListener('click',e=>{const b=e.target.closest('[data-pa]');if(b){popAction(b.dataset.pa,b);return}if(!e.target.closest('.menu')) closeMenu()});
$('#pop').addEventListener('change',e=>{
  const d=UI.draft;if(!d) return;const t=e.target;
  if(t.id==='pStart'){const dur=d.e-d.s;d.s=+t.value;d.e=d.s+dur;render()}
  else if(t.id==='pEnd'){d.e=+t.value;if(d.e<=d.s) d.e=d.s+15*MIN;render()}
  else if(t.id==='pDate'&&t.value){const [y,mo,dd]=t.value.split('-').map(Number),p=parts(home(),d.s),dur=d.e-d.s;d.s=zonedToUtc(home(),y,mo,dd,p.h,p.mi);d.e=d.s+dur;gotoDay(t.value,true);render()}
});
$('#pop').addEventListener('input',e=>{const d=UI.draft;if(!d) return;if(e.target.id==='pTitle') d.title=e.target.value;if(e.target.id==='pLoc') d.loc=e.target.value;if(e.target.id==='pQ'){UI.pq=e.target.value;renderPop();const q=$('#pQ');q.focus();q.setSelectionRange(q.value.length,q.value.length)}});
$('#pop').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='pTitle'){e.preventDefault();commitDraft()}if(e.key==='Escape'){e.stopPropagation();closePop()}});

/* ---------- threads (meetings and tasks) ---------- */
function threadHtml(M,scope){
  const T=team(),my=me().id,have=Object.entries(M.re||{}).filter(x=>x[1].length),A=(a,x='')=>`data-th="${a}" data-scope="${scope}" ${x}`;
  const reBar=scope==='tk'?'':`<div class="res">${have.map(([e,l])=>`<button type="button" class="re" ${A('react',`data-e="${e}"`)} aria-pressed="${l.includes(my)}">${e}<i>${l.length}</i></button>`).join('')}<button type="button" class="re add" ${A('pick')} aria-expanded="${UI.pick==='b'}">${have.length?'+':'+ React'}</button></div>${UI.pick==='b'?`<div class="re-pick">${EMOJI.map(e=>`<button type="button" ${A('react',`data-e="${e}"`)}>${e}</button>`).join('')}</div>`:''}`;
  const list=`<div class="th-list">${(M.cm||[]).length?M.cm.map((x,i)=>{const z=(x.byId&&findM(x.byId,T))||me(),own=!x.byId||x.byId===my,cr=Object.entries(x.re||{}).filter(q=>q[1].length),picking=UI.pickC===i;
      return `<div class="th-r">${avatar(z)}<div class="th-b"><b>${esc(own?'You':first(z.name))}</b><time>${x.at?whenLabel(x.at):''}</time><p>${mentionHtml(x.text)}</p><div class="cres">${cr.map(([e,l])=>`<button type="button" class="re sm" ${A('creact',`data-i="${i}" data-e="${e}"`)} aria-pressed="${l.includes(my)}">${e}<i>${l.length}</i></button>`).join('')}<button type="button" class="re sm add" ${A('cpick',`data-i="${i}"`)}>+</button></div>${picking?`<div class="re-pick">${EMOJI.map(e=>`<button type="button" ${A('creact',`data-i="${i}" data-e="${e}"`)}>${e}</button>`).join('')}</div>`:''}</div>${own?`<button type="button" class="th-x" ${A('delcm',`data-i="${i}"`)} aria-label="Remove">×</button>`:'<span></span>'}</div>`}).join(''):scope==='tk'?'':'<p class="th-empty">No comments yet. Leave a note for whoever is on it.</p>'}</div>`;
  return `<div class="thread">${reBar}${list}<div class="th-box"><textarea class="cbox" ${A('box')} rows="1" maxlength="500" placeholder="${scope==='tk'?'Add a comment…':'Comment, @ someone to mention them'}">${esc(UI.thDraft&&UI.thDraft.scope===scope?UI.thDraft.text:'')}</textarea><button type="button" class="th-send" ${A('comment')} aria-label="Send">${I.send}</button></div></div>`;
}
function threadTarget(scope){return scope==='ev'?(UI.draft&&UI.draft.id?metaOf(UI.draft.id):null):(UI.tkEdit?taskById(UI.tkEdit):null)}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-th]');if(!b) return;const a=b.dataset.th,scope=b.dataset.scope,M=threadTarget(scope);if(!M||a==='box') return;
  if(team().cloud&&typeof gate==='function'&&gate('comment')) return;
  M.re=M.re||{};M.cm=M.cm||[];const my=me().id,tog=(re,em)=>{const l=re[em]=re[em]||[],i=l.indexOf(my);i<0?l.push(my):l.splice(i,1);if(!l.length) delete re[em]};
  let undo=null;
  if(a==='pick') UI.pick=UI.pick==='b'?null:'b';
  else if(a==='cpick'){const i=+b.dataset.i;UI.pickC=UI.pickC===i?null:i}
  else if(a==='react'){tog(M.re,b.dataset.e);UI.pick=null}
  else if(a==='creact'){const x=M.cm[+b.dataset.i];if(x){x.re=x.re||{};tog(x.re,b.dataset.e)}UI.pickC=null}
  else if(a==='comment'){const ta=b.parentElement.querySelector('textarea'),text=(ta.value||'').trim();if(!text){ta.focus();return}M.cm.push({id:uid(),by:'You',byId:my,text,at:Date.now()});UI.thDraft=null}
  else if(a==='delcm'){undo=snapshot();M.cm.splice(+b.dataset.i,1)}
  save();if(scope==='ev') renderPop();else renderTaskDetail();if(scope==='ev') renderSide();
  if(undo) toast('Comment removed',undo);
});
document.addEventListener('input',e=>{const t=e.target;if(t.matches&&t.matches('.cbox')){UI.thDraft={scope:t.dataset.scope,text:t.value};t.style.height='38px';t.style.height=Math.min(110,t.scrollHeight)+'px'}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&e.target.matches&&e.target.matches('.cbox')){e.preventDefault();const b=e.target.parentElement.querySelector('[data-th=comment]');if(b) b.click()}});

/* ---------- team view ---------- */
function renderTeam(){
  const T=team(),H=home(),day=UI.day,[a,b]=dayRange(day),c=ctx(day),now=Date.now(),M=T.members;
  const tt=$('#teamTitle');if(document.activeElement!==tt) tt.textContent=T.name;
  $('#teamSub').textContent=`${M.length} ${M.length===1?'person':'people'} · ${dayLabel(day)}${day===today()?'':', '+fmtDate(a+12*HR,H)}`;
  $$('#durSeg button').forEach(x=>x.classList.toggle('on',+x.dataset.dur===UI.dur));
  $('#tmToday').hidden=day===today();
  $('#tmDay').className='tm-day'+(day===today()?' today':'');$('#tmDay').innerHTML=`<b>${DAYS[dowOf(day)]} ${+day.slice(8)}</b><small>${day===today()?'Today':fmtDate(a+12*HR,H).replace(/^\w+,?\s*/,'')}</small>`;
  const w=windowsFor(day,M,UI.dur,15);
  const upcoming=w.list.filter(x=>x.end>now||day!==today());
  $('#tmStrip').innerHTML=`<span class="lbl">${M.length>1?`Best for ${UI.dur} min:`:'Add teammates to find a shared time.'}</span>`+(M.length>1?(upcoming.length?upcoming.slice(0,5).map(x=>{const st=day===today()?Math.max(x.start,r15(now)):x.start;return `<button type="button" class="bw${w.max<w.total?' part':''}" data-book="${st}" title="Book ${fmtT(st,H)} for everyone">${fmtT(st,H)}${x.end-x.start>UI.dur*MIN?` – ${fmtT(x.end,H)}`:''} <small>${w.max===w.total?'everyone':`${w.max} of ${w.total}`}</small></button>`}).join(''):'<span class="lbl">No shared window today.</span>'):'')
    +`<div class="legend"><span><i class="lg-work"></i>Online</span><span><i class="lg-off"></i>Off</span><span><i class="lg-sleep"></i>Asleep</span><span><i style="background:var(--ev-purple)"></i>Booked</span><span><i style="background:rgba(183,156,240,.35);border:1px solid var(--lav)"></i>Best window</span></div>`;
  const pct=t=>clamp((t-a)/(b-a)*100,0,100);
  let ruler='';for(let h=0;h<24;h++) ruler+=`<span style="left:${h/24*100}%" data-h="${h}">${fmtHr(a+h*HR,H)}</span>`;
  const row=z=>{
    const parts_=[...c.sleep[z.id].map(([s,e])=>[s,e,'sleep']),...c.work[z.id].map(([s,e])=>[s,e,'work'])].map(([s,e,k])=>[Math.max(s,a),Math.min(e,b),k]).filter(x=>x[1]>x[0]).sort((x,y)=>x[0]-y[0]);
    const blocks=[];let at=a;for(const [s,e,k] of parts_){if(s>at) blocks.push([at,s,'off']);if(e>at){blocks.push([Math.max(s,at),e,k]);at=e}}if(at<b) blocks.push([at,b,'off']);
    const segs=blocks.map(([s,e,k])=>{const w=pct(e)-pct(s),L=k==='sleep'?'Asleep':k==='work'?'Online':'Off';return `<div class="seg s-${k}" style="left:calc(${pct(s)}% + 2px);width:calc(${w}% - 4px)" title="${L} · ${fmtT(s,z.tz)} – ${fmtT(e,z.tz)} ${esc(z.isMe?'your time':first(z.name)+"'s time")}">${k==='sleep'&&w>6?`<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M10 8.3A4.8 4.8 0 0 1 3.9 2a4.8 4.8 0 1 0 6.1 6.3z"/></svg>`:''}</div>`});
    const evs=c.busy[z.id].filter(x=>x[1]>a&&x[0]<b).map(x=>{const l=pct(x[0]),wd=pct(x[1])-l,col=colorOf(x);return `<div class="s-ev ${col}" style="left:${l}%;width:${Math.max(wd,.8)}%;--bg:var(--ev-${col==='pend'||col==='cal'?'white':col})" data-ev="${x[3]||''}" data-s="${x[0]}" data-who="${z.id}" title="${esc(x[2])} · ${fmtT(x[0],z.tz)} – ${fmtT(x[1],z.tz)} ${esc(z.isMe?'':first(z.name)+"'s time")}">${wd>5?esc(x[2]):''}</div>`});
    // their midnight, so a day change is visible on the row
    const mids=[];for(const D of localDates(z.tz,a,b)){const t=zonedToUtc(z.tz,D.y,D.m,D.d,0,0);if(t>a&&t<b) mids.push(`<div class="mid" style="left:${pct(t)}%"><i>${fmtDate(t,z.tz)}</i></div>`)}
    const k=statusAt(z,now,c),cur=UI.hover||now;
    return `<div class="tm-row${z.isMe?' me':''}" data-m="${z.id}"><div class="tm-who" data-member="${z.id}" title="${esc(KIND_LABEL[kindOf(z)])}">${avatar(z,'',k[0])}<span class="nm"><b>${esc(z.isMe?'You':z.name)}</b><small>${esc(tzLabel(z.tz))} · ${offLabel(z.tz,now)}${kindOf(z)==='invited'?' · invited':''}</small></span><span class="lt${UI.hover?' hov':''}" data-lt="${z.id}">${fmtT(cur,z.tz)}<small>${UI.hover?dayMark(cur,z.tz)||'at cursor':k[1]}</small></span></div>
      <div class="tl" data-tl="${z.id}">${segs.join('')}${mids.join('')}${evs.join('')}</div></div>`};
  const mid=a+12*HR,offOf=z=>tzOffset(z.tz,mid),mine=offOf(me()),groups=new Map();
  for(const z of M){const o=offOf(z);if(!groups.has(o)) groups.set(o,[]);groups.get(o).push(z)}
  const order=[...groups.keys()].sort((x,y)=>(x===mine?-1:y===mine?1:x-y));
  const zbar=list=>{
    const tz=list[0].tz,cities=[...new Set(list.map(z=>tzLabel(z.tz)))],p0=parts(tz,a),first=a+((60-p0.mi)%60)*MIN;
    let hrs='';for(let t=first;t<b;t+=HR){const h=parts(tz,t).h;hrs+=`<span style="left:${pct(t)}%" data-h="${h}"${h===0?' class="day"':''}>${h===0?esc(fmtDate(t,tz).replace(/,.*$/,'')):fmtHr(t,tz)}</span>`}
    return `<div class="tm-zbar" data-tz="${esc(tz)}"><div class="zl"><b>${esc(cities.join(', '))}</b><small>${offLabel(tz,now)} · ${fmtT(now,tz)} now</small></div><div class="rl">${hrs}</div></div>`};
  const rows=order.map(o=>(o===mine?'':zbar(groups.get(o)))+groups.get(o).sort((x,y)=>(y.isMe?1:0)-(x.isMe?1:0)).map(row).join('')).join('');
  const wins=w.list.map(x=>`<div class="win${w.max<w.total?' part':''}" style="left:${pct(x.start)}%;width:${pct(x.end)-pct(x.start)}%"></div>`).join('');
  $('#tmWrap').innerHTML=`<div class="tm-ruler"><div></div><div class="rl" id="tmRuler">${ruler}${UI.hover?`<span class="cur" style="left:${pct(UI.hover)}%">${fmtT(UI.hover,H)}</span>`:''}</div></div>
    <div class="tm-rows" id="tmRows"><div class="tm-layer">${M.length>1?wins:''}${day===today()?`<div class="now" style="left:${pct(now)}%"></div>`:''}${UI.hover?`<div class="hov" style="left:${pct(UI.hover)}%"></div>`:''}</div>${rows}</div>
    ${M.length<2?`<p class="tm-empty"><b>It is just you so far.</b> Add the people you work with, with their city and online hours, and this page shows who is awake, who is free and the hours you all share.</p>`:''}`;
  fitRuler();
}
function fitRuler(){const rl=$('#tmRuler');if(!rl) return;const w=rl.clientWidth,step=w/24,need=S.hour12?40:36,every=[1,2,3,4,6,8,12].find(e=>step*e>=need)||12;$$('#tmRuler span[data-h],#tmRows .tm-zbar span[data-h]').forEach(s=>s.classList.toggle('hide',(+s.dataset.h)%every!==0))}
let rsT=0;addEventListener('resize',()=>{if(UI.view==='team') fitRuler();if(UI.draft) placePop();clearTimeout(rsT);rsT=setTimeout(()=>{if(UI.view==='calendar') renderCal()},150)});
// hover: the cursor column shows each person's local time
function tmHover(t){
  const prev=UI.hover;UI.hover=t;if(!!prev===!!t&&t&&Math.abs(prev-t)<MIN) return;
  const [a,b]=dayRange(UI.day),now=Date.now(),cur=t||now,pct=x=>clamp((x-a)/(b-a)*100,0,100);
  for(const z of team().members){const el=$(`[data-lt="${z.id}"]`);if(!el) continue;const k=statusAt(z,now,ctx(UI.day));el.classList.toggle('hov',!!t);el.innerHTML=`${fmtT(cur,z.tz)}<small>${t?(dayMark(cur,z.tz)||'at cursor'):k[1]}</small>`}
  const rl=$('#tmRuler');if(rl){let c=rl.querySelector('.cur');if(t){if(!c){c=document.createElement('span');c.className='cur';rl.append(c)}c.style.left=pct(t)+'%';c.textContent=fmtT(t,home())}else if(c) c.remove()}
  for(const zb of $$('#tmRows .tm-zbar')){const rl2=zb.querySelector('.rl');let c2=rl2.querySelector('.cur');if(t){if(!c2){c2=document.createElement('span');c2.className='cur';rl2.append(c2)}c2.style.left=pct(t)+'%';c2.textContent=fmtT(t,zb.dataset.tz)}else if(c2) c2.remove()}
  const layer=$('#tmRows .tm-layer');if(layer){let h=layer.querySelector('.hov');if(t){if(!h){h=document.createElement('div');h.className='hov';layer.append(h)}h.style.left=pct(t)+'%'}else if(h) h.remove()}
}
function tmTimeAt(e){const tl=e.target.closest('.tl')||$('#tmRows .tl');if(!tl) return null;const r=tl.getBoundingClientRect(),[a,b]=dayRange(UI.day);return Math.round((a+(clamp((e.clientX-r.left)/r.width,0,1))*(b-a))/(5*MIN))*5*MIN}
$('#tmWrap').addEventListener('mousemove',e=>{if(!e.target.closest('.tl,.tm-ruler .rl,.tm-zbar .rl')) return;const t=tmTimeAt(e);if(t!=null) tmHover(t)});
$('#tmWrap').addEventListener('mouseleave',()=>tmHover(null));
$('#tmWrap').addEventListener('click',e=>{
  const ev=e.target.closest('.s-ev');if(ev){openEvent(ev.dataset.ev,ev.dataset.s,ev.dataset.who);return}
  const who=e.target.closest('[data-member]');if(who){const z=findM(who.dataset.member);if(z.isMe) openSettings('schedule');else openMember(z.id);return}
  const tl=e.target.closest('.tl');if(tl){const t=r15(tmTimeAt(e)),z=findM(tl.dataset.tl),who=new Set([me().id]);if(z&&!z.isMe) who.add(z.id);openDraft({s:t,e:t+UI.dur*MIN,title:'',loc:'',kind:'meet',who});return}
  if(e.target.closest('.tm-ruler .rl')){const t=r15(tmTimeAt(e));openDraft({s:t,e:t+UI.dur*MIN,title:'',loc:'',kind:'meet',who:new Set(team().members.map(z=>z.id))})}
});
$('#tmStrip').addEventListener('click',e=>{const b=e.target.closest('[data-book]');if(!b) return;const s=+b.dataset.book;openDraft({s,e:s+UI.dur*MIN,title:'',loc:'',kind:'meet',who:new Set(team().members.map(z=>z.id))})});
$('#durSeg').addEventListener('click',e=>{const b=e.target.closest('[data-dur]');if(!b) return;UI.dur=+b.dataset.dur;if(typeof savePrefs==='function') savePrefs();renderTeam()});
$('#tmPrev').onclick=()=>gotoDay(shiftDay(UI.day,-1));$('#tmNext').onclick=()=>gotoDay(shiftDay(UI.day,1));$('#tmToday').onclick=()=>gotoDay(today());
$('#tmAdd').onclick=()=>openMember(null);
$('#tmInvite').onclick=()=>openInvite();
{const tt=$('#teamTitle');
  tt.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();tt.blur()}else if(e.key==='Escape'){tt.textContent=team().name;tt.blur()}});
  tt.addEventListener('blur',()=>{const v=tt.textContent.replace(/\s+/g,' ').trim().slice(0,40),T=team();if(v&&v!==T.name){T.name=v;save();toast('Team renamed')}tt.textContent=T.name;renderSide()})}

/* ---------- tasks ---------- */
function tkAssignSet(){const ids=new Set(team().members.map(m=>m.id));if(!UI.tkAssign) UI.tkAssign=new Set();UI.tkAssign=new Set([...UI.tkAssign].filter(id=>ids.has(id)));if(!UI.tkAssign.size) UI.tkAssign.add(me().id);return UI.tkAssign}
function renderTasks(){
  const T=team(),m=me(),my=m.id,H=home(),now=Date.now(),tasks=tasksOf(T),f=UI.tkf||'open',AS=tkAssignSet();
  const open=tasks.filter(t=>!t.done),late=open.filter(t=>taskDue(t).state==='overdue').length,mine=open.filter(t=>t.to.includes(my)).length;
  const IN=inbox(),inv=IN.rq.filter(n=>n.kind==='inv').sort((a,b)=>a.s-b.s),sent=IN.rq.filter(n=>n.kind==='join'||n.kind==='post'),upcoming=(m.events||[]).filter(x=>!x.pend&&x.e>=dayRange(today())[0]&&x.s<now+30*DAY).sort((a,b)=>a.s-b.s);
  $('#tkSum').textContent=[open.length?`${open.length} open`:'no open tasks',late?`${late} overdue`:'',inv.length?`${inv.length} ${inv.length===1?'invite':'invites'} to answer`:''].filter(Boolean).join(' · ');
  $$('#tkSeg button').forEach(b=>{b.classList.toggle('on',b.dataset.tkf===f);const n={open:open.length+inv.length,mine:mine+inv.length,mt:inv.length,done:tasks.length-open.length}[b.dataset.tkf];b.querySelector('i').textContent=n||''});
  const sel=T.members.filter(z=>AS.has(z.id));
  $('#tkWho').innerHTML=sel.slice(0,3).map(z=>avatar(z)).join('')+(sel.length>3?`<span class="av more">+${sel.length-3}</span>`:'');
  $('#tkForLbl').textContent=sel.length===1?(sel[0].isMe?'For me':'For '+first(sel[0].name)):`For ${sel.length}`;
  tkForList();tkDueLabel();
  const item=t=>{const d=taskDue(t),who=t.to.map(id=>findM(id,T)).filter(Boolean);
    return `<div class="tk ${d.state}${t.done?' done':''}${UI.tkEdit===t.id?' sel':''}" data-tkopen="${t.id}" role="button" tabindex="0"><button type="button" class="tk-ck" data-tkdone="${t.id}" aria-label="${t.done?'Mark not done':'Mark done'}">${t.done?I.check:''}</button>
      <div class="tk-main"><div class="tk-title">${esc(t.title)}</div><div class="tk-meta"><span class="tk-due">${esc(d.label)}</span><span>${t.to.length?`for ${esc(tkNames(T,t.to))}`:'unassigned'}</span>${t.by&&t.by!==my?`<span>from ${esc(tkName(T,t.by))}</span>`:''}${(t.cm||[]).length?`<span>💬 ${t.cm.length}</span>`:''}${t.note?'<span>has details</span>':''}${(t.files||[]).length?`<span>${t.files.length} ${t.files.length===1?'file':'files'}</span>`:''}</div></div>
      <span class="avs sm">${who.slice(0,4).map(z=>avatar(z)).join('')}</span>${tkCan(t)?`<button type="button" class="tk-x" data-tkdel="${t.id}" aria-label="Delete">${I.trash}</button>`:'<span></span>'}</div>`};
  const invItem=n=>{const x=n.ev,when=n.missed?'Passed, no answer':`${whenLabel(x.s)} to ${fmtT(x.e,H)}`;
    return `<div class="tk mt ${mtState(x)}" data-openev="${x.id}" role="button" tabindex="0"><span class="tk-mk">${I.cal16}</span><div class="tk-main"><div class="tk-title">${esc(x.title||'Meeting')}</div><div class="tk-meta"><span class="tk-due">${esc(when)}</span><span>${esc(cap(tkName(T,x.req)))} invited you</span></div></div>
      <span class="tk-acts">${n.missed?`<button type="button" class="btn sm ghost" data-dec="${x.id}">Dismiss</button>`:`<button type="button" class="btn sm dark" data-acc="${x.id}">Accept</button><button type="button" class="btn sm ghost" data-dec="${x.id}">Decline</button>`}</span><span></span></div>`};
  const bookItem=x=>{const p=(x.who||[]).filter(id=>id!==my).map(id=>findM(id,T)).filter(Boolean),wait=p.filter(z=>(z.events||[]).some(q=>q.id===x.id&&q.pend));
    return `<div class="tk mt ${mtState(x)}" data-openev="${x.id}" role="button" tabindex="0"><span class="tk-mk">${I.cal16}</span><div class="tk-main"><div class="tk-title">${esc(x.title||'Meeting')}</div><div class="tk-meta"><span class="tk-due">${esc(whenLabel(x.s))} to ${fmtT(x.e,H)}</span>${p.length?`<span>with ${esc(tkNames(T,p.map(z=>z.id)))}</span>`:''}${wait.length?`<span>waiting for ${esc(wait.map(z=>first(z.name)).join(', '))}</span>`:''}</div></div><span class="avs sm">${p.slice(0,4).map(z=>avatar(z)).join('')}</span><span></span></div>`};
  const sentItem=n=>`<div class="tk mt" data-openev="${n.id}" role="button" tabindex="0"><span class="tk-mk">${I.cal16}</span><div class="tk-main"><div class="tk-title">${esc(n.t)}</div><div class="tk-meta"><span class="tk-due">${esc(whenLabel(n.s))}</span><span>No answer yet.</span></div></div><span></span><span></span></div>`;
  let list;const rb=$('#tkResolve');rb.hidden=true;
  if(f==='done'){const done=tasks.filter(t=>t.done).sort((x,y)=>y.done-x.done);
    list=done.length?`<div class="tk-grp">Done <i>${done.length}</i><button type="button" class="tlink" data-tkclear>Delete all done</button></div>${done.map(item).join('')}`:'<p class="tab-note">Nothing finished yet. Tick a task when it is done and it lands here.</p>'}
  else if(f==='mt'){
    const need=inv.length?`<div class="tk-grp">Needs your answer <i>${inv.length}</i></div>${inv.map(invItem).join('')}`:'';
    const asked=sent.length?`<div class="tk-grp">Sent by you <i>${sent.length}</i></div>${sent.map(sentItem).join('')}`:'';
    const booked=[['today','Today'],['week','This week'],['later','Later']].map(([k,l])=>{const g=upcoming.filter(x=>{const st=mtState(x);return st===k||(k==='today'&&st==='overdue')});return g.length?`<div class="tk-grp">${l} <i>${g.length}</i></div>${g.map(bookItem).join('')}`:''}).join('');
    list=need+asked+booked||'<p class="tab-note">No invites to answer and nothing booked for the next 30 days. Pick a free slot in the calendar, or a best window on the Team page, to book one.</p>';
  }
  else{
    const vis=tasks.filter(t=>!t.cleared&&(f!=='mine'||t.to.includes(my))),resolved=vis.filter(t=>t.done).length;rb.hidden=!resolved;rb.textContent=`Clear ${resolved} done`;
    const pool=vis.map(t=>{const dl=taskDue({...t,done:null});return {t,state:dl.state,ms:dl.ms,at:t.at||0}}).concat(inv.map(n=>({inv:n,state:mtState(n.ev),ms:n.ev.s,at:0}))).sort((x,y)=>x.ms-y.ms||x.at-y.at);
    list=pool.length?TK_GROUPS.map(([k,l])=>{const g=pool.filter(x=>x.state===k);if(!g.length) return '';return `<div class="tk-grp">${l} <i>${g.length}</i></div>`+g.map(x=>x.inv?invItem(x.inv):item(x.t)).join('')}).join('')
      :`<p class="tab-note">${f==='mine'?'Nothing on your plate. Tasks assigned to you and invites waiting on your answer show up here.':'No open tasks. Add one above, for yourself or for anyone on the team.'}</p>`;
  }
  $('#tkList').innerHTML=list;
  renderTaskDetail();
}
function tkForList(){const T=team(),AS=tkAssignSet(),q=($('#tkForQ').value||'').trim().toLowerCase();$('#tkForList').innerHTML=T.members.filter(z=>!q||z.name.toLowerCase().includes(q)).map(z=>`<button type="button" class="opt" data-tkav="${z.id}" aria-pressed="${AS.has(z.id)}"><span class="ck">${I.check}</span>${avatar(z,'sm')}<span class="n">${esc(z.isMe?'Me':z.name)}<small>${esc(tzLabel(z.tz))}</small></span></button>`).join('')||'<p class="tab-note" style="padding:10px">Nobody by that name.</p>'}
function tkDueLabel(){const f=$('#fTask'),d=f.day.value,t=f.time.value;let l='Due';if(d){l=dayLabel(d);if(t){const [y,mo,dd]=d.split('-').map(Number),[h,mi]=t.split(':').map(Number);l+=', '+fmtT(zonedToUtc(home(),y,mo,dd,h,mi),home())}}$('#tkDueLbl').textContent=l;$('#tkDueBtn').classList.toggle('on',!!d)}
function tkDd(which){for(const [k,b] of [['tkForDd','tkForBtn'],['tkDueDd','tkDueBtn']]){const on=which===k;$('#'+k).hidden=!on;$('#'+b).setAttribute('aria-expanded',on)}if(which==='tkForDd') $('#tkForQ').focus();if(which==='tkDueDd') $('#fTask').day.focus()}
$('#tkForBtn').onclick=()=>tkDd($('#tkForDd').hidden?'tkForDd':null);
$('#tkDueBtn').onclick=()=>tkDd($('#tkDueDd').hidden?'tkDueDd':null);
$('#tkDueOk').onclick=()=>tkDd(null);
$('#tkDueClear').onclick=()=>{const f=$('#fTask');f.day.value='';f.time.value='';tkDueLabel();tkDd(null)};
$('#tkForQ').addEventListener('input',tkForList);
['day','time'].forEach(n=>$('#fTask')[n].addEventListener('input',tkDueLabel));
document.addEventListener('pointerdown',e=>{if(!(e.target.closest&&e.target.closest('.tk-dd-wrap,.dd'))) tkDd(null);if(UI.tkPick&&!(e.target.closest&&e.target.closest('#tkdAddBtn,#tkdDd'))){UI.tkPick=false;const d=$('#tkdDd');if(d) d.hidden=true}});
$('#fTask').addEventListener('submit',e=>{
  e.preventDefault();const f=e.target,title=f.title.value.trim();if(!title) return;
  const t=addTask(title,tkAssignSet(),f.day.value,f.time.value);f.title.value='';f.day.value='';f.time.value='';tkDd(null);render();
  toast(`Task added for ${tkNames(team(),t.to)}${t.day?', '+taskDue(t).label.replace(/^Due/,'due'):''}`);f.title.focus();
});
$('#tkSeg').addEventListener('click',e=>{const b=e.target.closest('[data-tkf]');if(!b) return;UI.tkf=b.dataset.tkf;renderTasks()});
$('#tkResolve').onclick=()=>{const T=team(),undo=snapshot(),my=me().id,f=UI.tkf||'open';let n=0;for(const t of tasksOf(T)) if(t.done&&!t.cleared&&(f!=='mine'||t.to.includes(my))){t.cleared=true;n++}save();render();toast(`${n} done ${n===1?'task':'tasks'} cleared. They are under Done.`,undo)};
function openTask(id){UI.tkEdit=id;UI.tkField=null;UI.tkPick=false;UI.pick=null;UI.pickC=null;if(UI.view!=='tasks') setView('tasks',true);render();const t=$('#tkDetail .ttl');if(t&&!taskById(id).title) t.focus()}
function closeTask(){UI.tkEdit=null;renderTasks()}
function renderTaskDetail(){
  const box=$('#tkDetail'),t=UI.tkEdit&&taskById(UI.tkEdit);if(!t){box.hidden=true;box.innerHTML='';return}
  const T=team(),can=tkCan(t),d=taskDue(t),ed=can?UI.tkField:null,who=t.to.map(id=>findM(id,T)).filter(Boolean),cand=T.members.filter(z=>!t.to.includes(z.id)),tz=t.tz||home();
  box.hidden=false;
  box.innerHTML=`<div class="tkd-head"><textarea class="ttl" id="tkdTitle" rows="1" maxlength="120" ${can?'':'readonly'}>${esc(t.title)}</textarea><button type="button" class="xbtn" id="tkdClose" aria-label="Close">×</button></div>
    <p class="by">${esc(t.by===me().id?'You':cap(tkName(T,t.by)))} added this ${esc(dayLabel(dayOf(t.at||Date.now())).toLowerCase())} · <span class="due ${d.state}">${esc(d.label)}</span>${can?'':`<br>Only ${esc(first(tkName(T,t.by)))} and the people it is for can change it.`}</p>
    <div class="sec"><h4>For</h4><div class="whochips">${who.map(z=>`<button type="button" class="who1" data-tkdrm="${z.id}" ${can?'':'disabled'}>${avatar(z)}${esc(z.isMe?'Me':first(z.name))}${can?'<i>×</i>':''}</button>`).join('')}${can&&cand.length?`<button type="button" class="addc" id="tkdAddBtn" aria-label="Add someone">${I.plus}</button>`:''}</div>
      ${can&&UI.tkPick?`<div class="dd" id="tkdDd"><div class="dd-list">${cand.map(z=>`<button type="button" class="opt" data-tkdadd="${z.id}">${avatar(z,'sm')}<span class="n">${esc(z.name)}<small>${esc(tzLabel(z.tz))}</small></span></button>`).join('')}</div></div>`:''}</div>
    <div class="sec"><div class="sec-h"><h4>Due</h4>${can&&ed!=='due'?`<button type="button" class="tkd-pen" data-tkd-edit="due" aria-label="Change the due date" title="Change">${I.pen}</button>`:''}</div>
      ${ed==='due'?`<div class="grid2"><label class="lbl"><input type="date" id="tkdDay" value="${t.day||''}" aria-label="Day"></label><label class="lbl"><input type="time" id="tkdTime" value="${t.time||''}" aria-label="Time, optional"></label></div><div class="tkd-acts"><button type="button" class="btn sm ghost" data-tkd-cancel>Cancel</button><button type="button" class="btn sm dark" data-tkd-save>Save</button></div>`
        :t.day?`<p class="tkd-val">${esc(dayLabel(t.day))}${t.time?` · ${fmtT(taskInstant(t),home())}`:''}</p>${t.time&&tz!==home()?`<p class="by" style="margin-top:4px">Set in ${esc(tzLabel(tz))}. Everyone sees it in their own zone.</p>`:''}`
        :can?`<button type="button" class="tkd-add" data-tkd-edit="due">Add a due date</button>`:'<p class="tkd-val empty">No due date</p>'}</div>
    <div class="sec"><div class="sec-h"><h4>Details</h4>${can&&ed!=='note'&&t.note?`<button type="button" class="tkd-pen" data-tkd-edit="note" aria-label="Edit the details" title="Edit">${I.pen}</button>`:''}</div>
      ${ed==='note'?`<textarea class="note" id="tkdNote" placeholder="Details, links, what done looks like…">${esc(t.note||'')}</textarea><div class="tkd-acts"><button type="button" class="btn sm ghost" data-tkd-cancel>Cancel</button><button type="button" class="btn sm dark" data-tkd-save>Save</button></div>`
        :t.note?`<p class="tkd-val tkd-note">${esc(t.note)}</p>`:can?`<button type="button" class="tkd-add" data-tkd-edit="note">Add details</button>`:'<p class="tkd-val empty">No details</p>'}</div>
    <div class="sec"><h4>Files</h4><div class="files">${(t.files||[]).map((x,i)=>`<span class="file"><button type="button" class="n" data-tkfopen="${i}" title="Open ${esc(x.name)}">${I.file}<span>${esc(x.name)}</span></button><small>${fmtSize(x.size||0)}</small>${can?`<button type="button" class="rm" data-tkfrm="${i}" aria-label="Remove">${I.x}</button>`:''}</span>`).join('')}${can?`<button type="button" class="attach" id="tkdAttach">${I.clip}<span>${(t.files||[]).length?'Add files':'Attach files'}</span></button>`:''}</div></div>
    <div class="sec">${(t.cm||[]).length?`<h4>Comments <span style="font-weight:500;opacity:.7">${t.cm.length}</span></h4>`:''}${threadHtml(t,'tk')}</div>
    <div class="acts">${can?`<button type="button" class="btn dark" id="tkdDone">${t.done?'Mark not done':'Mark done'}</button><button type="button" class="btn ghost danger" id="tkdDel">Delete</button>`:''}</div>`;
  const ta=$('#tkdTitle');ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';
}
const fmtSize=n=>n<1024?n+' B':n<1048576?Math.round(n/1024)+' KB':(n/1048576).toFixed(1)+' MB';
function tkdSave(){const t=UI.tkEdit&&taskById(UI.tkEdit);if(!t||!tkCan(t)) return;
  const title=$('#tkdTitle').value.trim();if(title) t.title=title;
  if($('#tkdNote')) t.note=$('#tkdNote').value.trim();
  if($('#tkdDay')){const was=t.time;t.day=$('#tkdDay').value||null;t.time=(t.day&&$('#tkdTime').value)||null;if(t.time&&(!t.tz||t.time!==was)) t.tz=home()}
  save();render()}
async function tkUpload(t,files){
  const T=team(),big=files.filter(x=>x.size>10485760);if(big.length) toast(`${big.map(x=>x.name).join(', ')} is over 10 MB`);
  const ok=files.filter(x=>x.size<=10485760);if(!ok.length) return;
  if(!(typeof sb!=='undefined'&&sb&&CLOUD.user&&T.cloud)){toast('Files need a team saved to your account');return}
  t.files=t.files||[];toast(`Uploading ${ok.length} ${ok.length===1?'file':'files'}…`);
  for(const file of ok){const id=uid(),path=`${T.id}/${t.id}/${id}-${file.name.replace(/[^\w.\-]+/g,'_').slice(-80)}`;
    const {error}=await sb.storage.from('task-files').upload(path,file,{contentType:file.type||'application/octet-stream'});
    if(error){toast('Could not upload '+file.name);continue}
    t.files.push({id,name:file.name,size:file.size,type:file.type||'',path,by:me().id,at:Date.now()})}
  save();render();toast('Files attached');
}
$('#fileIn').addEventListener('change',e=>{const files=[...e.target.files];e.target.value='';const t=UI.tkEdit&&taskById(UI.tkEdit);if(t&&files.length) tkUpload(t,files)});
$('#tkDetail').addEventListener('click',async e=>{
  const c=s=>e.target.closest(s);let b;const t=UI.tkEdit&&taskById(UI.tkEdit);if(!t) return;
  if(c('#tkdClose')){closeTask();return}
  if(b=c('[data-tkd-edit]')){if(!tkCan(t)) return;UI.tkField=b.dataset.tkdEdit;renderTaskDetail();const f=$(UI.tkField==='note'?'#tkdNote':'#tkdDay');if(f){f.focus();if(f.id==='tkdNote') f.setSelectionRange(f.value.length,f.value.length)}return}
  if(c('[data-tkd-save]')){tkdSave();UI.tkField=null;renderTaskDetail();toast('Saved');return}
  if(c('[data-tkd-cancel]')){UI.tkField=null;renderTaskDetail();return}
  if(c('#tkdAddBtn')){UI.tkPick=!UI.tkPick;renderTaskDetail();return}
  if(b=c('[data-tkdadd]')){t.to.push(b.dataset.tkdadd);UI.tkPick=false;save();render();return}
  if(b=c('[data-tkdrm]')){if(!tkCan(t)) return;t.to=t.to.filter(id=>id!==b.dataset.tkdrm);save();render();return}
  if(c('#tkdDone')){const undo=snapshot();if(t.done){t.done=null;t.cleared=false}else t.done=Date.now();save();render();toast(t.done?'Done. Nice.':'Back on the list',undo);return}
  if(c('#tkdDel')){const undo=snapshot();team().tasks=tasksOf(team()).filter(x=>x.id!==t.id);UI.tkEdit=null;save();render();toast('Task deleted',undo);return}
  if(c('#tkdAttach')){if(team().cloud&&typeof gate==='function'&&gate('files')) return;if(!team().cloud){toast('Files need a team saved to your account. Sign in to keep this team there.');return}$('#fileIn').click();return}
  if(b=c('[data-tkfopen]')){const x=(t.files||[])[+b.dataset.tkfopen];if(!x||typeof sb==='undefined'||!sb) return;const w=window.open('','_blank');const {data,error}=await sb.storage.from('task-files').createSignedUrl(x.path,3600);if(error||!data){if(w) w.close();toast('Could not open '+x.name);return}if(w) w.location=data.signedUrl;else location.href=data.signedUrl;return}
  if(b=c('[data-tkfrm]')){const i=+b.dataset.tkfrm,x=(t.files||[])[i];if(!x) return;t.files.splice(i,1);save();render();if(typeof sb!=='undefined'&&sb) sb.storage.from('task-files').remove([x.path]);toast('File removed')}
});
$('#tkDetail').addEventListener('change',e=>{if(e.target.id==='tkdTitle') tkdSave()});
$('#tkDetail').addEventListener('input',e=>{if(e.target.id==='tkdTitle'){e.target.style.height='auto';e.target.style.height=e.target.scrollHeight+'px'}});
$('#tkDetail').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='tkdTitle'){e.preventDefault();e.target.blur()}if(e.key==='Escape'&&UI.tkField){e.preventDefault();e.stopPropagation();UI.tkField=null;renderTaskDetail()}if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&UI.tkField){e.preventDefault();tkdSave();UI.tkField=null;renderTaskDetail()}});
$('#tkList').addEventListener('click',e=>{
  const c=s=>e.target.closest(s);let b;
  if(b=c('[data-tkdone]')){const t=taskById(b.dataset.tkdone);if(!t) return;if(!tkCan(t)){toast(`Only ${first(tkName(team(),t.by))} and the people it is for can tick this off`);return}const undo=snapshot();if(t.done){t.done=null;t.cleared=false}else t.done=Date.now();save();render();toast(t.done?'Done. Nice.':'Back on the list',undo);return}
  if(b=c('[data-tkdel]')){const t=taskById(b.dataset.tkdel);if(!tkCan(t)) return;const undo=snapshot();team().tasks=tasksOf(team()).filter(x=>x.id!==t.id);if(UI.tkEdit===t.id) UI.tkEdit=null;save();render();toast('Task deleted',undo);return}
  if(b=c('[data-acc]')){answerInvite(b.dataset.acc,true);render();toast('Accepted');return}
  if(b=c('[data-dec]')){answerInvite(b.dataset.dec,false);render();toast('Declined');return}
  if(c('[data-tkclear]')){const undo=snapshot();team().tasks=tasksOf(team()).filter(x=>!x.done);save();render();toast('Done tasks cleared',undo);return}
  if(b=c('[data-tkopen]')){openTask(b.dataset.tkopen);return}
  if(b=c('[data-openev]')){openEvent(b.dataset.openev);return}
});
$('#tkList').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button]')){e.preventDefault();e.target.click()}});
$('#tkForList').addEventListener('click',e=>{const b=e.target.closest('[data-tkav]');if(!b) return;const A=tkAssignSet(),id=b.dataset.tkav;A.has(id)?A.delete(id):A.add(id);if(!A.size) A.add(id);renderTasks();$('#tkForQ').focus()});

/* ---------- inbox ---------- */
function openInbox(on){UI.inbox=on??!UI.inbox;$('#inbox').hidden=!UI.inbox;if(UI.inbox) renderInbox()}
$('#inboxClose').onclick=()=>openInbox(false);
function renderInbox(){
  const ib=inbox(),H=home();
  const rq=ib.rq.map(n=>`<div class="ib${n.act?' act':''}" role="button" tabindex="0" data-ib="${n.kind}" data-id="${n.id||''}" data-task="${n.task||''}">${avatar(n.who)}<span><b>${esc(n.t)}</b><small>${esc(n.sub)}</small>${n.kind==='team'?`<span class="acts"><button type="button" class="btn sm dark" data-tacc="${n.id}">Accept</button><button type="button" class="btn sm ghost" data-tdec="${n.id}">Decline</button></span>`:n.kind==='inv'&&!n.missed?`<span class="acts"><button type="button" class="btn sm dark" data-acc="${n.id}">Accept</button><button type="button" class="btn sm ghost" data-dec="${n.id}">Decline</button></span>`:n.kind==='inv'?`<span class="acts"><button type="button" class="btn sm ghost" data-dec="${n.id}">Dismiss</button></span>`:''}</span></div>`).join('');
  const th=ib.th.map(n=>`<div class="ib${n.act?' act':''}" role="button" tabindex="0" data-ib="th" data-id="${n.id||''}" data-task="${n.task||''}">${avatar(n.who)}<span><b>${esc(n.t)}${n.mention?' · mentions you':n.reply?' · new reply':''}</b><small>${esc(n.sub)}</small></span></div>`).join('');
  $('#ibList').innerHTML=(rq?`<h4>Waiting on you</h4>${rq}`:'')+(th?`<h4>Threads</h4>${th}`:'')+(!rq&&!th?'<p class="ib-empty">All clear. Invites, requests and threads that need you show up here.</p>':'');
}
$('#ibList').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.ib')){e.preventDefault();e.target.click()}});
$('#ibList').addEventListener('click',e=>{
  const c=s=>e.target.closest(s);let b;
  if(b=c('[data-acc]')){answerInvite(b.dataset.acc,true);toast('Accepted');render();return}
  if(b=c('[data-dec]')){answerInvite(b.dataset.dec,false);toast('Declined');render();return}
  if(b=c('[data-tacc]')){b.disabled=true;answerTeamInvite(b.dataset.tacc,true);return}
  if(b=c('[data-tdec]')){b.disabled=true;answerTeamInvite(b.dataset.tdec,false);return}
  if(c('[data-ib="team"]')) return;
  if(b=c('[data-ib]')){openInbox(false);if(b.dataset.task) openTask(b.dataset.task);else if(b.dataset.id){const r=evById(b.dataset.id);if(r){if(UI.view==='tasks') setView('calendar',true);gotoDay(dayOf(r.e.s),true);openEvent(b.dataset.id)}}}
});

/* ---------- settings ---------- */
function openSettings(page='account'){const d=$('#dSettings');renderSettings(page);if(!d.open) d.showModal()}
function renderSettings(page){
  page=page||UI.setPage||'account';UI.setPage=page;
  $$('#setNav button').forEach(b=>b.setAttribute('aria-current',b.dataset.page===page?'page':'false'));
  $$('#dSettings .set-main > section').forEach(s=>s.hidden=s.dataset.page!==page);
  const u=typeof user==='function'?user():null,m=me(),T=team();
  $('#setAccount').innerHTML=u?`<h2>Account</h2><div class="acct">${avatar(m)}<div><b>${esc(u.name)}</b><small>${esc(u.email)}</small></div><button type="button" class="btn" id="acLogout">Log out</button></div>
      <form id="fAcName"><label class="lbl">Name <input name="name" value="${esc(u.name)}" required maxlength="60"></label><div class="dlg-acts"><button type="button" class="btn ghost" id="acPhoto">${I.clip}Change photo</button>${m.photo?'<button type="button" class="btn ghost" id="acPhotoRm">Remove photo</button>':''}<span class="sp"></span><button type="submit" class="btn dark">Save name</button></div></form>
      <h3>Email</h3><form id="fAcEmail"><label class="lbl">Email <input name="email" type="email" value="${esc(u.email)}" required></label><p class="err" id="acEmailMsg" hidden></p><div class="dlg-acts"><button type="submit" class="btn dark">Change email</button></div></form>
      <h3>Password</h3><form id="fAcPass"><div class="grid2"><label class="lbl">New password <input name="pass" type="password" minlength="8" required autocomplete="new-password"></label><label class="lbl">Again <input name="pass2" type="password" minlength="8" required autocomplete="new-password"></label></div><p class="err" id="acPassMsg" hidden></p><div class="dlg-acts"><button type="submit" class="btn dark">Update password</button></div></form>
      <h3>Notifications</h3><p class="hint">Emails go to ${esc(u.email)}.</p><div class="checks">${[['invites','Someone invites me to a meeting'],['mentions','Someone mentions me'],['replies','Someone replies in my thread'],['missed','An invite passed without my answer'],['weekly','A weekly summary']].map(([k,l])=>`<label class="ck"><input type="checkbox" data-notify="${k}" ${({...NOTIFY_DEFAULT,...((CLOUD.profile||{}).notify||{})})[k]?'checked':''}><span></span>${l}</label>`).join('')}</div>
      <h3>Danger zone</h3><p class="hint">Deleting your account removes your profile, your seat in every team and everything you posted. Teams you created pass to a teammate.</p><button type="button" class="btn ghost danger" id="acDelete">Delete my account</button>`
    :'';
  if(page==='schedule'){const f=$('#fSched'),[ss,se]=sleepOf(m);setTz(f.tz,m.tz);f.start.value=hhmm(m.start);f.end.value=hhmm(m.end);f.start2.value=m.start2!=null?hhmm(m.start2):'';f.end2.value=m.end2!=null?hhmm(m.end2):'';f.weekends.checked=!!m.weekends;f.sleepStart.value=hhmm(ss);f.sleepEnd.value=hhmm(se)}
  $$('#clockSeg button').forEach(b=>b.classList.toggle('on',(b.dataset.clock==='12')===!!S.hour12));
  $$('#wsSeg button').forEach(b=>b.classList.toggle('on',+b.dataset.ws===(S.weekStart??1)));
  $$('#themeSeg button').forEach(b=>b.classList.toggle('on',b.dataset.theme===(document.documentElement.dataset.theme||'light')));
  $('#prefDur').value=String(UI.dur);
  // each team is a card: click it for who is in it, when it started, and the ways to bring people in
  if(UI.tOpen===undefined||(UI.tOpen&&!S.teams.some(t=>t.id===UI.tOpen))) UI.tOpen=T.id;
  const now=Date.now(),tcard=t=>{const open=UI.tOpen===t.id,cur=t.id===T.id,n=t.members.length,owner=t.createdBy&&t.members.find(z=>z.uid===t.createdBy||z.id===t.createdBy);
    return `<div class="tcard${open?' open':''}${cur?' cur':''}"><button type="button" class="thead" data-topen="${t.id}" aria-expanded="${open}">
        <span class="tstack">${t.members.slice(0,3).map(z=>avatar(z,'xs')).join('')}</span><span class="tname"><b>${esc(t.name)}${cur?' <span class="cur">current</span>':''}</b><small>${plural(n,'person').replace('persons','people')}${t.at?` · since ${esc(fmtDate(t.at,me().tz).replace(/^\w+, /,''))}`:''} · ${t.cloud?'on your account':'only on this device'}</small></span><span class="tchev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span></button>
      ${open?`<div class="tbody">
        <div class="tmeta"><div><label>Created</label><b>${t.at?esc(fmtDate(t.at,me().tz)):'Before dates were kept'}</b></div><div><label>Started by</label><b>${owner?esc(owner.isMe?'You':owner.name):t.cloud?'Someone who left':'You'}</b></div><div><label>Kept</label><b>${t.cloud?'On your account, for everyone in it':'On this device only'}</b></div></div>
        <label class="tlbl">People · ${n}</label>
        <div class="tpeople">${t.members.map(z=>`<button type="button" class="tperson" data-tperson="${t.id}:${z.id}">${avatar(z,'sm')}<span class="n"><b>${esc(z.name||'Someone')}${z.isMe?' <i>you</i>':''}</b><small>${esc(tzLabel(z.tz))} · ${fmtT(now,z.tz)} now${z.email&&!z.isMe?` · ${esc(z.email)}`:''}</small></span></button>`).join('')}</div>
        <div class="tacts"><button type="button" class="btn dark sm" data-tadd="${t.id}">${I.plus}Add a person</button>${cur?'':`<button type="button" class="btn sm" data-switch="${t.id}">Switch to this team</button>`}</div>
        <label class="tlbl">Invite link</label>
        <div class="copyrow"><input readonly value="${esc(inviteUrl(t))}" aria-label="Invite link for ${esc(t.name)}"><button type="button" class="btn dark" data-tcopy="${t.id}">Copy</button></div>
        <p class="hint">${t.cloud?'Anyone who opens it gets an invite in their Noon inbox and joins when they accept. The same link keeps working.':'The link carries a snapshot of the team, so send a fresh one after big changes. Sign in to get a permanent link.'}</p>
      </div>`:''}</div>`};
  $('#setTeam').innerHTML=`<h2>Teams</h2><p class="hint">Click a team to see who is in it and to bring people in.</p>
    <div class="tlist">${S.teams.map(tcard).join('')}</div>
    <div class="tmore"><div><h3>Start a new team</h3><p class="hint">Another group you plan with. You can be in as many as you like.</p><button type="button" class="btn" id="stNew">${I.plus}New team</button></div>
      <form id="fJoinLink"><h3>Join a team</h3><p class="hint">Someone sent you an invite link? Paste it here.</p><div class="copyrow"><input name="link" required placeholder="Paste an invite link" aria-label="Invite link" autocomplete="off"><button type="submit" class="btn dark">Join</button></div><p class="err" id="joinErr" hidden></p></form></div>`;
  if(typeof renderClaude==='function') renderClaude();
  $('#integList').innerHTML=[['google','Google Calendar','G'],['outlook','Outlook Calendar','O'],['slack','Slack','S']].map(([k,n,l])=>`<div class="integ"><div class="ico">${l}</div><div><b>${n}</b><small>${k==='slack'?'Get invites and mentions in Slack.':'Show your real meetings on your row.'}</small></div><span class="soon">Coming soon</span></div>`).join('');
}
$('#setNav').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b) renderSettings(b.dataset.page)});
$('#dSettings').addEventListener('click',async e=>{
  const c=s=>e.target.closest(s);let b;
  if(c('#acLogout')){$('#dSettings').close();logout();return}
  if(c('#acPhoto')){$('#photoIn').click();return}
  if(c('#acPhotoRm')){for(const z of myTeams()) z.photo='';me().photo='';save();render();renderSettings();toast('Photo removed');return}
  if(c('#acDelete')){if(await confirmDlg('Delete your account?','Your profile, your seat in every team and everything you posted are removed for good. This cannot be undone.','Delete account')){if(await deleteAccount()) $('#dSettings').close()}return}
  if(b=c('[data-clock]')){S.hour12=b.dataset.clock==='12';save();render();renderSettings();if(typeof savePrefs==='function') savePrefs();return}
  if(b=c('[data-ws]')){S.weekStart=+b.dataset.ws;save();render();renderSettings();if(typeof savePrefs==='function') savePrefs();return}
  if(b=c('#themeSeg [data-theme]')){setTheme(b.dataset.theme);return}
  if(b=c('[data-switch]')){S.active=b.dataset.switch;UI.filter=new Set();UI.tkEdit=null;closePop();save();gotoDay(today());renderSettings();toast('Showing '+team().name);return}
  if(c('#stNew')){if(typeof gate==='function'&&gate('team')) return;$('#fTeam').reset();$('#dTeam').showModal();return}
  if(b=c('[data-topen]')){UI.tOpen=UI.tOpen===b.dataset.topen?null:b.dataset.topen;renderSettings();return}
  if(b=c('[data-tcopy]')){const t=S.teams.find(x=>x.id===b.dataset.tcopy);if(!t) return;const i=b.parentElement.querySelector('input');i.select();navigator.clipboard.writeText(inviteUrl(t)).then(()=>toast('Invite link copied'),()=>toast('Press Ctrl+C to copy'));return}
  if((b=c('[data-tadd]'))||(b=c('[data-tperson]'))){const [tid,zid]=(b.dataset.tadd||b.dataset.tperson).split(':');if(S.active!==tid){S.active=tid;UI.filter=new Set();UI.tkEdit=null;closePop();save();gotoDay(today());toast('Showing '+team().name)}$('#dSettings').close();openMember(zid||null);return}
  if(b=c('[data-auth-open]')){$('#dSettings').close();openAuth(b.dataset.authOpen);return}
});
$('#dSettings').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target;
  if(f.id==='fJoinLink'){const J=readJoin(f.link.value);say('#joinErr','');if(!J){say('#joinErr','That is not a Noon invite link. It ends in #join= followed by a code.');return}$('#dSettings').close();startJoin(J);return}
  if(f.id==='fSched'){const tz=f.tz.value.trim();if(!validTz(tz)){f.tz.setCustomValidity('We could not find that place. Try a city, a country, or a code like CET.');f.tz.reportValidity();return}
    const two=f.start2.value&&f.end2.value,d={tz,start:toH(f.start.value),end:toH(f.end.value),start2:two?toH(f.start2.value):null,end2:two?toH(f.end2.value):null,weekends:f.weekends.checked,sleepStart:toH(f.sleepStart.value),sleepEnd:toH(f.sleepEnd.value)};
    const mine=typeof myTeams==='function'?myTeams():[];(mine.length?mine:[]).forEach(z=>Object.assign(z,d));Object.assign(me(),d);save();ctxMap.clear();winMap.clear();gotoDay(today());toast('Schedule saved');return}
  if(f.id==='fAcName'){const name=f.name.value.trim();if(!name) return;for(const z of myTeams()) z.name=name;me().name=name;if(CLOUD.profile) CLOUD.profile.name=name;save();render();renderSettings();toast('Name saved');return}
  if(f.id==='fAcEmail'){const msg=await changeEmail(f.email.value.trim().toLowerCase());say('#acEmailMsg',msg,!/already|wrong|invalid/i.test(msg));return}
  if(f.id==='fAcPass'){if(f.pass.value!==f.pass2.value){say('#acPassMsg','The two passwords do not match.');return}const err=await changePassword(f.pass.value);say('#acPassMsg',err||'Password updated.',!err);if(!err) f.reset();return}
});
$('#dSettings').addEventListener('change',e=>{const c=e.target.closest('[data-notify]');if(c){const nt={...NOTIFY_DEFAULT,...((CLOUD.profile||{}).notify||{}),[c.dataset.notify]:c.checked};saveProfile({notify:nt}).then(ok=>{if(ok) toast('Notifications saved')})}if(e.target.id==='prefDur'){UI.dur=+e.target.value;if(typeof savePrefs==='function') savePrefs();toast('Default length saved')}});
$('#dSettings').addEventListener('input',e=>{if(e.target.name==='tz') e.target.setCustomValidity('')});
$('#photoIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f) uploadPhoto(f)});
$('#fTeam').addEventListener('submit',e=>{
  const name=e.target.name.value.trim();if(!name){e.preventDefault();return}
  if(typeof CLOUD!=='undefined'&&CLOUD.user){createCloudTeam(name).then(id=>{if(id){toast('Team created');renderSettings()}});return}
  const t={id:uid(),name,at:Date.now(),members:[{...me(),id:uid(),events:[],threads:[]}],tasks:[]};S.teams.push(t);S.active=t.id;save();gotoDay(today());renderSettings();toast('Team created');
});

/* ---------- people ---------- */
let editing=null;
function openMember(id){
  editing=id;const f=$('#fMember'),m=id&&findM(id),k=m&&kindOf(m),locked=k==='joined'||(m&&team().cloud&&!m.isMe&&m.addedBy&&CLOUD.user&&m.addedBy!==CLOUD.user.id);
  $('#mTitle').textContent=m?m.name:'Add a person';$('#mSave').textContent=m?'Save changes':'Add person';$('#mDelete').hidden=!m||m.isMe;$('#mMailRow').hidden=!!m;
  const note=$('#mNote');note.hidden=!m||!locked;if(m&&locked) note.textContent=k==='joined'?`${first(m.name)} joined with their own account and keeps their own schedule. You can still remove them from the team.`:`${first(m.name)} was added by a teammate, so only they can change these details.`;
  f.reset();if(m){f.name.value=m.name;f.email.value=m.email||'';setTz(f.tz,m.tz);f.start.value=hhmm(m.start);f.end.value=hhmm(m.end);f.start2.value=m.start2!=null?hhmm(m.start2):'';f.end2.value=m.end2!=null?hhmm(m.end2):'';const [ss,se]=sleepOf(m);f.sleepStart.value=hhmm(ss);f.sleepEnd.value=hhmm(se);f.weekends.checked=!!m.weekends;f.photo.value=m.photo||''}
  else setTz(f.tz,'');
  for(const el of f.elements) if(el.type!=='button'&&el.type!=='submit') el.disabled=!!locked;$('#mSave').hidden=!!locked;
  $('#dMember').showModal();setTimeout(()=>f.name.focus(),50);
}
$('#fMember').addEventListener('submit',e=>{
  const f=e.target;
  if(!validTz(f.tz.value)){e.preventDefault();f.tz.setCustomValidity('We could not find that place. Try a city, a country, or a code like CET.');f.tz.reportValidity();return}
  f.tz.setCustomValidity('');
  const two=f.start2.value&&f.end2.value,data={name:f.name.value.trim(),email:f.email.value.trim(),tz:f.tz.value,start:toH(f.start.value),end:toH(f.end.value),sleepStart:toH(f.sleepStart.value),sleepEnd:toH(f.sleepEnd.value),start2:two?toH(f.start2.value):null,end2:two?toH(f.end2.value):null,weekends:f.weekends.checked,photo:f.photo.value.trim()};
  const T=team();
  if(editing){const z=findM(editing);if(!z||kindOf(z)==='joined') return;Object.assign(z,data);toast('Changes saved')}
  else{
    if(data.email&&team().cloud&&typeof gate==='function'&&gate('invite')){e.preventDefault();return}
    T.members.push(mk(data.name,data.tz,data.start,data.end,{...data,status:data.email?'invited':'active',joined:false,events:[],threads:[]}));
    if(f.mail.checked&&data.email){const body=`Hi ${first(data.name)},\n\nI added you to "${T.name}" on Noon so we can find meeting times that work across timezones. Join here:\n${inviteUrl()}`;setTimeout(()=>{location.href=`mailto:${data.email}?subject=${encodeURIComponent('Join '+T.name+' on Noon')}&body=${encodeURIComponent(body)}`},50)}
    toast(first(data.name)+' added');
  }
  ctxMap.clear();winMap.clear();save();render();
});
$('#fMember').addEventListener('input',e=>{if(e.target.name==='tz') e.target.setCustomValidity('')});
$('#mDelete').onclick=async()=>{
  const T=team(),z=findM(editing);if(!z||z.isMe) return;
  if(!await confirmDlg(`Remove ${first(z.name)} from the team?`,`${z.name} disappears from ${T.name}, along with what is booked on their row. You can undo this right after.`)) return;
  const undo=snapshot();(T.gone=T.gone||{})[z.id]={name:z.name,photo:z.photo||'',tz:z.tz};T.members=T.members.filter(x=>x!==z);for(const t of T.tasks||[]) t.to=t.to.filter(id=>id!==z.id);UI.filter.delete(z.id);
  $('#dMember').close();ctxMap.clear();winMap.clear();save();render();toast(`${first(z.name)} removed from the team`,undo);
};
function openInvite(){if(team().cloud&&typeof gate==='function'&&gate('invite')) return;$('#inviteLink').value=inviteUrl();$('#inviteNote').textContent=team().cloud?'Anyone who opens it gets an invite in their Noon inbox and joins when they accept. The same link keeps working.':'The link carries a snapshot of the team, so send a fresh one after big changes. Sign in to get a permanent link.';$('#dInvite').showModal()}
$('#copyInvite').onclick=()=>{$('#inviteLink').select();navigator.clipboard.writeText($('#inviteLink').value).then(()=>toast('Invite link copied'),()=>toast('Press Ctrl+C to copy'))};
$('#inviteAdd').onclick=()=>{$('#dInvite').close();openMember(null)};
$('#fJoin').addEventListener('submit',e=>{
  const f=e.target,snap=window.__join;if(!snap) return;
  if(!validTz(f.tz.value)){e.preventDefault();f.tz.setCustomValidity('We could not find that place.');f.tz.reportValidity();return}
  const mine=mk(f.name.value.trim(),f.tz.value,toH(f.start.value),toH(f.end.value),{isMe:true,sleepStart:toH(f.sleepStart.value),sleepEnd:toH(f.sleepEnd.value),events:[],threads:[]});
  const others=snap.m.map(x=>mk(x.n,x.z,x.s,x.f,{email:x.e||'',cal:!!x.k,...(x.q?{sleepStart:x.q[0],sleepEnd:x.q[1]}:{}),...(x.b?{start2:x.b[0],end2:x.b[1]}:{}),weekends:!!x.w,photo:x.p||'',joined:true,conn:[],events:[],threads:[]})).filter(z=>z.name!==mine.name);
  const t={id:uid(),name:snap.n,members:[mine,...others],tasks:[]};S.teams.push(t);S.active=t.id;save();history.replaceState(null,'',location.pathname+location.search);gotoDay(today());toast('Welcome to '+snap.n);
});

/* ---------- global clicks ---------- */
document.addEventListener('click',e=>{
  const c=s=>e.target.closest(s);let b;
  if(b=c('[data-close]')){const d=b.closest('dialog');if(d) d.close();return}
  if(b=c('[data-nav]')){const k=b.dataset.nav;if(k==='settings') openSettings();else setView(k);return}
  if(b=c('[data-open-settings]')){if(typeof user==='function'&&!user()) openAuth('login');else openSettings(b.dataset.openSettings);return}
  if(c('#themeSwitch')){setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');return}
  if(c('#bellBtn')||c('[data-tab-inbox]')){openInbox();return}
  if(b=c('[data-auth-open]')){if(!b.closest('#dSettings')) openAuth(b.dataset.authOpen);return}
  if(b=c('[data-auth]')){authTab(b.dataset.auth);return}
  if(b=c('[data-open-ev]')){if(UI.view==='tasks') setView('calendar',true);gotoDay(dayOf(+b.dataset.s),true);openEvent(b.dataset.openEv||'',b.dataset.s);return}
  if(b=c('[data-filter]')){const id=b.dataset.filter;UI.filter.has(id)?UI.filter.delete(id):UI.filter.add(id);renderCal();return}
  if(b=c('#calSeg [data-cal]')){UI.cal=b.dataset.cal;if(UI.draft&&UI.cal==='month') closePop();render();scrollToDay();return}
  if(c('#calPrev')||c('#calNext')){const n=c('#calNext')?1:-1;if(UI.cal==='month'){const {y,m}=dayParts(UI.day);gotoDay(new Date(Date.UTC(y,m-1+n,1)).toISOString().slice(0,10))}else gotoDay(shiftDay(UI.day,UI.cal==='week'?7*n:n));return}
  if(c('#calToday')){gotoDay(today());scrollToDay();return}
  if(b=c('#days .mcard')){gotoDay(b.dataset.month+'-01');return}
  if(c('#calNew')){const t=r15(Math.max(Date.now(),dayStart(UI.day)))+15*MIN;const s=dayOf(t)===UI.day?t:dayStart(UI.day)+9*HR;openDraft({s,e:s+UI.dur*MIN,title:'',loc:'',kind:'meet',who:new Set([me().id])});return}
  if(b=c('#days .dcard')){gotoDay(b.dataset.day);return}
  if(b=c('#month .mcell')){if(c('[data-ev]')){const x=c('[data-ev]');gotoDay(b.dataset.day,true);UI.cal='day';openEvent(x.dataset.ev,x.dataset.s);return}if(c('[data-task]')){openTask(c('[data-task]').dataset.task);return}UI.cal='day';gotoDay(b.dataset.day);scrollToDay();return}
  if(b=c('#vCal [data-task]')){openTask(b.dataset.task);return}
  if(b=c('#agenda [data-acc]')){answerInvite(b.dataset.acc,true);toast('Accepted');render();return}
  if(b=c('#agenda [data-dec]')){answerInvite(b.dataset.dec,false);toast('Declined');render();return}
  if(b=c('#agenda .ag.gap')){const s=+b.dataset.gap,len=Math.min(UI.dur*MIN,+b.dataset.until-s);openDraft({s,e:s+len,title:'',loc:'',kind:'meet',who:new Set([me().id])});return}
  if(b=c('#agenda .ag[data-ev]')){if(c('a')) return;openEvent(b.dataset.ev,b.dataset.s,b.dataset.who);return}
  if(b=c('#wk .chip')){openEvent(b.dataset.ev,b.dataset.s,b.dataset.who);return}
  if(c('#wk .wk-draft')){const t=$('#pTitle');if(t) t.focus();return}
  if(b=c('#wk .vg-col')){const r=wkTimeAt(e);if(!r) return;const a=dayStart(r.d),s=a+Math.floor((r.t-a)/(15*MIN))*15*MIN;UI.day=r.d;openDraft({s,e:s+UI.dur*MIN,title:'',loc:'',kind:'meet',who:new Set([me().id])});return}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(UI.inbox){openInbox(false);return}if(UI.draft&&!document.querySelector('dialog[open]')) closePop()}
});
$$('dialog').forEach(d=>d.addEventListener('pointerdown',e=>{if(e.target!==d) return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) d.close()}));
$('#dMember').addEventListener('close',()=>{editing=null});

/* ---------- boot ---------- */
UI.day=today();
if(!document.documentElement.dataset.theme) document.documentElement.dataset.theme='light';
{let v=null;try{v=localStorage.getItem('noon.view')}catch(e){}setView(SHARE?'projects':['calendar','team','tasks','projects'].includes(v)?v:'calendar',true)}
// address hooks, handy for screenshots: ?view=team|tasks|projects|calendar, ?cal=week|month|day
{const q=new URLSearchParams(location.search);
  if(!SHARE&&['calendar','team','tasks','projects'].includes(q.get('view'))) setView(q.get('view'),true);
  if(['week','month','day'].includes(q.get('cal'))) UI.cal=q.get('cal');
  window.__hook=q;}
const J=SHARE?null:readJoin();
// an invite link: for a team on someone's account, opening it leaves an invite in your inbox once you are signed in
// (pasting it in Settings joins straight away); a device team comes as a snapshot
function startJoin(J,boot){
  if(J.code){const signed=typeof CLOUD!=='undefined'&&CLOUD.user;if(signed&&!boot){if(S.teams.some(t=>t.code===J.code)){toast('You are already in that team');return}joinByCode(J.code);return}
    try{localStorage.setItem('noon.join',J.code)}catch(e){}if(boot) history.replaceState(null,'',location.pathname+location.search);setTimeout(()=>{if(!(typeof CLOUD!=='undefined'&&CLOUD.user)){openAuth('register','join');peekInvite(J.code)}},boot?900:0);return}
  window.__join=J;$('#joinTitle').textContent='Join '+J.n;setTz($('#fJoin').tz,Intl.DateTimeFormat().resolvedOptions().timeZone);$('#dJoin').showModal()}
if(J) startJoin(J,true);
render();scrollToDay();syncThemeSwitch();
addEventListener('load',()=>{const q=window.__hook;if(q){ // more hooks for screenshots, run once every module is in: ?pop=first|new opens the event panel, ?task=first opens a task, ?inbox=1 the inbox
  if(q.get('pop')==='first'){const x=itemsOn(me(),today()).find(x=>x[3]);if(x) openEvent(x[3],x[0])}
  if(q.get('pop')==='new'){const s=dayStart(today())+10*HR;openDraft({s,e:s+UI.dur*MIN,title:'',loc:'',kind:'meet',who:new Set(team().members.map(z=>z.id))})}
  if(q.get('task')==='first'){const t=tasksOf(team()).find(t=>!t.done);if(t) openTask(t.id)}
  if(q.get('inbox')) openInbox(true);
  if(q.get('theme')) setTheme(q.get('theme'),true);
  if(q.get('dlg')==='settings') openSettings(q.get('page')||'account');
  if(q.get('dlg')==='member'){const z=team().members.find(x=>!x.isMe);openMember(z?z.id:null)}
  if(q.get('dlg')==='auth') openAuth('login');
  if(q.get('dlg')==='invite') openInvite();
  if(q.get('hover')){tmHover(dayStart(today())+(+q.get('hover'))*HR)}}});
setInterval(()=>{renderSide();if(UI.view==='team'&&!UI.hover) renderTeam();if(UI.view==='calendar'&&UI.hp){const nl=$('#wk .wk-now');if(nl) nl.style.top=clamp((Date.now()-dayStart(today()))/HR,0,24)*UI.hp+'px'}},30000);
