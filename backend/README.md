# CivicConnect Backend

This backend powers the CivicConnect public-grievance workflow with MongoDB, JWT authentication, Cloudinary evidence uploads, role-based access, complaint status history, notifications, comments, feedback, and analytics.

## Run

```bash
npm install
npm run dev
```

Production:

```bash
npm start
```

Default port: `8080`.

Create `backend/.env` using `.env.example` and add your own MongoDB, JWT, and Cloudinary values. Do not commit real secrets.

## Main API groups

- `/api/v1/users`
- `/api/v1/departments`
- `/api/v1/categories`
- `/api/v1/complaints`
- `/api/v1/status-history`
- `/api/v1/comments`
- `/api/v1/feedback`
- `/api/v1/notifications`
- `/api/v1/analytics`

Health check: `GET /api/v1/health`

## Complaint workflow

`submitted → under_review → assigned → in_progress → resolved → citizen verification`

A citizen can reopen a resolved complaint. Resolution proof is required for the `resolved` step.

## Access rules

- Citizen: own complaints and public information relevant to those complaints.
- Department staff: complaints belonging to their department or assigned directly to them.
- Admin: platform-wide complaint, user, department, category, and analytics access.

The backend enforces these rules; hiding buttons in the frontend is not used as the security boundary.

## Automated complaint analysis

The complaint creation/update flow performs a local, dependency-free heuristic analysis to populate the existing AI fields:

- suggested category
- suggested priority
- suggested department
- confidence
- duplicate detection

This is intentionally implemented without an external AI key. Replace `utils/complaintAnalysis.js` with a real model/provider integration later if required.

## Important behavior

- Complaint IDs are human-friendly (`CC-...`) while MongoDB `_id` remains the internal identifier.
- `GET /api/v1/complaints/track/:complaintId` supports public tracking using the human-friendly complaint ID.
- Dashboard analytics are calculated from the database; no fixed dashboard totals are required by the API.
- Evidence and resolution proof use Multer memory storage and Cloudinary uploads.
- Invalid IDs and malformed JSON are returned as client errors instead of generic server errors where applicable.

## Master data and role registration

The backend automatically initializes the starter departments and categories when it starts (`AUTO_SEED_MASTER_DATA=true` by default). You can also run the idempotent seed manually:

```bash
npm run seed
```

Public registration accepts `citizen`, `department`, and `admin` roles for local/demo use. Department accounts must select an active department. In a production deployment, privileged self-registration should be replaced with an admin approval/invitation flow.
