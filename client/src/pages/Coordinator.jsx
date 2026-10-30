import { CheckCircle2, CircleDot, Clock3, Eye, ListChecks, Search, SlidersHorizontal, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import api from '../lib/api';

const transitions = {
  Submitted: ['Under Review', 'In Progress', 'Resolved', 'Rejected'],
  'Under Review': ['Submitted', 'In Progress', 'Resolved', 'Rejected'],
  'In Progress': ['Submitted', 'Under Review', 'Resolved', 'Rejected'],
  Resolved: ['Submitted', 'Under Review', 'In Progress', 'Rejected'],
  Rejected: ['Submitted', 'Under Review', 'In Progress', 'Resolved']
};

const initialFilters = { search: '', category: '', priority: '', location: '', status: '' };
const categories = ['Electrical', 'Streetlight', 'Plumbing', 'Furniture', 'Waste', 'Road', 'Safety', 'Other'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];
const statuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];

export default function Coordinator() {
  const [summary, setSummary] = useState();
  const [issues, setIssues] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [filters, setFilters] = useState(initialFilters);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, limit: 50 };
      const [summaryResponse, issuesResponse] = await Promise.all([
        api.get('/coordinator/summary'),
        api.get('/issues', { params })
      ]);
      setSummary(summaryResponse.data);
      setIssues(issuesResponse.data.issues);
      setTotalMatches(issuesResponse.data.pagination.total);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load coordinator data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const openUpdate = issue => {
    setSelected(issue);
    setStatus(transitions[issue.status]?.[0] || '');
    setNote('');
  };

  const update = async () => {
    if (!selected || !status) return;
    setSaving(true);
    try {
      if (status === 'Resolved') {
        await api.patch(`/issues/${selected._id}/resolve`, { resolutionNote: note });
      } else {
        await api.patch(`/issues/${selected._id}/status`, { status, note });
      }
      toast.success(status === 'Resolved' ? 'Issue resolved and recorded' : `Issue moved to ${status}`);
      setSelected(null);
      setNote('');
      await load();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!summary && loading) return <div className="py-24 text-center text-slate-400">Loading coordinator dashboard…</div>;
  if (!summary && error) return <div className="card py-20 text-center text-rose-700">{error}</div>;

  const cards = [
    [ListChecks, 'Total issues', summary.total, 'bg-blue-50 text-blue-700'],
    [CircleDot, 'Submitted', summary.byStatus.Submitted, 'bg-sky-50 text-sky-700'],
    [Eye, 'Under review', summary.byStatus['Under Review'], 'bg-amber-50 text-amber-700'],
    [Clock3, 'In progress', summary.byStatus['In Progress'], 'bg-violet-50 text-violet-700'],
    [CheckCircle2, 'Resolved', summary.byStatus.Resolved, 'bg-emerald-50 text-emerald-700'],
    [XCircle, 'Rejected', summary.byStatus.Rejected, 'bg-rose-50 text-rose-700']
  ];
  const hasFilters = Object.values(filters).some(Boolean);

  return <>
    <div>
      <p className="text-sm font-bold text-brand-600">COORDINATOR WORKSPACE</p>
      <h1 className="mt-1 text-3xl font-extrabold">Community overview</h1>
      <p className="mt-2 text-slate-500">Review reports, coordinate work, and keep residents informed.</p>
    </div>

    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(([Icon, label, value, color]) => <div className="card flex items-center gap-4 p-5" key={label}>
        <span className={`grid h-12 w-12 place-items-center rounded-2xl ${color}`}><Icon /></span>
        <div><p className="text-sm text-slate-500">{label}</p><b className="text-2xl">{value}</b></div>
      </div>)}
    </div>

    <section className="card mt-6 overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="font-bold">Issue management</h2><p className="mt-1 text-sm text-slate-500">Search, filter, review details, and update official statuses.</p></div>
          <span className="text-sm font-semibold text-slate-500">{totalMatches} matching issue{totalMatches === 1 ? '' : 's'}</span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input className="field pl-10" aria-label="Search issues" placeholder="Search title or description…" value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} />
          </div>
          <input className="field" aria-label="Filter by location" placeholder="Filter location…" value={filters.location} onChange={event => setFilters({ ...filters, location: event.target.value })} />
          <select className="field" aria-label="Filter by category" value={filters.category} onChange={event => setFilters({ ...filters, category: event.target.value })}><option value="">All categories</option>{categories.map(value => <option key={value}>{value}</option>)}</select>
          <select className="field" aria-label="Filter by priority" value={filters.priority} onChange={event => setFilters({ ...filters, priority: event.target.value })}><option value="">All priorities</option>{priorities.map(value => <option key={value}>{value}</option>)}</select>
          <select className="field" aria-label="Filter by status" value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{statuses.map(value => <option key={value}>{value}</option>)}</select>
        </div>
        {hasFilters && <button className="mt-3 text-sm font-semibold text-brand-600" onClick={() => setFilters(initialFilters)}>Clear all filters</button>}
      </div>

      {error ? <div className="p-12 text-center"><p className="font-bold text-rose-700">Unable to load issues</p><p className="mt-1 text-sm text-slate-500">{error}</p><button className="btn-secondary mt-4" onClick={load}>Try again</button></div>
        : loading ? <div className="p-16 text-center text-slate-400">Loading issues…</div>
        : issues.length === 0 ? <div className="p-16 text-center"><SlidersHorizontal className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-3 font-bold">No matching issues</h3><p className="mt-1 text-sm text-slate-500">Try changing or clearing the filters.</p></div>
        : <>
          <div className="divide-y divide-slate-100 lg:hidden">
            {issues.map(issue => <div className="p-5" key={issue._id}>
              <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{issue.title}</h3><p className="mt-1 text-sm text-slate-500">{issue.category} · {issue.locationText}</p></div><StatusBadge status={issue.status} /></div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-500">{issue.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3"><Link className="btn-secondary" to={`/issues/${issue._id}`}>View details</Link><button className="btn-primary" onClick={() => openUpdate(issue)}>Update status</button></div>
            </div>)}
          </div>
          <div className="hidden lg:block">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup><col className="w-[25%]" /><col className="w-[11%]" /><col className="w-[17%]" /><col className="w-[9%]" /><col className="w-[12%]" /><col className="w-[11%]" /><col className="w-[15%]" /></colgroup>
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Issue', 'Category', 'Location', 'Priority', 'Status', 'Date', 'Actions'].map(heading => <th className="px-3 py-3" key={heading}>{heading}</th>)}</tr></thead>
              <tbody>{issues.map(issue => <tr className="border-t border-slate-100 align-top" key={issue._id}>
                <td className="px-3 py-4"><p className="font-bold">{issue.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{issue.description}</p></td><td className="break-words px-3 py-4 text-slate-500">{issue.category}</td><td className="break-words px-3 py-4 text-slate-500">{issue.locationText}</td><td className="px-3 py-4">{issue.priority}</td><td className="px-3 py-4"><StatusBadge status={issue.status} /></td><td className="whitespace-nowrap px-3 py-4 text-slate-500">{new Date(issue.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-4"><div className="flex flex-col items-start gap-2 whitespace-nowrap"><button className="font-bold text-brand-600" onClick={() => openUpdate(issue)}>Update status</button><Link className="font-semibold text-slate-500" to={`/issues/${issue._id}`}>View details</Link></div></td>
              </tr>)}</tbody>
            </table>
          </div>
        </>}
    </section>

    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onMouseDown={() => !saving && setSelected(null)}>
      <div className="card w-full max-w-lg p-6" role="dialog" aria-modal="true" aria-labelledby="update-issue-title" onMouseDown={event => event.stopPropagation()}>
        <p className="text-xs font-bold text-brand-600">UPDATE ISSUE</p><h2 id="update-issue-title" className="mt-1 text-xl font-bold">{selected.title}</h2>
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500"><span>Current:</span><StatusBadge status={selected.status} /></div>
        <div className="mt-5"><label className="label" htmlFor="quick-status">Change status to</label><select id="quick-status" className="field" value={status} onChange={event => setStatus(event.target.value)}>{statuses.map(value => <option key={value} value={value} disabled={value === selected.status}>{value}</option>)}</select><p className="mt-2 text-xs text-slate-500">All official statuses are available. The current status cannot be selected again.</p></div>
        <div className="mt-4"><label className="label" htmlFor="quick-note">{status === 'Resolved' ? 'Resolution note (required)' : 'Update note'}</label><textarea id="quick-note" className="field min-h-28" value={note} required={status === 'Resolved'} minLength={status === 'Resolved' ? 5 : undefined} onChange={event => setNote(event.target.value)} placeholder={status === 'Resolved' ? 'Describe how the issue was resolved…' : 'Explain what changed…'} />{status === 'Resolved' && note.trim().length < 5 && <p className="mt-2 text-xs font-medium text-amber-600">Enter at least 5 characters to resolve this issue ({5 - note.trim().length} more).</p>}</div>
        <div className="mt-6 flex justify-end gap-3"><button className="btn-secondary" disabled={saving} onClick={() => setSelected(null)}>Cancel</button><button className="btn-primary" disabled={saving || !status || (status === 'Resolved' && note.trim().length < 5)} onClick={update}>{saving ? 'Saving…' : status === 'Resolved' ? 'Resolve issue' : 'Save update'}</button></div>
      </div>
    </div>}
  </>;
}
