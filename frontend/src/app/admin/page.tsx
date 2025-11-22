'use client'

import { useEffect, useState } from 'react'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAdmin } from '@/hooks/useAdmin'
import { supabase } from '@/lib/supabase'
import { Shield, FileText, Users, TrendingUp, CheckCircle, XCircle, Clock, AlertTriangle, Award } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getFraudStats } from '@/lib/fraudDetection'

interface DashboardStats {
  pendingVerifications: number
  flaggedContent: number
  totalUsers: number
  recentActions: number
  approvedToday: number
  rejectedToday: number
  fraudFlags: number
  criticalFlags: number
}

export default function AdminDashboard() {
  const admin = useAdmin()
  const [stats, setStats] = useState<DashboardStats>({
    pendingVerifications: 0,
    flaggedContent: 0,
    totalUsers: 0,
    recentActions: 0,
    approvedToday: 0,
    rejectedToday: 0,
    fraudFlags: 0,
    criticalFlags: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Pending verifications
      const { count: pendingCount } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Total users
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Approved today
      const { count: approvedCount } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('updated_at', today.toISOString())

      // Rejected today
      const { count: rejectedCount } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .gte('updated_at', today.toISOString())

      // Fraud detection stats
      const fraudStats = await getFraudStats()

      setStats({
        pendingVerifications: pendingCount || 0,
        flaggedContent: fraudStats.pending || 0,
        totalUsers: usersCount || 0,
        recentActions: (approvedCount || 0) + (rejectedCount || 0),
        approvedToday: approvedCount || 0,
        rejectedToday: rejectedCount || 0,
        fraudFlags: fraudStats.pending || 0,
        criticalFlags: fraudStats.bySeverity.critical || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      href: '/admin/verifications'
    },
    {
      title: 'Fraud Flags',
      value: stats.fraudFlags,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      href: '/admin/fraud'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/admin/users'
    },
    {
      title: 'Actions Today',
      value: stats.recentActions,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/admin/audit'
    }
  ]

  const quickActions = [
    {
      title: 'Review Verifications',
      description: 'Approve or reject pending verifications',
      icon: FileText,
      href: '/admin/verifications',
      permission: 'approve_verification'
    },
    {
      title: 'Fraud Detection',
      description: 'Review fraud flags and suspicious activity',
      icon: AlertTriangle,
      href: '/admin/fraud',
      permission: 'manage_fraud'
    },
    {
      title: 'Vote Patterns',
      description: 'Detect partisan bias and coordinated voting',
      icon: TrendingUp,
      href: '/admin/vote-patterns',
      permission: 'manage_fraud'
    },
    {
      title: 'Reputation Settings',
      description: 'Configure reputation rules and scoring',
      icon: Award,
      href: '/admin/reputation',
      permission: 'manage_admins'
    },
    {
      title: 'Manage Users',
      description: 'View users, assign roles, issue bans',
      icon: Users,
      href: '/admin/users',
      permission: 'view_user_details'
    },
    {
      title: 'View Audit Log',
      description: 'See all admin actions and changes',
      icon: Shield,
      href: '/admin/audit',
      permission: 'view_audit_log'
    }
  ]

  return (
    <AdminGuard>
      <div className="flex min-h-screen flex-col">
        <Header />

        <main className="flex-1 container py-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome back, {admin.isSuperAdmin ? 'SuperAdmin' : admin.isModerator ? 'Moderator' : 'Reviewer'}
                </p>
              </div>
              <Badge variant="outline" className="text-sm px-4 py-2">
                <Shield className="mr-2 h-4 w-4" />
                {admin.roles.join(', ')}
              </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <Link key={stat.title} href={stat.href}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {stat.title}
                        </CardTitle>
                        <div className={`${stat.bgColor} p-2 rounded-full`}>
                          <Icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {loading ? '...' : stat.value}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click to view details
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {/* Today's Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Today&apos;s Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.approvedToday}</p>
                      <p className="text-sm text-muted-foreground">Approved</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-3 rounded-full">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.rejectedToday}</p>
                      <p className="text-sm text-muted-foreground">Rejected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.pendingVerifications}</p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  const hasAccess = admin.hasPermission(action.permission)

                  return (
                    <Card key={action.title} className={hasAccess ? 'hover:shadow-md transition-shadow' : 'opacity-50'}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-base">{action.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {action.description}
                        </p>
                        {hasAccess ? (
                          <Link href={action.href}>
                            <Button variant="outline" className="w-full">
                              Go to {action.title.split(' ')[0]}
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="outline" className="w-full" disabled>
                            No Permission
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </AdminGuard>
  )
}
