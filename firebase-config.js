// Firebase (opzionale): abilita "Classe" / presenza online senza login.
//
// 1) Crea un progetto Firebase + Firestore
// 2) Incolla qui i valori del tuo "firebaseConfig" (da Firebase Console)
// 3) Pubblica su GitHub Pages
//
// Se non configuri nulla, l'app continua a funzionare offline come prima.

// ⚠️ IMPORTANTE: Le chiavi Firebase NON sono segrete (sono pubbliche),
// ma devi impostare regole Firestore adeguate.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

function isConfigured(cfg){
  if(!cfg) return false;
  return Object.values(cfg).every(v => typeof v === 'string' && v && !v.startsWith('YOUR_'));
}

if(!window.__FIREBASE__ && isConfigured(firebaseConfig)){
  // Moduli Firebase (CDN)
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
  const { getAuth, signInAnonymously } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");
  const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  window.__FIREBASE__ = { app, auth, db, signInAnonymously };
}
