import React from 'react'
import { NavLink } from 'react-router-dom'

const navStyle = {
  position: 'sticky', top: 0, zIndex: 100,
  background: 'rgba(15,15,17,0.85)',
  backdropFilter: 'blur(12px)',
  borderBottom: '1px solid var(--border)',
  display: 'flex', alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 2rem', height: 56,
}

export default function Navbar() {
  return (
    <nav style={navStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'var(--accent)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}>◈</div>
        <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.02em' }}>
          Avatar Manager
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { to: '/', label: 'Dashboard', icon: '▦' },
          { to: '/edit', label: 'Edit Avatar', icon: '✎' },
        ].map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 'var(--radius)',
            fontSize: 13, fontWeight: 500,
            textDecoration: 'none',
            background: isActive ? 'var(--bg3)' : 'transparent',
            color: isActive ? 'var(--text)' : 'var(--text2)',
            border: isActive ? '1px solid var(--border2)' : '1px solid transparent',
            transition: 'all 0.15s',
          })}>
            <span style={{ fontSize: 11 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
