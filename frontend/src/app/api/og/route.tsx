import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const STATUS_COLORS = {
  pending: { bg: '#6B7280', text: 'Pending' },
  in_progress: { bg: '#3B82F6', text: 'In Progress' },
  fulfilled: { bg: '#22C55E', text: 'Fulfilled' },
  broken: { bg: '#EF4444', text: 'Broken' },
  stalled: { bg: '#F59E0B', text: 'Stalled' },
}

const GRADE_COLORS = {
  A: '#22C55E',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#F97316',
  F: '#EF4444',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'default'

  try {
    if (type === 'promise') {
      return generatePromiseOG(searchParams)
    } else if (type === 'politician') {
      return generatePoliticianOG(searchParams)
    } else if (type === 'comparison') {
      return generateComparisonOG(searchParams)
    } else {
      return generateDefaultOG()
    }
  } catch (error) {
    console.error('OG Image generation error:', error)
    return generateDefaultOG()
  }
}

function generateDefaultOG() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          backgroundImage: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 80,
              height: 80,
              backgroundColor: '#3B82F6',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 20,
            }}
          >
            <span style={{ fontSize: 48, color: 'white' }}>P</span>
          </div>
          <span style={{ fontSize: 48, fontWeight: 700, color: 'white' }}>
            Political Accountability
          </span>
        </div>
        <span style={{ fontSize: 28, color: '#94A3B8' }}>
          Track promises. Verify facts. Hold leaders accountable.
        </span>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}

function generatePromiseOG(searchParams: URLSearchParams) {
  const politicianName = searchParams.get('politician') || 'Unknown Politician'
  const promiseText = searchParams.get('text') || 'Political Promise'
  const status = (searchParams.get('status') || 'pending') as keyof typeof STATUS_COLORS
  const party = searchParams.get('party') || ''

  const statusConfig = STATUS_COLORS[status] || STATUS_COLORS.pending
  const truncatedText = promiseText.length > 120 ? promiseText.slice(0, 120) + '...' : promiseText

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0F172A',
          backgroundImage: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          padding: 60,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 50,
                height: 50,
                backgroundColor: '#3B82F6',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <span style={{ fontSize: 28, color: 'white', fontWeight: 700 }}>P</span>
            </div>
            <span style={{ fontSize: 24, color: '#94A3B8' }}>Political Accountability</span>
          </div>
          <div
            style={{
              backgroundColor: statusConfig.bg,
              color: 'white',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {statusConfig.text}
          </div>
        </div>

        {/* Politician Info */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
          <div
            style={{
              width: 80,
              height: 80,
              backgroundColor: '#374151',
              borderRadius: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 20,
            }}
          >
            <span style={{ fontSize: 36, color: 'white' }}>{politicianName[0]}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: 'white' }}>{politicianName}</span>
            {party && <span style={{ fontSize: 22, color: '#94A3B8' }}>{party}</span>}
          </div>
        </div>

        {/* Promise Text */}
        <div
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 16,
            padding: 32,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 32, color: '#E2E8F0', lineHeight: 1.4 }}>
            "{truncatedText}"
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}

function generatePoliticianOG(searchParams: URLSearchParams) {
  const name = searchParams.get('name') || 'Politician'
  const party = searchParams.get('party') || ''
  const position = searchParams.get('position') || ''
  const grade = (searchParams.get('grade') || 'C') as keyof typeof GRADE_COLORS
  const fulfillmentRate = searchParams.get('rate') || '0'
  const totalPromises = searchParams.get('total') || '0'

  const gradeColor = GRADE_COLORS[grade] || GRADE_COLORS.C

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: '#0F172A',
          backgroundImage: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          padding: 60,
        }}
      >
        {/* Left Side - Politician Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Avatar */}
          <div
            style={{
              width: 120,
              height: 120,
              backgroundColor: '#374151',
              borderRadius: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 30,
            }}
          >
            <span style={{ fontSize: 56, color: 'white', fontWeight: 600 }}>{name[0]}</span>
          </div>

          {/* Name */}
          <span style={{ fontSize: 48, fontWeight: 700, color: 'white', marginBottom: 12 }}>{name}</span>

          {/* Party & Position */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {party && (
              <span
                style={{
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 20,
                }}
              >
                {party}
              </span>
            )}
            {position && (
              <span
                style={{
                  backgroundColor: '#6B7280',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 20,
                }}
              >
                {position}
              </span>
            )}
          </div>

          {/* Branding */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
            <div
              style={{
                width: 40,
                height: 40,
                backgroundColor: '#3B82F6',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <span style={{ fontSize: 22, color: 'white', fontWeight: 700 }}>P</span>
            </div>
            <span style={{ fontSize: 20, color: '#94A3B8' }}>Political Accountability</span>
          </div>
        </div>

        {/* Right Side - Stats */}
        <div
          style={{
            width: 400,
            backgroundColor: '#1E293B',
            borderRadius: 24,
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Grade */}
          <div
            style={{
              width: 140,
              height: 140,
              backgroundColor: gradeColor,
              borderRadius: 70,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 30,
            }}
          >
            <span style={{ fontSize: 80, fontWeight: 700, color: 'white' }}>{grade}</span>
          </div>

          {/* Fulfillment Rate */}
          <span style={{ fontSize: 48, fontWeight: 700, color: 'white', marginBottom: 8 }}>
            {fulfillmentRate}%
          </span>
          <span style={{ fontSize: 22, color: '#94A3B8', marginBottom: 30 }}>Fulfillment Rate</span>

          {/* Total Promises */}
          <div
            style={{
              backgroundColor: '#374151',
              borderRadius: 12,
              padding: '16px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>{totalPromises}</span>
            <span style={{ fontSize: 20, color: '#94A3B8' }}>Promises Tracked</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}

function generateComparisonOG(searchParams: URLSearchParams) {
  const name1 = searchParams.get('name1') || 'Politician 1'
  const name2 = searchParams.get('name2') || 'Politician 2'
  const grade1 = (searchParams.get('grade1') || 'C') as keyof typeof GRADE_COLORS
  const grade2 = (searchParams.get('grade2') || 'C') as keyof typeof GRADE_COLORS
  const rate1 = searchParams.get('rate1') || '0'
  const rate2 = searchParams.get('rate2') || '0'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0F172A',
          backgroundImage: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          padding: 60,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 50,
              height: 50,
              backgroundColor: '#3B82F6',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            <span style={{ fontSize: 28, color: 'white', fontWeight: 700 }}>P</span>
          </div>
          <span style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>Compare Politicians</span>
        </div>

        {/* Comparison Cards */}
        <div style={{ display: 'flex', gap: 40, flex: 1 }}>
          {/* Politician 1 */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#1E293B',
              borderRadius: 24,
              padding: 40,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                backgroundColor: '#374151',
                borderRadius: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 48, color: 'white' }}>{name1[0]}</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 20, textAlign: 'center' }}>
              {name1}
            </span>
            <div
              style={{
                width: 100,
                height: 100,
                backgroundColor: GRADE_COLORS[grade1],
                borderRadius: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 56, fontWeight: 700, color: 'white' }}>{grade1}</span>
            </div>
            <span style={{ fontSize: 36, fontWeight: 700, color: 'white' }}>{rate1}%</span>
            <span style={{ fontSize: 18, color: '#94A3B8' }}>Fulfillment</span>
          </div>

          {/* VS Divider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 48, fontWeight: 700, color: '#6B7280' }}>VS</span>
          </div>

          {/* Politician 2 */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#1E293B',
              borderRadius: 24,
              padding: 40,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                backgroundColor: '#374151',
                borderRadius: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 48, color: 'white' }}>{name2[0]}</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 20, textAlign: 'center' }}>
              {name2}
            </span>
            <div
              style={{
                width: 100,
                height: 100,
                backgroundColor: GRADE_COLORS[grade2],
                borderRadius: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 56, fontWeight: 700, color: 'white' }}>{grade2}</span>
            </div>
            <span style={{ fontSize: 36, fontWeight: 700, color: 'white' }}>{rate2}%</span>
            <span style={{ fontSize: 18, color: '#94A3B8' }}>Fulfillment</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
