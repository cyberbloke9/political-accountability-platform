'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  getAllPoliticianStats,
  getUniqueParties,
  getPartyColor,
  type PoliticianStats
} from '@/lib/politicians'
import {
  Users,
  Search,
  User,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  ArrowUpDown,
  Filter
} from 'lucide-react'

export default function PoliticiansPage() {
  const [politicians, setPoliticians] = useState<PoliticianStats[]>([])
  const [parties, setParties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [partyFilter, setPartyFilter] = useState('')
  const [sortBy, setSortBy] = useState<'total_promises' | 'fulfillment_rate' | 'politician_name'>('total_promises')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    loadData()
  }, [sortBy, sortAsc])

  useEffect(() => {
    loadParties()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getAllPoliticianStats({
        orderBy: sortBy,
        ascending: sortAsc
      })
      setPoliticians(data)
    } catch (error) {
      console.error('Error loading politicians:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadParties = async () => {
    const partiesData = await getUniqueParties()
    setParties(partiesData)
  }

  const filteredPoliticians = politicians.filter(p => {
    const matchesSearch = !searchTerm ||
      p.politician_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.party?.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesParty = !partyFilter || partyFilter === 'all' ||
      p.party?.toLowerCase().includes(partyFilter.toLowerCase())

    return matchesSearch && matchesParty
  })

  const clearFilters = () => {
    setSearchTerm('')
    setPartyFilter('')
  }

  const toggleSort = () => {
    setSortAsc(!sortAsc)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-4 sm:py-8 px-4 sm:px-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Political Leaders</h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
              Browse all political leaders and view their promise fulfillment records.
              Click on any leader to see their detailed profile and all tracked promises.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="pt-3 sm:pt-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold">{politicians.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Leaders</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 sm:pt-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {politicians.reduce((acc, p) => acc + (p.fulfilled_count || 0), 0)}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Fulfilled</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 sm:pt-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {politicians.reduce((acc, p) => acc + (p.in_progress_count || 0), 0)}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 sm:pt-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-red-600">
                  {politicians.reduce((acc, p) => acc + (p.broken_count || 0), 0)}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Broken</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filter Leaders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="party">Party</Label>
                  <Select value={partyFilter} onValueChange={setPartyFilter}>
                    <SelectTrigger id="party">
                      <SelectValue placeholder="All parties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Parties</SelectItem>
                      {parties.map(party => (
                        <SelectItem key={party} value={party.toLowerCase()}>
                          {party}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sort">Sort By</Label>
                  <Select
                    value={sortBy}
                    onValueChange={(value: any) => setSortBy(value)}
                  >
                    <SelectTrigger id="sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total_promises">Total Promises</SelectItem>
                      <SelectItem value="fulfillment_rate">Fulfillment Rate</SelectItem>
                      <SelectItem value="politician_name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button variant="outline" onClick={toggleSort} className="flex-1">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    {sortAsc ? 'Ascending' : 'Descending'}
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Politicians Grid */}
          <div>
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPoliticians.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No leaders found</p>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredPoliticians.map(politician => (
                  <Link
                    key={politician.politician_name}
                    href={`/politicians/${politician.slug || encodeURIComponent(politician.politician_name.toLowerCase().replace(/\s+/g, '-'))}`}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Avatar */}
                          {politician.image_url ? (
                            <img
                              src={politician.image_url}
                              alt={politician.politician_name}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary/40" />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {politician.politician_name}
                            </h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {politician.party && (
                                <Badge className={`text-xs ${getPartyColor(politician.party)}`}>
                                  {politician.party}
                                </Badge>
                              )}
                              {politician.position && (
                                <Badge variant="outline" className="text-xs">
                                  {politician.position}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Promises</span>
                            <span className="font-medium">{politician.total_promises || 0}</span>
                          </div>

                          {politician.fulfillment_rate !== null && politician.fulfillment_rate !== undefined && !isNaN(politician.fulfillment_rate) && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Fulfillment Rate</span>
                                <span className="font-medium">{politician.fulfillment_rate}%</span>
                              </div>
                              <Progress value={politician.fulfillment_rate} className="h-2" />
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {politician.fulfilled_count || 0}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-600" />
                              {politician.in_progress_count || 0}
                            </div>
                            <div className="flex items-center gap-1">
                              <XCircle className="h-3 w-3 text-red-600" />
                              {politician.broken_count || 0}
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              View Profile
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
