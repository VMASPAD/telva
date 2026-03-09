import { render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { Telva } from './Telva'

describe('Telva', () => {
  test('mounts component and calls onMount', async () => {
    const onMount = jest.fn()
    render(<Telva onMount={onMount} />)
    await waitFor(onMount)
  })

  test('mounts component and calls onMount when id is present', async () => {
    const onMount = jest.fn()
    render(<Telva id="someId" onMount={onMount} />)
    await waitFor(onMount)
  })
})
