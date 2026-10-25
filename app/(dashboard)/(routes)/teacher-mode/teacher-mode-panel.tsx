"use client";

import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Check, GraduationCap, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Application = { id: string; fullName: string; email: string; statement: string; createdAt: string };

export function TeacherModePanel({ isTeacher, isAdmin, applicationStatus }: { isTeacher: boolean; isAdmin: boolean; applicationStatus: string | null }) {
  const router = useRouter();
  const [statement, setStatement] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    axios.get("/api/teacher/applications")
      .then(({ data }) => setApplications(data))
      .catch(() => toast.error("Could not load teacher applications"));
  }, [isAdmin]);

  const apply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      await axios.post("/api/teacher/applications", { statement });
      toast.success("Application submitted for review");
      setStatement("");
      router.refresh();
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.error ?? "Could not submit application" : "Could not submit application");
    } finally { setBusy(false); }
  };

  const decide = async (applicationId: string, decision: "APPROVED" | "REJECTED") => {
    setBusy(true);
    try {
      await axios.patch("/api/teacher/applications", { applicationId, decision });
      setApplications((current) => current.filter((application) => application.id !== applicationId));
      toast.success(decision === "APPROVED" ? "Teacher application approved" : "Application declined");
      router.refresh();
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.error ?? "Could not update application" : "Could not update application");
    } finally { setBusy(false); }
  };

  const addTeacher = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await axios.put("/api/teacher/applications", { email: teacherEmail });
      toast.success(`${data.name} added as a teacher`);
      setApplications((current) => current.filter((application) => application.email.toLowerCase() !== teacherEmail.toLowerCase()));
      setTeacherEmail("");
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.error ?? "Could not add teacher" : "Could not add teacher");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <section className="surface-card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-inset ring-teal-100"><GraduationCap className="h-6 w-6" /></span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{isTeacher ? "Teacher access is active" : "Teach what you know"}</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">{isTeacher ? "Create courses, manage lessons, and view your teaching analytics." : "Apply to publish courses and help learners build new skills."}</p>
          </div>
        </div>
        {isTeacher && <Button asChild className="shrink-0 gap-2 bg-teal-600 text-white hover:bg-teal-700"><Link href="/teacher/courses"><BookOpen className="h-4 w-4" />Open teacher workspace<ArrowRight className="h-4 w-4" /></Link></Button>}
      </section>

      {!isTeacher && (
        <section className="surface-card p-6 sm:p-8">
          {applicationStatus === "PENDING" ? (
            <div className="rounded-xl bg-amber-50 p-5 text-sm leading-6 text-amber-900">Your application is awaiting review. You can keep learning while it is pending.</div>
          ) : (
            <form onSubmit={apply} className="space-y-4">
              <div><h2 className="text-xl font-bold text-slate-900">Apply as a teacher</h2><p className="mt-1 text-sm text-slate-500">Tell us about your experience and what you would like to teach. (30–2,000 characters)</p></div>
              {applicationStatus === "REJECTED" && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Your previous application was declined. You may submit an updated application.</p>}
              <Textarea value={statement} onChange={(event) => setStatement(event.target.value)} minLength={30} maxLength={2000} placeholder="Share your subject area, experience, and the kind of courses you plan to create..." required />
              <Button disabled={busy || statement.trim().length < 30}>{busy ? "Submitting..." : "Submit application"}</Button>
            </form>
          )}
        </section>
      )}

      {isAdmin && (
        <section className="surface-card space-y-5 p-6 sm:p-8">
          <div><p className="eyebrow">Teacher administration</p><h2 className="mt-1 text-xl font-bold text-slate-900">Manage teacher access</h2><p className="mt-1 text-sm text-slate-500">You can add an existing account by email or review applications.</p></div>
          <form onSubmit={addTeacher} className="flex flex-col gap-2 sm:flex-row">
            <Input type="email" value={teacherEmail} onChange={(event) => setTeacherEmail(event.target.value)} placeholder="Existing user’s email address" required />
            <Button disabled={busy} className="shrink-0 gap-2"><UserPlus className="h-4 w-4" />Add teacher</Button>
          </form>
          <div className="border-t border-slate-100 pt-5">
            <h3 className="font-semibold text-slate-900">Pending applications <span className="ml-1 text-sm font-normal text-slate-500">{applications.length}</span></h3>
            {applications.length ? <div className="mt-3 space-y-3">{applications.map((application) => (
              <article key={application.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div><p className="font-semibold text-slate-900">{application.fullName}</p><p className="text-xs text-slate-500">{application.email}</p></div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busy} onClick={() => decide(application.id, "APPROVED")} className="gap-1 bg-teal-600 text-white hover:bg-teal-700"><Check className="h-4 w-4" />Approve</Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => decide(application.id, "REJECTED")} className="gap-1"><X className="h-4 w-4" />Decline</Button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{application.statement}</p>
              </article>
            ))}</div> : <p className="mt-3 text-sm text-slate-500">No pending applications.</p>}
          </div>
        </section>
      )}

      {isTeacher && <Button asChild variant="outline"><Link href="/dashboard">Switch back to learning</Link></Button>}
    </div>
  );
}
