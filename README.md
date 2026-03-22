# Smart Attendance System 

A modern web-based attendance tracking application that uses dynamic QR codes for secure, real-time attendance marking in educational institutions. Teachers generate time-limited QR codes for their class sessions, and students scan them to mark their attendance instantly.

## Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Local Setup](#-local-setup)
  - [Option 1: Using Docker Compose (Recommended)](#option-1-using-docker-compose-recommended)
  - [Option 2: Manual Setup](#option-2-manual-setup)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Security Features](#-security-features)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

##  Features

### For Teachers/Lecturers

- Secure authentication and role-based access control
- Create and manage class sessions
- Generate dynamic, time-limited QR codes for each session
- View real-time attendance reports
- Access analytics dashboard with attendance trends
- Export attendance data to CSV
- Schedule sessions in advance
- Manage multiple courses and students

### For Students

- Secure login with email/password
- Scan QR codes using device camera
- Mark attendance in real-time
- View personal attendance history
- Access enrolled courses
- See attendance status (Present/Late/Absent)

### For Administrators

- Manage users (students and lecturers)
- System-wide analytics and reports
- Dashboard with key metrics
- Course and student management

## Architecture

The application follows a modern three-tier architecture:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  React Frontend │ ───▶ │  FastAPI Backend│ ───▶ │  PostgreSQL DB  │
│   (Vite + TS)   │      │   (Python 3.11) │      │   (v15 Alpine)  │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

- **Frontend**: React 19 with TypeScript, TailwindCSS, and Vite
- **Backend**: FastAPI with SQLAlchemy ORM and Alembic migrations
- **Database**: PostgreSQL 15 with connection pooling
- **Authentication**: JWT-based with secure token management
- **QR Generation**: Dynamic QR codes with time-based expiration

## Tech Stack

### Backend

- **Framework**: FastAPI 0.135.1
- **Language**: Python 3.11
- **ORM**: SQLAlchemy with Alembic migrations
- **Database**: PostgreSQL 15
- **Authentication**: JWT (python-jose) with bcrypt password hashing
- **QR Code**: qrcode library with PIL/Pillow
- **Testing**: pytest
- **Validation**: Pydantic 2.x

### Frontend

- **Framework**: React 19.2.0
- **Language**: TypeScript 5.9
- **Build Tool**: Vite 7.3
- **Styling**: TailwindCSS 4.2
- **Routing**: React Router DOM 7.13
- **HTTP Client**: Axios 1.13
- **QR Scanning**: html5-qrcode, qr-scanner
- **QR Display**: qrcode.react

### DevOps

- **Containerization**: Docker & Docker Compose
- **Deployment**: Render.com (configured)
- **CI/CD**: Ready for GitHub Actions

## Prerequisites

Before running this project, ensure you have the following installed:

### For Docker Setup (Option 1 - Recommended)

- [Docker](https://www.docker.com/get-started) (v20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0 or higher)

### For Manual Setup (Option 2)

- [Python](https://www.python.org/downloads/) (v3.11 or higher)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [PostgreSQL](https://www.postgresql.org/download/) (v15 or higher)

### Optional Tools

- [Git](https://git-scm.com/downloads) for version control
- [Postman](https://www.postman.com/downloads/) or similar for API testing

## Local Setup

### Option 1: Using Docker Compose (Recommended)

This is the easiest way to run the entire application with minimal setup.

#### Step 1: Clone the Repository

```bash
git clone https://github.com/Dhie-boop/smart-attendance.git
cd smart-attendance
```

#### Step 2: Configure Environment Variables

Create a `.env` file in the `attendance_backend` directory:

```bash
cd attendance_backend
cp .env.example .env
```

Edit the `.env` file with your preferred values (or keep defaults for development):

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/attendance_db

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# QR Code & Session Settings
QR_TOKEN_EXPIRE_SECONDS=300          # 5 minutes
SESSION_DURATION_SECONDS=7200        # 2 hours
LATE_THRESHOLD_SECONDS=600           # 10 minutes

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Docker PostgreSQL Settings
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=attendance_db
```

#### Step 3: Start the Application

```bash
docker-compose up -d
```

This will:

- Pull necessary Docker images
- Create and start PostgreSQL container
- Build and start the FastAPI backend container
- Run database migrations automatically
- Expose backend on `http://localhost:8000`

#### Step 4: Start the Frontend

In a new terminal:

```bash
cd attendance-frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

#### Step 5: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative API Docs**: http://localhost:8000/redoc (ReDoc)

#### Step 6: Create Initial Admin User

Use the API documentation at http://localhost:8000/docs:

1. Navigate to `/auth/register`
2. Click "Try it out"
3. Register with role `admin`:

```json
{
  "full_name": "Admin User",
  "email": "admin@example.com",
  "password": "securepassword123",
  "role": "admin"
}
```

---

### Option 2: Manual Setup

For development or when you want more control over each component.

#### Backend Setup

##### Step 1: Clone and Navigate

```bash
git clone https://github.com/Dhie-boop/smart-attendance.git
cd smart-attendance/attendance_backend
```

##### Step 2: Create Virtual Environment

**On Windows (PowerShell):**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**On macOS/Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

##### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

##### Step 4: Set Up PostgreSQL Database

1. Install PostgreSQL (if not already installed)
2. Create a new database:

```bash
psql -U postgres
CREATE DATABASE attendance_db;
\q
```

##### Step 5: Configure Environment

Create `.env` file in `attendance_backend`:

```bash
cp .env.example .env
```

Edit with your database credentials:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/attendance_db
SECRET_KEY=generate-a-long-random-string-here
# ... other settings as shown above
```

##### Step 6: Run Database Migrations

```bash
alembic upgrade head
```

##### Step 7: Start the Backend Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or using the main.py:

```bash
python -m uvicorn main:app --reload
```

Backend will be available at http://localhost:8000

#### Frontend Setup

##### Step 1: Navigate to Frontend

```bash
cd ../attendance-frontend
```

##### Step 2: Install Dependencies

```bash
npm install
```

##### Step 3: Configure API URL (Optional)

Create `.env` file if you need to change the API URL:

```env
VITE_API_URL=http://localhost:8000
```

##### Step 4: Start Development Server

```bash
npm run dev
```

Frontend will be available at http://localhost:5173

##### Step 5: Build for Production (Optional)

```bash
npm run build
npm run preview
```

---

## 📚 API Documentation

The API follows REST principles and is fully documented with OpenAPI/Swagger.

### Base URL

```
http://localhost:8000
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Main Endpoints

#### Authentication (`/auth`)

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user details

#### Sessions (`/sessions`)

- `POST /sessions/start` - Create and start a new session (Lecturer)
- `POST /sessions/end/{session_id}` - End an active session
- `GET /sessions/active` - List all active sessions
- `GET /sessions/{session_id}` - Get session details
- `POST /sessions/schedule` - Schedule a future session
- `GET /sessions/scheduled` - List scheduled sessions
- `POST /sessions/scheduled/{id}/activate` - Activate scheduled session
- `DELETE /sessions/scheduled/{id}` - Delete scheduled session

#### Attendance (`/attendance`)

- `POST /attendance/scan` - Mark attendance by scanning QR code (Student)
- `GET /attendance/sessions` - Get session summaries
- `GET /attendance/report` - Get attendance report for a session
- `GET /attendance/student/{student_id}` - Get student attendance history

#### Courses (`/courses`)

- `POST /courses` - Create new course (Lecturer)
- `GET /courses` - List all courses
- `POST /courses/{course_id}/enroll` - Enroll student in course
- `GET /courses/{course_id}/students` - List students in course
- `PATCH /courses/{course_id}/lecturer` - Assign lecturer to course
- `PATCH /courses/{course_id}/unassign-lecturer` - Unassign lecturer

#### Students (`/students`)

- `GET /students` - List all students (Admin)
- `POST /students` - Create student account (Admin)
- `GET /students/my-courses` - Get enrolled courses (Student)

#### Admin (`/admin`)

- `POST /admin/students` - Bulk create students
- `GET /admin/users` - List all users
- `GET /admin/dashboard` - Get dashboard metrics
- `GET /admin/analytics` - Get attendance analytics
- `GET /admin/export` - Export attendance data to CSV

### Interactive API Documentation

Visit http://localhost:8000/docs for interactive API documentation where you can:

- View all endpoints with detailed descriptions
- Test endpoints directly in the browser
- See request/response schemas
- Authenticate and make authorized requests

## 📁 Project Structure

```
smart-attendance/
│
├── attendance_backend/              # FastAPI Backend
│   ├── app/
│   │   ├── api/                     # API route handlers
│   │   │   ├── admin_routes.py
│   │   │   ├── attendance_routes.py
│   │   │   ├── auth_routes.py
│   │   │   ├── course_routes.py
│   │   │   ├── session_routes.py
│   │   │   └── student_routes.py
│   │   ├── core/                    # Core configurations
│   │   │   ├── config.py           # Settings & environment variables
│   │   │   └── security.py         # JWT & password hashing
│   │   ├── database/
│   │   │   └── connection.py       # Database connection & session
│   │   ├── models/                  # SQLAlchemy models
│   │   │   ├── attendance.py
│   │   │   ├── course.py
│   │   │   ├── session.py
│   │   │   ├── student.py
│   │   │   └── user.py
│   │   ├── services/                # Business logic
│   │   │   ├── attendance_service.py
│   │   │   ├── auth_service.py
│   │   │   └── qr_service.py
│   │   └── main.py                  # FastAPI app initialization
│   ├── schemas/                     # Pydantic schemas
│   ├── migrations/                  # Alembic migrations
│   ├── tests/                       # Pytest test suite
│   ├── utils/                       # Helper utilities
│   ├── requirements.txt             # Python dependencies
│   ├── docker-compose.yml           # Docker Compose configuration
│   ├── Dockerfile                   # Backend container definition
│   ├── alembic.ini                  # Alembic configuration
│   ├── start.sh                     # Production startup script
│   └── .env.example                 # Environment variables template
│
├── attendance-frontend/             # React Frontend
│   ├── src/
│   │   ├── api/                     # API client & axios setup
│   │   ├── assets/                  # Static assets
│   │   ├── components/              # React components
│   │   ├── context/                 # React Context providers
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── pages/                   # Page components
│   │   ├── types/                   # TypeScript type definitions
│   │   ├── utils/                   # Utility functions
│   │   ├── App.tsx                  # Main app component
│   │   └── main.tsx                 # Entry point
│   ├── public/                      # Public static files
│   ├── package.json                 # Node dependencies
│   ├── vite.config.ts               # Vite configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tailwind.config.js           # TailwindCSS configuration
│   └── vercel.json                  # Vercel deployment config
│
├── render.yaml                      # Render.com deployment config
└── README.md                        # This file
```

## 🔒 Security Features

### Anti-Cheating Mechanisms

1. **Time-Limited QR Codes**
   - QR codes expire after 5 minutes (configurable)
   - Prevents sharing screenshots of QR codes
   - Session duration: 2 hours (configurable)

2. **Attendance Status Logic**
   - **Present**: Scanned within 10 minutes of session start
   - **Late**: Scanned between 10 minutes and session end
   - **Absent**: Marked automatically when session ends without scanning

3. **One Scan Per Student**
   - Unique constraint: `student_id` + `session_id`
   - Prevents duplicate attendance marking
   - Database-level constraint enforcement

4. **Secure Token Generation**
   - Cryptographically secure random tokens
   - Session-specific tokens
   - Server-side validation

### Authentication & Authorization

1. **JWT-Based Authentication**
   - Secure token generation with expiration
   - Tokens include user role and ID
   - Protected endpoints require valid tokens

2. **Password Security**
   - Bcrypt hashing with salt
   - Minimum password requirements (enforced client-side)
   - No plain-text password storage

3. **Role-Based Access Control (RBAC)**
   - **Admin**: Full system access
   - **Lecturer**: Course and session management
   - **Student**: Attendance marking and history

4. **CORS Protection**
   - Configured allowed origins
   - Credential support for secure cookies
   - Configurable via environment variables

### Database Security

- Prepared statements (SQLAlchemy ORM)
- SQL injection prevention
- Connection pooling for performance
- Environment-based configuration

## Deployment

The project is configured for deployment on Render.com, but can be deployed to any platform.

### Deploying to Render

1. Push your code to GitHub
2. Connect your repository to Render
3. Render will automatically detect `render.yaml`
4. Configure the following environment variables:
   - `DATABASE_URL` (auto-set from managed database)
   - `SECRET_KEY` (auto-generated)
   - `FRONTEND_URL` (set to your frontend URL after deployment)
   - `VITE_API_URL` (set to your backend URL)

### Manual Deployment

#### Backend Requirements

- Python 3.11+
- PostgreSQL database
- Environment variables configured
- Run migrations: `alembic upgrade head`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

#### Frontend Requirements

- Node.js 18+
- Build: `npm run build`
- Serve `dist` folder as static site
- Configure `VITE_API_URL` before building

### Environment Variables for Production

**Backend:**

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=strong-random-string-at-least-32-characters
FRONTEND_URL=https://your-frontend-domain.com
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend:**

```env
VITE_API_URL=https://your-api-domain.com
```

## Troubleshooting

### Backend Issues

**Database Connection Error**

```
Solution: Verify DATABASE_URL is correct and PostgreSQL is running
Check: psql -U postgres -d attendance_db
```

**Migration Errors**

```bash
# Reset migrations (development only - will lose data)
alembic downgrade base
alembic upgrade head

# Check migration status
alembic current
alembic history
```

**Port Already in Use**

```bash
# Change port in uvicorn command
uvicorn app.main:app --port 8001
```

### Frontend Issues

**API Connection Failed**

```
Solution: Check VITE_API_URL in .env matches backend URL
Verify backend is running at expected address
Check CORS settings in backend config.py
```

**QR Scanner Not Working**

```
Solution: Ensure HTTPS in production (camera requires secure context)
Check browser permissions for camera access
Try a different browser (Chrome/Firefox recommended)
```

**Build Errors**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Docker Issues

**Container Won't Start**

```bash
# Check logs
docker-compose logs app
docker-compose logs db

# Rebuild containers
docker-compose down -v
docker-compose up --build
```

**Database Not Initializing**

```bash
# Remove volumes and restart
docker-compose down -v
docker volume prune
docker-compose up -d
```

### Common Errors

**401 Unauthorized**

- Token expired → Login again
- Token missing → Add Authorization header
- Invalid token → Check token format

**403 Forbidden**

- Insufficient permissions → Check user role
- Wrong endpoint → Verify API documentation

**500 Internal Server Error**

- Check backend logs
- Verify database migrations
- Check environment variables

## Testing

### Backend Tests

```bash
cd attendance_backend
pytest
pytest --cov=app tests/  # With coverage
```

### Frontend Tests

```bash
cd attendance-frontend
npm run test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions:

- Create an issue on GitHub
- Contact: [Your Contact Information]

## Acknowledgments

- FastAPI for the excellent Python web framework
- React team for the powerful frontend library
- PostgreSQL for the robust database system
- All open-source contributors

---

**Built with ❤️ for modern education**
