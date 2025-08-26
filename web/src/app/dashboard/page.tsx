"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  BookOpen, 
  Users, 
  Settings, 
  LogOut, 
  GraduationCap, 
  FileText,
  BarChart3
} from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = (session as any).role;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "teacher": return "default";
      case "guardian": return "secondary";
      case "student": return "outline";
      default: return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Settings className="h-4 w-4" />;
      case "teacher": return <GraduationCap className="h-4 w-4" />;
      case "guardian": return <Users className="h-4 w-4" />;
      case "student": return <BookOpen className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-end">
          <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {session.user?.name?.charAt(0) || session.user?.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {session.user?.name || session.user?.email}
                  </div>
                  <Badge variant={getRoleColor(userRole)} className="text-xs">
                    {getRoleIcon(userRole)}
                    <span className="ml-1">{userRole}</span>
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => signOut({ callbackUrl: "/signin" })}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* AI Tutor Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  AI Tutor
                </CardTitle>
                <CardDescription>
                  Start learning with our AI-powered tutor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/tutor">
                  <Button className="w-full">
                    Start Learning
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* RAG Upload Card - Teacher/Admin only */}
            {(userRole === "teacher" || userRole === "admin") && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Upload Content
                  </CardTitle>
                  <CardDescription>
                    Upload educational materials for the AI tutor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/rag">
                    <Button className="w-full" variant="outline">
                      Upload Documents
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Admin Panel Card - Admin only */}
            {userRole === "admin" && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Admin Panel
                  </CardTitle>
                  <CardDescription>
                    Manage users and system settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin">
                    <Button className="w-full" variant="outline">
                      Manage System
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Analytics Card - Admin/Teacher only */}
            {(userRole === "admin" || userRole === "teacher") && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Analytics
                  </CardTitle>
                  <CardDescription>
                    View learning analytics and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your profile and account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{session.user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900">{session.user?.name || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={getRoleColor(userRole)}>
                      {getRoleIcon(userRole)}
                      <span className="ml-1">{userRole}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Member Since</label>
                  <p className="text-sm text-gray-900">
                    Welcome!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
