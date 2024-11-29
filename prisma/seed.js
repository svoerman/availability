const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create users
  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Rob' } }),
    prisma.user.create({ data: { name: 'Martijn' } }),
    prisma.user.create({ data: { name: 'Jordy' } }),
    prisma.user.create({ data: { name: 'Max' } }),
    prisma.user.create({ data: { name: 'Ivo' } }),
    prisma.user.create({ data: { name: 'Sjors' } }),
    prisma.user.create({ data: { name: 'Paul' } }),
    prisma.user.create({ data: { name: 'Derek' } }),
    prisma.user.create({ data: { name: 'Naam 9' } }),
    prisma.user.create({ data: { name: 'Naam 10' } }),
  ]);

  // Create projects and assign users
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Project Alpha',
        description: 'Our flagship mobile app development project',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        sprintStartDay: 1, // Monday
        members: {
          connect: users.slice(0, 5).map(user => ({ id: user.id })),
        },
      },
      include: {
        members: true,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Project Beta',
        description: 'Web platform redesign initiative',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-09-30'),
        sprintStartDay: 3, // Wednesday
        members: {
          connect: users.slice(3, 8).map(user => ({ id: user.id })),
        },
      },
      include: {
        members: true,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Project Gamma',
        description: 'Internal tools development',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-12-31'),
        sprintStartDay: 5, // Friday
        members: {
          connect: users.slice(6, 10).map(user => ({ id: user.id })),
        },
      },
      include: {
        members: true,
      },
    }),
  ]);

  console.log('Seeded users:', users);
  console.log('Seeded projects:', projects);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
