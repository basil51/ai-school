import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, name, role } = body ?? {};
  if (!email || !password) return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await prisma.user.create({
    data: { email, password: hash, name: name ?? null, role: (role ?? "student") as Role },
  });
  return NextResponse.json({ id: user.id, email: user.email });
}
