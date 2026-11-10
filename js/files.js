/* Noon · files on tasks: look at them right here. Markdown reads as a document, a page opens in a locked-down frame that
   cannot reach the app, and images, PDFs and video show as themselves. The bytes live in the private task-files bucket. */

const FV={url:null,blob:null,task:null,file:null,token:0};
const fileKind=x=>{const e=(String(x.name).split('.').pop()||'').toLowerCase();return /^(md|markdown)$/.test(e)?'md':/^html?$/.test(e)?'html':/^(png|jpe?g|gif|webp|svg|avif)$/.test(e)?'img':e==='pdf'?'pdf':/^(mp4|webm|mov)$/.test(e)?'video':/^(txt|csv|json|log)$/.test(e)?'text':'other'};
const fileType=x=>{const e=(String(x.name).split('.').pop()||'').toLowerCase();return e==='pdf'?'application/pdf':e==='svg'?'image/svg+xml':e==='mov'?'video/quicktime':(typeof EXT!=='undefined'&&EXT[e])||x.type||'application/octet-stream'};

/* ---------- markdown: everything is escaped first, so a file can only ever make headings, lists, tables and links ---------- */
function mdInline(s){
  return esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/__(.+?)__/g,'<b>$1</b>')
    .replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g,'$1<i>$2</i>').replace(/(^|[^_\w])_(?!\s)(.+?)_(?!\w)/g,'$1<i>$2</i>').replace(/~~(.+?)~~/g,'<s>$1</s>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}
const MD_ITEM=/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/;
const MD_RULE=/^\s*([-*_])(\s*\1){2,}\s*$/;
function mdList(lines){
  const ordered=/^\s*\d/.test(lines[0]),base=lines[0].match(/^\s*/)[0].length,items=[];
  for(const l of lines){const ind=l.match(/^\s*/)[0].length,m=MD_ITEM.exec(l);if(m&&ind<=base+1) items.push({t:m[1],kids:[]});else if(items.length) items[items.length-1].kids.push(l)}
  const tag=ordered?'ol':'ul';
  return `<${tag}>${items.map(x=>`<li>${mdInline(x.t)}${!x.kids.length?'':x.kids.some(k=>MD_ITEM.test(k))?mdList(x.kids):`<br>${x.kids.map(k=>mdInline(k.trim())).join('<br>')}`}</li>`).join('')}</${tag}>`;
}
function mdHtml(src){
  const L=String(src==null?'':src).replace(/\r\n?/g,'\n').split('\n'),out=[];let i=0,m;
  const cells=l=>l.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(c=>c.trim());
  const isTable=k=>k+1<L.length&&L[k].includes('|')&&/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(L[k+1]);
  const starts=k=>/^(```|~~~|#{1,6}\s|>\s?)/.test(L[k])||MD_RULE.test(L[k])||MD_ITEM.test(L[k])||isTable(k);
  while(i<L.length){
    const l=L[i];
    if(!l.trim()){i++;continue}
    if(m=/^(```|~~~)/.exec(l)){const buf=[];i++;while(i<L.length&&!L[i].startsWith(m[1])) buf.push(L[i++]);i++;out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);continue}
    if(m=/^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(l)){out.push(`<h${m[1].length}>${mdInline(m[2])}</h${m[1].length}>`);i++;continue}
    if(MD_RULE.test(l)){out.push('<hr>');i++;continue}
    if(/^>\s?/.test(l)){const buf=[];while(i<L.length&&/^>\s?/.test(L[i])) buf.push(L[i++].replace(/^>\s?/,''));out.push(`<blockquote>${mdHtml(buf.join('\n'))}</blockquote>`);continue}
    if(isTable(i)){const head=cells(l);i+=2;const rows=[];while(i<L.length&&L[i].includes('|')&&L[i].trim()) rows.push(cells(L[i++]));out.push(`<div class="fv-tbl"><table><thead><tr>${head.map(c=>`<th>${mdInline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${mdInline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);continue}
    if(MD_ITEM.test(l)){const buf=[];while(i<L.length&&(MD_ITEM.test(L[i])||(L[i].trim()&&/^\s+/.test(L[i])))) buf.push(L[i++]);out.push(mdList(buf));continue}
    const buf=[L[i++]];while(i<L.length&&L[i].trim()&&!starts(i)) buf.push(L[i++]);out.push(`<p>${buf.map(mdInline).join('<br>')}</p>`);
  }
  return out.join('');
}

/* ---------- the preview ---------- */
async function openFile(t,i){
  const x=(t.files||[])[i];if(!x) return;
  const d=$('#dFile'),T=team(),kind=fileKind(x),z=x.by&&findM(x.by,T),token=++FV.token;
  fvRelease();FV.task=t;FV.file=x;
  d.innerHTML=`<div class="fv-head"><div class="fv-t"><b>${esc(x.name)}</b><small>${fmtSize(x.size||0)}${z?` · from ${esc(z.isMe?'you':first(z.name))}`:''}</small></div><div class="fv-acts" id="fvActs"></div><button type="button" class="xbtn" data-fv-x aria-label="Close">×</button></div><div class="fv-body" id="fvBody"><p class="fv-msg">Opening…</p></div>`;
  if(!d.open) d.showModal();
  let res=null;
  try{res=typeof sb!=='undefined'&&sb?await sb.storage.from('task-files').download(x.path):null}catch(e){res=null}
  if(token!==FV.token) return;
  const body=$('#fvBody');
  if(!res||res.error||!res.data){body.innerHTML=`<p class="fv-msg">${esc(x.name)} could not be opened. Check your connection and try again.</p>`;return}
  FV.blob=res.data;
  const pj=tkProject(t,T),next=pj?versOf(pj).reduce((n,v)=>Math.max(n,v.n),0)+1:0;
  $('#fvActs').innerHTML=`${kind==='html'&&pj?`<button type="button" class="btn sm" data-fv-version>Add as version ${next}</button>`:''}<button type="button" class="btn sm dark" data-fv-dl>Download</button>`;
  const typed=()=>{FV.url=URL.createObjectURL(new Blob([FV.blob],{type:fileType(x)}));return FV.url};
  if(kind==='md') body.innerHTML=`<article class="fv-doc">${mdHtml(await FV.blob.text())}</article>`;
  else if(kind==='text') body.innerHTML=`<pre class="fv-doc fv-pre">${esc(await FV.blob.text())}</pre>`;
  else if(kind==='html'){const f=document.createElement('iframe');f.className='fv-frame';f.title=x.name;f.setAttribute('sandbox','allow-scripts allow-forms');f.srcdoc=await FV.blob.text();body.innerHTML='';body.append(f)}
  else if(kind==='img') body.innerHTML=`<div class="fv-center"><img class="fv-img" src="${typed()}" alt="${esc(x.name)}"></div>`;
  else if(kind==='pdf') body.innerHTML=`<iframe class="fv-frame" title="${esc(x.name)}" src="${typed()}"></iframe>`;
  else if(kind==='video') body.innerHTML=`<div class="fv-center"><video class="fv-img" src="${typed()}" controls></video></div>`;
  else body.innerHTML=`<p class="fv-msg">This kind of file cannot be shown here. Download it to open it.</p>`;
}
function fvRelease(){if(FV.url) URL.revokeObjectURL(FV.url);FV.url=null;FV.blob=null}
$('#dFile').addEventListener('close',()=>{FV.token++;fvRelease();FV.task=null;FV.file=null;$('#dFile').innerHTML=''});
$('#dFile').addEventListener('click',async e=>{
  const c=s=>e.target.closest&&e.target.closest(s);
  if(e.target===e.currentTarget||c('[data-fv-x]')){e.currentTarget.close();return}
  if(c('[data-fv-dl]')&&FV.blob){dlBlob(FV.blob,FV.file.name);return}
  if(c('[data-fv-version]')&&FV.blob){
    const t=FV.task,file=new File([FV.blob],FV.file.name,{type:'text/html'});e.currentTarget.close();
    PV.proj=t.pj;PV.ver=null;PV.flows=false;PV.tab='versions';PV.tabFor=t.pj;UI.tkEdit=null;if(UI.view!=='projects') setView('projects',true);
    await handleFiles([{file,path:file.name}]);
  }
});
// drop a file on an open task
{const el=$('#tkDetail'),has=e=>e.dataTransfer&&[...e.dataTransfer.types].includes('Files');
  el.addEventListener('dragover',e=>{if(!has(e)||!UI.tkEdit) return;e.preventDefault();e.dataTransfer.dropEffect='copy';el.classList.add('drop')});
  el.addEventListener('dragleave',e=>{if(!el.contains(e.relatedTarget)) el.classList.remove('drop')});
  el.addEventListener('drop',e=>{if(!has(e)||!UI.tkEdit) return;e.preventDefault();el.classList.remove('drop');const t=taskById(UI.tkEdit);if(t&&tkCan(t)) tkUpload(t,[...e.dataTransfer.files])});
}
