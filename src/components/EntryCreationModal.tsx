import { useState, useCallback, useRef, useEffect } from 'react';
import { CSLEntry, CSLAuthor, CSLDate, CSL_FIELD_METADATA, CSL_ENTRY_TYPES } from '../types/cslFieldMetadata';
import { AuthorInputField } from './ui/AuthorInputField';
import { getYear, createNewEntry } from '../utils/cslUtils';

interface EntryCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEntry: (entry: CSLEntry) => void;
}

export function EntryCreationModal({ isOpen, onClose, onCreateEntry }: EntryCreationModalProps) {
  const [entryData, setEntryData] = useState<CSLEntry>(() => createNewEntry('', 'article-journal'));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const firstTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEntryData(createNewEntry('', 'article-journal'));
      setErrors({});
      // Focus first input after modal animation
      setTimeout(() => {
        // Focus the ID field (which is always an input)
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle ESC key and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleFieldChange = useCallback((fieldName: keyof CSLEntry, value: unknown) => {
    setEntryData((prev: CSLEntry) => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear errors for this field when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: []
      }));
    }
  }, [errors]);

  const handleValidation = useCallback((fieldName: string, fieldErrors: string[]) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldErrors
    }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string[]> = {};
    
    // Validate required ID
    if (!entryData.id.trim()) {
      newErrors.id = ['Citation ID is required'];
    } else if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(entryData.id)) {
      newErrors.id = ['Citation ID must start with a letter and contain only letters, numbers, hyphens, and underscores'];
    }
    
    // Validate title
    if (!entryData.title?.trim()) {
      newErrors.title = ['Title is required'];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    // Create the entry with all filled fields
    const newEntry: CSLEntry = {
      id: entryData.id.trim(),
      type: entryData.type,
      title: entryData.title?.trim() || '',
      author: entryData.author || [],
      editor: entryData.editor || [],
      issued: entryData.issued,
      'container-title': entryData['container-title']?.trim() || undefined,
      volume: entryData.volume?.trim() || undefined,
      issue: entryData.issue?.trim() || undefined,
      page: entryData.page?.trim() || undefined,
      publisher: entryData.publisher?.trim() || undefined,
      'publisher-place': entryData['publisher-place']?.trim() || undefined,
      DOI: entryData.DOI?.trim() || undefined,
      note: entryData.note?.trim() || undefined,
      URL: entryData.URL?.trim() || undefined
    };

    // Remove undefined fields
    Object.keys(newEntry).forEach(key => {
      if (newEntry[key as keyof CSLEntry] === undefined) {
        delete newEntry[key as keyof CSLEntry];
      }
    });

    onCreateEntry(newEntry);
    onClose();
  }, [entryData, onCreateEntry, onClose]);

  const generateIdFromMetadata = useCallback(() => {
    const title = entryData.title?.trim();
    const authors = entryData.author || [];
    const year = getYear(entryData) || new Date().getFullYear().toString();
    
    let id = '';
    
    // Use first author's last name
    if (authors.length > 0 && authors[0].family) {
      id += authors[0].family.toLowerCase().replace(/[^a-z]/g, '');
    } else if (title) {
      // Use first word of title if no author
      const firstWord = title.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
      id += firstWord;
    } else {
      id = 'entry';
    }
    
    // Add year
    id += year;
    
    // Ensure it starts with a letter
    if (!/^[a-zA-Z]/.test(id)) {
      id = 'entry' + id;
    }
    
    handleFieldChange('id', id);
  }, [entryData, handleFieldChange]);

  const renderField = (fieldName: keyof CSLEntry) => {
    const metadata = CSL_FIELD_METADATA[fieldName];
    if (!metadata) return null;

    const value = entryData[fieldName];
    const fieldErrors = errors[fieldName] || [];

    if (fieldName === 'author' || fieldName === 'editor') {
      return (
        <AuthorInputField
          key={fieldName}
          value={(value as CSLAuthor[]) || []}
          onChange={(newValue: CSLAuthor[]) => handleFieldChange(fieldName, newValue)}
          metadata={metadata as any}
          errors={fieldErrors}
          onValidate={(field: string, errs: string[]) => handleValidation(field, errs)}
        />
      );
    }

    if (fieldName === 'issued') {
      const currentYear = value ? getYear({ issued: value as CSLDate }) : '';
      return (
        <div key={fieldName} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {metadata.label}
            {metadata.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={currentYear}
            onChange={(e) => {
              const year = parseInt(e.target.value);
              if (!isNaN(year) && year > 0) {
                handleFieldChange(fieldName, { 'date-parts': [[year]] });
              } else {
                handleFieldChange(fieldName, undefined);
              }
            }}
            placeholder={metadata.placeholder}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.length > 0 ? 'border-red-500' : ''
            }`}
          />
          {metadata.helpText && (
            <p className="text-xs text-gray-500 mt-1">{metadata.helpText}</p>
          )}
          {fieldErrors.length > 0 && (
            <div className="text-red-500 text-xs mt-1">
              {fieldErrors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (fieldName === 'type') {
      return (
        <div key={fieldName} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {metadata.label}
            {metadata.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CSL_ENTRY_TYPES.map((type: string) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {metadata.helpText && (
            <p className="text-xs text-gray-500 mt-1">{metadata.helpText}</p>
          )}
        </div>
      );
    }

    // Regular text/textarea fields
    const isFirstField = fieldName === 'id';
    const isTextarea = metadata.type === 'textarea';
    
    return (
      <div key={fieldName} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {metadata.label}
          {metadata.required && <span className="text-red-500 ml-1">*</span>}
          {fieldName === 'id' && (
            <button
              type="button"
              onClick={generateIdFromMetadata}
              className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Generate from title/author
            </button>
          )}
        </label>
        {isTextarea ? (
          <textarea
            ref={isFirstField ? firstTextareaRef : undefined}
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={metadata.placeholder}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical min-h-[100px] ${
              fieldErrors.length > 0 ? 'border-red-500' : ''
            }`}
            rows={4}
          />
        ) : (
          <input
            ref={isFirstField ? firstInputRef : undefined}
            type="text"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={metadata.placeholder}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.length > 0 ? 'border-red-500' : ''
            }`}
          />
        )}
        {metadata.helpText && (
          <p className="text-xs text-gray-500 mt-1">{metadata.helpText}</p>
        )}
        {fieldErrors.length > 0 && (
          <div className="text-red-500 text-xs mt-1">
            {fieldErrors.map((error, i) => (
              <div key={i}>{error}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex-none px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Create New Entry</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-1">
            {/* Entry Type */}
            {renderField('type')}
            
            {/* Basic Fields */}
            {renderField('id')}
            {renderField('title')}
            {renderField('author')}
            {renderField('issued')}
            
            {/* Publication Details */}
            {renderField('container-title')}
            {renderField('volume')}
            {renderField('issue')}
            {renderField('page')}
            {renderField('publisher')}
            {renderField('publisher-place')}
            
            {/* Additional Fields */}
            {renderField('DOI')}
            {renderField('URL')}
            {renderField('note')}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
