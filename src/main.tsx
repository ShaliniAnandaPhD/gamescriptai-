import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { logEnvCheck } from './debug/envCheck'

if (import.meta.env.DEV) {
  logEnvCheck();
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


