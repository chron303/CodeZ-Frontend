// frontend/src/utils/api.js

var BASE = (import.meta.env.VITE_API_URL || '') + '/api';

// ── Authenticated fetch ────────────────────────────────────────
// Attaches Firebase ID token to Authorization header.
// Use this for all sensitive endpoints (AI, mock, mock reports).
// uid no longer needs to be sent in the body — backend extracts it from the token.
export async function authFetch(path, options) {
  // Lazy import avoids circular dependency issues
  var { auth } = await import('../firebase.js');
  var token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

  var method = (options && options.method) || 'GET';
  var isGet  = method.toUpperCase() === 'GET';

  var res = await fetch(BASE + path, {
    ...options,
    headers: {
      // Only set Content-Type for requests with a body — GET requests with
      // Content-Type trigger a CORS preflight which can fail on Railway.
      ...(!isGet && { 'Content-Type': 'application/json' }),
      ...(options && options.headers),
      'Authorization': 'Bearer ' + token,
    },
  });

  var data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed (' + res.status + ')');
  return data;
}

// ── Upload CSV/Excel file → { topics, stats } ──────────────────
export function uploadFile(file, onProgress) {
  var form = new FormData();
  form.append('file', file);

  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        var err = {};
        try { err = JSON.parse(xhr.responseText); } catch(e) {}
        reject(new Error(err.error || ('Upload failed (' + xhr.status + ')')));
      }
    });

    xhr.addEventListener('error', function() {
      reject(new Error('Network error. Is the backend running?'));
    });

    xhr.open('POST', BASE + '/upload/csv');
    xhr.send(form);
  });
}

// ── Run code against test cases ────────────────────────────────
// language: 'python' | 'cpp' | 'java'
// Returns { results, passed, total, verdict, allPassed }
export function runCode(language, code, testCases) {
  return fetch(BASE + '/judge/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, code, testCases }),
  }).then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) throw new Error(data.error || ('Judge error (' + res.status + ')'));
      return data;
    });
  });
}

// ── Fetch LeetCode user stats via backend proxy ────────────────
export function fetchLeetCode(username) {
  return fetch(BASE + '/leetcode/' + encodeURIComponent(username.trim()))
    .then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok) throw new Error(data.error || ('LeetCode fetch failed (' + res.status + ')'));
        return data;
      });
    });
}