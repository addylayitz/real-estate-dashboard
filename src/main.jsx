import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'  // 改回使用原來的 App
import './index.css'
import 'antd/dist/reset.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />  {/* 使用原來的 App */}
  </React.StrictMode>,
)