# CivicConnect Frontend

This is the integrated React/Vite frontend for CivicConnect.

## Run

```bash
npm install
npm run dev
```

Create `.env` from `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## State management

Redux Toolkit + React Redux are used for:

- authentication
- complaints
- categories/departments/staff
- notifications
- comments
- feedback
- analytics
- admin management

The UI reads backend-backed state through `useSelector()` and triggers operations through `useDispatch()`.

## Backend

The frontend expects the CivicConnect backend on port `8080` by default.

```text
http://localhost:8080/api/v1
```

All complaint, auth, notification, dashboard and management data is fetched from the backend; there is no seeded complaint dashboard dataset in the application.
