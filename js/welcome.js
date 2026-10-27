/* Noon · the first run after signing in: who you are and when you are online, then your team and the link that brings
   people into it. Someone who joined from an invite already has a team, so they only answer the first step. Finishing
   sets prefs.onboarded on the profile, so it shows once per account. */
const OB={plan:['you'],step:0};
const obPrefs=()=>((CLOUD.profile||{}).prefs)||{};
const needsOnboarding=()=>!S.teams.some(t=>t.cloud)||!obPrefs().onboarded;
function startOnboarding(){OB.plan=S.teams.some(t=>t.cloud)?['you']:['you','team','invite'];OB.step=0;setAuthState('onb');renderOnb()}
function renderOnb(){
  const el=$('#gateOnb'),u=user()||{name:'',email:''},k=OB.plan[OB.step],pf=CLOUD.profile||{};
  const dots=OB.plan.length>1?`<div class="ob-steps" aria-label="Step ${OB.step+1} of ${OB.plan.length}">${OB.plan.map((x,i)=>`<i${i<=OB.step?' class="on"':''}></i>`).join('')}</div>`:'';
  const foot=`<p class="gate-switch">Signed in as ${esc(u.email)} · <button type="button" data-ob-out>Log out</button></p>`;
  if(k==='you'){
    const T=S.teams.find(t=>t.cloud),nm=u.name;
    el.innerHTML=`${dots}<h1>${nm?`Hi ${esc(first(nm))}, where are you?`:'Where are you?'}</h1>
      <p class="gate-sub">${T?`You are in ${esc(T.name)}. Your`:'Your'} team sees your hours in their own time, so they know when to reach you.</p>
      <form id="fObYou" autocomplete="off">
        <label class="lbl">Your name <input name="name" required maxlength="60" autocomplete="name" value="${esc(nm)}"></label>
        <label class="lbl">Where you are <input name="tz" data-tzpick required placeholder="City, country, or a code like CET"></label>
        <div class="grid2"><label class="lbl">Online from <input name="start" type="time" required value="${hhmm(num(pf.start_h)??9)}"></label><label class="lbl">Until <input name="end" type="time" required value="${hhmm(num(pf.end_h)??17)}"></label></div>
        <label class="ck"><input type="checkbox" name="weekends" ${pf.weekends?'checked':''}><span></span>I work weekends</label>
        <p class="err" id="obErr" hidden></p>
        <button type="submit" class="btn dark full">Continue</button>
      </form>${foot}`;
    const here=Intl.DateTimeFormat().resolvedOptions().timeZone;setTz($('#fObYou').tz,pf.tz&&pf.tz!=='UTC'&&validTz(pf.tz)?pf.tz:here);
  }
  else if(k==='team') el.innerHTML=`${dots}<h1>Name your team</h1>
      <p class="gate-sub">The people you plan with. You can start more teams later from Settings.</p>
      <form id="fObTeam" autocomplete="off">
        <label class="lbl">Team name <input name="name" required maxlength="40" placeholder="Design, Platform, Friends…"></label>
        <p class="err" id="obErr" hidden></p>
        <button type="submit" class="btn dark full">Create team</button>
      </form>
      <p class="hint" style="margin:0">Joining a team someone else made? Open the invite link they sent you and you land straight in it.</p>${foot}`;
  else el.innerHTML=`${dots}<h1>Bring your team in</h1>
      <p class="gate-sub">Send this link to the people you work with. They sign in and take a seat in ${esc(team().name)}.</p>
      <div class="copyrow"><input readonly value="${esc(inviteUrl())}" aria-label="Invite link"><button type="button" class="btn dark" data-ob-copy>Copy</button></div>
      <button type="button" class="btn dark full" data-ob-done>Open Noon</button>
      <button type="button" class="btn ghost full" data-ob-done>I will do this later</button>${foot}`;
  if(innerWidth>860){const i=el.querySelector('form input:not([readonly])');if(i&&!i.value) setTimeout(()=>i.focus(),60)}
}
function obNext(){if(OB.step<OB.plan.length-1){OB.step++;renderOnb()}else obFinish()}
async function obFinish(){
  await saveProfile({prefs:{...obPrefs(),onboarded:true}});
  setAuthState('in');UI.day=today();setView(team().members.length>1?'calendar':'team',true);render();scrollToDay();
  toast(`Welcome to Noon, ${first(user().name)}.`);
}
$('#gateOnb').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,btn=f.querySelector('button[type=submit]');say('#obErr','');
  if(f.id==='fObYou'){
    const tz=f.tz.value.trim(),name=f.name.value.trim();
    if(!validTz(tz)){f.tz.setCustomValidity('We could not find that place. Try a city, a country, or a code like CET.');f.tz.reportValidity();return}
    const d={name,tz,start:toH(f.start.value),end:toH(f.end.value),weekends:f.weekends.checked};
    busyBtn(btn,true);const ok=await saveProfile({name,tz,start_h:d.start,end_h:d.end,weekends:d.weekends});busyBtn(btn,false);
    if(!ok){say('#obErr','That did not save. Check your connection and try again.');return}
    for(const z of myTeams()) Object.assign(z,d);if(S.teams.some(t=>t.cloud)) save();
    obNext();return}
  if(f.id==='fObTeam'){
    const name=f.name.value.trim();if(!name) return;
    busyBtn(btn,true);const id=await createCloudTeam(name);busyBtn(btn,false);
    if(!id){say('#obErr','The team could not be created. Try again in a moment.');return}
    S.teams=S.teams.filter(t=>t.cloud||hasWork(t));save();obNext();return}
});
$('#gateOnb').addEventListener('input',e=>{if(e.target.name==='tz') e.target.setCustomValidity('')});
$('#gateOnb').addEventListener('click',e=>{
  const c=s=>e.target.closest(s);
  if(c('[data-ob-copy]')){navigator.clipboard.writeText(inviteUrl()).then(()=>toast('Invite link copied'),()=>toast('Press Ctrl+C to copy'));return}
  if(c('[data-ob-done]')){obFinish();return}
  if(c('[data-ob-out]')){logout();return}
});
