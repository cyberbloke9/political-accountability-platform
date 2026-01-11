/**
 * Application Version Configuration
 *
 * Versioning follows Semantic Versioning (SemVer):
 * MAJOR.MINOR.PATCH
 *
 * Version History:
 * v1.0.0 - Initial platform release (Promises, Politicians, Verifications)
 * v1.1.0 - Admin moderation system
 * v1.2.0 - Anti-gaming & fraud detection
 * v1.3.0 - User feedback system
 * v1.4.0 - Verification detail pages with cryptographic hashing
 * v2.0.0 - Follow System, Timeline Visualization, Report Cards (Sprint 2 & 3)
 * v2.0.1 - Bug fixes, regression testing framework (67 tests)
 * v2.1.0 - Discussion Threads: Comments, replies, voting, flagging (Sprint 6)
 * v2.2.0 - Election Integration: Elections, constituencies, candidates, manifestos (Sprint 8)
 * v2.3.0 - Evidence Quality System: Grokipedia-style scoring, community notes (Sprint 4)
 */

export const APP_VERSION = '2.3.0'
export const APP_BUILD_DATE = '2026-01-11'
export const APP_CODENAME = 'Accountability'

export interface VersionInfo {
  version: string
  buildDate: string
  codename: string
  features: string[]
}

export const VERSION_INFO: VersionInfo = {
  version: APP_VERSION,
  buildDate: APP_BUILD_DATE,
  codename: APP_CODENAME,
  features: [
    'Follow politicians and promises',
    'Personalized dashboard feed',
    'Promise timeline visualization',
    'Politician report cards with grades',
    'PDF export for report cards',
    'Status history tracking',
    'Discussion threads on promises',
    'Comment voting and moderation',
    'Election tracking and results',
    'Constituency mapping',
    'Party manifestos and promises',
    'Evidence quality scoring (0-100)',
    'Source credibility tiers',
    'Community notes (X-style)',
    'Unique view tracking with deduplication'
  ]
}

export function getVersionString(): string {
  return `v${APP_VERSION}`
}

export function getFullVersionString(): string {
  return `v${APP_VERSION} "${APP_CODENAME}" (${APP_BUILD_DATE})`
}
