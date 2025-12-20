import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { getUserProfile } from "../integrations/outlook";

// Extend Express Request and Session
declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: string;
        email: string;
        name: string;
        roleId: number | null;
        roleName: string | null;
        organizationId: number | null;
      };
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userEmail?: string;
    impersonateUserId?: string;
  }
}

// Middleware to authenticate and attach user from Outlook or session
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    let email: string | undefined;
    
    // Try to get user from Outlook first
    try {
      const profile = await getUserProfile();
      email = profile.mail || profile.userPrincipalName;
      
      // Save to session for future use
      if (email && req.session) {
        const user = await storage.getUserByEmail(email);
        if (user) {
          req.session.userId = user.id;
          req.session.userEmail = email;
        }
      }
    } catch (outlookError) {
      // Outlook not available, try session fallback
      console.log('Outlook unavailable, checking session...');
      if (req.session?.userId) {
        email = req.session.userEmail;
      }
    }
    
    if (!email) {
      return res.status(401).json({ error: 'Not authenticated. Please connect Outlook to log in.' });
    }
    
    // Check for impersonation (admin only)
    let targetEmail = email;
    if (req.session?.impersonateUserId) {
      const impersonatedUser = await storage.getUser(req.session.impersonateUserId);
      if (impersonatedUser) {
        targetEmail = impersonatedUser.email;
      }
    }
    
    const user = await storage.getUserByEmail(targetEmail);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please log in.' });
    }
    
    // Get role name if available
    let roleName = null;
    if (user.roleId) {
      const role = await storage.getRole(user.roleId);
      roleName = role?.name || null;
    }
    
    req.currentUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      roleName,
      organizationId: user.organizationId,
    };
    
    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed. Please try again.' });
  }
}

// Middleware to require admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (req.currentUser.roleName !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

// Middleware to require admin or manager role
export function requireAdminOrManager(req: Request, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (req.currentUser.roleName !== 'admin' && req.currentUser.roleName !== 'manager') {
    return res.status(403).json({ error: 'Admin or manager access required' });
  }
  
  next();
}

// Middleware to ensure user belongs to same organization
export function requireSameOrganization(req: Request, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const targetOrgId = parseInt(req.params.organizationId || req.query.organizationId as string);
  
  if (targetOrgId && req.currentUser.organizationId !== targetOrgId) {
    // Only admins can access other organizations
    if (req.currentUser.roleName !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this organization' });
    }
  }
  
  next();
}
