import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const events = [
  {
    time: "09:00 AM",
    title: "IT Infrastructure Review",
    location: "Conference Room B",
    type: "meeting",
    duration: "1h"
  },
  {
    time: "10:30 AM",
    title: "Vendor Negotiation: Cloud Services",
    location: "Zoom",
    type: "call",
    duration: "45m"
  },
  {
    time: "02:00 PM",
    title: "Board of Trustees: Q4 Tech Strategy",
    location: "Executive Boardroom",
    type: "presentation",
    duration: "2h",
    highlight: true
  },
  {
    time: "04:30 PM",
    title: "1:1 with Director of Security",
    location: "Office",
    type: "meeting",
    duration: "30m"
  }
];

export function ScheduleCard() {
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
            <div className="space-y-6 relative">
              {/* Timeline Line */}
              <div className="absolute left-[65px] top-2 bottom-2 w-[1px] bg-border" />
              
              {events.map((event, index) => (
                <div key={index} className="flex gap-6 relative group">
                  <div className="w-[50px] text-xs font-medium text-muted-foreground text-right pt-1 tabular-nums">
                    {event.time}
                  </div>
                  
                  {/* Timeline Dot */}
                  <div className={`absolute left-[61px] mt-1.5 w-2.5 h-2.5 rounded-full border-2 border-background z-10 ${event.highlight ? 'bg-amber-500 scale-125' : 'bg-muted-foreground/30'}`} />
                  
                  <div className={`flex-1 rounded-lg p-3 -mt-2 transition-all hover:bg-muted/50 ${event.highlight ? 'bg-amber-50/50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30' : ''}`}>
                    <h4 className={`font-semibold text-sm ${event.highlight ? 'text-amber-900 dark:text-amber-100' : 'text-foreground'}`}>
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{event.duration}</span>
                      <span className="text-border mx-1">|</span>
                      <MapPin className="w-3 h-3" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
