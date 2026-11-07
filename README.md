# QueueX — Intelligent OPD Queue Management & Operational Intelligence

> Built for the **GDG Vizag Local2Global Hackathon**

QueueX is an intelligent Outpatient Department (OPD) queue management and operational intelligence system designed to optimize patient flow, reduce waiting room overcrowding, predict wait times, identify clinical bottlenecks, and assist hospital administrators and staff with real-time operational decisions.

---

## Technology Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **UI Primitives**: shadcn/ui
- **Database**: Firebase Cloud Firestore (Planned in F0.2+)
- **Backend**: Next.js Route Handlers
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
│   │   ├── api/          # Route Handlers (e.g. /api/health)
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
│   │   └── utils.ts      # Class merging and utility helpers
│   └── types/            # Core domain and operational types
├── tests/                # Automated Vitest test suite
├── .env.example          # Documented environment variables template
├── .gitignore            # Git exclusions
├── components.json       # shadcn configuration
├── eslint.config.mjs     # ESLint configuration
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies and operational scripts
├── tsconfig.json         # Strict TypeScript configuration
└── vitest.config.mts     # Test runner configuration
```

---

## Current Status: Feature F0.1

- [x] Next.js App Router initialized with TypeScript strict mode.
- [x] Tailwind CSS and shadcn/ui configured.
- [x] Modular, extensible repository architecture established.
- [x] Initial application shell with QueueX hospital operations branding.
- [x] Vitest testing suite configured and passing.
- [x] Health check API route handler (`/api/health`).
- [x] Production build and TypeScript validation verified.

---

## Getting Started

### Prerequisites

- Node.js >= 20 (recommended: Node.js 22 LTS)
- npm >= 10

### Installation

```bash
npm install
```

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
