import IssueUpdate from '../models/IssueUpdate.js';

export const STATUS_TRANSITIONS = {
  Submitted: ['Under Review', 'In Progress', 'Resolved', 'Rejected'],
  'Under Review': ['Submitted', 'In Progress', 'Resolved', 'Rejected'],
  'In Progress': ['Submitted', 'Under Review', 'Resolved', 'Rejected'],
  Resolved: ['Submitted', 'Under Review', 'In Progress', 'Rejected'],
  Rejected: ['Submitted', 'Under Review', 'In Progress', 'Resolved']
};

export async function transitionIssue(issue, status, note, actorId, changes = {}) {
  if (issue.status === status) { const err = new Error('Issue is already in that status'); err.status = 400; throw err; }
  if (!STATUS_TRANSITIONS[issue.status]?.includes(status)) { const err = new Error(`Cannot move from ${issue.status} to ${status}`); err.status = 400; throw err; }
  const oldStatus = issue.status;
  const oldResolutionNote = issue.resolutionNote;
  const oldResolvedAt = issue.resolvedAt;
  issue.status = status;
  if (status !== 'Resolved') { issue.resolvedAt = null; issue.resolutionNote = ''; }
  Object.assign(issue, changes);
  await issue.save();
  try { await IssueUpdate.create({ issueId: issue._id, actorId, oldStatus, newStatus: status, note }); }
  catch (error) { issue.status = oldStatus; issue.resolutionNote = oldResolutionNote; issue.resolvedAt = oldResolvedAt; await issue.save(); throw error; }
  return issue;
}
