import * as React from 'react'
import type { TelvaApp } from '~state'
import { DialogState } from './useDialog'

export function useFileSystem() {
  const onNewProject = React.useCallback(
    async (
      app: TelvaApp,
      openDialog: (
        dialogState: DialogState,
        onYes: () => Promise<void>,
        onNo: () => Promise<void>,
        onCancel: () => Promise<void>
      ) => void
    ) => {
      openDialog(
        app.fileSystemHandle ? 'saveFirstTime' : 'saveAgain',
        async () => {
          // user pressed yes
          try {
            await app.saveProject()
            app.newProject()
          } catch (e) {
            // noop
          }
        },
        async () => {
          // user pressed no
          app.newProject()
        },
        async () => {
          // user pressed cancel
        }
      )
    },
    []
  )

  const onOpenProject = React.useCallback(
    async (
      app: TelvaApp,
      openDialog: (
        dialogState: DialogState,
        onYes: () => Promise<void>,
        onNo: () => Promise<void>,
        onCancel: () => Promise<void>
      ) => void
    ) => {
      // If there's no open file and the document is clean, open directly
      if (!app.fileSystemHandle && !app.isDirty) {
        app.openProject()
        return
      }

      // Otherwise ask the user if they want to save first
      openDialog(
        app.fileSystemHandle ? 'saveFirstTime' : 'saveAgain',
        async () => {
          // user pressed yes — save then open
          try {
            await app.saveProject()
            await app.openProject()
          } catch (e) {
            // noop
          }
        },
        async () => {
          // user pressed no — just open
          app.openProject()
        },
        async () => {
          // user pressed cancel
        }
      )
    },
    []
  )

  const onSaveProject = React.useCallback((app: TelvaApp) => {
    app.saveProject()
  }, [])

  const onSaveProjectAs = React.useCallback((app: TelvaApp) => {
    app.saveProjectAs()
  }, [])

  const onOpenMedia = React.useCallback(async (app: TelvaApp) => {
    app.openAsset?.()
  }, [])

  return {
    onNewProject,
    onSaveProject,
    onSaveProjectAs,
    onOpenProject,
    onOpenMedia,
  }
}
