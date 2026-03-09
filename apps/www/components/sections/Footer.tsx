import React from 'react'

function Footer() {
  return (
    <footer className="bg-zinc-950 text-white py-16 border-t border-white/10 relative z-50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Telva</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-xs">
                    A fully-featured, embeddable vector drawing application built with React and TypeScript. Drop it into any web app and give your users a professional-grade canvas.
                  </p>
                </div>
                <div className="text-zinc-600 text-xs">
                    © {new Date().getFullYear()} Telva Draw. All rights reserved.
                </div>
            </div>

            <div>
                <h4 className="font-semibold text-lg mb-6 text-zinc-100">Core Features</h4>
                <ul className="space-y-3 text-zinc-400 text-sm">
                    <li><span className="hover:text-white transition-colors cursor-pointer">Undo / Redo Time-travel</span></li>
                    <li><span className="hover:text-white transition-colors cursor-pointer">React Components Embed</span></li>
                    <li><span className="hover:text-white transition-colors cursor-pointer">Freehand & Straight Modes</span></li>
                    <li><span className="hover:text-white transition-colors cursor-pointer">Real-Time Multiplayer</span></li>
                    <li><span className="hover:text-white transition-colors cursor-pointer">Export to SVG / PNG / JSON</span></li>
                </ul>
            </div>

            <div>
                <h4 className="font-semibold text-lg mb-6 text-zinc-100">Tech Stack</h4>
                <ul className="space-y-3 text-zinc-400 text-sm">
                    <li><span className="hover:text-white transition-colors cursor-pointer">React 18 + TypeScript</span></li>
                    <li><span className="hover:text-white transition-colors cursor-pointer">Zustand (State Management)</span></li>
                    <li><span className="hover:text-white transition-colors cursor-pointer">Liveblocks</span></li>
                </ul>
            </div>

            <div>
                <h4 className="font-semibold text-lg mb-6 text-zinc-100">Architecture</h4>
                <ul className="space-y-4 text-zinc-400 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-white bg-white/10 px-2 py-1 rounded text-xs shrink-0 font-mono">telva</span> 
                      <span>Full application shell</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-white bg-white/10 px-2 py-1 rounded text-xs shrink-0 font-mono">telva-core</span> 
                      <span>Canvas engine</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-white bg-white/10 px-2 py-1 rounded text-xs shrink-0 font-mono">telva-vec</span> 
                      <span>2D Vector Math</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-white bg-white/10 px-2 py-1 rounded text-xs shrink-0 font-mono">telva-intersect</span> 
                      <span>Math boundaries</span>
                    </li>
                </ul>
            </div>
        </div>
    </footer>
  )
}

export default Footer