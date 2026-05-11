// frontend/src/hooks/useKeepalive.js
//
// Pings the Railway backend every 14 minutes to prevent free-tier cold starts.
// Railway's free tier sleeps after 10 minutes of inactivity — this keeps it warm.
// The ping is silent — failures are ignored since it's best-effort only.

import { useEffect } from 'react';
import { API_URL } from '../utils/config.js';

export default function useKeepalive() {
  useEffect(function() {
    function ping() {
      fetch((API_URL || '') + '/api/health').catch(function() {});
    }

    // Ping immediately on mount, then every 14 minutes
    ping();
    var id = setInterval(ping, 14 * 60 * 1000);
    return function() { clearInterval(id); };
  }, []);
}