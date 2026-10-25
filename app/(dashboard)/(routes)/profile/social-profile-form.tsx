"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarUpload } from "@/components/avatar-upload";
import { useRouter } from "next/navigation";

const USERNAME_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

export function SocialProfileForm({ username, lastUsernameChangeAt, initialDisplayName, initialAvatarUrl }: { username: string; lastUsernameChangeAt: string; initialDisplayName: string; initialAvatarUrl: string }) {
  const router = useRouter();
  const [currentUsername, setCurrentUsername] = useState(username);
  const [usernameInput, setUsernameInput] = useState(username);
  const [lastChangedAt, setLastChangedAt] = useState(lastUsernameChangeAt);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [busy, setBusy] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const normalizedUsername = usernameInput.trim().toLowerCase();
      if (normalizedUsername !== currentUsername) {
        await axios.patch("/api/profile/username", { username: normalizedUsername });
        setCurrentUsername(normalizedUsername);
        setUsernameInput(normalizedUsername);
        setLastChangedAt(new Date().toISOString());
      }
      await axios.patch("/api/profile", { displayName, avatarUrl });
      toast.success("Community profile updated");
      router.refresh();
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.error ?? "Could not update profile" : "Could not update profile");
    } finally { setBusy(false); }
  };

  const canChangeUsername = Date.now() >= new Date(lastChangedAt).getTime() + USERNAME_COOLDOWN_MS;
  const availableDate = new Date(new Date(lastChangedAt).getTime() + USERNAME_COOLDOWN_MS).toLocaleDateString();

  return <form onSubmit={save} className="surface-card space-y-6 p-6 sm:p-8">
    <div className="flex items-center gap-4">{avatarUrl ? <img src={avatarUrl} alt="Profile avatar preview" className="h-20 w-20 rounded-full border border-slate-200 object-cover" /> : <span aria-label="Avatar initials" className="grid h-20 w-20 place-items-center rounded-full bg-slate-100 text-2xl font-bold">{displayName.slice(0, 1).toUpperCase() || "?"}</span>}<div><p className="font-semibold">Profile photo</p><p className="mb-2 text-xs text-slate-500">PNG, JPG, or WebP up to 2 MB</p><AvatarUpload onUploaded={setAvatarUrl} /></div></div>
    <div><label htmlFor="username" className="mb-2 block text-sm font-semibold">Username</label><div className="flex items-center rounded-md border border-input bg-background px-3"><span className="text-slate-400">@</span><Input id="username" value={usernameInput} onChange={(event) => setUsernameInput(event.target.value.toLowerCase())} minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]{3,20}" disabled={!canChangeUsername || busy} className="border-0 shadow-none focus-visible:ring-0 disabled:opacity-70" required /></div><p className="mt-1 text-xs text-slate-500">{canChangeUsername ? "You can change your username once every 30 days." : `Username changes are available again on ${availableDate}.`}</p></div>
    <div><label htmlFor="displayName" className="mb-2 block text-sm font-semibold">Display name</label><Input id="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} required /><p className="mt-1 text-xs text-slate-500">Your display name can be changed at any time.</p></div>
    <Button disabled={busy || !displayName.trim()}>{busy ? "Saving..." : "Save profile"}</Button>
  </form>;
}
