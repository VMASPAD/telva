import type { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import * as React from 'react'
import { Utils } from 'telva-core'

const IFrameWarning = dynamic(() => import('~components/IFrameWarning'), {
  ssr: false,
}) as any

const Editor = dynamic(() => import('~components/Editor'), {
  ssr: false,
}) as any

const ReadOnlyMultiplayerEditor = dynamic(() => import('~components/ReadOnlyMultiplayerEditor'), {
  ssr: false,
}) as any

const isLiveblocksEnabled = process.env.NEXT_PUBLIC_ENABLE_LIVEBLOCKS === 'true'

interface RoomProps {
  id: string
}

export default function Room({ id }: RoomProps) {
  if (typeof window !== 'undefined' && window.self !== window.top) {
    return <IFrameWarning url={`https://telva.com/v/${id}`} />
  }

  const localEditorId = `view-${id}`

  return (
    <>
      <Head>
        <title>telva - {id} (read only)</title>
      </Head>
      {isLiveblocksEnabled ? (
        <ReadOnlyMultiplayerEditor roomId={id} />
      ) : (
        <Editor id={localEditorId} readOnly />
      )}
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.query.id?.toString()

  return {
    props: {
      id: Utils.lns(id),
    },
  }
}
