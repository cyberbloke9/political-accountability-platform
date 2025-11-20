'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function DebugPage() {
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

  return (
    <div className="container py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Environment Variables Debug</h1>

      <Alert className="mb-8">
        <AlertDescription>
          This page shows the actual environment variables loaded in your browser.
          If any are missing or show placeholder values, the deployment needs to be rebuilt.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
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

      <Card className="mt-8 border-primary">
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

      <Alert className="mt-8 border-warning">
        <AlertDescription>
          <strong>If values are missing or incorrect:</strong>
          <ol className="list-decimal ml-6 mt-2 space-y-1">
            <li>Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
            <li>Verify all three variables are set correctly</li>
            <li>Go to Deployments tab</li>
            <li>Click the three dots on the latest deployment</li>
            <li>Select Redeploy</li>
            <li>UNCHECK Use existing Build Cache</li>
            <li>Click Redeploy</li>
            <li>Wait for deployment to complete, then refresh this page</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  )
}
