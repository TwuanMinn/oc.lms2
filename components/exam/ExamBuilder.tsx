"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Copy,
  GripVertical,
  ChevronDown,
  X,
  ImagePlus,
  Eye,
  Save,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──

export type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "FILL_BLANK";

export interface AnswerChoice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  marks: number;
  choices?: AnswerChoice[];
  correctChoiceId?: string; // MCQ
  correctBoolean?: boolean; // TRUE_FALSE
  acceptedAnswers?: string[][]; // SHORT_ANSWER: string[], FILL_BLANK: string[][] (per blank)
  wordLimit?: number; // ESSAY
  rubric?: string; // ESSAY
}

export interface ExamSettings {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  duration: number;
  passingScore: number;
  attemptsAllowed: number; // 0 = unlimited
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  showScoreImmediately: boolean;
  showCorrectAnswers: boolean;
  preventTabSwitch: boolean;
}

export interface ExamData {
  settings: ExamSettings;
  questions: Question[];
}

interface ExamBuilderProps {
  onSave: (data: ExamData, asDraft: boolean) => void;
  isPending?: boolean;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MCQ: "Multiple Choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short Answer",
  ESSAY: "Essay",
  FILL_BLANK: "Fill in the Blank",
};

const QUESTION_TYPE_BADGES: Record<QuestionType, { label: string; color: string }> = {
  MCQ: { label: "MCQ", color: "bg-blue-500/10 text-blue-600" },
  TRUE_FALSE: { label: "True/False", color: "bg-teal-500/10 text-teal-600" },
  SHORT_ANSWER: { label: "Short Answer", color: "bg-amber-500/10 text-amber-600" },
  ESSAY: { label: "Essay", color: "bg-rose-500/10 text-rose-600" },
  FILL_BLANK: { label: "Fill in Blank", color: "bg-violet-500/10 text-violet-600" },
};

const DEFAULT_MARKS: Record<QuestionType, number> = {
  MCQ: 1,
  TRUE_FALSE: 1,
  SHORT_ANSWER: 2,
  ESSAY: 10,
  FILL_BLANK: 1,
};

let qCounter = 0;
function nextId() { return `q_${++qCounter}_${Date.now()}`; }
function choiceId() { return `c_${++qCounter}_${Date.now()}`; }

function createQuestion(type: QuestionType): Question {
  const base: Question = { id: nextId(), type, text: "", marks: DEFAULT_MARKS[type] };
  if (type === "MCQ") {
    base.choices = [
      { id: choiceId(), text: "" },
      { id: choiceId(), text: "" },
      { id: choiceId(), text: "" },
      { id: choiceId(), text: "" },
    ];
    base.correctChoiceId = "";
  }
  if (type === "TRUE_FALSE") base.correctBoolean = undefined;
  if (type === "SHORT_ANSWER") base.acceptedAnswers = [[""]];
  if (type === "ESSAY") { base.wordLimit = 0; base.rubric = ""; }
  if (type === "FILL_BLANK") { base.acceptedAnswers = []; }
  return base;
}

// ◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼
//  MAIN EXAM BUILDER
// ◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼

export default function ExamBuilder({ onSave, isPending }: ExamBuilderProps) {
  const [settings, setSettings] = useState<ExamSettings>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    duration: 60,
    passingScore: 60,
    attemptsAllowed: 1,
    shuffleQuestions: false,
    shuffleChoices: false,
    showScoreImmediately: true,
    showCorrectAnswers: false,
    preventTabSwitch: false,
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const totalMarks = useMemo(() => questions.reduce((s, q) => s + q.marks, 0), [questions]);
  const questionCount = questions.length;

  // ── Settings updater ──
  const set = useCallback(<K extends keyof ExamSettings>(key: K, val: ExamSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: val }));
  }, []);

  // ── Question CRUD ──
  function addQuestion(type: QuestionType) {
    setQuestions((prev) => [...prev, createQuestion(type)]);
    setShowTypeMenu(false);
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function duplicateQuestion(id: string) {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx === -1) return prev;
      const clone = { ...prev[idx], id: nextId() };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }

  // ── Drag reorder (simple swap) ──
  function handleDragStart(idx: number) { setDragIdx(idx); }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setQuestions((prev) => {
      const next = [...prev];
      const [item] = next.splice(dragIdx, 1);
      next.splice(idx, 0, item);
      return next;
    });
    setDragIdx(idx);
  }
  function handleDragEnd() { setDragIdx(null); }

  // ── Validation ──
  const canSubmit = settings.title.trim() && questions.length > 0;

  return (
    <div className="space-y-6">
      {/* ═══ STEP 1: EXAM SETTINGS ═══ */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exam Settings</h4>

        {/* Row 1: Title + Description */}
        <div className="grid grid-cols-1 gap-3">
          <input
            type="text"
            value={settings.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Exam title *"
            required
            className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
          <textarea
            value={settings.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Instructions for students... (optional)"
            rows={2}
            className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
          />
        </div>

        {/* Row 2: Dates + Duration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Available from</label>
            <input type="datetime-local" value={settings.startDate} onChange={(e) => set("startDate", e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Available until</label>
            <input type="datetime-local" value={settings.endDate} onChange={(e) => set("endDate", e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Duration</label>
            <div className="flex items-center gap-2">
              <input type="number" min={1} value={settings.duration} onChange={(e) => set("duration", +e.target.value)}
                className="w-20 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-center focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              <span className="text-xs text-muted-foreground">minutes</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Students must finish within this time once they start</p>
          </div>
        </div>

        {/* Row 3: Total marks, Passing score, Attempts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Total marks</label>
            <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-2">
              <span className="text-sm font-bold">{totalMarks}</span>
              <span className="text-xs text-muted-foreground">pts (auto-calculated)</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Passing score</label>
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={100} value={settings.passingScore}
                onChange={(e) => set("passingScore", +e.target.value)}
                className="w-20 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-center focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
              <span className="text-xs text-muted-foreground font-semibold">%</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Attempts allowed</label>
            <select value={settings.attemptsAllowed} onChange={(e) => set("attemptsAllowed", +e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={0}>Unlimited</option>
            </select>
          </div>
        </div>

        {/* Row 4: Checkboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            ["shuffleQuestions", "Shuffle question order for each student"],
            ["shuffleChoices", "Shuffle answer choices for MCQ questions"],
            ["showScoreImmediately", "Show score to student immediately after submission"],
            ["showCorrectAnswers", "Show correct answers after submission"],
            ["preventTabSwitch", "Prevent tab switching (flag if student leaves exam window)"],
          ] as [keyof ExamSettings, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={!!settings[key]}
                onChange={(e) => set(key, e.target.checked as never)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-xs text-foreground">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ═══ STEP 2: QUESTION BUILDER ═══ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Questions</h4>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Question <ChevronDown className="h-3 w-3" />
            </button>

            <AnimatePresence>
              {showTypeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl border border-border/50 bg-card shadow-lg py-1"
                >
                  {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addQuestion(type)}
                      className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-muted/50 transition-colors flex items-center gap-2"
                    >
                      <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", QUESTION_TYPE_BADGES[type].color)}>
                        {QUESTION_TYPE_BADGES[type].label}
                      </span>
                      {QUESTION_TYPE_LABELS[type]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Question Cards */}
        <AnimatePresence mode="popLayout">
          {questions.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              layout
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent, i)}
              onDragEnd={handleDragEnd}
              className={cn(
                "rounded-xl border bg-card p-4 space-y-3 transition-shadow",
                dragIdx === i ? "shadow-lg scale-[1.02] border-primary/40" : "border-border/50"
              )}
            >
              {/* Card Header */}
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0" />
                <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", QUESTION_TYPE_BADGES[q.type].color)}>
                  {QUESTION_TYPE_BADGES[q.type].label}
                </span>
                {q.type === "ESSAY" && (
                  <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                    Manual grading required
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={q.marks}
                    onChange={(e) => updateQuestion(q.id, { marks: Math.max(0, +e.target.value) })}
                    className="w-14 rounded-lg border border-border/60 bg-background px-2 py-1 text-xs text-center font-semibold focus:ring-1 focus:ring-primary outline-none"
                  />
                  <span className="text-[10px] text-muted-foreground font-semibold">pts</span>
                  <button type="button" onClick={() => duplicateQuestion(q.id)}
                    className="ml-2 p-1 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => removeQuestion(q.id)}
                    className="p-1 rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <textarea
                value={q.text}
                onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                placeholder="Enter your question here..."
                rows={2}
                className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              />

              {/* Type-specific content */}
              {q.type === "MCQ" && <MCQEditor question={q} onUpdate={(p) => updateQuestion(q.id, p)} />}
              {q.type === "TRUE_FALSE" && <TrueFalseEditor question={q} onUpdate={(p) => updateQuestion(q.id, p)} />}
              {q.type === "SHORT_ANSWER" && <ShortAnswerEditor question={q} onUpdate={(p) => updateQuestion(q.id, p)} />}
              {q.type === "ESSAY" && <EssayEditor question={q} onUpdate={(p) => updateQuestion(q.id, p)} />}
              {q.type === "FILL_BLANK" && <FillBlankEditor question={q} onUpdate={(p) => updateQuestion(q.id, p)} />}
            </motion.div>
          ))}
        </AnimatePresence>

        {questions.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/50 py-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No questions yet. Click &quot;Add Question&quot; to get started.</p>
          </div>
        )}
      </div>

      {/* ═══ STEP 3: BOTTOM ACTION BAR ═══ */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm px-5 py-3 shadow-lg">
        <div className="text-xs text-muted-foreground font-medium">
          {questionCount > 0 ? (
            <span>{questionCount} question{questionCount !== 1 ? "s" : ""} · {totalMarks} pts total</span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-500">
              <AlertTriangle className="h-3.5 w-3.5" /> Add at least 1 question
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowPreview(true)} disabled={questions.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/30 transition-colors disabled:opacity-40">
            <Eye className="h-3.5 w-3.5" /> Preview exam
          </button>
          <button type="button" onClick={() => onSave({ settings, questions }, true)} disabled={!settings.title.trim() || isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/30 transition-colors disabled:opacity-40">
            <Save className="h-3.5 w-3.5" /> Save as draft
          </button>
          <button type="button" onClick={() => onSave({ settings, questions }, false)} disabled={!canSubmit || isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-50 hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add to week
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <ExamPreviewModal settings={settings} questions={questions} onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════
// ── MCQ Editor
// ══════════════════════════════════

function MCQEditor({ question, onUpdate }: { question: Question; onUpdate: (p: Partial<Question>) => void }) {
  const choices = question.choices || [];

  function setChoiceText(id: string, text: string) {
    onUpdate({ choices: choices.map((c) => (c.id === id ? { ...c, text } : c)) });
  }
  function addChoice() {
    if (choices.length >= 6) return;
    onUpdate({ choices: [...choices, { id: choiceId(), text: "" }] });
  }
  function removeChoice(id: string) {
    if (choices.length <= 2) return;
    const next = choices.filter((c) => c.id !== id);
    onUpdate({
      choices: next,
      correctChoiceId: question.correctChoiceId === id ? "" : question.correctChoiceId,
    });
  }
  function selectCorrect(id: string) {
    onUpdate({ correctChoiceId: id });
  }

  const letters = "ABCDEF";
  return (
    <div className="space-y-2 pl-6">
      {choices.map((c, i) => {
        const isCorrect = question.correctChoiceId === c.id;
        return (
          <motion.div
            key={c.id}
            layout
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
              isCorrect ? "border-emerald-400/50 bg-emerald-50 dark:bg-emerald-950/20" : "border-border/40 bg-background"
            )}
          >
            <button
              type="button"
              onClick={() => selectCorrect(c.id)}
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all",
                isCorrect
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-border/60 text-muted-foreground hover:border-primary"
              )}
            >
              {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : letters[i]}
            </button>
            <input
              type="text"
              value={c.text}
              onChange={(e) => setChoiceText(c.id, e.target.value)}
              placeholder={`Choice ${letters[i]}`}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
            {choices.length > 2 && (
              <button type="button" onClick={() => removeChoice(c.id)}
                className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors">Remove</button>
            )}
          </motion.div>
        );
      })}
      {choices.length < 6 && (
        <button type="button" onClick={addChoice}
          className="text-xs text-primary font-semibold hover:underline">+ Add choice</button>
      )}
    </div>
  );
}

// ══════════════════════════════════
// ── True / False Editor
// ══════════════════════════════════

function TrueFalseEditor({ question, onUpdate }: { question: Question; onUpdate: (p: Partial<Question>) => void }) {
  return (
    <div className="flex gap-3 pl-6">
      {[true, false].map((val) => {
        const selected = question.correctBoolean === val;
        return (
          <button
            key={String(val)}
            type="button"
            onClick={() => onUpdate({ correctBoolean: val })}
            className={cn(
              "flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 text-muted-foreground hover:border-border"
            )}
          >
            {val ? "True" : "False"}
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════
// ── Short Answer Editor
// ══════════════════════════════════

function ShortAnswerEditor({ question, onUpdate }: { question: Question; onUpdate: (p: Partial<Question>) => void }) {
  const answers = (question.acceptedAnswers?.[0] as string[]) || [""];

  function setAnswer(idx: number, val: string) {
    const next = [...answers];
    next[idx] = val;
    onUpdate({ acceptedAnswers: [next] });
  }
  function addAlt() { onUpdate({ acceptedAnswers: [[...answers, ""]] }); }
  function removeAlt(idx: number) {
    if (answers.length <= 1) return;
    onUpdate({ acceptedAnswers: [answers.filter((_, i) => i !== idx)] });
  }

  return (
    <div className="space-y-2 pl-6">
      <label className="block text-[11px] font-semibold text-muted-foreground">Accepted answer(s)</label>
      {answers.map((a, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={a}
            onChange={(e) => setAnswer(i, e.target.value)}
            placeholder="Type the correct answer..."
            className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
          />
          {answers.length > 1 && (
            <button type="button" onClick={() => removeAlt(i)}
              className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors">Remove</button>
          )}
        </div>
      ))}
      <button type="button" onClick={addAlt}
        className="text-xs text-primary font-semibold hover:underline">+ Add alternative answer</button>
      <p className="text-[10px] text-muted-foreground">Student answer must match exactly (case-insensitive)</p>
    </div>
  );
}

// ══════════════════════════════════
// ── Essay Editor
// ══════════════════════════════════

function EssayEditor({ question, onUpdate }: { question: Question; onUpdate: (p: Partial<Question>) => void }) {
  return (
    <div className="space-y-3 pl-6">
      <div>
        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Max words (optional)</label>
        <input
          type="number"
          min={0}
          value={question.wordLimit || ""}
          onChange={(e) => onUpdate({ wordLimit: +e.target.value })}
          placeholder="500"
          className="w-32 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Grading rubric / notes for teacher</label>
        <textarea
          value={question.rubric || ""}
          onChange={(e) => onUpdate({ rubric: e.target.value })}
          placeholder="Describe what a full-marks answer looks like..."
          rows={3}
          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════
// ── Fill in the Blank Editor
// ══════════════════════════════════

function FillBlankEditor({ question, onUpdate }: { question: Question; onUpdate: (p: Partial<Question>) => void }) {
  const blanks = (question.text.match(/\[blank\]/gi) || []).length;
  const answers = question.acceptedAnswers || [];

  // Sync answers array length with blank count
  const syncedAnswers = Array.from({ length: blanks }, (_, i) => answers[i] || [""]);

  function setBlankAnswer(blankIdx: number, ansIdx: number, val: string) {
    const next = syncedAnswers.map((a) => [...a]);
    next[blankIdx][ansIdx] = val;
    onUpdate({ acceptedAnswers: next });
  }
  function addAlt(blankIdx: number) {
    const next = syncedAnswers.map((a) => [...a]);
    next[blankIdx].push("");
    onUpdate({ acceptedAnswers: next });
  }

  // Preview
  const preview = question.text.replace(/\[blank\]/gi, "________");

  return (
    <div className="space-y-3 pl-6">
      <p className="text-[10px] text-muted-foreground">
        Type your sentence and use <code className="bg-muted px-1 rounded text-primary font-mono">[blank]</code> where the answer should go.
        Example: &quot;The capital of France is [blank]&quot;
      </p>

      {question.text && blanks > 0 && (
        <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">Preview</p>
          <p className="text-sm">{preview}</p>
        </div>
      )}

      {blanks > 0 && (
        <div className="space-y-3">
          {syncedAnswers.map((alts, blankIdx) => (
            <div key={blankIdx} className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Blank {blankIdx + 1} — accepted answers</label>
              {alts.map((a, ansIdx) => (
                <input key={ansIdx} type="text" value={a}
                  onChange={(e) => setBlankAnswer(blankIdx, ansIdx, e.target.value)}
                  placeholder="Accepted answer..."
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none" />
              ))}
              <button type="button" onClick={() => addAlt(blankIdx)}
                className="text-[10px] text-primary font-semibold hover:underline">+ Alternative</button>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">Auto-graded: exact match (case-insensitive). 1 pt per blank.</p>
    </div>
  );
}

// ══════════════════════════════════
// ── Preview Modal
// ══════════════════════════════════

function ExamPreviewModal({
  settings,
  questions,
  onClose,
}: {
  settings: ExamSettings;
  questions: Question[];
  onClose: () => void;
}) {
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="relative w-full max-w-[680px] max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-card px-6 py-4">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Preview</p>
            <h3 className="text-lg font-bold">{settings.title || "Untitled Exam"}</h3>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Exam info */}
          {settings.description && <p className="text-sm text-muted-foreground">{settings.description}</p>}
          <div className="flex flex-wrap gap-3">
            {settings.duration > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-3 py-1.5 text-xs font-semibold">
                <Clock className="h-3.5 w-3.5" /> {settings.duration} min
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-3 py-1.5 text-xs font-semibold">
              {questions.length} questions
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-3 py-1.5 text-xs font-semibold">
              {totalMarks} pts
            </span>
          </div>

          {/* Questions */}
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-border/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", QUESTION_TYPE_BADGES[q.type].color)}>
                  {QUESTION_TYPE_BADGES[q.type].label}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground">{q.marks} pts</span>
              </div>
              <p className="text-sm font-medium">{q.text || "(No question text)"}</p>

              {/* Preview answer areas — read-only */}
              {q.type === "MCQ" && q.choices?.map((c, ci) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg border border-border/30 px-3 py-2 bg-muted/10">
                  <div className="h-4 w-4 rounded-full border-2 border-border/50" />
                  <span className="text-sm text-muted-foreground">{c.text || `Choice ${"ABCDEF"[ci]}`}</span>
                </div>
              ))}
              {q.type === "TRUE_FALSE" && (
                <div className="flex gap-3">
                  <div className="flex-1 rounded-xl border border-border/40 py-2.5 text-center text-sm text-muted-foreground">True</div>
                  <div className="flex-1 rounded-xl border border-border/40 py-2.5 text-center text-sm text-muted-foreground">False</div>
                </div>
              )}
              {q.type === "SHORT_ANSWER" && (
                <div className="rounded-xl border border-border/30 bg-muted/10 px-4 py-2.5 text-sm text-muted-foreground/50">
                  Student answer...
                </div>
              )}
              {q.type === "ESSAY" && (
                <div className="rounded-xl border border-border/30 bg-muted/10 px-4 py-6 text-sm text-muted-foreground/50">
                  Student essay response...
                  {q.wordLimit ? <span className="block mt-1 text-[10px]">Max {q.wordLimit} words</span> : null}
                </div>
              )}
              {q.type === "FILL_BLANK" && (
                <p className="text-sm">
                  {q.text.split(/\[blank\]/gi).map((part, pi, arr) => (
                    <span key={pi}>
                      {part}
                      {pi < arr.length - 1 && (
                        <span className="inline-block w-20 border-b-2 border-border mx-1" />
                      )}
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-border/40 bg-card px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground italic">This is a preview only</p>
          <button type="button" onClick={onClose}
            className="rounded-lg bg-muted px-4 py-2 text-xs font-semibold hover:bg-muted/80 transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
