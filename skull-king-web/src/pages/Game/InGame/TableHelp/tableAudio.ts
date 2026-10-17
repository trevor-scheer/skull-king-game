/** A single opt-in audio bus, unlocked by a gesture and silenced immediately on mute. */
export class TableAudio {
  private context: AudioContext | null = null;
  private enabled = false;
  private sources = new Set<AudioScheduledSourceNode>();

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  async unlock(): Promise<boolean> {
    if (!this.enabled || !window.AudioContext) return false;
    try {
      this.context ??= new AudioContext();
      await this.context.resume();
      if (!this.enabled) return false;
      return this.context.state === "running";
    } catch {
      return false;
    }
  }

  cue(kind: "turn" | "play" | "collect") {
    const context = this.context;
    if (!this.enabled || context?.state !== "running") return;
    const now = context.currentTime;
    const duration = kind === "collect" ? 0.3 : 0.16;
    if (kind !== "turn") {
      const noise = context.createBuffer(
        1,
        Math.ceil(context.sampleRate * duration),
        context.sampleRate,
      );
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++)
        samples[i] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      source.buffer = noise;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(500, now + duration);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.055, now + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      source.connect(filter).connect(gain).connect(context.destination);
      this.track(source, filter, gain);
      source.start();
      source.stop(now + duration);
    }
    const tap = context.createOscillator();
    const gain = context.createGain();
    const start = now + (kind === "turn" ? 0 : duration - 0.04);
    tap.frequency.setValueAtTime(kind === "turn" ? 520 : 150, start);
    tap.frequency.exponentialRampToValueAtTime(
      kind === "turn" ? 390 : 65,
      start + 0.09,
    );
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.setValueAtTime(kind === "turn" ? 0.025 : 0.055, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
    tap.connect(gain).connect(context.destination);
    this.track(tap, gain);
    tap.start(start);
    tap.stop(start + 0.1);
  }

  private track(source: AudioScheduledSourceNode, ...nodes: AudioNode[]) {
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      source.disconnect();
      nodes.forEach((node) => node.disconnect());
    };
  }

  stop() {
    for (const source of this.sources) source.stop();
    this.sources.clear();
  }

  dispose() {
    this.setEnabled(false);
    void this.context?.close().catch(() => {});
    this.context = null;
  }
}
