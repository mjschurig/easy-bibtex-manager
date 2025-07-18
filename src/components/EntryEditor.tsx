import { useState, useCallback } from 'react';
import { BibTeXEntry, StringVariables, BIBTEX_TYPES } from '../types/bibtex';

interface EntryEditorProps {
  entry: BibTeXEntry;
  stringVariables: StringVariables;
  onUpdate: (key: string, updates: Partial<BibTeXEntry>) => void;
  onDelete: (key: string) => void;
}

export function EntryEditor({ entry, stringVariables, onUpdate, onDelete }: EntryEditorProps) {
  const [isRawMode, setIsRawMode] = useState(false);
  const [editedFields, setEditedFields] = useState(entry.fields);

  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    setEditedFields(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(entry.key, {
      fields: editedFields
    });
  }, [entry.key, editedFields, onUpdate]);

  const handleDelete = useCallback(() => {
    onDelete(entry.key);
  }, [entry.key, onDelete]);

  const handleTypeChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(entry.key, {
      type: event.target.value
    });
  }, [entry.key, onUpdate]);

  const handleKeyChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(entry.key, {
      key: event.target.value
    });
  }, [entry.key, onUpdate]);

  const getFieldVariable = (fieldValue: string): string | null => {
    if (!fieldValue.includes('#')) {
      const lowerValue = fieldValue.toLowerCase();
      if (stringVariables.hasOwnProperty(lowerValue)) {
        return lowerValue;
      }
    }
    return null;
  };

  if (isRawMode) {
    // Raw mode - show BibTeX source
    const rawBibtex = `@${entry.type}{${entry.key},
${Object.entries(editedFields).map(([key, value]) => `  ${key} = {${value}}`).join(',\n')}
}`;

    return (
      <div className="editor-form">
        <div className="editor-header">
          <h2>
            <span className="entry-type">@{entry.type}</span> {entry.key}
          </h2>
          <div className="button-group">
            <button 
              className="toggle-raw-btn"
              onClick={() => setIsRawMode(false)}
            >
              Form View
            </button>
            <button className="primary" onClick={handleSave}>Save</button>
            <button className="delete-btn" onClick={handleDelete}>Delete</button>
          </div>
        </div>
        
        <div className="editor-content">
          <div className="raw-editor">
            <div className="raw-editor-label">Raw BibTeX:</div>
            <textarea
              value={rawBibtex}
              onChange={() => {}} // TODO: Implement raw editing
              style={{ width: '100%', height: '400px', fontFamily: 'monospace' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-form">
      <div className="editor-header">
        <h2>
          <span className="entry-type">@{entry.type}</span> {entry.key}
        </h2>
        <div className="button-group">
          <button 
            className="toggle-raw-btn"
            onClick={() => setIsRawMode(true)}
          >
            Raw View
          </button>
          <button className="primary" onClick={handleSave}>Save</button>
          <button className="delete-btn" onClick={handleDelete}>Delete</button>
        </div>
      </div>
      
      <div className="editor-content">
        <div className="entry-controls">
          <div>
            <label htmlFor="entry-type-select">Type:</label>
            <select
              id="entry-type-select"
              value={entry.type}
              onChange={handleTypeChange}
            >
              {BIBTEX_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="entry-key-input">Key:</label>
            <input
              id="entry-key-input"
              type="text"
              value={entry.key}
              onChange={handleKeyChange}
            />
          </div>
        </div>

        <div className="form-fields">
          {Object.entries(editedFields).map(([fieldName, fieldValue]) => {
            const variableKey = getFieldVariable(fieldValue);
            
            return (
              <div key={fieldName} className={`field-group ${variableKey ? 'field-group-with-variable' : ''}`}>
                <label htmlFor={`field-${fieldName}`}>{fieldName}</label>
                {variableKey ? (
                  <>
                    <textarea
                      id={`field-${fieldName}`}
                      rows={2}
                      className="field-disabled"
                      value={fieldValue}
                      readOnly
                      title="This field is backed by a string variable"
                    />
                    <button
                      type="button"
                      className="variable-edit-btn"
                      title="Edit the underlying variable"
                    >
                      Edit Variable
                    </button>
                  </>
                ) : (
                  <textarea
                    id={`field-${fieldName}`}
                    rows={2}
                    value={fieldValue}
                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  />
                )}
              </div>
            );
          })}
          
          {Object.keys(editedFields).length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
              No fields defined for this entry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 