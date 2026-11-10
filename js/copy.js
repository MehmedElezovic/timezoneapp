/* Noon · copy. A page's copy is a stack of versions like its design: write one here, or upload a Markdown, Word, text
   or HTML file, and it becomes the next version. A version keeps clean HTML with only the formats Noon allows (headings,
   bold, italic, underline, highlight, links, lists, quotes and lines between sections), so the Markdown that comes out of
   it is always valid. Comments sit on words: select some text to comment on it or to suggest other wording; the team
   accepts or declines a suggestion, and accepted wording goes into the next version. A saved version never changes, so
   a comment keeps its place by character position. */

/* ---------- icons and the libraries loaded on first use ---------- */
const CPI={
  mark:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4.5l5 5L11 18H6v-5z"/><path d="M4 21h16"/></svg>',
  link:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>',
  ul:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9.5 6h11M9.5 12h11M9.5 18h11"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none"/></svg>',
  ol:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 6h10.5M10 12h10.5M10 18h10.5"/><path d="M4 5l1.5-1v5M3.5 14.5a1.5 1.5 0 0 1 3 .3c0 1-3 2.2-3 3.7h3" stroke-width="1.6"/></svg>',
  quote:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h5v5c0 3-2 5-4.5 5.5M14 7h5v5c0 3-2 5-4.5 5.5"/></svg>',
  hr:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3.5 12h17"/><path d="M8 6.5h8M8 17.5h8" opacity=".45"/></svg>',
  clear:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5h12M12 5l-3.5 14M14.5 14l5 5M19.5 14l-5 5"/></svg>',
  md:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M6 15V9l2.5 3L11 9v6M16.5 9v6M14.5 13l2 2 2-2"/></svg>',
  copy:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/></svg>',
};
const LIBS={
  quill:['https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js','https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.core.css'],
  marked:['https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js'],
  mammoth:['https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js'],
};
const libP={};
function lib(name){return libP[name]||(libP[name]=new Promise((res,rej)=>{const [js,css]=LIBS[name];
  if(css){const l=document.createElement('link');l.rel='stylesheet';l.href=css;document.head.appendChild(l)}
  const s=document.createElement('script');s.src=js;s.onload=()=>res();s.onerror=()=>{delete libP[name];rej(new Error(`${name} did not load`))};document.head.appendChild(s)}))}

/* ---------- state ---------- */
const CP={page:null,open:null,edit:null,quill:null,q0:'',draft:null,sel:null,filter:'open',layer:'team',reply:null,replyText:'',pop:null,menu:null,link:false,linkAt:null,scroll:{},dt:0,qReady:false};
const copyOf=p=>(p.copy=p.copy||[]);
const cpById=(p,id)=>copyOf(p).find(v=>v.id===id)||null;
const cpCur=p=>{const L=copyOf(p);return L[L.length-1]||null};
const cpShown=p=>(CP.open&&cpById(p,CP.open))||cpCur(p);
// what the Copy tab shows: the list of versions, one version open, or a version being written
function cpMode(p){cpReset(p);return CP.edit?'edit':CP.open&&cpById(p,CP.open)?'read':'list'}
const cpLayerOf=c=>c.layer==='client'?'client':'team';
// open means still waiting on someone: an open comment or suggestion, or accepted wording not in a newer version yet
const cpOpen=c=>c.status==='open'||(c.status==='accepted'&&!c.done);
const cpOpenCount=p=>copyOf(p).reduce((n,v)=>n+v.cm.filter(cpOpen).length,0);
const pageOpen=p=>projOpen(p)+cpOpenCount(p);
const cpLabel=v=>'Copy v'+v.n;
const cpSrc=v=>!v.src||v.src==='written'?'Written in Noon':`From ${v.src}`;
const clip=(s,n)=>{s=String(s||'');return s.length>n?s.slice(0,n-1).trimEnd()+'…':s};
const draftKey=p=>'noon.copydraft.'+p.id;
function draftGet(p){try{const d=JSON.parse(localStorage.getItem(draftKey(p)));return d&&typeof d.html==='string'?d:null}catch(e){return null}}
function draftSet(p,d){try{localStorage.setItem(draftKey(p),JSON.stringify(d))}catch(e){}}
function draftDel(p){try{localStorage.removeItem(draftKey(p))}catch(e){}}
function upgradeCopy(){for(const T of S.teams) for(const p of projectsOf(T)) for(const v of copyOf(p)){v.cm=v.cm||[];for(const c of v.cm) c.re=c.re||[]}}

/* ---------- clean copy: whatever comes in (an editor, a paste from Google Docs or Notion, a Word or Markdown file)
   leaves as paragraphs, three heading sizes, lists, quotes and lines, with bold, italic, underline, highlight and
   links inside them. Nothing else survives, scripts and styles included. ---------- */
const CP_BLOCK=new Set('P DIV H1 H2 H3 H4 H5 H6 UL OL LI BLOCKQUOTE TABLE THEAD TBODY TFOOT TR TD TH CAPTION HR PRE SECTION ARTICLE HEADER FOOTER MAIN ASIDE NAV FIGURE FIGCAPTION DL DT DD ADDRESS CENTER FORM FIELDSET DETAILS SUMMARY'.split(' '));
const CP_DROP=new Set('SCRIPT STYLE TEMPLATE NOSCRIPT IFRAME OBJECT EMBED SVG MATH HEAD TITLE META LINK BUTTON SELECT INPUT TEXTAREA IMG VIDEO AUDIO CANVAS PICTURE SOURCE'.split(' '));
const CP_PLAIN_BG=/^(transparent|initial|inherit|unset|none|white|#fff|#ffffff|rgb\(255,255,255\)|rgba\(255,255,255,1\)|rgba\(\d+,\d+,\d+,0(\.0+)?\))$/i;
function cpMarks(el,m){
  const t=el.tagName,st=el.style;m={...m};
  if(t==='B'||t==='STRONG') m.b=true;
  if(t==='I'||t==='EM'||t==='CITE'||t==='DFN') m.i=true;
  if(t==='U'||t==='INS') m.u=true;
  if(t==='MARK') m.h=true;
  if(t==='A'){const h=(el.getAttribute('href')||'').trim();if(/^(https?:|mailto:)/i.test(h)) m.a=h.slice(0,2000)}
  if(st){
    // Google Docs wraps a whole paste in <b style="font-weight:normal">; only real weight counts as bold
    const fw=st.fontWeight;if(fw){if(fw==='bold'||fw==='bolder'||+fw>=600) m.b=true;else if(fw==='normal'||fw==='lighter'||+fw<600) m.b=false}
    if(st.fontStyle==='italic'||st.fontStyle==='oblique') m.i=true;else if(st.fontStyle==='normal') m.i=false;
    if(/underline/.test(st.textDecorationLine||st.textDecoration||'')) m.u=true;
    const bg=(st.backgroundColor||'').replace(/\s+/g,'');if(bg&&!CP_PLAIN_BG.test(bg)) m.h=true}
  return m;
}
function cleanCopy(html){
  const src=new DOMParser().parseFromString(String(html||''),'text/html').body,doc=document.implementation.createHTMLDocument(''),root=doc.createElement('div');
  const txt=s=>s.replace(/[\r\n\t\f]+/g,' ').replace(/\u00a0/g,' ').replace(/ {2,}/g,' ');
  const wrap=(text,m)=>{let n=doc.createTextNode(text);for(const [k,tag] of [['h','mark'],['u','u'],['i','em'],['b','strong']]) if(m[k]&&!(k==='b'&&m.nb)){const e=doc.createElement(tag);e.append(n);n=e}if(m.a){const e=doc.createElement('a');e.setAttribute('href',m.a);e.append(n);n=e}return n};
  const hasBlock=el=>{for(const k of el.getElementsByTagName('*')) if(CP_BLOCK.has(k.tagName)) return true;return false};
  function inline(el,m,into){for(const k of el.childNodes){
    if(k.nodeType===3){const t=txt(k.data);if(t) into.append(wrap(t,m));continue}
    if(k.nodeType!==1||CP_DROP.has(k.tagName)) continue;
    if(k.tagName==='BR'){into.append(doc.createElement('br'));continue}
    if(CP_BLOCK.has(k.tagName)&&into.lastChild) into.append(doc.createTextNode(' '));
    inline(k,cpMarks(k,m),into)}}
  // lists nest by real nesting or by Quill's ql-indent-N, and a bullet item can sit in an <ol data-list> (Quill again)
  function list(el,m,box){
    const stack=[];
    const add=(item,depth,type)=>{
      while(stack.length&&(stack[stack.length-1].depth>depth||(stack[stack.length-1].depth===depth&&stack[stack.length-1].type!==type))) stack.pop();
      if(!stack.length||stack[stack.length-1].depth<depth){const L=doc.createElement(type);
        if(stack.length){const up=stack[stack.length-1].el;let host=up.lastElementChild;if(!host){host=doc.createElement('li');up.append(host)}host.append(L)}else box.append(L);
        stack.push({depth,type,el:L})}
      stack[stack.length-1].el.append(item)};
    const walk=(L,depth,mm)=>{for(const li of L.children){
      if(li.tagName==='UL'||li.tagName==='OL'){walk(li,depth+1,mm);continue}
      if(li.tagName!=='LI') continue;
      const d=Math.min(4,depth+(+((li.className||'').match(/ql-indent-(\d)/)||[])[1]||0)),type=li.dataset.list?(li.dataset.list==='bullet'?'ul':'ol'):(L.tagName==='UL'?'ul':'ol');
      const item=doc.createElement('li'),m2=cpMarks(li,mm),subs=[];
      for(const k of li.childNodes){
        if(k.nodeType===1&&(k.tagName==='UL'||k.tagName==='OL')){subs.push(k);continue}
        if(k.nodeType===3){const t=txt(k.data);if(t) item.append(wrap(t,m2));continue}
        if(k.nodeType!==1||CP_DROP.has(k.tagName)) continue;
        if(k.tagName==='BR'){item.append(doc.createElement('br'));continue}
        if(CP_BLOCK.has(k.tagName)&&item.textContent.trim()) item.append(doc.createElement('br')); // a second paragraph in an item starts a new line
        inline(k,cpMarks(k,m2),item)}
      if(item.textContent.trim()) add(item,d,type);
      for(const s of subs) walk(s,d+1,m2)}};
    walk(el,0,m);
  }
  function blocks(el,m,box){
    let cur=null;const para=()=>{if(!cur){cur=doc.createElement('p');box.append(cur)}return cur};
    for(const k of el.childNodes){
      if(k.nodeType===3){const t=txt(k.data);if(!t.trim()&&!cur) continue;para().append(wrap(t,m));continue}
      if(k.nodeType!==1||CP_DROP.has(k.tagName)) continue;
      const t=k.tagName,mm=cpMarks(k,m);
      if(t==='BR'){if(cur) cur.append(doc.createElement('br'));continue}
      if(!CP_BLOCK.has(t)&&!hasBlock(k)){inline(k,mm,para());continue}
      cur=null;
      if(t==='HR'){box.append(doc.createElement('hr'));continue}
      if(/^H[1-6]$/.test(t)){const h=doc.createElement('h'+Math.min(3,+t[1]));inline(k,{...mm,nb:true},h);if(h.textContent.trim()) box.append(h);continue}
      if(t==='UL'||t==='OL'){list(k,mm,box);continue}
      if(t==='BLOCKQUOTE'){const q=doc.createElement('blockquote');blocks(k,mm,q);if(q.textContent.trim()) box.append(q);continue}
      if(t==='TABLE'){for(const tr of k.querySelectorAll('tr')){const cells=[...tr.children].map(c=>txt(c.textContent).trim()).filter(Boolean);if(cells.length){const p=doc.createElement('p');p.textContent=cells.join(' | ');box.append(p)}}continue}
      if(t==='PRE'){for(const line of k.textContent.split(/\r?\n/)) if(line.trim()){const p=doc.createElement('p');p.textContent=line.replace(/\u00a0/g,' ');box.append(p)}continue}
      if(hasBlock(k)){blocks(k,mm,box);continue}
      const p=doc.createElement('p');inline(k,mm,p);if(p.textContent.trim()) box.append(p);
    }
  }
  blocks(src,{},root);
  // tidy: neighbouring tags of the same kind become one, empty ones go, and blocks lose space at their edges
  const merge=el=>{for(const k of [...el.children]) merge(k);let k=el.firstChild;
    while(k){const nx=k.nextSibling;
      if(nx&&k.nodeType===1&&nx.nodeType===1&&k.tagName===nx.tagName&&/^(STRONG|EM|U|MARK|A|BLOCKQUOTE)$/.test(k.tagName)&&(k.tagName!=='A'||k.getAttribute('href')===nx.getAttribute('href'))){while(nx.firstChild) k.append(nx.firstChild);nx.remove();merge(k);continue}
      k=nx}
    el.normalize()};
  for(const e of [...root.querySelectorAll('strong,em,u,mark,a')]) if(!e.textContent) e.replaceWith(...e.childNodes);
  merge(root);
  for(const b of root.querySelectorAll('p,h1,h2,h3,li')){
    while(b.firstChild&&b.firstChild.nodeName==='BR') b.firstChild.remove();
    while(b.lastChild&&b.lastChild.nodeName==='BR') b.lastChild.remove();
    const w=doc.createTreeWalker(b,NodeFilter.SHOW_TEXT),ts=[];let n;while(n=w.nextNode()) ts.push(n);
    if(ts.length){ts[0].data=ts[0].data.replace(/^\s+/,'');const l=ts[ts.length-1];if(!l.parentElement.closest('ul,ol')||l.parentElement.closest('li')===b) l.data=l.data.replace(/\s+$/,'')}}
  for(const b of [...root.querySelectorAll('p,h1,h2,h3,li,blockquote')]) if(!b.textContent.trim()&&!b.querySelector('ul,ol')) b.remove();
  return root.innerHTML;
}
const plainOf=html=>{const d=document.createElement('div');d.innerHTML=html;return d.textContent||''};

/* ---------- Markdown out: what Claude reads. Bold that starts or ends on punctuation goes in as <strong>, so a quote
   mark or a full stop can never stop it being bold; underline and highlight have no Markdown, so they stay as tags. ---------- */
const CP_PUNCT=/[!-\/:-@\[-`{-~\u00a1-\u00bf\u2010-\u2027\u2030-\u205e]/;
const mdEsc=s=>s.replace(/\u00a0/g,' ').replace(/\\/g,'\\\\').replace(/([*_`\[\]<~])/g,'\\$1');
// CommonMark: ** opens when the next character is not a space and, if it is punctuation, the one before is a space or
// punctuation too; it closes the same way round. Spaces just inside the markers go outside them.
const mdW=c=>!c||/\s/.test(c),mdP=c=>!!c&&CP_PUNCT.test(c);
function mdWrap(inner,d,tag,prev,next){
  const m=inner.match(/^(\s*)([\s\S]*?)(\s*)$/),core=m[2];if(!core) return inner;
  const before=m[1]?' ':prev,after=m[3]?' ':next,a=core[0],z=core[core.length-1];
  const open=!mdW(a)&&(!mdP(a)||mdW(before)||mdP(before)),close=!mdW(z)&&(!mdP(z)||mdW(after)||mdP(after));
  return m[1]+(open&&close?d+core+d:`<${tag}>${core}</${tag}>`)+m[3];
}
function mdInline(el){
  let s='';
  for(const k of el.childNodes){
    if(k.nodeType===3){s+=mdEsc(k.data);continue}
    if(k.nodeType!==1||k.tagName==='UL'||k.tagName==='OL') continue;
    const t=k.tagName;if(t==='BR'){s+='  \n';continue}
    const inner=mdInline(k),prev=(k.previousSibling&&k.previousSibling.textContent||'').slice(-1),next=(k.nextSibling&&k.nextSibling.textContent||'').charAt(0);
    if(t==='STRONG') s+=mdWrap(inner,'**','strong',prev,next);
    else if(t==='EM') s+=mdWrap(inner,'*','em',prev,next);
    else if(t==='U') s+=inner.trim()?`<u>${inner}</u>`:inner;
    else if(t==='MARK') s+=inner.trim()?`<mark>${inner}</mark>`:inner;
    else if(t==='A') s+=`[${inner}](${(k.getAttribute('href')||'').replace(/[()\s]/g,c=>encodeURIComponent(c))})`;
    else s+=inner;
  }
  return s;
}
// Markdown in: bold written by hand often breaks Markdown's rules (a space before the closing **, or ** against a quote
// mark with a letter after it) and shows up as stars. Those pairs become <strong> before the file is read.
function mdRepair(text){
  let fence=false;
  return String(text).split('\n').map(line=>{
    if(/^\s*```/.test(line)){fence=!fence;return line}if(fence) return line;
    return line.replace(/\*\*([^\n]*?)\*\*/g,(m,inner,at,all)=>{const core=inner.trim();if(!core) return m;
      const prev=all[at-1]||'',next=all[at+m.length]||'';
      if(mdWrap(core,'**','strong',prev,next).startsWith('**')&&inner===core) return m;
      // a space that slipped inside the stars goes outside, unless a space or punctuation is already there
      const lead=mdW(prev)?'':inner.match(/^\s*/)[0],trail=mdW(next)||mdP(next)?'':inner.match(/\s*$/)[0];
      return `${lead}<strong>${core}</strong>${trail}`})}).join('\n');
}
const mdParse=t=>marked.parse(mdRepair(t),{gfm:true});
const mdLineStart=s=>s.replace(/^>/,'\\>').replace(/^(#{1,6})(?=\s)/,'\\$1').replace(/^([-+])(?=\s)/,'\\$1').replace(/^(\d+)([.)])(?=\s)/,'$1\\$2').replace(/^([-_=])(?=\1\1)/,'\\$1');
function mdList(el,depth){
  const ol=el.tagName==='OL',pad='   '.repeat(depth);let i=0;
  return [...el.children].map(li=>{i++;const subs=[...li.children].filter(c=>c.tagName==='UL'||c.tagName==='OL'),lead=ol?`${i}. `:'- ';
    return pad+lead+mdInline(li).trim().replace(/\n/g,'\n'+pad+' '.repeat(lead.length))+subs.map(s=>'\n'+mdList(s,depth+1)).join('')}).join('\n');
}
function htmlToMd(html){
  const box=document.createElement('div');box.innerHTML=cleanCopy(html);const out=[];
  const block=el=>{const t=el.tagName;
    if(/^H[1-3]$/.test(t)) return '#'.repeat(+t[1])+' '+mdInline(el).trim();
    if(t==='P') return mdLineStart(mdInline(el).trim());
    if(t==='UL'||t==='OL') return mdList(el,0);
    if(t==='HR') return '---';
    if(t==='BLOCKQUOTE') return [...el.children].map(block).filter(Boolean).join('\n\n').split('\n').map(l=>l?'> '+l:'>').join('\n');
    return mdLineStart(mdInline(el).trim())};
  for(const el of box.children) out.push(block(el));
  return out.filter(Boolean).join('\n\n')+'\n';
}

/* ---------- positions: a comment is a stretch of characters in the version's text. The inserted wording of a
   suggestion shows inside the text but never counts. ---------- */
function textNodes(box){
  const w=document.createTreeWalker(box,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&n.parentElement.closest('.sg-ins')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const out=[];let n;while(n=w.nextNode()) out.push(n);return out;
}
const docText=box=>textNodes(box).map(t=>t.data).join('');
function textOffset(box,node,off){
  const r=document.createRange();try{r.setStart(node,off)}catch(e){return 0}r.collapse(true);let n=0;
  for(const t of textNodes(box)){if(r.comparePoint(t,t.data.length)<=0){n+=t.data.length;continue}if(t===node&&r.comparePoint(t,0)<0) n+=off;break}
  return n;
}
function pointAt(texts,pos,end){let n=0;for(const t of texts){const L=t.data.length;if(pos<n+L||(end&&pos===n+L)) return [t,pos-n];n+=L}const t=texts[texts.length-1];return [t,t?t.data.length:0]}
// accepted wording into the text, from the last to the first so earlier positions stay put; overlaps are left out
function applySug(html,list){
  const box=document.createElement('div');box.innerHTML=cleanCopy(html);const texts=textNodes(box),full=texts.map(t=>t.data).join(''),done=[],skip=[];let last=Infinity;
  for(const c of [...list].sort((a,b)=>b.s-a.s)){
    if(c.e>last||full.slice(c.s,c.e)!==c.quote){skip.push(c);continue}
    const [sn,so]=pointAt(texts,c.s),[en,eo]=pointAt(texts,c.e,true),r=document.createRange();r.setStart(sn,so);r.setEnd(en,eo);r.deleteContents();
    if(c.rep) r.insertNode(document.createTextNode(c.rep.replace(/\s*\n\s*/g,' ')));last=c.s;done.push(c);
  }
  return {html:cleanCopy(box.innerHTML),done,skip};
}
// highlights for comments, struck words and new wording for suggestions
function decorate(box,items){
  if(!items.length) return;
  const cuts=new Set();for(const c of items){cuts.add(c.s);cuts.add(c.e)}
  let pos=0;for(const t of textNodes(box)){const a=pos,L=t.data.length;pos+=L;let node=t,off=a;for(const b of [...cuts].filter(b=>b>a&&b<a+L).sort((x,y)=>x-y)){node=node.splitText(b-off);off=b}}
  pos=0;const ends={};
  for(const t of textNodes(box)){const a=pos,b=pos+t.data.length;pos=b;if(a===b) continue;
    const cov=items.filter(c=>c.s<=a&&b<=c.e);if(!cov.length) continue;let w=t;
    const cm=cov.filter(c=>c.kind!=='suggest'),sg=cov.filter(c=>c.kind==='suggest');
    if(cm.length){const sp=document.createElement('span');sp.className='ch'+(cm.some(c=>c.id===CP.sel||c.id==='draft')?' on':'')+(cm.some(c=>c.id==='draft')?' new':'');sp.dataset.c=cm.map(c=>c.id).join(' ');w.replaceWith(sp);sp.append(w);w=sp}
    if(sg.length){const d=document.createElement('del');d.className='sg'+(sg.every(c=>c.status==='accepted')?' ok':'')+(sg.some(c=>c.id===CP.sel)?' on':'');d.dataset.c=sg.map(c=>c.id).join(' ');w.replaceWith(d);d.append(w);w=d}
    for(const c of sg) if(c.e===b) ends[c.id]=w}
  for(const c of items) if(c.kind==='suggest'&&ends[c.id]&&c.rep){const ins=document.createElement('ins');ins.className='sg-ins'+(c.status==='accepted'?' ok':'')+(c.id===CP.sel?' on':'');ins.dataset.c=c.id;ins.textContent=c.rep;ends[c.id].after(ins)}
}

/* ---------- the copy tab: the version on the left as a document, its comments on the right ---------- */
function cpReset(p){if(CP.page===p.id) return;CP.page=p.id;CP.open=null;CP.sel=null;CP.draft=null;CP.reply=null;CP.pop=null;CP.menu=null;if(CP.edit&&CP.edit.page!==p.id){CP.edit=null;CP.quill=null}}
function copyViewHtml(p){
  cpReset(p);if(CP.edit) return cpEditHtml(p);
  const L=copyOf(p);
  if(!L.length){const d=draftGet(p);return `<div class="pj-dz big calm"><span class="ic">${FDI.doc}</span><b>No copy for ${esc(p.name)} yet</b><small>Write it here or paste it from Google Docs, Notion or a Markdown file, or upload a Markdown, Word, text or HTML file. Bold, italics, underline, highlights, headings, lists and links all come through, and every save is a version the team can comment on.</small><span class="pj-dz-acts"><button type="button" class="btn dark" data-cp-write>${I.pen}${d?'Continue the draft':'Write the copy'}</button><button type="button" class="btn" data-cp-up>${PI.up}Upload a file</button></span></div>
    <div class="pj-over">${PI.up}<b>Drop a Markdown, Word, text or HTML file to make copy v1</b></div>`}
  return (cpMode(p)==='read'?cpReadHtml(p,cpShown(p)):cpListHtml(p))+`<div class="pj-over">${PI.up}<b>Drop a file to make copy v${cpCur(p).n+1}</b></div>`;
}
// a version's first lines, small, as its picture in the list
function cpThumbHtml(v){const d=document.createElement('div');d.innerHTML=cleanCopy(v.body);while(d.children.length>7) d.lastElementChild.remove();return `<div class="thumb cp-thumb" aria-hidden="true"><div class="cp-thumb-in">${d.innerHTML}</div></div>`}
const cpWords=v=>plainOf(v.body).split(/\s+/).filter(Boolean).length;
const cpTitle=v=>{const d=document.createElement('div');d.innerHTML=v.body;const h=d.querySelector('h1,h2,h3')||d.firstElementChild;return clip((h&&h.textContent||'').trim()||'Untitled',70)};
function cpListHtml(p){
  const T=team(),cur=cpCur(p),d=draftGet(p),next=cur.n+1,acc=cur.cm.filter(c=>c.kind==='suggest'&&c.status==='accepted'&&!c.done).length;
  const card=v=>{const o=v.cm.filter(c=>cpLayerOf(c)==='team'&&cpOpen(c)).length,co=v.cm.filter(c=>cpLayerOf(c)==='client'&&cpOpen(c)).length,r=v.cm.filter(c=>!cpOpen(c)).length,isCur=v===cur,sh=!!(v.share&&v.share.on),fin=p.finalCopy===v.id;
    return `<div class="ver-card cp-card${isCur?' cur':''}" role="button" tabindex="0" data-cpv-open="${v.id}">${cpThumbHtml(v)}
      <div class="ver-body"><div class="ver-head"><span class="ver-n">v${v.n}</span>${isCur?'<span class="ver-cur">Current</span>':''}${fin?`<span class="cp-final">${I.check}Final</span>`:''}${sh?'<span class="pj-shared" title="The review link for this version is on">Shared</span>':''}<b>${esc(cpTitle(v))}</b></div>
        <small>${esc(cpSrc(v))} · ${plural(cpWords(v),'word')} · ${esc(agoLabel(v.at||Date.now()))} by ${esc(whoName(T,v.by))}</small>
        <span class="pg-cnt">${o?`<i class="o">${o} open</i>`:''}${co?`<i class="cl">${co} on the review link</i>`:''}${isCur&&acc?`<i class="ok">${acc} accepted, going into v${next}</i>`:''}${r?`<i>${r} done</i>`:''}${!o&&!r&&!co?'<i>No comments yet</i>':''}</span></div>
      <div class="ver-acts"><button type="button" class="btn sm dark" data-cpv-open="${v.id}">Open</button><button type="button" class="btn sm${sh?' on':''}" data-cpv-share="${v.id}" title="${sh?'The review link for this version is on':'Send this version out for review'}">${PI.share}${sh?'Shared':'Share'}</button><button type="button" class="btn sm${fin?' on':''}" data-cpv-final="${v.id}" title="${fin?'This is the final copy. Click to take the mark off':'Mark the copy this page gets built from'}">${I.check}${fin?'Final':'Mark final'}</button><button type="button" class="btn sm" data-cpv-dl="${v.id}" title="Download as Markdown">${PI.dl}Download</button><button type="button" class="tk-x" data-cpv-del="${v.id}" aria-label="Delete copy v${v.n}">${I.trash}</button></div></div>`};
  return `<div class="ver-list">${[...copyOf(p)].reverse().map(card).join('')}</div>
    <div class="pj-dz"><span class="ic">${FDI.doc}</span><b>${d?`Your draft of v${next} is waiting`:`Write v${next}, or drop a file to make it`}</b><small>Writing starts from v${cur.n}${acc?`, with ${plural(acc,'accepted change')} already in`:''}. A Markdown, Word, text or HTML file becomes v${next} as it is. Every version keeps its own comments.</small><span class="pj-dz-acts"><button type="button" class="btn dark" data-cp-write>${I.pen}${d?'Continue the draft':`Write v${next}`}</button><button type="button" class="btn" data-cp-up>${PI.up}Upload a file</button></span></div>`;
}
function cpOpenVer(id){CP.open=id;CP.sel=null;CP.draft=null;CP.reply=null;CP.pop=null;CP.menu=null;CP.filter='open';render()}
async function cpDelete(p,v){
  if(!await confirmDlg(`Delete ${cpLabel(v).toLowerCase()}?`,`${v.cm.length?`Its ${plural(v.cm.length,'comment')} go too. `:''}This cannot be undone.`,'Delete version')) return;
  p.copy=copyOf(p).filter(x=>x!==v);if(p.finalCopy===v.id) p.finalCopy=null;if(CP.open===v.id) CP.open=null;CP.sel=null;touch(p);save();render();toast(`${cpLabel(v)} deleted`);
}
function cpFinal(p,v){p.finalCopy=p.finalCopy===v.id?null:v.id;touch(p);save();render();toast(p.finalCopy?`${cpLabel(v)} is the final copy`:'No final copy for this page now')}
function cpDownload(p,v){dlBlob(new Blob([cpMd(p,v)],{type:'text/markdown'}),`${slug(p.name)}-copy-v${v.n}.md`);toast(`Downloading ${cpLabel(v).toLowerCase()} as Markdown`)}
function cpVerMenuHtml(p,v){
  return `<div class="dd vmenu cp-vmenu" role="menu">${[...copyOf(p)].reverse().map(x=>{const o=x.cm.filter(cpOpen).length,on=x===v;
    return `<button type="button" class="opt${on?' on':''}" role="menuitem" data-cpv="${x.id}"><span class="vn">v${x.n}</span><span class="n">${esc(cpSrc(x))}${x===cpCur(p)?' <i>latest</i>':''}${p.finalCopy===x.id?' <i class="fin">final</i>':''}<small>${esc(agoLabel(x.at||Date.now()))} · ${o?`${o} open`:'nothing open'}</small></span>${on?`<span class="dd-ck">${I.check}</span>`:''}</button>`}).join('')}</div>`;
}
function cpMoreHtml(p,v){
  const fin=p.finalCopy===v.id,sh=!!(v.share&&v.share.on);
  return `<div class="dd fd-menu cp-menu" role="menu">
    <button type="button" class="opt" role="menuitem" data-cp-do="final">${I.check}<span class="n">${fin?`Not final any more`:`Mark ${cpLabel(v).toLowerCase()} as final`}<small>${fin?'The page goes back to having no final copy':'The version the page gets built from'}</small></span></button>
    <button type="button" class="opt" role="menuitem" data-cp-do="share">${PI.share}<span class="n">Review link…<small>${sh?'On: people with the link can comment':'Let someone review it with no account'}</small></span></button>
    <button type="button" class="opt" role="menuitem" data-cp-do="copymd">${CPI.copy}<span class="n">Copy as Markdown<small>To paste into Claude or a document</small></span></button>
    <button type="button" class="opt" role="menuitem" data-cp-do="dlmd">${CPI.md}<span class="n">Download as Markdown</span></button>
    <hr class="dd-sep"><button type="button" class="opt danger" role="menuitem" data-cp-do="del">${I.trash}<span class="n">Delete ${cpLabel(v).toLowerCase()}</span></button></div>`;
}
function cpReadHtml(p,v){
  const T=team(),latest=v===cpCur(p),fin=p.finalCopy===v.id,d=!SHARE&&draftGet(p),next=cpCur(p).n+1,sh=!!(v.share&&v.share.on);
  const bar=SHARE?`<div class="cp-bar"><span class="pv-ttl"><b>${cpLabel(v)}</b><small>Select any words to comment on them or to suggest other wording.</small></span></div>`
    :`<div class="cp-bar"><button type="button" class="chev" id="cpBack" aria-label="All copy versions" title="All copy versions">${PI.back}</button><div class="vpick-wrap"><button type="button" class="vpick" id="cpVerBtn" aria-haspopup="menu" aria-expanded="${CP.menu==='ver'}"><span class="pv-ttl"><b>${cpLabel(v)}${latest?'':' <i class="cp-old">older version</i>'}</b><small>${esc(cpSrc(v))} · ${esc(agoLabel(v.at||Date.now()))} by ${esc(whoName(T,v.by))}</small></span><svg class="vc" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>${CP.menu==='ver'?cpVerMenuHtml(p,v):''}</div>
      ${fin?`<span class="cp-final">${I.check}Final</span>`:''}${sh?'<span class="pj-shared" title="The review link for this version is on">Shared</span>':''}<span class="sp"></span>
      <button type="button" class="btn sm" data-cp-up title="Upload a Markdown, Word, text or HTML file as copy v${next}">${PI.up}<span>Upload</span></button><button type="button" class="btn sm dark" data-cp-write>${I.pen}<span>${d?`Continue v${next}`:`Edit as v${next}`}</span></button>
      <div class="fd-more"><button type="button" class="btn sm icon" id="cpMore" aria-label="More for ${esc(cpLabel(v))}" aria-haspopup="menu" aria-expanded="${CP.menu==='more'}">${I.more}</button>${CP.menu==='more'?cpMoreHtml(p,v):''}</div></div>`;
  return `<div class="cp"><div class="cp-main">${bar}
      <div class="cp-scroll" id="cpScroll"><article class="cp-doc" id="cpDoc" aria-label="${esc(cpLabel(v))}"></article></div>
      <div class="cp-pop" id="cpPop" hidden></div></div>
    <aside class="pv-side cp-side" id="cpSide">${cpSideHtml(p,v)}</aside></div>`;
}
function cpLayerSeg(p,v){
  if(SHARE||!copyOf(p).some(x=>(x.share&&x.share.token)||x.cm.some(c=>cpLayerOf(c)==='client'))) return '';
  const n=l=>v.cm.filter(c=>cpLayerOf(c)===l&&cpOpen(c)).length;
  return `<div class="seg sm pv-layer" id="cpLayer" aria-label="Which comments"><button type="button" data-cplayer="team" class="${CP.layer==='team'?'on':''}">Team<i>${n('team')||''}</i></button><button type="button" data-cplayer="client" class="${CP.layer==='client'?'on':''}">Review link<i>${n('client')||''}</i></button></div>${CP.layer==='client'?'<p class="pv-layer-note">What people see on the review link. Anything you post or reply here, they see too.</p>':''}`;
}
function cpCardHtml(p,v,c){
  const T=team(),my=me().id,own=ownIt(c,my),sel=c.id===CP.sel,z=whoOf(T,c.byId,c.guest&&c.by),sg=c.kind==='suggest',st=c.status,latest=v===cpCur(p),op=cpOpen(c);
  const tag=sg?`<span class="cp-tag${st==='accepted'?' ok':st==='declined'?' no':''}">${st==='accepted'?(c.done?`In v${c.done}`:'Accepted'):st==='declined'?'Declined':st==='resolved'?'Resolved':'Suggestion'}</span>`:'';
  const body=sg?`<p class="pc-sg"><del>${esc(clip(c.quote,240))}</del>${c.rep?`<ins>${esc(c.rep)}</ins>`:'<em>Remove these words</em>'}</p>${c.text?`<p>${mentionHtml(c.text)}</p>`:''}`
    :`<p class="pc-q">${esc(clip(c.quote,160))}</p><p>${mentionHtml(c.text)}</p>`;
  const acts=[];
  if(!SHARE&&sg&&st==='open'&&latest) acts.push(`<button type="button" class="ok" data-cpc-acc="${c.id}">Accept</button>`,`<button type="button" data-cpc-dec="${c.id}">Decline</button>`);
  if(!SHARE&&sg&&st==='accepted'&&!c.done) acts.push(`<button type="button" data-cpc-undo="${c.id}">Undo accept</button>`);
  if(!SHARE&&sg&&(st==='declined'||(st==='resolved'))) acts.push(`<button type="button" data-cpc-reopen="${c.id}">Reopen</button>`);
  if(!SHARE&&sg&&st==='open'&&!latest) acts.push(`<button type="button" data-cpc-res="${c.id}" title="An older version: accept wording on the latest one">Resolve</button>`);
  acts.push(`<button type="button" data-cpc-reply="${c.id}">Reply</button>`);
  if(!SHARE&&!sg) acts.push(`<button type="button" data-cpc-res="${c.id}">${st==='resolved'?'Reopen':'Resolve'}</button>`);
  if(own) acts.push(`<button type="button" class="danger" data-cpc-del="${c.id}">Delete</button>`);
  return `<div class="pc cpc${sel?' sel':''}${op?'':' res'}" data-cpc="${c.id}" role="button" tabindex="0">
    <div class="pc-top"><span class="pin-n">${!op&&!sg?I.check:c.n}</span>${avatar(z,'xs')}<b>${esc(nameOf(T,c.byId,c.by))}</b>${clientTag(c)}<time>${esc(agoLabel(c.at))}</time>${tag}</div>${body}
    ${(c.re||[]).length?`<div class="pc-res">${c.re.map(r=>`<div class="pc-re">${avatar(whoOf(T,r.byId,r.guest&&r.by),'xs')}<div><b>${esc(nameOf(T,r.byId,r.by))}</b>${clientTag(r)}<time>${esc(agoLabel(r.at))}</time><p>${mentionHtml(r.text)}</p></div>${ownIt(r,my)?`<button type="button" class="th-x" data-cpc-delre="${r.id}" aria-label="Remove reply">×</button>`:'<span></span>'}</div>`).join('')}</div>`:''}
    ${sel&&CP.reply?`<div class="th-box"><textarea class="cbox pbox" id="cpReply" rows="1" maxlength="1000" placeholder="Reply, @ to mention someone"></textarea><button type="button" class="th-send" data-cpc-send="${c.id}" aria-label="Send">${I.send}</button></div>`:''}
    <div class="pc-acts">${acts.join('')}</div></div>`;
}
function cpComposerHtml(d){
  const sg=d.kind==='suggest';
  return `<div class="pc sel cp-new"><div class="pc-top"><span class="pin-n">${sg?I.pen:I.plus}</span><b>${sg?'Suggest other wording':'New comment'}</b></div>
    <p class="pc-q">${esc(clip(d.quote,200))}</p>
    ${sg?`<label class="cp-lbl">Should say<textarea class="cbox pbox" id="cpRep" rows="2" maxlength="5000">${esc(d.rep??d.quote)}</textarea></label><label class="cp-lbl">Why <small>optional</small><textarea class="cbox pbox" id="cpNote" rows="1" maxlength="2000">${esc(d.text||'')}</textarea></label>`
      :`<textarea class="cbox pbox" id="cpText" rows="2" maxlength="2000" placeholder="Comment, @ to mention someone">${esc(d.text||'')}</textarea>`}
    <div class="pv-new-acts"><button type="button" class="btn sm ghost" data-cp-cancel>Cancel</button><button type="button" class="btn sm dark" data-cp-post>${sg?'Suggest':'Comment'}</button></div></div>`;
}
function cpSideHtml(p,v){
  const latest=v===cpCur(p),all=v.cm.filter(c=>SHARE||cpLayerOf(c)===CP.layer),open=all.filter(cpOpen).length,res=all.length-open;
  const list=all.filter(c=>CP.filter==='all'||(CP.filter==='open')===cpOpen(c)).sort((a,b)=>a.s-b.s||a.n-b.n);
  const acc=latest&&!SHARE?v.cm.filter(c=>c.kind==='suggest'&&c.status==='accepted'&&!c.done).length:0;
  const banner=acc?`<button type="button" class="pv-banner" data-cp-write>${I.pen}<span><b>${plural(acc,'accepted change')}</b><small>They go into v${v.n+1} when you edit it.</small></span>${PI.arrow}</button>`:'';
  const empty=all.length?CP.filter==='open'?'Nothing open here.':'Nothing resolved yet.':CP.layer==='client'&&!SHARE?`Nothing on the review link for ${cpLabel(v).toLowerCase()} yet. What people leave there shows up here.`:'No comments yet. Select any words in the copy to comment on them, or to suggest other wording that can be accepted into the next version.';
  return `<div class="pv-sh"><h3>Comments on ${esc(cpLabel(v).toLowerCase())}</h3>${cpLayerSeg(p,v)}<div class="seg sm" id="cpFilter"><button type="button" data-cpfilter="open" class="${CP.filter==='open'?'on':''}">Open<i>${open||''}</i></button><button type="button" data-cpfilter="resolved" class="${CP.filter==='resolved'?'on':''}">Done<i>${res||''}</i></button><button type="button" data-cpfilter="all" class="${CP.filter==='all'?'on':''}">All</button></div></div>
    <div class="pv-list" id="cpList">${CP.draft?cpComposerHtml(CP.draft):''}${banner}${list.length?list.map(c=>cpCardHtml(p,v,c)).join(''):CP.draft?'':`<p class="pv-empty">${empty}</p>`}</div>`;
}
// after the page view is drawn: the document with its marks, or the editor
function cpAfter(p){
  if(CP.edit){cpMount(p);return}
  const v=cpShown(p),box=$('#cpDoc');if(!v||!box) return;
  box.innerHTML=cleanCopy(v.body);
  const items=v.cm.filter(c=>(SHARE||cpLayerOf(c)===CP.layer)&&(cpOpen(c)||c.id===CP.sel)).map(c=>({id:c.id,s:c.s,e:c.e,kind:c.kind,rep:c.rep,status:c.status}));
  if(CP.draft) items.push({id:'draft',s:CP.draft.s,e:CP.draft.e,kind:'comment'});
  decorate(box,items);
  const sc=$('#cpScroll'),k=v.id;if(sc){sc.scrollTop=CP.scroll[k]||0;sc.addEventListener('scroll',()=>{CP.scroll[k]=sc.scrollTop;cpPopHide()},{passive:true})}
  const ta=$('#cpText')||$('#cpRep');if(CP.draft&&ta&&!CP.draft.focused){CP.draft.focused=true;ta.focus();if(ta.id==='cpRep') ta.select()}
  if(CP.reply&&CP.sel){const r=$('#cpReply');if(r){r.focus();if(CP.replyText) r.value=CP.replyText}}
}
// comments changed: redraw the list and the marks, not the page
function cpRefresh(p){
  if(SHARE){render();return}
  if(UI.view!=='projects'||PV.proj!==p.id||PV.tab!=='copy'||CP.edit||!$('#cpSide')){render();return}
  const v=cpShown(p),keep=$('#cpList'),top=keep?keep.scrollTop:0;$('#cpSide').innerHTML=cpSideHtml(p,v);$('#cpList').scrollTop=top;cpAfter(p);
}
function cpFocusMark(id){const el=$(`#cpDoc [data-c~="${id}"]`);if(el) el.scrollIntoView({block:'center',behavior:'smooth'})}

/* ---------- selecting words: a small bar offers Comment and Suggest ---------- */
function cpPopHide(){if(!CP.pop) return;CP.pop=null;const el=$('#cpPop');if(el) el.hidden=true}
function cpSelCheck(){
  const box=$('#cpDoc'),el=$('#cpPop');if(!box||!el||CP.edit) return;
  const s=getSelection();if(!s.rangeCount||s.isCollapsed){cpPopHide();return}
  const r=s.getRangeAt(0);if(!box.contains(r.commonAncestorContainer)){cpPopHide();return}
  const a=textOffset(box,r.startContainer,r.startOffset),b=textOffset(box,r.endContainer,r.endOffset),full=docText(box);let s0=a,e0=b;
  while(s0<e0&&/\s/.test(full[s0])) s0++;while(e0>s0&&/\s/.test(full[e0-1])) e0--;if(e0<=s0){cpPopHide();return}
  CP.pop={s:s0,e:e0,quote:full.slice(s0,e0)};
  const rr=r.getBoundingClientRect(),mr=el.parentElement.getBoundingClientRect();el.hidden=false;
  el.innerHTML=`<button type="button" data-cp-pop="comment">${PI.bubble}Comment</button><button type="button" data-cp-pop="suggest">${I.pen}Suggest</button>`;
  const w=el.offsetWidth,h=el.offsetHeight,x=clamp(rr.left+rr.width/2-mr.left-w/2,8,mr.width-w-8),y=rr.top-mr.top-h-8<56?rr.bottom-mr.top+8:rr.top-mr.top-h-8;
  el.style.left=x+'px';el.style.top=y+'px';
}
let cpSelT=0;document.addEventListener('selectionchange',()=>{if(!$('#cpDoc')) return;clearTimeout(cpSelT);cpSelT=setTimeout(cpSelCheck,140)});
function cpStartDraft(kind){
  const p=projById(PV.proj),q=CP.pop;if(!p||!q) return;
  if(q.quote.length>2000){toast('Select up to 2000 characters at a time');return}
  CP.draft={kind,s:q.s,e:q.e,quote:q.quote,...(kind==='suggest'?{rep:q.quote}:{}),text:''};CP.pop=null;CP.sel=null;CP.reply=null;
  if(CP.filter==='resolved') CP.filter='open';getSelection().removeAllRanges();cpRefresh(p);
}
function cpPost(){
  const p=projById(PV.proj),v=p&&cpShown(p),d=CP.draft;if(!v||!d) return;
  if(SHARE&&!guestMe().name){askName(()=>cpPost());return}
  const text=(($('#cpText')||$('#cpNote'))||{value:d.text||''}).value.trim(),rep=d.kind==='suggest'?(($('#cpRep')||{value:d.rep}).value||'').replace(/\s*\n\s*/g,' ').trim():null;
  if(d.kind==='comment'&&!text){const t=$('#cpText');if(t) t.focus();return}
  if(d.kind==='suggest'&&rep===d.quote){toast('Change the wording first, or leave a comment instead');const t=$('#cpRep');if(t) t.focus();return}
  const layer=SHARE?'client':CP.layer;
  const c={id:uid(),n:v.cm.filter(x=>cpLayerOf(x)===layer).reduce((m,x)=>Math.max(m,x.n||0),0)+1,...(layer==='client'?{layer:'client'}:{}),kind:d.kind,s:d.s,e:d.e,quote:d.quote,text,...(d.kind==='suggest'?{rep}:{}),status:'open',by:'You',byId:me().id,at:Date.now(),re:[]};
  v.cm.push(c);CP.draft=null;CP.sel=c.id;touch(p);save();cpRefresh(p);
}
const cpCm=(v,id)=>v.cm.find(c=>c.id===id);

/* ---------- writing a version: Quill, with the toolbar Noon draws, the paste cleaned first, a draft kept as you type ---------- */
const CP_TOOLS=[['header',1,'<b class="cp-h">H1</b>','Big heading'],['header',2,'<b class="cp-h">H2</b>','Heading'],['header',3,'<b class="cp-h">H3</b>','Small heading'],0,
  ['bold',true,'<b>B</b>','Bold (Ctrl+B)'],['italic',true,'<i>I</i>','Italic (Ctrl+I)'],['underline',true,'<u>U</u>','Underline (Ctrl+U)'],['mark',true,CPI.mark,'Highlight'],0,
  ['link',true,CPI.link,'Link'],['list','bullet',CPI.ul,'Bulleted list'],['list','ordered',CPI.ol,'Numbered list'],['blockquote',true,CPI.quote,'Quote'],['hr',true,CPI.hr,'Line between sections'],0,['clean',true,CPI.clear,'Clear formatting']];
function cpToolsHtml(){
  if(CP.link) return `<div class="cp-linkrow"><input id="cpLinkIn" type="url" placeholder="Paste a link, https://…" aria-label="Link"><button type="button" class="btn sm dark" data-cp-link="ok">Apply</button><button type="button" class="btn sm" data-cp-link="rm">Remove link</button><button type="button" class="btn sm ghost" data-cp-link="x">Cancel</button></div>`;
  return CP_TOOLS.map(t=>t?`<button type="button" class="cp-tool" data-fmt="${t[0]}" data-val="${t[1]}" title="${t[3]}" aria-label="${t[3]}" aria-pressed="false">${t[2]}</button>`:'<span class="cp-sep"></span>').join('');
}
function cpEditHtml(p){
  const e=CP.edit,from=e.from&&cpById(p,e.from),open=from?from.cm.filter(c=>cpOpen(c)&&c.status!=='accepted'):[];
  const note=e.restored?'Picked up your draft from this device':from?`Starting from v${from.n}${e.acc.length?`, with ${plural(e.acc.length,'accepted change')} in`:''}`:'A first draft';
  return `<div class="cp cp-editing"><div class="cp-main">
      <div class="cp-bar"><span class="pv-ttl"><b>Copy v${e.n}</b><small><span>${esc(note)}</span> · <span id="cpSaved">kept on this device as you type</span></small></span><span class="sp"></span><button type="button" class="btn sm ghost" data-cp-cancel-edit>Cancel</button><button type="button" class="btn sm dark" data-cp-save>Save as v${e.n}</button></div>
      <div class="cp-tools" id="cpTools" role="toolbar" aria-label="Formatting">${cpToolsHtml()}</div>
      <div class="cp-scroll"><div class="cp-doc cp-q" id="cpQuill"></div></div></div>
    <aside class="pv-side cp-side"><div class="pv-sh"><h3>${open.length?`Still open on v${from.n}`:'Formatting that comes through'}</h3></div>
      <div class="pv-list">${open.length?open.map(c=>`<div class="pc"><div class="pc-top"><span class="pin-n">${c.n}</span><b>${esc(nameOf(team(),c.byId,c.by))}</b>${c.kind==='suggest'?'<span class="cp-tag">Suggestion</span>':''}</div>${c.kind==='suggest'?`<p class="pc-sg"><del>${esc(clip(c.quote,160))}</del>${c.rep?`<ins>${esc(c.rep)}</ins>`:''}</p>`:`<p class="pc-q">${esc(clip(c.quote,120))}</p><p>${mentionHtml(c.text)}</p>`}</div>`).join(''):''}
        <div class="cp-tips"><p>Paste from Google Docs or Notion and bold, italics, underline, highlights, headings, lists and links stay as they are. Paste Markdown and it turns into the same formatting.</p><p>Every save is a new version. Claude gets it as clean Markdown, so formatting never breaks on the way.</p></div></div></aside></div>`;
}
function quillSetup(){
  if(CP.qReady) return;const Inline=Quill.import('blots/inline'),BlockEmbed=Quill.import('blots/block/embed');
  class MarkBlot extends Inline{}MarkBlot.blotName='mark';MarkBlot.tagName='MARK';
  class HrBlot extends BlockEmbed{}HrBlot.blotName='hr';HrBlot.tagName='HR';
  Quill.register(MarkBlot,true);Quill.register(HrBlot,true);CP.qReady=true;
}
const cpHtml=()=>CP.quill?cleanCopy(CP.quill.getSemanticHTML()):'';
const looksMd=t=>/(^|\n)#{1,6} \S|\*\*[^*\n]+\*\*|(^|\n)[-*+] \S|(^|\n)\d+[.)] \S|\[[^\]\n]+\]\([^)\s]+\)|(^|\n)> \S/.test(t);
async function cpMount(p){
  const box=$('#cpQuill');if(!box||box.dataset.on) return;box.dataset.on='1';box.innerHTML='<p class="cp-wait">Opening the editor…</p>';
  try{await Promise.all([lib('quill'),lib('marked')])}catch(e){box.innerHTML='<p class="cp-wait">The editor could not load. Check your connection, then open it again.</p>';delete box.dataset.on;return}
  if(!box.isConnected||!CP.edit||CP.edit.page!==p.id) return;
  quillSetup();box.innerHTML='';
  const q=new Quill(box,{formats:['header','bold','italic','underline','mark','link','list','blockquote','indent','hr'],modules:{toolbar:false,history:{userOnly:true,delay:800}},placeholder:'Write the copy, or paste it from Google Docs, Notion or a Markdown file…'});
  // coming back to a version being written (another tab, then Copy again) picks up what was typed, kept as the draft
  const d=draftGet(p);if(d&&d.html&&!CP.edit.restored){CP.edit.html=d.html;CP.edit.restored=true}
  CP.quill=q;q.setContents(q.clipboard.convert({html:CP.edit.html||'',text:''}),'silent');q.history.clear();CP.q0=cpHtml();
  box.addEventListener('paste',cpPaste,true);
  q.on('editor-change',cpToolsState);
  q.on('text-change',()=>{clearTimeout(CP.dt);CP.dt=setTimeout(()=>cpDraftSave(p),500)});
  q.focus();q.setSelection(0,0,'silent');cpToolsState();
}
function cpToolsState(){
  const q=CP.quill;if(!q||CP.link) return;const r=q.getSelection();const f=r?q.getFormat(r):{};
  for(const b of $$('#cpTools [data-fmt]')){const k=b.dataset.fmt,v=b.dataset.val,on=k==='header'?f.header===+v:k==='list'?f.list===v:k==='hr'||k==='clean'?false:!!f[k];b.setAttribute('aria-pressed',on);b.classList.toggle('on',on)}
}
function cpDraftSave(p){
  if(!CP.quill||!CP.edit) return;const html=cpHtml();
  if(html===CP.q0&&!CP.edit.restored){draftDel(p);return}
  draftSet(p,{base:CP.edit.from,acc:CP.edit.acc,html,at:Date.now()});const s=$('#cpSaved');if(s) s.textContent=`kept on this device at ${fmtT(Date.now(),home())}`;
}
function cpPaste(e){
  const dt=e.clipboardData;if(!dt||!CP.quill) return;
  const html=dt.getData('text/html'),text=dt.getData('text/plain');let clean=null;
  if(html) clean=cleanCopy(html);else if(text&&looksMd(text)&&window.marked) clean=cleanCopy(mdParse(text));
  if(clean==null) return; // plain text: Quill pastes it as it is
  e.preventDefault();e.stopPropagation();
  const q=CP.quill,Delta=Quill.import('delta'),r=q.getSelection(true);if(r.length) q.deleteText(r.index,r.length,'user');
  // headings, lists or several paragraphs start on a line of their own instead of taking over the line they land in
  let at=r.index;if(/<(h[1-3]|ul|ol|blockquote|hr)[\s>]/.test(clean)||(clean.match(/<p>/g)||[]).length>1){const [,off]=q.getLine(at);if(off>0){q.insertText(at,'\n','user');at++}}
  const d=q.clipboard.convert({html:clean,text:''});q.updateContents(new Delta().retain(at).concat(d),'user');q.setSelection(at+d.length(),0,'silent');
}
function cpTool(fmt,val){
  const q=CP.quill;if(!q) return;const r=q.getSelection(true),f=q.getFormat(r);
  if(fmt==='hr'){q.insertEmbed(r.index,'hr',true,'user');q.setSelection(r.index+1,0,'user');return}
  if(fmt==='clean'){if(r.length) q.removeFormat(r.index,r.length,'user');else q.format('header',false,'user');return}
  if(fmt==='link'){CP.linkAt=r;CP.link=true;$('#cpTools').innerHTML=cpToolsHtml();const i=$('#cpLinkIn');i.value=f.link||'';i.focus();return}
  const v=fmt==='header'?+val:fmt==='list'?val:true;q.format(fmt,f[fmt]===v?false:v,'user');cpToolsState();
}
function cpLinkDone(kind){
  const q=CP.quill,r=CP.linkAt;CP.link=false;$('#cpTools').innerHTML=cpToolsHtml();if(!q||!r) return;q.setSelection(r.index,r.length,'silent');
  if(kind==='rm'){q.formatText(r.index,Math.max(r.length,1),'link',false,'user');return}
  if(kind!=='ok') return;let u=(($('#cpLinkIn')||{}).value||CP.linkVal||'').trim();CP.linkVal='';
  if(!u) return;if(!/^(https?:|mailto:)/i.test(u)) u='https://'+u;
  if(r.length) q.formatText(r.index,r.length,'link',u,'user');else{q.insertText(r.index,u,'link',u,'user');q.setSelection(r.index+u.length,0,'silent')}
  cpToolsState();
}
function cpStartEdit(p){
  const cur=cpCur(p),d=draftGet(p);
  if(d){CP.edit={page:p.id,from:cur?cur.id:null,n:(cur?cur.n:0)+1,html:d.html,acc:Array.isArray(d.acc)?d.acc:[],restored:true};if(d.base&&cur&&d.base!==cur.id) setTimeout(()=>toast(`Your draft started from an earlier version; v${cur.n} came in since`),400)}
  else{let html='',acc=[];
    if(cur){const a=cur.cm.filter(c=>c.kind==='suggest'&&c.status==='accepted'&&!c.done),r=applySug(cur.body,a);html=r.html;acc=r.done.map(c=>c.id);if(r.skip.length) setTimeout(()=>toast(`${plural(r.skip.length,'accepted change')} overlapped another one and ${r.skip.length===1?'was':'were'} left out`),400)}
    CP.edit={page:p.id,from:cur?cur.id:null,n:(cur?cur.n:0)+1,html,acc}}
  CP.sel=null;CP.draft=null;CP.pop=null;CP.menu=null;CP.link=false;render();
}
async function cpCancelEdit(p){
  // a draft picked up from this device counts as unsaved work too
  const changed=CP.edit.restored||(CP.quill&&cpHtml()!==CP.q0);
  if(changed&&!await confirmDlg('Throw away this draft?','What you wrote since the last saved version goes. The versions already saved stay as they are.','Throw away')) return;
  clearTimeout(CP.dt);draftDel(p);CP.edit=null;CP.quill=null;render();
}
function cpSaveEdit(p){
  if(!CP.quill){toast('The editor is still opening');return}
  const html=cpHtml();if(!plainOf(html).trim()){toast('Write something first');return}
  const L=copyOf(p),n=L.reduce((m,v)=>Math.max(m,v.n),0)+1,from=cpById(p,CP.edit.from);
  L.push({id:uid(),n,body:html,src:'written',at:Date.now(),by:me().id,cm:[]});
  if(from) for(const c of from.cm) if(CP.edit.acc.includes(c.id)&&c.status==='accepted'&&!c.done) c.done=n;
  clearTimeout(CP.dt);draftDel(p);CP.edit=null;CP.quill=null;CP.open=L[L.length-1].id;CP.filter='open';touch(p);save();render();toast(`Copy v${n} saved`);
}

/* ---------- uploading: Markdown, Word, text or HTML becomes the next version ---------- */
const CP_EXT=/\.(md|markdown|txt|docx|html?)$/i;
async function fileToHtml(f){
  const ext=(f.name.split('.').pop()||'').toLowerCase();
  if(f.size>5*1048576) throw new Error(`${f.name} is over 5 MB`);
  if(ext==='docx'){await lib('mammoth');const r=await mammoth.convertToHtml({arrayBuffer:await f.arrayBuffer()},{styleMap:['u => u','highlight => mark'],ignoreEmptyParagraphs:true});return r.value}
  const text=await f.text();
  if(ext==='md'||ext==='markdown'||(ext==='txt'&&looksMd(text))){await lib('marked');return mdParse(text)}
  if(ext==='txt') return text.split(/\r?\n\s*\r?\n/).map(b=>`<p>${esc(b).replace(/\r?\n/g,'<br>')}</p>`).join('');
  if(ext==='html'||ext==='htm') return text;
  throw new Error(`${f.name}: upload Markdown, Word (.docx), text or HTML`);
}
async function cpUpload(p,files){
  files=[...files].sort((a,b)=>a.name.localeCompare(b.name));if(!files.length) return;
  if(CP.edit){toast('Save or cancel the version you are writing first');return}
  const bad=files.filter(f=>!CP_EXT.test(f.name));if(bad.length&&bad.length===files.length){toast(/\.doc$/i.test(bad[0].name)?'Save it as .docx in Word first, then upload that':'Upload a Markdown, Word (.docx), text or HTML file');return}
  toast('Reading the file…');const made=[];
  for(const f of files.filter(f=>CP_EXT.test(f.name))){
    try{const html=cleanCopy(await fileToHtml(f));if(!plainOf(html).trim()){toast(`Nothing readable in ${f.name}`);continue}
      const L=copyOf(p),n=L.reduce((m,v)=>Math.max(m,v.n),0)+1;L.push({id:uid(),n,body:html,src:f.name.slice(0,200),at:Date.now(),by:me().id,cm:[]});made.push(n)}
    catch(e){toast(e.message||String(e))}}
  if(!made.length) return;CP.open=made.length===1?cpCur(p).id:null;CP.filter='open';touch(p);save();render();
  toast(made.length===1?`Copy v${made[0]} added from the file`:`Copy v${made.join(', v')} added`);
}
$('#cpFiles').addEventListener('change',e=>{const p=PV.proj&&projById(PV.proj),l=[...e.target.files];e.target.value='';if(p) cpUpload(p,l)});
function cpDrop(dt){const p=PV.proj&&projById(PV.proj);if(p) cpUpload(p,[...dt.files])}

/* ---------- getting it out ---------- */
function cpMd(p,v){return htmlToMd(v.body)}
function cpEscape(){
  if(CP.menu){CP.menu=null;render();return true}
  if(CP.link){cpLinkDone('x');return true}
  if(CP.pop){cpPopHide();getSelection().removeAllRanges();return true}
  if(CP.draft){CP.draft=null;const p=projById(PV.proj);if(p) cpRefresh(p);return true}
  if(CP.reply){CP.reply=null;const p=projById(PV.proj);if(p) cpRefresh(p);return true}
  if(CP.sel&&PV.tab==='copy'){CP.sel=null;const p=projById(PV.proj);if(p) cpRefresh(p);return true}
  if(CP.open&&!SHARE&&!CP.edit){CP.open=null;render();return true}
  return false;
}

/* ---------- clicks ---------- */
$('#vProj').addEventListener('mousedown',e=>{if(e.target.closest('#cpTools .cp-tool,#cpPop')) e.preventDefault()});
// leaving the editor for another tab or page keeps what was typed this second, not only what the last pause saved
$('#vProj').addEventListener('click',e=>{if(CP.quill&&CP.edit&&e.target.closest('[data-pj-tab],#pjBack,[data-crumb],#pjMove')){clearTimeout(CP.dt);const p=projById(CP.edit.page);if(p) cpDraftSave(p)}},true);
$('#vProj').addEventListener('click',async e=>{
  const c=s=>e.target.closest(s);let b;const p=PV.proj&&projById(PV.proj);if(!p||(SHARE?SH.kind!=='copy':PV.tab!=='copy')) return;
  const v=cpShown(p);
  if(c('[data-cp-up]')){$('#cpFiles').click();return}
  if(c('#cpBack')){CP.open=null;CP.sel=null;CP.draft=null;CP.reply=null;CP.menu=null;cpPopHide();render();return}
  if(b=c('[data-cpv-share]')){const x=cpById(p,b.dataset.cpvShare);if(x) openShare(p,x,'copy');return}
  if(b=c('[data-cpv-final]')){const x=cpById(p,b.dataset.cpvFinal);if(x) cpFinal(p,x);return}
  if(b=c('[data-cpv-dl]')){const x=cpById(p,b.dataset.cpvDl);if(x) cpDownload(p,x);return}
  if(b=c('[data-cpv-del]')){const x=cpById(p,b.dataset.cpvDel);if(x) cpDelete(p,x);return}
  if(b=c('[data-cpv-open]')){cpOpenVer(b.dataset.cpvOpen);return}
  if(c('[data-cp-write]')){if(SHARE) return;cpStartEdit(p);return}
  if(c('[data-cp-save]')){cpSaveEdit(p);return}
  if(c('[data-cp-cancel-edit]')){cpCancelEdit(p);return}
  if(b=c('#cpTools [data-fmt]')){cpTool(b.dataset.fmt,b.dataset.val);return}
  if(b=c('[data-cp-link]')){CP.linkVal=(($('#cpLinkIn')||{}).value||'');cpLinkDone(b.dataset.cpLink);return}
  if(c('#cpVerBtn')){CP.menu=CP.menu==='ver'?null:'ver';render();return}
  if(b=c('[data-cpv]')){CP.menu=null;const x=cpById(p,b.dataset.cpv);if(x) cpOpenVer(x.id);return}
  if(c('#cpMore')){CP.menu=CP.menu==='more'?null:'more';render();return}
  if(b=c('[data-cp-do]')){if(!v) return;const k=b.dataset.cpDo;CP.menu=null;
    if(k==='final'){cpFinal(p,v);return}
    if(k==='share'){render();openShare(p,v,'copy');return}
    if(k==='copymd'){render();navigator.clipboard.writeText(cpMd(p,v)).then(()=>toast(`${cpLabel(v)} copied as Markdown`),()=>toast('Could not copy'));return}
    if(k==='dlmd'){render();cpDownload(p,v);return}
    if(k==='del'){render();cpDelete(p,v);return}}
  if(b=c('[data-cp-pop]')){cpStartDraft(b.dataset.cpPop);return}
  if(c('[data-cp-cancel]')){CP.draft=null;cpRefresh(p);return}
  if(c('[data-cp-post]')){cpPost();return}
  if(b=c('[data-cplayer]')){CP.layer=b.dataset.cplayer;CP.sel=null;CP.draft=null;CP.reply=null;cpRefresh(p);return}
  if(b=c('[data-cpfilter]')){CP.filter=b.dataset.cpfilter;CP.sel=null;cpRefresh(p);return}
  if(!v) return;
  const set=(id,st,msg)=>{const x=cpCm(v,id);if(!x) return;x.status=st;touch(p);save();cpRefresh(p);if(msg) toast(msg)};
  if(b=c('[data-cpc-acc]')){set(b.dataset.cpcAcc,'accepted',`Accepted. It goes into v${cpCur(p).n+1} when you edit it.`);return}
  if(b=c('[data-cpc-dec]')){set(b.dataset.cpcDec,'declined','Declined');return}
  if(b=c('[data-cpc-undo]')){set(b.dataset.cpcUndo,'open');return}
  if(b=c('[data-cpc-reopen]')){set(b.dataset.cpcReopen,'open','Reopened');return}
  if(b=c('[data-cpc-res]')){const x=cpCm(v,b.dataset.cpcRes);if(!x) return;const st=x.status==='resolved'?'open':'resolved';if(st==='resolved'&&CP.sel===x.id) CP.sel=null;set(x.id,st,st==='resolved'?'Resolved':'Reopened');return}
  if(b=c('[data-cpc-reply]')){CP.sel=b.dataset.cpcReply;CP.reply=true;CP.replyText='';CP.draft=null;cpRefresh(p);return}
  if(b=c('[data-cpc-send]')){const x=cpCm(v,b.dataset.cpcSend),ta=$('#cpReply');if(!x||!ta) return;const text=ta.value.trim();if(!text){ta.focus();return}
    if(SHARE&&!guestMe().name){askName(()=>b.click());return}
    x.re.push({id:uid(),by:'You',byId:me().id,text,at:Date.now()});CP.reply=null;CP.replyText='';touch(p);save();cpRefresh(p);return}
  if(b=c('[data-cpc-delre]')){const id=b.dataset.cpcDelre;for(const x of v.cm) x.re=(x.re||[]).filter(r=>r.id!==id);touch(p);save();cpRefresh(p);toast('Reply removed');return}
  if(b=c('[data-cpc-del]')){const x=cpCm(v,b.dataset.cpcDel);if(!x) return;v.cm=v.cm.filter(q=>q!==x);if(CP.sel===x.id) CP.sel=null;touch(p);save();cpRefresh(p);toast(x.kind==='suggest'?'Suggestion deleted':'Comment deleted');return}
  if(b=c('[data-cpc]')){if(c('textarea')||c('button')) return;const id=b.dataset.cpc;CP.sel=CP.sel===id?null:id;CP.reply=null;cpRefresh(p);if(CP.sel) cpFocusMark(id);return}
  if(b=c('#cpDoc [data-c]')){if(getSelection&&!getSelection().isCollapsed) return;const id=b.dataset.c.split(' ')[0];if(id==='draft') return;CP.sel=id;CP.reply=null;if(CP.filter!=='all'&&!cpOpen(cpCm(v,id)||{})) CP.filter='all';cpRefresh(p);const card=$(`#cpSide [data-cpc="${id}"]`);if(card) card.scrollIntoView({block:'nearest',behavior:'smooth'});return}
});
$('#vProj').addEventListener('input',e=>{const t=e.target;if(!CP.draft&&t.id!=='cpReply') return;if(t.id==='cpText'||t.id==='cpNote') CP.draft.text=t.value;if(t.id==='cpRep') CP.draft.rep=t.value;if(t.id==='cpReply') CP.replyText=t.value});
$('#vProj').addEventListener('keydown',e=>{
  const t=e.target;
  if(t.id==='cpLinkIn'&&e.key==='Enter'){e.preventDefault();CP.linkVal=t.value;cpLinkDone('ok');return}
  if(t.id==='cpLinkIn'&&e.key==='Escape'){e.preventDefault();e.stopPropagation();cpLinkDone('x');return}
  if(e.key==='Enter'&&!e.shiftKey&&(t.id==='cpText'||t.id==='cpNote')){e.preventDefault();cpPost();return}
  if(e.key==='Enter'&&!e.shiftKey&&t.id==='cpReply'){e.preventDefault();const s=t.parentElement.querySelector('[data-cpc-send]');if(s) s.click();return}
},true);
document.addEventListener('pointerdown',e=>{if(CP.menu&&!(e.target.closest&&e.target.closest('.vpick-wrap,.fd-more'))){CP.menu=null;for(const m of $$('#vProj .cp-vmenu,#vProj .cp-menu')) m.remove();for(const b of $$('#cpVerBtn,#cpMore')) b.setAttribute('aria-expanded','false')}});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='s'&&CP.edit&&$('#cpQuill')){e.preventDefault();const p=projById(CP.edit.page);if(p) cpSaveEdit(p)}});
addEventListener('beforeunload',()=>{if(CP.edit&&CP.quill){const p=projById(CP.edit.page);if(p) cpDraftSave(p)}});

/* ---------- a review link to a copy version: the guest sees the document and the link's comments ---------- */
function renderCopyGuest(){
  const p=projectsOf(team())[0],v=p&&cpCur(p);if(!v) return;cpReset(p);
  $('#vProj').innerHTML=`<header class="top"><div class="ttl-wrap"><h1>${esc(p.name)}</h1><span class="sub">The copy, for review</span></div><div class="topnav"></div></header><div class="pj-body cp-host">${cpReadHtml(p,v)}</div>`;
  cpAfter(p);
}

upgradeCopy();
