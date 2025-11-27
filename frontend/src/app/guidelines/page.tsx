import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Shield, Ban, Users, Target, CheckCircle2, Scale } from 'lucide-react'

export default function GuidelinesPage() {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1'>
        <section className='bg-gradient-to-b from-primary/5 to-background py-16'>
          <div className='container px-4 max-w-5xl'>
            <div className='text-center space-y-4'>
              <Badge className='text-sm px-4 py-1'>Version 1.0 - November 2025</Badge>
              <h1 className='text-4xl md:text-5xl font-bold tracking-tight'>Community Guidelines</h1>
              <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
                Fair, transparent, non-partisan rules for political accountability
              </p>
            </div>
          </div>
        </section>

        <section className='py-16'>
          <div className='container px-4 max-w-5xl space-y-12'>
            <Card className='border-primary/20'>
              <CardContent className='pt-6'>
                <div className='flex items-start gap-4'>
                  <Shield className='h-8 w-8 text-primary mt-1 flex-shrink-0' />
                  <div>
                    <h2 className='text-2xl font-bold mb-3'>Our Core Principles</h2>
                    <p className='text-muted-foreground mb-3'>
                      This platform tracks political promises objectively, regardless of party. We are not aligned with any political party, ideology, or candidate.
                    </p>
                    <p className='text-muted-foreground'>
                      These guidelines prevent manipulation by political parties, coordinated campaigns, automated systems, and ensure the platform serves all Indian citizens equally.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className='text-3xl font-bold mb-6 flex items-center gap-3'>
                <AlertTriangle className='h-8 w-8 text-destructive' />
                Zero Tolerance Violations
              </h2>
              <div className='space-y-4'>
                <Card className='border-destructive/50 bg-destructive/5'>
                  <CardContent className='pt-6'>
                    <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-6'>
                      <h3 className='font-bold text-xl mb-3 text-destructive'>AI-Generated Content - IMMEDIATE BAN</h3>
                      <p className='text-muted-foreground mb-4'>
                        Using AI (ChatGPT, Claude, Gemini, etc.) to generate promises, verifications, or evidence results in:
                      </p>
                      <ul className='space-y-2 text-muted-foreground'>
                        <li className='flex gap-2'><Ban className='h-5 w-5 text-destructive mt-0.5 flex-shrink-0' /><span><strong>Immediate permanent ban</strong> - no warnings, no appeals</span></li>
                        <li className='flex gap-2'><Ban className='h-5 w-5 text-destructive mt-0.5 flex-shrink-0' /><span><strong>All content deleted</strong> - every promise and verification removed</span></li>
                        <li className='flex gap-2'><Ban className='h-5 w-5 text-destructive mt-0.5 flex-shrink-0' /><span><strong>IP and device ban</strong> - cannot create new accounts</span></li>
                      </ul>
                      <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded'>
                        <p className='text-sm text-yellow-900'>
                          <strong>Why:</strong> AI-generated content undermines platform integrity. All submissions must be human-written with genuine research and credible sources.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className='border-destructive/30'>
                  <CardContent className='pt-6'>
                    <h3 className='font-bold text-xl mb-3 flex items-center gap-2'>
                      <Ban className='h-6 w-6 text-destructive' />
                      Fake Accounts & Sock Puppets
                    </h3>
                    <p className='text-muted-foreground mb-3'>
                      Creating multiple accounts to manipulate votes, bypass bans, or artificially inflate reputation.
                    </p>
                    <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-4'>
                      <p className='text-sm text-destructive font-semibold'>Penalty: Permanent ban on all accounts, IP ban, reputation reset</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h2 className='text-3xl font-bold mb-6 flex items-center gap-3'>
                <Users className='h-8 w-8 text-orange-600' />
                Vote Brigading & Coordinated Manipulation
              </h2>
              <Card className='border-destructive/30'>
                <CardContent className='pt-6 space-y-4'>
                  <div>
                    <h3 className='font-semibold text-lg mb-3 flex items-center gap-2'>
                      <AlertTriangle className='h-5 w-5 text-destructive' />
                      What is Vote Brigading?
                    </h3>
                    <p className='text-muted-foreground mb-3'>
                      Organizing groups (WhatsApp, Telegram, Discord) to systematically upvote or downvote content based on political affiliation rather than evidence quality.
                    </p>
                    <ul className='text-sm text-muted-foreground space-y-1 ml-6'>
                      <li className='list-disc'>Coordinating with others to vote on specific verifications</li>
                      <li className='list-disc'>Downvoting all content critical of your preferred party</li>
                      <li className='list-disc'>Upvoting all content favorable to your party, regardless of evidence</li>
                      <li className='list-disc'>Following voting instructions from external groups or influencers</li>
                    </ul>
                  </div>
                  <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                    <h3 className='font-semibold mb-2 text-orange-900'>Detection:</h3>
                    <p className='text-sm text-muted-foreground mb-2'>
                      Our system tracks voting patterns and identifies coordinated behavior through:
                    </p>
                    <ul className='text-sm text-muted-foreground space-y-1 ml-6'>
                      <li className='list-disc'>Correlation analysis (80%+ voting similarity)</li>
                      <li className='list-disc'>Velocity detection (10+ votes in 5 minutes)</li>
                      <li className='list-disc'>Brigade pattern recognition (groups voting together)</li>
                      <li className='list-disc'>Real-time suspicious activity monitoring</li>
                    </ul>
                  </div>
                  <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-4'>
                    <h3 className='font-semibold mb-2 text-destructive'>Consequences:</h3>
                    <ul className='text-sm text-muted-foreground space-y-1'>
                      <li><strong>First Offense:</strong> 30-day voting ban, reputation penalty, public warning</li>
                      <li><strong>Second Offense:</strong> 90-day account suspension, all votes removed, reputation reset</li>
                      <li><strong>Third Offense:</strong> Permanent ban, IP ban, all content deleted</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className='text-3xl font-bold mb-6 flex items-center gap-3'>
                <Scale className='h-8 w-8 text-blue-600' />
                Trust Level System & Self-Verification
              </h2>
              <div className='space-y-4'>
                <Card>
                  <CardContent className='pt-6 space-y-3'>
                    <p className='text-muted-foreground mb-3'>
                      All users are automatically assigned a trust level that determines the weight of their contributions:
                    </p>
                    <div className='space-y-2'>
                      <div className='p-3 border rounded-lg bg-orange-50/50'>
                        <strong className='text-orange-800'>Untrusted (0.5x weight):</strong>
                        <span className='text-muted-foreground ml-2'>New users (&lt; 7 days, &lt; 100 score)</span>
                      </div>
                      <div className='p-3 border rounded-lg bg-gray-50/50'>
                        <strong className='text-gray-800'>Community (1.0x weight):</strong>
                        <span className='text-muted-foreground ml-2'>Regular contributors (100+ score, 7+ days)</span>
                      </div>
                      <div className='p-3 border rounded-lg bg-blue-50/50'>
                        <strong className='text-blue-800'>Trusted (2.0x weight):</strong>
                        <span className='text-muted-foreground ml-2'>High-quality contributors (500+ score, proven track record)</span>
                      </div>
                      <div className='p-3 border rounded-lg bg-purple-50/50'>
                        <strong className='text-purple-800'>Admin (3.0x weight):</strong>
                        <span className='text-muted-foreground ml-2'>Platform moderators (manually assigned)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className='border-orange-200'>
                  <CardContent className='pt-6'>
                    <h3 className='font-bold text-lg mb-3 text-orange-900'>Self-Verification Penalty</h3>
                    <p className='text-muted-foreground mb-3'>
                      If you submit a promise and then verify it yourself, you receive:
                    </p>
                    <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                      <p className='text-sm text-orange-900'><strong>0.1x weight penalty</strong> - Your verification points are reduced by 90%</p>
                      <p className='text-sm text-muted-foreground mt-2'>This is automatically detected and applied. While not banned, it heavily discourages gaming the system.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h2 className='text-3xl font-bold mb-6 flex items-center gap-3'>
                <Target className='h-8 w-8 text-primary' />
                Quality Standards
              </h2>
              <Card>
                <CardContent className='pt-6 space-y-4'>
                  <div>
                    <h3 className='font-semibold mb-2'>Submitting Promises</h3>
                    <ul className='text-muted-foreground space-y-1 ml-6 text-sm'>
                      <li className='list-disc'>Provide exact quotes, not paraphrasing</li>
                      <li className='list-disc'>Include credible sources (news articles, official statements, videos)</li>
                      <li className='list-disc'>Add context: when, where, and to whom the promise was made</li>
                      <li className='list-disc'>Choose accurate categories (Healthcare, Education, Infrastructure, etc.)</li>
                      <li className='list-disc'>Avoid editorializing or adding personal opinions</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className='font-semibold mb-2'>Submitting Verifications</h3>
                    <ul className='text-muted-foreground space-y-1 ml-6 text-sm'>
                      <li className='list-disc'>Provide concrete evidence, not speculation</li>
                      <li className='list-disc'>Use multiple credible sources when possible</li>
                      <li className='list-disc'>Mark status accurately: fulfilled, broken, in progress, stalled</li>
                      <li className='list-disc'>Upload supporting documents, images, or official reports</li>
                      <li className='list-disc'>Write clear, factual explanations (minimum 100 characters)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className='font-semibold mb-2'>Voting on Verifications</h3>
                    <ul className='text-muted-foreground space-y-1 ml-6 text-sm'>
                      <li className='list-disc'>Vote based on evidence quality, not political preference</li>
                      <li className='list-disc'>Upvote well-sourced, factual verifications</li>
                      <li className='list-disc'>Downvote misleading, unsourced, or biased claims</li>
                      <li className='list-disc'>Do not vote on verifications you cannot verify independently</li>
                      <li className='list-disc'>Review sources before voting</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className='text-3xl font-bold mb-6 flex items-center gap-3'>
                <CheckCircle2 className='h-8 w-8 text-green-600' />
                Reputation & Gamification
              </h2>
              <Card>
                <CardContent className='pt-6 space-y-3'>
                  <p className='text-muted-foreground'>
                    <strong>Starting Points:</strong> All users begin with 100 base reputation points
                  </p>
                  <p className='text-muted-foreground'>
                    <strong>Earning Points:</strong> Quality contributions earn additional points based on your trust level weight
                  </p>
                  <p className='text-muted-foreground'>
                    <strong>Losing Points:</strong> Rejected verifications, policy violations, and downvoted content reduce your score
                  </p>
                  <p className='text-muted-foreground'>
                    <strong>Leaderboard:</strong> Top contributors are showcased publicly, incentivizing quality over quantity
                  </p>
                  <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                    <p className='text-sm text-blue-900'>
                      <strong>Important:</strong> Reputation manipulation through fake accounts, vote brigades, or coordinated campaigns will result in permanent bans.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className='text-3xl font-bold mb-6'>Prohibited Conduct</h2>
              <Card className='border-destructive/20'>
                <CardContent className='pt-6'>
                  <div className='grid md:grid-cols-2 gap-4'>
                    <div className='space-y-2 text-sm'>
                      <p className='font-semibold text-destructive'>Content Violations:</p>
                      <ul className='text-muted-foreground space-y-1 ml-4'>
                        <li className='list-disc'>Misinformation or fake news</li>
                        <li className='list-disc'>Manipulated images or documents</li>
                        <li className='list-disc'>Unsourced or fabricated claims</li>
                        <li className='list-disc'>Offensive or abusive language</li>
                        <li className='list-disc'>Personal attacks or doxxing</li>
                      </ul>
                    </div>
                    <div className='space-y-2 text-sm'>
                      <p className='font-semibold text-destructive'>Behavioral Violations:</p>
                      <ul className='text-muted-foreground space-y-1 ml-4'>
                        <li className='list-disc'>Harassment or bullying</li>
                        <li className='list-disc'>Spam or repeated submissions</li>
                        <li className='list-disc'>Impersonating others</li>
                        <li className='list-disc'>Circumventing bans</li>
                        <li className='list-disc'>Exploiting platform vulnerabilities</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className='border-primary/20 bg-primary/5'>
              <CardContent className='pt-6'>
                <h3 className='font-bold text-xl mb-3'>We Are All on the Same Side</h3>
                <p className='text-muted-foreground mb-3'>
                  Regardless of party support, we all want accountable leaders who keep promises. This platform serves every Indian citizen equally.
                </p>
                <p className='text-muted-foreground'>
                  By following these guidelines, you help build a platform that holds all political leaders to the same evidence-based standards.
                </p>
              </CardContent>
            </Card>

            <div className='text-center pt-8 border-t'>
              <p className='text-sm text-muted-foreground mb-2'>Questions or concerns?</p>
              <p className='text-sm'>
                <a href='mailto:support@political-accountability.in' className='text-primary hover:underline'>support@political-accountability.in</a>
                {' | '}
                <a href='/contact' className='text-primary hover:underline'>Submit Feedback</a>
                {' | '}
                <a href='/transparency' className='text-primary hover:underline'>View Transparency Log</a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
