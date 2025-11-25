'use client'

import { useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-16 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="bg-red-100 p-6 rounded-full">
              <AlertTriangle className="h-16 w-16 text-red-600" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Something Went Wrong
            </h1>
            <p className="text-xl text-muted-foreground">
              We're sorry, but something unexpected happened. Our team has been notified and we're working on a fix.
            </p>
          </div>

          {/* Error Details (for development) */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="text-left">
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-2">Error Details:</p>
                <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                  {error.message}
                </pre>
                {error.digest && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button asChild variant="outline">
              <Link href="/" className="gap-2">
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              If this problem persists, please contact our support team or try again later.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
