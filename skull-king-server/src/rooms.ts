import { Game } from '@skull-king/core';
import { EventEmitter } from 'node:events';
import { mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, openSync, writeFileSync, fsyncSync, closeSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { serialize, deserialize } from 'node:v8';

/** Single-process room repository. Checkpoints contain private hands and credentials. */
export class Rooms {
  readonly games = new Map<string, Game>();
  readonly updates = new EventEmitter();
  readonly saved = new EventEmitter();
  private touched = new Map<string, number>();
  private botActions = new Map<string, number>();
  private unavailable = new Set<string>();
  private results = new Map<string, { handId: string; due: number }>();
  constructor(readonly directory: string, private now = Date.now) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    this.updates.setMaxListeners(0);
    for (const file of readdirSync(directory).filter(f => f.endsWith('.room'))) {
      const id = file.slice(0, -5);
      try {
        const bytes = readFileSync(join(directory, file));
        const saved = deserialize(bytes);
        const envelope = saved?.format === 'skull-king-room';
        if (envelope && (saved.version !== 1 || !Number.isFinite(saved.lastActivity))) throw Error('Unsupported room checkpoint');
        const game = Game.restoreCheckpoint(envelope ? saved.checkpoint : bytes);
        game.resetPresence(this.now());
        this.games.set(id, game);
        this.touched.set(id, envelope ? saved.lastActivity : statSync(join(directory, file)).mtimeMs);
      } catch {
        // Keep the original checkpoint for recovery instead of silently overwriting it.
        console.error(`Could not restore room ${id}; checkpoint retained.`);
      }
    }
  }

  save(id: string, touch = true) {
    if (this.unavailable.has(id)) throw Error('Room storage requires recovery.');
    const game = this.games.get(id);
    if (!game) return;
    if (!/^[a-zA-Z0-9-]+$/.test(id)) throw new Error('Invalid room identifier');
    const lastActivity = touch ? this.now() : this.touched.get(id) ?? this.now();
    const destination = join(this.directory, `${id}.room`);
    const temporary = `${destination}.tmp`;
    let renamed = false;
    try {
      const fd = openSync(temporary, 'w', 0o600);
      try {
        writeFileSync(fd, serialize({ format: 'skull-king-room', version: 1, lastActivity, checkpoint: game.checkpoint() }));
        fsyncSync(fd);
      } finally { closeSync(fd); }
      renameSync(temporary, destination);
      renamed = true;
      const directory = openSync(this.directory, 'r');
      try { fsyncSync(directory); } finally { closeSync(directory); }
    } catch (error) {
      try { unlinkSync(temporary); } catch { /* No temporary file remains. */ }
      // A failed directory flush after rename has an uncertain durable outcome.
      // Stop serving that room until restart instead of accepting another move.
      if (renamed) { this.unavailable.add(id); this.games.delete(id); }
      throw error;
    }
    this.touched.set(id, lastActivity);
    try { this.updates.emit(id); } catch { console.error(`Room update delivery failed for ${id}.`); }
    try { this.saved.emit("saved", id, game); } catch { console.error(`Room history update failed for ${id}; checkpoint retained for replay.`); }
  }

  /** Actions stay synchronous so another request cannot observe an unsaved move. */
  mutate<T>(id: string | undefined, work: () => T): T {
    const before = id ? this.games.get(id)?.checkpoint() : undefined;
    const existing = new Set([...this.games.keys(), ...this.unavailable]);
    try {
      const result = work();
      for (const created of this.games.keys()) if (!existing.has(created)) this.save(created);
      const after = id ? this.games.get(id)?.checkpoint() : undefined;
      if (id && after && (!before || !before.equals(after))) this.save(id);
      return result;
    } catch (error) {
      if (id && before && !this.unavailable.has(id)) this.games.set(id, Game.restoreCheckpoint(before));
      for (const created of new Set([...this.games.keys(), ...this.unavailable])) if (!existing.has(created)) {
        this.games.delete(created); this.touched.delete(created);
        try { unlinkSync(join(this.directory, `${created}.room`)); } catch { /* No committed room exists. */ }
      }
      throw error;
    }
  }

  tick() {
    for (const [id, game] of this.games) {
      if (this.now() - (this.botActions.get(id) ?? 0) >= 750 && this.mutate(id, () => game.stepAutoplay())) {
        this.botActions.set(id, this.now());
      }
      const state = game.getStateForPlayer();
      const round = state.currentRound;
      if (round?.phase === 'trick_result' && !round.pirateAbility && round.lastCompletedHand) {
        const handId = round.lastCompletedHand.id;
        const result = this.results.get(id);
        if (result?.handId !== handId) this.results.set(id, { handId, due: this.now() + 5000 });
        else if (this.now() >= result.due && this.mutate(id, () => game.advanceFromTrickResult(handId))) {
          this.results.delete(id);
        }
      } else this.results.delete(id);
      const lifetime = state.phase === 'setup' ? 24 * 3600_000 : state.phase === 'postgame' ? 30 * 86400_000 : 7 * 86400_000;
      if (this.now() - (this.touched.get(id) ?? this.now()) > lifetime) {
        try { unlinkSync(join(this.directory, `${id}.room`)); } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') { console.error(`Could not expire room ${id}; checkpoint retained.`); continue; }
        }
        this.games.delete(id);
        this.touched.delete(id);
        this.results.delete(id);
        this.botActions.delete(id);
        this.updates.emit(id);
        this.saved.emit("expired", id);
      }
    }
  }
}
