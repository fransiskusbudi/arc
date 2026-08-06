export type Status =
  | 'lead'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'declined'

export const STATUSES: Status[] = [
  'lead',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
  'declined',
]

export interface Application {
  id: number
  user_id: number
  company: string
  role: string
  source: string | null
  location: string | null
  salary: string | null
  cv_variant: string | null
  url: string | null
  status: Status
  date_applied: string | null
  next_action: string | null
  next_followup: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ApplicationInput = Omit<
  Application,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

export interface StatusHistoryEntry {
  id: number
  application_id: number
  status: Status
  changed_at: string
}

export interface Summary {
  total: number
  active: number
  by_status: Record<string, number>
}

export interface FunnelStage {
  stage: string
  count: number
}

export interface SourceStat {
  source: string
  total: number
  interviews_or_better: number
  conversion_rate: number
}

export interface TimelinePoint {
  week_start: string
  count: number
}

export interface ResponseTimeStat {
  transition: string
  avg_days: number
}

export interface CvVariantStat {
  cv_variant: string
  total: number
  interviews_or_better: number
  conversion_rate: number
}

export interface User {
  id: number
  email: string
  created_at: string
}
