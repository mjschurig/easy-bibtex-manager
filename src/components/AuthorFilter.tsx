import { useState, useRef, useEffect } from 'react';

interface AuthorFilterProps {
  allAuthors: string[];
  value: string;
  onChange: (value: string) => void;
}

export function AuthorFilter({ allAuthors, value, onChange }: AuthorFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredAuthors = allAuthors.filter(author =>
    author.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredAuthors.length ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev => prev > -1 ? prev - 1 : prev);
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex === -1) {
          onChange('');
        } else if (highlightedIndex === 0) {
          onChange('');
        } else if (filteredAuthors[highlightedIndex - 1]) {
          onChange(filteredAuthors[highlightedIndex - 1]);
        }
        setIsOpen(false);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleOptionClick = (author: string) => {
    onChange(author);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleClearClick = () => {
    onChange('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="combobox-container" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Filter by Author..."
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      <button
        type="button"
        className="combobox-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        ▼
      </button>
      
      {isOpen && (
        <div className="combobox-dropdown show">
          <div
            className={`combobox-option ${highlightedIndex === 0 ? 'highlighted' : ''}`}
            onClick={handleClearClick}
          >
            All Authors
          </div>
          {filteredAuthors.map((author, index) => (
            <div
              key={author}
              className={`combobox-option ${
                value === author ? 'selected' : ''
              } ${highlightedIndex === index + 1 ? 'highlighted' : ''}`}
              onClick={() => handleOptionClick(author)}
            >
              {author}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 