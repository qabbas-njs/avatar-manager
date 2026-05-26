import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Toast, { useToast } from './components/Toast'
import Dashboard from './pages/Dashboard'
import EditPage from './pages/EditPage'

export default function App() {
  const { toast, show: showToast } = useToast()

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard showToast={showToast} />} />
            <Route path="/edit" element={<EditPage showToast={showToast} />} />
          </Routes>
        </main>
        <Toast toast={toast} />
      </div>
    </BrowserRouter>
  )
}
