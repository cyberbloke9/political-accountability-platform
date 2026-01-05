'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Github, Mail, Heart } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { getVersionString } from '@/lib/version'

export function Footer() {
  const currentYear = new Date().getFullYear()

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

  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Section */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo (3).png"
                alt="Political Accountability Platform"
                width={160}
                height={40}
              />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Track political promises with community verification and transparent accountability.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://github.com/cyberbloke9/political-accountability-platform"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:support@political-accountability.in"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Contact"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
            <a
              href="https://www.producthunt.com/products/political-accountability-platform?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-political-accountability-platform"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1043424&theme=light&t=1764320839996"
                alt="Political Accountability Platform - Track political promises. Demand accountability. For India. | Product Hunt"
                style={{ width: '250px', height: '54px' }}
                width={250}
                height={54}
              />
            </a>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="font-semibold mb-4">Community</h3>
            <ul className="space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Political Accountability Platform. Built with transparency.
            </p>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
              {getVersionString()}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">Made in India <Heart className="h-3 w-3 fill-red-500 text-red-500" /></span>
            <span className="hidden sm:inline">•</span>
            <span>Built by 🦅 <span className="font-semibold">hawkEyE</span></span>
            <span className="hidden sm:inline">•</span>
            <span>Powered by 🤖 <a href="https://claude.com/claude-code" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-primary transition-colors">Claude Code</a></span>
          </div>
        </div>
      </div>
    </footer>
  )
}
