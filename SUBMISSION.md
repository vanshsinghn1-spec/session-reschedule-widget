# Debe Learning — Tech Intern Assessment Submission

**Candidate:** Vansh Singh
**GitHub Profile:** [github.com/vanshsinghn1-spec](https://github.com/vanshsinghn1-spec)

---

## Part 1 — GitHub Portfolio Walkthrough

### Repository 1: MealSync — Hostel Mess Management System

**Repo:** [github.com/vanshsinghn1-spec/MealSync-Mess-Managment-System](https://github.com/vanshsinghn1-spec/MealSync-Mess-Managment-System)
**Live:** [mealsync-mu.vercel.app](https://mealsync-mu.vercel.app)

**What problem it solves:**
Hostel mess management at IIITDM Kancheepuram was entirely manual — students had no easy way to see daily menus, rate food quality, or request mess switches. Mess officials tracked leftover waste and menu changes on paper. MealSync digitizes this entire workflow into a web portal where students can view dynamic menus (which automatically highlight the current meal based on time of day), rate dishes, vote in live polls, and submit mess reallocation requests — while giving admins tools to log waste and manage announcements.

**What I built (solo project):**
I built the entire application end-to-end — the Next.js frontend with TailwindCSS and Framer Motion animations, the Express + MongoDB backend with JWT authentication, the meal rating and live polling system, the admin panel for food waste tracking, and the mess-switching request portal. I also handled deployment (Vercel for frontend, backend hosted separately).

**One design decision I'd make differently today:**
I would replace the custom JWT + Credentials Provider auth setup with a managed solution like Firebase Auth or Clerk. Rolling my own auth meant writing token refresh logic, secure cookie handling, and session management from scratch — which worked, but was time-consuming and easy to get subtly wrong (e.g., token expiry edge cases). A managed auth provider would have been more secure out of the box and let me focus more time on the core mess management features.

---

### Repository 2: VedaAI — AI Assessment Creator

**Repo:** [github.com/vanshsinghn1-spec/VedaAI-AI-Assessmnet-Creator](https://github.com/vanshsinghn1-spec/VedaAI-AI-Assessmnet-Creator)
**Live:** [veda-frontend-murex.vercel.app](https://veda-frontend-murex.vercel.app/)

**What problem it solves:**
Teachers spend significant time manually creating question papers — selecting questions, balancing difficulty, formatting documents. VedaAI automates this by letting educators fill out an assignment form (subject, topic, difficulty, question count) and using Google Gemini's AI to generate a structured question paper. The generated paper can be viewed in the browser and downloaded as a PDF. A background job queue ensures the AI generation doesn't block the UI, and WebSocket connections push real-time progress updates.

**What I built (solo project):**
I designed and built the full architecture: the Next.js 15 frontend with Zustand state management and Socket.IO for real-time updates, the Express + TypeScript backend with BullMQ job queues backed by Redis Cloud, the Gemini API integration with structured prompting, server-side PDF generation with Puppeteer, and the MongoDB data layer. I also set up the CI/CD pipeline with GitHub-to-Vercel/Render webhooks for automatic deploys.

**One design decision I'd make differently today:**
I would implement response streaming from the Gemini API instead of waiting for the full response before showing results. Currently, the user sees a loading state until the entire question paper is generated (which can take several seconds). Streaming partial results via Server-Sent Events would give immediate visual feedback — questions appearing one by one — which dramatically improves perceived performance. The BullMQ queue is still valuable for retries and reliability, but the user experience would benefit from not hiding the AI's output behind a spinner.

---

## Part 2 — Debugging Round

- **Original (buggy) code:** [`part2-debug/original.ts`](part2-debug/original.ts)
- **Fixed code with inline comments:** [`part2-debug/fixed.ts`](part2-debug/fixed.ts)

### Bugs Found & Fixed

| # | Category | Bug | Production Impact |
|---|----------|-----|-------------------|
| 1 | **Security** | No `context.auth` check | Unauthenticated users can invoke the function — spam bookings, impersonation |
| 2 | **Async/Await** | Function not `async`, `.get()` not `await`ed | `existing` is a Promise, `.docs` is `undefined` → runtime crash, conflict check completely bypassed |
| 3 | **Async/Await** | `.add()` not `await`ed | Function returns before write completes → Cloud Functions runtime may kill the process, bookings silently lost |
| 4 | **Logic** | Conflict check queries teacher subcollection but write goes to root collection | Different Firestore paths — double-booking guard is dead code, never prevents conflicts |

Each fix has a detailed comment in `fixed.ts` explaining *what was wrong* and *why it matters in production*.

---

## Part 3 — Build Task: Session Reschedule Widget

The complete widget is in the root of this repository.

**Stack:** Next.js 16 (App Router) + TypeScript + Vanilla CSS

### Key Files

| File | Purpose |
|------|---------|
| [`src/types/session.ts`](src/types/session.ts) | Shared types (no `any`) — used by both frontend and mock function |
| [`src/data/mockSessions.ts`](src/data/mockSessions.ts) | 3 upcoming sessions with dynamic future dates |
| [`src/components/SessionCard.tsx`](src/components/SessionCard.tsx) | Session card with local time display |
| [`src/components/RescheduleForm.tsx`](src/components/RescheduleForm.tsx) | Reschedule form — datetime picker + reason dropdown |
| [`src/lib/requestReschedule.ts`](src/lib/requestReschedule.ts) | Mock Firebase Cloud Function with validation |

### Commit History (incremental as required)

```
44a17dc polish: dark glassmorphism theme, micro-animations, responsive layout
336697a validation: mock Cloud Function with UTC-based validation logic
b7bb942 ui: SessionCard, RescheduleForm, and main page with local time display
a9f8083 scaffold: Next.js App Router + TypeScript, shared types, mock data
```

### 2-Hour Lead-Time & Time Zone Handling

The reschedule form enforces Debe's 2-hour teacher preparation policy in **two layers**:

1. **UI layer** (`RescheduleForm.tsx`): The `min` attribute on the `datetime-local` input is set to `now + 2 hours`. The calculation uses UTC internally (`Date.now() + 2 * 60 * 60 * 1000`) but formats the result in local time for the input element.

2. **Backend layer** (`requestReschedule.ts`): The mock Cloud Function independently validates the same constraint using UTC timestamp comparison — because UI-only validation is bypassable.

**Local time display vs UTC storage:** The `datetime-local` input natively operates in the browser's local time zone. On form submission, the local value is converted to UTC via `new Date(localValue).toISOString()` before being sent to the function. Session cards display times using `toLocaleString()` with a "(your local time)" label. This is extensively commented in the source code.

---

## Part 4 — Video Walkthrough

> **Video link:** *(to be added after recording)*

The video will cover:
1. A live walkthrough of the Part 3 codebase
2. Explanation of the local-time/UTC decision and 2-hour lock-out logic
3. Intentionally breaking the time zone conversion on camera and explaining the consequences
