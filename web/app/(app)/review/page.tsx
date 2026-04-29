import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  BookOpenCheck,
  Braces,
  CircleAlert,
  Layers3,
  LineChart,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import type { StoredCourse } from "@/lib/course-data";
import { toCourseCardData, toLessonId } from "@/lib/course-data";
import { listCoursesForUser } from "@/lib/course-store";
import { cn } from "@/lib/utils";

type ReviewSignal = "current" | "difficulty" | "incomplete" | "completed";

interface ReviewFocusItem {
  id: string;
  courseId: string;
  courseTitle: string;
  subject: string;
  lessonIndex: number;
  lessonCount: number;
  title: string;
  summary: string;
  userDifficulty: string | null;
  signals: ReviewSignal[];
  depth: number;
}

interface ThemeItem {
  label: string;
  count: number;
  sources: string[];
}

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "and",
  "are",
  "before",
  "between",
  "build",
  "can",
  "course",
  "does",
  "for",
  "from",
  "how",
  "into",
  "its",
  "lesson",
  "make",
  "more",
  "need",
  "not",
  "that",
  "the",
  "their",
  "then",
  "this",
  "through",
  "understand",
  "use",
  "what",
  "when",
  "where",
  "which",
  "with",
  "you",
  "your",
]);

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="t-eyebrow">
      <span className="t-eyebrow__rule" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

function getKnowledgePoints(course: StoredCourse) {
  return Array.isArray(course.guidePayload.knowledge_points)
    ? course.guidePayload.knowledge_points
    : [];
}

function cleanText(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function getReviewSignals(course: StoredCourse, index: number, userDifficulty: string): ReviewSignal[] {
  const signals: ReviewSignal[] = [];

  if (index === course.currentLessonIndex) {
    signals.push("current");
  }

  if (userDifficulty) {
    signals.push("difficulty");
  }

  if (index > course.currentLessonIndex) {
    signals.push("incomplete");
  }

  if (index < course.currentLessonIndex) {
    signals.push("completed");
  }

  return signals;
}

function getDepth(signals: ReviewSignal[], summary: string, userDifficulty: string) {
  let depth = 0;

  if (signals.includes("current")) depth += 4;
  if (signals.includes("difficulty")) depth += 3;
  if (signals.includes("incomplete")) depth += 2;
  if (summary) depth += 1;
  if (userDifficulty.length > 80) depth += 1;

  return depth;
}

function buildReviewFocus(courses: StoredCourse[]): ReviewFocusItem[] {
  return courses
    .flatMap((course) => {
      const points = getKnowledgePoints(course);

      return points.map((point, index) => {
        const title = cleanText(point.knowledge_title);
        const summary = cleanText(point.knowledge_summary);
        const userDifficulty = cleanText(point.user_difficulty);
        const signals = getReviewSignals(course, index, userDifficulty);

        if (!title || signals.length === 0) {
          return null;
        }

        return {
          id: toLessonId(course.id, index, title),
          courseId: course.id,
          courseTitle: course.title,
          subject: course.subject,
          lessonIndex: index,
          lessonCount: points.length,
          title,
          summary,
          userDifficulty: userDifficulty || null,
          signals,
          depth: getDepth(signals, summary, userDifficulty),
        } satisfies ReviewFocusItem;
      });
    })
    .filter((item): item is ReviewFocusItem => Boolean(item))
    .sort((a, b) => b.depth - a.depth || a.lessonIndex - b.lessonIndex)
    .slice(0, 8);
}

function getSignalLabel(signal: ReviewSignal) {
  switch (signal) {
    case "current":
      return "current lesson";
    case "difficulty":
      return "guide flagged";
    case "incomplete":
      return "not practiced yet";
    case "completed":
      return "completed earlier";
  }
}

function tokenize(item: ReviewFocusItem) {
  return `${item.title} ${item.summary} ${item.userDifficulty ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^-+|-+$/g, ""))
    .filter((token) => token.length > 3 && !STOP_WORDS.has(token) && Number.isNaN(Number(token)));
}

function titleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildCommonThemes(items: ReviewFocusItem[]): ThemeItem[] {
  const themes = new Map<string, Set<string>>();

  for (const item of items) {
    for (const token of new Set(tokenize(item))) {
      const sources = themes.get(token) ?? new Set<string>();
      sources.add(item.title);
      themes.set(token, sources);
    }
  }

  return Array.from(themes.entries())
    .map(([label, sources]) => ({
      label: titleCase(label),
      count: sources.size,
      sources: Array.from(sources).slice(0, 3),
    }))
    .filter((theme) => theme.count > 1)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 4);
}

function ReviewFocusCard({ item, index }: { item: ReviewFocusItem; index: number }) {
  const href = `/courses/${item.courseId}/lesson/${item.id}`;
  const animation =
    index === 0
      ? "animate-rise-in"
      : index === 1
        ? "animate-rise-in-delay-1"
        : "animate-rise-in-delay-2";

  return (
    <Link
      href={href}
      className={cn(
        "editorial-card interactive-card t-lift block overflow-hidden px-5 py-5 sm:px-6",
        animation,
      )}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px_110px] lg:items-start">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
            <span>{item.subject}</span>
            <span className="size-1 rounded-full bg-[var(--text-faint)]" />
            <span>
              {item.lessonIndex + 1}/{item.lessonCount}
            </span>
          </div>
          <div className="space-y-2">
            <h2 className="text-[22px] font-medium leading-[1.25] tracking-normal text-[var(--text)]">
              {item.title}
            </h2>
            {item.summary ? (
              <p className="max-w-2xl text-[14px] leading-6 text-[var(--text-dim)]">
                {item.summary}
              </p>
            ) : null}
          </div>
          {item.userDifficulty ? (
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                Trouble signal
              </p>
              <p className="mt-2 text-[13px] leading-6 text-[var(--text-dim)]">
                {item.userDifficulty}
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
            Why it is here
          </p>
          <div className="flex flex-wrap gap-2">
            {item.signals.map((signal) => (
              <span
                key={signal}
                className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-[12px] leading-5 text-[var(--text-dim)]"
              >
                {getSignalLabel(signal)}
              </span>
            ))}
          </div>
          <p className="text-[13px] leading-6 text-[var(--text-dim)]">
            From <span className="text-[var(--text)]">{item.courseTitle}</span>
          </p>
        </div>

        <div className="flex justify-start lg:justify-end">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text)]">
            Review
            <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ThemeCard({ theme }: { theme: ThemeItem }) {
  return (
    <div className="editorial-card px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
            Repeated theme
          </p>
          <h3 className="mt-3 text-[20px] font-medium leading-7 text-[var(--text)]">
            {theme.label}
          </h3>
        </div>
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] text-sm text-[var(--text)]">
          {theme.count}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {theme.sources.map((source) => (
          <p key={source} className="text-[13px] leading-5 text-[var(--text-dim)]">
            {source}
          </p>
        ))}
      </div>
    </div>
  );
}

export default async function ReviewPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const courseRecords = await listCoursesForUser(userId);
  const courseCards = courseRecords.map(toCourseCardData);
  const focusItems = buildReviewFocus(courseRecords);
  const commonThemes = buildCommonThemes(focusItems);
  const hasReviewData = focusItems.length > 0;
  const completedLessons = courseCards.reduce((sum, course) => sum + course.lessonsComplete, 0);
  const lessonCount = courseCards.reduce((sum, course) => sum + course.lessonCount, 0);
  const flaggedCount = focusItems.filter((item) => item.userDifficulty).length;
  const primaryReviewHref = hasReviewData
    ? `/courses/${focusItems[0].courseId}/lesson/${focusItems[0].id}`
    : "/create";

  return (
    <div className="space-y-10">
      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
        <div className="space-y-5">
          <Eyebrow>Review</Eyebrow>
          <h1 className="max-w-4xl text-[40px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[56px]">
            {hasReviewData ? "Review the parts that still need pressure." : "Nothing to review yet."}
          </h1>
          <p className="max-w-2xl text-[20px] leading-8 text-[var(--text-dim)]">
            {hasReviewData
              ? "This page only uses stored course progress, guide difficulty notes, and repeated topics. It stays quiet when there is not enough evidence."
              : "Create a course and complete lessons first. Review recommendations will appear once there are real knowledge points to work from."}
          </p>
          <Link href={primaryReviewHref} className={cn(buttonVariants({ size: "lg" }))}>
            <Braces data-icon="inline-start" />
            {hasReviewData ? "Start review" : "Create course"}
          </Link>
        </div>

        {hasReviewData ? (
          <aside className="editorial-card animate-rise-in-delay-1 p-5 sm:p-6">
            <Eyebrow>Evidence</Eyebrow>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[28px] font-semibold leading-none text-[var(--text)]">
                  {focusItems.length}
                </p>
                <p className="mt-2 text-[12px] leading-5 text-[var(--text-faint)]">
                  review items
                </p>
              </div>
              <div>
                <p className="text-[28px] font-semibold leading-none text-[var(--text)]">
                  {flaggedCount}
                </p>
                <p className="mt-2 text-[12px] leading-5 text-[var(--text-faint)]">
                  guide flags
                </p>
              </div>
              <div>
                <p className="text-[28px] font-semibold leading-none text-[var(--text)]">
                  {completedLessons}/{lessonCount}
                </p>
                <p className="mt-2 text-[12px] leading-5 text-[var(--text-faint)]">
                  completed
                </p>
              </div>
            </div>
          </aside>
        ) : null}
      </section>

      {hasReviewData ? (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <div className="editorial-card animate-rise-in px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow">Trouble sources</p>
                <CircleAlert className="size-4 text-[var(--text-dim)]" />
              </div>
              <p className="mt-5 text-[34px] font-semibold leading-none tracking-normal text-[var(--text)]">
                {flaggedCount}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
                Items with explicit difficulty notes from the generated guide.
              </p>
            </div>

            <div className="editorial-card animate-rise-in-delay-1 px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow">Coverage</p>
                <BookOpenCheck className="size-4 text-[var(--text-dim)]" />
              </div>
              <p className="mt-5 text-[34px] font-semibold leading-none tracking-normal text-[var(--text)]">
                {completedLessons}/{lessonCount}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
                Course lessons completed across the reviewable courses.
              </p>
            </div>

            {commonThemes.length ? (
              <div className="editorial-card animate-rise-in-delay-2 px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">Themes</p>
                  <LineChart className="size-4 text-[var(--text-dim)]" />
                </div>
                <p className="mt-5 text-[34px] font-semibold leading-none tracking-normal text-[var(--text)]">
                  {commonThemes.length}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
                  Recurring terms found across multiple review items.
                </p>
              </div>
            ) : null}
          </section>

          <section className="space-y-5">
            <div className="space-y-2">
              <Eyebrow>Deep review</Eyebrow>
              <h2 className="text-[34px] font-semibold leading-[1.1] tracking-normal text-[var(--text)]">
                Work through these before moving faster.
              </h2>
            </div>

            <div className="grid gap-3">
              {focusItems.map((item, index) => (
                <ReviewFocusCard key={`${item.courseId}:${item.id}`} item={item} index={index} />
              ))}
            </div>
          </section>

          {commonThemes.length ? (
            <section className="space-y-5">
              <div className="space-y-2">
                <Eyebrow>Common themes</Eyebrow>
                <h2 className="text-[34px] font-semibold leading-[1.1] tracking-normal text-[var(--text)]">
                  Patterns worth reviewing together.
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {commonThemes.map((theme) => (
                  <ThemeCard key={theme.label} theme={theme} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <div className="editorial-card animate-rise-in px-6 py-8">
          <Layers3 className="size-5 text-[var(--text-dim)]" />
          <h2 className="mt-5 text-[24px] font-medium leading-8 text-[var(--text)]">
            No review data yet.
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-dim)]">
            Review recommendations will be based on real course knowledge points and progress once there is something to practice.
          </p>
        </div>
      )}
    </div>
  );
}
