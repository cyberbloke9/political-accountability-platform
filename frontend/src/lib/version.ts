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
 */

export const APP_VERSION = '2.0.1'
export const APP_BUILD_DATE = '2026-01-09'
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
    'Status history tracking'
  ]
}

export function getVersionString(): string {
  return `v${APP_VERSION}`
}

export function getFullVersionString(): string {
  return `v${APP_VERSION} "${APP_CODENAME}" (${APP_BUILD_DATE})`
}
