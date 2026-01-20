/**
 * SEO Configuration and Utilities
 * Handles meta tags, Open Graph, Twitter Cards, and structured data
 */

export const SITE_CONFIG = {
  name: 'Political Accountability Platform',
  shortName: 'PAP India',
  description: 'Track political promises made by Indian politicians. Community-driven verification with transparent accountability. Hold your representatives accountable.',
  url: 'https://political-accountability.in',
  ogImage: 'https://political-accountability.in/images/og-default.png',
  twitterHandle: '@paborgin',
  locale: 'en_IN',
  themeColor: '#1a56db',
  keywords: [
    // Core Platform Keywords
    'political accountability',
    'political accountability india',
    'politician tracker india',
    'promise tracker',
    'election promise tracker',
    'neta tracker',
    'indian democracy',
    'civic engagement india',
    'government transparency india',
    'hold politicians accountable',
    'verify political promises',
    'track government promises',

    // Major National Parties
    'BJP promises',
    'Congress promises',
    'AAP promises',
    'TMC promises',
    'SP promises',
    'BSP promises',
    'NCP promises',
    'Shiv Sena promises',
    'JDU promises',
    'RJD promises',
    'DMK promises',
    'AIADMK promises',
    'TDP promises',
    'BRS promises',
    'YSR Congress promises',
    'CPI promises',
    'CPM promises',
    'JMM promises',
    'BJD promises',
    'AIMIM promises',

    // Key Politicians
    'Modi promises',
    'Narendra Modi promises fulfilled',
    'Rahul Gandhi promises',
    'Amit Shah promises',
    'Yogi Adityanath promises',
    'Arvind Kejriwal promises',
    'Mamata Banerjee promises',
    'MK Stalin promises',
    'KCR promises',
    'Nitish Kumar promises',
    'Uddhav Thackeray promises',
    'Akhilesh Yadav promises',
    'Mayawati promises',
    'Sharad Pawar promises',

    // Election Types
    'lok sabha election promises',
    'rajya sabha',
    'vidhan sabha promises',
    'state assembly election promises',
    'municipal election promises',
    'panchayat election promises',
    'general election india promises',
    'by-election promises',

    // State-Specific
    'UP election promises',
    'Maharashtra election promises',
    'Gujarat election promises',
    'Tamil Nadu election promises',
    'Karnataka election promises',
    'West Bengal election promises',
    'Bihar election promises',
    'Rajasthan election promises',
    'Madhya Pradesh election promises',
    'Kerala election promises',
    'Andhra Pradesh election promises',
    'Telangana election promises',
    'Delhi election promises',
    'Punjab election promises',
    'Haryana election promises',
    'Odisha election promises',
    'Jharkhand election promises',
    'Chhattisgarh election promises',
    'Assam election promises',

    // Issue-Based Keywords
    'infrastructure promises india',
    'healthcare promises india',
    'education promises india',
    'employment promises india',
    'job creation promises',
    'farmer promises india',
    'kisan promises',
    'women safety promises',
    'development promises',
    'smart city promises',
    'clean india promises',
    'digital india promises',
    'make in india promises',
    'startup india promises',
    'housing promises india',
    'electricity promises',
    'water supply promises',
    'road construction promises',
    'metro promises',
    'railway promises india',

    // Hindi/Regional Terms
    'neta promises',
    'chunav vaade',
    'sarkar promises',
    'mantri promises',
    'vikas promises',
    'jhootha vaada',
    'broken promises india',
    'fulfilled promises india',

    // Question-Based / Long-tail
    'did modi fulfill promises',
    'BJP broken promises list',
    'Congress manifesto promises',
    'AAP Delhi promises status',
    'which politician keeps promises',
    'politician promise fulfillment rate',
    'election manifesto tracker',
    'government scheme promises',
    'budget promises india',
    '100 days promises',
    'first year promises government',

    // Civic/Transparency Terms
    'RTI political promises',
    'government accountability india',
    'political transparency',
    'democracy tracker india',
    'citizen engagement platform',
    'fact check political promises',
    'evidence based politics india',
    'community verification politics',

    // MP/MLA Specific
    'MP promises tracker',
    'MLA promises tracker',
    'my MP promises',
    'my MLA promises',
    'local politician promises',
    'constituency promises',
    'ward promises',

    // Comparative/Analysis
    'BJP vs Congress promises',
    'party wise promise comparison',
    'state government performance',
    'central government promises',
    'PM promises tracker',
    'CM promises tracker'
  ]
}

export interface PageSEO {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  ogType?: 'website' | 'article' | 'profile'
  canonical?: string
  noIndex?: boolean
  publishedTime?: string
  modifiedTime?: string
  author?: string
}

/**
 * Generate full page title with site name
 */
export function generateTitle(pageTitle?: string): string {
  if (!pageTitle) return SITE_CONFIG.name
  return `${pageTitle} | ${SITE_CONFIG.name}`
}

/**
 * Generate metadata object for Next.js
 */
export function generateMetadata(page: PageSEO) {
  const title = generateTitle(page.title)
  const keywords = [...SITE_CONFIG.keywords, ...(page.keywords || [])]

  return {
    title,
    description: page.description,
    keywords: keywords.join(', '),
    authors: [{ name: page.author || SITE_CONFIG.name }],
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: {
      canonical: page.canonical || SITE_CONFIG.url,
    },
    openGraph: {
      title,
      description: page.description,
      url: page.canonical || SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: page.ogImage || SITE_CONFIG.ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: SITE_CONFIG.locale,
      type: page.ogType || 'website',
      ...(page.publishedTime && { publishedTime: page.publishedTime }),
      ...(page.modifiedTime && { modifiedTime: page.modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: page.description,
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
      images: [page.ogImage || SITE_CONFIG.ogImage],
    },
    robots: page.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    verification: {
      google: 'your-google-verification-code', // TODO: Add actual verification code
    },
  }
}

/**
 * JSON-LD Structured Data Generators
 */

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/images/logo.png`,
    description: SITE_CONFIG.description,
    foundingDate: '2025',
    foundingLocation: {
      '@type': 'Place',
      name: 'India'
    },
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
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    inLanguage: 'en-IN',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/promises?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }
}

export function generatePromiseSchema(promise: {
  id: string
  politician_name: string
  promise_text: string
  promise_date: string
  status: string
  category?: string
  source_url?: string
  view_count?: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Claim',
    name: `Promise by ${promise.politician_name}`,
    description: promise.promise_text,
    datePublished: promise.promise_date,
    author: {
      '@type': 'Person',
      name: promise.politician_name
    },
    url: `${SITE_CONFIG.url}/promises/${promise.id}`,
    claimReviewed: promise.promise_text,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: promise.status === 'fulfilled' ? 5 : promise.status === 'broken' ? 1 : 3,
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
}

export function generatePoliticianSchema(politician: {
  id: string
  name: string
  party?: string
  position?: string
  state?: string
  constituency?: string
  image_url?: string
  total_promises?: number
  fulfilled_promises?: number
}) {
  const fulfillmentRate = politician.total_promises
    ? Math.round((politician.fulfilled_promises || 0) / politician.total_promises * 100)
    : 0

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: politician.name,
    url: `${SITE_CONFIG.url}/politicians/${politician.id}`,
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
}

export function generateElectionSchema(election: {
  id: string
  name: string
  election_type: string
  state?: string
  polling_start: string
  polling_end: string
  status: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: election.name,
    description: `${election.election_type} election${election.state ? ` in ${election.state}` : ''}`,
    url: `${SITE_CONFIG.url}/elections/${election.id}`,
    startDate: election.polling_start,
    endDate: election.polling_end,
    eventStatus: election.status === 'completed'
      ? 'https://schema.org/EventScheduled'
      : election.status === 'polling'
      ? 'https://schema.org/EventMovedOnline'
      : 'https://schema.org/EventScheduled',
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
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
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
}

export function generateHowToSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Track Political Promises',
    description: 'Learn how to use the Political Accountability Platform to track and verify promises made by Indian politicians.',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Find a Promise',
        text: 'Browse promises by politician, party, or category. Use search and filters to find specific promises.',
        url: `${SITE_CONFIG.url}/promises`
      },
      {
        '@type': 'HowToStep',
        name: 'Review Evidence',
        text: 'Check community-submitted verifications with sources. Each verification includes evidence links and quality scores.',
        url: `${SITE_CONFIG.url}/how-it-works`
      },
      {
        '@type': 'HowToStep',
        name: 'Submit Verification',
        text: 'Contribute by submitting your own evidence. Include reliable sources to help verify promise status.',
        url: `${SITE_CONFIG.url}/verifications/new`
      },
      {
        '@type': 'HowToStep',
        name: 'Vote and Discuss',
        text: 'Upvote helpful verifications and join discussions. Your participation helps maintain accuracy.',
        url: `${SITE_CONFIG.url}/guidelines`
      }
    ]
  }
}
