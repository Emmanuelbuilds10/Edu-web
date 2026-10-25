"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type CategorySlice = {
  name: string;
  courses: number;
  percent: number;
  progress: number;
};

export const CATEGORY_COLORS = ["#0d9488", "#38bdf8", "#818cf8", "#f59e0b", "#f472b6"];

type TooltipProps = {
  active?: boolean;
  payload?: { payload: CategorySlice }[];
};

const CategoryTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-900">{slice.name}</p>
      <p className="mt-1 text-slate-500">
        {slice.courses} {slice.courses === 1 ? "course" : "courses"} · {slice.progress}% average progress
      </p>
    </div>
  );
};

export function CategoryDonut({ data, total }: { data: CategorySlice[]; total: number }) {
  if (!data.length) {
    return (
      <div className="flex h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center">
        <p className="text-sm font-semibold text-slate-700">No courses yet</p>
        <p className="mt-1 text-xs text-slate-500">Enrol in a course to see how your learning is spread across topics.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[170px] w-[170px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CategoryTooltip />} />
            <Pie
              data={data}
              dataKey="courses"
              nameKey="name"
              innerRadius={56}
              outerRadius={82}
              paddingAngle={3}
              stroke="#ffffff"
              strokeWidth={3}
            >
              {data.map((slice, index) => (
                <Cell key={slice.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{total}</span>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            {total === 1 ? "course" : "courses"}
          </span>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {data.map((slice, index) => (
          <li key={slice.name} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{slice.name}</span>
            <span className="shrink-0 text-slate-400">
              {slice.courses} · {slice.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
