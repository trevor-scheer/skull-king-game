import { Component, type ReactNode } from 'react';
export class ErrorBoundary extends Component<{children:ReactNode}, {failed:boolean}> {
  state = {failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  render() {
    return this.state.failed ? <main role="alert"><h1>The table needs a refresh</h1><p>Your saved seat will still be here.</p><button onClick={() => location.reload()}>Reload game</button><a href="/">Return to port</a></main> : this.props.children;
  }
}
