import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Issue from '../src/models/Issue.js';
import IssueUpdate from '../src/models/IssueUpdate.js';

const API = 'http://127.0.0.1:5050/api';
const email = 'persistence.reporter@civicfix.test';
const password = 'Persistence123';
const title = 'Streetlight Not Working';
const mode = process.argv[2] || 'create';

const request = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.token && { Authorization: `Bearer ${options.token}` }) }, body: options.body && JSON.stringify(options.body) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path}: ${response.status} ${body.message || ''}`);
  return body;
};

await connectDB();

if (mode === 'check') {
  const reporter = await User.findOne({ email });
  const issue = reporter && await Issue.findOne({ reporterId: reporter._id, title });
  const updates = issue ? await IssueUpdate.countDocuments({ issueId: issue._id }) : 0;
  if (!reporter || !issue || issue.status !== 'Resolved' || issue.resolutionNote !== 'Replaced the faulty lamp and tested the streetlight.' || updates !== 4) throw new Error('Persistence verification failed after restart');
  const signedIn = await request('/auth/login', { method: 'POST', body: { email, password } });
  const publicDetail = await request(`/issues/${issue._id}`, { token: signedIn.token });
  console.log(JSON.stringify({ persistedAfterRestart: true, userId: reporter._id, issueId: issue._id, status: issue.status, resolutionNote: issue.resolutionNote, resolvedAt: issue.resolvedAt, timelineEntries: publicDetail.updates.length }, null, 2));
  await mongoose.disconnect(); process.exit(0);
}

const previous = await User.findOne({ email });
if (previous) { const ids = await Issue.find({ reporterId: previous._id }).distinct('_id'); await IssueUpdate.deleteMany({ issueId: { $in: ids } }); await Issue.deleteMany({ _id: { $in: ids } }); await previous.deleteOne(); }

const registered = await request('/auth/register', { method: 'POST', body: { name: 'Persistence Reporter', email, password } });
if (registered.user.role !== 'reporter') throw new Error('Public registration did not create a reporter');
const reporterToken = registered.token;
const created = await request('/issues', { method: 'POST', token: reporterToken, body: { title, category: 'Electrical', description: 'The streetlight near Block A is not working.', locationText: 'Block A', priority: 'High', imageUrl: '' } });
const issueId = created.issue._id;
const stored = await Issue.findById(issueId);
if (!stored || stored.status !== 'Submitted') throw new Error('Issue was not stored in MongoDB as Submitted');

const mine = await request('/me/issues?search=Streetlight&location=Block%20A&category=Electrical&priority=High&status=Submitted', { token: reporterToken });
if (!mine.issues.some(i => i._id === issueId)) throw new Error('Issue missing from database-backed My Reports query');

const unauthorized = await fetch(`${API}/issues/${issueId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${reporterToken}` }, body: JSON.stringify({ status: 'Under Review' }) });
if (unauthorized.status !== 403) throw new Error(`Reporter status update returned ${unauthorized.status}, expected 403`);

const coordinator = await request('/auth/login', { method: 'POST', body: { email: 'coordinator@civicfix.test', password: 'CivicFix123' } });
const coordinatorToken = coordinator.token;
const feed = await request('/issues?search=Streetlight&location=Block%20A&category=Electrical', { token: coordinatorToken });
if (!feed.issues.some(i => i._id === issueId)) throw new Error('Issue missing from coordinator-visible feed');
await request(`/issues/${issueId}/status`, { method: 'PATCH', token: coordinatorToken, body: { status: 'Under Review', note: 'Coordinator reviewed the report.' } });
await request(`/issues/${issueId}/status`, { method: 'PATCH', token: coordinatorToken, body: { status: 'In Progress', note: 'Electrical team assigned.' } });
await request(`/issues/${issueId}/resolve`, { method: 'PATCH', token: coordinatorToken, body: { resolutionNote: 'Replaced the faulty lamp and tested the streetlight.' } });

const finalIssue = await Issue.findById(issueId);
const history = await IssueUpdate.find({ issueId }).sort({ createdAt: 1 });
const summary = await request('/coordinator/summary', { token: coordinatorToken });
if (finalIssue.status !== 'Resolved' || !finalIssue.resolvedAt || history.length !== 4 || summary.byStatus.Resolved < 1) throw new Error('Final persistence checks failed');
console.log(JSON.stringify({ registeredRole: registered.user.role, issueId, initiallyStored: true, myReportsFound: true, unauthorizedStatusCode: unauthorized.status, coordinatorFound: true, finalStatus: finalIssue.status, resolutionNote: finalIssue.resolutionNote, resolvedAt: finalIssue.resolvedAt, timeline: history.map(h => `${h.oldStatus} -> ${h.newStatus}`), dashboard: summary }, null, 2));
await mongoose.disconnect();
