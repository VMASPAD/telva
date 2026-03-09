import type { TVShapeUtil } from '~state/shapes/TVShapeUtil'
import { TVShape, TVShapeType } from '~types'
import { ArrowUtil } from './ArrowUtil'
import { DrawUtil } from './DrawUtil'
import { EllipseUtil } from './EllipseUtil'
import { GroupUtil } from './GroupUtil'
import { ImageUtil } from './ImageUtil'
import { PenUtil } from './PenUtil'
import { ReactComponentUtil } from './ReactComponentUtil/ReactComponentUtil'
import { RectangleUtil } from './RectangleUtil'
import { StickyUtil } from './StickyUtil'
import { TextUtil } from './TextUtil'
import { TriangleUtil } from './TriangleUtil'
import { VideoUtil } from './VideoUtil'

export const Rectangle = new RectangleUtil()
export const Triangle = new TriangleUtil()
export const Ellipse = new EllipseUtil()
export const Draw = new DrawUtil()
export const Arrow = new ArrowUtil()
export const Text = new TextUtil()
export const Group = new GroupUtil()
export const Sticky = new StickyUtil()
export const Image = new ImageUtil()
export const Video = new VideoUtil()
export const ReactComponent = new ReactComponentUtil()
export const Pen = new PenUtil()

export const shapeUtils = {
  [TVShapeType.Rectangle]: Rectangle,
  [TVShapeType.Triangle]: Triangle,
  [TVShapeType.Ellipse]: Ellipse,
  [TVShapeType.Draw]: Draw,
  [TVShapeType.Arrow]: Arrow,
  [TVShapeType.Text]: Text,
  [TVShapeType.Group]: Group,
  [TVShapeType.Sticky]: Sticky,
  [TVShapeType.Image]: Image,
  [TVShapeType.Video]: Video,
  [TVShapeType.ReactComponent]: ReactComponent,
  [TVShapeType.Pen]: Pen,
}

export const getShapeUtil = <T extends TVShape>(shape: T | T['type']) => {
  if (typeof shape === 'string') return shapeUtils[shape] as unknown as TVShapeUtil<T>
  return shapeUtils[shape.type] as unknown as TVShapeUtil<T>
}
