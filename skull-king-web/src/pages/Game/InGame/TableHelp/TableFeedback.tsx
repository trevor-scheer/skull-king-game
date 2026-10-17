import { useEffect, useRef, useState } from "react";
import { TableAudio } from "./tableAudio";

function stored(key: string) {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}
function save(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* Preferences still work for this visit. */
  }
}

export function TableFeedback({
  yourTurn,
  trickId,
  playedCardEvent,
  roundKey,
}: {
  yourTurn: boolean;
  trickId?: string;
  playedCardEvent?: string;
  roundKey?: string;
}) {
  const [sound, setSound] = useState(() => stored("sk-sound"));
  const [haptics, setHaptics] = useState(() => stored("sk-haptics"));
  const [audioMessage, setAudioMessage] = useState("");
  const supportsHaptics = typeof navigator.vibrate === "function";
  const audio = useRef(new TableAudio());
  const previous = useRef({
    yourTurn,
    trickId,
    playedCardEvent,
    roundKey,
  });

  useEffect(() => {
    const bus = audio.current;
    bus.setEnabled(sound);
    if (!sound) return;
    // A saved preference still needs a fresh trusted gesture after a reload.
    const unlock = (event: Event) => {
      if (event.isTrusted) void bus.unlock();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [sound]);

  useEffect(() => {
    const last = previous.current;
    previous.current = {
      yourTurn,
      trickId,
      playedCardEvent,
      roundKey,
    };
    if (document.visibilityState === "hidden") return;
    const turnStarted = yourTurn && !last.yourTurn;
    const collected = !!trickId && trickId !== last.trickId;
    const played =
      !!playedCardEvent &&
      playedCardEvent !== last.playedCardEvent &&
      roundKey === last.roundKey;
    if (collected) {
      audio.current.cue("collect");
    } else if (played) {
      audio.current.cue("play");
    } else if (turnStarted) {
      audio.current.cue("turn");
    }
    if ((turnStarted || collected) && haptics && supportsHaptics)
      navigator.vibrate(40);
  }, [yourTurn, trickId, playedCardEvent, roundKey, haptics, supportsHaptics]);

  useEffect(() => {
    const bus = audio.current;
    const silenceHiddenTab = () => {
      if (document.visibilityState === "hidden") bus.stop();
    };
    document.addEventListener("visibilitychange", silenceHiddenTab);
    return () => {
      document.removeEventListener("visibilitychange", silenceHiddenTab);
      bus.dispose();
    };
  }, []);

  return (
    <details className="TableHelp">
      <summary>Sound and vibration</summary>
      <p>
        Hear cards land, tricks finish, and your turn begin. Optional sound and
        vibration stay on this device.
      </p>
      <label>
        <input
          type="checkbox"
          checked={sound}
          onChange={async (e) => {
            const enabled = e.target.checked;
            audio.current.setEnabled(enabled);
            setSound(enabled);
            save("sk-sound", enabled);
            setAudioMessage("");
            if (enabled) {
              const ready = await audio.current.unlock();
              if (ready) audio.current.cue("play");
              else
                setAudioMessage(
                  "Audio is unavailable right now. Try turning sound off and on again.",
                );
            }
          }}
        />{" "}
        Sound cues
      </label>
      {audioMessage && <p role="status">{audioMessage}</p>}
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
