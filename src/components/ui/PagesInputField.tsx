import React, { useState, useCallback } from 'react';
import { CSLFieldMetadata } from '../../types/cslFieldMetadata';

interface PagesInputFieldProps {
  value: string;
  onChange: (pages: string) => void;
  metadata: CSLFieldMetadata;
  errors: string[];
  onValidate: (field: string, errors: string[]) => void;
}

export function PagesInputField({ value, onChange, metadata, errors, onValidate }: PagesInputFieldProps) {
  const [inputValue, setInputValue] = useState(value || '');

  // Validate pages format
  const validatePages = (pagesString: string): string[] => {
    const errors: string[] = [];
    
    if (!pagesString.trim()) {
      return errors; // Empty is valid for optional field
    }
    
    const trimmed = pagesString.trim();
    
    // Basic format validation for pages
    // Valid formats: "123", "123-145", "123--145", "123, 456-789"
    const pagePattern = /^(\d+(-{1,2}\d+)?)(,\s*\d+(-{1,2}\d+)?)*$/;
    
    if (!pagePattern.test(trimmed)) {
      errors.push('Invalid page format. Use "123" for single page or "123-145" for page range. Multiple ranges can be separated by commas.');
    }
    
    return errors;
  };

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    
    // Real-time validation
    const validationErrors = validatePages(newValue);
    onValidate(metadata.name, validationErrors);
    
    // Update the parent component
    onChange(newValue);
  }, [onChange, metadata.name, onValidate]);

  const handleBlur = useCallback(() => {
    // Final validation and cleanup on blur
    const trimmed = inputValue.trim();
    
    if (trimmed !== inputValue) {
      setInputValue(trimmed);
      onChange(trimmed);
    }
    
    const validationErrors = validatePages(trimmed);
    onValidate(metadata.name, validationErrors);
  }, [inputValue, onChange, metadata.name, onValidate]);

  // Sync with external value changes
  React.useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {metadata.label}
        {metadata.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={metadata.placeholder || "123-145"}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors.length > 0 ? 'border-red-500' : ''
        }`}
      />
      
      {/* Help text */}
      {metadata.helpText && (
        <p className="text-xs text-gray-500 mt-1">{metadata.helpText}</p>
      )}
      
      <p className="text-xs text-gray-500 mt-1">
        Examples: "123" (single page), "123-145" (page range), "123, 456-789" (multiple ranges)
      </p>
      
      {/* Error messages */}
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