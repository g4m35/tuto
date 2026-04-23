"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Clock3,
  Flame,
  Sparkles,
  Target,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { buttonVariants } from "@/components/ui/Button";
import type { DashboardViewData } from "@/lib/course-data";
import { cn } from "@/lib/utils";
import { DeepTutorStatusBanner } from "./DeepTutorStatusBanner";
import { DashboardCourseTile } from "./DashboardCourseTile";
import { DashboardRail } from "./DashboardRail";

interface DashboardExperienceProps {
  dashboard: DashboardViewData;
  hasStubCourses: boolean;
}

const sectionTransition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };

export function DashboardExperience({
  dashboard,
  hasStubCourses,
}: DashboardExperienceProps) {
  const shouldReduceMotion = useReducedMotion();
  const continueCourse = dashboard.continueCourse;
  const [activeSectionId, setActiveSectionId] = useState("overview");

  useEffect(() => {
    const sectionIds = ["overview", "courses", "focus"];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    const syncFromHash = () => {
      const next = window.location.hash.replace("#", "");
      if (next) {
        setActiveSectionId(next);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    if (!sections.length) {
      return () => {
        window.removeEventListener("hashchange", syncFromHash);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveSectionId(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.2, 0.45, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
      <DashboardRail hasCourses={dashboard.courses.length > 0} />

      <div className="flex flex-col gap-6">
        <DeepTutorStatusBanner hasStubCourses={hasStubCourses} />

        <motion.section
          id="overview"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? undefined : sectionTransition}
          className="surface-card overflow-hidden rounded-[32px] p-6 sm:p-8"
        >
          <div className="app-grid rounded-[28px] border border-[var(--border)] bg-[var(--bg-elev)]/72 p-5 sm:p-6">
            <div className="flex flex-col gap-6 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-faint)]">
                  <Sparkles className="size-3.5 text-[var(--accent)]" />
                  Active learning
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
                    Keep the study loop narrow, calm, and ready to resume.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-[var(--text-dim)] sm:text-lg">
                    {continueCourse
                      ? "Your current workspace is centered on the lesson that still needs repetition. The dashboard surfaces only the next useful move, not a wall of stats."
                      : "This dashboard is set up like a quiet learning workspace. Once a course exists, the active module, weak spot, and next action take over the screen."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 lg:items-end">
                <Link
                  href={continueCourse ? `/courses/${continueCourse.id}` : "/create"}
                  className={cn(buttonVariants({ size: "lg" }), "min-w-44 rounded-full px-5")}
                >
                  {continueCourse ? "Resume course" : "Create course"}
                  <ArrowRight data-icon="inline-end" />
                </Link>
                <p className="text-sm text-[var(--text-dim)]">
                  {continueCourse
                    ? dashboard.continueCopy
                    : "Start from a prompt or upload and the workspace will build itself around it."}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Active courses",
                  value: `${dashboard.courses.length}`,
                  detail: "current stack",
                  icon: BookOpen,
                },
                {
                  label: "Current streak",
                  value: `${dashboard.streakDays} days`,
                  detail: "steady rhythm",
                  icon: Flame,
                },
                {
                  label: "Focus area",
                  value: dashboard.insightTopic,
                  detail: "next weak spot",
                  icon: Target,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-elev)]/90 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-faint)]">
                        {item.label}
                      </p>
                      <Icon className="size-4 text-[var(--accent)]" />
                    </div>
                    <p className="mt-4 text-2xl font-semibold tracking-tight text-[var(--text)]">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-dim)]">{item.detail}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 xl:hidden">
              {[
                { id: "overview", label: "Overview" },
                { id: "focus", label: "Focus" },
                { id: "courses", label: "Courses" },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`rounded-full px-4 py-2 text-sm ${
                    activeSectionId === item.id
                      ? "bg-[var(--text)] text-white"
                      : "border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text-dim)]"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          id="courses"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? undefined : { ...sectionTransition, delay: 0.08 }}
          className="surface-card rounded-[32px] p-6 sm:p-8"
        >
          <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="eyebrow">Course stack</p>
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-[2.2rem]">
                Active learning, arranged like a workspace instead of a dashboard.
              </h2>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]"
            >
              Create another course
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {dashboard.courses.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.courses.map((course, index) => (
                <DashboardCourseTile key={course.id} course={course} index={index} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[28px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)]/72 p-8 text-center">
              <p className="text-lg font-medium text-[var(--text)]">No active courses yet</p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--text-dim)]">
                Build one course from a topic or upload and this area will become your active
                learning surface, complete with motion, progress, and the next resume point.
              </p>
              <Link
                href="/create"
                className={cn(buttonVariants({ size: "lg" }), "mt-6 rounded-full px-5")}
              >
                Create first course
              </Link>
            </div>
          )}
        </motion.section>

        <motion.section
          id="focus"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? undefined : { ...sectionTransition, delay: 0.16 }}
          className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="surface-card rounded-[32px] p-6 sm:p-7">
            <p className="eyebrow">Review pulse</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text)]">
              {continueCourse
                ? `The next useful repetition is ${dashboard.insightTopic}.`
                : "The next useful repetition will appear here."}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-dim)] sm:text-base">
              {continueCourse
                ? "We keep the review window tight, carry the weak spot forward, and surface the current lesson before introducing new material."
                : "Once the first course is generated, this area will explain how the last lesson changed the next one and what the system thinks needs reinforcement."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: "Adaptive review",
                  body: continueCourse
                    ? "The next exercise is already biased toward your unstable concept."
                    : "Adaptive review starts as soon as there is course progress to model.",
                  icon: BrainCircuit,
                },
                {
                  title: "Session cadence",
                  body: continueCourse ? continueCourse.duration : "Your first course will define the pace.",
                  icon: Clock3,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)]/74 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--bg-elev)] text-[var(--accent)] shadow-sm">
                        <Icon className="size-[18px]" />
                      </div>
                      <p className="font-medium text-[var(--text)]">{item.title}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="surface-card rounded-[32px] p-6 sm:p-7">
            <p className="eyebrow">Study rhythm</p>
            <div className="mt-4 space-y-4">
              {[
                {
                  title: "Continue the current path",
                  body: continueCourse
                    ? `${continueCourse.title} is ready to resume right where you left it.`
                    : "Generate your first course to unlock the active path.",
                },
                {
                  title: "Keep supporting details quiet",
                  body: "Use minimal chrome, keep the main workspace visible, and reserve stronger motion for state changes and hover affordances.",
                },
                {
                  title: "Move with intention",
                  body: "Section reveals, progress fills, and hover lifts are deliberate and short so the UI feels alive without becoming noisy.",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: 18 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={
                    shouldReduceMotion
                      ? undefined
                      : { duration: 0.35, delay: 0.2 + index * 0.08 }
                  }
                  className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-elev)]/86 p-4"
                >
                  <div className="flex items-start gap-4">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-soft)] text-sm font-semibold text-[var(--accent)]">
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="font-medium text-[var(--text)]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{item.body}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
