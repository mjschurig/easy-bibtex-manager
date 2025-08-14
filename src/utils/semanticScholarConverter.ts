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

  // Store Semantic Scholar ID in custom field for BibTeX s2id support
  if (paper.paperId) {
    setSemanticScholarIdInCustom(cslEntry, paper.paperId);
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

/**
 * Extracts the Semantic Scholar ID from a CSL entry
 * @param entry CSL entry that may contain S2ID in custom field or other locations
 * @returns Semantic Scholar ID or null if not found
 */
export function getSemanticScholarIdFromEntry(entry: any): string | null {
  // Primary: check custom.S2ID field (preserved through BibTeX import)
  if (entry.custom?.S2ID) {
    return entry.custom.S2ID;
  }
  
  // Legacy: check custom field (direct assignment)
  if (entry['semantic-scholar-id']) {
    return entry['semantic-scholar-id'];
  }
  
  // Fallback: check if the entry ID looks like a Semantic Scholar paperId (40-character hex)
  if (entry.id && /^[a-f0-9]{40}$/i.test(entry.id)) {
    return entry.id;
  }
  
  // Legacy: check URL for Semantic Scholar ID
  if (entry.URL?.includes('semanticscholar.org/paper/')) {
    const match = entry.URL.match(/\/paper\/([a-f0-9A-F\.\/\-_:]+)/);
    if (match) return match[1];
  }
  
  // Legacy: check note for Semantic Scholar URL
  if (entry.note?.includes('semanticscholar.org/paper/')) {
    const match = entry.note.match(/semanticscholar\.org\/paper\/([a-f0-9A-F\.\/\-_:]+)/);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Extracts the Corpus ID from a CSL entry
 * @param entry CSL entry that may contain Corpus ID in custom field
 * @returns Corpus ID or null if not found
 */
export function getCorpusIdFromEntry(entry: any): string | null {
  // Primary: check custom field for corpus ID
  if (entry.custom?.CORPUSID) {
    return entry.custom.CORPUSID;
  }
  
  // Legacy: check direct custom field
  if (entry['corpus-id']) {
    return entry['corpus-id'];
  }
  
  return null;
}

/**
 * Sets the Semantic Scholar ID in the custom field
 * @param entry CSL entry to modify
 * @param semanticScholarId Semantic Scholar paper ID
 */
export function setSemanticScholarIdInCustom(entry: any, semanticScholarId: string): void {
  if (!entry.custom) {
    entry.custom = {};
  }
  
  entry.custom.S2ID = semanticScholarId;
}

/**
 * Enhances BibTeX export by injecting custom fields like s2id
 * @param bibtex Original BibTeX string from Citation.js
 * @param entry CSL entry with custom fields
 * @returns Enhanced BibTeX with custom fields
 */
export function enhanceBibTeXWithCustomFields(bibtex: string, entry: any): string {
  if (!entry.custom) {
    return bibtex;
  }
  
  let enhanced = bibtex;
  
  // Inject s2id field if present
  if (entry.custom.S2ID) {
    enhanced = injectBibTeXField(enhanced, 's2id', entry.custom.S2ID);
  }
  
  return enhanced;
}

/**
 * Injects a field into a BibTeX entry
 * @param bibtex BibTeX string
 * @param fieldName Field name to inject
 * @param fieldValue Field value to inject
 * @returns BibTeX with injected field
 */
function injectBibTeXField(bibtex: string, fieldName: string, fieldValue: string): string {
  const lines = bibtex.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    result.push(line);
    
    // If this line contains a field and the next line is the closing brace
    if (line.includes('=') && line.trim().endsWith(',') && 
        i < lines.length - 1 && lines[i + 1].trim() === '}') {
      // Insert the custom field before the closing brace
      result.push(`\t${fieldName} = {${fieldValue}},`);
    }
  }
  
  return result.join('\n');
}

/**
 * Attempts to extract and set Semantic Scholar ID from URL if not already in custom fields
 * This handles cases where entries have the S2 URL but missing custom.S2ID
 * @param entry CSL entry to check and potentially update
 */
export function ensureSemanticScholarIdInCustom(entry: any): void {
  // Skip if S2ID is already set in custom fields
  if (entry.custom?.S2ID) {
    return;
  }
  
  // Try to extract from existing getSemanticScholarIdFromEntry logic
  const extractedId = getSemanticScholarIdFromEntry(entry);
  
  if (extractedId) {
    setSemanticScholarIdInCustom(entry, extractedId);
  }
}
