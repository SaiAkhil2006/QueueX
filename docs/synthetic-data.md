# QueueX — Synthetic Hospital Seed Data

This document provides a comprehensive guide to the **QueueX Synthetic Hospital Seed Dataset** developed for the **GDG Vizag Local2Global Hackathon**.

The seed environment simulates a realistic, busy Indian outpatient hospital operating multiple departments, varied doctor paces, shifting queues, patient appointments, and rich consultation histories.

---

## 1. Overview of Seed Entities

| Entity Collection | Count | Primary Key Scheme | Purpose & Characteristics |
| :--- | :---: | :--- | :--- |
| **Hospitals** | `1` | `hosp-vzg-001` | Visakha Multispeciality Hospital, Visakhapatnam, Andhra Pradesh. |
| **Departments** | `6` | `dept-{code}` | Core OPD clinical units across ground, 1st, and 2nd floors. |
| **Doctors** | `12` | `doc-{dept}-{num}` | 2 doctors per department with heterogeneous pacing & qualifications. |
| **Doctor Schedules** | `12` | `sch-{docId}` | Weekly shift recurring schedules with break periods (Mon–Sat). |
| **OPD Sessions** | `72` | `ses-{docId}-{offset}-{shift}` | Shift sessions covering relative days T-2, T-1, T0, T+1, T+2. |
| **Patients** | `50` | `pat-{0001..0050}` | Realistic Indian names, diverse age groups, UHIDs, contacts. |
| **Appointments** | `60` | `apt-{001..060}` | Statuses: completed, checked-in, booked, cancelled, no-show. |
| **Historical Consults** | `100` | `cns-{001..100}` | Completed consultations with doctor-aligned duration distributions. |
| **Total Entities** | **313** | — | **100% validated against runtime Zod schemas.** |

---

## 2. Hospital Profile

- **ID**: `hosp-vzg-001`
- **Name**: `Visakha Multispeciality Hospital`
- **Hospital Code**: `VMH`
- **Location**: Plot 42, Health City, Chinagadili, Visakhapatnam, Andhra Pradesh — 530040
- **Timezone**: `Asia/Kolkata` (`IST`, UTC+05:30)
- **Phone**: `+91 891 278 9000`
- **Email**: `info@visakhahospital.org`
- **Status**: `active` (`isActive: true`)
- **Configuration**:
  - Morning OPD Hours: `08:30` – `13:30`
  - Evening OPD Hours: `16:00` – `20:00`
  - Emergency Wait Threshold: `10` minutes
  - Max Active Queues per Doctor: `1`
  - Auto-call Next: `false`

---

## 3. Clinical Departments (6)

| Department ID | Name | Code | Floor & Wing | Avg Consult Duration | Clinical Scope |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `dept-gm` | General Medicine | `GM` | Ground Floor, A-Wing | 12 min | Primary adult care, diagnostics, fever clinic |
| `dept-cardio` | Cardiology | `CARD` | 1st Floor, B-Wing | 20 min | Heart disease, ECG, ECHO, hypertension |
| `dept-ortho` | Orthopedics | `ORTH` | Ground Floor, B-Wing | 15 min | Joint replacement, spine, fractures, trauma |
| `dept-derm` | Dermatology | `DERM` | 2nd Floor, C-Wing | 12 min | Skin conditions, trichology, allergies |
| `dept-pedia` | Pediatrics | `PED` | 1st Floor, A-Wing | 15 min | Child health, neonatal follow-up, immunization |
| `dept-ent` | ENT | `ENT` | 2nd Floor, B-Wing | 12 min | Sinus, audiology screening, voice disorders |

---

## 4. Doctors & Consultation Pace Heterogeneity (12)

Every department is staffed by **two doctors** with differing consultation paces to provide realistic queue behavior:

```
Fast Pacing (8-12 min)      Average Pacing (12-16 min)       Thorough/Slow (18-25 min)
   [Dr. Rajesh Varma]           [Dr. Sunitha Rao]              [Dr. K. S. Somasekhar]
   [Dr. Sneha Reddy]            [Dr. Harish Chandra]           (Complex Interventional)
   [Dr. Sai Prakash]            [Dr. Ananya Patra]
```

### Doctor Directory

1. **General Medicine**
   - **`doc-gm-01`**: **Dr. Rajesh Varma** (MBBS, MD) — Room `101`, consult pace: **10 min** (Fast, high throughput)
   - **`doc-gm-02`**: **Dr. Sunitha Rao** (MBBS, DNB) — Room `102`, consult pace: **14 min** (Thorough, preventive focus)
2. **Cardiology**
   - **`doc-cardio-01`**: **Dr. K. S. Somasekhar** (MBBS, MD, DM) — Room `201`, consult pace: **22 min** (Complex cardiology cases)
   - **`doc-cardio-02`**: **Dr. Ananya Patra** (MBBS, MD, DNB) — Room `202`, consult pace: **16 min** (Standard clinical cardiology)
3. **Orthopedics**
   - **`doc-ortho-01`**: **Dr. V. Murali Krishna** (MBBS, MS) — Room `108`, consult pace: **16 min** (Trauma & post-op review)
   - **`doc-ortho-02`**: **Dr. Harish Chandra** (MBBS, D.Ortho) — Room `109`, consult pace: **13 min** (Joint and sports medicine)
4. **Dermatology**
   - **`doc-derm-01`**: **Dr. Sneha Reddy** (MBBS, MD) — Room `301`, consult pace: **11 min** (Rapid clinical review)
   - **`doc-derm-02`**: **Dr. P. Venkat Ramana** (MBBS, DVD) — Room `302`, consult pace: **14 min** (Chronic dermatoses)
5. **Pediatrics**
   - **`doc-pedia-01`**: **Dr. Lakshmi Prasanna** (MBBS, MD) — Room `205`, consult pace: **14 min** (Vaccination & general pediatrics)
   - **`doc-pedia-02`**: **Dr. G. Srinivasulu** (MBBS, DCH, DNB) — Room `206`, consult pace: **16 min** (Complex pediatric illness)
6. **ENT**
   - **`doc-ent-01`**: **Dr. Sai Prakash** (MBBS, MS) — Room `305`, consult pace: **12 min** (Endoscopy & rhinology)
   - **`doc-ent-02`**: **Dr. Divya Bharathi** (MBBS, DLO) — Room `306`, consult pace: **13 min** (Otology & throat disorders)

---

## 5. Doctor Schedules & OPD Sessions

### Schedules (12)
- Weekly recurring Monday to Saturday (`[1, 2, 3, 4, 5, 6]`).
- Working Hours: `09:00` – `17:00`.
- Daily Break Period: `13:00` – `14:00` (`Lunch Break`).
- Max Patients per Session: 30 to 45 (calibrated to doctor pacing).

### OPD Sessions (72)
Sessions are generated deterministically relative to the current execution day in `Asia/Kolkata`:
- **Day -2 (`T-2`)**: Morning shift (`09:00` – `13:00`), status: `completed`, 22 tokens served.
- **Day -1 (`T-1`)**: Morning shift (`09:00` – `13:00`), status: `completed`, 24 tokens served.
- **Day 0 (`Today`)**:
  - Morning shift (`09:00` – `13:00`), status: `active`, 12 completed, 8 waiting, running token #13.
  - Afternoon shift (`14:00` – `17:00`), status: `scheduled`, 10 waiting.
- **Day +1 (`Tomorrow`)**: Morning shift, status: `scheduled`, 8 advance bookings.
- **Day +2 (`Day after`)**: Morning shift, status: `scheduled`, 5 advance bookings.

---

## 6. Synthetic Patients (50)

- **UHID Format**: `QX-2026-0001` through `QX-2026-0050`.
- **Phone Format**: `+91 98480 00001` through `+91 98480 00050` (Andhra Pradesh mobile series).
- **Demographics**:
  - **Pediatric (8 patients)**: ages 2 to 14 years.
  - **Young Adults (12 patients)**: ages 22 to 34 years.
  - **Middle-Aged (15 patients)**: ages 38 to 57 years.
  - **Geriatric (15 patients)**: ages 62 to 82 years.
- **Emergency Contacts**: Completely populated with realistic names and familial relations (`Spouse`, `Son`, `Daughter`, `Father`, `Mother`).

---

## 7. Synthetic Appointments (60)

| Timeframe | Count | Status Breakdown | Notes |
| :--- | :---: | :--- | :--- |
| **Past (T-2, T-1)** | 20 | 16 `completed`, 3 `no_show`, 1 `cancelled` | Historical attendance tracking. |
| **Today (T0)** | 25 | 10 `completed`, 8 `checked_in`, 5 `booked`, 2 `cancelled` | Live operational queue state. |
| **Future (T+1, T+2)** | 15 | 15 `booked` | Advance upcoming appointments. |

- Types: `regular` (45), `follow_up` (12), `referral` (3).
- Every appointment has a valid `scheduledAt` timestamp that aligns with the doctor's shift hours.

---

## 8. Historical Consultations (100)

- Spanning completed and active sessions across past days and today.
- **Positive Durations**: `completedAt > startedAt`.
- **Duration Verification**: `cns.durationSeconds === (completedAt - startedAt) / 1000`.
- **Pacing Distribution**:
  - Fast doctors (e.g. Dr. Rajesh Varma, Dr. Sneha Reddy): `480s` – `780s` (8–13 min).
  - Cardiology / thorough doctors (e.g. Dr. K. S. Somasekhar): `1080s` – `1680s` (18–28 min).
- **Outcomes**: Distributed across `prescribed`, `routine_clear`, `tests_ordered`, `follow_up_needed`, `referred`, `admitted`.

---

## 9. CLI Tool & Running the Seed

### Available Commands

```bash
# Generate, validate, and write seed data to Firestore (or run offline dry-run if credentials absent)
npm run seed

# Safely clear synthetic hospital (hosp-vzg-001) and its subcollections
npm run seed:clear

# Run in-memory validation only (never writes to Firestore)
npx tsx scripts/seed/index.ts --dry-run

# Show CLI options
npx tsx scripts/seed/index.ts --help
```

### Safety & Idempotency Guarantees

1. **Deterministic IDs**: Every entity uses a deterministic primary ID (`hosp-vzg-001`, `dept-gm`, `doc-gm-01`, `pat-0001`, `apt-001`, `cns-001`). Re-running `npm run seed` performs an idempotent upsert (`set(..., { merge: true })`) without creating duplicate documents.
2. **Safe Clear Isolation**: `npm run seed:clear` only touches documents under `/hospitals/hosp-vzg-001` and its subcollections. It **never** performs an unrestricted database wipe.
3. **Offline Dry-Run Detection**: If Firebase credentials are not configured in `.env.local`, the tool generates and verifies the complete dataset in-memory against Zod schemas, logging clear statistics without crashing or fabricating fake database operations.
