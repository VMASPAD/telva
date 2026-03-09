import * as React from 'react'
import { TVUserStatus, Telva, useFileSystem } from 'telva'
import { useMultiplayerAssets } from '~hooks/useMultiplayerAssets'
import { useMultiplayerState } from '~hooks/useMultiplayerState'
import { useUploadAssets } from '~hooks/useUploadAssets'
import { styled } from '~styles'
import { RoomProvider } from '~utils/liveblocks'
import { BetaNotification } from './BetaNotification'

interface Props {
  roomId: string
}

const MultiplayerEditor = ({ roomId }: Props) => {
  const initialPresence = React.useMemo(() => {
    const sessionId = `${roomId}-${Math.random().toString(36).slice(2, 10)}`

    return {
      id: sessionId,
      user: {
        id: sessionId,
        status: TVUserStatus.Connecting,
        activeShapes: [],
        color: 'black',
        point: [0, 0] as [number, number],
        selectedIds: [],
      },
    }
  }, [roomId])

  if (!roomId) {
    return <LoadingScreen>Missing room id</LoadingScreen>
  }

  return (
    <RoomProvider id={roomId} initialPresence={initialPresence} key={roomId}>
      <Editor roomId={roomId} />
    </RoomProvider>
  )
}

// Inner Editor

function Editor({ roomId }: Props) {
  const fileSystemEvents = useFileSystem()
  const { error, loading, connectionStatus, ...events } = useMultiplayerState(roomId)
  const { onAssetCreate, onAssetDelete } = useMultiplayerAssets()
  const { onAssetUpload } = useUploadAssets()

  if (error) return <LoadingScreen>Error: {error.message}</LoadingScreen>

  return (
    <div className="telva">
      <Telva
        autofocus
        disableAssets={false}
        showPages={false}
        onAssetCreate={onAssetCreate}
        onAssetDelete={onAssetDelete}
        onAssetUpload={onAssetUpload}
        {...fileSystemEvents}
        {...events}
      />
      {loading ? (
        <LoadingScreen>Connecting to Liveblocks ({connectionStatus})…</LoadingScreen>
      ) : null}
      <BetaNotification />
    </div>
  )
}

export default MultiplayerEditor

const LoadingScreen = styled('div', {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})
