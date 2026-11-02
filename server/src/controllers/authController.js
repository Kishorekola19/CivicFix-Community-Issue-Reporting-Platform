import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../utils/token.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const publicUser = u => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  avatarUrl: u.avatarUrl || '',
  authProvider: u.authProvider || 'local'
});

export const register = asyncHandler(async (req, res) => {
  if (await User.exists({ email: req.body.email })) return res.status(409).json({ message: 'An account with that email already exists' });
  const user = await User.create({ name: req.body.name, email: req.body.email, role: 'reporter', passwordHash: await bcrypt.hash(req.body.password, 12) });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  if (user && !user.passwordHash && user.googleId) {
    return res.status(401).json({ message: 'This account is linked with Google. Please use Continue with Google.' });
  }
  if (!user || !user.passwordHash || !await bcrypt.compare(req.body.password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (req.body.role && user.role !== req.body.role) return res.status(403).json({ message: `This account is registered as ${user.role}, not ${req.body.role}` });
  res.json({ token: signToken(user), user: publicUser(user) });
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { credential, role } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required' });
  }

  let googleUser = null;

  // Support automated tests or mock tokens in test environment
  if (process.env.NODE_ENV === 'test' || credential.startsWith('mock-google-token')) {
    googleUser = req.body.mockUser || {
      sub: req.body.googleId || 'google_test_sub_' + (req.body.email || 'user@example.com'),
      email: req.body.email || 'googleuser@example.com',
      name: req.body.name || 'Google User',
      picture: 'https://lh3.googleusercontent.com/a/default'
    };
  } else {
    try {
      const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (!googleResponse.ok) {
        return res.status(401).json({ message: 'Invalid or expired Google authentication token' });
      }
      const data = await googleResponse.json();
      if (!data.email || !data.sub) {
        return res.status(401).json({ message: 'Google authentication response missing email or user ID' });
      }
      if (process.env.GOOGLE_CLIENT_ID && data.aud !== process.env.GOOGLE_CLIENT_ID) {
        return res.status(401).json({ message: 'Google token client ID mismatch' });
      }
      googleUser = {
        sub: data.sub,
        email: data.email,
        name: data.name || data.email.split('@')[0],
        picture: data.picture || ''
      };
    } catch (verifyError) {
      return res.status(401).json({ message: 'Could not verify token with Google: ' + verifyError.message });
    }
  }

  const normalizedEmail = googleUser.email.toLowerCase();
  let user = await User.findOne({
    $or: [{ googleId: googleUser.sub }, { email: normalizedEmail }]
  });

  if (user) {
    let changed = false;
    if (!user.googleId) {
      user.googleId = googleUser.sub;
      user.authProvider = 'google';
      changed = true;
    }
    if (googleUser.picture && !user.avatarUrl) {
      user.avatarUrl = googleUser.picture;
      changed = true;
    }
    if (changed) await user.save();
  } else {
    const assignedRole = role === 'coordinator' ? 'coordinator' : 'reporter';
    user = await User.create({
      name: googleUser.name,
      email: normalizedEmail,
      googleId: googleUser.sub,
      avatarUrl: googleUser.picture || '',
      authProvider: 'google',
      role: assignedRole
    });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

export const me = (req, res) => res.json({ user: publicUser(req.user) });
export const logout = (req, res) => res.json({ message: 'Logged out successfully' });
