import { useCallback } from 'react';
import { BibTeXEntry, StringVariables } from '../types/bibtex';
import { FilterOptions } from '../hooks/useBibTeX';
import { EntryCard } from './EntryCard';
import { EntryEditor } from './EntryEditor';
import { AuthorFilter } from './AuthorFilter';

interface LiteratureViewProps {
  entries: BibTeXEntry[];
  allAuthors: string[];
  filters: FilterOptions;
  activeEntryKey: string | null;
  stringVariables: StringVariables;
  onUpdateFilters: (filters: Partial<FilterOptions>) => void;
  onSelectEntry: (key: string) => void;
  onUpdateEntry: (key: string, updates: Partial<BibTeXEntry>) => void;
  onDeleteEntry: (key: string) => void;
}

export function LiteratureView({
  entries,
  allAuthors,
  filters,
  activeEntryKey,
  stringVariables,
  onUpdateFilters,
  onSelectEntry,
  onUpdateEntry,
  onDeleteEntry,
}: LiteratureViewProps) {
  const activeEntry = entries.find(entry => entry.key === activeEntryKey);

  const handleFilterChange = useCallback((field: keyof FilterOptions) => 
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onUpdateFilters({ [field]: event.target.value });
    }, [onUpdateFilters]);

  const handleAuthorFilterChange = useCallback((value: string) => {
    onUpdateFilters({ authorFilter: value });
  }, [onUpdateFilters]);

  return (
    <div className="tab-content active">
      <div className="main-content">
        <div className="entry-list-container">
          <div className="file-info">
            {entries.length > 0 ? `${entries.length} entries loaded` : 'No file loaded.'}
          </div>
          
          <div className="toolbar">
            <input
              type="search"
              placeholder="Filter by author, title, year..."
              value={filters.searchText}
              onChange={handleFilterChange('searchText')}
            />
            
            <AuthorFilter
              allAuthors={allAuthors}
              value={filters.authorFilter}
              onChange={handleAuthorFilterChange}
            />
            
            <select
              value={filters.sortBy}
              onChange={handleFilterChange('sortBy')}
            >
              <option value="author">Sort by Author</option>
              <option value="year">Sort by Year</option>
              <option value="type">Sort by Type</option>
            </select>
          </div>
          
          <div className="entry-list">
            {entries.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                No entries match your filters.
              </div>
            ) : (
              entries.map(entry => (
                <EntryCard
                  key={entry.key}
                  entry={entry}
                  isActive={entry.key === activeEntryKey}
                  onClick={() => onSelectEntry(entry.key)}
                />
              ))
            )}
          </div>
        </div>
        
        <div className="editor-container">
          {activeEntry ? (
            <EntryEditor
              entry={activeEntry}
              stringVariables={stringVariables}
              onUpdate={onUpdateEntry}
              onDelete={onDeleteEntry}
            />
          ) : (
            <div className="editor-placeholder">
              <h2>Select an entry to view or edit it.</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 