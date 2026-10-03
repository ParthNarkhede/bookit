import { useEffect, useRef } from 'react'
import { DAY_END_HOUR, DAY_START_HOUR, SLOT_INTERVAL_MINUTES } from '../constants/booking'

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
    if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
      return undefined
    }

    const body = containerRef.current.querySelector('.schedule-body-wrap')
    if (!body) {
      return undefined
    }

    const lineOffset =
      ((currentMinutes - startMinutes) / SLOT_INTERVAL_MINUTES) * slotHeightPx

    const frameId = window.requestAnimationFrame(() => {
      const container = containerRef.current
      if (!container) {
        return
      }

      const containerTop = container.getBoundingClientRect().top
      const bodyTop = body.getBoundingClientRect().top
      const scrollTop = container.scrollTop + bodyTop - containerTop + lineOffset
      container.scrollTo({
        top: scrollTop - container.clientHeight / 2,
        behavior: hasScrolledRef.current ? 'smooth' : 'auto',
      })
      hasScrolledRef.current = true
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [containerRef, currentMinutes, enabled, slotHeightPx])
}

export function useCurrentTimeTick(intervalMs = 30000) {
  const tickRef = useRef(0)

  useEffect(() => {
    tickRef.current = Date.now()
    const intervalId = window.setInterval(() => {
      tickRef.current = Date.now()
    }, intervalMs)

    return () => window.clearInterval(intervalId)
  }, [intervalMs])

  return tickRef
}
