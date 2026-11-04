import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { startLive, stopLive } from './live';
import { clearOffline, prepareOffline, readCache, startOffline, writeCache } from './offline';
import { clearPhotos, preparePhotos } from './photos';
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
    const nextEmployee = workspaceEmployee || accessEmployee ? {
      ...accessEmployee,
      ...workspaceEmployee,
      photoKey: accessEmployee?.photoKey || null,
    } : null;
    setEmployee(nextEmployee);
    setAccess(accessData);
    await writeCache('profile', { employee: nextEmployee, access: accessData });
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
    Promise.all([prepareOffline(), preparePhotos()])
      .then(() => loadToken())
      .then(async (stored) => {
        if (!active) return;
        setToken(stored);
        if (stored) {
          try {
            await loadProfile();
          } catch {
            const saved = readCache('profile');
            if (!active || !saved) return;
            if (saved.employee) setEmployee(saved.employee);
            if (saved.access) setAccess(saved.access);
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
    const stopOffline = startOffline();
    return () => {
      stopLive();
      stopOffline();
    };
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
      const nextUserId = response.data.user?.id ?? null;
      const owner = readCache('owner');
      if (owner != null && nextUserId != null && String(owner) !== String(nextUserId)) {
        await clearOffline();
        await clearPhotos();
      }
      await saveToken(next);
      setToken(next);
      setUser(response.data.user || null);
      await writeCache('owner', nextUserId);
      await loadProfile();
    },
    async refresh() {
      await loadProfile();
    },
    async logout() {
      await saveToken(null);
      await clearOffline();
      await clearPhotos();
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
