import * as React from 'react'
import type { TLTheme } from '~types'

const styles = new Map<string, HTMLStyleElement>()

type AnyTheme = Record<string, string>

function makeCssTheme<T = AnyTheme>(prefix: string, theme: T) {
  return Object.keys(theme).reduce((acc, key) => {
    const value = theme[key as keyof T]
    if (value) {
      return acc + `${`--${prefix}-${key}`}: ${value};\n`
    }
    return acc
  }, '')
}

function useTheme<T = AnyTheme>(prefix: string, theme: T, selector = ':root') {
  React.useLayoutEffect(() => {
    const style = document.createElement('style')
    const cssTheme = makeCssTheme(prefix, theme)

    style.setAttribute('id', `${prefix}-theme`)
    style.setAttribute('data-selector', selector)
    style.innerHTML = `
        ${selector} {
          ${cssTheme}
        }
      `

    document.head.appendChild(style)

    return () => {
      if (style && document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [prefix, theme, selector])
}

function useStyle(uid: string, rules: string) {
  React.useLayoutEffect(() => {
    if (styles.get(uid)) {
      return () => void null
    }

    const style = document.createElement('style')
    style.innerHTML = rules
    style.setAttribute('id', uid)
    document.head.appendChild(style)
    styles.set(uid, style)

    return () => {
      if (style && document.head.contains(style)) {
        document.head.removeChild(style)
        styles.delete(uid)
      }
    }
  }, [uid, rules])
}

const css = (strings: TemplateStringsArray, ...args: unknown[]) =>
  strings.reduce(
    (acc, string, index) => acc + string + (index < args.length ? args[index] : ''),
    ''
  )

const defaultTheme: TLTheme = {
  accent: 'rgb(255, 0, 0)',
  brushFill: 'rgba(0,0,0,.05)',
  brushStroke: 'rgba(0,0,0,.25)',
  brushDashStroke: 'rgba(0,0,0,.6)',
  selectStroke: 'rgb(66, 133, 244)',
  selectFill: 'rgba(65, 132, 244, 0.05)',
  binding: 'rgba(65, 132, 244, 0.12)',
  background: 'rgb(248, 249, 250)',
  foreground: 'rgb(51, 51, 51)',
  grid: 'rgba(144, 144, 144, 1)',
}

export const TLCSS = css`
  .tv-container {
    --tv-zoom: 1;
    --tv-scale: calc(1 / var(--tv-zoom));
    --tv-padding: calc(64px * max(1, var(--tv-scale)));
    --tv-performance-all: auto;
    --tv-performance-selected: auto;
    position: relative;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    box-sizing: border-box;
    padding: 0px;
    margin: 0px;
    z-index: 100;
    overflow: hidden;
    touch-action: none;
    overscroll-behavior: none;
    background-color: var(--tv-background);
  }
  .tv-container * {
    box-sizing: border-box;
  }
  .tv-overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    touch-action: none;
    pointer-events: none;
  }
  .tv-grid {
    position: absolute;
    width: 100%;
    height: 100%;
    touch-action: none;
    pointer-events: none;
    user-select: none;
  }
  .tv-snap-line {
    stroke: var(--tv-accent);
    stroke-width: calc(1px * var(--tv-scale));
  }
  .tv-snap-point {
    stroke: var(--tv-accent);
    stroke-width: calc(1px * var(--tv-scale));
  }
  .tv-canvas {
    position: absolute;
    width: 100%;
    height: 100%;
    touch-action: none;
    pointer-events: all;
    overflow: clip;
  }
  .tv-layer {
    position: absolute;
    top: 0px;
    left: 0px;
    height: 0px;
    width: 0px;
    contain: layout style size;
  }
  .tv-absolute {
    position: absolute;
    top: 0px;
    left: 0px;
    transform-origin: center center;
    contain: layout style size;
  }
  .tv-positioned {
    position: absolute;
    top: 0px;
    left: 0px;
    transform-origin: center center;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    contain: layout style size;
    will-change: var(--tv-performance-all);
  }
  .tv-positioned-svg {
    width: 100%;
    height: 100%;
    overflow: hidden;
    contain: layout style size;
  }
  .tv-positioned-div {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    padding: var(--tv-padding);
    overflow: hidden;
    contain: layout style size;
  }
  .tv-positioned-selected {
    will-change: var(--tv-performance-selected);
  }
  .tv-inner-div {
    position: relative;
    width: 100%;
    height: 100%;
    pointer-events: all;
  }
  .tv-stroke-hitarea {
    fill: none;
    stroke: transparent;
    stroke-width: calc(24px * var(--tv-scale));
    pointer-events: stroke;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .tv-fill-hitarea {
    fill: transparent;
    stroke: transparent;
    stroke-width: calc(24px * var(--tv-scale));
    pointer-events: all;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .tv-counter-scaled {
    transform: scale(var(--tv-scale));
  }
  .tv-dashed {
    stroke-dasharray: calc(2px * var(--tv-scale)), calc(2px * var(--tv-scale));
  }
  .tv-transparent {
    fill: transparent;
    stroke: transparent;
  }
  .tv-cursor-ns {
    cursor: ns-resize;
  }
  .tv-cursor-ew {
    cursor: ew-resize;
  }
  .tv-cursor-nesw {
    cursor: nesw-resize;
  }
  .tv-cursor-nwse {
    cursor: nwse-resize;
  }
  .tv-corner-handle {
    stroke: var(--tv-selectStroke);
    fill: var(--tv-background);
    stroke-width: calc(1.5px * var(--tv-scale));
  }
  .tv-rotate-handle {
    stroke: var(--tv-selectStroke);
    fill: var(--tv-background);
    stroke-width: calc(1.5px * var(--tv-scale));
    cursor: grab;
  }
  .tv-binding {
    fill: var(--tv-selectFill);
    stroke: var(--tv-selectStroke);
    stroke-width: calc(1px * var(--tv-scale));
    pointer-events: none;
  }
  .tv-user {
    left: calc(-15px * var(--tv-scale));
    top: calc(-15px * var(--tv-scale));
    height: calc(35px * var(--tv-scale));
    width: calc(35px * var(--tv-scale));
    transform: scale(var(--tv-scale));
    pointer-events: none;
    will-change: transform;
  }
  .tv-animated {
    transition: transform 200ms linear;
  }
  .tv-indicator {
    fill: transparent;
    stroke-width: calc(1.5px * var(--tv-scale));
    pointer-events: none;
  }
  .tv-user-indicator-bounds {
    border-style: solid;
    border-width: calc(1px * var(--tv-scale));
  }
  .tv-hovered {
    stroke: var(--tv-selectStroke);
  }
  .tv-selected {
    stroke: var(--tv-selectStroke);
  }
  .tv-locked {
    stroke-dasharray: calc(3px * var(--tv-scale)) calc(3px * var(--tv-scale));
  }
  .tv-editing {
    stroke-width: calc(2.5px * min(5, var(--tv-scale)));
  }
  .tv-performance {
    will-change: transform, contents;
  }
  .tv-clone-target {
    pointer-events: all;
  }
  .tv-clone-target:hover .tv-clone-button {
    opacity: 1;
  }
  .tv-clone-button-target {
    cursor: pointer;
    pointer-events: all;
  }
  .tv-clone-button-target:hover .tv-clone-button {
    fill: var(--tv-selectStroke);
  }
  .tv-clone-button {
    opacity: 0;
    r: calc(8px * var(--tv-scale));
    stroke-width: calc(1.5px * var(--tv-scale));
    stroke: var(--tv-selectStroke);
    fill: var(--tv-background);
  }
  .tv-bounds {
    pointer-events: none;
    contain: layout style size;
  }
  .tv-bounds-bg {
    stroke: none;
    fill: var(--tv-selectFill);
    pointer-events: all;
    contain: layout style size;
  }
  .tv-bounds-center {
    fill: transparent;
    stroke: var(--tv-selectStroke);
    stroke-width: calc(1.5px * var(--tv-scale));
  }
  .tv-brush {
    fill: var(--tv-brushFill);
    stroke: var(--tv-brushStroke);
    stroke-width: calc(1px * var(--tv-scale));
    pointer-events: none;
    contain: layout style size;
  }
  .tv-dashed-brush-line {
    fill: none;
    stroke: var(--tv-brushDashStroke);
    stroke-width: calc(1px * var(--tv-scale));
    pointer-events: none;
  }
  .tv-brush.dashed {
    stroke: none;
  }
  .tv-handle {
    pointer-events: all;
    cursor: grab;
  }
  .tv-handle:hover .tv-handle-bg {
    fill: var(--tv-selectFill);
  }
  .tv-handle:hover .tv-handle-bg > * {
    stroke: var(--tv-selectFill);
  }
  .tv-handle:active .tv-handle-bg {
    cursor: grabbing;
    fill: var(--tv-selectFill);
  }
  .tv-handle:active .tv-handle-bg > * {
    stroke: var(--tv-selectFill);
  }
  .tv-handle {
    fill: var(--tv-background);
    stroke: var(--tv-selectStroke);
    stroke-width: 1.5px;
  }
  .tv-handle-bg {
    fill: transparent;
    stroke: none;
    pointer-events: all;
    r: calc(16px / max(1, var(--tv-zoom)));
  }
  .tv-binding-indicator {
    fill: transparent;
    stroke: var(--tv-binding);
  }
  .tv-centered-g {
    transform: translate(var(--tv-padding), var(--tv-padding));
  }
  .tv-current-parent > *[data-shy='true'] {
    opacity: 1;
  }
  .tv-binding {
    fill: none;
    stroke: var(--tv-selectStroke);
    stroke-width: calc(2px * var(--tv-scale));
  }
  .tv-grid-dot {
    fill: var(--tv-grid);
  }
  .tv-erase-line {
    stroke-linejoin: round;
    stroke-linecap: round;
    pointer-events: none;
    fill: var(--tv-grid);
    opacity: 0.32;
  }
`

export function useTLTheme(theme?: Partial<TLTheme>, selector?: string) {
  const tltheme = React.useMemo<TLTheme>(
    () => ({
      ...defaultTheme,
      ...theme,
    }),
    [theme]
  )

  useTheme('tv', tltheme, selector)

  useStyle('tv-canvas', TLCSS)
}
