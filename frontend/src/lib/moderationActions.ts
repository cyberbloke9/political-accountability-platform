import { supabase } from './supabase'

/**
 * Approve a verification
 * Calls database function that handles:
 * - Status update
 * - Reputation increase (+10)
 * - Admin action logging
 * - In-app notification
 */
export async function approveVerification(
  verificationId: string,
  adminReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user (admin)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get admin's user ID
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!adminUser) {
      return { success: false, error: 'Admin user not found' }
    }

    // Call database function
    const { error } = await supabase.rpc('approve_verification', {
      verification_id: verificationId,
      admin_user_id: adminUser.id,
      approval_reason: adminReason || null
    })

    if (error) {
      console.error('Error approving verification:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error approving verification:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Reject a verification
 * Calls database function that handles:
 * - Status update
 * - Reputation decrease (-15)
 * - Admin action logging
 * - In-app notification with reason
 */
export async function rejectVerification(
  verificationId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!reason.trim()) {
      return { success: false, error: 'Rejection reason is required' }
    }

    // Get current user (admin)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get admin's user ID
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!adminUser) {
      return { success: false, error: 'Admin user not found' }
    }

    // Call database function
    const { error } = await supabase.rpc('reject_verification', {
      verification_id: verificationId,
      admin_user_id: adminUser.id,
      rejection_reason: reason
    })

    if (error) {
      console.error('Error rejecting verification:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error rejecting verification:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
