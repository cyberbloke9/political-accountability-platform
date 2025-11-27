import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Scale, FileText, AlertCircle, XCircle } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
          <div className="container px-4 max-w-5xl">
            <div className="text-center space-y-6">
              <Badge className="text-sm px-4 py-1">Built for the People, By the People</Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Breaking the Cycle of <span className="text-primary">Broken Promises</span></h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">A citizen-powered platform to hold political leaders accountable for their commitments, backed by evidence, verified by the community.</p>
            </div>
          </div>
        </section>
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">The Problem We&apos;re Solving</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From rural villages to metropolitan cities, Indian citizens face the same challenge
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-destructive/20">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-xl mb-2">Vanishing Promises</CardTitle>
                      <p className="text-muted-foreground text-sm">
                        Every election cycle, leaders promise transformative change: &quot;24-hour electricity,&quot;
                        &quot;jobs for youth,&quot; &quot;clean water for every household.&quot; Yet within months of
                        taking office, these promises disappear into bureaucratic black holes. Citizens in villages
                        wait years for the promised roads, while urban workers still search for the &quot;2 crore jobs&quot;
                        that were guaranteed.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-destructive/20">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <XCircle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-xl mb-2">Blame Game Politics</CardTitle>
                      <p className="text-muted-foreground text-sm">
                        When confronted about unfulfilled promises, the response is always the same:
                        &quot;The previous government created this mess,&quot; &quot;The opposition is blocking progress,&quot;
                        &quot;We inherited bigger problems.&quot; Accountability evaporates as leaders point fingers
                        while citizens continue to suffer.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-destructive/20">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <FileText className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-xl mb-2">No Single Source of Truth</CardTitle>
                      <p className="text-muted-foreground text-sm">
                        Our tax money funds countless government initiatives, yet there&apos;s no unified,
                        accessible platform to verify what was promised, what was delivered, and where the
                        money went. Each department operates in silos, making it impossible for citizens to
                        track the journey from promise to implementation across healthcare, education,
                        infrastructure, or any other sector.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-destructive/20">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Scale className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-xl mb-2">Corporate Influence &amp; Corruption</CardTitle>
                      <p className="text-muted-foreground text-sm">
                        Behind closed doors, corporations manipulate policy through bribes and political donations.
                        Environmental clearances are fast-tracked, worker rights are diluted, and public resources
                        are diverted to benefit private interests. When exposed, investigations drag on for decades
                        while the powerful remain untouched.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
