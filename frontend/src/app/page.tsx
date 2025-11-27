'use client'

import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ShieldCheck, Users, TrendingUp, CheckCircle2, Shield, Eye } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth()

  const features = [
    {
      icon: ShieldCheck,
      title: 'Track Promises',
      description: 'Monitor political promises from announcement to completion'
    },
    {
      icon: Users,
      title: 'Community Verification',
      description: 'Crowdsourced evidence collection with fraud detection'
    },
    {
      icon: TrendingUp,
      title: 'Leaderboard System',
      description: 'Gamified citizen engagement with reputation tracking'
    },
  ]

  const values = [
    {
      icon: Shield,
      title: 'Accountability',
      description: 'Hold political leaders accountable through transparent tracking'
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'All verifications and votes are publicly visible and auditable'
    },
    {
      icon: CheckCircle2,
      title: 'Trust',
      description: 'Built on community consensus and verified evidence'
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-24 md:py-32">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Political Accountability
                <span className="block text-primary mt-2">Through Transparency</span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Track political promises with community verification and transparent accountability. 
                Empower citizens to hold leaders responsible.
              </p>
            </div>
            
            <div className="flex flex-col gap-4 sm:flex-row">
              {!loading && !isAuthenticated && (
                <Link href="/auth/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
              )}
              <Link href="/promises">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Browse Promises
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container">
            <div className="mx-auto max-w-5xl">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  How It Works
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  A community-driven platform for tracking and verifying political promises
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {features.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <Card key={feature.title} className="border-2">
                      <CardHeader>
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle>{feature.title}</CardTitle>
                        <CardDescription className="text-base">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-24">
          <div className="container">
            <div className="mx-auto max-w-5xl">
              <div className="text-center space-y-4 mb-16">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Built on Core Values
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  Transparency and accountability drive everything we do
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {values.map((value) => {
                  const Icon = value.icon
                  return (
                    <div key={value.title} className="flex flex-col items-center text-center space-y-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-semibold">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!loading && !isAuthenticated && (
          <section className="border-t bg-primary py-16">
            <div className="container">
              <div className="mx-auto max-w-3xl text-center space-y-6">
                <h2 className="text-3xl font-bold tracking-tighter text-primary-foreground sm:text-4xl">
                  Ready to Make a Difference?
                </h2>
                <p className="text-lg text-primary-foreground/90">
                  Join our community of engaged citizens working toward greater political accountability
                </p>
                <Link href="/auth/signup">
                  <Button size="lg" variant="secondary" className="mt-4">
                    Create Your Account
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
