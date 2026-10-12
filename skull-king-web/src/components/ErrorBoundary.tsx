import { Component, type ReactNode } from "react";
import { Crest } from "./Crest";

export function RecoveryPage() {
  return (
    <main className="RecoveryPage" role="alert">
      <Crest />
      <p className="RecoveryPage-eyebrow">Back on course</p>
      <h1>The table needs a refresh</h1>
      <p>
        This page couldn’t load. Reload to reconnect. Your saved seat stays on
        this device.
      </p>
      <div>
        <button onClick={() => location.reload()}>Reload game</button>
        <a href="/">Return to port</a>
      </div>
    </main>
  );
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <RecoveryPage /> : this.props.children;
  }
}
