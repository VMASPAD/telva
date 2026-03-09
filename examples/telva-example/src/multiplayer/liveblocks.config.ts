import { createClient } from '@liveblocks/client'
import type { EnsureJson, LiveMap, LiveObject } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import type { TVAsset, TVBinding, TVDocument, TVShape, TVUser } from 'telva'

const client = createClient({
  publicApiKey: 'pk_prod_FD2zxdAkNGz3ZRCFSsSk3zivKClwcKrjzFYhh4v6xtVIcoYfjwnuCrZthaVohcD1',
  throttle: 80,
})

// Presence represents the properties that will exist on every User in the
// Liveblocks Room and that will automatically be kept in sync. Accessible
// through the `user.presence` property.
type Presence = {
  id?: string
  user: EnsureJson<TVUser>
}

// Storage represents the shared document that persists in the Room, even after
// all Users leave, and for which updates are automatically persisted and
// synced to all connected clients.
export type Storage = {
  version: number
  doc: LiveObject<{
    uuid: string
    document: EnsureJson<TVDocument>
    migrated?: boolean
  }>
  shapes: LiveMap<string, EnsureJson<TVShape>>
  bindings: LiveMap<string, EnsureJson<TVBinding>>
  assets: LiveMap<string, EnsureJson<TVAsset>>
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
