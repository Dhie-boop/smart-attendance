import apiClient from './client';
import type { SessionResponse, SessionStartRequest, SessionEndResponse, SessionPublicResponse, SessionReportSummary, ScheduledSessionCreate, ScheduledSessionResponse } from '../types';

export const sessionsApi = {
  start: (data: SessionStartRequest) =>
    apiClient.post<SessionResponse>('/sessions/start', data).then((r) => r.data),

  end: (sessionId: string) =>
    apiClient.post<SessionEndResponse>(`/sessions/end/${sessionId}`).then((r) => r.data),

  get: (sessionId: string) =>
    apiClient.get<SessionResponse>(`/sessions/${sessionId}`).then((r) => r.data),

  listActive: () =>
    apiClient.get<SessionPublicResponse[]>('/sessions/active').then((r) => r.data),

  listReportSessions: (includeActive = true, includeEnded = true) =>
    apiClient
      .get<SessionReportSummary[]>('/attendance/sessions', {
        params: { include_active: includeActive, include_ended: includeEnded },
      })
      .then((r) => r.data),

  // Scheduled sessions
  schedule: (data: ScheduledSessionCreate) =>
    apiClient.post<ScheduledSessionResponse>('/sessions/schedule', data).then((r) => r.data),

  listScheduled: (skip = 0, limit = 50) =>
    apiClient.get<ScheduledSessionResponse[]>('/sessions/scheduled', { params: { skip, limit } }).then((r) => r.data),

  cancelScheduled: (id: string) =>
    apiClient.delete(`/sessions/scheduled/${id}`),

  activateScheduled: (id: string) =>
    apiClient.post<SessionResponse>(`/sessions/scheduled/${id}/activate`).then((r) => r.data),
};
