// Timed effects on run.player, kept in run.effects. Time counts only while GameScene runs, so pauses do not eat it.
// An effect def is { id, durationMs, apply(player) }: apply changes stats the same way upgrades do.

// Starts the effect, or only refreshes its time when it is already active (strength never stacks).
export function addEffect(run, def) {
  const active = run.effects[def.id];
  if (active) {
    active.remainingMs = def.durationMs;
    return;
  }
  const pl = run.player, before = { ...pl };
  def.apply(pl);
  const changed = {};
  for (const k of Object.keys(pl)) if (pl[k] !== before[k]) changed[k] = { before: before[k], after: pl[k] };
  run.effects[def.id] = { remainingMs: def.durationMs, durationMs: def.durationMs, changed };
}

// Counts effects down; returns the ids that ended this frame.
export function updateEffects(run, delta) {
  const ended = [];
  for (const [id, e] of Object.entries(run.effects)) {
    e.remainingMs -= delta;
    if (e.remainingMs > 0) continue;
    const pl = run.player;
    for (const [k, { before, after }] of Object.entries(e.changed)) {
      // Untouched since the effect: restore the exact old value. Changed by an upgrade meanwhile: take back only the effect's part.
      pl[k] = pl[k] === after ? before : pl[k] - (after - before);
    }
    delete run.effects[id];
    ended.push(id);
  }
  return ended;
}

export function isEffectActive(run, id) {
  return id in run.effects;
}
