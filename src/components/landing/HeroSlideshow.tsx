import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { HeroSlide } from '@/content/heroSlides'

const INTERVAL_MS = 6000

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [failed, setFailed] = useState<Set<number>>(() => new Set())
  const [mounted, setMounted] = useState<number[]>([0])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    setMounted((current) => {
      const next = (index + 1) % slides.length
      const additions = [index, next].filter((item) => !current.includes(item))
      return additions.length === 0 ? current : [...current, ...additions]
    })
  }, [index, slides.length])

  useEffect(() => {
    const next = slides[(index + 1) % slides.length]
    const image = new Image()
    image.src = next.image
  }, [index, slides])

  useEffect(() => {
    if (reduced || paused || slides.length < 2) return
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, INTERVAL_MS)
    return () => window.clearTimeout(timer)
  }, [index, paused, reduced, slides.length])

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  function go(next: number) {
    const count = slides.length
    setIndex((next + count) % count)
  }

  return (
    <div className="absolute inset-0" aria-roledescription="carousel" aria-label="Background imagery">
      {mounted.map((slideIndex) => {
        const slide = slides[slideIndex]
        const active = slideIndex === index
        return failed.has(slideIndex) ? (
          <div
            key={slide.image}
            className={`absolute inset-0 bg-gradient-to-br ${slide.fallback} transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={!active}
          />
        ) : (
          <img
            key={slide.image}
            src={slide.image}
            alt={active ? slide.alt : ''}
            aria-hidden={!active}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}
            loading={slideIndex === 0 ? 'eager' : 'lazy'}
            fetchPriority={slideIndex === 0 ? 'high' : 'low'}
            onError={() => {
              setFailed((current) => {
                const next = new Set(current)
                next.add(slideIndex)
                return next
              })
            }}
          />
        )
      })}
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
      <div
        className="absolute right-4 bottom-5 left-4 z-10 flex items-center justify-between gap-3 sm:left-auto"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(document.hidden)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPaused(document.hidden || prefersReducedMotion())
        }}
      >
        <div className="flex items-center gap-1.5" role="group" aria-label="Choose background">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.image}
              type="button"
              aria-label={`Show ${slide.title}`}
              aria-current={slideIndex === index ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all ${slideIndex === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
              onClick={() => go(slideIndex)}
            />
          ))}
        </div>
        <div className="flex gap-1">
          <Button type="button" size="icon" variant="secondary" aria-label="Previous background" onClick={() => go(index - 1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button type="button" size="icon" variant="secondary" aria-label="Next background" onClick={() => go(index + 1)}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
