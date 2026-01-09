import {
  formatTimelineEvent,
  getTimelineIcon,
  calculateEventGaps,
  getStatusLabel,
  getVerdictLabel,
  type TimelineEvent
} from '@/lib/timeline'

describe('Timeline Module', () => {
  describe('formatTimelineEvent', () => {
    test('formats verification events correctly', () => {
      const event: TimelineEvent = {
        event_type: 'verification',
        event_id: '123',
        old_status: null,
        new_status: 'pending',
        change_source: 'verification',
        reason: null,
        created_at: '2024-01-01T00:00:00Z',
        actor_name: 'TestUser',
        verdict: 'fulfilled',
        evidence_preview: 'Test evidence'
      }

      const result = formatTimelineEvent(event)
      expect(result.title).toBe('Verification Submitted')
      expect(result.description).toContain('TestUser')
      expect(result.description).toContain('fulfilled')
    })

    test('formats creation events correctly', () => {
      const event: TimelineEvent = {
        event_type: 'status_change',
        event_id: '123',
        old_status: null,
        new_status: 'pending',
        change_source: 'creation',
        reason: null,
        created_at: '2024-01-01T00:00:00Z',
        actor_name: null,
        verdict: null,
        evidence_preview: null
      }

      const result = formatTimelineEvent(event)
      expect(result.title).toBe('Promise Created')
      expect(result.description).toContain('pending')
    })

    test('formats status change events with old status', () => {
      const event: TimelineEvent = {
        event_type: 'status_change',
        event_id: '123',
        old_status: 'pending',
        new_status: 'in_progress',
        change_source: 'manual',
        reason: 'Work has begun',
        created_at: '2024-01-01T00:00:00Z',
        actor_name: 'Admin',
        verdict: null,
        evidence_preview: null
      }

      const result = formatTimelineEvent(event)
      expect(result.title).toContain('pending')
      expect(result.title).toContain('in_progress')
      expect(result.description).toBe('Work has begun')
    })
  })

  describe('getTimelineIcon', () => {
    test('returns correct icon for verification events', () => {
      const event: TimelineEvent = {
        event_type: 'verification',
        event_id: '123',
        old_status: null,
        new_status: 'pending',
        change_source: 'verification',
        reason: null,
        created_at: '2024-01-01T00:00:00Z',
        actor_name: null,
        verdict: 'fulfilled',
        evidence_preview: null
      }

      const result = getTimelineIcon(event)
      expect(result.icon).toBe('CheckCircle')
      expect(result.color).toContain('green')
    })

    test('returns correct icon for broken verdict', () => {
      const event: TimelineEvent = {
        event_type: 'verification',
        event_id: '123',
        old_status: null,
        new_status: 'pending',
        change_source: 'verification',
        reason: null,
        created_at: '2024-01-01T00:00:00Z',
        actor_name: null,
        verdict: 'broken',
        evidence_preview: null
      }

      const result = getTimelineIcon(event)
      expect(result.icon).toBe('XCircle')
      expect(result.color).toContain('red')
    })

    test('returns correct icon for creation events', () => {
      const event: TimelineEvent = {
        event_type: 'status_change',
        event_id: '123',
        old_status: null,
        new_status: 'pending',
        change_source: 'creation',
        reason: null,
        created_at: '2024-01-01T00:00:00Z',
        actor_name: null,
        verdict: null,
        evidence_preview: null
      }

      const result = getTimelineIcon(event)
      expect(result.icon).toBe('Plus')
      expect(result.color).toContain('purple')
    })
  })

  describe('calculateEventGaps', () => {
    test('calculates correct gaps between events', () => {
      const events: TimelineEvent[] = [
        {
          event_type: 'status_change',
          event_id: '1',
          old_status: null,
          new_status: 'pending',
          change_source: 'creation',
          reason: null,
          created_at: '2024-01-01T00:00:00Z',
          actor_name: null,
          verdict: null,
          evidence_preview: null
        },
        {
          event_type: 'status_change',
          event_id: '2',
          old_status: 'pending',
          new_status: 'in_progress',
          change_source: 'manual',
          reason: null,
          created_at: '2024-02-15T00:00:00Z', // 45 days later
          actor_name: null,
          verdict: null,
          evidence_preview: null
        }
      ]

      const result = calculateEventGaps(events)
      expect(result[0].daysSincePrevious).toBe(0)
      expect(result[1].daysSincePrevious).toBe(45)
      expect(result[1].isSignificantGap).toBe(true)
    })

    test('returns empty array for empty input', () => {
      expect(calculateEventGaps([])).toEqual([])
    })
  })

  describe('getStatusLabel', () => {
    test('returns correct labels for known statuses', () => {
      expect(getStatusLabel('pending')).toBe('Pending')
      expect(getStatusLabel('fulfilled')).toBe('Fulfilled')
      expect(getStatusLabel('broken')).toBe('Broken')
      expect(getStatusLabel('in_progress')).toBe('In Progress')
      expect(getStatusLabel('stalled')).toBe('Stalled')
    })

    test('returns original value for unknown status', () => {
      expect(getStatusLabel('unknown')).toBe('unknown')
    })
  })

  describe('getVerdictLabel', () => {
    test('returns correct labels for known verdicts', () => {
      expect(getVerdictLabel('fulfilled')).toBe('Fulfilled')
      expect(getVerdictLabel('broken')).toBe('Broken')
      expect(getVerdictLabel('in_progress')).toBe('In Progress')
      expect(getVerdictLabel('stalled')).toBe('Stalled')
    })
  })
})
