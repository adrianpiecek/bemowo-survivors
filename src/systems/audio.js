import { config } from '../config.js';
import { save, writeSave } from '../state.js';

// Sounds from config.audio. A missing file only logs the browser's 404: its key never reaches the cache
// and every play of it is skipped, so the game runs on without that sound.

export function preloadAudio(scene) {
  for (const [key, a] of Object.entries(config.audio.files)) scene.load.audio(key, a.file);
}

// One-shot sound for a game event; config.audio.events maps the event to a file key.
export function playSfx(scene, event) {
  const key = config.audio.events[event] ?? event;
  if (scene.cache.audio.exists(key)) scene.sound.play(key, { volume: config.audio.files[key].volume });
}

// Looping music; started once, it keeps playing across scenes.
export function startMusic(scene) {
  const a = config.audio.files.music;
  if (!scene.cache.audio.exists('music') || scene.sound.get('music')?.isPlaying) return;
  scene.sound.add('music', { loop: true, volume: a.volume }).play();
}

// M key: mute or unmute everything, remembered in the save.
export function toggleMute(game) {
  save.muted = !save.muted;
  game.sound.mute = save.muted;
  writeSave(save);
}
