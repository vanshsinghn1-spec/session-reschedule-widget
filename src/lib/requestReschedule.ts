import { RescheduleRequest, RescheduleResponse } from "@/types/session";

/**
 * Mock Firebase Cloud Function: requestReschedule
 *
 * Simulates calling a deployed Cloud Function via `httpsCallable`.
 * In production, this would be:
 *   const fn = httpsCallable<RescheduleRequest, RescheduleResponse>(
 *     functions, 'requestReschedule'
 *   );
 *   const result = await fn(request);
 *
 * For this assignment, we stub it locally with an artificial delay
 * and validation logic that mirrors what the server would do.
 *
 * Full validation logic will be added in Commit 3.
 */
export async function requestReschedule(
  request: RescheduleRequest
): Promise<RescheduleResponse> {
  // Simulate network latency (800ms)
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Placeholder — always succeeds. Real validation in Commit 3.
  console.log("[mock] requestReschedule called with:", request);
  return { success: true };
}
