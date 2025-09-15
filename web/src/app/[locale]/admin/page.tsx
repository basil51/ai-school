"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
import AttendanceManagement from "@/components/AttendanceManagement";
import { LessonPlanViewer } from "@/components/LessonPlanViewer";
import { AssignmentCreator } from "@/components/AssignmentCreator";
import { useTranslations } from "@/lib/useTranslations";

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

function AdminPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { dict, loading: dictLoading } = useTranslations();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
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
      router.push(`/${locale}/dashboard`);
    }
  }, [session, status, router, locale]);

  const fetchData = useCallback(async () => {
    try {
      const userRole = (session as any)?.role;
      const isSuperAdmin = userRole === 'super_admin';
      
      // Get organization ID directly from URL parameters
      const orgId = searchParams.get('org');
      
      // Build API URLs with organization context
      const usersUrl = orgId && isSuperAdmin 
        ? `/api/admin/users?organizationId=${orgId}`
        : "/api/admin/users";
      const docsUrl = orgId && isSuperAdmin 
        ? `/api/admin/documents?organizationId=${orgId}`
        : "/api/admin/documents";
      const orgUrl = orgId && isSuperAdmin 
        ? `/api/super-admin/organizations/${orgId}`
        : "/api/admin/organization";

      const [usersRes, docsRes, orgRes] = await Promise.all([
        fetch(usersUrl),
        fetch(docsUrl),
        fetch(orgUrl)
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
  }, [session, searchParams]);

  useEffect(() => {
    const userRole = (session as any)?.role;
    if (session && ["admin", "super_admin"].includes(userRole)) {
      fetchData();
    }
  }, [session, fetchData]);

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
    if (!confirm(dict?.admin?.confirmDeleteUser || "Are you sure you want to delete this user?")) return;
    
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
    if (!confirm(dict?.admin?.confirmDeleteDocument || "Are you sure you want to delete this document?")) return;
    
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

  const getRoleDisplay = (role: string) => {
    return dict?.roles?.[role] || role;
  };

  const handleOrganizationChange = (orgId: string | null) => {
    if (orgId) {
      router.push(`/${locale}/admin?org=${orgId}`);
    } else {
      router.push(`/${locale}/admin`);
    }
  };

  if (status === "loading" || dictLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{dict?.admin?.loading || "Loading..."}</div>
        </div>
      </div>
    );
  }

  const userRole = (session as any)?.role;
  if (!session || (!["admin", "super_admin"].includes(userRole))) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{dict?.admin?.accessDenied || "Access denied. Redirecting..."}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{dict?.admin?.loadingAdminPanel || "Loading admin panel..."}</div>
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
                      currentOrgId={searchParams.get('org') || organization?.id || null}
                      onOrganizationChange={handleOrganizationChange}
                      compact={true}
                    />
                  </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{dict?.admin?.title || "Admin Panel"}</h1>
          <div className="flex items-center gap-2 mt-1">
            {organization ? (
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">{organization.name}</span>
                <span className="mx-2">•</span>
                <span className="text-sm">{organization.tier.charAt(0).toUpperCase() + organization.tier.slice(1)} {dict?.admin?.tier || "tier"}</span>
              </div>
            ) : (
              <p className="text-muted-foreground">
                {userRole === 'super_admin' ? (dict?.admin?.systemWideAdministration || 'System-wide administration') : (dict?.admin?.manageUsersAndDocuments || 'Manage users and documents')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {userRole === 'super_admin' ? (dict?.admin?.superAdmin || 'Super Admin') : (dict?.admin?.admin || 'Admin')}
          </Badge>
          {userRole === 'super_admin' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push(`/${locale}/super-admin/organizations`)}
            >
              {dict?.admin?.manageOrganizations || "Manage Organizations"}
            </Button>
          )}
        </div>
      </div>

      {/* Organization Usage Overview */}
      {organization && organization.settings && (
        <Card>
          <CardHeader>
            <CardTitle>{dict?.admin?.organizationUsage || "Organization Usage"}</CardTitle>
            <CardDescription>
              {(dict?.admin?.organizationUsageDescription || "Current usage against your {tier} tier limits").replace('{tier}', organization.tier)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{users.length}</div>
                <div className="text-sm text-muted-foreground">
                  / {organization.settings.maxUsers} {dict?.admin?.users || "Users"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{documents.length}</div>
                <div className="text-sm text-muted-foreground">
                  / {organization.settings.maxDocuments} {dict?.admin?.documents || "Documents"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{organization.monthlyQuestions || 0}</div>
                <div className="text-sm text-muted-foreground">
                  / {organization.settings.maxQuestionsPerMonth} {dict?.admin?.questionsPerMonth || "Questions/Month"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">{dict?.admin?.users || "Users"} ({users.length})</TabsTrigger>
          <TabsTrigger value="documents">{dict?.admin?.documents || "Documents"} ({documents.length})</TabsTrigger>
          <TabsTrigger value="attendance">{dict?.admin?.attendance || "Attendance"}</TabsTrigger>
          <TabsTrigger value="grades">{dict?.admin?.grades || "Grades"}</TabsTrigger>
          <TabsTrigger value="guardians">{dict?.admin?.guardians || "Guardians"}</TabsTrigger>
          <TabsTrigger value="evaluations">{dict?.admin?.evaluations || "Evaluations"}</TabsTrigger>
          <TabsTrigger value="lesson-plans">Lesson Plans</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="maintenance">{dict?.admin?.indexes || "Maintenance"}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dict?.admin?.userManagement || "User Management"}</CardTitle>
              <CardDescription>{dict?.admin?.userManagementDescription || "Create and manage user accounts"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>{dict?.admin?.addUser || "Add New User"}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{dict?.admin?.createNewUser || "Create New User"}</DialogTitle>
                    <DialogDescription>{dict?.admin?.createNewUserDescription || "Add a new user to the system"}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">{dict?.admin?.email || "Email"}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder={dict?.admin?.emailPlaceholder || "user@example.com"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">{dict?.admin?.name || "Name"}</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder={dict?.admin?.fullName || "Full Name"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">{dict?.admin?.userRole || "Role"}</Label>
                      <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">{dict?.roles?.student || "Student"}</SelectItem>
                          <SelectItem value="teacher">{dict?.roles?.teacher || "Teacher"}</SelectItem>
                          <SelectItem value="guardian">{dict?.roles?.guardian || "Guardian"}</SelectItem>
                          <SelectItem value="admin">{dict?.roles?.admin || "Admin"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createUser} className="w-full">{dict?.admin?.createUser || "Create User"}</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Table className="mt-6">
                <TableHeader>
                  <TableRow>
                    <TableHead>{dict?.admin?.users || "User"}</TableHead>
                    <TableHead>{dict?.admin?.email || "Email"}</TableHead>
                    <TableHead>{dict?.admin?.userRole || "Role"}</TableHead>
                    {userRole === 'super_admin' && <TableHead>{dict?.admin?.organization || "Organization"}</TableHead>}
                    <TableHead>{dict?.admin?.createdAt || "Created"}</TableHead>
                    <TableHead>{dict?.admin?.actions || "Actions"}</TableHead>
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
                          <span>{user.name || (dict?.admin?.noName || "No name")}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleColor(user.role)}>{getRoleDisplay(user.role)}</Badge>
                      </TableCell>
                      {userRole === 'super_admin' && (
                        <TableCell>
                          {user.organization ? (
                            <div className="text-sm">
                              <div className="font-medium">{user.organization.name}</div>
                              <div className="text-muted-foreground">/{user.organization.slug}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">{dict?.admin?.noOrganization || "No organization"}</span>
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
                          {dict?.admin?.delete || "Delete"}
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
              <CardTitle>{dict?.admin?.documentManagement || "Document Management"}</CardTitle>
              <CardDescription>{dict?.admin?.documentManagementDescription || "View and manage uploaded documents"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dict?.admin?.title || "Title"}</TableHead>
                    <TableHead>{dict?.admin?.size || "Size"}</TableHead>
                    <TableHead>{dict?.admin?.chunks || "Chunks"}</TableHead>
                    <TableHead>{dict?.admin?.uploaded || "Uploaded"}</TableHead>
                    <TableHead>{dict?.admin?.actions || "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>{doc.length.toLocaleString()} {dict?.admin?.chars || "chars"}</TableCell>
                      <TableCell>{doc.chunks.length} {dict?.admin?.chunks || "chunks"}</TableCell>
                      <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/${locale}/admin/documents/${doc.id}`)}
                          >
                            {dict?.admin?.manageChunks || "Manage Chunks"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteDocument(doc.id)}
                          >
                            {dict?.admin?.delete || "Delete"}
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

        <TabsContent value="attendance" className="space-y-4">
          {organization ? (
            <AttendanceManagement 
              organizationId={searchParams.get('org') || organization.id} 
              className="space-y-6"
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{dict?.admin?.attendance || "Attendance Management"}</CardTitle>
                <CardDescription>{dict?.admin?.attendanceDescription || "Track and manage student attendance"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    {dict?.admin?.selectOrganization || "Please select an organization to manage attendance"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dict?.admin?.grades || "Grades Management"}</CardTitle>
              <CardDescription>{dict?.admin?.gradesDescription || "Manage assignments, grades, and student performance"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {dict?.admin?.gradesComingSoon || "Grades management system coming soon"}
                </p>
                <Button disabled>
                  {dict?.admin?.comingSoon || "Coming Soon"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guardians" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dict?.admin?.guardianRelationships || "Guardian Relationships"}</CardTitle>
              <CardDescription>{dict?.admin?.guardianRelationshipsDescription || "Manage guardian-student relationships and email communications"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {dict?.admin?.createAndManage || "Create and manage guardian-student relationships, send progress reports"}
                </p>
                <Button onClick={() => router.push(`/${locale}/admin/guardians`)}>
                  {dict?.admin?.manageGuardianRelationships || "Manage Guardian Relationships"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dict?.admin?.ragasEvaluations || "RAGAS Evaluations"}</CardTitle>
              <CardDescription>{dict?.admin?.ragasEvaluationsDescription || "Quality metrics for the RAG system"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {dict?.admin?.viewDetailedResults || "View detailed evaluation results and metrics"}
                </p>
                <Button onClick={() => window.open(`/${locale}/admin/evaluations`, '_blank')}>
                  {dict?.admin?.openEvaluationDashboard || "Open Evaluation Dashboard"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lesson-plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Plans</CardTitle>
              <CardDescription>View and manage lesson plans with AI assistance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Sample Lesson Plan</h3>
                  <LessonPlanViewer 
                    lessonPlan={{
                      id: "sample-1",
                      title: "Introduction to Algebra",
                      subject: "Mathematics",
                      gradeLevel: "Grade 8",
                      duration: 45,
                      objectives: [
                        "Understand basic algebraic expressions",
                        "Solve simple linear equations",
                        "Apply algebraic concepts to real-world problems"
                      ],
                      content: "This lesson introduces students to the fundamental concepts of algebra. We'll start with basic expressions and gradually move to solving simple equations. Students will learn how to translate word problems into mathematical expressions and solve them step by step.",
                      activities: [
                        "Warm-up: Review of arithmetic operations",
                        "Introduction to variables and expressions",
                        "Guided practice with simple equations",
                        "Group work on word problems",
                        "Individual assessment"
                      ],
                      assessment: "Students will complete a worksheet with 10 problems covering expressions and simple equations. They will also solve 2 word problems to demonstrate understanding.",
                      prerequisites: ["Basic arithmetic", "Understanding of variables"],
                      status: "ai_generated",
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      createdBy: {
                        id: "ai-teacher",
                        name: "AI Teacher",
                        role: "teacher"
                      },
                      aiGenerated: true,
                      aiSuggestions: [
                        "Consider adding visual aids for visual learners",
                        "Include more real-world examples",
                        "Add peer tutoring opportunities"
                      ]
                    }}
                    onEdit={(lessonPlan) => {
                      console.log("Edit lesson plan:", lessonPlan);
                      alert("Edit functionality coming soon!");
                    }}
                    onApprove={(lessonPlanId) => {
                      console.log("Approve lesson plan:", lessonPlanId);
                      alert("Lesson plan approved!");
                    }}
                    onReject={(lessonPlanId) => {
                      console.log("Reject lesson plan:", lessonPlanId);
                      alert("Lesson plan rejected!");
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Create New Lesson Plan</h3>
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-muted-foreground mb-4">
                      Lesson plan creation interface coming soon
                    </p>
                    <Button disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>Create and manage assignments with AI assistance</CardDescription>
            </CardHeader>
            <CardContent>
              <AssignmentCreator 
                onSave={(assignment) => {
                  console.log("Save assignment:", assignment);
                  alert("Assignment saved successfully!");
                }}
                onCancel={() => {
                  console.log("Cancel assignment creation");
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dict?.admin?.indexes || "Indexes"}</CardTitle>
              <CardDescription>{dict?.admin?.indexesDescription || "Check status and rebuild vector/text indexes"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/maintenance/indexes');
                    const data = await res.json();
                    alert(`Chunks: ${data.count}\nIndexes:\n${(data.indexes||[]).map((i:any)=>i.indexname).join('\n')}`);
                  } catch (e) { console.error(e); }
                }}>{dict?.admin?.status || "Status"}</Button>
                <Button onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/maintenance/indexes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: 'ivfflat', reindexGin: true }) });
                    const data = await res.json();
                    alert(`Rebuilt IVFFLAT (lists=${data.lists}) on ${data.count} chunks`);
                  } catch (e) { console.error(e); }
                }}>{dict?.admin?.rebuildIvfflat || "Rebuild IVFFLAT"}</Button>
                <Button variant="outline" onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/maintenance/indexes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method: 'hnsw', m: 16, ef_construction: 64, reindexGin: true }) });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed');
                    alert('Rebuilt HNSW indexes');
                  } catch (e:any) { alert(e.message || 'HNSW not supported'); }
                }}>{dict?.admin?.rebuildHnsw || "Rebuild HNSW"}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPageContent />
    </Suspense>
  );
}
