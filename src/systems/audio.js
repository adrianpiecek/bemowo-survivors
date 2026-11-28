import { config } from '../config.js';
import { save, writeSave } from '../state.js';

// Sounds from config.audio. A missing file only logs the browser's 404: its key never reaches the cache
// and every play of it is skipped, so the game runs on without that sound.

export function preloadAudio(scene) {
  for (const [key, a] of Object.entries(config.audio.files)) scene.load.audio(key, a.file);
}

const lastPlayedMs = new Map();

// One-shot sound for a game event; config.audio.events maps the event to a file key.
export function playSfx(scene, event) {
  const key = config.audio.events[event] ?? event, a = config.audio.files[key];
  if (!scene.cache.audio.exists(key)) return;
  const now = performance.now(); // real time: the gap is about what the ear hears
  if (a.minGapMs && now - (lastPlayedMs.get(key) ?? -Infinity) < a.minGapMs) return;
  lastPlayedMs.set(key, now);
  scene.sound.play(key, { volume: a.volume * config.audio.sfxVolume * save.sfxVolume });
}

let music = null; // { name, sounds } of the track playing now

// Switches to a track from config.audio.music; the same track keeps playing. The loop is scheduled
// (WebAudio delay) for the exact moment the intro ends, so the two join without a gap.
export function playMusic(scene, name) {
  if (music?.name === name) return;
  stopMusic();
  const track = config.audio.music[name], files = config.audio.files, sounds = [];
  let delay = 0;
  if (track.intro && scene.cache.audio.exists(track.intro)) {
    const intro = scene.sound.add(track.intro, { volume: files[track.intro].volume * save.musicVolume });
    intro.baseVolume = files[track.intro].volume;
    intro.play();
    sounds.push(intro);
    delay = intro.duration;
  }
  if (scene.cache.audio.exists(track.loop)) {
    const loop = scene.sound.add(track.loop, { loop: true, volume: files[track.loop].volume * save.musicVolume });
    loop.baseVolume = files[track.loop].volume;
    loop.play({ delay });
    sounds.push(loop);
  }
  music = { name, sounds };
}

export function stopMusic() {
  music?.sounds.forEach((s) => s.destroy());
  music = null;
}

// Settings screen: 'musicVolume' or 'sfxVolume' (0..1) times each file's own volume (sound effects also times
// config.audio.sfxVolume), remembered in the save.
// The music playing now follows at once; sound effects take it from their next play.
export function setVolume(kind, value) {
  save[kind] = Phaser.Math.Clamp(Math.round(value * 10) / 10, 0, 1); // whole tens of percent: no 0.30000000004
  writeSave(save);
  if (kind === 'musicVolume') music?.sounds.forEach((s) => { s.volume = s.baseVolume * save.musicVolume; });
}

// The pause: sound effects still playing stop where they are and go on from there when the run resumes; the music plays on.
let pausedSfx = [];
export function pauseSfx(scene) {
  const tracks = music?.sounds ?? [];
  pausedSfx = scene.sound.getAllPlaying().filter((s) => !tracks.includes(s));
  pausedSfx.forEach((s) => s.pause());
}
export function resumeSfx() {
  pausedSfx.forEach((s) => s.resume());
  pausedSfx = [];
}

// M key: mute or unmute everything, remembered in the save.
export function toggleMute(game) {
  save.muted = !save.muted;
  game.sound.mute = save.muted;
  writeSave(save);
}
