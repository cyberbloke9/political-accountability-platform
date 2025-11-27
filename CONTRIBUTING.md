# Contributing to Political Accountability Platform

Thank you for your interest in contributing to the Political Accountability Platform. We welcome contributions from developers, designers, and citizens passionate about political accountability.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Contribution Guidelines](#contribution-guidelines)
5. [Coding Standards](#coding-standards)
6. [Pull Request Process](#pull-request-process)
7. [Issue Guidelines](#issue-guidelines)
8. [Community](#community)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender identity, sexual orientation, disability, personal appearance, race, ethnicity, age, religion, nationality, or political affiliation.

### Our Standards

Examples of encouraged behavior:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards others

Examples of unacceptable behavior:
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

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js 18+ and npm 9+
- Git for version control
- Supabase account (for backend development)
- Code Editor (VS Code recommended)
- Basic knowledge of TypeScript, React, and PostgreSQL

### Setting Up Development Environment

1. Fork the repository
   ```bash
   git clone https://github.com/YOUR_USERNAME/political-accountability-platform.git
   cd political-accountability-platform
   ```

2. Add upstream remote
   ```bash
   git remote add upstream https://github.com/cyberbloke9/political-accountability-platform.git
   ```

3. Install dependencies
   ```bash
   cd frontend
   npm install
   ```

4. Set up Supabase
   - Create a new Supabase project
   - Run migrations from database/migrations/ in sequential order
   - Get your project URL and anon key

5. Configure environment
   ```bash
   cp .env.example frontend/.env.local
   ```

   Edit frontend/.env.local and add your Supabase credentials

6. Run development server
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming Convention

- Feature branches: feature/description-of-feature
- Bug fixes: fix/description-of-bug
- Documentation: docs/what-is-being-documented
- Database changes: db/description-of-changes

Examples:
- feature/promise-filtering
- fix/verification-upload-error
- docs/api-documentation
- db/add-user-preferences

### Commit Message Guidelines

Write clear, descriptive commit messages:

```
Add user authentication flow

- Implement login and signup pages
- Add Supabase auth integration
- Create protected route middleware
```

Format:
- First line: Brief summary (50 characters or less)
- Blank line
- Detailed explanation of changes (wrapped at 72 characters)

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Contribution Guidelines

### Types of Contributions

We welcome:
- Bug reports and fixes
- Feature implementations
- Documentation improvements
- Code refactoring
- Test coverage improvements
- UI/UX enhancements
- Translation contributions (Hindi support planned)

### Before You Start

1. Check existing issues to avoid duplicate work
2. Create or comment on an issue to discuss your plans
3. Wait for maintainer feedback before starting major changes
4. For large features, propose your approach first

### Making Changes

1. Create a new branch from main
2. Make your changes in logical, atomic commits
3. Write or update tests as needed
4. Update documentation if you change functionality
5. Ensure code follows our coding standards
6. Test your changes thoroughly

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode in tsconfig.json
- Define proper types, avoid 'any'
- Use interfaces for object shapes
- Export types that other modules need

Example:
```typescript
interface Promise {
  id: string
  politician_name: string
  promise_text: string
  status: 'pending' | 'fulfilled' | 'broken'
  created_at: Date
}
```

### React Components

- Use functional components with hooks
- One component per file
- Name files with PascalCase (UserProfile.tsx)
- Use descriptive prop names
- Implement proper error boundaries

Example:
```typescript
interface UserProfileProps {
  userId: string
  showAvatar?: boolean
}

export function UserProfile({ userId, showAvatar = true }: UserProfileProps) {
  // Component implementation
}
```

### Code Formatting

- Use 2 spaces for indentation
- Max line length: 100 characters
- Use single quotes for strings
- Add trailing commas in multiline arrays/objects
- Run Prettier before committing

### File Organization

```
src/
├── app/              # Next.js app router pages
├── components/       # Reusable React components
│   ├── ui/          # Base UI components
│   └── layout/      # Layout components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
└── types/           # TypeScript type definitions
```

## Pull Request Process

### Before Submitting

- Ensure all tests pass
- Update documentation as needed
- Run linter and fix any issues
- Test your changes in a clean environment
- Rebase your branch on latest main

### Submitting a Pull Request

1. Push your branch to your fork
2. Open a pull request against the main branch
3. Fill out the pull request template completely
4. Link any related issues
5. Add screenshots for UI changes

### Pull Request Template

```
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

### Review Process

- Maintainers will review your PR within 3-5 business days
- Address any requested changes
- Once approved, a maintainer will merge your PR
- Your contribution will be credited in release notes

## Issue Guidelines

### Creating Issues

When creating an issue, include:

1. Clear, descriptive title
2. Detailed description of the problem or feature
3. Steps to reproduce (for bugs)
4. Expected behavior
5. Actual behavior
6. Screenshots (if applicable)
7. Environment details (browser, OS, Node version)

### Issue Labels

- bug: Something is not working
- enhancement: New feature or improvement
- documentation: Documentation improvements
- good first issue: Good for newcomers
- help wanted: Extra attention needed
- question: Further information requested

## Community

### Communication Channels

- GitHub Issues: Bug reports, feature requests, discussions
- Email: support@political-accountability.in (for sensitive issues)
- Pull Requests: Code reviews and technical discussions

### Getting Help

- Check existing documentation first
- Search closed issues for similar problems
- Ask questions in issue comments
- Be patient and respectful

### Recognition

Contributors are recognized in:
- Release notes
- Contributors list in README
- Project documentation

## Questions?

- General questions: Create a GitHub Issue with "question" label
- Security issues: Email support@political-accountability.in (do NOT create public issue)
- Other concerns: support@political-accountability.in

---

Thank you for contributing to transparency and accountability in Indian politics.
