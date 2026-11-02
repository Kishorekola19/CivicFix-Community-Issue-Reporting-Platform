import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';

await connectDB();
const defaultHash = await bcrypt.hash('CivicFix123', 12);
const adminHash = await bcrypt.hash('Kishore19', 12);
const accounts = [
  { name: 'Admin', email: 'admin@civicfix.test', passwordHash: adminHash, role: 'coordinator' },
  { name: 'CivicFix Coordinator', email: 'coordinator@civicfix.test', passwordHash: defaultHash, role: 'coordinator' },
  { name: 'Community Viewer', email: 'viewer@civicfix.test', passwordHash: defaultHash, role: 'viewer' }
];
for (const account of accounts) await User.findOneAndUpdate({ email: account.email }, { $set: account }, { upsert: true, new: true, runValidators: true });
console.log('Development Coordinator and Viewer accounts are ready. No users, reports, or history were deleted; no demo issues were inserted.');
process.exit(0);
