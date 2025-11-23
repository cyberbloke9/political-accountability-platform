import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Lock, Database, Ban } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-12 px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: November 2025</p>

        <Card className="mb-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Our Commitment to Your Privacy</h3>
                <p className="text-muted-foreground">
                  The Political Accountability Platform is an open-source project dedicated to transparency and accountability.
                  We take your privacy seriously and are committed to protecting your personal information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Ban className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">What We DO NOT Do</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">✗ We DO NOT Sell Your Data</h3>
                  <p className="text-muted-foreground">
                    We will never sell, rent, or trade your personal information to third parties. Your data is yours, and it stays with this platform only.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">✗ We DO NOT Show Ads</h3>
                  <p className="text-muted-foreground">
                    This platform is completely ad-free. We do not display advertisements, track you for advertising purposes, or partner with ad networks.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">✗ We DO NOT Use Your Data for Recommendations</h3>
                  <p className="text-muted-foreground">
                    We do not build user profiles for targeted recommendations or personalization. The content you see is based on community activity, not surveillance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Data We Collect</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground mb-2"><strong>Account Information:</strong> Email address (for authentication), username (publicly visible), encrypted password</p>
                <p className="text-muted-foreground mb-2"><strong>User Content:</strong> Promises, verifications, votes, and comments (publicly visible)</p>
                <p className="text-muted-foreground"><strong>Technical Data:</strong> IP address (for security only), browser type, access timestamps</p>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">How We Use Your Data</h2>
            </div>
            <Card>
              <CardContent className="pt-6">
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>To provide core platform functionality (promise tracking, verification, voting)</li>
                  <li>To calculate and display your citizen reputation score</li>
                  <li>To prevent fraud, spam, and abuse of the platform</li>
                  <li>To send essential notifications (if you opt-in)</li>
                  <li>To comply with legal obligations if required by law</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Open Source Commitment</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-3">
                  This platform is fully open source. You can review our code and verify our privacy practices at our{' '}
                  <a href="https://github.com/cyberbloke9/political-accountability-platform" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    GitHub repository
                  </a>.
                </p>
                <p className="text-muted-foreground">
                  Our open-source nature ensures transparency. Every line of code that processes your information is publicly auditable.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  For questions about this Privacy Policy:
                </p>
                <ul className="text-muted-foreground space-y-2">
                  <li><strong>Email:</strong> <a href="mailto:papsupport@gmail.com" className="text-primary hover:underline">papsupport@gmail.com</a></li>
                  <li><strong>Phone:</strong> <a href="tel:+919959311144" className="text-primary hover:underline">+91 9959311144</a></li>
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
