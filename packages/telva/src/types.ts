import type {
  TLAsset,
  TLBinding,
  TLBoundsCorner,
  TLBoundsEdge,
  TLBoundsEventHandler,
  TLBoundsHandleEventHandler,
  TLCanvasEventHandler,
  TLHandle,
  TLKeyboardEventHandler,
  TLPage,
  TLPageState,
  TLPinchEventHandler,
  TLPointerEventHandler,
  TLShape,
  TLShapeBlurHandler,
  TLShapeCloneHandler,
  TLSnapLine,
  TLUser,
  TLWheelEventHandler,
} from 'telva-core'
import { TVLanguage } from '~translations'

/* -------------------------------------------------- */
/*                         App                        */
/* -------------------------------------------------- */

// A base class for all classes that handle events from the Renderer,
// including TVApp and all Tools.
export class TVEventHandler {
  onPinchStart?: TLPinchEventHandler
  onPinchEnd?: TLPinchEventHandler
  onPinch?: TLPinchEventHandler
  onKeyDown?: TLKeyboardEventHandler
  onKeyUp?: TLKeyboardEventHandler
  onPointerMove?: TLPointerEventHandler
  onPointerUp?: TLPointerEventHandler
  onPan?: TLWheelEventHandler
  onZoom?: TLWheelEventHandler
  onPointerDown?: TLPointerEventHandler
  onPointCanvas?: TLCanvasEventHandler
  onDoubleClickCanvas?: TLCanvasEventHandler
  onRightPointCanvas?: TLCanvasEventHandler
  onDragCanvas?: TLCanvasEventHandler
  onReleaseCanvas?: TLCanvasEventHandler
  onPointShape?: TLPointerEventHandler
  onDoubleClickShape?: TLPointerEventHandler
  onRightPointShape?: TLPointerEventHandler
  onDragShape?: TLPointerEventHandler
  onHoverShape?: TLPointerEventHandler
  onUnhoverShape?: TLPointerEventHandler
  onReleaseShape?: TLPointerEventHandler
  onPointBounds?: TLBoundsEventHandler
  onDoubleClickBounds?: TLBoundsEventHandler
  onRightPointBounds?: TLBoundsEventHandler
  onDragBounds?: TLBoundsEventHandler
  onHoverBounds?: TLBoundsEventHandler
  onUnhoverBounds?: TLBoundsEventHandler
  onReleaseBounds?: TLBoundsEventHandler
  onPointBoundsHandle?: TLBoundsHandleEventHandler
  onDoubleClickBoundsHandle?: TLBoundsHandleEventHandler
  onRightPointBoundsHandle?: TLBoundsHandleEventHandler
  onDragBoundsHandle?: TLBoundsHandleEventHandler
  onHoverBoundsHandle?: TLBoundsHandleEventHandler
  onUnhoverBoundsHandle?: TLBoundsHandleEventHandler
  onReleaseBoundsHandle?: TLBoundsHandleEventHandler
  onPointHandle?: TLPointerEventHandler
  onDoubleClickHandle?: TLPointerEventHandler
  onRightPointHandle?: TLPointerEventHandler
  onDragHandle?: TLPointerEventHandler
  onHoverHandle?: TLPointerEventHandler
  onUnhoverHandle?: TLPointerEventHandler
  onReleaseHandle?: TLPointerEventHandler
  onShapeBlur?: TLShapeBlurHandler
  onShapeClone?: TLShapeCloneHandler
}

export type TVDockPosition = 'bottom' | 'left' | 'right' | 'top'

// The shape of the TelvaApp's React (zustand) store
export interface TVSnapshot {
  settings: {
    isCadSelectMode: boolean
    isDarkMode: boolean
    isDebugMode: boolean
    isPenMode: boolean
    isReadonlyMode: boolean
    isZoomSnap: boolean
    keepStyleMenuOpen: boolean
    nudgeDistanceSmall: number
    nudgeDistanceLarge: number
    isFocusMode: boolean
    isSnapping: boolean
    showRotateHandles: boolean
    showBindingHandles: boolean
    showCloneHandles: boolean
    showGrid: boolean
    language: TVLanguage
    dockPosition: TVDockPosition
    exportBackground: TVExportBackground
    canvasMode: 'freehand' | 'straight'
  }
  appState: {
    currentStyle: ShapeStyles
    currentPageId: string
    hoveredId?: string
    activeTool: TVToolType
    isToolLocked: boolean
    isEmptyCanvas: boolean
    isMenuOpen: boolean
    status: string
    snapLines: TLSnapLine[]
    eraseLine: number[][]
    isLoading: boolean
    disableAssets: boolean
    selectByContain?: boolean
    nodeEditingId?: string
  }
  document: TVDocument
  room?: {
    id: string
    userId: string
    users: Record<string, TVUser>
  }
}

export type TelvaPatch = Patch<TVSnapshot>

export type TelvaCommand = Command<TVSnapshot>

// The shape of the files stored in JSON
export interface TVFile {
  name: string
  fileHandle: FileSystemFileHandle | null
  document: TVDocument
}

// The shape of the Telva document
export interface TVDocument {
  id: string
  name: string
  version: number
  pages: Record<string, TVPage>
  pageStates: Record<string, TLPageState>
  assets: TVAssets
}

// The shape of a single page in the Telva document
export type TVPage = TLPage<TVShape, TVBinding>

// A partial of a TVPage, used for commands / patches
export type PagePartial = {
  shapes: Patch<TVPage['shapes']>
  bindings: Patch<TVPage['bindings']>
}

// The meta information passed to TVShapeUtil components
export interface TVMeta {
  isDarkMode: boolean
  canvasMode: 'freehand' | 'straight'
  nodeEditingId?: string
}

// The type of info given to shapes when transforming
export interface TransformInfo<T extends TLShape> {
  type: TLBoundsEdge | TLBoundsCorner
  initialShape: T
  scaleX: number
  scaleY: number
  transformOrigin: number[]
}

// The status of a TVUser
export enum TVUserStatus {
  Idle = 'idle',
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnected = 'disconnected',
}

// A TVUser, for multiplayer rooms
export interface TVUser extends TLUser {
  activeShapes: TVShape[]
  status: TVUserStatus
  session?: boolean
}

export type Theme = 'dark' | 'light'

export enum SessionType {
  Transform = 'transform',
  Translate = 'translate',
  TransformSingle = 'transformSingle',
  Brush = 'brush',
  Arrow = 'arrow',
  Draw = 'draw',
  Erase = 'erase',
  Rotate = 'rotate',
  Handle = 'handle',
  Grid = 'grid',
  Edit = 'edit',
}

export enum TVStatus {
  Idle = 'idle',
  PointingHandle = 'pointingHandle',
  PointingBounds = 'pointingBounds',
  PointingBoundsHandle = 'pointingBoundsHandle',
  TranslatingLabel = 'translatingLabel',
  TranslatingHandle = 'translatingHandle',
  Translating = 'translating',
  Transforming = 'transforming',
  Rotating = 'rotating',
  Pinching = 'pinching',
  Brushing = 'brushing',
  Creating = 'creating',
  EditingText = 'editing-text',
}

export type TVToolType =
  | 'select'
  | 'erase'
  | TVShapeType.Text
  | TVShapeType.Draw
  | TVShapeType.Pen
  | TVShapeType.Ellipse
  | TVShapeType.Rectangle
  | TVShapeType.Triangle
  | TVShapeType.Line
  | TVShapeType.Arrow
  | TVShapeType.Sticky

export type Easing =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInQuart'
  | 'easeOutQuart'
  | 'easeInOutQuart'
  | 'easeInQuint'
  | 'easeOutQuint'
  | 'easeInOutQuint'
  | 'easeInSine'
  | 'easeOutSine'
  | 'easeInOutSine'
  | 'easeInExpo'
  | 'easeOutExpo'
  | 'easeInOutExpo'

export enum MoveType {
  Backward = 'backward',
  Forward = 'forward',
  ToFront = 'toFront',
  ToBack = 'toBack',
}

export enum AlignType {
  Top = 'top',
  CenterVertical = 'centerVertical',
  Bottom = 'bottom',
  Left = 'left',
  CenterHorizontal = 'centerHorizontal',
  Right = 'right',
}

export enum StretchType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export enum DistributeType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export enum FlipType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

/* -------------------------------------------------- */
/*                       Shapes                       */
/* -------------------------------------------------- */

export enum TVShapeType {
  Sticky = 'sticky',
  Ellipse = 'ellipse',
  Rectangle = 'rectangle',
  Triangle = 'triangle',
  Draw = 'draw',
  Arrow = 'arrow',
  Line = 'line',
  Text = 'text',
  Group = 'group',
  Image = 'image',
  Video = 'video',
  ReactComponent = 'reactComponent',
  Pen = 'pen',
}

export enum Decoration {
  Arrow = 'arrow',
}

export type EffectType =
  | 'dropShadow'
  | 'layerBlur'
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'saturate'
  | 'hueRotate'
  | 'grayscale'
  | 'sepia'
  | 'invert'

export interface TVEffect {
  id: string
  type: EffectType
  enabled: boolean
  value?: number // default value placeholder
  // Specific to dropShadow
  x?: number
  y?: number
  blur?: number
  spread?: number
  color?: string
}

export interface TVBaseShape extends TLShape {
  style: ShapeStyles
  type: TVShapeType
  label?: string
  handles?: Record<string, TVHandle>
  effects?: TVEffect[] | Record<string, any>
}

export interface DrawShape extends TVBaseShape {
  type: TVShapeType.Draw
  points: number[][]
  isComplete: boolean
}

// The extended handle (used for arrows)
export interface TVHandle extends TLHandle {
  canBind?: boolean
  bindingId?: string
}

export interface RectangleShape extends TVBaseShape {
  type: TVShapeType.Rectangle
  size: number[]
  label?: string
  labelPoint?: number[]
}

export interface EllipseShape extends TVBaseShape {
  type: TVShapeType.Ellipse
  radius: number[]
  label?: string
  labelPoint?: number[]
}

export interface TriangleShape extends TVBaseShape {
  type: TVShapeType.Triangle
  size: number[]
  label?: string
  labelPoint?: number[]
}

// The shape created with the arrow tool
export interface ArrowShape extends TVBaseShape {
  type: TVShapeType.Arrow
  bend: number
  handles: {
    start: TVHandle
    bend: TVHandle
    end: TVHandle
  }
  decorations?: {
    start?: Decoration
    end?: Decoration
    middle?: Decoration
  }
  label?: string
  labelPoint?: number[]
}

export interface ArrowBinding extends TLBinding {
  handleId: keyof ArrowShape['handles']
  distance: number
  point: number[]
}

export type TVBinding = ArrowBinding

export interface ImageShape extends TVBaseShape {
  type: TVShapeType.Image
  size: number[]
  assetId: string
}

export interface VideoShape extends TVBaseShape {
  type: TVShapeType.Video
  size: number[]
  assetId: string
  isPlaying: boolean
  currentTime: number
}

// The shape created by the text tool
export interface TextShape extends TVBaseShape {
  type: TVShapeType.Text
  text: string
  size?: number[]
}

// The shape created by the sticky tool
export interface StickyShape extends TVBaseShape {
  type: TVShapeType.Sticky
  size: number[]
  text: string
}

// The shape created when multiple shapes are grouped
export interface GroupShape extends TVBaseShape {
  type: TVShapeType.Group
  size: number[]
  children: string[]
}

// A live React component rendered on the canvas
export interface ReactComponentShape extends TVBaseShape {
  type: TVShapeType.ReactComponent
  size: number[]
  /** ID matching a ReactComponentEntry in the registry */
  componentId: string
}

// The shape created by the Figma-style pen tool (Bézier vector paths)
export interface PenSegment {
  point: number[] // [x, y] anchor point in shape-local space
  cp1?: number[] // incoming bezier handle (from prev segment)
  cp2?: number[] // outgoing bezier handle (to next segment)
}

export interface PenShape extends TVBaseShape {
  type: TVShapeType.Pen
  segments: PenSegment[]
  isClosed: boolean
  isComplete: boolean
  /** Cursor position in shape-local space, used for live preview while drawing */
  previewPoint?: number[]
  /** True while pointer is held and handles are being placed */
  isPlacingHandle?: boolean
}

// A union of all shapes
export type TVShape =
  | RectangleShape
  | EllipseShape
  | TriangleShape
  | DrawShape
  | ArrowShape
  | TextShape
  | GroupShape
  | StickyShape
  | ImageShape
  | VideoShape
  | ReactComponentShape
  | PenShape

/* ------------------ Shape Styles ------------------ */

export enum ColorStyle {
  White = 'white',
  LightGray = 'lightGray',
  Gray = 'gray',
  Black = 'black',
  Green = 'green',
  Cyan = 'cyan',
  Blue = 'blue',
  Indigo = 'indigo',
  Violet = 'violet',
  Red = 'red',
  Orange = 'orange',
  Yellow = 'yellow',
}

export enum SizeStyle {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export enum DashStyle {
  Draw = 'draw',
  Solid = 'solid',
  Dashed = 'dashed',
  Dotted = 'dotted',
}

export enum FontSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  ExtraLarge = 'extraLarge',
}

export enum AlignStyle {
  Start = 'start',
  Middle = 'middle',
  End = 'end',
  Justify = 'justify',
}

export enum FontStyle {
  Script = 'script',
  Sans = 'sans',
  Serif = 'serif',
  Mono = 'mono',
}

export interface GradientStop {
  color: string
  position: number
  opacity: number
}

export type GradientType = 'linear' | 'radial' | 'conic' | 'diamond'

export interface GradientData {
  type: GradientType
  stops: GradientStop[]
  angle: number
  centerX: number
  centerY: number
}

/** Builds a CSS gradient string from a GradientData object */
export function buildCssGradient(data: GradientData): string {
  const stops = data.stops
    .map((s) => {
      const hex = s.color.slice(0, 7)
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
      return `rgba(${r},${g},${b},${s.opacity}) ${s.position}%`
    })
    .join(', ')
  switch (data.type) {
    case 'linear':
      return `linear-gradient(${data.angle}deg, ${stops})`
    case 'radial':
      return `radial-gradient(circle at ${data.centerX}% ${data.centerY}%, ${stops})`
    case 'conic':
    case 'diamond':
      return `conic-gradient(from ${data.angle}deg at ${data.centerX}% ${data.centerY}%, ${stops})`
    default:
      return `linear-gradient(90deg, ${stops})`
  }
}

export type ShapeStyles = {
  color: ColorStyle
  size: SizeStyle
  dash: DashStyle
  font?: FontStyle
  textAlign?: AlignStyle
  isFilled?: boolean
  scale?: number
  opacity?: number
  fillHex?: string
  strokeHex?: string
  borderRadius?: number
  strokeWidthOverride?: number
  labelColor?: string
  labelBackground?: string
  fontFamily?: string
  gradient?: GradientData
  textGradient?: GradientData
}

export enum TVAssetType {
  Image = 'image',
  Video = 'video',
}

export interface TVImageAsset extends TLAsset {
  type: TVAssetType.Image
  fileName: string
  src: string
  size: number[]
}

export interface TVVideoAsset extends TLAsset {
  type: TVAssetType.Video
  fileName: string
  src: string
  size: number[]
}

export type TVAsset = TVImageAsset | TVVideoAsset

export type TVAssets = Record<string, TVAsset>

/* -------------------------------------------------- */
/*                    Export                          */
/* -------------------------------------------------- */

export enum TVExportType {
  PNG = 'png',
  JPG = 'jpeg',
  WEBP = 'webp',
  SVG = 'svg',
  JSON = 'json',
}

export interface TVExport {
  name: string
  type: string
  blob: Blob
}

export enum TVExportBackground {
  Transparent = 'transparent',
  Auto = 'auto',
  Light = 'light',
  Dark = 'dark',
}

/* -------------------------------------------------- */
/*                    Type Helpers                    */
/* -------------------------------------------------- */

export type ParametersExceptFirst<F> = F extends (arg0: any, ...rest: infer R) => any ? R : never

export type ExceptFirst<T extends unknown[]> = T extends [any, ...infer U] ? U : never

export type ExceptFirstTwo<T extends unknown[]> = T extends [any, any, ...infer U] ? U : never

export type PropsOfType<U> = {
  [K in keyof TVShape]: TVShape[K] extends any ? (TVShape[K] extends U ? K : never) : never
}[keyof TVShape]

export type Difference<A, B, C = A> = A extends B ? never : C

export type Intersection<A, B, C = A> = A extends B ? C : never

export type FilteredKeys<T, U> = {
  [P in keyof T]: T[P] extends U ? P : never
}[keyof T]

export type RequiredKeys<T> = {
  [K in keyof T]-?: Difference<Record<string, unknown>, Pick<T, K>, K>
}[keyof T]

export type MembersWithRequiredKey<T, U> = {
  [P in keyof T]: Intersection<U, RequiredKeys<T[P]>, T[P]>
}[keyof T]

export type MappedByType<U extends string, T extends { type: U }> = {
  [P in T['type']]: T extends any ? (P extends T['type'] ? T : never) : never
}

export type ShapesWithProp<U> = MembersWithRequiredKey<MappedByType<TVShapeType, TVShape>, U>

export type Patch<T> = Partial<{ [P in keyof T]: Patch<T[P]> }>

export interface Command<T extends { [key: string]: any }> {
  id?: string
  before: Patch<T>
  after: Patch<T>
}

export interface FileWithHandle extends File {
  handle?: FileSystemFileHandle
}

export interface FileWithDirectoryHandle extends File {
  directoryHandle?: FileSystemDirectoryHandle
}

// The following typings implement the relevant parts of the File System Access
// API. This can be removed once the specification reaches the Candidate phase
// and is implemented as part of microsoft/TSJS-lib-generator.

export interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite'
}

export interface FileSystemHandle {
  readonly kind: 'file' | 'directory'
  readonly name: string

  isSameEntry: (other: FileSystemHandle) => Promise<boolean>

  queryPermission: (descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>
  requestPermission: (descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>
}
