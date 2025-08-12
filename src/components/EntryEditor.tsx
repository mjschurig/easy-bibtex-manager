import { useState, useCallback } from 'react';
import { CSLEntry, CSLAuthor, CSLDate, CSL_FIELD_METADATA, CSL_ENTRY_TYPES } from '../types/cslFieldMetadata';
import { AuthorInputField } from './ui/AuthorInputField';
import { formatAuthors, getYear } from '../utils/cslUtils';
import { CitationsReferencesModal } from './CitationsReferencesModal';

interface EntryEditorProps {
  entry: CSLEntry;
  stringVariables: Record<string, string>;
  onUpdate: (id: string, updates: Partial<CSLEntry>) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export function EntryEditor({ entry, stringVariables: _stringVariables, onUpdate, onDelete, onClose }: EntryEditorProps) {
  const [isRawMode, setIsRawMode] = useState(false);
  const [editedEntry, setEditedEntry] = useState<CSLEntry>(() => ({ ...entry }));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [showCitationsModal, setShowCitationsModal] = useState(false);
  const [showReferencesModal, setShowReferencesModal] = useState(false);

  // No manual state management needed - the key prop forces fresh component mount

  const handleFieldChange = useCallback((fieldName: keyof CSLEntry, value: unknown) => {
    setEditedEntry((prev: CSLEntry) => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  const handleValidation = useCallback((fieldName: string, fieldErrors: string[]) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldErrors
    }));
  }, []);

  const handleSave = useCallback(() => {
    // Simple validation - check for required fields
    const hasErrors = Object.values(errors).some(errs => errs.length > 0);
    if (hasErrors) {
      alert('Please fix validation errors before saving.');
      return;
    }

    if (!editedEntry.id.trim()) {
      alert('Citation ID is required.');
      return;
    }

    // Use a simple approach: pass only the core fields we know about
    const updates: Partial<CSLEntry> = {
      id: editedEntry.id,
      type: editedEntry.type,
      title: editedEntry.title,
      author: editedEntry.author,
      editor: editedEntry.editor,
      issued: editedEntry.issued,
      'container-title': editedEntry['container-title'],
      volume: editedEntry.volume,
      issue: editedEntry.issue,
      page: editedEntry.page,
      publisher: editedEntry.publisher,
      'publisher-place': editedEntry['publisher-place'],
      DOI: editedEntry.DOI,
      note: editedEntry.note,
      URL: editedEntry.URL
    };

    // Remove undefined fields
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof CSLEntry] === undefined) {
        delete updates[key as keyof CSLEntry];
      }
    });

    onUpdate(entry.id, updates);
  }, [editedEntry, errors, entry.id, onUpdate]);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Are you sure you want to delete entry "${entry.id}"?`)) {
      onDelete(entry.id);
      onClose?.();
    }
  }, [entry.id, onDelete, onClose]);

  // Extract Semantic Scholar paper ID from the entry (if available)
  const getSemanticScholarId = useCallback(() => {
    // Look for Semantic Scholar ID in various places
    // 1. Check if the entry has a semantic scholar URL
    if (entry.URL?.includes('semanticscholar.org/paper/')) {
      // More flexible regex to match various paper ID formats:
      // - 40-character hex strings (internal IDs)
      // - ArXiv IDs (like 1705.10311, 2010.12345v2)
      // - DOI fragments (like 10.18653/v1/N18-3011)
      // - Other alphanumeric IDs
      const match = entry.URL.match(/\/paper\/([a-f0-9A-F\.\/\-_:]+)/);
      if (match) return match[1];
    }
    
    // 2. Check if there's a semantic scholar ID in the note
    if (entry.note?.includes('semanticscholar.org/paper/')) {
      const match = entry.note.match(/semanticscholar\.org\/paper\/([a-f0-9A-F\.\/\-_:]+)/);
      if (match) return match[1];
    }
    
    // 3. Could also check custom fields if we add them in the future
    return null;
  }, [entry.URL, entry.note]);

  const semanticScholarId = getSemanticScholarId();
  const hasSemanticScholarId = Boolean(semanticScholarId);

  const renderField = (fieldName: keyof CSLEntry) => {
    const metadata = CSL_FIELD_METADATA[fieldName];
    if (!metadata) return null;

    const value = editedEntry[fieldName];
    const fieldErrors = errors[fieldName] || [];

    if (fieldName === 'author' || fieldName === 'editor') {
      return (
        <AuthorInputField
          key={fieldName}
          value={(value as CSLAuthor[]) || []}
          onChange={(newValue: CSLAuthor[]) => handleFieldChange(fieldName, newValue)}
          metadata={metadata as any} // TODO: Update AuthorInputField to accept CSLFieldMetadata
          errors={fieldErrors}
          onValidate={(field: string, errs: string[]) => handleValidation(field, errs)}
        />
      );
    }

    if (fieldName === 'page') {
      // Handle pages as simple text field for CSL-JSON
      return (
        <div key={fieldName} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {metadata.label}
            {metadata.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
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

    if (fieldName === 'issued') {
      // Handle date field specially
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
        </div>
      );
    }

    // Regular text/textarea fields
    const InputComponent = metadata.type === 'textarea' ? 'textarea' : 'input';
    
    return (
      <div key={fieldName} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {metadata.label}
          {metadata.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <InputComponent
          type={metadata.type === 'textarea' ? undefined : 'text'}
          value={(value as string) || ''}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          placeholder={metadata.placeholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            fieldErrors.length > 0 ? 'border-red-500' : ''
          } ${metadata.type === 'textarea' ? 'resize-vertical min-h-[100px]' : ''}`}
          rows={metadata.type === 'textarea' ? 4 : undefined}
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
  };

  const generateRawBibTeX = (): string => {
    const containerTitle = editedEntry['container-title'] || '';
    const pages = editedEntry.page || '';
    const year = getYear(editedEntry);
    const authors = formatAuthors(editedEntry.author || []);
    
    return `@${editedEntry.type}{${editedEntry.id},
  title = {${editedEntry.title || ''}},
  author = {${authors}},
  year = {${year}},
  journal = {${containerTitle}},
  volume = {${editedEntry.volume || ''}},
  pages = {${pages}}
}`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Entry</h2>
            <p className="text-sm text-gray-600 mt-1">
              ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{entry.id}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {hasSemanticScholarId && (
              <>
                <button
                  onClick={() => setShowCitationsModal(true)}
                  className="px-3 py-2 text-sm border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50"
                  title="View papers that cite this work"
                >
                  📄 Citations
                </button>
                <button
                  onClick={() => setShowReferencesModal(true)}
                  className="px-3 py-2 text-sm border border-green-300 text-green-700 rounded-md hover:bg-green-50"
                  title="View papers cited by this work"
                >
                  📚 References
                </button>
              </>
            )}
            <button
              onClick={() => setIsRawMode(!isRawMode)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {isRawMode ? 'Form Mode' : 'Raw Mode'}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto px-6 py-4">
        {isRawMode ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Edit the raw BibTeX entry. Be careful with the syntax.
            </p>
            <textarea
              value={generateRawBibTeX()}
              onChange={() => {}}
              className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="Raw BibTeX content..."
              readOnly
            />
            <p className="text-xs text-gray-500 mt-2">
              Raw editing not fully implemented yet. Use form mode for editing.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl">
            {/* ID field */}
            {renderField('id')}
            
            {/* Type field */}
            {renderField('type')}
            
            {/* Title field */}
            {renderField('title')}
            
            {/* Author field */}
            {renderField('author')}
            
            {/* Editor field */}
            {renderField('editor')}
            
            {/* Date field */}
            {renderField('issued')}
            
            {/* Container title (journal/book) */}
            {renderField('container-title')}
            
            {/* Volume/Issue */}
            {renderField('volume')}
            {renderField('issue')}
            
            {/* Pages */}
            {renderField('page')}
            
            {/* Publisher info */}
            {renderField('publisher')}
            {renderField('publisher-place')}
            
            {/* Additional fields */}
            {renderField('DOI')}
            {renderField('note')}
            {renderField('URL')}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-none px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-end gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Citations and References Modals */}
      {hasSemanticScholarId && semanticScholarId && (
        <>
          <CitationsReferencesModal
            isOpen={showCitationsModal}
            onClose={() => setShowCitationsModal(false)}
            paperId={semanticScholarId}
            paperTitle={entry.title || 'Unknown Title'}
            type="citations"
          />
          <CitationsReferencesModal
            isOpen={showReferencesModal}
            onClose={() => setShowReferencesModal(false)}
            paperId={semanticScholarId}
            paperTitle={entry.title || 'Unknown Title'}
            type="references"
          />
        </>
      )}
    </div>
  );
} 