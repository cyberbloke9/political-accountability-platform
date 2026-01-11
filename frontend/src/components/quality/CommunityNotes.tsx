'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CommunityNote,
  NoteType,
  getCommunityNotes,
  addCommunityNote,
  voteOnCommunityNote,
  getNoteTypeDisplay
} from '@/lib/evidence-quality'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import {
  MessageSquarePlus,
  ThumbsUp,
  ThumbsDown,
  Info,
  AlertTriangle,
  Edit,
  Link,
  Clock,
  FileQuestion,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface CommunityNotesProps {
  targetType: 'verification' | 'promise'
  targetId: string
}

export function CommunityNotes({ targetType, targetId }: CommunityNotesProps) {
  const { isAuthenticated } = useAuth()
  const [notes, setNotes] = useState<CommunityNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('context')
  const [supportingUrl, setSupportingUrl] = useState('')

  useEffect(() => {
    fetchNotes()
  }, [targetType, targetId])

  const fetchNotes = async () => {
    setLoading(true)
    const { data, error } = await getCommunityNotes(targetType, targetId)
    if (error) {
      console.error('Error fetching notes:', error)
    } else {
      setNotes(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!noteText.trim() || noteText.length < 10) {
      toast.error('Note must be at least 10 characters')
      return
    }

    setSubmitting(true)
    const urls = supportingUrl.trim() ? [supportingUrl.trim()] : undefined

    const { error } = await addCommunityNote(
      targetType,
      targetId,
      noteText.trim(),
      noteType,
      urls
    )

    if (error) {
      toast.error(error)
    } else {
      toast.success('Note added! It will appear once it receives enough helpful votes.')
      setNoteText('')
      setSupportingUrl('')
      setShowForm(false)
      fetchNotes()
    }
    setSubmitting(false)
  }

  const handleVote = async (noteId: string, voteType: 'helpful' | 'not_helpful') => {
    const { error } = await voteOnCommunityNote(noteId, voteType)
    if (error) {
      toast.error(error)
    } else {
      fetchNotes()
    }
  }

  const getIcon = (type: NoteType) => {
    switch (type) {
      case 'context': return <Info className="h-4 w-4" />
      case 'correction': return <Edit className="h-4 w-4" />
      case 'source_update': return <Link className="h-4 w-4" />
      case 'outdated': return <Clock className="h-4 w-4" />
      case 'misleading': return <AlertTriangle className="h-4 w-4" />
      case 'needs_sources': return <FileQuestion className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const visibleNotes = notes.filter(n => n.is_visible)
  const pendingNotes = notes.filter(n => !n.is_visible)
  const displayNotes = showAll ? notes : visibleNotes.slice(0, 3)

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5" />
            Community Notes
            {visibleNotes.length > 0 && (
              <Badge variant="secondary">{visibleNotes.length}</Badge>
            )}
          </CardTitle>
          {isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancel' : 'Add Note'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {showForm && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <Select value={noteType} onValueChange={(v) => setNoteType(v as NoteType)}>
              <SelectTrigger>
                <SelectValue placeholder="Note type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="context">Add Context</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
                <SelectItem value="source_update">Source Update</SelectItem>
                <SelectItem value="outdated">Mark as Outdated</SelectItem>
                <SelectItem value="misleading">Flag as Misleading</SelectItem>
                <SelectItem value="needs_sources">Needs More Sources</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Write your note... (min 10 characters)"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />

            <input
              type="url"
              placeholder="Supporting URL (optional)"
              value={supportingUrl}
              onChange={(e) => setSupportingUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || noteText.length < 10}
              >
                {submitting ? 'Submitting...' : 'Submit Note'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Notes become visible after receiving enough &quot;helpful&quot; votes from other users.
            </p>
          </div>
        )}

        {/* Notes List */}
        {displayNotes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquarePlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No community notes yet</p>
            {isAuthenticated && (
              <p className="text-sm">Be the first to add context!</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayNotes.map((note) => {
              const typeDisplay = getNoteTypeDisplay(note.note_type)
              return (
                <div
                  key={note.id}
                  className={`rounded-lg p-3 border ${
                    note.is_visible
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                      : 'bg-muted/30 border-muted opacity-70'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={typeDisplay.color}>
                      {getIcon(note.note_type)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {typeDisplay.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      by {note.author?.username || 'Anonymous'}
                    </span>
                    {!note.is_visible && (
                      <Badge variant="secondary" className="text-xs">
                        Pending votes
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <p className="text-sm mb-2">{note.note_text}</p>

                  {/* Supporting URLs */}
                  {note.supporting_urls && note.supporting_urls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {note.supporting_urls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Source
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Voting */}
                  {isAuthenticated && (
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <button
                        onClick={() => handleVote(note.id, 'helpful')}
                        className={`flex items-center gap-1 text-xs ${
                          note.user_vote === 'helpful'
                            ? 'text-green-600 font-medium'
                            : 'text-muted-foreground hover:text-green-600'
                        }`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        Helpful ({note.helpful_count})
                      </button>
                      <button
                        onClick={() => handleVote(note.id, 'not_helpful')}
                        className={`flex items-center gap-1 text-xs ${
                          note.user_vote === 'not_helpful'
                            ? 'text-red-600 font-medium'
                            : 'text-muted-foreground hover:text-red-600'
                        }`}
                      >
                        <ThumbsDown className="h-3 w-3" />
                        Not Helpful ({note.not_helpful_count})
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Show More/Less */}
        {notes.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show All ({notes.length})
              </>
            )}
          </Button>
        )}

        {/* Pending Notes Info */}
        {pendingNotes.length > 0 && !showAll && (
          <p className="text-xs text-center text-muted-foreground">
            {pendingNotes.length} note{pendingNotes.length !== 1 ? 's' : ''} pending community review
          </p>
        )}
      </CardContent>
    </Card>
  )
}
