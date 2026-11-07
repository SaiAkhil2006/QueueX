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

### Verification Scripts

```bash
# Type check
npm run type-check

# Lint check
npm run lint

# Run automated tests
npm run test

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
