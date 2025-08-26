import { getServerSession } from "next-auth";

export async function requireRole(roles: string[]) {
  const session = await getServerSession();
  const narrowed = session as unknown as { role?: string } | null;
  if (!narrowed?.role || !roles.includes(narrowed.role)) {
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
