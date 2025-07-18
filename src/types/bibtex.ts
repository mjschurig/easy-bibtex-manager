export interface BibTeXEntry {
  type: string;
  key: string;
  fields: Record<string, string>;
  authors?: string[];
  authorsAreCanonical?: boolean;
  processedFields?: Record<string, string>;
}

export interface StringVariables {
  [key: string]: string;
}

export interface ParsedBibTeX {
  entries: BibTeXEntry[];
  strings: StringVariables;
}

export const BIBTEX_TYPES = [
  'article', 'book', 'booklet', 'conference', 'inbook', 'incollection', 
  'inproceedings', 'manual', 'mastersthesis', 'misc', 'phdthesis', 
  'proceedings', 'techreport', 'unpublished'
] as const;

export const BIBTEX_FIELDS = [
  'address', 'annote', 'author', 'booktitle', 'chapter', 'crossref', 
  'doi', 'edition', 'editor', 'email', 'howpublished', 'institution', 
  'journal', 'month', 'note', 'number', 'organization', 'pages', 
  'publisher', 'school', 'series', 'title', 'type', 'volume', 'year'
] as const;

export type BibTeXType = typeof BIBTEX_TYPES[number];
export type BibTeXField = typeof BIBTEX_FIELDS[number];
