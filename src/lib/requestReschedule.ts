import { RescheduleRequest, RescheduleResponse } from "@/types/session";
import { mockSessions } from "@/data/mockSessions";

/**
 * ═══════════════════════════════════════════════════════════════════
 *  Mock Firebase Cloud Function: requestReschedule
 * ═══════════════════════════════════════════════════════════════════
 *
 * Simulates a deployed Firebase Cloud Function (`httpsCallable`).
 * In production this would run server-side in a Node.js environment:
 *
 *   export const requestReschedule = onCall<RescheduleRequest>(
 *     async (request) => { ... }
 *   );
 *
 * We stub it as a local async function with artificial latency to
 * replicate the real developer experience. The validation logic here
 * mirrors what the production function would enforce.
 *
 * ALL datetime comparisons use UTC (via Date objects constructed from
 * ISO strings). This is critical: we never compare local time strings
 * because the server has no knowledge of the client's time zone.
 *
 * ═══════════════════════════════════════════════════════════════════
 */

/** Simulated network latency in milliseconds. */
const MOCK_LATENCY_MS = 800;

/**
 * Minimum lead time in milliseconds.
 *
 * Debe's policy: reschedule requests must be at least 2 hours in
 * the future. This gives teachers enough preparation time.
 * The same constant should be used by both the UI (to set the `min`
 * attribute on the datetime picker) and this function (server-side
 * validation). In this mock, both import from the same codebase.
 */
export const MIN_LEAD_TIME_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function requestReschedule(
  request: RescheduleRequest
): Promise<RescheduleResponse> {
  // Simulate network round-trip
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  // ---------- Validation 1: Parse the new datetime ----------
  const newDate = new Date(request.newDatetime);

  // Guard against invalid date strings (e.g. corrupted form input)
  if (isNaN(newDate.getTime())) {
    return {
      success: false,
      error: "Invalid date format. Please select a valid date and time.",
    };
  }

  // ---------- Validation 2: Not in the past ----------
  /**
   * Compare against the current UTC time. `Date.now()` returns
   * milliseconds since epoch in UTC — no timezone ambiguity.
   */
  const nowUTC = Date.now();
  if (newDate.getTime() <= nowUTC) {
    return {
      success: false,
      error: "The selected time is in the past. Please choose a future time.",
    };
  }

  // ---------- Validation 3: 2-hour lead-time policy ----------
  /**
   * The new time must be at least 2 hours from NOW (not from the
   * original session time). This is Debe's teacher preparation policy.
   *
   * We compare UTC timestamps:
   *   newDate.getTime()  →  UTC ms of the requested slot
   *   nowUTC + MIN_LEAD_TIME_MS  →  earliest acceptable UTC ms
   *
   * This comparison is timezone-agnostic because both sides are in
   * UTC milliseconds since epoch.
   */
  const earliestAllowedUTC = nowUTC + MIN_LEAD_TIME_MS;
  if (newDate.getTime() < earliestAllowedUTC) {
    return {
      success: false,
      error:
        "The selected time is too soon. Reschedules must be at least 2 hours from now to allow teacher preparation.",
    };
  }

  // ---------- Validation 4: Not identical to existing slot ----------
  /**
   * Look up the session's current datetime and compare in UTC.
   * We use `getTime()` on both sides for a numeric comparison,
   * avoiding string comparison issues (e.g. trailing zeros,
   * different ISO serializations).
   */
  const existingSession = mockSessions.find(
    (s) => s.id === request.sessionId
  );

  if (!existingSession) {
    return {
      success: false,
      error: "Session not found. It may have been cancelled.",
    };
  }

  const existingDate = new Date(existingSession.datetime);
  if (newDate.getTime() === existingDate.getTime()) {
    return {
      success: false,
      error:
        "The selected time is the same as the current session. Please choose a different time.",
    };
  }

  // ---------- All validations passed ----------
  /**
   * In production, this would:
   * 1. Write a reschedule request doc to Firestore
   * 2. Update the session status to "reschedule-pending"
   * 3. Send a notification to the teacher
   * 4. Return success
   *
   * Here we just return the typed response.
   */
  console.log(
    `[mock] Reschedule approved: session ${request.sessionId} → ${request.newDatetime} (reason: ${request.reason})`
  );

  return { success: true };
}
