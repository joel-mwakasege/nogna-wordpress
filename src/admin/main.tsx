import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

class NognaErrorBoundary extends Component<{children:React.ReactNode},{error:Error|null}> {
  state={error:null as Error|null};
  static getDerivedStateFromError(error:Error){return {error};}
  render(){if(this.state.error)return <div className="nogna-load-error"><h1>Nogna could not load</h1><p>The dashboard interface failed to start.</p><button onClick={()=>window.location.reload()}>Reload dashboard</button></div>;return this.props.children;}
}

const mount = document.getElementById('nogna-react-root');
if (mount) createRoot(mount).render(<NognaErrorBoundary><React.StrictMode><App /></React.StrictMode></NognaErrorBoundary>);
