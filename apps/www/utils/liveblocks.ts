import { createClient } from '@liveblocks/client'
import type { LiveMap, LiveObject } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'

const publicApiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_API_KEY
const usePublicKeyAuth = process.env.NEXT_PUBLIC_LIVEBLOCKS_USE_PUBLIC_KEY === 'true'

const client = createClient(
  usePublicKeyAuth && publicApiKey
    ? {
        publicApiKey,
        throttle: 80,
      }
    : {
        authEndpoint: '/api/liveblocks-auth',
        throttle: 80,
      }
)

// Presence represents the properties that will exist on every User in the
// Liveblocks Room and that will automatically be kept in sync. Accessible
// through the `user.presence` property.
type Presence = {
  id?: string
  user: Record<string, any>
}

// Storage represents the shared document that persists in the Room, even after
// all Users leave, and for which updates are automatically persisted and
// synced to all connected clients.
export type Storage = {
  version: number
  doc: LiveObject<Record<string, any>>
  shapes: LiveMap<string, any>
  bindings: LiveMap<string, any>
  assets: LiveMap<string, any>
}

// Optionally, UserMeta represents static/readonly metadata on each User, as
// provided by your own custom auth backend. This isn't used for telva.
// type UserMeta = {
//   id?: string,  // Accessible through `user.id`
//   info?: Json,  // Accessible through `user.info`
// };

// Optionally, the type of custom events broadcasted and listened for in this
// room.
// type RoomEvent = {};

const { RoomProvider, useHistory, useRedo, useUndo, useRoom, useUpdateMyPresence } =
  createRoomContext<
    Presence,
    Storage
    /* UserMeta, RoomEvent */
  >(client)

export { RoomProvider, useHistory, useRedo, useUndo, useRoom, useUpdateMyPresence }
