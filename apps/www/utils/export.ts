import { TVExport } from 'telva'

export const EXPORT_ENDPOINT =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000/api/export'
    : 'https://www.telva.com/api/export'

// export async function exportToImage(info: TVExport) {
//   if (info.serialized) {
//     const link = document.createElement('a')
//     link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(info.serialized)
//     link.download = info.name + '.' + info.type
//     link.click()

//     return
//   }

//   const response = await fetch(EXPORT_ENDPOINT, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(info),
//   })
//   const blob = await response.blob()
//   const blobUrl = URL.createObjectURL(blob)
//   const link = document.createElement('a')
//   link.href = blobUrl
//   link.download = info.name + '.' + info.type
//   link.click()
// }
