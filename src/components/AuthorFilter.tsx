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
    <div className="relative flex min-w-[200px]" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Filter by Author..."
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className="flex-1 px-2 py-2 border border-gray-300 rounded-l text-base"
      />
      <button
        type="button"
        className="px-2 py-2 border border-gray-300 border-l-0 rounded-r bg-white cursor-pointer text-sm min-w-[2rem] hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        ▼
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 rounded-b max-h-[200px] overflow-y-auto z-[100]">
          <div
            className={`px-2 py-2 cursor-pointer border-b border-gray-300 ${
              highlightedIndex === 0 ? 'bg-gray-100' : 'hover:bg-gray-50'
            }`}
            onClick={handleClearClick}
          >
            All Authors
          </div>
          {filteredAuthors.map((author, index) => (
            <div
              key={author}
              className={`px-2 py-2 cursor-pointer border-b border-gray-300 last:border-b-0 ${
                value === author ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
              } ${highlightedIndex === index + 1 ? 'bg-gray-100' : ''}`}
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