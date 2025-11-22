import { supabase } from './supabase'

export interface AdminStatus {
  isAdmin: boolean
  level: number // 0=none, 1=Reviewer, 2=Moderator, 3=SuperAdmin
  roles: string[]
  permissions: string[]
}

/**
 * Get current user's admin status and permissions
 */
export async function getAdminStatus(): Promise<AdminStatus> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { isAdmin: false, level: 0, roles: [], permissions: [] }
    }

    // Get user's roles and permissions
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        role:admin_roles(
          name,
          level,
          admin_permissions(permission)
        )
      `)
      .eq('user_id', (await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()
      ).data?.id)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

    if (rolesError || !userRoles || userRoles.length === 0) {
      return { isAdmin: false, level: 0, roles: [], permissions: [] }
    }

    // Extract roles and permissions
    const roles = userRoles.map((ur: any) => ur.role.name)
    const allPermissions = userRoles.flatMap((ur: any) =>
      ur.role.admin_permissions.map((p: any) => p.permission)
    )
    const uniquePermissions = [...new Set(allPermissions)]
    const maxLevel = Math.max(...userRoles.map((ur: any) => ur.role.level))

    return {
      isAdmin: true,
      level: maxLevel,
      roles,
      permissions: uniquePermissions
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
    return { isAdmin: false, level: 0, roles: [], permissions: [] }
  }
}

/**
 * Check if current user has a specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const status = await getAdminStatus()
  return status.permissions.includes(permission)
}

/**
 * Check if current user is at least a certain admin level
 */
export async function hasMinimumLevel(minLevel: number): Promise<boolean> {
  const status = await getAdminStatus()
  return status.level >= minLevel
}

/**
 * Server-side function to verify admin access
 * Use this in API routes or server actions
 */
export async function verifyAdminAccess(
  requiredPermission?: string,
  minLevel?: number
): Promise<{ authorized: boolean; status: AdminStatus; error?: string }> {
  const status = await getAdminStatus()

  if (!status.isAdmin) {
    return {
      authorized: false,
      status,
      error: 'User is not an admin'
    }
  }

  if (minLevel && status.level < minLevel) {
    return {
      authorized: false,
      status,
      error: `Insufficient admin level. Required: ${minLevel}, Current: ${status.level}`
    }
  }

  if (requiredPermission && !status.permissions.includes(requiredPermission)) {
    return {
      authorized: false,
      status,
      error: `Missing required permission: ${requiredPermission}`
    }
  }

  return { authorized: true, status }
}

/**
 * Get user's admin level using database function
 */
export async function getUserAdminLevel(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data, error } = await supabase.rpc('user_admin_level', {
      user_auth_id: user.id
    })

    if (error) {
      console.error('Error getting admin level:', error)
      return 0
    }

    return data || 0
  } catch (error) {
    console.error('Error getting admin level:', error)
    return 0
  }
}

/**
 * Check if user has permission using database function
 */
export async function checkUserPermission(permission: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase.rpc('user_has_permission', {
      user_auth_id: user.id,
      required_permission: permission
    })

    if (error) {
      console.error('Error checking permission:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}
