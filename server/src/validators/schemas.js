import { z } from 'zod';
import { CATEGORIES, PRIORITIES, STATUSES } from '../models/Issue.js';
const email = z.string().trim().email().max(120).transform(v => v.toLowerCase());
export const registerSchema = z.object({ name: z.string().trim().min(2).max(60), email, password: z.string().min(8).max(72).regex(/[A-Za-z]/, 'Password must include a letter').regex(/\d/, 'Password must include a number'), role: z.literal('reporter').optional() });
export const loginSchema = z.object({ email, password: z.string().min(1), role: z.enum(['reporter', 'coordinator', 'viewer']).optional() });
export const issueSchema = z.object({
  title: z.string().trim().min(5).max(120), category: z.enum(CATEGORIES), description: z.string().trim().min(15).max(1500),
  locationText: z.string().trim().min(3).max(160), priority: z.enum(PRIORITIES).default('Medium')
});
export const statusSchema = z.object({ status: z.enum(STATUSES), note: z.string().trim().max(1000).optional().default('') });
export const noteSchema = z.object({ note: z.string().trim().min(2).max(1000) });
export const resolveSchema = z.object({ resolutionNote: z.string().trim().min(5).max(1000) });
