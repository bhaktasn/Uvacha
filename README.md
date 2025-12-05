# Uvacha - User Profile Management App

A modern Next.js application for user profile management with cryptocurrency wallet integration and social media account linking.

## Features

- 🔐 **Secure Authentication**: Email-based user authentication powered by Supabase
- 💎 **USDC Wallet Integration**: Add and validate USDC wallet addresses (supports Ethereum/EVM and Solana chains)
- 📱 **Social Media Profiles**: Optional Twitter/X and Instagram handle integration
- 🎬 **Scheduled Video Releases**: Upload videos to MUX, flag them as AI/Human generated, and set future unlock dates
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- ⚡ **Real-time Validation**: Instant feedback on wallet addresses and social media handles

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Video Infrastructure**: MUX (asset ingest + playback)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18.x or higher
- npm or yarn
- A Supabase account (free tier available)
- A MUX Video project with a token ID + token secret (needed for uploads)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Uvacha
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Connect Supabase (one-time)

Supabase powers both authentication and the database. Use `DATABASE_SETUP.md` as the single source of truth for this step.

1. **Create a project** in the Supabase dashboard (name, password, region).  
2. **Configure authentication URLs** (`http://localhost:3000` and `/auth/callback`).  
3. **Apply the database schema & RLS policies** by running the SQL script in [Step 3 of `DATABASE_SETUP.md`](./DATABASE_SETUP.md#step-3-create-the-database-schema).  
4. **Grab the Project URL and anon key** from **Project Settings → API** for your environment variables.

Need screenshots, verification steps, or troubleshooting tips? Follow the detailed walkthrough in [`DATABASE_SETUP.md`](./DATABASE_SETUP.md).

### 4. Configure Environment Variables

1. Create a `.env.local` file in the root of your project:

```bash
cp .env.local.example .env.local
```

2. Open `.env.local` and add your Supabase + MUX credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
MUX_TOKEN_ID=your-mux-token-id
MUX_TOKEN_SECRET=your-mux-token-secret
# Optional, but recommended so direct uploads only accept your site
MUX_DIRECT_UPLOAD_CORS_ORIGIN=http://localhost:3000
```

**Important**: Replace `your-project-url-here` and `your-anon-key-here` with the actual values from your Supabase project.
Grab the MUX token pair from **Settings → Access Tokens** in your MUX dashboard.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
Uvacha/
├── app/
│   ├── auth/
│   │   └── callback/        # Auth callback route
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── profile/             # Profile management page
│   ├── videos/              # Video upload + scheduling dashboard
│   ├── api/
│   │   └── videos/          # REST helpers for MUX workflows
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Client-side Supabase client
│   │   ├── server.ts        # Server-side Supabase client
│   │   └── middleware.ts    # Supabase middleware
│   ├── mux/
│   │   └── client.ts        # Thin wrapper around @mux/mux-node
│   ├── types/
│   │   └── database.ts      # Database type definitions
│   └── utils/
│       ├── wallet-validation.ts    # USDC wallet validation
│       └── social-validation.ts    # Social media validation
├── middleware.ts            # Next.js middleware for auth
├── .env.local              # Environment variables (create this)
├── .env.local.example      # Environment variables template
└── package.json            # Project dependencies
```

## Database Schema

### Profiles Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references auth.users(id) |
| `email` | TEXT | User's email address |
| `username` | TEXT (nullable) | Vanity handle used across the app (3-24 lowercase letters, numbers, underscores) |
| `usdc_wallet_address` | TEXT (nullable) | USDC wallet address (Ethereum or Solana) |
| `twitter_handle` | TEXT (nullable) | Twitter/X handle (without @) |
| `instagram_handle` | TEXT (nullable) | Instagram handle (without @) |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Videos Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key generated via `gen_random_uuid()` |
| `profile_id` | UUID | References `profiles.id` so each video belongs to a user |
| `title` | TEXT | Required title (3–120 characters) |
| `description` | TEXT | Full description (up to ~5k characters) |
| `generation_source` | TEXT | `ai` or `human`, selected during upload |
| `mux_asset_id` | TEXT | ID returned by MUX after ingest; needed for playback |
| `mux_playback_id` | TEXT | Optional playback ID for streaming URLs |
| `view_count` | BIGINT | Running aggregate used to surface total views |
| `unlock_at` | TIMESTAMPTZ | Release timestamp. Only videos whose unlock time is in the past are visible to the public |
| `created_at` / `updated_at` | TIMESTAMPTZ | Auto-managed timestamps via trigger |

👉 Detailed SQL (tables, indexes, triggers, and RLS policies) lives in [`DATABASE_SETUP.md`](./DATABASE_SETUP.md).

## Features in Detail

### Wallet Validation

The app validates USDC wallet addresses for:
- **Ethereum/EVM chains**: Ethereum, Polygon, Binance Smart Chain, etc.
  - Format: `0x` followed by 40 hexadecimal characters
  - Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
- **Solana chain**
  - Format: Base58 encoded, 32-44 characters
  - Example: `7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi`

### Social Media Validation

- **Twitter/X**: 1-15 characters, alphanumeric and underscores only
- **Instagram**: 1-30 characters, alphanumeric, underscores, and periods (cannot end with period)
- Handles are stored without the `@` symbol

### Video Release Workflow

- **Upload**: Send files directly to MUX, then store the returned `mux_asset_id`/`mux_playback_id` in the `videos` table.
- **Metadata**: Collect title, description, and whether the content is AI- or human-generated (`generation_source` column).
- **Scheduling**: Populate `unlock_at` with the desired release timestamp (UTC). The default is `NOW()` for immediate availability.
- **Querying**: When building feeds or public APIs, filter with `WHERE unlock_at <= timezone('utc', now())` to ensure only unlocked videos are returned. Creators can still see their drafts due to RLS policies.
- **Workflow UI**: Visit `/videos` once logged in. The page collects metadata, requests a signed upload URL via `/api/videos/upload-session`, streams the file straight to MUX, and polls `/api/videos/finalize` until Supabase persists the finished record.

## Security Features

- **Row Level Security (RLS)**: Users can only access and modify their own profiles
- **Email Verification**: Optional email verification flow
- **Secure Authentication**: Powered by Supabase Auth
- **Environment Variables**: Sensitive data stored in environment variables

## Deployment

### Deploy to Vercel

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Update your Supabase project settings:
   - Add your Vercel deployment URL to "Site URL"
   - Add `https://your-domain.vercel.app/auth/callback` to "Redirect URLs"

### Other Platforms

This app can be deployed to any platform that supports Next.js, such as:
- Netlify
- AWS Amplify
- Railway
- Render

Make sure to:
1. Set the environment variables
2. Update Supabase redirect URLs
3. Use Node.js 18 or higher

## Development

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

### Build

```bash
npm run build
```

## Troubleshooting

### Common Issues

1. **"Invalid API credentials"**
   - Double-check your `.env.local` file
   - Ensure you're using the correct Supabase URL and anon key
   - Restart the development server after changing environment variables

2. **"Failed to load profile"**
   - Verify the `profiles` table exists in Supabase
   - Check that RLS policies are correctly configured
   - Ensure the user is authenticated

3. **Authentication redirect loop**
   - Verify redirect URLs in Supabase settings
   - Check middleware configuration
   - Clear browser cookies and try again

4. **Build errors**
   - Delete `.next` folder and `node_modules`
   - Run `npm install` again
   - Run `npm run build`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
- Check the [Supabase Documentation](https://supabase.com/docs)
- Check the [Next.js Documentation](https://nextjs.org/docs)
- Create an issue in this repository

## Future Enhancements

- [ ] Add support for more cryptocurrency wallets (Bitcoin, Ethereum tokens, etc.)
- [ ] Profile picture upload
- [ ] Two-factor authentication
- [ ] More social media platforms (LinkedIn, Discord, etc.)
- [ ] Profile sharing with QR codes
- [ ] Advanced wallet validation with checksum verification
- [ ] Multi-language support

---

Built with ❤️ using Next.js and Supabase
