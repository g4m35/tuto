import type { ChartConfiguration } from 'chart.js'

export function stripCodeFence(value: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/^```(?:json|javascript|js)?\s*([\s\S]*?)\s*```$/i)
  return match ? match[1].trim() : trimmed
}

export function parseChartConfig(config: string): ChartConfiguration {
  return JSON.parse(stripCodeFence(config)) as ChartConfiguration
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

  root.querySelectorAll('script, foreignObject, iframe, object, embed').forEach(node => {
    node.remove()
  })

  root.querySelectorAll('*').forEach(node => {
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim().toLowerCase()
      if (
        name.startsWith('on') ||
        value.startsWith('javascript:') ||
        value.startsWith('data:text/html')
      ) {
        node.removeAttribute(attr.name)
      }
    }
  })

  return { svg: new XMLSerializer().serializeToString(root), error: null }
}
