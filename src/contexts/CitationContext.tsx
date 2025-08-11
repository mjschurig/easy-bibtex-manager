import React, { createContext, useContext, useReducer, useMemo, useRef, useEffect } from 'react';
import Cite from 'citation-js';
import { 
  CitationUIState, 
  Selection, 
  FilterState, 
  ViewState, 
  FormState,
  TabType,
  SortOption,
  ViewMode
} from '../types/citationTypes';
import {
  updateEntry as updateCslEntry
} from '../utils/cslUtils';

// Helper function for comparing citation data to avoid unnecessary Citation.js recreation
function citationDataChanged(oldData: any[], newData: any[]): boolean {
  if (oldData.length !== newData.length) {
    return true;
  }
  
  // Compare each entry by reference and key properties
  for (let i = 0; i < oldData.length; i++) {
    const oldEntry = oldData[i];
    const newEntry = newData[i];
    
    // If different objects, check if content is actually different
    if (oldEntry !== newEntry) {
      if (oldEntry.id !== newEntry.id) {
        return true;
      }
      if (oldEntry.type !== newEntry.type) {
        return true;
      }
      if (oldEntry.title !== newEntry.title) {
        return true;
      }
      // Add more key field comparisons as needed
      return true;
    }
  }
  
  return false;
}

// Helper function to create Citation.js instance only when necessary
function createOrUpdateCite(currentCite: any, newData: any[], oldData: any[]): any {
  // If data structure hasn't actually changed, return current instance
  if (!citationDataChanged(oldData, newData)) {
    return currentCite;
  }
  
  // Always create new instance to avoid mutation issues
  // Citation.js instances should be treated as immutable in React
  return new Cite(newData);
}

// Helper function for generating unique IDs (moved from useCallback)
function generateUniqueIdInReducer(existingData: any[], base: string): string {
  const existingIds = existingData.map((e: any) => e.id);
  const cleanBase = base.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  if (!existingIds.includes(cleanBase)) {
    return cleanBase;
  }
  
  let counter = 1;
  let newId = `${cleanBase}${counter}`;
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${cleanBase}${counter}`;
  }
  
  return newId;
}

// Action types
type CitationAction = 
  | { type: 'LOAD_CITATION'; payload: { cite: any; filename?: string; variables?: Record<string, string> } }
  | { type: 'RESET_CITATION' }
  | { type: 'ADD_ENTRY'; payload: any }
  | { type: 'UPDATE_ENTRY'; payload: { id: string; updates: any } }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'DELETE_ENTRIES'; payload: string[] }
  | { type: 'DUPLICATE_ENTRY'; payload: string }
  | { type: 'ADD_VARIABLE'; payload: { key: string; value: string } }
  | { type: 'UPDATE_VARIABLE'; payload: { key: string; value: string } }
  | { type: 'DELETE_VARIABLE'; payload: string }
  | { type: 'SET_SELECTION'; payload: Selection }
  | { type: 'ADD_TO_SELECTION'; payload: { type: Selection['type']; items: string[] } }
  | { type: 'REMOVE_FROM_SELECTION'; payload: { type: Selection['type']; items: string[] } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_VIEW'; payload: Partial<ViewState> }
  | { type: 'SET_FORM_STATE'; payload: Partial<FormState> }
  | { type: 'START_EDITING_ENTRY'; payload: string }
  | { type: 'START_EDITING_VARIABLE'; payload: string }
  | { type: 'STOP_EDITING' };

// Enhanced state interface with version tracking
interface EnhancedCitationUIState extends CitationUIState {
  citeVersion: number;
}

// Initial state
const initialState: EnhancedCitationUIState = {
  cite: new Cite([]),
  citeVersion: 0,
  variables: {},
  selection: {
    type: 'entry',
    items: []
  },
  filters: {
    searchText: '',
    authorFilter: '',
    yearRange: {},
    typeFilter: 'all',
    customFilters: {}
  },
  view: {
    currentTab: 'literature',
    sortBy: 'author',
    sortDirection: 'asc',
    displayMode: 'card'
  },
  form: {
    isDirty: false,
    isSubmitting: false,
    validation: {
      isValid: true,
      errors: [],
      fieldErrors: {}
    }
  },
  isLoaded: false
};

// Reducer function with enhanced ID generation logic
function citationReducer(state: EnhancedCitationUIState, action: CitationAction): EnhancedCitationUIState {
  switch (action.type) {
    case 'LOAD_CITATION': {
      const newCite = action.payload.cite;
      
      // Only increment version if cite instance actually changed
      const versionIncrement = newCite !== state.cite ? 1 : 0;
      
      return {
        ...state,
        cite: newCite,
        citeVersion: state.citeVersion + versionIncrement,
        variables: action.payload.variables || {},
        filename: action.payload.filename,
        isLoaded: true,
        selection: { type: 'entry', items: [] },
        form: {
          ...initialState.form
        }
      };
    }

    case 'RESET_CITATION':
      return { ...initialState, citeVersion: state.citeVersion + 1 };

    case 'ADD_ENTRY': {
      const entry = action.payload;
      // Generate ID within reducer if not provided
      if (!entry.id) {
        entry.id = generateUniqueIdInReducer(state.cite.data, entry.title || 'entry');
      }
      
      const newData = [...state.cite.data, entry];
      const newCite = createOrUpdateCite(state.cite, newData, state.cite.data);
      
      // Only increment version if cite instance actually changed
      const versionIncrement = newCite !== state.cite ? 1 : 0;
      
      return {
        ...state,
        cite: newCite,
        citeVersion: state.citeVersion + versionIncrement,
        form: { ...state.form, isDirty: true }
      };
    }

    case 'UPDATE_ENTRY': {
      const { id, updates } = action.payload;
      const data = [...state.cite.data];
      const entryIndex = data.findIndex(entry => entry.id === id);
      
      if (entryIndex === -1) {
        return state;
      }
      
      const oldEntry = data[entryIndex];
      const updatedEntry = updateCslEntry(oldEntry, updates);
      
      // Only update if entry actually changed
      if (oldEntry === updatedEntry) {
        return state; // No changes needed
      }
      
      data[entryIndex] = updatedEntry;
      const newCite = createOrUpdateCite(state.cite, data, state.cite.data);
      
      // Only increment version if cite instance actually changed
      const versionIncrement = newCite !== state.cite ? 1 : 0;
      
      return {
        ...state,
        cite: newCite,
        citeVersion: state.citeVersion + versionIncrement,
        form: { ...state.form, isDirty: true }
      };
    }

    case 'DELETE_ENTRY': {
      const data = state.cite.data.filter((entry: any) => entry.id !== action.payload);
      
      // If no entry was actually removed, return unchanged state
      if (data.length === state.cite.data.length) {
        return state;
      }
      
      const newCite = createOrUpdateCite(state.cite, data, state.cite.data);
      
      // Only increment version if cite instance actually changed
      const versionIncrement = newCite !== state.cite ? 1 : 0;
      
      return {
        ...state,
        cite: newCite,
        citeVersion: state.citeVersion + versionIncrement,
        form: { ...state.form, isDirty: true }
      };
    }

    case 'DELETE_ENTRIES': {
      const data = state.cite.data.filter((entry: any) => !action.payload.includes(entry.id));
      
      // If no entries were actually removed, return unchanged state
      if (data.length === state.cite.data.length) {
        return state;
      }
      
      const newCite = createOrUpdateCite(state.cite, data, state.cite.data);
      
      // Only increment version if cite instance actually changed
      const versionIncrement = newCite !== state.cite ? 1 : 0;
      
      return {
        ...state,
        cite: newCite,
        citeVersion: state.citeVersion + versionIncrement,
        form: { ...state.form, isDirty: true }
      };
    }

    case 'DUPLICATE_ENTRY': {
      const sourceId = action.payload;
      const entry = state.cite.data.find((e: any) => e.id === sourceId);
      if (!entry) return state;
      
      // Generate new ID within reducer
      const newId = generateUniqueIdInReducer(state.cite.data, entry.id + '_copy');
      const duplicatedEntry = { ...entry, id: newId };
      
      const newData = [...state.cite.data, duplicatedEntry];
      const newCite = createOrUpdateCite(state.cite, newData, state.cite.data);
      
      // Only increment version if cite instance actually changed
      const versionIncrement = newCite !== state.cite ? 1 : 0;
      
      return {
        ...state,
        cite: newCite,
        citeVersion: state.citeVersion + versionIncrement,
        form: { ...state.form, isDirty: true }
      };
    }

    case 'ADD_VARIABLE':
      return {
        ...state,
        variables: {
          ...state.variables,
          [action.payload.key]: action.payload.value
        },
        form: { ...state.form, isDirty: true }
      };

    case 'UPDATE_VARIABLE':
      return {
        ...state,
        variables: {
          ...state.variables,
          [action.payload.key]: action.payload.value
        },
        form: { ...state.form, isDirty: true }
      };

    case 'DELETE_VARIABLE': {
      const { [action.payload]: deleted, ...remainingVariables } = state.variables;
      return {
        ...state,
        variables: remainingVariables,
        form: { ...state.form, isDirty: true }
      };
    }

    case 'SET_SELECTION':
      return {
        ...state,
        selection: action.payload
      };

    case 'ADD_TO_SELECTION': {
      if (action.payload.type !== state.selection.type) {
        return {
          ...state,
          selection: action.payload
        };
      }
      
      const newItems = [...new Set([...state.selection.items, ...action.payload.items])];
      return {
        ...state,
        selection: {
          ...state.selection,
          items: newItems
        }
      };
    }

    case 'REMOVE_FROM_SELECTION': {
      if (action.payload.type !== state.selection.type) return state;
      
      const newItems = state.selection.items.filter(item => !action.payload.items.includes(item));
      return {
        ...state,
        selection: {
          ...state.selection,
          items: newItems
        }
      };
    }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selection: {
          ...state.selection,
          items: []
        }
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    case 'RESET_FILTERS':
      return {
        ...state,
        filters: initialState.filters
      };

    case 'SET_VIEW':
      return {
        ...state,
        view: {
          ...state.view,
          ...action.payload
        }
      };

    case 'SET_FORM_STATE':
      return {
        ...state,
        form: {
          ...state.form,
          ...action.payload
        }
      };

    case 'START_EDITING_ENTRY':
      console.log('Reducer: START_EDITING_ENTRY with payload:', action.payload);
      const newState = {
        ...state,
        form: {
          ...state.form,
          editingEntry: action.payload,
          editingVariable: undefined
        }
      };
      console.log('Reducer: new form state:', newState.form);
      return newState;

    case 'START_EDITING_VARIABLE':
      return {
        ...state,
        form: {
          ...state.form,
          editingVariable: action.payload,
          editingEntry: undefined
        }
      };

    case 'STOP_EDITING':
      return {
        ...state,
        form: {
          ...state.form,
          editingEntry: undefined,
          editingVariable: undefined
        }
      };

    default:
      return state;
  }
}

// Context interfaces - Split into focused concerns
interface CitationDataContextType {
  state: EnhancedCitationUIState;
}

interface CitationActionsContextType {
  // Citation operations
  loadFromBibTeX: (content: string, filename?: string) => Promise<void>;
  exportToBibTeX: () => string;
  resetCitation: () => void;
  
  // Entry operations  
  addEntry: (entry: any) => string;
  updateEntry: (id: string, updates: any) => Promise<void>;
  deleteEntry: (id: string) => void;
  deleteEntries: (ids: string[]) => void;
  duplicateEntry: (id: string) => Promise<string>;
  getEntry: (id: string) => any;
  
  // Variable operations
  addVariable: (key: string, value: string) => void;
  updateVariable: (key: string, value: string) => void;
  deleteVariable: (key: string) => void;
  getVariable: (key: string) => string | undefined;
  
  // Selection operations
  setSelection: (selection: Selection) => void;
  addToSelection: (type: Selection['type'], items: string[]) => void;
  removeFromSelection: (type: Selection['type'], items: string[]) => void;
  clearSelection: () => void;
  getSelectedEntries: () => any[];
  
  // Filter and view operations
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setView: (view: Partial<ViewState>) => void;
  setCurrentTab: (tab: TabType) => void;
  setSortBy: (sortBy: SortOption, direction?: 'asc' | 'desc') => void;
  setDisplayMode: (mode: ViewMode) => void;
  
  // UI operations
  startEditingEntry: (id: string) => void;
  startEditingVariable: (key: string) => void;
  stopEditing: () => void;
}

// Create separate contexts
const CitationDataContext = createContext<CitationDataContextType | undefined>(undefined);
const CitationActionsContext = createContext<CitationActionsContextType | undefined>(undefined);

// Provider component
export function CitationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(citationReducer, initialState);

  // Create refs for stable state access (prevents stale closures)
  const stateRef = useRef<EnhancedCitationUIState>(state);
  
  // Add debouncing ref to prevent duplicate calls
  const updateEntryTimeoutRef = useRef<{[key: string]: NodeJS.Timeout}>({});
  
  // Update state ref when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Actions memoization with empty dependency array for maximum stability
  const actions = useMemo<CitationActionsContextType>(() => {
    const actionHandlers: CitationActionsContextType = {
      // Citation operations - no dependencies needed
      loadFromBibTeX: async (content: string, filename?: string) => {
        try {
          const newCite = new Cite(content);
          dispatch({ 
            type: 'LOAD_CITATION', 
            payload: { cite: newCite, filename } 
          });
        } catch (error) {
          throw error;
        }
      },
      
      exportToBibTeX: () => {
        // Use ref to access current state instead of stale closure
        return stateRef.current.cite.format('bibtex');
      },
      
      resetCitation: () => {
        dispatch({ type: 'RESET_CITATION' });
      },
      
      // Entry operations - using dispatch only, refs for state access
      addEntry: (entry: any): string => {
        // Generate ID before dispatch if needed
        const entryWithId = { ...entry };
        if (!entryWithId.id) {
          entryWithId.id = generateUniqueIdInReducer(stateRef.current.cite.data, entryWithId.title || 'entry');
        }
        
        console.log('addEntry: dispatching ADD_ENTRY with payload:', entryWithId);
        dispatch({ type: 'ADD_ENTRY', payload: entryWithId });
        console.log('addEntry: dispatched, entry should be in state now');
        return entryWithId.id;
      },
      
      updateEntry: async (id: string, updates: any) => {
        // Debouncing mechanism to prevent duplicate calls
        const callId = `${id}-${JSON.stringify(updates)}`;
        if (updateEntryTimeoutRef.current[callId]) {
          return;
        }
        
        updateEntryTimeoutRef.current[callId] = setTimeout(() => {
          delete updateEntryTimeoutRef.current[callId];
        }, 100); // Clear after 100ms
        
        dispatch({ type: 'UPDATE_ENTRY', payload: { id, updates } });
      },
      
      deleteEntry: (id: string) => {
        dispatch({ type: 'DELETE_ENTRY', payload: id });
      },
      
      deleteEntries: (ids: string[]) => {
        dispatch({ type: 'DELETE_ENTRIES', payload: ids });
      },
      
      duplicateEntry: async (id: string): Promise<string> => {
        dispatch({ type: 'DUPLICATE_ENTRY', payload: id });
        return `${id}_copy`; // Predictable ID format
      },
      
      getEntry: (id: string) => {
        // Use ref to access current state
        return stateRef.current.cite.data.find((entry: any) => entry.id === id);
      },
      
      // Variable operations
      addVariable: (key: string, value: string) => {
        dispatch({ type: 'ADD_VARIABLE', payload: { key, value } });
      },
      
      updateVariable: (key: string, value: string) => {
        dispatch({ type: 'UPDATE_VARIABLE', payload: { key, value } });
      },
      
      deleteVariable: (key: string) => {
        dispatch({ type: 'DELETE_VARIABLE', payload: key });
      },
      
      getVariable: (key: string) => {
        // Use ref to access current state
        return stateRef.current.variables[key];
      },
      
      // Selection operations
      setSelection: (selection: Selection) => {
        dispatch({ type: 'SET_SELECTION', payload: selection });
      },
      
      addToSelection: (type: Selection['type'], items: string[]) => {
        dispatch({ type: 'ADD_TO_SELECTION', payload: { type, items } });
      },
      
      removeFromSelection: (type: Selection['type'], items: string[]) => {
        dispatch({ type: 'REMOVE_FROM_SELECTION', payload: { type, items } });
      },
      
      clearSelection: () => {
        dispatch({ type: 'CLEAR_SELECTION' });
      },
      
      getSelectedEntries: () => {
        // Use ref to access current state
        const currentState = stateRef.current;
        if (currentState.selection.type !== 'entry') return [];
        return currentState.cite.data.filter((entry: any) => 
          currentState.selection.items.includes(entry.id)
        );
      },
      
      // Filter and view operations with value checking
      setFilters: (filters: Partial<FilterState>) => {
        // Check if any filter values would actually change to avoid unnecessary updates
        const currentFilters = stateRef.current.filters;
        const hasChanges = Object.keys(filters).some(key => {
          const filterKey = key as keyof FilterState;
          if (filterKey === 'yearRange') {
            const newRange = filters[filterKey];
            const currentRange = currentFilters[filterKey];
            return newRange?.from !== currentRange.from || newRange?.to !== currentRange.to;
          }
          return filters[filterKey] !== currentFilters[filterKey];
        });
        
        if (hasChanges) {
          dispatch({ type: 'SET_FILTERS', payload: filters });
        }
      },
      
      resetFilters: () => {
        dispatch({ type: 'RESET_FILTERS' });
      },
      
      setView: (view: Partial<ViewState>) => {
        dispatch({ type: 'SET_VIEW', payload: view });
      },
      
      setCurrentTab: (tab: TabType) => {
        dispatch({ type: 'SET_VIEW', payload: { currentTab: tab } });
      },
      
      setSortBy: (sortBy: SortOption, direction: 'asc' | 'desc' = 'asc') => {
        dispatch({ type: 'SET_VIEW', payload: { sortBy, sortDirection: direction } });
      },
      
      setDisplayMode: (mode: ViewMode) => {
        dispatch({ type: 'SET_VIEW', payload: { displayMode: mode } });
      },
      
      // UI operations
      startEditingEntry: (id: string) => {
        console.log('startEditingEntry: called with ID:', id);
        dispatch({ type: 'START_EDITING_ENTRY', payload: id });
        console.log('startEditingEntry: dispatched START_EDITING_ENTRY');
      },
      
      startEditingVariable: (key: string) => {
        dispatch({ type: 'START_EDITING_VARIABLE', payload: key });
      },
      
      stopEditing: () => {
        dispatch({ type: 'STOP_EDITING' });
      }
    };
    
    return actionHandlers;
  }, []); // Empty dependency array - stable functions, using refs for state access

  // Data context value - only state
  const dataContextValue = useMemo(() => {
    return { state };
  }, [state]);

  return (
    <CitationDataContext.Provider value={dataContextValue}>
      <CitationActionsContext.Provider value={actions}>
        {children}
      </CitationActionsContext.Provider>
    </CitationDataContext.Provider>
  );
}

// Hook exports - both new split hooks and legacy combined hook
export function useCitationData() {
  const context = useContext(CitationDataContext);
  if (context === undefined) {
    throw new Error('useCitationData must be used within a CitationProvider');
  }
  return context;
}

export function useCitationActions() {
  const context = useContext(CitationActionsContext);
  if (context === undefined) {
    throw new Error('useCitationActions must be used within a CitationProvider');
  }
  return context;
} 