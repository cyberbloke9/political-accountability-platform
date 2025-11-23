import { supabase } from './supabase'

export interface AdminAction {
  id: string
  action_type: string
  target_type: string
  target_id: string
  admin_id: string
  reason: string | null
  metadata: Record<string, any> | null
  created_at: string
  admin?: {
    username: string
    id: string
  }
}

export interface AdminActionFilters {
  action_type?: string
  admin_id?: string
  target_type?: string
  search?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

export interface AdminActionStats {
  totalActions: number
  todayActions: number
  approvedToday: number
  rejectedToday: number
  fraudFlagsToday: number
  topAdmins: Array<{
    admin_id: string
    username: string
    action_count: number
  }>
  actionsByType: Record<string, number>
}

/**
 * Get admin actions with optional filtering
 */
export async function getAdminActions(
  filters?: AdminActionFilters
): Promise<{
  data: AdminAction[] | null
  error: any
  count: number
}> {
  try {
    let query = supabase
      .from('admin_actions')
      .select(
        `
        *,
        admin:users!admin_id(username, id)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.action_type) {
      query = query.eq('action_type', filters.action_type)
    }

    if (filters?.admin_id) {
      query = query.eq('admin_id', filters.admin_id)
    }

    if (filters?.target_type) {
      query = query.eq('target_type', filters.target_type)
    }

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date)
    }

    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date)
    }

    if (filters?.search) {
      query = query.or(
        `reason.ilike.%${filters.search}%,action_type.ilike.%${filters.search}%`
      )
    }

    // Pagination
    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 50) - 1
      )
    } else if (filters?.limit) {
      query = query.limit(filters.limit)
    } else {
      query = query.limit(50)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching admin actions:', error)
      return { data: null, error, count: 0 }
    }

    return { data: data as AdminAction[], error: null, count: count || 0 }
  } catch (error) {
    console.error('Error fetching admin actions:', error)
    return { data: null, error, count: 0 }
  }
}

/**
 * Get admin action statistics
 */
export async function getAdminActionStats(): Promise<AdminActionStats> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [allActions, todayActions] = await Promise.all([
      supabase.from('admin_actions').select('action_type'),
      supabase
        .from('admin_actions')
        .select('action_type')
        .gte('created_at', today.toISOString())
    ])

    const totalActions = allActions.data?.length || 0
    const todayActionsCount = todayActions.data?.length || 0

    // Count actions by type today
    const todayData = todayActions.data || []
    const approvedToday = todayData.filter(
      a => a.action_type === 'approve_verification'
    ).length
    const rejectedToday = todayData.filter(
      a => a.action_type === 'reject_verification'
    ).length
    const fraudFlagsToday = todayData.filter(
      a => a.action_type === 'flag_fraud'
    ).length

    // Get actions by type
    const actionsByType: Record<string, number> = {}
    allActions.data?.forEach(action => {
      actionsByType[action.action_type] =
        (actionsByType[action.action_type] || 0) + 1
    })

    // Get top admins (all time)
    const { data: topAdminsData } = await supabase
      .from('admin_actions')
      .select(
        `
        admin_id,
        admin:users!admin_id(username)
      `
      )

    // Group by admin
    const adminCounts: Record<string, { username: string; count: number }> = {}
    topAdminsData?.forEach(action => {
      const adminId = action.admin_id
      const username = (action.admin as any)?.username || 'Unknown'

      if (!adminCounts[adminId]) {
        adminCounts[adminId] = { username, count: 0 }
      }
      adminCounts[adminId].count++
    })

    const topAdmins = Object.entries(adminCounts)
      .map(([admin_id, data]) => ({
        admin_id,
        username: data.username,
        action_count: data.count
      }))
      .sort((a, b) => b.action_count - a.action_count)
      .slice(0, 5)

    return {
      totalActions,
      todayActions: todayActionsCount,
      approvedToday,
      rejectedToday,
      fraudFlagsToday,
      topAdmins,
      actionsByType
    }
  } catch (error) {
    console.error('Error fetching admin action stats:', error)
    return {
      totalActions: 0,
      todayActions: 0,
      approvedToday: 0,
      rejectedToday: 0,
      fraudFlagsToday: 0,
      topAdmins: [],
      actionsByType: {}
    }
  }
}

/**
 * Get action type display name
 */
export function getActionTypeDisplay(actionType: string): string {
  const displayNames: Record<string, string> = {
    approve_verification: 'Approved Verification',
    reject_verification: 'Rejected Verification',
    flag_fraud: 'Flagged Fraud',
    update_reputation: 'Updated Reputation',
    ban_user: 'Banned User',
    unban_user: 'Unbanned User',
    assign_admin_role: 'Assigned Admin Role',
    remove_admin_role: 'Removed Admin Role',
    auto_approve: 'Auto-Approved Verification'
  }

  return displayNames[actionType] || actionType
}

/**
 * Get target type display name
 */
export function getTargetTypeDisplay(targetType: string): string {
  const displayNames: Record<string, string> = {
    verification: 'Verification',
    user: 'User',
    politician: 'Politician',
    admin: 'Admin'
  }

  return displayNames[targetType] || targetType
}

/**
 * Get action type color
 */
export function getActionTypeColor(actionType: string): string {
  const colors: Record<string, string> = {
    approve_verification: 'text-green-600 bg-green-100',
    reject_verification: 'text-red-600 bg-red-100',
    flag_fraud: 'text-orange-600 bg-orange-100',
    update_reputation: 'text-blue-600 bg-blue-100',
    ban_user: 'text-red-700 bg-red-200',
    unban_user: 'text-green-700 bg-green-200',
    assign_admin_role: 'text-purple-600 bg-purple-100',
    remove_admin_role: 'text-purple-700 bg-purple-200',
    auto_approve: 'text-emerald-600 bg-emerald-100'
  }

  return colors[actionType] || 'text-gray-600 bg-gray-100'
}
