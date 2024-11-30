const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create users
  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Rob', email: 'rob@example.com' } }),
    prisma.user.create({ data: { name: 'Martijn', email: 'martijn@example.com' } }),
    prisma.user.create({ data: { name: 'Jordy', email: 'jordy@example.com' } }),
    prisma.user.create({ data: { name: 'Max', email: 'max@example.com' } }),
    prisma.user.create({ data: { name: 'Ivo', email: 'ivo@example.com' } }),
    prisma.user.create({ data: { name: 'Sjors', email: 'sjors@example.com' } }),
    prisma.user.create({ data: { name: 'Paul', email: 'paul@example.com' } }),
    prisma.user.create({ data: { name: 'Derek', email: 'derek@example.com' } }),
    prisma.user.create({ data: { name: 'Naam 9', email: 'naam9@example.com' } }),
    prisma.user.create({ data: { name: 'Naam 10', email: 'naam10@example.com' } }),
  ]);

  // Create Kabisa organization and add all users
  const kabisa = await prisma.organization.create({
    data: {
      name: 'Kabisa',
      description: 'The cool guys',
      members: {
        create: users.map(user => ({
          userId: user.id,
          role: user.id === 1 ? 'OWNER' : 'MEMBER' // Make the first user (Rob) the owner
        }))
      }
    },
    include: {
      members: true
    }
  });

  // Create projects and assign users, now with organization
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: "Project Alpha",
        description: "Our flagship mobile app development project",
        startDate: new Date("2024-01-01T00:00:00.000Z"),
        sprintStartDay: 1,
        organizationId: kabisa.id,
        members: {
          connect: [
            { id: 6 },
            { id: 5 },
            { id: 4 },
            { id: 7 },
            { id: 1 }
          ]
        },
        sprints: {
          create: [
            { startDate: new Date("2024-01-01T00:00:00.000Z") },
            { startDate: new Date("2024-01-15T00:00:00.000Z") },
            { startDate: new Date("2024-01-29T00:00:00.000Z") },
          ]
        }
      },
      include: {
        members: true,
        sprints: true
      }
    }),
    prisma.project.create({
      data: {
        name: "Project Beta",
        description: "Internal tooling improvements",
        startDate: new Date("2024-02-01T00:00:00.000Z"),
        sprintStartDay: 1,
        organizationId: kabisa.id,
        members: {
          connect: [
            { id: 2 },
            { id: 3 },
            { id: 4 }
          ]
        },
        sprints: {
          create: [
            { startDate: new Date("2024-02-01T00:00:00.000Z") },
            { startDate: new Date("2024-02-15T00:00:00.000Z") },
          ]
        }
      },
      include: {
        members: true,
        sprints: true
      }
    }),
    prisma.project.create({
      data: {
        name: "Project Gamma",
        description: "Client website redesign",
        startDate: new Date("2024-03-01T00:00:00.000Z"),
        sprintStartDay: 1,
        organizationId: kabisa.id,
        members: {
          connect: [
            { id: 1 },
            { id: 2 },
            { id: 5 }
          ]
        },
        sprints: {
          create: [
            { startDate: new Date("2024-03-01T00:00:00.000Z") },
            { startDate: new Date("2024-03-15T00:00:00.000Z") },
          ]
        }
      },
      include: {
        members: true,
        sprints: true
      }
    })
  ]);

  console.log('Seeded users:', users);
  console.log('Seeded organization:', kabisa);
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
