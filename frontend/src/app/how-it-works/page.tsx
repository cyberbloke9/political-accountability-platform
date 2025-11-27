import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Search,
  Upload,
  Vote,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Users,
  Trophy,
  Lock
} from 'lucide-react'

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
      description: 'Everyone starts with 100 base points. Quality contributions earn you additional citizen score points. Build your reputation by submitting accurate promises and evidence.',
      actions: ['Start with 100 base points', 'Submit verified content', 'Get community approval', 'Climb the leaderboard']
    },
    {
      number: 6,
      icon: CheckCircle,
      title: 'Track Accountability',
      description: 'Watch as promises are fulfilled, broken, or stalled. Hold leaders accountable through transparent, community-verified data.',
      actions: ['Monitor promise status', 'Share on social media', 'Demand accountability']
    }
  ]

  const trustLevels = [
    {
      level: 'Untrusted',
      icon: ShieldAlert,
      weight: '0.5x',
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
      description: 'New users (< 7 days, < 100 score)',
      requirements: '100+ score, 7+ days, < 50% rejection rate'
    },
    {
      level: 'Community',
      icon: Users,
      weight: '1.0x',
      color: 'text-gray-600',
      bgColor: 'bg-gray-500/10',
      description: 'Regular contributors',
      requirements: '500+ score, 10+ approved, 30+ days, < 20% rejection'
    },
    {
      level: 'Trusted',
      icon: Shield,
      weight: '2.0x',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      description: 'High-quality contributors',
      requirements: 'Earned through consistent quality submissions'
    },
    {
      level: 'Admin',
      icon: Trophy,
      weight: '3.0x',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      description: 'Platform moderators',
      requirements: 'Manually assigned by platform team'
    }
  ]

  const antiGamingFeatures = [
    {
      icon: ShieldAlert,
      title: 'Self-Verification Detection',
      description: 'Automatic flagging when users verify their own promises',
      penalty: '0.1x point multiplier (90% reduction)'
    },
    {
      icon: Users,
      title: 'Vote Brigade Detection',
      description: 'Identifies coordinated voting groups through pattern analysis',
      penalty: 'Account flagging and admin review'
    },
    {
      icon: AlertTriangle,
      title: 'Sybil Attack Prevention',
      description: 'Detects suspicious voting patterns and rapid submissions',
      penalty: 'Automatic flagging with severity levels'
    },
    {
      icon: Lock,
      title: 'Weighted Trust System',
      description: 'Higher trust levels have more influence on platform decisions',
      penalty: 'New users have limited impact (0.5x weight)'
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
                A simple, transparent process for tracking political accountability with advanced anti-gaming protections
              </p>
            </div>
          </div>
        </section>

        {/* Main Workflow Steps */}
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

        {/* Trust Level System */}
        <section className='border-t bg-gradient-to-b from-blue-50/30 to-background py-16'>
          <div className='container px-4 max-w-5xl'>
            <div className='text-center mb-12'>
              <Badge className='mb-4'>Trust & Reputation</Badge>
              <h2 className='text-3xl font-bold mb-4'>Trust Level System</h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                Build your reputation through quality contributions. Higher trust levels give your verifications more weight.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {trustLevels.map((level, index) => {
                const Icon = level.icon
                return (
                  <Card key={index} className='border-2'>
                    <CardHeader>
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                          <div className={`p-2 rounded-lg ${level.bgColor}`}>
                            <Icon className={`h-5 w-5 ${level.color}`} />
                          </div>
                          <CardTitle className='text-xl'>{level.level}</CardTitle>
                        </div>
                        <Badge variant='outline' className='font-bold'>{level.weight}</Badge>
                      </div>
                      <CardDescription>{level.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='text-sm text-muted-foreground'>
                        <span className='font-semibold'>Requirements:</span> {level.requirements}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className='mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex items-start gap-3'>
                <TrendingUp className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
                <div>
                  <h4 className='font-semibold text-blue-900 mb-1'>How Weighted Scoring Works</h4>
                  <p className='text-sm text-blue-800 mb-2'>
                    All users start with 100 base points when they join the platform. When you submit a verification, your earned points are multiplied by your trust level weight.
                    A Trusted user (2.0x) earns +20 points for approved verifications, while an Untrusted user (0.5x) earns only +5 points.
                    This incentivizes quality over quantity and prevents spam.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Anti-Gaming Features */}
        <section className='border-t bg-gradient-to-b from-red-50/20 to-background py-16'>
          <div className='container px-4 max-w-5xl'>
            <div className='text-center mb-12'>
              <Badge className='mb-4' variant='destructive'>Security</Badge>
              <h2 className='text-3xl font-bold mb-4'>Anti-Gaming Protection</h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                Advanced systems prevent manipulation, vote brigades, and fraudulent activity to ensure platform integrity.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {antiGamingFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card key={index} className='border-red-200/50'>
                    <CardHeader>
                      <div className='flex items-start gap-3'>
                        <div className='p-2 rounded-lg bg-red-500/10'>
                          <Icon className='h-5 w-5 text-red-600' />
                        </div>
                        <div>
                          <CardTitle className='text-lg mb-1'>{feature.title}</CardTitle>
                          <CardDescription>{feature.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className='flex items-center gap-2 text-sm'>
                        <AlertTriangle className='h-4 w-4 text-red-600' />
                        <span className='text-red-700 font-medium'>{feature.penalty}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className='mt-8 grid md:grid-cols-3 gap-4'>
              <div className='p-4 bg-card border rounded-lg text-center'>
                <div className='text-2xl font-bold text-primary mb-1'>0.1x</div>
                <div className='text-sm text-muted-foreground'>Self-verification penalty</div>
              </div>
              <div className='p-4 bg-card border rounded-lg text-center'>
                <div className='text-2xl font-bold text-primary mb-1'>80%</div>
                <div className='text-sm text-muted-foreground'>Correlation threshold for brigades</div>
              </div>
              <div className='p-4 bg-card border rounded-lg text-center'>
                <div className='text-2xl font-bold text-primary mb-1'>Real-time</div>
                <div className='text-sm text-muted-foreground'>Suspicious activity monitoring</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why This Matters */}
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
                    All promises, verifications, and votes are publicly visible. Admin actions are logged in public transparency log. No hidden agendas.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community-Driven</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground'>
                    Citizens like you verify claims and vote on evidence. Advanced anti-gaming systems ensure quality over quantity. Power to the people.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Accountability</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground'>
                    Create a permanent, searchable record of political commitments and outcomes. Cryptographic hashes prevent tampering.
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
