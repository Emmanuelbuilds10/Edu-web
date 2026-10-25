"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";

export type AccountRow = {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  hasTeacherAccess: boolean;
};

export function UserRoleManager({ initialAccounts }: { initialAccounts: AccountRow[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const toggleTeacher = async (account: AccountRow) => {
    try {
      setBusyId(account.id);
      const nextValue = !account.hasTeacherAccess;
      await axios.patch("/api/admin/users", { userId: account.id, teacher: nextValue });
      setAccounts((current) =>
        current.map((row) => (row.id === account.id ? { ...row, hasTeacherAccess: nextValue } : row))
      );
      toast.success(nextValue ? `${account.name} can now teach` : `${account.name} can no longer teach`);
    } catch (error) {
      toast.error(
        axios.isAxiosError(error) && typeof error.response?.data?.error === "string"
          ? error.response.data.error
          : "Could not update this account"
      );
    } finally {
      setBusyId(null);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const visible = accounts.filter((account) =>
    !normalizedQuery
      ? true
      : [account.name, account.email, account.username].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery)
  );

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search accounts by name, email or username"
        className="h-10 w-full max-w-md rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-500/20"
      />

      <div className="surface-card overflow-hidden">
        {visible.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">No accounts match that search.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((account) => (
              <div key={account.id} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  {account.avatarUrl ? (
                    <img src={account.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-50 text-teal-700">
                      <UserRound className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {account.name}
                      {account.isAdmin && (
                        <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-800">
                          Admin
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {account.email ?? "No email"}
                      {account.username ? ` · @${account.username}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {account.hasTeacherAccess ? "Teacher access" : "Student"}
                  </span>
                  <Button
                    size="sm"
                    variant={account.hasTeacherAccess ? "outline" : "default"}
                    disabled={account.isAdmin || busyId === account.id}
                    onClick={() => toggleTeacher(account)}
                    className={account.hasTeacherAccess ? "gap-1.5" : "gap-1.5 bg-teal-600 text-white hover:bg-teal-700"}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {busyId === account.id ? "Saving..." : account.hasTeacherAccess ? "Revoke teacher" : "Make teacher"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
