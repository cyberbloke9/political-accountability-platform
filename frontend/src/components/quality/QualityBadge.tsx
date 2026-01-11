'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  ConfidenceLevel,
  SourceAnalysis,
  getConfidenceDisplay,
  getTierDisplay,
  formatQualityScore
} from '@/lib/evidence-quality'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ChevronDown,
  ExternalLink
} from 'lucide-react'

interface QualityBadgeProps {
  qualityScore: number
  confidenceLevel: ConfidenceLevel
  sourceAnalysis?: SourceAnalysis
  corroborationCount?: number
  compact?: boolean
}

export function QualityBadge({
  qualityScore,
  confidenceLevel,
  sourceAnalysis,
  corroborationCount = 0,
  compact = false
}: QualityBadgeProps) {
  const [expanded, setExpanded] = useState(false)
  const display = getConfidenceDisplay(confidenceLevel)

  const getIcon = () => {
    switch (confidenceLevel) {
      case 'very_high':
      case 'high':
        return <ShieldCheck className="h-4 w-4" />
      case 'medium':
        return <Shield className="h-4 w-4" />
      case 'low':
      case 'very_low':
        return <ShieldAlert className="h-4 w-4" />
      default:
        return <ShieldQuestion className="h-4 w-4" />
    }
  }

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge className={`${display.bgColor} ${display.color} cursor-help`}>
            {getIcon()}
            <span className="ml-1">{formatQualityScore(qualityScore)}</span>
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <p className="font-semibold">{display.label}</p>
          <p className="text-sm text-muted-foreground">{display.description}</p>
          {corroborationCount > 0 && (
            <p className="text-sm mt-1">
              {corroborationCount} user{corroborationCount !== 1 ? 's' : ''} corroborated
            </p>
          )}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="space-y-2">
      {/* Main Badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${display.bgColor} transition-colors w-full`}
      >
        <div className={display.color}>
          {getIcon()}
        </div>
        <div className="flex-1 text-left">
          <p className={`text-sm font-medium ${display.color}`}>
            {display.label}
          </p>
          <p className="text-xs text-muted-foreground">
            Quality Score: {formatQualityScore(qualityScore)}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-3 text-sm">
          <p className="text-muted-foreground">{display.description}</p>

          {/* Corroboration */}
          {corroborationCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {corroborationCount} Corroboration{corroborationCount !== 1 ? 's' : ''}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Other users confirmed this evidence
              </span>
            </div>
          )}

          {/* Source Breakdown */}
          {sourceAnalysis?.sources && sourceAnalysis.sources.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">Sources:</p>
              <div className="space-y-1">
                {sourceAnalysis.sources.map((source, idx) => {
                  const tierInfo = getTierDisplay(source.tier)
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs bg-background rounded p-2"
                    >
                      <Badge
                        variant="outline"
                        className={`text-xs ${tierInfo.color}`}
                      >
                        T{source.tier}
                      </Badge>
                      <span className="flex-1 truncate">
                        {source.display_name}
                      </span>
                      {source.verified && (
                        <ShieldCheck className="h-3 w-3 text-green-500" />
                      )}
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tier Legend */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Source Tiers:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span className="text-green-600">T1: Government/Official</span>
              <span className="text-blue-600">T2: Major News</span>
              <span className="text-yellow-600">T3: Regional</span>
              <span className="text-red-600">T4: Unverified</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact inline version for cards
export function QualityIndicator({
  qualityScore,
  confidenceLevel
}: {
  qualityScore: number
  confidenceLevel: ConfidenceLevel
}) {
  const display = getConfidenceDisplay(confidenceLevel)

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${display.bgColor} ${display.color}`}>
      <Shield className="h-3 w-3" />
      <span>{formatQualityScore(qualityScore)}</span>
    </div>
  )
}
