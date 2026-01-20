'use client'

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[]
}

export function JsonLd({ data }: JsonLdProps) {
  const jsonLdString = JSON.stringify(Array.isArray(data) ? data : data)

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString }}
    />
  )
}

// Pre-built JSON-LD components for common use cases

export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Political Accountability Platform',
    url: 'https://political-accountability.in',
    logo: 'https://political-accountability.in/images/logo.png',
    description: 'Track political promises made by Indian politicians. Community-driven verification with transparent accountability.',
    foundingDate: '2025',
    foundingLocation: { '@type': 'Place', name: 'India' },
    sameAs: [
      'https://twitter.com/paborgin',
      'https://github.com/cyberbloke9/political-accountability-platform'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@political-accountability.in'
    }
  }

  return <JsonLd data={data} />
}

export function WebsiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Political Accountability Platform',
    url: 'https://political-accountability.in',
    description: 'Track political promises made by Indian politicians with community-driven verification.',
    inLanguage: 'en-IN',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://political-accountability.in/promises?search={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  }

  return <JsonLd data={data} />
}

interface PromiseJsonLdProps {
  promise: {
    id: string
    politician_name: string
    promise_text: string
    promise_date: string
    status: string
    category?: string
    source_url?: string
    view_count?: number
  }
}

export function PromiseJsonLd({ promise }: PromiseJsonLdProps) {
  const statusRating = {
    fulfilled: 5,
    in_progress: 3,
    pending: 3,
    stalled: 2,
    broken: 1
  }

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Claim',
    name: `Promise by ${promise.politician_name}`,
    description: promise.promise_text,
    datePublished: promise.promise_date,
    author: {
      '@type': 'Person',
      name: promise.politician_name
    },
    url: `https://political-accountability.in/promises/${promise.id}`,
    claimReviewed: promise.promise_text,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: statusRating[promise.status as keyof typeof statusRating] || 3,
      bestRating: 5,
      worstRating: 1,
      ratingExplanation: `Promise status: ${promise.status}`
    },
    ...(promise.source_url && { citation: promise.source_url }),
    ...(promise.category && { about: { '@type': 'Thing', name: promise.category } }),
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/ViewAction',
      userInteractionCount: promise.view_count || 0
    }
  }

  return <JsonLd data={data} />
}

interface PoliticianJsonLdProps {
  politician: {
    id: string
    name: string
    party?: string
    position?: string
    state?: string
    constituency?: string
    image_url?: string
    total_promises?: number
    fulfilled_promises?: number
  }
}

export function PoliticianJsonLd({ politician }: PoliticianJsonLdProps) {
  const fulfillmentRate = politician.total_promises
    ? Math.round((politician.fulfilled_promises || 0) / politician.total_promises * 100)
    : 0

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: politician.name,
    url: `https://political-accountability.in/politicians/${politician.id}`,
    jobTitle: politician.position || 'Politician',
    ...(politician.party && {
      affiliation: {
        '@type': 'PoliticalParty',
        name: politician.party
      }
    }),
    ...(politician.state && {
      workLocation: {
        '@type': 'Place',
        name: politician.constituency
          ? `${politician.constituency}, ${politician.state}`
          : politician.state
      }
    }),
    ...(politician.image_url && { image: politician.image_url }),
    description: `${politician.name} - ${politician.position || 'Politician'}${politician.party ? ` from ${politician.party}` : ''}. Promise fulfillment rate: ${fulfillmentRate}%`
  }

  return <JsonLd data={data} />
}

interface ElectionJsonLdProps {
  election: {
    id: string
    name: string
    election_type: string
    state?: string
    polling_start: string
    polling_end: string
    status: string
  }
}

export function ElectionJsonLd({ election }: ElectionJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: election.name,
    description: `${election.election_type} election${election.state ? ` in ${election.state}` : ''}`,
    url: `https://political-accountability.in/elections/${election.id}`,
    startDate: election.polling_start,
    endDate: election.polling_end,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: election.state || 'India',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
        ...(election.state && { addressRegion: election.state })
      }
    },
    organizer: {
      '@type': 'Organization',
      name: 'Election Commission of India',
      url: 'https://eci.gov.in'
    }
  }

  return <JsonLd data={data} />
}

interface BreadcrumbJsonLdProps {
  items: { name: string; url: string }[]
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }

  return <JsonLd data={data} />
}

interface FAQJsonLdProps {
  faqs: { question: string; answer: string }[]
}

export function FAQJsonLd({ faqs }: FAQJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  return <JsonLd data={data} />
}
