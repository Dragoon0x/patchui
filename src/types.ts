// ═══════════════════════════════════════════
// PATCH — Types
// ═══════════════════════════════════════════

import type { CSSProperties, ReactNode } from 'react'

// ─── Config types (what users pass to usePatch) ───

/** Slider/knob: [default, min, max, step?] */
export type RangeConfig = [number, number, number] | [number, number, number, number]

/** Link config — computed from another param */
export interface LinkConfig {
  __patch_link: true
  source: string
  transform: (value: number) => number
}

/** Spring config — renders a spring curve editor */
export interface SpringConfig {
  type: 'spring'
  /** Time-based: 0.1–2.0 */
  visualDuration?: number
  /** Time-based: 0–1 */
  bounce?: number
  /** Physics-based */
  stiffness?: number
  /** Physics-based */
  damping?: number
  /** Physics-based */
  mass?: number
}

/** Select config */
export interface SelectConfig {
  type: 'select'
  options: string[] | { value: string; label: string }[]
  default?: string
}

/** Action button config */
export interface ActionConfig {
  type: 'action'
  label?: string
}

/** Color config (explicit) */
export interface ColorConfig {
  type: 'color'
  default: string
}

/** Text config (explicit) */
export interface TextConfig {
  type: 'text'
  default?: string
  placeholder?: string
}

/** Any single param config value */
export type ParamConfig =
  | number
  | boolean
  | string
  | RangeConfig
  | LinkConfig
  | SpringConfig
  | SelectConfig
  | ActionConfig
  | ColorConfig
  | TextConfig

/** Nested config object — becomes a module/folder */
export type PatchConfig = {
  [key: string]: ParamConfig | PatchConfig | boolean | undefined
}

// ─── Resolved runtime values ───

export type ResolvedValue = number | boolean | string | SpringConfig

export type ResolvedValues<T extends PatchConfig> = {
  [K in keyof T]: T[K] extends RangeConfig ? number
    : T[K] extends LinkConfig ? number
    : T[K] extends SpringConfig ? SpringConfig
    : T[K] extends SelectConfig ? string
    : T[K] extends ActionConfig ? never
    : T[K] extends ColorConfig ? string
    : T[K] extends TextConfig ? string
    : T[K] extends boolean ? boolean
    : T[K] extends number ? number
    : T[K] extends string ? string
    : T[K] extends PatchConfig ? ResolvedValues<T[K]>
    : never
}

// ─── Internal param descriptors ───

export type ControlType = 'knob' | 'toggle' | 'color' | 'text' | 'select' | 'spring' | 'action' | 'linked'

export interface ParamDescriptor {
  key: string
  path: string
  controlType: ControlType
  value: ResolvedValue
  defaultValue: ResolvedValue
  min?: number
  max?: number
  step?: number
  options?: string[] | { value: string; label: string }[]
  link?: { source: string; transform: (v: number) => number }
  label?: string
  placeholder?: string
}

export interface ModuleDescriptor {
  name: string
  id: string
  params: ParamDescriptor[]
  submodules: ModuleDescriptor[]
  collapsed: boolean
  muted: boolean
  soloed: boolean
}

// ─── Scene types ───

export type SceneValues = Record<string, number | boolean | string>

export interface SceneConfig {
  [name: string]: SceneValues
}

// ─── Options for usePatch ───

export interface PatchOptions {
  scenes?: SceneConfig
  morphDuration?: number
  onAction?: (action: string) => void
  collapsed?: boolean
}

// ─── PatchRoot props ───

export type PanelPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

export interface PatchRootProps {
  position?: PanelPosition
  shortcut?: string
  theme?: 'dark' | 'light' | 'auto'
  zIndex?: number
  children?: ReactNode
}

// ─── Registry types ───

export interface RegisteredModule {
  descriptor: ModuleDescriptor
  setParam: (path: string, value: ResolvedValue) => void
  scenes?: SceneConfig
  morphDuration?: number
  onAction?: (action: string) => void
}

export interface RegistryState {
  modules: Map<string, RegisteredModule>
  listeners: Set<() => void>
  activeScene: string | null
  morphT: number
  panelOpen: boolean
}

// ─── Theme ───

export interface PatchTheme {
  bg: string
  bg2: string
  surface: string
  surface2: string
  border: string
  border2: string
  dim: string
  text: string
  bright: string
  white: string
  accent: string
  accentDim: string
  accentGlow: string
  green: string
  red: string
  cyan: string
}

export const DARK_THEME: PatchTheme = {
  bg: '#08080c',
  bg2: '#0e0e14',
  surface: '#13131a',
  surface2: '#1a1a24',
  border: '#1e1e2a',
  border2: '#2a2a3a',
  dim: '#8b8b9e',
  text: '#a0a0b4',
  bright: '#d0d0dc',
  white: '#eeeef4',
  accent: '#f59e0b',
  accentDim: '#d49a1e',
  accentGlow: 'rgba(245,158,11,.15)',
  green: '#4ade80',
  red: '#f87171',
  cyan: '#22d3ee',
}

export const LIGHT_THEME: PatchTheme = {
  bg: '#ffffff',
  bg2: '#f8f8fa',
  surface: '#f0f0f4',
  surface2: '#e8e8ee',
  border: '#d8d8e0',
  border2: '#c8c8d0',
  dim: '#6b6b7a',
  text: '#4a4a5a',
  bright: '#2a2a3a',
  white: '#111118',
  accent: '#d97706',
  accentDim: '#b45309',
  accentGlow: 'rgba(217,119,6,.1)',
  green: '#16a34a',
  red: '#dc2626',
  cyan: '#0891b2',
}
