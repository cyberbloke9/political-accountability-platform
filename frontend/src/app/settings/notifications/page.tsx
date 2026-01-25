'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import {
  getNotificationSettings,
  updateNotificationSettings,
  NotificationSettings
} from '@/lib/notifications'
import { toast } from 'sonner'
import {
  Bell,
  Mail,
  Smartphone,
  ArrowLeft,
  Loader2,
  Save,
  RefreshCw,
  FileText,
  MessageSquare,
  AtSign,
  Clock
} from 'lucide-react'
import Link from 'next/link'

const DEFAULT_SETTINGS: NotificationSettings = {
  in_app_enabled: true,
  in_app_promise_updates: true,
  in_app_verification_updates: true,
  in_app_new_promises: true,
  in_app_discussion_replies: true,
  in_app_mentions: true,
  email_enabled: false,
  email_address: null,
  email_verified: false,
  email_frequency: 'daily',
  email_promise_updates: true,
  email_verification_updates: true,
  email_new_promises: false,
  email_weekly_digest: true,
  quiet_hours_enabled: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
  timezone: 'Asia/Kolkata'
}

export default function NotificationSettingsPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/settings/notifications')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings()
    }
  }, [isAuthenticated])

  const loadSettings = async () => {
    setLoading(true)
    const data = await getNotificationSettings()
    if (data) {
      setSettings(data)
    }
    setLoading(false)
  }

  const handleChange = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const { success } = await updateNotificationSettings(settings)
    setSaving(false)

    if (success) {
      toast.success('Settings saved successfully')
      setHasChanges(false)
    } else {
      toast.error('Failed to save settings')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-4 sm:py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/notifications">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Bell className="h-6 w-6" />
                  Notification Settings
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage how you receive notifications
                </p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>

          {/* In-App Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                In-App Notifications
              </CardTitle>
              <CardDescription>
                Notifications you see within the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="in_app_enabled">Enable In-App Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show notifications in the bell icon
                  </p>
                </div>
                <Switch
                  id="in_app_enabled"
                  checked={settings.in_app_enabled}
                  onCheckedChange={(v) => handleChange('in_app_enabled', v)}
                />
              </div>

              {settings.in_app_enabled && (
                <>
                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Notification Types</h4>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                        <Label htmlFor="in_app_promise_updates">Promise Status Updates</Label>
                      </div>
                      <Switch
                        id="in_app_promise_updates"
                        checked={settings.in_app_promise_updates}
                        onCheckedChange={(v) => handleChange('in_app_promise_updates', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-green-500" />
                        <Label htmlFor="in_app_verification_updates">New Verifications</Label>
                      </div>
                      <Switch
                        id="in_app_verification_updates"
                        checked={settings.in_app_verification_updates}
                        onCheckedChange={(v) => handleChange('in_app_verification_updates', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="h-4 w-4 text-purple-500" />
                        <Label htmlFor="in_app_new_promises">New Promises from Followed Politicians</Label>
                      </div>
                      <Switch
                        id="in_app_new_promises"
                        checked={settings.in_app_new_promises}
                        onCheckedChange={(v) => handleChange('in_app_new_promises', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-4 w-4 text-orange-500" />
                        <Label htmlFor="in_app_discussion_replies">Discussion Replies</Label>
                      </div>
                      <Switch
                        id="in_app_discussion_replies"
                        checked={settings.in_app_discussion_replies}
                        onCheckedChange={(v) => handleChange('in_app_discussion_replies', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AtSign className="h-4 w-4 text-blue-500" />
                        <Label htmlFor="in_app_mentions">Mentions</Label>
                      </div>
                      <Switch
                        id="in_app_mentions"
                        checked={settings.in_app_mentions}
                        onCheckedChange={(v) => handleChange('in_app_mentions', v)}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Receive updates via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email_enabled">Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    {user?.email || 'No email configured'}
                  </p>
                </div>
                <Switch
                  id="email_enabled"
                  checked={settings.email_enabled}
                  onCheckedChange={(v) => handleChange('email_enabled', v)}
                />
              </div>

              {settings.email_enabled && (
                <>
                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email_frequency">Email Frequency</Label>
                      <Select
                        value={settings.email_frequency}
                        onValueChange={(v) => handleChange('email_frequency', v as NotificationSettings['email_frequency'])}
                      >
                        <SelectTrigger id="email_frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instant">Instant</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Digest</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <h4 className="text-sm font-medium">Email Types</h4>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="email_promise_updates">Promise Status Updates</Label>
                      <Switch
                        id="email_promise_updates"
                        checked={settings.email_promise_updates}
                        onCheckedChange={(v) => handleChange('email_promise_updates', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="email_verification_updates">Verification Updates</Label>
                      <Switch
                        id="email_verification_updates"
                        checked={settings.email_verification_updates}
                        onCheckedChange={(v) => handleChange('email_verification_updates', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="email_new_promises">New Promises</Label>
                      <Switch
                        id="email_new_promises"
                        checked={settings.email_new_promises}
                        onCheckedChange={(v) => handleChange('email_new_promises', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="email_weekly_digest">Weekly Summary Digest</Label>
                      <Switch
                        id="email_weekly_digest"
                        checked={settings.email_weekly_digest}
                        onCheckedChange={(v) => handleChange('email_weekly_digest', v)}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quiet Hours
              </CardTitle>
              <CardDescription>
                Pause notifications during specific hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="quiet_hours_enabled">Enable Quiet Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    No notifications during specified times
                  </p>
                </div>
                <Switch
                  id="quiet_hours_enabled"
                  checked={settings.quiet_hours_enabled}
                  onCheckedChange={(v) => handleChange('quiet_hours_enabled', v)}
                />
              </div>

              {settings.quiet_hours_enabled && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quiet_hours_start">Start Time</Label>
                      <Select
                        value={settings.quiet_hours_start || '22:00'}
                        onValueChange={(v) => handleChange('quiet_hours_start', v)}
                      >
                        <SelectTrigger id="quiet_hours_start">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0')
                            return (
                              <SelectItem key={hour} value={`${hour}:00`}>
                                {hour}:00
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quiet_hours_end">End Time</Label>
                      <Select
                        value={settings.quiet_hours_end || '08:00'}
                        onValueChange={(v) => handleChange('quiet_hours_end', v)}
                      >
                        <SelectTrigger id="quiet_hours_end">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0')
                            return (
                              <SelectItem key={hour} value={`${hour}:00`}>
                                {hour}:00
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Save Button (Mobile) */}
          <div className="sm:hidden">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
