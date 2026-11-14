/* Noon redesign mockup · client view (the header shown when Pages is filtered to one client) + client and folder dialogs. */
function clientHead(c,folder=null){
  const pages=PAGES.filter(p=>p.client===c.id),open=pages.reduce((a,p)=>a+openOf(p),0);
  const st=k=>pages.filter(p=>statusOf(p)===k).length;
  const chip=(f,label,n)=>`<a class="fchip ${folder===f?'on':''}" href="${clientHash(c.id,f)}">${f?ic('folder',14):''}${esc(label)}<span class="num">${n}</span></a>`;
  return `<div class="greet chead">
    <div class="ch-row"><span class="tile xl" aria-hidden="true">${esc(c.name[0])}</span>
      <div class="ch-t"><h1 class="disp">${esc(c.name)}</h1>
        <p class="gsub">${c.cats.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}<span class="dot">·</span><span>${pages.length} pages</span><span class="dot">·</span>${stSvg('progress',14)}<span>${st('progress')} in progress</span>${st('scheduled')?`<span class="dot">·</span>${stSvg('scheduled',14)}<span>${st('scheduled')} scheduled</span>`:''}${st('done')?`<span class="dot">·</span>${stSvg('done',14)}<span>${st('done')} done</span>`:''}${open?`<span class="dot">·</span><span>${open} open comments</span>`:''}</p></div>
      <span class="sp"></span>
      <button class="btn btn-line" data-act="clientEdit">${ic('settings',15)}Name and categories</button>
      <button class="ib" data-act="clientMore" aria-label="More for ${esc(c.name)}" aria-haspopup="menu">${ic('more',18)}</button></div>
    <div class="fchips">${chip(null,'All pages',pages.length)}${c.folders.map(f=>chip(f,f,pages.filter(p=>p.folder===f).length)).join('')}<button class="fchip add" data-act="newFolder">${ic('plus',14)}New folder</button></div>
  </div>`;
}
const curClient=()=>client(ctx()?.id||S.f.client[0]);
function clientDlg(c){
  const isNew=!c;const d={name:c?c.name:'',aud:c?c.cats[0]:'B2B',ind:c?c.cats[1]:''};
  const draw=o=>{o.querySelector('.dlg').innerHTML=`<div class="dlg-h"><b>${isNew?'New project':'Name and categories'}</b><button class="ib" data-act="dlgClose" aria-label="Close">${ic('x',18)}</button></div>
   <div class="dlg-b"><label class="fld"><span>Project name</span><input id="cName" value="${esc(d.name)}" placeholder="e.g. Brightleaf"></label>
   ${CATS.filter(l=>l.level==='client').map(l=>`<div class="fld"><span>${esc(l.name)}</span><div class="chips">${l.items.map(t=>`<button class="chip ${(l.id==='aud'?d.aud:d.ind)===t?'on':''}" data-cat="${l.id}" data-v="${esc(t)}" aria-pressed="${(l.id==='aud'?d.aud:d.ind)===t}">${esc(t)}</button>`).join('')}</div></div>`).join('')}
   <p class="hint">Project categories count for every page inside this project. Edit the lists in Settings › Categories.</p></div>
   <div class="dlg-f"><button class="btn btn-line" data-act="dlgClose">Cancel</button><button class="btn btn-ink" id="cSave">${isNew?'Create project':'Save'}</button></div>`;
    o.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{d.name=o.querySelector('#cName').value;if(b.dataset.cat==='aud')d.aud=b.dataset.v;else d.ind=d.ind===b.dataset.v?'':b.dataset.v;draw(o)});
    o.querySelector('#cSave').onclick=()=>{const name=o.querySelector('#cName').value.trim();if(!name){o.querySelector('#cName').focus();return}
      const u=snapAll();const cats=[d.aud,d.ind].filter(Boolean);
      if(isNew){const id='c'+Date.now().toString(36);CLIENTS.push({id,name,cats,folders:[]});closeDlg();setClient(id);toast(`Created ${name}`,()=>{u();go('#projects')})}
      else{c.name=name;c.cats=cats;closeDlg();render(true);toast('Project saved',u)}};
    const i=o.querySelector('#cName');i.focus();i.setSelectionRange(i.value.length,i.value.length);i.onkeydown=e=>{if(e.key==='Enter')o.querySelector('#cSave').click()};
  };
  openDlg('',draw);
}
function folderDlg(c,{moveAll=false}={}){
  openDlg(`<div class="dlg-h"><b>${moveAll?'Put everything in a new folder':'New folder'}</b><button class="ib" data-act="dlgClose" aria-label="Close">${ic('x',18)}</button></div>
   <div class="dlg-b"><label class="fld"><span>Folder name</span><input id="fName" placeholder="${moveAll?'e.g. 2026 launch':'e.g. Advertorials'}"></label>
   ${moveAll?`<p class="hint">All ${PAGES.filter(p=>p.client===c.id).length} pages of ${esc(c.name)} move into this folder. ${esc(c.name)} stays on top.</p>`:''}</div>
   <div class="dlg-f"><button class="btn btn-line" data-act="dlgClose">Cancel</button><button class="btn btn-ink" id="fSave">${moveAll?'Move pages':'Create folder'}</button></div>`,o=>{
    const i=o.querySelector('#fName');i.focus();i.onkeydown=e=>{if(e.key==='Enter')o.querySelector('#fSave').click()};
    o.querySelector('#fSave').onclick=()=>{const name=i.value.trim();if(!name){i.focus();return}if(c.folders.includes(name)){toast('That folder already exists');return}
      const u=snapAll();c.folders.push(name);S.open.add(c.id);
      if(moveAll)PAGES.filter(p=>p.client===c.id).forEach(p=>p.folder=name);
      closeDlg();if(moveAll)go(clientHash(c.id,name));else render(true);toast(moveAll?`Moved ${c.name}'s pages into ${name}`:`Created folder ${name}`,u)}});
}
/* undo snapshot that also covers clients */
function snapAll(){const a=snap(),c=JSON.stringify(CLIENTS);return()=>{a();const o=JSON.parse(c);CLIENTS.length=0;o.forEach(x=>CLIENTS.push(x))}}
Object.assign(ACT,{
  newClient:()=>clientDlg(null),
  clientEdit:()=>clientDlg(curClient()),
  clientMore:a=>{const c=curClient();openMenu(a,()=>[
    {label:'Name and categories',pre:ic('settings',15),pick:()=>setTimeout(()=>clientDlg(c))},
    {label:'New folder',pre:ic('folder',15),pick:()=>setTimeout(()=>folderDlg(c))},
    {label:'Put everything in a new folder',pre:ic('folder',15),pick:()=>setTimeout(()=>folderDlg(c,{moveAll:true}))},
    {sep:1},{label:'Delete project',danger:true,pre:ic('trash',15),pick:()=>toast('Deleting a project keeps its pages. Off in the mockup.')}])},
  newFolder:()=>folderDlg(curClient()),
});

/* demo hook: ?clients=100 fills the workspace to test how it behaves at scale */
function genClients(n){const A=['North','Blue','Oak','Bright','Haven','Sol','Copper','Ridge','Lumen','Fable','Willow','Cedar','Maple','Harbor','Summit','Juniper','Atlas','Nova','Pine','River'],B=['wind','fin','line','leaf','well','stone','field','path','works','light'],C=['Health','Skin','Labs','Coffee','Dental','Supply','Studio','Goods','Clinic','Pets'];
  const IND={Health:'Telehealth',Skin:'Beauty',Labs:'Dental',Coffee:'Marketing',Dental:'Dental',Supply:'Marketing',Studio:'Marketing',Goods:'Beauty',Clinic:'Telehealth',Pets:'Beauty'},who=['me','milo','paul'];
  for(let i=CLIENTS.length;i<n;i++){const a=A[i%20],b=B[(i*7)%10],c=C[(i*3+Math.floor(i/20))%10],id='g'+i;
    CLIENTS.push({id,name:`${a}${b} ${c}`,cats:[i%3?'DTC':'B2B',IND[c]],folders:i%4?[]:['Ads']});
    for(let j=0,k=1+(i%3);j<k;j++){const t=TYPES[(i+j)%TYPES.length],st=(i+j)%4,cn=((i+j)%3)+1;
      PAGES.push({id:id+'p'+j,name:`${a}${b} ${t.toLowerCase()}${j?' '+(j+1):''}`,client:id,folder:null,types:[t],style:STYLES[(i+j)%3],copy:{n:st?cn:0,final:st===3?cn:0,open:st===1?1+(i%4):0},design:{n:st>1?1:0,final:st===3?1:0,open:0},ads:null,to:[who[(i+j)%3]],due:'2026-11-'+String(14+((i*3+j)%16)).padStart(2,'0'),at:60*((i*13+j*7)%300)+30,by:who[(i+j+1)%3],star:false,share:false,created:'Nov 1',creator:'me',head:'',sub:''})}}}
