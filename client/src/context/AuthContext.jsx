import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('civicfix_user') || 'null'));
  const [loading, setLoading] = useState(!!localStorage.getItem('civicfix_token'));
  useEffect(() => {
    if (!localStorage.getItem('civicfix_token')) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('civicfix_user', JSON.stringify(data.user));
      })
      .catch(error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('civicfix_token');
          localStorage.removeItem('civicfix_user');
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);
  const authenticate = async (path, values) => { const { data } = await api.post(`/auth/${path}`, values); localStorage.setItem('civicfix_token', data.token); localStorage.setItem('civicfix_user', JSON.stringify(data.user)); setUser(data.user); return data.user; };
  const logout = async () => { try { await api.post('/auth/logout'); } finally { localStorage.removeItem('civicfix_token'); localStorage.removeItem('civicfix_user'); setUser(null); } };
  const continueAsViewer = async () => {
    try {
      const { data } = await api.post('/auth/login', {
        email: 'viewer@civicfix.test',
        password: 'CivicFix123',
        role: 'viewer'
      });
      localStorage.setItem('civicfix_token', data.token);
      localStorage.setItem('civicfix_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch {
      const guest = { role: 'viewer', name: 'Community Viewer' };
      setUser(guest);
      return guest;
    }
  };
  return <AuthContext.Provider value={{ user, loading, login: v => authenticate('login', v), register: v => authenticate('register', v), logout, continueAsViewer }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
