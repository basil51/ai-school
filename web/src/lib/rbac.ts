import { getServerSession } from "next-auth";

export async function requireRole(roles: string[]) {
  const session = await getServerSession();
  if (!session || !roles.includes((session as any).role)) {
    throw new Response("Forbidden", { status: 403 });
  }
}

export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session;
}
