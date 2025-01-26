const { PrismaClient } = require('@prisma/client');
const { createId } = require('@paralleldrive/cuid2');
const prisma = new PrismaClient();

async function main() {
  // Create users with predefined CUIDs for consistency
  const userIds = Array(10).fill(null).map(() => createId());
  
  const users = await Promise.all([
    prisma.user.create({ 
      data: { 
        id: userIds[0],
        name: 'Rob', 
        email: 'rob@example.com',
        password: '$2a$10$EprZUY0wYP9VJN5p9IE3guBXsxK5w4K1gJqBqYeNqWJp9uwMBXv8y' // "password123"
      } 
    }),
    prisma.user.create({ 
      data: { 
        id: userIds[1],
        name: 'Martijn', 
        email: 'martijn@example.com',
        password: '$2a$10$EprZUY0wYP9VJN5p9IE3guBXsxK5w4K1gJqBqYeNqWJp9uwMBXv8y'
      } 
    }),
    prisma.user.create({ 
      data: { 
        id: userIds[2],
        name: 'Jordy', 
        email: 'jordy@example.com',
        password: '$2a$10$EprZUY0wYP9VJN5p9IE3guBXsxK5w4K1gJqBqYeNqWJp9uwMBXv8y'
      } 
    }),
    prisma.user.create({ 
      data: { 
        id: userIds[3],
        name: 'Max', 
        email: 'max@example.com',
        password: '$2a$10$EprZUY0wYP9VJN5p9IE3guBXsxK5w4K1gJqBqYeNqWJp9uwMBXv8y'
      } 
    }),
    prisma.user.create({ 
      data: { 
        id: userIds[4],
        name: 'Ivo', 
        email: 'ivo@example.com',
        password: '$2a$10$EprZUY0wYP9VJN5p9IE3guBXsxK5w4K1gJqBqYeNqWJp9uwMBXv8y'
      } 
    }),
    prisma.user.create({ 
      data: { 
        id: userIds[5],
        name: 'Sjors', 
        email: 'sjors@example.com',
        password: '$2a$10$EprZUY0wYP9VJN5p9IE3guBXsxK5w4K1gJqBqYeNqWJp9uwMBXv8y'
      } 
    }),
    prisma.user.create({ 
      data: { 
        id: userIds[6],
        name: 'Paul', 
        email: 'paul@example.com',
        password: '$2a$10$EprZUY0wYP9VJN5p9IE3guBXsxK5w4K1gJqBqYeNqWJp9uwMBXv8y'
      } 
    }),
    prisma.user.create({ 
      data: { 
        id: userIds[7],
        name: 'Derek', 
        email: 'derek@example.com',
        password: '$2a$10$EprZUY0wYP9VJN5p9IE3guBXsxK5w4K1gJqBqYeNqWJp9uwMBXv8y'
      } 
    }),
    prisma.user.create({ 
      data: { 
        id: userIds[8],
        name: 'Naam 9', 
        email: 'naam9@example.com',
        password: '$2a$10$EprZUY0wYP9VJN5p9IE3guBXsxK5w4K1gJqBqYeNqWJp9uwMBXv8y'
      } 
    }),
    prisma.user.create({ 
      data: { 
        id: userIds[9],
        name: 'Naam 10', 
        email: 'naam10@example.com',
        password: '$2a$10$EprZUY0wYP9VJN5p9IE3guBXsxK5w4K1gJqBqYeNqWJp9uwMBXv8y'
      } 
    }),
  ]);

  // Create Kabisa organization and add all users
  const kabisa = await prisma.organization.create({
    data: {
      name: 'Kabisa',
      description: 'The cool guys',
      members: {
        create: users.map((user, index) => ({
          userId: user.id,
          role: index === 0 ? 'OWNER' : 'MEMBER' // Make Rob (first user) the owner
        }))
      }
    },
    include: {
      members: true
    }
  });

  // Create projects and assign users, now with organization and createdBy
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: "Project Alpha",
        description: "Our flagship mobile app development project",
        startDate: new Date("2024-01-01T00:00:00.000Z"),
        sprintStartDay: 1,
        organizationId: kabisa.id,
        createdById: users[0].id, // Rob creates this project
        members: {
          connect: users.slice(0, 5).map(user => ({ id: user.id })) // First 5 users
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
        sprints: true,
        createdBy: true
      }
    }),
    prisma.project.create({
      data: {
        name: "Project Beta",
        description: "Internal tooling improvements",
        startDate: new Date("2024-02-01T00:00:00.000Z"),
        sprintStartDay: 1,
        organizationId: kabisa.id,
        createdById: users[1].id, // Martijn creates this project
        members: {
          connect: users.slice(1, 4).map(user => ({ id: user.id })) // Users 2-4
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
        sprints: true,
        createdBy: true
      }
    }),
    prisma.project.create({
      data: {
        name: "Project Gamma",
        description: "Client website redesign",
        startDate: new Date("2024-03-01T00:00:00.000Z"),
        sprintStartDay: 1,
        organizationId: kabisa.id,
        createdById: users[0].id, // Rob creates this project
        members: {
          connect: users.slice(0, 3).map(user => ({ id: user.id })) // First 3 users
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
        sprints: true,
        createdBy: true
      }
    })
  ]);

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
