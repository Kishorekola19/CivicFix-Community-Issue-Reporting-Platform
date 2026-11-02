import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
const port = process.env.PORT || 5000;
if (!process.env.JWT_SECRET) { console.error('JWT_SECRET is required'); process.exit(1); }
connectDB().then(() => app.listen(port, () => console.log(`CivicFix API listening on ${port}`))).catch(err => { console.error('Database connection failed:', err.message); process.exit(1); });
