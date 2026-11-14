/* Noon redesign mockup · Copy tab.
   List of versions → reader (select text to comment or suggest an edit; suggestions get Accept/Decline)
   → side-by-side compare with "See changes" → editor that saves the next version with accepted suggestions in. */
const CP={mode:'read',chg:false,cmpA:null,active:null,layer:'team',pend:null,draft:'',showRes:false,replyTo:null,rail:'comments',edHtml:null,edFor:null,counts:null};

/* ---------- data helpers ---------- */
function cvers(p){if(CV[p.id])return CV[p.id];
  return copyVers(p).map(v=>({...v,src:'Uploaded copy.docx',body:`<h1>${esc(p.head||p.name)}</h1><p>${esc(p.sub||'')}</p><p>${v.n>1?'Revised after the team review: a tighter intro, one claim per paragraph, and a source under each number.':'First draft, written from the research doc.'}</p><p><em>Only Remake cost advertorial has full sample copy in this mockup.</em></p>`}))}
function ccFor(p,n){const o=CC[p.id]||(CC[p.id]={});return o[n]||(o[n]=[])}
function syncCopy(p){const L=cvers(p).at(-1);p.copy.open=L?ccFor(p,L.n).filter(c=>c.open).length:0}
const plainOf=h=>{const d=document.createElement('div');d.innerHTML=h;return d.textContent||''};
const wc=t=>(t.match(/\S+/g)||[]).length;
const copyLabel=(c,layer)=>(layer==='client'?'C':'#')+c.n;
PAGES.forEach(p=>{if(CC[p.id])syncCopy(p)});

/* ---------- main area ---------- */
function copyMain(p,R,el){hideSelbar();
  if(R.sub==='edit'){el.innerHTML=copyEditorHtml(p);mountEditor(p);return}
  if(R.ver&&cvers(p).length){el.innerHTML=copyReaderHtml(p,R);mountReader(p,R);return}
  el.innerHTML=copyListHtml(p);
}
function copySoft(p,R){if(R.sub==='edit')return;drawDocs(p,R);const b=$('#cpBar');if(b)b.innerHTML=cpBarInner(p,R)}
function refreshCopy(){const R=route(),p=page(R.id);if(!p)return;drawDocs(p,R);renderRail(p,R)}

function copyListHtml(p){const vs=cvers(p);
  if(!vs.length)return `<div class="empty" style="flex:1"><h2 class="disp" style="font-size:28px;line-height:32px">No <span class="ul">copy${ulSvg}</span> yet</h2><p>Write the copy right here, or upload a .md, .docx or .txt file.</p><div style="display:flex;gap:8px"><a class="btn btn-ink" href="#page/${p.id}/copy/edit">${ic('type')}Write copy</a><button class="btn btn-line" data-act="upload">${ic('upload')}Upload a file</button></div></div>`;
  const last=vs.at(-1).n;
  const card=v=>{const fin=p.copy.final===v.n,open=ccFor(p,v.n).filter(c=>c.open).length;
    const d=document.createElement('div');d.innerHTML=v.body;const h=d.querySelector('h1')?.textContent||p.name;const ps=[...d.querySelectorAll('p')].filter(x=>!x.querySelector('em')||x.textContent.length>60).slice(0,2).map(x=>`<p>${esc(x.textContent)}</p>`).join('');
    return `<div class="vcard" data-act="cpOpen" data-n="${v.n}" tabindex="0" role="link" aria-label="Open copy v${v.n}"><div class="thumb"><div class="paper"><b>${esc(h)}</b>${ps}</div></div>
    <div class="vc-b"><div class="vc-h"><b>Copy</b><span class="v">v${v.n}</span>${fin?'<span class="tag ink">Final</span>':''}${v.n===last?'<span class="tag">Current</span>':''}<span class="sp"></span>${open?`<span class="tag ${needsMe(p)?'hi':''}">${open} open</span>`:''}</div>
    <div class="vc-m">${ago(v.at)} · ${P[v.by].short} · ${wc(plainOf(v.body))} words</div>
    <div class="vc-a"><button class="btn btn-line btn-sm" data-act="cpFinal" data-n="${v.n}">${fin?'Unmark final':'Mark final'}</button><button class="btn btn-ghost btn-sm" data-act="share" data-n="${v.n}" aria-haspopup="dialog">${ic('link',14)}Share</button><span class="sp"></span><button class="ib sm" data-act="cpMore" data-n="${v.n}" aria-label="More for copy v${v.n}" aria-haspopup="menu">${ic('more',16)}</button></div></div></div>`};
  return `<div class="sect"><div class="sect-h"><h2>Copy versions</h2><span class="num">${vs.length}</span><span class="sp"></span>${vs.length>1?`<button class="btn btn-ghost btn-sm" data-act="cpCmpLatest">${ic('compare',14)}Compare v${vs.at(-2).n} and v${last}</button>`:''}</div>
   <div class="vgrid">${vs.slice().reverse().map(card).join('')}<a class="vcard up" href="#page/${p.id}/copy/edit"><span class="ub">${ic('type',20)}</span><b>Write v${last+1}</b><span style="font-size:13px">Starts from v${last}, accepted suggestions already in</span></a></div></div>`;
}

/* ---------- reader ---------- */
function cpPickVersions(p,R){const vs=cvers(p),v=vs.find(x=>x.n===R.ver)||vs.at(-1);let a=null;
  if(CP.mode==='compare'&&vs.length>1){a=vs.find(x=>x.n===CP.cmpA&&x.n!==v.n)||vs.filter(x=>x.n<v.n).at(-1)||vs.find(x=>x.n!==v.n);CP.cmpA=a.n}
  return{vs,v,a,last:vs.at(-1).n}}
function cpBarInner(p,R){const{v,a,last}=cpPickVersions(p,R),fin=p.copy.final===v.n;
  return `<a class="ib" href="#page/${p.id}/copy" aria-label="All copy versions" title="All versions">${ic('back',18)}</a>
  <button class="verb" data-act="cpVerMenu" aria-haspopup="menu">Copy <span class="v" style="color:var(--ink)">v${v.n}</span>${ic('down',14)}</button>
  ${fin?'<span class="tag ink">Final</span>':''}${v.n===last?'<span class="tag">Current</span>':''}
  <span class="sp"></span>
  <div class="seg" role="group" aria-label="Mode"><button class="${CP.mode==='read'?'on':''}" data-act="cpMode" data-m="read" aria-pressed="${CP.mode==='read'}" title="Comment">${ic('comment',15)}<span class="ml2">Comment</span></button><button class="${CP.mode==='compare'?'on':''}" data-act="cpMode" data-m="compare" aria-pressed="${CP.mode==='compare'}" title="Compare">${ic('compare',15)}<span class="ml2">Compare</span></button></div>
  ${a?`<button class="btn btn-sm ${CP.chg?'btn-ink':'btn-line'}" data-act="cpChg" aria-pressed="${CP.chg}">${ic('activity',14)}See changes</button>`:''}
  <span class="sp"></span>
  <a class="btn btn-line btn-sm" href="#page/${p.id}/copy/edit" title="Edit as v${last+1}">${ic('type',14)}<span class="ml2">Edit as v${last+1}</span></a>
  <button class="btn btn-line btn-sm" data-act="cpFinal" data-n="${v.n}">${fin?'Unmark final':'Mark final'}</button>`}
function copyReaderHtml(p,R){const{v,a,last}=cpPickVersions(p,R);
  const head=(x,cur)=>`<div class="flabel">${cur?`<span class="v" style="color:var(--ink)">v${x.n}</span>${x.n===last?'<span class="tag">Current</span>':''}`:`<button class="verb sm" data-act="cpPickA" aria-haspopup="menu"><span class="v" style="color:var(--ink)">v${x.n}</span>${ic('down',12)}</button>`}<span>${ago(x.at)} · ${P[x.by].short}</span></div>`;
  return `<div class="vbar2" id="cpBar">${cpBarInner(p,R)}</div>
  ${a?`<div class="cstage cmp" id="cpStage">${CP.chg?`<div class="cp-legend" id="cpLegend"><span><del class="rd">removed</del></span><span><ins class="ri">added</ins></span><span class="num"></span><span class="dash">Words only, not formatting</span></div>`:''}<div class="ccol">${head(a,false)}<article class="paper doc" id="docA"></article></div><div class="ccol">${head(v,true)}<article class="paper doc" id="doc"></article></div></div>`
   :`<div class="cstage" id="cpStage"><article class="paper doc" id="doc" aria-label="Copy v${v.n}"></article></div>`}`}
function mountReader(p,R){drawDocs(p,R);const doc=$('#doc');if(!doc)return;
  doc.addEventListener('mouseup',()=>setTimeout(onDocSel,0));doc.addEventListener('keyup',e=>{if(e.shiftKey)onDocSel()});
  $('#cpStage')?.addEventListener('scroll',hideSelbar,{passive:true})}
function drawDocs(p,R,layer=CP.layer){const doc=$('#doc');if(!doc)return;const{v,a}=cpPickVersions(p,R);
  if(a&&$('#docA')){if(CP.chg){diffInto($('#docA'),doc,a.body,v.body);const n=$('#cpLegend .num');if(n)n.textContent=`${CP.counts.rem} words removed · ${CP.counts.add} added`;return}
    $('#docA').innerHTML=a.body}
  doc.innerHTML=v.body;anchorDoc(doc,p,v.n,layer)}
function wrapQuote(root,quote){if(!quote)return null;const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('.apn,.sg-ins,.sg-del,.anc')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  let n;while((n=tw.nextNode())){const i=n.data.indexOf(quote);if(i<0)continue;const r=document.createRange();r.setStart(n,i);r.setEnd(n,i+quote.length);const sp=document.createElement('span');r.surroundContents(sp);return sp}return null}
function anchorDoc(doc,p,n,layer){
  const L=ccFor(p,n).filter(c=>c.layer===layer&&c.quote&&(c.open||c.status==='accepted'||(CP.showRes&&c.kind==='comment')));
  for(const c of L){const sp=wrapQuote(doc,c.quote);if(!sp)continue;
    sp.className='anc'+(c.kind==='suggest'?' sg':'')+(c.status==='accepted'?' acc':'')+(!c.open&&c.kind==='comment'?' res':'')+(CP.active===c.n?' on':'');
    sp.dataset.n=c.n;sp.dataset.act='cpCm';
    if(c.kind==='suggest'){sp.innerHTML=c.status==='accepted'?`<ins class="sg-ins">${esc(c.to)}</ins>`:`<del class="sg-del">${esc(c.quote)}</del><ins class="sg-ins">${esc(c.to)}</ins>`}
    const sup=document.createElement('sup');sup.className='apn'+(CP.active===c.n?' on':'');sup.textContent=copyLabel(c,layer).replace('#','');sup.dataset.n=c.n;sup.dataset.act='cpCm';sp.after(sup)}
  if(CP.pend&&CP.pend.quote){const sp=wrapQuote(doc,CP.pend.quote);if(sp)sp.className='anc pend'}
}
/* side-by-side "See changes": block by block, words only */
function blocksOf(html){const d=document.createElement('div');d.innerHTML=html;const out=[];
  for(const el of d.children){if(el.tagName==='UL'||el.tagName==='OL')[...el.children].forEach((li,i)=>out.push({tag:'li',ord:el.tagName==='OL'?i+1:0,text:li.textContent}));else out.push({tag:el.tagName.toLowerCase(),text:el.textContent})}return out}
function wdiff(a,b){const A=a.split(/\s+/).filter(Boolean),B=b.split(/\s+/).filter(Boolean),n=A.length,m=B.length;
  const dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=A[i]===B[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const L=[],R=[];let i=0,j=0,rem=0,add=0;
  while(i<n&&j<m){if(A[i]===B[j]){L.push(esc(A[i]));R.push(esc(B[j]));i++;j++}else if(dp[i+1][j]>=dp[i][j+1]){L.push(`<del class="rd">${esc(A[i])}</del>`);rem++;i++}else{R.push(`<ins class="ri">${esc(B[j])}</ins>`);add++;j++}}
  while(i<n){L.push(`<del class="rd">${esc(A[i++])}</del>`);rem++}while(j<m){R.push(`<ins class="ri">${esc(B[j++])}</ins>`);add++}
  return[L.join(' ').replace(/<\/del> <del class="rd">/g,' '),R.join(' ').replace(/<\/ins> <ins class="ri">/g,' '),rem,add]}
const blk=(b,h)=>b.tag==='li'?`<p class="li"><span class="lim">${b.ord?b.ord+'.':'•'}</span>${h}</p>`:`<${b.tag}>${h}</${b.tag}>`;
function diffInto(elA,elB,ha,hb){const A=blocksOf(ha),B=blocksOf(hb),LA=[],LB=[];let rem=0,add=0;
  for(let i=0;i<Math.max(A.length,B.length);i++){const a=A[i],b=B[i];
    if(a&&b){const[x,y,r,d]=wdiff(a.text,b.text);rem+=r;add+=d;LA.push(blk(a,x));LB.push(blk(b,y))}
    else if(a){LA.push(blk(a,`<del class="rd">${esc(a.text)}</del>`));LB.push(blk(a,'&nbsp;'));rem+=wc(a.text)}
    else{LA.push(blk(b,'&nbsp;'));LB.push(blk(b,`<ins class="ri">${esc(b.text)}</ins>`));add+=wc(b.text)}}
  elA.innerHTML=LA.join('');elB.innerHTML=LB.join('');CP.counts={rem,add}}

/* selection → Comment / Suggest edit */
function hideSelbar(){$('#selbar')?.remove()}
function onDocSel(){const sel=getSelection(),doc=$('#doc');if(!doc||CP.chg||!sel.rangeCount||sel.isCollapsed){hideSelbar();return}
  const r=sel.getRangeAt(0);if(!doc.contains(r.commonAncestorContainer)){hideSelbar();return}
  const text=sel.toString().replace(/\s+/g,' ').trim();if(text.length<2){hideSelbar();return}
  CP.selText=text;const b=r.getBoundingClientRect();hideSelbar();
  const bar=document.createElement('div');bar.id='selbar';bar.className='selbar';bar.setAttribute('role','toolbar');
  bar.innerHTML=`<button data-act="cpSelComment">${ic('comment',14)}Comment</button>`+(route().name==='review'?'':`<span class="vd"></span><button data-act="cpSelSuggest">${ic('type',14)}Suggest edit</button>`);
  bar.addEventListener('mousedown',e=>e.preventDefault());$('#layer').appendChild(bar);
  const w=bar.offsetWidth;bar.style.left=Math.max(8,Math.min(innerWidth-w-8,b.left+b.width/2-w/2))+'px';bar.style.top=Math.max(8,b.top-46)+'px'}

/* ---------- rail ---------- */
function copyRail(p,R,el){
  if(R.sub==='edit'){el.innerHTML=`<div class="rail-scroll">${editorAside(p)}${detailsRail(p)}</div>`;return}
  if(CP.rail==='details'){el.innerHTML=`<div class="rail-top"><button class="btn btn-ghost btn-sm" data-act="cpRail" data-r="comments" style="margin-left:-6px">${ic('back',14)}Comments</button></div><div class="rail-scroll">${detailsRail(p)}</div>`;return}
  const{v}=cpPickVersions(p,R),all=ccFor(p,v.n),L=all.filter(c=>c.layer===CP.layer),open=L.filter(c=>c.open),closed=L.filter(c=>!c.open);
  const nT=all.filter(c=>c.layer==='team'&&c.open).length,nC=all.filter(c=>c.layer==='client'&&c.open).length;
  el.innerHTML=`<div class="rail-top"><div class="seg" style="flex:1;display:flex"><button style="flex:1" class="${CP.layer==='team'?'on':''}" data-act="cpLayer" data-l="team" aria-pressed="${CP.layer==='team'}">Team <span class="num">${nT}</span></button><button style="flex:1" class="${CP.layer==='client'?'on':''}" data-act="cpLayer" data-l="client" aria-pressed="${CP.layer==='client'}">Review link <span class="num">${nC}</span></button></div><button class="ib" data-act="cpRail" data-r="details" title="Page details" aria-label="Page details">${ic('panel',18)}</button></div>
  <div class="rail-scroll">
   ${CP.layer==='client'?'<div class="note">Only people on the review link see these comments, and they see your replies here.</div>':''}
   ${CP.mode==='compare'&&CP.chg?'<div class="note">Comments sit on the current version. Turn off See changes to see them in the text.</div>':''}
   ${open.length?`<div class="cmts">${open.map(c=>cpCard(c,v)).join('')}</div>`:`<div class="empty" style="padding:40px 8px"><h3 class="disp" style="font-size:22px;line-height:28px">All <span class="mk">clear</span></h3><p>Select text in the copy to comment or suggest an edit.</p></div>`}
   ${closed.length?`<button class="resb" data-act="cpShowRes" aria-expanded="${CP.showRes}">${CP.showRes?'Hide':'Show'} resolved and decided <span class="num">${closed.length}</span></button>${CP.showRes?`<div class="cmts" style="margin-top:8px">${closed.map(c=>cpCard(c,v)).join('')}</div>`:''}`:''}
  </div>${cpCompose()}`;
  const t=$('#cpText',el);if(t){t.oninput=()=>CP.draft=t.value;t.onkeydown=e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();ACT.cpPost()}}}
  const ri=$('#cpRepIn',el);if(ri){ri.focus();ri.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();ACT.cpSendReply()}}}
}
function cpCard(c,v){const who=c.by==='guest'?c.guest:P[c.by].short,last=cvers(page(route().id)).at(-1).n;
  const state=c.open?'':c.status==='accepted'?`<span class="tag ink">${ic('check',12)}Accepted</span>`:c.status==='declined'?'<span class="tag">Declined</span>':`<span style="color:var(--green)" title="Resolved">${ic('check',15)}</span>`;
  return `<div class="cm ${CP.active===c.n?'on':''} ${c.open?'':'res'}" data-act="cpCm" data-n="${c.n}" tabindex="0">
   <div class="cm-top"><span class="pn">${copyLabel(c,CP.layer).replace('#','')}</span>${c.by==='guest'?`<span class="av guest">${c.guest.split(' ').map(w=>w[0]).slice(-2).join('')}</span>`:av(c.by)}<b>${esc(who)}</b><span class="t">${c.at}</span><span class="sp"></span>${c.toMe&&c.open?'<span class="tag hi">For you</span>':''}${c.kind==='suggest'&&c.open?'<span class="tag">Suggestion</span>':''}${state}</div>
   ${c.kind==='suggest'?`<div class="sgx"><del class="sg-del">${esc(c.quote)}</del><span class="arr">${ic('open',13)}</span><ins class="sg-ins">${esc(c.to)}</ins></div>`:c.quote?`<blockquote class="q">${esc(c.quote)}</blockquote>`:''}
   ${c.text?`<p>${esc(c.text)}</p>`:''}
   ${c.status==='accepted'&&!c.done?`<div class="dash" style="font-size:12.5px">Goes into v${last+1} when someone edits the copy.</div>`:''}
   ${c.rep.map(r=>`<div class="rep">${r.by==='guest'?`<span class="av guest">G</span>`:av(r.by)}<div><div class="who">${r.by==='guest'?'Guest':P[r.by].short} · ${r.at}</div>${esc(r.text)}</div></div>`).join('')}
   ${CP.replyTo===c.n?`<div class="rinput"><input id="cpRepIn" placeholder="Reply…" aria-label="Reply"><button class="btn btn-ink btn-sm" data-act="cpSendReply">Send</button></div>`:''}
   <div class="cm-act"><button class="btn btn-ghost btn-sm" data-act="cpReply" data-n="${c.n}">${ic('reply',14)}Reply</button><span class="sp"></span>
   ${c.open?(c.kind==='suggest'?`<button class="btn btn-ghost btn-sm" data-act="cpDecline" data-n="${c.n}">Decline</button><button class="btn btn-line btn-sm" data-act="cpAccept" data-n="${c.n}">${ic('check',14)}Accept</button>`:`<button class="btn btn-line btn-sm" data-act="cpResolve" data-n="${c.n}">${ic('check',14)}Resolve</button>`):`<button class="btn btn-ghost btn-sm" data-act="cpReopen" data-n="${c.n}">Reopen</button>`}</div></div>`}
function cpCompose(){const pd=CP.pend;
  return `<div class="compose">
   ${pd?`<div class="pend"><span class="pn">+</span>${pd.kind==='suggest'?'Suggest an edit':'Comment on this text'}<span class="sp"></span><button class="ib sm" data-act="cpUnpend" aria-label="Cancel">${ic('x',14)}</button></div><blockquote class="q">${esc(pd.quote)}</blockquote>
     ${pd.kind==='suggest'?`<label class="fld"><span>Replace with</span><input id="cpTo" value="${esc(pd.to??pd.quote)}"></label>`:''}`:CP.mode==='read'?'<div class="pend">Select text in the copy to comment on it or suggest an edit.</div>':''}
   <textarea id="cpText" placeholder="${pd&&pd.kind==='suggest'?'Why? (optional)':CP.layer==='client'?'Write on the review link…':'Write a comment…'}" aria-label="Comment">${esc(CP.draft||'')}</textarea>
   <div class="row"><span class="pend"><kbd>Ctrl</kbd><kbd>↵</kbd></span><span class="sp"></span><button class="btn btn-ink btn-sm" data-act="cpPost">${pd&&pd.kind==='suggest'?'Suggest':'Post'}</button></div></div>`}

/* ---------- editor ---------- */
function applySug(p){const last=cvers(p).at(-1);if(!last)return{html:`<h1>${esc(p.name)}</h1><p><br></p>`,n:0,list:[]};
  let h=last.body;const list=ccFor(p,last.n).filter(c=>c.kind==='suggest'&&c.status==='accepted'&&!c.done);
  list.forEach(c=>{if(h.includes(c.quote))h=h.replace(c.quote,esc(c.to))});return{html:h,n:list.length,list}}
function editorAside(p){const{list}=applySug(p);const last=cvers(p).at(-1);
  return `<div class="ed-aside"><div class="slbl" style="margin-top:4px">In this draft<span class="sp"></span><span class="num" id="edWc">${wc(plainOf(CP.edHtml||''))} words</span></div>${list.length?list.map(c=>`<div class="sgx" style="margin-bottom:8px"><del class="sg-del">${esc(c.quote)}</del><span class="arr">${ic('open',13)}</span><ins class="sg-ins">${esc(c.to)}</ins></div>`).join('')+`<p class="hint">Accepted on v${last.n}, already applied.</p>`:`<p class="hint">${last?`Starts from v${last.n}. No accepted suggestions to apply.`:'A blank page. Start with the headline.'}</p>`}</div>`}
function copyEditorHtml(p){const last=cvers(p).at(-1),n=(last?.n||0)+1;
  const B=(cmd,icn,label,extra='')=>`<button data-act="cpCmd" data-cmd="${cmd}" title="${label}" aria-label="${label}" ${extra}>${icn}</button>`;
  const T=t=>`<span class="tb-t">${t}</span>`;
  return `<div class="vbar2" id="cpBar"><button class="ib" data-act="cpDiscard" aria-label="Discard draft" title="Discard draft">${ic('back',18)}</button>
   <span class="verb" style="cursor:default">Copy <span class="v" style="color:var(--ink)">v${n}</span></span><span class="tag hi draft-tag">Draft</span>
   <span class="sp"></span>
   <div class="etb" role="toolbar" aria-label="Formatting">${B('h1',T('H1'),'Heading 1')}${B('h2',T('H2'),'Heading 2')}${B('p',T('¶'),'Paragraph')}<span class="vd"></span>${B('bold','<b class="tb-t">B</b>','Bold')}${B('italic','<i class="tb-t" style="font-family:Georgia,serif">I</i>','Italic')}${B('underline','<u class="tb-t">U</u>','Underline')}${B('hl','<span class="tb-t tb-hl">H</span>','Highlight')}<span class="vd"></span>${B('ul',ic('filter',16),'Bulleted list')}${B('ol',T('1.'),'Numbered list')}${B('quote',T('“'),'Quote')}${B('link',ic('link',16),'Link')}${B('clear',T('Tx'),'Clear formatting')}</div>
   <span class="sp"></span>
   <button class="btn btn-ghost btn-sm" data-act="cpDiscard">Discard</button><button class="btn btn-ink btn-sm" data-act="cpSave">Save as v${n}</button></div>
   <div class="cstage" id="cpStage"><article class="paper doc edit" id="ed" contenteditable="true" spellcheck="true" aria-label="Copy editor"></article></div>`}
function mountEditor(p){const ed=$('#ed');if(CP.edFor!==p.id||CP.edHtml==null){CP.edHtml=applySug(p).html;CP.edFor=p.id}
  ed.innerHTML=CP.edHtml;const up=()=>{CP.edHtml=ed.innerHTML;const w=$('#edWc');if(w)w.textContent=wc(ed.textContent)+' words'};up();ed.addEventListener('input',up);
  $('.etb').addEventListener('mousedown',e=>e.preventDefault());
  ed.addEventListener('paste',e=>{const t=e.clipboardData?.getData('text/plain');if(t!=null){e.preventDefault();document.execCommand('insertText',false,t)}});
  if(!cvers(p).length){const h=ed.querySelector('h1');if(h){const r=document.createRange();r.selectNodeContents(h);const s=getSelection();s.removeAllRanges();s.addRange(r)}ed.focus()}}
function cleanCopy(html){const d=document.createElement('div');d.innerHTML=html;
  d.querySelectorAll('span[style*="background"]').forEach(s=>{const m=document.createElement('mark');m.innerHTML=s.innerHTML;s.replaceWith(m)});
  d.querySelectorAll('div').forEach(x=>{const q=document.createElement('p');q.innerHTML=x.innerHTML;x.replaceWith(q)});
  d.querySelectorAll('[style]').forEach(x=>x.removeAttribute('style'));d.querySelectorAll('b').forEach(b=>{const s=document.createElement('strong');s.innerHTML=b.innerHTML;b.replaceWith(s)});
  return d.innerHTML.replace(/<p><br><\/p>/g,'')}
function saveEditor(){const R=route(),p=page(R.id),ed=$('#ed');if(!p||!ed)return;const body=cleanCopy(ed.innerHTML);
  if(!plainOf(body).trim()){toast('Write something first');return}
  const before=JSON.stringify({cv:CV[p.id]||null,cc:CC[p.id]||null,copy:p.copy,at:p.at,by:p.by});
  const vs=cvers(p).slice(),last=vs.at(-1),n=(last?.n||0)+1;
  if(last)ccFor(p,last.n).forEach(c=>{if(c.kind==='suggest'&&c.status==='accepted'&&!c.done)c.done=n});
  vs.push({n,at:0,by:'me',src:'Edited in Noon',body});CV[p.id]=vs;p.copy.n=n;p.at=0;p.by='me';CP.edHtml=null;CP.edFor=null;syncCopy(p);
  go(`#page/${p.id}/copy/v${n}`);
  toast(`Saved copy v${n}`,()=>{const o=JSON.parse(before);if(o.cv)CV[p.id]=o.cv;else delete CV[p.id];if(o.cc)CC[p.id]=o.cc;p.copy=o.copy;p.at=o.at;p.by=o.by;go(`#page/${p.id}/copy`)})}

/* ---------- upload (.md / .txt / .html read for real; .docx converts in the real app) ---------- */
function mdToHtml(md){const lines=md.replace(/\r/g,'').split('\n'),out=[];let list=null;const inl=t=>esc(t).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
  const close=()=>{if(list){out.push(`</${list}>`);list=null}};
  for(const l of lines){let m;if(!l.trim()){close();continue}
    if((m=l.match(/^(#{1,3})\s+(.*)/))){close();const lv=Math.min(m[1].length,3);out.push(`<h${lv}>${inl(m[2])}</h${lv}>`)}
    else if((m=l.match(/^\s*[-*]\s+(.*)/))){if(list!=='ul'){close();out.push('<ul>');list='ul'}out.push(`<li>${inl(m[1])}</li>`)}
    else if((m=l.match(/^\s*\d+[.)]\s+(.*)/))){if(list!=='ol'){close();out.push('<ol>');list='ol'}out.push(`<li>${inl(m[1])}</li>`)}
    else if((m=l.match(/^>\s?(.*)/))){close();out.push(`<blockquote>${inl(m[1])}</blockquote>`)}
    else{close();out.push(`<p>${inl(l)}</p>`)}}close();return out.join('')}
function copyUpload(p){const inp=document.createElement('input');inp.type='file';inp.accept='.md,.markdown,.txt,.html,.htm,.docx';
  inp.onchange=async()=>{const f=inp.files[0];if(!f)return;let body;
    if(/\.docx$/i.test(f.name)){const last=cvers(p).at(-1);body=last?last.body:`<h1>${esc(p.name)}</h1>`;toast('Word files turn into formatted copy in the real app. Here the last version is reused.')}
    else{const t=await f.text();if(/\.html?$/i.test(f.name)){const d=new DOMParser().parseFromString(t,'text/html');body=cleanCopy(d.body.innerHTML)}else body=mdToHtml(t)}
    const vs=cvers(p).slice(),n=(vs.at(-1)?.n||0)+1;vs.push({n,at:0,by:'me',src:'Uploaded '+f.name,body});CV[p.id]=vs;p.copy.n=n;p.at=0;p.by='me';syncCopy(p);
    go(`#page/${p.id}/copy/v${n}`);if(!/\.docx$/i.test(f.name))toast(`${f.name} added as copy v${n}`)};
  inp.click()}

/* ---------- actions ---------- */
const cpFind=n=>{const R=route(),p=page(R.id),{v}=cpPickVersions(p,R);return{p,R,v,c:ccFor(p,v.n).find(x=>x.layer===CP.layer&&x.n===+n)}};
function cpSetDecision(a,e,fn,msg){e.stopPropagation();const{p,R,c}=cpFind(a.dataset.n);const before={open:c.open,status:c.status};fn(c);if(CP.active===c.n)CP.active=null;syncCopy(p);refreshCopy();
  toast(msg(c),()=>{c.open=before.open;c.status=before.status;syncCopy(p)})}
Object.assign(ACT,{
  cpOpen:a=>go(`#page/${route().id}/copy/v${a.dataset.n}`),
  cpFinal:(a,e)=>{e.stopPropagation();const p=page(route().id),n=+a.dataset.n,u=snap();p.copy.final=p.copy.final===n?0:n;p.at=0;p.by='me';render(true);toast(p.copy.final?`Copy v${n} marked final`:`Copy v${n} is no longer final`,u)},
  cpMore:(a,e)=>{e.stopPropagation();const p=page(route().id),n=+a.dataset.n,vs=cvers(p);openMenu(a,()=>[{label:'Download as Markdown',pre:ic('download',15),pick:()=>toast(`Downloading copy-v${n}.md`)},{label:'Download as Word',pre:ic('download',15),pick:()=>toast(`Downloading copy-v${n}.docx`)},...(vs.length>1?[{label:'Compare with…',pre:ic('compare',15),pick:()=>{CP.mode='compare';CP.cmpA=vs.find(v=>v.n!==n).n;go(`#page/${p.id}/copy/v${Math.max(n,CP.cmpA)}`)}}]:[]),{sep:1},{label:'Delete version',danger:true,pre:ic('trash',15),pick:()=>toast('Deleting versions is off in the mockup')}])},
  cpCmpLatest:()=>{const p=page(route().id),vs=cvers(p);CP.mode='compare';CP.cmpA=vs.at(-2).n;go(`#page/${p.id}/copy/v${vs.at(-1).n}`)},
  cpVerMenu:a=>{const R=route(),p=page(R.id),vs=cvers(p);openMenu(a,()=>[...vs.slice().reverse().map(v=>({check:true,on:v.n===R.ver,label:`Copy <span class="v" style="color:inherit">v${v.n}</span>`,meta:`${ago(v.at)} · ${P[v.by].short}`,pick:()=>go(`#page/${p.id}/copy/v${v.n}`)})),{sep:1},{label:`Write v${vs.at(-1).n+1}`,pre:ic('type',15),pick:()=>go(`#page/${p.id}/copy/edit`)},{label:'Upload a file',pre:ic('upload',15),pick:()=>copyUpload(p)}])},
  cpPickA:a=>{const R=route(),p=page(R.id),vs=cvers(p);openMenu(a,()=>vs.filter(v=>v.n!==R.ver).reverse().map(v=>({check:true,on:v.n===CP.cmpA,label:`Copy <span class="v" style="color:inherit">v${v.n}</span>`,meta:`${ago(v.at)} · ${P[v.by].short}`,pick:()=>{CP.cmpA=v.n;setTimeout(()=>renderPbMain(p,R))}})))},
  cpMode:a=>{const R=route(),p=page(R.id);if(a.dataset.m==='compare'&&cvers(p).length<2){toast('Compare needs two versions');return}CP.mode=a.dataset.m;CP.pend=null;if(CP.mode==='read')CP.chg=false;renderPbMain(p,R);renderRail(p,R)},
  cpChg:()=>{const R=route(),p=page(R.id);CP.chg=!CP.chg;renderPbMain(p,R);renderRail(p,R)},
  cpLayer:a=>{CP.layer=a.dataset.l;CP.active=null;CP.pend=null;refreshCopy()},
  cpRail:a=>{CP.rail=a.dataset.r;const R=route();renderRail(page(R.id),R)},
  cpCm:(a,e)=>{if(e.target.closest('input,textarea,button:not([data-act=cpCm])'))return;const n=+a.dataset.n;const fromDoc=!!a.closest('#doc');CP.active=CP.active===n&&!fromDoc?null:n;CP.rail='comments';refreshCopy();
    if(CP.active!=null){if(fromDoc)$('.cm.on')?.scrollIntoView({block:'nearest',behavior:'smooth'});else{const an=$(`#doc .anc[data-n="${n}"]`),st=$('#cpStage');if(an&&st){const r=an.getBoundingClientRect(),s=st.getBoundingClientRect();if(r.top<s.top+40||r.bottom>s.bottom-40)st.scrollTop+=r.top-s.top-140}}}},
  cpReply:(a,e)=>{e.stopPropagation();CP.replyTo=CP.replyTo===+a.dataset.n?null:+a.dataset.n;const R=route();renderRail(page(R.id),R)},
  cpSendReply:(a,e)=>{e?.stopPropagation();const t=($('#cpRepIn')?.value||'').trim();if(!t)return;const{p,R,c}=cpFind(CP.replyTo);c.rep.push({by:'me',at:'Just now',text:t});CP.replyTo=null;renderRail(p,R)},
  cpResolve:(a,e)=>cpSetDecision(a,e,c=>{c.open=false},c=>`Resolved ${copyLabel(c,CP.layer)}`),
  cpReopen:(a,e)=>cpSetDecision(a,e,c=>{c.open=true;c.status=undefined},c=>`Reopened ${copyLabel(c,CP.layer)}`),
  cpAccept:(a,e)=>cpSetDecision(a,e,c=>{c.open=false;c.status='accepted'},()=>`Accepted. It goes into the next version.`),
  cpDecline:(a,e)=>cpSetDecision(a,e,c=>{c.open=false;c.status='declined'},()=>'Suggestion declined'),
  cpShowRes:()=>{CP.showRes=!CP.showRes;refreshCopy()},
  cpUnpend:()=>{CP.pend=null;refreshCopy()},
  cpSelComment:()=>{CP.pend={kind:'comment',quote:CP.selText};CP.rail='comments';hideSelbar();getSelection().removeAllRanges();refreshCopy();$('#cpText')?.focus()},
  cpSelSuggest:()=>{CP.pend={kind:'suggest',quote:CP.selText};CP.rail='comments';hideSelbar();getSelection().removeAllRanges();refreshCopy();const i=$('#cpTo');if(i){i.focus();i.select()}},
  cpPost:()=>{const R=route(),p=page(R.id),{v}=cpPickVersions(p,R),t=($('#cpText')?.value||'').trim(),pd=CP.pend;
    const to=pd&&pd.kind==='suggest'?($('#cpTo')?.value||'').trim():null;
    if(pd&&pd.kind==='suggest'){if(!to||to===pd.quote){$('#cpTo')?.focus();toast('Change the text to suggest an edit');return}}else if(!t){$('#cpText')?.focus();return}
    const list=ccFor(p,v.n),n=Math.max(0,...list.filter(c=>c.layer===CP.layer).map(c=>c.n))+1;
    const c={n,layer:CP.layer,kind:pd?pd.kind:'comment',by:'me',at:'Just now',quote:pd?pd.quote:'',to:to||undefined,open:true,text:t,rep:[]};
    list.push(c);CP.pend=null;CP.draft='';CP.active=n;syncCopy(p);p.at=0;p.by='me';refreshCopy();
    toast(`${c.kind==='suggest'?'Suggestion':'Comment'} ${copyLabel(c,CP.layer)} posted`,()=>{list.splice(list.indexOf(c),1);syncCopy(p)})},
  cpCmd:a=>{const ed=$('#ed');if(!ed)return;ed.focus();const c=a.dataset.cmd;
    const map={h1:['formatBlock','H1'],h2:['formatBlock','H2'],p:['formatBlock','P'],quote:['formatBlock','BLOCKQUOTE'],bold:['bold'],italic:['italic'],underline:['underline'],ul:['insertUnorderedList'],ol:['insertOrderedList'],clear:['removeFormat']};
    if(c==='hl'){document.execCommand('styleWithCSS',false,true);document.execCommand('hiliteColor',false,'#c6f23e');document.execCommand('styleWithCSS',false,false)}
    else if(c==='link'){const sel=getSelection();if(!sel.rangeCount||sel.isCollapsed){toast('Select the words to link first');return}const range=sel.getRangeAt(0).cloneRange();
      openMenu(a,null,{html:()=>`<div class="pop"><h3>${ic('link',16)}Add a link</h3><div class="linkbox"><input id="lnk" placeholder="https://" style="font-family:var(--sans);font-size:13px;color:var(--ink)"><button class="btn btn-ink btn-sm" style="height:34px" id="lnkOk">Add</button></div></div>`});
      const i=$('#lnk');i.focus();const ok=()=>{const u=i.value.trim();closeMenu();if(!u)return;const s=getSelection();s.removeAllRanges();s.addRange(range);document.execCommand('createLink',false,/^https?:/.test(u)?u:'https://'+u)};$('#lnkOk').onclick=ok;i.onkeydown=e=>{if(e.key==='Enter')ok()};return}
    else{const[cmd,arg]=map[c];document.execCommand(cmd,false,arg)}
    CP.edHtml=ed.innerHTML},
  cpSave:saveEditor,
  cpDiscard:()=>{const p=page(route().id);const dirty=CP.edHtml!=null&&CP.edHtml!==applySug(p).html;CP.edHtml=null;CP.edFor=null;go(`#page/${p.id}/copy`);if(dirty)toast('Draft discarded')},
});
KEYS.push((e,typing)=>{const R=route();if(R.name!=='page'||R.tab!=='copy'||MENU||PAL||$('#dlg'))return;
  if(R.sub==='edit'&&(e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveEditor();return true}
  if(e.key==='Escape'){if($('#selbar')){hideSelbar();return true}if(CP.pend){CP.pend=null;refreshCopy();return true}if(CP.active!=null&&!typing){CP.active=null;refreshCopy();return true}}});
ONHASH.push(R=>{hideSelbar();if(!(R.name==='page'&&R.tab==='copy')){CP.pend=null;CP.active=null;CP.replyTo=null}
  if(!(R.name==='page'&&R.tab==='copy'&&R.ver)){CP.mode='read';CP.chg=false;CP.cmpA=null}});
