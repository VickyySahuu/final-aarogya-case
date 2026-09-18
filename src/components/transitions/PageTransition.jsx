import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'

export default function PageTransition({ children }) {
  const location = useLocation()
  const outlet = useOutlet()
  const currentElement = outlet || children

  // Store the element in state so we can hold the outgoing page during soft exit
  const [renderedElement, setRenderedElement] = useState(currentElement)
  const [stage, setStage] = useState('idle') // 'idle' | 'exiting' | 'entering' | 'entered'

  const containerRef = useRef(null)
  const navKey = location.key + location.pathname + location.search
  const prevNavKeyRef = useRef(navKey)
  const latestElementRef = useRef(currentElement)
  const timersRef = useRef([])

  latestElementRef.current = currentElement

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
  }

  useEffect(() => {
    // Same route, just keep renderedElement up-to-date
    if (prevNavKeyRef.current === navKey) {
      setRenderedElement(latestElementRef.current)
      return
    }

    prevNavKeyRef.current = navKey
    clearTimers()

    // Step 1: Soft exit of current page (180ms)
    setStage('exiting')

    const exitTimer = setTimeout(() => {
      // Step 2: Swap to incoming page & scroll to top
      setRenderedElement(latestElementRef.current)
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      setStage('entering')

      // Force browser reflow to commit initial entrance position
      if (containerRef.current) {
        void containerRef.current.offsetHeight
      }

      // Step 3: Trigger soft entrance in next frame (280ms)
      const rAF = requestAnimationFrame(() => {
        setStage('entered')

        // Step 4: Return to idle state after entrance completes
        const enterTimer = setTimeout(() => {
          setStage('idle')
        }, 280)
        timersRef.current.push(enterTimer)
      })

      return () => cancelAnimationFrame(rAF)
    }, 180)

    timersRef.current.push(exitTimer)

    return () => {
      clearTimers()
    }
  }, [navKey])

  return (
    <div
      ref={containerRef}
      className={`page-transition-container stage-${stage}`}
      data-testid="page-transition"
    >
      {renderedElement}
    </div>
  )
}

