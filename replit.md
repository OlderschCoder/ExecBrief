# Executive Morning Briefing AI

## Overview

An AI-powered daily briefing agent designed for higher education leadership. The application aggregates emails and calendar events from Microsoft Outlook, presents them in a prioritized dashboard, and provides AI-curated summaries for executives. It features a multi-tenant architecture supporting organizations, role-based access control (admin, manager, user, contractor), and configurable briefing policies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom executive theme (newspaper-like, professional aesthetic)
- **Fonts**: Playfair Display (headers) and Inter (UI text)
- **Animations**: Framer Motion for smooth transitions

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api` prefix
- **Build System**: Vite for client, esbuild for server bundling
- **Development**: Hot module replacement via Vite dev server

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command
- **Session Storage**: connect-pg-simple for PostgreSQL-backed sessions

### Authentication & Authorization
- **Identity Source**: Microsoft Outlook via Replit Connectors
- **User Resolution**: Email-based lookup from Outlook profile
- **Role System**: Hierarchical roles (admin, manager, user, contractor) with permissions stored as JSONB
- **Middleware**: Custom auth middleware in `server/middleware/auth.ts`
- **Access Control**: Role-based route protection (requireAdmin, requireAdminOrManager)

### Key Data Models
- **Organizations**: Multi-tenant support with domain-based identification
- **Users**: Linked to organizations and roles, with preferences stored as JSONB
- **Email Accounts**: Stores sync configuration per user
- **Briefing Items**: Aggregated content from integrations
- **Briefing Policies**: Configurable delivery schedules and priority rules
- **Contractor Assignments**: Maps contractors to specific users they support

## External Dependencies

### Microsoft Graph API
- **Purpose**: Email and calendar integration via Outlook
- **Client**: `@microsoft/microsoft-graph-client`
- **Authentication**: OAuth tokens managed through Replit Connectors
- **Features**: Recent emails, today's events, user profile

### Replit Infrastructure
- **Connectors**: OAuth token management for Outlook integration
- **Environment Variables**: `REPLIT_CONNECTORS_HOSTNAME`, `REPL_IDENTITY`, `DATABASE_URL`
- **Plugins**: Vite plugins for cartographer, dev banner, runtime error overlay

### Database
- **Provider**: PostgreSQL (requires `DATABASE_URL` environment variable)
- **ORM**: Drizzle with PostgreSQL dialect
- **Validation**: Zod schemas generated via drizzle-zod

### UI Dependencies
- **Component Library**: Full Shadcn/ui suite (40+ components)
- **Icons**: Lucide React
- **Date Handling**: date-fns