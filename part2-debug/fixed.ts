import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();
const db = admin.firestore();

interface BookingRequest {
  studentId: string;
  teacherId: string;
  slot: string; // ISO datetime string
  subject: string;
}

/**
 * BUG #1 — SECURITY: No authentication check.
 * FIX: Added `context.auth` guard at the top of the function.
 *
 * WHY IT MATTERS: Without this check, any unauthenticated user (or bot)
 * can invoke this Cloud Function directly via the callable endpoint.
 * In production, this means anyone on the internet could create fake
 * bookings, flood the system with spam, or book sessions for arbitrary
 * student/teacher pairs — a critical security vulnerability. Firebase
 * callable functions do NOT enforce auth by default; the developer must
 * explicitly check `context.auth`.
 */

/**
 * BUG #2 — ASYNC/AWAIT: Function was not `async` and the Firestore
 * `.get()` call was not `await`ed.
 * FIX: Marked the callback as `async` and added `await` before `.get()`.
 *
 * WHY IT MATTERS: `.get()` returns a Promise<QuerySnapshot>, not a
 * QuerySnapshot. Without `await`, `existing` holds an unresolved Promise
 * object. Accessing `existing.docs` on a Promise returns `undefined`,
 * so `.length` throws a TypeError at runtime. Even if it didn't crash,
 * the double-booking guard would be completely bypassed — every booking
 * request would skip the conflict check and proceed to write, defeating
 * the entire purpose of the validation.
 */

/**
 * BUG #3 — ASYNC/AWAIT: The `db.collection("bookings").add()` call was
 * not `await`ed.
 * FIX: Added `await` before the `.add()` call.
 *
 * WHY IT MATTERS: Cloud Functions terminate their execution context once
 * the function returns. Without `await`, the function returns
 * `{ success: true }` immediately while the Firestore write is still
 * in-flight. The runtime may kill the process before the write completes,
 * resulting in silently lost bookings. The parent sees "success" but no
 * document is actually created in Firestore — a data integrity issue
 * that would be extremely hard to debug in production.
 */

/**
 * BUG #4 — LOGIC: Collection mismatch between conflict check and write.
 * The conflict check queried `teacherRef.collection("bookings")` (a
 * subcollection under the teacher document) but the booking was written
 * to `db.collection("bookings")` (a root-level collection).
 * FIX: Changed both operations to use the same collection — the root
 * `db.collection("bookings")` — and scoped the conflict query to also
 * filter by `teacherId`.
 *
 * WHY IT MATTERS: Because the check and write target different
 * collections, the conflict query would ALWAYS return 0 results (the
 * teacher subcollection is always empty since nothing ever writes there).
 * This means the double-booking prevention is completely broken — two
 * parents could book the same teacher at the same time slot, causing
 * scheduling conflicts and a terrible user experience.
 */
export const bookSession = functions.https.onCall(
  async (data: BookingRequest, context) => {
    // ─── BUG #1 FIX: Verify the caller is authenticated ───
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to book a session."
      );
    }

    const booking = {
      studentId: data.studentId,
      teacherId: data.teacherId,
      slot: data.slot,
      subject: data.subject,
      status: "confirmed",
      createdAt: new Date(),
    };

    // ─── BUG #2 FIX: `await` the Firestore query ───
    // ─── BUG #4 FIX: Query the same root collection where bookings are written,
    //     filtering by teacherId + slot to correctly detect conflicts ───
    const existing = await db
      .collection("bookings")
      .where("teacherId", "==", data.teacherId)
      .where("slot", "==", data.slot)
      .get();

    if (existing.docs.length > 0) {
      return { success: false, message: "Slot already booked" };
    }

    // ─── BUG #3 FIX: `await` the Firestore write ───
    await db.collection("bookings").add(booking);

    return { success: true };
  }
);
