import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import LogoMark from "@/app/assets/Icon Transparency-1.png";
import { createClient as createServerClient } from "@/lib/supabase/server";
import NavUserMenu from "@/components/NavUserMenu";
import SiteSearchBar from "@/components/SiteSearchBar";

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
  "inline-flex items-center justify-center rounded-full px-6 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.45em] transition";

const guestLinkVariants = {
  primary:
    "border border-[#f5d67b] bg-[#f5d67b] text-black shadow-[0_15px_40px_rgba(245,214,123,0.35)] hover:-translate-y-0.5 hover:bg-[#ffe8a0]",
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

          <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 py-3 backdrop-blur-2xl">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6">
              <div className="flex w-48 shrink-0 items-center">
                <Link
                  href="/"
                  aria-label="Back to the Uvacha home"
                  className="group relative flex h-12 w-12 items-center justify-center transition-all duration-300 hover:drop-shadow-[0_0_20px_rgba(245,214,123,0.5)]"
                >
                  <Image
                    src={LogoMark}
                    alt="Uvacha mark"
                    width={40}
                    height={40}
                    priority
                    className="object-contain drop-shadow-[0_0_8px_rgba(245,214,123,0.3)] transition-all duration-300 group-hover:drop-shadow-[0_0_18px_rgba(245,214,123,0.6)] group-hover:scale-105"
                  />
                </Link>
              </div>

              <div className="flex flex-1 justify-center">
                <SiteSearchBar className="w-full max-w-xl" />
              </div>

              <nav className="flex w-48 shrink-0 items-center justify-end gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
                {userEmail ? (
                  <NavUserMenu email={userEmail} />
                ) : (
                  guestLinks.map(({ href, label, variant }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`${guestLinkBaseClasses} ${guestLinkVariants[variant]}`}
                    >
                      {label}
                    </Link>
                  ))
                )}
              </nav>
            </div>
          </header>

          <main className="relative flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
