import { createStitches, defaultThemeMap } from '@stitches/react'

const { styled, createTheme } = createStitches({
  themeMap: {
    ...defaultThemeMap,
  },
  theme: {
    colors: {
      bounds: 'rgba(13, 153, 255, 1)',
      boundsBg: 'rgba(13, 153, 255, 0.05)',
      hover: '#3a3a3a',
      overlay: 'rgba(0, 0, 0, 0.25)',
      overlayContrast: 'rgba(255, 255, 255, 0.1)',
      panel: '#2C2C2C',
      panelContrast: '#444444',
      selected: 'rgba(13, 153, 255, 1)',
      selectedContrast: '#ffffff',
      text: '#E8EAED',
      tooltip: '#1a1a1a',
      tooltipContrast: '#ffffff',
      warn: 'rgba(255, 100, 100, 1)',
      canvas: '#ffffffff',
      separator: '#444444',
      inputBg: '#383838',
      inputBorder: '#555555',
      textSecondary: '#9AA0A6',
      accent: '#0D99FF',
    },
    shadows: {
      2: '0px 1px 2px rgba(0, 0, 0, 0.3)',
      3: '0px 2px 4px rgba(0, 0, 0, 0.3)',
      4: '0px 4px 8px rgba(0, 0, 0, 0.3)',
      8: '0px 8px 16px rgba(0, 0, 0, 0.3)',
      12: '0px 12px 24px rgba(0, 0, 0, 0.3)',
      24: '0px 24px 48px rgba(0, 0, 0, 0.3)',
      key: '1px 1px rgba(0,0,0,1)',
      panel: `0px 0px 12px -2px rgba(0, 0, 0, 0.3), 
        0px 0px 8px -4px rgba(0, 0, 0, 0.2)`,
    },
    space: {
      0: '2px',
      1: '3px',
      2: '4px',
      3: '8px',
      4: '12px',
      5: '16px',
      6: '32px',
      7: '48px',
    },
    fontSizes: {
      0: '10px',
      1: '11px',
      2: '12px',
      3: '13px',
      4: '16px',
    },
    fonts: {
      ui: '"DM Sans", system-ui, -apple-system, sans-serif',
      body: '"DM Sans", system-ui, -apple-system, sans-serif',
      mono: '"Source Code Pro", monospace',
    },
    fontWeights: {},
    lineHeights: {},
    letterSpacings: {},
    sizes: {},
    borderWidths: {
      0: '$1',
    },
    borderStyles: {},
    radii: {
      0: '4px',
      1: '6px',
      2: '8px',
      3: '10px',
      4: '14px',
      pill: '9999px',
    },
    zIndices: {},
    transitions: {},
  },
  media: {
    micro: '(max-width: 370px)',
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
  },
  utils: {
    zStrokeWidth: () => (value: number | number[]) => {
      if (Array.isArray(value)) {
        return {
          strokeWidth: `calc(${value[0]}px / var(--tv-zoom))`,
        }
      }

      return {
        strokeWidth: `calc(${value}px / var(--tv-zoom))`,
      }
    },
  },
})

export const dark = createTheme({
  colors: {
    bounds: 'rgba(13, 153, 255, 1)',
    boundsBg: 'rgba(13, 153, 255, 0.05)',
    hover: '#444A50',
    overlay: 'rgba(0, 0, 0, 0.2)',
    overlayContrast: 'rgba(255, 255, 255, 0.1)',
    panel: '#1E1E1E',
    panelContrast: '#444444',
    selected: 'rgba(13, 153, 255, 1)',
    selectedContrast: '#ffffff',
    text: '#E8EAED',
    tooltip: '#111111',
    tooltipContrast: '#ffffff',
    canvas: '#141414',
    separator: '#333333',
    inputBg: '#2A2A2A',
    inputBorder: '#444444',
    textSecondary: '#888888',
    accent: '#0D99FF',
  },
  shadows: {
    2: '0px 1px 2px rgba(0, 0, 0, 0.4)',
    3: '0px 2px 4px rgba(0, 0, 0, 0.4)',
    4: '0px 4px 8px rgba(0, 0, 0, 0.4)',
    8: '0px 8px 16px rgba(0, 0, 0, 0.4)',
    12: '0px 12px 24px rgba(0, 0, 0, 0.4)',
    24: '0px 24px 48px rgba(0, 0, 0, 0.4)',
    panel: `0px 0px 12px -2px rgba(0, 0, 0, 0.4), 
      0px 0px 8px -4px rgba(0, 0, 0, 0.3)`,
  },
})

export { styled }
