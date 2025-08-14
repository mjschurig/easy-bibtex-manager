// Utility functions for working with CSL-JSON data from Citation.js

// Extract year from CSL-JSON issued field
export function getYear(entry: any): string {
  if (!entry.issued) return '';
  
  if (entry.issued['date-parts'] && entry.issued['date-parts'][0]) {
    return String(entry.issued['date-parts'][0][0] || '');
  }
  
  if (entry.issued.literal) {
    // Try to extract year from literal date string
    const match = entry.issued.literal.match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : '';
  }
  
  return '';
}

// Format authors from CSL-JSON format
export function formatAuthors(authors: any[], variables?: Record<string, string>): string {
  if (!Array.isArray(authors) || authors.length === 0) return '';
  
  return authors.map(author => {
    if (author.literal) {
      // If it's a variable reference and we have variables, show the value
      if (variables && variables[author.literal]) {
        return variables[author.literal];
      }
      return author.literal;
    }
    
    const given = author.given || '';
    const family = author.family || '';
    
    if (given && family) {
      return `${given} ${family}`;
    }
    return family || given || '';
  }).join(', ');
}

// Format authors in "Last, First" format
export function formatAuthorsLastFirst(authors: any[], variables?: Record<string, string>): string {
  if (!Array.isArray(authors) || authors.length === 0) return '';
  
  return authors.map(author => {
    if (author.literal) {
      // If it's a variable reference and we have variables, show the value
      if (variables && variables[author.literal]) {
        return variables[author.literal];
      }
      return author.literal;
    }
    
    const given = author.given || '';
    const family = author.family || '';
    
    if (given && family) {
      return `${family}, ${given}`;
    }
    return family || given || '';
  }).join('; ');
}

// Get the main title from CSL-JSON
export function getTitle(entry: any): string {
  return entry.title || '';
}

// Get the container title (journal, book, etc.)
export function getContainerTitle(entry: any): string {
  return entry['container-title'] || '';
}

// Get pages in a readable format
export function getPages(entry: any): string {
  if (entry.page) return entry.page;
  if (entry['page-first'] && entry['page-last']) {
    return `${entry['page-first']}-${entry['page-last']}`;
  }
  if (entry['page-first']) return entry['page-first'];
  return '';
}

// Get volume and issue combined
export function getVolumeIssue(entry: any): string {
  const volume = entry.volume || '';
  const issue = entry.issue || entry.number || '';
  
  if (volume && issue) {
    return `${volume}(${issue})`;
  }
  return volume || issue;
}

// Get all authors as a flat array of names
export function getAllAuthorNames(entries: any[], variables?: Record<string, string>): string[] {
  const authorSet = new Set<string>();
  
  entries.forEach(entry => {
    if (entry.author) {
      entry.author.forEach((author: any) => {
        let name;
        if (author.literal) {
          // If it's a variable reference and we have variables, show the value
          name = (variables && variables[author.literal]) ? variables[author.literal] : author.literal;
        } else {
          name = (author.family && author.given ? `${author.given} ${author.family}` : 
                  author.family || author.given || '');
        }
        if (name) authorSet.add(name);
      });
    }
    if (entry.editor) {
      entry.editor.forEach((editor: any) => {
        let name;
        if (editor.literal) {
          // If it's a variable reference and we have variables, show the value
          name = (variables && variables[editor.literal]) ? variables[editor.literal] : editor.literal;
        } else {
          name = (editor.family && editor.given ? `${editor.given} ${editor.family}` : 
                  editor.family || editor.given || '');
        }
        if (name) authorSet.add(name);
      });
    }
  });
  
  return Array.from(authorSet).sort();
}

// Filter entries by text search
export function filterEntriesByText(entries: any[], searchText: string, variables?: Record<string, string>): any[] {
  if (!searchText.trim()) return entries;
  
  const query = searchText.toLowerCase();
  
  return entries.filter(entry => {
    const searchableText = [
      getTitle(entry),
      formatAuthors(entry.author || [], variables),
      formatAuthors(entry.editor || [], variables),
      getContainerTitle(entry),
      getYear(entry),
      entry.id || '',
      entry.DOI || '',
      entry.note || ''
    ].join(' ').toLowerCase();
    
    return searchableText.includes(query);
  });
}

// Filter entries by author
export function filterEntriesByAuthor(entries: any[], authorName: string, variables?: Record<string, string>): any[] {
  if (!authorName.trim()) return entries;
  
  return entries.filter(entry => {
    const allAuthors = [
      ...(entry.author || []),
      ...(entry.editor || [])
    ];
    
    return allAuthors.some(author => {
      let name;
      if (author.literal) {
        // If it's a variable reference and we have variables, check both the value and the key
        name = (variables && variables[author.literal]) ? variables[author.literal] : author.literal;
      } else {
        name = (author.family && author.given ? `${author.given} ${author.family}` : 
                author.family || author.given || '');
      }
      return name.toLowerCase().includes(authorName.toLowerCase());
    });
  });
}

// Filter entries by year range
export function filterEntriesByYearRange(entries: any[], fromYear?: number, toYear?: number): any[] {
  if (!fromYear && !toYear) return entries;
  
  return entries.filter(entry => {
    const year = parseInt(getYear(entry));
    if (!year) return false;
    
    if (fromYear && year < fromYear) return false;
    if (toYear && year > toYear) return false;
    
    return true;
  });
}

// Filter entries by type
export function filterEntriesByType(entries: any[], type: string): any[] {
  if (!type || type === 'all') return entries;
  
  return entries.filter(entry => entry.type === type);
}

// Sort entries by different criteria
export function sortEntries(entries: any[], sortBy: string, direction: 'asc' | 'desc' = 'asc'): any[] {
  const sorted = [...entries].sort((a, b) => {
    let valueA: any;
    let valueB: any;
    
    switch (sortBy) {
      case 'author':
        valueA = formatAuthors(a.author || []).toLowerCase();
        valueB = formatAuthors(b.author || []).toLowerCase();
        break;
      case 'year':
        valueA = parseInt(getYear(a)) || 0;
        valueB = parseInt(getYear(b)) || 0;
        break;
      case 'title':
        valueA = getTitle(a).toLowerCase();
        valueB = getTitle(b).toLowerCase();
        break;
      case 'type':
        valueA = a.type || '';
        valueB = b.type || '';
        break;
      case 'id':
      default:
        valueA = a.id || '';
        valueB = b.id || '';
        break;
    }
    
    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
}

// Get entries by a specific author
export function getEntriesByAuthor(entries: any[], authorName: string): any[] {
  return entries.filter(entry => {
    const allAuthors = [
      ...(entry.author || []),
      ...(entry.editor || [])
    ];
    
    return allAuthors.some(author => {
      const name = author.literal || 
                  (author.family && author.given ? `${author.given} ${author.family}` : 
                   author.family || author.given || '');
      return name === authorName;
    });
  });
}

// Create a new CSL-JSON entry with default values
export function createNewEntry(id: string, type: string = 'article-journal'): any {
  return {
    id,
    'citation-key': id, // Preserve ID during BibTeX export/import
    type,
    title: '',
    author: [],
    issued: { 'date-parts': [[new Date().getFullYear()]] }
  };
}

// Update an entry with new data, ensuring proper CSL-JSON format
export function updateEntry(entry: any, updates: Record<string, any>): any {
  const updated = { ...entry };
  
  // Handle special cases for CSL-JSON format
  Object.keys(updates).forEach(key => {
    const value = updates[key];
    
    if (key === 'year' && value) {
      // Convert year to CSL-JSON issued format
      updated.issued = { 'date-parts': [[parseInt(value)]] };
    } else if (key === 'issued') {
      updated.issued = value;
    } else if (key === 'id') {
      // When updating ID, also update citation-key to preserve it during BibTeX export/import
      updated.id = value;
      updated['citation-key'] = value;
    } else {
      updated[key] = value;
    }
  });
  
  return updated;
}

// Convert CSL-JSON entry to a format suitable for form editing
export function entryToFormData(entry: any): Record<string, any> {
  return {
    id: entry.id || '',
    type: entry.type || 'article-journal',
    title: entry.title || '',
    author: entry.author || [],
    editor: entry.editor || [],
    year: getYear(entry),
    'container-title': entry['container-title'] || '',
    volume: entry.volume || '',
    issue: entry.issue || entry.number || '',
    page: getPages(entry),
    publisher: entry.publisher || '',
    'publisher-place': entry['publisher-place'] || '',
    DOI: entry.DOI || '',
    note: entry.note || '',
    chapter: entry.chapter || '',
    edition: entry.edition || '',
    'collection-title': entry['collection-title'] || '',
    school: entry.school || '',
    institution: entry.institution || '',
    organization: entry.organization || '',
    howpublished: entry.howpublished || '',
    month: entry.month || '',
    crossref: entry.crossref || '',
    email: entry.email || ''
  };
}

// Convert form data back to proper CSL-JSON format
export function formDataToEntry(formData: Record<string, any>): any {
  const entry: any = {
    id: formData.id || '',
    type: formData.type || 'article-journal',
    title: formData.title || '',
    author: formData.author || [],
    editor: formData.editor || []
  };
  
  // Handle year conversion
  if (formData.year) {
    entry.issued = { 'date-parts': [[parseInt(formData.year)]] };
  }
  
  // Add other fields if they have values
  const fieldMap: Record<string, string> = {
    'container-title': 'container-title',
    volume: 'volume',
    issue: 'issue',
    page: 'page',
    publisher: 'publisher',
    'publisher-place': 'publisher-place',
    DOI: 'DOI',
    note: 'note',
    chapter: 'chapter',
    edition: 'edition',
    'collection-title': 'collection-title',
    school: 'school',
    institution: 'institution',
    organization: 'organization',
    howpublished: 'howpublished',
    month: 'month',
    crossref: 'crossref',
    email: 'email'
  };
  
  Object.keys(fieldMap).forEach(formKey => {
    const cslKey = fieldMap[formKey];
    if (formData[formKey]) {
      entry[cslKey] = formData[formKey];
    }
  });
  
  return entry;
} 