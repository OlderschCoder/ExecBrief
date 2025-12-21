# Executive Morning Briefing AI - Design Document

**Organization:** Seward County Community College (SCCC)  
**Domain:** sccc.edu  
**Primary Stakeholder:** Mark Bojeun, CIO (mark.bojeun@sccc.edu)  
**Target Users:** 500+ users including executives, managers, staff, and contractors  
**Document Version:** 3.0  
**Date:** December 21, 2025

---

## 1. Executive Summary

The Executive Morning Briefing AI delivers a concise, prioritized daily summary for higher education leadership. Each morning, executives see their most important emails, today's calendar, pending tasks, and urgent items - all in one view.

---

## 2. Core Morning Briefing Features (MVP)

These features are essential for the morning executive summary:

### 2.1 Dashboard - The Morning View

| Section | Content | Source |
|---------|---------|--------|
| **Priority Emails** | Top 10 important emails with AI summary | Outlook, Gmail |
| **Today's Calendar** | Today's meetings and events | Outlook Calendar |
| **Urgent Items** | Items requiring immediate attention | All sources |
| **Quote of the Day** | Inspirational quote | Admin-configured |

### 2.2 Essential Integrations

| Integration | Purpose | Priority |
|-------------|---------|----------|
| **Microsoft Outlook** | Email + Calendar | Required |
| **Gmail** | Secondary email source | Required |
| **Microsoft To-Do** | Task list | Required |
| **Zendesk** | Support ticket counts | Required |

### 2.3 User Roles

| Role | Morning Briefing Access |
|------|------------------------|
| **Admin** | Full access + configure for others |
| **Manager** | Own briefing + team overview |
| **User** | Own briefing only |
| **Contractor** | Assigned user briefings only |

### 2.4 Core Admin Functions

- User management (add, edit, deactivate)
- Role assignment
- Quote management
- Integration configuration
- Briefing policy settings

---

## 3. Technical Architecture (Core)

### 3.1 Stack

```
Frontend: React 18, TypeScript, Tailwind CSS, Shadcn/ui
Backend: Node.js, Express, TypeScript
Database: PostgreSQL with Drizzle ORM
Auth: Microsoft OAuth + password fallback
Deploy: Replit Autoscale
```

### 3.2 Core Data Model

```
Users           - id, email, name, title, department, role_id, org_id
Organizations   - id, name, domain, settings
Roles           - id, name, permissions (admin/manager/user/contractor)
Email_Accounts  - id, user_id, provider, email_address, sync_enabled
Briefing_Items  - id, user_id, source_type, title, summary, priority
Quotes          - id, text, author, category
```

### 3.3 Core API Endpoints

```
Auth:
  POST /api/auth/login     - Login with email/password
  GET  /api/auth/me        - Current user

Briefing:
  GET  /api/briefing       - Get morning briefing
  GET  /api/briefing/quote - Random quote

Admin:
  GET  /api/admin/users    - List users
  POST /api/admin/users    - Create user
  GET  /api/admin/quotes   - List quotes
  POST /api/admin/quotes   - Add quote

Health:
  GET  /api/health         - Server status
```

---

## 4. Core Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Login (OAuth + password fallback)
- [ ] Dashboard layout
- [ ] Outlook email display
- [ ] Outlook calendar display
- [ ] Production deployment working

### Phase 2: Complete MVP (Week 2)
- [ ] Gmail integration
- [ ] Zendesk ticket counts
- [ ] Microsoft To-Do tasks
- [ ] Quote of the Day
- [ ] Admin panel (users, quotes)

---

## 5. Deployment

| Setting | Value |
|---------|-------|
| Type | Autoscale (NOT static) |
| Build | `npm run build` |
| Run | `npm start` |
| Database | PostgreSQL (auto-bootstrap on startup) |

---

## 6. Security Essentials

- Session-based auth (7-day expiry)
- Role-based access control
- OAuth tokens via Replit Connectors
- Audit logging for admin actions

---

## 7. Testing Checklist (MVP)

- [ ] Login works in production
- [ ] `/api/health` returns "connected"
- [ ] Emails display on dashboard
- [ ] Calendar shows today's events
- [ ] Admin panel accessible to admins only
- [ ] Quote of the Day displays

---

## 8. Contact

**Admin:** Mark Bojeun  
**Email:** mark.bojeun@sccc.edu  
**Password:** Seward.Saints#!

---

---

# PART 2: OPTIONAL ENHANCEMENTS

*The following features enhance the core briefing but are not required for MVP.*

---

## 9. Optional: Role-Based Briefing Templates

Customize briefing content by executive role:

**President/Chancellor:**
- Enrollment snapshot (today vs. last year)
- Budget health summary
- VIP communications
- Board-related items

**CIO/IT Director:**
- System uptime status
- Security incidents overnight
- IT ticket escalations
- Vendor SLA compliance

**Academic Dean:**
- Faculty coverage issues
- Course enrollment changes
- Retention risk alerts

**CFO:**
- Daily cash position
- Budget variance alerts
- Grant deadlines

**HR Director:**
- Open positions
- Time-off requests pending
- Compliance training due

---

## 10. Optional: Additional Integrations

### 10.1 Communication Platforms
| System | Purpose |
|--------|---------|
| Microsoft Teams | Meeting integration, notifications |
| Slack | Alternative notification channel |

### 10.2 Higher Education Systems
| System | Purpose |
|--------|---------|
| Ellucian Banner/Colleague | SIS - enrollment data |
| Workday | ERP - budget, HR data |
| Canvas/Blackboard | LMS - course data |
| Salesforce Education Cloud | CRM - recruitment |

### 10.3 Operations
| System | Purpose |
|--------|---------|
| Facilities Management | Work orders, space utilization |
| Everbridge/RAVE | Emergency notifications |
| PagerDuty/Statuspage | IT incident management |

---

## 11. Optional: AI/ML Features

1. **Smart Prioritization** - ML-based email importance scoring
2. **Email Summarization** - AI-generated email summaries
3. **Anomaly Detection** - Alert on unusual patterns (enrollment drop, budget spike)
4. **Natural Language Queries** - "Show me urgent items from the President"
5. **Meeting Intelligence** - Pre-meeting briefs with context
6. **Predictive Insights** - Enrollment forecasting, budget projections

---

## 12. Optional: Collaboration Features

1. **Executive Assistant Mode** - EA views exec briefings with approval
2. **Delegation Workflow** - Route items to team members
3. **Shared Notes** - Annotate briefing items
4. **Team Roll-up** - Managers see aggregate team view

---

## 13. Optional: Analytics & Reporting

1. **Personal Analytics** - Response time trends, meeting load
2. **Institutional Dashboards** - Enrollment trends, financial health
3. **Comparative Metrics** - This week vs last, YoY comparisons
4. **PDF Export** - Download briefing as PDF
5. **Scheduled Reports** - Email weekly summaries

---

## 14. Optional: Emergency & Alerting

1. **Multi-Channel Alerts** - Email, SMS, Teams, in-app
2. **Escalation Paths** - Auto-escalate unread urgent items
3. **Emergency Integration** - Weather alerts, campus emergencies
4. **Incident Dashboard** - Active incident tracking

---

## 15. Optional: Compliance & Governance

1. **FERPA Compliance** - Student data access controls
2. **Accessibility (WCAG 2.2 AA)** - Screen reader, keyboard nav
3. **Comprehensive Audit Trail** - All access logged
4. **Data Retention Policies** - Configurable purge rules

---

## 16. Optional: Mobile & Offline

1. **Progressive Web App (PWA)** - Install on home screen
2. **Push Notifications** - Mobile alerts
3. **Offline Snapshot** - View briefing without connectivity
4. **Touch-Optimized UI** - Swipe actions

---

## 17. Future Implementation Roadmap

| Phase | Weeks | Focus |
|-------|-------|-------|
| Phase 3 | 3-4 | Role-based templates, Teams integration |
| Phase 4 | 5-6 | AI summarization, priority scoring |
| Phase 5 | 7-8 | SIS/ERP integration, enrollment dashboards |
| Phase 6 | 9-10 | Collaboration features, delegation |
| Phase 7 | 11-12 | Mobile PWA, offline support |
| Phase 8 | 13-14 | Emergency alerts, compliance audit |

---

## 18. Competitive Differentiation

| Feature | This System | Microsoft Viva | Slack |
|---------|-------------|----------------|-------|
| Higher Ed Focus | Native | Generic | Generic |
| SIS Integration | Yes | Manual | No |
| Role Templates | Yes | Limited | No |
| FERPA Built-in | Yes | Add-on | No |
| Multi-Email | Yes | Outlook only | No |
| Quote of Day | Yes | No | No |

---

*End of Design Document*
