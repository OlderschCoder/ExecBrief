import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MapPin, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface CalendarEvent {
  type: string;
  priority: string;
  source: string;
  title: string;
  summary: string;
  time: string;
  duration: string;
  timestamp: string;
  metadata: string;
}

export function ScheduleCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['briefing'],
    queryFn: async () => {
      const res = await fetch('/api/briefing');
      if (!res.ok) throw new Error('Failed to fetch briefing');
      return res.json();
    },
    refetchInterval: 60000,
  });

  const events: CalendarEvent[] = data?.schedule || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full"
    >
      <Card className="h-full border-border/50 shadow-sm bg-card/50 backdrop-blur-xl">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Today's Agenda
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] p-6">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center text-sm text-destructive">
                Failed to load calendar. Please check your Outlook connection.
              </div>
            ) : events.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">
                No events scheduled for today. Enjoy your free time!
              </div>
            ) : (
              <div className="space-y-6 relative">
                {/* Timeline Line */}
                <div className="absolute left-[65px] top-2 bottom-2 w-[1px] bg-border" />
                
                {events.map((event, index) => {
                  const eventTime = new Date(event.time);
                  const timeStr = eventTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  });
                  const isHighlight = index === 0;

                  return (
                    <div key={index} className="flex gap-6 relative group" data-testid={`event-item-${index}`}>
                      <div className="w-[50px] text-xs font-medium text-muted-foreground text-right pt-1 tabular-nums">
                        {timeStr}
                      </div>
                      
                      {/* Timeline Dot */}
                      <div className={`absolute left-[61px] mt-1.5 w-2.5 h-2.5 rounded-full border-2 border-background z-10 ${isHighlight ? 'bg-amber-500 scale-125' : 'bg-muted-foreground/30'}`} />
                      
                      <div className={`flex-1 rounded-lg p-3 -mt-2 transition-all hover:bg-muted/50 ${isHighlight ? 'bg-amber-50/50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30' : ''}`}>
                        <h4 className={`font-semibold text-sm ${isHighlight ? 'text-amber-900 dark:text-amber-100' : 'text-foreground'}`}>
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{event.duration}</span>
                          <span className="text-border mx-1">|</span>
                          <MapPin className="w-3 h-3" />
                          <span>{event.summary || 'No location'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
