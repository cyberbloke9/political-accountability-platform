import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Database, Ban, Eye, Server, GitBranch, Share2, Bell } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-12 px-4 max-w-4xl">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <Badge className="text-xs">v2.4.0</Badge>
        </div>
        <p className="text-muted-foreground mb-8">Last updated: January 24, 2026</p>

        <Card className="mb-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Our Privacy Commitment</h3>
                <p className="text-muted-foreground">
                  Political Accountability Platform is an open-source, citizen-driven initiative. We prioritize transparency and privacy. This policy explains what data we collect, why we collect it, and how we protect it.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Ban className="h-5 w-5 text-destructive" />
              <h2 className="text-2xl font-bold">What We DO NOT Do</h2>
            </div>
            <Card className="border-destructive/20">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="p-4 border-l-4 border-red-500 bg-red-50/50">
                    <h3 className="font-semibold text-lg text-red-900">We DO NOT Sell Your Data</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We will never sell, rent, trade, or share your personal information with third parties for monetary gain. Your data is yours.
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-red-500 bg-red-50/50">
                    <h3 className="font-semibold text-lg text-red-900">We DO NOT Show Ads</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This platform is completely ad-free. No display ads, no tracking pixels, no ad networks, no behavioral advertising.
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-red-500 bg-red-50/50">
                    <h3 className="font-semibold text-lg text-red-900">We DO NOT Track You Across Sites</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We do not use cookies for cross-site tracking, fingerprinting, or surveillance. No Google Analytics, no Facebook Pixel, no third-party trackers.
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-red-500 bg-red-50/50">
                    <h3 className="font-semibold text-lg text-red-900">We DO NOT Build Behavioral Profiles</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We don't create psychological profiles, predict your political leanings, or manipulate what you see based on inferred preferences.
                    </p>
                  </div>
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
                <div>
                  <h3 className="font-semibold mb-2">Account Information</h3>
                  <ul className="text-muted-foreground space-y-1 ml-6 text-sm">
                    <li className="list-disc">Email address (for authentication and password reset only)</li>
                    <li className="list-disc">Username (publicly visible on all your contributions)</li>
                    <li className="list-disc">Password (encrypted with bcrypt, never stored in plain text)</li>
                    <li className="list-disc">Account creation date</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">User-Generated Content (Publicly Visible)</h3>
                  <ul className="text-muted-foreground space-y-1 ml-6 text-sm">
                    <li className="list-disc">Political promises you submit</li>
                    <li className="list-disc">Verifications and evidence you provide</li>
                    <li className="list-disc">Votes you cast on verifications (upvotes/downvotes)</li>
                    <li className="list-disc">Images and documents you upload</li>
                    <li className="list-disc">Your citizen reputation score and trust level</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Technical Data (Security Only)</h3>
                  <ul className="text-muted-foreground space-y-1 ml-6 text-sm">
                    <li className="list-disc">IP address (logged for fraud detection and rate limiting)</li>
                    <li className="list-disc">Browser type and version (for compatibility)</li>
                    <li className="list-disc">Device type (mobile/desktop for responsive design)</li>
                    <li className="list-disc">Access timestamps (for security monitoring)</li>
                  </ul>
                </div>
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
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong>Core Platform Functionality:</strong> Tracking promises, verifications, voting, reputation scoring</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong>Anti-Gaming Protection:</strong> Detecting vote brigades, self-verification, sybil attacks, coordinated manipulation</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong>Trust Level Assignment:</strong> Automatically assigning Untrusted/Community/Trusted levels based on reputation and activity</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong>Fraud Prevention:</strong> Identifying suspicious patterns, fake accounts, coordinated voting</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong>Security:</strong> Preventing spam, abuse, and unauthorized access</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong>Essential Notifications:</strong> Account security alerts, moderation notices (if you opt-in)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span><strong>Legal Compliance:</strong> Responding to valid legal requests only when required by Indian law</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Server className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Data Storage & Security</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <p className="text-muted-foreground">
                  <strong>Database:</strong> PostgreSQL hosted on Supabase with encrypted connections (SSL/TLS)
                </p>
                <p className="text-muted-foreground">
                  <strong>Authentication:</strong> Supabase Auth with bcrypt password hashing and JWT session tokens
                </p>
                <p className="text-muted-foreground">
                  <strong>File Storage:</strong> Images and documents stored on Supabase Storage with automatic virus scanning
                </p>
                <p className="text-muted-foreground">
                  <strong>Hosting:</strong> Frontend hosted on Vercel with HTTPS/SSL encryption for all traffic
                </p>
                <p className="text-muted-foreground">
                  <strong>Backups:</strong> Automated daily backups with 30-day retention
                </p>
                <p className="text-muted-foreground">
                  <strong>Access Control:</strong> Row-Level Security (RLS) policies ensure users can only access authorized data
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Public vs. Private Data</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Publicly Visible:</h3>
                  <p className="text-sm text-muted-foreground">
                    Username, promises, verifications, votes, reputation score, trust level, activity timestamps, uploaded evidence
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Private (Never Shared):</h3>
                  <p className="text-sm text-muted-foreground">
                    Email address, password (encrypted), IP address, browser details, internal fraud detection scores
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <GitBranch className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Open Source & Transparency</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <p className="text-muted-foreground">
                  This platform is fully open-source. Every line of code is publicly auditable at our{' '}
                  <a href="https://github.com/cyberbloke9/political-accountability-platform" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    GitHub repository
                  </a>.
                </p>
                <p className="text-muted-foreground">
                  You can verify our privacy practices, review our data handling, inspect our security measures, and even run your own instance of the platform.
                </p>
                <p className="text-muted-foreground">
                  All admin actions are logged in our public{' '}
                  <a href="/transparency" className="text-primary hover:underline font-semibold">
                    Transparency Log
                  </a>
                  {' '}(no login required).
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Your Privacy Rights</h2>
            </div>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong>Access:</strong> Request a copy of all your data at any time</li>
                  <li><strong>Correction:</strong> Update your email or username through account settings</li>
                  <li><strong>Deletion:</strong> Request account deletion (public contributions may remain for platform integrity)</li>
                  <li><strong>Data Export:</strong> Download all your contributions in JSON format</li>
                  <li><strong>Opt-Out:</strong> Disable optional email notifications</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Share2 className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Social Sharing & External Platforms</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <p className="text-muted-foreground">
                  When you use our social sharing features (Twitter/X, Facebook, WhatsApp, LinkedIn):
                </p>
                <ul className="text-muted-foreground space-y-1 ml-6 text-sm">
                  <li className="list-disc">We only share the link URL and publicly available content metadata</li>
                  <li className="list-disc">We do not send any personal data to social platforms</li>
                  <li className="list-disc">Preview images (Open Graph) are generated server-side and contain only public platform data</li>
                  <li className="list-disc">Your interaction with external platforms is governed by their privacy policies</li>
                  <li className="list-disc">We do not track which content you share or to which platforms</li>
                </ul>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Native Share:</strong> On mobile devices, we use the native share API which keeps data within your device's sharing system.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Notification Data</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <p className="text-muted-foreground">
                  Our notification system stores the following data:
                </p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-1">In-App Notifications</h3>
                    <ul className="text-muted-foreground space-y-1 ml-6 text-sm">
                      <li className="list-disc">Notification content, type, and timestamps</li>
                      <li className="list-disc">Read/unread status</li>
                      <li className="list-disc">Related promise or politician references</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Notification Settings (User-Controlled)</h3>
                    <ul className="text-muted-foreground space-y-1 ml-6 text-sm">
                      <li className="list-disc">Your notification preferences for each category</li>
                      <li className="list-disc">Email notification opt-in status</li>
                      <li className="list-disc">Email frequency preference (instant/daily digest)</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-900">
                    <strong>Your Control:</strong> You can disable all notifications or customize by category in Settings → Notifications.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
            <Card>
              <CardContent className="pt-6 space-y-2">
                <p className="text-muted-foreground">
                  <strong>Supabase:</strong> Database, authentication, file storage, and real-time notifications (read their{' '}
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">privacy policy</a>)
                </p>
                <p className="text-muted-foreground">
                  <strong>Vercel:</strong> Frontend hosting and OG image generation (read their{' '}
                  <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">privacy policy</a>)
                </p>
                <p className="text-muted-foreground mt-3 text-sm">
                  We do not share your data with any other third parties. No analytics platforms, no ad networks, no data brokers.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  We may update this Privacy Policy to reflect changes in our practices or legal requirements. Significant changes will be announced on the platform. Continued use after changes constitutes acceptance.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  For privacy questions, data requests, or concerns:
                </p>
                <ul className="text-muted-foreground space-y-2">
                  <li><strong>Email:</strong> <a href="mailto:support@political-accountability.in" className="text-primary hover:underline">support@political-accountability.in</a></li>
                  <li><strong>Feedback Form:</strong> <a href="/contact" className="text-primary hover:underline">Submit via Contact Page</a></li>
                  <li><strong>GitHub:</strong> <a href="https://github.com/cyberbloke9/political-accountability-platform/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Report Privacy Issues</a></li>
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
