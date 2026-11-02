import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload, X, AlertTriangle, ExternalLink, CheckCircle2, Search, ArrowRight } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import api from '../lib/api';

const MAX_SIZE = 3 * 1024 * 1024; // 3 MB

export default function ReportIssue() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewedDuplicates, setReviewedDuplicates] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: 'Electrical',
    description: '',
    locationText: '',
    priority: 'Medium'
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setReviewedDuplicates(false); // Reset reviewed state if user changes input
  };

  // Debounced duplicate detection
  const runDuplicateCheck = useCallback(async (title, category, locationText) => {
    if (!title || title.trim().length < 4) {
      setDuplicates([]);
      return;
    }
    setCheckingDuplicates(true);
    try {
      const res = await api.post('/issues/check-duplicates', {
        title: title.trim(),
        category,
        locationText: locationText ? locationText.trim() : ''
      });
      setDuplicates(res.data.potentialDuplicates || []);
    } catch {
      // Fail gracefully if check fails
      setDuplicates([]);
    } finally {
      setCheckingDuplicates(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      runDuplicateCheck(form.title, form.category, form.locationText);
    }, 450);
    return () => clearTimeout(timer);
  }, [form.title, form.category, form.locationText, runDuplicateCheck]);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Image must be smaller than 3 MB');
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submitForm = async () => {
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('description', form.description);
      formData.append('locationText', form.locationText);
      formData.append('priority', form.priority);
      if (image) formData.append('image', image);

      const { data } = await api.post('/issues', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(
        data.issue?.isPotentialDuplicate
          ? 'Issue saved and flagged for coordinator review'
          : 'Issue saved to CivicFix'
      );
      nav(`/issues/${data.issue._id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not submit issue');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // If duplicates were detected and user hasn't explicitly reviewed them yet, trigger review dialog
    if (duplicates.length > 0 && !reviewedDuplicates) {
      setShowReviewModal(true);
      return;
    }
    submitForm();
  };

  const handleConfirmSubmitAnyway = () => {
    setReviewedDuplicates(true);
    setShowReviewModal(false);
    submitForm();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-bold text-brand-600">NEW REPORT</p>
      <h1 className="mt-1 text-3xl font-extrabold">Tell us what needs attention</h1>
      <p className="mt-2 text-slate-500">Clear details help coordinators respond faster and avoid duplicate maintenance requests.</p>

      {/* Duplicate Detection Alert Banner */}
      {duplicates.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-sm transition">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-amber-900">
                  {duplicates.length} Potential Duplicate {duplicates.length === 1 ? 'Issue' : 'Issues'} Detected
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition"
                >
                  <Search className="h-3.5 w-3.5" />
                  Review Similar Issues
                </button>
              </div>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                Similar reports already exist for <strong>{form.category}</strong>. Review them before submitting to see if the problem is already being resolved.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card mt-7 space-y-6 p-6 sm:p-8">
        <div>
          <div className="flex items-center justify-between">
            <label className="label">Issue title</label>
            {checkingDuplicates && (
              <span className="text-xs text-slate-400">Checking for existing reports…</span>
            )}
          </div>
          <input
            className="field"
            required
            minLength="5"
            maxLength="120"
            placeholder="e.g. Streetlight not working"
            value={form.title}
            onChange={e => set('title', e.target.value)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Category</label>
            <select className="field" value={form.category} onChange={e => set('category', e.target.value)}>
              {['Electrical', 'Streetlight', 'Plumbing', 'Furniture', 'Waste', 'Road', 'Safety', 'Other'].map(x => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="field" value={form.priority} onChange={e => set('priority', e.target.value)}>
              {['Low', 'Medium', 'High', 'Urgent'].map(x => <option key={x}>{x}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="field min-h-36 resize-y"
            required
            minLength="15"
            maxLength="1500"
            placeholder="Describe the problem, its impact, and any helpful landmarks…"
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
          <p className="mt-1 text-right text-xs text-slate-400">{form.description.length}/1500</p>
        </div>

        <div>
          <label className="label">Approximate location</label>
          <input
            className="field"
            required
            minLength="3"
            placeholder="e.g. East Gate, Block A"
            value={form.locationText}
            onChange={e => set('locationText', e.target.value)}
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="label">Photo evidence <span className="font-normal text-slate-400">(optional, max 3 MB)</span></label>
          {preview ? (
            <div className="relative mt-2 inline-block">
              <img src={preview} alt="Preview" className="max-h-48 rounded-xl border border-slate-200 object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="mt-1 text-xs text-slate-400">{image.name} ({(image.size / 1024 / 1024).toFixed(1)} MB)</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-8 text-sm text-slate-500 transition hover:border-brand-400 hover:text-brand-600"
            >
              <Upload className="h-5 w-5" />
              Click to upload an image
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleImage} />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-6">
          {duplicates.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="text-xs font-semibold text-amber-700 underline hover:text-amber-800"
            >
              Review {duplicates.length} matching {duplicates.length === 1 ? 'issue' : 'issues'}
            </button>
          ) : <span />}

          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => nav(-1)}>Cancel</button>
            <button disabled={busy} className="btn-primary">
              {busy ? 'Saving to MongoDB…' : 'Submit report'}
            </button>
          </div>
        </div>
      </form>

      {/* Duplicate Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Review Similar Issues</h2>
                  <p className="text-xs text-slate-500">We found existing issues that look similar to your report.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-xs text-slate-600">
                If one of these existing issues already describes your problem, you can view its progress instead of submitting a duplicate:
              </p>

              <div className="space-y-3">
                {duplicates.map(dup => (
                  <div key={dup._id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 hover:border-slate-300 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={dup.status} />
                        <span className="text-xs font-semibold text-slate-500">{dup.category}</span>
                      </div>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                        {dup.similarityScore}% match
                      </span>
                    </div>

                    <h4 className="mt-2 font-bold text-slate-900">{dup.title}</h4>
                    <p className="mt-1 text-xs text-slate-500">Location: <span className="font-medium text-slate-700">{dup.locationText}</span></p>
                    <p className="mt-1 text-xs text-slate-400">Match reason: {dup.matchReason}</p>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2">
                      <span className="text-[11px] text-slate-400">
                        Reported {new Date(dup.createdAt).toLocaleDateString()}
                      </span>
                      <Link
                        to={`/issues/${dup._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                      >
                        View this issue <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="w-full sm:w-auto text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Go back & edit details
              </button>

              <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => nav('/issues')}
                  className="btn-secondary text-xs py-2 px-3 justify-center"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Keep existing report (Don't submit)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmitAnyway}
                  className="btn-primary text-xs py-2 px-3 justify-center bg-amber-600 hover:bg-amber-700"
                >
                  This is different (Submit anyway)
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
