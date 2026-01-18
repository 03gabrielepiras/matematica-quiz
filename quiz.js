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
const APP_VERSION = "v20";
// Flag per capire se quiz.js e' davvero partito (utile su iOS/PWA)
window.__QUIZ_JS_LOADED = true;
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


/* -------------------- Backup progressi (v12) -------------------- */
function buildExportPayload(){
  const name=(localStorage.getItem(LS.name)||'').trim();
  return {
    app: 'matematica-quiz',
    schema: 1,
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    name,
    profile
  };
}

function downloadTextFile(filename, content){
  try{
    const blob = new Blob([content], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1500);
  } catch {
    toast('Download non disponibile.');
  }
}

function exportProgress(){
  const payload = buildExportPayload();
  const json = JSON.stringify(payload, null, 2);
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  const filename = `matematica_progressi_${y}-${m}-${d}.json`;
  downloadTextFile(filename, json);
  // copia anche negli appunti (se possibile)
  copyToClipboard(json).catch(()=>{});
  toast('Progressi esportati.');
}

function coerceImported(data){
  // accetta: payload completo oppure direttamente un profilo
  if(data && typeof data === 'object'){
    if(data.profile && typeof data.profile === 'object'){
      return { name: (data.name||''), profile: data.profile };
    }
    // magari mi hanno incollato solo il profilo
    if(data.skills && typeof data.skills === 'object'){
      return { name: '', profile: data };
    }
  }
  return null;
}

function importProgressFromObject(obj){
  const coerced = coerceImported(obj);
  if(!coerced){ toast('JSON non valido.'); return; }

  // valida minimo
  const importedProfile = mergeProfileDefaults(coerced.profile);
  if(!importedProfile || !importedProfile.skills){ toast('Profilo non valido.'); return; }

  // salva
  localStorage.setItem(LS.profile, JSON.stringify(importedProfile));
  profile = importedProfile;

  const nm = (coerced.name||'').trim();
  if(nm) localStorage.setItem(LS.name, nm);

  setSafeName();
  scheduleFirebaseSync();
  toast('Import completato.');
  // pulisci textarea
  const ta = $('importProgressText');
  if(ta) ta.value='';
  goHome();
}

function importProgressFromText(){
  const ta = $('importProgressText');
  const raw = (ta ? ta.value : '').trim();
  if(!raw){ toast('Incolla un JSON.'); return; }
  try {
    const obj = JSON.parse(raw);
    importProgressFromObject(obj);
  } catch {
    toast('JSON non valido.');
  }
}

function importProgressFromFile(file){
  if(!file){ toast('Seleziona un file JSON.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const obj = JSON.parse(String(reader.result||''));
      importProgressFromObject(obj);
    } catch {
      toast('File JSON non valido.');
    }
  };
  reader.onerror = () => toast('Impossibile leggere il file.');
  reader.readAsText(file);
}

function resetProgressHard(){
  if(!confirm('Vuoi davvero cancellare TUTTI i progressi su questo dispositivo?')) return;
  if(!confirm("Conferma: questa operazione non si puo' annullare.")) return;
  localStorage.removeItem(LS.profile);
  profile = loadProfile();
  scheduleFirebaseSync();
  toast('Progressi azzerati.');
  goHome();
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

/* -------------------- Backup (Export/Import/Reset) -------------------- */
function exportProgressData(){
  const name = localStorage.getItem(LS.name) || '';
  const profile = loadProfile();
  return {
    app: 'matematica-quiz',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    name,
    profile
  };
}

function downloadJson(filename, obj){
  try {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1500);
  } catch(e){
    console.warn('downloadJson failed', e);
  }
}

function validateImportObject(obj){
  if(!obj || typeof obj !== 'object') return {ok:false, msg:'JSON non valido.'};
  if(!obj.profile || typeof obj.profile !== 'object') return {ok:false, msg:'Manca il campo profile.'};
  return {ok:true, msg:'OK'};
}

function applyImportedData(obj, mode){
  // mode: 'replace' (default)
  const v = validateImportObject(obj);
  if(!v.ok) return v;
  const importedProfile = mergeProfileDefaults(obj.profile);
  localStorage.setItem(LS.profile, JSON.stringify(importedProfile));
  if(typeof obj.name === 'string') localStorage.setItem(LS.name, obj.name);
  return {ok:true, msg:'Import completato'};
}

function resetAllProgress(keepName){
  localStorage.removeItem(LS.profile);
  if(!keepName) localStorage.removeItem(LS.name);
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

function qMCQ(o){ return Object.assign({type:"mcq"}, o); }
function qOPEN(o){ return Object.assign({type:"open"}, o); }
function qGUIDED(o){ return Object.assign({type:"guided"}, o); }

/* -------------------- Question bank (JSON) --------------------
   In v17 le domande stanno in /data/*.json per poter crescere facilmente.
   Vengono precaricate dal Service Worker per funzionare anche offline.
--------------------------------------------------------------- */

const BANK_PATH = {
  "P0":"data/P0.json",
  "M1":"data/M1.json",
  "M2":"data/M2.json",
  "M3":"data/M3.json",
  "M4":"data/M4.json",
  "M5":"data/M5.json"
};

let BANKS = {P0:[],M1:[],M2:[],M3:[],M4:[],M5:[]};
let BANKS_READY = false;
let BANKS_PROMISE = null;

async function loadAllBanks(){
  if(BANKS_PROMISE) return BANKS_PROMISE;
  BANKS_PROMISE = (async ()=>{
    const keys = Object.keys(BANK_PATH);
    for(const k of keys){
      const url = BANK_PATH[k];
      const res = await fetch(url, {cache:'no-store'});
      if(!res.ok) throw new Error('Impossibile caricare '+url);
      const arr = await res.json();
      // basic sanitize
      BANKS[k] = Array.isArray(arr) ? arr : [];
    }
    BANKS_READY = true;
    return true;
  })();
  return BANKS_PROMISE;
}

function bankFor(blockId){
  return (BANKS[blockId] || []).slice();
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


async function ensureBanksReady(){
  if(BANKS_READY) return true;
  try{
    toast('⏳ Caricamento domande...');
    await loadAllBanks();
    toast('✅ Domande caricate.');
    return true;
  }catch(e){
    console.error(e);
    toast('❌ Errore nel caricamento domande. Riprova online.');
    return false;
  }
}
/* -------------------- Start flows -------------------- */
async function startBlock(blockId, modeWanted){
  mode = modeWanted;
  currentBlock = blockId;
  setActiveUI(blockId, modeWanted);
  updateResumeButton();

  if(!(await ensureBanksReady())){
    // resta in home se non possiamo caricare
    goHome();
    return;
  }

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

async function startVerify(){
  // Modalita' "tutto accessibile": Verifica sempre disponibile sul blocco selezionato.
  var bid = profile.lastBlock || pickTrainingBlock(profile);
  await startBlock(bid, 'verify');
}

async function startRecommended(){
  // Se esiste una sessione precedente, riprendi quella (di solito Allenamento).
  if(profile.lastBlock && profile.lastMode){
    var bid = profile.lastBlock;
    var m = profile.lastMode;
    // Per il pulsante principale preferiamo Allenamento: se l'ultima era Verifica, riparti in Allenamento sullo stesso blocco.
    if(m==='verify') m='train';
    await startBlock(bid, m);
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

/* -------------------- Navigation + Settings (v10+) -------------------- */
// helper: binding sicuro
const _bind=(id,fn)=>{const el=$(id); if(el) el.addEventListener('click',fn);};

_bind("saveNameBtn", ()=>{
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

// Alcune UI (restyle) non hanno i vecchi bottoni trainBtn/verifyBtn/progressBtn.
_bind("trainBtn", () => startRecommended());
_bind("verifyBtn", () => startVerify());
_bind("progressBtn", () => showProgress());

_bind("progressHomeBtn", ()=> goHome());
_bind("resetBtn", ()=> resetAll());
_bind('settingsTopBtn',()=>{ const si=$('settingsNameInput'); if(si) si.value=(localStorage.getItem(LS.name)||''); const sub=$('settingsSubtitle'); if(sub) sub.textContent=APP_VERSION; openModal('settingsModal');
  const pre=$('diagnosticsPre'); if(pre) pre.textContent = diagnosticsText(); });
document.querySelectorAll('[data-close="settings"]').forEach(el=>el.addEventListener('click',()=>closeModal('settingsModal')));
_bind('settingsSaveName',()=>{ const v=($('settingsNameInput').value||'').trim(); if(!v){toast('Scrivi un nome.');return;} localStorage.setItem(LS.name,v); setSafeName(); scheduleFirebaseSync(); toast('Nome salvato.'); });
_bind('copyDiagnostics',()=>copyToClipboard(diagnosticsText()));
_bind('exportProgress',()=>exportProgress());
_bind('importProgressBtn',()=>{ const fi=$('importProgressFile'); if(fi) fi.click(); });
_bind('importProgressTextBtn',()=>importProgressFromText());
_bind('resetProgress',()=>resetProgressHard());
const _impFile=$('importProgressFile'); if(_impFile){ _impFile.addEventListener('change', (e)=>{ const f=e.target.files && e.target.files[0]; importProgressFromFile(f); _impFile.value=''; }); }

_bind('copyBugReport',()=>copyToClipboard('BUG REPORT\n'+diagnosticsText()));
_bind('navHome',()=>{ closeModal('settingsModal'); setNavActiveSafe('navHome'); goHome(); });
_bind('navTrain',()=>{ closeModal('settingsModal'); setNavActiveSafe('navTrain'); startRecommended(); });
_bind('navVerify',()=>{ closeModal('settingsModal'); setNavActiveSafe('navVerify'); startVerify(); });
_bind('navProgress',()=>{ closeModal('settingsModal'); setNavActiveSafe('navProgress'); showProgress(); });
_bind('navSettings',()=>{ setNavActiveSafe('navSettings'); const si=$('settingsNameInput'); if(si) si.value=(localStorage.getItem(LS.name)||''); const sub=$('settingsSubtitle'); if(sub) sub.textContent=APP_VERSION; openModal('settingsModal');
  const pre=$('diagnosticsPre'); if(pre) pre.textContent = diagnosticsText(); });
function setNavActiveSafe(id){ document.querySelectorAll('.navBtn').forEach(b=>b.classList.remove('is-active')); const el=$(id); if(el) el.classList.add('is-active'); }

// Router unico basato su data-action (robusto ai restyle)
document.addEventListener('click', (e) => {
  const btn = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
  if(!btn) return;
  const action = btn.getAttribute('data-action');
  if(!action) return;
  // evita doppi click su elementi nested
  e.preventDefault();
  try{
    switch(action){
      case 'continue':
        // usa la stessa logica del bottone Continua
        if($("saveNameBtn")) $("saveNameBtn").click();
        break;
      case 'go-home':
        closeModal('settingsModal');
        setNavActiveSafe('navHome');
        goHome();
        break;
      case 'go-progress':
        closeModal('settingsModal');
        setNavActiveSafe('navProgress');
        showProgress();
        break;
      case 'start-train':
        closeModal('settingsModal');
        setNavActiveSafe('navTrain');
        startRecommended();
        break;
      case 'start-verify':
        closeModal('settingsModal');
        setNavActiveSafe('navVerify');
        startVerify();
        break;
      case 'open-settings':
        setNavActiveSafe('navSettings');
        { const si=$('settingsNameInput'); if(si) si.value=(localStorage.getItem(LS.name)||''); const sub=$('settingsSubtitle'); if(sub) sub.textContent=APP_VERSION; openModal('settingsModal');
          const pre=$('diagnosticsPre'); if(pre) pre.textContent = diagnosticsText(); }
        break;
      case 'submit-open':
        if($("checkOpenBtn")) $("checkOpenBtn").click();
        break;
      case 'reset-progress':
        resetAll();
        break;
      default:
        break;
    }
  }catch(err){
    console.warn('Action error', action, err);
    toast('Errore: '+ action);
  }
}, {passive:false});

_bind("backHomeBtn", ()=> goHome());
_bind("nextBtn", ()=>{
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

_bind("checkOpenBtn", ()=>{
  if(guidedState){
    submitGuidedOpen();
  } else {
    submitOpen();
  }
});

const _openInput = $("openInput");
if(_openInput){
  _openInput.addEventListener("keydown", (e)=>{
  if(e.key==="Enter"){
    e.preventDefault();
    $("checkOpenBtn").click();
  }
  });
}

/* -------------------- Boot -------------------- */
(function init(){
  const av=$("appVersion"); if(av) av.textContent=APP_VERSION;
  try{ const sp=$("statusPill"); if(sp) sp.textContent = "Stato: JS ok"; }catch{}
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

  // PWA: Service Worker con update controllato
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./sw.js").then((reg)=>{
      let bannerEl=null;

      function ensureBanner(){
        if(bannerEl) return bannerEl;
        bannerEl=document.createElement("div");
        bannerEl.id="swUpdate";
        bannerEl.innerHTML=
          "<div class=\"swUpdate__text\">Nuova versione disponibile</div>"+
          "<button class=\"swUpdate__btn\" id=\"swUpdateBtn\">Aggiorna</button>";
        document.body.appendChild(bannerEl);
        const btn=document.getElementById("swUpdateBtn");
        if(btn){
          btn.onclick=()=>{
            try{
              if(reg.waiting){
                reg.waiting.postMessage({type:"SKIP_WAITING"});
              } else {
                reg.update().then(()=>{
                  if(reg.waiting) reg.waiting.postMessage({type:"SKIP_WAITING"});
                }).catch(()=>{});
              }
            }catch{}
          };
        }
        return bannerEl;
      }

      function showBanner(){
        const el=ensureBanner();
        el.classList.add("is-visible");
      }

      // Se c'e gia' una waiting worker (update pronto)
      if(reg.waiting && navigator.serviceWorker.controller){
        showBanner();
      }

      reg.addEventListener("updatefound", ()=>{
        const nw=reg.installing;
        if(!nw) return;
        nw.addEventListener("statechange", ()=>{
          if(nw.state==="installed" && navigator.serviceWorker.controller){
            showBanner();
          }
        });
      });

      let refreshing=false;
      navigator.serviceWorker.addEventListener("controllerchange", ()=>{
        if(refreshing) return;
        refreshing=true;
        window.location.reload();
      });
    }).catch(()=>{});
  }
})();
