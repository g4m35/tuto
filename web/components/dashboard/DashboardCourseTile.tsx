"use client";

import Link from "next/link";
import { ArrowRight, Atom, Beaker, Binary, BookOpenText, Globe2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { CourseCardData } from "@/lib/mock-data";

function getSubjectAccent(subject: string) {
  const normalized = subject.toLowerCase();

  if (normalized.includes("math")) {
    return {
      icon: Binary,
      className:
        "bg-[linear-gradient(135deg,#eff6ff_0%,#dbeafe_55%,#bfdbfe_100%)] text-slate-900",
      dotClass: "bg-blue-500/14",
    };
  }

  if (normalized.includes("chem")) {
    return {
      icon: Beaker,
      className:
        "bg-[linear-gradient(135deg,#f0fdf4_0%,#dcfce7_55%,#bbf7d0_100%)] text-slate-900",
      dotClass: "bg-emerald-500/14",
    };
  }

  if (normalized.includes("history") || normalized.includes("human")) {
    return {
      icon: Globe2,
      className:
        "bg-[linear-gradient(135deg,#fff7ed_0%,#ffedd5_55%,#fed7aa_100%)] text-slate-900",
      dotClass: "bg-orange-500/14",
    };
  }

  return {
    icon: Atom,
    className:
      "bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_55%,#e2e8f0_100%)] text-slate-900",
    dotClass: "bg-slate-500/14",
  };
}

interface DashboardCourseTileProps {
  course: CourseCardData;
  index: number;
}

export function DashboardCourseTile({ course, index }: DashboardCourseTileProps) {
  const shouldReduceMotion = useReducedMotion();
  const accent = getSubjectAccent(course.subject);
  const AccentIcon = accent.icon;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? undefined : { duration: 0.45, delay: 0.12 + index * 0.08 }}
      whileHover={shouldReduceMotion ? undefined : { y: -6 }}
      className="h-full"
    >
      <Link href={`/courses/${course.id}`} className="group block h-full">
        <article className="surface-card flex h-full flex-col rounded-[28px] p-4">
          <div
            className={`relative min-h-[176px] overflow-hidden rounded-[22px] p-4 ${accent.className}`}
          >
            <div className={`absolute -right-10 -top-10 size-28 rounded-full blur-2xl ${accent.dotClass}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_34%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/76 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                  <BookOpenText className="size-3.5" />
                  {course.subject}
                </span>
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-white/82 shadow-sm">
                  <AccentIcon className="size-5" />
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                  Active module
                </p>
                <h3 className="max-w-[14rem] text-[1.65rem] font-semibold leading-tight tracking-tight text-slate-900">
                  {course.title}
                </h3>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
            <p className="line-clamp-3 text-sm leading-6 text-[var(--text-dim)]">
              {course.description}
            </p>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-faint)]">
                <span>
                  {course.lessonsComplete}/{course.lessonCount} modules
                </span>
                <span>{course.progress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-soft)]">
                <motion.div
                  className="h-full rounded-full bg-[var(--accent)]"
                  initial={shouldReduceMotion ? false : { width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={shouldReduceMotion ? undefined : { duration: 0.7, delay: 0.2 + index * 0.08 }}
                />
              </div>
            </div>

            <div className="mt-auto flex items-end justify-between gap-3 pt-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-faint)]">
                  Focus
                </p>
                <p className="text-sm font-medium text-[var(--text)]">{course.weakness}</p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                Open course
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
