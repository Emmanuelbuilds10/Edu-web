"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type QuestionDraft = { prompt: string; options: string[]; correctIndex: number; explanation: string };
type QuizDraft = { title: string; passPercent: number; questions: QuestionDraft[] };
type AssignmentDraft = { title: string; instructions: string };
type Submission = { id: string; studentName: string; response: string; status: string; score: number | null; feedback: string | null; submittedAt: string };
const blankQuestion = (): QuestionDraft => ({ prompt: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" });

// One colour family for every action in the lesson editor.
const primaryAction = "gap-2 rounded-xl bg-teal-600 text-white shadow-none hover:bg-teal-700";
const softAction = "gap-2 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 shadow-none hover:bg-teal-100 hover:text-teal-800";

export function ChapterActivitiesEditor({ courseId, chapterId, initialQuiz, initialAssignment }: {
  courseId: string;
  chapterId: string;
  initialQuiz: null | { title: string; passPercent: number; questions: { prompt: string; options: string[]; correctIndex: number; explanation: string | null }[] };
  initialAssignment: null | AssignmentDraft;
}) {
  const [quiz, setQuiz] = useState<QuizDraft | null>(initialQuiz ? {
    title: initialQuiz.title,
    passPercent: initialQuiz.passPercent,
    questions: initialQuiz.questions.map((question) => ({ ...question, explanation: question.explanation ?? "" })),
  } : null);
  const [assignment, setAssignment] = useState<AssignmentDraft | null>(initialAssignment);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialAssignment) return;
    axios.get("/api/courses/" + courseId + "/chapters/" + chapterId + "/assignment")
      .then(({ data }) => setSubmissions(data))
      .catch(() => toast.error("Could not load assignment submissions"));
  }, [courseId, chapterId, initialAssignment]);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put("/api/courses/" + courseId + "/chapters/" + chapterId + "/activities", { quiz, assignment });
      toast.success("Chapter activities saved");
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.error ?? "Could not save activities" : "Could not save activities");
    } finally { setSaving(false); }
  };

  const updateQuestion = (index: number, update: Partial<QuestionDraft>) => setQuiz((current) => current && ({
    ...current,
    questions: current.questions.map((question, questionIndex) => questionIndex === index ? { ...question, ...update } : question),
  }));

  return (
    <section className="surface-card space-y-6 p-5 sm:p-7">
      <div><p className="eyebrow">Learning activities</p><h2 className="mt-1 text-xl font-bold text-slate-900">Quiz and assignment</h2><p className="mt-1 text-sm text-slate-500">Add practice to this chapter and review learner submissions.</p></div>

      <div className="rounded-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div><h3 className="font-semibold">Chapter quiz</h3><p className="text-xs text-slate-500">Multiple choice, with instant results for learners.</p></div>
          {quiz ? <Button type="button" size="sm" className={softAction} onClick={() => setQuiz(null)}><Trash2 className="mr-2 h-4 w-4" />Remove quiz</Button> : <Button type="button" size="sm" className={primaryAction} onClick={() => setQuiz({ title: "Chapter quiz", passPercent: 70, questions: [blankQuestion()] })}><Plus className="mr-2 h-4 w-4" />Add quiz</Button>}
        </div>
        {quiz && <div className="mt-4 space-y-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <Input value={quiz.title} onChange={(event) => setQuiz({ ...quiz, title: event.target.value })} placeholder="Quiz title" />
            <label className="text-xs font-medium text-slate-600">Pass mark (%)<Input type="number" min={1} max={100} value={quiz.passPercent} onChange={(event) => setQuiz({ ...quiz, passPercent: Number(event.target.value) })} /></label>
          </div>
          {quiz.questions.map((question, index) => <div key={index} className="space-y-3 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between"><h4 className="text-sm font-bold">Question {index + 1}</h4>                    {quiz.questions.length > 1 && <Button type="button" size="sm" className={softAction} onClick={() => setQuiz({ ...quiz, questions: quiz.questions.filter((_, questionIndex) => questionIndex !== index) })}>Remove</Button>}</div>
            <Textarea value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} placeholder="Write the question" />
            <div className="grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => <label key={optionIndex} className="text-xs font-medium text-slate-600">Option {optionIndex + 1}<div className="flex gap-2"><Input value={option} onChange={(event) => { const options = [...question.options]; options[optionIndex] = event.target.value; updateQuestion(index, { options }); }} /><input aria-label={"Mark option " + (optionIndex + 1) + " as correct"} type="radio" name={"correct-" + index} checked={question.correctIndex === optionIndex} onChange={() => updateQuestion(index, { correctIndex: optionIndex })} className="accent-neutral-600" /></div></label>)}</div>
            <Input value={question.explanation} onChange={(event) => updateQuestion(index, { explanation: event.target.value })} placeholder="Optional explanation shown after submission" />
          </div>)}              {quiz.questions.length < 20 && <Button type="button" size="sm" className={softAction} onClick={() => setQuiz({ ...quiz, questions: [...quiz.questions, blankQuestion()] })}><Plus className="mr-2 h-4 w-4" />Add question</Button>}
        </div>}
      </div>

      <div className="rounded-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div><h3 className="font-semibold">Written assignment</h3><p className="text-xs text-slate-500">Learners submit a written response for your review.</p></div>
          {assignment ? <Button type="button" size="sm" className={softAction} onClick={() => setAssignment(null)}><Trash2 className="mr-2 h-4 w-4" />Remove assignment</Button> : <Button type="button" size="sm" className={primaryAction} onClick={() => setAssignment({ title: "Chapter assignment", instructions: "" })}><Plus className="mr-2 h-4 w-4" />Add assignment</Button>}
        </div>
        {assignment && <div className="mt-4 space-y-3"><Input value={assignment.title} onChange={(event) => setAssignment({ ...assignment, title: event.target.value })} placeholder="Assignment title" /><Textarea value={assignment.instructions} onChange={(event) => setAssignment({ ...assignment, instructions: event.target.value })} placeholder="Assignment instructions" /></div>}
      </div>

      <div className="flex justify-end"><Button disabled={saving} onClick={save} className={primaryAction}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save activities"}</Button></div>

      {assignment && <div className="border-t border-slate-100 pt-5"><h3 className="font-semibold">Learner submissions ({submissions.length})</h3>{submissions.length ? <div className="mt-3 space-y-3">{submissions.map((submission) => <SubmissionReview key={submission.id} courseId={courseId} chapterId={chapterId} submission={submission} />)}</div> : <p className="mt-2 text-sm text-slate-500">No submissions yet.</p>}</div>}
    </section>
  );
}

function SubmissionReview({ courseId, chapterId, submission }: { courseId: string; chapterId: string; submission: Submission }) {
  const [score, setScore] = useState(submission.score ?? 0);
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const review = async () => {
    setSaving(true);
    try {
      await axios.patch("/api/courses/" + courseId + "/chapters/" + chapterId + "/assignment/submissions/" + submission.id, { score, feedback });
      toast.success("Feedback saved");
    } catch { toast.error("Could not save feedback"); }
    finally { setSaving(false); }
  };
  return <article className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold text-slate-900">{submission.studentName}</p><p className="text-xs text-slate-500">{new Date(submission.submittedAt).toLocaleDateString()} · {submission.status.toLowerCase()}</p></div><label className="text-xs">Score %<Input type="number" min={0} max={100} value={score} onChange={(event) => setScore(Number(event.target.value))} className="w-20" /></label></div><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{submission.response}</p><Textarea className="mt-3" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Feedback for learner" /><Button size="sm" disabled={saving} onClick={review} className={primaryAction + " mt-2"}>Save review</Button></article>;
}
