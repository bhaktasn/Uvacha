# Homepage and account-flow review

The original homepage put a small slogan and decorative bracket above the video grid without an immediate submission action or a concrete prize amount. The manifesto made the page long before explaining the practical next step. “Art from slop” supplies attitude, but my hypothesis is that a more welcoming invitation will convert new creators better. This is a design hypothesis, not a measured result.

Two implemented directions are available at `/?preview=1`, with buttons to switch live:

| Direction | Homepage | Account flow | Hypothesis |
| --- | --- | --- | --- |
| A: Prize first | Gold, prominent cash-prize card, direct submission invitation | Compact account form | Clear reward and fewer distractions encourage ready-to-submit creators |
| B: Creative brief | Sage green, editorial typography, creative-brief card | Story and benefits alongside the form | A prompt and sense of community help creators picture what to make |

Share `/?variant=a` and `/?variant=b` for separate review sessions. Homepage submission links retain the variant into sign-up and sign-in. This is an interactive comparison, not an automatic randomized analytics experiment. For a quantitative test, assign visitors consistently and measure completed uploads per unique visitor, with sign-up starts and completed accounts as supporting metrics. Avoid choosing a winner solely from button clicks.

Both directions include today's prize, a three-step explanation, current and upcoming briefs, existing playable video cards, and an invitation after the gallery. The default is A. The initial prize is $5 and no example themed week is published automatically.

The selected prize-first direction now frames the amount inside a tilted camera viewfinder with a recording indicator, play outline, and timeline. Video cards use edge-to-edge thumbnails and load a muted, looping preview only after a short hover or keyboard-focus delay. Playback stops on exit, blur, offscreen scrolling, or a hidden tab; reduced-motion, touch-only, and data-saver visitors keep the still thumbnail. Failed playback also falls back to the still. This uses the existing [Mux player](https://www.mux.com/docs/guides/player-api-reference/react), with controls hidden and preview tracking disabled. X and YouTube links appear in the shared site footer.

Upload and edit forms show a brief immediately before submitting/saving, with the selected UTC date, cash prize, full theme instructions, and the week's inclusive dates. Open dates explicitly say no theme is scheduled. Loading failures show a retry action. The local admin uses the identical brief component for its draft preview. `node scripts/test-preview-polish.mjs` checks actual muted playback and advancing video time, reduced-motion behavior, mobile layout, social URLs, and themed/open-date briefs without saving its sample schedule.

Account improvements: Google and email remain supported; password confirmation is replaced with show/hide password; email confirmation stays visible; people can correct their email; immediate sessions continue directly; login and OAuth return to the uploader by default. Redirect targets are allowlisted. Profile creation is retained before upload. Wallet and social-profile details stay optional at this stage. Real OAuth and email delivery need a test account and the existing Supabase provider configuration; automated UI checks mock account creation to avoid sending email or creating accounts.

Further product decisions: publish precise winner selection, ties, eligibility, entry deadline, and payout timing; show verified previous winners once that data exists; add account recovery. The previous homepage said winners “split the prize pool,” while the outreach describes one winner. This change avoids inventing an answer. Scheduling controls do not select winners, transfer money, or automatically judge theme compliance.

## Local schedule dashboard

Run `npm run dev -- --hostname 127.0.0.1` and open `/admin`. Change the default prize or pick a date to set its override. Add a themed week, choose its start date, and enter a title and brief. Each week runs seven days inclusive. The dashboard previews the selected date immediately and saves only when you select **Save schedule**. Removing an override restores the default; removing a week restores open theme for its dates after saving. Overlapping weeks and invalid dates/prizes are rejected on the server.

Schedules use UTC and appear on the homepage, auth screens (prize), and upload form for the selected day. Newly selected submission dates use UTC midnight. Existing video timestamps are not migrated. Review older entries around the UTC date boundary if historical local-midnight submissions need reassignment.

The dashboard is available only in development on a loopback host. Writes require a matching origin and JSON. Bind the dev server to `127.0.0.1`; do not expose it through a public tunnel. The schedule lives in `data/competition.json`. Saving updates the local site; commit/deploy that file through your normal workflow to publish changes. Production includes the schedule in the build and disables the editor and write API. No database migration is needed.

## X preview

Live inspection using a Twitterbot user agent found that `og:url`, `og:image`, and `twitter:image` point at a generated Vercel deployment hostname. The public-domain image itself responds successfully, so a missing image file was not established as the cause. Deployment-host accessibility or cached cards remain possible causes of the screenshot.

The metadata now defaults to `https://www.uvacha.ai`, not `VERCEL_URL` or localhost. If either `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_SITE_URL` is configured, ensure it points to the public domain before deployment. The new 1200 × 630 image uses large type and evergreen prize copy so a cached card does not promise an outdated daily amount. The image route bypasses session middleware. Next.js emits file-based Open Graph image metadata; the explicit Twitter image includes a new version query. See the [Next.js image metadata documentation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image).

After deployment, fetch the homepage using `Twitterbot`, verify every image URL uses the public domain and returns `image/png`, then test a fresh share URL on X. Existing posts may retain X's cached preview; this local change cannot force their refresh.

## Validation

- `node scripts/test-competition.mjs`: week boundaries, cross-month/leap-day dates, prize overrides, invalid values, overlaps, redirect allowlist.
- `node scripts/test-ui.mjs` with the local dev server: interactive variants, submission links, password visibility, mocked email confirmation, mobile overflow, admin preview/save, rejected cross-origin and invalid writes, image response and public metadata URLs.
- `npx tsc --noEmit`, lint of changed code, and `npm run build`.

The browser test expects the initial $5 schedule and no scheduled weeks. It previews a sample week and removes it before saving the unchanged schedule. Run against a disposable local checkout if you already have scheduled weeks.
