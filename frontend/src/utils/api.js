// Student D — Shared API client
// Wraps fetch to automatically attach the JWT token and handle 401s.

import config from '../config.js';
import { fetchAuthSession } from 'aws-amplify/auth';

async function request(path, options = {}) {
  const url = `${config.apiUrl}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken?.toString();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {
    // Not signed in — let the request go through; API will return 401/403
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    window.location.href = '/';
    return response;
  }

  return response;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
