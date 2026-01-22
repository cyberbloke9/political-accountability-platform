'use client'

import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  CheckCircle2,
  XCircle,
  FileText,
  Plus,
  RefreshCw,
  AtSign,
  UserPlus,
  ChevronRight,
  Trash2
} from 'lucide-react'
import { Notification, getNotificationIcon } from '@/lib/notifications'
import { cn } from '@/lib/utils'

interface NotificationCardProps {
  notification: Notification
  onClick?: () => void
  onDelete?: () => void
  variant?: 'compact' | 'detailed'
  className?: string
}

const ICON_MAP: Record<string, React.ElementType> = {
  Bell: Bell,
  CheckCircle: CheckCircle2,
  XCircle: XCircle,
  FileText: FileText,
  Plus: Plus,
  RefreshCw: RefreshCw,
  AtSign: AtSign,
  UserPlus: UserPlus,
}

export function NotificationCard({
  notification,
  onClick,
  onDelete,
  variant = 'compact',
  className
}: NotificationCardProps) {
  const iconConfig = getNotificationIcon(notification.type)
  const Icon = ICON_MAP[iconConfig.icon] || Bell
  const isClickable = !!notification.link || !!onClick

  const content = (
    <>
      {/* Icon */}
      <div
        className={cn(
          'shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          iconConfig.bgColor
        )}
      >
        <Icon className={cn('h-5 w-5', iconConfig.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn(
              'text-sm font-medium truncate',
              !notification.read && 'text-foreground',
              notification.read && 'text-muted-foreground'
            )}>
              {notification.title}
            </p>
            <p className={cn(
              'text-xs mt-0.5',
              variant === 'compact' ? 'line-clamp-1' : 'line-clamp-2',
              notification.read ? 'text-muted-foreground/70' : 'text-muted-foreground'
            )}>
              {notification.message}
            </p>
          </div>

          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
          {notification.priority === 'high' && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0">
              Important
            </Badge>
          )}
          {notification.category !== 'general' && variant === 'detailed' && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {notification.category}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      {variant === 'detailed' && (
        <div className="shrink-0 flex items-center gap-1">
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {isClickable && (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      )}
    </>
  )

  if (isClickable) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-start gap-3 p-4 text-left transition-colors',
          'hover:bg-muted/50',
          !notification.read && 'bg-primary/5',
          className
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4',
        !notification.read && 'bg-primary/5',
        className
      )}
    >
      {content}
    </div>
  )
}

// Group of notifications by date
interface NotificationGroupProps {
  title: string
  notifications: Notification[]
  onNotificationClick?: (notification: Notification) => void
  onNotificationDelete?: (notification: Notification) => void
}

export function NotificationGroup({
  title,
  notifications,
  onNotificationClick,
  onNotificationDelete
}: NotificationGroupProps) {
  if (notifications.length === 0) return null

  return (
    <div>
      <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </div>
      <div className="divide-y">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onClick={onNotificationClick ? () => onNotificationClick(notification) : undefined}
            onDelete={onNotificationDelete ? () => onNotificationDelete(notification) : undefined}
            variant="detailed"
          />
        ))}
      </div>
    </div>
  )
}
