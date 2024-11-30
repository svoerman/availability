export enum DayPart {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING'
}

export enum Status {
  FREE = 'FREE',
  NOT_WORKING = 'NOT_WORKING',
  PARTIALLY_AVAILABLE = 'PARTIALLY_AVAILABLE',
  WORKING = 'WORKING'
}

export interface OrganizationMember {
  userId: number;
  organizationId: number;
  role: string;
}

export type Project = {
  id: number;
  name: string;
  description?: string;
  startDate: Date;
  sprintStartDay: number;
  organizationId?: number;
  createdAt: Date;
  updatedAt: Date;
}