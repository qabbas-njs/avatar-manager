import axios from 'axios'

// ─── Config ───────────────────────────────────────────────────────────────────
export const BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  'https://z4sgbc3v-4017.inc1.devtunnels.ms/api/v1'

export const S3_BASE = 'https://mindzen-bucket.s3.us-east-2.amazonaws.com/'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  },
})

// ─── Avatars ──────────────────────────────────────────────────────────────────

/**
 * GET /avatars/fetch-avatars
 * Supports optional filters: facial, hairs, facialHairs, accessories, headwear
 */
export const fetchAvatars = async (filters = {}) => {
  const params = {
    facial: filters.facial ?? '',
    hairs: filters.hairs ?? '',
    facialHairs: filters.facialHairs ?? '',
    accessories: filters.accessories ?? '',
    headwear: filters.headwear ?? '',
  }
  const res = await api.get('/avatars/fetch-avatars', { params })
  return res.data?.data ?? []
}

/**
 * GET /avatars/dashboard
 * Returns { nullAvatarCount, populatedAvatarCount }
 */
export const fetchDashboardStats = async () => {
  const res = await api.get('/avatars/dashboard')
  return res.data?.data ?? {}
}

/**
 * GET /avatars/:id  — single avatar
 */
export const fetchAvatarById = async (id) => {
  const res = await api.get(`/avatars/${id}`)
  return res.data?.data ?? res.data
}

/**
 * PATCH /avatars/:id — update avatar fields + image key
 */
export const patchAvatar = async (payload) => {
  const res = await api.patch(`/avatars/update-avatar-image`, payload)
  return res.data?.data ?? res.data
}

// ─── Props ────────────────────────────────────────────────────────────────────

export const PROP_TYPES = ['facial', 'hairs', 'facialHairs', 'accessories', 'headwear']

/**
 * GET /props/all-new?type=facial  (pass empty string for all)
 * Returns array of prop objects { _id, name, image, type, status }
 */
export const fetchPropsByType = async (type = '') => {
  const res = await api.get('/props/all-new', { params: { type } })
  return res.data?.data ?? []
}

/**
 * Fetch all prop types in parallel → returns map { facial: [], hairs: [], ... }
 */
export const fetchAllProps = async () => {
  const results = await Promise.all(PROP_TYPES.map(t => fetchPropsByType(t)))
  return Object.fromEntries(PROP_TYPES.map((t, i) => [t, results[i]]))
}

// ─── S3 signed-URL upload ─────────────────────────────────────────────────────

/**
 * Get pre-signed PUT URLs for a list of files
 */
export const getSignedUrls = async (files) => {
  const params = {
    files: files.map((f) => ({
      mimeType: f.name.split('.').pop(),
      name: f.name,
    })),
  }
  const res = await api.post('/get-signed-url', params)
  return res.data?.data ?? res.data   // { urls: [], keys: [] }
}

/**
 * PUT each file to its pre-signed S3 URL
 */
export const uploadFilesToS3 = async (urls, files) => {
  const promises = urls.map((url, i) => {
    const ext = files[i].name.split('.').pop()
    return axios.put(url, files[i], {
      headers: {
        'Content-Type': ext === 'pdf' ? 'application/pdf' : `image/${ext}`,
        'ngrok-skip-browser-warning': '69420',
      },
    })
  })
  return Promise.allSettled(promises)
}

/**
 * Full upload flow → returns S3 keys[]
 */
export const uploadMedia = async (selectedFiles) => {
  if (!selectedFiles?.length) return []
  const { urls, keys } = await getSignedUrls(selectedFiles)
  if (urls?.length) await uploadFilesToS3(urls, selectedFiles)
  return keys
}
