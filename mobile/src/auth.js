import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { startLive, stopLive } from './live';
import { loadToken, saveToken, setUnauthorizedHandler } from './session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [access, setAccess] = useState(null);

  async function loadProfile() {
    const [workspace, accessResponse] = await Promise.all([
      api.get('/hbms/tasks/workspace'),
      api.get('/hbms/access/me'),
    ]);
    const accessData = accessResponse.data.data || null;
    const workspaceEmployee = workspace.data.data?.employee || null;
    const accessEmployee = accessData?.employee || null;
    setEmployee(workspaceEmployee || accessEmployee ? {
      ...accessEmployee,
      ...workspaceEmployee,
      photoKey: accessEmployee?.photoKey || null,
    } : null);
    setAccess(accessData);
  }

  useEffect(() => {
    let active = true;
    setUnauthorizedHandler(() => {
      saveToken(null).then(() => {
        if (!active) return;
        setToken(null);
        setUser(null);
        setEmployee(null);
        setAccess(null);
      });
    });
    loadToken()
      .then(async (stored) => {
        if (!active) return;
        setToken(stored);
        if (stored) {
          try {
            await loadProfile();
          } catch {
            /* screens show their own errors if the profile cannot load */
          }
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      stopLive();
      return undefined;
    }
    startLive();
    return () => stopLive();
  }, [token]);

  const value = useMemo(() => ({
    ready,
    token,
    user,
    employee,
    access,
    async login(email, password) {
      const response = await api.post('/auth/login', { email, password });
      const next = response.data.token;
      await saveToken(next);
      setToken(next);
      setUser(response.data.user || null);
      await loadProfile();
    },
    async refresh() {
      await loadProfile();
    },
    async logout() {
      await saveToken(null);
      setToken(null);
      setUser(null);
      setEmployee(null);
      setAccess(null);
    },
  }), [ready, token, user, employee, access]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
