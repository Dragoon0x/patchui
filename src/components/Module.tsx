// ═══════════════════════════════════════════
// PATCH — Module Container
// ═══════════════════════════════════════════

import { useState, useCallback } from 'react'
import type { ModuleDescriptor, ParamDescriptor, ResolvedValue } from '../types'
import { Knob } from './Knob'
import { Toggle } from './Toggle'
import { ColorWell } from './ColorWell'
import { Select, TextInput } from './Controls'

interface ModuleProps {
  module: ModuleDescriptor
  onParamChange: (path: string, value: ResolvedValue) => void
  onAction?: (action: string) => void
  theme: 'dark' | 'light'
}

export function Module({ module, onParamChange, onAction, theme }: ModuleProps) {
  const [collapsed, setCollapsed] = useState(module.collapsed)
  const [muted, setMuted] = useState(false)
  const [soloed, setSoloed] = useState(false)

  const toggleCollapse = useCallback(() => setCollapsed(c => !c), [])

  const renderParam = (param: ParamDescriptor) => {
    if (muted) return null

    switch (param.controlType) {
      case 'knob':
      case 'linked':
        return (
          <Knob
            key={param.path}
            param={param}
            onChange={(v) => onParamChange(param.path, v)}
            theme={theme}
          />
        )

      case 'toggle':
        return (
          <Toggle
            key={param.path}
            param={param}
            onChange={(v) => onParamChange(param.path, v)}
          />
        )

      case 'color':
        return (
          <ColorWell
            key={param.path}
            param={param}
            onChange={(v) => onParamChange(param.path, v)}
          />
        )

      case 'select':
        return (
          <Select
            key={param.path}
            param={param}
            onChange={(v) => onParamChange(param.path, v)}
          />
        )

      case 'text':
        return (
          <TextInput
            key={param.path}
            param={param}
            onChange={(v) => onParamChange(param.path, v)}
          />
        )

      case 'action':
        return (
          <button
            key={param.path}
            className="patch-action-btn"
            type="button"
            onClick={() => onAction?.(param.key)}
          >
            {param.label ?? param.key}
          </button>
        )

      case 'spring':
        // Spring editor — simplified for v0.1
        return (
          <div key={param.path} className="patch-spring-placeholder">
            <span className="patch-knob-label">{param.key.toUpperCase()}</span>
            <span className="patch-knob-value">spring</span>
          </div>
        )

      default:
        return null
    }
  }

  // Separate knobs/linked from toggles and others for layout
  const knobs = module.params.filter(p => p.controlType === 'knob' || p.controlType === 'linked')
  const toggles = module.params.filter(p => p.controlType === 'toggle')
  const colors = module.params.filter(p => p.controlType === 'color')
  const others = module.params.filter(p => !['knob', 'linked', 'toggle', 'color'].includes(p.controlType))

  return (
    <div className={`patch-module ${muted ? 'patch-module--muted' : ''}`} role="group" aria-label={`${module.name} controls`}>
      <div className="patch-module__header">
        <button
          className="patch-module__name"
          type="button"
          onClick={toggleCollapse}
          aria-expanded={!collapsed}
          aria-controls={`patch-module-${module.id}`}
        >
          <span className="patch-module__chevron" aria-hidden="true">{collapsed ? '▸' : '▾'}</span>
          {module.name.toUpperCase()}
        </button>
        <div className="patch-module__actions">
          <button
            className={`patch-module__btn patch-module__btn--solo ${soloed ? 'patch-module__btn--active' : ''}`}
            type="button"
            aria-label={`Solo ${module.name} module`}
            aria-pressed={soloed}
            onClick={() => setSoloed(s => !s)}
          >
            S
          </button>
          <button
            className={`patch-module__btn patch-module__btn--mute ${muted ? 'patch-module__btn--active' : ''}`}
            type="button"
            aria-label={`Mute ${module.name} module`}
            aria-pressed={muted}
            onClick={() => setMuted(m => !m)}
          >
            M
          </button>
        </div>
      </div>

      {!collapsed && (
        <div id={`patch-module-${module.id}`} className="patch-module__body">
          {knobs.length > 0 && (
            <div className="patch-knob-row">
              {knobs.map(renderParam)}
            </div>
          )}
          {(colors.length > 0 || toggles.length > 0) && (
            <div className="patch-knob-row" style={{ alignItems: 'center' }}>
              {colors.map(renderParam)}
              {toggles.length > 0 && (
                <div className="patch-toggles-col">
                  {toggles.map(renderParam)}
                </div>
              )}
            </div>
          )}
          {others.map(renderParam)}
          {module.submodules.map(sub => (
            <Module
              key={sub.id}
              module={sub}
              onParamChange={onParamChange}
              onAction={onAction}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  )
}
