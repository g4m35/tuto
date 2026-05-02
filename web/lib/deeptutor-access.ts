export type DeepTutorWsPathAccess = 'user' | 'operator' | 'forbidden'

const OPERATOR_HTTP_PREFIXES = [
  '/api/v1/settings',
  '/api/v1/plugins',
  '/api/v1/tutorbot',
  '/api/v1/system',
  '/api/v1/agent-config',
]

const USER_WS_PATHS = new Set(['/api/v1/ws', '/api/v1/chat', '/api/v1/book/ws'])

function isPrefixMatch(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`)
}

function stripQueryAndFragment(path: string) {
  return path.split(/[?#]/, 1)[0] || '/'
}

export function normalizeDeepTutorPath(path: string | readonly string[]) {
  const rawPath = typeof path === 'string' ? path : path.join('/')
  const absolutePath = stripQueryAndFragment(rawPath.trim())
  const prefixedPath = `/${absolutePath.replace(/^\/+/, '')}`
  return new URL(prefixedPath, 'http://deeptutor.local').pathname || '/'
}

export function isOperatorOnlyDeepTutorHttpPath(path: string | readonly string[]) {
  const normalizedPath = normalizeDeepTutorPath(path)
  return OPERATOR_HTTP_PREFIXES.some((prefix) => isPrefixMatch(normalizedPath, prefix))
}

function isUserKnowledgeProgressWsPath(path: string) {
  return /^\/api\/v1\/knowledge\/[^/]+\/progress\/ws$/.test(path)
}

function isOperatorTutorBotWsPath(path: string) {
  return path.startsWith('/api/v1/tutorbot/') && path.endsWith('/ws')
}

export function getDeepTutorWsPathAccess(path: string) {
  if (!path.startsWith('/')) {
    return 'forbidden' satisfies DeepTutorWsPathAccess
  }

  const normalizedPath = normalizeDeepTutorPath(path)
  if (USER_WS_PATHS.has(normalizedPath) || isUserKnowledgeProgressWsPath(normalizedPath)) {
    return 'user' satisfies DeepTutorWsPathAccess
  }

  if (isOperatorTutorBotWsPath(normalizedPath)) {
    return 'operator' satisfies DeepTutorWsPathAccess
  }

  return 'forbidden' satisfies DeepTutorWsPathAccess
}
