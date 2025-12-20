import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Video, CheckCircle2, RotateCw, AlertCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function IntegrationsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['briefing'],
    queryFn: async () => {
      const res = await fetch('/api/briefing');
      if (!res.ok) throw new Error('Failed to fetch briefing');
      return res.json();
    },
  });

  const user = data?.user;
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'MB';

  return (
    <Card className="p-4 bg-muted/30 border-none">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-12 w-12 border-2 border-background shadow-sm bg-primary text-primary-foreground">
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-serif font-semibold text-foreground">
            {user?.name || 'Loading...'}
          </h3>
          <p className="text-xs text-muted-foreground">{user?.title || 'Chief Information Officer'}</p>
          <p className="text-[10px] text-muted-foreground">{user?.email}</p>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-background" data-testid="button-refresh">
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Integrations</h4>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Outlook</div>
              <div className="text-[10px] text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </div>
            </div>
          </div>
          <Switch checked={true} disabled />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50 shadow-sm opacity-60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Gmail</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Not connected
              </div>
            </div>
          </div>
          <Switch checked={false} disabled />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50 shadow-sm opacity-60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Teams</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Not connected
              </div>
            </div>
          </div>
          <Switch checked={false} disabled />
        </div>
      </div>
    </Card>
  );
}
