/* Noon · clients and folders. A client is a top-level folder; folders nest inside it, and a page (a `projects` row,
   with its copy and its design versions) sits in one of them or, until someone moves it, in no client at all.
   Clients and pages carry categories from the team's lists (Settings › Categories), so every page of one kind, say
   every B2B listicle, can be found later in one go. Signed-in teams mirror them as `folders` and `categories`. */

const FDI={
  move:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2.5h6a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 19.5H6A2.5 2.5 0 0 1 3.5 17z"/><path d="M9.5 13.5h6M13 11l2.5 2.5L13 16"/></svg>',
  addFolder:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2.5h6a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 19.5H6A2.5 2.5 0 0 1 3.5 17z"/><path d="M12 10.5v6M9 13.5h6"/></svg>',
  doc:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><path d="M14 3.5V8h4.5M9 12.5h6M9 16h4"/></svg>',
  go:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
};

/* ---------- the tree ---------- */
const foldersOf=T=>(T.folders=T.folders||[]);
const fdById=(id,T=team())=>id?foldersOf(T).find(f=>f.id===id)||null:null;
const byName=(a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base'});
const byAt=(a,b)=>(b.at||0)-(a.at||0);
const kidsOf=(T,id)=>foldersOf(T).filter(f=>(f.parent||null)===(id||null)).sort(byName);
const pagesIn=(T,id)=>projectsOf(T).filter(p=>(p.folder||null)===(id||null));
// the folders from the client down to this one
function fdPath(T,id){const out=[];let f=fdById(id,T),n=0;while(f&&n++<40){out.unshift(f);f=fdById(f.parent,T)}return out}
// this folder and every folder under it
function fdTree(T,id){const out=[id],walk=x=>{for(const k of kidsOf(T,x)){out.push(k.id);walk(k.id)}};walk(id);return out}
function pagesUnder(T,id){const ids=new Set(fdTree(T,id));return projectsOf(T).filter(p=>p.folder&&ids.has(p.folder))}
function fdStats(T,id){
  const pg=pagesUnder(T,id),f=fdById(id,T);let last=f;
  for(const p of pg) if((p.at||0)>((last&&last.at)||0)) last=p;
  return {pages:pg.length,open:pg.reduce((n,p)=>n+pageOpen(p),0),last};
}
const fdTouch=f=>{f.at=Date.now();f.who=me().id};
// a page or folder whose folder is gone shows at the top again rather than nowhere
function upgradeFolders(){for(const T of S.teams){const ids=new Set(foldersOf(T).map(f=>f.id));for(const f of foldersOf(T)){if(f.parent&&!ids.has(f.parent)) f.parent=null;f.cats=f.cats||[]}for(const p of projectsOf(T)){if(p.folder&&!ids.has(p.folder)) p.folder=null;p.cats=p.cats||[]}}}

/* ---------- categories: the team's lists, one level for clients and one for pages ---------- */
const DEFAULT_CATS=[
  ['client','Audience',['B2B','DTC']],
  ['client','Industry',['Telehealth','Supplements','Beauty and skincare','Dental','Food and drink']],
  ['page','Page type',['Advertorial','Listicle','Product page','Sales page','Landing page','Comparison','Quiz']],
  ['page','Style',['Editorial','Scrappy','Branded']],
];
// signed-in teams get their lists from the account (the database starts every team with these); a team on this device starts here
function catsOf(T=team()){if(!Array.isArray(T.cats)) T.cats=DEFAULT_CATS.map(([level,name,items])=>({id:uid(),level,name,items:items.map(n=>({id:uid(),name:n}))}));return T.cats}
const catGroups=(level,T=team())=>catsOf(T).filter(g=>g.level===level);
const catUses=(T,id)=>[...foldersOf(T),...projectsOf(T)].filter(x=>(x.cats||[]).includes(id));
function catChipsHtml(ids,T=team(),g=null){
  const on=new Set(ids||[]),out=[];
  for(const grp of g?[g]:catsOf(T)) for(const it of grp.items) if(on.has(it.id)) out.push(`<span class="cat" title="${esc(grp.name)}">${esc(it.name)}</span>`);
  return out.join('');
}
// the categories on a client or page, one group per column, the whole strip opens the editor
function catMetaHtml(level,x,T=team()){
  const gs=catGroups(level,T);if(!gs.length) return '';
  return gs.map(g=>{const h=catChipsHtml(x.cats,T,g);return `<div class="pj-meta-i"><label>${esc(g.name)}</label><button type="button" class="cats-btn" data-edit-cats title="Change the ${esc(g.name.toLowerCase())}">${h||'<span class="pj-none">Not set</span>'}<span class="cats-pen">${I.pen}</span></button></div>`}).join('');
}

/* ---------- the views: every client, one client or folder ---------- */
const FD={menu:false,dlg:null,add:null,edit:null};
function crumbsHtml(T,id){
  const path=fdPath(T,id);
  return [`<button type="button" data-crumb="">Projects</button>`,...path.map(f=>`<button type="button" data-crumb="${f.id}">${esc(f.name)}</button>`)].join('<i>/</i>');
}
function fdRowHtml(T,f){
  const s=fdStats(T,f.id),kids=kidsOf(T,f.id).length,top=!f.parent,chips=top?catChipsHtml(f.cats,T):'';
  return `<div class="pj-row fd" role="button" tabindex="0" data-fd-open="${f.id}">
    <div class="pj-main"><span class="fd-ic${top?' cl':''}">${top?esc(initials(f.name)||'?'):PI.folder}</span><div class="pj-name"><b>${esc(f.name)}</b><small>${chips?`<span class="cats">${chips}</span>`:kids?esc(plural(kids,'folder')):top?'<span class="pj-none">No categories yet</span>':''}</small></div></div>
    <div class="pj-cell" data-l="Pages">${s.pages?`<b>${s.pages}</b><small>${s.pages===1?'page':'pages'}</small>`:'<span class="pj-none">No pages yet</span>'}</div>
    <div class="pj-cell" data-l="Folders">${kids?`<b>${kids}</b><small>${kids===1?'folder':'folders'}</small>`:'<span class="pj-none">None</span>'}</div>
    <div class="pj-cell" data-l="Open">${s.open?`<b>${s.open}</b><small>open ${s.open===1?'comment':'comments'}</small>`:'<span class="pj-none">Nothing open</span>'}</div>
    <div class="pj-cell" data-l="Changed">${s.last&&s.last.at?`<b>${esc(agoLabel(s.last.at))}</b><small>by ${esc(changedBy(T,s.last))}</small>`:'<span class="pj-none">Not yet</span>'}</div>
    <span class="fd-go" aria-hidden="true">${FDI.go}</span></div>`;
}
function pgRowHtml(T,p){
  const cv=curVer(p),cc=cpCur(p),o=pageOpen(p),chips=catChipsHtml(p.cats,T),fc=p.finalCopy&&cpById(p,p.finalCopy),fd=p.finalDesign&&verById(p,p.finalDesign);
  return `<div class="pj-row fd" role="button" tabindex="0" data-proj-open="${p.id}">
    <div class="pj-main">${cv?thumbHtml(cv,'mini'):'<div class="thumb mini empty"></div>'}<div class="pj-name"><b>${esc(p.name)}${shareOn(p)?'<span class="pj-shared">Shared</span>':''}</b><small>${chips?`<span class="cats">${chips}</span>`:'<span class="pj-none">No page type yet</span>'}</small></div></div>
    <div class="pj-cell" data-l="Copy">${cc?`<b>v${cc.n}</b><small>${fc?`v${fc.n} is final`:plural(copyOf(p).length,'version')}</small>`:'<span class="pj-none">No copy yet</span>'}</div>
    <div class="pj-cell" data-l="Design">${cv?`<b>${vLabel(cv)}</b><small>${fd?`${vLabel(fd)} is final`:plural(versOf(p).length,'version')}</small>`:'<span class="pj-none">No design yet</span>'}</div>
    <div class="pj-cell" data-l="Open">${o?`<b>${o}</b><small>open ${o===1?'comment':'comments'}</small>`:'<span class="pj-none">Nothing open</span>'}</div>
    <div class="pj-cell" data-l="Changed"><b>${esc(agoLabel(p.at||Date.now()))}</b><small>by ${esc(changedBy(T,p))}</small></div>
    <span class="fd-acts"><button type="button" class="fd-act" data-fd-move-pg="${p.id}" title="Move to another client or folder" aria-label="Move ${esc(p.name)}">${FDI.move}</button><button type="button" class="fd-act" data-proj-del="${p.id}" title="Delete page" aria-label="Delete ${esc(p.name)}">${I.trash}</button></span></div>`;
}
const fdHead=(a,b,c)=>`<div class="pj-row fd head"><span>${a}</span><span>${b}</span><span>${c}</span><span>Open comments</span><span>Last change</span><span></span></div>`;
function renderHome(){
  const T=team(),C=kidsOf(T,null),loose=pagesIn(T,null).sort(byAt),all=projectsOf(T).length;FD.menu=false;
  $('#vProj').innerHTML=`<header class="top"><div class="ttl-wrap"><h1>Projects</h1><span class="sub">${C.length||all?`${plural(C.length,'client')} · ${plural(all,'page')}`:'Every client, with the copy and the design of each page'}</span></div>
      <div class="topnav">${FEAT.tasks?`<button type="button" class="lbtn quiet" id="pjFlows" title="The steps you repeat on every project">${FI.flow}<span>Templates</span></button>`:''}<button type="button" class="lbtn dark" id="fdNewClient">${I.plus}<span>New client</span></button></div></header>
    <div class="pj-body pj-drop" id="pjDrop">
      ${C.length?`<div class="pj-rows">${fdHead('Client','Pages','Folders')}${C.map(f=>fdRowHtml(T,f)).join('')}</div>`:''}
      ${loose.length?`<div class="fd-sec"><h3>Not in a client yet</h3><small>Move each page into its client with the folder button on its row.</small></div><div class="pj-rows">${fdHead('Page','Copy','Design')}${loose.map(p=>pgRowHtml(T,p)).join('')}</div>`:''}
      ${!C.length&&!loose.length?`<div class="pj-dz big"><span class="ic">${PI.folder}</span><b>Add your first client</b><small>Each client holds its pages. A page keeps its copy and its design together, every version of both, with the comments on each.</small><span class="pj-dz-acts"><button type="button" class="btn dark" id="fdNewClient2">${I.plus}New client</button></span></div>`:''}
      <div class="pj-over">${PI.up}<b>Drop to start a page from these files</b></div></div>`;
  fitThumbs();fillThumbs(loose.map(curVer).filter(Boolean));
}
function fdMenuHtml(T,f){
  const top=!f.parent,empty=!kidsOf(T,f.id).length&&!pagesIn(T,f.id).length;
  return `<div class="dd fd-menu" role="menu">
    <button type="button" class="opt" role="menuitem" data-fd-do="edit">${I.pen}<span class="n">${top?'Name and categories':'Rename'}</span></button>
    <button type="button" class="opt" role="menuitem" data-fd-do="wrap" ${empty?'disabled':''}>${FDI.addFolder}<span class="n">Put everything in a new folder<small>${empty?'Nothing in here yet':`Everything in ${esc(f.name)} moves into it`}</small></span></button>
    <button type="button" class="opt" role="menuitem" data-fd-do="move">${FDI.move}<span class="n">Move to…</span></button>
    <hr class="dd-sep"><button type="button" class="opt danger" role="menuitem" data-fd-do="del">${I.trash}<span class="n">Delete ${top?'client':'folder'}<small>Its pages are kept</small></span></button></div>`;
}
function renderFolder(f){
  const T=team(),top=!f.parent,kids=kidsOf(T,f.id),pages=pagesIn(T,f.id).sort(byAt),s=fdStats(T,f.id),up=fdById(f.parent,T);
  $('#vProj').innerHTML=`<header class="top"><button type="button" class="chev" id="fdBack" aria-label="Back to ${esc(up?up.name:'all clients')}">${PI.back}</button><div class="ttl-wrap"><h1 class="editable" id="fdName" contenteditable="true" spellcheck="false" title="Click to rename">${esc(f.name)}</h1><span class="sub crumbs">${crumbsHtml(T,f.parent)}<i>·</i><span>${plural(s.pages,'page')}${kids.length?`, ${plural(kids.length,'folder')}`:''}</span></span></div>
      <div class="topnav"><button type="button" class="lbtn quiet" id="fdNewFolder">${FDI.addFolder}<span>New folder</span></button><button type="button" class="lbtn dark" id="fdNewPage">${I.plus}<span>New page</span></button><div class="fd-more"><button type="button" class="lbtn quiet icon" id="fdMore" aria-label="More for ${esc(f.name)}" aria-haspopup="menu" aria-expanded="${FD.menu}">${I.more}</button>${FD.menu?fdMenuHtml(T,f):''}</div></div></header>
    ${top&&catGroups('client',T).length?`<div class="pj-meta">${catMetaHtml('client',f,T)}</div>`:''}
    <div class="pj-body pj-drop" id="pjDrop">
      ${kids.length?`<div class="pj-rows">${fdHead('Folder','Pages','Folders')}${kids.map(k=>fdRowHtml(T,k)).join('')}</div>`:''}
      ${pages.length?`<div class="pj-rows">${fdHead('Page','Copy','Design')}${pages.map(p=>pgRowHtml(T,p)).join('')}</div>`:''}
      ${!kids.length&&!pages.length?`<div class="pj-dz big"><span class="ic">${PI.page}</span><b>No pages in ${esc(f.name)} yet</b><small>Add a page, then its copy and its design go inside it. You can also drop a page's HTML file here: it becomes a new page with that file as design version 1.</small><span class="pj-dz-acts"><button type="button" class="btn dark" id="fdNewPage2">${I.plus}New page</button><button type="button" class="btn" id="fdNewFolder2">${FDI.addFolder}New folder</button></span></div>`:''}
      <div class="pj-over">${PI.up}<b>Drop to start a page in ${esc(f.name)} from these files</b></div></div>`;
  fitThumbs();fillThumbs(pages.map(curVer).filter(Boolean));
}

/* ---------- the dialog: new client, folder or page, names and categories, putting things in a folder, moving ---------- */
function moveTargets(T,skip){const out=[],walk=(pid,d)=>{for(const f of kidsOf(T,pid)){if(skip.has(f.id)) continue;out.push({f,d});walk(f.id,d+1)}};walk(null,0);return out}
function catPickHtml(level,sel){
  const gs=catGroups(level);
  if(!gs.length) return '<p class="hint">No categories yet. Add the lists you want in Settings › Categories.</p>';
  return gs.map(g=>`<div class="cat-g"><span class="cat-gn">${esc(g.name)}</span><div class="cat-row">${g.items.map(it=>{const on=sel.includes(it.id);return `<button type="button" class="cat-pick${on?' on':''}" data-cat-pick="${it.id}" aria-pressed="${on}">${esc(it.name)}</button>`}).join('')}${FD.add===g.id?`<input class="cat-new" data-cat-new="${g.id}" maxlength="40" placeholder="New ${esc(g.name.toLowerCase())}" aria-label="New ${esc(g.name.toLowerCase())}">`:`<button type="button" class="cat-pick add" data-cat-add="${g.id}">${I.plus}Add</button>`}</div></div>`).join('');
}
function fdDlgHtml(){
  const T=team(),d=FD.dlg,f=fdById(d.id,T),p=d.page?projById(d.page):null;
  const field=(label,ph)=>`<label class="lbl">${label}<input name="name" required maxlength="60" value="${esc(d.name||'')}" placeholder="${ph}" autocomplete="off"></label>`;
  const cats=lv=>`<div class="cat-pickers">${catPickHtml(lv,d.cats)}</div>`;
  const inName=f?` in ${esc(f.name)}`:'';
  const M={
    client:['New client',field('Client name','Dandy, Hydronate…')+cats('client'),'Add client'],
    folder:[`New folder${inName}`,field('Folder name','November pages, Round 2…'),'Add folder'],
    page:[`New page${inName}`,field('Page name','Crown fit advertorial…')+cats('page'),'Add page'],
    editClient:['Name and categories',field('Client name','')+cats('client'),'Save'],
    editFolder:['Rename folder',field('Folder name',''),'Save'],
    editPage:['Page details',field('Page name','')+cats('page'),'Save'],
    wrap:[`Put everything in ${esc(f?f.name:'')} in a new folder`,`<p class="hint">${esc(f?wrapLine(T,f):'')} ${esc(f?f.name:'')} stays where it is, with this new folder inside, and you can add more folders next to it.</p>`+field('New folder name','Batch 1, October pages…'),'Make folder'],
  };
  if(d.mode==='move'){
    const what=p?p.name:f.name,skip=new Set(p?[]:fdTree(T,f.id)),here=p?(p.folder||''):(f.parent||''),list=moveTargets(T,skip);
    const opt=(id,label,d0,icon,sub)=>{const now=id===here,on=id===d.dest;return `<button type="button" class="opt${on?' on':''}" data-dest="${id}" ${now?'disabled':''} style="--d:${d0}">${icon}<span class="n">${label}${now?'<small>Here now</small>':sub?`<small>${sub}</small>`:''}</span>${on?`<span class="dd-ck">${I.check}</span>`:''}</button>`};
    return `<button type="button" class="xbtn dlg-x" data-close aria-label="Close">×</button><form id="fFd" method="dialog"><div class="dlg-head"><h2>Move ${esc(what)}</h2></div>
      <div class="fd-dest" role="listbox" aria-label="Where to">${p?opt('','Not in a client',0,`<span class="fd-ic sm">–</span>`,'Its own spot under Projects'):opt('','On its own, as a client',0,`<span class="fd-ic sm cl">${esc(initials(f.name)||'?')}</span>`,'')}${list.map(({f:x,d:d0})=>opt(x.id,esc(x.name),d0,x.parent?`<span class="fd-ic sm">${PI.folder}</span>`:`<span class="fd-ic sm cl">${esc(initials(x.name)||'?')}</span>`,'')).join('')}</div>
      ${list.length?'':'<p class="hint">Add a client first, then pages can go into it.</p>'}
      <div class="dlg-acts"><button type="button" class="btn ghost" data-close>Cancel</button><button type="submit" class="btn dark" ${d.dest==null?'disabled':''}>Move here</button></div></form>`;
  }
  const [title,body,ok]=M[d.mode];
  return `<button type="button" class="xbtn dlg-x" data-close aria-label="Close">×</button><form id="fFd" method="dialog" autocomplete="off"><div class="dlg-head"><h2>${title}</h2></div>${body}<div class="dlg-acts"><button type="button" class="btn ghost" data-close>Cancel</button><button type="submit" class="btn dark">${ok}</button></div></form>`;
}
function wrapLine(T,f){const k=kidsOf(T,f.id).length,n=pagesIn(T,f.id).length;return `${[n?plural(n,'page'):'',k?plural(k,'folder'):''].filter(Boolean).join(' and ')} move into it.`}
function fdDlg(o){
  FD.dlg={cats:[],name:'',...o};FD.add=null;FD.menu=false;
  const dl=$('#dFd');dl.innerHTML=fdDlgHtml();if(!dl.open) dl.showModal();
  const n=dl.querySelector('input[name=name]');if(n){n.focus();n.select()}
}
function fdDlgRefresh(focusSel){const dl=$('#dFd');if(!dl.open||!FD.dlg) return;dl.innerHTML=fdDlgHtml();const x=focusSel&&dl.querySelector(focusSel);if(x) x.focus()}
const newName=n=>String(n||'').trim().slice(0,60);
function fdSubmit(){
  const T=team(),d=FD.dlg;if(!d) return;const name=newName(d.name),f=fdById(d.id,T),now=Date.now(),my=me().id;
  if(d.mode!=='move'&&!name){const n=$('#dFd input[name=name]');if(n) n.focus();return}
  const close=()=>{$('#dFd').close();FD.dlg=null};
  if(d.mode==='client'||d.mode==='folder'){
    const x={id:uid(),name,parent:d.mode==='folder'?d.id:null,cats:d.mode==='client'?d.cats:[],by:my,who:my,at:now};foldersOf(T).push(x);
    close();PV.folder=x.id;PV.proj=null;PV.ver=null;save();render();toast(d.mode==='client'?`${name} added. Add its first page next.`:`Folder ${name} added`);return}
  if(d.mode==='page'){
    const p={id:uid(),name,at:now,by:my,who:my,to:[],versions:[],folder:d.id||null,cats:d.cats};projectsOf(T).push(p);
    close();PV.proj=p.id;PV.ver=null;PV.tabFor=null;save();render();toast(`${name} added`);return}
  if(d.mode==='editClient'||d.mode==='editFolder'){if(!f) return close();f.name=name;if(d.mode==='editClient') f.cats=d.cats;fdTouch(f);close();save();render();return}
  if(d.mode==='editPage'){const p=projById(d.page);if(!p) return close();p.name=name;p.cats=d.cats;touch(p);close();save();render();return}
  if(d.mode==='wrap'){if(!f) return close();
    const x={id:uid(),name,parent:f.id,cats:[],by:my,who:my,at:now},kids=kidsOf(T,f.id),pages=pagesIn(T,f.id);
    for(const k of kids) k.parent=x.id;for(const p of pages) p.folder=x.id;foldersOf(T).push(x);fdTouch(f);
    close();save();render();toast(`Everything in ${f.name} is now in ${name}`);return}
  if(d.mode==='move'){if(d.dest==null) return;const to=d.dest||null,dest=fdById(to,T);
    if(d.page){const p=projById(d.page);if(!p) return close();p.folder=to;touch(p);close();save();render();toast(`${p.name} moved to ${dest?dest.name:'Not in a client'}`);return}
    if(!f||(to&&fdTree(T,f.id).includes(to))) return close();
    f.parent=to;fdTouch(f);close();save();render();toast(`${f.name} moved ${dest?`into ${dest.name}`:'out on its own, as a client'}`);return}
}
// adding a category while tagging: it joins the team's list and is picked here
function catAddFromDlg(gid,name){
  const T=team(),g=catsOf(T).find(x=>x.id===gid);name=String(name||'').trim().slice(0,40);FD.add=null;
  if(!g||!name){fdDlgRefresh();return}
  let it=g.items.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(!it){it={id:uid(),name};g.items.push(it);save()}
  if(!FD.dlg.cats.includes(it.id)) FD.dlg.cats.push(it.id);
  fdDlgRefresh(`[data-cat-add="${gid}"]`);
}
$('#dFd').addEventListener('click',e=>{
  const c=s=>e.target.closest(s);let b;
  if(c('[data-close]')){e.currentTarget.close();FD.dlg=null;return}
  if(b=c('[data-cat-pick]')){const id=b.dataset.catPick,L=FD.dlg.cats,on=!L.includes(id);if(on) L.push(id);else L.splice(L.indexOf(id),1);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);return}
  if(b=c('[data-cat-add]')){FD.add=b.dataset.catAdd;fdDlgRefresh(`[data-cat-new="${FD.add}"]`);return}
  if(b=c('[data-dest]')){if(b.disabled) return;FD.dlg.dest=b.dataset.dest;fdDlgRefresh();return}
});
$('#dFd').addEventListener('input',e=>{if(e.target.name==='name'&&FD.dlg) FD.dlg.name=e.target.value});
$('#dFd').addEventListener('keydown',e=>{
  const t=e.target;if(!t.matches||!t.matches('[data-cat-new]')) return;
  if(e.key==='Enter'){e.preventDefault();catAddFromDlg(t.dataset.catNew,t.value)}
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();FD.add=null;fdDlgRefresh(`[data-cat-add="${t.dataset.catNew}"]`)}
});
$('#dFd').addEventListener('focusout',e=>{const t=e.target;if(t.matches&&t.matches('[data-cat-new]')&&FD.add===t.dataset.catNew&&!e.relatedTarget?.closest?.('[data-close]')) setTimeout(()=>{if(FD.add===t.dataset.catNew) catAddFromDlg(t.dataset.catNew,t.value)},0)});
$('#dFd').addEventListener('submit',e=>{e.preventDefault();fdSubmit()});
$('#dFd').addEventListener('close',()=>{FD.dlg=null;FD.add=null});

/* ---------- deleting a client or folder keeps its pages: they move up a level, or out of the client ---------- */
async function fdDelete(f){
  const T=team(),top=!f.parent,tree=fdTree(T,f.id),pg=pagesUnder(T,f.id),sub=tree.length-1,up=fdById(f.parent,T);
  // a client's pages all go to Not in a client and its folders go; a folder's own pages and folders move up one level
  const kids=kidsOf(T,f.id).length,own=pagesIn(T,f.id).length,inside=[own?plural(own,'page'):'',kids?plural(kids,'folder'):''].filter(Boolean).join(' and ');
  const text=top?[pg.length?`${pg.length===1?'Its page moves':`Its ${pg.length} pages move`} to Not in a client, with every version and comment.`:'',sub?(sub===1?'Its folder goes.':`Its ${sub} folders go.`):''].filter(Boolean).join(' ')
    :inside?`What is inside it moves up into ${up.name}: ${inside}, with every version and comment.`:'';
  if(!await confirmDlg(`Delete ${f.name}?`,text||'It is empty.',`Delete ${top?'client':'folder'}`)) return;
  if(top){for(const p of pg) p.folder=null;T.folders=foldersOf(T).filter(x=>!tree.includes(x.id))}
  else{for(const k of kidsOf(T,f.id)) k.parent=f.parent;for(const p of pagesIn(T,f.id)) p.folder=f.parent;T.folders=foldersOf(T).filter(x=>x.id!==f.id);fdTouch(up)}
  PV.folder=f.parent||null;FD.menu=false;save();render();toast(`${f.name} deleted${pg.length?`, its pages kept`:''}`);
}

/* ---------- clicks in the projects view that are about clients and folders ---------- */
const openFolder=id=>{PV.folder=id||null;PV.proj=null;PV.ver=null;FD.menu=false;renderProjects();const b=$('#pjDrop');if(b) b.scrollTop=0};
$('#vProj').addEventListener('click',e=>{
  const c=s=>e.target.closest(s);let b;const T=team(),f=PV.folder&&fdById(PV.folder),p=PV.proj&&projById(PV.proj);
  if(c('#fdNewClient')||c('#fdNewClient2')){fdDlg({mode:'client'});return}
  if(c('#fdNewPage')||c('#fdNewPage2')){fdDlg({mode:'page',id:PV.folder});return}
  if(c('#fdNewFolder')||c('#fdNewFolder2')){fdDlg({mode:'folder',id:PV.folder});return}
  if(c('#fdBack')){openFolder(f&&f.parent);return}
  if(b=c('[data-crumb]')){openFolder(b.dataset.crumb);return}
  if(b=c('[data-fd-open]')){openFolder(b.dataset.fdOpen);return}
  if(b=c('[data-fd-move-pg]')){const q=projById(b.dataset.fdMovePg);if(q) fdDlg({mode:'move',page:q.id,name:q.name});return}
  if(c('[data-edit-cats]')){if(p) fdDlg({mode:'editPage',page:p.id,name:p.name,cats:[...(p.cats||[])]});else if(f) fdDlg({mode:'editClient',id:f.id,name:f.name,cats:[...(f.cats||[])]});return}
  if(c('#fdMore')){FD.menu=!FD.menu;renderProjects();return}
  if(b=c('[data-fd-do]')){if(b.disabled||!f) return;const k=b.dataset.fdDo;FD.menu=false;
    if(k==='edit'){fdDlg({mode:f.parent?'editFolder':'editClient',id:f.id,name:f.name,cats:[...(f.cats||[])]});return}
    if(k==='wrap'){fdDlg({mode:'wrap',id:f.id});return}
    if(k==='move'){fdDlg({mode:'move',id:f.id,name:f.name});return}
    if(k==='del'){renderProjects();fdDelete(f);return}}
});
$('#vProj').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='fdName'){e.preventDefault();e.target.blur()}});
$('#vProj').addEventListener('focusout',e=>{if(e.target.id!=='fdName') return;const f=PV.folder&&fdById(PV.folder);if(!f) return;const n=newName(e.target.textContent);if(n&&n!==f.name){f.name=n;fdTouch(f);save();toast('Renamed')}else e.target.textContent=f.name});
document.addEventListener('pointerdown',e=>{if(FD.menu&&!(e.target.closest&&e.target.closest('.fd-more'))){FD.menu=false;const m=$('#vProj .fd-menu');if(m) m.remove();const b=$('#fdMore');if(b) b.setAttribute('aria-expanded','false')}
  if(PV.menu&&!(e.target.closest&&e.target.closest('#pjChrome .fd-more'))){PV.menu=null;const m=$('#pjChrome .fd-menu');if(m) m.remove();const b=$('#pgMore');if(b) b.setAttribute('aria-expanded','false')}});
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||UI.view!=='projects'||document.querySelector('dialog[open]')) return;
  if(FD.menu){e.stopImmediatePropagation();FD.menu=false;renderProjects();const b=$('#fdMore');if(b) b.focus()}
  else if(PV.menu){e.stopImmediatePropagation();const p=projById(PV.menu);PV.menu=null;if(p) pageChromeRefresh(p);const b=$('#pgMore');if(b) b.focus()}},true);

/* ---------- Settings › Categories: the team's lists ---------- */
function renderCatSettings(){
  const T=team(),box=$('#setCats');if(!box) return;
  const item=(g,it)=>FD.edit===it.id?`<input class="cat-new" data-ci-ren="${it.id}" value="${esc(it.name)}" maxlength="40" aria-label="Rename ${esc(it.name)}">`
    :`<span class="cat-chip"><button type="button" class="cat-name" data-ci-edit="${it.id}" title="Rename">${esc(it.name)}</button><button type="button" class="cat-x" data-ci-del="${it.id}" aria-label="Remove ${esc(it.name)}">×</button></span>`;
  const group=g=>`<div class="cg" data-cg="${g.id}"><div class="cg-top"><input class="cg-name" data-cg-name="${g.id}" value="${esc(g.name)}" maxlength="40" aria-label="Group name"><span class="cg-n">${plural(g.items.length,'choice')}</span><button type="button" class="btn sm ghost danger" data-cg-del="${g.id}">Delete list</button></div>
    <div class="cat-row">${g.items.map(it=>item(g,it)).join('')}<input class="cat-new add" data-ci-add="${g.id}" maxlength="40" placeholder="Add a choice" aria-label="Add to ${esc(g.name)}"></div></div>`;
  const level=(lv,title,hint)=>{const gs=catGroups(lv,T);return `<h3>${title}</h3><p class="hint">${hint}</p>${gs.map(group).join('')}<button type="button" class="btn sm" data-cg-new="${lv}">${I.plus}New list for ${lv==='client'?'clients':'pages'}</button>`};
  box.innerHTML=`<h2>Categories</h2><p class="hint">Tag clients and pages so every page of a kind can be found again later, for example all B2B listicles. The whole team shares these lists, and anything added while tagging shows up here too.</p>
    ${level('client','For clients','Picked on each client, so all of its pages count as that too.')}${level('page','For pages','Picked on each page.')}`;
  if(FD.edit){const x=box.querySelector(`[data-ci-ren="${FD.edit}"]`);if(x){x.focus();x.select()}}
}
function catFind(T,id){for(const g of catsOf(T)){const it=g.items.find(x=>x.id===id);if(it) return {g,it}}return null}
function catDropIds(T,ids){const s=new Set(ids);for(const x of [...foldersOf(T),...projectsOf(T)]) if((x.cats||[]).some(id=>s.has(id))) x.cats=x.cats.filter(id=>!s.has(id))}
$('#dSettings').addEventListener('click',async e=>{
  const c=s=>e.target.closest&&e.target.closest(s);let b;const T=team();if(!c('#setCats')) return;
  if(b=c('[data-ci-edit]')){FD.edit=b.dataset.ciEdit;renderCatSettings();return}
  if(b=c('[data-ci-del]')){const r=catFind(T,b.dataset.ciDel);if(!r) return;const n=catUses(T,r.it.id).length;
    if(n&&!await confirmDlg(`Remove ${r.it.name}?`,`It comes off ${n===1?'the client or page':`the ${n} clients and pages`} tagged with it.`,'Remove')) return;
    r.g.items=r.g.items.filter(x=>x!==r.it);catDropIds(T,[r.it.id]);save();renderCatSettings();if(UI.view==='projects') render();return}
  if(b=c('[data-cg-del]')){const g=catsOf(T).find(x=>x.id===b.dataset.cgDel);if(!g) return;const ids=g.items.map(x=>x.id),n=[...foldersOf(T),...projectsOf(T)].filter(x=>(x.cats||[]).some(id=>ids.includes(id))).length;
    if(!await confirmDlg(`Delete the ${g.name} list?`,`${plural(g.items.length,'choice')} ${g.items.length===1?'goes':'go'} with it${n?`, and come${g.items.length===1?'s':''} off ${n} ${n===1?'client or page':'clients and pages'}`:''}.`,'Delete list')) return;
    T.cats=catsOf(T).filter(x=>x!==g);catDropIds(T,ids);save();renderCatSettings();if(UI.view==='projects') render();return}
  if(b=c('[data-cg-new]')){const g={id:uid(),level:b.dataset.cgNew,name:'New list',items:[]};catsOf(T).push(g);save();renderCatSettings();const x=$(`#setCats [data-cg-name="${g.id}"]`);if(x){x.focus();x.select()}return}
});
function catRename(id,v){const T=team(),r=catFind(T,id);FD.edit=null;const n=String(v||'').trim().slice(0,40);if(r&&n&&n!==r.it.name){r.it.name=n;save();if(UI.view==='projects') render()}renderCatSettings()}
function catAdd(gid,v){const T=team(),g=catsOf(T).find(x=>x.id===gid),n=String(v||'').trim().slice(0,40);if(!g||!n) return;if(!g.items.some(x=>x.name.toLowerCase()===n.toLowerCase())){g.items.push({id:uid(),name:n});save()}renderCatSettings();const x=$(`#setCats [data-ci-add="${gid}"]`);if(x) x.focus()}
$('#dSettings').addEventListener('keydown',e=>{
  const t=e.target;if(!t.matches||!t.closest('#setCats')) return;
  if(t.matches('[data-ci-ren]')){if(e.key==='Enter'){e.preventDefault();catRename(t.dataset.ciRen,t.value)}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();FD.edit=null;renderCatSettings()}return}
  if(t.matches('[data-ci-add]')&&e.key==='Enter'){e.preventDefault();catAdd(t.dataset.ciAdd,t.value);return}
  if(t.matches('[data-cg-name]')&&e.key==='Enter'){e.preventDefault();t.blur()}
});
$('#dSettings').addEventListener('focusout',e=>{
  const t=e.target;if(!t.matches||!t.closest('#setCats')) return;
  if(t.matches('[data-ci-ren]')&&FD.edit===t.dataset.ciRen){catRename(t.dataset.ciRen,t.value);return}
  if(t.matches('[data-cg-name]')){const g=catsOf(team()).find(x=>x.id===t.dataset.cgName),n=t.value.trim().slice(0,40);if(g&&n&&n!==g.name){g.name=n;save();if(UI.view==='projects') render()}else if(g) t.value=g.name}
});

upgradeFolders();
