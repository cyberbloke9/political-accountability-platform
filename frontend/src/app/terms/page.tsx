import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, UserCheck, Ban, Scale, AlertTriangle, Lock } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1 container py-12 px-4 max-w-4xl'>
        <h1 className='text-4xl font-bold mb-4'>Terms of Use</h1>
        <p className='text-muted-foreground mb-8'>Last updated: November 2025</p>

        <Card className='mb-6 border-primary/20'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-4'>
              <ShieldCheck className='h-6 w-6 text-primary mt-1 flex-shrink-0' />
              <div>
                <h3 className='font-semibold text-lg mb-2'>Platform Purpose</h3>
                <p className='text-muted-foreground'>
                  Political Accountability Platform is a citizen-driven initiative to track political promises with community verification and transparent accountability across India. We are non-partisan, open-source, and committed to factual, evidence-based tracking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='space-y-8'>
          <section>
            <div className='flex items-center gap-3 mb-4'>
              <UserCheck className='h-5 w-5 text-primary' />
              <h2 className='text-2xl font-bold'>User Responsibilities</h2>
            </div>
            <Card>
              <CardContent className='pt-6 space-y-4'>
                <p className='text-muted-foreground mb-3'>
                  By creating an account and using this platform, you agree to:
                </p>
                <ul className='space-y-2 text-muted-foreground ml-6'>
                  <li className='list-disc'>Submit only factual, verifiable information with credible sources</li>
                  <li className='list-disc'>Provide evidence-based verifications, not opinions or speculation</li>
                  <li className='list-disc'>Engage respectfully with the community, regardless of political views</li>
                  <li className='list-disc'>Vote based on evidence quality, not political preference</li>
                  <li className='list-disc'>Accept that you start with 100 base reputation points and build through quality contributions</li>
                  <li className='list-disc'>Comply with our anti-gaming and fraud prevention measures</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className='flex items-center gap-3 mb-4'>
              <Scale className='h-5 w-5 text-primary' />
              <h2 className='text-2xl font-bold'>Trust Level System</h2>
            </div>
            <Card>
              <CardContent className='pt-6 space-y-3'>
                <p className='text-muted-foreground mb-2'>
                  Your account is automatically assigned a trust level based on your activity and reputation:
                </p>
                <div className='space-y-2 text-sm'>
                  <div className='p-3 border rounded-lg bg-orange-50/50 border-orange-200'>
                    <strong className='text-orange-800'>Untrusted (0.5x weight):</strong>
                    <span className='text-muted-foreground ml-2'>New users with less than 7 days or less than 100 score</span>
                  </div>
                  <div className='p-3 border rounded-lg bg-gray-50/50 border-gray-200'>
                    <strong className='text-gray-800'>Community (1.0x weight):</strong>
                    <span className='text-muted-foreground ml-2'>Regular contributors with 100+ score and 7+ days</span>
                  </div>
                  <div className='p-3 border rounded-lg bg-blue-50/50 border-blue-200'>
                    <strong className='text-blue-800'>Trusted (2.0x weight):</strong>
                    <span className='text-muted-foreground ml-2'>High-quality contributors with 500+ score and proven track record</span>
                  </div>
                  <div className='p-3 border rounded-lg bg-purple-50/50 border-purple-200'>
                    <strong className='text-purple-800'>Admin (3.0x weight):</strong>
                    <span className='text-muted-foreground ml-2'>Platform moderators manually assigned</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className='flex items-center gap-3 mb-4'>
              <Ban className='h-5 w-5 text-destructive' />
              <h2 className='text-2xl font-bold'>Prohibited Conduct</h2>
            </div>
            <Card className='border-destructive/20'>
              <CardContent className='pt-6 space-y-4'>
                <p className='text-muted-foreground mb-3 font-semibold'>
                  The following actions will result in immediate penalties:
                </p>
                <div className='space-y-3'>
                  <div className='border-l-4 border-red-500 pl-4 py-2'>
                    <strong className='text-red-700'>AI-Generated Content:</strong>
                    <p className='text-sm text-muted-foreground mt-1'>Using AI to generate promises, verifications, or evidence results in immediate permanent ban, content deletion, and IP ban.</p>
                  </div>
                  <div className='border-l-4 border-red-500 pl-4 py-2'>
                    <strong className='text-red-700'>Self-Verification:</strong>
                    <p className='text-sm text-muted-foreground mt-1'>Verifying your own promises is automatically flagged with 0.1x weight penalty (90% reduction).</p>
                  </div>
                  <div className='border-l-4 border-red-500 pl-4 py-2'>
                    <strong className='text-red-700'>Vote Brigading:</strong>
                    <p className='text-sm text-muted-foreground mt-1'>Coordinated voting groups are detected through pattern analysis and result in account flagging and suspension.</p>
                  </div>
                  <div className='border-l-4 border-red-500 pl-4 py-2'>
                    <strong className='text-red-700'>Partisan Voting:</strong>
                    <p className='text-sm text-muted-foreground mt-1'>Systematically downvoting content based on political preference, not evidence quality.</p>
                  </div>
                  <div className='border-l-4 border-red-500 pl-4 py-2'>
                    <strong className='text-red-700'>Misinformation:</strong>
                    <p className='text-sm text-muted-foreground mt-1'>Submitting false information, fake sources, or manipulated evidence.</p>
                  </div>
                  <div className='border-l-4 border-red-500 pl-4 py-2'>
                    <strong className='text-red-700'>Abuse & Harassment:</strong>
                    <p className='text-sm text-muted-foreground mt-1'>Personal attacks, doxxing, threats, or harassment of any kind.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className='flex items-center gap-3 mb-4'>
              <AlertTriangle className='h-5 w-5 text-orange-600' />
              <h2 className='text-2xl font-bold'>Enforcement & Penalties</h2>
            </div>
            <Card>
              <CardContent className='pt-6 space-y-3'>
                <div className='space-y-2 text-sm'>
                  <p className='text-muted-foreground'><strong>Minor Violations:</strong> Content removal, reputation penalty, warning message</p>
                  <p className='text-muted-foreground'><strong>Moderate Violations:</strong> 30-day voting ban, reputation reset, content review</p>
                  <p className='text-muted-foreground'><strong>Severe Violations:</strong> 90-day account suspension, all content flagged</p>
                  <p className='text-muted-foreground'><strong>Critical Violations:</strong> Permanent ban, IP ban, all content deleted</p>
                </div>
                <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                  <p className='text-sm text-blue-900'>
                    <strong>Appeal Process:</strong> Banned users can appeal through our contact page within 30 days. Appeals are reviewed by multiple moderators with full transparency.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className='flex items-center gap-3 mb-4'>
              <Lock className='h-5 w-5 text-primary' />
              <h2 className='text-2xl font-bold'>Content & Intellectual Property</h2>
            </div>
            <Card>
              <CardContent className='pt-6 space-y-3'>
                <p className='text-muted-foreground'>
                  All content you submit (promises, verifications, votes) becomes publicly visible and is licensed under Creative Commons Attribution 4.0.
                </p>
                <p className='text-muted-foreground'>
                  You retain copyright to your original content but grant this platform a perpetual, irrevocable license to display, distribute, and archive it.
                </p>
                <p className='text-muted-foreground'>
                  Evidence files and images must be properly sourced. Do not upload copyrighted material without permission.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className='text-2xl font-bold mb-4'>Limitation of Liability</h2>
            <Card>
              <CardContent className='pt-6'>
                <p className='text-muted-foreground mb-3'>
                  This platform is provided "as is" without warranties. We are not liable for user-generated content accuracy. While we implement fraud detection and moderation, we cannot guarantee 100% accuracy of community-submitted information.
                </p>
                <p className='text-muted-foreground'>
                  Users are responsible for verifying information independently before making decisions based on platform content.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className='text-2xl font-bold mb-4'>Changes to Terms</h2>
            <Card>
              <CardContent className='pt-6'>
                <p className='text-muted-foreground'>
                  We may update these Terms of Use as the platform evolves. Significant changes will be announced on the platform. Continued use after changes constitutes acceptance of new terms.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className='text-2xl font-bold mb-4'>Contact</h2>
            <Card>
              <CardContent className='pt-6'>
                <p className='text-muted-foreground mb-3'>For questions, violations, or appeals:</p>
                <ul className='text-muted-foreground space-y-2'>
                  <li><strong>Email:</strong> <a href='mailto:support@political-accountability.in' className='text-primary hover:underline'>support@political-accountability.in</a></li>
                  <li><strong>Feedback Form:</strong> <a href='/contact' className='text-primary hover:underline'>Submit via Contact Page</a></li>
                  <li><strong>Transparency Log:</strong> <a href='/transparency' className='text-primary hover:underline'>View All Moderation Actions</a></li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
