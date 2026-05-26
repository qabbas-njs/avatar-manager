import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { S3_BASE } from '../services/api'

const PROP_FIELDS = ['facial', 'hairs', 'facialHairs', 'accessories', 'headwear']

function PropBadge({ label, value }) {
  const has = !!value
  return (
    <span style={{
      fontSize: 10, padding: '2px 7px',
      borderRadius: 999,
      background: has ? 'rgba(124,106,245,0.12)' : 'var(--bg4)',
      color: has ? 'var(--accent)' : 'var(--text3)',
      border: `1px solid ${has ? 'var(--accent-border)' : 'transparent'}`,
      fontFamily: 'var(--mono)',
      letterSpacing: '0.02em',
    }}>
      {label}
    </span>
  )
}

export default function AvatarCard({ avatar, index }) {
  const navigate = useNavigate()
  const [imgErr, setImgErr] = useState(false)

  const imageUrl = avatar.image
    ? (avatar.image.startsWith('http') ? avatar.image : S3_BASE + avatar.image)
    : null

  const populatedCount = PROP_FIELDS.filter(f => !!avatar[f]).length
  const isPopulated = !!avatar.image

  return (
    <div
      onClick={() => navigate('/edit', { state: { avatar } })}
      className="fade-up"
      style={{
        animationDelay: `${Math.min(index * 0.03, 0.4)}s`,
        background: 'var(--bg2)',
        border: `1px solid ${isPopulated ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent-border)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isPopulated ? 'var(--border2)' : 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Image preview */}
      <div style={{
        width: '100%', height: 100,
        background: 'var(--bg3)',
        borderRadius: 'var(--radius)',
        marginBottom: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {imageUrl && !imgErr ? (
          <img
            src={imageUrl}
            alt="avatar"
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 4, opacity: 0.3 }}>◈</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>no image</div>
          </div>
        )}
        {/* Status pill */}
        <div style={{
          position: 'absolute', top: 6, right: 6,
          fontSize: 10, padding: '2px 7px',
          borderRadius: 999,
          background: isPopulated ? 'var(--green-bg)' : 'var(--bg4)',
          color: isPopulated ? 'var(--green)' : 'var(--text3)',
          border: `1px solid ${isPopulated ? 'rgba(62,207,142,0.2)' : 'transparent'}`,
          fontWeight: 500,
        }}>
          {isPopulated ? '● done' : '○ pending'}
        </div>
      </div>

      {/* Name */}
      <div style={{
        fontSize: 11, fontFamily: 'var(--mono)',
        color: 'var(--text2)', marginBottom: 8,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {avatar.name || avatar._id}
      </div>

      {/* Prop badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {PROP_FIELDS.map(f => (
          <PropBadge key={f} label={f.replace('facial', 'f').replace('Hairs', 'H').replace('hairs', 'H').replace('accessories', 'acc').replace('headwear', 'hw')} value={avatar[f]} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 10, color: 'var(--text3)',
          fontFamily: 'var(--mono)',
        }}>
          {populatedCount}/5 props
        </span>
        {avatar.isDefault && (
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 999,
            background: 'var(--amber-bg)', color: 'var(--amber)',
            border: '1px solid rgba(246,166,35,0.2)',
          }}>default</span>
        )}
      </div>
    </div>
  )
}
