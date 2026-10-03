import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Carousel({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, scroll: 0, moved: false })
  const [edges, setEdges] = useState({ start: true, end: true })

  function update() {
    const node = scroller.current
    if (!node) return
    setEdges({
      start: node.scrollLeft <= 4,
      end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 4,
    })
  }

  useEffect(() => {
    update()
    const node = scroller.current
    if (!node) return
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  function step(direction: number) {
    const node = scroller.current
    if (!node) return
    const card = node.querySelector<HTMLElement>('[data-carousel-card]')
    const amount = (card?.offsetWidth ?? 240) + 12
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    node.scrollBy({ left: direction * amount, behavior: reduced ? 'auto' : 'smooth' })
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      step(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      step(-1)
    }
  }

  return (
    <section aria-roledescription="carousel" aria-label={label} className="w-full min-w-0 max-w-full">
      <div className="mb-2 flex justify-end gap-1">
        <Button size="icon" variant="ghost" aria-label={`Previous ${label}`} disabled={edges.start} onClick={() => step(-1)}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button size="icon" variant="ghost" aria-label={`Next ${label}`} disabled={edges.end} onClick={() => step(1)}>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <div
        ref={scroller}
        tabIndex={0}
        className="flex w-full min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 focus-visible:outline-offset-4"
        onScroll={update}
        onKeyDown={onKeyDown}
        onWheel={(event) => {
          const node = scroller.current
          if (!node || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
          const next = node.scrollLeft + event.deltaY
          const atStart = event.deltaY < 0 && edges.start
          const atEnd = event.deltaY > 0 && edges.end
          if (atStart || atEnd) return
          event.preventDefault()
          node.scrollLeft = next
        }}
        onPointerDown={(event) => {
          if (event.pointerType === 'touch') return
          const node = scroller.current
          if (!node) return
          drag.current = { active: true, startX: event.clientX, scroll: node.scrollLeft, moved: false }
          node.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          const node = scroller.current
          if (!node || !drag.current.active) return
          const delta = event.clientX - drag.current.startX
          if (Math.abs(delta) > 6) drag.current.moved = true
          node.scrollLeft = drag.current.scroll - delta
        }}
        onPointerUp={() => {
          drag.current.active = false
        }}
        onClickCapture={(event) => {
          if (!drag.current.moved) return
          event.preventDefault()
          event.stopPropagation()
          drag.current.moved = false
        }}
      >
        {children}
      </div>
    </section>
  )
}

export function CarouselCard({ children }: { children: ReactNode }) {
  return (
    <div data-carousel-card className="w-[82vw] max-w-[280px] shrink-0 snap-start sm:w-[240px]">
      {children}
    </div>
  )
}
