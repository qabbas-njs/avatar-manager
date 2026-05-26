import React, { useEffect, useState, useCallback } from 'react'
import { fetchAvatars, fetchDashboardStats, fetchAllProps, S3_BASE } from '../services/api'
import AvatarCard from '../components/AvatarCard'

const PROP_TYPES = ['facial', 'hairs', 'facialHairs', 'accessories', 'headwear']

const PROP_LABELS = {
  facial: 'Facial',
  hairs: 'Hairs',
  facialHairs: 'Facial Hairs',
  accessories: 'Accessories',
  headwear: 'Headwear',
}

function StatCard({ label, value, accent, delay }) {
  return (
    <div className={`fade-up fade-up-${delay}`} style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem 1.5rem',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 600, color: accent || 'var(--text)', letterSpacing: '-0.03em' }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

function PropDropdown({ type, options, value, onChange, loading }) {
  const label = PROP_LABELS[type]
  console.log('options for', type, options)
  const selected = options?.props?.find(o => o._id === value)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 150, flex: 1 }}>
      <label style={{
        fontSize: 11, color: 'var(--text3)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '8px 32px 8px 10px',
            background:'var(--bg3)',
            border: `1px solid ${value ? 'var(--accent-border)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            color: value ? 'var(--text)' : 'var(--text3)',
            fontSize: 13,
            cursor: loading ? 'wait' : 'pointer',
            outline: 'none',
            appearance: 'none',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          <option value="">Any {label}</option>
          {options?.props?.map(p => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <option key={p._id} value={p._id}>{p.name}</option>
            </div>
          ))}
        </select>
        {/* Custom chevron */}
        <span style={{
          position: 'absolute', right: 10, top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none', fontSize: 10,
          color: 'var(--text3)',
        }}>▾</span>
      </div>
      {/* Preview thumbnail of selected prop */}
      {selected?.image && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <img
            src={selected.image.startsWith('http') ? selected.image : S3_BASE + selected.image}
            alt={selected.name}
            style={{
              width: 20, height: 20, borderRadius: 4,
              objectFit: 'contain', background: 'var(--text)',
            }}
            onError={e => e.target.style.display = 'none'}
          />
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
            {selected._id.slice(-6)}
          </span>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 999,
            background: selected.status === 'active' ? 'var(--green-bg)' : 'var(--bg4)',
            color: selected.status === 'active' ? 'var(--green)' : 'var(--text3)',
          }}>{selected.status}</span>
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ showToast }) {
  const [avatars, setAvatars] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [propsMap, setPropsMap] = useState({ facial: [], hairs: [], facialHairs: [], accessories: [], headwear: [] })
  const [propsLoading, setPropsLoading] = useState(false)

  // Prop filter selections — stores _id string or ''
  const [propFilters, setPropFilters] = useState({ facial: null, hairs: null, facialHairs: null, accessories: null, headwear: null })

  // Client-side text search (applied after API results)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 48

  // Load props once on mount
  useEffect(() => {
    async function loadProps() {
      setPropsLoading(true)
      try {
        const map = await fetchAllProps()
        console.log('fetched props map', map)
        setPropsMap(map)
      } catch (e) {
        showToast('Failed to load props: ' + (e.response?.data?.message || e.message), 'error')
      } finally {
        setPropsLoading(false)
      }
    }
    loadProps()
  }, [])

  // Fetch avatars — re-runs whenever propFilters change
  const load = useCallback(async (filters = propFilters) => {
    setLoading(true)
    try {
      const [avs, st] = await Promise.all([
        fetchAvatars(filters),
        fetchDashboardStats(),
      ])
      setAvatars(avs)
      setStats(st)
      setPage(1)
    } catch (e) {
      showToast('Failed to load: ' + (e.response?.data?.message || e.message), 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => { load({ facial: null, hairs: null, facialHairs: null, accessories: null, headwear: null }) }, [])

  function handlePropFilter(type, value) {
    const next = { ...propFilters, [type]: value }
    setPropFilters(next)
    load(next)
  }

  function clearAllFilters() {
    const empty = { facial: null, hairs: null, facialHairs: null, accessories: null, headwear: null }
    setPropFilters(empty)
    load(empty)
  }

  const hasActiveFilters = Object.values(propFilters).some(Boolean)

  // Client-side text search on top of API results
  const filtered = avatars.filter(a => {
    const q = search.toLowerCase()
    return !q ||
      (a.name || '').toLowerCase().includes(q) ||
      (a._id || '').toLowerCase().includes(q) ||
      (a.image || '').toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const pending = avatars.filter(a => !a.image).length
  const done = avatars.filter(a => !!a.image).length

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 4 }}>
          Avatar Dashboard
        </h1>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12, marginBottom: '2rem',
      }}>
        <StatCard label="Total Avatars" value={stats.totalCount} accent="var(--text)" delay={1} />
        <StatCard label="Pending" value={stats.pendingAvatarCount ?? "-"} accent="var(--red)" delay={2} />
        <StatCard label="Completed" value={stats.avatarWithImageCount ?? "-"} accent="var(--green)" delay={3} />
        <StatCard
          label="Progress"
          value={stats.totalCount ? ((stats.avatarWithImageCount / stats.totalCount) * 100).toFixed(2) + '%' : '—'}
          accent="var(--accent)"
          delay={4}
        />
      </div>

      {/* Progress bar */}
      {avatars.length > 0 && (
        <div className="fade-up" style={{ marginBottom: '2rem' }}>
          <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(stats.avatarWithImageCount / stats.totalCount) * 100}%`,
              background: 'var(--accent)',
              borderRadius: 999,
              transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
            {stats.avatarWithImageCount} of {stats.totalCount} avatars have images
          </div>
        </div>
      )}

      {/* ── Prop filter dropdowns ── */}
      <div className="fade-up" style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1rem',
        }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Filter by props</span>
            <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>
              — passed as query params to the API
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                style={{
                  fontSize: 12, padding: '4px 12px',
                  background: 'var(--red-bg)', border: '1px solid rgba(240,107,107,0.2)',
                  borderRadius: 'var(--radius)', color: 'var(--red)', cursor: 'pointer',
                }}
              >
                ✕ Clear filters
              </button>
            )}
            <button
              onClick={() => load(propFilters)}
              disabled={loading}
              style={{
                padding: '6px 14px', background: 'var(--bg3)',
                border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
                color: 'var(--text)', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ display: 'inline-block', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {PROP_TYPES.map(type => (
            <PropDropdown
              key={type}
              type={type}
              options={propsMap[type] || []}
              value={propFilters[type]}
              onChange={v => handlePropFilter(type, v)}
              loading={propsLoading}
            />
          ))}
        </div>

        {/* Active filter summary */}
        {hasActiveFilters && (
          <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PROP_TYPES.filter(t => propFilters[t]).map(t => {
              console.log('rendering active filter summary for',propsMap[t])
              const prop = propsMap[t]?.props?.find(p => p._id === propFilters[t])
              return (
                <span key={t} style={{
                  fontSize: 12, padding: '3px 10px',
                  background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                  borderRadius: 999, color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ color: 'var(--text3)' }}>{PROP_LABELS[t]}:</span>
                  {prop?.name || propFilters[t].slice(-6)}
                  <span
                    style={{ cursor: 'pointer', opacity: 0.7 }}
                    onClick={() => handlePropFilter(t, '')}
                  >✕</span>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Search bar */}
      <div className="fade-up" style={{ display: 'flex', gap: 10, marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text3)', fontSize: 13, pointerEvents: 'none',
          }}>⌕</span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search results by name, ID or image..."
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13,
              outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>↻</div>
          <p style={{ marginTop: 12 }}>Loading avatars...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>◈</div>
          <p>No avatars match your filters</p>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {paginated.map((avatar, i) => (
              <AvatarCard key={avatar._id} avatar={avatar} index={i} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '2rem', alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 14px', background: 'var(--bg2)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  color: page === 1 ? 'var(--text3)' : 'var(--text)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13,
                }}
              >← Prev</button>
              <span style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '6px 14px', background: 'var(--bg2)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  color: page === totalPages ? 'var(--text3)' : 'var(--text)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 13,
                }}
              >Next →</button>
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: 11, color: 'var(--text3)' }}>
            Showing {paginated.length} of {filtered.length} avatars
          </div>
        </>
      )}
    </div>
  )
}
