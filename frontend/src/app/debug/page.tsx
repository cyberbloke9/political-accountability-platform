'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [connectionTest, setConnectionTest] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error'
    message?: string
    error?: string
  }>({ status: 'idle' })

  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  }

  const getStatus = (value: string | undefined) => {
    if (!value) return { status: 'missing', color: 'text-destructive', icon: XCircle }
    if (value.includes('placeholder')) return { status: 'placeholder', color: 'text-warning', icon: XCircle }
    return { status: 'configured', color: 'text-success', icon: CheckCircle2 }
  }

  const testSupabaseConnection = async () => {
    setConnectionTest({ status: 'testing' })
    try {
      // Try to fetch from a public table
      const { data, error } = await supabase.from('users').select('count').limit(1)

      if (error) {
        setConnectionTest({
          status: 'error',
          message: 'Connection failed',
          error: error.message,
        })
      } else {
        setConnectionTest({
          status: 'success',
          message: `Successfully connected to Supabase! Found ${data?.length || 0} records.`,
        })
      }
    } catch (err) {
      const error = err as Error
      setConnectionTest({
        status: 'error',
        message: 'Unexpected error',
        error: error.message || String(err),
      })
    }
  }

  return (
    <div className="container py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Environment Variables Debug</h1>

      <Alert className="mb-8">
        <AlertDescription>
          This page shows the actual environment variables loaded in your browser and tests the Supabase connection.
        </AlertDescription>
      </Alert>

      <div className="space-y-4 mb-8">
        {Object.entries(envVars).map(([key, value]) => {
          const { status, color, icon: Icon } = getStatus(value)
          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={'h-5 w-5 ' + color} />
                  {key}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Status:</span>
                    <span className={color}>{status}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Value:</span>
                    <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-x-auto">
                      {value || 'MISSING'}
                    </pre>
                  </div>
                  {value && (
                    <div>
                      <span className="font-semibold">Length:</span> {value.length} characters
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the button below to test if your app can actually connect to Supabase.
          </p>

          <Button
            onClick={testSupabaseConnection}
            disabled={connectionTest.status === 'testing'}
            className="w-full"
          >
            {connectionTest.status === 'testing' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {connectionTest.status === 'testing' ? 'Testing...' : 'Test Connection'}
          </Button>

          {connectionTest.status === 'success' && (
            <Alert className="border-success">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                {connectionTest.message}
              </AlertDescription>
            </Alert>
          )}

          {connectionTest.status === 'error' && (
            <Alert className="border-destructive">
              <XCircle className="h-4 w-4 text-destructive" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold text-destructive">{connectionTest.message}</div>
                  <div className="text-sm">{connectionTest.error}</div>
                  <div className="text-xs mt-2">Check the browser console for more details.</div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Expected Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> Should start with https:// and end with .supabase.co
          </div>
          <div>
            <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> Should be a long JWT token (starts with eyJ)
          </div>
          <div>
            <strong>NEXT_PUBLIC_APP_URL:</strong> Your Vercel deployment URL
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
