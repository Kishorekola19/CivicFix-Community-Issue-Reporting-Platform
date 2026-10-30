import mongoose from 'mongoose';
import { STATUSES } from './Issue.js';
const schema = new mongoose.Schema({
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  oldStatus: { type: String, enum: STATUSES, required: true },
  newStatus: { type: String, enum: STATUSES, required: true },
  note: { type: String, trim: true, maxlength: 1000, default: '' }
}, { timestamps: true });
export default mongoose.model('IssueUpdate', schema);
