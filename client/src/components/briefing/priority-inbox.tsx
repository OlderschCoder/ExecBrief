import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, ExternalLink, Bot, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface BriefingEmail {
  type: string;
  priority: string;
  source: string;
  title: string;
  summary: string;
  sender: string;
  senderEmail?: string;
  timestamp: string;
  metadata: string;
  needsResponse?: boolean;
  actionItems?: string[];
  category?: string;
  aiAnalyzed?: boolean;
}

export function PriorityInbox() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['briefing'],
    queryFn: async () => {
      const res = await fetch('/api/briefing');
      if (!res.ok) throw new Error('Failed to fetch briefing');
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const emails: BriefingEmail[] = data?.emails || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="h-full border-border/50 shadow-sm bg-card/50 backdrop-blur-xl">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Mail className="w-5 h-5 text-muted-foreground" />
            Priority Inbox
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Bot className="w-3 h-3" />
            AI Curated
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-destructive">
              Failed to load emails. Please check your Outlook connection.
            </div>
          ) : emails.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No emails found. Your inbox is clear!
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {emails.slice(0, 5).map((email, index) => {
                const timeAgo = getTimeAgo(new Date(email.timestamp));
                
                return (
                  <div key={index} className="p-4 hover:bg-muted/30 transition-colors group cursor-pointer" data-testid={`email-item-${index}`}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{email.sender}</span>
                        <span className="text-xs text-muted-foreground">• {timeAgo}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground">
                          {email.source}
                        </Badge>
                        {email.priority === "high" && (
                          <Badge variant="destructive" className="text-[10px] h-5 px-1.5 shadow-none">
                            High Priority
                          </Badge>
                        )}
                        {email.needsResponse && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-amber-600 border-amber-600">
                            Needs Response
                          </Badge>
                        )}
                        {email.aiAnalyzed && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-blue-600 border-blue-600">
                            AI Analyzed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <h4 className="font-medium text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                      {email.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
                      {email.aiAnalyzed ? (
                        <>
                          <span className="text-primary/60 font-medium text-xs uppercase tracking-wide mr-1">AI Summary:</span>
                          {email.summary}
                        </>
                      ) : (
                        email.summary
                      )}
                    </p>
                    {email.actionItems && email.actionItems.length > 0 && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                        <span className="font-medium text-foreground">Action Items:</span>
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                          {email.actionItems.slice(0, 3).map((item, idx) => (
                            <li key={idx} className="text-muted-foreground">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
                        Read full email <ExternalLink className="w-3 h-3" />
                      </button>
                      {email.needsResponse && (
                        <button className="text-xs font-medium text-amber-600 hover:text-amber-700">
                          Reply required
                        </button>
                      )}
                      <button className="text-xs font-medium text-muted-foreground hover:text-foreground">
                        Draft reply
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
