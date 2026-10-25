"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { UserButton as ClerkUserButton, useAuth as useClerkAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export const DemoSessionContext = createContext<{ userId: string | null; userName: string | null }>({
  userId: null,
  userName: null,
});

function useDemoAuth() {
  const { userId } = useContext(DemoSessionContext);
  return {
    userId,
    isLoaded: true,
    isSignedIn: Boolean(userId),
    sessionId: userId ? `demo_${userId}` : null,
    getToken: async () => null,
    signOut: async () => {
      await fetch("/api/demo/sign-out", { method: "POST" });
      window.location.assign("/");
    },
  };
}

/** `useAuth()` that works with Clerk and with the local demo session. */
export const useAuth = isClerkConfigured ? useClerkAuth : useDemoAuth;

interface UserButtonProps {
  afterSignOutUrl?: string;
  showName?: boolean;
}

/** Account button used in the navbar. */
export function UserButton(props: UserButtonProps) {
  if (isClerkConfigured) return <ClerkUserButton {...props} />;
  return <DemoUserButton />;
}

function DemoUserButton() {
  const { userId, signOut } = useDemoAuth();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetch("/api/profile")
      .then((response) => (response.ok ? response.json() : null))
      .then((profile) => {
        if (active && profile?.displayName) setName(profile.displayName as string);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [userId]);

  if (!userId) return null;

  const initials = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleSignOut = async () => {
    try {
      setBusy(true);
      await signOut();
    } catch {
      toast.error("Could not sign out. Please try again.");
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 rounded-full">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-neutral-900 text-[11px] font-bold text-white">
            {initials || <UserRound className="h-4 w-4" />}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-normal text-slate-500">
          {name ? `Signed in as ${name}` : "Signed in locally"}
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound className="mr-2 h-4 w-4" /> My profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={busy} onSelect={(event) => { event.preventDefault(); void handleSignOut(); }}>
          <LogOut className="mr-2 h-4 w-4" /> {busy ? "Signing out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
