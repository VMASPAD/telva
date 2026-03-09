import { LiveMap } from '@liveblocks/client'
import React, { useCallback, useRef, useState } from 'react'
import { type TVUser, TVUserStatus, type TelvaApp } from 'telva'
import { Storage, useRedo, useRoom, useUndo, useUpdateMyPresence } from '~utils/liveblocks'

declare const window: Window & { app: TelvaApp }

type Presence = {
  id?: string
  user?: Partial<TVUser>
}

function normalizeUser(user: Partial<TVUser> | undefined, fallbackId: string): TVUser {
  return {
    id: user?.id ?? fallbackId,
    color: user?.color ?? 'black',
    point: user?.point ?? [0, 0],
    selectedIds: user?.selectedIds ?? [],
    activeShapes: user?.activeShapes ?? [],
    status: user?.status ?? TVUserStatus.Connected,
    metadata: user?.metadata,
    session: user?.session,
  }
}

export function useReadOnlyMultiplayerState(roomId: string) {
  const [app, setApp] = useState<TelvaApp>()
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<string>('initial')

  const room = useRoom()
  const onUndo = useUndo()
  const onRedo = useRedo()
  const updateMyPresence = useUpdateMyPresence()

  const rIsPaused = useRef(false)

  const rLiveShapes = useRef<Storage['shapes']>()
  const rLiveBindings = useRef<Storage['bindings']>()
  const rLiveAssets = useRef<Storage['assets']>()

  // Callbacks --------------

  // Put the state into the window, for debugging.
  const onMount = useCallback(
    (app: TelvaApp) => {
      app.loadRoom(roomId)
      app.pause() // Turn off the app's own undo / redo stack

      const userId = app.room?.userId
      const roomUser = userId ? app.room?.users?.[userId] : undefined

      if (userId && roomUser) {
        updateMyPresence({ id: userId, user: normalizeUser(roomUser, userId) })
      }

      window.app = app
      setApp(app)
    },
    [roomId, updateMyPresence]
  )

  // Handle presence updates when the user's pointer / selection changes
  const onChangePresence = useCallback(
    (app: TelvaApp, user: TVUser) => {
      const localUserId = app.room?.userId
      if (!localUserId) return

      const localUser = app.room?.users?.[localUserId]

      updateMyPresence({
        id: localUserId,
        user: normalizeUser({ ...localUser, ...user }, localUserId),
      })
    },
    [updateMyPresence]
  )

  // Document Changes --------

  React.useEffect(() => {
    const unsubs: (() => void)[] = []
    if (!(app && room)) return
    // Handle errors
    unsubs.push(
      room.subscribe('error', (error) => {
        setError(error)
        setLoading(false)
      })
    )

    // Track connection state
    unsubs.push(
      room.subscribe('connection', (status) => {
        setConnectionStatus(status)
      })
    )

    // Handle changes to other users' presence
    unsubs.push(
      room.subscribe('others', (others, event) => {
        if (event.type === 'leave') {
          const presence = event.user.presence as Presence | undefined
          const leavingUserId = presence?.id ?? presence?.user?.id

          if (leavingUserId) {
            app?.removeUser(leavingUserId)
          }
        } else {
          const users = others
            .toArray()
            .map((other) => {
              const presence = other.presence as Presence | undefined
              if (!presence) return null

              const userId = presence.id ?? presence.user?.id
              if (!userId) return null

              return normalizeUser(presence.user, userId)
            })
            .filter((user): user is TVUser => Boolean(user))

          const localUserId = app.room?.userId
          const localUser =
            localUserId && app.room?.users?.[localUserId]
              ? normalizeUser(app.room.users[localUserId], localUserId)
              : null

          const mergedUsers = new Map<string, TVUser>()

          users.forEach((user) => mergedUsers.set(user.id, user))

          if (localUser) {
            mergedUsers.set(localUser.id, localUser)
          }

          app.updateUsers(Array.from(mergedUsers.values()))
        }
      })
    )

    let stillAlive = true

    // Setup the document's storage and subscriptions
    async function setupDocument() {
      try {
        const storage = await room.getStorage()

        // Migrate previous versions
        const version = storage.root.get('version')

        // Initialize (get or create) maps for shapes/bindings/assets

        let lShapes = storage.root.get('shapes')
        if (!lShapes || !('_serialize' in lShapes)) {
          storage.root.set('shapes', new LiveMap() as unknown as Storage['shapes'])
          lShapes = storage.root.get('shapes')
        }
        rLiveShapes.current = lShapes

        let lBindings = storage.root.get('bindings')
        if (!lBindings || !('_serialize' in lBindings)) {
          storage.root.set('bindings', new LiveMap() as unknown as Storage['bindings'])
          lBindings = storage.root.get('bindings')
        }
        rLiveBindings.current = lBindings

        let lAssets = storage.root.get('assets')
        if (!lAssets || !('_serialize' in lAssets)) {
          storage.root.set('assets', new LiveMap() as unknown as Storage['assets'])
          lAssets = storage.root.get('assets')
        }
        rLiveAssets.current = lAssets

        // Save the version number for future migrations
        storage.root.set('version', 2.1)

        // Subscribe to changes
        const handleChanges = () => {
          app?.replacePageContent(
            Object.fromEntries(lShapes.entries()),
            Object.fromEntries(lBindings.entries()),
            Object.fromEntries(lAssets.entries())
          )
        }

        if (stillAlive) {
          unsubs.push(room.subscribe(lShapes as unknown as LiveMap<string, any>, handleChanges))
          unsubs.push(room.subscribe(lBindings as unknown as LiveMap<string, any>, handleChanges))
          unsubs.push(room.subscribe(lAssets as unknown as LiveMap<string, any>, handleChanges))

          // Update the document with initial content
          handleChanges()

          // Zoom to fit the content
          app.zoomToFit()
          if (app.zoom > 1) {
            app.resetZoom()
          }

          setLoading(false)
        }
      } catch (cause) {
        if (!stillAlive) return

        setError(
          cause instanceof Error ? cause : new Error('Failed to initialize Liveblocks storage')
        )
        setLoading(false)
      }
    }

    setupDocument()

    return () => {
      stillAlive = false
      unsubs.forEach((unsub) => unsub())
    }
  }, [room, app])

  return {
    onUndo,
    onRedo,
    onMount,
    onChangePresence,
    connectionStatus,
    error,
    loading,
  }
}
