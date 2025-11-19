'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface UploadProgress {
  uploading: boolean
  progress: number
  error: Error | null
}

interface UploadResult {
  publicUrl: string
  path: string
  thumbnailUrl?: string
}

const STORAGE_BUCKETS = {
  EVIDENCE_IMAGES: 'evidence-images',
  EVIDENCE_VIDEOS: 'evidence-videos',
  PROFILE_AVATARS: 'profile-avatars',
} as const

export function useSupabaseStorage() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    uploading: false,
    progress: 0,
    error: null,
  })

  const uploadFile = async (
    file: File,
    bucket: keyof typeof STORAGE_BUCKETS,
    path: string
  ): Promise<UploadResult | null> => {
    try {
      setUploadProgress({ uploading: true, progress: 0, error: null })

      const bucketName = STORAGE_BUCKETS[bucket]
      const filePath = `${path}/${Date.now()}-${file.name}`

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath)

      const thumbnailUrl =
        bucket === 'EVIDENCE_IMAGES'
          ? `${publicUrl}?width=400&height=400&resize=cover&format=webp&quality=80`
          : undefined

      setUploadProgress({ uploading: false, progress: 100, error: null })

      return {
        publicUrl,
        path: data.path,
        thumbnailUrl,
      }
    } catch (error) {
      setUploadProgress({ uploading: false, progress: 0, error: error as Error })
      return null
    }
  }

  const deleteFile = async (bucket: keyof typeof STORAGE_BUCKETS, path: string) => {
    try {
      const bucketName = STORAGE_BUCKETS[bucket]
      const { error } = await supabase.storage.from(bucketName).remove([path])

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Delete error:', error)
      return { success: false, error: error as Error }
    }
  }

  const getPublicUrl = (bucket: keyof typeof STORAGE_BUCKETS, path: string) => {
    const bucketName = STORAGE_BUCKETS[bucket]
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(path)

    return publicUrl
  }

  const getOptimizedImageUrl = (
    publicUrl: string,
    options: {
      width?: number
      height?: number
      resize?: 'cover' | 'contain' | 'fill'
      format?: 'webp' | 'jpeg' | 'png'
      quality?: number
    } = {}
  ) => {
    const params = new URLSearchParams()

    if (options.width) params.set('width', options.width.toString())
    if (options.height) params.set('height', options.height.toString())
    if (options.resize) params.set('resize', options.resize)
    if (options.format) params.set('format', options.format)
    if (options.quality) params.set('quality', options.quality.toString())

    return `${publicUrl}?${params.toString()}`
  }

  return {
    uploadFile,
    deleteFile,
    getPublicUrl,
    getOptimizedImageUrl,
    uploadProgress,
    STORAGE_BUCKETS,
  }
}

export default useSupabaseStorage
