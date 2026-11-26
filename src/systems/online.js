import { config } from '../config.js';
import { firebaseConfig } from '../firebaseConfig.js';
import { save, onSaveWrite, progressOf, replaceProgress } from '../state.js';

// Konto (Firebase): Google sign-in, a unique nick and the progress in the cloud. The SDK comes from Google's CDN
// (config.online.sdk) after the game starts, so the game never waits for it and plays on without it (offline, blocked,
// CDN down): every call here fails softly and says so in `online`.
// Firestore (rules in firestore.rules):
//   users/{uid}   { nick, createdAt, updatedAt }   readable only by its owner
//   nicks/{lower} { uid, nick }                    one per nick, so a nick is unique whatever its letter case
//   saves/{uid}   { data, updatedAt }              the progress (state.js progressOf), only its owner's
// online.state: 'off' | 'loading' | 'ready' | 'error'; online.sync: 'none' | 'syncing' | 'synced' | 'conflict' | 'error'.
// online.revision goes up when a save from the cloud replaced the progress here (MenuScene redraws).
export const online = { state: 'off', user: null, nick: null, sync: 'none', conflict: null, error: '', revision: 0 };

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
    A.getRedirectResult(auth).catch(() => {}); // back from the redirect sign-in (popup blocked): onAuthStateChanged takes it
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
  Object.assign(online, { user, nick: null, sync: 'none', conflict: null });
  changed();
  if (!user) return;
  try {
    const profile = await F.getDoc(F.doc(db, 'users', user.uid));
    online.nick = profile.exists() ? profile.data().nick : null;
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

// '' on success (or the player closed the Google window), else what went wrong.
export async function signIn() {
  if (online.state !== 'ready') return 'Brak połączenia z serwerem.';
  const provider = new A.GoogleAuthProvider();
  try {
    await A.signInWithPopup(auth, provider);
  } catch (e) {
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return '';
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
      await A.signInWithRedirect(auth, provider); // leaves the page and comes back signed in
      return '';
    }
    return 'Nie udało się zalogować. Spróbuj ponownie.';
  }
  return '';
}

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
  const userRef = F.doc(db, 'users', uid), nickRef = F.doc(db, 'nicks', nick.toLowerCase());
  try {
    await F.runTransaction(db, async (t) => {
      const user = await t.get(userRef), taken = await t.get(nickRef);
      if (taken.exists() && taken.data().uid !== uid) throw new Error('taken');
      const old = user.exists() ? user.data().nick : null;
      if (old && old.toLowerCase() !== nick.toLowerCase()) t.delete(F.doc(db, 'nicks', old.toLowerCase()));
      t.set(nickRef, { uid, nick });
      t.set(userRef, { nick, updatedAt: F.serverTimestamp(), ...(user.exists() ? {} : { createdAt: F.serverTimestamp() }) }, { merge: true });
    });
  } catch (e) {
    return e.message === 'taken' ? 'Ten nick jest już zajęty.' : 'Nie udało się zapisać nicku. Sprawdź połączenie.';
  }
  online.nick = nick;
  changed();
  return '';
}

// The account, its nick and its cloud save, gone for good; the progress on this device stays. Google asks to sign in
// again first (deleting an account needs a fresh sign-in). '' or the error.
export async function deleteAccount() {
  const user = online.user;
  if (!user) return '';
  try {
    await A.reauthenticateWithPopup(user, new A.GoogleAuthProvider());
  } catch (e) {
    return e.code === 'auth/popup-closed-by-user' ? 'Anulowano.' : 'Nie udało się potwierdzić konta.';
  }
  try {
    const batch = F.writeBatch(db);
    batch.delete(F.doc(db, 'saves', user.uid));
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
