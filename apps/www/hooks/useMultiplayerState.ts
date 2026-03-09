import { LiveMap } from '@liveblocks/client'
import React, { useCallback, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  type TVAsset,
  type TVBinding,
  type TVShape,
  type TVUser,
  TVUserStatus,
  type TelvaApp,
} from 'telva'
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

function toLiveValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function useMultiplayerState(roomId: string) {
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

  // Update the live shapes when the app's shapes change.
  const onChangePage = useCallback(
    (
      app: TelvaApp,
      shapes: Record<string, TVShape | undefined>,
      bindings: Record<string, TVBinding | undefined>,
      assets: Record<string, TVAsset | undefined>
    ) => {
      room.batch(() => {
        const lShapes = rLiveShapes.current
        const lBindings = rLiveBindings.current
        const lAssets = rLiveAssets.current

        if (!(lShapes && lBindings && lAssets)) return

        Object.entries(shapes).forEach(([id, shape]) => {
          if (!shape) {
            lShapes.delete(id)
          } else {
            lShapes.set(shape.id, toLiveValue(shape))
          }
        })

        Object.entries(bindings).forEach(([id, binding]) => {
          if (!binding) {
            lBindings.delete(id)
          } else {
            lBindings.set(binding.id, toLiveValue(binding))
          }
        })

        Object.entries(assets).forEach(([id, asset]) => {
          if (!asset) {
            lAssets.delete(id)
          } else {
            lAssets.set(asset.id, toLiveValue(asset))
          }
        })
      })
    },
    [room]
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

        let lShapes = storage.root.get('shapes') as Storage['shapes']
        if (!lShapes || !('_serialize' in lShapes)) {
          storage.root.set('shapes', new LiveMap() as unknown as Storage['shapes'])
          lShapes = storage.root.get('shapes') as Storage['shapes']
        }
        rLiveShapes.current = lShapes

        let lBindings = storage.root.get('bindings') as Storage['bindings']
        if (!lBindings || !('_serialize' in lBindings)) {
          storage.root.set('bindings', new LiveMap() as unknown as Storage['bindings'])
          lBindings = storage.root.get('bindings') as Storage['bindings']
        }
        rLiveBindings.current = lBindings

        let lAssets = storage.root.get('assets') as Storage['assets']
        if (!lAssets || !('_serialize' in lAssets)) {
          storage.root.set('assets', new LiveMap() as unknown as Storage['assets'])
          lAssets = storage.root.get('assets') as Storage['assets']
        }
        rLiveAssets.current = lAssets

        if (!version) {
          // The doc object will only be present if the document was created
          // prior to the current multiplayer implementation. At this time, the
          // document was a single LiveObject named 'doc'. If we find a doc,
          // then we need to move the shapes and bindings over to the new structures
          // and then mark the doc as migrated.
          const doc = storage.root.get('doc')

          // No doc? No problem. This was likely a newer document
          if (doc) {
            const {
              document: {
                pages: {
                  page: { shapes, bindings },
                },
                assets,
              },
            } = doc.toObject()

            Object.values(shapes as Record<string, any>).forEach((shape: any) =>
              lShapes.set(shape.id, shape)
            )
            Object.values(bindings as Record<string, any>).forEach((binding: any) =>
              lBindings.set(binding.id, binding)
            )
            Object.values(assets as Record<string, any>).forEach((asset: any) =>
              lAssets.set(asset.id, asset)
            )
          }
        }

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

  const onSessionStart = React.useCallback(() => {
    if (!room) return
    room.history.pause()
    rIsPaused.current = true
  }, [room])

  const onSessionEnd = React.useCallback(() => {
    if (!room) return
    room.history.resume()
    rIsPaused.current = false
  }, [room])

  useHotkeys(
    'ctrl+shift+l;,⌘+shift+l',
    () => {
      if (window.confirm('Reset the document?')) {
        room.batch(() => {
          const lShapes = rLiveShapes.current
          const lBindings = rLiveBindings.current
          const lAssets = rLiveAssets.current

          if (!(lShapes && lBindings && lAssets)) return

          lShapes.forEach((shape) => {
            lShapes.delete(shape.id)
          })

          lBindings.forEach((shape) => {
            lBindings.delete(shape.id)
          })

          lAssets.forEach((shape) => {
            lAssets.delete(shape.id)
          })
        })
      }
    },
    []
  )

  return {
    onUndo,
    onRedo,
    onMount,
    onSessionStart,
    onSessionEnd,
    onChangePage,
    onChangePresence,
    connectionStatus,
    error,
    loading,
  }
}
