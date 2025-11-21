import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-12 px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <Card><CardContent className="pt-6 space-y-4">
          <p className="text-muted-foreground">Your privacy is important to us. This platform collects minimal personal information necessary for account creation and promise tracking.</p>
          <h3 className="font-semibold text-lg">Data We Collect</h3>
          <p className="text-muted-foreground">Email address, username, and content you submit (promises, verifications, votes)</p>
          <h3 className="font-semibold text-lg">How We Use Your Data</h3>
          <p className="text-muted-foreground">To provide platform services, calculate reputation scores, and improve user experience</p>
        </CardContent></Card>
      </main>
      <Footer />
    </div>
  )
}
