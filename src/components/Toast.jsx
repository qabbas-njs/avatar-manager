import React, { useEffect, useState } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)

  const show = (msg, type = 'success') => {
    setToast({ msg, type, id: Date.now() })
  }

  return { toast, show }
}

export default function Toast({ toast }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(t)
  }, [toast?.id])

  if (!toast) return null

  const colors = {
    success: { bg: 'var(--green-bg)', border: 'rgba(62,207,142,0.25)', icon: '✓', color: 'var(--green)' },
    error:   { bg: 'var(--red-bg)',   border: 'rgba(240,107,107,0.25)', icon: '✕', color: 'var(--red)' },
    info:    { bg: 'var(--accent-bg)',border: 'var(--accent-border)',    icon: 'ℹ', color: 'var(--accent)' },
  }
  const c = colors[toast.type] || colors.info

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000,
      background: 'var(--bg2)', border: `1px solid ${c.border}`,
      borderRadius: 'var(--radius-lg)', padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: 'var(--shadow-lg)', minWidth: 240, maxWidth: 360,
      transform: visible ? 'translateY(0)' : 'translateY(80px)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <span style={{
        width: 24, height: 24, borderRadius: '50%',
        background: c.bg, color: c.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 600, flexShrink: 0,
      }}>{c.icon}</span>
      <span style={{ fontSize: 13, color: 'var(--text)' }}>{toast.msg}</span>
    </div>
  )
}
