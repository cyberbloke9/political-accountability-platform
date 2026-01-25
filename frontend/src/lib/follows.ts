import { supabase } from './supabase'

export type FollowType = 'politician' | 'promise' | 'tag' | 'user'

export interface Follow {
  id: string
  user_id: string
  follow_type: FollowType
  target_id: string
  notify_on_update: boolean
  notify_on_verification: boolean
  notify_on_status_change: boolean
  created_at: string
}

export interface FollowCount {
  follow_type: FollowType
  target_id: string
  follower_count: number
}

/**
 * Follow a politician, promise, tag, or user
 */
export async function followTarget(
  targetType: FollowType,
  targetId: string,
  options?: {
    notifyOnUpdate?: boolean
    notifyOnVerification?: boolean
    notifyOnStatusChange?: boolean
  }
): Promise<{ success: boolean; followId?: string; error?: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Auth error:', authError)
      return { success: false, error: 'Authentication error: ' + authError.message }
    }
    if (!user) {
      return { success: false, error: 'Not authenticated. Please log in again.' }
    }

    // Get user's internal ID (use maybeSingle to avoid 406 error)
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (userError) {
      console.error('User lookup error:', userError)
      return { success: false, error: 'User profile lookup failed. Please try again.' }
    }

    // If user doesn't exist by auth_id, use RPC to link/create
    if (!userData) {
      console.log('User not found by auth_id, linking via RPC...')

      const { data: linkedUserId, error: linkError } = await supabase.rpc('link_user_auth_id', {
        p_auth_id: user.id,
        p_email: user.email
      })

      if (linkError) {
        console.error('Link user error:', linkError)
        return { success: false, error: 'Failed to link user profile. Please try again.' }
      }

      userData = { id: linkedUserId }
    }

    if (!userData) {
      return { success: false, error: 'User profile not found. Please contact support.' }
    }

    // Try RPC first
    const { data, error } = await supabase.rpc('follow_target', {
      p_user_id: userData.id,
      p_follow_type: targetType,
      p_target_id: targetId,
      p_notify_update: options?.notifyOnUpdate ?? true,
      p_notify_verification: options?.notifyOnVerification ?? true,
      p_notify_status: options?.notifyOnStatusChange ?? true
    })

    if (error) {
      console.error('RPC follow_target error:', error)

      // Fallback to direct insert if RPC doesn't exist
      if (error.message.includes('function') || error.code === '42883') {
        console.log('RPC not found, using direct insert fallback')

        // Check if already following first (to avoid duplicate key error)
        const { data: existingFollow } = await supabase
          .from('follows')
          .select('id')
          .eq('user_id', userData.id)
          .eq('follow_type', targetType)
          .eq('target_id', targetId)
          .maybeSingle()

        if (existingFollow) {
          // Already following
          return { success: true, followId: existingFollow.id }
        }

        // Insert new follow
        const { data: insertData, error: insertError } = await supabase
          .from('follows')
          .insert({
            user_id: userData.id,
            follow_type: targetType,
            target_id: targetId,
            notify_on_update: options?.notifyOnUpdate ?? true,
            notify_on_verification: options?.notifyOnVerification ?? true,
            notify_on_status_change: options?.notifyOnStatusChange ?? true
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('Direct insert error:', insertError)
          // Check if it's a "table does not exist" error
          if (insertError.message.includes('relation') && insertError.message.includes('does not exist')) {
            return { success: false, error: 'Follow feature not available. Please contact support.' }
          }
          return { success: false, error: 'Failed to follow: ' + insertError.message }
        }

        return { success: true, followId: insertData?.id }
      }

      return { success: false, error: 'Failed to follow: ' + error.message }
    }

    return { success: true, followId: data }
  } catch (error) {
    console.error('Unexpected error in followTarget:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Unfollow a politician, promise, tag, or user
 */
export async function unfollowTarget(
  targetType: FollowType,
  targetId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Auth error:', authError)
      return { success: false, error: 'Authentication error' }
    }
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's internal ID (use maybeSingle to avoid 406 error)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (userError) {
      console.error('User lookup error:', userError)
      return { success: false, error: 'User lookup failed' }
    }

    if (!userData) {
      return { success: false, error: 'User profile not found' }
    }

    // Try RPC first
    const { error } = await supabase.rpc('unfollow_target', {
      p_user_id: userData.id,
      p_follow_type: targetType,
      p_target_id: targetId
    })

    if (error) {
      console.error('RPC unfollow_target error:', error)

      // Fallback to direct delete if RPC doesn't exist
      if (error.message.includes('function') || error.code === '42883') {
        console.log('RPC not found, using direct delete fallback')
        const { error: deleteError } = await supabase
          .from('follows')
          .delete()
          .eq('user_id', userData.id)
          .eq('follow_type', targetType)
          .eq('target_id', targetId)

        if (deleteError) {
          console.error('Direct delete error:', deleteError)
          return { success: false, error: 'Failed to unfollow: ' + deleteError.message }
        }

        return { success: true }
      }

      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in unfollowTarget:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Check if current user follows something
 */
export async function isFollowing(
  targetType: FollowType,
  targetId: string
): Promise<boolean> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return false

    // Get user's internal ID (use maybeSingle to avoid 406 error)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (userError || !userData) return false

    // Try RPC first
    const { data, error } = await supabase.rpc('is_following', {
      p_user_id: userData.id,
      p_follow_type: targetType,
      p_target_id: targetId
    })

    if (error) {
      console.error('RPC is_following error:', error)

      // Fallback to direct query if RPC doesn't exist
      if (error.message.includes('function') || error.code === '42883') {
        console.log('RPC not found, using direct query fallback')
        const { data: followData, error: queryError } = await supabase
          .from('follows')
          .select('id')
          .eq('user_id', userData.id)
          .eq('follow_type', targetType)
          .eq('target_id', targetId)
          .maybeSingle()

        if (queryError) {
          console.error('Direct query error:', queryError)
          return false
        }

        return !!followData
      }

      return false
    }

    return data || false
  } catch (error) {
    console.error('Error checking follow status:', error)
    return false
  }
}

/**
 * Get all items the current user follows
 */
export async function getUserFollows(
  followType?: FollowType
): Promise<{ data: Follow[] | null; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    // Get user's internal ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      return { data: null, error: 'User not found' }
    }

    let query = supabase
      .from('follows')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })

    if (followType) {
      query = query.eq('follow_type', followType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching follows:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Follow[] }
  } catch (error) {
    console.error('Error fetching follows:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get follower count for a target
 */
export async function getFollowerCount(
  targetType: FollowType,
  targetId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follow_type', targetType)
      .eq('target_id', targetId)

    if (error) {
      console.error('Error getting follower count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error getting follower count:', error)
    return 0
  }
}

/**
 * Get followed politicians with their data
 */
export async function getFollowedPoliticians(): Promise<{
  data: any[] | null
  error?: string
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      return { data: null, error: 'User not found' }
    }

    // Get follows and join with politicians
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('target_id')
      .eq('user_id', userData.id)
      .eq('follow_type', 'politician')

    if (followsError || !follows) {
      return { data: null, error: followsError?.message }
    }

    const politicianIds = follows.map(f => f.target_id)

    if (politicianIds.length === 0) {
      return { data: [] }
    }

    const { data: politicians, error: politiciansError } = await supabase
      .from('politicians')
      .select('*')
      .in('id', politicianIds)

    if (politiciansError) {
      return { data: null, error: politiciansError.message }
    }

    return { data: politicians }
  } catch (error) {
    console.error('Error fetching followed politicians:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get followed promises with their data
 */
export async function getFollowedPromises(): Promise<{
  data: any[] | null
  error?: string
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      return { data: null, error: 'User not found' }
    }

    // Get follows and join with promises
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('target_id')
      .eq('user_id', userData.id)
      .eq('follow_type', 'promise')

    if (followsError || !follows) {
      return { data: null, error: followsError?.message }
    }

    const promiseIds = follows.map(f => f.target_id)

    if (promiseIds.length === 0) {
      return { data: [] }
    }

    const { data: promises, error: promisesError } = await supabase
      .from('promises')
      .select('*')
      .in('id', promiseIds)
      .order('updated_at', { ascending: false })

    if (promisesError) {
      return { data: null, error: promisesError.message }
    }

    return { data: promises }
  } catch (error) {
    console.error('Error fetching followed promises:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get personalized feed based on follows
 */
export async function getPersonalizedFeed(limit: number = 20): Promise<{
  data: any[] | null
  error?: string
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      return { data: null, error: 'User not found' }
    }

    // Get all follows
    const { data: follows } = await supabase
      .from('follows')
      .select('follow_type, target_id')
      .eq('user_id', userData.id)

    if (!follows || follows.length === 0) {
      // Return recent promises if no follows
      const { data: recentPromises } = await supabase
        .from('promises')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      return { data: recentPromises }
    }

    // Get followed politician IDs
    const politicianIds = follows
      .filter(f => f.follow_type === 'politician')
      .map(f => f.target_id)

    // Get followed promise IDs
    const promiseIds = follows
      .filter(f => f.follow_type === 'promise')
      .map(f => f.target_id)

    // Build query for personalized feed
    let query = supabase
      .from('promises')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit)

    // Filter by followed politicians OR followed promises
    if (politicianIds.length > 0 && promiseIds.length > 0) {
      // Get politician names for the IDs
      const { data: politicians } = await supabase
        .from('politicians')
        .select('name')
        .in('id', politicianIds)

      const politicianNames = politicians?.map(p => p.name) || []

      const { data: promises } = await supabase
        .from('promises')
        .select('*')
        .or(`politician_name.in.(${politicianNames.map(n => `"${n}"`).join(',')}),id.in.(${promiseIds.join(',')})`)
        .order('updated_at', { ascending: false })
        .limit(limit)

      return { data: promises }
    } else if (politicianIds.length > 0) {
      const { data: politicians } = await supabase
        .from('politicians')
        .select('name')
        .in('id', politicianIds)

      const politicianNames = politicians?.map(p => p.name) || []

      const { data: promises } = await supabase
        .from('promises')
        .select('*')
        .in('politician_name', politicianNames)
        .order('updated_at', { ascending: false })
        .limit(limit)

      return { data: promises }
    } else if (promiseIds.length > 0) {
      const { data: promises } = await supabase
        .from('promises')
        .select('*')
        .in('id', promiseIds)
        .order('updated_at', { ascending: false })
        .limit(limit)

      return { data: promises }
    }

    // Fallback to recent
    const { data: recentPromises } = await supabase
      .from('promises')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    return { data: recentPromises }
  } catch (error) {
    console.error('Error fetching personalized feed:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Update notification preferences for a follow
 */
export async function updateFollowPreferences(
  targetType: FollowType,
  targetId: string,
  preferences: {
    notifyOnUpdate?: boolean
    notifyOnVerification?: boolean
    notifyOnStatusChange?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      return { success: false, error: 'User not found' }
    }

    const updates: any = {}
    if (preferences.notifyOnUpdate !== undefined) {
      updates.notify_on_update = preferences.notifyOnUpdate
    }
    if (preferences.notifyOnVerification !== undefined) {
      updates.notify_on_verification = preferences.notifyOnVerification
    }
    if (preferences.notifyOnStatusChange !== undefined) {
      updates.notify_on_status_change = preferences.notifyOnStatusChange
    }

    const { error } = await supabase
      .from('follows')
      .update(updates)
      .eq('user_id', userData.id)
      .eq('follow_type', targetType)
      .eq('target_id', targetId)

    if (error) {
      console.error('Error updating follow preferences:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating follow preferences:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
