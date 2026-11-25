const TOKEN_KEY = 'qr_admin_token';

export const getAdminToken = () => localStorage.getItem(TOKEN_KEY) || '';

export const setAdminToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export const adminAuthHeaders = () => {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
