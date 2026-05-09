import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, GraduationCap, LibraryBig, Sparkles } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { buttonVariants } from "@/components/ui/Button";
import { getSampleCourseStats, sampleCourses } from "@/lib/sample-courses";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sample Courses | Tuto",
  description: "Explore research-informed sample courses across economics, science, philosophy, English, writing, and data.",
};

const featuredPrinciples = [
  "8-10 module arcs with applied projects",
  "Source-inspired structure from trusted open learning materials",
  "Designed to show lessons, review, exports, and capstone workflows",
];

export default function SampleCoursesPage() {
  const totalLessons = sampleCourses.reduce(
    (total, course) => total + getSampleCourseStats(course).lessonCount,
    0,
  );

  return (
    <main className="min-h-screen bg-[#fbfffd] text-[#102a43]">
      <MarketingHeader active="samples" anchorBase="/" eventSource="sample_courses_index" />

      <section className="border-b border-[#d9e8e4] bg-[#f5fbf8]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.62fr)] lg:items-end lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe1dd] bg-white px-3 py-1 text-[12px] font-semibold text-[#2f8f83]">
              <LibraryBig className="size-3.5" />
              Sample course library
            </div>
            <h1 className="mt-5 max-w-4xl text-[44px] font-semibold leading-[1] tracking-[-0.035em] text-[#102a43] sm:text-[64px]">
              In-depth examples users can inspect before they create.
            </h1>
            <p className="mt-6 max-w-2xl text-[18px] leading-8 text-[#486581]">
              These sample courses are designed as product-quality demonstrations: rich enough to show Tuto&apos;s course depth,
              compact enough to scan, and grounded in reputable open learning sources.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#courses"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#102a43] px-5 text-[14px] font-semibold text-white hover:bg-[#243b53]"
              >
                Browse samples
                <ArrowRight data-icon="inline-end" />
              </a>
              <Link
                href="/create"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[#cfe1dd] bg-white px-5 text-[14px] font-semibold text-[#102a43] hover:border-[#9fbfb7]"
              >
                Make your own
              </Link>
            </div>
          </div>

          <aside className="rounded-[24px] border border-[#cfe1dd] bg-white p-6 shadow-[0_26px_64px_-48px_rgba(16,42,67,0.56)]">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-[#e6f7f2] text-[#2f8f83]">
                <BookOpenCheck className="size-5" />
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#829ab1]">
                Research draft
              </span>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ["Courses", sampleCourses.length],
                ["Modules", sampleCourses.reduce((total, course) => total + course.modules.length, 0)],
                ["Lessons", totalLessons],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[16px] border border-[#d9e8e4] bg-[#f8fcfa] p-4">
                  <p className="text-[24px] font-semibold tracking-[-0.03em] text-[#102a43]">{value}</p>
                  <p className="mt-1 text-[12px] text-[#486581]">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              {featuredPrinciples.map((principle) => (
                <p key={principle} className="flex gap-3 text-[14px] leading-6 text-[#486581]">
                  <Sparkles className="mt-1 size-4 shrink-0 text-[#2f8f83]" />
                  <span>{principle}</span>
                </p>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section id="courses" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-7 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[13px] font-semibold text-[#2f8f83]">Course plans</p>
            <h2 className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.03em] text-[#102a43] sm:text-[46px]">
              Six polished starting points.
            </h2>
          </div>
          <p className="max-w-xl text-[15px] leading-7 text-[#486581]">
            Each plan includes audience, lesson arc, applied projects, and source inspiration so learners can judge quality at a glance.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {sampleCourses.map((course, index) => {
            const stats = getSampleCourseStats(course);

            return (
              <Link
                key={course.id}
                href={`/sample-courses/${course.id}`}
                className="group min-h-[360px] rounded-[24px] border border-[#d9e8e4] bg-white p-6 shadow-[0_20px_54px_-46px_rgba(10,37,64,0.58)] transition duration-200 hover:-translate-y-0.5 hover:border-[#9fbfb7]"
              >
                <div className="flex items-start justify-between gap-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#e6f7f2] px-3 py-1 text-[12px] font-semibold text-[#2f8f83]">
                    <GraduationCap className="size-3.5" />
                    {course.subject}
                  </div>
                  <span className="text-[12px] font-semibold text-[#829ab1]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="mt-8 max-w-2xl text-[27px] font-semibold leading-[1.12] tracking-[-0.03em] text-[#102a43]">
                  {course.title}
                </h3>
                <p className="mt-4 text-[15px] leading-7 text-[#486581]">{course.description}</p>

                <div className="mt-6 grid gap-2 sm:grid-cols-3">
                  {[
                    [course.level, "Level"],
                    [`${stats.moduleCount}`, "Modules"],
                    [`${stats.lessonCount}`, "Lessons"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-[16px] border border-[#d9e8e4] bg-[#f8fcfa] p-4">
                      <p className="text-[18px] font-semibold text-[#102a43]">{value}</p>
                      <p className="mt-1 text-[12px] text-[#486581]">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex items-center justify-between border-t border-[#d9e8e4] pt-5 text-[14px] font-semibold text-[#102a43]">
                  <span>{stats.sourceCount} source anchors</span>
                  <span className="inline-flex items-center gap-2 text-[#2f8f83]">
                    View course
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-[#d9e8e4] bg-[#102a43]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-12 text-white sm:px-7 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.025em]">
              Ready to generate from one of these?
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-white/70">
              Open any sample, inspect the full arc, then start a topic prompt from the same research-informed structure.
            </p>
          </div>
          <Link href="/create" className={cn(buttonVariants({ size: "lg" }), "bg-white text-[#102a43] hover:bg-[#f5fbf8]")}>
            Create a course
            <ArrowRight data-icon="inline-end" />
          </Link>
        </div>
      </section>
    </main>
  );
}
