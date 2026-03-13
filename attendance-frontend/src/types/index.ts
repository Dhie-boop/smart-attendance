// ─── Auth ────────────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'lecturer' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  student_id?: string;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  student_number?: string;
  department?: string;
  year_level?: number;
}

// ─── Courses ─────────────────────────────────────────────────────────────────
export interface Course {
  id: string;
  code: string;
  name: string;
  lecturer_id?: string;
  lecturer_name?: string;
  enrolled_count?: number;
  created_at: string;
}

export interface CourseCreate {
  code: string;
  name: string;
}

export interface EnrollmentResponse {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
}

// ─── Sessions ────────────────────────────────────────────────────────────────
export interface SessionResponse {
  id: string;
  course_id: string;
  started_at: string;
  expires_at: string;
  is_active: boolean;
  qr_image_base64?: string;
}

export interface SessionPublicResponse {
  id: string;
  course_id: string;
  started_at: string;
  expires_at: string;
  is_active: boolean;
  course_code?: string;
  course_name?: string;
  lecturer_name?: string;
  qr_image_base64?: string;
  session_token?: string;
}

export interface SessionStartRequest {
  course_id: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
}

export interface SessionEndResponse {
  id: string;
  is_active: boolean;
  ended_at: string;
}

export interface SessionReportSummary {
  id: string;
  course_id: string;
  course_code?: string;
  course_name?: string;
  lecturer_id?: string;
  lecturer_name?: string;
  started_at: string;
  ended_at?: string;
  expires_at: string;
  is_active: boolean;
  total_students: number;
  present_count: number;
  late_count: number;
  absent_count: number;
}

// ─── Attendance ──────────────────────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name?: string;
  student_number?: string;
  timestamp: string;
  status: AttendanceStatus;
  device_id?: string;
  course_code?: string;
  course_name?: string;
}

export interface AttendanceScanRequest {
  session_token: string;
  student_number: string;
  device_id?: string;
  latitude?: number;
  longitude?: number;
}

export interface AttendanceScanResponse {
  success: boolean;
  message: string;
  attendance_id: string;
  timestamp: string;
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export interface AdminStats {
  total_students: number;
  total_courses: number;
  attendance_rate: number;
  active_sessions: number;
}

// ─── Scheduled Sessions ──────────────────────────────────────────────────────
export interface ScheduledSessionCreate {
  course_id: string;
  title: string;
  scheduled_date: string; // YYYY-MM-DD
  start_time: string;     // HH:MM
  end_time: string;       // HH:MM
  location?: string;
}

export interface ScheduledSessionResponse {
  id: string;
  course_id: string;
  lecturer_id: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  course_code?: string;
  course_name?: string;
  lecturer_name?: string;
  created_at: string;
}

// ─── Student Dashboard ──────────────────────────────────────────────────────
export interface StudentCourse {
  id: string;
  code: string;
  name: string;
  lecturer_name?: string;
  total_sessions: number;
  present_count: number;
  late_count: number;
  absent_count: number;
}
