import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: false, select: false, default: null },
  googleId: { type: String, sparse: true, unique: true, index: true },
  avatarUrl: { type: String, trim: true, default: '' },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  role: { type: String, enum: ['reporter', 'coordinator', 'viewer'], default: 'reporter' }
}, { timestamps: true });
export default mongoose.model('User', schema);
