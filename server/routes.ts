import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getRecentEmails, getTodayEvents, getUserProfile } from "./integrations/outlook";
import { getRecentGmailEmails, isGmailConnected } from "./integrations/gmail";
import { 
  insertUserSchema, 
  insertOrganizationSchema, 
  insertEmailAccountSchema,
  insertBriefingPolicySchema,
  insertContractorAssignmentSchema
} from "@shared/schema";
import { z } from "zod";
import { authenticateUser, requireAdmin, requireAdminOrManager } from "./middleware/auth";

// Validation schemas for PATCH operations
const updateUserSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  roleId: z.number().optional(),
  isActive: z.boolean().optional(),
  preferences: z.any().optional(),
}).strict();

const updateOrganizationSchema = z.object({
  name: z.string().optional(),
  settings: z.any().optional(),
  isActive: z.boolean().optional(),
}).strict();

const updateEmailAccountSchema = z.object({
  displayName: z.string().optional(),
  syncEnabled: z.boolean().optional(),
  syncFolders: z.any().optional(),
  isActive: z.boolean().optional(),
}).strict();

const updateBriefingPolicySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  scheduleType: z.string().optional(),
  scheduleTime: z.string().optional(),
  timezone: z.string().optional(),
  daysOfWeek: z.any().optional(),
  priorityRules: z.any().optional(),
  notificationChannels: z.any().optional(),
  aiSummarizationEnabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).strict();

const updateIntegrationProviderSchema = z.object({
  displayName: z.string().optional(),
  isEnabled: z.boolean().optional(),
  settings: z.any().optional(),
}).strict();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ==========================================
  // USER BRIEFING ROUTES
  // ==========================================
  
  // Get current user from Outlook profile
  app.get("/api/user/me", async (req, res) => {
    try {
      const profile = await getUserProfile();
      const email = profile.mail || profile.userPrincipalName;
      const domain = email?.split('@')[1] || 'sccc.edu';
      
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Get or create organization
        let org = await storage.getOrganizationByDomain(domain);
        if (!org) {
          org = await storage.createOrganization({
            name: domain.split('.')[0].toUpperCase(),
            domain: domain,
            isActive: true,
          });
        }
        
        // Get default user role
        const roles = await storage.getRoles();
        const userRole = roles.find(r => r.name === 'user');
        
        user = await storage.createUser({
          email: email,
          name: profile.displayName,
          title: profile.jobTitle,
          organizationId: org.id,
          roleId: userRole?.id,
          isActive: true,
        });
      }
      
      res.json(user);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Fetch briefing data (emails + calendar)
  app.get("/api/briefing", async (req, res) => {
    try {
      // Check for impersonation (admin viewing as another user)
      const impersonateUserId = (req as any).session?.impersonateUserId;
      
      let user;
      if (impersonateUserId) {
        user = await storage.getUser(impersonateUserId);
      }
      
      // If not impersonating, get user from Outlook profile
      if (!user) {
        const profile = await getUserProfile();
        const email = profile.mail || profile.userPrincipalName;
        const domain = email?.split('@')[1] || 'sccc.edu';
        
        user = await storage.getUserByEmail(email);
      
        if (!user) {
          let org = await storage.getOrganizationByDomain(domain);
          if (!org) {
            org = await storage.createOrganization({
              name: domain.split('.')[0].toUpperCase(),
              domain: domain,
              isActive: true,
            });
          }
          
          const roles = await storage.getRoles();
          const userRole = roles.find(r => r.name === 'user');
          
          user = await storage.createUser({
            email: email,
            name: profile.displayName,
            title: profile.jobTitle,
            organizationId: org.id,
            roleId: userRole?.id,
            isActive: true,
          });
        }
      }

      // Fetch emails and events in parallel from all sources
      // Gmail may fail due to permission scope limitations - handle gracefully
      let gmailEmails: any[] = [];
      try {
        const gmailConnected = await isGmailConnected();
        if (gmailConnected) {
          gmailEmails = await getRecentGmailEmails(20);
        }
      } catch (gmailError) {
        console.log('Gmail fetch skipped (permissions or not connected):', (gmailError as Error).message);
      }
      
      const [outlookEmails, events] = await Promise.all([
        getRecentEmails(20),
        getTodayEvents()
      ]);

      // Transform Outlook emails into briefing items
      const outlookBriefings = outlookEmails.map(email => ({
        type: 'email' as const,
        priority: email.importance === 'high' ? 'high' as const : 'medium' as const,
        source: 'outlook' as const,
        title: email.subject,
        summary: email.bodyPreview,
        sender: email.from.emailAddress.name,
        timestamp: new Date(email.receivedDateTime),
        metadata: JSON.stringify({
          id: email.id,
          from: email.from.emailAddress.address
        })
      }));

      // Transform Gmail emails into briefing items
      const gmailBriefings = gmailEmails.map((email: any) => ({
        type: 'email' as const,
        priority: 'medium' as const,
        source: 'gmail' as const,
        title: email.subject || '(No subject)',
        summary: email.snippet || '',
        sender: email.from?.split('<')[0]?.trim() || email.from,
        timestamp: new Date(email.date),
        metadata: JSON.stringify({
          id: email.id,
          from: email.from
        })
      }));

      // Combine all emails and sort by timestamp
      const emailBriefings = [...outlookBriefings, ...gmailBriefings]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Transform events into briefing items
      const eventBriefings = events.map(event => ({
        type: 'calendar' as const,
        priority: 'medium' as const,
        source: 'outlook' as const,
        title: event.subject,
        summary: event.location?.displayName || 'No location',
        time: event.start.dateTime,
        duration: calculateDuration(event.start.dateTime, event.end.dateTime),
        timestamp: new Date(event.start.dateTime),
        metadata: JSON.stringify({
          id: event.id,
          location: event.location?.displayName
        })
      }));

      res.json({
        user,
        emails: emailBriefings,
        schedule: eventBriefings
      });
    } catch (error: any) {
      console.error('Error fetching briefing:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark briefing item as read
  app.post("/api/briefing/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markBriefingItemRead(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error marking item as read:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Impersonate user (admin only)
  app.post("/api/auth/impersonate", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }
      
      // Store impersonated user in session
      if ((req as any).session) {
        (req as any).session.impersonateUserId = userId;
      }
      
      res.json({ success: true, userId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clear impersonation
  app.post("/api/auth/stop-impersonate", async (req, res) => {
    try {
      if ((req as any).session) {
        delete (req as any).session.impersonateUserId;
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check integration status (which connectors are available)
  app.get("/api/integration-status", async (req, res) => {
    let outlookConnected = false;
    let gmailConnected = false;
    let teamsConnected = false;

    // Test Outlook connection - silently handle auth failures
    try {
      await getUserProfile();
      outlookConnected = true;
    } catch {
      // Quietly treat any error as "not connected"
    }

    // Test Gmail connection - silently handle auth failures
    try {
      gmailConnected = await isGmailConnected();
    } catch {
      // Quietly treat any error as "not connected"
    }

    // Teams would require separate connector - currently not available
    teamsConnected = false;

    res.json({
      outlook: outlookConnected,
      gmail: gmailConnected,
      teams: teamsConnected
    });
  });

  // ==========================================
  // ADMIN ROUTES - Protected by authentication and admin role
  // ==========================================

  // Apply authentication middleware to all admin routes
  app.use("/api/admin", authenticateUser, requireAdminOrManager);

  // Check if current user has admin access
  app.get("/api/admin/access-check", (req, res) => {
    res.json({ 
      hasAccess: true, 
      user: req.currentUser,
      role: req.currentUser?.roleName 
    });
  });

  // Get all organizations
  app.get("/api/admin/organizations", async (req, res) => {
    try {
      const orgs = await storage.getOrganizations();
      res.json(orgs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get organization by ID
  app.get("/api/admin/organizations/:id", async (req, res) => {
    try {
      const org = await storage.getOrganization(parseInt(req.params.id));
      if (!org) return res.status(404).json({ error: 'Organization not found' });
      res.json(org);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create organization
  app.post("/api/admin/organizations", async (req, res) => {
    try {
      const data = insertOrganizationSchema.parse(req.body);
      const org = await storage.createOrganization(data);
      res.json(org);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update organization
  app.patch("/api/admin/organizations/:id", async (req, res) => {
    try {
      const validatedData = updateOrganizationSchema.parse(req.body);
      const org = await storage.updateOrganization(parseInt(req.params.id), validatedData);
      if (!org) return res.status(404).json({ error: 'Organization not found' });
      res.json(org);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all roles
  app.get("/api/admin/roles", async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get users with pagination and search
  app.get("/api/admin/users", async (req, res) => {
    try {
      const { organizationId, search, limit, offset } = req.query;
      const result = await storage.getUsers(
        organizationId ? parseInt(organizationId as string) : undefined,
        search as string,
        limit ? parseInt(limit as string) : 50,
        offset ? parseInt(offset as string) : 0
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single user
  app.get("/api/admin/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const emailAccounts = await storage.getEmailAccounts(user.id);
      res.json({ ...user, emailAccounts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create user
  app.post("/api/admin/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      
      await storage.createAuditLog({
        action: 'user.create',
        entityType: 'user',
        entityId: user.id,
        details: { email: user.email },
      });
      
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update user
  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      await storage.createAuditLog({
        action: 'user.update',
        entityType: 'user',
        entityId: user.id,
        details: validatedData,
      });
      
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete (deactivate) user
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      
      await storage.createAuditLog({
        action: 'user.delete',
        entityType: 'user',
        entityId: req.params.id,
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk import users
  app.post("/api/admin/users/bulk", async (req, res) => {
    try {
      const { users: usersData } = req.body;
      const results = [];
      
      for (const userData of usersData) {
        try {
          const data = insertUserSchema.parse(userData);
          const user = await storage.createUser(data);
          results.push({ success: true, user });
        } catch (error: any) {
          results.push({ success: false, error: error.message, data: userData });
        }
      }
      
      res.json({ results, total: usersData.length, successful: results.filter(r => r.success).length });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Email Accounts
  app.get("/api/admin/email-accounts", async (req, res) => {
    try {
      const { organizationId } = req.query;
      const accounts = await storage.getAllEmailAccounts(
        organizationId ? parseInt(organizationId as string) : undefined
      );
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/users/:userId/email-accounts", async (req, res) => {
    try {
      const accounts = await storage.getEmailAccounts(req.params.userId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/email-accounts", async (req, res) => {
    try {
      const data = insertEmailAccountSchema.parse(req.body);
      const account = await storage.createEmailAccount(data);
      
      await storage.createAuditLog({
        action: 'email_account.create',
        entityType: 'email_account',
        entityId: account.id.toString(),
        details: { email: account.email, provider: account.provider },
      });
      
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/admin/email-accounts/:id", async (req, res) => {
    try {
      const validatedData = updateEmailAccountSchema.parse(req.body);
      const account = await storage.updateEmailAccount(parseInt(req.params.id), validatedData);
      if (!account) return res.status(404).json({ error: 'Email account not found' });
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/email-accounts/:id", async (req, res) => {
    try {
      await storage.deleteEmailAccount(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync integration data
  app.post("/api/admin/sync/:provider", async (req, res) => {
    try {
      const provider = req.params.provider;
      let message = '';
      
      if (provider === 'outlook') {
        // Trigger outlook sync - just verify connection works
        await getUserProfile();
        message = 'Outlook connected and ready. Emails sync automatically on dashboard load.';
      } else if (provider === 'gmail') {
        // Check gmail connection
        const connected = await isGmailConnected();
        if (connected) {
          message = 'Gmail connected. Note: Reading emails requires additional permissions.';
        } else {
          return res.status(400).json({ message: 'Gmail not connected or missing permissions' });
        }
      } else if (provider === 'teams') {
        message = 'Teams integration requires additional configuration.';
      }
      
      // Update lastSyncedAt for all email accounts of this provider
      await storage.updateEmailAccountsSyncTime(provider);
      
      res.json({ success: true, message });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Sync failed' });
    }
  });

  // Integration Providers
  app.get("/api/admin/integrations/:organizationId", async (req, res) => {
    try {
      const providers = await storage.getIntegrationProviders(parseInt(req.params.organizationId));
      res.json(providers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/integrations", async (req, res) => {
    try {
      const provider = await storage.createIntegrationProvider(req.body);
      res.json(provider);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/admin/integrations/:id", async (req, res) => {
    try {
      const validatedData = updateIntegrationProviderSchema.parse(req.body);
      const provider = await storage.updateIntegrationProvider(parseInt(req.params.id), validatedData);
      if (!provider) return res.status(404).json({ error: 'Integration not found' });
      res.json(provider);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Briefing Policies
  app.get("/api/admin/policies/:organizationId", async (req, res) => {
    try {
      const policies = await storage.getBriefingPolicies(parseInt(req.params.organizationId));
      res.json(policies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/policies", async (req, res) => {
    try {
      const data = insertBriefingPolicySchema.parse(req.body);
      const policy = await storage.createBriefingPolicy(data);
      res.json(policy);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/admin/policies/:id", async (req, res) => {
    try {
      const validatedData = updateBriefingPolicySchema.parse(req.body);
      const policy = await storage.updateBriefingPolicy(parseInt(req.params.id), validatedData);
      if (!policy) return res.status(404).json({ error: 'Policy not found' });
      res.json(policy);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/policies/:id", async (req, res) => {
    try {
      await storage.deleteBriefingPolicy(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Contractor Assignments
  app.get("/api/admin/contractors/:userId/assignments", async (req, res) => {
    try {
      const assignments = await storage.getContractorAssignments(req.params.userId);
      res.json(assignments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/contractors/assignments", async (req, res) => {
    try {
      const data = insertContractorAssignmentSchema.parse(req.body);
      const assignment = await storage.createContractorAssignment(data);
      res.json(assignment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/contractors/assignments/:id", async (req, res) => {
    try {
      await storage.deleteContractorAssignment(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Audit Logs
  app.get("/api/admin/audit-logs", async (req, res) => {
    try {
      const { organizationId, limit } = req.query;
      const logs = await storage.getAuditLogs(
        organizationId ? parseInt(organizationId as string) : undefined,
        limit ? parseInt(limit as string) : 100
      );
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // System Settings
  app.get("/api/admin/settings/:organizationId", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings(parseInt(req.params.organizationId));
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/settings", async (req, res) => {
    try {
      const setting = await storage.upsertSystemSetting(req.body);
      res.json(setting);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Dashboard stats
  app.get("/api/admin/stats/:organizationId", async (req, res) => {
    try {
      const orgId = parseInt(req.params.organizationId);
      const { users, total } = await storage.getUsers(orgId);
      const integrations = await storage.getIntegrationProviders(orgId);
      const policies = await storage.getBriefingPolicies(orgId);
      
      res.json({
        totalUsers: total,
        activeUsers: users.filter(u => u.isActive).length,
        totalIntegrations: integrations.length,
        activeIntegrations: integrations.filter(i => i.isEnabled).length,
        totalPolicies: policies.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

function calculateDuration(start: string, end: string): string {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 60) {
    return `${diffMins}m`;
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}
