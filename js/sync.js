/* Noon · accounts live in Supabase; guests keep the browser sandbox and are asked only when a name is needed.
   Signed-in teams mirror to the database: every save pushes the difference, every change there pulls. */
const SB_URL='https://boielhshrswqdqkxiupz.supabase.co',SB_KEY='sb_publishable_BIHw_FeIef2fp13DdihMCg_lQ6nVdbg';
const sb=window.supabase?window.supabase.createClient(SB_URL,SB_KEY,SHARE?{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}:undefined):null;
const AUTH={why:null};
SYNC_ON=true;
const CLOUD={user:null,profile:null,last:{},evThread:{},tkThread:{},metaKeys:new Set(),busy:false,dirty:false,pushing:false,pushAgain:false,chan:null,pullT:0,pushT:0,ready:false,invites:[],invOn:false};
const user=()=>CLOUD.user?{name:(CLOUD.profile&&CLOUD.profile.name)||(CLOUD.user.user_metadata||{}).name||(CLOUD.user.email||'').split('@')[0],email:CLOUD.user.email}:null;
const GATE={share:['Share with a client','A client link puts the project online, so it needs your account.'],claude:['Connect Claude','Claude works in your projects as you, so it needs your account.'],files:['Attach files','Files are kept in your account, so everyone on the task can open them.'],book:['Book a time','Booking sends an invite under your name, so Noon needs to know who you are.'],comment:['Join the thread','Comments and reactions are posted as you.'],invite:['Invite people','Invites go out from your account, and people join your team.'],integ:['Connect a calendar','Calendar connections are tied to an account.'],team:['Another team','Extra teams are saved to your account.'],request:['Answer a request','Answers are sent as you.'],save:['Keep this on every device','Your team, timezones and threads are saved to your account.'],join:['You are invited to a team','Create an account or log in. The invite waits in your inbox, and you join when you accept.']};
const setAuthState=k=>{if(!SHARE) document.documentElement.dataset.auth=k};
// teams kept on this device that hold real work move to the account; an empty starter team does not
const hasWork=t=>t.members.length>1||!!(t.tasks||[]).length||!!(t.projects||[]).length||t.members.some(m=>(m.events||[]).length||(m.threads||[]).length);
function gate(k){if(user()) return false;openAuth('register',k);return true}
function authTab(kind){
  const reg=kind==='register';$('#fRegister').hidden=!reg;$('#fLogin').hidden=reg;
  $('#gateTitle').textContent=reg?'Create your account':'Welcome back';
  $('#gateSub').textContent=reg?'Noon shows when everyone on your team is around, in your own time. Setup takes a minute.':'Log in to your team, calendar, tasks and projects.';
  $('#gateSwitch').innerHTML=reg?'Already have an account? <button type="button" data-auth="login">Log in</button>':'New to Noon? <button type="button" data-auth="register">Create an account</button>';
  say('#regErr','');say('#logErr','');
}
function openAuth(kind,why){
  AUTH.why=why||null;const w=$('#authWhy');
  if(why&&GATE[why]){w.hidden=false;w.innerHTML=`<b>${GATE[why][0]}.</b> ${GATE[why][1]}`}else w.hidden=true;
  authTab(kind||'login');if(!CLOUD.user) setAuthState('out');
  if(innerWidth>860) setTimeout(()=>{const i=$(kind==='register'?'#fRegister':'#fLogin').querySelector('input');if(i) i.focus()},60);
}
const siteUrl=()=>location.origin+location.pathname;
const authMsg=e=>{const m=(e&&e.message)||String(e);return /invalid login credentials/i.test(m)?'Wrong email or password.':/not confirmed/i.test(m)?'Confirm your email first: the link is in your inbox.':/rate limit/i.test(m)?'Too many emails sent for now. Try again in a little while.':/already registered/i.test(m)?'That email already has an account. Log in instead.':m};
const say=(id,text,ok)=>{const el=$(id);if(!el) return;el.hidden=!text;el.textContent=text||'';el.classList.toggle('ok',!!ok)};
const busyBtn=(b,on)=>{if(!b) return;b.disabled=on;if(on){b.dataset.l=b.textContent;b.textContent='One moment'}else if(b.dataset.l) b.textContent=b.dataset.l};
$('#fRegister').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,name=f.name.value.trim(),email=f.email.value.trim().toLowerCase(),pw=f.pass.value,btn=f.querySelector('button[type=submit]');
  say('#regErr','');if(!sb){say('#regErr','Accounts are not reachable right now. Check your connection and try again.');return}
  busyBtn(btn,true);const {data,error}=await sb.auth.signUp({email,password:pw,options:{data:{name,...(heldCode()?{invite:heldCode()}:{})},emailRedirectTo:siteUrl()}});busyBtn(btn,false);
  if(error){say('#regErr',authMsg(error));return}
  // an email that already has an account comes back as a user with no identities, and no email is sent
  if(data.user&&Array.isArray(data.user.identities)&&!data.user.identities.length){authTab('login');$('#fLogin').email.value=email;say('#logErr','That email already has an account. Log in, or use the sign-in link below.');return}
  if(data.session) f.reset(); else say('#regErr',`Almost there. We sent a link to ${email}. Open it to confirm your email and you are in.`,true);
});
$('#fLogin').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,email=f.email.value.trim().toLowerCase(),pw=f.pass.value,btn=f.querySelector('button[type=submit]');
  say('#logErr','');if(!sb){say('#logErr','Accounts are not reachable right now. Check your connection and try again.');return}
  busyBtn(btn,true);const {error}=await sb.auth.signInWithPassword({email,password:pw});busyBtn(btn,false);
  if(error){say('#logErr',authMsg(error));f.pass.focus();return}
  f.reset();
});
$('#btnMagic').onclick=async()=>{
  const f=$('#fLogin'),email=f.email.value.trim().toLowerCase();say('#logErr','');
  if(!email||!f.email.checkValidity()){f.email.reportValidity();return}
  if(!sb){say('#logErr','Accounts are not reachable right now.');return}
  busyBtn($('#btnMagic'),true);const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:siteUrl()}});busyBtn($('#btnMagic'),false);
  if(error){say('#logErr',authMsg(error));return}
  say('#logErr',`Sent. Open the link we emailed to ${email} and you are in.`,true);
};
// Google needs switching on in Supabase (Authentication › Providers); until then the button says so
// until Google is switched on the button and its divider stay hidden, so nobody meets a button that does nothing
AUTH.gp=SHARE?null:fetch(SB_URL+'/auth/v1/settings',{headers:{apikey:SB_KEY}}).then(r=>r.json()).then(j=>{AUTH.google=!!(j.external||{}).google;$('#btnGoogle').hidden=!AUTH.google;$('.gate-or').hidden=!AUTH.google}).catch(()=>{});
$('#btnGoogle').onclick=async()=>{
  const err=$('#fLogin').hidden?'#regErr':'#logErr',b=$('#btnGoogle');say(err,'');
  if(!sb){say(err,'Accounts are not reachable right now. Check your connection and try again.');return}
  if(AUTH.google===undefined&&AUTH.gp){b.disabled=true;await AUTH.gp;b.disabled=false}
  if(AUTH.google===false){say(err,'Google sign-in is not switched on yet. Use your email for now.');return}
  b.disabled=true;const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:siteUrl()}});
  if(error){b.disabled=false;say(err,authMsg(error))}
};

/* ---------- account settings ---------- */
const NOTIFY_DEFAULT={invites:true,mentions:true,replies:true,missed:true,weekly:false};
const myTeams=()=>S.teams.filter(t=>t.cloud).map(t=>t.members.find(m=>m.isMe)).filter(Boolean);
async function saveProfile(patch){
  if(!(sb&&CLOUD.user)) return false;
  const {error}=await sb.from('profiles').update(patch).eq('id',CLOUD.user.id);
  if(error){toast('Could not save: '+error.message);return false}
  CLOUD.profile={...(CLOUD.profile||{}),...patch};return true;
}
const savePrefs=()=>{if(CLOUD.user&&sb) saveProfile({prefs:{...((CLOUD.profile||{}).prefs||{}),hour12:!!S.hour12,dur:UI.dur,theme:document.documentElement.dataset.theme||'light',weekStart:S.weekStart}})};
async function uploadPhoto(file){
  if(!(sb&&CLOUD.user)){toast('Sign in to add a photo');return}
  if(file.size>2*1024*1024){toast('That image is over 2 MB. Pick a smaller one.');return}
  const ext=(file.name.split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,''),path=`${CLOUD.user.id}/${Date.now()}.${ext}`;
  toast('Uploading your photo');
  const {error}=await sb.storage.from('avatars').upload(path,file,{upsert:true,contentType:file.type});
  if(error){toast('Upload failed: '+error.message);return}
  const url=sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  for(const m of myTeams()) m.photo=url;me().photo=url;save();render();toast('Photo updated');
}
async function changeEmail(email){
  if(email===user().email) return 'That is already your email.';
  const {error}=await sb.auth.updateUser({email},{emailRedirectTo:siteUrl()});
  return error?authMsg(error):`Check ${email} for a confirmation link. The change happens once you open it.`;
}
async function changePassword(pw){const {error}=await sb.auth.updateUser({password:pw});return error?authMsg(error):''}
async function deleteAccount(){
  const {error}=await sb.rpc('delete_account');
  if(error){toast('Could not delete the account: '+error.message);return false}
  await sb.auth.signOut();toast('Your account is deleted.');return true;
}

/* ---------- sync ---------- */
const msOf=t=>t?new Date(t).getTime():null,isoOf=n=>new Date(n).toISOString(),num=v=>v==null?null:+v;
const remapRe=(re,map)=>{const o={};for(const [e,l] of Object.entries(re||{})) o[e]=l.map(map);return o};
function rowMember(r,uidMe){return {id:r.id,name:r.name||'',email:r.email||'',tz:r.tz||'UTC',start:num(r.start_h)??9,end:num(r.end_h)??17,start2:num(r.start2_h),end2:num(r.end2_h),weekends:!!r.weekends,sleepStart:num(r.sleep_start)??23,sleepEnd:num(r.sleep_end)??7,photo:r.photo||'',cal:!!r.cal,conn:r.conn||[],status:r.status||'active',joined:!!r.joined,isMe:r.user_id===uidMe,userId:r.user_id||null,addedBy:r.added_by||null,events:[],threads:[]}}
function buildTeams(R,uidMe){
  const out=[];
  for(const t of R.teams){
    const T={id:t.id,name:t.name,cloud:true,code:t.invite_code,createdBy:t.created_by,at:msOf(t.created_at),sample:false,members:[]},mem={};
    for(const r of R.members) if(r.team_id===t.id){const m=rowMember(r,uidMe);mem[m.id]=m;T.members.push(m)}
    if(!T.members.some(m=>m.isMe)) continue;
    T.members.sort((a,b)=>(b.isMe?1:0)-(a.isMe?1:0)||msOf(R.members.find(r=>r.id===a.id).created_at)-msOf(R.members.find(r=>r.id===b.id).created_at));
    const nameOf=id=>{const m=mem[id];return m?(m.isMe?'You':first(m.name)):'Someone'};
    for(const e of R.events.filter(e=>e.team_id===t.id)){
      const A=R.attendees.filter(a=>a.event_id===e.id),who=A.filter(a=>a.status==='pending'||a.status==='accepted').map(a=>a.member_id);
      for(const a of A){const m=mem[a.member_id];if(!m) continue;
        if(a.status==='requested'){const k=metaOf(e.id);CLOUD.metaKeys.add(e.id);k.join=k.join||[];if(!k.join.includes(m.id)) k.join.push(m.id);continue}
        if(a.status==='declined') continue;
        m.events.push({id:e.id,title:e.title,s:msOf(e.starts_at),e:msOf(e.ends_at),who,loc:e.location||'',kind:e.kind||'',pend:a.status==='pending',req:a.invited_by||undefined,by:e.created_by||undefined});
        if(a.move_request&&m.isMe){metaOf(e.id).post=a.move_request;CLOUD.metaKeys.add(e.id)}
      }
    }
    T.tasks=(R.tasks||[]).filter(x=>x.team_id===t.id).map(x=>({id:x.id,title:x.title,note:x.note||'',to:(R.tas||[]).filter(y=>y.task_id===x.id).map(y=>y.member_id),by:x.created_by||null,day:x.due_day||null,time:x.due_time||null,tz:x.due_tz||null,at:msOf(x.created_at),done:msOf(x.done_at),cleared:!!x.cleared,files:Array.isArray(x.files)?x.files:[],re:{},cm:[]}));
    T.projects=(R.projects||[]).filter(x=>x.team_id===t.id).map(x=>({id:x.id,name:x.name,due:x.due_day||null,to:(R.pas||[]).filter(y=>y.project_id===x.id).map(y=>y.member_id),by:x.created_by||null,who:x.changed_by||null,whoGuest:x.changed_guest||null,share:x.share_token?{on:!!x.share_on,token:x.share_token}:null,at:msOf(x.changed_at)||msOf(x.created_at),
      versions:(R.versions||[]).filter(v=>v.project_id===x.id).sort((a,b)=>a.n-b.n).map(v=>({id:v.id,n:v.n,name:v.name,path:v.path,size:v.size||0,file:v.file||null,assets:Array.isArray(v.assets)?v.assets:[],by:v.created_by||null,at:msOf(v.created_at),...(v.share_token?{share:{on:!!v.share_on,token:v.share_token}}:{}),
        cm:(R.vcm||[]).filter(c=>c.version_id===v.id).sort((a,b)=>a.n-b.n).map(c=>({id:c.id,n:c.n,sel:c.sel||'',rx:c.rx??.5,ry:c.ry??.5,px:c.px||0,py:c.py||0,dev:c.dev||'desktop',text:c.body,by:c.guest_name||nameOf(c.author_id),byId:c.author_id||null,...(c.guest_name?{guest:true}:{}),...(c.layer==='client'?{layer:'client'}:{}),...(c.snippet?{snip:c.snippet}:{}),at:msOf(c.created_at),status:c.status||'open',...(c.from_version?{from:{v:c.from_version,c:c.from_comment}}:{}),
          re:(R.vre||[]).filter(r=>r.comment_id===c.id).sort((a,b)=>msOf(a.created_at)-msOf(b.created_at)).map(r=>({id:r.id,by:r.guest_name||nameOf(r.author_id),byId:r.author_id||null,...(r.guest_name?{guest:true}:{}),text:r.body,at:msOf(r.created_at)}))}))}))}));
    const cmsBy={};for(const c of R.comments)(cmsBy[c.thread_id]=cmsBy[c.thread_id]||[]).push(c);
    const reTh={},reCm={};for(const r of R.reactions){const o=r.thread_id?(reTh[r.thread_id]=reTh[r.thread_id]||{}):(reCm[r.comment_id]=reCm[r.comment_id]||{});(o[r.emoji]=o[r.emoji]||[]).push(r.member_id)}
    const cmList=th=>(cmsBy[th.id]||[]).sort((a,b)=>msOf(a.created_at)-msOf(b.created_at)).map(c=>({id:c.id,by:nameOf(c.author_id),byId:c.author_id,text:c.body,at:msOf(c.created_at),re:reCm[c.id]||{}}));
    for(const th of R.threads.filter(x=>x.team_id===t.id)){
      if(th.task_id){const tk=T.tasks.find(x=>x.id===th.task_id);if(tk){CLOUD.tkThread[tk.id]=th.id;tk.re=reTh[th.id]||{};tk.cm=cmList(th)}}
      else if(th.event_id){CLOUD.evThread[th.event_id]=th.id;const k=metaOf(th.event_id);CLOUD.metaKeys.add(th.event_id);k.re=reTh[th.id]||{};k.cm=cmList(th)}
      else{const m=mem[th.member_id];if(!m) continue;m.threads.push({id:th.id,s:msOf(th.starts_at),e:msOf(th.ends_at),re:reTh[th.id]||{},cm:cmList(th),by:th.created_by||undefined})}
    }
    out.push(T);
  }
  return out;
}
function toImage(T){
  const I={name:T.name,members:{},events:{},att:{},threads:{},comments:{},re:{},tasks:{},tkas:{},projects:{},pas:{},versions:{},vcm:{},vre:{}};
  if(CLOUD.pjOn) for(const p of T.projects||[]){I.projects[p.id]={id:p.id,name:p.name,due:p.due||null,by:p.by||null,who:p.who||null,at:p.at||Date.now(),...(CLOUD.shareCols?{share_on:!!(p.share&&p.share.on),share_token:(p.share&&p.share.token)||null,guest:p.who?null:(p.whoGuest||null)}:{})};for(const mid of p.to||[]) I.pas[p.id+':'+mid]={project_id:p.id,member_id:mid};
    for(const v of p.versions||[]){I.versions[v.id]={id:v.id,project_id:p.id,n:v.n,name:v.name,path:v.path,size:v.size||0,file:v.file||null,assets:(v.assets||[]).map(a=>({id:a.id,path:a.path,size:a.size||0,type:a.type||'',file:a.file||null})),by:v.by||null,...(CLOUD.vShare?{share_on:!!(v.share&&v.share.on),share_token:(v.share&&v.share.token)||null}:{})};
      for(const c of v.cm||[]){I.vcm[c.id]={id:c.id,version_id:v.id,n:c.n,sel:c.sel||null,rx:c.rx??null,ry:c.ry??null,px:c.px??null,py:c.py??null,dev:c.dev||null,body:c.text,author_id:c.byId||null,status:c.status||'open',from_version:c.from?c.from.v:null,from_comment:c.from?c.from.c:null,snippet:c.snip||null,layer:c.layer==='client'?'client':'team',at:c.at||null};
        for(const r of c.re||[]) I.vre[r.id]={id:r.id,comment_id:c.id,author_id:r.byId||null,body:r.text,at:r.at||null}}}}
  for(const t of T.tasks||[]){I.tasks[t.id]={id:t.id,title:t.title,note:t.note||'',day:t.day||null,time:t.time||null,tz:t.tz||null,done:t.done||null,cleared:!!t.cleared,by:t.by||null,files:t.files||[]};for(const mid of t.to||[]) I.tkas[t.id+':'+mid]={task_id:t.id,member_id:mid}}
  const addRe=(tid,cid,re)=>{for(const [e,l] of Object.entries(re||{})) for(const mid of l) I.re[(tid||cid)+'|'+mid+'|'+e]={thread_id:tid,comment_id:cid,member_id:mid,emoji:e}};
  const addCms=(tid,cms)=>{for(const c of cms||[]){I.comments[c.id]={id:c.id,thread_id:tid,author_id:c.byId||null,body:c.text,at:c.at||Date.now()};addRe(null,c.id,c.re)}};
  for(const m of T.members){
    const [ss,se]=sleepOf(m);
    I.members[m.id]={id:m.id,name:m.name,email:m.email||'',tz:m.tz,start:m.start,end:m.end,start2:m.start2??null,end2:m.end2??null,weekends:!!m.weekends,sleepStart:ss,sleepEnd:se,photo:m.photo||'',status:m.status||'active',isMe:!!m.isMe,joined:!!m.joined};
    for(const ev of m.events||[]){I.events[ev.id]=I.events[ev.id]||{id:ev.id,title:ev.title,s:ev.s,e:ev.e,loc:ev.loc||'',kind:ev.kind||'',by:ev.by||null};I.att[ev.id+':'+m.id]={event_id:ev.id,member_id:m.id,status:ev.pend?'pending':'accepted',invited_by:ev.req||null,move_request:null}}
    for(const th of m.threads||[]){I.threads[th.id]={id:th.id,member_id:m.id,event_id:null,s:th.s,e:th.e,by:th.by||null};addCms(th.id,th.cm);addRe(th.id,null,th.re)}
  }
  for(const t of T.tasks||[]){if(!live(t)) continue;const tid=CLOUD.tkThread[t.id]||(CLOUD.tkThread[t.id]=uid());I.threads[tid]={id:tid,member_id:null,event_id:null,task_id:t.id,s:null,e:null,by:null};addCms(tid,t.cm);addRe(tid,null,t.re)}
  const my=T.members.find(x=>x.isMe);
  for(const ev of Object.values(I.events)){const k=S.meta&&S.meta[ev.id];if(!k) continue;
    if(live(k)){const tid=CLOUD.evThread[ev.id]||(CLOUD.evThread[ev.id]=uid());I.threads[tid]={id:tid,member_id:null,event_id:ev.id,s:null,e:null,by:null};addCms(tid,k.cm);addRe(tid,null,k.re)}
    for(const mid of k.join||[]) if(!I.att[ev.id+':'+mid]) I.att[ev.id+':'+mid]={event_id:ev.id,member_id:mid,status:'requested',invited_by:null,move_request:null};
    if(k.post&&my&&I.att[ev.id+':'+my.id]) I.att[ev.id+':'+my.id].move_request=k.post;
  }
  return I;
}
const sameJ=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const profileOf=m=>({name:m.name,tz:m.tz,start_h:m.start,end_h:m.end,start2_h:m.start2??null,end2_h:m.end2??null,weekends:!!m.weekends,sleep_start:m.sleepStart,sleep_end:m.sleepEnd,photo:m.photo||null});
const seatOf=(m,teamId)=>({team_id:teamId,added_by:CLOUD.user.id,invite_email:m.email||null,status:m.status||'active',name:m.name,photo:m.photo||null,tz:m.tz,start_h:m.start,end_h:m.end,start2_h:m.start2??null,end2_h:m.end2??null,weekends:!!m.weekends,sleep_start:m.sleepStart,sleep_end:m.sleepEnd});
async function run(q){const {error}=await q;if(error) throw error}
async function pushTeam(T){
  const L=CLOUD.last[T.id];if(!L) return;
  const N=toImage(T),my=T.members.find(m=>m.isMe),myId=my?my.id:null;
  if(N.name!==L.name) await run(sb.from('teams').update({name:N.name}).eq('id',T.id));
  const ins=[],upd=[],del=[];
  for(const id in N.members){const n=N.members[id],o=L.members[id];
    if(n.isMe){if(!o||!sameJ(n,o)) await run(sb.from('profiles').upsert({id:CLOUD.user.id,...profileOf(n)}));continue}
    if(n.joined) continue;
    if(!o) ins.push({id,...seatOf(n,T.id)});else if(!sameJ(n,o)) upd.push({id,...seatOf(n,T.id)});
  }
  for(const id in L.members) if(!N.members[id]) del.push(id);
  if(ins.length) await run(sb.from('members').insert(ins));
  for(const r of upd){const {id,team_id,added_by,...rest}=r;await run(sb.from('members').update(rest).eq('id',id))}
  if(del.length) await run(sb.from('members').delete().in('id',del));
  const evIns=[];
  const X=CLOUD.evCols; // the location and kind columns exist once the 2026-10-27 migration has run
  for(const id in N.events){const n=N.events[id],o=L.events[id];const row={id,team_id:T.id,title:n.title,starts_at:isoOf(n.s),ends_at:isoOf(n.e),created_by:n.by||myId,...(X?{location:n.loc||null,kind:n.kind||null}:{})};
    if(!o) evIns.push(row);else if(n.title!==o.title||n.s!==o.s||n.e!==o.e||(X&&(n.loc!==o.loc||n.kind!==o.kind))) await run(sb.from('events').update({title:row.title,starts_at:row.starts_at,ends_at:row.ends_at,...(X?{location:row.location,kind:row.kind}:{})}).eq('id',id))}
  if(evIns.length) await run(sb.from('events').insert(evIns));
  const attUp=[];for(const k in N.att){if(!L.att[k]||!sameJ(N.att[k],L.att[k])) attUp.push(N.att[k])}
  if(attUp.length) await run(sb.from('attendees').upsert(attUp,{onConflict:'event_id,member_id'}));
  for(const k in L.att) if(!N.att[k]) await run(sb.from('attendees').delete().match({event_id:L.att[k].event_id,member_id:L.att[k].member_id}));
  const evDel=Object.keys(L.events).filter(id=>!N.events[id]);if(evDel.length) await run(sb.from('events').delete().in('id',evDel));
  const LT=L.tasks||{},LA=L.tkas||{},tkRow=n=>({title:n.title,note:n.note||null,due_day:n.day,due_time:n.time,due_tz:n.tz,done_at:n.done?isoOf(n.done):null,cleared:!!n.cleared,files:n.files||[]});
  const tkIns=[];for(const id in N.tasks){const n=N.tasks[id],o=LT[id];if(!o) tkIns.push({id,team_id:T.id,created_by:n.by||myId,...tkRow(n)});else if(!sameJ(n,o)) await run(sb.from('tasks').update(tkRow(n)).eq('id',id))}
  if(tkIns.length) await run(sb.from('tasks').insert(tkIns));
  const taIns=[];for(const k in N.tkas) if(!LA[k]) taIns.push(N.tkas[k]);if(taIns.length) await run(sb.from('task_assignees').upsert(taIns,{onConflict:'task_id,member_id'}));
  for(const k in LA) if(!N.tkas[k]) await run(sb.from('task_assignees').delete().match(LA[k]));
  const tkDel=Object.keys(LT).filter(id=>!N.tasks[id]);if(tkDel.length) await run(sb.from('tasks').delete().in('id',tkDel));
  if(CLOUD.pjOn){
    const LP=L.projects||{},LPA=L.pas||{},LV=L.versions||{},LC=L.vcm||{},LR=L.vre||{};
    const pjRow=n=>({name:n.name,due_day:n.due,changed_by:n.who||(n.guest?null:myId),changed_at:isoOf(n.at),...(CLOUD.shareCols?{share_on:n.share_on,share_token:n.share_token,changed_guest:n.who?null:n.guest}:{})});
    const pjIns=[];for(const id in N.projects){const n=N.projects[id],o=LP[id];if(!o) pjIns.push({id,team_id:T.id,created_by:n.by||myId,...pjRow(n)});else if(!sameJ(n,o)) await run(sb.from('projects').update(pjRow(n)).eq('id',id))}
    if(pjIns.length) await run(sb.from('projects').insert(pjIns));
    const paIns=[];for(const k in N.pas) if(!LPA[k]) paIns.push(N.pas[k]);if(paIns.length) await run(sb.from('project_assignees').upsert(paIns,{onConflict:'project_id,member_id'}));
    for(const k in LPA) if(!N.pas[k]) await run(sb.from('project_assignees').delete().match(LPA[k]));
    const vRow=n=>({n:n.n,name:n.name,path:n.path,size:n.size,file:n.file,assets:n.assets,...(CLOUD.vShare?{share_on:n.share_on,share_token:n.share_token}:{})});
    const vIns=[];for(const id in N.versions){const n=N.versions[id],o=LV[id];if(!o) vIns.push({id,project_id:n.project_id,team_id:T.id,created_by:n.by||myId,...vRow(n)});else if(!sameJ(n,o)) await run(sb.from('versions').update(vRow(n)).eq('id',id))}
    if(vIns.length) await run(sb.from('versions').insert(vIns));
    const cIns=[];for(const id in N.vcm){const n=N.vcm[id],o=LC[id];if(!o) cIns.push({id,version_id:n.version_id,team_id:T.id,n:n.n,sel:n.sel,rx:n.rx,ry:n.ry,px:n.px,py:n.py,dev:n.dev,body:n.body,author_id:n.author_id||myId,status:n.status,from_version:n.from_version,from_comment:n.from_comment,...(CLOUD.shareCols?{snippet:n.snippet,layer:n.layer}:{}),created_at:isoOf(n.at||Date.now())});else if(n.status!==o.status) await run(sb.from('version_comments').update({status:n.status}).eq('id',id))}
    if(cIns.length) await run(sb.from('version_comments').insert(cIns));
    const rIns=[];for(const id in N.vre){const n=N.vre[id];if(!LR[id]) rIns.push({id,comment_id:n.comment_id,team_id:T.id,author_id:n.author_id||myId,body:n.body,created_at:isoOf(n.at||Date.now())})}
    if(rIns.length) await run(sb.from('version_replies').insert(rIns));
    const rDel=Object.keys(LR).filter(id=>!N.vre[id]);if(rDel.length) await run(sb.from('version_replies').delete().in('id',rDel));
    const cDel=Object.keys(LC).filter(id=>!N.vcm[id]);if(cDel.length) await run(sb.from('version_comments').delete().in('id',cDel));
    const vDel=Object.keys(LV).filter(id=>!N.versions[id]);if(vDel.length) await run(sb.from('versions').delete().in('id',vDel));
    const pjDel=Object.keys(LP).filter(id=>!N.projects[id]);if(pjDel.length) await run(sb.from('projects').delete().in('id',pjDel));
  }
  const thIns=[];for(const id in N.threads){const n=N.threads[id];if(!L.threads[id]) thIns.push({id,team_id:T.id,member_id:n.member_id,event_id:n.event_id,task_id:n.task_id||null,starts_at:n.s?isoOf(n.s):null,ends_at:n.e?isoOf(n.e):null,created_by:n.by||myId})}
  if(thIns.length) await run(sb.from('threads').insert(thIns));
  const cmIns=[];for(const id in N.comments){const n=N.comments[id];if(!L.comments[id]) cmIns.push({id,thread_id:n.thread_id,author_id:n.author_id||myId,body:n.body,created_at:isoOf(n.at)})}
  if(cmIns.length) await run(sb.from('comments').insert(cmIns));
  const cmDel=Object.keys(L.comments).filter(id=>!N.comments[id]);if(cmDel.length) await run(sb.from('comments').delete().in('id',cmDel));
  const reIns=[];for(const k in N.re) if(!L.re[k]) reIns.push(N.re[k]);
  if(reIns.length) await run(sb.from('reactions').insert(reIns));
  for(const k in L.re) if(!N.re[k]){const r=L.re[k];await run(sb.from('reactions').delete().match(r.thread_id?{thread_id:r.thread_id,member_id:r.member_id,emoji:r.emoji}:{comment_id:r.comment_id,member_id:r.member_id,emoji:r.emoji}))}
  const thDel=Object.keys(L.threads).filter(id=>!N.threads[id]);if(thDel.length) await run(sb.from('threads').delete().in('id',thDel));
  CLOUD.last[T.id]=N;
}
function pushSoon(){if(!sb||!CLOUD.user||!CLOUD.ready) return;clearTimeout(CLOUD.pushT);CLOUD.pushT=setTimeout(pushAll,250)}
async function pushAll(){
  if(CLOUD.pushing){CLOUD.pushAgain=true;return}CLOUD.pushing=true;setSyncState('saving');
  try{for(const T of S.teams) if(T.cloud&&CLOUD.last[T.id]) await pushTeam(T);setSyncState('saved')}
  catch(e){console.warn('sync',e);setSyncState('error');toast('Could not save to your account: '+((e&&e.message)||e))}
  finally{CLOUD.pushing=false;if(CLOUD.pushAgain){CLOUD.pushAgain=false;pushSoon()}if(CLOUD.dirty){CLOUD.dirty=false;pullSoon()}}
}
function pullSoon(){if(!sb||!CLOUD.user) return;clearTimeout(CLOUD.pullT);CLOUD.pullT=setTimeout(pull,400)}
async function pull(){
  if(!sb||!CLOUD.user) return;
  if(CLOUD.busy||CLOUD.pushing){CLOUD.dirty=true;return}
  CLOUD.busy=true;
  try{
    const q=async t=>{const {data,error}=await sb.from(t).select('*');if(error) throw error;return data||[]};
    const [teams,members,events,attendees,threads,comments,reactions,profiles,tasks,tas]=await Promise.all(['teams','v_members','events','attendees','threads','comments','reactions','profiles','tasks','task_assignees'].map(q));
    const [projects,pas,versions,vcm,vre]=CLOUD.pjOn?await Promise.all(['projects','project_assignees','versions','version_comments','version_replies'].map(q)):[[],[],[],[],[]];
    CLOUD.profile=profiles.find(p=>p.id===CLOUD.user.id)||CLOUD.profile;
    {const pf=(CLOUD.profile&&CLOUD.profile.prefs)||{};if(pf.hour12!=null) S.hour12=!!pf.hour12;if(pf.dur) UI.dur=+pf.dur;if(pf.weekStart!=null) S.weekStart=+pf.weekStart;if(pf.theme&&pf.theme!==document.documentElement.dataset.theme) setTheme(pf.theme,true)}
    for(const k of CLOUD.metaKeys) delete S.meta[k];CLOUD.metaKeys=new Set();CLOUD.evThread={};CLOUD.tkThread={};
    const built=buildTeams({teams,members,events,attendees,threads,comments,reactions,tasks,tas,projects,pas,versions,vcm,vre},CLOUD.user.id),local=S.teams.filter(t=>!t.cloud);
    S.teams=[...built,...local];
    CLOUD.last={};for(const T of built) CLOUD.last[T.id]=toImage(T);
    if(CLOUD.invOn){const {data}=await sb.rpc('my_invites');CLOUD.invites=Array.isArray(data)?data:[]}
    if(!S.teams.find(t=>t.id===S.active)) S.active=(built[0]||local[0]).id;
    try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
    ctxMap.clear();winMap.clear();render();
  }catch(e){console.warn('pull',e);toast('Could not load your teams: '+((e&&e.message)||e))}
  finally{CLOUD.busy=false;if(CLOUD.dirty){CLOUD.dirty=false;pullSoon()}}
}
function reidTeam(T){
  const mm={};for(const m of T.members) mm[m.id]=uid();const map=id=>mm[id]||id,em={};
  const old=T.id;T.id=uid();if(S.active===old) S.active=T.id;
  const fixCm=c=>{c.id=uid();if(c.byId) c.byId=map(c.byId);c.re=remapRe(c.re,map)};
  for(const m of T.members){m.id=map(m.id);
    for(const ev of m.events||[]){if(!em[ev.id]) em[ev.id]=uid();ev.id=em[ev.id];ev.who=(ev.who||[]).map(map);if(ev.req) ev.req=map(ev.req);if(ev.by) ev.by=map(ev.by)}
    for(const th of m.threads||[]){th.id=uid();th.re=remapRe(th.re,map);(th.cm||[]).forEach(fixCm)}}
  for(const [k,v] of Object.entries(S.meta||{})) if(em[k]){delete S.meta[k];S.meta[em[k]]=v;v.re=remapRe(v.re,map);(v.cm||[]).forEach(fixCm);if(v.join) v.join=v.join.map(map)}
  for(const t of T.tasks||[]){t.id=uid();t.to=(t.to||[]).map(map);if(t.by) t.by=map(t.by);(t.cm||[]).forEach(fixCm);t.re=remapRe(t.re,map)}
  for(const p of T.projects||[]){p.to=(p.to||[]).map(map);if(p.by) p.by=map(p.by);if(p.who) p.who=map(p.who);for(const v of p.versions||[]){if(v.by) v.by=map(v.by);for(const c of v.cm||[]){if(c.byId) c.byId=map(c.byId);for(const r of c.re||[]) if(r.byId) r.byId=map(r.byId)}}}
  T.gone={};
}
function remapMember(T,from,to){
  const map=id=>id===from?to:id,fixCm=c=>{if(c.byId===from) c.byId=to;c.re=remapRe(c.re,map)};
  for(const m of T.members){for(const ev of m.events||[]){ev.who=(ev.who||[]).map(map);if(ev.req===from) ev.req=to;if(ev.by===from) ev.by=to}for(const th of m.threads||[]){th.re=remapRe(th.re,map);(th.cm||[]).forEach(fixCm)}}
  for(const v of Object.values(S.meta||{})){v.re=remapRe(v.re,map);(v.cm||[]).forEach(fixCm);if(v.join) v.join=v.join.map(map)}
  for(const t of T.tasks||[]){t.to=(t.to||[]).map(map);if(t.by===from) t.by=to;(t.cm||[]).forEach(fixCm);t.re=remapRe(t.re,map)}
  for(const p of T.projects||[]){p.to=(p.to||[]).map(map);if(p.by===from) p.by=to;if(p.who===from) p.who=to;for(const v of p.versions||[]){if(v.by===from) v.by=to;for(const c of v.cm||[]){if(c.byId===from) c.byId=to;for(const r of c.re||[]) if(r.byId===from) r.byId=to}}}
}
async function uploadTeam(T){
  reidTeam(T);
  const {data:id,error}=await sb.rpc('create_team',{team_name:T.name});if(error) throw error;
  const old=T.id;T.id=id;T.cloud=true;T.sample=false;delete T.demo;if(S.active===old) S.active=id;
  const my=T.members.find(m=>m.isMe);
  const {data:seat}=await sb.from('members').select('id').eq('team_id',id).eq('user_id',CLOUD.user.id).maybeSingle();
  if(seat&&my){const was=my.id;my.id=seat.id;my.userId=CLOUD.user.id;remapMember(T,was,seat.id)}
  CLOUD.last[T.id]={name:T.name,members:my?{[my.id]:{}}:{},events:{},att:{},threads:{},comments:{},re:{},tasks:{},tkas:{}};
  if(typeof syncProjectFiles==='function') await syncProjectFiles(T);
  await pushTeam(T);
}
async function createCloudTeam(name){
  const {data,error}=await sb.rpc('create_team',{team_name:name});if(error){toast('Could not create the team: '+error.message);return null}
  await pull();S.active=data;save();UI.day=today();render();return data;
}
// an invite link opened while signed in leaves a request in the inbox; you are in the team only once you accept
async function holdInvite(code){
  const {data,error}=await sb.rpc('invite_hold',{code});if(error){toast(error.message||'That invite link did not work.');return}
  if(data&&data.member){S.active=data.team_id;toast('You are already in '+data.name);return}
  CLOUD.invHeld=true;
}
function showInvites(){
  const v=CLOUD.invites[0];CLOUD.invHeld=false;if(!v) return;
  openInbox(true);toast(`${v.by?first(v.by):'Someone'} invited you to ${v.name}`);
}
async function answerTeamInvite(id,yes){
  const {data,error}=await sb.rpc('invite_answer',{p_id:id,p_accept:yes});
  if(error){toast(error.message||'That did not go through. Try again.');pullSoon();return}
  CLOUD.invites=CLOUD.invites.filter(x=>x.id!==id);
  if(!yes){render();toast('Invite declined');return}
  await pull();if(S.teams.some(t=>t.id===data)) S.active=data;
  S.teams=S.teams.filter(t=>t.cloud||hasWork(t));save();UI.day=today();openInbox(false);setView('team',true);render();toast('Welcome to '+team().name);
}
// the team's name for the sign-in screen, before there is an account
async function peekInvite(code){
  if(!sb) return;try{const {data}=await sb.rpc('invite_peek',{code});
    if(data&&data.name&&!CLOUD.user&&AUTH.why==='join'){const w=$('#authWhy');w.hidden=false;w.innerHTML=`<b>You are invited to ${esc(data.name)}.</b> Create an account or log in. The invite waits in your inbox, and you join when you accept.`}}catch(e){}
}
async function joinByCode(code){
  const {data,error}=await sb.rpc('join_team',{code});if(error){toast(error.message||'That invite link did not work.');return}
  await pull();S.active=data;save();UI.day=today();render();toast('Welcome to '+team().name);
}
function listen(){
  if(CLOUD.chan||!sb) return;CLOUD.chan=sb.channel('noon-'+CLOUD.user.id);
  for(const t of ['teams','members','profiles','events','attendees','threads','comments','reactions','tasks','task_assignees',...(CLOUD.pjOn?['projects','project_assignees','versions','version_comments','version_replies']:[])]) CLOUD.chan.on('postgres_changes',{event:'*',schema:'public',table:t},()=>pullSoon());
  CLOUD.chan.subscribe();
}
async function cloudStart(u){
  CLOUD.user=u;CLOUD.ready=false;renderSide();
  try{const {error}=await sb.from('events').select('location,kind').limit(1);CLOUD.evCols=!error}catch(e){CLOUD.evCols=false}
  try{const {error}=await sb.from('projects').select('id').limit(1);CLOUD.pjOn=!error}catch(e){CLOUD.pjOn=false} // the 2026-10-27 projects migration
  try{const {error}=await sb.from('version_comments').select('layer').limit(1);CLOUD.shareCols=CLOUD.pjOn&&!error}catch(e){CLOUD.shareCols=false} // client links, connector and comment layers
  try{const {error}=await sb.from('versions').select('share_on').limit(1);CLOUD.vShare=CLOUD.shareCols&&!error}catch(e){CLOUD.vShare=false} // a client link per version
  try{const {error}=await sb.rpc('my_invites');CLOUD.invOn=!error}catch(e){CLOUD.invOn=false} // invites wait as requests (2026-10-28 migration)
  const fresh=document.documentElement.dataset.auth!=='in';
  await pull();
  try{const {data}=await sb.from('profiles').select('*').eq('id',u.id).maybeSingle();if(data) CLOUD.profile={...(CLOUD.profile||{}),...data}}catch(e){}
  for(const T of S.teams.filter(t=>!t.cloud&&t.members.some(m=>m.isMe)&&hasWork(t))){
    try{await uploadTeam(T)}catch(e){console.warn('upload',e);toast('Could not move '+T.name+' to your account: '+((e&&e.message)||e))}
  }
  const code=heldCode();dropCode();
  if(code){if(CLOUD.invOn) await holdInvite(code);else await joinByCode(code)}
  if(!S.teams.find(t=>t.id===S.active)||!team().cloud){const c=S.teams.find(t=>t.cloud);if(c) S.active=c.id}
  listen();CLOUD.ready=true;await pull();
  AUTH.why=null;if(S.teams.some(t=>t.cloud)) S.teams=S.teams.filter(t=>t.cloud||hasWork(t));
  save();UI.day=today();
  if(needsOnboarding()){startOnboarding();return}
  setAuthState('in');render();
  if(CLOUD.invHeld||(fresh&&CLOUD.invites.length)) showInvites();
  else if(fresh) toast(`Welcome back, ${first(user().name)}.`);
}
function cloudStop(){
  if(CLOUD.chan){sb.removeChannel(CLOUD.chan);CLOUD.chan=null}
  for(const k of CLOUD.metaKeys) delete S.meta[k];CLOUD.metaKeys=new Set();CLOUD.evThread={};CLOUD.tkThread={};CLOUD.last={};
  CLOUD.user=null;CLOUD.profile=null;CLOUD.ready=false;CLOUD.invites=[];
  S.teams=S.teams.filter(t=>!t.cloud);
  if(!S.teams.length){const sd=seed();S.teams=sd.teams;S.active=sd.active}else if(!S.teams.find(t=>t.id===S.active)) S.active=S.teams[0].id;
  $$('dialog[open]').forEach(d=>d.close());
  save();UI.day=today();render();authTab('login');setAuthState('out');
}
if(sb&&!SHARE) sb.auth.onAuthStateChange((ev,session)=>{
  const u=session&&session.user;
  if(u){if(!CLOUD.user||CLOUD.user.id!==u.id) cloudStart(u);else CLOUD.user=u}
  else if(CLOUD.user){cloudStop();toast('Logged out. Your teams are safe in your account.')}
  else{renderSide();setAuthState('out')}
});
if(!SHARE){authTab('login');if(!sb){setAuthState('out');say('#logErr','Accounts are not reachable right now. Check your connection and reload.')}}
function logout(){if(sb) sb.auth.signOut()}
// a sign-in link that failed comes back with the reason in the address
{const h=new URLSearchParams(location.hash.slice(1));if(h.get('error')||h.get('error_code')){const c=h.get('error_code')||'',msg=/expired/.test(c)?'That link has expired or was already used. Log in with your password, or ask for a new link.':(h.get('error_description')||'That sign-in link did not work.');history.replaceState(null,'',location.pathname+location.search);setTimeout(()=>{if(!CLOUD.user){openAuth('login');say('#logErr',msg)}},700)}}
