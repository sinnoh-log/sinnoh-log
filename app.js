(function(){
'use strict';
const BUILD='2026-10-25 · A second wish list in the encounter tables';

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
const GENDERS=['Male','Female','Genderless'];
const genPill=g=>g==='Male'||g==='Female'?h`<span class="pill gen ${g.toLowerCase()}" title="${g}"><span aria-hidden="true">${g==='Male'?'♂':'♀'}</span> ${g}</span>`:g==='Genderless'?h`<span class="pill gen none">Genderless</span>`:'';
const BADGES=[
  ['coal','Coal','Roark'],['forest','Forest','Gardenia'],['cobble','Cobble','Maylene'],['fen','Fen','Crasher Wake'],
  ['relic','Relic','Fantina'],['mine','Mine','Byron'],['icicle','Icicle','Candice'],['beacon','Beacon','Marina']
];
const HONOR_TYPES=['Trial Medal','Frontier Symbol','Contest Ribbon','Certificate','Emblem of Recognition','Loyal Partner','Moment of Destiny','Other'];
const ATTITUDES=[['unknown','Unknown'],['friendly','Friendly'],['neutral','Neutral'],['wary','Wary'],['hostile','Hostile']];
const LEAD_STATES=[['open','Open'],['chasing','Chasing'],['resolved','Resolved'],['dead','Dead end']];
const LOY_WORDS=['Defiant','Distrustful','Obedient','Trusting','Devoted','Bonded'];
const DEF_META={campaign:'Sinnoh Trainer Log',subtitle:'Post-game Sinnoh · ten years after Team Galactic',gm:'',session:1,pinned:'',ribbonNeed:5,hpx:2};
const NAV=[
  ['Narrative',[['overview','Overview'],['journal','Journal'],['timeline','Timeline']]],
  ['World',[['people','People'],['leads','Leads'],['map','Map']]],
  ['Table',[['trainer','Trainer'],['pokemon','Pokémon'],['dex','Pokédex'],['battle','Battle'],['contest','Contests'],['shop','Shop']]]
];
const GM_NAV=['Game Master',[['gm','GM Desk'],['npc','NPC Trainers']]];
const PAGE_LABEL={overview:'Overview',journal:'Journal',timeline:'Timeline',people:'People',leads:'Leads',map:'Map',place:'Place',trainer:'Trainer sheet',pokemon:'Pokémon',dex:'Pokédex',battle:'Battle',contest:'Contests',shop:'Shop',gm:'GM Desk',npc:'NPC Trainers',account:'Account'};
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
  megaOk:{},battle:{},battleGm:{},trainers:{},pokemon:{},people:{},journal:{},leads:{},notes:{},meta:Object.assign({},DEF_META),gmLoy:{},gmNpc:{},gmNt:{},npcPub:{},shopPub:{},shopGm:{},
  awards:{},timeline:{},pins:{},banner:{},cond:{},places:{},gmPl:{},placeId:null,members:{},invite:null,mapChunks:{},mapSrc:'',room:null,peers:[],avatars:{},
  pick:null,names:{},save:{cls:'',text:'Saved'},rolls:[],_tsig:'',
  ui:{open:{},lbx:null,adv:'normal',q:{},f:{places:'all'},zoom:1,mapSub:'places',sub:'party',confirm:null,writeFail:false,rollHidden:false,toTop:false,pinMode:'',selPin:null,navOpen:false,inv:{code:null},acct:{name:null,msg:''},delT:{uid:null,text:''},pop:null,megaPop:null,
    award:{uids:{},type:'Gym Badge',badge:'coal',ribbon:null,title:'',note:'',levelUp:true}}
};

/* ---------- look: type colours, species list, sprites ---------- */
const TYPE_HEX={normal:'#A8A878',fire:'#F08030',water:'#6890F0',electric:'#F8D030',grass:'#78C850',ice:'#98D8D8',fighting:'#C03028',poison:'#A040A0',ground:'#E0C068',flying:'#A890F0',psychic:'#F85888',bug:'#A8B820',rock:'#B8A038',ghost:'#705898',dragon:'#7038F8',dark:'#705848',steel:'#B8B8D0',fairy:'#EE99AC'};
const DEXN="Bulbasaur|Ivysaur|Venusaur|Charmander|Charmeleon|Charizard|Squirtle|Wartortle|Blastoise|Caterpie|Metapod|Butterfree|Weedle|Kakuna|Beedrill|Pidgey|Pidgeotto|Pidgeot|Rattata|Raticate|Spearow|Fearow|Ekans|Arbok|Pikachu|Raichu|Sandshrew|Sandslash|Nidoran♀|Nidorina|Nidoqueen|Nidoran♂|Nidorino|Nidoking|Clefairy|Clefable|Vulpix|Ninetales|Jigglypuff|Wigglytuff|Zubat|Golbat|Oddish|Gloom|Vileplume|Paras|Parasect|Venonat|Venomoth|Diglett|Dugtrio|Meowth|Persian|Psyduck|Golduck|Mankey|Primeape|Growlithe|Arcanine|Poliwag|Poliwhirl|Poliwrath|Abra|Kadabra|Alakazam|Machop|Machoke|Machamp|Bellsprout|Weepinbell|Victreebel|Tentacool|Tentacruel|Geodude|Graveler|Golem|Ponyta|Rapidash|Slowpoke|Slowbro|Magnemite|Magneton|Farfetch'd|Doduo|Dodrio|Seel|Dewgong|Grimer|Muk|Shellder|Cloyster|Gastly|Haunter|Gengar|Onix|Drowzee|Hypno|Krabby|Kingler|Voltorb|Electrode|Exeggcute|Exeggutor|Cubone|Marowak|Hitmonlee|Hitmonchan|Lickitung|Koffing|Weezing|Rhyhorn|Rhydon|Chansey|Tangela|Kangaskhan|Horsea|Seadra|Goldeen|Seaking|Staryu|Starmie|Mr. Mime|Scyther|Jynx|Electabuzz|Magmar|Pinsir|Tauros|Magikarp|Gyarados|Lapras|Ditto|Eevee|Vaporeon|Jolteon|Flareon|Porygon|Omanyte|Omastar|Kabuto|Kabutops|Aerodactyl|Snorlax|Articuno|Zapdos|Moltres|Dratini|Dragonair|Dragonite|Mewtwo|Mew|Chikorita|Bayleef|Meganium|Cyndaquil|Quilava|Typhlosion|Totodile|Croconaw|Feraligatr|Sentret|Furret|Hoothoot|Noctowl|Ledyba|Ledian|Spinarak|Ariados|Crobat|Chinchou|Lanturn|Pichu|Cleffa|Igglybuff|Togepi|Togetic|Natu|Xatu|Mareep|Flaaffy|Ampharos|Bellossom|Marill|Azumarill|Sudowoodo|Politoed|Hoppip|Skiploom|Jumpluff|Aipom|Sunkern|Sunflora|Yanma|Wooper|Quagsire|Espeon|Umbreon|Murkrow|Slowking|Misdreavus|Unown|Wobbuffet|Girafarig|Pineco|Forretress|Dunsparce|Gligar|Steelix|Snubbull|Granbull|Qwilfish|Scizor|Shuckle|Heracross|Sneasel|Teddiursa|Ursaring|Slugma|Magcargo|Swinub|Piloswine|Corsola|Remoraid|Octillery|Delibird|Mantine|Skarmory|Houndour|Houndoom|Kingdra|Phanpy|Donphan|Porygon2|Stantler|Smeargle|Tyrogue|Hitmontop|Smoochum|Elekid|Magby|Miltank|Blissey|Raikou|Entei|Suicune|Larvitar|Pupitar|Tyranitar|Lugia|Ho-Oh|Celebi|Treecko|Grovyle|Sceptile|Torchic|Combusken|Blaziken|Mudkip|Marshtomp|Swampert|Poochyena|Mightyena|Zigzagoon|Linoone|Wurmple|Silcoon|Beautifly|Cascoon|Dustox|Lotad|Lombre|Ludicolo|Seedot|Nuzleaf|Shiftry|Taillow|Swellow|Wingull|Pelipper|Ralts|Kirlia|Gardevoir|Surskit|Masquerain|Shroomish|Breloom|Slakoth|Vigoroth|Slaking|Nincada|Ninjask|Shedinja|Whismur|Loudred|Exploud|Makuhita|Hariyama|Azurill|Nosepass|Skitty|Delcatty|Sableye|Mawile|Aron|Lairon|Aggron|Meditite|Medicham|Electrike|Manectric|Plusle|Minun|Volbeat|Illumise|Roselia|Gulpin|Swalot|Carvanha|Sharpedo|Wailmer|Wailord|Numel|Camerupt|Torkoal|Spoink|Grumpig|Spinda|Trapinch|Vibrava|Flygon|Cacnea|Cacturne|Swablu|Altaria|Zangoose|Seviper|Lunatone|Solrock|Barboach|Whiscash|Corphish|Crawdaunt|Baltoy|Claydol|Lileep|Cradily|Anorith|Armaldo|Feebas|Milotic|Castform|Kecleon|Shuppet|Banette|Duskull|Dusclops|Tropius|Chimecho|Absol|Wynaut|Snorunt|Glalie|Spheal|Sealeo|Walrein|Clamperl|Huntail|Gorebyss|Relicanth|Luvdisc|Bagon|Shelgon|Salamence|Beldum|Metang|Metagross|Regirock|Regice|Registeel|Latias|Latios|Kyogre|Groudon|Rayquaza|Jirachi|Deoxys|Turtwig|Grotle|Torterra|Chimchar|Monferno|Infernape|Piplup|Prinplup|Empoleon|Starly|Staravia|Staraptor|Bidoof|Bibarel|Kricketot|Kricketune|Shinx|Luxio|Luxray|Budew|Roserade|Cranidos|Rampardos|Shieldon|Bastiodon|Burmy|Wormadam|Mothim|Combee|Vespiquen|Pachirisu|Buizel|Floatzel|Cherubi|Cherrim|Shellos|Gastrodon|Ambipom|Drifloon|Drifblim|Buneary|Lopunny|Mismagius|Honchkrow|Glameow|Purugly|Chingling|Stunky|Skuntank|Bronzor|Bronzong|Bonsly|Mime Jr.|Happiny|Chatot|Spiritomb|Gible|Gabite|Garchomp|Munchlax|Riolu|Lucario|Hippopotas|Hippowdon|Skorupi|Drapion|Croagunk|Toxicroak|Carnivine|Finneon|Lumineon|Mantyke|Snover|Abomasnow|Weavile|Magnezone|Lickilicky|Rhyperior|Tangrowth|Electivire|Magmortar|Togekiss|Yanmega|Leafeon|Glaceon|Gliscor|Mamoswine|Porygon-Z|Gallade|Probopass|Dusknoir|Froslass|Rotom|Uxie|Mesprit|Azelf|Dialga|Palkia|Heatran|Regigigas|Giratina|Cresselia|Phione|Manaphy|Darkrai|Shaymin|Arceus|Victini|Snivy|Servine|Serperior|Tepig|Pignite|Emboar|Oshawott|Dewott|Samurott|Patrat|Watchog|Lillipup|Herdier|Stoutland|Purrloin|Liepard|Pansage|Simisage|Pansear|Simisear|Panpour|Simipour|Munna|Musharna|Pidove|Tranquill|Unfezant|Blitzle|Zebstrika|Roggenrola|Boldore|Gigalith|Woobat|Swoobat|Drilbur|Excadrill|Audino|Timburr|Gurdurr|Conkeldurr|Tympole|Palpitoad|Seismitoad|Throh|Sawk|Sewaddle|Swadloon|Leavanny|Venipede|Whirlipede|Scolipede|Cottonee|Whimsicott|Petilil|Lilligant|Basculin|Sandile|Krokorok|Krookodile|Darumaka|Darmanitan|Maractus|Dwebble|Crustle|Scraggy|Scrafty|Sigilyph|Yamask|Cofagrigus|Tirtouga|Carracosta|Archen|Archeops|Trubbish|Garbodor|Zorua|Zoroark|Minccino|Cinccino|Gothita|Gothorita|Gothitelle|Solosis|Duosion|Reuniclus|Ducklett|Swanna|Vanillite|Vanillish|Vanilluxe|Deerling|Sawsbuck|Emolga|Karrablast|Escavalier|Foongus|Amoonguss|Frillish|Jellicent|Alomomola|Joltik|Galvantula|Ferroseed|Ferrothorn|Klink|Klang|Klinklang|Tynamo|Eelektrik|Eelektross|Elgyem|Beheeyem|Litwick|Lampent|Chandelure|Axew|Fraxure|Haxorus|Cubchoo|Beartic|Cryogonal|Shelmet|Accelgor|Stunfisk|Mienfoo|Mienshao|Druddigon|Golett|Golurk|Pawniard|Bisharp|Bouffalant|Rufflet|Braviary|Vullaby|Mandibuzz|Heatmor|Durant|Deino|Zweilous|Hydreigon|Larvesta|Volcarona|Cobalion|Terrakion|Virizion|Tornadus|Thundurus|Reshiram|Zekrom|Landorus|Kyurem|Keldeo|Meloetta|Genesect|Chespin|Quilladin|Chesnaught|Fennekin|Braixen|Delphox|Froakie|Frogadier|Greninja|Bunnelby|Diggersby|Fletchling|Fletchinder|Talonflame|Scatterbug|Spewpa|Vivillon|Litleo|Pyroar|Flabébé|Floette|Florges|Skiddo|Gogoat|Pancham|Pangoro|Furfrou|Espurr|Meowstic|Honedge|Doublade|Aegislash|Spritzee|Aromatisse|Swirlix|Slurpuff|Inkay|Malamar|Binacle|Barbaracle|Skrelp|Dragalge|Clauncher|Clawitzer|Helioptile|Heliolisk|Tyrunt|Tyrantrum|Amaura|Aurorus|Sylveon|Hawlucha|Dedenne|Carbink|Goomy|Sliggoo|Goodra|Klefki|Phantump|Trevenant|Pumpkaboo|Gourgeist|Bergmite|Avalugg|Noibat|Noivern|Xerneas|Yveltal|Zygarde|Diancie|Hoopa|Volcanion|Rowlet|Dartrix|Decidueye|Litten|Torracat|Incineroar|Popplio|Brionne|Primarina|Pikipek|Trumbeak|Toucannon|Yungoos|Gumshoos|Grubbin|Charjabug|Vikavolt|Crabrawler|Crabominable|Oricorio|Cutiefly|Ribombee|Rockruff|Lycanroc|Wishiwashi|Mareanie|Toxapex|Mudbray|Mudsdale|Dewpider|Araquanid|Fomantis|Lurantis|Morelull|Shiinotic|Salandit|Salazzle|Stufful|Bewear|Bounsweet|Steenee|Tsareena|Comfey|Oranguru|Passimian|Wimpod|Golisopod|Sandygast|Palossand|Pyukumuku|Type: Null|Silvally|Minior|Komala|Turtonator|Togedemaru|Mimikyu|Bruxish|Drampa|Dhelmise|Jangmo-o|Hakamo-o|Kommo-o|Tapu Koko|Tapu Lele|Tapu Bulu|Tapu Fini|Cosmog|Cosmoem|Solgaleo|Lunala|Nihilego|Buzzwole|Pheromosa|Xurkitree|Celesteela|Kartana|Guzzlord|Necrozma|Magearna|Marshadow|Poipole|Naganadel|Stakataka|Blacephalon|Zeraora|Meltan|Melmetal|Grookey|Thwackey|Rillaboom|Scorbunny|Raboot|Cinderace|Sobble|Drizzile|Inteleon|Skwovet|Greedent|Rookidee|Corvisquire|Corviknight|Blipbug|Dottler|Orbeetle|Nickit|Thievul|Gossifleur|Eldegoss|Wooloo|Dubwool|Chewtle|Drednaw|Yamper|Boltund|Rolycoly|Carkol|Coalossal|Applin|Flapple|Appletun|Silicobra|Sandaconda|Cramorant|Arrokuda|Barraskewda|Toxel|Toxtricity|Sizzlipede|Centiskorch|Clobbopus|Grapploct|Sinistea|Polteageist|Hatenna|Hattrem|Hatterene|Impidimp|Morgrem|Grimmsnarl|Obstagoon|Perrserker|Cursola|Sirfetch'd|Mr. Rime|Runerigus|Milcery|Alcremie|Falinks|Pincurchin|Snom|Frosmoth|Stonjourner|Eiscue|Indeedee|Morpeko|Cufant|Copperajah|Dracozolt|Arctozolt|Dracovish|Arctovish|Duraludon|Dreepy|Drakloak|Dragapult|Zacian|Zamazenta|Eternatus|Kubfu|Urshifu|Zarude|Regieleki|Regidrago|Glastrier|Spectrier|Calyrex|Wyrdeer|Kleavor|Ursaluna|Basculegion|Sneasler|Overqwil|Enamorus|Sprigatito|Floragato|Meowscarada|Fuecoco|Crocalor|Skeledirge|Quaxly|Quaxwell|Quaquaval|Lechonk|Oinkologne|Tarountula|Spidops|Nymble|Lokix|Pawmi|Pawmo|Pawmot|Tandemaus|Maushold|Fidough|Dachsbun|Smoliv|Dolliv|Arboliva|Squawkabilly|Nacli|Naclstack|Garganacl|Charcadet|Armarouge|Ceruledge|Tadbulb|Bellibolt|Wattrel|Kilowattrel|Maschiff|Mabosstiff|Shroodle|Grafaiai|Bramblin|Brambleghast|Toedscool|Toedscruel|Klawf|Capsakid|Scovillain|Rellor|Rabsca|Flittle|Espathra|Tinkatink|Tinkatuff|Tinkaton|Wiglett|Wugtrio|Bombirdier|Finizen|Palafin|Varoom|Revavroom|Cyclizar|Orthworm|Glimmet|Glimmora|Greavard|Houndstone|Flamigo|Cetoddle|Cetitan|Veluza|Dondozo|Tatsugiri|Annihilape|Clodsire|Farigiraf|Dudunsparce|Kingambit|Great Tusk|Scream Tail|Brute Bonnet|Flutter Mane|Slither Wing|Sandy Shocks|Iron Treads|Iron Bundle|Iron Hands|Iron Jugulis|Iron Moth|Iron Thorns|Frigibax|Arctibax|Baxcalibur|Gimmighoul|Gholdengo|Wo-Chien|Chien-Pao|Ting-Lu|Chi-Yu|Roaring Moon|Iron Valiant|Koraidon|Miraidon|Walking Wake|Iron Leaves|Dipplin|Poltchageist|Sinistcha|Okidogi|Munkidori|Fezandipiti|Ogerpon|Archaludon|Hydrapple|Gouging Fire|Raging Bolt|Iron Boulder|Iron Crown|Terapagos|Pecharunt";
const dexKey=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/♀/g,'f').replace(/♂/g,'m').replace(/[^a-z0-9]/g,'');
const DEXMAP=(()=>{const m=new Map();DEXN.split('|').forEach((n,i)=>m.set(dexKey(n),i+1));return m;})();
/* "Pikachu", "alolan raichu" and "Shiny Lucario" all find a species; anything else gets no sprite */
function dexId(sp){
  const full=dexKey(sp);
  if(!full)return 0;
  if(DEXMAP.has(full))return DEXMAP.get(full);
  const words=String(sp).split(/[^A-Za-z0-9À-ɏ]+/).filter(Boolean);
  for(let i=words.length-1;i>=0;i--){const k=dexKey(words[i]);if(DEXMAP.has(k))return DEXMAP.get(k);}
  return 0;
}
const SPR_BASE='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
const SPR_BAD=new Set();
function spriteSrcs(id,shiny){
  const l=[];
  if(shiny){
    if(id>0&&id<=493)l.push(SPR_BASE+'versions/generation-iv/platinum/shiny/'+id+'.png');
    if(id>0)l.push(SPR_BASE+'shiny/'+id+'.png');
  }
  if(id>0&&id<=493)l.push(SPR_BASE+'versions/generation-iv/platinum/'+id+'.png');
  if(id>0)l.push(SPR_BASE+id+'.png');
  return l.filter(u=>!SPR_BAD.has(u));
}
/* ---------- look: bag items ---------- */
const ITEMSL="ability-capsule|ability-urge|abomasite|absolite|absorb-bulb|acro-bike|adamant-orb|adrenaline-orb|adventure-rules|aerodactylite|aggronite|aguav-berry|air-balloon|air-mail|alakazite|altarianite|amaze-mulch|ampharosite|amulet-coin|antidote|apicot-berry|apricorn-box|aqua-suit|armor-fossil|aspear-berry|assault-vest|audinite|auroraticket|awakening|azure-flute|babiri-berry|balm-mushroom|banettite|basement-key|bead-mail|beast-ball|beedrillite|belue-berry|berry-juice|berry-pots|berry-pouch|bicycle|big-malasada|big-mushroom|big-nugget|big-pearl|big-root|bike-voucher|binding-band|black-apricorn|black-belt|black-flute|black-glasses|black-sludge|blastoisinite|blazikenite|bloom-mail|blue-apricorn|blue-card|blue-flute|blue-orb|blue-petal|blue-scarf|blue-shard|bluk-berry|boost-mulch|bottle-cap|brick-mail|bridge-mail-d|bridge-mail-m|bridge-mail-s|bridge-mail-t|bridge-mail-v|bright-powder|bubble-mail|bug-gem|bug-memory|burn-drive|burn-heal|calcium|cameruptite|carbos|card-key|casteliacone|cell-battery|charcoal|charizardite-x|charizardite-y|charti-berry|cheri-berry|cherish-ball|chesto-berry|chilan-berry|chill-drive|choice-band|choice-scarf|choice-specs|chople-berry|claw-fossil|cleanse-tag|clear-bell|clever-wing|coba-berry|coin-case|colbur-berry|colress-machine|comet-shard|common-stone|contest-pass|cornn-berry|coupon-1|coupon-2|coupon-3|cover-fossil|custap-berry|damp-mulch|damp-rock|dark-gem|dark-memory|dark-stone|data-card-01|data-card-02|data-card-03|data-card-04|data-card-05|data-card-06|data-card-07|data-card-08|data-card-09|data-card-10|data-card-11|data-card-12|data-card-13|data-card-14|data-card-15|data-card-16|data-card-17|data-card-18|data-card-19|data-card-20|data-card-21|data-card-22|data-card-23|data-card-24|data-card-25|data-card-26|data-card-27|dawn-stone|deep-sea-scale|deep-sea-tooth|destiny-knot|devon-goods|devon-parts|devon-scope|devon-scuba-gear|diancite|dire-hit|dire-hit-2|dire-hit-3|discount-coupon|dive-ball|dna-splicers|dome-fossil|douse-drive|dowsing-machine|draco-plate|dragon-fang|dragon-gem|dragon-memory|dragon-scale|dragon-skull|dread-plate|dream-ball|dream-mail|dropped-item|dubious-disc|durin-berry|dusk-ball|dusk-stone|earth-plate|eject-button|electirizer|electric-gem|electric-memory|electric-seed|elevator-key|elixir|energy-powder|energy-root|enigma-berry|enigma-stone|enigmatic-card|eon-flute|eon-ticket|escape-rope|ether|everstone|eviolite|exp-share|expert-belt|explorer-kit|fab-mail|fairy-gem|fairy-memory|fame-checker|fashion-case|fast-ball|favored-mail|festival-ticket|fighting-gem|fighting-memory|figy-berry|fire-gem|fire-memory|fire-stone|fishing-rod|fist-plate|flame-mail|flame-orb|flame-plate|float-stone|fluffy-tail|flying-gem|flying-memory|focus-band|focus-sash|forage-bag|fresh-water|friend-ball|full-heal|full-incense|full-restore|galactic-key|galladite|ganlon-berry|garchompite|gardevoirite|gb-sounds|gengarite|genius-wing|ghost-gem|ghost-memory|glalitite|glitter-mail|go-goggles|god-stone|gold-bottle-cap|gold-teeth|good-rod|gooey-mulch|gracidea|gram-1|gram-2|gram-3|grass-gem|grass-mail|grass-memory|grassy-seed|great-ball|green-apricorn|green-petal|green-scarf|green-shard|greet-mail|grepa-berry|grip-claw|griseous-orb|ground-gem|ground-memory|growth-mulch|grubby-hanky|guard-spec|gyaradosite|haban-berry|harbor-mail|hard-stone|heal-ball|heal-powder|health-wing|heart-mail|heart-scale|heat-rock|heavy-ball|helix-fossil|heracronite|hm01|hm02|hm03|hm04|hm05|hm06|hm07|holo-caster|hondew-berry|honey|honor-of-kalos|houndoominite|hp-up|hyper-potion|iapapa-berry|ice-gem|ice-heal|ice-memory|ice-stone|icicle-plate|icy-rock|ilimas-normalium-z|inquiry-mail|insect-plate|intriguing-stone|iron|iron-ball|iron-plate|item-drop|item-urge|jaboca-berry|jade-orb|jaw-fossil|journal|kangaskhanite|kasib-berry|kebia-berry|kee-berry|kelpsy-berry|key-stone|key-to-room-1|key-to-room-2|key-to-room-4|key-to-room-6|kings-rock|lafeather-ball|lagging-tail|lagigaton-ball|lagreat-ball|laheavy-ball|lajet-ball|laleaden-ball|lansat-berry|laorigin-ball|lapoke-ball|lastrange-ball|latiasite|latiosite|laultra-ball|lava-cookie|lawing-ball|lax-incense|leaf-stone|left-poke-ball|leftovers|lemonade|lens-case|leppa-berry|letter|level-ball|liberty-pass|liechi-berry|life-orb|lift-key|light-ball|light-clay|light-stone|like-mail|lock-capsule|looker-ticket|loot-sack|lopunnite|lost-item|love-ball|lucarionite|luck-incense|lucky-egg|lucky-punch|lum-berry|luminous-moss|lumiose-galette|lunar-wing|lure-ball|lustrous-orb|luxury-ball|mach-bike|machine-part|macho-brace|magma-emblem|magma-stone|magma-suit|magmarizer|magnet|mago-berry|magost-berry|makeup-bag|manectite|maranga-berry|master-ball|mawilite|max-elixir|max-ether|max-potion|max-repel|max-revive|meadow-plate|mech-mail|medal-box|medichamite|mega-anchor|mega-anklet|mega-bracelet|mega-charm|mega-cuff|mega-glasses|mega-glove|mega-pendant|mega-ring|mega-stickpin|mega-tiara|member-card|mental-herb|metagrossite|metal-coat|metal-powder|meteorite|meteorite-shard|metronome|mewtwonite-x|mewtwonite-y|micle-berry|mind-plate|miracle-seed|misty-seed|moomoo-milk|moon-ball|moon-flute|moon-stone|mosaic-mail|muscle-band|muscle-wing|mystery-egg|mystic-water|mysticticket|nanab-berry|nest-ball|net-ball|never-melt-ice|nomel-berry|normal-gem|nugget|oaks-letter|oaks-parcel|occa-berry|odd-incense|odd-keystone|old-amber|old-charm|old-gateau|old-rod|old-sea-map|oran-berry|orange-mail|orange-petal|oval-charm|oval-stone|pair-of-tickets|pal-pad|pamtre-berry|paralyze-heal|parcel|park-ball|pass|pass-orb|passho-berry|payapa-berry|pearl|pearl-string|pecha-berry|permit|persim-berry|petaya-berry|photo-album|pidgeotite|pinap-berry|pink-apricorn|pink-nectar|pink-petal|pink-scarf|pinsirite|pixie-plate|plasma-card|plume-fossil|poffin-case|point-card|poison-barb|poison-gem|poison-memory|poke-ball|poke-doll|poke-flute|poke-radar|poke-toy|pokeblock-case|pokeblock-kit|pomeg-berry|potion|powder-jar|power-anklet|power-band|power-belt|power-bracer|power-herb|power-lens|power-plant-pass|power-weight|pp-max|pp-up|premier-ball|pretty-wing|prism-scale|prison-bottle|professors-mask|profs-letter|prop-case|protective-pads|protector|protein|psychic-gem|psychic-memory|psychic-seed|pure-incense|purple-nectar|purple-petal|qualot-berry|quick-ball|quick-claw|quick-powder|rabuta-berry|rage-candy-bar|rainbow-flower|rainbow-pass|rainbow-wing|rare-bone|rare-candy|rawst-berry|razor-claw|razor-fang|razz-berry|reaper-cloth|red-apricorn|red-card|red-chain|red-flute|red-nectar|red-orb|red-petal|red-scale|red-scarf|red-shard|relic-band|relic-copper|relic-crown|relic-gold|relic-silver|relic-statue|relic-vase|repeat-ball|repel|reply-mail|reset-urge|resist-wing|retro-mail|reveal-glass|revival-herb|revive|rich-mulch|ride-pager|rindo-berry|ring-target|rm-1-key|rm-2-key|rm-4-key|rm-6-key|rock-gem|rock-incense|rock-memory|rocky-helmet|roller-skates|root-fossil|rose-incense|roseli-berry|roto-bargain|roto-boost|roto-catch|roto-encounter|roto-exp-points|roto-friendship|roto-hatch|roto-hp-restore|roto-pp-restore|roto-prize-money|roto-stealth|rowap-berry|rsvp-mail|ruby|rule-book|sablenite|sachet|sacred-ash|safari-ball|safety-goggles|sail-fossil|salac-berry|salamencite|sapphire|scanner|sceptilite|scizorite|scope-lens|sea-incense|seal-bag|seal-case|secret-key|secret-potion|shadow-mail|shalour-sable|sharp-beak|sharpedonite|shed-shell|shell-bell|shiny-charm|shiny-stone|shoal-salt|shoal-shell|shock-drive|shuca-berry|silk-scarf|silph-scope|silver-powder|silver-wing|sitrus-berry|skull-fossil|sky-plate|slowbronite|slowpoke-tail|smoke-ball|smooth-rock|snow-mail|snowball|soda-pop|soft-sand|soot-sack|soothe-bell|soul-dew|space-mail|sparkling-stone|spell-tag|spelon-berry|splash-plate|spooky-plate|sport-ball|sprayduck|sprinklotad|squirt-bottle|ss-ticket|stable-mulch|star-piece|stardust|starf-berry|steel-gem|steel-mail|steel-memory|steelixite|stick|sticky-barb|stone-plate|storage-key|strange-souvenir|suite-key|sun-flute|sun-stone|super-potion|super-repel|super-rod|surge-badge|surprise-mulch|swampertite|sweet-heart|swift-wing|tamato-berry|tanga-berry|tea|teachy-tv|terrain-extender|thanks-mail|thick-club|thunder-stone|tidal-bell|timer-ball|tiny-mushroom|tm-case|tmv-pass|town-map|toxic-orb|toxic-plate|travel-trunk|tri-pass|tropic-mail|tunnel-mail|twisted-spoon|tyranitarite|ultra-ball|unown-report|up-grade|venusaurite|vs-recorder|vs-seeker|wacan-berry|wailmer-pail|water-gem|water-memory|water-stone|watmel-berry|wave-incense|wave-mail|weakness-policy|wepear-berry|whipped-dream|white-apricorn|white-flute|white-herb|wide-lens|wiki-berry|wise-glasses|wood-mail|works-key|x-accuracy|x-accuracy-2|x-accuracy-3|x-accuracy-6|x-attack|x-attack-2|x-attack-3|x-attack-6|x-defense|x-defense-2|x-defense-3|x-defense-6|x-sp-atk|x-sp-atk-2|x-sp-atk-3|x-sp-atk-6|x-sp-def|x-sp-def-2|x-sp-def-3|x-sp-def-6|x-speed|x-speed-2|x-speed-3|x-speed-6|xtransceiver|yache-berry|yellow-apricorn|yellow-flute|yellow-nectar|yellow-petal|yellow-scarf|yellow-shard|z-power-ring|z-ring|zap-plate|zinc|zoom-lens|zygarde-cube";
const ITEM_BASE='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';
const ITEMMAP=(()=>{const m=new Map();ITEMSL.split('|').forEach(s=>m.set(dexKey(s),s));return m;})();
/* "Poké Ball", "great balls", "Oran" and "Mega Bracelet" all find an icon; anything else gets none */
function itemSlug(name){
  const k=dexKey(name);
  if(!k)return '';
  const tries=[k];
  if(k.slice(-3)==='ies')tries.push(k.slice(0,-3)+'y');
  if(k.slice(-2)==='es')tries.push(k.slice(0,-2));
  if(k.slice(-1)==='s')tries.push(k.slice(0,-1));
  tries.push(k+'berry');
  for(let i=0;i<tries.length;i++)if(ITEMMAP.has(tries[i]))return ITEMMAP.get(tries[i]);
  return '';
}
const ITEM_CAPS={pp:'PP',hp:'HP',tm:'TM',hm:'HM',tr:'TR',x:'X',z:'Z',xl:'XL'};
const BALLS=ITEMSL.split('|').filter(s=>/-ball$/.test(s)&&!/^(la|left)/.test(s));
const itemLabel=slug=>slug.split('-').map(w=>w==='poke'?'Poké':(ITEM_CAPS[w]||w.charAt(0).toUpperCase()+w.slice(1))).join(' ');
/* ---------- species info: types and base stats for all 1025 species, plus every official Mega form. Generated by gen_dex.js from @pkmn/dex. ---------- */
const DEXD="4.7.49.49.65.65.45|4.7.62.63.80.80.60|4.7.82.83.100.100.80|1..52.43.60.50.65|1..64.58.80.65.80|1.9.84.78.109.85.100|2..48.65.50.64.43|2..63.80.65.80.58|2..83.100.85.105.78|11..30.35.20.20.45|11..20.55.25.25.30|11.9.45.50.90.80.70|11.7.35.30.20.20.50|11.7.25.50.25.25.35|11.7.90.40.45.80.75|0.9.45.40.35.35.56|0.9.60.55.50.50.71|0.9.80.75.70.70.101|0..56.35.25.35.72|0..81.60.50.70.97|0.9.60.30.31.31.70|0.9.90.65.61.61.100|7..60.44.40.54.55|7..95.69.65.79.80|3..55.40.50.50.90|3..90.55.90.80.110|8..75.85.20.30.40|8..100.110.45.55.65|7..47.52.40.40.41|7..62.67.55.55.56|7.8.92.87.75.85.76|7..57.40.40.40.50|7..72.57.55.55.65|7.8.102.77.85.75.85|17..45.48.60.65.35|17..70.73.95.90.60|1..41.40.50.65.65|1..76.75.81.100.100|0.17.45.20.45.25.20|0.17.70.45.85.50.45|7.9.45.35.30.40.55|7.9.80.70.65.75.90|4.7.50.55.75.65.30|4.7.65.70.85.75.40|4.7.80.85.110.90.50|11.4.70.55.45.55.25|11.4.95.80.60.80.30|11.7.55.50.40.55.45|11.7.65.60.90.75.90|8..55.25.35.45.95|8..100.50.50.70.120|0..45.35.40.40.90|0..70.60.65.65.115|2..52.48.65.50.55|2..82.78.95.80.85|6..80.35.35.45.70|6..105.60.60.70.95|1..70.45.70.50.60|1..110.80.100.80.95|2..50.40.40.40.90|2..65.65.50.50.90|2.6.95.95.70.90.70|10..20.15.105.55.90|10..35.30.120.70.105|10..50.45.135.95.120|6..80.50.35.35.35|6..100.70.50.60.45|6..130.80.65.85.55|4.7.75.35.70.30.40|4.7.90.50.85.45.55|4.7.105.65.100.70.70|2.7.40.35.50.100.70|2.7.70.65.80.120.100|12.8.80.100.30.30.20|12.8.95.115.45.45.35|12.8.120.130.55.65.45|1..85.55.65.65.90|1..100.70.80.80.105|2.10.65.65.40.40.15|2.10.75.110.100.80.30|3.16.35.70.95.55.45|3.16.60.95.120.70.70|0.9.90.55.58.62.60|0.9.85.45.35.35.75|0.9.110.70.60.60.110|2..45.55.45.70.45|2.5.70.80.70.95.70|7..80.50.40.50.25|7..105.75.65.100.50|2..65.100.45.25.40|2.5.95.180.85.45.70|13.7.35.30.100.35.80|13.7.50.45.115.55.95|13.7.65.60.130.75.110|12.8.45.160.30.45.70|10..48.45.43.90.42|10..73.70.73.115.67|2..105.90.25.25.50|2..130.115.50.50.75|3..30.50.55.55.100|3..50.70.80.80.150|4.10.40.80.60.45.40|4.10.95.85.125.75.55|8..50.95.40.50.35|8..80.110.50.80.45|6..120.53.35.110.87|6..105.79.35.110.76|0..55.75.60.75.30|7..65.95.60.45.35|7..90.120.85.70.60|8.12.85.95.30.30.25|8.12.130.120.45.45.40|0..5.5.35.105.50|4..55.115.100.40.60|0..95.80.40.80.90|2..40.70.70.25.60|2..65.95.95.45.85|2..67.60.35.50.63|2..92.65.65.80.68|2..45.55.70.55.85|2.10.75.85.100.85.115|10.17.45.65.100.120.90|11.9.110.80.55.80.105|5.10.50.35.115.95.95|3..83.57.95.85.105|1..95.57.100.85.93|11..125.100.55.70.85|0..100.95.40.70.110|2..10.55.15.20.80|2.9.125.79.60.100.81|2.5.85.80.85.95.60|0..48.48.48.48.48|0..55.50.45.65.55|2..65.60.110.95.65|3..65.60.110.95.130|1..130.60.95.110.65|0..60.70.85.75.40|12.2.40.100.90.55.35|12.2.60.125.115.70.55|12.2.80.90.55.45.55|12.2.115.105.65.70.80|12.9.105.65.60.75.130|0..110.65.65.110.30|5.9.85.100.95.125.85|3.9.90.85.125.90.100|1.9.100.90.125.85.90|14..64.45.50.50.50|14..84.65.70.70.70|14.9.134.95.100.100.80|10..110.90.154.90.130|10..100.100.100.100.100|4..49.65.49.65.45|4..62.80.63.80.60|4..82.100.83.100.80|1..52.43.60.50.65|1..64.58.80.65.80|1..84.78.109.85.100|2..65.64.44.48.43|2..80.80.59.63.58|2..105.100.79.83.78|0..46.34.35.45.20|0..76.64.45.55.90|0.9.30.30.36.56.50|0.9.50.50.86.96.70|11.9.20.30.40.80.55|11.9.35.50.55.110.85|11.7.60.40.40.40.30|11.7.90.70.60.70.40|7.9.90.80.70.80.130|2.3.38.38.56.56.67|2.3.58.58.76.76.67|3..40.15.35.35.60|17..25.28.45.55.15|0.17.30.15.40.20.15|17..20.65.40.65.20|17.9.40.85.80.105.40|10.9.50.45.70.45.70|10.9.75.70.95.70.95|3..40.40.65.45.35|3..55.55.80.60.45|3..75.85.115.90.55|4..80.95.90.100.50|2.17.20.50.20.50.40|2.17.50.80.60.80.50|12..100.115.30.65.30|2..75.75.90.100.70|4.9.35.40.35.55.50|4.9.45.50.45.65.80|4.9.55.70.55.95.110|0..70.55.40.55.85|4..30.30.30.30.30|4..75.55.105.85.30|11.9.65.45.75.45.95|2.8.45.45.25.25.15|2.8.85.85.65.65.35|10..65.60.130.95.110|15..65.110.60.130.65|15.9.85.42.85.42.91|2.10.75.80.100.110.30|13..60.60.85.85.85|10..72.48.72.48.48|10..33.58.33.58.33|0.10.80.65.90.65.85|11..65.90.35.35.15|11.16.90.140.60.60.40|0..70.70.65.65.45|8.9.75.105.35.65.85|16.8.85.200.55.65.30|17..80.50.40.40.30|17..120.75.60.60.45|2.7.95.85.55.55.85|11.16.130.100.55.80.65|11.12.10.230.10.230.5|11.6.125.75.40.95.85|15.5.95.55.35.75.115|0..80.50.50.50.40|0..130.75.75.75.55|1..40.40.70.40.20|1.12.50.120.90.80.30|5.8.50.40.30.30.50|5.8.100.80.60.60.50|2.12.55.95.65.95.35|2..65.35.65.35.65|2..105.75.105.75.45|5.9.55.45.65.45.75|2.9.40.70.80.140.70|16.9.80.140.40.70.70|15.1.60.30.80.50.65|15.1.90.50.110.80.95|2.14.95.95.95.95.85|8..60.60.40.40.40|8..120.120.60.60.50|0..80.90.105.95.60|0..95.62.85.65.85|0..20.35.20.45.75|6..35.35.35.35.35|6..95.95.35.110.70|5.10.30.15.85.65.65|3..63.37.65.55.95|1..75.37.70.55.83|0..80.105.40.70.100|0..10.10.75.135.55|3..85.75.115.100.115|1..115.85.90.75.100|2..75.115.90.115.85|12.8.64.50.45.50.41|12.8.84.70.65.70.51|12.15.134.110.95.100.61|10.9.90.130.90.154.110|1.9.130.90.110.154.90|10.4.100.100.100.100.100|4..45.35.65.55.70|4..65.45.85.65.95|4..85.65.105.85.120|1..60.40.70.50.45|1.6.85.60.85.60.55|1.6.120.70.110.70.80|2..70.50.50.50.40|2.8.85.70.60.70.50|2.8.110.90.85.90.60|15..55.35.30.30.35|15..90.70.60.60.70|0..30.41.30.41.60|0..70.61.50.61.100|11..45.35.20.30.20|11..35.55.25.25.15|11.9.70.50.100.50.65|11..35.55.25.25.15|11.7.50.70.50.90.65|2.4.30.30.40.50.30|2.4.50.50.60.70.50|2.4.70.70.90.100.70|4..40.50.30.30.30|4.15.70.40.60.40.60|4.15.100.60.90.60.80|0.9.55.30.30.30.85|0.9.85.60.75.50.125|2.9.30.30.55.30.85|2.9.50.100.95.70.65|10.17.25.25.45.35.40|10.17.35.35.65.55.50|10.17.65.65.125.115.80|11.2.30.32.50.52.65|11.9.60.62.100.82.80|4..40.60.40.60.35|4.6.130.80.60.60.70|0..60.60.35.35.30|0..80.80.55.55.90|0..160.100.95.65.100|11.8.45.90.30.30.40|11.9.90.45.50.50.160|11.13.90.45.30.30.40|0..51.23.51.23.28|0..71.43.71.43.48|0..91.63.91.73.68|6..60.30.20.30.25|6..120.60.40.60.50|0.17.20.40.20.40.20|12..45.135.45.90.30|0..45.45.35.35.50|0..65.65.55.55.90|15.13.75.75.65.65.50|16.17.85.85.55.55.50|16.12.70.100.40.40.30|16.12.90.140.50.50.40|16.12.110.180.60.60.50|6.10.40.55.40.55.60|6.10.60.75.60.75.80|3..45.40.65.40.65|3..75.60.105.60.105|3..50.40.85.75.95|3..40.50.75.85.95|11..73.75.47.85.85|11..47.75.73.85.85|4.7.60.45.100.80.65|7..43.53.43.53.40|7..73.83.73.83.55|2.15.90.20.65.20.65|2.15.120.40.95.40.95|2..70.35.70.35.60|2..90.45.90.45.60|1.8.60.40.65.45.35|1.8.100.70.105.75.40|1..85.140.85.70.20|10..25.35.70.80.60|10..45.65.90.110.80|0..60.60.60.60.60|8..100.45.45.45.10|8.14.70.50.50.50.70|8.14.100.80.80.80.100|4..85.40.85.40.35|4.15.115.60.115.60.55|0.9.40.60.40.75.50|14.9.70.90.70.105.80|0..115.60.60.60.90|7..100.60.100.60.65|12.10.55.65.95.85.70|12.10.95.85.55.65.70|2.8.48.43.46.41.60|2.8.78.73.76.71.60|2..80.65.50.35.35|2.15.120.85.90.55.55|8.10.40.55.40.70.55|8.10.70.105.70.120.75|12.4.41.77.61.87.23|12.4.81.97.81.107.43|12.11.95.50.40.50.75|12.11.125.100.70.80.45|2..15.20.10.55.80|2..60.79.100.125.81|0..70.70.70.70.70|0..90.70.60.120.40|13..75.35.63.33.45|13..115.65.83.63.65|13..40.90.30.90.25|13..70.130.60.130.25|4.9.68.83.72.87.51|10..50.80.95.90.65|15..130.60.75.60.75|10..23.48.23.48.23|5..50.50.50.50.50|5..80.80.80.80.80|5.2.40.50.55.50.25|5.2.60.70.75.70.45|5.2.80.90.95.90.65|2..64.85.74.55.32|2..104.105.94.75.52|2..84.105.114.75.52|2.12.90.130.45.65.55|2..30.55.40.65.97|14..75.60.40.30.50|14..95.100.60.50.50|14.9.135.80.110.80.100|16.10.55.80.35.60.30|16.10.75.100.55.80.50|16.10.135.130.95.90.70|12..100.200.50.100.50|5..50.100.100.200.50|16..75.150.75.150.50|14.10.80.90.110.130.110|14.10.90.80.130.110.110|2..100.90.150.140.90|8..150.140.100.90.90|14.9.150.90.150.90.95|16.10.100.100.100.100.100|10..150.50.150.50.150|4..68.64.45.55.31|4..89.85.55.65.36|4.8.109.105.75.85.56|1..58.44.58.44.61|1.6.78.52.78.52.81|1.6.104.71.104.71.108|2..51.53.61.56.40|2..66.68.81.76.50|2.16.86.88.111.101.60|0.9.55.30.30.30.60|0.9.75.50.40.40.80|0.9.120.70.50.60.100|0..45.40.35.40.31|0.2.85.60.55.60.71|11..25.41.25.41.25|11..85.51.55.51.65|3..65.34.40.34.45|3..85.49.60.49.60|3..120.79.95.79.70|4.7.30.35.50.70.55|4.7.70.65.125.105.90|12..125.40.30.30.58|12..165.60.65.50.58|12.16.42.118.42.88.30|12.16.52.168.47.138.30|11..29.45.29.45.36|11.4.59.85.79.105.36|11.9.94.50.94.50.66|11.9.30.42.30.42.70|11.9.80.102.80.102.40|3..45.70.45.90.95|2..65.35.60.30.85|2..105.55.85.50.115|4..35.45.62.53.35|4..60.70.87.78.85|2..48.48.57.62.34|2.8.83.68.92.82.39|0..100.66.60.66.115|13.9.50.34.60.44.70|13.9.80.44.90.54.80|0..66.44.44.56.85|0..76.84.54.96.105|13..60.60.105.105.105|15.9.125.52.105.52.71|0..55.42.42.37.85|0..82.64.64.59.112|10..30.50.65.50.45|7.15.63.47.41.41.74|7.15.93.67.71.61.84|16.10.24.86.24.86.23|16.10.89.116.79.116.33|12..80.95.10.45.10|10.17.25.45.70.90.60|0..5.5.15.65.30|0.9.65.45.92.42.91|13.15.92.108.92.108.35|14.8.70.45.40.45.42|14.8.90.65.50.55.82|14.8.130.95.80.85.102|0..85.40.40.85.5|6..70.40.35.40.60|6.16.110.70.115.70.90|8..72.78.38.42.32|8..112.118.68.72.47|7.11.50.90.30.55.65|7.15.90.110.60.75.95|7.6.61.40.61.40.50|7.6.106.65.86.65.85|4..100.72.90.72.46|2..49.56.49.61.66|2..69.76.69.86.91|2.9.20.50.60.120.50|4.5.62.50.62.60.40|4.5.92.75.92.85.60|15.5.120.65.45.85.125|3.16.70.115.130.90.60|0..85.95.80.95.50|8.12.140.130.55.55.40|4..100.125.110.50.50|3..123.67.95.85.95|1..95.67.125.95.83|17.9.50.95.120.115.80|11.9.76.86.116.56.95|4..110.130.60.65.95|5..60.110.130.95.65|8.9.95.125.45.75.95|5.8.130.80.70.60.80|0..80.70.135.75.90|10.6.125.65.65.115.80|12.16.55.145.75.150.40|13..100.135.65.135.45|5.13.80.70.80.70.110|3.13.50.77.95.77.91|10..75.130.75.130.95|10..105.105.105.105.80|10..125.70.125.70.115|16.14.120.120.150.100.90|2.14.120.100.150.120.100|1.16.90.106.130.106.77|0..160.110.80.110.100|13.14.100.120.100.120.90|10..70.110.75.120.85|2..80.80.80.80.80|2..100.100.100.100.100|15..90.90.135.90.125|4..100.100.100.100.100|0..120.120.120.120.120|10.1.100.100.100.100.100|4..45.55.45.55.63|4..60.75.60.75.83|4..75.95.75.95.113|1..63.45.45.45.45|1.6.93.55.70.55.55|1.6.123.65.100.65.65|2..55.45.63.45.45|2..75.60.83.60.60|2..100.85.108.70.70|0..55.39.35.39.42|0..85.69.60.69.77|0..60.45.25.45.55|0..80.65.35.65.60|0..110.90.45.90.80|15..50.37.50.37.66|15..88.50.88.50.106|4..53.48.53.48.64|4..98.63.98.63.101|1..53.48.53.48.64|1..98.63.98.63.101|2..53.48.53.48.64|2..98.63.98.63.101|10..25.45.67.55.24|10..55.85.107.95.29|0.9.55.50.36.30.43|0.9.77.62.50.42.65|0.9.115.80.65.55.93|3..60.32.50.32.76|3..100.63.80.63.116|12..75.85.25.25.15|12..105.105.50.40.20|12..135.130.60.80.25|10.9.45.43.55.43.72|10.9.57.55.77.55.114|8..85.40.30.45.68|8.16.135.60.50.65.88|0..60.86.60.86.50|6..80.55.25.35.35|6..105.85.40.50.40|6..140.95.55.65.45|2..50.40.50.40.64|2.8.65.55.65.55.69|2.8.95.75.85.75.74|6..100.85.30.85.45|6..125.75.30.75.85|11.4.53.70.40.60.42|11.4.63.90.50.80.42|11.4.103.80.70.80.92|11.7.45.59.30.39.57|11.7.55.99.40.79.47|11.7.100.89.55.69.112|4.17.27.60.37.50.66|4.17.67.85.77.75.116|4..35.50.70.50.30|4..60.75.110.75.90|2..92.65.80.55.98|8.15.72.35.35.35.65|8.15.82.45.45.45.74|8.15.117.80.65.70.92|1..90.45.15.45.50|1..140.55.30.55.95|4..86.67.106.67.60|11.12.65.85.35.35.55|11.12.105.125.65.75.45|15.6.75.70.35.70.48|15.6.90.115.45.115.58|10.9.58.80.103.80.97|13..30.85.55.65.30|13..50.145.95.105.30|2.12.78.103.53.45.22|2.12.108.133.83.65.32|12.9.112.45.74.45.70|12.9.140.65.112.65.110|7..50.62.40.62.65|7..95.82.60.82.75|15..65.40.80.40.65|15..105.60.120.60.105|0..50.40.40.40.75|0..95.60.65.60.115|10..30.50.55.65.45|10..45.70.75.85.55|10..55.95.95.110.65|10..30.40.105.50.20|10..40.50.125.60.30|10..65.75.125.85.30|2.9.44.50.44.50.55|2.9.87.63.87.63.98|5..50.50.65.60.44|5..65.65.80.75.59|5..95.85.110.95.79|0.4.60.50.40.50.75|0.4.100.70.60.70.95|3.9.75.60.75.60.103|11..75.45.40.45.60|11.16.135.105.60.105.20|4.7.55.45.55.55.15|4.7.85.70.85.80.30|2.13.40.50.65.85.40|2.13.60.70.85.105.60|2..75.80.40.45.65|11.3.47.50.57.50.65|11.3.77.60.97.60.108|4.16.50.91.24.86.10|4.16.94.131.54.116.20|16..55.70.45.60.30|16..80.95.70.85.50|16..100.115.70.85.90|3..55.40.45.40.60|3..85.70.75.70.40|3..115.80.105.80.50|10..55.55.85.55.30|10..75.75.125.95.40|13.1.30.55.65.55.20|13.1.40.60.95.60.55|13.1.55.90.145.90.80|14..87.60.30.40.57|14..117.70.40.50.67|14..147.90.60.70.97|5..70.40.60.40.40|5..130.80.70.80.50|5..50.50.95.135.105|11..40.85.40.65.25|11..70.40.100.60.145|8.3.66.84.81.99.32|6..85.50.55.50.65|6..125.60.95.60.105|14..120.90.60.90.48|8.13.74.50.35.50.35|8.13.124.80.55.80.55|15.16.85.70.40.40.60|15.16.125.100.60.70.70|0..110.95.40.95.55|0.9.83.50.37.50.60|0.9.123.75.57.75.80|15.9.55.75.45.65.60|15.9.65.105.55.95.80|1..97.66.105.66.65|11.16.109.112.48.48.109|15.14.65.50.45.50.38|15.14.85.70.65.70.58|15.14.105.90.125.90.98|11.1.85.55.50.55.60|11.1.60.65.135.105.100|16.6.90.129.90.72.108|12.6.129.90.72.90.108|4.6.90.72.90.129.108|9..115.70.125.80.111|3.9.115.70.125.80.111|14.1.120.100.150.120.90|14.3.150.120.120.100.90|8.9.125.90.115.80.101|14.5.130.90.130.90.95|2.6.72.90.129.90.108|0.10.77.77.128.128.90|11.16.120.95.120.95.99|4..61.65.48.45.38|4..78.95.56.58.57|4.6.107.122.74.75.64|1..45.40.62.60.60|1..59.58.90.70.73|1.10.69.72.114.100.104|2..56.40.62.44.71|2..63.52.83.56.97|2.15.95.67.103.71.122|0..36.38.32.36.57|0.8.56.77.50.77.78|0.9.50.43.40.38.62|1.9.73.55.56.52.84|1.9.81.71.74.69.126|11..35.40.27.25.35|11..22.60.27.30.29|11.9.52.50.90.50.89|1.0.50.58.73.54.72|1.0.68.72.109.66.106|17..38.39.61.79.42|17..45.47.75.98.52|17..65.68.112.154.75|4..65.48.62.57.52|4..100.62.97.81.68|6..82.62.46.48.43|6.15.124.78.69.71.58|0..80.60.65.90.102|10..48.54.63.60.68|10..48.76.83.81.104|16.13.80.100.35.37.28|16.13.110.150.45.49.35|16.13.50.140.50.140.60|17..52.60.63.65.23|17..72.72.99.89.29|17..48.66.59.57.49|17..80.86.85.75.72|15.10.54.53.37.46.45|15.10.92.88.68.75.73|12.2.52.67.39.56.50|12.2.105.115.54.86.68|7.2.60.60.60.60.30|7.14.75.90.97.123.44|2..53.62.58.63.44|2..73.88.120.89.59|3.0.38.33.61.43.70|3.0.55.52.109.94.109|12.14.89.77.45.45.48|12.14.121.119.69.59.71|12.5.59.50.67.63.46|12.5.77.72.99.92.58|17..65.65.110.130.60|6.9.92.75.74.63.118|3.17.58.57.81.67.101|12.17.50.150.50.150.50|14..50.35.55.75.40|14..75.53.83.113.60|14..100.70.110.150.80|16.17.80.91.80.87.75|13.4.70.48.50.60.38|13.4.110.76.65.82.56|13.4.66.70.44.55.51|13.4.90.122.58.75.84|5..69.85.32.35.28|5..117.184.44.46.28|9.14.30.35.45.40.55|9.14.70.80.97.80.123|17..131.95.131.98.99|15.9.131.95.131.98.99|14.8.100.121.81.95.95|12.17.100.150.100.150.50|10.13.110.60.150.130.70|1.2.110.120.130.90.70|4.9.55.55.50.50.42|4.9.75.75.70.70.52|4.13.107.75.100.100.70|1..65.40.60.40.70|1..85.50.80.50.90|1.15.115.90.80.90.60|2..54.54.66.56.40|2..69.69.91.81.50|2.17.74.74.126.116.60|0.9.75.30.30.30.65|0.9.85.50.40.50.75|0.9.120.75.75.75.60|0..70.30.30.30.45|0..110.60.55.60.45|11..62.45.55.45.46|11.3.82.95.55.75.36|11.3.70.90.145.75.43|6..82.57.42.47.63|6.5.132.77.62.67.43|1.9.70.70.98.70.93|11.17.45.40.55.40.84|11.17.55.60.95.70.124|12..65.40.30.40.60|12..115.65.55.65.112|2..20.20.25.25.40|7.2.53.62.43.52.45|7.2.63.152.53.142.35|8..100.70.45.55.45|8..125.100.55.85.35|2.11.40.52.40.72.27|2.11.70.92.50.132.42|4..55.35.50.35.35|4..105.90.80.90.45|4.17.35.55.65.75.15|4.17.45.80.90.100.30|7.1.44.40.71.40.77|7.1.64.60.111.60.117|0.6.75.50.45.50.50|0.6.125.80.55.60.60|4..30.38.30.38.32|4..40.48.40.48.62|4..120.98.50.98.72|17..52.90.82.110.100|0.10.60.80.90.110.60|6..120.90.40.60.80|11.2.35.40.20.30.80|11.2.125.140.60.90.40|13.8.55.80.70.45.15|13.8.75.110.100.75.35|2..60.130.30.130.5|0..95.95.95.95.59|0..95.95.95.95.95|12.9.100.60.100.60.120|0..115.65.75.95.65|1.14.78.135.91.85.36|3.16.98.63.40.73.96|13.17.90.80.50.105.96|2.10.105.70.70.70.92|0.14.60.85.135.91.36|13.4.131.100.86.90.40|14..55.65.45.45.45|14.6.75.90.65.70.65|14.6.110.125.100.105.85|3.17.115.85.95.75.130|10.17.85.75.130.115.95|4.17.130.115.85.95.75|2.17.75.115.95.130.85|10..29.31.29.31.37|10..29.131.29.131.37|10.16.137.107.113.89.97|10.13.113.89.137.107.97|12.7.53.47.127.131.103|11.6.139.139.53.53.79|11.6.137.37.137.37.151|3..89.71.173.71.83|16.9.101.103.107.101.61|4.16.181.131.59.31.109|15.14.101.53.97.53.43|10..107.101.127.89.79|16.17.95.115.130.115.65|6.13.125.80.90.90.125|7..73.67.73.67.73|7.14.73.73.127.73.121|12.16.131.211.53.101.13|1.13.127.53.151.79.107|3..112.75.102.80.143|16..65.65.55.35.34|16..143.143.80.65.34|4..65.50.40.40.65|4..85.70.55.60.80|4..125.90.60.70.85|1..71.40.40.40.69|1..86.60.55.60.94|1..116.75.65.75.119|2..40.40.70.40.70|2..60.55.95.55.90|2..85.65.125.65.120|0..55.55.35.35.25|0..95.95.55.75.20|9..47.35.33.35.57|9..67.55.43.55.77|9.16.87.105.53.85.67|11..20.20.25.45.45|11.10.35.80.50.90.30|11.10.45.110.80.120.90|15..28.28.47.52.50|15..58.58.87.92.90|4..40.60.40.60.10|4..50.90.80.120.60|0..40.55.40.45.48|0..80.100.60.90.88|2..64.50.38.38.44|2.12.115.90.48.68.74|3..45.50.40.50.26|3..90.60.90.60.121|12..40.50.40.50.30|12.1.60.90.60.70.50|12.1.80.120.80.90.30|4.14.40.80.40.40.20|4.14.110.80.95.60.70|4.14.85.80.100.80.30|8..57.75.35.50.46|8..107.125.65.70.71|9.2.85.55.85.95.85|2..63.40.40.30.66|2..123.60.60.50.136|3.7.38.35.54.35.40|3.7.98.70.114.70.75|1.11.65.45.50.50.45|1.11.115.65.90.90.65|6..68.60.50.50.32|6..118.90.70.80.42|13..45.45.74.54.50|13..65.65.134.114.70|10..30.45.56.53.39|10..40.65.86.73.49|10.17.90.95.136.103.29|15.17.45.30.55.40.50|15.17.60.45.75.55.70|15.17.120.65.95.75.60|15.0.90.101.60.81.95|16..110.100.50.60.50|13..95.50.145.130.30|6..135.95.68.82.65|5.10.85.75.110.100.70|8.13.95.145.50.105.30|17..40.40.50.61.34|17..60.75.110.121.64|6..100.100.70.60.75|3..101.95.91.85.15|5.11.25.35.45.30.20|5.11.65.60.125.90.65|12..125.135.20.20.70|5..80.110.65.90.50|10.0.65.55.105.95.95|3.15.95.58.70.58.97|16..80.49.40.49.40|16..130.69.80.69.30|3.14.100.90.80.70.75|3.5.100.90.90.80.55|2.14.90.100.70.80.75|2.5.90.100.80.90.55|16.14.95.115.120.50.85|14.13.60.30.40.30.82|14.13.80.50.60.50.102|14.13.120.75.100.75.142|17..120.115.80.115.138|6..120.115.80.115.138|7.14.85.95.145.95.130|6..90.60.53.50.72|6.15.130.100.63.60.97|15.4.120.105.70.95.105|3..100.50.100.50.200|14..100.50.100.50.80|5..145.130.65.110.30|13..65.60.145.80.130|10.4.80.80.80.80.80|0.10.105.72.105.75.65|11.12.135.95.45.70.85|8.0.140.105.45.80.50|2.13.112.65.80.75.78|6.7.130.60.40.80.120|15.7.115.95.65.65.85|17.9.115.70.135.80.106|4..61.54.45.45.65|4..80.63.60.63.83|4.15.110.70.81.70.123|1..45.59.63.40.36|1..55.78.90.58.49|1.13.75.100.110.75.66|2..65.45.50.45.50|2..85.65.65.60.65|2.6.120.80.85.75.85|0..45.40.35.45.35|0..100.75.59.80.65|11..41.45.29.40.20|11..79.92.52.86.35|11..46.40.21.25.45|11.15.102.78.52.55.92|3..50.20.40.25.60|3.6.75.40.50.40.85|3.6.115.70.70.60.105|0..50.45.40.45.75|0..75.70.65.75.111|17..55.70.30.55.65|17..80.115.50.80.95|4.0.35.45.58.51.30|4.0.53.60.78.78.33|4.0.69.90.125.109.39|0.9.96.51.45.51.92|12..55.75.35.35.25|12..60.100.35.65.35|12..100.130.45.90.35|1..50.40.50.40.35|1.10.60.100.125.80.75|1.13.125.80.60.100.85|3..31.41.59.35.45|3..64.91.103.83.45|3.9.40.35.55.40.70|3.9.70.60.105.60.125|15..78.60.40.51.51|15..120.90.60.70.85|7.0.65.35.40.35.75|7.0.95.65.80.72.110|4.13.65.30.45.35.60|4.13.115.70.80.70.90|8.4.40.35.50.100.70|8.4.70.65.80.120.100|12..100.115.35.55.75|4..62.40.62.40.50|4.1.108.65.108.65.75|11..50.60.31.58.30|11.10.50.85.115.100.45|10..35.30.55.30.75|10..60.60.101.60.105|17.16.45.45.35.64.58|17.16.55.55.45.82.78|17.16.75.77.70.105.94|2..55.25.35.25.95|2..100.50.50.70.120|9.15.103.85.60.85.82|2..45.40.45.40.75|2..70.72.53.62.100|16.7.70.63.30.45.47|16.7.119.90.54.67.90|14.0.95.65.85.65.121|16..85.145.60.55.65|12.7.35.42.105.60.60|12.7.55.90.130.81.86|13..61.60.30.55.34|13..101.100.50.97.68|9.6.115.74.75.64.90|5..68.45.30.40.43|5..113.65.45.55.73|2.10.102.73.78.65.70|2..100.115.65.65.35|14.2.50.60.120.95.82|6.13.115.80.50.90.90|7.8.75.60.45.100.20|0.10.90.70.110.70.60|0..100.80.85.75.55|15.16.135.120.60.85.50|8.6.131.131.53.53.87|17.10.65.99.65.115.111|4.15.127.99.79.99.55|13.17.55.55.135.135.135|11.6.135.79.85.105.81|3.8.81.97.121.85.101|8.16.112.120.72.70.106|5.2.80.114.124.60.136|6.3.140.108.50.68.50|15.9.80.86.122.80.108|1.7.70.60.140.110.110|12.3.134.110.70.84.72|14.5.75.45.35.45.55|14.5.95.66.45.65.62|14.5.145.92.75.86.87|13..30.70.75.70.10|16.13.60.95.133.91.84|15.4.85.100.95.135.70|15.5.120.80.90.65.135|15.8.110.125.55.80.45|15.1.80.80.135.120.100|14.15.139.71.55.101.119|17.6.130.90.120.60.116|6.14.135.115.85.100.135|3.14.85.100.135.115.135|2.14.83.91.125.83.109|4.10.130.88.70.108.104|4.14.80.110.95.80.40|4.13.45.45.74.54.50|4.13.60.106.121.80.70|7.6.128.115.58.86.80|7.10.75.66.130.90.106|7.17.91.82.70.125.99|4..120.84.60.96.110|16.14.105.130.125.65.85|4.14.80.110.120.80.44|1.14.115.121.65.93.91|3.14.73.91.137.89.75|12.10.120.80.68.108.124|16.10.72.100.122.108.98|0..65.85.65.85.60|7.13.88.160.88.88.88";
const MEGAS=[{"b":3,"f":"Mega Venusaur","st":"Venusaurite","t":[4,7],"s":[100,123,122,120,80],"a":"Thick Fat","i":10033},{"b":6,"f":"Mega Charizard X","st":"Charizardite X","t":[1,14],"s":[130,111,130,85,100],"a":"Tough Claws","i":10034},{"b":6,"f":"Mega Charizard Y","st":"Charizardite Y","t":[1,9],"s":[104,78,159,115,100],"a":"Drought","i":10035},{"b":9,"f":"Mega Blastoise","st":"Blastoisinite","t":[2],"s":[103,120,135,115,78],"a":"Mega Launcher","i":10036},{"b":15,"f":"Mega Beedrill","st":"Beedrillite","t":[11,7],"s":[150,40,15,80,145],"a":"Adaptability","i":10090},{"b":18,"f":"Mega Pidgeot","st":"Pidgeotite","t":[0,9],"s":[80,80,135,80,121],"a":"No Guard","i":10073},{"b":26,"f":"Mega Raichu X","st":"Raichunite X","t":[3],"s":[135,95,90,95,110],"a":"Electric Surge","i":10304},{"b":26,"f":"Mega Raichu Y","st":"Raichunite Y","t":[3],"s":[100,55,160,80,130],"a":"No Guard","i":10305},{"b":36,"f":"Mega Clefable","st":"Clefablite","t":[17,9],"s":[80,93,135,110,70],"a":"Magic Bounce","i":10278},{"b":65,"f":"Mega Alakazam","st":"Alakazite","t":[10],"s":[50,65,175,105,150],"a":"Trace","i":10037},{"b":71,"f":"Mega Victreebel","st":"Victreebelite","t":[4,7],"s":[125,85,135,95,70],"a":"Innards Out","i":10279},{"b":80,"f":"Mega Slowbro","st":"Slowbronite","t":[2,10],"s":[75,180,130,80,30],"a":"Shell Armor","i":10071},{"b":94,"f":"Mega Gengar","st":"Gengarite","t":[13,7],"s":[65,80,170,95,130],"a":"Shadow Tag","i":10038},{"b":115,"f":"Mega Kangaskhan","st":"Kangaskhanite","t":[0],"s":[125,100,60,100,100],"a":"Parental Bond","i":10039},{"b":121,"f":"Mega Starmie","st":"Starminite","t":[2,10],"s":[100,105,130,105,120],"a":"Huge Power","i":10280},{"b":127,"f":"Mega Pinsir","st":"Pinsirite","t":[11,9],"s":[155,120,65,90,105],"a":"Aerilate","i":10040},{"b":130,"f":"Mega Gyarados","st":"Gyaradosite","t":[2,15],"s":[155,109,70,130,81],"a":"Mold Breaker","i":10041},{"b":142,"f":"Mega Aerodactyl","st":"Aerodactylite","t":[12,9],"s":[135,85,70,95,150],"a":"Tough Claws","i":10042},{"b":149,"f":"Mega Dragonite","st":"Dragoninite","t":[14,9],"s":[124,115,145,125,100],"a":"Multiscale","i":10281},{"b":150,"f":"Mega Mewtwo X","st":"Mewtwonite X","t":[10,6],"s":[190,100,154,100,130],"a":"Steadfast","i":10043},{"b":150,"f":"Mega Mewtwo Y","st":"Mewtwonite Y","t":[10],"s":[150,70,194,120,140],"a":"Insomnia","i":10044},{"b":154,"f":"Mega Meganium","st":"Meganiumite","t":[4,17],"s":[92,115,143,115,80],"a":"Mega Sol","i":10282},{"b":160,"f":"Mega Feraligatr","st":"Feraligite","t":[2,14],"s":[160,125,89,93,78],"a":"Dragonize","i":10283},{"b":181,"f":"Mega Ampharos","st":"Ampharosite","t":[3,14],"s":[95,105,165,110,45],"a":"Mold Breaker","i":10045},{"b":208,"f":"Mega Steelix","st":"Steelixite","t":[16,8],"s":[125,230,55,95,30],"a":"Sand Force","i":10072},{"b":212,"f":"Mega Scizor","st":"Scizorite","t":[11,16],"s":[150,140,65,100,75],"a":"Technician","i":10046},{"b":214,"f":"Mega Heracross","st":"Heracronite","t":[11,6],"s":[185,115,40,105,75],"a":"Skill Link","i":10047},{"b":227,"f":"Mega Skarmory","st":"Skarmorite","t":[16,9],"s":[140,110,40,100,110],"a":"Stalwart","i":10284},{"b":229,"f":"Mega Houndoom","st":"Houndoominite","t":[15,1],"s":[90,90,140,90,115],"a":"Solar Power","i":10048},{"b":248,"f":"Mega Tyranitar","st":"Tyranitarite","t":[12,15],"s":[164,150,95,120,71],"a":"Sand Stream","i":10049},{"b":254,"f":"Mega Sceptile","st":"Sceptilite","t":[4,14],"s":[110,75,145,85,145],"a":"Lightning Rod","i":10065},{"b":257,"f":"Mega Blaziken","st":"Blazikenite","t":[1,6],"s":[160,80,130,80,100],"a":"Speed Boost","i":10050},{"b":260,"f":"Mega Swampert","st":"Swampertite","t":[2,8],"s":[150,110,95,110,70],"a":"Swift Swim","i":10064},{"b":282,"f":"Mega Gardevoir","st":"Gardevoirite","t":[10,17],"s":[85,65,165,135,100],"a":"Pixilate","i":10051},{"b":302,"f":"Mega Sableye","st":"Sablenite","t":[15,13],"s":[85,125,85,115,20],"a":"Magic Bounce","i":10066},{"b":303,"f":"Mega Mawile","st":"Mawilite","t":[16,17],"s":[105,125,55,95,50],"a":"Huge Power","i":10052},{"b":306,"f":"Mega Aggron","st":"Aggronite","t":[16],"s":[140,230,60,80,50],"a":"Filter","i":10053},{"b":308,"f":"Mega Medicham","st":"Medichamite","t":[6,10],"s":[100,85,80,85,100],"a":"Pure Power","i":10054},{"b":310,"f":"Mega Manectric","st":"Manectite","t":[3],"s":[75,80,135,80,135],"a":"Intimidate","i":10055},{"b":319,"f":"Mega Sharpedo","st":"Sharpedonite","t":[2,15],"s":[140,70,110,65,105],"a":"Strong Jaw","i":10070},{"b":323,"f":"Mega Camerupt","st":"Cameruptite","t":[1,8],"s":[120,100,145,105,20],"a":"Sheer Force","i":10087},{"b":334,"f":"Mega Altaria","st":"Altarianite","t":[14,17],"s":[110,110,110,105,80],"a":"Pixilate","i":10067},{"b":354,"f":"Mega Banette","st":"Banettite","t":[13],"s":[165,75,93,83,75],"a":"Prankster","i":10056},{"b":358,"f":"Mega Chimecho","st":"Chimechite","t":[10,16],"s":[50,110,135,120,65],"a":"Levitate","i":10306},{"b":359,"f":"Mega Absol","st":"Absolite","t":[15],"s":[150,60,115,60,115],"a":"Magic Bounce","i":10057},{"b":362,"f":"Mega Glalie","st":"Glalitite","t":[5],"s":[120,80,120,80,100],"a":"Refrigerate","i":10074},{"b":373,"f":"Mega Salamence","st":"Salamencite","t":[14,9],"s":[145,130,120,90,120],"a":"Aerilate","i":10089},{"b":376,"f":"Mega Metagross","st":"Metagrossite","t":[16,10],"s":[145,150,105,110,110],"a":"Tough Claws","i":10076},{"b":380,"f":"Mega Latias","st":"Latiasite","t":[14,10],"s":[100,120,140,150,110],"a":"Levitate","i":10062},{"b":381,"f":"Mega Latios","st":"Latiosite","t":[14,10],"s":[130,100,160,120,110],"a":"Levitate","i":10063},{"b":384,"f":"Mega Rayquaza","st":"","t":[14,9],"s":[180,100,180,100,115],"a":"Delta Stream","i":10079,"mv":"Dragon Ascent"},{"b":398,"f":"Mega Staraptor","st":"Staraptite","t":[6,9],"s":[140,100,60,90,110],"a":"Contrary","i":10308},{"b":428,"f":"Mega Lopunny","st":"Lopunnite","t":[0,6],"s":[136,94,54,96,135],"a":"Scrappy","i":10088},{"b":445,"f":"Mega Garchomp","st":"Garchompite","t":[14,8],"s":[170,115,120,95,92],"a":"Sand Force","i":10058},{"b":448,"f":"Mega Lucario","st":"Lucarionite","t":[6,16],"s":[145,88,140,70,112],"a":"Adaptability","i":10059},{"b":460,"f":"Mega Abomasnow","st":"Abomasite","t":[4,5],"s":[132,105,132,105,30],"a":"Snow Warning","i":10060},{"b":475,"f":"Mega Gallade","st":"Galladite","t":[10,6],"s":[165,95,65,115,110],"a":"Inner Focus","i":10068},{"b":478,"f":"Mega Froslass","st":"Froslassite","t":[5,13],"s":[80,70,140,100,120],"a":"Snow Warning","i":10285},{"b":485,"f":"Mega Heatran","st":"Heatranite","t":[1,16],"s":[120,106,175,141,67],"a":"Flash Fire","i":10311},{"b":491,"f":"Mega Darkrai","st":"Darkranite","t":[15],"s":[120,130,165,130,85],"a":"Bad Dreams","i":10312},{"b":500,"f":"Mega Emboar","st":"Emboarite","t":[1,6],"s":[148,75,110,110,75],"a":"Mold Breaker","i":10286},{"b":530,"f":"Mega Excadrill","st":"Excadrite","t":[8,16],"s":[165,100,65,65,103],"a":"Piercing Drill","i":10287},{"b":531,"f":"Mega Audino","st":"Audinite","t":[0,17],"s":[60,126,80,126,50],"a":"Healer","i":10069},{"b":545,"f":"Mega Scolipede","st":"Scolipite","t":[11,7],"s":[140,149,75,99,62],"a":"Shell Armor","i":10288},{"b":560,"f":"Mega Scrafty","st":"Scraftinite","t":[15,6],"s":[130,135,55,135,68],"a":"Intimidate","i":10289},{"b":604,"f":"Mega Eelektross","st":"Eelektrossite","t":[3],"s":[145,80,135,90,80],"a":"Eelevate","i":10290},{"b":609,"f":"Mega Chandelure","st":"Chandelurite","t":[13,1],"s":[75,110,175,110,90],"a":"Infiltrator","i":10291},{"b":623,"f":"Mega Golurk","st":"Golurkite","t":[8,13],"s":[159,105,70,105,55],"a":"Unseen Fist","i":10313},{"b":652,"f":"Mega Chesnaught","st":"Chesnaughtite","t":[4,6],"s":[137,172,74,115,44],"a":"Bulletproof","i":10292},{"b":655,"f":"Mega Delphox","st":"Delphoxite","t":[1,10],"s":[69,72,159,125,134],"a":"Levitate","i":10293},{"b":658,"f":"Mega Greninja","st":"Greninjite","t":[2,15],"s":[125,77,133,81,142],"a":"Protean","i":10294},{"b":668,"f":"Mega Pyroar","st":"Pyroarite","t":[1,0],"s":[88,92,129,86,126],"a":"Fire Mane","i":10295},{"b":670,"f":"Mega Floette","st":"Floettite","t":[17],"s":[85,87,155,148,102],"a":"Fairy Aura","i":10296},{"b":687,"f":"Mega Malamar","st":"Malamarite","t":[15,10],"s":[102,88,98,120,88],"a":"Contrary","i":10297},{"b":689,"f":"Mega Barbaracle","st":"Barbaracite","t":[12,6],"s":[140,130,64,106,88],"a":"Tough Claws","i":10298},{"b":691,"f":"Mega Dragalge","st":"Dragalgite","t":[7,14],"s":[85,105,132,163,44],"a":"Regenerator","i":10299},{"b":701,"f":"Mega Hawlucha","st":"Hawluchanite","t":[6,9],"s":[137,100,74,93,118],"a":"No Guard","i":10300},{"b":718,"f":"Mega Zygarde","st":"Zygardite","t":[14,8],"s":[70,91,216,85,100],"a":"Aura Break","i":10301},{"b":719,"f":"Mega Diancie","st":"Diancite","t":[12,17],"s":[160,110,160,110,110],"a":"Magic Bounce","i":10075},{"b":740,"f":"Mega Crabominable","st":"Crabominite","t":[6,5],"s":[157,122,62,107,33],"a":"Iron Fist","i":10315},{"b":768,"f":"Mega Golisopod","st":"Golisopite","t":[11,16],"s":[150,175,70,120,40],"a":"Emergency Exit","i":10316},{"b":780,"f":"Mega Drampa","st":"Drampanite","t":[0,14],"s":[85,110,160,116,36],"a":"Berserk","i":10302},{"b":801,"f":"Mega Magearna","st":"Magearnite","t":[16,17],"s":[125,115,170,115,95],"a":"Soul-Heart","i":10317},{"b":807,"f":"Mega Zeraora","st":"Zeraorite","t":[3],"s":[157,75,147,80,153],"a":"Volt Absorb","i":10319},{"b":870,"f":"Mega Falinks","st":"Falinksite","t":[6],"s":[135,135,70,65,100],"a":"Defiant","i":10303},{"b":952,"f":"Mega Scovillain","st":"Scovillainite","t":[4,1],"s":[138,85,138,85,75],"a":"Spicy Spray","i":10320},{"b":970,"f":"Mega Glimmora","st":"Glimmoranite","t":[12,7],"s":[90,105,150,96,101],"a":"Adaptability","i":10321},{"b":998,"f":"Mega Baxcalibur","st":"Baxcalibrite","t":[14,5],"s":[175,117,105,101,87],"a":"Thermal Exchange","i":10325}];
const FORMS=[{"b":19,"r":"Alola","n":"Alolan Rattata","t":[15,0],"s":[56,35,25,35,72],"i":10091},{"b":20,"r":"Alola","n":"Alolan Raticate","t":[15,0],"s":[71,70,40,80,77],"i":10092},{"b":26,"r":"Alola","n":"Alolan Raichu","t":[3,10],"s":[85,50,95,85,110],"i":10100},{"b":27,"r":"Alola","n":"Alolan Sandshrew","t":[5,16],"s":[75,90,10,35,40],"i":10101},{"b":28,"r":"Alola","n":"Alolan Sandslash","t":[5,16],"s":[100,120,25,65,65],"i":10102},{"b":37,"r":"Alola","n":"Alolan Vulpix","t":[5],"s":[41,40,50,65,65],"i":10103},{"b":38,"r":"Alola","n":"Alolan Ninetales","t":[5,17],"s":[67,75,81,100,109],"i":10104},{"b":50,"r":"Alola","n":"Alolan Diglett","t":[8,16],"s":[55,30,35,45,90],"i":10105},{"b":51,"r":"Alola","n":"Alolan Dugtrio","t":[8,16],"s":[100,60,50,70,110],"i":10106},{"b":52,"r":"Alola","n":"Alolan Meowth","t":[15],"s":[35,35,50,40,90],"i":10107},{"b":52,"r":"Galar","n":"Galarian Meowth","t":[16],"s":[65,55,40,40,40],"i":10161},{"b":53,"r":"Alola","n":"Alolan Persian","t":[15],"s":[60,60,75,65,115],"i":10108},{"b":58,"r":"Hisui","n":"Hisuian Growlithe","t":[1,12],"s":[75,45,65,50,55],"i":10229},{"b":59,"r":"Hisui","n":"Hisuian Arcanine","t":[1,12],"s":[115,80,95,80,90],"i":10230},{"b":74,"r":"Alola","n":"Alolan Geodude","t":[12,3],"s":[80,100,30,30,20],"i":10109},{"b":75,"r":"Alola","n":"Alolan Graveler","t":[12,3],"s":[95,115,45,45,35],"i":10110},{"b":76,"r":"Alola","n":"Alolan Golem","t":[12,3],"s":[120,130,55,65,45],"i":10111},{"b":77,"r":"Galar","n":"Galarian Ponyta","t":[10],"s":[85,55,65,65,90],"i":10162},{"b":78,"r":"Galar","n":"Galarian Rapidash","t":[10,17],"s":[100,70,80,80,105],"i":10163},{"b":79,"r":"Galar","n":"Galarian Slowpoke","t":[10],"s":[65,65,40,40,15],"i":10164},{"b":80,"r":"Galar","n":"Galarian Slowbro","t":[7,10],"s":[100,95,100,70,30],"i":10165},{"b":83,"r":"Galar","n":"Galarian Farfetch’d","t":[6],"s":[95,55,58,62,55],"i":10166},{"b":88,"r":"Alola","n":"Alolan Grimer","t":[7,15],"s":[80,50,40,50,25],"i":10112},{"b":89,"r":"Alola","n":"Alolan Muk","t":[7,15],"s":[105,75,65,100,50],"i":10113},{"b":100,"r":"Hisui","n":"Hisuian Voltorb","t":[3,4],"s":[30,50,55,55,100],"i":10231},{"b":101,"r":"Hisui","n":"Hisuian Electrode","t":[3,4],"s":[50,70,80,80,150],"i":10232},{"b":103,"r":"Alola","n":"Alolan Exeggutor","t":[4,14],"s":[105,85,125,75,45],"i":10114},{"b":105,"r":"Alola","n":"Alolan Marowak","t":[1,13],"s":[80,110,50,80,45],"i":10115},{"b":110,"r":"Galar","n":"Galarian Weezing","t":[7,17],"s":[90,120,85,70,60],"i":10167},{"b":122,"r":"Galar","n":"Galarian Mr. Mime","t":[5,10],"s":[65,65,90,90,100],"i":10168},{"b":128,"r":"Paldea","n":"Paldean Tauros (Combat)","t":[6],"s":[110,105,30,70,100],"i":10250,"x":"combat"},{"b":128,"r":"Paldea","n":"Paldean Tauros (Aqua)","t":[6,2],"s":[110,105,30,70,100],"i":10252,"x":"aqua"},{"b":128,"r":"Paldea","n":"Paldean Tauros (Blaze)","t":[6,1],"s":[110,105,30,70,100],"i":10251,"x":"blaze"},{"b":144,"r":"Galar","n":"Galarian Articuno","t":[10,9],"s":[85,85,125,100,95],"i":10169},{"b":145,"r":"Galar","n":"Galarian Zapdos","t":[6,9],"s":[125,90,85,90,100],"i":10170},{"b":146,"r":"Galar","n":"Galarian Moltres","t":[15,9],"s":[85,90,100,125,90],"i":10171},{"b":157,"r":"Hisui","n":"Hisuian Typhlosion","t":[1,13],"s":[84,78,119,85,95],"i":10233},{"b":194,"r":"Paldea","n":"Paldean Wooper","t":[7,8],"s":[45,45,25,25,15],"i":10253},{"b":199,"r":"Galar","n":"Galarian Slowking","t":[7,10],"s":[65,80,110,110,30],"i":10172},{"b":211,"r":"Hisui","n":"Hisuian Qwilfish","t":[15,7],"s":[95,85,55,55,85],"i":10234},{"b":215,"r":"Hisui","n":"Hisuian Sneasel","t":[6,7],"s":[95,55,35,75,115],"i":10235},{"b":222,"r":"Galar","n":"Galarian Corsola","t":[13],"s":[55,100,65,100,30],"i":10173},{"b":263,"r":"Galar","n":"Galarian Zigzagoon","t":[15,0],"s":[30,41,30,41,60],"i":10174},{"b":264,"r":"Galar","n":"Galarian Linoone","t":[15,0],"s":[70,61,50,61,100],"i":10175},{"b":503,"r":"Hisui","n":"Hisuian Samurott","t":[2,15],"s":[108,80,100,65,85],"i":10236},{"b":549,"r":"Hisui","n":"Hisuian Lilligant","t":[4,6],"s":[105,75,50,75,105],"i":10237},{"b":554,"r":"Galar","n":"Galarian Darumaka","t":[5],"s":[90,45,15,45,50],"i":10176},{"b":555,"r":"Galar","n":"Galarian Darmanitan","t":[5],"s":[140,55,30,55,95],"i":10177},{"b":562,"r":"Galar","n":"Galarian Yamask","t":[8,13],"s":[55,85,30,65,30],"i":10179},{"b":570,"r":"Hisui","n":"Hisuian Zorua","t":[0,13],"s":[60,40,85,40,70],"i":10238},{"b":571,"r":"Hisui","n":"Hisuian Zoroark","t":[0,13],"s":[100,60,125,60,110],"i":10239},{"b":618,"r":"Galar","n":"Galarian Stunfisk","t":[8,16],"s":[81,99,66,84,32],"i":10180},{"b":628,"r":"Hisui","n":"Hisuian Braviary","t":[10,9],"s":[83,70,112,70,65],"i":10240},{"b":705,"r":"Hisui","n":"Hisuian Sliggoo","t":[16,14],"s":[75,83,83,113,40],"i":10241},{"b":706,"r":"Hisui","n":"Hisuian Goodra","t":[16,14],"s":[100,100,110,150,60],"i":10242},{"b":713,"r":"Hisui","n":"Hisuian Avalugg","t":[5,12],"s":[127,184,34,36,38],"i":10243},{"b":724,"r":"Hisui","n":"Hisuian Decidueye","t":[4,6],"s":[112,80,95,95,60],"i":10244}];
/* ---------- Pokédex reference: evolution links and the Sinnoh regional order. Generated by gen_dex2.js (evolutions from @pkmn/dex, regional list from PokeAPI's extended-sinnoh Pokédex). ---------- */
const DEXPRE="2:1,3:2,5:4,6:5,8:7,9:8,11:10,12:11,14:13,15:14,17:16,18:17,20:19,22:21,24:23,25:172,26:25,28:27,30:29,31:30,33:32,34:33,35:173,36:35,38:37,39:174,40:39,42:41,44:43,45:44,47:46,49:48,51:50,53:52,55:54,57:56,59:58,61:60,62:61,64:63,65:64,67:66,68:67,70:69,71:70,73:72,75:74,76:75,78:77,80:79,82:81,85:84,87:86,89:88,91:90,93:92,94:93,97:96,99:98,101:100,103:102,105:104,106:236,107:236,110:109,112:111,113:440,117:116,119:118,121:120,122:439,124:238,125:239,126:240,130:129,134:133,135:133,136:133,139:138,141:140,143:446,148:147,149:148,153:152,154:153,156:155,157:156,159:158,160:159,162:161,164:163,166:165,168:167,169:42,171:170,176:175,178:177,180:179,181:180,182:44,183:298,184:183,185:438,186:61,188:187,189:188,192:191,195:194,196:133,197:133,199:79,202:360,205:204,208:95,210:209,212:123,217:216,219:218,221:220,224:223,226:458,229:228,230:117,232:231,233:137,237:236,242:113,247:246,248:247,253:252,254:253,256:255,257:256,259:258,260:259,262:261,264:263,266:265,267:266,268:265,269:268,271:270,272:271,274:273,275:274,277:276,279:278,281:280,282:281,284:283,286:285,288:287,289:288,291:290,292:290,294:293,295:294,297:296,301:300,305:304,306:305,308:307,310:309,315:406,317:316,319:318,321:320,323:322,326:325,329:328,330:329,332:331,334:333,340:339,342:341,344:343,346:345,348:347,350:349,354:353,356:355,358:433,362:361,364:363,365:364,367:366,368:366,372:371,373:372,375:374,376:375,388:387,389:388,391:390,392:391,394:393,395:394,397:396,398:397,400:399,402:401,404:403,405:404,407:315,409:408,411:410,413:412,414:412,416:415,419:418,421:420,423:422,424:190,426:425,428:427,429:200,430:198,432:431,435:434,437:436,444:443,445:444,448:447,450:449,452:451,454:453,457:456,460:459,461:215,462:82,463:108,464:112,465:114,466:125,467:126,468:176,469:193,470:133,471:133,472:207,473:221,474:233,475:281,476:299,477:356,478:361,496:495,497:496,499:498,500:499,502:501,503:502,505:504,507:506,508:507,510:509,512:511,514:513,516:515,518:517,520:519,521:520,523:522,525:524,526:525,528:527,530:529,533:532,534:533,536:535,537:536,541:540,542:541,544:543,545:544,547:546,549:548,552:551,553:552,555:554,558:557,560:559,563:562,565:564,567:566,569:568,571:570,573:572,575:574,576:575,578:577,579:578,581:580,583:582,584:583,586:585,589:588,591:590,593:592,596:595,598:597,600:599,601:600,603:602,604:603,606:605,608:607,609:608,611:610,612:611,614:613,617:616,620:619,623:622,625:624,628:627,630:629,634:633,635:634,637:636,651:650,652:651,654:653,655:654,657:656,658:657,660:659,662:661,663:662,665:664,666:665,668:667,670:669,671:670,673:672,675:674,678:677,680:679,681:680,683:682,685:684,687:686,689:688,691:690,693:692,695:694,697:696,699:698,700:133,705:704,706:705,709:708,711:710,713:712,715:714,723:722,724:723,726:725,727:726,729:728,730:729,732:731,733:732,735:734,737:736,738:737,740:739,743:742,745:744,748:747,750:749,752:751,754:753,756:755,758:757,760:759,762:761,763:762,768:767,770:769,773:772,783:782,784:783,790:789,791:790,792:790,804:803,811:810,812:811,814:813,815:814,817:816,818:817,820:819,822:821,823:822,825:824,826:825,828:827,830:829,832:831,834:833,836:835,838:837,839:838,841:840,842:840,844:843,847:846,849:848,851:850,853:852,855:854,857:856,858:857,860:859,861:860,862:264,863:52,864:222,865:83,866:122,867:562,869:868,873:872,879:878,886:885,887:886,892:891,899:234,900:123,901:217,902:550,903:215,904:211,907:906,908:907,910:909,911:910,913:912,914:913,916:915,918:917,920:919,922:921,923:922,925:924,927:926,929:928,930:929,933:932,934:933,936:935,937:935,939:938,941:940,943:942,945:944,947:946,949:948,952:951,954:953,956:955,958:957,959:958,961:960,964:963,966:965,970:969,972:971,975:974,979:57,980:194,981:203,982:206,983:625,997:996,998:997,1000:999,1011:840,1013:1012,1018:884,1019:1011";
const DEXSIN="387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,63,64,65,129,130,406,315,407,41,42,169,74,75,76,95,208,408,409,410,411,66,67,68,54,55,412,413,414,265,266,267,268,269,415,416,417,418,419,420,421,422,423,214,190,424,425,426,427,428,92,93,94,200,429,198,430,431,432,118,119,339,340,433,358,434,435,307,308,436,437,77,78,438,185,439,122,440,113,242,173,35,36,441,172,25,26,163,164,442,443,444,445,446,143,201,447,448,194,195,278,279,203,449,450,298,183,184,451,452,453,454,455,223,224,456,457,72,73,349,350,458,226,459,460,215,461,480,481,482,483,484,490,479,207,472,299,476,280,281,282,475,108,463,133,134,135,136,196,197,470,471,333,334,175,176,468,228,229,81,82,462,114,465,193,469,357,111,112,464,355,356,477,137,233,474,123,212,239,125,466,240,126,467,220,221,473,361,362,478,359,487";

/* ---------- place data: markers and routes traced from the Sinnoh map (2048 x 1763 px); text from the world notes, player-safe ---------- */
const MAP_W=2048,MAP_H=1763;
const PD=[{"id":"acuity-lakefront","name":"Acuity Lakefront","t":"p","g":"land","kind":"landmark","x":828,"y":260,"sum":"A broad white bowl of ice with a dark blue fringe where the shore keeps its water open. After days of wind on the Drift Fields, Acuity feels unnervingly still. People talk quietly here. The ice ticks and booms at night in long, slow phrases.","facts":[["Access","only by Route 217; about 4 days from Greenstation, 2–4 days from Snowpoint"]],"cx":828,"cy":260,"bb":[758,210,898,310]},{"id":"snowpoint-city","name":"Snowpoint City","t":"p","g":"settle","kind":"city","x":892,"y":202,"sum":"Sinnoh's northernmost city, a stepped town of timber houses, steam vents and warm stone streets at the end of the road. Cheerful, practical and genuinely used to the dark.","facts":[["Gym","Candice · Ice-type · Icicle Badge"]],"cx":892,"cy":202,"bb":[822,152,962,252]},{"id":"mt-stark","name":"Mt. Stark","t":"p","g":"land","kind":"landmark","x":1543,"y":280,"sum":"The island's chimney. Mt. Stark is a restless volcano, its crater lip ringed with yellow rock and steam, its slopes black with cinder and white with salt. The League's volcano watch keeps a station on the rim.","facts":[],"cx":1543,"cy":280,"bb":[1473,230,1613,330]},{"id":"fullmoon-island","name":"Fullmoon Island","t":"p","g":"land","kind":"island","x":428,"y":312,"sum":"A long pale island with a spine of grey slate, silver-leaved scrub, a shell-white beach and a quiet most visitors describe as \"the kind you can hear.\" Cold, bright and strangely lit even on cloudy nights, it is Sinnoh's best-known legend-island and one of its least visited places.","facts":[["Access","League and Ranger permit only (Moon Islands Conservation Order)"]],"cx":428,"cy":312,"bb":[358,262,498,362]},{"id":"newmoon-island","name":"Newmoon Island","t":"p","g":"land","kind":"island","x":500,"y":364,"sum":"A pale, curved island that sailors steer around. Its bay is the shape of a crescent and its water is unusually still. Ranger charts mark everything within five kilometers of its coast as the League's Closed Water.","facts":[["Access","no landing is permitted under any category; the surrounding sea is the League's Closed Water"]],"cx":500,"cy":364,"bb":[430,314,570,414]},{"id":"greenstation-town","name":"Greenstation Town","t":"p","g":"settle","kind":"town","x":837,"y":432,"sum":"A mountain-pass railhead where four routes meet. It is the last stop of the narrow-gauge Lilypad Line and the first stop of everything harder. In a white landscape, the only green is the station roof.","facts":[],"cx":837,"cy":432,"bb":[767,382,907,482]},{"id":"lilypad-town","name":"Lilypad Town","t":"p","g":"settle","kind":"town","x":960,"y":337,"sum":"A steaming hot-spring town on the snow country's east flank, where open pools never freeze and lily pads float in January. Home of the Steam Hall, a plow depot, and the north's best soup.","facts":[],"cx":960,"cy":337,"bb":[890,287,1030,387]},{"id":"battle-resort-survival-area","name":"Battle Resort Survival Area","t":"p","g":"settle","kind":"area","x":1378,"y":387,"sum":"A League-run wilderness school on the north end of the Battle Resort's west arm: a log palisade, a ten-station course, a lighthouse, and an unshakable rule that nobody here is impressed by your badges.","facts":[],"cx":1378,"cy":387,"bb":[1308,337,1448,437]},{"id":"sandalstraw-town","name":"Sandalstraw Town","t":"p","g":"settle","kind":"town","x":719,"y":585,"sum":"A cold-country craft town of about 5,500 at the north knuckle of the west ring road, famous for woven straw, trail footwear and moon-watching. A Contest Center, a Ranger marine office and a very old straw giant share its small streets.","facts":[],"cx":719,"cy":585,"bb":[649,535,789,635]},{"id":"shelter-town","name":"Shelter Town","t":"p","g":"settle","kind":"town","x":800,"y":500,"sum":"A refuge town built around one rule: nobody is turned away from a storm. Its Long Hall can shelter eight hundred people, and its bell can be heard across the foothills.","facts":[],"cx":800,"cy":500,"bb":[730,450,870,550]},{"id":"iron-island","name":"Iron Island","t":"p","g":"settle","kind":"island","x":438,"y":719,"sum":"A red-brown rock island with one village, two mines and a standing argument about the future. About 1,300 miners, wranglers and families live on it, and a handful of Steelix are closer to colleagues than livestock.","facts":[],"cx":438,"cy":719,"bb":[368,669,508,769]},{"id":"lucario-kingdom","name":"Lucario Kingdom","t":"p","g":"land","kind":"landmark","x":1134,"y":648,"sum":"Six limestone terraces rise from oak and birch forest to a bare plateau above the sea. From Route 226 the massif looks like a stair leading to a throne. Locals call it the Stair; the plateau is the Crown; and the community living on it is the Kingdom.","facts":[["Access","from the Kingdom Gate Post on Route 226; half a day to the lower terraces. The upper terraces are closed."]],"cx":1134,"cy":648,"bb":[1064,598,1204,698]},{"id":"battle-resort-fight-area","name":"Battle Resort Fight Area","t":"p","g":"settle","kind":"area","x":1330,"y":611,"sum":"The Resort's arena district: floodlit stadiums, rows of dojos and a public scoreboard that ranks everybody. A city of sparring yards around one great stadium, where reputation is the only currency nobody inflates.","facts":[],"cx":1330,"cy":611,"bb":[1260,561,1400,661]},{"id":"battle-resort-port","name":"Battle Resort Port","t":"p","g":"land","kind":"landmark","x":1588,"y":606,"sum":"The Gate. Everyone and almost everything that enters the Battle Resort comes through Port Head. It is a plain, busy harbor: gray piers, rust-streaked cranes, a stack of fruit crates, and a long low building called the Gate Hall, where staff check passes and Pokémon.","facts":[],"cx":1588,"cy":606,"bb":[1518,556,1658,656]},{"id":"resort-area","name":"Resort Area","t":"p","g":"settle","kind":"area","x":1690,"y":666,"sum":"The Battle Resort's holiday town at the island's southeastern tip: white-sand coves, terraced hotels, a spa fed by volcanic springs, and the people who keep all of it running. Where Sinnoh's winners go to rest, and where those who would like to be mistaken for them go to be seen.","facts":[],"cx":1690,"cy":666,"bb":[1620,616,1760,716]},{"id":"lily-of-the-valley-conference","name":"Lily of the Valley Conference","t":"p","g":"land","kind":"landmark","x":1700,"y":741,"sum":"The Stage. Lily of the Valley is a pretty island with a purpose. The whole of it, a low green hill, a sandy shore and a ring of paths, was cleared and planted for one event: the League's annual public tournament. The rest of the year it is a caretaker's village and a very quiet garden.","facts":[],"cx":1700,"cy":741,"bb":[1630,691,1770,791]},{"id":"squallville","name":"Squallville","t":"p","g":"settle","kind":"town","x":558,"y":771,"sum":"A slate-roofed headland harbor of about 4,000, where the sea weather arrives first and everyone lives by forecast. Fishers, ore haulers and weather-watchers share a harbor too small for all of them.","facts":[],"cx":558,"cy":771,"bb":[488,721,628,821]},{"id":"eterna-forest","name":"Eterna Forest","t":"p","g":"land","kind":"landmark","x":625,"y":795,"sum":"A dense old-growth forest, dim even at noon. The canopy is heavy, the trails narrow, and on a windless day it is among the quietest places in Sinnoh.","facts":[],"cx":625,"cy":795,"bb":[555,745,695,845]},{"id":"eterna-city","name":"Eterna City","t":"p","g":"settle","kind":"city","x":781,"y":754,"sum":"An old forest-edge city of about 30,000, proud of its history and its greenery. Quieter than Jubilife, older than Hearthome, and a bit stuck in its ways.","facts":[["Gym","Gardenia · Grass-type · Forest Badge"]],"cx":781,"cy":754,"bb":[711,704,851,804]},{"id":"celestic-town","name":"Celestic Town","t":"p","g":"settle","kind":"town","x":1051,"y":768,"sum":"A small, stubborn town of stone houses, wind bells and long memories on Mt. Coronet's east shoulder. Sinnoh's keeper of old stories, and a place that has never once been in a hurry.","facts":[],"cx":1051,"cy":768,"bb":[981,718,1121,818]},{"id":"veilstone-city","name":"Veilstone City","t":"p","g":"settle","kind":"city","x":1498,"y":858,"sum":"A fast-growing coastal city on Sinnoh's eastern cliffs. Department stores, cranes, wind and the sea, with a Gym that still thinks mountains are the best teachers.","facts":[["Gym","Maylene · Fighting-type · Cobble Badge"]],"cx":1498,"cy":858,"bb":[1428,808,1568,908]},{"id":"dandelion-island","name":"Dandelion Island","t":"p","g":"settle","kind":"island","x":1618,"y":870,"sum":"A small island in the east sea, a short ferry hop from Veilstone, where about nine hundred people live among wind-mills, seed vaults and drifting fluff, and where every spring the sky fills with Hoppip.","facts":[],"cx":1618,"cy":870,"bb":[1548,820,1688,920]},{"id":"champions-port","name":"Champion's Port","t":"p","g":"settle","kind":"town","x":1723,"y":894,"sum":"A tidy, nervous harbor town on the southwest shore of the League's island, where every challenger spends three days being patient. The ferry brings hopefuls in; the Pavilion road takes the survivors out.","facts":[],"cx":1723,"cy":894,"bb":[1653,844,1793,944]},{"id":"elite-four-island","name":"Elite Four Island","t":"p","g":"settle","kind":"island","x":1734,"y":854,"sum":"The Pokémon League's headquarters island in the east sea: a small administrative city on a mountain's skirt, where the Elite Four and the Champion work and where Sinnoh's best trainers are tested and recorded.","facts":[],"cx":1734,"cy":854,"bb":[1664,804,1804,904]},{"id":"chocovine-town","name":"Chocovine Town","t":"p","g":"settle","kind":"town","x":457,"y":901,"sum":"A terraced coast town of about 8,000 built on cocoa, Poffins and the memory of a failed vineyard. Warm brick, warm air, and a roasting smell you can follow from three miles away. A Contest Center sits at its heart.","facts":[],"cx":457,"cy":901,"bb":[387,851,527,951]},{"id":"floaroma-flower-fields","name":"Floaroma Flower Fields","t":"p","g":"land","kind":"landmark","x":531,"y":928,"sum":"A gentle quilt of terraced flower beds, dye plots and wild meadow that supplies half of Sinnoh's cut flowers. In summer the whole slope is a color-field: lavender, lily, poppy, marigold and an unreasonable amount of clover. In winter it is brown stubble and quiet fields under snow.","facts":[],"cx":531,"cy":928,"bb":[461,878,601,978]},{"id":"floaroma-town","name":"Floaroma Town","t":"p","g":"settle","kind":"town","x":556,"y":989,"sum":"A flower-and-honey town of a few thousand people, north of Jubilife. Pretty by design, practical underneath. Floaroma lives off flowers, honey, dye plants and herbal remedies. Every wall has a window box, every corner has a planter, and the whole town smells like three different honeys at once.","facts":[],"cx":556,"cy":989,"bb":[486,939,626,1039]},{"id":"valley-windworks","name":"Valley Windworks","t":"p","g":"land","kind":"landmark","x":691,"y":996,"sum":"Sinnoh's largest renewable power complex: two wind ridges and a small pumped-storage reservoir that together supply Jubilife, Floaroma, Eterna and Oreburgh. It is publicly owned, run by the Coronet Valley Power Authority (CVPA), and one of the few places in the region where every citizen thinks the same thing: thank goodness it is there.","facts":[],"cx":691,"cy":996,"bb":[621,946,761,1046]},{"id":"206-bridge","name":"206 Bridge","t":"p","g":"land","kind":"landmark","x":788,"y":931,"sum":"A long steel deck on older stone piers across a river gorge: the single most photographed object on the Cycling Road. The stone is centuries old and part of the original trade road; the deck and cables were added forty years ago, and a glass-floored viewing span was added five years later because tourists would not stop asking for one.","facts":[],"cx":788,"cy":931,"bb":[718,881,858,981]},{"id":"mt-coronet-and-spear-pillar","name":"Mt. Coronet and Spear Pillar","t":"p","g":"land","kind":"landmark","x":938,"y":1001,"sum":"Mt. Coronet is the backbone of Sinnoh and the reason most of its maps have a gap in the middle. It is not one peak but a long, broken massif of cold rock, hanging valleys, glaciers and snowfields, riddled with caves and magnetic ground, and ringed by towns that argue about what it means.","facts":[["Access","the mountain is crossed by three maintained tunnels (Mt. Coronet Pass, the Coronet Spine, Route 207); the summit is closed by League order"]],"cx":938,"cy":1001,"bb":[868,951,1008,1051]},{"id":"gracidea-flower-garden","name":"Gracidea Flower Garden","t":"p","g":"land","kind":"landmark","x":1002,"y":1047,"sum":"A bowl of meadow tucked into a fold of the mountain, protected from wind on three sides and open to the south. Sunlight pools there for hours after it has left the valley below. In late spring the whole bowl turns pink, in a bloom that lasts roughly three weeks, and the slopes around it hum.","facts":[["Access","the Meadow Path, about two days on foot from Emeragrove; Garden Society permit required in bloom season"]],"cx":1002,"cy":1047,"bb":[932,997,1072,1097]},{"id":"michina-ruins","name":"Michina Ruins","t":"p","g":"land","kind":"landmark","x":1089,"y":943,"sum":"The Ruins are a stepped complex of stone courts and galleries, cut into the slope above the Mirror Tarn's inlet, with the Old Road running straight into its gate. It is silent most of the day. Visitors tend to lower their voices without being asked.","facts":[["Access","half a day on the Pilgrims' Spur from town; open to visitors with a Dig House pass"]],"cx":1089,"cy":943,"bb":[1019,893,1159,993]},{"id":"michina-town","name":"Michina Town","t":"p","g":"settle","kind":"town","x":1119,"y":937,"sum":"A stone-and-wool town in a high bowl on Mt. Coronet's east face, built for the road to the Ruins and still arguing about who the road belongs to.","facts":[],"cx":1119,"cy":937,"bb":[1049,887,1189,987]},{"id":"emeragrove-town","name":"Emeragrove Town","t":"p","g":"settle","kind":"town","x":1154,"y":1037,"sum":"A terraced garden town on the slope above Route 209, famous for its hedges, glasshouses, honey, and an annual festival of saying thank you. The people here are kind, a little competitive, and absolutely certain about compost.","facts":[],"cx":1154,"cy":1037,"bb":[1084,987,1224,1087]},{"id":"solaceon-town","name":"Solaceon Town","t":"p","g":"settle","kind":"town","x":1222,"y":984,"sum":"A quiet valley town of scholars, breeders and travelers. Famous for its Day Care and its ruins, and the hinge on which the Hearthome-to-Veilstone road turns.","facts":[],"cx":1222,"cy":984,"bb":[1152,934,1292,1034]},{"id":"crown-city","name":"Crown City","t":"p","g":"settle","kind":"city","x":1575,"y":1017,"sum":"The richest and most polished city in eastern Sinnoh: white bluffs, a deep harbor, trading houses, private academies and excellent restaurants. It has a very large number of opinions about Gyms and does not have one.","facts":[],"cx":1575,"cy":1017,"bb":[1505,967,1645,1067]},{"id":"canalave-city","name":"Canalave City","t":"p","g":"settle","kind":"city","x":321,"y":1058,"sum":"A canal-cut harbor city of salt wind, steel and old paper. Shipwrights and librarians share one hill and rarely agree on the budget.","facts":[["Gym","Byron · Steel-type · Mine Badge"]],"cx":321,"cy":1058,"bb":[251,1008,391,1108]},{"id":"jubilife-city","name":"Jubilife City","t":"p","g":"settle","kind":"city","x":550,"y":1162,"sum":"Sinnoh's largest city and its primary center for media, technology, communications, commerce, and League administration. Jubilife is fast-growing, ambitious, expensive, noisy, and seemingly always under construction.","facts":[],"cx":550,"cy":1162,"bb":[480,1112,620,1212]},{"id":"alamos-town","name":"Alamos Town","t":"p","g":"settle","kind":"town","x":677,"y":1099,"sum":"A poplar-lined hill town on a small lake, famous for lake-aged cheese, quarry stone and a very stubborn preservation society. Alamos is where Oreburgh's miners go on their rest-week and where Jubilife people go to feel like they are in the country. The town clings to a terraced hillside above the lake, with poplars in rows along every path and cheese caves cut into the quarry wall.","facts":[],"cx":677,"cy":1099,"bb":[607,1049,747,1149]},{"id":"oreburgh-city","name":"Oreburgh City","t":"p","g":"settle","kind":"city","x":774,"y":1172,"sum":"A coal-and-fossil mining city in the south-west, home of Roark and the Coal Badge. Miners, a mining museum and a lot of dust.","facts":[["Gym","Roark · Rock-type · Coal Badge"]],"cx":774,"cy":1172,"bb":[704,1122,844,1222]},{"id":"hearthome-city","name":"Hearthome City","t":"p","g":"settle","kind":"city","x":1124,"y":1120,"sum":"Sinnoh's cultural capital: theaters, Contests, fashion, music and a central plaza that never quite empties. Larger and warmer than Eterna, less corporate than Jubilife.","facts":[["Gym","Fantina · Ghost-type · Relic Badge"]],"cx":1124,"cy":1120,"bb":[1054,1070,1194,1170]},{"id":"majolica-town","name":"Majolica Town","t":"p","g":"settle","kind":"town","x":1223,"y":1165,"sum":"A tile-roofed pottery town of kiln smoke, glazed streets and a Contest hall famous for its trophies. Where Hearthome comes to buy plates and Coordinators come to be seen.","facts":[],"cx":1223,"cy":1165,"bb":[1153,1115,1293,1215]},{"id":"valor-lakefront-and-grand-festival","name":"Valor Lakefront and Grand Festival","t":"p","g":"land","kind":"landmark","x":1519,"y":1200,"sum":"A broad cold lake, a grand old hotel, and the stage where the year's best Coordinators compete for the Grand Festival title. The most glamorous address in the east for one week a year, and a plain, pretty lakeshore for the other fifty-one.","facts":[],"cx":1519,"cy":1200,"bb":[1449,1150,1589,1250]},{"id":"brussel-town","name":"Brussel Town","t":"p","g":"settle","kind":"town","x":1598,"y":1175,"sum":"A ridgeline town of glasshouses and sawmills at the edge of the Brusselwood, where the whole slope glows amber at night and the Contest Hall used to be a greenhouse.","facts":[],"cx":1598,"cy":1175,"bb":[1528,1125,1668,1225]},{"id":"arrowroot-town","name":"Arrowroot Town","t":"p","g":"settle","kind":"town","x":1639,"y":1116,"sum":"A river-mill town that smells of warm starch and baked sugar, where the Poffin ovens are always on and the Contest Hall stage is backed by a working waterwheel.","facts":[],"cx":1639,"cy":1116,"bb":[1569,1066,1709,1166]},{"id":"camellia-town","name":"Camellia Town","t":"p","g":"settle","kind":"town","x":1733,"y":1194,"sum":"A small hill town of tea terraces, camellia-oil presses and a shrine that blooms in the dead of winter. It has no Contest hall and is the quietest rest stop on the eastern peninsula.","facts":[],"cx":1733,"cy":1194,"bb":[1663,1144,1803,1244]},{"id":"sunyshore-city","name":"Sunyshore City","t":"p","g":"settle","kind":"city","x":1791,"y":1166,"sum":"A bright, breezy harbor city that runs on sunlight and argues about it. The last stop before the sea crossings to the Elite Four island and the Conference island, and home to the Beacon Badge.","facts":[["Gym","Marina · Flying-type · Beacon Badge"]],"cx":1791,"cy":1166,"bb":[1721,1116,1861,1216]},{"id":"verity-lakefront","name":"Verity Lakefront","t":"p","g":"land","kind":"landmark","x":388,"y":1345,"sum":"A broad, shallow, quiet lake in the southwest corner of Sinnoh, ringed with reedbeds and low hills. Twinleaf children grow up swimming and skipping stones here; nearly every famous trainer from the town has a story about the water.","facts":[],"cx":388,"cy":1345,"bb":[318,1295,458,1395]},{"id":"sandgem-town","name":"Sandgem Town","t":"p","g":"settle","kind":"town","x":557,"y":1345,"sum":"A seaside town and home of the Sandgem Pokémon Research Laboratory, now directed by Professor Lydia Hawthorne.","facts":[],"cx":557,"cy":1345,"bb":[487,1295,627,1395]},{"id":"bewilder-forest","name":"Bewilder Forest","t":"p","g":"land","kind":"landmark","x":581,"y":1257,"sum":"A broad belt of old oak and beech woodland that has never been properly surveyed. The Rangers say that is on purpose. It is not a hostile forest: it is confusing, a place where trails split, hollows echo and nobody agrees on which way north is.","facts":[],"cx":581,"cy":1257,"bb":[511,1207,651,1307]},{"id":"grand-marsh","name":"Grand Marsh","t":"p","g":"land","kind":"landmark","x":1124,"y":1345,"sum":"Sinnoh's great wetland: a licensed, guided wildlife area of reed seas, boardwalks, mud flats and drowned orchards, feeding the Pastoria delta. The best place in the region to see out-of-region species living a legal, supervised life.","facts":[],"cx":1124,"cy":1345,"bb":[1054,1295,1194,1395]},{"id":"safari-zone","name":"Safari Zone","t":"p","g":"land","kind":"landmark","x":1172,"y":1284,"sum":"A fenced, licensed preserve of savanna, rainforest and wetland east of the Grand Marsh, stocked with species from every region. It is the legal home of Sinnoh's out-of-region Pokémon, and the likeliest source when one turns up on a road.","facts":[],"cx":1172,"cy":1284,"bb":[1102,1234,1242,1334]},{"id":"neighborly-town","name":"Neighborly Town","t":"p","g":"settle","kind":"town","x":1541,"y":1240,"sum":"The east's great crossroads and its friendliest address. Five roads meet at a bell tower, strangers are expected to eat at the community table, and the Contest crowd fills every bed in town.","facts":[],"cx":1541,"cy":1240,"bb":[1471,1190,1611,1290]},{"id":"daybreak-town","name":"Daybreak Town","t":"p","g":"settle","kind":"town","x":1753,"y":1261,"sum":"A fishing village at the eastern tip of the peninsula, where the sun first touches Sinnoh and the Contest stage is a headland that faces the dawn.","facts":[],"cx":1753,"cy":1261,"bb":[1683,1211,1823,1311]},{"id":"twinleaf-town","name":"Twinleaf Town","t":"p","g":"settle","kind":"town","x":432,"y":1399,"sum":"A small, quiet town in south-western Sinnoh, at the start of Route 201 and a short walk from Lake Verity.","facts":[],"cx":432,"cy":1399,"bb":[362,1349,502,1449]},{"id":"sandgem-port","name":"Sandgem Port","t":"p","g":"land","kind":"landmark","x":560,"y":1392,"sum":"The southwest's passenger door to the world. Sandgem Port is a working harbor of seven quays, a fish market, a customs shed and a lighthouse on a long breakwater. It handles Oreburgh's ore (via Route 237), Sandgem's fish and berries, and every overseas passenger who prefers a ship to a plane.","facts":[],"cx":560,"cy":1392,"bb":[490,1342,630,1442]},{"id":"pastoria-city","name":"Pastoria City","t":"p","g":"settle","kind":"city","x":1280,"y":1394,"sum":"A delta city of boardwalks, canals and stilted roofs where the Grand Marsh drains into the sea. Rain is the weather, water is the road, and nobody here is surprised by mud.","facts":[["Gym","Crasher Wake · Water-type · Fen Badge"]],"cx":1280,"cy":1394,"bb":[1210,1344,1350,1444]},{"id":"sage-town","name":"Sage Town","t":"p","g":"settle","kind":"town","x":928,"y":1598,"sum":"A quiet southern coast town of herb terraces, salt pans and smokehouses, famous for sage bundles, spice blends and a Contest hall that judges cooking as seriously as appeal. Smells of smoke, salt and something green.","facts":[],"cx":928,"cy":1598,"bb":[858,1548,998,1648]},{"id":"south-sinnoh-port","name":"South Sinnoh Port","t":"p","g":"land","kind":"landmark","x":1050,"y":1679,"sum":"The region's main freight and international port, at the far southern tip: cranes, container stacks, a quarantine yard, and a thousand small tales of what came in the hold. Foreign species arrive here, legally and otherwise.","facts":[],"cx":1050,"cy":1679,"bb":[980,1629,1120,1729]},{"id":"route-201","name":"Route 201","t":"r","g":"route","kind":"route","nick":"The First Road","sum":"One of Sinnoh's gentlest trainer routes and, for generations of children from Twinleaf, the first stretch of wilderness that feels truly independent. Most beginners spend a night on it, usually at Willowbank Camp.","facts":[["Connects","Twinleaf Town ↔ Sandgem Town"],["Travel time","2 days on foot"],["Danger","★☆☆☆☆"]],"segs":[[[432,1388],[429,1365],[439,1357],[455,1356],[491,1342],[544,1345],[554,1334],[557,1335]]],"bb":[429,1334,557,1388],"cx":493,"cy":1361},{"id":"route-202","name":"Route 202","t":"r","g":"route","kind":"route","nick":"","sum":"Route 202 is where Sinnoh's beginner journey becomes a real expedition. Leaving Sandgem Town, the route passes through coastal farmland and gradually enters a broad belt of mixed woodland before emerging into the increasingly developed outskirts of Jubilife City. The route is well traveled and maintained, but its length means trainers must manage food, camps, weather, and their Pokémon for several consecutive days.","facts":[["Connects","Sandgem Town ↔ Jubilife City"],["Travel time","3–4 days on foot"],["Danger","★☆☆☆☆"]],"segs":[[[557,1335],[553,1312],[543,1295],[542,1274],[546,1267],[546,1256],[538,1246],[536,1232],[546,1222],[546,1215],[556,1192],[557,1175],[562,1166],[559,1154],[552,1151]]],"bb":[536,1151,562,1335],"cx":549,"cy":1243},{"id":"route-203","name":"Route 203","t":"r","g":"route","kind":"route","nick":"","sum":"Route 203 is where Sinnoh stops feeling gentle. The farmland east of Jubilife gives out quickly, replaced by scrubland, exposed rock and a haze of mine dust that hangs over the approach to Oreburgh on still days.","facts":[["Connects","Jubilife City ↔ Oreburgh City"],["Travel time","1–2 days on foot"],["Danger","★★☆☆☆"]],"segs":[[[552,1151],[564,1163],[595,1161],[605,1173],[610,1175],[617,1175],[630,1164],[635,1164],[641,1170],[652,1171],[663,1163],[671,1164],[685,1157],[687,1159],[695,1157],[715,1169],[758,1168],[781,1164]]],"bb":[552,1151,781,1175],"cx":666,"cy":1163},{"id":"route-204","name":"Route 204","t":"r","g":"route","kind":"route","nick":"The Flower Road","sum":"The short, gentle stretch where Jubilife's noise fades and the countryside returns. It is the League's easiest second route, heavily patrolled and well signed.","facts":[["Connects","Jubilife City ↔ Floaroma Town"],["Travel time","1 day on foot"],["Danger","★☆☆☆☆"]],"segs":[[[552,1151],[549,1138],[541,1130],[532,1107],[530,1078],[533,1067],[549,1046],[550,1036],[546,1029],[546,1013],[551,1003],[551,988],[558,980]]],"bb":[530,980,558,1151],"cx":544,"cy":1065},{"id":"route-205","name":"Route 205","t":"r","g":"route","kind":"route","nick":"The River Path","sum":"A gentle riverside walk through meadow and light woodland, then the long, dim passage through Eterna Forest. It is the last easy route before the heart of Sinnoh.","facts":[["Connects","Floaroma Town ↔ Eterna Forest ↔ Eterna City"],["Travel time","2 days on foot"],["Danger","★★☆☆☆"]],"segs":[[[558,980],[584,980],[587,977],[587,972],[599,958],[600,945],[605,937],[605,928],[621,902],[628,877],[628,854],[620,831],[618,805],[634,804],[635,792],[631,788],[635,789],[639,786],[650,785],[659,775],[660,763],[668,756],[675,756],[684,766],[686,772],[702,784],[715,787],[732,787],[741,777],[742,757],[750,747],[755,747],[765,755],[788,744],[793,755]],[[558,980],[564,987],[564,996],[583,1006],[612,1007],[631,1014],[671,1016],[684,1005],[698,1004]]],"bb":[558,744,793,1016],"cx":675,"cy":880},{"id":"route-206","name":"Route 206","t":"r","g":"route","kind":"route","nick":"The Cycling Road","sum":"Two lanes of tarmac for wheels and a gravel verge for walkers, laid on a long steady grade down the mountain's western flank. Eterna sits higher than Oreburgh, so southbound riders coast for a day and northbound riders earn every kilometer.","facts":[["Connects","Eterna City ↔ Oreburgh City, via the 206 Bridge"],["Travel time","5–6 days on foot; 2–3 days by bicycle"],["Danger","★★☆☆☆"]],"segs":[[[793,755],[794,759],[783,770],[783,784],[791,798],[791,822],[796,830],[796,849],[791,859],[791,893],[787,898],[787,917],[796,926],[797,937],[792,943],[792,964],[805,979],[805,988],[798,996],[798,999],[811,1008],[811,1018],[805,1025],[805,1032],[816,1043],[816,1053],[806,1062],[786,1062],[782,1067],[782,1073],[787,1079],[787,1086],[780,1093],[779,1098],[789,1108],[789,1116],[784,1123],[784,1141],[776,1156],[781,1164]]],"bb":[776,755,816,1164],"cx":796,"cy":959},{"id":"route-207","name":"Route 207","t":"r","g":"route","kind":"route","nick":"The Southern Crossing","sum":"A maintained tunnel and cut-through that connects Oreburgh's mining country with Hearthome's meadows. Cooler, darker and louder than Route 211, but far more trafficked: ore haulers, couriers and miners use it daily.","facts":[["Connects","Oreburgh City ↔ Route 208 ↔ Hearthome City"],["Travel time","1–2 days (mostly underground)"],["Danger","★★★☆☆"]],"segs":[[[781,1164],[788,1160],[804,1137],[809,1137],[821,1130],[827,1133],[831,1132],[834,1135],[842,1133],[848,1136],[853,1133],[856,1134],[863,1128],[892,1127],[897,1131],[900,1129],[908,1133],[919,1132],[929,1134],[933,1130],[944,1129]]],"bb":[781,1127,944,1164],"cx":862,"cy":1145},{"id":"route-208","name":"Route 208","t":"r","g":"route","kind":"route","nick":"The Meadow Road","sum":"After the cold stone of the southern tunnel on Route 207, Route 208 opens into a river valley of meadows and berry patches with Hearthome's skyline in the distance. It is the first place travelers feel warmth in a day.","facts":[["Connects","Route 207 (southern Coronet tunnel from Oreburgh City) ↔ Hearthome City"],["Travel time","1 day on foot"],["Danger","★★☆☆☆"]],"segs":[[[944,1129],[947,1127],[965,1140],[972,1142],[983,1139],[992,1132],[1003,1131],[1007,1136],[1018,1140],[1049,1138],[1068,1128],[1104,1129],[1109,1127],[1118,1134],[1128,1134],[1136,1127],[1136,1118],[1132,1112]]],"bb":[944,1112,1136,1142],"cx":1040,"cy":1127},{"id":"route-209","name":"Route 209","t":"r","g":"route","kind":"route","nick":"The Quiet Road","sum":"Open country, rolling hills and low stone walls, with a very old place at its center: the Lost Tower, a haunting memorial that locals visit and tourists avoid.","facts":[["Connects","Hearthome City ↔ Solaceon Town"],["Travel time","2–3 days on foot"],["Danger","★★☆☆☆ (★★★☆☆ near the Lost Tower at night)"]],"segs":[[[1132,1112],[1159,1112],[1167,1104],[1173,1091],[1182,1081],[1206,1070],[1216,1059],[1219,1051],[1219,1041],[1216,1038],[1214,1029],[1214,1017],[1220,999],[1219,989],[1215,983],[1222,975]],[[1132,1112],[1126,1107],[1126,1099],[1144,1080],[1144,1068],[1140,1064],[1138,1054],[1145,1047],[1156,1045],[1162,1031]],[[1162,1031],[1170,1026],[1194,1002],[1202,998],[1222,975]]],"bb":[1126,975,1222,1112],"cx":1174,"cy":1043},{"id":"route-210","name":"Route 210","t":"r","g":"route","kind":"route","nick":"The Moor Road","sum":"Wind-swept hills, heather and fog on the mountain's eastern flank. It feels remote, though it is not far from civilization. This is the road pilgrims, scholars and mountain travelers take when they leave Celestic Town.","facts":[["Connects","Celestic Town ↔ Solaceon Town ↔ Route 215 junction"],["Travel time","2 days (Celestic to Solaceon); 1 day (Solaceon to the Route 215 junction)"],["Danger","★★☆☆☆"]],"segs":[[[1061,769],[1071,772],[1081,770],[1092,772],[1098,779],[1118,771],[1127,782],[1132,783],[1137,788],[1144,802],[1151,809],[1172,816],[1188,827],[1203,830],[1214,840],[1217,851],[1213,856],[1213,867],[1226,883],[1228,899],[1222,912],[1222,924],[1231,935],[1232,940],[1229,962],[1222,969],[1222,975]]],"bb":[1061,769,1232,975],"cx":1146,"cy":872},{"id":"route-211","name":"Route 211","t":"r","g":"route","kind":"route","nick":"The Mountain Road","sum":"A steady climb out of Eterna's greenery into bare rock, scree and wind. It marks the end of the \"gentle\" part of Sinnoh. Here the mountain starts to dictate the pace.","facts":[["Connects","Eterna City ↔ Mt. Coronet Pass ↔ Celestic Town"],["Travel time","1 day on foot"],["Danger","★★★☆☆"]],"segs":[[[793,755],[806,756],[811,754],[821,756],[831,767],[840,767],[845,763],[885,761],[889,764],[897,764],[908,761],[922,771],[934,771],[939,767],[943,768],[962,763],[974,778],[995,776],[997,771],[1017,774],[1020,771],[1024,772],[1029,767],[1056,764],[1061,769]],[[953,598],[956,604],[947,618],[942,638],[954,652],[958,651],[963,659],[963,666],[957,668],[955,677],[958,685],[965,692],[964,703],[970,725],[969,729],[978,743],[976,754],[980,776],[966,780],[967,784],[963,794],[966,812],[963,819],[956,824],[952,833],[965,861],[975,870],[985,888],[985,906],[975,933],[982,937],[982,942],[986,944],[983,971],[992,982],[988,994],[980,1000],[980,1005],[976,1009],[975,1029],[980,1035],[969,1048],[966,1056],[961,1058],[957,1071],[957,1086],[947,1097],[941,1111],[944,1129]]],"bb":[793,598,1061,1129],"cx":927,"cy":863},{"id":"route-212","name":"Route 212","t":"r","g":"route","kind":"route","nick":"The Reed Road","sum":"South of Hearthome the farmland dissolves into drainage country: reed beds, braided creeks, old dikes and raised log causeways. The ground is never quite solid and never quite water. Two boundaries press on the road: the Safari Zone's tall perimeter wall to the east, and the Grand Marsh's open boardwalk edge to the west.","facts":[["Connects","Hearthome City ↔ Pastoria City"],["Travel time","6–8 days on foot (about 5 days by the paved Route 240 and Route 242 detour through Majolica Town)"],["Danger","★★★☆☆"]],"segs":[[[1132,1112],[1132,1130],[1146,1145],[1144,1164],[1152,1178],[1154,1193],[1144,1205],[1143,1222],[1139,1235],[1119,1256],[1112,1267],[1110,1285],[1118,1293],[1128,1298],[1141,1311],[1144,1319],[1146,1342],[1170,1363],[1174,1371],[1188,1383],[1218,1395],[1225,1390],[1231,1390],[1235,1385],[1280,1388],[1285,1384]]],"bb":[1110,1112,1285,1395],"cx":1197,"cy":1253},{"id":"route-213","name":"Route 213","t":"r","g":"route","kind":"route","nick":"The Sea Road","sum":"A paved coastal highway of delta flats, red sea cliffs, humming dunes and long empty beaches, always with the East Sea on the right-hand side. It is the most beautiful road in the south and the easiest to underestimate: the sea is close, the storms are sudden, and the cliffs are softer than they look.","facts":[["Connects","Pastoria City ↔ Neighborly Town"],["Travel time","4 days on foot (2 by bike or coastal bus)"],["Danger","★★☆☆☆"]],"segs":[[[1285,1384],[1283,1380],[1302,1365],[1329,1337],[1340,1331],[1359,1329],[1396,1292],[1444,1279],[1466,1264],[1482,1257],[1523,1249],[1530,1243],[1530,1238],[1538,1230],[1541,1230]]],"bb":[1283,1230,1541,1384],"cx":1412,"cy":1307},{"id":"route-214","name":"Route 214","t":"r","g":"route","kind":"route","nick":"The Gold Road","sum":"Locals call it that because every second vehicle has a sponsor's name on the door. Eastern Sinnoh's main artery: freight trucks, Contest coaches, commuter buses, cyclists in team colors, Gym challengers with sore knees and, in the summer, a steady line of Coordinators heading for the Grand Festival.","facts":[["Connects","Veilstone City ↔ Crown City (by the Crown Spur) ↔ Valor Lakefront and Grand Festival ↔ Neighborly Town"],["Travel time","3 days on foot Veilstone to Crown City; 6 days Veilstone to Neighborly by the Lake Road (about half that by bicycle or bus)"],["Danger","★☆☆☆☆"]],"segs":[[[1510,858],[1509,866],[1530,882],[1547,883],[1552,880],[1562,879],[1567,884],[1568,921],[1565,924],[1565,930],[1548,951],[1548,984],[1566,1007],[1579,1006],[1584,1011]],[[1584,1011],[1579,1006],[1566,1007],[1562,998],[1551,987],[1546,987],[1536,999],[1534,1005],[1533,1043],[1522,1061],[1522,1091],[1534,1113],[1534,1137],[1523,1157],[1522,1164],[1526,1169],[1522,1182],[1528,1187],[1526,1193],[1528,1195],[1527,1212],[1530,1226],[1541,1230]]],"bb":[1509,858,1584,1230],"cx":1546,"cy":1044},{"id":"route-215","name":"Route 215","t":"r","g":"route","kind":"route","nick":"The Highland Road","sum":"A long, rain-prone highland trail that climbs out of the Solaceon valley and descends toward Veilstone's cliffs. Wind farms appear first as flickering lights on the horizon and later as a forest of slow white blades.","facts":[["Connects","Route 210 junction (near Solaceon Town) ↔ Veilstone City"],["Travel time","4 days on foot"],["Danger","★★☆☆☆"]],"segs":[[[1225,928],[1234,932],[1269,932],[1281,928],[1309,928],[1329,919],[1336,919],[1348,928],[1356,928],[1371,917],[1393,914],[1417,889],[1431,882],[1456,881],[1468,878],[1488,866],[1501,866],[1510,858]]],"bb":[1225,858,1510,932],"cx":1367,"cy":895},{"id":"route-216","name":"Route 216","t":"r","g":"route","kind":"route","nick":"The Back Door","sum":"Where Route 217 crosses the snow country in the open, Route 216 goes into the mountain. A hard climb up a frozen gully ends in a cave mouth, and beyond it lies the North Gallery: a lit, roped, ice-glazed tunnel that runs for days toward the heart of Mt. Coronet.","facts":[["Connects","Greenstation Town ↔ the north junction of the Route 211 spine (Mt. Coronet)"],["Travel time","3–4 days on foot"],["Danger","★★★★☆"]],"segs":[[[847,432],[858,443],[860,462],[889,505],[889,529],[887,534],[893,559],[890,565],[896,576],[904,583],[915,588],[945,589],[953,598]]],"bb":[847,432,953,598],"cx":900,"cy":515},{"id":"route-217","name":"Route 217","t":"r","g":"route","kind":"route","nick":"The Long White Road","sum":"Route 217 is the north's answer to anyone who thinks Sinnoh is a chain of neighboring towns. For a week there is no town: only red marker poles, wind, a frozen lake that groans at night, and one lodge.","facts":[["Connects","Greenstation Town ↔ Acuity Lakefront ↔ Snowpoint City"],["Travel time","6–8 days on foot in settled weather; 10+ if a storm cycle pins you"],["Danger","★★★★★"]],"segs":[[[847,432],[835,439],[811,414],[809,370],[812,304],[807,291],[806,274],[817,268],[833,269],[836,266],[834,250],[837,247],[837,232],[843,226],[859,221],[871,215],[877,209],[893,209],[901,201],[901,195],[893,190]]],"bb":[806,190,901,439],"cx":853,"cy":314},{"id":"route-218","name":"Route 218","t":"r","g":"route","kind":"route","nick":"The Western Road","sum":"Sinnoh's busiest freight corridor outside Jubilife: steel, canned fish, lumber and ship's stores roll east, and passengers, machinery and Pokémon-care goods roll west. The road is fully paved, well lit at junctions and shared by trucks, coaches, cyclists and the occasional walker.","facts":[["Connects","Jubilife City ↔ Canalave City"],["Travel time","3–4 days on foot; about 2 by bicycle; the Canalave Coach (bus) takes one long day"],["Danger","★☆☆☆☆"]],"segs":[[[552,1151],[544,1151],[537,1157],[507,1158],[488,1168],[474,1170],[454,1177],[434,1175],[419,1168],[411,1160],[409,1142],[415,1127],[412,1120],[362,1120],[350,1110],[348,1090],[343,1085],[333,1082],[325,1074],[331,1067],[329,1051]]],"bb":[325,1051,552,1177],"cx":438,"cy":1114},{"id":"route-219","name":"Route 219","t":"r","g":"route","kind":"route","nick":"The Port Road","sum":"A short, flat, busy road of salt air and trucks, running through tidal flats and market gardens to the water. Almost everything that enters or leaves Sandgem by sea passes along it, and about once a week something comes down it that nobody has seen before.","facts":[["Connects","Sandgem Town ↔ Sandgem Port"],["Travel time","1 day on foot; half a day by bicycle"],["Danger","★☆☆☆☆"]],"segs":[[[557,1335],[564,1339],[568,1346],[567,1353],[558,1360],[559,1380]]],"bb":[557,1335,568,1380],"cx":562,"cy":1357},{"id":"route-220","name":"Route 220","t":"r","g":"route","kind":"route","nick":"The Long Coast Road","sum":"Sinnoh's longest unbroken seaside walk: cliffs, dunes, salt pans and fishing hamlets strung along a paved road that never quite leaves earshot of the sea. Slower than it looks. The road is paved and safe, but the villages are far apart and the weather is rarely on your side.","facts":[["Connects","Sandgem Port ↔ Sage Town"],["Travel time","5–6 days on foot; about 3 by bicycle"],["Danger","★★☆☆☆"]],"segs":[[[559,1380],[558,1359],[563,1356],[570,1356],[603,1383],[614,1389],[614,1393],[626,1394],[632,1399],[654,1402],[670,1414],[725,1467],[739,1476],[757,1483],[789,1513],[853,1550],[879,1571],[914,1587],[917,1585],[925,1585],[929,1588],[934,1586],[944,1595],[945,1602],[949,1604],[951,1610],[968,1617],[1002,1651],[1042,1674],[1057,1673]]],"bb":[558,1356,1057,1674],"cx":807,"cy":1515},{"id":"route-221","name":"Route 221","t":"r","g":"route","kind":"route","nick":"The Freight Road","sum":"This is Sinnoh's busiest trucking corridor outside Jubilife: container trucks, refrigerated vans, buses, couriers and the odd lost tourist. The road crosses the Grand Marsh's delta on a long causeway, then runs for days along cliffs and estuaries toward the cranes of the southern port.","facts":[["Connects","Pastoria City ↔ South Sinnoh Port"],["Travel time","5 days on foot (2–3 by bike or bus; trucks do it in a day)"],["Danger","★★☆☆☆"]],"segs":[[[1285,1384],[1281,1381],[1272,1382],[1263,1395],[1240,1399],[1216,1399],[1182,1438],[1168,1445],[1154,1448],[1141,1460],[1139,1471],[1153,1482],[1159,1483],[1170,1494],[1176,1504],[1176,1514],[1142,1545],[1114,1593],[1104,1604],[1094,1636],[1057,1673]]],"bb":[1057,1381,1285,1673],"cx":1171,"cy":1527},{"id":"route-222","name":"Route 222","t":"r","g":"route","kind":"route","nick":"The Sunrise Road","sum":"It runs along the south coast where the land flattens into tide flats, salt pans, dunes and low wind-bent scrub, and because it points east, travelers walk toward the dawn for much of every morning. Locals measure distances in tides, not hours: \"two tides to Daybreak\" is the Neighborly way of saying a day and a half.","facts":[["Connects","Neighborly Town ↔ the Sunrise Fork ↔ Daybreak Town and Camellia Town (with a paved link on from Camellia to Sunyshore City)"],["Travel time","3 days on foot Neighborly to the Sunrise Fork; half a day on to Daybreak or Camellia; one more day from Camellia to Sunyshore (about half that by bicycle)"],["Danger","★☆☆☆☆"]],"segs":[[[1541,1230],[1548,1228],[1558,1237],[1568,1230],[1628,1229],[1643,1226],[1645,1234],[1645,1226],[1656,1223],[1672,1223],[1681,1225],[1684,1228],[1699,1230],[1730,1228],[1741,1240],[1743,1248],[1758,1248],[1761,1251],[1761,1261],[1763,1263]],[[1644,1234],[1646,1225],[1656,1223],[1672,1223],[1681,1225],[1684,1228],[1699,1230],[1722,1230],[1730,1222],[1732,1207],[1743,1197],[1742,1190],[1745,1187],[1767,1187],[1779,1176],[1788,1180],[1796,1179],[1801,1174],[1803,1166]]],"bb":[1541,1166,1803,1263],"cx":1672,"cy":1214},{"id":"route-224","name":"Route 224","t":"r","g":"route","kind":"route","nick":"The Green Road","sum":"It is the spine of the eastern peninsula, running through a belt of orchards, millstreams and the wooded ridge locals call the Brusselwood. Greenhouses glow on the ridgetop at night, timber trucks rumble through the forest margin, and anyone heading for a Contest in Arrowroot, Brussel or Neighborly eventually travels it.","facts":[["Connects","Arrowroot Town ↔ Brussel Town ↔ Neighborly Town (meeting Route 214 and Route 213 at the Neighborly junction)"],["Travel time","3 days on foot end to end (1-2 days Arrowroot to Brussel, 1-2 days Brussel to Neighborly); about 1-2 days by bicycle"],["Danger","★★☆☆☆"]],"segs":[[[1633,1107],[1640,1105],[1644,1115],[1644,1124],[1639,1130],[1637,1159],[1621,1173],[1614,1173],[1602,1163],[1596,1165],[1589,1173],[1587,1182],[1566,1198],[1550,1214],[1549,1226],[1541,1230]]],"bb":[1541,1105,1644,1230],"cx":1592,"cy":1167},{"id":"route-225","name":"Route 225","t":"r","g":"route","kind":"route","nick":"The Feeder Road","sum":"Named for the pylons that carry Sunyshore's solar power to Crown City, which march beside it the whole way. Cable, coastline and sunlight define the route: white cliffs and gull-colored sea in the first half, wide shore and glittering panels in the second.","facts":[["Connects","Crown City ↔ Arrowroot Town ↔ Sunyshore City"],["Travel time","4 days on foot end to end (Crown to Arrowroot 1-2 days, Arrowroot to Sunyshore 2 days); about 2 by bicycle"],["Danger","★★☆☆☆"]],"segs":[[[1584,1011],[1587,1020],[1582,1029],[1583,1036],[1603,1061],[1616,1085],[1625,1094],[1625,1099],[1633,1107],[1648,1104],[1655,1112],[1656,1130],[1660,1134],[1668,1137],[1742,1136],[1752,1145],[1752,1151],[1758,1157],[1772,1158],[1777,1164],[1777,1173],[1788,1180],[1796,1179],[1801,1174],[1803,1166]]],"bb":[1582,1011,1803,1180],"cx":1692,"cy":1095},{"id":"route-226","name":"Route 226","t":"r","g":"route","kind":"route","nick":"The Long Road","sum":"An ordinary highway that happens to cross four climates in ten days. It leaves Snowpoint through steam and geothermal-heated pavement, descends past Lilypad's hot springs, crosses the Thaw Line where the snow finally stops, and ends in wind and salt spray on the cliffs above Veilstone.","facts":[["Connects","Snowpoint City ↔ Lilypad Town ↔ Lucario Kingdom ↔ Veilstone City"],["Travel time","9–11 days on foot end to end; 4–6 by bicycle or mount; about 3 by long-haul coach when the road is plowed"],["Danger","★★☆☆☆"]],"segs":[[[893,190],[900,194],[901,201],[900,208],[891,217],[891,230],[913,253],[927,272],[934,295],[944,307],[947,321],[951,325],[959,326],[966,336],[966,360],[975,380],[979,384],[981,414],[1008,467],[1016,488],[1025,497],[1043,508],[1063,529],[1080,560],[1084,575],[1102,592],[1119,598],[1131,610],[1141,634],[1141,641],[1145,641],[1158,650],[1162,649],[1171,658],[1175,657],[1188,668],[1201,674],[1222,695],[1232,708],[1242,736],[1267,777],[1296,803],[1313,808],[1329,808],[1353,797],[1370,797],[1395,824],[1426,828],[1453,851],[1478,856],[1492,871],[1505,870],[1509,866],[1510,858]]],"bb":[891,190,1510,871],"cx":1200,"cy":530},{"id":"route-227","name":"Route 227","t":"r","g":"route","kind":"route","nick":"The Warm Gallery","sum":"In a country defined by cold, Route 227 is a rare place that is warm. The tunnel was bored for the narrow-gauge Lilypad Line, a freight railway that once carried ore and now carries passengers, mail, geothermal pipe and frozen fish. Heat from the mountain's hot springs runs through the rock, so the middle of the tunnel is damp, foggy and mild, with ferns growing near the lamps.","facts":[["Connects","Greenstation Town ↔ Lilypad Town"],["Travel time","2 days on foot (an overnight at the Steam Halt); about 5 hours by the Lilypad Line train"],["Danger","★★☆☆☆"]],"segs":[[[847,432],[886,433],[907,413],[916,394],[916,387],[930,372],[931,361],[949,344],[950,329],[955,325],[960,328]]],"bb":[847,325,960,433],"cx":903,"cy":379},{"id":"route-228","name":"Route 228","t":"r","g":"route","kind":"route","nick":"The Rope Road","sum":"Route 228 is paved, short and ordinary on a clear day. In a storm it becomes the reason Shelter Town exists. A guide-rope runs the whole length of the road, threaded through numbered bell posts every two hundred paces, each with a brass bell. When the snow comes in sideways, travelers hold the rope, ring the nearest bell, and walk toward the sound of the next.","facts":[["Connects","Shelter Town ↔ Greenstation Town"],["Travel time","1–2 days on foot (a long single day with an early start; most parties take two)"],["Danger","★★☆☆☆ (★★★★☆ in a blizzard)"]],"segs":[[[801,490],[808,459],[816,452],[825,455],[836,454],[837,448],[846,438],[847,432]]],"bb":[801,432,847,490],"cx":824,"cy":461},{"id":"route-229","name":"Route 229","t":"r","g":"route","kind":"route","nick":"The Snow Line Road","sum":"On Route 229 you can walk from autumn into winter in an afternoon. The road leaves Sandalstraw's orchards and farms, climbs to the grey foothills, ducks into the Foothill Cut, a long tunnel through the ridge, and emerges on the other side into snow.","facts":[["Connects","Sandalstraw Town ↔ Shelter Town"],["Travel time","2 days on foot"],["Danger","★☆☆☆☆ (★★★☆☆ once the snow closes in)"]],"segs":[[[719,575],[729,587],[743,587],[767,564],[795,530],[796,518],[803,511],[801,490]]],"bb":[719,490,803,587],"cx":761,"cy":538},{"id":"route-230","name":"Route 230","t":"r","g":"route","kind":"route","nick":"The Timber Road","sum":"Eterna's beams, barrels and charcoal come down this road, and Sandalstraw's straw goods go with them. The countryside is working woodland: larch and pine plantations in rows, sawmills on the river, charcoal clamps in clearings, and logging roads that climb into the hills on either side. It is not wilderness, and its Pokémon have adapted to saws and lorries with the cheerful pragmatism of a population that has lived beside industry for generations.","facts":[["Connects","Sandalstraw Town ↔ Eterna City"],["Travel time","2 days on foot; one day by coach"],["Danger","★☆☆☆☆"]],"segs":[[[719,575],[724,581],[724,595],[721,598],[720,663],[749,689],[749,698],[741,707],[741,715],[744,718],[753,718],[755,716],[762,726],[767,726],[790,746],[790,752],[793,755]]],"bb":[719,575,793,755],"cx":756,"cy":665},{"id":"route-231","name":"Route 231","t":"r","g":"route","kind":"route","nick":"The Heathway","sum":"This is where the ring road leaves the coast and the country gets large. The pavement crosses salt meadow, high heath, a reedy lake and a long run of hay and straw land, with no shelter except two Route Houses and the occasional herdsman's hut. Wind is constant. Sheep are everywhere.","facts":[["Connects","Squallville ↔ Sandalstraw Town"],["Travel time","3 days on foot; two by coach or bicycle"],["Danger","★★☆☆☆"]],"segs":[[[561,762],[564,753],[588,730],[603,729],[608,732],[616,732],[622,726],[637,695],[644,688],[644,682],[652,663],[681,636],[689,610],[701,597],[704,576],[714,571],[719,575]]],"bb":[561,571,719,762],"cx":640,"cy":666},{"id":"route-232","name":"Route 232","t":"r","g":"route","kind":"route","nick":"The Salt Road","sum":"Where Route 233 smells of honey and cocoa, Route 232 smells of kelp, tar and cold iron. It runs along the Long Strand and over the dune ridge, past salt pans and sea stacks, to the tidal causeway into Squallville. The wind arrives from the west with nothing between it and the horizon, and everyone on the road checks the sky as a habit.","facts":[["Connects","Chocovine Town ↔ Squallville"],["Travel time","2–3 days on foot; a long day by coach in fair weather"],["Danger","★★☆☆☆"]],"segs":[[[457,891],[459,884],[464,883],[471,876],[479,862],[524,822],[530,811],[536,790],[561,762]]],"bb":[457,762,561,891],"cx":509,"cy":826},{"id":"route-233","name":"Route 233","t":"r","g":"route","kind":"route","nick":"The Sweet Road","sum":"Honey wagons and cut-flower trucks roll one way; cocoa lorries and tins of confectionery roll the other. Coach drivers announce it as the Sweet Road at every stop, and hauliers will tell you it is the only road in Sinnoh with a smell timetable: lavender and clover near Floaroma, warm blossom through the orchards, and then, long before any chimney is visible, the dark roasted smell of Chocovine coming down the terraces on a south wind.","facts":[["Connects","Floaroma Town ↔ the Ring Junction (meeting Route 234 from Canalave City) ↔ Chocovine Town"],["Travel time","2 days on foot; one long day by coach or bicycle"],["Danger","★☆☆☆☆"]],"segs":[[[558,980],[542,994],[522,1001],[511,1008],[497,1011],[483,986],[475,960],[458,938],[457,916],[447,903],[447,898],[454,891],[457,891]]],"bb":[447,891,558,1011],"cx":502,"cy":951},{"id":"route-234","name":"Route 234","t":"r","g":"route","kind":"route","nick":"The Orchard Road","sum":"A gently rolling coastal plain of berry orchards, hedgerows and wind-bent poplars, with the sea visible on the left for the first half-day. This is the route Canalave's fishermen and shipwrights use to reach Floaroma's markets, and the route Floaroma's flower growers use to ship cut flowers to the port.","facts":[["Connects","the Route 218 fork (east of Canalave) ↔ the Route 233 ring-road junction near Floaroma Town"],["Travel time","2 days on foot; 1 by bicycle (about 3 from Canalave itself)"],["Danger","★☆☆☆☆"]],"segs":[[[412,1120],[415,1112],[438,1089],[451,1083],[456,1078],[459,1070],[481,1047],[485,1035],[491,1029],[492,1017],[497,1011]]],"bb":[412,1011,497,1120],"cx":454,"cy":1065},{"id":"route-235","name":"Route 235","t":"r","g":"route","kind":"route","nick":"The Hairpin Road","sum":"A paved mining road from an older age, once the only way to haul ore down to Jubilife, now kept open by Alamos's cheesemakers, Oreburgh's courier guild and a stubborn preservation society. It climbs more than it needs to, because the engineers who laid it were routing around two long-vanished quarries.","facts":[["Connects","Jubilife City (north-east outskirts) ↔ Alamos Town spur ↔ Oreburgh City (north gate)"],["Travel time","4 days on foot; about 2 by bicycle"],["Danger","★★☆☆☆"]],"segs":[[[552,1151],[559,1149],[572,1138],[588,1133],[601,1120],[601,1104],[597,1096],[597,1085],[602,1079],[609,1079],[613,1087],[622,1096],[640,1101],[657,1114],[672,1116],[677,1111],[682,1118],[703,1131],[729,1131],[745,1147],[762,1147],[781,1164]]],"bb":[552,1079,781,1164],"cx":666,"cy":1121},{"id":"route-236","name":"Route 236","t":"r","g":"route","kind":"route","nick":"The Coach Road","sum":"For most of Sinnoh's civilians, this is the way to Oreburgh: paved, signed and scheduled. Coaches leave Jubilife's south terminal hourly. Ore haulers, schoolchildren and business travelers ride the same road as walkers, and the trainers who take it are usually the ones who got a refund on the Route 203 tunnel.","facts":[["Connects","Jubilife City ↔ Oreburgh City, joining Route 237 for the last stretch"],["Travel time","3–4 days on foot; about a day by bicycle; the coach takes six hours"],["Danger","★☆☆☆☆"]],"segs":[[[552,1151],[559,1154],[562,1166],[561,1172],[572,1183],[572,1190],[609,1219],[628,1222],[679,1221],[687,1225],[710,1248],[740,1248],[751,1244],[765,1229],[767,1216],[772,1208],[774,1191],[790,1175],[788,1167],[781,1164]]],"bb":[552,1151,790,1248],"cx":671,"cy":1199},{"id":"route-237","name":"Route 237","t":"r","g":"route","kind":"route","nick":"The Ore Road","sum":"Oreburgh's coal and ore leave the city by this route for Sandgem Port, so the road is built for weight: broad lanes, deep gravel shoulders, weighbridges and truck stops with wash bays for Pokémon. It is the working spine of the southwest, and nobody who lives on it ever calls it quiet.","facts":[["Connects","Sandgem Town ↔ Oreburgh City, joining Route 236 for the last stretch"],["Travel time","3–4 days on foot; about 1.5 days by bicycle; ore trucks do it in a long day"],["Danger","★★☆☆☆"]],"segs":[[[557,1335],[569,1339],[580,1338],[594,1327],[605,1323],[627,1301],[632,1301],[638,1297],[664,1271],[678,1262],[690,1258],[702,1258],[710,1248],[740,1248],[751,1244],[765,1229],[767,1216],[772,1208],[774,1191],[790,1175],[788,1167],[781,1164]]],"bb":[557,1164,790,1339],"cx":673,"cy":1251},{"id":"route-238","name":"Route 238","t":"r","g":"route","kind":"route","nick":"The Woodcutters' Way","sum":"A rough track through drover's lanes, then a long wooded stretch under the broad oaks of Bewilder Forest, then out into hedged pasture on Sandgem's doorstep. Slower than Route 202, wilder, and the one where it is easiest to get lost.","facts":[["Connects","Jubilife City (south edge, near Route 202) ↔ Bewilder Forest ↔ Sandgem Town (north edge)"],["Travel time","3–4 days on foot"],["Danger","★★☆☆☆"]],"segs":[[[552,1151],[564,1163],[570,1164],[568,1207],[573,1220],[570,1246],[574,1250],[573,1270],[565,1285],[563,1304],[568,1317],[568,1328],[561,1335],[557,1335]]],"bb":[552,1151,574,1335],"cx":563,"cy":1243},{"id":"route-239","name":"Route 239","t":"r","g":"route","kind":"route","nick":"The Meltwater Road","sum":"Route 239 climbs out of Solaceon's sheltered valley into the foothills on the east face of Mt. Coronet, following a cold, milk-pale stream that begins as glacier melt on the white plateau above. It is the only way to Michina Town, and nearly everyone on it is going for one of four reasons: wool, stone, scholarship, or a question they hope the Ruins will answer.","facts":[["Connects","Solaceon Town ↔ Michina Town (with the Pilgrims' Spur on to Michina Ruins)"],["Travel time","2–3 days on foot"],["Danger","★★☆☆☆ (★★★☆☆ in spring melt, or above the Cairn Gallery after dark)"]],"segs":[[[1222,975],[1209,982],[1182,979],[1175,976],[1153,954],[1144,949],[1137,949],[1128,941]]],"bb":[1128,941,1222,982],"cx":1175,"cy":961},{"id":"route-240","name":"Route 240","t":"r","g":"route","kind":"route","nick":"The Potters' Road","sum":"A broad paved highway across gentle plain, busy with clay carts, couriers and the Kiln Line bus. Every mile is marked by a hand-glazed mile tile, and no two are alike. Locals can tell a stranger by whether they look at the tiles.","facts":[["Connects","Hearthome City ↔ Majolica Town"],["Travel time","2 days on foot (one long day by bike or the Kiln Line bus)"],["Danger","★☆☆☆☆"]],"segs":[[[1132,1112],[1136,1123],[1147,1132],[1158,1135],[1183,1152],[1204,1159],[1214,1153],[1220,1153],[1223,1156]]],"bb":[1132,1112,1223,1159],"cx":1177,"cy":1135},{"id":"route-241","name":"Route 241","t":"r","g":"route","kind":"route","nick":"The Millpond Road","sum":"A paved road over low rolling country of mill ponds, hill orchards and chalk cuttings. Windpumps turn in every field. It is the pleasant way to leave the clay country: wide verges, cider stalls, and a sense that nobody is in a hurry.","facts":[["Connects","Majolica Town (via the Route 242 junction) ↔ Route 213 at Three Gulls Crossing"],["Travel time","2–3 days on foot (a long day by bike)"],["Danger","★☆☆☆☆"]],"segs":[[[1223,1156],[1228,1166],[1228,1178],[1246,1194],[1254,1197],[1259,1202],[1273,1202],[1307,1211],[1324,1220],[1328,1224],[1330,1232],[1331,1252],[1379,1300]]],"bb":[1223,1156,1379,1300],"cx":1301,"cy":1228},{"id":"route-242","name":"Route 242","t":"r","g":"route","kind":"route","nick":"The Gate Road","sum":"The fast, safe way into Pastoria: a paved highway across farmland, then wet pasture, then reed wall and delta. It is the road the Safari Zone's buses take, so it carries more tourists than any road in the south.","facts":[["Connects","Majolica Town ↔ Pastoria City"],["Travel time","3 days on foot (two by bike or the Gate Line bus)"],["Danger","★★☆☆☆"]],"segs":[[[1223,1156],[1228,1166],[1228,1182],[1236,1192],[1244,1212],[1248,1239],[1252,1243],[1269,1243],[1258,1243],[1253,1249],[1253,1278],[1261,1318],[1264,1321],[1265,1363],[1285,1384]]],"bb":[1223,1156,1285,1384],"cx":1254,"cy":1270},{"id":"battle-resort-route-225","name":"Battle Resort Route 225","t":"r","g":"route","kind":"route","nick":"The Training Road","sum":"Everyone on this road is walking toward a test. At the south end is the Fight Area, where trainers learn to win; at the north end is the Survival Area, where they learn to endure; the Resort's \"Full Circuit\" program sells the road between them as the part where the two lessons meet.","facts":[["Connects","Battle Resort Fight Area ↔ Battle Resort Survival Area"],["Travel time","4–5 days on foot (about half that with bikes or mounts, which the Training Pass discourages)"],["Danger","★★☆☆☆"]],"segs":[[[1325,600],[1322,594],[1321,570],[1334,555],[1330,528],[1339,517],[1335,478],[1342,469],[1354,465],[1364,455],[1368,445],[1368,430],[1378,411],[1379,404],[1383,400],[1386,383]]],"bb":[1321,383,1386,600],"cx":1353,"cy":491},{"id":"battle-resort-route-226","name":"Battle Resort Route 226","t":"r","g":"route","kind":"route","nick":"The Bay Road","sum":"A route of crossings. Where Stark's meltwater meets the tide of the Inner Sound, the north shore becomes salt meadow, mudflat, reed bank and braided river, and the trail is a patient sequence of causeways, fords and rope-lines. It is quiet compared to Battle Resort Route 225: fewer cadets, more herons, long horizons, and fog that turns the Bay into a pale wall.","facts":[["Connects","Battle Resort Survival Area ↔ Stark Fork (the three-way junction with Battle Resort Route 227 and Battle Resort Route 228)"],["Travel time","3–4 days on foot"],["Danger","★★★☆☆"]],"segs":[[[1386,383],[1385,380],[1390,370],[1400,361],[1438,361],[1447,368],[1462,370],[1471,365],[1478,365],[1488,373],[1500,373],[1513,367]]],"bb":[1385,361,1513,383],"cx":1449,"cy":372},{"id":"battle-resort-route-227","name":"Battle Resort Route 227","t":"r","g":"route","kind":"route","nick":"The Ash Road","sum":"The only way up Mt. Stark on foot. Heather moor gives way to wind-bent pine, then to black cinder, steam and sulfur-yellow rock. The League's volcano watch keeps the road open, marked, and monitored; it does not keep it safe.","facts":[["Connects","Stark Fork (junction with Battle Resort Route 226 and Battle Resort Route 228) ↔ Mt. Stark"],["Travel time","2–3 days up, 1–2 days down"],["Danger","★★★★☆"]],"segs":[[[1513,367],[1513,355],[1520,350],[1529,349],[1534,342],[1528,326],[1537,316],[1535,287]]],"bb":[1513,287,1537,367],"cx":1525,"cy":327},{"id":"battle-resort-route-228","name":"Battle Resort Route 228","t":"r","g":"route","kind":"route","nick":"The Spine","sum":"The east arm's ridge is a country of waterfalls, terraced orchards, and warm caves, and it is the island's quiet side. The Resort's glossy edge never quite reaches it. The people here are the Terrace families: the island's original farmers, who grow the berries, honey and fruit the Resort restaurants advertise as \"island-grown\" and who regard the advertising with a mixture of pride and suspicion.","facts":[["Connects","Stark Fork (junction with Battle Resort Route 226 and Battle Resort Route 227) ↔ Battle Resort Port"],["Travel time","5–6 days on foot (the island's longest route)"],["Danger","★★★☆☆"]],"segs":[[[1513,367],[1529,371],[1555,372],[1566,383],[1572,394],[1575,413],[1596,433],[1596,451],[1605,463],[1603,487],[1606,492],[1606,512],[1603,517],[1603,527],[1613,544],[1613,558],[1609,570],[1611,597],[1601,609]]],"bb":[1513,367,1613,609],"cx":1563,"cy":488},{"id":"battle-resort-route-229","name":"Battle Resort Route 229","t":"r","g":"route","kind":"route","nick":"The Shell Road","sum":"The island's gentle end: dunes, tide pools, grassy headlands, and a long beach where the Resort's villas look down on the water. It feels like a holiday. Trainers who have just walked the Spine arrive tanned and blistered and feel a bit ridiculous, and the Resort is perfectly happy to sell them a spa towel.","facts":[["Connects","Battle Resort Port ↔ Resort Area"],["Travel time","2 days on foot (the Resort's sea shuttle makes it an hour)"],["Danger","★★☆☆☆"]],"segs":[[[1601,609],[1612,608],[1619,615],[1623,615],[1629,624],[1649,643],[1664,648],[1678,662]]],"bb":[1601,608,1678,662],"cx":1639,"cy":635},{"id":"pavilion-road","name":"Pavilion Road","t":"r","g":"route","kind":"route","nick":"","sum":"The short natural track from Champion's Port to Elite Four Island, about a day on foot. Challengers walk it with a League escort after ringing the Challenger's Bell at the gate.","facts":[["Connects","Champion's Port ↔ Elite Four Island"],["Travel time","about a day on foot"]],"segs":[[[1724,883],[1729,868],[1746,854]]],"bb":[1724,854,1746,883],"cx":1735,"cy":868}];
const PD_BY={};PD.forEach(f=>{PD_BY[f.id]=f;});
const PLACES=PD.map(f=>f.name).sort();

/* ---------- store: refs, local copies, write queue ---------- */
const SET_ALWAYS=new Set(['meta','gl','gn','bn','pl','gp','mg','bt','gb','gt','np','bm','bg','sh','sg','cd']);
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
    case 'mg':return db.collection('meta').doc('mega');
    case 'bt':return db.collection('meta').doc('battle');
    case 'gb':return db.collection('gm').doc('battle');
    case 'pl':return db.collection('places').doc(id);
    case 'gp':return db.collection('gm').doc('place_'+id);
    case 'gt':return db.collection('gm').doc('nt_'+id);
    case 'np':return db.collection('meta').doc('npcs');
    case 'bm':return db.collection('meta').doc('bmap');
    case 'bg':return db.collection('gm').doc('bmap');
    case 'sh':return db.collection('meta').doc('shops');
    case 'sg':return db.collection('gm').doc('shops');
    case 'cd':return db.collection('meta').doc('conditions');
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
    case 'mg':return S.megaOk;
    case 'bt':return S.battle;
    case 'gb':return S.battleGm;
    case 'pl':return S.places[id];
    case 'gp':return S.gmPl[id];
    case 'gt':return S.gmNt[id];
    case 'np':return S.npcPub;
    case 'bm':return S.bmap;
    case 'bg':return S.bmGm;
    case 'sh':return S.shopPub;
    case 'sg':return S.shopGm;
    case 'cd':return S.cond;
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
    case 'mg':S.megaOk=d;break;
    case 'bt':S.battle=d;break;
    case 'gb':S.battleGm=d;break;
    case 'pl':S.places[id]=d;break;
    case 'gp':S.gmPl[id]=d;break;
    case 'gt':S.gmNt[id]=d;break;
    case 'np':S.npcPub=d;break;
    case 'bm':S.bmap=d;break;
    case 'bg':S.bmGm=d;break;
    case 'sh':S.shopPub=d;break;
    case 'sg':S.shopGm=d;break;
    case 'cd':S.cond=d;break;
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
    case 'gt':delete S.gmNt[id];break;
    case 'bg':S.bmGm={};break;
  }
}

const Q=new Map();
function setStatus(kind,msg){
  /* a fresh note stays readable; the plain "Saved" that follows a write waits until it has had its few seconds */
  if(kind==='saved'&&S.noteUntil>Date.now())return;
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
    if(sc==='gl'||sc==='gn'||sc==='pl'||sc==='gp'||sc==='mg'||sc==='bt'||sc==='gb'||sc==='np'||sc==='bm'||sc==='sh'||sc==='sg'||sc==='cd'){doc={};putLocal(sc,id,doc);}
    else return;
  }
  const parts=path.split('.');
  const top=parts[0];
  const nv=setIn(doc[top],parts.slice(1),v);
  doc[top]=nv;
  save(sc,id,{[top]:nv});
  if(sc==='sg')shPubSoon();
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
        bmFogSoon();
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
  watch(db.collection('meta').doc('conditions'),s=>{
    if(s.exists)S.cond=withPending('cd','conditions',s.data());
    else if(!Q.has('cd|conditions'))S.cond={};
  },'conditions');
  watch(db.collection('meta').doc('mega'),s=>{
    if(s.exists)S.megaOk=withPending('mg','mega',s.data());
    else if(!Q.has('mg|mega'))S.megaOk={};
  },'mega');
  watch(db.collection('meta').doc('battle'),s=>{
    if(s.exists)S.battle=withPending('bt','battle',s.data());
    else if(!Q.has('bt|battle'))S.battle={};
  },'battle');
  watch(db.collection('meta').doc('npcs'),s=>{
    if(s.exists)S.npcPub=withPending('np','npcs',s.data());
    else if(!Q.has('np|npcs'))S.npcPub={};
  },'npcs');
  watch(db.collection('meta').doc('shops'),s=>{
    if(s.exists)S.shopPub=withPending('sh','shops',s.data());
    else if(!Q.has('sh|shops'))S.shopPub={};
    shPubSoon();
  },'shops');
  watch(db.collection('meta').doc('bmap'),s=>{
    if(s.exists)S.bmap=withPending('bm','bmap',s.data());
    else if(!Q.has('bm|bmap'))S.bmap={};
    bmAssemble();
  },'bmap');
  watch(db.collection('meta').doc('pta_idx'),s=>{ptaSetIdx(s.exists?s.data():null);},'pta');
  watch(db.collection('mapimg'),s=>{
    const o={};
    s.docs.forEach(d=>{o[d.id]=d.data();});
    S.mapChunks=o;
    assembleMap();
    bmAssemble();
  },'mapimg');
  watch(db.collection('meta').doc('table'),s=>{
    if(s.exists)S.meta=Object.assign({},DEF_META,withPending('meta','table',s.data()));
    else if(!Q.has('meta|table'))S.meta=Object.assign({},DEF_META);
  },'meta');
  if(S.me.admin){
    watch(db.collection('gm'),s=>{
      const loy={},npc={},gpl={},gnt={},bch={};
      let gbat=null,gbm=null,gsh=null;
      s.docs.forEach(d=>{
        if(d.id==='battle')gbat=withPending('gb','battle',d.data());
        else if(d.id==='shops')gsh=withPending('sg','shops',d.data());
        else if(d.id==='bmap')gbm=withPending('bg','bmap',d.data());
        else if(d.id.indexOf('bmi_')===0)bch[+d.id.slice(4)]=d.data();
        else if(d.id.indexOf('loy_')===0)loy[d.id.slice(4)]=withPending('gl',d.id.slice(4),d.data());
        else if(d.id.indexOf('npc_')===0)npc[d.id.slice(4)]=withPending('gn',d.id.slice(4),d.data());
        else if(d.id.indexOf('place_')===0)gpl[d.id.slice(6)]=withPending('gp',d.id.slice(6),d.data());
        else if(d.id.indexOf('nt_')===0)gnt[d.id.slice(3)]=withPending('gt',d.id.slice(3),d.data());
      });
      Object.keys(S.gmPl).forEach(id=>{if(!(id in gpl)&&Q.has('gp|'+id))gpl[id]=S.gmPl[id];});
      Object.keys(S.gmLoy).forEach(id=>{if(!(id in loy)&&Q.has('gl|'+id))loy[id]=S.gmLoy[id];});
      Object.keys(S.gmNpc).forEach(id=>{if(!(id in npc)&&Q.has('gn|'+id))npc[id]=S.gmNpc[id];});
      Object.keys(S.gmNt).forEach(id=>{if(!(id in gnt)&&Q.has('gt|'+id))gnt[id]=S.gmNt[id];});
      S.gmLoy=loy;S.gmNpc=npc;S.gmPl=gpl;S.gmNt=gnt;
      if(gbat)S.battleGm=gbat;else if(!Q.has('gb|battle'))S.battleGm={};
      if(gbm)S.bmGm=gbm;else if(!Q.has('bg|bmap'))S.bmGm={};
      if(gsh)S.shopGm=gsh;else if(!Q.has('sg|shops'))S.shopGm={};
      shPubSoon();
      S.bmGmCh=bch;
      bmAssembleGm();
    },'gm');
  }
  if(CFG&&S.me.admin){
    /* the GM's library of saved battle maps: one small document each; their pictures are fetched only when one is used */
    watch(db.collection('config').where('kind','==','bscene'),s=>{
      const o={};
      s.docs.forEach(d=>{if(d.id.indexOf('bsc_')===0)o[d.id.slice(4)]=d.data();});
      S.bmLib=o;
    },'bscenes');
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
const chipsOf=a=>(a||[]).filter(Boolean).map(t=>h`<span class="ty ${String(t).toLowerCase()}">${t}</span>`);
const typeChips=m=>chipsOf(effTypes(m));
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
const TPL_MAX={moves:6,passives:8};

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
/* a Pokémon's picture: the player's own upload, else the Platinum-era sprite for its species, else its first letter */
function monPic(m){
  const own=imgSrc(m.img);
  if(own)return h`<img class="pimg" src="${own}" alt="${mName(m)}">`;
  const letter=(String(mName(m)||'?').trim().charAt(0)||'?').toUpperCase();
  const srcs=monSprites(m);
  if(!srcs.length)return h`<span class="sp-ini" aria-hidden="true">${letter}</span>`;
  return h`<img class="sp" src="${srcs[0]}" data-fb="${srcs.slice(1).join('|')}" data-ini="${letter}" alt="${mName(m)}" width="80" height="80" decoding="async">`;
}
function monIcon(m){
  const srcs=monSprites(m);
  return srcs.length?h`<img class="sp mi" src="${srcs[0]}" data-fb="${srcs.slice(1).join('|')}" alt="" width="40" height="40" decoding="async">`:h`<span class="mi-ph" aria-hidden="true"></span>`;
}
/* a bag item's icon: the 30px item sprite shown at double size, else its first letter */
function itemPic(name){
  const slug=itemSlug(name);
  const letter=(String(name||'').trim().charAt(0)||'').toUpperCase();
  const src=slug?ITEM_BASE+slug+'.png':'';
  if(src&&!SPR_BAD.has(src))return h`<img class="sp it" src="${src}" data-ini="${letter}" alt="" width="60" height="60" decoding="async">`;
  return letter?h`<span class="sp-ini" aria-hidden="true">${letter}</span>`:'';
}
const itemTile=name=>h`<span class="itile" data-slug="${itemSlug(name)}">${itemPic(name)}</span>`;
function itemMini(name){
  const slug=itemSlug(name);
  const src=slug?ITEM_BASE+slug+'.png':'';
  return src&&!SPR_BAD.has(src)?h`<img class="sp it mini" src="${src}" data-ini="" alt="" width="30" height="30" decoding="async">`:'';
}
/* typing in an item's name swaps its icon at once, without redrawing the page under the cursor */
function liveItemIcon(input){
  const box=input.closest&&input.closest('.item');
  const tile=box&&box.querySelector('.itile');
  if(!tile)return;
  const slug=itemSlug(input.value);
  if((tile.getAttribute('data-slug')||'')===slug)return;
  tile.setAttribute('data-slug',slug);
  tile.innerHTML=itemPic(input.value).s;
}
document.addEventListener('error',e=>{
  const i=e.target;
  if(!i||i.tagName!=='IMG'||!i.classList.contains('sp'))return;
  SPR_BAD.add(i.getAttribute('src'));
  const fb=(i.getAttribute('data-fb')||'').split('|').filter(u=>u&&!SPR_BAD.has(u));
  if(fb.length){i.setAttribute('data-fb',fb.slice(1).join('|'));i.src=fb[0];return;}
  if(i.classList.contains('mini')){i.remove();return;}
  if(i.classList.contains('mi')){const p=document.createElement('span');p.className='mi-ph';p.setAttribute('aria-hidden','true');i.replaceWith(p);return;}
  const s=document.createElement('span');
  s.className='sp-ini';s.setAttribute('aria-hidden','true');s.textContent=i.getAttribute('data-ini')||(i.classList.contains('it')?'':'?');
  i.replaceWith(s);
},true);
const typeVars=m=>{
  const ts=effTypes(m).map(x=>String(x||'').toLowerCase()).filter(x=>TYPE_HEX[x]);
  return ts.length?raw('style="--t1:'+TYPE_HEX[ts[0]]+';--t2:'+TYPE_HEX[ts[1]||ts[0]]+'"'):'';
};
/* theme: "auto" follows the device; Day and Night are remembered on this device */
const themeEff=()=>{
  const a=document.documentElement.getAttribute('data-theme');
  if(a==='dark'||a==='light')return a;
  try{return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}catch(e){return 'light';}
};
const themePref=()=>{const v=lsGet('stl.theme');return v==='dark'||v==='light'?v:'auto';};
function applyTheme(v){
  const r=document.documentElement;
  if(v==='dark'||v==='light')r.setAttribute('data-theme',v);else r.removeAttribute('data-theme');
}
function setTheme(v){lsSet('stl.theme',v==='auto'?'':v);applyTheme(v);render();}
const ICON_SUN=raw('<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></svg>');
const ICON_MOON=raw('<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z"/></svg>');
function imgPicker(sc,id,path,doc,w,h2,cap,ro,max){
  if(ro)return '';
  const has=!!getIn(doc,path);
  return h`<div class="row"><button class="btn sm" data-act="pick" data-img="${sc+'|'+id+'|'+path}" data-w="${w}" data-h="${h2}" data-max="${max||0}" data-cap="${cap}">${has?'Change picture':'Upload picture'}</button>${has?h`<button class="btn sm ghost" data-act="rmImg" ${bp(sc,id,path)}>Remove</button>`:''}</div>`;
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
/* ---------- species look-up, auto-fill and Mega Evolution ---------- */
/* PTA stats here are a game base stat divided by 15, rounded, never below 1 (Bulbasaur 49/49/65/65/45 becomes 3/3/4/4/3). */
const STAT_DIV=15;
const statFrom=v=>Math.max(1,Math.round(num(v)/STAT_DIV));
const DEXA=DEXN.split('|');
const DEXT=DEXD.split('|');
const REGION_RE=/\b(alola|alolan|galar|galarian|hisui|hisuian|paldea|paldean)\b/i;
const REGION_OF={alola:'Alola',alolan:'Alola',galar:'Galar',galarian:'Galar',hisui:'Hisui',hisuian:'Hisui',paldea:'Paldea',paldean:'Paldea'};
const typePair=a=>[a[0]===''||a[0]==null?'':(TYPES[a[0]]||''),a[1]===''||a[1]==null?'':(TYPES[a[1]]||'')];
const sameArr=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
function infoFrom(id,sid,name,types,raw,form){
  const base={};
  STAT_KEYS.forEach((k,i)=>{base[k]=statFrom(raw[i]);});
  return {id,sid,name,types,base,form:form||null};
}
function dexInfo(id){
  const p=DEXT[id-1].split('.');
  return infoFrom(id,id,DEXA[id-1],typePair([+p[0],p[1]===''?'':+p[1]]),p.slice(2).map(Number),null);
}
/* "Lucario", "alolan vulpix", "Zorua-Hisui" and "Shiny Lucario" all resolve; anything else returns null */
function speciesInfo(sp){
  const s=String(sp==null?'':sp);
  if(!s.trim())return null;
  const rm=REGION_RE.exec(s);
  const id=dexId(rm?s.replace(REGION_RE,' '):s);
  if(!id)return null;
  if(rm){
    const reg=REGION_OF[rm[1].toLowerCase()];
    const low=s.toLowerCase();
    const c=FORMS.filter(f=>f.b===id&&f.r===reg);
    const f=c.find(x=>x.x&&low.indexOf(x.x)>=0)||c[0];
    if(f)return infoFrom(id,f.i,f.n,typePair(f.t),f.s,f);
  }
  return dexInfo(id);
}
function infoBySid(sid){
  sid=num(sid);
  if(sid>0&&sid<=DEXT.length)return dexInfo(sid);
  const f=FORMS.find(x=>x.i===sid);
  return f?infoFrom(f.b,f.i,f.n,typePair(f.t),f.s,f):null;
}
const baseList=b=>STAT_KEYS.map(k=>num(b&&b[k]));

/* ---------- Mega forms ---------- */
const megasFor=sp=>{const si=speciesInfo(sp);return si&&!si.form?MEGAS.filter(x=>x.b===si.id):[];};
/* the handbook's own entry for a Mega form (stat bonuses and Mega passive), once the GM has imported it */
const hbMega=f=>{const L=PTA.lists;return (L&&L.megaMap&&L.megaMap.get(dexKey(f)))||null;};
function megaPreset(x,si){
  const bonus={};
  STAT_KEYS.forEach((k,i)=>{bonus[k]=statFrom(x.s[i])-si.base[k];});
  const o={form:x.f,stone:x.st,types:typePair(x.t),bonus,ability:x.a,sid:x.i,auto:true};
  if(x.mv)o.move=x.mv;
  const hb=hbMega(x.f);
  if(hb){
    STAT_KEYS.forEach(k=>{bonus[k]=num(hb.bon&&hb.bon[k]);});
    o.types=[(hb.ty||[])[0]||'',(hb.ty||[])[1]||''];
    if((hb.ps||[]).length)o.ability=hb.ps.map(p=>p.t?p.n+': '+p.t:p.n).join(' · ');
  }
  return o;
}
function pickMega(m,list){
  const k=dexKey(m.item);
  return (k&&list.find(x=>x.st&&k.indexOf(dexKey(x.st))>=0))||list[0];
}
const megaOn=m=>!!(m&&m.mega&&m.megaOn);
const effTypes=m=>{
  const mt=megaOn(m)?(m.mega.types||[]).filter(Boolean):[];
  return mt.length?mt:((m&&m.types)||[]).filter(Boolean);
};
const megaBonus=(m,k)=>megaOn(m)?num(m.mega.bonus&&m.mega.bonus[k]):0;
const megaAllowed=m=>!!(S.megaOk&&S.megaOk['p_'+m.id]);

/* ---------- Key Stone: a trainer carries one, and it works once per battle ---------- */
const KEY_RE=/key\s*-?\s*stone|keystone|mega\s*(bracelet|ring|cuff|charm|glasses|anchor|band|pendant)/i;
const isKeyName=n=>KEY_RE.test(String(n||''));
const hasKey=t=>!!(t&&(t.items||[]).some(x=>isKeyName(x.name)&&(x.qty==null||x.qty===''||num(x.qty)>0)));
const keyCharged=t=>hasKey(t)&&!t.megaUsed;
function keyChip(t,big){
  if(!hasKey(t))return '';
  const ok=!t.megaUsed;
  return h`<span class="kchip ${ok?'ready':'spent'} ${big?'big':''}" title="${ok?'The Key Stone is charged. One Mega Evolution this battle.':'The Key Stone was used this battle. It recharges when the battle ends.'}"><i class="kgem" aria-hidden="true"></i>${ok?'Key Stone ready':'Key Stone spent'}</span>`;
}
function megaChecks(uid,m){
  const t=S.trainers[uid]||{};
  const mg=m.mega||{};
  const kItem=dexKey(m.item);
  let holds,holdLabel;
  if(mg.move){
    holds=(m.moves||[]).some(x=>dexKey(x.name)===dexKey(mg.move));
    holdLabel='Knows '+mg.move;
  }else if(mg.stone){
    holds=!!kItem&&kItem.indexOf(dexKey(mg.stone))>=0;
    holdLabel='Holding '+mg.stone;
  }else{holds=true;holdLabel='No Mega Stone listed';}
  return [
    {ok:holds,label:holdLabel},
    {ok:hasKey(t),label:'Trainer carries a Key Stone'},
    {ok:keyCharged(t),label:'Key Stone not used yet this battle'},
    {ok:megaAllowed(m),label:'GM has approved this Pokémon'}
  ];
}

/* ---------- sprites: the Mega sprite while mega-evolved, then the species sprite, then the base species ---------- */
function monSprites(m){
  const out=[];
  const sy=m.shiny===true;
  if(megaOn(m)&&num(m.mega.sid)>0){
    if(sy)out.push(SPR_BASE+'shiny/'+num(m.mega.sid)+'.png');
    out.push(SPR_BASE+num(m.mega.sid)+'.png');
  }
  const si=speciesInfo(m.species);
  if(si){
    spriteSrcs(si.sid,sy).forEach(u=>out.push(u));
    if(si.sid!==si.id)spriteSrcs(si.id,sy).forEach(u=>out.push(u));
    if(sy){spriteSrcs(si.sid).forEach(u=>out.push(u));}
  }
  return out.filter((u,i)=>out.indexOf(u)===i&&!SPR_BAD.has(u));
}

/* ---------- auto-fill from the species name ---------- */
function fillFromSpecies(uid,pid,force){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  const si=m&&speciesInfo(m.species);
  if(!si)return null;
  const prev=m.autoSid?infoBySid(m.autoSid):null;
  const curT=[(m.types||[])[0]||'',(m.types||[])[1]||''];
  const curB=baseList(m.base);
  const defB=curB.every(v=>v===3)||curB.every(v=>v===0);
  const sg=m.autoSig||{};
  const tOk=force||(!curT[0]&&!curT[1])||(prev&&sameArr(curT,prev.types))||sg.ty===hsh(curT.join('/'));
  const bOk=force||defB||(prev&&sameArr(curB,baseList(prev.base)))||sg.ba===hsh(curB.join(','));
  const res={name:si.name,types:si.types,base:si.base,setT:false,setB:false,keepT:!tOk,keepB:!bOk};
  if(tOk&&!sameArr(curT,si.types)){edit('p',id,'types',si.types.slice());res.setT=true;}
  if(bOk&&!sameArr(curB,baseList(si.base))){edit('p',id,'base',Object.assign({},m.base||{},si.base));res.setB=true;}
  if(num(m.autoSid)!==si.sid)edit('p',id,'autoSid',si.sid);
  return res;
}
/* keeps a Pokémon's Mega details in step with its species while they are still the auto-filled ones */
function syncMega(uid,pid,keepOn){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  const si=m&&speciesInfo(m.species);
  if(!m)return '';
  const list=si&&!si.form?MEGAS.filter(x=>x.b===si.id):[];
  const cur=m.mega;
  if(!list.length){
    if(cur&&cur.auto){edit('p',id,'mega',null);edit('p',id,'megaOn',false);}
    return '';
  }
  if(!cur||cur.auto){
    const x=keepOn&&cur?(list.find(y=>y.f===cur.form)||pickMega(m,list)):pickMega(m,list);
    const pre=megaPreset(x,si);
    if(cur&&cur.form===x.f&&sameArr(baseList(cur.bonus),baseList(pre.bonus))&&cur.ability===pre.ability&&sameArr((cur.types||[]).filter(Boolean),pre.types.filter(Boolean)))return '';
    edit('p',id,'mega',pre);
    if(m.megaOn&&!keepOn)edit('p',id,'megaOn',false);
    return keepOn&&cur&&cur.form===x.f?'':x.f;
  }
  return '';
}
/* the basic fill: types and base stats worked out from the game's own numbers, used when the handbook has no entry */
function basicSpecies(uid,pid,force){
  const m0=getLocal('p',uid+'/'+pid);
  const si0=m0&&speciesInfo(m0.species);
  if(!si0)return false;
  if(!force&&num(m0.autoSid)===si0.sid&&!m0.autoPta)return true;   /* already filled in for this species */
  const r=fillFromSpecies(uid,pid,force);
  if(!r)return false;
  if(m0.autoPta)edit('p',uid+'/'+pid,'autoPta','');
  const mf=syncMega(uid,pid);
  const bits=[];
  if(r.setT||r.setB||force)bits.push('Filled in '+r.name+': '+r.types.filter(Boolean).join(' / ')+' · '+STATS.map(s=>s[2]+' '+r.base[s[0]]).join(' '));
  if(r.keepT||r.keepB)bits.push('Kept the '+(r.keepT&&r.keepB?'types and stats':r.keepT?'types':'stats')+' you set.');
  if(mf)bits.push(mf+' details added.');
  if(bits.length)toast(bits.join(' '),true);
  return true;
}
/* species box: the handbook entry when there is one (stats, passives, moves), otherwise the basic fill */
function applySpecies(uid,pid,force){
  const m0=getLocal('p',uid+'/'+pid);
  if(!m0)return false;
  const pr=ptaResolve(m0.species);
  if(!pr)return basicSpecies(uid,pid,force);
  const k=ptaKey(pr);
  if(!force&&m0.autoPta===k)return true;
  if(ptaRec(pr)){ptaApply(uid,pid,ptaRec(pr),force);return true;}
  ptaChunk(ptaLetter(k)).then(()=>{
    const m=getLocal('p',uid+'/'+pid);
    if(!m||ptaResolve(m.species)!==pr)return;
    if(ptaRec(pr))ptaApply(uid,pid,ptaRec(pr),force);
    else basicSpecies(uid,pid,force);
    scheduleRender();
  });
  return true;
}
/* a redraw after a blur waits for the pointer to come up, so the click that caused the blur still lands */
function renderSoon(){
  let done=false;
  const go=()=>{if(done)return;done=true;document.removeEventListener('pointerup',go,true);scheduleRender();};
  document.addEventListener('pointerup',go,true);
  setTimeout(go,350);
}
/* the species box was picked from the list, changed, or left: fill in the rest */
function onSpeciesChange(t){
  if(ptaRowFill(t))return true;
  if(foeRowFill(t))return true;
  if(ntRowFill(t))return true;
  const m=/^p\|([^|]+)\/([^|]+)\|species$/.exec(t.dataset.b||'');
  if(!m)return false;
  if(!getLocal('p',m[1]+'/'+m[2]))return true;
  const before=Q.size;
  if(applySpecies(m[1],m[2],false)&&(Q.size!==before||S.noteUntil>Date.now()))renderSoon();
  return true;
}
function fillHint(uid,m){
  const pr=ptaResolve(m.species);
  if(pr){
    const rec=ptaRec(pr);
    if(!rec)ptaWarm(pr);
    const F=rec&&ptaFields(rec);
    if(F&&ptaSame(m,F))return h`<p class="sub wide fillrow">Types, stats, passives and moves match the handbook entry for ${rec.n}.</p>`;
    const ask=S.ui.confirm==='fill|'+m.id;
    return h`<div class="wide fillrow"><button class="btn sm ${ask?'danger armed':''}" data-act="autofill" data-uid="${uid}" data-pid="${m.id}">${ask?'Tap again to replace your passives and moves':'Fill from the handbook: '+(rec?rec.n:pr)}</button></div>`;
  }
  const si=speciesInfo(m.species);
  if(!si)return '';
  const curT=[(m.types||[])[0]||'',(m.types||[])[1]||''];
  const same=sameArr(curT,si.types)&&sameArr(baseList(m.base),baseList(si.base));
  if(same)return h`<p class="sub wide fillrow">Types and base stats match ${si.name}.</p>`;
  return h`<div class="wide fillrow"><button class="btn sm" data-act="autofill" data-uid="${uid}" data-pid="${m.id}">Fill types and base stats from ${si.name}</button></div>`;
}
/* the Fill button: the handbook entry when there is one, and a second tap before it replaces edits the player made */
async function fillClick(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  if(!m)return;
  const pr=ptaResolve(m.species);
  if(!pr){basicSpecies(uid,pid,true);render();return;}
  const rec=ptaRec(pr)||(await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr)));
  const m2=getLocal('p',id);
  if(!m2)return;
  if(!rec){basicSpecies(uid,pid,true);render();return;}
  const key='fill|'+pid;
  if(ptaWouldReplace(m2,ptaFields(rec))&&S.ui.confirm!==key){
    S.ui.confirm=key;render();
    setTimeout(()=>{if(S.ui.confirm===key){S.ui.confirm=null;render();}},4000);
    return;
  }
  S.ui.confirm=null;
  ptaApply(uid,pid,rec,true);
  render();
}

/* ---------- Pokémon-card panel ---------- */
function bonusText(m){
  const b=(m.mega&&m.mega.bonus)||{};
  const t=STATS.filter(s=>num(b[s[0]])!==0).map(s=>sgn(num(b[s[0]]))+' '+s[2]);
  return t.length?t.join(' · '):'No stat changes';
}
function megaPanel(uid,m,ro){
  const forms=megasFor(m.species);
  const mg=m.mega;
  if(!mg&&!forms.length)return '';
  const pid=m.id,id=uid+'/'+pid;
  if(!mg){
    return h`<section class="megap"><div class="mph"><h4><i class="kgem" aria-hidden="true"></i>Mega Evolution</h4></div>
      <p class="sub">${m.species} can Mega Evolve${forms.length>1?' in '+forms.length+' ways':''}. Add its details to see what it needs.</p>
      ${ro?'':h`<div class="row"><button class="btn sm" data-act="megaAdd" data-uid="${uid}" data-pid="${pid}">Add Mega Evolution details</button></div>`}</section>`;
  }
  const on=megaOn(m);
  const checks=megaChecks(uid,m);
  const can=checks.every(c=>c.ok);
  const lacking=checks.filter(c=>!c.ok).map(c=>c.label);
  const tr=S.trainers[uid]||{};
  const ekey='mg'+id;
  const edOpen=!!S.ui.open[ekey];
  const okGate=megaAllowed(m);
  return h`<section class="megap ${on?'on':''}"><div class="mph"><h4><i class="kgem" aria-hidden="true"></i>Mega Evolution</h4>
      <span class="pill ${on?'mega':can?'good':''}">${on?'Mega-evolved':can?'Ready':'Locked'}</span>${keyChip(tr)}</div>
    <div class="mgsum lcd"><b class="mgf">${mg.form||'Mega form'}</b>
      <span class="mgt">${chipsOf((mg.types||[]).filter(Boolean))}</span>
      <span class="mgb">${bonusText(m)}</span>
      <span class="mga">${mg.ability?'Ability: '+mg.ability:'No ability listed'}</span></div>
    <ul class="chk">${checks.map(c=>h`<li class="${c.ok?'ok':'no'}"><span class="mk" aria-hidden="true">${c.ok?'✓':'✗'}</span><span class="sr">${c.ok?'Met: ':'Not met: '}</span>${c.label}</li>`)}</ul>
    ${ro?'':h`<div class="row">
      ${on?h`<button class="btn sm" data-act="megaRevert" data-uid="${uid}" data-pid="${pid}">Revert to normal</button>`
          :h`<button class="btn sm primary" data-act="megaGo" data-uid="${uid}" data-pid="${pid}" ${can?'':raw('disabled')}>Mega Evolve</button>`}
      <button class="btn sm ghost" data-act="toggle" data-key="${ekey}" aria-expanded="${String(edOpen)}">${edOpen?'Hide details':'Edit details'}</button>
      ${!on&&!can?h`<span class="sub">Needs: ${lacking.join(', ')}</span>`:''}</div>`}
    ${S.me.admin?h`<div class="mgate secret"><span class="fl">GM only · Mega approval</span>
      <div class="row"><div class="seg" role="group" aria-label="Allow Mega Evolution">
        <button data-act="megaGate" data-pid="${pid}" data-v="1" aria-pressed="${String(okGate)}">Allowed</button>
        <button data-act="megaGate" data-pid="${pid}" data-v="0" aria-pressed="${String(!okGate)}">Not allowed</button></div>
        <span class="sub">${okGate?'This Pokémon may Mega Evolve.':'The player cannot Mega Evolve it yet.'}</span></div></div>`:''}
    ${!ro&&edOpen?h`<div class="mgedit">
      ${forms.length>1?h`<div class="row"><span class="fl">Form</span><div class="seg" role="group" aria-label="Mega form">${forms.map((x,i)=>h`<button data-act="megaForm" data-uid="${uid}" data-pid="${pid}" data-n="${i}" aria-pressed="${String(x.f===mg.form)}">${x.f.replace(/^Mega /,'')}</button>`)}</div></div>`:''}
      <div class="fgrid">
        ${fText('Form name','p',id,'mega.form',m)}
        ${fText('Mega Stone','p',id,'mega.stone',m,{list:'dl-items'})}
        ${fSel('Type 1','p',id,'mega.types.0',m,TYPES,{blank:'None'})}
        ${fSel('Type 2','p',id,'mega.types.1',m,TYPES,{blank:'None'})}
        ${fText('Ability','p',id,'mega.ability',m,{cls:'wide'})}
        ${STATS.map(s=>fNum(s[2]+' bonus','p',id,'mega.bonus.'+s[0],m))}
      </div>
      <div class="row">${forms.length?h`<button class="btn sm" data-act="megaReset" data-uid="${uid}" data-pid="${pid}">Reset to official values</button>`:''}
        <button class="btn sm danger" data-act="megaDrop" data-uid="${uid}" data-pid="${pid}">Remove Mega details</button></div>
    </div>`:''}
  </section>`;
}

/* ---------- actions ---------- */
function megaAdd(uid,pid,n){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  const si=m&&speciesInfo(m.species);
  if(!si||si.form)return;
  const list=MEGAS.filter(x=>x.b===si.id);
  if(!list.length)return;
  const x=n!=null&&list[n]?list[n]:pickMega(m,list);
  edit('p',id,'mega',megaPreset(x,si));
  if(m.megaOn)edit('p',id,'megaOn',false);
  render();
}
function megaGo(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  if(!m||!m.mega||m.megaOn||!canEditT(uid))return;
  const mm=Object.assign({id:pid},m);
  if(!megaChecks(uid,mm).every(c=>c.ok)){toast('Not ready yet. Check the list on the card.');return;}
  edit('p',id,'megaOn',true);
  edit('t',uid,'megaUsed',true);
  const p={uid,pid};
  S.ui.megaPop=p;
  setTimeout(()=>{if(S.ui.megaPop===p){S.ui.megaPop=null;scheduleRender();}},1800);
  toast(mName(mm)+' Mega Evolved into '+(m.mega.form||'its Mega form')+'!',true);
  render();
}
function megaRevert(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  if(!m||!m.megaOn||!canEditT(uid))return;
  edit('p',id,'megaOn',false);
  toast('Back to normal. The Key Stone stays spent until the battle ends.',true);
  render();
}
function megaGate(pid,on){
  if(!S.me.admin)return;
  edit('mg','mega','p_'+pid,!!on);
  render();
}
function endBattle(uid){
  let n=0;
  const t=S.trainers[uid];
  if(t&&t.megaUsed){edit('t',uid,'megaUsed',false);n++;}
  monsOf(uid).forEach(m=>{
    if(m.megaOn){edit('p',uid+'/'+m.id,'megaOn',false);n++;}
    if(STATS.some(s=>stg(m,s[0])))edit('p',uid+'/'+m.id,'stages',{atk:0,def:0,spa:0,spd:0,spe:0});
  });
  return n;
}
function endBattleAll(){
  let n=0;
  tids().forEach(u=>{n+=endBattle(u);});
  n+=ntEndBattle();
  toast(n?'Battle over for everyone. Mega forms reverted and Key Stones recharged.':'Nothing to reset. No Key Stone was spent.',true);
  render();
}

/* ---------- Mega Evolution for Pokémon the GM runs: an NPC trainer's roster, and the foes in a battle ----------
   The GM is the one who decides, so nothing here is locked. The checklist says what the rules normally ask for. */
/* what a Pokémon needs in hand: the stone it holds, or the move it knows (Rayquaza) */
function megaHold(item,moves,mg){
  mg=mg||{};
  if(mg.move)return {ok:(moves||[]).some(x=>dexKey(x.name)===dexKey(mg.move)),label:'Knows '+mg.move};
  if(mg.stone){const k=dexKey(item);return {ok:!!k&&k.indexOf(dexKey(mg.stone))>=0,label:'Holding '+mg.stone};}
  return {ok:true,label:'No Mega Stone listed'};
}
/* o: {kind:'nt'|'foe', sc, id, P (path to the Pokémon), doc, mon, attrs (data attributes naming it), checks, chip, ekey} */
function megaRunPanel(o){
  const m=o.mon,mg=m.mega;
  const forms=megasFor(m.sp);
  if(!mg&&!forms.length)return '';
  const k=o.kind,pre=k==='foe'?'b':'nt';
  if(!mg){
    return h`<section class="megap"><div class="mph"><h4><i class="kgem" aria-hidden="true"></i>Mega Evolution</h4></div>
      <p class="sub">${m.sp} can Mega Evolve${forms.length>1?' in '+forms.length+' ways':''}. Add its details to see what it needs.</p>
      <div class="row"><button class="btn sm" data-act="${pre}_mgadd" ${o.attrs}>Add Mega Evolution details</button></div></section>`;
  }
  const on=!!m.megaOn;
  const lacking=o.checks.filter(c=>!c.ok).map(c=>c.label);
  const edOpen=!!S.ui.open[o.ekey];
  const P=o.P;
  return h`<section class="megap ${on?'on':''}"><div class="mph"><h4><i class="kgem" aria-hidden="true"></i>Mega Evolution</h4>
      ${k==='foe'?h`<span class="pill ${on?'mega':''}">${on?'Mega-evolved':'Not evolved'}</span>`:''}${o.chip||''}</div>
    <div class="mgsum lcd"><b class="mgf">${mg.form||'Mega form'}</b>
      <span class="mgt">${chipsOf((mg.types||[]).filter(Boolean))}</span>
      <span class="mgb">${bonusText(m)}</span>
      <span class="mga">${mg.ability?'Ability: '+mg.ability:'No ability listed'}</span></div>
    <ul class="chk">${o.checks.map(c=>h`<li class="${c.ok?'ok':'no'}"><span class="mk" aria-hidden="true">${c.ok?'✓':'✗'}</span><span class="sr">${c.ok?'Met: ':'Not met: '}</span>${c.label}</li>`)}</ul>
    <div class="row">
      ${k==='foe'?(on?h`<button class="btn sm" data-act="b_mgr" ${o.attrs}>Revert to normal</button>`:h`<button class="btn sm primary" data-act="b_mgo" ${o.attrs}>Mega Evolve</button>`):''}
      ${k==='nt'?h`<button class="btn sm" data-act="nt_mgready" ${o.attrs}>Give it the stone and a Key Stone</button>`:''}
      <button class="btn sm ghost" data-act="toggle" data-key="${o.ekey}" aria-expanded="${String(edOpen)}">${edOpen?'Hide details':'Edit details'}</button>
      ${lacking.length&&!on?h`<span class="sub">Normally needs: ${lacking.join(', ')}. You can still do it.</span>`:''}</div>
    ${edOpen?h`<div class="mgedit">
      ${forms.length>1?h`<div class="row"><span class="fl">Form</span><div class="seg" role="group" aria-label="Mega form">${forms.map((x,i)=>h`<button data-act="${pre}_mgform" ${o.attrs} data-n="${i}" aria-pressed="${String(x.f===mg.form)}">${x.f.replace(/^Mega /,'')}</button>`)}</div></div>`:''}
      <div class="fgrid">
        ${fText('Form name',o.sc,o.id,P+'mega.form',o.doc)}
        ${fText('Mega Stone',o.sc,o.id,P+'mega.stone',o.doc,{list:'dl-items'})}
        ${fSel('Type 1',o.sc,o.id,P+'mega.types.0',o.doc,TYPES,{blank:'None'})}
        ${fSel('Type 2',o.sc,o.id,P+'mega.types.1',o.doc,TYPES,{blank:'None'})}
        ${fText('Ability',o.sc,o.id,P+'mega.ability',o.doc,{cls:'wide'})}
        ${STATS.map(s=>fNum(s[2]+' bonus',o.sc,o.id,P+'mega.bonus.'+s[0],o.doc))}
      </div>
      <div class="row">${forms.length?h`<button class="btn sm" data-act="${pre}_mgreset" ${o.attrs}>Reset to official values</button>`:''}
        <button class="btn sm danger" data-act="${pre}_mgdrop" ${o.attrs}>Remove Mega details</button></div>
    </div>`:''}
  </section>`;
}
/* where a Pokémon's sheet lives, so one set of actions serves an NPC's roster and a foe */
function mgTarget(kind,d){
  if(!S.me.admin)return null;
  if(kind==='nt'){
    const nt=NTS()[d.id];
    const i=nt?ntTeam(nt).findIndex(x=>x.id===d.mid):-1;
    if(i<0)return null;
    return {sc:'gt',id:d.id,P:'team.'+i+'.',mon:()=>ntTeam(NTS()[d.id])[i],done:()=>ntPublish(d.id)};
  }
  if(!foeOf(d.cid))return null;
  return {sc:'gb',id:'battle',P:'foes.'+d.cid+'.',mon:()=>foeOf(d.cid),done:()=>foePublish(d.cid)};
}
function mgAct(kind,op,d,again){
  /* the official numbers come from the handbook's Mega list, so wait for it if it has not loaded yet */
  if(!again&&PTA.idx&&!PTA.lists&&/^mg(add|form|reset)$/.test(op)){ptaLists().then(()=>mgAct(kind,op,d,true),()=>mgAct(kind,op,d,true));return;}
  const tg=mgTarget(kind,d);
  if(!tg)return;
  const m=tg.mon();
  if(!m)return;
  const si=speciesInfo(m.sp);
  const list=si&&!si.form?MEGAS.filter(x=>x.b===si.id):[];
  const E=(p,v)=>edit(tg.sc,tg.id,tg.P+p,v);
  switch(op){
    case 'mgadd':{
      if(!list.length)break;
      E('mega',megaPreset(pickMega(m,list),si));
      if(m.megaOn)E('megaOn',false);
      break;}
    case 'mgform':{
      const x=list[num(d.n)];
      if(!x)break;
      E('mega',megaPreset(x,si));
      if(m.megaOn)E('megaOn',false);
      break;}
    case 'mgreset':{
      const x=list.find(y=>y.f===(m.mega&&m.mega.form))||pickMega(m,list);
      if(!x)break;
      E('mega',megaPreset(x,si));
      toast('Reset to the official '+x.f+' values.',true);
      break;}
    case 'mgdrop':
      E('mega',null);
      if(m.megaOn)E('megaOn',false);
      break;
    case 'mgready':{
      const nt=NTS()[d.id];
      if(!m.mega||!nt)break;
      const hold=megaHold(m.item,m.mv,m.mega);
      if(!hold.ok&&m.mega.stone)E('item',m.mega.stone);
      if(!hasKey(nt))edit('gt',d.id,'items',(nt.items||[]).concat([{name:'Key Stone',qty:1,note:''}]));
      toast(ntMonName(m)+' now holds '+(m.mega.stone||'its stone')+', and '+ntName(nt)+' carries a Key Stone.',true);
      break;}
    case 'mgo':{
      if(!m.mega||m.megaOn)break;
      E('megaOn',true);
      E('sh.mega',1);
      if(m.nt&&NTS()[m.nt])edit('gt',m.nt,'megaUsed',true);
      toast(foeLabel(m)+' Mega Evolved into '+(m.mega.form||'its Mega form')+'!',true);
      break;}
    case 'mgr':
      if(!m.megaOn)break;
      E('megaOn',false);
      toast('Back to normal.',true);
      break;
  }
  tg.done();
  render();
}

/* ---------- GM Desk panel ---------- */
function megaDesk(){
  const ids=tids();
  const rows=ids.map(uid=>{
    const mons=monsOf(uid).filter(m=>m.mega||megasFor(m.species).length);
    return {uid,t:S.trainers[uid],mons};
  });
  const any=rows.some(r=>r.mons.length);
  return h`<section class="panel"><div class="ph"><h2>Mega Evolution</h2><span class="pill gm">GM only</span>
      <div class="acts"><button class="btn sm" data-act="endBattleAll">End battle for everyone</button></div></div>
    <p class="sub">A Pokémon can Mega Evolve only if you mark it Allowed. Each trainer can do it once per battle, tied to their Key Stone. Ending the battle reverts every Mega form and recharges every Key Stone.</p>
    ${any?rows.filter(r=>r.mons.length).map(r=>h`<div class="mgd"><div class="row sp"><b>${tName(r.t)}</b>${hasKey(r.t)?keyChip(r.t):h`<span class="pill">No Key Stone</span>`}</div>
      <ul class="mini-list">${r.mons.map(m=>{
        const mm=m.mega;
        const stoneOk=mm&&mm.stone?dexKey(m.item).indexOf(dexKey(mm.stone))>=0:false;
        const ok=megaAllowed(m);
        return h`<li><div class="row sp"><span class="mgn">${monIcon(m)}<span><b>${mName(m)}</b> ${megaOn(m)?h`<span class="pill mega">Mega-evolved</span>`:''}<br><span class="sub">${mm?mm.form+(mm.stone?(stoneOk?' · holding ':' · needs ')+mm.stone:''):'Mega details not added yet'}</span></span></span>
          <span class="seg" role="group" aria-label="Allow ${mName(m)} to Mega Evolve"><button data-act="megaGate" data-pid="${m.id}" data-v="1" aria-pressed="${String(ok)}">Allowed</button><button data-act="megaGate" data-pid="${m.id}" data-v="0" aria-pressed="${String(!ok)}">Not allowed</button></span></div></li>`;})}</ul></div>`)
      :h`<p class="sub">No Pokémon with a Mega form yet. Once a player enters one (Lucario, Gengar, Charizard…), it shows up here.</p>`}
  </section>`;
}
function megaReset(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  const si=m&&speciesInfo(m.species);
  if(!si||si.form)return;
  const list=MEGAS.filter(x=>x.b===si.id);
  if(!list.length)return;
  const x=list.find(y=>y.f===(m.mega&&m.mega.form))||pickMega(m,list);
  edit('p',id,'mega',megaPreset(x,si));
  toast('Reset to the official '+x.f+' values.',true);
  render();
}
function megaDrop(uid,pid){
  const id=uid+'/'+pid;
  if(!getLocal('p',id))return;
  edit('p',id,'mega',null);
  edit('p',id,'megaOn',false);
  render();
}
/* typing "Key Stone" in a bag row shows its charge line at once, without redrawing under the cursor */
function liveKeyLine(input,uid,doc){
  const box=input.closest&&input.closest('.item');
  if(!box)return;
  let line=box.querySelector(':scope > .kline');
  if(isKeyName(input.value)){
    const c=keyChip(doc||S.trainers[uid]);
    if(!line){line=document.createElement('div');line.className='kline';box.appendChild(line);}
    line.innerHTML=((c&&c.s)||'')+'<span class="sub">Lets your Pokémon Mega Evolve, once per battle.</span>';
  }else if(line)line.remove();
}

/* ---------- PTA handbook data: species, moves, passives ----------
   The text comes from the PTA 3 handbooks. It is not part of this site's files. The GM imports it once
   (GM Desk, Handbook data) and it is kept in the table's database, where only signed-in members can read it.
   Each document holds one JSON string, so the database has almost nothing to index. */
const PTA={idx:null,chunks:{},subs:{},busy:{},fail:{},lists:null,listsSub:null,listsBusy:null,listsFail:0};
const ptaKey=s=>dexKey(String(s==null?'':s).replace(/\bshiny\b/ig,' '));
const ptaLetter=k=>/^[a-z]/.test(k)?k.charAt(0):'_';
const hsh=v=>{let x=5381;const s=String(v);for(let i=0;i<s.length;i++)x=((x<<5)+x+s.charCodeAt(i))|0;return (x>>>0).toString(36);};
const NAME_RE=/^p\|([^|]+)\/([^|]+)\|(moves|passives)\.(\d+)\.name$/;
const jparse=s=>{try{return JSON.parse(s);}catch(e){return null;}};

/* the list of every species name in the handbook */
function ptaSetIdx(d){
  const names=d&&jparse(d.j);
  if(!Array.isArray(names)||!names.length){PTA.idx=null;ptaFillLists();return;}
  const byKey=new Map(),base=new Map();
  names.forEach(n=>{
    byKey.set(ptaKey(n),n);
    const b=ptaKey(String(n).replace(/\s*\(.*$/,''));
    if(!base.has(b))base.set(b,[]);
    base.get(b).push(n);
  });
  PTA.idx={names,byKey,base,t:num(d.t),ver:num(d.v)};
  ptaFillLists();
}
/* "Pikachu", "shiny pikachu" and "Zigzagoon (Urban)" find an entry; regional forms are left to the basic list */
function ptaResolve(sp){
  const I=PTA.idx;
  if(!I)return null;
  const k=ptaKey(sp);
  if(!k)return null;
  if(I.byKey.has(k))return I.byKey.get(k);
  if(REGION_RE.test(String(sp)))return null;
  const b=I.base.get(k);
  return b&&b.length?b[0]:null;
}
const ptaRec=name=>{const k=ptaKey(name),c=PTA.chunks[ptaLetter(k)];return (c&&c[k])||null;};

/* one document per first letter, read when a species of that letter is first needed */
function ptaChunk(L){
  if(PTA.chunks[L])return Promise.resolve(PTA.chunks[L]);
  if(PTA.busy[L])return PTA.busy[L];
  if(!S.db)return Promise.resolve(null);
  let done;
  const p=new Promise(r=>{done=r;});
  PTA.busy[L]=p;
  let first=true;
  const fin=v=>{if(first){first=false;clearTimeout(to);delete PTA.busy[L];if(!v)PTA.fail[L]=Date.now();done(v);}};
  const to=setTimeout(()=>fin(null),9000);
  if(PTA.subs[L])try{PTA.subs[L]();}catch(e){}
  PTA.subs[L]=S.db.collection('meta').doc('pta_'+L).onSnapshot(s=>{
    if(!s.exists){
      if(s.metadata&&s.metadata.fromCache)return;
      PTA.chunks[L]={};
    }else PTA.chunks[L]=jparse((s.data()||{}).j)||{};
    const was=!first;
    fin(PTA.chunks[L]);
    if(was)scheduleRender();
  },()=>fin(null));
  return p;
}
function ptaWarm(name){
  const L=ptaLetter(ptaKey(name));
  if(PTA.chunks[L]||PTA.busy[L]||(PTA.fail[L]&&Date.now()-PTA.fail[L]<30000))return;
  ptaChunk(L).then(()=>scheduleRender());
}

/* every move, passive and skill, for the name boxes */
function ptaLists(){
  if(PTA.lists)return Promise.resolve(PTA.lists);
  if(PTA.listsBusy)return PTA.listsBusy;
  if(!S.db||!PTA.idx||(PTA.listsFail&&Date.now()-PTA.listsFail<30000))return Promise.resolve(null);
  let done,first=true;
  const p=new Promise(r=>{done=r;});
  PTA.listsBusy=p;
  const fin=v=>{if(first){first=false;clearTimeout(to);PTA.listsBusy=null;if(!v)PTA.listsFail=Date.now();done(v);}};
  const to=setTimeout(()=>fin(null),9000);
  PTA.listsSub=S.db.collection('meta').doc('pta_lists').onSnapshot(s=>{
    if(!s.exists){if(s.metadata&&s.metadata.fromCache)return;fin(null);return;}
    const d=jparse((s.data()||{}).j)||{};
    const mk=a=>{const m=new Map();(a||[]).forEach(x=>m.set(dexKey(x.n),x));return m;};
    PTA.lists={moves:d.moves||[],passives:d.passives||[],skills:d.skills||[],megas:d.megas||[],moveMap:mk(d.moves),passMap:mk(d.passives),megaMap:mk(d.megas)};
    ptaFillLists();
    ptaResyncMegas();
    fin(PTA.lists);
  },()=>fin(null));
  return p;
}

function ptaFillLists(){
  const ds=$('#dl-species');
  if(ds){
    const have=new Set(DEXN.split('|').map(dexKey));
    const extra=PTA.idx?PTA.idx.names.filter(n=>!have.has(dexKey(n))):[];
    ds.innerHTML=DEXN.split('|').concat(extra).map(n=>'<option value="'+esc(n)+'">').join('');
  }
  const L=PTA.lists;
  const dm=$('#dl-moves'),dp=$('#dl-passives');
  if(dm)dm.innerHTML=L?L.moves.map(x=>'<option value="'+esc(x.n)+'">').join(''):'';
  if(dp)dp.innerHTML=L?L.passives.map(x=>'<option value="'+esc(x.n)+'">').join(''):'';
}

/* Mega details that were filled in automatically pick up the handbook's numbers once they are available (the player's own Pokémon only) */
function ptaResyncMegas(){
  if(!S.me.id||!S.ready)return;
  setTimeout(()=>{
    monsOf(S.me.id).forEach(m=>{if(m.mega&&m.mega.auto&&canEditT(S.me.id))syncMega(S.me.id,m.id,true);});
    scheduleRender();
  },0);
}

/* ---------- a handbook entry as the fields of a Pokémon sheet ---------- */
function ptaFields(r){
  const t=(r.ty||[]).slice(0,2);
  const gloss=x=>x.t&&x.t.length<=48?x.n+' ('+x.t+')':x.n;
  return {
    types:[t[0]||'',t[1]||''],
    base:{atk:num(r.at),def:num(r.df),spa:num(r.sa),spd:num(r.sd),spe:num(r.sp)},
    hp:Math.round(num(r.hp)*hpx()),
    size:SIZES.indexOf(r.sz)>=0?r.sz:'Medium',
    weight:WEIGHTS.indexOf(r.wt)>=0?r.wt:'Medium',
    skills:(r.sk||[]).map(gloss).join(', '),
    passives:(r.ps||[]).map(x=>({name:x.n,text:x.t||''})),
    moves:(r.mv||[]).map(x=>({name:x.n,freq:x.f||'At-Will',kind:x.k||'Physical',range:x.r||'',type:x.t||'Normal',dice:x.d||'',text:x.x||'',used:0}))
  };
}
const sigPs=a=>hsh(JSON.stringify((a||[]).map(x=>[x.name||'',x.text||''])));
const sigMv=a=>hsh(JSON.stringify((a||[]).map(x=>[x.name||'',x.freq||'',x.kind||'',x.range||'',x.type||'',x.dice||'',x.text||''])));
const namesOf=a=>(a||[]).map(x=>dexKey(x.name)).join('|');
function ptaSame(m,F){
  const curT=[(m.types||[])[0]||'',(m.types||[])[1]||''];
  return sameArr(curT,F.types)&&sameArr(baseList(m.base),baseList(F.base))&&num(m.hp&&m.hp.max)===F.hp
    &&m.size===F.size&&m.weight===F.weight&&namesOf(m.passives)===namesOf(F.passives)&&namesOf(m.moves)===namesOf(F.moves);
}
/* true when the Pokémon already has passives or moves of the player's own that a fill would replace */
function ptaWouldReplace(m,F){
  const sig=m.autoSig||{};
  const ps=m.passives||[],mv=m.moves||[];
  const ownPs=ps.length&&sig.ps!==sigPs(ps)&&sigPs(ps)!==sigPs(F.passives);
  const ownMv=mv.length&&sig.mv!==sigMv(mv)&&sigMv(mv)!==sigMv(F.moves);
  return !!(ownPs||ownMv);
}

/* fills in a Pokémon from its handbook entry. Fields the player has changed since the last fill are left alone, unless force is set. */
function ptaApply(uid,pid,rec,force){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  if(!m)return false;
  const F=ptaFields(rec);
  const sig=Object.assign({},m.autoSig||{});
  const si=speciesInfo(m.species);
  const prev=m.autoSid?infoBySid(m.autoSid):null;
  const curT=[(m.types||[])[0]||'',(m.types||[])[1]||''];
  const curB=baseList(m.base);
  const hp=m.hp||{};
  const ps=m.passives||[],mv=m.moves||[];
  const was=(k,cur)=>sig[k]===hsh(cur);
  const ok={
    ty:force||(!curT[0]&&!curT[1])||was('ty',curT.join('/'))||!!(prev&&sameArr(curT,prev.types)),
    ba:force||curB.every(v=>v===3)||curB.every(v=>v===0)||was('ba',curB.join(','))||!!(prev&&sameArr(curB,baseList(prev.base))),
    hp:force||!num(hp.max)||(num(hp.max)===20&&num(hp.cur)===20)||was('hp',String(num(hp.max))),
    sz:force||!m.size||m.size==='Medium'||was('sz',m.size),
    wt:force||!m.weight||m.weight==='Medium'||was('wt',m.weight),
    sk:force||!String(m.skills||'').trim()||was('sk',String(m.skills||'')),
    ps:force||!ps.length||sig.ps===sigPs(ps),
    mv:force||!mv.length||sig.mv===sigMv(mv)
  };
  const kept=[];
  if(ok.ty){edit('p',id,'types',F.types.slice());sig.ty=hsh(F.types.join('/'));}else kept.push('types');
  if(ok.ba){edit('p',id,'base',Object.assign({},m.base||{},F.base));sig.ba=hsh(baseList(F.base).join(','));}else kept.push('base stats');
  if(ok.hp){
    const cur=num(hp.cur)>=num(hp.max)?F.hp:Math.min(num(hp.cur),F.hp);
    edit('p',id,'hp',Object.assign({},hp,{cur,max:F.hp}));sig.hp=hsh(String(F.hp));
    edit('p',id,'hpx',hpx());
  }else kept.push('HP');
  if(ok.sz){edit('p',id,'size',F.size);sig.sz=hsh(F.size);}else kept.push('size');
  if(ok.wt){edit('p',id,'weight',F.weight);sig.wt=hsh(F.weight);}else kept.push('weight');
  if(ok.sk){edit('p',id,'skills',F.skills);sig.sk=hsh(F.skills);}else kept.push('skills');
  if(ok.ps){edit('p',id,'passives',F.passives.map(x=>Object.assign({},x)));sig.ps=sigPs(F.passives);}else kept.push('passives');
  if(ok.mv){edit('p',id,'moves',F.moves.map(x=>Object.assign({},x)));sig.mv=sigMv(F.moves);}else kept.push('moves');
  edit('p',id,'autoSig',sig);
  edit('p',id,'psRef',psEffect(ok.ps?F.passives:ps));
  edit('p',id,'autoPta',ptaKey(rec.n));
  if(si&&num(m.autoSid)!==si.sid)edit('p',id,'autoSid',si.sid);
  const mf=syncMega(uid,pid);
  const bits=['Filled in '+rec.n+' from the handbook: '+F.types.filter(Boolean).join(' / ')+' · HP '+F.hp+' · '+F.passives.length+' passive'+(F.passives.length===1?'':'s')+' · '+F.moves.length+' move'+(F.moves.length===1?'':'s')+'.'];
  if(kept.length)bits.push('Kept your '+kept.join(', ')+'.');
  if(mf)bits.push(mf+' details added.');
  toast(bits.join(' '),true);
  return true;
}

/* typing a move or passive name fills in the rest of its row, when the row is still empty */
function ptaRowFill(t){
  const mt=NAME_RE.exec(t.dataset.b||'');
  if(!mt)return false;
  const uid=mt[1],pid=mt[2],kind=mt[3],i=+mt[4];
  const id=uid+'/'+pid;
  const go=()=>{
    const m=getLocal('p',id);
    const L=PTA.lists;
    const row=m&&(m[kind]||[])[i];
    if(!row||!L)return;
    const def=(kind==='moves'?L.moveMap:L.passMap).get(dexKey(row.name));
    if(!def)return;
    let next,msg;
    if(kind==='moves'){
      if(String(row.text||'').trim()||String(row.dice||'').trim())return;
      next=Object.assign({},row,{name:def.n,freq:def.f||row.freq,kind:def.k||row.kind,range:def.r||row.range,type:def.t||row.type,dice:def.d||'',text:def.x||''});
      msg='Filled in '+def.n+' from the handbook.';
    }else{
      if(String(row.text||'').trim())return;
      next=Object.assign({},row,{name:def.n,text:def.t||''});
      msg='Filled in '+def.n+' from the handbook.';
    }
    edit('p',id,kind,m[kind].map((x,j)=>j===i?next:x));
    toast(msg,true);
    renderSoon();
  };
  if(PTA.lists)go();
  else ptaLists().then(go);
  return true;
}

/* ---------- GM Desk: import ---------- */
/* ---------- House rule: every Pokémon's HP is the handbook number times a multiplier (the GM sets it; the default is double) ---------- */
function hpx(){
  const v=Math.round(Number(S.meta&&S.meta.hpx));
  return v>=1&&v<=5?v:1;
}
/* the multiplier a Pokémon's current HP was set up at. Sheets from before the rule have no mark, which means ×1. */
function hpxOf(m){
  const v=Math.round(num(m&&m.hpx));
  return v>=1?v:1;
}
/* every Pokémon whose HP is at a different multiplier from the table's: players' Pokémon, NPC teams and foes in the battle */
function hpxList(){
  const want=hpx(),out=[];
  const add=(sc,id,path,m,who,cid)=>{
    const hp=m&&m.hp;
    if(!hp||num(hp.max)<=0||hpxOf(m)===want)return;
    /* a blank sheet (20 / 20 and never filled in) has no real HP to scale; filling it in from the handbook already uses the new number */
    if(sc==='p'&&num(hp.max)===20&&num(hp.cur)===20&&!(m.autoSig&&m.autoSig.hp))return;
    out.push({sc,id,path,m,hp,from:hpxOf(m),cid:cid||'',who});
  };
  Object.keys(S.pokemon||{}).forEach(uid=>{
    const box=S.pokemon[uid]||{};
    Object.keys(box).forEach(pid=>add('p',uid+'/'+pid,'',box[pid],(box[pid].nick||box[pid].species||'Pokémon')+' ('+tName(S.trainers[uid])+')'));
  });
  Object.keys(S.gmNt||{}).forEach(nid=>{
    const nt=S.gmNt[nid];
    (Array.isArray(nt&&nt.team)?nt.team:[]).forEach((m,i)=>add('gt',nid,'team.'+i+'.',m,(m.nick||m.sp||'Pokémon')+' ('+ntName(nt)+')'));
  });
  const fo=(S.battleGm&&S.battleGm.foes)||{};
  Object.keys(fo).forEach(cid=>add('gb','battle','foes.'+cid+'.',fo[cid],(fo[cid].nick||fo[cid].sp||'Foe')+' (in the battle)',cid));
  return out;
}
/* current and maximum HP both change by the same factor, so damage already taken stays in proportion */
function hpxApply(){
  if(!S.me.admin)return;
  const want=hpx(),list=hpxList();
  if(!list.length){toast('Every Pokémon is already at ×'+want+'.');return;}
  list.forEach(x=>{
    const k=want/x.from;
    const oldMax=num(x.hp.max),oldCur=num(x.hp.cur);
    const max=Math.max(1,Math.round(oldMax*k));
    const cur=oldCur<=0?0:clamp(Math.round(oldCur*k),1,max);
    edit(x.sc,x.id,x.path+'hp',Object.assign({},x.hp,{cur,max}));
    edit(x.sc,x.id,x.path+'hpx',want);
    if(x.sc==='p'&&x.m.autoSig&&x.m.autoSig.hp===hsh(String(oldMax)))edit('p',x.id,'autoSig.hp',hsh(String(max)));
    if(x.sc==='gb'){
      if(num(x.m.alMax)>0)edit('gb','battle',x.path+'alMax',Math.max(1,Math.round(num(x.m.alMax)*k)));
      foePublish(x.cid);
    }
  });
  toast('Set '+list.length+' Pokémon to ×'+want+' HP.',true);
  render();
}
function hpxAct(b){
  if(b.dataset.act==='hpx_apply')hpxApply();
}
function hpxDesk(){
  const want=hpx(),list=hpxList();
  return h`<section class="panel"><div class="ph"><h2>Pokémon HP</h2><span class="pill gm">GM only</span></div>
    <div class="fgrid">${fNum('HP multiplier for every Pokémon','meta','table','hpx',S.meta,{min:1,max:5})}</div>
    <p class="sub">The handbook’s HP is multiplied by this number: 1 is the book, 2 is double. It is used when a Pokémon is filled in from the handbook, when it evolves, for wild foes and for NPC teams. The Pokédex shows the multiplied number.</p>
    ${list.length?h`<div class="hpxgo" role="status"><p><b>${list.length}</b> Pokémon on the site were set up at a different multiplier.</p>
      <p class="sub">${list.slice(0,8).map(x=>x.who).join(', ')}${list.length>8?' and '+(list.length-8)+' more':''}.</p>
      <p class="sub">Their current and maximum HP both change to match ×${want}, so damage already taken stays in proportion. Do this once, right after you change the number.</p>
      <button class="btn primary" data-act="hpx_apply">Set all ${list.length} to ×${want} HP</button></div>`
      :h`<p class="sub"><b>Every Pokémon on the site is at ×${want} HP.</b> New ones filled in from the handbook use it automatically.</p>`}
  </section>`;
}

function ptaDesk(){
  const I=PTA.idx,im=S.ui.pta||{};
  const when=I&&I.t?new Date(I.t).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'';
  return h`<section class="panel"><div class="ph"><h2>Handbook data</h2><span class="pill gm">GM only</span>
      <div class="acts"><button class="btn sm" data-act="ptaPick" ${im.busy?raw('disabled'):''}>${I?'Import again':'Import handbook data'}</button></div></div>
    ${I?h`<p class="sub">${I.names.length} Pokémon from the PTA 3 books are in your database${when?', imported '+when:''}. Type a species and its stats, passives and moves fill in. Type a move or passive name and its details fill in.${I.ver>=2?' Evolution lines are included.':' This copy has no evolution lines. Import again with the newest file to turn evolution on.'}${I.ver>=3?' Contest moves are included.':' This copy has no contest moves. Import again with the newest file to add them.'}${I.ver>=4?' The legendary Pokémon from the Game Master’s Guide are included.':' This copy has no legendary Pokémon. Import again with the newest file to add them.'}</p>`
      :h`<p class="sub">Not imported yet. Choose <b>pta-handbook-data.json</b> from the update download. This fills in stats, passives and moves when someone types a species. The handbook text goes into your database, not into the public site.</p>`}
    ${im.busy?h`<progress class="ptaprog" max="${num(im.total)}" value="${num(im.done)}" aria-label="Import progress"></progress>`:''}
    ${im.msg?h`<p class="sub ${im.bad?'bad':''}" role="status">${im.msg}</p>`:''}
  </section>`;
}
async function ptaImport(file){
  const im=S.ui.pta=S.ui.pta||{};
  const say=(msg,bad)=>{im.msg=msg;im.bad=!!bad;im.busy=false;scheduleRender();};
  let d=null;
  try{d=JSON.parse(await file.text());}catch(e){}
  if(!d||d.format!=='sinnoh-pta-handbook'||!Array.isArray(d.species)||!d.species.length){say('That is not the handbook data file. Use pta-handbook-data.json from the update download.',true);return;}
  const groups={};
  d.species.forEach(s=>{const k=ptaKey(s&&s.n);if(!k)return;const L=ptaLetter(k);(groups[L]||(groups[L]={}))[k]=s;});
  const letters=Object.keys(groups).sort();
  const cm=Array.isArray(d.contest)&&d.contest.length?d.contest:null;
  im.busy=true;im.done=0;im.total=letters.length+2+(cm?1:0);im.msg='Importing…';im.bad=false;scheduleRender();
  try{
    for(const L of letters){
      await S.db.collection('meta').doc('pta_'+L).set({v:1,j:JSON.stringify(groups[L])});
      im.done++;scheduleRender();
    }
    await S.db.collection('meta').doc('pta_lists').set({v:1,j:JSON.stringify({moves:d.moves||[],passives:d.passives||[],skills:d.skills||[],megas:d.megas||[]})});
    im.done++;
    if(cm){await S.db.collection('meta').doc('pta_contest').set({v:1,j:JSON.stringify(cm)});im.done++;}
    await S.db.collection('meta').doc('pta_idx').set({v:num(d.v)||1,t:Date.now(),j:JSON.stringify(d.species.map(s=>s.n))});
    im.done++;
  }catch(e){say('The import stopped ('+((e&&e.code)||'error')+'). Some of it may be saved. Run it again to finish.',true);return;}
  say('Imported '+d.species.length+' Pokémon, '+(d.moves||[]).length+' moves, '+(d.passives||[]).length+(cm?' passives, ':' passives and ')+(d.megas||[]).length+' Mega forms'+(cm?' and '+cm.length+' contest moves':'')+'.',false);
}

/* ---------- Evolution, and stat passives ----------
   The Pokédex lists what each species evolves into and what that needs: a stone, a place or time, or nothing
   for a natural evolution. The GM approves an evolution the way a Mega Evolution is approved. Approval is tied to
   the species the Pokémon is today, so it closes by itself once the Pokémon has evolved.
   The Pokédex stat blocks already include their stat passives (Power Up, Agility +2 Speed, and so on), so a passive
   never adds to the stats shown. When a passive that changes stats is added or removed by hand, the card offers
   to move that difference into the Adj boxes. */

/* ----- stat passives ----- */
const EVO_FLAT=(()=>{
  const o={};
  [['Power Up',{atk:1}],['Thick Hide',{def:1}],['Focused',{spa:1}],['Vigilant',{spd:1}],['Nimble',{spe:1}],
   ['Mighty',{atk:2}],['Fortified',{def:2}],['Amplified',{spa:2}],['Invulnerable',{spd:2}],['Volant',{spe:2}]]
    .forEach(a=>{o[dexKey(a[0])]=a[1];});
  return o;
})();
const PS_WORD={'special attack':'spa','special defense':'spd','attack':'atk','defense':'def','speed':'spe'};
/* "+2 Speed" and "+1 Attack, +1 Defense" are stat passives. Anything else is left to the players. */
function psParse(text){
  const t=String(text==null?'':text).trim().replace(/\.$/,'');
  if(!t)return null;
  const e={};
  const parts=t.split(/\s*,\s*/);
  for(let i=0;i<parts.length;i++){
    const m=/^\+(\d)\s+(special attack|special defense|attack|defense|speed)$/i.exec(parts[i].trim());
    if(!m)return null;
    const k=PS_WORD[m[2].toLowerCase()];
    e[k]=(e[k]||0)+(+m[1]);
  }
  return e;
}
function psEffect(list){
  const out={atk:0,def:0,spa:0,spd:0,spe:0};
  (list||[]).forEach(p=>{
    const k=dexKey(p&&p.name);
    if(!k)return;
    let e=EVO_FLAT[k]||psParse(p.text);
    if(!e&&!String(p.text||'').trim()&&PTA.lists){const d=PTA.lists.passMap.get(k);if(d)e=psParse(d.t);}
    if(e)STAT_KEYS.forEach(s=>{out[s]+=num(e[s]);});
  });
  return out;
}
/* what the passives added the last time the Pokémon was filled in from the handbook or evolved */
function psRefOf(m){
  if(m.psRef&&typeof m.psRef==='object')return m.psRef;
  if(m.autoPta&&ptaKey(m.species)===m.autoPta){
    const r=ptaRec(m.autoPta);
    if(r)return psEffect((r.ps||[]).map(x=>({name:x.n,text:x.t||''})));
  }
  return null;
}
function psDelta(m){
  const ref=psRefOf(m);
  if(!ref)return null;
  const cur=psEffect(m.passives);
  const d={};let any=false;
  STAT_KEYS.forEach(k=>{d[k]=cur[k]-num(ref[k]);if(d[k])any=true;});
  return any?d:null;
}
function psHint(uid,m){
  const d=psDelta(m);
  if(!d)return '';
  const bits=STAT_KEYS.filter(k=>d[k]).map(k=>sgn(d[k])+' '+STATS.find(s=>s[0]===k)[1]);
  return h`<div class="pshint" role="status"><span>Passives changed: <b>${bits.join(', ')}</b>. The stat boxes already count the passives the handbook lists, so this difference is not in them yet.</span>
    <span class="row"><button class="btn sm" data-act="psAdj" data-uid="${uid}" data-pid="${m.id}">Add to Adj</button><button class="btn sm ghost" data-act="psKeep" data-uid="${uid}" data-pid="${m.id}">Leave it</button></span></div>`;
}
function psAdj(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  const d=m&&psDelta(m);
  if(!d)return;
  STAT_KEYS.forEach(k=>{if(d[k])edit('p',id,'bonus.'+k,num(m.bonus&&m.bonus[k])+d[k]);});
  edit('p',id,'psRef',psEffect(m.passives));
  toast('Added the passive change to the Adj boxes.',true);
  render();
}
function psKeep(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  if(!m)return;
  edit('p',id,'psRef',psEffect(m.passives));
  render();
}

/* ----- approval ----- */
const evoGate=m=>{const v=S.megaOk&&S.megaOk['e_'+m.id];return typeof v==='string'?v:'';};
const evoFree=()=>!!(S.megaOk&&S.megaOk.e_open===true);
function evoOk(m,to){
  if(S.me.admin||evoFree())return true;
  const g=evoGate(m).split('|');
  if(!g[0]||g[0]!==ptaKey(m.species))return false;
  return !g[1]||g[1]===ptaKey(to);
}
function monById(pid){
  const ids=tids();
  for(let i=0;i<ids.length;i++){
    const m=monsOf(ids[i]).find(x=>x.id===pid);
    if(m)return {uid:ids[i],m};
  }
  return null;
}
function evoGateSet(pid,on,target){
  if(!S.me.admin)return;
  const f=monById(pid);
  if(!f)return;
  const k=ptaKey(f.m.species);
  edit('mg','mega','e_'+pid,on?(target?k+'|'+ptaKey(target):k):'');
  render();
}
function evoTarget(pid,val){
  if(!S.me.admin)return;
  evoGateSet(pid,true,val);
}
function evoOpenSet(on){
  if(!S.me.admin)return;
  edit('mg','mega','e_open',!!on);
  render();
}

/* ----- what a Pokémon can become ----- */
const evoRecOf=m=>{const pr=ptaResolve(m.species);return pr?ptaRec(pr):null;};
const stoneOf=c=>{const x=/\b([A-Za-z]+) Stone\b/.exec(c||'');return x?x[1]+' Stone':'';};
function bagStone(uid,name){
  const t=S.trainers[uid];
  if(!t||!name)return -1;
  const k=dexKey(name);
  return (t.items||[]).findIndex(x=>x&&dexKey(x.name).indexOf(k)>=0&&(x.qty==null||x.qty===''||num(x.qty)>0));
}
const splitTop=s=>{
  const out=[];let d=0,cur='';
  String(s==null?'':s).split('').forEach(ch=>{
    if(ch==='(')d++;
    if(ch===')')d=Math.max(0,d-1);
    if(ch===','&&!d){if(cur.trim())out.push(cur.trim());cur='';}else cur+=ch;
  });
  if(cur.trim())out.push(cur.trim());
  return out;
};
const skillKey=t=>dexKey(String(t).replace(/\s*\(.*$/,''));

/* the whole change, worked out before anything is written */
function evoPlan(uid,pid,m,toRec,cond){
  const F=ptaFields(toRec);
  const oldRec=evoRecOf(m);
  const oldF=oldRec?ptaFields(oldRec):null;
  /* passives: the new entry's list; the player's own rows win where both have the passive; passives they added themselves stay */
  const curPs=(m.passives||[]).filter(x=>x&&String(x.name||'').trim());
  const oldPs=new Set((oldRec?oldRec.ps:[]).map(x=>dexKey(x.n)));
  const newPs=new Set((toRec.ps||[]).map(x=>dexKey(x.n)));
  const own=curPs.filter(x=>{const k=dexKey(x.name);return !newPs.has(k)&&(!oldRec||!oldPs.has(k));});
  const passives=F.passives.map(x=>{
    const mine=curPs.find(c=>dexKey(c.name)===dexKey(x.name));
    return Object.assign({},mine||x);
  }).concat(own.map(x=>Object.assign({},x))).slice(0,TPL_MAX.passives);
  const gained=F.passives.filter(x=>!curPs.some(c=>dexKey(c.name)===dexKey(x.name))).map(x=>x.name);
  const dropped=curPs.filter(x=>{const k=dexKey(x.name);return !newPs.has(k)&&oldRec&&oldPs.has(k);}).map(x=>x.name);
  /* skills */
  const oldSk=new Set(splitTop(oldF?oldF.skills:'').map(skillKey));
  const newSk=new Set(splitTop(F.skills).map(skillKey));
  const ownSk=splitTop(m.skills).filter(t=>{const k=skillKey(t);return k&&!newSk.has(k)&&(!oldF||!oldSk.has(k));});
  const skills=splitTop(F.skills).concat(ownSk).join(', ');
  /* moves: everything the Pokémon knows is kept, and free slots take the new entry's moves */
  const cur=(m.moves||[]).filter(x=>x&&String(x.name||'').trim());
  const have=new Set(cur.map(x=>dexKey(x.name)));
  const inNew=new Set(F.moves.map(x=>dexKey(x.name)));
  const cands=cur.map(x=>({row:Object.assign({},x),isNew:false,inNew:inNew.has(dexKey(x.name)),sel:true}));
  F.moves.forEach(x=>{if(!have.has(dexKey(x.name)))cands.push({row:Object.assign({},x),isNew:true,inNew:true,sel:false});});
  let free=TPL_MAX.moves-cands.filter(c=>c.sel).length;
  cands.forEach(c=>{if(c.isNew&&free>0){c.sel=true;free--;}});
  const st=stoneOf(cond);
  const stone=st?{name:st,i:bagStone(uid,st)}:null;
  const oldB=baseList(m.base);
  const hp=m.hp||{};
  const rows=[{ab:'HP',o:Math.round(num(hp.max)*hpx()/hpxOf(m)),n:F.hp}].concat(STATS.map((s,i)=>({ab:s[2],o:oldB[i],n:num(F.base[s[0]])})));
  return {uid,pid,from:m.species,to:toRec.n,F,cands,passives,gained,dropped,own:own.map(x=>x.name),skills,stone,rows,cond:cond||''};
}
const evoMoveCount=p=>p.cands.filter(c=>c.sel).length;

async function evoPick(uid,pid,to){
  const id=uid+'/'+pid;
  const m0=getLocal('p',id);
  const m=m0&&Object.assign({id:pid},m0);
  if(!m||!canEditT(uid))return;
  if(megaOn(m)){toast('Revert the Mega form first.');return;}
  if(!evoOk(m,to)){toast('The GM has not approved this evolution yet.');return;}
  const k=ptaKey(to);
  const rec=ptaRec(to)||await ptaChunk(ptaLetter(k)).then(()=>ptaRec(to));
  if(!rec){toast('That species is not in the handbook data.');return;}
  const m2=getLocal('p',id);
  if(!m2)return;
  const from=evoRecOf(m2);
  const opt=((from&&from.ev)||[]).find(o=>ptaKey(o.n)===ptaKey(rec.n));
  S.ui.evo=evoPlan(uid,pid,m2,rec,opt&&opt.c);
  render();
}
function evoMv(n){
  const p=S.ui.evo;
  if(!p||!p.cands[n])return;
  p.cands[n].sel=!p.cands[n].sel;
  render();
}
function evoMvBook(){
  const p=S.ui.evo;
  if(!p)return;
  let left=TPL_MAX.moves;
  p.cands.forEach(c=>{c.sel=c.inNew&&left>0;if(c.sel)left--;});
  render();
}
function evoCancel(){S.ui.evo=null;render();}

const EVO_KEEP=['species','types','base','hp','hpx','size','weight','skills','passives','moves','autoSig','autoPta','autoSid','psRef','mega','megaOn'];
async function evoGo(uid,pid){
  const p=S.ui.evo;
  const id=uid+'/'+pid;
  if(!p||p.uid!==uid||p.pid!==pid)return;
  const m0=getLocal('p',id);
  const m=m0&&Object.assign({id:pid},m0);
  if(!m||!canEditT(uid))return;
  if(megaOn(m)){toast('Revert the Mega form first.');return;}
  if(!evoOk(m,p.to)){toast('The GM has not approved this evolution yet.');return;}
  const rec=ptaRec(p.to);
  if(!rec){toast('That species is not in the handbook data.');return;}
  const mv=p.cands.filter(c=>c.sel);
  if(mv.length>TPL_MAX.moves){toast('A Pokémon can know '+TPL_MAX.moves+' moves. Untick '+(mv.length-TPL_MAX.moves)+'.');return;}
  const F=p.F;
  const nm=mName(m);
  /* a copy of the old sheet, so a wrong pick can be undone */
  const snap={};
  EVO_KEEP.forEach(k=>{snap[k]=m[k]===undefined?null:JSON.parse(JSON.stringify(m[k]));});
  const undo={from:m.species,to:rec.n,at:Date.now(),snap};
  if(p.stone&&p.stone.i>=0){
    const t=S.trainers[uid];
    const it=t&&(t.items||[])[p.stone.i];
    if(it&&dexKey(it.name).indexOf(dexKey(p.stone.name))>=0){
      const q=it.qty;
      undo.stone={i:p.stone.i,qty:q==null?'':q,name:p.stone.name};
      edit('t',uid,'items.'+p.stone.i+'.qty',q==null||q===''?0:Math.max(0,num(q)-1));
    }
  }
  edit('p',id,'species',rec.n);
  edit('p',id,'types',F.types.slice());
  edit('p',id,'base',Object.assign({},m.base||{},F.base));
  const hp=m.hp||{};
  /* an older sheet is brought to the table's multiplier first, so the damage it has taken stays in proportion */
  const hk=hpx()/hpxOf(m);
  const oldMax=num(hp.max)*hk,oldCur=num(hp.cur)*hk;
  const cur=!oldMax?F.hp:(oldCur<=0?0:clamp(F.hp-Math.round(oldMax-oldCur),1,F.hp));
  edit('p',id,'hp',Object.assign({},hp,{cur,max:F.hp}));
  edit('p',id,'hpx',hpx());
  edit('p',id,'size',F.size);
  edit('p',id,'weight',F.weight);
  edit('p',id,'skills',p.skills);
  edit('p',id,'passives',p.passives.map(x=>Object.assign({},x)));
  const moves=mv.map(c=>Object.assign({},c.row));
  edit('p',id,'moves',moves);
  const sig=Object.assign({},m.autoSig||{});
  sig.ty=hsh(F.types.join('/'));sig.ba=hsh(baseList(F.base).join(','));sig.hp=hsh(String(F.hp));sig.sz=hsh(F.size);sig.wt=hsh(F.weight);
  sig.sk=p.skills===F.skills?hsh(F.skills):'';
  sig.ps=sigPs(p.passives)===sigPs(F.passives)?sigPs(F.passives):'';
  sig.mv=sigMv(moves)===sigMv(F.moves)?sigMv(F.moves):'';
  edit('p',id,'autoSig',sig);
  edit('p',id,'autoPta',ptaKey(rec.n));
  const si=speciesInfo(rec.n);
  if(si)edit('p',id,'autoSid',si.sid);
  edit('p',id,'psRef',psEffect(p.passives));
  edit('p',id,'evoUndo',undo);
  edit('p',id,'evoLog',(Array.isArray(m.evoLog)?m.evoLog:[]).concat([{at:undo.at,from:undo.from,to:rec.n}]).slice(-12));
  const mf=syncMega(uid,pid);
  S.ui.evo=null;
  const pop={uid,pid};
  S.ui.evoPop=pop;
  setTimeout(()=>{if(S.ui.evoPop===pop){S.ui.evoPop=null;scheduleRender();}},1800);
  const bits=[nm+' evolved into '+rec.n+'!'];
  if(undo.stone)bits.push('Used up 1 '+undo.stone.name+'.');
  if(mf)bits.push(mf+' details added.');
  toast(bits.join(' '),true);
  render();
}
function evoUndo(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  const U=m&&m.evoUndo;
  if(!U||!U.snap)return;
  EVO_KEEP.forEach(k=>{if(k in U.snap)edit('p',id,k,U.snap[k]);});
  if(U.stone&&U.stone.i>=0){
    const t=S.trainers[uid];
    const it=t&&(t.items||[])[U.stone.i];
    if(it&&dexKey(it.name).indexOf(dexKey(U.stone.name))>=0)edit('t',uid,'items.'+U.stone.i+'.qty',U.stone.qty);
  }
  edit('p',id,'evoUndo',null);
  edit('p',id,'evoLog',(Array.isArray(m.evoLog)?m.evoLog:[]).filter(x=>x&&x.at!==U.at));
  toast('Back to '+U.from+'.',true);
  render();
}
function evoKeep(uid,pid){
  if(!getLocal('p',uid+'/'+pid))return;
  edit('p',uid+'/'+pid,'evoUndo',null);
  render();
}
async function evoAny(uid,pid){
  if(!S.me.admin)return;
  const inp=document.querySelector('input[data-evoany="'+pid+'"]');
  const v=inp&&inp.value;
  const pr=ptaResolve(v);
  if(!pr){toast(v&&String(v).trim()?'That species is not in the handbook data.':'Type a species first.');return;}
  evoPick(uid,pid,pr);
}

/* ----- the card ----- */
function condText(o,uid){
  if(!o.c)return 'Natural: it evolves on its own when it feels ready. Training and a good bond help.';
  const st=stoneOf(o.c);
  let s='Needs: '+o.c;
  if(st)s+=bagStone(uid,st)>=0?' (you have one in your bag)':' (none in your bag)';
  return s;
}
function evoPlanView(uid,m,p){
  const n=evoMoveCount(p);
  const over=n>TPL_MAX.moves;
  const F=p.F;
  const oldT=[(m.types||[])[0]||'',(m.types||[])[1]||''].filter(Boolean);
  const typesSame=sameArr(oldT,F.types.filter(Boolean));
  return h`<div class="evplan">
    <div class="mgsum lcd"><b class="mgf">${p.from} → ${p.to}</b>
      <span class="mgt">${chipsOf(F.types.filter(Boolean))}</span>
      <span class="mgb">${typesSame?'Same type':'New type'} · ${F.size} · ${F.weight}</span></div>
    <div class="evstats lcd" role="group" aria-label="Stat changes">${p.rows.map(r=>h`<div class="evs"><span class="sl">${r.ab}</span><span class="evv">${r.o} → <b>${r.n}</b></span><span class="evd ${r.n>r.o?'up':r.n<r.o?'dn':''}">${r.n===r.o?'same':sgn(r.n-r.o)}</span></div>`)}</div>
    <p class="sub">Base stats, HP, size, weight and type come from the new entry. Your nature and Adj boxes stay as they are. Damage already taken carries over.</p>
    ${p.gained.length||p.dropped.length||p.own.length?h`<p class="sub evpass"><b>Passives.</b>${p.gained.length?h` New: ${p.gained.join(', ')}.`:''}${p.dropped.length?h` Gone: ${p.dropped.join(', ')}.`:''}${p.own.length?h` Yours, kept: ${p.own.join(', ')}.`:''}</p>`:h`<p class="sub evpass"><b>Passives.</b> Same as the new entry.</p>`}
    <div class="evmv"><div class="row sp"><span class="fl">Moves</span><span class="sub ${over?'bad':''}">${n} of ${TPL_MAX.moves}</span></div>
      <p class="sub">Your current moves stay unless you untick them. Tap a move to include or leave it out.</p>
      <div class="row evchips">${p.cands.map((c,i)=>h`<button class="btn sm chk" data-act="evoMv" data-n="${i}" aria-pressed="${String(c.sel)}">${c.row.name}${c.isNew?' (new)':''}</button>`)}</div>
      <div class="row"><button class="btn sm ghost" data-act="evoMvBook">Use the handbook’s moves</button></div></div>
    ${p.stone?h`<p class="sub">${p.stone.i>=0?'Uses up 1 '+p.stone.name+' from the bag.':'No '+p.stone.name+' in the bag. The GM can still allow it.'}</p>`:''}
    <div class="row"><button class="btn primary sm" data-act="evoGo" data-uid="${uid}" data-pid="${m.id}" ${over?raw('disabled'):''}>Evolve into ${p.to}</button>
      <button class="btn sm ghost" data-act="evoCancel">Cancel</button>
      ${over?h`<span class="sub bad">Untick ${n-TPL_MAX.moves} move${n-TPL_MAX.moves===1?'':'s'} first.</span>`:''}</div>
  </div>`;
}
function evoPanel(uid,m,ro){
  if(ro||!PTA.idx)return '';
  const pr=ptaResolve(m.species);
  const rec=pr?ptaRec(pr):null;
  if(pr&&!rec)ptaWarm(pr);
  const opts=(rec&&rec.ev)||[];
  const U=m.evoUndo;
  if(!opts.length&&!(U&&U.snap))return '';
  const pid=m.id,id=uid+'/'+pid;
  let plan=S.ui.evo&&S.ui.evo.uid===uid&&S.ui.evo.pid===pid?S.ui.evo:null;
  if(plan&&plan.from!==m.species)plan=null;
  const gm=!!S.me.admin;
  const key=ptaKey(m.species);
  const g=evoGate(m).split('|');
  const gateOn=g[0]===key;
  const free=evoFree();
  const blocked=megaOn(m);
  const okFor=o=>!blocked&&evoOk(m,o.n);
  const anyOk=opts.some(okFor);
  const pill=!opts.length?'':(anyOk?h`<span class="pill good">Ready</span>`:h`<span class="pill">Waiting for the GM</span>`);
  return h`<section class="megap evop"><div class="mph"><h4><i class="egem" aria-hidden="true">»</i>Evolution</h4>${pill}</div>
    ${U&&U.snap?h`<div class="row evundo"><span class="sub">Evolved from ${U.from}.</span><button class="btn sm" data-act="evoUndo" data-uid="${uid}" data-pid="${pid}">Undo evolution</button><button class="btn sm ghost" data-act="evoKeep" data-uid="${uid}" data-pid="${pid}">Keep it</button></div>`:''}
    ${plan?evoPlanView(uid,m,plan):(opts.length?h`
      <ul class="evopts">${opts.map(o=>h`<li><div class="eo-t"><b>${o.n}</b><span class="sub">${condText(o,uid)}</span></div>
        <button class="btn sm primary" data-act="evoPick" data-uid="${uid}" data-pid="${pid}" data-to="${o.n}" ${okFor(o)?'':raw('disabled')}>Evolve</button></li>`)}</ul>
      ${blocked?h`<p class="sub">Revert the Mega form before evolving.</p>`:(!anyOk?h`<p class="sub">Ask your GM to approve an evolution for this Pokémon.</p>`:'')}`:'')}
    ${gm&&!plan?h`<div class="mgate secret"><span class="fl">GM only · Evolution</span>
      ${opts.length?h`<div class="row"><div class="seg" role="group" aria-label="Allow evolution"><button data-act="evoGate" data-pid="${pid}" data-v="1" aria-pressed="${String(gateOn||free)}">Allowed</button><button data-act="evoGate" data-pid="${pid}" data-v="0" aria-pressed="${String(!gateOn&&!free)}">Not allowed</button></div>
        ${opts.length>1?h`<label class="evsel"><span class="sr">Form the player may pick</span><select data-evot="1" data-pid="${pid}"><option value="">Any form</option>${opts.map(o=>h`<option value="${ptaKey(o.n)}" ${gateOn&&g[1]===ptaKey(o.n)?raw('selected'):''}>${o.n} only</option>`)}</select></label>`:''}
        <span class="sub">${free?'Everyone may evolve freely (set in the GM Desk).':gateOn?'The player can evolve this Pokémon'+(g[1]?' into the form you picked':'')+'.':'The player cannot evolve it yet.'}</span></div>`:''}
      <div class="row"><label class="evany"><span class="sr">Evolve into any other species</span><input type="text" list="dl-species" data-evoany="${pid}" placeholder="Any other species, for a special case"></label><button class="btn sm" data-act="evoAny" data-uid="${uid}" data-pid="${pid}">Evolve into it</button></div></div>`:''}
  </section>`;
}

/* ----- GM Desk ----- */
function evoDesk(){
  const I=PTA.idx;
  if(!I)return '';
  const free=evoFree();
  const rows=tids().map(uid=>({uid,t:S.trainers[uid],mons:monsOf(uid).map(m=>{
    const pr=ptaResolve(m.species);
    const rec=pr?ptaRec(pr):null;
    if(pr&&!rec)ptaWarm(pr);
    return {m,rec};
  }).filter(x=>x.rec&&x.rec.ev&&x.rec.ev.length)}));
  const any=rows.some(r=>r.mons.length);
  return h`<section class="panel"><div class="ph"><h2>Evolution</h2><span class="pill gm">GM only</span></div>
    <p class="sub">A player can evolve a Pokémon only after you allow it, and only into the form you pick (or any form it can become). Allowing it is tied to the species the Pokémon is today, so it closes by itself after the evolution. You can always evolve any Pokémon from its own card.</p>
    <div class="row"><div class="seg" role="group" aria-label="Approval for evolution"><button data-act="evoOpen" data-v="0" aria-pressed="${String(!free)}">I approve each one</button><button data-act="evoOpen" data-v="1" aria-pressed="${String(free)}">Players may evolve freely</button></div></div>
    ${I.ver<2?h`<p class="sub bad">The handbook data in your database has no evolution lines yet. Import the newest pta-handbook-data.json below.</p>`:
      (any?rows.filter(r=>r.mons.length).map(r=>h`<div class="mgd"><div class="row sp"><b>${tName(r.t)}</b></div>
        <ul class="mini-list">${r.mons.map(x=>{
          const m=x.m,opts=x.rec.ev;
          const g=evoGate(m).split('|');
          const on=g[0]===ptaKey(m.species);
          return h`<li><div class="row sp"><span class="mgn">${monIcon(m)}<span><b>${mName(m)}</b><br><span class="sub">${m.species} → ${opts.map(o=>o.n).join(', ')}</span></span></span>
            <span class="row">${opts.length>1?h`<label class="evsel"><span class="sr">Form for ${mName(m)}</span><select data-evot="1" data-pid="${m.id}"><option value="">Any form</option>${opts.map(o=>h`<option value="${ptaKey(o.n)}" ${on&&g[1]===ptaKey(o.n)?raw('selected'):''}>${o.n} only</option>`)}</select></label>`:''}
            <span class="seg" role="group" aria-label="Allow ${mName(m)} to evolve"><button data-act="evoGate" data-pid="${m.id}" data-v="1" aria-pressed="${String(on||free)}">Allowed</button><button data-act="evoGate" data-pid="${m.id}" data-v="0" aria-pressed="${String(!on&&!free)}">Not allowed</button></span></span></div></li>`;})}</ul></div>`)
        :h`<p class="sub">No Pokémon that can still evolve yet.</p>`)}
  </section>`;
}

/* ---------- Rolls: type chart, combat stages, attack rolls and the table's shared roll log ----------
   The rules come from the PTA 3.5 Players Handbook (Making an Accuracy Check, Calculating Damage, Stat Ups and Downs).
   Accuracy:  1d20 + the attacker's stat modifier, against the target's Defense, Sp. Defense or Speed (Effect moves).
   Damage:    the move's dice, +1 die per step of type advantage, -1 per step of resistance, +1 per Attack stage up and per
              Defense stage down (the reverse for stages the other way), then the stat modifier and +4 for a same-type move.
              A natural 20 on the accuracy roll is a critical hit: every die counts as its highest face. */
S.ui.mr=S.ui.mr||{};

/* the book's type chart: "+" super effective, "-" resisted, "0" no effect. One line per attacking type. */
const TCH_SRC={
  Bug:'+Dark,Grass,Psychic|-Fairy,Fighting,Fire,Flying,Ghost,Poison,Steel|',
  Dark:'+Ghost,Psychic|-Dark,Fairy,Fighting|',
  Dragon:'+Dragon|-Steel|Fairy',
  Electric:'+Flying,Water|-Dragon,Electric,Grass|Ground',
  Fairy:'+Dark,Dragon,Fighting|-Fire,Poison,Steel|',
  Fighting:'+Dark,Ice,Normal,Rock,Steel|-Bug,Fairy,Flying,Poison,Psychic|Ghost',
  Fire:'+Bug,Grass,Ice,Steel|-Dragon,Fire,Rock,Water|',
  Flying:'+Bug,Fighting,Grass|-Electric,Rock,Steel|',
  Ghost:'+Ghost,Psychic|-Dark|Normal',
  Grass:'+Ground,Rock,Water|-Bug,Dragon,Fire,Flying,Grass,Poison,Steel|',
  Ground:'+Electric,Fire,Poison,Rock,Steel|-Bug,Grass|Flying',
  Ice:'+Dragon,Flying,Grass,Ground|-Fire,Ice,Steel,Water|',
  Normal:'|-Rock,Steel|Ghost',
  Poison:'+Fairy,Grass|-Ghost,Ground,Poison,Rock|Steel',
  Psychic:'+Fighting,Poison|-Psychic,Steel|Dark',
  Rock:'+Bug,Fire,Flying,Ice|-Fighting,Ground,Steel|',
  Steel:'+Fairy,Ice,Rock|-Electric,Fire,Steel,Water|',
  Water:'+Fire,Ground,Rock|-Dragon,Grass,Water|'
};
const TCH={};
Object.keys(TCH_SRC).forEach(a=>{
  const parts=TCH_SRC[a].split('|'),o={};
  (parts[0]||'').replace(/^\+/,'').split(',').filter(Boolean).forEach(t=>{o[t]=1;});
  (parts[1]||'').replace(/^-/,'').split(',').filter(Boolean).forEach(t=>{o[t]=-1;});
  (parts[2]||'').split(',').filter(Boolean).forEach(t=>{o[t]='i';});
  TCH[a]=o;
});
/* how a move of one type lands on a target of one or two types: c is a code, d is the number of dice added or removed */
function effOf(mvType,types){
  const row=TCH[mvType];
  const ts=(types||[]).filter(Boolean);
  if(!row||!ts.length)return {c:'n',d:0};
  let d=0;
  for(let i=0;i<ts.length;i++){
    const v=row[ts[i]];
    if(v==='i')return {c:'i',d:0};
    d+=v||0;
  }
  d=clamp(d,-2,2);
  return {c:['h','r','n','s','x'][d+2],d};
}
const EFF_CODES={n:{c:'n',d:0},s:{c:'s',d:1},x:{c:'x',d:2},r:{c:'r',d:-1},h:{c:'h',d:-2},i:{c:'i',d:0}};
const EFF_LBL={n:'Neutral',s:'Super effective',x:'Extremely effective',r:'Resisted',h:'Shielded',i:'No effect'};
const EFF_PICK=[['auto','Automatic'],['n','Neutral'],['s','Super effective (+1 die)'],['x','Extremely effective (+2 dice)'],['r','Resisted (−1 die)'],['h','Shielded (−2 dice)'],['i','No effect']];

/* ----- combat stages: -3 to +3 per stat, shown as ▲ and ▼ ----- */
const STG_MAX=3;
const stg=(o,k)=>clamp(Math.round(num(o&&o.stages&&o.stages[k])),-STG_MAX,STG_MAX);
const stgTxt=n=>n>0?'▲'.repeat(n):n<0?'▼'.repeat(-n):'–';
/* Speed ▲ and ▼ move the Speed stat itself, by 5 for each step */
const spdOf=m=>effStat(m,'spe')+5*stg(m,'spe');
const stgPills=o=>STATS.filter(s=>stg(o,s[0])).map(s=>h`<span class="pill stg ${stg(o,s[0])>0?'up':'dn'}">${s[2]}${stgTxt(stg(o,s[0]))}</span>`);
/* the five steppers. sc/id/path say where the stages are stored: a Pokémon's own sheet or a foe's secret sheet. */
function stagePanel(sc,id,path,o,ro,cid){
  return h`<div class="stgrow" role="group" aria-label="Combat stages">${STATS.map(s=>{
    const v=stg(o,s[0]);
    return h`<div class="stg ${v>0?'up':v<0?'dn':''}"><span class="sl">${s[2]}</span>
      ${ro?'':h`<button class="btn sm ghost" data-act="b_stg" data-sc="${sc}" data-id="${id}" data-path="${path}" data-k="${s[0]}" data-d="-1" data-cid="${cid||''}" aria-label="Lower ${s[1]} stage" ${v<=-STG_MAX?raw('disabled'):''}>−</button>`}
      <b class="sv" aria-label="${s[1]} stage ${v}">${stgTxt(v)}</b>
      ${ro?'':h`<button class="btn sm ghost" data-act="b_stg" data-sc="${sc}" data-id="${id}" data-path="${path}" data-k="${s[0]}" data-d="1" data-cid="${cid||''}" aria-label="Raise ${s[1]} stage" ${v>=STG_MAX?raw('disabled'):''}>+</button>`}</div>`;
  })}</div>`;
}

/* ----- afflictions ----- */
const AFFL=['Bound','Burned','Confused','Dazed','Disabled','Drowsy','Entranced','Frostbitten','Paralyzed','Poisoned','Toxified'];
const afflList=s=>String(s||'').split(/\s*[,;/]\s*/).map(x=>x.trim()).filter(Boolean);
const afflHas=(s,a)=>afflList(s).some(x=>dexKey(x)===dexKey(a));
const afflToggle=(s,a)=>{
  const l=afflList(s);
  return (afflHas(s,a)?l.filter(x=>dexKey(x)!==dexKey(a)):l.concat([a])).join(', ');
};
function afflChips(sc,id,path,cur,ro,cid){
  return h`<div class="row evchips" role="group" aria-label="Status">${AFFL.map(a=>h`<button class="btn sm chk" data-act="b_aff" data-sc="${sc}" data-id="${id}" data-path="${path}" data-a="${a}" data-cid="${cid||''}" aria-pressed="${String(afflHas(cur,a))}" ${dis(ro)}>${a}</button>`)}</div>`;
}

/* ----- dice ----- */
const rnd=n=>1+Math.floor(Math.random()*n);
function parseDice(s){
  const m=/^\s*(\d+)\s*d\s*(\d+)\s*(?:([+\-−])\s*(\d+))?\s*$/i.exec(String(s==null?'':s));
  if(!m)return null;
  return {n:+m[1],s:+m[2],f:m[3]?(m[3]==='+'?1:-1)*(+m[4]):0};
}
function d20adv(mode){
  const a=rnd(20);
  if(mode!=='adv'&&mode!=='dis')return {v:a,all:[a]};
  const b=rnd(20);
  return {v:mode==='adv'?Math.max(a,b):Math.min(a,b),all:[a,b]};
}
const kindStat=k=>k==='Special'?{acc:'spa',dmg:'spa',def:'spd',ab:'SpA',dab:'SpDef'}:k==='Effect'?{acc:'spe',dmg:null,def:'spe',ab:'Spe',dab:'Spe'}:{acc:'atk',dmg:'atk',def:'def',ab:'Atk',dab:'Def'};

/* One attack, worked out in full. o:
   mv {name,kind,type,dice}  aTypes  aAcc (the accuracy stat)  aDmg (the damage stat)  aStage (Attack or Sp. Attack stage)
   tTypes (null when the target's types are not known)  tDef (null when unknown)  tStage (null when unknown)
   eff ('auto' or a code)  accBonus  dmgBonus  adv  onlyDmg  crit
   Nothing here touches the database. */
function atkCalc(o){
  const mv=o.mv||{};
  const k=KINDS.indexOf(mv.kind)>=0?mv.kind:'Physical';
  const ks=kindStat(k);
  const out={k,mv:mv.name||'Move',type:mv.type||''};
  let crit=!!o.crit;
  if(!o.onlyDmg){
    const r=d20adv(o.adv);
    const mm=mod(o.aAcc);
    const bonus=num(o.accBonus);
    const tot=r.v+mm+bonus;
    out.ac={tot,d:r.v,all:r.all,mod:mm,bonus,adv:o.adv==='adv'||o.adv==='dis'?o.adv:'normal',ab:ks.ab};
    crit=r.v===20;
    if(o.tDef!=null){out.vs=num(o.tDef);out.vsAb=ks.dab;out.hit=tot>=num(o.tDef);}
  }
  out.crit=crit;
  const dc=parseDice(mv.dice);
  if(!dc)return out;
  const plain=k==='Effect';
  let eff=EFF_CODES.n;
  if(!plain){
    if(o.eff&&o.eff!=='auto'&&EFF_CODES[o.eff])eff=EFF_CODES[o.eff];
    else if(o.tTypes)eff=effOf(mv.type,o.tTypes);
  }
  out.ef=eff.c;
  if(eff.c==='i'){out.dm={tot:0,imm:true,base:dc.n,s:dc.s,rolled:[],n:0,ef:'i'};return out;}
  const stageD=plain?0:num(o.aStage)-num(o.tStage);
  const n=Math.max(0,dc.n+(plain?0:eff.d)+stageD);
  const rolled=[];
  for(let i=0;i<n;i++)rolled.push(crit?dc.s:rnd(dc.s));
  const sum=rolled.reduce((a,b)=>a+b,0);
  const stab=!plain&&mv.type&&(o.aTypes||[]).indexOf(mv.type)>=0?4:0;
  const stat=plain||!ks.dmg?0:mod(o.aDmg);
  const extra=num(o.dmgBonus);
  const tot=Math.max(0,sum+dc.f+stat+stab+extra);
  out.dm={tot,base:dc.n,n,s:dc.s,rolled,eff:eff.d,stageD,fixed:dc.f,stat,stab,extra,ef:eff.c,ab:ks.ab};
  return out;
}
const dieWord=n=>Math.abs(n)+(Math.abs(n)===1?' die':' dice');
function acText(c){
  const a=c.ac;
  if(!a)return '';
  const d=a.adv==='adv'?'advantage '+a.all.join(' / ')+' → '+a.d:a.adv==='dis'?'disadvantage '+a.all.join(' / ')+' → '+a.d:String(a.d);
  let s='d20 '+d+(a.mod?' + '+a.ab+' '+a.mod:'')+(a.bonus?' '+sgn(a.bonus):'')+' = '+a.tot;
  if(c.crit)s+=' · natural 20!';
  if(c.vs!=null)s+=' vs '+c.vsAb+' '+c.vs+(c.hit?' · hit':' · miss');
  return s;
}
function dmText(c){
  const m=c.dm;
  if(!m)return '';
  if(m.imm)return EFF_LBL.i+': no damage.';
  const bits=[];
  if(m.eff)bits.push((m.eff>0?'+':'−')+dieWord(m.eff)+' '+EFF_LBL[m.ef].toLowerCase());
  if(m.stageD)bits.push((m.stageD>0?'+':'−')+dieWord(m.stageD)+' from stages');
  const dice=m.base+'d'+m.s+(bits.length?' ('+bits.join(', ')+') = '+m.n+'d'+m.s:'');
  let s=dice+(c.crit?' · critical, every die at its top face':'')+': ['+m.rolled.join(', ')+']';
  const add=[];
  if(m.fixed)add.push(sgn(m.fixed));
  if(m.stat)add.push('+'+m.stat+' '+m.ab);
  if(m.stab)add.push('+4 same-type');
  if(m.extra)add.push(sgn(m.extra));
  return s+(add.length?' '+add.join(' '):'')+' = '+m.tot;
}

/* ----- the roll log ----- */
function rollWho(){
  const uid=S.me.id,t=uid&&S.trainers[uid];
  return t&&t.name?t.name:(S.me.admin?(S.meta.gm||'GM'):'Someone');
}
/* Local box first (full detail), then the table's log. e.gm marks a roll the GM makes for a foe. */
function logRoll(e,local){
  e.id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  e.at=Date.now();
  S.rolls.unshift(local||e);
  S.rolls=S.rolls.slice(0,6);
  S.ui.rollHidden=false;
  if(S.ui.secret&&S.me.admin)return;
  const uid=S.me.id;
  if(e.gm&&S.me.admin){
    e.who=S.meta.gm||'GM';
    edit('bt','battle','rolls',[e].concat((S.battle&&S.battle.rolls)||[]).slice(0,20));
  }else if(uid&&S.trainers[uid]&&canEditT(uid)){
    e.who=tName(S.trainers[uid]);
    edit('t',uid,'rolls',[e].concat(S.trainers[uid].rolls||[]).slice(0,20));
  }else if(S.me.admin){
    e.who=S.meta.gm||'GM';
    edit('bt','battle','rolls',[e].concat((S.battle&&S.battle.rolls)||[]).slice(0,20));
  }
}
/* the box and the log get the same facts. A foe's attack shows only its totals, never the foe's own numbers. */
function atkEntry(c,who,tgt,foe){
  const e={kind:'atk',label:c.mv,type:c.type,pk:who||'',tgt:tgt&&tgt.cid||'',tn:tgt&&tgt.name||''};
  if(c.ac)e.ac=c.ac.tot;
  if(c.crit)e.crit=true;
  if(c.hit!=null)e.hit=!!c.hit;
  if(c.dm){e.dm=c.dm.tot;e.ef=c.dm.ef;}
  const local=Object.assign({},e,{acd:acText(c),dmd:dmText(c)});
  if(!foe){e.acd=local.acd;e.dmd=local.dmd;}
  if(foe)e.gm=true;
  return {e,local};
}
/* Attack-only text from the old Pokétch box also reads fine for a check */
function chkEntry(label,total,detail){
  return {kind:'chk',label,total,detail};
}
function allRolls(){
  const out=[];
  Object.keys(S.trainers).forEach(uid=>{(S.trainers[uid].rolls||[]).forEach((r,i)=>out.push(Object.assign({src:uid,i},r)));});
  ((S.battle&&S.battle.rolls)||[]).forEach((r,i)=>out.push(Object.assign({src:'gm',i},r)));
  return out.filter(r=>r&&r.at).sort((a,b)=>num(b.at)-num(a.at));
}
const hhmm=ts=>new Date(ts).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
function rollRowText(r){
  if(r.kind==='atk'){
    const bits=[];
    if(r.ac!=null)bits.push('Accuracy '+r.ac+(r.crit?' (natural 20)':''));
    if(r.dm!=null)bits.push('Damage '+r.dm);
    return bits.join(' · ')||'Used';
  }
  return String(r.total);
}
function rollLogView(limit,gm){
  const rows=allRolls().slice(0,limit||30);
  if(!rows.length)return h`<p class="sub">Nothing rolled yet. Rolls from the Trainer sheet and the Pokémon cards appear here for everyone.</p>`;
  return h`<ol class="rlog">${rows.map(r=>{
    const ap=r.kind==='atk'&&r.dm!=null&&r.tgt&&gm&&btC(r.tgt);
    return h`<li class="${r.kind==='atk'?'atk':''}"><span class="rt">${hhmm(r.at)}</span>
      <span class="rb"><b>${r.who||'Someone'}</b>${r.pk?h` · ${r.pk}`:''} · ${r.label}${r.tn?h` <span class="sub">→ ${r.tn}</span>`:''}
        <span class="rv">${rollRowText(r)}${r.hit===true?h` <span class="pill good">Hit</span>`:r.hit===false?h` <span class="pill">Miss</span>`:''}${r.crit?h` <span class="pill gm">Crit</span>`:''}${r.ef&&r.ef!=='n'?h` <span class="pill">${EFF_LBL[r.ef]}</span>`:''}</span>
        ${r.acd||r.dmd?h`<span class="sub rd">${[r.acd,r.dmd].filter(Boolean).join(' · ')}</span>`:(r.detail?h`<span class="sub rd">${r.detail}</span>`:'')}</span>
      ${ap?(r.ap?h`<span class="pill">Applied</span>`:h`<button class="btn sm" data-act="b_apply" data-src="${r.src}" data-id="${r.id}">Apply ${r.dm} to ${r.tn||'target'}</button>`):''}</li>`;
  })}</ol>`;
}

/* ----- rolling a move from a Pokémon card ----- */
const mrKey=(uid,pid,i)=>uid+'/'+pid+'#'+i;
/* the targets a player may pick: the others in the battle, by the name everyone can see */
function btTargets(exceptRef){
  const b=S.battle||{};
  if(!b.on)return [];
  return (b.order||[]).filter(cid=>b.c&&b.c[cid]&&b.c[cid].r!==exceptRef).map(cid=>{
    const v=btInfo(cid,false);
    return v?{cid,name:v.name+(v.side==='a'?' ('+v.owner+')':'')}:null;
  }).filter(Boolean);
}
function moveForm(uid,pid,i,x){
  const key=mrKey(uid,pid,i);
  const f=S.ui.mr;
  if(f.key!==key)return '';
  const tg=btTargets(uid+'/'+pid);
  const info=f.tgt?btInfo(f.tgt,false):null;
  const known=info&&info.types;
  const plain=x.kind==='Effect';
  return h`<div class="mrform lcd" role="group" aria-label="Roll ${x.name||'move'}">
    <div class="mrgrid">
      ${tg.length?h`<label class="fld"><span class="fl">Target</span><select data-u="mr.tgt"><option value="">No target</option>${tg.map(t=>h`<option value="${t.cid}" ${f.tgt===t.cid?raw('selected'):''}>${t.name}</option>`)}</select></label>`:''}
      ${plain?'':h`<label class="fld"><span class="fl">Type advantage</span><select data-u="mr.eff">${EFF_PICK.map(([v,l])=>h`<option value="${v}" ${(f.eff||'auto')===v?raw('selected'):''}>${l}</option>`)}</select></label>`}
      <label class="fld"><span class="fl">Accuracy bonus</span><input type="number" inputmode="numeric" data-u="mr.acc" data-nr value="${f.acc||''}" placeholder="0"></label>
      <label class="fld"><span class="fl">Damage bonus</span><input type="number" inputmode="numeric" data-u="mr.dmg" data-nr value="${f.dmg||''}" placeholder="0"></label>
    </div>
    ${plain?'':h`<p class="sub">${known?'Automatic uses '+info.name+'’s types, which the GM has shown.':(f.tgt?'This target’s types are hidden, so pick the advantage yourself once the GM tells you.':'Automatic treats it as neutral unless you pick a target whose types are shown.')}</p>`}
    <div class="row"><div class="seg" role="group" aria-label="Roll mode">${[['normal','Normal'],['adv','Advantage'],['dis','Disadvantage']].map(([v,l])=>h`<button data-act="adv" data-v="${v}" aria-pressed="${String(S.ui.adv===v)}">${l}</button>`)}</div>
      <label class="row"><input type="checkbox" data-u="mr.crit" data-nr ${f.crit?raw('checked'):''}><span>Critical hit (damage only)</span></label></div>
    <div class="row"><button class="btn primary sm" data-act="b_mroll" data-uid="${uid}" data-pid="${pid}" data-i="${i}">Roll attack</button>
      <button class="btn sm" data-act="b_mdmg" data-uid="${uid}" data-pid="${pid}" data-i="${i}">Damage only</button>
      <button class="btn sm ghost" data-act="b_mclose">Close</button></div>
  </div>`;
}
function moveRoll(uid,pid,i,onlyDmg){
  const m0=getLocal('p',uid+'/'+pid);
  if(!m0||!canEditT(uid))return;
  const m=Object.assign({id:pid},m0);
  const x=(m.moves||[])[i];
  if(!x)return;
  const f=S.ui.mr;
  const k=KINDS.indexOf(x.kind)>=0?x.kind:'Physical';
  const ks=kindStat(k);
  const info=f.tgt?btInfo(f.tgt,false):null;
  const tgtBit=info?{cid:f.tgt,name:info.name}:null;
  /* a target's Defense and stages are used only when everyone can see them (a player's Pokémon always can) */
  const c=atkCalc({
    mv:x,aTypes:effTypes(m),aAcc:k==='Effect'?spdOf(m):effStat(m,ks.acc),aDmg:ks.dmg?effStat(m,ks.dmg):0,aStage:ks.dmg?stg(m,ks.dmg):0,
    tTypes:info?info.types:null,tDef:info&&info.stat?(k==='Effect'?info.stat.spe:info.stat[ks.def]):null,tStage:info&&info.stage&&ks.dmg?num(info.stage[ks.def]):0,
    eff:f.eff||'auto',accBonus:num(f.acc),dmgBonus:num(f.dmg),adv:S.ui.adv,onlyDmg:!!onlyDmg,crit:!!onlyDmg&&!!f.crit
  });
  if(!c.ac&&!c.dm){toast('That move has no damage listed, so there is nothing to roll. Use Roll attack for the accuracy check.');return;}
  const who=mName(m);
  const {e,local}=atkEntry(c,who,tgtBit,false);
  logRoll(e,local);
  renderRoll();
  render();
}

/* the old Pokétch box, now with attack rolls */
function renderRoll(){
  const el=$('#rollbox');
  const r=S.rolls[0];
  if(!r||S.ui.rollHidden){el.hidden=true;el.innerHTML='';return;}
  el.hidden=false;
  const head=r.kind==='atk'?(r.pk?r.pk+' · ':'')+r.label:r.label;
  const more=S.rolls.length>1?h`<ul>${S.rolls.slice(1,5).map(x=>h`<li>${x.kind==='atk'?(x.pk?x.pk+' · ':'')+x.label+': '+rollRowText(x):x.label+': '+x.total}</li>`)}</ul>`:'';
  if(r.kind==='atk'){
    el.innerHTML=h`<div class="rh"><span>Pokétch · ${head}</span><button data-act="closeRoll" aria-label="Close roll panel">×</button></div>
      <div class="two">${r.ac!=null?h`<div><span class="k">ACCURACY</span><div class="big sm">${r.ac}</div></div>`:''}${r.dm!=null?h`<div><span class="k">DAMAGE</span><div class="big sm">${r.dm}</div></div>`:''}</div>
      ${r.tn?h`<div class="det">Target: ${r.tn}${r.hit===true?' · hit':r.hit===false?' · miss':''}${r.crit?' · critical':''}</div>`:(r.crit?h`<div class="det">Critical hit</div>`:'')}
      ${r.acd?h`<div class="det dim">${r.acd}</div>`:''}${r.dmd?h`<div class="det dim">${r.dmd}</div>`:''}${more}`.s;
    return;
  }
  el.innerHTML=h`<div class="rh"><span>Pokétch · ${r.label}</span><button data-act="closeRoll" aria-label="Close roll panel">×</button></div><div class="big">${r.total}</div><div class="det">${r.detail}</div>${more}`.s;
}

/* skill and stat checks from the Trainer sheet: same roll as before, and now shared */
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
  const e=chkEntry(label,total,'d20 '+pick.txt+' = '+pick.base+' + mod '+m+(tal?' + talent '+tal:'')+note);
  logRoll(e);
}

/* ---------- Combat reference: a short reminder, on the Battle page, of what afflictions, stages and field conditions do ----------
   Condensed from the PTA 3.5 Players Handbook (Afflictions, Stat Ups and Stat Downs, Field Conditions, Calculating Damage).
   It is a memory aid in plain words, not a copy of the book: the handbook has the full rules. */
S.ui.ref=S.ui.ref||{open:{},atk:'Fire',d1:'Grass',d2:''};

const AFF_GEN='Once at the start of your turn, as a free action, you may make one Affliction check to cure one of your afflictions. If you spend your whole turn standing still, you take no damage from afflictions and can still make those checks.';
const AFF_INFO=[
  ['Bound','Stuck to another character, the Binder. No held items. You cannot move unless you are heavier than the Binder (if you do, it is dragged along). Attacks on anyone but the Binder are at disadvantage, and the Binder has advantage against you. Cure check: 16, unless the Binder also rolls 16 to hold on. It ends if either of you is at 0 HP.'],
  ['Burned','Attack ▼ at the start of your turn, and lose 1d6 HP when you act. Cure check: 16 (11 if you are Ice or Water). Fire types are immune.'],
  ['Confused','Movement is halved. When you attack, roll a Confusion check: 16 or more cures you, 11 or more uses the move you chose, 10 or less uses another of your moves at random on the same target (it can hurt allies). Cure check: 16.'],
  ['Dazed','Your next attack or skill check is at disadvantage. After it, or if you take damage, you are cured and cannot be Dazed again until the end of your next turn.'],
  ['Disabled','Applies to a single move, which cannot be used until the Pokémon has been out of combat for a minute, knocked out, or returned to its ball.'],
  ['Drowsy','Movement is halved and every move or feature that is not At-Will becomes 1/day. Cure check: 16, then 14, 12, 10, 8 and 6 on later turns.'],
  ['Entranced','Movement is halved unless you move toward the Entrancer. Your attacks on the Entrancer are at disadvantage and it has advantage against you. Cure check: 16, and being hit by the Entrancer cures it. Trainers cannot be Entranced.'],
  ['Frostbitten','Sp. Attack ▼ at the start of your turn, and lose 1d6 HP when you act. Cure check: 16 (11 if you are Fire). Ice types are immune.'],
  ['Paralyzed','No held items, and Speed ▼ at the start of your turn. When you attack, roll a Paralysis check: 16 or more cures you, 11 or more lets you act normally, 10 or less gives you Speed ▼▼ (max ▼▼▼). Cure check: 16. Electric types are immune.'],
  ['Poisoned','Lose 1d10 HP when you act. Cure check: 16. Reaching 0 HP also cures it. Poison and Steel types are immune.'],
  ['Toxified','Lose 1d8 HP when you act, then 2d8, 3d8 and so on each turn until cured. Cure check: 16. Reaching 0 HP also cures it. Poison and Steel types are immune.']
];
const AFF_ALIAS={burn:'Burned',frostbite:'Frostbitten',paralysis:'Paralyzed',poison:'Poisoned',toxic:'Toxified',bind:'Bound',disable:'Disabled',confusion:'Confused',daze:'Dazed',entrance:'Entranced'};
/* a status written by hand ("burn", "Paralysis") still finds its entry */
function affInfoFor(name){
  const k=dexKey(name);
  if(!k)return null;
  const want=AFF_ALIAS[k]||null;
  return AFF_INFO.find(x=>(want&&x[0]===want)||dexKey(x[0])===k)||null;
}
/* what each active status does, under a Pokémon's status buttons */
function afflNotes(status){
  const seen=new Set();
  const rows=afflList(status).map(a=>affInfoFor(a)).filter(x=>x&&!seen.has(x[0])&&seen.add(x[0]));
  if(!rows.length)return '';
  return h`<ul class="affnotes" aria-label="What these statuses do">${rows.map(x=>h`<li><b>${x[0]}.</b> ${x[1]}</li>`)}</ul>`;
}

const STAGE_RULES=[
  'Attack ▲ or ▼ changes how many dice you roll with damaging Physical attacks. Sp. Attack does the same for Special attacks.',
  'Defense ▲ or ▼ changes how many dice are rolled against you by Physical attacks. Sp. Defense does the same for Special attacks.',
  'Speed ▲ or ▼ changes your Speed stat itself, by 5 for each step. That can change the turn order, and it makes Effect moves easier or harder to land. Speed ▼ never lowers your movement below 10 ft.',
  'In the Battle page, each step is one die: a ▲ on the attacker or a ▼ on the target adds a die, and the reverse removes one.',
  '▲ and ▼ in the same stat cancel one for one (Attack ▲▲ and Attack ▼ leave Attack ▲).',
  'They do not stack with themselves: getting ▲ while you already have ▲▲ leaves ▲▲. Effects written “(Max ▲▲)” stack, but only up to that maximum.'
];
const FIELD_INFO=[
  ['Terrain',[
    ['Electric','Grounded Pokémon are immune to Drowsy and Entranced. Electric attacks +4.'],
    ['Flowery','At the start of their turns, Fairy and Grass types get Defense ▲ or Sp. Defense ▲. Fairy and Grass attacks +4.'],
    ['Grassy','Anyone who acts recovers 1d8 HP afterward. Grass attacks +4.'],
    ['Misty','Dragon attacks are resisted unless the target already resists them, and nobody can be given afflictions. Fairy attacks +4.'],
    ['Muddy','Electric attacks −8, Ground attacks +4.'],
    ['Psychic','Grounded Pokémon take no damage from Reaction or Priority moves used out of turn. Psychic attacks +4.'],
    ['Wet','Fire attacks −8, Water attacks +4. Flopper and Beached skills are ignored.']
  ]],
  ['Weather',[
    ['Hailing','Anyone who acts takes 2d4 afterward unless Ice. Ice attacks +4.'],
    ['Hazy','Anyone who acts loses all stat ▲ and ▼. Attacks cannot add bonuses to their accuracy.'],
    ['Misty','Nobody can be given ▼. Fairy and Ghost attacks +4.'],
    ['Pyroclastic','Anyone who acts takes 2d4 afterward unless Fire. Fire attacks +4.'],
    ['Raining','Water attacks +4, Fire attacks −8.'],
    ['Sandstorming','Anyone who acts takes 2d4 afterward unless Ground, Rock or Steel. Rock attacks +4.'],
    ['Snowy','Ice types get Defense ▲ or Sp. Defense ▲ at the start of their turns. Ice attacks +4.'],
    ['Sunny','Fire attacks +4, Water attacks −8.'],
    ['Gusty','Flying types and their adjacent allies get Speed ▲ at the start of their turns. Flying attacks +4.']
  ]],
  ['Zone',[
    ['Gravitized','Nobody can leave the ground, attacks get +1 accuracy, and Ground immunities become resistances.'],
    ['Ionic','All Normal moves are treated as Electric.'],
    ['Magical','Held items lose their effects and medicine items cannot be used (Mega Stones and Z-Crystals still work).'],
    ['Tricky','The initiative order is reversed, and a Priority move used out of turn acts last instead of first.'],
    ['Wonderful','Defense and Sp. Defense are swapped.']
  ]]
];
const ROLL_RULES=[
  'Accuracy check: d20 plus the stat modifier of the attacker (Attack, Sp. Attack, or Speed for Effect moves). It hits if it meets the target’s Defense, Sp. Defense, or Speed. A natural 20 is a critical hit: every damage die counts as its top face.',
  'Damage: the move’s dice, plus the stat modifier. Add 4 if the move’s type matches one of the user’s types.',
  'Type matchups change the dice: super effective +1 die, extremely effective +2, resisted −1, shielded −2, and no effect means no damage.',
  'Stages change the dice too (see Stat ▲ and ▼). Effect moves roll accuracy only.'
];

/* ----- the type matchup helper ----- */
function matchupView(){
  const r=S.ui.ref;
  const def=[r.d1,r.d2].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i);
  const e=r.atk&&def.length?effOf(r.atk,def):null;
  const groups=[['x','Extremely effective against it (+2 dice)'],['s','Super effective (+1 die)'],['r','Resisted (−1 die)'],['h','Shielded (−2 dice)'],['i','No effect']];
  const by={x:[],s:[],r:[],h:[],i:[]};
  if(def.length)TYPES.forEach(a=>{const g=effOf(a,def);if(by[g.c])by[g.c].push(a);});
  const opt=(v,cur,blank)=>h`${blank?h`<option value="">${blank}</option>`:''}${TYPES.map(t=>h`<option value="${t}" ${cur===t?raw('selected'):''}>${t}</option>`)}`;
  return h`<div class="mrgrid refmx">
      <label class="fld"><span class="fl">A move of type</span><select data-u="ref.atk">${opt('atk',r.atk,'Pick a type')}</select></label>
      <label class="fld"><span class="fl">hits a Pokémon of type</span><select data-u="ref.d1">${opt('d1',r.d1,'Pick a type')}</select></label>
      <label class="fld"><span class="fl">and (optional)</span><select data-u="ref.d2">${opt('d2',r.d2,'No second type')}</select></label>
    </div>
    ${e?h`<p class="refres" role="status"><span class="ty ${r.atk.toLowerCase()}">${r.atk}</span> on ${chipsOf(def)}: <b>${EFF_LBL[e.c]}</b>${e.d?' ('+(e.d>0?'+':'−')+dieWord(e.d)+')':''}</p>`:h`<p class="sub">Pick an attacking type and at least one defending type.</p>`}
    ${def.length?h`<div class="refgrps"><p class="fl">What hits ${def.join(' / ')} (every attacking type)</p>
      ${groups.map(([c,l])=>by[c].length?h`<div class="refgrp"><span class="sub">${l}</span><div class="types">${chipsOf(by[c])}</div></div>`:'')}</div>`:''}`;
}

/* ----- the panel ----- */
function refSec(k,title,body){
  const open=!!S.ui.ref.open[k];
  return h`<div class="refsec"><button class="refh" data-act="b_ref" data-k="${k}" aria-expanded="${String(open)}"><span>${title}</span><span class="refx" aria-hidden="true">${open?'−':'+'}</span></button>${open?h`<div class="refb">${body}</div>`:''}</div>`;
}
function refPanel(){
  return h`<section class="panel refp"><div class="ph"><h2>Combat reference</h2></div>
    <p class="sub">A quick reminder in plain words. The handbook has the full rules.</p>
    ${refSec('aff','Afflictions',h`<p class="sub">${AFF_GEN}</p><dl class="refdl">${AFF_INFO.map(x=>h`<dt>${x[0]}</dt><dd>${x[1]}</dd>`)}</dl>`)}
    ${refSec('stg','Stat ▲ and ▼',h`<ul class="reful">${STAGE_RULES.map(x=>h`<li>${x}</li>`)}</ul>`)}
    ${refSec('fld','Weather, terrain and zones',h`<p class="sub">Each lasts two minutes, centred on whoever created it. A new one of the same kind replaces the old.</p>${FIELD_INFO.map(([g,l])=>h`<h3 class="refg">${g}</h3><dl class="refdl">${l.map(x=>h`<dt>${x[0]}</dt><dd>${x[1]}</dd>`)}</dl>`)}`)}
    ${refSec('typ','Type matchups',matchupView())}
    ${refSec('rol','Rolls at a glance',h`<ul class="reful">${ROLL_RULES.map(x=>h`<li>${x}</li>`)}</ul>`)}
  </section>`;
}

/* ---------- Battle: turn order, health, stages and status, foes the GM keeps hidden, giving Pokémon, evolution log ----------
   Two documents hold a battle:
     meta/battle  what everyone at the table can see (the order, round, whose turn, the GM's public rolls, and for each
                  foe only the parts the GM has chosen to show). Only the GM can write it.
     gm/battle    the foes themselves: health, stats, moves, notes. Firestore's rules let only the GM read it, so a
                  player's browser never receives it. Hiding a foe is therefore done by the database, not by the screen. */
S.ui.bt=S.ui.bt||{amt:'',foeSp:'',foeNick:'',foeN:1,tgt:'',eff:'auto',open:{},giveTo:''};
S.ui.give=S.ui.give||{uid:'',sp:'',nick:'',caught:''};

const BT=()=>S.battle||{};
const btC=cid=>(BT().c||{})[cid]||null;
const foesOf=()=>(S.battleGm&&S.battleGm.foes)||{};
const foeOf=cid=>foesOf()[cid]||null;
/* a foe's number is its base and Adj, its nature, and its Mega bonus while it is Mega-evolved, the same sum a player's Pokémon uses */
const fStat=(f,k)=>effStat(f||{},k);
/* its types: the Mega form's while Mega-evolved */
const foeTypes=f=>{
  const mt=megaOn(f)?(f.mega.types||[]).filter(Boolean):[];
  return mt.length?mt:((f&&f.ty)||[]).filter(Boolean);
};
const fSpd=f=>fStat(f,'spe')+5*stg(f,'spe');
const newCid=()=>'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const stgObj=o=>({atk:stg(o,'atk'),def:stg(o,'def'),spa:stg(o,'spa'),spd:stg(o,'spd'),spe:stg(o,'spe')});
const SHOW_ALL={name:1,pic:1,types:1,hp:2,st:1,item:1,mega:1};
const SHOW_NONE={name:0,pic:0,types:0,hp:0,st:0,item:0,mega:0};
const zeroStats=()=>({atk:0,def:0,spa:0,spd:0,spe:0});

/* what the table sees of a foe, worked out from its secret sheet and the GM's choices. No empty values: the database refuses them. */
function foePub(f){
  const sh=f.sh||{};
  const hp=f.hp||{cur:0,max:0};
  const mx=Math.max(1,num(hp.max));
  const p=Math.round(clamp(num(hp.cur)/mx,0,1)*100)/100;
  const hv=num(sh.hp);
  /* the Mega form is only part of what the table sees once the GM ticks "Mega form" */
  const mgOn=megaOn(f)&&num(sh.mega)>0;
  const item=String(f.item||'').trim();
  return {
    n:sh.name?(f.nick||(mgOn&&f.mega.form)||f.sp||'Foe'):(f.pn||'Foe'),
    sp:sh.pic?(f.sp||''):'',
    ms:sh.pic&&mgOn&&num(f.mega.sid)>0?num(f.mega.sid):0,
    sy:sh.pic&&f.shiny===true?1:0,
    ty:sh.types?(mgOn?foeTypes(f):(f.ty||[]).filter(Boolean)):null,
    hp:hv>=2?{p,c:num(hp.cur),m:num(hp.max)}:hv===1?{p}:null,
    st:sh.st?String(f.st||''):null,
    sg:sh.st?stgObj(f):null,
    it:num(sh.item)&&item?item:null,
    mg:mgOn?(sh.name&&f.mega.form?String(f.mega.form):'Mega'):null,
    o:ntOwnerLabel(f),
    down:num(hp.cur)<=0
  };
}
function foePublish(cid){
  const f=foeOf(cid);
  if(!f||!btC(cid))return;
  edit('bt','battle','c.'+cid+'.pub',foePub(f));
}
const foeLabel=f=>f.nick||f.sp||'Foe';

/* Everything the viewer may know about one combatant. full is true only for the GM looking at a foe. */
function btInfo(cid,full){
  const c=btC(cid);
  if(!c)return null;
  if(c.s==='a'){
    const ref=String(c.r||'');
    const k=ref.indexOf('/');
    const uid=ref.slice(0,k),pid=ref.slice(k+1);
    const m0=getLocal('p',ref);
    if(!m0)return null;
    const m=Object.assign({id:pid},m0);
    return {cid,side:'a',uid,pid,ref,m,name:mName(m),owner:tName(S.trainers[uid]),types:effTypes(m),
      stat:{def:effStat(m,'def'),spd:effStat(m,'spd'),spe:spdOf(m)},stage:{def:stg(m,'def'),spd:stg(m,'spd')},
      hp:m.hp||{cur:0,max:0},down:num(m.hp&&m.hp.cur)<=0,status:m.status||'',stages:stgObj(m),showHp:2,pic:true};
  }
  const f=full&&S.me.admin?foeOf(cid):null;
  if(f){
    return {cid,side:'f',f,name:foeLabel(f),pubName:foePub(f).n,types:foeTypes(f),mega:megaOn(f),ms:megaOn(f)?num(f.mega.sid):0,itemTxt:String(f.item||'').trim(),
      stat:{def:fStat(f,'def'),spd:fStat(f,'spd'),spe:fSpd(f)},stage:{def:stg(f,'def'),spd:stg(f,'spd')},
      hp:f.hp||{cur:0,max:0},down:num(f.hp&&f.hp.cur)<=0,status:f.st||'',stages:stgObj(f),showHp:2,pic:true,sy:f.shiny===true?1:0};
  }
  const p=c.pub||{};
  return {cid,side:'f',name:p.n||'Unknown foe',types:p.ty&&p.ty.length?p.ty:null,stat:null,
    stage:p.sg?{def:num(p.sg.def),spd:num(p.sg.spd)}:null,
    hp:p.hp?{cur:num(p.hp.c!=null?p.hp.c:Math.round(num(p.hp.p)*100)),max:p.hp.m!=null?num(p.hp.m):100,p:num(p.hp.p),exact:p.hp.c!=null}:null,
    down:!!p.down,status:p.st||'',stages:p.sg||null,showHp:p.hp?(p.hp.c!=null?2:1):0,pub:p,pic:!!p.sp,sp:p.sp||'',mg:p.mg||null,ms:num(p.ms),sy:num(p.sy),itemTxt:p.it||''};
}

/* ----- order and turns ----- */
function btOrder(){
  const b=BT();
  return (b.order||[]).filter(cid=>{
    const c=b.c&&b.c[cid];
    if(!c)return false;
    return c.s==='a'?!!getLocal('p',c.r):true;
  });
}
const btIsDown=cid=>{
  const v=btInfo(cid,!!S.me.admin);
  return !v||v.down;
};
function btSpeed(cid){
  const c=btC(cid);
  if(!c)return 0;
  if(c.s==='a'){const m=getLocal('p',c.r);return m?spdOf(Object.assign({id:''},m)):0;}
  const f=foeOf(cid);
  return f?fSpd(f):0;
}
/* an ally's number is public; a foe's stays in the GM's secret sheet, because it would give away its Speed */
function btIni(cid){
  const c=btC(cid);
  if(!c)return 0;
  if(c.s==='a')return num(c.ini);
  const f=foeOf(cid);
  return f?num(f.ini):0;
}
function btSetIni(cid,ini,tb){
  const c=btC(cid);
  if(!c)return;
  if(c.s==='a'){edit('bt','battle','c.'+cid+'.ini',ini);edit('bt','battle','c.'+cid+'.tb',tb);}
  else{edit('gb','battle','foes.'+cid+'.ini',ini);edit('gb','battle','foes.'+cid+'.tb',tb);}
}
function btTb(cid){
  const c=btC(cid);
  if(!c)return 0;
  if(c.s==='a')return num(c.tb);
  const f=foeOf(cid);
  return f?num(f.tb):0;
}
function btRollInit(){
  if(!S.me.admin)return;
  const b=BT();
  const ids=Object.keys(b.c||{}).filter(cid=>btInfo(cid,true));
  if(!ids.length){toast('Add some Pokémon or foes first.');return;}
  const d20m=b.mode==='d20';
  const rows=ids.map(cid=>({cid,ini:btSpeed(cid)+(d20m?rnd(20):0),tb:rnd(20)}));
  rows.sort((a,z)=>z.ini-a.ini||z.tb-a.tb);
  rows.forEach(r=>btSetIni(r.cid,r.ini,r.tb));
  edit('bt','battle','order',rows.map(r=>r.cid));
  const first=rows.find(r=>!btIsDown(r.cid))||rows[0];
  edit('bt','battle','turn',first.cid);
  edit('bt','battle','round',1);
  edit('bt','battle','on',true);
  toast(d20m?'Initiative rolled: d20 plus Speed.':'Turn order set by Speed.',true);
  render();
}
/* Speed went up or down mid-fight: put everyone back in Speed order, keeping whose turn it is */
function btResort(){
  if(!S.me.admin)return;
  const b=BT();
  const ids=btOrder();
  const rows=ids.map(cid=>({cid,ini:btSpeed(cid),tb:btTb(cid)||rnd(20)}));
  rows.sort((a,z)=>z.ini-a.ini||z.tb-a.tb);
  rows.forEach(r=>btSetIni(r.cid,r.ini,r.tb));
  edit('bt','battle','order',rows.map(r=>r.cid));
  render();
}
function btNext(){
  if(!S.me.admin)return;
  const b=BT();
  if(!b.on)return;
  const ord=btOrder();
  if(!ord.length)return;
  let i=ord.indexOf(b.turn),round=num(b.round)||1,cand=null;
  for(let s=0;s<ord.length;s++){
    i++;
    if(i>=ord.length){i=0;round++;}
    if(!btIsDown(ord[i])){cand=ord[i];break;}
  }
  if(!cand){toast('Everyone is down.');return;}
  edit('bt','battle','turn',cand);
  edit('bt','battle','round',round);
  render();
}
function btTurnTo(cid){
  if(!S.me.admin||!btC(cid))return;
  edit('bt','battle','turn',cid);
  render();
}
function btMove(cid,d){
  if(!S.me.admin)return;
  const ord=(BT().order||[]).slice();
  const i=ord.indexOf(cid),j=i+d;
  if(i<0||j<0||j>=ord.length)return;
  const t=ord[i];ord[i]=ord[j];ord[j]=t;
  edit('bt','battle','order',ord);
  render();
}
function btSetMode(v){
  if(!S.me.admin)return;
  edit('bt','battle','mode',v==='d20'?'d20':'speed');
  render();
}

/* ----- adding and removing combatants ----- */
function btInsert(cid,obj,ini,tb){
  const b=BT();
  edit('bt','battle','c.'+cid,obj);
  const ord=(b.order||[]).filter(x=>b.c&&b.c[x]&&x!==cid);
  let at=ord.length;
  for(let i=0;i<ord.length;i++){
    const oi=btIni(ord[i]),ot=btTb(ord[i]);
    if(ini>oi||(ini===oi&&tb>ot)){at=i;break;}
  }
  ord.splice(at,0,cid);
  edit('bt','battle','order',ord);
  btSetIni(cid,ini,tb);
}
function btAddAlly(uid,pid,quiet){
  if(!S.me.admin)return;
  const ref=uid+'/'+pid;
  const m=getLocal('p',ref);
  if(!m)return;
  const b=BT();
  if(Object.keys(b.c||{}).some(k=>b.c[k].s==='a'&&b.c[k].r===ref))return;
  const cid=newCid();
  const sp=spdOf(Object.assign({id:pid},m));
  btInsert(cid,{s:'a',r:ref},sp+(b.mode==='d20'?rnd(20):0),rnd(20));
  if(!quiet)render();
}
function btAddParty(uid){
  if(!S.me.admin)return;
  partyOf(uid).forEach(m=>btAddAlly(uid,m.id,true));
  render();
}
function foeFromRec(rec,si,sp){
  if(rec){
    const F=ptaFields(rec);
    return {sp:rec.n,ty:F.types,sz:F.size,wt:F.weight,hp:{cur:F.hp,max:F.hp},hpx:hpx(),base:F.base,sk:F.skills,ps:F.passives,mv:F.moves};
  }
  if(si)return {sp:si.name,ty:si.types.slice(),sz:'Medium',wt:'Medium',hp:{cur:20,max:20},base:Object.assign({},si.base),sk:'',ps:[],mv:[]};
  return {sp,ty:['',''],sz:'Medium',wt:'Medium',hp:{cur:20,max:20},base:{atk:3,def:3,spa:3,spd:3,spe:3},sk:'',ps:[],mv:[]};
}
function foeLetter(){
  const used=new Set(Object.keys(foesOf()).map(k=>foesOf()[k].pn));
  for(let i=0;i<26;i++){const n='Foe '+String.fromCharCode(65+i);if(!used.has(n))return n;}
  return 'Foe '+(used.size+1);
}
async function btAddFoe(){
  if(!S.me.admin)return;
  const u=S.ui.bt;
  const sp=String(u.foeSp||'').trim();
  if(!sp){toast('Type a species first.');return;}
  const n=clamp(Math.round(num(u.foeN))||1,1,8);
  await btAddFoeSp(sp,n,n===1?String(u.foeNick||'').trim():'','');
  u.foeSp='';u.foeNick='';u.foeN=1;
  render();
}
/* ----- alpha Pokémon (PTA GM Guide): the wild aura, doubled HP and stronger stats while wild ----- */
const ALPHA_PS=[
  {name:'Wild Alpha Aura',text:'While wild, this Pokémon has Alpha Beam, Alpha Impact and Alpha Restoration, the passive Alpha Tenacity and the stat passive Wild Might. It loses the aura if it is captured.'},
  {name:'Alpha Tenacity',text:'Cannot be captured by non-Master Poké Balls unless it is at half of its max HP or lower. It is always treated as at full HP when working out the capture rate.'},
  {name:'Wild Might',text:'HP doubled, +5 Attack, +5 Special Attack, and Defense or Special Defense raised to 15.'}
];
const ALPHA_MV=[
  {name:'Alpha Beam',freq:'1/day',kind:'Special',range:'Ranged (25ft beam)',type:'Normal',dice:'5d20',text:'Needs a recharge turn afterwards. −2 on the Accuracy Check.',used:0},
  {name:'Alpha Impact',freq:'1/day',kind:'Physical',range:'Melee (10ft burst)',type:'Normal',dice:'5d20',text:'Needs a recharge turn afterwards. −2 on the Accuracy Check.',used:0},
  {name:'Alpha Restoration',freq:'3/day',kind:'Effect',range:'Self',type:'Normal',dice:'',text:'You are healed 1d12 HP. Your uses of Alpha Beam and Alpha Impact are restored as if you had rested.',used:0}
];
const ALPHA_NAMES=new Set(['Wild Alpha Aura','Alpha Tenacity','Wild Might','Alpha Beam','Alpha Impact','Alpha Restoration']);
function foeMakeAlpha(f){
  if(!f||f.alpha)return f;
  const bs=f.base||{};
  const bn=Object.assign(zeroStats(),f.bonus||{});
  const hp=f.hp||{cur:20,max:20};
  const mx=Math.max(1,num(hp.max));
  f.alMax=mx;
  f.hp={cur:mx*2,max:mx*2};
  bn.atk=num(bn.atk)+5;bn.spa=num(bn.spa)+5;
  /* Wild Might raises Defense or Special Defense to 15. The better one is raised, and the GM can change the Adj boxes. */
  const dk=num(bs.def)+num(bn.def)>=num(bs.spd)+num(bn.spd)?'def':'spd';
  const cur=num(bs[dk])+num(bn[dk]);
  if(cur<15)bn[dk]=num(bn[dk])+15-cur;
  f.bonus=bn;
  f.ps=(f.ps||[]).concat(ALPHA_PS.map(x=>Object.assign({},x)));
  f.mv=(f.mv||[]).concat(ALPHA_MV.map(x=>Object.assign({},x)));
  f.alpha=1;
  if(!String(f.nick||'').trim())f.nick='Alpha '+(f.sp||'');
  f.notes=(f.notes?f.notes+'\n':'')+'ALPHA. Wild Might: HP doubled, +5 Attack and Special Attack, '+(dk==='def'?'Defense':'Special Defense')+' raised to 15 (change the Adj boxes if you want the other one).';
  return f;
}
/* n hidden foes of one species, from the handbook data when it has the species. note goes on each foe's secret sheet. */
async function btAddFoeSp(sp,n,nick,note,opts){
  const pr=ptaResolve(sp);
  let rec=null;
  if(pr)rec=ptaRec(pr)||await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr));
  const si=rec?null:speciesInfo(sp);
  const b=BT();
  for(let i=0;i<n;i++){
    const cid=newCid();
    const base=foeFromRec(rec,si,sp);
    const f=Object.assign({nick:nick||'',bonus:zeroStats(),stages:zeroStats(),st:'',notes:note||'',sh:Object.assign({},SHOW_NONE),pn:foeLetter()},base);
    if(opts&&opts.alpha)foeMakeAlpha(f);
    edit('gb','battle','foes.'+cid,f);
    btInsert(cid,{s:'f',pub:foePub(f)},fSpd(f)+(b.mode==='d20'?rnd(20):0),rnd(20));
  }
  toast(n+(n===1?' foe':' foes')+' added'+(note?' ('+((opts&&opts.alpha)?'alpha ':'')+sp+')':'')+(rec||si?'':'. That species is not in the data, so fill in its numbers by hand')+'.',true);
}
function btRemove(cid){
  if(!S.me.admin)return;
  const b=BT();
  const c=b.c&&b.c[cid];
  if(!c)return;
  const ord=(b.order||[]).slice();
  const i=ord.indexOf(cid);
  if(b.turn===cid){
    const rest=ord.filter(x=>x!==cid);
    edit('bt','battle','turn',rest.length?(rest[i]||rest[0]):'');
  }
  if(i>=0)ord.splice(i,1);
  const nc=Object.assign({},b.c);delete nc[cid];
  edit('bt','battle','c',nc);
  edit('bt','battle','order',ord);
  if(c.s==='f'){const nf=Object.assign({},foesOf());delete nf[cid];edit('gb','battle','foes',nf);}
  else{const m=getLocal('p',c.r);if(m&&m.bpos)edit('p',c.r,'bpos',null);}
  delete S.ui.bt.open[cid];
  if(S.ui.bm&&S.ui.bm.sel===cid)S.ui.bm.sel='';
  bmSync();
  render();
}
function btEnd(){
  if(!S.me.admin)return;
  bmClearTokens();
  edit('bt','battle','on',false);
  edit('bt','battle','c',{});
  edit('bt','battle','order',[]);
  edit('bt','battle','turn','');
  edit('bt','battle','round',0);
  edit('gb','battle','foes',{});
  S.ui.bt.open={};
  endBattleAll();
}

/* ----- health, stages and status, for a Pokémon on the table or a foe in the GM's sheet ----- */
function canTouch(sc,id){
  if(sc==='p')return canEditT(String(id).split('/')[0]);
  if(sc==='gb')return !!S.me.admin;
  return false;
}
function btHp(cid,delta){
  const c=btC(cid);
  if(!c)return;
  if(c.s==='a'){
    const m=getLocal('p',c.r);
    if(!m||!canEditT(String(c.r).split('/')[0]))return;
    const hp=m.hp||{cur:0,max:0};
    edit('p',c.r,'hp.cur',clamp(num(hp.cur)+delta,0,Math.max(0,num(hp.max))));
  }else{
    const f=foeOf(cid);
    if(!f||!S.me.admin)return;
    const hp=f.hp||{cur:0,max:0};
    edit('gb','battle','foes.'+cid+'.hp.cur',clamp(num(hp.cur)+delta,0,Math.max(0,num(hp.max))));
    foePublish(cid);
  }
  render();
}
function btStage(sc,id,path,k,d,cid){
  if(!canTouch(sc,id))return;
  const doc=getLocal(sc,id);
  if(!doc)return;
  edit(sc,id,path+'.'+k,clamp(num(getIn(doc,path+'.'+k))+d,-STG_MAX,STG_MAX));
  if(cid&&sc==='gb')foePublish(cid);
  render();
}
function btAffl(sc,id,path,a,cid){
  if(!canTouch(sc,id))return;
  const doc=getLocal(sc,id);
  if(!doc)return;
  edit(sc,id,path,afflToggle(getIn(doc,path),a));
  if(cid&&sc==='gb')foePublish(cid);
  render();
}
function applyRoll(src,id){
  if(!S.me.admin)return;
  const list=src==='gm'?(BT().rolls||[]):((S.trainers[src]&&S.trainers[src].rolls)||[]);
  const i=list.findIndex(r=>r.id===id);
  if(i<0)return;
  const r=list[i];
  if(r.ap||r.dm==null||!r.tgt||!btC(r.tgt))return;
  btHp(r.tgt,-num(r.dm));
  const arr=list.map((x,j)=>j===i?Object.assign({},x,{ap:true}):x);
  if(src==='gm')edit('bt','battle','rolls',arr);else edit('t',src,'rolls',arr);
  toast((r.tn||'The target')+' takes '+r.dm+'.',true);
  render();
}

/* ----- the GM rolls for a foe ----- */
function foeRoll(cid,i,onlyDmg){
  if(!S.me.admin)return;
  const f=foeOf(cid);
  const x=f&&(f.mv||[])[i];
  if(!x)return;
  const k=KINDS.indexOf(x.kind)>=0?x.kind:'Physical';
  const ks=kindStat(k);
  const u=S.ui.bt;
  const info=u.tgt&&btC(u.tgt)?btInfo(u.tgt,true):null;
  const c=atkCalc({
    mv:x,aTypes:foeTypes(f),aAcc:k==='Effect'?fSpd(f):fStat(f,ks.acc),aDmg:ks.dmg?fStat(f,ks.dmg):0,aStage:ks.dmg?stg(f,ks.dmg):0,
    tTypes:info?info.types:null,tDef:info&&info.stat?(k==='Effect'?info.stat.spe:info.stat[ks.def]):null,tStage:info&&info.stage&&ks.dmg?num(info.stage[ks.def]):0,
    eff:u.eff||'auto',adv:S.ui.adv,onlyDmg:!!onlyDmg,crit:false
  });
  if(!c.ac&&!c.dm){toast('That move has no damage listed. Use Roll attack for the accuracy check.');return;}
  const {e,local}=atkEntry(c,foePub(f).n,info?{cid:u.tgt,name:info.name}:null,true);
  logRoll(e,local);
  renderRoll();
  render();
}

/* typing a move's name in a foe's sheet fills in the rest of the row from the handbook, when the row is still empty */
const FOE_MV_RE=/^gb\|battle\|foes\.([^.]+)\.mv\.(\d+)\.name$/;
function foeRowFill(t){
  const mt=FOE_MV_RE.exec(t.dataset.b||'');
  if(!mt)return false;
  const cid=mt[1],i=+mt[2];
  const go=()=>{
    const f=foeOf(cid);
    const row=f&&(f.mv||[])[i];
    const L=PTA.lists;
    if(!row||!L)return;
    const def=L.moveMap.get(dexKey(row.name));
    if(!def)return;
    if(String(row.text||'').trim()||String(row.dice||'').trim())return;
    const next=Object.assign({},row,{name:def.n,freq:def.f||row.freq,kind:def.k||row.kind,range:def.r||row.range,type:def.t||row.type,dice:def.d||'',text:def.x||''});
    edit('gb','battle','foes.'+cid+'.mv',f.mv.map((x,j)=>j===i?next:x));
    toast('Filled in '+def.n+' from the handbook.',true);
    renderSoon();
  };
  if(PTA.lists)go();else ptaLists().then(go);
  return true;
}

/* ----- a foe the party catches, or a Pokémon the GM hands out ----- */
function blankMon(uid,over){
  return Object.assign({owner:uid,nick:'',species:'',types:['',''],size:'Medium',weight:'Medium',die:'d6',hp:{cur:20,max:20},base:{atk:3,def:3,spa:3,spd:3,spe:3},bonus:zeroStats(),up:'',down:'',natureName:'',skills:'',passives:[],moves:[],item:'',status:'',caught:'',notes:'',slot:partyOf(uid).length<6?'party':'box',order:Date.now(),createdAt:Date.now()},over||{});
}
async function giveMon(){
  if(!S.me.admin)return;
  const g=S.ui.give;
  const uid=g.uid&&S.trainers[g.uid]?g.uid:tids()[0];
  const sp=String(g.sp||'').trim();
  const nick=String(g.nick||'').trim(),caught=String(g.caught||'').trim();
  if(!uid){toast('There are no trainers yet.');return;}
  if(!sp){toast('Type a species first.');return;}
  g.sp='';g.nick='';g.caught='';
  /* load the handbook page for this species first, so the sheet fills in at once and the note below is the last word */
  const pr=ptaResolve(sp);
  if(pr&&!ptaRec(pr)){try{await ptaChunk(ptaLetter(ptaKey(pr)));}catch(e){}}
  const id=S.db.collection('trainers').doc(uid).collection('pokemon').doc().id;
  newDoc('p',uid+'/'+id,blankMon(uid,{nick,species:sp,caught}));
  const known=!!(ptaResolve(sp)||speciesInfo(sp));
  if(known)applySpecies(uid,id,true);
  const slot=(getLocal('p',uid+'/'+id)||{}).slot;
  toast('Gave '+sp+' to '+tName(S.trainers[uid])+(slot==='box'?' (their party is full, so it went to the box)':'')+(known?'. Its numbers were filled in from the data':'. That species is not in the data, so fill in its numbers by hand')+'.',true);
  render();
}
function foeGive(cid){
  if(!S.me.admin)return;
  const f=foeOf(cid);
  const uid=S.ui.bt.giveTo&&S.trainers[S.ui.bt.giveTo]?S.ui.bt.giveTo:tids()[0];
  if(!f||!uid)return;
  const id=S.db.collection('trainers').doc(uid).collection('pokemon').doc().id;
  let hp=f.hp||{cur:20,max:20};
  let nick=f.nick||'',ps=(f.ps||[]).map(x=>Object.assign({},x)),mv=(f.mv||[]).map(x=>Object.assign({},x,{used:0}));
  const wasAlpha=!!f.alpha;
  if(wasAlpha){
    /* a captured alpha loses its aura and its doubled HP, and gains the stat passive Alpha */
    const mx=Math.max(1,num(f.alMax)||Math.round(num(hp.max)/2));
    hp={cur:Math.min(num(hp.cur),mx),max:mx};
    ps=ps.filter(x=>!ALPHA_NAMES.has(x.name));
    mv=mv.filter(x=>!ALPHA_NAMES.has(x.name));
    ps.push({name:'Alpha',text:'+1 Attack or +1 Special Attack, and +1 Defense or +1 Special Defense. Once chosen, the bonuses cannot be changed.'});
    if(nick==='Alpha '+(f.sp||''))nick='';
  }
  newDoc('p',uid+'/'+id,blankMon(uid,Object.assign({
    nick,species:f.sp||'',types:[(f.ty||[])[0]||'',(f.ty||[])[1]||''],size:f.sz||'Medium',weight:f.wt||'Medium',
    hp:{cur:Math.max(1,num(hp.cur)),max:Math.max(1,num(hp.max))},base:Object.assign({atk:3,def:3,spa:3,spd:3,spe:3},f.base),
    skills:f.sk||'',passives:ps,moves:mv,
    item:f.item||'',up:f.up||'',down:f.down||'',natureName:f.natureName||'',gender:f.gender||'',shiny:f.shiny===true,mega:f.mega?JSON.parse(JSON.stringify(f.mega)):null,
    caught:'Caught in the wild, session '+(num(S.meta.session)||1)
  },f.hpx?{hpx:num(f.hpx)}:{})));
  toast((f.sp||'The foe')+' now belongs to '+tName(S.trainers[uid])+'.'+(wasAlpha?' It lost the alpha aura and has the passive Alpha: choose its +1 bonuses on its sheet. If it now has four stat passives, one must go.':''),true);
  btRemove(cid);
}

/* =================== views =================== */
function foePic(v){
  if(v.pic&&(v.sp||(v.f&&v.f.sp)))return monPic({species:v.sp||(v.f&&v.f.sp),nick:v.name,img:'',mega:v.ms?{sid:v.ms}:null,megaOn:!!v.ms,shiny:num(v.sy)>0});
  return h`<span class="sp-ini unk" aria-hidden="true">?</span>`;
}
function btHpView(v){
  if(!v.hp)return h`<span class="sub">Health hidden</span>`;
  if(v.side==='f'&&!v.f&&v.showHp===1){
    return h`<span class="bhpw">${hpBar({cur:Math.round(num(v.hp.p)*100),max:100})}</span>`;
  }
  return h`<span class="bhpw">${hpBar(v.hp)}<span class="mono">${num(v.hp.cur)}/${num(v.hp.max)}</span></span>`;
}
function btRow(cid,idx,gm,turn){
  const v=btInfo(cid,gm);
  if(!v)return '';
  const open=!!S.ui.bt.open[cid];
  const mine=v.side==='a'&&canEditT(v.uid);
  const canOpen=gm||mine;
  const secret=v.side==='f'&&gm&&v.f;
  const ini=v.side==='a'?num(btC(cid).ini):(gm?btIni(cid):null);
  const own=secret?ntFoeOwner(v.f):(v.pub&&v.pub.o)||'';
  const sub=v.side==='a'?v.owner:'Foe'+(own?' · '+own:'')+(secret?' · players see “'+v.pubName+'”':'');
  const types=v.types&&v.types.length?chipsOf(v.types):'';
  const hidden=v.side==='f'&&!secret&&!v.types;
  return h`<li class="brow ${v.side==='a'?'ally':'foe'} ${turn?'turn':''} ${v.down?'down':''}" data-cid="${cid}">
    <div class="bmain">
      <span class="bn" aria-label="Position ${idx+1}">${idx+1}</span>
      <span class="bpic"><span class="spr bs ${v.side==='f'&&!v.pic?'unk':''}" ${v.side==='a'?typeVars(v.m):typeVars({types:v.types||[]})}>${v.side==='a'?monPic(v.m):foePic(v)}</span></span>
      <div class="btx"><b class="bnm">${v.name}</b>${turn?h` <span class="pill good">Acting</span>`:''}${secret&&v.f.alpha?h` <span class="pill encal">Alpha</span>`:''}${v.down?h` <span class="pill">Down</span>`:''}
        <span class="sub">${sub}${ini!=null&&ini!==0?' · initiative '+ini:''}</span>
        <div class="types">${types}${hidden?h`<span class="pill">Types unknown</span>`:''}${v.mega||v.mg?h`<span class="pill mega">Mega</span>`:''}${v.itemTxt&&v.side==='f'?h`<span class="pill">Holding ${v.itemTxt}</span>`:''}${v.status?h`<span class="pill status">${v.status}</span>`:''}${v.stages?stgPills({stages:v.stages}):''}${secret?h`<span class="pill gm">GM sheet</span>`:''}</div></div>
      <div class="bhp">${btHpView(v)}</div>
      ${canOpen?h`<button class="btn sm" data-act="b_open" data-cid="${cid}" aria-expanded="${String(open)}">${open?'Close':'Details'}</button>`:''}
    </div>
    ${open&&canOpen?(v.side==='a'?btAllyBody(cid,v,gm,idx):btFoeBody(cid,v,idx)):''}
  </li>`;
}
function btAmt(cid,canHeal){
  return h`<div class="row bamt"><div class="hpbtns lcdbtns">${[-5,-1,1,5].map(d=>h`<button data-act="b_hp" data-cid="${cid}" data-d="${d}">${d>0?'+'+d:'−'+Math.abs(d)}</button>`)}</div>
    <label class="fld"><span class="fl">Amount</span><input type="number" inputmode="numeric" data-u="bt.amt" data-nr value="${S.ui.bt.amt}" placeholder="0"></label>
    <button class="btn sm danger" data-act="b_dmg" data-cid="${cid}">Damage</button><button class="btn sm" data-act="b_heal" data-cid="${cid}">Heal</button></div>`;
}
function btOrderBtns(cid,idx){
  const n=btOrder().length;
  return h`<div class="row"><button class="btn sm" data-act="b_turn" data-cid="${cid}">Acts now</button>
    <button class="btn sm ghost" data-act="b_ord" data-cid="${cid}" data-d="-1" ${idx===0?raw('disabled'):''} aria-label="Move earlier in the order">↑</button>
    <button class="btn sm ghost" data-act="b_ord" data-cid="${cid}" data-d="1" ${idx===n-1?raw('disabled'):''} aria-label="Move later in the order">↓</button>
    <button class="btn sm danger ${S.ui.confirm==='bt|'+cid?'armed':''}" data-act="b_rm" data-cid="${cid}">${S.ui.confirm==='bt|'+cid?'Tap again to remove':'Remove from battle'}</button></div>`;
}
function btAllyBody(cid,v,gm,idx){
  const id=v.ref;
  return h`<div class="bbody">
    ${btAmt(cid)}
    <div class="fl">Status</div>${afflChips('p',id,'status',v.status,false,'')}${afflNotes(v.status)}
    <div class="fl">Combat stages</div>${stagePanel('p',id,'stages',v.m,false,'')}
    <div class="row"><button class="btn sm" data-act="b_card" data-uid="${v.uid}" data-pid="${v.pid}">Open the card</button></div>
    ${gm?btOrderBtns(cid,idx):''}
  </div>`;
}
function foeMegaPanel(cid,f){
  const nt=f.nt?NTS()[f.nt]:null;
  const checks=[megaHold(f.item,f.mv,f.mega)];
  if(nt)checks.push({ok:hasKey(nt),label:ntName(nt)+' carries a Key Stone'},{ok:keyCharged(nt),label:'Key Stone not used yet this battle'});
  return megaRunPanel({kind:'foe',sc:'gb',id:'battle',P:'foes.'+cid+'.',doc:S.battleGm,mon:f,attrs:h`data-cid="${cid}"`,checks,chip:nt?keyChip(nt):'',ekey:'mgf'+cid});
}
function btFoeBody(cid,v,idx){
  const f=v.f;
  if(PTA.idx)ptaLists();
  if(!f)return h`<div class="bbody"><p class="sub">This foe’s sheet is missing from your secret notes.</p>${btOrderBtns(cid,idx)}</div>`;
  const P='foes.'+cid+'.';
  const sh=f.sh||{};
  const allies=btOrder().map(x=>btInfo(x,true)).filter(x=>x&&x.side==='a');
  const pub=foePub(f);
  const tr=tids();
  const mvs=f.mv||[];
  return h`<div class="bbody fsheet">
    <div class="mgate secret"><span class="fl">GM only · what the players see</span>
      <div class="row evchips" role="group" aria-label="Show players">
        ${[['name','Name'],['pic','Picture'],['types','Types'],['st','Status and stages'],['item','Held item'],['mega','Mega form']].map(([k,l])=>h`<label class="chip chkc"><input type="checkbox" ${bd('gb','battle',P+'sh.'+k)} ${num(sh[k])?raw('checked'):''}><span>${l}</span></label>`)}
        <label class="fld inl"><span class="fl">Health</span><select ${bd('gb','battle',P+'sh.hp')}>${[[0,'Hidden'],[1,'Bar only'],[2,'Numbers']].map(([n,l])=>h`<option value="${n}" ${num(sh.hp)===n?raw('selected'):''}>${l}</option>`)}</select></label></div>
      <div class="row"><button class="btn sm" data-act="b_reveal" data-cid="${cid}" data-v="all">Show everything</button><button class="btn sm ghost" data-act="b_reveal" data-cid="${cid}" data-v="none">Hide everything</button>
        ${fText('Name while hidden','gb','battle',P+'pn',S.battleGm,{})}</div>
      <p class="sub">Players now see: <b>${pub.n}</b>${pub.sp?'':' (no picture)'}${pub.ty?' · '+(pub.ty.join(' / ')||'types'):' · types hidden'}${pub.hp?(pub.hp.c!=null?' · health '+pub.hp.c+'/'+pub.hp.m:' · health bar'):' · health hidden'}${pub.it?' · holding '+pub.it:''}${pub.mg?' · Mega-evolved'+(pub.ms?' (shows its Mega picture)':''):''}${pub.down?' · Down':''}. Their phones never receive the numbers you keep hidden.</p></div>
    ${btAmt(cid)}
    ${ntFoeOwner(f)?h`<p class="sub">Belongs to <b>${ntFoeOwner(f)}</b>${ntOwnerLabel(f)?' (the table has met them)':' (the table has not been told about them)'}.</p>`:''}
    <div class="fgrid">
      ${fText('Name','gb','battle',P+'nick',S.battleGm,{})}
      ${fText('Species','gb','battle',P+'sp',S.battleGm,{list:'dl-species'})}
      ${fSel('Type 1','gb','battle',P+'ty.0',S.battleGm,TYPES,{blank:'None'})}
      ${fSel('Type 2','gb','battle',P+'ty.1',S.battleGm,TYPES,{blank:'None'})}
      ${fNum('HP now','gb','battle',P+'hp.cur',S.battleGm,{min:0})}
      ${fNum('HP max','gb','battle',P+'hp.max',S.battleGm,{min:1})}
      ${fSel('Gender','gb','battle',P+'gender',S.battleGm,GENDERS,{blank:'Not set'})}
      <div class="fld shn"><span class="fl">Colour</span>${fCheck('Shiny ✦','gb','battle',P+'shiny',S.battleGm,false)}</div>
      ${fText('Held item','gb','battle',P+'item',S.battleGm,{list:'dl-items'})}
      ${fSel('Nature raises','gb','battle',P+'up',S.battleGm,STAT_OPTS,{blank:'None'})}
      ${fSel('Nature lowers','gb','battle',P+'down',S.battleGm,STAT_OPTS,{blank:'None'})}
    </div>
    <div class="stats">${STATS.map(s=>h`<div class="stat lcd"><span class="sl">${s[2]}</span><span class="sv">${fStat(f,s[0])}</span><span class="sm"><span>mod ${sgn(mod(fStat(f,s[0])))}</span>${megaBonus(f,s[0])?h`<span class="mbn">Mega ${sgn(megaBonus(f,s[0]))}</span>`:''}</span>
      <div class="mini"><label>Base<input type="number" ${bd('gb','battle',P+'base.'+s[0])} value="${num(f.base&&f.base[s[0]])}"></label><label>Adj<input type="number" ${bd('gb','battle',P+'bonus.'+s[0])} value="${num(f.bonus&&f.bonus[s[0]])}"></label></div></div>`)}</div>
    <div class="fl">Status</div>${afflChips('gb','battle',P+'st',f.st,false,cid)}${afflNotes(f.st)}
    <div class="fl">Combat stages</div>${stagePanel('gb','battle',P+'stages',f,false,cid)}
    ${foeMegaPanel(cid,f)}
    <div class="list"><div class="ph"><h3>Moves</h3><button class="btn sm" data-act="add" ${bp('gb','battle',P+'mv')} data-tpl="move">Add move</button></div>
      <div class="mrgrid fopt"><label class="fld"><span class="fl">Target</span><select data-u="bt.tgt"><option value="">No target</option>${allies.map(a=>h`<option value="${a.cid}" ${S.ui.bt.tgt===a.cid?raw('selected'):''}>${a.name} (${a.owner})</option>`)}</select></label>
        <label class="fld"><span class="fl">Type advantage</span><select data-u="bt.eff">${EFF_PICK.map(([k,l])=>h`<option value="${k}" ${(S.ui.bt.eff||'auto')===k?raw('selected'):''}>${l}</option>`)}</select></label></div>
      <div class="row"><div class="seg" role="group" aria-label="Roll mode">${[['normal','Normal'],['adv','Advantage'],['dis','Disadvantage']].map(([k,l])=>h`<button data-act="adv" data-v="${k}" aria-pressed="${String(S.ui.adv===k)}">${l}</button>`)}</div>
        <label class="row"><input type="checkbox" data-act="b_secret" ${S.ui.secret?raw('checked'):''}><span>Roll in secret (not shared)</span></label></div>
      ${mvs.length?mvs.map((x,i)=>h`<div class="move"><div class="mv1">${fText('Move','gb','battle',P+'mv.'+i+'.name',S.battleGm,{list:'dl-moves'})}${fText('Uses','gb','battle',P+'mv.'+i+'.freq',S.battleGm,{})}<span></span>${rowBtns('gb','battle',P+'mv',i,mvs.length,false)}</div>
        <div class="mv2">${fSel('Kind','gb','battle',P+'mv.'+i+'.kind',S.battleGm,KINDS,{})}${fSel('Type','gb','battle',P+'mv.'+i+'.type',S.battleGm,TYPES,{})}${fText('Range','gb','battle',P+'mv.'+i+'.range',S.battleGm,{})}${fText('Damage','gb','battle',P+'mv.'+i+'.dice',S.battleGm,{ph:'e.g. 3d8'})}</div>
        ${fArea('Effect','gb','battle',P+'mv.'+i+'.text',S.battleGm,{rows:2})}
        <div class="row"><button class="btn primary sm" data-act="b_fmroll" data-cid="${cid}" data-i="${i}">Roll attack</button><button class="btn sm" data-act="b_fmdmg" data-cid="${cid}" data-i="${i}">Damage only</button></div></div>`):h`<p class="sub">No moves yet. Add one, or type a move name to fill it in from the handbook.</p>`}
    </div>
    ${(f.ps||[]).length?h`<div class="list"><div class="ph"><h3>Passives</h3></div><ul class="mini-list">${f.ps.map(x=>h`<li><b>${x.name}</b><br><span class="sub">${x.text}</span></li>`)}</ul></div>`:''}
    ${fArea('Notes (only you see these)','gb','battle',P+'notes',S.battleGm,{rows:2})}
    ${tr.length?h`<div class="row"><label class="fld inl"><span class="fl">Caught by</span><select data-u="bt.giveTo">${tr.map(u=>h`<option value="${u}" ${(S.ui.bt.giveTo||tr[0])===u?raw('selected'):''}>${tName(S.trainers[u])}</option>`)}</select></label>
      <button class="btn sm" data-act="b_give" data-cid="${cid}">Give to trainer</button><span class="sub">Copies its sheet and health to their party or box, then removes it here.</span></div>`:''}
    ${btOrderBtns(cid,idx)}
  </div>`;
}
function btAddPanel(){
  const ids=tids();
  const b=BT();
  const inB=ref=>Object.keys(b.c||{}).some(k=>b.c[k].s==='a'&&b.c[k].r===ref);
  const u=S.ui.bt;
  return h`<section class="panel"><div class="ph"><h2>Who is fighting</h2><span class="pill gm">GM only</span></div>
    ${ids.length?ids.map(uid=>{
      const pt=partyOf(uid);
      return h`<div class="mgd"><div class="row sp"><b>${tName(S.trainers[uid])}</b><button class="btn sm" data-act="b_addparty" data-uid="${uid}" ${pt.length&&!pt.every(m=>inB(uid+'/'+m.id))?'':raw('disabled')}>Add whole party</button></div>
        ${pt.length?h`<div class="row evchips">${pt.map(m=>h`<button class="btn sm chk" data-act="b_addally" data-uid="${uid}" data-pid="${m.id}" aria-pressed="${String(inB(uid+'/'+m.id))}" ${inB(uid+'/'+m.id)?raw('disabled'):''}>${monIcon(m)}${mName(m)}</button>`)}</div>`:h`<p class="sub">No Pokémon in the party.</p>`}</div>`;
    }):h`<p class="sub">No trainers yet.</p>`}
    <div class="mgd"><b>Add a foe</b>
      <p class="sub">A foe has its own sheet that only you can read. Players see only what you choose to show: by default a name like “Foe A”, no picture, no types and no health.</p>
      <div class="fgrid">
        <label class="fld"><span class="fl">Species</span><input type="text" list="dl-species" data-u="bt.foeSp" data-nr value="${u.foeSp}" placeholder="e.g. Houndoom"></label>
        <label class="fld"><span class="fl">Name (optional)</span><input type="text" data-u="bt.foeNick" data-nr value="${u.foeNick}"></label>
        <label class="fld"><span class="fl">How many</span><input type="number" inputmode="numeric" min="1" max="8" data-u="bt.foeN" data-nr value="${u.foeN}"></label>
      </div>
      <div class="row"><button class="btn primary sm" data-act="b_addfoe">Add foe</button></div></div>
    ${encBattlePanel()}
    ${ntBattlePanel()}
  </section>`;
}
/* the Battle page has two views of the same fight: the turn order, and the map */
function battleTab(){
  const sw=bmSwitch();
  return h`${sw}${bmAvail()&&S.ui.bt.view==='map'?bmapPanel():battleOrderTab()}`;
}
function battleOrderTab(){
  const b=BT(),gm=!!S.me.admin;
  const ord=btOrder();
  const cur=b.turn&&ord.indexOf(b.turn)>=0?b.turn:'';
  const cv=cur?btInfo(cur,gm):null;
  const ask=S.ui.confirm==='bt|end';
  const mineNow=cv&&cv.side==='a'&&canEditT(cv.uid);
  return h`<section class="panel btl"><div class="ph"><h2>Battle</h2>${b.on?h`<span class="pill good">Round ${num(b.round)||1}</span>`:h`<span class="pill">${ord.length?'Setting up':'No battle'}</span>`}
      ${gm?h`<div class="acts"><button class="btn primary sm" data-act="b_init" ${ord.length?'':raw('disabled')}>${b.on?'Roll initiative again':'Roll initiative'}</button><button class="btn sm" data-act="b_next" ${b.on?'':raw('disabled')}>Next turn</button>${b.on&&b.mode!=='d20'?h`<button class="btn sm" data-act="b_resort">Re-sort by Speed</button>`:''}<button class="btn sm danger ${ask?'armed':''}" data-act="b_end">${ask?'Tap again to end it for everyone':'End battle'}</button></div>`:''}</div>
    ${gm?h`<div class="row"><div class="seg" role="group" aria-label="How turn order is decided"><button data-act="b_mode" data-v="speed" aria-pressed="${String(b.mode!=='d20')}">Highest Speed first</button><button data-act="b_mode" data-v="d20" aria-pressed="${String(b.mode==='d20')}">d20 + Speed</button></div></div>`:''}
    ${b.on&&cv?h`<p class="bnow ${mineNow?'mine':''}">${mineNow?'Your turn: ':''}<b>${cv.name}</b> is acting${cv.side==='a'?' · '+cv.owner:''}.</p>`:(ord.length?h`<p class="sub">${b.on?'':(gm?'Add everyone, then roll initiative.':'The GM is setting up the battle.')}</p>`:h`<p class="sub">${gm?'Nothing here yet. Add your players’ Pokémon and any foes below.':'No battle is running. When the GM starts one, the turn order shows up here.'}</p>`)}
    ${ord.length?h`<ol class="bord">${ord.map((cid,i)=>btRow(cid,i,gm,cur===cid))}</ol>`:''}
  </section>
  ${gm?btAddPanel():''}
  <section class="panel"><div class="ph"><h2>Table rolls</h2>${gm?h`<div class="acts"><label class="row"><input type="checkbox" data-act="b_secret" ${S.ui.secret?raw('checked'):''}><span>Roll in secret</span></label><button class="btn sm danger ${S.ui.confirm==='bt|clr'?'armed':''}" data-act="b_clear">${S.ui.confirm==='bt|clr'?'Tap again to clear':'Clear the log'}</button></div>`:''}</div>
    ${rollLogView(30,gm)}</section>
  ${refPanel()}`;
}

/* ----- GM Desk: give a Pokémon, evolution log ----- */
function giveDesk(){
  const ids=tids();
  const g=S.ui.give;
  const uid=g.uid&&S.trainers[g.uid]?g.uid:ids[0];
  return h`<section class="panel"><div class="ph"><h2>Give a Pokémon</h2><span class="pill gm">GM only</span></div>
    <p class="sub">Pick a trainer and a species. Stats, passives and moves fill in from the handbook, and it goes to their party (or the box if the party is full).</p>
    ${ids.length?h`<div class="fgrid">
      <label class="fld"><span class="fl">Trainer</span><select data-u="give.uid">${ids.map(u=>h`<option value="${u}" ${uid===u?raw('selected'):''}>${tName(S.trainers[u])}</option>`)}</select></label>
      <label class="fld"><span class="fl">Species</span><input type="text" list="dl-species" data-u="give.sp" data-nr value="${g.sp}" placeholder="e.g. Riolu"></label>
      <label class="fld"><span class="fl">Nickname (optional)</span><input type="text" data-u="give.nick" data-nr value="${g.nick}"></label>
      <label class="fld wide"><span class="fl">Where or how they got it (optional)</span><input type="text" list="dl-places" data-u="give.caught" data-nr value="${g.caught}"></label>
    </div>
    <div class="row"><button class="btn primary sm" data-act="b_giveMon">Give it</button></div>`:h`<p class="sub">No trainers yet. Players appear here once they create a sheet.</p>`}
  </section>`;
}
function evoLogRows(){
  const rows=[];
  tids().forEach(uid=>{
    monsOf(uid).forEach(m=>{(m.evoLog||[]).forEach(x=>{if(x&&x.at)rows.push({uid,m,at:num(x.at),from:x.from,to:x.to});});});
  });
  return rows.sort((a,b)=>b.at-a.at);
}
function evoLogDesk(){
  const rows=evoLogRows().slice(0,40);
  return h`<section class="panel"><div class="ph"><h2>Evolution log</h2><span class="pill gm">GM only</span></div>
    ${rows.length?h`<ul class="mini-list">${rows.map(r=>h`<li><div class="row sp"><span><span class="mgn">${monIcon(r.m)}<span><b>${mName(r.m)}</b> <span class="sub">${tName(S.trainers[r.uid])}</span><br>${r.from} → <b>${r.to}</b></span></span></span><span class="sub">${new Date(r.at).toLocaleDateString(undefined,{month:'short',day:'numeric'})} · ${hhmm(r.at)}</span></div></li>`)}</ul>
      <p class="sub">Shows evolutions made since this version. An undone evolution is removed from the list.</p>`
      :h`<p class="sub">No evolutions recorded yet. Each one, by a player or by you, is listed here with the date.</p>`}
  </section>`;
}

/* ----- actions ----- */
function batAct(b,e){
  const d=b.dataset;
  switch(d.act){
    case 'b_open':S.ui.bt.open[d.cid]=!S.ui.bt.open[d.cid];render();break;
    case 'b_hp':btHp(d.cid,num(d.d));break;
    case 'b_dmg':{const n=Math.abs(num(S.ui.bt.amt));if(n)btHp(d.cid,-n);else toast('Type an amount first.');break;}
    case 'b_heal':{const n=Math.abs(num(S.ui.bt.amt));if(n)btHp(d.cid,n);else toast('Type an amount first.');break;}
    case 'b_stg':btStage(d.sc,d.id,d.path,d.k,num(d.d),d.cid);break;
    case 'b_aff':btAffl(d.sc,d.id,d.path,d.a,d.cid);break;
    case 'b_init':btRollInit();break;
    case 'b_next':btNext();break;
    case 'b_resort':btResort();break;
    case 'b_mode':btSetMode(d.v);break;
    case 'b_turn':btTurnTo(d.cid);break;
    case 'b_ord':btMove(d.cid,num(d.d));break;
    case 'b_addally':btAddAlly(d.uid,d.pid);break;
    case 'b_addparty':btAddParty(d.uid);break;
    case 'b_addfoe':btAddFoe();break;
    case 'b_rm':{
      const key='bt|'+d.cid;
      if(S.ui.confirm===key){S.ui.confirm=null;btRemove(d.cid);}
      else{S.ui.confirm=key;render();setTimeout(()=>{if(S.ui.confirm===key){S.ui.confirm=null;render();}},4000);}
      break;}
    case 'b_end':{
      if(S.ui.confirm==='bt|end'){S.ui.confirm=null;btEnd();}
      else{S.ui.confirm='bt|end';render();setTimeout(()=>{if(S.ui.confirm==='bt|end'){S.ui.confirm=null;render();}},4000);}
      break;}
    case 'b_clear':{
      if(!S.me.admin)break;
      if(S.ui.confirm==='bt|clr'){
        S.ui.confirm=null;
        tids().forEach(u=>{if((S.trainers[u].rolls||[]).length)edit('t',u,'rolls',[]);});
        edit('bt','battle','rolls',[]);
        S.rolls=[];renderRoll();render();
      }else{S.ui.confirm='bt|clr';render();setTimeout(()=>{if(S.ui.confirm==='bt|clr'){S.ui.confirm=null;render();}},4000);}
      break;}
    case 'b_secret':S.ui.secret=!!b.checked;render();break;
    case 'b_reveal':{
      if(!S.me.admin)break;
      edit('gb','battle','foes.'+d.cid+'.sh',Object.assign({},d.v==='all'?SHOW_ALL:SHOW_NONE));
      foePublish(d.cid);render();break;}
    case 'b_give':foeGive(d.cid);break;
    case 'b_mgadd':case 'b_mgform':case 'b_mgreset':case 'b_mgdrop':case 'b_mgo':case 'b_mgr':mgAct('foe',d.act.slice(2),d);break;
    case 'b_giveMon':giveMon();break;
    case 'b_apply':applyRoll(d.src,d.id);break;
    case 'b_fmroll':foeRoll(d.cid,num(d.i),false);break;
    case 'b_fmdmg':foeRoll(d.cid,num(d.i),true);break;
    case 'b_mopen':{
      const key=mrKey(d.uid,d.pid,d.i);
      S.ui.mr=S.ui.mr.key===key?{}:{key,tgt:'',eff:'auto',acc:'',dmg:'',crit:false};
      render();break;}
    case 'b_mclose':S.ui.mr={};render();break;
    case 'b_mroll':moveRoll(d.uid,d.pid,num(d.i),false);break;
    case 'b_mdmg':moveRoll(d.uid,d.pid,num(d.i),true);break;
    case 'b_ref':S.ui.ref.open[d.k]=!S.ui.ref.open[d.k];render();break;
    case 'b_card':
      S.viewUid=d.uid;S.ui.open['p'+d.uid+'/'+d.pid]=true;setTab('pokemon');break;
  }
}

/* ---------- Pokédex ----------
   Names, types, evolution links and the Sinnoh regional order are bundled with the page (dexinfo.js, dexref.js).
   The handbook entry (stats, passives, moves, evolutions) comes from the table's own database once the GM has imported it (pta.js).
   The in-game description is read from PokeAPI's public data on GitHub when an entry is opened, and is not stored anywhere.
   What a trainer has seen or caught is kept on the trainer sheet (field dx). The GM can lock the book so species fill in as they are met. */
S.ui.dx=S.ui.dx||{q:'',reg:'nat',gen:'',type:'',show:'all',page:1,sel:0,y:0};

const DXN=DEXA.length;
const DXPAGE=60;
const DXGEN=[['I','Kanto',1,151],['II','Johto',152,251],['III','Hoenn',252,386],['IV','Sinnoh',387,493],['V','Unova',494,649],['VI','Kalos',650,721],['VII','Alola',722,809],['VIII','Galar',810,905],['IX','Paldea',906,1025]];
const DXSINL=DEXSIN.split(',').map(Number);
const DXSINNO=new Map(DXSINL.map((id,i)=>[id,i+1]));
const DXPRE=new Map(),DXKIDS=new Map();
DEXPRE.split(',').forEach(s=>{
  const p=s.split(':'),a=+p[0],b=+p[1];
  if(!a||!b)return;
  DXPRE.set(a,b);
  if(!DXKIDS.has(b))DXKIDS.set(b,[]);
  DXKIDS.get(b).push(a);
});
let DXK=null;
const dxKeyOf=id=>{if(!DXK)DXK=DEXA.map(dexKey);return DXK[id-1];};
const DXTY=[];
const dxTypes=id=>DXTY[id]||(DXTY[id]=dexInfo(id).types.filter(Boolean));
const dxNo=n=>String(n).padStart(3,'0');
const dxArt=id=>[SPR_BASE+'other/official-artwork/'+id+'.png'].concat(spriteSrcs(id)).filter(u=>!SPR_BAD.has(u));

/* ----- what the viewing trainer knows ----- */
const dxUid=()=>S.me.admin?S.viewUid:S.me.id;
const dxLocked=()=>!!(S.megaOk&&S.megaOk.dx_lock===true);
function dxOwned(uid){
  const s=new Set();
  if(uid)monsOf(uid).forEach(m=>{const si=speciesInfo(m.species);if(si)s.add(si.id);});
  return s;
}
/* species on a foe the GM has shown the players (picture visible), as the players see it */
function dxBattle(){
  const s=new Set();
  try{
    btOrder().forEach(cid=>{
      const v=btInfo(cid,false);
      if(v&&v.side==='f'&&v.sp){const id=dexId(v.sp);if(id)s.add(id);}
    });
    /* a Pokémon the GM has shown with its picture, on an NPC the table has met, counts as seen */
    const nn=(S.npcPub&&S.npcPub.n)||{};
    Object.keys(nn).forEach(k=>(nn[k].m||[]).forEach(m=>{if(m&&m.sp){const id=dexId(m.sp);if(id)s.add(id);}}));
  }catch(e){}
  return s;
}
function dxCtx(){
  const uid=dxUid();
  const t=uid&&S.trainers[uid]?S.trainers[uid]:null;
  return {uid:t?uid:null,t,own:t?dxOwned(uid):new Set(),bat:dxBattle(),reg:(t&&t.dx)||{}};
}
/* 0 not met, 1 seen, 2 caught */
const dxStat=(c,id)=>Math.max(num(c.reg['n'+id]),c.own.has(id)?2:0,c.bat.has(id)?1:0);
/* what this viewer may read: 0 nothing, 1 the basics, 2 everything. The GM always reads everything. */
const dxVis=(c,id)=>(!dxLocked()||S.me.admin)?2:dxStat(c,id);
const dxCan=c=>!!(c.uid&&canEditT(c.uid)&&(!dxLocked()||S.me.admin));

/* ----- the list ----- */
const dxIds=()=>S.ui.dx.reg==='sin'?DXSINL:Array.from({length:DXN},(_,i)=>i+1);
const dxNum=id=>S.ui.dx.reg==='sin'?DXSINNO.get(id):id;
function dxList(c){
  const d=S.ui.dx;
  const q=String(d.q||'').trim().replace(/^#/,'');
  const qk=dexKey(q);
  const digits=/^\d+$/.test(q)?+q:0;
  const g=d.gen?DXGEN[+d.gen-1]:null;
  return dxIds().filter(id=>{
    if(g&&(id<g[2]||id>g[3]))return false;
    const v=dxVis(c,id),s=dxStat(c,id);
    if(d.show==='seen'&&s<1)return false;
    if(d.show==='caught'&&s<2)return false;
    if(d.show==='missing'&&s>=2)return false;
    if(d.type&&(v<1||dxTypes(id).indexOf(d.type)<0))return false;
    if(q){
      if(digits)return dxNum(id)===digits;
      if(!qk||v<1||dxKeyOf(id).indexOf(qk)<0)return false;
    }
    return true;
  });
}
function dxTally(c){
  let seen=0,got=0;
  const ids=dxIds();
  ids.forEach(id=>{const s=dxStat(c,id);if(s>=1)seen++;if(s>=2)got++;});
  return {seen,got,total:ids.length};
}
function dxCard(c,id){
  const n=dxNum(id),v=dxVis(c,id),s=dxStat(c,id);
  if(!v)return h`<li><button class="dxc unk" data-act="dx_open" data-id="${id}" aria-label="Number ${n}, not discovered yet"><span class="dxno">#${dxNo(n)}</span><span class="dxph" aria-hidden="true"></span><span class="dxnm">???</span></button></li>`;
  const srcs=spriteSrcs(id);
  return h`<li><button class="dxc ${s>=2?'got':s?'seen':''}" data-act="dx_open" data-id="${id}">
    <span class="dxno">#${dxNo(n)}</span>
    ${srcs.length?h`<img class="sp dxim" src="${srcs[0]}" data-fb="${srcs.slice(1).join('|')}" data-ini="${DEXA[id-1].charAt(0)}" alt="" width="64" height="64" loading="lazy" decoding="async">`:h`<span class="dxph" aria-hidden="true"></span>`}
    <span class="dxnm">${DEXA[id-1]}</span>
    <span class="types">${chipsOf(dxTypes(id))}</span>
    ${s?h`<span class="pill ${s>=2?'good':''}">${s>=2?'Caught':'Seen'}</span>`:''}
  </button></li>`;
}
function dxResults(c){
  const d=S.ui.dx;
  const ids=dxList(c);
  const shown=ids.slice(0,d.page*DXPAGE);
  const filtered=!!(d.q||d.gen||d.type||d.show!=='all');
  return h`<p class="sub" id="dxcount" aria-live="polite">${ids.length===1?'1 species':ids.length+' species'}${ids.length>shown.length?' · showing '+shown.length:''}</p>
    ${ids.length?h`<ul class="dxgrid">${shown.map(id=>dxCard(c,id))}</ul>`:h`<p class="sub">Nothing matches.${filtered?h` <button class="btn sm" data-act="dx_clear">Clear the filters</button>`:''}</p>`}
    ${ids.length>shown.length?h`<div class="row"><button class="btn" data-act="dx_more">Show ${Math.min(DXPAGE,ids.length-shown.length)} more</button></div>`:''}`;
}
/* typing in the search box redraws only the results, so the box keeps its place */
function dxRefresh(){
  const el=$('#dxres');
  if(el)el.innerHTML=dxResults(dxCtx()).s;
}

function dxSyncRow(c){
  if(!c.uid||!dxCan(c))return '';
  const miss=[...c.own].filter(id=>num(c.reg['n'+id])<2).length;
  const tl=dxTally(c);
  const dexNow=num(c.t.dex);
  const need=dexNow!==tl.got;
  if(!miss&&!need)return '';
  return h`<div class="row">${miss?h`<button class="btn sm" data-act="dx_rec">Record ${miss} owned species as caught</button>`:''}${need?h`<button class="btn sm" data-act="dx_sync">Set “Pokédex owned” on the trainer sheet to ${tl.got}</button>`:''}</div>`;
}

function dexTab(){
  const c=dxCtx();
  const d=S.ui.dx;
  if(d.sel>=1&&d.sel<=DXN)return dxDetail(c);
  const tl=dxTally(c);
  const locked=dxLocked();
  const pct=Math.round(100*tl.got/Math.max(1,tl.total));
  const sp=Math.round(100*tl.seen/Math.max(1,tl.total));
  return h`<section class="panel dxp"><div class="ph"><h2>Pokédex</h2>
      <div class="acts">${c.uid?h`<span class="pill">Seen ${tl.seen}</span><span class="pill good">Caught ${tl.got}</span>`:''}${locked?h`<span class="pill gm">Locked</span>`:''}</div></div>
    ${S.me.admin?trainerPicker():''}
    ${!c.uid&&!S.me.admin&&S.me.id&&S.me.canWrite?h`<div class="banner">You have no trainer sheet yet, so nothing is marked. ${createCta()}</div>`:''}
    ${!c.uid&&S.me.admin?h`<p class="sub">No trainer is selected, so nothing is marked.</p>`:''}
    ${c.uid?h`<div class="dxprog" role="img" aria-label="${tl.got} caught and ${tl.seen} seen out of ${tl.total}"><i class="s" ${raw('style="width:'+sp+'%"')}></i><i class="c" ${raw('style="width:'+pct+'%"')}></i></div>`:''}
    <p class="sub">${locked&&!S.me.admin?'The GM keeps the Pokédex locked: a species fills in when you catch one or meet it in battle. ':''}${c.uid?(S.me.admin?'Showing '+tName(c.t)+'. ':'')+'A Pokémon in your party or box counts as caught, and a foe the GM shows you in battle counts as seen.':'Names, types and handbook entries for every species.'}</p>
    ${S.me.admin?h`<label class="row"><input type="checkbox" data-act="dx_lock" ${locked?raw('checked'):''}><span>Lock the Pokédex for players (unmet species show as ???)</span></label>`:''}
    ${dxSyncRow(c)}
    <div class="dxf">
      <label class="fld dxq"><span class="fl">Search</span><input type="search" data-u="dx.q" data-nr value="${d.q||''}" placeholder="Name or number" autocomplete="off"></label>
      <label class="fld"><span class="fl">Region</span><select data-u="dx.reg"><option value="nat" ${d.reg!=='sin'?raw('selected'):''}>National (${DXN})</option><option value="sin" ${d.reg==='sin'?raw('selected'):''}>Sinnoh (${DXSINL.length})</option></select></label>
      <label class="fld"><span class="fl">Generation</span><select data-u="dx.gen"><option value="">All</option>${DXGEN.map((g,i)=>h`<option value="${i+1}" ${String(d.gen)===String(i+1)?raw('selected'):''}>${g[0]} · ${g[1]}</option>`)}</select></label>
      <label class="fld"><span class="fl">Type</span><select data-u="dx.type"><option value="">All types</option>${TYPES.map(t=>h`<option value="${t}" ${d.type===t?raw('selected'):''}>${t}</option>`)}</select></label>
      <label class="fld"><span class="fl">Show</span><select data-u="dx.show">${[['all','Everything'],['seen','Seen or caught'],['caught','Caught'],['missing','Not caught yet']].map(([k,l])=>h`<option value="${k}" ${d.show===k?raw('selected'):''}>${l}</option>`)}</select></label>
    </div>
    <div id="dxres">${dxResults(c)}</div>
  </section>`;
}

/* ----- one entry ----- */
const DXG={};
const DXAPI='https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2/pokemon-species/';
const dxClean=t=>String(t||'').replace(/\u00ad\s*/g,'').replace(/[\n\f\r]+/g,' ').replace(/\s+/g,' ').trim();
const dxTitle=s=>String(s||'').replace(/-/g,' ').replace(/\b[a-z]/g,m=>m.toUpperCase());
function dxLoad(id,force){
  const g=DXG[id];
  if(g&&(g.st==='busy'||g.st==='ok'||(g.st==='err'&&!force)))return;
  DXG[id]={st:'busy'};
  const ctl=typeof AbortController!=='undefined'?new AbortController():null;
  const to=setTimeout(()=>{if(ctl)ctl.abort();},12000);
  let p;
  try{p=fetch(DXAPI+id+'/index.json',ctl?{signal:ctl.signal}:{});}catch(e){p=Promise.reject(e);}
  p.then(r=>{if(!r.ok)throw new Error('http '+r.status);return r.json();}).then(j=>{
    clearTimeout(to);
    const en=x=>x&&x.language&&x.language.name==='en';
    const ft=(j.flavor_text_entries||[]).filter(en);
    const by=v=>ft.find(x=>x.version&&x.version.name===v);
    const pick=by('platinum')||by('diamond')||by('pearl')||ft[ft.length-1]||null;
    const ge=(j.genera||[]).find(en);
    DXG[id]={st:'ok',genus:ge?String(ge.genus||''):'',text:pick?dxClean(pick.flavor_text):'',ver:pick&&pick.version?String(pick.version.name||''):'',
      habitat:j.habitat&&j.habitat.name?String(j.habitat.name):'',legendary:!!j.is_legendary,mythical:!!j.is_mythical,baby:!!j.is_baby};
    scheduleRender();
  }).catch(()=>{clearTimeout(to);DXG[id]={st:'err'};scheduleRender();});
}
function dxGameView(id){
  const g=DXG[id];
  if(!g||g.st==='busy')return h`<p class="sub">Loading the game entry…</p>`;
  if(g.st==='err')return h`<p class="sub">The game entry could not be loaded. It is read from PokeAPI on GitHub, so it needs an internet connection. <button class="btn sm" data-act="dx_retry" data-id="${id}">Retry</button></p>`;
  return h`${g.text?h`<blockquote class="dxquote">${g.text}</blockquote><p class="sub">Pokémon ${dxTitle(g.ver)}${g.genus?' · '+g.genus:''}</p>`:h`<p class="sub">No game entry text was found.</p>`}
    ${g.habitat||g.legendary||g.mythical||g.baby?h`<div class="row">${g.legendary?h`<span class="pill gm">Legendary</span>`:''}${g.mythical?h`<span class="pill gm">Mythical</span>`:''}${g.baby?h`<span class="pill">Baby</span>`:''}${g.habitat?h`<span class="pill">Habitat: ${dxTitle(g.habitat)}</span>`:''}</div>`:''}`;
}

function dxChip(c,x,cur){
  const v=dxVis(c,x);
  const srcs=v?spriteSrcs(x):[];
  return h`<button class="dxch ${x===cur?'cur':''}" data-act="dx_open" data-id="${x}" ${x===cur?raw('aria-current="true"'):''}>${srcs.length?h`<img class="sp mi" src="${srcs[0]}" data-fb="${srcs.slice(1).join('|')}" alt="" width="40" height="40" loading="lazy" decoding="async">`:h`<span class="mi-ph" aria-hidden="true"></span>`}<span>${v?DEXA[x-1]:'???'}</span></button>`;
}
function dxFamily(c,id){
  let root=id,n=0;
  while(DXPRE.has(root)&&n++<6)root=DXPRE.get(root);
  if(root===id&&!(DXKIDS.get(id)||[]).length)return h`<p class="sub">${DEXA[id-1]} does not evolve and has no earlier form.</p>`;
  const node=x=>h`<li>${dxChip(c,x,id)}${(DXKIDS.get(x)||[]).length?h`<ul>${(DXKIDS.get(x)||[]).map(k=>node(k))}</ul>`:''}</li>`;
  return h`<ul class="dxtree">${node(root)}</ul>`;
}
function dxForms(id){
  const fm=FORMS.filter(f=>f.b===id);
  const mg=MEGAS.filter(x=>x.b===id);
  if(!fm.length&&!mg.length)return '';
  return h`<section class="panel"><div class="ph"><h2>Other forms</h2></div>
    <ul class="dxforms">${fm.map(f=>h`<li><b>${f.n}</b> ${chipsOf(typePair(f.t))}</li>`)}${mg.map(x=>h`<li><b>${x.f}</b> ${chipsOf(typePair(x.t))} <span class="sub">${x.st}</span></li>`)}</ul></section>`;
}

/* legendary categories from the GM Guide: the label, the suggested base capture rate and a line of what they are */
const LEG_CAT={
  'Time-Displaced':{l:'Time-Displaced',c:-25,t:'Lost in time. One turning up usually means a portal is letting the past or future meddle with the present.'},
  'Ultra Beast':{l:'Ultra Beast',c:-25,t:'From another dimension. Invasive and quick to attack, but Poké Balls can hold them.'},
  'Man-made':{l:'Man-made Legendary',c:-50,t:'Created by people. Powerful, but not gods, so a Poké Ball may weaken their strength.'},
  'Nature':{l:'Being of Nature / Oddity',c:-100,t:'Holds domain over some force in the world. Not unique, though exceedingly rare.'},
  'God':{l:'God',c:-500,t:'Unique and untamable. It would only consider a Poké Ball after being shown dominance.'}
};
const legTag=r=>r&&r.cat==='Ultra Beast'?'Ultra Beast':r&&r.cat==='Time-Displaced'?'Paradox':'Legendary';
function dxLegend(r){
  const c=r.cat&&LEG_CAT[r.cat];
  if(!c)return '';
  return h`<div class="dxleg" role="note"><div class="row"><span class="pill leg">${c.l}${r.sub?' · '+r.sub:''}</span><span class="pill">Base capture rate ${c.c}</span></div>
    <p class="sub">${c.t} A captured one loses its ${legTag(r)} moves, passives and features, and its HP drops, rarely above 100.</p></div>`;
}
function dxRecView(r,many){
  const stats=[['HP',num(r.hp)*hpx(),false],['Atk',r.at,true],['Def',r.df,true],['SpA',r.sa,true],['SpD',r.sd,true],['Spe',r.sp,true]];
  const ps=r.ps||[],mv=r.mv||[],sk=r.sk||[];
  const lt=legTag(r);
  return h`<div class="dxrec">
    ${many?h`<h3 class="refg">${r.n}</h3>`:''}
    <div class="row">${chipsOf(r.ty)}<span class="pill">${r.sz||'Medium'}</span><span class="pill">${r.wt||'Medium'}</span></div>
    ${dxLegend(r)}
    <div class="dxst">${stats.map(([l,v,m])=>h`<div class="dxs"><span>${l}</span><b>${num(v)}</b>${m?h`<small>${sgn(mod(num(v)))}</small>`:(l==='HP'&&hpx()!==1?h`<small title="The handbook’s HP, before the table’s ×${hpx()} multiplier">book ${num(r.hp)}</small>`:'')}</div>`)}</div>
    ${sk.length?h`<p><b>Skills</b> ${sk.map(x=>x.n+(x.t?' ('+x.t+')':'')).join(', ')}</p>`:''}
    ${ps.length?h`<h3 class="refg">Passives</h3><dl class="refdl">${ps.map(x=>h`<dt>${x.n}${x.lg?h` <span class="pill leg">${lt}</span>`:''}</dt><dd>${x.t||''}</dd>`)}</dl>`:''}
    ${mv.length?h`<h3 class="refg">Moves</h3><ul class="dxmvs">${mv.map(x=>h`<li><div class="row"><b>${x.n}</b>${chipsOf([x.t])}<span class="pill">${x.k||''}</span><span class="pill">${x.f||''}</span>${x.lg?h`<span class="pill leg">${lt}</span>`:''}</div>
      <p class="sub">${[x.r,x.d].filter(Boolean).join(' · ')}</p>${x.x?h`<p>${x.x}</p>`:''}</li>`)}</ul>`:''}
  </div>`;
}
function dxEvoLinks(c,r){
  const ev=r.ev||[];
  if(!ev.length)return '';
  return h`<h3 class="refg">Evolves into</h3><ul class="dxevs">${ev.map(e=>{
    const t=dexId(e.n);
    const v=t?dxVis(c,t):0;
    return h`<li>${t?h`<button class="dxch" data-act="dx_open" data-id="${t}"><span>${v?e.n:'???'}</span></button>`:h`<b>${e.n}</b>`}${e.c?h` <span class="sub">${e.c}</span>`:''}</li>`;
  })}</ul>`;
}
function dxHandbook(c,id){
  const nm=DEXA[id-1];
  const I=PTA.idx;
  const fb=dexInfo(id);
  const fallback=h`<p class="sub">Game base stats ÷ 15, as used to fill in a new Pokémon:</p><div class="dxst">${STATS.map(s=>h`<div class="dxs"><span>${s[2]}</span><b>${fb.base[s[0]]}</b><small>${sgn(mod(fb.base[s[0]]))}</small></div>`)}</div>`;
  if(!I)return h`<p class="sub">${S.me.admin?'The handbook data has not been imported yet. Import it in the GM Desk to see full entries here.':'The GM has not imported the handbook data yet, so only the basics are shown.'}</p>${fallback}`;
  let names=(I.base.get(ptaKey(nm))||[]).slice();
  if(!names.length){const r=ptaResolve(nm);if(r)names=[r];}
  if(!names.length)return h`<p class="sub">${nm} is not in the handbook.</p>${fallback}`;
  names.sort((a,b)=>(dexKey(b)===dexKey(nm))-(dexKey(a)===dexKey(nm)));
  const L=ptaLetter(ptaKey(nm));
  if(!PTA.chunks[L]){
    return PTA.fail[L]&&Date.now()-PTA.fail[L]<30000?h`<p class="sub">The handbook entry could not be loaded right now.</p>${fallback}`:h`<p class="sub">Loading the handbook entry…</p>`;
  }
  const recs=names.map(n=>ptaRec(n)).filter(Boolean);
  if(!recs.length)return h`<p class="sub">${nm} is not in the handbook.</p>${fallback}`;
  return h`${recs.map(r=>h`${dxRecView(r,recs.length>1)}${dxEvoLinks(c,r)}`)}`;
}

function dxMarks(c,id,s){
  if(!c.uid)return '';
  if(c.own.has(id))return h`<span class="pill good">Caught · it is in ${S.me.admin?tName(c.t)+'’s':'your'} party or box</span>`;
  const can=dxCan(c);
  const reg=num(c.reg['n'+id]);
  const note=c.bat.has(id)&&reg<1?h`<span class="pill">Seen in the current battle</span>`:'';
  if(!can)return h`${s?h`<span class="pill ${s>=2?'good':''}">${s>=2?'Caught':'Seen'}</span>`:h`<span class="pill">Not met</span>`}${note}`;
  return h`<div class="seg" role="group" aria-label="Pokédex mark for ${DEXA[id-1]}">${[[0,'Not met'],[1,'Seen'],[2,'Caught']].map(([n,l])=>h`<button data-act="dx_mark" data-id="${id}" data-v="${n}" aria-pressed="${String(reg===n)}">${l}</button>`)}</div>${note}`;
}
function dxStepIds(c,id){
  const l=dxList(c);
  const i=l.indexOf(id);
  if(i>=0)return {prev:l[i-1]||0,next:l[i+1]||0};
  return {prev:id>1?id-1:0,next:id<DXN?id+1:0};
}
function dxDetail(c){
  const d=S.ui.dx,id=d.sel;
  const nm=DEXA[id-1];
  const v=dxVis(c,id),s=dxStat(c,id);
  const n=dxNum(id);
  const st=dxStepIds(c,id);
  const top=h`<section class="panel dxp"><div class="ph">
      <button class="btn sm" data-act="dx_back">← All Pokémon</button>
      <div class="acts"><button class="btn sm" data-act="dx_step" data-d="-1" ${st.prev?'':raw('disabled')} aria-label="Previous entry">←</button><button class="btn sm" data-act="dx_step" data-d="1" ${st.next?'':raw('disabled')} aria-label="Next entry">→</button></div></div>`;
  if(!v){
    return h`${top}<div class="dxhead"><div class="dxartw" aria-hidden="true"></div><div class="dxinfo"><p class="dxno">No. ${dxNo(id)}${DXSINNO.has(id)?' · Sinnoh '+dxNo(DXSINNO.get(id)):''}</p><h2 class="dxname">???</h2>
      <p class="sub">Nobody at the table has met this Pokémon yet. It fills in when you catch one or the GM shows you one in battle.</p></div></div></section>`;
  }
  if(v>=2){dxLoad(id);if(PTA.idx)ptaWarm(nm);}
  const srcs=dxArt(id);
  const sinNo=DXSINNO.has(id)?DXSINNO.get(id):0;
  const gi=Math.max(0,DXGEN.findIndex(x=>id<=x[3]));
  const g=DXG[id];
  const head=h`<div class="dxhead">
      <div class="dxartw">${srcs.length?h`<img class="sp dxart" src="${srcs[0]}" data-fb="${srcs.slice(1).join('|')}" data-ini="${nm.charAt(0)}" alt="${nm}" width="160" height="160" decoding="async">`:''}</div>
      <div class="dxinfo">
        <p class="dxno">No. ${dxNo(id)}${sinNo?' · Sinnoh '+dxNo(sinNo):''} · Gen ${DXGEN[gi][0]} (${DXGEN[gi][1]})</p>
        <h2 class="dxname">${nm}</h2>
        ${g&&g.st==='ok'&&g.genus&&v>=2?h`<p class="sub">${g.genus}</p>`:''}
        <div class="types">${chipsOf(dxTypes(id))}</div>
        <div class="row dxmk">${dxMarks(c,id,s)}</div>
        ${S.me.admin&&c.uid?h`<div class="row"><button class="btn sm" data-act="dx_all" data-id="${id}">Mark seen for every trainer</button></div>`:''}
      </div></div>`;
  if(v<2){
    return h`${top}${head}<p class="sub">You have seen it. Catch one to read the full entry.</p></section>
      <section class="panel"><div class="ph"><h2>Evolution family</h2></div>${dxFamily(c,id)}</section>`;
  }
  return h`${top}${head}</section>
    <section class="panel"><div class="ph"><h2>Game entry</h2></div>${dxGameView(id)}</section>
    <section class="panel"><div class="ph"><h2>Handbook</h2></div>${dxHandbook(c,id)}</section>
    <section class="panel"><div class="ph"><h2>Evolution family</h2></div>${dxFamily(c,id)}</section>
    ${dxForms(id)}`;
}

/* ----- actions ----- */
function dxMarkSet(uid,id,v){
  if(!S.trainers[uid])return;
  edit('t',uid,'dx.n'+id,v);
}
function dxAct(b){
  const d=b.dataset,x=S.ui.dx;
  switch(d.act){
    case 'dx_open':{
      const id=num(d.id);
      if(id<1||id>DXN)break;
      if(!x.sel)x.y=window.scrollY;
      x.sel=id;S.ui.toTop=true;render();break;}
    case 'dx_back':x.sel=0;render();window.scrollTo(0,x.y||0);break;
    case 'dx_step':{
      const st=dxStepIds(dxCtx(),x.sel);
      const to=num(d.d)<0?st.prev:st.next;
      if(to){x.sel=to;S.ui.toTop=true;render();}
      break;}
    case 'dx_more':x.page++;dxRefresh();break;
    case 'dx_clear':x.q='';x.gen='';x.type='';x.show='all';x.page=1;render();break;
    case 'dx_retry':dxLoad(num(d.id),true);render();break;
    case 'dx_mark':{
      const c=dxCtx();
      if(!dxCan(c))break;
      dxMarkSet(c.uid,num(d.id),clamp(num(d.v),0,2));
      render();break;}
    case 'dx_all':{
      if(!S.me.admin)break;
      const id=num(d.id);
      let k=0;
      tids().forEach(u=>{const t=S.trainers[u];if(t&&num(t.dx&&t.dx['n'+id])<1){dxMarkSet(u,id,1);k++;}});
      toast(k?'Marked '+DEXA[id-1]+' as seen for '+k+' trainer'+(k===1?'':'s')+'.':'Every trainer has already met '+DEXA[id-1]+'.',true);
      render();break;}
    case 'dx_rec':{
      const c=dxCtx();
      if(!dxCan(c))break;
      let k=0;
      c.own.forEach(id=>{if(num(c.reg['n'+id])<2){dxMarkSet(c.uid,id,2);k++;}});
      toast('Recorded '+k+' species as caught.',true);
      render();break;}
    case 'dx_sync':{
      const c=dxCtx();
      if(!dxCan(c))break;
      const tl=dxTally(c);
      edit('t',c.uid,'dex',tl.got);
      toast('Pokédex owned is now '+tl.got+'.',true);
      render();break;}
    case 'dx_lock':
      if(!S.me.admin)break;
      edit('mg','mega','dx_lock',!!b.checked);
      render();break;
  }
}
/* ---------- Contests: contest types, keywords, the contest move list and an appeal helper ----------
   The way a contest runs and what each keyword does are condensed here in plain words from the PTA 3.5 Players Handbook
   (Contests, Contest Keywords). It is a memory aid, not a copy of the book: the handbook has the full rules.
   Which contest type and keyword each move has comes from the handbook's Contest Moves table. Like the rest of the handbook text,
   that table is not part of this site's files. The GM imports it once (GM Desk, Handbook data) and it is kept in the table's
   database (meta/pta_contest), where only signed-in members can read it. */
const CT_TYPES=['Cool','Beauty','Cute','Clever','Tough'];   /* the order they sit in around the handbook's wheel */
const CT_ICON={Cool:'◆',Beauty:'●',Cute:'★',Clever:'■',Tough:'▼',Any:'✦'};
const CT_VIEWS=[['moves','Contest moves'],['keys','Keywords'],['help','Appeal helper'],['how','How contests work'],['ex','Example (Option B)'],['rib','Ribbons']];
S.ui.ct=S.ui.ct||{v:'moves',q:'',type:'',kw:'',show:'all',page:1,mv:'',mvt:'',ctype:'',volt:'0',elec:false,first:false,last:false,fin:false,low:false,both:false,maxed:false,before:'0',alone:false,allBig:false,lastHp:'2d4',ready:false,same:false,stat:'0',res:null,mon:'',sfrom:'',spent:{}};
const CT_PAGE=80;

/* two types on the wheel: the same type, next to each other (they get along), or across from each other (they clash) */
function ctRel(a,b){
  const i=CT_TYPES.indexOf(a),j=CT_TYPES.indexOf(b);
  if(i<0||j<0)return 'n';
  if(i===j)return 'm';
  return Math.min((i-j+5)%5,(j-i+5)%5)===1?'c':'x';
}
const ctClash=t=>CT_TYPES.filter(x=>ctRel(t,x)==='x');
const ctNear=t=>CT_TYPES.filter(x=>ctRel(t,x)==='c');

/* the 22 keywords: name, the Heart Points it starts with, the dice it always has (null when it depends), and what it does */
const CT_KW=[
  {k:'Appeal',hp:'3d4',n:3,fx:'Nothing special.'},
  {k:'Attention Grabber',hp:'Special',n:null,fx:'Roll the same number of d4 as the last move used (1d4, 2d4 or 3d4), plus one more die.'},
  {k:'Big Show',hp:'Special',n:null,fx:'Roll 8d4 if every contestant before you rolled at least 3d4 this round. It only works if you appeal last in the final round.'},
  {k:'Catching Up',hp:'1d4',n:1,fx:'Roll 3d4 more if you have the fewest total Heart Points right now.'},
  {k:'Crowd Pleaser',hp:'1d4',n:1,fx:'Raises the judge’s Voltage by exactly 2, whatever the move’s contest type.'},
  {k:'Excitement',hp:'2d4',n:2,fx:'The judge’s Voltage cannot go down for the rest of the round.'},
  {k:'Final Appeal',hp:'2d4',n:2,fx:'Roll 2d4 more if this is the final round.'},
  {k:'Get Ready!',hp:'None',n:0,fx:'No Heart Points of its own. On your next appeal you roll twice the dice you normally would.'},
  {k:'Good Show!',hp:'1d4',n:1,fx:'Roll 3d4 more if Voltage was raised on both of the last two appeals this round.'},
  {k:'Hold That Thought',hp:'2d4',n:2,fx:'After your appeal, the judge’s Voltage cannot be raised for the rest of the round.'},
  {k:'Incredible',hp:'1d4',n:1,fx:'Raises every judge’s Voltage by 1, whatever the contest types.'},
  {k:'Incentives',hp:'2d4',n:2,fx:'Roll 2d4 more when your appeal raises the judge’s Voltage.'},
  {k:'Inversed Appeal',hp:'Special',n:null,fx:'Roll 4d4, minus 1d4 for every point of the judge’s Voltage.'},
  {k:'Reflective Appeal',hp:'Special',n:null,fx:'Roll 1d4 for every point of the judge’s Voltage, up to 4d4.'},
  {k:'Reliable',hp:'2d4',n:2,fx:'You may use the same move next round and still earn Heart Points. When you do, roll 1d4 more.'},
  {k:'Round Ender',hp:'2d4',n:2,fx:'Roll 2d4 more if you appeal last this round.'},
  {k:'Round Starter',hp:'2d4',n:2,fx:'Roll 2d4 more if you appeal first this round.'},
  {k:'Scrambler',hp:'2d4',n:2,fx:'The order of appeals next round is randomised, and everyone must follow it.'},
  {k:'Seen Nothing Yet',hp:'2d4',n:2,fx:'Roll 2d4 more if anyone has raised a judge’s Voltage to the maximum this round.'},
  {k:'Special Attention',hp:'1d4',n:1,fx:'Roll 3d4 more if at least two appeals came before yours and nobody else appealed to your judge this round.'},
  {k:'Torrential Appeal',hp:'Special',n:null,fx:'Roll 1d4 for every contestant who appealed before you this round.'},
  {k:'Unsettling',hp:'2d4',n:2,fx:'Lowers every judge’s Voltage by 1.'}
];
const CT_KWMAP=new Map(CT_KW.map(x=>[dexKey(x.k),x]));
const ctKw=k=>CT_KWMAP.get(dexKey(k))||null;

/* ----- the move list, read from the table's database ----- */
const CT={list:null,map:null,sub:null,busy:null,fail:0,none:false};
function ctSet(arr){
  const list=[],map=new Map();
  (Array.isArray(arr)?arr:[]).forEach(a=>{
    if(!Array.isArray(a)||!a[0]||!a[2])return;
    const e={n:String(a[0]),t:String(a[1]||''),k:String(a[2]),note:a[3]?String(a[3]):''};
    list.push(e);
    map.set(dexKey(e.n),e);
  });
  CT.list=list.length?list:null;
  CT.map=list.length?map:null;
  CT.none=!list.length;
}
function ctLoad(){
  if(CT.list)return Promise.resolve(CT.list);
  if(CT.busy)return CT.busy;
  if(!S.db||(CT.fail&&Date.now()-CT.fail<30000))return Promise.resolve(null);
  let done,first=true;
  const p=new Promise(r=>{done=r;});
  CT.busy=p;
  const fin=v=>{if(first){first=false;clearTimeout(to);CT.busy=null;if(!v&&!CT.none)CT.fail=Date.now();done(v);}};
  const to=setTimeout(()=>fin(null),9000);
  if(CT.sub)try{CT.sub();}catch(e){}
  CT.sub=S.db.collection('meta').doc('pta_contest').onSnapshot(s=>{
    if(!s.exists){
      if(s.metadata&&s.metadata.fromCache)return;
      ctSet(null);
    }else ctSet(jparse((s.data()||{}).j));
    fin(CT.list);
    scheduleRender();
  },()=>fin(null));
  return p;
}
function ctWarm(){
  if(CT.list||CT.busy||CT.none||!S.db||(CT.fail&&Date.now()-CT.fail<30000))return;
  ctLoad().then(()=>scheduleRender());
}
const ctOf=name=>(CT.map&&CT.map.get(dexKey(name)))||null;
/* what a Pokémon's move is in a contest: its entry in the handbook list, or an Appeal move of the type its tutor picked */
function ctOfRow(x){
  const e=ctOf(x&&x.name);
  if(e)return {t:e.t,k:e.k,note:e.note,own:false};
  const t=x&&CT_TYPES.indexOf(x.ct)>=0?x.ct:'';
  return t?{t,k:'Appeal',note:'',own:true}:null;
}
const ctChip=t=>h`<span class="ct ${String(t||'').toLowerCase()}"><span aria-hidden="true">${CT_ICON[t]||''}</span>${t==='Any'?'Any type':t}</span>`;

/* the line under a move on the Pokémon sheet */
function ctLine(id,m,x,i,ro){
  ctWarm();
  if(!CT.list||!String(x.name||'').trim())return '';
  const c=ctOfRow(x);
  if(c){
    const kw=ctKw(c.k);
    return h`<div class="ctrow"><span class="fl">Contest</span>${ctChip(c.t)}<b>${c.k}</b><span class="sub">${kw?kw.hp+' Heart Points':''}${c.own?' · tutored move':''}</span>
      <button class="btn sm" data-act="ct_use" data-name="${x.name}" data-pid="${m.id}" ${c.own?attr('data-ct',c.t):''}>Appeal</button>
      ${kw?h`<span class="sub ctfx">${kw.fx}</span>`:''}${c.note?h`<span class="sub ctfx">${c.note}</span>`:''}</div>`;
  }
  if(ro)return '';
  return h`<div class="ctrow">${fSel('Contest type','p',id,'moves.'+i+'.ct',m,CT_TYPES,{blank:'Not on the handbook list',cls:'ctsel'})}<span class="sub ctfx">A move taught by a tutor is an Appeal move, and the tutor picks its contest type.</span></div>`;
}

/* ----- what the viewing trainer's Pokémon know ----- */
function ctMine(){
  const uid=dxUid();
  if(!uid||!S.trainers[uid])return {uid:null,mons:[]};
  return {uid,mons:monsOf(uid).map(m=>({id:m.id,name:mName(m),sp:m.species||'',cs:ctStatsOf(m),moves:(m.moves||[]).map(x=>({n:String(x&&x.name||'').trim(),ct:x&&CT_TYPES.indexOf(x.ct)>=0?x.ct:''})).filter(x=>x.n)})).filter(m=>m.moves.length)};
}

/* the contest type a player set on a tutored move of theirs, found by the move's name */
function ctOwnType(name){
  const k=dexKey(name);
  const mons=ctMine().mons;
  for(let i=0;i<mons.length;i++){
    const x=mons[i].moves.find(y=>dexKey(y.n)===k&&y.ct);
    if(x)return x.ct;
  }
  return '';
}

/* a Pokémon's five contest stats, keyed by contest type: {Cool:n,Beauty:n,...} */
function ctStatsOf(m){
  const cs=(m&&m.cs)||{};
  const o={};
  CT_TYPES.forEach(t=>{o[t]=clamp(Math.round(num(cs[t.toLowerCase()])),0,30);});
  return o;
}
const ctStatTotal=cs=>CT_TYPES.reduce((a,t)=>a+num(cs[t]),0);
/* the Pokémon the helper is working with, if it is one of the viewed trainer's */
function ctMon(){
  const id=S.ui.ct.mon;
  return id?(ctMine().mons.find(m=>m.id===id)||null):null;
}
const ctSpent=(mon,t)=>num(((S.ui.ct.spent||{})[mon.id]||{})[t]);
const ctLeft=(mon,t)=>Math.max(0,num(mon.cs[t])-ctSpent(mon,t));
/* which of its stats this appeal would draw on: the move's own type, or the one the player picks for an any-type move */
function ctStatType(p,mon){
  if(p.type==='Any'){
    const o=S.ui.ct;
    if(CT_TYPES.indexOf(o.sfrom)>=0)return o.sfrom;
    let best=CT_TYPES[0];
    CT_TYPES.forEach(t=>{if(ctLeft(mon,t)>ctLeft(mon,best))best=t;});
    return best;
  }
  return CT_TYPES.indexOf(p.type)>=0?p.type:'';
}
/* what the chosen Pokémon can spend on this move, or null when no Pokémon is chosen */
function ctAvail(){
  const mon=ctMon(),p=ctPickInfo();
  if(!mon||!p.type)return null;
  const t=ctStatType(p,mon);
  if(!t)return null;
  return {mon,t,left:ctLeft(mon,t),total:num(mon.cs[t])};
}
const ctAnySpent=()=>{const sp=S.ui.ct.spent||{};return Object.keys(sp).some(k=>CT_TYPES.some(t=>num(sp[k][t])>0));};

/* ----- the appeal helper's arithmetic. Nothing here touches the database. ----- */
/* o: kw, type (the move's), ctype (the contest's), volt, elec, first, last, fin, low, both, maxed, before, alone, allBig, lastHp, ready, same, stat */
function ctCalc(o){
  const kw=o.kw||'Appeal';
  const volt=clamp(Math.round(num(o.volt)),0,5);
  const before=clamp(Math.round(num(o.before)),0,9);
  const rel=o.ctype?ctRel(o.type,o.ctype):'n';
  const parts=[],notes=[],after=[];
  const add=(n,why)=>{if(n>0)parts.push({n,why});};
  /* what the move does to the judge's Voltage */
  let dv=rel==='m'?1:rel==='x'?-1:0;
  if(kw==='Crowd Pleaser')dv=2;
  const raises=dv>0&&volt<5;
  const reach=volt<5&&volt+dv>=5;
  switch(kw){
    case 'Appeal':add(3,'Appeal');break;
    case 'Attention Grabber':{const n=clamp(Math.round(num(String(o.lastHp||'2d4').replace(/d.*$/,''))),1,3);add(n+1,'the last move’s '+n+'d4 and one more die');break;}
    case 'Big Show':
      if(o.last&&o.fin&&o.allBig)add(8,'Big Show');
      else notes.push('Big Show only works if you appeal last in the final round and every contestant before you rolled at least 3d4. Otherwise it earns no dice.');
      break;
    case 'Catching Up':add(1,'Catching Up');if(o.low)add(3,'you have the fewest Heart Points');break;
    case 'Crowd Pleaser':add(1,'Crowd Pleaser');break;
    case 'Excitement':add(2,'Excitement');break;
    case 'Final Appeal':add(2,'Final Appeal');if(o.fin)add(2,'it is the final round');break;
    case 'Get Ready!':break;
    case 'Good Show!':add(1,'Good Show!');if(o.both)add(3,'Voltage was raised on both of the last two appeals');break;
    case 'Hold That Thought':add(2,'Hold That Thought');break;
    case 'Incredible':add(1,'Incredible');break;
    case 'Incentives':add(2,'Incentives');if(raises)add(2,'your appeal raises the Voltage');break;
    case 'Inversed Appeal':add(Math.max(0,4-volt),'4d4 minus 1d4 for each point of Voltage');break;
    case 'Reflective Appeal':add(Math.min(4,volt),'1d4 for each point of Voltage, up to 4d4');break;
    case 'Reliable':add(2,'Reliable');if(o.same)add(1,'you repeated a Reliable move');break;
    case 'Round Ender':add(2,'Round Ender');if(o.last)add(2,'you appeal last');break;
    case 'Round Starter':add(2,'Round Starter');if(o.first)add(2,'you appeal first');break;
    case 'Scrambler':add(2,'Scrambler');break;
    case 'Seen Nothing Yet':add(2,'Seen Nothing Yet');if(o.maxed)add(2,'someone raised a judge’s Voltage to the maximum');break;
    case 'Special Attention':add(1,'Special Attention');if(before>=2&&o.alone)add(3,'nobody else appealed to this judge');break;
    case 'Torrential Appeal':add(before,'1d4 for each contestant before you');break;
    case 'Unsettling':add(2,'Unsettling');break;
    default:break;
  }
  if(rel==='m')add(1,'the move matches the contest type');
  if(reach)add(3,'the judge reaches 5 Voltage');
  /* the same move twice in a row earns nothing, except a Reliable one */
  const zero=!!o.same&&kw!=='Reliable';
  if(zero){parts.length=0;notes.push('The same move twice in a row earns no Heart Points at all. Its effects still happen.');}
  let mult=1;
  if(o.ready&&!zero){mult*=2;parts.forEach(p=>{p.n*=2;});}
  const stat=clamp(Math.round(num(o.stat)),0,40);
  const dice=parts.reduce((a,p)=>a+p.n,0);
  const x2=!!o.elec&&!zero;
  /* what to do to the judge afterwards */
  if(kw==='Crowd Pleaser')after.push(volt>=5?'The judge is already at the maximum Voltage.':'Raise the judge’s Voltage by exactly 2.');
  else if(rel==='m')after.push(volt>=5?'The judge is already at the maximum Voltage.':'Raise the judge’s Voltage by 1: the move matches the contest type.');
  else if(rel==='x')after.push('Lower the judge’s Voltage by 1: the move clashes with the contest type.');
  else if(rel==='c')after.push('The move gets along with the contest type, so the Voltage does not change.');
  if(reach)after.push('The judge is now Electrified: every later appeal to them earns double Heart Points.');
  if(kw==='Incredible')after.push('Raise every judge’s Voltage by 1.');
  if(kw==='Unsettling')after.push('Lower every judge’s Voltage by 1.');
  if(kw==='Excitement')after.push('The judge’s Voltage cannot go down for the rest of the round.');
  if(kw==='Hold That Thought')after.push('The judge’s Voltage cannot be raised for the rest of the round.');
  if(kw==='Scrambler')after.push('Randomise the order of appeals for the next round.');
  if(kw==='Get Ready!')after.push('On your next appeal, roll twice the dice you normally would.');
  return {kw,rel,parts,dice,stat:zero?0:stat,x2,ready:!!o.ready&&!zero,zero,notes,after,raises,reach};
}
const ctDiceTxt=c=>c.parts.length?c.parts.map(p=>p.n+'d4 '+p.why).join(' + '):'no dice';
function ctDo(c){
  const rolled=[];
  for(let i=0;i<c.dice;i++)rolled.push(rnd(4));
  const sum=rolled.reduce((a,b)=>a+b,0);
  const sub=sum+c.stat;
  const total=c.zero?0:(c.x2?sub*2:sub);
  return {rolled,sum,total,sub};
}
function ctDetail(c,r){
  let s=(c.dice?c.dice+'d4 ['+r.rolled.join(', ')+']':'no dice')+(c.stat?' + '+c.stat+' contest stat':'')+(c.x2?' × 2 Electrified':'')+' = '+r.total;
  if(c.ready)s+=' (dice doubled by Get Ready!)';
  return s;
}

/* ----- the move the helper is working on ----- */
function ctPickInfo(){
  const o=S.ui.ct;
  const name=String(o.mv||'').trim();
  const e=name?ctOf(name):null;
  const type=e?e.t:(CT_TYPES.indexOf(o.mvt)>=0?o.mvt:'');
  return {name,e,type,kw:e?e.k:'Appeal'};
}
function ctState(){
  const o=S.ui.ct,p=ctPickInfo();
  const av=ctAvail();
  return {kw:p.kw,type:p.type,ctype:o.ctype,volt:o.volt,elec:o.elec,first:o.first,last:o.last,fin:o.fin,low:o.low,both:o.both,maxed:o.maxed,before:o.before,alone:o.alone,allBig:o.allBig,lastHp:o.lastHp,ready:o.ready,same:o.same,stat:av?Math.min(num(o.stat),av.left):o.stat};
}

/* ----- the page ----- */
const ctSel=(key,label,opts,cur)=>h`<label class="fld"><span class="fl">${label}</span><select data-u="ct.${key}">${opts.map(op=>{const v=Array.isArray(op)?op[0]:op;const l=Array.isArray(op)?op[1]:op;return h`<option value="${v}" ${String(v)===String(cur)?raw('selected'):''}>${l}</option>`;})}</select></label>`;
const ctChk=(key,label)=>h`<label class="row"><input type="checkbox" data-u="ct.${key}" ${S.ui.ct[key]?raw('checked'):''}><span>${label}</span></label>`;
const ctNums=(a,b)=>Array.from({length:b-a+1},(_,i)=>String(a+i));

function ctGate(){
  if(CT.list)return '';
  if(CT.busy||(!CT.none&&!CT.fail))return h`<p class="sub" role="status">Loading the contest move list…</p>`;
  if(S.me.admin)return h`<div class="banner">The contest move list is not loaded. If you have not imported the newest handbook data yet, open the GM Desk, choose <b>Import again</b> under Handbook data, and pick the newest <b>pta-handbook-data.json</b>.</div>`;
  return CT.none
    ?h`<div class="banner">The contest move list has not been added yet. Ask your GM to import the newest handbook data.</div>`
    :h`<p class="sub bad" role="status">The contest move list could not be loaded just now. Reload the page to try again.</p>`;
}

function ctMovesView(){
  const o=S.ui.ct;
  const mine=ctMine();
  const gate=ctGate();
  return h`${S.me.admin?trainerPicker():''}
    ${gate}
    ${CT.list&&mine.mons.length?h`<h3 class="refg">${S.me.admin?tName(S.trainers[mine.uid])+'’s Pokémon':'Your Pokémon'}</h3>
      <div class="ctmons">${mine.mons.map(m=>h`<div class="ctmon"><p class="ctmn"><b>${m.name}</b>${m.sp&&m.sp!==m.name?h` <span class="sub">${m.sp}</span>`:''}</p>
        <ul class="ctlist">${m.moves.map(x=>{
          const e=ctOf(x.n);
          const kw=e?ctKw(e.k):null;
          const own=!e&&x.ct;
          return h`<li><span class="ctt">${e?ctChip(e.t):own?ctChip(x.ct):h`<span class="sub">Not listed</span>`}</span><span class="ctn">${x.n}</span><span class="ctk">${e?h`<b>${e.k}</b> <span class="sub">${kw?kw.hp:''}</span>`:own?h`<b>Appeal</b> <span class="sub">3d4 · tutored move</span>`:h`<span class="sub">Appeal, the tutor picks the type</span>`}</span><button class="btn sm" data-act="ct_use" data-name="${x.n}" data-pid="${m.id}">Appeal</button></li>`;
        })}</ul></div>`)}</div>`:''}
    ${CT.list?h`<h3 class="refg">Every contest move</h3>
    <div class="dxf">
      <label class="fld dxq"><span class="fl">Search</span><input type="search" data-u="ct.q" data-nr value="${o.q||''}" placeholder="Move name" autocomplete="off"></label>
      ${ctSel('type','Contest type',[['','All types']].concat(CT_TYPES.concat(['Any']).map(t=>[t,t==='Any'?'Any type':t])),o.type)}
      ${ctSel('kw','Keyword',[['','All keywords']].concat(CT_KW.map(x=>[x.k,x.k])),o.kw)}
      ${mine.mons.length?ctSel('show','Show',[['all','Every move'],['mine','Moves my Pokémon know']],o.show):''}
    </div>
    <div id="ctres">${ctResults()}</div>`:''}`;
}
function ctFiltered(){
  const o=S.ui.ct;
  const q=dexKey(o.q);
  let known=null;
  if(o.show==='mine'){
    const mm=ctMine().mons;
    if(mm.length){known=new Set();mm.forEach(m=>m.moves.forEach(x=>known.add(dexKey(x.n))));}
  }
  return (CT.list||[]).filter(e=>(!q||dexKey(e.n).indexOf(q)>=0)&&(!o.type||e.t===o.type)&&(!o.kw||e.k===o.kw)&&(!known||known.has(dexKey(e.n))));
}
function ctResults(){
  const o=S.ui.ct;
  const all=ctFiltered();
  const shown=all.slice(0,o.page*CT_PAGE);
  const filtered=!!(o.q||o.type||o.kw||o.show!=='all');
  return h`<p class="sub" id="ctcount" aria-live="polite">${all.length===1?'1 move':all.length+' moves'}${all.length>shown.length?' · showing '+shown.length:''}</p>
    ${all.length?h`<ul class="ctlist">${shown.map(e=>{
      const kw=ctKw(e.k);
      return h`<li><span class="ctt">${ctChip(e.t)}</span><span class="ctn">${e.n}</span><span class="ctk"><b>${e.k}</b> <span class="sub">${kw?kw.hp:''}</span>${e.note?h` <span class="sub">${e.note}</span>`:''}</span><button class="btn sm" data-act="ct_use" data-name="${e.n}">Appeal</button></li>`;
    })}</ul>`:h`<p class="sub">Nothing matches.${filtered?h` <button class="btn sm" data-act="ct_clear">Clear the filters</button>`:''}</p>`}
    ${all.length>shown.length?h`<div class="row"><button class="btn" data-act="ct_more">Show ${Math.min(CT_PAGE,all.length-shown.length)} more</button></div>`:''}`;
}
/* typing in the search box redraws only the results, so the box keeps its place */
function ctRefresh(){
  const el=$('#ctres');
  if(el)el.innerHTML=ctResults().s;
}

function ctKeysView(){
  const cnt={};
  (CT.list||[]).forEach(e=>{cnt[e.k]=(cnt[e.k]||0)+1;});
  return h`<p class="sub">Every contest move has one keyword. The keyword says how many d4 the appeal rolls for Heart Points and what else it does. In a contest, moves can be used again and again, so a move’s 1/day or 3/day limit does not apply.</p>
    ${ctGate()}
    <dl class="refdl ctkw">${CT_KW.map(x=>h`<dt>${x.k}<br><span class="pill">${x.hp}</span></dt><dd>${x.fx}${CT.list?h`<br><button class="btn sm ghost" data-act="ct_kw" data-k="${x.k}">${cnt[x.k]||0} move${(cnt[x.k]||0)===1?'':'s'}</button>`:''}</dd>`)}</dl>`;
}

/* ----- the appeal helper ----- */
function ctHelpBody(){
  const o=S.ui.ct;
  const p=ctPickInfo();
  const tn=!p.name;
  const needs={first:p.kw==='Round Starter',last:p.kw==='Round Ender'||p.kw==='Big Show',fin:p.kw==='Final Appeal'||p.kw==='Big Show',low:p.kw==='Catching Up',both:p.kw==='Good Show!',maxed:p.kw==='Seen Nothing Yet',
    before:p.kw==='Torrential Appeal'||p.kw==='Special Attention',alone:p.kw==='Special Attention',allBig:p.kw==='Big Show',lastHp:p.kw==='Attention Grabber'};
  if(tn)return h`<p class="sub">Type a move name above, or pick one of your Pokémon’s moves, and the helper works out what to roll.</p>`;
  if(!p.type)return h`<p class="sub">“${p.name}” is not on the handbook’s contest list. A tutored move is an Appeal move, and its tutor picks the contest type.</p>
    <div class="mrgrid refmx">${ctSel('mvt','Contest type of this move',[['','Pick a type']].concat(CT_TYPES),o.mvt)}</div>`;
  const av=ctAvail();
  const st=ctState();
  const c=ctCalc(st);
  const kwi=ctKw(p.kw);
  const rel=c.rel;
  return h`<p class="ctsum">${ctChip(p.type)} <b>${p.name}</b> · ${p.kw} <span class="sub">${kwi?kwi.hp+' Heart Points':''}</span></p>
    ${kwi?h`<p class="sub">${kwi.fx}</p>`:''}
    ${p.e&&p.e.note?h`<p class="sub">${p.e.note}</p>`:''}
    <div class="mrgrid refmx">
      ${ctSel('ctype','Type of this contest',[['','Not announced / none']].concat(CT_TYPES),o.ctype)}
      ${ctSel('volt','The judge’s Voltage now',ctNums(0,5),o.volt)}
      ${av?(p.type==='Any'?ctSel('sfrom','Spend from which stat',CT_TYPES.map(t=>[t,t+' · '+ctLeft(av.mon,t)+' left']),av.t):''):''}
      ${av?ctSel('stat','Contest stat points you spend ('+av.t+', '+av.left+' left)',ctNums(0,av.left),String(Math.min(num(o.stat),av.left))):ctSel('stat','Contest stat points you spend',ctNums(0,10),o.stat)}
      ${needs.before?ctSel('before','Contestants who appealed before you this round',ctNums(0,9),o.before):''}
      ${needs.lastHp?ctSel('lastHp','Heart Points dice of the last move used',['1d4','2d4','3d4'],o.lastHp):''}
    </div>
    <div class="ctchecks">
      ${needs.first?ctChk('first','You appeal first this round'):''}
      ${needs.last?ctChk('last','You appeal last this round'):''}
      ${needs.fin?ctChk('fin','This is the final round'):''}
      ${needs.low?ctChk('low','You have the fewest total Heart Points'):''}
      ${needs.both?ctChk('both','Voltage was raised on both of the last two appeals this round'):''}
      ${needs.maxed?ctChk('maxed','Someone raised a judge’s Voltage to the maximum this round'):''}
      ${needs.alone?ctChk('alone','Nobody else appealed to this judge this round'):''}
      ${needs.allBig?ctChk('allBig','Every contestant before you rolled at least 3d4'):''}
      ${p.kw!=='Reliable'?ctChk('same','You used this same move on your last appeal'):ctChk('same','You used this same Reliable move last round')}
      ${ctChk('ready','Your last appeal was Get Ready! (roll double)')}
      ${ctChk('elec','This judge is Electrified (double Heart Points)')}
    </div>
    <div class="ctcalc" role="status" aria-live="polite">
      <p><b>${c.zero?'No Heart Points':c.dice+'d4'+(c.stat?' + '+c.stat:'')+(c.x2?' × 2':'')}</b>${rel==='m'?h` <span class="pill good">Matches the contest</span>`:rel==='x'?h` <span class="pill bad">Clashes with the contest</span>`:rel==='c'?h` <span class="pill">Gets along with the contest</span>`:''}</p>
      ${c.parts.length?h`<ul class="reful">${c.parts.map(x=>h`<li>${x.n}d4 · ${x.why}</li>`)}${c.stat?h`<li>+${c.stat} · contest stat points spent</li>`:''}</ul>`:''}
      ${c.notes.map(n=>h`<p class="sub">${n}</p>`)}
    </div>
    <div class="row"><button class="btn primary" data-act="ct_roll">Roll the appeal</button><button class="btn" data-act="ct_reset">Reset</button></div>
    ${o.res?ctResult(o.res):''}
    ${c.after.length?h`<h3 class="refg">After your appeal</h3><ul class="reful">${c.after.map(x=>h`<li>${x}</li>`)}</ul>`:''}
    <p class="sub">When you describe your appeal (about ten seconds), the GM may add one or two secret d4 rolls for it. The GM rolls those, not you.</p>`;
}
function ctResult(r){
  return h`<div class="ctres" role="status" aria-live="polite"><span class="k">HEART POINTS</span><div class="big">${r.total}</div><div class="sub">${r.name} · ${r.detail}</div></div>`;
}
function ctHelpView(){
  const o=S.ui.ct;
  const mine=ctMine();
  const mon=ctMon();
  const pool=mon?[mon]:mine.mons;
  const opt=(m,x)=>h`<option value="${m.id+'|'+x.n}" ${m.id===o.mon&&dexKey(x.n)===dexKey(o.mv)?raw('selected'):''}>${x.n}</option>`;
  return h`<p class="sub">Pick a move and say what is going on in the round. The helper adds up the dice from the move’s keyword, rolls them, and tells you what happens to the judge’s Voltage. It is a memory aid: the handbook has the full rules.</p>
    ${ctGate()}
    <div class="mrgrid refmx">
      ${mine.mons.length?h`<label class="fld"><span class="fl">Pokémon (to use its contest stats)</span><select data-u="ct.monsel"><option value="">Not using contest stats</option>${mine.mons.map(m=>h`<option value="${m.id}" ${m.id===o.mon?raw('selected'):''}>${m.name}</option>`)}</select></label>`:''}
      <label class="fld"><span class="fl">Move</span><input type="text" data-u="ct.mv" data-nr list="dl-ctmoves" value="${o.mv||''}" placeholder="Start typing a move" autocomplete="off"></label>
      ${mine.mons.length?h`<label class="fld"><span class="fl">Or ${mon?mon.name+'’s':'one of your Pokémon’s'} moves</span><select data-u="ct.mvsel"><option value="">Choose…</option>${mon?mon.moves.map(x=>opt(mon,x)):pool.map(m=>h`<optgroup label="${m.name}">${m.moves.map(x=>opt(m,x))}</optgroup>`)}</select></label>`:''}
    </div>
    ${mon?h`<div class="ctstats" aria-label="${mon.name}’s contest stats, points left out of points written">${CT_TYPES.map(t=>h`<span class="ctst">${ctChip(t)} <b>${ctLeft(mon,t)}</b><span class="sub">/${mon.cs[t]}</span></span>`)}${ctStatTotal(mon.cs)?'':h`<span class="sub">No contest stats are written on its sheet yet.</span>`}</div>`:''}
    ${ctAnySpent()?h`<div class="row"><button class="btn sm" data-act="ct_restore">New contest: restore all stat points</button><span class="sub">Points spent in a contest come back at the end of it.</span></div>`:''}
    <datalist id="dl-ctmoves">${(CT.list||[]).map(e=>h`<option value="${e.n}">`)}</datalist>
    <div id="cthelp">${ctHelpBody()}</div>`;
}
function ctHelpRefresh(){
  const el=$('#cthelp');
  if(el)el.innerHTML=ctHelpBody().s;
}

/* ----- how a contest runs, in plain words ----- */
function ctHowView(){
  const wheel=CT_TYPES.map(t=>h`<li>${ctChip(t)} <span class="sub">gets along with</span> ${ctNear(t).map(x=>ctChip(x))} <span class="sub">and clashes with</span> ${ctClash(t).map(x=>ctChip(x))}</li>`);
  return h`<div class="refp">
    ${refSec('ct_what','What a contest is',h`<ul class="reful">
      <li>Instead of knocking each other out, coordinators try to impress a panel of judges. Usually there are three judges, and each has three Star Points to give.</li>
      <li>Each judge has a hidden goal for each Star Point, such as the most Heart Points overall, or the most Heart Points with Clever moves or Fire-type moves. You earn the point by meeting the goal by the end of the contest. Whoever has the most Star Points wins a Contest Ribbon.</li>
      <li>Appeals earn Heart Points. The judges keep track of them and use them to decide who gets which Star Point.</li>
      <li>At least one contest type is announced at the start, and at least one judge favours it. That only decides one Star Point, so watch the judges for clues about the others.</li>
    </ul>`)}
    ${refSec('ct_types','Contest types',h`<p class="sub">Every move has a contest type as well as its battle type: Cool, Beauty, Cute, Clever or Tough. Around the handbook’s wheel, neighbours get along and the two types across from each other clash.</p>
      <ul class="ctwheel">${wheel}</ul>
      <ul class="reful"><li><b>Cool</b> rewards confidence, precision and strong stage presence.</li><li><b>Beauty</b> rewards grace, elegance and visual harmony.</li><li><b>Cute</b> rewards charm, personality and audience appeal.</li><li><b>Clever</b> rewards creativity, strategy and the unexpected.</li><li><b>Tough</b> rewards endurance, resilience and intensity.</li></ul>`)}
    ${refSec('ct_stages','The three stages',h`<h3 class="refg">Introduction</h3>
      <ul class="reful"><li>Everyone introduces themselves. Each trainer may make one Insight check on a single judge. A success reveals one hidden goal, and a very good roll may reveal several.</li>
      <li>The favoured contest type is announced. Moves of that type raise the judge’s excitement.</li>
      <li>If a judge wants an initial appeal, a Pokémon comes out and its grooming, contest stats and any accessories are looked over. Some contests give Heart Points for this.</li></ul>
      <h3 class="refg">Appeal stage</h3>
      <ul class="reful"><li>There are five rounds. In each round you pick a judge to perform for, pick a move, and use its keyword to work out your Heart Points.</li>
      <li>If the move’s contest type matches the contest’s type, roll 1d4 more Heart Points and raise that judge’s Voltage by 1 afterwards. If it clashes, lower the Voltage by 1 instead. If it gets along with the contest type, nothing changes.</li>
      <li>When a judge’s Voltage reaches 5, the contestant who got it there gets 3d4 more Heart Points on that appeal, and the judge is Electrified for the rest of the contest: every appeal to them earns double Heart Points.</li>
      <li>Using the same move twice in a row earns no Heart Points, though its effects and Voltage changes still happen. Reliable moves are the exception.</li>
      <li>Within a round, contestants appeal in any order. If several want to go at once, the fastest Pokémon goes first. If nobody wants to, the judges pick whoever has the most Heart Points, with Speed breaking ties.</li>
      <li>Describe your appeal in about ten seconds. The GM may add one or two secret d4 rolls for good creativity.</li></ul>
      <h3 class="refg">Award stage</h3>
      <ul class="reful"><li>Each judge announces their goals one by one and hands out Star Points. The trainer with the most Star Points wins a Contest Ribbon, and big contests may give a runner-up ribbon. A tie can mean shared first place.</li>
      <li>A trainer can earn several ribbons across different contests, but only one honour per contest hall.</li></ul>`)}
    ${refSec('ct_stats','Contest stats',h`<ul class="reful"><li>Each Pokémon has five contest stats, one for each contest type. They start at zero and grow when you feed it special foods such as Poffins and PokéBlocks.</li>
      <li>A Pokémon can have 10 points in total, split however you like. Scarves can push the total above 10. Once spent on food, they are permanent.</li>
      <li>During the introduction or any appeal, you may spend points from a stat to add that many to your Heart Points, but only when the move’s contest type matches that stat. Everything is restored at the end of the contest.</li>
      <li>Write a Pokémon’s five stats in the Contest stats box on its sheet. In the Appeal helper, pick that Pokémon and the helper will only let you spend what is left in the matching stat, and count what you have spent until you press the restore button for a new contest.</li></ul>`)}
    ${refSec('ct_var','Variations',h`<dl class="refdl">
      <dt>Trainer Appeal</dt><dd>The trainer’s own speeches, music, feats or attacks can earn Heart Points too.</dd>
      <dt>Super Contest</dt><dd>A contest type is picked at random at the start of every round.</dd>
      <dt>Festival</dt><dd>Each judge announces a different favoured type every round.</dd>
      <dt>High Voltage</dt><dd>Each judge starts at 1 Voltage. Whenever a judge’s Voltage rises, the appeal adds that many d4. Electrified judges add 5d4 rather than doubling.</dd>
      <dt>Rival Showcase</dt><dd>Contestants are paired off and judged against each other every round.</dd>
      <dt>Audience Participation</dt><dd>Exciting the crowd or matching its tastes can earn bonus Heart Points.</dd>
      <dt>Double Performance</dt><dd>Two Pokémon appeal together each round, and the two moves are combined: take the contest type from one and the keyword from the other. Neither can repeat last round’s move unless it is Reliable.</dd>
      <dt>Extra stages</dt><dd>Judges can add a Fashion Show (Cute, Beauty), Pokéathlon (Tough), PokéStar Heroes (Cool), Talent Show (Clever) or a Dummy round that scores damage done to a stage dummy. They award extra Star Points.</dd></dl>`)}
    ${refSec('ct_optb','House rule: Option B',h`<p>Each appeal is made to one judge. That judge’s Voltage changes, and the appeal’s Heart Points count only toward that judge’s Star Point categories. Categories that don’t depend on appeals (dress, stats, appearance) are judged across all contestants.</p>
      <p class="sub">The handbook is not clear on whether a Star Point category counts every appeal or only the ones made to that judge, so a table has to pick. This is the second, more tactical choice.</p>
      <button class="btn sm" data-act="ct_view" data-v="ex">See a full example contest</button>`)}
    ${refSec('ct_tut','Moves that are not on the list',h`<p class="sub">A move taught by a tutor that is not on the handbook’s list is an Appeal move. The tutor picks its contest type when the move is learned. On a Pokémon’s sheet you can set that type under the move.</p>`)}
  </div>`;
}

/* ----- a whole contest played out under the Option B house rule ----- */
const ctB=s=>raw(esc(String(s)).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>'));
const CT_EX={
  judges:[
    ['Brutus','head judge, public',['Most Heart Points from Tough moves','Highest total Heart Points','Most appeals made to him']],
    ['Rosa','a regular',['Most Heart Points from Electric-type moves','Most Heart Points from Clever moves','Best-dressed trainer (not appeal-based)']],
    ['Madame Vex','mystery judge',['Most Heart Points from non-damaging moves','Most different contest types used','Pokémon that most looks like its trainer (not appeal-based)']]
  ],
  cons:[
    ['Ren','player','Luxray',[['Tackle','Tough','Appeal'],['Zing Zap','Tough','Appeal'],['Thunder Wave','Cool','Excitement'],['Bide','Tough','Final Appeal']],'All of Brutus’s categories (DC 10), plus Rosa’s Electric category (DC 20)'],
    ['Mae','player','Roserade',[['Absorb','Clever','Good Show!'],['Toxic','Clever','Excitement'],['Acid Armor','Tough','Hold That Thought']],'Brutus’s categories, plus Rosa’s Clever category (Insight check)'],
    ['Garrett','NPC Grand Festival coordinator','Infernape',[['Flamethrower','Beauty','Round Starter'],['Darkest Lariat','Cool','Special Attention'],['Bitter Blade','Cool','Good Show!'],['Tackle','Tough','Appeal']],'Four categories; plans to take Brutus’s total and Vex’s variety category']
  ],
  rounds:[
    {t:'Round 1',rows:[
      ['Garrett → **Vex**',['Flamethrower','Beauty','Round Starter'],'2d4 + 2d4 for going first = 4d4','**10**','Clash, but Vex is already at 0'],
      ['Ren → **Brutus**',['Zing Zap','Tough','Appeal'],'3d4 + 1d4 match = 4d4','**11**','Brutus 0 → **1**'],
      ['Mae → **Rosa**',['Toxic','Clever','Excitement'],'2d4','**5**','Gets along, no change; Rosa’s Voltage can’t drop this round']
    ],note:'Garrett goes first to trigger Round Starter. Ren starts building Brutus toward Electrified.'},
    {t:'Round 2',rows:[
      ['Ren → **Brutus**',['Tackle','Tough','Appeal'],'4d4','**10**','Brutus 1 → **2**'],
      ['Mae → **Brutus**',['Acid Armor','Tough','Hold That Thought'],'2d4 + 1d4 match = 3d4','**7**','Brutus 2 → **3**; Brutus can’t rise again this round'],
      ['Garrett → **Brutus**',['Bitter Blade','Cool','Good Show!'],'1d4 + 3d4 (both earlier appeals this round raised Voltage) = 4d4','**10**','Gets along, no change']
    ],note:'Garrett waited for two Voltage raises in a row, then cashed in Good Show!. Mae’s Hold That Thought blocked nothing here, but it would have stopped a Tough move from Garrett.'},
    {t:'Round 3',rows:[
      ['Ren → **Brutus**',['Zing Zap','Tough','Appeal'],'4d4','**9**','Brutus 3 → **4**'],
      ['Mae → **Rosa**',['Absorb','Clever','Good Show!'],'1d4 (only one appeal came before, so no bonus)','**2**','No change'],
      ['Garrett → **Vex**',['Darkest Lariat','Cool','Special Attention'],'1d4 + 3d4 (two appeals came before him; nobody else performed for Vex) = 4d4','**11**','No change']
    ],note:'Ren can use Zing Zap again because his last move was Tackle. Brutus is one step from Electrified.'},
    {t:'Round 4',rows:[
      ['Garrett → **Brutus**',['Tackle','Tough','Appeal'],'3d4 + 1d4 match + 3d4 for reaching 5 = 7d4','**18**','Brutus 4 → **5: Electrified**'],
      ['Ren → **Brutus**',['Tackle','Tough','Appeal'],'4d4 = 10, doubled','**20**','Already at maximum'],
      ['Mae → **Rosa**',['Toxic','Clever','Excitement'],'2d4','**6**','No change']
    ],note:'The turning point: Ren raised Brutus, but Garrett jumped in first and took the +3d4 for reaching 5. Electrified still benefits everyone, so Ren’s Tackle earns double.'},
    {t:'Round 5 (final round)',rows:[
      ['Ren → **Brutus**',['Bide','Tough','Final Appeal'],'2d4 + 2d4 final round + 1d4 match = 5d4 = 13, doubled','**26**','Already at maximum'],
      ['Garrett → **Brutus**',['Flamethrower','Beauty','Round Starter'],'2d4 (not first) = 5, doubled','**10**','Clash: 5 → 4, but Brutus stays Electrified'],
      ['Mae → **Vex**',['Acid Armor','Tough','Hold That Thought'],'2d4 + 1d4 match = 3d4','**8**','Vex 0 → **1**']
    ],note:'Garrett can’t use Tackle again because he used it last round, so he settles for a weaker doubled appeal.'}
  ],
  awards:[
    ['Brutus','Saw Ren 5 times (11 + 10 + 9 + 20 + 26 = 76, all from Tough moves), Garrett 3 times (10 + 18 + 10 = 38, of which 18 from Tough moves) and Mae once (7, from a Tough move).',[
      ['Most Heart Points from Tough moves','**Ren** (76)'],['Highest total Heart Points','**Ren** (76)'],['Most appeals made to him','**Ren** (5)']]],
    ['Rosa','Only ever saw Mae (Toxic 5, Absorb 2, Toxic 6).',[
      ['Most Heart Points from Electric-type moves','**Not awarded.** Ren knew this category existed but spent every Electric move on Brutus, so Rosa never saw them.'],
      ['Most Heart Points from Clever moves','**Mae** (13)'],['Best-dressed trainer','**Mae** (GM’s call: a coordinated garden-themed outfit)']]],
    ['Madame Vex','Saw Garrett twice (Beauty and Cool moves) and Mae once (a Tough move).',[
      ['Most Heart Points from non-damaging moves','**Mae** (Acid Armor, 8)'],['Most different contest types used','**Garrett** (2 types against Mae’s 1)'],['Pokémon that most looks like its trainer','**Garrett** (GM’s call: wild hair, fiery temper)']]]
  ],
  stand:[['Ren',3,76],['Mae',3,28],['Garrett',2,59]],
  lessons:[
    ['Heart Points alone don’t win.','Garrett had the second-highest total but finished last, because his points were spread across judges and categories.'],
    ['Picking a judge has a cost.','Ren swept Brutus but left Rosa’s Electric point unclaimed. One Electric appeal to Rosa would have won him the contest outright.'],
    ['Scouting pays off.','Mae took Rosa’s Clever point because her Insight check revealed it, then grabbed Vex’s non-damaging point in the final round.'],
    ['Racing for Voltage matters.','Garrett let Ren build Brutus’s Voltage, then stole the +3d4 for reaching 5.']
  ]
};
function cxTable(cols,rows,cls){
  return h`<div class="cxw"><table class="cxt ${cls||''}"><thead><tr>${cols.map(c=>h`<th scope="col">${c}</th>`)}</tr></thead><tbody>${rows.map(r=>h`<tr>${r.map((c,i)=>h`<td data-l="${cols[i]}"><div class="cxc">${c}</div></td>`)}</tr>`)}</tbody></table></div>`;
}
const cxMv=m=>h`${ctChip(m[1])} <b>${m[0]}</b> <span class="sub">${m[2]}</span>`;
function ctExView(){
  const X=CT_EX;
  return h`<div class="refp ctex">
    <div class="cxrule" role="note"><p class="fl">The Option B rule</p>
      <p>Each appeal is made to <b>one judge</b>. That judge’s Voltage changes, and the appeal’s Heart Points count <b>only toward that judge’s Star Point categories</b>. Categories that don’t depend on appeals (dress, stats, appearance) are judged across all contestants.</p>
      <p class="sub">Option A is the simpler version: every category counts every appeal, whichever judge it was aimed at, so choosing a judge only matters for Voltage. If your players are new to contests, run the first one with Option A to teach the basics, then switch to B.</p></div>
    <p class="sub">A worked contest, to show how Option B plays out. It uses three contestants so it is easy to follow; real contests usually have four or five. The movesets are made up for the example. Each move’s contest type and keyword come from the handbook’s list, so you can check any of them on the Contest moves page, and the dice follow the Keywords page.</p>
    <h3 class="refg">The setup</h3>
    <p><b>Contest:</b> Solaceon Town, ${ctChip('Tough')} contest. ${ctChip('Clever')} and ${ctChip('Cool')} moves get along with Tough; ${ctChip('Beauty')} and ${ctChip('Cute')} moves clash. All three judges start at 0 Voltage.</p>
    <p class="fl">Judges and their hidden Star Point categories</p>
    ${cxTable(['Judge','Star Point 1','Star Point 2','Star Point 3'],X.judges.map(j=>[h`<b>${j[0]}</b> <span class="sub">(${j[1]})</span>`].concat(j[2])))}
    <p class="fl">Contestants</p>
    ${cxTable(['Contestant','Pokémon','Moves (contest type, keyword)','Scouted beforehand'],X.cons.map(c=>[h`<b>${c[0]}</b> <span class="sub">(${c[1]})</span>`,c[2],h`<ul class="cxmv">${c[3].map(m=>h`<li>${cxMv(m)}</li>`)}</ul>`,c[4]]))}
    <p class="fl">Dice reminders</p>
    <ul class="reful">
      <li><b>Matching move:</b> a Tough move rolls +1d4 and raises the chosen judge’s Voltage by 1.</li>
      <li><b>Clashing move:</b> lowers that judge’s Voltage by 1.</li>
      <li><b>Reaching 5:</b> the appeal that takes a judge to 5 Voltage rolls +3d4, and that judge is Electrified for the rest of the contest (double Heart Points for everyone).</li>
    </ul>
    <h3 class="refg">The rounds</h3>
    <p class="sub">Brutus becomes the centre of the contest: Ren builds his Voltage for three rounds, Garrett steals the Electrified bonus in round 4, and both cash in on double points at the end.</p>
    ${X.rounds.map(r=>h`<h4 class="cxh">${r.t}</h4>
      ${cxTable(['Order','Who → Judge','Move','Dice','Heart Points','Voltage'],r.rows.map((x,i)=>[String(i+1),ctB(x[0]),cxMv(x[1]),x[2],ctB(x[3]),ctB(x[4])]),'cxr')}
      <p class="sub">${r.note}</p>`)}
    <h3 class="refg">The awards</h3>
    <p class="sub">Under Option B, each judge looks only at the appeals made to them, so Ren sweeps Brutus while Rosa’s Electric Star Point goes unclaimed.</p>
    ${X.awards.map(a=>h`<h4 class="cxh">${a[0]}</h4><p class="sub">${a[1]}</p>${cxTable(['Star Point','Winner'],a[2].map(r=>[r[0],ctB(r[1])]))}`)}
    <h3 class="refg">Final standings</h3>
    <p>Ren and Mae tie on Star Points; total Heart Points breaks the tie, so <b>Ren wins the ribbon</b>. A shared first place is also allowed.</p>
    ${cxTable(['Contestant','Star Points','Total Heart Points'],X.stand.map(r=>[r[0],String(r[1]),String(r[2])]))}
    <h3 class="refg">What this example shows</h3>
    <ul class="reful">${X.lessons.map(l=>h`<li><b>${l[0]}</b> ${l[1]}</li>`)}</ul>
  </div>`;
}

function ctTab(){
  ctWarm();
  const o=S.ui.ct;
  if(!CT_VIEWS.some(v=>v[0]===o.v))o.v='moves';
  const body=o.v==='keys'?ctKeysView():o.v==='help'?ctHelpView():o.v==='how'?ctHowView():o.v==='ex'?ctExView():o.v==='rib'?ribView():ctMovesView();
  return h`<section class="panel ctp"><div class="ph"><h2>Contests</h2>${CT.list?h`<span class="pill">${CT.list.length} moves</span>`:''}</div>
    <div class="seg" role="group" aria-label="Contest pages">${CT_VIEWS.map(([k,l])=>h`<button data-act="ct_view" data-v="${k}" aria-pressed="${String(o.v===k)}">${l}</button>`)}</div>
    <div class="ctbody">${body}</div>
  </section>`;
}

/* typing and choosing in the contest page's boxes. Returns true when it redrew by itself. */
function ctInput(key,t){
  const o=S.ui.ct;
  if(key==='q'){o.page=1;ctRefresh();return true;}
  if(key==='mv'){o.mvt=ctOwnType(o.mv);o.res=null;o.stat='0';ctHelpRefresh();return true;}
  if(key==='monsel'){o.mon=t.value||'';o.stat='0';}
  if(key==='mvsel'){
    const v=String(t.value||''),i=v.indexOf('|');
    if(i>0){o.mon=v.slice(0,i);o.mv=v.slice(i+1);o.mvt=ctOwnType(o.mv);o.stat='0';}
  }
  if(key==='type'||key==='kw'||key==='show')o.page=1;
  o.res=null;
  return false;
}
function ctAct(b){
  const d=b.dataset,o=S.ui.ct;
  switch(d.act){
    case 'ct_view':o.v=d.v;render();break;
    case 'ct_more':o.page++;ctRefresh();break;
    case 'ct_clear':o.q='';o.type='';o.kw='';o.show='all';o.page=1;render();break;
    case 'ct_kw':o.kw=d.k;o.q='';o.type='';o.show='all';o.page=1;o.v='moves';S.ui.toTop=true;render();break;
    case 'ct_use':
      o.mv=d.name||'';o.mvt=d.ct||ctOwnType(d.name);o.res=null;o.v='help';o.stat='0';
      if(d.pid)o.mon=d.pid;
      if(S.tab!=='contest'){setTab('contest');}else{S.ui.toTop=true;render();}
      break;
    case 'ct_restore':o.spent={};o.stat='0';o.res=null;render();break;
    case 'ct_reset':
      Object.assign(o,{ctype:'',volt:'0',elec:false,first:false,last:false,fin:false,low:false,both:false,maxed:false,before:'0',alone:false,allBig:false,lastHp:'2d4',ready:false,same:false,stat:'0',res:null});
      render();break;
    case 'ct_roll':{
      const p=ctPickInfo();
      if(!p.name||!p.type)return;
      const av=ctAvail();
      const c=ctCalc(ctState());
      const r=ctDo(c);
      const det=ctDetail(c,r)+(av&&c.stat?' ('+av.mon.name+'’s '+av.t+', '+(av.left-c.stat)+' left)':'');
      o.res={name:p.name,total:r.total,detail:det};
      logRoll(chkEntry('Appeal: '+p.name+(av?' ('+av.mon.name+')':''),r.total,det));
      if(av&&c.stat>0){
        o.spent=o.spent||{};
        const sp=o.spent[av.mon.id]=o.spent[av.mon.id]||{};
        sp[av.t]=num(sp[av.t])+c.stat;
        o.stat='0';
      }
      render();
      break;}
    default:break;
  }
}

/* ---------- Today: time of day, weather, season, moon, tide and festival week ----------
   One shared set of conditions for the whole party, kept in meta/conditions (everyone can read it, only the GM can change it).
   Every player sees it as a strip under the title, and the screen shows it: sun, rain, snow, fog, storm, night sky and so on.
   Each viewer can switch the screen effects off. The GM's wild encounter tables read the same conditions. */
S.ui.cd=S.ui.cd||{open:false};
const CD_T=[['dawn','Dawn'],['day','Day'],['dusk','Dusk'],['night','Night']];
const CD_X=[['clear','Clear'],['cloudy','Cloudy'],['rain','Rain'],['storm','Storm'],['fog','Fog'],['snow','Snow'],['blizzard','Blizzard'],['windy','Windy']];
const CD_S=[['spring','Spring'],['summer','Summer'],['autumn','Autumn'],['winter','Winter']];
const CD_M=[['new','New moon'],['waxing','Waxing'],['full','Full moon'],['waning','Waning']];
const CD_D=[['high','High tide'],['low','Low tide']];
const CD_LAB={};[CD_T,CD_X,CD_S,CD_M,CD_D].forEach(g=>g.forEach(p=>{CD_LAB[p[0]]=p[1];}));
/* how likely each kind of weather is in each season (Sinnoh is cool and wet, with a long snowy winter in the north) */
const CD_ODDS={
  spring:{clear:30,cloudy:20,rain:28,storm:6,fog:8,windy:8},
  summer:{clear:45,cloudy:15,rain:15,storm:12,fog:5,windy:8},
  autumn:{clear:25,cloudy:25,rain:22,storm:6,fog:14,windy:8},
  winter:{clear:18,cloudy:18,snow:30,blizzard:8,fog:10,rain:8,windy:8}
};
function cdSeasonNow(){const m=new Date().getMonth();return m<2||m===11?'winter':m<5?'spring':m<8?'summer':'autumn';}
const cdOk=(list,v)=>list.some(p=>p[0]===v);
function cdGet(){
  const c=S.cond||{};
  return {
    t:cdOk(CD_T,c.t)?c.t:'day',
    x:cdOk(CD_X,c.x)?c.x:'clear',
    s:cdOk(CD_S,c.s)?c.s:cdSeasonNow(),
    m:cdOk(CD_M,c.m)?c.m:'waxing',
    d:cdOk(CD_D,c.d)?c.d:'high',
    f:c.f===true
  };
}
const cdSig=()=>{const c=cdGet();return [c.t,c.x,c.s,c.m,c.d,c.f?1:0].join('|');};
function cdText(){
  const c=cdGet();
  const bits=[CD_LAB[c.t],CD_LAB[c.x],CD_LAB[c.s]];
  if(c.t==='night')bits.push(CD_LAB[c.m]);
  if(c.d==='low')bits.push('Low tide');
  if(c.f)bits.push('Festival week');
  return bits.join(', ');
}

/* ----- icons ----- */
const CDI_CLOUD='<path d="M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9.5 4.3 4.3 0 0 1 17.5 18z"/>';
const CDI={
  dawn:'<path d="M3 19h18M7 19a5 5 0 0 1 10 0M12 4v5M9.5 6.5L12 4l2.5 2.5M4.6 10.6l1.4 1.4M19.4 10.6L18 12"/>',
  day:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  dusk:'<path d="M3 19h18M7 19a5 5 0 0 1 10 0M12 4v5M9.5 6.5L12 9l2.5-2.5M4.6 10.6l1.4 1.4M19.4 10.6L18 12"/>',
  night:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  clear:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  cloudy:CDI_CLOUD,
  rain:'<g transform="translate(0 -3)">'+CDI_CLOUD+'</g><path d="M8 19l-1 3M12 19l-1 3M16 19l-1 3"/>',
  storm:'<g transform="translate(0 -3)">'+CDI_CLOUD+'</g><path d="M12.5 15l-2.5 4h4l-2.5 4"/>',
  fog:'<path d="M3 7h13M6 11h15M3 15h13M8 19h11"/>',
  snow:'<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>',
  blizzard:'<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="M2 5h5M17 20h5" />',
  windy:'<path d="M3 9h10a3 3 0 1 0-3-3M3 14h14a3 3 0 1 1-3 3M3 19h6"/>',
  spring:'<path d="M12 21V12M12 12c0-4 3-6.5 7.5-6.5 0 4.5-3 6.5-7.5 6.5zM12 16c0-3-2.2-5-6-5 0 3 2.2 5 6 5z"/>',
  summer:'<circle cx="12" cy="12" r="3.5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
  autumn:'<path d="M5 19C5 10 10 5 20 5c0 10-5 15-13 15M5 19L14 10"/>',
  winter:'<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  tide:'<path d="M3 9c3 0 3 2 6 2s3-2 6-2 3 2 6 2M3 15c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/>',
  festival:'<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.4 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/>',
  fx:'<path d="M5 15a4 4 0 0 1-.4-8A6 6 0 0 1 16 8a3.6 3.6 0 0 1 .4 7.2M9 18l-.8 2.5M13 18l-.8 2.5"/>'
};
const cdIcon=k=>raw('<svg class="cdi" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(CDI[k]||'')+'</svg>');

/* ----- the strip under the title ----- */
function cdChip(kind,label,icon){return h`<span class="td-chip" data-kind="${kind}">${cdIcon(icon||kind)}<b>${label}</b></span>`;}
function cdSeg(label,key,list,cur){
  return h`<div class="td-grp"><span class="fl">${label}</span><div class="seg" role="group" aria-label="${label}">${list.map(p=>h`<button data-act="cd_set" data-k="${key}" data-v="${p[0]}" aria-pressed="${String(cur===p[0])}">${p[1]}</button>`)}</div></div>`;
}
function todayHtml(){
  if(S.noDb||!S.ready)return '';
  const c=cdGet(),adm=!!S.me.admin,open=adm&&S.ui.cd.open,fxOn=wxOn();
  return h`<section class="today" aria-label="Today in Sinnoh">
    <div class="td-row">
      <div class="td-chips" role="status" aria-live="polite" aria-label="Conditions now: ${cdText()}">
        ${cdChip('t',CD_LAB[c.t],c.t)}${cdChip('x',CD_LAB[c.x],c.x)}${cdChip('s',CD_LAB[c.s],c.s)}${c.t==='night'?cdChip('m',CD_LAB[c.m],'moon'):''}${c.d==='low'?cdChip('d','Low tide','tide'):''}${c.f?cdChip('f','Festival week','festival'):''}
      </div>
      <div class="td-acts">
        <button class="btn sm ghost" data-act="cd_fx" aria-pressed="${String(fxOn)}" title="Show weather and light effects on the screen">${cdIcon('fx')} Effects: ${fxOn?'on':'off'}</button>
        ${adm?h`<button class="btn sm" data-act="cd_edit" aria-expanded="${String(open)}">${open?'Done':'Change'}</button>`:''}
      </div>
    </div>
    ${open?h`<div class="td-edit">
      ${cdSeg('Time of day','t',CD_T,c.t)}${cdSeg('Weather','x',CD_X,c.x)}${cdSeg('Season','s',CD_S,c.s)}${cdSeg('Moon','m',CD_M,c.m)}${cdSeg('Tide','d',CD_D,c.d)}
      <div class="td-grp"><span class="fl">Quick</span><div class="row"><button class="btn sm" data-act="cd_adv">Next time of day</button><button class="btn sm" data-act="cd_roll">Roll the weather</button><button class="btn sm" data-act="cd_fest" aria-pressed="${String(c.f)}">Festival week: ${c.f?'on':'off'}</button></div></div>
      <p class="sub">Everyone sees this strip and the weather on their screen. Your wild encounter tables use it too, so a rainy night gives different odds than a clear morning.</p>
    </div>`:''}
  </section>`;
}
function renderToday(){
  const el=$('#today');
  if(!el)return;
  const html=todayHtml();
  const s=html===''?'':html.s;
  if(el.dataset.sig===s)return;
  el.dataset.sig=s;
  el.innerHTML=s;
}
function cdWeatherRoll(season){
  const odds=CD_ODDS[season]||CD_ODDS.spring;
  const keys=Object.keys(odds);
  let r=Math.random()*keys.reduce((a,k)=>a+odds[k],0);
  for(const k of keys){if(r<odds[k])return k;r-=odds[k];}
  return 'clear';
}
function cdAct(b){
  if(!S.me.admin&&b.dataset.act!=='cd_fx')return;
  const d=b.dataset;
  switch(d.act){
    case 'cd_fx':wxSetOn(!wxOn());wxSync(true);renderToday();break;
    case 'cd_edit':S.ui.cd.open=!S.ui.cd.open;renderToday();break;
    case 'cd_set':{
      const lists={t:CD_T,x:CD_X,s:CD_S,m:CD_M,d:CD_D};
      if(lists[d.k]&&cdOk(lists[d.k],d.v)){edit('cd','conditions',d.k,d.v);}
      cdChanged();break;}
    case 'cd_adv':{
      const order=CD_T.map(p=>p[0]),cur=cdGet().t;
      edit('cd','conditions','t',order[(order.indexOf(cur)+1)%order.length]);
      cdChanged();break;}
    case 'cd_roll':{
      const c=cdGet();
      edit('cd','conditions','x',cdWeatherRoll(c.s));
      cdChanged();break;}
    case 'cd_fest':edit('cd','conditions','f',!cdGet().f);cdChanged();break;
    default:break;
  }
}
function cdChanged(){
  /* the doc was edited locally; show it at once, then let the rest of the page catch up */
  renderToday();wxSync();
  if(S.tab==='place'||S.tab==='battle')scheduleRender();
}

/* ---------- the screen: tint, sun, stars, moon, rain, snow, fog, wind and lightning ----------
   Everything sits above the page, ignores clicks, and stops when the tab is hidden. With "reduce motion" on, the picture is drawn once and does not move. */
const WX={root:null,cv:null,cx:null,raf:0,last:0,sig:'',W:0,H:0,dpr:1,parts:[],stars:[],blobs:[],flash:0,nextFlash:0,kind:'',c:null,reduced:false};
function wxOn(){try{return localStorage.getItem('stl.fx')!=='off';}catch(e){return true;}}
function wxSetOn(v){try{localStorage.setItem('stl.fx',v?'on':'off');}catch(e){}}
function wxReduce(){try{return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(e){return false;}}
function wxInit(){
  if(WX.root)return true;
  if(!document.body)return false;
  const r=document.createElement('div');
  r.id='wxfx';r.className='wxfx';r.setAttribute('aria-hidden','true');
  r.innerHTML='<div class="wxtint"></div><div class="wxsun"></div><canvas class="wxcv"></canvas>';
  document.body.appendChild(r);
  WX.root=r;WX.cv=r.querySelector('canvas');
  try{WX.cx=WX.cv.getContext('2d');}catch(e){WX.cx=null;}
  window.addEventListener('resize',()=>{WX.sig='';wxSync(true);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)wxStop();else wxSync(true);});
  return true;
}
function wxStop(){if(WX.raf){cancelAnimationFrame(WX.raf);WX.raf=0;}}
function wxSize(){
  const dpr=Math.min(window.devicePixelRatio||1,1.5);
  WX.dpr=dpr;WX.W=window.innerWidth||800;WX.H=window.innerHeight||600;
  WX.cv.width=Math.round(WX.W*dpr);WX.cv.height=Math.round(WX.H*dpr);
  WX.cv.style.width=WX.W+'px';WX.cv.style.height=WX.H+'px';
  if(WX.cx)WX.cx.setTransform(dpr,0,0,dpr,0,0);
}
const rr=(a,b)=>a+Math.random()*(b-a);
function wxBuild(c){
  const area=WX.W*WX.H,x=c.x;
  WX.parts=[];WX.stars=[];WX.blobs=[];
  const mk=(n,f)=>{for(let i=0;i<n;i++)WX.parts.push(f());};
  if(x==='rain'||x==='storm'){
    const heavy=x==='storm';
    mk(clamp(Math.round(area/(heavy?5200:8200)),70,heavy?330:230),()=>({x:rr(-60,WX.W+60),y:rr(0,WX.H),l:rr(11,heavy?26:20),v:rr(heavy?820:640,heavy?1150:900),a:rr(.22,.5)}));
  }else if(x==='snow'){
    mk(clamp(Math.round(area/11000),45,170),()=>({x:rr(0,WX.W),y:rr(0,WX.H),r:rr(1,3),v:rr(35,85),ph:rr(0,6.28),a:rr(.55,.95)}));
  }else if(x==='blizzard'){
    mk(clamp(Math.round(area/4400),130,360),()=>({x:rr(0,WX.W),y:rr(0,WX.H),r:rr(.9,2.4),v:rr(150,280),vx:rr(-520,-330),a:rr(.6,.95)}));
  }else if(x==='windy'){
    mk(26,()=>({x:rr(0,WX.W),y:rr(0,WX.H),l:rr(18,40),v:rr(520,820),vy:rr(30,90),a:rr(.25,.5),h:Math.random()<.5?1:0}));
  }
  if(x==='fog'||x==='cloudy'){
    const n=x==='fog'?6:4;
    for(let i=0;i<n;i++)WX.blobs.push({x:rr(0,WX.W),y:rr(WX.H*.15,WX.H*.95),r:rr(.3,.55)*Math.max(WX.W,WX.H*1.2),v:rr(5,15)*(Math.random()<.5?-1:1),a:x==='fog'?rr(.1,.17):rr(.05,.09)});
  }
  if(c.t==='night'){
    const n=(x==='clear'||x==='windy')?clamp(Math.round(area/9000),50,160):x==='cloudy'?clamp(Math.round(area/26000),12,50):0;
    for(let i=0;i<n;i++)WX.stars.push({x:rr(0,WX.W),y:rr(0,WX.H*.8),r:rr(.4,1.5),ph:rr(0,6.28),a:rr(.35,.95)});
  }
}
function wxMoon(cx,c){
  if(c.t!=='night'||c.x==='storm'||c.x==='blizzard'||c.x==='fog'||c.x==='rain'||c.x==='snow')return;
  const x=WX.W<640?54:86,y=WX.H<500?60:92,R=WX.W<640?15:22,ph=c.m;
  cx.save();
  cx.globalAlpha=c.x==='cloudy'?.5:.9;
  const glow=cx.createRadialGradient(x,y,R*.6,x,y,R*3.2);
  glow.addColorStop(0,ph==='new'?'rgba(150,170,230,.05)':'rgba(220,230,255,.28)');glow.addColorStop(1,'rgba(220,230,255,0)');
  cx.fillStyle=glow;cx.beginPath();cx.arc(x,y,R*3.2,0,6.283);cx.fill();
  if(ph==='full'){
    cx.fillStyle='#F3F1DC';cx.beginPath();cx.arc(x,y,R,0,6.283);cx.fill();
    cx.fillStyle='rgba(180,176,150,.35)';[[-.3,-.2,.22],[.25,.15,.17],[-.05,.38,.12]].forEach(k=>{cx.beginPath();cx.arc(x+k[0]*R,y+k[1]*R,k[2]*R,0,6.283);cx.fill();});
  }else if(ph==='new'){
    cx.strokeStyle='rgba(190,205,245,.55)';cx.lineWidth=1.4;cx.beginPath();cx.arc(x,y,R,0,6.283);cx.stroke();
    cx.fillStyle='rgba(20,28,64,.55)';cx.beginPath();cx.arc(x,y,R-1,0,6.283);cx.fill();
  }else{
    /* a crescent: the lit side is on the right while the moon grows, on the left while it shrinks */
    const dir=ph==='waxing'?1:-1;
    cx.save();
    cx.beginPath();cx.arc(x,y,R,0,6.283);cx.clip();
    cx.fillStyle='#F3F1DC';
    cx.beginPath();cx.rect(x-R,y-R,R*2,R*2);
    cx.moveTo(x-dir*R*.55+R*.95,y);cx.arc(x-dir*R*.55,y,R*.95,0,6.283);
    cx.fill('evenodd');
    cx.restore();
  }
  cx.restore();
}
function wxDraw(dt,ts){
  const cx=WX.cx,c=WX.c;
  if(!cx||!c)return;
  cx.clearRect(0,0,WX.W,WX.H);
  /* stars */
  if(WX.stars.length){
    WX.stars.forEach(s=>{
      const tw=WX.reduced?1:.65+.35*Math.sin(ts/900+s.ph);
      cx.globalAlpha=s.a*tw;cx.fillStyle='#EEF2FF';cx.beginPath();cx.arc(s.x,s.y,s.r,0,6.283);cx.fill();
    });
    cx.globalAlpha=1;
  }
  wxMoon(cx,c);
  /* fog and cloud banks */
  if(WX.blobs.length){
    const night=c.t==='night',col=night?'150,165,205':c.x==='cloudy'?'135,145,165':'236,240,246';
    WX.blobs.forEach(b=>{
      b.x+=b.v*dt;
      if(b.v>0&&b.x-b.r>WX.W)b.x=-b.r;else if(b.v<0&&b.x+b.r<0)b.x=WX.W+b.r;
      const g=cx.createRadialGradient(b.x,b.y,b.r*.1,b.x,b.y,b.r);
      g.addColorStop(0,'rgba('+col+','+b.a+')');g.addColorStop(1,'rgba('+col+',0)');
      cx.fillStyle=g;cx.fillRect(b.x-b.r,b.y-b.r,b.r*2,b.r*2);
    });
  }
  /* rain and storm */
  if(c.x==='rain'||c.x==='storm'){
    const slant=c.x==='storm'?.32:.14;
    cx.lineWidth=c.x==='storm'?1.5:1.2;cx.lineCap='round';
    WX.parts.forEach(p=>{
      p.y+=p.v*dt;p.x-=p.v*slant*dt;
      if(p.y>WX.H+30){p.y=-p.l-rr(0,60);p.x=rr(-40,WX.W+90);}
      if(p.x<-60)p.x+=WX.W+120;
      cx.strokeStyle='rgba('+(c.t==='night'?'170,190,235':'120,150,205')+','+p.a+')';
      cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(p.x+p.l*slant,p.y-p.l);cx.stroke();
    });
    if(c.x==='storm'&&!WX.reduced){
      if(ts>WX.nextFlash){WX.flash=1;WX.nextFlash=ts+rr(4200,10500);}
      if(WX.flash>0){cx.fillStyle='rgba(235,240,255,'+(WX.flash*.42)+')';cx.fillRect(0,0,WX.W,WX.H);WX.flash=Math.max(0,WX.flash-dt*3.4);}
    }
  }
  /* snow */
  if(c.x==='snow'){
    cx.fillStyle='#fff';
    WX.parts.forEach(p=>{
      p.y+=p.v*dt;p.ph+=dt*1.4;p.x+=Math.sin(p.ph)*18*dt;
      if(p.y>WX.H+6){p.y=-6;p.x=rr(0,WX.W);}
      cx.globalAlpha=p.a;cx.beginPath();cx.arc(p.x,p.y,p.r,0,6.283);cx.fill();
    });
    cx.globalAlpha=1;
  }
  if(c.x==='blizzard'){
    cx.fillStyle='#fff';
    WX.parts.forEach(p=>{
      p.y+=p.v*dt;p.x+=p.vx*dt;
      if(p.x<-8){p.x=WX.W+8;p.y=rr(0,WX.H);}
      if(p.y>WX.H+6){p.y=-6;}
      cx.globalAlpha=p.a;cx.beginPath();cx.arc(p.x,p.y,p.r,0,6.283);cx.fill();
    });
    cx.globalAlpha=1;
  }
  /* wind: leaves in autumn, loose petals and blades otherwise */
  if(c.x==='windy'){
    const col=c.s==='autumn'?'196,120,52':c.s==='spring'?'244,176,196':c.s==='winter'?'225,235,245':'170,200,140';
    cx.lineWidth=2.2;cx.lineCap='round';
    WX.parts.forEach(p=>{
      p.x+=p.v*dt;p.y+=p.vy*dt+Math.sin(ts/400+p.x*.01)*.6;
      if(p.x>WX.W+50){p.x=-50;p.y=rr(0,WX.H);}
      if(p.y>WX.H+20)p.y=-20;
      cx.strokeStyle='rgba('+col+','+p.a+')';
      cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(p.x-p.l,p.y-(p.h?3:1));cx.stroke();
    });
  }
}
function wxLoop(ts){
  WX.raf=0;
  if(document.hidden||!WX.root||WX.root.hidden)return;
  const dt=Math.min(.06,Math.max(0,(ts-WX.last)/1000));
  if(ts-WX.last>=WX.gap){WX.last=ts;wxDraw(dt,ts);}
  WX.raf=requestAnimationFrame(wxLoop);
}
/* bring the screen in line with the conditions (cheap when nothing changed) */
function wxSync(force){
  if(!wxInit())return;
  const on=wxOn()&&!S.noDb;
  WX.root.hidden=!on;
  if(!on){wxStop();WX.sig='';return;}
  const red=wxReduce();
  const sig=cdSig()+'|'+red+'|'+(window.innerWidth||0)+'x'+(window.innerHeight||0);
  if(!force&&sig===WX.sig)return;
  WX.sig=sig;WX.reduced=red;
  const c=cdGet();WX.c=c;
  const r=WX.root;
  r.dataset.t=c.t;r.dataset.x=c.x;r.dataset.s=c.s;
  wxStop();
  wxSize();wxBuild(c);
  WX.nextFlash=performance.now()+rr(2500,6000);
  if(!WX.cx)return;
  /* a clear day or a still sky has nothing that moves: draw it once and leave the screen alone */
  const moving=WX.parts.length||WX.blobs.length;
  WX.gap=moving?30:90;
  if(red||!(moving||WX.stars.length)){wxDraw(0,0);return;}
  WX.last=0;WX.raf=requestAnimationFrame(wxLoop);
}
/* ---------- Wild encounters ----------
   A place's GM page can hold a table of the Pokémon that turn up there. The table is kept in the same document as the place's GM notes
   (gm/place_<id>), which only the GM can read, so the players never receive it and nothing here needs a new database rule.
   The odds you see are the odds right now: they follow the shared Today bar (time of day, weather, season, moon, tide, festival week)
   plus the situations the GM switches on by hand (a zone, a flag, a ferry day). Rolling gives a single encounter, a horde sized by the
   place's Danger, a same-species swarm, or a catch while fishing. Some groups have an alpha. Every Pokémon carries the PTA book's
   rarity (for the GM) and a realistic local rarity worked out from its odds right now. */
S.ui.enc=Object.assign({res:{},pick:'',z:{},ed:{},tb:{},mo:{},np:'',df:'',imp:{mode:'add'},wo:{}},S.ui.enc||{});
const ENC_MAX=60;
const ENC_OOR='Out-of-region';
TPL.enc=()=>({sp:'',w:10,lo:1,hi:1,bk:'U'});
const ENC_BK={C:['●','Common'],U:['◆','Uncommon'],R:['★','Rare'],L:['✦','Legendary']};
/* the players whose wishes are tracked. Each has a level on a row (wl, wl2: 1 interested, 2 really wants, 3 wants an alpha), a name on the place's GM page (wln, wln2) and, if you like, a reason (wr, wr2) */
const ENC_WISH=[{l:'wl',n:'wln',r:'wr',d:'A player'},{l:'wl2',n:'wln2',r:'wr2',d:'A second player'}];
const encWishOf=(o,gp)=>{
  const out=[];
  ENC_WISH.forEach((w,i)=>{const lv=Math.round(Number(o&&o[w.l]))||0;if(lv>0)out.push({i,lv:Math.min(3,lv),who:String((gp&&gp[w.n])||w.d),why:String((o&&o[w.r])||'')});});
  return out;
};
const ENC_DIFF=[['easy','Easy',[0,1],'0–1 basic Pokémon per player'],['normal','Normal',[1,2],'1–2 basic or once-evolved per player'],['hard','Hard',[2,3],'2–3 per player, mostly evolved'],['danger','Dangerous',[3,4],'3–4 fully evolved per player']];
const ENC_DG={1:'easy',2:'easy',3:'normal',4:'hard',5:'danger'};
const ENC_HORDE_MAX=12;
const ENC_LEVELS=[['1','Interested'],['2','Really wants'],['3','Wants an alpha']];

/* =========================== the odds (no page code in here) =========================== */
const encKey=s=>String(s==null?'':s).trim().toLowerCase();
/* does a modifier's "when" match the conditions c = {t,x,s,m,d,f}? every part named must match */
function encWhenOk(w,c){
  if(!w)return true;
  const have={t:c.t,x:c.x,s:c.s,m:c.m,d:c.d,f:c.f?'on':'off'};
  return Object.keys(w).every(k=>{const a=w[k];return !Array.isArray(a)||!a.length||a.indexOf(have[k])>=0;});
}
/* a modifier is on when its "when" matches and, for a situation the GM switches on by hand (z), the GM has switched it on */
const encModOn=(m,c,z)=>encWhenOk(m.w,c)&&(!m.z||!!(z&&z[m.id]));
function encEff(T,c,z){
  const rows=(Array.isArray(T.enc)?T.enc:[]).filter(r=>r&&String(r.sp||'').trim());
  let W=[];
  const rowOf=sp=>rows.find(r=>encKey(r.sp)===encKey(sp))||null;
  rows.forEach(r=>{const w=Math.max(0,num(r.w));W.push({k:encKey(r.sp),sp:String(r.sp).trim(),w,b:w,row:r});});
  const eo=Math.max(0,num(T.eo));
  W.push({k:'~oor',sp:ENC_OOR,w:eo,b:eo,oor:1,row:null});
  const get=sp=>encKey(sp)===encKey(ENC_OOR)?W.find(e=>e.oor):W.find(e=>e.k===encKey(sp));
  const ensure=(sp,bk)=>{let e=get(sp);if(!e){e={k:encKey(sp),sp:String(sp).trim(),w:0,b:0,row:rowOf(sp),bk};W.push(e);}return e;};
  const sum=()=>W.reduce((a,e)=>a+e.w,0);
  /* add v to the listed entries together, sharing it out in proportion to their weights */
  const spread=(list,v)=>{
    const tot=list.reduce((a,e)=>a+e.w,0);
    if(!list.length)return;
    list.forEach(e=>{e.w=Math.max(0,e.w+(tot>0?v*e.w/tot:v/list.length));});
  };
  let rt=1,nn=null,only='';
  const fish=[],act=[];
  (Array.isArray(T.em)?T.em:[]).forEach(m=>{
    if(!m||!encModOn(m,c,z))return;
    act.push(m);
    if(m.rt!=null)rt*=Math.max(0,num(m.rt));
    if(Array.isArray(m.nn)&&m.nn.length===2)nn=[num(m.nn[0]),num(m.nn[1])];
    if(Array.isArray(m.fish))fish.push({id:m.id,lb:m.lb,list:m.fish,tx:m.tx||''});
    if(Array.isArray(m.only)){
      W=[];
      m.only.forEach(o=>{
        if(o.s===ENC_OOR)W.push({k:'~oor',sp:ENC_OOR,w:Math.max(0,num(o.w)),b:0,oor:1,row:null});
        else W.push({k:encKey(o.s),sp:String(o.s).trim(),w:Math.max(0,num(o.w)),b:0,row:rowOf(o.s),bk:o.bk});
      });
      only=m.lb||'a special place';
    }
    const fx=Array.isArray(m.fx)?m.fx:[];
    const named=new Set();
    fx.forEach(f=>{if(f.s!=='*')(Array.isArray(f.s)?f.s:[f.s]).forEach(s=>named.add(encKey(s)));});
    const before=sum();
    fx.forEach(f=>{
      const a=f.a,v=num(f.v);
      if(f.s==='*'){
        const tg=W.filter(e=>!e.oor&&!named.has(e.k)&&e.w>0);
        if(a==='+'){if(f.each)tg.forEach(e=>{e.w=Math.max(0,e.w+v);});else spread(tg,v);}
        else if(a==='x')tg.forEach(e=>{e.w=e.w*v;});
        return;
      }
      const names=Array.isArray(f.s)?f.s:[f.s];
      if(a==='>'){
        const to=Array.isArray(f.to)?f.to:[];
        if(!to.length)return;
        names.forEach(n=>{
          const e=get(n);
          if(!e||e.w<=0)return;
          const tot=e.w;e.w=0;
          to.forEach(t=>{ensure(t).w+=tot/to.length;});
        });
        return;
      }
      if(a==='+'&&f.cb){spread(names.map(get).filter(Boolean),v);return;}
      names.forEach(n=>{
        let e=get(n);
        if(a==='+'){if(!e&&v>0)e=ensure(n);if(e)e.w=Math.max(0,e.w+v);}
        else if(a==='='){if(!e&&v>0)e=ensure(n);if(e)e.w=Math.max(0,v);}
        else if(a==='x'){if(e)e.w=e.w*v;}
      });
    });
    /* "taking from": whatever this modifier added or removed overall is paid for by (or handed to) the named species */
    if(Array.isArray(m.tk)&&m.tk.length){
      const delta=sum()-before;
      const tg=m.tk.map(get).filter(Boolean);
      const tot=tg.reduce((a,e)=>a+e.w,0);
      if(tg.length&&Math.abs(delta)>1e-9){
        if(delta>0){const take=Math.min(delta,tot);tg.forEach(e=>{e.w=Math.max(0,e.w-(tot>0?take*e.w/tot:0));});}
        else tg.forEach(e=>{e.w+=tot>0?(-delta)*e.w/tot:(-delta)/tg.length;});
      }
    }
  });
  const total=sum();
  const baseTotal=rows.reduce((a,r)=>a+Math.max(0,num(r.w)),0)+eo;
  W.forEach(e=>{e.p=total>0?e.w/total*100:0;e.bp=baseTotal>0?e.b/baseTotal*100:0;});
  return {W,total,rt,nn,fish,act,only};
}
function encPickW(list){
  const tot=list.reduce((a,e)=>a+e.w,0);
  if(tot<=0)return null;
  let r=Math.random()*tot,last=null;
  for(let i=0;i<list.length;i++){
    if(list[i].w<=0)continue;
    last=list[i];
    if(r<list[i].w)return list[i];
    r-=list[i].w;
  }
  return last;
}
const encRand=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const encGrp=r=>{const lo=clamp(Math.round(num(r&&r.lo))||1,1,8);const hi=clamp(Math.round(num(r&&r.hi))||lo,lo,8);return encRand(lo,hi);};
/* what a table's Danger asks for: easy, normal, hard or danger */
const encDiffOf=T=>ENC_DG[clamp(Math.round(num(T.dg))||1,1,5)]||'easy';
/* how many wild Pokémon a horde is: the GM Guide's range per player, for each player */
function encHordeN(diff,players){
  const d=ENC_DIFF.find(x=>x[0]===diff)||ENC_DIFF[1];
  let n=0;
  for(let i=0;i<Math.max(1,players);i++)n+=encRand(d[2][0],d[2][1]);
  return clamp(n,1,ENC_HORDE_MAX);
}
function encVisitor(T){
  const ev=Array.isArray(T.ev)?T.ev.filter(v=>v&&v.sp):[];
  if(!ev.length)return null;
  const die=T.evd==='d8'?8:6;
  const roll=encRand(1,die);
  const v=ev[(roll-1)%ev.length];
  return {sp:v.sp,o:v.o||'',y:v.y||'',roll,die,wl:num(v.wl),wl2:num(v.wl2),wr:v.wr||'',wr2:v.wr2||''};
}
/* how common something is here, in plain words, from its chance among everything that turns up right now */
const encPct=p=>p>=5?Math.round(p):Math.round(p*10)/10;
function encLocal(p){return p>=15?'Abundant':p>=8?'Common':p>=4?'Uncommon':p>=2?'Rare':p>0?'Very rare':'Not around now';}
/* the "no encounter" gates: a reduced rate (rt) and a d6 range of nothing (nn) */
function encGate(E){
  if(E.rt<=0)return 'No random encounters in these conditions.';
  if(E.rt<1&&Math.random()>=E.rt)return 'Quiet. At '+Math.round(E.rt*100)+'% of the usual rate, nothing stirs this time.';
  if(E.nn){
    const d=encRand(1,6);
    if(d>=E.nn[0]&&d<=E.nn[1])return 'd6 → '+d+'. The place is still: nothing at all turns up.';
  }
  return '';
}
function encLine(T,e,n,E,alphaOk){
  const r=e.row||{};
  const L={sp:e.sp,n,a:0,p:Math.round(e.p*10)/10,bk:r.bk||e.bk||'',wl:num(r.wl),wl2:num(r.wl2),wr:r.wr||'',wr2:r.wr2||'',so:r.so?1:0,al:num(r.al)};
  if(alphaOk&&num(r.al)>0&&Math.random()*100<num(r.al))L.a=1;
  return L;
}
const encMerge=(lines,L)=>{
  const o=lines.find(x=>x.sp===L.sp&&!x.vi&&!L.vi&&x.a===L.a);
  if(o)o.n+=L.n;else lines.push(L);
};
/* one roll. mode: enc (a group), horde, swarm, or fish (with the fishing modifier's id). Returns {lines, none, why, ...} */
function encRollT(T,c,z,o){
  o=o||{};
  const E=encEff(T,c,z);
  const out={kind:o.mode||'enc',lines:[],none:false,why:'',E:{rt:E.rt,nn:E.nn,only:E.only}};
  const mode=out.kind;
  if(mode==='fish'){
    const f=E.fish.find(x=>x.id===o.fid);
    if(!f||!f.list.length){out.none=true;out.why=f&&f.tx?f.tx:'Nothing to catch here.';return out;}
    const L=f.list.map(x=>({sp:x.s,w:Math.max(0,num(x.w)),oor:x.s===ENC_OOR,bk:x.bk,k:encKey(x.s),row:null}));
    const tot=L.reduce((a,x)=>a+x.w,0);
    const pick=encPickW(L);
    if(!pick){out.none=true;out.why='Nothing bites.';return out;}
    out.fishLb=f.lb;
    if(pick.oor){
      const v=encVisitor(T);
      if(!v){out.none=true;out.why='Nothing bites.';return out;}
      out.lines.push({sp:v.sp,n:1,a:0,p:Math.round(pick.w/tot*1000)/10,bk:'',wl:v.wl,wl2:v.wl2,wr:v.wr,wr2:v.wr2,vi:v});
    }else{
      const r=(T.enc||[]).find(x=>encKey(x.sp)===pick.k)||{};
      out.lines.push({sp:pick.sp,n:1,a:0,p:Math.round(pick.w/tot*1000)/10,bk:pick.bk||r.bk||'',wl:num(r.wl),wl2:num(r.wl2),wr:r.wr||'',wr2:r.wr2||'',so:0,al:0});
    }
    return out;
  }
  const gate=encGate(E);
  if(gate){out.none=true;out.why=gate;return out;}
  const pool=E.W.filter(e=>e.w>0);
  if(!pool.length){out.none=true;out.why='This table has nothing in it to roll.';return out;}
  if(mode==='swarm'){
    const sw=pool.filter(e=>e.row&&e.row.sw&&!e.oor);
    const e=encPickW(sw);
    if(!e){out.none=true;out.why='Nothing here comes in swarms.';return out;}
    const L=encLine(T,e,encRand(3,6),E,true);
    out.lines.push(L);
    return out;
  }
  const visit=e=>{
    const v=encVisitor(T);
    if(!v)return null;
    return {sp:v.sp,n:1,a:0,p:Math.round(e.p*10)/10,bk:'',wl:v.wl,wl2:v.wl2,wr:v.wr,wr2:v.wr2,vi:v};
  };
  if(mode==='horde'){
    const N=o.n||1;
    let got=0,guard=0,alphaDone=false;
    while(got<N&&guard++<60){
      const e=encPickW(pool);
      if(!e)break;
      let L;
      if(e.oor){L=visit(e);if(!L)continue;}
      else{
        const n=Math.min(encGrp(e.row),N-got);
        L=encLine(T,e,n,E,!alphaDone);
        if(L.a)alphaDone=true;
      }
      got+=L.n;
      encMerge(out.lines,L);
    }
    out.n=got;
    return out;
  }
  const e=encPickW(pool);
  if(e.oor){
    const L=visit(e);
    if(!L){out.none=true;out.why='A stranger might have passed through, but nothing the table names.';return out;}
    out.lines.push(L);
    return out;
  }
  out.lines.push(encLine(T,e,encGrp(e.row),E,true));
  return out;
}
/* parsing and writing a modifier's effects as plain lines, for the editor.
   Pikachu +8 · Pikachu =10 · Pikachu x2 · Pikachu > Raichu, Raichu, Pichu · Swinub / Snover -15 (shared) · * -33 (shared by the rest) · * each -2 */
function encFxParse(text){
  const out=[],bad=[];
  String(text||'').split(/\n/).forEach(raw0=>{
    let s=raw0.trim();
    if(!s)return;
    let m;
    if((m=s.match(/^(.+?)\s+>\s+(.+)$/))){
      const src=m[1].split(/\s*\/\s*/).map(x=>x.trim()).filter(Boolean);
      out.push({s:src.length>1?src:src[0],a:'>',to:m[2].split(',').map(x=>x.trim()).filter(Boolean)});
      return;
    }
    m=s.match(/^(.+?)\s*(=|x|\+|-)\s*(\d+(?:\.\d+)?)\s*$/i);
    if(!m){bad.push(s);return;}
    let names=m[1].trim(),each=false;
    if(/^\*\s+each$/i.test(names)){names='*';each=true;}
    const op=m[2].toLowerCase();
    let v=Number(m[3]);
    let a=op==='x'?'x':op==='='?'=':'+';
    if(op==='-')v=-v;
    const list=names.split(/\s*\/\s*/).map(x=>x.trim()).filter(Boolean);
    const f={s:list.length>1?list:list[0],a,v};
    if(list.length>1&&a==='+')f.cb=1;
    if(each)f.each=1;
    out.push(f);
  });
  return {fx:out,bad};
}
function encFxText(fx){
  return (fx||[]).map(f=>{
    const nm=Array.isArray(f.s)?f.s.join(' / '):f.s;
    if(f.a==='>')return nm+' > '+(f.to||[]).join(', ');
    if(f.a==='=')return nm+' ='+f.v;
    if(f.a==='x')return nm+' x'+f.v;
    return (f.s==='*'&&f.each?'* each':nm)+' '+(num(f.v)<0?'-':'+')+Math.abs(num(f.v));
  }).join('\n');
}
/* bringing the wishes of a newer file into a table the GM already has. Only wishes move: a wished Pokémon is added if the table lacks it,
   and the wish and its reason are set where the GM has none. Weights, notes and everything else the GM set are left alone. */
const ENC_WISHKEYS=['wl','wl2','wr','wr2'];
const encWished=r=>!!r&&(num(r.wl)>0||num(r.wl2)>0);
function encMergeList(curList,incList,add){
  const out=(Array.isArray(curList)?curList:[]).map(r=>Object.assign({},r));
  let added=0,marked=0;
  (Array.isArray(incList)?incList:[]).forEach(n=>{
    if(!n||!String(n.sp||'').trim()||!encWished(n))return;
    const o=out.find(r=>encKey(r.sp)===encKey(n.sp));
    if(o){
      ENC_WISHKEYS.forEach(f=>{if(n[f]!==undefined&&(o[f]===undefined||o[f]===null||o[f]==='')){o[f]=n[f];if(f==='wl'||f==='wl2')marked++;}});
    }else if(add&&out.length<ENC_MAX){
      out.push(Object.assign({},n));added++;
      marked+=(num(n.wl)>0?1:0)+(num(n.wl2)>0?1:0);
    }
  });
  return {list:out,added,marked};
}
/* returns {patch, added, marked, changed}; patch holds only the fields that changed, ready for a merge-write */
function encMergeDoc(cur,inc,names){
  cur=cur||{};inc=inc||{};names=names||{};
  const patch={};let added=0,marked=0;
  const m=encMergeList(cur.enc,inc.enc,true);
  const v=Array.isArray(cur.ev)?encMergeList(cur.ev,inc.ev,false):null;
  if(m.added||m.marked||(v&&v.marked)){
    patch.enc=m.list;added+=m.added;marked+=m.marked;
    if(v&&v.marked){patch.ev=v.list;marked+=v.marked;}
  }
  if(Array.isArray(cur.ex)&&Array.isArray(inc.ex)){
    let hit=false;
    const ex=cur.ex.map(e=>{
      const n=inc.ex.find(x=>x&&e&&x.nm===e.nm);
      if(!n||!e)return e;
      const a=encMergeList(e.enc,n.enc,true),b=Array.isArray(e.ev)?encMergeList(e.ev,n.ev,false):null;
      if(!(a.added||a.marked||(b&&b.marked)))return e;
      hit=true;added+=a.added;marked+=a.marked+(b?b.marked:0);
      return Object.assign({},e,{enc:a.list},b&&b.marked?{ev:b.list}:{});
    });
    if(hit)patch.ex=ex;
  }
  const touched=Object.keys(patch).length>0;
  if(touched||added||marked){
    if(names.wln&&!cur.wln)patch.wln=String(names.wln);
    if(names.wln2&&!cur.wln2)patch.wln2=String(names.wln2);
  }
  return {patch,added,marked,changed:touched};
}
/* =========================== end of the odds =========================== */

const encGp=pid=>S.gmPl[pid]||{};
/* a place's tables: the main one, then any extra ones (a landmark inside the same page) */
function encTabs(pid){
  const g=encGp(pid);
  const out=[{k:0,nm:'',pre:'',T:g}];
  (Array.isArray(g.ex)?g.ex:[]).forEach((e,i)=>out.push({k:i+1,nm:(e&&e.nm)||'Another table',pre:'ex.'+i+'.',T:e||{}}));
  return out;
}
const encTab=(pid,k)=>{const t=encTabs(pid);return t[k!=null&&t[k]?k:(S.ui.enc.tb[pid]||0)]||t[0];};
const encRows=T=>Array.isArray(T.enc)?T.enc:[];
const encOk=x=>!!(x&&String(x.sp||'').trim()&&num(x.w)>0);
const encValid=pid=>encRows(encGp(pid)).filter(encOk);
const encTotal=rows=>rows.reduce((a,x)=>a+num(x.w),0);
/* the places with something to roll, each table as its own entry */
function encPlaces(){
  const out=[];
  Object.keys(S.gmPl||{}).forEach(id=>{
    const f=PD_BY[id];
    if(!f)return;
    encTabs(id).forEach(t=>{if(encRows(t.T).some(encOk))out.push({v:id+(t.k?'#'+t.k:''),id,k:t.k,name:f.name+(t.k?' · '+t.nm:'')});});
  });
  return out.sort(natural);
}
const encRef=v=>{const p=String(v||'').split('#');return {id:p[0],k:p[1]?+p[1]:0};};
const encZ=(pid,k)=>{const key=pid+'|'+k;return S.ui.enc.z[key]||(S.ui.enc.z[key]={});};
const encPlayers=()=>clamp(Math.round(num(S.ui.enc.np))||tids().length||1,1,8);
const encDiffNow=T=>{const d=S.ui.enc.df;return ENC_DIFF.some(x=>x[0]===d)?d:encDiffOf(T);};

function encRollRef(pid,k,mode,fid){
  const t=encTab(pid,k);
  const T=t.T;
  const o={mode,fid};
  if(mode==='horde')o.n=encHordeN(encDiffNow(T),encPlayers());
  const r=encRollT(T,cdGet(),encZ(pid,t.k),o);
  r.pid=pid;r.k=t.k;r.cond=cdText();
  if(mode==='horde'){r.diff=encDiffNow(T);r.players=encPlayers();r.want=o.n;}
  return r;
}

/* ----- adding what turned up to the battle ----- */
const encKindWord={enc:'encounter',horde:'horde',swarm:'swarm',fish:'catch'};
async function encToBattle(pid,res){
  if(!S.me.admin||!res||res.none)return;
  const f=PD_BY[pid];
  const where=(f?f.name:'a place')+(res.k?' · '+encTab(pid,res.k).nm:'');
  for(const L of res.lines){
    const note='Wild '+(encKindWord[res.kind]||'encounter')+' at '+where+(L.vi?' (visitor'+(L.vi.o?' from '+L.vi.o:'')+')':'')+(L.a?' · ALPHA':'');
    if(L.n-L.a>0)await btAddFoeSp(L.sp,L.n-L.a,'',note);
    if(L.a)await btAddFoeSp(L.sp,1,'',note,{alpha:true});
  }
  render();
}

/* ----- the panel on a place's page ----- */
const encMd=s=>raw(esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>'));
const encBk=bk=>ENC_BK[bk]?h`<span class="pill encbk" title="Rarity in the PTA books (GM only)">${ENC_BK[bk][0]} ${ENC_BK[bk][1]}</span>`:'';
const encWlText=(gp,w,i)=>{const k=ENC_WISH[i||0];const who=(gp&&gp[k.n])||k.d;return w===3?who+' wants an alpha':w===2?who+' really wants this':who+' is interested';};
/* the wish pills for a row, a visitor or a result line; with the reasons if asked */
const encWishPills=(gp,o,why)=>encWishOf(o,gp).map(x=>h` <span class="pill encwl w${x.lv} p${x.i+1}" ${why||!x.why?'':raw('title="'+esc(x.why)+'"')}>${encWlText(gp,x.lv,x.i)}</span>${why&&x.why?h` <span class="sub">${x.why}</span>`:''}`);
function encNeeds(w){
  if(!w)return '';
  const bits=[];
  ['t','x','s','m','d','f'].forEach(k=>{
    const a=w[k];
    if(!Array.isArray(a)||!a.length)return;
    bits.push(a.map(v=>k==='f'?(v==='on'?'Festival week':'Not festival week'):(CD_LAB[v]||v)).join(' or '));
  });
  return bits.join(' + ');
}
function encResult(pid,r){
  const f=PD_BY[pid],gp=encGp(pid);
  if(r.none)return h`<div class="ctres encres" role="status" aria-live="polite"><span class="k">NOTHING</span><div class="big">Nothing turns up</div><div class="sub">${r.why}</div><div class="sub">${r.cond}</div>
    <div class="row"><button class="btn sm" data-act="en_roll" data-id="${pid}" data-k="${r.k}" data-m="${r.kind}" data-f="${r.fid||''}">Roll again</button></div></div>`;
  const lead=r.lines[0];
  const title=r.lines.map(L=>(L.a?'Alpha ':'')+L.sp+(L.n>1?' ×'+L.n:'')).join(', ');
  const diff=r.kind==='horde'?ENC_DIFF.find(x=>x[0]===r.diff):null;
  return h`<div class="ctres encres" role="status" aria-live="polite"><span class="k">${(encKindWord[r.kind]||'encounter').toUpperCase()}${r.fishLb?' · '+r.fishLb.toUpperCase():''}</span>
    <div class="big">${title}</div>
    ${r.lines.map(L=>h`<div class="encline">${L.a?h`<span class="pill encal">ALPHA</span> `:''}<b>${L.sp}</b>${L.n>1?' ×'+L.n:''}
      ${L.vi?h`<span class="sub">Out-of-region visitor${L.vi.o?' from '+L.vi.o:''} (d${L.vi.die} → ${L.vi.roll}). ${L.vi.y}</span>${encWishPills(gp,L,true)}`
        :h`<span class="sub">${encPct(L.p)}% here · ${encLocal(L.p)}</span> ${encBk(L.bk)}${L.so?h` <span class="pill">herd or pack</span>`:''}${encWishPills(gp,L,true)}`}</div>`)}
    ${r.kind==='horde'?h`<div class="sub">A horde for ${r.players} ${r.players===1?'player':'players'} on ${diff?diff[1]:'Normal'}: ${diff?diff[3]:''} (${r.want} wanted${r.n!==r.want?', '+r.n+' rolled':''}).</div>`:''}
    ${r.kind==='swarm'?h`<div class="sub">A swarm of one kind. 3–6 of them.</div>`:''}
    <div class="sub">${r.cond}${r.E&&r.E.only?' · '+r.E.only:''}</div>
    ${lead&&lead.a?h`<div class="sub">Alpha: HP doubled, +5 Attack and Special Attack, the better defense raised to 15, and the Alpha Aura moves are added when it joins the battle. It can lead the others.</div>`:''}
    <div class="row"><button class="btn primary sm" data-act="en_tobattle" data-id="${pid}">Add to the battle</button>
      <button class="btn sm" data-act="en_roll" data-id="${pid}" data-k="${r.k}" data-m="${r.kind}" data-f="${r.fid||''}">Roll again</button>
      ${lead&&!lead.vi?h`<button class="btn sm ghost" data-act="en_alpha" data-id="${pid}">${lead.a?'Make it a normal one':'Make one an alpha'}</button>`:''}</div></div>`;
}
function encRowView(gp,e,sorted){
  const r=e.row||{};
  const bk=r.bk||e.bk||'';
  return h`<li class="encr ${e.p<=0?'zero':''}">
    <span class="encn"><b>${e.sp}</b>${r.so?h` <span class="pill">herd or pack</span>`:''}${r.sw?h` <span class="pill">swarms</span>`:''}${num(r.al)>0?h` <span class="pill encal" title="Chance that a group of these has an alpha">alpha ${num(r.al)}%</span>`:''}${encWishPills(gp,r)}</span>
    <span class="encp" style="--p:${Math.min(100,Math.round(e.p))}%"><b>${encPct(e.p)}%</b> now${Math.abs(e.p-e.bp)>=0.5?h` <small>(${encPct(e.bp)}% usually)</small>`:''}</span>
    <span class="encl">${encLocal(e.p)}</span>
    ${encBk(bk)}
    <span class="sub encg">${num(r.lo)||1}${num(r.hi)>num(r.lo)?'–'+num(r.hi):''} at a time${r.n?' · '+r.n:''}</span>
  </li>`;
}
function encEditRow(pid,pre,gp,T,x,i,len){
  const p=pre+'enc.'+i+'.';
  return h`<div class="encrow ${String(x.sp||'').trim()?'':'off'}">
    ${fText('Pokémon','gp',pid,p+'sp',gp,{list:'dl-species',cls:'c-sp'})}
    ${fNum('Weight','gp',pid,p+'w',gp,{min:0,max:1000})}
    ${fNum('Min','gp',pid,p+'lo',gp,{min:1,max:8})}
    ${fNum('Max','gp',pid,p+'hi',gp,{min:1,max:8})}
    ${fNum('Alpha %','gp',pid,p+'al',gp,{min:0,max:100})}
    ${fSel('Book rarity','gp',pid,p+'bk',gp,[['C','● Common'],['U','◆ Uncommon'],['R','★ Rare']],{blank:'Not set'})}
    ${fSel(gp.wln2?'Wanted by '+(gp.wln||'player 1'):'Wanted','gp',pid,p+'wl',gp,ENC_LEVELS,{blank:'No'})}
    ${fSel('Wanted by '+(gp.wln2||'player 2'),'gp',pid,p+'wl2',gp,ENC_LEVELS,{blank:'No'})}
    ${num(x.wl)>0?fText('Why '+(gp.wln||'player 1')+' wants it','gp',pid,p+'wr',gp,{cls:'c-nt'}):''}${num(x.wl2)>0?fText('Why '+(gp.wln2||'player 2')+' wants it','gp',pid,p+'wr2',gp,{cls:'c-nt'}):''}
    <div class="fld"><span class="fl">Groups</span><span class="row">${fCheck('Herd','gp',pid,p+'so',gp)}${fCheck('Swarm','gp',pid,p+'sw',gp)}</span></div>
    ${fText('Note','gp',pid,p+'n',gp,{cls:'c-nt'})}
    ${rowBtns('gp',pid,pre+'enc',i,len,false)}</div>`;
}
function encModEditor(pid,pre,gp,T,m,i,len){
  const p=pre+'em.'+i+'.';
  const w=m.w||{};
  const groups=[['t','Time',CD_T],['x','Weather',CD_X],['s','Season',CD_S],['m','Moon',CD_M],['d','Tide',CD_D],['f','Festival',[['on','Festival week'],['off','Not festival week']]]];
  const key=pid+'|'+pre+'|'+i;
  const open=!!S.ui.enc.mo[key];
  const head=h`<button class="encsum" data-act="en_mo" data-key="${key}" aria-expanded="${String(open)}"><b>${m.lb||'New situation'}</b> <span class="sub">${m.z?'switched on by hand':'automatic'}${encNeeds(m.w)?' · '+encNeeds(m.w):''}</span></button>`;
  if(!open)return h`<div class="encmod">${head}</div>`;
  return h`<div class="encmod">${head}
    <div class="fgrid">${fText('Name','gp',pid,p+'lb',gp,{})}${fCheck('Switch on by hand (a situation, like a zone)','gp',pid,p+'z',gp)}
      ${fNum('Encounter rate ×','gp',pid,p+'rt',gp,{min:0,max:1})}</div>
    ${groups.map(g=>h`<div class="fld"><span class="fl">${g[1]}</span><div class="row evchips">${g[2].map(op=>h`<button class="chip enchip" data-act="en_wh" data-id="${pid}" data-pre="${pre}" data-i="${i}" data-w="${g[0]}" data-v="${op[0]}" aria-pressed="${String((w[g[0]]||[]).indexOf(op[0])>=0)}">${op[1]}</button>`)}</div></div>`)}
    <p class="sub">Leave a group empty to match anything. Everything named must match at once.</p>
    <label class="fld"><span class="fl">What it changes (one per line)</span><textarea data-encfx="${esc(pid+'|'+pre+'|'+i)}" rows="4" data-nr>${raw('\n')}${encFxText(m.fx)}</textarea></label>
    <p class="sub">Examples: <code>Pikachu +8</code> · <code>Pikachu =10</code> · <code>Pikachu x2</code> · <code>Pikachu &gt; Raichu, Pichu</code> (becomes) · <code>Swinub / Snover -15</code> (shared) · <code>* -10</code> (shared by the rest) · <code>* each -2</code>.</p>
    <label class="fld"><span class="fl">Taking from (species names, comma separated)</span><input type="text" data-encl="${esc(pid+'|'+pre+'|'+i+'|tk')}" value="${(m.tk||[]).join(', ')}" data-nr></label>
    ${fArea('Note for you','gp',pid,p+'tx',gp,{rows:2})}
    ${(m.fish||m.only)?h`<p class="sub">This one also carries a fixed list of ${m.only?'what lives there':'what bites'} that came with the encounter data.</p>`:''}
    <div class="row"><button class="btn sm danger" data-act="del" ${bp('gp',pid,pre+'em')} data-i="${i}">Delete this</button>${rowBtns('gp',pid,pre+'em',i,len,false)}</div>
  </div>`;
}
function encPanel(f){
  const pid=f.id,gp=encGp(pid);
  const tabs=encTabs(pid);
  const t=encTab(pid);
  const T=t.T,pre=t.pre;
  const rows=encRows(T);
  const c=cdGet();
  const z=encZ(pid,t.k);
  const E=encEff(T,c,z);
  const res=S.ui.enc.res[pid];
  const ed=!!S.ui.enc.ed[pid];
  const mods=Array.isArray(T.em)?T.em:[];
  const chips=mods.filter(m=>m.z);
  const autos=mods.filter(m=>!m.z);
  const autoOn=autos.filter(m=>encWhenOk(m.w,c));
  const autoOff=autos.filter(m=>!encWhenOk(m.w,c));
  const shown=E.W.filter(e=>e.sp&&(e.w>0||e.b>0)&&!e.oor).sort((a,b)=>b.p-a.p||b.bp-a.bp);
  const oor=E.W.find(e=>e.oor);
  const diff=encDiffNow(T);
  const dd=ENC_DIFF.find(x=>x[0]===diff)||ENC_DIFF[1];
  const hasSw=E.W.some(e=>e.w>0&&e.row&&e.row.sw&&!e.oor);
  const used=!!T.eoUsed;
  return h`<section class="panel encp"><div class="ph"><h2>Wild encounters</h2><span class="pill gm">GM only</span>
      <span class="pill" title="How dangerous this place is. It sets the size of a horde.">Danger ${Math.round(num(T.dg))||1} · ${ENC_DIFF.find(x=>x[0]===encDiffOf(T))[1]}</span>
      ${T.dr?h`<span class="pill status">Draft: check it</span>`:''}
      <div class="acts"><button class="btn sm ${ed?'primary':''}" data-act="en_edit" data-id="${pid}" aria-pressed="${String(ed)}">${ed?'Done editing':'Edit table'}</button></div></div>
    ${tabs.length>1?h`<div class="seg" role="group" aria-label="Table">${tabs.map(x=>h`<button data-act="en_tab" data-id="${pid}" data-k="${x.k}" aria-pressed="${String(x.k===t.k)}">${x.k?x.nm:f.name}</button>`)}</div>`:''}
    ${T.dr?h`<p class="sub bad">This table was drafted from the nearest places${Array.isArray(T.nb)&&T.nb.length?' ('+T.nb.join(', ')+')':''} because the notes had no list for it. Read it over and change what does not fit.</p>`:''}
    <p class="sub encnow"><b>Right now:</b> ${cdText()}. The chances below use the conditions on the Today bar${chips.length?' and the situations you switch on':''}.</p>
    ${chips.length?h`<div class="fld"><span class="fl">Situations here</span><div class="row evchips">${chips.map(m=>{
      const on=!!z[m.id],ok=encWhenOk(m.w,c);
      return h`<button class="chip enchip" data-act="en_zone" data-id="${pid}" data-k="${t.k}" data-m="${m.id}" aria-pressed="${String(on)}" title="${m.tx||''}">${m.lb}${on&&!ok?h` <small>(waits for ${encNeeds(m.w)})</small>`:(!on&&encNeeds(m.w)?h` <small>(${encNeeds(m.w)})</small>`:'')}</button>`;})}</div></div>`:''}
    ${E.act.length?h`<div class="encfx"><span class="fl">In effect now</span><ul class="mini-list">${E.act.map(m=>h`<li><b>${m.lb}</b>${m.tx?h` <span class="sub">${encMd(m.tx)}</span>`:''}${m.nt?h` <span class="sub">${m.nt}</span>`:''}</li>`)}</ul>
      ${E.rt<1?h`<p class="sub">Encounter rate ${E.rt<=0?'none':'×'+Math.round(E.rt*100)/100}.</p>`:''}${E.nn?h`<p class="sub">On a d6 of ${E.nn[0]}–${E.nn[1]}, nothing happens.</p>`:''}</div>`:''}
    ${autoOff.length?h`<details class="encoff"><summary>${autoOff.length} other ${autoOff.length===1?'condition':'conditions'} change this table</summary><ul class="mini-list">${autoOff.map(m=>h`<li><b>${m.lb}</b> <span class="sub">needs ${encNeeds(m.w)||'a switch'}${m.tx?' · '+m.tx.replace(/\*\*/g,''):''}</span></li>`)}</ul></details>`:''}
    ${shown.length?h`<ul class="enclist2" aria-label="What can turn up now">${shown.map(e=>encRowView(gp,e))}</ul>`:h`<p class="sub">Nothing here yet. Add the Pokémon that live in this place.</p>`}
    ${oor&&oor.w>0?h`<p class="sub">${encPct(oor.p)}% of the time it is a visitor from another region. Roll ${T.evd==='d8'?'d8':'d6'} on the visitor list (${(T.ev||[]).length} listed).</p>`:''}
    ${(Array.isArray(T.ev)&&T.ev.length)?h`<details class="encoff"><summary>Visitors from other regions</summary><ol class="mini-list">${T.ev.map(v=>h`<li><b>${v.sp}</b> <span class="sub">${v.o?'('+v.o+') ':''}${v.y||''}</span>${encWishPills(gp,v,true)}</li>`)}</ol></details>`:''}
    ${T.eon?h`<div class="mgd encone"><b>Once per campaign</b> ${used?h`<span class="pill">Used</span>`:''}<p class="sub">${encMd(T.eon)}</p><div class="row"><button class="btn sm" data-act="en_used" data-id="${pid}" data-k="${t.k}">${used?'Mark as not used':'Mark as used'}</button></div></div>`:''}
    <div class="fgrid encroll">
      <label class="fld"><span class="fl">Players</span><input type="number" min="1" max="8" data-u="enc.np" value="${S.ui.enc.np===''?'':encPlayers()}" placeholder="${tids().length||1}" data-nr></label>
      <label class="fld"><span class="fl">Horde difficulty</span><select data-u="enc.df"><option value="" ${S.ui.enc.df?'':raw('selected')}>From Danger (${ENC_DIFF.find(x=>x[0]===encDiffOf(T))[1]})</option>${ENC_DIFF.map(x=>h`<option value="${x[0]}" ${S.ui.enc.df===x[0]?raw('selected'):''}>${x[1]}</option>`)}</select></label>
    </div>
    <p class="sub">A horde for ${encPlayers()} ${encPlayers()===1?'player':'players'} on ${dd[1]} is ${dd[2][0]*encPlayers()}–${Math.min(ENC_HORDE_MAX,dd[2][1]*encPlayers())} wild Pokémon (${dd[3]}).</p>
    <div class="row"><button class="btn primary sm" data-act="en_roll" data-id="${pid}" data-k="${t.k}" data-m="enc" ${shown.length?'':raw('disabled')}>Roll an encounter</button>
      <button class="btn sm" data-act="en_roll" data-id="${pid}" data-k="${t.k}" data-m="horde" ${shown.length?'':raw('disabled')}>Roll a horde</button>
      <button class="btn sm" data-act="en_roll" data-id="${pid}" data-k="${t.k}" data-m="swarm" ${hasSw?'':raw('disabled')}>Roll a swarm</button>
      ${E.fish.map(fm=>h`<button class="btn sm" data-act="en_roll" data-id="${pid}" data-k="${t.k}" data-m="fish" data-f="${fm.id}">Cast a line · ${fm.lb}</button>`)}</div>
    ${res?encResult(pid,res):''}
    ${ed?h`<div class="enced"><h3>Edit this table</h3>
      <p class="sub">A weight of 30 out of a total of about 100 is a 30% chance. A weight of 0 means it only turns up when a condition adds it. Min and Max say how many come at once. Alpha % is the chance that a group has an alpha. The players never see any of this.</p>
      <div class="fgrid">${fNum('Danger (1–5)','gp',pid,pre+'dg',gp,{min:1,max:5})}${fNum('Visitor weight','gp',pid,pre+'eo',gp,{min:0,max:100})}
        <label class="fld"><span class="fl">Visitor die</span><select ${bd('gp',pid,pre+'evd')}>${[['d6','d6'],['d8','d8']].map(o=>h`<option value="${o[0]}" ${T.evd===o[0]?raw('selected'):''}>${o[1]}</option>`)}</select></label>
        ${pre===''?fText('Name for the player you track','gp',pid,'wln',gp,{ph:'e.g. Implala'}):''}
        ${pre===''?fText('Name for a second player','gp',pid,'wln2',gp,{ph:'e.g. the second character'}):''}</div>
      ${rows.length?h`<div class="enclist">${rows.map((x,i)=>encEditRow(pid,pre,gp,T,x,i,rows.length))}</div>`:h`<p class="sub">No rows yet.</p>`}
      <div class="row"><button class="btn sm" data-act="en_new" data-id="${pid}" data-k="${t.k}" ${rows.length>=ENC_MAX?raw('disabled'):''}>Add a Pokémon</button>
        <span class="sub">${rows.length} of ${ENC_MAX}</span></div>
      <h3>Conditions and situations</h3>
      ${mods.map((m,i)=>encModEditor(pid,pre,gp,T,m,i,mods.length))}
      <div class="row"><button class="btn sm" data-act="en_mnew" data-id="${pid}" data-k="${t.k}">Add a condition</button></div>
    </div>`:''}
    ${fArea('Notes for this table','gp',pid,pre+'encNote',gp,{rows:2,ph:'e.g. Only in tall grass. Roll once every ten minutes.'})}
  </section>`;
}

/* ----- the box on the Battle page ----- */
function encBattlePanel(){
  const pl=encPlaces();
  const e=S.ui.enc;
  if(!pl.length)return h`<div class="mgd"><b>Wild encounter</b><p class="sub">Roll from a place's table of Pokémon and add what turns up as foes. Import the encounter data in GM Desk, or make a table from a place's page on the Map (GM only).</p></div>`;
  const cur=pl.some(p=>p.v===e.pick)?e.pick:pl[0].v;
  return h`<div class="mgd"><b>Wild encounter</b>
    <p class="sub">Roll from a place's table and add what turns up as foes. The odds follow the Today bar (${cdText()}). They start hidden, like any foe.</p>
    <div class="fgrid"><label class="fld"><span class="fl">Where</span><select data-u="enc.pick">${pl.map(p=>h`<option value="${p.v}" ${p.v===cur?raw('selected'):''}>${p.name}</option>`)}</select></label></div>
    <div class="row"><button class="btn primary sm" data-act="en_rollbattle" data-v="${cur}" data-m="enc">Roll and add</button>
      <button class="btn sm" data-act="en_rollbattle" data-v="${cur}" data-m="horde">Horde</button>
      <button class="btn sm" data-act="en_rollbattle" data-v="${cur}" data-m="swarm">Swarm</button></div></div>`;
}

/* ----- GM Desk: import and export ----- */
/* who wants what, and where it turns up: one list per tracked player, from each table's usual chances */
function encWishIndex(){
  const c={t:'day',x:'clear',s:'spring',m:'waxing',d:'high',f:false};
  const res=ENC_WISH.map(()=>({}));
  encPlaces().forEach(pl=>{
    const t=encTab(pl.id,pl.k);
    const E=encEff(t.T,c,{});
    E.W.filter(e=>!e.oor&&e.b>0).forEach(e=>{
      const r=e.row||{};
      ENC_WISH.forEach((w,i)=>{
        const lv=num(r[w.l]);
        if(lv<=0)return;
        const o=res[i][e.sp]||(res[i][e.sp]={sp:e.sp,lv:0,why:'',places:[]});
        o.lv=Math.max(o.lv,lv);
        if(!o.why&&r[w.r])o.why=String(r[w.r]);
        o.places.push({name:pl.name,p:e.bp});
      });
    });
  });
  return res.map(m=>Object.keys(m).map(k=>m[k]).sort((a,b)=>a.sp<b.sp?-1:a.sp>b.sp?1:0));
}
const encWishName=i=>Object.keys(S.gmPl||{}).map(id=>(S.gmPl[id]||{})[ENC_WISH[i].n]).find(x=>x)||'';
function encWishList(x){
  const gp={};
  gp[ENC_WISH[x.i].n]=x.name;
  return h`<ul class="mini-list encwish" aria-label="${x.name||ENC_WISH[x.i].d}: wished Pokémon">${x.list.map(o=>{
    const ps=o.places.slice().sort((a,b)=>b.p-a.p);
    return h`<li><b>${o.sp}</b>${o.lv>1?h` <span class="pill encwl w${o.lv} p${x.i+1}">${encWlText(gp,o.lv,x.i)}</span>`:''} <span class="sub">${o.why?o.why+' · ':''}${ps.slice(0,4).map(p=>p.name+' '+encPct(p.p)+'%').join(', ')}${ps.length>4?' and '+(ps.length-4)+' more':''}</span></li>`;})}</ul>`;
}
function encDesk(){
  const im=S.ui.enc.imp||{};
  const have=Object.keys(S.gmPl||{}).filter(id=>PD_BY[id]&&encRows(encGp(id)).length).length;
  const wo=S.ui.enc.wo||{};
  const idx=have?encWishIndex():null;
  const wishes=idx?ENC_WISH.map((w,i)=>idx[i].length?{i,name:encWishName(i),list:idx[i]}:null).filter(Boolean):[];
  const mode=im.mode==='replace'?'replace':im.mode==='wish'?'wish':'add';
  return h`<section class="panel"><div class="ph"><h2>Encounter data</h2><span class="pill gm">GM only</span>
      <div class="acts"><button class="btn sm" data-act="en_pick" ${im.busy?raw('disabled'):''}>Import encounter data</button>
        <button class="btn sm ghost" data-act="en_exp" ${S.dl&&have?'':raw('disabled')}>Download tables</button>
        <button class="btn sm ghost" data-act="en_csv" ${S.dl&&have?'':raw('disabled')}>Rarity sheet (CSV)</button></div></div>
    <p class="sub">${have?have+' places have a table of wild Pokémon.':'No places have a table yet.'} Choose <b>sinnoh-encounter-data.json</b> from the update download. Every place gets its Pokémon with their chances, the PTA book rarity, hordes, swarms, alphas, and how the chances shift with time of day, weather, season, moon, tide and festival week. The tables go into your private GM notes, not into the public site.</p>
    <div class="row evchips" role="group" aria-label="When a place already has a table"><button class="chip enchip" data-act="en_mode" data-v="add" aria-pressed="${String(mode==='add')}">Only places without a table</button><button class="chip enchip" data-act="en_mode" data-v="wish" aria-pressed="${String(mode==='wish')}">Add wishes to existing tables</button><button class="chip enchip" data-act="en_mode" data-v="replace" aria-pressed="${String(mode==='replace')}">Replace every table</button></div>
    <p class="sub">${mode==='replace'?'Every place in the file gets the new table. Tables you wrote yourself are overwritten. Your GM notes on each place are kept.':mode==='wish'?'Use this after an update that brings new wished Pokémon. A place with a table gets only the wished Pokémon it lacks and the wish marks (and reasons) it does not have; the chances, notes and conditions you set are left alone. Places without a table get the whole table. Your GM notes are always kept.':'Places where you already wrote a table keep it. Your GM notes are always kept.'}</p>
    ${im.busy?h`<progress class="ptaprog" max="${num(im.total)}" value="${num(im.done)}" aria-label="Import progress"></progress>`:''}
    ${im.msg?h`<p class="sub ${im.bad?'bad':''}" role="status">${im.msg}</p>`:''}
    ${wishes.length?h`<div class="encwishes"><h3>Wished Pokémon</h3><p class="sub">Where each Pokémon a player wants turns up, with its usual chance there.</p>
      ${wishes.map(x=>h`<div class="fld"><button class="btn sm ${wo[x.i]?'primary':''}" data-act="en_wo" data-i="${x.i}" aria-expanded="${String(!!wo[x.i])}">${x.name||ENC_WISH[x.i].d} · ${x.list.length} Pokémon</button>${wo[x.i]?encWishList(x):''}</div>`)}</div>`:''}
  </section>`;
}
/* what goes into a place's GM document */
function encDocOf(p,wln,wln2){
  const o={};
  ['dg','enc','em','ev','evd','eo','eon','dr','nb','nm','ex'].forEach(k=>{if(p[k]!==undefined)o[k]=p[k];});
  if(!p.dr)o.dr=false;
  o.eoUsed=false;
  if(wln)o.wln=String(wln);
  if(wln2)o.wln2=String(wln2);
  o.ei=Date.now();
  return o;
}
async function encImport(file){
  const im=S.ui.enc.imp=S.ui.enc.imp||{mode:'add'};
  const say=(msg,bad)=>{im.msg=msg;im.bad=!!bad;im.busy=false;scheduleRender();};
  let d=null;
  try{d=JSON.parse(await file.text());}catch(e){}
  if(!d||d.format!=='sinnoh-encounters'||!d.places||typeof d.places!=='object'){say('That is not the encounter data file. Use sinnoh-encounter-data.json from the update download.',true);return;}
  const mode=im.mode==='replace'?'replace':im.mode==='wish'?'wish':'add';
  const names={wln:d.wln,wln2:d.wln2};
  const ids=Object.keys(d.places).filter(id=>PD_BY[id]&&d.places[id]&&Array.isArray(d.places[id].enc));
  /* what would be written: {id, doc, fresh|added|marked} */
  const plan=[];
  let skipped=0;
  ids.forEach(id=>{
    const has=encRows(encGp(id)).length>0;
    if(mode==='replace'||!has){plan.push({id,doc:encDocOf(d.places[id],d.wln,d.wln2),fresh:1});return;}
    if(mode==='wish'){
      const m=encMergeDoc(encGp(id),d.places[id],names);
      if(m.changed)plan.push({id,doc:Object.assign(m.patch,{ei:Date.now()}),added:m.added,marked:m.marked});
      else skipped++;
      return;
    }
    skipped++;
  });
  if(!plan.length){
    if(mode==='wish'){say('Nothing to add. Your tables already have every Pokémon and wish in this file.',false);return;}
    const more=ids.some(id=>encRows(encGp(id)).length&&encMergeDoc(encGp(id),d.places[id],names).changed);
    say('Nothing to import. All '+ids.length+' places already have a table.'+(more?' This file does carry wished Pokémon your tables do not have yet: choose “Add wishes to existing tables” and import again.':' Choose “Replace every table” to overwrite them.'),!more);
    return;
  }
  im.busy=true;im.done=0;im.total=plan.length;im.msg='Importing…';im.bad=false;scheduleRender();
  try{
    let batch=S.db.batch(),n=0;
    for(const x of plan){
      batch.set(S.db.collection('gm').doc('place_'+x.id),x.doc,{merge:true});
      n++;
      if(n>=15){await batch.commit();im.done+=n;n=0;batch=S.db.batch();scheduleRender();}
    }
    if(n){await batch.commit();im.done+=n;}
  }catch(e){say('The import stopped ('+((e&&e.code)||'error')+'). Some of it may be saved. Run it again to finish.',true);return;}
  if(mode==='wish'){
    const fresh=plan.filter(x=>x.fresh).length,upd=plan.length-fresh;
    const add=plan.reduce((a,x)=>a+(x.added||0),0),mk=plan.reduce((a,x)=>a+(x.marked||0),0);
    say('Updated '+upd+' places: added '+add+' Pokémon and marked '+mk+' wishes'+(fresh?'; imported '+fresh+' new tables':'')+'. Weights and notes you wrote were left alone.',false);
    return;
  }
  say('Imported tables for '+plan.length+' places'+(skipped?'; kept '+skipped+' that already had one':'')+'.',false);
}
function encExport(){
  if(!S.dl)return;
  const places={};
  Object.keys(S.gmPl||{}).forEach(id=>{
    const g=S.gmPl[id];
    if(!PD_BY[id]||!encRows(g).length)return;
    const o={};
    ['dg','enc','em','ev','evd','eo','eon','dr','nb','nm','ex'].forEach(k=>{if(g[k]!==undefined)o[k]=g[k];});
    places[id]=o;
  });
  const wln=Object.keys(S.gmPl).map(id=>S.gmPl[id].wln).find(x=>x)||'';
  const wln2=Object.keys(S.gmPl).map(id=>S.gmPl[id].wln2).find(x=>x)||'';
  return S.dl.save({filename:'sinnoh-encounter-data.json',data:JSON.stringify(Object.assign({format:'sinnoh-encounters',v:3,wln},wln2?{wln2}:{},{places}))}).catch(e=>{if(!e||e.code!=='declined')toast('Could not offer the download');});
}
function encCsv(){
  if(!S.dl)return;
  const q=s=>'"'+String(s==null?'':s).replace(/"/g,'""')+'"';
  const lines=[['Place','Table','Pokemon','PTA book rarity','Usual chance %','Group','Herd or pack','Swarms','Alpha chance %','Wanted','Note'].map(q).join(',')];
  const c={t:'day',x:'clear',s:'spring',m:'waxing',d:'high',f:false};
  encPlaces().forEach(pl=>{
    const t=encTab(pl.id,pl.k),T=t.T,gp=encGp(pl.id);
    const E=encEff(T,c,{});
    E.W.filter(e=>!e.oor&&(e.b>0)).sort((a,b)=>b.bp-a.bp).forEach(e=>{
      const r=e.row||{};
      lines.push([PD_BY[pl.id].name,t.k?t.nm:'',e.sp,ENC_BK[r.bk]?ENC_BK[r.bk][1]:'',Math.round(e.bp*10)/10,(num(r.lo)||1)+(num(r.hi)>num(r.lo)?'-'+num(r.hi):''),r.so?'yes':'',r.sw?'yes':'',num(r.al)||'',encWishOf(r,gp).map(x=>encWlText(gp,x.lv,x.i)+(x.why?' ('+x.why+')':'')).join('; '),r.n||''].map(q).join(','));
    });
  });
  return S.dl.save({filename:'sinnoh-pokemon-rarity.csv',data:'﻿'+lines.join('\r\n'),mime:'text/csv'}).catch(e=>{if(!e||e.code!=='declined')toast('Could not offer the download');});
}
/* text boxes that are not plain fields */
function encFxEdit(t){
  const p=String(t.dataset.encfx).split('|');
  const r=encFxParse(t.value);
  edit('gp',p[0],p[1]+'em.'+p[2]+'.fx',r.fx);
  if(r.bad.length)toast('Could not read: '+r.bad.slice(0,2).join(' · ')+(r.bad.length>2?' …':''));
  render();
}
function encListEdit(t){
  const p=String(t.dataset.encl).split('|');
  const list=t.value.split(',').map(x=>x.trim()).filter(Boolean);
  edit('gp',p[0],p[1]+'em.'+p[2]+'.'+p[3],list.length?list:null);
  render();
}

async function encAct(b){
  if(!S.me.admin)return;
  const d=b.dataset,pid=d.id;
  switch(d.act){
    case 'en_new':{
      const t=encTab(pid,+d.k||0);
      const arr=encRows(t.T).slice();
      if(arr.length>=ENC_MAX)break;
      arr.push(TPL.enc());
      edit('gp',pid,t.pre+'enc',arr);
      render();
      break;}
    case 'en_mnew':{
      const t=encTab(pid,+d.k||0);
      const arr=(Array.isArray(t.T.em)?t.T.em:[]).slice();
      let n=1;while(arr.some(m=>m.id==='m'+n))n++;
      arr.push({id:'m'+n,lb:'New condition',fx:[],tx:''});
      S.ui.enc.mo[pid+'|'+t.pre+'|'+(arr.length-1)]=true;
      edit('gp',pid,t.pre+'em',arr);
      render();
      break;}
    case 'en_wh':{
      const pre=d.pre||'';
      const T=pre?(encGp(pid).ex||[])[+pre.split('.')[1]]:encGp(pid);
      const m=T&&(T.em||[])[+d.i];
      if(!m)break;
      const w=Object.assign({},m.w||{});
      const a=(w[d.w]||[]).slice();
      const at=a.indexOf(d.v);
      if(at>=0)a.splice(at,1);else a.push(d.v);
      if(a.length)w[d.w]=a;else delete w[d.w];
      edit('gp',pid,pre+'em.'+d.i+'.w',Object.keys(w).length?w:null);
      render();
      break;}
    case 'en_edit':S.ui.enc.ed[pid]=!S.ui.enc.ed[pid];render();break;
    case 'en_mo':S.ui.enc.mo[d.key]=!S.ui.enc.mo[d.key];render();break;
    case 'en_tab':S.ui.enc.tb[pid]=+d.k||0;delete S.ui.enc.res[pid];render();break;
    case 'en_zone':{
      const z=encZ(pid,+d.k||0);
      z[d.m]=!z[d.m];
      render();
      break;}
    case 'en_used':{
      const t=encTab(pid,+d.k||0);
      edit('gp',pid,t.pre+'eoUsed',!t.T.eoUsed);
      render();
      break;}
    case 'en_roll':{
      const r=encRollRef(pid,+d.k||0,d.m||'enc',d.f);
      r.fid=d.f||'';
      S.ui.enc.res[pid]=r;
      render();
      break;}
    case 'en_alpha':{
      const r=S.ui.enc.res[pid];
      if(!r||r.none||!r.lines.length)break;
      const L=r.lines[0];
      L.a=L.a?0:1;
      render();
      break;}
    case 'en_tobattle':{
      const r=S.ui.enc.res[pid];
      if(!r||r.none)break;
      delete S.ui.enc.res[pid];
      await encToBattle(pid,r);
      setTab('battle');
      break;}
    case 'en_rollbattle':{
      const ref=encRef(d.v);
      const r=encRollRef(ref.id,ref.k,d.m||'enc','');
      if(r.none){toast(r.why||'Nothing turns up.');break;}
      await encToBattle(ref.id,r);
      break;}
    case 'en_pick':{const fp=$('#encfile');if(fp)fp.click();break;}
    case 'en_mode':S.ui.enc.imp.mode=d.v==='replace'?'replace':d.v==='wish'?'wish':'add';render();break;
    case 'en_wo':{const wo=S.ui.enc.wo=S.ui.enc.wo||{};wo[d.i]=!wo[d.i];render();break;}
    case 'en_exp':encExport();break;
    case 'en_csv':encCsv();break;
    default:break;
  }
}
/* The shop catalog: every priced item in the Players Handbook (and the extra items in the second handbook), grouped by kind.
   Each entry is [name, group, price, description]. A price of null means the book gives none. */
const SCAT_CATS=["Poké Balls", "Potions", "Status cures", "Revives", "Energy", "Battle boosters", "Vitamins", "Mints", "Repels", "Herbs", "Held items", "Berries", "Contest", "Evolution stones", "TMs and TRs", "Packs and kits", "Utility", "Survival gear", "Clothing and armor", "Tech", "Camping and play", "Rare", "General goods"];
const SCAT=[["Basic Ball",0,100,"+5 to your capture roll."],["Great Ball",0,600,"+0 to your capture roll."],["Ultra Ball",0,1000,"-5 from your capture roll."],["Master Ball",0,null,"-100 from your capture roll. The Master Ball can and will often fail when thrown at legendary Pokémon."],["Park Ball",0,550,"-20 from your capture roll against domesticated wild Pokémon."],["Safari Ball",0,550,"-20 from your capture roll against domesticated wild Pokémon."],["Sport Ball",0,550,"-20 from your capture roll against domesticated wild Pokémon."],["Cherish Ball",0,1500,"-5 from your capture roll. Captured Pokémon are more easily befriended."],["Luxury Ball",0,1500,"-5 from your capture roll. Captured Pokémon are more easily befriended."],["Premier Ball",0,1500,"-5 from your capture roll. Captured Pokémon are more easily befriended."],["Dive Ball",0,1250,"-12 from your capture roll if the Pokémon is in water."],["Dusk Ball",0,1150,"-7 from your capture roll if it’s night time (no sunlight)."],["Fast Ball",0,1250,"-8 from your capture roll on a Pokémon that acts before your Pokémon."],["Lure Ball",0,1250,"-10 from your capture roll if you lured the wild Pokémon into combat."],["Quick Ball",0,1550,"-16 from your capture roll if thrown as your first action during combat."],["Repeat Ball",0,1250,"-10 from your capture roll if the Pokémon already had a Poké Ball thrown at it this encounter."],["Timer Ball",0,1450,"-10 from your capture roll if the encounter has lasted at least one min; -18 from your capture roll if the encounter has lasted at least two mins."],["Friend Ball",0,1000,"+0 to your capture roll. Captured Pokémon are more easily befriended."],["Heal Ball",0,1000,"+0 to your capture roll. Captured Pokémon are healed 20 hit points."],["Dream Ball",0,1250,"-10 from your capture roll if the Pokémon is afflicted."],["Heavy Ball",0,1250,"-15 from your capture roll if the Pokémon is Heavy or Superweight."],["Level Ball",0,1250,"-10 from your capture roll if the Pokémon is fully evolved, and did evolve at least once."],["Love Ball",0,1250,"-10 from your capture roll if the target shares a type with one of your active Pokémon."],["Moon Ball",0,1250,"-10 from your capture roll if the Pokémon evolves with an evolution stone."],["Nest Ball",0,1250,"-10 from your capture roll if the Pokémon can evolve, but is not evolved."],["Net Ball",0,1250,"-15 from your capture roll when used against a Bug or Water type Pokémon."],["Beast Ball",0,null,"-25 from your capture roll if the Pokémon is from a parallel dimension."],["Strange Ball",0,null,"-25 from your capture roll if the Pokémon is temporally displaced."],["Potion",1,25,"Heals a Pokémon 12 HP."],["Super Potion",1,250,"Heals a Pokémon 24 HP."],["Hyper Potion",1,550,"Heals a Pokémon 36 HP."],["Max Potion",1,850,"Heals a Pokémon to their Max HP."],["Full Restore",1,1200,"Heals a Pokémon to their Max HP and cures them of any afflictions."],["Potion Water",1,100,"Heals a human 10 HP."],["Super Soda",1,300,"Heals a human 20 HP."],["Hyper Lemonade",1,550,"Heals a human 30 HP."],["Moo Moo Milk",1,175,"Heals anything 8 HP. 164"],["Antidote",2,120,"Cures a Pokémon or human of Poisoned or Toxified."],["Awakening",2,120,"Cures a Pokémon or human of Drowsy."],["Burn Heal",2,120,"Cures a Pokémon or human of Burned."],["Ice Heal",2,120,"Cures a Pokémon or human of Frostbite."],["Paralyze Heal",2,120,"Cures a Pokémon or human of Paralysis."],["Touga Spray",2,120,"Cures a Pokémon of Entranced."],["Full Heal",2,520,"Cures a Pokémon or human of all afflictions."],["Revive",3,1350,"Restore an unconscious Pokémon to half of its max HP."],["Max Revive",3,2950,"Restore an unconscious Pokémon to its max HP."],["Ether",4,480,"A Pokémon’s strength is partially restored and regains a single use of one of its 3/day moves."],["Elixir",4,1280,"A Pokémon’s strength is partially Restored and regains a single use of one of its 1/day moves."],["Max Ether",4,2280,"A Pokémon’s strength is partially restored. Choose two 3/day and/or 1/day moves to restore one each of the moves uses."],["Max Elixir",4,3480,"A Pokémon’s strength is partially restored. Choose two 3/day and/or 1/day moves to restore all of the moves uses."],["X Attack",5,240,"Gives a Pokémon Attack▲."],["X Defend",5,240,"Gives a Pokémon Defense▲."],["X Special",5,240,"Gives a Pokémon SpAttack▲."],["X Sp. Def",5,240,"Gives a Pokémon SpDefense▲."],["X Speed",5,240,"Gives a Pokémon Speed▲."],["X Accuracy",5,240,"Increases a Pokémon’s AC by +1."],["Dire Hit",5,840,"The next attack the Pokémon makes is Lethal."],["Guard Spec.",5,440,"The next time the Pokémon would get ▼from a foe, ignore it."],["HP Up",6,800,"Increase HP by 4 for two weeks."],["Protein",6,800,"Increase Attack by 1 for two weeks."],["Iron",6,800,"Increase Defense by 1 for two weeks."],["Calcium",6,800,"Increase Special Attack by 1 for two weeks."],["Zinc",6,800,"Increase Special Defense by 1 for two weeks."],["Carbos",6,800,"Increase speed by 1 for two weeks."],["PP UP",6,1200,"Increase the frequency of a 3/day move to 4/day for one week."],["PP Max",6,1900,"Increase the frequency of a 1/day move to 2/day(1/combat) for one week."],["Cinnaleaf Mint",7,8750,"Raise Attack 1 point, then lower a non-Attack non-HP stat 1 point."],["Stonebalm Mint",7,8750,"Raise Defense 1 point, then lower a non-Defense non-HP stat 1 point."],["Spearmist Mint",7,8750,"Raise Special Attack 1 point, then lower a non-Special Attack non-HP stat 1 point."],["Calmrest Mint",7,8750,"Raise Special Defense 1 point, then lower a non-Special Defense non-HP stat 1 point."],["Lightwind Mint",7,8750,"Raise Speed 1 point, then lower a non-Speed non-HP stat 1 point."],["Pureleaf Mint",7,8750,"Do not add to or subtract from any stats after removing the effects of the Pokémon’s Nature."],["Repel",8,150,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Super Repel",8,400,"Wild Pokémon find the smell repulsive for three hours after applied, but may ignore it to protect something precious to them."],["Max Repel",8,1000,"Wild Pokémon find the smell repulsive for ten hours after applied, but may ignore it to protect something precious to them."],["Heal Powder",9,480,"Removes any affliction"],["Energy Powder",9,125,"Recovers 30 Hit Points (Pokémon)"],["Energy Root",9,400,"Recovers 48 Hit Points (Pokémon)"],["Revival Herb",9,1000,"Recovers an unconscious Pokémon to half of their max HP."],["Ability Shield",10,1350,"Your passives cannot be disabled or replaced by any foe’s effects during combat."],["Absorb Bulb",10,300,"When you are hit by a Water-type attack, Absorb Bulb is destroyed and you get SpAttack▲."],["Adrenaline Orb",10,2550,"If you get Attack▼or SpAttack▼from a foe’s effects, you get Speed▲. If you get Attack▼▼or SpAttack▼▼from a foe’s effects, you get Speed▲▲."],["Air Balloon",10,1350,"You are immune to Ground-type attacks. If you are hit by any other type of attack, Air Balloon is destroyed."],["Assault Vest",10,2550,"Your Special Defense is +2. You may not use moves that do not have power."],["Big Root",10,2550,"Whenever you would recover HP or gain temporary HP after dealing damage to a foe, gain +1d4 temporary HP."],["Binding Band",10,2550,"If you use an attack that binds a target, the target loses 1d4 HP at the end of each of your turns if they are still Bound."],["Black Sludge",10,1050,"As an action, consume and destroy Black Sludge. Poison-types regain 1d4 HP after acting until at max HP. All other Pokémon are Poisoned by consuming Black Sludge."],["Bright Powder",10,850,"As a free action, destroy Bright Powder. Until your next turn, if you are targeted by an attack, the attacker must roll +2 higher in order to hit you during AC."],["Cell Battery",10,300,"When you are hit by a Electric-type attack, Cell Battery is destroyed and you get Attack▲."],["Choice Band",10,2550,"Your Attack stat is +2. Whenever you use a move, that is the only move you can use for the rest of the encounter."],["Choice Scarf",10,2550,"Your Speed stat is +2. Whenever you use a move, that is the only move you can use for the rest of the encounter."],["Choice Specs",10,2550,"Your Special Attack stat is +2. Whenever you use a move, that is the only move you can use for the rest of the encounter."],["Clear Amulet",10,1350,"You are immune to getting ▼from the effects of your foe’s Styles."],["Covert Cloak",10,1350,"You are immune to the effects of your foe’s held items."],["Destiny Knot",10,1750,"When you become Entranced, the Pokémon who caused your Entranced becomes Entranced with you as well."],["Eviolite",10,2550,"If you can still potentially evolve, your Defense and Special Defense stats are +1."],["Expert Belt",10,2550,"When you hit with a super-effective or extremely-effective attack, deal an additional +2 damage."],["Flame Orb",10,1350,"After acting, you are Burned."],["Float Stone",10,1350,"If you are Heavy (weight), you are treated as Medium (weight). This is also true for Medium to Light and Light to Featherweight. You get +15ft movement speed."],["Focus Band",10,1950,"If you would be knocked out, you may roll 1d20. On 17 or higher, you are instead set to 1 hit point and the Focus Band is destroyed."],["Focus Sash",10,2550,"If you would be knocked out from a single attack when you were at max hit points, instead you are set to 1 hit point once per battle."],["Grip Claw",10,1950,"If you bind a foe and your foe tries to escape, they must roll +4 higher to escape successfully."],["Heavy Boots",10,2550,"The first time you would take damage from a Hazard per combat, ignore that damage."],["Iron Ball",10,1350,"If you are Featherweight (weight), you are treated as Light (weight). This is also true for Light to Medium and Medium to Heavy."],["King’s Rock",10,2550,"On your first single-target attack per day, the attack gains the following effect: “18 or higher during AC inflicts Dazed.”"],["Lagging Tail",10,1350,"You act last during each round of combat."],["Leftovers",10,2550,"As an action, consume and destroy Leftovers. Regain 1d6 HP after acting until you are at max HP."],["Life Orb",10,2550,"Your attacks have +1d6 power. After acting, no matter what actions you take, you lose 1d6 HP."],["Luminous Moss",10,300,"When you are hit by a Water-type attack, Luminous Moss is destroyed and you get SpDefense▲."],["Mental Herb",10,650,"As a free action, consume and destroy Mental Herb. If a foe does anything to try and prevent you from using any of your moves, it fails."],["Metronome",10,2550,"Your attacks have +1d4 power for each other time the same attack has been used that encounter (max +3d4)."],["Mirror Herb",10,350,"As a free Reaction [When a foe gets▲], consume and destroy Mental Herb. Gain the same ▲that the foe just gained."],["Muscle Band",10,3550,"Your Physical attacks deal +1 damage."],["Power Herb",10,850,"As a free Reaction [When you use a move with multiple turns], consume and destroy Power Herb."],["Protective Pads",10,2550,"If you would be damaged as a result of making a melee attack against a foe by a foe’s passive or other effect, ignore that damage."],["Quick Claw",10,2550,"On your first single-target melee attack with at-will frequency per day, the attack gains the following effect: “This attack has Priority.”"],["Razor Claw",10,2550,"On your first single-target melee attack per day, the attack gains the following effect: “This attack is Lethal.”"],["Razor Fang",10,2550,"Your Latched attacks deal +2 damage."],["Ring Target",10,1050,"You lose all of your type immunities. When hit by an attack that you are usually immune to, treat the damage as ineffective."],["Rocky Helmet",10,3550,"Whenever you are hit by an attack at melee range, the attacker loses 1d4 HP."],["Safety Goggles",10,2550,"You are immune to damaging effects from Weather."],["Scope Lens",10,2550,"On your first single-target ranged attack per day, the attack gains the following effect: “This attack is Lethal.”"],["Shed Shell",10,450,"As a free Reaction [When you become Bound by a foe], destroy Shed Shell. You are no longer Bound."],["Shell Bell",10,3550,"Whenever you hit with an attack, you can drop your highest rolled damage result. If you do, recover 1d4 HP."],["Snowball",10,300,"When you are hit by a Ice-type attack, Snowball is destroyed and you get Attack▲."],["Sticky Barb",10,2050,"Whenever you move more than 10ft during your turn, you lose 1d4 HP. If you are hit by a melee range attack, give Sticky Barb to the attacker."],["Throat Spray",10,1850,"Your Sound attacks deal +2 damage."],["Toxic Orb",10,1350,"After acting, you are Poisoned."],["White Herb",10,650,"As a free action, consume and destroy White Herb. Get rid of any ▼ that you have."],["Wide Lens",10,3550,"Your effect moves have +1 Accuracy."],["Wise Glasses",10,3550,"Your Special attacks deal +1 damage."],["Zoom Lens",10,3550,"On your first attack per combat, your attack has +2 Accuracy and -4 power."],["Elemental Boon (choose a type)",10,1850,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."],["Elemental Plate (choose a type)",10,19800,"Elemental Plates are rare artifacts named per Pokémon type (Bug Plate, Dark Plate, etc.)."],["Weather/Terrain/Zone Rock",10,450,"These items are named after the Weather, Terrain, or Zone that the held item affects (Sunny Rock, Tricky Rock, Grassy Rock, etc.)."],["Weather/Terrain/Zone Seed",10,450,"These items are named after the Weather, Terrain, or Zone that the held item affects (Rainy Seed, Gravity Seed, Electric Seed, etc.)."],["Oran Berry",11,25,"Heals a Pokémon 5 HP."],["Sitrus Berry",11,120,"Heals a Pokémon 12 HP. (uncommon in the wild)"],["Aguav Berry",11,850,"Heals 1/3 of a Pokémon’s max HP, then they are Confused. (uncommon in the wild)"],["Figy Berry",11,850,"Heals 1/3 of a Pokémon’s max HP, then they are Confused. (uncommon in the wild)"],["Iapapa Berry",11,850,"Heals 1/3 of a Pokémon’s max HP, then they are Confused. (uncommon in the wild)"],["Mago Berry",11,850,"Heals 1/3 of a Pokémon’s max HP, then they are Confused. (uncommon in the wild)"],["Wiki Berry",11,850,"Heals 1/3 of a Pokémon’s max HP, then they are Confused. (uncommon in the wild)"],["Aspear Berry",11,120,"Cures Frostbite"],["Cheri Berry",11,120,"Cures Paralysis"],["Chesto Berry",11,120,"Cures Drowsy"],["Pecha Berry",11,120,"Cures Poisoned and Toxified"],["Persim Berry",11,120,"Cures Confused"],["Rawst Berry",11,120,"Cures Burns"],["Lum Berry",11,580,"Cures all Afflictions (uncommon in the wild)"],["Grepa Berry",11,680,"When you have SpDefense▼ you get SpDefense▲. (rare in the wild)"],["Hondew Berry",11,680,"When you have SpAttack▼ you get SpAttack▲. (rare in the wild)"],["Kelpsy Berry",11,680,"When you have Attack▼ you get Attack▲. (rare in the wild)"],["Pomeg Berry",11,1080,"When you have ▼ you get a matching ▲. (rare in the wild)"],["Qualot Berry",11,680,"When you have Defense▼ you get Defense▲. (rare in the wild)"],["Tamato Berry",11,680,"When you have Speed▼ you get Speed▲. (rare in the wild)"],["Babiri Berry",11,540,"Protection from Steel. (uncommon in the wild)"],["Charti Berry",11,540,"Protection from Rock. (uncommon in the wild)"],["Chilan Berry",11,540,"Protection from Normal. (uncommon in the wild)"],["Chople Berry",11,540,"Protection from Fighting. (uncommon in the wild)"],["Coba Berry",11,540,"Protection from Flying. (uncommon in the wild)"],["Colbur Berry",11,540,"Protection from Dark. (uncommon in the wild)"],["Haban Berry",11,540,"Protection from Dragon. (uncommon in the wild)"],["Kasib Berry",11,540,"Protection from Ghost. (uncommon in the wild)"],["Kebia Berry",11,540,"Protection from Poison. (uncommon in the wild)"],["Occa Berry",11,540,"Protection from Fire. (uncommon in the wild)"],["Passho Berry",11,540,"Protection from Water. (uncommon in the wild)"],["Payapa Berry",11,540,"Protection from Psychic. (uncommon in the wild)"],["Rindo Berry",11,540,"Protection from Grass. (uncommon in the wild)"],["Roseli Berry",11,540,"Protection from Fairy. (uncommon in the wild)"],["Shuca Berry",11,540,"Protection from Ground. (uncommon in the wild)"],["Tanga Berry",11,540,"Protection from Bug. (uncommon in the wild)"],["Wacan Berry",11,540,"Protection from Electric. (uncommon in the wild)"],["Yache Berry",11,540,"Protection from Ice. (uncommon in the wild)"],["Apicot Berry",11,1880,"At half HP or lower, you get SpDefense▲. (rare in the wild)"],["Ganlon Berry",11,1880,"At half HP or lower, you get Defense▲. (rare in the wild)"],["Lansat Berry",11,1880,"At half HP or lower, your next attack is Lethal. (rare in the wild)"],["Liechi Berry",11,1880,"At half HP or lower, you get Attack▲. (rare in the wild)"],["Micle Berry",11,1880,"At half HP or lower, increase your AC by +1 until the end of combat. (rare in the wild)"],["Petaya Berry",11,1880,"At half HP or lower, you get SpAttack▲. (rare in the wild)"],["Salac Berry",11,1880,"At half HP or lower, you get Speed▲. (rare in the wild)"],["Starf Berry",11,1280,"At half HP or lower, get a random ▲. (rare in the wild)"],["Custap Berry",11,null,"When at 6 HP or less, your next At-Will attack has Priority. (rare in the wild)"],["Enigma Berry",11,null,"When hit by a super-effective or extremely-effective attack, restore HP equal to 1/4th of your max HP. (rare in the wild)"],["Jacoba Berry",11,null,"When hit by a melee Attack move, the attacker loses HP equal to 1/4th the damage you just took. (rare in the wild)"],["Kee Berry",11,null,"When hit by an Attack move, increase Defense by 1 for 2 mins. (rare in the wild)"],["Leppa Berry",11,null,"Restore the use of one 3/day frequency move as if you’ve had an extended rest. (rare in the wild)"],["Maranga Berry",11,null,"When hit by an Sp. Atk move, increase Sp. Def by 1 for 2 mins. (rare in the wild)"],["Rowap Berry",11,null,"When hit by a ranged Sp. Atk move, the offender loses HP equal to 1/4th the damage you just took. (rare in the wild)"],["Belue Berry",11,120,"No special effect; used for contest treats and berry food."],["Bluk Berry",11,120,"No special effect; used for contest treats and berry food."],["Cornn Berry",11,120,"No special effect; used for contest treats and berry food."],["Durin Berry",11,120,"No special effect; used for contest treats and berry food."],["Magost Berry",11,120,"No special effect; used for contest treats and berry food."],["Nanab Berry",11,120,"No special effect; used for contest treats and berry food."],["Nomel Berry",11,120,"No special effect; used for contest treats and berry food."],["Pamtre Berry",11,120,"No special effect; used for contest treats and berry food."],["Pinap Berry",11,120,"No special effect; used for contest treats and berry food."],["Rabuta Berry",11,120,"No special effect; used for contest treats and berry food."],["Razz Berry",11,120,"No special effect; used for contest treats and berry food."],["Spelon Berry",11,120,"No special effect; used for contest treats and berry food."],["Watmel Berry",11,120,"No special effect; used for contest treats and berry food."],["Wepear Berry",11,120,"No special effect; used for contest treats and berry food."],["Beautiful Bandanna",12,2280,"Beauty contest stat is +2 while worn."],["Clever Cravat",12,2280,"Clever contest stat is +2 while worn."],["Cool Kerchief",12,2280,"Cool contest stat is +2 while worn."],["Cute Comforter",12,2280,"Cute contest stat is +2 while worn."],["Tough Tippet",12,2280,"Tough contest stat is +2 while worn."],["Sweet PokéBlock (level 1)",12,980,"Raises Cute stat +1"],["Dry & Sweet Poffin (level 2)",12,1880,"Raises both Beauty and Cute stat +2"],["Bitter Donut (level 4)",12,3680,"Raises Clever stat +4"],["Spicy PokéBlock (level 5)",12,4580,"Raises Cool stat +5"],["Null Poffin (level 4)",12,480,"Permanently lowers 4 Contest stats. (They can be raised again.)"],["Dawn Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Dusk Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Fire Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Ice Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Leaf Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Moon Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Shiny Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Sun Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Thunder Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Water Stone",13,9800,"Induces evolution in certain species of Pokémon."],["TM (At-Will)",14,4800,"Teaches an at-will move. 3 uses."],["TM (3/day)",14,11800,"Teaches a 3/day move. 3 uses."],["TM (1/day)",14,26800,"Teaches a 1/day move. 3 uses."],["TR (At-Will)",14,2400,"Teaches an at-will move. 1 use."],["TR (3/day)",14,5900,"Teaches a 3/day move. 1 use."],["TR (1/day)",14,13400,"Teaches a 1/day move. 1 use."],["HM (At-Will)",14,null,"Teaches an at-will move. Unlimited uses. Hard to price and hard to find."],["HM (3/day)",14,null,"Teaches a 3/day move. Unlimited uses. Hard to price and hard to find."],["HM (1/day)",14,null,"Teaches a 1/day move. Unlimited uses. Hard to price and hard to find."],["Basic Tool Kit",15,95,"Basic tools for basic repairs or maintenance. (8 lbs)"],["Camera Bag",15,220,"Everything you need as a traveling photographer, minus the camera. (3 lbs)"],["Cooking Kit",15,850,"For the chef on the go, in the wilds. (35 lbs)"],["Dig Kit",15,150,"Whatever you’re looking for, this should help. (15 lbs)"],["Drawing Kit",15,35,"For an artist, or maybe just a doodler. (4 lbs)"],["Studious Pack",15,260,"Useful things for a trainer with a knack for academics. (10 lbs)"],["Traveler’s Pack",15,150,"Really useful gear for extended travel through the wilds. (15 lbs)"],["Trainer’s Pack",15,140,"Basic goods for a trainer who’s starting their journey. (5 lbs)"],["Engineer’s Tool Kit",15,1050,"If you’re building something on the go, or taking something else apart, maybe you’ll need this? (15 lbs)"],["Field Survey Kit",15,200,"If any trainers want to do some research while out in the wilds, these tools will help. (8 lbs)"],["Fishing Kit",15,250,"For trainers who are looking to lure underwater Pokémon to the surface. (8 lbs)"],["Grooming Kit",15,150,"Your Pokémon will always look their best when you’re using this kit. (4 lbs)"],["Make Up Kit",15,150,"You will always look your best when you’re with this kit. (4 lbs)"],["Medical Field Kit",15,1750,"Even if you’re not entirely sure how to use it, it’s very useful to have. (10 lbs)"],["Mess Kit",15,10,"Everything you need to enjoy a meal on the go. (1.5 lbs)"],["Miscreant’s Pack",15,300,"There’s no real reason to have this, let alone sell it. This may not be easily found and available in stores. (10 lbs)"],["Performer’s Pack",15,700,"Perfect for trainers who travel as entertainers, coordinators, or influencers. (9 lbs)"],["Poké Ball Smith Kit",15,1250,"If you’re planning to make your own Poké Balls, this will be necessary. (15 lbs)"],["Portable Chemistry Set",15,800,"Science on the go! (12 lbs)"],["Ruin Explorer’s Pack",15,325,"Intended for trainers investigating ancient sites, abandoned structures, and lost routes. (11 lbs)"],["Sewing Kit",15,325,"This is useful for the designer on the go. (20 lbs)"],["Spiritualist’ Pack",15,140,"For those who travel and spread the word of various greater beings. (5 lbs)"],["Arctic Travel Pack",15,575,"For exposure to cold climates and snow-covered routes. (14 lbs)"],["Climber’s Pack",15,350,"Steep routes, cliffs, and elevated terrain. (12 lbs)"],["Coastal & Open Water Pack",15,525,"For long island routes, shoreline travel, and open-water crossings. (11 lbs)"],["Extreme Weather Pack",15,425,"For routes with dangerous or unpredictable weather conditions. (7 lbs)"],["Swamp & Wetlands Pack",15,575,"Built for travel through marshes, bogs, and flooded wilds. (10 lbs)"],["Volcanic Route Pack",15,850,"Intended for travel near active volcanic zones and other dangerous extreme heat environments. (9 lbs)"],["Berry Planter",16,2800,"A portable planter that can turn one berry into two or three when watered daily. (Same item as the Portable Berry Planter.)"],["Egg Incubator",16,1350,"Egg incubators are electronic, reusable containers that safely keep and warm Pokémon eggs. (15 lbs)"],["Folding Bicycle",16,950,"A 3-speed bike that folds onto itself. (25 lbs)"],["Lure Module Launcher",16,950,"An electronic setup that deploys scent/light emitters that last for 30 mins that attract Pokémon to your location in wild spaces. (15 lbs)"],["Portable Berry Planter",16,2800,"By planting a berry in a portable berry planter, you create a mini-ecosystem for the berry to rapidly grow into a fruit bearing shrub, often producing two or even three…"],["Signal Scanner",16,650,"Handheld device that detects nearby electronic signals (50ft), recent Poké Ball activity (2 minutes), and strong energy emissions nearby (150ft)."],["Solar Charger",16,50,"An unfolding solar panel that charges devices."],["Blizzard Wear",17,1050,"Carefully made clothes for humans protect them from harmful hail and snowstorms."],["Desert Gear",17,1050,"Carefully made clothes for humans protect them from harmful sandstorms and desert winds."],["Diving Gear",17,1050,"Self contained underwater breathing apparatus . Allows for humans to explore underwater with enough air to breathe for two hours."],["Hazmat Suit",17,750,"Full-body protective suit used to shield trainers from dangerous chemical, biological, radiological, or nuclear harms."],["Wet Suit",17,750,"Insulated body suit for diving in any waters. Includes gloves and flippers ."],["Ninja Tabi",18,800,"+2 to a Acrobatics skill check. You can use only one clothing or equipment bonus per day."],["Bracing Sleeves",18,800,"+2 to a Athletics skill check. You can use only one clothing or equipment bonus per day."],["Domino Mask",18,800,"+2 to a Bluff / Deception skill check. You can use only one clothing or equipment bonus per day."],["Pyramid Hat",18,800,"+2 to a Concentration skill check. You can use only one clothing or equipment bonus per day."],["Padded Jacket",18,800,"+2 to a Constitution skill check. You can use only one clothing or equipment bonus per day."],["Fine Ascot",18,800,"+2 to a Diplomacy skill check. You can use only one clothing or equipment bonus per day."],["Fingerless Gloves",18,800,"+2 to a Engineering / Operation skill check. You can use only one clothing or equipment bonus per day."],["Grand Monocle",18,800,"+2 to a History skill check. You can use only one clothing or equipment bonus per day."],["Cozy Scarf",18,800,"+2 to a Insight skill check. You can use only one clothing or equipment bonus per day."],["Wrist Magnifier",18,800,"+2 to a Investigate skill check. You can use only one clothing or equipment bonus per day."],["New Stethoscope",18,800,"+2 to a Medicine skill check. You can use only one clothing or equipment bonus per day."],["Field Boots",18,800,"+2 to a Nature skill check. You can use only one clothing or equipment bonus per day."],["Tech Visor",18,800,"+2 to a Perception skill check. You can use only one clothing or equipment bonus per day."],["Baller Hacky Sack",18,800,"+2 to a Perform skill check. You can use only one clothing or equipment bonus per day."],["Soft Brush",18,800,"+2 to a Pokémon Handling skill check. You can use only one clothing or equipment bonus per day."],["AR Goggles",18,800,"+2 to a Programming skill check. You can use only one clothing or equipment bonus per day."],["Loose Overcoat",18,800,"+2 to a Sleight of Hand skill check. You can use only one clothing or equipment bonus per day."],["Silent Sneakers",18,800,"+2 to a Stealth skill check. You can use only one clothing or equipment bonus per day."],["Studded Leather",18,1250,"+1 Defense during accuracy checks made against you. (10 lbs)"],["Chainmail",18,3450,"+2 Defense during accuracy checks made against you, and you move 10 ft less per turn. (20 lbs)"],["Full Plate Armor",18,9650,"+3 Defense during accuracy checks made against you, and you move 20 ft less per turn. (50 lbs)"],["Nimble Spandex",18,1250,"+1 Special Defense during accuracy checks made against you. (1 lb)"],["Arctic Wetsuit",18,775,"Cold-resistant wetsuit with gloves and flippers. Swim in frigid water without damage; +4 to Constitution checks against cold."],["All-Sight Helmet",18,975,"+4 to Perception checks in the dark, fog or other obstacles to sight or hearing."],["Biome Camouflage",18,675,"Fatigues for one terrain. +4 to Stealth checks while wearing the matching suit."],["Cleated Boots",18,95,"Your movement is not hindered by mud or other slippery terrain."],["Cross-country Skis",18,675,"+15 ft movement per turn on snow or sand; other terrain is difficult."],["Divers Suit",18,200,"Swimsuit for temperate waters, with flippers. Movement is not hindered underwater."],["Hooked-Finger Gloves",18,675,"+4 to Acrobatics checks when climbing a tree, mountainside or other non-metal surface."],["Ice Vest",18,675,"Cooling vest. +4 to Constitution checks to endure desert or volcano heat."],["Noise Neutralizers",18,675,"Noise-cancelling headset. +4 to Concentration checks when focusing without physical pressure."],["Purrloin Suit",18,675,"Dark full-body suit. +4 to Stealth checks in an urban setting."],["Rebreather",18,9950,"Oxygen recycler: up to 30 minutes of air underwater, then must be cleaned and dried for 1 hour."],["Rollerblades",18,675,"+15 ft movement per turn on smooth surfaces; rough terrain is difficult."],["Snow Suit",18,675,"Warm jacket and pants with hand warmers. +4 to Constitution checks to endure the cold."],["Snow Treks",18,250,"Treat difficult terrain created by ice or snow as normal terrain."],["Pokédex",19,600,"Identifies Pokémon with its camera and brings up their data. About the size of a smartphone."],["C-Gear",19,280,"Wrist-worn smart device connected to your phone or Pokédex: calls, GPS, trainer IDs and more."],["Pokégear",19,280,"Wrist-worn smart device connected to your phone or Pokédex: calls, GPS, trainer IDs and more."],["PokéNav",19,280,"Wrist-worn smart device connected to your phone or Pokédex: calls, GPS, trainer IDs and more."],["Pokétch",19,280,"Wrist-worn smart device connected to your phone or Pokédex: calls, GPS, trainer IDs and more."],["Vs. Seeker",19,280,"Wrist-worn smart device connected to your phone or Pokédex: calls, GPS, trainer IDs and more."],["Xtransceiver",19,280,"Wrist-worn smart device connected to your phone or Pokédex: calls, GPS, trainer IDs and more."],["Pokémon Box Link",19,198000,"Portable access to the Pokémon Bank from anywhere with a signal. Needs about three hours of charging a week. (20 lbs)"],["Backup Solar Battery",19,100,"Recharges with a solar charger. Charges up to four devices from zero to full."],["Ball (Basic)",20,2,"A Poké Ball-sized ball for fetch and simple games."],["Ball (Durable)",20,5,"A tougher ball that resists sharp teeth and extreme temperatures."],["Camping Heater",20,40,"Solar-powered, rechargeable heater for a tent. Runs eight hours on a full charge."],["Camping Stove (Gas)",20,120,"Small gas stove with two fuel canisters (six hours each). Extra canisters 10 P. (4 lbs)"],["Chew/String Toy",20,10,"A chew or string toy in assorted shapes for Pokémon enrichment."],["Chew/String Toy (Tough)",20,15,"A difficult-to-destroy chew or string toy, good for carnivorous Pokémon."],["Campfire Set",20,45,"Kit for cooking outdoors: lighter, fire starters, collapsible stand, tinfoil and a canteen."],["Curry Campfire Kit",20,80,"Everything for Galarian-style curry: pot, stand, fan, ladle and ingredients for 3 large pots. (4 lbs)"],["Frisbee",20,5,"A plastic disk for playing fetch."],["Tea Campfire Kit",20,30,"Metal teapot, four mugs and two starter boxes of teabags. (2 lbs)"],["Tray Feeder",20,100,"Collapsible feeder that attracts small wild Pokémon, depending on the bait. (10 lbs)"],["Feeder Fruit",20,100,"Bait that attracts avian and Bug-type Pokémon, and some furry Pokémon."],["Feeder Nectar",20,100,"Bait that attracts avian, Bug-type and some Grass-type Pokémon."],["Feeder Seeds",20,100,"Bait that attracts avian and small furry Pokémon."],["Ranger Styler",21,8000,"ILLEGAL to sell or buy. Electronic restraint system that makes a wild Pokémon Helpful for a time."],["Snag Machine",21,68000,"EXTREMELY ILLEGAL. Lets thrown Poké Balls capture owned Pokémon; fails on loyalty 3 or higher."],["Dynamax Band",21,48000,"Once per day near a Power Spot, a Pokémon with loyalty 2+ can Dynamax or Gigantamax for 1 minute."],["Mega Ring (Key Stone holder)",21,48000,"Once per day, a Pokémon with a Mega Stone and loyalty 2+ can Mega Evolve for 10 minutes. Needs a Key Stone."],["Mega Stone",21,98000,"A rare stone that enables Mega Evolution for one species."],["Key Stone",21,98000,"The stone worn in a Mega Ring to trigger Mega Evolution."],["Tera Orb",21,48000,"Once per day, a Pokémon with a Tera Type and loyalty 2+ can Terastallize for 10 minutes."],["Z-Ring",21,48000,"With a Z-Crystal attached, once per day a Pokémon with loyalty 2+ can use a Z-Move."],["Z-Crystal",21,98000,"Enables a specific type of Z-Move when used with a Z-Ring."],["Backpack",22,5,""],["Ball bearings (25)",22,10,""],["Bedroll",22,5,""],["Binoculars (Digital)",22,45,""],["Blanket",22,2,""],["Blanket (Winter)",22,10,""],["Block and Tackle",22,50,""],["Bolt Cutter",22,10,""],["Book (Hardcover)",22,10,""],["Book (Paperback)",22,5,""],["Bottle (Glass)",22,3,""],["Bottle (Metal)",22,8,""],["Briefcase",22,5,""],["Cable (Steel, 25 ft)",22,20,""],["Camera (Digital High End)",22,2850,""],["Camera (Digital)",22,450,""],["Camera (Film High End)",22,1050,""],["Canteen",22,5,""],["Case (Aluminum)",22,20,""],["Carabiner (4)",22,6,""],["Cell Phone",22,80,""],["Chain (10 ft)",22,5,""],["Chalk (10 Sticks)",22,1,""],["Clothes (Brand Names)",22,100,""],["Clothes (Custom-Fit High End)",22,1250,""],["Clothes (Designer Brands)",22,350,""],["Clothes (Camo Fatigue)",22,65,""],["Clothes (Generic Brands)",22,35,""],["Clothes (Workout / Outdoors)",22,20,""],["Computer (Desktop)",22,780,""],["Computer (Laptop)",22,1080,""],["Computer (Tablet)",22,880,""],["Cooler bag (Foldable)",22,10,""],["Crowbar",22,10,""],["Duct Tape",22,5,""],["Flashlight",22,2,""],["Flask",22,4,""],["Gas Mask",22,25,""],["Grappling Hook",22,10,""],["Hammer",22,10,""],["Hammer (Sledge)",22,15,""],["Handheld Transceiver (Pair)",22,60,""],["Ink (Bottle)",22,10,""],["Jacket (Rain)",22,65,""],["Jacket (Snow)",22,145,""],["Jacket (Windbreaker)",22,50,""],["Knife (Folding)",22,10,""],["Ladder (Folding, 10ft)",22,15,""],["Lantern (fuel)",22,20,""],["Lantern (battery)",22,20,""],["Lantern (solar)",22,45,""],["Lighter",22,2,""],["Lock (Combination)",22,5,""],["Lock (With Key)",22,6,""],["Luggage Bag (Wheeled)",22,5,""],["Messenger Bag",22,5,""],["Memory Stick (100gb)",22,45,""],["Metal Detector",22,30,""],["Mirror (Signal)",22,4,""],["Mobile Trailer Home (for 1)",22,19800,""],["Mobile Trailer Home (for 4)",22,39800,""],["Multi-Purpose Tool",22,20,""],["Nails (100)",22,5,""],["Night-Vision Goggles",22,350,""],["Nintendo Switch",22,350,""],["Padlock and Key",22,10,""],["Pencils (10 Coloring)",22,2,""],["Pencils (10 Graphite)",22,2,""],["Pens (10 Coloring)",22,2,""],["Pens (5 Writing)",22,2,""],["Pick",22,10,""],["Pitons (5)",22,5,""],["Pokémon Card Booster Pack",22,4,""],["Pole (Steel, 10 ft)",22,5,""],["Rope (50 ft)",22,5,""],["Saddle (Large)",22,35,""],["Saddle (Massive)",22,55,""],["Saddle (Small)",22,15,""],["Shovel (Folding)",22,10,""],["Smartphone",22,580,""],["Soap / Shampoo / Toothpaste",22,4,""],["Tent (Folding, Two-Person)",22,35,""],["Tarp (6x8 ft)",22,10,""],["Tarp (10x12 ft)",22,20,""],["Thermos",22,10,""],["Torch (5)",22,5,""],["Vehicle (Bus)",22,248800,""],["Vehicle (Car)",22,49800,""],["Vehicle (Camper)",22,124800,""],["Vehicle (Motorcycle)",22,4980,""],["Vehicle (Truck)",22,69800,""],["Vehicle (Van)",22,49800,""],["Vial",22,5,""],["Wallet",22,5,""],["Whistle",22,2,""],["Zip Ties (30)",22,10,""]];

/* ---------- Shops ----------
   The GM builds shops and puts them on places. Each shop has its own stock and prices.
   Where things live (no new database rule is needed):
     gm/shops    the GM's full list of shops, including closed ones, hidden items and items still locked.     Only the GM can read it.
     meta/shops  what the players see: only open shops, and in them only the items that are for sale right now.   The GM's page keeps it up to date.
   Players buy from their own browser. A purchase changes only the buyer's own trainer sheet (credits, inventory, a count of what they bought,
   and a purchase record), which the rules already let a player edit. The units left of a limited item are the stock the GM set minus what all
   the trainers' sheets say they have bought, so everyone sees the same number without any shared counter. */
S.ui.shop=S.ui.shop||{view:'floor',sel:'',who:'',cat:'',q:'',qty:{},edit:'',newname:'',tpl:'',addq:'',dstock:'5',addcat:'',rpick:'',lshop:'',lwho:'',ln:60,del:''};
const SHOP_MAX=30,SHOP_ITEMS_MAX=250,SHOP_LOG_MAX=300,SHOP_DOC_MAX=800000;
const SCAT_BY=(()=>{const m=new Map();SCAT.forEach(x=>{const k=dexKey(x[0]);if(!m.has(k))m.set(k,x);});return m;})();
const SHOP_OTHER='Other';
const SHOP_CATS=SCAT_CATS.concat([SHOP_OTHER]);
const fmtP=n=>Math.round(num(n)).toLocaleString('en-US')+' P';
const plName=id=>PD_BY[id]?PD_BY[id].name:'';
let SHOP_PLOPT=null;
const shPlOpt=()=>SHOP_PLOPT||(SHOP_PLOPT=PD.slice().sort(natural).map(f=>[f.id,f.name]));
let shSeq=0;
const shKey=()=>Math.random().toString(36).slice(2,6)+(shSeq++).toString(36)+Date.now().toString(36).slice(-3);

const shG=()=>(S.shopGm&&S.shopGm.shops)||{};
const shP=()=>(S.shopPub&&S.shopPub.shops)||{};
const shRc=()=>(S.shopPub&&S.shopPub.rc)||{};
const shOrder=m=>Object.keys(m).sort((a,b)=>num(m[a].at)-num(m[b].at)||a.localeCompare(b));
const shCanon=v=>JSON.stringify(v,(k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.keys(x).sort().reduce((o,kk)=>{o[kk]=x[kk];return o;},{}):x);

/* how many of an item the trainers have bought between them, and how many are left */
function shSold(sid,k){
  let n=0;
  Object.keys(S.trainers).forEach(u=>{const b=S.trainers[u]&&S.trainers[u].shopBought;if(b&&b[sid])n+=num(b[sid][k]);});
  return n;
}
const shStockOf=x=>(x.stock==null||x.stock==='')?null:Math.max(0,Math.floor(num(x.stock)));
function shLeft(sid,k,s){return s==null?Infinity:Math.max(0,s-shSold(sid,k));}

/* ----- what the players are allowed to see ----- */
function shPubShops(){
  const g=shG(),rc=shRc(),out={};
  shOrder(g).forEach(id=>{
    const s=g[id];
    if(!s)return;
    const seen=s.place&&rc[s.place];
    if(!s.open&&!seen)return;
    const o={n:String(s.name||'Shop'),pl:String(s.place||''),o:s.open?1:0,t:String(s.note||''),at:num(s.at),it:[]};
    if(s.open){
      (Array.isArray(s.items)?s.items:[]).forEach(x=>{
        if(!x||x.hide||x.price==null||x.price==='')return;
        if(x.unlock&&!rc[x.unlock])return;
        o.it.push({k:String(x.k),n:String(x.name||'Item'),c:String(x.cat||''),p:Math.max(0,Math.round(num(x.price))),s:shStockOf(x),d:String(x.desc||'')});
      });
    }
    out[id]=o;
  });
  return out;
}
let shTimer=0;
function shPubSoon(){
  if(!S.me.admin)return;
  clearTimeout(shTimer);
  shTimer=setTimeout(()=>{
    shTimer=0;
    const nv=shPubShops();
    if(shCanon(nv)===shCanon(shP()))return;
    edit('sh','shops','shops',nv);
  },120);
}
function shSetReached(pid,on){
  if(!S.me.admin||!PD_BY[pid])return;
  const rc=Object.assign({},shRc());
  if(on)rc[pid]=true;else delete rc[pid];
  edit('sh','shops','rc',rc);
  shPubSoon();
}

/* ----- buying ----- */
const shBuyer=()=>S.me.admin?(S.trainers[S.ui.shop.who]?S.ui.shop.who:(tids()[0]||'')):S.me.id;
function shBuy(sid,k,qtyRaw){
  const uid=shBuyer(),t=S.trainers[uid];
  if(!t){toast(S.me.admin?'There is no trainer to sell to yet.':'Make your trainer sheet first, then you can shop.');return;}
  if(!S.me.admin&&!S.me.canWrite){toast('You can only look at the table right now.');return;}
  const sh=shP()[sid];
  if(!sh||!sh.o){toast('That shop is closed.');return;}
  const it=(sh.it||[]).find(x=>x.k===k);
  if(!it){toast('That item is not for sale.');return;}
  const qty=clamp(Math.floor(num(qtyRaw))||1,1,99);
  const left=shLeft(sid,k,it.s);
  if(qty>left){toast(left>0?'Only '+left+' left of '+it.n+'.':it.n+' is sold out.');return;}
  const total=it.p*qty,have=num(t.credits);
  if(total>have){toast('Not enough credits: that costs '+fmtP(total)+' and '+(S.me.admin?tName(t):'you')+' '+(S.me.admin?'has':'have')+' '+fmtP(have)+'.');return;}
  edit('t',uid,'credits',have-total);
  const items=(t.items||[]).map(x=>Object.assign({},x));
  const key=dexKey(it.n);
  const row=items.find(x=>dexKey(x.name)===key&&!String(x.note||'').trim());
  if(row)row.qty=num(row.qty)+qty;else items.push({name:it.n,qty,note:''});
  edit('t',uid,'items',items);
  const sb=JSON.parse(JSON.stringify(t.shopBought||{}));
  if(!sb[sid])sb[sid]={};
  sb[sid][k]=num(sb[sid][k])+qty;
  edit('t',uid,'shopBought',sb);
  const log=(Array.isArray(t.shopLog)?t.shopLog:[]).concat([{t:Date.now(),sid,sn:sh.n,k,n:it.n,q:qty,p:it.p,c:total,by:S.me.id}]).slice(-SHOP_LOG_MAX);
  edit('t',uid,'shopLog',log);
  S.ui.shop.qty[sid+'|'+k]=1;
  toast((S.me.admin?'Sold ':'Bought ')+qty+' × '+it.n+' for '+fmtP(total)+(S.me.admin?' to '+tName(t):'')+'.',true);
  render();
}

/* the quantity box next to Buy: keep it between 1 and what is left, and remember it across redraws */
function shQty(t){
  const mx=num(t.max)||99;
  let v=Math.floor(num(t.value));
  if(t.value!==''&&v<1)v=1;
  if(v>mx)v=mx;
  if(t.value!==''&&String(v)!==t.value)t.value=String(v);
  S.ui.shop.qty[t.dataset.sq]=t.value===''?1:v;
}

/* ----- the shop floor: what a player sees ----- */
function shItemsHtml(){
  const u=S.ui.shop,pub=shP(),sh=pub[u.sel];
  if(!sh)return h``;
  if(!sh.o)return h`<p class="sub">This shop is closed right now.${sh.t?h` “${sh.t}”`:''}</p>`;
  const q=String(u.q||'').trim().toLowerCase();
  let list=(sh.it||[]).filter(x=>(!u.cat||x.c===u.cat)&&(!q||(x.n+' '+x.d).toLowerCase().indexOf(q)>=0));
  if(!(sh.it||[]).length)return h`<p class="sub">Nothing is on the shelves yet.</p>`;
  if(!list.length)return h`<p class="sub">Nothing here matches.</p>`;
  const rows=list.map(x=>({x,left:shLeft(u.sel,x.k,x.s)}));
  rows.sort((a,b)=>(a.left===0)-(b.left===0));
  const t=S.trainers[shBuyer()];
  const have=num(t&&t.credits);
  return h`<div class="splist">${rows.map(({x,left})=>{
    const qk=u.sel+'|'+x.k;
    const q0=clamp(Math.floor(num(u.qty[qk]))||1,1,99);
    return h`<div class="spitem ${left===0?'out':''}">
      <div class="spmain">${itemTile(x.n)}<div><b>${x.n}</b>${x.c?h` <span class="pill">${x.c}</span>`:''}${x.d?h`<p class="sub">${x.d}</p>`:''}</div></div>
      <div class="spprice ${x.p>have?'poor':''}">${fmtP(x.p)}</div>
      <div class="spleft">${left===Infinity?'':left===0?'Sold out':left+' left'}</div>
      <div class="spbuy"><input type="number" inputmode="numeric" min="1" max="${left===Infinity?99:Math.max(1,Math.min(99,left))}" value="${q0}" data-sq="${qk}" aria-label="How many ${x.n}"><button class="btn primary sm" data-act="sp_buy" data-sid="${u.sel}" data-k="${x.k}" ${left===0?raw('disabled'):''}>Buy</button></div>
    </div>`;}
  )}</div>`;
}
function shRefresh(){const el=document.getElementById('shoplist');if(el)el.innerHTML=shItemsHtml().s;}
function shFloor(){
  const u=S.ui.shop,pub=shP(),ids=shOrder(pub);
  if(!pub[u.sel])u.sel=(ids.find(i=>pub[i].o)||ids[0]||'');
  const sh=pub[u.sel];
  const uid=shBuyer(),t=S.trainers[uid];
  const cats=sh&&sh.o?[...new Set((sh.it||[]).map(x=>x.c).filter(Boolean))]:[];
  const mine=(t&&Array.isArray(t.shopLog)?t.shopLog:[]).slice(-8).reverse();
  return h`<section class="panel spp"><div class="ph"><h2>Shops</h2>${t?h`<span class="pill credit">${S.me.admin?tName(t)+': ':'You have '}${fmtP(t.credits)}</span>`:''}</div>
    ${!t&&!S.me.admin?h`<div class="banner">You have no trainer sheet yet, so you cannot buy anything. Make one on the Trainer page.</div>`:''}
    ${S.me.admin?h`<div class="fgrid"><label class="fld"><span class="fl">Sell to</span><select data-u="shop.who">${tids().map(id=>h`<option value="${id}" ${id===uid?raw('selected'):''}>${tName(S.trainers[id])}</option>`)}</select></label></div>`:''}
    ${ids.length?h`<div class="sppicks" role="group" aria-label="Shops">${ids.map(id=>h`<button class="sppick" data-act="sp_pick" data-id="${id}" aria-pressed="${String(id===u.sel)}"><b>${pub[id].n}</b><span>${pub[id].pl?plName(pub[id].pl):'Travelling'}</span>${pub[id].o?'':h`<em>Closed</em>`}</button>`)}</div>`
      :h`<p class="sub">No shops are open right now. The GM opens them as the party reaches a town.</p>`}
    ${sh?h`<div class="sphead"><h3>${sh.n}</h3>${sh.pl?h`<span class="sub">${plName(sh.pl)}</span>`:''}${sh.o?h`<span class="pill open">Open</span>`:h`<span class="pill">Closed</span>`}</div>
      ${sh.o&&sh.t?h`<p class="sub">“${sh.t}”</p>`:''}
      ${sh.o&&(sh.it||[]).length?h`<div class="fgrid spflt"><label class="fld"><span class="fl">Search</span><input type="search" data-u="shop.q" value="${u.q}" placeholder="Name or effect" data-nr></label>
        <label class="fld"><span class="fl">Kind</span><select data-u="shop.cat"><option value="">All</option>${cats.map(c=>h`<option value="${c}" ${c===u.cat?raw('selected'):''}>${c}</option>`)}</select></label></div>`:''}
      <div id="shoplist">${shItemsHtml()}</div>`:''}
  </section>
  ${t&&mine.length?h`<section class="panel"><div class="ph"><h2>${S.me.admin?tName(t)+'’s':'Your'} recent purchases</h2></div>
    <div class="spmine">${mine.map(e=>h`<div class="row sp"><span>${e.q} × ${e.n} <span class="sub">${e.sn||''}</span></span><span class="mono">${fmtP(e.c)}</span></div>`)}</div></section>`:''}`;
}

/* ----- the GM's editor ----- */
const SHOP_TPL=[
  ['','An empty shop'],
  ['center','Mart in a Pokémon Center: travel medicine and basic balls'],
  ['mart','Poké Mart: balls, medicine, repels and berries'],
  ['dept','Department store: packs, gear, clothes, tech and goods'],
  ['spec','Specialty shop: stones, TMs, held items and vitamins']
];
function shTplRows(t){
  const by=name=>{const x=SCAT_BY.get(dexKey(name));return x?[x]:[];};
  const cat=names=>SCAT.filter(x=>names.indexOf(SCAT_CATS[x[1]])>=0);
  if(t==='center')return cat(['Potions','Status cures','Revives','Repels']).concat(by('Basic Ball'),by('Great Ball'),by('Ultra Ball'));
  if(t==='mart')return cat(['Poké Balls','Potions','Status cures','Revives','Energy','Battle boosters','Repels','Herbs']).concat(['Oran Berry','Sitrus Berry','Cheri Berry','Chesto Berry','Pecha Berry','Rawst Berry','Aspear Berry','Persim Berry'].reduce((a,n)=>a.concat(by(n)),[]));
  if(t==='dept')return cat(['Packs and kits','Utility','Survival gear','Clothing and armor','Tech','Camping and play','General goods']);
  if(t==='spec')return cat(['Evolution stones','TMs and TRs','Held items','Vitamins','Mints','Contest']);
  return [];
}
const shMkItem=(x,stock)=>({k:shKey(),name:x[0],cat:SCAT_CATS[x[1]],price:x[2],stock,desc:x[3],unlock:'',hide:false});
const shDefStock=()=>{const v=String(S.ui.shop.dstock==null?'':S.ui.shop.dstock).trim();return v===''?null:Math.max(0,Math.floor(num(v)));};
function shRoom(){
  if(JSON.stringify(S.shopGm||{}).length>SHOP_DOC_MAX){toast('The shop list is nearly full. Delete a shop or some items before adding more.');return false;}
  return true;
}
function shEditor(){
  const g=shG(),ids=shOrder(g),u=S.ui.shop,rc=shRc();
  if(!g[u.edit])u.edit=ids.length===1?ids[0]:'';
  const sid=u.edit;
  const s=sid?g[sid]:null;
  const P='shops.'+sid+'.';
  const reached=Object.keys(rc).filter(id=>PD_BY[id]).map(id=>PD_BY[id]).sort(natural);
  return h`<section class="panel"><div class="ph"><h2>Your shops</h2><span class="pill gm">GM only</span><span class="sub">${ids.length} of ${SHOP_MAX}</span></div>
    <p class="sub">Each shop has its own stock and prices. Put it on a place, then open it when the party gets there. Closed shops are hidden from the players, except in places the party has already reached, where they see a Closed sign.</p>
    ${ids.length?h`<div class="splist">${ids.map(id=>{const x=g[id];return h`<div class="spitem">
      <div class="spmain"><div><b>${x.name||'Shop'}</b> <span class="pill ${x.open?'open':''}">${x.open?'Open':'Closed'}</span><p class="sub">${x.place?plName(x.place):'Not on the map'} · ${(x.items||[]).length} items</p></div></div>
      <div class="spbuy"><button class="btn sm" data-act="sp_toggle" data-id="${id}">${x.open?'Close shop':'Open shop'}</button><button class="btn sm ${id===sid?'primary':''}" data-act="sp_edit" data-id="${id}">${id===sid?'Editing':'Edit'}</button></div></div>`;})}</div>`:h`<p class="sub">No shops yet. Make the first one below.</p>`}
    <div class="mgd"><b>New shop</b>
      <div class="fgrid"><label class="fld"><span class="fl">Name</span><input type="text" data-u="shop.newname" value="${u.newname}" placeholder="e.g. Jubilife Poké Mart" data-nr></label>
        <label class="fld"><span class="fl">Start with</span><select data-u="shop.tpl">${SHOP_TPL.map(([k,l])=>h`<option value="${k}" ${k===u.tpl?raw('selected'):''}>${l}</option>`)}</select></label>
        <label class="fld"><span class="fl">Stock of each (blank = unlimited)</span><input type="number" inputmode="numeric" min="0" data-u="shop.dstock" value="${u.dstock}" data-nr></label></div>
      <div class="row"><button class="btn primary sm" data-act="sp_new" ${ids.length>=SHOP_MAX?raw('disabled'):''}>Make the shop</button></div></div>
  </section>
  <section class="panel"><div class="ph"><h2>Where the party has been</h2><span class="pill gm">GM only</span></div>
    <p class="sub">An item can wait for a place: it only goes on sale once the party has reached it. You can also tick a place on its own page on the Map.</p>
    ${reached.length?h`<div class="row spchips">${reached.map(f=>h`<button class="btn sm" data-act="sp_reach" data-id="${f.id}" aria-label="Remove ${f.name}">${f.name} ×</button>`)}</div>`:h`<p class="sub">No places marked yet.</p>`}
    <div class="row"><label class="fld"><span class="fl">Mark a place as reached</span><select data-u="shop.rpick"><option value="">Choose a place</option>${shPlOpt().filter(([id])=>!rc[id]).map(([id,n])=>h`<option value="${id}" ${id===u.rpick?raw('selected'):''}>${n}</option>`)}</select></label>
      <button class="btn sm" data-act="sp_reachadd" ${u.rpick?'':raw('disabled')}>Mark reached</button></div>
  </section>
  ${s?shEdit1(sid,s,P):''}`;
}
function shEdit1(sid,s,P){
  const u=S.ui.shop,items=Array.isArray(s.items)?s.items:[];
  return h`<section class="panel"><div class="ph"><h2>${s.name||'Shop'}</h2><span class="pill gm">GM only</span><span class="sub">${items.length} of ${SHOP_ITEMS_MAX} items</span></div>
    <div class="fgrid">${fText('Shop name','sg','shops',P+'name',S.shopGm,{})}
      ${fSel('Where it is','sg','shops',P+'place',S.shopGm,shPlOpt(),{blank:'Not on the map'})}
      ${fText('A note players see (optional)','sg','shops',P+'note',S.shopGm,{ph:'e.g. Back in ten minutes'})}</div>
    <div class="row">${fCheck('Open for business','sg','shops',P+'open',S.shopGm,false)}</div>
    ${items.length?h`<div class="spedlist">${items.map((x,i)=>{
      const p=P+'items.'+i+'.',stock=shStockOf(x),sold=shSold(sid,x.k),locked=x.unlock&&!shRc()[x.unlock];
      return h`<div class="spedrow ${x.hide?'off':''}">
        <div class="sped1">${fText('Item','sg','shops',p+'name',S.shopGm,{list:'dl-scat'})}${fNum('Price (P)','sg','shops',p+'price',S.shopGm,{min:0})}${fNum('Stock','sg','shops',p+'stock',S.shopGm,{min:0})}</div>
        <div class="sped2">${fSel('Kind','sg','shops',p+'cat',S.shopGm,SHOP_CATS,{blank:'None'})}${fSel('On sale once the party reaches','sg','shops',p+'unlock',S.shopGm,shPlOpt(),{blank:'Always'})}
          <div class="fld"><span class="fl">Status</span><div class="row">${fCheck('Hidden',  'sg','shops',p+'hide',S.shopGm,false)}</div></div></div>
        ${fText('Description','sg','shops',p+'desc',S.shopGm,{})}
        <div class="row sp"><span class="spnotes">${x.price==null||x.price===''?h`<span class="pill warn">Needs a price</span>`:''}${x.hide?h`<span class="pill">Hidden</span>`:''}${locked?h`<span class="pill">Locked until ${plName(x.unlock)}</span>`:''}
          ${stock==null?h`<span class="pill">Unlimited</span>`:h`<span class="pill">${sold} sold · ${Math.max(0,stock-sold)} left</span>`}${stock!=null&&sold>stock?h`<span class="pill warn">Sold ${sold-stock} too many</span>`:''}</span>
          ${rowBtns('sg','shops','shops.'+sid+'.items',i,items.length,false)}</div></div>`;})}</div>`:h`<p class="sub">Nothing on the shelves yet. Add items below.</p>`}
    <div class="mgd"><b>Stock the shelves</b>
      <p class="sub">Type an item from the handbook and its price and description fill in. Anything else you type becomes a custom item you price yourself.</p>
      <div class="fgrid"><label class="fld"><span class="fl">Item</span><input type="text" list="dl-scat" data-u="shop.addq" value="${u.addq}" placeholder="e.g. Great Ball" data-nr></label>
        <label class="fld"><span class="fl">Stock (blank = unlimited)</span><input type="number" inputmode="numeric" min="0" data-u="shop.dstock" value="${u.dstock}" data-nr></label></div>
      <div class="row"><button class="btn sm" data-act="sp_additem" ${items.length>=SHOP_ITEMS_MAX?raw('disabled'):''}>Add the item</button></div>
      <div class="fgrid"><label class="fld"><span class="fl">Or add a whole group</span><select data-u="shop.addcat"><option value="">Choose a kind</option>${SCAT_CATS.map(c=>h`<option value="${c}" ${c===u.addcat?raw('selected'):''}>${c} (${SCAT.filter(x=>SCAT_CATS[x[1]]===c&&x[2]!=null).length})</option>`)}</select></label></div>
      <div class="row"><button class="btn sm" data-act="sp_addcat" ${u.addcat?'':raw('disabled')}>Add every priced item in that group</button></div></div>
    <div class="mgd"><b>Delete this shop</b>
      ${u.del===sid?h`<p class="sub">This removes the shop and its stock list. Purchases already made stay in the players' logs.</p><div class="row"><button class="btn sm danger" data-act="sp_delyes" data-id="${sid}">Yes, delete ${s.name||'this shop'}</button><button class="btn sm" data-act="sp_delno">Keep it</button></div>`
        :h`<div class="row"><button class="btn sm danger" data-act="sp_del" data-id="${sid}">Delete the shop</button></div>`}</div>
  </section>`;
}

/* ----- the GM's purchase log ----- */
function shLogRows(){
  const out=[];
  Object.keys(S.trainers).forEach(uid=>{(Array.isArray(S.trainers[uid].shopLog)?S.trainers[uid].shopLog:[]).forEach(e=>{if(e&&typeof e==='object')out.push(Object.assign({u:uid},e));});});
  return out.sort((a,b)=>num(b.t)-num(a.t));
}
function shLogView(){
  const u=S.ui.shop,all=shLogRows();
  const shops=[...new Map(all.map(e=>[e.sid,e.sn||'Shop'])).entries()];
  let rows=all.filter(e=>(!u.lshop||e.sid===u.lshop)&&(!u.lwho||e.u===u.lwho));
  const total=rows.reduce((a,e)=>a+num(e.c),0);
  const over=[];
  const g=shG();
  Object.keys(g).forEach(id=>{(g[id].items||[]).forEach(x=>{const st=shStockOf(x);if(st!=null){const so=shSold(id,x.k);if(so>st)over.push({shop:g[id].name||'Shop',item:x.name,n:so-st});}});});
  const shown=rows.slice(0,u.ln);
  const when=t=>{const d=new Date(num(t));return d.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' '+d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});};
  return h`<section class="panel"><div class="ph"><h2>Purchase log</h2><span class="pill gm">GM only</span><span class="sub">${rows.length} purchases · ${fmtP(total)}</span></div>
    ${over.length?h`<div class="banner">Sold more than the stock: ${over.map(o=>o.item+' at '+o.shop+' (by '+o.n+')').join('; ')}. Two players bought the last one at the same moment. Fix it on the players' sheets or raise the stock.</div>`:''}
    <div class="fgrid"><label class="fld"><span class="fl">Shop</span><select data-u="shop.lshop"><option value="">All shops</option>${shops.map(([id,n])=>h`<option value="${id}" ${id===u.lshop?raw('selected'):''}>${n}</option>`)}</select></label>
      <label class="fld"><span class="fl">Trainer</span><select data-u="shop.lwho"><option value="">Everyone</option>${tids().map(id=>h`<option value="${id}" ${id===u.lwho?raw('selected'):''}>${tName(S.trainers[id])}</option>`)}</select></label></div>
    ${shown.length?h`<div class="splog">${shown.map(e=>h`<div class="splrow"><span class="when">${when(e.t)}</span><span><b>${tName(S.trainers[e.u])}</b> bought ${e.q} × ${e.n}${num(e.q)>1?h` <span class="sub">at ${fmtP(e.p)} each</span>`:''}<span class="sub"> · ${e.sn||'Shop'}${e.by&&e.by!==e.u?' · sold by the GM':''}</span></span><span class="mono">${fmtP(e.c)}</span></div>`)}</div>
      ${rows.length>shown.length?h`<div class="row"><button class="btn sm" data-act="sp_logmore">Show more (${rows.length-shown.length} older)</button></div>`:''}`
      :h`<p class="sub">No purchases yet.</p>`}
    <p class="sub">Each trainer's sheet keeps its last ${SHOP_LOG_MAX} purchases. The log is built from those sheets.</p>
  </section>`;
}

/* ----- the Shop page ----- */
function shopTab(){
  const u=S.ui.shop;
  if(!S.me.admin)u.view='floor';
  const views=[['floor','Shop floor'],['edit','Edit shops'],['log','Purchase log']];
  return h`${S.me.admin?h`<div class="seg" role="group" aria-label="Shop pages">${views.map(([k,l])=>h`<button data-act="sp_view" data-v="${k}" aria-pressed="${String(u.view===k)}">${l}</button>`)}</div>`:''}
    ${u.view==='edit'&&S.me.admin?shEditor():u.view==='log'&&S.me.admin?shLogView():shFloor()}`;
}

/* ----- on a place's page ----- */
function shPlacePanel(f){
  const admin=!!S.me.admin,rc=shRc();
  if(admin){
    const g=shG(),here=shOrder(g).filter(id=>g[id].place===f.id);
    return h`<section class="panel"><div class="ph"><h2>Shops and the party</h2><span class="pill gm">GM only</span></div>
      <div class="row"><button class="btn sm sppick1" data-act="sp_reach" data-id="${f.id}" aria-pressed="${String(!!rc[f.id])}">${rc[f.id]?'✓ The party has reached '+f.name:'The party has reached '+f.name}</button></div>
      <p class="sub">Items that wait for ${f.name} go on sale once this is ticked.</p>
      ${here.length?h`<div class="splist">${here.map(id=>h`<div class="spitem"><div class="spmain"><div><b>${g[id].name||'Shop'}</b> <span class="pill ${g[id].open?'open':''}">${g[id].open?'Open':'Closed'}</span><p class="sub">${(g[id].items||[]).length} items</p></div></div>
        <div class="spbuy"><button class="btn sm" data-act="sp_toggle" data-id="${id}">${g[id].open?'Close shop':'Open shop'}</button><button class="btn sm" data-act="sp_edit" data-id="${id}">Edit</button></div></div>`)}</div>`
        :h`<p class="sub">No shop is on this place. Make one on the Shop page and choose this place for it.</p>`}
    </section>`;
  }
  const pub=shP(),here=shOrder(pub).filter(id=>pub[id].pl===f.id);
  if(!here.length)return '';
  return h`<section class="panel"><div class="ph"><h2>Shops here</h2></div>
    <div class="splist">${here.map(id=>h`<div class="spitem"><div class="spmain"><div><b>${pub[id].n}</b> <span class="pill ${pub[id].o?'open':''}">${pub[id].o?'Open':'Closed'}</span></div></div>
      <div class="spbuy">${pub[id].o?h`<button class="btn primary sm" data-act="sp_visit" data-id="${id}">Go shopping</button>`:''}</div></div>`)}</div></section>`;
}

/* ----- clicks ----- */
function shAct(b){
  const d=b.dataset,u=S.ui.shop;
  switch(d.act){
    case 'sp_view':u.view=d.v;render();break;
    case 'sp_pick':u.sel=d.id;u.q='';u.cat='';render();break;
    case 'sp_visit':u.sel=d.id;u.view='floor';u.q='';u.cat='';setTab('shop');break;
    case 'sp_buy':{
      const inp=b.parentNode.querySelector('input[data-sq]');
      shBuy(d.sid,d.k,inp?inp.value:1);
      break;}
    default:break;
  }
  if(!S.me.admin)return;
  const g=shG();
  switch(d.act){
    case 'sp_toggle':{
      if(!g[d.id])break;
      edit('sg','shops','shops.'+d.id+'.open',!g[d.id].open);
      render();break;}
    case 'sp_edit':u.edit=d.id;u.view='edit';u.del='';render();break;
    case 'sp_new':{
      if(Object.keys(g).length>=SHOP_MAX||!shRoom())break;
      const id=shKey(),name=String(u.newname||'').trim()||'New shop';
      const st=shDefStock();
      const rows=shTplRows(u.tpl).filter(x=>x[2]!=null).map(x=>shMkItem(x,st));
      const all=Object.assign({},g);
      all[id]={name,place:'',open:false,note:'',at:Date.now(),items:rows};
      edit('sg','shops','shops',all);
      u.edit=id;u.newname='';u.tpl='';u.view='edit';
      toast('“'+name+'” is made. It is closed until you open it.',true);
      render();break;}
    case 'sp_del':u.del=d.id;render();break;
    case 'sp_delno':u.del='';render();break;
    case 'sp_delyes':{
      const all=Object.assign({},g);
      delete all[d.id];
      edit('sg','shops','shops',all);
      u.del='';if(u.edit===d.id)u.edit='';
      render();break;}
    case 'sp_additem':{
      const s=g[u.edit];
      if(!s||!shRoom())break;
      const name=String(u.addq||'').trim();
      if(!name){toast('Type the item to add first.');break;}
      const items=(Array.isArray(s.items)?s.items:[]).slice();
      if(items.length>=SHOP_ITEMS_MAX)break;
      const hit=SCAT_BY.get(dexKey(name));
      items.push(hit?shMkItem(hit,shDefStock()):{k:shKey(),name,cat:'',price:null,stock:shDefStock(),desc:'',unlock:'',hide:false});
      edit('sg','shops','shops.'+u.edit+'.items',items);
      u.addq='';
      toast(hit?'Added '+hit[0]+'.':'Added “'+name+'”. Give it a price so players can buy it.',true);
      render();break;}
    case 'sp_addcat':{
      const s=g[u.edit];
      if(!s||!u.addcat||!shRoom())break;
      const items=(Array.isArray(s.items)?s.items:[]).slice();
      const have=new Set(items.map(x=>dexKey(x.name)));
      const st=shDefStock();
      let n=0;
      SCAT.forEach(x=>{
        if(SCAT_CATS[x[1]]!==u.addcat||x[2]==null||have.has(dexKey(x[0]))||items.length>=SHOP_ITEMS_MAX)return;
        items.push(shMkItem(x,st));n++;
      });
      edit('sg','shops','shops.'+u.edit+'.items',items);
      toast(n?'Added '+n+' items.':'Everything in that group is already here.',true);
      render();break;}
    case 'sp_reach':shSetReached(d.id,!shRc()[d.id]);render();break;
    case 'sp_reachadd':if(u.rpick){shSetReached(u.rpick,true);u.rpick='';}render();break;
    case 'sp_logmore':u.ln+=60;render();break;
    default:break;
  }
}

/* ---------- Contest ribbons and the road to the Grand Festival ----------
   Every trainer sheet has a ribbon case, like the gym badge case: one slot per contest hall, ticked when the trainer wins a
   ribbon there. The case is kept on the trainer's own sheet (trainers/<uid>, field "ribbons"), so the owner and the GM can
   tick it and the existing rules already allow it.
   Which ribbons exist, and how many a trainer needs for the Grand Festival, belongs to the whole table, so it is kept with the
   other table settings (meta/table: "ribbonHalls" and "ribbonNeed"), which every member reads and only the GM writes.
   Until the GM changes the list, the table uses the Sinnoh ribbons from the anime: 17 contest-hall towns and the Aqua Ribbon,
   the prize of the Wallace Cup at Lake Valor. Five were needed to enter the Sinnoh Grand Festival.
   Nothing here is handbook text. The contest rules it points to are written in the table's own words. */
const RIB_DEFAULT=[
  ['jubilife','Jubilife','Jubilife City'],['floaroma','Floaroma','Floaroma Town'],['alamos','Alamos','Alamos Town'],
  ['hearthome','Hearthome','Hearthome City'],['sage','Sage','Sage Town'],['solaceon','Solaceon','Solaceon Town'],
  ['aqua','Aqua','Lake Valor · Wallace Cup'],['celestic','Celestic','Celestic Town'],['majolica','Majolica','Majolica Town'],
  ['gerbera','Gerbera','Gerbera Town'],['beachrose','Beach Rose','Beach Rose Town'],['chocovine','Chocovine','Chocovine Town'],
  ['sandalstraw','Sandalstraw','Sandalstraw Town'],['lilypad','Lilypad','Lilypad Town'],['brussel','Brussel','Brussel Town'],
  ['daybreak','Daybreak','Daybreak Town'],['neighborly','Neighborly','Neighborly Town'],['arrowroot','Arrowroot','Arrowroot Town']
];
const RIB_NEED=5,RIB_MAX=40;
S.ui.rib=S.ui.rib||{reset:false};
['rb_ready','rb_road','rb_gf'].forEach(k=>{if(S.ui.ref&&S.ui.ref.open&&!(k in S.ui.ref.open))S.ui.ref.open[k]=true;});

const ribCustom=()=>Array.isArray(S.meta.ribbonHalls);
const ribDefaults=()=>RIB_DEFAULT.map(([k,n,t])=>({k,n,t}));
function ribHalls(){
  const src=ribCustom()?S.meta.ribbonHalls:ribDefaults();
  const seen=new Set(),out=[];
  src.forEach(x=>{
    if(!x||typeof x!=='object')return;
    const k=String(x.k||'');
    if(!k||seen.has(k))return;
    seen.add(k);
    out.push({k,n:String(x.n||'').trim()||'Unnamed',t:String(x.t||'').trim()});
  });
  return out;
}
const ribNeedEff=halls=>Math.min(clamp(Math.floor(num(S.meta.ribbonNeed))||RIB_NEED,1,RIB_MAX),Math.max(1,halls.length));
const ribCount=(t,halls)=>(halls||ribHalls()).filter(x=>t&&t.ribbons&&t.ribbons[x.k]).length;
const ribColor=k=>{let a=7;for(let i=0;i<k.length;i++)a=(a*31+k.charCodeAt(i))>>>0;return 'hsl('+(a%360)+' 62% 52%)';};
/* a simple original rosette with two tails; drawn in each ribbon's own colour by CSS */
const RIB_GLYPH=(()=>{
  const p=[];
  for(let i=0;i<24;i++){const r=i%2?9:11,a=Math.PI*i/12-Math.PI/2;p.push((16+r*Math.cos(a)).toFixed(2)+','+(12.5+r*Math.sin(a)).toFixed(2));}
  return raw('<svg class="gl" viewBox="0 0 32 32" aria-hidden="true" fill="currentColor"><path d="M10.5 19.5L6.8 29.6l4.7-2.3 2.9 3.7 2-10.2z"/><path d="M21.5 19.5l3.7 10.1-4.7-2.3-2.9 3.7-2-10.2z" opacity=".82"/><polygon points="'+p.join(' ')+'"/><circle cx="16" cy="12.5" r="5" fill="rgba(10,16,40,.38)"/><circle cx="16" cy="12.5" r="2" fill="rgba(255,255,255,.85)"/></svg>');
})();
const ribBar=(n,need)=>h`<div class="rbar" role="img" aria-label="${n} of ${need} ribbons toward the Grand Festival"><i ${raw('style="width:'+Math.min(100,Math.round(100*n/Math.max(1,need)))+'%"')}></i></div>`;
/* a short line for the overview card */
function ribBrief(t){
  const halls=ribHalls(),n=ribCount(t,halls),need=ribNeedEff(halls);
  return n>=need?n+' · Grand Festival ✓':n+' of '+need;
}

/* ----- the ribbon case on a trainer sheet ----- */
function ribCase(uid,t,ro){
  const halls=ribHalls(),n=ribCount(t,halls),need=ribNeedEff(halls);
  const rb=t.ribbons||{},pop=S.ui.pop,left=Math.max(0,need-n);
  return h`<div class="ribhead"><h3 class="refg">Contest ribbons</h3><span class="mono sub">${n}/${halls.length}</span>
      <span class="pill ${left?'':'open'}">${left?left+' more for the Grand Festival':'Qualified for the Grand Festival'}</span></div>
    ${ribBar(n,need)}
    ${halls.length?h`<div class="case rib ${left?'':'full'}" role="group" aria-label="Ribbon case, ${n} of ${halls.length} earned">
      ${halls.map(x=>h`<button class="slot ${rb[x.k]?'on':''}${rb[x.k]&&pop&&pop.uid===uid&&pop.key==='r:'+x.k?' pop':''}" ${raw('style="--bc:'+ribColor(x.k)+'"')} data-act="rb_toggle" data-key="${x.k}" data-uid="${uid}" aria-pressed="${String(!!rb[x.k])}" title="${x.n} Ribbon${x.t?', '+x.t:''}" ${dis(ro)}><span class="medal">${RIB_GLYPH}</span><span class="bn">${x.n}</span>${x.t?h`<small>${x.t}</small>`:''}</button>`)}
    </div>`:h`<p class="sub">The GM has not set up any ribbons yet.</p>`}
    <p class="sub">${need} ribbons from ${need} different contest halls opens the Grand Festival. <button class="lnk" data-act="rb_goto">How it works</button></p>`;
}

/* ----- the Ribbons page inside Contests ----- */
function ribView(){
  const halls=ribHalls(),need=ribNeedEff(halls),ids=tids(),custom=ribCustom();
  const holders=k=>ids.filter(u=>S.trainers[u]&&S.trainers[u].ribbons&&S.trainers[u].ribbons[k]).map(u=>tName(S.trainers[u]));
  const ready=ids.map(u=>{const t=S.trainers[u];const n=ribCount(t,halls);return h`<div class="ribrow"><span class="rn"><b>${tName(t)}</b></span><span class="mono sub">${n} of ${need}</span>${ribBar(n,need)}<span class="pill ${n>=need?'open':''}">${n>=need?'Qualified':(need-n)+' to go'}</span></div>`;});
  return h`<div class="refp">
    <p class="sub">The ribbon case on each trainer sheet tracks contest ribbons the way the badge case tracks gym badges. This page is how the table gets from the first ribbon to the Grand Festival.</p>
    ${refSec('rb_ready','Who is ready for the Grand Festival',ids.length?h`<div class="ribrows">${ready}</div><p class="sub">${need} ribbons from ${need} different contest halls qualify a trainer.</p>`:h`<p class="sub">No trainers yet.</p>`)}
    ${refSec('rb_road','The road to the Grand Festival',h`<ul class="reful">
      <li><b>Win ribbons.</b> A contest hall gives its Contest Ribbon to whoever has the most Star Points at the end of the Award stage. Each hall has its own ribbon, which goes in the ribbon case on the trainer sheet. Winning again at a hall whose ribbon you already hold does not add to the count: it is one honour per contest hall.</li>
      <li><b>${need} ribbons from ${need} different halls.</b> Collect that many and you are invited to the Grand Festival. This is the anime’s rule: five ribbons from one region. The GM can change the number below.</li>
      <li><b>Registering.</b> Your first ribbon registers you in the region’s contest circuit. The GM’s Guide says the Grand Festival is usually held a week or two before the League championships, and that circuits can have strict expectations for attire and how you carry yourself.</li>
      <li><b>Using the ribbons up.</b> In the anime, the ribbons used to enter a Grand Festival cannot be used again. If your table wants that, the GM can untick those ribbons on the sheet afterwards.</li>
    </ul>`)}
    ${refSec('rb_gf','How the Grand Festival runs',h`<ul class="reful">
      <li><b>Appeal stage: Double Performance.</b> Every trainer brings two Pokémon, and both take part in each of the five appeals. Each round, both Pokémon pick a move and the two are combined: take the contest type from one move and the keyword from the other. Neither Pokémon can repeat the move it used last round unless that move is Reliable. This is the handbook’s variant, and the Sinnoh Grand Festival in the anime used it.</li>
      <li><b>The cut.</b> The best performers go on to the finals. In the anime, 32 of the 108 coordinators moved on, in four blocks of eight. Choose the number that fits the size of your field.</li>
      <li><b>Finals: Rival Showcase.</b> Trainers are paired off and perform in direct opposition each round. Appeals are judged against each other rather than alone, and a typical Star Point is “most rounds won against opposing coordinators”. The winner of the last pairing takes the Ribbon Cup and the title of Top Coordinator.</li>
      <li><b>The prize.</b> The GM’s Guide says a Grand Festival champion can walk away with over 400,000 Pokécredits, sometimes more than a League championship pays.</li>
      <li>The handbook’s Double Performance and Rival Showcase rules are on the <button class="lnk" data-act="ct_view" data-v="how">How contests work</button> page under Variations.</li>
    </ul>`)}
    ${refSec('rb_circ',custom?'This table’s contest circuit':'The Sinnoh contest circuit',h`
      <p class="sub">${custom?'The GM has set up this table’s own list of ribbons.':'This is the list of ribbons from the anime’s Sinnoh region: 17 contest-hall towns and the Aqua Ribbon, the prize of the Wallace Cup at Lake Valor. Most of these towns exist only in the anime, and the Alamos Ribbon was only ever seen in an end-credits sequence. The GM can rename them, swap in places from your own map, and add or remove ribbons.'}</p>
      ${halls.length?h`<ul class="ribl">${halls.map(x=>{const w=holders(x.k);return h`<li><span class="ribdot" ${raw('style="--bc:'+ribColor(x.k)+'"')}></span><b>${x.n} Ribbon</b>${x.t?h` <span class="sub">${x.t}</span>`:''}${w.length?h`<span class="ribwho">${w.join(', ')}</span>`:''}</li>`;})}</ul>`:h`<p class="sub">No ribbons yet.</p>`}`)}
    ${S.me.admin?ribEditor(custom):''}
  </div>`;
}

/* ----- the GM's editor ----- */
const ids_holding=k=>tids().filter(u=>S.trainers[u]&&S.trainers[u].ribbons&&S.trainers[u].ribbons[k]).length;
function ribEditor(custom){
  const raws=custom?S.meta.ribbonHalls:[];
  return h`<section class="panel ribed"><div class="ph"><h2>Set up the ribbons</h2><span class="pill gm">GM only</span></div>
    <div class="fgrid">${fNum('Ribbons needed for the Grand Festival','meta','table','ribbonNeed',S.meta,{min:1,max:RIB_MAX})}</div>
    ${custom?h`<div class="spedlist">${raws.map((x,i)=>h`<div class="spedrow"><div class="sped1">${fText('Ribbon name (without the word Ribbon)','meta','table','ribbonHalls.'+i+'.n',S.meta,{ph:'e.g. Jubilife'})}${fText('Town or event','meta','table','ribbonHalls.'+i+'.t',S.meta,{ph:'e.g. Jubilife City'})}</div>
        <div class="row sp"><span class="sub">${ids_holding(x&&x.k)} of ${tids().length} trainers hold it</span>${rowBtns('meta','table','ribbonHalls',i,raws.length,false)}</div></div>`)}</div>
      <div class="row"><button class="btn sm" data-act="rb_add" ${raws.length>=RIB_MAX?raw('disabled'):''}>Add a ribbon</button>
        ${S.ui.rib.reset?h`<button class="btn sm danger" data-act="rb_resetyes">Yes, go back to the anime’s list</button><button class="btn sm" data-act="rb_resetno">Keep my list</button>`:h`<button class="btn sm ghost" data-act="rb_reset">Use the anime’s list again</button>`}</div>
      <p class="sub">Removing a ribbon takes it out of every trainer’s case and count. The ticks stay saved on the sheets, but only ribbons on this list are counted or shown.</p>`
      :h`<p class="sub">The table is using the anime’s list of ${RIB_DEFAULT.length} ribbons. To rename them, remove some, or add your own, start from that list.</p>
      <div class="row"><button class="btn sm" data-act="rb_custom">Edit the list</button></div>`}
  </section>`;
}

function ribAct(b){
  const d=b.dataset,o=S.ui.rib;
  switch(d.act){
    case 'rb_toggle':{
      const t=S.trainers[d.uid];
      if(!t||!canEditT(d.uid))return;
      const on=!(t.ribbons&&t.ribbons[d.key]);
      edit('t',d.uid,'ribbons.'+d.key,on);
      if(on){const p={uid:d.uid,key:'r:'+d.key};S.ui.pop=p;setTimeout(()=>{if(S.ui.pop===p)S.ui.pop=null;},1400);}
      else S.ui.pop=null;
      render();break;}
    case 'rb_goto':
      S.ui.ct.v='rib';S.ui.toTop=true;
      if(S.tab!=='contest')setTab('contest');else render();
      break;
    case 'rb_custom':
      if(!S.me.admin||ribCustom())return;
      edit('meta','table','ribbonHalls',ribDefaults());
      render();break;
    case 'rb_add':{
      if(!S.me.admin||!ribCustom())return;
      const arr=S.meta.ribbonHalls.slice();
      if(arr.length>=RIB_MAX)return;
      arr.push({k:'c'+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36),n:'',t:''});
      edit('meta','table','ribbonHalls',arr);
      render();break;}
    case 'rb_reset':o.reset=true;render();break;
    case 'rb_resetno':o.reset=false;render();break;
    case 'rb_resetyes':
      if(!S.me.admin)return;
      o.reset=false;
      edit('meta','table','ribbonHalls',null);
      render();break;
  }
}

/* the ribbon chosen in the Award honors form: the first ribbon until the GM picks, "" for a ribbon with no slot in the case */
function awardRibbon(){
  const a=S.ui.award,halls=ribHalls();
  if(a.ribbon==='')return '';
  return halls.some(x=>x.k===a.ribbon)?a.ribbon:(halls[0]?halls[0].k:'');
}

/* ---------- NPC trainers: people the GM runs, with Pokémon of their own ----------
   Same idea as the hidden foes in a battle, with two documents:
     gm/nt_<id>   the NPC itself: notes, secrets and every Pokémon's full sheet. Firestore's rules let only the GM read it,
                  so a player's browser never receives it.
     meta/npcs    what the table may see: only the NPCs the GM has shown, and of those only the parts ticked.
   A Pokémon on an NPC's team is copied into a battle as a foe (gm/battle), so the battle's own reveal controls apply. */
S.ui.nt=S.ui.nt||{open:{},mon:{},more:{}};

const NTS=()=>S.gmNt||{};
const ntIds=()=>Object.keys(NTS()).sort((a,b)=>num(NTS()[a].order)-num(NTS()[b].order)||num(NTS()[a].createdAt)-num(NTS()[b].createdAt));
const ntName=nt=>(nt&&String(nt.name||'').trim())||'Unnamed NPC';
const ntTeam=nt=>(nt&&Array.isArray(nt.team))?nt.team:[];
const ntPub=id=>(S.npcPub&&S.npcPub.n&&S.npcPub.n[id])||null;
const newMonId=()=>'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const ntMonName=m=>m.nick||m.sp||'New Pokémon';
const ntShown=m=>{const s=(m&&m.sh)||{};return !!(num(s.name)||num(s.pic)||num(s.types)||num(s.item));};
/* the trainer's name on a foe, once the table has been shown that NPC */
const ntOwnerLabel=f=>{const p=f&&f.nt?ntPub(f.nt):null;return p?p.n:null;};
/* the GM's own view of whose Pokémon a foe is */
const ntFoeOwner=f=>f?(f.nt&&NTS()[f.nt]?ntName(NTS()[f.nt]):(f.own||'')):'';
function ntInBattle(id,mid){
  const fo=foesOf();
  return Object.keys(fo).some(cid=>fo[cid].nt===id&&fo[cid].ni===mid&&btC(cid));
}

/* ----- what the table sees ----- */
function ntPubOf(nt){
  if(!nt||!num(nt.rev&&nt.rev.on))return null;
  const r=nt.rev||{};
  const txt=k=>String(nt[k]||'').trim();
  const cls=[txt('cls'),txt('adv')].filter(Boolean).join(' · ');
  const st=nt.stats||{},hp=nt.hp||{};
  return {
    n:ntName(nt),
    r:num(r.role)&&txt('role')?txt('role'):null,
    pl:num(r.place)&&txt('place')?txt('place'):null,
    b:num(r.notes)&&txt('notes')?txt('notes'):null,
    lv:num(r.cls)?(num(nt.level)||null):null,
    cl:num(r.cls)&&cls?cls:null,
    st:num(r.stats)?{hp:num(hp.max),atk:num(st.atk),def:num(st.def),spa:num(st.spa),spd:num(st.spd),spe:num(st.spe)}:null,
    it:num(r.items)?(nt.items||[]).filter(x=>String(x&&x.name||'').trim()).map(x=>({n:String(x.name).trim(),q:num(x.qty)})):null,
    m:ntTeam(nt).filter(ntShown).map(m=>{
      const s=m.sh||{};
      const it=String(m.item||'').trim();
      return {i:String(m.id||''),n:num(s.name)?ntMonName(m):'Unknown Pokémon',sp:num(s.pic)?String(m.sp||''):'',ty:num(s.types)?(m.ty||[]).filter(Boolean):null,it:num(s.item)&&it?it:null};
    })
  };
}
/* The portrait. The GM's copy sits in the NPC's own document (`img`, the whole picture, plus `imgc`, how it sits in the frame),
   which only the GM can read. The table's copy is a separate small document, mapimg/npc_<id>, that exists only while the NPC is
   shown and its Picture box is ticked. It rides in the collection the map already uses, so the existing rules cover it. */
const ntImgOk=v=>/^data:image\//.test(String(v||''));
const ntPicDoc=id=>'npc_'+id;
/* how the picture sits in its frame: the point that stays put (x, y in percent) and the zoom */
const ntCrop=c=>{
  c=c||{};
  return {x:clamp(Math.round(num(c.x==null?50:c.x)*10)/10,0,100),y:clamp(Math.round(num(c.y==null?50:c.y)*10)/10,0,100),z:clamp(Math.round(num(c.z==null?1:c.z)*100)/100,1,3)};
};
const ntPicOf=id=>{const c=S.mapChunks&&S.mapChunks[ntPicDoc(id)];return c&&ntImgOk(c.d)?c.d:'';};
const ntPicCrop=id=>ntCrop(S.mapChunks&&S.mapChunks[ntPicDoc(id)]&&S.mapChunks[ntPicDoc(id)].c);
function ntPicSync(id){
  if(!S.me.admin)return;
  const nt=NTS()[id];
  const r=(nt&&nt.rev)||{};
  const want=nt&&num(r.on)&&num(r.pic)&&ntImgOk(nt.img)?String(nt.img):'';
  const have=ntPicOf(id);
  if(!want&&!have)return;
  const wc=ntCrop(nt&&nt.imgc),hc=ntPicCrop(id);
  if(want&&want===have&&JSON.stringify(wc)===JSON.stringify(hc))return;
  const k=ntPicDoc(id),ref=S.db.collection('mapimg').doc(k),v=Date.now();
  if(want&&want===have){
    /* only the frame changed: no need to send the picture again */
    S.mapChunks[k]=Object.assign({},S.mapChunks[k],{c:wc,v});
    ref.update({c:wc,v}).catch(e=>fail(e));
  }else if(want){
    S.mapChunks[k]={d:want,c:wc,v};
    ref.set({d:want,c:wc,v}).catch(e=>fail(e));
  }else{
    delete S.mapChunks[k];
    ref.delete().catch(e=>fail(e));
  }
}
/* the picture in its frame. cls: "thumb" (square), "edit" (the GM's, draggable) or nothing (4:5 portrait) */
function ntPortrait(src,crop,cls,attrs){
  const u=imgSrc(src);
  if(!u)return '';
  const c=ntCrop(crop);
  return h`<div class="ptr ${cls||''}" ${attrs||''} ${raw('style="--x:'+c.x+'%;--y:'+c.y+'%;--z:'+c.z+'"')}><img src="${u}" alt="" draggable="false"></div>`;
}
/* the frame controls under the GM's picture */
function ntFramePanel(id,nt){
  const c=ntCrop(nt.imgc);
  return h`<div class="ptfr"><label class="fld"><span class="fl">Zoom</span><input type="range" class="ptz" data-id="${id}" min="1" max="3" step="0.05" value="${c.z}" aria-label="Zoom the picture"></label>
    <div class="row"><button class="btn sm" data-act="nt_fr0" data-id="${id}">Reset frame</button><button class="btn sm" data-act="lbx" data-k="${'gt|'+id}">View full picture</button></div>
    <span class="sub">Drag the picture to move it. Arrow keys work too.</span></div>`;
}
/* ----- moving and zooming the picture in its frame ----- */
let ntFrDrag=null,ntFrTimer=0;
function ntFrameSave(id,c){
  edit('gt',id,'imgc',ntCrop(c));
  clearTimeout(ntFrTimer);
  ntFrTimer=setTimeout(()=>ntPublish(id),350);
}
function ntFrameApply(f,c){
  const im=f&&f.querySelector('img');
  if(!im)return;
  const set=el=>{el.style.setProperty('--x',c.x+'%');el.style.setProperty('--y',c.y+'%');el.style.setProperty('--z',c.z);};
  set(f);
  /* the small picture on her card in the list follows along */
  const th=f.closest('.ntcard')&&f.closest('.ntcard').querySelector('.nthd .ptr');
  if(th)set(th);
}
/* how far the zoomed picture overhangs the frame, in pixels: a full sweep of x or y from 0 to 100 moves the picture by this much */
function ntFrameGeom(f,z){
  const im=f.querySelector('img'),r=f.getBoundingClientRect();
  const nw=im&&im.naturalWidth||r.width,nh=im&&im.naturalHeight||r.height;
  const k=Math.max(r.width/nw,r.height/nh);
  return {ox:nw*k*z-r.width,oy:nh*k*z-r.height};
}
function ntFrameStart(f,e){
  const id=f.dataset.id,nt=NTS()[id];
  if(!nt||!S.me.admin)return;
  const c=ntCrop(nt.imgc);
  ntFrDrag={id,f,x0:e.clientX,y0:e.clientY,c0:c,c,g:ntFrameGeom(f,c.z)};
  try{f.setPointerCapture(e.pointerId);}catch(err){}
  try{f.focus({preventScroll:true});}catch(err){}
  f.classList.add('drag');
  e.preventDefault();
}
function ntFrameMove(e){
  const d=ntFrDrag;
  if(!d)return;
  const c=Object.assign({},d.c0);
  if(d.g.ox>0.5)c.x=clamp(d.c0.x-(e.clientX-d.x0)/d.g.ox*100,0,100);
  if(d.g.oy>0.5)c.y=clamp(d.c0.y-(e.clientY-d.y0)/d.g.oy*100,0,100);
  d.c=ntCrop(c);
  ntFrameApply(d.f,d.c);
}
function ntFrameEnd(){
  const d=ntFrDrag;
  if(!d)return;
  ntFrDrag=null;
  d.f.classList.remove('drag');
  if(JSON.stringify(d.c)!==JSON.stringify(d.c0))ntFrameSave(d.id,d.c);
}
function ntFrameKey(f,e){
  const id=f.dataset.id,nt=NTS()[id];
  if(!nt||!S.me.admin)return false;
  const step=e.shiftKey?10:3;
  const dx={ArrowRight:-step,ArrowLeft:step}[e.key]||0,dy={ArrowDown:-step,ArrowUp:step}[e.key]||0;
  if(!dx&&!dy)return false;
  const c=ntCrop(nt.imgc),g=ntFrameGeom(f,c.z);
  if(g.ox>0.5)c.x=clamp(c.x+dx,0,100);
  if(g.oy>0.5)c.y=clamp(c.y+dy,0,100);
  const n=ntCrop(c);
  ntFrameApply(f,n);
  ntFrameSave(id,n);
  e.preventDefault();
  return true;
}
function ntFrameZoom(t,commit){
  const id=t.dataset.id,nt=NTS()[id];
  if(!nt||!S.me.admin)return;
  const c=ntCrop(Object.assign({},nt.imgc,{z:+t.value}));
  const f=t.closest('.idimg')&&t.closest('.idimg').querySelector('.ptr.edit');
  if(f)ntFrameApply(f,c);
  if(commit)ntFrameSave(id,c);
}
/* ----- the full picture, in front of the page ----- */
function lbxSrc(k){
  const p=String(k||'').split('|'),id=p[1];
  if(p[0]==='npc'){
    const src=ntPicOf(id),pub=S.npcPub&&S.npcPub.n&&S.npcPub.n[id];
    return src?{src,name:(pub&&pub.n)||'Trainer'}:null;
  }
  if(p[0]==='gt'&&S.me.admin){const nt=NTS()[id];return nt&&ntImgOk(nt.img)?{src:nt.img,name:ntName(nt)}:null;}
  return null;
}
function lbxRender(){
  const el=$('#lbx');
  if(!el)return;
  const v=S.ui.lbx?lbxSrc(S.ui.lbx):null;
  if(!v){
    if(S.ui.lbx)S.ui.lbx=null;
    if(!el.hidden){el.hidden=true;el.innerHTML='';document.documentElement.classList.remove('lbx-on');}
    return;
  }
  const sig=S.ui.lbx+'|'+v.src.length+'|'+v.name;
  if(!el.hidden&&el.dataset.sig===sig)return;
  el.dataset.sig=sig;
  el.hidden=false;
  document.documentElement.classList.add('lbx-on');
  el.innerHTML=h`<figure class="lbx-card" role="dialog" aria-modal="true" aria-label="${'Picture of '+v.name}"><img src="${imgSrc(v.src)}" alt="${'Picture of '+v.name}"><figcaption><b>${v.name}</b><button class="btn sm" id="lbx-x" data-act="lbxx">Close</button></figcaption></figure>`.s;
}
function lbxOpen(k){
  if(!lbxSrc(k))return;
  S.ui.lbx=k;
  lbxRender();
  const b=$('#lbx-x');
  if(b)b.focus({preventScroll:true});
}
function lbxClose(){
  const k=S.ui.lbx;
  S.ui.lbx=null;
  lbxRender();
  if(k){const b=document.querySelector('[data-act="lbx"][data-k="'+CSS.escape(k)+'"]');if(b)b.focus({preventScroll:true});}
}
/* writes the public copy only when it has changed. Hiding the NPC removes it. */
function ntPublish(id){
  if(!S.me.admin)return;
  const nt=NTS()[id];
  const o=nt?ntPubOf(nt):null;
  const cur=(S.npcPub&&S.npcPub.n)||{};
  if(o){
    if(JSON.stringify(cur[id])!==JSON.stringify(o))edit('np','npcs','n.'+id,o);
  }else if(cur[id]){
    const n=Object.assign({},cur);delete n[id];
    edit('np','npcs','n',n);
  }
  /* foes of this NPC carry the trainer's name once it is shown, and lose it when it is hidden again */
  const fo=foesOf();
  Object.keys(fo).forEach(cid=>{if(fo[cid].nt===id&&btC(cid))foePublish(cid);});
  ntPicSync(id);
}
function ntPreview(nt){
  const p=ntPubOf(nt);
  if(!p)return 'Nothing. The table does not know this NPC exists.';
  const bits=['the name “'+p.n+'”'];
  if(p.r)bits.push('the role');
  if(p.pl)bits.push('where you met');
  if(num(nt.rev&&nt.rev.pic)&&ntImgOk(nt.img))bits.push('the picture');
  if(p.b)bits.push('your notes');
  if(p.lv!=null||p.cl)bits.push('level and class');
  if(p.st)bits.push('stats');
  if(p.it)bits.push(p.it.length+(p.it.length===1?' item':' items'));
  bits.push(p.m.length?p.m.length+(p.m.length===1?' Pokémon':' Pokémon')+' (what you ticked for each)':'no Pokémon');
  return bits.join(', ');
}

/* ----- building the roster ----- */
function ntNew(){
  if(!S.me.admin)return;
  const id=S.db.collection('gm').doc().id;
  newDoc('gt',id,{name:'',role:'',place:'',notes:'',secret:'',cls:'',adv:'',level:1,hp:{cur:20,max:20},stats:{atk:2,def:2,spa:2,spd:2,spe:2},talents:{},features:[],items:[],megaUsed:false,team:[],rev:{on:false,role:false,place:false,notes:false,pic:false,cls:false,stats:false,items:false},img:'',order:Date.now(),createdAt:Date.now()});
  S.ui.nt.open[id]=true;
  render();
}
/* NPCs made before the trainer sheet existed get its fields the first time they are opened */
function ntEnsure(id){
  const nt=NTS()[id];
  if(!nt)return;
  const d={cls:'',adv:'',level:1,hp:{cur:20,max:20},stats:{atk:2,def:2,spa:2,spd:2,spe:2},talents:{},features:[],items:[],megaUsed:false};
  Object.keys(d).forEach(k=>{if(nt[k]===undefined)edit('gt',id,k,d[k]);});
  ['cls','stats','items','pic'].forEach(k=>{if(!nt.rev||nt.rev[k]===undefined)edit('gt',id,'rev.'+k,false);});
}
/* a Pokémon whose species can Mega Evolve starts with the official details, ready to be switched on in a battle */
function ntMegaAuto(mon){
  const si=speciesInfo(mon.sp);
  const list=si&&!si.form?MEGAS.filter(x=>x.b===si.id):[];
  return list.length?megaPreset(pickMega(mon,list),si):null;
}
/* the Key Stone charge comes back when the battle ends */
function ntEndBattle(){
  if(!S.me.admin)return 0;
  let n=0;
  ntIds().forEach(id=>{if(NTS()[id].megaUsed){edit('gt',id,'megaUsed',false);n++;}});
  return n;
}
/* a d20 check for an NPC, rolled by the GM and logged under the GM's name unless "Roll in secret" is on */
function ntRoll(label,bonus,tal){
  const r1=rollOnce();
  let pick=r1,note='';
  if(S.ui.adv!=='normal'){
    const r2=rollOnce();
    const better=S.ui.adv==='adv';
    pick=(better?r2.base>r1.base:r2.base<r1.base)?r2:r1;
    note=' ('+(better?'advantage':'disadvantage')+': '+r1.base+' / '+r2.base+')';
  }
  const e=chkEntry(label,pick.base+bonus+tal,'d20 '+pick.txt+' = '+pick.base+' + mod '+bonus+(tal?' + talent '+tal:'')+note);
  e.gm=true;
  logRoll(e);
  renderRoll();
}
async function ntAddMon(id){
  if(!S.me.admin||!NTS()[id])return;
  const u=S.ui.nt;
  const sp=String(u['sp_'+id]||'').trim(),nick=String(u['nk_'+id]||'').trim();
  if(!sp){toast('Type a species first.');return;}
  u['sp_'+id]='';u['nk_'+id]='';
  const pr=ptaResolve(sp);
  let rec=null;
  if(pr)rec=ptaRec(pr)||await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr));
  const si=rec?null:speciesInfo(sp);
  const nt=NTS()[id];
  if(!nt)return;
  const mid=newMonId();
  const mon=Object.assign({id:mid,nick,bonus:zeroStats(),notes:'',item:'',up:'',down:'',natureName:'',sh:{name:false,pic:false,types:false,item:false}},foeFromRec(rec,si,sp));
  mon.mega=ntMegaAuto(mon);
  edit('gt',id,'team',ntTeam(nt).concat([mon]));
  u.mon={};u.mon[mid]=true;
  toast('Gave '+sp+' to '+ntName(nt)+(rec||si?'':'. That species is not in the data, so fill in its numbers by hand')+(mon.mega?'. Mega Evolution details added ('+mon.mega.form+')':'')+'.',true);
  render();
}
/* replaces a Pokémon's types, stats, passives and moves with the handbook entry for its species */
async function ntFillMon(id,mid){
  if(!S.me.admin)return;
  const nt=NTS()[id];
  const i=ntTeam(nt).findIndex(x=>x.id===mid);
  if(i<0)return;
  const sp=ntConfSp(nt,i);
  const pr=ptaResolve(sp);
  let rec=null;
  if(pr)rec=ptaRec(pr)||await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr));
  const si=rec?null:speciesInfo(sp);
  if(!rec&&!si){toast('That species is not in the data.');return;}
  const cur=NTS()[id];
  const j=ntTeam(cur).findIndex(x=>x.id===mid);
  if(j<0)return;
  const m=ntTeam(cur)[j];
  const next=Object.assign({},m,foeFromRec(rec,si,sp),{bonus:zeroStats()});
  /* Mega details you changed by hand are kept; the official ones follow the species */
  next.mega=m.mega&&!m.mega.auto?m.mega:ntMegaAuto(next);
  edit('gt',id,'team.'+j,next);
  toast('Filled in '+(rec?rec.n:si.name)+' from the '+(rec?'handbook':'game data')+'.',true);
  render();
}
const ntConfSp=(nt,i)=>String((ntTeam(nt)[i]||{}).sp||'');

/* typing a move's name in a roster Pokémon's sheet fills in the rest of the row from the handbook, when the row is still empty */
const NT_MV_RE=/^gt\|([^|]+)\|team\.(\d+)\.mv\.(\d+)\.name$/;
function ntRowFill(t){
  const mt=NT_MV_RE.exec(t.dataset.b||'');
  if(!mt)return false;
  const id=mt[1],i=+mt[2],k=+mt[3];
  const go=()=>{
    const m=ntTeam(NTS()[id])[i];
    const row=m&&(m.mv||[])[k];
    const L=PTA.lists;
    if(!row||!L)return;
    const def=L.moveMap.get(dexKey(row.name));
    if(!def)return;
    if(String(row.text||'').trim()||String(row.dice||'').trim())return;
    const next=Object.assign({},row,{name:def.n,freq:def.f||row.freq,kind:def.k||row.kind,range:def.r||row.range,type:def.t||row.type,dice:def.d||'',text:def.x||''});
    edit('gt',id,'team.'+i+'.mv',m.mv.map((x,j)=>j===k?next:x));
    toast('Filled in '+def.n+' from the handbook.',true);
    renderSoon();
  };
  if(PTA.lists)go();else ptaLists().then(go);
  return true;
}

/* ----- into a battle ----- */
function ntFoeFrom(id,nt,m){
  const hp=m.hp||{cur:20,max:20};
  const mx=Math.max(1,num(hp.max));
  return Object.assign({nick:m.nick||'',sp:m.sp||'',ty:[(m.ty||[])[0]||'',(m.ty||[])[1]||''],sz:m.sz||'Medium',wt:m.wt||'Medium',
    hp:{cur:clamp(num(hp.cur)>0?num(hp.cur):mx,1,mx),max:mx},
    base:Object.assign({atk:3,def:3,spa:3,spd:3,spe:3},m.base),bonus:Object.assign(zeroStats(),m.bonus),stages:zeroStats(),st:'',
    notes:m.notes||'',sk:m.sk||'',ps:(m.ps||[]).map(x=>Object.assign({},x)),mv:(m.mv||[]).map(x=>Object.assign({},x,{used:0})),
    item:m.item||'',up:m.up||'',down:m.down||'',natureName:m.natureName||'',gender:m.gender||'',shiny:m.shiny===true,
    mega:m.mega?JSON.parse(JSON.stringify(m.mega)):null,megaOn:false,
    sh:{name:num(m.sh&&m.sh.name),pic:num(m.sh&&m.sh.pic),types:num(m.sh&&m.sh.types),st:0,hp:0,item:num(m.sh&&m.sh.item),mega:0},
    pn:foeLetter(),nt:id,ni:m.id,own:ntName(nt)},m.hpx?{hpx:num(m.hpx)}:{});
}
function ntToBattle(id,mid,quiet){
  if(!S.me.admin)return;
  const nt=NTS()[id];
  const m=nt&&ntTeam(nt).find(x=>x.id===mid);
  if(!m||ntInBattle(id,mid))return;
  const b=BT();
  const cid=newCid();
  const f=ntFoeFrom(id,nt,m);
  edit('gb','battle','foes.'+cid,f);
  btInsert(cid,{s:'f',pub:foePub(f)},fSpd(f)+(b.mode==='d20'?rnd(20):0),rnd(20));
  if(!quiet)render();
}
function ntTeamToBattle(id){
  if(!S.me.admin)return;
  const nt=NTS()[id];
  const left=ntTeam(nt).filter(m=>!ntInBattle(id,m.id));
  left.forEach(m=>ntToBattle(id,m.id,true));
  if(left.length)toast(left.length+(left.length===1?' Pokémon':' Pokémon')+' from '+ntName(nt)+' added to the battle, hidden from the players until you show them.',true);
  render();
}
function ntDelete(id){
  if(!S.me.admin||!NTS()[id])return;
  const nt=NTS()[id];
  const cur=(S.npcPub&&S.npcPub.n)||{};
  if(cur[id]){const n=Object.assign({},cur);delete n[id];edit('np','npcs','n',n);}
  /* foes already in a battle stay, but lose the link and the trainer's name */
  const fo=foesOf();
  Object.keys(fo).forEach(cid=>{if(fo[cid].nt===id){edit('gb','battle','foes.'+cid+'.nt','');edit('gb','battle','foes.'+cid+'.ni','');foePublish(cid);}});
  delete S.ui.nt.open[id];
  removeDoc('gt',id);
  ntPicSync(id);
  toast(ntName(nt)+' was deleted.',true);
}
function ntTwice(key,fn){
  if(S.ui.confirm===key){S.ui.confirm=null;fn();return;}
  S.ui.confirm=key;render();
  setTimeout(()=>{if(S.ui.confirm===key){S.ui.confirm=null;render();}},4000);
}

/* ----- the GM's page ----- */
function ntMegaPanel(id,nt,m,i){
  const checks=[megaHold(m.item,m.mv,m.mega),{ok:hasKey(nt),label:ntName(nt)+' carries a Key Stone'}];
  return megaRunPanel({kind:'nt',sc:'gt',id,P:'team.'+i+'.',doc:nt,mon:m,attrs:h`data-id="${id}" data-mid="${m.id}"`,checks,chip:keyChip(nt),ekey:'mgn'+m.id});
}
function ntMonBody(id,nt,m,i,len){
  const P='team.'+i+'.';
  const s=m.sh||{};
  const mvs=m.mv||[],ps=m.ps||[];
  const ask=S.ui.confirm==='ntf|'+m.id,askRm=S.ui.confirm==='ntr|'+m.id;
  return h`<div class="bbody fsheet">
    <div class="mgate secret"><span class="fl">GM only · what the players see of this Pokémon (once the NPC is shown, or in a battle)</span>
      <div class="row evchips" role="group" aria-label="Show players">
        ${[['name','Name'],['pic','Picture'],['types','Types'],['item','Held item']].map(([k,l])=>h`<label class="chip chkc"><input type="checkbox" ${bd('gt',id,P+'sh.'+k)} ${num(s[k])?raw('checked'):''}><span>${l}</span></label>`)}
        <button class="btn sm" data-act="nt_see" data-id="${id}" data-mid="${m.id}" data-v="all">Show all</button><button class="btn sm ghost" data-act="nt_see" data-id="${id}" data-mid="${m.id}" data-v="none">Hide all</button></div>
      <p class="sub">${ntShown(m)?'Hidden from the players until the NPC is shown.':'Nothing shown.'} The rest of this sheet, its moves and your notes never reach their phones.</p></div>
    <div class="fgrid">
      ${fText('Name','gt',id,P+'nick',nt,{})}
      ${fText('Species','gt',id,P+'sp',nt,{list:'dl-species'})}
      ${fSel('Type 1','gt',id,P+'ty.0',nt,TYPES,{blank:'None'})}
      ${fSel('Type 2','gt',id,P+'ty.1',nt,TYPES,{blank:'None'})}
      ${fNum('HP now','gt',id,P+'hp.cur',nt,{min:0})}
      ${fNum('HP max','gt',id,P+'hp.max',nt,{min:1})}
      ${fSel('Size','gt',id,P+'sz',nt,SIZES,{})}
      ${fSel('Weight','gt',id,P+'wt',nt,WEIGHTS,{})}
      ${fText('Held item','gt',id,P+'item',nt,{list:'dl-items'})}
      ${fSel('Gender','gt',id,P+'gender',nt,GENDERS,{blank:'Not set'})}
      <div class="fld shn"><span class="fl">Colour</span>${fCheck('Shiny ✦','gt',id,P+'shiny',nt,false)}</div>
      ${fText('Nature','gt',id,P+'natureName',nt,{})}
      ${fSel('Nature raises','gt',id,P+'up',nt,STAT_OPTS,{blank:'None'})}
      ${fSel('Nature lowers','gt',id,P+'down',nt,STAT_OPTS,{blank:'None'})}
      ${fText('Skills','gt',id,P+'sk',nt,{cls:'wide',ph:'Short list, separated by commas'})}
    </div>
    <div class="stats">${STATS.map(st=>h`<div class="stat lcd"><span class="sl">${st[2]}</span><span class="sv">${fStat(m,st[0])}</span><span class="sm"><span>mod ${sgn(mod(fStat(m,st[0])))}</span></span>
      <div class="mini"><label>Base<input type="number" ${bd('gt',id,P+'base.'+st[0])} value="${num(m.base&&m.base[st[0]])}"></label><label>Adj<input type="number" ${bd('gt',id,P+'bonus.'+st[0])} value="${num(m.bonus&&m.bonus[st[0]])}"></label></div></div>`)}</div>
    ${ntMegaPanel(id,nt,m,i)}
    <div class="list"><div class="ph"><h3>Moves</h3><button class="btn sm" data-act="add" ${bp('gt',id,P+'mv')} data-tpl="move">Add move</button></div>
      ${mvs.length?mvs.map((x,k)=>h`<div class="move"><div class="mv1">${fText('Move','gt',id,P+'mv.'+k+'.name',nt,{list:'dl-moves'})}${fText('Uses','gt',id,P+'mv.'+k+'.freq',nt,{})}<span></span>${rowBtns('gt',id,P+'mv',k,mvs.length,false)}</div>
        <div class="mv2">${fSel('Kind','gt',id,P+'mv.'+k+'.kind',nt,KINDS,{})}${fSel('Type','gt',id,P+'mv.'+k+'.type',nt,TYPES,{})}${fText('Range','gt',id,P+'mv.'+k+'.range',nt,{})}${fText('Damage','gt',id,P+'mv.'+k+'.dice',nt,{ph:'e.g. 3d8'})}</div>
        ${fArea('Effect','gt',id,P+'mv.'+k+'.text',nt,{rows:2})}</div>`):h`<p class="sub">No moves yet. Add one, or type a move name to fill it in from the handbook.</p>`}
    </div>
    <div class="list"><div class="ph"><h3>Passives</h3><button class="btn sm" data-act="add" ${bp('gt',id,P+'ps')} data-tpl="passive">Add passive</button></div>
      ${ps.length?ps.map((x,k)=>h`<div class="item"><div class="irow two">${fText('Passive','gt',id,P+'ps.'+k+'.name',nt,{list:'dl-passives'})}${rowBtns('gt',id,P+'ps',k,ps.length,false)}</div>${fArea('What it does','gt',id,P+'ps.'+k+'.text',nt,{rows:2})}</div>`):h`<p class="sub">No passives.</p>`}
    </div>
    ${fArea('Notes about this Pokémon (only you see these)','gt',id,P+'notes',nt,{rows:2})}
    <div class="row">
      <button class="btn sm ${ask?'danger armed':''}" data-act="nt_fill" data-id="${id}" data-mid="${m.id}">${ask?'Tap again to replace its stats, passives and moves':'Fill from the handbook'}</button>
      <button class="btn sm danger ${askRm?'armed':''}" data-act="nt_monrm" data-id="${id}" data-mid="${m.id}">${askRm?'Tap again to remove it':'Remove Pokémon'}</button>
      <span class="ibtns"><button class="btn sm ghost" data-act="mv" ${bp('gt',id,'team')} data-i="${i}" data-d="-1" ${i===0?raw('disabled'):''} aria-label="Move earlier">↑</button><button class="btn sm ghost" data-act="mv" ${bp('gt',id,'team')} data-i="${i}" data-d="1" ${i===len-1?raw('disabled'):''} aria-label="Move later">↓</button></span></div>
  </div>`;
}
function ntMonRow(id,nt,m,i,len){
  const open=!!S.ui.nt.mon[m.id];
  const inB=ntInBattle(id,m.id);
  return h`<div class="ntmon" data-mid="${m.id}">
    <div class="row sp"><span class="row ntmh">${monIcon({species:m.sp})}<b>${ntMonName(m)}</b>${m.nick&&m.sp?h`<span class="sub">${m.sp}</span>`:''}${chipsOf(m.ty)}${m.item?h`<span class="pill">${itemMini(m.item)}${m.item}</span>`:''}${m.mega&&megaHold(m.item,m.mv,m.mega).ok&&hasKey(nt)?h`<span class="pill mega">Mega-ready</span>`:''}${ntShown(m)?h`<span class="pill good">Some shown</span>`:h`<span class="pill">Hidden</span>`}${inB?h`<span class="pill gm">In battle</span>`:''}</span>
      <span class="row"><button class="btn sm" data-act="nt_foe" data-id="${id}" data-mid="${m.id}" ${inB?raw('disabled'):''}>Add to battle</button><button class="btn sm" data-act="nt_mon" data-mid="${m.id}" aria-expanded="${String(open)}">${open?'Close':'Edit'}</button></span></div>
    ${open?ntMonBody(id,nt,m,i,len):''}
  </div>`;
}
function ntSheet(id,nt){
  const st=nt.stats||{},tal=nt.talents||{},it=nt.items||[],fs=nt.features||[];
  const more=!!S.ui.nt.more[id];
  const who=ntName(nt);
  return h`<div class="ntsheet">
    <div class="ph"><h3>Trainer sheet</h3><span class="sub">Level, class, stats and bag. The table sees them only if you tick them above.</span></div>
    <div class="fgrid">
      ${fNum('Level','gt',id,'level',nt,{min:1,max:20})}
      ${fSel('Class','gt',id,'cls',nt,Object.keys(CLASSES),{blank:'Not chosen'})}
      ${fSel('Advanced class','gt',id,'adv',nt,CLASSES[nt.cls]||[],{blank:'None yet'})}
    </div>
    <div class="stats">${hpTile('gt',id,nt.hp,false)}${STATS.map(([k,full,ab])=>h`<div class="stat lcd"><span class="sl">${ab}</span>
      <input type="number" inputmode="numeric" aria-label="${full}" ${bd('gt',id,'stats.'+k)} value="${st[k]}" data-min="1" data-max="10">
      <span class="sm"><span>mod ${sgn(mod(st[k]))}</span><button class="rollbtn" data-act="nt_roll" data-label="${who}: ${full} check" data-bonus="${mod(st[k])}" data-tal="0">d20</button></span></div>`)}</div>
    <div class="row"><label class="row"><input type="checkbox" data-act="b_secret" ${S.ui.secret?raw('checked'):''}><span>Roll in secret (not shared)</span></label>
      <button class="btn sm ghost" data-act="nt_more" data-id="${id}" aria-expanded="${String(more)}">${more?'Hide skills and features':'Skills and features'}</button></div>
    ${more?h`<div class="ntmore">
      ${STAT_KEYS.map(k=>{
        const m=mod(st[k]);
        return h`<div class="sgroup"><h3><span>${STAT_NAME[k]} skills</span><span class="mono">${sgn(m)}</span></h3>
          ${SKILLS.filter(x=>x[2]===k).map(([key,name])=>{
            const lv=clamp(num(tal[key]),0,2),tb=[0,2,5][lv];
            return h`<div class="skill"><span class="sname">${name}</span>
              <button class="tal t${lv}" data-act="nt_tal" data-id="${id}" data-key="${key}" title="Talent: none, +2, or +5 when taken twice">${['—','+2','+5'][lv]}</button>
              <span class="bonus">${sgn(m+tb)}</span>
              <button class="btn sm" data-act="nt_roll" data-label="${who}: ${name}" data-bonus="${m}" data-tal="${tb}">Roll</button></div>`;})}</div>`;})}
      <div class="list"><div class="ph"><h3>Features</h3><button class="btn sm" data-act="add" ${bp('gt',id,'features')} data-tpl="feature">Add feature</button></div>
        ${fs.length?fs.map((x,i)=>h`<div class="item"><div class="irow two">${fText('Name','gt',id,'features.'+i+'.name',nt,{})}${rowBtns('gt',id,'features',i,fs.length,false)}</div>${fArea('What it does','gt',id,'features.'+i+'.text',nt,{rows:2})}</div>`):h`<p class="sub">Class features, in your own words. Only you see these.</p>`}</div>
    </div>`:''}
    <div class="list"><div class="ph"><h3>Inventory</h3><button class="btn sm" data-act="add" ${bp('gt',id,'items')} data-tpl="item">Add item</button></div>
      ${it.length?it.map((x,i)=>h`<div class="item"><div class="irow ic">${itemTile(x.name)}${fText('Item','gt',id,'items.'+i+'.name',nt,{list:'dl-items'})}${fNum('Qty','gt',id,'items.'+i+'.qty',nt,{min:0})}${rowBtns('gt',id,'items',i,it.length,false)}</div>${fText('Note (only you see this)','gt',id,'items.'+i+'.note',nt,{})}${isKeyName(x.name)?h`<div class="kline">${keyChip(nt)}<span class="sub">Lets ${who}'s Pokémon Mega Evolve, once per battle.</span>${nt.megaUsed?h`<button class="btn sm" data-act="nt_recharge" data-id="${id}">Recharge it</button>`:''}</div>`:''}</div>`):h`<p class="sub">Nothing in the bag. A Key Stone here lets this NPC's Pokémon Mega Evolve.</p>`}
    </div>
  </div>`;
}
function ntBody(id,nt){
  const r=nt.rev||{};
  const on=!!num(r.on);
  const team=ntTeam(nt);
  const left=team.filter(m=>!ntInBattle(id,m.id)).length;
  const askDel=S.ui.confirm==='ntd|'+id;
  return h`<div class="ntbody">
    <div class="mgate secret"><span class="fl">GM only · what the players see</span>
      <label class="row"><input type="checkbox" ${bd('gt',id,'rev.on')} ${on?raw('checked'):''}><span><b>Show this NPC to the table</b></span></label>
      <div class="row evchips" role="group" aria-label="Also show">
        ${[['role','Role'],['place','Where you met'],['notes','Your notes'],['pic','Picture'],['cls','Level and class'],['stats','Stats'],['items','Items']].map(([k,l])=>h`<label class="chip chkc"><input type="checkbox" ${bd('gt',id,'rev.'+k)} ${num(r[k])?raw('checked'):''} ${on?'':raw('disabled')}><span>${l}</span></label>`)}</div>
      <p class="sub">Players now see: ${ntPreview(nt)}. It appears under <b>People</b>, in <b>Trainers you have met</b>. Their Pokémon appear there once you tick what to show for each one below.</p></div>
    <div class="idrow"><div class="idimg">${ntImgOk(nt.img)?ntPortrait(nt.img,nt.imgc,'edit',h`data-id="${id}" tabindex="0" role="group" aria-label="Picture frame. Drag to move the picture, or use the arrow keys."`):pimg('',ntName(nt),'tall')}${imgPicker('gt',id,'img',nt,0,0,160000,false,900)}${ntImgOk(nt.img)?ntFramePanel(id,nt):''}<span class="sub">${ntImgOk(nt.img)?(num(r.pic)&&on?'The table sees this picture.':'Only you see this picture. Tick Picture above to show it.'):'A portrait for this NPC. It stays hidden until you tick Picture.'}</span></div>
    <div class="fgrid">
      ${fText('Name','gt',id,'name',nt,{cls:'wide'})}
      ${fText('Role or title','gt',id,'role',nt,{ph:'e.g. Gym Leader, Team Galactic grunt'})}
      ${fText('Where you met','gt',id,'place',nt,{list:'dl-places'})}
      ${fArea('Notes the table learns once you show them','gt',id,'notes',nt,{rows:3,cls:'wide'})}
      ${fArea('Secret (only you see this)','gt',id,'secret',nt,{rows:3,cls:'wide'})}
    </div></div>
    ${ntSheet(id,nt)}
    <div class="ph"><h3>Pokémon</h3><button class="btn sm primary" data-act="nt_team" data-id="${id}" ${left?'':raw('disabled')}>Add the whole team to the battle</button></div>
    ${team.length?h`<div class="ntteam">${team.map((m,i)=>ntMonRow(id,nt,m,i,team.length))}</div>`:h`<p class="sub">No Pokémon yet. Add one below: its stats, passives and moves fill in from the handbook.</p>`}
    <div class="mgd"><b>Give this NPC a Pokémon</b>
      <div class="fgrid">
        <label class="fld"><span class="fl">Species</span><input type="text" list="dl-species" data-u="nt.sp_${id}" data-nr value="${S.ui.nt['sp_'+id]||''}" placeholder="e.g. Garchomp"></label>
        <label class="fld"><span class="fl">Name (optional)</span><input type="text" data-u="nt.nk_${id}" data-nr value="${S.ui.nt['nk_'+id]||''}"></label>
      </div>
      <div class="row"><button class="btn primary sm" data-act="nt_add" data-id="${id}">Add Pokémon</button></div></div>
    <div class="row"><button class="btn sm danger ${askDel?'armed':''}" data-act="nt_rm" data-id="${id}">${askDel?'Tap again to delete this NPC and its Pokémon':'Delete this NPC'}</button></div>
  </div>`;
}
function ntCard(id){
  const nt=NTS()[id];
  const open=!!S.ui.nt.open[id];
  const pub=ntPub(id);
  const team=ntTeam(nt);
  return h`<article class="entry ntcard" data-id="${id}">
    <div class="row sp"><div class="nthd">${ntImgOk(nt.img)?ntPortrait(nt.img,nt.imgc,'thumb'):pimg('',ntName(nt),'thumb')}<div><h3>${ntName(nt)}</h3><div class="meta">${nt.role?h`<span>${nt.role}</span>`:''}${nt.place?h`<span>${nt.place}</span>`:''}<span>${team.length} Pokémon</span></div></div></div>
      <div class="row">${pub?h`<span class="pill good">Shown to players</span>`:h`<span class="pill">Hidden</span>`}<button class="btn sm" data-act="nt_open" data-id="${id}" aria-expanded="${String(open)}">${open?'Close':'Open'}</button></div></div>
    ${open?ntBody(id,nt):''}
  </article>`;
}
function npcTab(){
  if(PTA.idx)ptaLists();
  const ids=ntIds();
  return h`<section class="panel"><div class="ph"><h2>NPC trainers</h2><span class="pill gm">GM only</span><div class="acts"><button class="btn primary sm" data-act="nt_new">New NPC trainer</button></div></div>
    <p class="sub">Create a trainer, give them Pokémon, and add them to a battle. Everything here stays in a document only you can read. The players see an NPC only after you tick <b>Show this NPC to the table</b>, and then only what you ticked, including for each Pokémon. In a battle the Pokémon start hidden as “Foe A”, “Foe B”.</p></section>
  ${ids.length?h`<div class="list">${ids.map(ntCard)}</div>`:emptyState('No NPC trainers yet','Make one for a rival, a gym leader or a stranger with a team. Nothing you put here reaches the players until you show it.',h`<button class="btn primary" data-act="nt_new">New NPC trainer</button>`)}`;
}

/* ----- what players see: People page ----- */
function ntPubMon(m){
  const id=m.sp?dexId(m.sp):0;
  const srcs=id?spriteSrcs(id):[];
  return h`<span class="ntpm">${srcs.length?h`<img class="sp mi" src="${srcs[0]}" data-fb="${srcs.slice(1).join('|')}" alt="" width="40" height="40" loading="lazy" decoding="async">`:h`<span class="mi-ph" aria-hidden="true"></span>`}<span class="ntpn"><b>${m.n}</b>${m.ty&&m.ty.length?h`<span class="types">${chipsOf(m.ty)}</span>`:''}${m.it?h`<span class="sub">${itemMini(m.it)}holding ${m.it}</span>`:''}</span></span>`;
}
function ntPublicPanel(){
  const n=(S.npcPub&&S.npcPub.n)||{};
  const ids=Object.keys(n).sort((a,b)=>String(n[a].n).localeCompare(String(n[b].n)));
  if(!ids.length)return '';
  return h`<section class="panel ntpub"><div class="ph"><h2>Trainers you have met</h2>${S.me.admin?h`<span class="pill gm">What the players see</span>`:''}</div>
    <div class="grid cards">${ids.map(id=>{const p=n[id],pic=ntPicOf(id);return h`<article class="entry pcard">${pic?h`<div class="ptrcol"><button class="ptrbtn" data-act="lbx" data-k="${'npc|'+id}" aria-label="${'View the full picture of '+p.n}" title="View the full picture">${ntPortrait(pic,ntPicCrop(id),'')}</button><span class="ptrh">Tap to enlarge</span></div>`:''}<div class="pc-body">
      <h3>${p.n}</h3>
      <div class="meta">${p.r?h`<span>${p.r}</span>`:''}${p.pl?h`<span>Met at ${p.pl}</span>`:''}${p.lv!=null?h`<span>Level ${p.lv}</span>`:''}${p.cl?h`<span>${p.cl}</span>`:''}</div>
      ${p.st?h`<div class="ntst lcd">${[['HP',p.st.hp],['Atk',p.st.atk],['Def',p.st.def],['SpA',p.st.spa],['SpD',p.st.spd],['Spd',p.st.spe]].map(([l,v])=>h`<span><i>${l}</i><b>${v}</b></span>`)}</div>`:''}
      ${p.it&&p.it.length?h`<div class="ntits">${p.it.map(x=>h`<span class="ntit">${itemMini(x.n)}${x.n}${x.q>1?' ×'+x.q:''}</span>`)}</div>`:''}
      ${p.b?h`<p class="prewrap">${p.b}</p>`:''}
      ${(p.m||[]).length?h`<div class="ntpms">${p.m.map(ntPubMon)}</div>`:''}
    </div></article>`;})}</div></section>`;
}
/* in the battle's "Who is fighting" panel */
function ntBattlePanel(){
  const ids=ntIds().filter(id=>ntTeam(NTS()[id]).length);
  if(!ids.length)return '';
  return h`<div class="mgd"><b>NPC trainers</b>
    <p class="sub">Their Pokémon join as foes with their own sheets, hidden from the players until you show them.</p>
    ${ids.map(id=>{const nt=NTS()[id],team=ntTeam(nt),left=team.filter(m=>!ntInBattle(id,m.id)).length;
      return h`<div class="row sp"><b>${ntName(nt)}</b><button class="btn sm" data-act="nt_team" data-id="${id}" ${left?'':raw('disabled')}>Add whole team</button></div>
        <div class="row evchips">${team.map(m=>h`<button class="btn sm chk" data-act="nt_foe" data-id="${id}" data-mid="${m.id}" aria-pressed="${String(ntInBattle(id,m.id))}" ${ntInBattle(id,m.id)?raw('disabled'):''}>${monIcon({species:m.sp})}${ntMonName(m)}</button>`)}</div>`;})}
  </div>`;
}

/* ----- actions ----- */
function ntAct(b){
  const d=b.dataset;
  if(!S.me.admin)return;
  switch(d.act){
    case 'nt_new':ntNew();break;
    case 'nt_open':S.ui.nt.open[d.id]=!S.ui.nt.open[d.id];if(S.ui.nt.open[d.id])ntEnsure(d.id);render();break;
    case 'nt_more':S.ui.nt.more[d.id]=!S.ui.nt.more[d.id];render();break;
    case 'nt_tal':{
      const nt=NTS()[d.id];
      if(!nt)break;
      edit('gt',d.id,'talents.'+d.key,(clamp(num((nt.talents||{})[d.key]),0,2)+1)%3);
      render();break;}
    case 'nt_roll':ntRoll(d.label,num(d.bonus),num(d.tal));break;
    case 'nt_fr0':edit('gt',d.id,'imgc',{x:50,y:50,z:1});ntPublish(d.id);render();break;
    case 'nt_recharge':edit('gt',d.id,'megaUsed',false);render();break;
    case 'nt_mgadd':case 'nt_mgform':case 'nt_mgreset':case 'nt_mgdrop':case 'nt_mgready':mgAct('nt',d.act.slice(3),d);break;
    case 'nt_mon':S.ui.nt.mon[d.mid]=!S.ui.nt.mon[d.mid];render();break;
    case 'nt_add':ntAddMon(d.id);break;
    case 'nt_foe':ntToBattle(d.id,d.mid);break;
    case 'nt_team':ntTeamToBattle(d.id);break;
    case 'nt_see':{
      const nt=NTS()[d.id];
      const i=ntTeam(nt).findIndex(x=>x.id===d.mid);
      if(i<0)break;
      const on=d.v==='all';
      edit('gt',d.id,'team.'+i+'.sh',{name:on,pic:on,types:on,item:on});
      ntPublish(d.id);render();break;}
    case 'nt_fill':ntTwice('ntf|'+d.mid,()=>ntFillMon(d.id,d.mid));break;
    case 'nt_monrm':ntTwice('ntr|'+d.mid,()=>{
      const nt=NTS()[d.id];
      edit('gt',d.id,'team',ntTeam(nt).filter(x=>x.id!==d.mid));
      delete S.ui.nt.mon[d.mid];
      const fo=foesOf();
      Object.keys(fo).forEach(cid=>{if(fo[cid].nt===d.id&&fo[cid].ni===d.mid)edit('gb','battle','foes.'+cid+'.ni','');});
      ntPublish(d.id);render();
    });break;
    case 'nt_rm':ntTwice('ntd|'+d.id,()=>ntDelete(d.id));break;
  }
}

/* ---------- Battle map: a picture or blank grid, a grid over it, and a token for each Pokémon and foe ----------
   Where things live, and why:
     gm/bmap, gm/bmi_<n>     the GM's working copy: the settings, the picture in chunks, and where each foe stands and
                             whether it is shown. Only the GM can read these, so a map that has not been shown is not on
                             anybody else's device.
     meta/bmap               what the table sees, only while the map is shown: the settings, and the foes the GM chose to show.
     mapimg/bm_<n>, bm_meta  the table's copy of the picture, in the collection the region map already uses.
     trainers/<uid>/pokemon/<id>.bpos
                             where a Pokémon stands, kept on its own sheet so its player can move it without the GM.
   No rules change: every one of these is a place the existing rules already cover. */
S.ui.bm=S.ui.bm||{zoom:1,sel:'',ruler:false,rl:null,rlText:'',cal:0,calA:null,cols:'',rows:'',cn:'',setup:false,zc:null};
S.ui.bt.view=S.ui.bt.view||'order';
S.bmap=S.bmap||{};S.bmGm=S.bmGm||{};S.bmGmCh=S.bmGmCh||{};S.bmGmSrc='';S.bmGmSig='';S.bmSrc='';S.bmSig='';

const BM_CH=150000;
/* how many squares a Pokémon covers on each side, by its size */
const BM_FP={Tiny:1,Small:1,Medium:1,Large:2,Huge:3,Gigantic:4};
const bmFoot=s=>BM_FP[s]||1;
const bmG=()=>S.bmGm||{};
const bmAvail=()=>!!(S.me.admin||(S.bmap&&S.bmap.on&&S.bmap.v));

/* the map this person is looking at: the GM sees the working copy, everyone else sees the shared one */
function bmCfg(){
  const adm=!!S.me.admin;
  const d=adm?bmG():(S.bmap&&S.bmap.on?S.bmap:null);
  if(!d||!d.v||!num(d.w)||!num(d.h))return null;
  const w=num(d.w),hh=num(d.h);
  const gx=Math.max(4,num(d.gx)||50);
  const ox=clamp(num(d.ox),0,w),oy=clamp(num(d.oy),0,hh);
  const obj=o=>o&&typeof o==='object'&&!Array.isArray(o)?o:{};
  return {v:d.v,w,h:hh,blank:!!d.blank,gx,ox,oy,cols:Math.max(1,Math.floor((w-ox)/gx+1e-6)),rows:Math.max(1,Math.floor((hh-oy)/gx+1e-6)),
    grid:d.grid!==false,name:String(d.name||''),src:d.blank?'':(adm?S.bmGmSrc:S.bmSrc),live:adm?!!d.live:true,adm,
    ter:Array.isArray(d.ter)?d.ter.map(String):[],tsh:d.tsh!==false,wt:d.wt!==false,mk:obj(d.mk),tp:obj(d.tp),
    fg:d.fg===true,fa:d.fa!==false,fv:clamp(Math.round(num(d.fv))||6,1,30),fw:d.fw!==false,
    fz:adm&&Array.isArray(d.fz)?d.fz.map(String):[],fr:!adm&&Array.isArray(d.fr)?d.fr.map(String):[]};
}
/* the picture comes in chunks: put them together once every one has arrived */
function bmJoin(chunks,n,v){
  let sig=v+'|'+n,out='';
  for(let i=0;i<n;i++){
    const c=chunks[i];
    if(!c||c.v!==v||typeof c.d!=='string')return null;
    sig+='|'+c.d.length;out+=c.d;
  }
  return {sig,out};
}
function bmAssembleGm(){
  const g=bmG();
  if(!g.v||g.blank||!num(g.n)){S.bmGmSrc='';S.bmGmSig='';return;}
  const n=num(g.n),ch=S.bmGmCh;
  let sig=g.v+'|'+n;
  for(let i=0;i<n;i++){const c=ch[i];if(!c||c.v!==g.v||typeof c.d!=='string'){S.bmGmSrc='';S.bmGmSig='';return;}sig+='|'+c.d.length;}
  if(sig===S.bmGmSig)return;
  const j=bmJoin(ch,n,g.v);
  S.bmGmSig=j?j.sig:'';S.bmGmSrc=j?imgSrc(j.out):'';
}
function bmAssemble(){
  const p=S.bmap||{},m=S.mapChunks&&S.mapChunks.bm_meta;
  if(!p.on||p.blank||!m||m.v!==p.v||!num(m.n)){S.bmSrc='';S.bmSig='';return;}
  const ch={};
  for(let i=0;i<num(m.n);i++)ch[i]=S.mapChunks['bm_'+i];
  const j=bmJoin(ch,num(m.n),p.v);
  if(!j){S.bmSrc='';S.bmSig='';return;}
  if(j.sig===S.bmSig)return;
  S.bmSig=j.sig;S.bmSrc=imgSrc(j.out);
}

/* ----- tokens ----- */
function bmTokens(cfg){
  const gm=!!S.me.admin,b=BT(),out=[];
  btOrder().forEach(cid=>{
    const c=b.c[cid],v=btInfo(cid,gm);
    if(!v)return;
    if(c.s==='a'){
      const m=getLocal('p',c.r)||{},bp=m.bpos;
      const ok=!!bp&&num(bp.v)===cfg.v&&num(bp.x)>=0&&num(bp.y)>=0;
      out.push({cid,side:'a',v,x:ok?num(bp.x):-1,y:ok?num(bp.y):-1,placed:ok,fp:bmFoot(m.size),mine:canEditT(v.uid),vis:true});
    }else{
      const e=gm?(bmG().f||{})[cid]:((S.bmap||{}).f||{})[cid];
      const ok=!!e&&num(e.x)>=0&&num(e.y)>=0;
      const fp=gm?bmFoot((foeOf(cid)||{}).sz):clamp(Math.round(num(e&&e.s))||1,1,4);
      out.push({cid,side:'f',v,x:ok?num(e.x):-1,y:ok?num(e.y):-1,placed:ok,fp,mine:gm,vis:gm?(ok&&num(e.vis)>0):true});
    }
  });
  return out;
}
const bmPct=(n,d)=>(n/d*100).toFixed(4)+'%';
function bmShort(s){s=String(s||'');return s.length>14?s.slice(0,13)+'…':s;}
function bmTok(cfg,t){
  const v=t.v,hp=v.hp;
  const mx=hp?Math.max(1,num(hp.max)):0;
  const ratio=hp?clamp(num(hp.cur)/mx,0,1):null;
  const b=BT(),sel=S.ui.bm.sel===t.cid;
  const turn=!!b.on&&b.turn===t.cid;
  const cls=['bmt',t.side==='a'?'ally':'foe',turn?'turn':'',v.down?'down':'',t.vis?'':'hid',sel?'sel':'',t.mine?'mine':''].filter(Boolean).join(' ');
  const pic=t.side==='a'?monPic(v.m):foePic(v);
  const label=v.name+(t.side==='a'?', '+v.owner:', foe')+(hp&&v.down?', down':'')+(hp?(v.showHp===1?', about '+Math.round(ratio*100)+' percent health':', '+num(hp.cur)+' of '+mx+' HP'):'')+(t.vis?'':', hidden from players')+', column '+(t.x+1)+', row '+(t.y+1)+(t.mine?'. Drag to move it, or use the arrow keys.':'');
  return h`<button type="button" class="${cls}" data-bmt="${t.cid}" data-act="bm_sel" data-cid="${t.cid}" aria-pressed="${String(sel)}" aria-label="${label}" title="${v.name}" style="left:${bmPct(cfg.ox+t.x*cfg.gx,cfg.w)};top:${bmPct(cfg.oy+t.y*cfg.gx,cfg.h)};width:${bmPct(t.fp*cfg.gx,cfg.w)};height:${bmPct(t.fp*cfg.gx,cfg.h)};--c:${(cfg.gx/cfg.w*100).toFixed(4)}cqw">
    <span class="bmt-pic">${pic}</span>${ratio!=null?h`<span class="bmt-hp ${hpCls({cur:ratio,max:1})}"><i style="width:${Math.round(ratio*100)}%"></i></span>`:''}${v.status?h`<span class="bmt-st">${String(v.status).slice(0,3).toUpperCase()}</span>`:''}${t.vis?'':h`<span class="bmt-eye" aria-hidden="true">hidden</span>`}<span class="bmt-nm">${bmShort(v.name)}</span></button>`;
}

/* ----- placing and moving ----- */
function bmClampXY(cfg,t,x,y){
  return {x:clamp(Math.round(x),0,Math.max(0,cfg.cols-t.fp)),y:clamp(Math.round(y),0,Math.max(0,cfg.rows-t.fp))};
}
/* o.free: the square was already checked (a drag does that as it goes) or the GM chose to ignore walls */
function bmSetPos(cid,x,y,o){
  const cfg=bmCfg();
  if(!cfg)return;
  const t=bmTokens(cfg).find(k=>k.cid===cid);
  if(!t||!t.mine)return;
  let p=bmClampXY(cfg,t,x,y),msg='';
  if(!(o&&o.free)&&bmWallsOn(cfg)){
    if(!t.placed){
      if(bmFootBlocked(cfg,t.fp,p.x,p.y)){toast('That square is a wall.');return;}
    }else{
      const r=bmWalk(cfg,t.fp,{x:t.x,y:t.y},p);
      if(r.blocked){
        if(r.x===t.x&&r.y===t.y){toast('A wall is in the way.');return;}
        msg='A wall stopped it.';
      }
      p={x:r.x,y:r.y};
    }
  }
  if(t.side==='a'){
    edit('p',btC(cid).r,'bpos',{x:p.x,y:p.y,v:cfg.v});
  }else{
    const old=(bmG().f||{})[cid]||{};
    edit('bg','bmap','f.'+cid,{x:p.x,y:p.y,vis:num(old.vis)>0?1:0});
    bmSync();
  }
  /* said after the save has started, or "Saving…" would replace it */
  if(msg)toast(msg);
  if(t.side==='a')bmFogSoon();
}
function bmOff(cid){
  const cfg=bmCfg();
  const t=cfg&&bmTokens(cfg).find(k=>k.cid===cid);
  if(!t||!t.mine)return;
  if(t.side==='a'){edit('p',btC(cid).r,'bpos',null);bmFogSoon();}
  else{
    const f=Object.assign({},bmG().f||{});delete f[cid];
    edit('bg','bmap','f',f);bmSync();
  }
  if(S.ui.bm.sel===cid)S.ui.bm.sel='';
}
function bmFoeVis(cid,on){
  if(!S.me.admin)return;
  const e=(bmG().f||{})[cid];
  if(!e)return;
  edit('bg','bmap','f.'+cid+'.vis',on?1:0);
  bmSync();
}
/* keeps the table's copy in step with the GM's: the settings, and only the foes the GM has shown */
function bmSync(){
  if(!S.me.admin)return;
  const g=bmG();
  if(!g.v)return;
  const c=BT().c||{},f=g.f||{},keep={};
  let pruned=false;
  Object.keys(f).forEach(cid=>{if(c[cid]&&c[cid].s==='f')keep[cid]=f[cid];else pruned=true;});
  if(pruned)edit('bg','bmap','f',keep);
  if(!g.live)return;
  const gc=bmCfg();
  /* fog of war: which squares the players can see is worked out here, because only the GM's device knows where the covered ones are */
  let fe=null;
  if(gc&&gc.fg){
    const r=bmFogEff(gc);
    if(r.merged)edit('bg','bmap','fz',r.fz);
    fe=r.rows;
  }
  const pubF={};
  Object.keys(keep).forEach(cid=>{
    const e=keep[cid];
    if(num(e.vis)>0&&num(e.x)>=0){
      const fp=bmFoot((foeOf(cid)||{}).sz);
      if(fe&&!bmRowsSeen(fe,num(e.x),num(e.y),fp))return;
      pubF[cid]={x:num(e.x),y:num(e.y),s:fp};
    }
  });
  /* terrain, markers and shapes reach the table only when the GM has chosen to show them, and not from covered squares */
  let ter=g.tsh===false||!Array.isArray(g.ter)?[]:g.ter.map(String);
  if(fe)ter=bmTerPack(ter.map((r,y)=>{let o='';for(let x=0;x<r.length;x++)o+=((fe[y]||'')[x]||'.')==='.'?'.':r[x];return o;}));
  const mkPub={},tpPub={};
  Object.keys(g.mk||{}).forEach(id=>{
    const m=g.mk[id];
    if(m&&num(m.vis)>0&&num(m.x)>=0&&num(m.y)>=0){
      if(fe&&((fe[num(m.y)]||'')[num(m.x)]||'.')==='.')return;
      mkPub[id]={x:num(m.x),y:num(m.y),k:String(m.k||'note'),l:String(m.l||'')};
    }
  });
  Object.keys(g.tp||{}).forEach(id=>{
    const t=g.tp[id];
    if(t&&num(t.sh)>0){
      const o={k:String(t.k||'burst'),x:num(t.x),y:num(t.y),n:num(t.n)||1,d:num(t.d),w:num(t.w)||1};
      if(t.b===0||t.b===false)o.b=0;
      else if(gc&&bmHasWalls(gc)){
        /* a player may not be able to see the walls, so a shape that walls cut short is sent as the squares it covers */
        const cl=bmTplCells(gc,o);
        if(cl.length<bmTplRaw(gc,o).length){o.c=[];cl.forEach(c=>{o.c.push(c[0],c[1]);});}
      }
      tpPub[id]=o;
    }
  });
  const want={on:true,v:g.v,w:num(g.w),h:num(g.h),blank:!!g.blank,gx:Math.max(4,num(g.gx)||50),ox:num(g.ox),oy:num(g.oy),grid:g.grid!==false,name:String(g.name||''),f:pubF,ter,wt:g.wt!==false,mk:mkPub,tp:tpPub,fg:!!fe,fr:fe||[]};
  const cur=S.bmap||{};
  Object.keys(want).forEach(k=>{if(JSON.stringify(cur[k])!==JSON.stringify(want[k]))edit('bm','bmap',k,want[k]);});
}
async function bmDropPublic(){
  const col=S.db.collection('mapimg');
  const m=S.mapChunks&&S.mapChunks.bm_meta;
  const n=Math.max(num(m&&m.n),0);
  try{
    await col.doc('bm_meta').delete();
    for(let i=0;i<n;i++)await col.doc('bm_'+i).delete();
  }catch(e){fail(e);}
}
async function bmLive(on){
  if(!S.me.admin)return;
  const g=bmG();
  if(!g.v){toast('Add a map first.');return;}
  if(on){
    if(!g.blank){
      const n=num(g.n);
      for(let i=0;i<n;i++){const c=S.bmGmCh[i];if(!c||c.v!==g.v){toast('The map picture is still loading. Try again in a moment.');return;}}
      setStatus('busy');
      try{
        const col=S.db.collection('mapimg');
        for(let i=0;i<n;i++)await col.doc('bm_'+i).set({d:S.bmGmCh[i].d,v:g.v});
        await col.doc('bm_meta').set({n,w:num(g.w),h:num(g.h),v:g.v});
      }catch(e){fail(e);return;}
    }
    edit('bg','bmap','live',true);
    bmSync();
    toast('The map is now shown to the players.',true);
  }else{
    edit('bg','bmap','live',false);
    putLocal('bm','bmap',{});
    edit('bm','bmap','on',false);
    await bmDropPublic();
    toast('The map is hidden from the players.',true);
  }
  render();
}
/* hides the shared copy, e.g. before a new map replaces it */
async function bmHidePublic(){
  if(!(S.bmap&&S.bmap.on)&&!(S.mapChunks&&S.mapChunks.bm_meta))return;
  putLocal('bm','bmap',{});
  edit('bm','bmap','on',false);
  await bmDropPublic();
}
async function bmDropChunks(from){
  const n=num(bmG().n);
  try{for(let i=from||0;i<Math.max(n,from||0);i++)await S.db.collection('gm').doc('bmi_'+i).delete();}catch(e){fail(e);}
}
async function bmUpload(file){
  const r=await fileToImage(file,{max:1600,q:0.8,cap:700000});
  const v=Date.now(),url=r.url,n=Math.ceil(url.length/BM_CH),col=S.db.collection('gm');
  const oldN=num(bmG().n);
  setStatus('busy');
  await bmHidePublic();
  for(let i=0;i<n;i++)await col.doc('bmi_'+i).set({d:url.slice(i*BM_CH,(i+1)*BM_CH),v});
  for(let i=n;i<oldN;i++)await col.doc('bmi_'+i).delete();
  const name=String(file.name||'Battle map').replace(/\.[a-z0-9]+$/i,'').slice(0,60)||'Battle map';
  const doc={v,name,w:r.w,h:r.h,blank:false,n,gx:Math.round(r.w/24*100)/100,ox:0,oy:0,grid:true,live:false,f:{}};
  putLocal('bg','bmap',doc);save('bg','bmap',doc,{create:true});
  S.ui.bm.sel='';S.ui.bm.setup=true;S.ui.bm.cn='24';
  toast('Map added. Now line up the grid, then show it to the players.',true);
  render();
}
async function bmBlank(){
  const u=S.ui.bm;
  const cols=clamp(Math.round(num(u.cols)||20),4,80),rows=clamp(Math.round(num(u.rows)||15),4,80);
  const v=Date.now(),oldN=num(bmG().n);
  setStatus('busy');
  await bmHidePublic();
  for(let i=0;i<oldN;i++)await S.db.collection('gm').doc('bmi_'+i).delete();
  const doc={v,name:'Blank grid',w:cols*50,h:rows*50,blank:true,n:0,gx:50,ox:0,oy:0,grid:true,live:false,f:{}};
  putLocal('bg','bmap',doc);save('bg','bmap',doc,{create:true});
  S.ui.bm.sel='';S.ui.bm.setup=true;
  toast('Blank grid added. Show it to the players when you are ready.',true);
  render();
}
async function bmRemoveMap(){
  const n=num(bmG().n);
  await bmHidePublic();
  S.ui.bm.sel='';
  await removeDoc('bg','bmap');
  for(let i=0;i<n;i++)await S.db.collection('gm').doc('bmi_'+i).delete();
  S.bmGmSrc='';S.bmGmSig='';
  toast('The map was removed.',true);
  render();
}
/* End battle: nobody is on the map any more. The map itself stays. */
function bmClearTokens(){
  if(!S.me.admin)return;
  Object.keys(BT().c||{}).forEach(cid=>{
    const c=BT().c[cid];
    if(c&&c.s==='a'){const m=getLocal('p',c.r);if(m&&m.bpos)edit('p',c.r,'bpos',null);}
  });
  if(bmG().v){edit('bg','bmap','f',{});if(Object.keys(bmG().tp||{}).length)edit('bg','bmap','tp',{});bmSync();}
}
function bmCols(){
  const g=bmG(),n=Math.round(num(S.ui.bm.cn));
  if(!g.v||g.blank||n<1)return;
  edit('bg','bmap','gx',Math.max(4,Math.round((num(g.w)-num(g.ox))/n*100)/100));
  bmSync();render();
}
/* two clicks on opposite corners of one square set the square size and where the grid starts */
function bmCalClick(p){
  const u=S.ui.bm;
  if(u.cal===1){u.calA=p;u.cal=2;render();return;}
  if(u.cal!==2||!u.calA)return;
  const a=u.calA;
  const gx=Math.max(4,Math.round((Math.abs(p.ix-a.ix)+Math.abs(p.iy-a.iy))/2*100)/100);
  edit('bg','bmap','gx',gx);
  edit('bg','bmap','ox',Math.round((Math.min(a.ix,p.ix)%gx)*100)/100);
  edit('bg','bmap','oy',Math.round((Math.min(a.iy,p.iy)%gx)*100)/100);
  u.cal=0;u.calA=null;
  bmSync();
  toast('Grid set from the square you marked.',true);
  render();
}
function bmReveal(on){
  if(!S.me.admin)return;
  const f=bmG().f||{};
  Object.keys(f).forEach(cid=>edit('bg','bmap','f.'+cid+'.vis',on?1:0));
  bmSync();render();
}

/* ----- pointer: dragging a token, the ruler, the calibration click ----- */
let bmDrag=null,bmRl=false,bmMoved=false,bmBusy=false,bmQueued=false;
function bmMapEl(){return document.getElementById('bmmap');}
function bmPoint(e){
  const el=bmMapEl(),cfg=bmCfg();
  if(!el||!cfg)return null;
  const r=el.getBoundingClientRect();
  return {ix:(e.clientX-r.left)/r.width*cfg.w,iy:(e.clientY-r.top)/r.height*cfg.h};
}
const bmCellOf=(cfg,p)=>({x:clamp(Math.floor((p.ix-cfg.ox)/cfg.gx),0,cfg.cols-1),y:clamp(Math.floor((p.iy-cfg.oy)/cfg.gx),0,cfg.rows-1)});
function bmDragStart(tok,e){
  const u=S.ui.bm;
  if(u.ruler||u.cal||u.tool==='tpl'||u.tool==='paint'||u.tool==='fog')return;
  const cfg=bmCfg();
  if(!cfg)return;
  let t;
  if(tok.classList.contains('bmk')){
    /* a marker: only the GM moves it */
    const m=cfg.adm&&cfg.mk[tok.dataset.id];
    if(!m)return;
    t={cid:'mk:'+tok.dataset.id,mkId:tok.dataset.id,x:num(m.x),y:num(m.y),fp:1,mine:true,placed:true};
  }else{
    t=bmTokens(cfg).find(k=>k.cid===tok.dataset.cid);
    if(!t||!t.mine||!t.placed)return;
  }
  const r=bmMapEl().getBoundingClientRect();
  bmDrag={cid:t.cid,mkId:t.mkId||'',el:tok,x0:e.clientX,y0:e.clientY,t,cfg,sc:r.width/cfg.w,moved:false,cell:{x:t.x,y:t.y},walls:!t.mkId&&bmWallsOn(cfg),blk:false};
  try{tok.setPointerCapture(e.pointerId);}catch(err){}
  bmBusy=true;
}
function bmDragMove(e){
  const d=bmDrag;
  if(!d)return;
  const dx=e.clientX-d.x0,dy=e.clientY-d.y0;
  if(!d.moved&&Math.hypot(dx,dy)<5)return;
  d.moved=true;d.el.classList.add('drag');
  const sq=d.cfg.gx*d.sc;
  const want=bmClampXY(d.cfg,d.t,d.t.x+dx/sq,d.t.y+dy/sq);
  /* the token follows the finger one square at a time and stops in front of a wall (the GM can hold Shift to go through) */
  if(d.walls&&!bmFree(e)){const r=bmWalk(d.cfg,d.t.fp,d.cell,want);d.cell={x:r.x,y:r.y};d.blk=r.blocked;}
  else{d.cell=want;d.blk=false;}
  d.el.classList.toggle('blk',d.blk);
  d.el.style.left=bmPct(d.cfg.ox+d.cell.x*d.cfg.gx,d.cfg.w);
  d.el.style.top=bmPct(d.cfg.oy+d.cell.y*d.cfg.gx,d.cfg.h);
  d.el.setAttribute('data-moved',Math.max(Math.abs(d.cell.x-d.t.x),Math.abs(d.cell.y-d.t.y))+' sq'+(d.blk?' · wall':''));
}
function bmDragEnd(){
  const d=bmDrag;
  if(!d)return;
  const late=bmQueued;
  bmDrag=null;bmBusy=false;bmQueued=false;
  if(d.moved){
    bmMoved=true;setTimeout(()=>{bmMoved=false;},60);
    if(d.mkId){
      if(d.cell.x!==d.t.x||d.cell.y!==d.t.y)bmMkMove(d.mkId,d.cell.x,d.cell.y);
      S.ui.bm.msel=d.mkId;S.ui.bm.sel='';
    }else{
      if(d.cell.x!==d.t.x||d.cell.y!==d.t.y)bmSetPos(d.cid,d.cell.x,d.cell.y,{free:true});
      if(d.blk)toast(d.cell.x!==d.t.x||d.cell.y!==d.t.y?'A wall stopped it.':'A wall is in the way.');
      S.ui.bm.sel=d.cid;S.ui.bm.msel='';
    }
    render();
  }else if(late){
    /* a plain tap: leave the token where it is until the tap's own click has been handled, or the click has nothing to land on */
    setTimeout(render,80);
  }
}
/* the ruler counts squares, with a diagonal step counting as one */
function bmRulerSvg(cfg,rl){
  if(!rl)return '';
  const cx=c=>cfg.ox+(c[0]+0.5)*cfg.gx,cy=c=>cfg.oy+(c[1]+0.5)*cfg.gx;
  const x1=cx(rl.a),y1=cy(rl.a),x2=cx(rl.b),y2=cy(rl.b);
  const n=Math.max(Math.abs(rl.a[0]-rl.b[0]),Math.abs(rl.a[1]-rl.b[1]));
  const fs=cfg.gx*0.5,sw=cfg.gx*0.12;
  const mx=(x1+x2)/2,my=(y1+y2)/2-cfg.gx*0.35;
  return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#000" stroke-opacity=".7" stroke-width="'+(sw*1.8)+'" stroke-linecap="round"/>'
    +'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#ffd43b" stroke-width="'+sw+'" stroke-linecap="round"/>'
    +'<circle cx="'+x1+'" cy="'+y1+'" r="'+(sw*1.3)+'" fill="#ffd43b" stroke="#000" stroke-width="'+(sw*0.4)+'"/>'
    +'<text x="'+mx+'" y="'+my+'" text-anchor="middle" font-size="'+fs+'" font-weight="800" fill="#fff" stroke="#000" stroke-width="'+(fs*0.22)+'" paint-order="stroke" style="font-family:sans-serif">'+n+(n===1?' square':' squares')+'</text>';
}
function bmRulerText(rl){
  if(!rl)return '';
  const n=Math.max(Math.abs(rl.a[0]-rl.b[0]),Math.abs(rl.a[1]-rl.b[1]));
  return 'Ruler: '+n+(n===1?' square':' squares');
}
function bmRulerDraw(){
  const cfg=bmCfg(),g=document.getElementById('bmrl'),note=document.getElementById('bmrlnote');
  if(g&&cfg)g.innerHTML=bmRulerSvg(cfg,S.ui.bm.rl);
  if(note)note.textContent=bmRulerText(S.ui.bm.rl)||'Drag across the map to measure.';
}
function bmRulerStart(e){
  const cfg=bmCfg(),p=bmPoint(e);
  if(!cfg||!p)return;
  const c=bmCellOf(cfg,p);
  S.ui.bm.rl={a:[c.x,c.y],b:[c.x,c.y]};
  bmRl=true;bmBusy=true;
  try{bmMapEl().setPointerCapture(e.pointerId);}catch(err){}
  bmRulerDraw();
  e.preventDefault();
}
function bmRulerMove(e){
  const cfg=bmCfg(),p=bmPoint(e);
  if(!cfg||!p||!S.ui.bm.rl)return;
  const c=bmCellOf(cfg,p);
  S.ui.bm.rl.b=[c.x,c.y];
  bmRulerDraw();
}
function bmRulerEnd(){
  bmRl=false;bmBusy=false;
  if(bmQueued){bmQueued=false;setTimeout(render,80);}
}
/* the arrow keys move a focused token by one square (hold Shift for three) */
function bmKey(el,e){
  const cfg=bmCfg();
  if(!cfg)return false;
  if(el.classList.contains('bmk')){
    const m=cfg.adm&&cfg.mk[el.dataset.id];
    if(!m)return false;
    const s2=e.shiftKey?3:1;
    const mx={ArrowLeft:-s2,ArrowRight:s2}[e.key]||0,my={ArrowUp:-s2,ArrowDown:s2}[e.key]||0;
    if(!mx&&!my)return false;
    bmMkMove(el.dataset.id,num(m.x)+mx,num(m.y)+my);
    e.preventDefault();
    render();
    return true;
  }
  const t=bmTokens(cfg).find(k=>k.cid===el.dataset.cid);
  if(!t||!t.mine||!t.placed)return false;
  const s=e.shiftKey?3:1;
  const dx={ArrowLeft:-s,ArrowRight:s}[e.key]||0,dy={ArrowUp:-s,ArrowDown:s}[e.key]||0;
  if(!dx&&!dy)return false;
  bmSetPos(t.cid,t.x+dx,t.y+dy);
  e.preventDefault();
  render();
  return true;
}

/* the map keeps its scroll position across a redraw; after a zoom it keeps the same centre */
function bmScrollAfterRender(prev){
  const mv=document.getElementById('bmview');
  if(!mv)return;
  const zc=S.ui.bm.zc;
  if(zc){
    S.ui.bm.zc=null;
    mv.scrollLeft=zc[0]*mv.scrollWidth-mv.clientWidth/2;
    mv.scrollTop=zc[1]*mv.scrollHeight-mv.clientHeight/2;
  }else if(prev){mv.scrollLeft=prev[0];mv.scrollTop=prev[1];}
}

/* ----- the page ----- */
function bmSwitch(){
  if(!bmAvail())return '';
  const v=S.ui.bt.view==='map'?'map':'order';
  return h`<div class="row bmsw"><div class="seg" role="group" aria-label="Battle view"><button data-act="bm_view" data-v="order" aria-pressed="${String(v==='order')}">Turn order</button><button data-act="bm_view" data-v="map" aria-pressed="${String(v==='map')}">Map</button></div></div>`;
}
function bmTurnBar(){
  const b=BT(),gm=!!S.me.admin,ord=btOrder();
  const cur=b.turn&&ord.indexOf(b.turn)>=0?b.turn:'';
  const cv=cur?btInfo(cur,gm):null;
  const mine=cv&&cv.side==='a'&&canEditT(cv.uid);
  return h`<div class="row sp bmturn">${b.on&&cv?h`<p class="bnow ${mine?'mine':''}"><b>Round ${num(b.round)||1}</b> · ${mine?'Your turn: ':''}<b>${cv.name}</b> is acting${cv.side==='a'?' · '+cv.owner:''}</p>`:h`<span class="sub">${ord.length?(b.on?'':(gm?'Roll initiative on the Turn order page to start.':'The GM is setting up the battle.')):'No battle is running.'}</span>`}${gm&&b.on?h`<button class="btn sm" data-act="b_next">Next turn</button>`:''}</div>`;
}
function bmGridSvg(cfg){
  if(!cfg.grid)return '';
  const sw=Math.max(1,cfg.w/700),g=cfg.gx;
  return h`<svg class="bmgrid" viewBox="0 0 ${cfg.w} ${cfg.h}" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="bmpat" patternUnits="userSpaceOnUse" x="${cfg.ox}" y="${cfg.oy}" width="${g}" height="${g}"><path d="M${g} 0H0V${g}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="${sw*1.6}"/><path d="M${g} 0H0V${g}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="${sw*0.7}"/></pattern></defs><rect width="${cfg.w}" height="${cfg.h}" fill="url(#bmpat)"/></svg>`;
}
function bmMarkSvg(cfg){
  const u=S.ui.bm;
  const r=cfg.gx*0.18;
  const dot=u.calA?'<circle cx="'+u.calA.ix+'" cy="'+u.calA.iy+'" r="'+r+'" fill="#ffd43b" stroke="#000" stroke-width="'+(r*0.3)+'"/>':'';
  const tpl=bmTpAll(cfg);
  return h`<svg class="bmov" viewBox="0 0 ${cfg.w} ${cfg.h}" preserveAspectRatio="none" aria-hidden="true"><g id="bmtp">${raw(bmTplSvg(cfg,tpl,u.tsel))}</g><g id="bmdr"></g><g id="bmrl">${raw(bmRulerSvg(cfg,u.ruler?u.rl:null))}</g><g>${raw(dot)}</g></svg>`;
}
function bmInfoBar(cfg,toks){
  const u=S.ui.bm,gm=!!S.me.admin;
  const mi=u.msel?bmMkInfo(cfg):'';
  if(mi)return mi;
  const t=toks.find(k=>k.cid===u.sel);
  if(!t)return h`<p class="sub bminfo" aria-live="polite">${u.cal===1?'Tap one corner of a grid square.':u.cal===2?'Now tap the opposite corner of the same square.':u.ruler?'Drag across the map to measure.':u.tool==='tpl'?'Tap a square to place the shape.':u.tool==='paint'?'Drag across the map to paint.':u.tool==='fog'?'Drag across the map to uncover or cover squares.':u.tool==='mark'?'Tap a square to drop a marker.':'Tap a token to select it. Drag a token you may move, or tap it and then tap a square.'}</p>`;
  const under=t.placed?bmTerUnder(cfg,t):[];
  const v=t.v,open=gm||(t.side==='a'&&canEditT(v.uid));
  return h`<div class="bminfo sel" aria-live="polite"><div class="row sp"><div class="btx"><b>${v.name}</b> <span class="sub">${t.side==='a'?v.owner:'Foe'}${t.placed?' · column '+(t.x+1)+', row '+(t.y+1):' · not on the map yet'}${under.length?' · on '+under.join(' and '):''}</span>
      <div class="types">${v.types&&v.types.length?chipsOf(v.types):''}${v.status?h`<span class="pill status">${v.status}</span>`:''}${v.down?h`<span class="pill">Down</span>`:''}${t.side==='f'&&gm?h`<span class="pill ${t.vis?'good':'gm'}">${t.vis?'Shown to players':'Hidden from players'}</span>`:''}${t.side==='f'&&gm&&t.vis&&t.placed&&cfg.fg&&!bmRowsSeen(bmFe(cfg),t.x,t.y,t.fp)?h`<span class="pill gm">In the fog: players cannot see it</span>`:''}</div></div>
      <div class="bhp">${btHpView(v)}</div></div>
    ${t.mine&&!t.placed?h`<p class="sub">Tap a square on the map to put it there.</p>`:''}
    <div class="row bmbtns">${t.mine&&t.placed?h`<span class="bmnudge" role="group" aria-label="Move one square"><button class="btn sm" data-act="bm_nudge" data-dx="0" data-dy="-1" aria-label="Up one square">↑</button><button class="btn sm" data-act="bm_nudge" data-dx="-1" data-dy="0" aria-label="Left one square">←</button><button class="btn sm" data-act="bm_nudge" data-dx="1" data-dy="0" aria-label="Right one square">→</button><button class="btn sm" data-act="bm_nudge" data-dx="0" data-dy="1" aria-label="Down one square">↓</button></span><button class="btn sm" data-act="bm_off" data-cid="${t.cid}">Take off the map</button>`:''}
      ${gm&&t.side==='f'&&t.placed?h`<button class="btn sm ${t.vis?'':'primary'}" data-act="bm_vis" data-cid="${t.cid}" data-on="${t.vis?0:1}">${t.vis?'Hide from players':'Show to players'}</button>`:''}
      ${open?h`<button class="btn sm ghost" data-act="bm_open" data-cid="${t.cid}">Open details</button>`:''}
      <button class="btn sm ghost" data-act="bm_desel">Done</button></div></div>`;
}
function bmTray(toks){
  const u=S.ui.bm;
  const un=toks.filter(t=>!t.placed&&t.mine);
  if(!un.length)return '';
  return h`<div class="bmtray"><span class="fl">Not on the map yet</span><div class="row evchips">${un.map(t=>h`<button class="btn sm chk" data-act="bm_sel" data-cid="${t.cid}" data-bmt="${t.cid}" aria-pressed="${String(u.sel===t.cid)}">${t.side==='a'?monIcon(t.v.m):h`<span class="mi-ph unk" aria-hidden="true">?</span>`}${t.v.name}${t.side==='f'?h` <span class="sub">foe</span>`:''}</button>`)}</div>
    ${u.sel&&un.some(t=>t.cid===u.sel)?h`<p class="sub">Tap a square on the map to put it there.</p>`:''}</div>`;
}
function bmSetup(cfg){
  const g=bmG(),u=S.ui.bm,has=!!cfg;
  const live=!!g.live;
  const foes=Object.keys(g.f||{});
  const fnum=(label,path,v)=>h`<label class="fld"><span class="fl">${label}</span><input type="number" inputmode="decimal" step="any" ${bd('bg','bmap',path)} value="${v}"></label>`;
  return h`<div class="mgd bmsetup"><b>${has?'Map settings':'Add a map'}</b>
    <div class="row"><button class="btn sm primary" data-act="bm_pick">${has&&!g.blank?'Replace the picture':'Upload a picture'}</button>
      <span class="sub">A photo or drawing of the area. It is shrunk to fit and kept private until you show it.</span></div>
    <div class="fgrid"><label class="fld"><span class="fl">Blank grid: columns</span><input type="number" inputmode="numeric" min="4" max="80" data-u="bm.cols" data-nr value="${u.cols}" placeholder="20"></label>
      <label class="fld"><span class="fl">Rows</span><input type="number" inputmode="numeric" min="4" max="80" data-u="bm.rows" data-nr value="${u.rows}" placeholder="15"></label></div>
    <div class="row"><button class="btn sm" data-act="bm_blank">${has?'Replace with a blank grid':'Use a blank grid'}</button></div>
    ${has?h`<div class="bmcal"><b>Grid</b>
      ${g.blank?'':h`<p class="sub">Line the grid up with the squares printed on the picture: say how many squares run across it, or tap two opposite corners of one square, then fine-tune below.</p>
      <div class="row"><label class="fld"><span class="fl">Squares across</span><input type="number" inputmode="numeric" min="1" max="200" data-u="bm.cn" data-nr value="${u.cn}" placeholder="24"></label><button class="btn sm" data-act="bm_cols">Set</button>
        <button class="btn sm ${u.cal?'primary':''}" data-act="bm_cal" aria-pressed="${String(!!u.cal)}">${u.cal===1?'Tap the first corner…':u.cal===2?'Tap the opposite corner…':'Mark one square'}</button></div>
      <div class="fgrid">${fnum('Square size (pixels)','gx',g.gx)}${fnum('Offset across','ox',g.ox)}${fnum('Offset down','oy',g.oy)}</div>`}
      <label class="row"><input type="checkbox" ${bd('bg','bmap','grid')} ${g.grid!==false?raw('checked'):''}><span>Show the grid lines</span></label>
      <label class="row"><input type="checkbox" ${bd('bg','bmap','tsh')} ${g.tsh!==false?raw('checked'):''}><span>Show painted terrain to the players</span></label>
      <label class="row"><input type="checkbox" ${bd('bg','bmap','wt')} ${g.wt!==false?raw('checked'):''}><span>Walls stop tokens from moving onto or through them</span></label>
      <p class="sub">Paint Wall squares with Paint terrain. Attack shapes stop at walls too (you can turn that off for a single shape). Players are only stopped by walls they can see. Hold Shift while dragging or tapping to move a token through a wall yourself.</p></div>
    ${bmFogSettings(g,cfg)}
    <div class="bmlive"><b>Players</b>
      <p class="sub">${live?'The players can see this map, with the foes you have shown.':'The players cannot see this map yet.'}</p>
      <div class="row"><button class="btn sm ${live?'':'primary'}" data-act="bm_live" data-on="${live?0:1}">${live?'Hide the map from the players':'Show the map to the players'}</button>
        ${foes.length?h`<button class="btn sm" data-act="bm_revall">Show all foes</button><button class="btn sm" data-act="bm_hideall">Hide all foes</button>`:''}</div></div>
    <div class="row"><button class="btn sm ${S.ui.confirm==='bm|clr'?'armed':''}" data-act="bm_clear">${S.ui.confirm==='bm|clr'?'Tap again to clear every token':'Clear every token'}</button>
      <button class="btn sm danger ${S.ui.confirm==='bm|rm'?'armed':''}" data-act="bm_rm">${S.ui.confirm==='bm|rm'?'Tap again to remove the map':'Remove the map'}</button></div>`:''}
    ${bmSetup2(cfg)}
  </div>`;
}
function bmapPanel(){
  const cfg=bmCfg(),gm=!!S.me.admin,u=S.ui.bm;
  if(!cfg){
    return h`<section class="panel bmp"><div class="ph"><h2>Battle map</h2>${gm?h`<span class="pill gm">GM only</span>`:''}</div>
      ${gm?h`<p class="sub">No battle map yet. Upload a picture of the area, or start with a blank grid.</p>${bmSetup(null)}`:h`<p class="sub">The GM has not shared a battle map.</p>`}</section>`;
  }
  const toks=bmTokens(cfg);
  const placed=toks.filter(t=>t.placed&&(t.vis||gm));
  const z=clamp(num(u.zoom)||1,1,4);
  const tool=!!(u.ruler||u.tool==='tpl'||u.tool==='paint'||u.tool==='fog');
  const mks=bmMkList(cfg);
  const tpl=bmTpAll(cfg);
  const bg=cfg.blank?h`<div class="bmbg blank" style="aspect-ratio:${cfg.w}/${cfg.h}"></div>`:(cfg.src?h`<img class="bmbg" src="${cfg.src}" alt="" draggable="false" width="${cfg.w}" height="${cfg.h}" style="aspect-ratio:${cfg.w}/${cfg.h}">`:h`<div class="bmbg blank load" style="aspect-ratio:${cfg.w}/${cfg.h}"><span>Loading the map…</span></div>`);
  return h`<section class="panel bmp"><div class="ph"><h2>Battle map</h2>${gm?(cfg.live?h`<span class="pill good">Shown to players</span>`:h`<span class="pill gm">Hidden from players</span>`):''}
      <div class="acts"><span class="seg" role="group" aria-label="Zoom">${[1,2,3,4].map(n=>h`<button data-act="bm_zoom" data-z="${n}" aria-pressed="${String(z===n)}">${n===1?'Fit':n+'×'}</button>`)}</span>
        <button class="btn sm ${u.ruler?'primary':''}" data-act="bm_ruler" aria-pressed="${String(!!u.ruler)}">Ruler</button>
        ${gm?h`<button class="btn sm" data-act="bm_setup" aria-expanded="${String(!!u.setup)}">${u.setup?'Close settings':'Settings'}</button>`:''}</div></div>
    ${bmTurnBar()}
    ${bmTools(cfg)}
    ${bmOpts(cfg,toks)}
    ${u.ruler?h`<p class="sub" id="bmrlnote" aria-live="polite">${bmRulerText(u.rl)||'Drag across the map to measure.'}</p>`:''}
    <div class="bmview ${tool?'tool':''} ${u.cal?'cal':''}" id="bmview" role="region" aria-label="Battle map, scrollable" tabindex="0">
      <div class="bmmap" id="bmmap" data-act="bm_map" style="width:${z===1?'min(100%,'+(72*cfg.w/cfg.h).toFixed(3)+'vh)':z*100+'%'}">${bg}${bmTerSvg(cfg)}${bmGridSvg(cfg)}${bmFogSvg(cfg)}${bmMarkSvg(cfg)}${mks.map(m=>bmMkEl(cfg,m))}${placed.map(t=>bmTok(cfg,t))}</div></div>
    ${bmLegend(cfg)}
    ${gm&&cfg.fg?h`<p class="sub bmfogkey">Fog of war is on. Hatched squares are hidden from the players; lighter ones were seen earlier but are out of sight now.</p>`:''}
    ${bmInfoBar(cfg,toks)}
    ${bmTplList(cfg,toks,tpl)}
    ${bmTray(toks)}
    ${gm&&u.setup?bmSetup(cfg):''}
  </section>`;
}
function bmAct(b,e){
  const d=b.dataset,u=S.ui.bm,gm=!!S.me.admin;
  switch(d.act){
    case 'bm_view':S.ui.bt.view=d.v==='map'?'map':'order';render();break;
    case 'bm_zoom':{
      const mv=document.getElementById('bmview');
      if(mv&&mv.scrollWidth)u.zc=[(mv.scrollLeft+mv.clientWidth/2)/mv.scrollWidth,(mv.scrollTop+mv.clientHeight/2)/mv.scrollHeight];
      u.zoom=clamp(+d.z||1,1,4);render();break;}
    case 'bm_sel':{
      if(bmMoved)break;
      u.sel=u.sel===d.cid?'':d.cid;u.msel='';render();break;}
    case 'bm_desel':u.sel='';render();break;
    case 'bm_map':{
      if(bmMoved||bmRl)break;
      const cfg=bmCfg(),p=bmPoint(e);
      if(!cfg||!p)break;
      if(u.cal){bmCalClick(p);break;}
      if(u.ruler||u.tool==='tpl'||u.tool==='paint'||u.tool==='fog')break;
      if(u.tool==='mark'&&gm){const mc=bmCellOf(cfg,p);bmMkAdd(mc.x,mc.y);render();break;}
      if(!u.sel)break;
      const c=bmCellOf(cfg,p);
      const t=bmTokens(cfg).find(k=>k.cid===u.sel);
      if(!t||!t.mine)break;
      /* the tapped square becomes the token's top left, unless that would push it off the map */
      bmSetPos(u.sel,c.x,c.y,{free:bmFree(e)});render();break;}
    case 'bm_nudge':{
      const cfg=bmCfg();
      const t=cfg&&bmTokens(cfg).find(k=>k.cid===u.sel);
      if(!t||!t.mine||!t.placed)break;
      bmSetPos(t.cid,t.x+num(d.dx),t.y+num(d.dy));render();break;}
    case 'bm_off':bmOff(d.cid);render();break;
    case 'bm_vis':bmFoeVis(d.cid,d.on==='1');render();break;
    case 'bm_open':S.ui.bt.view='order';S.ui.bt.open[d.cid]=true;S.ui.bm.sel=d.cid;render();break;
    case 'bm_ruler':u.ruler=!u.ruler;u.rl=null;u.cal=0;u.calA=null;if(u.ruler)u.tool='';render();break;
    case 'bm_setup':u.setup=!u.setup;render();break;
    case 'bm_cal':if(!gm)break;u.cal=u.cal?0:1;u.calA=null;u.ruler=false;if(u.cal)u.tool='';render();break;
    case 'bm_cols':if(gm)bmCols();break;
    case 'bm_pick':{
      if(!gm)break;
      S.pick={spec:'bmap|bmap|img',w:0,h:0,max:1600,cap:700000};
      const fp=document.getElementById('filepick');
      if(fp){fp.value='';fp.click();}
      break;}
    case 'bm_blank':if(gm)bmBlank();break;
    case 'bm_live':if(gm)bmLive(d.on==='1');break;
    case 'bm_revall':bmReveal(true);break;
    case 'bm_hideall':bmReveal(false);break;
    case 'bm_clear':if(gm)ntTwice('bm|clr',()=>{bmClearTokens();toast('Every token was taken off the map.',true);render();});break;
    case 'bm_rm':if(gm)ntTwice('bm|rm',()=>bmRemoveMap());break;
    default:bm2Act(b,e);
  }
}

/* ---------- Battle map, part two: range shapes, painted terrain, markers, saved formations, a library of saved maps ----------
   Where the new things live (all in places the existing rules already cover, so there is no rules change):
     gm/bmap            gains  ter (painted terrain, one string per row), tsh (show terrain to players), mk (markers),
                               tp (range shapes the GM drew), fm (saved formations)
     meta/bmap          gains  ter, mk, tp, but only what the GM has chosen to show, and only while the map is shown
     config/bsc_<id>    one saved map in the GM's library (settings, terrain, markers, formations); GM-only, like the table code
     config/bsi_<id>_<n> its picture, in chunks, so the library never slows down the live GM listener
   A player's own range shapes are never saved anywhere: they are for measuring at the table. */
S.ui.bm=Object.assign({tool:'',tk:'burst',tn:2,td:2,tw:1,tp:[],tsel:'',tshare:false,tb:true,pb:'W',pz:1,mk:'note',ml:'',msel:'',fn:'',sn:''},S.ui.bm);
S.bmLib=S.bmLib||{};

const BM_DIRS=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
const BM_DIRN=['north','north-east','east','south-east','south','south-west','west','north-west'];
const BM_DARR=['↑','↗','→','↘','↓','↙','←','↖'];
const BM_TK=[['burst','Burst'],['cone','Cone'],['line','Line'],['blast','Blast']];
const BM_TKMAX={burst:10,cone:20,line:20,blast:10};
const BM_TER=[['W','Water'],['D','Rough ground'],['B','Wall'],['H','Hazard'],['C','Cover']];
const BM_TERK={};BM_TER.forEach(t=>{BM_TERK[t[0]]=t[1];});
const BM_MK=[['note','Note','i'],['trap','Trap','!'],['item','Item','★'],['exit','Exit','E'],['goal','Objective','◆'],['start','Start','S']];
const BM_MKD={};BM_MK.forEach(m=>{BM_MKD[m[0]]=m;});
const BM_TPMAX=6,BM_MKMAX=40,BM_FMMAX=8,BM_SCENES=6;
const bmLibOk=()=>!!(typeof CFG!=='undefined'&&CFG&&S.me.admin);
const bmFt=n=>n*5;

/* ===== walls =====
   A Wall square (terrain "B") stops two things: a range shape cannot reach past it, and a token cannot be moved onto or through it.
   Both use the same idea of a straight line from one square to another, counting a diagonal step as one square like the ruler. */
const bmRs=v=>v<0?-Math.round(-v):Math.round(v);
function bmWalls(cfg){
  if(cfg._w)return cfg._w;
  const s=new Set();
  cfg.ter.forEach((r,y)=>{if(y>=cfg.rows)return;for(let x=0;x<r.length&&x<cfg.cols;x++)if(r[x]==='B')s.add(x+','+y);});
  return (cfg._w=s);
}
const bmHasWalls=cfg=>bmWalls(cfg).size>0;
/* walls only stop tokens when the GM has left that switched on, and only the walls this person can see */
const bmWallsOn=cfg=>cfg.wt!==false&&bmHasWalls(cfg);
const bmFree=e=>!!(S.me.admin&&e&&e.shiftKey);
function bmFootBlocked(cfg,fp,x,y){
  const w=bmWalls(cfg);
  for(let a=0;a<fp;a++)for(let b=0;b<fp;b++)if(w.has((x+a)+','+(y+b)))return true;
  return false;
}
/* can the effect reach (x1,y1) from (x0,y0)? The squares in between must be open, and it cannot squeeze diagonally between two walls. */
function bmClearLine(cfg,x0,y0,x1,y1,seeWall){
  if(x0===x1&&y0===y1)return true;
  const w=bmWalls(cfg);
  /* sight (seeWall) can end on a wall: you see the wall, not what is behind it */
  if(!seeWall&&w.has(x1+','+y1))return false;
  const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
  let px=x0,py=y0;
  for(let i=1;i<=n;i++){
    const x=x0+bmRs((x1-x0)*i/n),y=y0+bmRs((y1-y0)*i/n);
    if(x!==px&&y!==py&&w.has(x+','+py)&&w.has(px+','+y))return false;
    if(i<n&&w.has(x+','+y))return false;
    px=x;py=y;
  }
  return true;
}
/* one step of a token, from (px,py) to a neighbouring square (x,y) */
function bmStepOk(cfg,fp,px,py,x,y){
  if(bmFootBlocked(cfg,fp,x,y))return false;
  if(x!==px&&y!==py&&bmFootBlocked(cfg,fp,x,py)&&bmFootBlocked(cfg,fp,px,y))return false;
  return true;
}
/* walks a token toward a square one step at a time and stops in front of the first wall */
function bmWalk(cfg,fp,from,to){
  let px=from.x,py=from.y;
  const n=Math.max(Math.abs(to.x-px),Math.abs(to.y-py));
  for(let i=1;i<=n;i++){
    const x=from.x+bmRs((to.x-from.x)*i/n),y=from.y+bmRs((to.y-from.y)*i/n);
    if(!bmStepOk(cfg,fp,px,py,x,y))return {x:px,y:py,blocked:true};
    px=x;py=y;
  }
  return {x:px,y:py,blocked:false};
}

/* ===== range shapes =====
   A square is 5 ft. Distances count a diagonal step as one square, the same as the ruler, so a Burst is a square block. */
function bmTplRaw(cfg,t){
  const n=Math.max(1,Math.round(num(t.n))||1),x0=num(t.x),y0=num(t.y),out=[];
  const add=(x,y)=>{if(x>=0&&y>=0&&x<cfg.cols&&y<cfg.rows)out.push([x,y]);};
  const d=((Math.round(num(t.d))%8)+8)%8,dx=BM_DIRS[d][0],dy=BM_DIRS[d][1];
  if(t.k==='burst'){
    for(let y=-n;y<=n;y++)for(let x=-n;x<=n;x++)add(x0+x,y0+y);
  }else if(t.k==='blast'){
    const a=Math.floor((n-1)/2);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)add(x0-a+x,y0-a+y);
  }else if(t.k==='line'){
    const w=clamp(Math.round(num(t.w))||1,1,5),lo=-Math.floor((w-1)/2);
    for(let k=1;k<=n;k++)for(let j=0;j<w;j++){
      const o=lo+j;
      /* straight lines widen sideways; diagonal ones widen across */
      if(dx===0||dy===0)add(x0+dx*k+(-dy)*o,y0+dy*k+dx*o);else add(x0+dx*k+o,y0+dy*k);
    }
  }else{
    /* a cone is as wide as it is long, widening evenly on both sides */
    if(dx===0||dy===0){
      for(let k=1;k<=n;k++){const hw=Math.floor(k/2);for(let o=-hw;o<=hw;o++)add(x0+dx*k+(-dy)*o,y0+dy*k+dx*o);}
    }else{
      for(let a=1;a<=n;a++)for(let b=1;b<=n;b++)if(Math.max(a,b)<=2*Math.min(a,b))add(x0+dx*a,y0+dy*b);
    }
  }
  return out;
}
/* the squares a shape covers: walls cut it short, unless that shape was set to ignore them.
   A shape the GM shared arrives with its squares already worked out (so a player who cannot see the walls still sees the same shape). */
function bmTplCells(cfg,t){
  if(!cfg.adm&&Array.isArray(t.c)){
    const out=[];
    for(let i=0;i+1<t.c.length;i+=2){const x=num(t.c[i]),y=num(t.c[i+1]);if(x>=0&&y>=0&&x<cfg.cols&&y<cfg.rows)out.push([x,y]);}
    return out;
  }
  const all=bmTplRaw(cfg,t);
  if(t.b===0||!bmHasWalls(cfg))return all;
  const x0=num(t.x),y0=num(t.y);
  return all.filter(c=>bmClearLine(cfg,x0,y0,c[0],c[1]));
}
const bmTplCut=(cfg,t)=>t.b!==0&&(Array.isArray(t.c)||bmHasWalls(cfg))&&bmTplCells(cfg,t).length<bmTplRaw(cfg,t).length;
function bmTplName(t){
  const n=Math.max(1,Math.round(num(t.n))||1),d=BM_DIRN[((Math.round(num(t.d))%8)+8)%8];
  if(t.k==='burst')return 'Burst, '+n+(n===1?' square':' squares')+' out ('+bmFt(n)+' ft)';
  if(t.k==='blast')return 'Blast, '+n+' by '+n+' ('+bmFt(n)+' ft)';
  if(t.k==='line'){const w=clamp(Math.round(num(t.w))||1,1,5);return 'Line, '+n+(n===1?' square':' squares')+' long'+(w>1?', '+w+' wide':'')+', pointing '+d;}
  return 'Cone, '+n+(n===1?' square':' squares')+' long, pointing '+d;
}
function bmTplHits(cfg,t,toks){
  const gm=cfg.adm,set=new Set(bmTplCells(cfg,t).map(c=>c[0]+','+c[1])),out=[];
  toks.forEach(k=>{
    if(!k.placed||!(k.vis||gm))return;
    let hit=false,centre=false;
    for(let a=0;a<k.fp;a++)for(let b=0;b<k.fp;b++){
      if(set.has((k.x+a)+','+(k.y+b)))hit=true;
      if(num(t.x)===k.x+a&&num(t.y)===k.y+b)centre=true;
    }
    if(hit)out.push({k,centre});
  });
  return out;
}
function bmHitsText(cfg,hits,t){
  if(!hits.length)return 'Nobody';
  const mid=t&&(t.k==='burst'||t.k==='blast')?' (at the centre)':' (on the starting square)';
  return hits.map(x=>x.k.v.name+(x.centre?mid:'')+(cfg.adm&&!x.k.vis?' (hidden)':'')).join(', ');
}
/* the shapes this person can see: the GM's own (saved on the GM's document), or the ones the GM shared plus the viewer's own */
function bmTpAll(cfg){
  const out=[],src=cfg.tp||{};
  Object.keys(src).sort().forEach(id=>{
    const t=src[id];
    if(!t||!BM_TK.some(k=>k[0]===t.k))return;
    out.push({id,k:t.k,x:num(t.x),y:num(t.y),n:num(t.n)||1,d:num(t.d),w:num(t.w)||1,b:t.b===0||t.b===false?0:1,c:Array.isArray(t.c)?t.c:undefined,own:cfg.adm,sh:cfg.adm?num(t.sh)>0:true});
  });
  if(!cfg.adm)(S.ui.bm.tp||[]).forEach(t=>out.push(Object.assign({own:true,sh:false,loc:true},t)));
  return out;
}
function bmTplSvg(cfg,list,sel){
  const g=cfg.gx;
  return list.map(t=>{
    const cells=bmTplCells(cfg,t);
    const cls='bmtpl k-'+t.k+(t.sh?' sh':'')+(t.draft?' draft':'')+(t.id&&t.id===sel?' sel':'');
    return '<g class="'+cls+'">'+cells.map(c=>'<rect x="'+(cfg.ox+c[0]*g)+'" y="'+(cfg.oy+c[1]*g)+'" width="'+g+'" height="'+g+'"/>').join('')
      +'<circle class="bmtpo" cx="'+(cfg.ox+(num(t.x)+0.5)*g)+'" cy="'+(cfg.oy+(num(t.y)+0.5)*g)+'" r="'+(g*0.2)+'"/></g>';
  }).join('');
}
function bmTplAdd(t){
  const cfg=bmCfg(),u=S.ui.bm;
  if(!cfg)return;
  const o={k:t.k,x:t.x,y:t.y,n:t.n,d:t.d,w:t.w,b:t.b===0?0:1};
  if(cfg.adm){
    const tp=Object.assign({},bmG().tp||{}),keys=Object.keys(tp).sort();
    while(keys.length>=BM_TPMAX)delete tp[keys.shift()];
    const id='t'+Date.now().toString(36)+Math.random().toString(36).slice(2,4);
    tp[id]=Object.assign({sh:u.tshare?1:0},o);
    edit('bg','bmap','tp',tp);
    u.tsel=id;
    bmSync();
  }else{
    const id='l'+Date.now().toString(36)+Math.random().toString(36).slice(2,4);
    u.tp=(u.tp||[]).concat([Object.assign({id},o)]).slice(-BM_TPMAX);
    u.tsel=id;
  }
}
function bmTplDel(id){
  const cfg=bmCfg(),u=S.ui.bm;
  if(!cfg)return;
  if(cfg.adm){const tp=Object.assign({},bmG().tp||{});delete tp[id];edit('bg','bmap','tp',tp);bmSync();}
  else u.tp=(u.tp||[]).filter(t=>t.id!==id);
  if(u.tsel===id)u.tsel='';
}
function bmTplShare(id,on){
  if(!S.me.admin||!(bmG().tp||{})[id])return;
  edit('bg','bmap','tp.'+id+'.sh',on?1:0);
  bmSync();
}
function bmTplClear(){
  const cfg=bmCfg();
  if(!cfg)return;
  if(cfg.adm){if(Object.keys(bmG().tp||{}).length){edit('bg','bmap','tp',{});bmSync();}}
  else S.ui.bm.tp=[];
  S.ui.bm.tsel='';
}
/* drawing: press where it starts. A cone or a line points where you drag; a burst or blast follows your finger. */
let bmTp=null,bmPn=null;
function bmTplDraft(){
  const u=S.ui.bm,d=bmTp;
  return d?{k:u.tk,x:d.x,y:d.y,n:clamp(Math.round(num(u.tn))||1,1,BM_TKMAX[u.tk]||10),d:d.d,w:clamp(Math.round(num(u.tw))||1,1,5),b:u.tb===false?0:1,draft:true}:null;
}
function bmTplDraw(){
  const cfg=bmCfg(),g=document.getElementById('bmdr'),note=document.getElementById('bmtpnote'),dr=bmTplDraft();
  if(!cfg)return;
  if(g)g.innerHTML=dr?bmTplSvg(cfg,[dr]):'';
  if(note)note.textContent=dr?bmTplName(dr)+'. In the area: '+bmHitsText(cfg,bmTplHits(cfg,dr,bmTokens(cfg)),dr)+'.':'';
}
function bmTplStart(e){
  const cfg=bmCfg(),p=bmPoint(e),u=S.ui.bm;
  if(!cfg||!p)return;
  const c=bmCellOf(cfg,p);
  bmTp={x:c.x,y:c.y,d:clamp(Math.round(num(u.td)),0,7),sx:e.clientX,sy:e.clientY};
  bmBusy=true;
  try{bmMapEl().setPointerCapture(e.pointerId);}catch(err){}
  bmTplDraw();
  e.preventDefault();
}
function bmTplMove(e){
  const d=bmTp,cfg=bmCfg(),p=bmPoint(e),u=S.ui.bm;
  if(!d||!cfg||!p)return;
  if(u.tk==='cone'||u.tk==='line'){
    const dx=e.clientX-d.sx,dy=e.clientY-d.sy;
    if(Math.hypot(dx,dy)>=12)d.d=(((Math.round(Math.atan2(dy,dx)/(Math.PI/4))+2)%8)+8)%8;
  }else{
    const c=bmCellOf(cfg,p);d.x=c.x;d.y=c.y;
  }
  bmTplDraw();
}
function bmTplEnd(){
  const dr=bmTplDraft();
  bmTp=null;bmBusy=false;
  if(dr){const o={k:dr.k,x:dr.x,y:dr.y,n:dr.n,d:dr.d,w:dr.w,b:dr.b};bmTplAdd(o);}
  bmQueued=false;
  render();
}

/* ===== painted terrain ===== */
function bmTerAt(cfg,x,y){return (cfg.ter[y]||'')[x]||'.';}
function bmTerUnder(cfg,t){
  const seen=[];
  for(let a=0;a<t.fp;a++)for(let b=0;b<t.fp;b++){
    const c=bmTerAt(cfg,t.x+a,t.y+b);
    if(BM_TERK[c]&&seen.indexOf(c)<0)seen.push(c);
  }
  return seen.map(c=>BM_TERK[c].toLowerCase());
}
function bmTerGrid(cfg){
  const g=[];
  for(let y=0;y<cfg.rows;y++){const r=cfg.ter[y]||'',a=[];for(let x=0;x<cfg.cols;x++)a.push(r[x]||'.');g.push(a);}
  return g;
}
const bmTerPack=rows=>{
  const r=rows.map(a=>(Array.isArray(a)?a.join(''):a).replace(/\.+$/,''));
  while(r.length&&!r[r.length-1])r.pop();
  return r;
};
function bmTerRuns(cfg,rows){
  let s='';
  const g=cfg.gx;
  for(let y=0;y<cfg.rows;y++){
    const r=rows[y]||'';
    let x=0;
    while(x<cfg.cols){
      const ch=r[x]||'.';
      let x2=x+1;
      while(x2<cfg.cols&&(r[x2]||'.')===ch)x2++;
      if(BM_TERK[ch])s+='<rect x="'+(cfg.ox+x*g)+'" y="'+(cfg.oy+y*g)+'" width="'+((x2-x)*g)+'" height="'+g+'" fill="url(#bmt'+ch+')"/>';
      x=x2;
    }
  }
  return s;
}
function bmTerDefs(cfg){
  const g=cfg.gx,f=n=>+(g*n).toFixed(3),sw=f(0.06);
  const p=(id,inner)=>'<pattern id="bmt'+id+'" patternUnits="userSpaceOnUse" x="'+cfg.ox+'" y="'+cfg.oy+'" width="'+g+'" height="'+g+'">'+inner+'</pattern>';
  const bg=(c,o)=>'<rect width="'+g+'" height="'+g+'" fill="'+c+'" fill-opacity="'+o+'"/>';
  return '<defs>'
    +p('W',bg('#2f7fe0',.4)+'<path d="M0 '+f(.3)+'Q'+f(.125)+' '+f(.15)+' '+f(.25)+' '+f(.3)+'T'+f(.5)+' '+f(.3)+'T'+f(.75)+' '+f(.3)+'T'+g+' '+f(.3)+'M0 '+f(.72)+'Q'+f(.125)+' '+f(.57)+' '+f(.25)+' '+f(.72)+'T'+f(.5)+' '+f(.72)+'T'+f(.75)+' '+f(.72)+'T'+g+' '+f(.72)+'" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="'+sw+'"/>')
    +p('D',bg('#b7791f',.38)+'<path d="M0 '+g+'L'+g+' 0M'+f(-.5)+' '+f(.5)+'L'+f(.5)+' '+f(-.5)+'M'+f(.5)+' '+f(1.5)+'L'+f(1.5)+' '+f(.5)+'" fill="none" stroke="#4a2f06" stroke-opacity=".75" stroke-width="'+sw+'"/>')
    +p('B',bg('#222',.84)+'<path d="M0 '+f(.5)+'H'+g+'M'+f(.5)+' 0V'+f(.5)+'M'+f(.25)+' '+f(.5)+'V'+g+'M'+f(.75)+' '+f(.5)+'V'+g+'" fill="none" stroke="#b6bcc2" stroke-opacity=".6" stroke-width="'+sw+'"/>')
    +p('H',bg('#e5483a',.4)+'<path d="M0 '+f(.5)+'L'+f(.5)+' 0M0 '+g+'L'+g+' 0M'+f(.5)+' '+g+'L'+g+' '+f(.5)+'" fill="none" stroke="#ffd43b" stroke-opacity=".9" stroke-width="'+f(.1)+'"/>')
    +p('C',bg('#2f9e44',.36)+'<circle cx="'+f(.25)+'" cy="'+f(.28)+'" r="'+f(.07)+'" fill="#144d1f" fill-opacity=".85"/><circle cx="'+f(.72)+'" cy="'+f(.3)+'" r="'+f(.07)+'" fill="#144d1f" fill-opacity=".85"/><circle cx="'+f(.5)+'" cy="'+f(.72)+'" r="'+f(.07)+'" fill="#144d1f" fill-opacity=".85"/>')
    +'</defs>';
}
function bmTerSvg(cfg){
  if(!cfg.ter.length&&!(cfg.adm&&S.ui.bm.tool==='paint'))return '';
  return h`<svg class="bmter" viewBox="0 0 ${cfg.w} ${cfg.h}" preserveAspectRatio="none" aria-hidden="true">${raw(bmTerDefs(cfg))}<g id="bmter">${raw(bmTerRuns(cfg,cfg.ter))}</g></svg>`;
}
function bmLegend(cfg){
  const present=new Set();
  cfg.ter.forEach(r=>{for(const ch of r)if(BM_TERK[ch])present.add(ch);});
  const all=cfg.adm&&S.ui.bm.tool==='paint';
  const list=BM_TER.filter(t=>all||present.has(t[0]));
  if(!list.length)return '';
  const g=cfg.gx;
  return h`<ul class="bmleg" aria-label="Terrain key">${list.map(t=>h`<li><svg class="bmswatch" viewBox="${cfg.ox} ${cfg.oy} ${g} ${g}" aria-hidden="true"><rect x="${cfg.ox}" y="${cfg.oy}" width="${g}" height="${g}" fill="url(#bmt${t[0]})"/></svg>${t[1]}</li>`)}</ul>`;
}
function bmPaintStamp(cfg,c){
  const d=bmPn;
  const s=clamp(Math.round(num(S.ui.bm.pz))||1,1,3),lo=-Math.floor((s-1)/2);
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){
    const xx=c.x+lo+x,yy=c.y+lo+y;
    if(xx>=0&&yy>=0&&xx<cfg.cols&&yy<cfg.rows&&d.rows[yy][xx]!==d.ch){d.rows[yy][xx]=d.ch;d.n++;}
  }
}
function bmPaintDraw(){
  const cfg=bmCfg(),g=document.getElementById('bmter');
  if(g&&cfg&&bmPn)g.innerHTML=bmTerRuns(cfg,bmPn.rows.map(a=>a.join('')));
}
function bmPaintStart(e){
  const cfg=bmCfg(),p=bmPoint(e),u=S.ui.bm;
  if(!cfg||!p||!cfg.adm)return;
  const c=bmCellOf(cfg,p);
  bmPn={rows:bmTerGrid(cfg),last:c,ch:u.pb==='.'?'.':(BM_TERK[u.pb]?u.pb:'W'),n:0};
  bmBusy=true;
  try{bmMapEl().setPointerCapture(e.pointerId);}catch(err){}
  bmPaintStamp(cfg,c);bmPaintDraw();
  e.preventDefault();
}
function bmPaintMove(e){
  const d=bmPn,cfg=bmCfg(),p=bmPoint(e);
  if(!d||!cfg||!p)return;
  const c=bmCellOf(cfg,p);
  if(c.x===d.last.x&&c.y===d.last.y)return;
  /* fill in the squares between two samples so a fast stroke leaves no gaps */
  const steps=Math.max(Math.abs(c.x-d.last.x),Math.abs(c.y-d.last.y));
  for(let i=1;i<=steps;i++)bmPaintStamp(cfg,{x:Math.round(d.last.x+(c.x-d.last.x)*i/steps),y:Math.round(d.last.y+(c.y-d.last.y)*i/steps)});
  d.last=c;bmPaintDraw();
}
function bmPaintEnd(){
  const d=bmPn;
  bmPn=null;bmBusy=false;
  if(d&&d.n){edit('bg','bmap','ter',bmTerPack(d.rows));bmSync();}
  bmQueued=false;
  render();
}
function bmTerClear(){
  if(!S.me.admin)return;
  edit('bg','bmap','ter',[]);bmSync();
}

/* ===== markers ===== */
function bmMkList(cfg){
  return Object.keys(cfg.mk||{}).map(id=>Object.assign({id},cfg.mk[id])).filter(m=>m&&num(m.x)>=0&&num(m.y)>=0&&num(m.x)<cfg.cols&&num(m.y)<cfg.rows);
}
function bmMkEl(cfg,m){
  const gm=cfg.adm,u=S.ui.bm,sel=u.msel===m.id,d=BM_MKD[m.k]||BM_MKD.note;
  const shown=gm?num(m.vis)>0:true;
  const label=d[1]+(m.l?': '+m.l:'')+(gm&&!shown?', hidden from players':'')+', column '+(num(m.x)+1)+', row '+(num(m.y)+1)+(gm?'. Drag to move it, or use the arrow keys.':'');
  return h`<button type="button" class="bmk k-${d[0]} ${shown?'':'hid'} ${sel?'sel':''} ${gm?'mine':''}" data-bmk="${m.id}" data-id="${m.id}" data-act="bm_msel" aria-pressed="${String(sel)}" aria-label="${label}" title="${m.l||d[1]}" style="left:${bmPct(cfg.ox+num(m.x)*cfg.gx,cfg.w)};top:${bmPct(cfg.oy+num(m.y)*cfg.gx,cfg.h)};width:${bmPct(cfg.gx,cfg.w)};height:${bmPct(cfg.gx,cfg.h)};--c:${(cfg.gx/cfg.w*100).toFixed(4)}cqw"><span class="bmk-i" aria-hidden="true">${d[2]}</span><span class="bmk-nm">${m.l||d[1]}</span></button>`;
}
function bmMkAdd(x,y){
  const u=S.ui.bm,g=bmG(),mk=Object.assign({},g.mk||{});
  if(Object.keys(mk).length>=BM_MKMAX){toast('That is the most markers a map can hold ('+BM_MKMAX+'). Delete one first.');return;}
  const id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,4);
  mk[id]={x,y,k:BM_MKD[u.mk]?u.mk:'note',l:String(u.ml||'').trim().slice(0,40),vis:0};
  edit('bg','bmap','mk',mk);
  u.msel=id;u.sel='';u.ml='';
  bmSync();
}
function bmMkMove(id,x,y){
  const cfg=bmCfg();
  if(!cfg||!cfg.adm||!(bmG().mk||{})[id])return;
  edit('bg','bmap','mk.'+id+'.x',clamp(Math.round(x),0,cfg.cols-1));
  edit('bg','bmap','mk.'+id+'.y',clamp(Math.round(y),0,cfg.rows-1));
  bmSync();
}
function bmMkDel(id){
  if(!S.me.admin)return;
  const mk=Object.assign({},bmG().mk||{});
  delete mk[id];
  edit('bg','bmap','mk',mk);
  if(S.ui.bm.msel===id)S.ui.bm.msel='';
  bmSync();
}
function bmMkInfo(cfg){
  const u=S.ui.bm,m=bmMkList(cfg).find(k=>k.id===u.msel);
  if(!m)return '';
  const gm=cfg.adm,d=BM_MKD[m.k]||BM_MKD.note,shown=gm?num(m.vis)>0:true;
  if(!gm){
    return h`<div class="bminfo sel" aria-live="polite"><div class="row sp"><div class="btx"><b>${d[1]}</b> <span class="sub">column ${num(m.x)+1}, row ${num(m.y)+1}</span><p>${m.l||'No note.'}</p></div></div><div class="row bmbtns"><button class="btn sm ghost" data-act="bm_mdesel">Done</button></div></div>`;
  }
  const doc=bmG(),p='mk.'+m.id+'.';
  return h`<div class="bminfo sel" aria-live="polite"><div class="row sp"><div class="btx"><b>${d[1]} marker</b> <span class="sub">column ${num(m.x)+1}, row ${num(m.y)+1}</span> <span class="pill ${shown?'good':'gm'}">${shown?'Shown to players':'Hidden from players'}</span></div></div>
    <div class="fgrid">${fText('Note','bg','bmap',p+'l',doc,{ph:'What is here? (players see it only if you show the marker)'})}${fSel('Kind','bg','bmap',p+'k',doc,BM_MK.map(k=>[k[0],k[1]]))}</div>
    <div class="row bmbtns"><button class="btn sm ${shown?'':'primary'}" data-act="bm_mvis" data-id="${m.id}" data-on="${shown?0:1}">${shown?'Hide from players':'Show to players'}</button>
      <button class="btn sm danger" data-act="bm_mdel" data-id="${m.id}">Delete marker</button><button class="btn sm ghost" data-act="bm_mdesel">Done</button></div></div>`;
}

/* ===== formations: where everyone stands, saved by name ===== */
const bmRefKey=r=>String(r||'').replace('/','|');
function bmFmSave(){
  const u=S.ui.bm,g=bmG(),cfg=bmCfg();
  if(!S.me.admin||!cfg)return;
  const name=String(u.fn||'').trim().slice(0,30);
  if(!name){toast('Give the formation a name first.');return;}
  const fm=Object.assign({},g.fm||{});
  let id=Object.keys(fm).find(k=>fm[k].n===name);
  if(!id&&Object.keys(fm).length>=BM_FMMAX){toast('A map keeps up to '+BM_FMMAX+' formations. Delete one to make room.');return;}
  const toks=bmTokens(cfg).filter(t=>t.placed);
  if(!toks.length){toast('Put some tokens on the map first.');return;}
  const a={},f={};
  toks.forEach(t=>{
    if(t.side==='a'){const c=btC(t.cid);if(c)a[bmRefKey(c.r)]=[t.x,t.y];}
    else{const fo=foeOf(t.cid);if(fo&&fo.pn)f[fo.pn]=[t.x,t.y,t.vis?1:0];}
  });
  id=id||('f'+Date.now().toString(36));
  fm[id]={n:name,a,f};
  edit('bg','bmap','fm',fm);
  u.fn='';
  toast('Formation "'+name+'" saved.',true);
  render();
}
function bmFmUse(id){
  const g=bmG(),cfg=bmCfg(),fm=(g.fm||{})[id];
  if(!S.me.admin||!cfg||!fm)return;
  let n=0,skip=0;
  const wl=bmWallsOn(cfg);
  bmTokens(cfg).forEach(t=>{
    const c=btC(t.cid);
    if(!c)return;
    if(t.side==='a'){
      const p=(fm.a||{})[bmRefKey(c.r)];
      if(p){const q=bmClampXY(cfg,t,num(p[0]),num(p[1]));if(wl&&bmFootBlocked(cfg,t.fp,q.x,q.y)){skip++;return;}edit('p',c.r,'bpos',{x:q.x,y:q.y,v:cfg.v});n++;}
    }else{
      const fo=foeOf(t.cid),p=fo&&(fm.f||{})[fo.pn];
      if(p){const q=bmClampXY(cfg,t,num(p[0]),num(p[1]));if(wl&&bmFootBlocked(cfg,t.fp,q.x,q.y)){skip++;return;}edit('bg','bmap','f.'+t.cid,{x:q.x,y:q.y,vis:num(p[2])>0?1:0});n++;}
    }
  });
  bmSync();
  const sk=skip?' '+skip+' stayed where '+(skip===1?'it was':'they were')+', because a wall is on '+(skip===1?'its':'their')+' saved square.':'';
  toast(n||skip?'Formation "'+fm.n+'" put '+n+(n===1?' token':' tokens')+' in place.'+sk:'Nobody in this battle matches that formation.',!!n);
  render();
}
function bmFmDel(id){
  if(!S.me.admin)return;
  const fm=Object.assign({},bmG().fm||{});
  delete fm[id];
  edit('bg','bmap','fm',fm);
  render();
}

/* ===== the library of saved maps ===== */
async function bmSceneSave(){
  const u=S.ui.bm,g=bmG();
  if(!bmLibOk())return;
  if(!g.v){toast('Add a map first.');return;}
  const name=String(u.sn||'').trim().slice(0,40)||String(g.name||'Battle map').slice(0,40);
  let id=Object.keys(S.bmLib).find(k=>S.bmLib[k].name===name);
  if(!id&&Object.keys(S.bmLib).length>=BM_SCENES){toast('The library holds '+BM_SCENES+' maps. Delete one to make room.');return;}
  const n=g.blank?0:num(g.n);
  for(let i=0;i<n;i++){const c=S.bmGmCh[i];if(!c||c.v!==g.v){toast('The map picture is still loading. Try again in a moment.');return;}}
  id=id||('s'+Date.now().toString(36));
  const col=S.db.collection('config'),oldN=num((S.bmLib[id]||{}).n);
  const meta={kind:'bscene',name,at:Date.now(),v:g.v,w:num(g.w),h:num(g.h),blank:!!g.blank,n,gx:num(g.gx)||50,ox:num(g.ox),oy:num(g.oy),grid:g.grid!==false,
    ter:Array.isArray(g.ter)?g.ter:[],tsh:g.tsh!==false,wt:g.wt!==false,fg:g.fg===true,fa:g.fa!==false,fv:clamp(Math.round(num(g.fv))||6,1,30),fw:g.fw!==false,fz:bmFogHand(g.fz),mk:g.mk&&typeof g.mk==='object'?JSON.parse(JSON.stringify(g.mk)):{},fm:g.fm&&typeof g.fm==='object'?JSON.parse(JSON.stringify(g.fm)):{}};
  setStatus('busy');
  try{
    for(let i=0;i<n;i++)await col.doc('bsi_'+id+'_'+i).set({kind:'bsimg',d:S.bmGmCh[i].d,v:g.v});
    for(let i=n;i<oldN;i++)await col.doc('bsi_'+id+'_'+i).delete();
    await col.doc('bsc_'+id).set(meta);
  }catch(e){fail(e);return;}
  S.bmLib[id]=meta;
  u.sn='';
  if(!Q.size)setStatus('saved');
  toast('"'+name+'" is in the library.',true);
  render();
}
async function bmSceneUse(id){
  const sc=S.bmLib[id];
  if(!bmLibOk()||!sc)return;
  const col=S.db.collection('config'),n=sc.blank?0:num(sc.n),chunks=[];
  setStatus('busy');
  try{
    for(let i=0;i<n;i++){
      const s=await col.doc('bsi_'+id+'_'+i).get();
      if(!s.exists||typeof s.data().d!=='string')throw new Error('missing');
      chunks.push(s.data().d);
    }
  }catch(e){
    if(e&&e.code)fail(e);else{setStatus('saved');toast('That saved map is missing part of its picture. Save it again from the original.');}
    return;
  }
  const oldN=num(bmG().n),v=Date.now(),gcol=S.db.collection('gm');
  await bmHidePublic();
  try{
    for(let i=0;i<n;i++)await gcol.doc('bmi_'+i).set({d:chunks[i],v});
    for(let i=n;i<oldN;i++)await gcol.doc('bmi_'+i).delete();
  }catch(e){fail(e);return;}
  const doc={v,name:String(sc.name||'Battle map'),w:num(sc.w),h:num(sc.h),blank:!!sc.blank,n,gx:num(sc.gx)||50,ox:num(sc.ox),oy:num(sc.oy),grid:sc.grid!==false,live:false,f:{},tp:{},
    ter:Array.isArray(sc.ter)?sc.ter.slice():[],tsh:sc.tsh!==false,wt:sc.wt!==false,fg:sc.fg===true,fa:sc.fa!==false,fv:clamp(Math.round(num(sc.fv))||6,1,30),fw:sc.fw!==false,fz:Array.isArray(sc.fz)?sc.fz.slice():[],mk:sc.mk&&typeof sc.mk==='object'?JSON.parse(JSON.stringify(sc.mk)):{},fm:sc.fm&&typeof sc.fm==='object'?JSON.parse(JSON.stringify(sc.fm)):{}};
  putLocal('bg','bmap',doc);save('bg','bmap',doc,{create:true});
  const u=S.ui.bm;
  u.sel='';u.msel='';u.tsel='';u.tp=[];u.tool='';u.ruler=false;u.setup=true;
  toast('"'+doc.name+'" is the battle map now. Show it to the players when you are ready.',true);
  render();
}
async function bmSceneDel(id){
  if(!bmLibOk()||!S.bmLib[id])return;
  const col=S.db.collection('config'),n=num(S.bmLib[id].n);
  try{
    await col.doc('bsc_'+id).delete();
    for(let i=0;i<n;i++)await col.doc('bsi_'+id+'_'+i).delete();
  }catch(e){fail(e);return;}
  delete S.bmLib[id];
  toast('Removed from the library.',true);
  render();
}

/* ===== the page pieces ===== */
function bmStep(label,val,unit,act){
  return h`<span class="bmstep" role="group" aria-label="${label}"><button type="button" class="btn sm" data-act="${act}" data-d="-1" aria-label="${label}: smaller">−</button><span class="bmstepv" aria-live="polite"><b>${val}</b> ${unit}</span><button type="button" class="btn sm" data-act="${act}" data-d="1" aria-label="${label}: larger">+</button></span>`;
}
function bmTools(cfg){
  const u=S.ui.bm,gm=cfg.adm;
  const b=(tool,label)=>h`<button type="button" class="btn sm ${u.tool===tool?'primary':''}" data-act="bm_tool" data-tool="${tool}" aria-pressed="${String(u.tool===tool)}">${label}</button>`;
  return h`<div class="row bmtools" role="group" aria-label="Map tools">${b('tpl','Range shapes')}${gm?b('paint','Paint terrain'):''}${gm?b('mark','Add markers'):''}${gm?b('fog','Fog of war'):''}</div>`;
}
function bmOpts(cfg,toks){
  const u=S.ui.bm,gm=cfg.adm;
  if(u.tool==='tpl'){
    const k=u.tk,mx=BM_TKMAX[k]||10,n=clamp(Math.round(num(u.tn))||1,1,mx),w=clamp(Math.round(num(u.tw))||1,1,5);
    const dirs=[7,0,1,6,-1,2,5,4,3];
    const t=u.sel&&toks.find(x=>x.cid===u.sel&&x.placed);
    return h`<div class="bmopts" role="group" aria-label="Range shape options">
      <div class="row"><span class="seg" role="group" aria-label="Shape">${BM_TK.map(s=>h`<button type="button" data-act="bm_tk" data-v="${s[0]}" aria-pressed="${String(k===s[0])}">${s[1]}</button>`)}</span>
        ${bmStep('Size',n,k==='blast'?'by '+n+' ('+bmFt(n)+' ft)':(n===1?'square':'squares')+' ('+bmFt(n)+' ft)','bm_tn')}
        ${k==='line'?bmStep('Width',w,w===1?'square wide':'squares wide','bm_tw'):''}</div>
      ${k==='cone'||k==='line'?h`<div class="row"><span class="bmdir" role="group" aria-label="Direction, for a tap">${dirs.map(i=>i<0?h`<span aria-hidden="true"></span>`:h`<button type="button" data-act="bm_td" data-d="${i}" aria-pressed="${String(u.td===i)}" aria-label="Point ${BM_DIRN[i]}">${BM_DARR[i]}</button>`)}</span>
        <span class="sub">Pointing ${BM_DIRN[clamp(Math.round(num(u.td)),0,7)]}. Or press where it starts and drag the way it should point.</span></div>`:h`<p class="sub">${k==='burst'?'Tap the middle square. Everything within that many squares is covered.':'Tap the middle of the area. It covers the number of squares you chose on each side.'}</p>`}
      <div class="row">${t?h`<button type="button" class="btn sm" data-act="bm_tpon">Start from ${t.v.name}</button>`:''}
        ${gm?h`<label class="row"><input type="checkbox" data-u="bm.tshare" data-nr ${u.tshare?raw('checked'):''}><span>Show new shapes to the players</span></label>`:''}
        ${bmHasWalls(cfg)?h`<label class="row"><input type="checkbox" data-u="bm.tb" data-nr ${u.tb!==false?raw('checked'):''}><span>Walls stop new shapes</span></label>`:''}</div>
      <p class="sub" id="bmtpnote" aria-live="polite"></p></div>`;
  }
  if(u.tool==='paint'&&gm){
    return h`<div class="bmopts" role="group" aria-label="Terrain brush">
      <div class="row"><span class="seg" role="group" aria-label="Terrain">${BM_TER.map(t=>h`<button type="button" data-act="bm_pb" data-v="${t[0]}" aria-pressed="${String(u.pb===t[0])}">${t[1]}</button>`)}<button type="button" data-act="bm_pb" data-v="." aria-pressed="${String(u.pb==='.')}">Erase</button></span>
        <span class="seg" role="group" aria-label="Brush size">${[1,2,3].map(n=>h`<button type="button" data-act="bm_pz" data-v="${n}" aria-pressed="${String(num(u.pz)===n)}" aria-label="Brush ${n} by ${n}">${n}×${n}</button>`)}</span>
        <button type="button" class="btn sm ${S.ui.confirm==='bm|terclr'?'armed':''}" data-act="bm_terclr">${S.ui.confirm==='bm|terclr'?'Tap again to clear all terrain':'Clear all terrain'}</button></div>
      <p class="sub">Drag across the map to paint. ${cfg.tsh?'The players see the terrain.':'The players do not see the terrain (change this in Settings).'}${u.pb==='B'?' Walls stop attack shapes'+(cfg.wt!==false?' and keep tokens from moving through them':'')+'.':''}</p></div>`;
  }
  if(u.tool==='fog'&&gm)return bmFogOpts(cfg);
  if(u.tool==='mark'&&gm){
    return h`<div class="bmopts" role="group" aria-label="Marker options">
      <div class="row"><span class="seg" role="group" aria-label="Marker kind">${BM_MK.map(m=>h`<button type="button" data-act="bm_mkk" data-v="${m[0]}" aria-pressed="${String(u.mk===m[0])}"><span aria-hidden="true">${m[2]}</span> ${m[1]}</button>`)}</span>
        <label class="fld"><span class="fl">Note (optional)</span><input type="text" maxlength="40" data-u="bm.ml" data-nr value="${u.ml}" placeholder="e.g. Pressure plate"></label></div>
      <p class="sub">Tap a square to drop a marker. New markers start hidden from the players; select one to show it.</p></div>`;
  }
  return '';
}
function bmTplList(cfg,toks,list){
  if(!list.length)return '';
  const u=S.ui.bm,gm=cfg.adm;
  return h`<div class="bmtpls"><div class="row sp"><span class="fl">Range shapes</span><button type="button" class="btn sm ghost" data-act="bm_tpclear">${gm?'Remove all':'Remove mine'}</button></div>
    <ul class="bmtpl-list">${list.map(t=>h`<li class="${u.tsel===t.id?'sel':''}"><button type="button" class="bmtpl-pick" data-act="bm_tpsel" data-id="${t.id}" aria-pressed="${String(u.tsel===t.id)}"><b>${bmTplName(t)}</b>${t.sh&&!t.own?h` <span class="pill">From the GM</span>`:''}${gm&&t.sh?h` <span class="pill good">Shown to players</span>`:''}${bmTplCut(cfg,t)?h` <span class="pill">Cut short by walls</span>`:''}<span class="sub">In the area: ${bmHitsText(cfg,bmTplHits(cfg,t,toks),t)}.</span></button>
      <span class="row">${gm?h`<button type="button" class="btn sm" data-act="bm_tpshare" data-id="${t.id}" data-on="${t.sh?0:1}">${t.sh?'Hide from players':'Show to players'}</button>`:''}${t.own?h`<button type="button" class="btn sm ghost" data-act="bm_tpdel" data-id="${t.id}" aria-label="Remove this shape">Remove</button>`:''}</span></li>`)}</ul></div>`;
}
function bmSetup2(cfg){
  const g=bmG(),u=S.ui.bm,has=!!cfg;
  const fm=g.fm||{},fids=Object.keys(fm).sort((a,b)=>String(fm[a].n).localeCompare(String(fm[b].n)));
  const lib=S.bmLib||{},lids=Object.keys(lib).sort((a,b)=>num(lib[b].at)-num(lib[a].at));
  const cur=has&&g.v;
  return h`${has?h`<div class="bmfm"><b>Formations</b>
      <p class="sub">Save where everyone stands, then put them back later (a rematch, or the same map next session). Allies are matched by Pokémon, foes by their letter (Foe A, Foe B…). A saved foe keeps whether it was shown.</p>
      ${fids.length?h`<ul class="bmlist">${fids.map(id=>h`<li><span><b>${fm[id].n}</b> <span class="sub">${Object.keys(fm[id].a||{}).length} allies, ${Object.keys(fm[id].f||{}).length} foes</span></span><span class="row"><button type="button" class="btn sm" data-act="bm_fmuse" data-id="${id}">Put them there</button><button type="button" class="btn sm ghost ${S.ui.confirm==='bm|fd|'+id?'armed':''}" data-act="bm_fmdel" data-id="${id}">${S.ui.confirm==='bm|fd|'+id?'Tap again to delete':'Delete'}</button></span></li>`)}</ul>`:h`<p class="sub">No formations yet.</p>`}
      <div class="row"><label class="fld"><span class="fl">Name</span><input type="text" maxlength="30" data-u="bm.fn" data-nr value="${u.fn}" placeholder="e.g. Ambush at the gate"></label><button type="button" class="btn sm" data-act="bm_fmsave">Save where everyone stands</button></div></div>`:''}
    ${bmLibOk()?h`<div class="bmlib"><b>Saved maps</b>
      <p class="sub">Keep up to ${BM_SCENES} maps, with their grid, terrain, markers and formations, to swap between. Only you can see the library.</p>
      ${lids.length?h`<ul class="bmlist">${lids.map(id=>{const s=lib[id];const key='bm|su|'+id;return h`<li><span><b>${s.name}</b> <span class="sub">${s.blank?'Blank grid':'Picture'}, ${Math.max(1,Math.floor((num(s.w)-num(s.ox))/(num(s.gx)||50)+1e-6))} by ${Math.max(1,Math.floor((num(s.h)-num(s.oy))/(num(s.gx)||50)+1e-6))} squares</span></span><span class="row"><button type="button" class="btn sm ${S.ui.confirm===key?'armed':'primary'}" data-act="bm_scuse" data-id="${id}">${S.ui.confirm===key?'Tap again to replace the current map':'Use this map'}</button><button type="button" class="btn sm ghost ${S.ui.confirm==='bm|sd|'+id?'armed':''}" data-act="bm_scdel" data-id="${id}">${S.ui.confirm==='bm|sd|'+id?'Tap again to delete':'Delete'}</button></span></li>`;})}</ul>`:h`<p class="sub">Nothing saved yet.</p>`}
      ${cur?h`<div class="row"><label class="fld"><span class="fl">Save the current map as</span><input type="text" maxlength="40" data-u="bm.sn" data-nr value="${u.sn}" placeholder="${String(g.name||'Battle map')}"></label><button type="button" class="btn sm" data-act="bm_scsave">Save to the library</button></div>
        <p class="sub">Using a saved map replaces the current one, its terrain and its markers. Save the current one first if you want to keep it. A name you have used already is replaced.</p>`:''}</div>`:''}`;
}

/* ===== actions ===== */
function bm2Act(b,e){
  const d=b.dataset,u=S.ui.bm,gm=!!S.me.admin;
  switch(d.act){
    case 'bm_tool':{
      const t=d.tool;
      if((t==='paint'||t==='mark'||t==='fog')&&!gm)break;
      u.tool=u.tool===t?'':t;u.ruler=false;u.rl=null;u.cal=0;u.calA=null;
      if(u.tool==='paint'||u.tool==='fog')u.sel='';
      render();break;}
    case 'bm_tk':if(BM_TKMAX[d.v]){u.tk=d.v;u.tn=clamp(Math.round(num(u.tn))||1,1,BM_TKMAX[d.v]);}render();break;
    case 'bm_tn':u.tn=clamp((Math.round(num(u.tn))||1)+num(d.d),1,BM_TKMAX[u.tk]||10);render();break;
    case 'bm_tw':u.tw=clamp((Math.round(num(u.tw))||1)+num(d.d),1,5);render();break;
    case 'bm_td':u.td=clamp(Math.round(num(d.d)),0,7);render();break;
    case 'bm_tpsel':u.tsel=u.tsel===d.id?'':d.id;render();break;
    case 'bm_tpdel':bmTplDel(d.id);render();break;
    case 'bm_tpshare':bmTplShare(d.id,d.on==='1');render();break;
    case 'bm_tpclear':bmTplClear();render();break;
    case 'bm_tpon':{
      const cfg=bmCfg(),t=cfg&&bmTokens(cfg).find(k=>k.cid===u.sel&&k.placed);
      if(!t)break;
      const o=Math.floor((t.fp-1)/2);
      bmTplAdd({k:u.tk,x:t.x+o,y:t.y+o,n:clamp(Math.round(num(u.tn))||1,1,BM_TKMAX[u.tk]||10),d:clamp(Math.round(num(u.td)),0,7),w:clamp(Math.round(num(u.tw))||1,1,5),b:u.tb===false?0:1});
      render();break;}
    case 'bm_pb':if(gm&&(d.v==='.'||BM_TERK[d.v]))u.pb=d.v;render();break;
    case 'bm_pz':u.pz=clamp(Math.round(num(d.v))||1,1,3);render();break;
    case 'bm_terclr':if(gm)ntTwice('bm|terclr',()=>{bmTerClear();toast('The terrain was cleared.',true);render();});break;
    case 'bm_mkk':if(BM_MKD[d.v])u.mk=d.v;render();break;
    case 'bm_msel':{
      if(bmMoved)break;
      u.msel=u.msel===d.id?'':d.id;u.sel='';render();break;}
    case 'bm_mdesel':u.msel='';render();break;
    case 'bm_mvis':if(gm){edit('bg','bmap','mk.'+d.id+'.vis',d.on==='1'?1:0);bmSync();render();}break;
    case 'bm_mdel':if(gm){bmMkDel(d.id);render();}break;
    case 'bm_fmsave':if(gm)bmFmSave();break;
    case 'bm_fmuse':if(gm)bmFmUse(d.id);break;
    case 'bm_fmdel':if(gm)ntTwice('bm|fd|'+d.id,()=>bmFmDel(d.id));break;
    case 'bm_scsave':if(gm)bmSceneSave();break;
    case 'bm_scuse':if(gm){if(bmG().v)ntTwice('bm|su|'+d.id,()=>bmSceneUse(d.id));else bmSceneUse(d.id);}break;
    case 'bm_scdel':if(gm)ntTwice('bm|sd|'+d.id,()=>bmSceneDel(d.id));break;
    default:bm3Act(b,e);
  }
}

/* ---------- Battle map, part three: fog of war ----------
   The map can start covered. A square is uncovered for the players in two ways: the GM uncovers it by hand, or one of the
   players' Pokémon can see it (a sight range, and walls block sight). Squares a Pokémon has seen stay on the map, dimmed,
   when it moves on; the GM can also cover a square for good, even one a Pokémon is standing next to.
   Where it lives (all in documents the existing rules already cover, so there is no rules change):
     gm/bmap     gains  fg (fog on), fa (Pokémon uncover what they see), fv (sight range in squares), fw (walls block sight),
                        fz (one string per row: u = uncovered by hand, c = covered by hand, e = seen earlier, . = nothing yet)
     meta/bmap   gains  fg and fr (one string per row: v = in view, e = seen earlier, . = covered), worked out on the GM's device,
                        and everything else the GM shares is filtered through it: a foe, a marker or a wall in a covered
                        square is not in the table's copy at all.
   The fog is a cover over the picture. The picture file itself is still sent to the players, so a secret drawn into the
   picture is not protected; crop it before uploading. */
S.ui.bm=Object.assign({fb:'u',fs:1},S.ui.bm);

const BM_FB=[['u','Uncover'],['c','Cover'],['.','Undo']];

/* the squares each of the players' Pokémon can see, by hand and by sight, turned into what the table gets */
function bmFogSources(cfg){
  return bmTokens(cfg).filter(t=>t.side==='a'&&t.placed&&!t.v.down);
}
function bmFogSig(cfg,src){
  return [cfg.fa?1:0,cfg.fv,cfg.fw?1:0,cfg.cols,cfg.rows,cfg.fz.join('/'),cfg.fa&&cfg.fw?cfg.ter.join('/'):'',src.map(t=>t.cid+':'+t.x+','+t.y+','+t.fp).join(';')].join('|');
}
/* GM side only. Returns {rows, fz, merged}: rows are what the players get (v, e or .), and when a Pokémon has just seen
   new squares, fz is the GM's rows with them remembered (merged is true then). The last answer is kept until something changes. */
function bmFogEff(cfg){
  const src=cfg.fa?bmFogSources(cfg):[];
  const key=bmFogSig(cfg,src);
  if(S.bmFogC&&S.bmFogC.key===key)return S.bmFogC;
  const live=new Set(),walls=cfg.fw&&bmHasWalls(cfg);
  src.forEach(t=>{
    const o=Math.floor((t.fp-1)/2),cx=t.x+o,cy=t.y+o,R=cfg.fv+Math.floor(t.fp/2);
    for(let y=Math.max(0,cy-R);y<=Math.min(cfg.rows-1,cy+R);y++){
      for(let x=Math.max(0,cx-R);x<=Math.min(cfg.cols-1,cx+R);x++){
        const k=x+','+y;
        if(live.has(k))continue;
        /* a wall can be seen, but nothing behind it */
        if(!walls||bmClearLine(cfg,cx,cy,x,y,true))live.add(k);
      }
    }
  });
  const rows=[],fz=[];
  let merged=false;
  for(let y=0;y<cfg.rows;y++){
    const m0=cfg.fz[y]||'';
    let r='',z='';
    for(let x=0;x<cfg.cols;x++){
      const m=m0[x]||'.',lv=live.has(x+','+y);
      r+=m==='c'?'.':(m==='u'||lv)?'v':m==='e'?'e':'.';
      let m2=m;
      if(m==='.'&&lv){m2='e';merged=true;}
      z+=m2;
    }
    rows.push(r);fz.push(z);
  }
  return (S.bmFogC={key,rows:bmTerPack(rows),fz:bmTerPack(fz),merged});
}
/* what a person sees: the GM sees the working out, everyone else the rows the GM published */
const bmFe=cfg=>cfg._fe||(cfg._fe=cfg.adm?bmFogEff(cfg).rows:cfg.fr);
const bmFogAt=(cfg,x,y)=>(bmFe(cfg)[y]||'')[x]||'.';
function bmRowsSeen(rows,x,y,fp){
  for(let a=0;a<fp;a++)for(let b=0;b<fp;b++)if(((rows[y+b]||'')[x+a]||'.')==='v')return true;
  return false;
}
let bmFogT=0;
/* a Pokémon moved: let the table's copy catch up in a moment (only the GM's device can do this) */
function bmFogSoon(){
  if(!S.me.admin||bmFogT)return;
  const g=bmG();
  if(!g.v||g.fg!==true||g.fa===false||!g.live)return;
  bmFogT=setTimeout(()=>{bmFogT=0;bmSync();},500);
}
/* a saved map keeps what the GM set by hand, not what was seen */
const bmFogHand=rows=>bmTerPack((Array.isArray(rows)?rows:[]).map(r=>String(r).replace(/e/g,'.')));

function bmFogSvg(cfg){
  if(!cfg.fg)return '';
  const rows=bmFe(cfg),g=cfg.gx,f=n=>+(g*n).toFixed(3);
  const rect=(x,y,w,hh)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'"/>';
  let hid='',dim='';
  /* the strips of picture outside the grid are covered too */
  const gx2=cfg.ox+cfg.cols*g,gy2=cfg.oy+cfg.rows*g;
  if(cfg.ox>0)hid+=rect(0,0,cfg.ox,cfg.h);
  if(cfg.oy>0)hid+=rect(cfg.ox,0,cfg.w-cfg.ox,cfg.oy);
  if(gx2<cfg.w)hid+=rect(gx2,cfg.oy,cfg.w-gx2,cfg.h-cfg.oy);
  if(gy2<cfg.h)hid+=rect(cfg.ox,gy2,gx2-cfg.ox,cfg.h-gy2);
  for(let y=0;y<cfg.rows;y++){
    const r=rows[y]||'';
    let x=0;
    while(x<cfg.cols){
      const ch=r[x]||'.';
      let x2=x+1;
      while(x2<cfg.cols&&(r[x2]||'.')===ch)x2++;
      if(ch!=='v'){const s=rect(cfg.ox+x*g,cfg.oy+y*g,(x2-x)*g,g);if(ch==='e')dim+=s;else hid+=s;}
      x=x2;
    }
  }
  const pat=cfg.adm?'<defs><pattern id="bmfgh" patternUnits="userSpaceOnUse" width="'+f(.2)+'" height="'+f(.2)+'" patternTransform="rotate(45)"><rect width="'+f(.2)+'" height="'+f(.2)+'" fill="#05070d" fill-opacity=".5"/><rect width="'+f(.07)+'" height="'+f(.2)+'" fill="#000" fill-opacity=".45"/></pattern></defs>':'';
  return h`<svg class="bmfog ${cfg.adm?'gm':''}" viewBox="0 0 ${cfg.w} ${cfg.h}" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">${raw(pat)}<g class="fg-hid">${raw(hid)}</g><g class="fg-dim">${raw(dim)}</g></svg>`;
}

/* ----- painting the fog by hand (GM) ----- */
let bmFp=null;
function bmFogGrid(cfg){
  const g=[];
  for(let y=0;y<cfg.rows;y++){const r=cfg.fz[y]||'',a=[];for(let x=0;x<cfg.cols;x++)a.push(r[x]||'.');g.push(a);}
  return g;
}
function bmFgStamp(cfg,c){
  const d=bmFp,s=clamp(Math.round(num(S.ui.bm.fs))||1,1,3),lo=-Math.floor((s-1)/2);
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){
    const xx=c.x+lo+x,yy=c.y+lo+y;
    if(xx<0||yy<0||xx>=cfg.cols||yy>=cfg.rows)continue;
    const k=xx+','+yy;
    if(d.mark.has(k))continue;
    d.mark.add(k);
    if(d.rows[yy][xx]!==d.ch){d.rows[yy][xx]=d.ch;d.n++;}
  }
}
function bmFgDraw(){
  const cfg=bmCfg(),g=document.getElementById('bmdr');
  if(!g||!cfg||!bmFp)return;
  const col=bmFp.ch==='u'?'rgba(47,158,68,.55)':bmFp.ch==='c'?'rgba(229,72,58,.55)':'rgba(140,150,170,.55)';
  let s='';
  bmFp.mark.forEach(k=>{const p=k.split(',');s+='<rect x="'+(cfg.ox+p[0]*cfg.gx)+'" y="'+(cfg.oy+p[1]*cfg.gx)+'" width="'+cfg.gx+'" height="'+cfg.gx+'" fill="'+col+'"/>';});
  g.innerHTML=s;
}
function bmFgStart(e){
  const cfg=bmCfg(),p=bmPoint(e),u=S.ui.bm;
  if(!cfg||!p||!cfg.adm||!cfg.fg)return;
  const c=bmCellOf(cfg,p);
  bmFp={rows:bmFogGrid(cfg),last:c,ch:BM_FB.some(b=>b[0]===u.fb)?u.fb:'u',n:0,mark:new Set()};
  bmBusy=true;
  try{bmMapEl().setPointerCapture(e.pointerId);}catch(err){}
  bmFgStamp(cfg,c);bmFgDraw();
  e.preventDefault();
}
function bmFgMove(e){
  const d=bmFp,cfg=bmCfg(),p=bmPoint(e);
  if(!d||!cfg||!p)return;
  const c=bmCellOf(cfg,p);
  if(c.x===d.last.x&&c.y===d.last.y)return;
  const steps=Math.max(Math.abs(c.x-d.last.x),Math.abs(c.y-d.last.y));
  for(let i=1;i<=steps;i++)bmFgStamp(cfg,{x:Math.round(d.last.x+(c.x-d.last.x)*i/steps),y:Math.round(d.last.y+(c.y-d.last.y)*i/steps)});
  d.last=c;bmFgDraw();
}
function bmFgEnd(){
  const d=bmFp;
  bmFp=null;bmBusy=false;
  if(d&&d.n){edit('bg','bmap','fz',bmTerPack(d.rows));bmSync();}
  bmQueued=false;
  render();
}

/* ----- the page pieces ----- */
function bmFogOpts(cfg){
  const u=S.ui.bm;
  if(!cfg.fg){
    return h`<div class="bmopts" role="group" aria-label="Fog of war">
      <p class="sub">Fog of war is off, so the players see the whole map. Turn it on and the map starts covered for them.</p>
      <div class="row"><button type="button" class="btn sm primary" data-act="bm_fogon">Turn fog of war on</button></div></div>`;
  }
  return h`<div class="bmopts" role="group" aria-label="Fog of war">
    <div class="row"><span class="seg" role="group" aria-label="Brush">${BM_FB.map(b=>h`<button type="button" data-act="bm_fb" data-v="${b[0]}" aria-pressed="${String(u.fb===b[0])}">${b[1]}</button>`)}</span>
      <span class="seg" role="group" aria-label="Brush size">${[1,2,3].map(n=>h`<button type="button" data-act="bm_fs" data-v="${n}" aria-pressed="${String(num(u.fs)===n)}" aria-label="Brush ${n} by ${n}">${n}×${n}</button>`)}</span></div>
    <div class="row"><button type="button" class="btn sm" data-act="bm_fgall">Uncover everything</button>
      <button type="button" class="btn sm ${S.ui.confirm==='bm|fgn'?'armed':''}" data-act="bm_fgnone">${S.ui.confirm==='bm|fgn'?'Tap again to cover everything':'Cover everything again'}</button></div>
    <p class="sub">Drag across the map. <b>Uncover</b> shows squares to the players for good. <b>Cover</b> hides them, even from a Pokémon standing next to them. <b>Undo</b> puts a square back to normal (${cfg.fa?'hidden until a Pokémon sees it':'hidden'}). Hatched squares are hidden from the players; lighter ones were seen earlier but are out of sight now.</p></div>`;
}
function bmFogSettings(g,cfg){
  const on=g.fg===true;
  return h`<div class="bmfogset"><b>Fog of war</b>
    <label class="row"><input type="checkbox" ${bd('bg','bmap','fg')} ${on?raw('checked'):''}><span>Cover the map: players see only squares that are uncovered or in sight</span></label>
    ${on?h`<label class="row"><input type="checkbox" ${bd('bg','bmap','fa')} ${g.fa!==false?raw('checked'):''}><span>The players' Pokémon uncover what they can see as they move</span></label>
      <label class="row"><input type="checkbox" ${bd('bg','bmap','fw')} ${g.fw!==false?raw('checked'):''}><span>Walls block sight</span></label>
      <div class="fgrid"><label class="fld"><span class="fl">Sight range (squares)</span><input type="number" inputmode="numeric" min="1" max="30" ${bd('bg','bmap','fv')} value="${cfg?cfg.fv:6}"></label></div>`:''}
    <p class="sub">${on?'Squares a Pokémon has seen stay on the map, dimmed, after it moves on. Use the Fog of war tool above the map to uncover or cover squares by hand. ':''}The fog is a cover over the picture: foes, markers and walls in covered squares are not sent to the players, but the picture file is, so crop any secret out of it before you upload it.</p></div>`;
}

function bm3Act(b,e){
  const d=b.dataset,u=S.ui.bm,gm=!!S.me.admin;
  switch(d.act){
    case 'bm_fb':if(BM_FB.some(x=>x[0]===d.v))u.fb=d.v;render();break;
    case 'bm_fs':u.fs=clamp(Math.round(num(d.v))||1,1,3);render();break;
    case 'bm_fogon':if(gm){edit('bg','bmap','fg',true);bmSync();render();}break;
    case 'bm_fgall':{
      const cfg=bmCfg();
      if(!gm||!cfg)break;
      const rows=[];for(let y=0;y<cfg.rows;y++)rows.push('u'.repeat(cfg.cols));
      edit('bg','bmap','fz',rows);bmSync();toast('Everything is uncovered.',true);render();break;}
    case 'bm_fgnone':if(gm)ntTwice('bm|fgn',()=>{edit('bg','bmap','fz',[]);bmSync();toast('The map is covered again.',true);render();});break;
  }
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
    <div class="row sp"><span class="dots" role="img" aria-label="${badgeCount(t)} of 8 badges">${BADGES.map(b=>h`<span class="dot ${bg[b[0]]?'on':''}" ${raw('style="--bc:'+BADGE_COL[b[0]]+'"')} title="${b[1]} Badge"></span>`)}</span><span class="mono sub">${badgeCount(t)}/8</span></div>
    <div class="row sp"><span class="sub">Contest ribbons</span><span class="mono sub">${ribBrief(t)}</span></div>
    <ul class="team">${mons.length?mons.map(m=>h`<li>${monIcon(m)}<b>${mName(m)}</b>${genPill(m.gender)}${megaOn(m)?h`<span class="pill mega">Mega</span>`:''}${typeChips(m)}</li>`):h`<li class="sub">No Pokémon on hand</li>`}</ul>
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
const BADGE_COL={coal:'#E0742B',forest:'#3FA34D',cobble:'#6C8DB8',fen:'#1FA3B5',relic:'#9A68D8',mine:'#8A94A8',icicle:'#6CCBEF',beacon:'#F0BC2A'};
/* simple original emblems, one per badge; drawn in the coin's own colour scheme by CSS */
const BADGE_GLYPH=(()=>{
  const pt=(r,a)=>(16+r*Math.cos(a)).toFixed(2)+','+(16+r*Math.sin(a)).toFixed(2);
  const star=(n,ro,ri)=>{const p=[];for(let i=0;i<n*2;i++)p.push(pt(i%2?ri:ro,Math.PI*i/n-Math.PI/2));return p.join(' ');};
  const gear=(()=>{const p=[];for(let i=0;i<8;i++){const b=i*Math.PI/4;[[-.23,10],[-.15,13.2],[.15,13.2],[.23,10]].forEach(q=>p.push(pt(q[1],b+q[0])));}return p.join(' ');})();
  const arm='M16 3.5v25M12.5 7.5L16 11l3.5-3.5M12.5 24.5L16 21l3.5 3.5';
  const dark='rgba(10,16,40,.38)';
  return{
    coal:'<path d="M16 3.5l9.5 5 3 9.5-5.5 8.5-9.5 2.5-8-6-.5-9.5z"/><path d="M16 3.5L14 14l-8.5 3.5M14 14l9.5 4M14 14l1.5 12.5" fill="none" stroke="'+dark+'" stroke-width="1.4" stroke-linejoin="round"/>',
    forest:'<path d="M4.5 27.5C4 13 13 4.5 27.5 4.5 28 19 19 28 4.5 27.5z"/><path d="M6.5 25.5L21 11" fill="none" stroke="'+dark+'" stroke-width="1.6" stroke-linecap="round"/>',
    cobble:'<circle cx="10.5" cy="20.5" r="6.2"/><circle cx="22" cy="21.5" r="5.2"/><circle cx="16" cy="10" r="5.8"/>',
    fen:'<path d="M16 3.5c5 7 10.5 12 10.5 17.2a10.5 10.5 0 0 1-21 0C5.5 15.5 11 10.5 16 3.5z"/><path d="M10.5 21a5.5 5.5 0 0 0 4.5 5" fill="none" stroke="'+dark+'" stroke-width="2" stroke-linecap="round"/>',
    relic:'<path d="M16 3l12 13-12 13L4 16z"/><circle cx="16" cy="16" r="4.2" fill="rgba(10,16,40,.4)"/><circle cx="16" cy="16" r="1.6"/>',
    mine:'<polygon points="'+gear+'"/><circle cx="16" cy="16" r="3.8" fill="rgba(10,16,40,.4)"/>',
    icicle:'<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="'+arm+'"/><path transform="rotate(60 16 16)" d="'+arm+'"/><path transform="rotate(120 16 16)" d="'+arm+'"/></g>',
    beacon:'<polygon points="'+star(8,13.5,6)+'"/><circle cx="16" cy="16" r="3.2" fill="rgba(10,16,40,.35)"/>'
  };
})();
const badgeGlyph=k=>raw('<svg class="gl" viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">'+(BADGE_GLYPH[k]||'')+'</svg>');
function badgeCase(uid,t,ro){
  const bg=t.badges||{};
  const n=badgeCount(t);
  const pop=S.ui.pop;
  return h`<div class="case ${n===8?'full':''}" role="group" aria-label="Badge case, ${n} of 8 earned">
    ${BADGES.map(([k,nameB,leader])=>h`<button class="slot ${bg[k]?'on':''}${bg[k]&&pop&&pop.uid===uid&&pop.key===k?' pop':''}" ${raw('style="--bc:'+BADGE_COL[k]+'"')} data-act="badge" data-key="${k}" data-uid="${uid}" aria-pressed="${String(!!bg[k])}" title="${nameB} Badge, from ${leader}" ${dis(ro)}><span class="medal">${badgeGlyph(k)}</span><span class="bn">${nameB}</span><small>${leader}</small></button>`)}
  </div>`;
}
function honorsPanel(uid,t,ro){
  const bg=t.badges||{};
  const hs=t.honors||[];
  const aw=entriesOf(S.awards).filter(a=>a.uid===uid).sort((a,b)=>num(b.createdAt)-num(a.createdAt));
  return h`<section class="panel"><div class="ph"><h2>Honors</h2><span class="mono sub">${badgeCount(t)}/8 Sinnoh badges</span></div>
    ${aw.length?h`<div class="list"><span class="fl">Awarded by the GM</span>${aw.map(a=>h`<div class="award"><div class="row sp"><b>${a.title}</b><span class="pill gm">${a.type}</span></div>${a.note?h`<p class="sub prewrap">${a.note}</p>`:''}<span class="sub">${dt(a.createdAt)}${a.session?' · Session '+a.session:''}${a.levelUp?' · +1 level':''}</span></div>`)}</div>`:''}
    ${badgeCase(uid,t,ro)}
    ${ribCase(uid,t,ro)}
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
    ${it.length?h`<div class="list">${it.map((x,i)=>h`<div class="item"><div class="irow ic">${itemTile(x.name)}${fText('Item','t',uid,'items.'+i+'.name',t,{ro,list:'dl-items'})}${fNum('Qty','t',uid,'items.'+i+'.qty',t,{ro,min:0})}${rowBtns('t',uid,'items',i,it.length,ro)}</div>${fText('Note','t',uid,'items.'+i+'.note',t,{ro})}${isKeyName(x.name)?h`<div class="kline">${keyChip(t)}<span class="sub">Lets your Pokémon Mega Evolve, once per battle.</span></div>`:''}</div>`)}</div>`:h`<p class="sub">Nothing carried yet.</p>`}
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
    </div>
    ${ro?'':deleteTrainerPanel(uid,t)}`;
}
function deleteTrainerPanel(uid,t){
  const n=monsOf(uid).length;
  const st=S.ui.delT;
  const word=(t.name||'').trim()||'delete';
  const mine=uid===S.me.id;
  const things=n+" Pokémon"+' and the honors recorded for '+(mine?'you':'this trainer');
  return h`<section class="panel dz"><div class="ph"><h2>Delete this trainer</h2></div>
    ${st.uid===uid?h`<p>This permanently deletes <b>${tName(t)}</b>, ${things}. It cannot be undone. To confirm, type <b>${word}</b> below.</p>
      <div class="fgrid"><label class="fld"><span class="fl">Type to confirm</span><input type="text" data-u="delT.text" data-nr value="${st.text}" autocomplete="off" spellcheck="false" maxlength="80"></label></div>
      <div class="row"><button class="btn sm danger armed" data-act="delTGo" data-uid="${uid}">Delete forever</button><button class="btn sm" data-act="delTCancel">Cancel</button></div>`
      :h`<p class="sub">Removes ${mine?'your':'this'} sheet, ${things}. You will be asked to confirm.</p>
      <div><button class="btn sm danger" data-act="delTOpen" data-uid="${uid}">Delete this trainer…</button></div>`}
  </section>`;
}

/* ---------- pokemon tab ---------- */
const effStat=(m,k)=>num(m.base&&m.base[k])+num(m.bonus&&m.bonus[k])+(m.up===k?1:0)-(m.down===k?1:0)+megaBonus(m,k);
const STAT_OPTS=STATS.map(s=>[s[0],s[1]]);

function moveRow(id,m,x,i,ro){
  const mm=/^(\d+)\s*\/\s*day/i.exec(x.freq||'');
  const n=mm?clamp(+mm[1],1,9):0;
  const used=num(x.used);
  const p='moves.'+i+'.';
  return h`<div class="move">
    <div class="mv1">
      ${fText('Move','p',id,p+'name',m,{ro,list:'dl-moves'})}
      ${fText('Uses','p',id,p+'freq',m,{ro,list:'dl-freq'})}
      ${n?h`<span class="pips" role="group" aria-label="Daily uses">${Array.from({length:n},(_,j)=>h`<button class="pip ${j<used?'spent':''}" data-act="pip" ${bp('p',id,'moves.'+i+'.used')} data-j="${j}" aria-label="Use ${j+1}" ${dis(ro)}></button>`)}</span>`:h`<span></span>`}
      ${rowBtns('p',id,'moves',i,(m.moves||[]).length,ro)}
    </div>
    ${ro||!String(x.name||'').trim()?'':h`<div class="row mvroll"><button class="btn sm ${S.ui.mr.key===mrKey(id.split('/')[0],id.split('/')[1],i)?'primary':''}" data-act="b_mopen" data-uid="${id.split('/')[0]}" data-pid="${id.split('/')[1]}" data-i="${i}" aria-expanded="${String(S.ui.mr.key===mrKey(id.split('/')[0],id.split('/')[1],i))}">Roll ${x.name}</button></div>`}
    ${ro?'':moveForm(id.split('/')[0],id.split('/')[1],i,x)}
    <div class="mv2">
      ${fSel('Kind','p',id,p+'kind',m,KINDS,{ro})}
      ${fSel('Type','p',id,p+'type',m,TYPES,{ro})}
      ${fText('Range','p',id,p+'range',m,{ro})}
      ${fText('Damage','p',id,p+'dice',m,{ro,ph:'e.g. 3d8'})}
    </div>
    ${fArea('Effect','p',id,p+'text',m,{ro,rows:2})}
    ${ctLine(id,m,x,i,ro)}
  </div>`;
}

/* the five contest stats: written on the sheet, spent in the Appeal helper on the Contests page */
function csPanel(id,m,ro){
  const cs=ctStatsOf(m);
  const tot=ctStatTotal(cs);
  return h`<div class="list cspanel"><div class="ph"><h2>Contest stats</h2><span class="pill ${tot>10?'wary':''}">${tot} of 10</span></div>
    <div class="csgrid">${CT_TYPES.map(t=>h`<label class="fld cs"><span class="fl">${ctChip(t)}</span><input type="number" inputmode="numeric" aria-label="${t} contest stat" ${bd('p',id,'cs.'+t.toLowerCase())} value="${cs[t]}" ${attr('data-min',0)} ${attr('data-max',30)} ${dis(ro)}></label>`)}</div>
    <p class="sub">${tot>10?'That is more than the 10 points the handbook allows. Only scarves can push the total past 10. ':''}Points from Poffins and PokéBlocks. In a contest they can be spent on a move of the matching type; the Appeal helper on the Contests page keeps count.</p>
  </div>`;
}

function monBody(uid,m,ro,pos,len){
  const id=uid+'/'+m.id;
  const tiles=STATS.map(([k,full,ab])=>{
    const f=effStat(m,k);
    return h`<div class="stat lcd"><span class="sl">${ab}</span><span class="sv">${f}</span>
      <span class="sm"><span>mod ${sgn(mod(f))}</span>${megaBonus(m,k)?h`<span class="mbn">Mega ${sgn(megaBonus(m,k))}</span>`:''}${k==='spe'?h`<span>${f*5} ft</span>`:''}</span>
      <div class="mini"><label>Base<input type="number" ${bd('p',id,'base.'+k)} value="${m.base&&m.base[k]}" ${dis(ro)}></label><label>Adj<input type="number" ${bd('p',id,'bonus.'+k)} value="${m.bonus&&m.bonus[k]}" ${dis(ro)}></label></div></div>`;
  });
  const ps=m.passives||[];
  const mv=m.moves||[];
  const gl=S.gmLoy[m.id]||{};
  const L=clamp(num(gl.loyalty),0,5);
  return h`<div class="mb">
    <div class="idrow"><div class="idimg sq"><div class="spr big">${monPic(m)}</div>${imgPicker('p',id,'img',m,320,320,50000,ro)}</div>
    <div class="fgrid">
      ${fText('Nickname','p',id,'nick',m,{ro})}
      ${fText('Species','p',id,'species',m,{ro,list:'dl-species'})}
      ${fSel('Gender','p',id,'gender',m,GENDERS,{ro,blank:'Not set'})}
      <div class="fld shn"><span class="fl">Colour</span>${fCheck('Shiny ✦','p',id,'shiny',m,ro)}</div>
      ${fSel('Type 1','p',id,'types.0',m,TYPES,{ro,blank:'None'})}
      ${fSel('Type 2','p',id,'types.1',m,TYPES,{ro,blank:'None'})}
      ${fSel('Size','p',id,'size',m,SIZES,{ro})}
      ${fSel('Weight','p',id,'weight',m,WEIGHTS,{ro})}
      ${fSel('Monster die','p',id,'die',m,DICE,{ro})}
      ${fText('Held item','p',id,'item',m,{ro,list:'dl-items'})}
      ${fText('Nature','p',id,'natureName',m,{ro})}
      ${fSel('Nature raises','p',id,'up',m,STAT_OPTS,{ro,blank:'None'})}
      ${fSel('Nature lowers','p',id,'down',m,STAT_OPTS,{ro,blank:'None'})}
      ${fText('Status','p',id,'status',m,{ro,list:'dl-status'})}
      ${fText('Poké Ball','p',id,'ball',m,{ro,list:'dl-balls'})}
      ${fText('Where or how you got it','p',id,'caught',m,{ro,list:'dl-places',cls:'wide'})}
      ${ro?'':fillHint(uid,m)}
    </div></div>
    <div class="stats">${hpTile('p',id,m.hp,ro)}${tiles}</div>
    <div class="lcd acc"><span>Attack ${sgn(mod(effStat(m,'atk')))}</span><span>Sp. Attack ${sgn(mod(effStat(m,'spa')))}</span><span>Effect ${sgn(mod(effStat(m,'spe')))}</span></div>
    <div class="stgbox"><div class="row sp"><span class="fl">Combat stages</span>${STATS.some(s=>stg(m,s[0]))?'':h`<span class="sub">none right now</span>`}</div>${stagePanel('p',id,'stages',m,ro,'')}</div>
    ${megaPanel(uid,m,ro)}
    ${evoPanel(uid,m,ro)}
    ${fText('Skills','p',id,'skills',m,{ro,ph:'Short list, separated by commas'})}
    ${ro?'':psHint(uid,m)}
    <div class="list"><div class="ph"><h2>Passives</h2>${ro||ps.length>=TPL_MAX.passives?'':h`<button class="btn sm" data-act="add" ${bp('p',id,'passives')} data-tpl="passive">Add passive</button>`}<span class="sub">${ps.length>TPL_MAX.passives?ps.length+' (usual limit '+TPL_MAX.passives+')':ps.length+' of '+TPL_MAX.passives}</span></div>
      ${ps.map((x,i)=>h`<div class="item"><div class="irow two">${fText('Passive','p',id,'passives.'+i+'.name',m,{ro,list:'dl-passives'})}${rowBtns('p',id,'passives',i,ps.length,ro)}</div>${fArea('Effect','p',id,'passives.'+i+'.text',m,{ro})}</div>`)}</div>
    <div class="list"><div class="ph"><h2>Moves</h2>${ro||mv.length>=TPL_MAX.moves?'':h`<button class="btn sm" data-act="add" ${bp('p',id,'moves')} data-tpl="move">Add move</button>`}<span class="sub">${mv.length>TPL_MAX.moves?mv.length+' (usual limit '+TPL_MAX.moves+')':mv.length+' of '+TPL_MAX.moves}</span></div>
      ${mv.map((x,i)=>moveRow(id,m,x,i,ro))}</div>
    ${csPanel(id,m,ro)}
    ${fArea('Notes','p',id,'notes',m,{ro,rows:3})}
    ${S.me.admin?h`<div class="secret"><span class="fl">GM only · Loyalty</span>
      <div class="row"><div class="seg" role="group" aria-label="Loyalty">${[0,1,2,3,4,5].map(n=>h`<button data-act="loy" data-pid="${m.id}" data-uid="${uid}" data-n="${n}" aria-pressed="${String(L===n)}">${n}</button>`)}</div><span class="sub">${LOY_WORDS[L]}</span></div>
      ${fArea('Private notes on this Pokémon','gl',m.id,'note',gl,{rows:2})}</div>`:''}
    ${ro?'':h`<div class="row sp">
      <div class="row"><button class="btn sm" data-act="slot" data-uid="${uid}" data-pid="${m.id}">${m.slot==='box'?'Move to party':'Move to box'}</button>
        <button class="btn sm ghost" data-act="ord" data-uid="${uid}" data-pid="${m.id}" data-d="-1" ${pos===0?raw('disabled'):''} aria-label="Move earlier">↑</button>
        <button class="btn sm ghost" data-act="ord" data-uid="${uid}" data-pid="${m.id}" data-d="1" ${pos===len-1?raw('disabled'):''} aria-label="Move later">↓</button></div>
      ${delBtn('p',id,'Delete Pokémon')}</div>`}
  </div>`;
}

function monCard(uid,m,ro,pos,len){
  const key='p'+uid+'/'+m.id;
  const open=!!S.ui.open[key];
  const loy=S.me.admin?clamp(num((S.gmLoy[m.id]||{}).loyalty),0,5):null;
  const mon=megaOn(m);
  const spLabel=mon?(m.mega.form||'Mega form'):m.species;
  const pop=S.ui.megaPop&&S.ui.megaPop.pid===m.id&&S.ui.megaPop.uid===uid;
  const epop=S.ui.evoPop&&S.ui.evoPop.pid===m.id&&S.ui.evoPop.uid===uid;
  return h`<article class="mon ${open?'open':''} ${mon?'mega':''} ${pop?'megapop':''} ${epop?'evopop':''}" ${typeVars(m)}>
    <div class="mh">
      <div class="mt"><div class="spr">${monPic(m)}</div><div class="mtx"><h3>${mName(m)}</h3>
        <p class="sub">${[m.nick&&spLabel?spLabel:'',m.ball?h`${itemMini(m.ball)}${m.ball}`:'',m.item?h`${itemMini(m.item)}holding ${m.item}`:''].filter(x=>x!=='').map((b,i)=>h`${i?' · ':''}${b}`)}</p>
        <div class="types">${typeChips(m)}${genPill(m.gender)}${m.shiny===true?h`<span class="pill shiny"><span aria-hidden="true">✦</span> Shiny</span>`:''}${mon?h`<span class="pill mega">Mega</span>`:''}${m.status?h`<span class="pill status">${m.status}</span>`:''}${stgPills(m)}${loy!==null?h`<span class="pill gm">Loyalty ${loy}</span>`:''}</div></div>
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
  if(PTA.idx&&!ro)ptaLists();
  return h`${trainerPicker()}
    <section class="panel"><div class="ph"><h2>${tName(t)}’s Pokémon</h2>
      <div class="acts">${ro?'':h`<button class="btn primary sm" data-act="newMon">Add Pokémon</button><button class="btn sm" data-act="heal">Pokémon Center</button><button class="btn sm" data-act="rest">Rest 8h</button><button class="btn sm" data-act="endBattle">End battle</button>`}</div></div>
      <p class="sub">Carrying ${pt.length} of 6. Pokémon Center restores HP and clears status. Rest 8h refills daily move uses. End battle reverts Mega forms and recharges the Key Stone.</p>
      ${hasKey(t)?h`<div class="row">${keyChip(t,true)}</div>`:(pt.concat(bx).some(m=>m.mega)?h`<p class="sub">To Mega Evolve, add a Key Stone to the trainer’s inventory.</p>`:'')}</section>
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
  return h`${ntPublicPanel()}<section class="panel"><div class="ph"><h2>People you have met</h2>${canShared()?h`<button class="btn primary sm" data-act="newDoc" data-kind="ppl">Add person</button>`:''}</div>
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
        ${a.type==='Contest Ribbon'?h`<label class="fld"><span class="fl">Which ribbon</span><select data-u="award.ribbon">${ribHalls().map(x=>h`<option value="${x.k}" ${awardRibbon()===x.k?raw('selected'):''}>${x.n}${x.t?' ('+x.t+')':''}</option>`)}<option value="" ${awardRibbon()===''?raw('selected'):''}>Another ribbon (not in the case)</option></select></label>`:''}
        <label class="fld wide"><span class="fl">Title (optional)</span><input type="text" data-u="award.title" value="${a.title}" placeholder="${a.type==='Gym Badge'?'Defaults to the badge name':a.type==='Contest Ribbon'&&awardRibbon()?'Defaults to the ribbon name':'e.g. Saved the ferry'}" data-nr></label>
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
      <p class="sub">Revoking removes the award from the record. It does not take back a badge, ribbon or level already applied.</p>`
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
  ${hpxDesk()}
  ${CFG?tableAccess():''}
  ${awardForm()}${awardHistory()}
  ${megaDesk()}
  ${giveDesk()}
  ${evoDesk()}${evoLogDesk()}${ptaDesk()}${encDesk()}
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
      ${fArea('','gp',f.id,'notes',gp,{rows:5,ph:'Secrets, hooks and what is really here. Players never receive this.'})}</section>`:''}
    ${shPlacePanel(f)}
    ${admin?encPanel(f):''}`;
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
  <section class="panel"><div class="ph"><h2>Appearance</h2></div>
    <div class="seg" role="group" aria-label="Theme">${[['auto','Auto'],['light','Day'],['dark','Night']].map(([v,l])=>h`<button data-act="themeSet" data-v="${v}" aria-pressed="${String(themePref()===v)}">${l}</button>`)}</div>
    <p class="sub">Auto follows your device. The choice is remembered on this device only.</p></section>
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

/* ---------- page chrome ---------- */
const navGroups=()=>{const g=S.me.admin?NAV.concat([GM_NAV]):NAV;return CFG?g.concat([['You',[['account','Account']]]]):g;};
function tabCount(k){
  if(k==='people')return Object.keys(S.people).length;
  if(k==='battle')return S.battle&&S.battle.on?'LIVE':0;
  if(k==='leads')return entriesOf(S.leads).filter(l=>!l.status||l.status==='open'||l.status==='chasing').length;
  return 0;
}
function headerHtml(){
  const m=S.meta;
  const t=PAGE_LABEL[S.tab]||'Overview';
  return h`<button class="btn sm menu-btn" data-act="menu" aria-expanded="${String(!!S.ui.navOpen)}" aria-controls="side">Menu</button>
    <div class="bar-t"><p class="eyebrow">${m.campaign}</p>${S.tab==='overview'?h`<p class="bar-title">${t}</p>`:h`<h1 class="bar-title">${t}</h1>`}</div>
    <div class="bar-r">${onlineHtml()}<button class="btn sm ghost themebtn" data-act="theme" aria-label="${themeEff()==='dark'?'Switch to the day theme':'Switch to the night theme'}" title="${themeEff()==='dark'?'Day theme':'Night theme'}">${themeEff()==='dark'?ICON_SUN:ICON_MOON}</button>${S.me.admin?h`<span class="chip gm">GM</span>`:''}<span class="chip">Session ${num(m.session)||1}</span><span id="savestate" class="save ${S.save.cls}" aria-live="polite">${S.save.text}</span></div>`;
}
function renderHead(){const el=$('#head');if(el)el.innerHTML=headerHtml().s;}
function sideHtml(){
  if(S.noDb)return '';
  return h`<div class="brand"><span class="logo" aria-hidden="true"><i>LOG</i></span><div><b>${S.meta.campaign}</b><small>${S.meta.gm?'Game Master '+S.meta.gm:'Trainer Log'}</small></div></div>
    <nav aria-label="Sections">${navGroups().map(([title,items])=>h`<div class="ng"><p class="nt">${title}</p>${items.map(([k,l])=>h`<button class="nv" data-act="tab" data-tab="${k}" aria-current="${S.tab===k||(k==='map'&&S.tab==='place')?'page':'false'}"><span>${l}</span>${tabCount(k)?h`<span class="n">${tabCount(k)}</span>`:''}</button>`)}</div>`)}</nav>`;
}
function banners(){
  if(!S.me.canWrite)return h`<div class="banner warn">${CFG?'You can read this table but not change it.':'You can read this table but not change it. Ask the GM to share the page with you as a Contributor.'}</div>`;
  if(S.ui.writeFail)return h`<div class="banner warn">${CFG?'Your last change did not save. You may not have permission to change that, or you may be offline. Reload the page and try again.':'Your last change did not save. You may only have view access. Ask the GM to share the page with you as a Contributor.'}</div>`;
  return '';
}
function footer(){
  return h`<div class="foot"><span>${S.me.id?'Your private notes are visible only to you.':''}</span>${S.dl&&S.me.id?h`<button class="btn sm ghost" data-act="export">Download my backup</button>`:''}${CFG?h`<button class="btn sm ghost" data-act="signOut">Sign out</button>`:''}<span class="ver">Version ${BUILD}</span></div>`;
}
function mainHtml(){
  if(S.noDb)return emptyState('This tracker needs a signed-in view','Open it from your claude.ai link while signed in. The shared table is stored with the page, so it cannot load anywhere else.');
  if(!S.ready)return h`<p class="loading">OPENING THE TABLE…</p>`;
  const views={overview:overviewTab,journal:journalTab,timeline:timelineTab,people:peopleTab,leads:leadsTab,map:mapTab,place:placeTab,trainer:trainerTab,pokemon:pokemonTab,dex:dexTab,battle:battleTab,contest:ctTab,shop:shopTab,gm:gmTab,npc:npcTab,account:accountTab};
  let tab=S.tab;
  if((tab==='gm'||tab==='npc')&&!S.me.admin)tab='overview';
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
  if(a.classList&&(a.classList.contains('ptr')||a.classList.contains('ptz')))return{at:'fr',k:(a.classList.contains('ptz')?'ptz':'ptr')+'|'+a.dataset.id};
  const at=a.dataset.b!=null?'b':a.dataset.u!=null?'u':a.dataset.pq!=null?'pq':a.dataset.bmt!=null?'bmt':a.dataset.bmk!=null?'bmk':null;
  if(!at)return null;
  let s=null,en=null;
  try{s=a.selectionStart;en=a.selectionEnd;}catch(e){}
  return{at,k:a.dataset[at],s,en};
}
function restoreFocus(fc){
  if(!fc)return;
  if(fc.at==='fr'){
    const p=fc.k.split('|'),el=document.querySelector((p[0]==='ptz'?'.ptz':'.ptr.edit')+'[data-id="'+CSS.escape(p[1])+'"]');
    if(el)el.focus({preventScroll:true});
    return;
  }
  const el=document.querySelector('[data-'+fc.at+'="'+CSS.escape(fc.k)+'"]');
  if(!el||el.disabled)return;
  el.focus({preventScroll:true});
  try{if(fc.s!=null&&el.setSelectionRange)el.setSelectionRange(fc.s,fc.en);}catch(e){}
}
function render(){
  /* while a token is being dragged or the ruler is out, the page is left alone; one render follows when the finger lifts */
  if(bmBusy&&(bmDrag||bmRl||bmTp||bmPn)){bmQueued=true;return;}
  bmBusy=false;
  fixView();
  const fc=captureFocus();
  const a=document.activeElement;
  const navKey=a&&a.classList&&a.classList.contains('nv')?a.dataset.tab:null;
  const y=window.scrollY;
  const mv0=$('#mapview');
  const mprev=mv0?[mv0.scrollLeft,mv0.scrollTop]:null;
  const bv0=$('#bmview');
  const bprev=bv0?[bv0.scrollLeft,bv0.scrollTop]:null;
  renderHead();
  renderToday();wxSync();
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
  lbxRender();
  restoreFocus(fc);
  positionPins();
  mapScrollAfterRender(mprev);
  bmScrollAfterRender(bprev);
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
  S.noteUntil=0;
  setStatus(ok?'note':'err',msg);
  S.noteUntil=Date.now()+3500;
  const tk=S.noteTok=(S.noteTok||0)+1;
  setTimeout(()=>{if(S.noteTok!==tk)return;S.noteUntil=0;setStatus(Q.size?'busy':'saved');},3500);
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
  const rk=a.type==='Contest Ribbon'?awardRibbon():'';
  const rib=rk?ribHalls().find(x=>x.k===rk):null;
  const title=String(a.title||'').trim()||(a.type==='Gym Badge'&&bdg?bdg[1]+' Badge':rib?rib.n+' Ribbon':a.type);
  const now=Date.now();
  ids.forEach(uid=>{
    const id=S.db.collection('awards').doc().id;
    newDoc('aw',id,{uid,type:a.type,title,note:a.note||'',badge:a.type==='Gym Badge'?a.badge:'',ribbon:rib?rib.k:'',levelUp:!!a.levelUp,session:num(S.meta.session)||1,by:S.me.id,createdAt:now});
    const t=S.trainers[uid];
    if(a.type==='Gym Badge'&&a.badge){edit('t',uid,'badges.'+a.badge,true);const p={uid,key:a.badge};S.ui.pop=p;setTimeout(()=>{if(S.ui.pop===p)S.ui.pop=null;},1400);}
    if(rib){edit('t',uid,'ribbons.'+rib.k,true);const p={uid,key:'r:'+rib.k};S.ui.pop=p;setTimeout(()=>{if(S.ui.pop===p)S.ui.pop=null;},1400);}
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
async function deleteTrainer(uid){
  const t=S.trainers[uid];
  if(!t)return;
  const db=S.db;
  const pids=monsOf(uid).map(m=>m.id);
  const awIds=entriesOf(S.awards).filter(a=>a.uid===uid).map(a=>a.id);
  /* forget queued saves so nothing is written back after the delete */
  Array.from(Q.keys()).forEach(k=>{if(k==='t|'+uid||k.indexOf('p|'+uid+'/')===0){clearTimeout(Q.get(k).timer);Q.delete(k);}});
  const tref=db.collection('trainers').doc(uid);
  const batch=db.batch();
  pids.forEach(id=>batch.delete(tref.collection('pokemon').doc(id)));
  awIds.forEach(id=>batch.delete(db.collection('awards').doc(id)));
  if(S.me.admin)pids.forEach(id=>batch.delete(db.collection('gm').doc('loy_'+id)));
  batch.delete(tref);
  /* local state first, like every other delete here; the live listeners put things back if the server refuses */
  delete S.trainers[uid];delete S.pokemon[uid];
  awIds.forEach(id=>{delete S.awards[id];});
  S.ui.delT={uid:null,text:''};
  if(S.viewUid===uid)S.viewUid=null;
  setStatus('busy');render();
  try{
    await batch.commit();
    toast('Trainer deleted',true);
  }catch(e){
    fail(e);
    toast('Could not delete that trainer.');
  }
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
  if(d.act&&d.act.indexOf('b_')===0){batAct(b,e);return;}
  if(d.act&&d.act.indexOf('dx_')===0){dxAct(b,e);return;}
  if(d.act&&d.act.indexOf('ct_')===0){ctAct(b,e);return;}
  if(d.act&&d.act.indexOf('en_')===0){encAct(b);return;}
  if(d.act&&d.act.indexOf('hpx_')===0){hpxAct(b);return;}
  if(d.act&&d.act.indexOf('cd_')===0){cdAct(b);return;}
  if(d.act&&d.act.indexOf('sp_')===0){shAct(b);return;}
  if(d.act&&d.act.indexOf('rb_')===0){ribAct(b);return;}
  if(d.act&&d.act.indexOf('nt_')===0){ntAct(b,e);return;}
  if(d.act&&d.act.indexOf('bm_')===0){bmAct(b,e);return;}
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
      S.pick={spec:d.img,w:+d.w||0,h:+d.h||0,max:+d.max||0,cap:+d.cap||60000};
      const fp=$('#filepick');
      if(fp){fp.value='';fp.click();}
      break;}
    case 'rmImg':{const p=d.p.split('|');edit(p[0],p[1],p[2],'');if(p[0]==='gt'&&p[2]==='img')edit('gt',p[1],'imgc',{x:50,y:50,z:1});if(p[0]==='gt')ntPublish(p[1]);render();break;}
    case 'lbx':lbxOpen(d.k);break;
    case 'lbxx':lbxClose();break;
    case 'rmMap':removeMap();break;
    case 'delTOpen':{
      if(!canEditT(d.uid))break;
      S.ui.delT={uid:d.uid,text:''};render();
      const i=$('input[data-u="delT.text"]');if(i)i.focus();
      break;}
    case 'delTCancel':S.ui.delT={uid:null,text:''};render();break;
    case 'delTGo':{
      const t=S.trainers[d.uid];
      if(!t||!canEditT(d.uid))break;
      const word=(t.name||'').trim()||'delete';
      if(String(S.ui.delT.text||'').trim().toLowerCase()!==word.toLowerCase()){toast('That does not match. Type "'+word+'" to confirm.');break;}
      deleteTrainer(d.uid);break;}
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
      const turnOn=!(t.badges&&t.badges[d.key]);
      edit('t',d.uid,'badges.'+d.key,turnOn);
      if(turnOn){const p={uid:d.uid,key:d.key};S.ui.pop=p;setTimeout(()=>{if(S.ui.pop===p)S.ui.pop=null;},1400);}
      else S.ui.pop=null;
      render();break;}
    case 'theme':setTheme(themeEff()==='dark'?'light':'dark');break;
    case 'themeSet':setTheme(d.v);break;
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
      if(sc==='gt')ntPublish(id);
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
      endBattle(S.viewUid);
      render();break;}
    case 'rest':{
      monsOf(S.viewUid).forEach(m=>{
        if(!(m.moves||[]).length)return;
        edit('p',S.viewUid+'/'+m.id,'moves',m.moves.map(x=>Object.assign({},x,{used:0})));
      });
      endBattle(S.viewUid);
      render();break;}
    case 'endBattle':{
      if(!canEditT(S.viewUid))break;
      const n=endBattle(S.viewUid);
      toast(n?'Battle over. Mega forms reverted and the Key Stone is charged.':'Battle over. Nothing needed resetting.',true);
      render();break;}
    case 'endBattleAll':if(S.me.admin)endBattleAll();break;
    case 'megaAdd':if(canEditT(d.uid))megaAdd(d.uid,d.pid);break;
    case 'megaForm':if(canEditT(d.uid))megaAdd(d.uid,d.pid,num(d.n));break;
    case 'megaReset':if(canEditT(d.uid))megaReset(d.uid,d.pid);break;
    case 'megaDrop':if(canEditT(d.uid))megaDrop(d.uid,d.pid);break;
    case 'megaGo':megaGo(d.uid,d.pid);break;
    case 'megaRevert':megaRevert(d.uid,d.pid);break;
    case 'megaGate':megaGate(d.pid,d.v==='1');break;
    case 'evoPick':if(canEditT(d.uid))evoPick(d.uid,d.pid,d.to);break;
    case 'evoMv':evoMv(num(d.n));break;
    case 'evoMvBook':evoMvBook();break;
    case 'evoCancel':evoCancel();break;
    case 'evoGo':evoGo(d.uid,d.pid);break;
    case 'evoUndo':if(canEditT(d.uid))evoUndo(d.uid,d.pid);break;
    case 'evoKeep':if(canEditT(d.uid))evoKeep(d.uid,d.pid);break;
    case 'evoGate':evoGateSet(d.pid,d.v==='1');break;
    case 'evoOpen':evoOpenSet(d.v==='1');break;
    case 'evoAny':evoAny(d.uid,d.pid);break;
    case 'psAdj':if(canEditT(d.uid))psAdj(d.uid,d.pid);break;
    case 'psKeep':if(canEditT(d.uid))psKeep(d.uid,d.pid);break;
    case 'autofill':{
      if(!canEditT(d.uid))break;
      fillClick(d.uid,d.pid);
      break;}
    case 'ptaPick':{
      if(!S.me.admin)break;
      const fp=$('#ptafile');
      if(fp)fp.click();
      break;}
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
  if(S.me.admin)out.table={trainers:S.trainers,pokemon:S.pokemon,people:S.people,journal:S.journal,leads:S.leads,timeline:S.timeline,awards:S.awards,pins:S.pins,meta:S.meta,megaApproval:S.megaOk,loyalty:S.gmLoy,npcSecrets:S.gmNpc,npcTrainers:S.gmNt,npcPublic:S.npcPub,placePages:S.places,placeNotes:S.gmPl,battleMapSettings:S.bmGm};
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
  if(sc==='t'&&/^items\.\d+\.name$/.test(path)){liveItemIcon(t);liveKeyLine(t,id);}
  if(sc==='p'&&/^mega\.(?!auto)/.test(path))edit(sc,id,'mega.auto',false);
  if(sc==='gb'&&/^foes\.[^.]+\./.test(path))foePublish(path.split('.')[1]);
  if(sc==='gt'&&path==='cls')edit('gt',id,'adv','');
  if(sc==='gt'&&/^items\.\d+\.name$/.test(path)){liveItemIcon(t);liveKeyLine(t,id,NTS()[id]);}
  if(sc==='gt')ntPublish(id);
  if(sc==='bg')bmSync();
  if(!('nr' in t.dataset))render();
}
document.addEventListener('input',e=>{
  const t=e.target;
  if(!t||!t.dataset)return;
  if(t.classList&&t.classList.contains('ptz')){ntFrameZoom(t,false);return;}
  if(t.dataset.pq!=null){S.ui.q.places=t.value;refreshPlaceList();return;}
  if(t.dataset.sq!=null){shQty(t);return;}
  if(t.dataset.b!=null){onBound(t);if(e.inputType==='insertReplacementText')onSpeciesChange(t);return;}
  if(t.dataset.u!=null){
    const k=t.dataset.u.split('.');
    S.ui[k[0]][k[1]]=t.type==='checkbox'?t.checked:t.value;
    if(k[0]==='dx'){S.ui.dx.page=1;if(k[1]==='q'){dxRefresh();return;}}
    if(k[0]==='ct'&&ctInput(k[1],t))return;
    if(k[0]==='shop'&&k[1]==='q'){shRefresh();return;}
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
  if(t&&t.dataset&&t.dataset.b&&onSpeciesChange(t))return;
  if(t&&t.dataset&&t.dataset.evot!=null){evoTarget(t.dataset.pid,t.value);return;}
  if(t&&t.classList&&t.classList.contains('ptz')){ntFrameZoom(t,true);return;}
  if(t&&t.dataset&&t.dataset.encfx!=null){if(S.me.admin)encFxEdit(t);return;}
  if(t&&t.dataset&&t.dataset.encl!=null){if(S.me.admin)encListEdit(t);return;}
  if(t&&t.id==='encfile'){
    const f=t.files&&t.files[0];
    try{t.value='';}catch(err){}
    if(f&&S.me.admin)encImport(f);
    return;
  }
  if(t&&t.id==='ptafile'){
    const f=t.files&&t.files[0];
    try{t.value='';}catch(err){}
    if(f&&S.me.admin)ptaImport(f);
    return;
  }
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
    else if(parts[0]==='bmap'){if(S.me.admin)await bmUpload(f);}
    else{const r=await fileToImage(f,{w:pk.w,h:pk.h,max:pk.max||undefined,cap:pk.cap});edit(parts[0],parts[1],parts[2],r.url);if(parts[0]==='gt'&&parts[2]==='img'){edit('gt',parts[1],'imgc',{x:50,y:50,z:1});}if(parts[0]==='gt')ntPublish(parts[1]);}
    if(!Q.size)setStatus('saved');
    render();
    if(late)toast(late);
  }catch(err){
    if(err&&err.code)fail(err);
    else toast(err&&err.message==='too big'?'That picture is too large even after shrinking. Try another one.':'Could not read that picture');
  }
});
document.addEventListener('pointerdown',e=>{
  const f=e.target.closest&&e.target.closest('.ptr.edit');
  if(f&&(e.button==null||e.button===0))ntFrameStart(f,e);
  if(!e.target.closest||(e.button!=null&&e.button!==0))return;
  if(e.target.closest('#bmmap')){
    const u=S.ui.bm;
    if(u.ruler)bmRulerStart(e);
    else if(u.tool==='tpl')bmTplStart(e);
    else if(u.tool==='paint')bmPaintStart(e);
    else if(u.tool==='fog')bmFgStart(e);
    else{const k=e.target.closest('.bmt,.bmk');if(k)bmDragStart(k,e);}
  }
});
/* a picture inside a token must never start the browser's own picture drag, which would cancel ours */
document.addEventListener('dragstart',e=>{if(e.target&&e.target.closest&&e.target.closest('#bmmap'))e.preventDefault();});
document.addEventListener('pointermove',e=>{if(ntFrDrag)ntFrameMove(e);if(bmDrag)bmDragMove(e);if(bmRl)bmRulerMove(e);if(bmTp)bmTplMove(e);if(bmPn)bmPaintMove(e);if(bmFp)bmFgMove(e);});
const pointerEnd=()=>{if(ntFrDrag)ntFrameEnd();if(bmDrag)bmDragEnd();if(bmRl)bmRulerEnd();if(bmTp)bmTplEnd();if(bmPn)bmPaintEnd();if(bmFp)bmFgEnd();};
document.addEventListener('pointerup',pointerEnd);
document.addEventListener('pointercancel',pointerEnd);
document.addEventListener('lostpointercapture',e=>{if(e.target&&e.target.closest&&(bmDrag||bmRl||bmTp||bmPn||bmFp))setTimeout(pointerEnd,0);});
document.addEventListener('focusout',e=>{
  const t=e.target;
  if(t&&t.dataset&&t.dataset.b)onSpeciesChange(t);
});
document.addEventListener('keydown',e=>{
  if(S.ui.lbx){
    if(e.key==='Escape'){e.preventDefault();lbxClose();return;}
    if(e.key==='Tab'){e.preventDefault();const b=$('#lbx-x');if(b)b.focus({preventScroll:true});return;}
  }
  if(e.target&&e.target.classList&&e.target.classList.contains('ptr')&&e.target.classList.contains('edit')&&ntFrameKey(e.target,e))return;
  if(e.target&&e.target.classList&&(e.target.classList.contains('bmt')||e.target.classList.contains('bmk'))&&bmKey(e.target,e))return;
  if(e.key==='Escape'&&tipId)hideTip(true);
  if(e.key==='Escape'&&S.ui.navOpen){S.ui.navOpen=false;render();const m=$('.menu-btn');if(m)m.focus({preventScroll:true});}
});

/* ---------- start ---------- */
async function boot(){
  applyTheme(themePref());
  const di=$('#dl-items');
  if(di)di.innerHTML=ITEMSL.split('|').map(s=>'<option value="'+esc(itemLabel(s))+'">').join('');
  const dsc=$('#dl-scat');
  if(dsc)dsc.innerHTML=SCAT.map(x=>'<option value="'+esc(x[0])+'">').join('');
  const dbl=$('#dl-balls');
  if(dbl)dbl.innerHTML=BALLS.map(s=>'<option value="'+esc(itemLabel(s))+'">').join('');
  const ds=$('#dl-species');
  if(ds)ds.innerHTML=DEXN.split('|').map(n=>'<option value="'+esc(n)+'">').join('');
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
