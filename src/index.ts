// ═══════════════════════════════════════════
// PATCH — Public API
// ═══════════════════════════════════════════
//
// import { usePatch, link, PatchRoot } from 'patchui'
// import 'patchui/styles.css'

// Hook
export { usePatch } from './hooks/usePatch'

// Components
export { PatchRoot } from './components/PatchRoot'

// Helpers
export { link } from './core/link'

// Types
export type {
  PatchConfig,
  PatchOptions,
  PatchRootProps,
  RangeConfig,
  LinkConfig,
  SpringConfig,
  SelectConfig,
  ActionConfig,
  ColorConfig,
  TextConfig,
  PanelPosition,
  PatchTheme,
  SceneConfig,
  SceneValues,
} from './types'

// Theme presets
export { DARK_THEME, LIGHT_THEME } from './types'
