import { AdaptiveTeachingDashboard } from "@/components/AdaptiveTeachingDashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdaptiveTeachingPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/signin");
  }

  const userRole = (session as any).role;
  const userId = (session as any).user?.id;

  //console.log('Adaptive Teaching Page - Session:', { userRole, userId, session });

  // Only students, teachers, and admins can access this page
  if (!['student', 'teacher', 'admin'].includes(userRole)) {
    redirect("/dashboard");
  }

  const studentId = userRole === 'student' ? userId : undefined;
  //console.log('Adaptive Teaching Page - StudentId:', studentId);

  return (
    <div className="container mx-auto py-6">
      <AdaptiveTeachingDashboard 
        studentId={studentId}
        className="max-w-7xl mx-auto"
      />
    </div>
  );
}
