# IIS Server Deployment Setup

This guide covers deploying the Executive Briefing system to your own IIS server (not Replit).

## Overview

When deploying to IIS, you cannot use Replit Connectors. Instead, you need to:

1. Set up OAuth applications for Outlook and Gmail
2. Configure OAuth credentials via environment variables
3. Implement OAuth flow for user authentication
4. Store tokens in the database

---

## Required Environment Variables

Create a `.env` file or configure IIS environment variables with:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/execbrief

# OpenAI (for AI features)
OPENAI_API_KEY=sk-your-openai-key-here

# Microsoft Outlook/Office 365 OAuth
MICROSOFT_CLIENT_ID=your-azure-app-client-id
MICROSOFT_CLIENT_SECRET=your-azure-app-client-secret
MICROSOFT_TENANT_ID=your-tenant-id-or-common

# Gmail OAuth (optional)
GMAIL_CLIENT_ID=your-google-oauth-client-id
GMAIL_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_REDIRECT_URI=https://yourdomain.com/api/auth/gmail/callback

# Zendesk (optional)
ZENDESK_SUBDOMAIN=your-subdomain
ZENDESK_EMAIL=your-email@example.com
ZENDESK_API_TOKEN=your-api-token

# Session Secret
SESSION_SECRET=your-random-session-secret-here

# Admin Password (for fallback login)
ADMIN_PASSWORD=your-secure-password

# Server Configuration
PORT=5000
NODE_ENV=production
BASE_URL=https://yourdomain.com
```

---

## Step 1: Set Up Microsoft Outlook OAuth

### 1.1 Register Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: Executive Briefing App
   - **Supported account types**: Accounts in this organizational directory only (or multi-tenant if needed)
   - **Redirect URI**: 
     - Platform: Web
     - URI: `https://yourdomain.com/api/auth/microsoft/callback`
5. Click **Register**

### 1.2 Configure API Permissions

1. In your app, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `User.Read` (read user profile)
   - `Mail.Read` (read user mail)
   - `Calendars.Read` (read user calendar)
   - `offline_access` (refresh tokens)
6. Click **Grant admin consent** (if you're an admin)

### 1.3 Get Credentials

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Copy the **Value** (this is your `MICROSOFT_CLIENT_SECRET`)
4. Go to **Overview**
5. Copy the **Application (client) ID** (this is your `MICROSOFT_CLIENT_ID`)
6. Copy the **Directory (tenant) ID** (this is your `MICROSOFT_TENANT_ID`)

### 1.4 Add to Environment Variables

```bash
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=your-secret-value
MICROSOFT_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## Step 2: Set Up Gmail OAuth (Optional)

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Gmail API**:
   - Go to **APIs & Services** > **Library**
   - Search for "Gmail API"
   - Click **Enable**

### 2.2 Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Configure:
   - **Application type**: Web application
   - **Name**: Executive Briefing
   - **Authorized redirect URIs**: 
     - `https://yourdomain.com/api/auth/gmail/callback`
4. Click **Create**
5. Copy the **Client ID** and **Client secret**

### 2.3 Add to Environment Variables

```bash
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=https://yourdomain.com/api/auth/gmail/callback
```

---

## Step 3: Set Up Zendesk (Optional)

### 3.1 Get API Token

1. Log into Zendesk
2. Go to **Admin** > **Apps and integrations** > **APIs** > **Zendesk API**
3. Enable **Token Access**
4. Click **Add API token**
5. Copy the token

### 3.2 Add to Environment Variables

```bash
ZENDESK_SUBDOMAIN=your-subdomain  # e.g., "acme" for acme.zendesk.com
ZENDESK_EMAIL=your-email@example.com
ZENDESK_API_TOKEN=your-api-token
```

---

## Step 4: Database Setup

The system uses PostgreSQL. Make sure you have:

1. PostgreSQL installed and running
2. Database created:
   ```sql
   CREATE DATABASE execbrief;
   ```
3. `DATABASE_URL` environment variable set:
   ```bash
   DATABASE_URL=postgresql://username:password@localhost:5432/execbrief
   ```
4. Run migrations (the system auto-bootstraps on first run)

---

## Step 5: Code Updates Needed

The current code assumes Replit Connectors. For IIS deployment, you'll need:

1. **OAuth callback routes** for Microsoft and Gmail
2. **Token storage** in the database (already have `email_accounts` table)
3. **Token refresh logic** to handle expired tokens
4. **Fallback mode** when Replit Connectors aren't available

---

## Step 6: IIS Configuration

### 6.1 Install Node.js

1. Install Node.js on your IIS server
2. Install `iisnode` module
3. Configure IIS to handle Node.js applications

### 6.2 Configure Application

1. Create IIS Application Pool
2. Set `.env` file or configure environment variables in IIS
3. Point IIS to your application directory
4. Configure `web.config` for Node.js

### 6.3 SSL Certificate

- OAuth requires HTTPS
- Configure SSL certificate in IIS
- Update redirect URIs to use HTTPS

---

## Step 7: Deployment Checklist

- [ ] Set up Azure AD application for Outlook
- [ ] Configure Microsoft OAuth credentials
- [ ] Set up Google Cloud project for Gmail (optional)
- [ ] Configure Gmail OAuth credentials (optional)
- [ ] Set up Zendesk API token (optional)
- [ ] Configure PostgreSQL database
- [ ] Set all environment variables
- [ ] Update code to support standard OAuth (not just Replit Connectors)
- [ ] Configure IIS with Node.js support
- [ ] Set up SSL certificate
- [ ] Test OAuth flows
- [ ] Test email and calendar access

---

## Next Steps

The codebase currently uses Replit Connectors. To deploy to IIS, you'll need to:

1. **Update integration code** to support both Replit Connectors (dev) and standard OAuth (production)
2. **Add OAuth callback routes** (`/api/auth/microsoft/callback`, `/api/auth/gmail/callback`)
3. **Implement token storage** in database
4. **Add token refresh logic**

Would you like me to update the code to support IIS deployment with standard OAuth?
