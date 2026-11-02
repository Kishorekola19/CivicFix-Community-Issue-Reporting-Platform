import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Issue from '../src/models/Issue.js';
import IssueUpdate from '../src/models/IssueUpdate.js';

await connectDB();
const demoEmails = ['reporter@civicfix.test', 'persistence.reporter@civicfix.test'];
const demoUsers = await User.find({ email: { $in: demoEmails } }).select('_id email');
const demoUserIds = demoUsers.map(user => user._id);
const demoIssueIds = await Issue.find({ reporterId: { $in: demoUserIds } }).distinct('_id');
const history = await IssueUpdate.deleteMany({ issueId: { $in: demoIssueIds } });
const issues = await Issue.deleteMany({ _id: { $in: demoIssueIds } });
const users = await User.deleteMany({ _id: { $in: demoUserIds } });
console.log(JSON.stringify({ removedDemoUsers: users.deletedCount, removedDemoIssues: issues.deletedCount, removedDemoUpdates: history.deletedCount, preservedAllOtherUsersAndReports: true }, null, 2));
await mongoose.disconnect();
