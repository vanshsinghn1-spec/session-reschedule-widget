"use client";

import { Session } from "@/types/session";
import styles from "./SessionCard.module.css";

interface SessionCardProps {
  session: Session;
  onRequestReschedule: (session: Session) => void;
}

/**
 * Displays a single tutoring session to the parent.
 *
 * TIME ZONE NOTE:
 * `session.datetime` is stored in UTC. We convert it to the parent's
 * local time zone for display using `toLocaleDateString` / `toLocaleTimeString`.
 * This ensures a parent in IST sees "3:30 PM" while the underlying value
 * remains "2026-08-10T10:00:00.000Z".
 */
export default function SessionCard({
  session,
  onRequestReschedule,
}: SessionCardProps) {
  const sessionDate = new Date(session.datetime);

  // Format in the parent's local time zone — the browser automatically
  // uses `Intl.DateTimeFormat` with the system's time zone.
  const formattedDate = sessionDate.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedTime = sessionDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const isReschedulable = session.status === "scheduled";

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.subject}>{session.subject}</span>
        <span
          className={`${styles.status} ${styles[`status--${session.status}`]}`}
        >
          {formatStatus(session.status)}
        </span>
      </div>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.icon}>👩‍🏫</span>
          <span>{session.teacherName}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.icon}>📅</span>
          <span>{formattedDate}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.icon}>🕐</span>
          <span>
            {formattedTime}{" "}
            <span className={styles.tzLabel}>(your local time)</span>
          </span>
        </div>
      </div>

      {isReschedulable && (
        <button
          className={styles.rescheduleBtn}
          onClick={() => onRequestReschedule(session)}
        >
          Request Reschedule
        </button>
      )}

      {session.status === "reschedule-pending" && (
        <p className={styles.pendingNote}>
          ⏳ Reschedule request pending teacher confirmation
        </p>
      )}
    </div>
  );
}

function formatStatus(status: Session["status"]): string {
  switch (status) {
    case "scheduled":
      return "Scheduled";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "reschedule-pending":
      return "Pending Reschedule";
  }
}
