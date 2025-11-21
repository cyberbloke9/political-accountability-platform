import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-12 px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <Card><CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Acceptable Use</h3>
          <p className="text-muted-foreground">Users must submit accurate information and evidence. Misinformation or malicious content will result in account suspension.</p>
          <h3 className="font-semibold text-lg">User Responsibilities</h3>
          <p className="text-muted-foreground">Verify information before submission, cite sources, and engage respectfully with the community.</p>
          <h3 className="font-semibold text-lg">Content Ownership</h3>
          <p className="text-muted-foreground">You retain ownership of content you submit but grant the platform license to display and distribute it.</p>
        </CardContent></Card>
      </main>
      <Footer />
    </div>
  )
}
