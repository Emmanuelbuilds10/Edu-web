import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, BookOpen, Compass, MessageCircle, Sparkles, Users } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSearch } from "@/components/landing/hero-search";
import { StatCounter } from "@/components/landing/stat-counter";
import { Reveal } from "@/components/landing/reveal";
import { FeaturedCourses, FeaturedCoursesSkeleton } from "@/components/landing/featured-courses";

const benefits = [
  {
    title: "Learn from your peers",
    body: "Explore courses from teachers sharing the knowledge and experience they have built themselves.",
    Icon: BookOpen,
  },
  {
    title: "Make progress at your pace",
    body: "Work through focused chapters, keep track of your progress, and return whenever you are ready.",
    Icon: Compass,
  },
  {
    title: "Stay connected to your community",
    body: "Ask questions, share ideas, and learn alongside people working toward their own goals.",
    Icon: Users,
  },
];

const steps = [
  "Explore courses shared by teachers in the community",
  "Learn through focused chapters and track your progress",
  "Ask questions and connect with other learners",
];

export default async function LandingPage() {
  const { userId } = auth();

  const [courseCount, lessonCount, owners, categories] = await Promise.all([
    db.course.count({ where: { isPublished: true } }),
    db.chapter.count({ where: { isPublished: true, course: { isPublished: true } } }),
    db.course.findMany({ where: { isPublished: true }, select: { userId: true }, distinct: ["userId"] }),
    db.category.findMany({
      where: { courses: { some: { isPublished: true } } },
      orderBy: { name: "asc" },
      take: 4,
      select: { id: true, name: true },
    }),
  ]);

  const suggestions = categories.map((category) => ({
    label: category.name,
    href: `/search?categoryId=${category.id}`,
  }));

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,.10),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(148,163,184,.14),transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="animate-float-slow absolute -left-24 top-16 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="animate-float-slower absolute -right-24 top-0 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="animate-float-slow absolute bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <LandingNav isSignedIn={Boolean(userId)} />

      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-32 text-center lg:px-8 lg:pb-24 lg:pt-40">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-neutral-100 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-300" />
          </span>
          Learning built around students
        </div>

        <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-black leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
          Learn from people who{" "}
          <span className="animate-gradient-pan bg-[linear-gradient(90deg,#e2e8f0,#5eead4,#c7d2fe,#e2e8f0)] bg-[length:220%_auto] bg-clip-text text-transparent">
            know the journey.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
          Discover peer-led courses, build practical knowledge, and connect with a community that understands the student
          experience.
        </p>

        <HeroSearch suggestions={suggestions} />

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/search"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-bold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Explore courses
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
          <Link
            href={userId ? "/dashboard" : "/sign-up"}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3.5 font-bold text-white transition hover:border-white/40 hover:bg-white/10"
          >
            {userId ? "Go to your dashboard" : "Join the community"}
          </Link>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-white/[.06] px-4 py-6 backdrop-blur sm:gap-0 sm:divide-x sm:divide-white/10">
          <StatCounter value={courseCount} label="Published courses" />
          <StatCounter value={lessonCount} label="Lessons" />
          <StatCounter value={owners.length} label="Teachers" />
        </div>
      </section>

      <section id="courses" className="relative scroll-mt-24 bg-slate-50 px-6 py-20 text-slate-900 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Fresh from the community</p>
              <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight sm:text-5xl">
                Courses your peers are building right now.
              </h2>
            </div>
            <Link
              href="/search"
              className="group inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
            >
              Browse all courses
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <Reveal delay={100} className="mt-10">
            <Suspense fallback={<FeaturedCoursesSkeleton />}>
              <FeaturedCourses />
            </Suspense>
          </Reveal>
        </div>
      </section>

      <section id="why" className="relative scroll-mt-24 bg-white px-6 py-24 text-slate-900 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="eyebrow">Learning is better together</p>
            <div className="mt-4 flex max-w-3xl flex-col justify-between gap-6 md:flex-row">
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                A student community built to help you move forward.
              </h2>
              <p className="max-w-sm leading-7 text-slate-600">
                Find knowledge from fellow teachers, make steady progress, and connect with learners who understand your
                goals.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {benefits.map(({ title, body, Icon }, index) => (
              <Reveal key={title} delay={index * 90} className="h-full">
                <article className="group h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-neutral-300 hover:shadow-xl">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-700 transition duration-300 group-hover:scale-110 group-hover:bg-neutral-900 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-8 text-sm font-bold text-neutral-500">0{index + 1}</p>
                  <h3 className="mt-2 text-xl font-bold">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-24 bg-slate-50 px-6 py-24 text-slate-900 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">A clearer way to learn</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Find a course. Learn together. Keep growing.</h2>
            <div className="mt-9 space-y-4">
              {steps.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-4 rounded-2xl border border-transparent px-3 py-3 text-lg font-semibold transition hover:border-slate-200 hover:bg-white"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-900 text-sm text-white">
                    {index + 1}
                  </span>
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="/sign-up"
              className="group mt-8 inline-flex items-center gap-2 text-sm font-bold text-slate-900 underline-offset-4 hover:underline"
            >
              Create your free account
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative rounded-[2rem] bg-gradient-to-br from-neutral-800 via-neutral-700 to-slate-900 p-7 text-white shadow-2xl shadow-slate-300">
              <div className="absolute -right-3 -top-3 rounded-full border border-white/20 bg-slate-950/80 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-teal-200 backdrop-blur">
                Live community
              </div>
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                  <MessageCircle className="h-6 w-6 text-teal-200" />
                </div>
                <p className="mt-6 text-sm text-neutral-100">Your learning community</p>
                <p className="mt-2 text-2xl font-bold">Knowledge grows when it is shared.</p>
                <div className="mt-8 space-y-3">
                  {[
                    ["Courses from fellow teachers", BookOpen],
                    ["Progress through every chapter", Compass],
                    ["Questions, ideas, and discussion", Users],
                  ].map(([label, Icon], index) => {
                    const FeatureIcon = Icon as typeof BookOpen;
                    return (
                      <div
                        key={label as string}
                        className="flex items-center gap-3 rounded-xl bg-white/10 p-4 text-sm font-semibold transition hover:bg-white/15"
                        style={{ animationDelay: `${index * 200}ms` }}
                      >
                        <FeatureIcon className="h-4 w-4 shrink-0 text-teal-200" />
                        {label as string}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 px-6 py-20 lg:px-8">
        <div
          aria-hidden
          className="animate-float-slow pointer-events-none absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-teal-400/10 blur-3xl"
        />
        <Reveal className="relative mx-auto max-w-4xl text-center">
          <Sparkles className="mx-auto h-7 w-7 text-teal-200" />
          <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Your next chapter starts today.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Join a community of learners and teachers who are building practical knowledge, one lesson at a time.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={userId ? "/dashboard" : "/sign-up"}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-bold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              {userId ? "Continue learning" : "Create your free account"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3.5 font-bold text-white transition hover:bg-white/10"
            >
              Browse courses
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 px-6 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-sm text-slate-400 md:flex-row">
          <p>© {new Date().getFullYear()} Sabiplex. Learn boldly.</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/search" className="transition hover:text-white">
              Browse
            </Link>
            <Link href="/forum" className="transition hover:text-white">
              Community
            </Link>
            <Link href="/teacher-mode" className="transition hover:text-white">
              Teach
            </Link>
            <Link href={userId ? "/dashboard" : "/sign-in"} className="transition hover:text-white">
              {userId ? "Dashboard" : "Sign in"}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
