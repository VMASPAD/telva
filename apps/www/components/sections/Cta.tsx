"use client"
import SplitText from '@/components/SplitText'
import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function Cta() {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        // Establecemos el estado inicial con gsap.set para evitar problemas de parpadeo
        gsap.set('.reveal-text', { opacity: 0, y: 20 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.reveal-text',
            start: 'top 85%',
            toggleActions: 'play none none reverse',
            // markers: true, // Descomenta esto si quieres ver visualmente dónde se activa
          }
        });

        // Aplicamos el delay exacto con el parámetro de posición de la Timeline (+=1.5)
        tl.to('.reveal-text', {
          opacity: 1, 
          y: 0,
          duration: 1.5,
          ease: 'power3.out'
        }, "+=1.5");
        
      }, containerRef);

      return () => ctx.revert();
    }, [])
    
  return (
    <section ref={containerRef} className="relative h-screen flex flex-col items-center justify-center bg-black z-50">
      <div className="py-20">
        <SplitText
          text="That's all?"
          className="text-7xl font-bold text-center text-white"
          delay={50}
          duration={1.25}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center" 
        />
        <p className="reveal-text text-2xl font-semibold text-white mt-10 text-start opacity-0">No!</p>
      </div>
    </section>
  )
}