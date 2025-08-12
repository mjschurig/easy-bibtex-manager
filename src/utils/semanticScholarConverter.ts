import { SemanticScholarPaper } from '../types/semanticScholar';
import { CSLEntry, CSLEntryType } from '../types/cslFieldMetadata';

/**
 * Converts a Semantic Scholar paper to CSL-JSON format
 */
export function convertSemanticScholarToCSL(paper: SemanticScholarPaper): CSLEntry {
  // Generate a safe citation key from title and first author
  const firstAuthor = paper.authors?.[0]?.name || 'Unknown';
  const safeFirstAuthor = firstAuthor.split(' ').pop() || 'Unknown'; // Get last name
  const safeTitle = paper.title
    ?.replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    ?.split(' ')
    .slice(0, 3) // Take first 3 words
    .join('')
    || 'Paper';
  
  const citationKey = `${safeFirstAuthor}${paper.year || ''}${safeTitle}`.replace(/\s+/g, '');

  // Determine the CSL type based on venue and publication types
  let type: CSLEntryType = 'article-journal'; // Default to journal article
  
  if (paper.publicationTypes?.includes('Conference') || 
      paper.publicationTypes?.includes('ConferencePaper')) {
    type = 'paper-conference';
  } else if (paper.publicationTypes?.includes('Book')) {
    type = 'book';
  } else if (paper.publicationTypes?.includes('BookSection') || 
             paper.publicationTypes?.includes('Chapter')) {
    type = 'chapter';
  } else if (paper.publicationTypes?.includes('Thesis') || 
             paper.publicationTypes?.includes('Dissertation')) {
    type = 'thesis';
  } else if (paper.publicationTypes?.includes('TechnicalReport') || 
             paper.publicationTypes?.includes('Report')) {
    type = 'report';
  } else if (paper.venue?.toLowerCase().includes('arxiv') || 
             paper.venue?.toLowerCase().includes('preprint') ||
             paper.publicationTypes?.includes('Preprint')) {
    type = 'manuscript';
  } else if (paper.venue?.toLowerCase().includes('proceedings') ||
             paper.venue?.toLowerCase().includes('conference') ||
             paper.venue?.toLowerCase().includes('workshop')) {
    type = 'paper-conference';
  }

  // Convert authors to CSL format
  const authors = paper.authors?.map(author => ({
    family: author.name.split(' ').pop() || author.name, // Last name
    given: author.name.split(' ').slice(0, -1).join(' ') || '', // First/middle names
  })) || [];

  // Build the CSL entry
  const cslEntry: CSLEntry = {
    id: citationKey,
    type: type,
    title: paper.title,
    author: authors.length > 0 ? authors : undefined,
  };

  // Add year if available
  if (paper.year) {
    cslEntry.issued = { 'date-parts': [[paper.year]] };
  } else if (paper.publicationDate) {
    const date = new Date(paper.publicationDate);
    if (!isNaN(date.getTime())) {
      cslEntry.issued = { 
        'date-parts': [[date.getFullYear(), date.getMonth() + 1, date.getDate()]] 
      };
    }
  }

  // Add venue/journal information
  if (paper.venue) {
    if (type === 'paper-conference') {
      cslEntry['container-title'] = paper.venue;
    } else {
      cslEntry['container-title'] = paper.venue;
    }
  }

  // Add journal specific information
  if (paper.journal) {
    if (paper.journal.name && !cslEntry['container-title']) {
      cslEntry['container-title'] = paper.journal.name;
    }
    if (paper.journal.volume) {
      cslEntry.volume = paper.journal.volume;
    }
    if (paper.journal.issue) {
      cslEntry.issue = paper.journal.issue;
    }
    if (paper.journal.pages) {
      cslEntry.page = paper.journal.pages;
    }
  }

  // Add DOI if available (from externalIds or direct field)
  const doi = paper.externalIds?.DOI;
  if (doi) {
    cslEntry.DOI = doi;
  }

  // Add URL if available and no DOI
  if (paper.url && !doi) {
    cslEntry.URL = paper.url;
  }

  // Add Semantic Scholar URL for accessing citations/references later
  if (paper.paperId) {
    const semanticScholarUrl = `https://www.semanticscholar.org/paper/${paper.paperId}`;
    if (!cslEntry.URL) {
      cslEntry.URL = semanticScholarUrl;
    } else if (!cslEntry.note) {
      cslEntry.note = `Semantic Scholar: ${semanticScholarUrl}`;
    } else {
      cslEntry.note += `\n\nSemantic Scholar: ${semanticScholarUrl}`;
    }
  }

  // Add citation count as note if available and significant
  if (paper.citationCount && paper.citationCount > 0) {
    const citationNote = `Cited ${paper.citationCount} times`;
    if (cslEntry.note) {
      cslEntry.note += ` | ${citationNote}`;
    } else {
      cslEntry.note = citationNote;
    }
  }

  // Add fields of study as keywords if available
  if (paper.fieldsOfStudy && paper.fieldsOfStudy.length > 0) {
    cslEntry.keyword = paper.fieldsOfStudy.join(', ');
  }

  // Add abstract as note if available
  if (paper.abstract) {
    if (cslEntry.note) {
      cslEntry.note += `\n\nAbstract: ${paper.abstract}`;
    } else {
      cslEntry.note = `Abstract: ${paper.abstract}`;
    }
  }

  // Add TLDR as additional note if available
  if (paper.tldr?.text) {
    const tldrNote = `TL;DR: ${paper.tldr.text}`;
    if (cslEntry.note) {
      cslEntry.note += `\n\n${tldrNote}`;
    } else {
      cslEntry.note = tldrNote;
    }
  }

  return cslEntry;
}

/**
 * Generates a unique citation key for a paper, ensuring no conflicts with existing entries
 */
export function generateUniqueCitationKey(
  paper: SemanticScholarPaper, 
  existingKeys: Set<string>
): string {
  const baseKey = convertSemanticScholarToCSL(paper).id;
  
  if (!existingKeys.has(baseKey)) {
    return baseKey;
  }

  // If key exists, append a number
  let counter = 1;
  let uniqueKey = `${baseKey}_${counter}`;
  
  while (existingKeys.has(uniqueKey)) {
    counter++;
    uniqueKey = `${baseKey}_${counter}`;
  }
  
  return uniqueKey;
}
