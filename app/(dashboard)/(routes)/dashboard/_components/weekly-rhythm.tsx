import { cn } from "@/lib/utils";

export type RhythmDay = {
  label: string;
  shortLabel: string;
  lessons: number;
  quizzes: number;
  isToday: boolean;
};

type WeeklyRhythmProps = {
  days: RhythmDay[];
  goal: number;
  lessonsThisWeek: number;
};

export function WeeklyRhythm({ days, goal, lessonsThisWeek }: WeeklyRhythmProps) {
  const max = Math.max(goal, ...days.map((day) => day.lessons + day.quizzes), 1);
  const percent = Math.min(100, Math.round((lessonsThisWeek / Math.max(goal, 1)) * 100));
  const remaining = Math.max(goal - lessonsThisWeek, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm text-slate-500">
          <span className="text-3xl font-bold tracking-tight text-slate-900">{lessonsThisWeek}</span>
          <span className="ml-1.5 font-medium text-slate-500">/ {goal} lessons</span>
        </p>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold",
            remaining === 0 ? "bg-emerald-50 text-emerald-700" : "bg-teal-50 text-teal-700"
          )}
        >
          {remaining === 0 ? "Goal reached" : `${remaining} to go`}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all", remaining === 0 ? "bg-emerald-500" : "bg-teal-500")}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-6 flex flex-1 items-end gap-2">
        {days.map((day) => {
          const activity = day.lessons + day.quizzes;
          return (
            <div key={day.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <div className="flex h-24 w-full max-w-[34px] flex-col-reverse justify-start gap-0.5">
                {day.lessons > 0 && (
                  <div
                    className="w-full rounded-t-md bg-teal-500/90"
                    style={{ height: `${(day.lessons / max) * 100}%` }}
                  />
                )}
                {day.quizzes > 0 && (
                  <div
                    className="w-full rounded-t-md bg-sky-300"
                    style={{ height: `${(day.quizzes / max) * 100}%` }}
                  />
                )}
                {activity === 0 && <div className="h-1 w-full rounded-full bg-slate-200" />}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  day.isToday ? "font-bold text-teal-700" : "text-slate-400"
                )}
              >
                {day.shortLabel}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-[11px] font-medium text-slate-500">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-teal-500" /> Lessons
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-sky-300" /> Quizzes
        </span>
      </div>
    </div>
  );
}
