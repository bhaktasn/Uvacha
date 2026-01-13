# Quick Start Guide

Get up and running with Uvacha in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project (any name/region you like)
3. Grab the **Project URL** and **anon key** from **Project Settings → API**
4. Need extra guidance? Follow the "Create a Supabase Project" section in [`DATABASE_SETUP.md`](./DATABASE_SETUP.md)

### 3. Set Up Database & Auth

1. Open the Supabase **SQL Editor** and paste the schema from [Step 3 of `DATABASE_SETUP.md`](./DATABASE_SETUP.md#step-3-create-the-database-schema)
2. Run the script to create the `profiles` and `videos` tables, indexes, triggers, and RLS policies (includes `unlock_at` + MUX metadata)
3. Still in Supabase, go to **Authentication → URL Configuration** and add:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`
4. The same doc covers verification steps and troubleshooting if anything fails

### 4. Configure Environment

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
MUX_TOKEN_ID=your-mux-token-id
MUX_TOKEN_SECRET=your-mux-token-secret
# Optional: locks direct uploads to your dev domain
MUX_DIRECT_UPLOAD_CORS_ORIGIN=http://localhost:3000
```

### 5. Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Upload a Video

1. Sign in, then navigate to `/videos`.
2. Enter the title, description, choose whether it is AI or Human generated, and pick an unlock date.
3. Select a video file (uploads go straight to MUX via a signed URL returned by `/api/videos/upload-session`).
4. Wait for the processing status to flip to “Video uploaded!”—the UI automatically polls `/api/videos/finalize` until the asset is saved inside Supabase.

## Test the App

1. Click "Get Started" to create an account
2. Enter your email and password
3. Check your email for confirmation (or disable email confirmation in Supabase Auth settings for testing)
4. Sign in and go to your profile
5. Choose a username (3–24 characters, lowercase letters, numbers, underscores). It’s stored lowercase for uniqueness.
6. Try adding a wallet address:
   - Ethereum example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
   - Solana example: `7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi`
7. Add social media handles (without @):
   - Twitter: `username`
   - Instagram: `username`

## What's Next?

- Read the full [README.md](./README.md) for detailed documentation
- Check [DATABASE_SETUP.md](./DATABASE_SETUP.md) for advanced database configuration
- Customize the styling in `app/globals.css`
- Deploy to Vercel, Netlify, or your preferred platform

## Need Help?

- Check the troubleshooting section in README.md
- Review Supabase logs in the dashboard
- Check browser console for errors

---

Happy coding! 🚀

