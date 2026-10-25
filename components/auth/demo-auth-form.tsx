"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const demoAccounts = [
  { label: "Student", email: "student@sabiplex.dev", password: "student123", icon: UserRound },
  { label: "Administrator", email: "admin@sabiplex.dev", password: "admin123", icon: ShieldCheck },
];

export function DemoAuthForm({
  mode,
  redirectUrl,
}: {
  mode: "sign-in" | "sign-up";
  redirectUrl?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignIn = mode === "sign-in";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const endpoint = isSignIn ? "/api/demo/sign-in" : "/api/demo/sign-up";
      await axios.post(endpoint, isSignIn ? { email, password } : { name, email, password });
      toast.success(isSignIn ? "Welcome back" : "Account created");
      router.replace(redirectUrl && redirectUrl.startsWith("/") ? redirectUrl : "/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error) && typeof error.response?.data?.error === "string"
          ? error.response.data.error
          : "Something went wrong. Please try again."
      );
      setBusy(false);
    }
  };

  const fillDemoAccount = (accountEmail: string, accountPassword: string) => {
    setEmail(accountEmail);
    setPassword(accountPassword);
  };

  return (
    <div className="w-full max-w-md p-4 sm:p-6">
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-600">
          {isSignIn ? "Welcome back" : "Create your account"}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          {isSignIn ? "Sign in to Sabiplex" : "Start learning today"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isSignIn ? "Pick up your courses and keep going." : "Free to join. Learn at your own pace."}
        </p>
      </div>

      <form onSubmit={submit} className="mt-7 space-y-4">
        {!isSignIn && (
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-800">Full name</label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ada Lovelace" autoComplete="name" minLength={2} maxLength={80} required />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">Email address</label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">Password</label>
          <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignIn ? "Your password" : "At least 8 characters"} autoComplete={isSignIn ? "current-password" : "new-password"} minLength={isSignIn ? 1 : 8} required />
        </div>
        <Button className="w-full gap-2" disabled={busy || !email.trim() || !password} type="submit">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Please wait..." : isSignIn ? "Sign in" : "Create account"}
          {!busy && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        {isSignIn ? "New to Sabiplex? " : "Already have an account? "}
        <Link href={isSignIn ? "/sign-up" : "/sign-in"} className="font-semibold text-slate-900 underline underline-offset-4">
          {isSignIn ? "Create an account" : "Sign in"}
        </Link>
      </p>

      {isSignIn && (
        <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Demo accounts</p>
          <p className="mt-1 text-xs text-slate-500">Local test mode — click an account to fill the form.</p>
          <div className="mt-3 space-y-2">
            {demoAccounts.map(({ label, email: accountEmail, password: accountPassword, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => fillDemoAccount(accountEmail, accountPassword)}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-neutral-400 hover:shadow-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-neutral-600" />
                <span className="flex-1">
                  <span className="block font-semibold text-slate-800">{label}</span>
                  <span className="block text-xs text-slate-500">{accountEmail} · {accountPassword}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
