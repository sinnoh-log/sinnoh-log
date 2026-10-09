(function(){
'use strict';

/* ---------- reference data (labels only) ---------- */
const STATS=[['atk','Attack','Atk'],['def','Defense','Def'],['spa','Sp. Attack','SpAtk'],['spd','Sp. Defense','SpDef'],['spe','Speed','Spd']];
const STAT_KEYS=['atk','def','spa','spd','spe'];
const STAT_NAME={atk:'Attack',def:'Defense',spa:'Sp. Attack',spd:'Sp. Defense',spe:'Speed'};
const SKILLS=[
  ['athletics','Athletics','atk'],
  ['concentration','Concentration','def'],['constitution','Constitution','def'],
  ['engineering','Engineering/Operation','spa'],['history','History','spa'],['investigate','Investigate','spa'],
  ['medicine','Medicine','spa'],['nature','Nature','spa'],['programming','Programming','spa'],
  ['bluff','Bluff/Deception','spd'],['diplomacy','Diplomacy/Persuasion','spd'],['insight','Insight','spd'],
  ['perception','Perception','spd'],['perform','Perform','spd'],['handling','Pokémon Handling','spd'],
  ['acrobatics','Acrobatics','spe'],['sleight','Sleight of Hand','spe'],['stealth','Stealth','spe']
];
const CLASSES={
  'Ace Trainer':['Stat Ace','Strategist','Tag Battler','Type Ace','Underdog'],
  'Breeder':['Botanist','Chef','Evolver','Medic','Move Tutor'],
  'Coordinator':['Choreographer','Coach','Designer','Groomer','Rising Star'],
  'Ranger':['Invoker','Officer','Rider','Special Operative','Survivalist'],
  'Researcher':['Archeologist','Ball Smith','Photographer','Scientist','Watcher']
};
const TYPES=['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];
const SIZES=['Tiny','Small','Medium','Large','Huge','Gigantic'];
const WEIGHTS=['Featherweight','Light','Medium','Heavy','Superweight'];
const DICE=['d4','d6','d8','d10','d12'];
const KINDS=['Physical','Special','Effect'];
const BADGES=[
  ['coal','Coal','Roark'],['forest','Forest','Gardenia'],['cobble','Cobble','Maylene'],['fen','Fen','Crasher Wake'],
  ['relic','Relic','Fantina'],['mine','Mine','Byron'],['icicle','Icicle','Candice'],['beacon','Beacon','Volkner']
];
const HONOR_TYPES=['Trial Medal','Frontier Symbol','Contest Ribbon','Certificate','Emblem of Recognition','Loyal Partner','Moment of Destiny','Other'];
const ATTITUDES=[['unknown','Unknown'],['friendly','Friendly'],['neutral','Neutral'],['wary','Wary'],['hostile','Hostile']];
const LEAD_STATES=[['open','Open'],['chasing','Chasing'],['resolved','Resolved'],['dead','Dead end']];
const LOY_WORDS=['Defiant','Distrustful','Obedient','Trusting','Devoted','Bonded'];
const DEF_META={campaign:'Sinnoh Trainer Log',subtitle:'Post-game Sinnoh · ten years after Team Galactic',gm:'',session:1,pinned:''};
const NAV=[
  ['Narrative',[['overview','Overview'],['journal','Journal'],['timeline','Timeline']]],
  ['World',[['people','People'],['leads','Leads'],['map','Map']]],
  ['Table',[['trainer','Trainer'],['pokemon','Pokémon']]]
];
const GM_NAV=['Game Master',[['gm','GM Desk']]];
const PAGE_LABEL={overview:'Overview',journal:'Journal',timeline:'Timeline',people:'People',leads:'Leads',map:'Map',place:'Place',trainer:'Trainer sheet',pokemon:'Pokémon',gm:'GM Desk',account:'Account'};
const PIN_KINDS=[['place','Place'],['party','Party'],['danger','Danger'],['lead','Lead']];
const AWARD_TYPES=['Gym Badge','Trial Medal','Frontier Symbol','Contest Ribbon','Certificate','Emblem of Recognition','Loyal Partner','Moment of Destiny','Other'];

/* ---------- tiny helpers ---------- */
const $=(s,r)=>(r||document).querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
class Safe{constructor(s){this.s=s}}
const raw=s=>new Safe(s);
const val=v=>v instanceof Safe?v.s:Array.isArray(v)?v.map(val).join(''):(v==null||v===false)?'':esc(v);
const h=(st,...v)=>new Safe(st.reduce((a,s,i)=>a+s+(i<v.length?val(v[i]):''),''));
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const mod=v=>Math.max(0,Math.floor(num(v)/2));
const sgn=n=>(n<0?'−':'+')+Math.abs(n);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const getIn=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
const setIn=(obj,parts,v)=>{
  if(!parts.length)return v;
  const k=parts[0];
  const base=Array.isArray(obj)?obj.slice():Object.assign({},obj||{});
  base[k]=setIn(obj?obj[k]:undefined,parts.slice(1),v);
  return base;
};
const dt=ts=>ts?new Date(ts).toLocaleDateString(undefined,{month:'short',day:'numeric'}):'';
const ago=ts=>{
  if(!ts)return '';
  const s=Math.max(1,Math.round((Date.now()-ts)/1000));
  if(s<60)return 'just now';
  const m=Math.round(s/60);
  if(m<60)return m+' min ago';
  const hr=Math.round(m/60);
  if(hr<24)return hr+' h ago';
  const d=Math.round(hr/24);
  return d+(d===1?' day ago':' days ago');
};
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
/* CFG is set only by the standalone (GitHub Pages) build; the claude.ai artifact leaves it null. */
const CFG=window.APP_CFG||null;
const use=n=>{try{return window.claude&&window.claude.use?window.claude.use(n):Promise.resolve(null)}catch(e){return Promise.resolve(null)}};

/* ---------- state ---------- */
const S={
  ready:false,noDb:false,db:null,user:null,dl:null,
  me:{id:null,admin:false,canWrite:true},
  tab:'overview',viewUid:null,
  trainers:{},pokemon:{},people:{},journal:{},leads:{},notes:{},meta:Object.assign({},DEF_META),gmLoy:{},gmNpc:{},
  awards:{},timeline:{},pins:{},banner:{},places:{},gmPl:{},placeId:null,members:{},invite:null,mapChunks:{},mapSrc:'',room:null,peers:[],avatars:{},
  pick:null,names:{},save:{cls:'',text:'Saved'},rolls:[],_tsig:'',
  ui:{open:{},adv:'normal',q:{},f:{places:'all'},zoom:1,mapSub:'places',sub:'party',confirm:null,writeFail:false,rollHidden:false,toTop:false,pinMode:'',selPin:null,navOpen:false,inv:{code:null},acct:{name:null,msg:''},
    award:{uids:{},type:'Gym Badge',badge:'coal',title:'',note:'',levelUp:true}}
};

/* ---------- place data: markers and routes traced from the Sinnoh map (2048 x 1763 px); text from the world notes, player-safe ---------- */
const MAP_W=2048,MAP_H=1763;
const PD=[{"id":"acuity-lakefront","name":"Acuity Lakefront","t":"p","g":"land","kind":"landmark","x":828,"y":260,"sum":"A broad white bowl of ice with a dark blue fringe where the shore keeps its water open. After days of wind on the Drift Fields, Acuity feels unnervingly still. People talk quietly here. The ice ticks and booms at night in long, slow phrases.","facts":[["Access","only by Route 217; about 4 days from Greenstation, 2–4 days from Snowpoint"]],"cx":828,"cy":260,"bb":[758,210,898,310]},{"id":"snowpoint-city","name":"Snowpoint City","t":"p","g":"settle","kind":"city","x":892,"y":202,"sum":"Sinnoh's northernmost city, a stepped town of timber houses, steam vents and warm stone streets at the end of the road. Cheerful, practical and genuinely used to the dark.","facts":[["Gym","Candice · Ice-type · Icicle Badge"]],"cx":892,"cy":202,"bb":[822,152,962,252]},{"id":"mt-stark","name":"Mt. Stark","t":"p","g":"land","kind":"landmark","x":1543,"y":280,"sum":"The island's chimney. Mt. Stark is a restless volcano, its crater lip ringed with yellow rock and steam, its slopes black with cinder and white with salt. The League's volcano watch keeps a station on the rim.","facts":[],"cx":1543,"cy":280,"bb":[1473,230,1613,330]},{"id":"fullmoon-island","name":"Fullmoon Island","t":"p","g":"land","kind":"island","x":428,"y":312,"sum":"A long pale island with a spine of grey slate, silver-leaved scrub, a shell-white beach and a quiet most visitors describe as \"the kind you can hear.\" Cold, bright and strangely lit even on cloudy nights, it is Sinnoh's best-known legend-island and one of its least visited places.","facts":[["Access","League and Ranger permit only (Moon Islands Conservation Order)"]],"cx":428,"cy":312,"bb":[358,262,498,362]},{"id":"newmoon-island","name":"Newmoon Island","t":"p","g":"land","kind":"island","x":500,"y":364,"sum":"A pale, curved island that sailors steer around. Its bay is the shape of a crescent and its water is unusually still. Ranger charts mark everything within five kilometers of its coast as the League's Closed Water.","facts":[["Access","no landing is permitted under any category; the surrounding sea is the League's Closed Water"]],"cx":500,"cy":364,"bb":[430,314,570,414]},{"id":"greenstation-town","name":"Greenstation Town","t":"p","g":"settle","kind":"town","x":837,"y":432,"sum":"A mountain-pass railhead where four routes meet. It is the last stop of the narrow-gauge Lilypad Line and the first stop of everything harder. In a white landscape, the only green is the station roof.","facts":[],"cx":837,"cy":432,"bb":[767,382,907,482]},{"id":"lilypad-town","name":"Lilypad Town","t":"p","g":"settle","kind":"town","x":960,"y":337,"sum":"A steaming hot-spring town on the snow country's east flank, where open pools never freeze and lily pads float in January. Home of the Steam Hall, a plow depot, and the north's best soup.","facts":[],"cx":960,"cy":337,"bb":[890,287,1030,387]},{"id":"battle-resort-survival-area","name":"Battle Resort Survival Area","t":"p","g":"settle","kind":"area","x":1378,"y":387,"sum":"A League-run wilderness school on the north end of the Battle Resort's west arm: a log palisade, a ten-station course, a lighthouse, and an unshakable rule that nobody here is impressed by your badges.","facts":[],"cx":1378,"cy":387,"bb":[1308,337,1448,437]},{"id":"sandalstraw-town","name":"Sandalstraw Town","t":"p","g":"settle","kind":"town","x":719,"y":585,"sum":"A cold-country craft town of about 5,500 at the north knuckle of the west ring road, famous for woven straw, trail footwear and moon-watching. A Contest Center, a Ranger marine office and a very old straw giant share its small streets.","facts":[],"cx":719,"cy":585,"bb":[649,535,789,635]},{"id":"shelter-town","name":"Shelter Town","t":"p","g":"settle","kind":"town","x":800,"y":500,"sum":"A refuge town built around one rule: nobody is turned away from a storm. Its Long Hall can shelter eight hundred people, and its bell can be heard across the foothills.","facts":[],"cx":800,"cy":500,"bb":[730,450,870,550]},{"id":"iron-island","name":"Iron Island","t":"p","g":"settle","kind":"island","x":438,"y":719,"sum":"A red-brown rock island with one village, two mines and a standing argument about the future. About 1,300 miners, wranglers and families live on it, and a handful of Steelix are closer to colleagues than livestock.","facts":[],"cx":438,"cy":719,"bb":[368,669,508,769]},{"id":"lucario-kingdom","name":"Lucario Kingdom","t":"p","g":"land","kind":"landmark","x":1134,"y":648,"sum":"Six limestone terraces rise from oak and birch forest to a bare plateau above the sea. From Route 226 the massif looks like a stair leading to a throne. Locals call it the Stair; the plateau is the Crown; and the community living on it is the Kingdom.","facts":[["Access","from the Kingdom Gate Post on Route 226; half a day to the lower terraces. The upper terraces are closed."]],"cx":1134,"cy":648,"bb":[1064,598,1204,698]},{"id":"battle-resort-fight-area","name":"Battle Resort Fight Area","t":"p","g":"settle","kind":"area","x":1330,"y":611,"sum":"The Resort's arena district: floodlit stadiums, rows of dojos and a public scoreboard that ranks everybody. A city of sparring yards around one great stadium, where reputation is the only currency nobody inflates.","facts":[],"cx":1330,"cy":611,"bb":[1260,561,1400,661]},{"id":"battle-resort-port","name":"Battle Resort Port","t":"p","g":"land","kind":"landmark","x":1588,"y":606,"sum":"The Gate. Everyone and almost everything that enters the Battle Resort comes through Port Head. It is a plain, busy harbor: gray piers, rust-streaked cranes, a stack of fruit crates, and a long low building called the Gate Hall, where staff check passes and Pokémon.","facts":[],"cx":1588,"cy":606,"bb":[1518,556,1658,656]},{"id":"resort-area","name":"Resort Area","t":"p","g":"settle","kind":"area","x":1690,"y":666,"sum":"The Battle Resort's holiday town at the island's southeastern tip: white-sand coves, terraced hotels, a spa fed by volcanic springs, and the people who keep all of it running. Where Sinnoh's winners go to rest, and where those who would like to be mistaken for them go to be seen.","facts":[],"cx":1690,"cy":666,"bb":[1620,616,1760,716]},{"id":"lily-of-the-valley-conference","name":"Lily of the Valley Conference","t":"p","g":"land","kind":"landmark","x":1700,"y":741,"sum":"The Stage. Lily of the Valley is a pretty island with a purpose. The whole of it, a low green hill, a sandy shore and a ring of paths, was cleared and planted for one event: the League's annual public tournament. The rest of the year it is a caretaker's village and a very quiet garden.","facts":[],"cx":1700,"cy":741,"bb":[1630,691,1770,791]},{"id":"squallville","name":"Squallville","t":"p","g":"settle","kind":"town","x":558,"y":771,"sum":"A slate-roofed headland harbor of about 4,000, where the sea weather arrives first and everyone lives by forecast. Fishers, ore haulers and weather-watchers share a harbor too small for all of them.","facts":[],"cx":558,"cy":771,"bb":[488,721,628,821]},{"id":"eterna-forest","name":"Eterna Forest","t":"p","g":"land","kind":"landmark","x":625,"y":795,"sum":"A dense old-growth forest, dim even at noon. The canopy is heavy, the trails narrow, and on a windless day it is among the quietest places in Sinnoh.","facts":[],"cx":625,"cy":795,"bb":[555,745,695,845]},{"id":"eterna-city","name":"Eterna City","t":"p","g":"settle","kind":"city","x":781,"y":754,"sum":"An old forest-edge city of about 30,000, proud of its history and its greenery. Quieter than Jubilife, older than Hearthome, and a bit stuck in its ways.","facts":[["Gym","Gardenia · Grass-type · Forest Badge"]],"cx":781,"cy":754,"bb":[711,704,851,804]},{"id":"celestic-town","name":"Celestic Town","t":"p","g":"settle","kind":"town","x":1051,"y":768,"sum":"A small, stubborn town of stone houses, wind bells and long memories on Mt. Coronet's east shoulder. Sinnoh's keeper of old stories, and a place that has never once been in a hurry.","facts":[],"cx":1051,"cy":768,"bb":[981,718,1121,818]},{"id":"veilstone-city","name":"Veilstone City","t":"p","g":"settle","kind":"city","x":1498,"y":858,"sum":"A fast-growing coastal city on Sinnoh's eastern cliffs. Department stores, cranes, wind and the sea, with a Gym that still thinks mountains are the best teachers.","facts":[["Gym","Maylene · Fighting-type · Cobble Badge"]],"cx":1498,"cy":858,"bb":[1428,808,1568,908]},{"id":"dandelion-island","name":"Dandelion Island","t":"p","g":"settle","kind":"island","x":1618,"y":870,"sum":"A small island in the east sea, a short ferry hop from Veilstone, where about nine hundred people live among wind-mills, seed vaults and drifting fluff, and where every spring the sky fills with Hoppip.","facts":[],"cx":1618,"cy":870,"bb":[1548,820,1688,920]},{"id":"champions-port","name":"Champion's Port","t":"p","g":"settle","kind":"town","x":1723,"y":894,"sum":"A tidy, nervous harbor town on the southwest shore of the League's island, where every challenger spends three days being patient. The ferry brings hopefuls in; the Pavilion road takes the survivors out.","facts":[],"cx":1723,"cy":894,"bb":[1653,844,1793,944]},{"id":"elite-four-island","name":"Elite Four Island","t":"p","g":"settle","kind":"island","x":1734,"y":854,"sum":"The Pokémon League's headquarters island in the east sea: a small administrative city on a mountain's skirt, where the Elite Four and the Champion work and where Sinnoh's best trainers are tested and recorded.","facts":[],"cx":1734,"cy":854,"bb":[1664,804,1804,904]},{"id":"chocovine-town","name":"Chocovine Town","t":"p","g":"settle","kind":"town","x":457,"y":901,"sum":"A terraced coast town of about 8,000 built on cocoa, Poffins and the memory of a failed vineyard. Warm brick, warm air, and a roasting smell you can follow from three miles away. A Contest Center sits at its heart.","facts":[],"cx":457,"cy":901,"bb":[387,851,527,951]},{"id":"floaroma-flower-fields","name":"Floaroma Flower Fields","t":"p","g":"land","kind":"landmark","x":531,"y":928,"sum":"A gentle quilt of terraced flower beds, dye plots and wild meadow that supplies half of Sinnoh's cut flowers. In summer the whole slope is a color-field: lavender, lily, poppy, marigold and an unreasonable amount of clover. In winter it is brown stubble and quiet fields under snow.","facts":[],"cx":531,"cy":928,"bb":[461,878,601,978]},{"id":"floaroma-town","name":"Floaroma Town","t":"p","g":"settle","kind":"town","x":556,"y":989,"sum":"A flower-and-honey town of a few thousand people, north of Jubilife. Pretty by design, practical underneath. Floaroma lives off flowers, honey, dye plants and herbal remedies. Every wall has a window box, every corner has a planter, and the whole town smells like three different honeys at once.","facts":[],"cx":556,"cy":989,"bb":[486,939,626,1039]},{"id":"valley-windworks","name":"Valley Windworks","t":"p","g":"land","kind":"landmark","x":691,"y":996,"sum":"Sinnoh's largest renewable power complex: two wind ridges and a small pumped-storage reservoir that together supply Jubilife, Floaroma, Eterna and Oreburgh. It is publicly owned, run by the Coronet Valley Power Authority (CVPA), and one of the few places in the region where every citizen thinks the same thing: thank goodness it is there.","facts":[],"cx":691,"cy":996,"bb":[621,946,761,1046]},{"id":"206-bridge","name":"206 Bridge","t":"p","g":"land","kind":"landmark","x":788,"y":931,"sum":"A long steel deck on older stone piers across a river gorge: the single most photographed object on the Cycling Road. The stone is centuries old and part of the original trade road; the deck and cables were added forty years ago, and a glass-floored viewing span was added five years later because tourists would not stop asking for one.","facts":[],"cx":788,"cy":931,"bb":[718,881,858,981]},{"id":"mt-coronet-and-spear-pillar","name":"Mt. Coronet and Spear Pillar","t":"p","g":"land","kind":"landmark","x":938,"y":1001,"sum":"Mt. Coronet is the backbone of Sinnoh and the reason most of its maps have a gap in the middle. It is not one peak but a long, broken massif of cold rock, hanging valleys, glaciers and snowfields, riddled with caves and magnetic ground, and ringed by towns that argue about what it means.","facts":[["Access","the mountain is crossed by three maintained tunnels (Mt. Coronet Pass, the Coronet Spine, Route 207); the summit is closed by League order"]],"cx":938,"cy":1001,"bb":[868,951,1008,1051]},{"id":"gracidea-flower-garden","name":"Gracidea Flower Garden","t":"p","g":"land","kind":"landmark","x":1002,"y":1047,"sum":"A bowl of meadow tucked into a fold of the mountain, protected from wind on three sides and open to the south. Sunlight pools there for hours after it has left the valley below. In late spring the whole bowl turns pink, in a bloom that lasts roughly three weeks, and the slopes around it hum.","facts":[["Access","the Meadow Path, about two days on foot from Emeragrove; Garden Society permit required in bloom season"]],"cx":1002,"cy":1047,"bb":[932,997,1072,1097]},{"id":"michina-ruins","name":"Michina Ruins","t":"p","g":"land","kind":"landmark","x":1089,"y":943,"sum":"The Ruins are a stepped complex of stone courts and galleries, cut into the slope above the Mirror Tarn's inlet, with the Old Road running straight into its gate. It is silent most of the day. Visitors tend to lower their voices without being asked.","facts":[["Access","half a day on the Pilgrims' Spur from town; open to visitors with a Dig House pass"]],"cx":1089,"cy":943,"bb":[1019,893,1159,993]},{"id":"michina-town","name":"Michina Town","t":"p","g":"settle","kind":"town","x":1119,"y":937,"sum":"A stone-and-wool town in a high bowl on Mt. Coronet's east face, built for the road to the Ruins and still arguing about who the road belongs to.","facts":[],"cx":1119,"cy":937,"bb":[1049,887,1189,987]},{"id":"emeragrove-town","name":"Emeragrove Town","t":"p","g":"settle","kind":"town","x":1154,"y":1037,"sum":"A terraced garden town on the slope above Route 209, famous for its hedges, glasshouses, honey, and an annual festival of saying thank you. The people here are kind, a little competitive, and absolutely certain about compost.","facts":[],"cx":1154,"cy":1037,"bb":[1084,987,1224,1087]},{"id":"solaceon-town","name":"Solaceon Town","t":"p","g":"settle","kind":"town","x":1222,"y":984,"sum":"A quiet valley town of scholars, breeders and travelers. Famous for its Day Care and its ruins, and the hinge on which the Hearthome-to-Veilstone road turns.","facts":[],"cx":1222,"cy":984,"bb":[1152,934,1292,1034]},{"id":"crown-city","name":"Crown City","t":"p","g":"settle","kind":"city","x":1575,"y":1017,"sum":"The richest and most polished city in eastern Sinnoh: white bluffs, a deep harbor, trading houses, private academies and excellent restaurants. It has a very large number of opinions about Gyms and does not have one.","facts":[],"cx":1575,"cy":1017,"bb":[1505,967,1645,1067]},{"id":"canalave-city","name":"Canalave City","t":"p","g":"settle","kind":"city","x":321,"y":1058,"sum":"A canal-cut harbor city of salt wind, steel and old paper. Shipwrights and librarians share one hill and rarely agree on the budget.","facts":[["Gym","Byron · Steel-type · Mine Badge"]],"cx":321,"cy":1058,"bb":[251,1008,391,1108]},{"id":"jubilife-city","name":"Jubilife City","t":"p","g":"settle","kind":"city","x":550,"y":1162,"sum":"Sinnoh's largest city and its primary center for media, technology, communications, commerce, and League administration. Jubilife is fast-growing, ambitious, expensive, noisy, and seemingly always under construction.","facts":[],"cx":550,"cy":1162,"bb":[480,1112,620,1212]},{"id":"alamos-town","name":"Alamos Town","t":"p","g":"settle","kind":"town","x":677,"y":1099,"sum":"A poplar-lined hill town on a small lake, famous for lake-aged cheese, quarry stone and a very stubborn preservation society. Alamos is where Oreburgh's miners go on their rest-week and where Jubilife people go to feel like they are in the country. The town clings to a terraced hillside above the lake, with poplars in rows along every path and cheese caves cut into the quarry wall.","facts":[],"cx":677,"cy":1099,"bb":[607,1049,747,1149]},{"id":"oreburgh-city","name":"Oreburgh City","t":"p","g":"settle","kind":"city","x":774,"y":1172,"sum":"A coal-and-fossil mining city in the south-west, home of Roark and the Coal Badge. Miners, a mining museum and a lot of dust.","facts":[["Gym","Roark · Rock-type · Coal Badge"]],"cx":774,"cy":1172,"bb":[704,1122,844,1222]},{"id":"hearthome-city","name":"Hearthome City","t":"p","g":"settle","kind":"city","x":1124,"y":1120,"sum":"Sinnoh's cultural capital: theaters, Contests, fashion, music and a central plaza that never quite empties. Larger and warmer than Eterna, less corporate than Jubilife.","facts":[["Gym","Fantina · Ghost-type · Relic Badge"]],"cx":1124,"cy":1120,"bb":[1054,1070,1194,1170]},{"id":"majolica-town","name":"Majolica Town","t":"p","g":"settle","kind":"town","x":1223,"y":1165,"sum":"A tile-roofed pottery town of kiln smoke, glazed streets and a Contest hall famous for its trophies. Where Hearthome comes to buy plates and Coordinators come to be seen.","facts":[],"cx":1223,"cy":1165,"bb":[1153,1115,1293,1215]},{"id":"valor-lakefront-and-grand-festival","name":"Valor Lakefront and Grand Festival","t":"p","g":"land","kind":"landmark","x":1519,"y":1200,"sum":"A broad cold lake, a grand old hotel, and the stage where the year's best Coordinators compete for the Grand Festival title. The most glamorous address in the east for one week a year, and a plain, pretty lakeshore for the other fifty-one.","facts":[],"cx":1519,"cy":1200,"bb":[1449,1150,1589,1250]},{"id":"brussel-town","name":"Brussel Town","t":"p","g":"settle","kind":"town","x":1598,"y":1175,"sum":"A ridgeline town of glasshouses and sawmills at the edge of the Brusselwood, where the whole slope glows amber at night and the Contest Hall used to be a greenhouse.","facts":[],"cx":1598,"cy":1175,"bb":[1528,1125,1668,1225]},{"id":"arrowroot-town","name":"Arrowroot Town","t":"p","g":"settle","kind":"town","x":1639,"y":1116,"sum":"A river-mill town that smells of warm starch and baked sugar, where the Poffin ovens are always on and the Contest Hall stage is backed by a working waterwheel.","facts":[],"cx":1639,"cy":1116,"bb":[1569,1066,1709,1166]},{"id":"camellia-town","name":"Camellia Town","t":"p","g":"settle","kind":"town","x":1733,"y":1194,"sum":"A small hill town of tea terraces, camellia-oil presses and a shrine that blooms in the dead of winter. It has no Contest hall and is the quietest rest stop on the eastern peninsula.","facts":[],"cx":1733,"cy":1194,"bb":[1663,1144,1803,1244]},{"id":"sunyshore-city","name":"Sunyshore City","t":"p","g":"settle","kind":"city","x":1791,"y":1166,"sum":"A bright, breezy harbor city that runs on sunlight and argues about it. The last stop before the sea crossings to the Elite Four island and the Conference island, and home to the Beacon Badge.","facts":[["Gym","Volkner · Electric-type · Beacon Badge"]],"cx":1791,"cy":1166,"bb":[1721,1116,1861,1216]},{"id":"verity-lakefront","name":"Verity Lakefront","t":"p","g":"land","kind":"landmark","x":388,"y":1345,"sum":"A broad, shallow, quiet lake in the southwest corner of Sinnoh, ringed with reedbeds and low hills. Twinleaf children grow up swimming and skipping stones here; nearly every famous trainer from the town has a story about the water.","facts":[],"cx":388,"cy":1345,"bb":[318,1295,458,1395]},{"id":"sandgem-town","name":"Sandgem Town","t":"p","g":"settle","kind":"town","x":557,"y":1345,"sum":"A seaside town and home of the Sandgem Pokémon Research Laboratory, now directed by Professor Lydia Hawthorne.","facts":[],"cx":557,"cy":1345,"bb":[487,1295,627,1395]},{"id":"bewilder-forest","name":"Bewilder Forest","t":"p","g":"land","kind":"landmark","x":581,"y":1257,"sum":"A broad belt of old oak and beech woodland that has never been properly surveyed. The Rangers say that is on purpose. It is not a hostile forest: it is confusing, a place where trails split, hollows echo and nobody agrees on which way north is.","facts":[],"cx":581,"cy":1257,"bb":[511,1207,651,1307]},{"id":"grand-marsh","name":"Grand Marsh","t":"p","g":"land","kind":"landmark","x":1124,"y":1345,"sum":"Sinnoh's great wetland: a licensed, guided wildlife area of reed seas, boardwalks, mud flats and drowned orchards, feeding the Pastoria delta. The best place in the region to see out-of-region species living a legal, supervised life.","facts":[],"cx":1124,"cy":1345,"bb":[1054,1295,1194,1395]},{"id":"safari-zone","name":"Safari Zone","t":"p","g":"land","kind":"landmark","x":1172,"y":1284,"sum":"A fenced, licensed preserve of savanna, rainforest and wetland east of the Grand Marsh, stocked with species from every region. It is the legal home of Sinnoh's out-of-region Pokémon, and the likeliest source when one turns up on a road.","facts":[],"cx":1172,"cy":1284,"bb":[1102,1234,1242,1334]},{"id":"neighborly-town","name":"Neighborly Town","t":"p","g":"settle","kind":"town","x":1541,"y":1240,"sum":"The east's great crossroads and its friendliest address. Five roads meet at a bell tower, strangers are expected to eat at the community table, and the Contest crowd fills every bed in town.","facts":[],"cx":1541,"cy":1240,"bb":[1471,1190,1611,1290]},{"id":"daybreak-town","name":"Daybreak Town","t":"p","g":"settle","kind":"town","x":1753,"y":1261,"sum":"A fishing village at the eastern tip of the peninsula, where the sun first touches Sinnoh and the Contest stage is a headland that faces the dawn.","facts":[],"cx":1753,"cy":1261,"bb":[1683,1211,1823,1311]},{"id":"twinleaf-town","name":"Twinleaf Town","t":"p","g":"settle","kind":"town","x":432,"y":1399,"sum":"A small, quiet town in south-western Sinnoh, at the start of Route 201 and a short walk from Lake Verity.","facts":[],"cx":432,"cy":1399,"bb":[362,1349,502,1449]},{"id":"sandgem-port","name":"Sandgem Port","t":"p","g":"land","kind":"landmark","x":560,"y":1392,"sum":"The southwest's passenger door to the world. Sandgem Port is a working harbor of seven quays, a fish market, a customs shed and a lighthouse on a long breakwater. It handles Oreburgh's ore (via Route 237), Sandgem's fish and berries, and every overseas passenger who prefers a ship to a plane.","facts":[],"cx":560,"cy":1392,"bb":[490,1342,630,1442]},{"id":"pastoria-city","name":"Pastoria City","t":"p","g":"settle","kind":"city","x":1280,"y":1394,"sum":"A delta city of boardwalks, canals and stilted roofs where the Grand Marsh drains into the sea. Rain is the weather, water is the road, and nobody here is surprised by mud.","facts":[["Gym","Crasher Wake · Water-type · Fen Badge"]],"cx":1280,"cy":1394,"bb":[1210,1344,1350,1444]},{"id":"sage-town","name":"Sage Town","t":"p","g":"settle","kind":"town","x":928,"y":1598,"sum":"A quiet southern coast town of herb terraces, salt pans and smokehouses, famous for sage bundles, spice blends and a Contest hall that judges cooking as seriously as appeal. Smells of smoke, salt and something green.","facts":[],"cx":928,"cy":1598,"bb":[858,1548,998,1648]},{"id":"south-sinnoh-port","name":"South Sinnoh Port","t":"p","g":"land","kind":"landmark","x":1050,"y":1679,"sum":"The region's main freight and international port, at the far southern tip: cranes, container stacks, a quarantine yard, and a thousand small tales of what came in the hold. Foreign species arrive here, legally and otherwise.","facts":[],"cx":1050,"cy":1679,"bb":[980,1629,1120,1729]},{"id":"route-201","name":"Route 201","t":"r","g":"route","kind":"route","nick":"The First Road","sum":"One of Sinnoh's gentlest trainer routes and, for generations of children from Twinleaf, the first stretch of wilderness that feels truly independent. Most beginners spend a night on it, usually at Willowbank Camp.","facts":[["Connects","Twinleaf Town ↔ Sandgem Town"],["Travel time","2 days on foot"],["Danger","★☆☆☆☆"]],"segs":[[[432,1388],[429,1365],[439,1357],[455,1356],[491,1342],[544,1345],[554,1334],[557,1335]]],"bb":[429,1334,557,1388],"cx":493,"cy":1361},{"id":"route-202","name":"Route 202","t":"r","g":"route","kind":"route","nick":"","sum":"Route 202 is where Sinnoh's beginner journey becomes a real expedition. Leaving Sandgem Town, the route passes through coastal farmland and gradually enters a broad belt of mixed woodland before emerging into the increasingly developed outskirts of Jubilife City. The route is well traveled and maintained, but its length means trainers must manage food, camps, weather, and their Pokémon for several consecutive days.","facts":[["Connects","Sandgem Town ↔ Jubilife City"],["Travel time","3–4 days on foot"],["Danger","★☆☆☆☆"]],"segs":[[[557,1335],[553,1312],[543,1295],[542,1274],[546,1267],[546,1256],[538,1246],[536,1232],[546,1222],[546,1215],[556,1192],[557,1175],[562,1166],[559,1154],[552,1151]]],"bb":[536,1151,562,1335],"cx":549,"cy":1243},{"id":"route-203","name":"Route 203","t":"r","g":"route","kind":"route","nick":"","sum":"Route 203 is where Sinnoh stops feeling gentle. The farmland east of Jubilife gives out quickly, replaced by scrubland, exposed rock and a haze of mine dust that hangs over the approach to Oreburgh on still days.","facts":[["Connects","Jubilife City ↔ Oreburgh City"],["Travel time","1–2 days on foot"],["Danger","★★☆☆☆"]],"segs":[[[552,1151],[564,1163],[595,1161],[605,1173],[610,1175],[617,1175],[630,1164],[635,1164],[641,1170],[652,1171],[663,1163],[671,1164],[685,1157],[687,1159],[695,1157],[715,1169],[758,1168],[781,1164]]],"bb":[552,1151,781,1175],"cx":666,"cy":1163},{"id":"route-204","name":"Route 204","t":"r","g":"route","kind":"route","nick":"The Flower Road","sum":"The short, gentle stretch where Jubilife's noise fades and the countryside returns. It is the League's easiest second route, heavily patrolled and well signed.","facts":[["Connects","Jubilife City ↔ Floaroma Town"],["Travel time","1 day on foot"],["Danger","★☆☆☆☆"]],"segs":[[[552,1151],[549,1138],[541,1130],[532,1107],[530,1078],[533,1067],[549,1046],[550,1036],[546,1029],[546,1013],[551,1003],[551,988],[558,980]]],"bb":[530,980,558,1151],"cx":544,"cy":1065},{"id":"route-205","name":"Route 205","t":"r","g":"route","kind":"route","nick":"The River Path","sum":"A gentle riverside walk through meadow and light woodland, then the long, dim passage through Eterna Forest. It is the last easy route before the heart of Sinnoh.","facts":[["Connects","Floaroma Town ↔ Eterna Forest ↔ Eterna City"],["Travel time","2 days on foot"],["Danger","★★☆☆☆"]],"segs":[[[558,980],[584,980],[587,977],[587,972],[599,958],[600,945],[605,937],[605,928],[621,902],[628,877],[628,854],[620,831],[618,805],[634,804],[635,792],[631,788],[635,789],[639,786],[650,785],[659,775],[660,763],[668,756],[675,756],[684,766],[686,772],[702,784],[715,787],[732,787],[741,777],[742,757],[750,747],[755,747],[765,755],[788,744],[793,755]],[[558,980],[564,987],[564,996],[583,1006],[612,1007],[631,1014],[671,1016],[684,1005],[698,1004]]],"bb":[558,744,793,1016],"cx":675,"cy":880},{"id":"route-206","name":"Route 206","t":"r","g":"route","kind":"route","nick":"The Cycling Road","sum":"Two lanes of tarmac for wheels and a gravel verge for walkers, laid on a long steady grade down the mountain's western flank. Eterna sits higher than Oreburgh, so southbound riders coast for a day and northbound riders earn every kilometer.","facts":[["Connects","Eterna City ↔ Oreburgh City, via the 206 Bridge"],["Travel time","5–6 days on foot; 2–3 days by bicycle"],["Danger","★★☆☆☆"]],"segs":[[[793,755],[794,759],[783,770],[783,784],[791,798],[791,822],[796,830],[796,849],[791,859],[791,893],[787,898],[787,917],[796,926],[797,937],[792,943],[792,964],[805,979],[805,988],[798,996],[798,999],[811,1008],[811,1018],[805,1025],[805,1032],[816,1043],[816,1053],[806,1062],[786,1062],[782,1067],[782,1073],[787,1079],[787,1086],[780,1093],[779,1098],[789,1108],[789,1116],[784,1123],[784,1141],[776,1156],[781,1164]]],"bb":[776,755,816,1164],"cx":796,"cy":959},{"id":"route-207","name":"Route 207","t":"r","g":"route","kind":"route","nick":"The Southern Crossing","sum":"A maintained tunnel and cut-through that connects Oreburgh's mining country with Hearthome's meadows. Cooler, darker and louder than Route 211, but far more trafficked: ore haulers, couriers and miners use it daily.","facts":[["Connects","Oreburgh City ↔ Route 208 ↔ Hearthome City"],["Travel time","1–2 days (mostly underground)"],["Danger","★★★☆☆"]],"segs":[[[781,1164],[788,1160],[804,1137],[809,1137],[821,1130],[827,1133],[831,1132],[834,1135],[842,1133],[848,1136],[853,1133],[856,1134],[863,1128],[892,1127],[897,1131],[900,1129],[908,1133],[919,1132],[929,1134],[933,1130],[944,1129]]],"bb":[781,1127,944,1164],"cx":862,"cy":1145},{"id":"route-208","name":"Route 208","t":"r","g":"route","kind":"route","nick":"The Meadow Road","sum":"After the cold stone of the southern tunnel on Route 207, Route 208 opens into a river valley of meadows and berry patches with Hearthome's skyline in the distance. It is the first place travelers feel warmth in a day.","facts":[["Connects","Route 207 (southern Coronet tunnel from Oreburgh City) ↔ Hearthome City"],["Travel time","1 day on foot"],["Danger","★★☆☆☆"]],"segs":[[[944,1129],[947,1127],[965,1140],[972,1142],[983,1139],[992,1132],[1003,1131],[1007,1136],[1018,1140],[1049,1138],[1068,1128],[1104,1129],[1109,1127],[1118,1134],[1128,1134],[1136,1127],[1136,1118],[1132,1112]]],"bb":[944,1112,1136,1142],"cx":1040,"cy":1127},{"id":"route-209","name":"Route 209","t":"r","g":"route","kind":"route","nick":"The Quiet Road","sum":"Open country, rolling hills and low stone walls, with a very old place at its center: the Lost Tower, a haunting memorial that locals visit and tourists avoid.","facts":[["Connects","Hearthome City ↔ Solaceon Town"],["Travel time","2–3 days on foot"],["Danger","★★☆☆☆ (★★★☆☆ near the Lost Tower at night)"]],"segs":[[[1132,1112],[1159,1112],[1167,1104],[1173,1091],[1182,1081],[1206,1070],[1216,1059],[1219,1051],[1219,1041],[1216,1038],[1214,1029],[1214,1017],[1220,999],[1219,989],[1215,983],[1222,975]],[[1132,1112],[1126,1107],[1126,1099],[1144,1080],[1144,1068],[1140,1064],[1138,1054],[1145,1047],[1156,1045],[1162,1031]],[[1162,1031],[1170,1026],[1194,1002],[1202,998],[1222,975]]],"bb":[1126,975,1222,1112],"cx":1174,"cy":1043},{"id":"route-210","name":"Route 210","t":"r","g":"route","kind":"route","nick":"The Moor Road","sum":"Wind-swept hills, heather and fog on the mountain's eastern flank. It feels remote, though it is not far from civilization. This is the road pilgrims, scholars and mountain travelers take when they leave Celestic Town.","facts":[["Connects","Celestic Town ↔ Solaceon Town ↔ Route 215 junction"],["Travel time","2 days (Celestic to Solaceon); 1 day (Solaceon to the Route 215 junction)"],["Danger","★★☆☆☆"]],"segs":[[[1061,769],[1071,772],[1081,770],[1092,772],[1098,779],[1118,771],[1127,782],[1132,783],[1137,788],[1144,802],[1151,809],[1172,816],[1188,827],[1203,830],[1214,840],[1217,851],[1213,856],[1213,867],[1226,883],[1228,899],[1222,912],[1222,924],[1231,935],[1232,940],[1229,962],[1222,969],[1222,975]]],"bb":[1061,769,1232,975],"cx":1146,"cy":872},{"id":"route-211","name":"Route 211","t":"r","g":"route","kind":"route","nick":"The Mountain Road","sum":"A steady climb out of Eterna's greenery into bare rock, scree and wind. It marks the end of the \"gentle\" part of Sinnoh. Here the mountain starts to dictate the pace.","facts":[["Connects","Eterna City ↔ Mt. Coronet Pass ↔ Celestic Town"],["Travel time","1 day on foot"],["Danger","★★★☆☆"]],"segs":[[[793,755],[806,756],[811,754],[821,756],[831,767],[840,767],[845,763],[885,761],[889,764],[897,764],[908,761],[922,771],[934,771],[939,767],[943,768],[962,763],[974,778],[995,776],[997,771],[1017,774],[1020,771],[1024,772],[1029,767],[1056,764],[1061,769]],[[953,598],[956,604],[947,618],[942,638],[954,652],[958,651],[963,659],[963,666],[957,668],[955,677],[958,685],[965,692],[964,703],[970,725],[969,729],[978,743],[976,754],[980,776],[966,780],[967,784],[963,794],[966,812],[963,819],[956,824],[952,833],[965,861],[975,870],[985,888],[985,906],[975,933],[982,937],[982,942],[986,944],[983,971],[992,982],[988,994],[980,1000],[980,1005],[976,1009],[975,1029],[980,1035],[969,1048],[966,1056],[961,1058],[957,1071],[957,1086],[947,1097],[941,1111],[944,1129]]],"bb":[793,598,1061,1129],"cx":927,"cy":863},{"id":"route-212","name":"Route 212","t":"r","g":"route","kind":"route","nick":"The Reed Road","sum":"South of Hearthome the farmland dissolves into drainage country: reed beds, braided creeks, old dikes and raised log causeways. The ground is never quite solid and never quite water. Two boundaries press on the road: the Safari Zone's tall perimeter wall to the east, and the Grand Marsh's open boardwalk edge to the west.","facts":[["Connects","Hearthome City ↔ Pastoria City"],["Travel time","6–8 days on foot (about 5 days by the paved Route 240 and Route 242 detour through Majolica Town)"],["Danger","★★★☆☆"]],"segs":[[[1132,1112],[1132,1130],[1146,1145],[1144,1164],[1152,1178],[1154,1193],[1144,1205],[1143,1222],[1139,1235],[1119,1256],[1112,1267],[1110,1285],[1118,1293],[1128,1298],[1141,1311],[1144,1319],[1146,1342],[1170,1363],[1174,1371],[1188,1383],[1218,1395],[1225,1390],[1231,1390],[1235,1385],[1280,1388],[1285,1384]]],"bb":[1110,1112,1285,1395],"cx":1197,"cy":1253},{"id":"route-213","name":"Route 213","t":"r","g":"route","kind":"route","nick":"The Sea Road","sum":"A paved coastal highway of delta flats, red sea cliffs, humming dunes and long empty beaches, always with the East Sea on the right-hand side. It is the most beautiful road in the south and the easiest to underestimate: the sea is close, the storms are sudden, and the cliffs are softer than they look.","facts":[["Connects","Pastoria City ↔ Neighborly Town"],["Travel time","4 days on foot (2 by bike or coastal bus)"],["Danger","★★☆☆☆"]],"segs":[[[1285,1384],[1283,1380],[1302,1365],[1329,1337],[1340,1331],[1359,1329],[1396,1292],[1444,1279],[1466,1264],[1482,1257],[1523,1249],[1530,1243],[1530,1238],[1538,1230],[1541,1230]]],"bb":[1283,1230,1541,1384],"cx":1412,"cy":1307},{"id":"route-214","name":"Route 214","t":"r","g":"route","kind":"route","nick":"The Gold Road","sum":"Locals call it that because every second vehicle has a sponsor's name on the door. Eastern Sinnoh's main artery: freight trucks, Contest coaches, commuter buses, cyclists in team colors, Gym challengers with sore knees and, in the summer, a steady line of Coordinators heading for the Grand Festival.","facts":[["Connects","Veilstone City ↔ Crown City (by the Crown Spur) ↔ Valor Lakefront and Grand Festival ↔ Neighborly Town"],["Travel time","3 days on foot Veilstone to Crown City; 6 days Veilstone to Neighborly by the Lake Road (about half that by bicycle or bus)"],["Danger","★☆☆☆☆"]],"segs":[[[1510,858],[1509,866],[1530,882],[1547,883],[1552,880],[1562,879],[1567,884],[1568,921],[1565,924],[1565,930],[1548,951],[1548,984],[1566,1007],[1579,1006],[1584,1011]],[[1584,1011],[1579,1006],[1566,1007],[1562,998],[1551,987],[1546,987],[1536,999],[1534,1005],[1533,1043],[1522,1061],[1522,1091],[1534,1113],[1534,1137],[1523,1157],[1522,1164],[1526,1169],[1522,1182],[1528,1187],[1526,1193],[1528,1195],[1527,1212],[1530,1226],[1541,1230]]],"bb":[1509,858,1584,1230],"cx":1546,"cy":1044},{"id":"route-215","name":"Route 215","t":"r","g":"route","kind":"route","nick":"The Highland Road","sum":"A long, rain-prone highland trail that climbs out of the Solaceon valley and descends toward Veilstone's cliffs. Wind farms appear first as flickering lights on the horizon and later as a forest of slow white blades.","facts":[["Connects","Route 210 junction (near Solaceon Town) ↔ Veilstone City"],["Travel time","4 days on foot"],["Danger","★★☆☆☆"]],"segs":[[[1225,928],[1234,932],[1269,932],[1281,928],[1309,928],[1329,919],[1336,919],[1348,928],[1356,928],[1371,917],[1393,914],[1417,889],[1431,882],[1456,881],[1468,878],[1488,866],[1501,866],[1510,858]]],"bb":[1225,858,1510,932],"cx":1367,"cy":895},{"id":"route-216","name":"Route 216","t":"r","g":"route","kind":"route","nick":"The Back Door","sum":"Where Route 217 crosses the snow country in the open, Route 216 goes into the mountain. A hard climb up a frozen gully ends in a cave mouth, and beyond it lies the North Gallery: a lit, roped, ice-glazed tunnel that runs for days toward the heart of Mt. Coronet.","facts":[["Connects","Greenstation Town ↔ the north junction of the Route 211 spine (Mt. Coronet)"],["Travel time","3–4 days on foot"],["Danger","★★★★☆"]],"segs":[[[847,432],[858,443],[860,462],[889,505],[889,529],[887,534],[893,559],[890,565],[896,576],[904,583],[915,588],[945,589],[953,598]]],"bb":[847,432,953,598],"cx":900,"cy":515},{"id":"route-217","name":"Route 217","t":"r","g":"route","kind":"route","nick":"The Long White Road","sum":"Route 217 is the north's answer to anyone who thinks Sinnoh is a chain of neighboring towns. For a week there is no town: only red marker poles, wind, a frozen lake that groans at night, and one lodge.","facts":[["Connects","Greenstation Town ↔ Acuity Lakefront ↔ Snowpoint City"],["Travel time","6–8 days on foot in settled weather; 10+ if a storm cycle pins you"],["Danger","★★★★★"]],"segs":[[[847,432],[835,439],[811,414],[809,370],[812,304],[807,291],[806,274],[817,268],[833,269],[836,266],[834,250],[837,247],[837,232],[843,226],[859,221],[871,215],[877,209],[893,209],[901,201],[901,195],[893,190]]],"bb":[806,190,901,439],"cx":853,"cy":314},{"id":"route-218","name":"Route 218","t":"r","g":"route","kind":"route","nick":"The Western Road","sum":"Sinnoh's busiest freight corridor outside Jubilife: steel, canned fish, lumber and ship's stores roll east, and passengers, machinery and Pokémon-care goods roll west. The road is fully paved, well lit at junctions and shared by trucks, coaches, cyclists and the occasional walker.","facts":[["Connects","Jubilife City ↔ Canalave City"],["Travel time","3–4 days on foot; about 2 by bicycle; the Canalave Coach (bus) takes one long day"],["Danger","★☆☆☆☆"]],"segs":[[[552,1151],[544,1151],[537,1157],[507,1158],[488,1168],[474,1170],[454,1177],[434,1175],[419,1168],[411,1160],[409,1142],[415,1127],[412,1120],[362,1120],[350,1110],[348,1090],[343,1085],[333,1082],[325,1074],[331,1067],[329,1051]]],"bb":[325,1051,552,1177],"cx":438,"cy":1114},{"id":"route-219","name":"Route 219","t":"r","g":"route","kind":"route","nick":"The Port Road","sum":"A short, flat, busy road of salt air and trucks, running through tidal flats and market gardens to the water. Almost everything that enters or leaves Sandgem by sea passes along it, and about once a week something comes down it that nobody has seen before.","facts":[["Connects","Sandgem Town ↔ Sandgem Port"],["Travel time","1 day on foot; half a day by bicycle"],["Danger","★☆☆☆☆"]],"segs":[[[557,1335],[564,1339],[568,1346],[567,1353],[558,1360],[559,1380]]],"bb":[557,1335,568,1380],"cx":562,"cy":1357},{"id":"route-220","name":"Route 220","t":"r","g":"route","kind":"route","nick":"The Long Coast Road","sum":"Sinnoh's longest unbroken seaside walk: cliffs, dunes, salt pans and fishing hamlets strung along a paved road that never quite leaves earshot of the sea. Slower than it looks. The road is paved and safe, but the villages are far apart and the weather is rarely on your side.","facts":[["Connects","Sandgem Port ↔ Sage Town"],["Travel time","5–6 days on foot; about 3 by bicycle"],["Danger","★★☆☆☆"]],"segs":[[[559,1380],[558,1359],[563,1356],[570,1356],[603,1383],[614,1389],[614,1393],[626,1394],[632,1399],[654,1402],[670,1414],[725,1467],[739,1476],[757,1483],[789,1513],[853,1550],[879,1571],[914,1587],[917,1585],[925,1585],[929,1588],[934,1586],[944,1595],[945,1602],[949,1604],[951,1610],[968,1617],[1002,1651],[1042,1674],[1057,1673]]],"bb":[558,1356,1057,1674],"cx":807,"cy":1515},{"id":"route-221","name":"Route 221","t":"r","g":"route","kind":"route","nick":"The Freight Road","sum":"This is Sinnoh's busiest trucking corridor outside Jubilife: container trucks, refrigerated vans, buses, couriers and the odd lost tourist. The road crosses the Grand Marsh's delta on a long causeway, then runs for days along cliffs and estuaries toward the cranes of the southern port.","facts":[["Connects","Pastoria City ↔ South Sinnoh Port"],["Travel time","5 days on foot (2–3 by bike or bus; trucks do it in a day)"],["Danger","★★☆☆☆"]],"segs":[[[1285,1384],[1281,1381],[1272,1382],[1263,1395],[1240,1399],[1216,1399],[1182,1438],[1168,1445],[1154,1448],[1141,1460],[1139,1471],[1153,1482],[1159,1483],[1170,1494],[1176,1504],[1176,1514],[1142,1545],[1114,1593],[1104,1604],[1094,1636],[1057,1673]]],"bb":[1057,1381,1285,1673],"cx":1171,"cy":1527},{"id":"route-222","name":"Route 222","t":"r","g":"route","kind":"route","nick":"The Sunrise Road","sum":"It runs along the south coast where the land flattens into tide flats, salt pans, dunes and low wind-bent scrub, and because it points east, travelers walk toward the dawn for much of every morning. Locals measure distances in tides, not hours: \"two tides to Daybreak\" is the Neighborly way of saying a day and a half.","facts":[["Connects","Neighborly Town ↔ the Sunrise Fork ↔ Daybreak Town and Camellia Town (with a paved link on from Camellia to Sunyshore City)"],["Travel time","3 days on foot Neighborly to the Sunrise Fork; half a day on to Daybreak or Camellia; one more day from Camellia to Sunyshore (about half that by bicycle)"],["Danger","★☆☆☆☆"]],"segs":[[[1541,1230],[1548,1228],[1558,1237],[1568,1230],[1628,1229],[1643,1226],[1645,1234],[1645,1226],[1656,1223],[1672,1223],[1681,1225],[1684,1228],[1699,1230],[1730,1228],[1741,1240],[1743,1248],[1758,1248],[1761,1251],[1761,1261],[1763,1263]],[[1644,1234],[1646,1225],[1656,1223],[1672,1223],[1681,1225],[1684,1228],[1699,1230],[1722,1230],[1730,1222],[1732,1207],[1743,1197],[1742,1190],[1745,1187],[1767,1187],[1779,1176],[1788,1180],[1796,1179],[1801,1174],[1803,1166]]],"bb":[1541,1166,1803,1263],"cx":1672,"cy":1214},{"id":"route-224","name":"Route 224","t":"r","g":"route","kind":"route","nick":"The Green Road","sum":"It is the spine of the eastern peninsula, running through a belt of orchards, millstreams and the wooded ridge locals call the Brusselwood. Greenhouses glow on the ridgetop at night, timber trucks rumble through the forest margin, and anyone heading for a Contest in Arrowroot, Brussel or Neighborly eventually travels it.","facts":[["Connects","Arrowroot Town ↔ Brussel Town ↔ Neighborly Town (meeting Route 214 and Route 213 at the Neighborly junction)"],["Travel time","3 days on foot end to end (1-2 days Arrowroot to Brussel, 1-2 days Brussel to Neighborly); about 1-2 days by bicycle"],["Danger","★★☆☆☆"]],"segs":[[[1633,1107],[1640,1105],[1644,1115],[1644,1124],[1639,1130],[1637,1159],[1621,1173],[1614,1173],[1602,1163],[1596,1165],[1589,1173],[1587,1182],[1566,1198],[1550,1214],[1549,1226],[1541,1230]]],"bb":[1541,1105,1644,1230],"cx":1592,"cy":1167},{"id":"route-225","name":"Route 225","t":"r","g":"route","kind":"route","nick":"The Feeder Road","sum":"Named for the pylons that carry Sunyshore's solar power to Crown City, which march beside it the whole way. Cable, coastline and sunlight define the route: white cliffs and gull-colored sea in the first half, wide shore and glittering panels in the second.","facts":[["Connects","Crown City ↔ Arrowroot Town ↔ Sunyshore City"],["Travel time","4 days on foot end to end (Crown to Arrowroot 1-2 days, Arrowroot to Sunyshore 2 days); about 2 by bicycle"],["Danger","★★☆☆☆"]],"segs":[[[1584,1011],[1587,1020],[1582,1029],[1583,1036],[1603,1061],[1616,1085],[1625,1094],[1625,1099],[1633,1107],[1648,1104],[1655,1112],[1656,1130],[1660,1134],[1668,1137],[1742,1136],[1752,1145],[1752,1151],[1758,1157],[1772,1158],[1777,1164],[1777,1173],[1788,1180],[1796,1179],[1801,1174],[1803,1166]]],"bb":[1582,1011,1803,1180],"cx":1692,"cy":1095},{"id":"route-226","name":"Route 226","t":"r","g":"route","kind":"route","nick":"The Long Road","sum":"An ordinary highway that happens to cross four climates in ten days. It leaves Snowpoint through steam and geothermal-heated pavement, descends past Lilypad's hot springs, crosses the Thaw Line where the snow finally stops, and ends in wind and salt spray on the cliffs above Veilstone.","facts":[["Connects","Snowpoint City ↔ Lilypad Town ↔ Lucario Kingdom ↔ Veilstone City"],["Travel time","9–11 days on foot end to end; 4–6 by bicycle or mount; about 3 by long-haul coach when the road is plowed"],["Danger","★★☆☆☆"]],"segs":[[[893,190],[900,194],[901,201],[900,208],[891,217],[891,230],[913,253],[927,272],[934,295],[944,307],[947,321],[951,325],[959,326],[966,336],[966,360],[975,380],[979,384],[981,414],[1008,467],[1016,488],[1025,497],[1043,508],[1063,529],[1080,560],[1084,575],[1102,592],[1119,598],[1131,610],[1141,634],[1141,641],[1145,641],[1158,650],[1162,649],[1171,658],[1175,657],[1188,668],[1201,674],[1222,695],[1232,708],[1242,736],[1267,777],[1296,803],[1313,808],[1329,808],[1353,797],[1370,797],[1395,824],[1426,828],[1453,851],[1478,856],[1492,871],[1505,870],[1509,866],[1510,858]]],"bb":[891,190,1510,871],"cx":1200,"cy":530},{"id":"route-227","name":"Route 227","t":"r","g":"route","kind":"route","nick":"The Warm Gallery","sum":"In a country defined by cold, Route 227 is a rare place that is warm. The tunnel was bored for the narrow-gauge Lilypad Line, a freight railway that once carried ore and now carries passengers, mail, geothermal pipe and frozen fish. Heat from the mountain's hot springs runs through the rock, so the middle of the tunnel is damp, foggy and mild, with ferns growing near the lamps.","facts":[["Connects","Greenstation Town ↔ Lilypad Town"],["Travel time","2 days on foot (an overnight at the Steam Halt); about 5 hours by the Lilypad Line train"],["Danger","★★☆☆☆"]],"segs":[[[847,432],[886,433],[907,413],[916,394],[916,387],[930,372],[931,361],[949,344],[950,329],[955,325],[960,328]]],"bb":[847,325,960,433],"cx":903,"cy":379},{"id":"route-228","name":"Route 228","t":"r","g":"route","kind":"route","nick":"The Rope Road","sum":"Route 228 is paved, short and ordinary on a clear day. In a storm it becomes the reason Shelter Town exists. A guide-rope runs the whole length of the road, threaded through numbered bell posts every two hundred paces, each with a brass bell. When the snow comes in sideways, travelers hold the rope, ring the nearest bell, and walk toward the sound of the next.","facts":[["Connects","Shelter Town ↔ Greenstation Town"],["Travel time","1–2 days on foot (a long single day with an early start; most parties take two)"],["Danger","★★☆☆☆ (★★★★☆ in a blizzard)"]],"segs":[[[801,490],[808,459],[816,452],[825,455],[836,454],[837,448],[846,438],[847,432]]],"bb":[801,432,847,490],"cx":824,"cy":461},{"id":"route-229","name":"Route 229","t":"r","g":"route","kind":"route","nick":"The Snow Line Road","sum":"On Route 229 you can walk from autumn into winter in an afternoon. The road leaves Sandalstraw's orchards and farms, climbs to the grey foothills, ducks into the Foothill Cut, a long tunnel through the ridge, and emerges on the other side into snow.","facts":[["Connects","Sandalstraw Town ↔ Shelter Town"],["Travel time","2 days on foot"],["Danger","★☆☆☆☆ (★★★☆☆ once the snow closes in)"]],"segs":[[[719,575],[729,587],[743,587],[767,564],[795,530],[796,518],[803,511],[801,490]]],"bb":[719,490,803,587],"cx":761,"cy":538},{"id":"route-230","name":"Route 230","t":"r","g":"route","kind":"route","nick":"The Timber Road","sum":"Eterna's beams, barrels and charcoal come down this road, and Sandalstraw's straw goods go with them. The countryside is working woodland: larch and pine plantations in rows, sawmills on the river, charcoal clamps in clearings, and logging roads that climb into the hills on either side. It is not wilderness, and its Pokémon have adapted to saws and lorries with the cheerful pragmatism of a population that has lived beside industry for generations.","facts":[["Connects","Sandalstraw Town ↔ Eterna City"],["Travel time","2 days on foot; one day by coach"],["Danger","★☆☆☆☆"]],"segs":[[[719,575],[724,581],[724,595],[721,598],[720,663],[749,689],[749,698],[741,707],[741,715],[744,718],[753,718],[755,716],[762,726],[767,726],[790,746],[790,752],[793,755]]],"bb":[719,575,793,755],"cx":756,"cy":665},{"id":"route-231","name":"Route 231","t":"r","g":"route","kind":"route","nick":"The Heathway","sum":"This is where the ring road leaves the coast and the country gets large. The pavement crosses salt meadow, high heath, a reedy lake and a long run of hay and straw land, with no shelter except two Route Houses and the occasional herdsman's hut. Wind is constant. Sheep are everywhere.","facts":[["Connects","Squallville ↔ Sandalstraw Town"],["Travel time","3 days on foot; two by coach or bicycle"],["Danger","★★☆☆☆"]],"segs":[[[561,762],[564,753],[588,730],[603,729],[608,732],[616,732],[622,726],[637,695],[644,688],[644,682],[652,663],[681,636],[689,610],[701,597],[704,576],[714,571],[719,575]]],"bb":[561,571,719,762],"cx":640,"cy":666},{"id":"route-232","name":"Route 232","t":"r","g":"route","kind":"route","nick":"The Salt Road","sum":"Where Route 233 smells of honey and cocoa, Route 232 smells of kelp, tar and cold iron. It runs along the Long Strand and over the dune ridge, past salt pans and sea stacks, to the tidal causeway into Squallville. The wind arrives from the west with nothing between it and the horizon, and everyone on the road checks the sky as a habit.","facts":[["Connects","Chocovine Town ↔ Squallville"],["Travel time","2–3 days on foot; a long day by coach in fair weather"],["Danger","★★☆☆☆"]],"segs":[[[457,891],[459,884],[464,883],[471,876],[479,862],[524,822],[530,811],[536,790],[561,762]]],"bb":[457,762,561,891],"cx":509,"cy":826},{"id":"route-233","name":"Route 233","t":"r","g":"route","kind":"route","nick":"The Sweet Road","sum":"Honey wagons and cut-flower trucks roll one way; cocoa lorries and tins of confectionery roll the other. Coach drivers announce it as the Sweet Road at every stop, and hauliers will tell you it is the only road in Sinnoh with a smell timetable: lavender and clover near Floaroma, warm blossom through the orchards, and then, long before any chimney is visible, the dark roasted smell of Chocovine coming down the terraces on a south wind.","facts":[["Connects","Floaroma Town ↔ the Ring Junction (meeting Route 234 from Canalave City) ↔ Chocovine Town"],["Travel time","2 days on foot; one long day by coach or bicycle"],["Danger","★☆☆☆☆"]],"segs":[[[558,980],[542,994],[522,1001],[511,1008],[497,1011],[483,986],[475,960],[458,938],[457,916],[447,903],[447,898],[454,891],[457,891]]],"bb":[447,891,558,1011],"cx":502,"cy":951},{"id":"route-234","name":"Route 234","t":"r","g":"route","kind":"route","nick":"The Orchard Road","sum":"A gently rolling coastal plain of berry orchards, hedgerows and wind-bent poplars, with the sea visible on the left for the first half-day. This is the route Canalave's fishermen and shipwrights use to reach Floaroma's markets, and the route Floaroma's flower growers use to ship cut flowers to the port.","facts":[["Connects","the Route 218 fork (east of Canalave) ↔ the Route 233 ring-road junction near Floaroma Town"],["Travel time","2 days on foot; 1 by bicycle (about 3 from Canalave itself)"],["Danger","★☆☆☆☆"]],"segs":[[[412,1120],[415,1112],[438,1089],[451,1083],[456,1078],[459,1070],[481,1047],[485,1035],[491,1029],[492,1017],[497,1011]]],"bb":[412,1011,497,1120],"cx":454,"cy":1065},{"id":"route-235","name":"Route 235","t":"r","g":"route","kind":"route","nick":"The Hairpin Road","sum":"A paved mining road from an older age, once the only way to haul ore down to Jubilife, now kept open by Alamos's cheesemakers, Oreburgh's courier guild and a stubborn preservation society. It climbs more than it needs to, because the engineers who laid it were routing around two long-vanished quarries.","facts":[["Connects","Jubilife City (north-east outskirts) ↔ Alamos Town spur ↔ Oreburgh City (north gate)"],["Travel time","4 days on foot; about 2 by bicycle"],["Danger","★★☆☆☆"]],"segs":[[[552,1151],[559,1149],[572,1138],[588,1133],[601,1120],[601,1104],[597,1096],[597,1085],[602,1079],[609,1079],[613,1087],[622,1096],[640,1101],[657,1114],[672,1116],[677,1111],[682,1118],[703,1131],[729,1131],[745,1147],[762,1147],[781,1164]]],"bb":[552,1079,781,1164],"cx":666,"cy":1121},{"id":"route-236","name":"Route 236","t":"r","g":"route","kind":"route","nick":"The Coach Road","sum":"For most of Sinnoh's civilians, this is the way to Oreburgh: paved, signed and scheduled. Coaches leave Jubilife's south terminal hourly. Ore haulers, schoolchildren and business travelers ride the same road as walkers, and the trainers who take it are usually the ones who got a refund on the Route 203 tunnel.","facts":[["Connects","Jubilife City ↔ Oreburgh City, joining Route 237 for the last stretch"],["Travel time","3–4 days on foot; about a day by bicycle; the coach takes six hours"],["Danger","★☆☆☆☆"]],"segs":[[[552,1151],[559,1154],[562,1166],[561,1172],[572,1183],[572,1190],[609,1219],[628,1222],[679,1221],[687,1225],[710,1248],[740,1248],[751,1244],[765,1229],[767,1216],[772,1208],[774,1191],[790,1175],[788,1167],[781,1164]]],"bb":[552,1151,790,1248],"cx":671,"cy":1199},{"id":"route-237","name":"Route 237","t":"r","g":"route","kind":"route","nick":"The Ore Road","sum":"Oreburgh's coal and ore leave the city by this route for Sandgem Port, so the road is built for weight: broad lanes, deep gravel shoulders, weighbridges and truck stops with wash bays for Pokémon. It is the working spine of the southwest, and nobody who lives on it ever calls it quiet.","facts":[["Connects","Sandgem Town ↔ Oreburgh City, joining Route 236 for the last stretch"],["Travel time","3–4 days on foot; about 1.5 days by bicycle; ore trucks do it in a long day"],["Danger","★★☆☆☆"]],"segs":[[[557,1335],[569,1339],[580,1338],[594,1327],[605,1323],[627,1301],[632,1301],[638,1297],[664,1271],[678,1262],[690,1258],[702,1258],[710,1248],[740,1248],[751,1244],[765,1229],[767,1216],[772,1208],[774,1191],[790,1175],[788,1167],[781,1164]]],"bb":[557,1164,790,1339],"cx":673,"cy":1251},{"id":"route-238","name":"Route 238","t":"r","g":"route","kind":"route","nick":"The Woodcutters' Way","sum":"A rough track through drover's lanes, then a long wooded stretch under the broad oaks of Bewilder Forest, then out into hedged pasture on Sandgem's doorstep. Slower than Route 202, wilder, and the one where it is easiest to get lost.","facts":[["Connects","Jubilife City (south edge, near Route 202) ↔ Bewilder Forest ↔ Sandgem Town (north edge)"],["Travel time","3–4 days on foot"],["Danger","★★☆☆☆"]],"segs":[[[552,1151],[564,1163],[570,1164],[568,1207],[573,1220],[570,1246],[574,1250],[573,1270],[565,1285],[563,1304],[568,1317],[568,1328],[561,1335],[557,1335]]],"bb":[552,1151,574,1335],"cx":563,"cy":1243},{"id":"route-239","name":"Route 239","t":"r","g":"route","kind":"route","nick":"The Meltwater Road","sum":"Route 239 climbs out of Solaceon's sheltered valley into the foothills on the east face of Mt. Coronet, following a cold, milk-pale stream that begins as glacier melt on the white plateau above. It is the only way to Michina Town, and nearly everyone on it is going for one of four reasons: wool, stone, scholarship, or a question they hope the Ruins will answer.","facts":[["Connects","Solaceon Town ↔ Michina Town (with the Pilgrims' Spur on to Michina Ruins)"],["Travel time","2–3 days on foot"],["Danger","★★☆☆☆ (★★★☆☆ in spring melt, or above the Cairn Gallery after dark)"]],"segs":[[[1222,975],[1209,982],[1182,979],[1175,976],[1153,954],[1144,949],[1137,949],[1128,941]]],"bb":[1128,941,1222,982],"cx":1175,"cy":961},{"id":"route-240","name":"Route 240","t":"r","g":"route","kind":"route","nick":"The Potters' Road","sum":"A broad paved highway across gentle plain, busy with clay carts, couriers and the Kiln Line bus. Every mile is marked by a hand-glazed mile tile, and no two are alike. Locals can tell a stranger by whether they look at the tiles.","facts":[["Connects","Hearthome City ↔ Majolica Town"],["Travel time","2 days on foot (one long day by bike or the Kiln Line bus)"],["Danger","★☆☆☆☆"]],"segs":[[[1132,1112],[1136,1123],[1147,1132],[1158,1135],[1183,1152],[1204,1159],[1214,1153],[1220,1153],[1223,1156]]],"bb":[1132,1112,1223,1159],"cx":1177,"cy":1135},{"id":"route-241","name":"Route 241","t":"r","g":"route","kind":"route","nick":"The Millpond Road","sum":"A paved road over low rolling country of mill ponds, hill orchards and chalk cuttings. Windpumps turn in every field. It is the pleasant way to leave the clay country: wide verges, cider stalls, and a sense that nobody is in a hurry.","facts":[["Connects","Majolica Town (via the Route 242 junction) ↔ Route 213 at Three Gulls Crossing"],["Travel time","2–3 days on foot (a long day by bike)"],["Danger","★☆☆☆☆"]],"segs":[[[1223,1156],[1228,1166],[1228,1178],[1246,1194],[1254,1197],[1259,1202],[1273,1202],[1307,1211],[1324,1220],[1328,1224],[1330,1232],[1331,1252],[1379,1300]]],"bb":[1223,1156,1379,1300],"cx":1301,"cy":1228},{"id":"route-242","name":"Route 242","t":"r","g":"route","kind":"route","nick":"The Gate Road","sum":"The fast, safe way into Pastoria: a paved highway across farmland, then wet pasture, then reed wall and delta. It is the road the Safari Zone's buses take, so it carries more tourists than any road in the south.","facts":[["Connects","Majolica Town ↔ Pastoria City"],["Travel time","3 days on foot (two by bike or the Gate Line bus)"],["Danger","★★☆☆☆"]],"segs":[[[1223,1156],[1228,1166],[1228,1182],[1236,1192],[1244,1212],[1248,1239],[1252,1243],[1269,1243],[1258,1243],[1253,1249],[1253,1278],[1261,1318],[1264,1321],[1265,1363],[1285,1384]]],"bb":[1223,1156,1285,1384],"cx":1254,"cy":1270},{"id":"battle-resort-route-225","name":"Battle Resort Route 225","t":"r","g":"route","kind":"route","nick":"The Training Road","sum":"Everyone on this road is walking toward a test. At the south end is the Fight Area, where trainers learn to win; at the north end is the Survival Area, where they learn to endure; the Resort's \"Full Circuit\" program sells the road between them as the part where the two lessons meet.","facts":[["Connects","Battle Resort Fight Area ↔ Battle Resort Survival Area"],["Travel time","4–5 days on foot (about half that with bikes or mounts, which the Training Pass discourages)"],["Danger","★★☆☆☆"]],"segs":[[[1325,600],[1322,594],[1321,570],[1334,555],[1330,528],[1339,517],[1335,478],[1342,469],[1354,465],[1364,455],[1368,445],[1368,430],[1378,411],[1379,404],[1383,400],[1386,383]]],"bb":[1321,383,1386,600],"cx":1353,"cy":491},{"id":"battle-resort-route-226","name":"Battle Resort Route 226","t":"r","g":"route","kind":"route","nick":"The Bay Road","sum":"A route of crossings. Where Stark's meltwater meets the tide of the Inner Sound, the north shore becomes salt meadow, mudflat, reed bank and braided river, and the trail is a patient sequence of causeways, fords and rope-lines. It is quiet compared to Battle Resort Route 225: fewer cadets, more herons, long horizons, and fog that turns the Bay into a pale wall.","facts":[["Connects","Battle Resort Survival Area ↔ Stark Fork (the three-way junction with Battle Resort Route 227 and Battle Resort Route 228)"],["Travel time","3–4 days on foot"],["Danger","★★★☆☆"]],"segs":[[[1386,383],[1385,380],[1390,370],[1400,361],[1438,361],[1447,368],[1462,370],[1471,365],[1478,365],[1488,373],[1500,373],[1513,367]]],"bb":[1385,361,1513,383],"cx":1449,"cy":372},{"id":"battle-resort-route-227","name":"Battle Resort Route 227","t":"r","g":"route","kind":"route","nick":"The Ash Road","sum":"The only way up Mt. Stark on foot. Heather moor gives way to wind-bent pine, then to black cinder, steam and sulfur-yellow rock. The League's volcano watch keeps the road open, marked, and monitored; it does not keep it safe.","facts":[["Connects","Stark Fork (junction with Battle Resort Route 226 and Battle Resort Route 228) ↔ Mt. Stark"],["Travel time","2–3 days up, 1–2 days down"],["Danger","★★★★☆"]],"segs":[[[1513,367],[1513,355],[1520,350],[1529,349],[1534,342],[1528,326],[1537,316],[1535,287]]],"bb":[1513,287,1537,367],"cx":1525,"cy":327},{"id":"battle-resort-route-228","name":"Battle Resort Route 228","t":"r","g":"route","kind":"route","nick":"The Spine","sum":"The east arm's ridge is a country of waterfalls, terraced orchards, and warm caves, and it is the island's quiet side. The Resort's glossy edge never quite reaches it. The people here are the Terrace families: the island's original farmers, who grow the berries, honey and fruit the Resort restaurants advertise as \"island-grown\" and who regard the advertising with a mixture of pride and suspicion.","facts":[["Connects","Stark Fork (junction with Battle Resort Route 226 and Battle Resort Route 227) ↔ Battle Resort Port"],["Travel time","5–6 days on foot (the island's longest route)"],["Danger","★★★☆☆"]],"segs":[[[1513,367],[1529,371],[1555,372],[1566,383],[1572,394],[1575,413],[1596,433],[1596,451],[1605,463],[1603,487],[1606,492],[1606,512],[1603,517],[1603,527],[1613,544],[1613,558],[1609,570],[1611,597],[1601,609]]],"bb":[1513,367,1613,609],"cx":1563,"cy":488},{"id":"battle-resort-route-229","name":"Battle Resort Route 229","t":"r","g":"route","kind":"route","nick":"The Shell Road","sum":"The island's gentle end: dunes, tide pools, grassy headlands, and a long beach where the Resort's villas look down on the water. It feels like a holiday. Trainers who have just walked the Spine arrive tanned and blistered and feel a bit ridiculous, and the Resort is perfectly happy to sell them a spa towel.","facts":[["Connects","Battle Resort Port ↔ Resort Area"],["Travel time","2 days on foot (the Resort's sea shuttle makes it an hour)"],["Danger","★★☆☆☆"]],"segs":[[[1601,609],[1612,608],[1619,615],[1623,615],[1629,624],[1649,643],[1664,648],[1678,662]]],"bb":[1601,608,1678,662],"cx":1639,"cy":635},{"id":"pavilion-road","name":"Pavilion Road","t":"r","g":"route","kind":"route","nick":"","sum":"The short natural track from Champion's Port to Elite Four Island, about a day on foot. Challengers walk it with a League escort after ringing the Challenger's Bell at the gate.","facts":[["Connects","Champion's Port ↔ Elite Four Island"],["Travel time","about a day on foot"]],"segs":[[[1724,883],[1729,868],[1746,854]]],"bb":[1724,854,1746,883],"cx":1735,"cy":868}];
const PD_BY={};PD.forEach(f=>{PD_BY[f.id]=f;});
const PLACES=PD.map(f=>f.name).sort();

/* ---------- store: refs, local copies, write queue ---------- */
const SET_ALWAYS=new Set(['meta','gl','gn','bn','pl','gp']);
function refFor(sc,id){
  const db=S.db;
  switch(sc){
    case 't':return db.collection('trainers').doc(id);
    case 'p':{const i=id.indexOf('/');return db.collection('trainers').doc(id.slice(0,i)).collection('pokemon').doc(id.slice(i+1));}
    case 'ppl':return db.collection('people').doc(id);
    case 'j':return db.collection('journal').doc(id);
    case 'l':return db.collection('leads').doc(id);
    case 'n':return db.doc('data/users/'+S.me.id+'/profile').collection('notes').doc(id);
    case 'meta':return db.collection('meta').doc('table');
    case 'gl':return db.collection('gm').doc('loy_'+id);
    case 'gn':return db.collection('gm').doc('npc_'+id);
    case 'tl':return db.collection('timeline').doc(id);
    case 'pin':return db.collection('pins').doc(id);
    case 'aw':return db.collection('awards').doc(id);
    case 'bn':return db.collection('meta').doc('banner');
    case 'pl':return db.collection('places').doc(id);
    case 'gp':return db.collection('gm').doc('place_'+id);
  }
}
function getLocal(sc,id){
  switch(sc){
    case 't':return S.trainers[id];
    case 'p':{const i=id.indexOf('/');const m=S.pokemon[id.slice(0,i)];return m&&m[id.slice(i+1)];}
    case 'ppl':return S.people[id];
    case 'j':return S.journal[id];
    case 'l':return S.leads[id];
    case 'n':return S.notes[id];
    case 'meta':return S.meta;
    case 'gl':return S.gmLoy[id];
    case 'gn':return S.gmNpc[id];
    case 'tl':return S.timeline[id];
    case 'pin':return S.pins[id];
    case 'aw':return S.awards[id];
    case 'bn':return S.banner;
    case 'pl':return S.places[id];
    case 'gp':return S.gmPl[id];
  }
}
function putLocal(sc,id,d){
  switch(sc){
    case 't':S.trainers[id]=d;break;
    case 'p':{const i=id.indexOf('/');const u=id.slice(0,i);(S.pokemon[u]||(S.pokemon[u]={}))[id.slice(i+1)]=d;break;}
    case 'ppl':S.people[id]=d;break;
    case 'j':S.journal[id]=d;break;
    case 'l':S.leads[id]=d;break;
    case 'n':S.notes[id]=d;break;
    case 'meta':S.meta=d;break;
    case 'gl':S.gmLoy[id]=d;break;
    case 'gn':S.gmNpc[id]=d;break;
    case 'tl':S.timeline[id]=d;break;
    case 'pin':S.pins[id]=d;break;
    case 'aw':S.awards[id]=d;break;
    case 'bn':S.banner=d;break;
    case 'pl':S.places[id]=d;break;
    case 'gp':S.gmPl[id]=d;break;
  }
}
function dropLocal(sc,id){
  switch(sc){
    case 't':delete S.trainers[id];break;
    case 'p':{const i=id.indexOf('/');const m=S.pokemon[id.slice(0,i)];if(m)delete m[id.slice(i+1)];break;}
    case 'ppl':delete S.people[id];break;
    case 'j':delete S.journal[id];break;
    case 'l':delete S.leads[id];break;
    case 'n':delete S.notes[id];break;
    case 'gl':delete S.gmLoy[id];break;
    case 'gn':delete S.gmNpc[id];break;
    case 'tl':delete S.timeline[id];break;
    case 'pin':delete S.pins[id];break;
    case 'aw':delete S.awards[id];break;
    case 'pl':delete S.places[id];break;
    case 'gp':delete S.gmPl[id];break;
  }
}

const Q=new Map();
function setStatus(kind,msg){
  S.save=kind==='busy'?{cls:'busy',text:'Saving…'}:kind==='err'?{cls:'err',text:msg||'Could not save'}:kind==='note'?{cls:'',text:msg}:{cls:'',text:'Saved'};
  const el=document.getElementById('savestate');
  if(el){el.className='save '+S.save.cls;el.textContent=S.save.text;}
}
function fail(e){
  const code=(e&&e.code)||'error';
  if(code==='invalid_argument'||code==='permission-denied'){S.ui.writeFail=true;scheduleRender();}
  setStatus('err','Could not save ('+code+')');
}
function save(sc,id,patch,o){
  o=o||{};
  const key=sc+'|'+id;
  let q=Q.get(key);
  if(!q){q={patch:{},inflight:null,timer:0,busy:false,create:false};Q.set(key,q);}
  Object.assign(q.patch,patch);
  if(o.create)q.create=true;
  setStatus('busy');
  clearTimeout(q.timer);
  q.timer=setTimeout(()=>flush(key,sc,id),o.create?0:450);
}
async function flush(key,sc,id){
  const q=Q.get(key);
  if(!q)return;
  if(q.busy){q.timer=setTimeout(()=>flush(key,sc,id),120);return;}
  const patch=q.patch;
  const whole=q.create||SET_ALWAYS.has(sc);
  q.patch={};q.create=false;q.busy=true;q.inflight=patch;
  let err=null;
  try{
    const ref=refFor(sc,id);
    const full=getLocal(sc,id);
    const clean=full?JSON.parse(JSON.stringify(full)):null;
    if(whole){if(clean)await ref.set(clean);}
    else{
      try{await ref.update(patch);}
      catch(e){if(e&&e.code==='invalid_argument'&&clean){await ref.set(clean);}else throw e;}
    }
  }catch(e){err=e;}
  q.busy=false;q.inflight=null;
  if(err){Q.delete(key);fail(err);return;}
  if(Object.keys(q.patch).length||q.create){q.timer=setTimeout(()=>flush(key,sc,id),0);}
  else Q.delete(key);
  if(!Q.size)setStatus('saved');
}
function withPending(sc,id,d){
  const base=Object.assign({},d);
  const q=Q.get(sc+'|'+id);
  if(q)Object.assign(base,q.inflight||{},q.patch);
  return base;
}
function edit(sc,id,path,v){
  let doc=getLocal(sc,id);
  if(!doc){
    if(sc==='gl'||sc==='gn'||sc==='pl'||sc==='gp'){doc={};putLocal(sc,id,doc);}
    else return;
  }
  const parts=path.split('.');
  const top=parts[0];
  const nv=setIn(doc[top],parts.slice(1),v);
  doc[top]=nv;
  save(sc,id,{[top]:nv});
}
function newDoc(sc,id,doc){putLocal(sc,id,doc);save(sc,id,doc,{create:true});}
async function removeDoc(sc,id){
  const key=sc+'|'+id;
  const q=Q.get(key);
  if(q){clearTimeout(q.timer);Q.delete(key);}
  dropLocal(sc,id);
  scheduleRender();
  try{
    await refFor(sc,id).delete();
    if(S.me.admin){
      if(sc==='p')await refFor('gl',id.slice(id.indexOf('/')+1)).delete();
      if(sc==='ppl')await refFor('gn',id).delete();
    }
  }catch(e){fail(e);}
}

/* ---------- live subscriptions ---------- */
let rq=0;
function scheduleRender(){if(rq)return;rq=requestAnimationFrame(()=>{rq=0;render();});}
function markReady(){if(!S.ready){S.ready=true;scheduleRender();}}
function snapMap(snap,sc,keep,prefix){
  const m={};
  snap.docs.forEach(d=>{m[d.id]=withPending(sc,(prefix||'')+d.id,d.data());});
  Object.keys(keep||{}).forEach(id=>{if(!(id in m)&&Q.has(sc+'|'+(prefix||'')+id))m[id]=keep[id];});
  return m;
}
function watch(query,onSnap,label){
  return query.onSnapshot(s=>{onSnap(s);scheduleRender();},e=>{console.warn(label,e&&e.code);markReady();});
}
const pokeSubs={};
function startWatches(){
  const db=S.db;
  watch(db.collection('trainers'),snap=>{
    S.trainers=snapMap(snap,'t',S.trainers);
    const have=new Set(Object.keys(S.trainers));
    have.forEach(uid=>{
      if(pokeSubs[uid])return;
      pokeSubs[uid]=db.collection('trainers').doc(uid).collection('pokemon').onSnapshot(s=>{
        S.pokemon[uid]=snapMap(s,'p',S.pokemon[uid],uid+'/');
        scheduleRender();
      },e=>console.warn('pokemon',e&&e.code));
    });
    Object.keys(pokeSubs).forEach(uid=>{
      if(!have.has(uid)){pokeSubs[uid]();delete pokeSubs[uid];delete S.pokemon[uid];}
    });
    markReady();
  },'trainers');
  watch(db.collection('people'),s=>{S.people=snapMap(s,'ppl',S.people);},'people');
  watch(db.collection('journal'),s=>{S.journal=snapMap(s,'j',S.journal);},'journal');
  watch(db.collection('leads'),s=>{S.leads=snapMap(s,'l',S.leads);},'leads');
  watch(db.collection('awards'),s=>{S.awards=snapMap(s,'aw',S.awards);},'awards');
  watch(db.collection('timeline'),s=>{S.timeline=snapMap(s,'tl',S.timeline);},'timeline');
  watch(db.collection('pins'),s=>{S.pins=snapMap(s,'pin',S.pins);},'pins');
  watch(db.collection('places'),s=>{S.places=snapMap(s,'pl',S.places);},'places');
  watch(db.collection('meta').doc('banner'),s=>{
    if(s.exists)S.banner=withPending('bn','banner',s.data());
    else if(!Q.has('bn|banner'))S.banner={};
  },'banner');
  watch(db.collection('mapimg'),s=>{
    const o={};
    s.docs.forEach(d=>{o[d.id]=d.data();});
    S.mapChunks=o;
    assembleMap();
  },'mapimg');
  watch(db.collection('meta').doc('table'),s=>{
    if(s.exists)S.meta=Object.assign({},DEF_META,withPending('meta','table',s.data()));
    else if(!Q.has('meta|table'))S.meta=Object.assign({},DEF_META);
  },'meta');
  if(S.me.admin){
    watch(db.collection('gm'),s=>{
      const loy={},npc={},gpl={};
      s.docs.forEach(d=>{
        if(d.id.indexOf('loy_')===0)loy[d.id.slice(4)]=withPending('gl',d.id.slice(4),d.data());
        else if(d.id.indexOf('npc_')===0)npc[d.id.slice(4)]=withPending('gn',d.id.slice(4),d.data());
        else if(d.id.indexOf('place_')===0)gpl[d.id.slice(6)]=withPending('gp',d.id.slice(6),d.data());
      });
      Object.keys(S.gmPl).forEach(id=>{if(!(id in gpl)&&Q.has('gp|'+id))gpl[id]=S.gmPl[id];});
      Object.keys(S.gmLoy).forEach(id=>{if(!(id in loy)&&Q.has('gl|'+id))loy[id]=S.gmLoy[id];});
      Object.keys(S.gmNpc).forEach(id=>{if(!(id in npc)&&Q.has('gn|'+id))npc[id]=S.gmNpc[id];});
      S.gmLoy=loy;S.gmNpc=npc;S.gmPl=gpl;
    },'gm');
  }
  if(CFG&&S.me.admin){
    watch(db.collection('config').doc('invite'),s=>{S.invite=s.exists?s.data():null;},'invite');
    watch(db.collection('members'),s=>{const m={};s.docs.forEach(d=>{m[d.id]=d.data();});S.members=m;},'members');
  }
  if(S.me.id){
    watch(db.doc('data/users/'+S.me.id+'/profile').collection('notes'),s=>{S.notes=snapMap(s,'n',S.notes);},'notes');
  }
}

async function startRoom(){
  const room=await use('room');
  if(!room)return;
  S.room=room;
  try{
    room.onPeers(ch=>{S.peers=ch.peers.filter(p=>p.kind==='viewer');renderHead();ensureNames();},()=>{});
    setPresence();
  }catch(e){}
}

/* ---------- derived lists and permissions ---------- */
const tids=()=>Object.keys(S.trainers).sort((a,b)=>{
  if(a===S.me.id)return -1;
  if(b===S.me.id)return 1;
  return num(S.trainers[a].createdAt)-num(S.trainers[b].createdAt);
});
const monsOf=uid=>Object.entries(S.pokemon[uid]||{}).map(([id,m])=>Object.assign({id},m)).sort((a,b)=>num(a.order)-num(b.order)||num(a.createdAt)-num(b.createdAt));
const partyOf=uid=>monsOf(uid).filter(m=>m.slot!=='box');
const boxOf=uid=>monsOf(uid).filter(m=>m.slot==='box');
const canEditT=uid=>S.me.canWrite&&(uid===S.me.id||S.me.admin);
const canShared=()=>S.me.canWrite;
const canOwn=e=>S.me.canWrite&&(S.me.admin||e.addedBy===S.me.id);
const nm=uid=>uid===S.me.id?'you':(S.names[uid]||'a player');
const tName=t=>(t&&t.name)||'Unnamed trainer';
const mName=m=>m.nick||m.species||'Unnamed Pokémon';
const badgeCount=t=>BADGES.filter(b=>t&&t.badges&&t.badges[b[0]]).length;

/* ---------- field builders ---------- */
const bd=(sc,id,path)=>raw('data-b="'+esc(sc+'|'+id+'|'+path)+'"');
const bp=(sc,id,path)=>raw('data-p="'+esc(sc+'|'+id+'|'+path)+'"');
const dis=ro=>ro?raw('disabled'):'';
const attr=(n,v)=>v==null||v===''?'':raw(n+'="'+esc(v)+'"');

function fText(label,sc,id,path,doc,o){
  o=o||{};
  return h`<label class="fld ${o.cls||''}"><span class="fl">${label}</span><input type="text" ${bd(sc,id,path)} value="${getIn(doc,path)}" ${attr('list',o.list)} ${attr('placeholder',o.ph)} ${dis(o.ro)} data-nr></label>`;
}
function fNum(label,sc,id,path,doc,o){
  o=o||{};
  return h`<label class="fld ${o.cls||''}"><span class="fl">${label}</span><input type="number" inputmode="numeric" ${bd(sc,id,path)} value="${getIn(doc,path)}" ${attr('min',o.min)} ${attr('data-min',o.min)} ${attr('max',o.max)} ${attr('data-max',o.max)} ${dis(o.ro)}></label>`;
}
function fSel(label,sc,id,path,doc,opts,o){
  o=o||{};
  const cur=getIn(doc,path);
  const curS=cur==null?'':String(cur);
  return h`<label class="fld ${o.cls||''}"><span class="fl">${label}</span><select ${bd(sc,id,path)} ${dis(o.ro)}>${o.blank!==undefined?h`<option value="">${o.blank}</option>`:''}${opts.map(op=>{const v=Array.isArray(op)?op[0]:op;const l=Array.isArray(op)?op[1]:op;return h`<option value="${v}" ${v===curS?raw('selected'):''}>${l}</option>`;})}</select></label>`;
}
function fArea(label,sc,id,path,doc,o){
  o=o||{};
  return h`<label class="fld ${o.cls||''}"><span class="fl">${label}</span><textarea ${bd(sc,id,path)} rows="${o.rows||2}" ${attr('placeholder',o.ph)} ${dis(o.ro)} data-nr>${raw('\n')}${getIn(doc,path)}</textarea></label>`;
}
function fCheck(label,sc,id,path,doc,ro){
  return h`<label class="row"><input type="checkbox" ${bd(sc,id,path)} ${getIn(doc,path)?raw('checked'):''} ${dis(ro)}><span>${label}</span></label>`;
}

/* ---------- shared pieces ---------- */
const typeChips=m=>((m&&m.types)||[]).filter(Boolean).map(t=>h`<span class="ty ${String(t).toLowerCase()}">${t}</span>`);
const hpCls=hp=>{const mx=Math.max(1,num(hp&&hp.max));const r=num(hp&&hp.cur)/mx;return r>0.5?'':r>0.25?'warn':'bad';};
function hpBar(hp){
  const mx=Math.max(1,num(hp&&hp.max));
  return h`<progress class="hp ${hpCls(hp)}" max="${mx}" value="${clamp(num(hp&&hp.cur),0,mx)}"></progress>`;
}
function hpTile(sc,id,hp,ro){
  hp=hp||{cur:0,max:0};
  return h`<div class="hpbox lcd"><span class="sl">HP</span>
    <div class="nums"><input type="number" inputmode="numeric" aria-label="Current HP" ${bd(sc,id,'hp.cur')} value="${hp.cur}" ${attr('data-min',0)} ${dis(ro)}><span>/</span><input type="number" inputmode="numeric" aria-label="Maximum HP" ${bd(sc,id,'hp.max')} value="${hp.max}" ${attr('data-min',1)} ${dis(ro)}></div>
    ${hpBar(hp)}
    ${ro?'':h`<div class="hpbtns">${[-5,-1,1,5].map(d=>h`<button data-act="hp" data-sc="${sc}" data-id="${id}" data-d="${d}">${d>0?'+'+d:'−'+Math.abs(d)}</button>`)}</div>`}
  </div>`;
}
function rowBtns(sc,id,path,i,len,ro){
  if(ro)return '';
  return h`<span class="ibtns"><button class="btn sm ghost" data-act="mv" ${bp(sc,id,path)} data-i="${i}" data-d="-1" ${i===0?raw('disabled'):''} aria-label="Move up">↑</button><button class="btn sm ghost" data-act="mv" ${bp(sc,id,path)} data-i="${i}" data-d="1" ${i===len-1?raw('disabled'):''} aria-label="Move down">↓</button><button class="btn sm danger" data-act="del" ${bp(sc,id,path)} data-i="${i}" aria-label="Remove">×</button></span>`;
}
function delBtn(sc,id,label){
  const key=sc+'|'+id;
  const armed=S.ui.confirm===key;
  return h`<button class="btn sm danger ${armed?'armed':''}" data-act="delDoc" data-sc="${sc}" data-id="${id}">${armed?'Tap again to confirm':label}</button>`;
}
function emptyState(title,body,btn){
  return h`<div class="empty"><h3>${title}</h3><p>${body}</p>${btn||''}</div>`;
}
function trainerPicker(){
  const ids=tids();
  if(ids.length<2)return '';
  return h`<div class="seg" role="group" aria-label="Choose trainer">${ids.map(uid=>h`<button data-act="view" data-uid="${uid}" aria-pressed="${String(uid===S.viewUid)}">${tName(S.trainers[uid])}</button>`)}</div>`;
}
function createCta(){
  if(!S.me.id||!S.me.canWrite)return '';
  return h`<button class="btn primary" data-act="newTrainer">Create my trainer</button>`;
}
function emptyTrainer(){
  const mine=S.me.id&&S.trainers[S.me.id];
  if(!mine&&S.me.canWrite&&S.me.id&&!S.me.admin){
    return emptyState('No trainer sheet yet','Create yours to start tracking stats, skills, honors, and your Pokémon. Only you and the GM can edit it.',createCta());
  }
  return emptyState('No trainers yet','Players appear here once they create a sheet.',S.me.id&&S.me.canWrite?createCta():'');
}

/* templates for list rows */
const TPL={
  move:()=>({name:'',freq:'At-Will',kind:'Physical',range:'Melee',type:'Normal',dice:'',text:'',used:0}),
  passive:()=>({name:'',text:''}),
  feature:()=>({name:'',text:''}),
  item:()=>({name:'',qty:1,note:''}),
  honor:()=>({type:'Other',name:'',note:''})
};
const TPL_MAX={moves:6,passives:4};

/* ---------- images: downscale to small JPEG data URLs, show through blob URLs ---------- */
const JPEG_RE=/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;
const blobCache=new Map();
function imgSrc(d){
  if(typeof d!=='string'||d.length<40||d.length>2400000)return '';
  if(blobCache.has(d))return blobCache.get(d);
  let out='';
  if(JPEG_RE.test(d)){
    try{
      const bin=atob(d.slice(23));
      const u8=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
      out=URL.createObjectURL(new Blob([u8],{type:'image/jpeg'}));
    }catch(e){out='';}
  }
  blobCache.set(d,out);
  return out;
}
function fileToImage(file,o){
  return new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onerror=()=>rej(new Error('read'));
    fr.onload=()=>{
      const im=new Image();
      im.onerror=()=>rej(new Error('decode'));
      im.onload=()=>{
        let tw,th;
        if(o.w&&o.h){tw=o.w;th=o.h;}
        else{const sc=Math.min(1,o.max/Math.max(im.width,im.height));tw=Math.round(im.width*sc);th=Math.round(im.height*sc);}
        const draw=s=>{
          const c=document.createElement('canvas');
          c.width=Math.max(1,Math.round(tw*s));c.height=Math.max(1,Math.round(th*s));
          const x=c.getContext('2d');
          x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
          const k=Math.max(c.width/im.width,c.height/im.height);
          const dw=im.width*k,dh=im.height*k;
          x.drawImage(im,(c.width-dw)/2,(c.height-dh)/2,dw,dh);
          return c;
        };
        let s=1,q=o.q||0.82,out='',c=null;
        for(let i=0;i<10;i++){
          c=draw(s);out=c.toDataURL('image/jpeg',q);
          if(out.length<=o.cap)break;
          if(q>0.5)q-=0.1;else s*=0.85;
        }
        if(out.length<=o.cap)res({url:out,w:c.width,h:c.height});
        else rej(new Error('too big'));
      };
      im.src=fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function assembleMap(){
  const m=S.mapChunks.meta;
  S.mapSrc='';
  if(!m||!num(m.n))return;
  let out='';
  for(let i=0;i<num(m.n);i++){
    const c=S.mapChunks['c'+i];
    if(!c||typeof c.d!=='string'||c.v!==m.v)return;
    out+=c.d;
  }
  S.mapSrc=imgSrc(out);
}
function pimg(d,name,cls){
  const s=imgSrc(d);
  if(s)return h`<img class="pimg ${cls||''}" src="${s}" alt="${name||''}">`;
  return h`<div class="pimg ${cls||''} ini" aria-hidden="true">${(String(name||'?').trim().charAt(0)||'?').toUpperCase()}</div>`;
}
function imgPicker(sc,id,path,doc,w,h2,cap,ro){
  if(ro)return '';
  const has=!!getIn(doc,path);
  return h`<div class="row"><button class="btn sm" data-act="pick" data-img="${sc+'|'+id+'|'+path}" data-w="${w}" data-h="${h2}" data-cap="${cap}">${has?'Change picture':'Upload picture'}</button>${has?h`<button class="btn sm ghost" data-act="rmImg" ${bp(sc,id,path)}>Remove</button>`:''}</div>`;
}
function avatarEl(uid){
  const a=S.avatars[uid];
  const nme=nm(uid);
  if(a&&/^data:image\//.test(a))return h`<img class="av" src="${a}" alt="${nme}" title="${nme}">`;
  return h`<span class="av ini" title="${nme}">${(String(nme).charAt(0)||'?').toUpperCase()}</span>`;
}
function onlineHtml(){
  if(!S.room)return '';
  const seen=new Set(),list=[];
  S.peers.forEach(p=>{const k=p.by||p.peer;if(seen.has(k))return;seen.add(k);list.push(p);});
  if(!list.length)return '';
  return h`<span class="online"><span class="avs">${list.slice(0,6).map(p=>avatarEl(p.by))}</span><span class="mono">${list.length} online</span></span>`;
}

/* ---------- overview ---------- */
function trainerCard(uid){
  const t=S.trainers[uid];
  const mons=partyOf(uid);
  const bg=t.badges||{};
  return h`<article class="panel tcard">
    <button class="pbtn" data-act="view" data-uid="${uid}" data-tab="trainer" aria-label="Open sheet for ${tName(t)}">${pimg(t.img,tName(t),'tall')}</button>
    <div><h3>${tName(t)}</h3>
      <p class="sub">${[t.cls,t.adv].filter(Boolean).join(' · ')||'Class not chosen'} · Level ${num(t.level)||1}</p>
      <p class="sub">Played by ${nm(uid)}</p></div>
    <div class="hpline">${hpBar(t.hp)}<span class="mono">${num(t.hp&&t.hp.cur)}/${num(t.hp&&t.hp.max)}</span></div>
    <div class="row sp"><span class="dots" role="img" aria-label="${badgeCount(t)} of 8 badges">${BADGES.map(b=>h`<span class="dot ${bg[b[0]]?'on':''}" title="${b[1]} Badge"></span>`)}</span><span class="mono sub">${badgeCount(t)}/8</span></div>
    <ul class="team">${mons.length?mons.map(m=>h`<li><b>${mName(m)}</b>${typeChips(m)}</li>`):h`<li class="sub">No Pokémon on hand</li>`}</ul>
    <footer><button class="btn sm" data-act="view" data-uid="${uid}" data-tab="trainer">Sheet</button><button class="btn sm" data-act="view" data-uid="${uid}" data-tab="pokemon">Pokémon</button></footer>
  </article>`;
}
function feedItems(){
  const out=[];
  const add=(ts,kind,text)=>{if(ts)out.push({ts,kind,text});};
  Object.values(S.awards).forEach(a=>add(a.createdAt,'Honor',h`<b>${tName(S.trainers[a.uid])}</b> was awarded <b>${a.title}</b>${a.levelUp?' and gained a level':''}.`));
  Object.values(S.journal).forEach(e=>add(e.createdAt,'Journal',h`Session ${num(e.session)||'?'} logged: <b>${e.title||'Untitled entry'}</b>${e.addedBy?' by '+nm(e.addedBy):''}.`));
  Object.values(S.people).forEach(p=>add(p.createdAt,'Person',h`Met <b>${p.name||'someone'}</b>${p.place?' at '+p.place:''}.`));
  Object.values(S.leads).forEach(l=>add(l.createdAt,'Lead',h`New lead: <b>${l.title||'Untitled lead'}</b>.`));
  Object.values(S.timeline).forEach(e=>add(e.createdAt,'Timeline',h`<b>${e.title||'Untitled event'}</b> added to the timeline.`));
  Object.values(S.trainers).forEach(t=>add(t.createdAt,'Trainer',h`<b>${tName(t)}</b> joined the table.`));
  Object.entries(S.pokemon).forEach(([uid,mm])=>Object.values(mm).forEach(m=>add(m.createdAt,'Team',h`<b>${tName(S.trainers[uid])}</b> added <b>${mName(m)}</b>.`)));
  return out.sort((a,b)=>b.ts-a.ts).slice(0,14);
}
function heroHtml(){
  const src=imgSrc(S.banner&&S.banner.img);
  const m=S.meta;
  return h`<section class="hero ${src?'has-img':''}">
    ${src?h`<img class="hero-img" src="${src}" alt="">`:''}
    <div class="hero-in">
      <p class="eyebrow">${m.subtitle}</p>
      <h1>${m.campaign}</h1>
      <p class="hero-meta">${m.gm?h`<span>Game Master <b>${m.gm}</b></span>`:''}<span>Session <b class="mono">${num(m.session)||1}</b></span><span><b class="mono">${Object.keys(S.trainers).length}</b> ${Object.keys(S.trainers).length===1?'trainer':'trainers'}</span></p>
    </div>
    ${S.me.admin?h`<div class="hero-act">${imgPicker('bn','banner','img',S.banner,1400,420,170000,false)}</div>`:''}
  </section>`;
}
function overviewTab(){
  const ids=tids();
  const mine=S.me.id&&S.trainers[S.me.id];
  const story=entriesOf(S.journal).sort((a,b)=>num(b.session)-num(a.session)||num(b.createdAt)-num(a.createdAt)).slice(0,3);
  const leads=entriesOf(S.leads).filter(l=>!l.status||l.status==='open'||l.status==='chasing').slice(0,5);
  const feed=feedItems();
  return h`${heroHtml()}
    ${S.meta.pinned?h`<section class="pinned"><p class="eyebrow">From the GM</p><p class="prewrap">${S.meta.pinned}</p></section>`:''}
    ${!mine&&!S.me.admin&&S.me.id&&S.me.canWrite?h`<div class="banner">You have no trainer sheet yet. ${createCta()}</div>`:''}
    <div class="ov">
      <div class="ov-main">
        <section class="list"><div class="ph"><h2>Trainers</h2><span class="sub">${ids.length} at the table</span></div>
          ${ids.length?h`<div class="grid cards tc">${ids.map(trainerCard)}</div>`:emptyTrainer()}</section>
        <section class="list"><div class="ph"><h2>Story so far</h2><button class="btn sm" data-act="tab" data-tab="journal">Open journal</button></div>
          ${story.length?story.map(e=>h`<article class="entry"><h3>${e.title||'Untitled entry'}</h3><div class="meta"><span>Session ${num(e.session)||'?'}</span>${e.place?h`<span>${e.place}</span>`:''}</div>${e.body?h`<p class="prewrap">${String(e.body).slice(0,320)}${String(e.body).length>320?'…':''}</p>`:''}</article>`):h`<p class="sub">Nothing written yet. Session notes go in the Journal.</p>`}</section>
      </div>
      <aside class="ov-side">
        <section class="panel"><div class="ph"><h2>Activity</h2></div>
          ${feed.length?h`<ul class="feed">${feed.map(i=>h`<li><span class="k">${i.kind}</span><p>${i.text}</p><span class="when">${ago(i.ts)}</span></li>`)}</ul>`:h`<p class="sub">Activity from the table shows up here.</p>`}</section>
        <section class="panel"><div class="ph"><h2>Open leads</h2><button class="btn sm" data-act="tab" data-tab="leads">Open</button></div>
          ${leads.length?h`<ul class="mini-list">${leads.map(l=>h`<li><b>${l.title||'Untitled lead'}</b><span class="sub">${l.place||'Location unknown'}</span></li>`)}</ul>`:h`<p class="sub">No open leads.</p>`}</section>
      </aside>
    </div>`;
}
/* ---------- trainer tab ---------- */
function identityPanel(uid,t,ro){
  return h`<section class="panel"><div class="ph"><h2>Trainer</h2><span class="sub">Played by ${nm(uid)}</span></div>
    <div class="idrow"><div class="idimg">${pimg(t.img,tName(t),'tall')}${imgPicker('t',uid,'img',t,320,400,60000,ro)}</div>
    <div class="fgrid">
      ${fText('Name','t',uid,'name',t,{ro,cls:'wide'})}
      ${fSel('Class','t',uid,'cls',t,Object.keys(CLASSES),{ro,blank:'Not chosen'})}
      ${fSel('Advanced class','t',uid,'adv',t,CLASSES[t.cls]||[],{ro,blank:'None yet'})}
      ${fNum('Level','t',uid,'level',t,{ro,min:1,max:20})}
      ${fNum('Age','t',uid,'age',t,{ro,min:10,max:99})}
      ${fText('Hometown','t',uid,'hometown',t,{ro,list:'dl-places'})}
      ${fText('Origin','t',uid,'origin',t,{ro})}
      ${fNum('Credits','t',uid,'credits',t,{ro,min:0})}
      ${fArea('Looks, personality, goals','t',uid,'bio',t,{ro,rows:3,cls:'wide'})}
    </div></div></section>`;
}
function vitalsPanel(uid,t,ro){
  const tiles=STATS.map(([k,full,ab])=>{
    const raw0=t.stats&&t.stats[k];
    const m=mod(raw0);
    return h`<div class="stat lcd"><span class="sl">${ab}</span>
      <input type="number" inputmode="numeric" aria-label="${full}" ${bd('t',uid,'stats.'+k)} value="${raw0}" data-min="1" data-max="10" ${dis(ro)}>
      <span class="sm"><span>mod ${sgn(m)}</span>${ro?'':h`<button class="rollbtn" data-act="roll" data-label="${full} check" data-bonus="${m}" data-tal="0">d20</button>`}</span></div>`;
  });
  return h`<section class="panel"><div class="ph"><h2>Stats</h2><span class="sub">Modifier is half the stat, rounded down. Stats cap at 10.</span></div>
    <div class="stats">${hpTile('t',uid,t.hp,ro)}${tiles}</div></section>`;
}
function skillsPanel(uid,t,ro){
  const tal=t.talents||{};
  const groups=STAT_KEYS.map(k=>{
    const sk=SKILLS.filter(s=>s[2]===k);
    const m=mod(t.stats&&t.stats[k]);
    return h`<div class="sgroup"><h3><span>${STAT_NAME[k]} skills</span><span class="mono">${sgn(m)}</span></h3>
      ${sk.map(([key,name])=>{
        const lv=clamp(num(tal[key]),0,2);
        const tb=[0,2,5][lv];
        return h`<div class="skill"><span class="sname">${name}</span>
          <button class="tal t${lv}" data-act="talent" data-key="${key}" data-uid="${uid}" ${dis(ro)} title="Talent: none, +2, or +5 when taken twice">${['—','+2','+5'][lv]}</button>
          <span class="bonus">${sgn(m+tb)}</span>
          <button class="btn sm" data-act="roll" data-label="${name}" data-bonus="${m}" data-tal="${tb}" ${dis(ro)}>Roll</button></div>`;
      })}</div>`;
  });
  return h`<section class="panel"><div class="ph"><h2>Skills</h2>
    <div class="seg" role="group" aria-label="Roll mode">${[['normal','Normal'],['adv','Advantage'],['dis','Disadvantage']].map(([v,l])=>h`<button data-act="adv" data-v="${v}" aria-pressed="${String(S.ui.adv===v)}">${l}</button>`)}</div></div>
    ${groups}</section>`;
}
function honorsPanel(uid,t,ro){
  const bg=t.badges||{};
  const hs=t.honors||[];
  const aw=entriesOf(S.awards).filter(a=>a.uid===uid).sort((a,b)=>num(b.createdAt)-num(a.createdAt));
  return h`<section class="panel"><div class="ph"><h2>Honors</h2><span class="mono sub">${badgeCount(t)}/8 Sinnoh badges</span></div>
    ${aw.length?h`<div class="list"><span class="fl">Awarded by the GM</span>${aw.map(a=>h`<div class="award"><div class="row sp"><b>${a.title}</b><span class="pill gm">${a.type}</span></div>${a.note?h`<p class="sub prewrap">${a.note}</p>`:''}<span class="sub">${dt(a.createdAt)}${a.session?' · Session '+a.session:''}${a.levelUp?' · +1 level':''}</span></div>`)}</div>`:''}
    <div class="badges">${BADGES.map(([k,nameB,leader])=>h`<button class="badge ${bg[k]?'on':''}" data-act="badge" data-key="${k}" data-uid="${uid}" aria-pressed="${String(!!bg[k])}" ${dis(ro)}><span class="gem"></span>${nameB}<small>${leader}</small></button>`)}</div>
    <div class="fgrid">${fNum('Pokédex owned','t',uid,'dex',t,{ro,min:0,max:999})}<p class="sub">Next certificate at ${(Math.floor(num(t.dex)/30)+1)*30} owned.</p></div>
    <div class="list">${hs.map((x,i)=>h`<div class="item"><div class="irow two">${fSel('Type','t',uid,'honors.'+i+'.type',t,HONOR_TYPES,{ro})}${rowBtns('t',uid,'honors',i,hs.length,ro)}</div>${fText('Title','t',uid,'honors.'+i+'.name',t,{ro})}${fText('Note','t',uid,'honors.'+i+'.note',t,{ro})}</div>`)}</div>
    ${ro?'':h`<div><button class="btn sm" data-act="add" ${bp('t',uid,'honors')} data-tpl="honor">Add honor</button></div>`}
  </section>`;
}
function featuresPanel(uid,t,ro){
  const fs=t.features||[];
  return h`<section class="panel"><div class="ph"><h2>Features</h2>${ro?'':h`<button class="btn sm" data-act="add" ${bp('t',uid,'features')} data-tpl="feature">Add feature</button>`}</div>
    ${fs.length?h`<div class="list">${fs.map((x,i)=>h`<div class="item"><div class="irow two">${fText('Name','t',uid,'features.'+i+'.name',t,{ro})}${rowBtns('t',uid,'features',i,fs.length,ro)}</div>${fArea('What it does','t',uid,'features.'+i+'.text',t,{ro})}</div>`)}</div>`:h`<p class="sub">Class and origin features go here, in your own words.</p>`}
  </section>`;
}
function itemsPanel(uid,t,ro){
  const it=t.items||[];
  return h`<section class="panel"><div class="ph"><h2>Inventory</h2>${ro?'':h`<button class="btn sm" data-act="add" ${bp('t',uid,'items')} data-tpl="item">Add item</button>`}</div>
    ${it.length?h`<div class="list">${it.map((x,i)=>h`<div class="item"><div class="irow">${fText('Item','t',uid,'items.'+i+'.name',t,{ro})}${fNum('Qty','t',uid,'items.'+i+'.qty',t,{ro,min:0})}${rowBtns('t',uid,'items',i,it.length,ro)}</div>${fText('Note','t',uid,'items.'+i+'.note',t,{ro})}</div>`)}</div>`:h`<p class="sub">Nothing carried yet.</p>`}
  </section>`;
}
function trainerTab(){
  const uid=S.viewUid;
  const t=S.trainers[uid];
  if(!t)return h`${trainerPicker()}${emptyTrainer()}`;
  const ro=!canEditT(uid);
  return h`${trainerPicker()}
    ${!S.trainers[S.me.id]&&!S.me.admin&&S.me.id&&S.me.canWrite?h`<div class="banner">You have no trainer sheet yet. ${createCta()}</div>`:''}
    ${ro?h`<div class="banner">Viewing ${tName(t)}. Only ${nm(uid)} and the GM can change this sheet.</div>`:''}
    <div class="sheet">
      <div class="col">${identityPanel(uid,t,ro)}${vitalsPanel(uid,t,ro)}${honorsPanel(uid,t,ro)}</div>
      <div class="col">${skillsPanel(uid,t,ro)}${featuresPanel(uid,t,ro)}${itemsPanel(uid,t,ro)}</div>
    </div>`;
}

/* ---------- pokemon tab ---------- */
const effStat=(m,k)=>num(m.base&&m.base[k])+num(m.bonus&&m.bonus[k])+(m.up===k?1:0)-(m.down===k?1:0);
const STAT_OPTS=STATS.map(s=>[s[0],s[1]]);

function moveRow(id,m,x,i,ro){
  const mm=/^(\d+)\s*\/\s*day/i.exec(x.freq||'');
  const n=mm?clamp(+mm[1],1,9):0;
  const used=num(x.used);
  const p='moves.'+i+'.';
  return h`<div class="move">
    <div class="mv1">
      ${fText('Move','p',id,p+'name',m,{ro})}
      ${fText('Uses','p',id,p+'freq',m,{ro,list:'dl-freq'})}
      ${n?h`<span class="pips" role="group" aria-label="Daily uses">${Array.from({length:n},(_,j)=>h`<button class="pip ${j<used?'spent':''}" data-act="pip" ${bp('p',id,'moves.'+i+'.used')} data-j="${j}" aria-label="Use ${j+1}" ${dis(ro)}></button>`)}</span>`:h`<span></span>`}
      ${rowBtns('p',id,'moves',i,(m.moves||[]).length,ro)}
    </div>
    <div class="mv2">
      ${fSel('Kind','p',id,p+'kind',m,KINDS,{ro})}
      ${fSel('Type','p',id,p+'type',m,TYPES,{ro})}
      ${fText('Range','p',id,p+'range',m,{ro})}
      ${fText('Damage','p',id,p+'dice',m,{ro,ph:'e.g. 3d8'})}
    </div>
    ${fArea('Effect','p',id,p+'text',m,{ro,rows:2})}
  </div>`;
}

function monBody(uid,m,ro,pos,len){
  const id=uid+'/'+m.id;
  const tiles=STATS.map(([k,full,ab])=>{
    const f=effStat(m,k);
    return h`<div class="stat lcd"><span class="sl">${ab}</span><span class="sv">${f}</span>
      <span class="sm"><span>mod ${sgn(mod(f))}</span>${k==='spe'?h`<span>${f*5} ft</span>`:''}</span>
      <div class="mini"><label>Base<input type="number" ${bd('p',id,'base.'+k)} value="${m.base&&m.base[k]}" ${dis(ro)}></label><label>Adj<input type="number" ${bd('p',id,'bonus.'+k)} value="${m.bonus&&m.bonus[k]}" ${dis(ro)}></label></div></div>`;
  });
  const ps=m.passives||[];
  const mv=m.moves||[];
  const gl=S.gmLoy[m.id]||{};
  const L=clamp(num(gl.loyalty),0,5);
  return h`<div class="mb">
    <div class="idrow"><div class="idimg sq">${pimg(m.img,mName(m),'sq')}${imgPicker('p',id,'img',m,320,320,50000,ro)}</div>
    <div class="fgrid">
      ${fText('Nickname','p',id,'nick',m,{ro})}
      ${fText('Species','p',id,'species',m,{ro})}
      ${fSel('Type 1','p',id,'types.0',m,TYPES,{ro,blank:'None'})}
      ${fSel('Type 2','p',id,'types.1',m,TYPES,{ro,blank:'None'})}
      ${fSel('Size','p',id,'size',m,SIZES,{ro})}
      ${fSel('Weight','p',id,'weight',m,WEIGHTS,{ro})}
      ${fSel('Monster die','p',id,'die',m,DICE,{ro})}
      ${fText('Held item','p',id,'item',m,{ro})}
      ${fText('Nature','p',id,'natureName',m,{ro})}
      ${fSel('Nature raises','p',id,'up',m,STAT_OPTS,{ro,blank:'None'})}
      ${fSel('Nature lowers','p',id,'down',m,STAT_OPTS,{ro,blank:'None'})}
      ${fText('Status','p',id,'status',m,{ro,list:'dl-status'})}
      ${fText('Where or how you got it','p',id,'caught',m,{ro,list:'dl-places',cls:'wide'})}
    </div></div>
    <div class="stats">${hpTile('p',id,m.hp,ro)}${tiles}</div>
    <div class="lcd acc"><span>Attack ${sgn(mod(effStat(m,'atk')))}</span><span>Sp. Attack ${sgn(mod(effStat(m,'spa')))}</span><span>Effect ${sgn(mod(effStat(m,'spe')))}</span></div>
    ${fText('Skills','p',id,'skills',m,{ro,ph:'Short list, separated by commas'})}
    <div class="list"><div class="ph"><h2>Passives</h2>${ro||ps.length>=TPL_MAX.passives?'':h`<button class="btn sm" data-act="add" ${bp('p',id,'passives')} data-tpl="passive">Add passive</button>`}<span class="sub">${ps.length} of ${TPL_MAX.passives}</span></div>
      ${ps.map((x,i)=>h`<div class="item"><div class="irow two">${fText('Passive','p',id,'passives.'+i+'.name',m,{ro})}${rowBtns('p',id,'passives',i,ps.length,ro)}</div>${fArea('Effect','p',id,'passives.'+i+'.text',m,{ro})}</div>`)}</div>
    <div class="list"><div class="ph"><h2>Moves</h2>${ro||mv.length>=TPL_MAX.moves?'':h`<button class="btn sm" data-act="add" ${bp('p',id,'moves')} data-tpl="move">Add move</button>`}<span class="sub">${mv.length} of ${TPL_MAX.moves}</span></div>
      ${mv.map((x,i)=>moveRow(id,m,x,i,ro))}</div>
    ${fArea('Notes','p',id,'notes',m,{ro,rows:3})}
    ${S.me.admin?h`<div class="secret"><span class="fl">GM only · Loyalty</span>
      <div class="row"><div class="seg" role="group" aria-label="Loyalty">${[0,1,2,3,4,5].map(n=>h`<button data-act="loy" data-pid="${m.id}" data-uid="${uid}" data-n="${n}" aria-pressed="${String(L===n)}">${n}</button>`)}</div><span class="sub">${LOY_WORDS[L]}</span></div>
      ${fArea('Private notes on this Pokémon','gl',m.id,'note',gl,{rows:2})}</div>`:''}
    ${ro?'':h`<div class="row sp">
      <div class="row"><button class="btn sm" data-act="slot" data-uid="${uid}" data-pid="${m.id}">${m.slot==='box'?'Move to party':'Move to box'}</button>
        <button class="btn sm ghost" data-act="ord" data-uid="${uid}" data-pid="${m.id}" data-d="-1" ${pos===0?raw('disabled'):''} aria-label="Move earlier">↑</button>
        <button class="btn sm ghost" data-act="ord" data-uid="${uid}" data-pid="${m.id}" data-d="1" ${pos===len-1?raw('disabled'):''} aria-label="Move later">↓</button></div>
      ${delBtn('p',id,'Release')}</div>`}
  </div>`;
}

function monCard(uid,m,ro,pos,len){
  const key='p'+uid+'/'+m.id;
  const open=!!S.ui.open[key];
  const loy=S.me.admin?clamp(num((S.gmLoy[m.id]||{}).loyalty),0,5):null;
  return h`<article class="mon ${open?'open':''}">
    <div class="mh">
      <div class="mt">${pimg(m.img,mName(m),'thumb')}<div class="mtx"><h3>${mName(m)}</h3>
        <p class="sub">${m.nick&&m.species?m.species:''}${m.item?(m.nick&&m.species?' · ':'')+'holding '+m.item:''}</p>
        <div class="types">${typeChips(m)}${m.status?h`<span class="pill status">${m.status}</span>`:''}${loy!==null?h`<span class="pill gm">Loyalty ${loy}</span>`:''}</div></div>
        <button class="btn sm" data-act="toggle" data-key="${key}" aria-expanded="${String(open)}">${open?'Close':'Open'}</button></div>
      <div class="hpline">${hpBar(m.hp)}<span class="mono">${num(m.hp&&m.hp.cur)}/${num(m.hp&&m.hp.max)}</span></div>
      ${open?'':h`<p class="movesum">${(m.moves||[]).map(x=>x.name).filter(Boolean).join(' · ')||'No moves listed yet'}</p>`}
    </div>
    ${open?monBody(uid,m,ro,pos,len):''}
  </article>`;
}

function pokemonTab(){
  const uid=S.viewUid;
  const t=S.trainers[uid];
  if(!t)return h`${trainerPicker()}${emptyTrainer()}`;
  const ro=!canEditT(uid);
  const pt=partyOf(uid),bx=boxOf(uid);
  return h`${trainerPicker()}
    <section class="panel"><div class="ph"><h2>${tName(t)}’s Pokémon</h2>
      <div class="acts">${ro?'':h`<button class="btn primary sm" data-act="newMon">Add Pokémon</button><button class="btn sm" data-act="heal">Pokémon Center</button><button class="btn sm" data-act="rest">Rest 8h</button>`}</div></div>
      <p class="sub">Carrying ${pt.length} of 6. Pokémon Center restores HP and clears status. Rest 8h refills daily move uses.</p></section>
    ${pt.length||bx.length?'':emptyState('No Pokémon yet',ro?'Nothing here yet.':'Add your starter to begin.')}
    ${pt.length?h`<div class="list"><div class="ph"><h2>Party</h2></div><div class="mons">${pt.map((m,i)=>monCard(uid,m,ro,i,pt.length))}</div></div>`:''}
    ${bx.length?h`<div class="list"><div class="ph"><h2>Box</h2><span class="sub">${bx.length} stored</span></div><div class="mons">${bx.map((m,i)=>monCard(uid,m,ro,i,bx.length))}</div></div>`:''}`;
}

/* ---------- people tab ---------- */
const entriesOf=(coll)=>Object.entries(coll).map(([id,e])=>Object.assign({id},e));
const attLabel=a=>(ATTITUDES.find(x=>x[0]===a)||ATTITUDES[0])[1];
function personCard(p){
  const open=!!S.ui.open['ppl'+p.id];
  const gn=S.gmNpc[p.id]||{};
  const canE=canShared();
  if(open&&canE){
    return h`<article class="entry">
      <div class="idrow"><div class="idimg">${pimg(p.img,p.name,'tall')}${imgPicker('ppl',p.id,'img',p,320,400,60000,false)}</div>
      <div class="fgrid">
        ${fText('Name','ppl',p.id,'name',p,{cls:'wide'})}
        ${fText('Role or title','ppl',p.id,'role',p)}
        ${fText('Where you met','ppl',p.id,'place',p,{list:'dl-places'})}
        ${fNum('Session met','ppl',p.id,'met',p,{min:0})}
        ${fSel('Attitude','ppl',p.id,'att',p,ATTITUDES)}
        ${fArea('What you know','ppl',p.id,'notes',p,{rows:3,cls:'wide'})}
      </div></div>
      ${fCheck('Pin to top','ppl',p.id,'pinned',p,false)}
      ${S.me.admin?h`<div class="secret"><span class="fl">GM only · Secret</span>${fArea('Hidden from players','gn',p.id,'secret',gn,{rows:3})}</div>`:''}
      <div class="row sp"><button class="btn sm" data-act="toggle" data-key="ppl${p.id}">Done</button>${canOwn(p)?delBtn('ppl',p.id,'Delete'):''}</div>
    </article>`;
  }
  return h`<article class="entry pcard">
    ${pimg(p.img,p.name,'tall')}
    <div class="pc-body">
    <div class="row sp"><h3>${p.pinned?'★ ':''}${p.name||'Unnamed person'}</h3><span class="pill ${p.att||'unknown'}">${attLabel(p.att)}</span></div>
    <div class="meta">${p.role?h`<span>${p.role}</span>`:''}${p.place?h`<span>Met at ${p.place}</span>`:''}${p.met?h`<span>Session ${p.met}</span>`:''}</div>
    ${p.notes?h`<p class="prewrap">${p.notes}</p>`:h`<p class="sub">Nothing written down yet.</p>`}
    ${S.me.admin&&gn.secret?h`<div class="secret"><span class="fl">GM only · Secret</span><p class="prewrap">${gn.secret}</p></div>`:''}
    ${canE?h`<div><button class="btn sm" data-act="toggle" data-key="ppl${p.id}">Edit</button></div>`:''}
    </div>
  </article>`;
}
function peopleTab(){
  const q=String(S.ui.q.people||'').toLowerCase();
  const af=S.ui.f.att||'';
  const list=entriesOf(S.people)
    .filter(p=>(!af||p.att===af)&&(!q||[p.name,p.role,p.place,p.notes].some(x=>String(x||'').toLowerCase().includes(q))))
    .sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||String(a.name||'').localeCompare(String(b.name||'')));
  const total=Object.keys(S.people).length;
  return h`<section class="panel"><div class="ph"><h2>People you have met</h2>${canShared()?h`<button class="btn primary sm" data-act="newDoc" data-kind="ppl">Add person</button>`:''}</div>
    <p class="sub">Shared by the whole party. Anyone can add or edit; only the author or the GM can delete.</p>
    <div class="tools"><label class="fld"><span class="fl">Search</span><input type="search" data-u="q.people" value="${S.ui.q.people||''}" placeholder="Name, place, notes"></label>
      <label class="fld"><span class="fl">Attitude</span><select data-u="f.att"><option value="">Everyone</option>${ATTITUDES.map(([v,l])=>h`<option value="${v}" ${af===v?raw('selected'):''}>${l}</option>`)}</select></label></div></section>
    ${list.length?h`<div class="grid cards">${list.map(personCard)}</div>`:emptyState(total?'No matches':'No one met yet',total?'Try a different search or filter.':'Add the people your trainers meet: gym leaders, rivals, shopkeepers, strangers who seemed off.')}`;
}

/* ---------- journal tab ---------- */
function entryCard(sc,e,shared){
  const key=sc+e.id;
  const open=!!S.ui.open[key];
  const canE=shared?canOwn(e):S.me.canWrite;
  if(open&&canE){
    return h`<article class="entry">
      <div class="fgrid">
        ${shared?fNum('Session','j',e.id,'session',e,{min:0}):''}
        ${fText('Title',sc,e.id,'title',e,{cls:'wide'})}
        ${shared?fText('Place','j',e.id,'place',e,{list:'dl-places'}):''}
        ${fArea(shared?'What happened':'Note',sc,e.id,'body',e,{rows:6,cls:'wide'})}
      </div>
      <div class="row sp"><div class="row"><button class="btn sm" data-act="toggle" data-key="${key}">Done</button>${shared?'':h`<button class="btn sm" data-act="shareNote" data-id="${e.id}">Share to party log</button>`}</div>${delBtn(sc,e.id,'Delete')}</div>
    </article>`;
  }
  return h`<article class="entry">
    <h3>${e.title||'Untitled entry'}</h3>
    <div class="meta">${shared?h`<span>Session ${num(e.session)||'?'}</span>`:''}${e.place?h`<span>${e.place}</span>`:''}${shared&&e.addedBy?h`<span>by ${nm(e.addedBy)}</span>`:''}<span>${dt(e.createdAt)}</span></div>
    ${e.body?h`<p class="prewrap">${e.body}</p>`:h`<p class="sub">Empty so far.</p>`}
    ${canE?h`<div><button class="btn sm" data-act="toggle" data-key="${key}">Edit</button></div>`:''}
  </article>`;
}
function journalTab(){
  const sub=S.ui.sub==='mine'?'mine':'party';
  const q=String(S.ui.q.journal||'').toLowerCase();
  const src=sub==='mine'?S.notes:S.journal;
  const list=entriesOf(src).filter(e=>!q||[e.title,e.body,e.place].some(x=>String(x||'').toLowerCase().includes(q)))
    .sort((a,b)=>sub==='mine'?num(b.createdAt)-num(a.createdAt):num(b.session)-num(a.session)||num(b.createdAt)-num(a.createdAt));
  return h`<section class="panel"><div class="ph"><div class="seg" role="group" aria-label="Journal"><button data-act="sub" data-v="party" aria-pressed="${String(sub==='party')}">Party log</button><button data-act="sub" data-v="mine" aria-pressed="${String(sub==='mine')}">My private notes</button></div>
      ${(sub==='mine'?S.me.id&&S.me.canWrite:canShared())?h`<button class="btn primary sm" data-act="newDoc" data-kind="${sub==='mine'?'n':'j'}">${sub==='mine'?'New note':'New entry'}</button>`:''}</div>
    <p class="sub">${sub==='mine'?'Only you can read these, not even the GM. Use Share to party log to publish one.':'Shared session log. Everyone at the table can read it.'}</p>
    <label class="fld"><span class="fl">Search</span><input type="search" data-u="q.journal" value="${S.ui.q.journal||''}" placeholder="Title, text, place"></label></section>
    ${list.length?h`<div class="list">${list.map(e=>entryCard(sub==='mine'?'n':'j',e,sub!=='mine'))}</div>`:emptyState(sub==='mine'?'No private notes':'No entries yet',sub==='mine'?'Theories, secrets, and reminders for yourself.':'Write up what happened after each session so the table stays in sync.')}`;
}

/* ---------- leads tab ---------- */
function leadCard(l){
  const open=!!S.ui.open['l'+l.id];
  const st=l.status||'open';
  if(open&&canShared()){
    return h`<article class="entry"><div class="fgrid">
      ${fText('Lead','l',l.id,'title',l,{cls:'wide'})}
      ${fSel('Status','l',l.id,'status',l,LEAD_STATES)}
      ${fText('Where','l',l.id,'place',l,{list:'dl-places'})}
      ${fArea('Details','l',l.id,'detail',l,{rows:3,cls:'wide'})}</div>
      <div class="row sp"><button class="btn sm" data-act="toggle" data-key="l${l.id}">Done</button>${canOwn(l)?delBtn('l',l.id,'Delete'):''}</div></article>`;
  }
  return h`<article class="entry"><div class="row sp"><h3>${l.title||'Untitled lead'}</h3><span class="pill ${st}">${(LEAD_STATES.find(x=>x[0]===st)||LEAD_STATES[0])[1]}</span></div>
    ${l.place?h`<div class="meta"><span>${l.place}</span></div>`:''}
    ${l.detail?h`<p class="prewrap">${l.detail}</p>`:''}
    ${canShared()?h`<div><button class="btn sm" data-act="toggle" data-key="l${l.id}">Edit</button></div>`:''}</article>`;
}
function leadsTab(){
  const list=entriesOf(S.leads);
  const order=['open','chasing','resolved','dead'];
  const groups=order.map(s=>[s,list.filter(l=>(l.status||'open')===s).sort((a,b)=>num(b.createdAt)-num(a.createdAt))]).filter(g=>g[1].length);
  return h`<section class="panel"><div class="ph"><h2>Leads</h2>${canShared()?h`<button class="btn primary sm" data-act="newDoc" data-kind="l">Add lead</button>`:''}</div>
    <p class="sub">Open questions and threads the party wants to follow. Shared by everyone.</p></section>
    ${groups.length?groups.map(([s,items])=>h`<div class="list"><div class="ph"><h2>${(LEAD_STATES.find(x=>x[0]===s)||LEAD_STATES[0])[1]}</h2><span class="sub">${items.length}</span></div><div class="grid cards">${items.map(leadCard)}</div></div>`):emptyState('No leads yet','Add anything strange you want to look into next.')}`;
}

/* ---------- timeline tab ---------- */
function tlItem(e){
  const key='tl'+e.id;
  const open=!!S.ui.open[key];
  const canE=canOwn(e);
  if(open&&canE){
    return h`<article class="entry tl-item">
      <div class="fgrid">
        ${fNum('Session','tl',e.id,'session',e,{min:0})}
        ${fText('In-world date','tl',e.id,'when',e,{ph:'e.g. Late autumn'})}
        ${fText('Title','tl',e.id,'title',e,{cls:'wide'})}
        ${fText('Place','tl',e.id,'place',e,{list:'dl-places',cls:'wide'})}
        ${fArea('What happened','tl',e.id,'body',e,{rows:4,cls:'wide'})}
      </div>
      <div class="row sp"><button class="btn sm" data-act="toggle" data-key="${key}">Done</button>${delBtn('tl',e.id,'Delete')}</div>
    </article>`;
  }
  return h`<article class="entry tl-item">
    <h3>${e.title||'Untitled event'}</h3>
    <div class="meta">${e.when?h`<span>${e.when}</span>`:''}${e.place?h`<span>${e.place}</span>`:''}${e.addedBy?h`<span>by ${nm(e.addedBy)}</span>`:''}</div>
    ${e.body?h`<p class="prewrap">${e.body}</p>`:''}
    ${canE?h`<div><button class="btn sm" data-act="toggle" data-key="${key}">Edit</button></div>`:''}
  </article>`;
}
function timelineTab(){
  const list=entriesOf(S.timeline).sort((a,b)=>num(a.session)-num(b.session)||num(a.createdAt)-num(b.createdAt));
  const groups=[];
  list.forEach(e=>{
    const s=num(e.session);
    const g=groups[groups.length-1];
    if(g&&g.s===s)g.items.push(e);else groups.push({s,items:[e]});
  });
  return h`<section class="panel"><div class="ph"><h2>Timeline</h2>${canShared()?h`<button class="btn primary sm" data-act="newDoc" data-kind="tl">Add event</button>`:''}</div>
    <p class="sub">The big beats of the story in the order they happened, grouped by session. Anyone can add; the author or the GM can edit and delete.</p></section>
    ${groups.length?groups.map(g=>h`<section class="list"><div class="ph"><h2>${g.s?'Session '+g.s:'Before the campaign'}</h2><span class="sub">${g.items.length} ${g.items.length===1?'event':'events'}</span></div><div class="tl">${g.items.map(tlItem)}</div></section>`)
      :emptyState('Nothing on the timeline yet','Add the moments that changed things: a gym won, a rival met, a place that was not what it seemed.')}`;
}

/* ---------- map tab ---------- */
const pinList=()=>entriesOf(S.pins).sort((a,b)=>num(a.createdAt)-num(b.createdAt)).map((p,i)=>Object.assign(p,{n:i+1}));
const pinKind=k=>(PIN_KINDS.find(x=>x[0]===k)||PIN_KINDS[0])[1];
function pinRow(p){
  const on=S.ui.selPin===p.id;
  const canE=canOwn(p);
  return h`<li class="${on?'on':''}">
    <button class="prow" data-act="selPin" data-id="${p.id}" aria-expanded="${String(on)}"><span class="pn ${p.kind||'place'}">${p.n}</span><span class="pl">${p.label||'Unnamed pin'}</span><span class="sub">${pinKind(p.kind)}</span></button>
    ${on?(canE?h`<div class="pdet">
        <div class="fgrid">
          ${fText('Label','pin',p.id,'label',p,{cls:'wide'})}
          ${fSel('Kind','pin',p.id,'kind',p,PIN_KINDS,{cls:'wide'})}
          ${fArea('Note','pin',p.id,'note',p,{rows:3,cls:'wide'})}
        </div>
        <div class="row"><span class="fl">Nudge</span>
          <button class="btn sm" data-act="nudge" data-id="${p.id}" data-dx="-0.02" data-dy="0" aria-label="Nudge left">←</button>
          <button class="btn sm" data-act="nudge" data-id="${p.id}" data-dx="0" data-dy="-0.02" aria-label="Nudge up">↑</button>
          <button class="btn sm" data-act="nudge" data-id="${p.id}" data-dx="0" data-dy="0.02" aria-label="Nudge down">↓</button>
          <button class="btn sm" data-act="nudge" data-id="${p.id}" data-dx="0.02" data-dy="0" aria-label="Nudge right">→</button>
          <button class="btn sm" data-act="movePin" data-id="${p.id}">Move on map</button></div>
        <div class="row sp"><span class="sub">${p.addedBy?'Placed by '+nm(p.addedBy):''}</span>${delBtn('pin',p.id,'Delete pin')}</div>
      </div>`
      :h`<div class="pdet">${p.note?h`<p class="prewrap">${p.note}</p>`:h`<p class="sub">No note.</p>`}<span class="sub">${p.addedBy?'Placed by '+nm(p.addedBy):''}</span></div>`):''}
  </li>`;
}
function mapPicker(){
  return h`<div class="row"><button class="btn sm" data-act="pick" data-img="map|map|img" data-w="0" data-h="0" data-cap="900000">${S.mapSrc?'Replace map':'Upload map'}</button>${S.mapSrc?h`<button class="btn sm ghost" data-act="rmMap">Remove map</button>`:''}</div>`;
}
/* ---------- GM desk ---------- */
function awardForm(){
  const a=S.ui.award;
  const ids=tids();
  const picked=ids.filter(u=>a.uids[u]).length;
  return h`<section class="panel"><div class="ph"><h2>Award honors</h2><span class="pill gm">GM only</span></div>
    <p class="sub">This system has no experience points. Honors are how trainers grow: badges, medals, ribbons, and moments worth remembering. Tick the box below to raise the level as part of the award.</p>
    ${ids.length?h`<div class="fl">Who earned it</div>
      <div class="row">${ids.map(u=>h`<button class="btn sm chk" data-act="awToggle" data-uid="${u}" aria-pressed="${String(!!a.uids[u])}">${tName(S.trainers[u])}</button>`)}
        <button class="btn sm ghost" data-act="awAll">${picked===ids.length?'Clear':'Everyone'}</button></div>
      <div class="fgrid">
        <label class="fld"><span class="fl">Kind of honor</span><select data-u="award.type">${AWARD_TYPES.map(t=>h`<option value="${t}" ${a.type===t?raw('selected'):''}>${t}</option>`)}</select></label>
        ${a.type==='Gym Badge'?h`<label class="fld"><span class="fl">Which badge</span><select data-u="award.badge">${BADGES.map(b=>h`<option value="${b[0]}" ${a.badge===b[0]?raw('selected'):''}>${b[1]} (${b[2]})</option>`)}</select></label>`:''}
        <label class="fld wide"><span class="fl">Title (optional)</span><input type="text" data-u="award.title" value="${a.title}" placeholder="${a.type==='Gym Badge'?'Defaults to the badge name':'e.g. Saved the ferry'}" data-nr></label>
        <label class="fld wide"><span class="fl">Note for the trainer</span><textarea data-u="award.note" rows="2" data-nr>${raw('\n')}${a.note}</textarea></label>
      </div>
      <label class="row"><input type="checkbox" data-act="awLevel" ${a.levelUp?raw('checked'):''}><span>Raise level by 1 (max 20)</span></label>
      <div><button class="btn primary" data-act="awGive" ${picked?'':raw('disabled')}>Award${picked?' to '+picked+(picked===1?' trainer':' trainers'):''}</button></div>`
      :h`<p class="sub">No trainers yet. Players appear here once they create a sheet.</p>`}
  </section>`;
}
function awardHistory(){
  const list=entriesOf(S.awards).sort((a,b)=>num(b.createdAt)-num(a.createdAt)).slice(0,30);
  return h`<section class="panel"><div class="ph"><h2>Award history</h2><span class="sub">${Object.keys(S.awards).length} total</span></div>
    ${list.length?h`<ul class="mini-list">${list.map(a=>h`<li><div class="row sp"><span><b>${a.title}</b> <span class="sub">to ${tName(S.trainers[a.uid])}</span></span>${delBtn('aw',a.id,'Revoke')}</div><span class="sub">${a.type}${a.levelUp?' · +1 level':''} · ${dt(a.createdAt)}${a.session?' · Session '+a.session:''}</span></li>`)}</ul>
      <p class="sub">Revoking removes the award from the record. It does not take back a badge or level already applied.</p>`
      :h`<p class="sub">Nothing awarded yet.</p>`}</section>`;
}
function gmTab(){
  const ids=tids();
  const top=ids.map(u=>[u,badgeCount(S.trainers[u])]).sort((a,b)=>b[1]-a[1])[0];
  const rows=ids.map(uid=>partyOf(uid).concat(boxOf(uid)).map(m=>[uid,m])).reduce((a,b)=>a.concat(b),[]);
  return h`<section class="panel"><div class="ph"><h2>Table settings</h2><span class="pill gm">GM only</span></div>
    <div class="fgrid">
      ${fText('Campaign title','meta','table','campaign',S.meta,{cls:'wide'})}
      ${fText('Subtitle','meta','table','subtitle',S.meta,{cls:'wide'})}
      ${fText('Game Master name','meta','table','gm',S.meta)}
      ${fNum('Current session','meta','table','session',S.meta,{min:1})}
      ${fArea('Pinned note for the party','meta','table','pinned',S.meta,{rows:3,cls:'wide',ph:'Shown at the top of the Overview'})}
    </div>
    <p class="sub">The banner is changed from the Overview page, the map from the Map page, and NPCs with portraits are added on the People page. Their secret notes are only visible to you.</p></section>
  ${CFG?tableAccess():''}
  ${awardForm()}${awardHistory()}
  <section class="panel"><div class="ph"><h2>Party snapshot</h2></div>
    <p>${top?h`Highest badge count: <b class="mono">${top[1]}</b> (${tName(S.trainers[top[0]])}).`:'No trainers yet.'}</p>
    <p class="sub">Loyalty and NPC secrets are stored where only editors can read them. Players never receive that data.</p></section>
  <section class="panel"><div class="ph"><h2>Loyalty board</h2></div>
    ${rows.length?h`<ul class="mini-list">${rows.map(([uid,m])=>{const L=clamp(num((S.gmLoy[m.id]||{}).loyalty),0,5);return h`<li><div class="row sp"><span><b>${mName(m)}</b> <span class="sub">${tName(S.trainers[uid])}</span></span><span class="seg" role="group" aria-label="Loyalty for ${mName(m)}">${[0,1,2,3,4,5].map(n=>h`<button data-act="loy" data-pid="${m.id}" data-uid="${uid}" data-n="${n}" aria-pressed="${String(L===n)}">${n}</button>`)}</span></div></li>`;})}</ul>`:h`<p class="sub">No Pokémon on the table yet.</p>`}</section>
  ${CFG?'':h`<section class="panel"><div class="ph"><h2>Sharing</h2></div>
    <p class="sub">Invite each player from the Share menu as a Contributor so they can save their own sheet. Viewers and Commenters can read but not edit.</p></section>`}`;
}

/* ---------- places: hotspots on the map, hover card, place pages ---------- */
const PL_LABEL={city:'City',town:'Town',landmark:'Landmark',island:'Island',area:'Resort area',route:'Route'};
const natural=(a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true});
const plSub=f=>f.t==='r'?(f.nick||'Route'):(PL_LABEL[f.kind]||'Place');
const plFact=(f,k)=>{const x=f.facts.find(y=>y[0]===k);return x?x[1]:'';};
const mapReady=()=>!!(S.mapSrc&&S.mapChunks.meta&&S.mapChunks.meta.kind==='sinnoh');
function plText(f){
  const r=S.places[f.id];
  const d=r&&typeof r.desc==='string'?r.desc.trim():'';
  return d||f.sum;
}
const plPic=f=>{const r=S.places[f.id];return r&&typeof r.img==='string'?r.img:'';};
function plShort(f){
  const t=plText(f).replace(/\s+/g,' ');
  if(t.length<=175)return t;
  const cut=t.slice(0,175);
  const k=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf('! '),cut.lastIndexOf('? '));
  return k>70?cut.slice(0,k+1):cut.replace(/\s+\S*$/,'')+'…';
}

/* which places and roads touch which: read from each route's "Connects" line */
const PD_REL=(()=>{
  const rel={};
  PD.forEach(f=>{rel[f.id]=new Set();});
  const byLen=PD.slice().sort((a,b)=>b.name.length-a.name.length);
  PD.forEach(f=>{
    if(f.t!=='r')return;
    let rest=plFact(f,'Connects');
    byLen.forEach(g=>{
      if(g.id===f.id||rest.indexOf(g.name)<0)return;
      rest=rest.split(g.name).join('\u0000');
      rel[f.id].add(g.id);rel[g.id].add(f.id);
    });
  });
  return rel;
})();

/* ---------- picture: an uploaded one, or a crop of the map with the place marked ---------- */
function cropBox(f,aspect,minW){
  let w=Math.max(f.bb[2]-f.bb[0]+170,minW),hh=w/aspect;
  if(f.bb[3]-f.bb[1]+120>hh){hh=f.bb[3]-f.bb[1]+120;w=hh*aspect;}
  w=Math.min(w,MAP_W);hh=w/aspect;
  if(hh>MAP_H){hh=MAP_H;w=hh*aspect;}
  const x=clamp(f.cx-w/2,0,MAP_W-w),y=clamp(f.cy-hh/2,0,MAP_H-hh);
  return[Math.round(x),Math.round(y),Math.round(w),Math.round(hh)];
}
function plMark(f,w){
  if(f.t==='r'){
    const d=f.segs.map(s=>'M'+s.map(q=>q[0]+' '+q[1]).join('L')).join('');
    return h`<path d="${d}" fill="none" stroke="#0A0F1C" stroke-opacity=".85" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path d="${d}" fill="none" stroke="#FFD43B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  }
  const r=Math.round(w*0.05);
  return h`<circle cx="${f.x}" cy="${f.y}" r="${r}" fill="none" stroke="#0A0F1C" stroke-opacity=".85" stroke-width="7" vector-effect="non-scaling-stroke"/><circle cx="${f.x}" cy="${f.y}" r="${r}" fill="none" stroke="#FFD43B" stroke-width="3.5" vector-effect="non-scaling-stroke"/>`;
}
function plThumb(f,o){
  const cls=o.cls||'';
  const own=plPic(f);
  const src=own?imgSrc(own):'';
  if(src)return h`<img class="pl-thumb ${cls}" src="${src}" width="640" height="360" alt="${f.name}">`;
  if(!mapReady())return h`<div class="pl-thumb none ${cls}" aria-hidden="true"><span>${f.name.charAt(0)}</span></div>`;
  const b=cropBox(f,o.aspect||16/9,o.minW||420);
  return h`<svg class="pl-thumb ${cls}" viewBox="${b[0]} ${b[1]} ${b[2]} ${b[3]}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map around ${f.name}"><image href="${S.mapSrc}" width="${MAP_W}" height="${MAP_H}"/>${plMark(f,b[2])}</svg>`;
}

/* ---------- invisible hit shapes over the map (built once) ---------- */
let HOT_STR='';
function hotMarkup(){
  if(HOT_STR)return HOT_STR;
  const mk=f=>{
    const d=f.t==='r'?f.segs.map(s=>'M'+s.map(q=>q[0]+' '+q[1]).join('L')).join(''):'M'+f.x+' '+f.y+'h0';
    if(f.t==='p')return '<g class="hs p" data-act="hs" data-pl="'+f.id+'"><circle class="hc" cx="'+f.x+'" cy="'+f.y+'" r="40"/><circle class="hv" cx="'+f.x+'" cy="'+f.y+'" r="40"/><path class="ht" d="'+d+'"/></g>';
    return '<g class="hs r" data-act="hs" data-pl="'+f.id+'"><path class="hc" d="'+d+'"/><path class="hv" d="'+d+'"/><path class="ht" d="'+d+'"/></g>';
  };
  HOT_STR='<svg class="hot" viewBox="0 0 '+MAP_W+' '+MAP_H+'" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
    +PD.filter(f=>f.t==='r').map(mk).join('')+PD.filter(f=>f.t==='p').map(mk).join('')+'</svg>';
  return HOT_STR;
}

/* rings round towns keep a steady on-screen size whatever the zoom */
function sizeHot(){
  const svg=$('svg.hot');
  if(!svg)return;
  const k=svg.getBoundingClientRect().width/MAP_W;
  if(!k)return;
  const r=(15/k).toFixed(1);
  svg.querySelectorAll('.hs.p circle').forEach(c=>c.setAttribute('r',r));
}
let szq=0;
window.addEventListener('resize',()=>{if(szq)return;szq=requestAnimationFrame(()=>{szq=0;sizeHot();});});

/* ---------- places list beside the map ---------- */
const PL_FILTERS=[['all','All'],['settle','Towns'],['land','Landmarks'],['route','Routes']];
function plMatches(){
  const q=String(S.ui.q.places||'').trim().toLowerCase();
  const fl=S.ui.f.places||'all';
  return PD.filter(f=>{
    if(fl!=='all'&&f.g!==fl)return false;
    if(!q)return true;
    return (f.name+' '+(f.nick||'')+' '+plFact(f,'Gym')).toLowerCase().indexOf(q)>=0;
  }).sort(natural);
}
function plRows(){
  const L=plMatches();
  if(!L.length)return h`<li class="sub plnone">Nothing matches that search.</li>`;
  return h`${L.map(f=>h`<li><button class="plrow" data-act="place" data-id="${f.id}"><span class="pk ${f.g}" aria-hidden="true"></span><span class="pnm">${f.name}</span><span class="sub">${plSub(f)}</span></button></li>`)}`;
}
function refreshPlaceList(){
  const ul=$('#plrows');
  if(!ul)return;
  ul.innerHTML=plRows().s;
  const c=$('#plcount');
  if(c)c.textContent=String(plMatches().length);
  syncHl();
}
function placesPanel(){
  return h`<div class="ph"><h2>Places</h2><span class="sub mono" id="plcount">${plMatches().length}</span></div>
    <input type="search" class="plq" data-pq="1" value="${S.ui.q.places||''}" placeholder="Search places, routes, gyms" aria-label="Search places" autocomplete="off">
    <div class="seg" role="group" aria-label="Filter places">${PL_FILTERS.map(([k,l])=>h`<button data-act="pf" data-v="${k}" aria-pressed="${String((S.ui.f.places||'all')===k)}">${l}</button>`)}</div>
    <ul class="plrows" id="plrows">${plRows()}</ul>`;
}

/* ---------- hover card, highlight ---------- */
let tipId='',tipTimer=0,lastPT='mouse';
const tipNode=()=>document.getElementById('ptip');
const coarse=()=>!!(window.matchMedia&&matchMedia('(hover:none)').matches);
function setHl(id){
  document.querySelectorAll('.hs.on,.plrow.on').forEach(el=>el.classList.remove('on'));
  S.hl=id||'';
  if(id)document.querySelectorAll('.hs[data-pl="'+id+'"],.plrow[data-id="'+id+'"]').forEach(el=>el.classList.add('on'));
}
function syncHl(){setHl(S.hl);}
function tipHtml(f){
  const gym=plFact(f,'Gym');
  return h`<div class="tp-pic">${plThumb(f,{aspect:16/9,minW:420,cls:'tp'})}</div><div class="tp-body"><span class="tp-kind">${plSub(f)}${gym?' · Gym':''}</span><b class="tp-name">${f.name}</b><span class="tp-sum">${plShort(f)}</span><span class="tp-go">Open page →</span></div>`;
}
function placeTip(el,x,y){
  if(coarse()){el.classList.add('sheet');return;}
  el.classList.remove('sheet');
  const W=el.offsetWidth||300,H=el.offsetHeight||200;
  const vw=document.documentElement.clientWidth,vh=window.innerHeight;
  let l=x+14,t=y+14;
  if(l+W>vw-8)l=x-W-14;
  if(l<8)l=Math.max(8,vw-W-8);
  if(t+H>vh-8)t=y-H-14;
  if(t<8)t=8;
  el.style.left=Math.round(l)+'px';
  el.style.top=Math.round(t)+'px';
}
function showTip(id,x,y){
  const f=PD_BY[id],el=tipNode();
  if(!f||!el)return;
  clearTimeout(tipTimer);
  if(tipId!==id||el.hidden){
    tipId=id;
    el.innerHTML=tipHtml(f).s;
    el.setAttribute('data-id',id);
    el.hidden=false;
    placeTip(el,x,y);
  }
  setHl(id);
}
function hideTip(now){
  clearTimeout(tipTimer);
  const go=()=>{const el=tipNode();if(el)el.hidden=true;tipId='';setHl('');};
  if(now)go();else tipTimer=setTimeout(go,320);
}
function openPlace(id){
  if(!PD_BY[id])return;
  hideTip(true);
  S.placeId=id;S.ui.navOpen=false;
  setTab('place');
}
function showOnMap(id){
  const f=PD_BY[id];
  if(!f)return;
  hideTip(true);
  S.ui.focusPl=id;
  if(S.ui.zoom<2)S.ui.zoom=2;
  setTab('map');
}
/* after a render: scroll position of the zoomed map, and the "show on map" jump */
function mapScrollAfterRender(prev){
  sizeHot();
  const mv=$('#mapview');
  if(!mv)return;
  const sw=mv.scrollWidth,sh=mv.scrollHeight;
  let cx=null,cy=null;
  if(S.ui.focusPl&&PD_BY[S.ui.focusPl]){
    const f=PD_BY[S.ui.focusPl];cx=f.cx/MAP_W;cy=f.cy/MAP_H;
    const id=S.ui.focusPl;S.ui.focusPl=null;
    S.ui.zoomC=null;
    setTimeout(()=>{S.hl=id;syncHl();setTimeout(()=>{if(S.hl===id&&tipNode().hidden)setHl('');},3200);},0);
  }else if(S.ui.zoomC){cx=S.ui.zoomC[0];cy=S.ui.zoomC[1];S.ui.zoomC=null;}
  if(cx!=null){
    mv.scrollLeft=Math.max(0,cx*sw-mv.clientWidth/2);
    mv.scrollTop=Math.max(0,cy*sh-mv.clientHeight/2);
  }else if(prev){mv.scrollLeft=prev[0];mv.scrollTop=prev[1];}
}
function setZoom(z){
  const mv=$('#mapview');
  if(mv&&mv.scrollWidth){
    S.ui.zoomC=[(mv.scrollLeft+mv.clientWidth/2)/mv.scrollWidth,(mv.scrollTop+mv.clientHeight/2)/mv.scrollHeight];
  }
  S.ui.zoom=z;
  hideTip(true);
  render();
}

document.addEventListener('pointerdown',e=>{lastPT=e.pointerType||'mouse';},true);
document.addEventListener('pointerover',e=>{
  if(e.pointerType==='touch')return;
  const t=e.target;
  if(!t||!t.closest)return;
  const hs=t.closest('.hs');
  if(hs){
    if(tipId===hs.dataset.pl&&!tipNode().hidden)clearTimeout(tipTimer);
    else showTip(hs.dataset.pl,e.clientX,e.clientY);
    return;
  }
  if(t.closest('#ptip')){clearTimeout(tipTimer);return;}
  const row=t.closest('.plrow');
  if(row)setHl(row.dataset.id);
});
document.addEventListener('pointerout',e=>{
  if(e.pointerType==='touch')return;
  const t=e.target,to=e.relatedTarget;
  if(!t||!t.closest)return;
  const hs=t.closest('.hs');
  if(hs){
    if(!(to&&to.closest&&to.closest('#ptip,.hs[data-pl="'+hs.dataset.pl+'"]')))hideTip();
    return;
  }
  if(t.closest('#ptip')){
    if(!(to&&to.closest&&to.closest('#ptip,.hs')))hideTip();
    return;
  }
  if(t.closest('.plrow')&&!(to&&to.closest&&to.closest('.plrow')))setHl(tipId||'');
});
document.addEventListener('focusin',e=>{const r=e.target.closest&&e.target.closest('.plrow');if(r)setHl(r.dataset.id);});
document.addEventListener('focusout',e=>{const r=e.target.closest&&e.target.closest('.plrow');if(r)setHl(tipId||'');});
document.addEventListener('scroll',e=>{if(e.target&&e.target.id==='mapview')hideTip(true);},true);
window.addEventListener('resize',()=>hideTip(true));

/* ---------- the map page ---------- */
function mapTab(){
  const pins=pinList();
  const mode=S.ui.pinMode||'';
  const placing=mode==='add'||mode.indexOf('move:')===0;
  const mm=S.mapChunks.meta||{};
  const mapW=clamp(num(mm.w),1,4000)||4,mapH=clamp(num(mm.h),1,4000)||3;
  const hot=mapReady()&&!placing;
  const hint=placing?(mode==='add'?'Click or tap the map where the pin goes.':'Click or tap the new spot for this pin.')
    :hot?(coarse()?'Tap a town, landmark or road to preview it, then tap the card to open its page.':'Hover a town, landmark or road to preview it. Click to open its page.')
    :'Pins are shared by the whole party. Select one to read or edit it.';
  const sub=S.ui.mapSub==='pins'||!mapReady()?'pins':'places';
  return h`<section class="panel"><div class="ph"><h2>Region map</h2>
      <div class="acts">${S.mapSrc?h`<span class="seg" role="group" aria-label="Zoom">${[1,2,3].map(z=>h`<button data-act="zoom" data-z="${z}" aria-pressed="${String(S.ui.zoom===z)}">${z===1?'Fit':z+'×'}</button>`)}</span>`:''}${canShared()?(placing?h`<button class="btn sm" data-act="pinMode" data-v="">Cancel</button>`:h`<button class="btn primary sm" data-act="pinMode" data-v="add">Drop a pin</button><button class="btn sm" data-act="pinCenter">Pin at center</button>`):''}${S.me.admin?mapPicker():''}</div></div>
      <p class="sub" aria-live="polite">${hint}</p></section>
    <div class="maplay">
      <div class="mapview z${S.ui.zoom}" id="mapview" role="region" aria-label="Region map, scrollable" tabindex="0">
        <div class="mapwrap ${S.mapSrc?'':'blank'} ${placing?'placing':''}" ${placing?raw('data-act="mapClick"'):''}>
          ${S.mapSrc?h`<img class="mapimg" src="${S.mapSrc}" width="${mapW}" height="${mapH}" alt="Map of the region" draggable="false">`:h`<p class="mapnote">No map uploaded yet. ${S.me.admin?'Use Upload map above.':'The GM can upload one.'}</p>`}
          ${hot?raw(hotMarkup()):''}
          ${pins.map(p=>h`<button class="mpin ${p.kind||'place'} ${S.ui.selPin===p.id?'sel':''}" data-act="selPin" data-id="${p.id}" data-x="${clamp(num(p.x),0,1)}" data-y="${clamp(num(p.y),0,1)}" aria-label="Pin ${p.n}: ${p.label||'unnamed'}">${p.n}</button>`)}
        </div>
      </div>
      <aside class="panel">
        ${mapReady()?h`<div class="seg" role="group" aria-label="Side list"><button data-act="msub" data-v="places" aria-pressed="${String(sub==='places')}">Places</button><button data-act="msub" data-v="pins" aria-pressed="${String(sub==='pins')}">Pins <span class="mono">${pins.length}</span></button></div>`:''}
        ${sub==='places'?placesPanel()
          :h`<div class="ph"><h2>Pins</h2><span class="sub">${pins.length}</span></div>
            ${pins.length?h`<ul class="pinlist">${pins.map(pinRow)}</ul>`:h`<p class="sub">No pins yet. Mark the places your party has been or wants to go.</p>`}`}
      </aside>
    </div>`;
}

/* ---------- a place's own page ---------- */
function recordsFor(f){
  const k=f.name.toLowerCase();
  const m=c=>entriesOf(c).filter(e=>String(e.place||'').trim().toLowerCase()===k);
  return{people:m(S.people),journal:m(S.journal),leads:m(S.leads),timeline:m(S.timeline)};
}
function chipBtns(list){
  return h`<div class="row plchips">${list.map(g=>h`<button class="btn sm" data-act="place" data-id="${g.id}">${g.name}</button>`)}</div>`;
}
function placeTab(){
  const f=PD_BY[S.placeId];
  if(!f)return h`<section class="panel"><div class="ph"><h2>Place not found</h2></div><div><button class="btn" data-act="tab" data-tab="map">Back to the map</button></div></section>`;
  const admin=!!S.me.admin;
  const rel=[...PD_REL[f.id]].map(i=>PD_BY[i]).sort(natural);
  const roads=rel.filter(x=>x.t==='r'),spots=rel.filter(x=>x.t==='p');
  const rec=recordsFor(f);
  const nrec=rec.people.length+rec.journal.length+rec.leads.length+rec.timeline.length;
  const doc=S.places[f.id]||{};
  const gp=S.gmPl[f.id]||{};
  const facts=f.facts;
  return h`<div class="row"><button class="btn sm" data-act="tab" data-tab="map">← Back to the map</button>${mapReady()?h`<button class="btn sm" data-act="showMap" data-id="${f.id}">Show on map</button>`:''}</div>
    <section class="panel plhero">
      <div class="pl-pic">${plThumb(f,{aspect:16/9,minW:620,cls:'big'})}</div>
      <div class="pl-head"><p class="eyebrow">${plSub(f)}${plFact(f,'Gym')?' · Gym':''}</p><h2 class="pl-name">${f.name}</h2></div>
      ${admin?h`<div class="fld">${fArea('Description players read','pl',f.id,'desc',{desc:plText(f)},{rows:5})}
          <div class="row">${imgPicker('pl',f.id,'img',doc,640,360,90000,false)}${doc.desc&&String(doc.desc).trim()?h`<button class="btn sm ghost" data-act="plReset" data-id="${f.id}">Use the original text</button>`:''}</div>
          <p class="sub">Changes are saved for everyone. With no uploaded picture, a crop of the map is shown.</p></div>`
        :h`<p class="prewrap pl-text">${plText(f)}</p>`}
      ${facts.length?h`<dl class="pl-facts">${facts.map(([k,v])=>h`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>`:''}
    </section>
    ${roads.length||spots.length?h`<section class="panel"><div class="ph"><h2>${f.t==='r'?'Where it leads':'Roads and neighbors'}</h2></div>
      ${f.t==='p'&&roads.length?h`<div class="fld"><span class="fl">Roads</span>${chipBtns(roads)}</div>`:''}
      ${f.t==='p'&&spots.length?h`<div class="fld"><span class="fl">Nearby places</span>${chipBtns(spots)}</div>`:''}
      ${f.t==='r'&&spots.length?h`<div class="fld"><span class="fl">Places on this road</span>${chipBtns(spots)}</div>`:''}
      ${f.t==='r'&&roads.length?h`<div class="fld"><span class="fl">Joins</span>${chipBtns(roads)}</div>`:''}
    </section>`:''}
    <section class="panel"><div class="ph"><h2>Your party's records here</h2><span class="sub">${nrec}</span></div>
      ${nrec?h`<div class="plrec">
        ${rec.people.length?h`<div class="fld"><span class="fl">People</span><ul class="mini-list">${rec.people.map(p=>h`<li><button class="plink" data-act="tab" data-tab="people">${p.name||'Unnamed'}</button> <span class="sub">${p.role||''}</span></li>`)}</ul></div>`:''}
        ${rec.journal.length?h`<div class="fld"><span class="fl">Journal</span><ul class="mini-list">${rec.journal.map(p=>h`<li><button class="plink" data-act="tab" data-tab="journal">${p.title||'Untitled entry'}</button> <span class="sub">Session ${num(p.session)||'?'}</span></li>`)}</ul></div>`:''}
        ${rec.leads.length?h`<div class="fld"><span class="fl">Leads</span><ul class="mini-list">${rec.leads.map(p=>h`<li><button class="plink" data-act="tab" data-tab="leads">${p.title||'Untitled lead'}</button> <span class="sub">${p.status||'open'}</span></li>`)}</ul></div>`:''}
        ${rec.timeline.length?h`<div class="fld"><span class="fl">Timeline</span><ul class="mini-list">${rec.timeline.map(p=>h`<li><button class="plink" data-act="tab" data-tab="timeline">${p.title||'Untitled event'}</button> <span class="sub">Session ${num(p.session)||'?'}</span></li>`)}</ul></div>`:''}
      </div>`
      :h`<p class="sub">Nothing yet. Fill in the Place field on a person, journal entry, lead or timeline event with “${f.name}” and it will show up here.</p>`}
    </section>
    ${admin?h`<section class="panel"><div class="ph"><h2>GM notes</h2><span class="pill gm">GM only</span></div>
      ${fArea('','gp',f.id,'notes',gp,{rows:5,ph:'Secrets, hooks and what is really here. Players never receive this.'})}</section>`:''}`;
}

/* ---------- standalone build only: account page and table access (GM) ---------- */
function tableAccess(){
  const codeNow=S.ui.inv.code!=null?S.ui.inv.code:((S.invite&&S.invite.code)||'');
  const mem=Object.keys(S.members).filter(u=>u!==S.me.id).sort((a,b)=>num(S.members[a].joinedAt)-num(S.members[b].joinedAt));
  return h`<section class="panel"><div class="ph"><h2>Table access</h2><span class="pill gm">GM only</span></div>
    <p class="sub">Players create an account on this site and enter the table code to join. Change the code to stop new people joining. Anyone who already joined keeps access until you remove them.</p>
    <div class="fgrid"><label class="fld wide"><span class="fl">Table code</span><input type="text" data-u="inv.code" data-nr value="${codeNow}" autocomplete="off" spellcheck="false" maxlength="64" placeholder="At least 6 characters, such as a short phrase"></label></div>
    <div class="row"><button class="btn primary sm" data-act="invSave">Save code</button><span class="sub">${S.invite&&S.invite.code?'A code is set.':'No code is set yet, so nobody can join.'}</span></div>
    <div class="fl">Players (${mem.length})</div>
    ${mem.length?h`<ul class="mini-list">${mem.map(u=>{const armed=S.ui.confirm==='mem|'+u;return h`<li><div class="row sp"><span><b>${S.names[u]||'A player'}</b> <span class="sub">${S.trainers[u]?'Sheet: '+tName(S.trainers[u]):'No sheet yet'} · joined ${dt(S.members[u].joinedAt)}</span></span><button class="btn sm danger ${armed?'armed':''}" data-act="rmMember" data-uid="${u}">${armed?'Tap again to confirm':'Remove'}</button></div></li>`;})}</ul>
      <p class="sub">Removing a player ends their access, but anyone who still knows the table code can join again, so change the code too if you want to keep someone out. Their character stays on the table until you delete it.</p>`
      :h`<p class="sub">Nobody has joined yet.</p>`}
  </section>`;
}
function accountTab(){
  const api=CFG&&CFG.api;
  if(!api)return emptyState('Account','Account tools are not available in this view.');
  const nameNow=S.ui.acct.name!=null?S.ui.acct.name:(S.names[S.me.id]||api.displayName()||'');
  return h`<section class="panel"><div class="ph"><h2>Your account</h2></div>
    <div class="fgrid">
      <label class="fld wide"><span class="fl">Display name</span><input type="text" data-u="acct.name" data-nr value="${nameNow}" maxlength="40" autocomplete="nickname"></label>
      <div class="fld wide"><span class="fl">Signed in as</span><span>${api.email()||'(no email on this account)'}</span></div>
    </div>
    <p class="sub">Your display name is what the GM and other players see next to your character, notes and journal entries.</p>
    <div class="row"><button class="btn primary sm" data-act="acctName">Save name</button>${api.canReset()?h`<button class="btn sm" data-act="acctReset">Email me a password reset link</button>`:''}<button class="btn sm ghost" data-act="signOut">Sign out</button></div>
    ${S.ui.acct.msg?h`<p class="sub" role="status">${S.ui.acct.msg}</p>`:''}</section>
  <section class="panel"><div class="ph"><h2>What you can change</h2></div>
    <p class="sub">You control your own character sheet, your own Pokémon, and what you add yourself. Anyone can edit the shared People and Leads notes, but only the person who added an entry (or the GM) can delete it. The GM can change anything. Your private notes are visible only to you.</p></section>`;
}

/* ---------- rolling ---------- */
const d20=()=>1+Math.floor(Math.random()*20);
function rollOnce(){
  const a=d20();
  if(a===20){const b=d20();return{base:20+b,txt:'20, then '+b+' (+20)'};}
  return{base:a,txt:String(a)};
}
function doRoll(label,m,tal){
  const r1=rollOnce();
  let pick=r1,note='';
  if(S.ui.adv!=='normal'){
    const r2=rollOnce();
    const better=S.ui.adv==='adv';
    pick=(better?r2.base>r1.base:r2.base<r1.base)?r2:r1;
    note=' ('+(better?'advantage':'disadvantage')+': '+r1.base+' / '+r2.base+')';
  }
  const total=pick.base+m+tal;
  S.rolls.unshift({label,total,detail:'d20 '+pick.txt+' = '+pick.base+' + mod '+m+(tal?' + talent '+tal:'')+note});
  S.rolls=S.rolls.slice(0,6);
  S.ui.rollHidden=false;
}
function renderRoll(){
  const el=$('#rollbox');
  const r=S.rolls[0];
  if(!r||S.ui.rollHidden){el.hidden=true;el.innerHTML='';return;}
  el.hidden=false;
  el.innerHTML=h`<div class="rh"><span>Pokétch · ${r.label}</span><button data-act="closeRoll" aria-label="Close roll panel">×</button></div><div class="big">${r.total}</div><div class="det">${r.detail}</div>${S.rolls.length>1?h`<ul>${S.rolls.slice(1,5).map(x=>h`<li>${x.label}: ${x.total}</li>`)}</ul>`:''}`.s;
}

/* ---------- page chrome ---------- */
const navGroups=()=>{const g=S.me.admin?NAV.concat([GM_NAV]):NAV;return CFG?g.concat([['You',[['account','Account']]]]):g;};
function tabCount(k){
  if(k==='people')return Object.keys(S.people).length;
  if(k==='leads')return entriesOf(S.leads).filter(l=>!l.status||l.status==='open'||l.status==='chasing').length;
  return 0;
}
function headerHtml(){
  const m=S.meta;
  const t=PAGE_LABEL[S.tab]||'Overview';
  return h`<button class="btn sm menu-btn" data-act="menu" aria-expanded="${String(!!S.ui.navOpen)}" aria-controls="side">Menu</button>
    <div class="bar-t"><p class="eyebrow">${m.campaign}</p>${S.tab==='overview'?h`<p class="bar-title">${t}</p>`:h`<h1 class="bar-title">${t}</h1>`}</div>
    <div class="bar-r">${onlineHtml()}${S.me.admin?h`<span class="chip gm">GM</span>`:''}<span class="chip">Session ${num(m.session)||1}</span><span id="savestate" class="save ${S.save.cls}" aria-live="polite">${S.save.text}</span></div>`;
}
function renderHead(){const el=$('#head');if(el)el.innerHTML=headerHtml().s;}
function sideHtml(){
  if(S.noDb)return '';
  return h`<div class="brand"><span class="logo lcd" aria-hidden="true">LOG</span><div><b>${S.meta.campaign}</b><small>${S.meta.gm?'Game Master '+S.meta.gm:'Trainer Log'}</small></div></div>
    <nav aria-label="Sections">${navGroups().map(([title,items])=>h`<div class="ng"><p class="nt">${title}</p>${items.map(([k,l])=>h`<button class="nv" data-act="tab" data-tab="${k}" aria-current="${S.tab===k||(k==='map'&&S.tab==='place')?'page':'false'}"><span>${l}</span>${tabCount(k)?h`<span class="n">${tabCount(k)}</span>`:''}</button>`)}</div>`)}</nav>`;
}
function banners(){
  if(!S.me.canWrite)return h`<div class="banner warn">${CFG?'You can read this table but not change it.':'You can read this table but not change it. Ask the GM to share the page with you as a Contributor.'}</div>`;
  if(S.ui.writeFail)return h`<div class="banner warn">${CFG?'Your last change did not save. You may not have permission to change that, or you may be offline. Reload the page and try again.':'Your last change did not save. You may only have view access. Ask the GM to share the page with you as a Contributor.'}</div>`;
  return '';
}
function footer(){
  return h`<div class="foot"><span>${S.me.id?'Your private notes are visible only to you.':''}</span>${S.dl&&S.me.id?h`<button class="btn sm ghost" data-act="export">Download my backup</button>`:''}${CFG?h`<button class="btn sm ghost" data-act="signOut">Sign out</button>`:''}</div>`;
}
function mainHtml(){
  if(S.noDb)return emptyState('This tracker needs a signed-in view','Open it from your claude.ai link while signed in. The shared table is stored with the page, so it cannot load anywhere else.');
  if(!S.ready)return h`<p class="loading">OPENING THE TABLE…</p>`;
  const views={overview:overviewTab,journal:journalTab,timeline:timelineTab,people:peopleTab,leads:leadsTab,map:mapTab,place:placeTab,trainer:trainerTab,pokemon:pokemonTab,gm:gmTab,account:accountTab};
  let tab=S.tab;
  if(tab==='gm'&&!S.me.admin)tab='overview';
  if(tab==='account'&&!CFG)tab='overview';
  return h`${banners()}${(views[tab]||overviewTab)()}${footer()}`;
}
function fixView(){
  if(!S.ready)return;
  if(S.viewUid&&S.trainers[S.viewUid])return;
  const ids=tids();
  S.viewUid=(S.me.id&&S.trainers[S.me.id])?S.me.id:(ids[0]||null);
}
function setPresence(){
  if(!S.room)return;
  try{Promise.resolve(S.room.presence({tab:S.tab})).catch(()=>{});}catch(e){}
}
function positionPins(){
  document.querySelectorAll('.mpin[data-x]').forEach(el=>{
    el.style.left=(+el.dataset.x*100)+'%';
    el.style.top=(+el.dataset.y*100)+'%';
  });
}

/* ---------- render with focus kept ---------- */
function captureFocus(){
  const a=document.activeElement;
  if(!a||!a.dataset)return null;
  const at=a.dataset.b!=null?'b':a.dataset.u!=null?'u':a.dataset.pq!=null?'pq':null;
  if(!at)return null;
  let s=null,en=null;
  try{s=a.selectionStart;en=a.selectionEnd;}catch(e){}
  return{at,k:a.dataset[at],s,en};
}
function restoreFocus(fc){
  if(!fc)return;
  const el=document.querySelector('[data-'+fc.at+'="'+CSS.escape(fc.k)+'"]');
  if(!el||el.disabled)return;
  el.focus({preventScroll:true});
  try{if(fc.s!=null&&el.setSelectionRange)el.setSelectionRange(fc.s,fc.en);}catch(e){}
}
function render(){
  fixView();
  const fc=captureFocus();
  const a=document.activeElement;
  const navKey=a&&a.classList&&a.classList.contains('nv')?a.dataset.tab:null;
  const y=window.scrollY;
  const mv0=$('#mapview');
  const mprev=mv0?[mv0.scrollLeft,mv0.scrollTop]:null;
  renderHead();
  const sh=$('#shell');
  sh.classList.toggle('nav-open',!!S.ui.navOpen);
  sh.classList.toggle('no-side',!!S.noDb);
  const sig=navGroups().map(g=>g[1].map(x=>x[0]+tabCount(x[0])).join()).join('|')+'|'+S.tab+'|'+S.noDb+'|'+S.meta.campaign+'|'+S.meta.gm;
  if(sig!==S._tsig){
    S._tsig=sig;
    $('#side').innerHTML=sideHtml().s;
    if(navKey){const el=document.querySelector('.nv[data-tab="'+navKey+'"]');if(el)el.focus({preventScroll:true});}
  }
  $('#main').innerHTML=mainHtml().s;
  renderRoll();
  restoreFocus(fc);
  positionPins();
  mapScrollAfterRender(mprev);
  if(S.tab!=='map')hideTip(true);else syncHl();
  if(S.ui.toTop){S.ui.toTop=false;window.scrollTo(0,0);}else window.scrollTo(0,y);
  ensureNames();
}
async function ensureNames(){
  if(!S.user)return;
  const want=new Set(Object.keys(S.trainers));
  [S.people,S.journal,S.leads,S.timeline,S.pins].forEach(c=>Object.keys(c).forEach(k=>{if(c[k].addedBy)want.add(c[k].addedBy);}));
  Object.keys(S.members).forEach(u=>want.add(u));
  S.peers.forEach(p=>{if(p.by)want.add(p.by);});
  const need=[...want].filter(u=>!(u in S.names));
  if(!need.length)return;
  need.forEach(u=>{S.names[u]='';});
  try{
    const ps=await S.user.profiles(need);
    let changed=false;
    need.forEach(u=>{
      const pr=ps[u];
      if(pr&&pr.name){S.names[u]=pr.name;changed=true;}
      if(pr&&typeof pr.avatarUrl==='string'&&/^data:image\//.test(pr.avatarUrl)){S.avatars[u]=pr.avatarUrl;changed=true;}
    });
    if(changed)scheduleRender();
  }catch(e){}
}
function toast(msg,ok){
  setStatus(ok?'note':'err',msg);
  setTimeout(()=>setStatus(Q.size?'busy':'saved'),3500);
}
function setTab(t){S.tab=t;lsSet('stl.tab',t);S.ui.toTop=true;setPresence();render();}

/* ---------- actions ---------- */
function addEntry(kind){
  const now=Date.now();
  if(kind==='ppl'){
    const id=S.db.collection('people').doc().id;
    newDoc('ppl',id,{name:'',role:'',place:'',met:num(S.meta.session)||1,att:'unknown',notes:'',pinned:false,addedBy:S.me.id,createdAt:now});
    S.ui.open['ppl'+id]=true;
  }else if(kind==='j'){
    const id=S.db.collection('journal').doc().id;
    newDoc('j',id,{session:num(S.meta.session)||1,title:'',body:'',place:'',addedBy:S.me.id,createdAt:now});
    S.ui.open['j'+id]=true;
  }else if(kind==='l'){
    const id=S.db.collection('leads').doc().id;
    newDoc('l',id,{title:'',detail:'',place:'',status:'open',addedBy:S.me.id,createdAt:now});
    S.ui.open['l'+id]=true;
  }else if(kind==='tl'){
    const id=S.db.collection('timeline').doc().id;
    newDoc('tl',id,{session:num(S.meta.session)||1,when:'',title:'',body:'',place:'',addedBy:S.me.id,createdAt:now});
    S.ui.open['tl'+id]=true;
  }else if(kind==='n'){
    const id=S.db.doc('data/users/'+S.me.id+'/profile').collection('notes').doc().id;
    newDoc('n',id,{title:'',body:'',createdAt:now});
    S.ui.open['n'+id]=true;
  }
  render();
}
function newPin(x,y){
  const id=S.db.collection('pins').doc().id;
  newDoc('pin',id,{x,y,label:'',note:'',kind:'place',addedBy:S.me.id,createdAt:Date.now()});
  S.ui.selPin=id;
}
function giveAwards(){
  const a=S.ui.award;
  const ids=tids().filter(u=>a.uids[u]);
  if(!ids.length){toast('Pick at least one trainer');return;}
  const bdg=BADGES.find(b=>b[0]===a.badge);
  const title=String(a.title||'').trim()||(a.type==='Gym Badge'&&bdg?bdg[1]+' Badge':a.type);
  const now=Date.now();
  ids.forEach(uid=>{
    const id=S.db.collection('awards').doc().id;
    newDoc('aw',id,{uid,type:a.type,title,note:a.note||'',badge:a.type==='Gym Badge'?a.badge:'',levelUp:!!a.levelUp,session:num(S.meta.session)||1,by:S.me.id,createdAt:now});
    const t=S.trainers[uid];
    if(a.type==='Gym Badge'&&a.badge)edit('t',uid,'badges.'+a.badge,true);
    if(a.levelUp&&t)edit('t',uid,'level',clamp(num(t.level||1)+1,1,20));
  });
  a.uids={};a.title='';a.note='';
  toast('Awarded to '+ids.length+(ids.length===1?' trainer':' trainers'),true);
  render();
}
async function uploadMap(file){
  const r=await fileToImage(file,{max:2048,q:0.82,cap:1300000});
  /* hover highlights only line up when the picture has the Sinnoh map's proportions */
  const sinn=Math.abs((r.w/r.h)/(MAP_W/MAP_H)-1)<0.03;
  const url=r.url,v=Date.now(),CH=150000;
  const n=Math.ceil(url.length/CH);
  const col=S.db.collection('mapimg');
  const old=num(S.mapChunks.meta&&S.mapChunks.meta.n);
  for(let i=0;i<n;i++)await col.doc('c'+i).set({d:url.slice(i*CH,(i+1)*CH),v});
  await col.doc('meta').set({n,w:r.w,h:r.h,v,updatedAt:v,kind:sinn?'sinnoh':''});
  for(let i=n;i<old;i++)await col.doc('c'+i).delete();
  return sinn;
}
async function removeMap(){
  const col=S.db.collection('mapimg');
  const old=num(S.mapChunks.meta&&S.mapChunks.meta.n);
  try{
    await col.doc('meta').delete();
    for(let i=0;i<old;i++)await col.doc('c'+i).delete();
  }catch(e){fail(e);}
}
function act(b,e){
  const d=b.dataset;
  switch(d.act){
    case 'tab':S.ui.navOpen=false;setTab(d.tab);break;
    case 'menu':{
      S.ui.navOpen=!S.ui.navOpen;render();
      const f=S.ui.navOpen?$('.nv[aria-current="page"]')||$('.nv'):$('.menu-btn');
      if(f)f.focus({preventScroll:true});
      break;}
    case 'hs':{
      if(lastPT==='touch'||coarse()){
        if(tipId===d.pl&&!tipNode().hidden){openPlace(d.pl);break;}
        showTip(d.pl,e.clientX,e.clientY);break;
      }
      openPlace(d.pl);break;}
    case 'place':openPlace(d.id);break;
    case 'showMap':showOnMap(d.id);break;
    case 'zoom':setZoom(clamp(num(d.z),1,3));break;
    case 'msub':S.ui.mapSub=d.v;render();break;
    case 'pf':S.ui.f.places=d.v;render();break;
    case 'plReset':edit('pl',d.id,'desc','');render();break;
    case 'pinMode':S.ui.pinMode=d.v||'';render();break;
    case 'movePin':S.ui.pinMode='move:'+d.id;render();break;
    case 'pinCenter':if(canShared()){newPin(0.5,0.5);render();}break;
    case 'mapClick':{
      const r=b.getBoundingClientRect();
      if(!r.width||!r.height||!e)break;
      const rx=Math.round(clamp((e.clientX-r.left)/r.width,0,1)*10000)/10000;
      const ry=Math.round(clamp((e.clientY-r.top)/r.height,0,1)*10000)/10000;
      const mode=S.ui.pinMode||'';
      if(mode==='add')newPin(rx,ry);
      else if(mode.indexOf('move:')===0){const id=mode.slice(5);if(S.pins[id]){edit('pin',id,'x',rx);edit('pin',id,'y',ry);}}
      S.ui.pinMode='';render();break;}
    case 'selPin':S.ui.selPin=S.ui.selPin===d.id?null:d.id;render();break;
    case 'nudge':{
      const p=S.pins[d.id];
      if(!p)break;
      edit('pin',d.id,'x',clamp(Math.round((num(p.x)+num(d.dx))*10000)/10000,0,1));
      edit('pin',d.id,'y',clamp(Math.round((num(p.y)+num(d.dy))*10000)/10000,0,1));
      render();break;}
    case 'pick':{
      S.pick={spec:d.img,w:+d.w||0,h:+d.h||0,cap:+d.cap||60000};
      const fp=$('#filepick');
      if(fp){fp.value='';fp.click();}
      break;}
    case 'rmImg':{const p=d.p.split('|');edit(p[0],p[1],p[2],'');render();break;}
    case 'rmMap':removeMap();break;
    case 'signOut':if(CFG&&CFG.api)CFG.api.signOut();break;
    case 'acctName':{
      const n=String(S.ui.acct.name!=null?S.ui.acct.name:'').trim().slice(0,40);
      if(!n){S.ui.acct.msg='Enter a name first.';render();break;}
      CFG.api.setName(n).then(()=>{S.names[S.me.id]=n;S.ui.acct.name=null;S.ui.acct.msg='Name saved.';render();})
        .catch(()=>{S.ui.acct.msg='Could not save the name.';render();});
      break;}
    case 'acctReset':
      CFG.api.resetPassword().then(()=>{S.ui.acct.msg='Reset link sent. Check your email.';render();})
        .catch(()=>{S.ui.acct.msg='Could not send the reset link.';render();});
      break;
    case 'invSave':{
      const c=String(S.ui.inv.code!=null?S.ui.inv.code:'').trim();
      if(c.length<6){toast('Use at least 6 characters');break;}
      S.db.collection('config').doc('invite').set({code:c}).then(()=>{S.ui.inv.code=null;toast('Table code saved',true);render();}).catch(fail);
      break;}
    case 'rmMember':{
      const key='mem|'+d.uid;
      if(S.ui.confirm===key){S.ui.confirm=null;S.db.collection('members').doc(d.uid).delete().then(()=>toast('Player removed',true)).catch(fail);render();}
      else{S.ui.confirm=key;render();setTimeout(()=>{if(S.ui.confirm===key){S.ui.confirm=null;render();}},4000);}
      break;}
    case 'awToggle':S.ui.award.uids[d.uid]=!S.ui.award.uids[d.uid];render();break;
    case 'awAll':{
      const ids=tids();
      const all=ids.every(u=>S.ui.award.uids[u]);
      S.ui.award.uids={};
      if(!all)ids.forEach(u=>{S.ui.award.uids[u]=true;});
      render();break;}
    case 'awLevel':S.ui.award.levelUp=!S.ui.award.levelUp;render();break;
    case 'awGive':giveAwards();break;
    case 'view':
      S.viewUid=d.uid;lsSet('stl.view',d.uid);
      if(d.tab)setTab(d.tab);else render();
      break;
    case 'newTrainer':{
      const id=S.me.id;
      if(!id||S.trainers[id])break;
      newDoc('t',id,{owner:id,name:'',cls:'',adv:'',level:1,age:16,hometown:'',origin:'',bio:'',hp:{cur:20,max:20},stats:{atk:2,def:2,spa:2,spd:2,spe:2},talents:{},features:[],items:[],credits:0,badges:{},honors:[],dex:0,createdAt:Date.now()});
      S.viewUid=id;setTab('trainer');
      break;}
    case 'hp':{
      const doc=getLocal(d.sc,d.id);
      if(!doc)break;
      const hp=doc.hp||{cur:0,max:0};
      edit(d.sc,d.id,'hp.cur',clamp(num(hp.cur)+num(d.d),0,Math.max(0,num(hp.max))));
      render();break;}
    case 'talent':{
      const t=S.trainers[d.uid];
      if(!t)break;
      const lv=clamp(num((t.talents||{})[d.key]),0,2);
      edit('t',d.uid,'talents.'+d.key,(lv+1)%3);
      render();break;}
    case 'badge':{
      const t=S.trainers[d.uid];
      if(!t)break;
      edit('t',d.uid,'badges.'+d.key,!(t.badges&&t.badges[d.key]));
      render();break;}
    case 'roll':doRoll(d.label,num(d.bonus),num(d.tal));renderRoll();break;
    case 'closeRoll':S.ui.rollHidden=true;renderRoll();break;
    case 'adv':S.ui.adv=d.v;render();break;
    case 'add':case 'del':case 'mv':{
      const parts=d.p.split('|');
      const sc=parts[0],id=parts[1],path=parts[2];
      const doc=getLocal(sc,id);
      if(!doc)break;
      const arr=(getIn(doc,path)||[]).slice();
      if(d.act==='add'){
        if(TPL_MAX[path]&&arr.length>=TPL_MAX[path])break;
        arr.push(TPL[d.tpl]());
      }else if(d.act==='del'){
        arr.splice(num(d.i),1);
      }else{
        const i=num(d.i),j=i+num(d.d);
        if(j<0||j>=arr.length)break;
        const tmp=arr[i];arr[i]=arr[j];arr[j]=tmp;
      }
      edit(sc,id,path,arr);
      render();break;}
    case 'pip':{
      const parts=d.p.split('|');
      const doc=getLocal(parts[0],parts[1]);
      if(!doc)break;
      const used=num(getIn(doc,parts[2]));
      const j=num(d.j);
      edit(parts[0],parts[1],parts[2],j<used?j:j+1);
      render();break;}
    case 'newMon':{
      const uid=S.viewUid;
      if(!canEditT(uid))break;
      const id=S.db.collection('trainers').doc(uid).collection('pokemon').doc().id;
      newDoc('p',uid+'/'+id,{owner:uid,nick:'',species:'',types:['',''],size:'Medium',weight:'Medium',die:'d6',hp:{cur:20,max:20},base:{atk:3,def:3,spa:3,spd:3,spe:3},bonus:{atk:0,def:0,spa:0,spd:0,spe:0},up:'',down:'',natureName:'',skills:'',passives:[],moves:[],item:'',status:'',caught:'',notes:'',slot:partyOf(uid).length<6?'party':'box',order:Date.now(),createdAt:Date.now()});
      S.ui.open['p'+uid+'/'+id]=true;
      render();break;}
    case 'toggle':S.ui.open[d.key]=!S.ui.open[d.key];render();break;
    case 'slot':{
      const id=d.uid+'/'+d.pid;
      const m=getLocal('p',id);
      if(!m)break;
      if(m.slot==='box'){
        if(partyOf(d.uid).length>=6){toast('Party is full. Move one to the box first.');break;}
        edit('p',id,'slot','party');
      }else edit('p',id,'slot','box');
      render();break;}
    case 'ord':{
      const m=getLocal('p',d.uid+'/'+d.pid);
      if(!m)break;
      const grp=(m.slot==='box'?boxOf:partyOf)(d.uid);
      const i=grp.findIndex(x=>x.id===d.pid);
      const j=i+num(d.d);
      if(i<0||j<0||j>=grp.length)break;
      const A=grp[i],B=grp[j];
      let oa=num(A.order),ob=num(B.order);
      if(oa===ob)ob=oa+num(d.d);
      edit('p',d.uid+'/'+A.id,'order',ob);
      edit('p',d.uid+'/'+B.id,'order',oa);
      render();break;}
    case 'heal':{
      monsOf(S.viewUid).forEach(m=>{
        const id=S.viewUid+'/'+m.id;
        edit('p',id,'hp.cur',num(m.hp&&m.hp.max));
        edit('p',id,'status','');
      });
      render();break;}
    case 'rest':{
      monsOf(S.viewUid).forEach(m=>{
        if(!(m.moves||[]).length)return;
        edit('p',S.viewUid+'/'+m.id,'moves',m.moves.map(x=>Object.assign({},x,{used:0})));
      });
      render();break;}
    case 'newDoc':addEntry(d.kind);break;
    case 'delDoc':{
      const key=d.sc+'|'+d.id;
      if(S.ui.confirm===key){S.ui.confirm=null;removeDoc(d.sc,d.id);}
      else{
        S.ui.confirm=key;render();
        setTimeout(()=>{if(S.ui.confirm===key){S.ui.confirm=null;render();}},4000);
      }
      break;}
    case 'shareNote':{
      const n=S.notes[d.id];
      if(!n)break;
      const id=S.db.collection('journal').doc().id;
      newDoc('j',id,{session:num(S.meta.session)||1,title:n.title||'',body:n.body||'',place:'',addedBy:S.me.id,createdAt:Date.now()});
      toast('Copied to the party log');
      render();break;}
    case 'loy':{
      const cur=S.gmLoy[d.pid]||{uid:d.uid,pid:d.pid};
      cur.loyalty=num(d.n);
      S.gmLoy[d.pid]=cur;
      save('gl',d.pid,{loyalty:cur.loyalty});
      render();break;}
    case 'sub':S.ui.sub=d.v;render();break;
    case 'export':exportBackup();break;
  }
}
async function exportBackup(){
  if(!S.dl)return;
  const me=S.me.id;
  const out={app:'Sinnoh Trainer Log',exportedAt:new Date().toISOString(),trainer:S.trainers[me]||null,pokemon:S.pokemon[me]||{},privateNotes:S.notes};
  if(S.me.admin)out.table={trainers:S.trainers,pokemon:S.pokemon,people:S.people,journal:S.journal,leads:S.leads,timeline:S.timeline,awards:S.awards,pins:S.pins,meta:S.meta,loyalty:S.gmLoy,npcSecrets:S.gmNpc,placePages:S.places,placeNotes:S.gmPl};
  try{await S.dl.save({filename:'sinnoh-trainer-log-backup.json',data:JSON.stringify(out,null,2)});}
  catch(e){if(!e||e.code!=='declined')toast('Could not offer the download');}
}

/* ---------- input wiring ---------- */
function onBound(t){
  const s=t.dataset.b;
  const i1=s.indexOf('|'),i2=s.indexOf('|',i1+1);
  const sc=s.slice(0,i1),id=s.slice(i1+1,i2),path=s.slice(i2+1);
  let v;
  if(t.type==='checkbox')v=t.checked;
  else if(t.type==='number'){
    v=t.value===''?null:Number(t.value);
    if(v!=null&&Number.isFinite(v)){
      const mx=t.dataset.max,mn=t.dataset.min;
      if(mx!==undefined&&v>+mx)v=+mx;
      if(mn!==undefined&&v<+mn)v=+mn;
    }else if(v!=null)v=null;
  }else v=t.value;
  edit(sc,id,path,v);
  if(sc==='t'&&path==='cls')edit('t',id,'adv','');
  if(!('nr' in t.dataset))render();
}
document.addEventListener('input',e=>{
  const t=e.target;
  if(!t||!t.dataset)return;
  if(t.dataset.pq!=null){S.ui.q.places=t.value;refreshPlaceList();return;}
  if(t.dataset.b!=null){onBound(t);return;}
  if(t.dataset.u!=null){
    const k=t.dataset.u.split('.');
    S.ui[k[0]][k[1]]=t.value;
    if(!('nr' in t.dataset))render();
  }
});
document.addEventListener('click',e=>{
  if(e.target.closest&&!e.target.closest('.hs,#ptip'))hideTip(true);
  const b=e.target.closest&&e.target.closest('[data-act]');
  if(!b||b.disabled)return;
  if(b.tagName==='A')e.preventDefault();
  act(b,e);
});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(!t||t.id!=='filepick')return;
  const f=t.files&&t.files[0];
  const pk=S.pick;
  try{t.value='';}catch(err){}
  if(!f||!pk)return;
  if(!/^image\//.test(f.type)){toast('That file is not a picture');return;}
  const parts=pk.spec.split('|');
  try{
    setStatus('busy');
    let late='';
    if(parts[0]==='map'){if(!(await uploadMap(f)))late='Map saved. Its shape does not match the Sinnoh map, so hover highlights are off.';}
    else{const r=await fileToImage(f,{w:pk.w,h:pk.h,cap:pk.cap});edit(parts[0],parts[1],parts[2],r.url);}
    if(!Q.size)setStatus('saved');
    render();
    if(late)toast(late);
  }catch(err){
    if(err&&err.code)fail(err);
    else toast(err&&err.message==='too big'?'That picture is too large even after shrinking. Try another one.':'Could not read that picture');
  }
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&tipId)hideTip(true);
  if(e.key==='Escape'&&S.ui.navOpen){S.ui.navOpen=false;render();const m=$('.menu-btn');if(m)m.focus({preventScroll:true});}
});

/* ---------- start ---------- */
async function boot(){
  const dl=$('#dl-places');
  if(dl)dl.innerHTML=PLACES.map(p=>'<option value="'+esc(p)+'">').join('');
  const t0=lsGet('stl.tab');
  if(t0&&PAGE_LABEL[t0]&&t0!=='place'&&(t0!=='account'||CFG))S.tab=t0;
  S.viewUid=lsGet('stl.view')||null;
  render();
  const got=await Promise.all([use('db'),use('user'),use('downloads')]);
  S.user=got[1];S.dl=got[2];
  if(!got[0]){S.noDb=true;S.ready=true;render();return;}
  S.db=got[0];
  try{
    if(S.user){
      S.me.id=await S.user.id();
      S.me.admin=await S.user.canEdit();
      const cw=await S.user.can('data.write');
      S.me.canWrite=(cw!==false)&&(S.me.id!=null||S.me.admin);
    }else S.me.canWrite=false;
  }catch(e){}
  startWatches();
  startRoom();
  render();
  setTimeout(markReady,6000);
}
boot();
})();
