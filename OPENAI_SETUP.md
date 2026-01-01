# OpenAI Integration Setup

This document describes how to configure OpenAI API integration for AI-powered email analysis.

## Features

The OpenAI integration provides:

- **Email Summarization**: AI-generated concise summaries of emails
- **Priority Classification**: Automatic prioritization (low/medium/high) based on content
- **Response Detection**: Identifies emails that need responses
- **Action Item Extraction**: Extracts specific action items from emails
- **Categorization**: Classifies emails into categories (meeting, request, question, etc.)

## Configuration

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Create a new secret key
5. Copy the key (it starts with `sk-...`)

### 2. Set Environment Variable

**Note:** This is the ONLY integration that requires an environment variable. Outlook, Gmail, Calendar, and Zendesk use Replit Connectors (OAuth) and don't need env vars. See `INTEGRATION_SETUP.md` for details.

#### For Local Development

Create a `.env` file in the project root (if it doesn't exist):

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

#### For Replit/Production

**Option 1: Add to .env file**
```bash
echo 'OPENAI_API_KEY=sk-your-api-key-here' >> .env
```

**Option 2: Use Replit Secrets (Recommended)**
1. Go to your Replit project settings
2. Navigate to "Secrets" (or "Environment Variables")
3. Add a new secret:
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
4. Restart your Replit after adding

### 3. Optional: Configure Model

By default, the system uses `gpt-4o-mini` for cost efficiency. You can override this:

```bash
OPENAI_MODEL=gpt-4o  # For better quality (higher cost)
# or
OPENAI_MODEL=gpt-4o-mini  # For cost efficiency (default)
```

Available models:
- `gpt-4o-mini` - Fast, cost-effective (recommended for most use cases)
- `gpt-4o` - Higher quality, more expensive
- `gpt-4-turbo` - Legacy option

### 4. Restart the Server

After setting the environment variable, restart your development server:

```bash
npm run dev
```

## Usage

Once configured, the AI analysis runs automatically when:

1. Users access the `/api/briefing` endpoint
2. The system fetches emails from Outlook/Gmail
3. Emails are analyzed (up to 10 most recent emails per request)

### Email Analysis Results

Each analyzed email will include:

```typescript
{
  summary: string,           // AI-generated summary
  priority: 'low' | 'medium' | 'high',
  needsResponse: boolean,     // Whether email requires a response
  actionItems: string[],      // Extracted action items
  category: string,           // Email category
  aiAnalyzed: boolean         // Whether AI analysis was performed
}
```

### Fallback Behavior

If OpenAI is not configured or fails:

- The system gracefully falls back to heuristic-based analysis
- Emails still display with basic priority detection
- No functionality is lost, just AI enhancements are unavailable

## Cost Considerations

### Token Usage

- Each email analysis uses ~500-1000 tokens
- Processing 10 emails = ~5,000-10,000 tokens per request
- With `gpt-4o-mini`: ~$0.0015-$0.003 per request
- With `gpt-4o`: ~$0.015-$0.03 per request

### Rate Limiting

- The system processes emails sequentially with small delays to avoid rate limits
- Consider implementing caching for frequently accessed emails
- Consider batch processing at scheduled intervals instead of on-demand

### Cost Optimization Tips

1. Use `gpt-4o-mini` for most use cases (recommended)
2. Limit analysis to top priority emails only
3. Cache analysis results in database
4. Process emails in background jobs rather than on-demand

## Troubleshooting

### "OPENAI_API_KEY environment variable is not set"

- Ensure you've set the environment variable
- Restart the server after setting the variable
- Check that the variable name is exactly `OPENAI_API_KEY`

### "No response content from OpenAI"

- Check your OpenAI API key is valid
- Verify you have API credits/quota
- Check OpenAI status page for outages

### "Failed to parse OpenAI response as JSON"

- This should be rare, but the system falls back to heuristics
- Check server logs for the actual response
- Consider reporting this as it may indicate a prompt issue

### Rate Limit Errors

- Reduce the number of emails analyzed per request
- Add longer delays between requests
- Consider implementing request queuing

## Security Notes

- **Never commit your API key to version control**
- Store keys in environment variables or secure secret management
- Use different keys for development and production
- Rotate keys periodically
- Monitor API usage for unexpected activity

## API Reference

The OpenAI integration module (`server/integrations/openai.ts`) provides:

```typescript
// Check if OpenAI is configured
isOpenAIConfigured(): boolean

// Analyze a single email
analyzeEmail(email: EmailContent): Promise<EmailAnalysis>

// Analyze multiple emails
analyzeEmails(emails: EmailContent[]): Promise<EmailAnalysis[]>
```

## Future Enhancements

Potential improvements:

- [ ] Cache analysis results in database
- [ ] Batch processing with background jobs
- [ ] Custom prompts per organization
- [ ] Fine-tuned models for specific email types
- [ ] Multi-language support
- [ ] Sentiment analysis
- [ ] Email thread analysis
