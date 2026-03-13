# React Frontend Build Guide

## Purpose

This guide describes how to build a React frontend for the Smart Attendance backend already running in this repository. The frontend should support three roles:

- `admin`
- `lecturer`
- `student`

The backend already provides working APIs for authentication, courses, enrollment, sessions, attendance reporting, student history, analytics, and CSV export.

## Recommended Stack

Use a small, maintainable stack first.

- React with Vite
- TypeScript
- React Router
- TanStack Query for server state
- Zustand or React Context for auth state
- Tailwind CSS for styling
- `qr-scanner` or `html5-qrcode` for student-side QR scanning
- `axios` or `fetch` for API requests

Suggested bootstrap command:

```bash
npm create vite@latest smart-attendance-frontend -- --template react-ts
cd smart-attendance-frontend
npm install
npm install react-router-dom @tanstack/react-query zustand axios tailwindcss @tailwindcss/vite qr-scanner
```

## Backend Surface To Build Against

Base URL during development:

```text
http://127.0.0.1:8000
```

Important backend behavior:

- Auth is Bearer-token based.
- `POST /auth/register` returns a token immediately.
- `POST /auth/login` returns a token.
- `GET /auth/me` returns the authenticated user profile.
- `POST /sessions/start` returns `qr_image_base64` for the lecturer view.
- `POST /attendance/scan` expects a decoded `session_token` string.
- QR tokens expire after about 5 minutes.
- The backend currently allows CORS from all origins in development.

## Frontend Roles And Main Flows

### Admin

- Login
- View users
- View analytics
- Enroll students into courses
- Export attendance CSV

### Lecturer

- Login
- Create courses
- View owned or available courses
- Start a session
- Display QR code to students
- View attendance report for a session
- End a session

### Student

- Login
- View active sessions
- Open scan screen
- Scan QR code from lecturer screen
- Submit attendance
- View personal attendance history

## Suggested Route Map

Use route guards by role.

```text
/login
/register
/app
/app/admin/users
/app/admin/analytics
/app/courses
/app/courses/:courseId
/app/courses/:courseId/enroll
/app/sessions/active
/app/sessions/start
/app/sessions/:sessionId/report
/app/sessions/:sessionId/qr
/app/student/scan
/app/student/history
/app/profile
```

## Suggested Project Structure

```text
src/
  api/
    client.ts
    auth.ts
    courses.ts
    sessions.ts
    attendance.ts
    admin.ts
  app/
    router.tsx
    providers.tsx
  components/
    layout/
    forms/
    feedback/
    qr/
    tables/
  features/
    auth/
    admin/
    courses/
    sessions/
    attendance/
    profile/
  hooks/
  lib/
  pages/
  store/
  types/
  utils/
  main.tsx
```

## Environment Variables

Create a frontend `.env` file:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## API Client Setup

Create one shared client that injects the Bearer token.

Example shape:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

For this backend, local storage is acceptable for a first internal build. If you later want stronger browser-side security, move auth to httpOnly cookies and update the backend accordingly.

## Core Types To Mirror

Mirror the backend response contracts in TypeScript.

```ts
export type User = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "lecturer" | "student";
  is_active: boolean;
};

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
};

export type Course = {
  id: string;
  code: string;
  name: string;
  lecturer_id: string | null;
};

export type SessionResponse = {
  id: string;
  course_id: string;
  started_at: string;
  expires_at: string;
  is_active: boolean;
  qr_image_base64: string;
};

export type AttendanceRecord = {
  id: string;
  student_id: string;
  session_id: string;
  timestamp: string;
  device_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
};
```

## Build Order

Build in this order.

### Phase 1: App Shell And Auth

- Set up routing
- Add login and register pages
- Store token after login or register
- Fetch `/auth/me` on app startup
- Redirect users by role after auth

Definition of done:

- Users can register
- Users can log in
- App remembers session refresh-to-refresh
- Protected routes reject unauthenticated access

### Phase 2: Course Screens

- Lecturer can create courses
- Admin and lecturer can list courses
- Admin can enroll students
- Show enrolled students per course

Definition of done:

- Course create form works
- Enrollment action works
- Validation and server errors render clearly

### Phase 3: Session Management

- Lecturer starts a session
- Show countdown until expiry
- Render the QR image from `qr_image_base64`
- Lecturer can view active sessions
- Lecturer can end a session

To show the QR image in React:

```ts
const src = `data:image/png;base64,${session.qr_image_base64}`;
```

Definition of done:

- Lecturer can start a session and see the QR immediately
- Session status updates after ending

### Phase 4: Student Scan Flow

- Student opens scan page
- Camera reads QR code from lecturer display
- Decoded QR text becomes `session_token`
- Frontend sends token to `POST /attendance/scan`
- Show success or duplicate or expired-token error

Important note:

The backend does not need to expose the raw token for the real frontend flow. The QR scanner library should decode the token directly from the QR image shown on the lecturer screen.

Recommended scanner integration flow:

1. Ask for camera permission
2. Start scanning only after permission is granted
3. Stop scanner immediately after a successful decode
4. Submit decoded text to the attendance endpoint
5. Render a clear final state: success, expired, duplicate, or unauthorized

### Phase 5: Reports And Admin Screens

- Lecturer session report page
- Student attendance history page
- Admin users page
- Admin analytics page
- Admin export button for CSV downloads

Definition of done:

- All report tables load from live backend data
- CSV export triggers a browser download

## Recommended Screens

### Public

- Login
- Register

### Shared Authenticated

- Profile page
- Role-based sidebar or top nav

### Lecturer Screens

- Course list
- Create course form
- Session start form
- Active session list
- Session QR display page
- Session report page

### Student Screens

- Dashboard with active sessions
- QR scan page
- Attendance history

### Admin Screens

- Users list
- Enrollment management
- Analytics dashboard
- CSV export actions

## React Query Guidance

Use query keys by resource.

Examples:

- `['me']`
- `['courses']`
- `['course-students', courseId]`
- `['active-sessions']`
- `['session-report', sessionId]`
- `['student-history', studentId]`
- `['admin-users']`
- `['admin-analytics']`

Invalidate queries after mutations.

Examples:

- After creating a course, invalidate `['courses']`
- After enrolling a student, invalidate `['course-students', courseId]`
- After starting or ending a session, invalidate `['active-sessions']`
- After scanning attendance, invalidate `['student-history', studentId]` and `['session-report', sessionId]`

## Error Handling Rules

Map backend errors to user-visible states.

- `400`: invalid request, expired session, or already ended session
- `401`: unauthenticated
- `403`: wrong role or forbidden action
- `404`: missing course or session
- `409`: duplicate email, duplicate enrollment, duplicate attendance

Do not show raw backend traces. Render clear copy such as:

- `Invalid email or password`
- `Attendance already recorded`
- `This QR code has expired`
- `You are not allowed to perform this action`

## UI Behavior For QR Attendance

### Lecturer device

- Large QR code centered on screen
- Course title and code visible
- Session expiry countdown visible
- Room and optional location visible if supplied
- One clear action to end the session

### Student device

- Very large scan target
- Minimal distractions
- Immediate feedback after decode
- Prominent error state for duplicate or expired QR

## Development Checklist

- Backend server runs on port `8000`
- Frontend runs on a different dev port such as `5173`
- Token persists correctly across refresh
- Role guards are enforced in the UI
- Session countdown works from backend `expires_at`
- QR scan submits decoded token correctly
- CSV downloads open correctly

## Manual Acceptance Test

The frontend is ready for serious QA when this full path works:

1. Register admin, lecturer, and student
2. Lecturer creates a course
3. Admin enrolls the student into the course
4. Lecturer starts a session
5. Lecturer sees a QR image on screen
6. Student scans the QR using the camera page
7. Student receives attendance success
8. Lecturer sees the attendance in session report
9. Student sees the record in history
10. Admin sees the course reflected in analytics and can export CSV

## Future Improvements

- Move auth to cookies for stronger browser security
- Add refresh tokens
- Add richer course filtering and search
- Add lecturer-only filtering for owned sessions and courses
- Add real-time refresh for active session and attendance counts
- Add offline queueing for unreliable student networks
