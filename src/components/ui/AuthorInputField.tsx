import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { CSLAuthor, CSLFieldMetadata } from '../../types/cslFieldMetadata';
import { useCitationData, useCitationActions } from '../../hooks/useCitation';

interface AuthorInputFieldProps {
  value: CSLAuthor[];
  onChange: (authors: CSLAuthor[]) => void;
  metadata: CSLFieldMetadata;
  errors: string[];
  onValidate: (field: string, errors: string[]) => void;
}

export function AuthorInputField({ value, onChange, metadata, errors, onValidate }: AuthorInputFieldProps) {
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const { state } = useCitationData();
  const { addVariable, updateEntry } = useCitationActions();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Format authors for display
  const formatAuthorForDisplay = (author: CSLAuthor): string => {
    if (author.literal) {
      // If it's a variable reference, show value (key) format
      if (state.variables[author.literal]) {
        return `${state.variables[author.literal]} (${author.literal})`;
      }
      return author.literal;
    }
    
    if (author.given && author.family) {
      return `${author.given} ${author.family}`;
    }
    
    return author.family || author.given || '';
  };

  // Parse author input string into CSL format
  const parseAuthorInput = (input: string): CSLAuthor => {
    const trimmed = input.trim();
    
    // Check if it's a variable reference (from @STRING definitions)
    const variableKeys = Object.keys(state.variables);
    if (variableKeys.includes(trimmed)) {
      return { literal: trimmed };
    }
    
    // Parse name structure
    if (trimmed.includes(',')) {
      // Last name first format: "Smith, John A."
      const [family, given] = trimmed.split(',', 2);
      return {
        family: family.trim(),
        given: given ? given.trim() : undefined
      };
    } else {
      // First name first format: "John A. Smith"
      const nameParts = trimmed.split(/\s+/);
      const family = nameParts.pop() || '';
      const given = nameParts.length > 0 ? nameParts.join(' ') : undefined;
      
      return {
        given,
        family
      };
    }
  };

  // Validate author format
  const validateAuthor = (authorString: string): string[] => {
    const errors: string[] = [];
    
    if (!authorString.trim()) {
      errors.push('Author name cannot be empty');
      return errors;
    }
    
    // Basic format validation
    const trimmed = authorString.trim();
    if (trimmed.length < 2) {
      errors.push('Author name must be at least 2 characters long');
    }
    
    return errors;
  };

  const handleAddAuthor = useCallback(() => {
    if (!inputValue.trim()) return;
    
    const authorErrors = validateAuthor(inputValue);
    if (authorErrors.length > 0) {
      onValidate(metadata.name, authorErrors);
      return;
    }
    
    const newAuthor = parseAuthorInput(inputValue);
    const newAuthors = [...value, newAuthor];
    
    onChange(newAuthors);
    setInputValue('');
    onValidate(metadata.name, []);
  }, [inputValue, value, onChange, metadata.name, onValidate]);

  const handleEditAuthor = useCallback((index: number) => {
    setEditingIndex(index);
    setInputValue(formatAuthorForDisplay(value[index]));
    setIsEditing(true);
  }, [value]);

  const handleUpdateAuthor = useCallback(() => {
    if (editingIndex === null) return;
    
    const authorErrors = validateAuthor(inputValue);
    if (authorErrors.length > 0) {
      onValidate(metadata.name, authorErrors);
      return;
    }
    
    const updatedAuthor = parseAuthorInput(inputValue);
    const newAuthors = [...value];
    newAuthors[editingIndex] = updatedAuthor;
    
    onChange(newAuthors);
    setInputValue('');
    setEditingIndex(null);
    setIsEditing(false);
    onValidate(metadata.name, []);
  }, [editingIndex, inputValue, value, onChange, metadata.name, onValidate]);

  const handleRemoveAuthor = useCallback((index: number) => {
    const newAuthors = value.filter((_, i) => i !== index);
    onChange(newAuthors);
  }, [value, onChange]);

  const handleCancelEdit = useCallback(() => {
    setInputValue('');
    setEditingIndex(null);
    setIsEditing(false);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  }, []);

  // Replace all occurrences of an author name with a variable reference across all entries
  const replaceAuthorWithVariableGlobally = useCallback((authorName: string, variableKey: string) => {
    // Get all entries from state
    const allEntries = state.cite.data;
    
    // Find all entries that contain this author
    const affectedEntries = allEntries.filter((entry: any) => {
      return entry.author?.some((author: CSLAuthor) => {
        if (author.literal && state.variables[author.literal]) {
          // Already a variable, check if the variable value matches
          return state.variables[author.literal] === authorName;
        }
        // Check direct name matches
        const entryAuthorName = author.literal || 
          (author.given && author.family ? `${author.given} ${author.family}` : 
           author.family || author.given || '');
        return entryAuthorName === authorName;
      });
    });

    // Update each affected entry
    affectedEntries.forEach((entry: any) => {
      const updatedAuthors = entry.author?.map((author: CSLAuthor) => {
        let matches = false;
        
        if (author.literal && state.variables[author.literal]) {
          // Already a variable, check if the variable value matches
          matches = state.variables[author.literal] === authorName;
        } else {
          // Check direct name matches
          const entryAuthorName = author.literal || 
            (author.given && author.family ? `${author.given} ${author.family}` : 
             author.family || author.given || '');
          matches = entryAuthorName === authorName;
        }
        
        // If this author matches and is not already this variable, replace with variable
        if (matches && author.literal !== variableKey) {
          return { literal: variableKey };
        }
        
        return author;
      });
      
      // Update the entry with the new authors
      if (updatedAuthors) {
        updateEntry(entry.id, { author: updatedAuthors });
      }
    });
  }, [state.cite.data, state.variables, updateEntry]);

  // Create variable from author name and replace all occurrences
  const handleCreateVariable = useCallback((authorIndex: number) => {
    const author = value[authorIndex];
    if (!author) return;

    // Get the author name (skip if already a variable)
    if (author.literal && state.variables[author.literal]) {
      alert('This author is already a variable reference.');
      return;
    }

    const authorName = formatAuthorForDisplay(author).replace(/ \([^)]+\)$/, ''); // Remove (key) part if present
    
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
    
    // Replace all occurrences across all entries
    replaceAuthorWithVariableGlobally(authorName, variableKey);
  }, [value, state.variables, addVariable, formatAuthorForDisplay, replaceAuthorWithVariableGlobally]);

  const selectVariable = useCallback((variableKey: string) => {
    if (isEditing && editingIndex !== null) {
      // If editing, update the existing author
      const updatedAuthor = { literal: variableKey };
      const newAuthors = [...value];
      newAuthors[editingIndex] = updatedAuthor;
      onChange(newAuthors);
      setInputValue('');
      setEditingIndex(null);
      setIsEditing(false);
    } else {
      // If adding new, create new author with variable
      const newAuthor = { literal: variableKey };
      const newAuthors = [...value, newAuthor];
      onChange(newAuthors);
      setInputValue('');
    }
    
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    onValidate(metadata.name, []);
    
    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing, editingIndex, value, onChange, metadata.name, onValidate]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Show suggestions if there's input and matches
    if (newValue.trim()) {
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  }, []);

  // Get filtered variable suggestions based on input
  const filteredVariables = useMemo(() => {
    if (!inputValue.trim()) return [];
    
    const searchTerm = inputValue.toLowerCase().trim();
    const variables = Object.entries(state.variables);
    
    return variables.filter(([key, value]) => {
      const keyMatches = key.toLowerCase().includes(searchTerm);
      const valueMatches = value.toLowerCase().includes(searchTerm);
      return keyMatches || valueMatches;
    }).map(([key, value]) => ({ key, value }));
  }, [inputValue, state.variables]);

  const handleInputFocus = useCallback(() => {
    if (inputValue.trim() && filteredVariables.length > 0) {
      setShowSuggestions(true);
    }
  }, [inputValue, filteredVariables]);

  const handleInputBlur = useCallback((e: React.FocusEvent) => {
    // Don't hide suggestions if clicking on a suggestion
    if (suggestionsRef.current && suggestionsRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (showSuggestions && filteredVariables.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < filteredVariables.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredVariables.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectVariable(filteredVariables[selectedSuggestionIndex].key);
        } else if (isEditing) {
          handleUpdateAuthor();
        } else {
          handleAddAuthor();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    } else {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isEditing) {
          handleUpdateAuthor();
        } else {
          handleAddAuthor();
        }
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    }
  }, [showSuggestions, filteredVariables, selectedSuggestionIndex, isEditing, handleAddAuthor, handleUpdateAuthor, handleCancelEdit, selectVariable]);

  // Check if input matches a variable
  const isVariableReference = (authorName: string): boolean => {
    return Object.keys(state.variables).includes(authorName.trim());
  };

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedSuggestionIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedSuggestionIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedSuggestionIndex]);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {metadata.label}
        {metadata.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Author list */}
      {value.length > 0 && (
        <div className="mb-3 space-y-2">
          {value.map((author, index) => {
            const displayName = formatAuthorForDisplay(author);
            const isVariable = author.literal && isVariableReference(author.literal);
            
            return (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border"
              >
                <span className={`text-sm ${isVariable ? 'font-mono bg-blue-100 px-1 rounded' : ''}`}>
                  {displayName}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditAuthor(index)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Edit
                  </button>
                  {!isVariable && (
                    <button
                      type="button"
                      onClick={() => handleCreateVariable(index)}
                      className="text-green-600 hover:text-green-800 text-xs"
                      title="Create variable and replace all occurrences"
                    >
                      Variable
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAuthor(index)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Input field with combobox */}
      <div className="relative flex gap-2">
        <div className="relative flex-grow">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={isEditing ? "Edit author name..." : metadata.placeholder || "Enter author name"}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.length > 0 ? 'border-red-500' : ''
            }`}
            autoComplete="off"
          />
          
          {/* Variable suggestions dropdown */}
          {showSuggestions && filteredVariables.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
            >
              {filteredVariables.map((variable, index) => (
                <button
                  key={variable.key}
                  type="button"
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                    index === selectedSuggestionIndex ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => selectVariable(variable.key)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  <div className="font-mono text-sm text-blue-600">{variable.key}</div>
                  <div className="text-xs text-gray-600 truncate">{variable.value}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleUpdateAuthor}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Update
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleAddAuthor}
            className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
          >
            Add
          </button>
        )}
      </div>

      
      {/* Help text and errors */}
      {metadata.helpText && (
        <p className="text-xs text-gray-500 mt-1">{metadata.helpText}</p>
      )}
      
      {errors.length > 0 && (
        <div className="text-red-500 text-xs mt-1">
          {errors.map((error, i) => (
            <div key={i}>{error}</div>
          ))}
        </div>
      )}
    </div>
  );
} 