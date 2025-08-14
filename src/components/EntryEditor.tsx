import { useState, useCallback } from 'react';
import { CSLEntry, CSLAuthor, CSLDate, CSL_FIELD_METADATA, CSL_ENTRY_TYPES } from '../types/cslFieldMetadata';
import { AuthorInputField } from './ui/AuthorInputField';
import { formatAuthors, getYear } from '../utils/cslUtils';
import { CitationsReferencesModal } from './CitationsReferencesModal';
import { getSemanticScholarIdFromEntry } from '../utils/semanticScholarConverter';

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
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);

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

  console.log("EntryEditor", entry);

  const handleSave = useCallback(() => {
    console.log('handleSave', editedEntry);
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

    // Use a simple approach: pass only the core fields we know about, plus preserve custom fields
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

    // Preserve any custom fields that aren't standard CSL fields
    const standardFields = new Set([
      'id', 'type', 'title', 'author', 'editor', 'issued', 'container-title',
      'volume', 'issue', 'page', 'publisher', 'publisher-place', 'DOI', 'note', 'URL',
      'custom' // Preserve custom fields like S2ID and CORPUSID
    ]);
    
    // Always set citation-key to match id to preserve it during BibTeX export/import
    (updates as any)['citation-key'] = editedEntry.id;
    
    Object.keys(editedEntry).forEach(key => {
      if (!standardFields.has(key) && editedEntry[key as keyof CSLEntry] !== undefined) {
        (updates as any)[key] = editedEntry[key as keyof CSLEntry];
      }
    });

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
            {(() => {
              // Check if we have Semantic Scholar ID or DOI for API calls
              const semanticScholarId = getSemanticScholarIdFromEntry(entry);
              const hasDOI = Boolean(entry.DOI);
              const canMakeApiCalls = Boolean(semanticScholarId || hasDOI);
              const disabledReason = !canMakeApiCalls 
                ? "Requires Semantic Scholar ID or DOI for API access" 
                : "";

              return (
                <>
                  <button
                    onClick={() => setShowCitationsModal(true)}
                    disabled={!canMakeApiCalls}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      canMakeApiCalls 
                        ? 'border-blue-300 text-blue-700 hover:bg-blue-50' 
                        : 'border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    title={canMakeApiCalls ? "View papers that cite this work" : disabledReason}
                  >
                    📄 Citations
                  </button>
                  <button
                    onClick={() => setShowReferencesModal(true)}
                    disabled={!canMakeApiCalls}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      canMakeApiCalls 
                        ? 'border-green-300 text-green-700 hover:bg-green-50' 
                        : 'border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    title={canMakeApiCalls ? "View papers cited by this work" : disabledReason}
                  >
                    📚 References
                  </button>
                  <button
                    onClick={() => setShowRecommendationsModal(true)}
                    disabled={!canMakeApiCalls}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      canMakeApiCalls 
                        ? 'border-purple-300 text-purple-700 hover:bg-purple-50' 
                        : 'border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    title={canMakeApiCalls ? "View recommended papers based on this work" : disabledReason}
                  >
                    🎯 Recommendations
                  </button>
                </>
              );
            })()}
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
            
            {/* Custom fields */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semantic Scholar ID (s2id)
              </label>
              <input
                type="text"
                value={getSemanticScholarIdFromEntry(editedEntry) || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 font-mono text-sm cursor-not-allowed"
                placeholder="Auto-extracted from URL"
              />
              <p className="text-xs text-gray-500 mt-1">
                Automatically extracted from Semantic Scholar URL (read-only)
              </p>
            </div>
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

      {/* Citations, References, and Recommendations Modals */}
      {(() => {
        const semanticScholarId = getSemanticScholarIdFromEntry(entry);
        const paperId = semanticScholarId || entry.id; // Use S2 ID or fallback to entry ID
        
        return (
          <>
            <CitationsReferencesModal
              isOpen={showCitationsModal}
              onClose={() => setShowCitationsModal(false)}
              paperId={paperId}
              paperTitle={entry.title || 'Unknown Title'}
              type="citations"
              doi={entry.DOI}
            />
            <CitationsReferencesModal
              isOpen={showReferencesModal}
              onClose={() => setShowReferencesModal(false)}
              paperId={paperId}
              paperTitle={entry.title || 'Unknown Title'}
              type="references"
              doi={entry.DOI}
            />
            <CitationsReferencesModal
              isOpen={showRecommendationsModal}
              onClose={() => setShowRecommendationsModal(false)}
              paperId={paperId}
              paperTitle={entry.title || 'Unknown Title'}
              type="recommendations"
              doi={entry.DOI}
            />
          </>
        );
      })()}
    </div>
  );
} 