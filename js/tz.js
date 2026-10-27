/* Noon · timezone data and search. Ported from the previous build: cities, countries, codes like CET, offsets like UTC+2. */
function validTz(z){try{new Intl.DateTimeFormat('en-US',{timeZone:z});return !!z}catch(e){return false}}
/* ---------- timezone search: cities, countries, codes like CET, and offsets like UTC+2 ----------
   People type what they know. The field shows a friendly place name; underneath it keeps the real zone. */
const TZ_COUNTRIES=`Afghanistan||Asia/Kabul
Albania||Europe/Tirane
Algeria||Africa/Algiers
Argentina||America/Argentina/Buenos_Aires
Armenia||Asia/Yerevan
Australia||Australia/Sydney Australia/Melbourne Australia/Brisbane Australia/Adelaide Australia/Perth Australia/Darwin Australia/Hobart
Austria||Europe/Vienna
Azerbaijan||Asia/Baku
Bahrain||Asia/Bahrain
Bangladesh||Asia/Dhaka
Belarus||Europe/Minsk
Belgium||Europe/Brussels
Bolivia||America/La_Paz
Bosnia and Herzegovina|Bosnia;BiH;Herzegovina|Europe/Sarajevo
Brazil||America/Sao_Paulo America/Manaus America/Fortaleza America/Noronha
Bulgaria||Europe/Sofia
Cambodia||Asia/Phnom_Penh
Cameroon||Africa/Douala
Canada||America/Toronto America/Vancouver America/Edmonton America/Winnipeg America/Halifax America/St_Johns America/Regina
Chile||America/Santiago
China|PRC|Asia/Shanghai
Colombia||America/Bogota
Costa Rica||America/Costa_Rica
Croatia|Hrvatska|Europe/Zagreb
Cuba||America/Havana
Cyprus||Asia/Nicosia
Czechia|Czech Republic|Europe/Prague
Denmark||Europe/Copenhagen
Dominican Republic||America/Santo_Domingo
Ecuador||America/Guayaquil
Egypt||Africa/Cairo
El Salvador||America/El_Salvador
Estonia||Europe/Tallinn
Ethiopia||Africa/Addis_Ababa
Finland||Europe/Helsinki
France||Europe/Paris
Georgia||Asia/Tbilisi
Germany|Deutschland|Europe/Berlin
Ghana||Africa/Accra
Greece||Europe/Athens
Guatemala||America/Guatemala
Honduras||America/Tegucigalpa
Hong Kong||Asia/Hong_Kong
Hungary||Europe/Budapest
Iceland||Atlantic/Reykjavik
India||Asia/Kolkata
Indonesia||Asia/Jakarta Asia/Makassar Asia/Jayapura
Iran||Asia/Tehran
Iraq||Asia/Baghdad
Ireland||Europe/Dublin
Israel||Asia/Jerusalem
Italy|Italia|Europe/Rome
Jamaica||America/Jamaica
Japan||Asia/Tokyo
Jordan||Asia/Amman
Kazakhstan||Asia/Almaty
Kenya||Africa/Nairobi
Kuwait||Asia/Kuwait
Latvia||Europe/Riga
Lebanon||Asia/Beirut
Lithuania||Europe/Vilnius
Luxembourg||Europe/Luxembourg
Malaysia||Asia/Kuala_Lumpur
Malta||Europe/Malta
Mexico||America/Mexico_City America/Cancun America/Tijuana
Moldova||Europe/Chisinau
Montenegro||Europe/Podgorica
Morocco||Africa/Casablanca
Nepal||Asia/Kathmandu
Netherlands|Holland;The Netherlands|Europe/Amsterdam
New Zealand|NZ|Pacific/Auckland
Nigeria||Africa/Lagos
North Macedonia|Macedonia|Europe/Skopje
Norway||Europe/Oslo
Oman||Asia/Muscat
Pakistan||Asia/Karachi
Panama||America/Panama
Paraguay||America/Asuncion
Peru||America/Lima
Philippines||Asia/Manila
Poland|Polska|Europe/Warsaw
Portugal||Europe/Lisbon Atlantic/Azores
Puerto Rico||America/Puerto_Rico
Qatar||Asia/Qatar
Romania||Europe/Bucharest
Russia||Europe/Moscow Asia/Yekaterinburg Asia/Novosibirsk Asia/Vladivostok Europe/Kaliningrad
Rwanda||Africa/Kigali
Saudi Arabia|KSA|Asia/Riyadh
Senegal||Africa/Dakar
Serbia|Srbija|Europe/Belgrade
Kosovo||Europe/Belgrade
Singapore||Asia/Singapore
Slovakia||Europe/Bratislava
Slovenia||Europe/Ljubljana
South Africa|RSA|Africa/Johannesburg
South Korea|Korea;Republic of Korea|Asia/Seoul
Spain|España;Espana|Europe/Madrid Atlantic/Canary
Sri Lanka||Asia/Colombo
Sweden||Europe/Stockholm
Switzerland|Schweiz;Suisse|Europe/Zurich
Taiwan||Asia/Taipei
Tanzania||Africa/Dar_es_Salaam
Thailand||Asia/Bangkok
Tunisia||Africa/Tunis
Turkey|Türkiye;Turkiye|Europe/Istanbul
Uganda||Africa/Kampala
Ukraine||Europe/Kyiv
United Arab Emirates|UAE;Emirates|Asia/Dubai
United Kingdom|UK;Britain;Great Britain;England;Scotland;Wales|Europe/London
United States|USA;US;America;United States of America|America/New_York America/Chicago America/Denver America/Phoenix America/Los_Angeles America/Anchorage Pacific/Honolulu
Uruguay||America/Montevideo
Uzbekistan||Asia/Tashkent
Venezuela||America/Caracas
Vietnam|Viet Nam|Asia/Ho_Chi_Minh
Zimbabwe||Africa/Harare`.split('\n').map(l=>{const [n,a,z]=l.split('|');return {n,alias:a?a.split(';'):[],zones:z.split(' ')}});
// cities people know that are not the name of their zone
const TZ_CITIES=`LA,SF,San Francisco,Seattle,San Diego,Las Vegas,Portland,San Jose,Sacramento=America/Los_Angeles
NYC,Boston,Washington,Washington DC,Miami,Atlanta,Philadelphia,Orlando,Pittsburgh,Charlotte,Baltimore=America/New_York
Dallas,Houston,Austin,San Antonio,New Orleans,Minneapolis,Nashville,Kansas City,St Louis=America/Chicago
Salt Lake City,Albuquerque,Boulder=America/Denver
Montreal,Ottawa,Quebec=America/Toronto
Calgary=America/Edmonton
Rio de Janeiro,Rio,Brasilia,Belo Horizonte=America/Sao_Paulo
Guadalajara,Monterrey=America/Mexico_City
Munich,Frankfurt,Hamburg,Cologne,Stuttgart,Dusseldorf=Europe/Berlin
Manchester,Edinburgh,Birmingham,Glasgow,Liverpool,Bristol,Leeds=Europe/London
Barcelona,Valencia,Seville,Malaga=Europe/Madrid
Milan,Naples,Turin,Florence,Venice=Europe/Rome
Lyon,Marseille,Nice,Toulouse,Bordeaux=Europe/Paris
Rotterdam,The Hague,Utrecht=Europe/Amsterdam
Geneva,Basel,Bern,Lausanne=Europe/Zurich
Krakow,Wroclaw,Gdansk,Poznan=Europe/Warsaw
Porto=Europe/Lisbon
Novi Sad,Nis,Pristina=Europe/Belgrade
Mostar,Banja Luka,Tuzla=Europe/Sarajevo
Split,Rijeka=Europe/Zagreb
Saint Petersburg,St Petersburg=Europe/Moscow
Kiev,Lviv,Odesa,Odessa,Kharkiv=Europe/Kyiv
Ankara,Izmir,Antalya=Europe/Istanbul
Tel Aviv,Haifa=Asia/Jerusalem
Abu Dhabi,Sharjah=Asia/Dubai
Jeddah,Mecca=Asia/Riyadh
Mumbai,Bombay,Delhi,New Delhi,Bangalore,Bengaluru,Chennai,Hyderabad,Pune,Calcutta=Asia/Kolkata
Lahore,Islamabad=Asia/Karachi
Beijing,Shenzhen,Guangzhou,Chengdu,Hangzhou=Asia/Shanghai
Osaka,Kyoto,Yokohama=Asia/Tokyo
Busan=Asia/Seoul
Hanoi,Saigon,Ho Chi Minh City=Asia/Ho_Chi_Minh
Bali,Denpasar=Asia/Makassar
Phuket,Chiang Mai=Asia/Bangkok
Cape Town,Durban,Pretoria=Africa/Johannesburg
Abuja=Africa/Lagos
Marrakesh,Marrakech,Rabat=Africa/Casablanca
Canberra,Gold Coast=Australia/Sydney
Wellington,Christchurch=Pacific/Auckland`.split('\n').flatMap(l=>{const [c,z]=l.split('=');return c.split(',').map(n=>({n,z}))});
// codes and the zones they most often mean, in order
const TZ_CODES={UTC:['UTC'],GMT:['UTC','Europe/London'],Z:['UTC'],ZULU:['UTC'],
  CET:['Europe/Berlin','Europe/Paris','Europe/Belgrade'],CEST:['Europe/Berlin','Europe/Paris','Europe/Belgrade'],
  WET:['Europe/Lisbon'],WEST:['Europe/Lisbon'],EET:['Europe/Athens','Europe/Helsinki','Europe/Bucharest'],EEST:['Europe/Athens','Europe/Helsinki','Europe/Bucharest'],
  BST:['Europe/London'],IST:['Asia/Kolkata','Europe/Dublin','Asia/Jerusalem'],MSK:['Europe/Moscow'],TRT:['Europe/Istanbul'],
  ET:['America/New_York'],EST:['America/New_York'],EDT:['America/New_York'],CT:['America/Chicago'],CST:['America/Chicago','Asia/Shanghai'],CDT:['America/Chicago'],
  MT:['America/Denver'],MST:['America/Denver','America/Phoenix'],MDT:['America/Denver'],PT:['America/Los_Angeles'],PST:['America/Los_Angeles'],PDT:['America/Los_Angeles'],
  AKST:['America/Anchorage'],AKDT:['America/Anchorage'],HST:['Pacific/Honolulu'],AST:['America/Halifax','Asia/Riyadh'],ADT:['America/Halifax'],NST:['America/St_Johns'],
  BRT:['America/Sao_Paulo'],ART:['America/Argentina/Buenos_Aires'],
  JST:['Asia/Tokyo'],KST:['Asia/Seoul'],HKT:['Asia/Hong_Kong'],SGT:['Asia/Singapore'],PHT:['Asia/Manila'],WIB:['Asia/Jakarta'],ICT:['Asia/Bangkok','Asia/Ho_Chi_Minh'],
  PKT:['Asia/Karachi'],GST:['Asia/Dubai'],AEST:['Australia/Sydney','Australia/Brisbane'],AEDT:['Australia/Sydney'],ACST:['Australia/Adelaide'],AWST:['Australia/Perth'],
  NZST:['Pacific/Auckland'],NZDT:['Pacific/Auckland'],SAST:['Africa/Johannesburg'],EAT:['Africa/Nairobi'],WAT:['Africa/Lagos'],CAT:['Africa/Harare']};
const TZ_REGIONS=[{"n":"Connecticut","full":"Connecticut","ab":["CT"],"c":"United States","z":"America/New_York"},{"n":"Delaware","full":"Delaware","ab":["DE"],"c":"United States","z":"America/New_York"},{"n":"Georgia","full":"Georgia State","ab":[],"c":"United States","z":"America/New_York"},{"n":"Maine","full":"Maine","ab":["ME"],"c":"United States","z":"America/New_York"},{"n":"Maryland","full":"Maryland","ab":["MD"],"c":"United States","z":"America/New_York"},{"n":"Massachusetts","full":"Massachusetts","ab":["MA"],"c":"United States","z":"America/New_York"},{"n":"New Hampshire","full":"New Hampshire","ab":["NH"],"c":"United States","z":"America/New_York"},{"n":"New Jersey","full":"New Jersey","ab":["NJ"],"c":"United States","z":"America/New_York"},{"n":"New York","full":"New York State","ab":["NY"],"c":"United States","z":"America/New_York"},{"n":"North Carolina","full":"North Carolina","ab":["NC"],"c":"United States","z":"America/New_York"},{"n":"Ohio","full":"Ohio","ab":["OH"],"c":"United States","z":"America/New_York"},{"n":"Pennsylvania","full":"Pennsylvania","ab":["PA"],"c":"United States","z":"America/New_York"},{"n":"Rhode Island","full":"Rhode Island","ab":["RI"],"c":"United States","z":"America/New_York"},{"n":"South Carolina","full":"South Carolina","ab":["SC"],"c":"United States","z":"America/New_York"},{"n":"Vermont","full":"Vermont","ab":["VT"],"c":"United States","z":"America/New_York"},{"n":"Virginia","full":"Virginia","ab":["VA"],"c":"United States","z":"America/New_York"},{"n":"West Virginia","full":"West Virginia","ab":["WV"],"c":"United States","z":"America/New_York"},{"n":"District of Columbia","full":"District of Columbia","ab":["DC"],"c":"United States","z":"America/New_York"},{"n":"Florida","full":"Florida","ab":["FL"],"c":"United States","z":"America/New_York"},{"n":"Michigan","full":"Michigan","ab":["MI"],"c":"United States","z":"America/New_York"},{"n":"Indiana","full":"Indiana","ab":["IN"],"c":"United States","z":"America/New_York"},{"n":"Kentucky","full":"Kentucky","ab":["KY"],"c":"United States","z":"America/New_York"},{"n":"Texas","full":"Texas","ab":["TX"],"c":"United States","z":"America/Chicago"},{"n":"Illinois","full":"Illinois","ab":["IL"],"c":"United States","z":"America/Chicago"},{"n":"Alabama","full":"Alabama","ab":["AL"],"c":"United States","z":"America/Chicago"},{"n":"Arkansas","full":"Arkansas","ab":["AR"],"c":"United States","z":"America/Chicago"},{"n":"Iowa","full":"Iowa","ab":["IA"],"c":"United States","z":"America/Chicago"},{"n":"Kansas","full":"Kansas","ab":["KS"],"c":"United States","z":"America/Chicago"},{"n":"Louisiana","full":"Louisiana","ab":["LA"],"c":"United States","z":"America/Chicago"},{"n":"Minnesota","full":"Minnesota","ab":["MN"],"c":"United States","z":"America/Chicago"},{"n":"Mississippi","full":"Mississippi","ab":["MS"],"c":"United States","z":"America/Chicago"},{"n":"Missouri","full":"Missouri","ab":["MO"],"c":"United States","z":"America/Chicago"},{"n":"Nebraska","full":"Nebraska","ab":["NE"],"c":"United States","z":"America/Chicago"},{"n":"North Dakota","full":"North Dakota","ab":["ND"],"c":"United States","z":"America/Chicago"},{"n":"Oklahoma","full":"Oklahoma","ab":["OK"],"c":"United States","z":"America/Chicago"},{"n":"South Dakota","full":"South Dakota","ab":["SD"],"c":"United States","z":"America/Chicago"},{"n":"Tennessee","full":"Tennessee","ab":["TN"],"c":"United States","z":"America/Chicago"},{"n":"Wisconsin","full":"Wisconsin","ab":["WI"],"c":"United States","z":"America/Chicago"},{"n":"Colorado","full":"Colorado","ab":["CO"],"c":"United States","z":"America/Denver"},{"n":"Montana","full":"Montana","ab":["MT"],"c":"United States","z":"America/Denver"},{"n":"New Mexico","full":"New Mexico","ab":["NM"],"c":"United States","z":"America/Denver"},{"n":"Utah","full":"Utah","ab":["UT"],"c":"United States","z":"America/Denver"},{"n":"Wyoming","full":"Wyoming","ab":["WY"],"c":"United States","z":"America/Denver"},{"n":"Idaho","full":"Idaho","ab":["ID"],"c":"United States","z":"America/Denver"},{"n":"Arizona","full":"Arizona","ab":["AZ"],"c":"United States","z":"America/Phoenix"},{"n":"California","full":"California","ab":["CA"],"c":"United States","z":"America/Los_Angeles"},{"n":"Nevada","full":"Nevada","ab":["NV"],"c":"United States","z":"America/Los_Angeles"},{"n":"Oregon","full":"Oregon","ab":["OR"],"c":"United States","z":"America/Los_Angeles"},{"n":"Washington","full":"Washington State","ab":["WA"],"c":"United States","z":"America/Los_Angeles"},{"n":"Alaska","full":"Alaska","ab":["AK"],"c":"United States","z":"America/Anchorage"},{"n":"Hawaii","full":"Hawaii","ab":["HI"],"c":"United States","z":"Pacific/Honolulu"},{"n":"Ontario","full":"Ontario","ab":["ON"],"c":"Canada","z":"America/Toronto"},{"n":"Quebec","full":"Quebec","ab":["QC"],"c":"Canada","z":"America/Toronto"},{"n":"British Columbia","full":"British Columbia","ab":["BC"],"c":"Canada","z":"America/Vancouver"},{"n":"Alberta","full":"Alberta","ab":["AB"],"c":"Canada","z":"America/Edmonton"},{"n":"Manitoba","full":"Manitoba","ab":["MB"],"c":"Canada","z":"America/Winnipeg"},{"n":"Saskatchewan","full":"Saskatchewan","ab":["SK"],"c":"Canada","z":"America/Regina"},{"n":"Nova Scotia","full":"Nova Scotia","ab":["NS"],"c":"Canada","z":"America/Halifax"},{"n":"New Brunswick","full":"New Brunswick","ab":["NB"],"c":"Canada","z":"America/Halifax"},{"n":"Prince Edward Island","full":"Prince Edward Island","ab":["PEI"],"c":"Canada","z":"America/Halifax"},{"n":"Newfoundland","full":"Newfoundland","ab":["NL"],"c":"Canada","z":"America/St_Johns"},{"n":"New South Wales","full":"New South Wales","ab":["NSW"],"c":"Australia","z":"Australia/Sydney"},{"n":"Victoria","full":"Victoria","ab":["VIC"],"c":"Australia","z":"Australia/Melbourne"},{"n":"Queensland","full":"Queensland","ab":["QLD"],"c":"Australia","z":"Australia/Brisbane"},{"n":"South Australia","full":"South Australia","ab":[],"c":"Australia","z":"Australia/Adelaide"},{"n":"Western Australia","full":"Western Australia","ab":["WA Australia"],"c":"Australia","z":"Australia/Perth"},{"n":"Northern Territory","full":"Northern Territory","ab":[],"c":"Australia","z":"Australia/Darwin"},{"n":"Tasmania","full":"Tasmania","ab":["TAS"],"c":"Australia","z":"Australia/Hobart"},{"n":"Sao Paulo","full":"Sao Paulo State","ab":[],"c":"Brazil","z":"America/Sao_Paulo"},{"n":"Rio de Janeiro","full":"Rio de Janeiro State","ab":[],"c":"Brazil","z":"America/Sao_Paulo"},{"n":"Minas Gerais","full":"Minas Gerais","ab":[],"c":"Brazil","z":"America/Sao_Paulo"},{"n":"Quintana Roo","full":"Quintana Roo","ab":[],"c":"Mexico","z":"America/Cancun"},{"n":"Yucatan","full":"Yucatan","ab":[],"c":"Mexico","z":"America/Cancun"},{"n":"Baja California","full":"Baja California","ab":[],"c":"Mexico","z":"America/Tijuana"},{"n":"Maharashtra","full":"Maharashtra","ab":[],"c":"India","z":"Asia/Kolkata"},{"n":"Karnataka","full":"Karnataka","ab":[],"c":"India","z":"Asia/Kolkata"},{"n":"Tamil Nadu","full":"Tamil Nadu","ab":[],"c":"India","z":"Asia/Kolkata"},{"n":"Kerala","full":"Kerala","ab":[],"c":"India","z":"Asia/Kolkata"},{"n":"Goa","full":"Goa","ab":[],"c":"India","z":"Asia/Kolkata"},{"n":"Punjab","full":"Punjab","ab":[],"c":"India","z":"Asia/Kolkata"},{"n":"Gujarat","full":"Gujarat","ab":[],"c":"India","z":"Asia/Kolkata"},{"n":"West Bengal","full":"West Bengal","ab":[],"c":"India","z":"Asia/Kolkata"},{"n":"Canary Islands","full":"Canary Islands","ab":["Tenerife","Gran Canaria"],"c":"Spain","z":"Atlantic/Canary"},{"n":"Azores","full":"Azores","ab":[],"c":"Portugal","z":"Atlantic/Azores"}];
const TZ_ZONES=[['Pacific/Kiritimati','LINT'],['Pacific/Tongatapu','TOT'],['Pacific/Chatham','CHAST','CHADT'],['Pacific/Auckland','NZST','NZDT'],['Pacific/Fiji','FJT'],['Pacific/Noumea','NCT'],['Australia/Lord_Howe','LHST','LHDT'],['Australia/Sydney','AEST','AEDT'],['Australia/Brisbane','AEST'],['Pacific/Guam','ChST'],['Australia/Adelaide','ACST','ACDT'],['Australia/Darwin','ACST'],['Asia/Tokyo','JST'],['Asia/Seoul','KST'],['Australia/Eucla','ACWST'],['Asia/Shanghai','CST'],['Asia/Hong_Kong','HKT'],['Asia/Singapore','SGT'],['Asia/Manila','PHT'],['Australia/Perth','AWST'],['Asia/Bangkok','ICT'],['Asia/Jakarta','WIB'],['Asia/Yangon','MMT'],['Asia/Dhaka','BST'],['Asia/Almaty','ALMT'],['Asia/Kathmandu','NPT'],['Asia/Kolkata','IST'],['Asia/Karachi','PKT'],['Asia/Tashkent','UZT'],['Asia/Kabul','AFT'],['Asia/Dubai','GST'],['Asia/Baku','AZT'],['Asia/Tehran','IRST'],['Europe/Moscow','MSK'],['Europe/Istanbul','TRT'],['Asia/Riyadh','AST'],['Africa/Nairobi','EAT'],['Europe/Athens','EET','EEST'],['Africa/Cairo','EET','EEST'],['Africa/Johannesburg','SAST'],['Africa/Maputo','CAT'],['Europe/Berlin','CET','CEST'],['Africa/Lagos','WAT'],['Europe/London','GMT','BST'],['Europe/Lisbon','WET','WEST'],['UTC','UTC'],['Atlantic/Azores','AZOT','AZOST'],['Atlantic/Cape_Verde','CVT'],['America/Noronha','FNT'],['America/Sao_Paulo','BRT'],['America/Argentina/Buenos_Aires','ART'],['America/St_Johns','NST','NDT'],['America/Halifax','AST','ADT'],['America/Caracas','VET'],['America/Santiago','CLT','CLST'],['America/New_York','EST','EDT'],['America/Bogota','COT'],['America/Lima','PET'],['America/Chicago','CST','CDT'],['America/Mexico_City','CST'],['America/Denver','MST','MDT'],['America/Phoenix','MST'],['America/Los_Angeles','PST','PDT'],['America/Anchorage','AKST','AKDT'],['Pacific/Marquesas','MART'],['Pacific/Honolulu','HST'],['Pacific/Pago_Pago','SST']];
const tzSummer=z=>{const y=new Date().getUTCFullYear(),a=tzOffset(z,Date.UTC(y,0,15)),b=tzOffset(z,Date.UTC(y,6,15));return a!==b&&tzOffset(z)===Math.max(a,b)};
const tzCodeOf=z=>{const e=TZ_ZONES.find(x=>x[0]===z);return e?(tzSummer(z)&&e[2]?e[2]:e[1]):''};
const TZ_POPULAR=['America/New_York','America/Chicago','America/Los_Angeles','Europe/London','Europe/Berlin','Europe/Paris','Asia/Kolkata','Asia/Dubai','Asia/Singapore','Asia/Tokyo','Australia/Sydney','America/Sao_Paulo','UTC'];
const tzNorm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[_.]/g,' ').replace(/\s+/g,' ').trim();
const tzCountryOf=(()=>{const m={};for(const c of TZ_COUNTRIES) for(const z of c.zones) m[z]=m[z]||c.n;return z=>m[z]||''})();
const tzCity=z=>z==='UTC'?'UTC':z.split('/').pop().replace(/_/g,' ');
function tzOffset(z,ms=Date.now()){try{const p=new Intl.DateTimeFormat('en-US',{timeZone:z,timeZoneName:'longOffset'}).formatToParts(ms).find(x=>x.type==='timeZoneName').value;const m=p.match(/GMT([+-])(\d\d):(\d\d)/);return m?(m[1]==='-'?-1:1)*(+m[2]*60+ +m[3]):0}catch(e){return 0}}
const offTxt=m=>{if(m.isMe) return '';const d=(tzOffset(m.tz,UI.t)-tzOffset(home(),UI.t))/60;if(!d) return '';const a=Math.abs(d);return ` · ${d>0?'+':'−'}${Number.isInteger(a)?a:a.toFixed(1)}h`};
const KIND_TIP={joined:'Joined with their own account',manual:'Added by you',invited:'Invited, not joined yet'};
const tzOffLabel=z=>{const o=tzOffset(z),h=Math.floor(Math.abs(o)/60),mi=Math.abs(o)%60;return 'UTC'+(o?(o<0?'−':'+')+h+(mi?':'+String(mi).padStart(2,'0'):''):'')};
const tzLong=z=>{try{return new Intl.DateTimeFormat('en-US',{timeZone:z,timeZoneName:'long'}).formatToParts(Date.now()).find(x=>x.type==='timeZoneName').value}catch(e){return ''}};
const TZ_ALL=(()=>{const OLD=['Asia/Calcutta','Asia/Saigon','Asia/Katmandu','Europe/Kiev','Asia/Rangoon','America/Buenos_Aires','Atlantic/Faeroe','America/Godthab','Asia/Ulan_Bator','Europe/Uzhgorod','Europe/Zaporozhye','America/Indianapolis','America/Louisville','Pacific/Truk','Pacific/Ponape','Pacific/Enderbury'];let l=[];try{l=Intl.supportedValuesOf('timeZone')}catch(e){}l=l.filter(z=>/^(Africa|America|Antarctica|Asia|Atlantic|Australia|Europe|Indian|Pacific)\//.test(z)&&!OLD.includes(z));for(const c of TZ_COUNTRIES) for(const z of c.zones) if(!l.includes(z)&&validTz(z)) l.push(z);return [...new Set(['UTC',...l])]})();
const tzLabelOf=z=>{const c=tzCountryOf(z),city=tzCity(z);return z==='UTC'?'UTC':c&&c!==city?`${city}, ${c}`:city};
// search: one list of {tz,title,sub,score}; the best guess first
function tzSearch(q){
  const raw=String(q||'').trim(),n=tzNorm(raw),out=new Map(),add=(tz,title,sub,score)=>{if(!validTz(tz)) return;const k=tz+'|'+title,o=out.get(k);if(!o||o.score<score) out.set(k,{tz,title,sub,score})};
  if(!n) return TZ_ZONES.filter(e=>validTz(e[0])).filter((e,i,A)=>A.findIndex(x=>tzCodeOf(x[0])===tzCodeOf(e[0])&&tzOffset(x[0])===tzOffset(e[0]))===i).map(([z])=>{const c=tzCodeOf(z),l=tzLong(z);return {tz:z,title:c,sub:'',score:50,code:true,label:`${c} · ${l}`}}).sort((a,b)=>tzOffset(b.tz)-tzOffset(a.tz));
  const [cq,kq]=n.split(',').map(x=>x.trim()); // "Berlin, Germany" style
  const code=raw.replace(/\s/g,'').toUpperCase();
  if(TZ_CODES[code]) TZ_CODES[code].forEach((z,i)=>add(z,`${code} · ${tzLabelOf(z)}`,'',120-i));
  if(n.length>1&&!TZ_CODES[code]) for(const [z] of TZ_ZONES){const c=tzCodeOf(z);if(c&&c.toLowerCase().startsWith(n.replace(/\s/g,''))) add(z,`${c} · ${tzLabelOf(z)}`,'',96)}
  const om=raw.replace(/\s/g,'').match(/^(?:utc|gmt)?([+\-−])(\d{1,2})(?::?(\d{2}))?$/i);
  if(om){const off=(om[1]==='+'?1:-1)*(+om[2]*60+(+om[3]||0)),hits=TZ_ALL.filter(z=>tzOffset(z)===off);
    hits.sort((a,b)=>(TZ_POPULAR.includes(b)-TZ_POPULAR.includes(a))||(!!tzCountryOf(b)-!!tzCountryOf(a)));hits.slice(0,7).forEach((z,i)=>add(z,tzLabelOf(z),'',110-i))}
  if(/^(utc|gmt)$/i.test(raw)) add('UTC','UTC','',119);
  for(const c of TZ_COUNTRIES){const names=[c.n,...c.alias].map(tzNorm);
    const s=names.some(x=>x===cq)?95:names.some(x=>x.startsWith(cq))?(cq.length>1?78:0):0;
    if(s) c.zones.forEach((z,i)=>add(z,c.zones.length>1?`${tzCity(z)}, ${c.n}`:tzLabelOf(z),'',s-i*.5))}
  const cityScore=(name)=>{const x=tzNorm(name);return x===cq?100:x.startsWith(cq)?85:cq.length>2&&x.includes(' '+cq)?70:cq.length>3&&x.includes(cq)?55:0};
  for(const z of TZ_ALL){let s=cityScore(tzCity(z));if(!s&&cq.length>3&&tzNorm(z).includes(cq)) s=40;if(!s) continue;
    if(kq){const c=tzNorm(tzCountryOf(z));if(c&&!c.startsWith(kq)) s-=30}
    add(z,tzLabelOf(z),'',s+(TZ_POPULAR.includes(z)?3:0))}
  for(const c of TZ_CITIES){const nick=c.n.length<4&&c.n===c.n.toUpperCase(),s=nick?(c.n.toLowerCase()===cq?105:0):cityScore(c.n);if(s) add(c.z,nick?tzLabelOf(c.z):`${c.n}, ${tzCountryOf(c.z)||tzCity(c.z)}`,nick?'':`${tzCity(c.z)} time`,s-1)}
  for(const r of TZ_REGIONS){let sc=Math.max(cityScore(r.n),cityScore(r.full));if(!sc&&r.ab.some(a=>a.toUpperCase()===code)) sc=90;if(sc) add(r.z,`${r.full}, ${r.c}`,`${tzCity(r.z)} time`,sc)}
  return [...out.values()].sort((a,b)=>Math.floor(b.score/10)-Math.floor(a.score/10)||tzOffset(b.tz)-tzOffset(a.tz)||b.score-a.score).slice(0,8);
}
// what an input means: the zone behind the name it shows, or the best match for what was typed
function tzOf(inp){
  const v=inp.value.trim();if(!v) return '';
  if(inp.dataset.tz&&v===inp.dataset.label) return inp.dataset.tz;
  if(validTz(v)&&v.includes('/')||v==='UTC') return v;
  const r=tzSearch(v);return r.length&&r[0].score>=55?r[0].tz:'';
}
function setTz(inp,z){if(!inp) return;if(!z){inp.value='';delete inp.dataset.tz;return}inp.dataset.tz=z;inp.dataset.label=inp.value=tzLabelOf(z)}
// the list under the field
let TZP=null;
function tzOpen(inp){
  let el=$('#tzdd');if(!el){el=document.createElement('div');el.id='tzdd';el.setAttribute('role','listbox');el.addEventListener('pointerdown',e=>e.preventDefault())}
  const host=inp.closest('dialog')||document.body;if(el.parentElement!==host) host.append(el);
  const list=tzSearch(inp.dataset.tz&&inp.value===inp.dataset.label?'':inp.value),H=home();
  TZP={inp,list,i:list.length&&inp.value.trim()?0:-1};
  el.innerHTML=(list.length?list.map((r,i)=>`<button type="button" role="option" class="tzo" data-tzi="${i}" aria-selected="${i===TZP.i}"><span class="tzo-n"><b>${esc(r.title)}</b><small>${esc(r.sub?r.sub+' · ':'')}${esc(tzLong(r.tz))}</small></span><span class="tzo-t"><b>${fmtT(Date.now(),r.tz)}</b><small>${tzOffLabel(r.tz)}</small></span></button>`).join(''):`<p class="tzdd-none">No place by that name. Try a city, a country, or a code like CET or UTC+2.</p>`)+(inp.value.trim()?'':`<p class="tzdd-hint">Type a city, a country, or a code like CET, EST or UTC+2.</p>`);
  el.hidden=false;tzPlace();setTimeout(tzPlace,220);inp.setAttribute('aria-expanded','true');
}
function tzPlace(){if(!TZP) return;const el=$('#tzdd'),r=TZP.inp.getBoundingClientRect(),w=Math.max(r.width,300),h=el.offsetHeight,below=r.bottom+6+h<innerHeight-8||r.top<h+14;
  el.style.width=Math.min(w,innerWidth-16)+'px';el.style.left=Math.max(8,Math.min(r.left,innerWidth-Math.min(w,innerWidth-16)-8))+'px';el.style.top=(below?r.bottom+6:r.top-6-h)+'px'}
function tzClose(){const el=$('#tzdd');if(el) el.hidden=true;if(TZP) TZP.inp.setAttribute('aria-expanded','false');TZP=null}
function tzChoose(i){if(!TZP||!TZP.list[i]) return;const {inp}=TZP,r=TZP.list[i];inp.dataset.tz=r.tz;inp.value=inp.dataset.label=r.label||(r.title.includes(' · ')?tzLabelOf(r.tz):r.title);inp.setCustomValidity('');tzClose();inp.dispatchEvent(new Event('input',{bubbles:true}));
  const f=inp.form,nx=f&&[...f.elements].filter(x=>!x.disabled&&x.type!=='hidden'&&x.offsetParent);const k=nx?nx.indexOf(inp):-1;if(k>=0&&nx[k+1]&&nx[k+1].tagName==='INPUT') nx[k+1].focus()}
document.addEventListener('focusin',e=>{const t=e.target;if(t.matches&&t.matches('[data-tzpick]')){t.setAttribute('autocomplete','off');t.setAttribute('aria-autocomplete','list');tzOpen(t)}});
document.addEventListener('input',e=>{const t=e.target;if(t.matches&&t.matches('[data-tzpick]')&&!(t.dataset.tz&&t.value===t.dataset.label)){t.setCustomValidity('');tzOpen(t)}});
document.addEventListener('focusout',e=>{if(TZP&&e.target===TZP.inp) setTimeout(()=>{if(TZP&&document.activeElement!==TZP.inp) tzClose()},120)});
document.addEventListener('click',e=>{const o=e.target.closest&&e.target.closest('[data-tzi]');if(o) tzChoose(+o.dataset.tzi)});
document.addEventListener('keydown',e=>{
  if(!TZP||e.target!==TZP.inp) return;const n=TZP.list.length;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!n) return;TZP.i=(TZP.i+(e.key==='ArrowDown'?1:-1)+n)%n;document.querySelectorAll('#tzdd .tzo').forEach((b,i)=>{b.setAttribute('aria-selected',i===TZP.i);if(i===TZP.i) b.scrollIntoView({block:'nearest'})})}
  else if((e.key==='Enter'||e.key==='Tab')&&TZP.i>=0&&TZP.inp.value.trim()&&TZP.inp.value!==TZP.inp.dataset.label){if(e.key==='Enter') e.preventDefault();tzChoose(TZP.i)}
  else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();tzClose()}
},true);
addEventListener('resize',tzPlace);addEventListener('scroll',tzPlace,true);
// before any form reads its timezone, turn what is in the field into the real zone; put the friendly name back after
function tzCommit(root){const done=[];root.querySelectorAll('[data-tzpick]').forEach(inp=>{const z=tzOf(inp);if(z){inp.value=z;done.push([inp,z])}});
  setTimeout(()=>done.forEach(([inp,z])=>{if(inp.value===z) setTz(inp,z)}),0)}
document.addEventListener('submit',e=>tzCommit(e.target),true);
