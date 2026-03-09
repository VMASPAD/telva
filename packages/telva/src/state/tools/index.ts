import { TVShapeType, TVToolType } from '~types'
import { ArrowTool } from './ArrowTool'
import { DrawTool } from './DrawTool'
import { EllipseTool } from './EllipseTool'
import { EraseTool } from './EraseTool'
import { LineTool } from './LineTool'
import { PenTool } from './PenTool'
import { RectangleTool } from './RectangleTool'
import { SelectTool } from './SelectTool'
import { StickyTool } from './StickyTool'
import { TextTool } from './TextTool'
import { TriangleTool } from './TriangleTool'

export interface ToolsMap {
  select: typeof SelectTool
  erase: typeof EraseTool
  [TVShapeType.Text]: typeof TextTool
  [TVShapeType.Draw]: typeof DrawTool
  [TVShapeType.Ellipse]: typeof EllipseTool
  [TVShapeType.Rectangle]: typeof RectangleTool
  [TVShapeType.Triangle]: typeof TriangleTool
  [TVShapeType.Line]: typeof LineTool
  [TVShapeType.Arrow]: typeof ArrowTool
  [TVShapeType.Sticky]: typeof StickyTool
  [TVShapeType.Pen]: typeof PenTool
}

export type ToolOfType<K extends TVToolType> = ToolsMap[K]

export type ArgsOfType<K extends TVToolType> = ConstructorParameters<ToolOfType<K>>

export const tools: { [K in TVToolType]: ToolsMap[K] } = {
  select: SelectTool,
  erase: EraseTool,
  [TVShapeType.Text]: TextTool,
  [TVShapeType.Draw]: DrawTool,
  [TVShapeType.Ellipse]: EllipseTool,
  [TVShapeType.Rectangle]: RectangleTool,
  [TVShapeType.Triangle]: TriangleTool,
  [TVShapeType.Line]: LineTool,
  [TVShapeType.Arrow]: ArrowTool,
  [TVShapeType.Sticky]: StickyTool,
  [TVShapeType.Pen]: PenTool,
}
