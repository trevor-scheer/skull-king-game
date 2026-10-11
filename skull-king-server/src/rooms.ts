import { Game } from '@skull-king/core';
import { EventEmitter } from 'node:events';
import { mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, openSync, writeFileSync, fsyncSync, closeSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Single-process room repository. Checkpoints contain private hands and credentials. */
export class Rooms {
  readonly games = new Map<string, Game>();
  readonly updates = new EventEmitter();
  readonly saved = new EventEmitter();
  private touched = new Map<string, number>();
  private results = new Map<string, { handId: string; due: number }>();
  constructor(readonly directory: string, private now = Date.now) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    this.updates.setMaxListeners(0);
    for (const file of readdirSync(directory).filter(f => f.endsWith('.room'))) {
      const id = file.slice(0, -5);
      try {
        this.games.set(id, Game.restoreCheckpoint(readFileSync(join(directory, file))));
        this.touched.set(id, statSync(join(directory, file)).mtimeMs);
      } catch {
        // Keep the original checkpoint for recovery instead of silently overwriting it.
        console.error(`Could not restore room ${id}; checkpoint retained.`);
      }
    }
  }

  save(id: string) {
    const game = this.games.get(id);
    if (!game) return;
    if (!/^[a-zA-Z0-9-]+$/.test(id)) throw new Error('Invalid room identifier');
    const destination = join(this.directory, `${id}.room`);
    const temporary = `${destination}.tmp`;
    const fd = openSync(temporary, 'w', 0o600);
    try { writeFileSync(fd, game.checkpoint()); fsyncSync(fd); } finally { closeSync(fd); }
    renameSync(temporary, destination);
    this.touched.set(id, this.now());
    this.updates.emit(id);
    this.saved.emit("saved", id, game);
  }

  tick() {
    for (const [id, game] of this.games) {
      const state = game.getStateForPlayer();
      const round = state.currentRound;
      if (round?.phase === 'trick_result' && !round.pirateAbility && round.lastCompletedHand) {
        const handId = round.lastCompletedHand.id;
        const result = this.results.get(id);
        if (result?.handId !== handId) this.results.set(id, { handId, due: this.now() + 5000 });
        else if (this.now() >= result.due && game.advanceFromTrickResult(handId)) {
          this.results.delete(id);
          this.save(id);
        }
      } else this.results.delete(id);
      const lifetime = state.phase === 'setup' ? 24 * 3600_000 : state.phase === 'postgame' ? 30 * 86400_000 : 7 * 86400_000;
      if (this.now() - (this.touched.get(id) ?? this.now()) > lifetime) {
        this.games.delete(id);
        this.touched.delete(id);
        this.results.delete(id);
        try { unlinkSync(join(this.directory, `${id}.room`)); } catch { /* Already removed. */ }
        this.updates.emit(id);
      }
    }
  }
}
