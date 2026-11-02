import { ClipboardList, Gauge, Home, LayoutDashboard, LogOut, Menu, PlusCircle, X, Eye, Leaf, Plus } from 'lucide-react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isGuestOrViewer = !user || user.role === 'viewer';

  const links = [
    ...(user?.role === 'reporter' ? [{ to: '/dashboard', label: 'Dashboard', icon: Gauge }] : []),
    { to: isGuestOrViewer ? '/viewer' : '/issues', label: isGuestOrViewer ? 'Issue Tracker' : 'Community Feed', icon: Home },
    ...(user?.role === 'reporter' ? [
      { to: '/report', label: 'Report Issue', icon: PlusCircle, isAction: true },
      { to: '/my-reports', label: 'My Reports', icon: ClipboardList }
    ] : []),
    ...(user?.role === 'coordinator' ? [{ to: '/coordinator', label: 'Coordinator Hub', icon: LayoutDashboard }] : [])
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfcfd] text-ink antialiased">
      {/* Top Menu Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight transition hover:opacity-90">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 via-teal-600 to-emerald-500 text-white shadow-sm shadow-brand-600/30">
                <Leaf className="h-5 w-5" />
              </span>
              <span className="text-slate-900 font-extrabold">Civic<span className="text-brand-600">Fix</span></span>
            </NavLink>

            {/* Desktop Top Menu Bar (Human-made pill selector) */}
            <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/60 shadow-xs">
              {links.map(({ to, label, icon: Icon, isAction }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-white text-brand-700 shadow-sm font-bold border border-slate-200/60'
                        : isAction
                        ? 'text-brand-700 hover:bg-brand-50/70 hover:text-brand-800'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`
                  }
                >
                  <Icon className={`h-4 w-4 ${isAction ? 'text-brand-600' : ''}`} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right: User Profile / Auth Actions */}
          <div className="flex items-center gap-3">
            {user && user.role !== 'viewer' ? (
              <div className="flex items-center gap-2.5">
                {/* User capsule */}
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200/80 bg-white py-1 pl-1.5 pr-3 shadow-xs">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <span className="rounded-full bg-brand-50 border border-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                    {user?.role}
                  </span>
                </div>

                {/* Quick Report button for reporters */}
                {user.role === 'reporter' && (
                  <NavLink
                    to="/report"
                    className="hidden lg:inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Report
                  </NavLink>
                )}

                {/* Logout button */}
                <button
                  onClick={logout}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full">
                  <Eye className="h-3.5 w-3.5 text-brand-600" />
                  Public Viewer
                </span>
                <NavLink to="/login" className="btn-secondary text-xs py-1.5 px-3">Sign in</NavLink>
                <NavLink to="/register" className="btn-primary text-xs py-1.5 px-3">Get started</NavLink>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="md:hidden grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation menu"
            >
              {open ? <X className="h-5 w-5 text-slate-700" /> : <Menu className="h-5 w-5 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {open && (
          <div className="md:hidden border-t border-slate-200/80 bg-white/98 backdrop-blur-md px-4 py-4 space-y-3 shadow-lg">
            {user && user.role !== 'viewer' && (
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 font-bold text-xs text-brand-700">
                      {user?.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">{user?.role}</span>
                  </div>
                </div>
                <button onClick={() => { setOpen(false); logout(); }} className="text-xs font-semibold text-rose-600 hover:underline">
                  Logout
                </button>
              </div>
            )}

            <nav className="space-y-1">
              {links.map(({ to, label, icon: Icon, isAction }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-bold border border-brand-100'
                        : isAction
                        ? 'text-brand-700 bg-brand-50/50'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            {isGuestOrViewer && (
              <div className="border-t border-slate-100 pt-3 flex gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary flex-1 py-2 text-xs">Sign in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary flex-1 py-2 text-xs">Create account</Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area - Full spacious layout without sidebar restriction */}
      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>

      {/* Human-crafted Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <span className="grid h-5 w-5 place-items-center rounded bg-brand-600 text-[10px] text-white font-bold">C</span>
            CivicFix Platform
          </div>
          <p>© 2026 CivicFix. Built for cleaner, safer, community-driven neighborhoods.</p>
        </div>
      </footer>
    </div>
  );
}
