# PROJECT SUMMARY

## Smart Attendance Tracking App using QR Codes (Web-Based)

A web-based application that allows teachers to generate dynamic QR codes for each class session. Students scan the QR code using their mobile device to mark attendance in real time.

It should have
• Multi-course attendance
• Lecturer QR generation
• Student scan history
• Admin reports
• CSV export
• Analytics dashboard


User Roles

Admin / Teacher
Login securely
Create class session
Generate dynamic QR code
View attendance report
Export CSV


Student
Login securely
Scan QR code
Mark attendance
View attendance history



Example entities:

Tables

Users

Students

Lecturers

Courses

Sessions

Attendance



Security Features (Important)

Prevent cheating by adding:

    Expiring QR Codes

QR valid only (2 - 5 minutes)


Location Verification

Students must be near classroom.
GPS-based attendance verification



## QR Code Workflow
### Teacher Side:
Click “Start Session”
Backend generates secure token
QR code created
QR displayed on projector

### Student Side:
Login
Click “Scan QR”
Camera opens
student puts their ID number
QR decoded
Backend verifies
Attendance saved

## One Scan Per Student

Unique constraint:
student_id + session_id

## Secure Authentication
Email + Password login
Role-based access control
JWT session management

