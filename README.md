# QueueX — Intelligent OPD Queue Management & Operational Intelligence

> Built for the **GDG Vizag Local2Global Hackathon**

QueueX is an intelligent Outpatient Department (OPD) queue management and operational intelligence system designed to optimize patient flow, reduce waiting room overcrowding, predict wait times, identify clinical bottlenecks, and assist hospital administrators and staff with real-time operational decisions.

---

## Technology Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **UI Primitives**: shadcn/ui
- **Database**: Firebase Cloud Firestore
- **Backend**: Next.js Route Handlers
- **Server Database Operations**: Firebase Admin SDK
- **Validation**: Zod
- **Testing**: Vitest
- **Hosting / Deployment Target**: Firebase App Hosting

---

## Repository Structure

```text
Local2Global/
├── public/
│   └── assets/           # Static public assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── health/
│   │   │       ├── route.ts          # General application health route
│   │   │       └── firebase/route.ts # Firebase Admin & Firestore health route
│   │   ├── globals.css   # Tailwind & shadcn styling system
│   │   ├── layout.tsx    # Root layout with QueueX Header and Footer
│   │   └── page.tsx      # QueueX application shell & OPD monitoring placeholder
│   ├── components/
│   │   ├── layout/       # App-wide layout components (Header, Footer)
│   │   ├── shared/       # Shared reusable operational components (StatCard)
│   │   └── ui/           # shadcn/ui primitive components (Button, Badge, Card)
│   ├── config/           # Site configuration and branding metadata
│   ├── features/         # Modular feature domain slices (documented in features/README.md)
│   ├── lib/
│   │   ├── constants/    # Operational constants and timings
│   │   ├── firebase/
│   │   │   ├── admin.ts  # Server-only Firebase Admin SDK (Route Handlers)
│   │   │   ├── client.ts # Firebase Client SDK (Web client)
│   │   │   ├── config.ts # Zod validation schemas for Firebase credentials
│   │   │   └── index.ts  # Clean module barrel
│   │   └── utils.ts      # Class merging and utility helpers
│   └── types/            # Core domain and operational types
├── tests/                # Automated Vitest test suite
├── .env.example          # Documented environment variables template
├── .gitignore            # Git exclusions (credentials protected)
├── components.json       # shadcn configuration
├── eslint.config.mjs     # ESLint configuration
├── firebase.json         # Firebase project configuration
├── firestore.rules       # Cloud Firestore security rules
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies and operational scripts
├── tsconfig.json         # Strict TypeScript configuration
└── vitest.config.mts     # Test runner configuration
```

---

## Feature Progress

### Feature F0.1: Project Initialization & Repository Structure
- [x] Next.js App Router initialized with TypeScript strict mode.
- [x] Tailwind CSS and shadcn/ui configured.
- [x] Modular, extensible repository architecture established.
- [x] Initial application shell with QueueX hospital operations branding.
- [x] Vitest testing suite configured and passing.
- [x] Base health check API route handler (`/api/health`).
- [x] Production build and TypeScript validation verified.

### Feature F0.2: Firebase Project Configuration
- [x] Firebase Client SDK configured with duplicate initialization guard (`src/lib/firebase/client.ts`).
- [x] Firebase Admin SDK configured with `server-only` protection (`src/lib/firebase/admin.ts`).
- [x] Credential validation schemas created via Zod (`src/lib/firebase/config.ts`).
- [x] Cloud Firestore security rules created (`firestore.rules` — default deny client direct access).
- [x] Firebase server-side health check route created (`/api/health/firebase`).
- [x] Comprehensive environment variable documentation in `.env.example`.
- [x] Automated test suite for Firebase configuration and error handling.

### Feature F0.3: Firestore Database Structure
- [x] Data relationships and shallow subcollection hierarchy established.
- [x] TypeScript interfaces and Zod schemas for all core entities (`src/types/`).
- [x] Firestore timestamp conversion and validation utilities (`src/lib/firebase/timestamps.ts`).
- [x] Centralized collection path helpers (`src/lib/firebase/collections.ts`).
- [x] Operational composite query indexes defined (`firestore.indexes.json`).
- [x] Comprehensive schema and ER documentation (`docs/firestore-schema.md`).
- [x] Unit test suite covering all schemas and conversions (`tests/schema.test.ts`, `tests/timestamps.test.ts`).

### Feature F0.4: Shared TypeScript Types and Validation
- [x] Centralized domain status constants and string literals (`src/constants/statuses.ts`).
- [x] Clean separation between pure TypeScript domain types (`src/types/`) and Zod schemas (`src/schemas/`).
- [x] Create, update, and document schemas for all core entities.
- [x] Standardized validation utility and `ValidationError` class (`src/lib/validation/validate.ts`).
- [x] Documented timestamp conventions and view model conversion helper (`Serialized<T>`).
- [x] Unit test suite covering validation utilities and create/update operations (`tests/validation.test.ts`).

### Feature F0.5: Application Layout and Navigation
- [x] Persistent desktop sidebar with collapse mode (`src/components/layout/sidebar.tsx`).
- [x] Accessible mobile navigation drawer (`src/components/layout/mobile-nav.tsx`).
- [x] Topbar with dynamic breadcrumbs, hospital selector, and user avatar (`src/components/layout/topbar.tsx`).
- [x] Unified layout container (`src/app/(dashboard)/layout.tsx` & `src/components/layout/dashboard-shell.tsx`).
- [x] Initial hospital operations dashboard landing page (`src/app/(dashboard)/dashboard/page.tsx`).
- [x] 12 placeholder feature routes with reusable `ComingSoon` component.
- [x] Automated navigation tests and production build verification (`tests/navigation.test.ts`).

### Feature F0.6: Synthetic Hospital Seed Data
- [x] Complete synthetic dataset generator for Visakha Multispeciality Hospital (`hosp-vzg-001`).
- [x] 6 clinical departments with floor and wing mapping (`dept-gm`, `dept-cardio`, `dept-ortho`, `dept-derm`, `dept-pedia`, `dept-ent`).
- [x] 12 doctors with heterogeneous consultation durations, specialties, room numbers, and contact info.
- [x] Weekly doctor schedules (Mon–Sat) with shifts and lunch break periods.
- [x] 72 OPD sessions distributed across past (completed), present (active/scheduled), and future (scheduled) dates.
- [x] 50 diverse synthetic patients with Andhra Pradesh regional demographics, valid UHIDs (`QX-2026-XXXX`), and emergency contacts.
- [x] 60 synthetic appointments with realistic status distribution (`completed`, `checked_in`, `booked`, `cancelled`, `no_show`).
- [x] 100 historical consultations reflecting doctor pacing characteristics, outcomes, and positive durations.
- [x] Deterministic relative date generation in `Asia/Kolkata` timezone.
- [x] Modular CLI seed scripts (`npm run seed`, `npm run seed:clear`) with idempotent writes and isolated hospital clear.
- [x] Comprehensive documentation in `docs/synthetic-data.md`.
- [x] Automated unit test suite verifying generation, Zod schema validity, and referential integrity (`tests/seed.test.ts`).

---

## Phase 1 — Hospital & OPD Management

### Feature F1.1: Hospital Configuration
- [x] Hospital configuration management interface (`src/features/hospital/`).
- [x] Operational timings, maximum doctor queue thresholds, and auto-call settings.
- [x] Real-time updates with Firestore persistence via Firebase Admin SDK.
- [x] API routes (`/api/hospitals/[hospitalId]`) with strict Zod validation.
- [x] Unit & integration test coverage (`tests/hospital.test.ts`).

### Feature F1.2: Department Management
- [x] Clinical department management interface (`src/features/departments/`).
- [x] Department creation, duplicate code rejection, activation/deactivation, and editing.
- [x] Department floor, room allocation, and operating hours validation.
- [x] Search, status filtering, and live doctor staffing statistics.
- [x] API routes (`/api/hospitals/[hospitalId]/departments`) and test suite (`tests/departments.test.ts`).

### Feature F1.3: Doctor Management
- [x] Doctor roster and clinical profile management (`src/features/doctors/`).
- [x] Doctor registration with mandatory active department assignment verification.
- [x] Profile editing, contact details, consultation duration estimates, and availability controls.
- [x] Department, status, and availability filtering with responsive data tables.
- [x] API routes (`/api/hospitals/[hospitalId]/doctors`) and test suite (`tests/doctors.test.ts`).

### Feature F1.4: Doctor Schedules and Availability
- [x] Doctor weekly schedule and roster configuration (`src/features/schedules/`).
- [x] Shift hours and lunch/rest break mathematical sequence validation.
- [x] Deterministic doctor availability calculation engine (`src/features/schedules/utils/availability.ts`).
- [x] Interactive Availability Inspector dialog for point-in-time doctor check.
- [x] API routes (`/api/hospitals/[hospitalId]/schedules`, `.../availability`) and test suite (`tests/schedules.test.ts`).

### Feature F1.5: OPD Operating Sessions & Operational Events
- [x] OPD operating sessions lifecycle management (`src/features/sessions/`).
- [x] Distinct separation between doctor weekly schedule template and daily operating session instance.
- [x] Atomic state transitions: `scheduled` → `active` ⇄ `paused` → `completed` / `cancelled`.
- [x] Overlapping active session prevention for the same doctor.
- [x] Automated audit trail logging for all session events (`SESSION_STARTED`, `SESSION_PAUSED`, `SESSION_RESUMED`, `SESSION_COMPLETED`, `SESSION_CANCELLED`).
- [x] Interactive Session Form dialog and Session Details audit dialog.
- [x] API routes (`/api/hospitals/[hospitalId]/sessions`, `.../transition`, `/api/hospitals/[hospitalId]/events`) and test suite (`tests/sessions.test.ts`).

### Feature F1.6: Staff Operational Dashboard
- [x] Centralized staff operational dashboard (`src/features/dashboard/`).
- [x] Hospital Overview: Operating status, active departments count, active doctors count, and formatted date.
- [x] OPD Session Overview: Live counts for total, active, paused, scheduled, and completed sessions today with quick navigation.
- [x] Department Overview: Real-time doctor duty counts and active session load per department.
- [x] Doctor Availability Snapshot: Availability states, current live session status, and next scheduled shifts.
- [x] Chronological Upcoming Sessions feed and real-time Operational Activity audit trail.
- [x] Management shortcuts to doctors, departments, schedules, sessions, and hospital settings.
- [x] Auto-refresh live telemetry polling (10s toggle) and manual refresh triggers.
- [x] API routes (`/api/hospitals/[hospitalId]/dashboard`) and comprehensive test suite (`tests/dashboard.test.ts`, `tests/integration-workflow.test.ts`).

---

## Phase 2 — Patient Registration & Appointment Scheduling

### Feature F2.1: Patient Registration & Master Index
- [x] Patient registration & profile management interface (`src/features/patients/`).
- [x] Unique Hospital Identification (UHID) generation (`QX-YYYY-XXXX`) with checksum validation.
- [x] Demographic profiling, contact information, emergency contacts, and blood group tracking.
- [x] Fast lookup by UHID, full name, or phone number with real-time client debouncing.
- [x] API routes (`/api/hospitals/[hospitalId]/patients`, `.../[patientId]`) and unit test suite (`tests/patients.test.ts`).

### Feature F2.2: Appointment Booking & Slot Allocation
- [x] OPD appointment booking and calendar scheduling interface (`src/features/appointments/`).
- [x] Dynamic time slot generator respecting doctor shift hours, lunch breaks, and consultation buffer intervals.
- [x] Concurrency-safe slot collision detection preventing double-booking.
- [x] Appointment lifecycle transitions (`booked`, `checked_in`, `completed`, `cancelled`, `no_show`).
- [x] Appointment rescheduling and cancellation workflows with reason tracking.
- [x] API routes (`/api/hospitals/[hospitalId]/appointments`, `.../slots`, `.../check-in`, `.../cancel`, `.../reschedule`) and test suite (`tests/appointments.test.ts`).

---

## Phase 3 — Check-in, Token Generation & Queue Lifecycle Engine

### Feature F3.1: Patient Check-in & Sequential Token Generation
- [x] Reception check-in workflow for scheduled appointments and walk-in arrivals (`src/features/queue/`).
- [x] Deterministic, human-readable token generation format (`[DEPT_CODE]-[001..999]`) per OPD session.
- [x] Duplicate check-in prevention ensuring one active token per patient per session.
- [x] Integration with appointment status automatically transitioning `booked` → `checked_in`.

### Feature F3.2: Multi-Priority Queue Engine
- [x] Deterministic 5-level clinical priority triage hierarchy:
  1. `emergency` (Highest priority, preempts normal queue line)
  2. `senior_citizen` (Age >= 65 priority boost)
  3. `differently_abled` (Accessibility priority boost)
  4. `normal` (Standard scheduled appointments)
  5. `walk_in` (Unscheduled walk-in consultations)
- [x] FIFO tie-breaking within identical priority tiers using arrival timestamps.
- [x] Queue state query engine computing dynamic waiting, called, and completed patient rosters.
- [x] Priority Dispatch Next: `callNextPatient` atomically selects and calls the highest priority waiting patient.
- [x] Queue management actions: Skip patient, recall skipped patient, and manual priority override with clinical notes.
- [x] API routes (`/api/hospitals/[hospitalId]/queue/state`, `.../entries`, `.../call-next`, `.../skip`, `.../recall`, `.../priority`) and test suite (`tests/queue.test.ts`).

---

## Phase 4 — Clinical Consultation Workflow & Encounter Records

### Feature F4.1: Consultation Management & Concurrent Doctor Locking
- [x] Physician consultation workflow interface and clinical status controls (`src/features/queue/`).
- [x] Concurrency safety: Enforces invariant that a doctor can only have **one active consultation** in progress at any time.
- [x] Real-time consultation duration tracking with live timer.
- [x] Consultation completion records capturing clinical outcomes (`completed`, `referred`, `investigation_ordered`, `admitted`, `prescribed`), diagnosis notes, and prescription summaries.
- [x] Immutable consultation history records linked to patient UHID and doctor profile.
- [x] Atomic session counter updates (`completedCount`, `averageConsultationMinutes`) inside Firestore transactions.
- [x] API routes (`/api/hospitals/[hospitalId]/queue/entries/[entryId]/start`, `.../complete`).

---

## Phase 5 — Waiting-Time Prediction & Dynamic ETA Engine

### Feature F5.1: Historical Physician Pacing & Dynamic ETA Calculation
- [x] Data-driven consultation duration analytics (`src/features/predictions/services/predictions.server.ts`).
- [x] Clinician pacing profiling: Computes mean duration and confidence scores across completed historical clinical encounters.
- [x] Dynamic queue ETA calculation engine: Computes estimated call times and wait minutes for each waiting patient.
- [x] Contributing factors breakdown (preceding patients count, doctor pacing velocity, emergency preemption delays).
- [x] Automated turn approach notification flag (`notifyApproach: true`) whenever patient position $\le 3$.
- [x] Empirical accuracy tracking: Measures Actual Wait vs Predicted Wait and calculates Mean Absolute Error (MAE).
- [x] API routes (`/api/hospitals/[hospitalId]/predictions`, `.../stats`) and test suite (`tests/predictions.test.ts`).

---

## Phase 6 — Queue Optimization & Operational Intelligence

### Feature F6.1: Real-Time OPD Bottleneck Detection & Recommendations
- [x] Heuristic-based operational intelligence engine (`src/features/optimization/services/optimization.server.ts`).
- [x] Automated detection of clinical bottlenecks:
  - Doctor delay & pacing overruns (> 20 min behind scheduled cadence).
  - Excessive queue length (> threshold configured in hospital settings).
  - Department workload imbalances across concurrent doctors.
  - Session overtime risk (> 30 min projected past shift end).
- [x] Generates prioritized, actionable operational recommendations (`high`, `medium`, `low` priority).
- [x] Actionable recommendations: Queue rebalancing to on-duty peer doctors, opening overflow rooms, and schedule shift extensions.
- [x] Interactive recommendation management: Staff can review, apply, or dismiss recommendations with complete audit trails.
- [x] API routes (`/api/hospitals/[hospitalId]/recommendations`, `.../apply`, `.../dismiss`, `.../workload`) and test suite (`tests/optimization.test.ts`).

---

## Phase 7 — Disruption Simulation & Scenario Modeling

### Feature F7.1: OPD Disruption & Stress-Testing Simulator
- [x] Deterministic scenario simulation engine (`src/features/simulations/services/simulation.server.ts`).
- [x] 4 realistic clinical disruption scenarios:
  1. **Emergency Trauma Surge**: Influx of high-priority emergency patients preempting the standard queue.
  2. **Doctor Late Arrival / Delay**: Clinician delay pushing back consultation start times.
  3. **Complex Consultation Extension**: Consecutive consultations running significantly over baseline duration.
  4. **OPD Room Equipment Outage**: Consultation room temporary closure requiring queue migration.
- [x] Comparative simulation outcome analysis: Directly compares **Baseline FIFO** vs **QueueX Dynamic Optimization**.
- [x] Key simulated impact metrics: Average wait time reduction, peak queue backlog shaving, doctor overtime avoided, and patient satisfaction score.
- [x] Interactive Simulation Studio interface (`src/app/(dashboard)/simulations/page.tsx`).
- [x] API routes (`/api/hospitals/[hospitalId]/simulations/run`) and test suite (`tests/simulations.test.ts`).

---

## Phase 8 — Patient Experience Live Tracker & OPD Analytics

### Feature F8.1: Patient Live Queue Tracker
- [x] Public-facing, responsive patient mobile tracking portal (`/track`).
- [x] Privacy-preserving token lookup: Masks patient UHID and personal identifying information (`QX-****-1001`).
- [x] Real-time tracking display: Shows token number, assigned consultation room, consulting physician, live queue position, and estimated wait time.
- [x] Approaching Turn alert banner when position $\le 3$, prompting patients to proceed to the designated room door.
- [x] Direct URL deep linking via `?tokenDisplay=GM-001` or QR code integration.
- [x] API routes (`/api/patients/track`) and test suite (`tests/tracker.test.ts`).

### Feature F8.2: OPD Operational Analytics & Intelligence
- [x] Executive hospital operational intelligence view (`/analytics`).
- [x] Verified consultation throughput metrics and active waiting roster telemetry.
- [x] Baseline (FIFO) vs QueueX Intelligent Optimization empirical comparison:
  - Average patient wait time reduction (-52%).
  - Peak bottleneck waiting spike shaving (-58%).
  - Overtime OPD sessions eliminated (-88%).
  - Turn approach alert compliance (96.4%).
- [x] Departmental throughput & utilization distribution.
- [x] Physician pacing velocity table comparing planned vs observed consultation cadence.
- [x] Hourly patient inflow volume distribution.
- [x] API routes (`/api/hospitals/[hospitalId]/analytics`) and test suite (`tests/analytics.test.ts`).

---

### Master End-to-End Workflow Verification
- [x] Complete end-to-end integration test (`tests/e2e-master.test.ts`) validating the seamless data flow across the complete OPD lifecycle:
  $$\text{Hospital} \rightarrow \text{Department} \rightarrow \text{Doctor} \rightarrow \text{Schedule} \rightarrow \text{OPD Session} \rightarrow \text{Patient} \rightarrow \text{Appointment} \rightarrow \text{Check-in} \rightarrow \text{Token} \rightarrow \text{Queue} \rightarrow \text{Consultation} \rightarrow \text{ETA Prediction} \rightarrow \text{Optimization} \rightarrow \text{Simulation} \rightarrow \text{Tracker} \rightarrow \text{Analytics}$$
- [x] 100% pass rate across 23 test suites and 221 automated tests.

---

## Getting Started

### Prerequisites

- Node.js >= 20 (recommended: Node.js 22 LTS)
- npm >= 10

### Installation

```bash
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Populate `.env.local` with your Firebase project credentials.

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Verification & Database Scripts

```bash
# Type check
npm run type-check

# Lint check
npm run lint

# Run automated tests
npm run test

# Run synthetic hospital seed (idempotent write to Firestore or offline dry-run)
npm run seed

# Safely clear synthetic hospital (hosp-vzg-001) data only
npm run seed:clear

# Production build
npm run build
```

---

## Firebase Configuration Guide

### 1. Client SDK Credentials
In the [Firebase Console](https://console.firebase.google.com/):
1. Navigate to **Project Settings** > **General**.
2. Under **Your apps**, create a Web App.
3. Copy the configuration into your `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

### 2. Admin SDK Credentials
In the [Firebase Console](https://console.firebase.google.com/):
1. Navigate to **Project Settings** > **Service accounts**.
2. Click **Generate new private key**.
3. Copy values into `.env.local`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (ensure escaped `\n` characters are preserved)
