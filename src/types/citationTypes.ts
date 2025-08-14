// UI State Types for Citation.js integration
export type SelectionType = 'entry' | 'variable' | 'author';

export type Selection = {
  type: SelectionType;
  items: string[]; // IDs/names of selected items
}

export type FilterState = {
  searchText: string;
  authorFilter: string;
  yearRange: {
    from?: number;
    to?: number;
  };
  typeFilter: string | 'all';
  customFilters: Record<string, any>;
}

export type SortOption = 'author' | 'year' | 'type' | 'title' | 'id';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'card' | 'list' | 'table';
export type TabType = 'literature' | 'authors' | 'variables' | 'recommendations';

export type ViewState = {
  currentTab: TabType;
  sortBy: SortOption;
  sortDirection: SortDirection;
  displayMode: ViewMode;
}

export type FieldError = {
  field: string;
  message: string;
  code: string;
}

export type ValidationState = {
  isValid: boolean;
  errors: FieldError[];
  fieldErrors: Record<string, string[]>;
}

export type FormState = {
  isDirty: boolean;
  isSubmitting: boolean;
  validation: ValidationState;
  editingEntry?: string; // ID of entry being edited
  editingVariable?: string; // key of variable being edited
}

export type CitationUIState = {
  cite: any; // Citation.js Cite instance
  variables: Record<string, string>; // @STRING variables (Citation.js doesn't handle these natively)
  selection: Selection;
  filters: FilterState;
  view: ViewState;
  form: FormState;
  filename?: string;
  isLoaded: boolean;
}

// Common CSL-JSON field mappings for UI display
export const CSL_FIELD_LABELS: Record<string, string> = {
  id: 'Citation Key',
  type: 'Type',
  title: 'Title',
  author: 'Authors',
  editor: 'Editors',
  issued: 'Year',
  'container-title': 'Journal/Book',
  volume: 'Volume',
  issue: 'Issue',
  page: 'Pages',
  publisher: 'Publisher',
  'publisher-place': 'Address',
  DOI: 'DOI',
  note: 'Note',
  chapter: 'Chapter',
  edition: 'Edition',
  'collection-title': 'Series',
  school: 'School',
  institution: 'Institution',
  organization: 'Organization',
  howpublished: 'How Published',
  month: 'Month',
  crossref: 'Cross Reference',
  email: 'Email'
};

// CSL-JSON to BibTeX type mapping
export const CSL_TO_BIBTEX_TYPE: Record<string, string> = {
  'article-journal': 'article',
  'article-magazine': 'article',
  'article-newspaper': 'article',
  'book': 'book',
  'chapter': 'inbook',
  'paper-conference': 'inproceedings',
  'thesis': 'phdthesis',
  'manuscript': 'unpublished',
  'report': 'techreport',
  'webpage': 'misc',
  'entry-dictionary': 'incollection',
  'entry-encyclopedia': 'incollection'
};

export const BIBTEX_TO_CSL_TYPE: Record<string, string> = {
  'article': 'article-journal',
  'book': 'book',
  'booklet': 'book',
  'inbook': 'chapter',
  'incollection': 'entry-dictionary',
  'inproceedings': 'paper-conference',
  'conference': 'paper-conference',
  'manual': 'book',
  'mastersthesis': 'thesis',
  'misc': 'webpage',
  'phdthesis': 'thesis',
  'proceedings': 'book',
  'techreport': 'report',
  'unpublished': 'manuscript'
}; 