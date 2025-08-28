"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  Settings, 
  GraduationCap, 
  FileText,
  BarChart3
} from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";
import { useParams } from "next/navigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { dict, loading: dictLoading } = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/signin`);
    }
  }, [status, router, locale]);

  if (status === "loading" || dictLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{dict?.common?.loading || "Loading..."}</div>
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

  const getRoleDisplay = (role: string) => {
    return dict?.roles?.[role] || role;
  };

    return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* AI Tutor Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  {dict?.dashboard?.aiTutor || "AI Tutor"}
                </CardTitle>
                <CardDescription>
                  {dict?.dashboard?.startLearningDescription || "Start learning with our AI-powered tutor"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/${locale}/tutor`}>
                  <Button className="w-full">
                    {dict?.dashboard?.startLearning || "Start Learning"}
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
                    {dict?.dashboard?.uploadContent || "Upload Content"}
                  </CardTitle>
                  <CardDescription>
                    {dict?.dashboard?.uploadContentDescription || "Upload educational materials for the AI tutor"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/${locale}/rag`}>
                    <Button className="w-full" variant="outline">
                      {dict?.dashboard?.uploadDocuments || "Upload Documents"}
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
                    {dict?.dashboard?.adminPanel || "Admin Panel"}
                  </CardTitle>
                  <CardDescription>
                    {dict?.dashboard?.adminPanelDescription || "Manage users and system settings"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/${locale}/admin`}>
                    <Button className="w-full" variant="outline">
                      {dict?.dashboard?.manageSystem || "Manage System"}
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
                    {dict?.dashboard?.analytics || "Analytics"}
                  </CardTitle>
                  <CardDescription>
                    {dict?.dashboard?.analyticsDescription || "View learning analytics and insights"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" disabled>
                    {dict?.dashboard?.comingSoon || "Coming Soon"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{dict?.dashboard?.accountInformation || "Account Information"}</CardTitle>
              <CardDescription>{dict?.dashboard?.accountDescription || "Your profile and account details"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">{dict?.dashboard?.email || "Email"}</label>
                  <p className="text-sm text-gray-900">{session.user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{dict?.dashboard?.name || "Name"}</label>
                  <p className="text-sm text-gray-900">{session.user?.name || (dict?.dashboard?.notProvided || "Not provided")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{dict?.dashboard?.role || "Role"}</label>
                  <div className="flex items-center mt-1">
                    <Badge variant={getRoleColor(userRole)}>
                      {getRoleIcon(userRole)}
                      <span className="ml-1">{getRoleDisplay(userRole)}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{dict?.dashboard?.memberSince || "Member Since"}</label>
                  <p className="text-sm text-gray-900">
                    {dict?.dashboard?.welcomeMessage || "Welcome!"}
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
