import { supabase } from './supabase'

export interface Ban {
  id: string
  user_id: string
  banned_by: string
  reason: string
  ban_type: 'temporary' | 'permanent'
  banned_at: string
  expires_at: string | null
  is_active: boolean
  unbanned_at: string | null
  unbanned_by: string | null
  unban_reason: string | null
  metadata: Record<string, any>
  user?: {
    id: string
    username: string
    email: string
  }
  banner?: {
    id: string
    username: string
  }
  unbanner?: {
    id: string
    username: string
  }
}

export interface BanAppeal {
  id: string
  ban_id: string
  user_id: string
  appeal_reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  review_reason: string | null
  created_at: string
  reviewed_at: string | null
  user?: {
    id: string
    username: string
  }
  reviewer?: {
    id: string
    username: string
  }
  ban?: Ban
}

export interface BanStats {
  totalBans: number
  activeBans: number
  temporaryBans: number
  permanentBans: number
  expiredBans: number
  pendingAppeals: number
  approvedAppeals: number
  rejectedAppeals: number
}

/**
 * Check if a user is currently banned
 */
export async function isUserBanned(
  userId: string
): Promise<{ banned: boolean; ban?: Ban; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('is_user_banned', {
      check_user_id: userId
    })

    if (error) {
      console.error('Error checking ban status:', error)
      return { banned: false, error: error.message }
    }

    if (data) {
      // Fetch ban details
      const { data: banData } = await supabase
        .from('bans')
        .select(
          `
          *,
          user:users!user_id(id, username, email),
          banner:users!banned_by(id, username)
        `
        )
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      return { banned: true, ban: banData as Ban }
    }

    return { banned: false }
  } catch (error) {
    console.error('Error checking ban status:', error)
    return { banned: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all bans with optional filtering
 */
export async function getBans(filters?: {
  is_active?: boolean
  ban_type?: string
  user_id?: string
  limit?: number
}): Promise<{ data: Ban[] | null; error?: string; count: number }> {
  try {
    let query = supabase
      .from('bans')
      .select(
        `
        *,
        user:users!user_id(id, username, email),
        banner:users!banned_by(id, username),
        unbanner:users!unbanned_by(id, username)
      `,
        { count: 'exact' }
      )
      .order('banned_at', { ascending: false })

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.ban_type) {
      query = query.eq('ban_type', filters.ban_type)
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    } else {
      query = query.limit(100)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching bans:', error)
      return { data: null, error: error.message, count: 0 }
    }

    return { data: data as Ban[], count: count || 0 }
  } catch (error) {
    console.error('Error fetching bans:', error)
    return { data: null, error: 'An unexpected error occurred', count: 0 }
  }
}

/**
 * Ban a user
 */
export async function banUser(params: {
  userId: string
  adminId: string
  reason: string
  banType: 'temporary' | 'permanent'
  durationDays?: number
}): Promise<{ success: boolean; banId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('ban_user', {
      target_user_id: params.userId,
      admin_user_id: params.adminId,
      ban_reason: params.reason,
      duration_type: params.banType,
      ban_duration_days: params.durationDays || null
    })

    if (error) {
      console.error('Error banning user:', error)
      return { success: false, error: error.message }
    }

    return { success: true, banId: data }
  } catch (error) {
    console.error('Error banning user:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Unban a user
 */
export async function unbanUser(params: {
  userId: string
  adminId: string
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('unban_user', {
      target_user_id: params.userId,
      admin_user_id: params.adminId,
      unban_reason_text: params.reason
    })

    if (error) {
      console.error('Error unbanning user:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error unbanning user:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get ban statistics
 */
export async function getBanStats(): Promise<BanStats> {
  try {
    const [bansResult, appealsResult] = await Promise.all([
      supabase.from('bans').select('ban_type, is_active, expires_at'),
      supabase.from('ban_appeals').select('status')
    ])

    const bans = bansResult.data || []
    const appeals = appealsResult.data || []

    const now = new Date()

    return {
      totalBans: bans.length,
      activeBans: bans.filter(b => b.is_active).length,
      temporaryBans: bans.filter(b => b.ban_type === 'temporary').length,
      permanentBans: bans.filter(b => b.ban_type === 'permanent').length,
      expiredBans: bans.filter(
        b =>
          b.ban_type === 'temporary' &&
          b.expires_at &&
          new Date(b.expires_at) < now
      ).length,
      pendingAppeals: appeals.filter(a => a.status === 'pending').length,
      approvedAppeals: appeals.filter(a => a.status === 'approved').length,
      rejectedAppeals: appeals.filter(a => a.status === 'rejected').length
    }
  } catch (error) {
    console.error('Error fetching ban stats:', error)
    return {
      totalBans: 0,
      activeBans: 0,
      temporaryBans: 0,
      permanentBans: 0,
      expiredBans: 0,
      pendingAppeals: 0,
      approvedAppeals: 0,
      rejectedAppeals: 0
    }
  }
}

/**
 * Get ban appeals
 */
export async function getBanAppeals(filters?: {
  status?: string
  user_id?: string
  limit?: number
}): Promise<{ data: BanAppeal[] | null; error?: string; count: number }> {
  try {
    let query = supabase
      .from('ban_appeals')
      .select(
        `
        *,
        user:users!user_id(id, username),
        reviewer:users!reviewed_by(id, username),
        ban:bans(*)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    } else {
      query = query.limit(50)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching ban appeals:', error)
      return { data: null, error: error.message, count: 0 }
    }

    return { data: data as BanAppeal[], count: count || 0 }
  } catch (error) {
    console.error('Error fetching ban appeals:', error)
    return { data: null, error: 'An unexpected error occurred', count: 0 }
  }
}

/**
 * Create a ban appeal
 */
export async function createBanAppeal(params: {
  banId: string
  userId: string
  appealReason: string
}): Promise<{ success: boolean; appealId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('ban_appeals')
      .insert({
        ban_id: params.banId,
        user_id: params.userId,
        appeal_reason: params.appealReason,
        status: 'pending'
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating ban appeal:', error)
      return { success: false, error: error.message }
    }

    return { success: true, appealId: data.id }
  } catch (error) {
    console.error('Error creating ban appeal:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Review a ban appeal
 */
export async function reviewBanAppeal(params: {
  appealId: string
  adminId: string
  status: 'approved' | 'rejected'
  reviewReason: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('ban_appeals')
      .update({
        status: params.status,
        reviewed_by: params.adminId,
        review_reason: params.reviewReason,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', params.appealId)

    if (error) {
      console.error('Error reviewing ban appeal:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error reviewing ban appeal:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Expire temporary bans (should be run periodically)
 */
export async function expireTemporaryBans(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { error } = await supabase.rpc('expire_temporary_bans')

    if (error) {
      console.error('Error expiring bans:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error expiring bans:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get ban duration display text
 */
export function getBanDurationDisplay(ban: Ban): string {
  if (ban.ban_type === 'permanent') {
    return 'Permanent'
  }

  if (!ban.expires_at) {
    return 'Unknown'
  }

  const expiryDate = new Date(ban.expires_at)
  const now = new Date()

  if (expiryDate < now) {
    return 'Expired'
  }

  const diffMs = expiryDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return '1 day remaining'
  }

  return `${diffDays} days remaining`
}

/**
 * Get ban type color
 */
export function getBanTypeColor(banType: string): string {
  return banType === 'permanent'
    ? 'text-red-700 bg-red-200'
    : 'text-orange-600 bg-orange-100'
}

/**
 * Get ban status color
 */
export function getBanStatusColor(isActive: boolean): string {
  return isActive ? 'text-red-600 bg-red-100' : 'text-gray-600 bg-gray-100'
}

/**
 * Get appeal status color
 */
export function getAppealStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-100',
    approved: 'text-green-600 bg-green-100',
    rejected: 'text-red-600 bg-red-100'
  }

  return colors[status] || 'text-gray-600 bg-gray-100'
}
