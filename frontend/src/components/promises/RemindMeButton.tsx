'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { createReminder } from '@/lib/emailDigest'
import { toast } from 'sonner'
import { Bell, CalendarClock, Loader2, Check } from 'lucide-react'
import { addDays, addWeeks, addMonths, format } from 'date-fns'

interface RemindMeButtonProps {
  promiseId: string
  promiseText?: string
  variant?: 'default' | 'compact' | 'icon'
  className?: string
}

const QUICK_OPTIONS = [
  { label: '1 week', getValue: () => addWeeks(new Date(), 1) },
  { label: '1 month', getValue: () => addMonths(new Date(), 1) },
  { label: '3 months', getValue: () => addMonths(new Date(), 3) },
  { label: '6 months', getValue: () => addMonths(new Date(), 6) },
  { label: '1 year', getValue: () => addMonths(new Date(), 12) },
]

export function RemindMeButton({
  promiseId,
  promiseText,
  variant = 'default',
  className
}: RemindMeButtonProps) {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleQuickOption = async (date: Date) => {
    setSelectedDate(date)
    await handleSubmit(date)
  }

  const handleSubmit = async (date?: Date) => {
    const reminderDate = date || selectedDate
    if (!reminderDate) {
      toast.error('Please select a date')
      return
    }

    setLoading(true)
    const result = await createReminder(promiseId, reminderDate, note || undefined)
    setLoading(false)

    if (result.success) {
      setSuccess(true)
      toast.success(`Reminder set for ${format(reminderDate, 'MMM d, yyyy')}`)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setSelectedDate(undefined)
        setNote('')
      }, 1500)
    } else {
      toast.error(result.error || 'Failed to set reminder')
    }
  }

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size={variant === 'icon' ? 'icon' : 'sm'}
        className={className}
        onClick={() => toast.error('Please log in to set reminders')}
      >
        <Bell className="h-4 w-4" />
        {variant === 'default' && <span className="ml-2">Remind Me</span>}
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={variant === 'icon' ? 'icon' : 'sm'}
          className={className}
        >
          {success ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <CalendarClock className="h-4 w-4" />
          )}
          {variant === 'default' && <span className="ml-2">Remind Me</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Set a Reminder</h4>
            <p className="text-xs text-muted-foreground">
              Get notified about this promise on a future date
            </p>
          </div>

          {/* Quick Options */}
          <div className="flex flex-wrap gap-2">
            {QUICK_OPTIONS.map((option) => (
              <Button
                key={option.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickOption(option.getValue())}
                disabled={loading}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-popover px-2 text-muted-foreground">
                or pick a date
              </span>
            </div>
          </div>

          {/* Calendar */}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date()}
            initialFocus
          />

          {/* Optional Note */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-xs">
              Note (optional)
            </Label>
            <Textarea
              id="note"
              placeholder="Add a note for yourself..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-16 text-sm"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={() => handleSubmit()}
            disabled={!selectedDate || loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            {selectedDate
              ? `Remind me on ${format(selectedDate, 'MMM d, yyyy')}`
              : 'Select a date'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
