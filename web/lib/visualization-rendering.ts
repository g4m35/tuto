import type { ChartConfiguration } from 'chart.js'

export function stripCodeFence(value: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/^```(?:json|javascript|js)?\s*([\s\S]*?)\s*```$/i)
  return match ? match[1].trim() : trimmed
}

export function parseChartConfig(config: string): ChartConfiguration {
  return JSON.parse(stripCodeFence(config)) as ChartConfiguration
}

const URL_ATTRIBUTES = new Set(['href', 'src', 'xlink:href'])
const ALLOWED_SVG_ELEMENTS = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'rect',
  'text',
  'tspan',
  'defs',
  'lineargradient',
  'radialgradient',
  'stop',
  'clippath',
  'mask',
  'pattern',
  'marker',
  'title',
  'desc',
])
const ALLOWED_SVG_ATTRIBUTES = new Set([
  'aria-label',
  'class',
  'clip-path',
  'cx',
  'cy',
  'd',
  'dx',
  'dy',
  'fill',
  'fill-opacity',
  'font-family',
  'font-size',
  'font-weight',
  'height',
  'id',
  'marker-end',
  'marker-mid',
  'marker-start',
  'opacity',
  'points',
  'preserveaspectratio',
  'r',
  'rx',
  'ry',
  'stroke',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-opacity',
  'stroke-width',
  'text-anchor',
  'transform',
  'viewbox',
  'width',
  'x',
  'x1',
  'x2',
  'xlink:href',
  'xmlns',
  'xmlns:xlink',
  'y',
  'y1',
  'y2',
])

function normalizeUrlAttribute(value: string) {
  return value.replace(/[\u0000-\u001f\u007f\s]+/g, '').toLowerCase()
}

function getUrlScheme(value: string) {
  return /^([a-z][a-z0-9+.-]*):/.exec(value)?.[1] ?? null
}

function isSafeSvgUrlAttribute(name: string, value: string) {
  if (!URL_ATTRIBUTES.has(name)) {
    return true
  }

  const normalized = normalizeUrlAttribute(value)
  if (!normalized) {
    return true
  }

  if (normalized[0] === '#') {
    return true
  }

  const scheme = getUrlScheme(normalized)
  return scheme === null || scheme === 'http' || scheme === 'https' || (
    scheme === 'data' && normalized.slice(5, 11) === 'image/'
  )
}

export function sanitizeSvg(svg: string): { svg: string; error: string | null } {
  const trimmed = stripCodeFence(svg)

  if (!trimmed.startsWith('<svg')) {
    return { svg: '', error: 'Invalid SVG: does not start with <svg' }
  }

  const doc = new DOMParser().parseFromString(trimmed, 'image/svg+xml')
  if (doc.querySelector('parsererror')) {
    return { svg: '', error: 'Invalid SVG markup' }
  }

  const root = doc.documentElement
  if (root.tagName.toLowerCase() !== 'svg') {
    return { svg: '', error: 'Invalid SVG root element' }
  }

  root.querySelectorAll('*').forEach(node => {
    if (!ALLOWED_SVG_ELEMENTS.has(node.tagName.toLowerCase())) {
      node.remove()
      return
    }

    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim()
      const normalizedValue = normalizeUrlAttribute(value)
      const scheme = getUrlScheme(normalizedValue)
      if (
        !ALLOWED_SVG_ATTRIBUTES.has(name) ||
        name.startsWith('on') ||
        name === 'style' ||
        scheme === 'javascript' ||
        scheme === 'vbscript' ||
        (scheme === 'data' && normalizedValue.slice(5, 14) === 'text/html') ||
        !isSafeSvgUrlAttribute(name, value)
      ) {
        node.removeAttribute(attr.name)
      }
    }
  })

  return { svg: new XMLSerializer().serializeToString(root), error: null }
}
