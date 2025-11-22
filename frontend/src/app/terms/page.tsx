import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Scale, UserCheck, Ban } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1 container py-12 px-4 max-w-4xl'>
        <h1 className='text-4xl font-bold mb-4'>Terms of Use</h1>
        <p className='text-muted-foreground mb-8'>Last updated: January 2025</p>

        <Card className='mb-6 border-primary/20'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-4'>
              <Scale className='h-6 w-6 text-primary mt-1 flex-shrink-0' />
              <div>
                <h3 className='font-semibold text-lg mb-2'>Platform Purpose</h3>
                <p className='text-muted-foreground'>
                  This platform exists to address long-standing issues that affect every citizen. Our goal is to create a factual,
                  evidence-based record of political promises and their fulfillment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='space-y-8'>
          <section>
            <div className='flex items-center gap-3 mb-4'>
              <UserCheck className='h-5 w-5 text-primary' />
              <h2 className='text-2xl font-bold'>User Accountability</h2>
            </div>
            <Card>
              <CardContent className='pt-6 space-y-4'>
                <p className='text-muted-foreground'>
                  By using this platform, you agree to be accountable for your contributions. We expect all users to submit factual information,
                  provide credible sources, engage respectfully, and focus on documented facts.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className='flex items-center gap-3 mb-4'>
              <Ban className='h-5 w-5 text-destructive' />
              <h2 className='text-2xl font-bold'>Prohibited Content</h2>
            </div>
            <Card className='border-destructive/20'>
              <CardContent className='pt-6 space-y-4'>
                <p className='text-muted-foreground mb-3'>
                  The following are strictly prohibited: offensive content, defamatory statements, derogatory remarks about politicians,
                  spam, manipulation, and misinformation. Violations will result in content removal and potential account suspension or ban.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className='text-2xl font-bold mb-4'>Contact</h2>
            <Card>
              <CardContent className='pt-6'>
                <p className='text-muted-foreground mb-3'>For questions or to report violations:</p>
                <ul className='text-muted-foreground space-y-2'>
                  <li><strong>Email:</strong> <a href='mailto:papsupport@gmail.com' className='text-primary hover:underline'>papsupport@gmail.com</a></li>
                  <li><strong>Phone:</strong> <a href='tel:+919959311144' className='text-primary hover:underline'>+91 9959311144</a></li>
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