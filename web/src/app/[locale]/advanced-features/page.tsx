import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdvancedFeaturesDashboard from "@/components/advanced/AdvancedFeaturesDashboard";

export default async function AdvancedFeaturesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Only allow admin and super_admin access
  if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6">
      <AdvancedFeaturesDashboard userRole={session.user.role} />
    </div>
  );
}
