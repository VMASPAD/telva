import { NextApiRequest, NextApiResponse } from 'next'
import { TVDocument } from 'telva'
import { Utils } from 'telva-core'

type RequestBody = {
  roomId?: string
  pageId: string
  document: TVDocument
}

function getBody(req: NextApiRequest): RequestBody | null {
  if (!req.body) return null

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as RequestBody
    } catch {
      return null
    }
  }

  return req.body as RequestBody
}

async function parseJsonResponse(response: Response) {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === 'string') return data

  if (data && typeof data === 'object') {
    const error = (data as { error?: unknown }).error
    if (typeof error === 'string') return error

    const message = (data as { message?: unknown }).message
    if (typeof message === 'string') return message
  }

  return fallback
}

export default async function CreateMultiplayerRoom(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ status: 'error', message: 'Method not allowed' })
    return
  }

  const isLiveblocksEnabled = process.env.NEXT_PUBLIC_ENABLE_LIVEBLOCKS === 'true'

  if (!isLiveblocksEnabled) {
    res.status(503).json({ status: 'error', message: 'Liveblocks integration is disabled' })
    return
  }

  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY

  if (!secretKey) {
    res.status(500).json({ status: 'error', message: 'LIVEBLOCKS_SECRET_KEY is not configured' })
    return
  }

  try {
    const parsedBody = getBody(req)

    if (!parsedBody) {
      res.status(400).json({ status: 'error', message: 'Invalid request body' })
      return
    }

    const { pageId, document } = parsedBody

    if (!pageId || !document?.pages?.[pageId]) {
      res.status(400).json({ status: 'error', message: 'Missing or invalid pageId' })
      return
    }

    const roomId =
      typeof parsedBody.roomId === 'string' && parsedBody.roomId.trim()
        ? parsedBody.roomId
        : Utils.uniqueId()

    const createRoomResponse = await fetch('https://api.liveblocks.io/v2/rooms?idempotent', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: roomId,
        defaultAccesses: ['room:write'],
      }),
    })

    if (!createRoomResponse.ok) {
      const createRoomData = await parseJsonResponse(createRoomResponse)
      const message = getErrorMessage(createRoomData, createRoomResponse.statusText)
      res.status(createRoomResponse.status).json({ status: 'error', message })
      return
    }

    const storageJson: Record<string, any> = {
      liveblocksType: 'LiveObject',
      data: {
        version: 2.1,
        shapes: {
          liveblocksType: 'LiveMap',
          data: {},
        },
        bindings: {
          liveblocksType: 'LiveMap',
          data: {},
        },
        assets: {
          liveblocksType: 'LiveMap',
          data: {},
        },
      },
    }

    const page = document.pages[pageId]

    storageJson.data.shapes.data = page.shapes ?? {}
    storageJson.data.bindings.data = page.bindings ?? {}
    storageJson.data.assets.data = document.assets ?? {}

    const storageResponse = await fetch(
      `https://api.liveblocks.io/v2/rooms/${encodeURIComponent(roomId)}/storage`,
      {
        method: 'POST',
        body: JSON.stringify(storageJson),
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!storageResponse.ok) {
      const storageData = await parseJsonResponse(storageResponse)
      const message = getErrorMessage(storageData, storageResponse.statusText)
      res.status(storageResponse.status).json({ status: 'error', message })
      return
    }

    res.status(200).json({ status: 'success', message: 'Room ready', url: `/r/${roomId}` })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create multiplayer room'
    res.status(500).json({ status: 'error', message })
  }
}
