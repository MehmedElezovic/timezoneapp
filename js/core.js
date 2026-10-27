/* Noon · core: helpers, time math, state, availability, tasks, inbox and links.
   Ported from the previous build; nothing in here touches the DOM except save() persisting to localStorage. */

/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16)});
const LS='noon.v1';
const MIN=60000, HR=3600000, DAY=86400000;
const pad2=n=>String(n).padStart(2,'0');
const initials=n=>String(n||'').split(/\s+/).map(x=>x[0]||'').slice(0,2).join('').toUpperCase();
const first=n=>String(n||'').split(' ')[0];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- time math ---------- */
const fmtCache={};
function dtf(key,tz,opts){const k=key+tz;return fmtCache[k]||(fmtCache[k]=new Intl.DateTimeFormat('en-US',{timeZone:tz,...opts}))}
function parts(tz,ms){
  const f=dtf('p',tz,{hourCycle:'h23',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric'});
  const o={};for(const p of f.formatToParts(ms)) o[p.type]=+p.value;
  return {y:o.year,m:o.month,d:o.day,h:o.hour%24,mi:o.minute};
}
function offsetMin(tz,ms){const t0=Math.floor(ms/MIN)*MIN,p=parts(tz,t0);return (Date.UTC(p.y,p.m-1,p.d,p.h,p.mi)-t0)/MIN}
function zonedToUtc(tz,y,m,d,h,mi){
  const g=Date.UTC(y,m-1,d,h,mi);let r=g-offsetMin(tz,g)*MIN;const o2=offsetMin(tz,r);
  if(g-o2*MIN!==r) r=g-o2*MIN;return r;
}
function localDates(tz,a,b){
  const pa=parts(tz,a),pb=parts(tz,b),out=[];
  let t=Date.UTC(pa.y,pa.m-1,pa.d);const end=Date.UTC(pb.y,pb.m-1,pb.d);
  for(;t<=end;t+=DAY){const x=new Date(t);out.push({y:x.getUTCFullYear(),m:x.getUTCMonth()+1,d:x.getUTCDate()})}
  return out;
}
const isWeekday=(y,m,d)=>{const w=new Date(Date.UTC(y,m-1,d)).getUTCDay();return w>0&&w<6};
const tzLabel=tz=>tz==='UTC'?'UTC':tz.split('/').pop().replace(/_/g,' ');
function fmtT(ms,tz){
  const h12=S.hour12,f=dtf('t'+h12,tz,{hour:'numeric',minute:'2-digit',hour12:h12});
  const s=f.format(ms);return h12?s.replace(/\s?([AP])M/,(_,c)=>' '+c.toLowerCase()+'m'):s.replace(/^24/,'00');
}
function fmtHr(ms,tz){return S.hour12?dtf('hh',tz,{hour:'numeric',hour12:true}).format(ms).toLowerCase():dtf('h24',tz,{hour:'2-digit',hourCycle:'h23'}).format(ms)+':00'}
const fmtDate=(ms,tz)=>dtf('d',tz,{weekday:'short',month:'short',day:'numeric'}).format(ms);
const fmtDateLong=(ms,tz)=>dtf('dl',tz,{weekday:'long',day:'numeric',month:'long'}).format(ms);
const fmtWd=(ms,tz)=>dtf('wd',tz,{weekday:'short'}).format(ms);
function tzAbbr(ms,tz){const p=dtf('z',tz,{timeZoneName:'short'}).formatToParts(ms).find(x=>x.type==='timeZoneName');return p?p.value:tz}
const hhmm=h=>{const H=Math.floor(h),M=Math.round((h-H)*60);return pad2(H)+':'+pad2(M)};
const toH=s=>{const [h,m]=String(s||'0:0').split(':').map(Number);return h+m/60};
const fmtDur=m=>m>=60?`${Math.floor(m/60)}h${m%60?` ${m%60}m`:''}`:`${m} min`;
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/* ---------- state ---------- */
function mk(name,tz,s,e,o={}){return {id:uid(),name,email:'',tz,start:s,end:e,cal:false,status:'active',...o}}
const PIC=n=>`https://i.pravatar.cc/120?img=${n}`;
const DEMO={
  'You':{photo:PIC(12),start:9,end:17,start2:20,end2:22.5,weekends:true,cal:true},
  'Amara Okafor':{photo:PIC(16),start:8,end:12,start2:13,end2:17,weekends:true,cal:true,sleepStart:22.5,sleepEnd:6.5,joined:true,conn:['google','slack']},
  'Jonas Weber':{photo:PIC(13),start:7.5,end:17.5,weekends:true,cal:true,sleepStart:23.5,sleepEnd:7,joined:true,conn:['outlook','slack']},
  'Priya Nair':{photo:PIC(32),start:10,end:14,start2:15,end2:19,weekends:true,cal:true,joined:true,conn:['google']},
  'Mei Tanaka':{photo:PIC(26),start:9,end:18,start2:21,end2:23.5,weekends:true,cal:true,sleepStart:0,sleepEnd:7.5,joined:true,conn:['google','slack']},
  'Diego Alves':{photo:PIC(59),start:9,end:13,start2:15,end2:19,weekends:true,cal:false,sleepStart:1,sleepEnd:8},
  'Sam Rivera':{photo:PIC(8),start:8,end:16,weekends:true,sleepStart:22,sleepEnd:6},
  'Olivia Chen':{photo:PIC(47),start:9,end:17.5,weekends:true,cal:true,sleepStart:23,sleepEnd:6.5,joined:true,conn:['google','slack']},
  'Noah Williams':{photo:PIC(68),start:8.5,end:16.5,weekends:true,cal:true,sleepStart:23,sleepEnd:7,joined:true,conn:['slack']},
  'Sofia Rossi':{photo:PIC(44),start:9.5,end:13,start2:14.5,end2:18.5,weekends:true,cal:false,sleepStart:0,sleepEnd:7.5},
  'Liam Murphy':{photo:PIC(53),start:8,end:16,weekends:true,cal:true,sleepStart:22.5,sleepEnd:6,joined:true,conn:['google']},
  'Aisha Khan':{photo:PIC(45),start:9,end:18,weekends:true,cal:true,sleepStart:23.5,sleepEnd:7,joined:true,conn:['outlook','slack']}};
const V3={'You':[['end2',22,22.5]],'Mei Tanaka':[['end2',23,23.5]],'Jonas Weber':[['start',9,7.5]]};
function upgrade(st){
  const v=st.v|0,demo=m=>DEMO[m.name]&&(m.isMe||/@example\.com$/.test(m.email||''));
  for(const t of st.teams){
    for(const m of t.members){
      if(!demo(m)) continue;
      if(v<2) Object.assign(m,DEMO[m.name]);
      else if(v<3) for(const [k,from,to] of V3[m.name]||[]) if(m[k]===from) m[k]=to;
    }
    if(t.sample===undefined) t.sample=t.members.some(m=>!m.isMe&&demo(m));
  }
  if(v<5) for(const t of st.teams) for(const m of t.members) if(demo(m)&&!m.isMe){const d=DEMO[m.name];m.joined=!!d.joined;m.conn=d.conn||[];if(!d.joined) m.cal=false}
  if(v<6) for(const t of st.teams){const mine=(t.members.find(x=>x.isMe)||{}).id;for(const m of t.members){
    for(const n of m.notes||[]){m.threads=m.threads||[];let th=m.threads.find(x=>x.s===n.t);if(!th){th={id:'t'+n.id,s:n.t,e:n.t+30*MIN,re:{},cm:[]};m.threads.push(th)}
      if(n.text) th.cm.push({id:n.id,by:'You',text:n.text,at:n.t});if(n.emoji) (th.re[n.emoji]=th.re[n.emoji]||[]).push(mine)}
    delete m.notes}}
  if(v<7) for(const t of st.teams) if(t.sample&&t.name==='Demo crew') t.demo=true;
  st.meta=st.meta||{};st.integ=st.integ||{google:false,outlook:false};if(st.hour12==null) st.hour12=false;if(st.weekStart==null) st.weekStart=1;st.v=7;return st;
}
const blocksOf=m=>[[m.start,m.end],...(m.start2!=null&&m.end2>m.start2?[[m.start2,m.end2]]:[])];
const dayOn=(m,D)=>!!m.weekends||isWeekday(D.y,D.m,D.d);
function seed(){
  const my=Intl.DateTimeFormat().resolvedOptions().timeZone;
  const t={id:uid(),name:'My team',sample:false,members:[mk('You',my,9,17,{isMe:true,cal:false})]};
  return upgrade({teams:[t],active:t.id,hour12:false,weekStart:1,integ:{google:false,outlook:false},v:7});
}
function load(){try{const j=JSON.parse(localStorage.getItem(LS));if(j&&j.teams&&j.teams.length)return upgrade(j)}catch(e){}return seed()}
var SYNC_ON=false; // sync.js flips this once accounts are wired in
// ?share=<token> is a client opening a review link: Noon boots with just that project in memory and saves nothing locally
const SHARE=(()=>{try{const t=new URLSearchParams(location.search).get('share');return t&&/^[A-Za-z0-9_-]{20,64}$/.test(t)?t:null}catch(e){return null}})();
function shareSeed(){const t={id:'share',name:'Review',sample:false,members:[{...mk('Guest',Intl.DateTimeFormat().resolvedOptions().timeZone,9,17,{isMe:true}),id:'guest-me'}],projects:[]};return upgrade({teams:[t],active:t.id,hour12:false,weekStart:1,integ:{google:false,outlook:false},v:7})}
function save(){if(SHARE){if(typeof shareSave==='function') shareSave();return}try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}if(SYNC_ON&&typeof pushSoon==='function') pushSoon()}
let S=SHARE?shareSeed():load();if(!SHARE) save();
const team=()=>S.teams.find(t=>t.id===S.active)||S.teams[0];
const me=()=>team().members.find(m=>m.isMe)||team().members[0];
const home=()=>me().tz;
const ghost=(T,id)=>{const g=(T.gone||{})[id];return g?{id,name:g.name,photo:g.photo,tz:g.tz,gone:true}:null};
const gname=z=>z.gone?first(z.name)+' (left the team)':first(z.name);
const findM=(id,T=team())=>T.members.find(z=>z.id===id)||ghost(T,id);
const sleepOf=m=>[m.sleepStart??23,m.sleepEnd??7];
const CONN={google:'Google Calendar',outlook:'Outlook',slack:'Slack'};
const kindOf=m=>m.isMe?'me':m.joined?'joined':m.status==='invited'?'invited':'manual';
const connOf=m=>m.isMe?Object.keys(CONN).filter(k=>(S.integ||{})[k]):(m.conn||[]);
const KIND_LABEL={me:'You',joined:'Joined with their own account',invited:'Invited, not joined yet',manual:'Added by you'};

/* UI state that the logic needs: the day in view (home-zone 'YYYY-MM-DD') and the default meeting length */
const UI={day:null,dur:30,view:'calendar',cal:'week',sel:null,draft:null,tkf:'open',tkEdit:null,tkAssign:null,filter:new Set(),hover:null,teamCursor:null,inbox:false,menu:null,evThread:null};

function dayRange(day=UI.day){const [y,m,d]=day.split('-').map(Number),h=home();return [zonedToUtc(h,y,m,d,0,0),zonedToUtc(h,y,m,d+1,0,0)]}
const shiftDay=(day,n)=>{const [y,m,d]=day.split('-').map(Number);return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10)};
const dowOf=day=>{const [y,m,d]=day.split('-').map(Number);return new Date(Date.UTC(y,m-1,d)).getUTCDay()};
const weekDays=day=>{const ws=S.weekStart??1,dow=(dowOf(day)-ws+7)%7;return Array.from({length:7},(_,i)=>shiftDay(day,i-dow))};
const monthOf=day=>day.slice(0,7);
const dayParts=day=>{const [y,m,d]=day.split('-').map(Number);return {y,m,d}};
const mkDay=(y,m,d)=>new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10);
function today(){const p=parts(home(),Date.now());return `${p.y}-${pad2(p.m)}-${pad2(p.d)}`}
const dayOf=t=>{const p=parts(home(),t);return p.y+'-'+pad2(p.m)+'-'+pad2(p.d)};
const dayDiff=(day,from=today())=>Math.round((dayRange(day)[0]-dayRange(from)[0])/DAY);
const dayLabel=day=>{const d=dayDiff(day);return d===0?'Today':d===1?'Tomorrow':d===-1?'Yesterday':fmtDate(dayRange(day)[0]+12*HR,home())};
function whenLabel(t){const H=home(),d=dayDiff(dayOf(t));return (d===0?'Today':d===-1?'Yesterday':d===1?'Tomorrow':fmtDate(t,H))+', '+fmtT(t,H)}
const r5=t=>Math.round(t/(5*MIN))*5*MIN;
const r15=t=>Math.round(t/(15*MIN))*15*MIN;
const threadAt=(m,t)=>(m.threads||[]).find(x=>t>=x.s&&t<x.e);
const tidyThreads=m=>{m.threads=(m.threads||[]).filter(x=>x.cm.length||Object.values(x.re).some(l=>l.length))};
function blockAt(m,t,c){
  const [a,b]=dayRange(dayOf(t));let s=-Infinity,e=Infinity;
  for(const l of [c.sleep[m.id],c.busy[m.id],c.work[m.id]]) for(const seg of l) for(const p of [seg[0],seg[1]]){if(p<=t&&p>s) s=p;if(p>t&&p<e) e=p}
  return [isFinite(s)?s:a,isFinite(e)?e:b];
}
const EMOJI=['👍','🎉','❤️','👀','🙏','😬','⏰','✅','🔥','😴'];
const evKey=(m,ev)=>ev[3]||m.id+':'+ev[0];
const peekMeta=k=>(S.meta||{})[k];
const metaOf=k=>{S.meta=S.meta||{};return S.meta[k]||(S.meta[k]={re:{},cm:[]})};
const snapshot=()=>{const j=JSON.stringify({teams:S.teams,meta:S.meta||{}});return()=>{const o=JSON.parse(j);S.teams=o.teams;S.meta=o.meta;save();render();toast('Restored')}};
const live=o=>(o&&((o.cm||[]).length||Object.values(o.re||{}).some(l=>l.length)));

/* ---------- availability ---------- */
function rng(str){let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const busyCache={},SAMPLE_EVENTS=['Standup','1:1','Design review','Client call','Planning','Interview','Sprint planning','Code review','Roadmap planning'];
const TYPES={meet:['Meeting','purple'],plan:['Planning','blue'],review:['Review','yellow']};
const typeOf=t=>/plan|roadmap|sprint|kickoff/i.test(t||'')?'plan':/review|retro|demo|critique/i.test(t||'')?'review':'meet';
const kindOfItem=(title,kind)=>TYPES[kind]?kind:typeOf(title);
const evColor=(title,kind)=>TYPES[kindOfItem(title,kind)][1];
// busy list for one person between a and b: [s,e,title,id,who,pend,req,loc,kind]
function busyList(m,a,b){
  const out=(m.events||[]).map(ev=>[ev.s,ev.e,ev.title,ev.id,ev.who,!!ev.pend,ev.req,ev.loc||'',ev.kind||'']);
  if(m.cal) for(const D of localDates(m.tz,a-DAY,b+DAY)){
    const bl=blocksOf(m),key=m.id+m.tz+D.y+'-'+D.m+'-'+D.d+JSON.stringify(bl)+!!m.weekends;
    if(!busyCache[key]){
      const r=rng(key),list=[];
      if(dayOn(m,D)) for(const s of [8,9,10,11,13,14,15,16,17,20].filter(h=>bl.some(([x,y])=>h>=x&&h+1<=y)).filter(()=>r()<(isWeekday(D.y,D.m,D.d)?.4:.12))){const len=r()<.5?30:60,st=zonedToUtc(m.tz,D.y,D.m,D.d,s,0);list.push([st,st+len*MIN,SAMPLE_EVENTS[Math.floor(r()*SAMPLE_EVENTS.length)]])}
      busyCache[key]=list;
    }
    out.push(...busyCache[key]);
  }
  return out.sort((x,y)=>x[0]-y[0]);
}
function workSegs(m,a,b){
  const out=[];
  for(const D of localDates(m.tz,a-DAY,b+DAY)){
    if(!dayOn(m,D)) continue;
    for(const [s,e] of blocksOf(m)) out.push([zonedToUtc(m.tz,D.y,D.m,D.d,Math.floor(s),Math.round((s%1)*60)),zonedToUtc(m.tz,D.y,D.m,D.d,Math.floor(e),Math.round((e%1)*60))]);
  }
  return out;
}
function sleepSegs(m,a,b){
  const [ss,se]=sleepOf(m),out=[],hm=h=>[Math.floor(h),Math.round((h%1)*60)];
  for(const D of localDates(m.tz,a-2*DAY,b+DAY))
    out.push([zonedToUtc(m.tz,D.y,D.m,D.d,...hm(ss)),zonedToUtc(m.tz,D.y,D.m,D.d+(se>ss?0:1),...hm(se))]);
  return out;
}
// sleeping beats a meeting, a meeting beats working hours, anything else is offline
function statusAt(m,ms,c,skipId){
  const inn=l=>l.some(([a,b])=>ms>=a&&ms<b);
  if(inn(c.sleep[m.id])) return ['sleep','Sleeping'];
  const ev=c.busy[m.id].find(x=>ms>=x[0]&&ms<x[1]&&!(skipId&&x[3]===skipId)); // a pending invite still holds the slot; the meeting being edited does not
  if(ev){const ty=typeOf(ev[2]||'');return ['meet',ty==='plan'?'In planning':ty==='review'?'In a review':'In a meeting',ev]}
  if(inn(c.work[m.id])) return ['avail','Available'];
  return ['off','Offline'];
}
const STATUS_LABEL={sleep:'Asleep',meet:'Busy',avail:'Available',off:'Offline'};
function freeFor(m,s,e,c){
  for(let t=s;t<e;t+=15*MIN) if(statusAt(m,t,c)[0]!=='avail') return false;
  return true;
}
function dayLoad(m,t,c){
  const p=parts(m.tz,t),ev=c.busy[m.id].filter(x=>{const q=parts(m.tz,x[0]);return q.y===p.y&&q.m===p.m&&q.d===p.d});
  return {n:ev.length,mins:Math.round(ev.reduce((s,x)=>s+(x[1]-x[0])/MIN,0))};
}
const HEAVY=l=>l.n>=4||l.mins>=180;
// everything worth knowing before putting something in [s,e) for this person. lvl 2 = they cannot make it
function warningsFor(m,s,e,c,skipId){
  const w=[],nm=m.isMe?'You':first(m.name),be=m.isMe?'are':'is',poss=m.isMe?'your':first(m.name)+"'s";
  for(let t=s;t<e;t+=15*MIN){
    const k=statusAt(m,t,c,skipId);if(k[0]==='avail') continue;
    w.push({lvl:2,kind:k[0],text:t>s?`${nm} ${be} only free for part of it.`:k[0]==='sleep'?`${nm} ${be} asleep at this time.`:k[0]==='meet'?`${nm} ${be} already in ${k[2][2]||'something'}.`:`${nm} ${be} offline at this time.`});
    break;
  }
  for(const [ss,se] of c.sleep[m.id]){
    if(e>ss-HR&&e<=ss) w.push({lvl:1,text:`Ends within an hour of ${poss} bedtime, ${fmtT(ss,m.tz)}.`});
    if(s>=se&&s<se+HR) w.push({lvl:1,text:`Starts within an hour of ${m.isMe?'you':nm} waking up, ${fmtT(se,m.tz)}.`});
  }
  const l=dayLoad(m,s,c);
  if(HEAVY(l)) w.push({lvl:1,text:`${nm} already ${m.isMe?'have':'has'} ${l.n} meetings that day, ${fmtDur(l.mins)} in total.`});
  const adj=c.busy[m.id].find(x=>(x[1]===s||x[0]===e)&&x[3]!==skipId);
  if(adj) w.push({lvl:1,text:`Back to back with ${poss} ${adj[2]||'other meeting'}.`});
  return w;
}
const ctxMap=new Map(),winMap=new Map();
function ctx(day=UI.day){
  const T=team(),[a,b]=dayRange(day);
  const key=T.id+day+home()+JSON.stringify(T.members.map(m=>[m.id,m.tz,blocksOf(m),!!m.weekends,m.cal,sleepOf(m),m.events||0]));
  let v=ctxMap.get(key);if(v) return v;
  v={work:{},busy:{},sleep:{},key,a,b};
  for(const m of T.members){v.work[m.id]=workSegs(m,a,b);v.busy[m.id]=busyList(m,a,b);v.sleep[m.id]=sleepSegs(m,a,b)}
  if(ctxMap.size>60) ctxMap.clear();
  ctxMap.set(key,v);return v;
}
// the stretches of a day where the most of these people are free for dur minutes
function windowsFor(day,people,dur,step=30){
  const [a,b]=dayRange(day),c=ctx(day),key=c.key+'|'+dur+'|'+step+'|'+people.map(m=>m.id).join(',');
  let v=winMap.get(key);if(v) return v;
  const d=dur*MIN,cands=[];let max=0;
  for(let s=a;s+d<=b;s+=step*MIN){const n=people.filter(m=>freeFor(m,s,s+d,c)).length;cands.push([s,n]);if(n>max)max=n}
  const out=[];
  if(max>0){let cur=null;for(const [s,n] of cands){if(n===max){if(cur&&s-cur.last<=step*MIN)cur.last=s;else{cur={first:s,last:s};out.push(cur)}}else cur=null}}
  const list=out.map(w=>({start:w.first,end:w.last+d,n:max}));
  v={max,total:people.length,list,best:list.slice().sort((x,y)=>(y.end-y.start)-(x.end-x.start)||x.start-y.start)[0]||null};
  if(winMap.size>120) winMap.clear();
  winMap.set(key,v);return v;
}
const windows=(day=UI.day)=>windowsFor(day,team().members,UI.dur);
// the next moment someone's status changes after t
function nextChange(m,t,c){
  const cur=statusAt(m,t,c)[0];let best=Infinity;
  for(const l of [c.sleep[m.id],c.busy[m.id],c.work[m.id]]) for(const seg of l) for(const p of [seg[0],seg[1]]) if(p>t&&p<best) best=p;
  if(!isFinite(best)) return null;const k=statusAt(m,best,c);return k[0]===cur?nextChange(m,best,c):[best,k];
}
function nextFree(m,t,c){let cur=t;for(let i=0;i<8;i++){const n=nextChange(m,cur,c);if(!n)return null;if(n[1][0]==='avail')return n[0];cur=n[0]}return null}

/* ---------- meetings ---------- */
const myEv=id=>(me().events||[]).find(x=>x.id===id);
const evOwner=(ev)=>ev.by||null;
function addEvent(ids,title,st,dur,extra={}){
  const id=uid(),pending=[],T=team(),by=me().id;
  for(const m of T.members) if(ids.includes(m.id)){
    const pend=kindOf(m)==='joined';if(pend) pending.push(first(m.name));
    (m.events=m.events||[]).push({id,title:title||'Meeting',s:st,e:st+dur*MIN,who:[...ids],pend,by,...(pend?{req:by}:{}),...extra});
  }
  save();return {id,pending};
}
function updateEvent(id,patch){
  for(const m of team().members) for(const ev of m.events||[]) if(ev.id===id) Object.assign(ev,patch);
  save();
}
function setAttendees(id,ids){
  const T=team(),by=me().id,tpl=(()=>{for(const m of T.members){const e=(m.events||[]).find(x=>x.id===id);if(e) return e}return null})();if(!tpl) return;
  for(const m of T.members){
    const has=(m.events||[]).some(x=>x.id===id),want=ids.includes(m.id);
    if(want&&!has){const pend=kindOf(m)==='joined';(m.events=m.events||[]).push({...tpl,who:[...ids],pend,...(pend?{req:by}:{})})}
    else if(!want&&has) m.events=m.events.filter(x=>x.id!==id);
  }
  for(const m of T.members) for(const ev of m.events||[]) if(ev.id===id) ev.who=[...ids];
  save();
}
function deleteEvent(id){for(const m of team().members) m.events=(m.events||[]).filter(x=>x.id!==id);delete (S.meta||{})[id];save()}
function answerInvite(id,yes){const ev=myEv(id);if(!ev) return;if(yes){ev.pend=false;delete ev.req}else{me().events=me().events.filter(x=>x.id!==id)}save()}
function moveEvent(id,toStart){const ev=myEv(id);if(!ev) return;const d=ev.e-ev.s;updateEvent(id,{s:toStart,e:toStart+d})}
// a person's items on a day: [s,e,title,id,who,pend,req,loc]
function itemsOn(m,day){const [a,b]=dayRange(day),c=ctx(day);return c.busy[m.id].filter(x=>x[1]>a&&x[0]<b)}
// what is coming up for me: the first booked thing after now (a few minutes of grace), within the next day
function upNext(){
  const m=me(),now=Date.now(),list=[];
  for(const day of [today(),shiftDay(today(),1)]) for(const x of itemsOn(m,day)) if(!x[5]&&x[1]>now-5*MIN&&x[0]<now+DAY) list.push(x);
  list.sort((p,q)=>p[0]-q[0]);
  const seen=new Set();return list.filter(x=>{const k=x[3]||x[0]+x[2];if(seen.has(k)) return false;seen.add(k);return true})[0]||null;
}

/* ---------- tasks ---------- */
const TK_GROUPS=[['overdue','Overdue'],['today','Today'],['week','This week'],['later','Later'],['none','No deadline']];
const tkDayDiff=day=>dayDiff(day);
const tkDayLabel=dayLabel;
function taskInstant(t){if(!t.day||!t.time) return null;const [y,m,d]=t.day.split('-').map(Number),[h,mi]=t.time.split(':').map(Number);return zonedToUtc(t.tz||home(),y,m,d,h,mi)}
function taskDue(t){
  if(t.done){const l=dayLabel(dayOf(t.done));return {state:'done',label:'Done '+(/^(Today|Yesterday|Tomorrow)$/.test(l)?l.toLowerCase():l),ms:t.done}}
  if(!t.day) return {state:'none',label:'No deadline',ms:Infinity};
  if(t.time){const ms=taskInstant(t),late=ms<Date.now(),d=dayDiff(dayOf(ms));return {state:late?'overdue':d===0?'today':d<=7?'week':'later',label:(late?'Overdue, was ':'Due ')+whenLabel(ms),ms}}
  const d=dayDiff(t.day),ms=dayRange(t.day)[1];
  return {state:d<0?'overdue':d===0?'today':d<=7?'week':'later',label:d<0?`Overdue, ${-d} ${-d===1?'day':'days'}`:'Due '+dayLabel(t.day),ms};
}
const tasksOf=T=>(T.tasks=T.tasks||[]);
const tkCan=t=>{if(!t) return true;const my=me().id;return !t.by||t.by===my||(t.to||[]).includes(my)};
const tkName=(T,id)=>{const z=T.members.find(m=>m.id===id);return z?(z.isMe?'you':first(z.name)):(T.gone&&T.gone[id]?first(T.gone[id].name):'someone')};
const tkNames=(T,ids)=>{const n=ids.map(id=>tkName(T,id));return n.length?n.length>1?n.slice(0,-1).join(', ')+' and '+n[n.length-1]:n[0]:'nobody yet'};
const mtState=x=>{if(x.e<Date.now()) return 'overdue';const d=dayDiff(dayOf(x.s));return d===0?'today':d<=7?'week':'later'};
function addTask(title,to,day,time,note=''){const T=team(),t={id:uid(),title,note,to:[...to],by:me().id,day:day||null,time:(day&&time)||null,tz:home(),at:Date.now(),done:null,re:{},cm:[],files:[]};tasksOf(T).push(t);save();return t}
const taskById=id=>tasksOf(team()).find(x=>x.id===id);
const tasksOn=day=>tasksOf(team()).filter(t=>!t.done&&t.day===day);

/* ---------- @mentions ---------- */
const mentionsMe=text=>{const n=first(me().name).toLowerCase();return (String(text).match(/@([\p{L}]+)/gu)||[]).some(x=>{const w=x.slice(1).toLowerCase();return w===n||w==='you'})};
const mentionHtml=text=>esc(text).replace(/@([\p{L}]+)/gu,(all,n)=>{const z=team().members.find(q=>first(q.name).toLowerCase()===n.toLowerCase());return z?`<span class="men ${z.isMe?'me':''}">@${esc(first(z.name))}</span>`:all});

/* ---------- inbox: everything waiting on you ---------- */
function inbox(){
  const T=team(),m=me(),H=home(),now=Date.now(),my=m.id,rq=[],th=[],find=id=>findM(id,T);
  for(const x of m.events||[]){
    const from=x.req&&find(x.req),past=x.e<now;
    if(x.pend) rq.push({kind:'inv',ev:x,s:x.s,who:from||m,t:`${from?gname(from):'Someone'} invited you to ${x.title}`,sub:`${whenLabel(x.s)} to ${fmtT(x.e,H)}. ${past?'It passed without an answer.':'Waiting for your answer.'}`,id:x.id,act:true,missed:past});
    else if(!past){const wait=(x.who||[]).map(find).filter(z=>z&&!z.isMe&&(z.events||[]).some(q=>q.id===x.id&&q.pend));if(wait.length) rq.push({kind:'wait',ev:x,s:x.s,who:wait[0],t:`${x.title}: waiting for ${wait.map(z=>first(z.name)).join(', ')}`,sub:`${whenLabel(x.s)}. Not accepted yet.`,id:x.id})}
  }
  for(const t of T.tasks||[]) if(!t.done&&t.to.includes(my)&&t.by!==my){const d=taskDue(t),from=find(t.by);rq.push({kind:'task',s:d.ms===Infinity?now+365*DAY:d.ms,who:from||m,t:`${from?gname(from):'Someone'} assigned you: ${t.title}`,sub:`${d.label}.`,act:true,late:d.state==='overdue',task:t.id})}
  const evOf=key=>{for(const z of T.members){const e=(z.events||[]).find(x=>x.id===key);if(e) return {z,ev:e}}return null};
  for(const [key,mt] of Object.entries(S.meta||{})){
    const r=evOf(key);if(!r) continue;const {z,ev}=r,mineEv=(ev.who||[]).includes(my);
    if(ev.e>=now){
      if((mt.join||[]).includes(my)) rq.push({kind:'join',s:ev.s,who:z,t:`You asked to join ${ev.title||'a meeting'}`,sub:`${whenLabel(ev.s)}. No answer yet.`,id:ev.id});
      if(mt.post&&mineEv) rq.push({kind:'post',s:ev.s,who:m,t:`You asked to move ${ev.title||'a meeting'} ${mt.post}`,sub:`${whenLabel(ev.s)}. No answer yet.`,id:ev.id});
    }
    if(live(mt)&&mineEv) th.push({o:mt,s:ev.s,t:ev.title||'Meeting',id:ev.id,who:z});
  }
  for(const t of T.tasks||[]) if(live(t)&&(t.to.includes(my)||t.by===my)){const d=taskDue(t);th.push({o:t,s:d.ms===Infinity?t.at:d.ms,t:'Task: '+t.title,task:t.id,who:find(t.by)||m})}
  for(const n of th){
    const cm=n.o.cm||[],mine=q=>!q.byId||q.byId===my,lastMine=cm.map(mine).lastIndexOf(true);
    n.mention=cm.some((q,i)=>i>lastMine&&!mine(q)&&mentionsMe(q.text));
    n.reply=lastMine>=0&&cm.slice(lastMine+1).some(q=>!mine(q));
    n.last=cm.length?cm[cm.length-1]:null;n.who=n.last&&n.last.byId?(find(n.last.byId)||n.who):n.who;
    n.sub=n.last?`${n.last.byId===my?'You':first(n.who.name)}: ${n.last.text}`:'Reactions only';
    n.act=n.mention||n.reply;
  }
  rq.sort((a,b)=>(b.act?1:0)-(a.act?1:0)||a.s-b.s);
  th.sort((a,b)=>(b.act?1:0)-(a.act?1:0)||((b.last&&b.last.at)||0)-((a.last&&a.last.at)||0));
  return {rq,th,count:rq.filter(n=>n.act).length+th.filter(n=>n.act).length};
}

/* ---------- calendar links ---------- */
const isoZ=ms=>new Date(ms).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
function calLinks(title,s,e,people,loc){
  const emails=people.filter(m=>m.email&&!m.isMe).map(m=>m.email);
  const desc='Times:\n'+[...new Set([me(),...people])].map(m=>`${m.name}: ${fmtDate(s,m.tz)} ${fmtT(s,m.tz)} (${tzLabel(m.tz)})`).join('\n');
  return {
    google:`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${isoZ(s)}/${isoZ(e)}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(loc||'')}&add=${encodeURIComponent(emails.join(','))}`,
    outlook:`https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=${encodeURIComponent(title)}&startdt=${encodeURIComponent(new Date(s).toISOString())}&enddt=${encodeURIComponent(new Date(e).toISOString())}&body=${encodeURIComponent(desc)}&location=${encodeURIComponent(loc||'')}&to=${encodeURIComponent(emails.join(';'))}`,
    mail:`mailto:${encodeURIComponent(emails.join(','))}?subject=${encodeURIComponent(title+': does this time work?')}&body=${encodeURIComponent(`Hi all,\n\nCould we meet about ${title} for ${Math.round((e-s)/MIN)} minutes? Here is the time for each of us:\n\n`+[me(),...people.filter(m=>!m.isMe)].map(m=>`- ${m.isMe?'Me':m.name}: ${fmtDate(s,m.tz)} at ${fmtT(s,m.tz)} (${tzAbbr(s,m.tz)})`).join('\n')+`\n\nPlease reply if this does not work.`)}`
  };
}
function downloadIcs(title,s,e,people,loc){
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Noon//EN','BEGIN:VEVENT',`UID:${uid()}@noon`,`DTSTAMP:${isoZ(Date.now())}`,`DTSTART:${isoZ(s)}`,`DTEND:${isoZ(e)}`,`SUMMARY:${title.replace(/[,;\n]/g,' ')}`];
  if(loc) lines.push(`LOCATION:${loc.replace(/[,;\n]/g,' ')}`);
  for(const m of people) if(m.email) lines.push(`ATTENDEE;CN=${m.name.replace(/[,;:"]/g,'')}:mailto:${m.email}`);
  lines.push('END:VEVENT','END:VCALENDAR');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/calendar'}));
  a.download=title.replace(/\W+/g,'-').toLowerCase()+'.ics';document.body.appendChild(a);a.click();a.remove();
}

/* ---------- invite link ---------- */
function inviteUrl(){
  const T=team();if(T.cloud&&T.code) return location.href.split('#')[0]+'#join=c:'+T.code;
  const snap={n:T.name,m:T.members.map(m=>({n:m.name,e:m.email,z:m.tz,s:m.start,f:m.end,k:m.cal?1:0,q:sleepOf(m),b:[m.start2??null,m.end2??null],w:m.weekends?1:0,p:m.photo||''}))};
  const b=btoa(unescape(encodeURIComponent(JSON.stringify(snap)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return location.href.split('#')[0]+'#join='+b;
}
function readJoin(){
  const m=location.hash.match(/^#join=(.+)$/);if(!m)return null;
  if(/^c:[0-9a-f]{16}$/.test(m[1])) return {code:m[1].slice(2)};
  try{return JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g,'+').replace(/_/g,'/')))))}catch(e){return null}
}

/* ---------- the demo team: people across the world, meetings, invites, threads and tasks, all on today ---------- */
function buildDemo(){
  const P=(name,tz,o={})=>mk(name,tz,9,17,{email:name.toLowerCase().split(' ')[0]+'@example.com',...DEMO[name],...o});
  const d=DEMO['You'],m0=me(),I={...m0,id:uid(),events:[],threads:[],cal:true,photo:m0.photo||d.photo,start2:m0.start2??d.start2,end2:m0.end2??d.end2};
  const A=P('Amara Okafor','Africa/Lagos'),J=P('Jonas Weber','Europe/Berlin'),N=P('Noah Williams','Europe/London'),So=P('Sofia Rossi','Europe/Rome'),O=P('Olivia Chen','America/New_York'),
    Pr=P('Priya Nair','Asia/Kolkata'),Ai=P('Aisha Khan','Asia/Dubai'),Me=P('Mei Tanaka','Asia/Tokyo'),Li=P('Liam Murphy','Australia/Sydney'),D=P('Diego Alves','America/Sao_Paulo'),Sa=P('Sam Rivera','America/Los_Angeles',{status:'invited'});
  const t={id:uid(),name:'Demo crew',sample:true,demo:true,members:[I,A,J,N,So,O,Pr,Ai,Me,Li,D,Sa],tasks:[]};
  S.teams.push(t);S.active=t.id;S.meta=S.meta||{};UI.day=today();
  const [a]=dayRange(),my=I.id,cm=(z,text,ago,re)=>({id:uid(),by:z.isMe?'You':first(z.name),byId:z.id,text,at:Date.now()-ago*MIN,...(re?{re}:{})});
  const slot=(h,dur,who)=>{const c=ctx(),base=a+h*HR;for(let k=0;k<=20;k++) for(const sg of k?[1,-1]:[1]){const st=base+sg*k*15*MIN;if(st>=a&&who.every(z=>freeFor(z,st,st+dur*MIN,c))) return st}return base};
  const book=(title,h,dur,who,o={})=>{
    const st=slot(h,dur,who),id=uid(),ids=who.map(z=>z.id);
    for(const z of who) (z.events=z.events||[]).push({id,title,s:st,e:st+dur*MIN,who:ids,by:(o.req||who[0]).id,loc:o.loc||'',pend:(o.pend||[]).includes(z),...(o.req&&(o.pend||[]).includes(z)?{req:o.req.id}:{})});
    if(o.meta) S.meta[id]=o.meta;
  };
  const thread=(z,h,re,cms)=>{const [bs,be]=blockAt(z,a+h*HR,ctx());(z.threads=z.threads||[]).push({id:uid(),s:bs,e:be,re,cm:cms})};
  book('Sprint planning',10,60,[I,A,J,N,So],{loc:'https://meet.google.com/noon-sprint',pend:[N],meta:{re:{'👍':[A.id,J.id,my],'🎉':[So.id]},cm:[cm(A,'Can we start five minutes late? School run.',95,{'👍':[J.id,So.id]}),cm(J,'Fine by me. @Sofia can you bring the estimates?',90),cm(I,'Works. I will share the board before.',80,{'🙏':[A.id],'🎉':[J.id,N.id]})]}});
  book('Design review',14,45,[I,So,O],{pend:[O],meta:{re:{'👀':[O.id]},cm:[cm(So,'I will bring the new onboarding flow.',40)],post:'30 min later'}});
  book('1:1 with Priya',11.5,30,[I,Pr],{pend:[I],req:Pr,meta:{re:{},cm:[cm(Pr,'Want to go over the Q4 plan. Thirty minutes is enough.',120)]}});
  book('Roadmap sync',16,30,[I,J,Ai],{pend:[I],req:J,meta:{re:{'👍':[Ai.id]},cm:[]}});
  book('Client demo dry run',15,30,[I,D],{loc:'Zoom, link in the invite'});
  book('APAC handover',8.5,30,[Me,Li,Pr],{meta:{re:{'🙏':[Li.id,Pr.id]},cm:[cm(Me,'Notes are in the doc.',300),cm(Li,'Thanks, picking up the release checks.',290)],join:[my]}});
  thread(A,13,{'👀':[my],'👍':[J.id]},[cm(I,'Are you around for a quick pairing session in here?',60,{'👀':[A.id]}),cm(A,'Yes, any time after my standup.',52,{'👍':[my]}),cm(I,'Great, I will book twenty minutes.',50)]);
  thread(Li,16,{'😴':[my]},[cm(I,'Leaving this for when you are up: can you review the launch deck?',30)]);
  thread(I,17.5,{'👍':[N.id,O.id]},[cm(O,'Could we grab twenty minutes here? It is my morning.',25,{'👍':[N.id]}),cm(N,'I can join too.',20)]);
  {const id=uid(),st=a-DAY+15*HR;for(const z of [I,Ai]) (z.events=z.events||[]).push({id,title:'Budget review',s:st,e:st+30*MIN,who:[I.id,Ai.id],by:Ai.id,pend:z===I,...(z===I?{req:Ai.id}:{})})}
  const dayPlus=n=>shiftDay(today(),n),tk=(title,to,by,day,time,o={})=>({id:uid(),title,note:o.note||'',to:to.map(z=>z.id),by:by.id,day,time:time||null,tz:by.tz,at:Date.now()-(o.ago||120)*MIN,done:o.done||null,re:o.re||{},cm:o.cm||[],files:[]});
  t.tasks=[tk('Send the launch deck to Priya',[I],A,today(),'17:00',{ago:200,note:'The v3 file, with the pricing slide updated.',re:{'👀':[A.id],'🙏':[Pr.id]},cm:[cm(A,'Priya needs it before her Thursday review.',150),cm(I,'On it, the v3 goes out today.',60,{'👍':[A.id]}),cm(A,'@You can you confirm once it is sent?',20)]}),tk('Reply to the APAC handover notes',[I],Me,dayPlus(-1),null,{ago:1800}),tk('Book a room for the onboarding review',[So],I,dayPlus(1),null,{ago:60}),tk('Draft the Q4 roadmap outline',[I,J],I,dayPlus(3),null,{ago:30}),tk('Confirm the demo recording works',[D],I,null,null,{ago:15}),tk('Update the timezone list',[I],I,dayPlus(-2),null,{ago:3000,done:Date.now()-26*HR})];
  save();
}
function clearSample(){const T=team();T.members=T.members.filter(m=>m.isMe);T.sample=false;delete T.demo;T.tasks=[];T.projects=(T.projects||[]).filter(p=>!p.demo);S.meta={};save()}
