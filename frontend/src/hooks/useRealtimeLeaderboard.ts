'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface LeaderboardEntry {
  user_id: string
  username: string
  total_score: number
  title: string
  reputation: number
  total_promises_created: number
  total_verifications_submitted: number
  total_votes_cast: number
  member_since: string
}

export function useRealtimeLeaderboard(limit: number = 100) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let channel: RealtimeChannel

    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('citizen_scores_mv')
          .select('*')
          .order('total_score', { ascending: false })
          .limit(limit)

        if (error) throw error

        setLeaderboard(data || [])
        setLoading(false)
      } catch (err) {
        setError(err as Error)
        setLoading(false)
      }
    }

    // Initial fetch
    fetchLeaderboard()

    // Subscribe to realtime updates
    channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'citizen_scores_mv',
        },
        (payload) => {
          console.log('Leaderboard update:', payload)
          // Refetch leaderboard on any change
          fetchLeaderboard()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [limit])

  return { leaderboard, loading, error }
}

export default useRealtimeLeaderboard
