import { config } from '../config.js';
import { firebaseConfig } from '../firebaseConfig.js';
import { save, onSaveWrite, progressOf, replaceProgress } from '../state.js';

// Konto (Firebase): sign-in by e-mail and password or Google, a unique nick and the progress in the cloud. The SDK comes from Google's CDN
// (config.online.sdk) after the game starts, so the game never waits for it and plays on without it (offline, blocked,
// CDN down): every call here fails softly and says so in `online`.
// Firestore (rules in firestore.rules):
//   users/{uid}   { nick, createdAt, updatedAt }   readable only by its owner
//   nicks/{lower} { uid, nick }                    one per nick, so a nick is unique whatever its letter case
//   saves/{uid}   { data, updatedAt }              the progress (state.js progressOf), only its owner's
//   scores/{uid}  { nick, score, kills, map, stage, overtimeMs, cleared, difficulty, timeMs, at }
//                 the player's best run for the leaderboard (Wyniki), readable by everyone
// online.state: 'off' | 'loading' | 'ready' | 'error'; online.sync: 'none' | 'syncing' | 'synced' | 'conflict' | 'error'.
// online.revision goes up when a save from the cloud replaced the progress here (MenuScene redraws).
export const online = { state: 'off', user: null, nick: null, sync: 'none', conflict: null, error: '', revision: 0, best: 0 };

const o = config.online;
const SYNC_KEY = 'bemowo-survivors-sync'; // this device's last sync: { uid, at (the cloud save's stamp), dirty (changed since) }
let A = null, F = null, auth = null, db = null; // the Auth and Firestore SDK modules, this app's auth and database
let adopting = false, uploadTimer = null, writes = 0;

const listeners = new Set();
export function onOnlineChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const changed = () => listeners.forEach((fn) => fn(online));

function readSync() {
  try { return JSON.parse(localStorage.getItem(SYNC_KEY)) ?? {}; } catch { return {}; }
}
function writeSync(s) {
  try { localStorage.setItem(SYNC_KEY, JSON.stringify(s)); } catch { /* blocked storage: the next login asks again */ }
}

const NICK_CHARS = /^[A-Za-z0-9_ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+$/;
// '' when the nick is fine, else what is wrong with it (the rules check the same).
export function nickError(nick) {
  if (nick.length < o.nickMin || nick.length > o.nickMax) return `Nick musi mieć od ${o.nickMin} do ${o.nickMax} znaków.`;
  if (!NICK_CHARS.test(nick)) return 'Tylko litery, cyfry i podkreślnik _.';
  return '';
}

export async function initOnline() {
  if (online.state === 'loading' || online.state === 'ready') return;
  if (config.debug.offline) {
    Object.assign(online, { state: 'error', error: 'Tryb offline (debug).' });
    return changed();
  }
  Object.assign(online, { state: 'loading', error: '' });
  changed();
  try {
    const [app, authMod, fsMod] = await Promise.all([
      import(`${o.sdk}/firebase-app.js`), import(`${o.sdk}/firebase-auth.js`), import(`${o.sdk}/firebase-firestore.js`)]);
    const { appCheckSiteKey, ...options } = firebaseConfig;
    const fbApp = app.initializeApp(options);
    if (appCheckSiteKey) {
      const ac = await import(`${o.sdk}/firebase-app-check.js`);
      ac.initializeAppCheck(fbApp, { provider: new ac.ReCaptchaV3Provider(appCheckSiteKey), isTokenAutoRefreshEnabled: true });
    }
    A = authMod;
    F = fsMod;
    auth = A.getAuth(fbApp);
    auth.languageCode = 'pl';
    db = F.getFirestore(fbApp);
    online.state = 'ready';
    changed();
    A.onAuthStateChanged(auth, userChanged);
  } catch {
    Object.assign(online, { state: 'error', error: 'Brak połączenia z serwerem gry. Gra działa dalej bez konta.' });
    changed();
  }
}

// Again after an error (the Konto window's button).
export function retryOnline() {
  if (online.state === 'error') online.state = 'off';
  return initOnline();
}

async function userChanged(user) {
  Object.assign(online, { user, nick: null, sync: 'none', conflict: null, best: 0 });
  changed();
  if (!user) return;
  try {
    const [profile, best] = await Promise.all([F.getDoc(F.doc(db, 'users', user.uid)), F.getDoc(F.doc(db, 'scores', user.uid))]);
    online.nick = profile.exists() ? profile.data().nick : null;
    online.best = best.exists() ? best.data().score : 0;
    changed();
    await syncOnLogin();
  } catch {
    online.sync = 'error';
    changed();
  }
}

// Same content whatever the key order (the cloud gives maps back sorted).
const stable = (v) => (Array.isArray(v) ? `[${v.map(stable).join(',')}]`
  : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${k}:${stable(v[k])}`).join(',')}}` : JSON.stringify(v));
const summary = (d) => ({ runs: d.runsPlayed ?? 0, protein: d.protein ?? 0 });

// Which save wins after a login: the cloud's when only it changed since this device last synced (or nothing was played
// here), this device's when only it changed; both changed: the player picks (online.conflict, the Konto window).
async function syncOnLogin() {
  const uid = online.user.uid, last = readSync();
  online.sync = 'syncing';
  changed();
  const snap = await F.getDoc(F.doc(db, 'saves', uid));
  if (!snap.exists()) return upload();
  const cloud = snap.data(), at = cloud.updatedAt?.toMillis?.() ?? 0, mine = last.uid === uid;
  if (!config.debug.forceSyncConflict) {
    if (mine && last.at === at) return last.dirty ? upload() : synced(at);
    if (mine && !last.dirty) return adopt(cloud.data, at);
    if (save.runsPlayed === 0) return adopt(cloud.data, at);
    if (stable(cloud.data) === stable(progressOf(save))) return synced(at);
  }
  online.sync = 'conflict';
  online.conflict = { cloud: summary(cloud.data), local: summary(save), data: cloud.data, at };
  changed();
}

// The Konto window's answer to a conflict: true keeps the cloud's save, false this device's.
export async function resolveConflict(useCloud) {
  const c = online.conflict;
  if (!c) return;
  online.conflict = null;
  try {
    if (useCloud) adopt(c.data, c.at);
    else await upload(true);
  } catch {
    online.sync = 'error';
    changed();
  }
}

function adopt(data, at) {
  adopting = true; // replaceProgress writes the save; that write is the cloud's, not a change to send back
  try { replaceProgress(data); } finally { adopting = false; }
  online.revision++;
  synced(at);
}

function synced(at) {
  writeSync({ uid: online.user.uid, at, dirty: false });
  online.sync = 'synced';
  changed();
}

// Sends this device's progress; force: over a conflict the player settled.
async function upload(force = false) {
  if (!online.user || (online.sync === 'conflict' && !force)) return;
  const uid = online.user.uid, before = writes, ref = F.doc(db, 'saves', uid);
  online.sync = 'syncing';
  changed();
  writeSync({ ...readSync(), uid, dirty: true });
  await F.setDoc(ref, { data: progressOf(save), updatedAt: F.serverTimestamp() });
  const at = (await F.getDoc(ref)).data().updatedAt.toMillis(); // the server's stamp, to know next time whether it moved
  if (writes === before) synced(at);
  else writeSync({ uid, at, dirty: true }); // written again meanwhile: the timer sends that too
}

// Every save write marks this device ahead of the cloud and, logged in, sends it a moment later (one upload per burst).
onSaveWrite(() => {
  if (adopting) return;
  writes++;
  const last = readSync();
  if (last.uid) writeSync({ ...last, dirty: true });
  if (!online.user || online.sync === 'conflict') return;
  clearTimeout(uploadTimer);
  uploadTimer = setTimeout(() => upload().catch(() => { online.sync = 'error'; changed(); }), o.uploadDelayMs);
});

// Google's window (a popup) never opens in a web app started from the iPhone home screen, so it is not offered there.
// The redirect sign-in is not used at all: with the game on github.io and Firebase's sign-in page on firebaseapp.com,
// today's browsers block what it needs (third-party storage), and a phone may reload the game tab meanwhile.
export const googleWorks = navigator.standalone !== true;

// Firebase's error codes as the player reads them.
function authError(e) {
  return {
    'auth/invalid-credential': 'Zły e-mail lub hasło.', 'auth/wrong-password': 'Zły e-mail lub hasło.',
    'auth/user-not-found': 'Zły e-mail lub hasło.', 'auth/invalid-email': 'To nie jest poprawny adres e-mail.',
    'auth/missing-password': 'Wpisz hasło.', 'auth/weak-password': 'Hasło musi mieć co najmniej 6 znaków.',
    'auth/email-already-in-use': 'Konto z tym e-mailem już jest. Zaloguj się.',
    'auth/too-many-requests': 'Za dużo prób. Spróbuj za chwilę.', 'auth/network-request-failed': 'Brak połączenia z serwerem.',
    'auth/popup-blocked': 'Przeglądarka zablokowała okno Google. Zaloguj się e-mailem.',
  }[e?.code] ?? 'Nie udało się. Spróbuj ponownie.';
}

// Each returns '' on success, else what went wrong.
async function tryAuth(fn) {
  if (online.state !== 'ready') return 'Brak połączenia z serwerem.';
  try { await fn(); } catch (e) {
    if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') return '';
    return authError(e);
  }
  return '';
}
export const signInGoogle = () => tryAuth(() => A.signInWithPopup(auth, new A.GoogleAuthProvider()));
export const signInEmail = (email, password) => tryAuth(() => A.signInWithEmailAndPassword(auth, email, password));
export const registerEmail = (email, password) => tryAuth(() => A.createUserWithEmailAndPassword(auth, email, password));
// Firebase sends the reset link (its e-mail template, language set in the console).
export const resetPassword = (email) => tryAuth(() => A.sendPasswordResetEmail(auth, email));

// Signed in by e-mail and password (deleting the account then asks for the password, not Google).
export const usesPassword = () => !!online.user?.providerData.some((p) => p.providerId === 'password');

// The progress stays on this device.
export async function signOut() {
  if (auth) await A.signOut(auth);
}

// Claims the nick (unique, whatever its letter case) and frees the old one, in one transaction. '' or the error.
export async function setNick(nick) {
  const err = nickError(nick);
  if (err) return err;
  const uid = online.user?.uid;
  if (!uid) return 'Najpierw się zaloguj.';
  const userRef = F.doc(db, 'users', uid), nickRef = F.doc(db, 'nicks', nick.toLowerCase()), scoreRef = F.doc(db, 'scores', uid);
  try {
    await F.runTransaction(db, async (t) => {
      const user = await t.get(userRef), taken = await t.get(nickRef), score = await t.get(scoreRef);
      if (taken.exists() && taken.data().uid !== uid) throw new Error('taken');
      const old = user.exists() ? user.data().nick : null;
      if (old && old.toLowerCase() !== nick.toLowerCase()) t.delete(F.doc(db, 'nicks', old.toLowerCase()));
      t.set(nickRef, { uid, nick });
      t.set(userRef, { nick, updatedAt: F.serverTimestamp(), ...(user.exists() ? {} : { createdAt: F.serverTimestamp() }) }, { merge: true });
      if (score.exists()) t.update(scoreRef, { nick }); // the leaderboard shows the new nick
    });
  } catch (e) {
    return e.message === 'taken' ? 'Ten nick jest już zajęty.' : 'Nie udało się zapisać nicku. Sprawdź połączenie.';
  }
  online.nick = nick;
  changed();
  return '';
}

// The account, its nick and its cloud save, gone for good; the progress on this device stays. Deleting an account needs
// a fresh sign-in: the password (e-mail accounts) or Google's window. '' or the error.
export async function deleteAccount(password) {
  const user = online.user;
  if (!user) return '';
  try {
    if (usesPassword()) await A.reauthenticateWithCredential(user, A.EmailAuthProvider.credential(user.email, password));
    else await A.reauthenticateWithPopup(user, new A.GoogleAuthProvider());
  } catch (e) {
    return e.code === 'auth/popup-closed-by-user' ? 'Anulowano.' : authError(e);
  }
  try {
    const batch = F.writeBatch(db);
    batch.delete(F.doc(db, 'saves', user.uid));
    batch.delete(F.doc(db, 'scores', user.uid));
    if (online.nick) batch.delete(F.doc(db, 'nicks', online.nick.toLowerCase()));
    batch.delete(F.doc(db, 'users', user.uid));
    await batch.commit();
    await A.deleteUser(user);
  } catch {
    return 'Nie udało się usunąć konta. Spróbuj ponownie.';
  }
  writeSync({});
  return '';
}

// Wyniki: a finished run's score goes to the leaderboard when the player is signed in with a nick and beat their best
// (the rules take only a higher score, and check it is possible: see firestore.rules). Returns { record, rank } after a
// new best, null otherwise (no account, not better, no connection).
export async function submitScore(run) {
  const score = Math.round(run.score);
  if (online.state !== 'ready' || !online.user || !online.nick || score <= online.best) return null;
  const entry = {
    nick: online.nick, score, kills: run.kills, map: run.map, stage: run.stage, overtimeMs: Math.round(run.overtime ? run.overtimeMs : 0),
    cleared: run.mapCleared, difficulty: run.difficulty, timeMs: Math.round(run.elapsedMs), at: F.serverTimestamp(),
  };
  try {
    await F.setDoc(F.doc(db, 'scores', online.user.uid), entry);
    online.best = score;
    return { record: true, rank: await rankOf(score) };
  } catch {
    return null;
  }
}

// Place of a score: 1 + how many players scored more (a count on the server, not a download of the table).
async function rankOf(score) {
  const q = F.query(F.collection(db, 'scores'), F.where('score', '>', score));
  return (await F.getCountFromServer(q)).data().count + 1;
}

// The top `count` entries, best first, and this player's place (null without a score). Throws without a connection.
export async function fetchLeaderboard(count) {
  if (online.state !== 'ready') throw new Error('offline');
  const snap = await F.getDocs(F.query(F.collection(db, 'scores'), F.orderBy('score', 'desc'), F.limit(count)));
  const rows = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  const mine = online.user && online.best > 0 ? await rankOf(online.best) : null;
  return { rows, mine };
}
