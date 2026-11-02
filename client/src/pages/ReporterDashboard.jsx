import { ArrowRight, CheckCircle2, Clock3, FilePlus2, ListChecks, MapPin, Megaphone, Plus, Search, UsersRound, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const priorityStyle = { Low:'bg-emerald-50 text-emerald-700', Medium:'bg-amber-50 text-amber-700', High:'bg-rose-50 text-rose-700', Urgent:'bg-red-50 text-red-700' };

export default function ReporterDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [community, setCommunity] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/me/issues'),
      api.get('/issues', { params: { limit: 5 } }),
      api.get('/issues/reviews').catch(() => ({ data: { reviews: [] } }))
    ])
      .then(([mine, all, revs]) => {
        setIssues(mine.data.issues || []);
        setCommunity((all.data.issues || []).slice(0, 3));
        setReviews((revs.data?.reviews || []).slice(0, 4));
      })
      .catch(e => setError(e.response?.data?.message || 'Could not load your dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total: issues.length,
    open: issues.filter(i => !['Resolved', 'Rejected'].includes(i.status)).length,
    progress: issues.filter(i => i.status === 'In Progress').length,
    resolved: issues.filter(i => i.status === 'Resolved').length,
  }), [issues]);

  if (loading) return <div className="py-24 text-center text-slate-400">Loading your dashboard…</div>;
  if (error) return <div className="card py-20 text-center text-rose-700">{error}</div>;

  const cards = [
    [ListChecks, 'Total reports', stats.total, 'bg-blue-50 text-blue-700', '/my-reports'],
    [Clock3, 'Open reports', stats.open, 'bg-orange-50 text-orange-700', '/my-reports'],
    [Search, 'In progress', stats.progress, 'bg-violet-50 text-violet-700', '/my-reports'],
    [CheckCircle2, 'Resolved', stats.resolved, 'bg-emerald-50 text-emerald-700', '/my-reports'],
  ];

  return <div className="space-y-6">
    <section className="rounded-2xl border border-brand-100 bg-brand-50 px-6 py-8 sm:px-8">
      <div className="max-w-xl">
        <p className="text-xs font-extrabold uppercase tracking-wide text-brand-600">Reporter dashboard</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome back, <span className="text-brand-600">{user?.name?.split(' ')[0] || 'Reporter'}!</span></h1>
        <p className="mt-3 max-w-lg leading-7 text-slate-600">Report problems and follow every step toward a cleaner, safer, and happier community.</p>
        <Link to="/report" className="btn-primary mt-6"><Plus className="h-4 w-4"/>Report an issue <ArrowRight className="h-4 w-4"/></Link>
      </div>
    </section>

    {issues.some(i => i.status === 'Resolved') && (
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-sm">
            <Star className="h-5 w-5 fill-white text-white" />
          </span>
          <div>
            <h3 className="font-bold text-slate-900">Resolved Reports Waiting for Review</h3>
            <p className="text-xs text-slate-600">Rate the resolution work and leave a community review to let teams know how the fix went.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {issues.filter(i => i.status === 'Resolved').slice(0, 3).map(r => (
            <Link key={r._id} to={`/issues/${r._id}`} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700">
              Review: {r.title.slice(0, 22)}… ⭐
            </Link>
          ))}
        </div>
      </section>
    )}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([Icon,label,value,color,to]) => <Link to={to} className="card group flex items-center gap-4 p-5 transition hover:-translate-y-1 hover:shadow-lg" key={label}>
        <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${color}`}><Icon className="h-6 w-6"/></span>
        <div className="min-w-0"><p className="text-sm text-slate-500">{label}</p><b className="text-2xl">{value}</b><p className="mt-1 flex items-center gap-1 text-xs font-semibold text-brand-600">View reports <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1"/></p></div>
      </Link>)}
    </section>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(290px,.8fr)]">
      <section>
        <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-2xl font-extrabold">Recent reports</h2><p className="mt-1 text-sm text-slate-500">Your latest reported issues and their current status.</p></div><Link to="/my-reports" className="flex shrink-0 items-center gap-1 text-sm font-bold text-brand-600">View all <ArrowRight className="h-4 w-4"/></Link></div>
        {issues.length ? <div className="card overflow-hidden">{issues.slice(0,4).map((issue,index) => <Link to={`/issues/${issue._id}`} className={`grid gap-4 p-4 transition hover:bg-slate-50 sm:grid-cols-[100px_1fr_auto] sm:items-center ${index?'border-t border-slate-100':''}`} key={issue._id}>
          <div className="h-20 overflow-hidden rounded-xl bg-gradient-to-br from-sky-100 to-emerald-100">{issue.imageUrl?<img src={issue.imageUrl} alt="" className="h-full w-full object-cover"/>:<span className="grid h-full place-items-center"><Megaphone className="text-brand-500"/></span>}</div>
          <div className="min-w-0"><h3 className="truncate font-bold">{issue.title}</h3><p className="mt-2 flex items-center gap-1 truncate text-sm text-slate-500"><MapPin className="h-4 w-4 text-brand-500"/>{issue.locationText}</p><p className="mt-1 line-clamp-1 text-xs text-slate-400">{issue.description}</p></div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end"><StatusBadge status={issue.status}/><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${priorityStyle[issue.priority] || priorityStyle.Medium}`}>{issue.priority}</span><ArrowRight className="h-4 w-4 text-slate-400"/></div>
        </Link>)}</div> : <div className="card py-14 text-center"><h3 className="font-bold">No reports yet</h3><p className="mt-1 text-sm text-slate-500">Submit your first community issue to begin tracking it.</p><Link to="/report" className="btn-primary mt-5">Create first report</Link></div>}
      </section>

      <aside className="space-y-5">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-extrabold text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              Community Reviews
            </h2>
            <Link to="/viewer" className="text-xs font-bold text-brand-600">View all</Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">Real feedback from reporters.</p>
          <div className="mt-4 space-y-3">
            {reviews.length ? reviews.map(rev => (
              <div key={rev._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                    ★ {rev.rating || 5}/5
                  </span>
                  <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-700 italic">"{rev.note}"</p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">{rev.author?.name || 'Reporter'}</span>
                  {rev.issue?.title && <span className="truncate max-w-[120px] text-slate-400">{rev.issue.title}</span>}
                </div>
              </div>
            )) : (
              <p className="py-2 text-xs text-slate-400">No community reviews yet.</p>
            )}
          </div>
        </section>

        <section className="card p-5"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-extrabold"><UsersRound className="h-5 w-5 text-brand-600"/>Community activity</h2><Link to="/issues" className="text-xs font-bold text-brand-600">View all</Link></div><p className="mt-1 text-xs text-slate-500">Latest issues from your community.</p><div className="mt-4 space-y-4">{community.length?community.map(issue=><Link to={`/issues/${issue._id}`} className="flex items-center gap-3" key={issue._id}><span className="grid h-12 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">{issue.imageUrl?<img src={issue.imageUrl} alt="" className="h-full w-full object-cover"/>:<Megaphone className="h-4 w-4 text-brand-500"/>}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm">{issue.title}</b><span className="block truncate text-xs text-slate-500">{issue.locationText}</span></span><StatusBadge status={issue.status}/></Link>):<p className="py-4 text-sm text-slate-400">No community activity yet.</p>}</div></section>
        <section className="card p-5"><h2 className="font-extrabold">Quick links</h2><div className="mt-4 grid gap-3">{[[ListChecks,'My reports','/my-reports'],[UsersRound,'Community feed','/issues'],[Search,'Track issue progress','/my-reports']].map(([Icon,label,to])=><Link to={to} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-bold transition hover:bg-brand-50 hover:text-brand-700" key={label}><Icon className="h-5 w-5 text-brand-600"/>{label}<ArrowRight className="ml-auto h-4 w-4 text-slate-400"/></Link>)}</div></section>
      </aside>
    </div>
  </div>;
}
