# Contributing to Political Accountability Platform

Thank you for your interest in contributing to the Political Accountability Platform! We welcome contributions from developers, designers, and citizens passionate about political accountability.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Contribution Guidelines](#contribution-guidelines)
5. [Coding Standards](#coding-standards)
6. [Database Guidelines](#database-guidelines)
7. [Testing Requirements](#testing-requirements)
8. [Pull Request Process](#pull-request-process)
9. [Issue Guidelines](#issue-guidelines)
10. [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Experience level (beginners welcome!)
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race or ethnicity
- Age
- Religion (or lack thereof)
- Nationality
- Political affiliation

### Our Standards

**Examples of encouraged behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what's best for the community
- Showing empathy towards others

**Examples of unacceptable behavior:**
- Trolling, insulting comments, or personal attacks
- Public or private harassment
- Publishing others' private information
- Other conduct inappropriate in a professional setting
- Using this platform for political campaigning or propaganda

### Enforcement

Violations of the Code of Conduct may result in:
1. Warning
2. Temporary ban from contributing
3. Permanent ban from the project

Report violations to: support@political-accountability.in

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- **Node.js** 18+ and npm 9+
- **Git** for version control
- **Supabase** account (for backend development)
- **Code Editor** (VS Code recommended)
- Basic knowledge of TypeScript, React, and PostgreSQL

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" button on GitHub
   git clone https://github.com/YOUR_USERNAME/political-accountability-platform.git
   cd political-accountability-platform
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/cyberbloke9/political-accountability-platform.git
   ```

3. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run migrations from `database/migrations/` in order (001-015)
   - Get your project URL and anon key

5. **Configure environment**
   ```bash
   cp .env.example frontend/.env.local
   # Edit frontend/.env.local with your Supabase credentials
   ```

6. **Start development server**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

---

## Development Workflow

### Branching Strategy

We use a simple Git flow:

```
main (production)
  ↓
feature/your-feature-name (your work)
```

**Branch naming conventions:**
- `feature/` - New features (e.g., `feature/comments-system`)
- `fix/` - Bug fixes (e.g., `fix/voting-bug`)
- `docs/` - Documentation updates (e.g., `docs/setup-guide`)
- `refactor/` - Code refactoring (e.g., `refactor/api-client`)
- `test/` - Test additions (e.g., `test/verification-tests`)

### Creating a Feature Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Rebase your branch onto latest main
git rebase upstream/main

# Force push to your fork (if already pushed)
git push --force-with-lease origin feature/your-feature-name
```

---

## Contribution Guidelines

### What to Contribute

**We welcome contributions for:**

1. **Bug Fixes**
   - Fix reported issues
   - Improve error handling
   - Fix UI/UX bugs

2. **New Features**
   - Check [NEXT_PHASES.md](./NEXT_PHASES.md) for planned features
   - Propose new ideas via GitHub Issues first
   - Implement features from our roadmap

3. **Documentation**
   - Improve README and guides
   - Add code comments
   - Write tutorials

4. **Performance Improvements**
   - Optimize database queries
   - Reduce bundle size
   - Improve page load times

5. **UI/UX Enhancements**
   - Improve accessibility
   - Enhance mobile experience
   - Fix design inconsistencies

6. **Testing**
   - Add unit tests
   - Add integration tests
   - Add E2E tests

**Please DON'T:**
- Submit large PRs without prior discussion
- Add dependencies without justification
- Change core architecture without consensus
- Submit political content or biased changes
- Add features that conflict with our mission

### Before Starting Work

1. **Check existing issues** - Someone might already be working on it
2. **Create an issue** - Describe what you want to build
3. **Wait for approval** - Maintainers will review and provide feedback
4. **Discuss approach** - Get consensus on implementation
5. **Start coding** - Follow our coding standards

---

## Coding Standards

### TypeScript

```typescript
// ✅ GOOD: Clear types, descriptive names
interface VerificationData {
  id: string
  evidenceText: string
  verdict: 'fulfilled' | 'broken' | 'in_progress' | 'stalled'
  status: 'pending' | 'approved' | 'rejected'
}

async function approveVerification(id: string): Promise<void> {
  // Implementation
}

// ❌ BAD: Any types, unclear names
interface Data {
  id: any
  text: string
  v: string
}

function approve(x: string): Promise<any> {
  // Implementation
}
```

### React Components

```typescript
// ✅ GOOD: Functional component with TypeScript
interface VerificationCardProps {
  verification: VerificationData
  onVoteChange?: () => void
}

export function VerificationCard({
  verification,
  onVoteChange
}: VerificationCardProps) {
  // Implementation
}

// ❌ BAD: Missing types
export function VerificationCard({ verification, onVoteChange }) {
  // Implementation
}
```

### File Naming

- **Components**: PascalCase (e.g., `VerificationCard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Types**: PascalCase (e.g., `VerificationTypes.ts`)

### Code Style

```typescript
// ✅ GOOD: Consistent formatting
const handleVote = async (voteType: 'upvote' | 'downvote') => {
  if (!user) {
    toast.error('You must be logged in to vote')
    return
  }

  try {
    await submitVote(voteType)
    toast.success('Vote recorded!')
  } catch (error) {
    console.error('Error voting:', error)
    toast.error('Failed to record vote')
  }
}

// ❌ BAD: Inconsistent formatting, no error handling
const handleVote = async (voteType) => {
if(!user){ toast.error('You must be logged in to vote'); return; }
await submitVote(voteType);
toast.success('Vote recorded!')
}
```

### Comments

```typescript
// ✅ GOOD: Clear explanations
// Calculate weighted trust score based on user's trust level
// Admin: 3.0x, Trusted: 2.0x, Community: 1.0x, Untrusted: 0.5x
const calculateWeight = (trustLevel: TrustLevel): number => {
  const weights = { admin: 3.0, trusted_community: 2.0, community: 1.0, untrusted: 0.5 }
  return weights[trustLevel] || 1.0
}

// ❌ BAD: Obvious or missing comments
// This function calculates weight
const calculateWeight = (trustLevel) => {
  return trustLevel === 'admin' ? 3.0 : 1.0 // magic numbers
}
```

---

## Database Guidelines

### Migration Files

**Always create migrations for database changes:**

```sql
-- Migration: 016_vote_brigade_detection.sql
-- Description: Add vote brigade detection tables
-- Author: Your Name
-- Date: 2025-11-27

-- Create vote brigade patterns table
CREATE TABLE vote_brigade_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_ids UUID[] NOT NULL,
  verification_ids UUID[] NOT NULL,
  detection_timestamp TIMESTAMPTZ DEFAULT NOW(),
  confidence_score DECIMAL(3,2),
  pattern_type TEXT,
  flagged BOOLEAN DEFAULT TRUE
);

-- Add indexes for performance
CREATE INDEX idx_brigade_timestamp
ON vote_brigade_patterns(detection_timestamp DESC);

-- Add Row-Level Security
ALTER TABLE vote_brigade_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view vote brigades"
ON vote_brigade_patterns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_admin_roles uar
    WHERE uar.user_id = auth.uid()
  )
);
```

### Database Best Practices

**DO:**
- Always add Row-Level Security (RLS) policies
- Create indexes for frequently queried columns
- Use foreign key constraints
- Add NOT NULL constraints where appropriate
- Use meaningful column names
- Document complex queries

**DON'T:**
- Modify existing migrations (create new ones)
- Use generic names like `data`, `info`, `stuff`
- Forget to handle CASCADE deletes
- Skip RLS policies
- Use TEXT for everything (use appropriate types)

### Query Optimization

```typescript
// ✅ GOOD: Efficient query with specific fields
const { data } = await supabase
  .from('verifications')
  .select(`
    id,
    evidence_text,
    verdict,
    status,
    submitter:users!submitted_by (
      username,
      citizen_score
    )
  `)
  .eq('status', 'approved')
  .order('created_at', { ascending: false })
  .limit(20)

// ❌ BAD: Fetching all data, no limit
const { data } = await supabase
  .from('verifications')
  .select('*')
```

---

## Testing Requirements

### Current State

We're currently building the testing infrastructure. For now:

**Manual Testing Required:**
- Test your changes in development
- Test on mobile (responsive design)
- Test with different user roles (admin, regular user, logged out)
- Test error states

### Future Testing (We Need Your Help!)

We're looking for contributors to help build:

1. **Unit Tests** (Vitest)
   ```typescript
   // Example: tests/utils/calculateTrustWeight.test.ts
   import { describe, it, expect } from 'vitest'
   import { calculateTrustWeight } from '@/lib/trustUtils'

   describe('calculateTrustWeight', () => {
     it('returns 3.0 for admin users', () => {
       expect(calculateTrustWeight('admin')).toBe(3.0)
     })

     it('returns 0.5 for untrusted users', () => {
       expect(calculateTrustWeight('untrusted')).toBe(0.5)
     })
   })
   ```

2. **Integration Tests** (Testing Library)
   - Test component interactions
   - Test form submissions
   - Test API calls

3. **E2E Tests** (Playwright)
   - Test complete user flows
   - Test authentication
   - Test verification submission

---

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows our style guide
- [ ] TypeScript types are properly defined
- [ ] No console.log statements (use proper error handling)
- [ ] Tested manually on desktop and mobile
- [ ] No ESLint errors
- [ ] Database migrations tested in Supabase
- [ ] Updated relevant documentation
- [ ] Committed with meaningful messages

### Commit Messages

Follow Conventional Commits:

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat: Add new feature
fix: Fix a bug
docs: Documentation changes
style: Code formatting (no functional changes)
refactor: Code restructuring
test: Add tests
chore: Maintenance tasks

# Examples:
git commit -m "feat(verification): add self-verification warning badges"
git commit -m "fix(voting): prevent duplicate vote submissions"
git commit -m "docs(readme): update installation instructions"
git commit -m "refactor(api): simplify trust level calculation"
```

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub**
   - Go to your fork on GitHub
   - Click "Compare & pull request"
   - Fill out the PR template

3. **PR Template**
   ```markdown
   ## Description
   Brief description of what this PR does

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Related Issue
   Fixes #123

   ## Testing
   - [ ] Tested on desktop
   - [ ] Tested on mobile
   - [ ] Tested with different user roles

   ## Screenshots (if applicable)
   Add screenshots of UI changes

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] No ESLint errors
   - [ ] Documentation updated
   - [ ] Ready for review
   ```

### Review Process

1. **Automated Checks**
   - Vercel build must succeed
   - No ESLint errors

2. **Code Review**
   - Maintainer reviews code
   - May request changes
   - Address feedback promptly

3. **Approval & Merge**
   - Once approved, maintainer merges
   - PR branch auto-deleted
   - Changes deploy to production

---

## Issue Guidelines

### Reporting Bugs

**Use the bug report template:**

```markdown
**Describe the bug**
Clear description of what went wrong

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen

**Screenshots**
Add screenshots if applicable

**Environment:**
 - OS: [e.g., Windows 11]
 - Browser: [e.g., Chrome 120]
 - Device: [e.g., iPhone 12]

**Additional context**
Any other relevant information
```

### Requesting Features

**Use the feature request template:**

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
What you want to happen

**Describe alternatives you've considered**
Other solutions you thought about

**Additional context**
Mockups, examples, references

**Implementation notes** (if you know how to build it)
Technical approach, APIs needed, etc.
```

### Good Issue Examples

**✅ GOOD:**
```
Title: Add trust level badges to verification cards

Description:
Users should be able to see the trust level of the person who submitted
a verification. This helps them assess credibility.

Currently, verification cards show username and citizen score, but not trust level.

Proposed solution:
- Add colored badge showing trust level (Admin/Trusted/Community/Untrusted)
- Include weight multiplier (e.g., "Trusted (2.0x)")
- Use consistent colors with profile page

References:
- Similar to profile page trust badges
- See PLATFORM_OVERVIEW.md for trust level definitions
```

**❌ BAD:**
```
Title: add badges

Description:
badges dont show
```

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests, discussions
- **Email**: support@political-accountability.in (for sensitive issues)
- **Pull Requests**: Code reviews and technical discussions

### Getting Help

**Stuck on something?**

1. Check existing documentation (README, PLATFORM_OVERVIEW, TECH_STACK)
2. Search GitHub Issues for similar problems
3. Create a new issue with the "question" label
4. Be specific about what you're trying to do

### Recognition

We recognize contributors in several ways:

1. **Contributors File**: All contributors listed in README
2. **Commit Attribution**: Your name in git history
3. **Release Notes**: Major contributions highlighted
4. **GitHub Contributions**: Shows on your profile

### First-Time Contributors

**Never contributed to open source before? Perfect!**

Look for issues labeled:
- `good first issue` - Easy tasks for beginners
- `help wanted` - We need help with these
- `documentation` - Improve docs (great first contribution!)

We're here to help you get started!

---

## Development Tips

### Useful Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Start production build locally
npm start

# Check for outdated dependencies
npm outdated
```

### Debugging

```typescript
// ✅ GOOD: Proper error logging
try {
  await submitVerification(data)
} catch (error) {
  console.error('Error submitting verification:', error)
  if (error instanceof Error) {
    toast.error(error.message)
  }
}

// ❌ BAD: Silent failures
try {
  await submitVerification(data)
} catch (error) {
  // Nothing
}
```

### Environment Variables

```bash
# Development (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_dev_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_key

# Never commit:
.env
.env.local
.env.*.local
```

---

## License

By contributing to the Political Accountability Platform, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

- **General questions**: Create a GitHub Issue with "question" label
- **Security issues**: Email support@political-accountability.in (do NOT create public issue)
- **Other concerns**: support@political-accountability.in

---

**Thank you for contributing to transparency and accountability in Indian politics!**

Together, we can build a platform that empowers citizens to hold political leaders accountable.

---

**Last Updated:** November 27, 2025
