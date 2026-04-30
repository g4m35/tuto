import test from "node:test";
import assert from "node:assert/strict";

import {
  buildArtifactPromptDirective,
  buildCourseArtifactExport,
  normalizeCourseArtifactExportFormat,
  normalizeCourseArtifactKind,
} from "../lib/course-artifacts";
import type { StoredCourse } from "../lib/course-data";

const baseCourse: StoredCourse = {
  id: "artifact-course",
  clerkId: "user-artifact",
  title: "Photosynthesis",
  subject: "Biology",
  difficulty: "Beginner",
  description: "A student-friendly guide to photosynthesis.",
  artifactKind: "study-guide",
  sourceMode: "topic",
  sourceIds: [],
  knowledgeBaseName: null,
  deeptutorSessionId: "session-artifact",
  deeptutorStatus: "initialized",
  currentLessonIndex: 0,
  currentLessonId: null,
  guidePayload: {
    knowledge_points: [
      {
        knowledge_title: "Light energy",
        knowledge_summary: "Plants capture light energy in chlorophyll.",
      },
      {
        knowledge_title: "Glucose",
        knowledge_summary: "The stored chemical energy becomes glucose.",
      },
    ],
    progress: 0,
  },
  backendMode: "stub",
  shareToken: null,
  shareEnabled: false,
  sharedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

test("artifact kind normalization falls back to full course", () => {
  assert.equal(normalizeCourseArtifactKind("slides"), "slides");
  assert.equal(normalizeCourseArtifactKind("not-real"), "course");
  assert.equal(normalizeCourseArtifactExportFormat("google-slides"), "pptx");
  assert.equal(normalizeCourseArtifactExportFormat("google-docs"), "docx");
});

test("artifact prompt directive carries the selected artifact intent", () => {
  const directive = buildArtifactPromptDirective("slides");

  assert.match(directive, /Artifact to make: Slide deck/);
  assert.match(directive, /one clear message per slide/);
});

test("artifact exports include generated content in downloadable formats", () => {
  const markdown = buildCourseArtifactExport(baseCourse, "markdown");
  const html = buildCourseArtifactExport(baseCourse, "html");
  const slides = buildCourseArtifactExport({ ...baseCourse, artifactKind: "slides" }, "slides");
  const pptx = buildCourseArtifactExport({ ...baseCourse, artifactKind: "slides" }, "pptx");
  const docx = buildCourseArtifactExport(baseCourse, "docx");
  const markdownBody = markdown.body;
  const htmlBody = html.body;
  const slidesBody = slides.body;

  assert.equal(markdown.fileName, "photosynthesis.md");
  if (typeof markdownBody !== "string") throw new Error("expected markdown body");
  assert.match(markdownBody, /# Photosynthesis/);
  assert.match(markdownBody, /Light energy/);
  assert.equal(html.contentType, "text/html; charset=utf-8");
  if (typeof htmlBody !== "string") throw new Error("expected html body");
  assert.match(htmlBody, /<h1>Photosynthesis<\/h1>/);
  assert.equal(slides.fileName, "photosynthesis-slides.md");
  if (typeof slidesBody !== "string") throw new Error("expected slides body");
  assert.match(slidesBody, /---/);
  assert.match(slidesBody, /Speaker note/);
  assert.equal(pptx.fileName, "photosynthesis-google-slides.pptx");
  assert.equal(
    pptx.contentType,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  );
  assert.ok(pptx.body instanceof ArrayBuffer);
  const pptxBuffer = Buffer.from(pptx.body);
  assert.equal(pptxBuffer.subarray(0, 2).toString("utf8"), "PK");
  assert.match(pptxBuffer.toString("utf8"), /ppt\/presentation\.xml/);
  assert.match(pptxBuffer.toString("utf8"), /Photosynthesis/);
  assert.equal(docx.fileName, "photosynthesis-google-docs.docx");
  assert.equal(
    docx.contentType,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  assert.ok(docx.body instanceof ArrayBuffer);
  const docxBuffer = Buffer.from(docx.body);
  assert.equal(docxBuffer.subarray(0, 2).toString("utf8"), "PK");
  assert.match(docxBuffer.toString("utf8"), /word\/document\.xml/);
  assert.match(docxBuffer.toString("utf8"), /Photosynthesis/);
});
