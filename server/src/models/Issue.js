import mongoose from 'mongoose';
export const STATUSES = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const CATEGORIES = ['Electrical', 'Streetlight', 'Plumbing', 'Furniture', 'Waste', 'Road', 'Safety', 'Other'];
const schema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
  category: { type: String, enum: CATEGORIES, required: true, index: true },
  description: { type: String, required: true, trim: true, minlength: 15, maxlength: 1500 },
  locationText: { type: String, required: true, trim: true, maxlength: 160, index: true },
  priority: { type: String, enum: PRIORITIES, default: 'Medium', index: true },
  status: { type: String, enum: STATUSES, default: 'Submitted', index: true },
  imageUrl: { type: String, trim: true, default: '' },
  resolutionNote: { type: String, trim: true, maxlength: 1000, default: '' },
  resolvedAt: { type: Date, default: null }
}, { timestamps: true });
schema.index({ title: 'text', description: 'text', locationText: 'text' });
export default mongoose.model('Issue', schema);
