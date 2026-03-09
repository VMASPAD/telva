import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CircleIcon, SquareIcon, VercelLogoIcon } from '@radix-ui/react-icons'
import * as React from 'react'
import { useIntl } from 'react-intl'
import { Panel } from '~components/Primitives/Panel'
import { ToolButton } from '~components/Primitives/ToolButton'
import { Tooltip } from '~components/Primitives/Tooltip'
import { LineIcon } from '~components/Primitives/icons'
import { useTelvaApp } from '~hooks'
import { TVShapeType, TVSnapshot, TVToolType } from '~types'

interface ShapesMenuProps {
  activeTool: TVToolType
  isToolLocked: boolean
}

type ShapeShape =
  | TVShapeType.Rectangle
  | TVShapeType.Ellipse
  | TVShapeType.Triangle
  | TVShapeType.Line

const shapeShapes: ShapeShape[] = [
  TVShapeType.Rectangle,
  TVShapeType.Ellipse,
  TVShapeType.Triangle,
  TVShapeType.Line,
]

const shapeShapeIcons = {
  [TVShapeType.Rectangle]: <SquareIcon />,
  [TVShapeType.Ellipse]: <CircleIcon />,
  [TVShapeType.Triangle]: <VercelLogoIcon />,
  [TVShapeType.Line]: <LineIcon />,
}

const dockPositionState = (s: TVSnapshot) => s.settings.dockPosition

export const ShapesMenu = React.memo(function ShapesMenu({
  activeTool,
  isToolLocked,
}: ShapesMenuProps) {
  const app = useTelvaApp()
  const intl = useIntl()

  const dockPosition = app.useStore(dockPositionState)

  const [lastActiveTool, setLastActiveTool] = React.useState<ShapeShape>(TVShapeType.Rectangle)

  React.useEffect(() => {
    if (shapeShapes.includes(activeTool as ShapeShape) && lastActiveTool !== activeTool) {
      setLastActiveTool(activeTool as ShapeShape)
    }
  }, [activeTool])

  const selectShapeTool = React.useCallback(() => {
    app.selectTool(lastActiveTool)
  }, [activeTool, app])

  const handleDoubleClick = React.useCallback(() => {
    app.toggleToolLock()
  }, [app])

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ') {
      if (app.shiftKey) {
        e.preventDefault()
      }
    }
  }, [])

  const isActive = shapeShapes.includes(activeTool as ShapeShape)
  const contentSide = dockPosition === 'bottom' || dockPosition === 'top' ? 'top' : dockPosition

  const panelStyle = dockPosition === 'bottom' || dockPosition === 'top' ? 'row' : 'column'

  return (
    <DropdownMenu.Root dir="ltr" onOpenChange={selectShapeTool}>
      <DropdownMenu.Trigger dir="ltr" asChild id="TD-PrimaryTools-Shapes">
        <ToolButton
          disabled={isActive && app.shiftKey} // otherwise this continuously opens and closes on "SpacePanning"
          variant="primary"
          onDoubleClick={handleDoubleClick}
          isToolLocked={isActive && isToolLocked}
          isActive={isActive}
          onKeyDown={handleKeyDown}
          aria-label={intl.formatMessage({ id: 'shapes' })}
        >
          {shapeShapeIcons[lastActiveTool]}
        </ToolButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content asChild side={contentSide} sideOffset={12}>
        <Panel side="center" style={{ flexDirection: panelStyle }}>
          {shapeShapes.map((shape, i) => (
            <Tooltip
              key={shape}
              label={intl.formatMessage({ id: shape })}
              kbd={(4 + i).toString()}
              id={`TD-PrimaryTools-Shapes-${shape}`}
            >
              <DropdownMenu.Item asChild>
                <ToolButton
                  aria-label={intl.formatMessage({ id: shape })}
                  variant="primary"
                  onClick={() => {
                    app.selectTool(shape)
                    setLastActiveTool(shape)
                  }}
                >
                  {shapeShapeIcons[shape]}
                </ToolButton>
              </DropdownMenu.Item>
            </Tooltip>
          ))}
        </Panel>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
})
