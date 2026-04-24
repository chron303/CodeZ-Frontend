// frontend/src/utils/api.js

var BASE = (process.env.REACT_APP_API_URL || '') + '/api';

// Upload CSV/Excel file → { topics, stats }
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

// Run code against test cases
// language: 'python' | 'cpp' | 'java'
// Returns { results, passed, total, verdict, allPassed }
export function runCode(language, code, testCases) {
  return fetch(BASE + '/judge/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: language, code: code, testCases: testCases }),
  }).then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) throw new Error(data.error || ('Judge error (' + res.status + ')'));
      return data;
    });
  });
}

// Fetch LeetCode user stats via backend proxy
export function fetchLeetCode(username) {
  return fetch(BASE + '/leetcode/' + encodeURIComponent(username.trim()))
    .then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok) throw new Error(data.error || ('LeetCode fetch failed (' + res.status + ')'));
        return data;
      });
    });
}