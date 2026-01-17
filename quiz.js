/* Step 13: adds M4 with guided steps and gating. */
'use strict';

// ---------- helpers
const $ = (id)=>document.getElementById(id);
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const now = ()=>Date.now();
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function shuffle(a){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function norm(s){return (s??'').toString().trim().toLowerCase().replace(/\s+/g,'');}

// --- math equivalence helpers (accept equivalent polynomials/monomials)
// We keep user input easy (x^2) but compare in canonical form so 3x+4 == 4+3x.
const superToDigit = {
  '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'
};

function superscriptsToCaret(s){
  // Convert x²y¹⁰ -> x^2y^10
  let out = '';
  for(let i=0;i<s.length;i++){
    const ch = s[i];
    if(superToDigit[ch] !== undefined){
      // gather run of superscripts
      let j=i;
      let digits='';
      while(j<s.length && superToDigit[s[j]]!==undefined){
        digits += superToDigit[s[j]];
        j++;
      }
      out += '^' + digits;
      i = j-1;
    } else {
      out += ch;
    }
  }
  return out;
}

function parsePoly(exprRaw){
  if(!exprRaw) return null;
  let s = exprRaw.toString().trim().toLowerCase();
  s = s.replace(/−/g,'-').replace(/·/g,'*');
  s = superscriptsToCaret(s);
  s = s.replace(/\s+/g,'');
  // reject complex syntax we don't support yet
  if(/[()/:]/.test(s)) return null;
  if(s==='') return null;

  // Ensure leading sign
  if(!/^[+-]/.test(s)) s = '+' + s;

  const terms = new Map();
  // Split into signed chunks: +... or -...
  const parts = s.match(/[+-][^+-]+/g);
  if(!parts) return null;

  for(const p of parts){
    const sign = p[0] === '-' ? -1 : 1;
    const body = p.slice(1);
    if(body==='') return null;

    // coefficient: optional leading digits
    const m = body.match(/^([0-9]+)(.*)$/);
    let coeff = 1;
    let rest = body;
    if(m){
      coeff = parseInt(m[1],10);
      rest = m[2];
    } else {
      // if term has no letters, it's invalid here
      coeff = (/[a-z]/.test(rest)) ? 1 : null;
    }
    if(coeff===null){
      // pure constant like +4 handled by m; so here is invalid
      return null;
    }

    // variables
    const varRe = /([a-z])(?:\^([0-9]+))?/g;
    let match;
    const vars = new Map();
    let consumed = '';
    while((match = varRe.exec(rest))){
      const v = match[1];
      const e = match[2] ? parseInt(match[2],10) : 1;
      vars.set(v, (vars.get(v) || 0) + e);
      consumed += match[0];
    }

    // constants: rest should be empty
    if(consumed !== rest){
      // unsupported characters
      return null;
    }

    // build canonical key
    const key = [...vars.entries()]
      .sort((a,b)=>a[0].localeCompare(b[0]))
      .map(([v,e])=> e===1 ? v : `${v}^${e}`)
      .join('');

    const prev = terms.get(key) || 0;
    terms.set(key, prev + sign*coeff);
  }

  // remove zeros
  for(const [k,v] of [...terms.entries()]){
    if(v===0) terms.delete(k);
  }
  return terms;
}

function eqPoly(userRaw, expectedRaw){
  const u = parsePoly(userRaw);
  const e = parsePoly(expectedRaw);
  if(!u || !e) return null; // unknown
  if(u.size !== e.size) return false;
  for(const [k,v] of e.entries()){
    if(!u.has(k) || u.get(k)!==v) return false;
  }
  return true;
}

// exponent pretty: turn x^2y^10 into x²y¹⁰ (simple)
const supMap = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
function prettyExp(text){
  // replace ^digits with superscript digits
  return text.replace(/\^([0-9]+)/g, (_,d)=> d.split('').map(ch=>supMap[ch]||ch).join(''));
}
function renderMathInline(text){
  // lightweight: just pretty exponents
  return prettyExp(text);
}

// ---------- persistence
const STORE_KEY='matematica_profile_v14';
function loadProfile(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return defaultProfile();
    const obj = JSON.parse(raw);
    return {...defaultProfile(), ...obj};
  }catch{ return defaultProfile(); }
}
function saveProfile(p){ localStorage.setItem(STORE_KEY, JSON.stringify(p)); }
function defaultProfile(){
  return {
    unlocked: { P0:true, M1:true, M2:false, M3:false, M4:false, M5:false, FIN:false },
    // competency stats: key -> {recent:[0/1], streak:int}
    stats: {},
    badges: { P0:false, M1:false, M2:false, M3:false, M4:false, M5:false, FIN:false },
    lastBlock: 'M1'
  };
}

function statKey(block, comp){return `${block}:${comp}`;}
function pushResult(profile, block, comp, ok){
  const k = statKey(block, comp);
  if(!profile.stats[k]) profile.stats[k]={recent:[], streak:0};
  const s = profile.stats[k];
  s.recent.push(ok?1:0);
  if(s.recent.length>10) s.recent.shift();
  s.streak = ok ? (s.streak+1) : 0;
}
function mastery(profile, block, comp){
  const k = statKey(block, comp);
  const s = profile.stats[k];
  if(!s || s.recent.length<10) return {pct: (s?Math.round(100*s.recent.reduce((a,b)=>a+b,0)/Math.max(1,s.recent.length)):0), ok:false, streak:(s?s.streak:0), n:(s?s.recent.length:0)};
  const sum = s.recent.reduce((a,b)=>a+b,0);
  const pct = Math.round(100*sum/10);
  const ok = pct>=80 && s.streak>=3;
  return {pct, ok, streak:s.streak, n:10};
}

// ---------- competency definitions
const BLOCKS = [
  {id:'P0', name:'P0 • Proporzioni', comps:['C1','C2','C3','C4','C5','C6']},
  {id:'M1', name:'M1 • Monomi', comps:['C1','C2','C3','C4','C5']},
  {id:'M2', name:'M2 • Operazioni monomi', comps:['C6','C7','C8','C9','C10']},
  {id:'M3', name:'M3 • Polinomi', comps:['C11','C12','C13','C14','C15']},
  {id:'M4', name:'M4 • Operazioni polinomi', comps:['C16','C17','C18','C19','C20']},
  {id:'M5', name:'M5 • MCD/MCM monomi', comps:['C21','C22','C23','C24','C25']},
  {id:'FIN', name:'Verifica finale', comps:['F1']}
];

// gating: M2 requires all M1 comps; M3 requires M1+M2; M4 requires M1+M2+M3
function updateUnlocks(profile){
  const m1ok = BLOCKS.find(b=>b.id==='M1').comps.every(c=>mastery(profile,'M1',c).ok);
  profile.unlocked.M2 = m1ok;
  profile.badges.M1 = m1ok;
  if(m1ok && profile.lastBlock==='M1') profile.lastBlock='M2';

  const m2ok = profile.unlocked.M2 && BLOCKS.find(b=>b.id==='M2').comps.every(c=>mastery(profile,'M2',c).ok);
  profile.unlocked.M3 = m1ok && m2ok;
  profile.badges.M2 = m2ok;

  const m3ok = profile.unlocked.M3 && BLOCKS.find(b=>b.id==='M3').comps.every(c=>mastery(profile,'M3',c).ok);
  profile.unlocked.M4 = m1ok && m2ok && m3ok;
  profile.badges.M3 = m3ok;

  const m4ok = profile.unlocked.M4 && BLOCKS.find(b=>b.id==='M4').comps.every(c=>mastery(profile,'M4',c).ok);
  profile.unlocked.M5 = m1ok && m2ok && m3ok && m4ok;
  profile.badges.M4 = m4ok;

  const m5ok = profile.unlocked.M5 && BLOCKS.find(b=>b.id==='M5').comps.every(c=>mastery(profile,'M5',c).ok);
  profile.badges.M5 = m5ok;

  profile.unlocked.FIN = m5ok;
  profile.badges.FIN = m5ok;
}

// ---------- questions
// Question types: mcq {type:'mcq', block, comp, q, choices, a, rule}
// open {type:'open', block, comp, q, a, rule, explainWrong(user)->string}
// guided {type:'guided', block, comp, steps:[subquestions], rule}

function ruleBox(title, rule, ex){
  return `${title}\n• ${rule}\nEsempio: ${ex}`;
}

// Minimal banks (enough to demonstrate; user will expand later)
const BANK = [];

// --- M1 sample (kept)
function addM1(){
  BANK.push({
    type:'open', block:'M1', comp:'C2',
    q:'Qual è il coefficiente di -3x^2?',
    a:'-3',
    rule: ruleBox('Coefficiente','È solo il numero (con segno) davanti alla parte letterale.','In -3x^2 il coefficiente è -3.'),
    explainWrong:(u)=>`Hai scritto ${u||'(vuoto)'}. Il coefficiente NON include la lettera. In -3x^2: coefficiente = -3, parte letterale = x^2.`
  });
  BANK.push({
    type:'open', block:'M1', comp:'C4',
    q:'Calcola il grado del monomio 5x^3y^2',
    a:'5',
    rule: ruleBox('Grado totale','Somma gli esponenti delle lettere.','5x^3y^2 ha grado 3+2=5.'),
    explainWrong:(u)=>`Il grado è la somma degli esponenti (3+2). Il numero 5 non influisce sul grado.`
  });
  BANK.push({
    type:'mcq', block:'M1', comp:'C1',
    q:'Quale è un monomio?',
    choices:['2x+3','5x^2y','x/y'],
    a:1,
    rule: ruleBox('Monomio','È un numero moltiplicato per lettere con esponenti naturali.','5x^2y è un monomio.')
  });
}

// --- P0 tiny sample
function addP0(){
  // Helper: build a fraction-compare MCQ using correct cross-multiplication.
  function fracCmpQ(a,b,c,d){
    const left = a*d;
    const right = b*c;
    let ans;
    if(left>right) ans = 0;
    else if(left<right) ans = 1;
    else ans = 2;
    return {
      type:'mcq', block:'P0', comp:'C1',
      q:'Quale frazione è maggiore?',
      choices:[`${a}/${b}`,`${c}/${d}`,'Sono uguali'],
      a:ans,
      rule: ruleBox(
        'Confronto frazioni (incrocio)',
        'Confronta a·d e b·c (prodotto incrociato).',
        `${a}·${d}=${a*d} e ${b}·${c}=${b*c} ⇒ ${ans===2?'sono uguali':(ans===0?`${a}/${b}`:`${c}/${d}`)} è maggiore.`
      )
    };
  }

  // A small, high-quality set of comparisons (includes the ones you reported).
  BANK.push(fracCmpQ(3,4,5,6));
  BANK.push(fracCmpQ(7,10,2,3));
  BANK.push(fracCmpQ(5,8,3,6));
  BANK.push(fracCmpQ(4,9,2,5));
  BANK.push(fracCmpQ(3,7,6,14)); // equal

  BANK.push({
    type:'open', block:'P0', comp:'C5',
    q:'Trova x: (x-2):5 = 6:10 (scrivi solo x)',
    a:'5',
    rule: ruleBox('Proporzione','Prodotto dei medi = prodotto degli estremi.','(x-2)*10 = 5*6 ⇒ 10x-20=30 ⇒ x=5.'),
    explainWrong:(u)=>`Usa il prodotto incrociato: (x-2)*10 = 5*6 = 30. Poi risolvi: 10x-20=30 ⇒ 10x=50 ⇒ x=5.`
  });
}

// --- M2 guided (already implemented in Step10):
function addM2(){
  // guided product
  BANK.push({
    type:'guided', block:'M2', comp:'C6',
    rule: ruleBox('Prodotto tra monomi','Moltiplica i coefficienti e somma gli esponenti della stessa lettera.','(2x^2)(3x^3)=6x^5'),
    steps:[
      {type:'mcq', q:'Che operazione è? (2x^2)(3x^3)', choices:['Prodotto','Divisione','Potenza'], a:0, comp:'C10'},
      {type:'open', q:'Calcola il coefficiente: 2·3 =', a:'6'},
      {type:'mcq', q:'Con gli esponenti di x cosa fai nel prodotto?', choices:['Sommo','Sottraggo','Moltiplico'], a:0},
      {type:'open', q:'Scrivi il risultato finale (formato: 6x^5)', a:'6x^5'},
      {type:'mcq', q:'Perché hai sommato gli esponenti?', choices:['Perché è un prodotto tra potenze con stessa base','Perché è una divisione','Perché è una potenza'], a:0}
    ]
  });

  BANK.push({
    type:'guided', block:'M2', comp:'C7',
    rule: ruleBox('Divisione tra monomi','Dividi i coefficienti e sottrai gli esponenti della stessa lettera.','6x^5 / 2x^3 = 3x^2'),
    steps:[
      {type:'mcq', q:'Che operazione è? (6x^5):(2x^3)', choices:['Prodotto','Divisione','Potenza'], a:1, comp:'C10'},
      {type:'open', q:'Calcola il coefficiente: 6:2 =', a:'3'},
      {type:'mcq', q:'Con gli esponenti di x cosa fai nella divisione?', choices:['Sommo','Sottraggo','Moltiplico'], a:1},
      {type:'open', q:'Scrivi il risultato finale (formato: 3x^2)', a:'3x^2'},
      {type:'mcq', q:'Perché sottrai gli esponenti?', choices:['Perché è una divisione tra potenze con stessa base','Perché è un prodotto','Perché è una potenza'], a:0}
    ]
  });
}

// --- M3 small bank
function addM3(){
  BANK.push({
    type:'mcq', block:'M3', comp:'C13',
    q:'Quali sono termini simili?',
    choices:['2x^2 e 5x^2','3x e 3x^2','x^2 e y^2'],
    a:0,
    rule: ruleBox('Termini simili','Stessa parte letterale con stessi esponenti.','2x^2 e 5x^2 sono simili.')
  });
  BANK.push({
    type:'open', block:'M3', comp:'C14',
    q:'Riduci: 2x + 3x',
    a:'5x',
    rule: ruleBox('Riduzione','Somma i coefficienti dei termini simili.','2x+3x=5x.'),
    explainWrong:(u)=>`I termini sono simili (entrambi x). Sommi i coefficienti: 2+3=5 ⇒ 5x.`
  });
  BANK.push({
    type:'open', block:'M3', comp:'C15',
    q:'Grado di: 4x^3 - 2x + 1 (scrivi solo il grado)',
    a:'3',
    rule: ruleBox('Grado polinomio','È il grado massimo tra i monomi.','4x^3 ha grado 3 ⇒ polinomio di grado 3.'),
    explainWrong:(u)=>`Il grado del polinomio è il massimo tra i gradi dei monomi: 4x^3 (3), -2x (1), 1 (0) ⇒ 3.`
  });
}

// --- Step 13: M4 guided + normal
function addM4(){
  // C16 sum
  BANK.push({
    type:'open', block:'M4', comp:'C16',
    q:'Somma: (2x+3) + (x+1) =',
    a:'3x+4',
    rule: ruleBox('Somma polinomi','Togli parentesi e riduci termini simili.','(2x+3)+(x+1)=3x+4.'),
    explainWrong:(u)=>`Togli le parentesi (nessun cambio segno): 2x+3+x+1. Riduci: (2x+x)=3x e (3+1)=4 ⇒ 3x+4.`
  });

  // C17 difference
  BANK.push({
    type:'open', block:'M4', comp:'C17',
    q:'Differenza: (5x-3) - (2x-1) =',
    a:'3x-2',
    rule: ruleBox('Differenza polinomi','Cambia segno a tutti i termini del secondo polinomio, poi riduci.','(5x-3)-(2x-1)=5x-3-2x+1=3x-2.'),
    explainWrong:(u)=>`Distribuisci il meno: -(2x-1) = -2x+1. Quindi 5x-3-2x+1 = 3x-2.`
  });

  // C18 distributive guided
  BANK.push({
    type:'guided', block:'M4', comp:'C18',
    rule: ruleBox('Distributiva','Monomio per ogni termine del polinomio.','2x(3x+1)=6x^2+2x'),
    steps:[
      {type:'mcq', q:'Quale regola usi per 2x(3x+1)?', choices:['Distributiva','Somma diretta','MCD'], a:0, comp:'C20'},
      {type:'open', q:'Primo prodotto: 2x·3x =', a:'6x^2'},
      {type:'open', q:'Secondo prodotto: 2x·1 =', a:'2x'},
      {type:'open', q:'Somma i risultati: 6x^2 + 2x =', a:'6x^2+2x'},
      {type:'mcq', q:'Perché fai due prodotti?', choices:['Perché moltiplichi per ogni termine','Perché cambi segno','Perché sommi esponenti a caso'], a:0}
    ]
  });

  // C19 binomial guided
  BANK.push({
    type:'guided', block:'M4', comp:'C19',
    rule: ruleBox('Binomio×binomio','Ogni termine del primo per ogni termine del secondo (4 prodotti), poi riduci.','(x+2)(x+3)=x^2+5x+6'),
    steps:[
      {type:'mcq', q:'Quanti prodotti devi fare in (x+2)(x+3)?', choices:['2','3','4'], a:2, comp:'C20'},
      {type:'open', q:'1) x·x =', a:'x^2'},
      {type:'open', q:'2) x·3 =', a:'3x'},
      {type:'open', q:'3) 2·x =', a:'2x'},
      {type:'open', q:'4) 2·3 =', a:'6'},
      {type:'open', q:'Riduci: x^2 + 3x + 2x + 6 =', a:'x^2+5x+6'}
    ]
  });

  // C20 order of steps
  BANK.push({
    type:'mcq', block:'M4', comp:'C20',
    q:'Qual è l’ordine corretto nei prodotti con parentesi?',
    choices:[
      'Riduci subito, poi moltiplica',
      'Moltiplica (tutti i prodotti), poi riduci',
      'Scegli a caso'
    ],
    a:1,
    rule: ruleBox('Ordine passaggi','Prima prodotti, poi riduzione.','(x+2)(x+3): fai 4 prodotti, poi riduci i termini simili.')
  });
}


// --- Step 14: M5 bank (MCD/MCM tra monomi)
function addM5(){
  BANK.push({
    type:'mcq', block:'M5', comp:'C21',
    q:'Quale regola è corretta?',
    choices:['Nel MCD prendo gli esponenti maggiori','Nel MCD prendo gli esponenti minori','Nel MCM prendo gli esponenti minori'],
    a:1,
    rule: ruleBox('MCD/MCM','MCD: esponenti minori delle lettere comuni. MCM: esponenti maggiori di tutte le lettere.','Esempio: MCD(6x^3,4x^2)=2x^2.')
  });
  BANK.push({
    type:'guided', block:'M5', comp:'C25',
    rule: ruleBox('Procedura MCD','1) MCD coefficienti  2) lettere comuni  3) esponenti minori','Esempio: 6x^3y^2 e 4x^2y ⇒ 2x^2y'),
    steps:[
      {type:'open', q:'MCD dei coefficienti: MCD(6,4)=', a:'2'},
      {type:'mcq', q:'Quali lettere sono comuni in 6x^3y^2 e 4x^2y?', choices:['x e y','solo x','solo y','nessuna'], a:0},
      {type:'open', q:'Esponente minore di x tra 3 e 2 =', a:'2'},
      {type:'open', q:'Esponente minore di y tra 2 e 1 =', a:'1'},
      {type:'open', q:'Scrivi il MCD finale (formato: 2x^2y)', a:'2x^2y'}
    ]
  });
  BANK.push({
    type:'guided', block:'M5', comp:'C24',
    rule: ruleBox('Procedura MCM','1) MCM coefficienti  2) tutte le lettere  3) esponenti maggiori','Esempio: 6x^3y^2 e 4x^2y ⇒ 12x^3y^2'),
    steps:[
      {type:'open', q:'MCM dei coefficienti: MCM(6,4)=', a:'12'},
      {type:'mcq', q:'Nel MCM prendo le lettere…', choices:['solo comuni','tutte','nessuna'], a:1},
      {type:'open', q:'Esponente maggiore di x tra 3 e 2 =', a:'3'},
      {type:'open', q:'Esponente maggiore di y tra 2 e 1 =', a:'2'},
      {type:'open', q:'Scrivi il MCM finale (formato: 12x^3y^2)', a:'12x^3y^2'}
    ]
  });
  BANK.push({
    type:'open', block:'M5', comp:'C22',
    q:'Calcola MCD tra 12x^2 e 8x^2 =',
    a:'4x^2',
    rule: ruleBox('MCD','MCD coefficienti + lettere comuni + esponenti minori.','MCD(12,8)=4 e x^2 comune ⇒ 4x^2.'),
    explainWrong:(u)=>'MCD(12,8)=4. Le lettere comuni: x^2. Quindi MCD=4x^2.'
  });
  BANK.push({
    type:'open', block:'M5', comp:'C23',
    q:'Calcola MCM tra 4x e 6x =',
    a:'12x',
    rule: ruleBox('MCM','MCM coefficienti + tutte le lettere + esponenti maggiori.','MCM(4,6)=12 e x comune ⇒ 12x.'),
    explainWrong:(u)=>'MCM(4,6)=12. Lettere: x. Esponente maggiore: 1. Quindi MCM=12x.'
  });
}
addP0();
addM1();
addM2();
addM3();
addM4();
addM5();

// ---------- UI state
let profile = loadProfile();
updateUnlocks(profile);
saveProfile(profile);

let mode = 'train'; // 'train' or 'test'
let currentBlock = profile.lastBlock || 'M1';
let quizList = [];
let qi = 0;
let score = 0;
let locked = false;
let lastWasWrong = false;
let wrongLog = [];

function showSection(id){
  ['home','quiz','result'].forEach(x=>$(x).classList.add('hidden'));
  $(id).classList.remove('hidden');
}

function blockStateLabel(bid){
  if(bid==='M2' && !profile.unlocked.M2) return '🔒 Bloccato: completa M1';
  if(bid==='M3' && !profile.unlocked.M3) return '🔒 Bloccato: completa M2';
  if(bid==='M4' && !profile.unlocked.M4) return '🔒 Bloccato: completa M3';
  if(bid==='M5' && !profile.unlocked.M5) return '🔒 Bloccato: completa M4';
  if(bid==='FIN' && !profile.unlocked.FIN) return '🔒 Bloccato: completa M5';
  return 'Disponibile';
}

function computeBlockPct(bid){
  if(bid==='FIN') return {avg: profile.unlocked.FIN?100:0, allOk: profile.unlocked.FIN};
  const b = BLOCKS.find(x=>x.id===bid);
  const comps = b.comps;
  const vals = comps.map(c=>mastery(profile,bid,c).pct);
  const avg = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  const allOk = comps.every(c=>mastery(profile,bid,c).ok);
  return {avg, allOk};
}

function renderHome(){
  updateUnlocks(profile);
  saveProfile(profile);

  // message
  let msg = 'Allenati per sbloccare i blocchi: devi consolidare le competenze (80% su ultime 10 + 3 corrette di fila).';
  if(!profile.unlocked.M2) msg = 'Obiettivo: sbloccare M2. Completa M1: tutte le competenze devono diventare verdi.';
  else if(!profile.unlocked.M3) msg = 'Obiettivo: sbloccare M3. Ora consolida M2 (prodotto/divisione/potenza/segni/scelta regola).';
  else if(!profile.unlocked.M4) msg = 'Obiettivo: sbloccare M4. Ora consolida M3 (termini simili, riduzione, grado).';
  else if(!profile.unlocked.M5) msg = 'Obiettivo: sbloccare M5. Consolida M4 (somma/differenza/distributiva/binomi/ordine).';
  else msg = 'Ottimo: M5 è disponibile. Allenati su MCD/MCM (min/max esponenti) e poi fai la verifica finale.';
  $('homeMsg').textContent = msg;

  // blocks list
  const blocksEl = $('blocks');
  blocksEl.innerHTML='';
  const order = ['P0','M1','M2','M3','M4','M5','FIN'];
  for(const bid of order){
    const b = BLOCKS.find(x=>x.id===bid);
    const st = blockStateLabel(bid);
    const row = document.createElement('div');
    row.className='blockRow';

    const left = document.createElement('div');
    left.className='left';
    left.innerHTML = `<div class="name">${b.name}</div><div class="state">${st}</div>`;

    const btns = document.createElement('div');
    btns.style.display='flex';
    btns.style.gap='8px';

    const trainBtn = document.createElement('button');
    trainBtn.className='btn primary';
    trainBtn.textContent='Allenati';
    trainBtn.disabled = (bid==='M2' && !profile.unlocked.M2) || (bid==='M3' && !profile.unlocked.M3) || (bid==='M4' && !profile.unlocked.M4) || (bid==='M5' && !profile.unlocked.M5) || (bid==='FIN' && !profile.unlocked.FIN);
    trainBtn.addEventListener('click', ()=>start(bid,'train'));

    const testBtn = document.createElement('button');
    testBtn.className='btn';
    testBtn.textContent='Verifica';
    testBtn.disabled = trainBtn.disabled;
    testBtn.addEventListener('click', ()=>start(bid,'test'));

    btns.appendChild(trainBtn);
    btns.appendChild(testBtn);

    row.appendChild(left);
    row.appendChild(btns);
    blocksEl.appendChild(row);
  }

  // badges
  const badgesEl = $('badges');
  badgesEl.innerHTML='';
  const badgeOrder = [
    {k:'P0', label:'🏅 Proporzioni'},
    {k:'M1', label:'🏅 Monomi'},
    {k:'M2', label:'🏅 Operazioni monomi'},
    {k:'M3', label:'🏅 Polinomi'},
    {k:'M4', label:'🏅 Operazioni polinomi'},
    {k:'M5', label:'🏅 MCD/MCM'},
    {k:'FIN', label:'🏁 Verifica finale'}
  ];
  for(const b of badgeOrder){
    const div = document.createElement('div');
    div.className = 'badge' + (profile.badges[b.k] ? ' on' : '');
    div.textContent = b.label;
    badgesEl.appendChild(div);
  }

  // progress bars (block avg)
  const prog = $('progress');
  prog.innerHTML='';
  for(const bid of ['P0','M1','M2','M3','M4','M5','FIN']){
    const b = BLOCKS.find(x=>x.id===bid);
    // if locked, show 0
    let pct = 0;
    let allOk = false;
    if(!((bid==='M2' && !profile.unlocked.M2) || (bid==='M3' && !profile.unlocked.M3) || (bid==='M4' && !profile.unlocked.M4) || (bid==='M5' && !profile.unlocked.M5) || (bid==='FIN' && !profile.unlocked.FIN))){
      const c = computeBlockPct(bid);
      pct = c.avg;
      allOk = c.allOk;
    }
    const item = document.createElement('div');
    item.className='progressItem';
    item.innerHTML = `
      <div class="progressLabel"><span>${b.name}</span><span>${allOk?'✅':''} ${pct}%</span></div>
      <div class="bar"><div style="width:${pct}%"></div></div>
    `;
    prog.appendChild(item);
  }
}

function buildKeypad(){
  const keys = ['x','y','a','b','^','+','-','(',')','2','3','4','5','6','7','8','9','0','←','C'];
  const pad = $('keypad');
  pad.innerHTML='';
  keys.forEach(k=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='key';
    btn.textContent=k;
    btn.addEventListener('click', ()=>{
      const inp=$('answer');
      if(k==='←') inp.value = inp.value.slice(0,-1);
      else if(k==='C') inp.value='';
      else inp.value += k;
      inp.focus();
    });
    pad.appendChild(btn);
  });
}

function pickQuestionsFor(blockId, mode){
  const pool = (blockId==='FIN') ? BANK.filter(q=>['M1','M2','M3','M4','M5','P0'].includes(q.block)) : BANK.filter(q=>q.block===blockId);
  // In train: adaptive: prefer comps not ok
  if(mode==='train'){
    const b = BLOCKS.find(x=>x.id===blockId);
    const weights = new Map();
    for(const c of b.comps){
      const m = mastery(profile, blockId, c);
      // lower pct => higher weight
      const w = clamp(120 - m.pct, 20, 120);
      weights.set(c,w);
    }
    const weighted = [];
    for(const q of pool){
      const w = weights.get(q.comp) ?? 50;
      for(let i=0;i<Math.round(w/20);i++) weighted.push(q);
    }
    return shuffle(weighted).slice(0, 12);
  }
  // test: simple random 12
  return shuffle(pool).slice(0, 12);
}

function start(blockId, whichMode){
  mode = whichMode;
  currentBlock = blockId;
  profile.lastBlock = blockId;
  saveProfile(profile);

  quizList = pickQuestionsFor(blockId, whichMode);
  qi = 0;
  score = 0;
  wrongLog = [];
  lastWasWrong = false;

  $('quizTitle').textContent = whichMode==='train' ? 'Allenamento' : 'Verifica';
  $('quizMeta').textContent = `${BLOCKS.find(b=>b.id===blockId).name} • ${whichMode==='train' ? 'con regole + esempi' : 'senza aiuti'}`;
  buildKeypad();
  showSection('quiz');
  renderQ();
}

function setScorePill(){
  $('scorePill').textContent = `${score}/${qi+1} • ${qi+1}/${quizList.length}`;
}

let guidedStepIndex = 0;
let guidedRoot = null;

function renderQ(){
  locked=false;
  $('nextBtn').disabled=true;
  $('feedback').textContent='';

  const q = quizList[qi];
  setScorePill();

  // rule box
  const showRule = (mode==='train');
  $('ruleBox').innerHTML = showRule ? renderMathInline(q.rule).replace(/\n/g,'<br>') : '—';

  $('choices').innerHTML='';
  $('answerWrap').classList.add('hidden');

  if(q.type==='guided'){
    guidedRoot = q;
    guidedStepIndex = 0;
    renderGuidedStep();
    return;
  }

  guidedRoot = null;
  const qText = renderMathInline(q.q);
  $('qtext').innerHTML = qText;

  if(q.type==='mcq'){
    q.choices.forEach((c,i)=>{
      const btn=document.createElement('button');
      btn.className='choice';
      btn.innerHTML = renderMathInline(c);
      btn.addEventListener('click', ()=>chooseMCQ(q,i,btn));
      $('choices').appendChild(btn);
    });
  } else {
    $('answerWrap').classList.remove('hidden');
    $('answer').value='';
    $('answer').focus();
  }
}

function renderGuidedStep(){
  $('choices').innerHTML='';
  $('answerWrap').classList.add('hidden');
  $('feedback').textContent='';
  $('nextBtn').disabled=true;
  locked=false;

  const root = guidedRoot;
  const step = root.steps[guidedStepIndex];
  const stepText = renderMathInline(step.q);
  $('qtext').innerHTML = `<strong>Step ${guidedStepIndex+1}/${root.steps.length}</strong><br>${stepText}`;

  if(step.type==='mcq'){
    step.choices.forEach((c,i)=>{
      const btn=document.createElement('button');
      btn.className='choice';
      btn.innerHTML = renderMathInline(c);
      btn.addEventListener('click', ()=>chooseGuidedMCQ(step,i,btn));
      $('choices').appendChild(btn);
    });
  } else {
    $('answerWrap').classList.remove('hidden');
    $('answer').value='';
    $('answer').focus();
  }
}

function markCompetency(ok, block, comp){
  pushResult(profile, block, comp, ok);
  // for guided steps: if step has comp override
  updateUnlocks(profile);
  saveProfile(profile);
}

function chooseMCQ(q,i,btn){
  if(locked) return;
  locked=true;
  const buttons=[...document.querySelectorAll('.choice')];
  buttons.forEach(b=>b.disabled=true);
  const correctIdx=q.a;
  buttons[correctIdx].classList.add('correct');

  const ok = i===correctIdx;
  if(!ok) btn.classList.add('wrong');
  markCompetency(ok, q.block, q.comp);

  if(ok){
    score += 1;
    $('feedback').innerHTML = `✅ <strong>Corretto</strong>.`;
  } else {
    const expl = mode==='train' ? ` ${renderMathInline(q.rule).split('\n')[0]}` : '';
    $('feedback').innerHTML = `❌ <strong>No</strong>.${expl}`;
    wrongLog.push({q, user:q.choices[i]});
  }
  $('nextBtn').disabled=false;
}

function checkOpen(){
  if(locked) return;
  const q = guidedRoot ? guidedRoot.steps[guidedStepIndex] : quizList[qi];
  const root = guidedRoot ? guidedRoot : null;

  const userRaw = $('answer').value;
  const expRaw = q.a;

  // Try polynomial/monomial equivalence first (accept different term order)
  let ok;
  const polyEq = eqPoly(userRaw, expRaw);
  if(polyEq === null){
    // fallback strict normalize
    ok = norm(userRaw) === norm(expRaw);
  } else {
    ok = polyEq;
  }

  locked=true;
  if(ok){
    score += 1;
    $('feedback').innerHTML = `✅ <strong>Corretto</strong>.`;
  } else {
    let why = '';
    if(mode==='train'){
      if(root && root.rule) why = `<br><span class="muted">Regola:</span><br>${renderMathInline(root.rule).replace(/\n/g,'<br>')}`;
      if(!root && typeof q.explainWrong==='function') why = `<br><span class="muted">Spiegazione:</span> ${renderMathInline(q.explainWrong($('answer').value))}`;
    }
    // Extra clarity in training: show WHY (if expression is equivalent but formatted differently)
    let extra = '';
    if(mode==='train'){
      const expPoly = parsePoly(expRaw);
      const userPoly = parsePoly(userRaw);
      if(expPoly && userPoly){
        extra = '<br><span class="muted">Nota:</span> In questa app accettiamo anche lo stesso risultato scritto con i termini in ordine diverso (es. 4+3x).';
      }
    }
    $('feedback').innerHTML = `❌ <strong>No</strong>. <span class="muted">Corretto:</span> <strong>${renderMathInline(expRaw)}</strong>${why}${extra}`;
    wrongLog.push({q: root?root: q, user:userRaw});
  }

  // competency bookkeeping
  if(root){
    // count only the root competency once, on last step completion
    // but also track C10 if step has comp override
    const comp = (q.comp) ? q.comp : root.comp;
    markCompetency(ok, root.block, comp);
  } else {
    markCompetency(ok, q.block, q.comp);
  }

  $('nextBtn').disabled=false;
}

function chooseGuidedMCQ(step,i,btn){
  if(locked) return;
  locked=true;
  const buttons=[...document.querySelectorAll('.choice')];
  buttons.forEach(b=>b.disabled=true);
  buttons[step.a].classList.add('correct');
  const ok = i===step.a;
  if(!ok) btn.classList.add('wrong');

  // competency: if step has comp, count for that, else root
  const comp = step.comp ? step.comp : guidedRoot.comp;
  markCompetency(ok, guidedRoot.block, comp);

  if(ok){
    score += 1;
    $('feedback').innerHTML = `✅ <strong>Corretto</strong>.`;
  } else {
    $('feedback').innerHTML = `❌ <strong>No</strong>.`;
    wrongLog.push({q: guidedRoot, user: step.choices[i]});
  }

  $('nextBtn').disabled=false;
}

function next(){
  if(guidedRoot){
    guidedStepIndex += 1;
    if(guidedStepIndex < guidedRoot.steps.length){
      renderGuidedStep();
      return;
    }
    // finished guided root: advance to next main question
    guidedRoot = null;
  }

  qi += 1;
  if(qi >= quizList.length){
    finish();
  } else {
    renderQ();
  }
}

function finish(){
  showSection('result');
  const pct = Math.round(100*score/quizList.length);
  $('resultText').textContent = `Punteggio: ${score}/${quizList.length} (${pct}%).`;

  // show weakest comps for the block
  const b = BLOCKS.find(x=>x.id===currentBlock);
  const comps = b.comps.map(c=>({c, m:mastery(profile,currentBlock,c)}));
  comps.sort((a,b)=>a.m.pct - b.m.pct);
  const weakest = comps.slice(0,2).map(x=>`${currentBlock}-${x.c}: ${x.m.pct}%`).join(' • ');
  $('resultDetails').textContent = `Focus: ${weakest || '—'}`;

  $('review').classList.add('hidden');
  $('review').innerHTML='';

  // refresh home
  updateUnlocks(profile);
  saveProfile(profile);
}

function showReview(){
  const box = $('review');
  box.innerHTML='';
  if(wrongLog.length===0){
    box.innerHTML = `<div class="reviewItem"><div class="tag">Perfetto</div>Nessun errore 🎉</div>`;
    box.classList.remove('hidden');
    return;
  }
  wrongLog.slice(0,50).forEach((w,idx)=>{
    const div=document.createElement('div');
    div.className='reviewItem';
    const q = w.q;
    div.innerHTML = `<div class="tag">Errore ${idx+1}</div><div><strong>Domanda:</strong> ${renderMathInline(q.q||'Esercizio guidato')}</div><div><strong>Tua risposta:</strong> ${renderMathInline(w.user||'')}</div><div class="muted" style="margin-top:6px">${renderMathInline((q.rule||'').split('\n')[0]||'')}</div>`;
    box.appendChild(div);
  });
  box.classList.remove('hidden');
}

function reset(){
  localStorage.removeItem(STORE_KEY);
  profile = loadProfile();
  updateUnlocks(profile);
  saveProfile(profile);
  renderHome();
}

// events
$('resetBtn').addEventListener('click', reset);
$('backHomeBtn').addEventListener('click', ()=>{showSection('home'); renderHome();});
$('resultHomeBtn').addEventListener('click', ()=>{showSection('home'); renderHome();});
$('skipBtn').addEventListener('click', next);
$('nextBtn').addEventListener('click', ()=>{ if(!guidedRoot && quizList[qi].type==='open'){} next(); });
$('checkBtn').addEventListener('click', checkOpen);
$('answer').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); checkOpen(); }});
$('reviewBtn').addEventListener('click', showReview);

// register service worker
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}

// initial render
renderHome();
showSection('home');
