// ═══════════════════════════════════════════
// PATCH — Rotary Knob
// ═══════════════════════════════════════════

import { useRef, useCallback, useEffect, useState } from 'react'
import type { ParamDescriptor } from '../types'

interface KnobProps {
  param: ParamDescriptor
  onChange: (value: number) => void
  theme: 'dark' | 'light'
}

// ─── SVG arc generation ───
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const rad = (a: number) => (a - 90) * Math.PI / 180
  const sx = cx + r * Math.cos(rad(startAngle))
  const sy = cy + r * Math.sin(rad(startAngle))
  const ex = cx + r * Math.cos(rad(endAngle))
  const ey = cy + r * Math.sin(rad(endAngle))
  const largeArc = (endAngle - startAngle) > 180 ? 1 : 0
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`
}

const BG_ARC = describeArc(24, 24, 20, -135, 135)

export function Knob({ param, onChange, theme }: KnobProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ startY: 0, startVal: 0, active: false })

  const min = param.min ?? 0
  const max = param.max ?? 100
  const step = param.step ?? 1
  const value = typeof param.value === 'number' ? param.value : 0
  const range = max - min

  const t = Math.max(0, Math.min(1, (value - min) / range))
  const angle = -135 + t * 270
  const activeArc = t > 0.005 ? describeArc(24, 24, 20, -135, -135 + t * 270) : ''

  const displayValue = useCallback((v: number) => {
    if (param.key === 'fontWeight' || param.key === 'weight') return String(Math.round(v / 100) * 100)
    if (param.key === 'lineHeight') return (v / 100).toFixed(1)
    if (param.key === 'letterSpacing') return v.toFixed(0) + 'px'
    if (param.key === 'opacity' || param.key === 'bounce') return v.toFixed(2)
    if (step < 1) return v.toFixed(2)
    return Math.round(v) + (param.key.includes('ize') || param.key.includes('adius') || param.key.includes('adding') || param.key.includes('ap') || param.key.includes('pacing') ? 'px' : '')
  }, [param.key, step])

  // ─── Mouse drag ───
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { startY: e.clientY, startVal: value, active: true }
    setDragging(true)
    e.preventDefault()
  }, [value])

  useEffect(() => {
    if (!dragging) return

    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return
      const sensitivity = range / 150
      const delta = (dragRef.current.startY - e.clientY) * sensitivity
      const newVal = Math.max(min, Math.min(max, dragRef.current.startVal + delta))
      onChange(newVal)
    }

    const handleUp = () => {
      dragRef.current.active = false
      setDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [dragging, min, max, range, onChange])

  // ─── Touch drag ───
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragRef.current = { startY: e.touches[0].clientY, startVal: value, active: true }
    setDragging(true)
    e.preventDefault()
  }, [value])

  useEffect(() => {
    if (!dragging) return

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragRef.current.active) return
      const sensitivity = range / 150
      const delta = (dragRef.current.startY - e.touches[0].clientY) * sensitivity
      const newVal = Math.max(min, Math.min(max, dragRef.current.startVal + delta))
      onChange(newVal)
    }

    const handleTouchEnd = () => {
      dragRef.current.active = false
      setDragging(false)
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [dragging, min, max, range, onChange])

  // ─── Keyboard ───
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let newVal = value
    const bigStep = step * 10

    switch (e.key) {
      case 'ArrowUp': case 'ArrowRight':
        newVal = Math.min(max, value + step); e.preventDefault(); break
      case 'ArrowDown': case 'ArrowLeft':
        newVal = Math.max(min, value - step); e.preventDefault(); break
      case 'PageUp':
        newVal = Math.min(max, value + bigStep); e.preventDefault(); break
      case 'PageDown':
        newVal = Math.max(min, value - bigStep); e.preventDefault(); break
      case 'Home':
        newVal = min; e.preventDefault(); break
      case 'End':
        newVal = max; e.preventDefault(); break
      default: return
    }
    onChange(newVal)
  }, [value, min, max, step, onChange])

  const labelId = `patch-knob-${param.path.replace(/\./g, '-')}`

  return (
    <div className="patch-knob-group">
      <div className="patch-knob-label" id={labelId}>{param.key.toUpperCase()}</div>
      <div
        ref={containerRef}
        className={`patch-knob ${dragging ? 'patch-knob--dragging' : ''}`}
        tabIndex={0}
        role="slider"
        aria-labelledby={labelId}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Math.round(value * 100) / 100}
        aria-valuetext={displayValue(value)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
      >
        <div className="patch-knob__ring" />
        <svg className="patch-knob__track" viewBox="0 0 48 48" aria-hidden="true">
          <path className="patch-knob__bg-arc" d={BG_ARC} />
          {activeArc && <path className="patch-knob__active-arc" d={activeArc} />}
        </svg>
        <div
          className="patch-knob__indicator"
          style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }}
        />
      </div>
      <div className="patch-knob-value" aria-hidden="true">{displayValue(value)}</div>
    </div>
  )
}
