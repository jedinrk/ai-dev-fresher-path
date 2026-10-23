async function request(path, options) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
  });

  const body = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(body?.error || 'request failed');
    error.status = res.status;
    throw error;
  }

  return body;
}

export const api = {
  me: () => request('/api/auth/me'),
  register: (data) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  listUsers: () => request('/api/admin/users'),
  resetUser: (email) =>
    request(`/api/admin/users/${encodeURIComponent(email)}`, { method: 'DELETE' }),
};
