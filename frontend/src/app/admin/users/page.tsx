'use client'

import { useEffect, useState } from 'react'
import { AdminGuard } from '@/components/admin/AdminGuard'
import AdminLayout from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { isUserBanned } from '@/lib/banManagement'
import {
  Users,
  Search,
  Shield,
  Ban,
  Award,
  Calendar,
  Loader2,
  ExternalLink,
  UserX
} from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  username: string
  email: string
  citizen_score: number
  created_at: string
  roles?: Array<{
    role: Array<{
      name: string
      level: number
    }>
  }>
  banned?: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [banFilter, setBanFilter] = useState<string>('all')
  const [scoreFilter, setScoreFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    banned: 0,
    highScore: 0
  })

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, search, roleFilter, banFilter, scoreFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)

      // Fetch users with roles
      const { data: usersData, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          email,
          citizen_score,
          created_at,
          roles:user_roles(
            role:admin_roles(
              name,
              level
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      // Check ban status for each user
      const usersWithBanStatus = await Promise.all(
        (usersData || []).map(async user => {
          const { banned } = await isUserBanned(user.id)
          return { ...user, banned }
        })
      )

      setUsers(usersWithBanStatus as User[])
      calculateStats(usersWithBanStatus as User[])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (userData: User[]) => {
    setStats({
      total: userData.length,
      admins: userData.filter(u => u.roles && u.roles.length > 0).length,
      banned: userData.filter(u => u.banned).length,
      highScore: userData.filter(u => u.citizen_score >= 250).length
    })
  }

  const applyFilters = () => {
    let filtered = [...users]

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        u =>
          u.username.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'admin') {
        filtered = filtered.filter(u => u.roles && u.roles.length > 0)
      } else if (roleFilter === 'regular') {
        filtered = filtered.filter(u => !u.roles || u.roles.length === 0)
      }
    }

    // Ban filter
    if (banFilter !== 'all') {
      if (banFilter === 'banned') {
        filtered = filtered.filter(u => u.banned)
      } else if (banFilter === 'active') {
        filtered = filtered.filter(u => !u.banned)
      }
    }

    // Score filter
    if (scoreFilter !== 'all') {
      switch (scoreFilter) {
        case 'high':
          filtered = filtered.filter(u => u.citizen_score >= 250)
          break
        case 'medium':
          filtered = filtered.filter(
            u => u.citizen_score >= 100 && u.citizen_score < 250
          )
          break
        case 'low':
          filtered = filtered.filter(u => u.citizen_score < 100)
          break
      }
    }

    setFilteredUsers(filtered)
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 250) return 'text-green-700 bg-green-100'
    if (score >= 100) return 'text-blue-700 bg-blue-100'
    return 'text-gray-700 bg-gray-100'
  }

  return (
    <AdminGuard requiredPermission="view_user_details">
      <AdminLayout
        title="User Management"
        breadcrumbs={[{ label: 'Users' }]}
      >
        <div className="space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Admin Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <p className="text-2xl font-bold">{stats.admins}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Banned Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-red-600" />
                  <p className="text-2xl font-bold text-red-600">
                    {stats.banned}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  High Score (250+)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <p className="text-2xl font-bold">{stats.highScore}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Username or email..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="regular">Regular Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Status
                  </label>
                  <Select value={banFilter} onValueChange={setBanFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Citizen Score
                  </label>
                  <Select value={scoreFilter} onValueChange={setScoreFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="high">High (250+)</SelectItem>
                      <SelectItem value="medium">Medium (100-249)</SelectItem>
                      <SelectItem value="low">Low (&lt;100)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(search || roleFilter !== 'all' || banFilter !== 'all' || scoreFilter !== 'all') && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('')
                      setRoleFilter('all')
                      setBanFilter('all')
                      setScoreFilter('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  Users ({filteredUsers.length} of {users.length})
                </span>
                <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
                  <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found matching your filters
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Citizen Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.username}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            {user.roles && user.roles.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {user.roles.map((r, idx) => (
                                  r.role[0] && (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-purple-700 bg-purple-100"
                                    >
                                      {r.role[0].name}
                                    </Badge>
                                  )
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Regular User
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getScoreBadgeColor(user.citizen_score)}>
                              <Award className="h-3 w-3 mr-1" />
                              {user.citizen_score}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.banned ? (
                              <Badge className="text-red-700 bg-red-100">
                                <Ban className="h-3 w-3 mr-1" />
                                Banned
                              </Badge>
                            ) : (
                              <Badge className="text-green-700 bg-green-100">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/profile/${user.id}`} target="_blank">
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
