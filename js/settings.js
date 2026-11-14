/* Noon redesign mockup · Settings: own section nav, one section at a time (#settings/<section>). */
const SET_NAV=[['Account',[['profile','Profile','user'],['prefs','Preferences','settings'],['notify','Notifications','inbox']]],['Team',[['members','Members','globe'],['cats','Categories','filter']]],['Connections',[['claude','Claude connector','bolt']]]];
const TZS=[['Europe/Sarajevo','Sarajevo',1],['Europe/London','London',0],['Europe/Lisbon','Lisbon',0],['Europe/Berlin','Berlin',1],['America/New_York','New York',-5],['America/Toronto','Toronto',-5],['America/Los_Angeles','Los Angeles',-8],['Asia/Dubai','Dubai',4],['Asia/Singapore','Singapore',8],['Australia/Sydney','Sydney',11]];
const SETD={name:PREFS.name,tz:PREFS.tz,from:PREFS.from,to:PREFS.to,dirty:false};
ROUTES.settings=R=>{const m=$('#main'),sec=R.id||'profile';m.dataset.view='settings';
  m.innerHTML=`<div class="top"><div class="crumbs">${ic('settings',18)}<span class="cur" style="padding:0 4px">Settings</span></div></div>
  <div class="stg"><nav class="set-nav" aria-label="Settings sections">${SET_NAV.map(([g,items])=>`<div class="sec-l" style="padding:14px 10px 6px">${g}</div>${items.map(([k,l,i])=>`<a class="ni ${sec===k?'on':''}" href="#settings/${k}">${ic(i,16)}<span class="lbl">${l}</span></a>`).join('')}`).join('')}
    <div class="sp"></div><a class="ni" href="#signin">${ic('back',16)}<span class="lbl">Log out</span></a></nav>
   <div class="set-main"><div class="set-in">${(SET_SEC[sec]||SET_SEC.profile)()}</div></div></div>`;
  SET_MOUNT[sec]&&SET_MOUNT[sec]();
};
const row=(label,hint,ctl)=>`<div class="set-row"><div><b>${label}</b>${hint?`<p>${hint}</p>`:''}</div><div class="set-ctl">${ctl}</div></div>`;
const SET_SEC={
  profile:()=>{const tz=TZS.find(t=>t[0]===SETD.tz);return `<h2 class="set-h">Profile</h2><p class="set-p">How your team sees you, and the hours Noon uses on the Team view.</p>
   <div class="set-card"><div class="set-row"><div style="display:flex;gap:14px;align-items:center"><span class="av me" style="width:52px;height:52px;line-height:52px;font-size:16px">ME</span><div><b>Photo</b><p>Shown next to your comments.</p></div></div><div class="set-ctl"><button class="btn btn-line btn-sm" data-act="setPhoto">Upload photo</button></div></div>
   ${row('Name','',`<input class="set-in-t" id="sName" value="${esc(SETD.name)}">`)}
   ${row('Email','Email changes come once Noon sends emails.',`<span class="dash">${esc(PREFS.email)}</span>`)}
   ${row('Time zone','',`<button class="selb" data-act="setTz" style="width:240px">${ic('globe',15)}<span>${tz[1]}</span><span class="dash">UTC${tz[2]>=0?'+':'−'}${Math.abs(tz[2])}</span><span class="sp"></span>${ic('down',14)}</button>`)}
   ${row('Online hours','Teammates see when you are around.',`<button class="selb" data-act="setHr" data-k="from" style="width:110px"><span>${fmtH(SETD.from)}</span><span class="sp"></span>${ic('down',14)}</button><span class="dash">to</span><button class="selb" data-act="setHr" data-k="to" style="width:110px"><span>${fmtH(SETD.to)}</span><span class="sp"></span>${ic('down',14)}</button>`)}</div>
   <div class="set-foot"><button class="btn btn-ink" data-act="setSave" ${SETD.dirty?'':'disabled'}>Save changes</button></div>`},
  prefs:()=>`<h2 class="set-h">Preferences</h2><p class="set-p">Only for you, on this account.</p>
   <div class="set-card">${row('Time format','',`<div class="seg"><button class="${PREFS.h24?'on':''}" data-act="setFmt" data-v="24">24-hour</button><button class="${PREFS.h24?'':'on'}" data-act="setFmt" data-v="12">12-hour</button></div>`)}
   ${row('Theme','Dark mode gets its own round.',`<div class="seg"><button class="on">Light</button><button disabled title="Coming later" style="opacity:.5">Dark</button><button disabled title="Coming later" style="opacity:.5">System</button></div>`)}
   ${row('Open Noon on','',`<div class="seg"><button class="on">Pages</button><button data-act="setNoop">Inbox</button><button data-act="setNoop">Tasks</button></div>`)}</div>`,
  notify:()=>`<h2 class="set-h">Notifications</h2><p class="set-p">Everything lands in your Inbox today.</p>
   <div class="set-card"><div class="note" style="margin:0">Email notifications switch on once the team connects an email provider. Until then the Inbox count in the sidebar is your signal.</div>
   ${row('Mentions and replies','',`<span class="sw on" aria-hidden="true"></span><span class="dash">Inbox</span>`)}
   ${row('Review-link comments','From clients and guests.',`<span class="sw on" aria-hidden="true"></span><span class="dash">Inbox</span>`)}
   ${row('Email digest','',`<span class="sw" aria-hidden="true"></span><span class="dash">Off for now</span>`)}</div>`,
  members:()=>{const req=INBOX.find(i=>i.kind==='request'&&!i.answer);return `<h2 class="set-h">Members</h2><p class="set-p">People in My team see every project, page and comment, except tasks someone hid from them.</p>
   ${req?`<div class="set-card"><div class="slbl" style="margin:0 0 8px">Asked to join</div><div class="set-row"><div style="display:flex;gap:12px;align-items:center"><span class="av guest" style="width:32px;height:32px;line-height:32px">SK</span><div><b>${esc(req.who)}</b><p>Opened your invite link ${req.at.toLowerCase()}.</p></div></div><div class="set-ctl"><button class="btn btn-ghost btn-sm" data-act="setReq" data-a="declined">Decline</button><button class="btn btn-ink btn-sm" data-act="setReq" data-a="accepted">Accept</button></div></div></div>`:''}
   <div class="set-card"><div class="slbl" style="margin:0 0 4px">My team · ${Object.keys(P).length} people</div>
   ${Object.values(P).map(u=>`<div class="set-row"><div style="display:flex;gap:12px;align-items:center">${av(u.id,'lg')}<div><b>${esc(u.name)}</b><p>${esc(u.city)}</p></div></div><div class="set-ctl"><span class="tag ${u.id==='me'?'ink':''}">${u.id==='me'?'Owner':'Member'}</span>${u.id==='me'?'<span style="width:32px"></span>':`<button class="ib sm" data-act="setRemove" data-id="${u.id}" aria-label="Remove ${esc(u.name)}" title="Remove">${ic('x',14)}</button>`}</div></div>`).join('')}</div>
   <div class="set-card">${row('Invite link','People who open it ask to join. You accept them here or in the Inbox.',`<div class="linkbox" style="margin:0;width:340px"><input readonly value="noon.app/join/my-team-4k8w" aria-label="Invite link"><button class="btn btn-ink btn-sm" style="height:34px" data-act="tmCopyLink">Copy</button></div>`)}
   ${row('Join another team','Paste an invite link you got.',`<div class="linkbox" style="margin:0;width:340px"><input placeholder="noon.app/join/…" aria-label="Invite link to join" style="font-family:var(--sans)"><button class="btn btn-line btn-sm" style="height:34px" data-act="setJoin">Join</button></div>`)}</div>`},
  cats:()=>`<h2 class="set-h">Categories</h2><p class="set-p">Lists your team tags projects and pages with. Claude uses them to find past work, like every B2B listicle.</p>
   ${['client','page'].map(lv=>`<div class="slbl">${lv==='client'?'Project categories · count for every page in the project':'Page categories'}</div>${CATS.filter(l=>l.level===lv).map(l=>`<div class="set-card cat"><div class="cat-h"><input class="cat-n" value="${esc(l.name)}" data-act="noop" data-cat="${l.id}" aria-label="List name"><span class="num">${l.items.length}</span><span class="sp"></span><button class="ib sm" data-act="catDel" data-id="${l.id}" aria-label="Delete list ${esc(l.name)}" title="Delete list">${ic('trash',14)}</button></div>
     <div class="chips">${l.items.map(t=>`<span class="chip on">${esc(t)}<button class="x" data-act="catRm" data-id="${l.id}" data-v="${esc(t)}" aria-label="Remove ${esc(t)}">${ic('x',11)}</button></span>`).join('')}<input class="chip-add" data-cat-add="${l.id}" placeholder="+ Add" aria-label="Add to ${esc(l.name)}"></div></div>`).join('')}<button class="btn btn-ghost btn-sm" data-act="catNew" data-lv="${lv}" style="margin:-4px 0 8px -8px">${ic('plus',14)}New ${lv==='client'?'project':'page'} list</button>`).join('')}`,
  claude:()=>`<h2 class="set-h">Claude connector</h2><p class="set-p">Let Claude read pages, copy and comments, and upload new versions that resolve them.</p>
   <div class="set-card"><div class="slbl" style="margin:0 0 4px">Keys</div>
   ${API_KEYS.length?API_KEYS.map(k=>`<div class="set-row"><div><b>${esc(k.name)}</b><p><span class="v">${k.prefix}••••</span> · made ${k.created} · used ${k.last.toLowerCase()}</p></div><div class="set-ctl"><button class="btn btn-ghost btn-sm" data-act="keyRevoke" data-id="${k.id}" style="color:var(--red)">Revoke</button></div></div>`).join(''):'<p class="dash" style="padding:10px 0">No keys yet.</p>'}
   <div class="set-foot" style="padding:12px 0 0;border:0"><button class="btn btn-line btn-sm" data-act="keyNew">${ic('plus',14)}Create a key</button></div></div>
   <div class="set-card"><div class="slbl" style="margin:0 0 8px">Add Noon to Claude Code</div>
   <pre class="code">claude mcp add --scope user --transport http noon \\
  https://&lt;your-project&gt;.supabase.co/functions/v1/noon-mcp \\
  --header "Authorization: Bearer noon_…"</pre>
   <div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-line btn-sm" data-act="keyCopyCmd">${ic('link',14)}Copy command</button><span class="dash" style="font-size:12.5px;align-self:center">Paste your key where it says noon_…</span></div></div>`,
};
const SET_MOUNT={
  profile:()=>{const i=$('#sName');if(i)i.oninput=()=>{SETD.name=i.value;if(!SETD.dirty){SETD.dirty=true;$('[data-act=setSave]').disabled=false}}},
  cats:()=>{$$('[data-cat-add]').forEach(i=>i.onkeydown=e=>{if(e.key!=='Enter')return;const v=i.value.trim(),l=CATS.find(x=>x.id===i.dataset.catAdd);if(!v)return;if(l.items.includes(v)){toast('Already in the list');return}l.items.push(v);render(true);$(`[data-cat-add="${l.id}"]`)?.focus()});
    $$('.cat-n').forEach(i=>i.onchange=()=>{const l=CATS.find(x=>x.id===i.dataset.cat);l.name=i.value.trim()||l.name;toast('List renamed')})},
};
Object.assign(ACT,{
  setPhoto:()=>toast('Photo upload is off in the mockup'),
  setTz:a=>openMenu(a,()=>TZS.map(([id,city,o])=>({check:true,on:SETD.tz===id,label:city,meta:`UTC${o>=0?'+':'−'}${Math.abs(o)}`,pick:()=>{SETD.tz=id;SETD.dirty=true}}))),
  setHr:a=>{const k=a.dataset.k;openMenu(a,()=>Array.from({length:24},(_,h)=>({check:true,on:SETD[k]===h,label:fmtH(h),pick:()=>{SETD[k]=h;SETD.dirty=true}})))},
  setSave:()=>{const old={...PREFS};PREFS.name=SETD.name;PREFS.tz=SETD.tz;PREFS.from=SETD.from;PREFS.to=SETD.to;HOURS.me.on=[SETD.from,SETD.to];P.me.name=SETD.name;SETD.dirty=false;render(true);toast('Profile saved',()=>{Object.assign(PREFS,old);HOURS.me.on=[old.from,old.to];P.me.name=old.name;Object.assign(SETD,{name:old.name,tz:old.tz,from:old.from,to:old.to})})},
  setFmt:a=>{PREFS.h24=a.dataset.v==='24';render(true)},
  setNoop:()=>toast('Saved'),
  setReq:a=>ACT.tmReq(a),
  setRemove:a=>toast(`Removing ${P[a.dataset.id].short} is off in the mockup`),
  setJoin:()=>toast('Paste a link first'),
  catRm:a=>{const l=CATS.find(x=>x.id===a.dataset.id),i=l.items.indexOf(a.dataset.v);l.items.splice(i,1);render(true);toast(`Removed ${a.dataset.v}`,()=>l.items.splice(i,0,a.dataset.v))},
  catDel:a=>{const i=CATS.findIndex(x=>x.id===a.dataset.id),l=CATS[i];CATS.splice(i,1);render(true);toast(`Deleted ${l.name}`,()=>CATS.splice(i,0,l))},
  catNew:a=>{const l={id:'l'+Date.now().toString(36),level:a.dataset.lv,name:'New list',items:[]};CATS.push(l);render(true);const i=$(`[data-cat="${l.id}"]`);i&&(i.focus(),i.select())},
  keyNew:()=>openDlg(`<div class="dlg-h"><b>Create a key</b><button class="ib" data-act="dlgClose" aria-label="Close">${ic('x',18)}</button></div><div class="dlg-b"><label class="fld"><span>Name it after where you use it</span><input id="kN" placeholder="e.g. Claude Code on my laptop"></label><p class="hint">In the real app the key is shown once, right after you create it.</p></div><div class="dlg-f"><button class="btn btn-line" data-act="dlgClose">Cancel</button><button class="btn btn-ink" id="kOk">Create key</button></div>`,o=>{const i=o.querySelector('#kN');i.focus();const ok=()=>{const n=i.value.trim()||'New key';API_KEYS.push({id:'k'+Date.now(),name:n,prefix:'noon_'+Math.random().toString(16).slice(2,6),created:'Today',last:'Never'});closeDlg();render(true);toast('Key created')};o.querySelector('#kOk').onclick=ok;i.onkeydown=e=>{if(e.key==='Enter')ok()}}),
  keyRevoke:a=>{const i=API_KEYS.findIndex(k=>k.id===a.dataset.id),k=API_KEYS[i];API_KEYS.splice(i,1);render(true);toast(`Revoked ${k.name}`,()=>API_KEYS.splice(i,0,k))},
  keyCopyCmd:()=>toast('Command copied'),
});
