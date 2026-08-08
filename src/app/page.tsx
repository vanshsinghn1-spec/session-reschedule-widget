"use client";

import { useState } from "react";
import { Session } from "@/types/session";
import { mockSessions } from "@/data/mockSessions";
import SessionCard from "@/components/SessionCard";
import RescheduleForm from "@/components/RescheduleForm";
import styles from "./page.module.css";

/**
 * Main page — parent-facing widget showing the next 3 upcoming
 * tutoring sessions with reschedule capability.
 */
export default function Home() {
  // Local state: sessions can be updated when a reschedule is requested
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  // Which session is currently being rescheduled (null = form closed)
  const [rescheduleTarget, setRescheduleTarget] = useState<Session | null>(
    null
  );

  /**
   * Called when the mock Cloud Function returns success.
   * Updates the session's status to "reschedule-pending" to give
   * the parent visual feedback that their request was received.
   */
  const handleRescheduleSuccess = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, status: "reschedule-pending" as const } : s
      )
    );
    setRescheduleTarget(null);
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Upcoming Sessions</h1>
          <p className={styles.subtitle}>
            Your child&apos;s next tutoring sessions
          </p>
        </header>

        <div className={styles.sessionList}>
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onRequestReschedule={setRescheduleTarget}
            />
          ))}
        </div>
      </div>

      {rescheduleTarget && (
        <RescheduleForm
          session={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </main>
  );
}
