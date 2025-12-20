import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, AlertCircle, ExternalLink, Bot } from "lucide-react";
import { motion } from "framer-motion";

const emails = [
  {
    sender: "Dean of Engineering",
    subject: "Urgent: Server Outage in Research Lab",
    summary: "Reports that the main compute cluster is unresponsive. Grant deadline is tomorrow.",
    priority: "high",
    source: "Outlook",
    time: "10m ago"
  },
  {
    sender: "Campus Safety",
    subject: "Security Protocol Update",
    summary: "New access card policies affecting IT staff access to server rooms.",
    priority: "medium",
    source: "Gmail",
    time: "45m ago"
  },
  {
    sender: "CFO Office",
    subject: "Q1 Budget Revisions Required",
    summary: "Requesting 10% reduction in software licensing costs by Friday.",
    priority: "high",
    source: "Outlook",
    time: "1h ago"
  }
];

export function PriorityInbox() {
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
          <div className="divide-y divide-border/40">
            {emails.map((email, index) => (
              <div key={index} className="p-4 hover:bg-muted/30 transition-colors group cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{email.sender}</span>
                    <span className="text-xs text-muted-foreground">• {email.time}</span>
                  </div>
                  <div className="flex gap-2">
                     <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground">
                      {email.source}
                    </Badge>
                    {email.priority === "high" && (
                      <Badge variant="destructive" className="text-[10px] h-5 px-1.5 shadow-none">
                        High Priority
                      </Badge>
                    )}
                  </div>
                </div>
                <h4 className="font-medium text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                  {email.subject}
                </h4>
                <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
                  <span className="text-primary/60 font-medium text-xs uppercase tracking-wide mr-1">AI Summary:</span>
                  {email.summary}
                </p>
                <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
                     Read full email <ExternalLink className="w-3 h-3" />
                   </button>
                   <button className="text-xs font-medium text-muted-foreground hover:text-foreground">
                     Draft reply
                   </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
