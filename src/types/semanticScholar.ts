// Semantic Scholar API Types
export interface SemanticScholarAuthor {
  authorId: string;
  name: string;
}

export interface SemanticScholarVenue {
  id: string;
  name: string;
}

export interface SemanticScholarPaper {
  paperId: string;
  corpusId?: number;
  externalIds?: {
    ArXiv?: string;
    MAG?: string;
    ACL?: string;
    PubMed?: string;
    Medline?: string;
    PubMedCentral?: string;
    DBLP?: string;
    DOI?: string;
  };
  title: string;
  abstract?: string;
  venue?: string;
  publicationVenue?: {
    id?: string;
    name?: string;
    type?: string;
    alternate_names?: string[];
    url?: string;
  };
  year?: number;
  authors: SemanticScholarAuthor[];
  citationCount?: number;
  referenceCount?: number;
  influentialCitationCount?: number;
  isOpenAccess?: boolean;
  openAccessPdf?: {
    url?: string;
    status?: string;
  };
  fieldsOfStudy?: string[];
  s2FieldsOfStudy?: Array<{
    category: string;
    source: string;
  }>;
  publicationTypes?: string[];
  publicationDate?: string;
  journal?: {
    name?: string;
    pages?: string;
    volume?: string;
    issue?: string;
  };
  citationStyles?: {
    bibtex?: string;
  };
  url?: string;
  tldr?: {
    model: string;
    text: string;
  };
}

export interface SemanticScholarSearchResponse {
  total: number;
  offset: number;
  next?: number;
  data: SemanticScholarPaper[];
}

export interface SemanticScholarDetailedPaper extends SemanticScholarPaper {
  // Additional fields available when fetching a specific paper
  embedding?: number[];
  citations?: SemanticScholarPaper[];
  references?: SemanticScholarPaper[];
}
