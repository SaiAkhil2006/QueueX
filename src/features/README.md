# QueueX Feature Modules Architecture

This directory houses the modular feature slices of QueueX. Each feature is isolated to prevent tight coupling and circular dependencies.

## Feature Slices (to be implemented incrementally)

- `hospital/`: Hospital profile, OPD configuration, and general facilities.
- `departments/`: Outpatient clinics and department metadata.
- `doctors/`: Doctor roster, consultation rooms, and duty scheduling.
- `patients/`: Patient registration and intake management.
- `appointments/`: Booking, token assignment, and scheduling.
- `queue/`: Real-time queue state, token progression, and live monitoring.
- `predictions/`: Wait-time forecasting algorithms and arrival modeling.
- `optimization/`: Bottleneck detection, load balancing, and re-routing.
- `analytics/`: Operational intelligence reporting and KPI dashboards.

## Feature Structure Conventions

When implementing each feature in subsequent roadmap tasks:
```text
feature-name/
├── components/   # Feature-specific UI components
├── hooks/        # Feature-specific React hooks
├── services/     # Feature-specific data access / API calls
├── types.ts      # Feature-specific TypeScript interfaces
└── index.ts      # Public export barrel
```
