// ═══════════════════════════════════════════
// PATCH — Toggle Switch
// ═══════════════════════════════════════════

import { useCallback } from 'react'
import type { ParamDescriptor } from '../types'

interface ToggleProps {
  param: ParamDescriptor
  onChange: (value: boolean) => void
}

export function Toggle({ param, onChange }: ToggleProps) {
  const isOn = param.value === true

  const toggle = useCallback(() => {
    onChange(!isOn)
  }, [isOn, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggle()
    }
  }, [toggle])

  return (
    <div className="patch-toggle-container">
      <button
        className={`patch-toggle ${isOn ? 'patch-toggle--on' : ''}`}
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label={`Toggle ${param.key}`}
        onClick={toggle}
        onKeyDown={handleKeyDown}
      >
        <span className="patch-toggle__thumb" />
      </button>
      <span className="patch-toggle-label" aria-hidden="true">
        {param.key.toUpperCase()}
      </span>
    </div>
  )
}
