import React, { useState, useCallback, useMemo } from 'react';
import { CSLAuthor, CSLFieldMetadata } from '../../types/cslFieldMetadata';
import { useCitationData } from '../../hooks/useCitation';

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
  const { state } = useCitationData();

  // Format authors for display
  const formatAuthorForDisplay = (author: CSLAuthor): string => {
    if (author.literal) {
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
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
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
  }, [isEditing, handleAddAuthor, handleUpdateAuthor, handleCancelEdit]);

  // Get available variable suggestions
  const availableVariables = useMemo(() => {
    return Object.keys(state.variables);
  }, [state.variables]);

  // Check if input matches a variable
  const isVariableReference = (authorName: string): boolean => {
    return availableVariables.includes(authorName.trim());
  };

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
                  {isVariable && (
                    <span className="ml-2 text-xs text-blue-600">
                      (variable: {state.variables[author.literal!]})
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditAuthor(index)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Edit
                  </button>
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
      
      {/* Input field */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isEditing ? "Edit author name..." : metadata.placeholder || "Enter author name"}
          className={`flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.length > 0 ? 'border-red-500' : ''
          }`}
        />
        
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
      
      {/* Available variables suggestion */}
      {availableVariables.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-600">
            Available variables: {availableVariables.map((varName, index) => (
              <span key={varName}>
                <button
                  type="button"
                  onClick={() => setInputValue(varName)}
                  className="text-blue-600 hover:text-blue-800 font-mono"
                >
                  {varName}
                </button>
                {index < availableVariables.length - 1 && ', '}
              </span>
            ))}
          </p>
        </div>
      )}
      
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