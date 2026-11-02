import { ClipboardList, Gauge, Home, LayoutDashboard, LogOut, Menu, PlusCircle, X, Eye } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isGuestOrViewer = !user || user.role === 'viewer';

  const links = [
    ...(user?.role === 'reporter' ? [{ to: '/dashboard', label: 'Dashboard', icon: Gauge }] : []),
    { to: isGuestOrViewer ? '/viewer' : '/issues', label: isGuestOrViewer ? 'Issue tracker' : 'Community feed', icon: Home },
    ...(user?.role === 'reporter' ? [{ to: '/report', label: 'Report an issue', icon: PlusCircle }, { to: '/my-reports', label: 'My reports', icon: ClipboardList }] : []),
    ...(user?.role === 'coordinator' ? [{ to: '/coordinator', label: 'Coordinator', icon: LayoutDashboard }] : [])
  ];

  return (
    <div className="min-h-screen">
      <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-2 font-extrabold text-xl">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-teal-500 text-white">C</span>
            CivicFix
          </NavLink>
          <div className="flex items-center gap-2">
            <button className="lg:hidden p-1 rounded-lg hover:bg-slate-100" onClick={() => setOpen(!open)}>
              {open ? <X /> : <Menu />}
            </button>
            {user && user.role !== 'viewer' ? (
              <div className="hidden items-center gap-3 lg:flex">
                <span className="text-sm text-slate-500">
                  {user?.name} · <span className="capitalize font-semibold text-slate-700">{user?.role}</span>
                </span>
                <button onClick={logout} className="btn-secondary">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full sm:inline-flex">
                  <Eye className="h-3 w-3" />
                  Public Viewer (Read-Only)
                </span>
                <NavLink to="/login" className="btn-secondary text-xs py-2 px-3">Sign in</NavLink>
                <NavLink to="/register" className="btn-primary text-xs py-2 px-3">Report issue</NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      <aside className={`fixed bottom-0 left-0 top-16 z-30 flex flex-col justify-between w-64 border-r border-slate-100 bg-white p-4 transition lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {isGuestOrViewer ? (
          <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4 text-xs text-slate-600">
            <p className="font-bold text-brand-900">Have an issue to report?</p>
            <p className="mt-1 leading-relaxed">Sign in or register to submit maintenance requests and write community reviews.</p>
            <div className="mt-3 flex gap-2">
              <NavLink to="/login" className="btn-primary flex-1 justify-center py-1.5 px-2 text-[11px]">Sign in</NavLink>
              <NavLink to="/register" className="btn-secondary flex-1 justify-center py-1.5 px-2 text-[11px]">Register</NavLink>
            </div>
          </div>
        ) : (
          <button onClick={logout} className="btn-secondary w-full justify-center lg:hidden">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        )}
      </aside>

      <main className="pt-16 lg:pl-64">
        <div className="mx-auto max-w-7xl p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
