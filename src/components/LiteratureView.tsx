import React, { useState, useCallback } from 'react';
import { 
  useCitationData, 
  useCitationActions, 
  useFilteredAndSortedEntries, 
  useSearch,
  useAuthors
} from '../hooks/useCitation';
import { CSLEntry } from '../types/cslFieldMetadata';
import { EntryCard } from './EntryCard';
import { EntryEditor } from './EntryEditor';
import { AuthorFilter } from './AuthorFilter';

interface LiteratureViewProps {
  // Simplified interface - most data comes from context now
  onSelectEntry?: (key: string) => void;
  onUpdateEntry?: (key: string, updates: any) => void;
  onDeleteEntry?: (key: string) => void;
}

export function LiteratureView({
  onSelectEntry,
  onUpdateEntry,
  onDeleteEntry,
}: LiteratureViewProps) {
  const { state } = useCitationData();
  const { 
    updateEntry, 
    deleteEntry, 
    startEditingEntry,
    stopEditing 
  } = useCitationActions();
  const { authors: allAuthors } = useAuthors();
  
  const { 
    searchText,
    authorFilter,
    setSearchText,
    setAuthorFilter 
  } = useSearch();
  
  const filteredEntries = useFilteredAndSortedEntries();
  const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);
  
  const activeEntry = state.form.editingEntry 
    ? state.cite.data.find((entry: CSLEntry) => entry.id === state.form.editingEntry)
    : null;
    
  // Debug logging
  React.useEffect(() => {
    console.log('LiteratureView: editingEntry changed to:', state.form.editingEntry);
    console.log('LiteratureView: activeEntry found:', activeEntry ? activeEntry.id : 'none');
    console.log('LiteratureView: total entries in cite.data:', state.cite.data.length);
  }, [state.form.editingEntry, activeEntry, state.cite.data.length]);

  const handleEntrySelect = useCallback((id: string) => {
    setSelectedEntryKey(id);
    startEditingEntry(id);
    onSelectEntry?.(id);
  }, [startEditingEntry, onSelectEntry]);

  const handleEntryUpdate = useCallback(async (id: string, updates: any) => {
    try {
      await updateEntry(id, updates);
      
      // Use optional chaining and check if function exists before calling
      if (onUpdateEntry && typeof onUpdateEntry === 'function') {
        onUpdateEntry(id, updates);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  }, [updateEntry]); // Remove onUpdateEntry from dependencies to stabilize callback

  const handleEntryDelete = useCallback((id: string) => {
    deleteEntry(id);
    if (selectedEntryKey === id) {
      setSelectedEntryKey(null);
      stopEditing();
    }
    onDeleteEntry?.(id);
  }, [deleteEntry, selectedEntryKey, stopEditing, onDeleteEntry]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  }, [setSearchText]);

  const handleAuthorFilterChange = useCallback((value: string) => {
    setAuthorFilter(value);
  }, [setAuthorFilter]);

  return (
    <div className="flex flex-grow overflow-hidden">
      {/* Left panel - Entry list */}
      <div className="flex-none w-96 border-r border-gray-200 overflow-y-auto bg-white">
        {/* Search and filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            {/* Search input */}
            <div>
              <input
                type="text"
                placeholder="Search entries..."
                value={searchText}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Author filter */}
            <AuthorFilter
              allAuthors={allAuthors}
              value={authorFilter}
              onChange={handleAuthorFilterChange}
            />
          </div>
        </div>

        {/* Entry list */}
        <div className="p-4 space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No entries found.</p>
              {(searchText || authorFilter) && (
                <p className="text-sm mt-2">Try adjusting your search or filters.</p>
              )}
            </div>
          ) : (
            filteredEntries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                isActive={selectedEntryKey === entry.id}
                onClick={() => handleEntrySelect(entry.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right panel - Entry editor */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {activeEntry ? (
          <EntryEditor
            key={activeEntry.id} // Force remount when entry changes
            entry={activeEntry}
            stringVariables={state.variables}
            onUpdate={handleEntryUpdate}
            onDelete={handleEntryDelete}
          />
        ) : (
          <div className="flex-grow flex justify-center items-center text-gray-500 text-center p-8">
            <div>
              <h2 className="text-xl font-medium mb-2">No Entry Selected</h2>
              <p>Select an entry from the list to view and edit its details.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 