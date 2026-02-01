'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Settings,
  Plus,
  Database,
  Calendar,
  MapPin,
  Vote,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react'
import {
  Election,
  ElectionLevel,
  ElectionStatus,
  getElectionLevels,
  getIndianStates
} from '@/lib/elections'
import {
  ElectionDataSource,
  ElectionDataImport,
  getDataSources,
  getImportHistory,
  getDataSourceTypeLabel,
  getDataSourceTypeColor,
  getImportStatusColor,
  getReliabilityBadge,
  DATA_SOURCE_INFO
} from '@/lib/data-sources'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function AdminElectionsPage() {
  const [dataSources, setDataSources] = useState<ElectionDataSource[]>([])
  const [imports, setImports] = useState<ElectionDataImport[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Form state for new election
  const [newElection, setNewElection] = useState({
    name: '',
    election_type: 'state_assembly',
    election_level: 'state' as ElectionLevel,
    state: '',
    start_date: '',
    end_date: '',
    status: 'announced' as ElectionStatus,
    total_seats: '',
    description: ''
  })

  const indianStates = getIndianStates()
  const electionLevels = getElectionLevels()

  const electionTypes = [
    { value: 'general', label: 'General Election' },
    { value: 'state_assembly', label: 'State Assembly' },
    { value: 'by_election', label: 'By-Election' },
    { value: 'municipal_corporation', label: 'Municipal Corporation' },
    { value: 'municipal_council', label: 'Municipal Council' },
    { value: 'panchayat', label: 'Panchayat' },
    { value: 'gram_sabha', label: 'Gram Sabha' },
    { value: 'zilla_parishad', label: 'Zilla Parishad' },
    { value: 'block_council', label: 'Block Council' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sourcesResult, importsResult] = await Promise.all([
        getDataSources(false),
        getImportHistory(20)
      ])

      if (sourcesResult.data) setDataSources(sourcesResult.data)
      if (importsResult.data) setImports(importsResult.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddElection = async () => {
    try {
      // Get India country ID
      const { data: countries } = await supabase
        .from('countries')
        .select('id')
        .eq('iso_alpha2', 'IN')
        .single()

      // Get state ID if state selected
      let stateId = null
      if (newElection.state) {
        const { data: stateData } = await supabase
          .from('states_provinces')
          .select('id')
          .eq('name', newElection.state)
          .eq('country_id', countries?.id)
          .single()
        stateId = stateData?.id
      }

      // Get manual source ID
      const { data: source } = await supabase
        .from('election_data_sources')
        .select('id')
        .eq('source_type', 'manual')
        .single()

      const { error } = await supabase.from('elections').insert({
        name: newElection.name,
        election_type: newElection.election_type,
        election_level: newElection.election_level,
        country_id: countries?.id,
        state_id: stateId,
        state: newElection.state || null,
        start_date: newElection.start_date,
        end_date: newElection.end_date || newElection.start_date,
        status: newElection.status,
        total_seats: newElection.total_seats ? parseInt(newElection.total_seats) : null,
        description: newElection.description || null,
        data_source_id: source?.id
      })

      if (error) throw error

      toast.success('Election added successfully')
      setShowAddDialog(false)
      setNewElection({
        name: '',
        election_type: 'state_assembly',
        election_level: 'state',
        state: '',
        start_date: '',
        end_date: '',
        status: 'announced',
        total_seats: '',
        description: ''
      })
    } catch (error) {
      console.error('Error adding election:', error)
      toast.error('Failed to add election')
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-6 md:py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Elections Admin</h1>
              </div>
              <p className="text-muted-foreground">
                Manage election data, sources, and imports
              </p>
            </div>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Election
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Election</DialogTitle>
                  <DialogDescription>
                    Manually add an election to the database
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Election Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Maharashtra Legislative Assembly Election 2025"
                      value={newElection.name}
                      onChange={(e) =>
                        setNewElection({ ...newElection, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Election Level</Label>
                      <Select
                        value={newElection.election_level}
                        onValueChange={(value) =>
                          setNewElection({
                            ...newElection,
                            election_level: value as ElectionLevel
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {electionLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Election Type</Label>
                      <Select
                        value={newElection.election_type}
                        onValueChange={(value) =>
                          setNewElection({ ...newElection, election_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {electionTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>State/UT</Label>
                      <Select
                        value={newElection.state}
                        onValueChange={(value) =>
                          setNewElection({ ...newElection, state: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">National</SelectItem>
                          {indianStates.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Status</Label>
                      <Select
                        value={newElection.status}
                        onValueChange={(value) =>
                          setNewElection({
                            ...newElection,
                            status: value as ElectionStatus
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="announced">Announced</SelectItem>
                          <SelectItem value="nominations_open">Nominations Open</SelectItem>
                          <SelectItem value="campaigning">Campaigning</SelectItem>
                          <SelectItem value="polling">Polling</SelectItem>
                          <SelectItem value="counting">Counting</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newElection.start_date}
                        onChange={(e) =>
                          setNewElection({ ...newElection, start_date: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={newElection.end_date}
                        onChange={(e) =>
                          setNewElection({ ...newElection, end_date: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="total_seats">Total Seats</Label>
                      <Input
                        id="total_seats"
                        type="number"
                        placeholder="e.g., 288"
                        value={newElection.total_seats}
                        onChange={(e) =>
                          setNewElection({ ...newElection, total_seats: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Additional details about the election..."
                      value={newElection.description}
                      onChange={(e) =>
                        setNewElection({ ...newElection, description: e.target.value })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddElection} disabled={!newElection.name || !newElection.start_date}>
                    Add Election
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dataSources.length}</p>
                    <p className="text-sm text-muted-foreground">Data Sources</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {dataSources.filter((s) => s.is_active).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{imports.length}</p>
                    <p className="text-sm text-muted-foreground">Recent Imports</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Vote className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">36</p>
                    <p className="text-sm text-muted-foreground">States/UTs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="sources" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sources">Data Sources</TabsTrigger>
              <TabsTrigger value="imports">Import History</TabsTrigger>
              <TabsTrigger value="guide">Data Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="sources" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Registered Data Sources</CardTitle>
                  <CardDescription>
                    Sources used to populate election data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reliability</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataSources.map((source) => {
                        const reliability = getReliabilityBadge(source.reliability_score)
                        return (
                          <TableRow key={source.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{source.name}</span>
                                {source.url && (
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                              {source.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {source.description}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getDataSourceTypeColor(source.source_type)}
                              >
                                {getDataSourceTypeLabel(source.source_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={reliability.color}>
                                {reliability.label} ({source.reliability_score}/10)
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {source.is_active ? (
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              ) : (
                                <Badge variant="outline">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {source.last_updated
                                ? format(new Date(source.last_updated), 'MMM d, yyyy')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="imports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Imports</CardTitle>
                  <CardDescription>Data import history and status</CardDescription>
                </CardHeader>
                <CardContent>
                  {imports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No imports yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Records</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Completed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {imports.map((imp) => (
                          <TableRow key={imp.id}>
                            <TableCell className="font-medium">
                              {imp.import_type}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getImportStatusColor(imp.status)}
                              >
                                {imp.status === 'running' && (
                                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                )}
                                {imp.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span className="text-green-600">+{imp.records_created}</span>
                                {' / '}
                                <span className="text-blue-600">~{imp.records_updated}</span>
                                {imp.records_failed > 0 && (
                                  <>
                                    {' / '}
                                    <span className="text-red-600">!{imp.records_failed}</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {imp.started_at
                                ? format(new Date(imp.started_at), 'MMM d, HH:mm')
                                : '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {imp.completed_at
                                ? format(new Date(imp.completed_at), 'MMM d, HH:mm')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guide" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(DATA_SOURCE_INFO).map(([key, info]) => (
                  <Card key={key}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{info.name}</CardTitle>
                        {info.hasApi ? (
                          <Badge className="bg-green-100 text-green-800">API Available</Badge>
                        ) : (
                          <Badge variant="outline">No API</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <a
                        href={info.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {info.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>

                      <div>
                        <p className="text-sm font-medium mb-1">Data Types:</p>
                        <div className="flex flex-wrap gap-1">
                          {info.dataTypes.map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{info.notes}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Recommended Approach
                  </h3>
                  <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 space-y-2">
                    <li>Use <strong>DataMeet GitHub</strong> for historical election data (1951-2019)</li>
                    <li>Use <strong>Data.gov.in API</strong> for official statistics and voter data</li>
                    <li>Monitor <strong>ECI website</strong> manually for upcoming elections</li>
                    <li>Use <strong>Manual Entry</strong> for recent and upcoming elections</li>
                    <li>Cross-reference with news sources for accuracy</li>
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
