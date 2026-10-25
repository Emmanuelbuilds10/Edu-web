"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ActivityPoint = {
  label: string;
  fullLabel: string;
  lessons: number;
  quizzes: number;
};

type TooltipProps = {
  active?: boolean;
  payload?: { payload: ActivityPoint }[];
};

const ActivityTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-900">{point.fullLabel}</p>
      <p className="mt-1 flex items-center gap-1.5 text-teal-700">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-teal-500" />
        {point.lessons} {point.lessons === 1 ? "lesson" : "lessons"} completed
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sky-700">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sky-400" />
        {point.quizzes} {point.quizzes === 1 ? "quiz" : "quizzes"} attempted
      </p>
    </div>
  );
};

export function LearningActivityChart({ data }: { data: ActivityPoint[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.34} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            dy={8}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            width={40}
          />
          <Tooltip
            content={<ActivityTooltip />}
            cursor={{ stroke: "#5eead4", strokeWidth: 1.5, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="lessons"
            stroke="#0d9488"
            strokeWidth={2.5}
            fill="url(#activityFill)"
            activeDot={{ r: 5, fill: "#0d9488", stroke: "#ffffff", strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
