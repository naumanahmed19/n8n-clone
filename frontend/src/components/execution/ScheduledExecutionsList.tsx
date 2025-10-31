import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebarContext } from '@/contexts'
import { useAuthStore } from '@/stores'
import { Calendar, Clock, MoreVertical, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface ScheduleJob {
  id: string
  workflowId: string
  workflowName: string
  triggerId: string
  cronExpression: string
  timezone: string
  description: string
  nextRun: string | null
  lastRun: string | null
  status: 'active'
  failCount: number
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const absDiff = Math.abs(diff)
  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (diff < 0) {
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return `${seconds}s ago`
  } else {
    if (hours > 0) return `in ${hours}h`
    if (minutes > 0) return `in ${minutes}m`
    return `in ${seconds}s`
  }
}

export function ScheduledExecutionsList() {
  const [jobs, setJobs] = useState<ScheduleJob[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { token } = useAuthStore()
  const navigate = useNavigate()
  const { setHeaderSlot } = useSidebarContext()

  const fetchJobs = async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const response = await fetch('http://localhost:4000/api/schedule-jobs', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const result = await response.json()
        setJobs(result.data.jobs || [])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to load schedule jobs')
    } finally {
      setLoading(false)
    }
  }

  const deleteJob = async (workflowId: string, triggerId: string) => {
    if (!confirm('Delete this schedule? This will stop all future executions. You can recreate it by editing and saving the workflow.')) return
    try {
      const jobId = `${workflowId}-${triggerId}`
      const response = await fetch(`http://localhost:4000/api/schedule-jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to delete job')
      toast.success('Schedule deleted')
      fetchJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
      toast.error('Failed to delete schedule')
    }
  }

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 60000)
    return () => clearInterval(interval)
  }, [token])

  const filteredJobs = jobs.filter(job =>
    job.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.cronExpression.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    setHeaderSlot(
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {jobs.length} active schedule{jobs.length !== 1 ? 's' : ''}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={fetchJobs}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>
    )
    return () => setHeaderSlot(null)
  }, [jobs.length, loading, searchTerm, setHeaderSlot])

  const renderJobCard = (job: ScheduleJob) => (
    <div
      key={job.id}
      className="bg-card hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col gap-2 p-3 text-sm leading-tight border border-border rounded-md mb-2 transition-colors cursor-pointer"
      onClick={() => navigate(`/workflows/${job.workflowId}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium flex-1 min-w-0">
          <span className="truncate block">{job.workflowName}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                deleteJob(job.workflowId, job.triggerId)
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete Schedule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {job.description && job.description !== 'Scheduled execution' && (
        <div className="text-xs text-muted-foreground truncate">
          {job.description}
        </div>
      )}
      <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
        <Clock className="h-3 w-3 shrink-0" />
        <span className="truncate">{job.cronExpression}</span>
        <span className="text-[10px] shrink-0">({job.timezone})</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {job.nextRun && (
          <div>
            <div className="text-muted-foreground/70 text-[10px] uppercase tracking-wide mb-0.5">Next Run</div>
            <div className="font-medium">{new Date(job.nextRun).toLocaleString()}</div>
            <div className="text-muted-foreground">{getRelativeTime(new Date(job.nextRun))}</div>
          </div>
        )}
        <div>
          <div className="text-muted-foreground/70 text-[10px] uppercase tracking-wide mb-0.5">Last Run</div>
          <div className="font-medium">
            {job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}
          </div>
          {job.lastRun && (
            <div className="text-muted-foreground">{getRelativeTime(new Date(job.lastRun))}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs pt-1 border-t border-border/50">
        <div className="text-muted-foreground/70 text-[10px] uppercase tracking-wide">Status</div>
        <div className="flex items-center gap-1 text-green-600">
          <span className="text-lg leading-none">●</span>
          <span className="font-medium">Active</span>
        </div>
      </div>
    </div>
  )

  if (loading && jobs.length === 0) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="animate-pulse flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground py-8">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">No scheduled jobs</p>
          <p className="text-xs mt-1">Create a workflow with a Schedule Trigger</p>
        </div>
      </div>
    )
  }

  if (filteredJobs.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground py-8">
          <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">No schedules match your search</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="space-y-0">
        {filteredJobs.map((job) => renderJobCard(job))}
      </div>
    </div>
  )
}
