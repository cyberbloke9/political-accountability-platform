import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://political-accountability.in'

// Create Supabase client only if env vars are available
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseClient()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/promises`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/politicians`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/elections`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/guidelines`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/transparency`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // If no Supabase client (e.g., during CI build), return only static pages
  if (!supabase) {
    return staticPages
  }

  // Dynamic promise pages
  let promisePages: MetadataRoute.Sitemap = []
  try {
    const { data: promises } = await supabase
      .from('promises')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000)

    if (promises) {
      promisePages = promises.map((promise) => ({
        url: `${SITE_URL}/promises/${promise.id}`,
        lastModified: new Date(promise.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Error fetching promises for sitemap:', error)
  }

  // Dynamic politician pages
  let politicianPages: MetadataRoute.Sitemap = []
  try {
    const { data: politicians } = await supabase
      .from('politicians')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false })
      .limit(500)

    if (politicians) {
      politicianPages = politicians.map((politician) => ({
        url: `${SITE_URL}/politicians/${politician.slug}`,
        lastModified: new Date(politician.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Error fetching politicians for sitemap:', error)
  }

  // Dynamic election pages
  let electionPages: MetadataRoute.Sitemap = []
  try {
    const { data: elections } = await supabase
      .from('elections')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100)

    if (elections) {
      electionPages = elections.map((election) => ({
        url: `${SITE_URL}/elections/${election.id}`,
        lastModified: new Date(election.updated_at),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Error fetching elections for sitemap:', error)
  }

  // Dynamic user profile pages (public profiles)
  let profilePages: MetadataRoute.Sitemap = []
  try {
    const { data: users } = await supabase
      .from('users')
      .select('username, updated_at')
      .gt('citizen_score', 100) // Only include active users
      .order('citizen_score', { ascending: false })
      .limit(500)

    if (users) {
      profilePages = users.map((user) => ({
        url: `${SITE_URL}/profile/${user.username}`,
        lastModified: new Date(user.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }))
    }
  } catch (error) {
    console.error('Error fetching users for sitemap:', error)
  }

  return [
    ...staticPages,
    ...promisePages,
    ...politicianPages,
    ...electionPages,
    ...profilePages,
  ]
}
