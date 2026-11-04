import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../assets/context/AuthContext.jsx';
import LoadingSpinner from '../LoadingSpinner';
import AdminDashboard from './AdminDashboard';
import HbmsShell from './HBMS/HbmsShell';
import hbmsApi from './HBMS/api';

const AdminGate = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [access, setAccess] = useState(undefined);

  useEffect(() => {
    if (!user || user.role === 'ADMIN') return undefined;
    let active = true;
    hbmsApi.get('/access/me')
      .then((response) => {
        if (active) setAccess(response.data.data);
      })
      .catch(() => {
        if (active) setAccess(null);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/LoginForm" replace />;
  if (user.role === 'ADMIN') return <AdminDashboard />;
  if (access === undefined) return <LoadingSpinner />;
  if (location.pathname.startsWith('/admin/hbms') && access?.allowed) {
    return <HbmsShell><Outlet /></HbmsShell>;
  }
  if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/" replace />;
};

export default AdminGate;
