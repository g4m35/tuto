"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Mail,
  Upload,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/Button";
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
    proof: [string, string, string];
    eventSource: string;
  }
> = {
  default: {
    headline: "Turn any PDF or topic into a guided course.",
    supporting: "Tuto builds lessons, practice, and review loops from material you already trust.",
    proof: [
      "Source-grounded course creation",
      "Practice tied to course progress",
      "Review loop from real weak spots",
    ],
    eventSource: "landing_default",
  },
  pdf: {
    headline: "Turn a dense PDF into a guided course.",
    supporting: "Upload a trusted source and Tuto turns it into lessons, practice, and review.",
    proof: [
      "Works from PDFs, Markdown, and text",
      "Course outline before you commit",
      "Practice from the same material",
    ],
    eventSource: "landing_pdf",
  },
  notes: {
    headline: "Turn class notes into lessons and practice.",
    supporting: "Move from passive notes to a course path that helps you study before the next exam.",
    proof: [
      "Built for adult learners",
      "Topic or notes-based course creation",
      "Review loop after progress",
    ],
    eventSource: "landing_notes",
  },
  training: {
    headline: "Turn training docs into guided practice.",
    supporting: "Convert onboarding packets, SOPs, and internal docs into a course you can work through.",
    proof: [
      "Useful for operators and coaches",
      "Source-first learning paths",
      "Team waitlist for shared workflows",
    ],
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

function ProductPreview() {
  return (
    <div className="relative rounded-[24px] border border-[var(--border)] bg-[#0f0f0f] p-3 shadow-[0_32px_90px_-60px_rgba(255,255,255,0.45)]">
      <div className="rounded-[18px] border border-[var(--border)] bg-[#050505] p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Course builder</p>
            <h2 className="mt-2 text-[18px] font-medium tracking-normal text-[var(--text)]">
              Photosynthesis from trusted notes
            </h2>
          </div>
          <span className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-[12px] text-[var(--text-dim)]">
            Ready
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[14px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-elev)] p-4">
            <div className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[#080808]">
              <Upload className="size-4 text-[var(--text)]" />
            </div>
            <p className="mt-5 text-[13px] font-medium text-[var(--text)]">biology-notes.pdf</p>
            <p className="mt-1 text-[12px] leading-5 text-[var(--text-dim)]">
              Source material is attached to the course plan.
            </p>
          </div>

          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-elev)] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Generated outline</p>
            <div className="mt-4 space-y-3">
              {["Big idea", "Light reactions", "Practice model", "Review weak spots"].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[11px] text-[var(--text-dim)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] text-[var(--text)]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-[14px] border border-[var(--border)] bg-[var(--bg-elev)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Review queue</p>
              <p className="mt-2 text-[14px] text-[var(--text)]">Energy transfer and chlorophyll roles</p>
            </div>
            <span className="inline-flex items-center gap-2 text-[13px] text-[var(--text-dim)]">
              <BookOpenCheck className="size-4" />
              Practice next
            </span>
          </div>
        </div>
      </div>
    </div>
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
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-black/76 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-7">
          <Link href="/" className="flex items-center gap-3" onClick={() => trackMarketingEvent("nav_logo_clicked", { source: copy.eventSource })}>
            <Image src="/logo.png" alt="" width={32} height={32} className="size-8 rounded-[9px]" />
            <span className="text-[16px] font-semibold tracking-normal">Tuto</span>
          </Link>
          <div className="hidden items-center gap-7 text-[13px] text-[var(--text-dim)] md:flex">
            <a href="#product" className="hover:text-[var(--text)]">Product</a>
            <a href="#use-cases" className="hover:text-[var(--text)]">Use cases</a>
            <a href="#pricing" className="hover:text-[var(--text)]">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Open app
            </Link>
            <Link
              href="/create"
              onClick={() => trackMarketingEvent("hero_create_course_clicked", { source: copy.eventSource, location: "nav" })}
              className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
            >
              Create course
              <ArrowRight data-icon="inline-end" />
            </Link>
          </div>
        </nav>
      </header>

      <section id="product" className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-7xl gap-10 px-5 py-14 sm:px-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:items-center lg:py-16">
        <div className="max-w-3xl">
          <h1 className="text-[48px] font-semibold leading-[0.98] tracking-normal text-[var(--text)] sm:text-[68px] lg:text-[78px]">
            {copy.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-[19px] leading-8 text-[var(--text-dim)] sm:text-[21px]">
            {copy.supporting}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/create"
              onClick={() => trackMarketingEvent("hero_create_course_clicked", { source: copy.eventSource, location: "hero" })}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Create your first course
              <ArrowRight data-icon="inline-end" />
            </Link>
            <a
              href="#beta"
              onClick={() => trackMarketingEvent("hero_beta_clicked", { source: copy.eventSource })}
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
            >
              Join the beta
            </a>
          </div>
          <div className="mt-12 grid max-w-2xl gap-3 border-t border-[var(--border)] pt-6 text-[13px] leading-6 text-[var(--text-dim)] sm:grid-cols-3">
            {copy.proof.map((proof) => (
              <p key={proof}>{proof}</p>
            ))}
          </div>
        </div>
        <ProductPreview />
      </section>

      <section className="border-y border-[var(--border)] bg-[#050505]">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 py-14 sm:px-7 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step.title} className="min-h-[180px] border-l border-[var(--border)] px-5 py-2">
              <span className="text-[12px] text-[var(--text-faint)]">{String(index + 1).padStart(2, "0")}</span>
              <h2 className="mt-8 text-[20px] font-medium leading-7 tracking-normal text-[var(--text)]">{step.title}</h2>
              <p className="mt-3 text-[14px] leading-6 text-[var(--text-dim)]">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="use-cases" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-7">
        <div className="max-w-3xl">
          <h2 className="text-[38px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[52px]">
            Built for dense material and real study loops.
          </h2>
          <p className="mt-5 text-[18px] leading-8 text-[var(--text-dim)]">
            Start where the pain is sharp: adult learners with material they need to understand, remember, and apply.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {useCases.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="min-h-[250px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] p-6">
                <Icon className="size-5 text-[var(--text)]" />
                <h3 className="mt-12 text-[24px] font-medium leading-8 tracking-normal text-[var(--text)]">{item.title}</h3>
                <p className="mt-4 text-[14px] leading-6 text-[var(--text-dim)]">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="beta" className="border-y border-[var(--border)] bg-[#050505]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-20 sm:px-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.85fr)] lg:items-start">
          <div className="max-w-2xl">
            <h2 className="text-[38px] font-semibold leading-[1.05] tracking-normal text-[var(--text)] sm:text-[52px]">
              Help shape the beta before the broad paid launch.
            </h2>
            <p className="mt-5 text-[18px] leading-8 text-[var(--text-dim)]">
              We are prioritizing professional learners, tutors, coaches, and operators who have real material ready to test.
            </p>
            <div className="mt-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] p-5">
              <FileText className="size-5 text-[var(--text)]" />
              <p className="mt-6 text-[15px] leading-7 text-[var(--text-dim)]">
                Beta onboarding focuses on the first useful loop: upload or prompt, generate course, complete a lesson, and review the first weak spot.
              </p>
            </div>
          </div>
          <BetaForm eventSource={copy.eventSource} />
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-7">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            ["Free starter", "$0", "Create the first course and feel the loop before upgrading."],
            ["Pro", "$20/mo", "More generation room, more document knowledge bases, and guided practice."],
            ["Team", "$65/mo", "Shared-use billing for small teams, tutors, coaches, and cohort operators."],
            ["Enterprise", "Custom", "For schools and companies that need seats, onboarding, and contract billing."],
          ].map(([name, price, body]) => (
            <article key={name} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev)] p-6">
              <h3 className="text-[15px] font-medium text-[var(--text)]">{name}</h3>
              <p className="mt-5 text-[34px] font-semibold tracking-normal text-[var(--text)]">{price}</p>
              <p className="mt-4 min-h-16 text-[14px] leading-6 text-[var(--text-dim)]">{body}</p>
              <Link
                href={name === "Enterprise" ? "/pricing#enterprise" : name === "Pro" || name === "Team" ? "/pricing" : "/create"}
                onClick={() => trackMarketingEvent("pricing_cta_clicked", { source: copy.eventSource, plan: name })}
                className={cn(buttonVariants({ variant: name === "Pro" || name === "Enterprise" ? "default" : "secondary", size: "lg" }), "mt-7 w-full")}
              >
                {name === "Enterprise" ? "Talk to us" : name === "Pro" || name === "Team" ? "View pricing" : "Start free"}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[#050505]">
        <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-7">
          <h2 className="text-[34px] font-semibold leading-tight tracking-normal text-[var(--text)]">Questions before you upload?</h2>
          <div className="mt-8 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex items-center justify-between gap-6 text-[16px] font-medium text-[var(--text)]">
                  {faq.question}
                  <ArrowRight className="size-4 rotate-0 text-[var(--text-dim)] transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-4 max-w-3xl text-[14px] leading-6 text-[var(--text-dim)]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-[13px] text-[var(--text-faint)] sm:px-7">
        <p>Tuto © {year}</p>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-[var(--text)]">Privacy</Link>
          <Link href="/terms" className="hover:text-[var(--text)]">Terms</Link>
          <Link href="/support" className="hover:text-[var(--text)]">Support</Link>
        </div>
      </footer>
    </main>
  );
}
