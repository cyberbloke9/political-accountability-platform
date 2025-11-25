'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Home, Search, FileQuestion, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NotFound() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/promises?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-16 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* 404 Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <FileQuestion className="h-32 w-32 text-muted-foreground/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-bold text-primary">404</span>
              </div>
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Page Not Found
            </h1>
            <p className="text-xl text-muted-foreground">
              Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
            </p>
          </div>

          {/* Search Box */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Search for promises instead:
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by politician, party, or promise..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button asChild>
              <Link href="/" className="gap-2">
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/promises" className="gap-2">
                <Search className="h-4 w-4" />
                Browse Promises
              </Link>
            </Button>
          </div>

          {/* Helpful Links */}
          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Here are some helpful links:
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <Link href="/promises" className="text-primary hover:underline">
                Browse Promises
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/leaderboard" className="text-primary hover:underline">
                Leaderboard
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/dashboard" className="text-primary hover:underline">
                Dashboard
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/transparency" className="text-primary hover:underline">
                Transparency Log
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/about" className="text-primary hover:underline">
                About Us
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
