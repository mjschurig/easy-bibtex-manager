import { useState, useCallback, useMemo } from 'react';
import { BibTeXEntry, StringVariables } from '../types/bibtex';
import { parseBibtex, processEntries, serializeBibtex } from '../utils/bibtexParser';

export interface BibTeXState {
  entries: BibTeXEntry[];
  stringVariables: StringVariables;
  processedEntries: BibTeXEntry[];
  filename: string | null;
  isLoaded: boolean;
}

export interface BibTeXActions {
  loadFile: (content: string, filename: string) => void;
  addEntry: (entry: BibTeXEntry) => void;
  updateEntry: (key: string, updates: Partial<BibTeXEntry>) => void;
  deleteEntry: (key: string) => void;
  updateStringVariable: (key: string, value: string) => void;
  addStringVariable: (key: string, value: string) => void;
  deleteStringVariable: (key: string) => void;
  exportBibtex: () => string;
  reset: () => void;
}

export interface FilterOptions {
  searchText: string;
  authorFilter: string;
  sortBy: 'author' | 'year' | 'type';
}

export function useBibTeX() {
  const [state, setState] = useState<BibTeXState>({
    entries: [],
    stringVariables: {},
    processedEntries: [],
    filename: null,
    isLoaded: false,
  });

  const loadFile = useCallback((content: string, filename: string) => {
    try {
      const parsed = parseBibtex(content);
      const processed = processEntries(parsed.entries, parsed.strings);
      
      setState({
        entries: parsed.entries,
        stringVariables: parsed.strings,
        processedEntries: processed,
        filename,
        isLoaded: true,
      });
    } catch (error) {
      throw new Error(`Failed to parse BibTeX file: ${error}`);
    }
  }, []);

  const reprocessEntries = useCallback((entries: BibTeXEntry[], strings: StringVariables) => {
    const processed = processEntries(entries, strings);
    return processed;
  }, []);

  const addEntry = useCallback((entry: BibTeXEntry) => {
    setState(prev => {
      // Check for duplicate keys
      const existingEntry = prev.entries.find(e => e.key === entry.key);
      if (existingEntry) {
        throw new Error(`Entry with key "${entry.key}" already exists`);
      }

      const newEntries = [...prev.entries, entry];
      const processed = reprocessEntries(newEntries, prev.stringVariables);
      
      return {
        ...prev,
        entries: newEntries,
        processedEntries: processed,
      };
    });
  }, [reprocessEntries]);

  const updateEntry = useCallback((key: string, updates: Partial<BibTeXEntry>) => {
    setState(prev => {
      const entryIndex = prev.entries.findIndex(e => e.key === key);
      if (entryIndex === -1) {
        throw new Error(`Entry with key "${key}" not found`);
      }

      // If key is being changed, check for duplicates
      if (updates.key && updates.key !== key) {
        const existingEntry = prev.entries.find(e => e.key === updates.key);
        if (existingEntry) {
          throw new Error(`Entry with key "${updates.key}" already exists`);
        }
      }

      const newEntries = [...prev.entries];
      newEntries[entryIndex] = { ...newEntries[entryIndex], ...updates };
      const processed = reprocessEntries(newEntries, prev.stringVariables);
      
      return {
        ...prev,
        entries: newEntries,
        processedEntries: processed,
      };
    });
  }, [reprocessEntries]);

  const deleteEntry = useCallback((key: string) => {
    setState(prev => {
      const newEntries = prev.entries.filter(e => e.key !== key);
      const processed = reprocessEntries(newEntries, prev.stringVariables);
      
      return {
        ...prev,
        entries: newEntries,
        processedEntries: processed,
      };
    });
  }, [reprocessEntries]);

  const updateStringVariable = useCallback((key: string, value: string) => {
    setState(prev => {
      const newStringVariables = { ...prev.stringVariables, [key]: value };
      const processed = reprocessEntries(prev.entries, newStringVariables);
      
      return {
        ...prev,
        stringVariables: newStringVariables,
        processedEntries: processed,
      };
    });
  }, [reprocessEntries]);

  const addStringVariable = useCallback((key: string, value: string) => {
    setState(prev => {
      if (prev.stringVariables[key]) {
        throw new Error(`String variable "${key}" already exists`);
      }
      
      const newStringVariables = { ...prev.stringVariables, [key]: value };
      const processed = reprocessEntries(prev.entries, newStringVariables);
      
      return {
        ...prev,
        stringVariables: newStringVariables,
        processedEntries: processed,
      };
    });
  }, [reprocessEntries]);

  const deleteStringVariable = useCallback((key: string) => {
    setState(prev => {
      const newStringVariables = { ...prev.stringVariables };
      delete newStringVariables[key];
      const processed = reprocessEntries(prev.entries, newStringVariables);
      
      return {
        ...prev,
        stringVariables: newStringVariables,
        processedEntries: processed,
      };
    });
  }, [reprocessEntries]);

  const exportBibtex = useCallback(() => {
    return serializeBibtex(state.entries, state.stringVariables);
  }, [state.entries, state.stringVariables]);

  const reset = useCallback(() => {
    setState({
      entries: [],
      stringVariables: {},
      processedEntries: [],
      filename: null,
      isLoaded: false,
    });
  }, []);

  // Get all unique authors
  const allAuthors = useMemo(() => {
    const authors = new Set<string>();
    state.processedEntries.forEach(entry => {
      if (entry.authors) {
        entry.authors.forEach(author => authors.add(author));
      }
    });
    return Array.from(authors).sort();
  }, [state.processedEntries]);

  const actions: BibTeXActions = {
    loadFile,
    addEntry,
    updateEntry,
    deleteEntry,
    updateStringVariable,
    addStringVariable,
    deleteStringVariable,
    exportBibtex,
    reset,
  };

  return {
    state,
    actions,
    allAuthors,
  };
}

export function useFilteredEntries(entries: BibTeXEntry[], filters: FilterOptions) {
  return useMemo(() => {
    let filtered = entries.filter(entry => {
      // Text filter
      const searchText = `${entry.processedFields?.title || ''} ${entry.processedFields?.author || ''} ${entry.processedFields?.year || ''} ${entry.key}`.toLowerCase();
      const textMatch = !filters.searchText || searchText.includes(filters.searchText.toLowerCase());

      // Author filter
      const authorMatch = !filters.authorFilter || (entry.authors && entry.authors.includes(filters.authorFilter));

      return textMatch && authorMatch;
    });

    // Sort entries
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'year':
          const yearA = parseInt(a.processedFields?.year || '0') || 0;
          const yearB = parseInt(b.processedFields?.year || '0') || 0;
          return yearB - yearA;
        case 'type':
          return a.type.localeCompare(b.type);
        case 'author':
        default:
          const authorA = a.processedFields?.author || '';
          const authorB = b.processedFields?.author || '';
          return authorA.localeCompare(authorB);
      }
    });

    return filtered;
  }, [entries, filters]);
} 