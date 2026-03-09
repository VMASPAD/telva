import * as React from 'react'

interface HTMLContainerProps extends React.HTMLProps<HTMLDivElement> {
  children: React.ReactNode
}

export const HTMLContainer = React.memo(
  React.forwardRef<HTMLDivElement, HTMLContainerProps>(function HTMLContainer(
    { children, className = '', ...rest },
    ref
  ) {
    return (
      <div ref={ref} className={`tv-positioned-div ${className}`} draggable={false} {...rest}>
        <div className="tv-inner-div">{children}</div>
      </div>
    )
  })
)
