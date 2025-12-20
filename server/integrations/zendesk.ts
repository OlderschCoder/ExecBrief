// Zendesk Integration - Uses Replit Connector for authentication

let connectionSettings: any;

async function getCredentials() {
  if (
    connectionSettings &&
    connectionSettings.settings.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return {
      token: connectionSettings.settings.access_token,
      subdomain: connectionSettings.settings.subdomain,
    };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }

  connectionSettings = await fetch(
    "https://" +
      hostname +
      "/api/v2/connection?include_secrets=true&connector_names=zendesk",
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: xReplitToken,
      },
    },
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings.settings?.oauth?.credentials?.access_token;

  if (
    !connectionSettings ||
    !accessToken ||
    !connectionSettings.settings.subdomain
  ) {
    throw new Error("Zendesk not connected");
  }
  return {
    token: accessToken,
    subdomain: connectionSettings.settings.subdomain,
  };
}

export async function zendeskFetch(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: any,
) {
  const { token, subdomain } = await getCredentials();
  const baseUrl = `https://${subdomain}.zendesk.com/api/v2`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(`${baseUrl}/${endpoint}`, {
    headers,
    method,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zendesk API Error (${response.status}): ${error}`);
  }

  return response.json();
}

export async function isZendeskConnected(): Promise<boolean> {
  try {
    await getCredentials();
    return true;
  } catch {
    return false;
  }
}

export interface ZendeskTicket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string | null;
  created_at: string;
  updated_at: string;
  requester_id: number;
  assignee_id: number | null;
}

export async function getOpenTickets(limit: number = 20): Promise<ZendeskTicket[]> {
  try {
    const response = await zendeskFetch(
      `tickets.json?sort_by=updated_at&sort_order=desc&per_page=${limit}`
    );
    return response.tickets || [];
  } catch (error) {
    console.error('Error fetching Zendesk tickets:', error);
    return [];
  }
}

export async function getMyOpenTickets(limit: number = 20): Promise<ZendeskTicket[]> {
  try {
    const response = await zendeskFetch(
      `tickets.json?sort_by=updated_at&sort_order=desc&per_page=${limit}&status=open,pending`
    );
    return response.tickets || [];
  } catch (error) {
    console.error('Error fetching my Zendesk tickets:', error);
    return [];
  }
}

export async function getUrgentTickets(): Promise<ZendeskTicket[]> {
  try {
    const response = await zendeskFetch(
      `tickets.json?sort_by=priority&sort_order=desc&per_page=10&priority=urgent,high`
    );
    return response.tickets || [];
  } catch (error) {
    console.error('Error fetching urgent tickets:', error);
    return [];
  }
}
