'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Link2,
  Check,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SocialShareButtonsProps {
  url: string
  title: string
  description?: string
  hashtags?: string[]
  variant?: 'inline' | 'dropdown' | 'compact'
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  className?: string
}

const PLATFORM_COLORS = {
  twitter: 'hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]',
  facebook: 'hover:bg-[#4267B2]/10 hover:text-[#4267B2]',
  whatsapp: 'hover:bg-[#25D366]/10 hover:text-[#25D366]',
  linkedin: 'hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]',
}

export function SocialShareButtons({
  url,
  title,
  description,
  hashtags = [],
  variant = 'inline',
  size = 'md',
  showLabels = false,
  className,
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description || '')
  const hashtagString = hashtags.length > 0 ? hashtags.join(',') : 'PoliticalAccountability'

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${hashtagString}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  }

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url,
        })
      } catch (error) {
        // User cancelled or share failed - ignore
      }
    }
  }

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  const buttonSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
  const buttonPadding = showLabels ? 'px-3' : ''

  // Compact dropdown variant
  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'} className={className}>
            <Share2 className={cn(iconSize, showLabels && 'mr-2')} />
            {showLabels && 'Share'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleShare('twitter')} className={PLATFORM_COLORS.twitter}>
            <Twitter className="h-4 w-4 mr-2" />
            Share on Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('facebook')} className={PLATFORM_COLORS.facebook}>
            <Facebook className="h-4 w-4 mr-2" />
            Share on Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('whatsapp')} className={PLATFORM_COLORS.whatsapp}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Share on WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('linkedin')} className={PLATFORM_COLORS.linkedin}>
            <Linkedin className="h-4 w-4 mr-2" />
            Share on LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Link2 className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </DropdownMenuItem>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share2 className="h-4 w-4 mr-2" />
              More Options...
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Compact single button (uses native share on mobile)
  if (variant === 'compact') {
    const handleClick = () => {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        handleNativeShare()
      } else {
        handleCopyLink()
      }
    }

    return (
      <Button
        variant="outline"
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        onClick={handleClick}
        className={className}
      >
        <Share2 className={cn(iconSize, showLabels && 'mr-2')} />
        {showLabels && 'Share'}
      </Button>
    )
  }

  // Inline variant - show all buttons
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Twitter */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleShare('twitter')}
        className={cn(buttonSize, buttonPadding, PLATFORM_COLORS.twitter)}
        title="Share on Twitter"
      >
        <Twitter className={iconSize} />
        {showLabels && <span className="ml-2 text-sm">Twitter</span>}
      </Button>

      {/* Facebook */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleShare('facebook')}
        className={cn(buttonSize, buttonPadding, PLATFORM_COLORS.facebook)}
        title="Share on Facebook"
      >
        <Facebook className={iconSize} />
        {showLabels && <span className="ml-2 text-sm">Facebook</span>}
      </Button>

      {/* WhatsApp */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleShare('whatsapp')}
        className={cn(buttonSize, buttonPadding, PLATFORM_COLORS.whatsapp)}
        title="Share on WhatsApp"
      >
        <MessageCircle className={iconSize} />
        {showLabels && <span className="ml-2 text-sm">WhatsApp</span>}
      </Button>

      {/* LinkedIn */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleShare('linkedin')}
        className={cn(buttonSize, buttonPadding, PLATFORM_COLORS.linkedin)}
        title="Share on LinkedIn"
      >
        <Linkedin className={iconSize} />
        {showLabels && <span className="ml-2 text-sm">LinkedIn</span>}
      </Button>

      {/* Copy Link */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopyLink}
        className={cn(buttonSize, buttonPadding, copied && 'text-green-500')}
        title={copied ? 'Copied!' : 'Copy Link'}
      >
        {copied ? <Check className={iconSize} /> : <Link2 className={iconSize} />}
        {showLabels && <span className="ml-2 text-sm">{copied ? 'Copied' : 'Copy'}</span>}
      </Button>
    </div>
  )
}
