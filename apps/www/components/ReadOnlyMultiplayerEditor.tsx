import * as React from 'react'
import { TVUserStatus, Telva, useFileSystem } from 'telva'
import { useReadOnlyMultiplayerState } from '~hooks/useReadOnlyMultiplayerState'
import { styled } from '~styles'
import { RoomProvider } from '~utils/liveblocks'

interface Props {
  roomId: string
}

const ReadOnlyMultiplayerEditor = ({ roomId }: Props) => {
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
      <ReadOnlyEditor roomId={roomId} />
    </RoomProvider>
  )
}

// Inner Editor

function ReadOnlyEditor({ roomId }: Props) {
  const { onSaveProjectAs, onSaveProject } = useFileSystem()
  const { error, loading, connectionStatus, ...events } = useReadOnlyMultiplayerState(roomId)

  if (error) return <LoadingScreen>Error: {error.message}</LoadingScreen>

  return (
    <div className="telva">
      <Telva
        autofocus
        disableAssets={false}
        showPages={false}
        onSaveProjectAs={onSaveProjectAs}
        onSaveProject={onSaveProject}
        readOnly
        {...events}
      />
      {loading ? (
        <LoadingScreen>Connecting to Liveblocks ({connectionStatus})…</LoadingScreen>
      ) : null}
    </div>
  )
}

export default ReadOnlyMultiplayerEditor

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
