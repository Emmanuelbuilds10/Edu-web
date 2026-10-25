"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ProfileValues = { headline: string; bio: string; expertise: string; websiteUrl: string; linkedinUrl: string };

export function ProfileForm({ initialValues }: { initialValues: ProfileValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const update = (field: keyof ProfileValues, value: string) => setValues((current) => ({ ...current, [field]: value }));

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await axios.patch("/api/teacher/profile", {
        ...values,
        expertise: values.expertise.split(",").map((item) => item.trim()).filter(Boolean),
      });
      toast.success("Teacher profile saved");
      router.refresh();
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.error ?? "Could not save profile" : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="surface-card space-y-5 p-6 sm:p-8">
      <div><label htmlFor="headline" className="mb-2 block text-sm font-semibold">Professional headline</label><Input id="headline" value={values.headline} onChange={(event) => update("headline", event.target.value)} maxLength={120} placeholder="e.g. Product designer and educator" /></div>
      <div><label htmlFor="bio" className="mb-2 block text-sm font-semibold">About you</label><Textarea id="bio" value={values.bio} onChange={(event) => update("bio", event.target.value)} maxLength={2000} rows={7} placeholder="Share your experience, teaching approach, and what students can expect." /><p className="mt-1 text-right text-xs text-slate-400">{values.bio.length}/2000</p></div>
      <div><label htmlFor="expertise" className="mb-2 block text-sm font-semibold">Areas of expertise</label><Input id="expertise" value={values.expertise} onChange={(event) => update("expertise", event.target.value)} placeholder="Design, Product strategy, Figma" /><p className="mt-1 text-xs text-slate-500">Separate up to 8 topics with commas.</p></div>
      <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="websiteUrl" className="mb-2 block text-sm font-semibold">Website</label><Input id="websiteUrl" type="url" value={values.websiteUrl} onChange={(event) => update("websiteUrl", event.target.value)} placeholder="https://example.com" /></div><div><label htmlFor="linkedinUrl" className="mb-2 block text-sm font-semibold">LinkedIn</label><Input id="linkedinUrl" type="url" value={values.linkedinUrl} onChange={(event) => update("linkedinUrl", event.target.value)} placeholder="https://www.linkedin.com/in/you" /></div></div>
      <Button disabled={saving}>{saving ? "Saving profile..." : "Save profile"}</Button>
    </form>
  );
}
