# Profile Images Setup Guide

This guide explains how to configure Supabase to support user profile avatars and banners.

## Overview

The profile images feature allows users to:
- Upload a profile avatar (square image, displayed next to their username)
- Upload a banner image (wide image, displayed at the top of their profile page)

Images are stored in Supabase Storage and served via public URLs.

---

## Step 1: Add Database Columns

Run the following SQL in your Supabase SQL Editor to add the new columns to the `profiles` table:

```sql
-- Add avatar_url, banner_url, and bio columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add a check constraint for bio length (optional but recommended)
ALTER TABLE profiles
ADD CONSTRAINT profiles_bio_length CHECK (char_length(bio) <= 500);
```

---

## Step 2: Create the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `profile-images`
   - **Public bucket**: ✅ **Enable** (this makes images publicly accessible via URL)
   - **File size limit**: `5242880` (5MB in bytes)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`

5. Click **Create bucket**

---

## Step 3: Configure Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies to control who can upload and manage images.

### Policy 1: Allow authenticated users to upload their own images

Go to **Storage > Policies** and create a new policy for the `profile-images` bucket:

```sql
-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload their own profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Allow authenticated users to update/replace their own images

```sql
-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: Allow authenticated users to delete their own images

```sql
-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 4: Allow public read access to all images

```sql
-- Allow anyone to view profile images
CREATE POLICY "Profile images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');
```

---

## Step 4: Alternative - Run All Policies at Once

You can run all the policies in one go using the SQL Editor:

```sql
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if you want to reset (optional)
-- DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
-- DROP POLICY IF EXISTS "Profile images are publicly accessible" ON storage.objects;

-- Create policies
CREATE POLICY "Users can upload their own profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Profile images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');
```

---

## Step 5: Update Environment Variables

Make sure your `.env.local` file has the following variables set:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The `SUPABASE_SERVICE_ROLE_KEY` is required for the server-side upload API to manage storage operations.

---

## Step 6: Configure Next.js for External Images

Add Supabase storage domain to your `next.config.ts` to allow Next.js Image component to load external images:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Add your specific Supabase project URL for better security:
      // {
      //   protocol: 'https',
      //   hostname: 'your-project-id.supabase.co',
      //   pathname: '/storage/v1/object/public/profile-images/**',
      // },
    ],
  },
};

export default nextConfig;
```

---

## File Structure

After setup, images will be organized in the storage bucket like this:

```
profile-images/
├── user-uuid-1/
│   ├── avatar-1706123456789.jpg
│   └── banner-1706123456790.png
├── user-uuid-2/
│   ├── avatar-1706123456791.webp
│   └── banner-1706123456792.jpg
└── ...
```

Each user's images are stored in a folder named with their user ID, ensuring proper access control.

---

## How It Works

1. **Upload Flow**:
   - User selects an image file in the profile settings
   - Frontend sends the file to `/api/profile/upload-image`
   - API validates file type and size
   - API uploads to Supabase Storage using service role key
   - API updates the profile record with the new image URL
   - Frontend displays the new image

2. **Image URLs**:
   - Images are served from: `https://your-project.supabase.co/storage/v1/object/public/profile-images/{user-id}/{filename}`
   - These URLs are publicly accessible and can be used directly in `<img>` tags

3. **Old Image Cleanup**:
   - When uploading a new avatar/banner, the old one is automatically deleted
   - This prevents orphaned files from accumulating in storage

---

## Troubleshooting

### "Failed to upload image" error
- Check that the `profile-images` bucket exists
- Verify storage policies are correctly configured
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### Images not loading
- Verify the bucket is set to public
- Check Next.js `remotePatterns` configuration
- Ensure the image URL is correctly formed

### CORS errors
- Supabase handles CORS automatically for public buckets
- If you see CORS errors, verify the bucket is public

---

## Profile Page Features

After setup, users can:

1. **View Public Profiles**: Visit `/u/{username}` to see any user's profile
2. **Upload Avatar**: Click on their avatar in profile settings
3. **Upload Banner**: Click on the banner area in profile settings
4. **Add Bio**: Write a short bio (up to 500 characters)
5. **Social Links**: Their Twitter/Instagram links appear on the public profile

Video cards throughout the site now show creator avatars next to usernames, with links to their public profiles.

