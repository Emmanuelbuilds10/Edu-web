"use client";

import qs from "query-string";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export function NavbarSearch({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSearchPage = pathname === "/search";
  const urlTitle = searchParams.get("title") ?? "";
  const [value, setValue] = useState(urlTitle);
  const debouncedValue = useDebounce(value);

  const categoryIdsKey = searchParams.getAll("categoryIds").join(",");
  const categoryId = searchParams.get("categoryId");

  useEffect(() => {
    setValue(urlTitle);
  }, [urlTitle, pathname]);

  useEffect(() => {
    if (!isSearchPage) return;

    const url = qs.stringifyUrl(
      {
        url: "/search",
        query: {
          categoryIds: categoryIdsKey ? categoryIdsKey.split(",") : null,
          categoryId: categoryIdsKey ? null : categoryId,
          title: debouncedValue,
        },
      },
      { skipEmptyString: true, skipNull: true }
    );

    router.replace(url);
  }, [debouncedValue, categoryIdsKey, categoryId, isSearchPage, router]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSearchPage) return;

    const query = value.trim();
    router.push(query ? `/search?title=${encodeURIComponent(query)}` : "/search");
  };

  return (
    <form onSubmit={submit} role="search" className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label="Search courses and teachers"
        placeholder="Search courses and teachers"
        className="h-10 rounded-full border-slate-200 bg-slate-50/80 pl-9 text-sm placeholder:text-slate-400 focus-visible:border-teal-300 focus-visible:ring-teal-500/20"
      />
    </form>
  );
}
