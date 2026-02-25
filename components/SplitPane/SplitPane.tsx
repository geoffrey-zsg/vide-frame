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
    <div ref={containerRef} className="flex h-full w-full overflow-hidden">
      {/* Left panel */}
      <div className="h-full" style={{ width: `${ratio * 100}%` }}>
        {left}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handleMouseDown}
        className={`h-full w-1 shrink-0 cursor-col-resize transition-colors ${
          isDragging ? 'bg-blue-500' : 'bg-gray-200 hover:bg-blue-400'
        }`}
      />

      {/* Right panel */}
      <div
        className="relative h-full overflow-auto"
        style={{ width: `${(1 - ratio) * 100}%` }}
      >
        {right}
        {/* Transparent overlay to prevent iframe from swallowing mouse events during drag */}
        {isDragging && <div className="absolute inset-0 z-50" />}
      </div>
    </div>
  )
}
