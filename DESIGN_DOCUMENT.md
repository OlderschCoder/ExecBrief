# Executive Morning Briefing AI - Design Document

**Organization:** Seward County Community College (SCCC)  
**Domain:** sccc.edu  
**Primary Stakeholder:** Mark Bojeun, CIO (mark.bojeun@sccc.edu)  
**Target Users:** 500+ users including executives, managers, staff, and contractors  
**Document Version:** 2.0  
**Date:** December 21, 2025

---

## 1. Executive Summary

The Executive Morning Briefing AI is an intelligent daily briefing system designed for higher education leadership. It aggregates emails, calendar events, support tickets, and tasks from multiple sources, then presents them in a prioritized, AI-curated dashboard. The system supports multi-tenant architecture, role-based access control, and configurable briefing policies.

---

## 2. Core Requirements

### 2.1 User Types & Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | Full system access (CIO, IT Directors) | All permissions, user impersonation, system configuration |
| **Manager** | Department heads | Manage department users, view team briefings, configure policies |
| **User** | Standard staff | View own briefing, manage own integrations |
| **Contractor** | External support staff | View assigned user briefings only, no configuration access |

### 2.2 Key Features

1. **Unified Dashboard**
   - Morning briefing with prioritized items
   - Quote of the Day (admin-configurable)
   - Today's calendar at a glance
   - Urgent items highlighted

2. **Email Integration**
   - Microsoft Outlook (primary)
   - Gmail (secondary)
   - Support for multiple email accounts per user
   - AI-powered email summarization

3. **Calendar Integration**
   - Microsoft Outlook Calendar
   - Google Calendar
   - Today's events with meeting details

4. **Task Management**
   - Microsoft To-Do integration
   - Task prioritization in briefings

5. **Support Ticket Integration**
   - Zendesk ticket counts and urgent tickets
   - Open ticket alerts

6. **Collaboration**
   - Microsoft Teams meeting integration
   - Teams notification support

7. **Admin Configuration**
   - User management (CRUD, bulk import)
   - Role assignment
   - Organization settings
   - Briefing policy configuration
   - Quote management
   - Integration management
   - User impersonation for support

---

## 3. System Architecture

### 3.1 Technology Stack

```
Frontend:
- React 18 with TypeScript
- Wouter (routing)
- TanStack Query (server state)
- Tailwind CSS v4
- Shadcn/ui components
- Framer Motion (animations)

Backend:
- Node.js with Express
- TypeScript (ESM modules)
- PostgreSQL with Drizzle ORM

Authentication:
- Microsoft OAuth via Replit Connectors
- Session-based auth with password fallback
- Role-based access control (RBAC)

Deployment:
- Replit Autoscale deployment
- PostgreSQL (Neon-backed)
```

### 3.2 Data Model

```
Organizations
├── id (primary key)
├── name
├── domain (unique, e.g., "sccc.edu")
├── settings (JSONB)
└── is_active

Users
├── id (UUID)
├── email (unique)
├── name
├── title
├── department
├── organization_id (FK)
├── role_id (FK)
├── preferences (JSONB)
└── is_active

Roles
├── id
├── name (unique: admin, manager, user, contractor)
├── description
└── permissions (JSONB)

Email_Accounts
├── id
├── user_id (FK)
├── provider (outlook, gmail)
├── email_address
├── display_name
├── sync_enabled
├── sync_folders (JSONB)
├── last_sync_at
└── is_active

Integration_Providers
├── id
├── organization_id (FK)
├── provider_type (outlook, gmail, teams, zendesk, microsoft_todo)
├── display_name
├── is_enabled
├── settings (JSONB)
└── credentials (encrypted)

Briefing_Policies
├── id
├── organization_id (FK)
├── name
├── description
├── schedule_type (daily, weekly, custom)
├── schedule_time
├── timezone
├── days_of_week (JSONB array)
├── priority_rules (JSONB)
├── notification_channels (JSONB)
├── ai_summarization_enabled
├── is_default
└── is_active

Briefing_Items
├── id
├── user_id (FK)
├── source_type (email, calendar, ticket, task)
├── source_id
├── title
├── summary
├── priority (1-5)
├── is_read
├── metadata (JSONB)
└── created_at

Contractor_Assignments
├── id
├── contractor_user_id (FK)
├── sponsor_user_id (FK)
├── assigned_by (FK)
├── is_active
└── created_at

Quotes
├── id
├── organization_id (FK, nullable for global)
├── text
├── author
├── category
└── is_active

Audit_Logs
├── id
├── organization_id (FK)
├── user_id (FK)
├── action
├── resource_type
├── resource_id
├── details (JSONB)
└── created_at
```

### 3.3 Integration Architecture

Each integration uses Replit Connectors for OAuth token management:

```
Per-User Integration Flow:
1. User initiates connection in Settings
2. OAuth flow via Replit Connector
3. Tokens stored securely per-user
4. Background sync jobs per account
5. Data aggregated into Briefing_Items
```

**Supported Integrations:**

| Provider | API | Permissions Required |
|----------|-----|---------------------|
| Microsoft Outlook | Microsoft Graph | Mail.Read, Calendars.Read, User.Read |
| Gmail | Google API | gmail.readonly |
| Microsoft Teams | Microsoft Graph | Calendars.Read, OnlineMeetings.Read |
| Zendesk | Zendesk API | tickets:read |
| Microsoft To-Do | Microsoft Graph | Tasks.Read |

---

## 4. API Endpoints

### 4.1 Authentication
```
POST   /api/auth/login          - Email/password login
POST   /api/auth/logout         - End session
GET    /api/auth/me             - Current user info
```

### 4.2 Briefing
```
GET    /api/briefing            - Get user's daily briefing
GET    /api/briefing/quote      - Get random quote
POST   /api/briefing/refresh    - Force sync and refresh
```

### 4.3 Admin Routes (require admin/manager role)
```
GET    /api/admin/access-check  - Verify admin access
GET    /api/admin/stats         - Dashboard statistics
GET    /api/admin/users         - List users (paginated, searchable)
POST   /api/admin/users         - Create user
PATCH  /api/admin/users/:id     - Update user
DELETE /api/admin/users/:id     - Deactivate user

GET    /api/admin/organizations - List organizations
PATCH  /api/admin/organizations/:id - Update organization

GET    /api/admin/roles         - List roles
GET    /api/admin/policies      - List briefing policies
POST   /api/admin/policies      - Create policy
PATCH  /api/admin/policies/:id  - Update policy
DELETE /api/admin/policies/:id  - Delete policy

GET    /api/admin/quotes        - List quotes
POST   /api/admin/quotes        - Create quote
DELETE /api/admin/quotes/:id    - Delete quote

GET    /api/admin/integrations  - List integration providers
POST   /api/admin/integrations  - Configure integration
```

### 4.4 User Routes
```
GET    /api/user/email-accounts    - User's linked email accounts
POST   /api/user/email-accounts    - Link new email account
DELETE /api/user/email-accounts/:id - Unlink email account
GET    /api/user/preferences       - Get preferences
PATCH  /api/user/preferences       - Update preferences
```

### 4.5 Health & Status
```
GET    /api/health              - Server health check (no auth)
GET    /api/integration-status  - Integration connection status
```

---

## 5. UI Pages

### 5.1 Public Pages
- `/login` - Email/password login with Outlook OAuth option

### 5.2 User Pages
- `/` (Dashboard) - Main briefing view
- `/settings` - User preferences and linked accounts

### 5.3 Admin Pages
- `/admin` - Admin panel with tabs:
  - Overview (stats, quick actions)
  - Users (management table)
  - Integrations (connection configuration)
  - Policies (briefing schedules)
  - Quotes (inspirational quote management)
  - Settings (organization configuration)

---

## 6. Security Requirements

1. **Authentication**
   - Session-based with 7-day expiry
   - Password fallback for initial admin setup
   - OAuth via Microsoft for regular users

2. **Authorization**
   - Role-based access control on all routes
   - Contractor isolation (only see assigned users)
   - Admin impersonation with audit logging

3. **Data Protection**
   - OAuth tokens managed by Replit Connectors
   - No plaintext passwords stored
   - Audit trail for sensitive operations

4. **Environment Variables**
   - `DATABASE_URL` - PostgreSQL connection
   - `SESSION_SECRET` - Session encryption
   - `ADMIN_PASSWORD` - Bootstrap admin creation

---

## 7. Deployment Requirements

1. **Deployment Type:** Autoscale (not static)
2. **Build Command:** `npm run build`
3. **Run Command:** `npm start`
4. **Database:** PostgreSQL with auto-migration on startup
5. **Bootstrap:** Auto-create roles, organization, and seed data on first run

---

## 8. Implementation Phases

### Phase 1: Core Foundation
- [ ] User authentication (OAuth + password fallback)
- [ ] Dashboard with Outlook email/calendar
- [ ] Admin user management
- [ ] Role-based access control
- [ ] Quote of the Day

### Phase 2: Extended Integrations
- [ ] Gmail integration
- [ ] Zendesk ticket integration
- [ ] Microsoft To-Do integration
- [ ] Per-user email account linking

### Phase 3: Advanced Features
- [ ] Microsoft Teams integration
- [ ] AI email summarization
- [ ] Scheduled briefing delivery (email)
- [ ] Contractor assignments and viewing
- [ ] Admin impersonation

### Phase 4: Scale & Polish
- [ ] Bulk user import
- [ ] Advanced briefing policies
- [ ] Custom priority rules
- [ ] Mobile-responsive optimization
- [ ] Performance optimization for 500+ users

---

## 9. Testing Checklist

- [ ] Login works in development
- [ ] Login works in production
- [ ] `/api/health` returns database connected
- [ ] Outlook emails display on dashboard
- [ ] Calendar events display on dashboard
- [ ] Admin panel accessible for admin users
- [ ] Non-admin users blocked from admin panel
- [ ] User creation works
- [ ] Quote management works
- [ ] All integrations show correct status

---

## 10. Known Constraints

1. **Replit Platform**
   - Must use Autoscale deployment (not static)
   - Database managed via Replit PostgreSQL
   - OAuth via Replit Connectors only

2. **Current Limitations**
   - Single Outlook connector shared across users (needs per-user refactor)
   - No email delivery for briefings yet
   - No AI summarization implemented yet

---

## 11. Contact & Support

**Primary Admin:** Mark Bojeun  
**Email:** mark.bojeun@sccc.edu  
**Organization:** Seward County Community College  
**Password:** Seward.Saints#!

---

*This document serves as the complete specification for rebuilding the Executive Morning Briefing AI from scratch.*
