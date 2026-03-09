import {
  TLBoundsCorner,
  TLBoundsEdge,
  TLBoundsEventHandler,
  TLBoundsHandleEventHandler,
  TLCanvasEventHandler,
  TLKeyboardEventHandler,
  TLPointerEventHandler,
  TLShapeCloneHandler,
  Utils,
} from 'telva-core'
import Vec from 'telva-vec'
import { CLONING_DISTANCE, DEAD_ZONE } from '~constants'
import { TVDR } from '~state/TVDR'
import { simplifyPoints } from '~state/shapes/DrawUtil/drawHelpers'
import { BaseTool } from '~state/tools/BaseTool'
import { DrawShape, SessionType, TVShapeType } from '~types'

enum Status {
  Idle = 'idle',
  Creating = 'creating',
  Pinching = 'pinching',
  PointingCanvas = 'pointingCanvas',
  PointingHandle = 'pointingHandle',
  PointingBounds = 'pointingBounds',
  PointingClone = 'pointingClone',
  TranslatingClone = 'translatingClone',
  PointingBoundsHandle = 'pointingBoundsHandle',
  TranslatingHandle = 'translatingHandle',
  Translating = 'translating',
  Transforming = 'transforming',
  Rotating = 'rotating',
  Brushing = 'brushing',
  GridCloning = 'gridCloning',
  ClonePainting = 'clonePainting',
}

export class PenEditTool extends BaseTool<Status> {
  type = TVShapeType.Pen as const

  pointedId?: string

  selectedGroupId?: string

  pointedHandleId?: 'start' | 'end' | 'bend'

  pointedBoundsHandle?: TLBoundsCorner | TLBoundsEdge | 'rotate' | 'center' | 'left' | 'right'

  pointedLinkHandleId?: 'left' | 'center' | 'right'

  /* --------------------- Methods -------------------- */

  onEnter = () => {
    this.setStatus(Status.Idle)
  }

  onExit = () => {
    this.setStatus(Status.Idle)
  }

  /* ----------------- Event Handlers ----------------- */

  onCancel = () => {
    if (this.app.appState.nodeEditingId) {
      this.app.setNodeEditingId(undefined)
      this.app.selectTool('select')
    }
    this.setStatus(Status.Idle)
  }

  onPointerDown: TLPointerEventHandler = (info, e) => {
    if (info.target === 'canvas') {
      this.onCancel()
    }
  }

  onPointerMove: TLPointerEventHandler = (info) => {
    if (this.status === Status.Idle && info.target === 'handle') {
      this.setStatus(Status.PointingHandle)
    }
  }

  onPointerUp: TLPointerEventHandler = (info) => {
    if (info.target === 'bounds') {
      this.onCancel()
    }
  }

  onKeyDown: TLKeyboardEventHandler = (key) => {
    switch (key) {
      case 'Enter':
      case 'Escape': {
        this.onCancel()
        break
      }
    }
  }
}
