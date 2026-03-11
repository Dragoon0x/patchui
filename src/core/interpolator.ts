// ═══════════════════════════════════════════
// PATCH — Scene Interpolator
// ═══════════════════════════════════════════

import type { SceneValues, ResolvedValue } from '../types'

/** Lerp a number */
function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Lerp a hex color */
function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    hex = hex.replace('#', '')
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    }
  }

  const ca = parse(a)
  const cb = parse(b)

  const r = Math.round(Math.max(0, Math.min(255, lerpNum(ca.r, cb.r, t))))
  const g = Math.round(Math.max(0, Math.min(255, lerpNum(ca.g, cb.g, t))))
  const bl = Math.round(Math.max(0, Math.min(255, lerpNum(ca.b, cb.b, t))))

  return '#' + [r, g, bl].map(c => c.toString(16).padStart(2, '0')).join('')
}

/** Check if a string looks like a hex color */
function isHexColor(s: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s)
}

/**
 * Interpolate between two scene value sets.
 *
 * - Numbers lerp linearly
 * - Hex colors lerp per-channel
 * - Booleans snap at t=0.5
 * - Strings snap at t=0.5
 */
export function interpolateScenes(
  from: SceneValues,
  to: SceneValues,
  t: number,
): SceneValues {
  const result: SceneValues = {}

  const allKeys = new Set([...Object.keys(from), ...Object.keys(to)])

  for (const key of allKeys) {
    const a = from[key]
    const b = to[key]

    // If only one side has the value, use it
    if (a === undefined) { result[key] = b; continue }
    if (b === undefined) { result[key] = a; continue }

    // Number interpolation
    if (typeof a === 'number' && typeof b === 'number') {
      result[key] = lerpNum(a, b, t)
      continue
    }

    // Color interpolation
    if (typeof a === 'string' && typeof b === 'string' && isHexColor(a) && isHexColor(b)) {
      result[key] = lerpColor(a, b, t)
      continue
    }

    // Boolean/string snap at midpoint
    result[key] = t < 0.5 ? a : b
  }

  return result
}

/**
 * Apply a scene snapshot to current values.
 * Only overwrites keys present in the scene.
 */
export function applyScene(
  current: Record<string, ResolvedValue>,
  scene: SceneValues,
): Record<string, ResolvedValue> {
  const result = { ...current }
  for (const [key, val] of Object.entries(scene)) {
    if (key in result) {
      result[key] = val as ResolvedValue
    }
  }
  return result
}
