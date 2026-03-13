import apiClient from './client';
import type { Course, CourseCreate, EnrollmentResponse, RegisterRequest, User, StudentCourse } from '../types';

export interface DashboardStats {
  total_students: number;
  total_lecturers: number;
  total_courses: number;
  active_sessions: number;
  total_sessions: number;
  attendance_rate: number;
  recent_students: { id: string; full_name: string; email: string; created_at: string }[];
}

export interface CourseAnalytics {
  course_id: string;
  course_code: string;
  course_name: string;
  total_sessions: number;
  total_attendance_records: number;
}

export interface AnalyticsResponse {
  courses: CourseAnalytics[];
}

export const adminApi = {
  listUsers: (skip = 0, limit = 100) =>
    apiClient.get<User[]>('/admin/users', { params: { skip, limit } }).then((r) => r.data),

  createStudent: (data: RegisterRequest) =>
    apiClient.post<User>('/admin/students', data).then((r) => r.data),

  dashboardStats: () =>
    apiClient.get<DashboardStats>('/admin/dashboard').then((r) => r.data),

  analytics: () =>
    apiClient.get<AnalyticsResponse>('/admin/analytics').then((r) => r.data),
};

export const coursesApi = {
  list: (skip = 0, limit = 50) =>
    apiClient.get<Course[]>('/courses', { params: { skip, limit } }).then((r) => r.data),

  create: (data: CourseCreate) =>
    apiClient.post<Course>('/courses', data).then((r) => r.data),

  enroll: (courseId: string, studentId: string) =>
    apiClient
      .post<EnrollmentResponse>(`/courses/${courseId}/enroll`, { student_id: studentId })
      .then((r) => r.data),

  assignLecturer: (courseId: string, lecturerId: string) =>
    apiClient
      .patch<Course>(`/courses/${courseId}/lecturer`, { lecturer_id: lecturerId })
      .then((r) => r.data),

  unassignLecturer: (courseId: string) =>
    apiClient.patch<Course>(`/courses/${courseId}/unassign-lecturer`).then((r) => r.data),

  listStudents: (courseId: string) =>
    apiClient.get<User[]>(`/courses/${courseId}/students`).then((r) => r.data),
};

export const studentApi = {
  myCourses: () =>
    apiClient.get<StudentCourse[]>('/students/my-courses').then((r) => r.data),
};
