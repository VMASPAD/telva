import { fileOpen, fileSave, supported } from 'browser-fs-access'
import type { FileSystemHandle } from 'browser-fs-access'
import { get as getFromIdb, set as setToIdb } from 'idb-keyval'
import { FILE_EXTENSION, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '~constants'
import type { TVDocument, TVFile } from '~types'

const options = { mode: 'readwrite' as const }

const checkPermissions = async (handle: FileSystemFileHandle) => {
  return (
    (await (handle as unknown as FileSystemHandle).queryPermission(options)) === 'granted' ||
    (await (handle as unknown as FileSystemHandle).requestPermission(options)) === 'granted'
  )
}

export async function loadFileHandle() {
  if (typeof Window === 'undefined' || !('_location' in Window)) return
  const fileHandle = await getFromIdb(`Telva_file_handle_${window.location.origin}`)
  if (!fileHandle) return null
  return fileHandle
}

export async function saveFileHandle(fileHandle: FileSystemFileHandle | null) {
  return setToIdb(`Telva_file_handle_${window.location.origin}`, fileHandle)
}

// ─── tldraw v2 ↔ TVDocument conversion ───────────────────────────────────────

/** Minimal tldraw v2 file schema used when saving / loading .tld files */
const TLD_SCHEMA = {
  schemaVersion: 1,
  storeVersion: 4,
  recordVersions: {
    asset: { version: 1, subTypeKey: 'type', subTypeVersions: { image: 2, video: 2, bookmark: 0 } },
    camera: { version: 1 },
    document: { version: 2 },
    instance: { version: 22 },
    instance_page_state: { version: 5 },
    page: { version: 1 },
    shape: { version: 3, subTypeKey: 'type', subTypeVersions: {} },
    instance_presence: { version: 5 },
    pointer: { version: 1 },
  },
}

/**
 * Convert a TVDocument to tldraw v2 JSON format (records-based).
 * The TVDocument is also embedded inside the document record as `telvaDocument`
 * so round-trips are lossless.
 */
export function tvDocumentToTldrawFile(document: TVDocument): object {
  const records: object[] = []

  // document record
  records.push({
    gridSize: 10,
    name: document.name || '',
    meta: {},
    id: 'document:document',
    typeName: 'document',
    // embed original for lossless round-trip
    telvaDocument: document,
  })

  let pageIndex = 0
  for (const pageId of Object.keys(document.pages)) {
    const page = document.pages[pageId]
    const pageState = document.pageStates[pageId]
    const indexStr = `a${pageIndex + 1}`

    // page record
    records.push({
      meta: {},
      id: `page:${pageId}`,
      name: (page as any).name || `Page ${pageIndex + 1}`,
      index: indexStr,
      typeName: 'page',
    })

    // instance_page_state record
    records.push({
      editingShapeId: null,
      croppingShapeId: null,
      selectedShapeIds: pageState?.selectedIds ?? [],
      hoveredShapeId: null,
      erasingShapeIds: [],
      hintingShapeIds: [],
      focusedGroupId: null,
      meta: {},
      id: `instance_page_state:page:${pageId}`,
      pageId: `page:${pageId}`,
      typeName: 'instance_page_state',
    })

    // shape records
    const shapes = page.shapes ?? {}
    let shapeIdx = 0
    for (const shapeId of Object.keys(shapes)) {
      const shape = (shapes as any)[shapeId]
      const { point, rotation, style, type, ...rest } = shape
      records.push({
        x: point?.[0] ?? 0,
        y: point?.[1] ?? 0,
        rotation: rotation ?? 0,
        isLocked: (shape as any).isLocked ?? false,
        opacity: style?.opacity ?? 1,
        meta: {},
        id: `shape:${shapeId}`,
        parentId: `page:${pageId}`,
        type,
        props: { ...rest, ...style },
        index: `a${shapeIdx + 1}`,
        typeName: 'shape',
      })
      shapeIdx++
    }

    pageIndex++
  }

  return {
    tldrawFileFormatVersion: 1,
    schema: TLD_SCHEMA,
    records,
  }
}

/**
 * Convert a tldraw v2 records file back into a TVDocument.
 * If the file has an embedded `telvaDocument` (saved by this app), it is used
 * for a lossless round-trip.  Otherwise a best-effort conversion is done.
 */
export function tldrawFileToTVDocument(tldFile: any): TVDocument {
  const records: any[] = tldFile.records ?? []

  // --- lossless round-trip via embedded telvaDocument ---
  const docRecord = records.find((r: any) => r.typeName === 'document')
  if (docRecord?.telvaDocument) {
    return docRecord.telvaDocument as TVDocument
  }

  // --- best-effort conversion ---
  const pageRecords = records.filter((r: any) => r.typeName === 'page')
  const shapeRecords = records.filter((r: any) => r.typeName === 'shape')
  const pageStateRecords = records.filter((r: any) => r.typeName === 'instance_page_state')

  const pages: TVDocument['pages'] = {}
  const pageStates: TVDocument['pageStates'] = {}

  for (const pr of pageRecords) {
    // page IDs in tldraw v2 look like "page:pageId" – strip the prefix
    const rawId = pr.id.startsWith('page:') ? pr.id.slice(5) : pr.id

    // shapes belonging to this page
    const shapesForPage: Record<string, any> = {}
    for (const sr of shapeRecords) {
      const expectedParent = `page:${rawId}`
      if (sr.parentId !== expectedParent && sr.parentId !== rawId) continue

      const rawShapeId = sr.id.startsWith('shape:') ? sr.id.slice(6) : sr.id
      const { props = {}, x, y, rotation, type } = sr
      const { opacity, start, end, bend, arrowheadStart, arrowheadEnd, ...restProps } = props

      const base: Record<string, any> = {
        id: rawShapeId,
        type,
        point: [x ?? 0, y ?? 0],
        rotation: rotation ?? 0,
        style: { opacity: opacity ?? 1, ...restProps },
        ...restProps,
      }

      // Arrow shapes: reconstruct top-level `handles` from tld props
      if (type === 'arrow') {
        const startPt = start?.x !== undefined ? [start.x, start.y] : [0, 0]
        const endPt = end?.x !== undefined ? [end.x, end.y] : [1, 1]
        const bendVal = typeof bend === 'number' ? bend : 0
        // mid-point for bend handle
        const bendPt = [(startPt[0] + endPt[0]) / 2, (startPt[1] + endPt[1]) / 2]
        base.handles = {
          start: {
            id: 'start',
            index: 0,
            point: startPt,
            canBind: true,
            bindingId: start?.boundShapeId
              ? Object.keys(shapesForPage).find(() => true) // will be resolved by loadDocument
              : undefined,
          },
          bend: { id: 'bend', index: 1, point: bendPt },
          end: {
            id: 'end',
            index: 2,
            point: endPt,
            canBind: true,
            bindingId: end?.boundShapeId ? end.boundShapeId : undefined,
          },
        }
        base.bend = bendVal
        if (arrowheadStart || arrowheadEnd) {
          base.decorations = {
            start: arrowheadStart && arrowheadStart !== 'none' ? arrowheadStart : undefined,
            end: arrowheadEnd && arrowheadEnd !== 'none' ? arrowheadEnd : undefined,
          }
        }
      }

      shapesForPage[rawShapeId] = base
    }

    pages[rawId] = {
      id: rawId,
      name: pr.name || `Page`,
      shapes: shapesForPage,
      bindings: {},
    } as any

    // page state
    const ps = pageStateRecords.find((r: any) => r.pageId === `page:${rawId}` || r.pageId === rawId)
    pageStates[rawId] = {
      id: rawId,
      selectedIds: ps?.selectedShapeIds ?? [],
      camera: { point: [0, 0], zoom: 1 },
    } as any
  }

  // Fallback: if no pages were found create an empty one
  if (Object.keys(pages).length === 0) {
    const pid = 'page'
    pages[pid] = { id: pid, name: 'Page 1', shapes: {}, bindings: {} } as any
    pageStates[pid] = { id: pid, selectedIds: [], camera: { point: [0, 0], zoom: 1 } } as any
  }

  return {
    id: 'document',
    name: docRecord?.name || 'Imported Document',
    version: 15,
    pages,
    pageStates,
    assets: {},
  }
}

// ──────────────────────────────────────────────────────────────────────────────

export async function saveToFileSystem(
  document: TVDocument,
  fileHandle: FileSystemFileHandle | null,
  name?: string,
  format?: 'tldr' | 'tld'
) {
  const ext = format === 'tld' ? '.tld' : FILE_EXTENSION

  let json: string
  let mimeType: string

  if (format === 'tld') {
    // Save in tldraw v2 records format
    const tldFile = tvDocumentToTldrawFile(document)
    json =
      process.env.NODE_ENV === 'production'
        ? JSON.stringify(tldFile)
        : JSON.stringify(tldFile, null, 2)
    mimeType = 'application/vnd.tldraw+json'
  } else {
    // Default: save in TVFile format
    const file: TVFile = {
      name: document.name || 'New Document',
      fileHandle: fileHandle ?? null,
      document,
    }
    json =
      process.env.NODE_ENV === 'production' ? JSON.stringify(file) : JSON.stringify(file, null, 2)
    mimeType = 'application/vnd.Telva+json'
  }

  const blob = new Blob([json], { type: mimeType })

  if (fileHandle) {
    const hasPermissions = await checkPermissions(fileHandle)
    if (!hasPermissions) return null
  }

  const docName = document.name || 'New Document'
  const filename = !supported && name?.length ? name : docName

  const newFileHandle = await fileSave(
    blob,
    {
      fileName: `${filename}${ext}`,
      description: format === 'tld' ? 'TLDraw File' : 'Telva File',
      extensions: [ext],
    },
    fileHandle
  )

  await saveFileHandle(newFileHandle)
  return newFileHandle
}

export async function openFromFileSystem(): Promise<null | {
  fileHandle: FileSystemFileHandle | null
  document: TVDocument
}> {
  // Accept both .tldr (native Telva) and .tld (tldraw v2) files
  const blob = await fileOpen({
    description: 'Telva / TLDraw File',
    extensions: [FILE_EXTENSION, '.tld'],
    multiple: false,
  })

  if (!blob) return null

  // Read JSON text
  const json: string = await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (reader.readyState === FileReader.DONE) {
        resolve(reader.result as string)
      }
    }
    reader.readAsText(blob, 'utf8')
  })

  const parsed = JSON.parse(json)

  // ── tldraw v2 format ──────────────────────────────────────────────────────
  if ('tldrawFileFormatVersion' in parsed) {
    const fileHandle = blob.handle ?? null
    await saveFileHandle(fileHandle)
    return {
      fileHandle,
      document: tldrawFileToTVDocument(parsed),
    }
  }

  // ── legacy telvaFileFormatVersion warning ─────────────────────────────────
  if ('telvaFileFormatVersion' in parsed) {
    alert(
      'This file was created in a newer version of Telva. Please visit beta.telva.com to open it.'
    )
    return null
  }

  // ── native TVFile format ──────────────────────────────────────────────────
  const file: TVFile = parsed
  const fileHandle = blob.handle ?? null
  await saveFileHandle(fileHandle)
  return {
    fileHandle,
    document: file.document,
  }
}

export async function openAssetsFromFileSystem() {
  return fileOpen({
    description: 'Image or Video',
    extensions: [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS],
    multiple: true,
  })
}

export function fileToBase64(file: Blob): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    if (file) {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
      reader.onabort = (error) => reject(error)
    }
  })
}

export function fileToText(file: Blob): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    if (file) {
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
      reader.onabort = (error) => reject(error)
    }
  })
}

export function getImageSizeFromSrc(src: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve([img.width, img.height])
    img.onerror = () => reject(new Error('Could not get image size'))
    img.src = src
  })
}

export function getVideoSizeFromSrc(src: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.onloadedmetadata = () => resolve([video.videoWidth, video.videoHeight])
    video.onerror = () => reject(new Error('Could not get video size'))
    video.src = src
  })
}
