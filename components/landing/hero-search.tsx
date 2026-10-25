"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search } from "lucide-react";

export function HeroSearch({
  suggestions,
}: {
  suggestions: { label: string; href: string }[];
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  const go = (href: string) => {
    startTransition(() => router.push(href));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (!query) {
      go("/search");
      return;
    }
    go(`/search?title=${encodeURIComponent(query)}`);
  };

  return (
    <div className="mx-auto mt-9 w-full max-w-2xl">
      <form onSubmit={submit} className="group relative flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-xl transition focus-within:border-white/35 focus-within:bg-white/15">
        <Search className="ml-3 h-5 w-5 shrink-0 text-slate-300" />
        <label htmlFor="hero-search" className="sr-only">
          Search courses
        </label>
        <input
          id="hero-search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search courses, subjects or teachers"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-white placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:opacity-70"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pending ? "Searching" : "Search"}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Popular</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.href}
              type="button"
              onClick={() => go(suggestion.href)}
              className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-slate-200 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
