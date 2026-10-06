/** Languages a Fast Facts PDF is published in. */
export type PdfLanguage = 'en' | 'ar'

/** One URL per language for the same document. */
export type PdfSources = Record<PdfLanguage, string>

export const PDF_LANGUAGE_LABELS: Record<PdfLanguage, string> = {
  en: 'English',
  ar: 'العربية',
}

/** Caption under the QR code in the lightbox; follows the lightbox language, not the site locale. */
export const PDF_DOWNLOAD_LABELS: Record<PdfLanguage, string> = {
  en: 'Download PDF',
  ar: 'تحميل ملف PDF',
}
