// Field metadata for CSL-JSON entries from Citation.js

export type CSLFieldType = 'text' | 'textarea' | 'authors' | 'date' | 'select' | 'number' | 'pages';

export interface CSLFieldMetadata {
  name: string;
  label: string;
  type: CSLFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: readonly string[]; // for select fields
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

// CSL-JSON entry types mapping to BibTeX types
export const CSL_ENTRY_TYPES = [
  'article-journal',
  'article-magazine', 
  'article-newspaper',
  'book',
  'chapter',
  'paper-conference',
  'thesis',
  'manuscript',
  'report',
  'webpage',
  'entry-dictionary',
  'entry-encyclopedia'
] as const;

export type CSLEntryType = typeof CSL_ENTRY_TYPES[number];

// Field definitions for CSL-JSON entries
export const CSL_FIELD_METADATA: Record<string, CSLFieldMetadata> = {
  id: {
    name: 'id',
    label: 'Citation ID',
    type: 'text',
    required: true,
    placeholder: 'smith2023',
    helpText: 'Unique identifier for this entry',
    validation: {
      minLength: 1,
      pattern: '^[a-zA-Z][a-zA-Z0-9_-]*$'
    }
  },
  type: {
    name: 'type',
    label: 'Entry Type',
    type: 'select',
    required: true,
    options: CSL_ENTRY_TYPES
  },
  title: {
    name: 'title',
    label: 'Title',
    type: 'text',
    required: true,
    placeholder: 'The Title of the Work'
  },
  author: {
    name: 'author',
    label: 'Authors',
    type: 'authors',
    required: false,
    helpText: 'Enter authors in the format: Given Family'
  },
  editor: {
    name: 'editor',
    label: 'Editors',
    type: 'authors',
    required: false,
    helpText: 'Enter editors in the format: Given Family'
  },
  issued: {
    name: 'issued',
    label: 'Date Published',
    type: 'date',
    required: false,
    placeholder: '2023',
    helpText: 'Publication date (year)'
  },
  'container-title': {
    name: 'container-title',
    label: 'Journal/Book Title',
    type: 'text',
    required: false,
    placeholder: 'Nature, Proceedings of...'
  },
  volume: {
    name: 'volume',
    label: 'Volume',
    type: 'text',
    required: false
  },
  issue: {
    name: 'issue',
    label: 'Issue/Number',
    type: 'text',
    required: false
  },
  page: {
    name: 'page',
    label: 'Pages',
    type: 'pages',
    required: false,
    placeholder: '123-145',
    helpText: 'Page numbers or ranges, e.g., "123" or "123-145"'
  },
  publisher: {
    name: 'publisher',
    label: 'Publisher',
    type: 'text',
    required: false
  },
  'publisher-place': {
    name: 'publisher-place',
    label: 'Publisher Location',
    type: 'text',
    required: false
  },
  DOI: {
    name: 'DOI',
    label: 'DOI',
    type: 'text',
    required: false,
    placeholder: '10.1000/182',
    validation: {
      pattern: '^10\\..+'
    }
  },
  note: {
    name: 'note',
    label: 'Note',
    type: 'textarea',
    required: false
  },
  abstract: {
    name: 'abstract',
    label: 'Abstract',
    type: 'textarea',
    required: false
  },
  chapter: {
    name: 'chapter',
    label: 'Chapter',
    type: 'text',
    required: false
  },
  edition: {
    name: 'edition',
    label: 'Edition',
    type: 'text',
    required: false
  },
  'collection-title': {
    name: 'collection-title',
    label: 'Series',
    type: 'text',
    required: false
  },
  school: {
    name: 'school',
    label: 'School',
    type: 'text',
    required: false
  },
  institution: {
    name: 'institution',
    label: 'Institution',
    type: 'text',
    required: false
  },
  organization: {
    name: 'organization',
    label: 'Organization',
    type: 'text',
    required: false
  },
  URL: {
    name: 'URL',
    label: 'URL',
    type: 'text',
    required: false,
    placeholder: 'https://example.com'
  }
};

// CSL-JSON author object type
export interface CSLAuthor {
  given?: string;
  family?: string;
  literal?: string;
}

// CSL-JSON date object type  
export interface CSLDate {
  'date-parts'?: number[][];
  literal?: string;
}

// Basic CSL-JSON entry interface
export interface CSLEntry {
  id: string;
  type: CSLEntryType;
  title?: string;
  author?: CSLAuthor[];
  editor?: CSLAuthor[];
  issued?: CSLDate;
  'container-title'?: string;
  volume?: string;
  issue?: string;
  page?: string;
  publisher?: string;
  'publisher-place'?: string;
  DOI?: string;
  note?: string;
  abstract?: string;
  chapter?: string;
  edition?: string;
  'collection-title'?: string;
  school?: string;
  institution?: string;
  organization?: string;
  URL?: string;
  [key: string]: unknown; // Allow for additional CSL-JSON fields
} 