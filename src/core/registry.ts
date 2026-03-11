// ═══════════════════════════════════════════
// PATCH — Global Registry
// ═══════════════════════════════════════════
//
// usePatch() registers modules here.
// PatchRoot reads from here to render the panel.
// Changes flow: Panel → Registry → usePatch re-render

import type {
  RegisteredModule,
  ModuleDescriptor,
  ResolvedValue,
  SceneConfig,
} from '../types'

// ─── Singleton state ───

const modules = new Map<string, RegisteredModule>()
const listeners = new Set<() => void>()

let panelOpen = false
let globalMorphT = 0
let activeSceneFrom: string | null = null
let activeSceneTo: string | null = null

// ─── Public API ───

/** Register a module from usePatch. Returns unregister function. */
export function registerModule(
  id: string,
  descriptor: ModuleDescriptor,
  setParam: (path: string, value: ResolvedValue) => void,
  scenes?: SceneConfig,
  morphDuration?: number,
  onAction?: (action: string) => void,
): () => void {
  modules.set(id, { descriptor, setParam, scenes, morphDuration, onAction })
  notifyListeners()

  return () => {
    modules.delete(id)
    notifyListeners()
  }
}

/** Update a module's descriptor (e.g. after param values change) */
export function updateModule(id: string, descriptor: ModuleDescriptor) {
  const mod = modules.get(id)
  if (mod) {
    mod.descriptor = descriptor
    notifyListeners()
  }
}

/** Get all registered modules */
export function getModules(): Map<string, RegisteredModule> {
  return modules
}

/** Get a specific module */
export function getModule(id: string): RegisteredModule | undefined {
  return modules.get(id)
}

/** Set a parameter value from the panel UI */
export function setParamFromPanel(moduleId: string, path: string, value: ResolvedValue) {
  const mod = modules.get(moduleId)
  if (mod) {
    mod.setParam(path, value)
  }
}

/** Fire an action callback */
export function fireAction(moduleId: string, action: string) {
  const mod = modules.get(moduleId)
  if (mod?.onAction) {
    mod.onAction(action)
  }
}

/** Toggle panel open/closed */
export function togglePanel() {
  panelOpen = !panelOpen
  notifyListeners()
}

export function setPanelOpen(open: boolean) {
  panelOpen = open
  notifyListeners()
}

export function isPanelOpen(): boolean {
  return panelOpen
}

/** Scene morphing */
export function getMorphT(): number {
  return globalMorphT
}

export function setMorphT(t: number) {
  globalMorphT = Math.max(0, Math.min(1, t))
  notifyListeners()
}

export function getActiveScenes(): { from: string | null; to: string | null } {
  return { from: activeSceneFrom, to: activeSceneTo }
}

export function setActiveScenes(from: string | null, to: string | null) {
  activeSceneFrom = from
  activeSceneTo = to
  notifyListeners()
}

// ─── Subscription ───

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function notifyListeners() {
  listeners.forEach(fn => fn())
}

// ─── Snapshot (for copy-to-clipboard) ───

export function getSnapshot(): Record<string, Record<string, unknown>> {
  const snapshot: Record<string, Record<string, unknown>> = {}

  modules.forEach((mod, id) => {
    const values: Record<string, unknown> = {}
    for (const param of mod.descriptor.params) {
      values[param.key] = param.value
    }
    for (const sub of mod.descriptor.submodules) {
      const subValues: Record<string, unknown> = {}
      for (const param of sub.params) {
        subValues[param.key] = param.value
      }
      values[sub.name] = subValues
    }
    snapshot[mod.descriptor.name] = values
  })

  return snapshot
}
