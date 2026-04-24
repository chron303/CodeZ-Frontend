// frontend/src/utils/config.js
// Single place for all external URLs
// In production set REACT_APP_API_URL to your backend URL (e.g. Railway)

export const API_URL = process.env.REACT_APP_API_URL || '';
// Empty string = use proxy (development)
// In production: set REACT_APP_API_URL=https://your-backend.railway.app