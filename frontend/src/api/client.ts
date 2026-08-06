import type {
  Application,
  ApplicationInput,
  CvVariantStat,
  FunnelStage,
  ResponseTimeStat,
  SourceStat,
  StatusHistoryEntry,
  Summary,
  TimelinePoint,
  User,
} from './types'

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
  }

  const response = await fetch(`/api${path}`, { ...options, headers, credentials: 'same-origin' })

  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = await response.json()
      detail = body.detail ?? detail
    } catch {
      // no JSON body
    }
    throw new ApiError(response.status, detail)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  me: () => request<User>('/auth/me'),

  listApplications: (params: { status?: string; q?: string; due?: boolean } = {}) => {
    const search = new URLSearchParams()
    if (params.status) search.set('status', params.status)
    if (params.q) search.set('q', params.q)
    if (params.due) search.set('due', 'true')
    const qs = search.toString()
    return request<Application[]>(`/applications${qs ? `?${qs}` : ''}`)
  },

  getApplication: (id: number) => request<Application>(`/applications/${id}`),

  createApplication: (payload: ApplicationInput) =>
    request<Application>('/applications', { method: 'POST', body: JSON.stringify(payload) }),

  updateApplication: (id: number, payload: Partial<ApplicationInput>) =>
    request<Application>(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteApplication: (id: number) => request<void>(`/applications/${id}`, { method: 'DELETE' }),

  getHistory: (id: number) => request<StatusHistoryEntry[]>(`/applications/${id}/history`),

  getSummary: () => request<Summary>('/analytics/summary'),
  getFunnel: () => request<FunnelStage[]>('/analytics/funnel'),
  getSources: () => request<SourceStat[]>('/analytics/sources'),
  getTimeline: () => request<TimelinePoint[]>('/analytics/timeline'),
  getResponseTimes: () => request<ResponseTimeStat[]>('/analytics/response-times'),
  getCvVariants: () => request<CvVariantStat[]>('/analytics/cv-variants'),
}

export { ApiError }
