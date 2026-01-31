import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import LogoMark from "@/app/assets/Icon Transparency-1.png";
import { createClient as createServerClient } from "@/lib/supabase/server";
import NavUserMenu from "@/components/NavUserMenu";
import SiteSearchBar from "@/components/SiteSearchBar";
import { Web3Provider } from "@/components/Web3Provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const guestLinks = [
  { href: "/signup", label: "Sign up", variant: "ghost" },
  { href: "/login", label: "Sign in", variant: "primary" },
] as const;

const guestLinkBaseClasses =
  "inline-flex items-center justify-center rounded-full px-4 py-2 md:px-6 md:py-2.5 text-[0.6rem] md:text-[0.65rem] font-semibold uppercase tracking-[0.3em] md:tracking-[0.45em] transition whitespace-nowrap";

const guestLinkVariants = {
  primary:
    "border border-[#d4a84b] bg-[#d4a84b] text-[#1a1100] shadow-[0_10px_30px_rgba(212,168,75,0.3)] hover:-translate-y-0.5 hover:bg-[#e6be5c] hover:border-[#e6be5c]",
  ghost:
    "border border-white/20 text-white/80 hover:border-white/45 hover:text-white",
} as const;

export const metadata: Metadata = {
  title: "Uvacha | Creator Launchpad",
  description:
    "Plan cinematic drops, validate wallets, and orchestrate MUX-powered releases from a single black-and-gold cockpit.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userEmail = user?.email ?? null;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050505] text-[#fdf8e1]`}
      >
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#050505] text-[#fdf8e1]">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-32 right-[-10%] h-80 w-80 rounded-full bg-[#f5d67b]/25 blur-[140px]" />
            <div className="absolute bottom-[-15%] left-[-5%] h-[28rem] w-[28rem] rounded-full bg-[#c08f2c]/20 blur-[160px]" />
          </div>

          <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 py-2 md:py-3 backdrop-blur-2xl">
            <div className="flex w-full items-center justify-between gap-2 sm:gap-3 md:gap-6 px-3 sm:px-4 md:px-6 lg:px-8">
              {/* Logo - minimal width on mobile, fixed on desktop */}
              <Link
                href="/"
                aria-label="Back to the Uvacha home"
                className="group relative flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(245,214,123,0.5)]"
              >
                <Image
                  src={LogoMark}
                  alt="Uvacha mark"
                  width={40}
                  height={40}
                  priority
                  className="h-8 w-8 md:h-10 md:w-10 object-contain drop-shadow-[0_0_8px_rgba(245,214,123,0.3)] transition-all duration-300 group-hover:drop-shadow-[0_0_18px_rgba(245,214,123,0.6)] group-hover:scale-105"
                />
              </Link>

              {/* Search bar - takes remaining space, with min/max constraints */}
              <div className="flex flex-1 min-w-0 justify-center">
                <SiteSearchBar className="w-full max-w-2xl" />
              </div>

              {/* Navigation - responsive sizing */}
              <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
                {userEmail ? (
                  <>
                    <Link
                      href="/tools"
                      className="hidden sm:inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 md:px-4 py-1.5 md:py-2 text-[0.55rem] md:text-[0.6rem] font-semibold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/60 transition hover:border-[#f5d67b]/40 hover:text-[#f5d67b]"
                    >
                      Tools
                    </Link>
                    <NavUserMenu email={userEmail} />
                  </>
                ) : (
                  <>
                    {/* Mobile: Only show Sign in button */}
                    <Link
                      href="/login"
                      className={`sm:hidden ${guestLinkBaseClasses} ${guestLinkVariants.primary}`}
                    >
                      Sign in
                    </Link>
                    {/* Desktop: Show both buttons */}
                    {guestLinks.map(({ href, label, variant }) => (
                      <Link
                        key={href}
                        href={href}
                        className={`hidden sm:inline-flex ${guestLinkBaseClasses} ${guestLinkVariants[variant]}`}
                      >
                        {label}
                      </Link>
                    ))}
                  </>
                )}
              </nav>
            </div>
          </header>

          <main className="relative flex-1">
            <Web3Provider>{children}</Web3Provider>
          </main>
        </div>
      </body>
    </html>
  );
}
