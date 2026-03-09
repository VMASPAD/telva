import { LETTER_SPACING } from '~constants'
import { FontStyle } from '~types'

let melm: any

function getMeasurementDiv() {
  // A div used for measurement
  document.getElementById('__textLabelMeasure')?.remove()

  const pre = document.createElement('pre')
  pre.id = '__textLabelMeasure'

  Object.assign(pre.style, {
    whiteSpace: 'pre',
    width: 'auto',
    border: '1px solid transparent',
    padding: '4px',
    margin: '0px',
    letterSpacing: LETTER_SPACING,
    opacity: '0',
    position: 'absolute',
    top: '-500px',
    left: '0px',
    zIndex: '9999',
    pointerEvents: 'none',
    userSelect: 'none',
    '-webkit-user-select': 'none',
    alignmentBaseline: 'mathematical',
    dominantBaseline: 'mathematical',
  })

  pre.tabIndex = -1

  document.body.appendChild(pre)
  return pre
}

if (typeof window !== 'undefined') {
  melm = getMeasurementDiv()
}

let prevText = ''
const prevFont = ''
const prevSize = [0, 0]

export function clearPrevSize() {
  prevText = ''
}

export function getTextLabelSize(text: string, font: string, maxWidth?: number) {
  if (!text) {
    return [16, 32]
  }

  if (!melm) {
    // We're in SSR
    return [10, 10]
  }

  if (!melm.parent) document.body.appendChild(melm)

  melm.textContent = text
  melm.style.font = font

  if (maxWidth) {
    melm.style.whiteSpace = 'pre-wrap'
    melm.style.wordBreak = 'break-word'
    melm.style.width = `${maxWidth}px`
  } else {
    melm.style.whiteSpace = 'pre'
    melm.style.wordBreak = 'normal'
    melm.style.width = 'auto'
  }

  // In tests, offsetWidth and offsetHeight will be 0
  const width = melm.offsetWidth || 1
  const height = melm.offsetHeight || 1

  return [width, height]
}
