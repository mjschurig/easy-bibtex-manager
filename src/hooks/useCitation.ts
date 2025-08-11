import { useMemo, useCallback } from 'react';
import Cite from 'citation-js';
import { 
  useCitationData, 
  useCitationActions, 
} from '../contexts/CitationContext';

import {
  filterEntriesByText,
  filterEntriesByAuthor,
  filterEntriesByYearRange,
  filterEntriesByType,
  sortEntries,
  getAllAuthorNames,
  getEntriesByAuthor
} from '../utils/cslUtils';

// Re-export the main context hooks for convenience
export { 
  useCitationData, 
  useCitationActions, 
} from '../contexts/CitationContext';

// Hook for filtered and sorted entries
export function useFilteredAndSortedEntries() {
  const { state } = useCitationData();

  return useMemo(() => {
    let entries = [...state.cite.data];
    
    // Apply filters
    if (state.filters.searchText) {
      entries = filterEntriesByText(entries, state.filters.searchText, state.variables);
    }
    
    if (state.filters.authorFilter) {
      entries = filterEntriesByAuthor(entries, state.filters.authorFilter, state.variables);
    }
    
    if (state.filters.yearRange.from || state.filters.yearRange.to) {
      entries = filterEntriesByYearRange(entries, state.filters.yearRange.from, state.filters.yearRange.to);
    }
    
    if (state.filters.typeFilter && state.filters.typeFilter !== 'all') {
      entries = filterEntriesByType(entries, state.filters.typeFilter);
    }
    
    // Apply sorting
    entries = sortEntries(entries, state.view.sortBy, state.view.sortDirection);
    
    return entries;
  }, [state.cite.data, state.filters, state.view.sortBy, state.view.sortDirection, state.variables]);
}

// Hook for search functionality
export function useSearch() {
  const { state } = useCitationData();
  const { setFilters } = useCitationActions();
  
  const searchText = state.filters.searchText;
  const authorFilter = state.filters.authorFilter;
  
  const setSearchText = useCallback((text: string) => {
    // Only update if the value has actually changed
    if (text !== state.filters.searchText) {
      setFilters({ searchText: text });
    }
  }, [setFilters, state.filters.searchText]);
  
  const setAuthorFilter = useCallback((author: string) => {
    // Only update if the value has actually changed
    if (author !== state.filters.authorFilter) {
      setFilters({ authorFilter: author });
    }
  }, [setFilters, state.filters.authorFilter]);
  
  const setYearRange = useCallback((from?: number, to?: number) => {
    // Only update if the values have actually changed
    const currentRange = state.filters.yearRange;
    if (currentRange.from !== from || currentRange.to !== to) {
      setFilters({ yearRange: { from, to } });
    }
  }, [setFilters, state.filters.yearRange]);
  
  const setTypeFilter = useCallback((type: string) => {
    // Only update if the value has actually changed
    if (type !== state.filters.typeFilter) {
      setFilters({ typeFilter: type });
    }
  }, [setFilters, state.filters.typeFilter]);
  
  return {
    searchText,
    authorFilter,
    yearRange: state.filters.yearRange,
    typeFilter: state.filters.typeFilter,
    setSearchText,
    setAuthorFilter,
    setYearRange,
    setTypeFilter
  };
}

// Hook for entry statistics
export function useEntryStats() {
  const { state } = useCitationData();
  
  return useMemo(() => {
    const entries = state.cite.data;
    const totalEntries = entries.length;
    
    // Count by type
    const typeCount: Record<string, number> = {};
    entries.forEach((entry: any) => {
      const type = entry.type || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    // Count by year
    const yearCount: Record<string, number> = {};
    entries.forEach((entry: any) => {
      let year = 'unknown';
      if (entry.issued && entry.issued['date-parts'] && entry.issued['date-parts'][0]) {
        year = String(entry.issued['date-parts'][0][0]);
      }
      yearCount[year] = (yearCount[year] || 0) + 1;
    });
    
    // Author statistics
    const authorCount: Record<string, number> = {};
    entries.forEach((entry: any) => {
      if (entry.author && Array.isArray(entry.author)) {
        entry.author.forEach((author: any) => {
          const name = author.literal || 
                      (author.family && author.given ? `${author.given} ${author.family}` : 
                       author.family || author.given || 'Unknown');
          authorCount[name] = (authorCount[name] || 0) + 1;
        });
      }
    });
    
    return {
      totalEntries,
      typeCount,
      yearCount,
      authorCount,
      mostProductiveAuthor: Object.entries(authorCount)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None',
      yearRange: {
        earliest: Math.min(...Object.keys(yearCount)
          .filter(y => y !== 'unknown')
          .map(y => parseInt(y))
          .filter(y => !isNaN(y))),
        latest: Math.max(...Object.keys(yearCount)
          .filter(y => y !== 'unknown')
          .map(y => parseInt(y))
          .filter(y => !isNaN(y)))
      }
    };
  }, [state.cite.data]);
}

// Hook for author-centric operations
export function useAuthors() {
  const { state } = useCitationData();
  
  const authors = useMemo(() => getAllAuthorNames(state.cite.data, state.variables), [state.cite.data, state.variables]);
  
  const getAuthorStats = (authorName: string) => {
    const entries = getEntriesByAuthor(state.cite.data, authorName);
    const yearSet = new Set<string>();
    const typeSet = new Set<string>();
    
    entries.forEach((entry: any) => {
      if (entry.issued && entry.issued['date-parts'] && entry.issued['date-parts'][0]) {
        yearSet.add(String(entry.issued['date-parts'][0][0]));
      }
      if (entry.type) {
        typeSet.add(entry.type);
      }
    });
    
    return {
      totalPublications: entries.length,
      years: Array.from(yearSet).sort(),
      types: Array.from(typeSet),
      entries
    };
  };
  
  return {
    authors,
    getAuthorStats,
    getEntriesByAuthor: (authorName: string) => getEntriesByAuthor(state.cite.data, authorName)
  };
}

// Hook for selection management
export function useSelection() {
  const { state } = useCitationData();
  const { 
    setSelection, 
    addToSelection, 
    removeFromSelection, 
    clearSelection,
    getSelectedEntries 
  } = useCitationActions();
  
  const hasSelection = state.selection.items.length > 0;
  const selectionCount = state.selection.items.length;
  
  const toggleSelection = (type: 'entry' | 'variable' | 'author', item: string) => {
    if (state.selection.type !== type) {
      setSelection({ type, items: [item] });
    } else if (state.selection.items.includes(item)) {
      removeFromSelection(type, [item]);
    } else {
      addToSelection(type, [item]);
    }
  };
  
  const selectAll = (type: 'entry' | 'variable' | 'author', items: string[]) => {
    setSelection({ type, items });
  };
  
  return {
    selection: state.selection,
    hasSelection,
    selectionCount,
    selectedEntries: getSelectedEntries(),
    toggleSelection,
    selectAll,
    clearSelection,
    setSelection,
    addToSelection,
    removeFromSelection
  };
}

// Hook for form management
export function useForm() {
  const { state } = useCitationData();
  const { startEditingEntry, startEditingVariable, stopEditing } = useCitationActions();
  
  const isEditing = !!(state.form.editingEntry || state.form.editingVariable);
  const editingEntry = state.form.editingEntry;
  const editingVariable = state.form.editingVariable;
  
  return {
    form: state.form,
    isEditing,
    editingEntry,
    editingVariable,
    startEditingEntry,
    startEditingVariable,
    stopEditing
  };
}

// Hook for quick actions
export function useQuickActions() {
  const { state } = useCitationData();
  const { 
    addEntry, 
    deleteEntry, 
    duplicateEntry, 
    exportToBibTeX,
    resetCitation 
  } = useCitationActions();
  
  const createQuickEntry = async (title: string, authors: string[], type: string = 'article-journal') => {
    const authorArray = authors.map(name => {
      const parts = name.split(' ');
      const family = parts.pop() || '';
      const given = parts.join(' ');
      return { given, family };
    });
    
    const entry = {
      title,
      author: authorArray,
      type,
      issued: { 'date-parts': [[new Date().getFullYear()]] }
    };
    
    return await addEntry(entry);
  };
  
  const bulkDelete = (ids: string[]) => {
    ids.forEach(id => deleteEntry(id));
  };
  
  const exportSelection = (selectedIds: string[]) => {
    const selectedEntries = state.cite.data.filter((entry: any) => selectedIds.includes(entry.id));
    // Create a temporary Citation.js instance with just selected entries
    const tempCite = new Cite(selectedEntries);
    return tempCite.format('bibtex');
  };
  
  return {
    createQuickEntry,
    bulkDelete,
    duplicateEntry,
    exportSelection,
    exportAll: exportToBibTeX,
    resetCitation
  };
} 