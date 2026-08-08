"use client";

import { useState, useMemo } from "react";
import { Session, RescheduleReason, RescheduleResponse } from "@/types/session";
import { requestReschedule } from "@/lib/requestReschedule";
import styles from "./RescheduleForm.module.css";

interface RescheduleFormProps {
  session: Session;
  onClose: () => void;
  onSuccess: (sessionId: string) => void;
}

/** All valid reschedule reasons, used to populate the dropdown. */
const REASONS: RescheduleReason[] = [
  "Conflict",
  "Illness",
  "Time zone",
  "Other",
];

/**
 * RescheduleForm — allows a parent to request a new time slot for a session.
 *
 * ═══════════════════════════════════════════════════════════════════
 *  TIME ZONE & LEAD-TIME POLICY — READ THIS BEFORE MODIFYING
 * ═══════════════════════════════════════════════════════════════════
 *
 * 1. LOCAL DISPLAY vs UTC STORAGE:
 *    - The `<input type="datetime-local">` natively works in the
 *      browser's local time zone. Whatever the parent selects
 *      (e.g. "Aug 10, 2026, 3:30 PM IST") is what they see.
 *    - On form submission, we convert to UTC for storage/transmission:
 *        `new Date(localValue).toISOString()`
 *      This ensures all backend comparisons happen in a single TZ.
 *
 * 2. 2-HOUR LEAD-TIME POLICY:
 *    - Debe requires a minimum 2-hour buffer between "now" and the
 *      new session time. This gives teachers enough notice to prepare.
 *    - We enforce this in TWO places:
 *      a) UI: the `min` attribute on the datetime-local input is set
 *         to `now + 2 hours`, preventing selection of closer slots.
 *      b) Backend (mock Cloud Function): validates the same constraint
 *         server-side, because UI-only validation is bypassable.
 *    - The `min` value is computed in local time (for the input), but
 *      the *calculation* uses UTC internally:
 *         const minUTC = Date.now() + 2 * 60 * 60 * 1000;
 *         const minLocal = toDatetimeLocalString(new Date(minUTC));
 *      This way, the 2-hour window is always accurate regardless of
 *      the parent's time zone.
 *
 * ═══════════════════════════════════════════════════════════════════
 */
export default function RescheduleForm({
  session,
  onClose,
  onSuccess,
}: RescheduleFormProps) {
  const [selectedDatetime, setSelectedDatetime] = useState("");
  const [reason, setReason] = useState<RescheduleReason>("Conflict");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Compute the minimum selectable datetime (now + 2 hours).
   *
   * We use `useMemo` so the value is stable during the component's
   * lifecycle (it re-computes if the component re-mounts, which is
   * the right behavior — the 2-hour window shifts with real time).
   *
   * The result is formatted for `datetime-local` which requires
   * "YYYY-MM-DDTHH:MM" in LOCAL time (no timezone suffix).
   */
  const minDatetime = useMemo(() => {
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const minDate = new Date(Date.now() + TWO_HOURS_MS);
    return toDatetimeLocalString(minDate);
  }, []);

  /**
   * Format the session's existing datetime for display.
   * This is shown so the parent can see what they're rescheduling FROM.
   */
  const currentSessionLocal = useMemo(() => {
    const d = new Date(session.datetime);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [session.datetime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedDatetime) {
      setError("Please select a new date and time.");
      return;
    }

    setLoading(true);

    try {
      /**
       * CRITICAL CONVERSION: local → UTC
       *
       * `selectedDatetime` is in local time format "YYYY-MM-DDTHH:MM"
       * from the datetime-local input. `new Date(localString)` parses
       * this as a local time, and `.toISOString()` converts to UTC.
       *
       * Example (for IST, UTC+5:30):
       *   Input:  "2026-08-10T15:30"  (3:30 PM IST)
       *   Output: "2026-08-10T10:00:00.000Z"  (10:00 AM UTC)
       */
      const newDatetimeUTC = new Date(selectedDatetime).toISOString();

      const response: RescheduleResponse = await requestReschedule({
        sessionId: session.id,
        newDatetime: newDatetimeUTC,
        reason,
      });

      if (response.success) {
        setSuccess(true);
        // Brief delay so the parent sees the success message
        setTimeout(() => {
          onSuccess(session.id);
        }, 1500);
      } else {
        setError(response.error ?? "An unknown error occurred.");
      }
    } catch {
      // Catch network errors or unexpected failures — no unhandled rejections
      setError("Failed to submit reschedule request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.successMessage}>
            <span className={styles.successIcon}>✅</span>
            <h3>Reschedule Requested!</h3>
            <p>Your request has been sent to {session.teacherName}.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Reschedule Session</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className={styles.currentSession}>
          <p className={styles.currentLabel}>Current session:</p>
          <p className={styles.currentValue}>
            {session.subject} with {session.teacherName}
          </p>
          <p className={styles.currentValue}>
            {currentSessionLocal}{" "}
            <span className={styles.tzNote}>(your local time)</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="new-datetime" className={styles.label}>
              New Date & Time
            </label>
            <input
              id="new-datetime"
              type="datetime-local"
              className={styles.input}
              value={selectedDatetime}
              onChange={(e) => setSelectedDatetime(e.target.value)}
              /**
               * `min` enforces the 2-hour lead-time policy in the UI.
               * The value is in LOCAL time format because datetime-local
               * operates in the browser's time zone. The browser will
               * grey out / prevent selection of any time before this.
               */
              min={minDatetime}
              disabled={loading}
              required
            />
            <p className={styles.hint}>
              ⏱️ Minimum 2 hours from now (teacher preparation time)
            </p>
          </div>

          <div className={styles.field}>
            <label htmlFor="reason" className={styles.label}>
              Reason for Reschedule
            </label>
            <select
              id="reason"
              className={styles.select}
              value={reason}
              onChange={(e) => setReason(e.target.value as RescheduleReason)}
              disabled={loading}
              required
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className={styles.error} role="alert">
              ⚠️ {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner}>⟳</span>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Convert a Date object to the "YYYY-MM-DDTHH:MM" format required
 * by `<input type="datetime-local">`.
 *
 * IMPORTANT: This outputs in LOCAL time, not UTC, because the
 * datetime-local input expects local time values. We use
 * `getFullYear()` / `getMonth()` / etc. (not their UTC variants)
 * so the displayed min matches the parent's wall clock.
 */
function toDatetimeLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
