import { useEffect, useRef } from 'react'
import { DAY_END_HOUR, DAY_START_HOUR } from '../constants/booking'
import { getCurrentMinutes } from '../utils/slotHelpers'

export function useScrollToCurrentTime({
  enabled,
  slotHeightPx,
  containerRef,
  currentMinutes,
}) {
  const hasScrolledRef = useRef(false)

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return undefined
    }

    const startMinutes = DAY_START_HOUR * 60
    const endMinutes = DAY_END_HOUR * 60
    const clampedMinutes = Math.min(Math.max(currentMinutes, startMinutes), endMinutes)
    const offsetSlots = Math.max(0, (clampedMinutes - startMinutes) / 15 - 2)
    const scrollTop = offsetSlots * slotHeightPx

    const frameId = window.requestAnimationFrame(() => {
      containerRef.current?.scrollTo({
        top: scrollTop,
        behavior: hasScrolledRef.current ? 'smooth' : 'auto',
      })
      hasScrolledRef.current = true
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [containerRef, currentMinutes, enabled, slotHeightPx])
}

export function useCurrentTimeTick(intervalMs = 30000) {
  const tickRef = useRef(Date.now())

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      tickRef.current = Date.now()
    }, intervalMs)

    return () => window.clearInterval(intervalId)
  }, [intervalMs])

  return tickRef
}
