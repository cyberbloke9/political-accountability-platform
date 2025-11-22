'use client'

import { useState, useEffect } from 'react'
import { getAdminStatus, type AdminStatus } from '@/lib/adminAuth'
import { useAuth } from './useAuth'

/**
 * React hook to check admin status and permissions
 * Updates when auth state changes
 */
export function useAdmin() {
  const { user, loading: authLoading } = useAuth()
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    isAdmin: false,
    level: 0,
    roles: [],
    permissions: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      if (authLoading) return

      if (!user) {
        setAdminStatus({ isAdmin: false, level: 0, roles: [], permissions: [] })
        setLoading(false)
        return
      }

      const status = await getAdminStatus()
      setAdminStatus(status)
      setLoading(false)
    }

    checkAdmin()
  }, [user, authLoading])

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    return adminStatus.permissions.includes(permission)
  }

  /**
   * Check if user has any of the given permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => adminStatus.permissions.includes(p))
  }

  /**
   * Check if user has all of the given permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => adminStatus.permissions.includes(p))
  }

  /**
   * Check if user is at least a certain admin level
   */
  const hasMinimumLevel = (minLevel: number): boolean => {
    return adminStatus.level >= minLevel
  }

  /**
   * Check if user has a specific role
   */
  const hasRole = (roleName: string): boolean => {
    return adminStatus.roles.includes(roleName)
  }

  return {
    ...adminStatus,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMinimumLevel,
    hasRole,
    // Convenience flags
    isReviewer: adminStatus.level >= 1,
    isModerator: adminStatus.level >= 2,
    isSuperAdmin: adminStatus.level >= 3
  }
}
