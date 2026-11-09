# QueueX — Intelligent OPD Management & Operational Intelligence

<p align="center">
  <strong>Built for GDG Vizag's Local2Global Hack</strong>
  <br />
  A 24-hour hackathon focused on solving local problems with globally scalable technology.
</p>

---

## About the Hackathon

**Local2Global Hack — GDG Vizag**

| Detail | Information |
|---|---|
| Organiser | Google Developer Group (GDG) Vizag |
| Event | Local2Global Hack |
| Date | November 5–6, 2026 |
| Duration | 24 hours |
| Venue | Gayatri Vidya Parishad Institute of Higher Learning and Research (GVPIHLR), Visakhapatnam |
| Format | In-person hackathon |
| Focus | Building solutions to real-world local problems with global impact |
| Technology themes | AI, Gemini, Firebase and Google developer technologies |

The challenge was simple: identify a problem that affects our community, build a working solution, and design it with the potential to scale beyond our city.

**QueueX is our attempt to solve one such problem in healthcare.**

---

# QueueX

**Hospitals don't just need digital queues. They need to know what happens when those queues go wrong.**

QueueX is an intelligent Outpatient Department (OPD) management and operational intelligence platform that helps hospitals manage patient flow, coordinate doctors, estimate waiting times, identify bottlenecks and respond to unexpected disruptions.

Instead of simply showing patients their token numbers, QueueX helps hospital staff understand what is happening across OPD departments and make informed operational decisions.

---

## The Problem

A hospital's OPD is a constantly changing environment.

Patients arrive through appointments and walk-ins. Consultations take different amounts of time. Doctors may arrive late, emergencies can interrupt normal queues, and one department can become significantly busier than another.

These events create problems that traditional queue management alone cannot fully address.

### What happens in a typical OPD?

- **Unpredictable waiting times:** Patients often have little idea how long they will actually wait.
- **Unbalanced workloads:** Some doctors face long queues while other doctors may have available capacity.
- **Unexpected disruptions:** Emergencies, delayed doctors and longer consultations affect everyone waiting.
- **Limited operational visibility:** Hospital staff may struggle to understand how one disruption affects the rest of the OPD.
- **Reactive decision-making:** Staff often respond to problems after queues have already become unmanageable.
- **Poor patient experience:** Uncertainty and overcrowded waiting areas create frustration for patients and attendants.

The problem is not simply the absence of digital tokens.

**The bigger problem is the lack of operational intelligence to anticipate, understand and respond to changing OPD conditions.**

---

## Our Solution

QueueX brings patient management, queue coordination and operational intelligence into one platform.

It connects the entire OPD journey:

1. **Manage:** Configure hospitals, departments, doctors, schedules and OPD sessions.
2. **Register:** Register patients, book appointments and handle walk-in visits.
3. **Coordinate:** Generate tokens, manage priority-based queues and track consultations.
4. **Predict:** Estimate patient waiting times using historical consultation patterns and live queue conditions.
5. **Optimize:** Identify workload imbalances and recommend operational improvements.
6. **Simulate:** Test possible disruptions and understand their impact before making real-world decisions.
7. **Inform:** Give patients access to their live queue position and estimated waiting time.
8. **Analyze:** Understand hospital performance through operational analytics.

QueueX is designed to help hospital staff move from reacting to OPD problems towards anticipating and managing them.

---

## What Makes QueueX Different?

Existing healthcare platforms already provide important capabilities such as online appointments, digital patient records, queue management and patient notifications.

For example:

- **Practo Qikwell** advertises intelligent appointment scheduling, dynamic queues, patient status updates and delay notifications.
- **ABHA / ABDM** focuses on digital health identity, consent-based health record exchange and interoperability across healthcare providers. Its ecosystem also includes digital registration and appointment-related services.

QueueX does not claim to replace these systems or reinvent digital queue management.

Its focus is a different operational challenge: **understanding how an OPD behaves when real-world disruptions occur.**

### Our key differentiator: OPD Disruption Simulation

<em>What if a doctor arrives 30 minutes late? What if an emergency patient arrives? What if several consultations take twice as long as expected?</em>

Most operational dashboards show what is happening right now. QueueX also lets staff explore what could happen next.

The Simulation Studio allows hospital staff to test scenarios such as:

- Emergency patient surges.
- Doctor late arrivals or unavailability.
- Unexpectedly long consultations.
- OPD room or equipment outages.

QueueX then estimates the resulting waiting times, patient impact, queue backlog and workload changes.

It can compare a baseline FIFO queue strategy against QueueX's dynamic optimization strategy and present possible recovery recommendations.

**The important distinction:** simulations run separately from live hospital operations. Testing a scenario does not change actual patient queues or operational records.

### Other distinguishing capabilities

| Capability | What QueueX provides |
|---|---|
| Dynamic waiting-time prediction | Recalculates estimated waiting times as queue conditions change. |
| Priority-aware queue management | Supports emergency and other priority categories with controlled dispatch. |
| Workload intelligence | Identifies overloaded doctors and department bottlenecks. |
| Operational recommendations | Suggests possible queue rebalancing and recovery actions for staff approval. |
| Disruption simulation | Explores the impact of unexpected events without changing live operations. |
| Baseline comparison | Evaluates different queue strategies using measurable operational metrics. |

These are the areas QueueX is designed to bring together in one operational workflow.

---

## Key Features

### 1. Hospital & OPD Management
- Hospital configuration.
- Department management.
- Doctor registration and profiles.
- Doctor schedules and availability.
- OPD session management.
- Staff operational dashboard.

### 2. Patient & Appointment Management
- Patient registration and UHID generation.
- Patient search and profile management.
- Appointment booking.
- Dynamic appointment slot allocation.
- Walk-in registration.
- Cancellation and rescheduling.

### 3. Intelligent Queue Management
- Digital token generation.
- Appointment check-in.
- Priority-based queue ordering.
- Emergency patient handling.
- Call, skip and recall operations.
- Live queue status.
- Consultation lifecycle management.

### 4. Waiting-Time Prediction
- Doctor-specific consultation duration analysis.
- Historical consultation statistics.
- Dynamic waiting-time estimation.
- Live ETA recalculation.
- Emergency-related delay propagation.
- Prediction accuracy measurement.
- Approaching-turn alerts.

### 5. OPD Optimization
- Doctor workload analysis.
- Department bottleneck detection.
- Workload imbalance identification.
- Alternative doctor recommendations.
- Queue redistribution suggestions.
- Staff approval and outcome tracking.

### 6. Disruption Simulation Studio
- Emergency trauma surge simulation.
- Doctor delay simulation.
- Extended consultation simulation.
- OPD room equipment outage simulation.
- Baseline FIFO versus QueueX comparison.
- Before-and-after operational impact analysis.

### 7. Patient Live Tracker
- Patient-facing tracking portal.
- Token and queue position.
- Assigned doctor and consultation room.
- Estimated waiting time.
- Approaching-turn alerts.
- Privacy-conscious patient information display.

### 8. Analytics & Insights
- Patient waiting-time analytics.
- Doctor utilization.
- Department throughput.
- Hourly patient inflow.
- Consultation duration analysis.
- Queue performance comparison.

---

## Technology Stack

QueueX uses a modern web application stack with Firebase for backend infrastructure and persistent data storage.

| Technology | Purpose |
|---|---|
| Next.js (App Router) | Application framework |
| TypeScript | Application development |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |
| Firebase Cloud Firestore | Database |
| Firebase Admin SDK | Secure server-side database operations |
| Firebase Client SDK | Client-side Firebase integration |
| Next.js Route Handlers | Backend API endpoints |
| Zod | Data validation |
| Recharts | Analytics visualizations |
| Vitest | Automated testing |
| Vercel | Deployment target |

---

## Getting Started

Follow these steps to run QueueX locally.

### Prerequisites

Install the following:

- Node.js 20 or later (Node.js 22 LTS recommended).
- npm 10 or later.
- A Firebase project with Cloud Firestore enabled.

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd Local2Global
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Configure the Firebase credentials in `.env.local`.

**Firebase Client SDK**

Obtain these values from Firebase Console → Project Settings → General → Your apps.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

**Firebase Admin SDK**

Obtain the service account credentials from Firebase Console → Project Settings → Service Accounts.

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Keep private credentials out of version control. Never commit `.env.local` or service account private keys.

Refer to `.env.example` for the complete environment configuration.

### 4. Configure Firestore

In Firebase Console:

1. Create or select your Firebase project.
2. Enable Cloud Firestore.
3. Configure the database according to the project's requirements.
4. Deploy the Firestore security rules and indexes when setting up a hosted environment.

Ensure the Firebase Admin SDK credentials correspond to the same project.

### 5. Seed synthetic hospital data

QueueX includes synthetic hospital data for demonstration and testing.

```bash
npm run seed
```

The seed data includes a fictional hospital, departments, doctors, schedules, OPD sessions, patients, appointments and historical consultations.

The seed operation is designed to be repeatable.

To clear the synthetic hospital dataset:

```bash
npm run seed:clear
```

**Warning:** Only use the clear command when you intend to remove the synthetic hospital's data.

### 6. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

QueueX should now be accessible locally.

---

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript checks |
| `npm run test` | Run automated tests |
| `npm run seed` | Seed synthetic hospital data |
| `npm run seed:clear` | Clear synthetic hospital data |

---

## Project Structure

```text
Local2Global/
├── public/
├── src/
│   ├── app/
│   │   ├── api/              # Backend API routes
│   │   └── (dashboard)/      # Staff dashboard and modules
│   ├── components/
│   │   ├── layout/
│   │   ├── shared/
│   │   └── ui/
│   ├── features/
│   │   ├── hospital/
│   │   ├── departments/
│   │   ├── doctors/
│   │   ├── schedules/
│   │   ├── sessions/
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── queue/
│   │   ├── predictions/
│   │   ├── optimization/
│   │   ├── simulations/
│   │   ├── analytics/
│   │   └── dashboard/
│   ├── lib/
│   │   └── firebase/
│   ├── schemas/
│   └── types/
├── docs/
├── tests/
├── .env.example
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── package.json
└── README.md
```

---

## Testing & Validation

QueueX includes automated tests for its core functionality.

The existing project README reports:

- 23 automated test suites.
- 221 automated tests.
- Coverage across patient management, appointments, queue management, consultations, predictions, optimization, simulations, patient tracking and analytics.

Run the test suite:

```bash
npm run test
```

Run the production build:

```bash
npm run build
```

Run type checking:

```bash
npm run type-check
```

---

## Demo Environment

QueueX includes a fictional demonstration hospital:

**Visakha Multispeciality Hospital — Visakhapatnam**

The synthetic dataset contains:

- 6 departments.
- 12 doctors.
- 50 synthetic patients.
- 60 appointments.
- 72 OPD sessions.
- 100 historical consultations.

All demonstration patient records are synthetic and should not be treated as real medical records.

---

## Future Scope

Potential future improvements include:

- Integration with ABDM/ABHA for consent-based health identity and health-record interoperability.
- Integration with hospital information systems.
- SMS and WhatsApp notifications.
- Advanced prediction models trained on larger operational datasets.
- Multi-hospital operational intelligence.
- More advanced resource allocation and scheduling optimization.

---

## Project Vision

Healthcare operations should not depend entirely on patients waiting, staff reacting and doctors trying to catch up.

QueueX aims to make OPD operations more predictable, transparent and responsive.

**From managing queues to understanding the entire flow of outpatient care.**

---

<p align="center">
  <strong>QueueX — Making OPD operations smarter.</strong>
</p>
