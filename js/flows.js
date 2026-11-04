/* Noon · templates and steps. A project is a checklist: stages, each with steps, each step with a person. Steps happen
   in order from top to bottom, and the next person only sees their step once the one before it is done (tkLocked in
   core.js). A template is that same list, ready to reuse: starting a project copies it, so changing a template never
   touches work already running. Everything that happens on a project is kept in p.log, so its history can be read back. */

const FI={flow:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg>'};
const FB={open:{},adding:null,more:null,seen:null};
const flowsOf=T=>(T.flows=T.flows||[]);
const flowById=id=>flowsOf(team()).find(f=>f.id===id)||null;
const curFlow=()=>flowById(PV.flowId);
const stepsOf=f=>f.phases.flatMap(ph=>ph.steps);
const stepPhase=(f,id)=>f.phases.find(ph=>ph.steps.some(s=>s.id===id))||null;
const qTypes={text:'Text',number:'Number',yesno:'Yes or no'};
const CHEV='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
// what a repeating step repeats over, read from its question: "How many pages are we building?" gives Page
const eachWord=q=>{const m=/how many\s+([\p{L}]+)/iu.exec((q&&q.label)||'');return m?cap(m[1].toLowerCase().replace(/s$/,'')):'Item'};

/* ---------- the starter: a template to change, not one you are stuck with ---------- */
function flowFromTemplate(){
  const pages=uid(),assets=uid(),st=(title,o={})=>({id:uid(),title,who:null,...o}),maker={t:'creator'},ph=(name,steps)=>({id:uid(),name,steps});
  return {id:uid(),name:'Landing page',at:Date.now(),by:me().id,
    qs:[{id:uid(),label:"What's the client's name?",type:'text'},{id:pages,label:'How many pages are we building?',type:'number'},{id:assets,label:'Do we have branded assets?',type:'yesno'}],
    phases:[
      ph('Research',[st('Do the client research'),st('Research the angles'),st('Align the research with the client',{who:maker})]),
      ph('Copy',[st('Propose copy directions'),st('Write the copy',{each:pages})]),
      ph('Page design',[st('Collect the brand assets',{when:{q:assets,is:'no'}}),st('Design the page',{each:pages})]),
      ph('Feedback and changes',[st('Leave feedback on the design',{who:maker}),st('Follow up on the feedback')]),
      ph('Push live',[st('Push it live'),st('Check it live',{who:maker})]),
    ]};
}
function blankFlow(){return {id:uid(),name:'New template',at:Date.now(),by:me().id,qs:[],phases:[{id:uid(),name:'Stage 1',steps:[]}]}}
function copyFlow(f){const m={},id=x=>m[x]||(m[x]=uid()),o=JSON.parse(JSON.stringify(f));o.id=uid();o.name=f.name+' copy';o.at=Date.now();o.by=me().id;
  for(const q of o.qs) q.id=id(q.id);
  for(const ph of o.phases){ph.id=uid();for(const s of ph.steps){s.id=uid();if(s.each) s.each=id(s.each);if(s.when&&s.when.q) s.when.q=id(s.when.q)}}
  return o}

/* ---------- a template plus the answers becomes a project's steps ---------- */
const stepOn=(s,ans)=>!s.when||!s.when.q||!ans[s.when.q]||ans[s.when.q]===s.when.is;
const stepCount=(s,ans)=>s.each?clamp(parseInt(ans[s.each],10)||1,1,30):1;
const stepPerson=s=>!s.who?'':s.who.t==='creator'?me().id:(team().members.some(z=>z.id===s.who.id)?s.who.id:'');
// tasks in a project wait on the step above them; steps marked "same time" and the copies of a repeated step run together
function flowChain(T,p){
  let prev=[],cur=[];
  for(const t of p.flow.phases.flatMap(ph=>phaseTasks(T,p,ph))){t.fl=t.fl||{};if(!t.fl.with||!cur.length){prev=cur;cur=[]}t.fl.after=prev.map(x=>x.id);cur.push(t)}
}
function logEvent(p,type,data={},task=null){(p.log=p.log||[]).push({id:uid(),at:Date.now(),by:me().id,type,data,...(task?{task}:{})})}
function flowStart(T,p,f,ans,picks){
  const base=Date.now();let n=0;
  for(const ph of f.phases) for(const s of ph.steps){ if(!stepOn(s,ans)) continue;
    const N=stepCount(s,ans),who=picks[s.id]!==undefined?picks[s.id]:stepPerson(s),q=f.qs.find(x=>x.id===s.each);
    for(let i=0;i<N;i++) tasksOf(T).push({id:uid(),title:(N>1?`${s.title}, ${eachWord(q).toLowerCase()} ${i+1}`:s.title).slice(0,120),note:s.note||'',to:who?[who]:[],by:me().id,day:null,time:null,tz:home(),at:base,done:null,re:{},cm:[],files:[],pj:p.id,
      fl:{ph:ph.id,seq:n++,step:s.id,...(i>0||s.together?{with:true}:{}),...(/feedback|review/i.test(s.title)?{onv:true}:{})}});
  }
  p.flow={id:f.id,name:f.name,qs:f.qs.map(q=>({id:q.id,label:q.label,type:q.type})),ans:{...ans},phases:f.phases.map(ph=>({id:ph.id,name:ph.name})),at:base,by:me().id};
  flowChain(T,p);for(const t of projTasks(T,p)) tkJoinProject(t);
  logEvent(p,'started',{flow:f.name,tasks:n,answers:ans});touch(p);
}
// a project with no template still gets a place for its steps
function flowEnsure(p){if(!p.flow) p.flow={id:null,name:'Steps',qs:[],ans:{},phases:[{id:uid(),name:'Steps'}],at:Date.now(),by:me().id};return p.flow}
const phaseTasks=(T,p,ph)=>{const first=p.flow.phases[0];return projTasks(T,p).filter(t=>{const v=t.fl&&p.flow.phases.some(x=>x.id===t.fl.ph)?t.fl.ph:first.id;return v===ph.id}).sort((a,b)=>((a.fl&&a.fl.seq)||0)-((b.fl&&b.fl.seq)||0))};
const pjPhaseNow=(T,p)=>p.flow?p.flow.phases.find(ph=>phaseTasks(T,p,ph).some(t=>!t.done))||null:null;
function flowAddTask(T,p,ph,title,to,extra={},alongside=false){
  const list=phaseTasks(T,p,ph),t=addTask(title,to,null,null,extra.note||'',{pj:p.id,...(extra.ver?{ver:extra.ver}:{}),fl:{ph:ph.id,seq:list.length?Math.max(...list.map(x=>(x.fl&&x.fl.seq)||0))+1:0,...(alongside?{with:true}:{})}});
  flowChain(T,p);tkJoinProject(t);logEvent(p,'added',{title:t.title},t.id);touch(p);save();return t;
}
// what a project is up to, in one line for the project list
function pjNowLabel(T,p){
  if(!p.flow||!projTasks(T,p).length) return '';const ph=pjPhaseNow(T,p);if(!ph) return 'All steps done';
  const n=[...new Set(phaseTasks(T,p,ph).filter(t=>!t.done&&!tkLocked(t,T)).flatMap(t=>t.to))].map(id=>{const z=findM(id,T);return z?(z.isMe?'you':first(z.name)):null}).filter(Boolean);
  return `${ph.name}${n.length?`: ${n.slice(0,2).join(', ')}${n.length>2?` +${n.length-2}`:''}`:''}`;
}
// the version a task is about: the one it was made from, or for feedback, the latest one
const tkVer=t=>{const p=tkProject(t);if(!p) return null;return (t.ver&&verById(p,t.ver))||(t.fl&&t.fl.onv?curVer(p):null)};
function openTaskVersion(t){const v=tkVer(t);if(!v) return;PV.proj=t.pj;PV.flows=false;UI.tkEdit=null;if(PV.mode!=='compare') PV.mode='comment';if(UI.view!=='projects') setView('projects',true);renderTaskDetail();openVer(v.id);renderSide()}
function tkDrop(T,t){const p=tkProject(t,T);T.tasks=tasksOf(T).filter(x=>x.id!==t.id);if(p&&p.flow) flowChain(T,p)}
// do a stage again: the same steps added to the end of it, and what comes next waits for them
function flowRound(T,p,ph){
  const inPh=phaseTasks(T,p,ph);if(!inPh.length) return;
  const round=Math.max(...inPh.map(t=>(t.fl&&t.fl.round)||1)),seq=Math.max(...inPh.map(t=>(t.fl&&t.fl.seq)||0));
  inPh.filter(t=>((t.fl&&t.fl.round)||1)===round).forEach((t,i)=>tasksOf(T).push({id:uid(),title:`${t.title.replace(/, round \d+$/,'')}, round ${round+1}`.slice(0,120),note:t.note||'',to:[...t.to],by:me().id,day:null,time:null,tz:home(),at:Date.now(),done:null,re:{},cm:[],files:[],pj:p.id,...(t.pri?{pri:t.pri}:{}),fl:{...t.fl,ph:ph.id,round:round+1,seq:seq+1+i}}));
  flowChain(T,p);logEvent(p,'round',{phase:ph.name,round:round+1});touch(p);
}
// the ids people carry change when a device-only team moves to an account
function flowRemap(T,map){
  for(const f of T.flows||[]) for(const s of stepsOf(f)) if(s.who&&s.who.t==='person') s.who.id=map(s.who.id);
  for(const p of T.projects||[]){if(p.flow&&p.flow.by) p.flow.by=map(p.flow.by);for(const e of p.log||[]) if(e.by) e.by=map(e.by)}
}

/* ---------- dropdowns: a button and a floating list that look like the rest of Noon, with faces and names for people.
   Picking sets the button's value and fires input and change on it, so a screen listens to it the way it would a form field. ---------- */
const DD={el:null,btn:null};
const DD_MAKER='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>';
const ddMember=o=>o.m?findM(o.m,team()):null;
const ddLabel=(o,short)=>{const z=ddMember(o);return z?(z.isMe?(short?'Me':`${z.name} (you)`):(short?first(z.name):z.name)):(o.l||'')};
const ddFace=(o,cls,status)=>{const z=ddMember(o);return z?avatar(z,cls,status):o.ic==='none'?`<span class="dd-none">${I.plus}</span>`:o.ic==='maker'?`<span class="dd-maker">${DD_MAKER}</span>`:''};
function ddInner(opts,sel){
  const picked=opts.filter(o=>sel.includes(o.v));
  if(picked.length>1) return `<span class="avs sm">${picked.slice(0,2).map(o=>ddFace(o,'')).join('')}</span><span class="dd-lab">${picked.length} people</span>${CHEV}`;
  const o=picked[0];return `${o?ddFace(o,''):''}<span class="dd-lab${o&&o.ic==='none'?' none':''}">${esc(o?ddLabel(o,true):'Choose')}</span>${CHEV}`;
}
function ddBtn(attr,value,opts,{cls='',label='Choose'}={}){
  const sel=Array.isArray(value)?(value.length?value:['']):[value];
  return `<button type="button" class="dd-btn ${cls}" ${attr} value="${esc(sel[0])}" data-dd-sel="${esc(`[${attr}]`)}" data-dd-opts="${esc(JSON.stringify(opts))}" data-dd-now="${esc(sel.join(','))}" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(label)}">${ddInner(opts,sel)}</button>`;
}
const whoBtn=(attr,value,withMaker=false)=>ddBtn(attr,value,[...(withMaker?[{v:'creator',l:'Whoever starts it',s:'The person who starts the project',ic:'maker'}]:[]),...team().members.map(z=>({v:z.id,m:z.id})),{v:'',l:'Nobody yet',ic:'none'}],{cls:'who',label:'Who does this'});
function ddClose(refocus=true){
  if(!DD.el) return;const b=DD.btn;DD.el.remove();DD.el=null;DD.btn=null;b.setAttribute('aria-expanded','false');if(refocus&&b.isConnected) b.focus();
}
function ddOpen(btn){
  ddClose(false);
  const opts=JSON.parse(btn.dataset.ddOpts),now=btn.dataset.ddNow.split(','),t=Date.now(),m=document.createElement('div');
  m.className='dd dd-menu';m.id='ddMenu';m.setAttribute('role','listbox');m.setAttribute('aria-label',btn.getAttribute('aria-label')||'Choose');
  m.innerHTML=opts.map((o,i)=>{const z=ddMember(o),on=now.includes(o.v),sub=z?`${tzLabel(z.tz)} · ${fmtT(t,z.tz)}`:(o.s||'');
    return `${o.ic==='none'&&i?'<hr class="dd-sep">':''}<button type="button" class="opt" role="option" aria-selected="${on}" data-dd-pick="${esc(o.v)}">${ddFace(o,'sm',z?statusNow(z,t)[0]:undefined)}<span class="n">${esc(ddLabel(o))}${sub?`<small>${esc(sub)}</small>`:''}</span>${on?`<span class="dd-ck">${I.check}</span>`:''}</button>`}).join('');
  (btn.closest('dialog')||document.body).append(m);DD.el=m;DD.btn=btn;btn.setAttribute('aria-expanded','true');
  // under the button when it fits, above it when it does not, and always on screen
  const r=btn.getBoundingClientRect(),W=innerWidth,H=innerHeight,w=Math.min(W-24,Math.max(r.width,opts.some(o=>o.m)?280:220));
  m.style.width=w+'px';m.style.left=clamp(r.width>=w||r.left+r.width/2<W/2?r.left:r.right-w,12,W-w-12)+'px';
  const h=m.scrollHeight,below=H-r.bottom-18,above=r.top-18,up=h>below&&above>below,room=Math.max(160,up?above:below),shown=Math.min(h,room,360);
  m.style.maxHeight=shown+'px';m.style.top=(up?r.top-shown-6:r.bottom+6)+'px';
  (m.querySelector('[aria-selected=true]')||m.querySelector('.opt')).focus({preventScroll:true});
}
function ddPick(v){
  const btn=DD.btn,sel=btn.dataset.ddSel,opts=JSON.parse(btn.dataset.ddOpts);ddClose(false);
  const live=btn.isConnected?btn:$(sel);if(!live) return;
  live.value=v;live.dataset.ddNow=v;live.innerHTML=ddInner(opts,[v]);
  live.dispatchEvent(new Event('input',{bubbles:true}));live.dispatchEvent(new Event('change',{bubbles:true}));
  const again=$(sel);if(again) again.focus();
}
document.addEventListener('click',e=>{
  const t=e.target;if(!t.closest) return;
  const o=t.closest('[data-dd-pick]');if(o&&DD.el&&DD.el.contains(o)){ddPick(o.dataset.ddPick);return}
  const b=t.closest('.dd-btn');if(b){if(DD.btn===b) ddClose();else ddOpen(b)}
});
document.addEventListener('pointerdown',e=>{if(DD.el&&e.target.closest&&!DD.el.contains(e.target)&&e.target.closest('.dd-btn')!==DD.btn) ddClose(false)},true);
document.addEventListener('keydown',e=>{
  if(!DD.el){const b=e.target.closest&&e.target.closest('.dd-btn');if(b&&(e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();ddOpen(b)}return}
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();ddClose();return}
  if(e.key==='Tab'){ddClose(false);return}
  const L=$$('.opt',DD.el),i=L.indexOf(document.activeElement),go={ArrowDown:i+1,ArrowUp:i-1,Home:0,End:L.length-1}[e.key];
  if(go===undefined) return;e.preventDefault();e.stopPropagation();L[(go+L.length)%L.length].focus();
},true);
addEventListener('scroll',e=>{if(DD.el&&!DD.el.contains(e.target)) ddClose(false)},true);
addEventListener('resize',()=>ddClose(false));

/* ---------- a project's steps ---------- */
function stepsTabHtml(p){
  if(!p.flow) return `<div class="st-empty"><b>No steps yet</b><p>Steps are what needs doing on this project, and who does each one.</p><div class="st-empty-acts"><button type="button" class="btn dark" data-fw-start>Use a template</button><button type="button" class="btn" data-st-own>Add my own steps</button></div></div>`;
  return `<div class="st-page" id="stepsWrap">${stepsHtml(p)}</div>`;
}
function taskRowHtml(T,t){
  const my=me().id,st=t.done?'done':tkLocked(t,T)?'wait':'now',mine=st==='now'&&t.to.includes(my),ppl=t.to.map(id=>findM(id,T)).filter(Boolean),du=taskDue(t),vv=st==='done'?null:tkVer(t),cm=(t.cm||[]).length;
  const waits=st==='wait'?tkWaits(t,T):[],on=[...new Set(waits.flatMap(x=>x.to))].map(id=>{const z=findM(id,T);return z?(z.isMe?'you':first(z.name)):''}).filter(Boolean);
  const sub=st==='done'?du.label:st==='wait'?`Waiting for ${on.length?on.slice(0,2).join(' and '):'the step above'}`:[mine?'Your turn':ppl.length?'In progress':'Needs someone',t.day?du.label:''].filter(Boolean).join(' · ');
  return `<div class="st-row is-${st}${mine?' mine':''}${st==='now'&&du.state==='overdue'?' late':''}${UI.tkEdit===t.id?' sel':''}" role="button" tabindex="0" data-st-task="${t.id}">
    <button type="button" class="st-ck" data-st-done="${t.id}" aria-label="${st==='done'?'Mark not done':st==='wait'?'Not its turn yet':'Mark done'}">${st==='done'?I.check:''}</button>
    <div class="st-main"><div class="st-title">${esc(t.title)}${t.pri==='high'?`<span class="st-high">${I.flag}High priority</span>`:''}</div><div class="st-sub"><span class="st-state">${esc(sub)}</span>${vv?`<button type="button" class="ptk-ver" data-st-ver="${t.id}">Open ${esc(vLabel(vv))}</button>`:''}${cm?`<span class="cm-n">${PI.bubble}${cm}</span>`:''}</div></div>
    <div class="st-acts">${mine?`<button type="button" class="btn sm dark" data-st-done="${t.id}">Mark done</button>`:''}${whoBtn(`data-st-who="${t.id}"`,t.to)}</div></div>`;
}
function stepsHtml(p){
  const T=team(),fl=p.flow,cur=pjPhaseNow(T,p),qs=fl.qs||[];
  const stage=(ph,i)=>{const L=phaseTasks(T,p,ph),done=L.filter(t=>t.done).length,all=L.length,state=all&&done===all?'done':ph===cur?'now':'later',open=FB.open[ph.id]!==undefined?FB.open[ph.id]:(state==='now'||!all),only=fl.phases.length===1;
    const sum=state==='done'?`All ${all} done`:state==='now'?`${done} of ${all} done`:all?plural(all,'step'):'No steps yet';
    return `<section class="st-stage ${state}">${only?'':`<div class="st-headrow"><button type="button" class="st-head" data-st-toggle="${ph.id}" aria-expanded="${open}"><span class="st-n">${state==='done'?I.check:i+1}</span><b>${esc(ph.name)}</b><small>${sum}</small><span class="st-chev${open?' up':''}">${CHEV}</span></button>${state==='done'?`<button type="button" class="st-link" data-st-repeat="${ph.id}">Do it again</button>`:''}</div>`}
      ${open||only?`<div class="st-rows">${L.map(t=>taskRowHtml(T,t)).join('')}</div><div class="st-foot">${stageAdd(ph,'Add a step')}</div>`:''}</section>`};
  const dOpen=!!FB.open['details:'+p.id];
  const details=qs.length?`<section class="st-stage quiet"><button type="button" class="st-head" data-st-toggle="details:${p.id}" aria-expanded="${dOpen}"><b>Project details</b><span class="st-chev${dOpen?' up':''}">${CHEV}</span></button>${dOpen?`<div class="st-details">${qs.map(q=>`<label class="lbl">${esc(q.label)}${q.type==='yesno'?ddBtn(`data-st-ans="${q.id}"`,fl.ans[q.id]||'',[{v:'',l:'Not answered'},{v:'yes',l:'Yes'},{v:'no',l:'No'}],{cls:'field',label:q.label}):`<input data-st-ans="${q.id}" type="${q.type==='number'?'number':'text'}" value="${esc(fl.ans[q.id]||'')}">`}</label>`).join('')}</div>`:''}</section>`:'';
  return fl.phases.map(stage).join('')+details;
}
const stageAdd=(ph,label)=>FB.adding===ph.id?`<form class="st-new" data-ph="${ph.id}" autocomplete="off"><input id="stNew" maxlength="100" placeholder="What needs doing? Press Enter to add" aria-label="${label}"></form>`:`<button type="button" class="st-add" data-st-add="${ph.id}">${I.plus}<span>${label}</span></button>`;
function stepsRefresh(){
  const w=$('#stepsWrap');if(!w) return;
  if(PV.flows){const f=curFlow();if(f) w.innerHTML=editorHtml(f)}else{const p=projById(PV.proj);if(p&&p.flow) w.innerHTML=stepsHtml(p)}
  const n=$('#stNew');if(n) n.focus();
}
function historyTabHtml(p){
  const T=team(),txt=e=>{const d=e.data||{};return {started:`Started from the ${d.flow||''} template`,done:`Finished ${d.title||'a step'}`,reopened:`Reopened ${d.title||'a step'}`,round:`Repeated ${d.phase||'a stage'}`,added:`Added ${d.title||'a step'}`,assigned:`Put ${d.who||'someone'} on ${d.title||'a step'}`,priority:`${d.high?'Marked':'Unmarked'} ${d.title||'a step'} as high priority`}[e.type]||null};
  const ev=[...(p.log||[]).map(e=>({at:e.at,by:e.by,text:txt(e)})).filter(e=>e.text),...versOf(p).map(v=>({at:v.at||0,by:v.by,text:`Uploaded ${vLabel(v)}, ${v.name}`}))].sort((a,b)=>b.at-a.at);
  const row=e=>{const z=e.by&&findM(e.by,T);return `<div class="fl-ev">${z?avatar(z,'xs'):'<span class="av xs">?</span>'}<span><b>${esc(z?(z.isMe?'You':first(z.name)):'Someone')}</b> ${esc(e.text)}</span><time>${esc(agoLabel(e.at))}</time></div>`};
  return `<div class="st-page"><div class="fl-hist">${ev.length?ev.map(row).join(''):'<p class="ptk-hint">Nothing here yet. Everything that happens on this project is kept here.</p>'}</div></div>`;
}

/* ---------- templates: a list of them, and each one as a plain list you can edit ---------- */
function renderFlows(){if(PV.flowId) renderFlowEditor();else renderFlowsHome()}
function renderFlowsHome(){
  const T=team(),F=flowsOf(T);
  const row=f=>`<div class="st-tpl" role="button" tabindex="0" data-fl-open="${f.id}"><div class="st-tpl-t"><b>${esc(f.name)}</b><small>${esc(f.phases.map(ph=>ph.name).join(', '))}</small></div><div class="st-tpl-acts"><button type="button" class="btn sm" data-fl-dup="${f.id}">Duplicate</button><button type="button" class="st-x" data-fl-del="${f.id}" aria-label="Delete ${esc(f.name)}">${I.trash}</button></div></div>`;
  $('#vProj').innerHTML=`<header class="top"><button type="button" class="chev" id="flBack" aria-label="Back to projects">${PI.back}</button><div class="ttl-wrap"><h1>Templates</h1><span class="sub">The steps you repeat on every project, ready to reuse</span></div>
      <div class="topnav"><button type="button" class="lbtn dark" id="flNew" title="New template">${I.plus}<span>New template</span></button></div></header>
    <div class="pj-body st-canvas"><div class="st-page">${F.length?F.map(row).join(''):`<div class="st-empty"><b>No templates yet</b><p>A template is a checklist of the steps you repeat on every project. Start from ours and change what does not fit.</p><div class="st-empty-acts"><button type="button" class="btn dark" data-fl-make="tpl">Use the landing page template</button><button type="button" class="btn" data-fl-make="blank">Start empty</button></div></div>`}</div></div>`;
}
function renderFlowEditor(){
  const f=curFlow();if(!f){PV.flowId=null;renderFlowsHome();return}
  $('#vProj').innerHTML=`<header class="top"><button type="button" class="chev" id="flBackList" aria-label="All templates">${PI.back}</button><div class="ttl-wrap"><h1 class="editable" id="flName" contenteditable="true" spellcheck="false" title="Click to rename">${esc(f.name)}</h1><span class="sub">Saves by itself. Projects already running stay as they are.</span></div>
      <div class="topnav"><button type="button" class="lbtn dark" id="flUse"><span>Start a project</span></button></div></header>
    <div class="pj-body st-canvas" id="stBody"><div class="st-page" id="stepsWrap">${editorHtml(f)}</div></div>`;
  const n=$('#stNew');if(n) n.focus();
}
function editorHtml(f){
  const numQ=f.qs.filter(q=>q.type==='number'),ynQ=f.qs.filter(q=>q.type==='yesno');
  const tags=s=>[s.each&&f.qs.find(q=>q.id===s.each)?`One per ${eachWord(f.qs.find(q=>q.id===s.each)).toLowerCase()}`:'',s.when&&f.qs.find(q=>q.id===s.when.q)?`Only if the answer is ${s.when.is}`:'',s.together?'Same time as the step above':''].filter(Boolean);
  const stepRow=(s,i,ph)=>{const open=FB.more===s.id,who=!s.who?'':s.who.t==='creator'?'creator':s.who.id,t=tags(s);
    return `<div class="st-row edit" data-step="${s.id}"><span class="st-grip" draggable="true" data-st-drag="${s.id}" title="Drag to move" aria-hidden="true"><svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor"><circle cx="2.5" cy="3" r="1.4"/><circle cx="7.5" cy="3" r="1.4"/><circle cx="2.5" cy="8" r="1.4"/><circle cx="7.5" cy="8" r="1.4"/><circle cx="2.5" cy="13" r="1.4"/><circle cx="7.5" cy="13" r="1.4"/></svg></span>
      <div class="st-main"><input class="st-in" data-st-title="${s.id}" maxlength="100" value="${esc(s.title)}" aria-label="Step">${t.length?`<div class="st-sub">${esc(t.join(', '))}</div>`:''}</div>
      <div class="st-acts">${whoBtn(`data-st-swho="${s.id}"`,who,true)}<button type="button" class="st-link" data-st-more="${s.id}" aria-expanded="${open}">${open?'Less':'More'}</button><button type="button" class="st-x" data-st-del="${s.id}" aria-label="Delete ${esc(s.title)}">${I.x}</button></div></div>
      ${open?`<div class="st-more"><label class="lbl">Instructions<textarea class="st-note" data-st-note="${s.id}" maxlength="1000" placeholder="What to do, and what done looks like">${esc(s.note||'')}</textarea></label>
        ${numQ.length?`<label class="lbl">How many${ddBtn(`data-st-each="${s.id}"`,s.each||'',[{v:'',l:'Just one'},...numQ.map(q=>({v:q.id,l:`One for each: ${q.label}`}))],{cls:'field',label:'How many'})}</label>`:''}
        ${ynQ.length?`<label class="lbl">When${ddBtn(`data-st-when="${s.id}"`,s.when?`${s.when.q}|${s.when.is}`:'',[{v:'',l:'Always'},...ynQ.flatMap(q=>['yes','no'].map(v=>({v:`${q.id}|${v}`,l:`Only if "${q.label}" is ${v}`})))],{cls:'field',label:'When'})}</label>`:''}
        ${i||f.phases.indexOf(ph)?`<label class="st-check"><input type="checkbox" data-st-together="${s.id}" ${s.together?'checked':''}><span>Can happen at the same time as the step above</span></label>`:''}</div>`:''}`};
  return `<section class="st-stage quiet"><div class="st-head static"><b>Questions when a project starts</b></div><div class="st-qs">${f.qs.map(q=>`<div class="st-q"><input class="st-in" data-st-q="${q.id}" maxlength="120" value="${esc(q.label)}" placeholder="Type a question" aria-label="Question">${ddBtn(`data-st-qtype="${q.id}"`,q.type,Object.entries(qTypes).map(([k,l])=>({v:k,l})),{label:'Kind of answer'})}<button type="button" class="st-x" data-st-qdel="${q.id}" aria-label="Delete question">${I.x}</button></div>`).join('')}</div><div class="st-foot"><button type="button" class="st-add" data-st-qadd>${I.plus}<span>Add a question</span></button></div></section>
    ${f.phases.map((ph,i)=>`<section class="st-stage"><div class="st-head static"><span class="st-n">${i+1}</span><input class="st-in st-name" data-st-ph="${ph.id}" maxlength="60" value="${esc(ph.name)}" aria-label="Stage name"><span class="st-order"><button type="button" class="st-x" data-st-up="${ph.id}" aria-label="Move ${esc(ph.name)} up" ${i?'':'disabled'}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></button><button type="button" class="st-x" data-st-down="${ph.id}" aria-label="Move ${esc(ph.name)} down" ${i<f.phases.length-1?'':'disabled'}>${CHEV}</button><button type="button" class="st-x" data-st-phdel="${ph.id}" aria-label="Delete ${esc(ph.name)}">${I.trash}</button></span></div><div class="st-rows" data-ph="${ph.id}">${ph.steps.map((s,k)=>stepRow(s,k,ph)).join('')}</div><div class="st-foot">${stageAdd(ph,'Add a step')}</div></section>`).join('')}
    <button type="button" class="st-add wide" data-st-phadd>${I.plus}<span>Add a stage</span></button>`;
}
function flowsEscape(e){
  if(FB.adding){FB.adding=null;stepsRefresh();return true}
  if(!PV.flows||(e&&e.target.matches&&e.target.matches('input,textarea,select,[contenteditable]'))) return false;
  if(PV.flowId) PV.flowId=null;else PV.flows=false;renderProjects();return true;
}

/* ---------- starting a project: one short form, and the plan beside it ---------- */
const FW={flow:null,name:'',due:'',ans:{},picks:{},proj:null};
const fwFlow=()=>FW.flow?flowById(FW.flow):null;
function fwOpen(o={}){
  const T=team();if(!flowsOf(T).length){flowsOf(T).push(flowFromTemplate());save()}
  Object.assign(FW,{flow:o.flow||flowsOf(T)[0].id,name:'',due:'',ans:{},picks:{},proj:o.proj||null});
  fwRender();const d=$('#dFlow');if(!d.open) d.showModal();const n=$('#fwName');if(n) n.focus();
}
function fwRender(){
  const T=team(),d=$('#dFlow'),f=fwFlow();d.classList.toggle('fw-wide',!!f);
  const qRow=q=>`<label class="lbl">${esc(q.label)}${q.type==='yesno'?`<span class="fw-yn">${['yes','no'].map(v=>`<button type="button" class="${FW.ans[q.id]===v?'on':''}" data-fw-yn="${q.id}" data-v="${v}">${cap(v)}</button>`).join('')}</span>`:`<input data-fw-q="${q.id}" type="${q.type==='number'?'number':'text'}" ${q.type==='number'?'min="1" max="30"':''} value="${esc(FW.ans[q.id]||'')}">`}</label>`;
  d.innerHTML=`<form id="fwForm" autocomplete="off"><div class="dlg-head"><h2>${FW.proj?'Add steps from a template':'New project'}</h2><button type="button" class="xbtn" data-fw-x aria-label="Close">×</button></div>
    <div class="fw-split"><div class="fw-form">${FW.proj?'':`<label class="lbl">Project name<input id="fwName" maxlength="60" required value="${esc(FW.name)}" placeholder="Acme hair page"></label>`}
      <label class="lbl">Template${ddBtn('id="fwFlow"',FW.flow||'',[...flowsOf(T).map(x=>({v:x.id,l:x.name})),...(FW.proj?[]:[{v:'',l:'None, just a blank project'}])],{cls:'field',label:'Template'})}</label>
      ${FW.proj?'':`<label class="lbl">Deadline <input type="date" id="fwDue" value="${esc(FW.due)}"></label>`}
      ${f?f.qs.filter(q=>q.label).map(qRow).join(''):''}</div>
    ${f?`<div class="fw-prev"><h4>Who does what</h4><div id="fwPrev">${fwPreview(f)}</div></div>`:''}</div>
    <div class="dlg-acts"><button type="button" class="st-link" id="fwBuild">Change templates</button><span class="sp"></span><button type="button" class="btn ghost" data-fw-x>Cancel</button><button type="submit" class="btn dark">${f?'Start project':'Create project'}</button></div></form>`;
}
function fwPreview(f){
  return f.phases.map(ph=>{const L=ph.steps.filter(s=>stepOn(s,FW.ans));return L.length?`<div class="fw-ph"><b>${esc(ph.name)}</b>${L.map(s=>{const n=stepCount(s,FW.ans),q=f.qs.find(x=>x.id===s.each);return `<div class="fw-t"><span class="fw-tt">${esc(s.title)}${n>1?` <small>${n} ${eachWord(q).toLowerCase()}s</small>`:''}</span>${whoBtn(`data-fw-who="${s.id}"`,FW.picks[s.id]!==undefined?FW.picks[s.id]:stepPerson(s))}</div>`}).join('')}</div>`:''}).join('');
}
function fwStart(){
  const T=team(),f=fwFlow();let p=FW.proj&&projById(FW.proj);
  if(!p){const name=FW.name.trim();if(!name){const n=$('#fwName');if(n) n.focus();return}p={id:uid(),name,at:Date.now(),by:me().id,who:me().id,to:[],versions:[],...(FW.due?{due:FW.due}:{})};projectsOf(T).push(p)}
  if(f) flowStart(T,p,f,FW.ans,FW.picks);
  PV.proj=p.id;PV.ver=null;PV.flows=false;PV.flowId=null;PV.tab=f?'flow':'versions';PV.tabFor=p.id;save();$('#dFlow').close();if(UI.view!=='projects') setView('projects',true);render();
  if(f){const n=[...new Set(projTasks(T,p).filter(t=>!tkLocked(t,T)).flatMap(t=>t.to))].map(id=>{const z=findM(id,T);return z?(z.isMe?'you':first(z.name)):''}).filter(Boolean);toast(`Project started.${n.length?` First up: ${n.join(', ')}.`:''}`)}else toast('Project created. Drop the first HTML file in for version 1.');
}
$('#dFlow').addEventListener('click',e=>{
  const c=s=>e.target.closest&&e.target.closest(s);let b;
  if(c('[data-fw-x]')){$('#dFlow').close();return}
  if(c('#fwBuild')){$('#dFlow').close();PV.flows=true;PV.flowId=null;PV.proj=null;PV.ver=null;if(UI.view!=='projects') setView('projects',true);render();return}
  if(b=c('[data-fw-yn]')){const q=b.dataset.fwYn,v=b.dataset.v;FW.ans[q]=FW.ans[q]===v?'':v;for(const x of $$(`[data-fw-yn="${q}"]`,e.currentTarget)) x.classList.toggle('on',x.dataset.v===FW.ans[q]);$('#fwPrev').innerHTML=fwPreview(fwFlow());return}
});
$('#dFlow').addEventListener('input',e=>{const t=e.target;if(t.id==='fwName') FW.name=t.value;if(t.id==='fwDue') FW.due=t.value;if(t.dataset.fwQ){FW.ans[t.dataset.fwQ]=t.value;const f=fwFlow();if(f) $('#fwPrev').innerHTML=fwPreview(f)}});
$('#dFlow').addEventListener('change',e=>{const t=e.target;if(t.id==='fwFlow'){FW.flow=t.value||null;FW.ans={};FW.picks={};fwRender();return}if(t.dataset.fwWho!==undefined) FW.picks[t.dataset.fwWho]=t.value});
$('#dFlow').addEventListener('submit',e=>{e.preventDefault();fwStart()});
$('#dFlow').addEventListener('cancel',e=>{if(DD.el){e.preventDefault();ddClose()}});

/* ---------- clicks, typing and dragging ---------- */
$('#vProj').addEventListener('click',async e=>{
  const c=s=>e.target.closest&&e.target.closest(s);let b;const T=team(),p=PV.proj&&projById(PV.proj),f=PV.flows?curFlow():null;
  if(c('#pjFlows')){PV.flows=true;PV.flowId=null;PV.proj=null;PV.ver=null;renderProjects();return}
  if(b=c('[data-pj-tab]')){PV.tab=b.dataset.pjTab;PV.tabFor=PV.proj;renderProjects();return}
  if(c('[data-fw-start]')){fwOpen({proj:p.id});return}
  if(c('[data-st-own]')){const fl=flowEnsure(p);FB.adding=fl.phases[0].id;touch(p);save();render();return}
  if(c('#flBack')){PV.flows=false;renderProjects();return}
  if(c('#flBackList')){PV.flowId=null;FB.more=null;renderProjects();return}
  if(c('#flUse')){fwOpen({flow:PV.flowId});return}
  if(c('#flNew')){const n=blankFlow();flowsOf(T).push(n);PV.flowId=n.id;save();renderProjects();return}
  if(b=c('[data-fl-make]')){const n=b.dataset.flMake==='tpl'?flowFromTemplate():blankFlow();flowsOf(T).push(n);PV.flowId=n.id;save();renderProjects();return}
  if(b=c('[data-fl-dup]')){const x=flowById(b.dataset.flDup);if(x){flowsOf(T).push(copyFlow(x));save();renderFlows();toast('Template copied')}return}
  if(b=c('[data-fl-del]')){const x=flowById(b.dataset.flDel);if(!x) return;if(!await confirmDlg(`Delete ${x.name}?`,'Projects already running on it keep going. New projects can no longer use it.','Delete template')) return;T.flows=flowsOf(T).filter(y=>y!==x);save();renderFlows();toast('Template deleted');return}
  if(b=c('[data-fl-open]')){PV.flowId=b.dataset.flOpen;FB.more=null;renderProjects();return}
  if(b=c('[data-st-add]')){FB.adding=b.dataset.stAdd;stepsRefresh();return}
  if(b=c('[data-st-toggle]')){const id=b.dataset.stToggle;FB.open[id]=b.getAttribute('aria-expanded')!=='true';stepsRefresh();return}
  if(p&&!f){
    if(b=c('[data-st-repeat]')){const ph=p.flow.phases.find(x=>x.id===b.dataset.stRepeat);if(!ph) return;const undo=snapshot();flowRound(T,p,ph);FB.open[ph.id]=true;save();render();toast(`${ph.name} added again.`,undo);return}
    if(b=c('[data-st-done]')){const t=taskById(b.dataset.stDone);if(!t) return;if(tkLocked(t,T)){toast("It isn't this step's turn yet.");return}const undo=snapshot(),freed=tkTick(t);render();toast(tickMsg(t,freed),undo);return}
    if(b=c('[data-st-ver]')){const t=taskById(b.dataset.stVer);if(t) openTaskVersion(t);return}
    if(c('.dd-btn')) return;
    if(b=c('[data-st-task]')){openTask(b.dataset.stTask);return}
    return;
  }
  if(!f) return;
  if(b=c('[data-st-more]')){FB.more=FB.more===b.dataset.stMore?null:b.dataset.stMore;stepsRefresh();return}
  if(b=c('[data-st-del]')){const ph=stepPhase(f,b.dataset.stDel);if(!ph) return;const undo=snapshot();ph.steps=ph.steps.filter(s=>s.id!==b.dataset.stDel);save();stepsRefresh();toast('Step deleted',undo);return}
  if(b=c('[data-st-qdel]')){const undo=snapshot();for(const s of stepsOf(f)){if(s.each===b.dataset.stQdel) delete s.each;if(s.when&&s.when.q===b.dataset.stQdel) delete s.when}f.qs=f.qs.filter(q=>q.id!==b.dataset.stQdel);save();stepsRefresh();toast('Question deleted',undo);return}
  if(c('[data-st-qadd]')){const q={id:uid(),label:'',type:'text'};f.qs.push(q);save();stepsRefresh();const i=$(`[data-st-q="${q.id}"]`);if(i) i.focus();return}
  if(c('[data-st-phadd]')){const ph={id:uid(),name:`Stage ${f.phases.length+1}`,steps:[]};f.phases.push(ph);save();stepsRefresh();const i=$(`[data-st-ph="${ph.id}"]`);if(i){i.focus();i.select()}return}
  if(b=c('[data-st-up]')){const i=f.phases.findIndex(x=>x.id===b.dataset.stUp);if(i>0){[f.phases[i-1],f.phases[i]]=[f.phases[i],f.phases[i-1]];save();stepsRefresh()}return}
  if(b=c('[data-st-down]')){const i=f.phases.findIndex(x=>x.id===b.dataset.stDown);if(i>=0&&i<f.phases.length-1){[f.phases[i+1],f.phases[i]]=[f.phases[i],f.phases[i+1]];save();stepsRefresh()}return}
  if(b=c('[data-st-phdel]')){const ph=f.phases.find(x=>x.id===b.dataset.stPhdel);if(!ph) return;if(f.phases.length===1){toast('A template needs at least one stage.');return}if(ph.steps.length&&!await confirmDlg(`Delete ${ph.name}?`,`Its ${plural(ph.steps.length,'step')} go too.`,'Delete stage')) return;f.phases=f.phases.filter(x=>x!==ph);save();stepsRefresh();return}
});
$('#vProj').addEventListener('submit',e=>{
  if(!e.target.matches('.st-new')) return;e.preventDefault();const v=$('#stNew').value.trim(),phId=e.target.dataset.ph;if(!v) return;
  if(PV.flows){const f=curFlow(),ph=f&&f.phases.find(x=>x.id===phId);if(ph){ph.steps.push({id:uid(),title:v,who:null});save();stepsRefresh()}return}
  const T=team(),p=projById(PV.proj),ph=p&&p.flow.phases.find(x=>x.id===phId);if(ph){flowAddTask(T,p,ph,v,[]);stepsRefresh();renderSide()}
});
$('#vProj').addEventListener('input',e=>{
  const t=e.target,f=PV.flows?curFlow():null,d=t.dataset||{};
  if(d.stAns){const p=projById(PV.proj);if(p&&p.flow){p.flow.ans[d.stAns]=t.value;save()}return}
  if(!f) return;
  if(d.stTitle){const s=stepsOf(f).find(x=>x.id===d.stTitle);if(s&&t.value.trim()){s.title=t.value;save()}return}
  if(d.stNote){const s=stepsOf(f).find(x=>x.id===d.stNote);if(s){s.note=t.value;save()}return}
  if(d.stQ){const q=f.qs.find(x=>x.id===d.stQ);if(q){q.label=t.value;save()}return}
  if(d.stPh){const ph=f.phases.find(x=>x.id===d.stPh);if(ph&&t.value.trim()){ph.name=t.value;save()}}
});
$('#vProj').addEventListener('change',e=>{
  const t=e.target,d=t.dataset||{},T=team(),f=PV.flows?curFlow():null;
  if(d.stWho){const task=taskById(d.stWho),p=PV.proj&&projById(PV.proj);if(!task||!p) return;task.to=t.value?[t.value]:[];if(t.value){const z=findM(t.value,T);logEvent(p,'assigned',{who:z?z.name:'',title:task.title},task.id)}tkJoinProject(task);touch(p);save();render();return}
  if(!f) return;const s=id=>stepsOf(f).find(x=>x.id===id);
  if(d.stSwho){const x=s(d.stSwho);if(x){x.who=!t.value?null:t.value==='creator'?{t:'creator'}:{t:'person',id:t.value};save()}return}
  if(d.stEach){const x=s(d.stEach);if(x){if(t.value) x.each=t.value;else delete x.each;save();stepsRefresh()}return}
  if(d.stWhen){const x=s(d.stWhen);if(x){if(t.value){const [q,is]=t.value.split('|');x.when={q,is}}else delete x.when;save();stepsRefresh()}return}
  if(d.stTogether){const x=s(d.stTogether);if(x){if(t.checked) x.together=true;else delete x.together;save();stepsRefresh()}return}
  if(d.stQtype){const q=f.qs.find(x=>x.id===d.stQtype);if(q){q.type=t.value;for(const x of stepsOf(f)){if(x.each===q.id&&q.type!=='number') delete x.each;if(x.when&&x.when.q===q.id&&q.type!=='yesno') delete x.when}save();stepsRefresh()}}
});
$('#vProj').addEventListener('keydown',e=>{if(e.target.matches&&e.target.matches('#flName,.st-in')&&e.key==='Enter'){e.preventDefault();e.target.blur()}});
$('#vProj').addEventListener('focusout',e=>{
  const t=e.target;
  if(t.id==='flName'){const f=curFlow(),v=t.textContent.trim().slice(0,80);if(f&&v&&v!==f.name){f.name=v;f.at=Date.now();save()}else if(f) t.textContent=f.name;return}
  if(t.dataset&&t.dataset.stAns){const p=projById(PV.proj);if(p&&p.flow){logEvent(p,'brief',{answer:t.dataset.stAns,value:t.value});save()}return}
  if(t.id==='stNew'&&!t.value.trim()&&FB.adding) setTimeout(()=>{if(FB.adding&&!(document.activeElement&&document.activeElement.id==='stNew')){FB.adding=null;stepsRefresh()}},150);
});
// drag a step by its handle to another place in the template
{let dragId=null,mark=null;const clear=()=>{if(mark){mark.remove();mark=null}};const el=$('#vProj');
  el.addEventListener('dragstart',e=>{const g=e.target.closest&&e.target.closest('[data-st-drag]');if(!g) return;dragId=g.dataset.stDrag;e.dataTransfer.setData('text/x-noon-step',dragId);e.dataTransfer.effectAllowed='move';const r=g.closest('.st-row');if(r) e.dataTransfer.setDragImage(r,12,16)});
  el.addEventListener('dragover',e=>{if(!dragId) return;const st=e.target.closest&&e.target.closest('.st-stage');const box=st&&$('.st-rows[data-ph]',st);if(!box) return;e.preventDefault();e.dataTransfer.dropEffect='move';const rows=$$('.st-row[data-step]',box).filter(x=>x.dataset.step!==dragId),next=rows.find(x=>{const r=x.getBoundingClientRect();return e.clientY<r.top+r.height/2})||null;if(!mark){mark=document.createElement('div');mark.className='st-mark'}mark.dataset.before=next?next.dataset.step:'';mark.dataset.ph=box.dataset.ph;if(next) box.insertBefore(mark,next);else box.appendChild(mark)});
  el.addEventListener('drop',e=>{if(!dragId||!mark) return;e.preventDefault();const f=curFlow(),id=dragId,to=f&&f.phases.find(x=>x.id===mark.dataset.ph),before=mark.dataset.before||null;clear();dragId=null;if(!to||id===before) return;const from=stepPhase(f,id),s=from.steps.find(x=>x.id===id);from.steps=from.steps.filter(x=>x!==s);const at=before?to.steps.findIndex(x=>x.id===before):-1;to.steps.splice(at<0?to.steps.length:at,0,s);save();stepsRefresh()});
  el.addEventListener('dragend',()=>{clear();dragId=null});
}
