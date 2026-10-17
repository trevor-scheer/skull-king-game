import { useEffect, useState } from "react";
import "./BidRitual.scss";

export function BidRitual({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [endsAt]);
  const remaining = Math.max(0, endsAt - now);
  const elapsed = 4500 - remaining;
  const beat = elapsed >= 1770 ? 2 : elapsed >= 940 ? 1 : 0;
  return (
    <div
      className="BidRitual"
      role="status"
      aria-label="Bids locked. The crew is chanting before the reveal."
    >
      <p className="BidRitual-eyebrow">All bids are locked</p>
      <p className="BidRitual-chant" aria-hidden="true">
        {["Yo ho,", "yo ho,", "a pirate’s life for me!"].map((line, index) => (
          <span
            key={line}
            className={index <= beat ? "BidRitual-word--spoken" : ""}
          >
            {line}{" "}
          </span>
        ))}
      </p>
      <div className="BidRitual-beats" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={index === beat ? "BidRitual-beat--active" : ""}
          >
            ✦
          </span>
        ))}
      </div>
      <p className="BidRitual-caption">
        {remaining > 0 ? "Ready to throw your bids…" : "Throw your bids!"}
      </p>
    </div>
  );
}
