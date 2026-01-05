# Frontend App Pages Documentation Index

This directory contains documentation for all frontend pages in the Political Accountability Platform.

## Directory Structure

```
md/frontend/src/app/
├── INDEX.md (this file)
├── page.md (Home page)
├── layout.md (Root layout)
├── error.md (Error boundary)
├── not-found.md (404 page)
├── about/
│   └── page.md
├── auth/
│   ├── login.md
│   ├── signup.md
│   ├── verify-email.md
│   ├── forgot-password.md
│   ├── reset-password.md
│   └── callback.md
├── promises/
│   ├── page.md (List)
│   ├── [id].md (Detail)
│   └── new.md (Create)
├── politicians/
│   ├── page.md (List)
│   └── [slug].md (Profile)
├── dashboard/
│   └── page.md
├── admin/
│   ├── page.md (Dashboard)
│   ├── users.md
│   ├── verifications.md
│   ├── fraud.md
│   └── audit.md
├── leaderboard/
│   └── page.md
├── profile/
│   └── page.md
├── verifications/
│   └── new.md
├── contact/
│   └── page.md
├── transparency/
│   └── page.md
├── api/
│   └── feedback.md
├── how-it-works/
│   └── page.md
├── terms/
│   └── page.md
├── privacy/
│   └── page.md
└── guidelines/
    └── page.md
```

## Page Categories

### Public Pages (No Auth Required)
| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page with platform introduction |
| About | `/about` | Platform mission and problems addressed |
| Promises List | `/promises` | Browse and search political promises |
| Promise Detail | `/promises/[id]` | View promise details and verifications |
| Politicians List | `/politicians` | Browse political leaders |
| Politician Profile | `/politicians/[slug]` | View politician details and promises |
| Leaderboard | `/leaderboard` | Top contributors ranking |
| Contact | `/contact` | Feedback form and contact info |
| Transparency | `/transparency` | Public audit log of admin actions |
| How It Works | `/how-it-works` | Platform workflow explanation |
| Terms of Use | `/terms` | Legal terms and conditions |
| Privacy Policy | `/privacy` | Data privacy information |
| Guidelines | `/guidelines` | Community guidelines |

### Authentication Pages
| Page | URL | Description |
|------|-----|-------------|
| Login | `/auth/login` | User sign in |
| Signup | `/auth/signup` | User registration |
| Verify Email | `/auth/verify-email` | Email verification confirmation |
| Forgot Password | `/auth/forgot-password` | Password reset request |
| Reset Password | `/auth/reset-password` | Set new password |
| Auth Callback | `/auth/callback` | OAuth/email verification handler |

### Protected Pages (Auth Required)
| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/dashboard` | User dashboard and activity |
| New Promise | `/promises/new` | Submit a new promise |
| New Verification | `/verifications/new` | Submit verification evidence |
| Profile | `/profile` | User profile (placeholder) |

### Admin Pages (Admin Auth Required)
| Page | URL | Permission | Description |
|------|-----|------------|-------------|
| Admin Dashboard | `/admin` | Any admin role | Overview and quick actions |
| User Management | `/admin/users` | `view_user_details` | Manage platform users |
| Verification Queue | `/admin/verifications` | `view_verification_queue` | Review verifications |
| Fraud Detection | `/admin/fraud` | `manage_fraud` | Review fraud flags |
| Audit Log | `/admin/audit` | Level 1+ | View all admin actions |

### API Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/feedback` | GET | API health check |
| `/api/feedback` | POST | Submit user feedback |

## Common Components Used

### Layout Components
- `Header` - Navigation header
- `Footer` - Site footer
- `AdminLayout` - Admin page wrapper
- `AdminGuard` - Admin permission guard

### UI Components (from @/components/ui)
- Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter
- Button
- Input
- Label
- Textarea
- Badge
- Select, SelectTrigger, SelectContent, SelectItem, SelectValue
- Tabs, TabsList, TabsTrigger, TabsContent
- Table, TableHeader, TableBody, TableRow, TableHead, TableCell
- Progress
- Avatar, AvatarFallback
- Separator
- Popover, PopoverTrigger, PopoverContent
- Calendar

### Hooks
- `useAuth()` - Authentication state and actions
- `useAdmin()` - Admin role and permissions
- `useToast()` - Toast notifications
- `useRealtimeLeaderboard()` - Real-time leaderboard data

### External Libraries
- `sonner` - Toast notifications
- `lucide-react` - Icons
- `date-fns` - Date formatting

## Data Sources

### Supabase Tables
- `users` - User accounts and profiles
- `promises` - Political promises
- `verifications` - Verification submissions
- `admin_roles` - Admin role definitions
- `user_roles` - User-role assignments
- `admin_actions` - Audit log entries
- `fraud_flags` - Fraud detection flags
- `feedback` - User feedback submissions

### Library Functions
- `@/lib/supabase` - Supabase client
- `@/lib/politicians` - Politician data functions
- `@/lib/searchPromises` - Promise search
- `@/lib/adminActions` - Admin action logging
- `@/lib/fraudDetection` - Fraud detection system
- `@/lib/moderationActions` - Moderation functions
- `@/lib/banManagement` - User ban management
