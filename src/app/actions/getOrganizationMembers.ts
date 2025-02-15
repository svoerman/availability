'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cache } from 'react';

export const getOrganizationMembers = cache(async (organizationId: string) => {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  const users = await prisma.user.findMany({
    where: {
      organizations: {
        some: {
          id: organizationId
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  // Filter out users that are already members
  return users;
});
