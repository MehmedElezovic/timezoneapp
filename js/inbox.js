/* Noon redesign mockup · Inbox: what needs you (mentions, replies, review-link comments, assignments, join requests, tasks),
   a list on the left and the thing itself on the right, so you can answer without leaving. */
const IB={tab:'you',sel:null};
const IB_YOU=new Set(['mention','reply','assign','request','task','review']);
const IB_VERB={mention:'mentioned you',reply:'replied to you',review:'commented on the review link',assign:'assigned you',request:'wants to join My team',final:'marked a version final',ads:'uploaded ads',task:'gave you a task'};
const IB_ICON={assign:'user',request:'user',final:'check',ads:'image',task:'tasks'};
function inboxUnread(){return INBOX.filter(i=>i.unread&&!i.done&&IB_YOU.has(i.kind)).length}
const ibList=()=>INBOX.filter(i=>IB.tab==='done'?i.done:!i.done&&(IB.tab==='all'||IB_YOU.has(i.kind)));
function ibWho(i){return i.by==='guest'?i.guest:i.by?P[i.by].short:i.who}
function ibAv(i){return i.by==='guest'?`<span class="av guest">${i.guest.split(' ').map(w=>w[0]).slice(-2).join('')}</span>`:i.by?av(i.by):`<span class="av guest">${i.who.split(' ').map(w=>w[0]).join('')}</span>`}
function ibWhere(i){if(!i.page)return'';const p=page(i.page);return p?`${i.part?`${i.part==='copy'?'Copy':'Design'} v${i.ver}${i.n?` · ${i.layer==='client'?'C':'#'}${i.n}`:''} · `:''}${esc(p.name)}`:''}
function ibFind(i){if(!i.page||!i.n)return null;const p=page(i.page);if(!p)return null;const L=i.part==='copy'?ccFor(p,i.ver):cmFor(p.id,i.ver);return L.find(c=>c.n===i.n&&c.layer===(i.layer||'team'))||null}

ROUTES.inbox=R=>{const m=$('#main');m.dataset.view='inbox';const L=ibList();
  if(IB.sel&&!L.find(i=>i.id===IB.sel))IB.sel=null;
  const cnt=k=>INBOX.filter(i=>k==='done'?i.done:!i.done&&(k==='all'||IB_YOU.has(i.kind))).length;
  const days=[...new Set(L.map(i=>i.day))];
  m.innerHTML=`<div class="top"><div class="crumbs">${ic('inbox',18)}<span class="cur" style="padding:0 4px">Inbox</span></div><span class="sp"></span>
   <div class="seg" role="tablist" aria-label="Show">${[['you','For you'],['all','Everything'],['done','Done']].map(([k,l])=>`<button class="${IB.tab===k?'on':''}" role="tab" aria-selected="${IB.tab===k}" data-act="ibTab" data-t="${k}">${l} <span class="num">${cnt(k)}</span></button>`).join('')}</div>
   <button class="btn btn-ghost" data-act="ibAllRead" ${inboxUnread()?'':'disabled style="opacity:.45"'}>${ic('check',15)}Mark all as read</button></div>
  <div class="ib-wrap"><div class="ib-list" role="list">${L.length?days.map(d=>`<div class="act-day" style="margin:14px 12px 6px">${d}</div>${L.filter(i=>i.day===d).map(ibRow).join('')}`).join(''):`<div class="empty"><h3 class="disp" style="font-size:22px;line-height:28px">Inbox <span class="mk">zero</span></h3><p>${IB.tab==='done'?'Nothing marked done yet.':'Nothing needs you right now.'}</p></div>`}</div>
   <div class="ib-detail" id="ibDetail">${ibDetail()}</div></div>`;
  const r=$('#ibRep');if(r)r.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();ACT.ibReply()}};
};
function ibRow(i){return `<div class="ib-i ${IB.sel===i.id?'on':''} ${i.unread?'un':''}" data-act="ibSel" data-id="${i.id}" role="listitem" tabindex="0">
  <span class="ib-dot" aria-label="${i.unread?'Unread':''}"></span>${IB_ICON[i.kind]&&i.kind!=='request'?`<span class="ib-ic">${ic(IB_ICON[i.kind],15)}</span>`:ibAv(i)}
  <div class="ib-t"><div class="ib-l1"><b>${esc(ibWho(i))}</b> ${IB_VERB[i.kind]}</div><div class="ib-l2">${esc(i.text)}</div><div class="ib-m">${ibWhere(i)}${ibWhere(i)?' · ':''}${i.at}</div></div>
  ${i.done?`<button class="ib sm" data-act="ibUndone" data-id="${i.id}" title="Move back" aria-label="Move back to inbox">${ic('back',14)}</button>`:`<button class="ib sm" data-act="ibDone" data-id="${i.id}" title="Done" aria-label="Mark done">${ic('check',15)}</button>`}</div>`}
function ibDetail(){const i=INBOX.find(x=>x.id===IB.sel);
  if(!i)return `<div class="empty" style="height:100%"><h3 class="disp" style="font-size:24px;line-height:30px">Pick <span class="mk">something</span> on the left</h3><p>Reply, accept or open it without leaving the inbox.</p></div>`;
  const p=i.page?page(i.page):null,c=p?client(p.client):null,cm=ibFind(i);
  const head=p?`<div class="ibd-h"><span class="pk-crumb">${tile(c.id)}${esc(c.name)}<span class="dash">/</span>${esc(p.name)}</span><span class="sp"></span><button class="btn btn-ink btn-sm" data-act="ibOpen" data-id="${i.id}">${i.kind==='task'?'Open task':'Open'}${ic('open',14)}</button></div>`:'';
  let body='';
  if(i.kind==='request')body=`<div class="ibd-card req"><span class="av lg" style="width:48px;height:48px;line-height:48px;font-size:15px">${i.who.split(' ').map(w=>w[0]).join('')}</span><h3 class="pk-title" style="margin:12px 0 4px">${esc(i.who)} wants to join My team</h3><p class="dash">${esc(i.text)}</p>
    ${i.answer?`<p style="margin-top:14px"><span class="tag ${i.answer==='accepted'?'ink':''}">${i.answer==='accepted'?'Accepted':'Declined'}</span></p>`:`<div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn-line" data-act="ibAnswer" data-a="declined">Decline</button><button class="btn btn-ink" data-act="ibAnswer" data-a="accepted">Accept</button></div>`}</div>`;
  else if(cm){const who=cm.by==='guest'?cm.guest:P[cm.by].short;body=`<div class="ibd-card"><div class="slbl" style="margin-top:0">${ibWhere(i)}</div>
    <div class="cm" style="cursor:default"><div class="cm-top">${cm.by==='guest'?`<span class="av guest">${cm.guest.split(' ').map(w=>w[0]).slice(-2).join('')}</span>`:av(cm.by)}<b>${esc(who)}</b><span class="t">${cm.at}</span>${i.layer==='client'?'<span class="tag">Review link</span>':''}</div>
    ${cm.quote?`<blockquote class="q">${esc(cm.quote)}</blockquote>`:''}<p>${esc(cm.text)}</p>
    ${cm.rep.map(r=>`<div class="rep">${r.by==='guest'?'<span class="av guest">G</span>':av(r.by)}<div><div class="who">${r.by==='guest'?'Guest':P[r.by].short} · ${r.at}</div>${esc(r.text)}</div></div>`).join('')}</div>
    ${i.layer==='client'?'<div class="note" style="margin-top:12px">Your reply shows on the review link.</div>':''}
    <div class="rinput" style="margin-top:12px"><input id="ibRep" placeholder="Reply to ${esc(who)}…" aria-label="Reply"><button class="btn btn-ink btn-sm" data-act="ibReply">Send</button></div>
    ${cm.open?`<button class="btn btn-line btn-sm" style="margin-top:10px" data-act="ibResolve">${ic('check',14)}Resolve</button>`:'<p class="dash" style="margin-top:10px">Resolved</p>'}</div>`}
  else if(i.kind==='task'){const t=TASKS.find(x=>x.id===i.task);body=`<div class="ibd-card"><div class="slbl" style="margin-top:0">Task</div><h3 class="pk-title" style="margin:0 0 8px">${esc(t.title)}</h3><dl class="attrs"><dt>Due</dt><dd>${t.due?fmtDate(t.due):'No date'}</dd><dt>Priority</dt><dd>${t.pri==='high'?'<span class="tag red">High</span>':'Normal'}</dd><dt>From</dt><dd>${av(t.by)}${P[t.by].short}</dd></dl><p class="dash">${esc(t.notes)}</p></div>`}
  else if(p)body=`<div class="ibd-card"><div class="cm-top" style="font-size:14px">${ibAv(i)}<b>${esc(ibWho(i))}</b><span>${IB_VERB[i.kind]}</span><span class="t">${i.at}</span></div><p style="margin-top:10px">${esc(i.text)}</p>
    <dl class="attrs"><dt>Status</dt><dd>${stIcon(p)}${ST[statusOf(p)]}</dd><dt>Deadline</dt><dd>${cellDue(p)}</dd><dt>Copy</dt><dd>${cellPart(p,'copy')}</dd><dt>Design</dt><dd>${cellPart(p,'design')}</dd><dt>Assigned</dt><dd>${avs(p.to)}</dd></dl></div>`;
  return head+`<div class="ibd-b">${body}</div>`}
const ibSel=()=>INBOX.find(x=>x.id===IB.sel);
Object.assign(ACT,{
  ibTab:a=>{IB.tab=a.dataset.t;IB.sel=null;render()},
  ibSel:(a,e)=>{if(e.target.closest('button'))return;const i=INBOX.find(x=>x.id===a.dataset.id);IB.sel=i.id;i.unread=false;render(true)},
  ibDone:(a,e)=>{e.stopPropagation();const i=INBOX.find(x=>x.id===a.dataset.id);i.done=true;i.unread=false;if(IB.sel===i.id)IB.sel=null;render(true);toast('Marked done',()=>{i.done=false})},
  ibUndone:(a,e)=>{e.stopPropagation();const i=INBOX.find(x=>x.id===a.dataset.id);i.done=false;render(true)},
  ibAllRead:()=>{const L=INBOX.filter(i=>i.unread);L.forEach(i=>i.unread=false);render(true);toast(`Marked ${L.length} as read`,()=>L.forEach(i=>i.unread=true))},
  ibOpen:a=>{const i=INBOX.find(x=>x.id===a.dataset.id);i.unread=false;
    if(i.kind==='task'){TK.open=i.task;go('#tasks');return}
    if(i.part==='copy'){CP.layer=i.layer||'team';CP.active=i.n||null;CP.mode='read';go(`#page/${i.page}/copy/v${i.ver}`);return}
    if(i.part==='design'){S.layer=i.layer||'team';S.active=i.n||null;S.mode='comment';go(`#page/${i.page}/design/v${i.ver}`);return}
    go(`#page/${i.page}/${i.kind==='ads'?'ads':'design'}`)},
  ibReply:()=>{const i=ibSel(),cm=i&&ibFind(i),t=($('#ibRep')?.value||'').trim();if(!cm||!t)return;cm.rep.push({by:'me',at:'Just now',text:t});render(true);toast(i.layer==='client'?'Reply posted on the review link':'Reply posted')},
  ibResolve:()=>{const i=ibSel(),cm=i&&ibFind(i),p=page(i.page);if(!cm)return;cm.open=false;if(i.part==='copy')syncCopy(p);else syncCounts(p);i.done=true;IB.sel=null;render(true);toast('Resolved and marked done',()=>{cm.open=true;i.done=false;if(i.part==='copy')syncCopy(p);else syncCounts(p)})},
  ibAnswer:a=>{const i=ibSel();i.answer=a.dataset.a;i.unread=false;render(true);toast(i.answer==='accepted'?`${i.who} joins My team`:`Declined ${i.who}`,()=>{delete i.answer})},
});
