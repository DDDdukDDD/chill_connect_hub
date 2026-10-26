import { db } from '../db';
import { isEventEnded } from '../dateUtils';

/**
 * "มาตามนัด x/y" (owner 2026-10-23, from 222): of the ended ตี้ run by a member host that someone joined and did not
 * cancel, how many the host confirmed they came to. A ตี้ without a member host (samples, official) has no
 * check-in and is left out. Cancelling in time removes the participation, so only real no-shows lower it.
 */
export interface AttendanceRecord {
  attended: number;
  total: number;
}

export async function attendanceOf(memberId: string): Promise<AttendanceRecord> {
  const participations = await db.listParticipations(memberId);
  let attended = 0;
  let total = 0;
  for (const p of participations) {
    const event = await db.findEventById(p.eventId);
    const host = (event as { createdByMemberId?: string } | null)?.createdByMemberId;
    if (!event || !host || host === memberId || !isEventEnded(event)) continue;
    total += 1;
    if (p.checkedInAt) attended += 1;
  }
  return { attended, total };
}
