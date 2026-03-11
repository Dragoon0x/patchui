// ═══════════════════════════════════════════
// PATCH — Scene Morph Slider
// ═══════════════════════════════════════════

import { useRef, useCallback, useEffect, useState } from 'react'

interface MorphSliderProps {
  value: number
  onChange: (t: number) => void
}

export function MorphSlider({ value, onChange }: MorphSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const pct = Math.round(value * 100)

  const setFromMouse = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onChange(t)
  }, [onChange])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true)
    setFromMouse(e.clientX)
    e.preventDefault()
  }, [setFromMouse])

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e: MouseEvent) => setFromMouse(e.clientX)
    const handleUp = () => setDragging(false)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, setFromMouse])

  // Touch
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setDragging(true)
    setFromMouse(e.touches[0].clientX)
    e.preventDefault()
  }, [setFromMouse])

  useEffect(() => {
    if (!dragging) return
    const handleTouchMove = (e: TouchEvent) => setFromMouse(e.touches[0].clientX)
    const handleTouchEnd = () => setDragging(false)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [dragging, setFromMouse])

  // Keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let newT = value
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp':
        newT = Math.min(1, value + 0.02); e.preventDefault(); break
      case 'ArrowLeft': case 'ArrowDown':
        newT = Math.max(0, value - 0.02); e.preventDefault(); break
      case 'PageUp':
        newT = Math.min(1, value + 0.1); e.preventDefault(); break
      case 'PageDown':
        newT = Math.max(0, value - 0.1); e.preventDefault(); break
      case 'Home': newT = 0; e.preventDefault(); break
      case 'End': newT = 1; e.preventDefault(); break
      default: return
    }
    onChange(newT)
  }, [value, onChange])

  return (
    <div className="patch-morph-section">
      <div className="patch-morph-label">
        <span id="patch-morph-label-text">SCENE MORPH</span>
        <span className="patch-morph-value">{pct}%</span>
      </div>
      <div
        ref={trackRef}
        className="patch-morph-track"
        tabIndex={0}
        role="slider"
        aria-labelledby="patch-morph-label-text"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct}%`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
      >
        <div className="patch-morph-track__bg" />
        <div className="patch-morph-track__fill" style={{ width: `${pct}%` }} />
        <div className="patch-morph-track__thumb" style={{ left: `${pct}%` }} />
      </div>
    </div>
  )
}
