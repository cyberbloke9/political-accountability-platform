import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-12 px-4 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">About Us</h1>
            <p className="text-xl text-muted-foreground">Empowering citizens to hold their leaders accountable</p>
          </div>
          <Card><CardContent className="pt-6 space-y-6">
            <div><h2 className="text-2xl font-semibold mb-3">Our Mission</h2><p className="text-muted-foreground">The Political Accountability Platform bridges the gap between political promises and action.</p></div>
          </CardContent></Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
