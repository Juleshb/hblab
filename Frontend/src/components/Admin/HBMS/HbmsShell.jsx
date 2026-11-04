import { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../../../assets/context/AuthContext.jsx';
import hblabIcon from '../../../assets/logo-icon.png';
import studioLogo from '../../../assets/hb-studio.jpg';
import hbmsApi from './api';
import { WorkerAvatar } from './ui';

const nav = [
  { id: 'overview', to: '/admin/hbms', label: 'Dashboard', icon: 'carbon:home', end: true },
  { id: 'workers', to: '/admin/hbms/workers', label: 'Workers', icon: 'carbon:group' },
  { id: 'organization', to: '/admin/hbms/organization', label: 'Departments', icon: 'carbon:enterprise' },
  { id: 'projects', to: '/admin/hbms/projects', label: 'Projects', icon: 'carbon:folder' },
  { id: 'programs', to: '/admin/hbms/programs', label: 'Programs & Training', icon: 'carbon:education' },
  { id: 'tasks', to: '/admin/hbms/tasks', label: 'Tasks', icon: 'carbon:task' },
  { id: 'attendance', to: '/admin/hbms/attendance', label: 'Attendance', icon: 'carbon:time' },
  { id: 'leave', to: '/admin/hbms/attendance#leave', label: 'Leave Management', icon: 'carbon:calendar', tab: 'attendance' },
  { id: 'messages', to: '/admin/hbms/messages', label: 'Meetings', icon: 'carbon:events' },
  { id: 'documents', to: '/admin/hbms/documents', label: 'Documents', icon: 'carbon:document' },
  { id: 'reports', to: '/admin/hbms/reports', label: 'Reports', icon: 'carbon:report' },
  { id: 'roles', to: '/admin/hbms/roles', label: 'Roles', icon: 'carbon:user-role' },
  { id: 'settings', to: '/admin/hbms/settings', label: 'Settings', icon: 'carbon:settings', tab: 'overview' },
];

function roleLabel(access) {
  const id = access?.roles?.[0];
  const row = (access?.roleInfo || []).find((item) => item[0] === id);
  return row?.[1] || 'Team member';
}

const HbmsShell = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [access, setAccess] = useState(null);
  const [unread, setUnread] = useState(0);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState(null);
  const [menu, setMenu] = useState(false);
  const [navOpen, setNavOpen] = useState(() => {
    try {
      return localStorage.getItem('hbms-nav-expanded') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hbms-nav-expanded', navOpen ? '1' : '0');
    } catch {
      /* the menu still follows the button for this visit */
    }
  }, [navOpen]);

  useEffect(() => {
    let active = true;
    hbmsApi.get('/access/me')
      .then((response) => {
        if (active) setAccess(response.data.data);
      })
      .catch(() => {});
    hbmsApi.get('/notifications', { params: { unread: '1' } })
      .then((response) => {
        if (active) setUnread((response.data.data || []).length);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('hbms-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setHits(null);
      return undefined;
    }
    let active = true;
    const timer = setTimeout(() => {
      Promise.all([
        hbmsApi.get('/employees', { params: { q: text, limit: 5 } }).catch(() => ({ data: { data: [] } })),
        hbmsApi.get('/projects', { params: { q: text, limit: 5 } }).catch(() => ({ data: { data: [] } })),
      ]).then(([workers, projects]) => {
        if (!active) return;
        setHits({
          workers: workers.data.data || [],
          projects: projects.data.data || [],
        });
      });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const allowed = new Set(access?.tabs || nav.map((item) => item.tab || item.id));
  const items = nav.filter((item) => allowed.has(item.tab || item.id));
  const firstName = (user?.name || 'there').split(' ')[0];

  const submitSearch = (event) => {
    event.preventDefault();
    const text = query.trim();
    if (!text) return;
    setHits(null);
    navigate(`/admin/hbms/workers?q=${encodeURIComponent(text)}`);
  };

  return (
    <div className="flex h-screen bg-[#f4f7f5] text-sm text-gray-800">
      {open && <button type="button" className="fixed inset-0 z-30 bg-black/40 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-hidden bg-[#2e6b57] text-white transition-[width,transform] duration-200 ease-out ${navOpen ? 'lg:w-64' : 'lg:w-[4.5rem]'} ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className={`flex items-center gap-3 px-4 py-4 ${navOpen ? '' : 'lg:justify-center lg:px-2'}`}>
          <img src={hblabIcon} alt="" className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1" />
          <div className={navOpen ? 'min-w-0' : 'min-w-0 lg:hidden'}>
            <p className="text-base font-semibold leading-none">HBMS</p>
            <p className="mt-1 text-[11px] text-emerald-100/80">HBLab & HBStudio</p>
          </div>
        </div>
        <div className="hidden px-3 pb-2 lg:block">
          <button
            type="button"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-emerald-50/80 hover:bg-white/10 ${navOpen ? '' : 'justify-center px-2'}`}
            aria-expanded={navOpen}
            aria-label={navOpen ? 'Hide menu names' : 'Show menu names'}
            onClick={() => setNavOpen((value) => !value)}
          >
            <Icon icon={navOpen ? 'carbon:side-panel-close' : 'carbon:side-panel-open'} className="h-5 w-5 shrink-0" />
            <span className={navOpen ? 'truncate whitespace-nowrap' : 'truncate whitespace-nowrap lg:hidden'}>{navOpen ? 'Hide names' : 'Show names'}</span>
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.end}
              aria-label={item.label}
              onClick={() => setOpen(false)}
              className={({ isActive }) => {
                const leave = item.id === 'leave';
                const here = leave
                  ? window.location.hash === '#leave'
                  : isActive && !(item.id === 'attendance' && window.location.hash === '#leave');
                return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${navOpen ? '' : 'lg:justify-center lg:px-2'} ${here ? 'bg-white/15 text-white' : 'text-emerald-50/80 hover:bg-white/10'}`;
              }}
            >
              <Icon icon={item.icon} className="h-5 w-5 shrink-0" />
              <span className={navOpen ? 'truncate whitespace-nowrap' : 'truncate whitespace-nowrap lg:hidden'}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-3">
          <div className={`rounded-2xl bg-gradient-to-br from-emerald-700/80 to-emerald-900/40 p-3 ${navOpen ? '' : 'lg:flex lg:justify-center lg:px-2'}`}>
            <img src={hblabIcon} alt="" className="h-8 w-8 rounded-lg bg-white object-contain p-1" />
            <p className={`mt-2 text-xs leading-5 text-emerald-50 ${navOpen ? '' : 'lg:hidden'}`}>HBLab empowering digital dreams</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 border-t border-white/10 px-4 py-3 ${navOpen ? '' : 'lg:justify-center lg:px-2'}`}>
          {access?.employee ? (
            <WorkerAvatar worker={access.employee} className="h-9 w-9 shrink-0 rounded-full bg-emerald-200 text-sm font-semibold text-emerald-900" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-sm font-semibold text-emerald-900">
              {firstName.slice(0, 1)}
            </span>
          )}
          <span className={navOpen ? 'min-w-0' : 'min-w-0 lg:hidden'}>
            <span className="block truncate text-sm font-medium">{user?.name || 'Signed in'}</span>
            <span className="block truncate text-[11px] text-emerald-100/70">{user?.email || roleLabel(access)}</span>
          </span>
        </div>
      </aside>

      <div className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ${navOpen ? 'lg:pl-64' : 'lg:pl-[4.5rem]'}`}>
        <header className="relative z-20 overflow-visible border-b border-emerald-900/10 bg-gradient-to-r from-[#0e6b45] via-[#168455] to-[#0f5a3c] text-white">
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: 'radial-gradient(1200px 80px at 20% 120%, rgba(255,255,255,0.35), transparent 60%)' }} />
          <div className="relative flex items-center gap-3 px-3 py-3 sm:px-5">
            <button type="button" className="rounded-lg p-2 hover:bg-white/10 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Icon icon="carbon:menu" className="h-5 w-5" />
            </button>
            <div className="hidden shrink-0 items-center gap-2 rounded-2xl bg-white px-2 py-1.5 shadow-sm md:flex">
              <img src={hblabIcon} alt="" className="h-8 w-8 object-contain" />
              <span>
                <span className="block text-xs font-semibold leading-none text-gray-900">HBLab</span>
                <span className="text-[10px] text-gray-500">Tech & Training</span>
              </span>
            </div>
            <div className="hidden shrink-0 rounded-2xl bg-white px-2 py-1 shadow-sm md:block">
              <img src={studioLogo} alt="HBStudio" className="h-8 w-28 object-contain object-left" />
            </div>
            <form onSubmit={submitSearch} className="relative mx-auto w-full max-w-md">
              <Icon icon="carbon:search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="hbms-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search workers or projects"
                className="w-full rounded-full border-0 bg-white/95 py-2 pl-9 pr-16 text-sm text-gray-800 outline-none ring-2 ring-transparent focus:ring-emerald-200"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-[10px] text-gray-400 sm:block">Ctrl K</span>
              {hits && (
                <div className="absolute left-0 right-0 top-11 overflow-hidden rounded-2xl bg-white text-gray-800 shadow-xl">
                  {hits.workers.length === 0 && hits.projects.length === 0 && (
                    <p className="px-3 py-3 text-xs text-gray-500">No matching workers or projects.</p>
                  )}
                  {hits.workers.map((worker) => (
                    <Link
                      key={worker.id}
                      to={`/admin/hbms/workers/${worker.id}`}
                      onClick={() => { setHits(null); setQuery(''); }}
                      className="block px-3 py-2 text-sm hover:bg-emerald-50"
                    >
                      {worker.firstName} {worker.lastName}
                      <span className="ml-2 text-xs text-gray-400">Worker</span>
                    </Link>
                  ))}
                  {hits.projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/admin/hbms/projects/${project.id}`}
                      onClick={() => { setHits(null); setQuery(''); }}
                      className="block px-3 py-2 text-sm hover:bg-emerald-50"
                    >
                      {project.name}
                      <span className="ml-2 text-xs text-gray-400">{project.code}</span>
                    </Link>
                  ))}
                </div>
              )}
            </form>
            <Link to="/admin/hbms/messages" className="relative rounded-full p-2 hover:bg-white/10" aria-label="Notifications">
              <Icon icon="carbon:notification" className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <div className="relative">
              <button type="button" className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-semibold text-emerald-800" onClick={() => setMenu((value) => !value)} aria-label="Account">
                {access?.employee ? (
                  <WorkerAvatar worker={access.employee} className="h-9 w-9 rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800" />
                ) : firstName.slice(0, 1)}
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-white text-sm text-gray-800 shadow-xl">
                  <div className="border-b border-gray-100 px-3 py-2">
                    <p className="truncate font-medium text-gray-900">{user?.name || 'Signed in'}</p>
                    <p className="truncate text-xs text-gray-500">{user?.email}</p>
                  </div>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin" className="block px-3 py-2 hover:bg-gray-50" onClick={() => setMenu(false)}>Admin panel</Link>
                  )}
                  <Link to="/admin/hbms/settings" className="block px-3 py-2 hover:bg-gray-50" onClick={() => setMenu(false)}>Your login</Link>
                  <Link to="/admin/hbms/roles" className="block px-3 py-2 hover:bg-gray-50" onClick={() => setMenu(false)}>Roles</Link>
                  <button type="button" className="block w-full px-3 py-2 text-left hover:bg-gray-50" onClick={logout}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-5">{children}</main>
      </div>
    </div>
  );
};

export default HbmsShell;
