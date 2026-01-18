/* =========================================================
   MATEMATICA – ALGEBRA (P0 + M1..M5)
   - P0 proporzioni (confronto frazioni + x nelle proporzioni)
   - M1 monomi
   - M2 operazioni monomi (GUIDATE)
   - M3 polinomi
   - M4 operazioni con polinomi (GUIDATE)
   - M5 MCD/MCM monomi
   - Prerequisiti: M2 sbloccato solo se M1 solido, ecc.
   - Allenamento: regola+esempio sempre
   - Verifica: senza aiuti
   - Dashboard progressi + badge
   ========================================================= */

"use strict";
const APP_VERSION = "v10";
const SKILL_LABELS = {
  // P0
  "P0_C1":"Confrontare frazioni (prodotto incrociato)",
  "P0_C2":"Riconoscere una proporzione",
  "P0_C3":"Distinguere medi ed estremi",
  "P0_C4":"Trovare x in proporzione semplice",
  "P0_C5":"Trovare x con espressioni (x−2, ecc.)",
  "P0_C6":"Controllare il risultato della proporzione",

  // M1
  "M1_C1":"Riconoscere un monomio",
  "M1_C2":"Trovare il coefficiente",
  "M1_C3":"Individuare la parte letterale",
  "M1_C4":"Calcolare il grado totale",
  "M1_C5":"Grado rispetto a una lettera",

  // M2
  "M2_C6":"Prodotto tra monomi",
  "M2_C7":"Divisione tra monomi",
  "M2_C8":"Potenza di un monomio",
  "M2_C9":"Gestire i segni",
  "M2_C10":"Scegliere la regola corretta (prodotto/divisione/potenza)",

  // M3
  "M3_C11":"Riconoscere un polinomio",
  "M3_C12":"Numero di termini (mono/bi/tri)",
  "M3_C13":"Riconoscere termini simili",
  "M3_C14":"Ridurre un polinomio",
  "M3_C15":"Grado di un polinomio",

  // M4
  "M4_C16":"Somma di polinomi",
  "M4_C17":"Differenza di polinomi (cambio segni)",
  "M4_C18":"Distributiva (monomio × polinomio)",
  "M4_C19":"Binomio × binomio",
  "M4_C20":"Ordine dei passaggi (procedura corretta)",

  // M5
  "M5_C21":"Distinguere MCD e MCM",
  "M5_C22":"MCD/MCM dei coefficienti",
  "M5_C23":"Lettere comuni / tutte le lettere",
  "M5_C24":"Min/Max degli esponenti",
  "M5_C25":"Procedura completa e ordinata"
};

function labelSkill(id){
  return SKILL_LABELS[id] || id;
}


/* -------------------- Helpers DOM -------------------- */
const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.remove("hidden");
const hide = (id) => $(id).classList.add("hidden");

/* -------------------- Nav + Modal (v10) -------------------- */
function openModal(id){ const m=$(id); if(!m) return; m.classList.add('is-open'); m.setAttribute('aria-hidden','false'); }
function closeModal(id){ const m=$(id); if(!m) return; m.classList.remove('is-open'); m.setAttribute('aria-hidden','true'); }
async function copyToClipboard(text){ try{ await navigator.clipboard.writeText(text); toast('Copiato negli appunti'); } catch{ toast('Copia non disponibile'); } }
function diagnosticsText(){
  const name=(localStorage.getItem(LS.name)||'').trim();
  const d={version:APP_VERSION,name,block:profile.lastBlock||currentBlock,mode:profile.lastMode||mode,lastContext,lastError:profile.lastError||null,at:new Date().toISOString()};
  return JSON.stringify(d,null,2);
}


/* -------------------- UI active state -------------------- */
function setActiveUI(blockId, modeName){
  // Save last session for "Riprendi" + highlight
  profile.lastBlock = blockId;
  profile.lastMode = modeName;
  saveProfile(profile);

  // Highlight Home buttons
  const tBtn = $('trainBtn');
  const vBtn = $('verifyBtn');
  if(tBtn && vBtn){
    tBtn.classList.toggle('btn-active', modeName==='train');
    vBtn.classList.toggle('btn-active', modeName==='verify');
  }

  // Highlight blocks list
  document.querySelectorAll('.blockBtn').forEach(btn=>{
    const bid = btn.getAttribute('data-block');
    btn.classList.toggle('is-active', bid===blockId);
  });

  // Status pill
  const sp = $('statusPill');
  if(sp){
    const m = modeName==='verify' ? 'Verifica' : 'Allenamento';
    sp.textContent = 'Selezione: ' + blockId + ' • ' + m;
  }
}

function updateResumeButton(){
  const tBtn = $('trainBtn');
  if(!tBtn) return;
  const has = !!(profile.lastBlock && profile.lastMode);
  if(has){
    tBtn.textContent = 'Riprendi (' + profile.lastBlock + ')';
  } else {
    tBtn.textContent = 'Allenati (consigliato)';
  }
}

/* -------------------- Storage -------------------- */
const LS = {
  name: "math_name",
  profile: "math_profile_v1",
  // c’è una sola classe: teniamo comunque la chiave per chiarezza
  classId: "math_class"
};

// C’è una sola classe: tutti finiscono qui (modifica se un giorno vuoi più classi)
const CLASS_ID = "classe";

function loadProfile(){
  try {
    const raw = localStorage.getItem(LS.profile);
    if(!raw) return makeEmptyProfile();
    const obj = JSON.parse(raw);
    return mergeProfileDefaults(obj);
  } catch {
    return makeEmptyProfile();
  }
}
function saveProfile(p){
  localStorage.setItem(LS.profile, JSON.stringify(p));
  // ogni volta che cambiano i progressi, aggiorna anche Firebase (se configurato)
  scheduleFirebaseSync();
}

/* -------------------- Firebase (classe) --------------------
   - Auth anonimo (così non serve login)
   - Firestore: classes/classe/participants/{uid}
   Se Firebase non è configurato in index.html, tutto continua a funzionare offline.
------------------------------------------------------------*/
let firebaseSyncTimer = null;
let classmatesUnsub = null;

function firebaseAvailable(){
  return !!(window.__FIREBASE__ && window.__FIREBASE__.auth && window.__FIREBASE__.db);
}

function calcProgressPercent(profile){
  if(!profile || !profile.skills) return 0;
  let done = 0, total = 0;
  for(const skillId of Object.keys(profile.skills)){
    const arr = profile.skills[skillId] || [];
    for(const v of arr){
      total += 1;
      if(v === 1) done += 1;
    }
  }
  return total === 0 ? 0 : Math.round((done/total)*100);
}

async function firebaseEnsureSignedIn(){
  if(!firebaseAvailable()) return null;
  const { auth, signInAnonymously } = window.__FIREBASE__;
  if(auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

async function firebaseUpsertParticipant(displayName, progressPercent){
  if(!firebaseAvailable()) return;

  // import dinamico (così quiz.js resta un normale <script>)
  const mod = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  const { doc, setDoc, serverTimestamp } = mod;

  const user = await firebaseEnsureSignedIn();
  if(!user) return;

  const { db } = window.__FIREBASE__;
  const ref = doc(db, "classes", CLASS_ID, "participants", user.uid);

  await setDoc(ref, {
    displayName,
    progressPercent,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

function scheduleFirebaseSync(){
  clearTimeout(firebaseSyncTimer);
  firebaseSyncTimer = setTimeout(() => {
    firebaseSyncTimer = null;
    syncMyDataToFirebase().catch(()=>{});
  }, 500);
}

async function syncMyDataToFirebase(){
  if(!firebaseAvailable()) return;
  const name = (localStorage.getItem(LS.name) || "").trim();
  if(!name) return;
  const pct = calcProgressPercent(profile);
  await firebaseUpsertParticipant(name, pct);
}

async function listenClassmates(){
  const listEl = $("classmates");
  if(!listEl) return;

  // reset UI
  listEl.innerHTML = '<div class="muted tiny">Caricamento classe…</div>';

  if(!firebaseAvailable()){
    listEl.innerHTML = '<div class="muted tiny">Firebase non configurato (la lista classe non è disponibile).</div>';
    return;
  }

  const mod = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  const { collection, onSnapshot, orderBy, query } = mod;

  const { db } = window.__FIREBASE__;
  await firebaseEnsureSignedIn();

  // se c'era un listener precedente, chiudilo
  if(classmatesUnsub){
    try{ classmatesUnsub(); }catch{}
    classmatesUnsub = null;
  }

  const q = query(
    collection(db, "classes", CLASS_ID, "participants"),
    orderBy("progressPercent", "desc")
  );

  classmatesUnsub = onSnapshot(q, (snap) => {
    const arr = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    renderClassmates(arr);
  }, (err) => {
    console.warn("Classe snapshot error", err);
    listEl.innerHTML = '<div class="muted tiny">Impossibile caricare la lista classe (offline o permessi).</div>';
  });
}

function renderClassmates(items){
  const listEl = $("classmates");
  if(!listEl) return;
  if(!items || items.length === 0){
    listEl.innerHTML = '<div class="muted tiny">Nessun compagno trovato (ancora).</div>';
    return;
  }

  // mostra 1 riga per compagno: Nome + percentuale
  listEl.innerHTML = "";
  for(const it of items){
    const row = document.createElement("div");
    row.className = "classmate";
    const name = (it.displayName || "—").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const pct = Number.isFinite(it.progressPercent) ? Math.max(0, Math.min(100, Math.round(it.progressPercent))) : 0;
    row.innerHTML = `
      <div class="classmate__name">${name}</div>
      <div class="classmate__meta">
        <div class="classmate__pct">${pct}%</div>
      </div>
    `;
    listEl.appendChild(row);
  }
}

function makeEmptyProfile(){
  return {
    // per competenza: array ultimi risultati (1/0), per streak
    skills: {},
    streak: 0,
    badges: {},
    // blocchi superati tramite Verifica (>=80%)
    passedBlocks: {},
    lastBlock: "M1"
  };
}
function mergeProfileDefaults(p){
  const base = makeEmptyProfile();
  // merge shallow
  return {
    ...base,
    ...p,
    skills: { ...base.skills, ...(p.skills||{}) },
    badges: { ...base.badges, ...(p.badges||{}) },
    passedBlocks: { ...base.passedBlocks, ...(p.passedBlocks||{}) }
  };
}

/* -------------------- Toast -------------------- */
let toastTimer = null;
function toast(msg){
  const el = $("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.add("hidden"), 2600);
}

/* -------------------- Math formatting -------------------- */
function toSupDigit(ch){
  const map = {"0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","-":"⁻"};
  return map[ch] || ch;
}
function formatExponents(s){
  // turn x^2 into x² ; also handle a^10 etc
  if(!s) return s;
  return String(s).replace(/([a-zA-Z])\^(-?\d+)/g, (_,v,exp)=>{
    return v + String(exp).split("").map(toSupDigit).join("");
  });
}
function normalizeInput(s){
  return String(s||"")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

/* -------------------- Math equivalence (robust) --------------------
   In matematica espressioni equivalenti possono avere forme diverse.
   Per evitare falsi "sbagliato", controlliamo equivalenza così:
   1) Se sono polinomi semplici (solo +/- termini), confrontiamo in modo commutativo.
   2) Altrimenti, valutiamo numericamente in più punti random (evitando divisione per 0).
   Questo mantiene la valutazione corretta senza confondere lo studente.
-------------------------------------------------------------------- */

function superscriptToCaret(s){
  // Convert common superscripts to ^digit
  if(!s) return s;
  const map = {
    "⁰":"0","¹":"1","²":"2","³":"3","⁴":"4","⁵":"5","⁶":"6","⁷":"7","⁸":"8","⁹":"9",
    "⁻":"-"
  };
  // Replace x² -> x^2 , x⁻¹ -> x^-1
  return String(s).replace(/([a-zA-Z])([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, function(_, v, sup){
    let out = "";
    for(let i=0;i<sup.length;i++) out += (map[sup[i]] || "");
    return v + "^" + out;
  });
}

function isMathLike(s){
  const t = normalizeInput(s);
  if(!t) return false;
  // contiene variabili o operatori o cifre
  return /[0-9]/.test(t) && /[a-z\+\-\*\/\^\(\)]/.test(t) || /[a-z]/.test(t);
}

function preprocessExpr(s){
  // 1) lower + trim spaces
  let t = normalizeInput(s);
  t = superscriptToCaret(t);
  // 2) normalize unicode minus
  t = t.replace(/−/g, "-");
  // 3) allow ':' as division (proporzioni)
  t = t.replace(/:/g, "/");
  return t;
}

function insertImplicitMultiplication(t){
  // Insert * between: number/var/)/ and var/(/number
  // Examples: 2x -> 2*x ; x(3+1) -> x*(3+1) ; (x+1)(x-1) -> (x+1)*(x-1)
  if(!t) return t;
  let out = "";
  for(let i=0;i<t.length;i++){
    const ch = t[i];
    const prev = out.length ? out[out.length-1] : "";
    // if prev is digit/letter/) and ch is letter/( or digit, insert *
    const prevIs = /[0-9a-z\)]/.test(prev);
    const chIs = /[0-9a-z\(]/.test(ch);
    if(prevIs && chIs){
      // but do not split cases like "^2" (prev '^')
      // here prev is last char already in out; safe
      // avoid "2e" scientific (not used)
      if(!(prev === "^")) out += "*";
    }
    out += ch;
  }
  return out;
}

function tokenizeExpr(t){
  const tokens = [];
  let i = 0;
  while(i < t.length){
    const ch = t[i];
    if(/[0-9]/.test(ch)){
      let num = ch;
      i++;
      while(i<t.length && /[0-9]/.test(t[i])){ num += t[i]; i++; }
      tokens.push({type:"num", value: Number(num)});
      continue;
    }
    if(/[a-z]/.test(ch)){
      tokens.push({type:"var", value: ch});
      i++;
      continue;
    }
    if(ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "^" || ch === "(" || ch === ")"){
      tokens.push({type:"op", value: ch});
      i++;
      continue;
    }
    // unknown char
    return null;
  }
  return tokens;
}

function toRPN(tokens){
  // Shunting-yard with unary minus
  const out = [];
  const stack = [];
  function prec(op){
    if(op === "u-") return 4;
    if(op === "^") return 3;
    if(op === "*" || op === "/") return 2;
    if(op === "+" || op === "-") return 1;
    return 0;
  }
  function rightAssoc(op){
    return op === "^" || op === "u-";
  }
  let prevType = "start";
  for(let i=0;i<tokens.length;i++){
    const tk = tokens[i];
    if(tk.type === "num" || tk.type === "var"){
      out.push(tk);
      prevType = "val";
      continue;
    }
    const op = tk.value;
    if(op === "("){
      stack.push(op);
      prevType = "lpar";
      continue;
    }
    if(op === ")"){
      while(stack.length && stack[stack.length-1] !== "(") out.push({type:"op", value: stack.pop()});
      if(!stack.length) return null;
      stack.pop();
      prevType = "val";
      continue;
    }
    // operator
    let realOp = op;
    if(op === "-" && (prevType === "start" || prevType === "op" || prevType === "lpar")){
      realOp = "u-";
    }
    while(stack.length){
      const top = stack[stack.length-1];
      if(top === "(") break;
      if((!rightAssoc(realOp) && prec(realOp) <= prec(top)) || (rightAssoc(realOp) && prec(realOp) < prec(top))){
        out.push({type:"op", value: stack.pop()});
      } else break;
    }
    stack.push(realOp);
    prevType = "op";
  }
  while(stack.length){
    const top = stack.pop();
    if(top === "(") return null;
    out.push({type:"op", value: top});
  }
  return out;
}

function evalRPN(rpn, vars){
  const st = [];
  for(let i=0;i<rpn.length;i++){
    const tk = rpn[i];
    if(tk.type === "num"){ st.push(tk.value); continue; }
    if(tk.type === "var"){
      const v = vars[tk.value];
      if(v === undefined || v === null) return null;
      st.push(v);
      continue;
    }
    const op = tk.value;
    if(op === "u-"){
      if(st.length < 1) return null;
      st.push(-st.pop());
      continue;
    }
    if(st.length < 2) return null;
    const b = st.pop();
    const a = st.pop();
    let r;
    if(op === "+") r = a + b;
    else if(op === "-") r = a - b;
    else if(op === "*") r = a * b;
    else if(op === "/"){
      if(b === 0) return null;
      r = a / b;
    }
    else if(op === "^") r = Math.pow(a, b);
    else return null;
    if(!isFinite(r)) return null;
    st.push(r);
  }
  if(st.length !== 1) return null;
  return st[0];
}

function tryCompileExpr(expr){
  const t0 = preprocessExpr(expr);
  if(!t0) return null;
  const t = insertImplicitMultiplication(t0);
  const toks = tokenizeExpr(t);
  if(!toks) return null;
  const rpn = toRPN(toks);
  if(!rpn) return null;
  return {rpn};
}

function numericEquivalent(a, b){
  const A = tryCompileExpr(a);
  const B = tryCompileExpr(b);
  if(!A || !B) return false;

  const vars = ["x","y","a","b"];
  const tries = 10;
  const points = 6;
  const eps = 1e-9;

  function randInt(){
    // small integers avoid huge pow
    return Math.floor(Math.random()*9) - 4; // [-4..4]
  }

  let okCount = 0;
  for(let k=0;k<tries && okCount<points;k++){
    const asg = {};
    for(let i=0;i<vars.length;i++){
      let v = randInt();
      if(v === 0) v = 2; // avoid too many zeros
      asg[vars[i]] = v;
    }
    const va = evalRPN(A.rpn, asg);
    const vb = evalRPN(B.rpn, asg);
    if(va === null || vb === null) continue;
    if(Math.abs(va - vb) > eps) return false;
    okCount++;
  }
  return okCount >= 3; // enough successful points
}

function equivalentMath(user, expected){
  const u = preprocessExpr(user);
  const e = preprocessExpr(expected);
  if(u === "" || e === "") return false;

  // direct normalized equality
  if(u === e) return true;

  // try simple polynomial canonicalization first
  // only if no parentheses, *, / (keeps it strict)
  const simpleOk = function(s){ return s.indexOf("(") === -1 && s.indexOf(")") === -1 && s.indexOf("*") === -1 && s.indexOf("/") === -1; };
  if(simpleOk(u) && simpleOk(e)){
    if(equalPoly(u, e)) return true;
  }

  // fallback: numeric equivalence
  return numericEquivalent(u, e);
}

/* -------------------- Algebra normalize (commutative) --------------------
   We canonicalize simple polynomial expressions in x,y,a,b.
   Supported forms: +/- terms like 6x^2y, 3x, -5, x^2, 2xy^3
   Accept order differences: 3x+4 == 4+3x
-------------------------------------------------------------------------- */

const VARS = ["x","y","a","b"];

function parseTerm(raw){
  // raw without spaces, may start with +/-
  // examples: "-3x^2y", "x", "2", "-x^3", "5xy^2"
  let s = raw;
  if(s === "") return null;

  let sign = 1;
  if(s[0] === "+"){ s = s.slice(1); }
  else if(s[0] === "-"){ sign = -1; s = s.slice(1); }

  // coefficient (leading number) or implied 1
  let coefStr = "";
  while(s.length && /[0-9]/.test(s[0])){
    coefStr += s[0];
    s = s.slice(1);
  }
  let coef = coefStr ? parseInt(coefStr,10) : 1;
  coef *= sign;

  // variables part
  const exps = {x:0,y:0,a:0,b:0};
  while(s.length){
    const v = s[0];
    if(!VARS.includes(v)) return null; // unsupported char
    s = s.slice(1);
    let exp = 1;
    if(s[0] === "^"){
      s = s.slice(1);
      let num = "";
      while(s.length && /[0-9]/.test(s[0])){ num += s[0]; s = s.slice(1); }
      if(num === "") return null;
      exp = parseInt(num,10);
    }
    exps[v] += exp;
  }
  return {coef, exps};
}

function termKey(exps){
  // key like a^0|b^0|x^2|y^1 ordering stable
  return VARS.map(v=>`${v}^${exps[v]||0}`).join("|");
}

function splitTopLevel(expr){
  // split by + and - keeping signs, expr already normalized, no spaces
  // convert leading term without sign to +term
  if(!expr) return [];
  let s = expr;
  if(s[0] !== "+" && s[0] !== "-") s = "+" + s;

  const parts = [];
  let cur = "";
  for(let i=0;i<s.length;i++){
    const ch = s[i];
    if((ch==="+" || ch==="-") && cur !== ""){
      parts.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if(cur) parts.push(cur);
  return parts;
}

function canonicalPoly(expr){
  // returns map key->coefSum or null if parse fails
  const s = normalizeInput(expr);
  if(s === "") return null;

  const parts = splitTopLevel(s);
  const map = new Map();

  for(const p of parts){
    const t = parseTerm(p);
    if(!t) return null;
    const key = termKey(t.exps);
    map.set(key, (map.get(key)||0) + t.coef);
  }
  // remove zeros
  for(const [k,v] of map.entries()){
    if(v === 0) map.delete(k);
  }
  return map;
}

function equalPoly(a,b){
  const A = canonicalPoly(a);
  const B = canonicalPoly(b);
  if(!A || !B) return false;
  if(A.size !== B.size) return false;
  for(const [k,v] of A.entries()){
    if((B.get(k)||0) !== v) return false;
  }
  return true;
}

/* -------------------- Skills + mastery -------------------- */
const WINDOW_N = 10;
const THRESH = 0.8;
const STREAK_REQ = 3;

function pushSkill(profile, skillId, ok){
  if(!profile.skills[skillId]) profile.skills[skillId] = [];
  profile.skills[skillId].push(ok ? 1 : 0);
  if(profile.skills[skillId].length > WINDOW_N) profile.skills[skillId].shift();
}

function skillStats(profile, skillId){
  const arr = profile.skills[skillId] || [];
  const n = arr.length;
  const sum = arr.reduce((a,b)=>a+b,0);
  const pct = n ? (sum/n) : 0;
  // streak within recent answers
  let streak = 0;
  for(let i=arr.length-1;i>=0;i--){
    if(arr[i]===1) streak++;
    else break;
  }
  return {n, pct, streak};
}

function skillGreen(profile, skillId){
  const {n, pct, streak} = skillStats(profile, skillId);
  return n >= WINDOW_N && pct >= THRESH && streak >= STREAK_REQ;
}

function allGreen(profile, ids){
  return ids.every(id => skillGreen(profile, id));
}

/* -------------------- Blocks & skills -------------------- */
const BLOCKS = [
  { id:"P0", name:"P0 Proporzioni", short:"P0", prereq:[], skills:["P0_C1","P0_C2","P0_C3","P0_C4","P0_C5","P0_C6"] },
  { id:"M1", name:"M1 Monomi", short:"M1", prereq:[], skills:["M1_C1","M1_C2","M1_C3","M1_C4","M1_C5"] },
  { id:"M2", name:"M2 Operazioni monomi", short:"M2", prereq:["M1"], skills:["M2_C6","M2_C7","M2_C8","M2_C9","M2_C10"] },
  { id:"M3", name:"M3 Polinomi", short:"M3", prereq:["M1","M2"], skills:["M3_C11","M3_C12","M3_C13","M3_C14","M3_C15"] },
  { id:"M4", name:"M4 Operazioni polinomi", short:"M4", prereq:["M1","M2","M3"], skills:["M4_C16","M4_C17","M4_C18","M4_C19","M4_C20"] },
  { id:"M5", name:"M5 MCD/MCM", short:"M5", prereq:["M1","M2","M3","M4"], skills:["M5_C21","M5_C22","M5_C23","M5_C24","M5_C25"] },
];

function blockById(id){ return BLOCKS.find(b=>b.id===id); }

function blockUnlocked(profile, id){
  // Modalita' "tutto accessibile": nessun blocco e' davvero bloccato.
  // Manteniamo comunque la funzione per UI/compatibilita'.
  const b = blockById(id);
  if(!b) return false;
  return true;
}

function blockCompleted(profile, id){
  const b = blockById(id);
  if(!b) return false;
  return allGreen(profile, b.skills);
}

/* -------------------- Question model --------------------
   types:
   - mcq: choices + answerIndex
   - open: answer string or checker function
   - guided: steps array, each step mcq/open, and final skill mapping
---------------------------------------------------------- */

function qMCQ({block, skill, prompt, choices, answerIndex, rule, example, explainOk, explainNo}){
  return {type:"mcq", block, skill, prompt, choices, answerIndex, rule, example, explainOk, explainNo};
}
function qOPEN({block, skill, prompt, answer, checker, rule, example, explainOk, explainNo}){
  return {type:"open", block, skill, prompt, answer, checker, rule, example, explainOk, explainNo};
}
function qGUIDED({block, skills, title, steps, rule, example}){
  return {type:"guided", block, skills, title, steps, rule, example};
}

/* -------------------- P0 Questions -------------------- */
function fracCompare(a,b,c,d){
  // returns 1 if a/b > c/d, -1 if <, 0 if equal
  const left = a*d;
  const right = b*c;
  if(left>right) return 1;
  if(left<right) return -1;
  return 0;
}

const P0_QUESTIONS = [
  // C1 compare fractions (including user reported cases)
  qMCQ({
    block:"P0", skill:"P0_C1",
    prompt:"Quale frazione è più grande?",
    choices:["7/10","2/3"],
    answerIndex:0,
    rule:"Per confrontare a/b e c/d usa il prodotto incrociato: confronta a·d e b·c.",
    example:"Esempio: 3/4 vs 5/6 → 3·6=18 e 4·5=20 → 5/6 è maggiore.",
    explainOk:"Bravo: 7·3=21 e 10·2=20 → 21>20 quindi 7/10 è maggiore.",
    explainNo:"Usa l’incrocio: 7·3=21 e 10·2=20. Il maggiore è quello col prodotto più grande: 7/10."
  }),
  qMCQ({
    block:"P0", skill:"P0_C1",
    prompt:"Quale frazione è più grande?",
    choices:["5/8","3/6"],
    answerIndex:0,
    rule:"Confronto frazioni: confronta 5·6 e 8·3.",
    example:"Esempio: 2/5 vs 3/7 → 2·7=14 e 5·3=15 → 3/7 è maggiore.",
    explainOk:"Bravo: 5·6=30 e 8·3=24 → 30>24 quindi 5/8 è maggiore.",
    explainNo:"Incrocio: 5·6=30 e 8·3=24 → 5/8 è maggiore."
  }),
  // C2 recognize proportion
  qMCQ({
    block:"P0", skill:"P0_C2",
    prompt:"Quale è una proporzione?",
    choices:["2:5 = 6:15","2+5 = 6+15","2:5 = 6+15","(2/5) + (6/15)"],
    answerIndex:0,
    rule:"Una proporzione ha forma a:b = c:d e significa a/b = c/d.",
    example:"Esempio: 3:4 = 6:8 (perché 3/4 = 6/8).",
    explainOk:"Corretto: è della forma a:b=c:d.",
    explainNo:"Una proporzione è a:b=c:d (rapporto uguale a rapporto)."
  }),
  // C3 medi/extremes
  qMCQ({
    block:"P0", skill:"P0_C3",
    prompt:"In a:b = c:d, quali sono i medi?",
    choices:["a e d","b e c","a e b","c e d"],
    answerIndex:1,
    rule:"Medi: b e c. Estremi: a e d.",
    example:"In 2:5 = 6:15, medi sono 5 e 6.",
    explainOk:"Esatto: i medi sono b e c.",
    explainNo:"Ricorda: medi = b e c; estremi = a e d."
  }),
  // C4 solve simple x
  qOPEN({
    block:"P0", skill:"P0_C4",
    prompt:"Risolvi la proporzione: x : 5 = 6 : 10. Trova x.",
    answer:"3",
    rule:"Prodotto incrociato: x·10 = 5·6. Poi dividi per 10.",
    example:"10x=30 → x=3.",
    explainOk:"Perfetto: x=3.",
    explainNo:"Metodo: x·10=5·6=30 → x=30/10=3."
  }),
  // C5 solve with expression
  qOPEN({
    block:"P0", skill:"P0_C5",
    prompt:"Risolvi: (x-2) : 5 = 6 : 10. Trova x.",
    checker:(u)=>{
      const s = normalizeInput(u);
      return s==="5";
    },
    rule:"Incrocio: (x-2)·10 = 5·6. Poi risolvi 10(x-2)=30.",
    example:"10x-20=30 → 10x=50 → x=5.",
    explainOk:"Corretto: x=5.",
    explainNo:"10(x-2)=30 → 10x-20=30 → 10x=50 → x=5."
  }),
  // C6 check result
  qMCQ({
    block:"P0", skill:"P0_C6",
    prompt:"Per controllare una proporzione risolta, cosa fai?",
    choices:[
      "Sommo tutti i termini",
      "Sostituisco x e verifico che i rapporti siano uguali",
      "Moltiplico solo i numeri",
      "Confronto i denominatori"
    ],
    answerIndex:1,
    rule:"Controllo: sostituisci il valore trovato e verifica a/b = c/d.",
    example:"Se x=3 in x:5=6:10 → 3/5 = 6/10 (vero).",
    explainOk:"Esatto: si controlla sostituendo x.",
    explainNo:"Il controllo corretto è sostituire x e vedere se i due rapporti coincidono."
  })
];

/* -------------------- M1 Questions -------------------- */
const M1_QUESTIONS = [
  // C1 recognize monomial
  qMCQ({
    block:"M1", skill:"M1_C1",
    prompt:"Quale è un monomio?",
    choices:["2x+3","5x^2y","x/y","x+y"],
    answerIndex:1,
    rule:"Un monomio è un numero per lettere con esponenti naturali (senza somme).",
    example:"-3x^2y è un monomio; 2x+3 è un polinomio.",
    explainOk:"Corretto: 5x²y è un monomio.",
    explainNo:"Un monomio non contiene + o -. 5x²y è un unico prodotto."
  }),
  qMCQ({
    block:"M1", skill:"M1_C1",
    prompt:"Vero o falso: 8 è un monomio.",
    choices:["Vero","Falso"],
    answerIndex:0,
    rule:"Un numero (senza lettere) è un monomio di grado 0.",
    example:"8 = 8·x^0.",
    explainOk:"Esatto: è un monomio di grado 0.",
    explainNo:"È vero: un numero è un monomio (grado 0)."
  }),
  // C2 coefficient
  qOPEN({
    block:"M1", skill:"M1_C2",
    prompt:"Qual è il coefficiente del monomio -3x^2y?",
    answer:"-3",
    rule:"Il coefficiente è SOLO il numero davanti alle lettere (con segno).",
    example:"-3x²y → coefficiente = -3.",
    explainOk:"Perfetto: coefficiente -3.",
    explainNo:"Il coefficiente è solo il numero: -3 (non include x o y)."
  }),
  qOPEN({
    block:"M1", skill:"M1_C2",
    prompt:"Qual è il coefficiente del monomio -x^2?",
    answer:"-1",
    rule:"Se non c’è numero scritto, il coefficiente è 1 (o -1 se c’è il meno).",
    example:"-x² = -1·x².",
    explainOk:"Esatto: -1.",
    explainNo:"-x² significa -1·x², quindi coefficiente -1."
  }),
  // C3 literal part
  qOPEN({
    block:"M1", skill:"M1_C3",
    prompt:"Scrivi la parte letterale di 4x^2y (solo lettere ed esponenti).",
    answer:"x^2y",
    checker:(u)=>{
      const s = normalizeInput(u);
      return s==="x^2y" || s==="yx^2";
    },
    rule:"Parte letterale = solo lettere con esponenti (senza numero).",
    example:"4x²y → parte letterale = x²y.",
    explainOk:"Corretto: x²y.",
    explainNo:"Devi scrivere solo lettere: x²y (senza 4)."
  }),
  // C4 total degree
  qOPEN({
    block:"M1", skill:"M1_C4",
    prompt:"Qual è il grado del monomio 5x^3y^2?",
    answer:"5",
    rule:"Grado totale = somma degli esponenti: 3+2.",
    example:"5x³y² → grado = 5.",
    explainOk:"Bravo: 5.",
    explainNo:"Somma esponenti: 3+2=5."
  }),
  qOPEN({
    block:"M1", skill:"M1_C4",
    prompt:"Qual è il grado del monomio 9?",
    answer:"0",
    rule:"Un numero ha grado 0 (nessuna lettera).",
    example:"9 = 9·x^0.",
    explainOk:"Esatto: 0.",
    explainNo:"È un numero → grado 0."
  }),
  // C5 degree w.r.t letter
  qOPEN({
    block:"M1", skill:"M1_C5",
    prompt:"In 6x^3y^2, qual è il grado rispetto a x?",
    answer:"3",
    rule:"Grado rispetto a una lettera = suo esponente.",
    example:"6x³y² → grado in x = 3.",
    explainOk:"Corretto: 3.",
    explainNo:"L’esponente di x è 3."
  }),
  qOPEN({
    block:"M1", skill:"M1_C5",
    prompt:"In 6x^3y^2, qual è il grado rispetto a y?",
    answer:"2",
    rule:"Grado rispetto a y = esponente di y.",
    example:"… → grado in y = 2.",
    explainOk:"Corretto: 2.",
    explainNo:"L’esponente di y è 2."
  })
];

/* -------------------- M2 Guided Questions -------------------- */
function guidedProductExample(){
  // (2x^2)(3x^3) -> 6x^5
  return qGUIDED({
    block:"M2",
    skills:["M2_C10","M2_C6","M2_C9"],
    title:"Esegui: (2x^2)(3x^3)",
    rule:"Prodotto tra monomi: moltiplica coefficienti e SOMMA gli esponenti della stessa lettera.",
    example:"(2x²)(3x³) = 6x^(2+3)=6x⁵",
    steps:[
      qMCQ({
        block:"M2", skill:"M2_C10",
        prompt:"Che operazione è?",
        choices:["Prodotto","Divisione","Potenza"],
        answerIndex:0,
        rule:"Riconosci l’operazione prima di calcolare.",
        example:"(…)(…) è un prodotto."
      }),
      qOPEN({
        block:"M2", skill:"M2_C6",
        prompt:"Calcola il coefficiente: 2·3 = ?",
        answer:"6",
        rule:"Nel prodotto si moltiplicano i coefficienti.",
        example:"2·3=6."
      }),
      qMCQ({
        block:"M2", skill:"M2_C6",
        prompt:"Cosa fai con gli esponenti di x nel prodotto?",
        choices:["Li sommo","Li sottraggo","Li moltiplico"],
        answerIndex:0,
        rule:"Nel prodotto tra potenze con stessa base: sommi gli esponenti.",
        example:"x^2·x^3=x^(2+3)."
      }),
      qOPEN({
        block:"M2", skill:"M2_C6",
        prompt:"Scrivi il risultato finale (usa ^ per gli esponenti se vuoi):",
        checker:(u)=> equalPoly(u, "6x^5"),
        rule:"Unisci coefficiente e parte letterale.",
        example:"6x^5"
      }),
      qMCQ({
        block:"M2", skill:"M2_C10",
        prompt:"Perché hai sommato gli esponenti?",
        choices:["Perché è una divisione","Perché è un prodotto con stessa base","Perché è una potenza"],
        answerIndex:1,
        rule:"Regola: nel prodotto tra monomi con stessa lettera si sommano esponenti.",
        example:"x^a·x^b=x^(a+b)."
      })
    ]
  });
}

function guidedDivisionExample(){
  // 6x^5 / 2x^3 -> 3x^2
  return qGUIDED({
    block:"M2",
    skills:["M2_C10","M2_C7","M2_C9"],
    title:"Esegui: (6x^5) / (2x^3)",
    rule:"Divisione tra monomi: dividi i coefficienti e SOTTRAI gli esponenti della stessa lettera.",
    example:"6x⁵ / 2x³ = 3x^(5-3)=3x²",
    steps:[
      qMCQ({
        block:"M2", skill:"M2_C10",
        prompt:"Che operazione è?",
        choices:["Prodotto","Divisione","Potenza"],
        answerIndex:1,
        rule:"Il simbolo / indica divisione.",
        example:"a/b è una divisione."
      }),
      qOPEN({
        block:"M2", skill:"M2_C7",
        prompt:"Calcola il coefficiente: 6 ÷ 2 = ?",
        answer:"3",
        rule:"Nella divisione dividi i coefficienti.",
        example:"6/2=3."
      }),
      qMCQ({
        block:"M2", skill:"M2_C7",
        prompt:"Cosa fai con gli esponenti di x nella divisione?",
        choices:["Li sommo","Li sottraggo","Li moltiplico"],
        answerIndex:1,
        rule:"Nella divisione: x^a / x^b = x^(a-b).",
        example:"x^5 / x^3 = x^2."
      }),
      qOPEN({
        block:"M2", skill:"M2_C7",
        prompt:"Scrivi il risultato finale:",
        checker:(u)=> equalPoly(u, "3x^2"),
        rule:"Unisci coefficiente e potenza.",
        example:"3x^2"
      }),
      qMCQ({
        block:"M2", skill:"M2_C10",
        prompt:"Perché hai sottratto gli esponenti?",
        choices:["Perché è una divisione con stessa base","Perché è un prodotto","Perché è una potenza"],
        answerIndex:0,
        rule:"Regola: divisione tra potenze con stessa base → sottrai.",
        example:"x^a/x^b = x^(a-b)."
      })
    ]
  });
}

function guidedPowerExample(){
  // (2x^3)^2 -> 4x^6
  return qGUIDED({
    block:"M2",
    skills:["M2_C10","M2_C8","M2_C9"],
    title:"Esegui: (2x^3)^2",
    rule:"Potenza di monomio: eleva il coefficiente e MOLTIPLICA gli esponenti.",
    example:"(2x³)² = 2² · x^(3·2) = 4x⁶",
    steps:[
      qMCQ({
        block:"M2", skill:"M2_C10",
        prompt:"Che operazione è?",
        choices:["Prodotto","Divisione","Potenza"],
        answerIndex:2,
        rule:"L’esponente esterno indica una potenza.",
        example:"(… )^n è una potenza."
      }),
      qOPEN({
        block:"M2", skill:"M2_C8",
        prompt:"Calcola il coefficiente: 2^2 = ?",
        answer:"4",
        rule:"Nella potenza elevi anche il coefficiente.",
        example:"2^2=4."
      }),
      qMCQ({
        block:"M2", skill:"M2_C8",
        prompt:"Cosa fai con gli esponenti di x in (x^3)^2 ?",
        choices:["Li sommo","Li sottraggo","Li moltiplico"],
        answerIndex:2,
        rule:"(x^a)^b = x^(a·b).",
        example:"(x^3)^2 = x^6."
      }),
      qOPEN({
        block:"M2", skill:"M2_C8",
        prompt:"Scrivi il risultato finale:",
        checker:(u)=> equalPoly(u, "4x^6"),
        rule:"Unisci coefficiente e potenza.",
        example:"4x^6"
      }),
      qMCQ({
        block:"M2", skill:"M2_C10",
        prompt:"Perché hai moltiplicato gli esponenti?",
        choices:["Perché è una potenza di potenza","Perché è un prodotto","Perché è una divisione"],
        answerIndex:0,
        rule:"Regola: (x^a)^b = x^(a·b).",
        example:"(x^3)^2 = x^6."
      })
    ]
  });
}

const M2_QUESTIONS = [
  guidedProductExample(),
  guidedDivisionExample(),
  guidedPowerExample()
];

/* -------------------- M3 Questions -------------------- */
const M3_QUESTIONS = [
  qMCQ({
    block:"M3", skill:"M3_C11",
    prompt:"Quale è un polinomio?",
    choices:["3x^2-2x+1","x/y","x^x","√x"],
    answerIndex:0,
    rule:"Un polinomio è somma/differenza di monomi con esponenti naturali.",
    example:"3x²-2x+1 è un polinomio.",
    explainOk:"Corretto.",
    explainNo:"Solo 3x²-2x+1 è una somma/differenza di monomi."
  }),
  qMCQ({
    block:"M3", skill:"M3_C12",
    prompt:"Il polinomio 5x-3 è un…",
    choices:["Monomio","Binomio","Trinomio"],
    answerIndex:1,
    rule:"Binomio = 2 termini.",
    example:"5x e -3 → 2 termini."
  }),
  qMCQ({
    block:"M3", skill:"M3_C13",
    prompt:"Quali sono termini simili?",
    choices:["2x^2 e 5x^2","3x e 3x^2","x e y","2xy e 2x"],
    answerIndex:0,
    rule:"Termini simili: stessa parte letterale (stesse lettere e esponenti).",
    example:"2x² e 5x² sono simili."
  }),
  qOPEN({
    block:"M3", skill:"M3_C14",
    prompt:"Riduci: 2x + 3x",
    checker:(u)=> equalPoly(u, "5x"),
    rule:"Riduci solo termini simili sommando i coefficienti.",
    example:"2x+3x=5x."
  }),
  qOPEN({
    block:"M3", skill:"M3_C14",
    prompt:"Riduci: 4x^2 - x^2",
    checker:(u)=> equalPoly(u, "3x^2"),
    rule:"Somma/sottrai i coefficienti dei termini simili.",
    example:"4x²-x²=3x²."
  }),
  qOPEN({
    block:"M3", skill:"M3_C15",
    prompt:"Qual è il grado del polinomio 4x^3 - 2x + 1?",
    checker:(u)=> normalizeInput(u)==="3",
    rule:"Grado del polinomio = massimo grado tra i suoi monomi.",
    example:"max(3,1,0)=3."
  })
];

/* -------------------- M4 Questions (guided for distributive/binomials) -------------------- */
function guidedDistributive(){
  // 2x(3x+1)=6x^2+2x
  return qGUIDED({
    block:"M4",
    skills:["M4_C18","M4_C20"],
    title:"Svolgi: 2x(3x+1)",
    rule:"Distributiva: moltiplica il monomio per OGNI termine del polinomio, poi riduci.",
    example:"2x·3x=6x² e 2x·1=2x → 6x²+2x",
    steps:[
      qMCQ({
        block:"M4", skill:"M4_C20",
        prompt:"Primo passo corretto?",
        choices:[
          "Moltiplico 2x solo per 3x",
          "Moltiplico 2x per tutti i termini (3x e 1)",
          "Sommo 2x+3x"
        ],
        answerIndex:1,
        rule:"Prima distribuisci su tutti i termini.",
        example:"2x(3x+1)=2x·3x + 2x·1"
      }),
      qOPEN({
        block:"M4", skill:"M4_C18",
        prompt:"Calcola il primo prodotto: 2x·3x =",
        checker:(u)=> equalPoly(u, "6x^2"),
        rule:"Moltiplica coefficienti e somma esponenti: x·x=x².",
        example:"2·3=6 e x·x=x² → 6x²"
      }),
      qOPEN({
        block:"M4", skill:"M4_C18",
        prompt:"Calcola il secondo prodotto: 2x·1 =",
        checker:(u)=> equalPoly(u, "2x"),
        rule:"Moltiplicare per 1 lascia invariato.",
        example:"2x·1=2x"
      }),
      qOPEN({
        block:"M4", skill:"M4_C20",
        prompt:"Scrivi il risultato finale:",
        checker:(u)=> equalPoly(u, "6x^2+2x"),
        rule:"Somma i prodotti ottenuti.",
        example:"6x²+2x"
      })
    ]
  });
}

function guidedBinomial(){
  // (x+2)(x+3)=x^2+5x+6
  return qGUIDED({
    block:"M4",
    skills:["M4_C19","M4_C20"],
    title:"Svolgi: (x+2)(x+3)",
    rule:"Binomio×binomio: fai 4 prodotti (ogni termine con ogni termine), poi riduci.",
    example:"x·x=x², x·3=3x, 2·x=2x, 2·3=6 → x²+5x+6",
    steps:[
      qMCQ({
        block:"M4", skill:"M4_C20",
        prompt:"Quanti prodotti devi fare?",
        choices:["2","3","4"],
        answerIndex:2,
        rule:"Binomio×binomio → 4 prodotti.",
        example:"(a+b)(c+d) = ac+ad+bc+bd"
      }),
      qOPEN({
        block:"M4", skill:"M4_C19",
        prompt:"Prodotto 1: x·x =",
        checker:(u)=> equalPoly(u, "x^2"),
        rule:"x·x = x².",
        example:"x^2"
      }),
      qOPEN({
        block:"M4", skill:"M4_C19",
        prompt:"Prodotto 2: x·3 =",
        checker:(u)=> equalPoly(u, "3x"),
        rule:"Moltiplica il coefficiente: 1·3=3.",
        example:"3x"
      }),
      qOPEN({
        block:"M4", skill:"M4_C19",
        prompt:"Prodotto 3: 2·x =",
        checker:(u)=> equalPoly(u, "2x"),
        rule:"2·x=2x.",
        example:"2x"
      }),
      qOPEN({
        block:"M4", skill:"M4_C19",
        prompt:"Prodotto 4: 2·3 =",
        checker:(u)=> equalPoly(u, "6"),
        rule:"2·3=6.",
        example:"6"
      }),
      qOPEN({
        block:"M4", skill:"M4_C20",
        prompt:"Somma e riduci i 4 prodotti (risultato finale):",
        checker:(u)=> equalPoly(u, "x^2+5x+6"),
        rule:"Somma: x² + (3x+2x) + 6.",
        example:"x^2+5x+6"
      })
    ]
  });
}

const M4_QUESTIONS = [
  qOPEN({
    block:"M4", skill:"M4_C16",
    prompt:"Somma: (2x+3) + (x+1)",
    checker:(u)=> equalPoly(u, "3x+4"),
    rule:"Somma: togli parentesi e riduci termini simili.",
    example:"2x+3+x+1=3x+4"
  }),
  qOPEN({
    block:"M4", skill:"M4_C17",
    prompt:"Differenza: (3x+2) - (x+1)",
    checker:(u)=> equalPoly(u, "2x+1"),
    rule:"Nella differenza cambi segno a TUTTI i termini del secondo polinomio.",
    example:"3x+2-x-1=2x+1"
  }),
  guidedDistributive(),
  guidedBinomial()
];

/* -------------------- M5 Questions -------------------- */
function gcd(a,b){
  a = Math.abs(a); b = Math.abs(b);
  while(b){ const t=a%b; a=b; b=t; }
  return a;
}
function lcm(a,b){
  if(a===0||b===0) return 0;
  return Math.abs(a*b)/gcd(a,b);
}
function parseMonomial(m){
  // simple monomial like 6x^3y^2, -4x, 8
  const s = normalizeInput(m);
  const t = parseTerm((s[0]==="-"||s[0]==="+")?s:("+"+s));
  if(!t) return null;
  return t;
}
function monomialToString(coef, exps){
  // build normalized output like 2x^2y^1 => 2x^2y
  let out = "";
  if(coef === -1 && (exps.x||exps.y||exps.a||exps.b)) out += "-";
  else if(coef !== 1 || !(exps.x||exps.y||exps.a||exps.b)) out += String(coef);

  for(const v of VARS){
    const e = exps[v]||0;
    if(e<=0) continue;
    out += v;
    if(e!==1) out += "^" + e;
  }
  return out;
}
function mcdMonomials(m1,m2){
  const A = parseMonomial(m1);
  const B = parseMonomial(m2);
  if(!A || !B) return null;
  const coef = gcd(A.coef, B.coef);
  const exps = {x:0,y:0,a:0,b:0};
  for(const v of VARS){
    const ea = A.exps[v]||0;
    const eb = B.exps[v]||0;
    if(ea>0 && eb>0) exps[v] = Math.min(ea,eb);
  }
  return monomialToString(coef, exps);
}
function mcmMonomials(m1,m2){
  const A = parseMonomial(m1);
  const B = parseMonomial(m2);
  if(!A || !B) return null;
  const coef = lcm(A.coef, B.coef);
  const exps = {x:0,y:0,a:0,b:0};
  for(const v of VARS){
    const ea = A.exps[v]||0;
    const eb = B.exps[v]||0;
    exps[v] = Math.max(ea,eb);
  }
  return monomialToString(coef, exps);
}

const M5_QUESTIONS = [
  qOPEN({
    block:"M5", skill:"M5_C21",
    prompt:"Vero/Falso: Nel MCD si prendono gli esponenti MINORI.",
    checker:(u)=> {
      const s = normalizeInput(u);
      return s==="vero" || s==="v";
    },
    rule:"MCD: lettere comuni con esponente minore. MCM: tutte le lettere con esponente maggiore.",
    example:"MCD(6x^3,4x^2)=2x^2"
  }),
  qOPEN({
    block:"M5", skill:"M5_C22",
    prompt:"Calcola MCD tra 6x^2 e 4x",
    checker:(u)=> equalPoly(u, "2x"),
    rule:"MCD: MCD coefficienti + lettere comuni + esponente minore.",
    example:"MCD(6,4)=2 e x^(min(2,1))=x → 2x"
  }),
  qOPEN({
    block:"M5", skill:"M5_C24",
    prompt:"Calcola MCM tra 3x^2y e 5xy^2",
    checker:(u)=> equalPoly(u, "15x^2y^2"),
    rule:"MCM: MCM coefficienti + tutte le lettere + esponente maggiore.",
    example:"MCM(3,5)=15; x^2; y^2 → 15x^2y^2"
  }),
  qOPEN({
    block:"M5", skill:"M5_C25",
    prompt:"Calcola MCD tra 8x^3y e 12x^2y",
    checker:(u)=> equalPoly(u, "4x^2y"),
    rule:"Procedura: coefficienti → lettere comuni → min esponenti.",
    example:"MCD(8,12)=4; x^2; y^1 → 4x^2y"
  }),
  qOPEN({
    block:"M5", skill:"M5_C23",
    prompt:"Calcola MCM tra 7x e 5y",
    checker:(u)=> equalPoly(u, "35xy"),
    rule:"Nel MCM prendi TUTTE le lettere con esponente maggiore (qui 1 e 1).",
    example:"MCM(7,5)=35 → 35xy"
  })
];

/* -------------------- Bank by block -------------------- */
function bankFor(blockId){
  switch(blockId){
    case "P0": return P0_QUESTIONS.slice();
    case "M1": return M1_QUESTIONS.slice();
    case "M2": return M2_QUESTIONS.slice();
    case "M3": return M3_QUESTIONS.slice();
    case "M4": return M4_QUESTIONS.slice();
    case "M5": return M5_QUESTIONS.slice();
    default: return [];
  }
}

/* -------------------- Adaptive training selection -------------------- */
function weakestSkill(profile, skillIds){
  // choose lowest pct among those with some attempts; if none, choose first
  let best = null;
  for(const id of skillIds){
    const st = skillStats(profile, id);
    const pct = st.n ? st.pct : -1; // unseen -> prioritize
    const val = st.n ? pct : -1;
    if(best === null || val < best.val){
      best = {id, val, n: st.n, pct: st.pct};
    }
  }
  return best ? best.id : skillIds[0];
}

function pickTrainingBlock(profile){
  // Modalita' "tutto accessibile": non usiamo blocchi bloccati.
  // Suggerimento: il primo blocco NON ancora superato in Verifica (>=80%).
  const path = ["P0","M1","M2","M3","M4","M5"];
  for(const bid of path){
    if(!(profile.passedBlocks && profile.passedBlocks[bid])) return bid;
  }
  return "M5";
}

/* -------------------- Quiz state -------------------- */
let profile = loadProfile();
// c’è una sola classe: fissiamola in storage (utile per futuro)
if(!localStorage.getItem(LS.classId)) localStorage.setItem(LS.classId, CLASS_ID);
// inizializza sync + lista classe (se configurato)
scheduleFirebaseSync();
// prova ad ascoltare i compagni (sezione Classe in Home)
listenClassmates().catch(()=>{});
let mode = "train"; // train | verify
let currentBlock = "M1";
let queue = [];
let qIndex = 0;
let score = 0;
let locked = false;
let guidedState = null; // {q, stepIndex}
let lastContext = null;

function setSafeName(){
  const n = localStorage.getItem(LS.name) || "";
  if(n){
    $("hello").textContent = `Ciao ${n} 👋`;
    $("hello").classList.remove("hidden");
  }
}

/* -------------------- UI: blocks list -------------------- */
function renderBlocks(){
  const el = $("blocks");
  el.innerHTML = "";
  for(const b of BLOCKS){
    const btn = document.createElement("button");
    btn.className = "blockBtn";
    btn.setAttribute('data-block', b.id);
    const passed = !!(profile.passedBlocks && profile.passedBlocks[b.id]);
    const completed = blockCompleted(profile, b.id);
    const label = completed ? "🏅 competenze verdi" : (passed ? "✅ verifica superata" : "🟡 disponibile");
    btn.innerHTML = `<strong>${b.short}</strong> ${b.name.replace(/^.. /,"")}<small>${label}</small>`;
    if(profile.lastBlock===b.id) btn.classList.add('is-active');
    // Tutto accessibile: nessun blocco disabilitato.
    btn.addEventListener("click", ()=>{
      setActiveUI(b.id, 'train');
      startBlock(b.id, 'train');
    });
    el.appendChild(btn);
  }
}

/* -------------------- UI: dashboard -------------------- */
function pctToWidth(p){ return `${Math.round(p*100)}%`; }

function renderDashboard(){
  const dash = $("dashboard");
  dash.innerHTML = "";

  for(const b of BLOCKS){
    // show P0 + all M blocks
    const row = document.createElement("div");
    row.className = "dashRow";

    const completed = blockCompleted(profile, b.id);
    const passed = !!(profile.passedBlocks && profile.passedBlocks[b.id]);
    const label = completed ? "🏅" : (passed ? "✅" : "🟡");

    // compute avg pct of skills
    const stats = b.skills.map(sid=>skillStats(profile, sid));
    const seen = stats.filter(s=>s.n>0);
    const avg = seen.length ? (seen.reduce((a,s)=>a+s.pct,0)/seen.length) : 0;
    // se hai superato la verifica, consideriamo il blocco "avanzato" anche se non tutto verde
    const pct = completed ? 1 : (passed ? Math.max(0.8, avg) : avg);

    row.innerHTML = `
      <div class="dashRowTop">
        <div><strong>${label} ${b.id}</strong> <span class="muted">${b.name.replace(/^.. /,"")}</span></div>
        <div class="tag">${Math.round(pct*100)}%</div>
      </div>
      <div class="bar"><div style="width:${pctToWidth(pct)}"></div></div>
      <div class="dashMeta">${passed ? "Verifica: ✅" : "Verifica: —"} • Allenamento: ${seen.reduce((a,s)=>a+s.n,0)} tentativi</div>
    `;
    dash.appendChild(row);
  }

  // badges
  const bDone = [];
  for(const b of BLOCKS){
    if(blockCompleted(profile, b.id)){
      bDone.push(b.id);
    }
  }
  if(bDone.length){
    const row = document.createElement("div");
    row.className = "dashRow";
    row.innerHTML = `<div class="dashRowTop"><div><strong>🏅 Badge</strong> <span class="muted">obiettivi raggiunti</span></div></div>
      <div class="muted" style="margin-top:8px">${bDone.map(x=>`<span class="tag" style="margin-right:6px">${x} completato</span>`).join("")}</div>`;
    dash.appendChild(row);
  }
}

/* -------------------- Home status -------------------- */
function updateHomeStatus(){
  const next = pickTrainingBlock(profile);
  // Se hai gia' una selezione, mostriamo anche il consiglio senza sovrascrivere.
  var base = 'Stato: consigliato ' + next;
  if(profile.lastBlock && profile.lastMode){
    var m = profile.lastMode==='verify' ? 'Verifica' : 'Allenamento';
    base = 'Selezione: ' + profile.lastBlock + ' • ' + m + ' — consigliato ' + next;
  }
  $('statusPill').textContent = base;
  $('homeHint').textContent = 'Consiglio: Allenati su ' + next + ' (e ogni tanto ripassa i blocchi precedenti).';
  updateResumeButton();
}

/* -------------------- Build quiz queue -------------------- */


/* -------------------- Spaced repetition (richiami) -------------------- */
function allBlocksBefore(blockId){
  const path = ["P0","M1","M2","M3","M4","M5"];
  const idx = path.indexOf(blockId);
  if(idx<=0) return [];
  return path.slice(0, idx);
}

function pickRecallQuestion(profile, currentBlock){
  // Prende 1 domanda da un blocco precedente, preferendo skill con bassa percentuale
  const prev = allBlocksBefore(currentBlock);
  if(!prev.length) return null;

  // raccogli candidati
  let candidates = [];
  for(const bid of prev){
    const bank = bankFor(bid);
    for(const q of bank){
      candidates.push(q);
    }
  }
  if(!candidates.length) return null;

  // pesa per "debolezza" della skill principale
  function qSkill(q){
    if(q.type==='guided'){
      if(q.skills && q.skills.length) return q.skills[0];
      if(q.steps && q.steps.length && q.steps[0].skill) return q.steps[0].skill;
      return null;
    }
    return q.skill || null;
  }

  const scored = candidates.map(q=>{
    const sid = qSkill(q);
    const st = sid ? skillStats(profile, sid) : {n:0,pct:0};
    const pct = st.n ? st.pct : 0; // non vista = 0
    // score alto se pct basso
    return {q, w: 1 + (1 - pct)};
  });

  // roulette selection
  const total = scored.reduce((a,x)=>a+x.w,0);
  let r = Math.random()*total;
  for(const x of scored){
    r -= x.w;
    if(r<=0) return x.q;
  }
  return scored[0].q;
}
function buildQueue(blockId, modeWanted){
  const bank = bankFor(blockId);

  if(modeWanted === "verify"){
    // fixed length verify
    const N = Math.min(12, bank.length); // lightweight
    return shuffle(bank).slice(0,N);
  }

  // TRAIN: copri prima le skill non ancora "verdi", poi rinforza la piu' debole.
  // Questo evita di restare bloccati su una sola skill e rende realistico completare un blocco.
  const b = blockById(blockId);
  const notGreen = b.skills.filter(function(sid){ return !skillGreen(profile, sid); });
  var out = [];

  // 1) 1 domanda per ogni skill non verde (se possibile)
  shuffle(notGreen).forEach(function(sid){
    if(out.length >= 10) return;
    var candidates = bank.filter(function(q){
      if(q.type === "guided"){
        var inSkills = q.skills && q.skills.indexOf(sid) !== -1;
        var inSteps = q.steps && q.steps.some(function(st){ return st.skill === sid; });
        return !!(inSkills || inSteps);
      }
      return q.skill === sid;
    });
    if(candidates.length){
      out.push(candidates[Math.floor(Math.random()*candidates.length)]);
    }
  });

  // 2) riempi fino a 10 con la piu' debole
  var targetSkill = weakestSkill(profile, b.skills);
  var pool = bank.filter(function(q){
    if(q.type === "guided"){
      var inSkills = q.skills && q.skills.indexOf(targetSkill) !== -1;
      var inSteps = q.steps && q.steps.some(function(st){ return st.skill === targetSkill; });
      return !!(inSkills || inSteps);
    }
    return q.skill === targetSkill;
  });

  while(out.length < Math.min(10, bank.length)){
    var source = pool.length ? pool : bank;
    out.push(source[Math.floor(Math.random()*source.length)]);
  }

  // Inserisci 1 richiamo da un blocco precedente (spaced repetition)
  const recall = pickRecallQuestion(profile, blockId);
  if(recall){
    out[out.length-1] = recall;
  }

  return shuffle(out).slice(0, 10);
}

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

/* -------------------- Start flows -------------------- */
function startBlock(blockId, modeWanted){
  mode = modeWanted;
  currentBlock = blockId;
  setActiveUI(blockId, modeWanted);
  updateResumeButton();

  // Modalita' "tutto accessibile": nessun reindirizzamento per prerequisiti.

  queue = buildQueue(blockId, modeWanted);
  qIndex = 0;
  score = 0;
  guidedState = null;

  hide("home");
  hide("progressView");
  show("quiz");

  renderQuestion();
}

function startVerify(){
  // Modalita' "tutto accessibile": Verifica sempre disponibile sul blocco selezionato.
  var bid = profile.lastBlock || pickTrainingBlock(profile);
  startBlock(bid, 'verify');
}

function startRecommended(){
  // Se esiste una sessione precedente, riprendi quella (di solito Allenamento).
  if(profile.lastBlock && profile.lastMode){
    var bid = profile.lastBlock;
    var m = profile.lastMode;
    // Per il pulsante principale preferiamo Allenamento: se l'ultima era Verifica, riparti in Allenamento sullo stesso blocco.
    if(m==='verify') m='train';
    startBlock(bid, m);
    return;
  }
  var bid2 = pickTrainingBlock(profile);
  startBlock(bid2, 'train');
}

/* -------------------- Render question -------------------- */
function setProgressBar(){
  const pct = queue.length ? (qIndex/queue.length)*100 : 0;
  $("progressBar").style.width = `${pct}%`;
}

function setRule(q){
  if(mode === "verify"){
    $("ruleNote").classList.add("hidden");
    return;
  }
  $("ruleNote").classList.remove("hidden");
  const txt = q.rule ? `${q.rule}\nEsempio: ${q.example || "—"}` : "—";
  $("ruleText").textContent = txt;
}

function setMeta(q){
  $("meta").textContent = `${mode==="train" ? "Allenamento" : "Verifica"} • Blocco ${currentBlock}`;
}

function renderQuestion(){
  locked = false;
  $("nextBtn").disabled = true;
  $("feedback").textContent = "";
  $("choices").innerHTML = "";
  hide("openWrap");

  const q = queue[qIndex];
  lastContext = { block: currentBlock, mode, qIndex, total: queue.length, q: q, step: null };
  if(!q){
    finishBlock();
    return;
  }

  $("quizTitle").textContent = `${qIndex+1}/${queue.length}`;
  $("scorePill").textContent = `Punti: ${score}`;

  setProgressBar();

  if(q.type === "guided"){
    guidedState = { q, stepIndex: 0 };
    renderGuidedStep();
    return;
  }

  guidedState = null;
  setRule(q);
  setMeta(q);

  $("qtext").textContent = formatExponents(q.prompt);

  if(q.type === "mcq"){
    q.choices.forEach((c,i)=>{
      const btn = document.createElement("button");
      btn.className="choice";
      btn.type="button";
      btn.textContent = formatExponents(c);
      btn.addEventListener("click", ()=> chooseMCQ(i, btn));
      $("choices").appendChild(btn);
    });
  } else {
    show("openWrap");
    $("openInput").value = "";
    $("openInput").focus();
    renderKeypad();
  }
}

function renderGuidedStep(){
  const {q, stepIndex} = guidedState;
  const step = q.steps[stepIndex];
  lastContext = { block: currentBlock, mode, qIndex, total: queue.length, q: q, stepIndex: stepIndex, step: step };

  $("qtext").textContent = formatExponents(`${q.title}\n\nStep ${stepIndex+1}/${q.steps.length}: ${step.prompt}`);
  setRule(step);
  setMeta(step);

  $("choices").innerHTML = "";
  hide("openWrap");
  $("feedback").textContent = "";
  $("nextBtn").disabled = true;
  locked = false;

  if(step.type === "mcq"){
    step.choices.forEach((c,i)=>{
      const btn = document.createElement("button");
      btn.className="choice";
      btn.type="button";
      btn.textContent = formatExponents(c);
      btn.addEventListener("click", ()=> chooseGuidedMCQ(i, btn));
      $("choices").appendChild(btn);
    });
  } else {
    show("openWrap");
    $("openInput").value = "";
    $("openInput").focus();
    renderKeypad();
  }
}

/* -------------------- Keypad -------------------- */
function insertAtCursor(input, text){
  const start = (input.selectionStart === null || input.selectionStart === undefined) ? input.value.length : input.selectionStart;
  const end = (input.selectionEnd === null || input.selectionEnd === undefined) ? input.value.length : input.selectionEnd;
  const v = input.value;
  input.value = v.slice(0,start) + text + v.slice(end);
  input.focus();
  const pos = start + text.length;
  input.setSelectionRange(pos,pos);
}

function renderKeypad(){
  const keys = ["x","y","a","b","^","+","-","(",")","/","*","1","2","3","4","5","6","7","8","9","0"];
  const pad = $("keypad");
  pad.innerHTML = "";
  keys.forEach(k=>{
    const b = document.createElement("div");
    b.className="key";
    b.textContent = k;
    b.addEventListener("click", ()=>{
      insertAtCursor($("openInput"), k);
    });
    pad.appendChild(b);
  });
  const del = document.createElement("div");
  del.className="key wide";
  del.textContent = "⌫";
  del.addEventListener("click", ()=>{
    const input = $("openInput");
    const start = (input.selectionStart === null || input.selectionStart === undefined) ? input.value.length : input.selectionStart;
    const end = (input.selectionEnd === null || input.selectionEnd === undefined) ? input.value.length : input.selectionEnd;
    if(start!==end){
      const v = input.value;
      input.value = v.slice(0,start) + v.slice(end);
      input.setSelectionRange(start,start);
      input.focus();
      return;
    }
    if(start>0){
      const v = input.value;
      input.value = v.slice(0,start-1)+v.slice(start);
      input.setSelectionRange(start-1,start-1);
      input.focus();
    }
  });
  pad.appendChild(del);

  const clr = document.createElement("div");
  clr.className="key wide";
  clr.textContent = "C";
  clr.addEventListener("click", ()=>{
    $("openInput").value="";
    $("openInput").focus();
  });
  pad.appendChild(clr);
}

/* -------------------- Answering -------------------- */
function explainWrong(q, extra){
  const base = q.explainNo || "";
  return [base, extra].filter(Boolean).join("\n");
}
function explainRight(q){
  return q.explainOk || "✅ Corretto!";
}

function updateAfterAnswer(skillId, ok){
  pushSkill(profile, skillId, ok);

  // streak
  profile.streak = ok ? (profile.streak + 1) : 0;

  // badge checks (block completion)
  for(const b of BLOCKS){
    if(!profile.badges[b.id] && blockCompleted(profile, b.id)){
      profile.badges[b.id] = true;
      toast(`🏅 ${b.id} completato!`);
    }
  }

  saveProfile(profile);
}

function chooseMCQ(i, btn){
  if(locked) return;
  locked = true;
  const q = queue[qIndex];

  const all = Array.from(document.querySelectorAll(".choice"));
  all.forEach(b=>b.disabled=true);

  const correct = q.answerIndex;
  const ok = (i === correct);

  all[correct].classList.add("correct");
  if(!ok) btn.classList.add("wrong");

  if(ok){
    score += 1;
    $("feedback").textContent = explainRight(q);
  } else {
    $("feedback").textContent = explainWrong(q);
  }

  updateAfterAnswer(q.skill, ok);
  checkUnlocks();
  $("scorePill").textContent = `Punti: ${score}`;
  $("nextBtn").disabled = false;
}

function checkOpen(q){
  const u = $("openInput").value;
  if(q.checker) return !!q.checker(u);
  if(typeof q.answer === "string"){
    return compareOpenAnswer(u, q.answer).ok;
  }
  return false;
}

function compareOpenAnswer(user, expected){
  // returns {ok:boolean, equivalence:boolean}
  if(normalizeInput(user) === normalizeInput(expected)){
    return {ok:true, equivalence:false};
  }
  if(isMathLike(user) && isMathLike(expected) && equivalentMath(user, expected)){
    return {ok:true, equivalence:true};
  }
  return {ok:false, equivalence:false};
}

function submitOpen(){
  if(locked) return;
  locked = true;
  const q = queue[qIndex];
  let meta = {ok:false, equivalence:false};
  if(q.checker){
    meta.ok = !!q.checker($("openInput").value);
  } else if(typeof q.answer === "string"){
    meta = compareOpenAnswer($("openInput").value, q.answer);
  }
  const ok = meta.ok;

  if(ok){
    score += 1;
    if(meta.equivalence && q.answer){
      // Correct but in a different (equivalent) form: teach the standard form
      $("feedback").textContent = "✅ Corretto (forma equivalente). Forma standard: " + formatExponents(q.answer);
    } else {
      $("feedback").textContent = explainRight(q) || "✅ Corretto!";
    }
  } else {
    // show correction more explicit in training
    let extra = "";
    if(mode==="train"){
      if(q.answer) extra = `Corretto: ${formatExponents(q.answer)}`;
      else if(q.example) extra = `Esempio: ${formatExponents(q.example)}`;
    }
    $("feedback").textContent = explainWrong(q, extra) || "❌ Non corretto. Riprova.";
  }

  updateAfterAnswer(q.skill, ok);
  checkUnlocks();
  $("scorePill").textContent = `Punti: ${score}`;
  $("nextBtn").disabled = false;
}

/* guided */
function chooseGuidedMCQ(i, btn){
  if(locked) return;
  locked = true;

  const {q, stepIndex} = guidedState;
  const step = q.steps[stepIndex];

  const all = Array.from(document.querySelectorAll(".choice"));
  all.forEach(b=>b.disabled=true);

  const ok = (i === step.answerIndex);
  all[step.answerIndex].classList.add("correct");
  if(!ok) btn.classList.add("wrong");

  var msg = ok ? "✅ Ok" : "❌ No";
  // Spiegazione anche nei guidati (se presente)
  var exp = "";
  if(ok && step.explainOk) exp = step.explainOk;
  if(!ok && step.explainNo) exp = step.explainNo;
  if(!exp && q.rule && mode==="train") exp = q.rule;
  $("feedback").textContent = exp ? (msg + " — " + exp) : (ok ? "✅ Ok" : "❌ No. Rileggi la regola e riprova.");

  updateAfterAnswer(step.skill, ok);
  checkUnlocks();
  $("nextBtn").disabled = false;
}

function submitGuidedOpen(){
  if(locked) return;
  locked = true;

  const {q, stepIndex} = guidedState;
  const step = q.steps[stepIndex];

  let meta = {ok:false, equivalence:false};
  if(step.checker){
    meta.ok = !!step.checker($("openInput").value);
  } else if(typeof step.answer === "string"){
    meta = compareOpenAnswer($("openInput").value, step.answer);
  }
  const ok = meta.ok;

  var msg2 = ok ? "✅ Ok" : "❌ No";
  var exp2 = "";
  if(ok && step.explainOk) exp2 = step.explainOk;
  if(!ok && step.explainNo) exp2 = step.explainNo;
  if(!exp2 && q.rule && mode==="train") exp2 = q.rule;
  if(ok && meta.equivalence && step.answer){
    $("feedback").textContent = "✅ Ok (forma equivalente). Forma standard: " + formatExponents(step.answer);
  } else {
    $("feedback").textContent = exp2 ? (msg2 + " — " + exp2) : (ok ? "✅ Ok" : "❌ No. Riprova seguendo la regola.");
  }
  updateAfterAnswer(step.skill, ok);
  checkUnlocks();
  $("nextBtn").disabled = false;
}

function checkUnlocks(){
  // unlock hints for M2 based on M1 completion, etc.
  // nothing to do here besides toast handled in badge checks; but give specific message when M1 becomes ready for M2
  const m1Done = blockCompleted(profile, "M1");
  if(m1Done && !profile.badges["M1_UNLOCK_M2"]){
    profile.badges["M1_UNLOCK_M2"] = true;
    toast("🏅 Hai davvero capito i monomi! Si sblocca M2.");
    saveProfile(profile);
  }
}

/* -------------------- Finish block session -------------------- */
function finishBlock(){
  // alla fine: se era una VERIFICA e hai >=80%, segna il blocco come "superato"
  if(mode === "verify" && queue.length){
    var pct = score / queue.length;
    if(pct >= 0.8){
      if(!profile.passedBlocks) profile.passedBlocks = {};
      profile.passedBlocks[currentBlock] = true;
      toast(`✅ Verifica superata su ${currentBlock}! (${Math.round(pct*100)}%)`);
      saveProfile(profile);
    } else {
      toast(`❌ Verifica non superata su ${currentBlock} (${Math.round(pct*100)}%).`);
    }
  } else {
    toast(`Sessione finita: ${score}/${queue.length}`);
  }
  goHome();
}

/* -------------------- Navigation -------------------- */
function goHome(){
  hide("quiz");
  hide("progressView");
  show("home");
  renderBlocks();
  renderDashboard();
  updateHomeStatus();
}

function showProgress(){
  hide("home");
  hide("quiz");
  show("progressView");
  renderProgressDetail();
}

function renderProgressDetail(){
  const body = $("progressBody");
  body.innerHTML = "";

  for(const b of BLOCKS){
    const card = document.createElement("div");
    card.className = "progressCard";
    const completed = blockCompleted(profile, b.id);
    card.innerHTML = `<h3>${b.id} — ${b.name.replace(/^.. /,"")}</h3>
      <div class="muted tiny">${completed ? "✅ completato" : "in progresso"}</div>`;
    for(const sid of b.skills){
      const st = skillStats(profile, sid);
      const pct = st.n ? Math.round(st.pct*100) : 0;
      const status = skillGreen(profile, sid) ? "✅" : (st.n ? "🟡" : "⚪");
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<div>${status} <span class="muted">${labelSkill(sid)}</span></div><div class="tag">${pct}%</div>`;
      card.appendChild(row);
    }
    body.appendChild(card);
  }
}

function resetAll(){
  if(!confirm("Reset progressi?")) return;
  localStorage.removeItem(LS.profile);
  profile = loadProfile();
  toast("Reset fatto.");
  goHome();
}

/* -------------------- Navigation + Settings (v10) -------------------- *...
$("saveNameBtn").addEventListener("click", ()=>{
  const n = $("nameInput").value.trim();
  if(!n){ toast("Scrivi un nome."); return; }
  localStorage.setItem(LS.name, n);

  // c’è una sola classe
  localStorage.setItem(LS.classId, CLASS_ID);
  setSafeName();
  // sync iniziale su Firebase (se configurato)
  scheduleFirebaseSync();
  // avvia lista compagni
  listenClassmates().catch(()=>{});
  hide("onboarding");
  show("home");
  goHome();
});

$("trainBtn").addEventListener("click", ()=> startRecommended());
$("verifyBtn").addEventListener("click", ()=> startVerify());
$("progressBtn").addEventListener("click", ()=> showProgress());
$("progressHomeBtn").addEventListener("click", ()=> goHome());
$("resetBtn").addEventListener("click", ()=> resetAll());

// v10: nav + settings modal
const _bind=(id,fn)=>{const el=$(id); if(el) el.addEventListener('click',fn);};
_bind('settingsTopBtn',()=>{ const si=$('settingsNameInput'); if(si) si.value=(localStorage.getItem(LS.name)||''); const sub=$('settingsSubtitle'); if(sub) sub.textContent=APP_VERSION; openModal('settingsModal'); });
document.querySelectorAll('[data-close="settings"]').forEach(el=>el.addEventListener('click',()=>closeModal('settingsModal')));
_bind('settingsSaveName',()=>{ const v=($('settingsNameInput').value||'').trim(); if(!v){toast('Scrivi un nome.');return;} localStorage.setItem(LS.name,v); setSafeName(); scheduleFirebaseSync(); toast('Nome salvato.'); });
_bind('copyDiagnostics',()=>copyToClipboard(diagnosticsText()));
_bind('reportBug',()=>copyToClipboard('BUG REPORT\n'+diagnosticsText()));
_bind('navHome',()=>{ closeModal('settingsModal'); setNavActiveSafe('navHome'); goHome(); });
_bind('navTrain',()=>{ closeModal('settingsModal'); setNavActiveSafe('navTrain'); startRecommended(); });
_bind('navVerify',()=>{ closeModal('settingsModal'); setNavActiveSafe('navVerify'); startVerify(); });
_bind('navProgress',()=>{ closeModal('settingsModal'); setNavActiveSafe('navProgress'); showProgress(); });
_bind('navSettings',()=>{ setNavActiveSafe('navSettings'); const si=$('settingsNameInput'); if(si) si.value=(localStorage.getItem(LS.name)||''); const sub=$('settingsSubtitle'); if(sub) sub.textContent=APP_VERSION; openModal('settingsModal'); });
function setNavActiveSafe(id){ document.querySelectorAll('.navBtn').forEach(b=>b.classList.remove('is-active')); const el=$(id); if(el) el.classList.add('is-active'); }

$("backHomeBtn").addEventListener("click", ()=> goHome());
$("nextBtn").addEventListener("click", ()=>{
  if(guidedState){
    guidedState.stepIndex++;
    if(guidedState.stepIndex >= guidedState.q.steps.length){
      // mark overall guided completion as 1 point
      score += 1;
      qIndex++;
      renderQuestion();
    } else {
      renderGuidedStep();
    }
    return;
  }
  qIndex++;
  renderQuestion();
});

$("checkOpenBtn").addEventListener("click", ()=>{
  if(guidedState){
    submitGuidedOpen();
  } else {
    submitOpen();
  }
});

$("openInput").addEventListener("keydown", (e)=>{
  if(e.key==="Enter"){
    e.preventDefault();
    $("checkOpenBtn").click();
  }
});

/* -------------------- Boot -------------------- */
(function init(){
  const av=$("appVersion"); if(av) av.textContent=APP_VERSION;
  try{window.addEventListener("error",(e)=>{profile.lastError={message:e.message,source:e.filename,line:e.lineno,col:e.colno}; saveProfile(profile);});}catch{}
  setNavActiveSafe && setNavActiveSafe("navHome");
  // onboarding
  const n = localStorage.getItem(LS.name);
  if(n){
    hide("onboarding");
    show("home");
    setSafeName();
    goHome();
  } else {
    show("onboarding");
    hide("home");
  }

  // PWA SW register (if file exists later)
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }
})();
