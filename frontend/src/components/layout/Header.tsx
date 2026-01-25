'use client'
import { Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { SearchBar } from '@/components/search'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Users,
  TrendingUp,
  Menu,
  Vote,
  Scale,
  Bell
} from 'lucide-react'
import { NotificationBell } from '@/components/notifications'

export function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated, signOut, loading } = useAuth()
  const admin = useAdmin()
  const [username, setUsername] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (user) {
      supabase.from('users').select('id, username').eq('auth_id', user.id).maybeSingle().then(async ({ data }) => {
        if (data) {
          setUsername(data.username)
        } else {
          // User doesn't exist by auth_id - use RPC to link/create
          const { data: linkedUserId, error: linkError } = await supabase.rpc('link_user_auth_id', {
            p_auth_id: user.id,
            p_email: user.email
          })

          if (linkError) {
            console.error('Failed to link user:', linkError)
            // Fallback to email prefix
            setUsername(user.user_metadata?.username || user.email?.split('@')[0] || 'User')
            return
          }

          // Fetch the username after linking
          const { data: linkedUser } = await supabase
            .from('users')
            .select('username')
            .eq('id', linkedUserId)
            .single()

          if (linkedUser) {
            setUsername(linkedUser.username)
          } else {
            setUsername(user.user_metadata?.username || user.email?.split('@')[0] || 'User')
          }
        }
      })
    }
  }, [user])

  const navigation = [
    { name: 'Promises', href: '/promises', icon: ShieldCheck },
    { name: 'Leaders', href: '/politicians', icon: Users },
    { name: 'Compare', href: '/compare', icon: Scale },
    { name: 'Elections', href: '/elections', icon: Vote },
    { name: 'Leaderboard', href: '/leaderboard', icon: TrendingUp },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo (3).png"
            alt="Political Accountability Platform"
            width={160}
            height={40}
            className="hidden sm:block h-auto w-auto max-h-10"
            priority
          />
          <Image
            src="/images/logo-small.png"
            alt="PAP"
            width={50}
            height={40}
            className="block sm:hidden h-auto w-auto max-h-9"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 flex-1 ml-8">
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

        {/* Search Bar - Desktop */}
        <div className="hidden lg:block w-64 xl:w-80 mx-4">
          <SearchBar
            variant="compact"
            placeholder="Search..."
            showPopularSearches={false}
          />
        </div>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated && user ? (
            <>
              {/* Notifications */}
              <NotificationBell />

              {/* Dashboard Link */}
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Dashboard</span>
                </Button>
              </Link>

              {/* Admin Badge */}
              {admin.isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="border-primary text-primary">
                    <Shield className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">
                      {admin.isSuperAdmin ? 'SuperAdmin' : admin.isModerator ? 'Moderator' : 'Reviewer'}
                    </span>
                  </Button>
                </Link>
              )}

              {/* User Menu */}
              <Separator orientation="vertical" className="h-6" />

              <Link href={username ? "/profile/" + username : '/dashboard'} className="flex items-center space-x-2">
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
                <LogOut className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Login</span>
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">
                  <UserPlus className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Sign Up</span>
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col">
            <SheetHeader className="flex-shrink-0">
              <SheetTitle className="flex items-center">
                <Image
                  src="/images/logo (3).png"
                  alt="Political Accountability Platform"
                  width={160}
                  height={40}
                />
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-col space-y-6 mt-6 flex-1 overflow-y-auto pb-6">
              {/* Mobile Search */}
              <SearchBar
                variant="default"
                placeholder="Search promises..."
                showPopularSearches={true}
              />

              {/* Mobile Navigation Links */}
              <nav className="flex flex-col space-y-4">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={'text-base font-medium transition-colors hover:text-primary flex items-center space-x-3 p-2 rounded-md ' + (isActive(item.href) ? 'bg-muted text-foreground' : 'text-muted-foreground')}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>

              <Separator />

              {/* Mobile Auth Section */}
              <div className="flex flex-col space-y-4">
                {loading ? (
                  <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
                ) : isAuthenticated && user ? (
                  <>
                    {/* User Info */}
                    <Link
                      href={username ? "/profile/" + username : "/dashboard"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.email?.[0].toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Profile</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </Link>

                    {/* Notifications */}
                    <Link
                      href="/notifications"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full justify-start" size="lg">
                        <Bell className="h-5 w-5 mr-3" />
                        Notifications
                      </Button>
                    </Link>

                    {/* Dashboard */}
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full justify-start" size="lg">
                        <LayoutDashboard className="h-5 w-5 mr-3" />
                        Dashboard
                      </Button>
                    </Link>

                    {/* Sign Out */}
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        signOut()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full justify-start text-muted-foreground"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="outline" size="lg" className="w-full justify-start">
                        <LogIn className="h-5 w-5 mr-3" />
                        Login
                      </Button>
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button size="lg" className="w-full justify-start">
                        <UserPlus className="h-5 w-5 mr-3" />
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
