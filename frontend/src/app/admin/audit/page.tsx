'use client'

import { AdminGuard } from '@/components/admin/AdminGuard'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield } from 'lucide-react'

export default function AuditLogPage() {
  return (
    <AdminGuard requiredPermission="view_audit_log">
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
              <p className="text-muted-foreground">View all admin actions and system changes</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Audit log will be available in the next update.</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </AdminGuard>
  )
}
