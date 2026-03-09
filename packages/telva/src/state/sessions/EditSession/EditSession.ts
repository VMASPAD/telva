import type { TelvaApp } from '~state/TelvaApp'
import { BaseSession } from '~state/sessions/BaseSession'
import { SessionType, TVShape, TelvaCommand, TelvaPatch } from '~types'

export class EditSession extends BaseSession {
  type = SessionType.Edit
  performanceMode = undefined

  initialShape: TVShape
  initialSelectedIds: string[]
  currentPageId: string
  isCreating: boolean

  constructor(app: TelvaApp, id: string, isCreating: boolean) {
    super(app)
    this.initialShape = app.getShape(id, app.currentPageId)
    this.currentPageId = app.currentPageId
    this.isCreating = isCreating
    this.initialSelectedIds = [...app.selectedIds]
  }

  start = (): TelvaPatch | undefined => void null

  update = (): TelvaPatch | undefined => void null

  cancel = (): TelvaPatch | undefined => {
    return {
      document: {
        pages: {
          [this.currentPageId]: {
            shapes: {
              [this.initialShape.id]: this.isCreating ? undefined : this.initialShape,
            },
          },
        },
        pageStates: {
          [this.currentPageId]: {
            selectedIds: this.isCreating ? [] : this.initialSelectedIds,
            editingId: undefined,
          },
        },
      },
    }
  }

  complete = (): TelvaPatch | TelvaCommand | undefined => {
    const shape = this.app.getShape(this.initialShape.id)

    return {
      id: 'edit',
      before: {
        document: {
          pages: {
            [this.currentPageId]: {
              shapes: {
                [this.initialShape.id]: this.isCreating ? undefined : this.initialShape,
              },
            },
          },
          pageStates: {
            [this.currentPageId]: {
              selectedIds: this.isCreating ? [] : this.initialSelectedIds,
              editingId: undefined,
            },
          },
        },
      },
      after: {
        document: {
          pages: {
            [this.currentPageId]: {
              shapes: {
                [this.initialShape.id]: shape,
              },
            },
          },
          pageStates: {
            [this.currentPageId]: {
              selectedIds: [shape.id],
              editingId: undefined,
            },
          },
        },
      },
    }
  }
}
