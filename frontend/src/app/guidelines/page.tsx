import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Shield, Ban, Volume2 } from 'lucide-react'

export default function GuidelinesPage() {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1'>
        <section className='bg-gradient-to-b from-primary/5 to-background py-16'>
          <div className='container px-4 max-w-5xl'>
            <div className='text-center space-y-4'>
              <Badge className='text-sm px-4 py-1'>Version 1.0 - January 2025</Badge>
              <h1 className='text-4xl md:text-5xl font-bold tracking-tight'>Community Guidelines</h1>
              <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
                Fair, transparent, non-partisan rules for political accountability
              </p>
            </div>
          </div>
        </section>

        <section className='py-16'>
          <div className='container px-4 max-w-5xl space-y-12'>
            {/* Introduction */}
            <Card className='border-primary/20'>
              <CardContent className='pt-6'>
                <div className='flex items-start gap-4'>
                  <Shield className='h-8 w-8 text-primary mt-1 flex-shrink-0' />
                  <div>
                    <h2 className='text-2xl font-bold mb-3'>Why These Guidelines Exist</h2>
                    <p className='text-muted-foreground mb-3'>
                      This platform tracks political promises objectively, regardless of party. We are not aligned with any political party, ideology, or candidate.
                    </p>
                    <p className='text-muted-foreground'>
                      These guidelines prevent manipulation by political parties, coordinated campaigns, or automated systems.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Policy */}
            <div>
              <h2 className='text-3xl font-bold mb-6 flex items-center gap-3'>
                <AlertTriangle className='h-8 w-8 text-destructive' />
                AI-Generated Content Policy
              </h2>
              <Card className='border-destructive/50 bg-destructive/5'>
                <CardContent className='pt-6'>
                  <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-6'>
                    <h3 className='font-bold text-xl mb-3 text-destructive'>ZERO TOLERANCE - IMMEDIATE BAN</h3>
                    <p className='text-muted-foreground mb-4'>
                      Using AI to generate promises, verifications, or evidence results in:
                    </p>
                    <ul className='space-y-2 text-muted-foreground'>
                      <li className='flex gap-2'><Ban className='h-5 w-5 text-destructive mt-0.5' /><span><strong>Immediate permanent ban</strong></span></li>
                      <li className='flex gap-2'><Ban className='h-5 w-5 text-destructive mt-0.5' /><span><strong>All content deleted</strong></span></li>
                      <li className='flex gap-2'><Ban className='h-5 w-5 text-destructive mt-0.5' /><span><strong>IP and device ban</strong></span></li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vote Wars */}
            <div>
              <h2 className='text-3xl font-bold mb-6'>Vote Wars Prevention</h2>
              <Card className='border-destructive/30'>
                <CardContent className='pt-6 space-y-4'>
                  <div>
                    <h3 className='font-semibold text-lg mb-3 flex items-center gap-2'>
                      <AlertTriangle className='h-5 w-5 text-destructive' />
                      The Problem
                    </h3>
                    <p className='text-muted-foreground'>
                      Party supporters may systematically downvote content showing their party negatively, regardless of evidence quality.
                    </p>
                  </div>
                  <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-4'>
                    <h3 className='font-semibold mb-2 text-destructive'>Consequences:</h3>
                    <ul className='text-sm text-muted-foreground space-y-1'>
                      <li><strong>First:</strong> 30-day voting ban, reputation reset</li>
                      <li><strong>Second:</strong> 90-day account suspension</li>
                      <li><strong>Third:</strong> Permanent ban</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Accessibility */}
            <div>
              <h2 className='text-3xl font-bold mb-6'>Accessibility for All</h2>
              <Card>
                <CardContent className='pt-6'>
                  <div className='flex items-start gap-4'>
                    <Volume2 className='h-6 w-6 text-primary mt-1' />
                    <div>
                      <h3 className='font-semibold text-lg mb-3'>Support for Non-Literate Users</h3>
                      <ul className='list-disc list-inside text-muted-foreground space-y-2 ml-4'>
                        <li>Voice narration (coming soon)</li>
                        <li>Simple Hindi and regional languages</li>
                        <li>Visual evidence prioritized</li>
                        <li>Icon-based navigation</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Final Message */}
            <Card className='border-primary/20 bg-primary/5'>
              <CardContent className='pt-6'>
                <h3 className='font-bold text-xl mb-3'>We Are All on the Same Side</h3>
                <p className='text-muted-foreground mb-3'>
                  Regardless of party support, we all want accountable leaders who keep promises.
                </p>
                <p className='text-muted-foreground'>
                  By following these guidelines, you help build a platform serving every Indian citizen.
                </p>
              </CardContent>
            </Card>

            <div className='text-center pt-8 border-t'>
              <p className='text-sm text-muted-foreground mb-2'>Questions?</p>
              <p className='text-sm'>
                <a href='mailto:papsupport@gmail.com' className='text-primary hover:underline'>papsupport@gmail.com</a>
                {' | '}
                <a href='tel:+919959311144' className='text-primary hover:underline'>+91 9959311144</a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}