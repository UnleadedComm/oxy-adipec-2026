/** Languages a Fast Facts PDF is published in. */
export type PdfLanguage = 'en' | 'ar'

/** One URL per language for the same document. */
export type PdfSources = Record<PdfLanguage, string>

export const PDF_LANGUAGE_LABELS: Record<PdfLanguage, string> = {
  en: 'English',
  ar: 'العربية',
}
