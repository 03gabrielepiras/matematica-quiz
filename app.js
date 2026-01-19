let state = {
  name:null,
  mode:null,
  index:0,
  score:0
};

function startApp(){
  const n = document.getElementById("nameInput").value.trim();
  if(!n) return alert("Inserisci il nome");
  state.name = n;
  document.getElementById("nameBox").classList.add("hidden");
  document.getElementById("menu").classList.remove("hidden");
  document.getElementById("welcome").innerText = "Ciao " + n;
}

function startMode(mode){
  state.mode = mode;
  state.index = 0;
  state.score = 0;
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("quiz").classList.remove("hidden");
  showQuestion();
}

function showQuestion(){
  const q = QUESTIONS[state.index];
  document.getElementById("question").innerText = q.question;
  const a = document.getElementById("answers");
  a.innerHTML = "";
  q.options.forEach((opt,i)=>{
    const b = document.createElement("button");
    b.innerText = opt;
    b.onclick = ()=>answer(i);
    a.appendChild(b);
  });
  document.getElementById("explanation").innerText = "";
}

function answer(i){
  const q = QUESTIONS[state.index];
  if(i===q.correct) state.score++;
  if(state.mode==="train"){
    document.getElementById("explanation").innerText = q.explanation;
  }
}

function next(){
  state.index++;
  if(state.index>=QUESTIONS.length){
    alert("Fine! Punteggio: "+state.score+"/"+QUESTIONS.length);
    location.reload();
  } else {
    showQuestion();
  }
}
