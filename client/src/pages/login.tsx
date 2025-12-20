import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Shield, User } from "lucide-react";

export default function LoginPage() {
  const [loginMode, setLoginMode] = useState<'outlook' | 'impersonate'>('outlook');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const res = await fetch('/api/briefing');
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    }
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users-list'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users?limit=100');
      if (!res.ok) return { users: [] };
      return res.json();
    },
    enabled: currentUser?.roleName === 'admin' || currentUser?.roleName === 'manager'
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) throw new Error('Failed to impersonate');
      return res.json();
    },
    onSuccess: () => {
      window.location.href = '/';
    }
  });

  const handleOutlookLogin = () => {
    window.location.href = '/';
  };

  const handleImpersonate = () => {
    if (selectedUserId) {
      impersonateMutation.mutate(selectedUserId);
    }
  };

  const isAdmin = currentUser?.roleName === 'admin' || currentUser?.roleName === 'manager';

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-primary">
            Briefing<span className="text-amber-600">.ai</span>
          </h1>
          <p className="text-muted-foreground mt-2">Executive Intelligence Agent</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your personalized executive briefing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentUser ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {currentUser.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{currentUser.name}</p>
                      <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full" onClick={() => window.location.href = '/'} data-testid="button-continue">
                  <User className="w-4 h-4 mr-2" />
                  Continue as {currentUser.name?.split(' ')[0]}
                </Button>

                {isAdmin && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Admin Options</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Login as another user</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger data-testid="select-impersonate-user">
                          <SelectValue placeholder="Select a user to view their briefing" />
                        </SelectTrigger>
                        <SelectContent>
                          {users?.users?.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={handleImpersonate}
                        disabled={!selectedUserId || impersonateMutation.isPending}
                        data-testid="button-impersonate"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {impersonateMutation.isPending ? 'Switching...' : 'View as Selected User'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Button className="w-full" size="lg" onClick={handleOutlookLogin} data-testid="button-outlook-login">
                  <Mail className="w-4 h-4 mr-2" />
                  Sign in with Outlook
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Your Outlook credentials authenticate you automatically through the platform integration.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Suffolk County Community College
        </p>
      </div>
    </div>
  );
}
