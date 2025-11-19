'use client'

import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle2 } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success mb-2">
              <Mail className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-center">
              We have sent you a verification link
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Please check your email inbox and click the verification link to activate your account.
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">
                Account created successfully
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Link href="/auth/login" className="w-full">
              <Button variant="outline" className="w-full">
                Go to Login
              </Button>
            </Link>
            
            <p className="text-xs text-center text-muted-foreground">
              Didn&apos;t receive the email? Check your spam folder or contact support.
            </p>
          </CardFooter>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
