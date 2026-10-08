/**
 * Shared pdf.js bootstrap and an in-memory cache of PDF bytes.
 *
 * The kiosk serves every file locally, so the Fast Facts page prefetches all
 * documents up front and the viewer opens them from memory instead of the
 * network. pdf.js transfers the buffer it is handed to its worker, so callers
 * receive a fresh copy each time and the cache keeps the original.
 */
import type { PDFWorker } from 'pdfjs-dist'

type Pdfjs = typeof import('pdfjs-dist')

let pdfjsPromise: Promise<{ pdfjs: Pdfjs, worker: PDFWorker }> | null = null
const bytes = new Map<string, Promise<ArrayBuffer>>()

/**
 * Loads pdf.js once and boots a single worker shared by every document. The
 * worker script is fetched as soon as the worker is constructed, so calling
 * this early warms the heaviest part of a first open.
 */
export function loadPdfjs() {
  pdfjsPromise ??= (async () => {
    const pdfjs = await import('pdfjs-dist')
    const { default: workerSrc } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
    const worker = new pdfjs.PDFWorker()
    return { pdfjs, worker }
  })()
  return pdfjsPromise
}

/** Fetches a PDF once and keeps its bytes. A failed fetch is forgotten so it can be retried. */
export function fetchPdfBytes(url: string) {
  let pending = bytes.get(url)
  if (!pending) {
    pending = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`[pdf] ${res.status} fetching ${url}`)
      return res.arrayBuffer()
    })
    pending.catch(() => bytes.delete(url))
    bytes.set(url, pending)
  }
  return pending
}

/** A copy of the cached bytes, safe to hand to pdf.js (which transfers it to the worker). */
export async function getPdfData(url: string) {
  return new Uint8Array((await fetchPdfBytes(url)).slice(0))
}

/**
 * Boots pdf.js and fetches every URL one at a time so the main thread stays
 * responsive. Failures are logged rather than thrown; the viewer retries on open.
 */
export async function preloadPdfs(urls: string[]) {
  await loadPdfjs().catch(err => console.error('[pdf] preload failed:', err))
  for (const url of urls) {
    await fetchPdfBytes(url).catch(err => console.error('[pdf] prefetch failed:', err))
  }
}
