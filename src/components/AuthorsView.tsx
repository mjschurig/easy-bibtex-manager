import { useState, useCallback } from 'react';
import { CSLEntry, CSLAuthor } from '../types/cslFieldMetadata';
import { EntryCard } from './EntryCard';


interface AuthorsViewProps {
  entries: CSLEntry[];
  allAuthors: string[];
  onSelectEntry: (id: string) => void;
}

export function AuthorsView({ entries, allAuthors, onSelectEntry }: AuthorsViewProps) {
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
          return author.literal === selectedAuthor;
        } else if (author.given && author.family) {
          const fullName = `${author.given} ${author.family}`;
          return fullName === selectedAuthor;
        } else if (author.family) {
          return author.family === selectedAuthor;
        }
        return false;
      });
    });
  }, [entries, selectedAuthor]);

  const handleAuthorSelect = (author: string): void => {
    setSelectedAuthor(author);
  };

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
  );
} 