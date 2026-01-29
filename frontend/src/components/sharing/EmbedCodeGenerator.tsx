'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Code, Copy, Check, ExternalLink } from 'lucide-react'

interface EmbedCodeGeneratorProps {
  type: 'promise' | 'politician' | 'comparison'
  id: string
  title: string
  // For promises
  promiseText?: string
  politicianName?: string
  status?: string
  // For politicians
  name?: string
  party?: string
  grade?: string
  fulfillmentRate?: number
  // For comparison
  politicians?: { name: string; grade: string; rate: number }[]
}

type EmbedSize = 'small' | 'medium' | 'large'
type EmbedTheme = 'light' | 'dark' | 'auto'

const SIZES: Record<EmbedSize, { width: number; height: number }> = {
  small: { width: 320, height: 180 },
  medium: { width: 480, height: 270 },
  large: { width: 640, height: 360 },
}

export function EmbedCodeGenerator({
  type,
  id,
  title,
  promiseText,
  politicianName,
  status,
  name,
  party,
  grade,
  fulfillmentRate,
  politicians,
}: EmbedCodeGeneratorProps) {
  const [size, setSize] = useState<EmbedSize>('medium')
  const [theme, setTheme] = useState<EmbedTheme>('dark')
  const [copied, setCopied] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://political-accountability.in'

  const getEmbedUrl = () => {
    const params = new URLSearchParams()
    params.set('embed', 'true')
    params.set('theme', theme)

    if (type === 'promise') {
      return `${baseUrl}/promises/${id}?${params.toString()}`
    } else if (type === 'politician') {
      return `${baseUrl}/politicians/${id}?${params.toString()}`
    } else {
      return `${baseUrl}/compare/${id}?${params.toString()}`
    }
  }

  const getOgImageUrl = () => {
    const params = new URLSearchParams()
    params.set('type', type)

    if (type === 'promise') {
      params.set('politician', politicianName || '')
      params.set('text', promiseText || '')
      params.set('status', status || 'pending')
    } else if (type === 'politician') {
      params.set('name', name || '')
      params.set('party', party || '')
      params.set('grade', grade || 'C')
      params.set('rate', String(fulfillmentRate || 0))
    }

    return `${baseUrl}/api/og?${params.toString()}`
  }

  const getIframeCode = () => {
    const { width, height } = SIZES[size]
    return `<iframe
  src="${getEmbedUrl()}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border-radius: 12px; overflow: hidden;"
  title="${title}"
></iframe>`
  }

  const getImageCode = () => {
    const linkUrl = type === 'promise'
      ? `${baseUrl}/promises/${id}`
      : type === 'politician'
      ? `${baseUrl}/politicians/${id}`
      : `${baseUrl}/compare/${id}`

    return `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">
  <img
    src="${getOgImageUrl()}"
    alt="${title}"
    style="max-width: 100%; height: auto; border-radius: 12px;"
  />
</a>`
  }

  const getMarkdownCode = () => {
    const linkUrl = type === 'promise'
      ? `${baseUrl}/promises/${id}`
      : type === 'politician'
      ? `${baseUrl}/politicians/${id}`
      : `${baseUrl}/compare/${id}`

    return `[![${title}](${getOgImageUrl()})](${linkUrl})`
  }

  const handleCopy = async (code: string, type: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(type)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Code className="h-4 w-4 mr-2" />
          Embed
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Embed this {type}</DialogTitle>
          <DialogDescription>
            Add this {type} to your website, blog, or documentation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={size} onValueChange={(v) => setSize(v as EmbedSize)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (320x180)</SelectItem>
                  <SelectItem value="medium">Medium (480x270)</SelectItem>
                  <SelectItem value="large">Large (640x360)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as EmbedTheme)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="auto">Auto (System)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="bg-muted rounded-lg p-4 flex items-center justify-center min-h-[200px]">
              <img
                src={getOgImageUrl()}
                alt="Preview"
                className="max-w-full h-auto rounded-lg shadow-lg"
                style={{ maxHeight: '180px' }}
              />
            </div>
          </div>

          {/* Code Tabs */}
          <Tabs defaultValue="iframe">
            <TabsList className="w-full">
              <TabsTrigger value="iframe" className="flex-1">iFrame</TabsTrigger>
              <TabsTrigger value="image" className="flex-1">Image + Link</TabsTrigger>
              <TabsTrigger value="markdown" className="flex-1">Markdown</TabsTrigger>
            </TabsList>

            <TabsContent value="iframe" className="space-y-2">
              <div className="relative">
                <Textarea
                  value={getIframeCode()}
                  readOnly
                  className="font-mono text-xs h-32"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(getIframeCode(), 'iframe')}
                >
                  {copied === 'iframe' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Embeds an interactive widget that updates automatically
              </p>
            </TabsContent>

            <TabsContent value="image" className="space-y-2">
              <div className="relative">
                <Textarea
                  value={getImageCode()}
                  readOnly
                  className="font-mono text-xs h-32"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(getImageCode(), 'image')}
                >
                  {copied === 'image' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Static image that links to the full page
              </p>
            </TabsContent>

            <TabsContent value="markdown" className="space-y-2">
              <div className="relative">
                <Textarea
                  value={getMarkdownCode()}
                  readOnly
                  className="font-mono text-xs h-20"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(getMarkdownCode(), 'markdown')}
                >
                  {copied === 'markdown' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                For GitHub, Reddit, and other Markdown-compatible platforms
              </p>
            </TabsContent>
          </Tabs>

          {/* Direct Link */}
          <div className="space-y-2">
            <Label>Direct Link</Label>
            <div className="flex gap-2">
              <Input
                value={getEmbedUrl().replace('?embed=true&theme=' + theme, '')}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopy(getEmbedUrl().replace('?embed=true&theme=' + theme, ''), 'link')}
              >
                {copied === 'link' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => window.open(getEmbedUrl().replace('?embed=true&theme=' + theme, ''), '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
