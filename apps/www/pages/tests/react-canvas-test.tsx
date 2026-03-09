import dynamic from 'next/dynamic'
import Head from 'next/head'

const ReactCanvasExportTest = dynamic(() => import('~components/ReactCanvasExportTest'), {
  ssr: false,
}) as any

export default function page() {
  return (
    <>
      <Head>
        <title>React Canvas Export Test</title>
      </Head>
      <ReactCanvasExportTest />
    </>
  )
}
