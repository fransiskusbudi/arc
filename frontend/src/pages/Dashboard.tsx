import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { StatCard } from '../components/StatCard'
import { FunnelChart } from '../components/FunnelChart'
import { WeeklyVolumeChart } from '../components/WeeklyVolumeChart'
import { SourceTable } from '../components/SourceTable'
import { FollowUpPanel } from '../components/FollowUpPanel'
import { api } from '../api/client'
import type { FunnelStage, SourceStat, Summary, TimelinePoint } from '../api/types'

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [funnel, setFunnel] = useState<FunnelStage[]>([])
  const [timeline, setTimeline] = useState<TimelinePoint[]>([])
  const [sources, setSources] = useState<SourceStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getSummary(), api.getFunnel(), api.getTimeline(), api.getSources()])
      .then(([summaryData, funnelData, timelineData, sourcesData]) => {
        setSummary(summaryData)
        setFunnel(funnelData)
        setTimeline(timelineData)
        setSources(sourcesData)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Layout>
        <p className="text-sm text-ink-2">Loading…</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <h1 className="mb-6 font-display text-display font-medium tracking-[-0.01em] text-ink">
        Dashboard
      </h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard label="Total applications" value={summary?.total ?? 0} />
        <StatCard label="Active" value={summary?.active ?? 0} />
        <StatCard label="Interviewing" value={summary?.by_status?.interviewing ?? 0} />
        <StatCard label="Offers" value={summary?.by_status?.offer ?? 0} />
      </div>

      <FollowUpPanel />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelChart data={funnel} />
        <WeeklyVolumeChart data={timeline} />
      </div>

      <SourceTable data={sources} />
    </Layout>
  )
}
