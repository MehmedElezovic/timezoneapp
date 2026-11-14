/* Noon redesign mockup · Tasks: one simple list, people on each row, filters, page tasks, and per-task hiding. */
I.eyeoff='<path d="M3.5 3.5l17 17"/><path d="M10.6 6.1A9 9 0 0 1 12 6c5 0 8.5 6 8.5 6a15 15 0 0 1-2.6 3.3M6.3 7.6A15 15 0 0 0 3.5 12s3.5 6 8.5 6a8.6 8.6 0 0 0 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>';
I.flag='<path d="M5.5 21V4.5M5.5 4.5h11l-2 4 2 4h-11"/>';
const TK={scope:'mine',filter:'open',who:[],pg:[],open:null,draft:''};
function tasksMineOpen(){return TASKS.filter(t=>!t.done&&t.to.includes('me')).length}
const VIS={all:'Everyone on the team',only:'Only me and the people it is for',except:'Everyone except…'};
function visLabel(t){if(t.vis==='only')return `Only you${t.to.concat(t.with||[]).filter(x=>x!=='me').length?' and '+[...new Set(t.to.concat(t.with||[]))].filter(x=>x!=='me').map(x=>P[x].short).join(', '):''}`;if(t.vis==='except')return `Hidden from ${(t.hidden||[]).map(x=>P[x].short).join(', ')||'nobody'}`;return 'Everyone on the team'}
function tkVisible(){let L=TASKS.slice();
  if(TK.scope==='mine')L=L.filter(t=>t.to.includes('me'));
  if(TK.who.length&&TK.scope==='all')L=L.filter(t=>t.to.some(x=>TK.who.includes(x)));
  if(TK.pg.length)L=L.filter(t=>TK.pg.includes(t.page));
  const f=TK.filter;
  if(f==='done')return L.filter(t=>t.done);
  L=L.filter(t=>!t.done);
  if(f==='due')L=L.filter(t=>t.due&&days(t.due)<=7);
  if(f==='high')L=L.filter(t=>t.pri==='high');
  return L.sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'))}
function bucket(t){if(!t.due)return 'No date';const d=days(t.due);return d<0?'Overdue':d===0?'Today':d===1?'Tomorrow':d<=7?'This week':'Later'}
const tkDue=t=>{if(!t.due)return '<span class="dash">–</span>';const d=days(t.due);if(t.done)return `<span class="due done">${fmtDate(t.due)}</span>`;
  if(d<0)return `<span class="tag red">${fmtDate(t.due)}</span>`;if(d===0)return '<span class="due soon">Today</span>';if(d===1)return '<span class="due soon">Tomorrow</span>';return `<span class="due">${fmtDate(t.due)}</span>`};
const tkCheck=t=>`<button class="tcb ${t.done?'on':''}" data-act="tkToggle" data-id="${t.id}" role="checkbox" aria-checked="${t.done}" aria-label="${t.done?'Mark not done':'Mark done'}: ${esc(t.title)}">${t.done?stSvg('done',18):''}</button>`;

ROUTES.tasks=R=>{const m=$('#main');m.dataset.view='tasks';const L=tkVisible();
  const base=TASKS.filter(t=>TK.scope==='all'||t.to.includes('me'));
  const cnt={open:base.filter(t=>!t.done).length,due:base.filter(t=>!t.done&&t.due&&days(t.due)<=7).length,high:base.filter(t=>!t.done&&t.pri==='high').length,done:base.filter(t=>t.done).length};
  const groups=TK.filter==='done'?[['Done',L]]:['Overdue','Today','Tomorrow','This week','Later','No date'].map(b=>[b,L.filter(t=>bucket(t)===b)]).filter(g=>g[1].length);
  const pill=(k,label,all,names)=>{const v=TK[k];return `<span class="pill ${v.length?'set':''}"><button data-act="tkPill" data-k="${k}" aria-haspopup="menu"><span class="k">${label}</span> ${v.length?esc(names(v[0]))+(v.length>1?` <span class="num">+${v.length-1}</span>`:''):all} ${ic('down',14)}</button>${v.length?`<button class="x" data-act="tkClear" data-k="${k}" aria-label="Clear ${label}">${ic('x',12)}</button>`:''}</span>`};
  m.innerHTML=`<div class="top"><div class="crumbs">${ic('tasks',18)}<span class="cur" style="padding:0 4px">Tasks</span></div><span class="sp"></span><button class="btn btn-ink" data-act="newTask">${ic('plus')}New task</button></div>
  <div class="vbar">
    <div class="seg" role="group" aria-label="Whose tasks">${[['mine','My tasks'],['all','All tasks']].map(([k,l])=>`<button class="${TK.scope===k?'on':''}" data-act="tkScope" data-s="${k}" aria-pressed="${TK.scope===k}">${l}</button>`).join('')}</div>
    <span class="vdiv"></span>
    ${[['open','Open'],['due','Due this week'],['high','High priority'],['done','Done']].map(([k,l])=>`<span class="pill ${TK.filter===k?'sel':''}"><button data-act="tkFilter" data-f="${k}" aria-pressed="${TK.filter===k}">${l} <span class="num">${cnt[k]}</span></button></span>`).join('')}
    <span class="sp"></span>
    ${TK.scope==='all'?pill('who','Person','Anyone',id=>P[id].short):''}
    ${pill('pg','Page','Any',id=>page(id)?.name||'')}
  </div>
  <div class="tbl-wrap" id="tkWrap"><div class="tk">
   ${groups.length?groups.map(([b,items])=>`<div class="tk-gh ${b==='Overdue'?'late':''}">${b}<span class="num">${items.length}</span></div>${items.map(tkRow).join('')}`).join('')
    :`<div class="empty"><h3 class="disp" style="font-size:24px;line-height:30px">Nothing <span class="mk">here</span></h3><p>${TK.filter==='done'?'Finished tasks show up here.':'No open tasks in this view.'}</p><button class="btn btn-line" data-act="newTask">${ic('plus')}New task</button></div>`}
  </div></div>
  ${TK.open&&TASKS.find(t=>t.id===TK.open)?tkPeek(TASKS.find(t=>t.id===TK.open)):''}`;
  const n=$('#tkNotes');if(n)n.oninput=()=>{const t=TASKS.find(x=>x.id===TK.open);t.notes=n.value};
  const ti=$('#tkTitle');if(ti)ti.onchange=()=>{const t=TASKS.find(x=>x.id===TK.open);const v=ti.value.trim();if(v&&v!==t.title){t.title=v;render(true)}};
  const c=$('#tkCm');if(c)c.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();ACT.tkComment()}};
};
function tkRow(t){const p=t.page?page(t.page):null;
  return `<div class="tk-r ${TK.open===t.id?'pk':''} ${t.done?'dn':''}" data-act="tkOpen" data-id="${t.id}" tabindex="0">
   <div>${tkCheck(t)}</div>
   <div class="tk-ti"><span class="pname">${esc(t.title)}</span>${t.auto?'<span class="tag">Page task</span>':''}</div>
   <div>${p?`<a class="tk-pg" href="#page/${p.id}/design" title="Open ${esc(p.name)}">${tile(p.client)}<span>${esc(p.name)}</span></a>`:'<span class="dash">–</span>'}</div>
   <div>${avs(t.to)}</div><div>${tkDue(t)}</div>
   <div>${t.pri==='high'?`<span class="tag red">${ic('flag',12)}High</span>`:''}</div>
   <div>${t.vis!=='all'?`<span class="tk-vis" title="${esc(visLabel(t))}">${ic('eyeoff',15)}</span>`:''}</div></div>`}
function tkPeek(t){const p=t.page?page(t.page):null;
  return `<aside class="peek" aria-label="Task">
   <div class="pk-top"><button class="btn btn-sm ${t.done?'btn-line':'btn-ink'}" data-act="tkToggle" data-id="${t.id}">${ic('check',14)}${t.done?'Mark not done':'Mark done'}</button><span class="sp"></span>
    ${p?`<a class="btn btn-line btn-sm" href="#page/${p.id}/design">Open page${ic('open',14)}</a>`:''}<button class="ib" data-act="tkClose" aria-label="Close">${ic('x',18)}</button></div>
   <div class="pk-body">
    ${t.auto?`<p class="note">This task was made when ${t.to.map(x=>P[x].short).join(' and ')} got the page. It stays in step with the page deadline.</p>`:''}
    <input class="tk-title" id="tkTitle" value="${esc(t.title)}" aria-label="Task title">
    <dl class="attrs">
     <dt>${ic('user',15)}Assigned</dt><dd><button class="ed" data-act="tkTo"><span class="who-list">${t.to.map(x=>`<span>${av(x)}${P[x].short}</span>`).join('')}</span></button></dd>
     <dt>${ic('calendar',15)}Due</dt><dd><button class="ed" data-act="tkDue">${t.due?tkDue(t):'<span class="muted">Add a date</span>'}</button></dd>
     <dt>${ic('flag',15)}Priority</dt><dd><div class="seg"><button class="${t.pri!=='high'?'on':''}" data-act="tkPri" data-p="">Normal</button><button class="${t.pri==='high'?'on':''}" data-act="tkPri" data-p="high">High</button></div></dd>
     <dt>${ic('pages',15)}Page</dt><dd><button class="ed" data-act="tkPage">${p?`${tile(p.client)}${esc(p.name)}`:'<span class="muted">No page</span>'}</button></dd>
     <dt>${ic('eyeoff',15)}Who sees it</dt><dd><button class="ed" data-act="tkVis" ${t.by!=='me'?'disabled title="Only the person who made the task changes this"':''}>${esc(visLabel(t))}</button></dd>
     <dt>${ic('activity',15)}Made by</dt><dd>${av(t.by)}${P[t.by].short}</dd>
    </dl>
    <div class="slbl">Details</div><textarea class="tk-notes" id="tkNotes" placeholder="Add details…" aria-label="Details">${esc(t.notes||'')}</textarea>
    <div class="slbl">Comments<span class="num">${t.cm.length||''}</span></div>
    ${t.cm.map(c=>`<div class="cmini">${av(c.by)}<div><div class="who">${P[c.by].short} · ${c.at}</div><p>${esc(c.text)}</p></div></div>`).join('')}
    <div class="rinput" style="margin-top:8px"><input id="tkCm" placeholder="Write a comment…" aria-label="Comment"><button class="btn btn-ink btn-sm" data-act="tkComment">Send</button></div>
    ${t.auto?'':`<button class="btn btn-ghost btn-sm" style="margin-top:22px;color:var(--red);margin-left:-8px" data-act="tkDelete">${ic('trash',14)}Delete task</button>`}
   </div></aside>`}
const tkCur=()=>TASKS.find(t=>t.id===TK.open);
function dueMenu(a,get,set){const d=n=>{const x=new Date(TODAY);x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
  openMenu(a,()=>[['Today',0],['Tomorrow',1],['In 3 days',3],['Next week',7],['In two weeks',14]].map(([l,n])=>({label:l,meta:fmtDate(d(n)),check:true,on:get()===d(n),pick:()=>set(d(n))})).concat(get()?[{sep:1},{label:'No date',pick:()=>set(null)}]:[]))}
function visMenu(a,t,after){openMenu(a,()=>[{head:'Who sees this task'},...Object.entries(VIS).map(([k,l])=>({check:true,on:t.vis===k,label:l,meta:k==='only'?'Hidden from everyone else':'',close:k==='except',pick:()=>{t.vis=k;if(k==='except'){t.hidden=t.hidden||[];setTimeout(()=>exceptMenu($('[data-act=tkVis]')||$('#ntVis')||a,t,after),30)}after&&after()}}))])}
function exceptMenu(a,t,after){openMenu(a,()=>[{head:'Hide it from'},...Object.values(P).filter(u=>u.id!=='me'&&!t.to.includes(u.id)).map(u=>({check:true,on:(t.hidden||[]).includes(u.id),pre:av(u.id),label:esc(u.name),pick:()=>{const h=t.hidden;h.includes(u.id)?h.splice(h.indexOf(u.id),1):h.push(u.id);after&&after()}}))],{multi:true})}
function newTaskDlg(){const d={title:'',to:['me'],due:null,page:null,pri:'',vis:'all',hidden:[],by:'me'};
  const draw=o=>{const title=o.querySelector('#ntT')?.value??d.title;d.title=title;
   o.querySelector('.dlg').innerHTML=`<div class="dlg-h"><b>New task</b><button class="ib" data-act="dlgClose" aria-label="Close">${ic('x',18)}</button></div>
   <div class="dlg-b"><label class="fld"><span>What needs doing</span><input id="ntT" value="${esc(d.title)}" placeholder="e.g. Send Dandy the review link"></label>
    <div class="fld2"><div class="fld"><span>For</span><button class="selb" id="ntTo">${avs(d.to)}<span>${d.to.map(x=>P[x].short).join(', ')}</span><span class="sp"></span>${ic('down',14)}</button></div>
    <div class="fld"><span>Due</span><button class="selb" id="ntDue">${ic('calendar',15)}<span>${d.due?fmtDate(d.due):'No date'}</span><span class="sp"></span>${ic('down',14)}</button></div></div>
    <div class="fld2"><div class="fld"><span>Page</span><button class="selb" id="ntPg">${d.page?tile(page(d.page).client)+esc(page(d.page).name):'<span class="dash">No page</span>'}<span class="sp"></span>${ic('down',14)}</button></div>
    <div class="fld"><span>Priority</span><div class="seg" style="width:max-content"><button class="${d.pri?'':'on'}" id="ntN">Normal</button><button class="${d.pri?'on':''}" id="ntH">High</button></div></div></div>
    <div class="fld"><span>Who sees it</span><button class="selb" id="ntVis">${ic('eyeoff',15)}<span>${esc(visLabel(d))}</span><span class="sp"></span>${ic('down',14)}</button></div></div>
   <div class="dlg-f"><button class="btn btn-line" data-act="dlgClose">Cancel</button><button class="btn btn-ink" id="ntOk">Create task</button></div>`;
   const q=s=>o.querySelector(s),re=()=>setTimeout(()=>draw(o));
   q('#ntT').oninput=e=>d.title=e.target.value;q('#ntT').onkeydown=e=>{if(e.key==='Enter')q('#ntOk').click()};
   q('#ntTo').onclick=e=>openMenu(e.currentTarget,()=>peopleList().map(u=>({check:true,on:d.to.includes(u.id),pre:u.pre,label:esc(u.label),meta:u.meta,pick:()=>{d.to.includes(u.id)?(d.to.length>1&&d.to.splice(d.to.indexOf(u.id),1)):d.to.push(u.id);re()}})),{multi:true});
   q('#ntDue').onclick=e=>dueMenu(e.currentTarget,()=>d.due,v=>{d.due=v;re()});
   q('#ntPg').onclick=e=>openMenu(e.currentTarget,()=>[{label:'No page',check:true,on:!d.page,pick:()=>{d.page=null;re()}},{sep:1},...PAGES.map(p=>({check:true,on:d.page===p.id,pre:tile(p.client),label:esc(p.name),pick:()=>{d.page=p.id;re()}}))]);
   q('#ntN').onclick=()=>{d.pri='';re()};q('#ntH').onclick=()=>{d.pri='high';re()};
   q('#ntVis').onclick=e=>visMenu(e.currentTarget,d,re);
   q('#ntOk').onclick=()=>{if(!d.title.trim()){q('#ntT').focus();return}const t={id:'t'+Date.now().toString(36),title:d.title.trim(),page:d.page,to:d.to,due:d.due,pri:d.pri,by:'me',vis:d.vis,hidden:d.hidden,done:false,notes:'',cm:[]};
     TASKS.push(t);closeDlg();TK.filter='open';render(true);toast('Task created',()=>{TASKS.splice(TASKS.indexOf(t),1);if(TK.open===t.id)TK.open=null})};
   if(!o.dataset.f){o.dataset.f=1;q('#ntT').focus()}};
  openDlg('',draw,{wide:true})}
Object.assign(ACT,{
  newTask:newTaskDlg,
  tkScope:a=>{TK.scope=a.dataset.s;render(true)},
  tkFilter:a=>{TK.filter=a.dataset.f;render(true)},
  tkPill:a=>{const k=a.dataset.k,src=k==='who'?peopleList():PAGES.map(p=>({id:p.id,label:p.name,pre:tile(p.client)}));openMenu(a,pickFrom(src,()=>TK[k],id=>{const v=TK[k];v.includes(id)?v.splice(v.indexOf(id),1):v.push(id)},{multi:true}),{multi:true})},
  tkClear:a=>{TK[a.dataset.k]=[];render(true)},
  tkOpen:(a,e)=>{if(e.target.closest('a,button'))return;TK.open=TK.open===a.dataset.id?null:a.dataset.id;render(true)},
  tkClose:()=>{TK.open=null;render(true)},
  tkToggle:(a,e)=>{e.stopPropagation();const t=TASKS.find(x=>x.id===a.dataset.id);t.done=!t.done;t.doneAt=t.done?'Today':null;render(true);toast(t.done?`Done: ${t.title}`:'Back on the list',()=>{t.done=!t.done})},
  tkTo:a=>{const t=tkCur();openMenu(a,()=>peopleList().map(u=>({check:true,on:t.to.includes(u.id),pre:u.pre,label:esc(u.label),meta:u.meta,pick:()=>{t.to.includes(u.id)?(t.to.length>1&&t.to.splice(t.to.indexOf(u.id),1)):t.to.push(u.id)}})),{multi:true})},
  tkDue:a=>{const t=tkCur();dueMenu(a,()=>t.due,v=>{const old=t.due;t.due=v;toast(v?`Due ${fmtDate(v)}`:'Date cleared',()=>t.due=old)})},
  tkPri:a=>{const t=tkCur();t.pri=a.dataset.p;render(true)},
  tkPage:a=>{const t=tkCur();openMenu(a,()=>[{label:'No page',check:true,on:!t.page,pick:()=>t.page=null},{sep:1},...PAGES.map(p=>({check:true,on:t.page===p.id,pre:tile(p.client),label:esc(p.name),pick:()=>t.page=p.id}))])},
  tkVis:a=>{const t=tkCur();visMenu(a,t,()=>render(true))},
  tkComment:()=>{const t=tkCur(),i=$('#tkCm'),v=(i?.value||'').trim();if(!v)return;t.cm.push({by:'me',at:'Just now',text:v});render(true);$('#tkCm')?.focus()},
  tkDelete:()=>{const t=tkCur(),i=TASKS.indexOf(t);TASKS.splice(i,1);TK.open=null;render(true);toast('Task deleted',()=>TASKS.splice(i,0,t))},
});
KEYS.push((e,typing)=>{if(route().name!=='tasks'||MENU||PAL||$('#dlg'))return;if(e.key==='Escape'&&TK.open&&!typing){TK.open=null;render(true);return true}
  if(!typing&&e.key.toLowerCase()==='n'&&!e.metaKey&&!e.ctrlKey){e.preventDefault();newTaskDlg();return true}});
