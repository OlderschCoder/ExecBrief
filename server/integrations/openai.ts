// OpenAI Integration for AI-powered email analysis
import OpenAI from 'openai';

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set. Please configure your OpenAI API key.');
    }
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openaiClient;
}

export interface EmailAnalysis {
  summary: string;
  priority: 'low' | 'medium' | 'high';
  needsResponse: boolean;
  actionItems: string[];
  category: string;
}

export interface EmailContent {
  subject: string;
  body: string;
  from: string;
  receivedDate: string;
  importance?: string;
}

/**
 * Analyze an email using OpenAI to extract summary, priority, and action items
 */
export async function analyzeEmail(email: EmailContent): Promise<EmailAnalysis> {
  try {
    const client = getOpenAIClient();
    
    // Truncate body if too long (to save tokens and stay within context limits)
    const maxBodyLength = 2000;
    const truncatedBody = email.body.length > maxBodyLength 
      ? email.body.substring(0, maxBodyLength) + '...' 
      : email.body;

    const prompt = `Analyze the following email and provide a structured analysis:

Email Subject: ${email.subject}
From: ${email.from}
Received: ${email.receivedDate}
Importance: ${email.importance || 'normal'}

Email Body:
${truncatedBody}

Please analyze this email and respond with a JSON object containing:
1. "summary": A concise 2-3 sentence summary of the email's main points
2. "priority": One of "low", "medium", or "high" based on urgency and importance
3. "needsResponse": A boolean indicating if this email requires a response (consider if it asks questions, requests action, or is from a supervisor)
4. "actionItems": An array of specific action items extracted from the email (empty array if none)
5. "category": A single word category like "meeting", "request", "question", "update", "notification", etc.

Consider these factors for priority:
- High: Urgent requests, issues requiring immediate attention, emails from executives/supervisors, deadlines
- Medium: Requests without urgency, follow-ups, standard communications
- Low: Informational emails, newsletters, automated notifications

Consider these factors for needsResponse:
- Contains questions (explicit or implicit)
- Requests action, decision, or approval
- From supervisor, executive, or important stakeholder
- Requires confirmation or acknowledgment
- Is part of an active conversation thread

Respond ONLY with valid JSON, no additional text or explanation.`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // Use gpt-4o-mini for cost efficiency, or gpt-4o for better quality
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that analyzes emails for executive briefing. Always respond with valid JSON only, no markdown formatting or code blocks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual analysis
      max_tokens: 500,
      response_format: { type: 'json_object' } // Ensure JSON response
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Parse JSON response
    let analysis: EmailAnalysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.error('Failed to parse OpenAI response as JSON:', content);
      return getDefaultAnalysis(email);
    }

    // Validate and normalize the response
    return {
      summary: analysis.summary || email.subject,
      priority: analysis.priority || 'medium',
      needsResponse: analysis.needsResponse ?? false,
      actionItems: Array.isArray(analysis.actionItems) ? analysis.actionItems : [],
      category: analysis.category || 'general'
    };
  } catch (error: any) {
    console.error('OpenAI analysis error:', error.message);
    
    // Fallback to heuristic-based analysis if OpenAI fails
    return getDefaultAnalysis(email);
  }
}

/**
 * Fallback analysis using heuristics when OpenAI is unavailable
 */
function getDefaultAnalysis(email: EmailContent): EmailAnalysis {
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();
  
  // Simple heuristics for priority
  let priority: 'low' | 'medium' | 'high' = 'medium';
  if (email.importance === 'high' || subject.includes('urgent') || subject.includes('asap') || subject.includes('important')) {
    priority = 'high';
  } else if (subject.includes('fw:') || subject.includes('re:') || body.length < 100) {
    priority = 'low';
  }

  // Simple heuristics for needsResponse
  const needsResponse = 
    body.includes('?') || 
    body.includes('please') || 
    body.includes('could you') || 
    body.includes('can you') ||
    body.includes('need your') ||
    body.includes('action required') ||
    !body.includes('no reply');

  return {
    summary: email.body.substring(0, 150) + (email.body.length > 150 ? '...' : ''),
    priority,
    needsResponse,
    actionItems: [],
    category: 'general'
  };
}

/**
 * Batch analyze multiple emails (with rate limiting consideration)
 */
export async function analyzeEmails(emails: EmailContent[]): Promise<EmailAnalysis[]> {
  // Process emails sequentially to avoid rate limits
  // In production, you might want to implement batching or parallel processing with rate limiting
  const results: EmailAnalysis[] = [];
  
  for (const email of emails) {
    try {
      const analysis = await analyzeEmail(email);
      results.push(analysis);
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`Failed to analyze email "${email.subject}":`, error.message);
      results.push(getDefaultAnalysis(email));
    }
  }
  
  return results;
}

/**
 * Check if OpenAI is configured and available
 */
export function isOpenAIConfigured(): boolean {
  try {
    return !!process.env.OPENAI_API_KEY;
  } catch {
    return false;
  }
}


