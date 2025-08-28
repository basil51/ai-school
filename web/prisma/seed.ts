import { PrismaClient, Role, OrganizationTier } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  // Create default organization
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: "demo-school" },
    update: {},
    create: {
      name: "Demo School",
      slug: "demo-school",
      description: "Default demonstration school organization",
      tier: "premium" as OrganizationTier,
      settings: {
        create: {
          maxUsers: 500,
          maxDocuments: 100,
          maxQuestionsPerMonth: 10000,
          maxStorageBytes: BigInt(10 * 1024 * 1024 * 1024), // 10GB
          evaluationsEnabled: true,
        },
      },
    },
  });

  const users = [
    { email: "superadmin@example.com", role: "super_admin" as Role, name: "Super Admin", pass: "super123", orgId: null },
    { email: "admin@example.com", role: "admin" as Role, name: "Admin", pass: "admin123", orgId: defaultOrg.id },
    { email: "teacher@example.com", role: "teacher" as Role, name: "Teacher Tina", pass: "teach123", orgId: defaultOrg.id },
    { email: "student@example.com", role: "student" as Role, name: "Student Sam", pass: "study123", orgId: defaultOrg.id },
    { email: "guardian@example.com", role: "guardian" as Role, name: "Guardian Grace", pass: "guard123", orgId: defaultOrg.id },
    { email: "student2@example.com", role: "student" as Role, name: "Student Sarah", pass: "study123", orgId: defaultOrg.id },
    { email: "guardian2@example.com", role: "guardian" as Role, name: "Guardian George", pass: "guard123", orgId: defaultOrg.id },
  ];

  for (const u of users) {
    const hash = await argon2.hash(u.pass, { type: argon2.argon2id });
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { 
        email: u.email, 
        name: u.name, 
        role: u.role, 
        password: hash,
        organizationId: u.orgId,
      },
    });
  }
  console.log("Seeded demo users.");

  // Create guardian-student relationships
  const relationships = [
    { guardianEmail: "guardian@example.com", studentEmail: "student@example.com" },
    { guardianEmail: "guardian2@example.com", studentEmail: "student2@example.com" },
  ];

  for (const rel of relationships) {
    const guardian = await prisma.user.findUnique({ where: { email: rel.guardianEmail } });
    const student = await prisma.user.findUnique({ where: { email: rel.studentEmail } });
    
    if (guardian && student) {
      await prisma.guardianRelationship.upsert({
        where: {
          guardianId_studentId: {
            guardianId: guardian.id,
            studentId: student.id,
          },
        },
        update: {},
        create: {
          guardianId: guardian.id,
          studentId: student.id,
          status: 'approved',
        },
      });
    }
  }
  console.log("Seeded guardian relationships.");

  // Create email templates
  const templates = [
    {
      name: 'weekly_progress',
      subject: 'Weekly Progress Report for {{studentName}}',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Weekly Progress Report</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Weekly Progress Report</h2>
            <p>Dear {{guardianName}},</p>
            <p>Here's a summary of {{studentName}}'s learning progress this week:</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">📊 This Week's Activity</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;">📚 <strong>Sessions completed:</strong> {{sessionsCount}}</li>
                <li style="margin: 10px 0;">❓ <strong>Questions asked:</strong> {{questionsAsked}}</li>
                <li style="margin: 10px 0;">⏱️ <strong>Time spent learning:</strong> {{timeSpent}}</li>
                <li style="margin: 10px 0;">📖 <strong>Topics covered:</strong> {{topicsCovered}}</li>
              </ul>
            </div>
            
            <p>Keep up the great work! If you have any questions about {{studentName}}'s progress, please don't hesitate to reach out.</p>
            
            <p>Best regards,<br>The EduVibe Team</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              You're receiving this email because you're registered as a guardian for {{studentName}}.
              <a href="{{unsubscribeUrl}}" style="color: #2563eb;">Unsubscribe</a>
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Weekly Progress Report
        
        Dear {{guardianName}},
        
        Here's a summary of {{studentName}}'s learning progress this week:
        
        This Week's Activity:
        - Sessions completed: {{sessionsCount}}
        - Questions asked: {{questionsAsked}}
        - Time spent learning: {{timeSpent}}
        - Topics covered: {{topicsCovered}}
        
        Keep up the great work! If you have any questions about {{studentName}}'s progress, please don't hesitate to reach out.
        
        Best regards,
        The EduVibe Team
        
        You're receiving this email because you're registered as a guardian for {{studentName}}.
        To unsubscribe, visit: {{unsubscribeUrl}}
      `,
    },
  ];

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }
  console.log("Seeded email templates.");

  // Update existing documents to belong to the default organization
  await prisma.ragDocument.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrg.id },
  });
  console.log("Updated existing documents to default organization.");

  // Create a second demo organization
  const secondOrg = await prisma.organization.upsert({
    where: { slug: "tech-academy" },
    update: {},
    create: {
      name: "Tech Academy",
      slug: "tech-academy",
      description: "Technology-focused educational institution",
      tier: "basic" as OrganizationTier,
      primaryColor: "#10b981", // Green
      settings: {
        create: {
          maxUsers: 100,
          maxDocuments: 50,
          maxQuestionsPerMonth: 5000,
          maxStorageBytes: BigInt(5 * 1024 * 1024 * 1024), // 5GB
          evaluationsEnabled: true,
        },
      },
    },
  });

  // Create some users for the second organization
  const secondOrgUsers = [
    { email: "admin2@example.com", role: "admin" as Role, name: "Tech Admin", pass: "admin123", orgId: secondOrg.id },
    { email: "teacher2@example.com", role: "teacher" as Role, name: "Tech Teacher", pass: "teach123", orgId: secondOrg.id },
    { email: "student3@example.com", role: "student" as Role, name: "Tech Student", pass: "study123", orgId: secondOrg.id },
  ];

  for (const u of secondOrgUsers) {
    const hash = await argon2.hash(u.pass, { type: argon2.argon2id });
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { 
        email: u.email, 
        name: u.name, 
        role: u.role, 
        password: hash,
        organizationId: u.orgId,
      },
    });
  }
  console.log("Seeded second organization and users.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());


