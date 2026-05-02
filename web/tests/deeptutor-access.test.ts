import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getDeepTutorWsPathAccess,
  isOperatorOnlyDeepTutorHttpPath,
  normalizeDeepTutorPath,
} from '../lib/deeptutor-access'

test('DeepTutor HTTP access policy reserves management routes for operators', () => {
  assert.equal(normalizeDeepTutorPath(['api', 'v1', 'plugins', 'tools']), '/api/v1/plugins/tools')
  assert.equal(normalizeDeepTutorPath('//api/v1/plugins/tools'), '/api/v1/plugins/tools')
  assert.equal(isOperatorOnlyDeepTutorHttpPath('/api/v1/settings'), true)
  assert.equal(isOperatorOnlyDeepTutorHttpPath('//api/v1/plugins/tools/run'), true)
  assert.equal(isOperatorOnlyDeepTutorHttpPath('/api/v1/plugins/tools/run'), true)
  assert.equal(isOperatorOnlyDeepTutorHttpPath('/api/v1/tutorbot/bots'), true)
  assert.equal(isOperatorOnlyDeepTutorHttpPath('/api/v1/system/status'), true)
  assert.equal(isOperatorOnlyDeepTutorHttpPath('/api/v1/agent-config'), true)
  assert.equal(isOperatorOnlyDeepTutorHttpPath('/api/v1/knowledge/list'), false)
})

test('DeepTutor WebSocket access policy only signs known backend paths', () => {
  assert.equal(getDeepTutorWsPathAccess('/api/v1/ws'), 'user')
  assert.equal(getDeepTutorWsPathAccess('/api/v1/chat'), 'user')
  assert.equal(getDeepTutorWsPathAccess('/api/v1/book/ws'), 'user')
  assert.equal(getDeepTutorWsPathAccess('/api/v1/knowledge/algebra/progress/ws?task_id=task_1'), 'user')
  assert.equal(getDeepTutorWsPathAccess('/api/v1/tutorbot/math/ws'), 'operator')
  assert.equal(getDeepTutorWsPathAccess('/api/v1/tutorbot/math/runs/latest/ws'), 'operator')
  assert.equal(getDeepTutorWsPathAccess('/api/v1/plugins/ws'), 'forbidden')
  assert.equal(getDeepTutorWsPathAccess('api/v1/ws'), 'forbidden')
})
