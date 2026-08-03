import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// hydrateRoot, not createRoot: every route ships as real prerendered HTML (scripts/prerender.mjs),
// so React adopts the markup that is already on screen instead of discarding it and re-rendering.
ReactDOM.hydrateRoot(
    document.getElementById('root'),
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
