# Footer Component

## File Location
`frontend/src/components/layout/Footer.tsx`

## Component Purpose

The `Footer` component provides the site-wide footer section for the Political Accountability Platform. It displays:

- Brand logo and description
- Social/external links (GitHub, Email)
- Product Hunt badge
- Organized navigation links grouped by category (Platform, Community, Legal)
- Copyright information and attribution

## Props Interface

This component does not accept any props. It is a self-contained presentational component.

```typescript
// No props - component is self-contained
export function Footer() { ... }
```

## State and Hooks Used

### Local Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `currentYear` | `number` | Dynamically calculated current year for copyright |
| `footerLinks` | `object` | Static configuration object containing all footer navigation links |

### Footer Links Structure

```typescript
const footerLinks = {
  platform: [
    { name: 'Browse Promises', href: '/promises' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Transparency Log', href: '/transparency' },
  ],
  community: [
    { name: 'Submit Promise', href: '/promises/new' },
    { name: 'Submit Verification', href: '/verifications/new' },
    { name: 'Community Guidelines', href: '/guidelines' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Contact Us', href: '/contact' },
  ],
}
```

## Rendered Elements

### Structure

1. **Brand Section** (First Column)
   - Logo image linked to home
   - Platform description text
   - Social icons (GitHub, Email)
   - Product Hunt badge/widget

2. **Platform Links** (Second Column)
   - Header: "Platform"
   - Links: Browse Promises, Leaderboard, How It Works, Transparency Log

3. **Community Links** (Third Column)
   - Header: "Community"
   - Links: Submit Promise, Submit Verification, Community Guidelines

4. **Legal Links** (Fourth Column)
   - Header: "Legal"
   - Links: Privacy Policy, Terms of Service, Contact Us

5. **Bottom Section**
   - Copyright text with dynamic year
   - Attribution: "Made in India", "Built by hawkEyE", "Powered by Claude Code"

### Layout

- Uses CSS Grid for responsive 4-column layout
- Collapses to single column on mobile
- Separator between main content and bottom section

## Dependencies

### External Libraries
- `lucide-react`: Icons (Github, Mail, Heart)
- `next/link`: Navigation
- `next/image`: Optimized image loading

### Internal Components
- `@/components/ui/separator`: Visual separator component

## Usage Examples

```tsx
// In a layout file (e.g., app/layout.tsx)
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

## Styling Notes

- Border-top to separate from page content
- Responsive grid: 1 column on mobile, 4 columns on `md` breakpoint
- Consistent spacing using container padding
- Muted foreground color for secondary text
- Hover effects on links with color transition
- Heart icon filled with red color for "Made in India" text

## External Links

- GitHub repository: `https://github.com/cyberbloke9/political-accountability-platform`
- Email: `support@political-accountability.in`
- Product Hunt page with embedded badge
- Claude Code attribution link

## Accessibility

- All external links include appropriate `aria-label` attributes
- Links use semantic HTML with proper hover states
- Product Hunt badge includes descriptive alt text
