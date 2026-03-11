// ═══════════════════════════════════════════
// PATCH — Select & TextInput
// ═══════════════════════════════════════════

import { useCallback } from 'react'
import type { ParamDescriptor } from '../types'

// ─── Select ───

interface SelectProps {
  param: ParamDescriptor
  onChange: (value: string) => void
}

export function Select({ param, onChange }: SelectProps) {
  const value = typeof param.value === 'string' ? param.value : ''
  const options = param.options ?? []

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value)
  }, [onChange])

  return (
    <div className="patch-select-group">
      <label className="patch-knob-label" htmlFor={`patch-select-${param.path}`}>
        {param.key.toUpperCase()}
      </label>
      <select
        id={`patch-select-${param.path}`}
        className="patch-select"
        value={value}
        onChange={handleChange}
      >
        {options.map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value
          const label = typeof opt === 'string' ? opt : opt.label
          return <option key={val} value={val}>{label}</option>
        })}
      </select>
    </div>
  )
}

// ─── TextInput ───

interface TextInputProps {
  param: ParamDescriptor
  onChange: (value: string) => void
}

export function TextInput({ param, onChange }: TextInputProps) {
  const value = typeof param.value === 'string' ? param.value : ''

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  return (
    <div className="patch-text-group">
      <label className="patch-knob-label" htmlFor={`patch-text-${param.path}`}>
        {param.key.toUpperCase()}
      </label>
      <input
        id={`patch-text-${param.path}`}
        className="patch-text-input"
        type="text"
        value={value}
        placeholder={param.placeholder}
        onChange={handleChange}
      />
    </div>
  )
}
