/* ============ sample data (shaped like the real workspace; nothing is read from Supabase) ============ */
const TODAY=new Date(2026,10,13,12);
const P={
  me:{id:'me',name:'Mehmed Elezovic',short:'Mehmed',ini:'ME',city:'Sarajevo'},
  milo:{id:'milo',name:'Milo Steimle',short:'Milo',ini:'MS',city:'Lisbon'},
  paul:{id:'paul',name:'Paul Hwang',short:'Paul',ini:'PH',city:'Toronto'},
};
const CLIENTS=[
  {id:'dandy',name:'Dandy',cats:['B2B','Dental'],folders:['Advertorials','Comparison']},
  {id:'revo',name:'Revomadic',cats:['DTC','Beauty'],folders:['Ads']},
  {id:'sf',name:'StrikeFunnel',cats:['B2B','Marketing'],folders:[]},
];
const TYPES=['Advertorial','Listicle','Comparison','Sales page','Static ads','PDP','Homepage','Landing page'];
const STYLES=['Editorial','Scrappy','Premium'];
let PAGES=[
 {id:'remake',name:'Remake cost advertorial',client:'dandy',folder:'Advertorials',types:['Advertorial'],style:'Editorial',copy:{n:3,final:0,open:4},design:{n:2,final:0,open:5},ads:null,to:['me','milo'],due:'2026-11-18',at:16,by:'milo',star:true,share:true,created:'Nov 3',creator:'me',
  head:'One in five crowns comes back. Here is why.',sub:'Most practices blame the impression. After looking at over 4,000 remakes across 62 practices, we found the real cause is usually somewhere else.'},
 {id:'crown',name:'Crown fit report',client:'dandy',folder:'Advertorials',types:['Advertorial'],style:'Editorial',copy:{n:2,final:0,open:2},design:{n:1,final:0,open:0},ads:null,to:['paul','me'],due:'2026-11-21',at:130,by:'paul',star:false,share:false,created:'Nov 6',creator:'paul',
  head:'What 62 practices taught us about crown fit',sub:'Fit problems rarely start at the lab bench. They start with three habits in the operatory.'},
 {id:'nine',name:'9 reasons practices are switching labs',client:'dandy',folder:null,types:['Listicle'],style:'Scrappy',copy:{n:4,final:4,open:0},design:{n:3,final:3,open:0},ads:null,to:['milo'],due:'2026-11-12',at:1510,by:'me',star:false,share:true,created:'Oct 29',creator:'me',
  head:'9 reasons practices are switching labs this year',sub:'Number 4 surprised us: it is not about price.'},
 {id:'cmpg',name:'Transparent comparison guide',client:'dandy',folder:'Comparison',types:['Comparison'],style:'Premium',copy:{n:1,final:0,open:5},design:{n:0,final:0,open:0},ads:null,to:['me'],due:'2026-11-15',at:190,by:'milo',star:false,share:false,created:'Nov 10',creator:'milo',
  head:'Your current lab vs. Dandy, line by line',sub:'Turnaround, remake rate, pricing and support, side by side with nothing left out.'},
 {id:'branded',name:'Branded sales page',client:'dandy',folder:null,types:['Sales page'],style:'Premium',copy:{n:2,final:2,open:0},design:{n:2,final:0,open:1},ads:null,to:['paul'],due:'2026-11-25',at:3080,by:'paul',star:false,share:true,created:'Nov 1',creator:'paul',
  head:'The lab that shows you its numbers',sub:'Remake rates, turnaround and pricing, published every month.'},
 {id:'jelly',name:'Korean adenosine jelly',client:'revo',folder:null,types:['Advertorial'],style:'Editorial',copy:{n:3,final:3,open:0},design:{n:4,final:0,open:3},ads:{n:10,ok:4,open:0},to:['me','milo'],due:'2026-11-14',at:40,by:'me',star:true,share:true,created:'Oct 22',creator:'me',
  head:'The Korean night jelly dermatologists keep quiet about',sub:'Adenosine has 20 years of research behind it. Here is what happened after 30 nights.'},
 {id:'wandl',name:'Genie Smart Wand listicle',client:'revo',folder:null,types:['Listicle'],style:'Scrappy',copy:{n:2,final:0,open:6},design:{n:1,final:0,open:0},ads:null,to:['milo'],due:'2026-11-20',at:300,by:'milo',star:false,share:false,created:'Nov 7',creator:'milo',
  head:'7 reasons women over 40 are switching to this wand',sub:'Number 3 is why it sold out twice.'},
 {id:'p01',name:'PAGE 01 statics',client:'revo',folder:'Ads',types:['Static ads'],style:'Scrappy',copy:{n:0,final:0,open:0},design:{n:0,final:0,open:0},ads:{n:20,ok:7,open:2},to:['me'],due:'2026-11-16',at:1600,by:'paul',star:false,share:false,created:'Nov 9',creator:'paul',
  head:'',sub:''},
 {id:'gift',name:'Holiday gift guide',client:'revo',folder:null,types:['Listicle'],style:'Scrappy',copy:{n:0,final:0,open:0},design:{n:0,final:0,open:0},ads:null,to:['me','milo'],due:'2026-12-02',at:900,by:'me',star:false,share:false,created:'Nov 13',creator:'me',
  head:'The 6 gifts she will actually use this winter',sub:'Number 2 sold out last December.'},
 {id:'pdp',name:'Genie Smart Wand PDP',client:'revo',folder:null,types:['PDP'],style:'Premium',copy:{n:1,final:0,open:0},design:{n:0,final:0,open:0},ads:null,to:['paul'],due:'2026-11-11',at:4400,by:'paul',star:false,share:false,created:'Nov 4',creator:'paul',
  head:'Genie Smart Wand',sub:'Microcurrent, red light and a jelly that works with both.'},
 {id:'sfhome',name:'StrikeFunnels homepage',client:'sf',folder:null,types:['Homepage'],style:'Premium',copy:{n:5,final:5,open:0},design:{n:6,final:0,open:2},ads:null,to:['me'],due:'2026-11-19',at:70,by:'me',star:false,share:false,created:'Oct 14',creator:'me',
  head:'Landing pages that pay for themselves',sub:'Research, copy, design and testing from one team that ships every week.'},
 {id:'tele',name:'Telehealth landing page',client:'sf',folder:null,types:['Landing page'],style:'Editorial',copy:{n:0,final:0,open:0},design:{n:0,final:0,open:0},ads:null,to:['milo','me'],due:'2026-11-28',at:2950,by:'milo',star:false,share:false,created:'Nov 11',creator:'milo',
  head:'See a licensed provider today, from home',sub:'Real care, real prescriptions, no waiting room.'},
];
/* the one page with real files: design versions + comments */
const DV={remake:[{n:1,file:'v1.html',at:7*1440+200,by:'milo'},{n:2,file:'v2.html',at:16,by:'milo'}]};
const CM={remake:{
 2:[
  {n:1,layer:'team',by:'milo',at:'16 min ago',sel:'#hero-title',x:.62,y:.2,open:true,toMe:true,text:'@Mehmed the headline runs to three lines on tablet. Can "Here is why." drop to its own line?',rep:[]},
  {n:2,layer:'team',by:'milo',at:'14 min ago',sel:'#cta-main',x:.85,y:.5,open:true,text:'Button now matches copy v3. Make it full width on phone?',rep:[{by:'paul',at:'9 min ago',text:'Yes, full width under 480px.'}]},
  {n:3,layer:'team',by:'paul',at:'2 h ago',sel:'#proof',x:.18,y:.5,open:true,text:'The 18% stat needs the same source footnote as the copy doc.',rep:[]},
  {n:4,layer:'team',by:'milo',at:'Yesterday',sel:'#s2',x:.1,y:.12,open:true,text:'Spacing between sections feels tighter than v1. Bring back the 64px gap?',rep:[]},
  {n:5,layer:'team',by:'paul',at:'Yesterday',sel:'#top',x:.08,y:.5,open:false,text:'Logo looks small next to the date.',rep:[{by:'milo',at:'Yesterday',text:'Bumped to 20px.'}]},
  {n:1,layer:'client',by:'guest',guest:'Dr. Lena Patel',at:'1 h ago',sel:'.visual',x:.5,y:.75,open:true,text:'Could the monthly cost on this card be bigger? It is the number our team reacts to.',rep:[]},
 ],
 1:[
  {n:1,layer:'team',by:'paul',at:'Nov 6',sel:'#cta-main',x:.8,y:.5,open:false,text:'CTA should match the copy doc wording.',rep:[]},
  {n:2,layer:'team',by:'milo',at:'Nov 6',sel:'#hero-title',x:.3,y:.3,open:false,text:'H1 at 50px is too big, try 44px.',rep:[]},
 ]}};
const CV={remake:[{n:1,at:9*1440,by:'me'},{n:2,at:5*1440,by:'milo'},{n:3,at:1440+300,by:'milo'}]};

