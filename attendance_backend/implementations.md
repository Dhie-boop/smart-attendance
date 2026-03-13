You are a senior backend engineer and system architect. Your task is to design and implement a **production-ready backend service for a Smart Attendance Tracking System using QR Codes**.

The system will be built using **Python and FastAPI**, with a modular architecture suitable for real-world university deployment.

Your goal is to generate the full backend project step-by-step including folder structure, code implementation, database schema, and API endpoints.

---

## 1. Project Overview

Build a **QR Code–based Attendance Tracking Backend System**.

The system will allow lecturers to generate QR codes for class sessions, and students will scan the QR codes to record attendance.

The backend must validate the scan, prevent cheating, and store attendance records.

---

## 2. Technology Stack

Use the following technologies:

Backend Framework:

* FastAPI

Database:

* PostgreSQL

ORM:

* SQLAlchemy (or SQLModel)

Authentication:

* JWT authentication

Libraries:

* uvicorn
* pydantic
* python-jose
* passlib[bcrypt]
* qrcode
* pillow
* python-dotenv

Database Migration:

* Alembic

Testing:

* pytest
* httpx

Containerization:

* Docker

---

## 3. Architecture Requirements

Follow a **clean modular architecture**.

Project structure should look like this:

project-root/
app/
main.py
core/
config.py
security.py
database/
connection.py
models/
schemas/
api/
services/
utils/
tests/
migrations/
Dockerfile
requirements.txt
.env.example

Ensure the architecture supports scaling.

---

## 4. System Roles

The system must support three user roles:

ADMIN
LECTURER
STUDENT

Permissions:

ADMIN

* manage users
* manage courses
* view attendance reports

LECTURER

* start class session
* generate QR code
* view attendance

STUDENT

* scan QR code
* view personal attendance

---

## 5. Database Schema

Design relational tables for:

users
students
lecturers
courses
enrollments
sessions
attendance_records

Ensure:

attendance_records must enforce a unique constraint on:
(student_id, session_id)

Include fields for:

timestamp
device_id
location (optional)
status

---

## 6. QR Code Logic

When a lecturer starts a class session:

1. Backend creates a session record.
2. A QR code is generated containing:

session_id
timestamp
secure_token

The QR token must be signed using HMAC SHA256 to prevent tampering.

The QR code must expire after a short time window (for example 30 seconds).

Provide a QR generation service that returns the QR image.

---

## 7. Attendance Scan Workflow

Student scans QR using a mobile app.

Mobile app sends request to backend:

POST /attendance/scan

Payload example:

{
"student_id": 12345,
"session_token": "signed_token",
"device_id": "phone_identifier",
"location": "lat,long"
}

The backend must validate:

session exists
session active
token valid
student enrolled in course
student not already marked
within allowed time window

If valid:

Insert attendance record.

Return confirmation response.

---

## 8. API Endpoints

Create REST endpoints for:

Authentication
POST /auth/register
POST /auth/login
GET /auth/me

Courses
POST /courses
GET /courses

Students
GET /students
POST /students

Sessions
POST /sessions/start
POST /sessions/end
GET /sessions/active

Attendance
POST /attendance/scan
GET /attendance/report
GET /attendance/student/{id}

Admin
GET /admin/analytics
GET /admin/export

Schemas Also

---

## 9. Security Features

Implement the following protections:

JWT authentication
Password hashing with bcrypt
Dynamic QR token validation
Duplicate attendance prevention
Session expiration validation

Design code to easily support:

location verification
device fingerprinting

---

## 10. Additional Features

Add support for:

attendance analytics
CSV export of attendance
pagination on large queries
structured logging

---

## 11. Code Quality Requirements

Ensure:

Type hints everywhere
Pydantic schemas for all requests
Dependency injection
Environment variable configuration
Modular service layer
Clear documentation in code comments

---

## 12. Testing

Write unit tests for:

authentication
session creation
QR validation
attendance recording

Use pytest.

---

## 13. Dockerization

Create:

Dockerfile
docker-compose configuration

Services:

FastAPI backend
PostgreSQL database

---

## 14. Documentation

Ensure the project automatically exposes API documentation via:

/docs

Provide a README explaining:

installation
running locally
running with Docker
environment variables

---

## 15. Output Format

Generate the project step-by-step:

1. First generate the folder structure.
2. Then implement core configuration.
3. Then database models.
4. Then authentication system.
5. Then QR code service.
6. Then attendance validation logic.
7. Then API routes.
8. Then testing.
9. Then Docker configuration.

Do not skip steps.
Generate code with explanations where necessary.

The final result should be a **production-grade FastAPI backend suitable for deployment.**
