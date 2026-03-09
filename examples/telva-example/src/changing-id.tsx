import * as React from 'react'
import { Telva } from 'telva'

export default function ChangingId() {
  const [id, setId] = React.useState('example')

  React.useEffect(() => {
    const timeout = setTimeout(() => setId('example2'), 2000)

    return () => clearTimeout(timeout)
  }, [])

  return <Telva id={id} />
}
