# CivicConnect - Full Stack

CivicConnect is a MERN-style civic grievance and transparency platform.

## Folders

- `backend` - Express + MongoDB + JWT + Cloudinary + AI/heuristic complaint analysis
- `frontend` - React + Redux Toolkit + Vite

## Backend

```bash
cd backend
npm install
npm run dev
```

Runs on `http://localhost:8080`.

Create `backend/.env` from `.env.example` and add your own MongoDB/JWT/Cloudinary values.

The backend initializes starter departments/categories automatically by default. You can also run:

```bash
npm run seed
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend uses `VITE_API_BASE_URL` when provided; otherwise it uses `http://localhost:8080/api/v1`.

## Registration roles

For local project/demo use, the registration page supports:

- Citizen
- Department Staff (requires an active department)
- Admin

Production deployments should normally protect privileged role creation with an approval or invitation flow.
