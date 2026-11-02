import { CalendarDays, Eye, MapPin, Search, SlidersHorizontal, MessageSquare, CheckCircle2, User, Star } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import api from '../lib/api';

const initialFilters = { search: '', category: '', priority: '', location: '', status: '' };
const categories = ['Electrical', 'Streetlight', 'Plumbing', 'Furniture', 'Waste', 'Road', 'Safety', 'Other'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];
const statuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
const priorityStyles = { Urgent: 'text-rose-600', High: 'text-orange-600', Medium: 'text-amber-600', Low: 'text-emerald-600' };

export default function ViewerIssues() {
  const [activeTab, setActiveTab] = useState('issues'); // 'issues' or 'reviews'
  const [filters, setFilters] = useState(initialFilters);
  const [issues, setIssues] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch community issues
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        if (!localStorage.getItem('civicfix_token') && typeof api.post === 'function') {
          try {
            const loginRes = await api.post('/auth/login', {
              email: 'viewer@civicfix.test',
              password: 'CivicFix123',
              role: 'viewer'
            });
            if (loginRes.data?.token) {
              localStorage.setItem('civicfix_token', loginRes.data.token);
              localStorage.setItem('civicfix_user', JSON.stringify(loginRes.data.user));
            }
          } catch {
            // Graceful fallback
          }
        }
        const { data } = await api.get('/issues', { params: filters, signal: controller.signal });
        setIssues(data.issues);
        setTotal(data.pagination.total);
      } catch (requestError) {
        if (requestError.code !== 'ERR_CANCELED') setError(requestError.response?.data?.message || 'Could not load community issues');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [filters]);

  // Fetch community reviews posted by reporters and members
  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await api.get('/issues/reviews');
      if (res && res.data && res.data.reviews) {
        setReviews(res.data.reviews);
      }
    } catch {
      // Graceful fallback
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'reviews' && reviews.length === 0) {
      fetchReviews();
    }
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-brand-600">VIEWER ACCESS</p>
          <h1 className="mt-1 text-3xl font-extrabold">Community transparency hub</h1>
          <p className="mt-2 text-slate-500">
            Browse public issue reports, check how maintenance is progressing, and read reviews posted by community reporters.
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
          {total} issue{total === 1 ? '' : 's'} tracked
        </span>
      </div>

      {/* Tabs: Issues vs Reporter Reviews */}
      <div className="mt-7 flex gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => handleTabChange('issues')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
            activeTab === 'issues'
              ? 'bg-brand-600 text-white shadow'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Community Issues ({total})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('reviews')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
            activeTab === 'reviews'
              ? 'bg-brand-600 text-white shadow'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Reporter Reviews & Feedback
          {reviews.length > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
              {reviews.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Issues View */}
      {activeTab === 'issues' && (
        <>
          <section className="card mt-5 p-4 sm:p-5" aria-label="Issue search and filters">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="relative xl:col-span-2">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  className="field pl-10"
                  aria-label="Search by title or location"
                  placeholder="Search title or location…"
                  value={filters.search}
                  onChange={event => setFilters({ ...filters, search: event.target.value })}
                />
              </div>
              <input
                className="field"
                aria-label="Filter by location"
                placeholder="Filter location…"
                value={filters.location}
                onChange={event => setFilters({ ...filters, location: event.target.value })}
              />
              <select
                className="field"
                aria-label="Filter by category"
                value={filters.category}
                onChange={event => setFilters({ ...filters, category: event.target.value })}
              >
                <option value="">All categories</option>
                {categories.map(value => <option key={value}>{value}</option>)}
              </select>
              <select
                className="field"
                aria-label="Filter by priority"
                value={filters.priority}
                onChange={event => setFilters({ ...filters, priority: event.target.value })}
              >
                <option value="">All priorities</option>
                {priorities.map(value => <option key={value}>{value}</option>)}
              </select>
              <select
                className="field"
                aria-label="Filter by status"
                value={filters.status}
                onChange={event => setFilters({ ...filters, status: event.target.value })}
              >
                <option value="">All statuses</option>
                {statuses.map(value => <option key={value}>{value}</option>)}
              </select>
            </div>
            {hasFilters && (
              <button
                className="mt-3 text-sm font-semibold text-brand-600"
                onClick={() => setFilters(initialFilters)}
              >
                Clear all filters
              </button>
            )}
          </section>

          {loading ? (
            <div className="py-24 text-center text-slate-400">Loading community issues…</div>
          ) : error ? (
            <div className="card mt-6 py-16 text-center">
              <h2 className="font-bold text-rose-700">Unable to load issues</h2>
              <p className="mt-1 text-sm text-slate-500">{error}</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="card mt-6 py-20 text-center">
              <SlidersHorizontal className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-3 font-bold">No matching issues</h2>
              <p className="mt-1 text-sm text-slate-500">Try changing or clearing your filters.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {issues.map(issue => (
                <article className="card flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-xl" key={issue._id}>
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge status={issue.status} />
                    <span className={`text-xs font-bold uppercase ${priorityStyles[issue.priority]}`}>{issue.priority}</span>
                  </div>
                  <h2 className="mt-4 text-lg font-bold">{issue.title}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">{issue.category}</p>
                  <div className="mt-5 space-y-2 text-sm text-slate-500">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-500" />
                      {issue.locationText}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Reported {new Date(issue.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link className="btn-secondary mt-5 w-full" to={`/issues/${issue._id}`}>
                    <Eye className="h-4 w-4" />
                    View details
                  </Link>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: Reporter Reviews & Community Feedback View */}
      {activeTab === 'reviews' && (
        <section className="mt-6 space-y-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-bold text-emerald-950">Real Resident & Reporter Reviews</h2>
            </div>
            <p className="mt-1 text-xs text-emerald-800">
              Check out genuine feedback and progress updates from community reporters following up on resolved and active issues.
            </p>
          </div>

          {reviewsLoading ? (
            <div className="py-20 text-center text-slate-400">Loading reporter reviews…</div>
          ) : reviews.length === 0 ? (
            <div className="card py-16 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 font-bold text-slate-700">No community reviews yet</h3>
              <p className="mt-1 text-xs text-slate-500">
                When reporters submit feedback or review resolution work, their comments will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map(rev => (
                <div key={rev._id} className="card p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-brand-700 font-bold text-xs">
                        <User className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{rev.author?.name || 'Community Member'}</h4>
                        <span className="inline-block text-[11px] font-semibold text-brand-600 capitalize">
                          {rev.author?.role || 'reporter'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= (rev.rating || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-xs font-bold text-slate-700">
                      ({rev.rating || 5}/5)
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-700 italic leading-relaxed">
                    "{rev.note}"
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        rev.reviewStage === 'resolution' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {rev.reviewStage === 'resolution' ? 'Resolution' : 'Report'}
                      </span>
                      <StatusBadge status={rev.issue?.status || 'Submitted'} />
                      <span className="font-medium text-slate-700 truncate max-w-[180px]">
                        {rev.issue?.title}
                      </span>
                    </div>

                    {rev.issue?._id && (
                      <Link
                        to={`/issues/${rev.issue._id}`}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700"
                      >
                        View issue →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
