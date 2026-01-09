import { getPartyColor, formatPosition } from '@/lib/politicians'

describe('Politicians Module', () => {
  describe('getPartyColor', () => {
    test('returns orange for BJP', () => {
      expect(getPartyColor('BJP')).toContain('orange')
      expect(getPartyColor('Bharatiya Janata Party')).toContain('orange')
    })

    test('returns blue for Congress', () => {
      expect(getPartyColor('Congress')).toContain('blue')
      expect(getPartyColor('INC')).toContain('blue')
    })

    test('returns cyan for AAP', () => {
      expect(getPartyColor('AAP')).toContain('cyan')
      expect(getPartyColor('Aam Aadmi Party')).toContain('cyan')
    })

    test('returns gray for null/undefined', () => {
      expect(getPartyColor(null)).toContain('gray')
    })

    test('returns purple for unknown parties', () => {
      expect(getPartyColor('Unknown Party')).toContain('purple')
    })
  })

  describe('formatPosition', () => {
    test('formats PM correctly', () => {
      expect(formatPosition('pm')).toBe('Prime Minister')
      expect(formatPosition('PM')).toBe('Prime Minister')
    })

    test('formats CM correctly', () => {
      expect(formatPosition('cm')).toBe('Chief Minister')
    })

    test('formats MP correctly', () => {
      expect(formatPosition('mp')).toBe('Member of Parliament')
    })

    test('formats MLA correctly', () => {
      expect(formatPosition('mla')).toBe('Member of Legislative Assembly')
    })

    test('returns original value for unknown positions', () => {
      expect(formatPosition('Governor')).toBe('Governor')
    })

    test('returns "Politician" for null', () => {
      expect(formatPosition(null)).toBe('Politician')
    })
  })
})
