/* Matematica PWA - Blocco M1 (Monomi) 
   Stile e UX ispirati alla tua app di spagnolo/geografia.
   Allenamento: regola + esempio sempre.
*/

"use strict";

const $ = (id) => document.getElementById(id);

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
};

function mcq(id, prompt, choices, answerIndex, ruleKey, tag){
  return { id, type:"mcq", prompt, choices, answerIndex, ruleKey, tag };
}

function inputQ(id, prompt, answers, ruleKey, tag, hint){
  // answers: array di risposte equivalenti normalizzabili
  return { id, type:"input", prompt, answers, ruleKey, tag, hint };
}

const BANK_M1 = [
  // Riconoscere monomio
  mcq("m1_01", "Quale tra queste e' un monomio?", ["2x + 3", "5x^2y", "x/y", "x^x"], 1, "MONOMIO_DEF", "Monomi"),
  mcq("m1_02", "Quale NON e' un monomio?", ["-4xy", "7", "x + y", "3x^2"], 2, "MONOMIO_DEF", "Monomi"),
  mcq("m1_03", "Il numero 8 da solo e'...", ["Non e' un monomio", "Un monomio di grado 0", "Un polinomio di grado 1", "Un binomio"], 1, "GRADO_COSTANTE", "Grado"),

  // Coefficiente
  inputQ("m1_04", "In -5x^3 il coefficiente e'...", ["-5"], "COEFF", "Coeff", "Scrivi solo il numero"),
  inputQ("m1_05", "In -x^2y il coefficiente e'...", ["-1"], "COEFF", "Coeff", "Se manca il numero, vale -1"),
  inputQ("m1_06", "In 9y il coefficiente e'...", ["9"], "COEFF", "Coeff"),

  // Parte letterale
  inputQ("m1_07", "In 4x^2y la parte letterale e'...", ["x^2y","x^2*y"], "LETTERALE", "Parte letterale", "Scrivi solo lettere e potenze"),
  inputQ("m1_08", "In 6x^3 la parte letterale e'...", ["x^3"], "LETTERALE", "Parte letterale"),

  // Grado monomio
  inputQ("m1_09", "Qual e' il grado di 5x^2?", ["2"], "GRADO_MONOMIO", "Grado"),
  inputQ("m1_10", "Qual e' il grado di 3xy?", ["2"], "GRADO_MONOMIO", "Grado"),
  inputQ("m1_11", "Qual e' il grado di 7x^3y^2?", ["5"], "GRADO_MONOMIO", "Grado"),
  inputQ("m1_12", "Qual e' il grado di 9?", ["0"], "GRADO_COSTANTE", "Grado"),
  inputQ("m1_13", "Qual e' il grado di x^4y^3z?", ["8"], "GRADO_MONOMIO", "Grado"),

  // Grado rispetto a lettera
  inputQ("m1_14", "In 6x^3y^2, il grado rispetto a x e'...", ["3"], "GRADO_LETTERA", "Grado per lettera"),
  inputQ("m1_15", "In 6x^3y^2, il grado rispetto a y e'...", ["2"], "GRADO_LETTERA", "Grado per lettera"),
  inputQ("m1_16", "In 5ab^4, il grado rispetto a b e'...", ["4"], "GRADO_LETTERA", "Grado per lettera"),
  inputQ("m1_17", "Nel numero 8, il grado rispetto a x e'...", ["0"], "GRADO_LETTERA", "Grado per lettera"),

  // Teoria/vero-falso (MCQ)
  mcq("m1_18", "Vero o falso: Il coefficiente puo' essere negativo.", ["Vero","Falso"], 0, "COEFF", "Teoria"),
  mcq("m1_19", "Vero o falso: Il numero influisce sul grado del monomio.", ["Vero","Falso"], 1, "GRADO_MONOMIO", "Teoria"),
  mcq("m1_20", "Vero o falso: Un monomio puo' avere grado 0.", ["Vero","Falso"], 0, "GRADO_COSTANTE", "Teoria"),

  // Riconoscere simili (intro M3, ma utile qui)
  mcq("m1_21", "Quali sono monomi simili?", ["2x^2 e 5x^2", "3x e 3x^2", "x^2 e x^2y", "4x e 4y"], 0, "TERMINI_SIMILI_INTRO", "Termini simili"),
  mcq("m1_22", "4x e -7x sono monomi...", ["simili","non simili"], 0, "TERMINI_SIMILI_INTRO", "Termini simili"),

  // Altri esercizi vari
  mcq("m1_23", "Quanti tipi di lettere ci sono in 5xy^2?", ["1","2","3","0"], 1, "MONOMIO_DEF", "Monomi"),
  mcq("m1_24", "Quale contiene solo una lettera?", ["6x^3","2xy","5ab","7xyz"], 0, "MONOMIO_DEF", "Monomi"),
  inputQ("m1_25", "In -7xy^2 il coefficiente e'...", ["-7"], "COEFF", "Coeff"),
  inputQ("m1_26", "In 2x^5 il grado totale e'...", ["5"], "GRADO_MONOMIO", "Grado"),
  inputQ("m1_27", "In 4x^2y il grado rispetto a y e'...", ["1"], "GRADO_LETTERA", "Grado per lettera"),
  mcq("m1_28", "x e x^2 sono monomi simili?", ["Si","No"], 1, "TERMINI_SIMILI_INTRO", "Termini simili"),
  inputQ("m1_29", "In 10x^2y^3 il grado totale e'...", ["5"], "GRADO_MONOMIO", "Grado"),
  mcq("m1_30", "Qual e' il coefficiente di 3x^2y?", ["3","x^2y","2","y"], 0, "COEFF", "Coeff")
];

// ------------------ Stato App ------------------
let mode = "training"; // training | exam
let showRules = true;
let session = [];
let idx = 0;
let score = 0;
let locked = false;
let wrongByTag = {}; // per analisi debolezze

function openSettings(){
  $("settingsModal").classList.remove("hidden");
}
function closeSettings(){
  $("settingsModal").classList.add("hidden");
}

function start(){
  mode = $("mode").value;
  showRules = $("showRules").value === "yes";

  const count = Math.max(5, Math.min(38, parseInt($("count").value || "20", 10)));

  // Per ora solo M1; in futuro mix M1-M5.
  session = shuffle(BANK_M1).slice(0, count);

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
  $("meta").textContent = `Blocco: M1 • Tipo: ${q.type.toUpperCase()} • Tema: ${q.tag}`;
  $("scorePill").textContent = `Punti: ${score}`;
  setProgress(idx, session.length);

  // Regole
  const r = RULES[q.ruleKey] || { rule:"", ex:"" };
  const showRuleBox = (mode === "training") && showRules;
  $("ruleBox").classList.toggle("hidden", !showRuleBox);
  if(showRuleBox){
    $("ruleText").textContent = r.rule;
    $("ruleExample").textContent = r.ex;
  }

  $("qtext").textContent = q.prompt;

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
      btn.textContent = c;
      btn.addEventListener("click", () => chooseMCQ(i, btn));
      $("mcqWrap").appendChild(btn);
    });
  } else {
    $("inputWrap").classList.remove("hidden");
    if(q.hint){
      $("feedback").textContent = `Suggerimento: ${q.hint}`;
    }
    setTimeout(() => $("answerInput").focus(), 0);
  }
}

function markWrong(tag){
  wrongByTag[tag] = (wrongByTag[tag] || 0) + 1;
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
  } else {
    clickedBtn.classList.add("wrong");
    markWrong(q.tag);
    const correctText = q.choices[q.answerIndex];
    $("feedback").innerHTML = `❌ <strong>No</strong> — Risposta corretta: <strong>${correctText}</strong>`;
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
  } else {
    markWrong(q.tag);
    $("feedback").innerHTML = `❌ <strong>No</strong> — Esempio: <strong>${ok[0]}</strong>`;
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

// settings modal
$("settingsBtn").addEventListener("click", openSettings);
$("closeSettingsBtn").addEventListener("click", closeSettings);

// iOS Safari/PWA a volte non chiude su "click"; usiamo anche pointer/touch
const settingsModalEl = $("settingsModal");
const settingsCardEl = settingsModalEl.querySelector(".modal__card");

// click/tap sul "foglio" non deve chiudere
settingsCardEl.addEventListener("pointerdown", (e) => e.stopPropagation());
settingsCardEl.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });

function maybeCloseSettings(e){
  // chiudi solo se si tocca lo sfondo (backdrop)
  if(e.target === settingsModalEl) closeSettings();
}

settingsModalEl.addEventListener("pointerdown", maybeCloseSettings);
settingsModalEl.addEventListener("click", maybeCloseSettings);
settingsModalEl.addEventListener("touchstart", maybeCloseSettings, { passive: true });

// rileva piattaforma per compatibilita' PWA (classi CSS)
(() => {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  document.body.classList.toggle("ios", isIOS);
  document.body.classList.toggle("android", isAndroid);
})();

show("setup");
