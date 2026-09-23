import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from '@/i18n'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>
)

function canHydrate(): boolean {
  if (!root.hasChildNodes()) return false
  try {
    const storedLocale = localStorage.getItem('awesome-jev-locale')
    if (storedLocale === 'zh' ||
      (storedLocale !== 'en' && /^zh\b/i.test(navigator.language))) return false
    const defaults = {
      'awesome-jev-github-sort': 'stars',
      'awesome-jev-github-view': 'cards',
      'awesome-jev-x-sort': 'date',
      'awesome-jev-youtube-sort': 'date',
      'awesome-jev-zone': 'github',
    }
    return Object.entries(defaults).every(([key, value]) => {
      const stored = localStorage.getItem(key)
      return stored === null || stored === value
    })
  } catch {
    return false
  }
}

if (canHydrate()) hydrateRoot(root, app)
else createRoot(root).render(app)
