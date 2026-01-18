# Firebase (opzionale) — "Classe" e presenza online

L'app funziona al 100% anche senza Firebase.
Se vuoi vedere **chi è online** e i **partecipanti**, configura Firebase (Auth anonimo + Firestore).

## 1) Crea progetto + Firestore
1. Firebase Console → crea un progetto
2. Abilita **Authentication** → metodo **Anonymous**
3. Abilita **Cloud Firestore**

## 2) Inserisci la configurazione
Apri `firebase-config.js` e sostituisci i campi `YOUR_...` con i valori del tuo `firebaseConfig`.

## 3) Regole consigliate (sicure)
Firestore Rules (consigliate):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /classes/{classId}/participants/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 4) Come funziona la presenza
- L'app fa un "ping" ogni ~25 secondi aggiornando `updatedAt`.
- Un utente è considerato **Online** se è attivo negli ultimi ~65 secondi.
