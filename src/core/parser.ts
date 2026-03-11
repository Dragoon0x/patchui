// ═══════════════════════════════════════════
// PATCH — Config Parser
// ═══════════════════════════════════════════
//
// Takes the raw config object users pass to usePatch()
// and resolves it into typed ParamDescriptors the panel can render.

import type {
  PatchConfig,
  ParamConfig,
  ParamDescriptor,
  ModuleDescriptor,
  ControlType,
  RangeConfig,
  SpringConfig,
  SelectConfig,
  ActionConfig,
  ColorConfig,
  TextConfig,
  ResolvedValue,
} from '../types'
import { isLink } from './link'

/** Check if a string looks like a hex color */
function isHexColor(s: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)
}

/** Check if value is a range tuple */
function isRange(v: unknown): v is RangeConfig {
  return Array.isArray(v) && (v.length === 3 || v.length === 4) && v.every(n => typeof n === 'number')
}

/** Check if value is a spring config */
function isSpring(v: unknown): v is SpringConfig {
  return typeof v === 'object' && v !== null && 'type' in v && (v as { type: string }).type === 'spring'
}

/** Check if value is a select config */
function isSelect(v: unknown): v is SelectConfig {
  return typeof v === 'object' && v !== null && 'type' in v && (v as { type: string }).type === 'select'
}

/** Check if value is an action config */
function isAction(v: unknown): v is ActionConfig {
  return typeof v === 'object' && v !== null && 'type' in v && (v as { type: string }).type === 'action'
}

/** Check if value is an explicit color config */
function isColorConfig(v: unknown): v is ColorConfig {
  return typeof v === 'object' && v !== null && 'type' in v && (v as { type: string }).type === 'color'
}

/** Check if value is an explicit text config */
function isTextConfig(v: unknown): v is TextConfig {
  return typeof v === 'object' && v !== null && 'type' in v && (v as { type: string }).type === 'text'
}

/** Determine if a plain object is a nested config (module) vs a typed config */
function isNestedConfig(v: unknown): v is PatchConfig {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false
  if (isLink(v) || isSpring(v) || isSelect(v) || isAction(v) || isColorConfig(v) || isTextConfig(v)) return false
  return true
}

/** Infer auto-range from a bare number */
function inferRange(value: number): { min: number; max: number; step: number } {
  const abs = Math.abs(value)
  if (abs === 0) return { min: 0, max: 100, step: 1 }
  if (abs <= 1) return { min: 0, max: Math.max(2, value * 3), step: 0.01 }
  if (abs <= 10) return { min: 0, max: Math.max(20, value * 3), step: 0.1 }
  if (abs <= 100) return { min: 0, max: Math.max(200, value * 3), step: 1 }
  return { min: 0, max: value * 3, step: Math.round(value * 0.01) || 1 }
}

/**
 * Parse a single config value into a ParamDescriptor.
 */
function parseParam(key: string, path: string, config: ParamConfig): ParamDescriptor {
  // Range: [default, min, max, step?]
  if (isRange(config)) {
    return {
      key,
      path,
      controlType: 'knob',
      value: config[0],
      defaultValue: config[0],
      min: config[1],
      max: config[2],
      step: config[3] ?? ((config[2] - config[1]) <= 2 ? 0.01 : 1),
    }
  }

  // Link
  if (isLink(config)) {
    return {
      key,
      path,
      controlType: 'linked',
      value: 0,
      defaultValue: 0,
      link: { source: config.source, transform: config.transform },
    }
  }

  // Spring
  if (isSpring(config)) {
    return {
      key,
      path,
      controlType: 'spring',
      value: config,
      defaultValue: config,
    }
  }

  // Select
  if (isSelect(config)) {
    const defaultVal = config.default ??
      (typeof config.options[0] === 'string' ? config.options[0] : config.options[0]?.value ?? '')
    return {
      key,
      path,
      controlType: 'select',
      value: defaultVal,
      defaultValue: defaultVal,
      options: config.options,
    }
  }

  // Action
  if (isAction(config)) {
    return {
      key,
      path,
      controlType: 'action',
      value: '',
      defaultValue: '',
      label: config.label ?? key,
    }
  }

  // Explicit color
  if (isColorConfig(config)) {
    return {
      key,
      path,
      controlType: 'color',
      value: config.default,
      defaultValue: config.default,
    }
  }

  // Explicit text
  if (isTextConfig(config)) {
    return {
      key,
      path,
      controlType: 'text',
      value: config.default ?? '',
      defaultValue: config.default ?? '',
      placeholder: config.placeholder,
    }
  }

  // Boolean → toggle
  if (typeof config === 'boolean') {
    return {
      key,
      path,
      controlType: 'toggle',
      value: config,
      defaultValue: config,
    }
  }

  // Number → auto-range knob
  if (typeof config === 'number') {
    const range = inferRange(config)
    return {
      key,
      path,
      controlType: 'knob',
      value: config,
      defaultValue: config,
      min: range.min,
      max: range.max,
      step: range.step,
    }
  }

  // String → color well or text input
  if (typeof config === 'string') {
    if (isHexColor(config)) {
      return {
        key,
        path,
        controlType: 'color',
        value: config,
        defaultValue: config,
      }
    }
    return {
      key,
      path,
      controlType: 'text',
      value: config,
      defaultValue: config,
    }
  }

  // Fallback
  return {
    key,
    path,
    controlType: 'text',
    value: String(config),
    defaultValue: String(config),
  }
}

/**
 * Parse a full PatchConfig into a ModuleDescriptor tree.
 */
export function parseConfig(
  name: string,
  config: PatchConfig,
  parentPath: string = '',
): ModuleDescriptor {
  const params: ParamDescriptor[] = []
  const submodules: ModuleDescriptor[] = []
  const collapsed = config._collapsed === true

  for (const [key, value] of Object.entries(config)) {
    if (key === '_collapsed') continue

    const path = parentPath ? `${parentPath}.${key}` : key

    if (isNestedConfig(value)) {
      submodules.push(parseConfig(key, value as PatchConfig, path))
    } else {
      params.push(parseParam(key, path, value as ParamConfig))
    }
  }

  return {
    name,
    id: parentPath || name,
    params,
    submodules,
    collapsed,
    muted: false,
    soloed: false,
  }
}

/**
 * Extract flat resolved values from a config.
 * Used to build the initial state for usePatch.
 */
export function extractDefaults(config: PatchConfig, prefix: string = ''): Record<string, ResolvedValue> {
  const result: Record<string, ResolvedValue> = {}

  for (const [key, value] of Object.entries(config)) {
    if (key === '_collapsed') continue
    const path = prefix ? `${prefix}.${key}` : key

    if (isNestedConfig(value)) {
      Object.assign(result, extractDefaults(value as PatchConfig, path))
    } else if (isRange(value)) {
      result[path] = value[0]
    } else if (isLink(value)) {
      result[path] = 0 // Will be computed from source
    } else if (isSpring(value)) {
      result[path] = value
    } else if (isSelect(value)) {
      result[path] = value.default ?? (typeof value.options[0] === 'string' ? value.options[0] : (value.options[0] as { value: string }).value)
    } else if (isAction(value)) {
      // Actions don't have values
    } else if (isColorConfig(value)) {
      result[path] = value.default
    } else if (isTextConfig(value)) {
      result[path] = value.default ?? ''
    } else if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
      result[path] = value
    }
  }

  return result
}
