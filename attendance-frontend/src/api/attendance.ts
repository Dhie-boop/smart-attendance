import apiClient from './client';
import type { AttendanceRecord, AttendanceScanRequest, AttendanceScanResponse } from '../types';

export const attendanceApi = {
  scan: (data: AttendanceScanRequest) =>
    apiClient.post<AttendanceScanResponse>('/attendance/scan', data).then((r) => r.data),

  report: (sessionId: string, skip = 0, limit = 50) =>
    apiClient
      .get<AttendanceRecord[]>('/attendance/report', { params: { session_id: sessionId, skip, limit } })
      .then((r) => r.data),

  studentHistory: (studentId: string, skip = 0, limit = 50) =>
    apiClient
      .get<AttendanceRecord[]>(`/attendance/student/${studentId}`, { params: { skip, limit } })
      .then((r) => r.data),
};
