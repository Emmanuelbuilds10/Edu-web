"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  ListChecks,
  Loader2,
  PenLine,
  PlayCircle,
  Plus,
  Trash2,
  Unlock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Editor } from "@/components/editor";
import { FileUpload } from "@/components/file-upload";
import { cn } from "@/lib/utils";

type QuestionDraft = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};
type QuizDraft = {
  title: string;
  passPercent: number;
  questions: QuestionDraft[];
};
type AssignmentDraft = { title: string; instructions: string };

const blankQuestion = (): QuestionDraft => ({
  prompt: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
});

const primaryAction =
  "gap-2 rounded-xl bg-teal-600 text-white shadow-none hover:bg-teal-700";
const softAction =
  "gap-2 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 shadow-none hover:bg-teal-100 hover:text-teal-800";

const SectionHeading = ({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof PenLine;
  title: string;
  description: string;
}) => (
  <div className="flex items-center gap-3">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-[0_10px_24px_rgba(16,185,129,0.28)]">
      <Icon className="h-5 w-5" />
    </span>
    <div className="min-w-0">
      <h2 className="text-base font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  </div>
);

export function LessonComposer({ courseId }: { courseId: string }) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isFree, setIsFree] = useState(false);
  const [quiz, setQuiz] = useState<QuizDraft | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const updateQuestion = (index: number, update: Partial<QuestionDraft>) =>
    setQuiz(
      (current) =>
        current && {
          ...current,
          questions: current.questions.map((question, questionIndex) =>
            questionIndex === index ? { ...question, ...update } : question
          ),
        }
    );

  const readiness = [
    { label: "Title", done: title.trim().length > 0 },
    { label: "Description", done: description.trim().length > 0 },
    { label: "Video", done: Boolean(videoUrl) },
  ];
  const canSubmit = readiness[0].done && !saving;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Give the lesson a title first");
      return;
    }

    setSaving(true);
    setServerError(null);
    try {
      const { data } = await axios.post<{ id: string }>(
        `/api/courses/${courseId}/chapters`,
        {
          title: title.trim(),
          description: description.trim() || undefined,
          videoUrl: videoUrl ?? undefined,
          isFree,
          quiz,
          assignment,
        }
      );
      toast.success("Lesson created");
      router.push(`/teacher/courses/${courseId}/chapters/${data.id}`);
      router.refresh();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? typeof error.response?.data === "string"
          ? error.response.data
          : typeof error.response?.data?.error === "string"
            ? error.response.data.error
            : "Could not create the lesson. Please try again."
        : "Could not create the lesson. Please try again.";
      setServerError(message);
      toast.error(message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basics */}
      <section className="surface-card p-5 sm:p-6">
        <SectionHeading
          icon={PenLine}
          title="Lesson basics"
          description="The name of the lesson and what learners take away from it."
        />
        <div className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="lesson-title"
              className="text-sm font-semibold text-slate-800"
            >
              Lesson title
            </label>
            <Input
              id="lesson-title"
              autoFocus
              value={title}
              maxLength={120}
              disabled={saving}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Getting started with the basics"
              className="mt-2 h-11 rounded-xl border-slate-200 bg-white text-base focus-visible:border-teal-300 focus-visible:ring-teal-500/20"
            />
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Required. Everything else is optional.
              </p>
              <span
                className={cn(
                  "shrink-0 text-xs font-medium tabular-nums",
                  title.length > 110 ? "text-amber-600" : "text-slate-400"
                )}
              >
                {title.length}/120
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">
              What this lesson teaches
            </label>
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Editor value={description} onChange={setDescription} />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Learners see this above the video. Required before you publish.
            </p>
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="surface-card p-5 sm:p-6">
        <SectionHeading
          icon={PlayCircle}
          title="Lesson video"
          description="The video learners watch for this lesson."
        />
        <div className="mt-5">
          {!videoUrl ? (
            <FileUpload
              endpoint="chapterVideo"
              onChange={(url) => {
                if (url) setVideoUrl(url);
              }}
            />
          ) : (
            <div className="space-y-3">
              <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
                <video className="h-full w-full" controls src={videoUrl} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={softAction}
                  onClick={() => setVideoUrl(null)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove video
                </Button>
                <span className="text-xs text-slate-500">
                  Upload another file to replace it.
                </span>
              </div>
            </div>
          )}
          {!videoUrl && (
            <p className="mt-3 text-xs text-slate-500">
              You can create the lesson now and add the video later.
            </p>
          )}
        </div>
      </section>

      {/* Access */}
      <section className="surface-card p-5 sm:p-6">
        <SectionHeading
          icon={Unlock}
          title="Access"
          description="Let learners preview this lesson before they buy the course."
        />
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <Checkbox
            id="lesson-free-preview"
            checked={isFree}
            onCheckedChange={(checked) => setIsFree(checked === true)}
          />
          <div className="space-y-1">
            <label
              htmlFor="lesson-free-preview"
              className="text-sm font-semibold text-slate-800"
            >
              Free preview lesson
            </label>
            <p className="text-xs leading-5 text-slate-500">
              Anyone can watch this lesson without enrolling, including people
              who have not bought the course.
            </p>
          </div>
        </div>
      </section>

      {/* Quiz */}
      <section className="surface-card p-5 sm:p-6">
        <SectionHeading
          icon={ListChecks}
          title="Quiz"
          description="Optional multiple-choice questions with instant results."
        />
        <div className="mt-5 rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">
              {quiz ? `${quiz.questions.length} question(s)` : "No quiz yet"}
            </p>
            {quiz ? (
              <Button
                type="button"
                size="sm"
                className={softAction}
                onClick={() => setQuiz(null)}
              >
                <Trash2 className="h-4 w-4" /> Remove quiz
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className={primaryAction}
                onClick={() =>
                  setQuiz({
                    title: "Lesson quiz",
                    passPercent: 70,
                    questions: [blankQuestion()],
                  })
                }
              >
                <Plus className="h-4 w-4" /> Add quiz
              </Button>
            )}
          </div>

          {quiz && (
            <div className="mt-4 space-y-5">
              <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <label className="text-xs font-medium text-slate-600">
                  Quiz title
                  <Input
                    className="mt-1.5"
                    value={quiz.title}
                    onChange={(event) =>
                      setQuiz({ ...quiz, title: event.target.value })
                    }
                    placeholder="Quiz title"
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  Pass mark (%)
                  <Input
                    className="mt-1.5"
                    type="number"
                    min={1}
                    max={100}
                    value={quiz.passPercent}
                    onChange={(event) =>
                      setQuiz({
                        ...quiz,
                        passPercent: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>

              {quiz.questions.map((question, index) => (
                <div key={index} className="space-y-3 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold">Question {index + 1}</h4>
                    {quiz.questions.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        className={softAction}
                        onClick={() =>
                          setQuiz({
                            ...quiz,
                            questions: quiz.questions.filter(
                              (_, questionIndex) => questionIndex !== index
                            ),
                          })
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={question.prompt}
                    onChange={(event) =>
                      updateQuestion(index, { prompt: event.target.value })
                    }
                    placeholder="Write the question"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="text-xs font-medium text-slate-600"
                      >
                        Option {optionIndex + 1}
                        <div className="mt-1.5 flex gap-2">
                          <Input
                            value={option}
                            onChange={(event) => {
                              const options = [...question.options];
                              options[optionIndex] = event.target.value;
                              updateQuestion(index, { options });
                            }}
                          />
                          <input
                            aria-label={`Mark option ${optionIndex + 1} as correct`}
                            type="radio"
                            name={`correct-${index}`}
                            checked={question.correctIndex === optionIndex}
                            onChange={() =>
                              updateQuestion(index, { correctIndex: optionIndex })
                            }
                            className="accent-teal-600"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                  <Input
                    value={question.explanation}
                    onChange={(event) =>
                      updateQuestion(index, { explanation: event.target.value })
                    }
                    placeholder="Optional explanation shown after submission"
                  />
                </div>
              ))}

              {quiz.questions.length < 20 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={softAction}
                  onClick={() =>
                    setQuiz({
                      ...quiz,
                      questions: [...quiz.questions, blankQuestion()],
                    })
                  }
                >
                  <Plus className="h-4 w-4" /> Add question
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Assignment */}
      <section className="surface-card p-5 sm:p-6">
        <SectionHeading
          icon={ClipboardList}
          title="Written assignment"
          description="Optional: learners submit a written response for your review."
        />
        <div className="mt-5 rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">
              {assignment ? assignment.title : "No assignment yet"}
            </p>
            {assignment ? (
              <Button
                type="button"
                size="sm"
                className={softAction}
                onClick={() => setAssignment(null)}
              >
                <Trash2 className="h-4 w-4" /> Remove assignment
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className={primaryAction}
                onClick={() =>
                  setAssignment({ title: "Lesson assignment", instructions: "" })
                }
              >
                <Plus className="h-4 w-4" /> Add assignment
              </Button>
            )}
          </div>

          {assignment && (
            <div className="mt-4 space-y-3">
              <label className="text-xs font-medium text-slate-600">
                Assignment title
                <Input
                  className="mt-1.5"
                  value={assignment.title}
                  onChange={(event) =>
                    setAssignment({ ...assignment, title: event.target.value })
                  }
                  placeholder="Assignment title"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Instructions
                <Textarea
                  className="mt-1.5"
                  value={assignment.instructions}
                  onChange={(event) =>
                    setAssignment({
                      ...assignment,
                      instructions: event.target.value,
                    })
                  }
                  placeholder="What should learners submit?"
                />
              </label>
              {assignment.instructions.trim().length < 10 && (
                <p className="text-xs text-amber-600">
                  Add at least a sentence so learners know what to do.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {serverError && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700"
        >
          {serverError}
        </p>
      )}

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_12px_36px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          {readiness.map((item) => (
            <span
              key={item.label}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                item.done
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              )}
            >
              {item.done ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              {item.label}
            </span>
          ))}
          <span className="text-xs text-slate-500">
            Title, description and video are needed to publish.
          </span>
        </div>

        <Button
          type="submit"
          disabled={!canSubmit}
          className={cn(primaryAction, "h-11 px-6")}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {saving ? "Creating lesson..." : "Create lesson"}
        </Button>
      </div>
    </form>
  );
}