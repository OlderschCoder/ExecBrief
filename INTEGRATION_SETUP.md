# Integration Setup Guide

This document explains how each integration is configured in the Executive Briefing system.

## Overview

The system uses **two different authentication methods**:

1. **Replit Connectors** (OAuth) - For Outlook, Gmail, and Zendesk
2. **Environment Variables** - For OpenAI API key

---

## ✅ Replit Connectors (No .env needed)

These integrations use OAuth authentication through Replit's Connector system:

- ✅ **Microsoft Outlook** (includes Calendar)
- ✅ **Gmail** 
- ✅ **Zendesk**

### How They Work

1. The `.replit` file already declares the connectors:
   ```toml
   integrations = [
     "javascript_database:1.0.0",
     "outlook:1.0.0",
     "google-mail:1.0.0",
     "zendesk:1.0.0"
   ]
   ```

2. **Replit automatically provides** these environment variables:
   - `REPLIT_CONNECTORS_HOSTNAME` - Automatically set by Replit
   - `REPL_IDENTITY` or `WEB_REPL_RENEWAL` - Automatically set by Replit
   - **You don't need to set these manually**

3. **To connect your accounts:**
   - When you run the app, Replit will prompt you to connect each service
   - Click "Connect" and authorize access to your accounts
   - Tokens are automatically managed and refreshed by Replit

### Microsoft Outlook

- **Includes:** Email AND Calendar (same Microsoft Graph API)
- **Authentication:** OAuth via Replit Connector
- **Setup:** Click "Connect" when prompted by Replit
- **What it accesses:**
  - Read emails
  - Read calendar events
  - Get user profile

### Gmail

- **Authentication:** OAuth via Replit Connector
- **Setup:** Click "Connect" when prompted by Replit
- **What it accesses:**
  - Read emails
  - ⚠️ **Note:** Gmail reading may require additional permissions/domain-wide delegation

### Google Calendar

- **Currently:** Gmail connector is used, but calendar is not separately implemented
- **If needed:** Would require a separate `google-calendar:1.0.0` connector
- **For now:** Use Outlook Calendar which is already included with Outlook integration

---

## 🔑 Environment Variables (Only for OpenAI)

### Required: OpenAI API Key

Add this to your `.env` file or Replit Secrets:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

### Optional: OpenAI Model Selection

```bash
OPENAI_MODEL=gpt-4o-mini  # Default: cost-efficient
# or
OPENAI_MODEL=gpt-4o       # Better quality, higher cost
```

**See `OPENAI_SETUP.md` for detailed OpenAI setup instructions.**

---

## 📋 Summary: What Goes in .env

### ✅ Required
```bash
OPENAI_API_KEY=sk-your-key-here
```

### ✅ Optional
```bash
OPENAI_MODEL=gpt-4o-mini
ADMIN_PASSWORD=your-password-here  # For password login fallback
DATABASE_URL=postgresql://...      # Usually auto-provided by Replit
PORT=5000                          # Usually auto-provided
```

### ❌ NOT Needed (Handled by Replit Connectors)
- Outlook credentials ❌
- Gmail credentials ❌
- Google Calendar credentials ❌
- Zendesk credentials ❌
- Microsoft OAuth client ID/secret ❌

---

## 🔍 How to Check Integration Status

1. **Via API:** Call `/api/integration-status`
   ```json
   {
     "outlook": true,
     "gmail": true,
     "teams": false,
     "zendesk": true,
     "openai": true
   }
   ```

2. **Via UI:** Check the integrations panel in the admin dashboard

---

## 🚀 Quick Setup Checklist

- [ ] Add `OPENAI_API_KEY` to `.env` or Replit Secrets
- [ ] Run the app (or restart if already running)
- [ ] Click "Connect" when Replit prompts for Outlook
- [ ] Click "Connect" when Replit prompts for Gmail (optional)
- [ ] Click "Connect" when Replit prompts for Zendesk (optional)
- [ ] Verify connections at `/api/integration-status`

---

## ❓ Troubleshooting

### "Outlook not connected"
- Make sure you clicked "Connect" when Replit prompted you
- Check that `outlook:1.0.0` is in your `.replit` file
- Try reconnecting: Replit should show a reconnect option

### "Gmail not connected"
- Make sure you clicked "Connect" when Replit prompted you
- Check that `google-mail:1.0.0` is in your `.replit` file
- Gmail may require additional permissions (domain-wide delegation for reading emails)

### "OPENAI_API_KEY not set"
- Add it to `.env` file or Replit Secrets
- Restart the server after adding
- Check that the key starts with `sk-`

### "Calendar events not showing"
- Outlook Calendar is automatically included with Outlook connector
- Make sure Outlook is connected
- Calendar events come from the same Microsoft Graph API as emails

---

## 📚 Additional Notes

### Why Replit Connectors?

Replit Connectors handle OAuth authentication automatically:
- ✅ No need to manage OAuth credentials
- ✅ Automatic token refresh
- ✅ Secure token storage
- ✅ Easy connection UI
- ✅ Works in both development and production

### For Local Development (Non-Replit)

If running outside Replit, you would need to:
- Set up OAuth apps for each service
- Provide client IDs/secrets via environment variables
- Handle token refresh manually
- Implement OAuth callback handlers

**This is why the system is designed for Replit - it simplifies integration significantly!**

---

## 🎯 Current Status

Based on your `.replit` file, you have:

✅ **Configured:**
- Outlook (includes Calendar)
- Gmail
- Zendesk
- PostgreSQL Database

✅ **Ready to Connect:**
- Just click "Connect" when the app runs

✅ **Needs API Key:**
- OpenAI (add to `.env`)


