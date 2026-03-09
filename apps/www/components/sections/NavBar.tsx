"use client"
import Link from 'next/link'
import React, { useEffect, useRef } from 'react'
import {gsap} from 'gsap'
import Image from 'next/image'

function NavBar() {
  const linkRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    linkRefs.current.forEach((link) => {
      if (!link) return

      const bgElement = link.querySelector('.bg-hover')
      
      link.addEventListener('mouseenter', () => {
        gsap.to(bgElement, {
          height: '100%',
          duration: 0.5,
          ease: 'power2.out'
        })
      })

      link.addEventListener('mouseleave', () => {
        gsap.to(bgElement, {
          height: '0%',
          duration: 0.5,
          ease: 'power2.inOut'
        })
      })
    })
  }, [])

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Playground', href: '/playground' },
    { name: 'Repository', href: 'https://github.com/vmaspad/telva' },
    { name: 'Docs', href: 'https://telva-docs.vercel.app/' }
  ]

  return (
    <section className='max-w-screen flex flex-col justify-center items-center border-b-2 border-white/10'>
        <nav className='grid grid-cols-5 text-center w-full max-w-6xl h-32'>
            <div className='flex items-center justify-center w-full h-full'>
                <img src="/telva.svg" alt="Logo" className='brightness-0 invert' width={150}/>
            </div>
            {
                links.map((link, index) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      ref={(el: any) => {
                        linkRefs.current[index] = el
                      }}
                      className='relative overflow-hidden cursor-pointer text-lg font-medium py-3 px-6 text-white hover:text-black transition-colors flex items-center justify-center h-full'
                    >
                      <div className='bg-hover absolute bottom-0 left-0 w-full h-0 bg-white -z-10 pointer-events-none'></div>
                      <span className='relative z-10'>
                        {link.name}
                      </span>
                    </Link>
                ))
            } 
        </nav>
    </section>
  )
}

export default NavBar