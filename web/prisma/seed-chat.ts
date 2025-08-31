import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding chat system...');

  try {
    // Get all organizations
    const organizations = await prisma.organization.findMany({
      include: {
        users: true,
      },
    });

    for (const organization of organizations) {
      console.log(`📝 Creating chat room for organization: ${organization.name}`);

      // Create a default "General" chat room for each organization
      const generalRoom = await prisma.chatRoom.upsert({
        where: {
          organizationId_name: {
            organizationId: organization.id,
            name: 'General',
          },
        },
        update: {},
        create: {
          organizationId: organization.id,
          name: 'General',
          description: 'General discussion room for all members',
        },
      });

      console.log(`✅ Created room: ${generalRoom.name}`);

      // Add all users from the organization as participants
      for (const user of organization.users) {
        await prisma.chatParticipant.upsert({
          where: {
            roomId_userId: {
              roomId: generalRoom.id,
              userId: user.id,
            },
          },
          update: {},
          create: {
            roomId: generalRoom.id,
            userId: user.id,
          },
        });
      }

      console.log(`✅ Added ${organization.users.length} participants to ${generalRoom.name}`);

      // Create a welcome message
      await prisma.chatMessage.create({
        data: {
          roomId: generalRoom.id,
          senderId: organization.users.find(u => u.role === 'admin')?.id || organization.users[0].id,
          content: `Welcome to ${organization.name}! This is the general chat room where you can discuss topics with your classmates and teachers.`,
          messageType: 'system',
        },
      });

      console.log(`✅ Created welcome message for ${organization.name}`);
    }

    console.log('🎉 Chat system seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding chat system:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
