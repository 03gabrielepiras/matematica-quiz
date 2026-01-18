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

