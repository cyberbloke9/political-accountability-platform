import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.config';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
        metadata?: any;
      };
      supabaseAccessToken?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
      return;
    }

    const token = authHeader.substring(7);
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
      return;
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      metadata: data.user.user_metadata
    };
    
    req.supabaseAccessToken = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during authentication'
    });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && data.user) {
      req.user = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        metadata: data.user.user_metadata
      };
      req.supabaseAccessToken = token;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const userRole = req.user.role || 'authenticated';
    
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
      return;
    }

    next();
  };
}

export function requireOwnership(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    return;
  }

  const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
  
  if (!resourceUserId) {
    res.status(400).json({ error: 'Bad Request', message: 'User ID not found' });
    return;
  }

  if (req.user.id !== resourceUserId) {
    res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
    return;
  }

  next();
}

export default requireAuth;
