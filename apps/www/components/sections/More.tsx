"use client"

import Image from 'next/image'
import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const expandableCards = [
  {
    date: 'Core Features',
    title: 'Two Canvas Modes',
    description:
      'Switch between organic, hand-drawn Freehand aesthetics and crisp, geometric Straight lines instantly.',
    iconSrc:
      '/icon.svg',
    backgroundSrc: '/cap4.webm',
    alt: 'Canvas Modes',
  },
  {
    date: 'Architecture',
    title: 'Deep Shape Library',
    description:
      '10 customizable shape types including text and sticky notes. Group, nest, and bind them together.',
    iconSrc:
      '/icon.svg',
    backgroundSrc: '/cap5.webm',
    alt: 'Shape Library',
  },
  {
    date: 'Design',
    title: 'Unified Style System',
    description:
      '12 semantic colors, custom hex with alpha, drop shadows, blurred layers, and 4 gradient types.',
    iconSrc:
      '/icon.svg',
    backgroundSrc: '/cap6.webm',
    alt: 'Style System',
  },
]

function More() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])
  const timelinesRef = useRef<gsap.core.Timeline[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      timelinesRef.current = cardsRef.current.map((card) => {
        if (!card) {
          return gsap.timeline({ paused: true })
        }

        const bg = card.querySelector<HTMLElement>('.more-card-bg')
        const overlay = card.querySelector<HTMLElement>('.more-card-overlay')
        const thumb = card.querySelector<HTMLElement>('.more-card-thumb')
        const icon = card.querySelector<HTMLElement>('.more-card-icon')
        const date = card.querySelector<HTMLElement>('.more-card-date')
        const title = card.querySelector<HTMLElement>('.more-card-title')
        const description = card.querySelector<HTMLElement>('.more-card-description')

        if (!bg || !overlay || !thumb || !icon || !date || !title || !description) {
          return gsap.timeline({ paused: true })
        }

        gsap.set(bg, {
          opacity: 0,
          scale: 1.18,
          transformOrigin: 'center center',
        })
        gsap.set(overlay, { opacity: 0 })

        return gsap
          .timeline({
            paused: true,
            defaults: {
              duration: 0.7,
              ease: 'power3.out',
              overwrite: 'auto',
            },
          })
          .to(
            card,
            {
              flexGrow: 3.5,
            },
            0,
          )
          .to(
            bg,
            {
              opacity: 1,
              scale: 1,
            },
            0,
          )
          .to(
            overlay,
            {
              opacity: 1,
            },
            0,
          )
          .to(
            thumb,
            {
              opacity: 0,
              scale: 0.72,
              y: -24,
            },
            0,
          )
          .to(
            icon,
            {
              rotate: 90,
              backgroundColor: 'rgba(255, 255, 255, 0.16)',
              borderColor: 'rgba(255, 255, 255, 0.24)',
            },
            0,
          )
          .to(
            date,
            {
              color: 'rgba(255, 255, 255, 0.72)',
            },
            0,
          )
          .to(
            title,
            {
              scale: 1.15,
              y: -8,
              color: '#ffffff',
            },
            0,
          )
          .to(
            description,
            {
              color: 'rgba(255, 255, 255, 0.82)',
              y: -8,
            },
            0,
          )
      })
    }, sectionRef)

    return () => {
      timelinesRef.current.forEach((timeline) => timeline.kill())
      ctx.revert()
    }
  }, [])

  const handleCardEnter = (index: number) => {
    timelinesRef.current[index]?.play()
  }

  const handleCardLeave = (index: number) => {
    timelinesRef.current[index]?.reverse()
  }

  return (
    <section ref={sectionRef} className="bg-black py-24 px-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-16">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="max-w-xl text-4xl font-bold leading-tight text-white md:text-6xl">
            Explore a <br />
            powerful canvas.
          </h2>
        </div>

        <div className="flex flex-col md:flex-row w-full h-[800px] md:h-[600px] gap-6">
          {expandableCards.map((card, index) => (
            <div
              key={card.title}
              ref={(element) => {
                cardsRef.current[index] = element
              }}
              onMouseEnter={() => handleCardEnter(index)}
              onMouseLeave={() => handleCardLeave(index)}
              onFocus={() => handleCardEnter(index)}
              onBlur={() => handleCardLeave(index)}
              role="button"
              tabIndex={0}
              aria-label={card.title}
              className="group relative flex-1 min-w-0 flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-8 cursor-pointer outline-none will-change-transform z-10 hover:z-50 hover:bg-zinc-800/80 hover:border-white/20 transition-colors"
              style={{ flexBasis: '0%' }}
            >
              <video
                className="more-card-bg pointer-events-none absolute inset-0 h-full w-full object-cover"
                src={card.backgroundSrc}
                autoPlay
                loop
                muted
              />
              <div className="more-card-overlay pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-black/10" />

              <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                  <div className="flex items-start justify-between gap-4">
                    <Image
                      alt={card.alt}
                      className="more-card-thumb size-14 rounded-2xl border border-white/10 bg-white object-cover p-1.5"
                      src={card.iconSrc}
                      width={56}
                      height={56}
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="more-card-date text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                      {card.date}
                    </span>
                    <h3 className="more-card-title max-w-[16rem] text-2xl font-bold leading-snug text-white md:text-[1.9rem]">
                      {card.title}
                    </h3>
                    <p className="more-card-description max-w-[30ch] text-sm leading-relaxed text-zinc-400 md:text-base">
                      {card.description}
                    </p>
                  </div>
                </div>
            </div>
          ))}

           
        </div>
      </div>
    </section>
  )
}

export default More
