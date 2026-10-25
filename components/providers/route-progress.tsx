"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// A single, global progress bar for client-side navigations. Route changes in
// the App Router do not expose router events, so the bar is started from
// internal link clicks and finished once the new URL has rendered.
NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.12, speed: 320 });

const FAILSAFE_MS = 10000;

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    NProgress.done();
  };

  const start = () => {
    NProgress.start();
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(stop, FAILSAFE_MS);
  };

  useEffect(() => {
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Next's <Link> calls preventDefault for client navigation, so it is
      // deliberately not treated as a reason to skip the bar.
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.getAttribute("data-no-progress") !== null) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.hash && url.search === window.location.search) return;
      if (url.href === window.location.href) return;

      start();
    };

    const onPopState = () => start();

    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPopState);
      if (timeout.current) clearTimeout(timeout.current);
      NProgress.done();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
