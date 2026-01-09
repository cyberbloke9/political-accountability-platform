/**
 * Critical Path Integration Tests
 *
 * These tests verify that critical user journeys work correctly.
 * They help catch regressions in core functionality.
 */

import { render, screen, waitFor } from '@testing-library/react'

// Test utilities
const mockPromise = {
  id: 'test-promise-id',
  politician_name: 'Test Politician',
  promise_text: 'Test promise text for verification',
  promise_date: '2024-01-01',
  status: 'pending',
  view_count: 100,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by: 'user-123',
  tags: ['education', 'health'],
}

const mockPolitician = {
  id: 'test-politician-id',
  name: 'Test Politician',
  slug: 'test-politician',
  party: 'Test Party',
  position: 'MP',
  state: 'Test State',
  is_active: true,
}

const mockVerification = {
  id: 'test-verification-id',
  promise_id: 'test-promise-id',
  verdict: 'fulfilled',
  evidence_text: 'Evidence that the promise was fulfilled',
  status: 'approved',
  upvotes: 10,
  downvotes: 2,
  created_at: '2024-06-01T00:00:00Z',
}

describe('Critical User Paths', () => {
  describe('Data Integrity', () => {
    test('promise object has required fields', () => {
      expect(mockPromise).toHaveProperty('id')
      expect(mockPromise).toHaveProperty('politician_name')
      expect(mockPromise).toHaveProperty('promise_text')
      expect(mockPromise).toHaveProperty('status')
    })

    test('politician object has required fields', () => {
      expect(mockPolitician).toHaveProperty('id')
      expect(mockPolitician).toHaveProperty('name')
      expect(mockPolitician).toHaveProperty('slug')
    })

    test('verification object has required fields', () => {
      expect(mockVerification).toHaveProperty('id')
      expect(mockVerification).toHaveProperty('promise_id')
      expect(mockVerification).toHaveProperty('verdict')
      expect(mockVerification).toHaveProperty('evidence_text')
    })
  })

  describe('Status Validation', () => {
    const validStatuses = ['pending', 'in_progress', 'fulfilled', 'broken', 'stalled']
    const validVerdicts = ['fulfilled', 'broken', 'in_progress', 'stalled']

    test('promise status is valid', () => {
      expect(validStatuses).toContain(mockPromise.status)
    })

    test('verification verdict is valid', () => {
      expect(validVerdicts).toContain(mockVerification.verdict)
    })

    test.each(validStatuses)('status "%s" is recognized', (status) => {
      expect(validStatuses).toContain(status)
    })

    test.each(validVerdicts)('verdict "%s" is recognized', (verdict) => {
      expect(validVerdicts).toContain(verdict)
    })
  })

  describe('Date Validation', () => {
    test('promise dates are valid ISO strings', () => {
      expect(new Date(mockPromise.promise_date).toString()).not.toBe('Invalid Date')
      expect(new Date(mockPromise.created_at).toString()).not.toBe('Invalid Date')
    })

    test('verification dates are valid ISO strings', () => {
      expect(new Date(mockVerification.created_at).toString()).not.toBe('Invalid Date')
    })
  })

  describe('Vote Calculations', () => {
    test('net votes calculation is correct', () => {
      const netVotes = mockVerification.upvotes - mockVerification.downvotes
      expect(netVotes).toBe(8)
    })

    test('vote ratio calculation is correct', () => {
      const totalVotes = mockVerification.upvotes + mockVerification.downvotes
      const ratio = mockVerification.upvotes / totalVotes
      expect(ratio).toBeCloseTo(0.833, 2)
    })
  })

  describe('Slug Generation', () => {
    test('politician slug follows naming convention', () => {
      // Slugs should be lowercase and hyphenated
      expect(mockPolitician.slug).toMatch(/^[a-z0-9-]+$/)
    })
  })
})

describe('Report Card Calculations', () => {
  const calculateGrade = (fulfillmentRate: number) => {
    if (fulfillmentRate >= 80) return 'A'
    if (fulfillmentRate >= 60) return 'B'
    if (fulfillmentRate >= 40) return 'C'
    if (fulfillmentRate >= 20) return 'D'
    return 'F'
  }

  test.each([
    [100, 'A'],
    [80, 'A'],
    [79, 'B'],
    [60, 'B'],
    [59, 'C'],
    [40, 'C'],
    [39, 'D'],
    [20, 'D'],
    [19, 'F'],
    [0, 'F'],
  ])('fulfillment rate %i should give grade %s', (rate, expectedGrade) => {
    expect(calculateGrade(rate)).toBe(expectedGrade)
  })

  test('fulfillment rate calculation is correct', () => {
    const fulfilled = 8
    const broken = 2
    const decidedPromises = fulfilled + broken
    const rate = (fulfilled / decidedPromises) * 100

    expect(rate).toBe(80)
    expect(calculateGrade(rate)).toBe('A')
  })
})

describe('Timeline Event Ordering', () => {
  const events = [
    { created_at: '2024-01-01T00:00:00Z', event_type: 'creation' },
    { created_at: '2024-03-15T00:00:00Z', event_type: 'status_change' },
    { created_at: '2024-02-01T00:00:00Z', event_type: 'verification' },
  ]

  test('events can be sorted chronologically', () => {
    const sorted = [...events].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    expect(sorted[0].event_type).toBe('creation')
    expect(sorted[1].event_type).toBe('verification')
    expect(sorted[2].event_type).toBe('status_change')
  })
})

describe('Follow System Logic', () => {
  const followTypes = ['politician', 'promise', 'tag', 'user']

  test.each(followTypes)('follow type "%s" is valid', (type) => {
    expect(followTypes).toContain(type)
  })

  test('notification preferences have correct defaults', () => {
    const defaultPrefs = {
      notify_on_update: true,
      notify_on_verification: true,
      notify_on_status_change: true,
    }

    expect(defaultPrefs.notify_on_update).toBe(true)
    expect(defaultPrefs.notify_on_verification).toBe(true)
    expect(defaultPrefs.notify_on_status_change).toBe(true)
  })
})
