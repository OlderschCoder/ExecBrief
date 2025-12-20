import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, Settings, Mail, Shield, Building2, Plus, Search, 
  MoreHorizontal, Edit, Trash2, CheckCircle2, XCircle, 
  Clock, AlertCircle, RefreshCw, Download, Upload, Link2,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Check admin access
  const { data: accessData, isLoading: accessLoading, error: accessError } = useQuery({
    queryKey: ['admin', 'access-check'],
    queryFn: async () => {
      const res = await fetch('/api/admin/access-check');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Access denied');
        }
        throw new Error('Failed to check access');
      }
      return res.json();
    },
    retry: false
  });

  // Show access denied page if not authorized
  if (accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (accessError || !accessData?.hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel. 
              This area is restricted to administrators and managers only.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation('/')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch organizations
  const { data: organizations } = useQuery({
    queryKey: ['admin', 'organizations'],
    queryFn: async () => {
      const res = await fetch('/api/admin/organizations');
      if (!res.ok) throw new Error('Failed to fetch organizations');
      return res.json();
    }
  });

  const currentOrg = organizations?.[0];

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return null;
      const res = await fetch(`/api/admin/stats/${currentOrg.id}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: !!currentOrg
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', currentOrg?.id, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentOrg) params.set('organizationId', currentOrg.id.toString());
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: !!currentOrg
  });

  // Fetch roles
  const { data: roles } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    }
  });

  // Fetch policies
  const { data: policies } = useQuery({
    queryKey: ['admin', 'policies', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const res = await fetch(`/api/admin/policies/${currentOrg.id}`);
      if (!res.ok) throw new Error('Failed to fetch policies');
      return res.json();
    },
    enabled: !!currentOrg
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User updated successfully' });
    }
  });

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-primary">
              Briefing<span className="text-amber-600">.ai</span>
              <span className="text-muted-foreground font-normal ml-2">Admin</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentOrg?.name || 'Loading...'} ({currentOrg?.domain})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <a href="/">View Dashboard</a>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="overview" className="gap-2">
              <Building2 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Link2 className="w-4 h-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-2">
              <Shield className="w-4 h-4" />
              Policies
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Users</CardDescription>
                  <CardTitle className="text-3xl">{stats?.totalUsers || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {stats?.activeUsers || 0} active
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Integrations</CardDescription>
                  <CardTitle className="text-3xl">{stats?.activeIntegrations || 0}/{stats?.totalIntegrations || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    active connections
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Briefing Policies</CardDescription>
                  <CardTitle className="text-3xl">{stats?.totalPolicies || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    configured schedules
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Organization</CardDescription>
                  <CardTitle className="text-lg">{currentOrg?.name || '-'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {currentOrg?.domain}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab('users')}>
                  <Plus className="w-5 h-5" />
                  <span>Add User</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab('integrations')}>
                  <Mail className="w-5 h-5" />
                  <span>Connect Email</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab('policies')}>
                  <Shield className="w-5 h-5" />
                  <span>Configure Policy</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Upload className="w-5 h-5" />
                  <span>Bulk Import</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search users by name or email..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-users"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <AddUserDialog organizationId={currentOrg?.id} roles={roles || []} />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Email Accounts</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : usersData?.users?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      usersData?.users?.map((user: any) => (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {roles?.find((r: any) => r.id === user.roleId)?.name || 'User'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.department || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {user.emailAccounts?.length || 0} accounts
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <EditUserDialog user={user} roles={roles || []} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <IntegrationCard 
                provider="outlook"
                name="Microsoft Outlook"
                description="Connect Outlook accounts for email and calendar sync"
                icon={<Mail className="w-6 h-6" />}
                color="bg-blue-100 text-blue-600"
                isConnected={true}
              />
              <IntegrationCard 
                provider="gmail"
                name="Gmail"
                description="Connect Gmail accounts for email sync"
                icon={<Mail className="w-6 h-6" />}
                color="bg-red-100 text-red-600"
                isConnected={false}
              />
              <IntegrationCard 
                provider="teams"
                name="Microsoft Teams"
                description="Enable Teams notifications and calendar integration"
                icon={<Mail className="w-6 h-6" />}
                color="bg-purple-100 text-purple-600"
                isConnected={false}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Email Accounts</CardTitle>
                <CardDescription>Manage email accounts assigned to users</CardDescription>
              </CardHeader>
              <CardContent>
                <EmailAccountsTable organizationId={currentOrg?.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Briefing Policies</h2>
                <p className="text-sm text-muted-foreground">Configure when and how briefings are generated</p>
              </div>
              <AddPolicyDialog organizationId={currentOrg?.id} />
            </div>

            <div className="grid gap-4">
              {policies?.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No policies configured. Create your first briefing policy.
                  </CardContent>
                </Card>
              ) : (
                policies?.map((policy: any) => (
                  <PolicyCard key={policy.id} policy={policy} />
                ))
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>Configure global settings for {currentOrg?.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>AI Summarization</Label>
                      <p className="text-sm text-muted-foreground">Enable AI-powered email summaries</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send briefings via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require MFA</Label>
                      <p className="text-sm text-muted-foreground">Require multi-factor authentication for all users</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Default Timezone</Label>
                  <Select defaultValue="America/New_York">
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Retention (days)</Label>
                  <Input type="number" defaultValue="90" className="max-w-xs" />
                  <p className="text-xs text-muted-foreground">How long to keep briefing history</p>
                </div>

                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Sub-components

function AddUserDialog({ organizationId, roles }: { organizationId?: number; roles: any[] }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    department: '',
    roleId: '',
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, organizationId, isActive: true })
      });
      if (!res.ok) throw new Error('Failed to create user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast({ title: 'User created successfully' });
      setOpen(false);
      setFormData({ name: '', email: '', title: '', department: '', roleId: '' });
    },
    onError: (error: any) => {
      toast({ title: 'Error creating user', description: error.message, variant: 'destructive' });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-user">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user account for the briefing system</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              data-testid="input-user-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email"
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.doe@sccc.edu"
              data-testid="input-user-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input 
              id="title" 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Director of IT"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input 
              id="department" 
              value={formData.department} 
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Information Technology"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.roleId} onValueChange={(val) => setFormData({ ...formData, roleId: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role: any) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => createUserMutation.mutate({ 
              ...formData, 
              roleId: formData.roleId ? parseInt(formData.roleId) : undefined 
            })}
            disabled={!formData.name || !formData.email}
            data-testid="button-save-user"
          >
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user, roles }: { user: any; roles: any[] }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    title: user.title || '',
    department: user.department || '',
    roleId: user.roleId?.toString() || '',
    isActive: user.isActive,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User updated successfully' });
      setOpen(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input 
              id="edit-name" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-title">Job Title</Label>
            <Input 
              id="edit-title" 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-department">Department</Label>
            <Input 
              id="edit-department" 
              value={formData.department} 
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select value={formData.roleId} onValueChange={(val) => setFormData({ ...formData, roleId: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role: any) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-active">Active</Label>
            <Switch 
              id="edit-active" 
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => updateUserMutation.mutate({
            ...formData,
            roleId: formData.roleId ? parseInt(formData.roleId) : undefined
          })}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IntegrationCard({ 
  provider, 
  name, 
  description, 
  icon, 
  color, 
  isConnected 
}: { 
  provider: string; 
  name: string; 
  description: string; 
  icon: React.ReactNode; 
  color: string; 
  isConnected: boolean 
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
            {icon}
          </div>
          {isConnected ? (
            <Badge className="bg-green-100 text-green-800">Connected</Badge>
          ) : (
            <Badge variant="outline">Not Connected</Badge>
          )}
        </div>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button className="w-full" size="sm">
            Connect {name}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function EmailAccountsTable({ organizationId }: { organizationId?: number }) {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['admin', 'email-accounts', organizationId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (organizationId) params.set('organizationId', organizationId.toString());
      const res = await fetch(`/api/admin/email-accounts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch email accounts');
      return res.json();
    },
    enabled: !!organizationId
  });

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading email accounts...</div>;
  }

  if (!accounts?.length) {
    return <div className="py-8 text-center text-muted-foreground">No email accounts configured</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Sync Status</TableHead>
          <TableHead>Last Synced</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account: any) => (
          <TableRow key={account.id}>
            <TableCell>{account.email}</TableCell>
            <TableCell>
              <Badge variant="outline">{account.provider}</Badge>
            </TableCell>
            <TableCell>{account.accountType}</TableCell>
            <TableCell>
              {account.syncStatus === 'synced' ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Synced
                </Badge>
              ) : account.syncStatus === 'error' ? (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Error
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {account.lastSyncedAt ? new Date(account.lastSyncedAt).toLocaleString() : 'Never'}
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AddPolicyDialog({ organizationId }: { organizationId?: number }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scheduleType: 'daily',
    scheduleTime: '07:00',
    timezone: 'America/New_York',
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPolicyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, organizationId, isActive: true })
      });
      if (!res.ok) throw new Error('Failed to create policy');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'policies'] });
      toast({ title: 'Policy created successfully' });
      setOpen(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Policy
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Briefing Policy</DialogTitle>
          <DialogDescription>Define when and how briefings are generated</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Policy Name</Label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Morning Executive Briefing"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Daily briefing for executive team"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Schedule Type</Label>
              <Select value={formData.scheduleType} onValueChange={(val) => setFormData({ ...formData, scheduleType: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="realtime">Real-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input 
                type="time" 
                value={formData.scheduleTime}
                onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={formData.timezone} onValueChange={(val) => setFormData({ ...formData, timezone: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => createPolicyMutation.mutate(formData)} disabled={!formData.name}>
            Create Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PolicyCard({ policy }: { policy: any }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{policy.name}</CardTitle>
            <CardDescription>{policy.description || 'No description'}</CardDescription>
          </div>
          <div className="flex gap-2">
            {policy.isDefault && <Badge variant="secondary">Default</Badge>}
            {policy.isActive ? (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            ) : (
              <Badge variant="outline">Inactive</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{policy.scheduleTime} ({policy.timezone})</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span className="capitalize">{policy.scheduleType}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
