import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, IUser } from '../models/types.ts';
import { db } from '../services/dbStore.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'roadfix-super-secure-production-jwt-token-secret-2026';

export interface AuthRequest extends Request {
  user?: IUser;
}

export function generateToken(user: IUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      jurisdiction: user.jurisdiction
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
    const user = await db.findUserById(decoded.id);
    if (!user || !user.active) {
      res.status(401).json({ error: 'User account not found or suspended' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Access denied. Role "${req.user.role}" does not have permission to execute this administrative action.` 
      });
      return;
    }

    next();
  };
}
