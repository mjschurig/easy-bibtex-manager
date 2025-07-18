import { useState, useMemo } from 'react';
import { BibTeXEntry } from '../types/bibtex';
import { EntryCard } from './EntryCard';

interface AuthorsViewProps {
  entries: BibTeXEntry[];
  allAuthors: string[];
  onSelectEntry: (key: string) => void;
}

export function AuthorsView({ entries, allAuthors, onSelectEntry }: AuthorsViewProps) {
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAuthors = useMemo(() => {
    return allAuthors.filter(author => 
      author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allAuthors, searchTerm]);

  const authorWorks = useMemo(() => {
    if (!selectedAuthor) return [];
    return entries.filter(entry => 
      entry.authors && entry.authors.includes(selectedAuthor)
    );
  }, [entries, selectedAuthor]);

  const handleAuthorSelect = (author: string) => {
    setSelectedAuthor(author);
  };

  return (
    <div className="tab-content active">
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search authors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="main-content">
        <div className="author-list-container">
          {filteredAuthors.map(author => (
            <div
              key={author}
              className={`author-list-item ${selectedAuthor === author ? 'active' : ''}`}
              onClick={() => handleAuthorSelect(author)}
            >
              {author}
            </div>
          ))}
        </div>
        
        <div className="author-works-container">
          {selectedAuthor ? (
            <>
              {authorWorks.length === 0 ? (
                <div className="editor-placeholder">
                  <h2>No works found for this author.</h2>
                </div>
              ) : (
                authorWorks.map(entry => (
                  <EntryCard
                    key={entry.key}
                    entry={entry}
                    isActive={false}
                    onClick={() => onSelectEntry(entry.key)}
                  />
                ))
              )}
            </>
          ) : (
            <div className="editor-placeholder">
              <h2>Select an author to see their works.</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 