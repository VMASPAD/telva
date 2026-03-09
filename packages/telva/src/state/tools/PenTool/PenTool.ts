import {
  TLCanvasEventHandler,
  TLKeyboardEventHandler,
  TLPointerEventHandler,
  Utils,
} from 'telva-core'
import Vec from 'telva-vec'
import { mirrorHandle, normalizeSegments } from '~state/shapes/PenUtil/penHelpers'
import { BaseTool } from '~state/tools/BaseTool'
import { PenSegment, PenShape, TVShapeType } from '~types'

enum Status {
  Idle = 'idle',
  Drawing = 'drawing', // placed one or more nodes, pointer is UP, waiting
  PlacingHandle = 'placing', // pointer is DOWN, dragging to create handles on new node
}

const DRAG_THRESHOLD = 4 // px before we start creating handles

export class PenTool extends BaseTool<Status> {
  type = TVShapeType.Pen as const

  currentShapeId?: string
  downPoint?: number[] // pointer-down page position
  currentSegmentIdx = 0

  onEnter = () => {
    this.currentShapeId = undefined
    this.downPoint = undefined
    this.currentSegmentIdx = 0
    this.setStatus(Status.Idle)
  }

  onExit = () => {
    // Finish any in-progress shape
    if (this.currentShapeId) this.finishShape()
    this.currentShapeId = undefined
    this.downPoint = undefined
    this.currentSegmentIdx = 0
    this.setStatus(Status.Idle)
  }

  onCancel = () => {
    if (this.currentShapeId) {
      // Delete the incomplete shape
      this.app.delete([this.currentShapeId])
      this.currentShapeId = undefined
    }
    this.downPoint = undefined
    this.currentSegmentIdx = 0
    this.setStatus(Status.Idle)
  }

  // ────────────────────────────────────────────────────────────────────────────
  private getShape(): PenShape | undefined {
    if (!this.currentShapeId) return undefined
    return this.app.getShape<PenShape>(this.currentShapeId)
  }

  private get currentSegments(): PenSegment[] {
    return this.getShape()?.segments ?? []
  }

  private patchCurrentShape(partial: Partial<PenShape>) {
    const shape = this.getShape()
    if (!shape) return

    this.app.patchState({
      document: {
        pages: {
          [this.app.currentPageId]: {
            shapes: { [shape.id]: partial },
          },
        },
      },
    })
  }

  private setPreview(pagePoint: number[], isPlacingHandle: boolean) {
    const shape = this.getShape()
    if (!shape) return

    const previewPoint = Vec.sub(pagePoint, shape.point)
    this.patchCurrentShape({ previewPoint, isPlacingHandle })
  }

  // ────────────────────────────────────────────────────────────────────────────
  private startNewShape(pagePoint: number[]) {
    const {
      appState: { currentPageId, currentStyle },
    } = this.app

    const id = Utils.uniqueId()
    const childIndex = this.getNextChildIndex()

    const firstSeg: PenSegment = { point: [0, 0] }

    const newShape = {
      id,
      type: TVShapeType.Pen,
      name: 'Pen',
      parentId: currentPageId,
      childIndex,
      point: pagePoint,
      rotation: 0,
      style: { ...currentStyle },
      segments: [firstSeg],
      isClosed: false,
      isComplete: false,
      previewPoint: [0, 0],
      isPlacingHandle: true,
    } as PenShape

    this.currentShapeId = id
    this.currentSegmentIdx = 0

    this.app.patchCreate([newShape])
  }

  private addSegment(localPoint: number[], cp1?: number[], cp2?: number[]) {
    const shape = this.getShape()
    if (!shape) return

    const newSeg: PenSegment = { point: localPoint, cp1, cp2 }
    const newSegs = [...shape.segments, newSeg]

    this.currentSegmentIdx = newSegs.length - 1

    this.patchCurrentShape({ segments: newSegs })
  }

  private updateLastSegmentHandles(cp1?: number[], cp2?: number[]) {
    const shape = this.getShape()
    if (!shape || shape.segments.length === 0) return

    const segs = [...shape.segments]
    const last = segs[segs.length - 1]
    segs[segs.length - 1] = {
      ...last,
      cp1,
      cp2,
    }

    this.patchCurrentShape({ segments: segs })
  }

  /** Convert page coordinates to shape-local coordinates */
  private toLocal(pagePoint: number[]): number[] {
    const shape = this.getShape()
    if (!shape) return pagePoint
    return Vec.sub(pagePoint, shape.point)
  }

  /** Detect if a page point is near the first segment (to close path) */
  private isNearFirstNode(pagePoint: number[]): boolean {
    const shape = this.getShape()
    if (!shape || shape.segments.length < 2) return false
    const firstNodePage = Vec.add(shape.point, shape.segments[0].point)
    return Vec.dist(pagePoint, firstNodePage) <= 10 / (this.app.zoom ?? 1)
  }

  private finishShape() {
    const shapeId = this.currentShapeId
    if (!shapeId) return

    const shape = this.app.getShape<PenShape>(shapeId)
    if (!shape) return

    // Normalize positions and mark complete
    const { segments: normalized, offset } = normalizeSegments(shape.segments, shape.isClosed)
    const newPoint = Vec.add(shape.point, offset)

    this.app.updateShapes({
      id: shapeId,
      point: newPoint,
      segments: normalized,
      isComplete: true,
      isPlacingHandle: false,
    })

    this.app.select(shapeId)
    this.currentShapeId = undefined
    this.downPoint = undefined
    this.currentSegmentIdx = 0
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ────────────────────────────────────────────────────────────────────────────

  onPointerDown: TLPointerEventHandler = (info) => {
    if (this.app.readOnly) return
    if (info.spaceKey) return

    const pagePoint = this.app.getPagePoint(info.point)
    this.downPoint = pagePoint

    if (this.status === Status.Idle || !this.currentShapeId) {
      // Start a new shape
      this.startNewShape(pagePoint)
      this.setStatus(Status.PlacingHandle)
      return
    }

    if (this.status === Status.Drawing) {
      // Check if clicking on first node to close path
      if (this.isNearFirstNode(pagePoint)) {
        const shape = this.getShape()
        if (shape && shape.segments.length >= 2) {
          const { segments: normalized, offset } = normalizeSegments(shape.segments, true)
          this.app.updateShapes({
            id: shape.id,
            point: Vec.add(shape.point, offset),
            segments: normalized,
            isClosed: true,
            isComplete: true,
            isPlacingHandle: false,
          })
          this.app.select(shape.id)
          this.currentShapeId = undefined
          this.downPoint = undefined
          this.setStatus(Status.Idle)
          return
        }
      }

      // Add a new segment at this point
      const local = this.toLocal(pagePoint)
      this.addSegment(local)
      this.setPreview(pagePoint, true)
      this.setStatus(Status.PlacingHandle)
    }
  }

  onPointerMove: TLPointerEventHandler = (info) => {
    if (this.app.readOnly) return
    if (info.spaceKey) return

    if (!this.currentShapeId) return

    const pagePoint = this.app.getPagePoint(info.point)

    if (this.status === Status.Drawing) {
      this.setPreview(pagePoint, false)
      return
    }

    if (this.status === Status.PlacingHandle && this.downPoint) {
      this.setPreview(pagePoint, true)
      const dragDist = Vec.dist(pagePoint, this.downPoint)

      if (dragDist > DRAG_THRESHOLD) {
        // Compute drag vector relative to last anchor point in local space
        const shape = this.getShape()
        if (!shape || shape.segments.length === 0) return

        const anchor = shape.segments[shape.segments.length - 1].point
        const localDown = Vec.sub(this.downPoint, shape.point)
        const delta = Vec.sub(Vec.sub(pagePoint, shape.point), localDown)

        // cp2 = anchor + delta (outgoing, in drag direction)
        // cp1 = anchor - delta (incoming, mirror for smooth node)
        const cp2 = Vec.add(anchor, delta)
        const cp1 = mirrorHandle(anchor, cp2)

        this.updateLastSegmentHandles(cp1, cp2)
      } else {
        this.updateLastSegmentHandles(undefined, undefined)
      }
    }
  }

  onPointerUp: TLPointerEventHandler = (info) => {
    if (this.app.readOnly) return
    if (this.status === Status.PlacingHandle) {
      const pagePoint = this.app.getPagePoint(info.point)
      this.setPreview(pagePoint, false)
      this.downPoint = undefined
      this.setStatus(Status.Drawing)
    }
  }

  onDoubleClickCanvas: TLCanvasEventHandler = () => {
    if (this.app.readOnly) return
    if (this.currentShapeId) {
      // Remove the last segment that was added on this double-click's first click
      const shape = this.getShape()
      if (shape && shape.segments.length > 1) {
        const trimmed = shape.segments.slice(0, -1)
        this.patchCurrentShape({ segments: trimmed })
      }
      this.finishShape()
      this.setStatus(Status.Idle)
    }
  }

  onKeyDown: TLKeyboardEventHandler = (key, info, e) => {
    switch (key) {
      case 'Escape': {
        this.onCancel()
        break
      }
      case 'Enter': {
        if (this.currentShapeId) {
          this.finishShape()
          this.setStatus(Status.Idle)
        }
        break
      }
    }
  }
}
