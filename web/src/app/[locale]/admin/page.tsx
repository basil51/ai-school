"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrganizationSwitcher from "@/components/OrganizationSwitcher";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: "student" | "teacher" | "guardian" | "admin" | "super_admin";
  organizationId: string | null;
  createdAt: string;
  organization?: {
    name: string;
    slug: string;
  };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: string;
  monthlyQuestions: number;
  monthlyDocuments: number;
  storageUsed: number;
  settings?: {
    maxUsers: number;
    maxDocuments: number;
    maxQuestionsPerMonth: number;
  };
}

interface Document {
  id: string;
  title: string;
  length: number;
  createdAt: string;
  chunks: { id: string }[];
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ email: "", name: "", role: "student" as const });

  // Check if user is admin or super_admin
  useEffect(() => {
    if (status === "loading") return;
    const userRole = (session as any)?.role;
    if (!session || (!["admin", "super_admin"].includes(userRole))) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    const userRole = (session as any)?.role;
    if (session && ["admin", "super_admin"].includes(userRole)) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [usersRes, docsRes, orgRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/documents"),
        fetch("/api/admin/organization")
      ]);
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
      
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData);
      }

      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setOrganization(orgData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      
      if (response.ok) {
        setNewUser({ email: "", name: "", role: "student" });
        fetchData();
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const deleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      const response = await fetch(`/api/admin/documents/${docId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "destructive";
      case "admin": return "destructive";
      case "teacher": return "default";
      case "guardian": return "secondary";
      case "student": return "outline";
      default: return "outline";
    }
  };

  if (status === "loading") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  const userRole = (session as any)?.role;
  if (!session || (!["admin", "super_admin"].includes(userRole))) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Access denied. Redirecting...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading admin panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Super Admin Organization Switcher */}
      {userRole === 'super_admin' && (
        <div className="mb-6">
          <OrganizationSwitcher 
            currentOrgId={organization?.id || null}
            compact={true}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-2 mt-1">
            {organization ? (
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">{organization.name}</span>
                <span className="mx-2">•</span>
                <span className="text-sm">{organization.tier.charAt(0).toUpperCase() + organization.tier.slice(1)} tier</span>
              </div>
            ) : (
              <p className="text-muted-foreground">
                {userRole === 'super_admin' ? 'System-wide administration' : 'Manage users and documents'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {userRole === 'super_admin' ? 'Super Admin' : 'Admin'}
          </Badge>
          {userRole === 'super_admin' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/super-admin/organizations')}
            >
              Manage Organizations
            </Button>
          )}
        </div>
      </div>

      {/* Organization Usage Overview */}
      {organization && organization.settings && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Usage</CardTitle>
            <CardDescription>Current usage against your {organization.tier} tier limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{users.length}</div>
                <div className="text-sm text-muted-foreground">
                  / {organization.settings.maxUsers} Users
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{documents.length}</div>
                <div className="text-sm text-muted-foreground">
                  / {organization.settings.maxDocuments} Documents
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{organization.monthlyQuestions || 0}</div>
                <div className="text-sm text-muted-foreground">
                  / {organization.settings.maxQuestionsPerMonth} Questions/Month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="guardians">Guardians</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Create and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Add New User</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>Add a new user to the system</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createUser} className="w-full">Create User</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Table className="mt-6">
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    {userRole === 'super_admin' && <TableHead>Organization</TableHead>}
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar>
                            <AvatarFallback>{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{user.name || "No name"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleColor(user.role)}>{user.role}</Badge>
                      </TableCell>
                      {userRole === 'super_admin' && (
                        <TableCell>
                          {user.organization ? (
                            <div className="text-sm">
                              <div className="font-medium">{user.organization.name}</div>
                              <div className="text-muted-foreground">/{user.organization.slug}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No organization</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>View and manage uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Chunks</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>{doc.length.toLocaleString()} chars</TableCell>
                      <TableCell>{doc.chunks.length} chunks</TableCell>
                      <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/admin/documents/${doc.id}`)}
                          >
                            Manage Chunks
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteDocument(doc.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guardians" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guardian Relationships</CardTitle>
              <CardDescription>Manage guardian-student relationships and email communications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Create and manage guardian-student relationships, send progress reports
                </p>
                <Button onClick={() => router.push('/admin/guardians')}>
                  Manage Guardian Relationships
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RAGAS Evaluations</CardTitle>
              <CardDescription>Quality metrics for the RAG system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  View detailed evaluation results and metrics
                </p>
                <Button onClick={() => window.open('/admin/evaluations', '_blank')}>
                  Open Evaluation Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Indexes</CardTitle>
              <CardDescription>Check status and rebuild vector/text indexes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/maintenance/indexes');
                    const data = await res.json();
                    alert(`Chunks: ${data.count}\nIndexes:\n${(data.indexes||[]).map((i:any)=>i.indexname).join('\n')}`);
                  } catch (e) { console.error(e); }
                }}>Status</Button>
                <Button onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/maintenance/indexes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: 'ivfflat', reindexGin: true }) });
                    const data = await res.json();
                    alert(`Rebuilt IVFFLAT (lists=${data.lists}) on ${data.count} chunks`);
                  } catch (e) { console.error(e); }
                }}>Rebuild IVFFLAT</Button>
                <Button variant="outline" onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/maintenance/indexes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: 'hnsw', m: 16, ef_construction: 64, reindexGin: true }) });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed');
                    alert('Rebuilt HNSW indexes');
                  } catch (e:any) { alert(e.message || 'HNSW not supported'); }
                }}>Rebuild HNSW</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
