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
        name: "Project Alpha",
        description: "Our flagship mobile app development project",
        startDate: new Date("2024-01-01T00:00:00.000Z"),
        sprintStartDay: 1,
        members: {
          connect: [
            { id: 6 },
            { id: 5 },
            { id: 4 },
            { id: 7 },
            { id: 1 }
          ]
        },
      },
      include: {
        members: true
      }
    }),
    prisma.project.create({
      data: {
        name: "Project Beta",
        description: "Internal tooling improvements",
        startDate: new Date("2024-02-01T00:00:00.000Z"),
        sprintStartDay: 1,
        members: {
          connect: [
            { id: 2 },
            { id: 3 },
            { id: 4 }
          ]
        },
      },
      include: {
        members: true
      }
    }),
    prisma.project.create({
      data: {
        name: "Project Gamma",
        description: "Client website redesign",
        startDate: new Date("2024-03-01T00:00:00.000Z"),
        sprintStartDay: 1,
        members: {
          connect: [
            { id: 1 },
            { id: 2 },
            { id: 5 }
          ]
        },
      },
      include: {
        members: true
      }
    })
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
