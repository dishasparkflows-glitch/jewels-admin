import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initHorizontalScroll } from './utils/horizontalScroll'
import { initDatePickerAutoOpen } from './utils/datePickerAutoOpen'
import { initImageFallback } from './utils/imageFallback'

// Enable global mouse scroll left/right for all horizontally scrollable tables & containers
initHorizontalScroll();

// Enable automatic calendar picker popup when tabbing into or clicking date inputs
initDatePickerAutoOpen();

// Enable universal "No Img" fallback whenever any image fails or is missing across the admin panel
initImageFallback();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
