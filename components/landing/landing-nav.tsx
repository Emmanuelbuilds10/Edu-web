"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "#courses", label: "Courses" },
  { href: "#why", label: "Why Sabiplex" },
  { href: "#how", label: "How it works" },
];

export function LandingNav({ isSignedIn }: { isSignedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open ? "border-b border-white/10 bg-slate-950/85 backdrop-blur-xl" : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link href="/" aria-label="Sabiplex home" className="shrink-0">
          <Image
            src="/logo.svg"
            alt="Sabiplex"
            width={150}
            height={48}
            priority
            className="h-9 w-auto brightness-0 invert"
          />
        </Link>

        <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={isSignedIn ? "/dashboard" : "/sign-in"}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {isSignedIn ? "Dashboard" : "Sign in"}
          </Link>
          {!isSignedIn && (
            <Link
              href="/sign-up"
              className="hidden items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-lg sm:inline-flex"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white transition hover:bg-white/10 md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      <div
        className={cn(
          "overflow-hidden border-t border-white/5 transition-[max-height,opacity] duration-300 md:hidden",
          open ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-1 px-6 py-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          {!isSignedIn && (
            <Link
              href="/sign-up"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-between rounded-xl bg-white px-3 py-3 text-sm font-bold text-slate-950"
            >
              Create an account
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
