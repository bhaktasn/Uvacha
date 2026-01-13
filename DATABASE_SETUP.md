# Supabase Database Setup Guide

This guide provides detailed instructions for setting up the Supabase PostgreSQL database for the Uvacha profile application.  
**This is the canonical reference for database setup — all other docs link here to avoid duplication.**

## Quick Reference

- **Full setup (everything):** Follow Steps 1–9 below.
- **Just need the SQL schema?** Jump to [Step 3: Create the Database Schema](#step-3-create-the-database-schema).
- **Need auth URLs or API keys?** See [Step 7](#step-7-configure-authentication-settings) and [Step 8](#step-8-get-your-api-credentials).
- **Want to sanity-check the database?** Use [Step 9: Test the Database](#step-9-test-the-database).

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Access to your Supabase project dashboard

## Step-by-Step Setup

### Step 1: Create a New Supabase Project

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Select your organization (or create a new one)
4. Fill in the project details:
   - **Name**: `Uvacha` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your target users for better performance
   - **Pricing Plan**: Free tier is sufficient for development and small-scale production
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be provisioned

### Step 2: Access the SQL Editor

1. In your project dashboard, navigate to the left sidebar
2. Click on **"SQL Editor"** (icon looks like a terminal/console)
3. Click **"New query"** button in the top right

### Step 3: Create the Database Schema

Copy and paste the following SQL script into the SQL Editor:

```sql
-- ============================================
-- Uvacha Database Schema (Profiles + Videos)
-- ============================================

-- Enable pgcrypto for UUID generation used by the videos table
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the profiles table
-- This table stores user profile information including wallet and social media data
CREATE TABLE profiles (
  -- Primary key that references the auth.users table
  -- This creates a one-to-one relationship with Supabase Auth users
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User's email address (required)
  email TEXT NOT NULL,
  
  -- Username handle (optional but must be unique if provided)
  -- Stored in lowercase to keep lookups consistent
  username TEXT,
  
  -- USDC wallet address (optional)
  -- Can be Ethereum-style (0x...) or Solana address
  usdc_wallet_address TEXT,
  
  -- Twitter/X handle (optional, stored without @ symbol)
  twitter_handle TEXT,
  
  -- Instagram handle (optional, stored without @ symbol)
  instagram_handle TEXT,
  
  -- Timestamp of when the profile was created
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamp of the last profile update
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the videos table
-- Stores metadata for videos uploaded to MUX with release scheduling
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References the owner (profile/auth user)
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Content metadata
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 5000),
  
  -- Track whether the video was made by AI or a human
  generation_source TEXT NOT NULL DEFAULT 'human'
    CHECK (generation_source IN ('ai', 'human')),
  
  -- MUX asset ids so we can create playback sessions
  mux_asset_id TEXT NOT NULL,
  mux_playback_id TEXT,

  -- Lightweight aggregate surfaced on the video detail page
  view_count BIGINT NOT NULL DEFAULT 0,
  
  -- Scheduled release timestamp; only videos with unlock_at <= now() are public
  unlock_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the comments table so viewers can discuss each video
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 750),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the comment_votes table for up/down votes on every comment
CREATE TABLE comment_votes (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  PRIMARY KEY (comment_id, profile_id)
);

-- Create the video_ratings table so every authenticated viewer can rate drops
CREATE TABLE video_ratings (
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  PRIMARY KEY (video_id, profile_id)
);

-- Helper to atomically increment a video's view count
CREATE OR REPLACE FUNCTION increment_video_view_count(video_uuid UUID)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  incremented BIGINT;
BEGIN
  UPDATE videos
  SET view_count = COALESCE(view_count, 0) + 1,
      updated_at = NOW()
  WHERE id = video_uuid
  RETURNING view_count INTO incremented;

  RETURN incremented;
END;
$$;

-- ============================================
-- Row Level Security (RLS) Configuration
-- ============================================

-- Enable Row Level Security on the profiles table
-- This ensures users can only access their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to view only their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Allow users to update only their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy 3: Allow users to insert only their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 4: (Optional) Allow users to delete their own profile
-- Uncomment if you want users to be able to delete their profiles
-- CREATE POLICY "Users can delete own profile"
--   ON profiles
--   FOR DELETE
--   USING (auth.uid() = id);

-- Enable RLS on videos so creators manage their own uploads
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Policy: creators can manage (select/insert/update/delete) their own videos
CREATE POLICY "Creators manage own videos"
  ON videos
  FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Policy: any viewer can see videos that have been unlocked
CREATE POLICY "View unlocked videos"
  ON videos
  FOR SELECT
  USING (unlock_at <= NOW());

-- Comments are viewable by anyone, but only the author can write/update them
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View published comments"
  ON comments
  FOR SELECT
  USING (true);

CREATE POLICY "Authors manage their comments"
  ON comments
  FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Comment votes are public, but only the voter can change their vote
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View comment votes"
  ON comment_votes
  FOR SELECT
  USING (true);

CREATE POLICY "Users manage their votes"
  ON comment_votes
  FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Video ratings are public, but only the author can change their submission
ALTER TABLE video_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View video ratings"
  ON video_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Users manage their video ratings"
  ON video_ratings
  FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Create an index on the email column for faster lookups
CREATE INDEX idx_profiles_email ON profiles(email);

-- Enforce case-insensitive uniqueness on usernames when present
CREATE UNIQUE INDEX idx_profiles_username_lower ON profiles (lower(username)) WHERE username IS NOT NULL;

-- Create an index on wallet address for faster searches
CREATE INDEX idx_profiles_wallet ON profiles(usdc_wallet_address) 
  WHERE usdc_wallet_address IS NOT NULL;

-- Videos indexes for quick lookups and filtered feeds
CREATE INDEX idx_videos_profile_id ON videos(profile_id);
CREATE INDEX idx_videos_unlock_at ON videos(unlock_at);
CREATE UNIQUE INDEX idx_videos_mux_asset_id ON videos(mux_asset_id);

-- Comment indexes keep discussion queries fast
CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX idx_comment_votes_profile_id ON comment_votes(profile_id);

-- Rating indexes support summary queries
CREATE INDEX idx_video_ratings_video_id ON video_ratings(video_id);
CREATE INDEX idx_video_ratings_profile_id ON video_ratings(profile_id);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the update function before any UPDATE operation
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comment_votes_updated_at
  BEFORE UPDATE ON comment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_ratings_updated_at
  BEFORE UPDATE ON video_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Optional: Validation Functions
-- ============================================

-- Function to validate email format (additional server-side validation)
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for email validation
ALTER TABLE profiles 
  ADD CONSTRAINT check_email_format 
  CHECK (is_valid_email(email));

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE profiles IS 'User profile information including wallet addresses and social media handles';
COMMENT ON COLUMN profiles.id IS 'User ID from auth.users table';
COMMENT ON COLUMN profiles.email IS 'User email address';
COMMENT ON COLUMN profiles.username IS 'Lowercase vanity handle (3-24 chars, letters/numbers/underscores)';
COMMENT ON COLUMN profiles.usdc_wallet_address IS 'USDC wallet address (Ethereum or Solana)';
COMMENT ON COLUMN profiles.twitter_handle IS 'Twitter/X handle without @ symbol';
COMMENT ON COLUMN profiles.instagram_handle IS 'Instagram handle without @ symbol';

COMMENT ON TABLE videos IS 'MUX-hosted video metadata with release windows';
COMMENT ON COLUMN videos.profile_id IS 'Owner of the video; references profiles.id/auth.uid()';
COMMENT ON COLUMN videos.generation_source IS 'Whether the video was AI or human generated';
COMMENT ON COLUMN videos.mux_asset_id IS 'MUX asset ID returned after an upload';
COMMENT ON COLUMN videos.mux_playback_id IS 'MUX playback ID used for streaming';
COMMENT ON COLUMN videos.view_count IS 'Aggregate view counter surfaced in the UI';
COMMENT ON COLUMN videos.unlock_at IS 'Timestamp when the video becomes publicly viewable';

COMMENT ON TABLE video_ratings IS 'Per-video star ratings submitted by authenticated viewers';
COMMENT ON COLUMN video_ratings.video_id IS 'Video that is being reviewed';
COMMENT ON COLUMN video_ratings.profile_id IS 'Viewer that left the rating';
COMMENT ON COLUMN video_ratings.rating IS 'Whole-number score between 1 (Slop) and 5 (Art)';
```

### Step 4: Execute the Script

1. After pasting the SQL script, review it to ensure it's complete
2. Click the **"Run"** button (or press `Cmd/Ctrl + Enter`)
3. Wait for the script to execute
4. You should see a success message: "Success. No rows returned"

### Step 5: Verify the Setup

1. Navigate to **"Table Editor"** in the left sidebar
2. You should see the `profiles` table listed
3. Click on the `profiles` table to view its structure
4. Verify that all columns are present:
   - id (uuid)
   - email (text)
   - usdc_wallet_address (text, nullable)
   - twitter_handle (text, nullable)
   - instagram_handle (text, nullable)
   - created_at (timestamp)
   - updated_at (timestamp)
5. In the same Table Editor, confirm the new `videos` table exists. It should include:
   - id (uuid, default generated)
   - profile_id (uuid, references profiles.id)
   - title (text)
   - description (text)
   - generation_source (text, constrained to `ai` or `human`)
   - mux_asset_id (text)
   - mux_playback_id (text, nullable)
   - view_count (bigint, default 0)
   - unlock_at (timestamptz)
   - created_at / updated_at (timestamptz)
6. Confirm the `video_ratings` table exists with:
   - video_id (uuid, references videos.id)
   - profile_id (uuid, references profiles.id)
   - rating (smallint, 1–5)
   - created_at / updated_at (timestamptz)
   - Primary key over (video_id, profile_id)
7. Optional sanity check: insert a dummy row via the Table Editor to ensure Supabase enforces the generation source constraint, release timestamp requirements, and rating bounds.

### Step 6: Verify RLS Policies

1. In the Table Editor, click on the `profiles` table
2. Click on the **"RLS"** or **"Policies"** tab
3. Verify the `profiles` policies exist:
   - "Users can view own profile"
   - "Users can update own profile"
   - "Users can insert own profile"
4. Switch to the `videos` table, open the **Policies** tab, and check for:
   - "Creators manage own videos"
   - "View unlocked videos"
5. Open the `video_ratings` table policies and confirm:
   - "View video ratings"
   - "Users manage their video ratings"
6. Ensure RLS toggles are enabled for all tables above.

### Step 7: Configure Authentication Settings

1. Navigate to **"Authentication"** in the left sidebar
2. Click on **"URL Configuration"**
3. Add your development URL:
   - **Site URL**: `http://localhost:3000`
4. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**` (wildcard for all routes)
5. Click **"Save"**

### Step 8: Get Your API Credentials

1. Navigate to **"Project Settings"** (gear icon in the left sidebar)
2. Click on **"API"** in the settings menu
3. Copy the following values (you'll need these for your `.env.local` file):
   - **Project URL**: Found under "Project URL"
   - **anon/public key**: Found under "Project API keys"

Example:
```
Project URL: https://abcdefghijklmnop.supabase.co
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 9: Test the Database

You can test the database by running a simple query:

1. Go back to **"SQL Editor"**
2. Create a new query
3. Run this test query:

```sql
-- This should return an empty result (no profiles yet)
SELECT * FROM profiles;

-- Test that RLS is working (should return nothing when not authenticated)
SELECT * FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000';
```

## Updating Existing Projects for Video Ratings (November 2025)

If your Supabase project was created before the star-rating launch, run the patch script below inside the SQL Editor to add the `video_ratings` table, permissions, indexes, and trigger without recreating the entire schema.

```sql
CREATE TABLE IF NOT EXISTS video_ratings (
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (video_id, profile_id)
);

ALTER TABLE video_ratings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_ratings' AND policyname = 'View video ratings'
  ) THEN
    CREATE POLICY "View video ratings"
      ON video_ratings
      FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'video_ratings' AND policyname = 'Users manage their video ratings'
  ) THEN
    CREATE POLICY "Users manage their video ratings"
      ON video_ratings
      FOR ALL
      USING (auth.uid() = profile_id)
      WITH CHECK (auth.uid() = profile_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_video_ratings_video_id ON video_ratings(video_id);
CREATE INDEX IF NOT EXISTS idx_video_ratings_profile_id ON video_ratings(profile_id);

DROP TRIGGER IF EXISTS update_video_ratings_updated_at ON video_ratings;
CREATE TRIGGER update_video_ratings_updated_at
  BEFORE UPDATE ON video_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE video_ratings IS 'Per-video star ratings submitted by authenticated viewers';
COMMENT ON COLUMN video_ratings.video_id IS 'Video that is being reviewed';
COMMENT ON COLUMN video_ratings.profile_id IS 'Viewer that left the rating';
COMMENT ON COLUMN video_ratings.rating IS 'Whole-number score between 1 (Slop) and 5 (Art)';
```

After running the script:

1. Confirm the new table exists under **Table Editor → Data → video_ratings**.
2. Verify both policies are present under the **RLS** tab.
3. Use the **Triggers** tab to ensure `update_video_ratings_updated_at` is enabled.
4. Insert a manual test rating to make sure the `rating` constraint (1–5) is enforced.

## Video Release Windows & Queries

- **Only return unlocked videos** by filtering on `unlock_at <= timezone('utc', now())`. This keeps unreleased uploads hidden from public feeds while still being visible to their creators through RLS.
- **Sample unlocked feed query** (works in SQL Editor or Supabase APIs):

```sql
SELECT
  v.id,
  v.title,
  v.description,
  v.generation_source,
  v.mux_playback_id,
  v.unlock_at,
  p.twitter_handle AS creator_twitter
FROM videos v
JOIN profiles p ON p.id = v.profile_id
WHERE v.unlock_at <= timezone('utc', now())
ORDER BY v.unlock_at DESC;
```

- **Scheduling uploads**: when inserting, set `unlock_at` to any future timestamp (UTC). Videos default to unlocking immediately (`NOW()`) if you omit the value.
- **MUX integration**: store the returned `mux_asset_id` and optional `mux_playback_id` so the app can request ready-to-stream URLs via MUX's Playback API.

## Updating an Existing Supabase Project for View Counts

If your Supabase project was provisioned before the view counter feature existed, run the
following SQL snippet from the SQL Editor to add the new column and helper function:

```sql
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_video_view_count(video_uuid UUID)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  incremented BIGINT;
BEGIN
  UPDATE videos
  SET view_count = COALESCE(view_count, 0) + 1,
      updated_at = NOW()
  WHERE id = video_uuid
  RETURNING view_count INTO incremented;

  RETURN incremented;
END;
$$;
```

Re-run this section if you ever need to recreate the helper function. No data migrations are
required beyond adding the column—existing rows default to `0` views.

## Database Schema Explanation

### Profiles Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key, references auth.users(id). Automatically deleted when user is deleted. |
| `email` | TEXT | No | User's email address. Must be valid email format. |
| `username` | TEXT | Yes | Lowercase vanity handle (3–24 chars). Unique when provided. |
| `usdc_wallet_address` | TEXT | Yes | Cryptocurrency wallet address (Ethereum or Solana format). |
| `twitter_handle` | TEXT | Yes | Twitter/X username without @ symbol. Max 15 characters. |
| `instagram_handle` | TEXT | Yes | Instagram username without @ symbol. Max 30 characters. |
| `created_at` | TIMESTAMP WITH TIME ZONE | No | Automatically set when profile is created. |
| `updated_at` | TIMESTAMP WITH TIME ZONE | No | Automatically updated whenever profile is modified. |

### Videos Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key generated via `gen_random_uuid()`. |
| `profile_id` | UUID | No | References the creator's profile (`profiles.id`). Deletes cascade with the profile. |
| `title` | TEXT | No | Required video title (3–120 chars). |
| `description` | TEXT | No | Long-form description (up to ~5k chars). |
| `generation_source` | TEXT | No | `ai` or `human`, allowing uploaders to flag how the video was produced. |
| `mux_asset_id` | TEXT | No | Required ID returned by MUX after upload/ingest. |
| `mux_playback_id` | TEXT | Yes | Optional playback ID used to request streaming URLs from MUX. |
| `view_count` | BIGINT | No | Aggregated total of how many times the video detail page has been viewed. |
| `unlock_at` | TIMESTAMP WITH TIME ZONE | No | Release timestamp; only videos past this timestamp appear in public queries. |
| `created_at` | TIMESTAMP WITH TIME ZONE | No | Defaults to current timestamp when row is created. |
| `updated_at` | TIMESTAMP WITH TIME ZONE | No | Auto-updated on each modification via trigger. |

### Video Ratings Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `video_id` | UUID | No | References the video being reviewed. |
| `profile_id` | UUID | No | References the viewer leaving the rating. |
| `rating` | SMALLINT | No | Whole number between 1 (slop) and 5 (art). |
| `created_at` | TIMESTAMP WITH TIME ZONE | No | Timestamp when the rating was first stored. |
| `updated_at` | TIMESTAMP WITH TIME ZONE | No | Updated automatically whenever the rating changes. |

### Security Features

#### Row Level Security (RLS)

RLS ensures that users can only access their own profile data. The policies enforce:

1. **SELECT Policy**: Users can only read their own profile
2. **UPDATE Policy**: Users can only update their own profile
3. **INSERT Policy**: Users can only create their own profile (id must match auth.uid())

#### Cascade Delete

When a user is deleted from `auth.users`, their profile is automatically deleted due to the `ON DELETE CASCADE` constraint.

## Maintenance and Monitoring

### Viewing Database Statistics

```sql
-- Count total profiles
SELECT COUNT(*) FROM profiles;

-- Count profiles with wallets
SELECT COUNT(*) FROM profiles WHERE usdc_wallet_address IS NOT NULL;

-- Count profiles with social media
SELECT 
  COUNT(*) as total_profiles,
  COUNT(twitter_handle) as with_twitter,
  COUNT(instagram_handle) as with_instagram,
  COUNT(usdc_wallet_address) as with_wallet
FROM profiles;
```

### Backup and Recovery

Supabase automatically backs up your database. To manually export data:

1. Go to **"Database"** → **"Backups"** in the Supabase dashboard
2. You can create manual backups or restore from automatic backups
3. For manual export, use the SQL Editor to export data as CSV

## Production Considerations

### Before Deploying to Production

1. **Update Site URL**: Change the Site URL in Authentication settings to your production domain
2. **Update Redirect URLs**: Add your production callback URLs
3. **Review RLS Policies**: Ensure all policies are correctly configured
4. **Enable Email Confirmation**: In Authentication → Settings, enable email confirmation for new signups
5. **Database Indexes**: The provided indexes should be sufficient, but monitor query performance
6. **Monitoring**: Use Supabase's built-in monitoring tools to track database performance

### Scaling Considerations

- The free tier supports up to 500MB database size and 2GB bandwidth
- For production apps with more users, consider upgrading to Pro plan
- Monitor the "Database" section for performance metrics
- Add additional indexes if you notice slow queries

## Troubleshooting

### Common Issues

**Issue**: "Failed to create table"
- **Solution**: Ensure you have the correct permissions. You should be the project owner.

**Issue**: "RLS policies not working"
- **Solution**: Verify that RLS is enabled and policies are correctly configured. Check that `auth.uid()` matches the user's ID.

**Issue**: "Cannot insert into profiles table"
- **Solution**: Ensure the user is authenticated and the ID matches the authenticated user's ID.

**Issue**: "Duplicate key value violates unique constraint"
- **Solution**: The profile already exists for this user. Each user can only have one profile.

### Testing RLS Policies

You can test RLS policies using the SQL Editor with different user contexts:

```sql
-- Test as a specific user (replace with actual user ID)
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims.sub = 'user-uuid-here';

-- Now run queries to test access
SELECT * FROM profiles;
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

## Support

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Review the RLS policies
3. Check the browser console for errors
4. Consult the Supabase Discord community

---

Last updated: November 2025

