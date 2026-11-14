/* Noon redesign mockup · more sample data for the screens built in round 2. Nothing here is read from Supabase. */

/* ---------- copy: real text for one page, versions + comments anchored by quote ---------- */
CV.remake=[
 {n:1,at:9*1440,by:'me',src:'Written in Noon',body:`<h1>One in five crowns comes back. Here is why.</h1><p><em>By the Dandy editorial team · 6 min read</em></p><p>Most practices blame the impression. After looking at over 4,000 remakes across 62 practices, we found the real cause is usually somewhere else, and it costs the average practice $3,200 a month in chair time.</p><h2>The hidden cost nobody tracks</h2><p>A remake is not one lost appointment. It is a second prep check, a second seat, and a patient who starts wondering whether they picked the right dentist.</p><ul><li>Two extra visits for every remake</li><li>38 minutes of chair time each visit</li><li>One in nine patients who never book their next cleaning</li></ul><h2>What the best practices do differently</h2><p>The practices with the lowest remake rates did not buy new scanners. They changed three habits: they scanned before the temporary went on, they sent photos with every case, and they talked to the lab the same day.</p><blockquote>"We stopped guessing. The lab tells us what it sees before the crown is milled." Dr. Amir Haddad, Austin</blockquote><h2>See your own numbers</h2><p>Enter your monthly crown volume and we will show you what remakes cost your practice, and how much of that you can win back.</p>`},
 {n:2,at:5*1440,by:'milo',src:'Uploaded copy-v2.docx',body:`<h1>One in five crowns comes back. Here is why.</h1><p><em>By the Dandy editorial team · 6 min read</em></p><p>Most practices blame the impression. After looking at over 4,000 remakes across 62 practices, we found the real cause is usually somewhere else, and it costs the average practice $3,200 a month in chair time.</p><h2>The hidden cost nobody tracks</h2><p>A remake is never just one lost appointment. It means a second prep check, a second seat, and a patient who starts to wonder whether they picked the right dentist.</p><ul><li>Two extra visits for every remake</li><li>38 minutes of chair time for each visit</li><li>18% of patients who never book their next cleaning</li></ul><h2>What the best practices do differently</h2><p>The practices with the lowest remake rates did not buy new scanners. They changed three habits: they scanned before the temporary went on, they sent photos with every case, and they talked to the lab on the same day.</p><blockquote>"We stopped guessing. The lab tells us what it sees before the crown is milled." Dr. Amir Haddad, Austin</blockquote><h2>See your own numbers</h2><p>Enter your monthly crown volume and we will show you what remakes cost your practice, and how much of that you can win back in a quarter.</p>`},
 {n:3,at:1440+300,by:'milo',src:'Edited in Noon',body:`<h1>One in five crowns comes back. Here is why.</h1><p><em>By the Dandy editorial team · 5 min read</em></p><p>Most practices blame the impression. After looking at over 4,000 remakes across 62 practices, we found the real cause is usually somewhere else, and it costs the average practice <strong>$3,200 a month</strong> in chair time.</p><h2>The hidden cost nobody tracks</h2><p>A remake is never just one lost appointment. It is a second prep check, a second seat, and a patient who quietly wonders whether they picked the right dentist.</p><ul><li>Two extra visits for every remake</li><li>38 minutes of chair time for each visit</li><li>18% of patients who never book their next cleaning</li></ul><h2>What the best practices do differently</h2><p>The practices with the lowest remake rates did not buy new scanners. They changed three habits. They scanned before the temporary went on. They sent photos with every case. And they talked to the lab on the same day.</p><blockquote>"We stopped guessing. The lab tells us what it sees before the crown is milled." Dr. Amir Haddad, Austin</blockquote><h2>See your own numbers</h2><p>Tell us your monthly crown volume. We will show you what remakes cost your practice and how much of it you can win back in one quarter.</p><p><strong>Get your free remake report →</strong></p>`},
];
const CC={remake:{
 3:[
  {n:1,layer:'team',kind:'comment',by:'milo',at:'10 min ago',quote:'over 4,000 remakes',open:true,toMe:true,text:'@Mehmed the research doc says 4,100. Use the exact number?',rep:[]},
  {n:2,layer:'team',kind:'suggest',by:'paul',at:'1 h ago',quote:'somewhere else',to:'outside the impression',open:true,text:'Say where, so it reads less vague.',rep:[]},
  {n:3,layer:'team',kind:'comment',by:'milo',at:'2 h ago',quote:'They changed three habits.',open:true,text:'Love the short sentences here. Keep this rhythm in the last section too.',rep:[{by:'paul',at:'1 h ago',text:'Agreed, done in the CTA paragraph.'}]},
  {n:4,layer:'team',kind:'comment',by:'paul',at:'Yesterday',quote:'5 min read',open:false,text:'Read time dropped after the cuts, updated.',rep:[]},
  {n:1,layer:'client',kind:'comment',by:'guest',guest:'Dr. Lena Patel',at:'1 h ago',quote:'$3,200 a month',open:true,text:'Is this per dentist or per practice? Our office has three.',rep:[]},
 ],
 2:[
  {n:1,layer:'team',kind:'suggest',by:'milo',at:'Nov 8',quote:'It means a second prep check',to:'It is a second prep check',open:false,status:'accepted',text:'Shorter.',rep:[]},
  {n:2,layer:'team',kind:'comment',by:'me',at:'Nov 8',quote:'They changed three habits:',open:false,text:'Break this list into short sentences.',rep:[]},
 ]}};

/* ---------- ads: two pages with batches ---------- */
const AD_HEADS={
 jelly:['30 nights. One jelly.','Wake up looking rested','What Seoul does before bed','Swap five steps for one','Adenosine: 20 years of research','Your skin’s night shift','Fine lines, softer by morning','Sleep. Glow. Repeat.','The jelly dermatologists keep quiet about','Why it sold out twice'],
 p01:['The wand that replaced my facialist','Microcurrent in 5 minutes','Red light, real results','My 40s skin, 6 weeks later','Lift without the needles','The 3 settings that matter','Charged once, used all month','Why estheticians bought one','Before coffee, after wand','Her jawline, week 4','Pairs with the night jelly','Gentle enough for daily','The gift she asked for twice','No more puffy mornings','Under $100, over 1,000 reviews','What 5 minutes a day did','My routine, now 1 step','Tested on 212 women','Feel the tingle, see the lift','Last batch before the holidays']};
const ADS={};
for(const pid of ['jelly','p01']){const heads=AD_HEADS[pid];
  ADS[pid]=heads.map((h,i)=>({id:pid+'-'+(i+1),n:i+1,batch:pid==='p01'?(i<10?1:2):1,head:h,theme:i%6,
    status:pid==='jelly'?(i<4?'approved':i<6?'rejected':'open'):(i<7?'approved':i<11?'rejected':'open'),by:pid==='jelly'?'me':'paul',cm:[]}));}
ADS.p01[12].cm=[{n:1,by:'milo',at:'Yesterday',x:.5,y:.3,open:true,text:'Headline is hard to read on this background.',rep:[]}];
ADS.p01[14].cm=[{n:1,by:'paul',at:'Yesterday',x:.32,y:.8,open:true,text:'"Over 1,000 reviews" needs the real number from the store.',rep:[]},{n:2,by:'milo',at:'Yesterday',x:.72,y:.18,open:false,text:'Logo too small.',rep:[]}];
ADS.jelly[6].cm=[{n:1,by:'milo',at:'2 d ago',x:.5,y:.4,open:false,text:'Love this one.',rep:[]}];

/* ---------- inbox ---------- */
let INBOX=[
 {id:'i1',kind:'mention',by:'milo',at:'10 min ago',day:'Today',unread:true,page:'remake',part:'copy',ver:3,n:1,text:'@Mehmed the research doc says 4,100. Use the exact number?'},
 {id:'i2',kind:'mention',by:'milo',at:'16 min ago',day:'Today',unread:true,page:'remake',part:'design',ver:2,n:1,text:'@Mehmed the headline runs to three lines on tablet. Can "Here is why." drop to its own line?'},
 {id:'i3',kind:'review',by:'guest',guest:'Dr. Lena Patel',at:'1 h ago',day:'Today',unread:true,page:'remake',part:'design',ver:2,n:1,layer:'client',text:'Could the monthly cost on this card be bigger? It is the number our team reacts to.'},
 {id:'i4',kind:'reply',by:'paul',at:'3 h ago',day:'Today',unread:true,page:'jelly',part:'design',ver:4,n:2,text:'Moved the badge under the headline like you asked.'},
 {id:'i5',kind:'assign',by:'paul',at:'5 h ago',day:'Today',unread:false,page:'crown',text:'It is on your list now, due Nov 21.'},
 {id:'i6',kind:'request',by:null,who:'Sara Kim',at:'Yesterday',day:'Yesterday',unread:true,text:'Opened your invite link. They see nothing until you accept.'},
 {id:'i7',kind:'final',by:'milo',at:'Yesterday',day:'Yesterday',unread:false,page:'nine',part:'copy',ver:4,text:'Copy v4 is final.'},
 {id:'i8',kind:'ads',by:'paul',at:'Yesterday',day:'Yesterday',unread:false,page:'p01',text:'Batch 2 is in: 10 ads to approve or reject.'},
 {id:'i9',kind:'task',by:'milo',at:'Nov 11',day:'Earlier',unread:false,task:'t1',page:'remake',text:'Source footnotes for the stats, due Nov 15.'},
];

/* ---------- tasks: one list, people on each row, hiding per task ---------- */
let TASKS=[
 {id:'t1',title:'Source footnotes for the stats',page:'remake',to:['me'],due:'2026-11-15',pri:'high',by:'milo',vis:'all',done:false,notes:'Every number on the page needs a source line under it, same as the copy doc.',cm:[{by:'milo',at:'Nov 11',text:'The 18% and $3,200 figures are the ones the client will ask about.'}]},
 {id:'t2',title:'Remake cost advertorial',page:'remake',to:['me','milo'],due:'2026-11-18',pri:'',by:'me',vis:'all',done:false,auto:true,notes:'',cm:[]},
 {id:'t3',title:'Korean adenosine jelly',page:'jelly',to:['me','milo'],due:'2026-11-14',pri:'',by:'me',vis:'all',done:false,auto:true,notes:'',cm:[]},
 {id:'t4',title:'Send Dandy the design review link',page:'remake',to:['me'],due:'2026-11-13',pri:'',by:'me',vis:'all',done:false,notes:'',cm:[]},
 {id:'t5',title:'Brief Paul on the PDP structure',page:'pdp',to:['me'],due:'2026-11-12',pri:'',by:'me',vis:'only',with:['paul'],done:false,notes:'Short call or a Loom, his choice.',cm:[]},
 {id:'t6',title:'Pick 10 winners from batch 2',page:'p01',to:['me'],due:'2026-11-16',pri:'high',by:'paul',vis:'all',done:false,notes:'',cm:[]},
 {id:'t7',title:'Outline the telehealth landing page',page:'tele',to:['milo'],due:'2026-11-20',pri:'',by:'me',vis:'all',done:false,notes:'',cm:[]},
 {id:'t8',title:'Collect UGC clips for the wand',page:'wandl',to:['paul'],due:'2026-11-19',pri:'',by:'me',vis:'except',hidden:['milo'],done:false,notes:'Surprise for Milo’s listicle.',cm:[]},
 {id:'t9',title:'Holiday gift guide',page:'gift',to:['me','milo'],due:'2026-12-02',pri:'',by:'me',vis:'all',done:false,auto:true,notes:'',cm:[]},
 {id:'t10',title:'Upload copy v3',page:'remake',to:['milo'],due:'2026-11-12',pri:'',by:'me',vis:'all',done:true,doneAt:'Nov 12',notes:'',cm:[]},
 {id:'t11',title:'Invite Paul to the team',page:null,to:['me'],due:null,pri:'',by:'me',vis:'all',done:true,doneAt:'Oct 21',notes:'',cm:[]},
];

/* ---------- team hours (local time) ---------- */
const HOURS={
 me:{tz:'Europe/Sarajevo',off:1,on:[9,17],sleep:[23,7]},
 milo:{tz:'Europe/Lisbon',off:0,on:[10,18],sleep:[0,8]},
 paul:{tz:'America/Toronto',off:-5,on:[9,17],sleep:[23,7]},
};

/* ---------- settings ---------- */
let CATS=[
 {id:'aud',level:'client',name:'Audience',items:['B2B','DTC']},
 {id:'ind',level:'client',name:'Industry',items:['Dental','Beauty','Marketing','Telehealth']},
 {id:'type',level:'page',name:'Page type',items:TYPES.slice()},
 {id:'style',level:'page',name:'Style',items:STYLES.slice()},
];
let API_KEYS=[{id:'k1',name:'Claude Code on my laptop',prefix:'noon_3f9a',created:'Oct 29',last:'Today'}];
const PREFS={h24:true,theme:'light',week:'Monday',name:'Mehmed Elezovic',email:'you@yourteam.com',tz:'Europe/Sarajevo',from:9,to:17};
