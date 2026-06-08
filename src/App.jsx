import { useState, useEffect, useRef, useCallback } from "react";

const BITCOIN_ADDRESS  = "bc1q6zde7kxrz9pqkcqrqc0n4m6c4w7fh78fq33960";
const ADMIN_EMAIL      = "ukohavictor05@gmail.com";
const MIN_INVEST       = 100;
const MIN_WITHDRAW     = 500;
const WITHDRAW_LOCK_DAYS = 90;

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: "Marcus T.", country: "🇺🇸 United States", avatar: "M", text: "I was skeptical at first, but after my first 90-day cycle completed I was genuinely impressed. The dashboard is clean, the team responds fast on Telegram, and my balance grew exactly as expected.", plan: "Premium Plan", joined: "March 2023" },
  { name: "Amara O.", country: "🇳🇬 Nigeria",        avatar: "A", text: "BitGrow has been one of the best financial decisions I've made. The verification process was smooth and the admin team is very professional. I've already referred three friends.", plan: "Basic Plan", joined: "July 2023" },
  { name: "Chen W.",  country: "🇸🇬 Singapore",      avatar: "C", text: "As someone who has tried multiple crypto platforms, BitGrow stands out for its transparency and support. The 12-phrase recovery system gave me real confidence in the security.", plan: "VIP Plan", joined: "January 2024" },
  { name: "Sofia R.", country: "🇧🇷 Brazil",          avatar: "S", text: "I started with the Starter Plan just to test things out. Three months later my balance had grown considerably. Now I've upgraded to Premium. The process is exactly as described.", plan: "Starter Plan", joined: "October 2023" },
  { name: "James K.", country: "🇬🇧 United Kingdom",  avatar: "J", text: "The platform is intuitive and the live chat support is genuinely helpful. I had a question about my withdrawal and it was resolved within 10 minutes. Highly recommend.", plan: "Basic Plan", joined: "April 2024" },
  { name: "Fatima A.",country: "🇦🇪 UAE",             avatar: "F", text: "Professional platform with a serious team behind it. The blockchain verification step gave me confidence that my funds were being handled properly.", plan: "VIP Plan", joined: "February 2024" },
];


const BIP_WORDS = ["abandon","ability","able","about","above","absent","absorb","abstract","absurd","abuse","access","accident","account","accuse","achieve","acid","acoustic","acquire","across","act","action","actor","actress","actual","adapt","add","addict","address","adjust","admit","adult","advance","advice","aerobic","afford","afraid","again","agent","agree","ahead","aim","air","airport","aisle","alarm","album","alcohol","alert","alien","alley","allow","almost","alone","alpha","already","also","alter","always","amateur","amazing","among","amount","amused","analyst","anchor","ancient","anger","angle","angry","animal","ankle","announce","annual","another","answer","antenna","antique","anxiety","april","arch","arctic","area","arena","argue","arm","armed","armor","army","around","arrange","arrest","arrive","arrow","art","article","artist","artwork","ask","aspect","assault","asset","assist","assume","asthma","athlete","atom","attack","attend","attitude","attract","auction","audit","august","aunt","author","auto","autumn","average","avocado","aware","awesome","awful","awkward","axis","baby","balance","bamboo","banana","banner","barely","bargain","barrel","base","basic","basket","battle","beach","beauty","because","become","beef","before","begin","behave","behind","believe","below","belt","bench","benefit","best","betray","better","between","beyond","bicycle","bid","bike","bind","biology","bird","birth","bitter","black","blade","blame","blanket","blast","bleak","bless","blind","blood","blossom","blouse","blue","blur","blush","board","boat","body","boil","bomb","bone","book","boost","border","boring","borrow","bounce","brain","brand","brave","bread","breeze","brick","bridge","brief","bright","bring","brisk","broken","bronze","broom","brother","brown","brush","bubble","buddy","budget","buffalo","build","bulb","bulk","bullet","bundle","bunker","burden","burger","burst","bus","business","busy","butter","buyer","buzz"];

function gen12Phrase() {
  const arr = [];
  for (let i = 0; i < 12; i++) arr.push(BIP_WORDS[Math.floor(Math.random() * BIP_WORDS.length)]);
  return arr.join(" ");
}
function genReferralCode() { return "BG" + Math.random().toString(36).substring(2, 8).toUpperCase(); }

const PLANS = [
  { id:"starter", name:"Starter", min:100,   max:499,      roi:1.30, color:"#f59e0b", badge:"⚡", desc:"Entry-level growth strategy",  dailyRate:0.30/90 },
  { id:"basic",   name:"Basic",   min:500,   max:1999,     roi:1.50, color:"#10b981", badge:"🔥", desc:"Balanced yield portfolio",       dailyRate:0.50/90 },
  { id:"premium", name:"Premium", min:2000,  max:9999,     roi:1.80, color:"#6366f1", badge:"💎", desc:"High-performance asset mix",     dailyRate:0.80/90 },
  { id:"vip",     name:"VIP",     min:10000, max:Infinity, roi:2.00, color:"#f43f5e", badge:"👑", desc:"Institutional-grade strategy",  dailyRate:1.00/90 },
];

// ─── COUNTRY DATA: dial codes, currencies, states/cities ─────────────────────
const COUNTRY_DATA = {
  "Afghanistan":      { code:"+93",  currency:"AFN – Afghan Afghani",       states:{ "Kabul":["Kabul City","Paghman","Mir Bacha Kot","Bagrami"],"Kandahar":["Kandahar City","Spin Boldak","Dand","Maiwand"],"Herat":["Herat City","Guzara","Injil","Karukh"],"Balkh":["Mazar-i-Sharif","Nahri Shahi","Dawlatabad","Kishindih"],"Nangarhar":["Jalalabad","Behsud","Rodat","Kama"] } },
  "Albania":          { code:"+355", currency:"ALL – Albanian Lek",          states:{ "Tirana":["Tirana City","Kamëz","Vora","Kashar"],"Durrës":["Durrës City","Shijak","Krujë","Rrashbull"],"Vlorë":["Vlorë City","Orikum","Selenicë","Himarë"],"Shkodër":["Shkodër City","Lezhë","Laç","Mamurras"],"Korçë":["Korçë City","Pogradec","Ersekë","Maliq"] } },
  "Algeria":          { code:"+213", currency:"DZD – Algerian Dinar",        states:{ "Algiers":["Algiers City","Bab Ezzouar","Dar El Beïda","Birtouta"],"Oran":["Oran City","Es Senia","Bir El Djir","Arzew"],"Constantine":["Constantine City","El Khroub","Ain Smara","Hamma Bouziane"],"Annaba":["Annaba City","El Bouni","El Hadjar","Berrahal"],"Blida":["Blida City","Boufarik","Larbaa","Meftah"] } },
  "Angola":           { code:"+244", currency:"AOA – Angolan Kwanza",        states:{ "Luanda":["Luanda City","Cacuaco","Belas","Viana"],"Huambo":["Huambo City","Caála","Londuimbali","Bailundo"],"Benguela":["Benguela City","Lobito","Balombo","Bocoio"],"Huíla":["Lubango","Sá da Bandeira","Chibia","Humpata"],"Cabinda":["Cabinda City","Buco-Zau","Belize","Cacongo"] } },
  "Argentina":        { code:"+54",  currency:"ARS – Argentine Peso",        states:{ "Buenos Aires":["Buenos Aires City","La Plata","Mar del Plata","Quilmes","Lanús"],"Córdoba":["Córdoba City","Villa Carlos Paz","Río Cuarto","San Francisco","Villa María"],"Santa Fe":["Rosario","Santa Fe City","Rafaela","Venado Tuerto","Santo Tomé"],"Mendoza":["Mendoza City","San Rafael","Godoy Cruz","Guaymallén","Las Heras"],"Tucumán":["San Miguel de Tucumán","Tafí Viejo","Yerba Buena","Banda del Río Salí","Concepción"] } },
  "Australia":        { code:"+61",  currency:"AUD – Australian Dollar",     states:{ "New South Wales":["Sydney","Newcastle","Wollongong","Parramatta","Central Coast","Maitland","Albury","Wagga Wagga"],"Victoria":["Melbourne","Geelong","Ballarat","Bendigo","Shepparton","Melton","Mildura","Wodonga"],"Queensland":["Brisbane","Gold Coast","Townsville","Cairns","Toowoomba","Mackay","Rockhampton","Bundaberg"],"Western Australia":["Perth","Fremantle","Mandurah","Bunbury","Geraldton","Kalgoorlie","Albany","Broome"],"South Australia":["Adelaide","Mount Gambier","Whyalla","Murray Bridge","Port Augusta","Port Lincoln","Port Pirie","Gawler"],"Tasmania":["Hobart","Launceston","Devonport","Burnie","Kingston","Ulverstone","Queenstown","Scottsdale"],"Northern Territory":["Darwin","Alice Springs","Katherine","Nhulunbuy","Tennant Creek","Palmerston"],"Australian Capital Territory":["Canberra","Belconnen","Tuggeranong","Gungahlin","Woden Valley"] } },
  "Austria":          { code:"+43",  currency:"EUR – Euro",                  states:{ "Vienna":["Vienna City","Floridsdorf","Donaustadt","Favoriten","Simmering"],"Styria":["Graz","Leoben","Kapfenberg","Bruck an der Mur","Weiz"],"Upper Austria":["Linz","Wels","Steyr","Leonding","Traun"],"Lower Austria":["Sankt Pölten","Krems","Wiener Neustadt","Klosterneuburg","Amstetten"],"Salzburg":["Salzburg City","Hallein","Wals-Siezenheim","Seekirchen","Bürmoos"],"Tyrol":["Innsbruck","Kufstein","Wörgl","Hall in Tirol","Telfs"],"Vorarlberg":["Bregenz","Dornbirn","Feldkirch","Hohenems","Lustenau"],"Carinthia":["Klagenfurt","Villach","Wolfsberg","Spittal an der Drau","Feldkirchen"] } },
  "Bangladesh":       { code:"+880", currency:"BDT – Bangladeshi Taka",     states:{ "Dhaka":["Dhaka City","Narayanganj","Gazipur","Tongi","Savar","Narsingdi","Munshiganj"],"Chittagong":["Chittagong City","Cox's Bazar","Comilla","Brahmanbaria","Chandpur","Feni"],"Rajshahi":["Rajshahi City","Bogra","Pabna","Naogaon","Natore","Chapai Nawabganj"],"Khulna":["Khulna City","Jessore","Satkhira","Bagerhat","Narail","Chuadanga"],"Sylhet":["Sylhet City","Moulvibazar","Habiganj","Sunamganj"] } },
  "Belgium":          { code:"+32",  currency:"EUR – Euro",                  states:{ "Brussels":["Brussels City","Ixelles","Anderlecht","Schaerbeek","Molenbeek-Saint-Jean"],"Antwerp":["Antwerp City","Mechelen","Turnhout","Geel","Herentals"],"Ghent":["Ghent City","Bruges","Kortrijk","Aalst","Sint-Niklaas"],"Liège":["Liège City","Verviers","Seraing","Herstal","Tongeren"],"Brabant Wallon":["Wavre","Ottignies","Tubize","Braine-l'Alleud","Nivelles"] } },
  "Brazil":           { code:"+55",  currency:"BRL – Brazilian Real",        states:{ "São Paulo":["São Paulo City","Campinas","Santos","Guarulhos","Osasco","São Bernardo do Campo","Santo André","Ribeirão Preto"],"Rio de Janeiro":["Rio de Janeiro City","Niterói","Nova Iguaçu","Duque de Caxias","São Gonçalo","Belford Roxo","Petrópolis"],"Minas Gerais":["Belo Horizonte","Uberlândia","Contagem","Juiz de Fora","Betim","Montes Claros","Ribeirão das Neves"],"Bahia":["Salvador","Feira de Santana","Vitória da Conquista","Camaçari","Juazeiro","Ilhéus"],"Paraná":["Curitiba","Londrina","Maringá","Ponta Grossa","Cascavel","São José dos Pinhais"],"Rio Grande do Sul":["Porto Alegre","Caxias do Sul","Canoas","Pelotas","Santa Maria","Gravataí"],"Pernambuco":["Recife","Caruaru","Olinda","Petrolina","Paulista","Jaboatão dos Guararapes"],"Ceará":["Fortaleza","Caucaia","Juazeiro do Norte","Maracanaú","Sobral","Crato"] } },
  "Canada":           { code:"+1",   currency:"CAD – Canadian Dollar",       states:{ "Ontario":["Toronto","Ottawa","Mississauga","Brampton","Hamilton","London","Markham","Vaughan","Kitchener","Windsor"],"British Columbia":["Vancouver","Victoria","Kelowna","Abbotsford","Surrey","Burnaby","Richmond","Kamloops","Prince George"],"Quebec":["Montreal","Quebec City","Laval","Gatineau","Longueuil","Sherbrooke","Saguenay","Lévis","Trois-Rivières"],"Alberta":["Calgary","Edmonton","Red Deer","Lethbridge","St. Albert","Medicine Hat","Grande Prairie","Airdrie"],"Manitoba":["Winnipeg","Brandon","Steinbach","Kenora","Portage la Prairie","Thompson","Winkler"],"Saskatchewan":["Saskatoon","Regina","Prince Albert","Moose Jaw","Swift Current","Yorkton","North Battleford"],"Nova Scotia":["Halifax","Sydney","Truro","New Glasgow","Glace Bay","Dartmouth","Kentville"],"New Brunswick":["Fredericton","Moncton","Saint John","Miramichi","Bathurst","Edmundston","Campbellton"],"Newfoundland and Labrador":["St. John's","Mount Pearl","Corner Brook","Conception Bay South","Grand Falls-Windsor"],"Prince Edward Island":["Charlottetown","Summerside","Stratford","Cornwall","Montague"] } },
  "Chile":            { code:"+56",  currency:"CLP – Chilean Peso",          states:{ "Metropolitan Region":["Santiago","Puente Alto","San Bernardo","Maipú","La Florida","Las Condes"],"Valparaíso":["Valparaíso City","Viña del Mar","Quilpué","Villa Alemana","San Antonio"],"Biobío":["Concepción","Talcahuano","Chillán","Los Ángeles","Coronel","San Pedro de la Paz"],"Araucanía":["Temuco","Padre Las Casas","Villarrica","Pucón","Angol","Victoria"],"Los Lagos":["Puerto Montt","Osorno","Castro","Puerto Varas","Ancud","Calbuco"] } },
  "China":            { code:"+86",  currency:"CNY – Chinese Yuan",          states:{ "Beijing":["Dongcheng","Xicheng","Chaoyang","Haidian","Fengtai","Shijingshan","Tongzhou"],"Shanghai":["Pudong","Jing'an","Huangpu","Xuhui","Changning","Minhang","Baoshan","Jiading"],"Guangdong":["Guangzhou","Shenzhen","Dongguan","Foshan","Zhuhai","Zhongshan","Jiangmen","Shantou"],"Jiangsu":["Nanjing","Suzhou","Wuxi","Changzhou","Nantong","Yangzhou","Zhenjiang","Xuzhou"],"Zhejiang":["Hangzhou","Ningbo","Wenzhou","Jinhua","Shaoxing","Huzhou","Jiaxing","Taizhou"],"Shandong":["Jinan","Qingdao","Yantai","Zibo","Weifang","Jining","Linyi","Zaozhuang"],"Sichuan":["Chengdu","Mianyang","Deyang","Nanchong","Leshan","Zigong","Luzhou","Yibin"],"Hubei":["Wuhan","Yichang","Xiangyang","Jingzhou","Huangshi","Shiyan","Ezhou","Jingmen"] } },
  "Colombia":         { code:"+57",  currency:"COP – Colombian Peso",        states:{ "Bogotá D.C.":["Usaquén","Chapinero","Santa Fe","San Cristóbal","Usme","Tunjuelito","Bosa","Kennedy","Fontibón","Engativá","Suba"],"Antioquia":["Medellín","Bello","Itagüí","Envigado","Apartadó","Turbo","Rionegro","Caucasia"],"Valle del Cauca":["Cali","Buenaventura","Palmira","Tuluá","Buga","Cartago","Jamundí"],"Atlántico":["Barranquilla","Soledad","Malambo","Sabanalarga","Galapa","Puerto Colombia"],"Cundinamarca":["Soacha","Facatativá","Zipaquirá","Chía","Fusagasugá","Girardot","Madrid"] } },
  "Congo":            { code:"+242", currency:"XAF – Central African CFA",   states:{ "Brazzaville":["Brazzaville City","Bacongo","Makélékélé","Talangaï","Ouenzé"],"Pointe-Noire":["Pointe-Noire City","Loandjili","Ngoyo","Tié-Tié","Mongo-Mpoukou"],"Bouenza":["Madingou","Nkayi","Loudima","Mabombo","Mouyondzi"],"Niari":["Dolisie","Mossendjo","Kibangou","Divénié","Kakamoeka"],"Plateaux":["Djambala","Gamboma","Lékana","Makotimpoko","Allembé"] } },
  "Denmark":          { code:"+45",  currency:"DKK – Danish Krone",          states:{ "Capital Region":["Copenhagen","Frederiksberg","Gentofte","Gladsaxe","Herlev","Ballerup","Lyngby-Taarbæk"],"Central Denmark":["Aarhus","Silkeborg","Randers","Horsens","Viborg","Herning","Skanderborg"],"Southern Denmark":["Odense","Esbjerg","Vejle","Kolding","Sønderborg","Fredericia","Aabenraa"],"North Denmark":["Aalborg","Frederikshavn","Hjørring","Thisted","Brønderslev","Jammerbugt"],"Zealand":["Roskilde","Køge","Holbæk","Næstved","Slagelse","Ringsted","Vordingborg"] } },
  "Ecuador":          { code:"+593", currency:"USD – US Dollar",             states:{ "Pichincha":["Quito","Cayambe","Pedro Moncayo","Mejía","Rumiñahui","San Miguel de los Bancos"],"Guayas":["Guayaquil","Daule","Milagro","Samborondón","Durán","El Triunfo","Naranjito"],"Azuay":["Cuenca","Gualaceo","Paute","Santa Isabel","Sigsig","Girón","Nabón"],"Manabí":["Portoviejo","Manta","Chone","El Carmen","Bahía de Caráquez","Pedernales"],"El Oro":["Machala","Santa Rosa","Pasaje","Huaquillas","Zaruma","Portovelo"] } },
  "Egypt":            { code:"+20",  currency:"EGP – Egyptian Pound",        states:{ "Cairo":["Cairo City","Heliopolis","Nasr City","Maadi","Zamalek","Shubra","Ain Shams","Helwan"],"Alexandria":["Alexandria City","Montaza","Sidi Gaber","Smouha","Agami","Borg El Arab","Abu Qir"],"Giza":["Giza City","6th of October","Sheikh Zayed","Imbaba","Dokki","Mohandessin"],"Qalyubia":["Banha","Shubra El Kheima","Qalyub","Khanka","Tukh","Obour"],"Dakahlia":["Mansoura","Talkha","Mit Ghamr","Aga","Belqas","Sherbin","Mahalla El Kubra"] } },
  "Ethiopia":         { code:"+251", currency:"ETB – Ethiopian Birr",        states:{ "Addis Ababa":["Addis Ababa City","Bole","Kolfe Keranio","Yeka","Lideta","Nifas Silk-Lafto","Gullele"],"Oromia":["Adama","Jimma","Dire Dawa","Bishoftu","Shashemene","Nekemte","Asella","Robe"],"Amhara":["Bahir Dar","Gondar","Dessie","Debre Birhan","Debre Markos","Lalibela","Woldia"],"Tigray":["Mekelle","Axum","Adigrat","Adwa","Shire","Humera","Abiy Addi"],"SNNPR":["Hawassa","Arba Minch","Hosaena","Wolaita Sodo","Dilla","Yirgalem","Butajira"] } },
  "Finland":          { code:"+358", currency:"EUR – Euro",                  states:{ "Uusimaa":["Helsinki","Espoo","Vantaa","Tampere","Porvoo","Hyvinkää","Nurmijärvi","Järvenpää"],"Pirkanmaa":["Tampere","Nokia","Ylöjärvi","Kangasala","Lempäälä","Pirkkala","Sastamala"],"Southwest Finland":["Turku","Naantali","Salo","Kaarina","Raisio","Parainen","Loimaa"],"North Ostrobothnia":["Oulu","Kempele","Ii","Liminka","Muhos","Tyrnävä","Oulunsalo"],"Central Finland":["Jyväskylä","Muurame","Laukaa","Äänekoski","Jämsä","Keuruu","Saarijärvi"] } },
  "France":           { code:"+33",  currency:"EUR – Euro",                  states:{ "Île-de-France":["Paris","Boulogne-Billancourt","Saint-Denis","Argenteuil","Montreuil","Nanterre","Créteil","Versailles"],"Provence-Alpes-Côte d'Azur":["Marseille","Nice","Toulon","Aix-en-Provence","Avignon","Cannes","Antibes"],"Auvergne-Rhône-Alpes":["Lyon","Grenoble","Saint-Étienne","Clermont-Ferrand","Villeurbanne","Chambéry"],"Occitanie":["Toulouse","Montpellier","Nîmes","Perpignan","Béziers","Narbonne","Albi"],"Nouvelle-Aquitaine":["Bordeaux","Limoges","Pau","Bayonne","Périgueux","Agen","La Rochelle"],"Hauts-de-France":["Lille","Amiens","Roubaix","Tourcoing","Calais","Dunkirk","Valenciennes"],"Grand Est":["Strasbourg","Reims","Metz","Nancy","Colmar","Mulhouse","Troyes"],"Normandie":["Rouen","Caen","Le Havre","Cherbourg","Évreux","Alençon","Dieppe"],"Bretagne":["Rennes","Brest","Quimper","Lorient","Vannes","Saint-Malo","Saint-Brieuc"] } },
  "Germany":          { code:"+49",  currency:"EUR – Euro",                  states:{ "Bavaria":["Munich","Nuremberg","Augsburg","Regensburg","Ingolstadt","Würzburg","Fürth","Erlangen"],"North Rhine-Westphalia":["Cologne","Düsseldorf","Dortmund","Essen","Duisburg","Bochum","Wuppertal","Bonn"],"Baden-Württemberg":["Stuttgart","Mannheim","Karlsruhe","Freiburg","Heidelberg","Heilbronn","Pforzheim","Ulm"],"Berlin":["Mitte","Charlottenburg","Pankow","Neukölln","Tempelhof","Spandau","Steglitz","Lichtenberg"],"Hamburg":["Hamburg City","Altona","Eimsbüttel","Wandsbek","Harburg","Bergedorf","Nord"],"Saxony":["Dresden","Leipzig","Chemnitz","Zwickau","Plauen","Görlitz","Halle","Erfurt"],"Hesse":["Frankfurt","Wiesbaden","Kassel","Darmstadt","Hanau","Marburg","Gießen","Fulda"],"Lower Saxony":["Hanover","Braunschweig","Osnabrück","Oldenburg","Wolfsburg","Göttingen","Hildesheim"],"Rhineland-Palatinate":["Mainz","Ludwigshafen","Koblenz","Trier","Kaiserslautern","Worms","Neustadt"],"Saxony-Anhalt":["Magdeburg","Halle","Dessau","Wittenberg","Halberstadt","Stendal","Quedlinburg"],"Schleswig-Holstein":["Kiel","Lübeck","Flensburg","Neumünster","Norderstedt","Elmshorn","Pinneberg"],"Brandenburg":["Potsdam","Cottbus","Brandenburg an der Havel","Frankfurt (Oder)","Eberswalde"],"Thuringia":["Erfurt","Jena","Gera","Weimar","Gotha","Nordhausen","Mühlhausen","Suhl"],"Mecklenburg-Vorpommern":["Rostock","Schwerin","Stralsund","Neubrandenburg","Greifswald","Wismar"],"Saarland":["Saarbrücken","Neunkirchen","Homburg","Völklingen","Sankt Ingbert","Merzig"],"Bremen":["Bremen City","Bremerhaven"] } },
  "Ghana":            { code:"+233", currency:"GHS – Ghanaian Cedi",         states:{ "Greater Accra":["Accra","Tema","Madina","Ashaiman","Dome","Tesano","Osu","Labadi","La","Nungua","Teshie","Lashibi"],"Ashanti":["Kumasi","Obuasi","Ejisu","Bekwai","Konongo","Mampong","Juaben","Asante Mampong"],"Western":["Sekondi-Takoradi","Tarkwa","Axim","Prestea","Bibiani","Sefwi Wiawso","Enchi"],"Eastern":["Koforidua","Nsawam","Nkawkaw","Oda","Asamankese","Akropong","Suhum"],"Central":["Cape Coast","Kasoa","Winneba","Mankessim","Saltpond","Apam","Swedru"],"Volta":["Ho","Hohoe","Keta","Sogakope","Aflao","Kpando","Nkwanta","Dambai"],"Brong-Ahafo":["Sunyani","Techiman","Berekum","Dormaa Ahenkro","Wenchi","Kintampo","Atebubu"],"Northern":["Tamale","Yendi","Savelugu","Nkoranza","Damongo","Bole","Walewale","Gushegu"],"Upper East":["Bolgatanga","Navrongo","Bawku","Zebilla","Bongo","Sandema","Kasena Nankana"],"Upper West":["Wa","Nandom","Lawra","Jirapa","Tumu","Hamile","Funsi"] } },
  "Greece":           { code:"+30",  currency:"EUR – Euro",                  states:{ "Attica":["Athens","Piraeus","Peristeri","Kallithea","Nikaia","Glyfada","Ilion","Acharnes"],"Central Macedonia":["Thessaloniki","Kalamaria","Oreokastro","Serres","Veria","Kilkis","Drama"],"Crete":["Heraklion","Chania","Rethymno","Agios Nikolaos","Ierapetra","Sitia","Anogia"],"Thessaly":["Larissa","Volos","Trikala","Karditsa","Almyros","Tyrnavos","Farsala"],"Peloponnese":["Patras","Tripoli","Kalamata","Corinth","Sparta","Argos","Nafplio"] } },
  "Guatemala":        { code:"+502", currency:"GTQ – Guatemalan Quetzal",    states:{ "Guatemala":["Guatemala City","Mixco","Villa Nueva","Chinautla","San Juan Sacatepequez","Petapa"],"Escuintla":["Escuintla","Puerto San José","Masagua","Tiquisate","La Democracia"],"Alta Verapaz":["Cobán","San Pedro Carchá","Chisec","Tactic","Cahabón","Panzós"],"Quetzaltenango":["Quetzaltenango City","Coatepeque","Huehuetango","Almolonga","Zunil"],"San Marcos":["San Marcos City","Malacatán","Ayutla","Ocós","Pajapita","Catarina"] } },
  "Hungary":          { code:"+36",  currency:"HUF – Hungarian Forint",      states:{ "Budapest":["Budapest City","Óbuda","Pest","Buda","Újpest","Kispest","Rákospalota"],"Pest":["Érd","Dunakeszi","Gödöllő","Vác","Cegléd","Dabas","Monor","Vecsés"],"Győr-Moson-Sopron":["Győr","Sopron","Mosonmagyaróvár","Kapuvár","Csorna","Fertőd"],"Borsod-Abaúj-Zemplén":["Miskolc","Kazincbarcika","Ózd","Tiszaújváros","Sátoraljaújhely"],"Hajdú-Bihar":["Debrecen","Hajdúböszörmény","Berettyóújfalu","Hajdúszoboszló","Balmazújváros"] } },
  "India":            { code:"+91",  currency:"INR – Indian Rupee",          states:{ "Maharashtra":["Mumbai","Pune","Nagpur","Nashik","Aurangabad","Solapur","Amravati","Kolhapur","Thane","Navi Mumbai"],"Karnataka":["Bengaluru","Mysuru","Hubli","Mangaluru","Belagavi","Kalaburagi","Ballari","Vijayapura","Shivamogga"],"Tamil Nadu":["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Erode","Vellore","Tirunelveli","Tiruppur"],"Uttar Pradesh":["Lucknow","Kanpur","Ghaziabad","Agra","Varanasi","Meerut","Prayagraj","Bareilly","Aligarh"],"Gujarat":["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Gandhinagar","Junagadh"],"Rajasthan":["Jaipur","Jodhpur","Kota","Bikaner","Ajmer","Udaipur","Bhilwara","Alwar","Sikar"],"West Bengal":["Kolkata","Howrah","Durgapur","Asansol","Siliguri","Bardhaman","Malda","Murshidabad"],"Andhra Pradesh":["Visakhapatnam","Vijayawada","Guntur","Nellore","Kurnool","Kakinada","Rajahmundry","Tirupati"],"Telangana":["Hyderabad","Warangal","Karimnagar","Nizamabad","Khammam","Nalgonda","Mahbubnagar"],"Kerala":["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kannur","Kollam","Palakkad","Alappuzha"],"Delhi":["New Delhi","Dwarka","Rohini","Janakpuri","Pitampura","Laxmi Nagar","Karol Bagh","Connaught Place"],"Punjab":["Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Mohali","Pathankot","Hoshiarpur"],"Haryana":["Faridabad","Gurgaon","Panipat","Ambala","Yamunanagar","Rohtak","Hisar","Karnal"],"Bihar":["Patna","Gaya","Bhagalpur","Muzaffarpur","Darbhanga","Purnia","Arrah","Begusarai"],"Madhya Pradesh":["Bhopal","Indore","Jabalpur","Gwalior","Ujjain","Sagar","Dewas","Satna"] } },
  "Indonesia":        { code:"+62",  currency:"IDR – Indonesian Rupiah",     states:{ "DKI Jakarta":["Central Jakarta","North Jakarta","South Jakarta","East Jakarta","West Jakarta","Kepulauan Seribu"],"West Java":["Bandung","Bekasi","Bogor","Depok","Cimahi","Tasikmalaya","Sukabumi","Karawang"],"East Java":["Surabaya","Malang","Sidoarjo","Kediri","Jember","Blitar","Madiun","Mojokerto"],"Central Java":["Semarang","Solo","Yogyakarta","Salatiga","Magelang","Klaten","Cilacap","Pekalongan"],"Bali":["Denpasar","Kuta","Ubud","Singaraja","Tabanan","Gianyar","Klungkung","Bangli"] } },
  "Iran":             { code:"+98",  currency:"IRR – Iranian Rial",          states:{ "Tehran":["Tehran City","Karaj","Varamin","Shahr-e Rey","Eslamshahr","Pakdasht"],"Isfahan":["Isfahan City","Kashan","Najafabad","Shahinshahr","Zarinshahr","Lenjan"],"Razavi Khorasan":["Mashhad","Nishapur","Sabzevar","Torbat-e Heydarieh","Quchan"],"Fars":["Shiraz","Marvdasht","Jahrom","Fasa","Kazerun","Lar","Abadeh"],"East Azerbaijan":["Tabriz","Maragheh","Marand","Sarab","Bonab","Shabestar","Ahar"] } },
  "Iraq":             { code:"+964", currency:"IQD – Iraqi Dinar",           states:{ "Baghdad":["Baghdad City","Sadr City","Al-Karkh","Al-Rusafa","Kadhimiya","Mansour"],"Basra":["Basra City","Zubayr","Abu Al-Khasib","Faw","Qurna","Shatt al-Arab"],"Erbil":["Erbil City","Soran","Koya","Makhmur","Shaqlawa","Choman"],"Sulaymaniyah":["Sulaymaniyah City","Halabja","Ranya","Darbandikhan","Chamchamal"],"Kirkuk":["Kirkuk City","Tuz Khurmatu","Daquq","Hawija","Dibs"] } },
  "Ireland":          { code:"+353", currency:"EUR – Euro",                  states:{ "Leinster":["Dublin","Drogheda","Dundalk","Bray","Navan","Kilkenny","Ennis","Carlow"],"Munster":["Cork","Limerick","Waterford","Clonmel","Killarney","Tralee","Mallow"],"Connacht":["Galway","Sligo","Castlebar","Tuam","Ballinasloe","Roscommon"],"Ulster":["Letterkenny","Monaghan","Cavan","Donegal","Carrickmacross","Bailieborough"] } },
  "Israel":           { code:"+972", currency:"ILS – Israeli Shekel",        states:{ "Tel Aviv":["Tel Aviv City","Ramat Gan","Bnei Brak","Petah Tikva","Holon","Bat Yam","Herzliya"],"Jerusalem":["Jerusalem City","Beit Shemesh","Ma'ale Adumim","Beitar Illit","Efrat"],"Haifa":["Haifa City","Krayot","Tirat Carmel","Nesher","Yokneam","Caesarea"],"Central District":["Rishon LeZion","Rehovot","Ashdod","Lod","Ramla","Modi'in","Netanya"],"Southern District":["Beersheba","Ashkelon","Eilat","Kiryat Gat","Sderot","Arad"] } },
  "Italy":            { code:"+39",  currency:"EUR – Euro",                  states:{ "Lombardy":["Milan","Bergamo","Brescia","Monza","Como","Pavia","Varese","Lecco","Cremona"],"Lazio":["Rome","Latina","Frosinone","Civitavecchia","Viterbo","Rieti","Tivoli"],"Veneto":["Venice","Verona","Padua","Vicenza","Treviso","Rovigo","Belluno","Bassano del Grappa"],"Campania":["Naples","Salerno","Torre del Greco","Caserta","Giugliano","Pozzuoli","Afragola"],"Sicily":["Palermo","Catania","Messina","Syracuse","Marsala","Agrigento","Ragusa","Trapani"],"Piedmont":["Turin","Novara","Alessandria","Asti","Cuneo","Vercelli","Biella"],"Emilia-Romagna":["Bologna","Modena","Parma","Reggio Emilia","Ferrara","Ravenna","Rimini"],"Tuscany":["Florence","Pisa","Siena","Arezzo","Livorno","Prato","Grosseto","Lucca"] } },
  "Japan":            { code:"+81",  currency:"JPY – Japanese Yen",          states:{ "Tokyo":["Shinjuku","Shibuya","Minato","Chiyoda","Chuo","Taito","Sumida","Koto","Setagaya","Meguro"],"Osaka":["Osaka City","Sakai","Higashiosaka","Hirakata","Toyonaka","Suita","Takatsuki","Neyagawa"],"Kanagawa":["Yokohama","Kawasaki","Sagamihara","Fujisawa","Yokosuka","Hiratsuka","Kamakura"],"Aichi":["Nagoya","Toyohashi","Toyota","Okazaki","Ichinomiya","Seto","Kasugai","Komaki"],"Hokkaido":["Sapporo","Asahikawa","Hakodate","Kushiro","Obihiro","Tomakomai","Kitami","Muroran"],"Fukuoka":["Fukuoka City","Kitakyushu","Kurume","Omuta","Iizuka","Munakata","Kasuga","Onojo"],"Hyogo":["Kobe","Himeji","Amagasaki","Nishinomiya","Akashi","Kakogawa","Takarazuka"],"Saitama":["Saitama City","Kawaguchi","Kawagoe","Tokorozawa","Kasukabe","Ageo","Kumagaya"],"Chiba":["Chiba City","Funabashi","Matsudo","Kashiwa","Ichikawa","Narashino","Urayasu"],"Kyoto":["Kyoto City","Uji","Kyotanabe","Kizugawa","Muko","Nagaokakyo","Yawata"] } },
  "Jordan":           { code:"+962", currency:"JOD – Jordanian Dinar",       states:{ "Amman":["Amman City","Zarqa","Russeifa","Sahab","Na'ur","Al-Jubaih"],"Irbid":["Irbid City","Ar-Ramtha","Bani Kinana","Al-Kura","Al-Koura"],"Zarqa":["Zarqa City","Russeifa","Al-Hashimiyyah","Azraq","Dlail"],"Aqaba":["Aqaba City","Wadi Rum","Quweira","Ma'an"],"Mafraq":["Mafraq City","Bani Obaid","Al-Badiah","Housha","Rhab"] } },
  "Kazakhstan":       { code:"+7",   currency:"KZT – Kazakhstani Tenge",     states:{ "Almaty":["Almaty City","Medeu","Bostandyq","Turksib","Alatau","Nauryzbai"],"Nur-Sultan":["Nur-Sultan City","Saryarka","Almaty District","Baikonur","Esil"],"Shymkent":["Shymkent City","Al-Farabi","Abay","Karatau","En-bek"],"Karagandy":["Karagandy City","Temirtau","Balkhash","Zhezkazgan","Saran"],"East Kazakhstan":["Oskemen","Semey","Ridder","Zyryanovsky","Shemonaikha"] } },
  "Kenya":            { code:"+254", currency:"KES – Kenyan Shilling",       states:{ "Nairobi":["Nairobi City","Westlands","Kasarani","Embakasi","Langata","Dagoretti","Makadara","Starehe","Roysambu","Ruaraka"],"Mombasa":["Mombasa City","Mvita","Likoni","Changamwe","Nyali","Kisauni","Jomvu","Msambweni"],"Kisumu":["Kisumu City","Kisumu East","Kisumu West","Seme","Muhoroni","Nyando","Nyakach"],"Nakuru":["Nakuru City","Naivasha","Gilgil","Molo","Njoro","Rongai","Bahati","Subukia"],"Kiambu":["Thika","Ruiru","Githunguri","Kiambu Town","Limuru","Gatundu","Juja","Kikuyu"],"Machakos":["Machakos Town","Athi River","Kangundo","Mavoko","Matungulu","Yatta"],"Kajiado":["Kajiado Town","Ngong","Kitengela","Ongata Rongai","Namanga","Loitokitok"],"Uasin Gishu":["Eldoret","Turbo","Moiben","Ainabkoi","Soy","Kapseret","Kesses"] } },
  "Kuwait":           { code:"+965", currency:"KWD – Kuwaiti Dinar",         states:{ "Capital":["Kuwait City","Salmiya","Hawalli","Rumaithiya","Bayan","Salwa"],"Ahmadi":["Ahmadi City","Fahaheel","Fintas","Mangaf","Mahboula","Abu Halifa","Riqqa"],"Farwaniya":["Farwaniya City","Khaitan","Reggae","Ashbeliah","Abdullah Al-Mubarak","Sabah Al-Nasser"],"Jahra":["Jahra City","Sulaibiya","Naeem","Abdali","Oyoun","Kabd"],"Mubarak Al-Kabeer":["Mubarak Al-Kabeer City","Adan","Sabah Al-Salem","Qurain","Abu Fteira"] } },
  "Lebanon":          { code:"+961", currency:"LBP – Lebanese Pound",        states:{ "Beirut":["Beirut City","Ashrafieh","Hamra","Raouché","Verdun","Geitawi","Mar Elias"],"Mount Lebanon":["Jounieh","Baabda","Aley","Broummana","Metn","Byblos","Jdeideh"],"North Lebanon":["Tripoli","Zgharta","Bcharre","Koura","Minieh","Akkar","Batroun"],"South Lebanon":["Sidon","Tyre","Nabatieh","Bint Jbeil","Jezzine","Marjayoun"],"Bekaa":["Zahle","Baalbek","Chtaura","Anjar","Yohmor","Taalabaya"] } },
  "Libya":            { code:"+218", currency:"LYD – Libyan Dinar",          states:{ "Tripoli":["Tripoli City","Tajoura","Ain Zara","Janzur","Suwani","Qasr Ben Ghashir"],"Benghazi":["Benghazi City","Al-Sabri","Qwarsha","Sidi Khalifa","Gar Younis","Al-Lithi"],"Misrata":["Misrata City","Bani Walid","Zliten","Tawergha","Dafniyah"],"Sabha":["Sabha City","Murzuq","Ubari","Wadi Al-Hayaa","Al-Qatrun"],"Zawiya":["Zawiya City","Surman","Sabratha","Sabrata","Al-Ajaylat"] } },
  "Malaysia":         { code:"+60",  currency:"MYR – Malaysian Ringgit",     states:{ "Kuala Lumpur":["Kuala Lumpur City","Chow Kit","Brickfields","Bangsar","Cheras","Kepong","Wangsa Maju","Titiwangsa"],"Selangor":["Shah Alam","Petaling Jaya","Klang","Subang Jaya","Puchong","Ampang","Sepang","Kajang"],"Johor":["Johor Bahru","Muar","Batu Pahat","Kluang","Segamat","Kulai","Pontian","Mersing"],"Penang":["George Town","Butterworth","Bukit Mertajam","Bayan Lepas","Seberang Perai","Balik Pulau"],"Perak":["Ipoh","Taiping","Teluk Intan","Batu Gajah","Sitiawan","Slim River","Kuala Kangsar"],"Sabah":["Kota Kinabalu","Sandakan","Tawau","Lahad Datu","Keningau","Beaufort","Ranau"],"Sarawak":["Kuching","Miri","Sibu","Bintulu","Limbang","Sri Aman","Sarikei","Samarahan"] } },
  "Mexico":           { code:"+52",  currency:"MXN – Mexican Peso",          states:{ "Mexico City":["Cuauhtémoc","Iztapalapa","Gustavo A. Madero","Álvaro Obregón","Tlalpan","Coyoacán","Xochimilco"],"Jalisco":["Guadalajara","Zapopan","Tlaquepaque","Tonalá","Tlajomulco","Puerto Vallarta"],"Estado de México":["Ecatepec","Naucalpan","Nezahualcóyotl","Toluca","Tlalnepantla","Chimalhuacán"],"Nuevo León":["Monterrey","San Nicolás","Guadalupe","Apodaca","San Pedro Garza García","General Escobedo"],"Veracruz":["Veracruz City","Xalapa","Coatzacoalcos","Córdoba","Orizaba","Poza Rica","Minatitlán"],"Puebla":["Puebla City","Tehuacán","San Andrés Cholula","Atlixco","San Martín Texmelucan"],"Yucatán":["Mérida","Valladolid","Progreso","Kanasín","Uman","Motul","Tizimín"] } },
  "Morocco":          { code:"+212", currency:"MAD – Moroccan Dirham",       states:{ "Casablanca-Settat":["Casablanca","Mohammedia","El Jadida","Berrechid","Settat","Benslimane"],"Rabat-Salé-Kénitra":["Rabat","Salé","Kenitra","Témara","Skhirate","Sidi Kacem"],"Marrakech-Safi":["Marrakech","Safi","Essaouira","Kelaa des Sraghna","Chichaoua","Youssoufia"],"Fès-Meknès":["Fès","Meknès","Taza","Sefrou","Ifrane","El Hajeb","Taounate"],"Tanger-Tétouan-Al Hoceïma":["Tangier","Tétouan","Al Hoceïma","Larache","Asilah","Chefchaouen"] } },
  "Mozambique":       { code:"+258", currency:"MZN – Mozambican Metical",    states:{ "Maputo":["Maputo City","Matola","Boane","Namaacha","Matutuíne","Marracuene"],"Sofala":["Beira","Dondo","Búzi","Chibabava","Gorongosa","Nhamatanda","Machanga"],"Nampula":["Nampula City","Nacala","Angoche","Ilha de Moçambique","Monapo","Meconta"],"Zambézia":["Quelimane","Mocuba","Gurúè","Alto Molócuè","Milange","Lugela","Ile"],"Gaza":["Xai-Xai","Chókwè","Mandlakaze","Chibuto","Guijá","Massangena"] } },
  "Myanmar":          { code:"+95",  currency:"MMK – Myanmar Kyat",          states:{ "Yangon":["Yangon City","Hlaing","Tamwe","Insein","Mayangone","Thanlyin","Shwepyithar","Dagon"],"Mandalay":["Mandalay City","Pyin Oo Lwin","Meiktila","Nyaung-U","Pyigyitagon","Aungmyethazan"],"Sagaing":["Sagaing City","Monywa","Shwebo","Katha","Mawlaik","Pale","Kale"],"Bago":["Bago City","Pyay","Toungoo","Nyaunglebin","Daik-U","Gyobingauk"],"Ayeyarwady":["Pathein","Hinthada","Maubin","Myaungmya","Pyapon","Kyaiklat"] } },
  "Netherlands":      { code:"+31",  currency:"EUR – Euro",                  states:{ "North Holland":["Amsterdam","Haarlem","Alkmaar","Zaanstad","Amstelveen","Hoorn","Purmerend","Heerhugowaard"],"South Holland":["Rotterdam","The Hague","Leiden","Dordrecht","Zoetermeer","Delft","Westland","Gouda"],"Utrecht":["Utrecht City","Amersfoort","Veenendaal","Zeist","Nieuwegein","Houten","IJsselstein"],"North Brabant":["Eindhoven","Tilburg","Breda","Den Bosch","Helmond","Oss","Bergen op Zoom"],"Gelderland":["Nijmegen","Arnhem","Apeldoorn","Ede","Zutphen","Wageningen","Doetinchem"] } },
  "New Zealand":      { code:"+64",  currency:"NZD – New Zealand Dollar",    states:{ "Auckland":["Auckland City","Manukau","North Shore","Waitakere","Henderson","Papakura","Pukekohe","Warkworth"],"Wellington":["Wellington City","Lower Hutt","Upper Hutt","Porirua","Kapiti","Masterton"],"Canterbury":["Christchurch","Selwyn","Waimakariri","Ashburton","Timaru","Hurunui"],"Waikato":["Hamilton","Cambridge","Te Awamutu","Morrinsville","Huntly","Tokoroa","Thames"],"Bay of Plenty":["Tauranga","Rotorua","Whakatāne","Ōpōtiki","Kawerau","Katikati"] } },
  "Nigeria":          { code:"+234", currency:"NGN – Nigerian Naira",        states:{ "Lagos":["Ikeja","Victoria Island","Lekki","Surulere","Ikorodu","Badagry","Eti-Osa","Agege","Alimosho","Ajeromi-Ifelodun","Apapa","Lagos Island","Lagos Mainland","Mushin","Oshodi-Isolo","Shomolu","Ifako-Ijaye","Kosofe","Somolu","Ojo"],"Abuja (FCT)":["Garki","Wuse","Maitama","Asokoro","Gwarinpa","Kubwa","Kuje","Bwari","Gwagwalada","Abaji","Kwali"],"Rivers":["Port Harcourt","Obio-Akpor","Eleme","Ikwerre","Oyigbo","Etche","Tai","Ogu-Bolo","Okrika","Asari-Toru"],"Kano":["Kano Municipal","Fagge","Dala","Gwale","Tarauni","Nasarawa","Kumbotso","Ungogo","Dawakin Tofa","Tofa"],"Oyo":["Ibadan North","Ibadan South-East","Egbeda","Oluyole","Akinyele","Lagelu","Ona Ara","Afijio","Ibarapa East","Atiba"],"Anambra":["Awka","Onitsha","Nnewi","Ekwusigo","Ogbaru","Aguata","Anaocha","Awka South","Idemili North","Idemili South"],"Kaduna":["Kaduna North","Kaduna South","Chikun","Igabi","Zaria","Sabon Gari","Giwa","Kubau","Makarfi","Soba"],"Delta":["Asaba","Warri","Ughelli","Sapele","Uvwie","Oshimili South","Oshimili North","Ndokwa East","Ndokwa West","Ethiope East"],"Enugu":["Enugu East","Enugu North","Enugu South","Igbo-Eze North","Igbo-Eze South","Udi","Nkanu East","Nkanu West","Oji River","Igbo-Etiti"],"Cross River":["Calabar Municipal","Calabar South","Odukpani","Ogoja","Bekwarra","Obudu","Abi","Akamkpa","Bakassi","Etung"],"Benue":["Makurdi","Gboko","Otukpo","Katsina-Ala","Vandeikya","Gwer West","Gwer East","Logo","Ushongo","Tarka"],"Plateau":["Jos North","Jos South","Mangu","Barkin Ladi","Bokkos","Riyom","Bassa","Kanke","Pankshin","Kanam"],"Akwa Ibom":["Uyo","Ikot Ekpene","Eket","Abak","Oron","Essien Udim","Ibiono-Ibom","Ibesikpo-Asutan","Itu","Nsit-Ubium"],"Imo":["Owerri Municipal","Owerri North","Owerri West","Orlu","Okigwe","Ideato North","Ideato South","Mbaitoli","Ngor-Okpala","Obowo"],"Ogun":["Abeokuta North","Abeokuta South","Ijebu Ode","Sagamu","Ota","Ilaro","Ifo","Ewekoro","Odeda","Obafemi-Owode"],"Ondo":["Akure South","Akure North","Ondo City","Owo","Ikare","Ifedore","Idanre","Odigbo","Ile-Oluji","Okitipupa"],"Osun":["Osogbo","Ilesa","Ile-Ife","Ede","Iwo","Ikirun","Ejigbo","Inisa","Ila-Orangun","Ipetumodu"],"Ekiti":["Ado-Ekiti","Efon-Alaaye","Ikere","Ikole","Ijero","Aramoko","Emure","Ilawe","Ise/Orun","Gbonyin"],"Kwara":["Ilorin East","Ilorin West","Ilorin South","Offa","Oke-Ero","Moro","Ekiti","Kaiama","Baruten","Asa"],"Niger":["Minna","Bida","Suleja","Kontagora","Lapai","Gbako","Lavun","Shiroro","Rafi","Wushishi"],"Kebbi":["Birnin Kebbi","Argungu","Yauri","Koko-Besse","Bagudo","Danko-Wasagu","Gwandu","Jega","Kalgo","Maiyama"],"Sokoto":["Sokoto North","Sokoto South","Wamakko","Wurno","Gudu","Goronyo","Illela","Isa","Kware","Rabah"],"Zamfara":["Gusau","Zurmi","Birnin Magaji","Anka","Bakura","Bungudu","Gummi","Kaura Namoda","Maradun","Maru"],"Katsina":["Katsina City","Daura","Funtua","Malumfashi","Jibia","Batagarawa","Bindawa","Charanchi","Dandume","Danja"],"Jigawa":["Dutse","Hadejia","Gumel","Birnin Kudu","Kazaure","Ringim","Garki","Auyo","Babura","Buji"],"Bauchi":["Bauchi City","Azare","Misau","Katagum","Jama'are","Ningi","Tafawa Balewa","Ganjuwa","Alkaleri","Bogoro"],"Gombe":["Gombe City","Kaltungo","Deba","Funakaye","Balanga","Billiri","Nafada","Kwami","Shongom","Yamaltu-Deba"],"Taraba":["Jalingo","Wukari","Bali","Takum","Gembu","Ardo Kola","Donga","Gassol","Ibi","Karim-Lamido"],"Adamawa":["Yola North","Yola South","Jimeta","Mubi North","Mubi South","Numan","Ganye","Gombi","Demsa","Guyuk"],"Borno":["Maiduguri","Jere","Biu","Dikwa","Damboa","Bama","Gwoza","Kala/Balge","Kukawa","Magumeri"],"Yobe":["Damaturu","Nguru","Potiskum","Gashua","Geidam","Bade","Nangere","Machina","Jakusko","Gujba"],"Nassarawa":["Lafia","Keffi","Akwanga","Nasarawa","Nasarawa-Eggon","Doma","Keana","Kokona","Obi","Toto"],"Kogi":["Lokoja","Ankpa","Ajaokuta","Idah","Okene","Ofu","Igalamela-Odolu","Ibaji","Bassa","Olamaboro"],"Ebonyi":["Abakaliki","Afikpo North","Afikpo South","Ezza North","Ezza South","Ikwo","Ishielu","Ivo","Izzi","Ohaozara"] } },
  "Norway":           { code:"+47",  currency:"NOK – Norwegian Krone",       states:{ "Oslo":["Oslo City","Grünerløkka","Frogner","St. Hanshaugen","Sagene","Gamle Oslo","Nordstrand","Bjerke"],"Viken":["Drammen","Fredrikstad","Sarpsborg","Lillestrøm","Moss","Kongsberg","Halden","Ski"],"Innlandet":["Hamar","Lillehammer","Elverum","Gjøvik","Ringsaker","Brumunddal","Moelv"],"Vestland":["Bergen","Askøy","Fjell","Lindås","Stord","Voss","Odda","Austevoll"],"Trøndelag":["Trondheim","Steinkjer","Stjørdal","Levanger","Verdal","Orkanger","Namsos"] } },
  "Pakistan":         { code:"+92",  currency:"PKR – Pakistani Rupee",       states:{ "Punjab":["Lahore","Faisalabad","Rawalpindi","Gujranwala","Multan","Sialkot","Bahawalpur","Sargodha","Sheikhupura","Jhang"],"Sindh":["Karachi","Hyderabad","Sukkur","Larkana","Nawabshah","Jacobabad","Mirpur Khas","Khairpur"],"Khyber Pakhtunkhwa":["Peshawar","Mardan","Mingora","Kohat","Dera Ismail Khan","Abbottabad","Mansehra","Bannu"],"Balochistan":["Quetta","Turbat","Khuzdar","Chaman","Gwadar","Hub","Dera Murad Jamali","Kharan"],"Islamabad":["Islamabad City","G-10","F-7","I-8","E-7","G-6","F-8","G-11","H-8","Blue Area"] } },
  "Peru":             { code:"+51",  currency:"PEN – Peruvian Sol",          states:{ "Lima":["Lima City","Miraflores","San Isidro","Surco","La Molina","San Borja","Barranco","Lince"],"Arequipa":["Arequipa City","Cayma","Cerro Colorado","Sachaca","Paucarpata","Mariano Melgar"],"La Libertad":["Trujillo","Víctor Larco Herrera","El Porvenir","Florencia de Mora","Huanchaco"],"Piura":["Piura City","Castilla","Sullana","Talara","Paita","Sechura","Catacaos"],"Cusco":["Cusco City","San Sebastián","San Jerónimo","Wanchaq","Santiago","Ccorca","Poroy"] } },
  "Philippines":      { code:"+63",  currency:"PHP – Philippine Peso",       states:{ "Metro Manila":["Manila","Quezon City","Makati","Pasig","Taguig","Caloocan","Parañaque","Las Piñas","Muntinlupa","Marikina"],"Cebu":["Cebu City","Mandaue","Lapu-Lapu","Talisay","Danao","Carcar","Toledo","Minglanilla"],"Davao":["Davao City","Tagum","Panabo","Digos","Mati","Samal","Nabunturan","Maco"],"Bulacan":["Malolos","Meycauayan","San Jose del Monte","Calumpit","Baliwag","Pulilan","Marilao"],"Pampanga":["San Fernando","Angeles","Mabalacat","Guagua","Lubao","Porac","Mexico"] } },
  "Poland":           { code:"+48",  currency:"PLN – Polish Zloty",          states:{ "Masovian":["Warsaw","Radom","Płock","Siedlce","Ostrołęka","Ciechanów","Żyrardów","Legionowo"],"Silesian":["Katowice","Częstochowa","Sosnowiec","Gliwice","Zabrze","Bytom","Ruda Śląska","Tychy"],"Lesser Poland":["Kraków","Tarnów","Nowy Sącz","Oświęcim","Zakopane","Wieliczka","Olkusz"],"Greater Poland":["Poznań","Kalisz","Gniezno","Konin","Piła","Ostrów Wielkopolski","Leszno"],"Lower Silesian":["Wrocław","Legnica","Wałbrzych","Jelenia Góra","Lubin","Świdnica","Bolesławiec"] } },
  "Portugal":         { code:"+351", currency:"EUR – Euro",                  states:{ "Lisbon":["Lisbon City","Sintra","Amadora","Almada","Seixal","Cascais","Loures","Oeiras","Setúbal"],"Porto":["Porto City","Gaia","Braga","Matosinhos","Gondomar","Maia","Valongo","Santa Maria da Feira"],"Algarve":["Faro","Portimão","Loulé","Silves","Lagoa","Tavira","Olhão","Lagos","Albufeira"],"Centro":["Coimbra","Leiria","Aveiro","Viseu","Guarda","Castelo Branco","Covilhã","Fundão"],"Alentejo":["Évora","Beja","Portalegre","Elvas","Santiago do Cacém","Montijo","Moura"] } },
  "Qatar":            { code:"+974", currency:"QAR – Qatari Riyal",          states:{ "Doha":["Doha City","Al Wakrah","Al Khor","Lusail","The Pearl","West Bay","Al Sadd","Rayyan"],"Al Rayyan":["Al Rayyan City","Umm Salal","Al Daayen","Ash Shamal","Al Shahaniya"],"Ash Shamal":["Ash Shamal City","Al Zubarah","Al Ruwais","Madinat Al Shamal"],"Al Wakrah":["Al Wakrah City","Al Wukair","Barwa City","Mesaieed"],"Umm Salal":["Umm Salal Ali","Umm Salal Mohammad","Al Kharaitiyat"] } },
  "Romania":          { code:"+40",  currency:"RON – Romanian Leu",          states:{ "Bucharest":["Bucharest City","Sector 1","Sector 2","Sector 3","Sector 4","Sector 5","Sector 6"],"Cluj":["Cluj-Napoca","Dej","Turda","Câmpia Turzii","Gherla","Huedin","Zalău"],"Iași":["Iași City","Pașcani","Hârlău","Târgu Frumos","Răducăneni","Ungheni"],"Constanța":["Constanța City","Mangalia","Medgidia","Năvodari","Cernavodă","Eforie","Ovidiu"],"Prahova":["Ploiești","Câmpina","Azuga","Bușteni","Sinaia","Breaza","Comarnic"] } },
  "Russia":           { code:"+7",   currency:"RUB – Russian Ruble",         states:{ "Moscow":["Moscow City","Zelenograd","Troitsk","Shcherbinka","Moskovsky","Butovo","Lyubertsy","Khimki"],"Saint Petersburg":["Saint Petersburg City","Peterhof","Kolpino","Pushkin","Kronstadt","Pavlovsk","Lomonosov"],"Novosibirsk Oblast":["Novosibirsk","Berdsk","Ob","Iskitim","Kuybyshev","Karasuk","Tatarsk"],"Sverdlovsk Oblast":["Yekaterinburg","Nizhny Tagil","Kamensk-Uralsky","Pervouralsk","Serov","Berezovsky"],"Tatarstan":["Kazan","Naberezhnye Chelny","Nizhnekamsk","Almetyevsk","Zelenodolsk","Bugulma"] } },
  "Saudi Arabia":     { code:"+966", currency:"SAR – Saudi Riyal",           states:{ "Riyadh":["Riyadh City","Diriyah","Al Kharj","Hawtat Bani Tamim","Hawtah","Dawadmi","Al-Muzahimiyah"],"Makkah":["Mecca","Jeddah","Taif","Rabigh","Al Jumum","Khulais","Al-Qunfudhah"],"Medina":["Medina City","Yanbu","Al Ula","Badr","Khaybar","Al-Mahd","Hail"],"Eastern Province":["Dammam","Al Khobar","Dhahran","Jubail","Qatif","Hofuf","Mubarraz","Abqaiq"],"Asir":["Abha","Khamis Mushait","Bisha","Muhayil","Sarat Abidah","Al Namas","Rijal Almaa"],"Tabuk":["Tabuk City","Al Wajh","Umluj","Duba","Haql","Tayma","Al Bad"],"Qassim":["Buraydah","Unaizah","Ar Rass","Al Muthnab","Dilam","Uyun Al Jiwa"] } },
  "Senegal":          { code:"+221", currency:"XOF – West African CFA",      states:{ "Dakar":["Dakar City","Pikine","Guédiawaye","Rufisque","Bargny","Diamniadio","Sangalkam"],"Thiès":["Thiès City","Mbour","Tivaouane","Joal-Fadiouth","Popenguine","Saly","Khombole"],"Saint-Louis":["Saint-Louis City","Dagana","Podor","Richard-Toll","Ndioum","Matam"],"Ziguinchor":["Ziguinchor City","Bignona","Oussouye","Cap Skirring","Diouloulou"],"Diourbel":["Diourbel City","Bambey","Touba","Mbacké","Ndame","Ngoye"] } },
  "Singapore":        { code:"+65",  currency:"SGD – Singapore Dollar",      states:{ "Central Region":["Downtown Core","Orchard","Rochor","Outram","Marina South","Straits View","Museum"],"East Region":["Bedok","Tampines","Pasir Ris","Geylang","Kallang","Marine Parade","Changi"],"North Region":["Woodlands","Yishun","Sembawang","Mandai","Simpang","Sungei Kadut"],"North-East Region":["Hougang","Punggol","Sengkang","Serangoon","Ang Mo Kio","Bishan","Toa Payoh"],"West Region":["Clementi","Jurong East","Buona Vista","Boon Lay","Jurong West","Choa Chu Kang","Bukit Batok"] } },
  "South Africa":     { code:"+27",  currency:"ZAR – South African Rand",    states:{ "Gauteng":["Johannesburg","Pretoria","Ekurhuleni","Tshwane","Soweto","Centurion","Midrand","Randburg","Sandton","Roodepoort"],"Western Cape":["Cape Town","Stellenbosch","George","Paarl","Worcester","Knysna","Hermanus","Mossel Bay","Franschhoek"],"KwaZulu-Natal":["Durban","Pietermaritzburg","Richards Bay","Newcastle","Port Shepstone","Umhlanga","Ballito","Tongaat"],"Eastern Cape":["Port Elizabeth","East London","Mthatha","Queenstown","Grahamstown","King William's Town","Uitenhage"],"Free State":["Bloemfontein","Welkom","Bethlehem","Botshabelo","Kroonstad","Sasolburg","Phuthaditjhaba"],"Limpopo":["Polokwane","Mokopane","Thohoyandou","Tzaneen","Louis Trichardt","Bela-Bela","Giyani"],"Mpumalanga":["Nelspruit","Witbank","Middelburg","Secunda","Barberton","White River","Lydenburg"],"North West":["Rustenburg","Mahikeng","Klerksdorp","Potchefstroom","Brits","Orkney","Lichtenburg"],"Northern Cape":["Kimberley","Upington","Springbok","Kuruman","De Aar","Colesberg","Prieska"] } },
  "South Korea":      { code:"+82",  currency:"KRW – South Korean Won",      states:{ "Seoul":["Gangnam","Mapo","Jongno","Jung","Nowon","Dobong","Songpa","Seodaemun","Gwangjin","Seongbuk"],"Busan":["Haeundae","Nam","Dong","Buk","Seo","Jung","Yeonje","Saha","Gangseo","Sasang"],"Incheon":["Namdong","Bupyeong","Seo","Nam","Dong","Jung","Gyeyang","Michuhol","Yeonsu"],"Gyeonggi":["Suwon","Seongnam","Bucheon","Goyang","Ansan","Anyang","Yongin","Hwaseong","Namyangju"],"Daegu":["Jung","Nam","Dong","Buk","Seo","Suseong","Dalseo","Dalseong"] } },
  "Spain":            { code:"+34",  currency:"EUR – Euro",                  states:{ "Community of Madrid":["Madrid","Móstoles","Alcalá de Henares","Fuenlabrada","Leganés","Getafe","Alcorcón","Torrejón de Ardoz"],"Catalonia":["Barcelona","Hospitalet","Badalona","Terrassa","Sabadell","Mataró","Santa Coloma de Gramenet","Reus"],"Andalusia":["Seville","Málaga","Córdoba","Granada","Almería","Huelva","Cádiz","Jerez de la Frontera","Algeciras"],"Valencia":["Valencia","Alicante","Elche","Castellón","Torrevieja","Gandía","Benidorm"],"Basque Country":["Bilbao","San Sebastián","Vitoria-Gasteiz","Barakaldo","Getxo","Irún","Santurtzi"],"Galicia":["Vigo","A Coruña","Santiago de Compostela","Pontevedra","Lugo","Ourense","Ferrol"] } },
  "Sri Lanka":        { code:"+94",  currency:"LKR – Sri Lankan Rupee",      states:{ "Western":["Colombo","Sri Jayawardenepura Kotte","Dehiwala","Moratuwa","Kelaniya","Negombo","Gampaha"],"Central":["Kandy","Matale","Nuwara Eliya","Dambulla","Digana","Nawalapitiya"],"Southern":["Galle","Matara","Hambantota","Tangalle","Ambalangoda","Hikkaduwa"],"Northern":["Jaffna","Vavuniya","Mannar","Kilinochchi","Mullaitivu","Paranthan"],"Eastern":["Trincomalee","Batticaloa","Ampara","Kalmunai","Valaichchenai","Chenkaladi"] } },
  "Sudan":            { code:"+249", currency:"SDG – Sudanese Pound",        states:{ "Khartoum":["Khartoum City","Omdurman","Khartoum North","Bahri","Jebel Aulia","Soba"],"Darfur":["El Fasher","Nyala","El Geneina","Ed Daein","Zalingei","Garsila"],"Kordofan":["Al-Obeid","Kadugli","Dilling","Rashad","Al-Nahud","Umm Rawaba"],"Kassala":["Kassala City","New Halfa","Khashm el-Girba","Port Sudan","Haiya"],"Gezira":["Wad Madani","Managil","Rufaa","Hasaheissa","Al-Lagowa","Sinja"] } },
  "Sweden":           { code:"+46",  currency:"SEK – Swedish Krona",         states:{ "Stockholm":["Stockholm City","Södertälje","Nacka","Tyresö","Haninge","Huddinge","Botkyrka","Sollentuna"],"Västra Götaland":["Gothenburg","Borås","Mölndal","Trollhättan","Skövde","Lidköping","Alingsås"],"Skåne":["Malmö","Helsingborg","Lund","Kristianstad","Landskrona","Hässleholm","Ystad"],"Östergötland":["Linköping","Norrköping","Motala","Mjölby","Söderköping","Kinda","Ödeshög"],"Uppsala":["Uppsala City","Enköping","Håbo","Knivsta","Tierp","Östhammar","Älvkarleby"] } },
  "Switzerland":      { code:"+41",  currency:"CHF – Swiss Franc",           states:{ "Zurich":["Zurich City","Winterthur","Uster","Dübendorf","Regensdorf","Kloten","Dietikon","Horgen"],"Bern":["Bern City","Biel/Bienne","Thun","Köniz","Langenthal","Burgdorf","Ostermundigen"],"Vaud":["Lausanne","Yverdon-les-Bains","Montreux","Renens","Nyon","Prilly","Morges"],"Geneva":["Geneva City","Carouge","Lancy","Onex","Thônex","Meyrin","Vernier","Plan-les-Ouates"],"Basel-Stadt":["Basel City","Riehen","Bettingen"] } },
  "Syria":            { code:"+963", currency:"SYP – Syrian Pound",          states:{ "Damascus":["Damascus City","Kafr Sousa","Mezzeh","Bab Touma","Al-Midan","Jobar","Qaboun"],"Aleppo":["Aleppo City","Al-Bab","Azaz","Afrin","Manbij","Jarabulus","Al-Atarib"],"Latakia":["Latakia City","Jableh","Al-Haffah","Qardaha","Kassab","Slunfeh"],"Homs":["Homs City","Palmyra","Talbiseh","Al-Rastan","Qusayr","Al-Mukharram"],"Hama":["Hama City","Mhardeh","Salamiyah","Suqaylabiyah","Kafr Nabudah"] } },
  "Tanzania":         { code:"+255", currency:"TZS – Tanzanian Shilling",    states:{ "Dar es Salaam":["Kinondoni","Ilala","Temeke","Ubungo","Kigamboni","Goba","Msasani","Kawe"],"Mwanza":["Ilemela","Nyamagana","Sengerema","Kwimba","Geita","Magu","Misungwi"],"Arusha":["Arusha City","Moshi","Monduli","Arumeru","Karatu","Ngorongoro","Longido"],"Mbeya":["Mbeya City","Chunya","Mbarali","Kyela","Rungwe","Ileje","Mbozi"],"Dodoma":["Dodoma City","Kondoa","Kongwa","Mpwapwa","Bahi","Chamwino","Chemba"] } },
  "Thailand":         { code:"+66",  currency:"THB – Thai Baht",             states:{ "Bangkok":["Bangkok City","Chatuchak","Huai Khwang","Lat Phrao","Bang Kapi","Don Mueang","Sai Mai","Lak Si"],"Chiang Mai":["Chiang Mai City","Doi Saket","Mae Rim","San Kamphaeng","Hang Dong","Mae Taeng"],"Nonthaburi":["Nonthaburi City","Bang Bua Thong","Pak Kret","Pakkred","Bang Yai"],"Samut Prakan":["Mueang Samut Prakan","Phra Pradaeng","Bang Phli","Bang Bo","Phra Samut Chedi"],"Pathum Thani":["Mueang Pathum Thani","Khlong Luang","Lam Luk Ka","Thanyaburi","Sam Khok"] } },
  "Tunisia":          { code:"+216", currency:"TND – Tunisian Dinar",        states:{ "Tunis":["Tunis City","La Marsa","Ariana","Marsa","Carthage","Le Bardo","La Soukra"],"Sfax":["Sfax City","Sakiet Ezzit","Thyna","Sakiet Eddaier","El Ain","Kerkennah"],"Sousse":["Sousse City","Hammam Sousse","Kalaa Kebira","Akouda","Kondar","Msaken"],"Nabeul":["Nabeul City","Hammamet","Korba","Mornag","Kelibia","Beni Khalled","Soliman"],"Bizerte":["Bizerte City","Menzel Bourguiba","Mateur","Joumine","Ras Jebel","Rhar El Melah"] } },
  "Turkey":           { code:"+90",  currency:"TRY – Turkish Lira",          states:{ "Istanbul":["Fatih","Beyoğlu","Kadıköy","Üsküdar","Beşiktaş","Bağcılar","Bahçelievler","Pendik","Ümraniye","Kartal"],"Ankara":["Çankaya","Keçiören","Mamak","Yenimahalle","Etimesgut","Altındağ","Pursaklar","Gölbaşı"],"İzmir":["Konak","Bornova","Buca","Karşıyaka","Karabağlar","Bayraklı","Gaziemir","Çiğli"],"Bursa":["Osmangazi","Nilüfer","Yıldırım","Görükle","Kestel","İnegöl","Gemlik","Mustafakemalpaşa"],"Antalya":["Muratpaşa","Konyaaltı","Kepez","Alanya","Manavgat","Serik","Döşemealtı","Aksu"] } },
  "Uganda":           { code:"+256", currency:"UGX – Ugandan Shilling",      states:{ "Central":["Kampala","Wakiso","Mukono","Luwero","Masaka","Mpigi","Buikwe","Gomba"],"Eastern":["Jinja","Mbale","Soroti","Iganga","Tororo","Bugiri","Busia","Kapchorwa"],"Northern":["Gulu","Lira","Arua","Nebbi","Adjumani","Apac","Kitgum","Pader"],"Western":["Mbarara","Kasese","Kabale","Bushenyi","Hoima","Masindi","Kamwenge","Kyenjojo"] } },
  "Ukraine":          { code:"+380", currency:"UAH – Ukrainian Hryvnia",     states:{ "Kyiv":["Kyiv City","Boryspil","Brovary","Bucha","Irpin","Vasylkiv","Baryshivka","Boyarka"],"Kharkiv":["Kharkiv City","Lozova","Chuhuiv","Izium","Balakliya","Pervomaisk","Kupiansk"],"Dnipropetrovsk":["Dnipro","Kryvyi Rih","Kamianske","Nikopol","Pavlohrad","Verkhnodniprovsk"],"Odessa":["Odessa City","Chornomorsk","Bilhorod-Dnistrovskyi","Izmayil","Uman","Tulchyn"],"Lviv":["Lviv City","Drohobych","Stryi","Boryslav","Chervonograd","Morshyn","Truskavets"] } },
  "United Arab Emirates": { code:"+971", currency:"AED – UAE Dirham",        states:{ "Dubai":["Deira","Bur Dubai","Jumeirah","Downtown Dubai","Business Bay","Al Quoz","Mirdif","Jumeirah Village Circle","Dubai Marina","Palm Jumeirah"],"Abu Dhabi":["Abu Dhabi City","Al Ain","Khalifa City","Mohammed Bin Zayed City","Musaffah","Al Reef","Al Reem Island"],"Sharjah":["Sharjah City","Al Qasimia","Al Nahda","Al Majaz","Al Taawun","Industrial Area","Muwailih"],"Ajman":["Ajman City","Al Nuaimia","Al Rashidiya","Al Jurf","Al Hamidiyah","Al Mwaihat"],"Ras Al Khaimah":["Ras Al Khaimah City","Al Hamra","Khuzam","Dafan","Al Marjan Island"] } },
  "United Kingdom":   { code:"+44",  currency:"GBP – British Pound",         states:{ "England":["London","Manchester","Birmingham","Leeds","Liverpool","Sheffield","Bristol","Bradford","Newcastle","Nottingham","Leicester","Plymouth","Stoke-on-Trent","Wolverhampton","Derby","Coventry","Reading","Kingston upon Hull","Southampton","Luton"],"Scotland":["Edinburgh","Glasgow","Aberdeen","Dundee","Inverness","Stirling","Perth","Kilmarnock","Livingston","Paisley"],"Wales":["Cardiff","Swansea","Newport","Wrexham","Neath","Barry","Bridgend","Cwmbran","Caerphilly","Rhondda"],"Northern Ireland":["Belfast","Derry","Lisburn","Newtownabbey","Armagh","Bangor","Craigavon","Ballymena","Antrim"] } },
  "United States":    { code:"+1",   currency:"USD – US Dollar",             states:{ "Alabama":["Birmingham","Montgomery","Huntsville","Mobile","Tuscaloosa","Hoover","Dothan","Auburn"],"Alaska":["Anchorage","Fairbanks","Juneau","Sitka","Ketchikan","Kenai","Kodiak","Bethel"],"Arizona":["Phoenix","Tucson","Mesa","Chandler","Scottsdale","Gilbert","Glendale","Tempe","Peoria","Surprise"],"Arkansas":["Little Rock","Fort Smith","Fayetteville","Springdale","Jonesboro","Conway","Rogers","Bentonville"],"California":["Los Angeles","San Diego","San Jose","San Francisco","Fresno","Sacramento","Long Beach","Oakland","Bakersfield","Anaheim","Santa Ana","Riverside","Stockton","Chula Vista","Irvine"],"Colorado":["Denver","Colorado Springs","Aurora","Fort Collins","Lakewood","Thornton","Arvada","Westminster","Pueblo","Boulder"],"Connecticut":["Bridgeport","New Haven","Stamford","Hartford","Waterbury","Norwalk","Danbury","New Britain"],"Delaware":["Wilmington","Dover","Newark","Middletown","Smyrna","Milford","Seaford","Georgetown"],"Florida":["Jacksonville","Miami","Tampa","Orlando","St. Petersburg","Hialeah","Tallahassee","Fort Lauderdale","Port St. Lucie","Cape Coral","Pembroke Pines","Hollywood","Miramar","Gainesville"],"Georgia":["Atlanta","Columbus","Augusta","Macon","Savannah","Athens","Sandy Springs","Roswell","Albany","Warner Robins"],"Hawaii":["Honolulu","East Honolulu","Pearl City","Hilo","Kailua","Waipahu","Kaneohe","Mililani Town"],"Idaho":["Boise","Nampa","Meridian","Idaho Falls","Pocatello","Caldwell","Coeur d'Alene","Twin Falls"],"Illinois":["Chicago","Aurora","Joliet","Rockford","Springfield","Naperville","Peoria","Elgin","Waukegan","Champaign"],"Indiana":["Indianapolis","Fort Wayne","Evansville","South Bend","Carmel","Fishers","Bloomington","Hammond","Gary","Muncie"],"Iowa":["Des Moines","Cedar Rapids","Davenport","Sioux City","Iowa City","Waterloo","Council Bluffs","Dubuque"],"Kansas":["Wichita","Overland Park","Kansas City","Olathe","Topeka","Lawrence","Shawnee","Lenexa"],"Kentucky":["Louisville","Lexington","Bowling Green","Owensboro","Covington","Richmond","Georgetown","Florence"],"Louisiana":["New Orleans","Baton Rouge","Shreveport","Metairie","Lafayette","Lake Charles","Kenner","Bossier City"],"Maine":["Portland","Lewiston","Bangor","South Portland","Auburn","Biddeford","Sanford","Saco"],"Maryland":["Baltimore","Frederick","Rockville","Gaithersburg","Bowie","Hagerstown","Annapolis","College Park"],"Massachusetts":["Boston","Worcester","Springfield","Lowell","Cambridge","New Bedford","Brockton","Quincy","Lynn","Fall River"],"Michigan":["Detroit","Grand Rapids","Warren","Sterling Heights","Ann Arbor","Lansing","Flint","Dearborn","Livonia","Clinton"],"Minnesota":["Minneapolis","Saint Paul","Rochester","Duluth","Bloomington","Brooklyn Park","Plymouth","Saint Cloud"],"Mississippi":["Jackson","Gulfport","Southaven","Hattiesburg","Biloxi","Meridian","Tupelo","Greenville"],"Missouri":["Kansas City","Saint Louis","Springfield","Columbia","Independence","Lee's Summit","O'Fallon","St. Joseph"],"Montana":["Billings","Missoula","Great Falls","Bozeman","Butte","Helena","Kalispell","Havre"],"Nebraska":["Omaha","Lincoln","Bellevue","Grand Island","Kearney","Fremont","Hastings","North Platte"],"Nevada":["Las Vegas","Henderson","Reno","North Las Vegas","Sparks","Carson City","Fernley","Elko"],"New Hampshire":["Manchester","Nashua","Concord","Derry","Dover","Rochester","Salem","Merrimack"],"New Jersey":["Newark","Jersey City","Paterson","Elizabeth","Edison","Woodbridge","Lakewood","Toms River","Hamilton","Trenton"],"New Mexico":["Albuquerque","Las Cruces","Rio Rancho","Santa Fe","Roswell","Farmington","Clovis","Hobbs"],"New York":["New York City","Buffalo","Rochester","Yonkers","Syracuse","Albany","New Rochelle","Mount Vernon","Schenectady","Utica"],"North Carolina":["Charlotte","Raleigh","Greensboro","Durham","Winston-Salem","Fayetteville","Cary","Wilmington","High Point","Concord"],"North Dakota":["Fargo","Bismarck","Grand Forks","Minot","West Fargo","Williston","Dickinson","Mandan"],"Ohio":["Columbus","Cleveland","Cincinnati","Toledo","Akron","Dayton","Parma","Canton","Youngstown","Lorain"],"Oklahoma":["Oklahoma City","Tulsa","Norman","Broken Arrow","Lawton","Edmond","Moore","Midwest City"],"Oregon":["Portland","Salem","Eugene","Gresham","Hillsboro","Beaverton","Bend","Medford","Springfield","Corvallis"],"Pennsylvania":["Philadelphia","Pittsburgh","Allentown","Erie","Reading","Scranton","Bethlehem","Lancaster","Harrisburg","Altoona"],"Rhode Island":["Providence","Cranston","Warwick","Pawtucket","East Providence","Woonsocket","Coventry","North Providence"],"South Carolina":["Columbia","Charleston","North Charleston","Mount Pleasant","Rock Hill","Greenville","Summerville","Goose Creek"],"South Dakota":["Sioux Falls","Rapid City","Aberdeen","Brookings","Watertown","Mitchell","Yankton","Pierre"],"Tennessee":["Nashville","Memphis","Knoxville","Chattanooga","Clarksville","Murfreesboro","Franklin","Johnson City"],"Texas":["Houston","San Antonio","Dallas","Austin","Fort Worth","El Paso","Arlington","Corpus Christi","Plano","Laredo","Lubbock","Garland","Irving","Amarillo","Grand Prairie","Frisco","McKinney","Brownsville","Pasadena","Killeen"],"Utah":["Salt Lake City","West Valley City","Provo","West Jordan","Orem","Sandy","Ogden","St. George","Layton","South Jordan"],"Vermont":["Burlington","South Burlington","Rutland","Barre","Montpelier","Winooski","St. Albans","Newport"],"Virginia":["Virginia Beach","Norfolk","Chesapeake","Richmond","Newport News","Alexandria","Hampton","Roanoke","Portsmouth","Suffolk"],"Washington":["Seattle","Spokane","Tacoma","Vancouver","Bellevue","Kent","Everett","Renton","Spokane Valley","Federal Way"],"West Virginia":["Charleston","Huntington","Parkersburg","Morgantown","Wheeling","Weirton","Fairmont","Martinsburg"],"Wisconsin":["Milwaukee","Madison","Green Bay","Kenosha","Racine","Appleton","Waukesha","Oshkosh","Eau Claire","Janesville"],"Wyoming":["Cheyenne","Casper","Laramie","Gillette","Rock Springs","Sheridan","Green River","Evanston"] } },
  "Venezuela":        { code:"+58",  currency:"VES – Venezuelan Bolívar",    states:{ "Capital District":["Caracas","Petare","El Hatillo","Baruta","Chacao"],"Zulia":["Maracaibo","Cabimas","Ciudad Ojeda","Lagunillas","Machiques","San Francisco"],"Miranda":["Los Teques","Guarenas","Guatire","Petare","Charallave","Ocumare del Tuy"],"Carabobo":["Valencia","Maracay","Güigüe","Puerto Cabello","San Diego","Naguanagua"],"Aragua":["Maracay","Villa de Cura","Palo Negro","Turmero","La Victoria","Cagua"] } },
  "Vietnam":          { code:"+84",  currency:"VND – Vietnamese Dong",       states:{ "Hanoi":["Hoan Kiem","Dong Da","Ba Dinh","Hai Ba Trung","Thanh Xuan","Cau Giay","Hoang Mai","Long Bien","Tay Ho","Nam Tu Liem"],"Ho Chi Minh City":["District 1","Binh Thanh","Tan Binh","Go Vap","Thu Duc","Binh Duong","Tan Phu","Phu Nhuan","District 3","District 5"],"Da Nang":["Hai Chau","Thanh Khe","Son Tra","Lien Chieu","Ngu Hanh Son","Cam Le","Hoa Vang"],"Can Tho":["Ninh Kieu","Binh Thuy","Cai Rang","O Mon","Thot Not","Phong Dien","Co Do"],"Hai Phong":["Hong Bang","Ngo Quyen","Le Chan","Hai An","Kien An","Do Son","Duong Kinh"] } },
  "Yemen":            { code:"+967", currency:"YER – Yemeni Rial",           states:{ "Sana'a":["Sana'a City","Shu'ub","Ma'ain","Al-Sabeen","Az-Zuhrah","Al-Wahdah","Old City"],"Aden":["Aden City","Al-Mualla","Tawahi","Crater","Al-Mansoura","Sheikh Othman","Al-Buraiqeh"],"Taiz":["Taiz City","Turba","Al-Turbah","Ash Shama'iyah","As-Silw","Al-Wazi'iyah"],"Hudaydah":["Hudaydah City","Az-Zaydiyah","Bajil","Bayt al-Faqih","Ad-Dahi","Al-Mansuriyah"],"Hadramaut":["Mukalla","Ash Shihr","Al-Ghaydah","Sayhut","Qishn","Thamud"] } },
  "Zambia":           { code:"+260", currency:"ZMW – Zambian Kwacha",        states:{ "Lusaka":["Lusaka City","Chilanga","Kafue","Chongwe","Rufunsa","Luangwa"],"Copperbelt":["Ndola","Kitwe","Chingola","Mufulira","Luanshya","Bancroft","Kabwe","Kalulushi"],"Southern":["Livingstone","Mazabuka","Choma","Monze","Kalomo","Gwembe","Siavonga"],"Eastern":["Chipata","Petauke","Katete","Lundazi","Mambwe","Nyimba","Sinda"],"Central":["Kabwe","Kapiri Mposhi","Mumbwa","Chibombo","Mkushi","Serenje","Ngabwe"] } },
  "Zimbabwe":         { code:"+263", currency:"ZWL – Zimbabwean Dollar",     states:{ "Harare":["Harare City","Chitungwiza","Epworth","Ruwa","Norton","Mazowe","Bindura"],"Bulawayo":["Bulawayo City","Nkulumane","Pelandaba","Pumula","Entumbane","Lobengula","Emakhandeni"],"Manicaland":["Mutare","Chipinge","Rusape","Nyanga","Chimanimani","Buhera","Makoni"],"Midlands":["Gweru","Kwekwe","Zvishavane","Shurugwi","Gokwe","Mberengwa","Chirumanzu"],"Masvingo":["Masvingo City","Chiredzi","Gutu","Bikita","Zaka","Mwenezi","Chivi"] } },
};

const CURRENCY_TO_COUNTRY = {};
Object.entries(COUNTRY_DATA).forEach(([country, data]) => {
  if (!CURRENCY_TO_COUNTRY[data.currency]) CURRENCY_TO_COUNTRY[data.currency] = country;
});

const COUNTRIES = Object.keys(COUNTRY_DATA).sort();
const CURRENCIES = [...new Set(Object.values(COUNTRY_DATA).map(d => d.currency))].sort();

// ─── FIREBASE REALTIME DATABASE (simple REST) ────────────────────────────────
// No SDK needed — plain fetch to a JSON endpoint. Works across all devices.
const RTDB = "https://bitgrow-e379d-default-rtdb.firebaseio.com";

const _cache = {};

async function fsGetCollection(col) {
  try {
    if (_cache[col]) return Object.values(_cache[col]);
    const res = await fetch(`${RTDB}/${col}.json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data) { _cache[col] = {}; return []; }
    _cache[col] = data;
    return Object.values(data);
  } catch(e) { console.error("fsGet error", col, e); return Object.values(_cache[col] || {}); }
}

async function fsSetDoc(col, docId, obj) {
  try {
    const { _docId, ...clean } = obj;
    if (!_cache[col]) _cache[col] = {};
    _cache[col][String(docId)] = clean;
    await fetch(`${RTDB}/${col}/${docId}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean),
    });
  } catch(e) { console.error("fsSet error", col, docId, e); }
}

async function fsDeleteDoc(col, docId) {
  try {
    if (_cache[col]) delete _cache[col][String(docId)];
    await fetch(`${RTDB}/${col}/${docId}.json`, { method: "DELETE" });
  } catch(e) { console.error("fsDel error", col, docId, e); }
}

// localStorage (session + page only — not user data)
const load = k => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
function getPlan(amount) { return PLANS.find(p => amount >= p.min && amount <= p.max) || null; }
function calcBalance(inv) {
  if (!inv || !inv.verifiedAt) return inv?.amount || 0;
  const plan = getPlan(inv.amount);
  if (!plan) return inv.amount;
  const days = (Date.now() - inv.verifiedAt) / (1000 * 60 * 60 * 24);
  return +(inv.amount + inv.amount * plan.dailyRate * days).toFixed(2);
}
function usd(n) { return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function validatePassword(pw) {
  const e = [];
  if (pw.length < 8) e.push("at least 8 characters");
  if (!/[A-Z]/.test(pw)) e.push("one uppercase letter");
  if (!/[0-9]/.test(pw)) e.push("one number");
  if (!/[^A-Za-z0-9]/.test(pw)) e.push("one special character");
  return e;
}
function canWithdraw(inv) {
  if (!inv || !inv.verifiedAt) return false;
  return (Date.now() - inv.verifiedAt) / (1000 * 60 * 60 * 24) >= WITHDRAW_LOCK_DAYS;
}
function daysUntilWithdraw(inv) {
  if (!inv || !inv.verifiedAt) return WITHDRAW_LOCK_DAYS;
  return Math.max(0, Math.ceil(WITHDRAW_LOCK_DAYS - (Date.now() - inv.verifiedAt) / (1000 * 60 * 60 * 24)));
}

// ─── Phone validation ─────────────────────────────────────────────────────────
// Strips ALL formatting chars (spaces, dashes, parens, dots) then validates:
// 1. Total digits must be 9-15
// 2. Number must start with country dial code
// 3. At least 6 subscriber digits after removing country code
function validatePhone(phone, country) {
  if (!phone) return false;
  const dialCode = COUNTRY_DATA[country]?.code || "";
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length < 9 || digitsOnly.length > 15) return false;
  if (!dialCode) return true;
  const codeDigits = dialCode.replace("+", "");
  // Normalize: strip leading + then check starts with country code digits
  const withoutPlus = phone.trim().startsWith("+")
    ? phone.trim().slice(1).replace(/\D/g, "")
    : phone.replace(/[^0-9]/g, "");
  if (!withoutPlus.startsWith(codeDigits)) return false;
  const subscriberDigits = withoutPlus.slice(codeDigits.length);
  return subscriberDigits.length >= 6;
}

// ─── ROBUST COPY ─────────────────────────────────────────────────────────────
function copyToClipboard(text) {
  return new Promise(resolve => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => resolve(true)).catch(() => resolve(legacyCopy(text)));
    } else {
      resolve(legacyCopy(text));
    }
  });
}
function legacyCopy(text) {
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
    document.body.appendChild(el);
    el.focus();
    el.select();
    el.setSelectionRange(0, el.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch { return false; }
}
function useCopy(timeout = 2500) {
  const [copied, setCopied] = useState(false);
  const copy = async text => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), timeout); }
  };
  return [copied, copy];
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const BackIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>;
const CopyIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const BtcIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="#fbbf24"><path d="M23.638 14.904c-1.602 6.425-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z"/><path fill="#fff" d="M17.157 10.235c.23-1.542-.944-2.37-2.55-2.924l.52-2.088-1.27-.317-.507 2.034a53.6 53.6 0 00-1.016-.24l.511-2.049-1.27-.317-.52 2.088c-.28-.064-.556-.127-.823-.194l.002-.007-1.752-.437-.338 1.356s.944.216.924.23c.515.128.608.47.593.74l-.594 2.384c.036.009.082.022.133.042l-.135-.034-.832 3.337c-.063.156-.223.39-.583.301.013.019-.924-.23-.924-.23l-.632 1.453 1.654.412c.307.077.608.158.905.233l-.527 2.112 1.269.317.52-2.09c.34.092.67.177.993.258l-.518 2.079 1.27.317.527-2.108c2.174.412 3.81.246 4.497-1.72.554-1.581-.028-2.493-1.17-3.087.831-.192 1.457-.738 1.624-1.868zM15.1 14.73c-.394 1.581-3.058.727-3.923.512l.7-2.8c.865.216 3.638.644 3.223 2.288zm.393-4.514c-.358 1.437-2.573.707-3.292.528l.634-2.542c.72.18 3.037.515 2.658 2.014z"/></svg>;

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [users,       setUsers]       = useState([]);
  const [msgs,        setMsgs]        = useState([]);
  const [withdraws,   setWithdraws]   = useState([]);
  const [pageHistory, setPageHistory] = useState([]);
  const [dashTab,     setDashTab]     = useState("overview");
  const [notifCount,  setNotifCount]  = useState(0);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [dbLoading,   setDbLoading]   = useState(true);

  // Session stored in localStorage (browser-local, not synced — just remembers WHO is logged in)
  const [currentUser, setCurrentUserRaw] = useState(()=>{
    try { const s=sessionStorage.getItem("bg_session"); return s?JSON.parse(s):null; } catch{return null;}
  });
  const [page, setPageRaw] = useState(()=>{
    try {
      const session = sessionStorage.getItem("bg_session");
      if (!session) return "home";
      const pg = sessionStorage.getItem("bg_page");
      return pg || "dashboard";
    } catch { return "home"; }
  });

  const setPage = p => { setPageRaw(p); sessionStorage.setItem("bg_page", p); };

  // ── Load ALL data from RTDB on mount, migrate localStorage if needed ──
  useEffect(() => {
    (async () => {
      setDbLoading(true);
      try {
        // 1. Migrate any existing localStorage users → RTDB (one-time)
        const localUsers = (() => { try { return JSON.parse(localStorage.getItem("bg_users") || "[]"); } catch { return []; } })();
        const localMsgs  = (() => { try { return JSON.parse(localStorage.getItem("bg_chats") || "[]"); } catch { return []; } })();
        const localWs    = (() => { try { return JSON.parse(localStorage.getItem("bg_withdraws") || "[]"); } catch { return []; } })();

        if (localUsers.length > 0 && !localStorage.getItem("bg_migrated")) {
          // Write local users to RTDB
          for (const u of localUsers) {
            const { _docId, ...data } = u;
            await fsSetDoc("bg_users", String(u.id), data);
          }
          for (const m of localMsgs) {
            const { _docId, ...data } = m;
            await fsSetDoc("bg_chats", String(m.id), data);
          }
          for (const w of localWs) {
            const { _docId, ...data } = w;
            await fsSetDoc("bg_withdraws", String(w.id), data);
          }
          localStorage.setItem("bg_migrated", "1");
        }

        // 2. Load fresh from RTDB
        const [u, m, w] = await Promise.all([
          fsGetCollection("bg_users"),
          fsGetCollection("bg_chats"),
          fsGetCollection("bg_withdraws"),
        ]);
        setUsers(u);
        setMsgs(m);
        setWithdraws(w);

        // 3. Refresh current session user from RTDB
        const session = (() => { try { return JSON.parse(sessionStorage.getItem("bg_session") || "null"); } catch { return null; } })();
        if (session) {
          const fresh = u.find(x => x.id === session.id);
          if (fresh) { setCurrentUserRaw(fresh); sessionStorage.setItem("bg_session", JSON.stringify(fresh)); }
        }
      } catch(e) {
        console.error("Load error", e);
      }
      setDbLoading(false);
    })();
  }, []);

  // ── Keep currentUser fresh when users array updates ──
  useEffect(()=>{
    if(currentUser){
      const found = users.find(u=>u.id===currentUser.id);
      if(found){
        const { _docId, ...fresh } = found;
        setCurrentUserRaw(fresh);
        sessionStorage.setItem("bg_session", JSON.stringify(fresh));
      }
    }
  },[users]);

  // ── Poll Firestore every 20s to sync across devices ──
  useEffect(()=>{
    const id = setInterval(async ()=>{
      const [u, m, w] = await Promise.all([
        fsGetCollection("bg_users"),
        fsGetCollection("bg_chats"),
        fsGetCollection("bg_withdraws"),
      ]);
      setUsers(u); setMsgs(m); setWithdraws(w);
    }, 20000);
    return ()=>clearInterval(id);
  },[]);

  // ── updateUsers: write each user to Firestore ──
  const updateUsers = async (newUsers) => {
    setUsers(newUsers);
    for (const u of newUsers) {
      const { _docId, ...data } = u;
      await fsSetDoc("bg_users", String(u.id), data);
    }
    // Keep current session fresh
    if (currentUser) {
      const found = newUsers.find(u => u.id === currentUser.id);
      if (found) {
        const { _docId, ...fresh } = found;
        setCurrentUserRaw(fresh);
        sessionStorage.setItem("bg_session", JSON.stringify(fresh));
      }
    }
  };

  // ── updateMsgs: write each msg to Firestore ──
  const updateMsgs = async (newMsgs) => {
    setMsgs(newMsgs);
    for (const m of newMsgs) {
      if (!m._docId) {
        const { _docId, ...data } = m;
        await fsSetDoc("bg_chats", String(m.id), data);
      }
    }
  };

  // ── updateWithdraws: write each withdrawal to Firestore ──
  const updateWithdraws = async (newWithdraws) => {
    setWithdraws(newWithdraws);
    for (const w of newWithdraws) {
      const { _docId, ...data } = w;
      await fsSetDoc("bg_withdraws", String(w.id), data);
    }
  };

  const setCurrentUser = user => {
    if (user) {
      // Strip Firestore meta before storing in session
      const { _docId, ...cleanUser } = user;
      setCurrentUserRaw(cleanUser);
      sessionStorage.setItem("bg_session", JSON.stringify(cleanUser));
      sessionStorage.setItem("bg_page", "dashboard");
    } else {
      setCurrentUserRaw(null);
      sessionStorage.removeItem("bg_session");
      sessionStorage.removeItem("bg_page");
    }
  };

  const navigate = p => { setPageHistory(h=>[...h,page]); setPage(p); };
  const goBack   = () => setPageHistory(h=>{ const prev=h[h.length-1]||"home"; setPage(prev); return h.slice(0,-1); });
  const logout   = () => { setCurrentUser(null); setPage("home"); setPageHistory([]); setDashTab("overview"); };

  // ── FIX 5: Notification count ──
  useEffect(()=>{
    if(!currentUser)return;
    const unread=msgs.filter(m=>m.userId===currentUser.id&&m.from==="admin"&&!m.read).length;
    setNotifCount(unread);
  },[msgs,currentUser]);

  const isAdmin = currentUser?.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase();
  const props = { users,updateUsers,msgs,updateMsgs,withdraws,updateWithdraws,
                  currentUser,setCurrentUser,page,navigate,goBack,pageHistory,
                  logout,isAdmin,dashTab,setDashTab,notifCount,setNotifCount,
                  notifPanelOpen, setNotifPanelOpen };

  // Show loading screen while fetching from Firestore
  if (dbLoading) return (
    <div style={{fontFamily:"'Sora','Segoe UI',sans-serif",minHeight:"100vh",background:"#07080f",color:"#e8eaf0",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20}}>
      <div style={{width:52,height:52,background:"linear-gradient(135deg,#fbbf24,#f97316)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:26,color:"#07080f"}}>B</div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:20,height:20,border:"3px solid #fbbf2444",borderTopColor:"#fbbf24",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
        <span style={{color:"#6b7280",fontSize:14}}>Loading BitGrow...</span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{fontFamily:"'Sora','Segoe UI',sans-serif",minHeight:"100vh",background:"#07080f",color:"#e8eaf0"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0f1017}::-webkit-scrollbar-thumb{background:#2a2d3e;border-radius:4px}
        input,textarea,select{outline:none;font-family:inherit}button{cursor:pointer;font-family:inherit}
        .card{background:#0f1117;border:1px solid #1e2030;border-radius:16px}
        @keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fadein{animation:fadein .35s ease forwards}
        .live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;animation:pulse 2s infinite}
        input:focus,textarea:focus{border-color:#fbbf24!important}
        .hov:hover{opacity:.82;transition:opacity .15s}
        .plan-card:hover{border-color:#fbbf2455!important;transform:translateY(-2px);transition:all .2s}
        .drop-item:hover{background:#111218!important}
        @media(max-width:600px){.hide-mobile{display:none!important}.nav-name{display:none!important}}
      `}</style>
      <Nav {...props}/>
      {page==="home"       && <HomePage      {...props}/>}
      {page==="login"      && <LoginPage     {...props}/>}
      {page==="register"   && <RegisterPage  {...props}/>}
      {page==="recover"    && <RecoverPage   {...props}/>}
      {page==="dashboard"  && currentUser    && <Dashboard    {...props}/>}
      {page==="admin"      && isAdmin        && <AdminPanel   {...props}/>}
      {page==="admin"      && !isAdmin       && <AdminLogin   {...props}/>}
      <Footer navigate={navigate}/>
    </div>
  );
}

// ─── ANIMATED COUNTER ────────────────────────────────────────────────────────
function AnimatedCounter({ target, prefix = "", suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * target));
          if (progress < 1) requestAnimationFrame(tick);
          else setCount(target);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(id);
  }, []);
  const t = TESTIMONIALS[active];
  return (
    <section style={{ padding: "72px 24px 80px", background: "#080910", borderTop: "1px solid #1e2030", borderBottom: "1px solid #1e2030" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 10 }}>What Our Investors Say</h2>
          <p style={{ color: "#6b7280" }}>Trusted by over 12,400 investors across 80+ countries</p>
        </div>
        <div className="card fadein" key={active} style={{ padding: 36, maxWidth: 680, margin: "0 auto", border: "1px solid #1e2030", position: "relative" }}>
          <div style={{ fontSize: 48, color: "#fbbf2430", fontFamily: "Georgia", lineHeight: 1, marginBottom: 8, position: "absolute", top: 20, left: 28 }}>"</div>
          <p style={{ color: "#9ca3af", fontSize: 15, lineHeight: 1.85, marginBottom: 24, marginTop: 16, fontStyle: "italic" }}>{t.text}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#fbbf24,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#07080f" }}>{t.avatar}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                <div style={{ color: "#4b5563", fontSize: 12 }}>{t.country} · Joined {t.joined}</div>
              </div>
            </div>
            <span style={{ background: "#fbbf2415", border: "1px solid #fbbf2433", color: "#fbbf24", borderRadius: 100, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>{t.plan}</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} style={{ width: i === active ? 24 : 8, height: 8, borderRadius: 4, background: i === active ? "#fbbf24" : "#1e2030", border: "none", transition: "all .3s", cursor: "pointer" }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── LOADING BUTTON ───────────────────────────────────────────────────────────
function LoadingBtn({ onClick, children, loading }) {
  return (
    <button onClick={loading ? undefined : onClick} className="hov" style={{ width: "100%", background: loading ? "#b45309" : "linear-gradient(135deg,#fbbf24,#f97316)", color: "#07080f", border: "none", padding: "14px", borderRadius: 10, fontWeight: 700, fontSize: 16, boxShadow: "0 6px 20px rgba(251,191,36,0.22)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.8 : 1 }}>
      {loading && <div style={{ width: 18, height: 18, border: "2px solid #07080f", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
      {loading ? "Processing..." : children}
    </button>
  );
}

// ─── FIX 5: NOTIFICATION PANEL ────────────────────────────────────────────────
function NotifBell({ count, msgs, currentUser, updateMsgs, setNotifCount, notifPanelOpen, setNotifPanelOpen }) {
  const panelRef = useRef(null);
  const myNotifs = (msgs || []).filter(m => m.userId === currentUser?.id && m.from === "admin");

  useEffect(() => {
    const handler = e => { if (panelRef.current && !panelRef.current.contains(e.target)) setNotifPanelOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => {
    updateMsgs(msgs.map(m => m.userId === currentUser?.id && m.from === "admin" ? { ...m, read: true } : m));
    setNotifCount(0);
  };

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button onClick={() => { setNotifPanelOpen(o => !o); if (!notifPanelOpen) markAllRead(); }}
        style={{ position: "relative", background: "#111218", border: "1px solid #1e2030", borderRadius: 9, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        {count > 0 && (
          <span style={{ position: "absolute", top: -5, right: -5, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 17, height: 17, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #07080f" }}>{count > 9 ? "9+" : count}</span>
        )}
      </button>

      {notifPanelOpen && (
        <div className="fadein" style={{ position: "fixed", top: 68, right: 16, width: 340, background: "#0f1117", border: "1px solid #1e2030", borderRadius: 16, boxShadow: "0 24px 70px rgba(0,0,0,0.8)", zIndex: 450, maxHeight: 420, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid #1e2030", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>🔔 Notifications</span>
            {myNotifs.length > 0 && <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#fbbf24", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Mark all read</button>}
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {myNotifs.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "#4b5563" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                <div style={{ fontSize: 13 }}>No notifications yet</div>
              </div>
            ) : [...myNotifs].reverse().map(n => (
              <div key={n.id} style={{ padding: "14px 18px", borderBottom: "1px solid #1e203044", background: n.read ? "transparent" : "#fbbf2406", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#fbbf24,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>B</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: "#fbbf24", marginBottom: 3 }}>BitGrow Team</div>
                  <div style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.6 }}>{n.text}</div>
                  <div style={{ color: "#374151", fontSize: 10, marginTop: 4 }}>{n.time}</div>
                </div>
                {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fbbf24", flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DELETE ACCOUNT MODAL ────────────────────────────────────────────────────
function DeleteAccountModal({ currentUser, users, updateUsers, logout, onClose }) {
  const [step, setStep] = useState(1); // 1=warning, 2=confirm password
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const isGoogle = currentUser.authMethod === "google";

  const handleConfirm = async () => {
    setErr("");
    if (!isGoogle) {
      if (!password) return setErr("Please enter your password to confirm.");
      if (password !== currentUser.password) return setErr("Incorrect password. Account not deleted.");
    }
    setLoading(true);
    try {
      await fsDeleteDoc("bg_users", String(currentUser.id));
      const allChats = await fsGetCollection("bg_chats");
      for (const m of allChats.filter(m => m.userId === currentUser.id)) {
        await fsDeleteDoc("bg_chats", String(m.id));
      }
      const allWs = await fsGetCollection("bg_withdraws");
      for (const w of allWs.filter(w => w.userId === currentUser.id)) {
        await fsDeleteDoc("bg_withdraws", String(w.id));
      }
    } catch(e) { console.error("Delete error", e); }
    sessionStorage.removeItem("bg_session");
    sessionStorage.removeItem("bg_page");
    setLoading(false);
    logout();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="fadein" style={{ background: "#0f1117", border: "2px solid #ef444444", borderRadius: 20, width: "100%", maxWidth: 460, boxShadow: "0 32px 80px rgba(239,68,68,0.2)" }}>

        {/* Header */}
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #1e2030", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "#ef444418", border: "1px solid #ef444444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🗑️</div>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 17, color: "#ef4444" }}>Delete Account</h2>
              <p style={{ color: "#4b5563", fontSize: 11, marginTop: 1 }}>This action is permanent and cannot be undone</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#111218", border: "1px solid #1e2030", color: "#9ca3af", borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "24px 28px 28px" }}>
          {step === 1 && (
            <div>
              {/* Warning box */}
              <div style={{ background: "#ef444410", border: "1px solid #ef444430", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#ef4444", marginBottom: 10 }}>⚠️ Before you delete, understand:</div>
                {[
                  "Your entire account and profile will be permanently erased",
                  "All active investments and balance history will be deleted",
                  "Any pending withdrawals will be cancelled immediately",
                  "Your referral code and bonuses will be lost forever",
                  "You cannot recover your account after deletion",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7, fontSize: 13, color: "#9ca3af", lineHeight: 1.5 }}>
                    <span style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }}>✕</span>{item}
                  </div>
                ))}
              </div>

              {/* Account summary */}
              <div style={{ background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#fbbf24,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#07080f" }}>{currentUser.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{currentUser.name}</div>
                    <div style={{ color: "#4b5563", fontSize: 11 }}>{currentUser.email}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={onClose} style={{ flex: 1, background: "#111218", border: "1px solid #1e2030", color: "#e8eaf0", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                <button onClick={() => setStep(2)} style={{ flex: 1, background: "#ef444418", border: "1px solid #ef444455", color: "#ef4444", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Yes, I understand →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                To permanently delete your account, {isGoogle ? "click the button below to confirm." : "please enter your password below to confirm."}
              </p>

              {err && (
                <div style={{ background: "#ef444414", border: "1px solid #ef444433", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444", display: "flex", gap: 8 }}>
                  <span>⚠</span><span>{err}</span>
                </div>
              )}

              {!isGoogle && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4 }}>Confirm your password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your current password"
                    autoFocus
                    style={{ background: "#080910", border: "1px solid #ef444444", borderRadius: 10, padding: "12px 14px", color: "#e8eaf0", fontSize: 15 }}
                  />
                </div>
              )}

              <div style={{ background: "#ef444410", border: "1px solid #ef444430", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>
                🔴 <strong style={{ color: "#ef4444" }}>This is your final chance.</strong> Clicking delete below will immediately and permanently erase your account. This cannot be reversed.
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep(1); setErr(""); setPassword(""); }} style={{ flex: 1, background: "#111218", border: "1px solid #1e2030", color: "#e8eaf0", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>← Back</button>
                <button onClick={handleConfirm} disabled={loading} style={{ flex: 1, background: loading ? "#7f1d1d" : "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", color: "#fff", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {loading && <div style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
                  {loading ? "Deleting..." : "🗑️ Delete My Account"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SECURITY MODAL ───────────────────────────────────────────────────────────
function SecurityModal({ currentUser, users, updateUsers, onClose }) {
  const [tab, setTab] = useState("password");
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const [profile, setProfile] = useState({ phone: currentUser.phone || "", city: currentUser.city || "", country: currentUser.country || "", address: currentUser.address || "", currency: currentUser.currency || "" });
  const [msg, setMsg] = useState(null);

  const savePassword = async () => {
    setMsg(null);
    if (!pw.current || !pw.newPw || !pw.confirm) return setMsg({ type: "err", text: "All fields are required." });
    if (pw.current !== currentUser.password) return setMsg({ type: "err", text: "Current password is incorrect." });
    const errs = validatePassword(pw.newPw);
    if (errs.length) return setMsg({ type: "err", text: "New password must include: " + errs.join(", ") + "." });
    if (pw.newPw !== pw.confirm) return setMsg({ type: "err", text: "New passwords do not match." });
    await updateUsers(users.map(u => u.id === currentUser.id ? { ...u, password: pw.newPw } : u));
    setPw({ current: "", newPw: "", confirm: "" });
    setMsg({ type: "ok", text: "Password updated successfully." });
  };

  const saveProfile = async () => {
    setMsg(null);
    await updateUsers(users.map(u => u.id === currentUser.id ? { ...u, ...profile } : u));
    setMsg({ type: "ok", text: "Profile updated successfully." });
  };

  const tabs = [{ id: "password", label: "🔒 Password" }, { id: "profile", label: "🪪 Profile" }, { id: "account", label: "ℹ️ Account" }];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="fadein" style={{ background: "#0f1117", border: "1px solid #1e2030", borderRadius: 20, width: "100%", maxWidth: 500, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #1e2030", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div><h2 style={{ fontWeight: 800, fontSize: 18 }}>Account Settings</h2><p style={{ color: "#4b5563", fontSize: 12, marginTop: 2 }}>Manage your security and profile</p></div>
          <button onClick={onClose} style={{ background: "#111218", border: "1px solid #1e2030", color: "#9ca3af", borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 4, padding: "12px 24px 0", flexShrink: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMsg(null); }} style={{ flex: 1, background: tab === t.id ? "linear-gradient(135deg,#fbbf24,#f97316)" : "#111218", color: tab === t.id ? "#07080f" : "#6b7280", border: tab === t.id ? "none" : "1px solid #1e2030", borderRadius: 8, padding: "8px 4px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{t.label}</button>
          ))}
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          {msg && <div style={{ background: msg.type === "ok" ? "#10b98115" : "#ef444415", border: `1px solid ${msg.type === "ok" ? "#10b98144" : "#ef444444"}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: msg.type === "ok" ? "#10b981" : "#ef4444", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>{msg.type === "ok" ? "✅" : "⚠"} {msg.text}</div>}
          {tab === "password" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Input label="Current Password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} placeholder="Enter current password" type="password" />
              <Input label="New Password" value={pw.newPw} onChange={e => setPw(p => ({ ...p, newPw: e.target.value }))} placeholder="Enter new password" type="password" />
              <Input label="Confirm New Password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} placeholder="Re-enter new password" type="password" />
              <PrimaryBtn onClick={savePassword}>Update Password</PrimaryBtn>
            </div>
          )}
          {tab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Input label="Phone Number" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+1 234 567 8900" type="tel" />
              <Input label="City" value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} placeholder="Your city" />
              <Input label="Address" value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} placeholder="Street address" />
              <PrimaryBtn onClick={saveProfile}>Save Profile</PrimaryBtn>
            </div>
          )}
          {tab === "account" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Full Name", currentUser.name], ["Email Address", currentUser.email], ["Phone", currentUser.phone || "Not set"], ["Account Currency", currentUser.currency || "Not set"], ["Country", currentUser.country || "Not set"], ["Referral Code", currentUser.referralCode], ["Member Since", new Date(currentUser.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })]].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "11px 14px", gap: 12 }}>
                  <span style={{ color: "#4b5563", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{label}</span>
                  <span style={{ color: label === "Referral Code" ? "#fbbf24" : "#9ca3af", fontSize: 13, fontWeight: label === "Referral Code" ? 700 : 400, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Nav({ page, navigate, goBack, pageHistory, currentUser, logout, isAdmin, users, updateUsers, setDashTab, notifCount, setNotifCount, msgs, updateMsgs, notifPanelOpen, setNotifPanelOpen }) {
  const showBack = pageHistory.length > 0 && page !== "home";
  const [dropOpen, setDropOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const goTab = tab => { setDashTab(tab); navigate("dashboard"); setDropOpen(false); };

  return (
    <>
      {securityOpen && <SecurityModal currentUser={currentUser} users={users} updateUsers={updateUsers} onClose={() => setSecurityOpen(false)} />}
      {deleteOpen && <DeleteAccountModal currentUser={currentUser} users={users} updateUsers={updateUsers} logout={logout} onClose={() => setDeleteOpen(false)} />}
      <nav style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(7,8,15,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid #1e2030", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {showBack && <button onClick={goBack} className="hov" style={{ background: "#111218", border: "1px solid #1e2030", color: "#9ca3af", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 4, fontSize: 13, marginRight: 4 }}><BackIcon /> Back</button>}
          <div onClick={() => navigate("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#fbbf24,#f59e0b)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#07080f", boxShadow: "0 4px 12px rgba(251,191,36,0.3)" }}>B</div>
            <span style={{ fontWeight: 800, fontSize: 20, background: "linear-gradient(90deg,#fbbf24,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>BitGrow</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span className="hide-mobile"><NavBtn label="Home" active={page === "home"} onClick={() => navigate("home")} /></span>
          {!currentUser ? <>
            <NavBtn label="Login" active={page === "login"} onClick={() => navigate("login")} />
            <NavBtn label="Get Started" active={page === "register"} onClick={() => navigate("register")} primary />
          </> : <>
            <NavBtn label="Dashboard" active={page === "dashboard"} onClick={() => navigate("dashboard")} />
            {isAdmin && <NavBtn label="⚙ Admin" active={page === "admin"} onClick={() => navigate("admin")} />}

            {/* FIX 5: Notification bell opens panel, not dashboard */}
            <NotifBell
              count={notifCount}
              msgs={msgs}
              currentUser={currentUser}
              updateMsgs={updateMsgs}
              setNotifCount={setNotifCount}
              notifPanelOpen={notifPanelOpen}
              setNotifPanelOpen={setNotifPanelOpen}
            />

            <div ref={dropRef} style={{ position: "relative" }}>
              <button onClick={() => setDropOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 8, background: dropOpen ? "#1a1d2e" : "#111218", border: `1px solid ${dropOpen ? "#fbbf2466" : "#1e2030"}`, borderRadius: 10, padding: "5px 10px 5px 6px", cursor: "pointer", transition: "all .2s" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#fbbf24,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#07080f" }}>
                  {currentUser.name?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="nav-name" style={{ color: "#e8eaf0", fontSize: 13, fontWeight: 600, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentUser.firstName || currentUser.name?.split(" ")[0] || "Account"}
                </span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" style={{ transition: "transform .2s", transform: dropOpen ? "rotate(180deg)" : "none", flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>
              </button>

              {dropOpen && (
                <div className="fadein" style={{ position: "fixed", top: 68, right: 16, width: 290, background: "#0f1117", border: "1px solid #1e2030", borderRadius: 16, boxShadow: "0 24px 70px rgba(0,0,0,0.8)", zIndex: 400, display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 80px)" }}>
                  <div style={{ padding: "16px 18px 14px", background: "#080910", borderBottom: "1px solid #1e2030", borderRadius: "16px 16px 0 0", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#fbbf24,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: "#07080f", flexShrink: 0 }}>
                        {currentUser.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</div>
                        <div style={{ fontSize: 11, color: "#4b5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.email}</div>
                        <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                          {currentUser.country && <span style={{ background: "#1a1d2e", color: "#6b7280", borderRadius: 100, padding: "1px 8px", fontSize: 10 }}>🌍 {currentUser.country}</span>}
                          <span style={{ background: "#10b98115", border: "1px solid #10b98140", color: "#10b981", borderRadius: 100, padding: "1px 8px", fontSize: 10, fontWeight: 600 }}>● Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    <SectionLabel label="Portfolio" />
                    <DropItem icon="📊" label="Overview" sub="Balance & returns" onClick={() => goTab("overview")} />
                    <DropItem icon="💰" label="Invest" sub="Browse & fund a plan" onClick={() => goTab("invest")} />
                    <DropItem icon="💸" label="Withdraw Funds" sub="Request a payout" onClick={() => goTab("withdraw")} />
                    <DropItem icon="📋" label="Transaction History" sub="Investments & withdrawals" onClick={() => goTab("history")} />
                    <DropItem icon="👥" label="Referrals" sub="Share your code & earn" onClick={() => goTab("referrals")} />
                    <SectionLabel label="Account" />
                    <DropItem icon="🔒" label="Security & Password" sub="Change password" onClick={() => { setDropOpen(false); setSecurityOpen(true); }} highlight />
                    {isAdmin && <>
                      <SectionLabel label="Administration" />
                      <DropItem icon="⚙️" label="Admin Panel" sub="Users & transactions" onClick={() => { navigate("admin"); setDropOpen(false); }} gold />
                    </>}
                    <div style={{ margin: "8px 12px", background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", letterSpacing: .5, marginBottom: 3 }}>Referral Code</div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "#fbbf24", letterSpacing: 3 }}>{currentUser.referralCode}</div>
                      </div>
                      <NavCopyBtn code={currentUser.referralCode} />
                    </div>
                    <div style={{ borderTop: "1px solid #1e2030", margin: "4px 0 0" }}>
                      <div onClick={() => { setDropOpen(false); setDeleteOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "#1a0808"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <span style={{ fontSize: 16, width: 26, textAlign: "center" }}>🗑️</span>
                        <div><div style={{ fontWeight: 700, fontSize: 13, color: "#ef4444" }}>Delete Account</div><div style={{ fontSize: 11, color: "#4b5563" }}>Permanently remove your data</div></div>
                      </div>
                      <div onClick={() => { logout(); setDropOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", cursor: "pointer", borderRadius: "0 0 16px 16px", borderTop: "1px solid #1e203044" }} onMouseEnter={e => e.currentTarget.style.background = "#1a0808"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <span style={{ fontSize: 16, width: 26, textAlign: "center" }}>🚪</span>
                        <div><div style={{ fontWeight: 700, fontSize: 13, color: "#ef4444" }}>Sign Out</div><div style={{ fontSize: 11, color: "#4b5563" }}>End your session securely</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>}
        </div>
      </nav>
    </>
  );
}

function SectionLabel({ label }) {
  return <div style={{ padding: "10px 18px 4px", fontSize: 10, color: "#374151", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>;
}
function DropItem({ icon, label, sub, onClick, highlight, gold }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 18px", cursor: "pointer", background: hov ? "#111218" : "transparent", transition: "background .12s" }}>
      <span style={{ fontSize: 16, width: 26, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: gold ? "#fbbf24" : "#e8eaf0", display: "flex", alignItems: "center", gap: 6 }}>
          {label}
          {highlight && <span style={{ background: "#ef444420", color: "#ef4444", borderRadius: 4, fontSize: 9, padding: "1px 5px", fontWeight: 700 }}>SECURITY</span>}
        </div>
        <div style={{ fontSize: 11, color: "#4b5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
      </div>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" style={{ marginLeft: "auto", flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
    </div>
  );
}
function NavCopyBtn({ code }) {
  const [copied, copy] = useCopy(2000);
  return (
    <button onClick={e => { e.stopPropagation(); copy(code); }} style={{ background: copied ? "#10b98118" : "#fbbf2418", border: `1px solid ${copied ? "#10b98155" : "#fbbf2455"}`, color: copied ? "#10b981" : "#fbbf24", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
      <CopyIcon />{copied ? "✓" : "Copy"}
    </button>
  );
}
function NavBtn({ label, active, onClick, primary }) {
  return <button onClick={onClick} className="hov" style={{ background: primary ? "linear-gradient(135deg,#fbbf24,#f97316)" : active ? "#1a1d2e" : "transparent", color: primary ? "#07080f" : active ? "#fbbf24" : "#6b7280", border: primary ? "none" : active ? "1px solid #fbbf2466" : "1px solid transparent", padding: "7px 15px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{label}</button>;
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomePage({ navigate, currentUser }) {
  return (
    <div className="fadein">
      <section style={{ position: "relative", overflow: "hidden", padding: "96px 24px 80px", textAlign: "center" }}>
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 700, height: 500, background: "radial-gradient(ellipse,rgba(251,191,36,0.07) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#111218", border: "1px solid #2a2d3e", borderRadius: 100, padding: "5px 14px 5px 10px", fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 28 }}>
          <span className="live-dot" /> <span style={{ color: "#fbbf24" }}>LIVE</span>&nbsp;Crypto Asset Management Platform
        </div>
        <h1 style={{ fontSize: "clamp(2.6rem,6vw,4.2rem)", fontWeight: 800, lineHeight: 1.08, marginBottom: 22, letterSpacing: "-0.02em" }}>
          Your Capital.<br />
          <span style={{ background: "linear-gradient(95deg,#fbbf24 0%,#f97316 50%,#ef4444 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Intelligently Grown.</span>
        </h1>
        <p style={{ color: "#6b7280", fontSize: 17, maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.85 }}>BitGrow is a professional crypto asset management platform, leveraging institutional-grade strategies to deliver consistent, transparent returns for our investors.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 }}>
          {!currentUser ? <>
            <button onClick={() => navigate("register")} style={{ background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#07080f", border: "none", padding: "14px 36px", borderRadius: 12, fontSize: 16, fontWeight: 700, boxShadow: "0 8px 32px rgba(251,191,36,0.28)" }}>Open Account →</button>
            <button onClick={() => navigate("login")} style={{ background: "#111218", color: "#e8eaf0", border: "1px solid #2a2d3e", padding: "14px 36px", borderRadius: 12, fontSize: 16, fontWeight: 600 }}>Sign In</button>
          </> : <button onClick={() => navigate("dashboard")} style={{ background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#07080f", border: "none", padding: "14px 36px", borderRadius: 12, fontSize: 16, fontWeight: 700 }}>Go to Dashboard →</button>}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          {[["🔒","Bank-grade security"],["⚡","Real-time returns"],["🌍","Global access"],["💬","24/7 support"]].map(([ic,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, background: "#0f1117", border: "1px solid #1e2030", borderRadius: 100, padding: "6px 14px", fontSize: 12, color: "#9ca3af" }}>{ic} {l}</div>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 24px 72px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Platform at a Glance</h2>
            <p style={{ color: "#6b7280", fontSize: 14 }}>Live statistics from the BitGrow network</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
            {[
              { prefix:"$", target:2400000, suffix:"+", label:"Capital Managed",   color:"#fbbf24", icon:"💰" },
              { prefix:"",  target:12400,   suffix:"+", label:"Active Investors",  color:"#10b981", icon:"👥" },
              { prefix:"",  target:82,      suffix:"+", label:"Countries Reached", color:"#6366f1", icon:"🌍" },
              { prefix:"",  target:98,      suffix:"%",  label:"Satisfaction Rate",color:"#f43f5e", icon:"⭐" },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: "24px 20px", textAlign: "center", borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 26, color: s.color, marginBottom: 4 }}>
                  <AnimatedCounter target={s.target} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <section style={{ padding: "0 24px 80px", maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>Investment Plans</h2>
          <p style={{ color: "#6b7280", fontSize: 16 }}>Select a strategy aligned with your financial goals</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }}>
          {PLANS.map(plan => (
            <div key={plan.id} className="card plan-card" style={{ padding: 28, borderTop: `3px solid ${plan.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div><div style={{ fontSize: 26, marginBottom: 6 }}>{plan.badge}</div><div style={{ fontWeight: 800, fontSize: 19, color: plan.color }}>{plan.name}</div></div>
                <div style={{ background: plan.color + "18", borderRadius: 10, padding: "6px 10px", textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: plan.color }}>PERFORMANCE</div>
                  <div style={{ color: "#6b7280", fontSize: 10, marginTop: 1 }}>BASED RETURNS</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>{plan.desc}</div>
              <div style={{ background: "#0a0b12", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 3 }}>INVESTMENT RANGE</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{plan.max === Infinity ? `$${plan.min.toLocaleString()} and above` : `$${plan.min.toLocaleString()} — $${plan.max.toLocaleString()}`}</div>
              </div>
              {["Automated returns","Real-time tracking","Secure custody","Priority support"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#9ca3af", marginBottom: 5 }}><span style={{ color: plan.color }}><CheckIcon /></span>{f}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <button onClick={() => navigate(currentUser ? "dashboard" : "register")} style={{ background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#07080f", border: "none", padding: "13px 36px", borderRadius: 12, fontSize: 15, fontWeight: 700 }}>
            {currentUser ? "Invest Now →" : "Create Account & Invest →"}
          </button>
        </div>
      </section>

      <section style={{ background: "#080910", borderTop: "1px solid #1e2030", borderBottom: "1px solid #1e2030", padding: "72px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}><h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 10 }}>How It Works</h2><p style={{ color: "#6b7280" }}>Four simple steps to start growing your portfolio</p></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 20 }}>
            {[["01","Create Account","Register with your referral code and secure your 12-phrase recovery key"],["02","Choose a Plan","Select an investment strategy that matches your financial goals"],["03","Deposit Crypto","Fund your account via BSC (BEP20) wallet transfer"],["04","Track & Withdraw","Monitor real-time returns. Withdrawal available after 3 months"]].map(([n,t,d]) => (
              <div key={n} className="card" style={{ padding: 24 }}>
                <div style={{ fontWeight: 800, fontSize: 40, color: "#1a1d2e", marginBottom: 16 }}>{n}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{t}</div>
                <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.65 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = "YOUR_PUBLIC_KEY";

async function sendWelcomeEmail(user) {
  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID, template_id: EMAILJS_TEMPLATE_ID, user_id: EMAILJS_PUBLIC_KEY,
        template_params: { to_name: user.firstName || user.name, to_email: user.email, referral_code: user.referralCode, from_name: "BitGrow Team", reply_to: "bitgrowofficial1@gmail.com" },
      }),
    });
  } catch (e) { console.warn("EmailJS send failed:", e); }
}

let firebaseAuth = null;
async function initFirebase() {
  if (firebaseAuth) return firebaseAuth;
  try {
    await getDb(); // ensure app initialized
    const { getApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const { getAuth, GoogleAuthProvider, signInWithPopup } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
    const app = getApp();
    firebaseAuth = { GoogleAuthProvider, signInWithPopup, auth: getAuth(app) };
    return firebaseAuth;
  } catch (e) { console.warn("Firebase auth init failed:", e); return null; }
}
async function signInWithGoogle() {
  const fb = await initFirebase();
  if (!fb) throw new Error("Firebase not available");
  const provider = new fb.GoogleAuthProvider();
  const result = await fb.signInWithPopup(fb.auth, provider);
  return result.user;
}

// ─── FIX 2,3,4: REGISTER PAGE with phone auto-code, currency↔country sync, cascading dropdowns ──
function RegisterPage({ users, updateUsers, setCurrentUser, navigate }) {
  const [step, setStep] = useState(1);
  const [googleUser, setGoogleUser] = useState(null);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    currency: "", country: "", state: "", city: "", address: "",
    username: "", password: "", confirm: "", referral: "", declared: false,
  });
  const [err, setErr] = useState("");
  const [pwErrs, setPwErrs] = useState([]);
  const [phrase, setPhrase] = useState("");
  const [newUser, setNewUser] = useState(null);
  const [phraseCopied, copyPhrase] = useCopy();
  const [gLoading, setGLoading] = useState(false);
  const [phoneManuallyEdited, setPhoneManuallyEdited] = useState(false);

  // Derived dropdown options
  const stateOptions = form.country ? Object.keys(COUNTRY_DATA[form.country]?.states || {}) : [];
  const cityOptions  = (form.country && form.state) ? (COUNTRY_DATA[form.country]?.states?.[form.state] || []) : [];

  // ── FIX 3: When country changes, auto-fill currency + phone code + reset state/city ──
  const handleCountryChange = (country) => {
    const data = COUNTRY_DATA[country] || {};
    const dialCode = data.code || "";
    const currency = data.currency || "";
    setPhoneManuallyEdited(false);
    setForm(p => ({
      ...p,
      country,
      currency: currency || p.currency,
      state: "",
      city: "",
      phone: dialCode ? dialCode + " " : p.phone,
    }));
  };

  // ── FIX 3: When currency changes, auto-fill country ──
  const handleCurrencyChange = (currency) => {
    const matchedCountry = CURRENCY_TO_COUNTRY[currency] || "";
    const data = COUNTRY_DATA[matchedCountry] || {};
    const dialCode = data.code || "";
    setForm(p => ({
      ...p,
      currency,
      country: matchedCountry || p.country,
      state: "",
      city: "",
      phone: (matchedCountry && !phoneManuallyEdited) ? (dialCode ? dialCode + " " : p.phone) : p.phone,
    }));
  };

  const handlePhoneChange = (val) => {
    setPhoneManuallyEdited(true);
    setForm(p => ({ ...p, phone: val }));
  };

  const f = k => e => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [k]: v }));
    if (k === "password") setPwErrs(validatePassword(v));
  };

  const handleGoogleSignIn = async () => {
    setErr(""); setGLoading(true);
    try {
      const gUser = await signInWithGoogle();
      const nameParts = (gUser.displayName || "").split(" ");
      setGoogleUser(gUser);
      setForm(p => ({ ...p, firstName: nameParts[0] || "", lastName: nameParts.slice(1).join(" ") || "", email: gUser.email || "", username: (gUser.email || "").split("@")[0] }));
      setStep(2);
    } catch (e) { setErr("Google Sign-In failed: " + e.message); }
    setGLoading(false);
  };

  const [regLoading, setRegLoading] = useState(false);
  const submit = async () => {
    setErr("");
    const { firstName, lastName, email, phone, currency, country, state, city, address, username, password, confirm, declared } = form;
    const isGoogle = !!googleUser;
    if (!firstName || !lastName || !email || !currency || !country || !state || !city || !address || !username) return setErr("Please fill in all required fields.");
    if (!phone || phone.trim().length < 5) return setErr("Please enter a valid phone number.");
    if (!validatePhone(phone, country)) {
      const dialCode = COUNTRY_DATA[country]?.code || "";
      return setErr(`Phone number must start with ${dialCode} and have 7–15 digits.`);
    }
    if (!isGoogle) {
      if (!password || !confirm) return setErr("Please set a password.");
      const errs = validatePassword(password);
      if (errs.length) return setErr("Password must include: " + errs.join(", ") + ".");
      if (password !== confirm) return setErr("Passwords do not match.");
    }
    if (!declared) return setErr("You must declare that your information is accurate to proceed.");

    // Always check duplicates from fresh Firestore data
    setRegLoading(true);
    const freshUsers = await fsGetCollection("bg_users");
    setRegLoading(false);
    if (freshUsers.find(u => u.email.toLowerCase() === email.toLowerCase())) return setErr("An account with this email already exists.");
    if (freshUsers.find(u => u.username?.toLowerCase() === username.toLowerCase())) return setErr("That username is already taken.");

    const p = gen12Phrase(), ref = genReferralCode();
    let referredBy = null;
    if (form.referral.trim()) { const ru = freshUsers.find(u => u.referralCode === form.referral.trim().toUpperCase()); if (ru) referredBy = ru.id; }

    const user = {
      id: Date.now(), name: `${firstName.trim()} ${lastName.trim()}`,
      firstName: firstName.trim(), lastName: lastName.trim(),
      username: username.trim(), email: email.trim().toLowerCase(),
      phone, currency, country, state, city, address,
      password: isGoogle ? null : password,
      googleUid: isGoogle ? googleUser.uid : null,
      authMethod: isGoogle ? "google" : "email",
      phrase: p, referralCode: ref, referredBy,
      investments: [], createdAt: Date.now(), manualBonus: 0,
    };

    // Write to Firestore directly
    await fsSetDoc("bg_users", String(user.id), user);
    if (referredBy) {
      const refUser = freshUsers.find(u => u.id === referredBy);
      if (refUser) await fsSetDoc("bg_users", String(referredBy), { ...refUser, manualBonus: (refUser.manualBonus || 0) + 10 });
    }

    const welcomeMsg = { id: Date.now()+1, userId: user.id, userName: user.name, text: `Welcome to BitGrow, ${user.firstName}! 🎉 Your account is now active. To get started, head to the Invest tab, select a plan, and send your deposit to our BSC wallet. Our team is here 24/7 if you need anything. — BitGrow Team`, from: "admin", time: new Date().toLocaleTimeString(), read: false };
    await fsSetDoc("bg_chats", String(welcomeMsg.id), welcomeMsg);

    // Update local state
    setUsers(prev => [...prev, user]);
    setMsgs(prev => [...prev, welcomeMsg]);
    setPhrase(p); setNewUser(user); setStep(3);
    sendWelcomeEmail(user);
  };

  const strength = form.password.length === 0 ? 0 : (4 - validatePassword(form.password).length);
  const strengthColor = ["#ef4444","#f59e0b","#fbbf24","#10b981","#10b981"][strength];
  const strengthLabel = ["","Weak","Fair","Good","Strong"][strength];

  // ── Step 3: Recovery phrase ──
  if (step === 3) return (
    <div className="fadein" style={{ minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 520, padding: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
          <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8, color: "#fbbf24" }}>Save Your Recovery Phrase</h2>
          <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 600 }}>⚠ This is shown ONCE. Write it down and store it safely.</p>
        </div>
        <div style={{ background: "#080910", border: "2px solid #fbbf2444", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {phrase.split(" ").map((w, i) => (
              <div key={i} style={{ background: "#111218", borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#4b5563", fontSize: 11, minWidth: 16 }}>{i + 1}.</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{w}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => copyPhrase(phrase)} style={{ width: "100%", background: phraseCopied ? "#10b98118" : "#fbbf2418", color: phraseCopied ? "#10b981" : "#fbbf24", border: `1px solid ${phraseCopied ? "#10b98155" : "#fbbf2455"}`, borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <CopyIcon /> {phraseCopied ? "✓ Copied!" : "Copy Phrase"}
        </button>
        <div style={{ background: "#0a0b12", border: "1px solid #1e2030", borderRadius: 10, padding: 14, fontSize: 12, color: "#6b7280", marginBottom: 20 }}>
          Your referral code: <strong style={{ color: "#fbbf24" }}>{newUser?.referralCode}</strong>
        </div>
        <button onClick={() => { setCurrentUser(newUser); navigate("dashboard"); }} style={{ width: "100%", background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#07080f", border: "none", padding: "14px", borderRadius: 10, fontWeight: 700, fontSize: 16 }}>
          I've saved my phrase — Continue →
        </button>
      </div>
    </div>
  );

  // ── Step 1: Choose sign-up method ──
  if (step === 1) return (
    <div className="fadein" style={{ minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 460, padding: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,#fbbf24,#f97316)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 24, color: "#07080f", margin: "0 auto 16px" }}>B</div>
          <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 6 }}>Create Account</h2>
          <p style={{ color: "#6b7280", fontSize: 13 }}>Join over 12,400 investors on BitGrow</p>
        </div>
        {err && <ErrBox msg={err} />}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: err ? 16 : 0 }}>
          <button onClick={handleGoogleSignIn} disabled={gLoading} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "13px 20px", fontSize: 15, fontWeight: 700, color: "#1f2937", cursor: gLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            {gLoading ? <div style={{ width: 20, height: 20, border: "2px solid #e5e7eb", borderTopColor: "#4285f4", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>}
            {gLoading ? "Connecting to Google..." : "Continue with Google"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "#1e2030" }} />
            <span style={{ color: "#374151", fontSize: 12, fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#1e2030" }} />
          </div>
          <button onClick={() => setStep(2)} style={{ width: "100%", background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#07080f", border: "none", padding: "13px 20px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            ✉️ Continue with Email
          </button>
          <div style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}>
            Already have an account? <span onClick={() => navigate("login")} style={{ color: "#fbbf24", cursor: "pointer", fontWeight: 600 }}>Sign In</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 2: Full questionnaire ──
  return (
    <div className="fadein" style={{ minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div className="card" style={{ width: "100%", maxWidth: 560, padding: 40 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,#fbbf24,#f97316)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 24, color: "#07080f", marginBottom: 16 }}>B</div>
          <h2 style={{ fontWeight: 800, fontSize: 26, marginBottom: 6 }}>Create Account</h2>
          <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>Fill in your details below to get started.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {err && <ErrBox msg={err} />}

          {/* ── FIX 3: Currency (syncs country) ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4 }}>Account Currency</label>
            <select value={form.currency} onChange={e => handleCurrencyChange(e.target.value)} style={{ background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "12px 14px", color: form.currency ? "#e8eaf0" : "#6b7280", fontSize: 14, appearance: "none" }}>
              <option value="">Select your currency</option>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Name row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="First Name" value={form.firstName} onChange={f("firstName")} placeholder="John" />
            <Input label="Last Name"  value={form.lastName}  onChange={f("lastName")}  placeholder="Doe"  />
          </div>

          <Input label="Email Address" value={form.email} onChange={f("email")} placeholder="john@example.com" type="email" />

          {/* ── FIX 3: Country (syncs currency + phone) ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4 }}>Country</label>
            <select value={form.country} onChange={e => handleCountryChange(e.target.value)} style={{ background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "12px 14px", color: form.country ? "#e8eaf0" : "#6b7280", fontSize: 14, appearance: "none" }}>
              <option value="">Select your country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* ── FIX 2: Phone with auto country code ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4 }}>
              Phone Number {form.country && COUNTRY_DATA[form.country]?.code && <span style={{ color: "#fbbf24", fontWeight: 700 }}>({COUNTRY_DATA[form.country].code})</span>}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder={form.country ? `${COUNTRY_DATA[form.country]?.code || ""} XXXXXXXXX` : "Select country first"}
              style={{ background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "12px 14px", color: "#e8eaf0", fontSize: 15, transition: "border .2s" }}
            />
            {form.phone && form.country && !validatePhone(form.phone, form.country) && (
              <div style={{ color: "#f59e0b", fontSize: 11 }}>⚠ Enter a valid phone number starting with {COUNTRY_DATA[form.country]?.code}</div>
            )}
          </div>

          {/* ── State dropdown from country ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4 }}>State / Province</label>
            {stateOptions.length > 0 ? (
              <select value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value, city: "" }))}
                style={{ background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "12px 14px", color: form.state ? "#e8eaf0" : "#6b7280", fontSize: 14, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", minHeight: 46 }}>
                <option value="">Select state / province</option>
                {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input value={form.state} onChange={f("state")} placeholder={form.country ? "Enter state / province" : "Select country first"} style={{ background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "12px 14px", color: "#e8eaf0", fontSize: 15 }} />
            )}
          </div>

          {/* ── City dropdown from state ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4 }}>City / LGA</label>
            {cityOptions.length > 0 ? (
              <select value={form.city} onChange={f("city")}
                style={{ background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "12px 14px", color: form.city ? "#e8eaf0" : "#6b7280", fontSize: 14, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", minHeight: 46 }}>
                <option value="">Select city / LGA</option>
                {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input value={form.city} onChange={f("city")} placeholder={form.state ? "Enter city" : "Select state first"} style={{ background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "12px 14px", color: "#e8eaf0", fontSize: 15 }} />
            )}
          </div>

          <Input label="Address" value={form.address} onChange={f("address")} placeholder="123 Main St, Apt 4B" />

          <div style={{ borderTop: "1px solid #1e2030", paddingTop: 6 }}>
            <p style={{ color: "#4b5563", fontSize: 11, textTransform: "uppercase", letterSpacing: .5, fontWeight: 600 }}>Account Credentials</p>
          </div>

          {googleUser && (
            <div style={{ background: "#10b98115", border: "1px solid #10b98144", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#10b981" }}>✓ Google Account Connected</div>
                <div style={{ fontSize: 11, color: "#4b5563" }}>{googleUser.email} — no password needed</div>
              </div>
            </div>
          )}

          <Input label="Username" value={form.username} onChange={f("username")} placeholder="johndoe" />
          <Input label="Referral Code (optional)" value={form.referral} onChange={f("referral")} placeholder="e.g. BGXYZ123" />

          {!googleUser && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Input label="Password" value={form.password} onChange={f("password")} placeholder="Min 8 chars, uppercase, number, symbol" type="password" />
                {form.password.length > 0 && (
                  <div>
                    <div style={{ display: "flex", gap: 4, marginTop: 6, marginBottom: 4 }}>{[0,1,2,3].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < strength ? strengthColor : "#1e2030" }} />)}</div>
                    <div style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</div>
                  </div>
                )}
              </div>
              <Input label="Confirm Password" value={form.confirm} onChange={f("confirm")} placeholder="Re-enter password" type="password" />
            </>
          )}

          <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", background: "#080910", border: `1px solid ${form.declared ? "#fbbf2466" : "#1e2030"}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ position: "relative", flexShrink: 0, marginTop: 1 }}>
              <input type="checkbox" checked={form.declared} onChange={f("declared")} style={{ opacity: 0, position: "absolute", width: 18, height: 18, cursor: "pointer" }} />
              <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${form.declared ? "#fbbf24" : "#374151"}`, background: form.declared ? "#fbbf24" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {form.declared && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#07080f" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
            </div>
            <span style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>I declare that the information provided is accurate and I am at least 18 years old. I agree to the <span style={{ color: "#fbbf24" }}>Terms of Service</span> and <span style={{ color: "#fbbf24" }}>Privacy Policy</span>.</span>
          </label>

          <LoadingBtn onClick={submit} loading={regLoading}>Create My Account →</LoadingBtn>
          <div style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}>Already have an account? <span onClick={() => navigate("login")} style={{ color: "#fbbf24", cursor: "pointer", fontWeight: 600 }}>Sign In</span></div>
        </div>
      </div>
    </div>
  );
}

function LoginPage({ users, setCurrentUser, navigate }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [gLoading, setGLoading] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const [loginLoading, setLoginLoading] = useState(false);
  const submit = async () => {
    setErr(""); setLoginLoading(true);
    // Always fetch fresh from Firestore so credentials are cross-device accurate
    const freshUsers = await fsGetCollection("bg_users");
    const user = freshUsers.find(u => u.email.toLowerCase() === form.email.toLowerCase() && u.password === form.password);
    setLoginLoading(false);
    if (!user) return setErr("Incorrect email or password.");
    const { _docId, ...cleanUser } = user;
    setCurrentUser(cleanUser); navigate("dashboard");
  };

  const handleGoogleLogin = async () => {
    setErr(""); setGLoading(true);
    try {
      const gUser = await signInWithGoogle();
      // Fetch fresh from Firestore — cross-device
      const freshUsers = await fsGetCollection("bg_users");
      const existing = freshUsers.find(u => u.googleUid === gUser.uid || u.email.toLowerCase() === gUser.email.toLowerCase());
      if (!existing) { setErr("No account found. Please sign up first."); setGLoading(false); return; }
      const { _docId, ...cleanUser } = existing;
      setCurrentUser(cleanUser); navigate("dashboard");
    } catch (e) { setErr("Google Sign-In failed: " + e.message); }
    setGLoading(false);
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your BitGrow account" navigate={navigate}>
      {err && <ErrBox msg={err} />}
      <button onClick={handleGoogleLogin} disabled={gLoading} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 700, color: "#1f2937", cursor: gLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        {gLoading ? <div style={{ width: 18, height: 18, border: "2px solid #e5e7eb", borderTopColor: "#4285f4", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
        {gLoading ? "Connecting..." : "Continue with Google"}
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: "#1e2030" }} />
        <span style={{ color: "#374151", fontSize: 12, fontWeight: 600 }}>OR</span>
        <div style={{ flex: 1, height: 1, background: "#1e2030" }} />
      </div>
      <Input label="Email Address" value={form.email} onChange={f("email")} placeholder="you@example.com" type="email" />
      <Input label="Password" value={form.password} onChange={f("password")} placeholder="••••••••" type="password" />
      <LoadingBtn onClick={submit} loading={loginLoading}>Sign In</LoadingBtn>
      <div style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}>New to BitGrow? <span onClick={() => navigate("register")} style={{ color: "#fbbf24", cursor: "pointer", fontWeight: 600 }}>Create an account</span></div>
      <div style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}>Forgot access? <span onClick={() => navigate("recover")} style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }}>Recover with 12-phrase key</span></div>
    </AuthLayout>
  );
}

function RecoverPage({ users, setCurrentUser, navigate }) {
  const [phrase, setPhrase] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const submit = async () => {
    setErr("");
    // Fetch fresh from Firestore
    const freshUsers = await fsGetCollection("bg_users");
    const user = freshUsers.find(u => u.phrase === phrase.trim().toLowerCase());
    if (!user) return setErr("Recovery phrase not recognised.");
    const errs = validatePassword(newPw);
    if (errs.length) return setErr("Password must include: " + errs.join(", ") + ".");
    if (newPw !== confirm) return setErr("Passwords do not match.");
    const updated = { ...user, password: newPw };
    const { _docId, ...data } = updated;
    await fsSetDoc("bg_users", String(user.id), data);
    setCurrentUser(data); setDone(true);
  };
  if (done) return (
    <AuthLayout title="Account Recovered" subtitle="You're back!" navigate={navigate}>
      <div style={{ textAlign: "center", fontSize: 40, marginBottom: 8 }}>✅</div>
      <p style={{ textAlign: "center", color: "#9ca3af", marginBottom: 16 }}>Account recovered. Sign in with your new password.</p>
      <PrimaryBtn onClick={() => navigate("login")}>Go to Sign In</PrimaryBtn>
    </AuthLayout>
  );
  return (
    <AuthLayout title="Recover Account" subtitle="Enter your 12-phrase recovery key" navigate={navigate}>
      {err && <ErrBox msg={err} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4 }}>12-Phrase Recovery Key</label>
        <textarea value={phrase} onChange={e => setPhrase(e.target.value)} placeholder="Enter your 12 words separated by spaces..." style={{ background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "12px 14px", color: "#e8eaf0", fontSize: 14, resize: "vertical", minHeight: 80 }} />
      </div>
      <Input label="New Password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password" type="password" />
      <Input label="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter new password" type="password" />
      <PrimaryBtn onClick={submit}>Recover Account</PrimaryBtn>
    </AuthLayout>
  );
}

function AuthLayout({ title, subtitle, children, navigate }) {
  return (
    <div className="fadein" style={{ minHeight: "82vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 440, padding: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,#fbbf24,#f97316)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 24, color: "#07080f", margin: "0 auto 14px" }}>B</div>
          <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 6 }}>{title}</h2>
          <p style={{ color: "#6b7280", fontSize: 13 }}>{subtitle}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ currentUser, users, updateUsers, msgs, updateMsgs, withdraws, updateWithdraws, dashTab, setDashTab }) {
  const [tab, setTabLocal] = useState(dashTab || "overview");
  const setTab = t => { setTabLocal(t); setDashTab(t); };
  useEffect(() => { setTabLocal(dashTab); }, [dashTab]);
  const [chatOpen, setChatOpen] = useState(false);
  const [, setTick] = useState(0);
  const user = users.find(u => u.id === currentUser.id) || currentUser;
  const investments = user.investments || [];
  const activeInv = investments.filter(i => i.status === "active" || i.status === "verified");
  const totalInvested = activeInv.reduce((s, i) => s + (i.amount || 0), 0);
  const investmentBalance = activeInv.reduce((s, i) => s + calcBalance(i), 0);
  const totalBalance = +(investmentBalance + (user.manualBonus || 0)).toFixed(2);
  const totalProfit = +(totalBalance - totalInvested).toFixed(2);
  const myChats = msgs.filter(m => m.userId === user.id);
  const myWithdraws = withdraws.filter(w => w.userId === user.id);
  const referrals = users.filter(u => u.referredBy === user.id);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 15000); return () => clearInterval(id); }, []);
  const sendChat = async msg => {
    const newMsg = { id: Date.now(), userId: user.id, userName: user.name, text: msg, from: "user", time: new Date().toLocaleTimeString(), read: false };
    await fsSetDoc("bg_chats", String(newMsg.id), newMsg);
    setMsgs(prev => [...prev, newMsg]);
  };

  return (
    <div className="fadein" style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 16px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,#fbbf24,#f97316)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: "#07080f" }}>{user.name[0].toUpperCase()}</div>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 22 }}>Hello, {user.name.split(" ")[0]} 👋</h1>
            <p style={{ color: "#6b7280", fontSize: 12 }}>{user.email} · Ref: <span style={{ color: "#fbbf24", fontWeight: 600 }}>{user.referralCode}</span></p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", overflowX: "auto", paddingBottom: 4 }}>
          {["overview","invest","withdraw","history","referrals"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "linear-gradient(135deg,#fbbf24,#f97316)" : "#111218", color: tab === t ? "#07080f" : "#6b7280", border: tab === t ? "none" : "1px solid #1e2030", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>{t}</button>
          ))}
        </div>
      </div>
      {tab === "overview"  && <OverviewTab  user={user} totalBalance={totalBalance} totalInvested={totalInvested} totalProfit={totalProfit} activeInv={activeInv} myWithdraws={myWithdraws} setTab={setTab} />}
      {tab === "invest"    && <InvestTab    user={user} users={users} updateUsers={updateUsers} />}
      {tab === "withdraw"  && <WithdrawTab  user={user} totalBalance={totalBalance} withdraws={withdraws} updateWithdraws={updateWithdraws} myWithdraws={myWithdraws} activeInv={activeInv} />}
      {tab === "history"   && <HistoryTab   activeInv={activeInv} myWithdraws={myWithdraws} />}
      {tab === "referrals" && <ReferralsTab user={user} referrals={referrals} />}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 300 }}>
        {chatOpen && <ChatWidget user={user} chats={myChats} onSend={sendChat} />}
        <button onClick={() => setChatOpen(o => !o)} style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#fbbf24,#f97316)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 8px 28px rgba(251,191,36,0.4)", color: "#07080f", marginTop: 8 }}>{chatOpen ? "✕" : "💬"}</button>
      </div>
    </div>
  );
}

function OverviewTab({ user, totalBalance, totalInvested, totalProfit, activeInv, myWithdraws, setTab }) {
  const isNew = activeInv.length === 0;
  return (
    <div>
      {isNew && (
        <div className="fadein" style={{ background: "linear-gradient(135deg,#1a1400,#1a0d00)", border: "1px solid #fbbf2433", borderRadius: 16, padding: 28, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 36 }}>🚀</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 8, color: "#fbbf24" }}>Welcome to BitGrow, {user.firstName || user.name?.split(" ")[0]}!</h3>
              <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>Your account is set up and ready. Follow these 3 steps to activate your investment.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                {[["1","Choose a Plan","Select the tier that fits your goals"],["2","Send Deposit","Transfer to our BSC wallet & paste TxID"],["3","Get Verified","Admin confirms & your balance activates"]].map(([n,t,d])=>(
                  <div key={n} style={{ flex: 1, minWidth: 140, background: "#07080f", borderRadius: 10, padding: "12px 14px", border: "1px solid #1e2030" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#fbbf24,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, color: "#07080f", marginBottom: 8 }}>{n}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t}</div>
                    <div style={{ color: "#4b5563", fontSize: 11, lineHeight: 1.5 }}>{d}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setTab("invest")} style={{ background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#07080f", border: "none", padding: "11px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Start Investing Now →</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Portfolio Value", value: usd(totalBalance), color: "#fbbf24", sub: activeInv.length > 0 ? `${activeInv.length} active investment${activeInv.length > 1 ? "s" : ""}` : "No active investments", icon: "💼" },
          { label: "Total Invested",  value: usd(totalInvested), color: "#6366f1", sub: "Principal deposited", icon: "📥" },
          { label: "Total Returns",   value: usd(totalProfit), color: totalProfit > 0 ? "#10b981" : "#6b7280", sub: totalInvested > 0 ? `${totalProfit >= 0 ? "+" : ""}${((totalProfit / totalInvested) * 100).toFixed(2)}% overall return` : "Awaiting investment", icon: "📈" },
        ].map(m => (
          <div key={m.label} className="card" style={{ padding: 22, borderLeft: `3px solid ${m.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ color: "#4b5563", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>{m.label}</span>
              <span style={{ fontSize: 20 }}>{m.icon}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 24, color: m.color, marginBottom: 4 }}>{m.value}</div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>{m.sub}</div>
          </div>
        ))}
      </div>
      {activeInv.length > 0 ? (
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📊 Active Investments</h3>
          {activeInv.map((inv, i) => {
            const p = getPlan(inv.amount); const bal = calcBalance(inv); const gain = +(bal - inv.amount).toFixed(2);
            return (
              <div key={i} style={{ background: "#080910", borderRadius: 12, padding: 16, border: `1px solid ${p?.color || "#1e2030"}22`, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{p?.badge}</span>
                    <div><span style={{ fontWeight: 700, color: p?.color }}>{p?.name} Plan</span><div style={{ color: "#4b5563", fontSize: 11 }}>{new Date(inv.startedAt).toLocaleDateString()}</div></div>
                  </div>
                  <StatusBadge status={inv.verifiedAt ? "verified" : "pending_verification"} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8 }}>
                  {[["Deposited",usd(inv.amount),"#9ca3af"],["Current Value",usd(bal),"#fbbf24"],["Returns",usd(gain),gain > 0 ? "#10b981" : "#6b7280"],["TxID",inv.txid?.slice(0,12)+"...","#4b5563"]].map(([l,v,c]) => (
                    <div key={l} style={{ background: "#0f1117", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ color: "#4b5563", fontSize: 10, marginBottom: 3, textTransform: "uppercase" }}>{l}</div>
                      <div style={{ fontWeight: 700, color: c, fontSize: 13 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 48, textAlign: "center", border: "1px dashed #1e2030", marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, background: "#fbbf2412", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px", border: "1px solid #fbbf2433" }}>₿</div>
          <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 10 }}>No Active Investment</h3>
          <p style={{ color: "#6b7280", marginBottom: 24, maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.7 }}>Select a plan and submit your deposit to start tracking your portfolio returns.</p>
          <button onClick={() => setTab("invest")} style={{ background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#07080f", border: "none", padding: "12px 32px", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>Start Investing →</button>
        </div>
      )}
    </div>
  );
}



function InvestTab({ user, users, updateUsers }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [amount, setAmount] = useState("");
  const [txid, setTxid] = useState("");
  const [addrCopied, copyAddr] = useCopy();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (!selectedPlan) return setErr("Please select an investment plan.");
    if (!amount || isNaN(amount) || +amount < MIN_INVEST) return setErr(`Minimum investment is ${usd(MIN_INVEST)}.`);
    const p = getPlan(+amount);
    if (!p || p.id !== selectedPlan.id) return setErr(`Amount is outside the ${selectedPlan.name} range.`);
    if (!txid.trim()) return setErr("Please enter your BSC Transaction ID.");
    setLoading(true);
    const inv = { id: Date.now(), amount: +amount, txid: txid.trim(), plan: p.id, startedAt: Date.now(), status: "pending_verification", verifiedAt: null };
    await updateUsers(users.map(u => u.id === user.id ? { ...u, investments: [...(u.investments || []), inv] } : u));
    setLoading(false); setSubmitted(true);
  };

  if (submitted) return (
    <div className="card fadein" style={{ maxWidth: 520, margin: "0 auto", padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
      <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 10, color: "#f59e0b" }}>Awaiting Verification</h2>
      <p style={{ color: "#9ca3af", lineHeight: 1.8, marginBottom: 16 }}>Your investment of <strong style={{ color: "#fbbf24" }}>{usd(+amount)}</strong> has been submitted.</p>
      <button onClick={() => setSubmitted(false)} style={{ background: "#111218", color: "#e8eaf0", border: "1px solid #1e2030", padding: "10px 24px", borderRadius: 10, fontWeight: 600 }}>Submit Another</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <StepHeader n="1" title="Select Investment Plan" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(138px,1fr))", gap: 10 }}>
          {PLANS.map(p => (
            <div key={p.id} onClick={() => { setSelectedPlan(p); setAmount(""); }} style={{ border: `2px solid ${selectedPlan?.id === p.id ? p.color : "#1e2030"}`, borderRadius: 12, padding: 16, cursor: "pointer", background: selectedPlan?.id === p.id ? p.color + "12" : "#0f1117" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{p.badge}</div>
              <div style={{ fontWeight: 700, color: selectedPlan?.id === p.id ? p.color : "#e8eaf0", marginBottom: 2 }}>{p.name}</div>
              <div style={{ color: "#6b7280", fontSize: 11 }}>{p.max === Infinity ? `$${p.min.toLocaleString()}+` : `$${p.min.toLocaleString()}–$${p.max.toLocaleString()}`}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <StepHeader n="2" title="Send Deposit to Wallet" />
        <div className="card" style={{ padding: 24, border: "1px solid #fbbf2422" }}>
          <div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fbbf24", fontWeight: 700, marginBottom: 10, fontSize: 13 }}><BtcIcon /> Only send Bitcoin (BTC) assets to this address. Other assets will be lost forever</div>
              <div style={{ background: "#080910", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 11, color: "#e8eaf0", wordBreak: "break-all", lineHeight: 1.9, marginBottom: 12, border: "1px solid #1e2030" }}>{BITCOIN_ADDRESS}</div>
              <button onClick={() => copyAddr(BITCOIN_ADDRESS)} style={{ width: "100%", background: addrCopied ? "#10b98118" : "#fbbf2418", color: addrCopied ? "#10b981" : "#fbbf24", border: `1px solid ${addrCopied ? "#10b98155" : "#fbbf2455"}`, padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <CopyIcon /> {addrCopied ? "✓ Copied!" : "Copy Address"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <StepHeader n="3" title="Confirm Your Deposit" />
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {err && <ErrBox msg={err} />}
          {selectedPlan && (
            <div style={{ background: selectedPlan.color + "12", border: `1px solid ${selectedPlan.color}33`, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ color: selectedPlan.color, fontWeight: 700 }}>{selectedPlan.badge} {selectedPlan.name} Plan</span>
              <span style={{ color: "#9ca3af", fontSize: 13 }}>${selectedPlan.min.toLocaleString()}–{selectedPlan.max === Infinity ? selectedPlan.min.toLocaleString() + "+" : "$" + selectedPlan.max.toLocaleString()}</span>
            </div>
          )}
          <Input label="Investment Amount (USD)" value={amount} onChange={e => setAmount(e.target.value)} placeholder={selectedPlan ? `Min $${selectedPlan.min.toLocaleString()}` : `Min $${MIN_INVEST}`} type="number" />
          <Input label="BTC Transaction ID (TxID)" value={txid} onChange={e => setTxid(e.target.value)} placeholder="Paste your transaction hash after sending" />
          <LoadingBtn onClick={submit} loading={loading}>Submit for Verification</LoadingBtn>
        </div>
      </div>
    </div>
  );
}

function WithdrawTab({ user, totalBalance, withdraws, updateWithdraws, myWithdraws, activeInv }) {
  const [wForm, setWForm] = useState({ amount: "", wallet: "", network: "BSC (BEP20)" });
  const [wErr, setWErr] = useState("");
  const [wDone, setWDone] = useState(false);
  const [wLoading, setWLoading] = useState(false);
  const fw = k => e => setWForm(p => ({ ...p, [k]: e.target.value }));
  const pendingTotal = myWithdraws.filter(w => w.status === "pending").reduce((s, w) => s + w.amount, 0);
  const available = Math.max(0, +(totalBalance - pendingTotal).toFixed(2));
  const earliest = activeInv.find(i => i.verifiedAt);
  const withdrawUnlocked = activeInv.some(i => canWithdraw(i));
  const daysLeft = earliest ? daysUntilWithdraw(earliest) : WITHDRAW_LOCK_DAYS;

  const submit = async () => {
    setWErr("");
    if (!withdrawUnlocked) return setWErr(`Withdrawal locked for ${daysLeft} more day${daysLeft !== 1 ? "s" : ""}.`);
    if (!wForm.amount || isNaN(wForm.amount) || +wForm.amount <= 0) return setWErr("Enter a valid amount.");
    if (+wForm.amount < MIN_WITHDRAW) return setWErr(`Minimum withdrawal is ${usd(MIN_WITHDRAW)}.`);
    if (+wForm.amount > available) return setWErr(`Insufficient balance. Available: ${usd(available)}`);
    if (!wForm.wallet.trim()) return setWErr("Enter your destination wallet address.");
    setWLoading(true);
    await updateWithdraws([...withdraws, { id: Date.now(), userId: user.id, userName: user.name, amount: +wForm.amount, wallet: wForm.wallet.trim(), network: wForm.network, status: "pending", createdAt: Date.now() }]);
    setWLoading(false); setWDone(true);
  };

  if (wDone) return (
    <div className="card fadein" style={{ maxWidth: 520, margin: "0 auto", padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontWeight: 800, fontSize: 22, color: "#10b981", marginBottom: 10 }}>Withdrawal Submitted</h2>
      <p style={{ color: "#9ca3af", lineHeight: 1.8, marginBottom: 24 }}>Your request of <strong style={{ color: "#fbbf24" }}>{usd(+wForm.amount)}</strong> is under review.</p>
      <button onClick={() => setWDone(false)} style={{ background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#07080f", border: "none", padding: "12px 28px", borderRadius: 10, fontWeight: 700 }}>New Request</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 580, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20, borderTop: "3px solid #fbbf24" }}><div style={{ color: "#4b5563", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Portfolio Value</div><div style={{ fontWeight: 800, fontSize: 22, color: "#fbbf24" }}>{usd(totalBalance)}</div></div>
        <div className="card" style={{ padding: 20, borderTop: "3px solid #10b981" }}><div style={{ color: "#4b5563", fontSize: 11, marginBottom: 6, textTransform: "uppercase" }}>Available</div><div style={{ fontWeight: 800, fontSize: 22, color: "#10b981" }}>{usd(available)}</div></div>
      </div>
      {!withdrawUnlocked && (
        <div className="card" style={{ padding: 24, marginBottom: 16, textAlign: "center", border: "1px solid #f59e0b44" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
          <h3 style={{ fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>Withdrawal Locked</h3>
          <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.7 }}>Withdrawals available after a <strong>3-month maturity period</strong>. {earliest ? <>Unlocks in <strong style={{ color: "#fbbf24" }}>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>.</> : "Invest and get verified to start the countdown."}</p>
        </div>
      )}
      <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18, opacity: withdrawUnlocked ? 1 : 0.5 }}>
        <div><h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>💸 Request Withdrawal</h2><p style={{ color: "#6b7280", fontSize: 13 }}>Minimum: <strong>{usd(MIN_WITHDRAW)}</strong></p></div>
        {wErr && <ErrBox msg={wErr} />}
        <Input label="Withdrawal Amount (USD)" value={wForm.amount} onChange={fw("amount")} placeholder={`Min. ${usd(MIN_WITHDRAW)}`} type="number" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4 }}>Network</label>
          <select value={wForm.network} onChange={fw("network")} style={{ background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "12px 14px", color: "#e8eaf0", fontSize: 14 }}>
            <option>BSC (BEP20)</option><option>Ethereum (ERC20)</option><option>TRON (TRC20)</option><option>Bitcoin (BTC)</option>
          </select>
        </div>
        <Input label="Destination Wallet Address" value={wForm.wallet} onChange={fw("wallet")} placeholder="Paste your wallet address" />
        <LoadingBtn onClick={submit} loading={wLoading}>Submit Withdrawal Request</LoadingBtn>
      </div>
    </div>
  );
}

function HistoryTab({ activeInv, myWithdraws }) {
  return (
    <div className="fadein">
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📥 Investment History</h3>
        {activeInv.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid #1e2030" }}>{["Date","Plan","Deposited","TxID","Status"].map(h => <th key={h} style={{ padding: "10px 12px", color: "#4b5563", fontWeight: 600, textAlign: "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {activeInv.map((inv, i) => { const p = getPlan(inv.amount); return (
                  <tr key={i} style={{ borderBottom: "1px solid #1e203033" }}>
                    <td style={{ padding: 12 }}>{new Date(inv.startedAt).toLocaleDateString()}</td>
                    <td style={{ padding: 12 }}><span style={{ color: p?.color, fontWeight: 600 }}>{p?.badge} {p?.name}</span></td>
                    <td style={{ padding: 12, color: "#fbbf24", fontWeight: 700 }}>{usd(inv.amount)}</td>
                    <td style={{ padding: 12, fontFamily: "monospace", fontSize: 10, color: "#4b5563" }}>{inv.txid?.slice(0,16)}...</td>
                    <td style={{ padding: 12 }}><StatusBadge status={inv.verifiedAt ? "verified" : "pending_verification"} /></td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        ) : <p style={{ color: "#4b5563", textAlign: "center", padding: 32 }}>No investment history yet.</p>}
      </div>
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>💸 Withdrawal History</h3>
        {myWithdraws.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid #1e2030" }}>{["Date","Amount","Network","Status"].map(h => <th key={h} style={{ padding: "10px 12px", color: "#4b5563", fontWeight: 600, textAlign: "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {myWithdraws.map(w => (
                  <tr key={w.id} style={{ borderBottom: "1px solid #1e203033" }}>
                    <td style={{ padding: 12 }}>{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: 12, color: "#fbbf24", fontWeight: 700 }}>{usd(w.amount)}</td>
                    <td style={{ padding: 12, color: "#6b7280", fontSize: 12 }}>{w.network}</td>
                    <td style={{ padding: 12 }}><StatusBadge status={w.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p style={{ color: "#4b5563", textAlign: "center", padding: 32 }}>No withdrawal requests yet.</p>}
      </div>
    </div>
  );
}

function ReferralsTab({ user, referrals }) {
  const [refCopied, copyRef] = useCopy();
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }} className="fadein">
      <div className="card" style={{ padding: 28, marginBottom: 16, textAlign: "center", borderTop: "3px solid #fbbf24" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
        <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Your Referral Code</h3>
        <div style={{ background: "#080910", border: "2px solid #fbbf2444", borderRadius: 12, padding: "20px", fontSize: 28, fontWeight: 800, color: "#fbbf24", letterSpacing: 4, marginBottom: 16 }}>{user.referralCode}</div>
        <button onClick={() => copyRef(user.referralCode)} style={{ background: refCopied ? "#10b98118" : "#fbbf2418", color: refCopied ? "#10b981" : "#fbbf24", border: `1px solid ${refCopied ? "#10b98155" : "#fbbf2455"}`, borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14, marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <CopyIcon /> {refCopied ? "✓ Copied!" : "Copy Code"}
        </button>
        <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.7 }}>Share your code — when friends sign up and invest, <strong style={{ color: "#fbbf24" }}>you earn a $10 bonus</strong>.</p>
      </div>
      <div className="card" style={{ padding: 24 }}>
        <h4 style={{ fontWeight: 700, marginBottom: 16 }}>Referred Users ({referrals.length})</h4>
        {referrals.length > 0 ? referrals.map(r => (
          <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#080910", borderRadius: 10, padding: "12px 16px", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
            <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ color: "#6b7280", fontSize: 12 }}>{r.email}</div></div>
            <span style={{ background: "#10b98118", color: "#10b981", borderRadius: 100, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>+$10 earned</span>
          </div>
        )) : <p style={{ color: "#4b5563", textAlign: "center", padding: 24 }}>No referrals yet.</p>}
      </div>
    </div>
  );
}

function ChatWidget({ user, chats, onSend }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chats]);
  const send = () => { if (!input.trim()) return; onSend(input.trim()); setInput(""); };
  return (
    <div className="fadein" style={{ width: 320, height: 420, display: "flex", flexDirection: "column", background: "#0f1117", border: "1px solid #1e2030", borderRadius: 16, marginBottom: 10, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", overflow: "hidden" }}>
      <div style={{ padding: "13px 16px", background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#07080f", fontWeight: 700, fontSize: 14, display: "flex", justifyContent: "space-between" }}>
        <span>💬 BitGrow Support</span><span style={{ fontSize: 11, opacity: .75 }}>● Online</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ background: "#1a1d2e", borderRadius: 12, padding: "10px 14px", fontSize: 13, alignSelf: "flex-start", maxWidth: "82%" }}>👋 Hi {user.name.split(" ")[0]}! How can we assist you?</div>
        {chats.map(c => <div key={c.id} style={{ background: c.from === "user" ? "linear-gradient(135deg,#fbbf24,#f97316)" : "#1a1d2e", color: c.from === "user" ? "#07080f" : "#e8eaf0", borderRadius: 12, padding: "10px 14px", fontSize: 13, alignSelf: c.from === "user" ? "flex-end" : "flex-start", maxWidth: "82%" }}>{c.text}</div>)}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: 10, borderTop: "1px solid #1e2030", display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message..." style={{ flex: 1, background: "#080910", border: "1px solid #1e2030", borderRadius: 8, padding: "8px 12px", color: "#e8eaf0", fontSize: 13 }} />
        <button onClick={send} style={{ background: "linear-gradient(135deg,#fbbf24,#f97316)", border: "none", borderRadius: 8, padding: "8px 14px", color: "#07080f", fontWeight: 700 }}>→</button>
      </div>
    </div>
  );
}

function AdminLogin({ navigate }) {
  return (
    <div className="fadein" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 400, padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Restricted Access</h2>
        <button onClick={() => navigate("login")} style={{ width: "100%", background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#07080f", border: "none", padding: "14px", borderRadius: 10, fontWeight: 700, fontSize: 16 }}>Go to Sign In</button>
      </div>
    </div>
  );
}

function AdminPanel({ users, updateUsers, msgs, updateMsgs, withdraws, updateWithdraws }) {
  const [tab, setTab] = useState("verify");
  const [selected, setSelected] = useState(null);
  const [bonusAmt, setBonusAmt] = useState("");
  const [replyText, setReplyText] = useState("");
  const [search, setSearch] = useState("");
  const pendingInvestments = users.flatMap(u => (u.investments || []).filter(i => i.status === "pending_verification").map(i => ({ ...i, user: u })));
  const pendingWithdraws = withdraws.filter(w => w.status === "pending");
  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const verifyInvestment = async (uid, iid) => { await updateUsers(users.map(u => u.id === uid ? { ...u, investments: (u.investments || []).map(i => i.id === iid ? { ...i, status: "verified", verifiedAt: Date.now() } : i) } : u)); };
  const rejectInvestment = async (uid, iid) => { await updateUsers(users.map(u => u.id === uid ? { ...u, investments: (u.investments || []).map(i => i.id === iid ? { ...i, status: "rejected" } : i) } : u)); };
  const applyBonus = async (uid, amt) => { await updateUsers(users.map(u => u.id === uid ? { ...u, manualBonus: (u.manualBonus || 0) + +amt } : u)); setBonusAmt(""); alert(`Adjustment of ${usd(+amt)} applied!`); };
  const replyMsg = async (uid, uname) => { if (!replyText.trim()) return; await updateMsgs([...msgs, { id: Date.now(), userId: uid, userName: uname, text: replyText.trim(), from: "admin", time: new Date().toLocaleTimeString(), read: false }]); setReplyText(""); };
  const updateW = async (wid, status) => { await updateWithdraws(withdraws.map(w => w.id === wid ? { ...w, status, processedAt: Date.now() } : w)); };

  const adminTabs = [{ id: "verify", label: "Verify", badge: pendingInvestments.length }, { id: "withdrawals", label: "Withdrawals", badge: pendingWithdraws.length }, { id: "users", label: "Users", badge: 0 }, { id: "chats", label: "Chats", badge: 0 }, { id: "stats", label: "Stats", badge: 0 }];

  return (
    <div className="fadein" style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div><h1 style={{ fontWeight: 800, fontSize: 22 }}>⚙️ Admin Control Panel</h1><p style={{ color: "#6b7280", fontSize: 13 }}>BitGrow Internal Management</p></div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {adminTabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ position: "relative", background: tab === t.id ? "linear-gradient(135deg,#fbbf24,#f97316)" : "#111218", color: tab === t.id ? "#07080f" : "#6b7280", border: tab === t.id ? "none" : "1px solid #1e2030", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
              {t.label}{t.badge > 0 && <span style={{ position: "absolute", top: -7, right: -7, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {tab === "verify" && (
        <div>
          {pendingInvestments.length === 0 ? <div className="card" style={{ padding: 48, textAlign: "center", color: "#4b5563" }}><div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>No pending verifications.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingInvestments.map(inv => {
                const p = getPlan(inv.amount);
                return (
                  <div key={inv.id} className="card" style={{ padding: 20, borderLeft: "4px solid #f59e0b" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#fbbf24,#f97316)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#07080f" }}>{inv.user.name[0]}</div>
                          <div><div style={{ fontWeight: 700 }}>{inv.user.name}</div><div style={{ color: "#6b7280", fontSize: 12 }}>{inv.user.email}</div></div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginBottom: 10 }}>
                          {[["Amount",usd(inv.amount),"#fbbf24"],["Plan",`${p?.badge} ${p?.name}`,p?.color||"#9ca3af"],["Date",new Date(inv.startedAt).toLocaleDateString(),"#6b7280"]].map(([l,v,c]) => (
                            <div key={l} style={{ background: "#080910", borderRadius: 8, padding: "8px 12px" }}><div style={{ color: "#4b5563", fontSize: 10, marginBottom: 2 }}>{l.toUpperCase()}</div><div style={{ color: c, fontWeight: 600, fontSize: 13 }}>{v}</div></div>
                          ))}
                        </div>
                        <div style={{ background: "#080910", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ color: "#4b5563", fontSize: 10, marginBottom: 2 }}>TRANSACTION ID</div>
                          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#fbbf24", wordBreak: "break-all" }}>{inv.txid}</div>
                          <a href={`https://bscscan.com/tx/${inv.txid}`} target="_blank" rel="noreferrer" style={{ color: "#6366f1", fontSize: 11, marginTop: 4, display: "inline-block" }}>🔍 View on BSCScan →</a>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 130 }}>
                        <StatusBadge status="pending_verification" />
                        <button onClick={() => verifyInvestment(inv.user.id, inv.id)} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", fontWeight: 700, fontSize: 13 }}>✅ Verify & Activate</button>
                        <button onClick={() => rejectInvestment(inv.user.id, inv.id)} style={{ background: "#ef444418", color: "#ef4444", border: "1px solid #ef444455", borderRadius: 8, padding: "10px 14px", fontWeight: 700, fontSize: 13 }}>✕ Reject</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "withdrawals" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
            {[{ l:"Pending",v:pendingWithdraws.length,c:"#f59e0b" },{ l:"Paid",v:withdraws.filter(w=>w.status==="paid").length,c:"#10b981" },{ l:"Total",v:usd(withdraws.reduce((s,w)=>s+w.amount,0)),c:"#6366f1" }].map(s => (
              <div key={s.l} className="card" style={{ padding: 18, borderTop: `3px solid ${s.c}` }}><div style={{ color: "#4b5563", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>{s.l}</div><div style={{ fontWeight: 800, fontSize: 22, color: s.c }}>{s.v}</div></div>
            ))}
          </div>
          {withdraws.length === 0 ? <div className="card" style={{ padding: 48, textAlign: "center", color: "#4b5563" }}>No requests yet.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[...withdraws].sort((a,b) => b.createdAt - a.createdAt).map(w => {
                const wu = users.find(u => u.id === w.userId);
                const sc = { pending:"#f59e0b",approved:"#6366f1",paid:"#10b981",rejected:"#ef4444" }[w.status]||"#f59e0b";
                return (
                  <div key={w.id} className="card" style={{ padding: 20, borderLeft: `4px solid ${sc}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#fbbf24,#f97316)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#07080f" }}>{w.userName[0]}</div>
                          <div><div style={{ fontWeight: 700 }}>{w.userName}</div><div style={{ color: "#6b7280", fontSize: 12 }}>{wu?.email}</div></div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginBottom: 8 }}>
                          {[["Amount",usd(w.amount),"#fbbf24"],["Network",w.network,"#9ca3af"],["Date",new Date(w.createdAt).toLocaleString(),"#6b7280"]].map(([l,v,c]) => (
                            <div key={l} style={{ background: "#080910", borderRadius: 8, padding: "8px 12px" }}><div style={{ color: "#4b5563", fontSize: 10 }}>{l.toUpperCase()}</div><div style={{ color: c, fontWeight: 600, fontSize: 13 }}>{v}</div></div>
                          ))}
                        </div>
                        <div style={{ background: "#080910", borderRadius: 8, padding: "8px 12px" }}><div style={{ color: "#4b5563", fontSize: 10, marginBottom: 2 }}>WALLET</div><div style={{ fontFamily: "monospace", fontSize: 11, color: "#e8eaf0", wordBreak: "break-all" }}>{w.wallet}</div></div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 130 }}>
                        <StatusBadge status={w.status} />
                        {w.status === "pending" && <>
                          <button onClick={() => updateW(w.id,"approved")} style={{ background: "#6366f118", color: "#6366f1", border: "1px solid #6366f155", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13 }}>✓ Approve</button>
                          <button onClick={() => updateW(w.id,"paid")} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13 }}>💸 Mark Paid</button>
                          <button onClick={() => updateW(w.id,"rejected")} style={{ background: "#ef444418", color: "#ef4444", border: "1px solid #ef444455", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13 }}>✕ Reject</button>
                        </>}
                        {w.status === "approved" && <button onClick={() => updateW(w.id,"paid")} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13 }}>💸 Mark Paid</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "users" && (
        <div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name or email..." style={{ width: "100%", background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "12px 16px", color: "#e8eaf0", fontSize: 14, marginBottom: 16 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(u => {
              const allInv = u.investments || [];
              const invBal = allInv.filter(i => i.verifiedAt).reduce((s, i) => s + calcBalance(i), 0);
              const bal = +(invBal + (u.manualBonus || 0)).toFixed(2);
              const open = selected === u.id;
              return (
                <div key={u.id} className="card" style={{ overflow: "hidden" }}>
                  <div onClick={() => setSelected(open ? null : u.id)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#fbbf24,#f97316)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, color: "#07080f" }}>{u.name[0]}</div>
                      <div><div style={{ fontWeight: 700 }}>{u.name}</div><div style={{ color: "#6b7280", fontSize: 12 }}>{u.email} · {u.country || "—"}</div></div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ color: "#fbbf24", fontWeight: 700 }}>{usd(bal)}</span><span style={{ color: "#4b5563", fontSize: 18 }}>{open ? "▲" : "▼"}</span></div>
                  </div>
                  {open && (
                    <div style={{ borderTop: "1px solid #1e2030", padding: 20, background: "#080910", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
                      <div>
                        <h4 style={{ fontWeight: 700, marginBottom: 12, color: "#fbbf24", fontSize: 14 }}>Investments ({allInv.length})</h4>
                        {allInv.length > 0 ? allInv.map((inv, i) => { const p = getPlan(inv.amount); return (
                          <div key={i} style={{ background: "#0f1117", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: p?.color, fontWeight: 600, fontSize: 13 }}>{p?.badge} {p?.name} · {usd(inv.amount)}</span><StatusBadge status={inv.verifiedAt ? "verified" : "pending_verification"} /></div>
                            <div style={{ color: "#4b5563", fontSize: 11 }}>Current: {usd(calcBalance(inv))}</div>
                          </div>
                        ); }) : <p style={{ color: "#4b5563", fontSize: 13 }}>No investments.</p>}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700, marginBottom: 12, color: "#10b981", fontSize: 14 }}>🔧 Balance Adjustment</h4>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <input value={bonusAmt} onChange={e => setBonusAmt(e.target.value)} type="number" placeholder="e.g. 500 or -200" style={{ flex: 1, background: "#0f1117", border: "1px solid #1e2030", borderRadius: 8, padding: "10px 12px", color: "#e8eaf0", fontSize: 14 }} />
                        </div>
                        <button onClick={() => bonusAmt && applyBonus(u.id, bonusAmt)} style={{ width: "100%", background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 8, padding: "10px", color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Apply Adjustment</button>
                        <h4 style={{ fontWeight: 700, marginBottom: 12, color: "#6366f1", fontSize: 14 }}>💬 Message User</h4>
                        <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Message to send..." style={{ width: "100%", background: "#0f1117", border: "1px solid #1e2030", borderRadius: 8, padding: "10px 12px", color: "#e8eaf0", fontSize: 13, resize: "vertical", minHeight: 80, marginBottom: 10 }} />
                        <button onClick={() => replyMsg(u.id, u.name)} style={{ width: "100%", background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", borderRadius: 8, padding: "10px", color: "#fff", fontWeight: 700, fontSize: 14 }}>Send Message</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <div className="card" style={{ padding: 40, textAlign: "center", color: "#4b5563" }}>No users found.</div>}
          </div>
        </div>
      )}

      {tab === "chats" && (
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>All Support Conversations</h3>
          {msgs.length === 0 ? <div className="card" style={{ padding: 40, textAlign: "center", color: "#4b5563" }}>No messages yet.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {msgs.map(m => (
                <div key={m.id} className="card" style={{ padding: "13px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, borderLeft: `3px solid ${m.from === "admin" ? "#6366f1" : "#fbbf24"}` }}>
                  <div><span style={{ fontWeight: 700, color: m.from === "admin" ? "#6366f1" : "#fbbf24" }}>{m.from === "admin" ? "⚙ Admin" : `👤 ${m.userName}`}</span><span style={{ color: "#9ca3af", marginLeft: 8, fontSize: 13 }}>{m.text}</span></div>
                  <span style={{ color: "#374151", fontSize: 12 }}>{m.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "stats" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
          {[{ l:"Total Users",v:users.length,c:"#6366f1",i:"👥" },{ l:"Active Investors",v:users.filter(u=>(u.investments||[]).some(i=>i.verifiedAt)).length,c:"#fbbf24",i:"📈" },{ l:"Pending Verify",v:pendingInvestments.length,c:"#f59e0b",i:"⏳" },{ l:"Total Invested",v:usd(users.reduce((s,u)=>(u.investments||[]).filter(i=>i.verifiedAt).reduce((ss,i)=>ss+i.amount,s),0)),c:"#10b981",i:"💰" },{ l:"Pending Withdrawals",v:pendingWithdraws.length,c:"#f59e0b",i:"💸" },{ l:"Support Messages",v:msgs.length,c:"#6366f1",i:"💬" }].map(s => (
            <div key={s.l} className="card" style={{ padding: 22, borderTop: `3px solid ${s.c}` }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.i}</div>
              <div style={{ color: "#4b5563", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>{s.l}</div>
              <div style={{ fontWeight: 800, fontSize: 24, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SHARED ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = { pending:{ bg:"#f59e0b18",c:"#f59e0b",l:"⏳ Pending" }, pending_verification:{ bg:"#f59e0b18",c:"#f59e0b",l:"🔍 Awaiting Verification" }, verified:{ bg:"#10b98118",c:"#10b981",l:"✅ Verified" }, approved:{ bg:"#6366f118",c:"#6366f1",l:"✓ Approved" }, paid:{ bg:"#10b98118",c:"#10b981",l:"💸 Paid" }, rejected:{ bg:"#ef444418",c:"#ef4444",l:"✕ Rejected" }, active:{ bg:"#10b98118",c:"#10b981",l:"● Active" } };
  const s = m[status] || m.pending;
  return <span style={{ background: s.bg, color: s.c, borderRadius: 100, padding: "4px 12px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{s.l}</span>;
}
function StepHeader({ n, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#fbbf24,#f97316)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#07080f", flexShrink: 0 }}>{n}</div>
      <h3 style={{ fontWeight: 700, fontSize: 16 }}>{title}</h3>
    </div>
  );
}
function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ background: "#080910", border: "1px solid #1e2030", borderRadius: 10, padding: "12px 14px", color: "#e8eaf0", fontSize: 15, transition: "border .2s" }} />
    </div>
  );
}
function PrimaryBtn({ onClick, children }) {
  return <button onClick={onClick} className="hov" style={{ width: "100%", background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#07080f", border: "none", padding: "14px", borderRadius: 10, fontWeight: 700, fontSize: 16, boxShadow: "0 6px 20px rgba(251,191,36,0.22)" }}>{children}</button>;
}
function ErrBox({ msg }) {
  return <div style={{ background: "#ef444414", border: "1px solid #ef444433", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444", display: "flex", alignItems: "flex-start", gap: 8 }}><span>⚠</span><span>{msg}</span></div>;
}

// ─── INFO CONTENT ─────────────────────────────────────────────────────────────
const INFO_CONTENT = {
  "Dashboard": { title: "Your Investment Dashboard", body: `The BitGrow Dashboard is your personal command centre for managing and monitoring your crypto investment portfolio in real time.\n\nFrom the Dashboard you can:\n• View your current balance and projected earnings across all active plans\n• Submit new investment deposits and track their verification status\n• Request withdrawals once your maturity period is complete\n• Review your full transaction and withdrawal history\n• Access your unique referral code and monitor referred users\n• Communicate directly with our support team via live chat` },
  "Investment Plans": { title: "Investment Plans", body: `BitGrow offers four professionally structured investment plans.\n\n⚡ Starter Plan — $100 to $499\nIdeal for first-time investors. Projected 30% ROI over the 90-day maturity period.\n\n🔥 Basic Plan — $500 to $1,999\nA balanced strategy targeting a 50% ROI.\n\n💎 Premium Plan — $2,000 to $9,999\nHigh-performance multi-asset approach targeting 80% ROI.\n\n👑 VIP Plan — $10,000 and above\nInstitutional-grade strategy delivering projected 100% ROI.` },
  "Withdraw": { title: "Withdrawals", body: `BitGrow operates a structured withdrawal system.\n\nMaturity Period\nAll investments are subject to a 90-day maturity lock from the date of admin verification.\n\nMinimum Withdrawal\nThe minimum withdrawal amount is $500 USD equivalent.\n\nHow to Withdraw\nOnce your maturity period is complete, navigate to the Withdraw tab, enter the desired amount, select your preferred network, and provide your destination wallet address. Our team will review and process your request within 24–72 business hours.` },
  "History": { title: "Transaction History", body: `The History tab provides a complete and transparent record of all your financial activity on the BitGrow platform.\n\nInvestment History\nEvery deposit you submit is logged with its date, selected plan, deposited amount, transaction ID, and current verification status.\n\nWithdrawal History\nAll withdrawal requests are recorded with their submission date, requested amount, chosen network, and real-time processing status.` },
  "Live Chat": { title: "Live Support Chat", body: `BitGrow's Live Chat support is available 24/7 directly from your investor Dashboard.\n\nOur support specialists assist with:\n• Investment plan selection and strategy guidance\n• Deposit submission and transaction verification status\n• Withdrawal requests and processing timelines\n• Account recovery and security concerns\n\nClick the chat bubble icon (💬) at the bottom-right corner of your Dashboard to open the live chat widget.` },
  "FAQ": { title: "Frequently Asked Questions", body: `Q: How do I start investing on BitGrow?\nA: Create an account, select an investment plan, send your deposit to the Bitcoin (BTC) wallet address, then submit your transaction ID for admin verification.\n\nQ: How long does verification take?\nA: Admin verification is typically completed within 1–12 hours of submission.\n\nQ: When can I withdraw my funds?\nA: Withdrawals are available after the 90-day maturity period. The minimum withdrawal is $500.\n\nQ: What network should I use to deposit?\nA: All deposits must be sent via the Bitcoin (BTC) network only.\n\nQ: Is my account secure?\nA: Yes. Your account is protected by your password and a unique 12-word recovery phrase.` },
  "Contact Us": { title: "Contact BitGrow", body: `We are committed to providing responsive, professional support.\n\n📱 Telegram\n👉 t.me/BitGrowOfficial\n\n📧 Email\n👉 bitgrowofficial1@gmail.com\n\n💬 Live Chat\nAvailable directly in your Dashboard at any time.` },
  "Security": { title: "Platform Security", body: `BitGrow is built on a foundation of security-first principles.\n\nAccount Security\nYour account is protected by a password and a unique 12-word BIP39-standard recovery phrase generated at registration. This phrase is never stored on our servers.\n\nPassword Requirements\nAll passwords must include at least 8 characters, one uppercase letter, one number, and one special character.\n\nBlockchain Transparency\nAll investment transactions are recorded on the Blockchain.com and can be independently verified on Blockchair using your transaction ID.` },
  "Terms of Service": { title: "Terms of Service", body: `Last updated: January 2026\n\n1. Acceptance of Terms\nBy accessing or using the BitGrow platform, you agree to be bound by these Terms of Service.\n\n2. Eligibility\nYou must be at least 18 years of age and legally permitted to engage in investment activities in your jurisdiction.\n\n3. Investment Risk\nAll investments carry inherent risk. Projected returns are estimates and not guarantees.\n\n4. User Responsibilities\nYou are responsible for maintaining the confidentiality of your account credentials and recovery phrase.` },
  "Privacy Policy": { title: "Privacy Policy", body: `Last updated: January 2026\n\n1. Information We Collect\nWe collect information you provide when you register, including your name, email address, and investment activity.\n\n2. How We Use Your Information\nYour information is used to operate your account, process investment transactions, and respond to support enquiries.\n\n3. Data Sharing\nWe do not sell, rent, or share your personal information with third parties for marketing purposes.\n\n4. Your Rights\nYou have the right to access, correct, or request deletion of your personal data at any time.` },
  "Risk Disclosure": { title: "Risk Disclosure Statement", body: `Important Notice: Please read this Risk Disclosure Statement carefully before investing.\n\n1. General Investment Risk\nAll forms of investment carry the risk of partial or total loss of capital.\n\n2. Cryptocurrency Volatility\nCryptocurrency markets are highly volatile and can fluctuate significantly.\n\n3. Projected Returns\nThe ROI figures displayed are projections, not guarantees. Actual returns may differ.\n\n4. Liquidity Risk\nInvestments are subject to a 90-day maturity lock. Do not invest funds you may need access to within this timeframe.` },
  "Compliance": { title: "Compliance & Regulatory Framework", body: `BitGrow is committed to operating in full compliance with applicable laws and regulations.\n\nAnti-Money Laundering (AML)\nBitGrow maintains a strict Anti-Money Laundering policy. All transactions are monitored for suspicious activity.\n\nSanctions Compliance\nBitGrow does not provide services to individuals or entities subject to international sanctions.\n\nTransaction Monitoring\nAll investment and withdrawal transactions are reviewed by our compliance team.` },
};

function InfoModal({ item, onClose }) {
  const content = INFO_CONTENT[item];
  if (!content) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0f1117", border: "1px solid #1e2030", borderRadius: 20, maxWidth: 680, width: "100%", maxHeight: "82vh", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #1e2030", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h2 style={{ fontWeight: 800, fontSize: 20, color: "#fbbf24" }}>{content.title}</h2>
          <button onClick={onClose} style={{ background: "#111218", border: "1px solid #1e2030", color: "#9ca3af", borderRadius: 8, width: 34, height: 34, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
          {content.body.split("\n\n").map((para, i) => {
            if (para.includes("t.me/BitGrowOfficial")) return (
              <p key={i} style={{ fontSize: 14, lineHeight: 1.85, marginBottom: 16, whiteSpace: "pre-line" }}>
                {para.split("👉 t.me/BitGrowOfficial").map((part, j) => j === 0 ? <span key={j} style={{ color: "#9ca3af" }}>{part}</span> : <span key={j}><a href="https://t.me/BitGrowOfficial" target="_blank" rel="noreferrer" style={{ color: "#fbbf24", fontWeight: 700, textDecoration: "none" }}>👉 t.me/BitGrowOfficial ↗</a><span style={{ color: "#9ca3af" }}>{part}</span></span>)}
              </p>
            );
            if (para.includes("bitgrowofficial1@gmail.com")) return (
              <p key={i} style={{ fontSize: 14, lineHeight: 1.85, marginBottom: 16, whiteSpace: "pre-line" }}>
                {para.split("👉 bitgrowofficial1@gmail.com").map((part, j) => j === 0 ? <span key={j} style={{ color: "#9ca3af" }}>{part}</span> : <span key={j}><a href="mailto:bitgrowofficial1@gmail.com" style={{ color: "#fbbf24", fontWeight: 700, textDecoration: "none" }}>👉 bitgrowofficial1@gmail.com ↗</a><span style={{ color: "#9ca3af" }}>{part}</span></span>)}
              </p>
            );
            return <p key={i} style={{ color: para.startsWith("Q:") || para.startsWith("•") ? "#e8eaf0" : para.match(/^[0-9]+\./) ? "#fbbf24" : para.match(/^(📱|📧|💬)/) ? "#e8eaf0" : "#9ca3af", fontSize: 14, lineHeight: 1.85, marginBottom: 16, fontWeight: para.match(/^[0-9]+\./) || para.match(/^(📱|📧|💬)/) ? 700 : 400, whiteSpace: "pre-line" }}>{para}</p>;
          })}
        </div>
        <div style={{ padding: "16px 28px", borderTop: "1px solid #1e2030", flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: "linear-gradient(135deg,#fbbf24,#f97316)", color: "#07080f", border: "none", padding: "10px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Footer({ navigate }) {
  const [modalItem, setModalItem] = useState(null);
  return (
    <>
      {modalItem && <InfoModal item={modalItem} onClose={() => setModalItem(null)} />}
      <footer style={{ background: "#07080f", borderTop: "1px solid #111218", padding: "40px 24px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 32, marginBottom: 32 }}>
            <div>
              <div onClick={() => navigate("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#fbbf24,#f97316)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#07080f" }}>B</div>
                <span style={{ fontWeight: 800, fontSize: 18, background: "linear-gradient(90deg,#fbbf24,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>BitGrow</span>
              </div>
              <p style={{ color: "#374151", fontSize: 13, maxWidth: 240, lineHeight: 1.7 }}>Professional crypto asset management. Institutional-grade strategies for every investor.</p>
            </div>
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              {[["Platform",["Dashboard","Investment Plans","Withdraw","History"]],["Support",["Live Chat","FAQ","Contact Us","Security"]],["Legal",["Terms of Service","Privacy Policy","Risk Disclosure","Compliance"]]].map(([title, links]) => (
                <div key={title}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#9ca3af", marginBottom: 12, textTransform: "uppercase", letterSpacing: .5 }}>{title}</div>
                  {links.map(l => (
                    <div key={l} onClick={() => setModalItem(l)} style={{ color: "#6b7280", fontSize: 13, marginBottom: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onMouseEnter={e => e.currentTarget.style.color = "#fbbf24"} onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>
                      <span style={{ fontSize: 9, color: "#fbbf2466" }}>▶</span>{l}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #111218", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <p style={{ color: "#1f2937", fontSize: 12 }}>© 2024 BitGrow. All rights reserved.</p>
            <p style={{ color: "#1f2937", fontSize: 12 }}>Investment involves risk. Past performance is not indicative of future results.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
