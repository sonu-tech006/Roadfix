import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../services/dbStore.ts';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth.ts';
import { UserRole } from '../models/types.ts';

const router = Router();

// Register citizen (Only citizen role permitted on self-signup)
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { name, email, mobile, password, preferredNotifications } = req.body;

    if (!name || !email || !mobile || !password) {
      res.status(400).json({ error: 'All fields (name, email, mobile, password) are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Strictly enforce citizen role - no self-elevation
    const newUser = await db.createUser({
      name,
      email: email.toLowerCase().trim(),
      mobile: mobile.trim(),
      passwordHash,
      role: 'citizen',
      active: true,
      preferredNotifications: {
        inApp: preferredNotifications?.inApp ?? true,
        email: preferredNotifications?.email ?? true,
        sms: preferredNotifications?.sms ?? false
      }
    });

    const token = generateToken(newUser);
    const { passwordHash: _, ...safeUser } = newUser;

    // Create welcome notification
    await db.createNotification({
      userId: newUser.id,
      title: 'Welcome to RoadFix Platform',
      message: 'Your citizen account is registered. You can now report road damage and track repairs with full transparency.',
      type: 'alert'
    });

    res.status(201).json({
      message: 'Citizen account created successfully',
      token,
      user: safeUser
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (!user.active) {
      res.status(403).json({ error: 'Account has been deactivated. Please contact your jurisdiction administrator.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash || '');
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error during login' });
  }
});

// Demo switch: lets evaluators and users switch instantly between Citizen, Local Admin, District Admin, and State Admin
router.post('/demo-switch', async (req, res): Promise<void> => {
  try {
    const { role } = req.body as { role: UserRole };
    const allUsers = await db.getAllUsers();
    const targetUser = allUsers.find(u => u.role === role);

    if (!targetUser) {
      res.status(404).json({ error: `Demo account for role ${role} not found` });
      return;
    }

    const fullUser = await db.findUserById(targetUser.id);
    if (!fullUser) {
      res.status(404).json({ error: 'User record missing' });
      return;
    }

    const token = generateToken(fullUser);
    const { passwordHash: _, ...safeUser } = fullUser;

    res.json({
      message: `Switched session to ${fullUser.name} (${fullUser.role})`,
      token,
      user: safeUser
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Current user profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { passwordHash: _, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

export default router;
