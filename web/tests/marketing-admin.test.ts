import test from "node:test";
import assert from "node:assert/strict";
import { formatCsvCell } from "../lib/csv";

test("formatCsvCell escapes quotes and wraps values", () => {
  assert.equal(formatCsvCell('Learner "One"'), '"Learner ""One"""');
  assert.equal(formatCsvCell("plain"), '"plain"');
  assert.equal(formatCsvCell(null), '""');
  assert.equal(formatCsvCell(true), '"true"');
});
