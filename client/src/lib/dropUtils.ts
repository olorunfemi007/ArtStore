import type { Drop } from '@shared/schema';

export type DropStatus = 'scheduled' | 'active' | 'ended';

export function getDropStatus(drop: Drop): DropStatus {
  const now = new Date();
  const start = new Date(`${drop.startDate}T${drop.startTime}`);
  const end = drop.hasEndDate && drop.endDate && drop.endTime 
    ? new Date(`${drop.endDate}T${drop.endTime}`) 
    : null;
  
  if (now < start) return 'scheduled';
  if (end && now > end) return 'ended';
  return 'active';
}

export function getDropStartDate(drop: Drop): Date {
  return new Date(`${drop.startDate}T${drop.startTime}`);
}

export function getDropEndDate(drop: Drop): Date | null {
  if (drop.hasEndDate && drop.endDate && drop.endTime) {
    return new Date(`${drop.endDate}T${drop.endTime}`);
  }
  return null;
}

export function formatDropDate(drop: Drop): string {
  const start = getDropStartDate(drop);
  return start.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
