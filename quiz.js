/* Matematica PWA - Blocco M1 (Monomi) 
   Stile e UX ispirati alla tua app di spagnolo/geografia.
   Allenamento: regola + esempio sempre.
*/

"use strict";

const $ = (id) => document.getElementById(id);

// ---------- Progressi & sblocco ----------
const LS_KEY = "math_algebra_progress_v1";

function loadProgress(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return { hist:{}, unlocked:{ m2:false } };
    const p = JSON.parse(raw);
    return {
      hist: p.hist || {},
      unlocked: p.unlocked || { m2:false }
    };
  }catch{
    return { hist:{}, unlocked:{ m2:false } };
  }
}

function saveProgress(p){
  localStorage.setItem(LS_KEY, JSON.stringify(p));
}

function pushHist(p, compId, isCorrect){
  if(!p.hist[compId]) p.hist[compId] = [];
  p.hist[compId].push(isCorrect ? 1 : 0);
  if(p.hist[compId].length > 50) p.hist[compId] = p.hist[compId].slice(-50);
}

function mastery(p, compId){
  const h = (p.hist[compId] || []).slice(-10);
  if(h.length < 10) return { ok:false, pct: Math.round((h.reduce((a,b)=>a+b,0)/Math.max(1,h.length))*100), streak: 0 };
  const correct = h.reduce((a,b)=>a+b,0);
  const pct = (correct/10)*100;
  const streak3 = h.slice(-3).every(x => x === 1);
  return { ok: pct >= 80 && streak3, pct: Math.round(pct), streak: streak3 ? 3 : 0 };
}

function checkUnlocks(){
  const p = loadProgress();
  const m1Comps = ["C1","C2","C3","C4","C5"]; // M1
  const allM1 = m1Comps.every(c => mastery(p, c).ok);
  if(allM1 && !p.unlocked.m2){
    p.unlocked.m2 = true;
    saveProgress(p);
    // badge semplice (solo in training)
    showToast("🏅 Hai davvero capito i monomi! Si sblocca M2.");
  }
  // aggiorna UI menu blocchi
  const optM2 = document.getElementById("optM2");
  if(optM2){
    optM2.disabled = !p.unlocked.m2;
    optM2.textContent = p.unlocked.m2 ? "M2 — Operazioni con monomi" : "M2 — Operazioni con monomi (bloccato)";
  }
}

function showToast(text){
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("toast--in"));
  setTimeout(() => {
    el.classList.remove("toast--in");
    setTimeout(() => el.remove(), 250);
  }, 2600);
}

// ---------- Render matematica (esponenti) ----------
function escapeHtml(str){
  return (str ?? "")
    .toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function mathHTML(str){
  // Converte ^numero in esponente visivo.
  // Esempio: 5x^3y^2 -> 5x<sup>3</sup>y<sup>2</sup>
  let html = escapeHtml(str);
  // ^10, ^2, ecc.
  html = html.replace(/\^([0-9]+)/g, "<sup>$1</sup>");
  // × (se presente)
  html = html.replaceAll("×", "·");
  return html;
}

// ---------- Parsing monomi per spiegazioni ----------
function parseMonomio(exprRaw){
  const s = normMath(exprRaw).replaceAll("*", "");
  // coefficient
  let i = 0;
  let sign = 1;
  if(s[i] === "-") { sign = -1; i++; }
  else if(s[i] === "+") { i++; }

  let numStr = "";
  while(i < s.length && /[0-9]/.test(s[i])){ numStr += s[i]; i++; }
  let coeff;
  if(numStr.length > 0) coeff = sign * parseInt(numStr, 10);
  else {
    // se parte con lettera -> coeff 1 o -1
    coeff = sign * (i < s.length ? 1 : 0);
  }

  const vars = {};
  while(i < s.length){
    const ch = s[i];
    if(!/[a-z]/i.test(ch)) { i++; continue; }
    const v = ch;
    i++;
    let exp = 1;
    if(s[i] === "^"){
      i++;
      let eStr = "";
      while(i < s.length && /[0-9]/.test(s[i])){ eStr += s[i]; i++; }
      if(eStr) exp = parseInt(eStr, 10);
    }
    vars[v] = (vars[v] || 0) + exp;
  }
  return { coeff, vars };
}

function monomioDegree(exprRaw){
  const m = parseMonomio(exprRaw);
  return Object.values(m.vars).reduce((a,b)=>a+b,0);
}

function monomioVarDegree(exprRaw, letter){
  const m = parseMonomio(exprRaw);
  return m.vars[letter.toLowerCase()] || m.vars[letter.toUpperCase()] || 0;
}

function monomioLetterale(exprRaw){
  const m = parseMonomio(exprRaw);
  const entries = Object.entries(m.vars).sort((a,b)=>a[0].localeCompare(b[0]));
  if(entries.length === 0) return "";
  let out = "";
  for(const [v,e] of entries){
    out += v;
    if(e !== 1) out += `^${e}`;
  }
  return out;
}

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function show(sectionId){
  ["setup","quiz","result"].forEach(x => $(x).classList.add("hidden"));
  $(sectionId).classList.remove("hidden");
}

function normMath(s){
  return (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\u00d7/g, "*");
}

function setProgress(idx, total){
  const pct = (idx/total)*100;
  $("progressBar").style.width = `${pct}%`;
}

// ------------------ BANCA M1 (30) ------------------
// Ogni domanda ha SEMPRE regola + esempio (Allenamento).

const RULES = {
  MONOMIO_DEF: {
    rule: "Un monomio e' un prodotto tra un coefficiente numerico e una parte letterale (lettere con esponenti naturali).",
    ex: "Esempio: -3x^2y -> coefficiente -3, parte letterale x^2y."
  },
  COEFF: {
    rule: "Il coefficiente e' il numero (con segno) davanti alle lettere. Se non c'e' scritto, vale 1 o -1.",
    ex: "Esempio: -x^2y -> coefficiente -1."
  },
  LETTERALE: {
    rule: "La parte letterale e' formata solo dalle lettere con i loro esponenti.",
    ex: "Esempio: 4x^2y -> parte letterale x^2y."
  },
  GRADO_MONOMIO: {
    rule: "Il grado totale di un monomio e' la somma degli esponenti delle lettere.",
    ex: "Esempio: 5x^3y^2 -> grado 3+2 = 5."
  },
  GRADO_LETTERA: {
    rule: "Il grado rispetto a una lettera e' l'esponente di quella lettera (se non c'e', e' 0).",
    ex: "Esempio: 7x^4y -> grado in x = 4, in y = 1, in z = 0."
  },
  GRADO_COSTANTE: {
    rule: "Una costante (solo numero) e' un monomio di grado 0.",
    ex: "Esempio: 9 -> grado 0."
  },
  TERMINI_SIMILI_INTRO: {
    rule: "Due monomi sono simili se hanno la stessa parte letterale (stesse lettere con stessi esponenti).",
    ex: "Esempio: 2x^2 e -5x^2 sono simili; 3x e 3x^2 non sono simili."
  }
  ,PROD_MONOMI: {
    rule: "Nel prodotto tra monomi: moltiplica i coefficienti e somma gli esponenti delle stesse lettere.",
    ex: "Esempio: (2x^2)(3x^3) = 6x^5"
  },
  DIV_MONOMI: {
    rule: "Nella divisione tra monomi: dividi i coefficienti e sottrai gli esponenti delle stesse lettere.",
    ex: "Esempio: 6x^5 : 2x^3 = 3x^2"
  },
  POT_MONOMI: {
    rule: "Nella potenza di un monomio: eleva il coefficiente e moltiplica gli esponenti per l'esponente della potenza.",
    ex: "Esempio: (2x^3)^2 = 4x^6"
  },
  SEGNI: {
    rule: "Regole dei segni: (+)(+) = +, (+)(-) = -, (-)(-) = + (vale anche per la divisione).",
    ex: "Esempio: (-4)(-2) = +8"
  },
  SCELTA_REGOLA: {
    rule: "Prima decidi quale regola usare: prodotto (sommi esponenti), divisione (sottrai), potenza (moltiplichi).",
    ex: "Esempio: x^2 * x^3 -> sommo (2+3).  x^6 : x^2 -> sottraggo (6-2)."
  }
};

function mcq(id, prompt, choices, answerIndex, ruleKey, tag, comp){
  return { id, type:"mcq", prompt, choices, answerIndex, ruleKey, tag, comp };
}

function inputQ(id, prompt, answers, ruleKey, tag, comp, hint){
  // answers: array di risposte equivalenti normalizzabili
  return { id, type:"input", prompt, answers, ruleKey, tag, comp, hint };
}

const BANK_M1 = [
  // Riconoscere monomio
  mcq("m1_01", "Quale tra queste e' un monomio?", ["2x + 3", "5x^2y", "x/y", "x^x"], 1, "MONOMIO_DEF", "Monomi", "C1"),
  mcq("m1_02", "Quale NON e' un monomio?", ["-4xy", "7", "x + y", "3x^2"], 2, "MONOMIO_DEF", "Monomi", "C1"),
  mcq("m1_03", "Il numero 8 da solo e'...", ["Non e' un monomio", "Un monomio di grado 0", "Un polinomio di grado 1", "Un binomio"], 1, "GRADO_COSTANTE", "Grado", "C4"),

  // Coefficiente
  inputQ("m1_04", "In -5x^3 il coefficiente e'...", ["-5"], "COEFF", "Coeff", "C2", "Scrivi solo il numero"),
  inputQ("m1_05", "In -x^2y il coefficiente e'...", ["-1"], "COEFF", "Coeff", "C2", "Se manca il numero, vale -1"),
  inputQ("m1_06", "In 9y il coefficiente e'...", ["9"], "COEFF", "Coeff", "C2"),

  // Parte letterale
  inputQ("m1_07", "In 4x^2y la parte letterale e'...", ["x^2y","x^2*y"], "LETTERALE", "Parte letterale", "C3", "Scrivi solo lettere e potenze"),
  inputQ("m1_08", "In 6x^3 la parte letterale e'...", ["x^3"], "LETTERALE", "Parte letterale", "C3"),

  // Grado monomio
  inputQ("m1_09", "Qual e' il grado di 5x^2?", ["2"], "GRADO_MONOMIO", "Grado", "C4"),
  inputQ("m1_10", "Qual e' il grado di 3xy?", ["2"], "GRADO_MONOMIO", "Grado", "C4"),
  inputQ("m1_11", "Qual e' il grado di 7x^3y^2?", ["5"], "GRADO_MONOMIO", "Grado", "C4"),
  inputQ("m1_12", "Qual e' il grado di 9?", ["0"], "GRADO_COSTANTE", "Grado", "C4"),
  inputQ("m1_13", "Qual e' il grado di x^4y^3z?", ["8"], "GRADO_MONOMIO", "Grado", "C4"),

  // Grado rispetto a lettera
  inputQ("m1_14", "In 6x^3y^2, il grado rispetto a x e'...", ["3"], "GRADO_LETTERA", "Grado per lettera", "C5"),
  inputQ("m1_15", "In 6x^3y^2, il grado rispetto a y e'...", ["2"], "GRADO_LETTERA", "Grado per lettera", "C5"),
  inputQ("m1_16", "In 5ab^4, il grado rispetto a b e'...", ["4"], "GRADO_LETTERA", "Grado per lettera", "C5"),
  inputQ("m1_17", "Nel numero 8, il grado rispetto a x e'...", ["0"], "GRADO_LETTERA", "Grado per lettera", "C5"),

  // Teoria/vero-falso (MCQ)
  mcq("m1_18", "Vero o falso: Il coefficiente puo' essere negativo.", ["Vero","Falso"], 0, "COEFF", "Teoria", "C2"),
  mcq("m1_19", "Vero o falso: Il numero influisce sul grado del monomio.", ["Vero","Falso"], 1, "GRADO_MONOMIO", "Teoria", "C4"),
  mcq("m1_20", "Vero o falso: Un monomio puo' avere grado 0.", ["Vero","Falso"], 0, "GRADO_COSTANTE", "Teoria", "C4"),

  // Riconoscere simili (intro M3, ma utile qui)
  mcq("m1_21", "Quali sono monomi simili?", ["2x^2 e 5x^2", "3x e 3x^2", "x^2 e x^2y", "4x e 4y"], 0, "TERMINI_SIMILI_INTRO", "Termini simili"),
  mcq("m1_22", "4x e -7x sono monomi...", ["simili","non simili"], 0, "TERMINI_SIMILI_INTRO", "Termini simili"),

  // Altri esercizi vari
  mcq("m1_23", "Quanti tipi di lettere ci sono in 5xy^2?", ["1","2","3","0"], 1, "MONOMIO_DEF", "Monomi", "C1"),
  mcq("m1_24", "Quale contiene solo una lettera?", ["6x^3","2xy","5ab","7xyz"], 0, "MONOMIO_DEF", "Monomi", "C1"),
  inputQ("m1_25", "In -7xy^2 il coefficiente e'...", ["-7"], "COEFF", "Coeff", "C2"),
  inputQ("m1_26", "In 2x^5 il grado totale e'...", ["5"], "GRADO_MONOMIO", "Grado", "C4"),
  inputQ("m1_27", "In 4x^2y il grado rispetto a y e'...", ["1"], "GRADO_LETTERA", "Grado per lettera", "C5"),
  mcq("m1_28", "x e x^2 sono monomi simili?", ["Si","No"], 1, "TERMINI_SIMILI_INTRO", "Termini simili"),
  inputQ("m1_29", "In 10x^2y^3 il grado totale e'...", ["5"], "GRADO_MONOMIO", "Grado", "C4"),
  mcq("m1_30", "Qual e' il coefficiente di 3x^2y?", ["3","x^2y","2","y"], 0, "COEFF", "Coeff", "C2")
];

// ------------------ BANCA M2 (starter) ------------------
// (si sblocca dopo M1: C1..C5 tutti verdi)
const BANK_M2 = [
  // Prodotto
  inputQ("m2_01", "Calcola: (2x^2)(3x^3)", ["6x^5"], "PROD_MONOMI", "Prodotto", "C6", "Scrivi in forma 6x^5"),
  inputQ("m2_02", "Calcola: (-4x)(2x^2)", ["-8x^3"], "PROD_MONOMI", "Prodotto", "C6"),
  inputQ("m2_03", "Calcola: (5x^3y)(2xy^2)", ["10x^4y^3"], "PROD_MONOMI", "Prodotto", "C6"),

  // Divisione
  inputQ("m2_04", "Calcola: 6x^5 : 2x^3", ["3x^2"], "DIV_MONOMI", "Divisione", "C7"),
  inputQ("m2_05", "Calcola: -8x^4 : 4x^2", ["-2x^2"], "DIV_MONOMI", "Divisione", "C7"),
  inputQ("m2_06", "Calcola: 10x^3y : 5xy", ["2x^2"], "DIV_MONOMI", "Divisione", "C7"),

  // Potenza
  inputQ("m2_07", "Calcola: (2x^3)^2", ["4x^6"], "POT_MONOMI", "Potenza", "C8"),
  inputQ("m2_08", "Calcola: (-3x^2)^2", ["9x^4"], "POT_MONOMI", "Potenza", "C8"),
  inputQ("m2_09", "Calcola: (5x)^3", ["125x^3"], "POT_MONOMI", "Potenza", "C8"),

  // Segni
  mcq("m2_10", "Qual e' il segno di (-) * (-)?", ["+","-"], 0, "SEGNI", "Segni", "C9"),
  mcq("m2_11", "Qual e' il segno di (-) : (+)?", ["+","-"], 1, "SEGNI", "Segni", "C9"),

  // Scelta regola
  mcq("m2_12", "Quale regola usi in: x^2 · x^5 ?", ["Sommo gli esponenti","Sottraggo gli esponenti","Moltiplico gli esponenti"], 0, "SCELTA_REGOLA", "Regola", "C10"),
  mcq("m2_13", "Quale regola usi in: x^6 : x^2 ?", ["Sommo","Sottraggo","Moltiplico"], 1, "SCELTA_REGOLA", "Regola", "C10"),
  mcq("m2_14", "Quale regola usi in: (x^3)^2 ?", ["Sommo","Sottraggo","Moltiplico"], 2, "SCELTA_REGOLA", "Regola", "C10")
];

// ------------------ Stato App ------------------
let mode = "training"; // training | exam
let session = [];
let idx = 0;
let score = 0;
let locked = false;
let wrongByTag = {}; // per analisi debolezze
let currentBlock = "m1";

function start(){
  mode = $("mode").value;
  currentBlock = $("block").value || "m1";
  checkUnlocks();
  const p = loadProgress();
  if(currentBlock === "m2" && !p.unlocked.m2){
    showToast("🔒 Prima completa M1: consolidiamo i monomi per sbloccare M2.");
    currentBlock = "m1";
    $("block").value = "m1";
  }

  const count = Math.max(5, Math.min(38, parseInt($("count").value || "20", 10)));

  const bank = (currentBlock === "m2") ? BANK_M2 : BANK_M1;
  session = shuffle(bank).slice(0, count);

  idx = 0;
  score = 0;
  locked = false;
  wrongByTag = {};

  show("quiz");
  render();
}

function render(){
  locked = false;
  $("nextBtn").disabled = true;
  $("feedback").textContent = "";
  $("answerInput").value = "";

  const q = session[idx];

  $("quizTitle").textContent = `Domanda ${idx+1} / ${session.length}`;
  const blockLabel = (currentBlock === "m2") ? "M2" : "M1";
  $("meta").textContent = `Blocco: ${blockLabel} • Tipo: ${q.type.toUpperCase()} • Tema: ${q.tag}`;
  $("scorePill").textContent = `Punti: ${score}`;
  setProgress(idx, session.length);

  // Regole
  const r = RULES[q.ruleKey] || { rule:"", ex:"" };
  const showRuleBox = (mode === "training");
  $("ruleBox").classList.toggle("hidden", !showRuleBox);
  if(showRuleBox){
    $("ruleText").innerHTML = mathHTML(r.rule);
    $("ruleExample").innerHTML = mathHTML(r.ex);
  }

  $("qtext").innerHTML = mathHTML(q.prompt);

  // UI tipo domanda
  $("mcqWrap").innerHTML = "";
  $("mcqWrap").classList.add("hidden");
  $("inputWrap").classList.add("hidden");

  if(q.type === "mcq"){
    $("mcqWrap").classList.remove("hidden");
    q.choices.forEach((c, i) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.type = "button";
      btn.innerHTML = mathHTML(c);
      btn.addEventListener("click", () => chooseMCQ(i, btn));
      $("mcqWrap").appendChild(btn);
    });
  } else {
    $("inputWrap").classList.remove("hidden");
    if(q.hint){
      $("feedback").innerHTML = `Suggerimento: ${mathHTML(q.hint)}`;
    }
    setTimeout(() => $("answerInput").focus(), 0);
  }
}

function markWrong(tag){
  wrongByTag[tag] = (wrongByTag[tag] || 0) + 1;
}

function updateProgressForQuestion(q, isCorrect){
  if(!q || !q.comp) return;
  const p = loadProgress();
  pushHist(p, q.comp, isCorrect);
  saveProgress(p);
  checkUnlocks();
}

function extractMonomioFromPrompt(prompt){
  // Prova a trovare il monomio dentro al testo domanda.
  const p = (prompt ?? "").toString();
  let m;
  m = p.match(/In\s+([^\s,]+)[\s,]/i);
  if(m && m[1]) return m[1];
  m = p.match(/grado\s+di\s+([^\s?]+)\?/i);
  if(m && m[1]) return m[1];
  m = p.match(/coefficiente\s+di\s+([^\s?]+)\?/i);
  if(m && m[1]) return m[1];
  return null;
}

function buildWhy(q, userRaw){
  const rule = RULES[q.ruleKey];
  const u = (userRaw ?? "").toString().trim();
  const uNorm = normMath(u);
  const mono = extractMonomioFromPrompt(q.prompt);

  // default
  const out = {
    why: rule ? rule.rule : "",
    steps: rule ? rule.ex : ""
  };

  if(!mono) return out;

  if(q.ruleKey === "COEFF"){
    const parsed = parseMonomio(mono);
    const correct = parsed.coeff.toString();
    // errori comuni
    if(/[a-z]/i.test(uNorm)){
      out.why = "Hai inserito anche la parte letterale: il coefficiente e' SOLO il numero (con segno).";
    } else if(uNorm === "1" && correct === "-1"){
      out.why = "Attenzione al segno: se il monomio inizia con '-' e manca il numero, il coefficiente vale -1.";
    } else {
      out.why = "Il coefficiente e' il numero davanti alle lettere (con il segno).";
    }
    out.steps = `Nel monomio ${mono}: coefficiente = ${correct}.`;
    return out;
  }

  if(q.ruleKey === "LETTERALE"){
    const correct = monomioLetterale(mono);
    if(/^[-+]?\d/.test(uNorm)){
      out.why = "Hai incluso il coefficiente: la parte letterale contiene SOLO lettere ed esponenti.";
    } else {
      out.why = "La parte letterale contiene solo lettere ed esponenti, senza il numero.";
    }
    out.steps = `Nel monomio ${mono}: parte letterale = ${correct}.`;
    return out;
  }

  if(q.ruleKey === "GRADO_MONOMIO" || q.ruleKey === "GRADO_COSTANTE"){
    const d = monomioDegree(mono);
    const parsed = parseMonomio(mono);
    const parts = Object.entries(parsed.vars)
      .map(([v,e]) => (e === 1 ? `${v}` : `${v}^${e}`))
      .join(" + ") || "0";
    if(/[a-z]/i.test(uNorm)){
      out.why = "Il grado e' un numero: non si scrivono lettere.";
    } else {
      out.why = "Il grado totale e' la somma degli esponenti.";
    }
    out.steps = `Somma esponenti: ${parts} = ${d}.`;
    return out;
  }

  if(q.ruleKey === "GRADO_LETTERA"){
    const m = q.prompt.match(/rispetto\s+a\s+([a-z])/i);
    const letter = m ? m[1] : "x";
    const d = monomioVarDegree(mono, letter);
    out.why = `Il grado rispetto a ${letter} e' l'esponente di ${letter} (se non c'e', vale 0).`;
    out.steps = `Nel monomio ${mono}: esponente di ${letter} = ${d}.`;
    return out;
  }

  return out;
}

function chooseMCQ(choiceIndex, clickedBtn){
  if(locked) return;
  locked = true;

  const q = session[idx];
  const buttons = Array.from(document.querySelectorAll(".choice"));
  buttons.forEach(b => b.disabled = true);

  const correctBtn = buttons[q.answerIndex];
  correctBtn.classList.add("correct");

  if(choiceIndex === q.answerIndex){
    score += 1;
    $("feedback").innerHTML = `✅ <strong>Corretto</strong>`;
    updateProgressForQuestion(q, true);
  } else {
    clickedBtn.classList.add("wrong");
    markWrong(q.tag);
    const correctText = q.choices[q.answerIndex];
    const chosenText = q.choices[choiceIndex];
    const why = buildWhy(q, chosenText);
    $("feedback").innerHTML =
      `❌ <strong>No</strong><br>`+
      `<div class='muted'>La tua risposta: <strong>${mathHTML(chosenText)}</strong></div>`+
      `<div class='muted'>Risposta corretta: <strong>${mathHTML(correctText)}</strong></div>`+
      (mode === "training" ? `<div style='margin-top:8px'><strong>Perche':</strong> ${mathHTML(why.why)}</div>` : "")+
      (mode === "training" ? `<div class='muted' style='margin-top:6px'>${mathHTML(why.steps)}</div>` : "");
    updateProgressForQuestion(q, false);
  }

  $("scorePill").textContent = `Punti: ${score}`;
  $("nextBtn").disabled = false;
}

function checkInput(){
  if(locked) return;
  locked = true;

  const q = session[idx];
  const user = normMath($("answerInput").value);
  const ok = (q.answers || []).map(normMath);

  const isCorrect = ok.includes(user);
  if(isCorrect){
    score += 1;
    $("feedback").innerHTML = `✅ <strong>Corretto</strong>`;
    updateProgressForQuestion(q, true);
  } else {
    markWrong(q.tag);
    const correctRaw = (q.answers && q.answers[0]) ? q.answers[0] : "";
    const why = buildWhy(q, $("answerInput").value);
    $("feedback").innerHTML =
      `❌ <strong>No</strong><br>`+
      `<div class='muted'>La tua risposta: <strong>${mathHTML($("answerInput").value || "(vuota)")}</strong></div>`+
      `<div class='muted'>Risposta corretta: <strong>${mathHTML(correctRaw)}</strong></div>`+
      (mode === "training" ? `<div style='margin-top:8px'><strong>Spiegazione:</strong> ${mathHTML(why.why)}</div>` : "")+
      (mode === "training" ? `<div class='muted' style='margin-top:6px'>${mathHTML(why.steps)}</div>` : "");
    updateProgressForQuestion(q, false);
  }

  $("scorePill").textContent = `Punti: ${score}`;
  $("nextBtn").disabled = false;
}

function next(){
  idx += 1;
  if(idx >= session.length){
    finish();
  } else {
    render();
  }
}

function finish(){
  show("result");
  const total = session.length;
  const pct = Math.round((score/total)*100);
  let msg = `Hai fatto ${score} / ${total} (${pct}%).`;
  if(pct >= 90) msg += " Ottimo!";
  else if(pct >= 75) msg += " Molto bene.";
  else if(pct >= 60) msg += " Bene, ma ripassa i punti deboli.";
  else msg += " Serve ripasso: usa l'Allenamento con regole ed esempi.";
  $("resultText").textContent = msg;

  // Debolezze
  const entries = Object.entries(wrongByTag).sort((a,b) => b[1]-a[1]);
  if(entries.length === 0){
    $("weakness").classList.add("hidden");
  } else {
    const div = $("weakness");
    div.classList.remove("hidden");
    div.innerHTML = "<h3 style='margin:0 0 8px 0'>Da ripassare</h3>";
    for(const [tag, n] of entries){
      const p = document.createElement("div");
      p.className = "review";
      p.innerHTML = `<div class='muted'>${tag}: ${n} errori</div>`;
      div.appendChild(p);
    }
  }
}

function restart(){
  show("setup");
}

// ------------------ Eventi UI ------------------
$("startBtn").addEventListener("click", start);
$("restartBtn").addEventListener("click", restart);
$("backBtn").addEventListener("click", restart);
$("nextBtn").addEventListener("click", next);
$("skipBtn").addEventListener("click", () => {
  idx += 1;
  if(idx >= session.length) finish();
  else render();
});

$("checkBtn").addEventListener("click", checkInput);
$("answerInput").addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    e.preventDefault();
    checkInput();
  }
});

// keypad
$("keypad").addEventListener("click", (e) => {
  const btn = e.target.closest(".key");
  if(!btn) return;
  const k = btn.getAttribute("data-k");
  const inp = $("answerInput");
  if(k === "BKSP"){
    inp.value = inp.value.slice(0, -1);
    inp.focus();
    return;
  }
  if(k === "CLR"){
    inp.value = "";
    inp.focus();
    return;
  }
  inp.value += k;
  inp.focus();
});

// rileva piattaforma per compatibilita' PWA (classi CSS)
(() => {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  document.body.classList.toggle("ios", isIOS);
  document.body.classList.toggle("android", isAndroid);
})();

show("setup");
checkUnlocks();
