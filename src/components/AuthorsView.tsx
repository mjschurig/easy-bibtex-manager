import { useState, useCallback } from 'react';
import { CSLEntry, CSLAuthor } from '../types/cslFieldMetadata';
import { EntryCard } from './EntryCard';
import { useCitationData, useCitationActions } from '../hooks/useCitation';


interface AuthorsViewProps {
  entries: CSLEntry[];
  allAuthors: string[];
  onSelectEntry: (id: string) => void;
}

export function AuthorsView({ entries, allAuthors, onSelectEntry }: AuthorsViewProps) {
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { state } = useCitationData();
  const { addVariable, updateEntry } = useCitationActions();

  const filteredAuthors = useCallback((): string[] => {
    return allAuthors.filter(author => 
      author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allAuthors, searchTerm]);

  const authorWorks = useCallback((): CSLEntry[] => {
    if (!selectedAuthor) return [];
    return entries.filter(entry => {
      if (!entry.author || entry.author.length === 0) return false;
      
      // Check if any of the entry's authors matches the selected author
      return entry.author.some((author: CSLAuthor) => {
        // Handle both literal and given/family name formats
        if (author.literal) {
          // Check both the variable value and the literal key
          const authorValue = state.variables[author.literal] || author.literal;
          return authorValue === selectedAuthor || author.literal === selectedAuthor;
        } else if (author.given && author.family) {
          const fullName = `${author.given} ${author.family}`;
          return fullName === selectedAuthor;
        } else if (author.family) {
          return author.family === selectedAuthor;
        }
        return false;
      });
    });
  }, [entries, selectedAuthor, state.variables]);

  const handleAuthorSelect = (author: string): void => {
    setSelectedAuthor(author);
  };

  // Check if an author should have a "Create Variable" button
  const shouldShowCreateVariableButton = useCallback((authorName: string): boolean => {
    // Get entries for this specific author
    const authorEntries = entries.filter(entry => {
      if (!entry.author || entry.author.length === 0) return false;
      
      return entry.author.some((author: CSLAuthor) => {
        if (author.literal) {
          const authorValue = state.variables[author.literal] || author.literal;
          return authorValue === authorName || author.literal === authorName;
        } else if (author.given && author.family) {
          const fullName = `${author.given} ${author.family}`;
          return fullName === authorName;
        } else if (author.family) {
          return author.family === authorName;
        }
        return false;
      });
    });
    
    if (authorEntries.length < 2) return false; // Need at least 2 entries
    
    // Check if at least one occurrence is not already a variable
    const hasNonVariableOccurrence = authorEntries.some(entry => {
      return entry.author?.some((author: CSLAuthor) => {
        let matchesAuthor = false;
        if (author.literal) {
          const authorValue = state.variables[author.literal] || author.literal;
          matchesAuthor = authorValue === authorName || author.literal === authorName;
        } else {
          matchesAuthor = 
            (author.given && author.family && `${author.given} ${author.family}` === authorName) ||
            (author.family === authorName);
        }
        
        // If it matches and is not a variable reference, return true
        return matchesAuthor && !state.variables[author.literal || ''];
      });
    });
    
    return hasNonVariableOccurrence;
  }, [entries, state.variables]);

  // Replace all occurrences of an author name with a variable reference
  const replaceAuthorWithVariable = useCallback((authorName: string, variableKey: string) => {
    // Find all entries that contain this author
    const affectedEntries = entries.filter(entry => {
      return entry.author?.some((author: CSLAuthor) => {
        if (author.literal) {
          const authorValue = state.variables[author.literal] || author.literal;
          return authorValue === authorName || author.literal === authorName;
        }
        return (author.given && author.family && `${author.given} ${author.family}` === authorName) ||
               (author.family === authorName);
      });
    });

    // Update each affected entry
    affectedEntries.forEach(entry => {
      const updatedAuthors = entry.author?.map((author: CSLAuthor) => {
        let matchesAuthor = false;
        if (author.literal) {
          const authorValue = state.variables[author.literal] || author.literal;
          matchesAuthor = authorValue === authorName || author.literal === authorName;
        } else {
          matchesAuthor = 
            (author.given && author.family && `${author.given} ${author.family}` === authorName) ||
            (author.family === authorName);
        }
        
        // If this author matches and is not already a variable, replace with variable
        if (matchesAuthor && !state.variables[author.literal || '']) {
          return { literal: variableKey };
        }
        
        return author;
      });
      
      // Update the entry with the new authors
      if (updatedAuthors) {
        updateEntry(entry.id, { author: updatedAuthors });
      }
    });
  }, [entries, state.variables, updateEntry]);

  // Create variable from author name
  const handleCreateVariable = useCallback((authorName: string) => {
    // Extract last name for variable key
    const nameParts = authorName.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const variableKey = `str_${lastName}`;
    
    // Check if variable already exists
    if (state.variables[variableKey]) {
      alert(`Variable "${variableKey}" already exists with value: "${state.variables[variableKey]}"`);
      return;
    }
    
    // Create the variable
    addVariable(variableKey, authorName);
    
    // Replace all occurrences of this author name with the variable
    replaceAuthorWithVariable(authorName, variableKey);
  }, [state.variables, addVariable, replaceAuthorWithVariable]);

  return (
    <div className="flex flex-col flex-grow overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <input
          type="search"
          placeholder="Search authors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2 py-2 border border-gray-300 rounded text-base"
        />
      </div>
      
      <div className="flex flex-grow overflow-hidden">
        <div className="flex-none w-80 border-r border-gray-200 overflow-y-auto bg-white">
          {filteredAuthors().map(author => (
            <div
              key={author}
              className={`px-6 py-3 cursor-pointer border-b border-gray-200 transition-colors ${
                selectedAuthor === author 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'hover:bg-gray-50 text-gray-900'
              }`}
              onClick={() => handleAuthorSelect(author)}
            >
              {author}
            </div>
          ))}
        </div>
        
        <div className="flex-grow flex flex-col overflow-hidden">
          {selectedAuthor && shouldShowCreateVariableButton(selectedAuthor) && (
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => handleCreateVariable(selectedAuthor)}
                className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                title={`Create variable str_${selectedAuthor.split(' ').pop()} and replace all occurrences`}
              >
                Create Variable: str_{selectedAuthor.split(' ').pop()}
              </button>
            </div>
          )}
          
          <div className="flex-grow overflow-y-auto p-4">
            {selectedAuthor ? (
              <>
                {authorWorks().length === 0 ? (
                  <div className="flex-grow flex justify-center items-center text-gray-500 text-center p-8">
                    <h2>No works found for this author.</h2>
                  </div>
                ) : (
                  authorWorks().map(entry => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      isActive={false}
                      onClick={() => onSelectEntry(entry.id)}
                    />
                  ))
                )}
              </>
            ) : (
              <div className="flex-grow flex justify-center items-center text-gray-500 text-center p-8">
                <h2>Select an author to see their works.</h2>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 