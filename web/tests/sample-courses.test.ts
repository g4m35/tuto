import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSampleCoursePrompt,
  getSampleCourseById,
  getSampleCourseStats,
  sampleCourses,
} from "../lib/sample-courses";

test("sample course catalog has broad subject coverage and no duplicate ids", () => {
  const ids = new Set(sampleCourses.map((course) => course.id));
  const subjects = new Set(sampleCourses.map((course) => course.subject));

  assert.equal(sampleCourses.length, 6);
  assert.equal(ids.size, sampleCourses.length);
  assert.ok(subjects.has("Economics"));
  assert.ok(subjects.has("Science"));
  assert.ok(subjects.has("Philosophy"));
  assert.ok(subjects.has("English"));
  assert.ok(subjects.has("Data"));
});

test("sample courses meet the depth bar for public examples", () => {
  for (const course of sampleCourses) {
    const stats = getSampleCourseStats(course);

    assert.ok(course.title.length >= 24, `${course.id} needs a specific title`);
    assert.ok(course.description.length >= 120, `${course.id} needs a substantial description`);
    assert.ok(course.whyItWorks.length >= 100, `${course.id} needs product-demo rationale`);
    assert.ok(course.capstone.length >= 120, `${course.id} needs an applied capstone`);
    assert.ok(stats.moduleCount >= 8, `${course.id} needs at least 8 modules`);
    assert.ok(stats.lessonCount >= 24, `${course.id} needs at least 24 lessons`);
    assert.ok(stats.sourceCount >= 3, `${course.id} needs at least 3 source anchors`);

    for (const courseModule of course.modules) {
      assert.ok(courseModule.summary.length >= 90, `${course.id}/${courseModule.id} needs a useful summary`);
      assert.equal(courseModule.lessons.length, 3, `${course.id}/${courseModule.id} should have 3 lessons`);
      assert.ok(courseModule.project.length >= 60, `${course.id}/${courseModule.id} needs a project checkpoint`);
    }

    for (const source of course.sources) {
      assert.doesNotThrow(() => new URL(source.url), `${course.id} has an invalid source URL`);
    }
  }
});

test("sample course prompt includes the reusable generation context", () => {
  const course = getSampleCourseById("climate-systems-lab");

  assert.ok(course);

  const prompt = buildSampleCoursePrompt(course);

  assert.match(prompt, /Create an in-depth intermediate course/);
  assert.match(prompt, /Build the course around this module arc/);
  assert.match(prompt, /Capstone:/);
  assert.match(prompt, /MIT Climate Science, Risk and Solutions primer/);
  assert.match(prompt, /Energy Balance/);
});
