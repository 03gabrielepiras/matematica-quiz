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
const APP_VERSION = "v29";
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

function syncEvalSettingsUI(){
  const s = (profile && profile.settings) ? profile.settings : makeEmptyProfile().settings;
  const a = $('optSuggestStandard'); if(a) a.checked = !!s.suggestStandard;
  const b = $('optWarnStandardVerify'); if(b) b.checked = !!s.warnStandardInVerify;
}

function saveEvalSettingsFromUI(){
  if(!profile.settings) profile.settings = makeEmptyProfile().settings;
  const a = $('optSuggestStandard');
  const b = $('optWarnStandardVerify');
  profile.settings.suggestStandard = a ? !!a.checked : true;
  profile.settings.warnStandardInVerify = b ? !!b.checked : true;
  saveProfile(profile);
  toast('Impostazioni salvate.');
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

/* -------------------- Contenuti: Import/Export (no-code) -------------------- */
function setContentStatus(msg){
  const pre = $('contentImportStatus');
  if(pre) pre.textContent = msg;
}

function validateContentObject(obj){
  if(!obj || typeof obj !== 'object') return {ok:false, msg:'JSON non valido.'};
  // unità singola
  if(typeof obj.id === 'string' && Array.isArray(obj.questions)){
    return validateUnitJson(obj);
  }
  // pacchetto
  if(obj.catalog && obj.catalog.units && Array.isArray(obj.catalog.units)){
    if(obj.units && Array.isArray(obj.units)){
      for(const u of obj.units){
        const v = validateUnitJson(u);
        if(!v.ok) return {ok:false, msg:'Errore in '+(u && u.id ? u.id : 'unità')+': '+v.msg};
      }
      return {ok:true, msg:'OK ('+obj.units.length+' unità)'};
    }
    return {ok:true, msg:'OK (solo catalogo)'};
  }
  if(Array.isArray(obj.units)){
    for(const u of obj.units){
      const v = validateUnitJson(u);
      if(!v.ok) return {ok:false, msg:'Errore in '+(u && u.id ? u.id : 'unità')+': '+v.msg};
    }
    return {ok:true, msg:'OK ('+obj.units.length+' unità)'};
  }
  return {ok:false, msg:'Formato non riconosciuto.'};
}

function clearBanksCache(){
  try{
    for(const k of Object.keys(BANK_CACHE)) delete BANK_CACHE[k];
    for(const k of Object.keys(BANK_SOURCE)) delete BANK_SOURCE[k];
  }catch(e){}
}

function importContentFromObject(obj){
  const v = validateContentObject(obj);
  if(!v.ok){ setContentStatus('Errore: '+v.msg); toast('JSON contenuti non valido.'); return; }

  const res = applyContentPayload(obj);
  if(!res.ok){ setContentStatus('Errore: '+res.msg); toast(res.msg); return; }

  // reset cache domande e ricarica
  clearBanksCache();
  preloadAllBanks().catch(()=>{});
  setContentStatus(res.msg);
  toast('Contenuti aggiornati.');
  // pulisci textarea
  const ta = $('importContentText'); if(ta) ta.value='';
}

function importContentFromText(){
  const ta = $('importContentText');
  const raw = (ta ? ta.value : '').trim();
  if(!raw){ toast('Incolla un JSON contenuti.'); return; }
  try{
    const obj = JSON.parse(raw);
    importContentFromObject(obj);
  }catch(e){
    setContentStatus('Errore: JSON non valido.');
    toast('JSON non valido.');
  }
}

function importContentFromFile(file){
  if(!file){ toast('Seleziona un file JSON.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const obj = JSON.parse(String(reader.result||''));
      importContentFromObject(obj);
    }catch(e){
      setContentStatus('Errore: File JSON non valido.');
      toast('File JSON non valido.');
    }
  };
  reader.onerror = () => { setContentStatus('Errore: Impossibile leggere il file.'); toast('Impossibile leggere il file.'); };
  reader.readAsText(file);
}

function exportContent(){
  const payload = exportContentBundle();
  const json = JSON.stringify(payload, null, 2);
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  downloadTextFile(`matematica_contenuti_${y}-${m}-${d}.json`, json);
  copyToClipboard(json).catch(()=>{});
  toast('Contenuti esportati.');
}

function resetContent(){
  if(!confirm('Vuoi rimuovere i capitoli aggiunti dal prof su questo dispositivo?')) return;
  if(!confirm('Conferma: questa operazione non si puo\' annullare.')) return;
  resetCustomContent();
  rebuildBlocksFromContent();
  clearBanksCache();
  preloadAllBanks().catch(()=>{});
  renderHome();
  renderProgress();
  setContentStatus('Contenuti aggiunti rimossi.');
  toast('Contenuti rimossi.');
}


function resetProgressHard(){
  if(!confirm('Vuoi davvero cancellare TUTTI i progressi su questo dispositivo?')) return;
  if(!confirm("Conferma: questa operazione non si puo’ annullare.")) return;
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


/* -------------------- Contenuti (capitoli/domande) --------------------
   Obiettivo: permettere di aggiungere capitoli e domande senza codice.

   Formati supportati:
   1) Unità singola:
      { "id":"M6", "title":"...", "skills":[...], "questions":[...] }

   2) Pacchetto:
      { "catalog": { "units":[{"id":"M6","title":"..."}, ...] },
        "units": [ {unitJson}, {unitJson} ] }

   Salvataggio (localStorage):
   - catalogo custom: LS.contentCatalog
   - unità custom:   LS.contentUnitPrefix + unitId
------------------------------------------------------------*/

function _lsGet(key){
  try{ return localStorage.getItem(key); }catch{ return null; }
}
function _lsSet(key,val){
  try{ localStorage.setItem(key,val); return true; }catch{ return false; }
}
function _lsDel(key){
  try{ localStorage.removeItem(key); }catch{}
}

function loadCustomCatalog(){
  const raw=_lsGet(LS.contentCatalog);
  if(!raw) return { units: [] };
  try{
    const obj=JSON.parse(raw);
    if(obj && Array.isArray(obj.units)) return { units: obj.units };
  }catch{}
  return { units: [] };
}
function saveCustomCatalog(cat){
  const obj={ units: Array.isArray(cat.units) ? cat.units : [] };
  _lsSet(LS.contentCatalog, JSON.stringify(obj));
}

function loadCustomUnit(unitId){
  const raw=_lsGet(LS.contentUnitPrefix + unitId);
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch{ return null; }
}
function saveCustomUnit(unitObj){
  _lsSet(LS.contentUnitPrefix + unitObj.id, JSON.stringify(unitObj));
}

function validateUnitJson(u){
  if(!u || typeof u !== 'object') return {ok:false, msg:'Unità non valida.'};
  if(typeof u.id !== 'string' || !u.id.trim()) return {ok:false, msg:'Manca id unità (es. "M6").'};
  if(typeof u.title !== 'string' || !u.title.trim()) return {ok:false, msg:'Manca title unità.'};
  if(!Array.isArray(u.questions) || u.questions.length===0) return {ok:false, msg:'Mancano questions.'};
  // skills opzionali, ma se presenti devono essere array di oggetti {id,name}
  if(u.skills!=null){
    if(!Array.isArray(u.skills)) return {ok:false, msg:'skills deve essere un array.'};
    for(const s of u.skills){
      if(!s || typeof s!== 'object' || typeof s.id!=='string' || typeof s.name!=='string'){
        return {ok:false, msg:'skills deve contenere oggetti {id,name}.'};
      }
    }
  }
  // validazione minima domande
  const ids=new Set();
  for(const q of u.questions){
    if(!q || typeof q!=='object') return {ok:false, msg:'Domanda non valida.'};
    if(typeof q.id!=='string' || !q.id.trim()) return {ok:false, msg:'Ogni domanda deve avere id.'};
    if(ids.has(q.id)) return {ok:false, msg:'ID duplicato: '+q.id};
    ids.add(q.id);
    if(typeof q.type!=='string') return {ok:false, msg:'Domanda '+q.id+': manca type.'};
    if(typeof q.prompt!=='string') return {ok:false, msg:'Domanda '+q.id+': manca prompt.'};
    if(q.type==='open'){
      if(typeof q.answer!=='string') return {ok:false, msg:'Domanda '+q.id+': open richiede answer string.'};
    }
    if(q.type==='mcq'){
      if(!Array.isArray(q.choices) || q.choices.length<2) return {ok:false, msg:'Domanda '+q.id+': mcq richiede choices.'};
      if(typeof q.answerIndex!=='number') return {ok:false, msg:'Domanda '+q.id+': mcq richiede answerIndex.'};
    }
    if(q.type==='guided'){
      if(!Array.isArray(q.steps) || q.steps.length<2) return {ok:false, msg:'Domanda '+q.id+': guided richiede steps.'};
    }
  }
  return {ok:true, msg:'OK'};
}

function normalizeCatalogUnit(u){
  // catalog item: {id,title}
  return { id: String(u.id).trim(), title: String(u.title||u.name||u.id).trim() };
}

function upsertUnitIntoCatalog(unitObj){
  const cat=loadCustomCatalog();
  const id=unitObj.id;
  const title=unitObj.title;
  const idx=(cat.units||[]).findIndex(x=>x && x.id===id);
  const item={id, title};
  if(idx>=0) cat.units[idx]=item;
  else cat.units.push(item);
  saveCustomCatalog(cat);
}

function applyContentPayload(obj){
  // returns {ok,msg,addedUnits:int}
  let units=[];
  let catalogUnits=null;

  if(obj && obj.catalog && Array.isArray(obj.catalog.units)){
    catalogUnits=obj.catalog.units.map(normalizeCatalogUnit);
  }
  if(obj && Array.isArray(obj.units)){
    units=obj.units;
  }else if(obj && typeof obj.id==='string' && Array.isArray(obj.questions)){
    units=[obj];
  }else if(obj && obj.bundle===true && Array.isArray(obj.units)){
    units=obj.units;
  }

  if(!units.length && catalogUnits==null){
    return {ok:false, msg:'Formato non riconosciuto. Incolla un\'unità singola o un pacchetto {catalog:{units:[...]}, units:[...]}.'};
  }

  if(catalogUnits!=null){
    // sovrascrive solo la lista catalog custom (non tocca default)
    saveCustomCatalog({units: catalogUnits});
  }

  let added=0;
  for(const u of units){
    const v=validateUnitJson(u);
    if(!v.ok) return {ok:false, msg:'Errore in '+(u && u.id ? u.id : 'unità')+': '+v.msg};
    saveCustomUnit(u);
    upsertUnitIntoCatalog(u);
    added += 1;
  }
  // refresh UI
  try{ rebuildBlocksFromContent(); renderHome(); renderProgress(); }catch{}
  return {ok:true, msg:'Contenuti aggiornati: '+added+' unità', addedUnits: added};
}

function exportContentBundle(){
  const cat=loadCustomCatalog();
  const units=[];
  for(const it of (cat.units||[])){
    if(!it || !it.id) continue;
    const u=loadCustomUnit(it.id);
    if(u) units.push(u);
  }
  return { app:'matematica-quiz', exportedAt: new Date().toISOString(), catalog: cat, units: units };
}

function resetCustomContent(){
  const cat=loadCustomCatalog();
  for(const it of (cat.units||[])){
    if(it && it.id) _lsDel(LS.contentUnitPrefix + it.id);
  }
  _lsDel(LS.contentCatalog);
}


/* -------------------- Firebase (classe) --------------------
   - Auth anonimo (così non serve login)
   - Firestore: classes/classe/participants/{uid}
   Se Firebase non è configurato in index.html, tutto continua a funzionare offline.
------------------------------------------------------------*/
let firebaseSyncTimer = null;
let classmatesUnsub = null;
let presenceTimer = null;

const PRESENCE_PING_MS = 25000; // ogni 25s
const ONLINE_WINDOW_MS = 65000; // consideriamo online se attivo nell'ultimo ~1 min

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

async function firebaseUpsertParticipant(displayName, progressPercent, extra){
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
    // presenza: aggiornato periodicamente
    updatedAt: serverTimestamp(),
    ...(extra && typeof extra === 'object' ? extra : {})
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

  // contesto minimo (solo UI) — non cambia la logica del gioco
  const quizEl = $("quiz");
  const homeEl = $("home");
  const progEl = $("progressView");
  const page = (quizEl && !quizEl.classList.contains("hidden")) ? "quiz" :
               (progEl && !progEl.classList.contains("hidden")) ? "progress" :
               (homeEl && !homeEl.classList.contains("hidden")) ? "home" : "other";

  await firebaseUpsertParticipant(name, pct, {
    page,
    block: currentBlock || null,
    mode: mode || null
  });
}

function startPresenceLoop(){
  if(!firebaseAvailable()) return;
  if(presenceTimer) return;
  // ping immediato + ping periodico
  syncMyDataToFirebase().catch(()=>{});
  presenceTimer = setInterval(() => {
    syncMyDataToFirebase().catch(()=>{});
  }, PRESENCE_PING_MS);

  // migliora l'accuratezza quando l'utente torna sulla pagina
  document.addEventListener("visibilitychange", () => {
    if(!document.hidden){
      syncMyDataToFirebase().catch(()=>{});
    }
  });
  window.addEventListener("beforeunload", () => {
    // ultimo ping best-effort
    try{ syncMyDataToFirebase(); }catch{}
  });
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
  const onlineEl = $("onlinePill");
  if(!items || items.length === 0){
    listEl.innerHTML = '<div class="muted tiny">Nessun compagno trovato (ancora).</div>';
    if(onlineEl) onlineEl.textContent = 'Online: 0';
    return;
  }

  function tsToMs(ts){
    if(!ts) return 0;
    if(typeof ts.toMillis === 'function') return ts.toMillis();
    if(typeof ts.seconds === 'number') return ts.seconds * 1000;
    if(typeof ts === 'number') return ts;
    return 0;
  }

  const now = Date.now();
  let onlineCount = 0;

  // mostra 1 riga per compagno: Nome + percentuale
  listEl.innerHTML = "";
  for(const it of items){
    const lastMs = tsToMs(it.updatedAt);
    const isOnline = lastMs ? (now - lastMs) <= ONLINE_WINDOW_MS : false;
    if(isOnline) onlineCount += 1;

    const row = document.createElement("div");
    row.className = "classmate";
    const name = (it.displayName || "—").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const pct = Number.isFinite(it.progressPercent) ? Math.max(0, Math.min(100, Math.round(it.progressPercent))) : 0;
    const page = (it.page || '').toString();
    const where = page === 'quiz' ? 'in attività' : page === 'home' ? 'in home' : page === 'progress' ? 'progressi' : '';
    row.innerHTML = `
      <div class="classmate__name">${name}</div>
      <div class="classmate__meta">
        <div class="classmate__dot ${isOnline ? 'online' : ''}" title="${isOnline ? 'Online' : 'Offline'}"></div>
        <div class="classmate__pct">${pct}%</div>
        ${where ? `<div class="muted tiny">${where}</div>` : ''}
      </div>
    `;
    listEl.appendChild(row);
  }

  if(onlineEl) onlineEl.textContent = `Online: ${onlineCount}`;
}

function makeEmptyProfile(){
  return {
    // per competenza: array ultimi risultati (1/0), per streak
    skills: {},
    streak: 0,
    badges: {},
    // blocchi superati tramite Verifica (>=80%)
    passedBlocks: {},
    lastBlock: "M1",
    // Spaced repetition per skill (SRS)
    // srs[skillId] = { due:number(ms), intervalDays:number }
    srs: {},
    // Errori recenti: array di record {id, block, skill, ts}
    wrongs: [],
    // Storico sessioni (compatto): array di record {ts, block, mode, score, total}
    sessions: [],
    settings: {
      // Se vero: quando la risposta e' equivalente ma in forma diversa, mostriamo sempre la forma standard.
      suggestStandard: true,
      // Se vero: in Verifica mostriamo un avviso se l'utente non scrive in forma standard.
      // Nota: non boccia, serve solo come feedback.
      warnStandardInVerify: true
      ,
      // Allenamento smart: mix nuove domande + richiami (SRS) + errori recenti
      smartSession: true,
      sessionN: 10,
      reviewMin: 2,
      dailyGoal: 10
    }
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
    passedBlocks: { ...base.passedBlocks, ...(p.passedBlocks||{}) },
    srs: { ...base.srs, ...(p.srs||{}) },
    wrongs: Array.isArray(p.wrongs) ? p.wrongs.slice(0,200) : base.wrongs,
    sessions: Array.isArray(p.sessions) ? p.sessions.slice(0,200) : base.sessions,
    settings: { ...base.settings, ...((p && p.settings) ? p.settings : {}) }
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

function parseKeyToExps(key){
  // key like x^2|y^1|a^0|b^0 (order VARS)
  const exps = {x:0,y:0,a:0,b:0};
  const parts = String(key||"").split("|");
  for(const p of parts){
    const m = p.match(/^([a-z])\^(\-?\d+)$/);
    if(!m) continue;
    const v = m[1];
    const n = parseInt(m[2],10);
    if(VARS.includes(v) && Number.isFinite(n)) exps[v] = n;
  }
  return exps;
}

function totalDegree(exps){
  let deg = 0;
  for(const v of VARS) deg += (exps[v]||0);
  return deg;
}

function monomialToString(coef, exps){
  // coef can be negative; handle sign outside.
  const absC = Math.abs(coef);
  let lit = "";
  for(const v of VARS){
    const e = exps[v]||0;
    if(e === 0) continue;
    if(e === 1) lit += v;
    else lit += v + "^" + e;
  }
  if(lit === "") return String(absC);
  if(absC === 1) return lit; // omit 1
  return String(absC) + lit;
}

function mapToStandardPolyString(map){
  // map: key->coef
  const terms = [];
  for(const [k,coef] of map.entries()){
    const exps = parseKeyToExps(k);
    terms.push({coef, exps, deg: totalDegree(exps), key: k});
  }
  terms.sort((t1,t2)=>{
    if(t2.deg !== t1.deg) return t2.deg - t1.deg;
    // tie: stable lex by key
    return String(t1.key).localeCompare(String(t2.key));
  });
  if(terms.length === 0) return "0";
  let out = "";
  for(let i=0;i<terms.length;i++){
    const t = terms[i];
    const sign = t.coef < 0 ? "-" : "+";
    const body = monomialToString(t.coef, t.exps);
    if(i === 0){
      out += (t.coef < 0 ? "-" : "") + body;
    } else {
      out += sign + body;
    }
  }
  return out;
}

function standardForm(expr){
  const raw = String(expr||"").trim();
  if(!raw) return raw;

  // Solo polinomi semplici senza parentesi, *, /
  const n = normalizeInput(raw);
  const simpleOk = (s)=> s.indexOf("(") === -1 && s.indexOf(")") === -1 && s.indexOf("*") === -1 && s.indexOf("/") === -1;
  if(simpleOk(n)){
    const m = canonicalPoly(n);
    if(m){
      return mapToStandardPolyString(m);
    }
  }
  return raw;
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

/* -------------------- Bank by block --------------------
   Blocco 4: le domande vivono in /data/*.json.
   - Offline/PWA: questi JSON sono in cache via Service Worker.
   - Sicurezza: se un JSON manca o fallisce, usiamo la banca embedded.
---------------------------------------------------------- */

const BANK_CACHE = Object.create(null); // { blockId: Question[] }
const BANK_SOURCE = Object.create(null); // { blockId: 'json'|'embedded'|'missing' }

function _embeddedBankFor(blockId){
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

function compileCheckerFromJSON(q){
  if(!q || typeof q !== 'object') return;
  // open question
  if(q.type === 'open'){
    if(q.checkerType === 'poly' && typeof q.expected === 'string'){
      q.checker = (u)=> equalPoly(u, q.expected);
    } else if(q.checkerType === 'normalized_eq' && typeof q.expected === 'string'){
      q.checker = (u)=> normalizeInput(u) === normalizeInput(q.expected);
      q.answer = q.expected;
    } else if(q.checkerType === 'normalized_in' && Array.isArray(q.accepted)){
      q.checker = (u)=> {
        const s = normalizeInput(u);
        return q.accepted.some(a => normalizeInput(a) === s);
      };
    }
  }
  // guided steps
  if(Array.isArray(q.steps)){
    q.steps.forEach(compileCheckerFromJSON);
  }
}

async function loadBankFromJSON(blockId){
  // evita doppio fetch
  if(BANK_CACHE[blockId]) return BANK_CACHE[blockId];

  // 1) Prima: contenuti importati dal prof (localStorage)
  try{
    const custom = loadCustomUnit(blockId);
    if(custom && Array.isArray(custom.questions)){
      const questions = custom.questions;
      questions.forEach(function(q){
        if(q && typeof q === 'object' && !q.block) q.block = blockId;
        compileCheckerFromJSON(q);
        if(Array.isArray(q && q.steps)){
          q.steps.forEach(function(st){ if(st && typeof st === 'object' && !st.block) st.block = blockId; });
        }
      });
      BANK_CACHE[blockId] = questions;
      BANK_SOURCE[blockId] = 'custom';
      return questions;
    }
  }catch(e){}

  // 2) Poi: file JSON nel repo (data/*.json)
  try{
    const res = await fetch(`./data/${blockId}.json`, {cache:'no-cache'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const payload = await res.json();
    const questions = (payload && payload.questions && Array.isArray(payload.questions)) ? payload.questions : [];
    questions.forEach(function(q){
      if(q && typeof q === 'object' && !q.block) q.block = blockId;
      compileCheckerFromJSON(q);
      if(Array.isArray(q && q.steps)){
        q.steps.forEach(function(st){ if(st && typeof st === 'object' && !st.block) st.block = blockId; });
      }
    });
    BANK_CACHE[blockId] = questions;
    BANK_SOURCE[blockId] = 'json';
    return questions;
  } catch(err){
    BANK_SOURCE[blockId] = 'embedded';
    // fallback: embedded
    const emb = _embeddedBankFor(blockId);
    BANK_CACHE[blockId] = emb;
    return emb;
  }
}

function bankFor(blockId){
  // sincrono: se abbiamo gia caricato, usa cache; altrimenti embedded (poi verra sovrascritto)
  if(BANK_CACHE[blockId]) return BANK_CACHE[blockId].slice();
  const emb = _embeddedBankFor(blockId);
  // tag per UX/diagnostica
  emb.forEach(function(q){
    if(q && typeof q === 'object' && !q.block) q.block = blockId;
    if(Array.isArray(q && q.steps)){
      q.steps.forEach(function(st){ if(st && typeof st === 'object' && !st.block) st.block = blockId; });
    }
  });
  BANK_CACHE[blockId] = emb;
  BANK_SOURCE[blockId] = 'embedded';
  return emb.slice();
}

async function preloadAllBanks(){
  // carica in background: non blocca UI
  const blocks = getBlocks().map(b=>b.id);
  for(const bid of blocks){
    try{ await loadBankFromJSON(bid); }catch{}
  }
}


const DEFAULT_BLOCKS = [
  { id:"P0", name:"P0 Proporzioni", short:"P0", prereq:[], skills:["P0_C1","P0_C2","P0_C3","P0_C4","P0_C5","P0_C6"] },
  { id:"M1", name:"M1 Monomi", short:"M1", prereq:[], skills:["M1_C1","M1_C2","M1_C3","M1_C4","M1_C5"] },
  { id:"M2", name:"M2 Operazioni monomi", short:"M2", prereq:["M1"], skills:["M2_C6","M2_C7","M2_C8","M2_C9","M2_C10"] },
  { id:"M3", name:"M3 Polinomi", short:"M3", prereq:["M1","M2"], skills:["M3_C11","M3_C12","M3_C13","M3_C14","M3_C15"] },
  { id:"M4", name:"M4 Operazioni polinomi", short:"M4", prereq:["M1","M2","M3"], skills:["M4_C16","M4_C17","M4_C18","M4_C19","M4_C20"] },
  { id:"M5", name:"M5 MCD/MCM", short:"M5", prereq:["M1","M2","M3","M4"], skills:["M5_C21","M5_C22","M5_C23","M5_C24","M5_C25"] },
];

let BLOCKS = DEFAULT_BLOCKS.slice();

function getBlocks(){ return BLOCKS; }

function rebuildBlocksFromContent(){
  // Merge default blocks with custom catalog imported by the prof.
  const cat = loadCustomCatalog();
  const extras = [];
  for(const it of (cat.units||[])){
    if(!it || !it.id) continue;
    const unitId = String(it.id).trim();
    if(!unitId) continue;
    // avoid duplicates with defaults
    if(DEFAULT_BLOCKS.some(b=>b.id===unitId)) continue;
    const unit = loadCustomUnit(unitId);
    const title = (unit && unit.title) ? unit.title : (it.title || unitId);
    let skills=[];
    if(unit && Array.isArray(unit.skills)) skills = unit.skills.map(s=>s && s.id).filter(Boolean);
    if((!skills || !skills.length) && unit && Array.isArray(unit.questions)) {
      const set = new Set();
      for(const q of unit.questions){
        if(q && q.skill) set.add(q.skill);
        if(q && Array.isArray(q.skills)) q.skills.forEach(s=>s && set.add(s));
        if(q && Array.isArray(q.steps)) q.steps.forEach(st=>st && st.skill && set.add(st.skill));
      }
      skills = Array.from(set);
    }
    extras.push({ id: unitId, name: unitId+' '+title, short: unitId, prereq: [], skills: skills });
  }
  BLOCKS = DEFAULT_BLOCKS.concat(extras);
}

// build once at startup
rebuildBlocksFromContent();

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

`cat /mnt/data/snippet_questions.js`

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
// presenza "online" (ping periodico, solo se Firebase e' configurato)
startPresenceLoop();
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
    $("hello").textContent = `Benvenuto, ${n}`;
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
    const label = completed ? "Competenze consolidate" : (passed ? "Verifica superata" : "Disponibile");
    btn.innerHTML = `<strong>${b.short}</strong> ${b.name.replace(/^.. /,"")}<small>${label}</small>`;
    if(profile.lastBlock===b.id) btn.classList.add('is-active');
    // Tutto accessibile: nessun blocco disabilitato.
    btn.addEventListener("click", ()=>{
      // Seleziona il blocco senza avviare subito la sessione.
      // L'avvio avviene dai pulsanti principali (Riprendi / Avvia verifica).
      // Questo mantiene la logica esistente e riduce click accidentali.
      setActiveUI(b.id, 'train');
      updateResumeButton();
      // aggiorna anche lo stato home (consiglio + pill)
      try{ updateHomeStatus(); }catch(e){}
    });
    el.appendChild(btn);
  }
}

/* -------------------- UI: dashboard -------------------- */
function pctToWidth(p){ return `${Math.round(p*100)}%`; }

function renderDashboard(){
  const dash = $("dashboard");
  dash.innerHTML = "";

  // Obiettivo giornaliero
  const today = _todayKey();
  if(!profile.daily || profile.daily.date !== today){
    profile.daily = { date: today, done: 0, goal: (profile.settings && Number(profile.settings.dailyGoal)) || 10, seen: [] };
  }
  const drow = document.createElement('div');
  drow.className = 'dashRow';
  const done = Number(profile.daily.done)||0;
  const goal = Number(profile.daily.goal)||10;
  const dpct = goal ? Math.min(1, done/goal) : 0;
  drow.innerHTML = `
    <div class="dashRowTop">
      <div><strong>Sessione di oggi</strong> <span class="muted">obiettivo</span></div>
      <div class="tag">${done}/${goal}</div>
    </div>
    <div class="bar"><div style="width:${pctToWidth(dpct)}"></div></div>
    <div class="dashMeta">Suggerimento: svolgi ${Math.max(0, goal-done)} domande per raggiungere l'obiettivo giornaliero.</div>
  `;
  dash.appendChild(drow);

  for(const b of BLOCKS){
    // show P0 + all M blocks
    const row = document.createElement("div");
    row.className = "dashRow";

    const completed = blockCompleted(profile, b.id);
    const passed = !!(profile.passedBlocks && profile.passedBlocks[b.id]);
    const status = completed ? "Completato" : (passed ? "Verifica superata" : "In corso");

    // compute avg pct of skills
    const stats = b.skills.map(sid=>skillStats(profile, sid));
    const seen = stats.filter(s=>s.n>0);
    const avg = seen.length ? (seen.reduce((a,s)=>a+s.pct,0)/seen.length) : 0;
    // se hai superato la verifica, consideriamo il blocco "avanzato" anche se non tutto verde
    const pct = completed ? 1 : (passed ? Math.max(0.8, avg) : avg);

    row.innerHTML = `
      <div class="dashRowTop">
        <div><strong>${b.id}</strong> <span class="muted">${b.name.replace(/^.. /,"")}</span></div>
        <div class="tag">${Math.round(pct*100)}%</div>
      </div>
      <div class="bar"><div style="width:${pctToWidth(pct)}"></div></div>
      <div class="dashMeta">Stato: ${status} • Allenamento: ${seen.reduce((a,s)=>a+s.n,0)} tentativi</div>
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
    row.innerHTML = `<div class="dashRowTop"><div><strong>Traguardi</strong> <span class="muted">blocchi completati</span></div></div>
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
  // abilita/disabilita "Rifai errori"
  const eb = $('errorsBtn');
  if(eb){
    const has = !!(profile.wrongs && profile.wrongs.length);
    eb.disabled = !has;
    eb.title = has ? 'Rifai gli ultimi errori' : 'Nessun errore recente';
  }
  updateResumeButton();
}

/* -------------------- Build quiz queue -------------------- */


/* -------------------- Spaced repetition (richiami) -------------------- */
// SRS per skill (semplice ma "serio"): intervalli fissi 1/3/7/14/30 giorni.
// - Se corretto: avanza di livello (fino a 30g)
// - Se sbagliato: torna al livello 0 (1g)
function _now(){ return Date.now(); }

function updateSRS(skillId, ok){
  if(!skillId) return;
  if(!profile.srs) profile.srs = {};
  const LEVELS = [1,3,7,14,30];
  const cur = profile.srs[skillId] || { level: -1, due: 0, last: 0 };
  let level = Number(cur.level);
  if(!isFinite(level)) level = -1;
  if(ok){
    level = Math.min(LEVELS.length-1, level + 1);
  } else {
    level = 0;
  }
  const interval = LEVELS[Math.max(0, level)] || 1;
  profile.srs[skillId] = {
    level: level,
    due: _now() + interval*24*60*60*1000,
    last: _now()
  };
}

function dueSkillsBefore(blockId){
  const prev = allBlocksBefore(blockId);
  if(!prev.length) return [];
  const due = [];
  const now = _now();
  for(const bid of prev){
    const b = blockById(bid);
    if(!b) continue;
    for(const sid of b.skills){
      const rec = profile.srs && profile.srs[sid];
      if(rec && rec.due && rec.due <= now){
        due.push(sid);
      }
    }
  }
  return due;
}

function pickQuestionBySkill(blockIds, skillId){
  for(const bid of blockIds){
    const bank = bankFor(bid);
    const pool = bank.filter(q=>{
      if(q.type==='guided'){
        const inSkills = q.skills && q.skills.indexOf(skillId)!==-1;
        const inSteps = q.steps && q.steps.some(st=>st.skill===skillId);
        return !!(inSkills || inSteps);
      }
      return q.skill === skillId;
    });
    if(pool.length) return pool[Math.floor(Math.random()*pool.length)];
  }
  return null;
}

function allBlocksBefore(blockId){
  const path = ["P0","M1","M2","M3","M4","M5"];
  const idx = path.indexOf(blockId);
  if(idx<=0) return [];
  return path.slice(0, idx);
}

function pickRecallQuestion(profile, currentBlock){
  // Prende 1 domanda da un blocco precedente.
  // Priorita': skill "scadute" (due) secondo SRS; fallback: skill con bassa percentuale.
  const prev = allBlocksBefore(currentBlock);
  if(!prev.length) return null;

  // 1) SRS: se abbiamo skill dovute, scegli una di quelle
  const due = dueSkillsBefore(currentBlock);
  if(due.length){
    const sid = due[Math.floor(Math.random()*due.length)];
    const qDue = pickQuestionBySkill(prev.slice().reverse(), sid);
    if(qDue) return qDue;
  }

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

  const set = profile.settings || {};
  const N = Math.max(5, Math.min(25, Number(set.sessionN) || 10));
  const REVIEW_MIN = Math.max(0, Math.min(10, Number(set.reviewMin) || 2));
  const SMART = (set.smartSession !== false);

  if(modeWanted === "verify"){
    // fixed length verify
    const N = Math.min(12, bank.length); // lightweight
    return shuffle(bank).slice(0,N);
  }

  // TRAIN
  // Se SMART è attivo: sessione mista (nuove + richiami dovuti + errori recenti)
  // Se disattivo: comportamento "classico" sul solo blocco, ma con lunghezza N.

  const b = blockById(blockId);
  var out = [];
  const usedIds = new Set();
  function keyOf(qx){ return (qx && (qx.block||'') + '::' + (qx.id || qx.prompt || qx.title || Math.random())); }
  function pushIfNew(qx){
    if(!qx) return false;
    const key = keyOf(qx);
    if(usedIds.has(key)) return false;
    usedIds.add(key);
    out.push(qx);
    return true;
  }

  if(SMART){
    // 0) 1 errore recente (se esiste)
    if(profile.wrongs && profile.wrongs.length){
      const rec = profile.wrongs[0];
      if(rec && rec.block && rec.id){
        const bbank = bankFor(rec.block);
        const qErr = bbank.find(q=> (q && q.id && q.id===rec.id)) || null;
        if(qErr) pushIfNew(qErr);
      }
    }

    // 1) richiami dovuti (SRS) fino a REVIEW_MIN
    let tries = 0;
    while(out.length < Math.min(N, REVIEW_MIN + 1) && tries < 20){
      const qx = pickRecallQuestion(profile, blockId);
      if(!qx) break;
      pushIfNew(qx);
      tries++;
    }
  }

  // 2) nuove domande dal blocco corrente (coverage skill)
  const notGreen = b.skills.filter(function(sid){ return !skillGreen(profile, sid); });
  shuffle(notGreen).forEach(function(sid){
    if(out.length >= N) return;
    var candidates = bank.filter(function(q){
      if(q.type === "guided"){
        var inSkills = q.skills && q.skills.indexOf(sid) !== -1;
        var inSteps = q.steps && q.steps.some(function(st){ return st.skill === sid; });
        return !!(inSkills || inSteps);
      }
      return q.skill === sid;
    });
    if(candidates.length){
      pushIfNew(candidates[Math.floor(Math.random()*candidates.length)]);
    }
  });

  // 3) riempi il resto con la skill più debole del blocco
  var targetSkill = weakestSkill(profile, b.skills);
  var pool = bank.filter(function(q){
    if(q.type === "guided"){
      var inSkills = q.skills && q.skills.indexOf(targetSkill) !== -1;
      var inSteps = q.steps && q.steps.some(function(st){ return st.skill === targetSkill; });
      return !!(inSkills || inSteps);
    }
    return q.skill === targetSkill;
  });

  while(out.length < Math.min(N, bank.length)){
    var source = pool.length ? pool : bank;
    pushIfNew(source[Math.floor(Math.random()*source.length)]);
  }

  // Limita e mescola
  out = shuffle(out).slice(0, Math.min(N, out.length));
  return out;
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
  return true;
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

async function startErrors(){
  // Ripasso errori recenti (cross-blocco). Se non ci sono, fallback al consigliato.
  const s = (profile.settings||{});
  const N = Math.max(5, Math.min(25, Number(s.sessionN)||10));
  const out = [];
  const used = new Set();
  if(profile.wrongs && profile.wrongs.length){
    for(const rec of profile.wrongs){
      if(out.length >= N) break;
      if(!rec || !rec.block || !rec.id) continue;
      const bank = bankFor(rec.block);
      const q = bank.find(x => x && x.id && x.id === rec.id) || null;
      if(!q) continue;
      const key = rec.block + '::' + rec.id;
      if(used.has(key)) continue;
      used.add(key);
      out.push(q);
    }
  }
  if(!out.length){
    toast('Nessun errore recente: avvio allenamento consigliato.');
    return startRecommended();
  }

  // avvia sessione custom
  mode = 'train';
  currentBlock = 'RIPASSO';
  setActiveUI(profile.lastBlock || pickTrainingBlock(profile), 'train');
  updateResumeButton();
  queue = shuffle(out).slice(0, N);
  qIndex = 0;
  score = 0;
  guidedState = null;
  hide('home');
  hide('progressView');
  show('quiz');
  renderQuestion();
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
  return q.explainOk || "Risposta corretta.";
}

function updateAfterAnswer(skillId, ok, qInfo){
  // obiettivo giornaliero: conta una sola volta per domanda (anche se guidata a step)
  updateDailyProgress(qInfo);
  pushSkill(profile, skillId, ok);
  // aggiorna SRS per ripassi
  updateSRS(skillId, ok);

  // log errori recenti (per modalita' "solo errori")
  if(!ok && qInfo){
    if(!profile.wrongs) profile.wrongs = [];
    const rec = { id: qInfo.id || null, block: qInfo.block || currentBlock, skill: qInfo.skill || skillId, ts: _now() };
    // dedupe per id+block
    profile.wrongs = profile.wrongs.filter(r => !(r && r.id && rec.id && r.id===rec.id && r.block===rec.block));
    profile.wrongs.unshift(rec);
    if(profile.wrongs.length > 60) profile.wrongs.length = 60;
  }

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

function _todayKey(){
  // chiave giorno in timezone locale del dispositivo
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

function updateDailyProgress(qInfo){
  const goal = (profile.settings && Number(profile.settings.dailyGoal)) || 10;
  if(!profile.daily) profile.daily = { date: _todayKey(), done: 0, goal: goal, seen: [] };
  const today = _todayKey();
  if(profile.daily.date !== today){
    profile.daily = { date: today, done: 0, goal: goal, seen: [] };
  }
  profile.daily.goal = goal;
  const id = qInfo && (qInfo.block || currentBlock) && qInfo.id ? `${qInfo.block || currentBlock}::${qInfo.id}` : null;
  if(!id) return;
  if(!Array.isArray(profile.daily.seen)) profile.daily.seen = [];
  if(profile.daily.seen.indexOf(id) !== -1) return;
  profile.daily.seen.push(id);
  if(profile.daily.seen.length > 400) profile.daily.seen = profile.daily.seen.slice(0,400);
  profile.daily.done = (Number(profile.daily.done)||0) + 1;
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

  updateAfterAnswer(q.skill, ok, q);
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
    if(meta.equivalence && q.answer && profile.settings && profile.settings.suggestStandard){
      // Corretto ma scritto in forma diversa: insegna la forma standard.
      const std = formatExponents(standardForm(q.answer));
      const warn = (mode === 'verify' && profile.settings.warnStandardInVerify) ? ' ⚠️ In verifica si consiglia la forma standard.' : '';
      $("feedback").textContent = "Risposta corretta (forma equivalente). Forma standard: " + std + warn;
    } else {
      $("feedback").textContent = explainRight(q) || "Risposta corretta.";
    }
  } else {
    // show correction more explicit in training
    let extra = "";
    if(mode==="train"){
      if(q.answer) extra = `Corretto: ${formatExponents(standardForm(q.answer))}`;
      else if(q.example) extra = `Esempio: ${formatExponents(q.example)}`;
    }
    $("feedback").textContent = explainWrong(q, extra) || "Risposta non corretta. Rivedi la regola e riprova.";
  }

  updateAfterAnswer(q.skill, ok, q);
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

  var msg = ok ? "Risposta corretta" : "Risposta non corretta";
  // Spiegazione anche nei guidati (se presente)
  var exp = "";
  if(ok && step.explainOk) exp = step.explainOk;
  if(!ok && step.explainNo) exp = step.explainNo;
  if(!exp && q.rule && mode==="train") exp = q.rule;
  $("feedback").textContent = exp ? (msg + " — " + exp) : (ok ? "Risposta corretta." : "Risposta non corretta. Rileggi la regola e riprova.");

  updateAfterAnswer(step.skill, ok, {id:q.id, block:q.block||currentBlock, skill:step.skill});
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

  var msg2 = ok ? "Risposta corretta" : "Risposta non corretta";
  var exp2 = "";
  if(ok && step.explainOk) exp2 = step.explainOk;
  if(!ok && step.explainNo) exp2 = step.explainNo;
  if(!exp2 && q.rule && mode==="train") exp2 = q.rule;
  if(ok && meta.equivalence && step.answer && profile.settings && profile.settings.suggestStandard){
    const std = formatExponents(standardForm(step.answer));
    const warn = (mode === 'verify' && profile.settings.warnStandardInVerify) ? ' ⚠️ In verifica si consiglia la forma standard.' : '';
    $("feedback").textContent = "Risposta corretta (forma equivalente). Forma standard: " + std + warn;
  } else {
    $("feedback").textContent = exp2 ? (msg2 + " — " + exp2) : (ok ? "Risposta corretta." : "Risposta non corretta. Riprova seguendo la regola.");
  }
  updateAfterAnswer(step.skill, ok, {id:q.id, block:q.block||currentBlock, skill:step.skill});
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
  // registra sessione (storico leggero)
  try{
    if(!profile.sessions) profile.sessions = [];
    profile.sessions.unshift({
      ts: _now(),
      block: currentBlock,
      mode: mode,
      score: score,
      total: queue.length
    });
    if(profile.sessions.length > 200) profile.sessions.length = 200;
  } catch {}

  // alla fine: se era una VERIFICA e hai >=80%, segna il blocco come "superato"
  if(mode === "verify" && queue.length){
    var pct = score / queue.length;
    if(pct >= 0.8){
      if(!profile.passedBlocks) profile.passedBlocks = {};
      profile.passedBlocks[currentBlock] = true;
      toast(`Verifica superata su ${currentBlock} (${Math.round(pct*100)}%).`);
      saveProfile(profile);
    } else {
      toast(`Verifica non superata su ${currentBlock} (${Math.round(pct*100)}%).`);
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
      <div class="muted tiny">${completed ? "Completato" : "In progresso"}</div>`;
    for(const sid of b.skills){
      const st = skillStats(profile, sid);
      const pct = st.n ? Math.round(st.pct*100) : 0;
      const status = skillGreen(profile, sid) ? "OK" : (st.n ? "..." : "—");
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<div><span class="skillMark">${status}</span> <span class="muted">${labelSkill(sid)}</span></div><div class="tag">${pct}%</div>`;
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

// Landing actions (Blocco 1)
_bind("startBtn", ()=>{
  const n = localStorage.getItem(LS.name);
  if(n){
    hide("landing");
    show("home");
    goHome();
  } else {
    hide("landing");
    show("onboarding");
    const inp = $("nameInput");
    if(inp) inp.focus();
  }
});

_bind("methodBtn", ()=>{
  const card = $("methodCard");
  if(!card) return;
  card.hidden = !card.hidden;
});

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
_bind('settingsTopBtn',()=>{ const si=$('settingsNameInput'); if(si) si.value=(localStorage.getItem(LS.name)||''); const sub=$('settingsSubtitle'); if(sub) sub.textContent=APP_VERSION; syncEvalSettingsUI(); openModal('settingsModal');
  const pre=$('diagnosticsPre'); if(pre) pre.textContent = diagnosticsText(); });
document.querySelectorAll('[data-close="settings"]').forEach(el=>el.addEventListener('click',()=>closeModal('settingsModal')));
_bind('settingsSaveName',()=>{ const v=($('settingsNameInput').value||'').trim(); if(!v){toast('Scrivi un nome.');return;} localStorage.setItem(LS.name,v); setSafeName(); scheduleFirebaseSync(); toast('Nome salvato.'); });
_bind('copyDiagnostics',()=>copyToClipboard(diagnosticsText()));
_bind('exportProgress',()=>exportProgress());
_bind('importProgressBtn',()=>{ const fi=$('importProgressFile'); if(fi) fi.click(); });
_bind('importProgressTextBtn',()=>importProgressFromText());
_bind('resetProgress',()=>resetProgressHard());
const _impFile=$('importProgressFile'); if(_impFile){ _impFile.addEventListener('change', (e)=>{ const f=e.target.files && e.target.files[0]; importProgressFromFile(f); _impFile.value=''; }); }


// Contenuti (prof)
_bind('exportContent',()=>exportContent());
_bind('resetContent',()=>resetContent());
_bind('importContentTextBtn',()=>importContentFromText());
_bind('importContentBtn',()=>{ const fi=$('importContentFile'); if(fi) fi.click(); });
_bind('validateContentBtn',()=>{
  const ta=$('importContentText');
  const raw=(ta?ta.value:'').trim();
  if(!raw){ setContentStatus(''); toast('Incolla un JSON contenuti.'); return; }
  try{
    const obj=JSON.parse(raw);
    const v=validateContentObject(obj);
    setContentStatus((v.ok?'OK: ':'Errore: ')+v.msg);
  }catch{ setContentStatus('Errore: JSON non valido.'); }
});

const _cFile=$('importContentFile'); if(_cFile){ _cFile.addEventListener('change',(e)=>{ const f=e.target.files && e.target.files[0]; importContentFromFile(f); _cFile.value=''; }); }

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
        {
          const si=$('settingsNameInput'); if(si) si.value=(localStorage.getItem(LS.name)||'');
          const sub=$('settingsSubtitle'); if(sub) sub.textContent=APP_VERSION;
          const opt1=$('optSuggestStandard'); if(opt1) opt1.checked = !!(profile.settings && profile.settings.suggestStandard);
          const opt2=$('optWarnStandardVerify'); if(opt2) opt2.checked = !!(profile.settings && profile.settings.warnStandardInVerify);
          const opt3=$('optSmartSession'); if(opt3) opt3.checked = !!(profile.settings && profile.settings.smartSession);
          const opt4=$('optSessionN'); if(opt4) opt4.value = String((profile.settings && profile.settings.sessionN) || 10);
          const opt5=$('optReviewMin'); if(opt5) opt5.value = String((profile.settings && profile.settings.reviewMin) || 2);
          openModal('settingsModal');
          const pre=$('diagnosticsPre'); if(pre) pre.textContent = diagnosticsText();
        }
        break;
      case 'save-eval-settings':
        if(!profile.settings) profile.settings = {};
        {
          const opt1=$('optSuggestStandard');
          const opt2=$('optWarnStandardVerify');
          profile.settings.suggestStandard = opt1 ? !!opt1.checked : true;
          profile.settings.warnStandardInVerify = opt2 ? !!opt2.checked : true;
          saveProfile(profile);
          toast('Impostazioni salvate.');
        }
        break;
      case 'save-session-settings':
        if(!profile.settings) profile.settings = {};
        {
          const a=$('optSmartSession');
          const b=$('optSessionN');
          const c=$('optReviewMin');
          profile.settings.smartSession = a ? !!a.checked : true;
          const n = b ? parseInt(b.value,10) : 10;
          const r = c ? parseInt(c.value,10) : 2;
          profile.settings.sessionN = (isFinite(n) ? Math.max(5, Math.min(25, n)) : 10);
          profile.settings.reviewMin = (isFinite(r) ? Math.max(0, Math.min(10, r)) : 2);
          saveProfile(profile);
          toast('Impostazioni allenamento salvate.');
        }
        break;
      case 'import-content-text':
        importContentFromText();
        break;
      case 'validate-content':
        {
          const ta=$('importContentText');
          const raw=(ta?ta.value:'').trim();
          if(!raw){ setContentStatus(''); toast('Incolla un JSON contenuti.'); break; }
          try{
            const obj=JSON.parse(raw);
            const v=validateContentObject(obj);
            setContentStatus((v.ok?'OK: ':'Errore: ')+v.msg);
          }catch{ setContentStatus('Errore: JSON non valido.'); }
        }
        break;
      case 'import-content-file':
        {
          const fi=$('importContentFile'); if(fi) fi.click();
        }
        break;
      case 'export-content':
        exportContent();
        break;
      case 'reset-content':
        resetContent();
        break;
      case 'start-errors':
        closeModal('settingsModal');
        setNavActiveSafe('navTrain');
        startErrors();
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
    // Precarica le domande JSON (Blocco 4) in background
  preloadAllBanks();

try{window.addEventListener("error",(e)=>{profile.lastError={message:e.message,source:e.filename,line:e.lineno,col:e.colno}; saveProfile(profile);});}catch{}
  setNavActiveSafe && setNavActiveSafe("navHome");
  // Carica banca domande JSON in background (Blocco 4)
  loadBanks();
  // Landing / onboarding
  const n = localStorage.getItem(LS.name);
  if(n){
    hide("landing");
    hide("onboarding");
    show("home");
    setSafeName();
    goHome();
  } else {
    show("landing");
    hide("onboarding");
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
