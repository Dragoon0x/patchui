// ═══════════════════════════════════════════
// PATCH — Parameter Linking
// ═══════════════════════════════════════════

import type { LinkConfig } from '../types'

/**
 * Create a linked parameter that follows another parameter's value.
 *
 * @param source - Dot path to the source parameter (e.g. 'shadow.offsetY')
 * @param transform - Function that maps source value to this parameter's value
 * @returns LinkConfig that usePatch interprets as a linked knob
 *
 * @example
 * ```ts
 * const p = usePatch('Card', {
 *   elevation: [2, 0, 5],
 *   shadowY: link('elevation', e => e * 4),
 *   shadowBlur: link('elevation', e => e * 8),
 * })
 * ```
 */
export function link(source: string, transform: (value: number) => number): LinkConfig {
  return {
    __patch_link: true,
    source,
    transform,
  }
}

/** Type guard for LinkConfig */
export function isLink(value: unknown): value is LinkConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__patch_link' in value &&
    (value as LinkConfig).__patch_link === true
  )
}
