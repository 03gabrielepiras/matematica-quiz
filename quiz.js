const questions = [
  {
    q: "Qual è il coefficiente di -3x²?",
    a: "-3",
    tip: "Il coefficiente è il numero davanti alle lettere."
  },
  {
    q: "Qual è il grado del monomio 5x³y²?",
    a: "5",
    tip: "Il grado è la somma degli esponenti."
  },
  {
    q: "Calcola: (2x²)(3x³)",
    a: "6x5",
    tip: "Nel prodotto si sommano gli esponenti."
  },
  {
    q: "Riduci: 2x + 3x",
    a: "5x",
    tip: "Somma i coefficienti dei termini simili."
  },
  {
    q: "MCD tra 6x² e 4x",
    a: "2x",
    tip: "Nel MCD prendi esponente minore."
  }
];

let current = 0;

function startQuiz() {
  document.getElementById("quiz").classList.remove("hidden");
  show();
}

function show() {
  document.getElementById("question").innerText = questions[current].q;
  document.getElementById("postit").innerText = questions[current].tip;
  document.getElementById("answer").value = "";
  document.getElementById("feedback").innerText = "";
}

function check() {
  const user = document.getElementById("answer").value.replace(/\s/g,"");
  const ok = questions[current].a;

  if (user === ok) {
    document.getElementById("feedback").innerText = "✅ Corretto!";
    current = (current + 1) % questions.length;
    setTimeout(show, 800);
  } else {
    document.getElementById("feedback").innerText = "❌ Riprova";
  }
}
