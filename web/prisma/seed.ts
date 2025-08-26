import { PrismaClient, Role } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const users = [
    { email: "admin@example.com", role: "admin" as Role, name: "Admin", pass: "admin123" },
    { email: "teacher@example.com", role: "teacher" as Role, name: "Teacher Tina", pass: "teach123" },
    { email: "student@example.com", role: "student" as Role, name: "Student Sam", pass: "study123" },
    { email: "guardian@example.com", role: "guardian" as Role, name: "Guardian G", pass: "guard123" },
  ];

  for (const u of users) {
    const hash = await argon2.hash(u.pass, { type: argon2.argon2id });
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, role: u.role, password: hash },
    });
  }
  console.log("Seeded demo users.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());


