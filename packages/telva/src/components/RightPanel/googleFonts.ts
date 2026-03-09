/** Shape of a single item returned by the Google Fonts Developer API v1 */
export interface GoogleFont {
  family: string
  variants: string[]
  subsets: string[]
  version: string
  lastModified: string
  files: Record<string, string>
  category: string
  kind: string
  menu: string
}

let _apiKey = ''
let cachedFonts: GoogleFont[] = []
let fontsPromise: Promise<GoogleFont[]> | null = null

/**
 * Set the Google Fonts Developer API key.
 * Call this from your top-level component before the font picker is opened.
 * Resets the cache so the next fetch uses the new key.
 */
export function setGoogleFontsApiKey(key: string): void {
  const cleaned = key.replace(/["']/g, '').trim()
  if (cleaned === _apiKey) return
  _apiKey = cleaned
  // Reset cache so next fetchGoogleFonts() uses the new key
  cachedFonts = []
  fontsPromise = null
}

/**
 * Fetches the full list of Google Fonts sorted by popularity.
 * Results are cached; subsequent calls return the same promise.
 * https://www.googleapis.com/webfonts/v1/webfonts?key=API_KEY&sort=popularity
 */
export async function fetchGoogleFonts(): Promise<GoogleFont[]> {
  if (cachedFonts.length > 0) return cachedFonts
  if (fontsPromise) return fontsPromise

  fontsPromise = (async () => {
    try {
      if (!_apiKey) {
        console.warn(
          '[Google Fonts] No API key provided. Pass googleFontsApiKey to the <Telva> component.'
        )
        return []
      }
      const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${_apiKey}&sort=popularity`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const data: { kind: string; items: GoogleFont[] } = await res.json()
      cachedFonts = data.items ?? []
    } catch (e) {
      console.error('[Google Fonts] Failed to fetch font list', e)
      cachedFonts = []
    }
    return cachedFonts
  })()

  return fontsPromise
}

/**
 * Search cached fonts by family name, optionally filtering by category.
 * Category values: serif | sans-serif | monospace | display | handwriting
 */
export function searchGoogleFonts(query: string, category?: string): GoogleFont[] {
  let list = cachedFonts
  if (category) list = list.filter((f) => f.category === category)
  if (!query) return list.slice(0, 100)
  const q = query.toLowerCase()
  return list.filter((f) => f.family.toLowerCase().includes(q)).slice(0, 100)
}

/** Returns the unique font categories available from the cached list */
export function getGoogleFontCategories(): string[] {
  return Array.from(new Set(cachedFonts.map((f) => f.category))).filter(Boolean)
}

const STORAGE_KEY = 'telva-loaded-google-fonts'

function getPersistedFonts(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function persistFont(family: string): void {
  try {
    const existing = getPersistedFonts()
    if (!existing.includes(family)) {
      existing.push(family)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    }
  } catch {
    // localStorage unavailable (e.g. SSR or private mode)
  }
}

/**
 * Injects a <link> into <head> to load a Google Font via the CSS API.
 * The loaded family is persisted to localStorage so it is restored on reload.
 * https://fonts.googleapis.com/css2?family=Family+Name:wght@400;700&display=swap
 */
export function loadGoogleFont(family: string, variants?: string[]): void {
  const id = `gfont-${family.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return

  const familyParam = family.replace(/\s+/g, '+')

  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  // Use v1 API which safely handles default and multiple weights without strict axis validations
  link.href = `https://fonts.googleapis.com/css?family=${familyParam}:400,400i,700,700i&display=swap`
  document.head.appendChild(link)

  persistFont(family)
}

/** Restores all previously loaded Google Fonts from localStorage */
function restorePersistedFonts(): void {
  if (typeof window === 'undefined') return
  getPersistedFonts().forEach((family) => loadGoogleFont(family))
}

// Pre‑fetch in browser environments once a key has been set, and restore persisted fonts
export function initGoogleFonts(): void {
  restorePersistedFonts()
  if (typeof window !== 'undefined' && _apiKey) fetchGoogleFonts()
}
