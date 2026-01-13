'use client'

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type NavUserMenuProps = {
  email: string;
};

const dropdownLinks = [
  { href: "/profile", label: "Profile" },
  { href: "/videos", label: "Videos" },
];

export default function NavUserMenu({ email }: NavUserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();
  const initial = email?.charAt(0)?.toUpperCase() ?? "?";

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickAway);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleOpen = () => setOpen((prev) => !prev);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-base font-semibold leading-none text-white/90 transition-all duration-300 hover:border-[#f5d67b]/50 hover:bg-white/15 hover:text-white hover:shadow-[0_0_20px_rgba(245,214,123,0.35)]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open ? (
        <div className="absolute right-0 mt-3 w-48 rounded-3xl border border-white/10 bg-black/90 p-3 text-[0.7rem] uppercase tracking-[0.25em] shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
          <div className="space-y-1">
            <p
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[0.65rem] font-semibold text-white/80"
              title={email}
            >
              <span className="block overflow-hidden text-ellipsis whitespace-nowrap normal-case tracking-normal">
                {email}
              </span>
            </p>
            <div className="h-px bg-white/5" />
            {dropdownLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block rounded-2xl px-3 py-2 text-white/80 transition hover:bg-white/5 hover:text-white"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-1 w-full rounded-2xl border border-[#f5d67b]/40 px-3 py-2 text-[#f5d67b] transition hover:border-[#f5d67b] hover:bg-[#f5d67b]/10"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

