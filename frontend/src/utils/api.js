// Student D — Shared API client
// Wraps fetch to automatically attach the JWT token and handle 401s.
// TODO: Implement token injection and 401 redirect after Cognito is set up

import config from '../config.js';

async function request(path, options = {}) {
  const url = `${config.apiUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // TODO: Attach JWT token from Cognito session
  // const token = getToken();
  // if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers });

  // TODO: Redirect to /login on 401
  // if (response.status === 401) { window.location.href = '/login'; return; }

  return response;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
