import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-16">
        <h1 className="text-4xl font-bold mb-4">About</h1>
        <p className="text-muted-foreground">Coming soon...</p>
      </main>
      <Footer />
    </div>
  )
}
