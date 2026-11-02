import Issue, { STATUSES, CATEGORIES, PRIORITIES } from '../models/Issue.js';
import IssueUpdate from '../models/IssueUpdate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { transitionIssue } from '../services/issueService.js';
import { findPotentialDuplicates } from '../services/duplicateService.js';

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const checkDuplicates = asyncHandler(async (req, res) => {
  const data = req.method === 'POST' ? req.body : req.query;
  const potentialDuplicates = await findPotentialDuplicates({
    title: data.title || '',
    category: data.category || '',
    locationText: data.locationText || '',
    excludeId: data.excludeId || null
  });
  res.json({ count: potentialDuplicates.length, potentialDuplicates });
});

export const getIssueDuplicates = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  const potentialDuplicates = await findPotentialDuplicates({
    title: issue.title,
    category: issue.category,
    locationText: issue.locationText,
    excludeId: issue._id
  });
  res.json({ count: potentialDuplicates.length, potentialDuplicates });
});

export const createIssue = asyncHandler(async (req, res) => {
  const { title, category, description, locationText, priority } = req.body;

  // Validate required fields (since multer parses as multipart, Zod doesn't run)
  const errors = [];
  if (!title || title.trim().length < 5 || title.trim().length > 120) errors.push('Title must be 5–120 characters');
  if (!category || !CATEGORIES.includes(category)) errors.push('Invalid category');
  if (!description || description.trim().length < 15 || description.trim().length > 1500) errors.push('Description must be 15–1500 characters');
  if (!locationText || locationText.trim().length < 3 || locationText.trim().length > 160) errors.push('Location must be 3–160 characters');
  if (priority && !PRIORITIES.includes(priority)) errors.push('Invalid priority');
  if (errors.length) return res.status(400).json({ message: errors.join('. ') });

  // Detect potential duplicates
  const potentialDuplicates = await findPotentialDuplicates({
    title: title.trim(),
    category,
    locationText: locationText.trim()
  });

  const issueData = {
    title: title.trim(),
    category,
    description: description.trim(),
    locationText: locationText.trim(),
    priority: priority || 'Medium',
    reporterId: req.user._id,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
    isPotentialDuplicate: potentialDuplicates.length > 0,
    possibleDuplicateIds: potentialDuplicates.map(d => d._id)
  };

  const issue = await Issue.create(issueData);
  const note = 'Issue reported';
  await IssueUpdate.create({ issueId: issue._id, actorId: req.user._id, oldStatus: 'Submitted', newStatus: 'Submitted', note, isReview: false });
  res.status(201).json({ issue: await issue.populate('reporterId', 'name'), potentialDuplicates });
});

const buildFilter = query => {
  const filter = {};
  for (const key of ['category', 'priority', 'status']) if (query[key]) filter[key] = query[key];
  if (query.location) filter.locationText = { $regex: escapeRegExp(query.location), $options: 'i' };
  if (query.search) filter.$or = ['title', 'description', 'locationText'].map(key => ({ [key]: { $regex: escapeRegExp(query.search), $options: 'i' } }));
  return filter;
};

export const listIssues = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1), limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  const filter = buildFilter(req.query);
  const issueQuery = Issue.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  if (req.user.role === 'viewer') issueQuery.select('title category locationText priority status createdAt');
  else issueQuery.populate('reporterId', 'name');
  const [issues, total] = await Promise.all([
    issueQuery, Issue.countDocuments(filter)
  ]);
  res.json({ issues, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const myIssues = asyncHandler(async (req, res) => {
  const filter = { ...buildFilter(req.query), reporterId: req.user._id };
  res.json({ issues: await Issue.find(filter).sort({ createdAt: -1 }) });
});

export const listCommunityReviews = asyncHandler(async (req, res) => {
  const reviews = await IssueUpdate.find({
    $or: [{ isReview: true }, { rating: { $ne: null } }],
    note: { $exists: true, $ne: '' }
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('actorId', 'name role')
    .populate('issueId', 'title category status locationText priority rating');

  const validReviews = reviews
    .filter(r => r.issueId && r.actorId)
    .map(r => ({
      _id: r._id,
      note: r.note,
      rating: r.rating || (r.issueId?.rating || 5),
      reviewStage: r.reviewStage || (r.oldStatus === 'Resolved' || r.newStatus === 'Resolved' ? 'resolution' : 'reporting'),
      oldStatus: r.oldStatus,
      newStatus: r.newStatus,
      createdAt: r.createdAt,
      author: {
        _id: r.actorId._id,
        name: r.actorId.name,
        role: r.actorId.role
      },
      issue: {
        _id: r.issueId._id,
        title: r.issueId.title,
        category: r.issueId.category,
        status: r.issueId.status,
        locationText: r.issueId.locationText,
        priority: r.issueId.priority
      }
    }));

  res.json({ reviews: validReviews });
});

export const getIssue = asyncHandler(async (req, res) => {
  const viewer = req.user.role === 'viewer';
  const issueQuery = Issue.findById(req.params.id);
  if (viewer) issueQuery.select('-reporterId');
  else issueQuery.populate('reporterId', 'name').populate('possibleDuplicateIds', 'title status category locationText priority createdAt');
  const issue = await issueQuery;
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  const updatesQuery = IssueUpdate.find({ issueId: issue._id }).sort({ createdAt: 1 });
  if (viewer) updatesQuery.select('oldStatus newStatus createdAt');
  else updatesQuery.populate('actorId', 'name role');
  const updates = await updatesQuery;

  // Include community reviews so viewers and reporters can see community feedback
  const reviews = await IssueUpdate.find({
    issueId: issue._id,
    $or: [{ isReview: true }, { rating: { $ne: null } }],
    note: { $exists: true, $ne: '' }
  })
    .sort({ createdAt: -1 })
    .populate('actorId', 'name role');

  const formattedReviews = reviews.map(r => ({
    _id: r._id,
    note: r.note,
    rating: r.rating || (issue.rating || null),
    reviewStage: r.reviewStage || (issue.status === 'Resolved' ? 'resolution' : 'reporting'),
    createdAt: r.createdAt,
    author: {
      _id: r.actorId?._id,
      name: r.actorId?.name || 'Community Member',
      role: r.actorId?.role || 'reporter'
    }
  }));

  res.json({ issue, updates, reviews: formattedReviews });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  if (req.body.status === 'Resolved') return res.status(400).json({ message: 'Use the resolve endpoint and provide a resolution note' });
  await transitionIssue(issue, req.body.status, req.body.note, req.user._id);
  res.json({ issue });
});

export const addUpdate = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  const isReview = req.body.isReview === true || req.body.rating !== undefined;
  const rating = req.body.rating ? Number(req.body.rating) : null;
  const reviewStage = req.body.reviewStage || (issue.status === 'Resolved' ? 'resolution' : 'reporting');
  const update = await IssueUpdate.create({
    issueId: issue._id,
    actorId: req.user._id,
    oldStatus: issue.status,
    newStatus: issue.status,
    note: req.body.note,
    rating,
    isReview,
    reviewStage: isReview ? reviewStage : null
  });
  if (rating) {
    issue.rating = rating;
    await issue.save();
  }
  res.status(201).json({ update: await update.populate('actorId', 'name role') });
});

export const resolveIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  await transitionIssue(issue, 'Resolved', req.body.resolutionNote, req.user._id, { resolutionNote: req.body.resolutionNote, resolvedAt: new Date() });
  res.json({ issue });
});

export const summary = asyncHandler(async (req, res) => {
  const [statusRows, priorityRows, total] = await Promise.all([
    Issue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Issue.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]), Issue.countDocuments()
  ]);
  const byStatus = Object.fromEntries(STATUSES.map(s => [s, statusRows.find(r => r._id === s)?.count || 0]));
  res.json({ total, byStatus, byPriority: Object.fromEntries(priorityRows.map(r => [r._id, r.count])), open: total - byStatus.Resolved - byStatus.Rejected });
});
