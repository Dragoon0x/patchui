// ═══════════════════════════════════════════
// PATCH — Color Well
// ═══════════════════════════════════════════

import { useCallback } from 'react'
import type { ParamDescriptor } from '../types'

interface ColorWellProps {
  param: ParamDescriptor
  onChange: (value: string) => void
}

export function ColorWell({ param, onChange }: ColorWellProps) {
  const value = typeof param.value === 'string' ? param.value : '#000000'
  const labelId = `patch-color-${param.path.replace(/\./g, '-')}`

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  return (
    <div className="patch-knob-group">
      <div className="patch-knob-label" id={labelId}>{param.key.toUpperCase()}</div>
      <div className="patch-color-well" style={{ background: value }}>
        <input
          type="color"
          value={value}
          onChange={handleInput}
          aria-labelledby={labelId}
        />
      </div>
      <div className="patch-knob-value" aria-hidden="true" style={{ fontSize: 9 }}>
        {value}
      </div>
    </div>
  )
}
