import { useEffect, useRef, useState } from "react";
import { tableActivity } from "./tableActivity";
import "./TurnStatus.scss";

export function TurnStatus({
  activity,
}: {
  activity: ReturnType<typeof tableActivity>;
}) {
  const previous = useRef(activity.ownAction ? activity.turnKey : undefined);
  const [arrival, setArrival] = useState<string>();
  useEffect(() => {
    const key = activity.ownAction ? activity.turnKey : undefined;
    const arrived = key && previous.current !== key;
    previous.current = key;
    setArrival(arrived ? key : undefined);
    if (!arrived) return;
    const timer = window.setTimeout(() => setArrival(undefined), 1400);
    return () => window.clearTimeout(timer);
  }, [activity.ownAction, activity.turnKey]);

  return (
    <div
      className={`TurnStatus${activity.ownAction ? " TurnStatus--yours" : ""}${arrival ? " TurnStatus--arriving" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="TurnStatus-marker" aria-hidden="true">
        {activity.ownAction ? "→" : "•"}
      </span>
      <div>
        <strong>{activity.title}</strong>
        <span className="TurnStatus-detail">{activity.detail}</span>
      </div>
    </div>
  );
}
