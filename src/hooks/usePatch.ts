// ═══════════════════════════════════════════
// PATCH — usePatch Hook
// ═══════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { PatchConfig, PatchOptions, ResolvedValue, ModuleDescriptor } from '../types'
import { parseConfig, extractDefaults } from '../core/parser'
import { registerModule, updateModule } from '../core/registry'
import { isLink } from '../core/link'

/**
 * Register a parameter module and get live reactive values.
 *
 * @param name - Display name for the module in the panel
 * @param config - Parameter definitions
 * @param options - Scenes, morph duration, callbacks
 * @returns A proxy-like object with live parameter values
 *
 * @example
 * ```tsx
 * const p = usePatch('Card', {
 *   blur: [24, 0, 100],
 *   opacity: [0.8, 0, 1],
 *   color: '#ff5500',
 *   visible: true,
 * })
 *
 * return <div style={{ filter: `blur(${p.blur}px)`, opacity: p.opacity }} />
 * ```
 */
export function usePatch<T extends PatchConfig>(
  name: string,
  config: T,
  options?: PatchOptions,
) {
  // Stable refs for config and options (don't re-parse on every render)
  const configRef = useRef(config)
  const optionsRef = useRef(options)

  // Extract initial defaults once
  const initialValues = useMemo(() => extractDefaults(config), [])

  // State holds all flat param values keyed by dot-path
  const [values, setValues] = useState<Record<string, ResolvedValue>>(initialValues)
  const valuesRef = useRef(values)
  valuesRef.current = values

  // Generate stable module ID from name
  const moduleId = useMemo(() => name.replace(/\s+/g, '_').toLowerCase(), [name])

  // Resolve linked values whenever source values change
  const resolveLinks = useCallback((vals: Record<string, ResolvedValue>): Record<string, ResolvedValue> => {
    const resolved = { ...vals }
    const cfg = configRef.current

    function walkConfig(obj: PatchConfig, prefix: string) {
      for (const [key, value] of Object.entries(obj)) {
        if (key === '_collapsed') continue
        const path = prefix ? `${prefix}.${key}` : key

        if (isLink(value)) {
          const sourcePath = prefix ? `${prefix}.${value.source}` : value.source
          // Also check without prefix for top-level references
          const sourceVal = resolved[sourcePath] ?? resolved[value.source]
          if (typeof sourceVal === 'number') {
            resolved[path] = value.transform(sourceVal)
          }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value) && !('type' in value) && !('__patch_link' in value)) {
          walkConfig(value as PatchConfig, path)
        }
      }
    }

    walkConfig(cfg, '')
    return resolved
  }, [])

  // Callback for panel to set individual param values
  const setParam = useCallback((path: string, value: ResolvedValue) => {
    setValues(prev => {
      const next = { ...prev, [path]: value }
      return resolveLinks(next)
    })
  }, [resolveLinks])

  // Build descriptor from current values
  const buildDescriptor = useCallback((): ModuleDescriptor => {
    const descriptor = parseConfig(name, configRef.current)
    // Inject current values into the descriptor
    function injectValues(mod: ModuleDescriptor) {
      for (const param of mod.params) {
        const val = valuesRef.current[param.path]
        if (val !== undefined) {
          param.value = val
        }
      }
      for (const sub of mod.submodules) {
        injectValues(sub)
      }
    }
    injectValues(descriptor)
    descriptor.collapsed = options?.collapsed ?? false
    return descriptor
  }, [name, options?.collapsed])

  // Register with global registry on mount
  useEffect(() => {
    const descriptor = buildDescriptor()
    const unregister = registerModule(
      moduleId,
      descriptor,
      setParam,
      optionsRef.current?.scenes,
      optionsRef.current?.morphDuration,
      optionsRef.current?.onAction,
    )

    return unregister
  }, [moduleId, buildDescriptor, setParam])

  // Update registry whenever values change
  useEffect(() => {
    const descriptor = buildDescriptor()
    updateModule(moduleId, descriptor)
  }, [values, moduleId, buildDescriptor])

  // Build the return object — nested structure matching config shape
  const result = useMemo(() => {
    const resolved = resolveLinks(values)

    function buildResult(cfg: PatchConfig, prefix: string): Record<string, unknown> {
      const obj: Record<string, unknown> = {}

      for (const [key, configValue] of Object.entries(cfg)) {
        if (key === '_collapsed') continue
        const path = prefix ? `${prefix}.${key}` : key

        if (typeof configValue === 'object' && configValue !== null && !Array.isArray(configValue) && !isLink(configValue) && !('type' in configValue)) {
          obj[key] = buildResult(configValue as PatchConfig, path)
        } else {
          obj[key] = resolved[path] ?? initialValues[path]
        }
      }

      return obj
    }

    return buildResult(configRef.current, '') as any
  }, [values, resolveLinks, initialValues])

  return result
}
