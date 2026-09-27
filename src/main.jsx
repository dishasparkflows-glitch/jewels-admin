import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initHorizontalScroll } from './utils/horizontalScroll'

// Enable global mouse scroll left/right for all horizontally scrollable tables & containers
initHorizontalScroll();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
