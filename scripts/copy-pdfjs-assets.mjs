// Copies the pdf.js runtime assets the viewer fetches at runtime into /public.
// Runs on postinstall so the copies always match the installed pdfjs-dist version.
//   standard_fonts/  substitutes for the 14 standard PDF fonts when a PDF does not embed them
//   cmaps/           character maps for CID fonts (common in Arabic and CJK PDFs)
//   wasm/            JPEG 2000 / JBIG2 image decoders
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules', 'pdfjs-dist')
const dest = join(root, 'public', 'pdfjs')

rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
for (const dir of ['standard_fonts', 'cmaps', 'wasm']) {
  cpSync(join(src, dir), join(dest, dir), { recursive: true })
}
console.log('[pdfjs] assets copied to public/pdfjs')
