import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookMarked, CheckCircle2, ExternalLink, Layers3, Target } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { buttonVariants } from "@/components/ui/Button";
import {
  buildSampleCoursePrompt,
  getSampleCourseById,
  getSampleCourseStats,
  sampleCourses,
} from "@/lib/sample-courses";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return sampleCourses.map((course) => ({ id: course.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = getSampleCourseById(id);

  if (!course) {
    return {
      title: "Sample Course | Tuto",
    };
  }

  return {
    title: `${course.title} | Tuto Sample Course`,
    description: course.description,
  };
}

export default async function SampleCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = getSampleCourseById(id);

  if (!course) {
    notFound();
  }

  const stats = getSampleCourseStats(course);
  const promptPreview = buildSampleCoursePrompt(course);

  return (
    <main className="min-h-screen bg-[#fbfffd] text-[#102a43]">
      <MarketingHeader
        active="samples"
        anchorBase="/"
        eventSource="sample_course_detail"
        primaryHref={`/create?sampleCourse=${course.id}`}
        primaryLabel="Use this sample"
        primaryEventName="sample_course_use_clicked"
        primaryEventProps={{ courseId: course.id }}
      />

      <section className="border-b border-[#d9e8e4] bg-[#f5fbf8]">
        <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-7 lg:py-14">
          <Link
            href="/sample-courses"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#486581] hover:text-[#102a43]"
          >
            <ArrowLeft className="size-4" />
            Back to sample courses
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.52fr)] lg:items-start">
            <div>
              <div className="flex flex-wrap gap-2">
                {[course.subject, course.level, course.duration].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#cfe1dd] bg-white px-3 py-1 text-[12px] font-semibold text-[#2f8f83]"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <h1 className="mt-5 max-w-5xl text-[42px] font-semibold leading-[1.02] tracking-[-0.035em] text-[#102a43] sm:text-[62px]">
                {course.title}
              </h1>
              <p className="mt-6 max-w-3xl text-[18px] leading-8 text-[#486581]">{course.description}</p>
            </div>

            <aside className="rounded-[24px] border border-[#cfe1dd] bg-white p-6 shadow-[0_26px_64px_-50px_rgba(16,42,67,0.58)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#e6f7f2] text-[#2f8f83]">
                  <Target className="size-5" />
                </span>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#829ab1]">Capstone</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#102a43]">Applied final project</p>
                </div>
              </div>
              <p className="mt-5 text-[14px] leading-7 text-[#486581]">{course.capstone}</p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  [stats.moduleCount, "Modules"],
                  [stats.lessonCount, "Lessons"],
                  [stats.sourceCount, "Sources"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-[14px] border border-[#d9e8e4] bg-[#f8fcfa] p-3">
                    <p className="text-[20px] font-semibold text-[#102a43]">{value}</p>
                    <p className="mt-1 text-[11px] text-[#486581]">{label}</p>
                  </div>
                ))}
              </div>
              <Link
                href={`/create?sampleCourse=${course.id}`}
                className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full")}
              >
                Start from this topic
                <ArrowRight data-icon="inline-end" />
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-12 sm:px-7 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:py-16">
        <div className="space-y-4">
          <p className="text-[13px] font-semibold text-[#2f8f83]">Sample fit</p>
          <h2 className="text-[34px] font-semibold leading-tight tracking-[-0.03em] text-[#102a43]">
            Course depth.
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[course.audience, course.whyItWorks].map((item, index) => (
            <article key={item} className="rounded-[20px] border border-[#d9e8e4] bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#e6f7f2] text-[#2f8f83]">
                  {index === 0 ? <BookMarked className="size-4" /> : <Layers3 className="size-4" />}
                </span>
                <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#829ab1]">
                  {index === 0 ? "Audience" : "Demo value"}
                </p>
              </div>
              <p className="mt-4 text-[14px] leading-7 text-[#486581]">{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#d9e8e4] bg-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-7 lg:py-18">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[13px] font-semibold text-[#2f8f83]">Module arc</p>
              <h2 className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.03em] text-[#102a43]">
                Learning path.
              </h2>
            </div>
            <p className="max-w-xl text-[15px] leading-7 text-[#486581]">
              Three lessons and one project per module.
            </p>
          </div>

          <div className="mt-9 space-y-3">
            {course.modules.map((module, index) => (
              <article
                key={module.id}
                className="grid gap-5 rounded-[20px] border border-[#d9e8e4] bg-[#fbfffd] p-5 md:grid-cols-[86px_minmax(0,0.9fr)_minmax(0,1fr)] md:p-6"
              >
                <div>
                  <span className="inline-flex size-11 items-center justify-center rounded-full bg-[#102a43] text-[14px] font-semibold text-white">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-[22px] font-semibold leading-7 tracking-[-0.025em] text-[#102a43]">
                    {module.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-7 text-[#486581]">{module.summary}</p>
                  <p className="mt-4 rounded-[14px] border border-[#d9e8e4] bg-white p-4 text-[13px] leading-6 text-[#486581]">
                    <span className="font-semibold text-[#102a43]">Project:</span> {module.project}
                  </p>
                </div>
                <ul className="space-y-3">
                  {module.lessons.map((lesson) => (
                    <li key={lesson} className="flex gap-3 text-[14px] leading-6 text-[#486581]">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#2f8f83]" />
                      <span>{lesson}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-14 sm:px-7 lg:grid-cols-[minmax(0,0.82fr)_minmax(420px,0.62fr)]">
        <div>
          <p className="text-[13px] font-semibold text-[#2f8f83]">Sources</p>
          <h2 className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.03em] text-[#102a43]">
            Open sources.
          </h2>
          <div className="mt-7 grid gap-3 md:grid-cols-2">
            {course.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-[18px] border border-[#d9e8e4] bg-white p-5 text-[14px] font-semibold leading-6 text-[#102a43] hover:border-[#9fbfb7]"
              >
                <span className="flex items-start justify-between gap-4">
                  <span>{source.label}</span>
                  <ExternalLink className="mt-1 size-4 shrink-0 text-[#2f8f83] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </a>
            ))}
          </div>
        </div>

        <aside className="rounded-[24px] border border-[#d9e8e4] bg-[#f5fbf8] p-5">
          <p className="text-[13px] font-semibold text-[#2f8f83]">Generation prompt</p>
          <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-[18px] border border-[#d9e8e4] bg-white p-4 text-[12px] leading-6 text-[#486581]">
            {promptPreview}
          </pre>
        </aside>
      </section>
    </main>
  );
}
