'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'
import { Shield, Loader2 } from 'lucide-react'

interface AdminGuardProps {
  children: React.ReactNode
  requiredPermission?: string
  requiredPermissions?: string[]
  minLevel?: number
  requireAll?: boolean // For requiredPermissions: true = need all, false = need any
}

/**
 * Protects admin routes - redirects non-admins to home
 * Can require specific permissions or minimum admin level
 */
export function AdminGuard({
  children,
  requiredPermission,
  requiredPermissions,
  minLevel,
  requireAll = false
}: AdminGuardProps) {
  const router = useRouter()
  const admin = useAdmin()

  useEffect(() => {
    if (admin.loading) return

    // Not an admin at all
    if (!admin.isAdmin) {
      router.push('/')
      return
    }

    // Check minimum level requirement
    if (minLevel && !admin.hasMinimumLevel(minLevel)) {
      router.push('/admin')
      return
    }

    // Check single permission requirement
    if (requiredPermission && !admin.hasPermission(requiredPermission)) {
      router.push('/admin')
      return
    }

    // Check multiple permissions requirement
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAccess = requireAll
        ? admin.hasAllPermissions(requiredPermissions)
        : admin.hasAnyPermission(requiredPermissions)

      if (!hasAccess) {
        router.push('/admin')
        return
      }
    }
  }, [admin, router, requiredPermission, requiredPermissions, minLevel, requireAll])

  // Loading state
  if (admin.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Not authorized
  if (!admin.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Check permissions failed
  if (minLevel && !admin.hasMinimumLevel(minLevel)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Insufficient Permissions</h2>
          <p className="text-muted-foreground">
            Required Level: {minLevel}, Your Level: {admin.level}
          </p>
        </div>
      </div>
    )
  }

  // Authorized - render children
  return <>{children}</>
}
