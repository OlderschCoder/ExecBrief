import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getRecentEmails, getTodayEvents, getUserProfile } from "./integrations/outlook";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get or create user based on Outlook profile
  app.get("/api/user/me", async (req, res) => {
    try {
      const profile = await getUserProfile();
      
      let user = await storage.getUserByEmail(profile.mail || profile.userPrincipalName);
      
      if (!user) {
        user = await storage.createUser({
          email: profile.mail || profile.userPrincipalName,
          name: profile.displayName,
          title: profile.jobTitle,
          domain: profile.mail?.split('@')[1] || 'sccc.edu',
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
      const profile = await getUserProfile();
      let user = await storage.getUserByEmail(profile.mail || profile.userPrincipalName);
      
      if (!user) {
        user = await storage.createUser({
          email: profile.mail || profile.userPrincipalName,
          name: profile.displayName,
          title: profile.jobTitle,
          domain: profile.mail?.split('@')[1] || 'sccc.edu',
        });
      }

      // Fetch emails and events in parallel
      const [emails, events] = await Promise.all([
        getRecentEmails(20),
        getTodayEvents()
      ]);

      // Transform emails into briefing items
      const emailBriefings = emails.map(email => ({
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
