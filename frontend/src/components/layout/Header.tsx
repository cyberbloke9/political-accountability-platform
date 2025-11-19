'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  LogIn, 
  UserPlus, 
  LogOut, 
  User, 
  LayoutDashboard,
  Scale,
  Users,
  TrendingUp
} from 'lucide-react'

export function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated, signOut, loading } = useAuth()

  const navigation = [
    { name: 'Promises', href: '/promises', icon: Scale },
    { name: 'Leaderboard', href: '/leaderboard', icon: TrendingUp },
    { name: 'About', href: '/about', icon: Users },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Scale className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg hidden sm:inline-block">
            Accountability
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-6 ml-8 flex-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={'text-sm font-medium transition-colors hover:text-primary flex items-center space-x-1 ' + (isActive(item.href) ? 'text-foreground' : 'text-muted-foreground')}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated && user ? (
            <>
              {/* Dashboard Link */}
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>

              {/* User Menu */}
              <Separator orientation="vertical" className="h-6" />
              
              <Link href="/profile" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
