/* Noon redesign mockup · Team: everyone's day laid on your clock, grouped by time zone, with the best time to meet. */
I.moon='<path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5z"/>';
const TM={dur:30};
const ME_OFF=HOURS.me.off;
const pad=n=>String(n).padStart(2,'0');
function fmtH(h,m=0){h=((h%24)+24)%24;if(PREFS.h24)return `${pad(h)}:${pad(m)}`;const s=h<12?'am':'pm',x=h%12||12;return m?`${x}:${pad(m)}${s}`:`${x}${s}`}
const localH=(myH,id)=>((myH-ME_OFF+HOURS[id].off)%24+24)%24;
function stateAt(id,myH){const L=localH(myH,id),H=HOURS[id],[s0,s1]=H.sleep;
  if(L>=H.on[0]&&L<H.on[1])return'on';if(s0>s1?(L>=s0||L<s1):(L>=s0&&L<s1))return'sleep';return'free'}
function segsOf(id){const out=[];for(let h=0;h<24;h++){const s=stateAt(id,h);const last=out.at(-1);if(last&&last.s===s)last.e=h+1;else out.push({s,b:h,e:h+1})}return out}
function bestWindow(){const ids=Object.keys(HOURS),hrs=[];for(let h=0;h<24;h++)if(ids.every(id=>stateAt(id,h)==='on'))hrs.push(h);if(!hrs.length)return null;
  let best=[hrs[0],hrs[0]+1],cur=[hrs[0],hrs[0]+1];for(let i=1;i<hrs.length;i++){if(hrs[i]===cur[1])cur[1]++;else cur=[hrs[i],hrs[i]+1];if(cur[1]-cur[0]>best[1]-best[0])best=cur.slice()}return best}
function nowMine(){const t=new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:HOURS.me.tz}).split(':');return(+t[0]%24)+(+t[1])/60}
const pct=h=>(h/24*100).toFixed(3)+'%';

ROUTES.team=R=>{const m=$('#main');m.dataset.view='team';
  const ids=Object.keys(HOURS),groups=[...new Set(ids.map(id=>HOURS[id].off))].sort((a,b)=>a===ME_OFF?-1:b===ME_OFF?1:b-a);
  const bw=bestWindow(),now=nowMine(),wd=new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric',timeZone:HOURS.me.tz});
  const slotEnd=bw?bw[0]*60+TM.dur:0,fits=bw&&slotEnd<=bw[1]*60;
  const local=(id,h)=>fmtH(Math.floor(localH(h,id)),0);
  const utc=o=>`UTC${o>=0?'+':'−'}${Math.abs(o)}`;
  const row=id=>{const u=P[id],H=HOURS[id],lt=new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:!PREFS.h24,timeZone:H.tz}),wk=new Date().toLocaleDateString('en-US',{weekday:'short',timeZone:H.tz});
    const segs=segsOf(id).map(s=>s.s==='free'?'':`<span class="tm-s ${s.s}" style="left:${pct(s.b)};width:${pct(s.e-s.b)}">${s.s==='sleep'&&s.e-s.b>=3?ic('moon',13):''}${s.s==='on'&&s.e-s.b>=3?`<span>${fmtH(localH(s.b,id))}–${fmtH(localH(s.e,id))}</span>`:''}</span>`).join('');
    const strip=H.off!==ME_OFF?`<div class="tm-strip">${Array.from({length:8},(_,i)=>{const h=i*3,L=localH(h,id);return `<span style="left:${pct(h)}">${fmtH(L)}</span>`}).join('')}</div>`:'';
    return `<div class="tm-row"><div class="tm-who">${av(id,'lg')}<div><b><span class="nm">${esc(u.name)}</span>${id==='me'?'<span class="tag">You</span>':''}</b><span>${esc(u.city)} · ${fmtH(H.on[0])}–${fmtH(H.on[1])}</span></div><span class="tm-now">${lt}<small>${wk}, local</small></span></div>
      <div class="tm-trk" data-id="${id}">${segs}${strip}</div></div>`};
  m.innerHTML=`<div class="top"><div class="crumbs">${ic('globe',18)}<span class="cur" style="padding:0 4px">Team</span><span class="dash" style="font-weight:400">· ${wd}</span></div><span class="sp"></span>
    <div class="seg" role="group" aria-label="Time format"><button class="${PREFS.h24?'on':''}" data-act="tmFmt" data-v="24">24h</button><button class="${PREFS.h24?'':'on'}" data-act="tmFmt" data-v="12">12h</button></div>
    <button class="btn btn-line" data-act="tmInvite">${ic('plus')}Invite people</button></div>
  <div class="tm-scroll">
   <div class="tm-best">
    <div><div class="slbl" style="margin-top:0">Best time to meet today</div>
     ${bw?`<div class="tm-bt"><span class="mk">${fmtH(bw[0])}–${fmtH(bw[1])}</span><span class="dash">your time</span></div>
     <p class="dash">Everyone is online for ${bw[1]-bw[0]} h. ${ids.filter(i=>i!=='me').map(i=>`${P[i].short} ${fmtH(localH(bw[0],i))}–${fmtH(localH(bw[1],i))}`).join(' · ')}</p>`:'<p>No hour today where everyone is online.</p>'}</div>
    <span class="sp"></span>
    <div class="tm-dur"><div class="slbl" style="margin-top:0">Meeting length</div><div class="seg">${[30,45,60,90].map(d=>`<button class="${TM.dur===d?'on':''}" data-act="tmDur" data-d="${d}" aria-pressed="${TM.dur===d}">${d} min</button>`).join('')}</div>
     <p>${fits?`Earliest slot <b>${fmtH(bw[0])}–${fmtH(Math.floor(slotEnd/60),slotEnd%60)}</b> <button class="btn btn-ghost btn-sm" data-act="tmCopy" data-h="${bw[0]}">${ic('link',13)}Copy times</button>`:'<span class="dash">No slot this long fits everyone today.</span>'}</p></div>
   </div>
   <div class="tm-body" id="tmBody">
    <div class="tm-under" aria-hidden="true">${bw?`<span class="tm-band" style="left:${pct(bw[0])};width:${pct(bw[1]-bw[0])}"></span>`:''}</div>
    <div class="tm-row tm-ruler"><div class="tm-who"><b>Your day</b><span class="dash">${esc(P.me.city)} · ${utc(ME_OFF)}</span></div><div class="tm-trk ruler">${Array.from({length:24},(_,h)=>`<span style="left:${pct(h)}" class="${h%3?'tick':''}">${h%3?'':fmtH(h)}</span>`).join('')}</div></div>
    ${groups.map(o=>{const g=ids.filter(id=>HOURS[id].off===o);return `<div class="tm-gh"><span>${utc(o)}</span>${o===ME_OFF?'<span class="dash">same as you</span>':`<span class="dash">${o>ME_OFF?'+':'−'}${Math.abs(o-ME_OFF)} h from you</span>`}</div>${g.map(row).join('')}`}).join('')}
    <div class="tm-ov" aria-hidden="true"><span class="tm-nowl" style="left:${pct(now)}"><b>${fmtH(Math.floor(now),Math.floor((now%1)*60))}</b></span><span class="tm-guide" id="tmGuide"></span></div>
    <div class="tm-read" id="tmRead" role="status"></div>
   </div>
   <div class="tm-legend"><span><i class="lgd on"></i>Online</span><span><i class="lgd free"></i>Awake, offline</span><span><i class="lgd sleep"></i>Asleep</span><span><i class="lgd best"></i>Everyone online</span><span class="sp"></span><span class="dash">Hover the day to read everyone's time. Click to copy it.</span></div>
   ${INBOX.some(i=>i.kind==='request'&&!i.answer)?`<div class="tm-req">${ic('user',15)}<span><b>Sara Kim</b> asked to join My team</span><span class="sp"></span><button class="btn btn-ghost btn-sm" data-act="tmReq" data-a="declined">Decline</button><button class="btn btn-ink btn-sm" data-act="tmReq" data-a="accepted">Accept</button></div>`:''}
  </div>`;
  const body=$('#tmBody'),ov=$('.tm-ov',body),guide=$('#tmGuide'),read=$('#tmRead');
  const at=e=>{const r=ov.getBoundingClientRect();const x=e.clientX-r.left;if(x<0||x>r.width||e.clientY<r.top)return null;return Math.round(x/r.width*24*4)/4};
  const txt=h=>Object.keys(HOURS).map(id=>{const L=localH(h,id),hh=Math.floor(L),mm=Math.round((L-hh)*60);return `${fmtH(hh,mm)} ${id==='me'?'you':P[id].short}`});
  body.onmousemove=e=>{const h=at(e);if(h==null||h>=24){guide.style.display=read.style.display='none';return}const r=ov.getBoundingClientRect(),br=body.getBoundingClientRect();
    guide.style.display='block';guide.style.left=pct(h);read.style.display='flex';read.innerHTML=txt(h).map(t=>`<span>${t.replace(/ (\S+)$/,' <b>$1</b>')}</span>`).join('');
    const x=r.left-br.left+h/24*r.width;read.style.left=Math.min(br.width-read.offsetWidth-8,Math.max(r.left-br.left,x+12))+'px'};
  body.onmouseleave=()=>{guide.style.display=read.style.display='none'};
  body.onclick=e=>{const h=at(e);if(h==null||h>=24)return;const t=txt(h).join(' · ');navigator.clipboard?.writeText(t).catch(()=>{});toast('Copied: '+t)};
};
Object.assign(ACT,{
  tmDur:a=>{TM.dur=+a.dataset.d;render(true)},
  tmFmt:a=>{PREFS.h24=a.dataset.v==='24';render(true)},
  tmCopy:(a,e)=>{e.stopPropagation();const h=+a.dataset.h,end=h*60+TM.dur;const t=Object.keys(HOURS).map(id=>`${id==='me'?'You':P[id].short} ${fmtH(localH(h,id))}–${fmtH(Math.floor(localH(h,id)+TM.dur/60),end%60)}`).join(' · ');navigator.clipboard?.writeText(t).catch(()=>{});toast('Copied: '+t)},
  tmInvite:()=>openDlg(`<div class="dlg-h"><b>Invite people</b><button class="ib" data-act="dlgClose" aria-label="Close">${ic('x',18)}</button></div>
   <div class="dlg-b"><p class="hint" style="margin:0">Send this link. People who open it ask to join, and you accept them from the Inbox.</p>
   <div class="linkbox"><input readonly value="noon.app/join/my-team-4k8w" aria-label="Invite link"><button class="btn btn-ink btn-sm" style="height:34px" data-act="tmCopyLink">Copy link</button></div></div><div class="dlg-f"></div>`),
  tmCopyLink:()=>{closeDlg();toast('Invite link copied')},
  tmReq:a=>{const i=INBOX.find(x=>x.kind==='request');i.answer=a.dataset.a;i.unread=false;render(true);toast(i.answer==='accepted'?'Sara Kim joins My team':'Declined Sara Kim',()=>{delete i.answer})},
});
