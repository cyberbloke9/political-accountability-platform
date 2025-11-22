import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Search, Upload, Vote, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react'

export default function HowItWorksPage() {
  const steps = [
    {
      number: 1,
      icon: Search,
      title: 'Discover Promises',
      description: 'Browse political promises made by leaders across India. Search by politician, party, category, or constituency.',
      actions: ['View all promises', 'Filter by status', 'Search by keyword']
    },
    {
      number: 2,
      icon: FileText,
      title: 'Submit a Promise',
      description: 'Found a promise that is not yet tracked? Add it to the platform with credible sources and documentation.',
      actions: ['Provide exact quote', 'Add date and context', 'Include credible sources']
    },
    {
      number: 3,
      icon: Upload,
      title: 'Verify Progress',
      description: 'Have evidence about a promise? Submit a verification with supporting documents, news articles, or official reports.',
      actions: ['Upload evidence', 'Mark as fulfilled/broken/in progress', 'Provide credible sources']
    },
    {
      number: 4,
      icon: Vote,
      title: 'Community Voting',
      description: 'The community reviews verifications and votes on their accuracy. High-quality evidence gets upvoted.',
      actions: ['Review verifications', 'Upvote accurate evidence', 'Downvote misleading claims']
    },
    {
      number: 5,
      icon: TrendingUp,
      title: 'Earn Reputation',
      description: 'Quality contributions earn you citizen score points. Build your reputation by submitting accurate promises and evidence.',
      actions: ['Submit verified content', 'Get community approval', 'Climb the leaderboard']
    },
    {
      number: 6,
      icon: CheckCircle,
      title: 'Track Accountability',
      description: 'Watch as promises are fulfilled, broken, or stalled. Hold leaders accountable through transparent, community-verified data.',
      actions: ['Monitor promise status', 'Share on social media', 'Demand accountability']
    }
  ]

  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1'>
        <section className='bg-gradient-to-b from-primary/5 to-background py-16'>
          <div className='container px-4 max-w-5xl'>
            <div className='text-center space-y-4'>
              <Badge className='text-sm px-4 py-1'>Platform Workflow</Badge>
              <h1 className='text-4xl md:text-5xl font-bold tracking-tight'>How It Works</h1>
              <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
                A simple, transparent process for tracking political accountability
              </p>
            </div>
          </div>
        </section>

        <section className='py-16'>
          <div className='container px-4 max-w-5xl'>
            <div className='space-y-8'>
              {steps.map((step, index) => {
                const Icon = step.icon
                const isLast = index === steps.length - 1
                
                return (
                  <div key={step.number} className='relative'>
                    <div className='flex gap-6 items-start'>
                      <div className='flex flex-col items-center flex-shrink-0'>
                        <div className='flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg'>
                          {step.number}
                        </div>
                        {!isLast && (
                          <div className='w-0.5 h-20 bg-border mt-4' />
                        )}
                      </div>

                      <Card className='flex-1'>
                        <CardHeader>
                          <div className='flex items-center gap-3 mb-2'>
                            <Icon className='h-6 w-6 text-primary' />
                            <CardTitle className='text-2xl'>{step.title}</CardTitle>
                          </div>
                          <CardDescription className='text-base'>{step.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className='space-y-2'>
                            <p className='text-sm font-semibold text-muted-foreground'>Key Actions:</p>
                            <ul className='space-y-1'>
                              {step.actions.map((action, i) => (
                                <li key={i} className='flex items-center gap-2 text-sm text-muted-foreground'>
                                  <ArrowRight className='h-3 w-3 text-primary' />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className='border-t bg-muted/30 py-16'>
          <div className='container px-4 max-w-5xl'>
            <div className='text-center mb-12'>
              <h2 className='text-3xl font-bold mb-4'>Why This Matters</h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                Political promises shape our lives, but tracking their fulfillment is difficult. 
                This platform makes it easy for citizens to hold leaders accountable.
              </p>
            </div>

            <div className='grid md:grid-cols-3 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Transparency</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground'>
                    All promises, verifications, and votes are publicly visible. No hidden agendas.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community-Driven</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground'>
                    Citizens like you verify claims and vote on evidence. Power to the people.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Accountability</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground'>
                    Create a permanent, searchable record of political commitments and outcomes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}