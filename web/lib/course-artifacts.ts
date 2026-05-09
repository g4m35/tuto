export const courseArtifactKinds = [
  "course",
  "study-guide",
  "slides",
  "quiz-set",
  "cheat-sheet",
  "lesson-plan",
] as const;

export type CourseArtifactKind = (typeof courseArtifactKinds)[number];

export type CourseArtifactExportFormat = "markdown" | "html" | "slides" | "pptx" | "docx";

export interface CourseArtifactOption {
  kind: CourseArtifactKind;
  title: string;
  noun: string;
  description: string;
  dashboardAction: string;
  previewTitle: string;
  promptDirective: string;
  previewItems: string[];
  estimate: string;
}

export interface CourseArtifactExportInput {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  description: string;
  artifactKind?: CourseArtifactKind | null;
  sourceMode: "topic" | "upload";
  sourceIds: string[];
  knowledgeBaseName: string | null;
  guidePayload: {
    knowledge_points?: Array<{
      knowledge_title?: string;
      knowledge_summary?: string;
      user_difficulty?: string;
    }>;
    progress?: number;
  };
  backendMode: "live" | "stub";
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseArtifactExport {
  body: string | ArrayBuffer;
  contentType: string;
  fileName: string;
}

export const courseArtifactOptions: CourseArtifactOption[] = [
  {
    kind: "course",
    title: "Full course",
    noun: "course",
    description: "Lessons, practice, review, projects.",
    dashboardAction: "Continue course",
    previewTitle: "Learning path",
    promptDirective:
      "Create a full guided course outline with sequential lessons, practice checkpoints, and applied project ideas.",
    previewItems: [
      "L01 - Big picture",
      "L02 - Core ideas",
      "L03 - Worked example",
      "L04 - Practice checkpoint",
      "L05 - Review and project",
    ],
    estimate: "5 lessons - 1h 40m total",
  },
  {
    kind: "study-guide",
    title: "Study guide",
    noun: "study guide",
    description: "Concise review for exams or catch-up.",
    dashboardAction: "Open guide",
    previewTitle: "Guide sections",
    promptDirective:
      "Create a student-friendly study guide with key ideas, definitions, examples, memory cues, and a review checklist.",
    previewItems: [
      "Overview",
      "Key terms",
      "Worked example",
      "Common mistakes",
      "Review checklist",
    ],
    estimate: "5 sections - quick review",
  },
  {
    kind: "slides",
    title: "Slide deck",
    noun: "slide deck",
    description: "Slides for teaching or explaining.",
    dashboardAction: "Open deck",
    previewTitle: "Slide outline",
    promptDirective:
      "Create an 8 to 12 slide presentation plan with one clear message per slide, specific evidence, speaker notes, visual direction for each slide, and closing discussion prompts.",
    previewItems: [
      "Slide 01 - Title and goal",
      "Slide 02 - Why it matters",
      "Slide 03 - Core model",
      "Slide 04 - Example",
      "Slide 05 - Recap",
    ],
    estimate: "8-12 slides - presenter notes",
  },
  {
    kind: "quiz-set",
    title: "Quiz set",
    noun: "quiz set",
    description: "Practice questions with answer focus.",
    dashboardAction: "Open quiz",
    previewTitle: "Question set",
    promptDirective:
      "Create a quiz set outline with concept checks, answer rationales, escalating difficulty, and topics for remediation.",
    previewItems: [
      "Question 01 - Recall",
      "Question 02 - Concept check",
      "Question 03 - Application",
      "Question 04 - Trap answer",
      "Question 05 - Review",
    ],
    estimate: "5 prompts - answer guide",
  },
  {
    kind: "cheat-sheet",
    title: "Cheat sheet",
    noun: "cheat sheet",
    description: "One-page formulas, cues, pitfalls.",
    dashboardAction: "Open sheet",
    previewTitle: "Reference blocks",
    promptDirective:
      "Create a compact cheat sheet with must-know facts, formulas or rules, quick examples, warning signs, and a last-minute review checklist.",
    previewItems: [
      "Core facts",
      "Key formulas",
      "Fast examples",
      "Common traps",
      "Final checklist",
    ],
    estimate: "5 blocks - one-page reference",
  },
  {
    kind: "lesson-plan",
    title: "Lesson plan",
    noun: "lesson plan",
    description: "Objectives, flow, activities, checks.",
    dashboardAction: "Open plan",
    previewTitle: "Teaching flow",
    promptDirective:
      "Create a lesson plan with objectives, warm-up, direct instruction, guided practice, independent practice, and assessment checks.",
    previewItems: [
      "Objective",
      "Warm-up",
      "Teach the idea",
      "Guided practice",
      "Exit check",
    ],
    estimate: "5 parts - classroom-ready",
  },
];

const optionByKind = new Map(courseArtifactOptions.map((option) => [option.kind, option]));

export function normalizeCourseArtifactKind(value: unknown): CourseArtifactKind {
  if (value === "quiz") {
    return "quiz-set";
  }

  return courseArtifactKinds.includes(value as CourseArtifactKind)
    ? (value as CourseArtifactKind)
    : "course";
}

export function getCourseArtifactOption(value: unknown): CourseArtifactOption {
  return optionByKind.get(normalizeCourseArtifactKind(value)) ?? courseArtifactOptions[0];
}

export function isInteractiveCourseArtifact(value: unknown) {
  return normalizeCourseArtifactKind(value) === "course";
}

export function getPrimaryCourseArtifactExportFormat(value: unknown): CourseArtifactExportFormat {
  const kind = normalizeCourseArtifactKind(value);

  if (kind === "slides") {
    return "pptx";
  }

  if (kind === "study-guide" || kind === "lesson-plan" || kind === "cheat-sheet") {
    return "docx";
  }

  return "markdown";
}

export function getPrimaryCourseArtifactActionLabel(value: unknown) {
  const option = getCourseArtifactOption(value);

  if (option.kind === "course") {
    return "Download course notes";
  }

  return `Download ${option.noun}`;
}

export function normalizeCourseArtifactExportFormat(value: unknown): CourseArtifactExportFormat {
  return value === "html" ||
    value === "slides" ||
    value === "pptx" ||
    value === "docx" ||
    value === "google-slides" ||
    value === "google-docs"
    ? value === "google-slides"
      ? "pptx"
      : value === "google-docs"
        ? "docx"
      : value
    : "markdown";
}

function getKnowledgePoints(course: CourseArtifactExportInput) {
  return Array.isArray(course.guidePayload.knowledge_points)
    ? course.guidePayload.knowledge_points
    : [];
}

function line(value: unknown) {
  return String(value ?? "").trim();
}

function sectionSummary(point: { knowledge_summary?: string; user_difficulty?: string }) {
  return line(point.knowledge_summary) || line(point.user_difficulty) || "Generated by Tuto.";
}

function fileSafe(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 64) || "tuto-artifact"
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildArtifactPromptDirective(kind: unknown) {
  const option = getCourseArtifactOption(kind);
  const sharedGuidance = [
    `Artifact to make: ${option.title}.`,
    option.promptDirective,
    "Teach in a step-by-step sequence: start with the useful question, define the core idea, show a concrete example, add a learner action, then close with a checkpoint or review prompt.",
    "Prefer source-grounded, accurate, subject-specific explanations over generic study advice. Call out prerequisites, common misconceptions, and what mastery should look like.",
  ];

  if (option.kind === "slides") {
    sharedGuidance.push(
      "Make the deck presentation-ready, not a course outline: write slide headlines, substantial presenter notes, 2 to 4 concise bullets per slide, and a visual brief for each slide.",
      "Use current public web knowledge when no uploaded source is available, and mention concrete people, dates, examples, diagrams, maps, charts, screenshots, or image-search terms that would make the slide visually specific.",
      "Avoid generic slide titles like Core idea or Worked example unless they are paired with a topic-specific claim.",
    );
  } else {
    sharedGuidance.push("Keep the output practical, structured, and useful as a downloadable document.");
  }

  return sharedGuidance.join("\n");
}

export function buildCourseArtifactMarkdown(course: CourseArtifactExportInput) {
  const option = getCourseArtifactOption(course.artifactKind);
  const points = getKnowledgePoints(course);
  const parts = [
    `# ${course.title}`,
    "",
    `Type: ${option.title}`,
    `Subject: ${course.subject}`,
    `Level: ${course.difficulty}`,
    "",
    course.description,
    "",
    "## Outline",
    "",
  ];

  if (!points.length) {
    parts.push("- No generated sections yet.");
  } else {
    points.forEach((point, index) => {
      parts.push(
        `${index + 1}. ${line(point.knowledge_title) || `Section ${index + 1}`} - ${sectionSummary(point)}`,
      );
    });
  }

  parts.push("", "## Details", "");

  if (!points.length) {
    parts.push("This artifact has not generated detailed sections yet.");
  } else {
    points.forEach((point, index) => {
      const title = line(point.knowledge_title) || `Section ${index + 1}`;
      parts.push(`### ${index + 1}. ${title}`, "", sectionSummary(point), "");

      if (option.kind === "study-guide") {
        parts.push("- Key idea: write the core definition in your own words.");
        parts.push("- Example: connect this section to one concrete problem.");
        parts.push("- Check yourself: explain why this section matters.");
        parts.push("");
      } else if (option.kind === "quiz-set") {
        parts.push("- Practice prompt: answer a question that tests this idea.");
        parts.push("- Answer focus: include the mechanism, not only the final result.");
        parts.push("- Review note: revisit this if the explanation feels memorized.");
        parts.push("");
      } else if (option.kind === "cheat-sheet") {
        parts.push("- Remember: capture the shortest useful version of the rule.");
        parts.push("- Fast check: apply it to a tiny example before using it in a larger problem.");
        parts.push("- Trap: note the condition where this shortcut stops working.");
        parts.push("");
      } else if (option.kind === "lesson-plan") {
        parts.push("- Teach: introduce the idea with a simple example.");
        parts.push("- Practice: ask the learner to apply it in a new case.");
        parts.push("- Check: use a short exit prompt before moving on.");
        parts.push("");
      }
    });
  }

  return parts.join("\n").replace(/\n{3,}/g, "\n\n");
}

export function buildCourseArtifactSlidesMarkdown(course: CourseArtifactExportInput) {
  const slides = buildPresentationSlides(course).map((slide) =>
    [
      `# ${slide.title}`,
      "",
      `_${slide.kicker}_`,
      "",
      ...slide.body.map((item) => `- ${item}`),
      "",
      `Visual: ${[slide.visualTitle, ...slide.visualLines].join(" - ")}`,
      "",
      `Speaker note: ${slide.footer}`,
    ].join("\n"),
  );

  return slides.join("\n\n---\n\n");
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...` : value;
}

function splitSentences(value: string) {
  return value
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function bulletLines(value: string, fallback: string, maxLines = 4) {
  const sentences = splitSentences(value || fallback);
  const lines = sentences.length ? sentences : [fallback];

  return lines
    .map((item) => truncateText(item.replace(/^[-•]\s*/, ""), 118))
    .filter(Boolean)
    .slice(0, maxLines);
}

function visualBrief(course: CourseArtifactExportInput, title: string, summary: string) {
  const subject = line(course.subject) || course.title;
  const compactSummary = truncateText(summary, 96);

  return [
    `Image or diagram: ${subject}`,
    title,
    compactSummary,
  ].filter(Boolean);
}

type PresentationSlide = {
  title: string;
  kicker: string;
  body: string[];
  visualTitle: string;
  visualLines: string[];
  footer: string;
  tone?: "cover" | "content" | "review";
};

function buildPresentationSlides(course: CourseArtifactExportInput) {
  const option = getCourseArtifactOption(course.artifactKind);
  const points = getKnowledgePoints(course);
  const subject = line(course.subject) || course.title;
  const slides: PresentationSlide[] = [
    {
      title: course.title,
      kicker: `${option.title} · ${course.difficulty}`,
      body: [
        truncateText(course.description || `A presentation about ${subject}.`, 136),
        "Built for teaching, discussion, and fast review.",
      ],
      visualTitle: "Opening visual",
      visualLines: [`Hero image/search: ${subject}`, "Use a map, timeline, object photo, diagram, or primary-source image."],
      footer: "Generated by Tuto",
      tone: "cover",
    },
  ];

  const outlineItems = points.length
    ? points.slice(0, 6).map((point) => line(point.knowledge_title) || "Key section")
    : ["Why it matters", "Core idea", "Example", "Checkpoint"];

  slides.push({
    title: "What this deck will make clear",
    kicker: "Agenda",
    body: outlineItems.map((item, index) => `${index + 1}. ${truncateText(item, 84)}`),
    visualTitle: "Learning path",
    visualLines: ["Timeline, flowchart, or roadmap showing how the ideas build."],
    footer: `${subject} · overview`,
  });

  if (points.length) {
    points.slice(0, 8).forEach((point, index) => {
      const title = line(point.knowledge_title) || `Key idea ${index + 1}`;
      const summary = sectionSummary(point);
      const body = bulletLines(summary, `Explain how ${title} changes the learner's understanding of ${subject}.`, 4);

      slides.push({
        title,
        kicker: `Slide ${index + 3}`,
        body,
        visualTitle: "Visual brief",
        visualLines: visualBrief(course, title, summary),
        footer: "Add an image, chart, map, diagram, or source excerpt that makes this claim inspectable.",
      });
    });
  } else {
    slides.push({
      title: `Start with the concrete question`,
      kicker: "Inquiry",
      body: [
        `What problem, pattern, or mystery makes ${subject} worth understanding?`,
        "Begin with a specific example before naming the general rule.",
        "Ask the audience to make a prediction before the explanation.",
      ],
      visualTitle: "Prompt visual",
      visualLines: [`Search terms: ${subject} example diagram`, "Use one strong image instead of a wall of text."],
      footer: "Question before instruction",
    });
  }

  slides.push(
    {
      title: "What to remember",
      kicker: "Synthesis",
      body: [
        `The strongest takeaway from ${subject} should be specific enough to use later.`,
        "Connect the evidence to the main claim, not just the topic label.",
        "Name the misconception a learner is most likely to carry away.",
      ],
      visualTitle: "Summary visual",
      visualLines: ["Before/after chart, cause-and-effect chain, or concept map."],
      footer: `${subject} · synthesis`,
      tone: "review",
    },
    {
      title: "Discussion checkpoint",
      kicker: "Review",
      body: [
        "What evidence would change your mind?",
        "Which example best proves the main claim?",
        "Where does the explanation stop working?",
      ],
      visualTitle: "Audience action",
      visualLines: ["Use a poll, quick-write prompt, or comparison table."],
      footer: "End with a question the audience can answer out loud.",
      tone: "review",
    },
  );

  return slides.slice(0, 12);
}

function slideTextRun(text: string, options: { size: number; color?: string; bold?: boolean }) {
  const color = options.color ?? "1F2937";
  const bold = options.bold ? ' b="1"' : "";
  return `<a:r><a:rPr lang="en-US" sz="${options.size * 100}"${bold}><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:rPr><a:t>${escapeHtml(text)}</a:t></a:r>`;
}

function slideParagraph(text: string, options: { size: number; color?: string; bold?: boolean; bullet?: boolean }) {
  const paragraphProperties = options.bullet
    ? `<a:pPr marL="274320" indent="-182880"><a:buChar char="•"/></a:pPr>`
    : "";

  return `<a:p>${paragraphProperties}${slideTextRun(text, options)}<a:endParaRPr lang="en-US" sz="${options.size * 100}"/></a:p>`;
}

function slideTextBox(input: {
  id: number;
  name: string;
  x: number;
  y: number;
  cx: number;
  cy: number;
  paragraphs: string[];
  size: number;
  color?: string;
  bold?: boolean;
  bullet?: boolean;
  anchor?: "t" | "mid" | "b";
}) {
  const paragraphs = input.paragraphs.length ? input.paragraphs : [""];
  return `<p:sp><p:nvSpPr><p:cNvPr id="${input.id}" name="${escapeHtml(input.name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${input.x}" y="${input.y}"/><a:ext cx="${input.cx}" cy="${input.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square" anchor="${input.anchor ?? "t"}"><a:spAutoFit/></a:bodyPr><a:lstStyle/>${paragraphs.map((paragraph) => slideParagraph(paragraph, { size: input.size, color: input.color, bold: input.bold, bullet: input.bullet })).join("")}</p:txBody></p:sp>`;
}

function slideShape(input: {
  id: number;
  name: string;
  x: number;
  y: number;
  cx: number;
  cy: number;
  fill: string;
  line?: string;
  radius?: "rect" | "roundRect";
}) {
  const line = input.line
    ? `<a:ln w="9525"><a:solidFill><a:srgbClr val="${input.line}"/></a:solidFill></a:ln>`
    : `<a:ln><a:noFill/></a:ln>`;

  return `<p:sp><p:nvSpPr><p:cNvPr id="${input.id}" name="${escapeHtml(input.name)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${input.x}" y="${input.y}"/><a:ext cx="${input.cx}" cy="${input.cy}"/></a:xfrm><a:prstGeom prst="${input.radius ?? "rect"}"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${input.fill}"/></a:solidFill>${line}</p:spPr></p:sp>`;
}

function slideBackground(color = "F7FBFF") {
  return `<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`;
}

function slideXml(slide: PresentationSlide, index: number, total: number) {
  const isCover = slide.tone === "cover";
  const isReview = slide.tone === "review";
  const bodyLines = slide.body.map((item) => truncateText(item, 132)).slice(0, 5);
  const visualLines = slide.visualLines.map((item) => truncateText(item, 90)).slice(0, 4);
  const background = isCover ? "EAF4FF" : isReview ? "F8FBFF" : "FFFFFF";
  const panelFill = isReview ? "EEF6FF" : "F4F8FC";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld>${slideBackground(background)}<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${slideShape({ id: 2, name: "Accent rail", x: 0, y: 0, cx: 190000, cy: 6858000, fill: "2563EB" })}${slideShape({ id: 3, name: "Visual panel", x: 7600000, y: 540000, cx: 3800000, cy: 5200000, fill: panelFill, line: "C9D8E8", radius: "roundRect" })}${slideShape({ id: 4, name: "Visual accent", x: 7960000, y: 1040000, cx: 1200000, cy: 1200000, fill: isCover ? "102A43" : "2563EB", radius: "roundRect" })}${slideTextBox({ id: 5, name: "Kicker", x: 700000, y: 520000, cx: 6200000, cy: 320000, paragraphs: [truncateText(slide.kicker.toUpperCase(), 54)], size: 11, color: "486581", bold: true })}${slideTextBox({ id: 6, name: "Title", x: 680000, y: 920000, cx: 6400000, cy: 1550000, paragraphs: [truncateText(slide.title, isCover ? 64 : 76)], size: isCover ? 42 : 34, color: "102A43", bold: true })}${slideTextBox({ id: 7, name: "Body", x: 760000, y: isCover ? 2850000 : 2650000, cx: 6100000, cy: 2850000, paragraphs: bodyLines, size: isCover ? 21 : 18, color: "243B53", bullet: !isCover })}${slideTextBox({ id: 8, name: "Visual title", x: 8040000, y: 2550000, cx: 3000000, cy: 420000, paragraphs: [truncateText(slide.visualTitle, 48)], size: 17, color: "102A43", bold: true })}${slideTextBox({ id: 9, name: "Visual lines", x: 8040000, y: 3120000, cx: 3000000, cy: 1700000, paragraphs: visualLines, size: 13, color: "486581" })}${slideTextBox({ id: 10, name: "Footer", x: 700000, y: 6200000, cx: 6800000, cy: 280000, paragraphs: [truncateText(slide.footer, 110)], size: 10, color: "829AB1" })}${slideTextBox({ id: 11, name: "Slide number", x: 10400000, y: 6200000, cx: 720000, cy: 280000, paragraphs: [`${index + 1}/${total}`], size: 10, color: "829AB1", anchor: "mid" })}</p:spTree></p:cSld><p:transition spd="med"><p:fade/></p:transition><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

function presentationXml(slideCount: number) {
  const slideIds = Array.from({ length: slideCount }, (_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slideIds}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="wide"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr></p:defaultTextStyle></p:presentation>`;
}

function presentationRels(slideCount: number) {
  const slideRels = Array.from(
    { length: slideCount },
    (_, index) => `<Relationship Id="rId${index + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>${slideRels}</Relationships>`;
}

function contentTypesXml(slideCount: number) {
  const slideOverrides = Array.from(
    { length: slideCount },
    (_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slideOverrides}</Types>`;
}

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;

const appPropsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Tuto</Application><PresentationFormat>On-screen Show (16:9)</PresentationFormat></Properties>`;

function corePropsXml(title: string) {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${escapeHtml(title)}</dc:title><dc:creator>Tuto</dc:creator><cp:lastModifiedBy>Tuto</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;
}

const slideMasterXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`;

const slideMasterRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`;

const slideLayoutXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;

const slideLayoutRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`;

const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Tuto"><a:themeElements><a:clrScheme name="Tuto"><a:dk1><a:srgbClr val="102A43"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="243B53"/></a:dk2><a:lt2><a:srgbClr val="FBFFFD"/></a:lt2><a:accent1><a:srgbClr val="102A43"/></a:accent1><a:accent2><a:srgbClr val="486581"/></a:accent2><a:accent3><a:srgbClr val="EEF6FF"/></a:accent3><a:accent4><a:srgbClr val="829AB1"/></a:accent4><a:accent5><a:srgbClr val="243B53"/></a:accent5><a:accent6><a:srgbClr val="2563EB"/></a:accent6><a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="486581"/></a:folHlink></a:clrScheme><a:fontScheme name="Tuto"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="Tuto"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;

function slideRelXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`;
}

const crcTable = new Uint32Array(256).map((_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function makeHeader(size: number) {
  return new Uint8Array(size);
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true);
}

function buildZip(files: Array<{ path: string; data: string }>) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const dataBytes = encoder.encode(file.data);
    const checksum = crc32(dataBytes);
    const local = makeHeader(30);
    const localView = new DataView(local.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, 0);
    writeUint16(localView, 12, 0);
    writeUint32(localView, 14, checksum);
    writeUint32(localView, 18, dataBytes.length);
    writeUint32(localView, 22, dataBytes.length);
    writeUint16(localView, 26, nameBytes.length);
    writeUint16(localView, 28, 0);
    localParts.push(local, nameBytes, dataBytes);

    const central = makeHeader(46);
    const centralView = new DataView(central.buffer);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, 0);
    writeUint16(centralView, 14, 0);
    writeUint32(centralView, 16, checksum);
    writeUint32(centralView, 20, dataBytes.length);
    writeUint32(centralView, 24, dataBytes.length);
    writeUint16(centralView, 28, nameBytes.length);
    writeUint16(centralView, 30, 0);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint32(centralView, 38, 0);
    writeUint32(centralView, 42, offset);
    centralParts.push(central, nameBytes);

    offset += local.length + nameBytes.length + dataBytes.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const end = makeHeader(22);
  const endView = new DataView(end.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, files.length);
  writeUint16(endView, 10, files.length);
  writeUint32(endView, 12, centralDirectory.length);
  writeUint32(endView, 16, offset);
  writeUint16(endView, 20, 0);

  const zip = concatBytes([...localParts, centralDirectory, end]);
  return zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength);
}

export function buildCourseArtifactPptx(course: CourseArtifactExportInput) {
  const slideModels = buildPresentationSlides(course);
  const slides = slideModels.map((slide, index) => slideXml(slide, index, slideModels.length));
  const files: Array<{ path: string; data: string }> = [
    { path: "[Content_Types].xml", data: contentTypesXml(slides.length) },
    { path: "_rels/.rels", data: rootRelsXml },
    { path: "docProps/app.xml", data: appPropsXml },
    { path: "docProps/core.xml", data: corePropsXml(course.title) },
    { path: "ppt/presentation.xml", data: presentationXml(slides.length) },
    { path: "ppt/_rels/presentation.xml.rels", data: presentationRels(slides.length) },
    { path: "ppt/slideMasters/slideMaster1.xml", data: slideMasterXml },
    { path: "ppt/slideMasters/_rels/slideMaster1.xml.rels", data: slideMasterRelsXml },
    { path: "ppt/slideLayouts/slideLayout1.xml", data: slideLayoutXml },
    { path: "ppt/slideLayouts/_rels/slideLayout1.xml.rels", data: slideLayoutRelsXml },
    { path: "ppt/theme/theme1.xml", data: themeXml },
    ...slides.flatMap((slide, index) => [
      { path: `ppt/slides/slide${index + 1}.xml`, data: slide },
      { path: `ppt/slides/_rels/slide${index + 1}.xml.rels`, data: slideRelXml() },
    ]),
  ];

  return buildZip(files);
}

function wordRun(text: string, options: { bold?: boolean; size?: number } = {}) {
  const bold = options.bold ? "<w:b/>" : "";
  const size = options.size ? `<w:sz w:val="${options.size * 2}"/>` : "";
  return `<w:r><w:rPr>${bold}${size}</w:rPr><w:t xml:space="preserve">${escapeHtml(text)}</w:t></w:r>`;
}

function wordParagraph(
  text: string,
  options: { style?: "Title" | "Heading1" | "Heading2"; bold?: boolean; size?: number } = {},
) {
  const style = options.style ? `<w:pPr><w:pStyle w:val="${options.style}"/></w:pPr>` : "";
  return `<w:p>${style}${wordRun(text, { bold: options.bold, size: options.size })}</w:p>`;
}

function wordDocumentXml(course: CourseArtifactExportInput) {
  const option = getCourseArtifactOption(course.artifactKind);
  const points = getKnowledgePoints(course);
  const body = [
    wordParagraph(course.title, { style: "Title" }),
    wordParagraph(`${option.title} - ${course.subject} - ${course.difficulty}`),
    wordParagraph(course.description),
    wordParagraph("Outline", { style: "Heading1" }),
    ...(points.length
      ? points.map((point, index) =>
          wordParagraph(`${index + 1}. ${line(point.knowledge_title) || `Section ${index + 1}`}: ${sectionSummary(point)}`),
        )
      : [wordParagraph("No generated sections yet.")]),
    wordParagraph("Details", { style: "Heading1" }),
    ...(points.length
      ? points.flatMap((point, index) => {
          const title = line(point.knowledge_title) || `Section ${index + 1}`;
          const details = [
            wordParagraph(`${index + 1}. ${title}`, { style: "Heading2" }),
            wordParagraph(sectionSummary(point)),
          ];

          if (option.kind === "study-guide") {
            details.push(
              wordParagraph("Key idea: write the core definition in your own words."),
              wordParagraph("Example: connect this section to one concrete problem."),
              wordParagraph("Check yourself: explain why this section matters."),
            );
          } else if (option.kind === "quiz-set") {
            details.push(
              wordParagraph("Practice prompt: answer a question that tests this idea."),
              wordParagraph("Answer focus: include the mechanism, not only the final result."),
              wordParagraph("Review note: revisit this if the explanation feels memorized."),
            );
          } else if (option.kind === "cheat-sheet") {
            details.push(
              wordParagraph("Remember: capture the shortest useful version of the rule."),
              wordParagraph("Fast check: apply it to a tiny example before using it in a larger problem."),
              wordParagraph("Trap: note the condition where this shortcut stops working."),
            );
          } else if (option.kind === "lesson-plan") {
            details.push(
              wordParagraph("Teach: introduce the idea with a simple example."),
              wordParagraph("Practice: ask the learner to apply it in a new case."),
              wordParagraph("Check: use a short exit prompt before moving on."),
            );
          }

          return details;
        })
      : [wordParagraph("This artifact has not generated detailed sections yet.")]),
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}

const wordStylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:rPr><w:sz w:val="22"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="56"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style></w:styles>`;

const wordContentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;

const wordRootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;

const wordDocumentRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

const wordAppPropsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Tuto</Application></Properties>`;

export function buildCourseArtifactDocx(course: CourseArtifactExportInput) {
  return buildZip([
    { path: "[Content_Types].xml", data: wordContentTypesXml },
    { path: "_rels/.rels", data: wordRootRelsXml },
    { path: "docProps/app.xml", data: wordAppPropsXml },
    { path: "docProps/core.xml", data: corePropsXml(course.title) },
    { path: "word/document.xml", data: wordDocumentXml(course) },
    { path: "word/_rels/document.xml.rels", data: wordDocumentRelsXml },
    { path: "word/styles.xml", data: wordStylesXml },
  ]);
}

export function buildCourseArtifactHtml(course: CourseArtifactExportInput) {
  const option = getCourseArtifactOption(course.artifactKind);
  const points = getKnowledgePoints(course);
  const sections = points.length
    ? points
        .map((point, index) => {
          const title = line(point.knowledge_title) || `Section ${index + 1}`;
          return `<section><h2>${index + 1}. ${escapeHtml(title)}</h2><p>${escapeHtml(sectionSummary(point))}</p></section>`;
        })
        .join("\n")
    : "<section><h2>No generated sections yet</h2><p>This artifact has not generated detailed sections yet.</p></section>";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(course.title)}</title>
<style>
body{font-family:Inter,Arial,sans-serif;margin:0;background:#f8f7f2;color:#222}
main{max-width:840px;margin:0 auto;padding:48px 24px}
h1{font-size:44px;line-height:1.05;margin:0 0 16px}
h2{font-size:24px;margin:32px 0 8px}
p,li{font-size:16px;line-height:1.7}
.meta{color:#666;margin-bottom:32px}
section{border-top:1px solid #ddd;padding-top:8px}
@media print{body{background:#fff}main{padding:24px}}
</style>
</head>
<body>
<main>
<h1>${escapeHtml(course.title)}</h1>
<p class="meta">${escapeHtml(option.title)} - ${escapeHtml(course.subject)} - ${escapeHtml(course.difficulty)}</p>
<p>${escapeHtml(course.description)}</p>
${sections}
</main>
</body>
</html>`;
}

export function buildCourseArtifactExport(
  course: CourseArtifactExportInput,
  format: CourseArtifactExportFormat,
): CourseArtifactExport {
  const safeTitle = fileSafe(course.title);

  if (format === "html") {
    return {
      body: buildCourseArtifactHtml(course),
      contentType: "text/html; charset=utf-8",
      fileName: `${safeTitle}.html`,
    };
  }

  if (format === "slides") {
    return {
      body: buildCourseArtifactSlidesMarkdown(course),
      contentType: "text/markdown; charset=utf-8",
      fileName: `${safeTitle}-slides.md`,
    };
  }

  if (format === "pptx") {
    return {
      body: buildCourseArtifactPptx(course),
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      fileName: `${safeTitle}-google-slides.pptx`,
    };
  }

  if (format === "docx") {
    return {
      body: buildCourseArtifactDocx(course),
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileName: `${safeTitle}-google-docs.docx`,
    };
  }

  return {
    body: buildCourseArtifactMarkdown(course),
    contentType: "text/markdown; charset=utf-8",
    fileName: `${safeTitle}.md`,
  };
}
