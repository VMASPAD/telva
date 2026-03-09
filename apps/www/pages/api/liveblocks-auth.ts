import { NextApiRequest, NextApiResponse } from 'next'

type LiveblocksAuthRequestBody = {
  room?: string
  userId?: string
}

function getBody(req: NextApiRequest): LiveblocksAuthRequestBody {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }

  return req.body as LiveblocksAuthRequestBody
}

function getAuthErrorMessage(data: unknown, fallback: string) {
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    const error = (data as { error?: unknown }).error
    if (typeof error === 'string') return error
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string') return message
  }

  return fallback
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

function getRoom(req: NextApiRequest, body: LiveblocksAuthRequestBody) {
  const roomFromBody = typeof body.room === 'string' ? body.room : undefined
  const roomFromQuery = typeof req.query.room === 'string' ? req.query.room : undefined
  return roomFromBody ?? roomFromQuery
}

function getOrCreateUserId(
  req: NextApiRequest,
  res: NextApiResponse,
  body: LiveblocksAuthRequestBody
) {
  const fromBody = typeof body.userId === 'string' ? body.userId.trim() : ''
  if (fromBody) return fromBody

  const fromQuery = typeof req.query.userId === 'string' ? req.query.userId.trim() : ''
  if (fromQuery) return fromQuery

  const fromCookie = typeof req.cookies.lb_user_id === 'string' ? req.cookies.lb_user_id.trim() : ''
  if (fromCookie) return fromCookie

  const generated = `anon-${Math.random().toString(36).slice(2, 10)}`
  res.setHeader('Set-Cookie', `lb_user_id=${generated}; Path=/; Max-Age=31536000; SameSite=Lax`)
  return generated
}

export default async function LiveblocksAuth(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    res.status(204).end()
    return
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const isLiveblocksEnabled = process.env.NEXT_PUBLIC_ENABLE_LIVEBLOCKS === 'true'

  if (!isLiveblocksEnabled) {
    res.status(503).json({ error: 'Liveblocks integration is disabled' })
    return
  }

  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY

  if (!secretKey) {
    res.status(500).json({ error: 'LIVEBLOCKS_SECRET_KEY is not configured' })
    return
  }

  const body = getBody(req)
  const room = getRoom(req, body)

  if (!room) {
    res.status(400).json({ error: 'Missing room id' })
    return
  }

  try {
    const ensureRoomResponse = await fetch('https://api.liveblocks.io/v2/rooms?idempotent', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: room,
        defaultAccesses: ['room:write'],
      }),
    })

    if (!ensureRoomResponse.ok) {
      const ensureRoomData = await parseJsonResponse(ensureRoomResponse)
      const message = getAuthErrorMessage(ensureRoomData, ensureRoomResponse.statusText)
      res.status(ensureRoomResponse.status).json({ error: message })
      return
    }

    const userId = getOrCreateUserId(req, res, body)

    // Use per-room authorize so the client receives a room-scoped token.
    const authResponse = await fetch(
      `https://api.liveblocks.io/v2/rooms/${encodeURIComponent(room)}/authorize`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      }
    )

    const authData = await parseJsonResponse(authResponse)

    if (!authResponse.ok) {
      const message = getAuthErrorMessage(authData, authResponse.statusText)
      res.status(authResponse.status).json({ error: message })
      return
    }

    const token =
      authData && typeof authData === 'object' ? (authData as { token?: unknown }).token : undefined

    if (typeof token !== 'string') {
      res.status(500).json({ error: 'Invalid Liveblocks auth response' })
      return
    }

    res.status(200).json({ token })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Liveblocks auth request failed'
    res.status(500).json({ error: message })
  }
}
