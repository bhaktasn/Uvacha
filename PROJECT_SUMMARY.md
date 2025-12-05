# Uvacha - Project Summary

## Overview

Uvacha is a modern Next.js application for user profile management with cryptocurrency wallet integration and social media account linking. Built with TypeScript, Supabase, and Tailwind CSS.

## Project Structure

```
Uvacha/
├── app/                                 # Next.js App Router
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts                 # OAuth callback handler
│   ├── login/
│   │   └── page.tsx                     # Login page
│   ├── signup/
│   │   └── page.tsx                     # Signup page
│   ├── profile/
│   │   └── page.tsx                     # Profile management page
│   ├── videos/
│   │   └── page.tsx                     # Video upload + scheduling dashboard
│   ├── api/
│   │   └── videos/                      # REST routes to talk to MUX
│   ├── layout.tsx                       # Root layout
│   ├── page.tsx                         # Home page
│   └── globals.css                      # Global styles
│
├── lib/                                 # Utility libraries
│   ├── supabase/
│   │   ├── client.ts                    # Browser-side Supabase client
│   │   ├── server.ts                    # Server-side Supabase client
│   │   └── middleware.ts                # Supabase auth middleware
│   ├── mux/
│   │   └── client.ts                    # Thin wrapper around @mux/mux-node
│   ├── types/
│   │   └── database.ts                  # TypeScript database types
│   └── utils/
│       ├── wallet-validation.ts         # USDC wallet address validation
│       └── social-validation.ts         # Social media handle validation
│
├── middleware.ts                        # Next.js middleware (auth protection)
├── .env.local                           # Environment variables (create this)
├── .env.local.example                   # Environment template
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript configuration
├── tailwind.config.ts                   # Tailwind CSS configuration
│
└── Documentation/
    ├── README.md                        # Main documentation
    ├── QUICKSTART.md                    # Quick start guide
    ├── DATABASE_SETUP.md                # Detailed database setup
    └── PROJECT_SUMMARY.md              # This file
```

## Features Implemented

### ✅ Authentication
- Email/password authentication via Supabase Auth
- Protected routes using Next.js middleware
- Automatic session management
- Email verification support

### ✅ User Profiles
- One-to-one relationship with auth users
- Email address (read-only)
- Optional USDC wallet address
- Optional Twitter/X handle
- Optional Instagram handle
- Automatic timestamps (created_at, updated_at)

### ✅ Wallet Validation
- Supports Ethereum/EVM addresses (0x...)
- Supports Solana addresses
- Real-time validation with user feedback
- Chain detection (Ethereum vs Solana)

### ✅ Social Media Validation
- Twitter/X handle validation (1-15 chars, alphanumeric + underscores)
- Instagram handle validation (1-30 chars, alphanumeric + underscores + periods)
- Handles stored without @ symbol
- Real-time validation feedback

### ✅ Video Hosting & Scheduling
- `/videos` dashboard collects title, description, AI/Human flag, unlock date, and the media file
- Uploads stream directly to MUX via signed URLs issued by `/api/videos/upload-session`
- Server polls `/api/videos/finalize` to create Supabase `videos` rows once MUX assets are ready
- `unlock_at` gating ensures only released videos appear in public feeds (RLS still lets creators see unreleased items)
- Playback IDs from MUX are surfaced so the frontend can request `https://stream.mux.com/{playback_id}.m3u8`

### ✅ Security
- Row Level Security (RLS) on profiles table
- Users can only access/modify their own data
- Secure session management
- Environment variables for sensitive data

### ✅ UI/UX
- Modern, responsive design with Tailwind CSS
- Clean forms with validation feedback
- Loading states and error handling
- Success notifications
- Mobile-friendly interface

## Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js | 14+ (App Router) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Database | PostgreSQL | (via Supabase) |
| Auth | Supabase Auth | - |
| Client Library | @supabase/supabase-js | 2.x |
| SSR Helper | @supabase/ssr | 0.7+ |

## Database Schema

The complete SQL schema, indexes, triggers, and RLS policies now live exclusively in [`DATABASE_SETUP.md`](./DATABASE_SETUP.md). Use that document whenever you need to recreate or audit the database.

**Highlights**
- `profiles` table keeps a one-to-one relationship with `auth.users` along with wallet + social handles.
- RLS enforces self-access for `SELECT`, `INSERT`, and `UPDATE` (optional delete policy documented there as well).
- Email and wallet columns are indexed for quick lookups; triggers keep `updated_at` fresh.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Home page |
| `/signup` | GET | Signup page |
| `/login` | GET | Login page |
| `/profile` | GET | Profile page (protected) |
| `/videos` | GET | Video upload + scheduling dashboard (protected) |
| `/auth/callback` | GET | OAuth callback handler |
| `/api/videos/upload-session` | POST | Creates a signed MUX direct-upload URL |
| `/api/videos/finalize` | POST | Poll MUX for asset status and persist into Supabase |

## Environment Variables

Required variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
MUX_TOKEN_ID=your-mux-token-id
MUX_TOKEN_SECRET=your-mux-token-secret
MUX_DIRECT_UPLOAD_CORS_ORIGIN=http://localhost:3000
```

`MUX_DIRECT_UPLOAD_CORS_ORIGIN` is optional but prevents strangers from reusing your signed upload URLs.

## Validation Rules

### USDC Wallet Address
- **Ethereum/EVM**: Must start with `0x` followed by 40 hex characters
- **Solana**: 32-44 base58 characters
- **Examples**:
  - Ethereum: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
  - Solana: `7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi`

### Twitter/X Handle
- 1-15 characters
- Alphanumeric and underscores only
- Case insensitive
- Stored without @ symbol

### Instagram Handle
- 1-30 characters
- Alphanumeric, underscores, and periods
- Cannot end with a period
- Stored without @ symbol

## Key Functions

### Authentication
- `createClient()` - Creates Supabase client (browser/server)
- `updateSession()` - Middleware to refresh sessions
- `signUp()` - Create new user account
- `signInWithPassword()` - Sign in existing user
- `signOut()` - Sign out current user

### Validation
- `validateUSDCAddress()` - Validates wallet address and detects chain
- `isValidTwitterHandle()` - Validates Twitter handle format
- `isValidInstagramHandle()` - Validates Instagram handle format
- `normalizeSocialHandle()` - Removes @ symbol if present

## Getting Started

### Quick Setup (5 minutes)
1. Run `npm install`
2. Create Supabase project
3. Run SQL setup script
4. Add credentials to `.env.local`
5. Run `npm run dev`

See [QUICKSTART.md](./QUICKSTART.md) for detailed steps.

### Full Documentation
- [README.md](./README.md) - Complete documentation
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database setup guide
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Deployment

### Recommended Platforms
- **Vercel** (easiest, made by Next.js creators)
- **Netlify**
- **Railway**
- **AWS Amplify**

### Pre-Deployment Checklist
- [ ] Set environment variables on hosting platform
- [ ] Update Supabase Site URL to production domain
- [ ] Add production callback URL to Supabase
- [ ] Enable email confirmation (optional but recommended)
- [ ] Test authentication flow
- [ ] Test profile updates
- [ ] Monitor Supabase logs

## Future Enhancements

Potential features to add:
- Profile picture upload
- More crypto wallets (Bitcoin, Ethereum tokens)
- Additional social platforms (LinkedIn, Discord, TikTok)
- Two-factor authentication
- Profile sharing with QR codes
- Export profile data
- Profile analytics
- Admin dashboard

## Security Best Practices

✅ **Implemented**
- Row Level Security on database
- Environment variables for secrets
- HTTPS-only cookies
- Secure session management
- Input validation

🔜 **Recommended for Production**
- Rate limiting on auth endpoints
- Email verification requirement
- Password strength requirements
- CAPTCHA on signup
- Audit logging
- Security headers

## Performance Considerations

- Use server components where possible
- Implement proper caching strategies
- Optimize images (Next.js Image component)
- Monitor database query performance
- Add indexes for frequently queried fields
- Use connection pooling in production

## Testing Suggestions

### Manual Testing Checklist
- [ ] Sign up with new account
- [ ] Confirm email (if enabled)
- [ ] Sign in
- [ ] Access profile page
- [ ] Add valid Ethereum wallet
- [ ] Add valid Solana wallet
- [ ] Add invalid wallet (test validation)
- [ ] Add Twitter handle
- [ ] Add Instagram handle
- [ ] Update profile
- [ ] Sign out
- [ ] Try accessing profile while logged out (should redirect)

### Automated Testing (Not Implemented)
Consider adding:
- Unit tests for validation functions
- Integration tests for API routes
- E2E tests with Playwright or Cypress
- Component tests with React Testing Library

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs

## License

MIT License - Feel free to use this project as a template for your own applications.

---

Built with ❤️ using Next.js, TypeScript, Supabase, and Tailwind CSS

**Created**: November 2025  
**Version**: 1.0.0  
**Status**: Production Ready

