import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchAvatarById, patchAvatar, uploadMedia, S3_BASE } from '../services/api'

const PROP_FIELDS = [
  { key: 'facial',      label: 'Facial' },
  { key: 'hairs',       label: 'Hairs' },
  { key: 'facialHairs', label: 'Facial Hairs' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'headwear',    label: 'Headwear' },
]

function Field({ label, value, onChange, hint }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={hint || 'ObjectId or empty for null'}
        style={{
          width: '100%', padding: '9px 12px',
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', color: 'var(--text)',
          fontSize: 13, fontFamily: 'var(--mono)', outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

function PropInfo({ prop }) {
  if (!prop) return <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>null</span>
  if (typeof prop === 'string') return <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 12 }}>{prop}</span>
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {prop.image && (
    <img
  src={prop.image.startsWith('http') ? prop.image : S3_BASE + prop.image}
  alt={prop.name}
  style={{
    width: 40,
    height: 40,
    borderRadius: 4,
    objectFit: 'contain', // or 'cover'
    padding: 4, // adds inner spacing
    background: 'var(--text)',
  }}
  onError={e => (e.target.style.display = 'none')}
/>
      )}
      <div>
        <div style={{ fontSize: 12, fontWeight: 500 }}>{prop.name}</div>
        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{prop._id}</div>
      </div>
      <span style={{
        fontSize: 10, padding: '1px 6px', borderRadius: 999, marginLeft: 'auto',
        background: prop.status === 'active' ? 'var(--green-bg)' : 'var(--bg4)',
        color: prop.status === 'active' ? 'var(--green)' : 'var(--text3)',
      }}>{prop.status}</span>
    </div>
  )
}

export default function EditPage({ showToast }) {
  const location = useLocation()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [idInput, setIdInput] = useState('')
  const [avatar, setAvatar] = useState(location.state?.avatar || null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Form state
  const [imageKey, setImageKey] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [props, setProps] = useState({ facial: '', hairs: '', facialHairs: '', accessories: '', headwear: '' })
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    if (avatar) populateForm(avatar)
  }, [avatar])

  function populateForm(av) {
    setImageKey(av.image || '')
    const url = av.image
      ? (av.image.startsWith('http') ? av.image : S3_BASE + av.image)
      : ''
    setPreviewUrl(url)
    setIsDefault(av.isDefault ?? false)
    const p = {}
    PROP_FIELDS.forEach(({ key }) => {
      const val = av[key]
      p[key] = val ? (typeof val === 'object' ? val._id : val) : ''
    })
    setProps(p)
  }

  async function loadById() {
    const id = idInput.trim()
    if (!id) { showToast('Enter an avatar ID', 'error'); return }
    setLoading(true)
    try {
      const av = await fetchAvatarById(id)
      setAvatar(av)
      showToast('Avatar loaded')
    } catch (e) {
      showToast('Not found: ' + (e.response?.data?.message || e.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return }
    setUploading(true)
    // Local preview immediately
    const local = URL.createObjectURL(file)
    setPreviewUrl(local)
    try {
      const keys = await uploadMedia([file])
      if (keys?.length) {
        setImageKey(keys[0])
        showToast('Image uploaded ✓')
      } else {
        showToast('Upload returned no key', 'error')
      }
    } catch (e) {
      showToast('Upload failed: ' + (e.response?.data?.message || e.message), 'error')
      setPreviewUrl(imageKey ? S3_BASE + imageKey : '')
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!avatar) return
    setSaving(true)
    try {
      const payload = {
        id: avatar._id,
        image: imageKey || null,
        isDefault,
        ...Object.fromEntries(
          PROP_FIELDS.map(({ key }) => [key, props[key].trim() || null])
        ),
      }
      const updated = await patchAvatar(payload)
      setAvatar(updated)
      showToast('Saved successfully ✓')
    } catch (e) {
      showToast('Save failed: ' + (e.response?.data?.message || e.message), 'error')
    } finally {
      setSaving(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '6px 12px',
            color: 'var(--text2)', fontSize: 13, cursor: 'pointer',
          }}
        >← Back</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em' }}>Edit Avatar</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>
            {avatar ? avatar.name || avatar._id : 'Load an avatar to begin'}
          </p>
        </div>
      </div>

      {/* ID Loader */}
      {/* <div className="fade-up" style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
        display: 'flex', gap: 10, alignItems: 'center',
        marginBottom: '1.5rem', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Avatar ID</span>
        <input
          value={idInput}
          onChange={e => setIdInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadById()}
          placeholder="Enter MongoDB ObjectId..."
          style={{
            flex: 1, minWidth: 200, padding: '7px 12px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--text)',
            fontSize: 13, fontFamily: 'var(--mono)', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          onClick={loadById}
          disabled={loading}
          style={{
            padding: '7px 16px', background: 'var(--accent)',
            border: 'none', borderRadius: 'var(--radius)',
            color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Loading...' : 'Load →'}
        </button>
      </div> */}

      {!avatar ? (
        <div style={{
          textAlign: 'center', padding: '6rem 2rem',
          color: 'var(--text3)',
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-xl)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>◈</div>
          <p style={{ fontSize: 14 }}>Click an avatar on the dashboard, or enter an ID above</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '1.5rem',
          alignItems: 'start',
        }}
          className="fade-up"
        >
          {/* Left: Form */}
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: '1.5rem',
          }}>
            {/* Image upload */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Avatar Image *
              </label>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border2)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? 'var(--accent-bg)' : 'var(--bg3)',
                  transition: 'all 0.15s',
                  marginBottom: 10,
                }}
              >
                {uploading ? (
                  <div style={{ color: 'var(--text2)' }}>
                    <div style={{ fontSize: 20, animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>↻</div>
                    <p style={{ marginTop: 8, fontSize: 13 }}>Uploading to S3...</p>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>⬆</div>
                    <p style={{ fontSize: 13, color: 'var(--text2)' }}>Drop image here or click to browse</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>PNG, JPG, WEBP</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files[0])}
                />
              </div>

              {/* Or paste URL/key */}
              <input
                value={imageKey}
                onChange={e => {
                  setImageKey(e.target.value)
                  const v = e.target.value
                  setPreviewUrl(v ? (v.startsWith('http') ? v : S3_BASE + v) : '')
                }}
                placeholder="Or paste S3 key / full URL..."
                style={{
                  width: '100%', padding: '8px 12px',
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', color: 'var(--text)',
                  fontSize: 12, fontFamily: 'var(--mono)', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Prop ObjectIds */}
            {/* <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                Prop References (ObjectId)
              </div>
              {PROP_FIELDS.map(({ key, label }) => (
                <Field
                  key={key}
                  label={label}
                  value={props[key]}
                  onChange={v => setProps(p => ({ ...p, [key]: v }))}
                />
              ))}
            </div> */}

            {/* isDefault toggle */}
            {/* <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px', background: 'var(--bg3)',
              borderRadius: 'var(--radius)', marginBottom: '1.5rem',
              cursor: 'pointer',
            }} onClick={() => setIsDefault(v => !v)}>
              <div style={{
                width: 36, height: 20, borderRadius: 999,
                background: isDefault ? 'var(--accent)' : 'var(--bg4)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: isDefault ? 19 : 3,
                  width: 14, height: 14, borderRadius: 999,
                  background: '#fff', transition: 'left 0.2s',
                }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Mark as default avatar</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Only one avatar should be default</div>
              </div>
            </div> */}

            {/* Save button */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={save}
                disabled={saving || uploading}
                style={{
                  flex: 1, padding: '10px', background: 'var(--accent)',
                  border: 'none', borderRadius: 'var(--radius)',
                  color: '#fff', fontSize: 14, fontWeight: 500,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s',
                }}
              >
                {saving ? 'Saving...' : '✓ Save changes'}
              </button>
              <button
                onClick={() => populateForm(avatar)}
                style={{
                  padding: '10px 16px', background: 'var(--bg3)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  color: 'var(--text2)', fontSize: 13, cursor: 'pointer',
                }}
              >Reset</button>
            </div>
          </div>

          {/* Right: Preview panel */}
          <div style={{ position: 'sticky', top: 72 }}>
            {/* Image preview */}
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)', padding: '1.25rem',
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Image Preview
              </div>
              <div style={{
                width: '100%',
                background: 'var(--bg3)', borderRadius: 'var(--radius-lg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', marginBottom: 10,
              }}>
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>◈</div>
                    <p style={{ fontSize: 11 }}>No image yet</p>
                  </div>
                )}
              </div>
              {imageKey && (
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', wordBreak: 'break-all' }}>
                  {imageKey}
                </div>
              )}
            </div>

            {/* Current props from API */}
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)', padding: '1.25rem',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Current Props (from API)
              </div>
              {PROP_FIELDS.map(({ key, label }) => (
                <div key={key} style={{
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
                  <PropInfo prop={avatar[key]} />
                </div>
              ))}
              <div style={{ padding: '8px 0' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Default</div>
                <span style={{
                  fontSize: 12, padding: '2px 8px', borderRadius: 999,
                  background: avatar.isDefault ? 'var(--amber-bg)' : 'var(--bg4)',
                  color: avatar.isDefault ? 'var(--amber)' : 'var(--text3)',
                }}>{avatar.isDefault ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
