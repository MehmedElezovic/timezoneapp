/* Noon redesign mockup · sign-in (#signin) and first-run setup (#welcome). Nothing is sent anywhere. */
const AU={mode:'login',step:1,name:'',team:'My team',tz:'Europe/Sarajevo'};
ROUTES.signin=R=>{const m=$('#main');m.dataset.view='signin';const L=AU.mode;
  const form=L==='forgot'?`<h1 class="disp">Reset your <span class="mk">password</span></h1><p class="au-sub">We email you a link to choose a new one.</p>
     <form class="au-form" data-form="forgot"><label class="fld"><span>Email</span><input type="email" autocomplete="email" placeholder="you@company.com"></label><button class="btn btn-ink au-go" type="submit">Send reset link</button></form>
     <p class="au-alt"><button data-act="auMode" data-m="login">Back to log in</button></p>`
   :L==='signup'?`<h1 class="disp">Start your <span class="mk">team</span></h1><p class="au-sub">Copy, design and ads reviews in one place.</p>
     <form class="au-form" data-form="signup"><label class="fld"><span>Name</span><input autocomplete="name" placeholder="Your name"></label><label class="fld"><span>Email</span><input type="email" autocomplete="email" placeholder="you@company.com"></label><label class="fld"><span>Password</span><input type="password" autocomplete="new-password" placeholder="At least 8 characters"></label><button class="btn btn-ink au-go" type="submit">Create account</button></form>
     <p class="au-alt">Already on Noon? <button data-act="auMode" data-m="login">Log in</button></p>`
   :`<h1 class="disp">Welcome <span class="mk">back</span></h1><p class="au-sub">Log in to see what needs you today.</p>
     <form class="au-form" data-form="login"><label class="fld"><span>Email</span><input type="email" autocomplete="email" placeholder="you@company.com"></label><label class="fld"><span>Password <button type="button" class="au-link" data-act="auMode" data-m="forgot">Forgot password?</button></span><input type="password" autocomplete="current-password" placeholder="Your password"></label><button class="btn btn-ink au-go" type="submit">Log in</button></form>
     <p class="au-alt">New here? <button data-act="auMode" data-m="signup">Create an account</button></p>`;
  m.innerHTML=`<div class="au"><div class="au-l"><div class="au-logo"><span class="logo">${sun}</span><b>Noon</b></div><div class="au-mid">${form}</div><p class="au-foot">Mockup: nothing you type here leaves this page.</p></div>
   <div class="au-r" aria-hidden="true"><div class="au-art">
     <div class="au-card a1"><div class="cm-top"><span class="pn">1</span>${av('milo')}<b>Milo</b><span class="t">16 min ago</span><span class="sp"></span><span class="tag hi">For you</span></div><p>Headline runs to three lines on tablet. Can "Here is why." drop to its own line?</p></div>
     <div class="au-card a2"><div class="au-pg">${stSvg('progress')}<b>Remake cost advertorial</b></div><div class="au-pg2"><span class="v">v3</span><span class="tag ink">Final</span><span class="v">v2</span><span class="tag hi">5 open</span><span class="sp"></span><span class="avs">${av('me')}${av('milo')}</span></div></div>
     <div class="au-card a3"><div class="slbl" style="margin:0 0 8px">Best time to meet</div><div class="tm-bt" style="font-size:22px"><span class="mk">15:00–17:00</span></div><div class="au-tz"><span>${av('me')}15:00</span><span>${av('milo')}14:00</span><span>${av('paul')}09:00</span></div></div>
     <p class="au-quote">Review copy, design and ads with your team and your clients, <span class="mk">in one place</span>.</p></div></div></div>`;
  $('.au-form').onsubmit=e=>{e.preventDefault();const f=e.target.dataset.form;
    if(f==='forgot'){AU.mode='login';render();toast('If that email has an account, a reset link is on its way');return}
    if(f==='signup'){AU.name=e.target.querySelector('input').value.trim();AU.step=1;go('#welcome');return}
    go('#projects');toast('Welcome back')};
  $('.au-form input')?.focus();
};
ROUTES.welcome=R=>{const m=$('#main');m.dataset.view='welcome';const s=AU.step;
  const dots=[1,2,3].map(i=>`<span class="au-dot ${i===s?'on':i<s?'done':''}">${i<s?ic('check',12):i}</span>`).join('<i></i>');
  const tz=TZS.find(t=>t[0]===AU.tz);
  const body=s===1?`<h1 class="disp">Hi${AU.name?', '+esc(AU.name.split(' ')[0]):''}. <span class="mk">Who</span> are you?</h1><p class="au-sub">Your team sees this next to your comments.</p>
     <label class="fld"><span>Your name</span><input id="wN" value="${esc(AU.name)}" placeholder="Your name"></label>
     <div class="fld"><span>Time zone</span><button class="selb" data-act="auTz">${ic('globe',15)}<span>${tz[1]}</span><span class="dash">UTC${tz[2]>=0?'+':'−'}${Math.abs(tz[2])}</span><span class="sp"></span>${ic('down',14)}</button></div>`
   :s===2?`<h1 class="disp">Name your <span class="mk">team</span></h1><p class="au-sub">Usually your agency or company name. You can change it later.</p>
     <label class="fld"><span>Team name</span><input id="wT" value="${esc(AU.team)}" placeholder="e.g. StrikeFunnels"></label>`
   :`<h1 class="disp">Bring your <span class="mk">people</span></h1><p class="au-sub">Send this link. They ask to join and you accept them from the Inbox.</p>
     <div class="linkbox"><input readonly value="noon.app/join/${esc((AU.team||'team').toLowerCase().replace(/[^a-z0-9]+/g,'-'))}-4k8w" aria-label="Invite link"><button class="btn btn-ink btn-sm" style="height:34px" data-act="tmCopyLink">Copy link</button></div>`;
  m.innerHTML=`<div class="wel"><div class="au-logo"><span class="logo">${sun}</span><b>Noon</b></div>
   <div class="wel-card"><div class="au-dots" aria-label="Step ${s} of 3">${dots}</div>${body}
    <div class="wel-f">${s>1?`<button class="btn btn-ghost" data-act="auStep" data-d="-1">Back</button>`:'<span></span>'}<span class="sp"></span>${s===2?`<button class="btn btn-ghost" data-act="auStep" data-d="1">Skip</button>`:''}<button class="btn btn-ink" data-act="${s===3?'auDone':'auStep'}" data-d="1">${s===3?'Go to Noon':'Continue'}${ic('open',15)}</button></div></div></div>`;
  const i=$('#wN')||$('#wT');if(i){i.focus();i.oninput=()=>{if(i.id==='wN')AU.name=i.value;else AU.team=i.value};i.onkeydown=e=>{if(e.key==='Enter')ACT.auStep({dataset:{d:1}})}}
};
Object.assign(ACT,{
  auMode:a=>{AU.mode=a.dataset.m;render()},
  auTz:a=>openMenu(a,()=>TZS.map(([id,city,o])=>({check:true,on:AU.tz===id,label:city,meta:`UTC${o>=0?'+':'−'}${Math.abs(o)}`,pick:()=>AU.tz=id}))),
  auStep:a=>{if(+a.dataset.d>0&&AU.step===1&&!AU.name.trim()){$('#wN')?.focus();return}AU.step=Math.min(3,Math.max(1,AU.step+(+a.dataset.d)));render()},
  auDone:()=>{AU.step=1;go('#projects');toast('Welcome to Noon')},
});
