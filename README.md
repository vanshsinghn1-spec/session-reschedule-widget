# Session Reschedule Widget

A parent-facing widget for **Debe's tutoring portal** that displays a student's upcoming tutoring sessions and allows parents to request reschedules — built as an intern assignment submission.

## Overview

This project simulates a real feature on Debe's platform. It presents the next 3 upcoming tutoring sessions and provides a reschedule workflow with form validation, loading/error states, and a mock Firebase Cloud Function.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript** — shared types between frontend and mock Cloud Function, no `any`
- **Vanilla CSS** — dark glassmorphism theme with micro-animations

## Features

- **Session Cards** — Displays subject, teacher name, date/time, and status for 3 upcoming sessions
- **Reschedule Form** — Date/time picker + reason dropdown (Conflict / Illness / Time zone / Other)
- **Mock Cloud Function** (`requestReschedule`) — Validates the new slot is not in the past, not identical to the existing slot, and respects the 2-hour lead-time policy. Returns a typed `RescheduleResponse`
- **Loading & Error States** — Spinner on submit, styled error alerts, success animation. No unhandled promise rejections
- **Responsive Design** — Works across desktop and mobile viewports

## 2-Hour Lead-Time Policy

Debe requires a minimum 2-hour buffer between "now" and any rescheduled session to give teachers adequate preparation time. This is enforced in **two layers**:

1. **UI Layer** — The `min` attribute on the datetime picker is set to `now + 2 hours`, preventing selection of closer time slots
2. **Backend Layer** — The mock Cloud Function independently validates the same constraint server-side

## Time Zone Handling

The widget displays session times in the **parent's local time zone** (via `toLocaleString`) while storing all values in **UTC** (`toISOString`). The `datetime-local` input operates in local time natively; conversion to UTC happens on form submission. This approach is documented with inline comments throughout the codebase.

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Design system (CSS custom properties, animations)
│   ├── layout.tsx           # Root layout with Inter font + SEO metadata
│   ├── page.tsx             # Main page composing session cards + form
│   └── page.module.css      # Page layout styles
├── components/
│   ├── SessionCard.tsx      # Session display card
│   ├── SessionCard.module.css
│   ├── RescheduleForm.tsx   # Reschedule modal form
│   └── RescheduleForm.module.css
├── data/
│   └── mockSessions.ts     # Static mock data (3 upcoming sessions)
├── lib/
│   └── requestReschedule.ts # Mock Firebase Cloud Function
└── types/
    └── session.ts           # Shared TypeScript types
```

## Commit History

The project was built incrementally across 4 commits:

1. **Scaffold** — Next.js App Router + TypeScript setup, shared types, mock data
2. **UI** — SessionCard, RescheduleForm, and main page with local time display
3. **Validation Logic** — Mock Cloud Function with UTC-based validation
4. **Styling / Polish** — Dark glassmorphism theme, micro-animations, responsive layout

## Getting Started

```bash
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).
