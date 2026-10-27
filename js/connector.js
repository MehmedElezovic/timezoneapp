/* Noon · Settings › Claude. Personal keys for the Claude connector, the MCP server in supabase/functions/noon-mcp.
   A key is made here in the browser and shown once; Noon stores only its SHA-256, so a lost key is replaced, not shown
   again. Claude then reads projects and comments, uploads the next version and resolves comments, as this person. */
const MCP_URL=`${SB_URL}/functions/v1/noon-mcp`;
const CL={keys:null,loading:false,fresh:null};
async function sha256hex(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const clCmd=k=>`claude mcp add --scope user --transport http noon ${MCP_URL} --header "Authorization: Bearer ${k}"`;
const clUrl=k=>`${MCP_URL}/${k}`;
async function loadKeys(){
  CL.loading=true;
  const {data,error}=await sb.from('api_tokens').select('id,name,hint,created_at,last_used_at').order('created_at',{ascending:false});
  CL.loading=false;CL.keys=error?[]:(data||[]);if(error) console.warn('keys',error);
  if(UI.setPage==='claude'&&$('#dSettings').open) renderClaude();
}
function renderClaude(){
  const el=$('#setClaude');if(!el) return;const u=typeof user==='function'?user():null;
  const intro=`<h2>Claude</h2><p class="hint">Connect Claude to your projects. Ask it to apply the open comments on a project and it reads the latest page with every comment, makes the changes, and uploads the result as the next version, with the comments it handled resolved. You compare the two in Noon as usual.</p>`;
  if(!u){el.innerHTML=intro+`<p class="hint">Claude works in your projects as you, so it needs your account.</p><div class="dlg-acts" style="justify-content:flex-start"><button type="button" class="btn dark" data-auth-open="login">Log in</button><button type="button" class="btn" data-auth-open="register">Create account</button></div>`;return}
  if(!CLOUD.shareCols){el.innerHTML=intro+`<p class="hint">The connector needs the latest database update, and it is not there yet. Reload the page; if this stays, the update has not run.</p>`;return}
  if(CL.keys===null&&!CL.loading) loadKeys();
  const k=CL.fresh,keys=CL.keys||[];
  el.innerHTML=intro+(k?`<div class="cl-fresh"><b>Your new key</b><small>Copy it now. Noon keeps only a fingerprint of it, so it cannot show it again.</small>
      <div class="copyrow"><input readonly value="${esc(k)}" aria-label="Key"><button type="button" class="btn dark" data-cl-copy="key">Copy</button></div>
      <h3>In the Claude desktop app's Code tab, or Claude Code</h3><p class="hint">Run this once in a terminal. Claude can use Noon in every project after that.</p>
      <div class="copyrow"><input readonly value="${esc(clCmd(k))}" aria-label="Command"><button type="button" class="btn" data-cl-copy="cmd">Copy</button></div>
      <h3>In Claude chat, on claude.ai or the desktop app</h3><p class="hint">Settings › Connectors › Add custom connector, then paste this address. It has your key in it, so keep it to yourself.</p>
      <div class="copyrow"><input readonly value="${esc(clUrl(k))}" aria-label="Connector address"><button type="button" class="btn" data-cl-copy="url">Copy</button></div></div>`:'')
    +`<h3>Keys</h3>${CL.keys===null?'<p class="hint">Loading…</p>':keys.length?keys.map(x=>`<div class="integ"><div class="ico">${I.link||'K'}</div><div><b>${esc(x.name)} · ends in ${esc(x.hint||'????')}</b><small>Made ${esc(agoLabel(msOf(x.created_at)))} · ${x.last_used_at?`last used ${esc(agoLabel(msOf(x.last_used_at)))}`:'not used yet'}</small></div><button type="button" class="btn sm ghost danger" data-cl-del="${x.id}">Remove</button></div>`).join(''):'<p class="hint">No keys yet.</p>'}
    <div class="dlg-acts" style="justify-content:flex-start"><button type="button" class="btn dark" id="clNew">${keys.length?'Make another key':'Make a key'}</button></div>
    <h3>Then ask Claude</h3><p class="hint">“Apply the open comments on Lumen launch in Noon and upload it as the next version.” Claude finds the project by its name. You can also paste a project's link: the link button in the project's header copies it.</p>`;
}
$('#dSettings').addEventListener('click',async e=>{
  const c=s=>e.target.closest(s);let b;
  if(c('#clNew')){
    const key='noon_'+randKey(32),btn=c('#clNew');btn.disabled=true;
    const {error}=await sb.from('api_tokens').insert({name:'Claude',token_hash:await sha256hex(key),hint:key.slice(-4)});
    btn.disabled=false;if(error){toast('Could not make a key: '+error.message);return}
    CL.fresh=key;CL.keys=null;renderClaude();toast('Key made. Copy it now: it is shown only once.');return}
  if(b=c('[data-cl-copy]')){const v=b.dataset.clCopy==='key'?CL.fresh:b.dataset.clCopy==='cmd'?clCmd(CL.fresh):clUrl(CL.fresh);navigator.clipboard.writeText(v).then(()=>toast('Copied'),()=>toast('Press Ctrl+C to copy'));return}
  if(b=c('[data-cl-del]')){if(!await confirmDlg('Remove this key?','Claude stops reaching Noon with it straight away. Anywhere it is set up needs a new key.','Remove key')) return;
    const {error}=await sb.from('api_tokens').delete().eq('id',b.dataset.clDel);if(error){toast('Could not remove it: '+error.message);return}
    CL.keys=null;CL.fresh=null;renderClaude();toast('Key removed');return}
});
$('#dSettings').addEventListener('close',()=>{if(CL.fresh){CL.fresh=null}CL.keys=null});
