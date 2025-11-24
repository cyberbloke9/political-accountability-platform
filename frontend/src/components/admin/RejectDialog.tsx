'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2 } from 'lucide-react'

interface RejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  loading?: boolean
}

export function RejectDialog({ open, onOpenChange, onConfirm, loading = false }: RejectDialogProps) {
  const [reason, setReason] = useState('')
  const minLength = 10
  const maxLength = 500
  const isValid = reason.trim().length >= minLength

  const handleConfirm = () => {
    if (isValid && !loading) {
      onConfirm(reason.trim())
      setReason('')
    }
  }

  const handleCancel = () => {
    if (!loading) {
      setReason('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Reject Verification
          </DialogTitle>
          <DialogDescription>
            Please provide a detailed reason for rejecting this verification. The submitter will receive this feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Rejection Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why this verification is being rejected (e.g., insufficient evidence, misleading information, duplicate submission...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              rows={5}
              maxLength={maxLength}
              className="resize-none"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {reason.length < minLength ? (
                  <span className="text-red-500">
                    Minimum {minLength} characters required
                  </span>
                ) : (
                  <span className="text-green-600">Valid reason provided</span>
                )}
              </span>
              <span>
                {reason.length}/{maxLength}
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> The user will lose 15 reputation points and receive a notification with this reason. Make sure your feedback is constructive and helps them improve future submissions.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              'Confirm Rejection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
