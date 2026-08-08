/**
 * Shared types for the Session Reschedule Widget.
 *
 * These types are used by both the frontend components AND the mock
 * Firebase Cloud Function, ensuring a single source of truth.
 * In a real Debe deployment, this file would live in a shared package
 * or a `functions/src/types` directory that the frontend also imports.
 */

/** Possible statuses for a tutoring session. */
export type SessionStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "reschedule-pending";

/**
 * A tutoring session as displayed to the parent.
 *
 * `datetime` is always stored in **UTC ISO-8601** format
 * (e.g. "2026-08-10T10:00:00.000Z"). The frontend is responsible for
 * converting this to the parent's local time zone for display.
 */
export interface Session {
  id: string;
  subject: string;
  teacherName: string;
  /** ISO-8601 UTC string — never a local time string. */
  datetime: string;
  status: SessionStatus;
}

/** Accepted reasons for a reschedule request. */
export type RescheduleReason = "Conflict" | "Illness" | "Time zone" | "Other";

/**
 * Payload sent from the parent's browser to the Cloud Function.
 *
 * `newDatetime` must also be in UTC ISO-8601 format. The frontend
 * captures the parent's local selection via a `datetime-local` input,
 * then converts it to UTC with `new Date(localValue).toISOString()`
 * before constructing this object.
 */
export interface RescheduleRequest {
  sessionId: string;
  /** ISO-8601 UTC string for the requested new time slot. */
  newDatetime: string;
  reason: RescheduleReason;
}

/**
 * Response returned by the `requestReschedule` Cloud Function.
 * On validation failure, `success` is false and `error` contains
 * a human-readable explanation.
 */
export interface RescheduleResponse {
  success: boolean;
  error?: string;
}
