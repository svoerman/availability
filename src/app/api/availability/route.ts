/**
 * @swagger
 * /api/availability:
 *   get:
 *     summary: Get availability for project members
 *     description: Retrieves availability information for all members of a specified project
 *     tags:
 *       - Availability
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID to get availability for
 *     responses:
 *       200:
 *         description: Availability information successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Availability record ID
 *                   userId:
 *                     type: integer
 *                     description: User ID
 *                   date:
 *                     type: string
 *                     format: date
 *                     description: Date of availability
 *                   dayPart:
 *                     type: string
 *                     enum: [MORNING, AFTERNOON, EVENING]
 *                     description: Part of the day
 *                   status:
 *                     type: string
 *                     enum: [FREE, NOT_WORKING, PARTIALLY_AVAILABLE, WORKING]
 *                     description: Availability status
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: User ID
 *                       name:
 *                         type: string
 *                         description: User name
 *                       email:
 *                         type: string
 *                         description: User email
 *       400:
 *         description: Bad request - Missing project ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Project ID is required
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Project not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch availability
 *   post:
 *     summary: Create or update availability
 *     description: Creates or updates availability for a user on a specific date and day part
 *     tags:
 *       - Availability
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - date
 *               - dayPart
 *               - status
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: User ID
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date for availability
 *               dayPart:
 *                 type: string
 *                 enum: [MORNING, AFTERNOON, EVENING]
 *                 description: Part of the day
 *               status:
 *                 type: string
 *                 enum: [FREE, NOT_WORKING, PARTIALLY_AVAILABLE, WORKING]
 *                 description: Availability status
 *     responses:
 *       200:
 *         description: Availability successfully created or updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Availability record ID
 *                 userId:
 *                   type: integer
 *                   description: User ID
 *                 date:
 *                   type: string
 *                   format: date
 *                   description: Date of availability
 *                 dayPart:
 *                   type: string
 *                   enum: [MORNING, AFTERNOON, EVENING]
 *                   description: Part of the day
 *                 status:
 *                   type: string
 *                   enum: [FREE, NOT_WORKING, PARTIALLY_AVAILABLE, WORKING]
 *                   description: Availability status
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Missing required fields
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to update availability
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Status } from '../../../types/prisma';
import type { DayPart } from '../../../types/prisma';

const isValidStatus = (status: unknown): status is Status => {
  return ['FREE', 'NOT_WORKING', 'PARTIALLY_AVAILABLE', 'WORKING'].includes(status as string);
};

const isValidDayPart = (dayPart: unknown): dayPart is DayPart => {
  return ['MORNING', 'AFTERNOON', 'EVENING'].includes(dayPart as string);
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get all members of the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          select: { id: true }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get availability for all project members
    const availability = await prisma.availability.findMany({
      where: {
        userId: {
          in: project.members.map(member => member.id)
        }
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(availability);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error fetching availability:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, date, dayPart, status } = await request.json();

    // Validate input
    if (!userId || !date || !dayPart || status === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate status and dayPart
    if (!isValidStatus(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    if (!isValidDayPart(dayPart)) {
      return NextResponse.json(
        { error: 'Invalid dayPart value' },
        { status: 400 }
      );
    }

    // Parse the date string to ensure it's in the correct format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Create or update availability
    const availability = await prisma.availability.upsert({
      where: {
        userId_date_dayPart: {
          userId,
          date: parsedDate,
          dayPart,
        },
      },
      update: {
        status,
      },
      create: {
        userId,
        date: parsedDate,
        dayPart,
        status,
      },
    });

    return NextResponse.json(availability);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error updating availability:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}
