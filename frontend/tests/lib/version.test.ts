import { APP_VERSION, APP_BUILD_DATE, getVersionString, getFullVersionString, VERSION_INFO } from '@/lib/version'

describe('Version Module', () => {
  test('APP_VERSION should be a valid semver string', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  test('APP_BUILD_DATE should be a valid date string', () => {
    expect(APP_BUILD_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(new Date(APP_BUILD_DATE).toString()).not.toBe('Invalid Date')
  })

  test('getVersionString should return version with v prefix', () => {
    expect(getVersionString()).toBe(`v${APP_VERSION}`)
  })

  test('getFullVersionString should include version, codename, and date', () => {
    const fullVersion = getFullVersionString()
    expect(fullVersion).toContain(APP_VERSION)
    expect(fullVersion).toContain(APP_BUILD_DATE)
    expect(fullVersion).toContain(VERSION_INFO.codename)
  })

  test('VERSION_INFO should have required fields', () => {
    expect(VERSION_INFO).toHaveProperty('version')
    expect(VERSION_INFO).toHaveProperty('buildDate')
    expect(VERSION_INFO).toHaveProperty('codename')
    expect(VERSION_INFO).toHaveProperty('features')
    expect(Array.isArray(VERSION_INFO.features)).toBe(true)
  })
})
