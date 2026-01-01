import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

export function DailySummary() {
  const { data } = useQuery({
    queryKey: ['briefing'],
    queryFn: async () => {
      const res = await fetch('/api/briefing');
      if (!res.ok) throw new Error('Failed to fetch briefing');
      return res.json();
    },
    refetchInterval: 60000,
  });

  const user = data?.user;
  const emailCount = data?.emails?.length || 0;
  const highPriorityCount = data?.emails?.filter((e: any) => e.priority === 'high')?.length || 0;
  const needsResponseCount = data?.emails?.filter((e: any) => e.needsResponse)?.length || 0;
  const eventCount = data?.schedule?.length || 0;
  const ticketCount = data?.tickets?.length || 0;
  const quoteOfTheDay = data?.quoteOfTheDay;

  const firstName = user?.name?.split(' ')[0] || 'there';
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="h-full border-none shadow-lg bg-gradient-to-br from-primary to-[#1e293b] text-primary-foreground overflow-hidden relative">
        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <CardHeader className="relative z-10 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2 text-primary-foreground/70 text-sm font-medium tracking-wide uppercase">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Executive Summary</span>
              </div>
              <CardTitle className="text-3xl font-serif font-light leading-tight">
                {greeting}, {firstName}
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-primary-foreground/20 text-primary-foreground backdrop-blur-md">
              {today}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4 pt-2">
          {quoteOfTheDay && (
            <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-400/30 backdrop-blur-sm" data-testid="quote-of-the-day">
              <div className="flex items-start gap-2">
                <Quote className="w-4 h-4 text-amber-300 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-primary-foreground/90 italic">"{quoteOfTheDay.text}"</p>
                  {quoteOfTheDay.author && (
                    <p className="text-xs text-amber-300 mt-1">— {quoteOfTheDay.author}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <p className="text-base text-primary-foreground/90 font-light leading-relaxed">
            You have <span className="font-semibold text-amber-300">{eventCount} meetings</span> scheduled today and <span className="font-semibold text-amber-300">{emailCount} new emails</span> in your inbox{highPriorityCount > 0 ? `, including ${highPriorityCount} high-priority messages` : ''}{needsResponseCount > 0 ? ` with ${needsResponseCount} requiring your response` : ''}{ticketCount > 0 ? ` and ${ticketCount} open tickets` : ''}.
          </p>

          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors cursor-pointer group" data-testid="stat-emails">
              <div className="text-xl font-bold mb-1">{emailCount}</div>
              <div className="text-xs text-primary-foreground/70 flex items-center justify-between">
                New Emails
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors cursor-pointer group" data-testid="stat-priority">
              <div className="text-xl font-bold mb-1">{highPriorityCount}</div>
              <div className="text-xs text-primary-foreground/70 flex items-center justify-between">
                High Priority
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors cursor-pointer group" data-testid="stat-needs-response">
              <div className="text-xl font-bold mb-1">{needsResponseCount}</div>
              <div className="text-xs text-primary-foreground/70 flex items-center justify-between">
                Need Response
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors cursor-pointer group" data-testid="stat-tickets">
              <div className="text-xl font-bold mb-1">{ticketCount}</div>
              <div className="text-xs text-primary-foreground/70 flex items-center justify-between">
                Tickets
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
