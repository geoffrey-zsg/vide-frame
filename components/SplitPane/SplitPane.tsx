'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface SplitPaneProps {
  left: React.ReactNode
  right: React.ReactNode
  defaultRatio?: number
  minLeftWidth?: number
  minRightWidth?: number
}

export function SplitPane({
  left,
  right,
  defaultRatio = 0.33,
  minLeftWidth = 320,
  minRightWidth = 400,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ratio, setRatio] = useState(defaultRatio)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const containerWidth = rect.width
      const offsetX = e.clientX - rect.left

      const minRatio = minLeftWidth / containerWidth
      const maxRatio = (containerWidth - minRightWidth) / containerWidth

      let newRatio = offsetX / containerWidth
      newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio))

      setRatio(newRatio)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, minLeftWidth, minRightWidth])

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden bg-slate-100/50">
      {/* Left panel */}
      <div className="h-full relative z-10 shadow-sm" style={{ width: `${ratio * 100}%` }}>
        {left}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handleMouseDown}
        className={`relative z-20 h-full w-1.5 shrink-0 cursor-col-resize transition-all duration-200 group flex items-center justify-center ${
          isDragging ? 'bg-indigo-500 w-1.5' : 'bg-slate-200/80 hover:bg-indigo-400'
        }`}
      >
        <div className="h-8 w-1 rounded-full bg-slate-300 group-hover:bg-indigo-300 transition-colors" />
      </div>

      {/* Right panel */}
      <div
        className="relative h-full overflow-auto bg-white shadow-[-4px_0_24px_-10px_rgba(0,0,0,0.05)]"
        style={{ width: `${(1 - ratio) * 100}%` }}
      >
        {right}
        {/* Transparent overlay to prevent iframe from swallowing mouse events during drag */}
        {isDragging && <div className="absolute inset-0 z-50 cursor-col-resize" />}
      </div>
    </div>
  )
}
