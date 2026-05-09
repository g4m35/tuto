"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  DoorOpen,
  FileQuestion,
  FileText,
  GraduationCap,
  Mail,
  NotebookTabs,
  Presentation,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { trackMarketingEvent } from "@/lib/marketing-client";
import { getSampleCourseStats, sampleCourses } from "@/lib/sample-courses";
import { cn } from "@/lib/utils";

type SignupState = "idle" | "submitting" | "success" | "error";
type LandingVariant = "default" | "pdf" | "notes" | "training";

interface LandingPageClientProps {
  variant?: LandingVariant;
}

const variantCopy: Record<
  LandingVariant,
  {
    headline: string;
    supporting: string;
    eventSource: string;
  }
> = {
  default: {
    headline: "Turn sources into study tools.",
    supporting: "Courses, guides, quizzes, notes, slides, and lesson plans from PDFs or topics.",
    eventSource: "landing_default",
  },
  pdf: {
    headline: "Turn a PDF into study tools.",
    supporting: "Upload a PDF. Get courses, guides, quizzes, notes, slides, and lesson plans.",
    eventSource: "landing_pdf",
  },
  notes: {
    headline: "Turn class notes into courses, quizzes, and guides.",
    supporting: "Build lessons, quizzes, guides, and exports from your notes.",
    eventSource: "landing_notes",
  },
  training: {
    headline: "Turn training docs into learning assets.",
    supporting: "Convert SOPs and onboarding docs into courses, slides, quizzes, and lesson plans.",
    eventSource: "landing_training",
  },
};

const steps = [
  {
    title: "Bring the source",
    body: "Upload a PDF, notes, deck, document, or topic.",
  },
  {
    title: "Choose the output",
    body: "Pick course, guide, quiz, slides, notes, or lesson plan.",
  },
  {
    title: "Export or keep learning",
    body: "Study in Tuto or export Docs/Slides-ready files.",
  },
  {
    title: "Come back anytime",
    body: "Open the dashboard and continue.",
  },
];

const useCases = [
  {
    title: "Certification prep",
    body: "Courses, quiz sets, and guides from dense exam material.",
    icon: ClipboardCheck,
  },
  {
    title: "Class notes",
    body: "Lessons, quizzes, and review docs from lecture notes.",
    icon: GraduationCap,
  },
  {
    title: "Enterprise training",
    body: "Training courses, slides, quizzes, and handouts from internal docs.",
    icon: BriefcaseBusiness,
  },
];

const platformHighlights = [
  {
    title: "Open the app",
    body: "Returning learners go straight to tuto.chat/dashboard.",
    icon: DoorOpen,
  },
  {
    title: "Enterprise access",
    body: "Expanded usage, contract billing, and rollout support.",
    icon: ShieldCheck,
  },
  {
    title: "Enterprise requests",
    body: "Enterprise requests go to the operator pipeline.",
    icon: Building2,
  },
];

const faqs = [
  {
    question: "What can I upload?",
    answer: "PDFs, text, Markdown, office files, and topic prompts.",
  },
  {
    question: "Is this for schools?",
    answer: "Yes. Enterprise supports schools, tutoring groups, and companies.",
  },
  {
    question: "How do I get back in?",
    answer: "Use tuto.chat/dashboard. Sign-in returns you there.",
  },
  {
    question: "Is Enterprise available?",
    answer: "Yes. Use the Enterprise form on pricing.",
  },
  {
    question: "Why join the beta?",
    answer: "Help improve course quality and core workflows.",
  },
];

const artifactOutputs = [
  {
    title: "Study guide",
    detail: "Key terms, worked examples, mistakes, review checklist",
    format: "DOCX / Google Docs-ready",
    icon: FileText,
  },
  {
    title: "Slide show",
    detail: "Clean slide outline, speaker notes, teaching flow",
    format: "PPTX / Google Slides-ready",
    icon: Presentation,
  },
  {
    title: "Quiz set",
    detail: "Recall, concept checks, application, trap answers",
    format: "Practice with answer rationales",
    icon: FileQuestion,
  },
  {
    title: "Full course",
    detail: "Guided lesson path with checkpoints and review",
    format: "Interactive Tuto course",
    icon: GraduationCap,
  },
  {
    title: "Notes",
    detail: "Structured notes from messy PDFs or class material",
    format: "DOCX / Markdown",
    icon: NotebookTabs,
  },
  {
    title: "Lesson plan",
    detail: "Objectives, warm-up, guided practice, exit check",
    format: "Teacher-ready document",
    icon: ClipboardCheck,
  },
];

const featuredSampleCourses = sampleCourses.slice(0, 3);

function ProductOutputGraphic() {
  return (
    <motion.div
      className="relative rounded-[28px] border border-[#cfe1dd] bg-[#fffef8] p-3 shadow-[0_34px_80px_-54px_rgba(16,42,67,0.58)]"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.48, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <div className="rounded-[22px] bg-[#f5fbf8] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold text-[#2f8f83]">One source, many outputs</p>
            <h2 className="mt-2 text-[21px] font-semibold tracking-[-0.025em] text-[#102a43]">
              Choose what Tuto should make
            </h2>
          </div>
          <span className="rounded-full border border-[#cfe1dd] bg-white px-3 py-1 text-[12px] font-medium text-[#486581]">
            Export-ready
          </span>
        </div>

        <div className="mt-5 rounded-[18px] border border-[#cfe1dd] bg-white p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#829ab1]">Uploaded source</p>
          <h3 className="mt-2 text-[18px] font-semibold leading-6 text-[#102a43]">
            Biology notes, class slides, or a topic prompt
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {["PDF", "DOCX", "Topic"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#d9e8e4] bg-[#f5fbf8] px-3 py-1.5 text-center text-[12px] font-semibold text-[#2f8f83]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {artifactOutputs.map((output, index) => {
            const Icon = output.icon;
            return (
            <motion.article
              key={output.title}
              className="min-h-[150px] rounded-[18px] border border-[#d9e8e4] bg-white p-4 transition-transform duration-200 ease-[var(--ease-signature)] hover:-translate-y-0.5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, delay: index * 0.08, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e6f7f2] text-[#2f8f83]">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2f8f83]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 text-[16px] font-semibold leading-5 tracking-[-0.015em] text-[#102a43]">
                    {output.title}
                  </h3>
                  <p className="mt-2 text-[12px] leading-5 text-[#486581]">{output.detail}</p>
                </div>
              </div>
              <p className="mt-4 rounded-full border border-[#d9e8e4] bg-[#f8fcfa] px-3 py-1.5 text-[12px] font-medium text-[#486581]">
                {output.format}
              </p>
            </motion.article>
            );
          })}
        </div>

        <div className="mt-6 h-px overflow-hidden bg-[#d9e8e4]">
          <motion.div
            className="h-full w-full origin-left bg-[linear-gradient(90deg,#3f6212,#d9f99d,#3f6212)]"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.7, delay: 0.14, ease: [0.2, 0.7, 0.2, 1] }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function BetaForm({ eventSource }: { eventSource: string }) {
  const [state, setState] = useState<SignupState>("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      useCase: String(formData.get("useCase") ?? ""),
      materialType: String(formData.get("materialType") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      marketingOptIn: formData.get("marketingOptIn") === "on",
      pageUrl: window.location.href,
      referrer: document.referrer,
      source: "landing_page",
    };

    trackMarketingEvent("beta_signup_started", {
      source: eventSource,
      use_case: payload.useCase,
      material_type: payload.materialType,
    });

    try {
      const response = await fetch("/api/beta-signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Unable to join the beta right now.");
      }

      setState("success");
      trackMarketingEvent("beta_signup_completed", {
        source: eventSource,
        use_case: payload.useCase,
        material_type: payload.materialType,
      });
    } catch (nextError) {
      setState("error");
      setError(nextError instanceof Error ? nextError.message : "Unable to join the beta right now.");
      trackMarketingEvent("beta_signup_failed", { source: eventSource });
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-[24px] border border-[#cfe1dd] bg-white p-6 shadow-[0_22px_58px_-46px_rgba(16,42,67,0.6)]">
        <div className="inline-flex size-10 items-center justify-center rounded-full bg-[#e6f7f2] text-[#2f8f83]">
          <Check className="size-4" />
        </div>
        <h3 className="mt-5 text-[24px] font-semibold leading-8 tracking-[-0.02em] text-[#102a43]">
          You are on the beta list.
        </h3>
        <p className="mt-3 text-[14px] leading-6 text-[#486581]">
          Your notes will guide onboarding.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[24px] border border-[#cfe1dd] bg-white p-5 text-[#102a43] shadow-[0_22px_58px_-46px_rgba(16,42,67,0.6)] sm:p-6"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#e6f7f2] text-[#2f8f83]">
          <Mail className="size-4" />
        </span>
        <div>
          <h3 className="text-[20px] font-semibold leading-7 tracking-[-0.02em] text-[#102a43]">Join the beta</h3>
          <p className="text-[13px] leading-5 text-[#486581]">Tell us what you need.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-[12px] font-medium text-[#486581]">Name</span>
          <input name="name" className="h-11 w-full rounded-[12px] border border-[#d9e8e4] bg-[#f8fcfa] px-3 text-[14px] text-[#102a43] outline-none focus:border-[#2f8f83]" />
        </label>
        <label className="space-y-2">
          <span className="text-[12px] font-medium text-[#486581]">Email</span>
          <input name="email" type="email" required className="h-11 w-full rounded-[12px] border border-[#d9e8e4] bg-[#f8fcfa] px-3 text-[14px] text-[#102a43] outline-none focus:border-[#2f8f83]" />
        </label>
        <label className="space-y-2">
          <span className="text-[12px] font-medium text-[#486581]">Use case</span>
          <select name="useCase" className="h-11 w-full rounded-[12px] border border-[#d9e8e4] bg-[#f8fcfa] px-3 text-[14px] text-[#102a43] outline-none focus:border-[#2f8f83]">
            <option>Certification prep</option>
            <option>Class notes</option>
            <option>Training docs</option>
            <option>Tutoring or coaching</option>
            <option>Other learning</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-[12px] font-medium text-[#486581]">Material</span>
          <select name="materialType" className="h-11 w-full rounded-[12px] border border-[#d9e8e4] bg-[#f8fcfa] px-3 text-[14px] text-[#102a43] outline-none focus:border-[#2f8f83]">
            <option>PDF</option>
            <option>Notes</option>
            <option>Topic prompt</option>
            <option>Training packet</option>
            <option>Mixed sources</option>
          </select>
        </label>
      </div>

      <label className="mt-3 block space-y-2">
        <span className="text-[12px] font-medium text-[#486581]">First creation</span>
        <textarea name="notes" rows={4} className="w-full resize-none rounded-[12px] border border-[#d9e8e4] bg-[#f8fcfa] px-3 py-3 text-[14px] leading-6 text-[#102a43] outline-none focus:border-[#2f8f83]" />
      </label>

      <label className="mt-4 flex items-start gap-3 text-[13px] leading-5 text-[#486581]">
        <input name="marketingOptIn" type="checkbox" className="mt-1 size-4 rounded border-[#cfe1dd] bg-white accent-[#2f8f83]" />
        <span>Send beta updates and launch emails. Unsubscribe anytime.</span>
      </label>

      {error ? <p className="mt-4 text-[13px] text-[#b42318]">{error}</p> : null}

      <Button
        type="submit"
        size="lg"
        className="mt-5 w-full bg-[#102a43] text-white hover:bg-[#243b53]"
        disabled={state === "submitting"}
      >
        {state === "submitting" ? "Joining beta" : "Join the beta"}
        <ArrowRight data-icon="inline-end" />
      </Button>
    </form>
  );
}

export default function LandingPageClient({ variant = "default" }: LandingPageClientProps) {
  const year = useMemo(() => new Date().getFullYear(), []);
  const copy = variantCopy[variant];

  useEffect(() => {
    trackMarketingEvent("landing_page_viewed", {
      source: copy.eventSource,
      variant,
    });
  }, [copy.eventSource, variant]);

  return (
    <main className="min-h-screen bg-[#fbfffd] text-[#102a43]">
      <MarketingHeader eventSource={copy.eventSource} />

      <section id="product" className="relative overflow-hidden bg-[#fbfffd]">
        <div className="absolute right-[-18%] top-[-28%] h-[520px] w-[520px] rounded-full bg-[#56c4a8]/18 blur-3xl" aria-hidden="true" />
        <div className="absolute right-[12%] top-[12%] h-[300px] w-[300px] rounded-full bg-[#d9f99d]/18 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-7xl gap-10 px-5 py-16 sm:px-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:items-center lg:py-20">
          <div className="max-w-3xl pt-8 lg:pt-0">
            <h1 className="text-[44px] font-semibold leading-[0.98] tracking-[-0.04em] text-[#102a43] sm:text-[68px] lg:text-[78px]">
              {copy.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-[19px] leading-8 text-[#486581] sm:text-[21px]">
              {copy.supporting}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/create"
                onClick={() => trackMarketingEvent("hero_create_course_clicked", { source: copy.eventSource, location: "hero" })}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#102a43] px-5 text-[14px] font-semibold text-white shadow-[0_18px_34px_-22px_rgba(16,42,67,0.75)] hover:bg-[#243b53] sm:h-12 sm:px-6 sm:text-[15px]"
              >
                Create your first course
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link
                href="/dashboard"
                onClick={() => trackMarketingEvent("hero_open_app_clicked", { source: copy.eventSource, location: "hero" })}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[#cfe1dd] bg-white px-5 text-[14px] font-semibold text-[#102a43] shadow-[0_18px_34px_-28px_rgba(16,42,67,0.42)] hover:border-[#9fbfb7] sm:h-12 sm:px-6 sm:text-[15px]"
              >
                Open existing account
              </Link>
              <Link
                href="/sample-courses"
                onClick={() => trackMarketingEvent("sample_courses_clicked", { source: copy.eventSource, location: "hero" })}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[#cfe1dd] bg-white px-5 text-[14px] font-semibold text-[#102a43] shadow-[0_18px_34px_-28px_rgba(16,42,67,0.42)] hover:border-[#9fbfb7] sm:h-12 sm:px-6 sm:text-[15px]"
              >
                View sample courses
              </Link>
            </div>
          </div>
          <ProductOutputGraphic />
        </div>
      </section>

      <section className="border-y border-[#d9e8e4] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 py-16 sm:px-7 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step.title} className="min-h-[180px] border-l border-[#d9e8e4] px-5 py-2">
              <span className="text-[12px] font-semibold text-[#2f8f83]">{String(index + 1).padStart(2, "0")}</span>
              <h2 className="mt-8 text-[20px] font-semibold leading-7 tracking-[-0.02em] text-[#102a43]">{step.title}</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#486581]">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="samples" className="bg-[#fbfffd]">
        <div className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-7">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-[13px] font-semibold text-[#2f8f83]">Sample courses</p>
              <h2 className="mt-3 text-[38px] font-semibold leading-[1.05] tracking-[-0.035em] text-[#102a43] sm:text-[52px]">
                Preview course quality first.
              </h2>
            </div>
            <Link
              href="/sample-courses"
              onClick={() => trackMarketingEvent("sample_courses_clicked", { source: copy.eventSource, location: "landing_section" })}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#102a43] px-5 text-[14px] font-semibold text-white hover:bg-[#243b53]"
            >
              Browse all samples
              <ArrowRight data-icon="inline-end" />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {featuredSampleCourses.map((course) => {
              const stats = getSampleCourseStats(course);

              return (
                <Link
                  key={course.id}
                  href={`/sample-courses/${course.id}`}
                  onClick={() => trackMarketingEvent("sample_course_card_clicked", { source: copy.eventSource, sample_course: course.id })}
                  className="group min-h-[300px] rounded-[20px] border border-[#d9e8e4] bg-white p-6 shadow-[0_20px_50px_-42px_rgba(10,37,64,0.58)] transition duration-200 hover:-translate-y-0.5 hover:border-[#9fbfb7]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#e6f7f2] px-3 py-1 text-[12px] font-semibold text-[#2f8f83]">
                      {course.subject}
                    </span>
                    <span className="text-[12px] font-semibold text-[#829ab1]">{course.level}</span>
                  </div>
                  <h3 className="mt-8 text-[23px] font-semibold leading-7 tracking-[-0.025em] text-[#102a43]">
                    {course.title}
                  </h3>
                  <p className="mt-4 text-[14px] leading-6 text-[#486581]">{course.description}</p>
                  <div className="mt-7 flex items-center justify-between border-t border-[#d9e8e4] pt-4 text-[13px] font-semibold text-[#486581]">
                    <span>{stats.moduleCount} modules / {stats.lessonCount} lessons</span>
                    <span className="inline-flex items-center gap-2 text-[#2f8f83]">
                      View
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="use-cases" className="bg-[#f5fbf8]">
        <div className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-7">
        <div className="max-w-3xl">
          <p className="text-[13px] font-semibold text-[#2f8f83]">Use cases</p>
          <h2 className="mt-3 text-[38px] font-semibold leading-[1.05] tracking-[-0.035em] text-[#102a43] sm:text-[52px]">
            For dense material.
          </h2>
          <p className="mt-5 text-[18px] leading-8 text-[#486581]">
            When learners need to understand, remember, and apply.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {useCases.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="min-h-[250px] rounded-[20px] border border-[#d9e8e4] bg-white p-6 shadow-[0_20px_50px_-42px_rgba(10,37,64,0.62)]">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#e6f7f2] text-[#2f8f83]">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-12 text-[24px] font-semibold leading-8 tracking-[-0.025em] text-[#102a43]">{item.title}</h3>
                <p className="mt-4 text-[14px] leading-6 text-[#486581]">{item.body}</p>
              </article>
            );
          })}
        </div>
        </div>
      </section>

      <section id="enterprise" className="bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-24 sm:px-7 lg:grid-cols-[minmax(0,0.82fr)_minmax(520px,1fr)] lg:items-start">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold text-[#2f8f83]">Access paths</p>
            <h2 className="mt-3 text-[38px] font-semibold leading-[1.05] tracking-[-0.035em] text-[#102a43] sm:text-[52px]">
              Access for learners, teams, and institutions.
            </h2>
            <p className="mt-5 text-[18px] leading-8 text-[#486581]">
              Customers go straight to the dashboard. Schools and companies start on pricing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                onClick={() => trackMarketingEvent("enterprise_open_app_clicked", { source: copy.eventSource })}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#102a43] px-5 text-[14px] font-semibold text-white hover:bg-[#243b53]"
              >
                Open app
              </Link>
              <Link
                href="/pricing#enterprise"
                onClick={() => trackMarketingEvent("enterprise_contact_clicked", { source: copy.eventSource })}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#d9e8e4] bg-white px-5 text-[14px] font-semibold text-[#102a43] hover:border-[#9fbfb7]"
              >
                Talk to enterprise
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {platformHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[20px] border border-[#d9e8e4] bg-[#f8fcfa] p-6 shadow-[0_20px_50px_-46px_rgba(10,37,64,0.56)]">
                  <div className="flex gap-4">
                    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e6f7f2] text-[#2f8f83]">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-[20px] font-semibold leading-7 tracking-[-0.02em] text-[#102a43]">{item.title}</h3>
                      <p className="mt-3 text-[14px] leading-6 text-[#486581]">{item.body}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="beta" className="border-y border-[#d9e8e4] bg-[#eaf7f1]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-20 sm:px-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.85fr)] lg:items-start">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold text-[#2f8f83]">Beta access</p>
            <h2 className="mt-3 text-[38px] font-semibold leading-[1.05] tracking-[-0.035em] text-[#102a43] sm:text-[52px]">
              Join the beta.
            </h2>
            <p className="mt-5 text-[18px] leading-8 text-[#486581]">
              Best for teams with real material to test.
            </p>
          </div>
          <BetaForm eventSource={copy.eventSource} />
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-7">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Free starter", "$0", "Create one course, guide, quiz, notes, slides, or lesson plan."],
            ["Pro", "$20/mo", "More generations, uploads, exports, and practice."],
            ["Team", "$65/mo", "Shared billing for tutors, coaches, and small teams."],
            ["Enterprise", "Custom", "Contracts, onboarding, scale, and higher limits."],
          ].map(([name, price, body]) => (
            <article key={name} className="rounded-[20px] border border-[#d9e8e4] bg-white p-6 shadow-[0_20px_50px_-42px_rgba(10,37,64,0.62)]">
              <h3 className="text-[15px] font-semibold text-[#102a43]">{name}</h3>
              <p className="mt-5 text-[34px] font-semibold tracking-[-0.03em] text-[#102a43]">{price}</p>
              <p className="mt-4 min-h-16 text-[14px] leading-6 text-[#486581]">{body}</p>
              <Link
                href={name === "Enterprise" ? "/pricing#enterprise" : name === "Pro" || name === "Team" ? "/pricing" : "/create"}
                onClick={() => trackMarketingEvent("pricing_cta_clicked", { source: copy.eventSource, plan: name })}
                className={cn(
                  "mt-7 inline-flex h-11 w-full items-center justify-center rounded-full text-[14px] font-semibold",
                  "bg-[#102a43] text-white hover:bg-[#243b53]"
                )}
              >
                {name === "Enterprise" ? "Talk to enterprise" : name === "Pro" || name === "Team" ? "View pricing" : "Start free"}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#d9e8e4] bg-[#f5fbf8]">
        <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-7">
          <h2 className="text-[34px] font-semibold leading-tight tracking-[-0.03em] text-[#102a43]">Questions?</h2>
          <div className="mt-8 divide-y divide-[#d9e8e4] border-y border-[#d9e8e4]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex items-center justify-between gap-6 text-[16px] font-semibold text-[#102a43]">
                  {faq.question}
                  <ArrowRight className="size-4 rotate-0 text-[#2f8f83] transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-4 max-w-3xl text-[14px] leading-6 text-[#486581]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-[13px] text-[#486581] sm:px-7">
        <p>Tuto © {year}</p>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-[#102a43]">Privacy</Link>
          <Link href="/terms" className="hover:text-[#102a43]">Terms</Link>
          <Link href="/support" className="hover:text-[#102a43]">Support</Link>
        </div>
      </footer>
    </main>
  );
}
