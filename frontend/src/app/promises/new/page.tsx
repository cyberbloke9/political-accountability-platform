'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Calendar as CalendarIcon, Loader2, Upload, X, Scale } from 'lucide-react'
import { format } from 'date-fns'

const CATEGORIES = [
  'Healthcare',
  'Education',
  'Economy',
  'Infrastructure',
  'Environment',
  'Justice',
  'Defense',
  'Technology',
  'Social Welfare',
  'Foreign Policy',
  'Other',
]

export default function NewPromisePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  const [formData, setFormData] = useState({
    politician_name: '',
    promise_text: '',
    promise_date: undefined as Date | undefined,
    source_url: '',
    category: '',
    tags: [] as string[],
  })

  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if not authenticated
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.politician_name.trim()) {
      newErrors.politician_name = 'Politician name is required'
    }

    if (!formData.promise_text.trim()) {
      newErrors.promise_text = 'Promise description is required'
    } else if (formData.promise_text.trim().length < 10) {
      newErrors.promise_text = 'Promise must be at least 10 characters'
    }

    if (!formData.promise_date) {
      newErrors.promise_date = 'Promise date is required'
    }

    if (formData.source_url && !isValidUrl(formData.source_url)) {
      newErrors.source_url = 'Please enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `${user?.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('promise-images')
      .upload(filePath, imageFile)

    if (uploadError) {
      toast.error('Failed to upload image')
      return null
    }

    const { data } = supabase.storage
      .from('promise-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    if (!user) {
      toast.error('You must be logged in to submit a promise')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload image if provided
      const imageUrl = await uploadImage()

      // Get user's database ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (userError || !userData) {
        toast.error('Failed to fetch user data')
        setIsSubmitting(false)
        return
      }

      // Insert promise
      const { error: insertError } = await supabase
        .from('promises')
        .insert({
          politician_name: formData.politician_name.trim(),
          promise_text: formData.promise_text.trim(),
          promise_date: format(formData.promise_date!, 'yyyy-MM-dd'),
          source_url: formData.source_url.trim() || null,
          category: formData.category || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          image_url: imageUrl,
          created_by: userData.id,
          status: 'pending',
        })

      if (insertError) {
        toast.error('Failed to create promise: ' + insertError.message)
        setIsSubmitting(false)
        return
      }

      toast.success('Promise created successfully!')
      router.push('/promises')
    } catch (error) {
      toast.error('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8 md:py-12 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <Scale className="h-8 w-8 text-primary" />
              Submit a Political Promise
            </h1>
            <p className="text-muted-foreground mt-2">
              Help track political accountability by documenting promises made by politicians
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Promise Details</CardTitle>
                <CardDescription>
                  Fill in the information about the political promise
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Politician Name */}
                <div className="space-y-2">
                  <Label htmlFor="politician">Politician Name *</Label>
                  <Input
                    id="politician"
                    placeholder="e.g., John Smith"
                    value={formData.politician_name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, politician_name: e.target.value }))
                      setErrors(prev => ({ ...prev, politician_name: '' }))
                    }}
                    className={errors.politician_name ? 'border-destructive' : ''}
                  />
                  {errors.politician_name && (
                    <p className="text-sm text-destructive">{errors.politician_name}</p>
                  )}
                </div>

                {/* Promise Text */}
                <div className="space-y-2">
                  <Label htmlFor="promise">Promise Description *</Label>
                  <Textarea
                    id="promise"
                    placeholder="Describe the promise made by the politician..."
                    rows={5}
                    value={formData.promise_text}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, promise_text: e.target.value }))
                      setErrors(prev => ({ ...prev, promise_text: '' }))
                    }}
                    className={errors.promise_text ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.promise_text.length} characters
                  </p>
                  {errors.promise_text && (
                    <p className="text-sm text-destructive">{errors.promise_text}</p>
                  )}
                </div>

                {/* Promise Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Date of Promise *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={'w-full justify-start text-left font-normal ' + (errors.promise_date ? 'border-destructive' : '')}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.promise_date ? (
                          format(formData.promise_date, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.promise_date}
                        onSelect={(date) => {
                          setFormData(prev => ({ ...prev, promise_date: date }))
                          setErrors(prev => ({ ...prev, promise_date: '' }))
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.promise_date && (
                    <p className="text-sm text-destructive">{errors.promise_date}</p>
                  )}
                </div>

                {/* Source URL */}
                <div className="space-y-2">
                  <Label htmlFor="source">Source URL (Optional)</Label>
                  <Input
                    id="source"
                    type="url"
                    placeholder="https://example.com/article"
                    value={formData.source_url}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, source_url: e.target.value }))
                      setErrors(prev => ({ ...prev, source_url: '' }))
                    }}
                    className={errors.source_url ? 'border-destructive' : ''}
                  />
                  {errors.source_url && (
                    <p className="text-sm text-destructive">{errors.source_url}</p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      placeholder="Add a tag and press Enter"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <div
                          key={tag}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="image">Image (Optional)</Label>
                  {!imagePreview ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload an image related to the promise
                      </p>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="max-w-xs mx-auto"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Max file size: 5MB
                      </p>
                    </div>
                  ) : (
                    <div className="relative w-full h-64">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover rounded-lg"
                        unoptimized
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeImage}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Promise...
                      </>
                    ) : (
                      'Submit Promise'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/promises')}
                    disabled={isSubmitting}
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
