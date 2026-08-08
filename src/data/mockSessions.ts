import { Session } from "@/types/session";

/**
 * Mock session data — represents the next 3 upcoming tutoring sessions
 * for a parent's child on Debe's platform.
 *
 * All `datetime` values are stored in UTC (ISO-8601).
 * The frontend converts these to the parent's local time zone for display.
 *
 * In production, this data would come from a Firestore query like:
 *   db.collection('sessions')
 *     .where('studentId', '==', currentStudentId)
 *     .where('datetime', '>=', now)
 *     .orderBy('datetime')
 *     .limit(3)
 */
export const mockSessions: Session[] = [
  {
    id: "session-001",
    subject: "Mathematics",
    teacherName: "Ms. Priya Sharma",
    // ~2 days from a reference point — always in the future
    datetime: getFutureDate(2, 10, 0), // 2 days out, 10:00 UTC
    status: "scheduled",
  },
  {
    id: "session-002",
    subject: "English Literature",
    teacherName: "Mr. David Chen",
    datetime: getFutureDate(4, 14, 30), // 4 days out, 14:30 UTC
    status: "scheduled",
  },
  {
    id: "session-003",
    subject: "Science",
    teacherName: "Dr. Ananya Patel",
    datetime: getFutureDate(7, 9, 0), // 7 days out, 09:00 UTC
    status: "scheduled",
  },
];

/**
 * Helper to generate a future UTC date string relative to *now*.
 * This ensures mock sessions are always in the future regardless
 * of when the code is run — useful for demo/review purposes.
 *
 * @param daysFromNow - number of days in the future
 * @param utcHour - hour of the day in UTC (0-23)
 * @param utcMinute - minute of the hour (0-59)
 * @returns ISO-8601 UTC string
 */
function getFutureDate(
  daysFromNow: number,
  utcHour: number,
  utcMinute: number
): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  date.setUTCHours(utcHour, utcMinute, 0, 0);
  return date.toISOString();
}
