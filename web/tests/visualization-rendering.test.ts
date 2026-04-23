import test from 'node:test'
import assert from 'node:assert/strict'
import { parseChartConfig, stripCodeFence } from '../lib/visualization-rendering'

test('stripCodeFence accepts json and legacy javascript fences', () => {
  assert.equal(stripCodeFence('```json\n{"type":"bar"}\n```'), '{"type":"bar"}')
  assert.equal(stripCodeFence('```javascript\n{"type":"line"}\n```'), '{"type":"line"}')
})

test('parseChartConfig accepts strict JSON Chart.js config', () => {
  const config = parseChartConfig(
    '```json\n' +
      '{\n' +
      '  "type": "bar",\n' +
      '  "data": {\n' +
      '    "labels": ["A", "B"],\n' +
      '    "datasets": [{ "label": "Score", "data": [1, 2] }]\n' +
      '  },\n' +
      '  "options": { "responsive": true }\n' +
      '}\n' +
      '```'
  )

  assert.equal(config.type, 'bar')
})

test('parseChartConfig rejects executable object literals', () => {
  assert.throws(
    () =>
      parseChartConfig(
        '```javascript\n' +
          '{\n' +
          '  type: "bar",\n' +
          '  options: {\n' +
          '    plugins: {\n' +
          '      tooltip: {\n' +
          '        callbacks: { label: () => document.cookie }\n' +
          '      }\n' +
          '    }\n' +
          '  }\n' +
          '}\n' +
          '```'
      ),
    SyntaxError
  )
})
