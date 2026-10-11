import { useEffect, useRef, useState } from "react";
function stored(key: string) {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}
export function TableFeedback({
  yourTurn,
  trickId,
}: {
  yourTurn: boolean;
  trickId?: string;
}) {
  const [sound, setSound] = useState(() => stored("sk-sound"));
  const [haptics, setHaptics] = useState(() => stored("sk-haptics"));
  const supportsHaptics = typeof navigator.vibrate === "function";
  const audio = useRef<AudioContext | null>(null);
  const previous = useRef({ yourTurn, trickId });
  function tone() {
    if (!audio.current || audio.current.state !== "running") return;
    const oscillator = audio.current.createOscillator();
    const gain = audio.current.createGain();
    oscillator.connect(gain);
    gain.connect(audio.current.destination);
    oscillator.frequency.value = yourTurn ? 640 : 440;
    gain.gain.setValueAtTime(0.035, audio.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audio.current.currentTime + 0.15,
    );
    oscillator.start();
    oscillator.stop(audio.current.currentTime + 0.15);
  }
  useEffect(() => {
    const changed =
      (yourTurn && !previous.current.yourTurn) ||
      (trickId && trickId !== previous.current.trickId);
    previous.current = { yourTurn, trickId };
    if (changed) {
      if (sound) tone();
      if (haptics && supportsHaptics) navigator.vibrate(40);
    }
  }, [yourTurn, trickId, sound, haptics]);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  function save(key: string, value: boolean) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* Preferences still work for this visit. */
    }
  }
  return (
    <details className="TableHelp">
      <summary>Sound and vibration</summary>
      <p>
        Optional cues for your turn and completed tricks. Your choice stays on
        this device.
      </p>
      <label>
        <input
          type="checkbox"
          checked={sound}
          onChange={async (e) => {
            const enabled = e.target.checked;
            setSound(enabled);
            save("sk-sound", enabled);
            if (enabled && window.AudioContext) {
              audio.current ??= new AudioContext();
              await audio.current.resume();
              tone();
            }
          }}
        />{" "}
        Sound cues
      </label>
      <label>
        <input
          type="checkbox"
          checked={haptics}
          disabled={!supportsHaptics}
          onChange={(e) => {
            setHaptics(e.target.checked);
            save("sk-haptics", e.target.checked);
            if (e.target.checked) navigator.vibrate(40);
          }}
        />{" "}
        Vibration {supportsHaptics ? "" : "(not supported on this device)"}
      </label>
    </details>
  );
}
