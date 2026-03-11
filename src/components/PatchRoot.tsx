// ═══════════════════════════════════════════
// PATCH — PatchRoot (Panel)
// ═══════════════════════════════════════════
//
// Mount this once at your app root.
// It reads from the global registry and renders a floating panel
// with all registered usePatch modules.

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import type { PatchRootProps, RegisteredModule, PanelPosition } from '../types'
import {
  subscribe,
  getModules,
  setParamFromPanel,
  fireAction,
  isPanelOpen,
  setPanelOpen,
  getSnapshot,
} from '../core/registry'
import { interpolateScenes } from '../core/interpolator'
import { Module } from './Module'
import { MorphSlider } from './MorphSlider'

// ─── Position CSS mapping ───
const POSITIONS: Record<PanelPosition, React.CSSProperties> = {
  'top-right': { top: 12, right: 12 },
  'top-left': { top: 12, left: 12 },
  'bottom-right': { bottom: 12, right: 12 },
  'bottom-left': { bottom: 12, left: 12 },
}

export function PatchRoot({
  position = 'top-right',
  shortcut = 'Alt+P',
  theme = 'dark',
  zIndex = 99999,
}: PatchRootProps) {
  // Subscribe to registry
  const modules = useSyncExternalStore(
    subscribe,
    () => getModules(),
    () => getModules(),
  )

  const [open, setOpen] = useState(false)
  const [morphT, setMorphT] = useState(0)
  const [currentScene, setCurrentScene] = useState<string | null>(null)
  const [targetScene, setTargetScene] = useState<string | null>(null)
  const [scenesFrom, setScenesFrom] = useState<Record<string, number | boolean | string> | null>(null)
  const animRef = useRef<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [, forceRender] = useState(0)

  // Force re-render when registry changes
  useEffect(() => {
    return subscribe(() => forceRender(n => n + 1))
  }, [])

  // ─── Keyboard shortcut ───
  useEffect(() => {
    const parts = shortcut.split('+').map(p => p.trim().toLowerCase())
    const key = parts[parts.length - 1]
    const needsAlt = parts.includes('alt')
    const needsCtrl = parts.includes('ctrl') || parts.includes('control')
    const needsMeta = parts.includes('meta') || parts.includes('cmd')
    const needsShift = parts.includes('shift')

    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key) return
      if (needsAlt && !e.altKey) return
      if (needsCtrl && !e.ctrlKey) return
      if (needsMeta && !e.metaKey) return
      if (needsShift && !e.shiftKey) return

      e.preventDefault()
      setOpen(o => !o)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcut])

  // Collect all scenes across modules
  const allScenes = new Map<string, Record<string, number | boolean | string>>()
  modules.forEach((mod) => {
    if (mod.scenes) {
      for (const [sceneName, sceneValues] of Object.entries(mod.scenes)) {
        if (!allScenes.has(sceneName)) {
          allScenes.set(sceneName, {})
        }
        const existing = allScenes.get(sceneName)!
        for (const [k, v] of Object.entries(sceneValues)) {
          existing[`${mod.descriptor.id}.${k}`] = v
        }
      }
    }
  })
  const sceneNames = Array.from(allScenes.keys())

  // ─── Scene switching ───
  const handleSceneClick = useCallback((sceneName: string) => {
    if (animRef.current) cancelAnimationFrame(animRef.current)

    // Capture current values as "from"
    const currentVals: Record<string, number | boolean | string> = {}
    modules.forEach((mod) => {
      for (const param of mod.descriptor.params) {
        const val = param.value
        if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'string') {
          currentVals[`${mod.descriptor.id}.${param.key}`] = val
        }
      }
    })

    setScenesFrom(currentVals)
    setTargetScene(sceneName)
    setCurrentScene(sceneName)

    const targetVals = allScenes.get(sceneName) ?? {}

    // Check reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      // Apply instantly
      for (const [fullPath, val] of Object.entries(targetVals)) {
        const dotIdx = fullPath.indexOf('.')
        if (dotIdx < 0) continue
        const moduleId = fullPath.substring(0, dotIdx)
        const paramKey = fullPath.substring(dotIdx + 1)
        setParamFromPanel(moduleId, paramKey, val)
      }
      setMorphT(1)
      return
    }

    // Animate
    const morphDuration = 400
    const start = performance.now()

    function animate(now: number) {
      const elapsed = now - start
      const t = Math.min(elapsed / morphDuration, 1)
      const eased = 1 - Math.pow(1 - t, 3)

      setMorphT(eased)

      // Interpolate and apply
      const interpolated = interpolateScenes(currentVals, targetVals, eased)
      for (const [fullPath, val] of Object.entries(interpolated)) {
        const dotIdx = fullPath.indexOf('.')
        if (dotIdx < 0) continue
        const moduleId = fullPath.substring(0, dotIdx)
        const paramKey = fullPath.substring(dotIdx + 1)
        setParamFromPanel(moduleId, paramKey, val)
      }

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }

    animRef.current = requestAnimationFrame(animate)
  }, [modules, allScenes])

  // ─── Manual morph slider ───
  const handleMorphChange = useCallback((t: number) => {
    setMorphT(t)
    if (animRef.current) cancelAnimationFrame(animRef.current)

    if (!scenesFrom || !targetScene) return
    const targetVals = allScenes.get(targetScene) ?? {}
    const interpolated = interpolateScenes(scenesFrom, targetVals, t)

    for (const [fullPath, val] of Object.entries(interpolated)) {
      const dotIdx = fullPath.indexOf('.')
      if (dotIdx < 0) continue
      const moduleId = fullPath.substring(0, dotIdx)
      const paramKey = fullPath.substring(dotIdx + 1)
      setParamFromPanel(moduleId, paramKey, val)
    }
  }, [scenesFrom, targetScene, allScenes])

  // ─── Copy config ───
  const handleCopy = useCallback(() => {
    const snapshot = getSnapshot()
    navigator.clipboard?.writeText(JSON.stringify(snapshot, null, 2))
  }, [])

  // ─── Don't render if no modules ───
  if (modules.size === 0) return null

  const resolvedTheme = theme === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme

  const themeClass = `patch-panel--${resolvedTheme}`

  const panel = (
    <div
      ref={panelRef}
      className={`patch-panel ${themeClass} ${open ? 'patch-panel--open' : 'patch-panel--closed'}`}
      style={{ ...POSITIONS[position], zIndex, position: 'fixed' }}
      role="region"
      aria-label="PATCH control panel"
    >
      {/* Collapsed state: just a toggle button */}
      {!open && (
        <button
          className="patch-panel__toggle"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open PATCH panel"
          title={`Open PATCH panel (${shortcut})`}
        >
          <span className="patch-panel__toggle-led" aria-hidden="true" />
          <span className="patch-panel__toggle-label">PATCH</span>
        </button>
      )}

      {/* Expanded panel */}
      {open && (
        <>
          <div className="patch-panel__header">
            <div className="patch-panel__title">
              <span className="patch-panel__led" aria-hidden="true" />
              PATCH
            </div>
            <div className="patch-panel__header-actions">
              {/* Scene buttons */}
              {sceneNames.length > 0 && (
                <div className="patch-scenes" role="group" aria-label="Scene presets">
                  {sceneNames.map(name => (
                    <button
                      key={name}
                      className="patch-scene-btn"
                      type="button"
                      aria-pressed={currentScene === name}
                      onClick={() => handleSceneClick(name)}
                    >
                      {name.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
              <button
                className="patch-panel__close"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close PATCH panel"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Morph slider (only if scenes exist) */}
          {sceneNames.length > 0 && (
            <MorphSlider value={morphT} onChange={handleMorphChange} />
          )}

          {/* Modules */}
          <div className="patch-panel__modules">
            {Array.from(modules.entries()).map(([id, mod]) => (
              <Module
                key={id}
                module={mod.descriptor}
                onParamChange={(path, val) => setParamFromPanel(id, path, val)}
                onAction={(action) => fireAction(id, action)}
                theme={resolvedTheme}
              />
            ))}
          </div>

          {/* Status bar */}
          <div className="patch-panel__status">
            <span>
              {Array.from(modules.values()).reduce((sum, m) => sum + m.descriptor.params.length, 0)} params
              {' · '}
              {modules.size} module{modules.size !== 1 ? 's' : ''}
            </span>
            <button
              className="patch-copy-btn"
              type="button"
              onClick={handleCopy}
              aria-label="Copy configuration as JSON"
            >
              <span aria-hidden="true">⎘</span> COPY
            </button>
          </div>
        </>
      )}
    </div>
  )

  // Render via portal to document.body
  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
