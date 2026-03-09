import type { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import * as React from 'react'

const IFrameWarning = dynamic(() => import('~components/IFrameWarning'), {
  ssr: false,
}) as any

const Editor = dynamic(() => import('~components/Editor'), {
  ssr: false,
}) as any

const MultiplayerEditor = dynamic(() => import('~components/MultiplayerEditor'), {
  ssr: false,
}) as any

const isLiveblocksEnabled = process.env.NEXT_PUBLIC_ENABLE_LIVEBLOCKS === 'true'

interface RoomProps {
  id: string
}

export default function Room({ id }: RoomProps) {
  if (typeof window !== 'undefined' && window.self !== window.top) {
    return <IFrameWarning url={`${window.location.origin}/r/${id}`} />
  }

  const localEditorId = `room-${id}`

  return (
    <>
      <Head>
        <title>telva - {id}</title>
      </Head>
      {isLiveblocksEnabled ? <MultiplayerEditor roomId={id} /> : <Editor id={localEditorId} />}
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.query.id?.toString()

  return {
    props: {
      id,
    },
  }
}
