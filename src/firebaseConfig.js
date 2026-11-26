// Firebase project of the game (Konto: sign-in, nick, cloud save; src/systems/online.js).
// These values are public by design: every web app that talks to Firebase ships them to the browser, so keeping them
// out of the repository would hide nothing. The data is guarded by the Firestore rules (firestore.rules), the API key's
// HTTP referrer restriction (Google Cloud console: only adrianpiecek.github.io and localhost) and App Check.
// appCheckSiteKey: the reCAPTCHA v3 site key registered in Firebase App Check; empty: App Check off.
export const firebaseConfig = {
  apiKey: 'AIzaSyDe3NCp6xcSjatdizzbQHoKdqvy0DPLKss',
  authDomain: 'bemowo-survivor.firebaseapp.com',
  projectId: 'bemowo-survivor',
  storageBucket: 'bemowo-survivor.firebasestorage.app',
  messagingSenderId: '625453488298',
  appId: '1:625453488298:web:4d3dc607463f73a2c318d3',
  appCheckSiteKey: '',
};
