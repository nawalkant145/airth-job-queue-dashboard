# Mini Job Queue Management Dashboard

A full-stack, concurrency-safe **Job Queue Management Dashboard** built with **React**, **NestJS**, and **PostgreSQL**.

Designed for the **AIRTH** Technical Hiring Assignment.

---

## 🚀 Live Links & Submission Details

- **GitHub Repository**: [Public Repo Link](https://github.com/skant/airth-job-queue-dashboard)
- **Live Frontend (Vercel)**: `https://airth-job-queue-dashboard.vercel.app` (Placeholder - Update upon deployment)
- **Live Backend API (Render)**: `https://airth-job-queue-backend.onrender.com` (Placeholder - Update upon deployment)

---

## 🎯 Tech Stack

### Frontend
- **Framework**: React.js (v18+) with Vite
- **Language**: TypeScript
- **State Management**: React Fundamentals (`useState`, `useEffect`, `useMemo`, Custom Hooks `useJobs`)
- **Styling**: Modern, responsive CSS

### Backend
- **Framework**: NestJS (v10+)
- **Language**: TypeScript
- **ORM**: TypeORM
- **Database**: PostgreSQL (Neon PostgreSQL / Local Postgres)
- **Validation**: `class-validator`, `class-transformer`, `ParseUUIDPipe`

---

## ✨ Features

1. **Create Jobs**: New jobs start in `pending` state with UUID PK automatically generated.
2. **Display Jobs**: Lists all jobs sorted by `createdAt DESC`.
3. **Status Transitions**: Strict transition control (`pending → running → completed / failed`).
4. **Database-Level Concurrency Control**: Prevents race conditions using atomic conditional SQL updates (`409 Conflict` on race conditions).
5. **Bonus - Status Audit Logging**: Every successful status update records a historical audit log in `job_status_transitions` within the same database transaction.
6. **Client-Side Filtering & Metrics**: Real-time status filter dropdown and status metric counts calculated efficiently with `useMemo`.
7. **Per-Row Loading States**: Action-specific feedback (`Running...`, `Completing...`, `Deleting...`) without freezing the entire dashboard.
8. **Delete Jobs**: Remove jobs with clean `404 Not Found` handling for nonexistent IDs.

---

## 📁 Project Structure

```
airth-job-queue-dashboard/
├── backend/
│   ├── src/
│   │   ├── jobs/
│   │   │   ├── dto/
│   │   │   │   ├── create-job.dto.ts
│   │   │   │   └── update-job-status.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── job.entity.ts
│   │   │   │   └── job-audit-log.entity.ts      # [BONUS] Audit log entity
│   │   │   ├── enums/
│   │   │   │   └── job-status.enum.ts
│   │   │   ├── jobs.controller.ts
│   │   │   ├── jobs.service.ts
│   │   │   └── jobs.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test-concurrency.js                     # Automated concurrency test script
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── JobForm.tsx
    │   │   ├── StatusFilter.tsx
    │   │   ├── StatusCounts.tsx
    │   │   ├── JobList.tsx
    │   │   └── JobRow.tsx
    │   ├── hooks/
    │   │   └── useJobs.ts
    │   ├── api.ts
    │   ├── types.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── .env.example
    └── package.json
```

---

## ⚙️ Concurrency & State Transition Reasoning

### 🧠 Critical Concurrency Questions & Answers

#### 1. Where should the transition rule be enforced?
**The backend database layer must enforce transition rules**, not the React frontend. Frontend button logic (hiding/disabling actions) is strictly a UX convenience. The backend and PostgreSQL database enforce state transition invariants so direct API requests cannot bypass business logic.

#### 2. What happens if someone bypasses the React application and calls the API directly?
If a client sends a `PATCH /jobs/:id/status` request via cURL, Postman, or a script:
- The backend validates the payload DTO using NestJS `ValidationPipe`.
- The service attempts an **atomic conditional SQL `UPDATE`** enforcing allowed preceding statuses.
- If the current database status does not match allowed transition states, `0` rows are affected. The backend checks job existence and immediately returns a `409 Conflict` HTTP error with a descriptive message (e.g., `"Cannot transition job from state 'completed' to 'running'"`).

#### 3. What happens when two requests arrive at nearly the same time?
Imagine Tab A and Tab B both issue `PATCH /jobs/:id/status` to set a `pending` job to `running` simultaneously:
1. Both requests hit PostgreSQL.
2. PostgreSQL acquires an exclusive row lock for the first executed transaction.
3. **Request A** executes `UPDATE jobs SET status = 'running' WHERE id = :id AND status IN ('pending')`. Exactly **1 row is updated**. Request A returns `200 OK` with the updated job object.
4. **Request B** executes the exact same query immediately after. Because the row status is now `'running'`, `status IN ('pending')` evaluates to false. Exactly **0 rows are updated**.
5. Request B detects 0 rows updated, queries the job, confirms it exists, and returns **`409 Conflict`**.

#### 4. How do you prevent an invalid or inconsistent state? Why is a naive approach unsafe?
- **Why Naive is Unsafe**: A naive `1. Read job → 2. Check status in JS → 3. Modify → 4. Save` creates a classic **Time-of-Check to Time-of-Use (TOCTOU) race condition**. Two concurrent requests reading `pending` simultaneously would both pass the JS check and both attempt to write, leading to duplicate state changes or inconsistent audit logs.
- **Why Database Conditional UPDATE Works**: PostgreSQL handles row locking atomically. By combining the read check and write update into a single atomic statement (`UPDATE ... WHERE status IN (...)`), database row lock mechanics eliminate race conditions entirely without requiring complex external locks like Redis or Redlock.

---

## 🔄 State Transition Rules

Allowed job states: `pending`, `running`, `completed`, `failed`.

Valid transitions:
- `pending → running`
- `running → completed`
- `running → failed`

Invalid transitions (return `409 Conflict` or `400 Bad Request`):
- `completed → running`
- `failed → running`
- `pending → completed`
- `pending → failed`
- Direct creation of non-`pending` status via `POST /jobs`

---

## 🛠️ API Documentation

### `POST /jobs`
Creates a new job. Always initializes status to `pending`.

**Request Body**:
```json
{
  "title": "Process Weekly Payouts",
  "type": "billing"
}
```

**Response (`201 Created`)**:
```json
{
  "id": "c39a8e45-12ab-4c3e-8901-d82b4ef56789",
  "title": "Process Weekly Payouts",
  "type": "billing",
  "status": "pending",
  "createdAt": "2026-09-15T18:30:00.000Z",
  "updatedAt": "2026-09-15T18:30:00.000Z"
}
```

---

### `GET /jobs`
Retrieves all jobs sorted by `createdAt DESC`.

**Response (`200 OK`)**:
```json
[
  {
    "id": "c39a8e45-12ab-4c3e-8901-d82b4ef56789",
    "title": "Process Weekly Payouts",
    "type": "billing",
    "status": "pending",
    "createdAt": "2026-09-15T18:30:00.000Z",
    "updatedAt": "2026-09-15T18:30:00.000Z"
  }
]
```

---

### `PATCH /jobs/:id/status`
Atomically transitions job status.

**Request Body**:
```json
{
  "status": "running"
}
```

**Response (`200 OK`)**:
```json
{
  "id": "c39a8e45-12ab-4c3e-8901-d82b4ef56789",
  "title": "Process Weekly Payouts",
  "type": "billing",
  "status": "running",
  "createdAt": "2026-09-15T18:30:00.000Z",
  "updatedAt": "2026-09-15T18:31:15.000Z"
}
```

**Possible Errors**:
- `400 Bad Request`: Invalid UUID format or invalid status enum value.
- `404 Not Found`: Job ID does not exist.
- `409 Conflict`: Invalid state transition attempt (e.g. `completed` → `running`).

---

### `DELETE /jobs/:id`
Deletes a job by ID.

**Response (`200 OK`)**:
```json
{
  "message": "Job with ID 'c39a8e45-12ab-4c3e-8901-d82b4ef56789' successfully deleted"
}
```

**Possible Errors**:
- `400 Bad Request`: Malformed UUID.
- `404 Not Found`: Job does not exist.

---

## 🎁 Bonus Feature: Status Transition Audit Log

**What was added?**
A dedicated audit logging table: `job_status_transitions`.

**Database Schema**:
- `id` (UUID PK)
- `job_id` (UUID FK to jobs)
- `from_status` (varchar)
- `to_status` (varchar)
- `changed_at` (timestamptz)

**Why was this chosen?**
"It provides an immutable audit trail showing how a job reached its current state over time. This helps developers diagnose unexpected state changes or timing anomalies in production."

**Implementation**:
Executed using TypeORM database transactions (`dataSource.transaction`). The atomic status update and audit log insertion execute together inside the exact same database transaction block.

---

## 🧪 Concurrency Test Script

An automated test script is provided in `backend/test-concurrency.js` to simulate simultaneous requests.

### How to Run:
1. Start NestJS backend: `npm run start:dev` (in `backend/`)
2. Run test script: `npm run test:concurrency` (in `backend/`)

### Output:
```
⚡ STARTING ATOMIC CONCURRENCY CONTROL TEST
1. Creating a new job with status: pending...
✅ Created Job ID: 8a719d2b-..., Status: pending

2. Firing 2 SIMULTANEOUS PATCH requests (pending -> running)...

--- RESULTS RECEIVED ---
Request 1 Status: 200 { id: '...', status: 'running' }
Request 2 Status: 409 { statusCode: 409, message: "Cannot transition job from state 'running' to 'running'" }
------------------------

🎉 CONCURRENCY TEST PASSED!
✅ Exactly ONE request returned 200 OK.
✅ Exactly ONE request returned 409 Conflict.
```

---

## 💻 Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed locally OR a free [Neon PostgreSQL](https://neon.tech) database URL.

### 1. Setup Backend
```bash
cd backend
npm install

# Create .env file from .env.example
cp .env.example .env

# Configure DATABASE_URL in backend/.env
# Example: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/job_queue_db

# Start NestJS backend in dev mode
npm run start:dev
```
Backend will listen on `http://localhost:3000`.

### 2. Setup Frontend
```bash
cd frontend
npm install

# Create .env file from .env.example
cp .env.example .env

# Verify VITE_API_URL=http://localhost:3000 in frontend/.env

# Start Vite React dev server
npm run dev
```
Frontend will open on `http://localhost:5173`.

---

## ⚖️ Trade-offs & Engineering Decisions

1. **PostgreSQL over SQLite**: PostgreSQL provides robust transactional concurrency guarantees and native support for Neon PostgreSQL deployment.
2. **Client-Side Filtering & Counting**: "At the expected scale of this internship assignment, client-side filtering and counting keeps the API simple and responsive. For a much larger dataset, server-side pagination/filtering would be preferable."
3. **No Distributed Queue / Redis**: A simple REST architecture with PostgreSQL atomic updates fulfills all assignment requirements without adding unnecessary complexity like Redis, Kafka, or WebSockets.
4. **TypeORM `synchronize: true`**: Used for fast prototyping and internship evaluation simplicity; production systems should utilize database migrations.

---

## 🔮 Future Improvements

- User Authentication & Role-Based Access Control (RBAC)
- Server-side Pagination & Searching
- WebSockets / Server-Sent Events (SSE) for real-time dashboard updates across tabs
- Retry mechanism with exponential backoff for failed jobs
- Background worker execution engines (BullMQ / Redis)
