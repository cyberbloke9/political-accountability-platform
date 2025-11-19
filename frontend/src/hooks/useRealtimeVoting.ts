'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface VoteCount {
  approve: number
  reject: number
  total: number
}

export function useRealtimeVoting(verificationId: string) {
  const [voteCount, setVoteCount] = useState<VoteCount>({ approve: 0, reject: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!verificationId) return

    const fetchVotes = async () => {
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('vote_type')
          .eq('verification_id', verificationId)

        if (error) throw error

        const counts = data.reduce(
          (acc, vote) => {
            if (vote.vote_type === 'approve') acc.approve++
            if (vote.vote_type === 'reject') acc.reject++
            acc.total++
            return acc
          },
          { approve: 0, reject: 0, total: 0 }
        )

        setVoteCount(counts)
        setLoading(false)
      } catch (err) {
        setError(err as Error)
        setLoading(false)
      }
    }

    // Initial fetch
    fetchVotes()

    // Subscribe to realtime vote updates
    const channel: RealtimeChannel = supabase
      .channel(`votes-${verificationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `verification_id=eq.${verificationId}`,
        },
        (payload) => {
          const newVote = payload.new as { vote_type: string }
          
          setVoteCount((prev) => ({
            approve: prev.approve + (newVote.vote_type === 'approve' ? 1 : 0),
            reject: prev.reject + (newVote.vote_type === 'reject' ? 1 : 0),
            total: prev.total + 1,
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [verificationId])

  return { voteCount, loading, error }
}

export default useRealtimeVoting
