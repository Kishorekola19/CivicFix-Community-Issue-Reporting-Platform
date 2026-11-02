import { ArrowLeft, Calendar, MapPin, User, AlertTriangle, ExternalLink, MessageSquare, Send, Star, CheckCircle2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import api, { API_BASE } from '../lib/api';

const allStatuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
const imgSrc = (url) => url?.startsWith('/uploads') ? `${API_BASE}${url}` : url;

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState();
  const [duplicates, setDuplicates] = useState([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [postingReview, setPostingReview] = useState(false);

  const load = useCallback(() => {
    setError('');
    return Promise.all([
      api.get(`/issues/${id}`),
      api.get(`/issues/${id}/duplicates`).catch(() => ({ data: { potentialDuplicates: [] } }))
    ])
      .then(([response, dupResponse]) => {
        setData(response.data);
        setDuplicates(dupResponse.data.potentialDuplicates || []);
        setStatus(allStatuses.find(value => value !== response.data.issue.status) || '');
      })
      .catch(e => setError(e.response?.data?.message || 'Could not load issue'));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const saveStatus = async () => {
    if (!status) return;
    setSaving(true);
    try {
      if (status === 'Resolved') await api.patch(`/issues/${id}/resolve`, { resolutionNote: note });
      else await api.patch(`/issues/${id}/status`, { status, note });
      toast.success(status === 'Resolved' ? 'Issue resolved and saved' : `Status changed to ${status}`);
      setNote('');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not update issue');
    } finally {
      setSaving(false);
    }
  };

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!reviewNote.trim()) return;
    setPostingReview(true);
    try {
      const isResolved = data?.issue?.status === 'Resolved';
      await api.post(`/issues/${id}/updates`, {
        note: reviewNote.trim(),
        rating: reviewRating,
        isReview: true,
        reviewStage: isResolved ? 'resolution' : 'reporting'
      });
      toast.success(isResolved ? 'Thank you! Your resolution review and rating have been recorded.' : 'Thank you! Your reporting review and rating have been posted.');
      setReviewNote('');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post review');
    } finally {
      setPostingReview(false);
    }
  };

  const handleMarkAsDuplicate = (dupIssue) => {
    setStatus('Under Review');
    setNote(`Flagged as potential duplicate of "${dupIssue.title}" (${dupIssue.locationText}).`);
    toast('Filled status form with duplicate details. Click "Save status update" to confirm.', { icon: '📝' });
  };

  if (error) return <div className="card py-20 text-center text-rose-700">{error}</div>;
  if (!data) return <div className="py-24 text-center text-slate-400">Loading issue…</div>;
  const { issue, updates } = data;
  const backTo = user?.role === 'coordinator' ? '/coordinator' : user?.role === 'viewer' ? '/viewer' : '/issues';

  return (
    <div className="mx-auto max-w-4xl">
      <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" />
        Back to {user?.role === 'coordinator' ? 'coordinator dashboard' : user?.role === 'viewer' ? 'issue tracker' : 'issues'}
      </Link>

      <div className="card mt-5 overflow-hidden">
        {issue.imageUrl && (
          <img src={imgSrc(issue.imageUrl)} className="max-h-96 w-full object-cover" alt="Issue evidence" />
        )}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={issue.status} />
            <span className="text-xs font-bold uppercase text-orange-600">{issue.priority} priority</span>
            <span className="text-xs font-medium text-slate-400">{issue.category}</span>
            {user?.role === 'coordinator' && issue.isPotentialDuplicate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                Duplicate Warning
              </span>
            )}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold">{issue.title}</h1>
          <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-teal-500" />{issue.locationText}</span>
            {user?.role !== 'viewer' && <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{issue.reporterId?.name}</span>}
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(issue.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="mt-7 whitespace-pre-wrap leading-8 text-slate-600">{issue.description}</p>
          {issue.resolutionNote && (
            <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Resolution note</p>
              <p className="mt-2 text-sm leading-6 text-emerald-900">{issue.resolutionNote}</p>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Review Card (Only shown to coordinators) */}
      {user?.role === 'coordinator' && duplicates.length > 0 && (
        <div className="card mt-6 border-amber-200 bg-amber-50/40 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Coordinator Review: Duplicate Management ({duplicates.length} Active Similar Reports)</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            The system detected {duplicates.length} other active unresolved issue(s) with matching category, block, and title keywords. Coordinators can review to prevent duplicate dispatching.
          </p>

          <div className="mt-4 space-y-3">
            {duplicates.map(dup => (
              <div key={dup._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-white p-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={dup.status} />
                    <span className="text-xs font-medium text-slate-500">{dup.category}</span>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      {dup.similarityScore}% match
                    </span>
                  </div>
                  <h4 className="mt-1.5 font-bold text-slate-900">{dup.title}</h4>
                  <p className="text-xs text-slate-500">{dup.locationText} • {new Date(dup.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/issues/${dup._id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </Link>
                  {user?.role === 'coordinator' && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsDuplicate(dup)}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                      Handle as Duplicate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review & Resolution Feedback / Community Note */}
      {user?.role !== 'viewer' ? (
        issue.status === 'Resolved' ? (
          <div className="card mt-6 border-amber-200 bg-amber-50/30 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-amber-500 fill-amber-400" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">Rate & Review Resolution</h2>
                <p className="mt-1 text-sm text-slate-600">
                  This issue has been resolved! Please rate the repair quality and share your feedback for the community.
                </p>
              </div>
            </div>

            {/* Star Rating Selector */}
            <div className="mt-5 rounded-xl border border-amber-100 bg-white p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Your Rating: <span className="text-amber-600 font-bold normal-case text-sm">
                  {['', '1 Star (Poor)', '2 Stars (Fair)', '3 Stars (Good)', '4 Stars (Very Good)', '5 Stars (Excellent)'][hoverRating || reviewRating]}
                </span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setReviewRating(star)}
                    className="p-1 transition hover:scale-125 focus:outline-none"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= (hoverRating || reviewRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handlePostReview} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Written Review
                </label>
                <textarea
                  className="field min-h-24 resize-y bg-white"
                  required
                  minLength={2}
                  maxLength={1000}
                  placeholder="How was the issue resolved? Share details about promptness, repair quality, or community impact…"
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{reviewNote.length}/1000</span>
                <button
                  type="submit"
                  disabled={postingReview || reviewNote.trim().length < 2}
                  className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-sm"
                >
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {postingReview ? 'Submitting…' : 'Submit Rating & Review'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="card mt-6 border-blue-100 bg-blue-50/20 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-brand-600 fill-brand-400" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">Review Reporting Experience</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Rate your reporting experience and add community feedback while this issue is <span className="font-semibold text-brand-700">{issue.status}</span>. Once marked <span className="font-semibold text-emerald-700">Resolved</span>, you can also rate the final fix!
                </p>
              </div>
            </div>

            {/* Star Rating Selector */}
            <div className="mt-5 rounded-xl border border-blue-100 bg-white p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Your Rating: <span className="text-brand-600 font-bold normal-case text-sm">
                  {['', '1 Star (Poor)', '2 Stars (Fair)', '3 Stars (Good)', '4 Stars (Very Good)', '5 Stars (Excellent)'][hoverRating || reviewRating]}
                </span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setReviewRating(star)}
                    className="p-1 transition hover:scale-125 focus:outline-none"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= (hoverRating || reviewRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handlePostReview} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Report Feedback & Community Notes
                </label>
                <textarea
                  className="field min-h-24 resize-y bg-white"
                  required
                  minLength={2}
                  maxLength={1000}
                  placeholder="Share details on your reporting experience, urgency, or extra notes for the community…"
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{reviewNote.length}/1000</span>
                <button
                  type="submit"
                  disabled={postingReview || reviewNote.trim().length < 2}
                  className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-sm"
                >
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {postingReview ? 'Submitting…' : 'Submit Reporting Review'}
                </button>
              </div>
            </form>
          </div>
        )
      ) : (
        <div className="card mt-6 border-slate-100 bg-slate-50/70 p-5 text-center text-xs text-slate-500">
          Viewing in read-only mode. Sign in as a <strong>Reporter</strong> or <strong>Coordinator</strong> to post reviews and updates.
        </div>
      )}

      {/* Coordinator Actions */}
      {user?.role === 'coordinator' && (
        <div className="card mt-6 border-brand-100 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Coordinator actions</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Update issue status</h2>
              <p className="mt-1 text-sm text-slate-500">Current status: {issue.status}. The update is saved to MongoDB and added to the timeline.</p>
            </div>
            <StatusBadge status={issue.status} />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="coordinator-status">Change status to</label>
              <select id="coordinator-status" className="field" value={status} onChange={e => setStatus(e.target.value)}>
                {allStatuses.map(value => <option key={value} value={value} disabled={value === issue.status}>{value}</option>)}
              </select>
              <p className="mt-2 text-xs text-slate-500">All official statuses are available. The current status cannot be selected again.</p>
            </div>
            <div>
              <label className="label" htmlFor="coordinator-note">{status === 'Resolved' ? 'Resolution note (required)' : 'Status note'}</label>
              <textarea
                id="coordinator-note"
                className="field min-h-24"
                minLength={status === 'Resolved' ? 5 : undefined}
                placeholder={status === 'Resolved' ? 'e.g. The electrician repaired the streetlight.' : 'Explain this update…'}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              {status === 'Resolved' && note.trim().length < 5 && (
                <p className="mt-2 text-xs font-medium text-amber-600">Enter at least 5 characters to resolve this issue ({5 - note.trim().length} more).</p>
              )}
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              className="btn-primary"
              disabled={saving || !status || (status === 'Resolved' && note.trim().length < 5)}
              onClick={saveStatus}
            >
              {saving ? 'Saving…' : status === 'Resolved' ? 'Resolve issue' : 'Save status update'}
            </button>
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <div className="card mt-6 p-6 sm:p-8">
        <h2 className="text-xl font-bold">Status timeline</h2>
        <div className="mt-6 space-y-0">
          {updates.map((update, index) => (
            <div className="relative flex gap-4 pb-7 last:pb-0" key={update._id}>
              {index < updates.length - 1 && <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200" />}
              <span className="relative mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-brand-100 bg-brand-600" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-sm">
                    {update.oldStatus === update.newStatus
                      ? (index === 0 ? 'Reported' : 'Community Note / Review')
                      : `${update.oldStatus} → ${update.newStatus}`}
                  </b>
                  <span className="text-xs text-slate-400">{new Date(update.createdAt).toLocaleString()}</span>
                </div>
                {user?.role !== 'viewer' && update.note && <p className="mt-1 text-sm text-slate-600">{update.note}</p>}
                {user?.role !== 'viewer' && (
                  <p className="mt-1 text-xs text-slate-400">
                    by {update.actorId?.name || 'CivicFix user'} ({update.actorId?.role || 'member'})
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Reviews Display (Visible to Viewers & All Users) */}
      {data.reviews && data.reviews.length > 0 && (
        <div className="card mt-6 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <h2 className="text-xl font-bold">Community Reviews & Feedback ({data.reviews.length})</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Ratings and reviews submitted by reporters and residents after issue resolution.
          </p>
          <div className="mt-4 space-y-3">
            {data.reviews.map(rev => (
              <div key={rev._id} className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
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
                  <span className="text-xs text-slate-400">
                    {new Date(rev.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed italic">"{rev.note}"</p>
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/60 pt-2">
                  <span className="font-semibold text-slate-700">
                    {rev.author?.name || 'Community Member'}{' '}
                    <span className="font-normal capitalize text-brand-600">
                      ({rev.author?.role || 'reporter'})
                    </span>
                    {user?.name && rev.author?.name === user.name && (
                      <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        You
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      rev.reviewStage === 'resolution'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {rev.reviewStage === 'resolution' ? 'Resolution Review' : 'Report Review'}
                    </span>
                    <span className="text-[11px] text-slate-400">Verified</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
