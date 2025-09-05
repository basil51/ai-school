import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import StudentDashboard from "@/components/dashboard/StudentDashboard";

interface StudentPageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentPage({ params }: StudentPageProps) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if user is a student
  if (user.role !== "student") {
    redirect(`/${locale}/dashboard`);
  }

  return <StudentDashboard user={user} />;
}