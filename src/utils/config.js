// frontend/src/utils/config.js
// Single place for all external URLs.
//
// Vite uses import.meta.env (NOT process.env like Create React App).
// Env vars must be prefixed with VITE_ to be exposed to the browser.
//
// Local dev:  set VITE_API_URL in frontend/.env.local → http://localhost:4000
// Production: set VITE_API_URL in Vercel dashboard  → https://your-backend.railway.app
//
// If VITE_API_URL is not set, falls back to '' which means
// requests go to the same origin (only works in dev with a proxy).

export const API_URL = import.meta.env.VITE_API_URL || '';