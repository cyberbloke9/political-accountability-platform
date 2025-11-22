import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, MessageSquare, Github, Phone } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-12 px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
        <Card><CardContent className="pt-6 space-y-6">
          <div className="flex items-start gap-4">
            <Mail className="h-6 w-6 text-primary mt-1" />
            <div><h3 className="font-semibold text-lg">Email</h3><p className="text-muted-foreground"><a href="mailto:papsupport@gmail.com" className="hover:text-primary transition-colors">papsupport@gmail.com</a></p></div>
          </div>
          <div className="flex items-start gap-4">
            <Phone className="h-6 w-6 text-primary mt-1" />
            <div><h3 className="font-semibold text-lg">Phone</h3><p className="text-muted-foreground"><a href="tel:+919959311144" className="hover:text-primary transition-colors">+91 9959311144</a></p></div>
          </div>
          <div className="flex items-start gap-4">
            <MessageSquare className="h-6 w-6 text-primary mt-1" />
            <div><h3 className="font-semibold text-lg">Feedback</h3><p className="text-muted-foreground">We welcome your suggestions and feedback to improve the platform</p></div>
          </div>
          <div className="flex items-start gap-4">
            <Github className="h-6 w-6 text-primary mt-1" />
            <div><h3 className="font-semibold text-lg">Open Source</h3><p className="text-muted-foreground">Contribute to the project on <a href="https://github.com/cyberbloke9/political-accountability-platform" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a></p></div>
          </div>
        </CardContent></Card>
      </main>
      <Footer />
    </div>
  )
}
