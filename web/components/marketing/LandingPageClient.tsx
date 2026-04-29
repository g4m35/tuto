"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  GraduationCap,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trackMarketingEvent } from "@/lib/marketing-client";
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
    headline: "Turn any PDF or topic into a guided course.",
    supporting: "Tuto builds lessons, practice, and review loops from material you already trust.",
    eventSource: "landing_default",
  },
  pdf: {
    headline: "Turn a dense PDF into a guided course.",
    supporting: "Upload a trusted source and Tuto turns it into lessons, practice, and review.",
    eventSource: "landing_pdf",
  },
  notes: {
    headline: "Turn class notes into lessons and practice.",
    supporting: "Move from passive notes to a course path that helps you study before the next exam.",
    eventSource: "landing_notes",
  },
  training: {
    headline: "Turn training docs into guided practice.",
    supporting: "Convert onboarding packets, SOPs, and internal docs into a course you can work through.",
    eventSource: "landing_training",
  },
};

const steps = [
  {
    title: "Bring trusted material",
    body: "Upload a PDF, notes packet, or start from a focused topic.",
  },
  {
    title: "Generate a course",
    body: "Tuto shapes a lesson path before you begin studying.",
  },
  {
    title: "Practice inside the flow",
    body: "Lessons, checks, and exercises stay attached to the course.",
  },
  {
    title: "Review weak spots",
    body: "Progress turns into a practical review loop.",
  },
];

const useCases = [
  {
    title: "Certification prep",
    body: "Turn dense standards, exam guides, and study PDFs into a course you can actually work through.",
    icon: ClipboardCheck,
  },
  {
    title: "Class notes",
    body: "Move from passive lecture notes to lessons, practice, and review before the next exam.",
    icon: GraduationCap,
  },
  {
    title: "Training docs",
    body: "Convert onboarding packets, SOPs, and internal docs into guided learning for yourself or a small cohort.",
    icon: BriefcaseBusiness,
  },
];

const faqs = [
  {
    question: "What can I upload?",
    answer: "The course flow currently supports PDFs, Markdown, and text files, plus topic-only course creation.",
  },
  {
    question: "Is this for schools?",
    answer: "The first launch is built for adult learners, professional learning, tutors, and operators.",
  },
  {
    question: "What is Pro?",
    answer: "Pro is planned at $20/month for more course creation room, more document knowledge bases, and guided practice.",
  },
  {
    question: "Why join the beta?",
    answer: "Beta users help shape the activation flow, course quality, and the first workflows Tuto automates deeply.",
  },
];

const courseExamples = [
  {
    source: "biology-notes.pdf",
    title: "Photosynthesis from trusted notes",
    detail: "4 lessons",
    lessons: ["Big idea", "Light reactions", "Review weak spots"],
  },
  {
    source: "topic prompt",
    title: "Hockey fundamentals",
    detail: "3 lessons",
    lessons: ["Rules", "Positioning", "Practice plan"],
  },
  {
    source: "training-docs.md",
    title: "Support onboarding",
    detail: "5 lessons",
    lessons: ["Workflow", "Escalation", "Quality checks"],
  },
];

function LogoMark() {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="Tuto">
      <span className="relative inline-flex size-8 items-center justify-center overflow-hidden rounded-[10px] bg-[#635bff] shadow-[0_12px_30px_-14px_rgba(99,91,255,0.9)]">
        <span className="absolute inset-0 bg-[linear-gradient(135deg,#00d4ff_0%,#635bff_48%,#ff5a9e_100%)]" />
        <span className="relative h-4 w-4 rounded-[5px] border-[2px] border-white/90 before:absolute before:left-1/2 before:top-[-5px] before:h-[22px] before:w-[2px] before:-translate-x-1/2 before:rotate-[24deg] before:bg-white/90" />
      </span>
      <span className="text-[19px] font-semibold tracking-[-0.02em] text-[#0a2540]">tuto</span>
    </span>
  );
}

function CourseExamplesGraphic() {
  return (
    <motion.div
      className="relative rounded-[24px] border border-[#dbe6f2] bg-white p-3 shadow-[0_34px_80px_-54px_rgba(10,37,64,0.7)]"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.48, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <div className="rounded-[18px] bg-[#f7fbff] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold text-[#635bff]">Example courses</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.025em] text-[#0a2540]">
              From source to lesson path
            </h2>
          </div>
          <span className="rounded-full border border-[#d9e2ec] bg-white px-3 py-1 text-[12px] font-medium text-[#425466]">
            Simple output
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {courseExamples.map((course, index) => (
            <motion.article
              key={course.title}
              className="rounded-[16px] border border-[#e6ebf1] bg-white p-4 transition-transform duration-200 ease-[var(--ease-signature)] hover:-translate-y-0.5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, delay: index * 0.08, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[12px] font-semibold text-[#635bff]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[15px] font-semibold leading-5 tracking-[-0.015em] text-[#0a2540]">
                      {course.title}
                    </h3>
                    <span className="text-[12px] font-medium text-[#635bff]">{course.detail}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-[#6b7c93]">{course.source}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {course.lessons.map((lesson) => (
                      <span
                        key={lesson}
                        className="rounded-full border border-[#dbe6f2] px-2.5 py-1 text-[12px] text-[#425466]"
                      >
                        {lesson}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-6 h-px overflow-hidden bg-[#d9e2ec]">
          <motion.div
            className="h-full w-full origin-left bg-[linear-gradient(90deg,#00d4ff,#635bff,#ff5a9e)]"
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
      <div className="rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-elev)] p-6">
        <div className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)]">
          <Check className="size-4 text-[var(--text)]" />
        </div>
        <h3 className="mt-5 text-[24px] font-medium leading-8 tracking-normal text-[var(--text)]">
          You are on the beta list.
        </h3>
        <p className="mt-3 text-[14px] leading-6 text-[var(--text-dim)]">
          We will use your notes to prioritize onboarding and the first automation workflows.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)]">
          <Mail className="size-4 text-[var(--text)]" />
        </span>
        <div>
          <h3 className="text-[20px] font-medium leading-7 tracking-normal text-[var(--text)]">Join the beta</h3>
          <p className="text-[13px] leading-5 text-[var(--text-dim)]">Tell us what you want Tuto to turn into a course.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-[12px] text-[var(--text-dim)]">Name</span>
          <input name="name" className="h-11 w-full rounded-[10px] border border-[var(--border)] bg-[#080808] px-3 text-[14px] outline-none focus:border-[var(--border-strong)]" />
        </label>
        <label className="space-y-2">
          <span className="text-[12px] text-[var(--text-dim)]">Email</span>
          <input name="email" type="email" required className="h-11 w-full rounded-[10px] border border-[var(--border)] bg-[#080808] px-3 text-[14px] outline-none focus:border-[var(--border-strong)]" />
        </label>
        <label className="space-y-2">
          <span className="text-[12px] text-[var(--text-dim)]">Use case</span>
          <select name="useCase" className="h-11 w-full rounded-[10px] border border-[var(--border)] bg-[#080808] px-3 text-[14px] outline-none focus:border-[var(--border-strong)]">
            <option>Certification prep</option>
            <option>Class notes</option>
            <option>Training docs</option>
            <option>Tutoring or coaching</option>
            <option>Other adult learning</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-[12px] text-[var(--text-dim)]">Material</span>
          <select name="materialType" className="h-11 w-full rounded-[10px] border border-[var(--border)] bg-[#080808] px-3 text-[14px] outline-none focus:border-[var(--border-strong)]">
            <option>PDF</option>
            <option>Notes</option>
            <option>Topic prompt</option>
            <option>Training packet</option>
            <option>Mixed sources</option>
          </select>
        </label>
      </div>

      <label className="mt-3 block space-y-2">
        <span className="text-[12px] text-[var(--text-dim)]">What would you study first?</span>
        <textarea name="notes" rows={4} className="w-full resize-none rounded-[10px] border border-[var(--border)] bg-[#080808] px-3 py-3 text-[14px] leading-6 outline-none focus:border-[var(--border-strong)]" />
      </label>

      <label className="mt-4 flex items-start gap-3 text-[13px] leading-5 text-[var(--text-dim)]">
        <input name="marketingOptIn" type="checkbox" className="mt-1 size-4 rounded border-[var(--border)] bg-[#080808]" />
        <span>Send me beta updates, onboarding notes, and launch emails. I can unsubscribe anytime.</span>
      </label>

      {error ? <p className="mt-4 text-[13px] text-red-300">{error}</p> : null}

      <Button type="submit" size="lg" className="mt-5 w-full" disabled={state === "submitting"}>
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
    <main className="min-h-screen bg-white text-[#0a2540]">
      <header className="sticky top-0 z-40 border-b border-[#e6ebf1]/70 bg-white/[0.82] backdrop-blur-xl">
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-7">
          <Link href="/" onClick={() => trackMarketingEvent("nav_logo_clicked", { source: copy.eventSource })}>
            <LogoMark />
          </Link>
          <div className="hidden items-center gap-7 text-[14px] font-medium text-[#425466] md:flex">
            <a href="#product" className="hover:text-[#0a2540]">Product</a>
            <a href="#use-cases" className="hover:text-[#0a2540]">Use cases</a>
            <a href="#pricing" className="hover:text-[#0a2540]">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="inline-flex h-9 items-center rounded-full px-4 text-[14px] font-semibold text-[#425466] hover:text-[#0a2540]">
              Open app
            </Link>
            <Link
              href="/create"
              onClick={() => trackMarketingEvent("hero_create_course_clicked", { source: copy.eventSource, location: "nav" })}
              className="hidden h-9 items-center gap-2 rounded-full bg-[#0a2540] px-4 text-[14px] font-semibold text-white shadow-[0_12px_24px_-18px_rgba(10,37,64,0.7)] hover:bg-[#172b4d] sm:inline-flex"
            >
              Create course
              <ArrowRight data-icon="inline-end" />
            </Link>
          </div>
        </nav>
      </header>

      <section id="product" className="relative overflow-hidden bg-[#fbfdff]">
        <div className="absolute right-[-18%] top-[-28%] h-[520px] w-[520px] rounded-full bg-[#00d4ff]/18 blur-3xl" aria-hidden="true" />
        <div className="absolute right-[12%] top-[12%] h-[300px] w-[300px] rounded-full bg-[#635bff]/12 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-7xl gap-10 px-5 py-16 sm:px-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:items-center lg:py-20">
          <div className="max-w-3xl pt-8 lg:pt-0">
            <h1 className="text-[44px] font-semibold leading-[0.98] tracking-[-0.04em] text-[#0a2540] sm:text-[68px] lg:text-[78px]">
              {copy.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-[19px] leading-8 text-[#425466] sm:text-[21px]">
              {copy.supporting}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/create"
                onClick={() => trackMarketingEvent("hero_create_course_clicked", { source: copy.eventSource, location: "hero" })}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0a2540] px-5 text-[14px] font-semibold text-white shadow-[0_18px_34px_-22px_rgba(10,37,64,0.75)] hover:bg-[#172b4d] sm:h-12 sm:px-6 sm:text-[15px]"
              >
                Create your first course
                <ArrowRight data-icon="inline-end" />
              </Link>
            </div>
          </div>
          <CourseExamplesGraphic />
        </div>
      </section>

      <section className="border-y border-[#e6ebf1] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 py-16 sm:px-7 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step.title} className="min-h-[180px] border-l border-[#d9e2ec] px-5 py-2">
              <span className="text-[12px] font-semibold text-[#635bff]">{String(index + 1).padStart(2, "0")}</span>
              <h2 className="mt-8 text-[20px] font-semibold leading-7 tracking-[-0.02em] text-[#0a2540]">{step.title}</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#425466]">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="use-cases" className="bg-[#f6f9fc]">
        <div className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-7">
        <div className="max-w-3xl">
          <p className="text-[13px] font-semibold text-[#635bff]">Use cases</p>
          <h2 className="mt-3 text-[38px] font-semibold leading-[1.05] tracking-[-0.035em] text-[#0a2540] sm:text-[52px]">
            Built for dense material and real study loops.
          </h2>
          <p className="mt-5 text-[18px] leading-8 text-[#425466]">
            Start where the pain is sharp: adult learners with material they need to understand, remember, and apply.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {useCases.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="min-h-[250px] rounded-[20px] border border-[#e6ebf1] bg-white p-6 shadow-[0_20px_50px_-42px_rgba(10,37,64,0.62)]">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#eef2ff] text-[#635bff]">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-12 text-[24px] font-semibold leading-8 tracking-[-0.025em] text-[#0a2540]">{item.title}</h3>
                <p className="mt-4 text-[14px] leading-6 text-[#425466]">{item.body}</p>
              </article>
            );
          })}
        </div>
        </div>
      </section>

      <section id="beta" className="border-y border-[#0a2540] bg-[#0a2540] text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-20 sm:px-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.85fr)] lg:items-start">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold text-[#00d4ff]">Beta access</p>
            <h2 className="mt-3 text-[38px] font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-[52px]">
              Help shape the beta before the broad paid launch.
            </h2>
            <p className="mt-5 text-[18px] leading-8 text-white/[0.66]">
              We are prioritizing professional learners, tutors, coaches, and operators who have real material ready to test.
            </p>
          </div>
          <BetaForm eventSource={copy.eventSource} />
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-7">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            ["Free starter", "$0", "Create the first course and feel the loop before upgrading."],
            ["Pro", "$20/mo", "More generation room, more document knowledge bases, and guided practice."],
            ["Team", "$65/mo", "Shared-use billing for small teams, tutors, coaches, and cohort operators."],
            ["Enterprise", "Custom", "For schools and companies that need seats, onboarding, and contract billing."],
          ].map(([name, price, body]) => (
            <article key={name} className="rounded-[20px] border border-[#e6ebf1] bg-white p-6 shadow-[0_20px_50px_-42px_rgba(10,37,64,0.62)]">
              <h3 className="text-[15px] font-semibold text-[#0a2540]">{name}</h3>
              <p className="mt-5 text-[34px] font-semibold tracking-[-0.03em] text-[#0a2540]">{price}</p>
              <p className="mt-4 min-h-16 text-[14px] leading-6 text-[#425466]">{body}</p>
              <Link
                href={name === "Enterprise" ? "/pricing#enterprise" : name === "Pro" || name === "Team" ? "/pricing" : "/create"}
                onClick={() => trackMarketingEvent("pricing_cta_clicked", { source: copy.eventSource, plan: name })}
                className={cn(
                  "mt-7 inline-flex h-11 w-full items-center justify-center rounded-full text-[14px] font-semibold",
                  name === "Pro" || name === "Enterprise"
                    ? "bg-[#0a2540] text-white hover:bg-[#172b4d]"
                    : "bg-[#f6f9fc] text-[#0a2540] hover:bg-[#eef2ff]"
                )}
              >
                {name === "Enterprise" ? "Talk to us" : name === "Pro" || name === "Team" ? "View pricing" : "Start free"}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#e6ebf1] bg-[#f6f9fc]">
        <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-7">
          <h2 className="text-[34px] font-semibold leading-tight tracking-[-0.03em] text-[#0a2540]">Questions before you upload?</h2>
          <div className="mt-8 divide-y divide-[#d9e2ec] border-y border-[#d9e2ec]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex items-center justify-between gap-6 text-[16px] font-semibold text-[#0a2540]">
                  {faq.question}
                  <ArrowRight className="size-4 rotate-0 text-[#635bff] transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-4 max-w-3xl text-[14px] leading-6 text-[#425466]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-[13px] text-[#425466] sm:px-7">
        <p>Tuto © {year}</p>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-[#0a2540]">Privacy</Link>
          <Link href="/terms" className="hover:text-[#0a2540]">Terms</Link>
          <Link href="/support" className="hover:text-[#0a2540]">Support</Link>
        </div>
      </footer>
    </main>
  );
}
