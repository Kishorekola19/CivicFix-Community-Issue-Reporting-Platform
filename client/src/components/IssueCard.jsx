import { ArrowUpRight, MapPin, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { API_BASE } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const priority = { Urgent: 'text-rose-600', High: 'text-orange-600', Medium: 'text-amber-600', Low: 'text-emerald-600' };
const imgSrc = (url) => url?.startsWith('/uploads') ? `${API_BASE}${url}` : url;

export default function IssueCard({ issue }) {
  const { user } = useAuth();

  return (
    <Link to={`/issues/${issue._id}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
      {issue.imageUrl && <img src={imgSrc(issue.imageUrl)} alt="" className="h-40 w-full object-cover" />}
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <StatusBadge status={issue.status} />
          <div className="flex items-center gap-2">
            {user?.role === 'coordinator' && issue.isPotentialDuplicate && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                Duplicate?
              </span>
            )}
            <span className={`text-xs font-bold uppercase ${priority[issue.priority]}`}>{issue.priority}</span>
          </div>
        </div>
        <h3 className="flex items-start justify-between gap-3 font-bold text-slate-900">
          {issue.title}
          <ArrowUpRight className="h-4 w-4 shrink-0 opacity-0 transition group-hover:opacity-100" />
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{issue.description}</p>
        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-teal-500" />
          {issue.locationText}
        </div>
      </div>
    </Link>
  );
}
