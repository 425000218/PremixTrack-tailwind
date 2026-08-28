export const getAuthToken = () => {
  try {
    const stored = localStorage.getItem('premixtrack_user');
    if (!stored) return null;
    const user = JSON.parse(stored);
    return user.token || null;
  } catch (e) {
    return null;
  }
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
};
