"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarUpload } from "@/components/avatar-upload";

export function DisplayNameSetup({ initialDisplayName, initialAvatarUrl }: { initialDisplayName: string; initialAvatarUrl: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      await axios.patch("/api/profile", { displayName, avatarUrl });
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.error ?? "Could not save your profile." : "Could not save your profile.");
    } finally { setBusy(false); }
  };

  return <form onSubmit={submit} className="mt-6 space-y-5">
    <div className="flex items-center gap-4">{avatarUrl ? <img src={avatarUrl} alt="Profile avatar preview" className="h-16 w-16 rounded-full border border-slate-200 object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-xl font-bold">{displayName.slice(0, 1).toUpperCase() || "?"}</span>}<div><p className="text-sm font-semibold">Profile photo</p><AvatarUpload onUploaded={setAvatarUrl} /></div></div>
    <div><label htmlFor="displayName" className="mb-2 block text-sm font-semibold">Display name</label><Input id="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} autoComplete="name" required /></div>
    <Button className="w-full" disabled={busy || !displayName.trim()}>{busy ? "Saving..." : "Finish profile"}</Button>
  </form>;
}
