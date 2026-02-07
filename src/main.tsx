import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { logEnvCheck } from './debug/envCheck'

import { PipelineProvider } from './contexts/PipelineContext'

if (import.meta.env.DEV) {
  logEnvCheck();
}


console.log("🚀 Initializing React application...");

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Failed to find the root element");
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <PipelineProvider>
        <App />
      </PipelineProvider>
    </React.StrictMode>,
  )
  console.log("✅ Main render triggered");
} catch (e) {
  console.error("❌ Fatal error during initialization:", e);
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
    <h2>Initialization Error</h2>
    <pre>${e instanceof Error ? e.stack : String(e)}</pre>
  </div>`;
}


