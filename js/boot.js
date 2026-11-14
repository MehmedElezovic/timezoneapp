/* Noon redesign mockup · boot: window hooks, demo URL hooks, first render. Loads last. */
let rz;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{layoutFrames();peekThumbs();RESIZE.forEach(f=>f());if(innerWidth<1100!==$('#app').classList.contains('col'))render(true)},60)});
/* demo hooks for screenshots: ?peek=<page id>&cm=<comment n>&task=<id>&sel=<text> */
const QS=new URLSearchParams(location.search);
if(QS.get('peek'))S.peek=QS.get('peek');
if(QS.get('cm')){S.active=+QS.get('cm');if(typeof CP!=='undefined')CP.active=+QS.get('cm')}
if(QS.get('task')&&typeof TK!=='undefined')TK.open=QS.get('task');
if(QS.get('mode')&&typeof CP!=='undefined')CP.mode=QS.get('mode');
if(QS.get('chg')&&typeof CP!=='undefined')CP.chg=true;
if(QS.get('clients'))genClients(+QS.get('clients'));
if(QS.get('client')&&!location.hash)location.hash=clientHash(QS.get('client'));
if(QS.get('ib')&&typeof IB!=='undefined'){IB.sel=QS.get('ib');const i=INBOX.find(x=>x.id===IB.sel);if(i)i.unread=false}
if(QS.get('guest')&&typeof GUEST!=='undefined')GUEST.name=QS.get('guest');
setInterval(()=>{const s=$('.side .you div span');if(s)s.textContent='Sarajevo · '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Sarajevo'})},30000);
render();
