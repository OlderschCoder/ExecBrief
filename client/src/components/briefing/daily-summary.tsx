import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export function DailySummary() {
  const [isPlaying, setIsPlaying] = useState(false);

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
                Good morning, Mark
              </CardTitle>
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all text-xs font-medium uppercase tracking-wider"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {isPlaying ? "Pause Briefing" : "Play Briefing"}
                </button>
                <Badge variant="outline" className="border-primary-foreground/20 text-primary-foreground backdrop-blur-md">
                  Dec 20, 2025
                </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6 pt-4">
          <p className="text-lg text-primary-foreground/90 font-light leading-relaxed">
            Your schedule is heavy on strategic planning today. The <span className="font-semibold text-amber-300">Board of Trustees</span> meeting at 2:00 PM is the priority. Three urgent emails from the Faculty Senate regarding the LMS migration require your attention before noon.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors cursor-pointer group">
              <div className="text-2xl font-bold mb-1">94%</div>
              <div className="text-sm text-primary-foreground/70 flex items-center justify-between">
                System Uptime
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors cursor-pointer group">
              <div className="text-2xl font-bold mb-1">3</div>
              <div className="text-sm text-primary-foreground/70 flex items-center justify-between">
                Critical Alerts
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
