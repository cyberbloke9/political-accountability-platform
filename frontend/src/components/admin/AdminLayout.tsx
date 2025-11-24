'use client'

import Link from 'next/link'
import { Shield, ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Breadcrumb {
  label: string
  href?: string
}

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  breadcrumbs?: Breadcrumb[]
}

export default function AdminLayout({
  children,
  title,
  breadcrumbs = []
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back to Dashboard */}
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-indigo-50">
                <ArrowLeft className="h-4 w-4" />
                <Shield className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-gray-900">Admin Dashboard</span>
              </Button>
            </Link>

            {/* Right: Current Page Title */}
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 pb-3 text-sm">
              <Link
                href="/admin"
                className="text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Dashboard
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 font-medium">{crumb.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
